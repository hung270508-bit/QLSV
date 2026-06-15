import React from 'react';
import { motion } from 'framer-motion';

const ChangePasswordModal = ({ 
  show, 
  onClose, 
  onSubmit, 
  currentPassword, 
  setCurrentPassword, 
  newPassword, 
  setNewPassword, 
  confirmPassword, 
  setConfirmPassword, 
  loading, 
  message 
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl"
      >
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Đổi Mật Khẩu</h3>
        {message.text && (
          <div className={`p-4 rounded-xl text-sm mb-4 text-center font-medium ${
            message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-200' : 
            message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' :
            'bg-blue-50 text-blue-600 border border-blue-200'
          }`}>
            {message.text}
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu hiện tại</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu mới</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                onClose();
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
              }}
              className="flex-1 py-3 text-gray-600 font-semibold rounded-xl border-2 border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ChangePasswordModal;
