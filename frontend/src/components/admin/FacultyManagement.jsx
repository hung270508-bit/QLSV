import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Building2, Plus, Search, X, Filter, XCircle, Users, BookOpen, BarChart3, GraduationCap, UserCheck, TrendingUp } from 'lucide-react';
import axios from 'axios';
import { TableSkeleton } from '../common/AdminSkeleton';
import ModalPortal, { Toast } from '../common/ModalPortal';
import Pagination from '../common/Pagination';
import API_URL from '../../api';

const API_BASE = `${API_URL}/api`;
function FacultyManagement() {
  const [faculties, setFaculties] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSecondConfirmModal, setShowSecondConfirmModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [displaySearchTerm, setDisplaySearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [showFilters, setShowFilters] = useState(false);
  const [formData, setFormData] = useState({
    MaKhoa: '',
    TenKhoa: '',
    TinChiYeuCau: 120
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
  const [detailLoading, setDetailLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

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
      setCurrentPage(1);
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
    if (value.length > 50) return 'Tên khoa không được quá 50 ký tự';
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

  const generateMaKhoa = (tenKhoa, existingFaculties = []) => {
    const words = removeVietnameseTones(
      tenKhoa.replace(/-/g, ' ')
    )
      .trim()
      .split(/\s+/)
      .filter(word => word);

    if (words.length === 0) return '';

    let baseCode = words.map(word => word.charAt(0)).join('').toUpperCase();
    
    const isDuplicate = existingFaculties.some(f => f.MaKhoa === baseCode);
    if (isDuplicate) {
      const lastWord = words[words.length - 1];
      if (lastWord && lastWord.length > 1) {
        baseCode += lastWord.charAt(1).toUpperCase();
      }
    }

    return baseCode;
  };

  const handleFacultyNameChange = (e) => {
    let value = e.target.value.replace(/\s+/g, ' ');
    setFormData({
      ...formData,
      TenKhoa: value,
      MaKhoa: generateMaKhoa(value, faculties)
    });
    setErrors(prev => ({ ...prev, TenKhoa: '' }));
  };

  // Gộp Logic Kiểm Tra & Báo Lỗi trước khi hiện Modal Confirm (FIX TC_08, TC_21, TC_22)
  const validateAndConfirm = () => {
    let tenKhoa = formatTitleCase(formData.TenKhoa.trim());
    let tinChiError = '';

    // Kiểm tra tính hợp lệ cơ bản
    const error = validateFacultyName(tenKhoa);
    const tinChi = parseInt(formData.TinChiYeuCau, 10);
    if (!formData.TinChiYeuCau || isNaN(tinChi) || tinChi < 120 || tinChi > 150) {
      tinChiError = 'Tín chỉ yêu cầu phải là số nguyên từ 120 đến 150';
    }

    if (error || tinChiError) {
      setErrors({ TenKhoa: error || '', TinChiYeuCau: tinChiError });
      return;
    }

    // Kiểm tra trùng lặp tên khoa
    const duplicateName = faculties.find(
      faculty =>
        faculty.TenKhoa.toLowerCase() === tenKhoa.toLowerCase()
    );

    if (duplicateName) {
      setErrors({ TenKhoa: 'Tên khoa đã tồn tại!', TinChiYeuCau: '' });
      return;
    }

    // Cập nhật lại chuỗi đã được chuẩn hóa (Viết hoa chữ cái đầu)
    setFormData(prev => ({
      ...prev,
      TenKhoa: tenKhoa,
      MaKhoa: generateMaKhoa(tenKhoa, faculties)
    }));

    setErrors({ TenKhoa: '', TinChiYeuCau: '' });
    setShowConfirmModal(true);
  };

  // Hàm gọi API khi nhấn CÓ trên Popup Confirm
  const executeSubmit = async () => {
    try {
      await axios.post(`${API_URL}/api/faculties`, formData);
      showToast('Thêm khoa thành công!', 'success');
      setShowConfirmModal(false);
      setShowSecondConfirmModal(false);
      handleCloseModal();
      fetchData(); // FIX TC_13: Real-time update danh sách
    } catch (error) {
      showToast(error.response?.data?.message || 'Có lỗi xảy ra!', 'error');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ MaKhoa: '', TenKhoa: '', TinChiYeuCau: 120 });
    setErrors({ TenKhoa: '', TinChiYeuCau: '' });
  };

  const handleViewDetails = async (faculty) => {
    setSelectedFaculty(faculty);
    setShowDetailModal(true);
    setDetailTab('teachers');
    setDetailLoading(true);
    try {
      const [teachersRes, studentsRes, classesRes] = await Promise.allSettled([
        axios.get(`${API_URL}/api/faculties/${faculty.MaKhoa}/teachers`),
        axios.get(`${API_URL}/api/faculties/${faculty.MaKhoa}/students`),
        axios.get(`${API_URL}/api/faculties/${faculty.MaKhoa}/classes`)
      ]);
      const teachers = teachersRes.status === 'fulfilled' ? teachersRes.value.data : [];
      const students = studentsRes.status === 'fulfilled' ? studentsRes.value.data : [];
      const classes = classesRes.status === 'fulfilled' ? classesRes.value.data : [];

      setFacultyTeachers(teachers);
      setFacultyStudents(students);
      setFacultyClasses(classes);
      setFacultyStats({
        totalTeachers: teachers.length,
        totalStudents: students.length,
        totalClasses: classes.length
      });
    } catch (error) {
      console.error('Error fetching faculty details:', error);
    } finally {
      setDetailLoading(false);
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
        const searchLower = debouncedSearchTerm.toLowerCase().trim();
        const searchNoTones = removeVietnameseTones(searchLower);
        const nameLower = f.TenKhoa.toLowerCase();
        const nameNoTones = removeVietnameseTones(nameLower);
        const codeLower = f.MaKhoa.toLowerCase();

        // If search term is completely empty (not just spaces), show all results
        if (debouncedSearchTerm === '') return true;
        // If search term is only spaces, show no results
        if (!searchLower) return false;

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
    setCurrentPage(1);
  };

  const handleApplyFilters = () => {
    setSortBy(displaySortBy);
    setShowFilters(false);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setSortBy('default');
    setDisplaySortBy('default');
    setCurrentPage(1);
  };

  const itemsPerPage = 10;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAndSortedFaculties.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAndSortedFaculties.length / itemsPerPage);

  const activeFilterCount = searchTerm ? 1 : 0;
  const hasActiveFilters = searchTerm;

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
        className="bg-[#F4C542] rounded-3xl p-8 shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="flex items-center gap-5 relative z-10">
          <div className="p-4 bg-white/40 rounded-2xl backdrop-blur-sm">
            <Building2 className="w-10 h-10 text-[#152238]" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-[#152238] mb-1">
              Quản lý khoa
            </h2>
            <p className="text-[#152238]/70 text-lg">Thêm thông tin khoa</p>
          </div>
        </div>
        <div className="relative z-10">
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#FFFFFF] text-[#F4C542] px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Thêm khoa
          </motion.button>
        </div>
        <Building2 className="absolute -right-6 -bottom-6 w-48 h-48 text-white opacity-10 transform rotate-12" />
      </motion.div>

      {/* Search and Filters */}
      <div className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-[#E5E7EB] p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-300 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc mã khoa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') handleClearSearch();
                if (e.key === 'Enter') setDebouncedSearchTerm(searchTerm); // FIX TC_18: Phím Enter tìm ngay
              }}
              className="w-full pl-11 pr-10 py-2.5 bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#F4C542] focus:ring-2 focus:ring-[#F4C542]/20 transition-all text-gray-700 font-medium placeholder:text-gray-300 placeholder:font-semibold"
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
            {/* Box Sắp xếp */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Sắp xếp theo tên</label>
                <select
                  value={displaySortBy}
                  onChange={(e) => setDisplaySortBy(e.target.value)}
                  className="w-full px-4 py-3 bg-[#FFFFFF] border-2 border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#F4C542] transition-colors text-gray-700"
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
                className="flex-1 bg-[#F4C542] text-[#152238] py-2.5 rounded-xl font-semibold hover:bg-[#F4C542]/90 transition-colors shadow-sm"
              >
                Áp dụng bộ lọc
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  setDisplaySortBy('default');
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Đặt lại
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Table View for Faculties */}
      <div className="bg-[#FFFFFF] rounded-2xl shadow-xl border border-[#FFF7D6] overflow-hidden">
        
        {/* Mobile View */}
        <div className="block sm:hidden divide-y divide-gray-50">
          {currentItems.length > 0 ? (
            currentItems.map((faculty) => (
              <div key={faculty.MaKhoa} className="p-4 hover:bg-[#FFF7D6]/20 transition-colors cursor-pointer flex justify-between items-center" onClick={() => handleViewDetails(faculty)}>
                <div>
                  <h4 className="font-bold text-[#1F2937] text-sm">{faculty.TenKhoa}</h4>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{faculty.MaKhoa} • TC: {faculty.TinChiYeuCau || 120}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm">Không tìm thấy khoa nào</div>
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-amber-50/80 to-amber-100/60 border-b border-[#FFF7D6]">
              <tr>
                <th className="text-left py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Mã khoa</th>
                <th className="text-left py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Tên khoa</th>
                <th className="text-left py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Tín chỉ y/c</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((faculty, index) => (
                  <motion.tr
                    key={faculty.MaKhoa}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-50 hover:bg-[#FFF7D6]/20 transition-colors cursor-pointer"
                    onClick={() => handleViewDetails(faculty)}
                  >
                    <td className="py-5 px-6">
                      <span className="font-semibold text-[#1F2937] text-sm whitespace-nowrap">{faculty.MaKhoa}</span>
                    </td>
                    <td className="py-5 px-6">
                      <span className="font-semibold text-[#1F2937] text-sm whitespace-nowrap">{faculty.TenKhoa}</span>
                    </td>
                    <td className="py-5 px-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg font-bold text-xs">{faculty.TinChiYeuCau || 120}</span>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="py-16">
                    <div className="flex flex-col items-center justify-center text-gray-300">
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
        
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modal CRUD */}
      {showModal && (
        <ModalPortal>
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#FFFFFF] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="bg-[#F4C542] px-6 py-5 flex justify-between items-center flex-shrink-0">
                <div className="text-white">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Thêm khoa mới
                  </h3>
                  <p className="text-[#152238]/70 text-sm mt-0.5">
                    Tạo khoa mới trong hệ thống
                  </p>
                </div>
                <button onClick={handleCloseModal} className="p-2 hover:bg-white/40 rounded-lg text-white">
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
                      setFormData(prev => ({ ...prev, TenKhoa: formatted, MaKhoa: generateMaKhoa(formatted, faculties) }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        validateAndConfirm(); // FIX TC_22: Enter kích hoạt validate và hiện confirm
                      }
                    }}
                    className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-colors ${errors.TenKhoa
                        ? 'border-red-500'
                        : 'border-[#E5E7EB] focus:border-[#F4C542]'
                      }`}
                  />

                  {errors.TenKhoa && (
                    <p className="mt-2 text-sm text-[#EF4444] font-medium">
                      {errors.TenKhoa}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tín chỉ yêu cầu
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="VD: 120"
                    value={formData.TinChiYeuCau}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*$/.test(val)) {
                        setFormData(prev => ({ ...prev, TinChiYeuCau: val }));
                      }
                    }}
                    onFocus={() => setErrors(prev => ({ ...prev, TinChiYeuCau: '' }))}
                    className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-colors ${errors.TinChiYeuCau ? 'border-red-500' : 'border-[#E5E7EB] focus:border-[#F4C542]'}`}
                  />
                  {errors.TinChiYeuCau && (
                    <p className="mt-2 text-sm text-[#EF4444] font-medium">
                      {errors.TinChiYeuCau}
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
                    className="flex-1 py-3 bg-[#F4C542] text-[#152238] font-semibold rounded-xl shadow-lg"
                  >
                    Thêm khoa
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </ModalPortal>
      )}

      {/* Modal xác nhận thêm */}
      {showConfirmModal && (
        <ModalPortal>
          <div className="fixed inset-0 flex items-center justify-center z-[60] p-4 backdrop-blur-sm bg-black/40">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#FFFFFF] rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <h3 className="text-xl font-bold text-[#1F2937] mb-2">Xác nhận</h3>
              <p className="text-[#6B7280] mb-6">Bạn có chắc chắn muốn thêm khoa <strong className="text-[#F4C542]">{formData.TenKhoa}</strong> không?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200"
                >
                  Không
                </button>
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setShowSecondConfirmModal(true);
                  }}
                  className="flex-1 px-4 py-2 bg-[#F4C542] text-[#152238] rounded-xl font-semibold hover:bg-[#F4C542]/90 shadow-lg"
                >
                  Có
                </button>
              </div>
            </motion.div>
          </div>
        </ModalPortal>
      )}

      {/* Modal xác nhận thêm lần 2 */}
      {showSecondConfirmModal && (
        <ModalPortal>
          <div className="fixed inset-0 flex items-center justify-center z-[60] p-4 backdrop-blur-sm bg-black/40">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#FFFFFF] rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <h3 className="text-xl font-bold text-[#1F2937] mb-2">Cảnh báo</h3>
              <p className="text-[#6B7280] mb-6">Hành động này sẽ không thể hoàn tác, khoa sẽ không chỉnh sửa hay xóa được.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSecondConfirmModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button
                  onClick={executeSubmit}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 shadow-lg"
                >
                  Tiếp tục
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
              className="bg-[#FFFFFF] rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="bg-[#F4C542] px-8 py-6 flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-[#FFFFFF]/10 backdrop-blur-md text-white border border-white/20 font-bold text-xl rounded-2xl w-16 h-16 flex items-center justify-center shadow-lg flex-shrink-0">
                      {(selectedFaculty.TenKhoa || 'KH')
                        .split(' ')
                        .map(w => w[0])
                        .filter(Boolean)
                        .slice(-2)
                        .join('')
                        .toUpperCase()}
                    </div>
                    <div>
                      <span className="text-[#152238]/70 text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5">
                        <Building2 className="w-4 h-4" />
                        Chi tiết khoa
                      </span>
                      <h2 className="text-2xl font-bold text-white mt-1">{selectedFaculty.TenKhoa}</h2>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="bg-white/40 text-white text-xs px-2.5 py-1 rounded-full font-mono font-medium">{selectedFaculty.MaKhoa}</span>
                      </div>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleCloseDetailModal}
                    className="bg-white/40 hover:bg-[#FFFFFF]/30 rounded-xl p-2 transition-colors"
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
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                          detailTab === tab.id
                            ? 'bg-[#FFFFFF] text-[#F4C542] shadow-md'
                            : 'text-white/70 hover:text-white hover:bg-[#FFFFFF]/10'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
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
                    {detailTab === 'teachers' && (
                      <div>
                    <h4 className="text-sm font-bold text-[#6B7280] uppercase tracking-wider mb-4">
                      Danh sách giảng viên ({facultyTeachers.length})
                    </h4>
                    {facultyTeachers.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {facultyTeachers.map((teacher, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ y: -2, boxShadow: '0 8px 30px rgb(0 0 0 / 0.04)', borderColor: 'rgb(254 215 170)' }}
                            className="flex items-center gap-3 bg-[#F7F8FA] rounded-xl p-4 border border-[#E5E7EB] hover:border-[#F4C542]/30 hover:bg-[#FFF7D6]/30 transition-all duration-300"
                          >
                            <div className="bg-[#FFF7D6] rounded-xl p-2 flex-shrink-0">
                              <UserCheck className="w-5 h-5 text-[#F4C542]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-[#1F2937] text-sm truncate">{teacher.HoTen}</div>
                              <div className="text-xs text-[#6B7280]">{teacher.MaGiangVien}</div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-gray-300">
                        <Users className="w-14 h-14 mb-3 text-gray-200" />
                        <p className="font-medium">Chưa có giảng viên nào</p>
                      </div>
                    )}
                  </div>
                )}

                {detailTab === 'students' && (
                  <div>
                    <h4 className="text-sm font-bold text-[#6B7280] uppercase tracking-wider mb-4">
                      Danh sách sinh viên ({facultyStudents.length})
                    </h4>
                    {facultyStudents.length > 0 ? (
                      <div className="overflow-x-auto rounded-2xl border border-[#FFF7D6]">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gradient-to-r from-amber-50 to-amber-100">
                              <th className="text-left py-3.5 px-5 text-xs font-bold text-[#152238] uppercase tracking-wider">MSSV</th>
                              <th className="text-left py-3.5 px-5 text-xs font-bold text-[#152238] uppercase tracking-wider">Họ tên</th>
                              <th className="text-left py-3.5 px-5 text-xs font-bold text-[#152238] uppercase tracking-wider">Giới tính</th>
                              <th className="text-left py-3.5 px-5 text-xs font-bold text-[#152238] uppercase tracking-wider">Lớp</th>
                            </tr>
                          </thead>
                          <tbody>
                            {facultyStudents.map((student, index) => (
                              <motion.tr
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="border-t border-gray-50 hover:bg-[#FFF7D6]/40 transition-colors"
                              >
                                <td className="py-3.5 px-5 font-semibold text-[#1F2937] text-sm">{student.MSSV}</td>
                                <td className="py-3.5 px-5 text-sm text-[#6B7280]">{student.HoTen}</td>
                                <td className="py-3.5 px-5">
                                  <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${student.GioiTinh === 'Nam' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                                    }}`}>
                                    {student.GioiTinh || '—'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-5 text-sm text-[#6B7280]">{student.TenLop || '—'}</td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-gray-300">
                        <GraduationCap className="w-14 h-14 mb-3 text-gray-200" />
                        <p className="font-medium">Chưa có sinh viên nào</p>
                      </div>
                    )}
                  </div>
                )}

                {detailTab === 'classes' && (
                  <div>
                    <h4 className="text-sm font-bold text-[#6B7280] uppercase tracking-wider mb-4">
                      Danh sách lớp học ({facultyClasses.length})
                    </h4>
                    {facultyClasses.length > 0 ? (
                      <div className="overflow-x-auto rounded-2xl border border-[#FFF7D6]">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gradient-to-r from-amber-50 to-amber-100">
                              <th className="text-left py-3.5 px-5 text-xs font-bold text-[#152238] uppercase tracking-wider">Mã lớp</th>
                              <th className="text-left py-3.5 px-5 text-xs font-bold text-[#152238] uppercase tracking-wider">Tên lớp</th>
                              <th className="text-left py-3.5 px-5 text-xs font-bold text-[#152238] uppercase tracking-wider">Số sinh viên</th>
                            </tr>
                          </thead>
                          <tbody>
                            {facultyClasses.map((cls, index) => (
                              <motion.tr
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="border-t border-gray-50 hover:bg-[#FFF7D6]/40 transition-colors"
                              >
                                <td className="py-3.5 px-5 font-semibold text-[#1F2937] text-sm">{cls.MaLop}</td>
                                <td className="py-3.5 px-5 text-sm text-[#6B7280]">{cls.TenLop}</td>
                                <td className="py-3.5 px-5">
                                  <span className="bg-[#F4C542]/20 text-[#B45309] px-2.5 py-1 rounded-md font-bold text-sm">{cls.SoSinhVien || 0} SV</span>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-gray-300">
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
                          blue: 'bg-[#3B82F6]/10 text-[#3B82F6] border-blue-100 hover:border-blue-300 hover:bg-blue-100/30',
                          green: 'bg-[#22C55E]/10 text-[#22C55E] border-green-100 hover:border-green-300 hover:bg-[#22C55E]/20/30',
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
                              <div className="p-2 bg-[#FFFFFF] rounded-xl shadow-sm">
                                <Icon className="w-5 h-5 opacity-90" />
                              </div>
                            </div>
                            <div className="text-sm font-semibold opacity-70 mt-3 uppercase tracking-wider">{card.label}</div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Summary card */}
                    <div className="bg-gradient-to-br from-[#F4C542] to-[#F4C542]/90 rounded-2xl p-6 text-center text-white">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-80" />
                      <div className="text-5xl font-bold mb-1">{facultyStats.totalStudents > 0 ? Math.round(facultyStats.totalTeachers / facultyStats.totalStudents * 10) / 10 : 0}</div>
                      <div className="text-[#152238]/70 font-medium">Tỷ lệ giảng viên/sinh viên</div>
                      <div className="text-amber-200 text-sm mt-1">Trung bình mỗi giảng viên phụ trách {facultyStats.totalTeachers > 0 ? Math.round(facultyStats.totalStudents / facultyStats.totalTeachers) : 0} sinh viên</div>
                    </div>
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

export default FacultyManagement;
