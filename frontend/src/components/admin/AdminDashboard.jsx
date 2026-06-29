import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Building2, GraduationCap, BookOpen, Users, UserCheck,
  LogOut, ChevronRight, Calendar, FileText, Bell, ClipboardCheck,
  UserCircle, MessageSquare, Award, Menu, X, MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '../../hooks/useIsMobile';
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

// Bottom nav shows 4 most-used items + "More" button
const bottomNavItems = [
  { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'sinhvien', label: 'Sinh viên', icon: UserCheck },
  { id: 'diem', label: 'Điểm', icon: FileText },
  { id: 'taikhoan', label: 'Tài khoản', icon: UserCircle },
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
  const [activeMenu, setActiveMenu] = useState(() => {
    const hash = window.location.hash.replace('#', '').replace(/^\//, '');
    return hash || 'dashboard';
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const isMobile = useIsMobile();

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

  // Close mobile drawer when switching to desktop
  useEffect(() => {
    if (!isMobile) setMobileDrawerOpen(false);
  }, [isMobile]);

  const handleNavigate = (id) => {
    if (id === activeMenu) { setMobileDrawerOpen(false); setMobileMoreOpen(false); return; }
    const currentIndex = (window.history.state && window.history.state.adminIndex) || 0;
    window.history.pushState({ adminIndex: currentIndex + 1 }, '', '#' + id);
    setActiveMenu(id);
    setMobileDrawerOpen(false);
    setMobileMoreOpen(false);
  };

  const handleLogoutWithHistory = () => { onLogout(); };


  const ActiveComponent = pageComponents[activeMenu] || DashboardOverview;

  const SidebarContent = () => (
    <div className="h-full flex flex-col w-72">
      {/* Logo */}
      <div className="p-6 border-b border-[#1e2f4c] shrink-0">
        <div onClick={() => handleNavigate('dashboard')} className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="w-11 h-11 bg-[#F4C542] rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
            <GraduationCap className="w-6 h-6 text-black" />
          </div>
          <div>
            <span className="text-xl font-bold text-white whitespace-nowrap block">NhatTin University</span>
            <span className="text-xs text-[#F4C542] font-bold whitespace-nowrap block tracking-widest uppercase">Admin Portal</span>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
        <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-2 px-2">Menu chính</p>
        {menuItems.slice(0, 9).map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id;
          return (
            <button key={item.id} onClick={() => handleNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ease-out ${isActive ? 'bg-[#F4C542] text-black shadow-md' : 'text-gray-300 hover:bg-[#1e2f4c] hover:text-[#F4C542]'}`}>
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
            <button key={item.id} onClick={() => handleNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ease-out ${isActive ? 'bg-[#F4C542] text-black shadow-md' : 'text-gray-300 hover:bg-[#1e2f4c] hover:text-[#F4C542]'}`}>
              <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
              <span className="font-medium whitespace-nowrap text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-[#1e2f4c] flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <motion.div className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0 p-2 rounded-xl hover:bg-[#1e2f4c] transition-colors duration-200 relative"
            onClick={() => handleNavigate('taikhoan')} whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}>
            <div className="relative w-9 h-9 bg-[#F4C542] rounded-full flex items-center justify-center font-bold text-black flex-shrink-0 overflow-hidden">
              {user?.Avatar ? <img src={user.Avatar} alt="Avatar" className="w-full h-full object-cover" /> : <span>AD</span>}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate group-hover:text-[#F4C542] transition-colors duration-200">{user?.name || 'ADMIN'}</p>
              <p className="text-xs text-gray-300 truncate">Quản trị viên hệ thống</p>
            </div>
          </motion.div>
          <motion.button onClick={handleLogoutWithHistory} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="p-2 rounded-xl text-[#6B7280] hover:bg-[#EF4444]/10 hover:text-[#EF4444] transition-all duration-200 flex-shrink-0" title="Đăng xuất">
            <LogOut style={{ width: '1.1rem', height: '1.1rem' }} />
          </motion.button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-[#F7F8FA] flex overflow-hidden">

      {/* ===== DESKTOP SIDEBAR ===== */}
      {!isMobile && (
        <motion.aside animate={{ width: sidebarOpen ? 288 : 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="bg-[#152238] border-r border-[#1e2f4c] overflow-hidden shrink-0 h-screen shadow-lg z-20">
          <SidebarContent />
        </motion.aside>
      )}

      {/* ===== MOBILE DRAWER OVERLAY ===== */}
      {isMobile && (
        <AnimatePresence>
          {mobileDrawerOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40" onClick={() => setMobileDrawerOpen(false)} />
              <motion.aside initial={{ x: -288 }} animate={{ x: 0 }} exit={{ x: -288 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="fixed left-0 top-0 h-full bg-[#152238] shadow-2xl z-50 overflow-hidden">
                <div className="absolute top-4 right-4 z-10">
                  <button onClick={() => setMobileDrawerOpen(false)} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <SidebarContent />
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col bg-transparent relative overflow-hidden">

        {/* Mobile Top Header */}
        {isMobile && (
          <div className="flex-shrink-0 h-14 bg-[#152238] flex items-center justify-between px-4 shadow-md z-30">
            <button onClick={() => setMobileDrawerOpen(true)} className="p-2 rounded-xl text-white hover:bg-white/10 transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#F4C542] rounded-lg flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-black" />
              </div>
              <span className="text-sm font-bold text-white">Admin Portal</span>
            </div>
            <div className="w-9 h-9 bg-[#F4C542] rounded-full flex items-center justify-center font-bold text-black text-sm overflow-hidden">
              {user?.Avatar ? <img src={user.Avatar} alt="Avatar" className="w-full h-full object-cover" /> : 'AD'}
            </div>
          </div>
        )}

        {/* Desktop toggle button */}
        {!isMobile && (
          <div className="absolute top-1/2 -translate-y-1/2 left-0 z-50">
            <motion.button onClick={() => setSidebarOpen(!sidebarOpen)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              className="p-1.5 bg-[#FFFFFF] rounded-r-xl shadow-lg border border-[#E5E7EB] hover:border-[#F4C542] transition-colors duration-200">
              <motion.div animate={{ rotate: sidebarOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
                <ChevronRight className="w-4 h-4 text-[#6B7280]" />
              </motion.div>
            </motion.button>
          </div>
        )}

        {/* Content Area */}
        <main className={`flex-1 ${isMobile ? 'p-3 pb-20 overflow-x-hidden' : 'p-6'} overflow-y-auto`}>
          <AnimatePresence mode="wait">
            <motion.div key={activeMenu} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.22, ease: 'easeOut' }} className="h-full">
              {activeMenu === 'dashboard' ? <ActiveComponent onNavigate={handleNavigate} /> : <ActiveComponent />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* ===== MOBILE BOTTOM NAV ===== */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 h-16 bg-[#152238] border-t border-[#1e2f4c] flex items-center justify-around px-2 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <button key={item.id} onClick={() => handleNavigate(item.id)}
                  className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 flex-1 ${isActive ? 'text-[#F4C542]' : 'text-gray-400'}`}>
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                  <span className="text-[9px] font-bold whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
            {/* More button */}
            <button onClick={() => setMobileMoreOpen(true)}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 flex-1 ${mobileMoreOpen ? 'text-[#F4C542]' : 'text-gray-400'}`}>
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[9px] font-bold">Thêm</span>
            </button>
          </div>
        )}

        {/* ===== MOBILE "MORE" SHEET ===== */}
        {isMobile && (
          <AnimatePresence>
            {mobileMoreOpen && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/40 z-40" onClick={() => setMobileMoreOpen(false)} />
                <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="fixed bottom-0 left-0 right-0 bg-[#152238] rounded-t-2xl z-50 shadow-2xl">
                  <div className="p-3 flex justify-center">
                    <div className="w-10 h-1 bg-gray-600 rounded-full" />
                  </div>
                  <div className="px-4 pb-4">
                    <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-3">Tất cả chức năng</p>
                    <div className="grid grid-cols-3 gap-2">
                      {menuItems.filter(m => !bottomNavItems.find(b => b.id === m.id)).map((item) => {
                        const Icon = item.icon;
                        const isActive = activeMenu === item.id;
                        return (
                          <button key={item.id} onClick={() => handleNavigate(item.id)}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-[#F4C542] text-black' : 'bg-[#1e2f4c] text-gray-300 hover:bg-[#243552]'}`}>
                            <Icon className="w-5 h-5" />
                            <span className="text-[10px] font-medium text-center leading-tight">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <button onClick={handleLogoutWithHistory}
                      className="mt-3 w-full py-3 bg-[#EF4444]/10 text-[#EF4444] font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-[#EF4444]/20 transition-colors">
                      <LogOut className="w-4 h-4" /> Đăng xuất
                    </button>
                  </div>
                  <div className="h-4" />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
