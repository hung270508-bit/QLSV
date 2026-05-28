import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Edit, Trash2, Search, X, Filter, XCircle, Eye, Download, Upload, FileText, Calendar, CheckCircle } from 'lucide-react';
import axios from 'axios';

function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [displaySearchTerm, setDisplaySearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    classFilter: '',
    genderFilter: ''
  });
  const [displayFilters, setDisplayFilters] = useState({
    classFilter: '',
    genderFilter: ''
  });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [studentTranscript, setStudentTranscript] = useState(null);
  const [studentSchedule, setStudentSchedule] = useState([]);
  const [studentAttendance, setStudentAttendance] = useState([]);
  const [detailTab, setDetailTab] = useState('info'); // 'info', 'transcript', 'schedule', 'attendance'
  const [formData, setFormData] = useState({
    MSSV: '',
    HoTen: '',
    NgaySinh: '',
    GioiTinh: 'Nam',
    Email: '',
    SoDienThoai: '',
    MaLop: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, classesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/students'),
        axios.get('http://localhost:5000/api/classes')
      ]);
      setStudents(studentsRes.data);
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
      if (editingStudent) {
        await axios.put(`http://localhost:5000/api/students/${editingStudent.MSSV}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/students', formData);
      }
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving student:', error);
      alert('Lỗi khi lưu sinh viên!');
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      MSSV: student.MSSV,
      HoTen: student.HoTen,
      NgaySinh: student.NgaySinh ? student.NgaySinh.split('T')[0] : '',
      GioiTinh: student.GioiTinh || 'Nam',
      Email: student.Email || '',
      SoDienThoai: student.SoDienThoai || '',
      MaLop: student.MaLop || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (mssv) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sinh viên này?')) {
      try {
        await axios.delete(`http://localhost:5000/api/students/${mssv}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('Lỗi khi xóa sinh viên!');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStudent(null);
    setFormData({
      MSSV: '',
      HoTen: '',
      NgaySinh: '',
      GioiTinh: 'Nam',
      Email: '',
      SoDienThoai: '',
      MaLop: ''
    });
  };

  const handleViewDetails = async (student) => {
    setSelectedStudent(student);
    setShowDetailModal(true);
    setDetailTab('info');
    
    try {
      const [detailsRes, transcriptRes, scheduleRes, attendanceRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/students/${student.MSSV}/details`),
        axios.get(`http://localhost:5000/api/academic/transcript/${student.MSSV}`),
        axios.get(`http://localhost:5000/api/students/${student.MSSV}/schedule`),
        axios.get(`http://localhost:5000/api/attendance/student/${student.MSSV}`)
      ]);
      
      setStudentDetails(detailsRes.data[0] || null);
      setStudentTranscript(transcriptRes.data);
      setStudentSchedule(scheduleRes.data);
      setStudentAttendance(attendanceRes.data);
    } catch (error) {
      console.error('Error fetching student details:', error);
    }
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedStudent(null);
    setStudentDetails(null);
    setStudentTranscript(null);
    setStudentSchedule([]);
    setStudentAttendance([]);
    setDetailTab('info');
  };

  const handleExportStudents = () => {
    const csvContent = [
      ['MSSV', 'Họ tên', 'Ngày sinh', 'Giới tính', 'Email', 'SĐT', 'Lớp'],
      ...filteredStudents.map(s => [
        s.MSSV,
        s.HoTen,
        s.NgaySinh,
        s.GioiTinh,
        s.Email,
        s.SoDienThoai,
        s.TenLop || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'sinhVien.csv';
    link.click();
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.HoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.MSSV.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass = !filters.classFilter || student.MaLop === filters.classFilter;
    const matchesGender = !filters.genderFilter || student.GioiTinh === filters.genderFilter;
    
    return matchesSearch && matchesClass && matchesGender;
  });

  const handleSearch = () => {
    setSearchTerm(displaySearchTerm);
  };

  const handleApplyFilters = () => {
    setFilters({ ...displayFilters });
    setShowFilters(false);
  };


  const clearFilters = () => {
    setFilters({ classFilter: '', genderFilter: '' });
    setDisplayFilters({ classFilter: '', genderFilter: '' });
    setSearchTerm('');
    setDisplaySearchTerm('');
  };

  const activeFilterCount = (filters.classFilter ? 1 : 0) + (filters.genderFilter ? 1 : 0) + (searchTerm ? 1 : 0);
  const hasActiveFilters = filters.classFilter || filters.genderFilter || searchTerm;

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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Quản lý sinh viên</h2>
          <p className="text-gray-500">Thêm, sửa, xóa thông tin sinh viên</p>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportStudents}
            className="flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg transition-all"
          >
            <Download className="w-5 h-5" />
            Export
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Thêm sinh viên
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
              placeholder="Tìm kiếm sinh viên..."
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lọc theo giới tính</label>
                <select
                  value={displayFilters.genderFilter}
                  onChange={(e) => setDisplayFilters({ ...displayFilters, genderFilter: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                >
                  <option value="">Tất cả</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
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
                onClick={() => setDisplayFilters({ classFilter: '', genderFilter: '' })}
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
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Họ tên</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Giới tính</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Lớp</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Email</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">SĐT</th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, index) => (
                  <motion.tr
                    key={student.MSSV}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-6 text-sm font-medium text-gray-800">{student.MSSV}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{student.HoTen}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{student.GioiTinh || 'N/A'}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{student.TenLop || 'N/A'}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{student.Email || 'N/A'}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{student.SoDienThoai || 'N/A'}</td>
                    <td className="py-4 px-6 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleViewDetails(student)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEdit(student)}
                          className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(student.MSSV)}
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
                  <td colSpan="7" className="py-12 text-center text-gray-500">
                    Không tìm thấy sinh viên nào
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
            className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {editingStudent ? 'Cập nhật sinh viên' : 'Thêm sinh viên mới'}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">MSSV</label>
                  <input
                    type="text"
                    value={formData.MSSV}
                    onChange={(e) => setFormData({ ...formData, MSSV: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                    required
                    disabled={!!editingStudent}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Họ tên</label>
                  <input
                    type="text"
                    value={formData.HoTen}
                    onChange={(e) => setFormData({ ...formData, HoTen: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ngày sinh</label>
                  <input
                    type="date"
                    value={formData.NgaySinh}
                    onChange={(e) => setFormData({ ...formData, NgaySinh: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Giới tính</label>
                  <select
                    value={formData.GioiTinh}
                    onChange={(e) => setFormData({ ...formData, GioiTinh: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.Email}
                    onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Số điện thoại</label>
                  <input
                    type="text"
                    value={formData.SoDienThoai}
                    onChange={(e) => setFormData({ ...formData, SoDienThoai: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
                <div className="md:col-span-2">
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
              </div>

              <div className="flex gap-3 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold shadow-lg transition-all"
                >
                  {editingStudent ? 'Cập nhật' : 'Thêm mới'}
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
      {showDetailModal && selectedStudent && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Chi tiết sinh viên</h3>
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
                { id: 'info', label: 'Thông tin', icon: Users },
                { id: 'transcript', label: 'Bảng điểm', icon: FileText },
                { id: 'schedule', label: 'Lịch học', icon: Calendar },
                { id: 'attendance', label: 'Điểm danh', icon: CheckCircle }
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
            {detailTab === 'info' && studentDetails && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <span className="text-sm text-gray-600">MSSV</span>
                    <p className="font-semibold text-gray-800">{studentDetails.MSSV}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <span className="text-sm text-gray-600">Họ tên</span>
                    <p className="font-semibold text-gray-800">{studentDetails.HoTen}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <span className="text-sm text-gray-600">Ngày sinh</span>
                    <p className="font-semibold text-gray-800">{studentDetails.NgaySinh}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <span className="text-sm text-gray-600">Giới tính</span>
                    <p className="font-semibold text-gray-800">{studentDetails.GioiTinh}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <span className="text-sm text-gray-600">Email</span>
                    <p className="font-semibold text-gray-800">{studentDetails.Email}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <span className="text-sm text-gray-600">SĐT</span>
                    <p className="font-semibold text-gray-800">{studentDetails.SoDienThoai}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <span className="text-sm text-gray-600">Lớp</span>
                    <p className="font-semibold text-gray-800">{studentDetails.TenLop}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <span className="text-sm text-gray-600">Khoa</span>
                    <p className="font-semibold text-gray-800">{studentDetails.TenKhoa}</p>
                  </div>
                </div>
              </div>
            )}

            {detailTab === 'transcript' && studentTranscript && (
              <div className="space-y-4">
                {studentTranscript.summary && (
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="bg-blue-50 p-4 rounded-xl text-center">
                      <p className="text-2xl font-bold text-blue-600">{studentTranscript.summary.totalCredits}</p>
                      <p className="text-sm text-gray-600">Tổng tín chỉ</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl text-center">
                      <p className="text-2xl font-bold text-green-600">{studentTranscript.summary.passedCredits}</p>
                      <p className="text-sm text-gray-600">Tín chỉ qua</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl text-center">
                      <p className="text-2xl font-bold text-purple-600">{studentTranscript.summary.cumulativeGPA}</p>
                      <p className="text-sm text-gray-600">GPA tích lũy</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-xl text-center">
                      <p className="text-2xl font-bold text-orange-600">{studentTranscript.summary.passRate}%</p>
                      <p className="text-sm text-gray-600">Tỷ lệ qua</p>
                    </div>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Môn học</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Học kỳ</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">QT</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">GK</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">CK</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">TB</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Điểm chữ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentTranscript.transcript && studentTranscript.transcript.map((grade, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-3 px-4 text-sm text-gray-800">{grade.TenMonHoc}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{grade.HocKy}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{grade.DiemQuaTrinh || '-'}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{grade.DiemGiuaKy || '-'}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{grade.DiemCuoiKy || '-'}</td>
                          <td className="py-3 px-4 text-sm font-bold text-orange-600">{grade.DiemTB}</td>
                          <td className="py-3 px-4 text-sm font-semibold text-gray-800">{grade.DiemChu}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {detailTab === 'schedule' && (
              <div className="space-y-4">
                {studentSchedule.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Thứ</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Ca</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Phòng</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Môn học</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Giảng viên</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentSchedule.map((schedule, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="py-3 px-4 text-sm text-gray-800">{schedule.Thu}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{schedule.CaHoc}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{schedule.PhongHoc}</td>
                            <td className="py-3 px-4 text-sm text-gray-800">{schedule.TenMonHoc}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{schedule.TenGiangVien}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">Chưa có lịch học</p>
                )}
              </div>
            )}

            {detailTab === 'attendance' && (
              <div className="space-y-4">
                {studentAttendance.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Ngày</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Phòng</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentAttendance.map((att, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="py-3 px-4 text-sm text-gray-800">
                              {new Date(att.NgayDiemDanh).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">{att.PhongHoc}</td>
                            <td className="py-3 px-4 text-sm">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                att.TrangThai === 'Có mặt' ? 'bg-green-100 text-green-600' :
                                att.TrangThai === 'Vắng mặt' ? 'bg-red-100 text-red-600' :
                                'bg-yellow-100 text-yellow-600'
                              }`}>
                                {att.TrangThai}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">Chưa có dữ liệu điểm danh</p>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default StudentManagement;
