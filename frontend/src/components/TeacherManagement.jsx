import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Edit, Trash2, Search, X, Filter, XCircle, RefreshCw } from 'lucide-react';
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
  const [filters, setFilters] = useState({
    facultyFilter: ''
  });
  const [displayFilters, setDisplayFilters] = useState({
    facultyFilter: ''
  });
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
      setLoading(false);
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
    setFormData({
      MaGiangVien: '',
      HoTen: '',
      Email: '',
      SoDienThoai: '',
      MaKhoa: ''
    });
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

  const handleRefresh = () => {
    fetchData();
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Quản lý giảng viên</h2>
          <p className="text-gray-500">Thêm, sửa, xóa thông tin giảng viên</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          Thêm giảng viên
        </motion.button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="relative w-2/3">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm giảng viên..."
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
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Mã GV</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Họ tên</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Khoa</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Email</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">SĐT</th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher, index) => (
                  <motion.tr
                    key={teacher.MaGiangVien}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-6 text-sm font-medium text-gray-800">{teacher.MaGiangVien}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{teacher.HoTen}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{teacher.TenKhoa || 'N/A'}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{teacher.Email || 'N/A'}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{teacher.SoDienThoai || 'N/A'}</td>
                    <td className="py-4 px-6 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEdit(teacher)}
                          className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(teacher.MaGiangVien)}
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
                    Không tìm thấy giảng viên nào
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
                {editingTeacher ? 'Cập nhật giảng viên' : 'Thêm giảng viên mới'}
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mã giảng viên</label>
                  <input
                    type="text"
                    value={formData.MaGiangVien}
                    onChange={(e) => setFormData({ ...formData, MaGiangVien: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
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
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                    required
                  />
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Khoa</label>
                  <select
                    value={formData.MaKhoa}
                    onChange={(e) => setFormData({ ...formData, MaKhoa: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
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

              <div className="flex gap-3 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold shadow-lg transition-all"
                >
                  {editingTeacher ? 'Cập nhật' : 'Thêm mới'}
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

export default TeacherManagement;
