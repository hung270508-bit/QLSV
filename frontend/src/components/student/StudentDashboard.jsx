import React, { useState, useEffect } from 'react';
import API_URL from '../../api';
import {
  LayoutDashboard, UserCircle, CalendarDays, FileText, Award,
  BookPlus, HelpCircle, LogOut, ChevronRight, GraduationCap,
  Bell, ClipboardCheck, Menu, X, MoreHorizontal
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '../../hooks/useIsMobile';

import StudentOverview from './StudentOverview';
import StudentSchedule from './StudentSchedule';
import StudentGrades from './StudentGrades';
import StudentProfile from './StudentProfile';
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
  { id: 'diemdanh', label: 'Điểm danh', icon: ClipboardCheck },
  { id: 'renluyen', label: 'Đánh giá rèn luyện', icon: Award },
  { id: 'dangky', label: 'Đăng ký môn học', icon: BookPlus },
  { id: 'thongbao', label: 'Thông báo', icon: Bell },
  { id: 'hotro', label: 'Yêu cầu - Trợ giúp', icon: HelpCircle },
];

const bottomNavItems = [
  { id: 'dashboard', label: 'Trang chủ', icon: LayoutDashboard },
  { id: 'lichhoc', label: 'Lịch học', icon: CalendarDays },
  { id: 'xemdiem', label: 'Điểm', icon: FileText },
  { id: 'hoso', label: 'Hồ sơ', icon: UserCircle },
];

function StudentDashboard({ user, onLogout }) {
  const [activeMenu, setActiveMenu] = useState(() => localStorage.getItem('activeMenu') || 'dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => { localStorage.setItem('activeMenu', activeMenu); }, [activeMenu]);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (!isMobile) setMobileDrawerOpen(false); }, [isMobile]);

  useEffect(() => {
    if (user?.username) {
      axios.get(`${API_URL}/api/students/${user.username}/details`)
        .then(res => { if (res.data.length > 0) setProfile(res.data[0]); })
        .catch(err => console.error('Lỗi lấy hồ sơ:', err))
        .finally(() => setLoadingProfile(false));
    }
  }, [user]);

  const handleNavigate = (id) => {
    setActiveMenu(id);
    setMobileDrawerOpen(false);
    setMobileMoreOpen(false);
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard': return <StudentOverview user={user} setActiveMenu={setActiveMenu} />;
      case 'hoso': return <StudentProfile profile={profile} loading={loadingProfile} user={user} />;
      case 'lichhoc': return <StudentSchedule user={user} />;
      case 'xemdiem': return <StudentGrades user={user} />;
      case 'diemdanh': return <StudentAttendance user={user} />;
      case 'renluyen': return <StudentTrainingPoints user={user} />;
      case 'dangky': return <StudentCourseRegistration user={user} />;
      case 'thongbao': return <StudentAnnouncements user={user} />;
      case 'hotro': return <StudentSupport user={user} profile={profile} />;
      default: return <StudentOverview user={user} setActiveMenu={setActiveMenu} />;
    }
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col w-72">
      <div className="p-6 border-b border-[#1e2f4c] shrink-0">
        <div onClick={() => handleNavigate('dashboard')} className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="w-11 h-11 bg-[#F4C542] rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
            <GraduationCap className="w-6 h-6 text-black" />
          </div>
          <div>
            <span className="text-xl font-bold text-white whitespace-nowrap block">NhatTin University</span>
            <span className="text-xs text-[#F4C542] font-bold whitespace-nowrap block tracking-widest uppercase">Cổng Sinh Viên</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
        <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-2 px-2">Menu</p>
        {menuItems.slice(0, 6).map((item) => {
          const Icon = item.icon; const isActive = activeMenu === item.id;
          return (
            <button key={item.id} onClick={() => handleNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ease-out ${isActive ? 'bg-[#F4C542] text-black shadow-md' : 'text-gray-300 hover:bg-[#1e2f4c] hover:text-[#F4C542]'}`}>
              <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
              <span className="font-medium whitespace-nowrap text-sm">{item.label}</span>
            </button>
          );
        })}
        <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mt-6 mb-2 px-2">Khác</p>
        {menuItems.slice(6).map((item) => {
          const Icon = item.icon; const isActive = activeMenu === item.id;
          return (
            <button key={item.id} onClick={() => handleNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ease-out ${isActive ? 'bg-[#F4C542] text-black shadow-md' : 'text-gray-300 hover:bg-[#1e2f4c] hover:text-[#F4C542]'}`}>
              <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
              <span className="font-medium whitespace-nowrap text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#1e2f4c] flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0" onClick={() => handleNavigate('hoso')}>
            <div className="w-10 h-10 bg-[#F4C542] rounded-full flex items-center justify-center font-bold text-black flex-shrink-0 overflow-hidden group-hover:scale-105 transition-transform duration-200">
              {user?.Avatar ? <img src={user.Avatar} alt="Avatar" className="w-full h-full object-cover" /> : <span>SV</span>}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate group-hover:text-[#F4C542] transition-colors">{profile?.HoTen || user?.username || 'Sinh Viên'}</p>
              <p className="text-xs text-gray-300 truncate">{profile?.MSSV || user?.username}</p>
            </div>
          </div>
          <button onClick={onLogout} className="p-2.5 rounded-xl text-[#6B7280] hover:bg-[#EF4444]/10 hover:text-[#EF4444] transition-all duration-200 ease-out flex-shrink-0" title="Đăng xuất">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-[#F7F8FA] flex overflow-hidden">

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className={`bg-[#152238] border-r shadow-lg border-[#1e2f4c] overflow-hidden shrink-0 h-screen transition-all duration-300 ease-out z-20 ${sidebarOpen ? 'w-72' : 'w-0'}`}>
          <SidebarContent />
        </aside>
      )}

      {/* Mobile Drawer */}
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

      <div className="flex-1 flex flex-col bg-transparent relative overflow-hidden">

        {/* Mobile Header */}
        {isMobile && (
          <div className="flex-shrink-0 h-14 bg-[#152238] flex items-center justify-between px-4 shadow-md z-30">
            <button onClick={() => setMobileDrawerOpen(true)} className="p-2 rounded-xl text-white hover:bg-white/10 transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#F4C542] rounded-lg flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-black" />
              </div>
              <span className="text-sm font-bold text-white">Cổng Sinh Viên</span>
            </div>
            <div onClick={() => handleNavigate('hoso')} className="w-9 h-9 bg-[#F4C542] rounded-full flex items-center justify-center font-bold text-black text-sm overflow-hidden cursor-pointer">
              {user?.Avatar ? <img src={user.Avatar} alt="Avatar" className="w-full h-full object-cover" /> : 'SV'}
            </div>
          </div>
        )}

        {/* Desktop toggle */}
        {!isMobile && (
          <div className="absolute top-1/2 -translate-y-1/2 left-0 z-50">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 bg-[#FFFFFF] rounded-r-full shadow-lg border border-[#E5E7EB] transition-all duration-200 ease-out">
              <ChevronRight className={`w-5 h-5 text-[#6B7280] transition-transform duration-300 ${sidebarOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}

        <main className={`flex-1 ${isMobile ? 'p-3 pb-20' : 'p-6'} overflow-y-auto transition-all duration-300 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: mounted ? '300ms' : '0ms' }}>
          <div className="h-full">{renderContent()}</div>
        </main>

        {/* Mobile Bottom Nav */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 h-16 bg-[#152238] border-t border-[#1e2f4c] flex items-center justify-around px-2 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
            {bottomNavItems.map((item) => {
              const Icon = item.icon; const isActive = activeMenu === item.id;
              return (
                <button key={item.id} onClick={() => handleNavigate(item.id)}
                  className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 flex-1 ${isActive ? 'text-[#F4C542]' : 'text-gray-400'}`}>
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                  <span className="text-[9px] font-bold whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
            <button onClick={() => setMobileMoreOpen(true)}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 flex-1 ${mobileMoreOpen ? 'text-[#F4C542]' : 'text-gray-400'}`}>
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[9px] font-bold">Thêm</span>
            </button>
          </div>
        )}

        {/* Mobile More Sheet */}
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
                        const Icon = item.icon; const isActive = activeMenu === item.id;
                        return (
                          <button key={item.id} onClick={() => handleNavigate(item.id)}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-[#F4C542] text-black' : 'bg-[#1e2f4c] text-gray-300'}`}>
                            <Icon className="w-5 h-5" />
                            <span className="text-[10px] font-medium text-center leading-tight">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <button onClick={onLogout}
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

export default StudentDashboard;
