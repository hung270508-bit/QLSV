import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Edit, Trash2, Search, X, Filter, XCircle, Eye, Download, Upload, FileText, Calendar, CheckCircle, GraduationCap, Mail, Phone, Award, TrendingUp, AlertCircle, BookOpen, BarChart3, UserCheck, Clock, MapPin } from 'lucide-react';
import axios from 'axios';
import ModalPortal from '../ModalPortal';

function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [displaySearchTerm, setDisplaySearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    classFilter: '',
    genderFilter: ''
  });
  const [displayFilters, setDisplayFilters] = useState({
    classFilter: '',
    genderFilter: ''
  });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [studentTranscript, setStudentTranscript] = useState(null);
  const [studentSchedule, setStudentSchedule] = useState([]);
  const [studentAttendance, setStudentAttendance] = useState([]);
  const [detailTab, setDetailTab] = useState('info');
  const [formData, setFormData] = useState({
    MSSV: '',
    HoTen: '',
    NgaySinh: '',
    GioiTinh: 'Nam',
    Email: '',
    SoDienThoai: '',
    MaLop: ''
  });
  const [errors, setErrors] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, classesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/students'),
        axios.get('http://localhost:5000/api/classes')
      ]);
      setStudents(studentsRes.data);
      setClasses(classesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
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
    const res = await axios.get(`http://localhost:5000/api/students/next-code/${maLop}`);
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
    }

    // Validate Ngày sinh
    if (!formData.NgaySinh) {
      newErrors.NgaySinh = 'Ngày sinh không được để trống';
    } else {
      const birthDate = new Date(formData.NgaySinh);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 15 || age > 100) {
        newErrors.NgaySinh = 'Ngày sinh không hợp lệ';
      }
    }

    // Validate Email
    if (!formData.Email.trim()) {
      newErrors.Email = 'Email không được để trống';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.Email)) {
        newErrors.Email = 'Email không đúng định dạng';
      }
    }

    // Validate Số điện thoại
    if (!formData.SoDienThoai.trim()) {
      newErrors.SoDienThoai = 'Số điện thoại không được để trống';
    } else {
      const phoneRegex = /^(0[3-9]|\+84[3-9])[0-9]{8}$/;
      if (!phoneRegex.test(formData.SoDienThoai)) {
        newErrors.SoDienThoai = 'Số điện thoại không đúng định dạng (bắt đầu bằng 0 hoặc +84)';
      }
    }

    // Validate Lớp
    if (!formData.MaLop) {
      newErrors.MaLop = 'Vui lòng chọn lớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showNotificationMessage = (message, type) => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;
  
  try {
    if (editingStudent) {
      // Bắt buộc dùng editingStudent.MSSV làm URL để không bao giờ bị lỗi 404
      await axios.put(`http://localhost:5000/api/students/${editingStudent.MSSV}`, formData);
      showNotificationMessage('Cập nhật sinh viên thành công!', 'success');
    } else {
      // Gửi nguyên cục formData (bao gồm cả MSSV đã tự sinh) lên server
      await axios.post('http://localhost:5000/api/students', formData);
      showNotificationMessage('Thêm sinh viên mới thành công!', 'success');
    }
    fetchData();
    handleCloseModal();
  } catch (error) {
    console.error('Error saving student:', error);
    showNotificationMessage(error.response?.data?.message || 'Lỗi khi lưu sinh viên!', 'error');
  }
};

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      MSSV: student.MSSV,
      HoTen: student.HoTen,
      NgaySinh: student.NgaySinh ? student.NgaySinh.split('T')[0] : '',
      GioiTinh: student.GioiTinh || 'Nam',
      Email: student.Email || '',
      SoDienThoai: student.SoDienThoai || '',
      MaLop: student.MaLop || ''
    });
    setShowModal(true);
  };

 const handleDelete = async (mssv) => {
  setConfirmMessage('Bạn có chắc chắn muốn xóa sinh viên này?');
  setConfirmAction(() => async () => {
    try {
      await axios.delete(`http://localhost:5000/api/students/${mssv}`);
      
      // XÓA fetchData() cũ và THAY BẰNG DÒNG NÀY:
      setStudents(prevStudents => prevStudents.filter(student => student.MSSV !== mssv));
      
      showNotificationMessage('Xóa sinh viên thành công!', 'success');
    } catch (error) {
      console.error('Error deleting student:', error);
      showNotificationMessage('Lỗi khi xóa sinh viên!', 'error');
    }
  });
  setShowConfirmModal(true);
};

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStudent(null);
    setFormData({
      MSSV: '',
      HoTen: '',
      NgaySinh: '',
      GioiTinh: 'Nam',
      Email: '',
      SoDienThoai: '',
      MaLop: ''
    });
    setErrors({});
  };

  const handleConfirmAction = () => {
    if (confirmAction) {
      confirmAction();
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmMessage('');
  };

  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmMessage('');
  };

  const handleViewDetails = async (student) => {
    setSelectedStudent(student);
    setShowDetailModal(true);
    setDetailTab('info');
    
    try {
      const [detailsRes, transcriptRes, scheduleRes, attendanceRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/students/${student.MSSV}/details`),
        axios.get(`http://localhost:5000/api/academic/transcript/${student.MSSV}`),
        axios.get(`http://localhost:5000/api/students/${student.MSSV}/schedule`),
        axios.get(`http://localhost:5000/api/attendance/student/${student.MSSV}`)
      ]);
      
      setStudentDetails(detailsRes.data[0] || null);
      setStudentTranscript(transcriptRes.data);
      setStudentSchedule(Array.isArray(scheduleRes.data) ? scheduleRes.data : []);
      setStudentAttendance(attendanceRes.data);
    } catch (error) {
      console.error('Error fetching student details:', error);
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
        s.NgaySinh,
        s.GioiTinh,
        s.Email,
        s.SoDienThoai,
        s.TenLop || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'sinhVien.csv';
    link.click();
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.HoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.MSSV.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass = !filters.classFilter || student.MaLop === filters.classFilter;
    const matchesGender = !filters.genderFilter || student.GioiTinh === filters.genderFilter;
    
    return matchesSearch && matchesClass && matchesGender;
  });

  const handleSearch = () => {
    setSearchTerm(displaySearchTerm);
  };

  const handleApplyFilters = () => {
    setFilters({ ...displayFilters });
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({ classFilter: '', genderFilter: '' });
    setDisplayFilters({ classFilter: '', genderFilter: '' });
    setSearchTerm('');
    setDisplaySearchTerm('');
  };

  const activeFilterCount = (filters.classFilter ? 1 : 0) + (filters.genderFilter ? 1 : 0) + (searchTerm ? 1 : 0);
  const hasActiveFilters = filters.classFilter || filters.genderFilter || searchTerm;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Users className="w-8 h-8" />
              Quản lý sinh viên
            </h2>
            <p className="text-orange-100 text-lg">Thêm, sửa, xóa và xem chi tiết thông tin sinh viên</p>
          </div>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExportStudents}
              className="flex items-center gap-2 bg-white text-orange-600 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
            >
              <Download className="w-5 h-5" />
              Export
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-white text-orange-600 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Thêm sinh viên
            </motion.button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm sinh viên theo tên, MSSV hoặc email..."
              value={displaySearchTerm}
              onChange={(e) => setDisplaySearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                hasActiveFilters ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Filter className="w-5 h-5" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSearch}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-orange-200 transition-all"
          >
            <Search className="w-5 h-5" />
            Tìm kiếm
          </motion.button>
          {hasActiveFilters && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearFilters}
              className="px-6 py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors flex items-center gap-2 border-2 border-red-200"
            >
              <XCircle className="w-5 h-5" />
              Xóa bộ lọc
            </motion.button>
          )}
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-orange-50 rounded-xl p-4 space-y-4 relative z-50 w-full mt-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Lọc theo lớp</label>
                <select
                  value={displayFilters.classFilter}
                  onChange={(e) => setDisplayFilters({ ...displayFilters, classFilter: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-orange-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                >
                  <option value="">Tất cả lớp</option>
                  {classes.map((cls) => (
                    <option key={cls.MaLop} value={cls.MaLop}>
                      {cls.TenLop}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Lọc theo giới tính</label>
                <select
                  value={displayFilters.genderFilter}
                  onChange={(e) => setDisplayFilters({ ...displayFilters, genderFilter: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-orange-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                >
                  <option value="">Tất cả</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleApplyFilters}
                className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
              >
                Áp dụng lọc
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setDisplayFilters({ classFilter: '', genderFilter: '' })}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Đặt lại
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xl border border-orange-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-orange-50 to-orange-100">
              <tr>
                <th className="text-left py-5 px-6 text-sm font-bold text-orange-700 uppercase tracking-wider">MSSV</th>
                <th className="text-left py-5 px-6 text-sm font-bold text-orange-700 uppercase tracking-wider">Họ tên</th>
                <th className="text-left py-5 px-6 text-sm font-bold text-orange-700 uppercase tracking-wider">Giới tính</th>
                <th className="text-left py-5 px-6 text-sm font-bold text-orange-700 uppercase tracking-wider">Lớp</th>
                <th className="text-left py-5 px-6 text-sm font-bold text-orange-700 uppercase tracking-wider">Email</th>
                <th className="text-left py-5 px-6 text-sm font-bold text-orange-700 uppercase tracking-wider">SĐT</th>
                <th className="text-center py-5 px-6 text-sm font-bold text-orange-700 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, index) => (
                  <motion.tr
                    key={student.MSSV}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-orange-50 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 transition-all cursor-pointer"
                    onClick={() => handleViewDetails(student)}
                  >
                    <td className="py-5 px-6">
                      <span className="font-semibold text-gray-800 text-base">{student.MSSV}</span>
                    </td>
                    <td className="py-5 px-6">
                      <div className="font-semibold text-gray-800">{student.HoTen}</div>
                    </td>
                    <td className="py-5 px-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        student.GioiTinh === 'Nam'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-pink-100 text-pink-700'
                      }`}>
                        {student.GioiTinh || 'N/A'}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-sm text-gray-600">{student.TenLop || 'N/A'}</td>
                    <td className="py-5 px-6 text-sm text-gray-600">{student.Email || 'N/A'}</td>
                    <td className="py-5 px-6 text-sm text-gray-600">{student.SoDienThoai || 'N/A'}</td>
                    <td className="py-5 px-6">
                      <div className="flex items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEdit(student)}
                          className="p-3 bg-orange-100 text-orange-600 rounded-xl hover:bg-orange-200 transition-all shadow-sm"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(student.MSSV)}
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
                  <td colSpan="7" className="py-16">
                    <div className="flex flex-col items-center justify-center text-gray-400">
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
      </div>

      {/* Modal Add/Edit Form */}
      {showModal && (
        <ModalPortal>
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 flex justify-between items-center flex-shrink-0">
              <div className="text-white">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  {editingStudent ? 'Cập nhật sinh viên' : 'Thêm sinh viên mới'}
                </h3>
                <p className="text-orange-100 text-sm mt-0.5">
                  {editingStudent ? 'Chỉnh sửa hồ sơ sinh viên' : 'Tạo hồ sơ sinh viên và gán lớp'}
                </p>
              </div>
              <button onClick={handleCloseModal} className="p-2 hover:bg-white/20 rounded-lg text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Ô nhập MSSV mới tự động sinh */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mã số sinh viên (MSSV)</label>
                  <input
                    type="text"
                    value={formData.MSSV}
                    readOnly
                    placeholder={!editingStudent && !formData.MaLop ? 'Chọn lớp để tạo mã tự động' : ''}
                    className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-xl focus:outline-none transition-colors opacity-70 cursor-not-allowed font-mono text-orange-600 font-bold"
                    required
                  />
                </div>
                
                {/* Ô Họ tên nằm ngang hàng với MSSV */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Họ tên</label>
                  <input
                    type="text"
                    value={formData.HoTen}
                    onChange={(e) => {
                      setFormData({ ...formData, HoTen: e.target.value });
                      if (errors.HoTen) setErrors({ ...errors, HoTen: '' });
                    }}
                    className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors ${
                      errors.HoTen ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'
                    }`}
                  />
                  {errors.HoTen && <p className="text-red-500 text-sm mt-1">{errors.HoTen}</p>}
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
                    className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors ${
                      errors.NgaySinh ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'
                    }`}
                  />
                  {errors.NgaySinh && <p className="text-red-500 text-sm mt-1">{errors.NgaySinh}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Giới tính</label>
                  <select
                    value={formData.GioiTinh}
                    onChange={(e) => setFormData({ ...formData, GioiTinh: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
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
                    className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors ${
                      errors.Email ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'
                    }`}
                  />
                  {errors.Email && <p className="text-red-500 text-sm mt-1">{errors.Email}</p>}
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
                    className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors ${
                      errors.SoDienThoai ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'
                    }`}
                  />
                  {errors.SoDienThoai && <p className="text-red-500 text-sm mt-1">{errors.SoDienThoai}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Lớp</label>
                  <select
                    value={formData.MaLop}
                    onChange={(e) => {
                      handleLopChange(e); // Gọi hàm tự động sinh MSSV
                      if (errors.MaLop) setErrors({ ...errors, MaLop: '' }); // Giữ nguyên tính năng xóa viền đỏ
                    }}
                    className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors ${
                      errors.MaLop ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'
                    }`}
                  >
                    <option value="">Chọn lớp</option>
                    {classes.map((cls) => (
                      <option key={cls.MaLop} value={cls.MaLop}>
                        {cls.TenLop}
                      </option>
                    ))}
                  </select>
                  {errors.MaLop && <p className="text-red-500 text-sm mt-1">{errors.MaLop}</p>}
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
            className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-6 flex-shrink-0">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="bg-white/20 rounded-xl p-2">
                      <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-orange-100 text-sm font-medium uppercase tracking-widest">Chi tiết sinh viên</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mt-2">{studentDetails?.HoTen || selectedStudent.HoTen}</h2>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full font-mono">{studentDetails?.MSSV || selectedStudent.MSSV}</span>
                    {studentDetails?.TenLop && (
                      <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full">{studentDetails.TenLop}</span>
                    )}
                    {studentDetails?.TenKhoa && (
                      <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full">{studentDetails.TenKhoa}</span>
                    )}
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
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                        detailTab === tab.id
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
              {detailTab === 'info' && studentDetails && (
                <div className="space-y-6">
                  {/* Stats cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Tín chỉ', value: studentTranscript?.summary?.totalCredits || 0, icon: BookOpen, color: 'blue' },
                      { label: 'GPA', value: studentTranscript?.summary?.cumulativeGPA || 0, icon: Award, color: 'green' },
                      { label: 'Tỷ lệ qua', value: `${studentTranscript?.summary?.passRate || 0}%`, icon: TrendingUp, color: 'purple' },
                      { label: 'Số môn', value: studentTranscript?.transcript?.length || 0, icon: BarChart3, color: 'orange' },
                    ].map((card, i) => {
                      const Icon = card.icon;
                      const colorMap = {
                        blue: 'bg-blue-50 text-blue-600 border-blue-100',
                        green: 'bg-green-50 text-green-600 border-green-100',
                        purple: 'bg-purple-50 text-purple-600 border-purple-100',
                        orange: 'bg-orange-50 text-orange-600 border-orange-100',
                      };
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.07 }}
                          className={`rounded-2xl border-2 p-5 ${colorMap[card.color]}`}
                        >
                          <Icon className="w-6 h-6 mb-3 opacity-80" />
                          <div className="text-3xl font-bold">{card.value}</div>
                          <div className="text-sm font-medium opacity-70 mt-1">{card.label}</div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Personal info */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Thông tin cá nhân</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { label: 'MSSV', value: studentDetails.MSSV, icon: null },
                        { label: 'Họ tên', value: studentDetails.HoTen, icon: null },
                        { label: 'Ngày sinh', value: studentDetails.NgaySinh, icon: null },
                        { label: 'Giới tính', value: studentDetails.GioiTinh, icon: null },
                        { label: 'Email', value: studentDetails.Email, icon: Mail },
                        { label: 'SĐT', value: studentDetails.SoDienThoai, icon: Phone },
                      ].map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 border border-gray-100"
                        >
                          {item.icon && <item.icon className="w-5 h-5 text-gray-400" />}
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 font-medium">{item.label}</div>
                            <div className="font-semibold text-gray-800 text-sm">{item.value || '—'}</div>
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
                        { label: 'Tỷ lệ qua', value: `${studentTranscript.summary.passRate}%`, icon: TrendingUp, color: 'orange' },
                      ].map((card, i) => {
                        const Icon = card.icon;
                        const colorMap = {
                          blue: 'bg-blue-50 text-blue-600 border-blue-100',
                          green: 'bg-green-50 text-green-600 border-green-100',
                          purple: 'bg-purple-50 text-purple-600 border-purple-100',
                          orange: 'bg-orange-50 text-orange-600 border-orange-100',
                        };
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07 }}
                            className={`rounded-2xl border-2 p-5 ${colorMap[card.color]}`}
                          >
                            <Icon className="w-6 h-6 mb-3 opacity-80" />
                            <div className="text-3xl font-bold">{card.value}</div>
                            <div className="text-sm font-medium opacity-70 mt-1">{card.label}</div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                  <div className="overflow-x-auto rounded-2xl border border-gray-100">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-orange-50 to-orange-100">
                          <th className="text-left py-3.5 px-5 text-xs font-bold text-gray-600 uppercase tracking-wider">Môn học</th>
                          <th className="text-left py-3.5 px-5 text-xs font-bold text-gray-600 uppercase tracking-wider">Học kỳ</th>
                          <th className="text-left py-3.5 px-5 text-xs font-bold text-gray-600 uppercase tracking-wider">QT</th>
                          <th className="text-left py-3.5 px-5 text-xs font-bold text-gray-600 uppercase tracking-wider">GK</th>
                          <th className="text-left py-3.5 px-5 text-xs font-bold text-gray-600 uppercase tracking-wider">CK</th>
                          <th className="text-left py-3.5 px-5 text-xs font-bold text-gray-600 uppercase tracking-wider">TB</th>
                          <th className="text-left py-3.5 px-5 text-xs font-bold text-gray-600 uppercase tracking-wider">Điểm chữ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentTranscript.transcript && studentTranscript.transcript.map((grade, index) => (
                          <motion.tr
                            key={index}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.03 }}
                            className="border-t border-gray-50 hover:bg-orange-50/40 transition-colors"
                          >
                            <td className="py-3.5 px-5 font-semibold text-gray-800 text-sm">{grade.TenMonHoc}</td>
                            <td className="py-3.5 px-5 text-sm text-gray-600">{grade.HocKy}</td>
                            <td className="py-3.5 px-5 text-sm text-gray-600">{grade.DiemQuaTrinh || '-'}</td>
                            <td className="py-3.5 px-5 text-sm text-gray-600">{grade.DiemGiuaKy || '-'}</td>
                            <td className="py-3.5 px-5 text-sm text-gray-600">{grade.DiemCuoiKy || '-'}</td>
                            <td className="py-3.5 px-5 text-sm font-bold text-orange-600">{grade.DiemTB}</td>
                            <td className="py-3.5 px-5 text-sm font-semibold text-gray-800">{grade.DiemChu}</td>
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
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                    Lịch điểm danh ({studentAttendance.length} buổi)
                  </h4>
                  {studentAttendance.length > 0 ? (
                    <div className="overflow-x-auto rounded-2xl border border-gray-100">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gradient-to-r from-orange-50 to-orange-100">
                            <th className="text-left py-3.5 px-5 text-xs font-bold text-gray-600 uppercase tracking-wider">Ngày</th>
                            <th className="text-left py-3.5 px-5 text-xs font-bold text-gray-600 uppercase tracking-wider">Phòng</th>
                            <th className="text-left py-3.5 px-5 text-xs font-bold text-gray-600 uppercase tracking-wider">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentAttendance.map((att, index) => (
                            <motion.tr
                              key={index}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.03 }}
                              className="border-t border-gray-50 hover:bg-orange-50/40 transition-colors"
                            >
                              <td className="py-3.5 px-5 text-sm text-gray-800">
                                {new Date(att.NgayDiemDanh).toLocaleDateString('vi-VN')}
                              </td>
                              <td className="py-3.5 px-5 text-sm text-gray-600">{att.PhongHoc}</td>
                              <td className="py-3.5 px-5">
                                <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${
                                  att.TrangThai === 'Có mặt' ? 'bg-green-100 text-green-700' :
                                  att.TrangThai === 'Vắng mặt' ? 'bg-red-100 text-red-700' :
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
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                      <CheckCircle className="w-14 h-14 mb-3 text-gray-200" />
                      <p className="font-medium">Chưa có dữ liệu điểm danh</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
        </ModalPortal>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <ModalPortal>
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/30">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Xác nhận</h3>
                <p className="text-gray-600 mb-6">{confirmMessage}</p>
                <div className="flex gap-3 w-full">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCancelConfirm}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Hủy
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConfirmAction}
                    className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors"
                  >
                    Xác nhận
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </ModalPortal>
      )}

      {/* Notification Toast */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 ${
              notificationType === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white`}
          >
            {notificationType === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span className="font-semibold">{notificationMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
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

export default StudentManagement;