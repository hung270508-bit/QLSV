import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Edit, Trash2, Search, X, Filter, XCircle, Calendar, FileText, Download, UserCheck, Mail, Phone, Award, BookOpen, BarChart3, Clock, MapPin, CheckCircle, GraduationCap, Building2 } from 'lucide-react';
import axios from 'axios';
import { TableSkeleton } from '../common/AdminSkeleton';
import ModalPortal, { Toast, ConfirmDialog, SuccessDialog, ErrorDialog } from '../common/ModalPortal';
import API_URL from '../../api';

const API_BASE = `${API_URL}/api`;

function TeacherManagement() {
  const [teachers, setTeachers] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [displaySearchTerm, setDisplaySearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ facultyFilter: '', statusFilter: '' });
  const [displayFilters, setDisplayFilters] = useState({ facultyFilter: '', statusFilter: '' });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherDetails, setTeacherDetails] = useState(null);
  const [teachingSchedule, setTeachingSchedule] = useState([]);
  const [teachingLoad, setTeachingLoad] = useState([]);
  const [detailTab, setDetailTab] = useState('info'); // 'info', 'schedule', 'load'

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, message: '', onConfirm: null });
  const [successDialog, setSuccessDialog] = useState({ show: false, message: '' });
  const [errorDialog, setErrorDialog] = useState({ show: false, message: '' });

  const [formData, setFormData] = useState({
    MaGiangVien: '',
    HoTen: '',
    Email: '',
    SoDienThoai: '',
    MaKhoa: '',
    TrangThai: 'Đang dạy'
  });
  const [errors, setErrors] = useState({});

  // Loại bỏ dấu tiếng Việt
  const removeVietnameseTones = useCallback((str) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }, []);

  // Hàm chuẩn hóa viết hoa tên riêng (FIX TC_05, TC_12)
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teachersRes, facultiesRes] = await Promise.all([
        axios.get(`${API_BASE}/teachers`),
        axios.get(`${API_BASE}/faculties`)
      ]);
      setTeachers(teachersRes.data);
      setFaculties(facultiesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      loading && setLoading(false);
    }
  };

  const handleKhoaChange = async (e) => {
    const maKhoa = e.target.value;
    setFormData(prev => ({ ...prev, MaKhoa: maKhoa, MaGiangVien: '' }));

    if (editingTeacher || !maKhoa) return;

    try {
      // Dùng trực tiếp maKhoa thay vì tìm ID để không bị lỗi 404
      const res = await axios.get(`${API_BASE}/teachers/next-code/${maKhoa}`);
      setFormData(prev => ({ ...prev, MaKhoa: maKhoa, MaGiangVien: res.data.MaGiangVien }));
    } catch (err) {
      console.error('Lỗi tạo mã giảng viên:', err);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate Họ tên (FIX TC_05)
    const formattedName = formatTitleCase(formData.HoTen.trim());
    if (!formattedName) {
      newErrors.HoTen = 'Họ tên không được để trống';
    } else if (formattedName.length < 2) {
      newErrors.HoTen = 'Họ tên phải có ít nhất 2 ký tự';
    } else if (formattedName.length > 50) {
      newErrors.HoTen = 'Họ tên không được vượt quá 50 ký tự';
    } else if (!/^[a-zA-Z\u00C0-\u1EF9\s]+$/.test(formattedName)) {
      newErrors.HoTen = 'Họ tên không được chứa số hoặc ký tự đặc biệt';
    }

    // Validate Email (FIX TC_04)
    if (!formData.Email.trim()) {
      newErrors.Email = 'Email không được để trống';
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
      if (!emailRegex.test(formData.Email)) {
        newErrors.Email = 'Email không đúng định dạng (VD: @gmail.com)';
      } else {
        // Validate trùng email
        const duplicateEmail = teachers.find(
          teacher => teacher.Email === formData.Email &&
            (!editingTeacher || teacher.MaGiangVien !== editingTeacher.MaGiangVien)
        );
        if (duplicateEmail) {
          newErrors.Email = 'Email đã tồn tại trong hệ thống';
        }
      }
    }

    // Validate Số điện thoại
    if (!formData.SoDienThoai.trim()) {
      newErrors.SoDienThoai = 'Số điện thoại không được để trống';
    } else {
      const phoneDigits = formData.SoDienThoai.replace(/\D/g, ''); // Remove non-digit characters
      if (phoneDigits.length < 10) {
        newErrors.SoDienThoai = 'SĐT không dưới 10 số';
      } else if (phoneDigits.length > 10) {
        newErrors.SoDienThoai = 'SĐT không trên 10 số';
      } else {
        const phoneRegex = /^(0[3-9]|\+84[3-9])[0-9]{8}$/;
        if (!phoneRegex.test(formData.SoDienThoai)) {
          newErrors.SoDienThoai = 'Số điện thoại không đúng định dạng (bắt đầu bằng 0 hoặc +84)';
        }
      }
    }

    // Validate Khoa
    if (!formData.MaKhoa) {
      newErrors.MaKhoa = 'Vui lòng chọn khoa';
    }

    // Validate trùng số điện thoại
    if (formData.SoDienThoai.trim()) {
      const duplicatePhone = teachers.find(
        teacher => teacher.SoDienThoai === formData.SoDienThoai &&
          (!editingTeacher || teacher.MaGiangVien !== editingTeacher.MaGiangVien)
      );
      if (duplicatePhone) {
        newErrors.SoDienThoai = 'Số điện thoại đã tồn tại trong hệ thống';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Chuẩn hóa tên trước khi gửi
    const formattedName = formatTitleCase(formData.HoTen.trim());
    const dataToSubmit = { ...formData, HoTen: formattedName };

    try {
      if (editingTeacher) {
        setConfirmDialog({
          show: true,
          message: `Bạn có chắc chắn muốn cập nhật thông tin giảng viên "${dataToSubmit.HoTen}" (${dataToSubmit.MaGiangVien}) không?`,
          onConfirm: async () => {
            try {
              await axios.put(`${API_BASE}/teachers/${editingTeacher.MaGiangVien}`, dataToSubmit);
              setToast({ show: true, message: 'Cập nhật giảng viên thành công!', type: 'success' });
              fetchData();
              handleCloseModal();
            } catch (error) {
              console.error('Lỗi lưu dữ liệu:', error);
              setErrorDialog({ show: true, message: 'Lỗi khi lưu dữ liệu: ' + (error.response?.data?.error || error.message) });
            }
          }
        });
      } else {
        const resCode = await axios.get(`${API_BASE}/teachers/next-code/${formData.MaKhoa}`);
        const newMaGV = resCode.data.MaGiangVien;

        await axios.post(`${API_BASE}/teachers`, { ...dataToSubmit, MaGiangVien: newMaGV });
        setToast({ show: true, message: 'Thêm giảng viên thành công!', type: 'success' });
        fetchData();
        handleCloseModal();
      }
    } catch (error) {
      console.error('Lỗi lưu dữ liệu:', error);
      setErrorDialog({ show: true, message: 'Lỗi khi lưu dữ liệu: ' + (error.response?.data?.error || error.message) });
    }
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      MaGiangVien: teacher.MaGiangVien,
      HoTen: teacher.HoTen,
      Email: teacher.Email || '',
      SoDienThoai: teacher.SoDienThoai || '',
      MaKhoa: teacher.MaKhoa || '',
      TrangThai: teacher.TrangThai || 'Đang dạy'
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTeacher(null);
    setFormData({ MaGiangVien: '', HoTen: '', Email: '', SoDienThoai: '', MaKhoa: '', TrangThai: 'Đang dạy' });
    setErrors({});
  };

  const handleViewDetails = async (teacher) => {
    setSelectedTeacher(teacher);
    setShowDetailModal(true);
    setDetailTab('info');

    try {
      const [detailsRes, scheduleRes, loadRes] = await Promise.all([
        axios.get(`${API_BASE}/teachers/${teacher.MaGiangVien}/details`),
        axios.get(`${API_BASE}/teachers/${teacher.MaGiangVien}/teaching-schedule`),
        axios.get(`${API_BASE}/teachers/${teacher.MaGiangVien}/teaching-load`)
      ]);

      setTeacherDetails(detailsRes.data[0] || null);
      setTeachingSchedule(scheduleRes.data);
      setTeachingLoad(loadRes.data);
    } catch (error) {
      console.error('Error fetching teacher details:', error);
    }
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedTeacher(null);
    setTeacherDetails(null);
    setTeachingSchedule([]);
    setTeachingLoad([]);
    setDetailTab('info');
  };

  const handleExportTeachers = () => {
    const csvContent = [
      ['Mã GV', 'Họ tên', 'Email', 'SĐT', 'Khoa'],
      ...filteredTeachers.map(t => [
        t.MaGiangVien,
        t.HoTen,
        t.Email,
        t.SoDienThoai,
        t.TenKhoa || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'giangVien.csv';
    link.click();
  };

  // Loại bỏ các khoa rác/trùng lặp (FIX TC_09)
  const uniqueFaculties = Array.from(
    new Map(faculties.filter(f => f && f.MaKhoa && f.TenKhoa).map(f => [f.MaKhoa, f])).values()
  );

  const filteredTeachers = teachers.filter(teacher => {
    // FIX TC_06: Nhập khoảng trắng toàn bộ sẽ bị chặn trả về rỗng
    if (debouncedSearchTerm.length > 0 && debouncedSearchTerm.trim() === '') {
      return false;
    }

    const searchLower = debouncedSearchTerm.trim().toLowerCase();
    const searchNoTones = removeVietnameseTones(searchLower);

    const nameLower = teacher.HoTen?.toLowerCase() || '';
    const nameNoTones = removeVietnameseTones(nameLower);
    const codeLower = teacher.MaGiangVien?.toLowerCase() || '';
    const emailLower = teacher.Email?.toLowerCase() || '';
    const facultyNameLower = teacher.TenKhoa?.toLowerCase() || '';
    const facultyNameNoTones = removeVietnameseTones(facultyNameLower);

    const matchesSearch =
      nameLower.includes(searchLower) ||
      nameNoTones.includes(searchNoTones) ||
      codeLower.includes(searchLower) ||
      emailLower.includes(searchLower) ||
      facultyNameLower.includes(searchLower) ||
      facultyNameNoTones.includes(searchNoTones);

    const matchesFaculty = !filters.facultyFilter || teacher.MaKhoa === filters.facultyFilter;
    const matchesStatus = !filters.statusFilter || teacher.TrangThai === filters.statusFilter;

    return matchesSearch && matchesFaculty && matchesStatus;
  });

  const handleSearch = () => {
    setSearchTerm(displaySearchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setDisplaySearchTerm('');
  };

  const handleApplyFilters = () => {
    setFilters({ ...displayFilters });
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({ facultyFilter: '', statusFilter: '' });
    setDisplayFilters({ facultyFilter: '', statusFilter: '' });
    setSearchTerm('');
    setDisplaySearchTerm('');
  };

  const activeFilterCount = (filters.facultyFilter ? 1 : 0) + (filters.statusFilter ? 1 : 0) + (searchTerm.trim() ? 1 : 0);
  const hasActiveFilters = filters.facultyFilter || filters.statusFilter || searchTerm.trim();

  if (loading) {
    return <TableSkeleton columns={6} rows={6} />;
  }

  return (
    <div className="space-y-8 p-4 max-w-screen-3xl mx-auto w-full">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 shadow-xl shadow-orange-500/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-white">
            <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Users className="w-8 h-8" />
              Quản lý giảng viên
            </h2>
            <p className="text-orange-100 text-lg">Thêm, sửa và xem chi tiết thông tin giảng viên</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExportTeachers}
              className="flex items-center gap-2 bg-white text-orange-600 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
            >
              <Download className="w-5 h-5" />
              Export
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setEditingTeacher(null); setFormData({ MaGiangVien: '', HoTen: '', Email: '', SoDienThoai: '', MaKhoa: '', TrangThai: 'Đang dạy' }); setShowModal(true); }}
              className="flex items-center gap-2 bg-white text-orange-600 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Thêm giảng viên
            </motion.button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm giảng viên theo tên, mã, email hoặc khoa..."
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
              className={`relative flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${hasActiveFilters
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
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Lọc theo trạng thái</label>
                <select
                  value={displayFilters.statusFilter}
                  onChange={(e) => setDisplayFilters({ ...displayFilters, statusFilter: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors text-gray-700"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="Đang dạy">Đang dạy</option>
                  <option value="Tạm nghỉ">Tạm nghỉ</option>
                  <option value="Nghỉ việc">Nghỉ việc</option>
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
                onClick={() => setDisplayFilters({ facultyFilter: '', statusFilter: '' })}
                className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Đặt lại
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-xl border border-orange-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-orange-50 to-orange-100">
              <tr>
                <th className="text-left py-5 px-6 text-sm font-bold text-orange-700 uppercase tracking-wider">Giảng viên</th>
                <th className="text-left py-5 px-6 text-sm font-bold text-orange-700 uppercase tracking-wider">Khoa</th>
                <th className="text-left py-5 px-6 text-sm font-bold text-orange-700 uppercase tracking-wider">Liên hệ</th>
                <th className="text-left py-5 px-6 text-sm font-bold text-orange-700 uppercase tracking-wider">Trạng thái</th>
                <th className="text-center py-5 px-6 text-sm font-bold text-orange-700 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher, index) => (
                  <motion.tr
                    key={teacher.MaGiangVien}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-orange-50 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 transition-all cursor-pointer"
                    onClick={() => handleViewDetails(teacher)}
                  >
                    <td className="py-5 px-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-800 text-sm whitespace-nowrap">{teacher.HoTen}</span>
                        <span className="text-xs text-gray-400 font-mono mt-0.5 whitespace-nowrap">{teacher.MaGiangVien}</span>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <span
                        title={teacher.TenKhoa}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap"
                      >
                        {teacher.TenKhoa || 'Chưa xếp khoa'}
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex flex-col text-xs">
                        <span className="text-gray-700 whitespace-nowrap max-w-[180px] truncate" title={teacher.Email}>{teacher.Email || 'N/A'}</span>
                        <span className="text-gray-400 whitespace-nowrap mt-0.5">{teacher.SoDienThoai || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${teacher.TrangThai === 'Đang dạy'
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : teacher.TrangThai === 'Tạm nghỉ'
                            ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                            : 'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                        {teacher.TrangThai || 'Đang dạy'}
                      </span>
                    </td>
                    <td className="py-5 px-6" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEdit(teacher)}
                          className="p-3 bg-orange-100 text-orange-600 rounded-xl hover:bg-orange-200 transition-all shadow-sm"
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
                  <td colSpan="5" className="py-16">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Users className="w-16 h-16 mb-4 text-orange-200" />
                      <p className="text-lg font-medium text-gray-600">Không tìm thấy giảng viên nào</p>
                      <p className="text-sm text-gray-400 mt-1">Thử tìm kiếm với từ khóa hoặc bộ lọc khác</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal (Add / Edit) */}
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
                    <UserCheck className="w-5 h-5" />
                    {editingTeacher ? 'Cập nhật thông tin giảng viên' : 'Thêm giảng viên mới'}
                  </h3>
                  <p className="text-orange-100 text-sm mt-0.5">
                    {editingTeacher ? 'Chỉnh sửa hồ sơ giảng viên' : 'Tạo hồ sơ giảng viên theo khoa chuyên môn'}
                  </p>
                </div>
                <button onClick={handleCloseModal} className="p-2 hover:bg-white/20 rounded-lg text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="hidden" value={formData.MaGiangVien} />
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Họ tên</label>
                    <input
                      type="text"
                      value={formData.HoTen}
                      onChange={(e) => {
                        setFormData({ ...formData, HoTen: e.target.value });
                        if (errors.HoTen) setErrors({ ...errors, HoTen: '' });
                      }}
                      onBlur={(e) => {
                        const formatted = formatTitleCase(e.target.value.trim());
                        setFormData(prev => ({ ...prev, HoTen: formatted }));
                      }}
                      className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors ${errors.HoTen ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'
                        }`}
                    />
                    {errors.HoTen && <p className="text-red-500 text-xs mt-1">{errors.HoTen}</p>}
                  </div>

                  {/* Row 2: Khoa chuyên môn | Số điện thoại */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Khoa chuyên môn</label>
                    <select
                      value={formData.MaKhoa}
                      onChange={(e) => {
                        handleKhoaChange(e);
                        if (errors.MaKhoa) setErrors({ ...errors, MaKhoa: '' });
                      }}
                      className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors text-gray-700 ${errors.MaKhoa ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'
                        }`}
                    >
                      <option value="">Chọn khoa</option>
                      {uniqueFaculties.map((faculty) => (
                        <option key={faculty.MaKhoa} value={faculty.MaKhoa}>
                          {faculty.TenKhoa}
                        </option>
                      ))}
                    </select>
                    {errors.MaKhoa && <p className="text-red-500 text-sm mt-1">{errors.MaKhoa}</p>}
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
                      className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors ${errors.SoDienThoai ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'
                        }`}
                    />
                    {errors.SoDienThoai && <p className="text-red-500 text-xs mt-1">{errors.SoDienThoai}</p>}
                  </div>

                  {/* Row 3: Email | Trạng thái */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.Email}
                      onChange={(e) => {
                        setFormData({ ...formData, Email: e.target.value });
                        if (errors.Email) setErrors({ ...errors, Email: '' });
                      }}
                      className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors ${errors.Email ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'
                        }`}
                    />
                    {errors.Email && <p className="text-red-500 text-xs mt-1">{errors.Email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Trạng thái</label>
                    <select
                      value={formData.TrangThai}
                      onChange={(e) => setFormData({ ...formData, TrangThai: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors text-gray-700"
                    >
                      <option value="Đang dạy">Đang dạy</option>
                      <option value="Tạm nghỉ">Tạm nghỉ</option>
                      <option value="Nghỉ việc">Nghỉ việc</option>
                    </select>
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
                    {editingTeacher ? 'Lưu thay đổi' : 'Thêm giảng viên'}
                  </button>
                </div>
              </form>
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

      {/* Detail Modal */}
      {showDetailModal && selectedTeacher && (
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
                      {(teacherDetails?.HoTen || selectedTeacher.HoTen || 'GV')
                        .split(' ')
                        .map(w => w[0])
                        .filter(Boolean)
                        .slice(-2)
                        .join('')
                        .toUpperCase()}
                    </div>
                    <div>
                      <span className="text-orange-100 text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4" />
                        Chi tiết giảng viên
                      </span>
                      <h2 className="text-2xl font-bold text-white mt-1">{teacherDetails?.HoTen || selectedTeacher.HoTen}</h2>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-mono font-medium">{teacherDetails?.MaGiangVien || selectedTeacher.MaGiangVien}</span>
                        {teacherDetails?.TenKhoa && (
                          <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-medium">{teacherDetails.TenKhoa}</span>
                        )}
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
                    { id: 'info', label: 'Thông tin', icon: Users },
                    { id: 'schedule', label: 'Lịch giảng dạy', icon: Calendar },
                    { id: 'load', label: 'Tải công việc', icon: FileText }
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
                {detailTab === 'info' && teacherDetails && (
                  <div className="space-y-6">
                    {/* Stats cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Lớp dạy', value: teachingSchedule.length, icon: BookOpen, color: 'blue' },
                        { label: 'Môn học', value: [...new Set(teachingSchedule.map(s => s.TenMonHoc))].length, icon: BarChart3, color: 'green' },
                        { label: 'Tín chỉ', value: teachingLoad.reduce((sum, l) => sum + (parseInt(l.SoTinChi) || 0), 0), icon: Award, color: 'purple' },
                        { label: 'Ca/tuần', value: teachingSchedule.length, icon: Calendar, color: 'orange' },
                      ].map((card, i) => {
                        const Icon = card.icon;
                        const colorMap = {
                          blue: 'bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-300 hover:bg-blue-100/30',
                          green: 'bg-green-50 text-green-600 border-green-100 hover:border-green-300 hover:bg-green-100/30',
                          purple: 'bg-purple-50 text-purple-600 border-purple-100 hover:border-purple-300 hover:bg-purple-100/30',
                          orange: 'bg-orange-50 text-orange-600 border-orange-100 hover:border-orange-300 hover:bg-orange-100/30',
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

                    {/* Personal info */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Thông tin cá nhân</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          { label: 'Mã giảng viên', value: teacherDetails.MaGiangVien, icon: Award },
                          { label: 'Họ và tên', value: teacherDetails.HoTen, icon: UserCheck },
                          { label: 'Email', value: teacherDetails.Email, icon: Mail },
                          { label: 'Số điện thoại', value: teacherDetails.SoDienThoai, icon: Phone },
                          { label: 'Khoa trực thuộc', value: teacherDetails.TenKhoa, icon: Building2 },
                        ].map((item, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            whileHover={{ y: -2, boxShadow: '0 8px 30px rgb(0 0 0 / 0.04)', borderColor: 'rgb(254 215 170)' }}
                            className="flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-2xl p-4 transition-all duration-300"
                          >
                            {item.icon && (
                              <div className="bg-orange-100 rounded-xl p-2.5 text-orange-600 flex-shrink-0">
                                <item.icon className="w-5 h-5" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{item.label}</div>
                              <div className="font-semibold text-gray-800 text-sm mt-0.5 truncate" title={item.value || ''}>
                                {item.value || '—'}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {detailTab === 'schedule' && (
                  <ScheduleDetailView
                    schedule={teachingSchedule}
                    title="Lịch giảng dạy"
                    emptyMessage="Chưa có lịch giảng dạy nào"
                    showClass={true}
                    showHocKy={false}
                  />
                )}

                {detailTab === 'load' && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                      Tải công việc ({teachingLoad.length} môn)
                    </h4>
                    {teachingLoad.length > 0 ? (
                      <div className="overflow-x-auto rounded-2xl border border-orange-100">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gradient-to-r from-orange-50 to-orange-100">
                              <th className="text-left py-3.5 px-5 text-xs font-bold text-orange-700 uppercase tracking-wider">Môn học</th>
                              <th className="text-left py-3.5 px-5 text-xs font-bold text-orange-700 uppercase tracking-wider">Số tín chỉ</th>
                              <th className="text-left py-3.5 px-5 text-xs font-bold text-orange-700 uppercase tracking-wider">Lớp học</th>
                              <th className="text-left py-3.5 px-5 text-xs font-bold text-orange-700 uppercase tracking-wider">Học kỳ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {teachingLoad.map((load, index) => (
                              <motion.tr
                                key={index}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.03 }}
                                className="border-t border-gray-50 hover:bg-orange-50/40 transition-colors"
                              >
                                <td className="py-3.5 px-5 font-semibold text-gray-800 text-sm">{load.TenMonHoc}</td>
                                <td className="py-3.5 px-5">
                                  <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-md font-bold text-sm">{load.SoTinChi}</span>
                                </td>
                                <td className="py-3.5 px-5 text-sm text-gray-600">{load.TenLop}</td>
                                <td className="py-3.5 px-5 text-sm text-gray-600">{load.HocKy}</td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <FileText className="w-14 h-14 mb-3 text-gray-200" />
                        <p className="font-medium">Chưa có dữ liệu tải giảng dạy</p>
                      </div>
                    )}
                  </div>
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

function ScheduleSessionCard({ item, showClass = true, showHocKy = false }) {
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
        {showClass && item.TenLop && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1">
            <UserCheck className="w-3.5 h-3.5 text-orange-500" />
            {item.TenLop}
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
  showClass = true,
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
                  showClass={showClass}
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

export default TeacherManagement;
