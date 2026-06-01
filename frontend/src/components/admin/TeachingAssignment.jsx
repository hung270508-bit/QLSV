import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Edit, Trash2, Search, X, Filter, XCircle, BarChart3, User } from 'lucide-react';
import axios from 'axios';

function TeachingAssignment() {
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [displaySearchTerm, setDisplaySearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    subjectFilter: '',
    classFilter: '',
    semesterFilter: ''
  });
  const [displayFilters, setDisplayFilters] = useState({
    subjectFilter: '',
    classFilter: '',
    semesterFilter: ''
  });
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'teacher'
  const [teacherLoadStats, setTeacherLoadStats] = useState([]);
  const [formData, setFormData] = useState({
    MaGiangVien: '',
    MaMonHoc: '',
    MaLop: '',
    HocKy: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    calculateTeacherLoadStats();
  }, [assignments, subjects]);

  const calculateTeacherLoadStats = () => {
    const stats = {};
    
    teachers.forEach(teacher => {
      stats[teacher.MaGiangVien] = {
        MaGiangVien: teacher.MaGiangVien,
        HoTen: teacher.HoTen,
        totalAssignments: 0,
        totalCredits: 0
      };
    });
    
    assignments.forEach(assignment => {
      if (stats[assignment.MaGiangVien]) {
        stats[assignment.MaGiangVien].totalAssignments++;
        const subject = subjects.find(s => s.MaMonHoc === assignment.MaMonHoc);
        if (subject) {
          stats[assignment.MaGiangVien].totalCredits += parseInt(subject.SoTinChi) || 0;
        }
      }
    });
    
    setTeacherLoadStats(Object.values(stats));
  };

  const fetchData = async () => {
    try {
      const [assignmentsRes, teachersRes, subjectsRes, classesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/teaching-assignments'),
        axios.get('http://localhost:5000/api/teachers'),
        axios.get('http://localhost:5000/api/subjects'),
        axios.get('http://localhost:5000/api/classes')
      ]);
      setAssignments(assignmentsRes.data);
      setTeachers(teachersRes.data);
      setSubjects(subjectsRes.data);
      setClasses(classesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAssignment) {
        await axios.put(`http://localhost:5000/api/teaching-assignments/${editingAssignment.MaPhanCong}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/teaching-assignments', formData);
      }
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving assignment:', error);
      alert('Lỗi khi lưu phân công!');
    }
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      MaGiangVien: assignment.MaGiangVien,
      MaMonHoc: assignment.MaMonHoc,
      MaLop: assignment.MaLop,
      HocKy: assignment.HocKy
    });
    setShowModal(true);
  };

  const handleDelete = async (maPhanCong) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phân công này?')) {
      try {
        await axios.delete(`http://localhost:5000/api/teaching-assignments/${maPhanCong}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting assignment:', error);
        alert('Lỗi khi xóa phân công!');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAssignment(null);
    setFormData({
      MaGiangVien: '',
      MaMonHoc: '',
      MaLop: '',
      HocKy: ''
    });
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = 
      assignment.TenMonHoc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.TenLop?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.TenGiangVien?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = !filters.subjectFilter || assignment.MaMonHoc === filters.subjectFilter;
    const matchesClass = !filters.classFilter || assignment.MaLop === filters.classFilter;
    const matchesSemester = !filters.semesterFilter || assignment.HocKy === filters.semesterFilter;
    
    return matchesSearch && matchesSubject && matchesClass && matchesSemester;
  });

  const handleSearch = () => {
    setSearchTerm(displaySearchTerm);
  };

  const handleApplyFilters = () => {
    setFilters({ ...displayFilters });
    setShowFilters(false);
  };


  const clearFilters = () => {
    setFilters({ subjectFilter: '', classFilter: '', semesterFilter: '' });
    setDisplayFilters({ subjectFilter: '', classFilter: '', semesterFilter: '' });
    setSearchTerm('');
    setDisplaySearchTerm('');
  };

  const activeFilterCount = (filters.subjectFilter ? 1 : 0) + (filters.classFilter ? 1 : 0) + (filters.semesterFilter ? 1 : 0) + (searchTerm ? 1 : 0);
  const hasActiveFilters = filters.subjectFilter || filters.classFilter || filters.semesterFilter || searchTerm;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Phân công giảng dạy</h2>
          <p className="text-gray-500">Thêm, sửa, xóa phân công giảng dạy</p>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode(viewMode === 'list' ? 'teacher' : 'list')}
            className="flex items-center gap-2 bg-gray-500 text-white px-6 py-3 rounded-xl shadow-lg transition-all"
          >
            {viewMode === 'list' ? <BarChart3 className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
            {viewMode === 'list' ? 'Xem tải giảng' : 'Xem danh sách'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Thêm phân công
          </motion.button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="relative w-1/2">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm phân công..."
              value={displaySearchTerm}
              onChange={(e) => setDisplaySearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
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
            className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-xl shadow-lg transition-all"
          >
            <Search className="w-5 h-5" />
            Tìm kiếm
          </motion.button>
          {hasActiveFilters && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearFilters}
              className="px-4 py-3 bg-red-100 text-red-600 rounded-xl font-semibold hover:bg-red-200 transition-colors flex items-center gap-2"
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
            className="bg-gray-50 rounded-xl p-4 space-y-4 relative z-50 w-1/2"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lọc theo môn học</label>
                <select
                  value={displayFilters.subjectFilter}
                  onChange={(e) => setDisplayFilters({ ...displayFilters, subjectFilter: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                >
                  <option value="">Tất cả môn</option>
                  {subjects.map((subject) => (
                    <option key={subject.MaMonHoc} value={subject.MaMonHoc}>
                      {subject.TenMonHoc}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lọc theo lớp</label>
                <select
                  value={displayFilters.classFilter}
                  onChange={(e) => setDisplayFilters({ ...displayFilters, classFilter: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lọc theo học kỳ</label>
                <select
                  value={displayFilters.semesterFilter}
                  onChange={(e) => setDisplayFilters({ ...displayFilters, semesterFilter: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                >
                  <option value="">Tất cả học kỳ</option>
                  <option value="HK1_2025_2026">HK1 2025-2026</option>
                  <option value="HK2_2025_2026">HK2 2025-2026</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleApplyFilters}
                className="flex-1 bg-orange-500 text-white py-2 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
              >
                Áp dụng lọc
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setDisplayFilters({ subjectFilter: '', classFilter: '', semesterFilter: '' })}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Đặt lại
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Table */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Môn học</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Lớp</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Giảng viên</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Học kỳ</th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssignments.length > 0 ? (
                filteredAssignments.map((assignment, index) => (
                  <motion.tr
                    key={assignment.MaPhanCong}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-orange-50 transition-colors"
                  >
                    <td className="py-4 px-6 text-sm text-gray-600">{assignment.TenMonHoc || 'N/A'}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{assignment.TenLop || 'N/A'}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{assignment.TenGiangVien || 'N/A'}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{assignment.HocKy || 'N/A'}</td>
                    <td className="py-4 px-6 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEdit(assignment)}
                          className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(assignment.MaPhanCong)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-500">
                    Không tìm thấy phân công nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Teacher Load Statistics View */}
      {viewMode === 'teacher' && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Giảng viên</th>
                  <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">Số môn dạy</th>
                  <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">Tổng tín chỉ</th>
                  <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {teacherLoadStats.length > 0 ? (
                  teacherLoadStats.map((stat, index) => (
                    <motion.tr
                      key={stat.MaGiangVien}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 hover:bg-orange-50 transition-colors"
                    >
                      <td className="py-4 px-6 text-sm font-medium text-gray-800 flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        {stat.HoTen}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600 text-center">{stat.totalAssignments}</td>
                      <td className="py-4 px-6 text-sm text-gray-600 text-center">{stat.totalCredits}</td>
                      <td className="py-4 px-6 text-sm text-center">
                        {stat.totalAssignments === 0 ? (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">Không có phân công</span>
                        ) : stat.totalCredits < 10 ? (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">Tải thấp</span>
                        ) : stat.totalCredits < 20 ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">Tải vừa phải</span>
                        ) : (
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs">Tải cao</span>
                        )}
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-gray-500">
                      Không có dữ liệu thống kê
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {editingAssignment ? 'Cập nhật phân công' : 'Thêm phân công mới'}
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Giảng viên</label>
                <select
                  value={formData.MaGiangVien}
                  onChange={(e) => setFormData({ ...formData, MaGiangVien: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  required
                >
                  <option value="">Chọn giảng viên</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.MaGiangVien} value={teacher.MaGiangVien}>
                      {teacher.HoTen}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Môn học</label>
                <select
                  value={formData.MaMonHoc}
                  onChange={(e) => setFormData({ ...formData, MaMonHoc: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  required
                >
                  <option value="">Chọn môn học</option>
                  {subjects.map((subject) => (
                    <option key={subject.MaMonHoc} value={subject.MaMonHoc}>
                      {subject.TenMonHoc}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lớp</label>
                <select
                  value={formData.MaLop}
                  onChange={(e) => setFormData({ ...formData, MaLop: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  required
                >
                  <option value="">Chọn lớp</option>
                  {classes.map((cls) => (
                    <option key={cls.MaLop} value={cls.MaLop}>
                      {cls.TenLop}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Học kỳ</label>
                <select
                  value={formData.HocKy}
                  onChange={(e) => setFormData({ ...formData, HocKy: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  required
                >
                  <option value="">Chọn học kỳ</option>
                  <option value="HK1_2025_2026">HK1 2025-2026</option>
                  <option value="HK2_2025_2026">HK2 2025-2026</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all"
                >
                  {editingAssignment ? 'Cập nhật' : 'Thêm mới'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Hủy
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default TeachingAssignment;
