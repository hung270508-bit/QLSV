import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Plus, Edit, Trash2, Search, X, Filter, XCircle } from 'lucide-react';
import axios from 'axios';

function AnnouncementManagement() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [displaySearchTerm, setDisplaySearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    typeFilter: ''
  });
  const [formData, setFormData] = useState({
    TieuDe: '',
    NoiDung: '',
    LoaiThongBao: 'Chung',
    NgayDang: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/announcements');
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAnnouncement) {
        await axios.put(`http://localhost:5000/api/announcements/${editingAnnouncement.MaThongBao}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/announcements', formData);
      }
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving announcement:', error);
      alert('Lỗi khi lưu thông báo!');
    }
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      TieuDe: announcement.TieuDe,
      NoiDung: announcement.NoiDung,
      LoaiThongBao: announcement.LoaiThongBao || 'Chung',
      NgayDang: announcement.NgayDang ? announcement.NgayDang.split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleDelete = async (maThongBao) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thông báo này?')) {
      try {
        await axios.delete(`http://localhost:5000/api/announcements/${maThongBao}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting announcement:', error);
        alert('Lỗi khi xóa thông báo!');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAnnouncement(null);
    setFormData({
      TieuDe: '',
      NoiDung: '',
      LoaiThongBao: 'Chung',
      NgayDang: ''
    });
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = 
      announcement.TieuDe?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.NoiDung?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !filters.typeFilter || announcement.LoaiThongBao === filters.typeFilter;
    
    return matchesSearch && matchesType;
  });

  const handleSearch = () => {
    setSearchTerm(displaySearchTerm);
  };

  const clearFilters = () => {
    setFilters({ typeFilter: '' });
    setSearchTerm('');
  };

  const hasActiveFilters = filters.typeFilter || searchTerm;

  const getTypeColor = (type) => {
    switch(type) {
      case 'Quan trọng': return 'bg-red-100 text-red-600';
      case 'Sinh viên': return 'bg-blue-100 text-blue-600';
      case 'Giảng viên': return 'bg-green-100 text-green-600';
      default: return 'bg-orange-100 text-orange-600';
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Quản lý thông báo</h2>
          <p className="text-gray-500">Thêm, sửa, xóa thông báo</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          Thêm thông báo
        </motion.button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm thông báo..."
              value={displaySearchTerm}
              onChange={(e) => setDisplaySearchTerm(e.target.value)}
              className="w-full pl-12 pr-24 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowFilters(!showFilters)}
              className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Filter className="w-5 h-5" />
            </motion.button>
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
            className="bg-gray-50 rounded-xl p-4 space-y-4"
          >
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Lọc theo loại</label>
              <select
                value={filters.typeFilter}
                onChange={(e) => setFilters({ ...filters, typeFilter: e.target.value })}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
              >
                <option value="">Tất cả loại</option>
                <option value="Chung">Chung</option>
                <option value="Quan trọng">Quan trọng</option>
                <option value="Sinh viên">Sinh viên</option>
                <option value="Giảng viên">Giảng viên</option>
              </select>
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
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Tiêu đề</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Loại</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Ngày đăng</th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredAnnouncements.length > 0 ? (
                filteredAnnouncements.map((announcement, index) => (
                  <motion.tr
                    key={announcement.MaThongBao}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-6 text-sm font-medium text-gray-800">{announcement.TieuDe}</td>
                    <td className="py-4 px-6 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(announcement.LoaiThongBao)}`}>
                        {announcement.LoaiThongBao || 'Chung'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {announcement.NgayDang ? new Date(announcement.NgayDang).toLocaleDateString('vi-VN') : 'N/A'}
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEdit(announcement)}
                          className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(announcement.MaThongBao)}
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
                    Không tìm thấy thông báo nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {editingAnnouncement ? 'Cập nhật thông báo' : 'Thêm thông báo mới'}
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tiêu đề</label>
                <input
                  type="text"
                  value={formData.TieuDe}
                  onChange={(e) => setFormData({ ...formData, TieuDe: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nội dung</label>
                <textarea
                  value={formData.NoiDung}
                  onChange={(e) => setFormData({ ...formData, NoiDung: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors h-32 resize-none"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Loại thông báo</label>
                  <select
                    value={formData.LoaiThongBao}
                    onChange={(e) => setFormData({ ...formData, LoaiThongBao: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  >
                    <option value="Chung">Chung</option>
                    <option value="Quan trọng">Quan trọng</option>
                    <option value="Sinh viên">Sinh viên</option>
                    <option value="Giảng viên">Giảng viên</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ngày đăng</label>
                  <input
                    type="date"
                    value={formData.NgayDang}
                    onChange={(e) => setFormData({ ...formData, NgayDang: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all"
                >
                  {editingAnnouncement ? 'Cập nhật' : 'Thêm mới'}
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

export default AnnouncementManagement;
