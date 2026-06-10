import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Edit, Trash2, Search, X, Filter, XCircle, Eye, Download, Upload, FileText, Calendar, CheckCircle, GraduationCap, Mail, Phone, Award, TrendingUp, AlertCircle, BookOpen, BarChart3, UserCheck, Clock, MapPin } from 'lucide-react';
import axios from 'axios';
import ModalPortal, { Toast, ConfirmDialog, SuccessDialog, ErrorDialog } from '../ModalPortal';

// Tự động lấy cấu hình môi trường hoặc mặc định localhost
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000' 
    : 'https://qlsv-huq1.onrender.com';
const API_BASE = `${API_URL}/api`;

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
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState('overview'); // overview, transcript, attendance

  const [formData, setFormData] = useState({
    MSSV: '',
    HoTen: '',
    NgaySinh: '',
    GioiTinh: '',
    Email: '',
    SoDienThoai: '',
    MaLop: '',
    TrangThai: 'Đang học'
  });

  const [formErrors, setFormErrors] = useState({
    HoTen: '',
    NgaySinh: '',
    Email: '',
    SoDienThoai: '',
    MaLop: ''
  });

  const [deleteModal, setDeleteModal] = useState({ show: false, student: null });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [successDialog, setSuccessDialog] = useState({ show: false, message: '' });
  const [errorDialog, setErrorDialog] = useState({ show: false, message: '' });

  // Loại bỏ dấu tiếng Việt
  const removeVietnameseTones = (str) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  };

  // Hàm chuẩn hóa viết hoa tên riêng (FIX TC_12)
  const formatTitleCase = (str) => {
    return str.toLowerCase().split(/\s+/).map(word => {
      if (!word) return '';
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  };

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchData = async () => {
    try {
      const [studentsRes, classesRes] = await Promise.all([
        axios.get(`${API_BASE}/students`),
        axios.get(`${API_BASE}/classes`)
      ]);
      setStudents(studentsRes.data);
      setClasses(classesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      loading && setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const validateForm = () => {
    const errors = {
      HoTen: '',
      NgaySinh: '',
      Email: '',
      SoDienThoai: '',
      MaLop: ''
    };
    let isValid = true;

    // FIX TC_11: Chặn ký tự đặc biệt, chuẩn hóa tên
    const formattedName = formatTitleCase(formData.HoTen.trim());
    if (!formattedName) {
      errors.HoTen = 'Vui lòng nhập họ tên';
      isValid = false;
    } else if (!/^[a-zA-Z\u00C0-\u1EF9\s]+$/.test(formattedName)) {
      errors.HoTen = 'Họ tên không được chứa số hoặc ký tự đặc biệt';
      isValid = false;
    }

 // Kiểm tra Ngày sinh và độ tuổi (18 - 60)
    if (!formData.NgaySinh) {
      errors.NgaySinh = 'Vui lòng chọn ngày sinh';
      isValid = false;
    } else {
      const dob = new Date(formData.NgaySinh);
      const today = new Date();
      
      // Tính tuổi
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      
      // Nếu chưa tới tháng sinh nhật, hoặc cùng tháng nhưng chưa tới ngày sinh nhật trong năm nay thì trừ đi 1 tuổi
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }

      if (age < 18) {
        errors.NgaySinh = 'Sinh viên chưa đủ 18 tuổi để nhập học';
        isValid = false;
      } else if (age > 60) {
        errors.NgaySinh = 'Độ tuổi vượt quá giới hạn cho phép (tối đa 60 tuổi)';
        isValid = false;
      }
    }
    // FIX TC_16: Email regex chặt chẽ hơn
    if (!formData.Email) {
      errors.Email = 'Vui lòng nhập email';
      isValid = false;
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.Email)) {
      errors.Email = 'Email không hợp lệ (VD: @gmail.com)';
      isValid = false;
    }

    if (!formData.SoDienThoai) {
      errors.SoDienThoai = 'Vui lòng nhập số điện thoại';
      isValid = false;
    } else if (!/^(0[3|5|7|8|9])+([0-9]{8})\b/.test(formData.SoDienThoai)) {
      errors.SoDienThoai = 'Số điện thoại không hợp lệ (VD: 0912345678)';
      isValid = false;
    }

    if (!formData.MaLop) {
      errors.MaLop = 'Vui lòng chọn lớp học';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleLopChange = async (e) => {
    const maLop = e.target.value;
    setFormData(prev => ({ ...prev, MaLop: maLop }));
    if (formErrors.MaLop) setFormErrors(prev => ({ ...prev, MaLop: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Tự động chuẩn hóa tên trước khi gửi (TC_12)
    const formattedName = formatTitleCase(formData.HoTen.trim());
    const dataToSubmit = { ...formData, HoTen: formattedName };

    try {
      if (editingStudent) {
        await axios.put(`${API_BASE}/students/${editingStudent.MSSV}`, dataToSubmit);
        setToast({ show: true, message: 'Cập nhật sinh viên thành công!', type: 'success' });
      } else {
        const resCode = await axios.get(`${API_BASE}/students/next-code/${formData.MaLop}`);
        const newMSSV = resCode.data.MSSV;

        await axios.post(`${API_BASE}/students`, {
          ...dataToSubmit,
          MSSV: newMSSV
        });
        setToast({ show: true, message: 'Thêm sinh viên thành công!', type: 'success' });
      }
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving student:', error);
      // FIX TC_18: Bóc tách lỗi hệ thống cụ thể từ Backend thay vì hardcode
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || "Lỗi không xác định";
      setErrorDialog({ show: true, message: `Lỗi khi lưu sinh viên: ${errorMessage}` });
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
      MaLop: student.MaLop || '',
      TrangThai: student.TrangThai || 'Đang học'
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStudent(null);
    setFormData({
      MSSV: '', HoTen: '', NgaySinh: '', GioiTinh: 'Nam',
      Email: '', SoDienThoai: '', MaLop: '', TrangThai: 'Đang học'
    });
    setFormErrors({ HoTen: '', NgaySinh: '', Email: '', SoDienThoai: '', MaLop: '' });
  };

  const handleDelete = (student) => {
    setDeleteModal({ show: true, student });
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`${API_BASE}/students/${deleteModal.student.MSSV}`);
      setToast({ show: true, message: 'Xóa sinh viên thành công!', type: 'success' });
      fetchData();
    } catch (error) {
      console.error('Error deleting student:', error);
      setErrorDialog({ show: true, message: 'Lỗi khi xóa sinh viên!' });
    } finally {
      setDeleteModal({ show: false, student: null });
    }
  };

  const handleViewDetails = async (student) => {
    setSelectedStudent(student);
    setShowDetailModal(true);
    setDetailLoading(true);
    setDetailTab('overview');
    
    try {
      const [detailsRes, transcriptRes, scheduleRes] = await Promise.all([
        axios.get(`${API_BASE}/students/${student.MSSV}/details`),
        axios.get(`${API_BASE}/academic/transcript/${student.MSSV}`),
        axios.get(`${API_BASE}/students/${student.MSSV}/schedule`)
      ]);
      
      setStudentDetails({
        ...detailsRes.data[0],
        schedule: scheduleRes.data
      });
      setStudentTranscript(transcriptRes.data);
    } catch (error) {
      console.error('Error fetching student details:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    // FIX TC_13: Nhập khoảng trắng toàn bộ sẽ bị chặn
    if (debouncedSearchTerm.length > 0 && debouncedSearchTerm.trim() === '') {
      return false; // Không trả về kết quả nào nếu chỉ gõ space
    }
    
    // FIX TC_19: Trim khoảng trắng thừa trước khi search
    const searchLower = debouncedSearchTerm.trim().toLowerCase();
    const searchNoTones = removeVietnameseTones(searchLower);
    
    const nameLower = student.HoTen?.toLowerCase() || '';
    const nameNoTones = removeVietnameseTones(nameLower);
    const codeLower = student.MSSV?.toLowerCase() || '';
    const emailLower = student.Email?.toLowerCase() || '';
    
    const matchesSearch =
      nameLower.includes(searchLower) ||
      nameNoTones.includes(searchNoTones) ||
      codeLower.includes(searchLower) ||
      emailLower.includes(searchLower);
      
    const matchesClass = !filters.classFilter || student.MaLop === filters.classFilter;
    const matchesGender = !filters.genderFilter || student.GioiTinh === filters.genderFilter;
    
    return matchesSearch && matchesClass && matchesGender;
  });

  const handleClearSearch = () => {
    setSearchTerm('');
    setDisplaySearchTerm('');
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

  const activeFilterCount = (filters.classFilter ? 1 : 0) + (filters.genderFilter ? 1 : 0) + (searchTerm.trim() ? 1 : 0);
  const hasActiveFilters = filters.classFilter || filters.genderFilter || searchTerm.trim();

  // Loại bỏ các lớp trùng lặp hoặc null
  const uniqueClasses = Array.from(
    new Map(classes.filter(c => c && c.MaLop && c.TenLop).map(c => [c.MaLop, c])).values()
  );

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
              <GraduationCap className="w-8 h-8" />
              Quản lý sinh viên
            </h2>
            <p className="text-orange-100 text-lg">Quản lý hồ sơ, thêm/sửa sinh viên</p>
          </div>
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

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm theo MSSV, Họ tên hoặc Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && handleClearSearch()}
              className="w-full pl-12 pr-10 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-gray-700"
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
              className={`relative flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                hasActiveFilters
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-100'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-5 h-5" />
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
                className="px-5 py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors flex items-center gap-2 border-2 border-red-200/60"
              >
                <XCircle className="w-5 h-5" />
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
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Lọc theo lớp</label>
                <select
                  value={displayFilters.classFilter}
                  onChange={(e) => setDisplayFilters({ ...displayFilters, classFilter: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors text-gray-700"
                >
                  <option value="">Tất cả lớp học</option>
                  {uniqueClasses.map((cls) => (
                    <option key={cls.MaLop} value={cls.MaLop}>
                      {cls.TenLop} ({cls.MaLop})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Giới tính</label>
                <select
                  value={displayFilters.genderFilter}
                  onChange={(e) => setDisplayFilters({ ...displayFilters, genderFilter: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors text-gray-700"
                >
                  <option value="">Tất cả</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
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
                onClick={() => setDisplayFilters({ classFilter: '', genderFilter: '' })}
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
                <th className="text-left py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">MSSV</th>
                <th className="text-left py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Họ và tên</th>
                <th className="text-left py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Lớp</th>
                <th className="text-left py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Liên hệ</th>
                <th className="text-center py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Thao tác</th>
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
                    className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 transition-all cursor-pointer"
                    onClick={() => handleViewDetails(student)}
                  >
                    <td className="py-5 px-6">
                      <span className="font-semibold text-gray-800 text-base">{student.MSSV}</span>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${
                          student.GioiTinh === 'Nữ' ? 'bg-pink-400' : 'bg-blue-500'
                        }`}>
                          {student.HoTen ? student.HoTen.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{student.HoTen}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{student.GioiTinh || 'Chưa cập nhật'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-700">
                        {student.TenLop || student.MaLop || 'Chưa phân lớp'}
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex flex-col gap-1.5 text-sm">
                        {student.Email && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="w-4 h-4 text-gray-400" />
                            {student.Email}
                          </div>
                        )}
                        {student.SoDienThoai && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="w-4 h-4 text-gray-400" />
                            {student.SoDienThoai}
                          </div>
                        )}
                      </div>
                    </td>
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
                          onClick={() => handleDelete(student)}
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
                      <p className="text-lg font-medium">Không tìm thấy sinh viên nào</p>
                      <p className="text-sm mt-2">Thử thay đổi từ khóa hoặc bộ lọc</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit */}
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
                  {editingStudent ? 'Chỉnh sửa hồ sơ sinh viên' : 'Nhập thông tin để tạo hồ sơ và tài khoản'}
                </p>
              </div>
              <button onClick={handleCloseModal} className="p-2 hover:bg-white/20 rounded-lg text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Họ và Tên</label>
                  <input
                    type="text"
                    value={formData.HoTen}
                    onChange={(e) => {
                      setFormData({ ...formData, HoTen: e.target.value });
                      if (formErrors.HoTen) setFormErrors(prev => ({ ...prev, HoTen: '' }));
                    }}
                    onBlur={(e) => {
                      // FIX TC_12: Tự động format viết hoa khi blur
                      const formatted = formatTitleCase(e.target.value.trim());
                      setFormData(prev => ({ ...prev, HoTen: formatted }));
                    }}
                    placeholder="Nguyễn Văn A"
                    className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors ${formErrors.HoTen ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'}`}
                  />
                  {formErrors.HoTen && <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.HoTen}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ngày sinh</label>
                  <input
                    type="date"
                    value={formData.NgaySinh}
                    onChange={(e) => {
                      setFormData({ ...formData, NgaySinh: e.target.value });
                      if (formErrors.NgaySinh) setFormErrors(prev => ({ ...prev, NgaySinh: '' }));
                    }}
                    className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors ${formErrors.NgaySinh ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'}`}
                  />
                  {formErrors.NgaySinh && <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.NgaySinh}</p>}
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
                      if (formErrors.Email) setFormErrors(prev => ({ ...prev, Email: '' }));
                    }}
                    placeholder="nguyenvana@gmail.com"
                    className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors ${formErrors.Email ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'}`}
                  />
                  {formErrors.Email && <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.Email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Số điện thoại</label>
                  <input
                    type="text"
                    value={formData.SoDienThoai}
                    onChange={(e) => {
                      setFormData({ ...formData, SoDienThoai: e.target.value });
                      if (formErrors.SoDienThoai) setFormErrors(prev => ({ ...prev, SoDienThoai: '' }));
                    }}
                    placeholder="0912345678"
                    maxLength={10}
                    className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors ${formErrors.SoDienThoai ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'}`}
                  />
                  {formErrors.SoDienThoai && <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.SoDienThoai}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Lớp</label>
                  <select
                    value={formData.MaLop}
                    onChange={handleLopChange}
                    className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors ${formErrors.MaLop ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'}`}
                  >
                    <option value="">Chọn lớp học</option>
                    {uniqueClasses.map((cls) => (
                      <option key={cls.MaLop} value={cls.MaLop}>
                        {cls.TenLop}
                      </option>
                    ))}
                  </select>
                  {formErrors.MaLop && <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.MaLop}</p>}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-orange-500/30 transition-all"
                >
                  {editingStudent ? 'Lưu thay đổi' : 'Thêm sinh viên'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
        </ModalPortal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        show={deleteModal.show}
        message={`Bạn có chắc chắn muốn xóa sinh viên "${deleteModal.student?.HoTen}" (${deleteModal.student?.MSSV})? Mọi dữ liệu liên quan sẽ bị xóa.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ show: false, student: null })}
        title="Xóa sinh viên"
      />

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
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

      {/* Detail Modal */}
      {showDetailModal && selectedStudent && (
        <ModalPortal>
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/40">
            <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-white rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-6 flex-shrink-0 relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                <GraduationCap className="w-64 h-64" />
              </div>
              
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-6">
                  <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-bold text-white shadow-inner border-4 border-white/20 ${
                    selectedStudent.GioiTinh === 'Nữ' ? 'bg-pink-400' : 'bg-blue-500'
                  }`}>
                    {selectedStudent.HoTen ? selectedStudent.HoTen.charAt(0).toUpperCase() : 'S'}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-mono tracking-wider">
                        {selectedStudent.MSSV}
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        selectedStudent.TrangThai === 'Đang học' ? 'bg-green-400/20 text-green-100' : 'bg-red-400/20 text-red-100'
                      }`}>
                        {selectedStudent.TrangThai || 'Đang học'}
                      </span>
                    </div>
                    <h2 className="text-3xl font-bold text-white mt-1">{selectedStudent.HoTen}</h2>
                    <div className="text-orange-100 mt-1.5 flex items-center gap-4 text-sm font-medium">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4" />
                        Lớp {selectedStudent.TenLop || selectedStudent.MaLop || 'Chưa cập nhật'}
                      </span>
                      {studentDetails?.TenKhoa && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-orange-300"></span>
                          <span>Khoa {studentDetails.TenKhoa}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowDetailModal(false)}
                  className="bg-white/20 hover:bg-white/30 rounded-xl p-2 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </motion.button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mt-6 relative z-10">
                {[
                  { id: 'overview', label: 'Hồ sơ cá nhân', icon: UserCheck },
                  { id: 'transcript', label: 'Kết quả học tập', icon: Award },
                  { id: 'attendance', label: 'Lịch học', icon: Calendar }
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setDetailTab(tab.id)}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
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
            <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
              {detailLoading ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
                  <p className="text-gray-400 font-medium">Đang tải dữ liệu sinh viên...</p>
                </div>
              ) : (
                <>
                  {/* TAB: HỒ SƠ */}
                  {detailTab === 'overview' && studentDetails && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                          <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2 border-b border-gray-100 pb-4">
                            <FileText className="w-5 h-5 text-orange-500" />
                            Thông tin cá nhân
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                            {[
                              { label: 'Ngày sinh', value: studentDetails.NgaySinh ? new Date(studentDetails.NgaySinh).toLocaleDateString('vi-VN') : 'Chưa cập nhật' },
                              { label: 'Giới tính', value: studentDetails.GioiTinh || 'Chưa cập nhật' },
                              { label: 'Email liên hệ', value: studentDetails.Email || 'Chưa cập nhật' },
                              { label: 'Số điện thoại', value: studentDetails.SoDienThoai || 'Chưa cập nhật' },
                            ].map((item, idx) => (
                              <div key={idx}>
                                <div className="text-sm text-gray-500 mb-1">{item.label}</div>
                                <div className="font-semibold text-gray-800">{item.value}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                          <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2 border-b border-gray-100 pb-4">
                            <BookOpen className="w-5 h-5 text-orange-500" />
                            Thông tin học vụ
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                            {[
                              { label: 'Trạng thái học tập', value: <span className="text-green-600 bg-green-50 px-2 py-1 rounded-md">{studentDetails.TrangThai || 'Đang học'}</span> },
                              { label: 'Lớp sinh hoạt', value: studentDetails.TenLop || studentDetails.MaLop || 'Chưa cập nhật' },
                              { label: 'Khoa quản lý', value: studentDetails.TenKhoa || 'Chưa cập nhật' },
                              { label: 'Ngày nhập học', value: 'Tháng 9/2023 (Dự kiến)' },
                            ].map((item, idx) => (
                              <div key={idx}>
                                <div className="text-sm text-gray-500 mb-1">{item.label}</div>
                                <div className="font-semibold text-gray-800">{item.value}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {/* GPA Card */}
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                          <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
                            <TrendingUp className="w-32 h-32" />
                          </div>
                          <div className="relative z-10">
                            <div className="text-gray-400 font-medium mb-1">Điểm Trung Bình (GPA)</div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-5xl font-bold text-orange-400">
                                {studentTranscript?.summary?.cumulativeGPA || '0.00'}
                              </span>
                              <span className="text-gray-500 font-medium">/ 4.0</span>
                            </div>
                            
                            <div className="mt-6 pt-5 border-t border-gray-700/50">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-400">Xếp loại</span>
                                <span className="font-bold text-green-400 bg-green-400/10 px-3 py-1 rounded-full">
                                  {studentTranscript?.summary?.academicStanding || 'Chưa có'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-400">Tín chỉ tích lũy</span>
                                <span className="font-bold">{studentTranscript?.summary?.passedCredits || 0} / {studentTranscript?.summary?.totalCredits || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Quick actions */}
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                          <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Thao tác nhanh</h4>
                          <div className="space-y-2">
                            <button 
                              onClick={() => {
                                setShowDetailModal(false);
                                handleEdit(studentDetails);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors text-sm font-medium"
                            >
                              <Edit className="w-4 h-4" /> Cập nhật hồ sơ
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors text-sm font-medium">
                              <Mail className="w-4 h-4" /> Gửi email nhắc nhở
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors text-sm font-medium">
                              <Download className="w-4 h-4" /> Xuất bảng điểm PDF
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: BẢNG ĐIỂM */}
                  {detailTab === 'transcript' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Award className="w-5 h-5 text-orange-500" />
                            Chi tiết điểm các môn
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">Hệ thống tính điểm hệ 4 và hệ 10</p>
                        </div>
                        <div className="flex gap-4 text-sm font-medium">
                          <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm text-center">
                            <div className="text-gray-500 text-xs mb-0.5">Tín chỉ qua môn</div>
                            <div className="text-lg text-green-600">{studentTranscript?.summary?.passedCredits || 0}</div>
                          </div>
                          <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm text-center">
                            <div className="text-gray-500 text-xs mb-0.5">Tỷ lệ hoàn thành</div>
                            <div className="text-lg text-blue-600">{studentTranscript?.summary?.passRate || 0}%</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50/80">
                              <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Học kỳ</th>
                              <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Môn học</th>
                              <th className="text-center py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Tín chỉ</th>
                              <th className="text-center py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Hệ 10</th>
                              <th className="text-center py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Điểm chữ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentTranscript?.transcript?.length > 0 ? (
                              studentTranscript.transcript.map((record, idx) => (
                                <tr key={idx} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                                  <td className="py-4 px-6 font-medium text-gray-600">HK {record.HocKy}</td>
                                  <td className="py-4 px-6">
                                    <div className="font-bold text-gray-800">{record.TenMonHoc}</div>
                                    <div className="text-xs text-gray-500">{record.MaLopHocPhan || record.MaMonHoc}</div>
                                  </td>
                                  <td className="py-4 px-6 text-center font-medium">{record.SoTinChi || '-'}</td>
                                  <td className="py-4 px-6 text-center">
                                    <span className="font-bold">{record.DiemTB || '-'}</span>
                                  </td>
                                  <td className="py-4 px-6 text-center">
                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${
                                      ['A', 'A+', 'B', 'B+'].includes(record.DiemChu) ? 'bg-green-100 text-green-700' :
                                      ['C', 'C+'].includes(record.DiemChu) ? 'bg-blue-100 text-blue-700' :
                                      ['D', 'D+'].includes(record.DiemChu) ? 'bg-amber-100 text-amber-700' :
                                      'bg-red-100 text-red-700'
                                    }`}>
                                      {record.DiemChu || '-'}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="5" className="py-12 text-center text-gray-400">
                                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                                  Chưa có dữ liệu điểm cho sinh viên này
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB: LỊCH HỌC */}
                  {detailTab === 'attendance' && (
                    <ScheduleDetailView
                      schedule={studentDetails?.schedule || []}
                      title={`Lịch học của ${selectedStudent.HoTen}`}
                      showTeacher
                      showHocKy
                    />
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

// Giữ nguyên các Helper Function xử lý hiển thị Lịch học của bạn
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