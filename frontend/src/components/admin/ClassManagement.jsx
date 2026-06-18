import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Edit, Search, X, Filter, XCircle, Calendar, BarChart3, BookOpen, GraduationCap, Mail, Phone, Award, TrendingUp, AlertCircle, CheckCircle, UserCheck, Clock, MapPin, Trash2 } from 'lucide-react';
import axios from 'axios';
import { TableSkeleton } from '../common/AdminSkeleton';
import ModalPortal, { Toast, ConfirmDialog, SuccessDialog, ErrorDialog } from '../common/ModalPortal';
import Pagination from '../common/Pagination';
import ConfirmDeleteModal from '../common/ConfirmDeleteModal';
import API_URL from '../../api';

const API_BASE = `${API_URL}/api`;
const emptyGradeStats = () => ({
  totalGrades: 0,
  average: 0,
  excellent: 0,
  good: 0,
  averageGrade: 0,
  fail: 0
});

const asArray = (data) => (Array.isArray(data) ? data : []);

const normalizeGradeStats = (stats) => {
  if (!stats || typeof stats !== 'object') return emptyGradeStats();
  return {
    totalGrades: Number(stats.totalGrades) || 0,
    average: Number(stats.average) || 0,
    excellent: Number(stats.excellent) || 0,
    good: Number(stats.good) || 0,
    averageGrade: Number(stats.averageGrade) || 0,
    fail: Number(stats.fail) || 0
  };
};

function ClassManagement() {
  const [classes, setClasses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [displaySearchTerm, setDisplaySearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classStudents, setClassStudents] = useState([]);
  const [classSchedule, setClassSchedule] = useState([]);
  const [classTeachers, setClassTeachers] = useState([]);
  const [classGradeStats, setClassGradeStats] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [detailTab, setDetailTab] = useState('overview');
  const [formData, setFormData] = useState({
    MaLop: '',
    TenLop: '',
    MaKhoa: '',
    startYear: '',
    endYear: ''
  });
  const [filters, setFilters] = useState({
    facultyFilter: '',
    nienKhoaFilter: '' // Thêm mới
  });
  const [displayFilters, setDisplayFilters] = useState({
    facultyFilter: '',
    nienKhoaFilter: '' // Thêm mới
  });
  const [formErrors, setFormErrors] = useState({
    startYear: '',
    endYear: '',
    TenLop: '',
    MaKhoa: ''
  });
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    message: '',
    onConfirm: null
  });
  const [successDialog, setSuccessDialog] = useState({
    show: false,
    message: ''
  });
  const [errorDialog, setErrorDialog] = useState({
    show: false,
    message: ''
  });
  const [deleteDialog, setDeleteDialog] = useState({ show: false, classInfo: null });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const removeVietnameseTones = useCallback((str) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }, []);
  // Xử lý data cho thẻ select Khoa để chặn rác
  const uniqueFaculties = Array.from(
    new Map(faculties.filter(f => f && f.MaKhoa && f.TenKhoa).map(f => [f.MaKhoa, f])).values()
  );

  // Thêm mới: Lấy danh sách Niên khóa duy nhất và sắp xếp giảm dần
  const uniqueNienKhoa = Array.from(
    new Set(classes.map(c => c.NienKhoa).filter(Boolean))
  ).sort((a, b) => b.localeCompare(a));

  // Cập nhật hàm xóa lọc
  const clearFilters = () => {
    setFilters({ facultyFilter: '', nienKhoaFilter: '' });
    setDisplayFilters({ facultyFilter: '', nienKhoaFilter: '' });
    setSearchTerm('');
    setDisplaySearchTerm('');
    setCurrentPage(1);
  };

  const activeFilterCount = (filters.facultyFilter ? 1 : 0) + (filters.nienKhoaFilter ? 1 : 0) + (searchTerm.trim() ? 1 : 0);
  const hasActiveFilters = filters.facultyFilter || filters.nienKhoaFilter || searchTerm.trim();
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchData();
  }, []);

  const handleKhoaChange = async (e) => {
    const maKhoa = e.target.value;

    setFormData(prev => ({ ...prev, MaKhoa: maKhoa }));
    if (formErrors.MaKhoa) setFormErrors(prev => ({ ...prev, MaKhoa: '' }));

    if (editingClass) return;

    if (formData.startYear && maKhoa) {
      try {
        const res = await axios.get(
          `${API_BASE}/classes/next-code/${formData.startYear}/${maKhoa}`
        );
        setFormData(prev => ({ ...prev, MaKhoa: maKhoa, MaLop: res.data.MaLop }));
      } catch (err) { console.error(err); }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const currentYear = new Date().getFullYear();

    // Validate startYear
    if (!formData.startYear.trim()) {
      newErrors.startYear = 'Năm bắt đầu không được để trống';
    } else if (formData.startYear.length !== 4) {
      newErrors.startYear = 'Năm bắt đầu phải có 4 chữ số';
    } else {
      const startYearInt = parseInt(formData.startYear, 10);
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

    // Validate endYear & TC_11 Logic
    if (!formData.endYear.trim()) {
      newErrors.endYear = 'Năm kết thúc không được để trống';
    } else if (formData.endYear.length !== 4) {
      newErrors.endYear = 'Năm kết thúc phải có 4 chữ số';
    } else {
      const start = parseInt(formData.startYear, 10);
      const end = parseInt(formData.endYear, 10);
      if (!isNaN(start) && !isNaN(end)) {
        if (start >= end) {
          newErrors.endYear = 'Năm kết thúc phải lớn hơn năm bắt đầu';
        }

      }
    }

    // Validate TenLop (TC_13, TC_14)
    const tenLopTrimmed = formData.TenLop.trim();
    if (!tenLopTrimmed) {
      newErrors.TenLop = 'Tên lớp không được để trống';
    } else if (tenLopTrimmed.length < 2) {
      newErrors.TenLop = 'Tên lớp phải có ít nhất 2 ký tự';
    } else if (tenLopTrimmed.includes('-')) {
      // Validate dash position: must be between two words
      const parts = tenLopTrimmed.split('-');
      if (parts.length > 2) {
        newErrors.TenLop = 'Tên lớp chỉ được phép có một dấu "-"';
      } else {
        const beforeDash = parts[0].trim();
        const afterDash = parts[1].trim();
        if (!beforeDash || !afterDash) {
          newErrors.TenLop = 'Dấu "-" phải nằm giữa hai từ (VD: Toán - Văn)';
        }
      }
    }

    // Validate MaKhoa
    if (!formData.MaKhoa) {
      newErrors.MaKhoa = 'Vui lòng chọn Khoa cho lớp học!';
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStartYearChange = async (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      const startYearInt = parseInt(value, 10);
      const endYear = !isNaN(startYearInt) && value.length === 4 ? (startYearInt + 4).toString() : '';

      setFormData(prev => ({ ...prev, startYear: value, endYear: endYear }));
      if (formErrors.startYear) setFormErrors(prev => ({ ...prev, startYear: '' }));

      if (editingClass) return;

      if (value && value.length === 4 && formData.MaKhoa) {
        try {
          const res = await axios.get(`${API_BASE}/classes/next-code/${value}/${formData.MaKhoa}`);
          setFormData(prev => ({ ...prev, MaLop: res.data.MaLop }));
        } catch (err) { console.error(err); }
      }
    }
  };

  const handleEndYearChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setFormData(prev => ({ ...prev, endYear: value }));
      if (formErrors.endYear) setFormErrors(prev => ({ ...prev, endYear: '' }));
    }
  };

  const fetchData = async () => {
    try {
      const [classesRes, facultiesRes] = await Promise.all([
        axios.get(`${API_BASE}/classes`),
        axios.get(`${API_BASE}/faculties`)
      ]);
      setClasses(classesRes.data);
      setFaculties(facultiesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Thực hiện lưu (thêm/cập nhật) lớp học với tên cuối cùng đã được xác nhận
  const saveClass = async (tenLop) => {
    const nienKhoa = `${formData.startYear}-${formData.endYear}`;

    try {
      if (editingClass) {
        await axios.put(`${API_BASE}/classes/${encodeURIComponent(editingClass.MaLop)}`, {
          ...formData,
          TenLop: tenLop,
          NienKhoa: nienKhoa
        });
      } else {
        const resCode = await axios.get(`${API_BASE}/classes/next-code/${formData.startYear}/${formData.MaKhoa}`);
        const newMaLop = resCode.data.MaLop;

        await axios.post(`${API_BASE}/classes`, {
          MaLop: newMaLop,
          TenLop: tenLop,
          MaKhoa: formData.MaKhoa,
          NienKhoa: nienKhoa
        });
      }

      setToast({ show: true, message: editingClass ? 'Cập nhật thành công!' : 'Thêm lớp học thành công!', type: 'success' });
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving class:', error);
      setErrorDialog({ show: true, message: 'Lỗi khi lưu lớp học: ' + (error.response?.data?.error || error.message) });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const tenLopTrimmed = formData.TenLop.trim();

    // Kiểm tra trùng tên trong cùng Khoa
    const isDuplicate = classes.some(
      c => c.TenLop.trim().toLowerCase() === tenLopTrimmed.toLowerCase() &&
        c.MaKhoa === formData.MaKhoa &&
        (!editingClass || c.MaLop !== editingClass.MaLop)
    );

    if (isDuplicate) {
      // Báo cho người dùng biết tên đã trùng, hỏi xác nhận trước khi tự thêm số vào sau
      try {
        const res = await axios.get(`${API_BASE}/classes/next-name/${encodeURIComponent(tenLopTrimmed)}/${formData.MaKhoa}`);
        const suggestedName = res.data.TenLop;

        setConfirmDialog({
          show: true,
          message: `Tên lớp "${tenLopTrimmed}" đã tồn tại trong khoa này. Hệ thống sẽ tự đổi thành "${suggestedName}". Bạn có muốn tiếp tục thêm không?`,
          onConfirm: () => saveClass(suggestedName)
        });
      } catch (err) {
        console.error('Lỗi khi lấy tên lớp tiếp theo:', err);
        setErrorDialog({ show: true, message: 'Không thể kiểm tra tên lớp trùng, vui lòng thử lại!' });
      }
      return;
    }

    setConfirmDialog({
      show: true,
      message: editingClass
        ? `Bạn có chắc chắn muốn cập nhật lớp "${tenLopTrimmed}" không?`
        : `Bạn có chắc chắn muốn thêm lớp "${tenLopTrimmed}" không?`,
      onConfirm: () => saveClass(tenLopTrimmed)
    });
  };

  const handleEdit = (cls) => {
    setEditingClass(cls);
    const years = cls.NienKhoa ? cls.NienKhoa.split('-') : ['', ''];
    setFormData({
      MaLop: cls.MaLop,
      TenLop: cls.TenLop,
      MaKhoa: cls.MaKhoa || '',
      startYear: years[0] || '',
      endYear: years[1] || ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClass(null);
    setFormData({ MaLop: '', TenLop: '', MaKhoa: '', startYear: '', endYear: '' });
    setFormErrors({ startYear: '', endYear: '', TenLop: '', MaKhoa: '' });
  };

  const handleDelete = (cls) => {
    setDeleteDialog({ show: true, classInfo: cls });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.classInfo) return;
    try {
      await axios.delete(`${API_BASE}/classes/${encodeURIComponent(deleteDialog.classInfo.MaLop)}`);
      setToast({ show: true, message: 'Xóa lớp học thành công!', type: 'success' });
      fetchData();
    } catch (error) {
      console.error('Error deleting class:', error);
      setErrorDialog({ show: true, message: 'Lỗi khi xóa lớp học!' });
    } finally {
      setDeleteDialog({ show: false, classInfo: null });
    }
  };

  const loadClassDetailsFallback = async (maLop) => {
    const encodedMaLop = encodeURIComponent(maLop);
    const [studentsResult, scheduleResult, statsResult] = await Promise.allSettled([
      axios.get(`${API_BASE}/classes/${encodedMaLop}/students`),
      axios.get(`${API_BASE}/classes/${encodedMaLop}/schedule`),
      axios.get(`${API_BASE}/classes/${encodedMaLop}/grade-stats`)
    ]);

    const students = studentsResult.status === 'fulfilled' ? asArray(studentsResult.value.data) : [];
    const schedule = scheduleResult.status === 'fulfilled' ? asArray(scheduleResult.value.data) : [];
    const statsRaw = statsResult.status === 'fulfilled' ? asArray(statsResult.value.data)[0] : null;

    const teachers = [];
    const seen = new Set();
    schedule.forEach((item) => {
      if (item.TenGiangVien && !seen.has(item.TenGiangVien)) {
        seen.add(item.TenGiangVien);
        teachers.push({ TenGiangVien: item.TenGiangVien, TenMonHoc: item.TenMonHoc });
      }
    });

    return { students, schedule, teachers, gradeStats: normalizeGradeStats(statsRaw) };
  };

  const handleViewDetails = async (cls) => {
    if (!cls?.MaLop) { alert('Không xác định được mã lớp học!'); return; }
    setSelectedClass(cls);
    setShowDetailModal(true);
    setDetailTab('overview');
    setDetailLoading(true);
    setDetailError('');
    setClassStudents([]);
    setClassSchedule([]);
    setClassTeachers([]);
    setClassGradeStats(null);

    const encodedMaLop = encodeURIComponent(cls.MaLop);

    try {
      let details;
      try {
        const { data } = await axios.get(`${API_BASE}/classes/${encodedMaLop}/details`);
        details = {
          students: asArray(data.students),
          schedule: asArray(data.schedule),
          teachers: asArray(data.teachers),
          gradeStats: normalizeGradeStats(data.gradeStats)
        };
      } catch {
        details = await loadClassDetailsFallback(cls.MaLop);
      }

      setClassStudents(details.students);
      setClassSchedule(details.schedule);
      setClassTeachers(details.teachers);
      setClassGradeStats(details.gradeStats);

      if (details.students.length === 0 && Number(cls.SoSinhVien) > 0) {
        setDetailError('Không tải được danh sách sinh viên. Hãy khởi động lại backend (npm start trong thư mục backend).');
      }
    } catch (error) {
      setDetailError('Không thể tải chi tiết lớp học. Kiểm tra backend đang chạy.');
      setClassGradeStats(emptyGradeStats());
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedClass(null);
    setClassStudents([]);
    setClassSchedule([]);
    setClassTeachers([]);
    setClassGradeStats(null);
    setDetailLoading(false);
    setDetailError('');
    setDetailTab('overview');
  };

  const filteredClasses = classes.filter(cls => {
    const searchLower = debouncedSearchTerm.trim().toLowerCase();
    const searchNoTones = removeVietnameseTones(searchLower);
    const nameLower = cls.TenLop?.toLowerCase() || '';
    const nameNoTones = removeVietnameseTones(nameLower);
    const codeLower = cls.MaLop?.toLowerCase() || '';
    const facultyNameLower = cls.TenKhoa?.toLowerCase() || '';
    const facultyNameNoTones = removeVietnameseTones(facultyNameLower);

    const matchesSearch =
      nameLower.includes(searchLower) ||
      nameNoTones.includes(searchNoTones) ||
      codeLower.includes(searchLower) ||
      facultyNameLower.includes(searchLower) ||
      facultyNameNoTones.includes(searchNoTones);

    const matchesFaculty = !filters.facultyFilter || cls.MaKhoa === filters.facultyFilter;
    // Thêm mới: Điều kiện lọc niên khóa
    const matchesNienKhoa = !filters.nienKhoaFilter || cls.NienKhoa === filters.nienKhoaFilter;

    return matchesSearch && matchesFaculty && matchesNienKhoa;
  });

  const handleSearch = () => { setSearchTerm(displaySearchTerm); setCurrentPage(1); };
  const handleClearSearch = () => { setSearchTerm(''); setDisplaySearchTerm(''); setCurrentPage(1); };
  const handleApplyFilters = () => { setFilters({ ...displayFilters }); setShowFilters(false); setCurrentPage(1); };

  // Pagination calculations
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredClasses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);

  // Xử lý data cho thẻ select Khoa để chặn rác

  // Xử lý data cho thẻ select Niên khóa để chặn rác
  const uniqueNienKhoas = Array.from(
    new Set(classes.map(cls => cls.NienKhoa).filter(Boolean))
  );

  if (loading) {
    return <TableSkeleton columns={5} rows={6} />;
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
        className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-8 shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="flex items-center gap-5 relative z-10">
          <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
            <Users className="w-10 h-10 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">
              Quản lý lớp học
            </h2>
            <p className="text-orange-100 text-lg">Thêm, sửa và xem chi tiết thông tin lớp học</p>
          </div>
        </div>
        <div className="relative z-10">
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-white text-orange-600 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Thêm lớp học
          </motion.button>
        </div>
        <Users className="absolute -right-6 -bottom-6 w-48 h-48 text-white opacity-10 transform rotate-12" />
      </motion.div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm lớp học..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && handleClearSearch()}
              className="w-full pl-11 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-gray-700 placeholder:font-semibold"
            />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' 
                  : 'bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100'
              }`}
            >
              <Filter className="w-4 h-4" />
              Bộ lọc
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </motion.button>
            {hasActiveFilters && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={clearFilters}
                className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors flex items-center gap-2 border border-red-100"
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
            className="bg-orange-50/50 border border-orange-100 rounded-xl p-4 mt-4 space-y-4 relative z-10 w-full"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Lọc theo khoa</label>
                <select
                  value={displayFilters.facultyFilter}
                  onChange={(e) => setDisplayFilters({ ...displayFilters, facultyFilter: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors text-gray-700"
                >
                  <option value="">Tất cả khoa</option>
                  {uniqueFaculties.map((faculty) => (
                    <option key={faculty.MaKhoa} value={faculty.MaKhoa}>
                      {faculty.TenKhoa}
                    </option>
                  ))}
                </select>
              </div>

              {/* Thêm mới Box Niên khóa */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Lọc theo niên khóa</label>
                <select
                  value={displayFilters.nienKhoaFilter}
                  onChange={(e) => setDisplayFilters({ ...displayFilters, nienKhoaFilter: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors text-gray-700"
                >
                  <option value="">Tất cả niên khóa</option>
                  {uniqueNienKhoa.map((nk) => (
                    <option key={nk} value={nk}>
                      {nk}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleApplyFilters}
                className="flex-1 bg-orange-500 text-white py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors shadow-sm"
              >
                Áp dụng bộ lọc
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setDisplayFilters({ facultyFilter: '', nienKhoaFilter: '' })}
                className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Đặt lại
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-orange-50 to-orange-100">
              <tr>
                <th className="text-left py-5 px-6 text-sm font-bold text-orange-700 uppercase tracking-wider">Lớp học</th>
                <th className="text-left py-5 px-6 text-sm font-bold text-orange-700 uppercase tracking-wider">Khoa</th>
                <th className="text-left py-5 px-6 text-sm font-bold text-orange-700 uppercase tracking-wider">Niên khóa</th>
                <th className="text-center py-5 px-6 text-sm font-bold text-orange-700 uppercase tracking-wider">Sĩ số</th>
                <th className="text-center py-5 px-6 text-sm font-bold text-orange-700 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((cls, index) => (
                  <motion.tr
                    key={cls.MaLop}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-orange-50/20 transition-colors cursor-pointer"
                    onClick={() => handleViewDetails(cls)}
                  >
                    <td className="py-5 px-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-800 text-sm whitespace-nowrap">{cls.TenLop}</span>
                        <span className="text-xs text-gray-400 font-mono mt-0.5 whitespace-nowrap">{cls.MaLop}</span>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 whitespace-nowrap">
                        {cls.TenKhoa || 'N/A'}
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 whitespace-nowrap">
                        {cls.NienKhoa || 'N/A'}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 whitespace-nowrap">
                        {cls.SoSinhVien ?? 0}
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEdit(cls)}
                          className="p-3 bg-orange-100 text-orange-600 rounded-xl hover:bg-orange-200 transition-all shadow-sm"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(cls)}
                          className="p-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all shadow-sm"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-16">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Users className="w-16 h-16 mb-4 text-gray-300" />
                      <p className="text-lg font-medium">Không tìm thấy lớp học nào</p>
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

      {/* Modal Add/Edit */}
      {showModal && (
        <ModalPortal>
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 flex justify-between items-center flex-shrink-0">
                <div className="text-white">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {editingClass ? 'Cập nhật lớp học' : 'Thêm lớp học mới'}
                  </h3>
                  <p className="text-orange-100 text-sm mt-0.5">
                    {editingClass ? 'Chỉnh sửa thông tin lớp học' : 'Tạo lớp sinh hoạt theo khoa và niên khóa'}
                  </p>
                </div>
                <button onClick={handleCloseModal} className="p-2 hover:bg-white/20 rounded-lg text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* TC_17: Chỉ dùng onSubmit của form để đón phím Enter, xóa bỏ onKeyDown dư thừa */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                <div className="flex flex-col gap-4">
                  <input type="hidden" value={formData.MaLop} />

                  {/* Niên khóa */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Niên khóa</label>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={formData.startYear}
                          onChange={handleStartYearChange}
                          placeholder="Năm bắt đầu"
                          className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors ${formErrors.startYear ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'}`}
                          maxLength={4}
                        />
                        {formErrors.startYear && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.startYear}</p>
                        )}
                      </div>
                      <span className="flex items-center text-gray-500 font-semibold">-</span>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={formData.endYear}
                          onChange={handleEndYearChange}
                          placeholder="Năm kết thúc"
                          className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors ${formErrors.endYear ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'}`}
                          maxLength={4}
                        />
                        {formErrors.endYear && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.endYear}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Khoa */}
                  {/* Khoa */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Khoa</label>
                    <select
                      value={formData.MaKhoa}
                      onChange={(e) => {
                        handleKhoaChange(e);
                      }}
                      className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors ${formErrors.MaKhoa ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'}`}
                    >
                      <option value="">Chọn khoa</option>
                      {uniqueFaculties.map((faculty) => (
                        <option key={faculty.MaKhoa} value={faculty.MaKhoa}>
                          {faculty.TenKhoa}
                        </option>
                      ))}
                    </select>
                    {formErrors.MaKhoa && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.MaKhoa}</p>
                    )}
                  </div>

                  {/* Tên lớp */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tên lớp</label>
                    <input
                      type="text"
                      value={formData.TenLop}
                      onChange={(e) => {
                        let value = e.target.value;
                        value = value.replace(/[^a-zA-Z0-9\u00C0-\u1EF9\s-]/g, '').replace(/\s\s+/g, ' ');
                        setFormData({ ...formData, TenLop: value });
                        if (formErrors.TenLop) setFormErrors(prev => ({ ...prev, TenLop: '' }));
                      }}
                      placeholder="Nhập tên lớp học"
                      className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors ${formErrors.TenLop ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'}`}
                    />
                    {formErrors.TenLop && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.TenLop}</p>
                    )}
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
                    className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-lg"
                  >
                    {editingClass ? 'Lưu thay đổi' : 'Thêm lớp học'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </ModalPortal>
      )}

      {/* Centralized Notification Components */}
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
      <ConfirmDeleteModal
        isOpen={deleteDialog.show}
        onClose={() => setDeleteDialog({ show: false, classInfo: null })}
        onConfirm={confirmDelete}
        title="Xác nhận xóa lớp học"
        message={`Bạn có chắc chắn muốn xóa vĩnh viễn lớp "${deleteDialog.classInfo?.TenLop}" (${deleteDialog.classInfo?.MaLop}) không? Hành động này không thể hoàn tác.`}
      />
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: '', type: 'success' })}
      />

      {/* Detail Modal */}
      {showDetailModal && selectedClass && (
        <ModalPortal>
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/40">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-6 flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/10 backdrop-blur-md text-white border border-white/20 font-bold text-xl rounded-2xl w-16 h-16 flex items-center justify-center shadow-lg flex-shrink-0">
                      <GraduationCap className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <span className="text-orange-100 text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4" />
                        Chi tiết lớp học
                      </span>
                      <h2 className="text-2xl font-bold text-white mt-1">{selectedClass.TenLop}</h2>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-mono font-medium">{selectedClass.MaLop}</span>
                        {selectedClass.TenKhoa && (
                          <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-medium">{selectedClass.TenKhoa}</span>
                        )}
                        <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                          {classStudents.length} sinh viên
                        </span>
                      </div>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleCloseDetailModal}
                    className="bg-white/20 hover:bg-white/30 rounded-xl p-2 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </motion.button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mt-5">
                  {[
                    { id: 'overview', label: 'Tổng quan', icon: BookOpen },
                    { id: 'students', label: 'Sinh viên', icon: Users },
                    { id: 'schedule', label: 'Lịch học', icon: Calendar },
                    { id: 'stats', label: 'Thống kê điểm', icon: BarChart3 },
                  ].map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setDetailTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${detailTab === tab.id
                            ? 'bg-white text-orange-600 shadow-md'
                            : 'text-white/70 hover:text-white hover:bg-white/10'
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
                {detailError && !detailLoading && (
                  <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p>{detailError}</p>
                  </div>
                )}
                {detailLoading ? (
                  <div className="flex flex-col items-center justify-center h-48 gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
                    <p className="text-gray-400 text-sm">Đang tải dữ liệu...</p>
                  </div>
                ) : (
                  <>
                    {/* TAB: TỔNG QUAN */}
                    {detailTab === 'overview' && (
                      <div className="space-y-6">
                        {/* Stats cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { label: 'Sinh viên', value: classStudents.length, icon: Users, color: 'orange' },
                            { label: 'Môn học', value: [...new Set(classSchedule.map(s => s.TenMonHoc))].length, icon: BookOpen, color: 'blue' },
                            { label: 'Giảng viên', value: classTeachers.length, icon: UserCheck, color: 'purple' },
                            { label: 'Điểm TB', value: classGradeStats ? (classGradeStats.average || 0) : '—', icon: Award, color: 'green' },
                          ].map((card, i) => {
                            const Icon = card.icon;
                            const colorMap = {
                              orange: 'bg-orange-50 text-orange-600 border-orange-100 hover:border-orange-300 hover:bg-orange-100/30',
                              blue: 'bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-300 hover:bg-blue-100/30',
                              purple: 'bg-purple-50 text-purple-600 border-purple-100 hover:border-purple-300 hover:bg-purple-100/30',
                              green: 'bg-green-50 text-green-600 border-green-100 hover:border-green-300 hover:bg-green-100/30',
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
                                  <div className="p-2 bg-white rounded-xl shadow-sm">
                                    <Icon className="w-5 h-5 opacity-90" />
                                  </div>
                                </div>
                                <div className="text-sm font-semibold opacity-70 mt-3 uppercase tracking-wider">{card.label}</div>
                              </motion.div>
                            );
                          })}
                        </div>

                        {/* Giảng viên phụ trách */}
                        <div>
                          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Giảng viên phụ trách</h4>
                          {classTeachers.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {classTeachers.map((t, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.06 }}
                                  whileHover={{ y: -2, boxShadow: '0 8px 30px rgb(0 0 0 / 0.04)', borderColor: 'rgb(254 215 170)' }}
                                  className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all duration-300"
                                >
                                  <div className="bg-orange-100 rounded-xl p-2 flex-shrink-0">
                                    <UserCheck className="w-5 h-5 text-orange-600" />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-800 text-sm">{t.TenGiangVien}</div>
                                    <div className="text-xs text-gray-500">{t.TenMonHoc}</div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-400 text-sm italic">Chưa có giảng viên được phân công</p>
                          )}
                        </div>

                        {/* Danh sách môn học */}
                        <div>
                          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Môn học học kỳ này</h4>
                          {classSchedule.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {[...new Set(classSchedule.map(s => s.TenMonHoc))].map((mon, i) => (
                                <span key={i} className="bg-orange-50 border border-orange-200 text-orange-700 px-3 py-1.5 rounded-full text-sm font-medium">
                                  {mon}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-400 text-sm italic">Chưa có môn học nào</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* TAB: SINH VIÊN */}
                    {detailTab === 'students' && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                            Danh sách sinh viên ({classStudents.length})
                          </h4>
                        </div>
                        {classStudents.length > 0 ? (
                          <div className="overflow-x-auto rounded-2xl border border-orange-100">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-gradient-to-r from-orange-50 to-orange-100">
                                  <th className="text-left py-3.5 px-5 text-xs font-bold text-orange-700 uppercase tracking-wider">#</th>
                                  <th className="text-left py-3.5 px-5 text-xs font-bold text-orange-700 uppercase tracking-wider">MSSV</th>
                                  <th className="text-left py-3.5 px-5 text-xs font-bold text-orange-700 uppercase tracking-wider">Họ và tên</th>
                                  <th className="text-left py-3.5 px-5 text-xs font-bold text-orange-700 uppercase tracking-wider">Giới tính</th>
                                  <th className="text-left py-3.5 px-5 text-xs font-bold text-orange-700 uppercase tracking-wider">Email</th>
                                  <th className="text-left py-3.5 px-5 text-xs font-bold text-orange-700 uppercase tracking-wider">SĐT</th>
                                </tr>
                              </thead>
                              <tbody>
                                {classStudents.map((sv, idx) => (
                                  <motion.tr
                                    key={sv.MSSV}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: idx * 0.03 }}
                                    className="border-t border-gray-50 hover:bg-orange-50/40 transition-colors"
                                  >
                                    <td className="py-3.5 px-5 text-sm text-gray-400">{idx + 1}</td>
                                    <td className="py-3.5 px-5">
                                      <span className="font-mono text-sm font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-lg">{sv.MSSV}</span>
                                    </td>
                                    <td className="py-3.5 px-5 font-semibold text-gray-800 text-sm">{sv.HoTen}</td>
                                    <td className="py-3.5 px-5">
                                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${sv.GioiTinh === 'Nam' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                                        }`}>
                                        {sv.GioiTinh || '—'}
                                      </span>
                                    </td>
                                    <td className="py-3.5 px-5 text-sm text-gray-500">
                                      <div className="flex items-center gap-1.5">
                                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                                        {sv.Email || '—'}
                                      </div>
                                    </td>
                                    <td className="py-3.5 px-5 text-sm text-gray-500">
                                      <div className="flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                                        {sv.SoDienThoai || '—'}
                                      </div>
                                    </td>
                                  </motion.tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                            <Users className="w-14 h-14 mb-3 text-gray-200" />
                            <p className="font-medium">Chưa có sinh viên nào trong lớp</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB: LỊCH HỌC */}
                    {detailTab === 'schedule' && (
                      <ScheduleDetailView
                        schedule={classSchedule}
                        title="Lịch học lớp"
                        showTeacher
                        showHocKy
                      />
                    )}

                    {/* TAB: THỐNG KÊ ĐIỂM */}
                    {detailTab === 'stats' && (
                      <div className="space-y-6">
                        {classGradeStats && classGradeStats.totalGrades > 0 ? (
                          <>
                            {/* Điểm trung bình lớn */}
                            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-center text-white">
                              <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-80" />
                              <div className="text-5xl font-bold mb-1">{classGradeStats.average || 0}</div>
                              <div className="text-orange-100 font-medium">Điểm trung bình của lớp</div>
                              <div className="text-orange-200 text-sm mt-1">Tổng {classGradeStats.totalGrades} bản ghi điểm</div>
                            </div>

                            {/* Phân loại */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {[
                                { label: 'Xuất sắc / Giỏi', sublabel: '≥ 8.5', value: classGradeStats.excellent || 0, icon: Award, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', iconBg: 'bg-amber-100' },
                                { label: 'Khá', sublabel: '7.0 – 8.4', value: classGradeStats.good || 0, icon: CheckCircle, bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', iconBg: 'bg-green-100' },
                                { label: 'Trung bình', sublabel: '5.0 – 6.9', value: classGradeStats.averageGrade || 0, icon: TrendingUp, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', iconBg: 'bg-blue-100' },
                                { label: 'Không đạt', sublabel: '< 5.0', value: classGradeStats.fail || 0, icon: AlertCircle, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', iconBg: 'bg-red-100' },
                              ].map((item, i) => {
                                const Icon = item.icon;
                                const pct = classGradeStats.totalGrades > 0 ? Math.round((item.value / classGradeStats.totalGrades) * 100) : 0;
                                return (
                                  <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                    className={`rounded-2xl border-2 p-5 ${item.bg} ${item.border}`}
                                  >
                                    <div className={`rounded-xl p-2 w-fit mb-3 ${item.iconBg}`}>
                                      <Icon className={`w-5 h-5 ${item.text}`} />
                                    </div>
                                    <div className={`text-3xl font-bold ${item.text}`}>{item.value}</div>
                                    <div className={`text-xs font-semibold mt-0.5 ${item.text} opacity-70`}>{pct}% tổng số</div>
                                    <div className="text-xs text-gray-500 mt-2 font-medium">{item.label}</div>
                                    <div className="text-xs text-gray-400">{item.sublabel}</div>
                                  </motion.div>
                                );
                              })}
                            </div>

                            {/* Progress bars */}
                            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                              <h5 className="text-sm font-bold text-gray-600 mb-4">Phân phối xếp loại</h5>
                              {[
                                { label: 'Giỏi (≥8.5)', value: classGradeStats.excellent || 0, color: 'bg-amber-400' },
                                { label: 'Khá (7–8.4)', value: classGradeStats.good || 0, color: 'bg-green-400' },
                                { label: 'TB (5–6.9)', value: classGradeStats.averageGrade || 0, color: 'bg-blue-400' },
                                { label: 'Rớt (<5)', value: classGradeStats.fail || 0, color: 'bg-red-400' },
                              ].map((bar, i) => {
                                const pct = classGradeStats.totalGrades > 0 ? (bar.value / classGradeStats.totalGrades) * 100 : 0;
                                return (
                                  <div key={i} className="flex items-center gap-3 mb-3 last:mb-0">
                                    <span className="text-xs text-gray-500 w-24 flex-shrink-0">{bar.label}</span>
                                    <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{ duration: 0.7, delay: i * 0.1 }}
                                        className={`h-full rounded-full ${bar.color}`}
                                      />
                                    </div>
                                    <span className="text-xs font-bold text-gray-600 w-8 text-right">{bar.value}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                            <BarChart3 className="w-14 h-14 mb-3 text-gray-200" />
                            <p className="font-medium">Chưa có dữ liệu điểm</p>
                            <p className="text-sm mt-1">Lớp này chưa có bản ghi điểm nào</p>
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
    </div>
  );
}

const SCHEDULE_DAY_ORDER = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
const SCHEDULE_DAY_NAMES = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const SCHEDULE_CA_SLOTS = {
  '1': { label: 'Ca 1', time: 'Tiết 1–3', color: 'bg-orange-100 text-orange-700' },
  '2': { label: 'Ca 2', time: 'Tiết 4–6', color: 'bg-amber-100 text-amber-700' },
  '3': { label: 'Ca 3', time: 'Tiết 7–9', color: 'bg-orange-200 text-orange-800' },
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
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:border-orange-200 hover:shadow-md transition-all">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <h5 className="font-semibold text-gray-800 text-sm leading-snug">{item.TenMonHoc || '—'}</h5>
        <ScheduleCaBadge ca={item.CaHoc} />
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
        {item.NgayFormatted && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1">
            <Calendar className="w-3.5 h-3.5 text-orange-500" />
            {item.NgayFormatted}
          </span>
        )}
        {item.PhongHoc && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1">
            <MapPin className="w-3.5 h-3.5 text-orange-500" />
            {item.PhongHoc}
          </span>
        )}
        {showTeacher && item.TenGiangVien && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1">
            <UserCheck className="w-3.5 h-3.5 text-orange-500" />
            {item.TenGiangVien}
          </span>
        )}
        {showHocKy && item.HocKy && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-orange-50 text-orange-700 px-2 py-1 font-medium">
            <BookOpen className="w-3.5 h-3.5" />
            {item.HocKy}
          </span>
        )}
        {item.MaLopHocPhan && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1 font-mono text-[11px]">
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
        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">{title}</h4>
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Calendar className="w-14 h-14 mb-3 text-gray-200" />
          <p className="font-medium">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">{title}</h4>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-orange-100 text-orange-700 px-3 py-1 font-semibold">{stats.sessions} buổi</span>
          <span className="rounded-full bg-blue-100 text-blue-700 px-3 py-1 font-semibold">{stats.subjects} môn</span>
        </div>
      </div>
      <div className="space-y-6">
        {groups.map((group) => (
          <section key={group.day}>
            <div className="flex items-baseline justify-between gap-2 mb-3 border-b border-orange-100 pb-2">
              <p className="font-bold text-gray-800 text-sm">{group.day}</p>
              <p className="text-xs text-gray-500 shrink-0">{group.items.length} buổi</p>
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

export default ClassManagement;