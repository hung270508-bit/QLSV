import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Edit, Trash2, Search, X, Filter, XCircle, Calendar, FileText, Download } from 'lucide-react';
import axios from 'axios';

function TeacherManagement() {
  const [teachers, setTeachers] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [displaySearchTerm, setDisplaySearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ facultyFilter: '' });
  const [displayFilters, setDisplayFilters] = useState({ facultyFilter: '' });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherDetails, setTeacherDetails] = useState(null);
  const [teachingSchedule, setTeachingSchedule] = useState([]);
  const [teachingLoad, setTeachingLoad] = useState([]);
  const [detailTab, setDetailTab] = useState('info'); // 'info', 'schedule', 'load'
  const [formData, setFormData] = useState({
    MaGiangVien: '',
    HoTen: '',
    Email: '',
    SoDienThoai: '',
    MaKhoa: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teachersRes, facultiesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/teachers'),
        axios.get('http://localhost:5000/api/faculties')
      ]);
      setTeachers(teachersRes.data);
      setFaculties(facultiesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      loading && setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTeacher) {
        await axios.put(`http://localhost:5000/api/teachers/${editingTeacher.MaGiangVien}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/teachers', formData);
      }
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving teacher:', error);
      alert('Lỗi khi lưu giảng viên!');
    }
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      MaGiangVien: teacher.MaGiangVien,
      HoTen: teacher.HoTen,
      Email: teacher.Email || '',
      SoDienThoai: teacher.SoDienThoai || '',
      MaKhoa: teacher.MaKhoa || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (maGV) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa giảng viên này?')) {
      try {
        await axios.delete(`http://localhost:5000/api/teachers/${maGV}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting teacher:', error);
        alert('Lỗi khi xóa giảng viên!');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTeacher(null);
    setFormData({ MaGiangVien: '', HoTen: '', Email: '', SoDienThoai: '', MaKhoa: '' });
  };

  const handleViewDetails = async (teacher) => {
    setSelectedTeacher(teacher);
    setShowDetailModal(true);
    setDetailTab('info');
    
    try {
      const [detailsRes, scheduleRes, loadRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/teachers/${teacher.MaGiangVien}/details`),
        axios.get(`http://localhost:5000/api/teachers/${teacher.MaGiangVien}/teaching-schedule`),
        axios.get(`http://localhost:5000/api/teachers/${teacher.MaGiangVien}/teaching-load`)
      ]);
      
      setTeacherDetails(detailsRes.data[0] || null);
      setTeachingSchedule(scheduleRes.data);
      setTeachingLoad(loadRes.data);
    } catch (error) {
      console.error('Error fetching teacher details:', error);
    }
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedTeacher(null);
    setTeacherDetails(null);
    setTeachingSchedule([]);
    setTeachingLoad([]);
    setDetailTab('info');
  };

  const handleExportTeachers = () => {
    const csvContent = [
      ['Mã GV', 'Họ tên', 'Email', 'SĐT', 'Khoa'],
      ...filteredTeachers.map(t => [
        t.MaGiangVien,
        t.HoTen,
        t.Email,
        t.SoDienThoai,
        t.TenKhoa || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'giangVien.csv';
    link.click();
  };

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = 
      teacher.HoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.MaGiangVien.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFaculty = !filters.facultyFilter || teacher.MaKhoa === filters.facultyFilter;
    
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
    /* THAY ĐỔI TẠI ĐÂY: Thay max-w-7xl thành max-w-screen-2xl để khung tổng rộng ra */
    <div className="space-y-8 p-4 max-w-screen-3xl mx-auto W-full">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 rounded-2xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="text-white">
            <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Users className="w-8 h-8" />
              Quản lý giảng viên
            </h2>
            <p className="text-orange-100 text-base opacity-90">Thêm, sửa, xóa và xem chi tiết thông tin hệ thống giảng viên</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: "0 10px 20px rgba(0,0,0,0.15)" }}
              whileTap={{ scale: 0.97 }}
              onClick={handleExportTeachers}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-white/10 text-white border border-white/20 backdrop-blur-md px-5 py-3 rounded-xl font-semibold shadow-lg transition-all hover:bg-white hover:text-orange-600"
            >
              <Download className="w-5 h-5" />
              Xuất dữ liệu
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: "0 10px 20px rgba(0,0,0,0.15)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowModal(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-white text-orange-600 px-5 py-3 rounded-xl font-bold shadow-lg transition-all hover:bg-orange-50"
            >
              <Plus className="w-5 h-5" />
              Thêm giảng viên
            </motion.button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm giảng viên theo tên hoặc mã giảng viên..."
              value={displaySearchTerm}
              onChange={(e) => setDisplaySearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-gray-700"
            />
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-colors ${
                hasActiveFilters ? 'text-orange-600 bg-orange-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Filter className="w-5 h-5" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSearch}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-orange-100 hover:from-orange-600 hover:to-orange-700 transition-all"
            >
              <Search className="w-5 h-5" />
              Tìm kiếm
            </motion.button>
            {hasActiveFilters && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={clearFilters}
                className="px-5 py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors flex items-center gap-2 border-2 border-red-200/60"
              >
                <XCircle className="w-5 h-5" />
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
            className="bg-orange-50/50 border border-orange-100 rounded-xl p-4 mt-4 space-y-4 relative z-10 w-full"
          >
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Lọc theo khoa</label>
              <select
                value={displayFilters.facultyFilter}
                onChange={(e) => setDisplayFilters({ ...displayFilters, facultyFilter: e.target.value })}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors text-gray-700"
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
                className="flex-1 bg-orange-500 text-white py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors shadow-sm"
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

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-orange-50 to-orange-100/60 border-b border-orange-100">
              <tr>
                <th className="text-left py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Mã GV</th>
                <th className="text-left py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Họ tên</th>
                <th className="text-left py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Khoa</th>
                <th className="text-left py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Email</th>
                <th className="text-left py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">SĐT</th>
                <th className="text-center py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher, index) => (
                  <motion.tr
                    key={teacher.MaGiangVien}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-orange-50/40 transition-colors cursor-pointer"
                    onClick={() => handleViewDetails(teacher)}
                  >
                    <td className="py-4 px-6">
                      <span className="font-semibold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg text-sm">{teacher.MaGiangVien}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-gray-800">{teacher.HoTen}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        {teacher.TenKhoa || 'Chưa xếp khoa'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">{teacher.Email || 'N/A'}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{teacher.SoDienThoai || 'N/A'}</td>
                    <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEdit(teacher)}
                          className="p-2 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-100 transition-all shadow-sm border border-orange-100"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(teacher.MaGiangVien)}
                          className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all shadow-sm border border-red-100"
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
                  <td colSpan="6" className="py-16">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Users className="w-16 h-16 mb-4 text-orange-200" />
                      <p className="text-lg font-medium text-gray-600">Không tìm thấy giảng viên nào</p>
                      <p className="text-sm text-gray-400 mt-1">Thử tìm kiếm với từ khóa hoặc bộ lọc khác</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal (Add / Edit) */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/40">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-orange-100"
          >
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {editingTeacher ? 'Cập nhật thông tin giảng viên' : 'Thêm giảng viên mới'}
              </h3>
              <motion.button
                whileHover={{ scale: 1.1, bg: "#f3f4f6" }}
                whileTap={{ scale: 0.9 }}
                onClick={handleCloseModal}
                className="p-2 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mã giảng viên</label>
                  <input
                    type="text"
                    value={formData.MaGiangVien}
                    onChange={(e) => setFormData({ ...formData, MaGiangVien: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-colors disabled:opacity-60 disabled:bg-gray-100"
                    required
                    disabled={!!editingTeacher}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Họ tên</label>
                  <input
                    type="text"
                    value={formData.HoTen}
                    onChange={(e) => setFormData({ ...formData, HoTen: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.Email}
                    onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Số điện thoại</label>
                  <input
                    type="text"
                    value={formData.SoDienThoai}
                    onChange={(e) => setFormData({ ...formData, SoDienThoai: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Khoa chuyên môn</label>
                  <select
                    value={formData.MaKhoa}
                    onChange={(e) => setFormData({ ...formData, MaKhoa: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-colors text-gray-700"
                    required
                  >
                    <option value="">Chọn khoa</option>
                    {faculties.map((faculty) => (
                      <option key={faculty.MaKhoa} value={faculty.MaKhoa}>
                        {faculty.TenKhoa}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold shadow-lg shadow-orange-100 hover:from-orange-600 hover:to-orange-700 transition-all"
                >
                  {editingTeacher ? 'Cập nhật' : 'Thêm mới'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Hủy bỏ
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedTeacher && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/40">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-orange-100"
          >
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-2">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="bg-orange-500 text-white p-1.5 rounded-lg text-sm"><Users className="w-4 h-4" /></span>
                Hồ sơ chi tiết giảng viên
              </h3>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleCloseDetailModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Custom Tabs Design */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto pb-1">
              {[
                { id: 'info', label: 'Thông tin cá nhân', icon: Users },
                { id: 'schedule', label: 'Lịch giảng dạy', icon: Calendar },
                { id: 'load', label: 'Tải công việc', icon: FileText }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = detailTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setDetailTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 font-semibold transition-all rounded-t-xl text-sm whitespace-nowrap ${
                      isActive
                        ? 'text-orange-600 bg-orange-50 border-b-2 border-orange-600'
                        : 'text-gray-500 hover:text-orange-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="min-h-[250px]">
              {detailTab === 'info' && teacherDetails && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mã giảng viên</span>
                      <p className="font-semibold text-orange-600 text-base mt-1">{teacherDetails.MaGiangVien}</p>
                    </div>
                    <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Họ và tên</span>
                      <p className="font-semibold text-gray-800 text-base mt-1">{teacherDetails.HoTen}</p>
                    </div>
                    <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Địa chỉ Email</span>
                      <p className="font-semibold text-gray-800 text-base mt-1">{teacherDetails.Email || 'Chưa cập nhật'}</p>
                    </div>
                    <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Số điện thoại</span>
                      <p className="font-semibold text-gray-800 text-base mt-1">{teacherDetails.SoDienThoai || 'Chưa cập nhật'}</p>
                    </div>
                    <div className="bg-orange-50/40 p-4 rounded-xl md:col-span-2 border border-orange-100/60">
                      <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">Khoa trực thuộc</span>
                      <p className="font-bold text-gray-800 text-lg mt-1">{teacherDetails.TenKhoa || 'N/A'}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {detailTab === 'schedule' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {teachingSchedule.length > 0 ? (
                    <div className="overflow-x-auto border border-gray-100 rounded-xl">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Thứ</th>
                            <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Ca học</th>
                            <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Phòng</th>
                            <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Môn học</th>
                            <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Lớp</th>
                            <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Học kỳ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {teachingSchedule.map((schedule, index) => (
                            <tr key={index} className="hover:bg-gray-50/60">
                              <td className="py-3 px-4 text-sm font-semibold text-gray-800">{schedule.Thu}</td>
                              <td className="py-3 px-4 text-sm text-gray-600">{schedule.CaHoc}</td>
                              <td className="py-3 px-4 text-sm text-gray-600"><span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-medium">{schedule.PhongHoc}</span></td>
                              <td className="py-3 px-4 text-sm font-medium text-gray-800">{schedule.TenMonHoc}</td>
                              <td className="py-3 px-4 text-sm text-gray-600">{schedule.TenLop}</td>
                              <td className="py-3 px-4 text-sm text-gray-500">{schedule.HocKy}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center text-gray-400 py-12 bg-gray-50 rounded-xl">Hiện tại chưa có dữ liệu lịch giảng dạy</p>
                  )}
                </motion.div>
              )}

              {detailTab === 'load' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {teachingLoad.length > 0 ? (
                    <div className="overflow-x-auto border border-gray-100 rounded-xl">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Môn học</th>
                            <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Số tín chỉ</th>
                            <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Lớp học phụ trách</th>
                            <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Học kỳ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {teachingLoad.map((load, index) => (
                            <tr key={index} className="hover:bg-gray-50/60">
                              <td className="py-3 px-4 text-sm font-medium text-gray-800">{load.TenMonHoc}</td>
                              <td className="py-3 px-4 text-sm text-center md:text-left"><span className="bg-orange-50 text-orange-600 px-2.5 py-0.5 font-bold rounded-md">{load.SoTinChi}</span></td>
                              <td className="py-3 px-4 text-sm text-gray-600">{load.TenLop}</td>
                              <td className="py-3 px-4 text-sm text-gray-500">{load.HocKy}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center text-gray-400 py-12 bg-gray-50 rounded-xl">Hiện tại chưa có dữ liệu tải giảng dạy</p>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default TeacherManagement;