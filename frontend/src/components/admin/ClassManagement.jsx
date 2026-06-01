import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Edit, Trash2, Search, X, Filter, XCircle, Calendar, BarChart3, BookOpen, GraduationCap, Mail, Phone, Award, TrendingUp, AlertCircle, CheckCircle, UserCheck } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

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
  const [filters, setFilters] = useState({
    facultyFilter: ''
  });
  const [displayFilters, setDisplayFilters] = useState({
    facultyFilter: ''
  });
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
    MaKhoa: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClass) {
        await axios.put(`${API_BASE}/classes/${encodeURIComponent(editingClass.MaLop)}`, formData);
      } else {
        await axios.post(`${API_BASE}/classes`, formData);
      }
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving class:', error);
      alert('Lỗi khi lưu lớp học!');
    }
  };

  const handleEdit = (cls) => {
    setEditingClass(cls);
    setFormData({
      MaLop: cls.MaLop,
      TenLop: cls.TenLop,
      MaKhoa: cls.MaKhoa || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (maLop) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lớp học này?')) {
      try {
        await axios.delete(`${API_BASE}/classes/${encodeURIComponent(maLop)}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting class:', error);
        alert('Lỗi khi xóa lớp học!');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClass(null);
    setFormData({
      MaLop: '',
      TenLop: '',
      MaKhoa: ''
    });
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

    return {
      students,
      schedule,
      teachers,
      gradeStats: normalizeGradeStats(statsRaw)
    };
  };

  const handleViewDetails = async (cls) => {
    if (!cls?.MaLop) {
      alert('Không xác định được mã lớp học!');
      return;
    }

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
      console.error('Error fetching class details:', error);
      setDetailError('Không thể tải chi tiết lớp học. Kiểm tra backend đang chạy tại cổng 5000.');
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
    const matchesSearch = 
      cls.TenLop.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.MaLop.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFaculty = !filters.facultyFilter || cls.MaKhoa === filters.facultyFilter;
    
    return matchesSearch && matchesFaculty;
  });

  const handleSearch = () => {
    setSearchTerm(displaySearchTerm);
  };

  const handleApplyFilters = () => {
    setFilters({ ...displayFilters });
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({ facultyFilter: '' });
    setDisplayFilters({ facultyFilter: '' });
    setSearchTerm('');
    setDisplaySearchTerm('');
  };

  const activeFilterCount = (filters.facultyFilter ? 1 : 0) + (searchTerm ? 1 : 0);
  const hasActiveFilters = filters.facultyFilter || searchTerm;

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
              Quản lý lớp học
            </h2>
            <p className="text-orange-100 text-lg">Thêm, sửa, xóa và xem chi tiết thông tin lớp học</p>
          </div>
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
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm lớp học theo tên hoặc mã lớp..."
              value={displaySearchTerm}
              onChange={(e) => setDisplaySearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
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
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Lọc theo khoa</label>
              <select
                value={displayFilters.facultyFilter}
                onChange={(e) => setDisplayFilters({ ...displayFilters, facultyFilter: e.target.value })}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
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
                onClick={() => setDisplayFilters({ facultyFilter: '' })}
                className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
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
                <th className="text-left py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Mã lớp</th>
                <th className="text-left py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Tên lớp</th>
                <th className="text-left py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Khoa</th>
                <th className="text-center py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Sĩ số</th>
                <th className="text-center py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredClasses.length > 0 ? (
                filteredClasses.map((cls, index) => (
                  <motion.tr
                    key={cls.MaLop}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 transition-all cursor-pointer"
                    onClick={() => handleViewDetails(cls)}
                  >
                    <td className="py-5 px-6">
                      <span className="font-semibold text-gray-800 text-base">{cls.MaLop}</span>
                    </td>
                    <td className="py-5 px-6">
                      <div className="font-semibold text-gray-800">{cls.TenLop}</div>
                    </td>
                    <td className="py-5 px-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-700">
                        {cls.TenKhoa || 'N/A'}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2.5 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-700">
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
                          onClick={() => handleDelete(cls.MaLop)}
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
      </div>

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {editingClass ? 'Cập nhật lớp học' : 'Thêm lớp học mới'}
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mã lớp</label>
                <input
                  type="text"
                  value={formData.MaLop}
                  onChange={(e) => setFormData({ ...formData, MaLop: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  required
                  disabled={!!editingClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tên lớp</label>
                <input
                  type="text"
                  value={formData.TenLop}
                  onChange={(e) => setFormData({ ...formData, TenLop: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Khoa</label>
                <select
                  value={formData.MaKhoa}
                  onChange={(e) => setFormData({ ...formData, MaKhoa: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                >
                  <option value="">Chọn khoa</option>
                  {faculties.map((faculty) => (
                    <option key={faculty.MaKhoa} value={faculty.MaKhoa}>
                      {faculty.TenKhoa}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold shadow-lg transition-all"
                >
                  {editingClass ? 'Cập nhật' : 'Thêm mới'}
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

      {/* Detail Modal */}
      {showDetailModal && selectedClass && (
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
                    <span className="text-orange-100 text-sm font-medium uppercase tracking-widest">Chi tiết lớp học</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mt-2">{selectedClass.TenLop}</h2>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full font-mono">{selectedClass.MaLop}</span>
                    {selectedClass.TenKhoa && (
                      <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full">{selectedClass.TenKhoa}</span>
                    )}
                    <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full">
                      {classStudents.length} sinh viên
                    </span>
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
                            orange: 'bg-orange-50 text-orange-600 border-orange-100',
                            blue: 'bg-blue-50 text-blue-600 border-blue-100',
                            purple: 'bg-purple-50 text-purple-600 border-purple-100',
                            green: 'bg-green-50 text-green-600 border-green-100',
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
                                className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 border border-gray-100"
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
                        <div className="overflow-x-auto rounded-2xl border border-gray-100">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-gradient-to-r from-orange-50 to-orange-100">
                                <th className="text-left py-3.5 px-5 text-xs font-bold text-gray-600 uppercase tracking-wider">#</th>
                                <th className="text-left py-3.5 px-5 text-xs font-bold text-gray-600 uppercase tracking-wider">MSSV</th>
                                <th className="text-left py-3.5 px-5 text-xs font-bold text-gray-600 uppercase tracking-wider">Họ và tên</th>
                                <th className="text-left py-3.5 px-5 text-xs font-bold text-gray-600 uppercase tracking-wider">Giới tính</th>
                                <th className="text-left py-3.5 px-5 text-xs font-bold text-gray-600 uppercase tracking-wider">Email</th>
                                <th className="text-left py-3.5 px-5 text-xs font-bold text-gray-600 uppercase tracking-wider">SĐT</th>
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
                                    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                                      sv.GioiTinh === 'Nam' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
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
                    <div>
                      <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                        Lịch học ({classSchedule.length} buổi/tuần)
                      </h4>
                      {classSchedule.length > 0 ? (
                        <div className="space-y-3">
                          {classSchedule.map((sch, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -12 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.07 }}
                              className="flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-2xl p-4 hover:border-orange-200 hover:bg-orange-50/30 transition-all"
                            >
                              {/* Thứ */}
                              <div className="bg-orange-500 text-white rounded-xl w-14 h-14 flex flex-col items-center justify-center flex-shrink-0 shadow-sm">
                                <span className="text-xs font-medium opacity-80">Thứ</span>
                                <span className="text-xl font-bold leading-none">{sch.Thu}</span>
                              </div>
                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-800 text-sm truncate">{sch.TenMonHoc}</div>
                                <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-3 flex-wrap">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Ca {sch.CaHoc}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <BookOpen className="w-3 h-3" />
                                    {sch.PhongHoc}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <UserCheck className="w-3 h-3" />
                                    {sch.TenGiangVien}
                                  </span>
                                </div>
                              </div>
                              {/* Ca badge */}
                              <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0">
                                Ca {sch.CaHoc}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                          <Calendar className="w-14 h-14 mb-3 text-gray-200" />
                          <p className="font-medium">Chưa có lịch học nào</p>
                        </div>
                      )}
                    </div>
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
      )}
    </div>
  );
}

export default ClassManagement;