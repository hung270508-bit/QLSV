import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Building2, GraduationCap, BookOpen, Users, UserCheck,
  LogOut, ChevronRight, Calendar, CalendarDays, FileText, Bell, ClipboardCheck,
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
import EnrollmentPhaseManagement from './EnrollmentPhaseManagement';
import UserAccountManagement from './UserAccountManagement';
import AdminRequests from './AdminRequests';
import AdminTrainingPoints from './AdminTrainingPoints';
import TuitionManagement from './TuitionManagement';

const menuItems = [
  { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'khoa', label: 'Quản lý khoa', icon: Building2 },
  { id: 'lophoc', label: 'Quản lý lớp học', icon: Users },
  { id: 'monhoc', label: 'Quản lý môn học', icon: BookOpen },
  { id: 'sinhvien', label: 'Quản lý sinh viên', icon: UserCheck },
  { id: 'giangvien', label: 'Quản lý giảng viên', icon: Users },
  { id: 'diem', label: 'Quản lý điểm', icon: FileText },
  { id: 'lichhoc', label: 'Quản lý lịch học', icon: Calendar },
  { id: 'phasedangky', label: 'Quản lý đợt đăng ký', icon: CalendarDays },
  { id: 'phancong', label: 'Phân công giảng dạy', icon: ClipboardCheck },
  { id: 'thongbao', label: 'Quản lý thông báo', icon: Bell },
  { id: 'yeucau', label: 'Quản lý yêu cầu', icon: MessageSquare },
  { id: 'diemrenluyen', label: 'Quản lý điểm rèn luyện', icon: Award },
  { id: 'taikhoan', label: 'Quản lý tài khoản', icon: UserCircle },
  { id: 'tuition', label: 'Quản lý học phí', icon: FileText }
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
  phasedangky: EnrollmentPhaseManagement,
  phancong: TeachingAssignment,
  thongbao: AnnouncementManagement,
  yeucau: AdminRequests,
  diemrenluyen: AdminTrainingPoints,
  taikhoan: UserAccountManagement,
  tuition: TuitionManagement, // Thêm dòng này vào
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
      {/* Logo - Thiết kế theo hình 1 bên trái */}
      <div className="p-5 border-b border-[#1e2f4c] shrink-0 flex justify-center">
        <div onClick={() => handleNavigate('dashboard')} className="flex flex-col items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity">
          {/* SVG Shield Logo (Trực tiếp vẽ theo ảnh 1) */}
          <div className="relative w-[75px] h-[90px] flex items-center justify-center">
            <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-xl">
              <defs>
                <clipPath id="right-half-desktop">
                  <rect x="50" y="0" width="50" height="120" />
                </clipPath>
              </defs>
              
              {/* Outer Shield */}
              <path d="M 5 15 Q 25 20 50 5 Q 75 20 95 15 L 95 60 C 95 95 50 115 50 115 C 50 115 5 95 5 60 Z" fill="#152238" stroke="#D4AF37" strokeWidth="4" strokeLinejoin="round"/>

              {/* Book Pages (Chuẩn xác 3 lớp cánh chim) */}
              <path d="M 15 78 Q 32.5 68 50 91 Q 67.5 68 85 78 Q 67.5 75 50 95 Q 32.5 75 15 78 Z" fill="#D4AF37"/>
              <path d="M 19 86 Q 32.5 79 50 96.5 Q 67.5 79 81 86 Q 67.5 81.5 50 98.5 Q 32.5 81.5 19 86 Z" fill="#D4AF37"/>
              <path d="M 24 93 Q 32.5 87 50 101 Q 67.5 87 76 93 Q 67.5 88.5 50 102.5 Q 32.5 88.5 24 93 Z" fill="#D4AF37"/>

              {/* Cap Skullcap Base Outline (Mặt thu nhỏ) */}
              <path d="M 35 45 L 35 58 C 35 66 50 71 50 71 C 50 71 65 66 65 58 L 65 45" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round"/>
              
              {/* Chevron (Inner Cap) - Rõ nét viền xanh 1.75px đều các cạnh */}
              <path d="M 38 48.3 L 50 52.5 L 62 48.3 L 62 58 C 62 65 50 68 50 68 C 50 68 38 65 38 58 Z" fill="#D4AF37"/>

              {/* Cap Diamond (Mũ thu lại xíu để không dính khiên) */}
              <path d="M 50 23 L 87 36 L 50 49 L 13 36 Z" fill="none" stroke="#D4AF37" strokeWidth="3.5" strokeLinejoin="round"/>
              
              {/* Center Button */}
              <ellipse cx="50" cy="36" rx="4" ry="2.5" fill="#D4AF37"/>
              
              {/* Tassel String */}
              <path d="M 50 36 Q 68 37 76 44 Q 78 52 76 60" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round"/>
              
              {/* Tassel Knot & Brush */}
              <circle cx="76" cy="61" r="1.5" fill="#D4AF37"/>
              <path d="M 74 62 L 78 62 L 77 70 L 75 70 Z" fill="#D4AF37"/>

              {/* 3D Right Half Shadow Overlay */}
              <path d="M 5 15 Q 25 20 50 5 Q 75 20 95 15 L 95 60 C 95 95 50 115 50 115 C 50 115 5 95 5 60 Z" fill="#000000" stroke="#000000" strokeWidth="4" opacity="0.15" clipPath="url(#right-half-desktop)"/>
            </svg>
          </div>
          
          {/* Text Stack */}
          <div className="flex flex-col items-center mt-2">
            <span className="text-[17px] font-black text-white uppercase tracking-wider leading-none drop-shadow-sm">
              NhatTin University
            </span>
            <span className="text-[9px] text-[#F4C542] font-bold uppercase tracking-widest mt-1.5 leading-none">
              Trường Đại Học Nhất Tín
            </span>
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
          <div className="flex-shrink-0 h-16 bg-[#152238] flex items-center justify-between px-4 shadow-md z-30 border-b border-[#1e2f4c]">
            <button onClick={() => setMobileDrawerOpen(true)} className="p-2 rounded-xl text-white hover:bg-white/10 transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              {/* Mini SVG Logo */}
              <div className="relative w-9 h-11 flex items-center justify-center">
                <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-xl">
                  <defs>
                    <clipPath id="right-half-mobile">
                      <rect x="50" y="0" width="50" height="120" />
                    </clipPath>
                  </defs>
                  
                  {/* Outer Shield */}
                  <path d="M 5 15 Q 25 20 50 5 Q 75 20 95 15 L 95 60 C 95 95 50 115 50 115 C 50 115 5 95 5 60 Z" fill="#152238" stroke="#D4AF37" strokeWidth="4" strokeLinejoin="round"/>

                  {/* Book Pages (Chuẩn xác 3 lớp cánh chim) */}
                  <path d="M 15 78 Q 32.5 68 50 91 Q 67.5 68 85 78 Q 67.5 75 50 95 Q 32.5 75 15 78 Z" fill="#D4AF37"/>
                  <path d="M 19 86 Q 32.5 79 50 96.5 Q 67.5 79 81 86 Q 67.5 81.5 50 98.5 Q 32.5 81.5 19 86 Z" fill="#D4AF37"/>
                  <path d="M 24 93 Q 32.5 87 50 101 Q 67.5 87 76 93 Q 67.5 88.5 50 102.5 Q 32.5 88.5 24 93 Z" fill="#D4AF37"/>

                  {/* Cap Skullcap Base Outline (Mặt thu nhỏ) */}
                  <path d="M 35 45 L 35 58 C 35 66 50 71 50 71 C 50 71 65 66 65 58 L 65 45" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round"/>
                  
                  {/* Chevron (Inner Cap) - Rõ nét viền xanh 1.75px đều các cạnh */}
                  <path d="M 38 48.3 L 50 52.5 L 62 48.3 L 62 58 C 62 65 50 68 50 68 C 50 68 38 65 38 58 Z" fill="#D4AF37"/>

                  {/* Cap Diamond (Mũ thu lại xíu để không dính khiên) */}
                  <path d="M 50 23 L 87 36 L 50 49 L 13 36 Z" fill="none" stroke="#D4AF37" strokeWidth="3.5" strokeLinejoin="round"/>
                  
                  {/* Center Button */}
                  <ellipse cx="50" cy="36" rx="4" ry="2.5" fill="#D4AF37"/>
                  
                  {/* Tassel String */}
                  <path d="M 50 36 Q 68 37 76 44 Q 78 52 76 60" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round"/>
                  
                  {/* Tassel Knot & Brush */}
                  <circle cx="76" cy="61" r="1.5" fill="#D4AF37"/>
                  <path d="M 74 62 L 78 62 L 77 70 L 75 70 Z" fill="#D4AF37"/>

                  {/* 3D Right Half Shadow Overlay */}
                  <path d="M 5 15 Q 25 20 50 5 Q 75 20 95 15 L 95 60 C 95 95 50 115 50 115 C 50 115 5 95 5 60 Z" fill="#000000" stroke="#000000" strokeWidth="4" opacity="0.15" clipPath="url(#right-half-mobile)"/>
                </svg>
              </div>
              <div className="flex flex-col">
                 <span className="text-[12px] font-black text-white uppercase tracking-wide leading-none mt-1">NhatTin Univ</span>
                 <span className="text-[6px] text-[#D4AF37] font-bold uppercase tracking-widest mt-0.5 leading-none">Trường Đại Học Nhất Tín</span>
              </div>
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
