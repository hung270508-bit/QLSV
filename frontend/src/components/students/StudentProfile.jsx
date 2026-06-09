import { motion } from 'framer-motion';
import { 
  UserCircle, Mail, Phone, Calendar, 
  MapPin, GraduationCap, Building, Loader2, BookOpen 
} from 'lucide-react';

function StudentProfile({ profile, loading }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-orange-500">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-medium text-lg">Đang tải hồ sơ sinh viên...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-gray-500">
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-8 sm:p-10 text-white shadow-lg relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8">
          {/* Avatar Mặc định */}
          <div className="w-32 h-32 bg-white rounded-full p-2 shadow-xl flex-shrink-0">
            <div className="w-full h-full bg-orange-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-orange-50">
              <UserCircle className="w-24 h-24 text-orange-400 mt-4" />
            </div>
          </div>
          
          <div className="text-center sm:text-left">
            <h2 className="text-3xl sm:text-4xl font-bold mb-2">{profile.HoTen}</h2>
            <p className="text-orange-100 text-lg font-medium flex items-center justify-center sm:justify-start gap-2">
              <BookOpen className="w-5 h-5" /> MSSV: {profile.MSSV}
            </p>
            <div className="mt-4 flex flex-wrap gap-3 justify-center sm:justify-start">
              <span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium border border-white/30">
                {profile.TenLop || 'Chưa xếp lớp'}
              </span>
              <span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium border border-white/30">
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
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">Thông tin liên hệ</h3>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email trường cấp</p>
                <p className="text-gray-800 font-semibold">{profile.Email || 'Chưa cập nhật'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 text-green-600">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Số điện thoại</p>
                <p className="text-gray-800 font-semibold">{profile.SoDienThoai || 'Chưa cập nhật'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0 text-purple-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Ngày sinh</p>
                <p className="text-gray-800 font-semibold">{formatDate(profile.NgaySinh)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Cột 2: Thông tin học vụ */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">Thông tin học vụ</h3>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0 text-orange-600">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Khoa trực thuộc</p>
                <p className="text-gray-800 font-semibold">{profile.TenKhoa || 'Chưa cập nhật khoa'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0 text-rose-600">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Lớp sinh hoạt</p>
                <p className="text-gray-800 font-semibold">{profile.TenLop || 'Chưa xếp lớp'}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Cơ sở học tập</p>
                <p className="text-gray-800 font-semibold">Cơ sở chính (Mặc định)</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default StudentProfile;