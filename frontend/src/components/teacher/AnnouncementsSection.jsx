import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Megaphone, Calendar } from 'lucide-react';
import axios from 'axios';

function AnnouncementsSection({ announcements, user, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    TieuDe: '',
    NoiDung: '',
    MaLop_Nhan: ''
  });

  const myAnnouncements = announcements.filter(a => a.NguoiTao === user?.id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/announcements', {
        ...formData,
        NguoiTao: user.id
      });
      setShowModal(false);
      setFormData({ TieuDe: '', NoiDung: '', MaLop_Nhan: '' });
      // Refresh announcements
      onRefresh();
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert('Lỗi khi tạo thông báo!');
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
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-white text-orange-600 px-6 py-3 rounded-xl shadow-lg transition-all"
        >
          <Bell className="w-5 h-5" />
          Tạo thông báo
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="space-y-4"
      >
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
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tiêu đề</label>
                  <input
                    type="text"
                    value={formData.TieuDe}
                    onChange={(e) => setFormData({ ...formData, TieuDe: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nội dung</label>
                  <textarea
                    value={formData.NoiDung}
                    onChange={(e) => setFormData({ ...formData, NoiDung: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-all h-32"
                    required
                  />
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
