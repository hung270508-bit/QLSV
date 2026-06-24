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
  const [showForgotPassword, setShowForgotPassword] = useState(false);

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


  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring" }}
        className="flex flex-col items-center justify-center h-[70vh] text-[#F4C542]"
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
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="bg-[#F4C542] rounded-2xl p-6 sm:p-8 text-[#152238] shadow-lg"
        >
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 bg-[#FFFFFF] rounded-full p-2 shadow-lg flex-shrink-0">
              <div className="w-full h-full bg-gradient-to-br from-[#FFF7D6] to-[#FFF7D6] rounded-full flex items-center justify-center">
                <UserCircle className="w-16 h-16 text-[#F4C542]" />
              </div>
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold mb-1">{fallbackProfile.HoTen}</h2>
              <p className="text-[#152238]/70 text-base font-medium flex items-center justify-center sm:justify-start gap-2">
                <Briefcase className="w-4 h-4" /> Mã GV: {fallbackProfile.MaGiangVien}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                <span className="px-3 py-1 bg-white/40 rounded-full text-sm font-medium">
                  {fallbackProfile.TenKhoa}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1, type: "spring" }}
            className="bg-[#FFFFFF] rounded-xl p-5 shadow-sm border border-[#E5E7EB]"
          >
            <h3 className="text-lg font-bold text-[#1F2937] mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-[#3B82F6]/100 rounded-lg flex items-center justify-center">
                <Mail className="w-4 h-4 text-white" />
              </div>
              Thông tin liên hệ
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center flex-shrink-0 text-[#3B82F6]">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#6B7280]">Email công vụ</p>
                  <p className="text-[#1F2937] font-semibold">{fallbackProfile.Email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#22C55E]/10 flex items-center justify-center flex-shrink-0 text-[#22C55E]">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#6B7280]">Số điện thoại</p>
                  <p className="text-[#1F2937] font-semibold">{fallbackProfile.SoDienThoai}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0 text-pink-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#6B7280]">Ngày sinh</p>
                  <p className="text-[#1F2937] font-semibold">
                    {fallbackProfile.NgaySinh ? new Date(fallbackProfile.NgaySinh).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#6B7280]">Giới tính</p>
                  <p className="text-[#1F2937] font-semibold">{fallbackProfile.GioiTinh}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2, type: "spring" }}
            className="bg-[#FFFFFF] rounded-xl p-5 shadow-sm border border-[#E5E7EB]"
          >
            <h3 className="text-lg font-bold text-[#1F2937] mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-[#F4C542] rounded-lg flex items-center justify-center">
                <Building className="w-4 h-4 text-white" />
              </div>
              Thông tin công tác
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#FFF7D6] flex items-center justify-center flex-shrink-0 text-[#F4C542]">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#6B7280]">Khoa</p>
                  <p className="text-[#1F2937] font-semibold">{fallbackProfile.TenKhoa}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0 text-purple-600">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#6B7280]">Chức vụ</p>
                  <p className="text-[#1F2937] font-semibold">Giảng viên</p>
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
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="bg-[#F4C542] rounded-2xl p-6 sm:p-8 text-[#152238] shadow-lg"
      >
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-24 h-24 bg-[#FFFFFF] rounded-full p-2 shadow-lg flex-shrink-0">
            <div className="w-full h-full bg-gradient-to-br from-[#FFF7D6] to-[#FFF7D6] rounded-full flex items-center justify-center">
              <UserCircle className="w-16 h-16 text-[#F4C542]" />
            </div>
          </div>
          
          <div className="text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold mb-1">{profile.HoTen}</h2>
            <p className="text-[#152238]/70 text-base font-medium flex items-center justify-center sm:justify-start gap-2">
              <Briefcase className="w-4 h-4" /> Mã GV: {profile.MaGiangVien}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
              <span className="px-3 py-1 bg-white/40 rounded-full text-sm font-medium">
                {profile.TenKhoa || 'Chưa cập nhật khoa'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cột 1: Thông tin liên hệ */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1, type: "spring" }}
          className="bg-[#FFFFFF] rounded-xl p-5 shadow-sm border border-[#E5E7EB]"
        >
          <h3 className="text-lg font-bold text-[#1F2937] mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-[#3B82F6]/100 rounded-lg flex items-center justify-center">
              <Mail className="w-4 h-4 text-white" />
            </div>
            Thông tin liên hệ
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center flex-shrink-0 text-[#3B82F6]">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-[#6B7280]">Email công vụ</p>
                <p className="text-[#1F2937] font-semibold">{profile.Email || 'Chưa cập nhật'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#22C55E]/10 flex items-center justify-center flex-shrink-0 text-[#22C55E]">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-[#6B7280]">Số điện thoại</p>
                <p className="text-[#1F2937] font-semibold">{profile.SoDienThoai || 'Chưa cập nhật'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0 text-pink-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-[#6B7280]">Ngày sinh</p>
                <p className="text-[#1F2937] font-semibold">
                  {profile.NgaySinh ? new Date(profile.NgaySinh).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-[#6B7280]">Giới tính</p>
                <p className="text-[#1F2937] font-semibold">{profile.GioiTinh || 'Chưa cập nhật'}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Cột 2: Thông tin công tác */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2, type: "spring" }}
          className="bg-[#FFFFFF] rounded-xl p-5 shadow-sm border border-[#E5E7EB]"
        >
          <h3 className="text-lg font-bold text-[#1F2937] mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-[#F4C542] rounded-lg flex items-center justify-center">
              <Building className="w-4 h-4 text-white" />
            </div>
            Thông tin công tác
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#FFF7D6] flex items-center justify-center flex-shrink-0 text-[#F4C542]">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-[#6B7280]">Khoa</p>
                <p className="text-[#1F2937] font-semibold">{profile.TenKhoa || 'Chưa cập nhật'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0 text-purple-600">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-[#6B7280]">Chức vụ</p>
                <p className="text-[#1F2937] font-semibold">Giảng viên</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Password Change Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: "spring" }}
        className="bg-[#FFFFFF] rounded-xl p-5 shadow-sm border border-[#E5E7EB]"
      >
        <h3 className="text-lg font-bold text-[#1F2937] mb-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-[#F4C542] rounded-lg flex items-center justify-center">
            <Lock className="w-4 h-4 text-white" />
          </div>
          Mật Khẩu & Bảo Mật
        </h3>
        <div className="text-center py-6">
          <button
            onClick={() => setShowForgotPassword(true)}
            className="bg-[#F4C542] hover:bg-[#F4C542]/90 text-[#152238] font-semibold py-2.5 px-6 rounded-lg transition-colors flex items-center gap-2 mx-auto text-sm"
          >
            <Lock className="w-4 h-4" /> Chỉnh sửa mật khẩu
          </button>
          <p className="text-[#6B7280] text-sm mt-2">Nhấn vào để chỉnh sửa mật khẩu của bạn</p>
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
                className="bg-[#FFFFFF] w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
              >
                <div className="bg-[#F4C542] p-4 text-[#152238] flex justify-between items-center">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Lock className="w-5 h-5" /> Đổi mật khẩu
                  </h3>
                  <button
                    onClick={() => {
                      setShowForgotPassword(false);
                      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      setPasswordErrors({});
                      setPasswordSuccess(false);
                    }}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6">
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                      {passwordSuccess && (
                        <div className="bg-[#22C55E]/10 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm font-medium">
                          Đổi mật khẩu thành công!
                        </div>
                      )}
                      {passwordErrors.general && (
                        <div className="bg-[#EF4444]/10 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
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
                            className={`w-full p-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 text-sm ${passwordErrors.currentPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#E5E7EB] focus:border-[#F4C542] focus:ring-[#F4C542]/20'}`}
                            placeholder="Nhập mật khẩu hiện tại"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#6B7280]"
                          >
                            {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        {passwordErrors.currentPassword && <p className="text-[#EF4444] text-xs mt-1">{passwordErrors.currentPassword}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu mới</label>
                        <div className="relative">
                          <input
                            type={showPasswords.new ? 'text' : 'password'}
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            className={`w-full p-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 text-sm ${passwordErrors.newPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#E5E7EB] focus:border-[#F4C542] focus:ring-[#F4C542]/20'}`}
                            placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#6B7280]"
                          >
                            {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        {passwordErrors.newPassword && <p className="text-[#EF4444] text-xs mt-1">{passwordErrors.newPassword}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Xác nhận mật khẩu mới</label>
                        <div className="relative">
                          <input
                            type={showPasswords.confirm ? 'text' : 'password'}
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            className={`w-full p-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 text-sm ${passwordErrors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#E5E7EB] focus:border-[#F4C542] focus:ring-[#F4C542]/20'}`}
                            placeholder="Nhập lại mật khẩu mới"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#6B7280]"
                          >
                            {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        {passwordErrors.confirmPassword && <p className="text-[#EF4444] text-xs mt-1">{passwordErrors.confirmPassword}</p>}
                      </div>
                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={passwordSubmitting}
                          className="w-full bg-[#F4C542] hover:from-orange-600 hover:to-orange-700 text-[#152238] font-semibold py-2.5 rounded-lg transition-all shadow-md shadow-[#F4C542]/30 disabled:from-orange-300 disabled:to-orange-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                        >
                          {passwordSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</> : <><Key className="w-4 h-4" /> Đổi mật khẩu</>}
                        </button>
                      </div>
                    </form>
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
