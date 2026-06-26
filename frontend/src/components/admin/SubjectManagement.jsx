import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Plus, Trash2, Search, X, Filter, 
  XCircle, Eye, Users, BarChart3, ChevronLeft, ChevronRight,
  Award, TrendingUp, AlertCircle, CheckCircle, UserCheck
} from 'lucide-react';
import axios from 'axios';
import { TableSkeleton } from '../common/AdminSkeleton';
import ModalPortal, { Toast, ConfirmDialog, SuccessDialog, ErrorDialog } from '../common/ModalPortal';
import Pagination from '../common/Pagination';
import ConfirmDeleteModal from '../common/ConfirmDeleteModal';
import API_URL from '../../api';

const API_BASE = `${API_URL}/api`;

function SubjectManagement() {
  const [faculties, setFaculties] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // States cho Search và Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [displaySearchTerm, setDisplaySearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ facultyFilter: '' });
  const [displayFilters, setDisplayFilters] = useState({ facultyFilter: '' });

  // States cho Phân trang (Pagination)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // States cho Chi tiết môn học
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectClasses, setSubjectClasses] = useState([]);
  const [subjectTeachers, setSubjectTeachers] = useState([]);
  const [subjectGradeStats, setSubjectGradeStats] = useState({
    totalGrades: 0,
    average: 0,
    excellent: 0,
    good: 0,
    averageGrade: 0,
    fail: 0
  });
  const [detailTab, setDetailTab] = useState('classes'); // 'classes', 'teachers', 'stats'
  
  const [formData, setFormData] = useState({
    MaMonHoc: '',
    TenMonHoc: '',
    SoTinChi: '',
    TenKhoa: ''
  });
  const [deleteModal, setDeleteModal] = useState({ show: false, subject: null });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, message: '', onConfirm: null, title: 'Xác nhận' });

  // Validation states
  const [formErrors, setFormErrors] = useState({
    MaKhoa: '',
    TenMonHoc: '',
    SoTinChi: ''
  });

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Dialog states
  const [successDialog, setSuccessDialog] = useState({ show: false, message: '' });
  const [errorDialog, setErrorDialog] = useState({ show: false, message: '' });

  // Vietnamese diacritic removal for search
  const removeVietnameseTones = useCallback((str) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }, []);

  // Tự động viết hoa chữ cái đầu tiên của mỗi từ (Title Case)
  const capitalizeWords = useCallback((str) => {
    if (!str) return '';
    return str
      .split(/\s+/)
      .map(word => {
        if (word.length === 0) return '';
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
  try {
    const [subjectsRes, facultiesRes] = await Promise.all([
      axios.get(`${API_BASE}/subjects`),
      axios.get(`${API_BASE}/faculties`)
    ]);
    setSubjects(subjectsRes.data);
    setFaculties(facultiesRes.data);
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    loading && setLoading(false);
  }
};

  const validateForm = (data = formData) => {
    const errors = {
      MaKhoa: '',
      TenMonHoc: '',
      SoTinChi: ''
    };
    let isValid = true;

    if (!data.MaKhoa) {
      errors.MaKhoa = 'Vui lòng chọn khoa';
      isValid = false;
    }

    if (!data.TenMonHoc.trim()) {
      errors.TenMonHoc = 'Vui lòng nhập tên môn học';
      isValid = false;
    } else if (data.TenMonHoc.trim().length < 3) {
      errors.TenMonHoc = 'Tên môn học phải có ít nhất 3 ký tự';
      isValid = false;
    } else if (data.TenMonHoc.trim().length > 30) {
      errors.TenMonHoc = 'Tên môn học không được vượt quá 30 ký tự';
      isValid = false;
    } else if (/\d/.test(data.TenMonHoc)) {
      errors.TenMonHoc = 'Tên môn học không được chứa số';
      isValid = false;
    } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(data.TenMonHoc)) {
      errors.TenMonHoc = 'Tên môn học không được chứa ký tự đặc biệt';
      isValid = false;
    } else if (/\s{2,}/.test(data.TenMonHoc)) {
      errors.TenMonHoc = 'Tên môn học không được chứa nhiều khoảng trắng liên tiếp';
      isValid = false;
    } else {
      // Check for duplicate subject name
      const duplicateSubject = subjects.find(
        subject => subject.TenMonHoc.toLowerCase() === data.TenMonHoc.trim().toLowerCase()
      );
      if (duplicateSubject) {
        errors.TenMonHoc = 'Tên môn học đã tồn tại!';
        isValid = false;
      }
    }

    if (!data.SoTinChi) {
      errors.SoTinChi = 'Vui lòng nhập số tín chỉ';
      isValid = false;
    } else {
      const credits = Number(data.SoTinChi);
      if (isNaN(credits)) {
        errors.SoTinChi = 'Số tín chỉ phải là số';
        isValid = false;
      } else if (!Number.isInteger(credits)) {
        errors.SoTinChi = 'Số tín chỉ phải là số nguyên';
        isValid = false;
      } else if (credits < 1) {
        errors.SoTinChi = 'Số tín chỉ phải lớn hơn 0';
        isValid = false;
      } else if (credits > 9) {
        errors.SoTinChi = 'Số tín chỉ không được vượt quá 9';
        isValid = false;
      }
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formattedName = capitalizeWords(formData.TenMonHoc.trim());
    const updatedFormData = { ...formData, TenMonHoc: formattedName };
    setFormData(updatedFormData);

    if (!validateForm(updatedFormData)) {
      return;
    }

    setConfirmDialog({
      show: true,
      title: 'Xác nhận thêm môn học',
      message: `Bạn có chắc chắn muốn thêm môn học "${formattedName}" không?`,
      onConfirm: async () => {
        setIsSubmitting(true);
        try {
          const resCode = await axios.get(`${API_BASE}/subjects/next-code/${updatedFormData.MaKhoa}`);
          await axios.post(`${API_BASE}/subjects`, { ...updatedFormData, MaMonHoc: resCode.data.MaMonHoc });
          setToast({ show: true, message: 'Thêm môn học mới thành công!', type: 'success' });
          fetchData();
          handleCloseModal();
        } catch (error) {
          console.error('Error saving subject:', error);
          const errorMessage = error.response?.data?.message || 'Lỗi khi lưu môn học!';
          setErrorDialog({ show: true, message: errorMessage });
        } finally {
          setIsSubmitting(false);
        }
      }
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ MaMonHoc: '', TenMonHoc: '', SoTinChi: '', MaKhoa: '' });
    setFormErrors({ MaKhoa: '', TenMonHoc: '', SoTinChi: '' });
  };

  const handleDelete = (subject) => {
    setDeleteModal({ show: true, subject });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.subject) return;
    const subjectToDelete = deleteModal.subject;
    setDeleteModal({ show: false, subject: null });
    setConfirmDialog({
      show: true,
      message: 'Bạn có chắc chắn muốn xóa môn học này không?',
      onConfirm: async () => {
        try {
          await axios.delete(`${API_BASE}/subjects/${subjectToDelete.MaMonHoc}`);
          setSubjects(prev => prev.filter(s => s.MaMonHoc !== subjectToDelete.MaMonHoc));
          setToast({ show: true, message: 'Xóa môn học thành công!', type: 'success' });
          setConfirmDialog({ show: false, message: '', onConfirm: null });
        } catch (error) {
          console.error('Error deleting subject:', error);
          const errorMessage = error.response?.data?.message || 'Lỗi khi xóa môn học!';
          setErrorDialog({ show: true, message: errorMessage });
          setConfirmDialog({ show: false, message: '', onConfirm: null });
        }
      }
    });
  };

  const handleKhoaChange = async (e) => {
    const maKhoa = e.target.value;
    setFormData(prev => ({ ...prev, MaKhoa: maKhoa, MaMonHoc: '' }));
    if (formErrors.MaKhoa) setFormErrors(prev => ({ ...prev, MaKhoa: '' }));
    if (!maKhoa) return;
    try {
      const res = await axios.get(`${API_BASE}/subjects/next-code/${maKhoa}`);
      setFormData(prev => ({ ...prev, MaKhoa: maKhoa, MaMonHoc: res.data.MaMonHoc }));
    } catch (err) {
      console.error('Lỗi tạo mã môn học:', err);
    }
  };
  const handleViewDetails = async (subject) => {
    setSelectedSubject(subject);
    setShowDetailModal(true);
    setDetailTab('classes');
    
    try {
      const [classesRes, teachersRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/subjects/${subject.MaMonHoc}/classes`),
        axios.get(`${API_BASE}/subjects/${subject.MaMonHoc}/teachers`),
        axios.get(`${API_BASE}/subjects/${subject.MaMonHoc}/grade-stats`)
      ]);
      
      setSubjectClasses(classesRes.data);
      setSubjectTeachers(teachersRes.data);
      setSubjectGradeStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching subject details:', error);
    }
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedSubject(null);
    setSubjectClasses([]);
    setSubjectTeachers([]);
    setSubjectGradeStats({
      totalGrades: 0,
      average: 0,
      excellent: 0,
      good: 0,
      averageGrade: 0,
      fail: 0
    });
    setDetailTab('classes');
  };

  const filteredSubjects = subjects.filter(subject => {
  if (debouncedSearchTerm.length > 0 && debouncedSearchTerm.trim() === '') return false;
  const searchLower = debouncedSearchTerm.toLowerCase();
  const searchNoTones = removeVietnameseTones(searchLower);
  const nameLower = subject.TenMonHoc?.toLowerCase() || '';
  const nameNoTones = removeVietnameseTones(nameLower);
  const codeLower = subject.MaMonHoc?.toLowerCase() || '';
  
  const matchesSearch =
    nameLower.includes(searchLower) ||
    nameNoTones.includes(searchNoTones) ||
    codeLower.includes(searchLower);
  const matchesFaculty = !filters.facultyFilter || subject.MaKhoa === filters.facultyFilter;
  return matchesSearch && matchesFaculty;
});

  // Logic Phân trang
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSubjects.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage);

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
  setFilters({ facultyFilter: '' });
  setDisplayFilters({ facultyFilter: '' });
  setSearchTerm('');
  setDisplaySearchTerm('');
  setCurrentPage(1);
};

const activeFilterCount = (filters.facultyFilter ? 1 : 0) + (searchTerm ? 1 : 0);
const hasActiveFilters = filters.facultyFilter || searchTerm;

  if (loading) {
    return <TableSkeleton columns={5} rows={6} />;
  }

  return (
    <div className="space-y-8 bg-[#F7F8FA]/50 p-4 rounded-2xl">
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
            <BookOpen className="w-10 h-10 text-[#152238]" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-[#152238] mb-1">
              Quản lý môn học
            </h2>
            <p className="text-[#152238]/70 text-lg">Thêm và xem chi tiết thông tin môn học</p>
          </div>
        </div>
        <div className="relative z-10">
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(249,115,22,0.2)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setFormErrors({ MaKhoa: '', TenMonHoc: '', SoTinChi: '' });
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-[#FFFFFF] text-[#F4C542] px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Thêm môn học
          </motion.button>
        </div>
        <BookOpen className="absolute -right-6 -bottom-6 w-48 h-48 text-white opacity-10 transform rotate-12" />
      </motion.div>

      {/* Search and Filters */}
      <div className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-[#E5E7EB] p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-300 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm môn học theo mã hoặc tên..."
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
                  ? 'bg-[#F4C542] text-[#152238] shadow-lg shadow-amber-100'
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
                onClick={() => setDisplayFilters({ facultyFilter: '' })}
                className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Đặt lại
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Table & Pagination */}
      <div className="bg-[#FFFFFF] rounded-2xl shadow-xl border border-[#E5E7EB] overflow-hidden">
        
        {/* Mobile View */}
        <div className="block sm:hidden divide-y divide-gray-100">
          {currentItems.length > 0 ? (
            currentItems.map((subject, index) => (
              <div key={subject.MaMonHoc} className="p-4 hover:bg-[#FFF7D6]/20 transition-colors cursor-pointer" onClick={() => handleViewDetails(subject)}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-[#1F2937] text-sm">{subject.TenMonHoc}</h4>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{subject.MaMonHoc}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(subject); }} className="p-2 bg-red-100 text-[#DC2626] rounded-xl hover:bg-red-200 transition-all shadow-sm border border-red-200 shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#F4C542]/20 text-[#B45309] border border-[#FFF7D6]">
                    {subject.SoTinChi} tín chỉ
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm">Không tìm thấy môn học nào</div>
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-amber-50 to-amber-100/40">
              <tr>
                <th className="text-left py-5 px-6 text-sm font-bold text-[#152238] uppercase tracking-wider">Môn học</th>
                <th className="text-left py-5 px-6 text-sm font-bold text-[#152238] uppercase tracking-wider">Số tín chỉ</th>
                <th className="text-center py-5 px-6 text-sm font-bold text-[#152238] uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((subject, index) => (
                  <motion.tr
                    key={subject.MaMonHoc}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-[#E5E7EB] hover:bg-[#FFF7D6]/20 transition-colors cursor-pointer"
                    onClick={() => handleViewDetails(subject)}
                  >
                    <td className="py-5 px-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#1F2937] text-sm whitespace-nowrap">{subject.TenMonHoc}</span>
                        <span className="text-xs text-gray-300 font-mono mt-0.5 whitespace-nowrap">{subject.MaMonHoc}</span>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#F4C542]/20 text-[#B45309] border border-[#FFF7D6] whitespace-nowrap">
                        {subject.SoTinChi} tín chỉ
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(subject)}
                          className="p-3 bg-red-100 text-[#DC2626] rounded-xl hover:bg-red-200 transition-all shadow-sm border border-red-200"
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
                  <td colSpan="3" className="py-16">
                    <div className="flex flex-col items-center justify-center text-gray-300">
                      <BookOpen className="w-16 h-16 mb-4 text-amber-200" />
                      <p className="text-lg font-medium">Không tìm thấy môn học nào</p>
                      <p className="text-sm mt-2">Thử tìm kiếm hoặc đổi bộ lọc khác</p>
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

      {/* Modal Thêm/Sửa */}
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
                  <BookOpen className="w-5 h-5" />
                  Thêm môn học mới
                </h3>
                <p className="text-[#152238]/70 text-sm mt-0.5">
                  Tạo môn học theo khoa chuyên môn
                </p>
              </div>
              <button onClick={handleCloseModal} className="p-2 hover:bg-white/40 rounded-lg text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto" onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit(e);
              }
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="hidden" value={formData.MaMonHoc} />
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tên môn học</label>
                  <input
                    type="text"
                    value={formData.TenMonHoc}
                    onChange={(e) => {
                      setFormData({ ...formData, TenMonHoc: e.target.value });
                      if (formErrors.TenMonHoc) setFormErrors({ ...formErrors, TenMonHoc: '' });
                    }}
                    onBlur={(e) => {
                      setFormData(prev => ({ ...prev, TenMonHoc: capitalizeWords(e.target.value) }));
                    }}
                    maxLength={30}
                    className={`w-full px-4 py-3 bg-[#F7F8FA] border-2 rounded-xl focus:outline-none transition-colors ${formErrors.TenMonHoc ? 'border-red-500 focus:border-red-500' : 'border-[#E5E7EB] focus:border-[#F4C542]'}`}
                  />
                  {formErrors.TenMonHoc && <p className="text-[#EF4444] text-xs mt-1">{formErrors.TenMonHoc}</p>}
                </div>

                {/* Row 2: Khoa | Số tín chỉ */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Khoa</label>
                  <select
                    value={formData.MaKhoa}
                    onChange={handleKhoaChange}
                    className={`w-full px-4 py-3 bg-[#F7F8FA] border-2 rounded-xl focus:outline-none transition-colors text-gray-700 ${formErrors.MaKhoa ? 'border-red-500 focus:border-red-500' : 'border-[#E5E7EB] focus:border-[#F4C542]'}`}
                  >
                    <option value="">Chọn khoa</option>
                    {faculties.map((faculty) => (
                      <option key={faculty.MaKhoa} value={faculty.MaKhoa}>
                        {faculty.TenKhoa}
                      </option>
                    ))}
                  </select>
                  {formErrors.MaKhoa && <p className="text-[#EF4444] text-xs mt-1">{formErrors.MaKhoa}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Số tín chỉ</label>
                  <input
                    type="number"
                    min="1" max="10"
                    value={formData.SoTinChi}
                    onChange={(e) => {
                      setFormData({ ...formData, SoTinChi: e.target.value });
                      if (formErrors.SoTinChi) setFormErrors({ ...formErrors, SoTinChi: '' });
                    }}
                    className={`w-full px-4 py-3 bg-[#F7F8FA] border-2 rounded-xl focus:outline-none transition-colors ${formErrors.SoTinChi ? 'border-red-500 focus:border-red-500' : 'border-[#E5E7EB] focus:border-[#F4C542]'}`}
                  />
                  {formErrors.SoTinChi && <p className="text-[#EF4444] text-xs mt-1">{formErrors.SoTinChi}</p>}
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
    disabled={isSubmitting}
    className="flex-1 py-3 bg-[#F4C542] text-[#152238] font-semibold rounded-xl shadow-lg disabled:opacity-60"
  >
    {isSubmitting ? 'Đang lưu...' : 'Thêm môn học'}
  </button>
</div>
</form>
          </motion.div>
        </div>
        </ModalPortal>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedSubject && (
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
                    <BookOpen className="w-8 h-8 text-[#152238]" />
                  </div>
                  <div>
                    <span className="text-[#152238]/70 text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" />
                      Chi tiết môn học
                    </span>
                    <h2 className="text-2xl font-bold text-white mt-1">{selectedSubject.TenMonHoc}</h2>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="bg-white/40 text-white text-xs px-2.5 py-1 rounded-full font-mono font-medium">{selectedSubject.MaMonHoc}</span>
                      <span className="bg-white/40 text-white text-xs px-2.5 py-1 rounded-full font-medium">{selectedSubject.SoTinChi} tín chỉ</span>
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
                  { id: 'classes', label: 'Lớp học', icon: BookOpen },
                  { id: 'teachers', label: 'Giảng viên', icon: Users },
                  { id: 'stats', label: 'Thống kê điểm', icon: BarChart3 }
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
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {detailTab === 'classes' && (
                <div>
                  <h4 className="text-sm font-bold text-[#6B7280] uppercase tracking-wider mb-4">
                    Danh sách lớp học ({subjectClasses.length})
                  </h4>
                  {subjectClasses.length > 0 ? (
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
                          {subjectClasses.map((cls, index) => (
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
                      <p className="font-medium">Chưa có lớp nào đăng ký học môn này</p>
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'teachers' && (
                <div>
                  <h4 className="text-sm font-bold text-[#6B7280] uppercase tracking-wider mb-4">
                    Giảng viên dạy môn ({subjectTeachers.length})
                  </h4>
                  {subjectTeachers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {subjectTeachers.map((teacher, index) => (
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
                      <p className="font-medium">Chưa có giảng viên nào phân công dạy môn này</p>
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'stats' && (
                <div className="space-y-6">
                  {subjectGradeStats.totalGrades > 0 ? (
                    <>
                      {/* Điểm trung bình lớn */}
                      <div className="bg-gradient-to-br from-[#F4C542] to-[#F4C542]/90 rounded-2xl p-6 text-center text-white">
                        <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-80" />
                        <div className="text-5xl font-bold mb-1">{subjectGradeStats.average || 0}</div>
                        <div className="text-[#152238]/70 font-medium">Điểm trung bình môn học</div>
                        <div className="text-amber-200 text-sm mt-1">Tổng {subjectGradeStats.totalGrades} bản ghi điểm</div>
                      </div>

                      {/* Phân loại */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { label: 'Xuất sắc / Giỏi', sublabel: '≥ 8.5', value: subjectGradeStats.excellent || 0, icon: Award, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', iconBg: 'bg-amber-100' },
                          { label: 'Khá', sublabel: '7.0 – 8.4', value: subjectGradeStats.good || 0, icon: CheckCircle, bg: 'bg-[#22C55E]/10', border: 'border-green-200', text: 'text-green-700', iconBg: 'bg-[#22C55E]/20' },
                          { label: 'Trung bình', sublabel: '5.0 – 6.9', value: subjectGradeStats.averageGrade || 0, icon: TrendingUp, bg: 'bg-[#3B82F6]/10', border: 'border-blue-200', text: 'text-blue-700', iconBg: 'bg-blue-100' },
                          { label: 'Không đạt', sublabel: '< 5.0', value: subjectGradeStats.fail || 0, icon: AlertCircle, bg: 'bg-[#EF4444]/10', border: 'border-red-200', text: 'text-red-700', iconBg: 'bg-[#EF4444]/20' },
                        ].map((item, i) => {
                          const Icon = item.icon;
                          const pct = subjectGradeStats.totalGrades > 0 ? Math.round((item.value / subjectGradeStats.totalGrades) * 100) : 0;
                          return (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.08 }}
                              whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(0,0,0,0.04)' }}
                              className={`rounded-2xl border-2 p-5 ${item.bg} ${item.border} transition-all duration-300`}
                            >
                              <div className={`rounded-xl p-2 w-fit mb-3 ${item.iconBg}`}>
                                <Icon className={`w-5 h-5 ${item.text}`} />
                              </div>
                              <div className={`text-3xl font-bold ${item.text}`}>{item.value}</div>
                              <div className={`text-xs font-semibold mt-0.5 ${item.text} opacity-70`}>{pct}% tổng số</div>
                              <div className="text-xs text-[#6B7280] mt-2 font-medium">{item.label}</div>
                              <div className="text-xs text-gray-300">{item.sublabel}</div>
                            </motion.div>
                          );
                        })}
                      </div>

                      {/* Progress bars */}
                      <div className="bg-[#F7F8FA] rounded-2xl p-5 border border-[#FFF7D6] hover:border-[#F4C542]/30 transition-all duration-300">
                        <h5 className="text-sm font-bold text-[#6B7280] mb-4">Phân phối xếp loại</h5>
                        {[
                          { label: 'Giỏi (≥8.5)', value: subjectGradeStats.excellent || 0, color: 'bg-amber-400' },
                          { label: 'Khá (7–8.4)', value: subjectGradeStats.good || 0, color: 'bg-green-400' },
                          { label: 'TB (5–6.9)', value: subjectGradeStats.averageGrade || 0, color: 'bg-blue-400' },
                          { label: 'Rớt (<5)', value: subjectGradeStats.fail || 0, color: 'bg-red-400' },
                        ].map((bar, i) => {
                          const pct = subjectGradeStats.totalGrades > 0 ? (bar.value / subjectGradeStats.totalGrades) * 100 : 0;
                          return (
                            <div key={i} className="flex items-center gap-3 mb-3 last:mb-0">
                              <span className="text-xs text-[#6B7280] w-24 flex-shrink-0">{bar.label}</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.7, delay: i * 0.1 }}
                                  className={`h-full rounded-full ${bar.color}`}
                                />
                              </div>
                              <span className="text-xs font-bold text-[#6B7280] w-8 text-right">{bar.value}</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-300">
                      <BarChart3 className="w-14 h-14 mb-3 text-gray-200" />
                      <p className="font-medium">Chưa có dữ liệu điểm</p>
                      <p className="text-sm mt-1">Môn học này chưa có bản ghi điểm nào</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
        </ModalPortal>
      )}
      <ConfirmDeleteModal
        isOpen={deleteModal.show}
        onClose={() => setDeleteModal({ show: false, subject: null })}
        onConfirm={handleDeleteConfirm}
        title="CẢNH BÁO XÓA MÔN HỌC"
        message={`HÀNH ĐỘNG NÀY KHÔNG THỂ HOÀN TÁC! Toàn bộ dữ liệu điểm số, lớp học phần liên quan đến môn học "${deleteModal.subject?.TenMonHoc}" (${deleteModal.subject?.MaMonHoc}) sẽ bị ảnh hưởng. Bạn có thực sự muốn xóa môn học này không?`}
      />

      {/* General Confirmation Dialog (Add/Edit) */}
      <ConfirmDialog
        show={confirmDialog.show}
        message={confirmDialog.message}
        onConfirm={() => {
          if (confirmDialog.onConfirm) confirmDialog.onConfirm();
          setConfirmDialog({ show: false, message: '', onConfirm: null, title: 'Xác nhận' });
        }}
        onCancel={() => setConfirmDialog({ show: false, message: '', onConfirm: null, title: 'Xác nhận' })}
        title={confirmDialog.title}
      />

      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />

      {/* Success Dialog */}
      <SuccessDialog
        show={successDialog.show}
        message={successDialog.message}
        onClose={() => setSuccessDialog({ show: false, message: '' })}
        title="Thành công"
      />

      {/* Error Dialog */}
      <ErrorDialog
        show={errorDialog.show}
        message={errorDialog.message}
        onClose={() => setErrorDialog({ show: false, message: '' })}
        title="Lỗi"
      />
    </div>
  );
}

export default SubjectManagement;
