import React from 'react';
import { motion } from 'framer-motion';
import { 
  UserCircle, Mail, Phone, Building, 
  Briefcase, Loader2, BookOpen, GraduationCap, Calendar, User
} from 'lucide-react';

function TeacherProfileManagement({ profile, loading, user, onLogout }) {
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
    </div>
  );
}

export default TeacherProfileManagement;
