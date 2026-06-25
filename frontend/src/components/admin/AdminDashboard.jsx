import { useState, useEffect } from 'react';
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
//
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
  const [activeMenu, setActiveMenu] = useState(() => {
    const hash = window.location.hash.replace('#', '').replace(/^\//, '');
    return hash || 'dashboard';
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    sessionStorage.removeItem('logoutPending');

    if (!window.location.hash) {
      window.history.replaceState({ adminIndex: 0 }, '', '#dashboard');
    } else if (!window.history.state || window.history.state.adminIndex === undefined) {
      window.history.replaceState({ adminIndex: 0 }, '', window.location.hash);
    }

    const handleHashChange = () => {
      const isPending = sessionStorage.getItem('logoutPending') === 'true';
      const hash = window.location.hash.replace('#', '').replace(/^\//, '');

      if (!hash || hash === 'login') {
        sessionStorage.removeItem('logoutPending');
        onLogout();
      } else if (isPending && (hash === 'dashboard' || (window.history.state && window.history.state.adminIndex === 0))) {
        sessionStorage.removeItem('logoutPending');
        onLogout();
      } else {
        setActiveMenu(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [onLogout]);

  const handleNavigate = (id) => {
    if (id === activeMenu) return;

    const currentIndex = (window.history.state && window.history.state.adminIndex) || 0;
    const nextIndex = currentIndex + 1;

    window.history.pushState({ adminIndex: nextIndex }, '', '#' + id);
    setActiveMenu(id);
  };

  const handleLogoutWithHistory = () => {
    onLogout();
  };

  const ActiveComponent = pageComponents[activeMenu] || DashboardOverview;

  return (
    <div className="h-screen bg-[#F7F8FA] flex overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 288 : 0 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="bg-[#152238] border-r border-[#1e2f4c] overflow-hidden shrink-0 h-screen shadow-lg z-20"
      >
        <div className="w-72 h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-[#1e2f4c] shrink-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              onClick={() => setActiveMenu('dashboard')}
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="w-11 h-11 bg-[#F4C542] rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <GraduationCap className="w-6 h-6 text-black" />
              </div>
              <div>
                <span className="text-xl font-bold text-white whitespace-nowrap block">NhatTin University</span>
                <span className="text-xs text-[#F4C542] font-bold whitespace-nowrap block tracking-widest uppercase">Admin Portal</span>
              </div>
            </motion.div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
            <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-2 px-2">Menu chính</p>
            {menuItems.slice(0, 9).map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ease-out ${
                    isActive
                      ? 'bg-[#F4C542] text-black shadow-md'
                      : 'text-gray-300 hover:bg-[#1e2f4c] hover:text-[#F4C542]'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                  <span className="font-medium whitespace-nowrap text-sm">{item.label}</span>
                </button>
              );
            })}
            
            <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mt-6 mb-2 px-2">Hệ thống & Khác</p>
            {menuItems.slice(9).map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ease-out ${
                    isActive
                      ? 'bg-[#F4C542] text-black shadow-md'
                      : 'text-gray-300 hover:bg-[#1e2f4c] hover:text-[#F4C542]'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                  <span className="font-medium whitespace-nowrap text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile & Logout */}
          <div className="p-4 border-t border-[#1e2f4c] flex-shrink-0">
            <div className="flex items-center justify-between gap-2">
              <motion.div
                className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0 p-2 rounded-xl hover:bg-[#1e2f4c] transition-colors duration-200"
                onClick={() => handleNavigate('taikhoan')}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-9 h-9 bg-[#F4C542] rounded-full flex items-center justify-center font-bold text-black flex-shrink-0">
                  AD
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-white truncate group-hover:text-[#F4C542] transition-colors duration-200">
                    {user?.name || 'ADMIN'}
                  </p>
                  <p className="text-xs text-gray-300 truncate">Quản trị viên hệ thống</p>
                </div>
              </motion.div>
              <motion.button
                onClick={handleLogoutWithHistory}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-xl text-[#6B7280] hover:bg-[#EF4444]/10 hover:text-[#EF4444] transition-all duration-200 flex-shrink-0"
                title="Đăng xuất"
              >
                <LogOut className="w-4.5 h-4.5" style={{ width: '1.1rem', height: '1.1rem' }} />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-transparent relative">
        {/* Toggle Button */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 z-50">
          <motion.button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-1.5 bg-[#FFFFFF] rounded-r-xl shadow-lg border border-[#E5E7EB] hover:border-[#F4C542] transition-colors duration-200"
          >
            <motion.div
              animate={{ rotate: sidebarOpen ? 180 : 0 }}
              transition={{ duration: 0.25 }}
            >
              <ChevronRight className="w-4 h-4 text-[#6B7280]" />
            </motion.div>
          </motion.button>
        </div>

        {/* Content Area with page transition */}
        <main className="flex-1 p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMenu}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
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
