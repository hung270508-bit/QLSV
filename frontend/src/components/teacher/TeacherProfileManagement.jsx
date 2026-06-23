import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserCircle, Mail, Phone, Building, 
  Briefcase, Loader2, BookOpen, GraduationCap, Calendar, User, Lock, Key, Eye, EyeOff, CheckCircle2, X
} from 'lucide-react';
import axios from 'axios';
import API_URL from '../../api';
import ModalPortal from '../common/ModalPortal';

function TeacherProfileManagement({ profile, loading, user, onLogout }) {
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const [forgotPasswordSubmitting, setForgotPasswordSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [modalMode, setModalMode] = useState('change');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const newErrors = {};
    let hasError = false;

    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
      hasError = true;
    }
    if (!passwordForm.newPassword) {
      newErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
      hasError = true;
    } else if (passwordForm.newPassword.length < 6) {
      newErrors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự';
      hasError = true;
    }
    if (!passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
      hasError = true;
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
      hasError = true;
    }

    setPasswordErrors(newErrors);

    if (hasError) return;

    setPasswordSubmitting(true);
    try {
      const usernameToSend = user?.id || user?.username;
      await axios.post(`${API_URL}/api/student/change-password`, {
        username: usernameToSend,
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordSuccess(true);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setPasswordSuccess(false);
        setShowForgotPassword(false);
      }, 2000);
    } catch (error) {
      setPasswordErrors({ general: error.response?.data?.message || 'Đổi mật khẩu thất bại' });
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!forgotPasswordEmail) {
      setForgotPasswordError('Vui lòng nhập email!');
      return;
    }
    if (!emailRegex.test(forgotPasswordEmail)) {
      setForgotPasswordError('Email không đúng định dạng!');
      return;
    }

    setForgotPasswordError('');
    setForgotPasswordSubmitting(true);

    try {
      await axios.post(`${API_URL}/api/forgot-password`, { email: forgotPasswordEmail });
      setForgotPasswordSuccess(true);
      setForgotPasswordEmail('');
      setTimeout(() => {
        setForgotPasswordSuccess(false);
        setShowForgotPassword(false);
      }, 5000);
    } catch (error) {
      setForgotPasswordError(error.response?.data?.message || 'Gửi yêu cầu thất bại. Vui lòng thử lại.');
    } finally {
      setForgotPasswordSubmitting(false);
    }
  };

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring" }}
        className="flex flex-col items-center justify-center h-[70vh] text-orange-500"
      >
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-medium text-lg">Đang tải hồ sơ giảng viên...</p>
      </motion.div>
    );
  }

  if (!profile) {
    // Fallback to show profile using user data if profile is not available
    const fallbackProfile = {
      HoTen: user?.hoTen || 'Chưa cập nhật',
      MaGiangVien: user?.id || user?.username || 'Chưa cập nhật',
      Email: user?.email || 'Chưa cập nhật',
      SoDienThoai: user?.soDienThoai || 'Chưa cập nhật',
      TenKhoa: user?.tenKhoa || 'Chưa cập nhật',
      NgaySinh: user?.ngaySinh || 'Chưa cập nhật',
      GioiTinh: user?.gioiTinh || 'Chưa cập nhật'
    };
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.95 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 rounded-3xl p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-4 right-4 opacity-10">
            <GraduationCap className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8">
            <div className="w-32 h-32 bg-white rounded-full p-2 shadow-2xl flex-shrink-0">
              <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-white/30">
                <UserCircle className="w-24 h-24 text-orange-500 mt-4" />
              </div>
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-3xl sm:text-4xl font-bold mb-2">{fallbackProfile.HoTen}</h2>
              <p className="text-orange-100 text-lg font-medium flex items-center justify-center sm:justify-start gap-2">
                <Briefcase className="w-5 h-5" /> Mã GV: {fallbackProfile.MaGiangVien}
              </p>
              <div className="mt-4 flex flex-wrap gap-3 justify-center sm:justify-start">
                <span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold border border-white/30">
                  {fallbackProfile.TenKhoa}
                </span>
              </div>
            </div>
          </div>
          <BookOpen className="absolute -right-10 -bottom-10 w-64 h-64 text-white opacity-10 transform -rotate-12" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            transition={{ delay: 0.1, type: "spring" }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-gray-100/50"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                <Mail className="w-5 h-5 text-white" />
              </div>
              Thông tin liên hệ
            </h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0 text-blue-600 shadow-md">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500">Email công vụ</p>
                  <p className="text-gray-800 font-semibold text-lg">{fallbackProfile.Email}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center flex-shrink-0 text-green-600 shadow-md">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500">Số điện thoại</p>
                  <p className="text-gray-800 font-semibold text-lg">{fallbackProfile.SoDienThoai}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center flex-shrink-0 text-pink-600 shadow-md">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500">Ngày sinh</p>
                  <p className="text-gray-800 font-semibold text-lg">
                    {fallbackProfile.NgaySinh ? new Date(fallbackProfile.NgaySinh).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center flex-shrink-0 text-indigo-600 shadow-md">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500">Giới tính</p>
                  <p className="text-gray-800 font-semibold text-lg">{fallbackProfile.GioiTinh}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            transition={{ delay: 0.2, type: "spring" }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-gray-100/50"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
                <Building className="w-5 h-5 text-white" />
              </div>
              Thông tin công tác
            </h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center flex-shrink-0 text-orange-600 shadow-md">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500">Khoa</p>
                  <p className="text-gray-800 font-semibold text-lg">{fallbackProfile.TenKhoa}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center flex-shrink-0 text-purple-600 shadow-md">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500">Chức vụ</p>
                  <p className="text-gray-800 font-semibold text-lg">Giảng viên</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }} 
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 rounded-3xl p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-4 right-4 opacity-10">
          <GraduationCap className="w-32 h-32 text-white" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8">
          {/* Avatar Mặc định */}
          <div className="w-32 h-32 bg-white rounded-full p-2 shadow-2xl flex-shrink-0">
            <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-white/30">
              <UserCircle className="w-24 h-24 text-orange-500 mt-4" />
            </div>
          </div>
          
          <div className="text-center sm:text-left">
            <h2 className="text-3xl sm:text-4xl font-bold mb-2">{profile.HoTen}</h2>
            <p className="text-orange-100 text-lg font-medium flex items-center justify-center sm:justify-start gap-2">
              <Briefcase className="w-5 h-5" /> Mã GV: {profile.MaGiangVien}
            </p>
            <div className="mt-4 flex flex-wrap gap-3 justify-center sm:justify-start">
              <span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold border border-white/30">
                {profile.TenKhoa || 'Chưa cập nhật khoa'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Background Decoration */}
        <BookOpen className="absolute -right-10 -bottom-10 w-64 h-64 text-white opacity-10 transform -rotate-12" />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cột 1: Thông tin liên hệ */}
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.95 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }} 
          transition={{ delay: 0.1, type: "spring" }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-gray-100/50"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Mail className="w-5 h-5 text-white" />
            </div>
            Thông tin liên hệ
          </h3>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0 text-blue-600 shadow-md">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500">Email công vụ</p>
                <p className="text-gray-800 font-semibold text-lg">{profile.Email || 'Chưa cập nhật'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center flex-shrink-0 text-green-600 shadow-md">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500">Số điện thoại</p>
                <p className="text-gray-800 font-semibold text-lg">{profile.SoDienThoai || 'Chưa cập nhật'}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center flex-shrink-0 text-pink-600 shadow-md">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500">Ngày sinh</p>
                <p className="text-gray-800 font-semibold text-lg">
                  {profile.NgaySinh ? new Date(profile.NgaySinh).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center flex-shrink-0 text-indigo-600 shadow-md">
                <User className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500">Giới tính</p>
                <p className="text-gray-800 font-semibold text-lg">{profile.GioiTinh || 'Chưa cập nhật'}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Cột 2: Thông tin công tác */}
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.95 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }} 
          transition={{ delay: 0.2, type: "spring" }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-gray-100/50"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
              <Building className="w-5 h-5 text-white" />
            </div>
            Thông tin công tác
          </h3>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center flex-shrink-0 text-orange-600 shadow-md">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500">Khoa</p>
                <p className="text-gray-800 font-semibold text-lg">{profile.TenKhoa || 'Chưa cập nhật'}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center flex-shrink-0 text-purple-600 shadow-md">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500">Chức vụ</p>
                <p className="text-gray-800 font-semibold text-lg">Giảng viên</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Password Change Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        <h3 className="text-xl font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4 flex items-center gap-2">
          <Lock className="w-6 h-6 text-orange-600" /> Đổi mật khẩu
        </h3>
        <div className="text-center py-8">
          <button
            onClick={() => setShowForgotPassword(true)}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-8 rounded-lg transition-all shadow-md shadow-orange-200 flex items-center gap-2 mx-auto text-sm"
          >
            <Lock className="w-4 h-4" /> Đổi mật khẩu
          </button>
          <p className="text-gray-500 text-sm mt-3">Nhấn vào để thay đổi mật khẩu của bạn</p>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotPassword && (
          <ModalPortal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
              >
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-5 text-white flex justify-between items-center">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Lock className="w-5 h-5" /> {modalMode === 'email' ? 'Quên mật khẩu' : 'Đổi mật khẩu'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotPasswordEmail('');
                      setForgotPasswordError('');
                      setForgotPasswordSuccess(false);
                      setModalMode('change');
                      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      setPasswordErrors({});
                    }}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6">
                  {modalMode === 'email' ? (
                    forgotPasswordSuccess ? (
                      <div className="text-center py-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-800 mb-2">Đã gửi email!</h4>
                        <p className="text-gray-600 text-sm">Liên kết đặt lại mật khẩu đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.</p>
                      </div>
                    ) : (
                      <form onSubmit={handleForgotPassword} className="space-y-4">
                        <p className="text-gray-600 text-sm mb-4">
                          Nhập email của bạn để nhận liên kết đặt lại mật khẩu.
                        </p>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                          <input
                            type="email"
                            value={forgotPasswordEmail}
                            onChange={(e) => {
                              setForgotPasswordEmail(e.target.value);
                              if (forgotPasswordError) setForgotPasswordError('');
                            }}
                            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 text-sm ${forgotPasswordError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-orange-500 focus:ring-orange-500/20'}`}
                            placeholder="nhập email của bạn..."
                          />
                          {forgotPasswordError && <p className="text-red-500 text-xs mt-1">{forgotPasswordError}</p>}
                        </div>
                        <div className="pt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => setModalMode('change')}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg transition-all text-sm"
                          >
                            Đổi mật khẩu trực tiếp
                          </button>
                          <button
                            type="submit"
                            disabled={forgotPasswordSubmitting}
                            className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-2.5 rounded-lg transition-all shadow-md shadow-orange-200 disabled:from-orange-300 disabled:to-orange-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                          >
                            {forgotPasswordSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang gửi...</> : 'Gửi liên kết'}
                          </button>
                        </div>
                      </form>
                    )
                  ) : (
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      {passwordSuccess && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm font-medium">
                          Đổi mật khẩu thành công!
                        </div>
                      )}
                      {passwordErrors.general && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
                          {passwordErrors.general}
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu hiện tại</label>
                        <div className="relative">
                          <input
                            type={showPasswords.current ? 'text' : 'password'}
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            className={`w-full p-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 text-sm ${passwordErrors.currentPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-orange-500 focus:ring-orange-500/20'}`}
                            placeholder="Nhập mật khẩu hiện tại"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        {passwordErrors.currentPassword && <p className="text-red-500 text-xs mt-1">{passwordErrors.currentPassword}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu mới</label>
                        <div className="relative">
                          <input
                            type={showPasswords.new ? 'text' : 'password'}
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            className={`w-full p-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 text-sm ${passwordErrors.newPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-orange-500 focus:ring-orange-500/20'}`}
                            placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        {passwordErrors.newPassword && <p className="text-red-500 text-xs mt-1">{passwordErrors.newPassword}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Xác nhận mật khẩu mới</label>
                        <div className="relative">
                          <input
                            type={showPasswords.confirm ? 'text' : 'password'}
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            className={`w-full p-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 text-sm ${passwordErrors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-orange-500 focus:ring-orange-500/20'}`}
                            placeholder="Nhập lại mật khẩu mới"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        {passwordErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{passwordErrors.confirmPassword}</p>}
                      </div>
                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={passwordSubmitting}
                          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-2.5 rounded-lg transition-all shadow-md shadow-orange-200 disabled:from-orange-300 disabled:to-orange-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                        >
                          {passwordSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</> : <><Key className="w-4 h-4" /> Đổi mật khẩu</>}
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalMode('email')}
                          className="w-full mt-2 text-orange-600 hover:text-orange-700 font-medium text-sm transition-colors"
                        >
                          Quên mật khẩu?
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </ModalPortal>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TeacherProfileManagement;
