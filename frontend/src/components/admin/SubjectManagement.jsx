import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, Plus, Edit, Trash2, Search, X, Filter, 
  XCircle, Eye, Users, BarChart3, ChevronLeft, ChevronRight 
} from 'lucide-react';
import axios from 'axios';

function SubjectManagement() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  
  // States cho Search và Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [displaySearchTerm, setDisplaySearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    nameFilter: '',
    creditFilter: ''
  });
  const [displayFilters, setDisplayFilters] = useState({
    nameFilter: '',
    creditFilter: ''
  });

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
    SoTinChi: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/subjects');
      setSubjects(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      loading && setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingSubject) {
        await axios.put(`http://localhost:5000/api/subjects/${editingSubject.MaMonHoc}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/subjects', formData);
      }
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving subject:', error);
      alert('Lỗi khi lưu môn học!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setFormData({
      MaMonHoc: subject.MaMonHoc,
      TenMonHoc: subject.TenMonHoc,
      SoTinChi: subject.SoTinChi
    });
    setShowModal(true);
  };

  const handleDelete = async (maMH) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa môn học này?')) {
      try {
        await axios.delete(`http://localhost:5000/api/subjects/${maMH}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting subject:', error);
        alert('Lỗi khi xóa môn học!');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSubject(null);
    setFormData({
      MaMonHoc: '',
      TenMonHoc: '',
      SoTinChi: ''
    });
  };

  const handleViewDetails = async (subject) => {
    setSelectedSubject(subject);
    setShowDetailModal(true);
    setDetailTab('classes');
    
    try {
      const [classesRes, teachersRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/subjects/${subject.MaMonHoc}/classes`),
        axios.get(`http://localhost:5000/api/subjects/${subject.MaMonHoc}/teachers`)
      ]);
      
      setSubjectClasses(classesRes.data);
      setSubjectTeachers(teachersRes.data);
      
      // Tính toán thống kê điểm
      const gradesRes = await axios.get(`http://localhost:5000/api/grades`);
      const subjectGrades = gradesRes.data.filter(g => g.MaMonHoc === subject.MaMonHoc);
      
      let total = subjectGrades.length;
      let sum = 0;
      let excellent = 0;
      let good = 0;
      let averageGrade = 0;
      let fail = 0;
      
      subjectGrades.forEach(grade => {
        const qt = parseFloat(grade.DiemQuaTrinh) || 0;
        const gk = parseFloat(grade.DiemGiuaKy) || 0;
        const ck = parseFloat(grade.DiemCuoiKy) || 0;
        const avg = ((qt * 0.2) + (gk * 0.3) + (ck * 0.5)).toFixed(2);
        sum += parseFloat(avg);
        
        if (parseFloat(avg) >= 8.5) excellent++;
        else if (parseFloat(avg) >= 7.0) good++;
        else if (parseFloat(avg) >= 4.0) averageGrade++; 
        else fail++;
      });
      
      setSubjectGradeStats({
        totalGrades: total,
        average: total > 0 ? (sum / total).toFixed(2) : 0,
        excellent,
        good,
        averageGrade,
        fail
      });
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
    const matchesSearch = 
      subject.TenMonHoc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.MaMonHoc.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesName = !filters.nameFilter || subject.TenMonHoc.toLowerCase().includes(filters.nameFilter.toLowerCase());
    const matchesCredit = !filters.creditFilter || subject.SoTinChi.toString() === filters.creditFilter;
    
    return matchesSearch && matchesName && matchesCredit;
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

  const handleApplyFilters = () => {
    setFilters({ ...displayFilters });
    setShowFilters(false);
    setCurrentPage(1); 
  };

  const clearFilters = () => {
    setFilters({ nameFilter: '', creditFilter: '' });
    setDisplayFilters({ nameFilter: '', creditFilter: '' });
    setSearchTerm('');
    setDisplaySearchTerm('');
    setCurrentPage(1); 
  };

  const activeFilterCount = (filters.nameFilter ? 1 : 0) + (filters.creditFilter ? 1 : 0) + (searchTerm ? 1 : 0);
  const hasActiveFilters = filters.nameFilter || filters.creditFilter || searchTerm;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-gray-50/50 p-4 rounded-2xl">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 shadow-xl shadow-orange-500/10">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <BookOpen className="w-8 h-8" />
              Quản lý môn học
            </h2>
            <p className="text-orange-100 text-lg">Thêm, sửa, xóa và xem chi tiết thông tin môn học</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(249,115,22,0.2)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-white text-orange-600 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Thêm môn học
          </motion.button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-orange-100/50 p-6">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm môn học theo tên hoặc mã môn..."
              value={displaySearchTerm}
              onChange={(e) => setDisplaySearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-12 pr-12 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowFilters(!showFilters)}
                className={`transition-colors relative p-1 rounded-lg ${
                  hasActiveFilters ? 'text-orange-500 bg-orange-50' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Filter className="w-5 h-5" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </motion.button>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSearch}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-orange-500/20 transition-all"
          >
            <Search className="w-5 h-5" />
            Tìm kiếm
          </motion.button>
          {hasActiveFilters && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearFilters}
              className="px-6 py-3 bg-orange-50 text-orange-600 rounded-xl font-semibold hover:bg-orange-100 transition-colors flex items-center gap-2 border-2 border-orange-200"
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
            className="bg-orange-50/50 rounded-xl p-4 space-y-4 relative z-40 w-full mt-4 border border-orange-100"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Lọc theo tên môn học</label>
                <input
                  type="text"
                  placeholder="Nhập tên môn học..."
                  value={displayFilters.nameFilter}
                  onChange={(e) => setDisplayFilters({ ...displayFilters, nameFilter: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Lọc theo số tín chỉ</label>
                <select
                  value={displayFilters.creditFilter}
                  onChange={(e) => setDisplayFilters({ ...displayFilters, creditFilter: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                >
                  <option value="">Tất cả</option>
                  <option value="1">1 tín chỉ</option>
                  <option value="2">2 tín chỉ</option>
                  <option value="3">3 tín chỉ</option>
                  <option value="4">4 tín chỉ</option>
                  <option value="5">5 tín chỉ</option>
                  <option value="6">6 tín chỉ</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleApplyFilters}
                className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/10"
              >
                Áp dụng lọc
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setDisplayFilters({ nameFilter: '', creditFilter: '' })}
                className="flex-1 bg-white text-gray-700 border border-gray-200 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
              >
                Đặt lại
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Table & Pagination */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-orange-50 to-orange-100/40">
              <tr>
                <th className="text-left py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Mã môn</th>
                <th className="text-left py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Tên môn học</th>
                <th className="text-left py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Số tín chỉ</th>
                <th className="text-center py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((subject, index) => (
                  <motion.tr
                    key={subject.MaMonHoc}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-orange-100/30 transition-all cursor-pointer"
                    onClick={() => handleViewDetails(subject)}
                  >
                    <td className="py-5 px-6">
                      <span className="font-semibold text-gray-800 text-base">{subject.MaMonHoc}</span>
                    </td>
                    <td className="py-5 px-6">
                      <div className="font-semibold text-gray-800">{subject.TenMonHoc}</div>
                    </td>
                    <td className="py-5 px-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-50 text-orange-600 border border-orange-100">
                        {subject.SoTinChi} tín chỉ
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEdit(subject)}
                          className="p-3 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-100 transition-all shadow-sm border border-orange-100"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(subject.MaMonHoc)}
                          className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all shadow-sm border border-red-100"
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
                  <td colSpan="4" className="py-16">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <BookOpen className="w-16 h-16 mb-4 text-orange-200" />
                      <p className="text-lg font-medium">Không tìm thấy môn học nào</p>
                      <p className="text-sm mt-2">Thử tìm kiếm hoặc đổi bộ lọc khác</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Component Phân trang */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="text-sm text-gray-500">
              Hiển thị <span className="font-medium text-gray-700">{indexOfFirstItem + 1}</span> đến <span className="font-medium text-gray-700">{Math.min(indexOfLastItem, filteredSubjects.length)}</span> trong số <span className="font-medium text-gray-700">{filteredSubjects.length}</span> môn học
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                      currentPage === i + 1
                        ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                        : 'text-gray-600 hover:bg-gray-100 border border-transparent'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Thêm/Sửa */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-orange-100"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {editingSubject ? 'Cập nhật môn học' : 'Thêm môn học mới'}
              </h3>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </motion.button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mã môn học</label>
                <input
                  type="text"
                  value={formData.MaMonHoc}
                  onChange={(e) => setFormData({ ...formData, MaMonHoc: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  required
                  disabled={!!editingSubject}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tên môn học</label>
                <input
                  type="text"
                  value={formData.TenMonHoc}
                  onChange={(e) => setFormData({ ...formData, TenMonHoc: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Số tín chỉ</label>
                <input
                  type="number"
                  value={formData.SoTinChi}
                  onChange={(e) => setFormData({ ...formData, SoTinChi: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  required
                  min="1"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <motion.button
                  whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                  whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 flex justify-center items-center gap-2 py-3 rounded-xl font-semibold shadow-lg transition-all ${
                    isSubmitting 
                      ? 'bg-orange-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-500/20'
                  } text-white`}
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : editingSubject ? (
                    'Cập nhật'
                  ) : (
                    'Thêm mới'
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedSubject && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl border border-orange-100"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Chi tiết môn học: <span className="text-orange-600">{selectedSubject.TenMonHoc}</span></h3>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleCloseDetailModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </motion.button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
              {[
                { id: 'classes', label: 'Lớp học', icon: BookOpen },
                { id: 'teachers', label: 'Giảng viên', icon: Users },
                { id: 'stats', label: 'Thống kê điểm số', icon: BarChart3 }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setDetailTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-3 font-semibold transition-all relative ${
                      detailTab === tab.id
                        ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50/50 rounded-t-xl'
                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-t-xl'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            {detailTab === 'classes' && (
              <div className="space-y-4">
                {subjectClasses.length > 0 ? (
                  <div className="overflow-x-auto border border-gray-100 rounded-xl">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Mã lớp</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tên lớp</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Số sinh viên</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjectClasses.map((cls, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50/50">
                            <td className="py-3 px-4 text-sm font-medium text-gray-800">{cls.MaLop}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{cls.TenLop}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              <span className="bg-gray-100 px-2.5 py-1 rounded-md font-medium text-gray-700">{cls.SoSinhVien || 0} SV</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">Chưa có lớp nào đăng ký học môn này</p>
                )}
              </div>
            )}

            {detailTab === 'teachers' && (
              <div className="space-y-4">
                {subjectTeachers.length > 0 ? (
                  <div className="overflow-x-auto border border-gray-100 rounded-xl">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Mã GV</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Họ tên</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">SĐT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjectTeachers.map((teacher, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50/50">
                            <td className="py-3 px-4 text-sm font-medium text-gray-800">{teacher.MaGiangVien}</td>
                            <td className="py-3 px-4 text-sm text-gray-600 font-semibold">{teacher.HoTen}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{teacher.Email || '-'}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{teacher.SoDienThoai || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">Chưa có giảng viên nào phân công dạy môn này</p>
                )}
              </div>
            )}

            {detailTab === 'stats' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="bg-blue-50 p-6 rounded-xl text-center shadow-sm">
                    <div className="text-3xl font-bold text-blue-600">{subjectGradeStats.totalGrades}</div>
                    <div className="text-sm text-gray-600 font-medium">Tổng Lượt thi</div>
                  </div>
                  <div className="bg-green-50 p-6 rounded-xl text-center shadow-sm">
                    <div className="text-3xl font-bold text-green-600">{subjectGradeStats.average}</div>
                    <div className="text-sm text-gray-600 font-medium">Điểm TB</div>
                  </div>
                  <div className="bg-purple-50 p-6 rounded-xl text-center shadow-sm">
                    <div className="text-3xl font-bold text-purple-600">{subjectGradeStats.excellent}</div>
                    <div className="text-sm text-gray-600 font-medium">Giỏi (A)</div>
                  </div>
                  <div className="bg-yellow-50 p-6 rounded-xl text-center shadow-sm">
                    <div className="text-3xl font-bold text-yellow-600">{subjectGradeStats.good}</div>
                    <div className="text-sm text-gray-600 font-medium">Khá (B)</div>
                  </div>
                  <div className="bg-orange-50 p-6 rounded-xl text-center shadow-sm">
                    <div className="text-3xl font-bold text-orange-600">{subjectGradeStats.averageGrade}</div>
                    <div className="text-sm text-gray-600 font-medium">Trung bình</div>
                  </div>
                  <div className="bg-red-50 p-6 rounded-xl text-center shadow-sm">
                    <div className="text-3xl font-bold text-red-600">{subjectGradeStats.fail}</div>
                    <div className="text-sm text-gray-600 font-medium">Rớt (F)</div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default SubjectManagement;