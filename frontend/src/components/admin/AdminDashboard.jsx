import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Building2, GraduationCap, BookOpen, Users, UserCheck,
  LogOut, ChevronRight, Calendar, FileText, Bell, ClipboardCheck,
  UserCircle, MessageSquare, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardOverview from './DashboardOverview';
import StudentManagement from './StudentManagement';
import TeacherManagement from './TeacherManagement';
import FacultyManagement from './FacultyManagement';
import SubjectManagement from './SubjectManagement';
import ClassManagement from './ClassManagement';
import GradeManagement from './GradeManagement';
import ScheduleManagement from './ScheduleManagement';
import TeachingAssignment from './TeachingAssignment';
import AnnouncementManagement from './AnnouncementManagement';
import UserAccountManagement from './UserAccountManagement';
import AdminRequests from './AdminRequests';
import AdminTrainingPoints from './AdminTrainingPoints';

const menuItems = [
  { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'khoa', label: 'Quản lý khoa', icon: Building2 },
  { id: 'lophoc', label: 'Quản lý lớp học', icon: Users },
  { id: 'monhoc', label: 'Quản lý môn học', icon: BookOpen },
  { id: 'sinhvien', label: 'Quản lý sinh viên', icon: UserCheck },
  { id: 'giangvien', label: 'Quản lý giảng viên', icon: Users },
  { id: 'diem', label: 'Quản lý điểm', icon: FileText },
  { id: 'lichhoc', label: 'Quản lý lịch học', icon: Calendar },
  { id: 'phancong', label: 'Phân công giảng dạy', icon: ClipboardCheck },
  { id: 'thongbao', label: 'Quản lý thông báo', icon: Bell },
  { id: 'yeucau', label: 'Quản lý yêu cầu', icon: MessageSquare },
  { id: 'diemrenluyen', label: 'Quản lý điểm rèn luyện', icon: Award },
  { id: 'taikhoan', label: 'Quản lý tài khoản', icon: UserCircle },
];

const pageComponents = {
  dashboard: DashboardOverview,
  sinhvien: StudentManagement,
  giangvien: TeacherManagement,
  khoa: FacultyManagement,
  monhoc: SubjectManagement,
  lophoc: ClassManagement,
  diem: GradeManagement,
  lichhoc: ScheduleManagement,
  phancong: TeachingAssignment,
  thongbao: AnnouncementManagement,
  yeucau: AdminRequests,
  diemrenluyen: AdminTrainingPoints,
  taikhoan: UserAccountManagement,
};

function AdminDashboard({ user, onLogout }) {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // =========================================================================
  // BỘ CORE ĐIỀU HƯỚNG TỐI ƯU HÓA (CHỐNG LỖI VÒNG LẶP NÚT BACK)
  // =========================================================================
useEffect(() => {
  // Strip both '#' and leading '/' to get the clean menu ID (e.g., '#/sinhvien' -> 'sinhvien')
  const currentHash = window.location.hash.replace('#', '').replace(/^\//, '');

  if (!currentHash || currentHash === 'login') {
    // Mới login: đặt #login làm "neo" để Back về đây → trigger logout
    // Stack: [#login, #dashboard]
    window.history.replaceState(null, '', '#login');
    window.history.pushState(null, '', '#dashboard');
    setActiveMenu('dashboard');
  } else if (currentHash !== 'dashboard') {
    // F5 ở chức năng khác: tái tạo stack [#login → #dashboard → #chucnang]
    window.history.replaceState(null, '', '#login');
    window.history.pushState(null, '', '#dashboard');
    window.history.pushState(null, '', '#' + currentHash);
    setActiveMenu(currentHash);
  } else {
    // Đang ở #dashboard
    setActiveMenu('dashboard');
  }

  const handlePopState = () => {
    const hash = window.location.hash.replace('#', '').replace(/^\//, '');
    if (!hash || hash === 'login') {
      // Back về #login hoặc mất hash → Đăng xuất
      onLogout();
    } else {
      setActiveMenu(hash);
    }
  };

  window.addEventListener('popstate', handlePopState);
  return () => window.removeEventListener('popstate', handlePopState);
}, [onLogout]);

  const handleNavigate = (id) => {
    if (id === activeMenu) return;

    if (id === 'dashboard') {
      // Đang ở ô Chức năng bấm về "Tổng quan" -> Ấn lệnh LÙI LỊCH SỬ để rác không bị dồn
      window.history.back();
    } else {
      if (activeMenu === 'dashboard') {
        // Từ Tổng quan bấm vào Chức năng -> PUSH (Thêm 1 mốc lịch sử)
        window.history.pushState(null, '', '#' + id);
      } else {
        // Từ Chức năng này bấm sang Chức năng khác -> REPLACE (Ghi đè, không làm dài lịch sử)
        window.history.replaceState(null, '', '#' + id);
      }
      setActiveMenu(id);
    }
  };
  // =========================================================================

  const ActiveComponent = pageComponents[activeMenu] || DashboardOverview;

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30 flex overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 288 : 0 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="bg-white border-r border-gray-200 overflow-hidden shrink-0 h-screen shadow-lg"
      >
        <div className="w-72 h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-orange-50 shrink-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex items-center gap-3"
            >
              <div className="w-11 h-11 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-md shadow-orange-200 flex-shrink-0">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-800 whitespace-nowrap block">QLSV</span>
                <span className="text-xs text-orange-500 font-semibold whitespace-nowrap block tracking-wide">Admin Panel</span>
              </div>
            </motion.div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto scrollbar-thin scrollbar-thumb-orange-200">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  onClick={() => handleNavigate(item.id)}
                  whileHover={{ x: isActive ? 0 : 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 relative overflow-hidden group ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-200'
                      : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeMenuBg"
                      className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl"
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      style={{ zIndex: -1 }}
                    />
                  )}
                  <Icon className={`w-4.5 h-4.5 flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} style={{ width: '1.1rem', height: '1.1rem' }} />
                  <span className="font-medium whitespace-nowrap text-sm">{item.label}</span>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70"
                    />
                  )}
                </motion.button>
              );
            })}
          </nav>

          {/* User Profile & Logout */}
          <div className="p-4 border-t border-orange-50 flex-shrink-0 bg-gradient-to-b from-transparent to-orange-50/40">
            <div className="flex items-center justify-between gap-2">
              <motion.div
                className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0 p-2 rounded-xl hover:bg-orange-50 transition-colors duration-200"
                onClick={() => handleNavigate('taikhoan')}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm flex-shrink-0 group-hover:shadow-md group-hover:shadow-orange-200 transition-all duration-200">
                  <UserCircle className="w-5 h-5 text-white" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-gray-800 truncate group-hover:text-orange-600 transition-colors duration-200">
                    {user?.name || 'Admin'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">Quản trị viên</p>
                </div>
              </motion.div>
              <motion.button
                onClick={onLogout}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all duration-200 flex-shrink-0"
                title="Đăng xuất"
              >
                <LogOut className="w-4.5 h-4.5" style={{ width: '1.1rem', height: '1.1rem' }} />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-transparent relative overflow-hidden">
        {/* Toggle Button */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 z-50">
          <motion.button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-1.5 bg-white rounded-r-xl shadow-lg border border-gray-200 hover:border-orange-300 transition-colors duration-200"
          >
            <motion.div
              animate={{ rotate: sidebarOpen ? 180 : 0 }}
              transition={{ duration: 0.25 }}
            >
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </motion.div>
          </motion.button>
        </div>

        {/* Content Area with page transition */}
        <main className="flex-1 p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMenu}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="h-full"
            >
              {activeMenu === 'dashboard'
                ? <ActiveComponent onNavigate={handleNavigate} />
                : <ActiveComponent />
              }
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
