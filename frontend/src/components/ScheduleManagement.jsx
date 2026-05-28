import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, Edit, Trash2, Search, X, Filter, XCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';

function ScheduleManagement() {
  const [schedules, setSchedules] = useState([]);
  const [teachingAssignments, setTeachingAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [displaySearchTerm, setDisplaySearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dayFilter: '',
    periodFilter: ''
  });
  const [displayFilters, setDisplayFilters] = useState({
    dayFilter: '',
    periodFilter: ''
  });
  const [formData, setFormData] = useState({
    MaPhanCong: '',
    Thu: '',
    CaHoc: '',
    PhongHoc: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [schedulesRes, assignmentsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/schedules'),
        axios.get('http://localhost:5000/api/teaching-assignments')
      ]);
      setSchedules(schedulesRes.data);
      setTeachingAssignments(assignmentsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSchedule) {
        await axios.put(`http://localhost:5000/api/schedules/${editingSchedule.MaLichHoc}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/schedules', formData);
      }
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Lỗi khi lưu lịch học!');
    }
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      MaPhanCong: schedule.MaPhanCong,
      Thu: schedule.Thu,
      CaHoc: schedule.CaHoc,
      PhongHoc: schedule.PhongHoc
    });
    setShowModal(true);
  };

  const handleDelete = async (maLichHoc) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lịch học này?')) {
      try {
        await axios.delete(`http://localhost:5000/api/schedules/${maLichHoc}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting schedule:', error);
        alert('Lỗi khi xóa lịch học!');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSchedule(null);
    setFormData({
      MaPhanCong: '',
      Thu: '',
      CaHoc: '',
      PhongHoc: ''
    });
  };

  const getDayName = (day) => {
    const days = {
      2: 'Thứ 2',
      3: 'Thứ 3',
      4: 'Thứ 4',
      5: 'Thứ 5',
      6: 'Thứ 6',
      7: 'Thứ 7'
    };
    return days[day] || 'N/A';
  };

  const getPeriodName = (period) => {
    return `Ca ${period}`;
  };

  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = 
      schedule.TenMonHoc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.TenLop?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.PhongHoc?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDay = !filters.dayFilter || schedule.Thu === parseInt(filters.dayFilter);
    const matchesPeriod = !filters.periodFilter || schedule.CaHoc === parseInt(filters.periodFilter);
    
    return matchesSearch && matchesDay && matchesPeriod;
  });

  const handleSearch = () => {
    setSearchTerm(displaySearchTerm);
  };

  const handleApplyFilters = () => {
    setFilters({ ...displayFilters });
    setShowFilters(false);
  };

  const handleRefresh = () => {
    fetchData();
  };

  const clearFilters = () => {
    setFilters({ dayFilter: '', periodFilter: '' });
    setDisplayFilters({ dayFilter: '', periodFilter: '' });
    setSearchTerm('');
    setDisplaySearchTerm('');
  };

  const activeFilterCount = (filters.dayFilter ? 1 : 0) + (filters.periodFilter ? 1 : 0) + (searchTerm ? 1 : 0);
  const hasActiveFilters = filters.dayFilter || filters.periodFilter || searchTerm;

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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Quản lý lịch học</h2>
          <p className="text-gray-500">Thêm, sửa, xóa lịch học</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          Thêm lịch học
        </motion.button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="relative w-2/3">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm lịch học..."
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
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            className="flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-xl shadow-lg transition-all"
          >
            <RefreshCw className="w-5 h-5" />
            Làm mới
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
            className="bg-gray-50 rounded-xl p-4 space-y-4 relative z-50 w-2/3"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lọc theo ngày</label>
                <select
                  value={displayFilters.dayFilter}
                  onChange={(e) => setDisplayFilters({ ...displayFilters, dayFilter: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                >
                  <option value="">Tất cả ngày</option>
                  <option value="2">Thứ 2</option>
                  <option value="3">Thứ 3</option>
                  <option value="4">Thứ 4</option>
                  <option value="5">Thứ 5</option>
                  <option value="6">Thứ 6</option>
                  <option value="7">Thứ 7</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lọc theo ca</label>
                <select
                  value={displayFilters.periodFilter}
                  onChange={(e) => setDisplayFilters({ ...displayFilters, periodFilter: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                >
                  <option value="">Tất cả ca</option>
                  <option value="1">Ca 1</option>
                  <option value="2">Ca 2</option>
                  <option value="3">Ca 3</option>
                  <option value="4">Ca 4</option>
                  <option value="5">Ca 5</option>
                  <option value="6">Ca 6</option>
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
                onClick={() => setDisplayFilters({ dayFilter: '', periodFilter: '' })}
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
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Thứ</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Ca</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Phòng</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Môn học</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Lớp</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Giảng viên</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Học kỳ</th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.length > 0 ? (
                filteredSchedules.map((schedule, index) => (
                  <motion.tr
                    key={schedule.MaLichHoc}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-orange-50 transition-colors"
                  >
                    <td className="py-4 px-6 text-sm font-medium text-gray-800">{getDayName(schedule.Thu)}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{getPeriodName(schedule.CaHoc)}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{schedule.PhongHoc || 'N/A'}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{schedule.TenMonHoc || 'N/A'}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{schedule.TenLop || 'N/A'}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{schedule.TenGiangVien || 'N/A'}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{schedule.HocKy || 'N/A'}</td>
                    <td className="py-4 px-6 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEdit(schedule)}
                          className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(schedule.MaLichHoc)}
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
                  <td colSpan="8" className="py-12 text-center text-gray-500">
                    Không tìm thấy lịch học nào
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
                {editingSchedule ? 'Cập nhật lịch học' : 'Thêm lịch học mới'}
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phân công giảng dạy</label>
                <select
                  value={formData.MaPhanCong}
                  onChange={(e) => setFormData({ ...formData, MaPhanCong: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  required
                >
                  <option value="">Chọn phân công</option>
                  {teachingAssignments.map((assignment) => (
                    <option key={assignment.MaPhanCong} value={assignment.MaPhanCong}>
                      {assignment.TenMonHoc} - {assignment.TenLop} - {assignment.HocKy}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Thứ</label>
                <select
                  value={formData.Thu}
                  onChange={(e) => setFormData({ ...formData, Thu: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  required
                >
                  <option value="">Chọn thứ</option>
                  <option value="2">Thứ 2</option>
                  <option value="3">Thứ 3</option>
                  <option value="4">Thứ 4</option>
                  <option value="5">Thứ 5</option>
                  <option value="6">Thứ 6</option>
                  <option value="7">Thứ 7</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ca học</label>
                <select
                  value={formData.CaHoc}
                  onChange={(e) => setFormData({ ...formData, CaHoc: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  required
                >
                  <option value="">Chọn ca</option>
                  <option value="1">Ca 1</option>
                  <option value="2">Ca 2</option>
                  <option value="3">Ca 3</option>
                  <option value="4">Ca 4</option>
                  <option value="5">Ca 5</option>
                  <option value="6">Ca 6</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phòng học</label>
                <input
                  type="text"
                  value={formData.PhongHoc}
                  onChange={(e) => setFormData({ ...formData, PhongHoc: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all"
                >
                  {editingSchedule ? 'Cập nhật' : 'Thêm mới'}
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

export default ScheduleManagement;
