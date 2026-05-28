import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Edit, Trash2, Search, X, Filter, XCircle, Eye, Calendar, BarChart3 } from 'lucide-react';
import axios from 'axios';

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
  const [classGradeStats, setClassGradeStats] = useState({
    totalGrades: 0,
    average: 0,
    excellent: 0,
    good: 0,
    averageGrade: 0,
    fail: 0
  });
  const [detailTab, setDetailTab] = useState('students'); // 'students', 'schedule', 'stats'
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
        axios.get('http://localhost:5000/api/classes'),
        axios.get('http://localhost:5000/api/faculties')
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
        await axios.put(`http://localhost:5000/api/classes/${editingClass.MaLop}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/classes', formData);
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
        await axios.delete(`http://localhost:5000/api/classes/${maLop}`);
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

  const handleViewDetails = async (cls) => {
    setSelectedClass(cls);
    setShowDetailModal(true);
    setDetailTab('students');
    
    try {
      const [studentsRes, scheduleRes, statsRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/classes/${cls.MaLop}/students`),
        axios.get(`http://localhost:5000/api/classes/${cls.MaLop}/schedule`),
        axios.get(`http://localhost:5000/api/classes/${cls.MaLop}/grade-stats`)
      ]);
      
      setClassStudents(studentsRes.data);
      setClassSchedule(scheduleRes.data);
      
      if (statsRes.data && statsRes.data.length > 0) {
        const stats = statsRes.data[0];
        setClassGradeStats({
          totalGrades: stats.totalGrades || 0,
          average: stats.average || 0,
          excellent: stats.excellent || 0,
          good: stats.good || 0,
          averageGrade: stats.averageGrade || 0,
          fail: stats.fail || 0
        });
      }
    } catch (error) {
      console.error('Error fetching class details:', error);
    }
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedClass(null);
    setClassStudents([]);
    setClassSchedule([]);
    setClassGradeStats({
      totalGrades: 0,
      average: 0,
      excellent: 0,
      good: 0,
      averageGrade: 0,
      fail: 0
    });
    setDetailTab('students');
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Quản lý lớp học</h2>
          <p className="text-gray-500">Thêm, sửa, xóa thông tin lớp học</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          Thêm lớp học
        </motion.button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="relative w-1/2">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm lớp học..."
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
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Lọc theo khoa</label>
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
                className="flex-1 bg-orange-500 text-white py-2 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
              >
                Áp dụng lọc
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setDisplayFilters({ facultyFilter: '' })}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Đặt lại
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Mã lớp</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Tên lớp</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Khoa</th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredClasses.length > 0 ? (
                filteredClasses.map((cls, index) => (
                  <motion.tr
                    key={cls.MaLop}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-6 text-sm font-medium text-gray-800">{cls.MaLop}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{cls.TenLop}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{cls.TenKhoa || 'N/A'}</td>
                    <td className="py-4 px-6 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleViewDetails(cls)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEdit(cls)}
                          className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(cls.MaLop)}
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
                  <td colSpan="4" className="py-12 text-center text-gray-500">
                    Không tìm thấy lớp học nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Chi tiết lớp: {selectedClass.TenLop}</h3>
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
                { id: 'students', label: 'Sinh viên', icon: Users },
                { id: 'schedule', label: 'Lịch học', icon: Calendar },
                { id: 'stats', label: 'Thống kê', icon: BarChart3 }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setDetailTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
                      detailTab === tab.id
                        ? 'text-orange-600 border-b-2 border-orange-600'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            {detailTab === 'students' && (
              <div className="space-y-4">
                {classStudents.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">MSSV</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Họ tên</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Giới tính</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classStudents.map((student, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="py-3 px-4 text-sm text-gray-800">{student.MSSV}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{student.HoTen}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{student.GioiTinh || '-'}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{student.Email || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">Chưa có sinh viên nào</p>
                )}
              </div>
            )}

            {detailTab === 'schedule' && (
              <div className="space-y-4">
                {classSchedule.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Thứ</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Ca học</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Phòng</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Môn học</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Giảng viên</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classSchedule.map((schedule, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="py-3 px-4 text-sm text-gray-800">{schedule.Thu}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{schedule.CaHoc}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{schedule.PhongHoc}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{schedule.TenMonHoc}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{schedule.TenGiangVien}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">Chưa có lịch học nào</p>
                )}
              </div>
            )}

            {detailTab === 'stats' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-blue-50 p-6 rounded-xl text-center">
                    <div className="text-3xl font-bold text-blue-600">{classGradeStats.totalGrades}</div>
                    <div className="text-sm text-gray-600">Tổng điểm</div>
                  </div>
                  <div className="bg-green-50 p-6 rounded-xl text-center">
                    <div className="text-3xl font-bold text-green-600">{classGradeStats.average}</div>
                    <div className="text-sm text-gray-600">Điểm TB</div>
                  </div>
                  <div className="bg-purple-50 p-6 rounded-xl text-center">
                    <div className="text-3xl font-bold text-purple-600">{classGradeStats.excellent}</div>
                    <div className="text-sm text-gray-600">Giỏi (A)</div>
                  </div>
                  <div className="bg-yellow-50 p-6 rounded-xl text-center">
                    <div className="text-3xl font-bold text-yellow-600">{classGradeStats.good}</div>
                    <div className="text-sm text-gray-600">Khá (B)</div>
                  </div>
                  <div className="bg-red-50 p-6 rounded-xl text-center">
                    <div className="text-3xl font-bold text-red-600">{classGradeStats.fail}</div>
                    <div className="text-sm text-gray-600">Rớt (F)</div>
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

export default ClassManagement;
