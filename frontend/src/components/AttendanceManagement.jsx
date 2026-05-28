import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardCheck, Plus, Edit, Trash2, Search, X, Filter, XCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';

function AttendanceManagement() {
  const [attendance, setAttendance] = useState([]);
  const [students, setStudents] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [displaySearchTerm, setDisplaySearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    statusFilter: '',
    dateFilter: ''
  });
  const [displayFilters, setDisplayFilters] = useState({
    statusFilter: '',
    dateFilter: ''
  });
  const [formData, setFormData] = useState({
    MSSV: '',
    MaLichHoc: '',
    NgayDiemDanh: '',
    TrangThai: 'Có mặt'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [attendanceRes, studentsRes, schedulesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/attendance'),
        axios.get('http://localhost:5000/api/students'),
        axios.get('http://localhost:5000/api/schedules')
      ]);
      setAttendance(attendanceRes.data);
      setStudents(studentsRes.data);
      setSchedules(schedulesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAttendance) {
        await axios.put(`http://localhost:5000/api/attendance/${editingAttendance.MaDiemDanh}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/attendance', formData);
      }
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Lỗi khi lưu điểm danh!');
    }
  };

  const handleEdit = (att) => {
    setEditingAttendance(att);
    setFormData({
      MSSV: att.MSSV,
      MaLichHoc: att.MaLichHoc,
      NgayDiemDanh: att.NgayDiemDanh ? att.NgayDiemDanh.split('T')[0] : '',
      TrangThai: att.TrangThai || 'Có mặt'
    });
    setShowModal(true);
  };

  const handleDelete = async (maDiemDanh) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa điểm danh này?')) {
      try {
        await axios.delete(`http://localhost:5000/api/attendance/${maDiemDanh}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting attendance:', error);
        alert('Lỗi khi xóa điểm danh!');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAttendance(null);
    setFormData({
      MSSV: '',
      MaLichHoc: '',
      NgayDiemDanh: '',
      TrangThai: 'Có mặt'
    });
  };

  const filteredAttendance = attendance.filter(att => {
    const matchesSearch = 
      att.TenSinhVien?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      att.MSSV?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      att.TenMonHoc?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filters.statusFilter || att.TrangThai === filters.statusFilter;
    const matchesDate = !filters.dateFilter || (att.NgayDiemDanh && att.NgayDiemDanh.includes(filters.dateFilter));
    
    return matchesSearch && matchesStatus && matchesDate;
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
    setFilters({ statusFilter: '', dateFilter: '' });
    setDisplayFilters({ statusFilter: '', dateFilter: '' });
    setSearchTerm('');
    setDisplaySearchTerm('');
  };

  const activeFilterCount = (filters.statusFilter ? 1 : 0) + (filters.dateFilter ? 1 : 0) + (searchTerm ? 1 : 0);
  const hasActiveFilters = filters.statusFilter || filters.dateFilter || searchTerm;

  const getStatusColor = (status) => {
    switch(status) {
      case 'Có mặt': return 'bg-green-100 text-green-600';
      case 'Vắng mặt': return 'bg-red-100 text-red-600';
      case 'Có phép': return 'bg-yellow-100 text-yellow-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Quản lý điểm danh</h2>
          <p className="text-gray-500">Thêm, sửa, xóa điểm danh sinh viên</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          Thêm điểm danh
        </motion.button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="relative w-2/3">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm điểm danh..."
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lọc theo trạng thái</label>
                <select
                  value={displayFilters.statusFilter}
                  onChange={(e) => setDisplayFilters({ ...displayFilters, statusFilter: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="Có mặt">Có mặt</option>
                  <option value="Vắng mặt">Vắng mặt</option>
                  <option value="Có phép">Có phép</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lọc theo ngày</label>
                <input
                  type="date"
                  value={displayFilters.dateFilter}
                  onChange={(e) => setDisplayFilters({ ...displayFilters, dateFilter: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                />
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
                onClick={() => setDisplayFilters({ statusFilter: '', dateFilter: '' })}
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
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">MSSV</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Sinh viên</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Môn học</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Ngày điểm danh</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Trạng thái</th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.length > 0 ? (
                filteredAttendance.map((att, index) => (
                  <motion.tr
                    key={att.MaDiemDanh}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-6 text-sm font-medium text-gray-800">{att.MSSV}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{att.TenSinhVien || 'N/A'}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{att.TenMonHoc || 'N/A'}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {att.NgayDiemDanh ? new Date(att.NgayDiemDanh).toLocaleDateString('vi-VN') : 'N/A'}
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(att.TrangThai)}`}>
                        {att.TrangThai || 'N/A'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEdit(att)}
                          className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(att.MaDiemDanh)}
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
                  <td colSpan="6" className="py-12 text-center text-gray-500">
                    Không tìm thấy điểm danh nào
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
                {editingAttendance ? 'Cập nhật điểm danh' : 'Thêm điểm danh mới'}
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sinh viên</label>
                <select
                  value={formData.MSSV}
                  onChange={(e) => setFormData({ ...formData, MSSV: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  required
                >
                  <option value="">Chọn sinh viên</option>
                  {students.map((student) => (
                    <option key={student.MSSV} value={student.MSSV}>
                      {student.MSSV} - {student.HoTen}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lịch học</label>
                <select
                  value={formData.MaLichHoc}
                  onChange={(e) => setFormData({ ...formData, MaLichHoc: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  required
                >
                  <option value="">Chọn lịch học</option>
                  {schedules.map((schedule) => (
                    <option key={schedule.MaLichHoc} value={schedule.MaLichHoc}>
                      {schedule.TenMonHoc} - {schedule.TenLop}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ngày điểm danh</label>
                <input
                  type="date"
                  value={formData.NgayDiemDanh}
                  onChange={(e) => setFormData({ ...formData, NgayDiemDanh: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Trạng thái</label>
                <select
                  value={formData.TrangThai}
                  onChange={(e) => setFormData({ ...formData, TrangThai: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  required
                >
                  <option value="Có mặt">Có mặt</option>
                  <option value="Vắng mặt">Vắng mặt</option>
                  <option value="Có phép">Có phép</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all"
                >
                  {editingAttendance ? 'Cập nhật' : 'Thêm mới'}
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

export default AttendanceManagement;
