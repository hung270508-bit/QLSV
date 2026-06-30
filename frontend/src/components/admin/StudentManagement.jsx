import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

import { Users, Plus, Edit, Trash2, Search, X, Filter, XCircle, Eye, Download, Upload, FileText, Calendar, CheckCircle, GraduationCap, Mail, Phone, Award, TrendingUp, AlertCircle, BookOpen, BarChart3, UserCheck, Clock, MapPin , Camera} from 'lucide-react';

import axios from 'axios';

import { TableSkeleton } from '../common/AdminSkeleton';

import ModalPortal, { Toast, ConfirmDialog, SuccessDialog, ErrorDialog } from '../common/ModalPortal';

import Pagination from '../common/Pagination';

import API_URL from '../../api';



const API_BASE = `${API_URL}/api`;

function StudentManagement() {

  const [students, setStudents] = useState([]);

  const [teachers, setTeachers] = useState([]);

  const [classes, setClasses] = useState([]);

  const [faculties, setFaculties] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);

  const [editingStudent, setEditingStudent] = useState(null);

  const [selectedFaculty, setSelectedFaculty] = useState('');

  const [searchTerm, setSearchTerm] = useState('');

  const [displaySearchTerm, setDisplaySearchTerm] = useState('');

  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({

    facultyFilter: '',

    statusFilter: ''

  });

  const [displayFilters, setDisplayFilters] = useState({

    facultyFilter: '',

    statusFilter: ''

  });

  const [showDetailModal, setShowDetailModal] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState(null);

  const [studentDetails, setStudentDetails] = useState(null);

  const [studentTranscript, setStudentTranscript] = useState(null);

  const [studentSchedule, setStudentSchedule] = useState([]);

  const [studentAttendance, setStudentAttendance] = useState([]);

  const [detailTab, setDetailTab] = useState('info');
  const [detailLoading, setDetailLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState({
    MSSV: '',
    HoTen: '',
    NgaySinh: '',
    GioiTinh: '',
    Email: '',
    SoDienThoai: '',
    MaLop: '',
    TrangThai: 'Đang học',
    startYear: '',
    endYear: '',
    UID: ''
  });

  const [errors, setErrors] = useState({});

  const getAvatarColor = (name) => {
    if (!name) return 'bg-gray-100 text-gray-700 border-gray-200';
    const colors = [
      'bg-red-100 text-red-700 border-red-200',
      'bg-blue-100 text-blue-700 border-blue-200',
      'bg-green-100 text-green-700 border-green-200',
      'bg-purple-100 text-purple-700 border-purple-200',
      'bg-pink-100 text-pink-700 border-pink-200',
      'bg-indigo-100 text-indigo-700 border-indigo-200',
      'bg-teal-100 text-teal-700 border-teal-200',
      'bg-orange-100 text-orange-700 border-orange-200',
      'bg-cyan-100 text-cyan-700 border-cyan-200',
      'bg-emerald-100 text-emerald-700 border-emerald-200',
    ];
    const charCode = name.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const [confirmDialog, setConfirmDialog] = useState({ show: false, message: '', onConfirm: null });

  const [successDialog, setSuccessDialog] = useState({ show: false, message: '' });

  const [errorDialog, setErrorDialog] = useState({ show: false, message: '' });



  const [isPollingUid, setIsPollingUid] = useState(false);
  const pollRef = useRef(null);
  const timeoutRef = useRef(null);

  const handleGetUidFromServer = async (studentMssv) => {
    if (!studentMssv) {
        setToast({ show: true, message: 'Vui lòng chọn lớp để tạo MSSV trước khi lấy mã thẻ!', type: 'error' });
        return;
    }
    try {
        setIsPollingUid(true);

        // Xóa bớt bộ đếm cũ nếu có trước khi chạy bộ đếm mới
        if (pollRef.current) clearInterval(pollRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        // --- ĐÃ SỬA: Truyền kèm dữ liệu mssv lên Backend ---
        await axios.post(`${API_BASE}/rfid/activate-register`, { mssv: studentMssv });

        let isDone = false;
        
        // Gán vòng lặp polling vào pollRef
        pollRef.current = setInterval(async () => {
            try {
                const res = await axios.get(`${API_BASE}/rfid/status`);
                const data = res.data;

                if (data.mode === 'REGISTER_DONE') {
                    if (!data.targetMSSV || data.targetMSSV === studentMssv) {
                        isDone = true;
                        setFormData(prev => ({ ...prev, UID: data.capturedUid }));
                        
                        // Dọn dẹp khi thành công
                        clearInterval(pollRef.current);
                        if (timeoutRef.current) clearTimeout(timeoutRef.current);
                        setIsPollingUid(false);
                        
                        await axios.post(`${API_BASE}/rfid/reset-status`);
                        setToast({ show: true, message: 'Đã lấy mã thẻ thành công!', type: 'success' });
                    }
                } else if (data.mode === 'REGISTER' && data.capturedUid === 'ERROR:DUPLICATE') {
                    // Web hiển thị lỗi trùng thẻ và reset lại trạng thái chờ để quẹt thẻ khác
                    setToast({ show: true, message: 'UID đã được sử dụng bởi người khác!', type: 'error' });
                    await axios.post(`${API_BASE}/rfid/activate-register`, { mssv: studentMssv });
                }
            } catch (error) {
                console.error("Lỗi poll:", error);
            }
        }, 1500);

        // Gán bộ đếm thời gian 60s vào timeoutRef
        timeoutRef.current = setTimeout(async () => {
            if (!isDone) {
                clearInterval(pollRef.current);
                setIsPollingUid(false);
                await axios.post(`${API_BASE}/rfid/reset-status`).catch(() => {});
                setToast({ show: true, message: 'Hết thời gian chờ quẹt thẻ.', type: 'error' });
            }
        }, 60000);

    } catch (error) {
        console.error('Lỗi khi gọi activate-register:', error);
        setToast({ show: true, message: 'Không thể đăng ký thẻ!', type: 'error' });
        setIsPollingUid(false);
    }
};

  // Vietnamese diacritic removal for search

  const removeVietnameseTones = useCallback((str) => {

    return str

      .normalize('NFD')

      .replace(/[\u0300-\u036f]/g, '')

      .replace(/đ/g, 'd')

      .replace(/Đ/g, 'D');

  }, []);



  // Capitalize first letter of each word for Vietnamese names

  const capitalizeVietnameseName = useCallback((str) => {

    if (!str) return '';

    return str

      .toLowerCase()

      .split(' ')

      .map(word => {

        if (word.length === 0) return '';

        return word.charAt(0).toUpperCase() + word.slice(1);

      })

      .join(' ');

  }, []);



  // Debounced search

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');



  useEffect(() => {

    const timer = setTimeout(() => {

      setDebouncedSearchTerm(searchTerm);

      setCurrentPage(1);

    }, 300);

    return () => clearTimeout(timer);

  }, [searchTerm]);



  const fetchData = async () => {
    try {
      const [studentsRes, classesRes, facultiesRes, teachersRes] = await Promise.all([
        axios.get(`${API_BASE}/students`),
        axios.get(`${API_BASE}/classes`),
        axios.get(`${API_BASE}/faculties`),
        axios.get(`${API_BASE}/teachers`)
      ]);
      setStudents(studentsRes.data);
      setClasses(classesRes.data);
      setFaculties(facultiesRes.data);
      setTeachers(teachersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Tự động cập nhật danh sách sinh viên mỗi 3 giây để thấy ảnh đại diện mới
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${API_BASE}/students`);
        setStudents(res.data);
      } catch (error) {
        console.error('Error auto-updating students:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);


  const handleFacultyChange = (e) => {

    const facultyId = e.target.value;

    setSelectedFaculty(facultyId);

    setFormData(prev => ({ ...prev, MaLop: '', MSSV: '' }));

    if (errors.selectedFaculty) setErrors(prev => ({ ...prev, selectedFaculty: '' }));

  };



  const handleStartYearChange = (e) => {

    const value = e.target.value;

    if (/^\d*$/.test(value)) {

      const startYearInt = parseInt(value, 10);

      const endYear = !isNaN(startYearInt) && value.length === 4 ? (startYearInt + 4).toString() : '';



      setFormData(prev => ({ ...prev, startYear: value, endYear: endYear }));

      if (errors.startYear) setErrors(prev => ({ ...prev, startYear: '' }));

    }

  };



  const handleEndYearChange = (e) => {

    const value = e.target.value;

    if (/^\d*$/.test(value)) {

      setFormData(prev => ({ ...prev, endYear: value }));

      if (errors.endYear) setErrors(prev => ({ ...prev, endYear: '' }));

    }

  };



  const handleLopChange = async (e) => {

    const maLop = e.target.value;



    // 1. NẾU ĐANG SỬA: Chỉ đổi lớp, TUYỆT ĐỐI KHÔNG xóa MSSV

    if (editingStudent) {

      setFormData(prev => ({ ...prev, MaLop: maLop }));

      return;

    }



    // 2. NẾU THÊM MỚI: Tạm xóa MSSV cũ để tạo mã mới theo lớp

    setFormData(prev => ({ ...prev, MaLop: maLop, MSSV: '' }));



    if (!maLop) return;



    try {

      const res = await axios.get(`${API_URL}/api/students/next-code/${maLop}`);

      setFormData(prev => ({ ...prev, MaLop: maLop, MSSV: res.data.MSSV }));

    } catch (err) {

      console.error('Lỗi tạo MSSV:', err);

    }

  };



  const validateForm = () => {

    const newErrors = {};



    // Validate Họ tên

    if (!formData.HoTen.trim()) {

      newErrors.HoTen = 'Họ tên không được để trống';

    } else if (formData.HoTen.length < 2) {

      newErrors.HoTen = 'Họ tên phải có ít nhất 2 ký tự';

    } else if (formData.HoTen.length > 50) {

      newErrors.HoTen = 'Họ tên không được vượt quá 50 ký tự';

    } else {

      // Validate Họ tên chỉ được chứa chữ cái và khoảng trắng

      const nameRegex = /^[a-zA-ZÀ-Ỹà-ỹ\s]+$/;

      if (!nameRegex.test(formData.HoTen)) {

        newErrors.HoTen = 'Họ tên chỉ được chứa chữ cái và khoảng trắng';

      }

    }



    // Validate Ngày sinh

    if (!formData.NgaySinh) {

      newErrors.NgaySinh = 'Ngày sinh không được để trống';

    } else {

      const birthDate = new Date(formData.NgaySinh);

      const today = new Date();

      if (isNaN(birthDate.getTime())) {

        newErrors.NgaySinh = 'Ngày sinh không hợp lệ';

      } else {

        const age = today.getFullYear() - birthDate.getFullYear();

        if (age < 18) {

          newErrors.NgaySinh = 'Ngày sinh không hợp lệ (sinh viên phải từ 18 tuổi trở lên)';

        } else if (age > 100) {

          newErrors.NgaySinh = 'Ngày sinh không hợp lệ';

        }

      }

    }



    // Validate Giới tính

    if (!formData.GioiTinh) {

      newErrors.GioiTinh = 'Vui lòng chọn giới tính';

    }



    // Validate Email

    if (!formData.Email.trim()) {

      newErrors.Email = 'Email không được để trống';

    } else {

      const emailRegex = /^[a-zA-Z0-9]+@gmail\.com$/i;

      if (!emailRegex.test(formData.Email)) {

        newErrors.Email = 'Email không đúng định dạng';

      } else if (formData.Email.length > 100) {

        newErrors.Email = 'Email không được vượt quá 100 ký tự';

      } else {
        // Validate trùng email với sinh viên
        const duplicateEmail = students.find(
          student => student.Email === formData.Email &&
                     (!editingStudent || student.MSSV !== editingStudent.MSSV)
        );
        if (duplicateEmail) {
          newErrors.Email = 'Email đã tồn tại trong hệ thống';
        } else {
          // Validate trùng email với giảng viên
          const duplicateEmailTeacher = teachers.find(
            teacher => teacher.Email === formData.Email
          );
          if (duplicateEmailTeacher) {
            newErrors.Email = 'Email đã tồn tại trong hệ thống (đã được giảng viên sử dụng)';
          }
        }

      }

    }



    // Validate Số điện thoại

    if (!formData.SoDienThoai.trim()) {

      newErrors.SoDienThoai = 'Số điện thoại không được để trống';

    } else {

      // Check for spaces

      if (formData.SoDienThoai.includes(' ')) {

        newErrors.SoDienThoai = 'Số điện thoại không được chứa khoảng trắng';

      } else {

        // Remove non-digit characters for length check

        const digitsOnly = formData.SoDienThoai.replace(/\D/g, '');



        if (digitsOnly.length < 10) {

          newErrors.SoDienThoai = 'Số điện thoại phải có ít nhất 10 chữ số';

        } else if (digitsOnly.length > 10) {

          newErrors.SoDienThoai = 'Số điện thoại không được vượt quá 10 chữ số';

        } else {

          const phoneRegex = /^(0[3-9]|\+84[3-9])[0-9]{8}$/;

          if (!phoneRegex.test(formData.SoDienThoai)) {

            newErrors.SoDienThoai = 'Số điện thoại không đúng định dạng (bắt đầu bằng 0 hoặc +84)';

          } else {

            // Validate trùng số điện thoại với giảng viên

            const duplicatePhoneTeacher = teachers.find(

              teacher => teacher.SoDienThoai === formData.SoDienThoai

            );

            if (duplicatePhoneTeacher) {

              newErrors.SoDienThoai = 'Số điện thoại đã tồn tại trong hệ thống (đã được giảng viên sử dụng)';

            }

          }

        }

      }

    }



    // Validate MSSV (chỉ khi thêm mới)

    if (!editingStudent && formData.MSSV) {

      if (!/^[A-Z0-9]+$/.test(formData.MSSV)) {

        newErrors.MSSV = 'MSSV chỉ được chứa chữ cái hoa và số';

      } else if (formData.MSSV.length > 20) {

        newErrors.MSSV = 'MSSV không được vượt quá 20 ký tự';

      }

    }



    // Validate Khoa

    if (!selectedFaculty) {

      newErrors.selectedFaculty = 'Vui lòng chọn khoa';

    }



    // Validate startYear

    if (!formData.startYear.trim()) {

      newErrors.startYear = 'Năm bắt đầu không được để trống';

    } else if (formData.startYear.length !== 4) {

      newErrors.startYear = 'Năm bắt đầu phải có 4 chữ số';

    } else {

      const startYearInt = parseInt(formData.startYear, 10);

      const currentYear = new Date().getFullYear();

      const minYear = currentYear - 3;

      const maxYear = currentYear + 4;



      if (isNaN(startYearInt) || startYearInt <= 0) {

        newErrors.startYear = 'Năm bắt đầu phải là số dương';

      } else if (startYearInt < minYear) {

        newErrors.startYear = `Năm bắt đầu phải từ ${minYear} trở đi`;

      } else if (startYearInt > maxYear) {

        newErrors.startYear = `Năm bắt đầu không được lớn hơn ${maxYear}`;

      }

    }







    // Validate Lớp

    if (!formData.MaLop) {

      newErrors.MaLop = 'Vui lòng chọn lớp';

    }



    // Validate TrangThai

    if (formData.TrangThai) {

      const validTrangThai = ['Đang học', 'Học lại', 'Nghỉ học'];

      if (!validTrangThai.includes(formData.TrangThai)) {

        newErrors.TrangThai = 'Trạng thái không hợp lệ';

      }

    }



    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;

  };





  
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, Avatar: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!validateForm()) return;



    // Combine startYear and endYear into NienKhoa

    const nienKhoa = `${formData.startYear}-${formData.endYear}`;



    // Capitalize the name before saving

    const formDataWithCapitalizedName = {

      ...formData,

      HoTen: capitalizeVietnameseName(formData.HoTen),

      NienKhoa: nienKhoa

    };



    if (editingStudent) {

      setConfirmDialog({

        show: true,

        message: `Bạn có chắc chắn muốn cập nhật thông tin sinh viên "${formDataWithCapitalizedName.HoTen}" (${formData.MSSV}) không?`,

        onConfirm: async () => {

          try {

            await axios.put(`${API_BASE}/students/${editingStudent.MSSV}`, formDataWithCapitalizedName);

            setToast({ show: true, message: 'Cập nhật sinh viên thành công!', type: 'success' });

            fetchData();

            handleCloseModal();

          } catch (error) {

            console.error('Error saving student:', error);

            setErrorDialog({ show: true, message: error.response?.data?.message || 'Lỗi khi lưu sinh viên!' });

          }

        }

      });

    } else {

      setConfirmDialog({

        show: true,

        message: `Bạn có chắc chắn muốn thêm sinh viên "${formDataWithCapitalizedName.HoTen}" không?`,

        onConfirm: async () => {

          try {

            await axios.post(`${API_BASE}/students`, formDataWithCapitalizedName);

            setToast({ show: true, message: 'Thêm sinh viên mới thành công!', type: 'success' });

            fetchData();

            handleCloseModal();

          } catch (error) {

            console.error('Error saving student:', error);

            setErrorDialog({ show: true, message: error.response?.data?.message || 'Lỗi khi lưu sinh viên!' });

          }

        }

      });

    }

  };



  const handleEdit = (student) => {

    setEditingStudent(student);

    const years = student.NienKhoa ? student.NienKhoa.split('-') : ['', ''];

    setFormData({
      MSSV: student.MSSV,
      HoTen: student.HoTen,
      NgaySinh: student.NgaySinh ? student.NgaySinh.split('T')[0] : '',
      GioiTinh: student.GioiTinh || 'Nam',
      Email: student.Email || '',
      SoDienThoai: student.SoDienThoai || '',
      MaLop: student.MaLop || '',
      TrangThai: student.TrangThai || 'Đang học',
      startYear: years[0] || '',
      endYear: years[1] || '',
      UID: student.UID || '',
      Avatar: student.Avatar || ''
    });

    setSelectedFaculty(student.MaKhoa || '');

    setShowModal(true);

  };





  const handleCloseModal = () => {
    // DỌN DẸP BỘ ĐẾM VÀ RESET MẠCH KHI BẤM HỦY/ĐÓNG 
    if (pollRef.current) clearInterval(pollRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsPollingUid(false);
    axios.post(`${API_BASE}/rfid/reset-status`).catch(err => console.log("Lỗi reset status:", err));
 
    setShowModal(false);
    setEditingStudent(null);
    setFormData({
        MSSV: '',
        HoTen: '',
        NgaySinh: '',
        GioiTinh: '',
        Email: '',
        SoDienThoai: '',
        MaLop: '',
        TrangThai: 'Đang học',
        startYear: '',
        endYear: '',
        UID: ''
    });
    setSelectedFaculty('');
    setErrors({});
};

  const handleClearUID = async () => {
    if (!formData.UID) return;
    if (editingStudent && formData.MSSV) {
      try {
        await axios.put(`${API_BASE}/students/${formData.MSSV}/clear-uid`);
        setFormData({ ...formData, UID: '' });
        setToast({ show: true, message: 'Xóa mã thẻ thành công!', type: 'success' });
        fetchData();
      } catch (error) {
        console.error('Error clearing UID:', error);
        setErrorDialog({ show: true, message: error.response?.data?.message || 'Lỗi khi xóa mã thẻ!' });
      }
    } else {
      setFormData({ ...formData, UID: '' });
    }
  };





  const handleViewDetails = async (student) => {
    setSelectedStudent(student);
    setShowDetailModal(true);
    setDetailTab('info');
    setDetailLoading(true);

    try {
      const [detailsRes, transcriptRes, scheduleRes, attendanceRes] = await Promise.allSettled([
        axios.get(`${API_BASE}/students/${student.MSSV}/details`),
        axios.get(`${API_BASE}/academic/transcript/${student.MSSV}`),
        axios.get(`${API_BASE}/students/${student.MSSV}/schedule`),
        axios.get(`${API_BASE}/attendance/student/${student.MSSV}`)
      ]);

      setStudentDetails(detailsRes.status === 'fulfilled' ? (detailsRes.value.data[0] || null) : null);
      setStudentTranscript(transcriptRes.status === 'fulfilled' ? transcriptRes.value.data : null);
      setStudentSchedule(scheduleRes.status === 'fulfilled' && Array.isArray(scheduleRes.value.data) ? scheduleRes.value.data : []);
      setStudentAttendance(attendanceRes.status === 'fulfilled' && Array.isArray(attendanceRes.value.data) ? attendanceRes.value.data : []);
    } catch (error) {
      console.error('Error fetching student details:', error);
    } finally {
      setDetailLoading(false);
    }
  };



  const handleCloseDetailModal = () => {

    setShowDetailModal(false);

    setSelectedStudent(null);

    setStudentDetails(null);

    setStudentTranscript(null);

    setStudentSchedule([]);

    setStudentAttendance([]);

    setDetailTab('info');

  };



  const handleExportStudents = () => {

    const csvContent = [

      ['MSSV', 'Họ tên', 'Ngày sinh', 'Giới tính', 'Email', 'SĐT', 'Lớp'],

      ...filteredStudents.map(s => [

        s.MSSV,

        s.HoTen,

        s.NgaySinh ? s.NgaySinh.split('T')[0] : '',

        s.GioiTinh,

        s.Email,

        s.SoDienThoai,

        s.TenLop || ''

      ])

    ].map(row => row.join(',')).join('\n');



    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');

    link.href = URL.createObjectURL(blob);

    link.download = 'sinhVien.csv';

    link.click();

  };



  const filteredClassesForForm = useMemo(() => {

    if (!selectedFaculty || !formData.startYear || !formData.endYear) return [];

    const nienKhoa = `${formData.startYear}-${formData.endYear}`;

    return classes.filter(cls =>

      cls.MaKhoa === selectedFaculty &&

      cls.NienKhoa === nienKhoa

    );

  }, [classes, selectedFaculty, formData.startYear, formData.endYear]);



  const filteredStudents = students.filter(student => {
    if (debouncedSearchTerm.length > 0 && debouncedSearchTerm.trim() === '') return false;

    const searchLower = debouncedSearchTerm.toLowerCase();

    const searchNoTones = removeVietnameseTones(searchLower);

    const nameLower = student.HoTen?.toLowerCase() || '';

    const nameNoTones = removeVietnameseTones(nameLower);

    const idLower = student.MSSV?.toLowerCase() || '';

    const emailLower = student.Email?.toLowerCase() || '';



    const matchesSearch =

      nameLower.includes(searchLower) ||

      nameNoTones.includes(searchNoTones) ||

      idLower.includes(searchLower) ||

      emailLower.includes(searchLower);



    const matchesFaculty = !filters.facultyFilter || student.MaKhoa === filters.facultyFilter;

    const matchesStatus = !filters.statusFilter || student.TrangThai === filters.statusFilter;



    return matchesSearch && matchesFaculty && matchesStatus;

  });



  const handleSearch = () => {

    setSearchTerm(displaySearchTerm);

    setCurrentPage(1);

  };



  const handleClearSearch = () => {

    setSearchTerm('');

    setDisplaySearchTerm('');

    setCurrentPage(1);

  };



  const handleApplyFilters = () => {

    setFilters({ ...displayFilters });

    setShowFilters(false);

    setCurrentPage(1);

  };



  const clearFilters = () => {

    setFilters({ facultyFilter: '', statusFilter: '' });

    setDisplayFilters({ facultyFilter: '', statusFilter: '' });

    setSearchTerm('');

    setDisplaySearchTerm('');

    setCurrentPage(1);

  };



  // Pagination calculations
  const itemsPerPage = 10;

  const indexOfLastItem = currentPage * itemsPerPage;

  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const currentItems = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);



  const activeFilterCount = (filters.facultyFilter ? 1 : 0) + (filters.statusFilter ? 1 : 0) + (searchTerm ? 1 : 0);

  const hasActiveFilters = filters.facultyFilter || filters.statusFilter || searchTerm;



  if (loading) {

    return <TableSkeleton columns={5} rows={7} />;

  }



  return (

    <div className="space-y-8">

      {/* Toast Notification */}

      <Toast 

        show={toast.show} 

        message={toast.message} 

        type={toast.type} 

        onClose={() => setToast({ ...toast, show: false })} 

      />



      {/* Header Section */}

      <motion.div

        initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}

        className="bg-[#F4C542] rounded-3xl p-8 shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6"

      >

        <div className="flex items-center gap-5 relative z-10">

          <div className="p-4 bg-white/40 rounded-2xl backdrop-blur-sm">

            <Users className="w-10 h-10 text-[#152238]" />

          </div>

          <div>

            <h2 className="text-3xl font-bold text-[#152238] mb-1">

              Quản lý sinh viên

            </h2>

            <p className="text-[#152238]/70 text-lg">Thêm, sửa, xóa và xem chi tiết thông tin sinh viên</p>

          </div>

        </div>

        <div className="flex gap-3 relative z-10">

          <motion.button

            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}

            whileTap={{ scale: 0.95 }}

            onClick={handleExportStudents}

            className="flex items-center gap-2 bg-[#FFFFFF] text-[#F4C542] px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"

          >

            <Download className="w-5 h-5" />

            Export

          </motion.button>

          <motion.button

            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}

            whileTap={{ scale: 0.95 }}

            onClick={() => setShowModal(true)}

            className="flex items-center gap-2 bg-[#FFFFFF] text-[#F4C542] px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"

          >

            <Plus className="w-5 h-5" />

            Thêm sinh viên

          </motion.button>

        </div>

        <Users className="absolute -right-6 -bottom-6 w-48 h-48 text-white opacity-10 transform rotate-12" />

      </motion.div>



      {/* Search and Filters */}

      <div className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-[#E5E7EB] p-4">

        <div className="flex flex-col md:flex-row gap-4">

          <div className="relative flex-1">

            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-300 w-5 h-5" />

            <input

              type="text"

              placeholder="Tìm kiếm sinh viên theo tên, MSSV hoặc email..."

              value={searchTerm}

              onChange={(e) => setSearchTerm(e.target.value)}

              onKeyDown={(e) => e.key === 'Escape' && handleClearSearch()}

              className="w-full pl-11 pr-10 py-2.5 bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#F4C542] focus:ring-2 focus:ring-[#F4C542]/20 transition-all text-gray-700 placeholder:font-semibold"

            />

            {searchTerm && (

              <button

                onClick={handleClearSearch}

                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-[#6B7280] transition-colors"

              >

                <X className="w-5 h-5" />

              </button>

            )}

          </div>

          <div className="flex gap-3">

            <motion.button

              whileHover={{ scale: 1.02 }}

              whileTap={{ scale: 0.98 }}

              onClick={() => setShowFilters(!showFilters)}

              className={`relative flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${

                hasActiveFilters 

                  ? 'bg-[#F4C542] text-[#152238] shadow-lg shadow-amber-500/30' 

                  : 'bg-[#F4C542]/20 text-[#B45309] border border-[#FFF7D6] hover:bg-[#FFF7D6]'

              }`}

            >

              <Filter className="w-4 h-4" />

              Bộ lọc

              {activeFilterCount > 0 && (

                <span className="absolute -top-1 -right-1 bg-[#EF4444]/100 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">

                  {activeFilterCount}

                </span>

              )}

            </motion.button>

            {hasActiveFilters && (

              <motion.button

                whileHover={{ scale: 1.02 }}

                whileTap={{ scale: 0.98 }}

                onClick={clearFilters}

                className="px-5 py-2.5 bg-red-100 text-[#DC2626] rounded-xl font-medium hover:bg-red-200 transition-colors flex items-center gap-2 border border-red-200"

              >

                <XCircle className="w-4 h-4" />

                Xóa lọc

              </motion.button>

            )}

          </div>

        </div>



        {showFilters && (

          <motion.div

            initial={{ opacity: 0, height: 0 }}

            animate={{ opacity: 1, height: 'auto' }}

            exit={{ opacity: 0, height: 0 }}

            className="bg-[#FFF7D6]/50 border border-[#FFF7D6] rounded-xl p-4 mt-4 space-y-4 relative z-10 w-full"

          >

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>

                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Lọc theo khoa</label>

                <select

                  value={displayFilters.facultyFilter}

                  onChange={(e) => setDisplayFilters({ ...displayFilters, facultyFilter: e.target.value })}

                  className="w-full px-4 py-3 bg-[#FFFFFF] border-2 border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#F4C542] transition-colors text-gray-700"

                >

                  <option value="">Tất cả khoa</option>

                  {faculties.map((faculty) => (

                    <option key={faculty.MaKhoa} value={faculty.MaKhoa}>

                      {faculty.TenKhoa}

                    </option>

                  ))}

                </select>

              </div>

              <div>

                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Lọc theo trạng thái</label>

                <select

                  value={displayFilters.statusFilter}

                  onChange={(e) => setDisplayFilters({ ...displayFilters, statusFilter: e.target.value })}

                  className="w-full px-4 py-3 bg-[#FFFFFF] border-2 border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#F4C542] transition-colors text-gray-700"

                >

                  <option value="">Tất cả trạng thái</option>

                  <option value="Đang học">Đang học</option>

                  <option value="Học lại">Học lại</option>

                  <option value="Nghỉ học">Nghỉ học</option>

                </select>

              </div>

            </div>

            <div className="flex gap-3 pt-2">

              <motion.button

                whileHover={{ scale: 1.01 }}

                whileTap={{ scale: 0.99 }}

                onClick={handleApplyFilters}

                className="flex-1 bg-[#F4C542] text-[#152238] py-2.5 rounded-xl font-semibold hover:bg-[#F4C542]/90 transition-colors shadow-sm"

              >

                Áp dụng bộ lọc

              </motion.button>

              <motion.button

                whileHover={{ scale: 1.01 }}

                whileTap={{ scale: 0.99 }}

                onClick={() => setDisplayFilters({ facultyFilter: '', statusFilter: '' })}

                className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-300 transition-colors"

              >

                Đặt lại

              </motion.button>

            </div>

          </motion.div>

        )}

      </div>



      {/* Table */}

      <div className="bg-[#FFFFFF] rounded-2xl shadow-xl border border-[#FFF7D6] overflow-hidden">
        
        {/* Mobile View */}
        <div className="block sm:hidden divide-y divide-amber-50">
          {currentItems.length > 0 ? (
            currentItems.map((student, index) => (
              <div key={student.MSSV} className="p-4 hover:bg-[#FFF7D6]/20 transition-colors cursor-pointer" onClick={() => handleViewDetails(student)}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold overflow-hidden shrink-0 border ${student.Avatar ? 'bg-gray-100 border-gray-200' : getAvatarColor(student.HoTen)}`}>
                      {student.Avatar ? (
                        <img src={student.Avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        student.HoTen?.charAt(0).toUpperCase() || 'S'
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1F2937] text-sm">{capitalizeVietnameseName(student.HoTen)}</h4>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{student.MSSV}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${student.TrangThai === 'Đang học' ? 'bg-[#22C55E]/10 text-green-700' : student.TrangThai === 'Học lại' ? 'bg-yellow-50 text-yellow-700' : 'bg-[#EF4444]/10 text-red-700'}`}>{student.TrangThai || 'Đang học'}</span>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">{student.TenKhoa || 'N/A'}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">{student.TenLop || 'N/A'}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${student.GioiTinh === 'Nam' ? 'bg-[#3B82F6]/10 text-blue-700' : student.GioiTinh === 'Nữ' ? 'bg-pink-50 text-pink-700' : 'bg-[#F7F8FA] text-gray-700'}`}>{student.GioiTinh || 'N/A'}</span>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex flex-col min-w-0">
                    <span className="truncate max-w-[180px]">{student.Email || 'N/A'}</span>
                    <span className="mt-0.5">{student.SoDienThoai || 'N/A'}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(student); }} className="p-2.5 bg-[#F4C542]/20 text-[#B45309] rounded-xl hover:bg-amber-200 transition-all shrink-0">
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm">Không tìm thấy sinh viên nào</div>
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">

            <thead className="bg-gradient-to-r from-amber-50 to-amber-100">

              <tr>

                <th className="text-left py-5 px-6 text-sm font-bold text-[#152238] uppercase tracking-wider">Sinh viên</th>

                <th className="text-left py-5 px-6 text-sm font-bold text-[#152238] uppercase tracking-wider">Khoa / Lớp</th>

                <th className="text-left py-5 px-6 text-sm font-bold text-[#152238] uppercase tracking-wider">Giới tính</th>

                <th className="text-left py-5 px-6 text-sm font-bold text-[#152238] uppercase tracking-wider">Liên hệ</th>

                <th className="text-left py-5 px-6 text-sm font-bold text-[#152238] uppercase tracking-wider">Trạng thái</th>

                <th className="text-center py-5 px-6 text-sm font-bold text-[#152238] uppercase tracking-wider">Thao tác</th>

              </tr>

            </thead>

            <tbody>

              {currentItems.length > 0 ? (

                currentItems.map((student, index) => (

                  <motion.tr

                    key={student.MSSV}

                    initial={{ opacity: 0, x: -20 }}

                    animate={{ opacity: 1, x: 0 }}

                    transition={{ delay: index * 0.05 }}

                    className="border-b border-amber-50 hover:bg-[#FFF7D6]/20 transition-colors cursor-pointer"

                    onClick={() => handleViewDetails(student)}

                  >

                    <td className="py-5 px-6">

                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold overflow-hidden shrink-0 border ${student.Avatar ? 'bg-gray-100 border-gray-200' : getAvatarColor(student.HoTen)}`}>
                          {student.Avatar ? (
                            <img src={student.Avatar} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            student.HoTen?.charAt(0).toUpperCase() || 'S'
                          )}
                        </div>
                        <div className="flex flex-col">

                          <span className="font-semibold text-[#1F2937] text-sm whitespace-nowrap">{capitalizeVietnameseName(student.HoTen)}</span>

                          <span className="text-xs text-gray-300 font-mono mt-0.5 whitespace-nowrap">{student.MSSV}</span>

                        </div>
                      </div>

                    </td>

                    <td className="py-5 px-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-[#B45309] mb-0.5">{student.TenKhoa || 'N/A'}</span>
                        <span className="text-sm text-gray-700 font-medium">{student.TenLop || 'N/A'}</span>
                      </div>
                    </td>

                    <td className="py-5 px-6">

                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${student.GioiTinh === 'Nam'

                        ? 'bg-[#3B82F6]/10 text-blue-700 border border-blue-200'

                        : 'bg-pink-50 text-pink-700 border border-pink-200'

                        }`}>

                        {student.GioiTinh || 'N/A'}

                      </span>

                    </td>

                    <td className="py-5 px-6">

                      <div className="flex flex-col text-xs">

                        <span className="text-gray-700 whitespace-nowrap max-w-[180px] truncate" title={student.Email}>{student.Email || 'N/A'}</span>

                        <span className="text-gray-300 whitespace-nowrap mt-0.5">{student.SoDienThoai || 'N/A'}</span>

                      </div>

                    </td>

                    <td className="py-5 px-6">

                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${student.TrangThai === 'Đang học'

                        ? 'bg-[#22C55E]/10 text-green-700 border border-green-200'

                        : student.TrangThai === 'Học lại'

                          ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'

                          : 'bg-[#EF4444]/10 text-red-700 border border-red-200'

                        }`}>

                        {student.TrangThai || 'Đang học'}

                      </span>

                    </td>

                    <td className="py-5 px-6">

                      <div className="flex items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>

                        <motion.button

                          whileHover={{ scale: 1.1 }}

                          whileTap={{ scale: 0.9 }}

                          onClick={() => handleEdit(student)}

                          className="p-3 bg-[#F4C542]/20 text-[#B45309] rounded-xl hover:bg-amber-200 transition-all shadow-sm"

                          title="Chỉnh sửa"

                        >

                          <Edit className="w-4 h-4" />

                        </motion.button>

                      </div>

                    </td>

                  </motion.tr>

                ))

              ) : (

                <tr>

                  <td colSpan="6" className="py-16">

                    <div className="flex flex-col items-center justify-center text-gray-300">

                      <Users className="w-16 h-16 mb-4 text-gray-300" />

                      <p className="text-lg font-medium">Không tìm thấy sinh viên nào</p>

                      <p className="text-sm mt-2">Thử tìm kiếm với từ khóa khác</p>

                    </div>

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

        

        <Pagination 

          currentPage={currentPage}

          totalPages={totalPages}

          onPageChange={setCurrentPage}

        />

      </div>



      {/* Modal Add/Edit Form */}

      {showModal && (

        <ModalPortal>

          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/40 backdrop-blur-sm">

            <motion.div

              initial={{ opacity: 0, scale: 0.92 }}

              animate={{ opacity: 1, scale: 1 }}

              className="bg-[#FFFFFF] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"

            >

              <div className="bg-[#F4C542] px-6 py-5 flex justify-between items-center flex-shrink-0">

                <div className="text-white">

                  <h3 className="text-xl font-bold flex items-center gap-2">

                    <GraduationCap className="w-5 h-5" />

                    {editingStudent ? 'Cập nhật sinh viên' : 'Thêm sinh viên mới'}

                  </h3>

                  <p className="text-[#152238]/70 text-sm mt-0.5">

                    {editingStudent ? 'Chỉnh sửa hồ sơ sinh viên' : 'Tạo hồ sơ sinh viên và gán lớp'}

                  </p>

                </div>

                <button onClick={handleCloseModal} className="p-2 hover:bg-white/40 rounded-lg text-white">

                  <X className="w-5 h-5" />

                </button>

              </div>



              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto" noValidate>

                <input type="hidden" value={formData.MSSV} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Avatar Upload */}
                  <div className="md:col-span-2 flex flex-col items-center justify-center mb-4">
                    <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-upload').click()}>
                      {formData.Avatar ? (
                        <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-[#F4C542]/20 relative">
                          <img src={formData.Avatar} alt="Avatar" className="w-full h-full rounded-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
                            <Camera className="w-8 h-8 text-gray-500" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-4 border-[#F4C542]/20">
                          <Camera className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <input type="file" id="avatar-upload" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                    <p className="text-xs text-gray-500 mt-2">Ảnh đại diện (tuỳ chọn)</p>
                  </div>

                  {/* Ô MSSV - Chỉ hiển thị khi sửa */}
                  {editingStudent && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Mã số sinh viên</label>
                      <input
                        type="text"
                        value={formData.MSSV}
                        readOnly
                        disabled
                        className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-xl focus:outline-none transition-colors cursor-not-allowed"
                      />
                    </div>
                  )}

                  {/* Ô Họ tên */}

                  <div className="md:col-span-2">

                    <label className="block text-sm font-semibold text-gray-700 mb-2">Họ tên</label>

                    <input

                      type="text"

                      value={formData.HoTen}

                      onChange={(e) => {

                        setFormData({ ...formData, HoTen: e.target.value });

                        if (errors.HoTen) setErrors({ ...errors, HoTen: '' });

                      }}

                      className={`w-full px-4 py-3 bg-[#F7F8FA] border-2 rounded-xl focus:outline-none transition-colors ${errors.HoTen ? 'border-red-500 focus:border-red-500' : 'border-[#E5E7EB] focus:border-[#F4C542]'

                        }`}

                    />

                    {errors.HoTen && <p className="text-[#EF4444] text-sm mt-1">{errors.HoTen}</p>}

                  </div>



                  <div>

                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ngày sinh</label>

                    <input

                      type="date"

                      value={formData.NgaySinh}

                      onChange={(e) => {

                        setFormData({ ...formData, NgaySinh: e.target.value });

                        if (errors.NgaySinh) setErrors({ ...errors, NgaySinh: '' });

                      }}

                      className={`w-full px-4 py-3 bg-[#F7F8FA] border-2 rounded-xl focus:outline-none transition-colors ${errors.NgaySinh ? 'border-red-500 focus:border-red-500' : 'border-[#E5E7EB] focus:border-[#F4C542]'

                        }`}

                    />

                    {errors.NgaySinh && <p className="text-[#EF4444] text-sm mt-1">{errors.NgaySinh}</p>}

                  </div>

                  <div>

                    <label className="block text-sm font-semibold text-gray-700 mb-2">Giới tính</label>

                    <select

                      value={formData.GioiTinh}

                      onChange={(e) => {

                        setFormData({ ...formData, GioiTinh: e.target.value });

                        if (errors.GioiTinh) setErrors({ ...errors, GioiTinh: '' });

                      }}

                      className={`w-full px-4 py-3 bg-[#F7F8FA] border-2 rounded-xl focus:outline-none transition-colors ${

                        errors.GioiTinh ? 'border-red-500 focus:border-red-500' : 'border-[#E5E7EB] focus:border-[#F4C542]'

                      }`}

                    >

                      <option value="">Chọn giới tính</option>

                      <option value="Nam">Nam</option>

                      <option value="Nữ">Nữ</option>

                    </select>

                    {errors.GioiTinh && <p className="text-[#EF4444] text-sm mt-1">{errors.GioiTinh}</p>}

                  </div>

                  <div>

                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>

                    <input

                      type="email"

                      value={formData.Email}

                      onChange={(e) => {

                        setFormData({ ...formData, Email: e.target.value });

                        if (errors.Email) setErrors({ ...errors, Email: '' });

                      }}

                      className={`w-full px-4 py-3 bg-[#F7F8FA] border-2 rounded-xl focus:outline-none transition-colors ${errors.Email ? 'border-red-500 focus:border-red-500' : 'border-[#E5E7EB] focus:border-[#F4C542]'

                        }`}

                    />

                    {errors.Email && <p className="text-[#EF4444] text-sm mt-1">{errors.Email}</p>}

                  </div>

                  <div>

                    <label className="block text-sm font-semibold text-gray-700 mb-2">Số điện thoại</label>

                    <input

                      type="text"

                      value={formData.SoDienThoai}

                      onChange={(e) => {

                        setFormData({ ...formData, SoDienThoai: e.target.value });

                        if (errors.SoDienThoai) setErrors({ ...errors, SoDienThoai: '' });

                      }}

                      className={`w-full px-4 py-3 bg-[#F7F8FA] border-2 rounded-xl focus:outline-none transition-colors ${errors.SoDienThoai ? 'border-red-500 focus:border-red-500' : 'border-[#E5E7EB] focus:border-[#F4C542]'

                        }`}

                    />

                    {errors.SoDienThoai && <p className="text-[#EF4444] text-sm mt-1">{errors.SoDienThoai}</p>}

                  </div>

                  <div className="md:col-span-2">

                    <label className="block text-sm font-semibold text-gray-700 mb-2">Niên khóa</label>

                    <div className="flex gap-3">

                      <div className="flex-1">

                        <input

                          type="text"

                          value={formData.startYear}

                          onChange={handleStartYearChange}

                          disabled={!!editingStudent}

                          placeholder="Năm bắt đầu"

                          className={`w-full px-4 py-3 bg-[#F7F8FA] border-2 rounded-xl focus:outline-none transition-colors ${errors.startYear ? 'border-red-500 focus:border-red-500' : 'border-[#E5E7EB] focus:border-[#F4C542]'} ${editingStudent ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}

                          maxLength={4}

                        />

                        {errors.startYear && (

                          <p className="text-[#EF4444] text-xs mt-1 font-medium">{errors.startYear}</p>

                        )}

                      </div>

                      <span className="flex items-center text-[#6B7280] font-semibold">-</span>

                      <div className="flex-1">

                        <input

                          type="text"

                          value={formData.endYear}

                          disabled

                          placeholder="Năm kết thúc"

                          className="w-full px-4 py-3 bg-gray-100 border-2 border-[#E5E7EB] rounded-xl text-gray-300 cursor-not-allowed focus:outline-none"

                          maxLength={4}

                        />

                        {errors.endYear && (

                          <p className="text-[#EF4444] text-xs mt-1 font-medium">{errors.endYear}</p>

                        )}

                      </div>

                    </div>

                  </div>

                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div>

                      <label className="block text-sm font-semibold text-gray-700 mb-2">Khoa</label>

                      <select

                        value={selectedFaculty}

                        onChange={handleFacultyChange}

                        className={`w-full px-4 py-3 bg-[#F7F8FA] border-2 rounded-xl focus:outline-none transition-colors ${errors.selectedFaculty ? 'border-red-500 focus:border-red-500' : 'border-[#E5E7EB] focus:border-[#F4C542]'

                          }`}

                      >

                        <option value="">Chọn khoa</option>

                        {faculties.map((f) => (

                          <option key={f.MaKhoa} value={f.MaKhoa}>

                            {f.TenKhoa}

                          </option>

                        ))}

                      </select>

                      {errors.selectedFaculty && <p className="text-[#EF4444] text-xs mt-1">{errors.selectedFaculty}</p>}

                    </div>

                    <div>

                      <label className="block text-sm font-semibold text-gray-700 mb-2">Lớp</label>

                      <select

                        value={formData.MaLop}

                        onChange={(e) => {

                          handleLopChange(e); // Gọi hàm tự động sinh MSSV

                          if (errors.MaLop) setErrors({ ...errors, MaLop: '' }); // Giữ nguyên tính năng xóa viền đỏ

                        }}

                        disabled={!selectedFaculty || !formData.startYear || !formData.endYear}

                        className={`w-full px-4 py-3 bg-[#F7F8FA] border-2 rounded-xl focus:outline-none transition-colors disabled:opacity-50 ${errors.MaLop ? 'border-red-500 focus:border-red-500' : 'border-[#E5E7EB] focus:border-[#F4C542]'

                          }`}

                      >

                        <option value="">Chọn lớp</option>

                        {filteredClassesForForm.map((cls) => (

                          <option key={cls.MaLop} value={cls.MaLop}>

                            {cls.TenLop}

                          </option>

                        ))}

                      </select>

                      {errors.MaLop && <p className="text-[#EF4444] text-sm mt-1">{errors.MaLop}</p>}

                    </div>

                  </div>

                  {editingStudent && (

                    <div className="md:col-span-2">

                      <label className="block text-sm font-semibold text-gray-700 mb-2">Trạng thái</label>

                      <select

                        value={formData.TrangThai}

                        onChange={(e) => setFormData({ ...formData, TrangThai: e.target.value })}

                        className="w-full px-4 py-3 bg-[#F7F8FA] border-2 border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#F4C542] transition-colors"

                      >

                        <option value="Đang học">Đang học</option>

                        <option value="Học lại">Học lại</option>

                        <option value="Nghỉ học">Nghỉ học</option>

                      </select>

                    </div>

                  )}

                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mã thẻ UID</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      placeholder="Chưa có mã thẻ"
                      value={formData.UID || ''}
                      className="flex-1 px-4 py-3 bg-gray-100 border-2 border-[#E5E7EB] rounded-xl text-gray-700 focus:outline-none"
                    />
                    {formData.UID && (
                      <button
                        type="button"
                        onClick={handleClearUID}
                        className="px-4 py-3 bg-[#EF4444]/100 hover:bg-red-600 text-white font-semibold rounded-xl shadow-md transition-colors"
                        title="Xóa mã"
                      >
                        Xóa mã
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleGetUidFromServer(formData.MSSV)}
                      disabled={isPollingUid}
                      className={`px-6 py-3 font-semibold rounded-xl text-white transition-colors ${
                        isPollingUid 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-[#3B82F6]/100 hover:bg-blue-600 shadow-md'
                      }`}
                    >
                      {isPollingUid ? 'Đang chờ quẹt thẻ...' : 'Lấy mã UID'}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">

                  <button

                    type="button"

                    onClick={handleCloseModal}

                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200"

                  >

                    Hủy

                  </button>

                  <button

                    type="submit"

                    className="flex-1 py-3 bg-[#F4C542] text-[#152238] font-semibold rounded-xl shadow-lg"

                  >

                    {editingStudent ? 'Lưu thay đổi' : 'Thêm sinh viên'}

                  </button>

                </div>

              </form>

            </motion.div>

          </div>

        </ModalPortal>

      )}



      {/* Detail Modal */}

      {showDetailModal && selectedStudent && (

        <ModalPortal>

          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/40">

            <motion.div

              initial={{ opacity: 0, scale: 0.92, y: 20 }}

              animate={{ opacity: 1, scale: 1, y: 0 }}

              exit={{ opacity: 0, scale: 0.92, y: 20 }}

              transition={{ type: 'spring', stiffness: 300, damping: 30 }}

              className="bg-[#FFFFFF] rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col"

            >

              {/* Header */}

              <div className="bg-[#F4C542] px-8 py-6 flex-shrink-0">

                <div className="flex items-start justify-between">

                  <div className="flex items-center gap-4">

                    {(studentDetails?.Avatar || selectedStudent.Avatar) ? (
                      <img 
                        src={studentDetails?.Avatar || selectedStudent.Avatar} 
                        alt="Avatar" 
                        className="w-16 h-16 rounded-2xl object-cover shadow-lg flex-shrink-0 border border-white/20"
                      />
                    ) : (
                      <div className="bg-[#FFFFFF]/10 backdrop-blur-md text-white border border-white/20 font-bold text-xl rounded-2xl w-16 h-16 flex items-center justify-center shadow-lg flex-shrink-0">
                        {(studentDetails?.HoTen || selectedStudent.HoTen || 'SV')
                          .split(' ')
                          .map(w => w[0])
                          .filter(Boolean)
                          .slice(-2)
                          .join('')
                          .toUpperCase()}
                      </div>
                    )}

                    <div>

                      <span className="text-[#152238]/70 text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5">

                        <GraduationCap className="w-4 h-4" />

                        Chi tiết sinh viên

                      </span>

                      <h2 className="text-2xl font-bold text-[#152238] mt-1">{capitalizeVietnameseName(studentDetails?.HoTen || selectedStudent.HoTen)}</h2>

                      <div className="flex flex-wrap items-center gap-2 mt-2">

                        <span className="bg-[#FFFFFF]/30 text-[#152238] text-xs px-2.5 py-1 rounded-full font-mono font-medium">{studentDetails?.MSSV || selectedStudent.MSSV}</span>

                        {studentDetails?.TenLop && (

                          <span className="bg-[#FFFFFF]/30 text-[#152238] text-xs px-2.5 py-1 rounded-full font-medium">{studentDetails.TenLop}</span>

                        )}

                        {studentDetails?.TenKhoa && (

                          <span className="bg-[#FFFFFF]/30 text-[#152238] text-xs px-2.5 py-1 rounded-full font-medium">{studentDetails.TenKhoa}</span>

                        )}

                      </div>

                    </div>

                  </div>

                  <motion.button

                    whileHover={{ scale: 1.1, rotate: 90 }}

                    whileTap={{ scale: 0.9 }}

                    onClick={handleCloseDetailModal}

                    className="bg-[#FFFFFF]/30 hover:bg-[#FFFFFF]/50 rounded-xl p-2 transition-colors"

                  >

                    <X className="w-5 h-5 text-[#152238]" />

                  </motion.button>

                </div>



                {/* Tabs */}

                <div className="flex gap-1 mt-5">

                  {[

                    { id: 'info', label: 'Thông tin', icon: Users },

                    { id: 'transcript', label: 'Bảng điểm', icon: FileText },

                    { id: 'schedule', label: 'Lịch học', icon: Calendar },

                    { id: 'attendance', label: 'Điểm danh', icon: CheckCircle },

                  ].map(tab => {

                    const Icon = tab.icon;

                    return (

                      <button

                        key={tab.id}

                        onClick={() => setDetailTab(tab.id)}

                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${detailTab === tab.id

                          ? 'bg-[#FFFFFF] text-[#F4C542] shadow-md'

                          : 'text-[#152238]/70 hover:text-[#152238] hover:bg-[#FFFFFF]/20'

                          }`}

                      >

                        <Icon className="w-4 h-4" />

                        {tab.label}

                      </button>

                    );

                  })}

                </div>

              </div>



              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {detailLoading ? (
                  <div className="flex flex-col items-center justify-center h-64 text-[#152238]/50">
                    <div className="w-8 h-8 border-4 border-[#F4C542] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="font-medium">Đang tải dữ liệu chi tiết...</p>
                  </div>
                ) : (
                  <>
                    {detailTab === 'info' && studentDetails && (

                  <div className="space-y-6">

                    {/* Stats cards */}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                      {[

                        { label: 'Tín chỉ', value: studentTranscript?.summary?.totalCredits || 0, icon: BookOpen, color: 'blue' },

                        { label: 'GPA', value: studentTranscript?.summary?.cumulativeGPA || 0, icon: Award, color: 'green' },

                        { label: 'Tỷ lệ qua', value: `${studentTranscript?.summary?.passRate || 0}%`, icon: TrendingUp, color: 'purple' },

                        { label: 'Số môn', value: studentTranscript?.transcript?.length || 0, icon: BarChart3, color: 'amber' },

                      ].map((card, i) => {

                        const Icon = card.icon;

                        const colorMap = {

                          blue: 'bg-[#3B82F6]/10 text-[#3B82F6] border-blue-100 hover:border-blue-300 hover:bg-blue-100/30',

                          green: 'bg-[#22C55E]/10 text-[#22C55E] border-green-100 hover:border-green-300 hover:bg-[#22C55E]/20/30',

                          purple: 'bg-purple-50 text-purple-600 border-purple-100 hover:border-purple-300 hover:bg-purple-100/30',

                          amber: 'bg-[#F4C542]/20 text-[#B45309] border-[#FFF7D6] hover:border-amber-300 hover:bg-[#FFF7D6]/30',

                        };

                        return (

                          <motion.div

                            key={i}

                            initial={{ opacity: 0, y: 16 }}

                            animate={{ opacity: 1, y: 0 }}

                            transition={{ delay: i * 0.07 }}

                            whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(0,0,0,0.04)' }}

                            className={`rounded-2xl border-2 p-5 ${colorMap[card.color]} transition-all duration-300`}

                          >

                            <div className="flex justify-between items-start">

                              <div className="text-3xl font-bold font-mono tracking-tight">{card.value}</div>

                              <div className="p-2 bg-[#FFFFFF] rounded-xl shadow-sm">

                                <Icon className="w-5 h-5 opacity-90" />

                              </div>

                            </div>

                            <div className="text-sm font-semibold opacity-70 mt-3 uppercase tracking-wider">{card.label}</div>

                          </motion.div>

                        );

                      })}

                    </div>



                    {/* Personal info */}

                    <div>

                      <h4 className="text-sm font-bold text-[#6B7280] uppercase tracking-wider mb-3">Thông tin cá nhân</h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                        {[

                          { label: 'MSSV', value: studentDetails.MSSV, icon: GraduationCap },

                          { label: 'Họ tên', value: studentDetails.HoTen, icon: Users },

                          { label: 'Ngày sinh', value: studentDetails.NgaySinh ? studentDetails.NgaySinh.split('T')[0] : '', icon: Calendar },

                          { label: 'Giới tính', value: studentDetails.GioiTinh, icon: UserCheck },

                          { label: 'Email', value: studentDetails.Email, icon: Mail },

                          { label: 'SĐT', value: studentDetails.SoDienThoai, icon: Phone },

                        ].map((item, i) => (

                          <motion.div

                            key={i}

                            initial={{ opacity: 0, y: 10 }}

                            animate={{ opacity: 1, y: 0 }}

                            transition={{ delay: i * 0.05 }}

                            whileHover={{ y: -2, boxShadow: '0 8px 30px rgb(0 0 0 / 0.04)', borderColor: 'rgb(254 215 170)' }}

                            className="flex items-center gap-4 bg-[#F7F8FA] border border-[#E5E7EB] rounded-2xl p-4 transition-all duration-300"

                          >

                            {item.icon && (

                              <div className="bg-[#FFF7D6] rounded-xl p-2.5 text-[#F4C542] flex-shrink-0">

                                <item.icon className="w-5 h-5" />

                              </div>

                            )}

                            <div className="flex-1 min-w-0">

                              <div className="text-xs text-gray-300 font-semibold uppercase tracking-wider">{item.label}</div>

                              <div className="font-semibold text-[#1F2937] text-sm mt-0.5 truncate" title={item.value || ''}>

                                {item.value || '—'}

                              </div>

                            </div>

                          </motion.div>

                        ))}

                      </div>

                    </div>

                  </div>

                )}



                {detailTab === 'transcript' && studentTranscript && (

                  <div className="space-y-6">

                    {studentTranscript.summary && (

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                        {[

                          { label: 'Tổng tín chỉ', value: studentTranscript.summary.totalCredits, icon: BookOpen, color: 'blue' },

                          { label: 'Tín chỉ qua', value: studentTranscript.summary.passedCredits, icon: CheckCircle, color: 'green' },

                          { label: 'GPA tích lũy', value: studentTranscript.summary.cumulativeGPA, icon: Award, color: 'purple' },

                          { label: 'Tỷ lệ qua', value: `${studentTranscript.summary.passRate}%`, icon: TrendingUp, color: 'amber' },

                        ].map((card, i) => {

                          const Icon = card.icon;

                          const colorMap = {

                            blue: 'bg-[#3B82F6]/10 text-[#3B82F6] border-blue-100 hover:border-blue-300 hover:bg-blue-100/30',

                            green: 'bg-[#22C55E]/10 text-[#22C55E] border-green-100 hover:border-green-300 hover:bg-[#22C55E]/20/30',

                            purple: 'bg-purple-50 text-purple-600 border-purple-100 hover:border-purple-300 hover:bg-purple-100/30',

                            amber: 'bg-[#F4C542]/20 text-[#B45309] border-[#FFF7D6] hover:border-amber-300 hover:bg-[#FFF7D6]/30',

                          };

                          return (

                            <motion.div

                              key={i}

                              initial={{ opacity: 0, y: 16 }}

                              animate={{ opacity: 1, y: 0 }}

                              transition={{ delay: i * 0.07 }}

                              whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(0,0,0,0.04)' }}

                              className={`rounded-2xl border-2 p-5 ${colorMap[card.color]} transition-all duration-300`}

                            >

                              <div className="flex justify-between items-start">

                                <div className="text-3xl font-bold font-mono tracking-tight">{card.value}</div>

                                <div className="p-2 bg-[#FFFFFF] rounded-xl shadow-sm">

                                  <Icon className="w-5 h-5 opacity-90" />

                                </div>

                              </div>

                              <div className="text-sm font-semibold opacity-70 mt-3 uppercase tracking-wider">{card.label}</div>

                            </motion.div>

                          );

                        })}

                      </div>

                    )}

                    <div className="overflow-x-auto rounded-2xl border border-[#FFF7D6]">

                      <table className="w-full">

                        <thead>

                          <tr className="bg-gradient-to-r from-amber-50 to-amber-100">

                            <th className="text-left py-3.5 px-5 text-xs font-bold text-[#152238] uppercase tracking-wider">Môn học</th>

                            <th className="text-left py-3.5 px-5 text-xs font-bold text-[#152238] uppercase tracking-wider">Học kỳ</th>

                            <th className="text-left py-3.5 px-5 text-xs font-bold text-[#152238] uppercase tracking-wider">QT</th>

                            <th className="text-left py-3.5 px-5 text-xs font-bold text-[#152238] uppercase tracking-wider">GK</th>

                            <th className="text-left py-3.5 px-5 text-xs font-bold text-[#152238] uppercase tracking-wider">CK</th>

                            <th className="text-left py-3.5 px-5 text-xs font-bold text-[#152238] uppercase tracking-wider">TB</th>

                            <th className="text-left py-3.5 px-5 text-xs font-bold text-[#152238] uppercase tracking-wider">Điểm chữ</th>

                          </tr>

                        </thead>

                        <tbody>

                          {studentTranscript.transcript && studentTranscript.transcript.map((grade, index) => (

                            <motion.tr

                              key={index}

                              initial={{ opacity: 0 }}

                              animate={{ opacity: 1 }}

                              transition={{ delay: index * 0.03 }}

                              className="border-t border-gray-50 hover:bg-[#FFF7D6]/40 transition-colors"

                            >

                              <td className="py-3.5 px-5 font-semibold text-[#1F2937] text-sm">{grade.TenMonHoc}</td>

                              <td className="py-3.5 px-5 text-sm text-[#6B7280]">{grade.HocKy}</td>

                              <td className="py-3.5 px-5 text-sm text-[#6B7280]">{grade.DiemQuaTrinh || '-'}</td>

                              <td className="py-3.5 px-5 text-sm text-[#6B7280]">{grade.DiemGiuaKy || '-'}</td>

                              <td className="py-3.5 px-5 text-sm text-[#6B7280]">{grade.DiemCuoiKy || '-'}</td>

                              <td className="py-3.5 px-5 text-sm font-bold text-[#F4C542]">{grade.DiemTB}</td>

                              <td className="py-3.5 px-5 text-sm font-semibold text-[#1F2937]">{grade.DiemChu}</td>

                            </motion.tr>

                          ))}

                        </tbody>

                      </table>

                    </div>

                  </div>

                )}



                {detailTab === 'schedule' && (

                  <ScheduleDetailView

                    schedule={studentSchedule}

                    title="Lịch học sinh viên"

                    showTeacher

                    showHocKy

                  />

                )}



                {detailTab === 'attendance' && (

                  <div>

                    <h4 className="text-sm font-bold text-[#6B7280] uppercase tracking-wider mb-4">

                      Lịch điểm danh ({studentAttendance.length} buổi)

                    </h4>

                    {studentAttendance.length > 0 ? (

                      <div className="overflow-x-auto rounded-2xl border border-[#FFF7D6]">

                        <table className="w-full">

                          <thead>

                            <tr className="bg-gradient-to-r from-amber-50 to-amber-100">

                              <th className="text-left py-3.5 px-5 text-xs font-bold text-[#152238] uppercase tracking-wider">Ngày</th>

                              <th className="text-left py-3.5 px-5 text-xs font-bold text-[#152238] uppercase tracking-wider">Phòng</th>

                              <th className="text-left py-3.5 px-5 text-xs font-bold text-[#152238] uppercase tracking-wider">Trạng thái</th>

                            </tr>

                          </thead>

                          <tbody>

                            {studentAttendance.map((att, index) => (

                              <motion.tr

                                key={index}

                                initial={{ opacity: 0, x: -20 }}

                                animate={{ opacity: 1, x: 0 }}

                                transition={{ delay: index * 0.05 }}

                                className="border-t border-gray-50 hover:bg-[#FFF7D6]/40 transition-colors"

                              >

                                <td className="py-3.5 px-5 text-sm text-[#1F2937]">

                                  {new Date(att.NgayDiemDanh).toLocaleDateString('vi-VN')}

                                </td>

                                <td className="py-3.5 px-5 text-sm text-[#6B7280]">{att.PhongHoc}</td>

                                <td className="py-3.5 px-5">

                                  <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${att.TrangThai === 'Có mặt' ? 'bg-[#22C55E]/20 text-green-700' :

                                    att.TrangThai === 'Vắng mặt' ? 'bg-[#EF4444]/20 text-red-700' :

                                      'bg-yellow-100 text-yellow-700'

                                    }`}>

                                    {att.TrangThai}

                                  </span>

                                </td>

                              </motion.tr>

                            ))}

                          </tbody>

                        </table>

                      </div>

                    ) : (

                      <div className="flex flex-col items-center justify-center py-16 text-gray-300">

                        <CheckCircle className="w-14 h-14 mb-3 text-gray-200" />

                        <p className="font-medium">Chưa có dữ liệu điểm danh</p>

                      </div>

                    )}

                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>

          </div>

        </ModalPortal>

      )}





      {/* Centralized Notification Components */}

      <Toast

        show={toast.show}

        message={toast.message}

        type={toast.type}

        onClose={() => setToast({ show: false, message: '', type: 'success' })}

      />

      <ConfirmDialog

        show={confirmDialog.show}

        message={confirmDialog.message}

        onConfirm={() => {

          if (confirmDialog.onConfirm) {

            confirmDialog.onConfirm();

          }

          setConfirmDialog({ show: false, message: '', onConfirm: null });

        }}

        onCancel={() => setConfirmDialog({ show: false, message: '', onConfirm: null })}

      />

      <SuccessDialog

        show={successDialog.show}

        message={successDialog.message}

        onClose={() => setSuccessDialog({ show: false, message: '' })}

      />

      <ErrorDialog

        show={errorDialog.show}

        message={errorDialog.message}

        onClose={() => setErrorDialog({ show: false, message: '' })}

      />

    </div>

  );

}



const SCHEDULE_DAY_ORDER = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

const SCHEDULE_DAY_NAMES = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

const SCHEDULE_CA_SLOTS = {

  '1': { label: 'Ca 1', time: 'Tiết 1–3', color: 'bg-[#F4C542]/20 text-[#B45309]' },

  '2': { label: 'Ca 2', time: 'Tiết 4–6', color: 'bg-amber-100 text-amber-700' },

  '3': { label: 'Ca 3', time: 'Tiết 7–9', color: 'bg-amber-200 text-[#F4C542]' },

  '4': { label: 'Ca 4', time: 'Tiết 10–12', color: 'bg-amber-200 text-amber-800' },

};



function scheduleDayOfWeek(dateString) {

  if (!dateString) return '';

  const d = new Date(dateString);

  if (Number.isNaN(d.getTime())) return '';

  return SCHEDULE_DAY_NAMES[d.getDay()];

}



function scheduleFormatDate(dateString) {

  if (!dateString) return '';

  const d = new Date(dateString);

  if (Number.isNaN(d.getTime())) return '';

  return d.toLocaleDateString('vi-VN');

}



function scheduleCaSlot(ca) {

  return SCHEDULE_CA_SLOTS[String(ca)] || { label: `Ca ${ca}`, time: '', color: 'bg-gray-100 text-gray-700' };

}



function enrichScheduleItem(item) {

  const thu = scheduleDayOfWeek(item?.NgayHoc);

  return {

    ...item,

    Thu: thu,

    NgayFormatted: scheduleFormatDate(item?.NgayHoc),

  };

}



function groupScheduleByDay(items) {

  const sorted = [...items].sort((a, b) => {

    const ta = a.NgayHoc ? new Date(a.NgayHoc).getTime() : 0;

    const tb = b.NgayHoc ? new Date(b.NgayHoc).getTime() : 0;

    if (ta !== tb) return ta - tb;

    return Number(a.CaHoc) - Number(b.CaHoc);

  }).map(enrichScheduleItem);



  const buckets = Object.fromEntries(SCHEDULE_DAY_ORDER.map((d) => [d, []]));

  sorted.forEach((item) => {

    if (item.Thu && buckets[item.Thu]) buckets[item.Thu].push(item);

    else {

      if (!buckets._other) buckets._other = [];

      buckets._other.push(item);

    }

  });



  const groups = SCHEDULE_DAY_ORDER.filter((d) => buckets[d].length > 0).map((day) => ({

    day,

    items: buckets[day],

  }));

  if (buckets._other?.length) {

    groups.push({ day: 'Khác', items: buckets._other });

  }

  return groups;

}



function ScheduleCaBadge({ ca }) {

  const slot = scheduleCaSlot(ca);

  return (

    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${slot.color}`}>

      <Clock className="w-3 h-3 shrink-0" />

      {slot.label}

      {slot.time ? <span className="font-normal opacity-80">· {slot.time}</span> : null}

    </span>

  );

}



function ScheduleSessionCard({ item, showTeacher, showHocKy }) {

  return (

    <div className="rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] p-4 shadow-sm hover:border-[#F4C542]/30 hover:shadow-md transition-all">

      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">

        <h5 className="font-semibold text-[#1F2937] text-sm leading-snug">{item.TenMonHoc || '—'}</h5>

        <ScheduleCaBadge ca={item.CaHoc} />

      </div>

      <div className="flex flex-wrap gap-2 text-xs text-[#6B7280]">

        {item.NgayFormatted && (

          <span className="inline-flex items-center gap-1 rounded-lg bg-[#F7F8FA] px-2 py-1">

            <Calendar className="w-3.5 h-3.5 text-[#F4C542]" />

            {item.NgayFormatted}

          </span>

        )}

        {item.PhongHoc && (

          <span className="inline-flex items-center gap-1 rounded-lg bg-[#F7F8FA] px-2 py-1">

            <MapPin className="w-3.5 h-3.5 text-[#F4C542]" />

            {item.PhongHoc}

          </span>

        )}

        {showTeacher && item.TenGiangVien && (

          <span className="inline-flex items-center gap-1 rounded-lg bg-[#F7F8FA] px-2 py-1">

            <UserCheck className="w-3.5 h-3.5 text-[#F4C542]" />

            {item.TenGiangVien}

          </span>

        )}

        {showHocKy && item.HocKy && (

          <span className="inline-flex items-center gap-1 rounded-lg bg-[#F4C542]/20 text-[#B45309] px-2 py-1 font-medium">

            <BookOpen className="w-3.5 h-3.5" />

            {item.HocKy}

          </span>

        )}

        {item.MaLopHocPhan && (

          <span className="inline-flex items-center gap-1 rounded-lg bg-[#F7F8FA] px-2 py-1 font-mono text-[11px]">

            {item.MaLopHocPhan}

          </span>

        )}

      </div>

    </div>

  );

}



function ScheduleDetailView({

  schedule,

  title = 'Lịch học',

  emptyMessage = 'Chưa có lịch học nào',

  showTeacher = true,

  showHocKy = false,

}) {

  const items = useMemo(() => (Array.isArray(schedule) ? schedule : []), [schedule]);

  const groups = useMemo(() => groupScheduleByDay(items), [items]);

  const stats = useMemo(() => ({

    sessions: items.length,

    subjects: new Set(items.map((s) => s.TenMonHoc).filter(Boolean)).size,

  }), [items]);



  if (items.length === 0) {

    return (

      <div>

        <h4 className="text-sm font-bold text-[#6B7280] uppercase tracking-wider mb-4">{title}</h4>

        <div className="flex flex-col items-center justify-center py-16 text-gray-300">

          <Calendar className="w-14 h-14 mb-3 text-gray-200" />

          <p className="font-medium">{emptyMessage}</p>

        </div>

      </div>

    );

  }



  return (

    <div className="space-y-5">

      <div className="flex flex-wrap items-end justify-between gap-3">

        <h4 className="text-sm font-bold text-[#6B7280] uppercase tracking-wider">{title}</h4>

        <div className="flex flex-wrap gap-2 text-xs">

          <span className="rounded-full bg-[#F4C542]/20 text-[#B45309] px-3 py-1 font-semibold">{stats.sessions} buổi</span>

          <span className="rounded-full bg-blue-100 text-blue-700 px-3 py-1 font-semibold">{stats.subjects} môn</span>

        </div>

      </div>

      <div className="space-y-6">

        {groups.map((group) => (

          <section key={group.day}>

            <div className="flex items-baseline justify-between gap-2 mb-3 border-b border-[#FFF7D6] pb-2">

              <p className="font-bold text-[#1F2937] text-sm">{group.day}</p>

              <p className="text-xs text-[#6B7280] shrink-0">{group.items.length} buổi</p>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

              {group.items.map((item) => (

                <ScheduleSessionCard

                  key={item.MaLichHoc ?? `${item.TenMonHoc}-${item.NgayHoc}-${item.CaHoc}`}

                  item={item}

                  showTeacher={showTeacher}

                  showHocKy={showHocKy}

                />

              ))}

            </div>

          </section>

        ))}

      </div>

    </div>

  );

}



export default StudentManagement;

