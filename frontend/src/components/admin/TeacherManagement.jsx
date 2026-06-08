import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Edit, Trash2, Search, X, Filter, XCircle, Calendar, FileText, Download, UserCheck, Mail, Phone, Award, BookOpen, BarChart3, Clock, MapPin } from 'lucide-react';
import axios from 'axios';
import ModalPortal from '../ModalPortal';

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
  const [confirmDialog, setConfirmDialog] = useState({ show: false, message: '', onConfirm: null });
  const [successDialog, setSuccessDialog] = useState({ show: false, message: '' });
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

  const handleKhoaChange = async (e) => {
    const maKhoa = e.target.value;
    setFormData(prev => ({ ...prev, MaKhoa: maKhoa, MaGiangVien: '' }));

    if (editingTeacher || !maKhoa) return;

    // Lấy ID của khoa từ danh sách đã load
    const selectedFaculty = faculties.find(f => f.MaKhoa === maKhoa);
    const khoaId = selectedFaculty?.ID ?? selectedFaculty?.id ?? '';
    if (!khoaId) return;

    try {
      const res = await axios.get(`http://localhost:5000/api/teachers/next-code/${khoaId}`);
      setFormData(prev => ({ ...prev, MaKhoa: maKhoa, MaGiangVien: res.data.MaGiangVien }));
    } catch (err) {
      console.error('Lỗi tạo mã giảng viên:', err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmDialog({
      show: true,
      message: `Bạn có chắc chắn muốn ${editingTeacher ? 'cập nhật' : 'thêm'} giảng viên ${formData.HoTen} không?`,
      onConfirm: async () => {
        try {
          if (editingTeacher) {
            await axios.put(`http://localhost:5000/api/teachers/${editingTeacher.MaGiangVien}`, formData);
          } else {
            // Lấy mã mới nhất ngay trước khi gửi để tránh trùng
            const selectedFaculty = faculties.find(f => f.MaKhoa === formData.MaKhoa);
            const khoaId = selectedFaculty?.ID ?? selectedFaculty?.id ?? '';
            const resCode = await axios.get(`http://localhost:5000/api/teachers/next-code/${khoaId}`);
            const newMaGV = resCode.data.MaGiangVien;
            await axios.post('http://localhost:5000/api/teachers', { ...formData, MaGiangVien: newMaGV });
          }
          setSuccessDialog({ show: true, message: editingTeacher ? 'Cập nhật giảng viên thành công!' : 'Thêm giảng viên thành công!' });
          fetchData();
          handleCloseModal();
        } catch (error) {
          console.error('Lỗi lưu dữ liệu:', error);
          setSuccessDialog({ show: true, message: 'Lỗi khi lưu dữ liệu: ' + (error.response?.data?.error || error.message) });
        }
      }
    });
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

  const handleDelete = async (teacher) => {
    setConfirmDialog({
      show: true,
      message: `Bạn có chắc chắn muốn xóa giảng viên?\n${teacher.HoTen} (${teacher.MaGiangVien})`,
      onConfirm: async () => {
        try {
          await axios.delete(`http://localhost:5000/api/teachers/${teacher.MaGiangVien}`);
          setTeachers(prev => prev.filter(t => t.MaGiangVien !== teacher.MaGiangVien));
          setSuccessDialog({ show: true, message: 'Xóa giảng viên thành công!' });
        } catch (error) {
          console.error('Error deleting teacher:', error);
          setSuccessDialog({ show: true, message: error.response?.data?.message || 'Lỗi khi xóa giảng viên!' });
        }
      }
    });
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
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 shadow-xl shadow-orange-500/10">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Users className="w-8 h-8" />
              Quản lý giảng viên
            </h2>
            <p className="text-orange-100 text-lg">Thêm, sửa và xem chi tiết thông tin giảng viên</p>
          </div>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExportTeachers}
              className="flex items-center gap-2 bg-white text-orange-600 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
            >
              <Download className="w-5 h-5" />
              Export
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setEditingTeacher(null); setFormData({ MaGiangVien: '', HoTen: '', Email: '', SoDienThoai: '', MaKhoa: '' }); setShowModal(true); }}
              className="flex items-center gap-2 bg-white text-orange-600 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
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
                          onClick={() => handleDelete(teacher)}
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
        <ModalPortal>
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 flex justify-between items-center flex-shrink-0">
              <div className="text-white">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  {editingTeacher ? 'Cập nhật thông tin giảng viên' : 'Thêm giảng viên mới'}
                </h3>
                <p className="text-orange-100 text-sm mt-0.5">
                  {editingTeacher ? 'Chỉnh sửa hồ sơ giảng viên' : 'Tạo hồ sơ giảng viên theo khoa chuyên môn'}
                </p>
              </div>
              <button onClick={handleCloseModal} className="p-2 hover:bg-white/20 rounded-lg text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Khoa chuyên môn</label>
                  <select
                    value={formData.MaKhoa}
                    onChange={handleKhoaChange}
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
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mã giảng viên</label>
                  <input
                    type="text"
                    value={formData.MaGiangVien}
                    readOnly
                    placeholder={!editingTeacher && !formData.MaKhoa ? 'Chọn khoa để tạo mã tự động' : ''}
                    className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-xl focus:outline-none transition-colors opacity-70 cursor-not-allowed font-mono"
                    required
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
                  className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-lg"
                >
                  {editingTeacher ? 'Lưu thay đổi' : 'Thêm giảng viên'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
        </ModalPortal>
      )}
            {confirmDialog.show && (
        <ModalPortal>
          <div className="fixed inset-0 flex items-center justify-center z-[60] bg-black/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 text-center mb-2">Xác nhận xóa</h3>
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5 text-center">
                {confirmDialog.message.split('\n').map((line, i) => (
                  <p key={i} className={i === 0 ? 'text-sm text-gray-600' : 'font-bold text-gray-800 mt-1'}>{line}</p>
                ))}
                <p className="text-xs text-red-500 font-medium mt-2">Hành động này không thể hoàn tác.</p>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setConfirmDialog({ ...confirmDialog, show: false })}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { confirmDialog.onConfirm(); setConfirmDialog({ ...confirmDialog, show: false }); }}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-semibold shadow-lg shadow-red-100 hover:from-red-600 hover:to-red-700 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Xóa
                </motion.button>
              </div>
            </motion.div>
          </div>
        </ModalPortal>
      )}

      {successDialog.show && (
        <ModalPortal>
          <div className="fixed inset-0 flex items-center justify-center z-[60] bg-black/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-100 rounded-full p-3">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Thông báo</h3>
              </div>
              <p className="text-gray-600 mb-6">{successDialog.message}</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSuccessDialog({ show: false, message: '' })}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-semibold"
              >
                Đóng
              </motion.button>
            </motion.div>
          </div>
        </ModalPortal>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedTeacher && (
        <ModalPortal>
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
                      <UserCheck className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-orange-100 text-sm font-medium uppercase tracking-widest">Chi tiết giảng viên</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mt-2">{teacherDetails?.HoTen || selectedTeacher.HoTen}</h2>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full font-mono">{teacherDetails?.MaGiangVien || selectedTeacher.MaGiangVien}</span>
                    {teacherDetails?.TenKhoa && (
                      <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full">{teacherDetails.TenKhoa}</span>
                    )}
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
                  { id: 'info', label: 'Thông tin', icon: Users },
                  { id: 'schedule', label: 'Lịch giảng dạy', icon: Calendar },
                  { id: 'load', label: 'Tải công việc', icon: FileText }
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
              {detailTab === 'info' && teacherDetails && (
                <div className="space-y-6">
                  {/* Stats cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Lớp dạy', value: teachingSchedule.length, icon: BookOpen, color: 'blue' },
                      { label: 'Môn học', value: [...new Set(teachingSchedule.map(s => s.TenMonHoc))].length, icon: BarChart3, color: 'green' },
                      { label: 'Tín chỉ', value: teachingLoad.reduce((sum, l) => sum + (parseInt(l.SoTinChi) || 0), 0), icon: Award, color: 'purple' },
                      { label: 'Ca/tuần', value: teachingSchedule.length, icon: Calendar, color: 'orange' },
                    ].map((card, i) => {
                      const Icon = card.icon;
                      const colorMap = {
                        blue: 'bg-blue-50 text-blue-600 border-blue-100',
                        green: 'bg-green-50 text-green-600 border-green-100',
                        purple: 'bg-purple-50 text-purple-600 border-purple-100',
                        orange: 'bg-orange-50 text-orange-600 border-orange-100',
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

                  {/* Personal info */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Thông tin cá nhân</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { label: 'Mã giảng viên', value: teacherDetails.MaGiangVien, icon: null },
                        { label: 'Họ và tên', value: teacherDetails.HoTen, icon: null },
                        { label: 'Email', value: teacherDetails.Email, icon: Mail },
                        { label: 'Số điện thoại', value: teacherDetails.SoDienThoai, icon: Phone },
                        { label: 'Khoa trực thuộc', value: teacherDetails.TenKhoa, icon: null },
                      ].map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 border border-gray-100"
                        >
                          {item.icon && <item.icon className="w-5 h-5 text-gray-400" />}
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 font-medium">{item.label}</div>
                            <div className="font-semibold text-gray-800 text-sm">{item.value || '—'}</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {detailTab === 'schedule' && (
                <ScheduleDetailView
                  schedule={teachingSchedule}
                  title="Lịch giảng dạy"
                  emptyMessage="Chưa có lịch giảng dạy nào"
                  showClass={true}
                  showHocKy={false}
                />
              )}

              {detailTab === 'load' && (
                <div>
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                    Tải công việc ({teachingLoad.length} môn)
                  </h4>
                  {teachingLoad.length > 0 ? (
                    <div className="overflow-x-auto rounded-2xl border border-gray-100">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gradient-to-r from-orange-50 to-orange-100">
                            <th className="text-left py-3.5 px-5 text-xs font-bold text-gray-600 uppercase tracking-wider">Môn học</th>
                            <th className="text-left py-3.5 px-5 text-xs font-bold text-gray-600 uppercase tracking-wider">Số tín chỉ</th>
                            <th className="text-left py-3.5 px-5 text-xs font-bold text-gray-600 uppercase tracking-wider">Lớp học</th>
                            <th className="text-left py-3.5 px-5 text-xs font-bold text-gray-600 uppercase tracking-wider">Học kỳ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teachingLoad.map((load, index) => (
                            <motion.tr
                              key={index}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.03 }}
                              className="border-t border-gray-50 hover:bg-orange-50/40 transition-colors"
                            >
                              <td className="py-3.5 px-5 font-semibold text-gray-800 text-sm">{load.TenMonHoc}</td>
                              <td className="py-3.5 px-5">
                                <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-md font-bold text-sm">{load.SoTinChi}</span>
                              </td>
                              <td className="py-3.5 px-5 text-sm text-gray-600">{load.TenLop}</td>
                              <td className="py-3.5 px-5 text-sm text-gray-600">{load.HocKy}</td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                      <FileText className="w-14 h-14 mb-3 text-gray-200" />
                      <p className="font-medium">Chưa có dữ liệu tải giảng dạy</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
}

const SCHEDULE_DAY_ORDER = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
const SCHEDULE_DAY_NAMES = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const SCHEDULE_CA_SLOTS = {
  '1': { label: 'Ca 1', time: 'Tiết 1–3', color: 'bg-orange-100 text-orange-700' },
  '2': { label: 'Ca 2', time: 'Tiết 4–6', color: 'bg-amber-100 text-amber-700' },
  '3': { label: 'Ca 3', time: 'Tiết 7–9', color: 'bg-orange-200 text-orange-800' },
  '4': { label: 'Ca 4', time: 'Tiết 10–12', color: 'bg-amber-200 text-amber-800' },
};

function scheduleDayOfWeek(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '';
  return SCHEDULE_DAY_NAMES[d.getDay()];
}

function scheduleFormatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('vi-VN');
}

function scheduleCaSlot(ca) {
  return SCHEDULE_CA_SLOTS[String(ca)] || { label: `Ca ${ca}`, time: '', color: 'bg-gray-100 text-gray-700' };
}

function enrichScheduleItem(item) {
  const thu = scheduleDayOfWeek(item?.NgayHoc);
  return {
    ...item,
    Thu: thu,
    NgayFormatted: scheduleFormatDate(item?.NgayHoc),
  };
}

function groupScheduleByDay(items) {
  const sorted = [...items].sort((a, b) => {
    const ta = a.NgayHoc ? new Date(a.NgayHoc).getTime() : 0;
    const tb = b.NgayHoc ? new Date(b.NgayHoc).getTime() : 0;
    if (ta !== tb) return ta - tb;
    return Number(a.CaHoc) - Number(b.CaHoc);
  }).map(enrichScheduleItem);

  const buckets = Object.fromEntries(SCHEDULE_DAY_ORDER.map((d) => [d, []]));
  sorted.forEach((item) => {
    if (item.Thu && buckets[item.Thu]) buckets[item.Thu].push(item);
    else {
      if (!buckets._other) buckets._other = [];
      buckets._other.push(item);
    }
  });

  const groups = SCHEDULE_DAY_ORDER.filter((d) => buckets[d].length > 0).map((day) => ({
    day,
    items: buckets[day],
  }));
  if (buckets._other?.length) {
    groups.push({ day: 'Khác', items: buckets._other });
  }
  return groups;
}

function ScheduleCaBadge({ ca }) {
  const slot = scheduleCaSlot(ca);
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${slot.color}`}>
      <Clock className="w-3 h-3 shrink-0" />
      {slot.label}
      {slot.time ? <span className="font-normal opacity-80">· {slot.time}</span> : null}
    </span>
  );
}

function ScheduleSessionCard({ item, showClass = true, showHocKy = false }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:border-orange-200 hover:shadow-md transition-all">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <h5 className="font-semibold text-gray-800 text-sm leading-snug">{item.TenMonHoc || '—'}</h5>
        <ScheduleCaBadge ca={item.CaHoc} />
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
        {item.NgayFormatted && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1">
            <Calendar className="w-3.5 h-3.5 text-orange-500" />
            {item.NgayFormatted}
          </span>
        )}
        {item.PhongHoc && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1">
            <MapPin className="w-3.5 h-3.5 text-orange-500" />
            {item.PhongHoc}
          </span>
        )}
        {showClass && item.TenLop && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1">
            <UserCheck className="w-3.5 h-3.5 text-orange-500" />
            {item.TenLop}
          </span>
        )}
        {showHocKy && item.HocKy && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-orange-50 text-orange-700 px-2 py-1 font-medium">
            <BookOpen className="w-3.5 h-3.5" />
            {item.HocKy}
          </span>
        )}
        {item.MaLopHocPhan && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1 font-mono text-[11px]">
            {item.MaLopHocPhan}
          </span>
        )}
      </div>
    </div>
  );
}

function ScheduleDetailView({
  schedule,
  title = 'Lịch học',
  emptyMessage = 'Chưa có lịch học nào',
  showClass = true,
  showHocKy = false,
}) {
  const items = useMemo(() => (Array.isArray(schedule) ? schedule : []), [schedule]);
  const groups = useMemo(() => groupScheduleByDay(items), [items]);
  const stats = useMemo(() => ({
    sessions: items.length,
    subjects: new Set(items.map((s) => s.TenMonHoc).filter(Boolean)).size,
  }), [items]);

  if (items.length === 0) {
    return (
      <div>
        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">{title}</h4>
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Calendar className="w-14 h-14 mb-3 text-gray-200" />
          <p className="font-medium">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">{title}</h4>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-orange-100 text-orange-700 px-3 py-1 font-semibold">{stats.sessions} buổi</span>
          <span className="rounded-full bg-blue-100 text-blue-700 px-3 py-1 font-semibold">{stats.subjects} môn</span>
        </div>
      </div>
      <div className="space-y-6">
        {groups.map((group) => (
          <section key={group.day}>
            <div className="flex items-baseline justify-between gap-2 mb-3 border-b border-orange-100 pb-2">
              <p className="font-bold text-gray-800 text-sm">{group.day}</p>
              <p className="text-xs text-gray-500 shrink-0">{group.items.length} buổi</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {group.items.map((item) => (
                <ScheduleSessionCard
                  key={item.MaLichHoc ?? `${item.TenMonHoc}-${item.NgayHoc}-${item.CaHoc}`}
                  item={item}
                  showClass={showClass}
                  showHocKy={showHocKy}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default TeacherManagement;