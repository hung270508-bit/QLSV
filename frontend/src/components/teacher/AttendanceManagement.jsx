import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardCheck, Plus, Edit, Trash2, Search, X, Filter, XCircle, Download, CheckCircle, BarChart3 } from 'lucide-react';
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
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [bulkAttendance, setBulkAttendance] = useState([]);
  const [showStats, setShowStats] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    excused: 0,
    attendanceRate: 0
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

  const handleBulkCheckIn = () => {
    setShowBulkModal(true);
    setBulkAttendance(students.map(student => ({
      MSSV: student.MSSV,
      HoTen: student.HoTen,
      TrangThai: 'Có mặt'
    })));
  };

  const handleCloseBulkModal = () => {
    setShowBulkModal(false);
    setSelectedSchedule('');
    setSelectedDate('');
    setBulkAttendance([]);
  };

  const handleBulkAttendanceChange = (mssv, status) => {
    setBulkAttendance(prev => 
      prev.map(item => 
        item.MSSV === mssv ? { ...item, TrangThai: status } : item
      )
    );
  };

  const handleBulkSubmit = async () => {
    if (!selectedSchedule || !selectedDate) {
      alert('Vui lòng chọn lịch học và ngày điểm danh!');
      return;
    }

    try {
      const attendanceData = bulkAttendance.map(item => ({
        MSSV: item.MSSV,
        MaLichHoc: selectedSchedule,
        NgayDiemDanh: selectedDate,
        TrangThai: item.TrangThai
      }));

      await axios.post('http://localhost:5000/api/attendance/bulk', { attendance: attendanceData });
      fetchData();
      handleCloseBulkModal();
      alert('Điểm danh thành công!');
    } catch (error) {
      console.error('Error saving bulk attendance:', error);
      alert('Lỗi khi lưu điểm danh!');
    }
  };

  const handleCalculateStats = () => {
    const total = attendance.length;
    const present = attendance.filter(a => a.TrangThai === 'Có mặt').length;
    const absent = attendance.filter(a => a.TrangThai === 'Vắng mặt').length;
    const excused = attendance.filter(a => a.TrangThai === 'Có phép').length;
    const attendanceRate = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

    setAttendanceStats({
      total,
      present,
      absent,
      excused,
      attendanceRate
    });
    setShowStats(true);
  };

  const handleExport = () => {
    const csvContent = [
      ['MSSV', 'Sinh viên', 'Môn học', 'Ngày điểm danh', 'Trạng thái'],
      ...filteredAttendance.map(att => [
        att.MSSV,
        att.TenSinhVien || 'N/A',
        att.TenMonHoc || 'N/A',
        att.NgayDiemDanh ? new Date(att.NgayDiemDanh).toLocaleDateString('vi-VN') : 'N/A',
        att.TrangThai || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'diem_danh.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBulkCheckIn}
            className="flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-xl shadow-lg transition-all"
          >
            <CheckCircle className="w-5 h-5" />
            Điểm danh hàng loạt
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCalculateStats}
            className="flex items-center gap-2 bg-purple-500 text-white px-6 py-3 rounded-xl shadow-lg transition-all"
          >
            <BarChart3 className="w-5 h-5" />
            Thống kê
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExport}
            className="flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg transition-all"
          >
            <Download className="w-5 h-5" />
            Xuất CSV
          </motion.button>
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
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="relative w-1/2">
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
            className="bg-orange-50 rounded-xl p-4 space-y-4 relative z-50 w-1/2"
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
            <thead className="bg-orange-50">
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
                    className="border-b border-gray-100 hover:bg-orange-50 transition-colors"
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
                  className="w-full px-4 py-3 bg-orange-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
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
                  className="w-full px-4 py-3 bg-orange-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
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
                  className="w-full px-4 py-3 bg-orange-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Trạng thái</label>
                <select
                  value={formData.TrangThai}
                  onChange={(e) => setFormData({ ...formData, TrangThai: e.target.value })}
                  className="w-full px-4 py-3 bg-orange-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
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

      {/* Bulk Check-in Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Điểm danh hàng loạt</h3>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleCloseBulkModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </motion.button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Lịch học</label>
                  <select
                    value={selectedSchedule}
                    onChange={(e) => setSelectedSchedule(e.target.value)}
                    className="w-full px-4 py-3 bg-orange-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
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
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-3 bg-orange-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto mb-6">
              <table className="w-full">
                <thead className="bg-orange-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">MSSV</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Họ tên</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkAttendance.map((student) => (
                    <tr key={student.MSSV} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm text-gray-800">{student.MSSV}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{student.HoTen}</td>
                      <td className="py-3 px-4 text-sm">
                        <select
                          value={student.TrangThai}
                          onChange={(e) => handleBulkAttendanceChange(student.MSSV, e.target.value)}
                          className="px-3 py-2 bg-orange-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
                        >
                          <option value="Có mặt">Có mặt</option>
                          <option value="Vắng mặt">Vắng mặt</option>
                          <option value="Có phép">Có phép</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBulkSubmit}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold shadow-lg transition-all"
              >
                Lưu điểm danh
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCloseBulkModal}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Hủy
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Statistics Modal */}
      {showStats && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Thống kê điểm danh</h3>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowStats(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </motion.button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-6 rounded-xl text-center">
                <div className="text-3xl font-bold text-blue-600">{attendanceStats.total}</div>
                <div className="text-sm text-gray-600">Tổng điểm danh</div>
              </div>
              <div className="bg-green-50 p-6 rounded-xl text-center">
                <div className="text-3xl font-bold text-green-600">{attendanceStats.present}</div>
                <div className="text-sm text-gray-600">Có mặt</div>
              </div>
              <div className="bg-red-50 p-6 rounded-xl text-center">
                <div className="text-3xl font-bold text-red-600">{attendanceStats.absent}</div>
                <div className="text-sm text-gray-600">Vắng mặt</div>
              </div>
              <div className="bg-yellow-50 p-6 rounded-xl text-center">
                <div className="text-3xl font-bold text-yellow-600">{attendanceStats.excused}</div>
                <div className="text-sm text-gray-600">Có phép</div>
              </div>
            </div>

            <div className="mt-6 bg-purple-50 p-6 rounded-xl text-center">
              <div className="text-4xl font-bold text-purple-600">{attendanceStats.attendanceRate}%</div>
              <div className="text-sm text-gray-600">Tỷ lệ đi học</div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default AttendanceManagement;
