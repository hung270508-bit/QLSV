import { StudentProfileSkeleton } from '../common/StudentSkeleton';

import React, { useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

import {

  UserCircle, Mail, Phone, Calendar,

  MapPin, GraduationCap, Building, Loader2, BookOpen, Lock, Key, Eye, EyeOff, CheckCircle2, X

} from 'lucide-react';

import axios from 'axios';

import API_URL from '../../api';

import ModalPortal from '../common/ModalPortal';
import { handleAvatarUpload } from '../../utils/avatarUpload';

function StudentProfile({ profile, loading, user }) {
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const [passwordErrors, setPasswordErrors] = useState({});

  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  const [showForgotPassword, setShowForgotPassword] = useState(false);



  if (loading) {

    return <StudentProfileSkeleton />;

  }



  if (!profile) {

    return (

      <div className="flex flex-col items-center justify-center h-[70vh] text-[#6B7280]">

        <UserCircle className="w-16 h-16 mb-4 text-gray-300" />

        <p className="font-medium text-lg">Không tìm thấy thông tin hồ sơ!</p>

      </div>

    );

  }



  // Format ngày sinh

  const formatDate = (dateString) => {

    if (!dateString) return 'Chưa cập nhật';

    const date = new Date(dateString);

    return date.toLocaleDateString('vi-VN');

  };



  const handlePasswordChange = async (e) => {

    e.preventDefault();

    const errors = {};



    if (!passwordForm.currentPassword) {

      errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';

    }

    if (!passwordForm.newPassword) {

      errors.newPassword = 'Vui lòng nhập mật khẩu mới';

    } else if (passwordForm.newPassword.includes(' ')) {

      errors.newPassword = 'Mật khẩu không được chứa khoảng trắng';

    } else if (passwordForm.newPassword.length < 8) {

      errors.newPassword = 'Mật khẩu mới phải có ít nhất 8 ký tự';

    } else if (passwordForm.newPassword.length > 20) {

      errors.newPassword = 'Mật khẩu mới không được vượt quá 20 ký tự';

    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(passwordForm.newPassword)) {

      errors.newPassword = 'Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt';

    } else if (passwordForm.newPassword === passwordForm.currentPassword) {

      errors.newPassword = 'Mật khẩu mới không được trùng với mật khẩu hiện tại';

    }

    if (!passwordForm.confirmPassword) {

      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';

    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {

      errors.confirmPassword = 'Mật khẩu xác nhận không khớp';

    }



    if (Object.keys(errors).length > 0) {

      setPasswordErrors(errors);

      return;

    }



    setPasswordErrors({});

    setPasswordSubmitting(true);



    try {

      await axios.post(`${API_URL}/api/student/change-password`, {

        username: profile?.MSSV,

        currentPassword: passwordForm.currentPassword,

        newPassword: passwordForm.newPassword

      });

      setPasswordSuccess(true);

      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });

      setTimeout(() => setPasswordSuccess(false), 3000);

    } catch (error) {

      setPasswordErrors({ general: 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại.' });

    } finally {

      setPasswordSubmitting(false);

    }

  };






  return (

    <div className="max-w-5xl mx-auto space-y-6">

      

      {/* Header Banner */}

      <motion.div 

        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}

        className="bg-[#F4C542] rounded-3xl p-8 sm:p-10 text-[#152238] shadow-lg relative overflow-hidden"

      >

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8">

          {/* Avatar Mặc định */}
          <div className="w-32 h-32 bg-[#FFFFFF] rounded-full p-2 shadow-xl flex-shrink-0 relative group">
            <div className="w-full h-full bg-[#FFF7D6] rounded-full flex items-center justify-center overflow-hidden border-4 border-orange-50">
                {user?.Avatar ? (
                   <img src={user.Avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                   <UserCircle className="w-24 h-24 text-orange-400 mt-4" />
                )}
            </div>
            <div className="absolute inset-2 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                 <span className="text-xs text-white font-medium">Đổi ảnh</span>
                 <input type="file" accept="image/*" onChange={(e) => handleAvatarUpload(e, user, API_URL)} className="absolute inset-0 opacity-0 cursor-pointer" title="Đổi ảnh đại diện" />
            </div>
          </div>

          

          <div className="text-center sm:text-left">

            <h2 className="text-3xl sm:text-4xl font-bold mb-2">{profile.HoTen}</h2>

            <p className="text-[#152238]/70 text-lg font-medium flex items-center justify-center sm:justify-start gap-2">

              <BookOpen className="w-5 h-5" /> MSSV: {profile.MSSV}

            </p>

            <div className="mt-4 flex flex-wrap gap-3 justify-center sm:justify-start">

              <span className="px-4 py-1.5 bg-white/40 backdrop-blur-sm rounded-full text-sm font-medium border border-white/30">

                {profile.TenLop || 'Chưa xếp lớp'}

              </span>

              <span className="px-4 py-1.5 bg-white/40 backdrop-blur-sm rounded-full text-sm font-medium border border-white/30">

                {profile.GioiTinh || 'Chưa cập nhật'}

              </span>

            </div>

          </div>

        </div>

        

        {/* Background Decoration */}

        <GraduationCap className="absolute -right-10 -bottom-10 w-64 h-64 text-white opacity-10 transform -rotate-12" />

      </motion.div>



      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Cột 1: Thông tin liên hệ */}

        <motion.div 

          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}

          className="bg-[#FFFFFF] rounded-2xl p-6 shadow-sm border border-[#E5E7EB]"

        >

          <h3 className="text-xl font-bold text-[#1F2937] mb-6 border-b border-[#E5E7EB] pb-4">Thông tin liên hệ</h3>

          <div className="space-y-6">

            <div className="flex items-start gap-4">

              <div className="w-10 h-10 rounded-full bg-[#3B82F6]/10 flex items-center justify-center flex-shrink-0 text-[#3B82F6]">

                <Mail className="w-5 h-5" />

              </div>

              <div>

                <p className="text-sm font-medium text-[#6B7280]">Email</p>

                <p className="text-[#1F2937] font-semibold">{profile.Email || 'Chưa cập nhật'}</p>

              </div>

            </div>

            

            <div className="flex items-start gap-4">

              <div className="w-10 h-10 rounded-full bg-[#22C55E]/10 flex items-center justify-center flex-shrink-0 text-[#22C55E]">

                <Phone className="w-5 h-5" />

              </div>

              <div>

                <p className="text-sm font-medium text-[#6B7280]">Số điện thoại</p>

                <p className="text-[#1F2937] font-semibold">{profile.SoDienThoai || 'Chưa cập nhật'}</p>

              </div>

            </div>

            

            <div className="flex items-start gap-4">

              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0 text-purple-600">

                <Calendar className="w-5 h-5" />

              </div>

              <div>

                <p className="text-sm font-medium text-[#6B7280]">Ngày sinh</p>

                <p className="text-[#1F2937] font-semibold">{formatDate(profile.NgaySinh)}</p>

              </div>

            </div>

          </div>

        </motion.div>



        {/* Cột 2: Thông tin học vụ */}

        <motion.div 

          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}

          className="bg-[#FFFFFF] rounded-2xl p-6 shadow-sm border border-[#E5E7EB]"

        >

          <h3 className="text-xl font-bold text-[#1F2937] mb-6 border-b border-[#E5E7EB] pb-4">Thông tin học vụ</h3>

          <div className="space-y-6">

            <div className="flex items-start gap-4">

              <div className="w-10 h-10 rounded-full bg-[#FFF7D6] flex items-center justify-center flex-shrink-0 text-[#F4C542]">

                <Building className="w-5 h-5" />

              </div>

              <div>

                <p className="text-sm font-medium text-[#6B7280]">Khoa trực thuộc</p>

                <p className="text-[#1F2937] font-semibold">{profile.TenKhoa || 'Chưa cập nhật khoa'}</p>

              </div>

            </div>

            

            <div className="flex items-start gap-4">

              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0 text-rose-600">

                <GraduationCap className="w-5 h-5" />

              </div>

              <div>

                <p className="text-sm font-medium text-[#6B7280]">Lớp sinh hoạt</p>

                <p className="text-[#1F2937] font-semibold">{profile.TenLop || 'Chưa xếp lớp'}</p>

              </div>

            </div>



            <div className="flex items-start gap-4">

              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600">

                <MapPin className="w-5 h-5" />

              </div>

              <div>

                <p className="text-sm font-medium text-[#6B7280]">Cơ sở học tập</p>

                <p className="text-[#1F2937] font-semibold">Cơ sở chính (Mặc định)</p>

              </div>

            </div>

          </div>

        </motion.div>

      </div>



      {/* Đổi mật khẩu */}

      <motion.div

        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}

        className="bg-[#FFFFFF] rounded-2xl p-6 shadow-sm border border-[#E5E7EB]"

      >

        <h3 className="text-xl font-bold text-[#1F2937] mb-6 border-b border-[#E5E7EB] pb-4 flex items-center gap-2">

          <Lock className="w-6 h-6 text-[#F4C542]" /> Mật khẩu & Bảo mật

        </h3>

        <div className="text-center py-8">

          <button

            onClick={() => setShowForgotPassword(true)}

            className="bg-[#F4C542] hover:from-orange-600 hover:to-orange-700 text-[#152238] font-semibold py-3 px-8 rounded-lg transition-all shadow-md shadow-[#F4C542]/30 flex items-center gap-2 mx-auto text-sm"

          >

            <Lock className="w-4 h-4" /> Chỉnh sửa mật khẩu

          </button>

          <p className="text-[#6B7280] text-sm mt-3">Nhấn vào để chỉnh sửa mật khẩu của bạn</p>

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

              <div className="bg-[#F4C542] p-5 text-[#152238] flex justify-between items-center">

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

                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value.replace(/\s/g, '') })}

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



export default StudentProfile;

