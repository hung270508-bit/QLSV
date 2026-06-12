import React, { useState } from 'react';
import API_URL from '../../api';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Megaphone, Calendar, Shield } from 'lucide-react';
import axios from 'axios';

function AnnouncementsSection({ announcements, user, onRefresh, classes }) {
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    TieuDe: '',
    NoiDung: '',
    MaLop_Nhan: ''
  });

  const myAnnouncements = announcements.filter(a => a.NguoiTao === user?.id);
  
  // Filter admin announcements - those created by admin and relevant to teacher's classes
  const teacherClassIds = classes ? [...new Set(classes.map(cls => cls.MaLop))] : [];
  const adminAnnouncements = announcements.filter(a => 
    a.NguoiTao === 'admin' && 
    (a.MaLop_Nhan === null || teacherClassIds.includes(a.MaLop_Nhan))
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post(`${API_URL}/api/announcements`, {
        ...formData,
        NguoiTao: user.id
      });
      setShowModal(false);
      setFormData({ TieuDe: '', NoiDung: '', MaLop_Nhan: '' });
      // Refresh announcements
      onRefresh();
    } catch (error) {
      console.error('Error creating announcement:', error);
      setError(error.response?.data?.message || 'Lỗi khi tạo thông báo. Vui lòng thử lại!');
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 shadow-xl flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Thông báo</h2>
          <p className="text-orange-100">Quản lý thông báo cho sinh viên</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setShowModal(true);
            setError('');
          }}
          className="flex items-center gap-2 bg-white text-orange-600 px-6 py-3 rounded-xl shadow-lg transition-all"
        >
          <Bell className="w-5 h-5" />
          Tạo thông báo
        </motion.button>
      </motion.div>

      {/* Admin Announcements Section */}
      {adminAnnouncements.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-800">Thông báo từ Admin</h3>
          </div>
          {adminAnnouncements.map((announcement, index) => (
            <motion.div
              key={announcement.MaThongBao}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              whileHover={{ y: -2 }}
              className="bg-gradient-to-r from-blue-50 to-blue-100/50 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-blue-200/50"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 flex-shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-gray-800">{announcement.TieuDe}</h3>
                    <span className="px-2 py-1 bg-blue-200 text-blue-700 text-xs font-bold rounded-full">Admin</span>
                  </div>
                  <p className="text-gray-600 mb-4">{announcement.NoiDung}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(announcement.NgayTao).toLocaleString('vi-VN')}
                    </div>
                    {announcement.TenLop && (
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                          Lớp {announcement.TenLop}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* My Announcements Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Megaphone className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-bold text-gray-800">Thông báo của bạn</h3>
        </div>
        {myAnnouncements.length > 0 ? (
          myAnnouncements.map((announcement, index) => (
            <motion.div
              key={announcement.MaThongBao}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              whileHover={{ y: -2 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-gray-100/50"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200 flex-shrink-0">
                  <Megaphone className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{announcement.TieuDe}</h3>
                  <p className="text-gray-600 mb-4">{announcement.NoiDung}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    {new Date(announcement.NgayTao).toLocaleString('vi-VN')}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-gray-100/50"
          >
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Bell className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-lg font-medium text-gray-600">Chưa có thông báo nào</p>
            </div>
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/40"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Tạo thông báo mới</h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowModal(false)}
                  className="p-2.5 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </motion.button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3"
                  >
                    <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                  </motion.div>
                )}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tiêu đề</label>
                  <input
                    type="text"
                    value={formData.TieuDe}
                    onChange={(e) => {
                      setFormData({ ...formData, TieuDe: e.target.value });
                      setError('');
                    }}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nội dung</label>
                  <textarea
                    value={formData.NoiDung}
                    onChange={(e) => {
                      setFormData({ ...formData, NoiDung: e.target.value });
                      setError('');
                    }}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-all h-32"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Gửi đến lớp</label>
                  <select
                    value={formData.MaLop_Nhan}
                    onChange={(e) => {
                      setFormData({ ...formData, MaLop_Nhan: e.target.value });
                      setError('');
                    }}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-all"
                    required
                  >
                    <option value="">-- Chọn lớp --</option>
                    {classes && classes.length > 0 ? (
                      [...new Set(classes.map(cls => cls.MaLop))].map((maLop) => (
                        <option key={maLop} value={maLop}>
                          Lớp {maLop}
                        </option>
                      ))
                    ) : (
                      <option disabled>Không có lớp nào</option>
                    )}
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-bold shadow-lg transition-all"
                  >
                    Đăng thông báo
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                  >
                    Hủy
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AnnouncementsSection;
