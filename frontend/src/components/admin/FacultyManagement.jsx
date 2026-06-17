import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Building2, Plus, Edit, Search, X, Filter, XCircle, Users, BookOpen, BarChart3, GraduationCap, UserCheck, TrendingUp } from 'lucide-react';
import axios from 'axios';
import { TableSkeleton } from '../common/AdminSkeleton';
import ModalPortal, { Toast } from '../common/ModalPortal';
import API_URL from '../../api';

const API_BASE = `${API_URL}/api`;
function FacultyManagement() {
  const [faculties, setFaculties] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [displaySearchTerm, setDisplaySearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ facultyFilter: '' });
  const [displayFilters, setDisplayFilters] = useState({ facultyFilter: '' });
  const [formData, setFormData] = useState({
    MaKhoa: '',
    TenKhoa: ''
  });
  const [errors, setErrors] = useState({
    TenKhoa: ''
  });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [facultyTeachers, setFacultyTeachers] = useState([]);
  const [facultyStudents, setFacultyStudents] = useState([]);
  const [facultyClasses, setFacultyClasses] = useState([]);
  const [displaySortBy, setDisplaySortBy] = useState('default');
  const [facultyStats, setFacultyStats] = useState({
    totalTeachers: 0,
    totalStudents: 0,
    totalClasses: 0
  });
  const [detailTab, setDetailTab] = useState('teachers');

  // Thêm state cho Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const removeVietnameseTones = (str) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  };

  // Hàm Format chuỗi lộn xộn thành Title Case (VD: "cƠ kHí" -> "Cơ Khí")
  const formatTitleCase = (str) => {
    return str.toLowerCase().split(' ').map(word => {
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
      const response = await axios.get(`${API_URL}/api/faculties`);
      setFaculties(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const validateFacultyName = (value) => {
    value = value.trim();
    if (!value) return 'Tên khoa không được để trống';
    // FIX TC_09: Yêu cầu từ 2 ký tự trở lên
    if (value.length < 2) return 'Tên khoa phải có ít nhất 2 ký tự';
    if (value.length > 30) return 'Tên khoa không được quá 30 ký tự';
    if (/\d/.test(value)) return 'Tên khoa không được chứa số';
    if (!/[A-Za-zÀ-ỹ]/.test(value)) return 'Tên khoa phải chứa ít nhất một chữ cái';
    if (!/^[A-Za-zÀ-ỹ\s-]+$/.test(value)) return 'Tên khoa không được chứa ký tự đặc biệt';
    if (/\s{2,}/.test(value)) return 'Chỉ được nhập 1 khoảng trắng giữa các từ';
    if (/--+/.test(value)) return 'Không được nhập nhiều dấu gạch nối liên tiếp';
    // Validate dash position: must be between two words
    if (value.includes('-')) {
      const parts = value.split('-');
      if (parts.length > 2) {
        return 'Tên khoa chỉ được phép có một dấu "-"';
      } else {
        const beforeDash = parts[0].trim();
        const afterDash = parts[1].trim();
        if (!beforeDash || !afterDash) {
          return 'Dấu "-" phải nằm giữa hai từ (VD: Toán - Văn)';
        }
      }
    }
    return '';
  };

  const generateMaKhoa = (tenKhoa) => {
    return removeVietnameseTones(
      tenKhoa.replace(/-/g, ' ')
    )
      .trim()
      .split(/\s+/)
      .filter(word => word)
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase();
  };

  const handleFacultyNameChange = (e) => {
    let value = e.target.value.replace(/\s+/g, ' ');
    setFormData({
      ...formData,
      TenKhoa: value
    });
    setErrors({ TenKhoa: '' });
  };

  // Gộp Logic Kiểm Tra & Báo Lỗi trước khi hiện Modal Confirm (FIX TC_08, TC_21, TC_22)
  const validateAndConfirm = () => {
    let tenKhoa = formatTitleCase(formData.TenKhoa.trim());

    // Kiểm tra tính hợp lệ cơ bản
    const error = validateFacultyName(tenKhoa);
    if (error) {
      setErrors({ TenKhoa: error });
      return;
    }

    // Kiểm tra trùng lặp tên khoa
    const duplicateName = faculties.find(
      faculty =>
        faculty.TenKhoa.toLowerCase() === tenKhoa.toLowerCase() &&
        (!editingFaculty || faculty.MaKhoa !== editingFaculty.MaKhoa)
    );

    if (duplicateName) {
      setErrors({ TenKhoa: 'Tên khoa đã tồn tại!' });
      return;
    }

    // Cập nhật lại chuỗi đã được chuẩn hóa (Viết hoa chữ cái đầu)
    setFormData(prev => ({
      ...prev,
      TenKhoa: tenKhoa,
      MaKhoa: generateMaKhoa(tenKhoa)
    }));

    setErrors({ TenKhoa: '' });
    setShowConfirmModal(true);
  };

  // Hàm gọi API khi nhấn CÓ trên Popup Confirm
  const executeSubmit = async () => {
    try {
      if (editingFaculty) {
        await axios.put(`${API_URL}/api/faculties/${editingFaculty.MaKhoa}`, formData);
      } else {
        await axios.post(`${API_URL}/api/faculties`, formData);
      }
      showToast(editingFaculty ? 'Cập nhật khoa thành công!' : 'Thêm khoa thành công!', 'success');
      setShowConfirmModal(false);
      handleCloseModal();
      fetchData(); // FIX TC_13: Real-time update danh sách
    } catch (error) {
      showToast(error.response?.data?.message || 'Có lỗi xảy ra!', 'error');
    }
  };

  const handleEdit = (faculty) => {
    setEditingFaculty(faculty);
    setFormData({
      MaKhoa: faculty.MaKhoa,
      TenKhoa: faculty.TenKhoa
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingFaculty(null);
    setFormData({ MaKhoa: '', TenKhoa: '' });
    setErrors({ TenKhoa: '' });
  };

  const handleViewDetails = async (faculty) => {
    setSelectedFaculty(faculty);
    setShowDetailModal(true);
    setDetailTab('teachers');
    try {
      const [teachersRes, studentsRes, classesRes] = await Promise.all([
        axios.get(`${API_URL}/api/faculties/${faculty.MaKhoa}/teachers`),
        axios.get(`${API_URL}/api/faculties/${faculty.MaKhoa}/students`),
        axios.get(`${API_URL}/api/faculties/${faculty.MaKhoa}/classes`)
      ]);
      setFacultyTeachers(teachersRes.data);
      setFacultyStudents(studentsRes.data);
      setFacultyClasses(classesRes.data);
      setFacultyStats({
        totalTeachers: teachersRes.data.length,
        totalStudents: studentsRes.data.length,
        totalClasses: classesRes.data.length
      });
    } catch (error) {
      console.error('Error fetching faculty details:', error);
    }
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedFaculty(null);
    setFacultyTeachers([]);
    setFacultyStudents([]);
    setFacultyClasses([]);
    setFacultyStats({ totalTeachers: 0, totalStudents: 0, totalClasses: 0 });
    setDetailTab('teachers');
  };

  const filteredAndSortedFaculties = [...faculties]
    .filter(f => {
      const searchLower = debouncedSearchTerm.toLowerCase();
      const searchNoTones = removeVietnameseTones(searchLower);
      const nameLower = f.TenKhoa.toLowerCase();
      const nameNoTones = removeVietnameseTones(nameLower);
      const codeLower = f.MaKhoa.toLowerCase();

      return nameLower.includes(searchLower) ||
        nameNoTones.includes(searchNoTones) ||
        codeLower.includes(searchLower);
    })
    .sort((a, b) => {
      if (sortBy === 'asc') return a.TenKhoa.localeCompare(b.TenKhoa);
      if (sortBy === 'desc') return b.TenKhoa.localeCompare(a.TenKhoa);
      return 0;
    });

  const handleClearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
  };

  const handleApplyFilters = () => {
    setFilters({ ...displayFilters });
    setSortBy(displaySortBy);
    setShowFilters(false);

  };

  const clearFilters = () => {
    setFilters({ facultyFilter: '' });
    setDisplayFilters({ facultyFilter: '' });
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setSortBy('default'); // Thêm dòng này
    setDisplaySortBy('default'); // Thêm dòng này
  };

  const activeFilterCount = (filters.facultyFilter ? 1 : 0) + (searchTerm ? 1 : 0);
  const hasActiveFilters = filters.facultyFilter || searchTerm;

  if (loading) {
    return <TableSkeleton columns={4} rows={5} />;
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
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">
              Quản lý khoa
            </h2>
            <p className="text-orange-100 text-lg">Thêm, sửa thông tin khoa</p>
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
            Thêm khoa
          </motion.button>
        </div>
        <Building2 className="absolute -right-6 -bottom-6 w-48 h-48 text-white opacity-10 transform rotate-12" />
      </motion.div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc mã khoa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') handleClearSearch();
                if (e.key === 'Enter') setDebouncedSearchTerm(searchTerm); // FIX TC_18: Phím Enter tìm ngay
              }}
              className="w-full pl-11 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-gray-700 font-medium placeholder:text-gray-400 placeholder:font-semibold"
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
            {/* Sử dụng grid để chia 2 cột */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Lọc theo khoa</label>
                <select
                  value={displayFilters.facultyFilter}
                  onChange={(e) => setDisplayFilters({ ...displayFilters, facultyFilter: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors text-gray-700"
                >
                  <option value="">Tất cả khoa</option>
                  {faculties.map((faculty) => (
                    <option key={faculty.MaKhoa} value={faculty.MaKhoa}>
                      {faculty.TenKhoa}
                    </option>
                  ))}
                </select>
              </div>

              {/* Thêm mới Box Sắp xếp */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Sắp xếp theo tên</label>
                <select
                  value={displaySortBy}
                  onChange={(e) => setDisplaySortBy(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors text-gray-700"
                >
                  <option value="default">Mặc định</option>
                  <option value="asc">Từ A - Z</option>
                  <option value="desc">Từ Z - A</option>
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
                onClick={() => {
                  setDisplayFilters({ facultyFilter: '' });
                  setDisplaySortBy('default'); // Đặt lại Select box sắp xếp
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
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
            <thead className="bg-gradient-to-r from-orange-50/80 to-orange-100/60 border-b border-orange-100">
              <tr>
                <th className="text-left py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Mã khoa</th>
                <th className="text-left py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Tên khoa</th>
                <th className="text-center py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedFaculties.length > 0 ? (
                filteredAndSortedFaculties.map((faculty, index) => (
                  <motion.tr
                    key={faculty.MaKhoa}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-50 hover:bg-orange-50/20 transition-colors cursor-pointer"
                    onClick={() => handleViewDetails(faculty)}
                  >
                    <td className="py-5 px-6">
                      <span className="font-semibold text-gray-800 text-sm whitespace-nowrap">{faculty.MaKhoa}</span>
                    </td>
                    <td className="py-5 px-6">
                      <span className="font-semibold text-gray-800 text-sm whitespace-nowrap">{faculty.TenKhoa}</span>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEdit(faculty)}
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
                  <td colSpan="3" className="py-16">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Building2 className="w-16 h-16 mb-4 text-gray-300" />
                      <p className="text-lg font-medium">Không tìm thấy khoa nào</p>
                      <p className="text-sm mt-2">Thử tìm kiếm với từ khóa khác</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal CRUD */}
      {showModal && (
        <ModalPortal>
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 flex justify-between items-center flex-shrink-0">
                <div className="text-white">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    {editingFaculty ? 'Cập nhật khoa' : 'Thêm khoa mới'}
                  </h3>
                  <p className="text-orange-100 text-sm mt-0.5">
                    {editingFaculty ? 'Chỉnh sửa thông tin khoa' : 'Tạo khoa mới trong hệ thống'}
                  </p>
                </div>
                <button onClick={handleCloseModal} className="p-2 hover:bg-white/20 rounded-lg text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="p-6 space-y-4 overflow-y-auto"
              >

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tên khoa
                  </label>

                  <input
                    type="text"
                    placeholder="Nhập tên khoa..."
                    value={formData.TenKhoa}
                    onChange={handleFacultyNameChange}
                    onFocus={() => setErrors({ TenKhoa: '' })}
                    onBlur={() => {
                      // FIX TC_12: Khi người dùng bấm ra ngoài ô nhập liệu, tự động chuẩn hóa viết hoa
                      const formatted = formatTitleCase(formData.TenKhoa.trim());
                      setFormData(prev => ({ ...prev, TenKhoa: formatted, MaKhoa: generateMaKhoa(formatted) }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        validateAndConfirm(); // FIX TC_22: Enter kích hoạt validate và hiện confirm
                      }
                    }}
                    className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-colors ${errors.TenKhoa
                        ? 'border-red-500'
                        : 'border-gray-200 focus:border-orange-500'
                      }`}
                  />

                  {errors.TenKhoa && (
                    <p className="mt-2 text-sm text-red-500 font-medium">
                      {errors.TenKhoa}
                    </p>
                  )}
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
                    type="button"
                    onClick={validateAndConfirm}
                    className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-lg"
                  >
                    {editingFaculty ? 'Lưu thay đổi' : 'Thêm khoa'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </ModalPortal>
      )}

      {/* Modal xác nhận thêm/sửa */}
      {showConfirmModal && (
        <ModalPortal>
          <div className="fixed inset-0 flex items-center justify-center z-[60] p-4 backdrop-blur-sm bg-black/40">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-2">Xác nhận</h3>
              <p className="text-gray-600 mb-6">Bạn có chắc chắn muốn {editingFaculty ? 'cập nhật' : 'thêm'} khoa <strong className="text-orange-600">{formData.TenKhoa}</strong> không?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200"
                >
                  Không
                </button>
                <button
                  onClick={executeSubmit}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 shadow-lg"
                >
                  Có
                </button>
              </div>
            </motion.div>
          </div>
        </ModalPortal>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedFaculty && (
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
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-6 flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/10 backdrop-blur-md text-white border border-white/20 font-bold text-xl rounded-2xl w-16 h-16 flex items-center justify-center shadow-lg flex-shrink-0">
                      {(selectedFaculty.TenKhoa || 'KH')
                        .split(' ')
                        .map(w => w[0])
                        .filter(Boolean)
                        .slice(-2)
                        .join('')
                        .toUpperCase()}
                    </div>
                    <div>
                      <span className="text-orange-100 text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5">
                        <Building2 className="w-4 h-4" />
                        Chi tiết khoa
                      </span>
                      <h2 className="text-2xl font-bold text-white mt-1">{selectedFaculty.TenKhoa}</h2>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-mono font-medium">{selectedFaculty.MaKhoa}</span>
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
                    { id: 'teachers', label: 'Giảng viên', icon: Users },
                    { id: 'students', label: 'Sinh viên', icon: GraduationCap },
                    { id: 'classes', label: 'Lớp học', icon: BookOpen },
                    { id: 'stats', label: 'Thống kê', icon: BarChart3 }
                  ].map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setDetailTab(tab.id)}
                        className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all z-10 ${detailTab === tab.id
                            ? 'text-orange-600'
                            : 'text-white/70 hover:text-white hover:bg-white/10'
                          }`}
                      >
                        {detailTab === tab.id && (
                          <motion.div
                            layoutId="activeDetailTab"
                            className="absolute inset-0 bg-white rounded-xl shadow-md -z-10"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                        <Icon className="w-4 h-4 z-10" />
                        <span className="z-10">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {detailTab === 'teachers' && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                      Danh sách giảng viên ({facultyTeachers.length})
                    </h4>
                    {facultyTeachers.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {facultyTeachers.map((teacher, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.06 }}
                            whileHover={{ y: -2, boxShadow: '0 8px 30px rgb(0 0 0 / 0.04)', borderColor: 'rgb(254 215 170)' }}
                            className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all duration-300"
                          >
                            <div className="bg-orange-100 rounded-xl p-2 flex-shrink-0">
                              <UserCheck className="w-5 h-5 text-orange-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-800 text-sm truncate">{teacher.HoTen}</div>
                              <div className="text-xs text-gray-500">{teacher.MaGiangVien}</div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <Users className="w-14 h-14 mb-3 text-gray-200" />
                        <p className="font-medium">Chưa có giảng viên nào</p>
                      </div>
                    )}
                  </div>
                )}

                {detailTab === 'students' && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                      Danh sách sinh viên ({facultyStudents.length})
                    </h4>
                    {facultyStudents.length > 0 ? (
                      <div className="overflow-x-auto rounded-2xl border border-orange-100">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gradient-to-r from-orange-50 to-orange-100">
                              <th className="text-left py-3.5 px-5 text-xs font-bold text-orange-700 uppercase tracking-wider">MSSV</th>
                              <th className="text-left py-3.5 px-5 text-xs font-bold text-orange-700 uppercase tracking-wider">Họ tên</th>
                              <th className="text-left py-3.5 px-5 text-xs font-bold text-orange-700 uppercase tracking-wider">Giới tính</th>
                              <th className="text-left py-3.5 px-5 text-xs font-bold text-orange-700 uppercase tracking-wider">Lớp</th>
                            </tr>
                          </thead>
                          <tbody>
                            {facultyStudents.map((student, index) => (
                              <motion.tr
                                key={index}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.03 }}
                                className="border-t border-gray-50 hover:bg-orange-50/40 transition-colors"
                              >
                                <td className="py-3.5 px-5 font-semibold text-gray-800 text-sm">{student.MSSV}</td>
                                <td className="py-3.5 px-5 text-sm text-gray-600">{student.HoTen}</td>
                                <td className="py-3.5 px-5">
                                  <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${student.GioiTinh === 'Nam' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                                    }}`}>
                                    {student.GioiTinh || '—'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-5 text-sm text-gray-600">{student.TenLop || '—'}</td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <GraduationCap className="w-14 h-14 mb-3 text-gray-200" />
                        <p className="font-medium">Chưa có sinh viên nào</p>
                      </div>
                    )}
                  </div>
                )}

                {detailTab === 'classes' && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                      Danh sách lớp học ({facultyClasses.length})
                    </h4>
                    {facultyClasses.length > 0 ? (
                      <div className="overflow-x-auto rounded-2xl border border-orange-100">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gradient-to-r from-orange-50 to-orange-100">
                              <th className="text-left py-3.5 px-5 text-xs font-bold text-orange-700 uppercase tracking-wider">Mã lớp</th>
                              <th className="text-left py-3.5 px-5 text-xs font-bold text-orange-700 uppercase tracking-wider">Tên lớp</th>
                              <th className="text-left py-3.5 px-5 text-xs font-bold text-orange-700 uppercase tracking-wider">Số sinh viên</th>
                            </tr>
                          </thead>
                          <tbody>
                            {facultyClasses.map((cls, index) => (
                              <motion.tr
                                key={index}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.03 }}
                                className="border-t border-gray-50 hover:bg-orange-50/40 transition-colors"
                              >
                                <td className="py-3.5 px-5 font-semibold text-gray-800 text-sm">{cls.MaLop}</td>
                                <td className="py-3.5 px-5 text-sm text-gray-600">{cls.TenLop}</td>
                                <td className="py-3.5 px-5">
                                  <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-md font-bold text-sm">{cls.SoSinhVien || 0} SV</span>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <BookOpen className="w-14 h-14 mb-3 text-gray-200" />
                        <p className="font-medium">Chưa có lớp nào</p>
                      </div>
                    )}
                  </div>
                )}

                {detailTab === 'stats' && (
                  <div className="space-y-6">
                    {/* Stats cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        { label: 'Giảng viên', value: facultyStats.totalTeachers, icon: Users, color: 'blue' },
                        { label: 'Sinh viên', value: facultyStats.totalStudents, icon: GraduationCap, color: 'green' },
                        { label: 'Lớp học', value: facultyStats.totalClasses, icon: BookOpen, color: 'purple' },
                      ].map((card, i) => {
                        const Icon = card.icon;
                        const colorMap = {
                          blue: 'bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-300 hover:bg-blue-100/30',
                          green: 'bg-green-50 text-green-600 border-green-100 hover:border-green-300 hover:bg-green-100/30',
                          purple: 'bg-purple-50 text-purple-600 border-purple-100 hover:border-purple-300 hover:bg-purple-100/30',
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

                    {/* Summary card */}
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-center text-white">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-80" />
                      <div className="text-5xl font-bold mb-1">{facultyStats.totalStudents > 0 ? Math.round(facultyStats.totalTeachers / facultyStats.totalStudents * 10) / 10 : 0}</div>
                      <div className="text-orange-100 font-medium">Tỷ lệ giảng viên/sinh viên</div>
                      <div className="text-orange-200 text-sm mt-1">Trung bình mỗi giảng viên phụ trách {facultyStats.totalTeachers > 0 ? Math.round(facultyStats.totalStudents / facultyStats.totalTeachers) : 0} sinh viên</div>
                    </div>
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

export default FacultyManagement;
