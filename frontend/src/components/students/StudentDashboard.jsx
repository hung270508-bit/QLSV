import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, UserCircle, CalendarDays, FileText,
  Award, BookPlus, HelpCircle, ClipboardList,ClipboardCheck, LogOut,
  Menu, X, ChevronRight, GraduationCap, Bell
} from 'lucide-react';
import axios from 'axios';

// IMPORT CÁC COMPONENT
import StudentOverview from './StudentOverview';
import StudentSchedule from './StudentSchedule';
import StudentGrades from './StudentGrades';
import StudentProfile from './StudentProfile'; // <-- Import thêm Hồ sơ cá nhân
import StudentAttendance from './StudentAttendance';
import StudentSupport from './StudentSupport';
import StudentTrainingPoints from './StudentTrainingPoints';
import StudentCourseRegistration from './StudentCourseRegistration';
import StudentAnnouncements from './StudentAnnouncements';
const menuItems = [
  { id: 'dashboard', label: 'Trang chủ', icon: LayoutDashboard },
  { id: 'hoso', label: 'Hồ sơ cá nhân', icon: UserCircle },
  { id: 'lichhoc', label: 'Học vụ', icon: CalendarDays },
  { id: 'xemdiem', label: 'Xem điểm', icon: FileText },
  {id: 'diemdanh', label: 'Điểm danh', icon: ClipboardCheck},
  { id: 'renluyen', label: 'Đánh giá rèn luyện', icon: Award },
  { id: 'dangky', label: 'Đăng ký môn học', icon: BookPlus },
  { id: 'thongbao', label: 'Thông báo', icon: Bell },
  { id: 'hotro', label: 'Yêu cầu - Trợ giúp', icon: HelpCircle },
  //{ id: 'khaosat', label: 'Khảo sát', icon: ClipboardList },
];

function StudentDashboard({ user, onLogout }) {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // State lưu toàn bộ Hồ sơ sinh viên
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Gọi API lấy Tên thật và Hồ sơ khi vừa đăng nhập
  useEffect(() => {
    if (user?.username) {
      axios.get(`http://localhost:5000/api/students/${user.username}/details`)
        .then(res => {
          if (res.data.length > 0) {
            setProfile(res.data[0]); // Lưu dữ liệu thật vào state
          }
        })
        .catch(err => console.error("Lỗi lấy hồ sơ:", err))
        .finally(() => setLoadingProfile(false));
    }
  }, [user]);

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <StudentOverview user={user} setActiveMenu={setActiveMenu} />;
      case 'hoso': // Đã gắn giao diện Hồ sơ cá nhân thật
        return <StudentProfile profile={profile} loading={loadingProfile} />;
      case 'lichhoc':
        return <StudentSchedule user={user} />;
      case 'xemdiem':
        return <StudentGrades user={user} />;
      case 'diemdanh': return <StudentAttendance user={user} />;  
      // Các case khác...
      case 'renluyen': return <StudentTrainingPoints user={user} />;
      case 'dangky': return <StudentCourseRegistration user={user} />;
      case 'thongbao': return <StudentAnnouncements user={user} />;
      case 'hotro': return <StudentSupport user={user} />;
      case 'khaosat': return <div className="p-4 bg-white rounded-xl shadow-sm text-gray-500">Đang phát triển: Khảo sát</div>;
      default: return <StudentOverview user={user} setActiveMenu={setActiveMenu} />;
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar (Giữ nguyên) */}
      <motion.aside
        initial={{ width: sidebarOpen ? 260 : 0 }} animate={{ width: sidebarOpen ? 260 : 0 }} transition={{ duration: 0.3 }}
        className="bg-white border-r border-orange-100 overflow-hidden flex-shrink-0 h-screen shadow-sm"
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-orange-100 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-800">Cổng Sinh Viên</span>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <motion.button
                  key={item.id} onClick={() => setActiveMenu(item.id)}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 4 }} whileTap={{ scale: 0.97 }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-200' : 'text-gray-600 hover:bg-orange-50 hover:text-orange-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{item.label}</span>
                  {isActive && <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="ml-auto"><ChevronRight className="w-4 h-4" /></motion.div>}
                </motion.button>
              );
            })}
          </nav>

          {/* Khu vực Profile & Logout dưới cùng */}
          <div className="p-4 border-t border-orange-100 flex-shrink-0 bg-orange-50/30">
            <div className="flex items-center justify-between">
              {/* Thông tin sinh viên (Bấm vào để xem hồ sơ) */}
              <div 
                className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0" 
                onClick={() => setActiveMenu('hoso')}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm flex-shrink-0">
                  <UserCircle className="w-6 h-6 text-white" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-gray-800 truncate group-hover:text-orange-600 transition-colors">
                    {profile?.HoTen || user?.username || 'Đang tải...'}
                  </p>
                  <p className="text-xs font-medium text-gray-500 truncate">
                    MSSV: {profile?.MSSV || user?.username}
                  </p>
                </div>
              </div>

              {/* Nút Đăng xuất thu nhỏ */}
              <motion.button 
                onClick={onLogout} 
                whileHover={{ scale: 1.1 }} 
                whileTap={{ scale: 0.9 }} 
                title="Đăng xuất"
                className="p-2.5 ml-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all duration-200 flex-shrink-0 shadow-sm"
              >
                <LogOut className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        {/* Top Bar Cập nhật Tên */}
    

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div key={activeMenu} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="h-full">
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default StudentDashboard;