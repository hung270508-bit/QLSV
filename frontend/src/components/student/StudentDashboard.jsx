import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, UserCircle, CalendarDays, FileText,
  Award, BookPlus, HelpCircle, ClipboardList, LogOut,
  Menu, X, ChevronRight, GraduationCap
} from 'lucide-react';
import axios from 'axios';

// IMPORT CÁC COMPONENT
import StudentOverview from './StudentOverview';
import StudentSchedule from './StudentSchedule';
import StudentGrades from './StudentGrades';
import StudentProfile from './StudentProfile'; // <-- Import thêm Hồ sơ cá nhân

const menuItems = [
  { id: 'dashboard', label: 'Trang chủ', icon: LayoutDashboard },
  { id: 'hoso', label: 'Hồ sơ cá nhân', icon: UserCircle },
  { id: 'lichhoc', label: 'Thời khóa biểu & Lịch thi', icon: CalendarDays },
  { id: 'xemdiem', label: 'Xem điểm', icon: FileText },
  { id: 'renluyen', label: 'Đánh giá rèn luyện', icon: Award },
  { id: 'dangky', label: 'Đăng ký môn học', icon: BookPlus },
  { id: 'hotro', label: 'Yêu cầu - Trợ giúp', icon: HelpCircle },
  { id: 'khaosat', label: 'Khảo sát', icon: ClipboardList },
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
      axios.get(`http://localhost:5000/api/students/${user.username}`)
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
        
      case 'renluyen': return <div className="p-4 bg-white rounded-xl shadow-sm text-gray-500">Đang phát triển: Đánh giá rèn luyện</div>;
      case 'dangky': return <div className="p-4 bg-white rounded-xl shadow-sm text-gray-500">Đang phát triển: Đăng ký môn học</div>;
      case 'hotro': return <div className="p-4 bg-white rounded-xl shadow-sm text-gray-500">Đang phát triển: Yêu cầu - Trợ giúp</div>;
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

          <div className="p-4 border-t border-orange-100 flex-shrink-0">
            <motion.button onClick={onLogout} whileHover={{ scale: 1.02, x: 4 }} whileTap={{ scale: 0.98 }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all duration-200">
              <LogOut className="w-5 h-5" /> <span className="font-medium">Đăng xuất</span>
            </motion.button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        {/* Top Bar Cập nhật Tên */}
        <header className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4 shadow-md z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-orange-600 rounded-lg transition-colors">
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </motion.button>
              {/* LẤY TÊN THẬT HIỂN THỊ LÊN ĐÂY */}
              <h1 className="text-xl font-bold">
                Xin chào Sinh viên, {profile?.HoTen || user?.username}!
              </h1>
            </div>
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveMenu('hoso')}>
              <div className="hidden md:block text-right">
                <p className="text-sm font-bold">{profile?.HoTen || 'Đang tải...'}</p>
                <p className="text-xs text-orange-200">{profile?.MSSV || user?.username}</p>
              </div>
              <div className="w-10 h-10 bg-orange-400 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                <UserCircle className="w-8 h-8 text-white mt-1" />
              </div>
            </div>
          </div>
        </header>

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