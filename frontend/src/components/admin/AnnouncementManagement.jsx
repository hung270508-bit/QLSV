import React, { useState, useEffect } from 'react';
import API_URL from '../../api';
import { motion } from 'framer-motion';
import { Bell, Plus, Edit, Trash2, Search, X, XCircle, Calendar, User, Eye, Users } from 'lucide-react';
import axios from 'axios';
import { TableSkeleton } from '../common/AdminSkeleton';
import ModalPortal from '../common/ModalPortal';
import Pagination from '../common/Pagination';
import ConfirmDeleteModal from '../common/ConfirmDeleteModal';

function AnnouncementManagement() {
  const [announcements, setAnnouncements] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [displaySearchTerm, setDisplaySearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({});
  const [displayFilters, setDisplayFilters] = useState({});
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [recipientMode, setRecipientMode] = useState('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    TieuDe: '',
    NoiDung: '',
    NguoiTao: '',
    MaLop_Nhan: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [deleteDialog, setDeleteDialog] = useState({ show: false, itemId: null });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [announcementsRes, classesRes] = await Promise.all([
        axios.get(`${API_URL}/api/announcements`),
        axios.get(`${API_URL}/api/classes`)
      ]);
      setAnnouncements(announcementsRes.data);
      setClasses(classesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Lỗi khi tải dữ liệu: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const validateAnnouncementForm = () => {
    const errors = {};
    if (!formData.TieuDe.trim()) {
      errors.TieuDe = 'Tiêu đề không được để trống';
    } else if (formData.TieuDe.trim().length < 5) {
      errors.TieuDe = 'Tiêu đề phải có ít nhất 5 ký tự';
    } else if (formData.TieuDe.trim().length > 200) {
      errors.TieuDe = 'Tiêu đề tối đa 200 ký tự';
    }
    if (!formData.NoiDung.trim()) {
      errors.NoiDung = 'Nội dung không được để trống';
    } else if (formData.NoiDung.trim().length < 10) {
      errors.NoiDung = 'Nội dung phải có ít nhất 10 ký tự';
    } else if (formData.NoiDung.trim().length > 2000) {
      errors.NoiDung = 'Nội dung tối đa 2000 ký tự';
    }
    if (recipientMode === 'custom' && selectedClasses.length === 0) {
      errors.recipient = 'Vui lòng chọn ít nhất một lớp nhận thông báo';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAnnouncementForm()) return;

    const baseData = {
      TieuDe: formData.TieuDe.trim(),
      NoiDung: formData.NoiDung.trim(),
      NguoiTao: formData.NguoiTao || 'admin',
    };

    try {
      if (editingAnnouncement) {
        await axios.put(`${API_URL}/api/announcements/${editingAnnouncement.MaThongBao}`, {
          ...baseData,
          MaLop_Nhan: recipientMode === 'all' ? null : selectedClasses[0],
        });
      } else if (recipientMode === 'all') {
        await axios.post(`${API_URL}/api/announcements`, {
          ...baseData,
          MaLop_Nhan: null,
        });
      } else {
        await Promise.all(
          selectedClasses.map((maLop) =>
            axios.post(`${API_URL}/api/announcements`, {
              ...baseData,
              MaLop_Nhan: maLop,
            })
          )
        );
      }
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving announcement:', error);
      setFormErrors({ general: 'Lỗi khi lưu thông báo: ' + (error.response?.data?.message || error.message) });
    }
  };

  const openAddModal = () => {
    setEditingAnnouncement(null);
    setRecipientMode('all');
    setSelectedClasses([]);
    setFormErrors({});
    setFormData({
      TieuDe: '',
      NoiDung: '',
      NguoiTao: '',
      MaLop_Nhan: '',
    });
    setShowModal(true);
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    if (announcement.MaLop_Nhan) {
      setRecipientMode('custom');
      setSelectedClasses([announcement.MaLop_Nhan]);
    } else {
      setRecipientMode('all');
      setSelectedClasses([]);
    }
    setFormData({
      TieuDe: announcement.TieuDe,
      NoiDung: announcement.NoiDung,
      NguoiTao: announcement.NguoiTao || '',
      MaLop_Nhan: announcement.MaLop_Nhan || ''
    });
    setShowModal(true);
  };

  const handleDelete = (maThongBao) => {
    setDeleteDialog({ show: true, itemId: maThongBao });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.itemId) return;
    try {
      await axios.delete(`${API_URL}/api/announcements/${deleteDialog.itemId}`);
      alert('Xóa thông báo thành công!');
      fetchData();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Lỗi khi xóa thông báo: ' + (error.response?.data?.message || error.message));
    } finally {
      setDeleteDialog({ show: false, itemId: null });
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAnnouncement(null);
    setRecipientMode('all');
    setSelectedClasses([]);
    setFormErrors({});
    setFormData({
      TieuDe: '',
      NoiDung: '',
      NguoiTao: '',
      MaLop_Nhan: ''
    });
  };

  const handleClassToggle = (classId) => {
    setSelectedClasses(prev =>
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
    if (formErrors.recipient) setFormErrors(prev => ({ ...prev, recipient: '' }));
  };

  const handleViewDetail = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedAnnouncement(null);
  };


  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = 
      announcement.TieuDe?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.NoiDung?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAnnouncements = filteredAnnouncements.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAnnouncements.length / itemsPerPage);

  const handleSearch = () => {
    setSearchTerm(displaySearchTerm);
  };

  const handleApplyFilters = () => {
    setFilters({ ...displayFilters });
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({});
    setDisplayFilters({});
    setSearchTerm('');
    setDisplaySearchTerm('');
  };

  const activeFilterCount = (searchTerm ? 1 : 0);
  const hasActiveFilters = searchTerm;


  if (loading) {
    return <TableSkeleton columns={4} rows={5} />;
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Bell className="w-8 h-8" />
              Quản lý thông báo
            </h2>
            <p className="text-orange-100 text-lg">Thêm, sửa, xóa và xem chi tiết thông báo</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}
            whileTap={{ scale: 0.95 }}
            onClick={openAddModal}
            className="flex items-center gap-2 bg-white text-orange-600 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Thêm thông báo
          </motion.button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm thông báo theo tiêu đề hoặc nội dung..."
              value={displaySearchTerm}
              onChange={(e) => setDisplaySearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSearch}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-orange-200 transition-all"
          >
            <Search className="w-5 h-5" />
            Tìm kiếm
          </motion.button>
          {hasActiveFilters && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearFilters}
              className="px-6 py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors flex items-center gap-2 border-2 border-red-200"
            >
              <XCircle className="w-5 h-5" />
              Xóa bộ lọc
            </motion.button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-orange-50 to-orange-100">
              <tr>
                <th className="text-left py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Tiêu đề</th>
                <th className="text-left py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Gửi đến</th>
                <th className="text-left py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Ngày đăng</th>
                <th className="text-center py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {currentAnnouncements.length > 0 ? (
                currentAnnouncements.map((announcement, index) => (
                  <motion.tr
                    key={announcement.MaThongBao}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleViewDetail(announcement)}
                    className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 transition-all cursor-pointer"
                  >
                    <td className="py-5 px-6">
                      <div className="font-semibold text-gray-800 text-base">{announcement.TieuDe}</div>
                      <div className="text-sm text-gray-500 mt-1 line-clamp-1">{announcement.NoiDung}</div>
                    </td>
                    <td className="py-5 px-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                        {announcement.TenLop || 'Tất cả'}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-orange-500" />
                        {announcement.NgayTao ? new Date(announcement.NgayTao).toLocaleDateString('vi-VN') : 'N/A'}
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEdit(announcement)}
                          className="p-3 bg-orange-100 text-orange-600 rounded-xl hover:bg-orange-200 transition-all shadow-sm"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(announcement.MaThongBao)}
                          className="p-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all shadow-sm"
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
                  <td colSpan="4" className="py-16">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Bell className="w-16 h-16 mb-4 text-gray-300" />
                      <p className="text-lg font-medium">Không tìm thấy thông báo nào</p>
                      <p className="text-sm mt-2">Thử tìm kiếm với từ khóa khác</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="mt-4 pb-4">
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Modal */}
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
                  <Bell className="w-5 h-5" />
                  {editingAnnouncement ? 'Cập nhật thông báo' : 'Thêm thông báo mới'}
                </h3>
                <p className="text-orange-100 text-sm mt-0.5">
                  {editingAnnouncement ? 'Chỉnh sửa nội dung và đối tượng nhận' : 'Tạo thông báo gửi đến sinh viên'}
                </p>
              </div>
              <button onClick={handleCloseModal} className="p-2 hover:bg-white/20 rounded-lg text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              {formErrors.general && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
                  {formErrors.general}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tiêu đề</label>
                <input
                  type="text"
                  value={formData.TieuDe}
                  onChange={(e) => {
                    setFormData({ ...formData, TieuDe: e.target.value });
                    if (formErrors.TieuDe) setFormErrors(prev => ({ ...prev, TieuDe: '' }));
                  }}
                  className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors ${formErrors.TieuDe ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'}`}
                  placeholder="Nhập tiêu đề thông báo..."
                />
                <div className="flex items-center justify-between mt-1">
                  {formErrors.TieuDe
                    ? <p className="text-red-500 text-xs">{formErrors.TieuDe}</p>
                    : <span />}
                  <p className="text-xs text-gray-400">{formData.TieuDe.length}/200</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nội dung</label>
                <textarea
                  value={formData.NoiDung}
                  onChange={(e) => {
                    setFormData({ ...formData, NoiDung: e.target.value });
                    if (formErrors.NoiDung) setFormErrors(prev => ({ ...prev, NoiDung: '' }));
                  }}
                  className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors h-40 resize-none ${formErrors.NoiDung ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'}`}
                  placeholder="Nhập nội dung thông báo..."
                />
                <div className="flex items-center justify-between mt-1">
                  {formErrors.NoiDung
                    ? <p className="text-red-500 text-xs">{formErrors.NoiDung}</p>
                    : <span />}
                  <p className="text-xs text-gray-400">{formData.NoiDung.length}/2000</p>
                </div>
              </div>
              <div className="bg-orange-50 p-4 rounded-xl border-2 border-orange-100">
                <label className="flex items-center gap-2 text-sm font-semibold text-orange-800 mb-2">
                  <Users className="w-4 h-4" />
                  Đối tượng nhận
                </label>
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setRecipientMode('all');
                      setSelectedClasses([]);
                    }}
                    className={`flex-1 px-5 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${
                      recipientMode === 'all'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Gửi cho tất cả
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setRecipientMode('custom')}
                    className={`flex-1 px-5 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${
                      recipientMode === 'custom'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Tự chọn lớp
                  </motion.button>
                </div>
                {recipientMode === 'custom' && (
                  <div className="flex flex-wrap gap-3 p-4 bg-white rounded-xl border-2 border-orange-100">
                    {classes.length > 0 ? (
                      classes.map((cls) => (
                        <motion.button
                          key={cls.MaLop}
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleClassToggle(cls.MaLop)}
                          className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all ${
                            selectedClasses.includes(cls.MaLop)
                              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-200'
                              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                          }`}
                        >
                          {cls.TenLop}
                        </motion.button>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">Chưa có lớp học trong hệ thống</p>
                    )}
                  </div>
                )}
                {recipientMode === 'all' && (
                  <p className="text-sm text-gray-500 mt-1">
                    Thông báo sẽ hiển thị cho tất cả sinh viên trên hệ thống.
                  </p>
                )}
                {formErrors.recipient && (
                  <p className="text-red-500 text-xs mt-2 font-medium">{formErrors.recipient}</p>
                )}
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
                  {editingAnnouncement ? 'Lưu thay đổi' : 'Thêm thông báo'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
        </ModalPortal>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedAnnouncement && (
        <ModalPortal>
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/30">
            <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <Eye className="w-7 h-7 text-orange-500" />
                Chi tiết thông báo
              </h3>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleCloseDetailModal}
                className="p-3 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X className="w-6 h-6 text-gray-500" />
              </motion.button>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl p-6">
                <h4 className="text-3xl font-bold text-gray-800 mb-2">{selectedAnnouncement.TieuDe}</h4>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <User className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Người tạo</p>
                    <p className="font-semibold text-gray-800">{selectedAnnouncement.NguoiTaoTen || selectedAnnouncement.NguoiTao}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Ngày đăng</p>
                    <p className="font-semibold text-gray-800">{selectedAnnouncement.NgayTao ? new Date(selectedAnnouncement.NgayTao).toLocaleString('vi-VN') : 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
                <div className="p-3 bg-blue-200 rounded-xl">
                  <Users className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Gửi đến</p>
                  <p className="font-semibold text-gray-800">
                    {selectedAnnouncement.TenLop || 'Tất cả'}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h5 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                  Nội dung thông báo
                </h5>
                <div className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-6 rounded-2xl text-base leading-relaxed">
                  {selectedAnnouncement.NoiDung}
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  handleCloseDetailModal();
                  handleEdit(selectedAnnouncement);
                }}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all flex items-center justify-center gap-2"
              >
                <Edit className="w-5 h-5" />
                Chỉnh sửa thông báo
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCloseDetailModal}
                className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-2xl font-semibold hover:bg-gray-200 transition-all"
              >
                Đóng
              </motion.button>
            </div>
          </motion.div>
        </div>
        </ModalPortal>
      )}

      <ConfirmDeleteModal
        isOpen={deleteDialog.show}
        onClose={() => setDeleteDialog({ show: false, itemId: null })}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export default AnnouncementManagement;
