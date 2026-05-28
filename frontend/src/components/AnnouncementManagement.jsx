import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Plus, Edit, Trash2, Search, X, Filter, XCircle, Paperclip, Users, Eye } from 'lucide-react';
import axios from 'axios';

function AnnouncementManagement() {
  const [announcements, setAnnouncements] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [displaySearchTerm, setDisplaySearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    typeFilter: ''
  });
  const [displayFilters, setDisplayFilters] = useState({
    typeFilter: ''
  });
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [showReadStatus, setShowReadStatus] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [readStatusData, setReadStatusData] = useState([]);
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
      const [announcementsRes, classesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/announcements'),
        axios.get('http://localhost:5000/api/classes')
      ]);
      setAnnouncements(announcementsRes.data);
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
    setSelectedClasses([]);
    setAttachments([]);
    setFormData({
      TieuDe: '',
      NoiDung: '',
      LoaiThongBao: 'Chung',
      NgayDang: ''
    });
  };

  const handleViewReadStatus = async (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowReadStatus(true);
    // Simulate read status data (in real app, this would come from API)
    const mockReadStatus = [
      { name: 'Nguyễn Văn A', status: 'Đã đọc', date: '2025-05-28' },
      { name: 'Trần Thị B', status: 'Đã đọc', date: '2025-05-28' },
      { name: 'Lê Văn C', status: 'Chưa đọc', date: '-' },
    ];
    setReadStatusData(mockReadStatus);
  };

  const handleCloseReadStatus = () => {
    setShowReadStatus(false);
    setSelectedAnnouncement(null);
    setReadStatusData([]);
  };

  const handleClassToggle = (classId) => {
    setSelectedClasses(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const handleAttachmentChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(files);
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

  const handleApplyFilters = () => {
    setFilters({ ...displayFilters });
    setShowFilters(false);
  };


  const clearFilters = () => {
    setFilters({ typeFilter: '' });
    setDisplayFilters({ typeFilter: '' });
    setSearchTerm('');
    setDisplaySearchTerm('');
  };

  const activeFilterCount = (filters.typeFilter ? 1 : 0) + (searchTerm ? 1 : 0);
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
          <div className="relative w-1/2">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm thông báo..."
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Lọc theo loại</label>
              <select
                value={displayFilters.typeFilter}
                onChange={(e) => setDisplayFilters({ ...displayFilters, typeFilter: e.target.value })}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
              >
                <option value="">Tất cả loại</option>
                <option value="Chung">Chung</option>
                <option value="Quan trọng">Quan trọng</option>
                <option value="Sinh viên">Sinh viên</option>
                <option value="Giảng viên">Giảng viên</option>
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
                onClick={() => setDisplayFilters({ typeFilter: '' })}
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
                          onClick={() => handleViewReadStatus(announcement)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </motion.button>
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
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
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

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Gửi đến lớp</label>
                <div className="flex flex-wrap gap-2">
                  {classes.map((cls) => (
                    <motion.button
                      key={cls.MaLop}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleClassToggle(cls.MaLop)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedClasses.includes(cls.MaLop)
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cls.TenLop}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Đính kèm</label>
                <div className="relative">
                  <input
                    type="file"
                    multiple
                    onChange={handleAttachmentChange}
                    className="hidden"
                    id="attachment-input"
                  />
                  <label
                    htmlFor="attachment-input"
                    className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-orange-500 transition-colors"
                  >
                    <Paperclip className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">
                      {attachments.length > 0 
                        ? `${attachments.length} file đã chọn` 
                        : 'Chọn file đính kèm'}
                    </span>
                  </label>
                </div>
                {attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {attachments.map((file, index) => (
                      <div key={index} className="text-sm text-gray-600 flex items-center gap-2">
                        <Paperclip className="w-4 h-4" />
                        {file.name}
                      </div>
                    ))}
                  </div>
                )}
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

      {/* Read Status Modal */}
      {showReadStatus && selectedAnnouncement && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Trạng thái đọc</h3>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleCloseReadStatus}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </motion.button>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold text-gray-700">{selectedAnnouncement.TieuDe}</h4>
              <p className="text-sm text-gray-500 mt-1">
                {readStatusData.filter(r => r.status === 'Đã đọc').length}/{readStatusData.length} đã đọc
              </p>
            </div>

            <div className="space-y-2">
              {readStatusData.length > 0 ? (
                readStatusData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-800">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        item.status === 'Đã đọc' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {item.status}
                      </span>
                      <span className="text-xs text-gray-500">{item.date}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">Không có dữ liệu</p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default AnnouncementManagement;
