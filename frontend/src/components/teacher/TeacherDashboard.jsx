import React, { useState, useEffect } from 'react';
import API_URL from '../../api';
import {
  LayoutDashboard, BookOpen, Users, Calendar, ClipboardCheck,
  Bell, LogOut, ChevronRight, Award, UserCircle, HelpCircle,
  Menu, X, MoreHorizontal, GraduationCap
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '../../hooks/useIsMobile';

import TeacherProfileManagement from './TeacherProfileManagement';
import OverviewSection from './OverviewSection';
import StudentsSection from './StudentsSection';
import GradesSection from './GradesSection';
import AttendanceSection from './AttendanceSection';
import ScheduleSection from './ScheduleSection';
import AnnouncementsSection from './AnnouncementsSection';
import TeacherSupport from './TeacherSupport';
import QuestionBankManagement from './QuestionBankManagement';
import ExamManagement from './ExamManagement';
import { 
  TeacherOverviewSkeleton, 
  TeacherStudentsSkeleton, 
  TeacherGradesSkeleton, 
  TeacherAttendanceSkeleton, 
  TeacherScheduleSkeleton, 
  TeacherProfileSkeleton, 
  TeacherAnnouncementsSkeleton, 
  TeacherSupportSkeleton 
} from '../common/TeacherSkeleton';

const menuItems = [
  { id: 'tongquan', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'sinhvien', label: 'Sinh viên', icon: Users },
  { id: 'quanlydiem', label: 'Quản lý điểm', icon: BookOpen },
  { id: 'diemdanh', label: 'Điểm danh', icon: ClipboardCheck },
  { id: 'lichgiangday', label: 'Lịch giảng dạy', icon: Calendar },
  { id: 'hoso', label: 'Hồ sơ cá nhân', icon: UserCircle },
  { id: 'thongbao', label: 'Thông báo', icon: Bell },
  { id: 'nganhang', label: 'Ngân hàng câu hỏi (AI)', icon: BookOpen },
  { id: 'thionline', label: 'Tổ chức Thi Online', icon: Award },
  { id: 'hotro', label: 'Yêu cầu - Hỗ trợ', icon: HelpCircle },
];

const bottomNavItems = [
  { id: 'tongquan', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'quanlydiem', label: 'Điểm', icon: BookOpen },
  { id: 'diemdanh', label: 'Điểm danh', icon: ClipboardCheck },
  { id: 'hoso', label: 'Hồ sơ', icon: UserCircle },
];

function TeacherDashboard({ user, onLogout }) {
  const [activeMenu, setActiveMenu] = useState(() => localStorage.getItem('activeMenu') || 'tongquan');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [teachingAssignments, setTeachingAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [teachingSchedule, setTeachingSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => { localStorage.setItem('activeMenu', activeMenu); }, [activeMenu]);
  useEffect(() => { localStorage.setItem('activeMenu', activeMenu); }, [activeMenu]);
  useEffect(() => { 
    // Initialize mounted and mobile drawer state outside of effect or use layout effect if needed. 
    // Instead of doing it here synchronously, we just do it in one go.
  }, []);

  useEffect(() => {
    // Handling side effects outside render cycle
    const initApp = () => {
      setMounted(true);
      if (!isMobile) setMobileDrawerOpen(false);
    };
    initApp();
  }, [isMobile]);
  useEffect(() => {
    if (user?.id) {
      const fetchProfile = () => {
        axios.get(`${API_URL}/api/teachers/${user.id}/details?t=${new Date().getTime()}`)
          .then(res => { if (res.data.length > 0) setProfile(res.data[0]); })
          .catch(err => console.error('Lỗi lấy hồ sơ giảng viên:', err))
          .finally(() => setLoadingProfile(false));
      };
      fetchProfile();
      const interval = setInterval(fetchProfile, 3000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => { if (user) fetchTeacherData(); }, [user]);

  const fetchTeacherData = async () => {
    try {
      const [assignmentsRes, studentsRes, gradesRes, announcementsRes, scheduleRes] = await Promise.all([
        axios.get(`${API_URL}/api/course-sections/teacher/${user.id}`),
        axios.get(`${API_URL}/api/students`),
        axios.get(`${API_URL}/api/grades`),
        axios.get(`${API_URL}/api/announcements`),
        axios.get(`${API_URL}/api/teachers/${user.id}/teaching-schedule`),
      ]);
      setTeachingAssignments(assignmentsRes.data);
      setStudents(studentsRes.data);
      setGrades(gradesRes.data);
      setAnnouncements(announcementsRes.data);
      setTeachingSchedule(scheduleRes.data);
    } catch (error) {
      console.error('Error fetching teacher data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (id) => {
    setActiveMenu(id);
    setMobileDrawerOpen(false);
    setMobileMoreOpen(false);
  };

  const renderContent = () => {
    if (loading) {
      switch (activeMenu) {
        case 'tongquan': return <TeacherOverviewSkeleton />;
        case 'sinhvien': return <TeacherStudentsSkeleton />;
        case 'quanlydiem': return <TeacherGradesSkeleton />;
        case 'diemdanh': return <TeacherAttendanceSkeleton />;
        case 'lichgiangday': return <TeacherScheduleSkeleton />;
        case 'hoso': return <TeacherProfileSkeleton />;
        case 'thongbao': return <TeacherAnnouncementsSkeleton />;
        case 'hotro': return <TeacherSupportSkeleton />;
        default: return <TeacherOverviewSkeleton />;
      }
    }
    switch (activeMenu) {
      case 'tongquan': return <OverviewSection teachingAssignments={teachingAssignments} teachingSchedule={teachingSchedule} students={students} user={user} setActiveMenu={setActiveMenu} />;
      case 'sinhvien': return <StudentsSection students={students} teachingAssignments={teachingAssignments} grades={grades} />;
      case 'quanlydiem': return <GradesSection grades={grades} teachingAssignments={teachingAssignments} teachingSchedule={teachingSchedule} students={students} user={user} onRefresh={fetchTeacherData} />;
      case 'diemdanh': return <AttendanceSection teachingSchedule={teachingSchedule} students={students} />;
      case 'lichgiangday': return <ScheduleSection teachingSchedule={teachingSchedule} teachingAssignments={teachingAssignments} user={user} />;
      case 'hoso': return <TeacherProfileManagement user={user} onLogout={onLogout} profile={profile} loading={loadingProfile} />;
      case 'thongbao': return <AnnouncementsSection announcements={announcements} user={user} onRefresh={fetchTeacherData} classes={teachingAssignments} />;
      case 'hotro': return <TeacherSupport user={user} profile={profile} />;
      case 'nganhang': return <QuestionBankManagement />;
      case 'thionline': return <ExamManagement />;
      default: return <OverviewSection teachingAssignments={teachingAssignments} students={students} user={user} setActiveMenu={setActiveMenu} />;
    }
  };

  const renderSidebarContent = () => (
    <div className="h-full flex flex-col w-72">
      <div className="p-5 border-b border-[#1e2f4c] shrink-0 flex justify-center">
        <div onClick={() => handleNavigate('tongquan')} className="flex flex-col items-center gap-2 cursor-pointer hover:scale-105 transition-transform duration-300">
          <div className="relative w-[75px] h-[90px] flex items-center justify-center">
            <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-xl">
              <defs><clipPath id="right-half-teacher-desktop"><rect x="50" y="0" width="50" height="120" /></clipPath></defs>
              <path d="M 5 15 Q 25 20 50 5 Q 75 20 95 15 L 95 60 C 95 95 50 115 50 115 C 50 115 5 95 5 60 Z" fill="#152238" stroke="#D4AF37" strokeWidth="4" strokeLinejoin="round"/>
              <path d="M 15 78 Q 32.5 68 50 91 Q 67.5 68 85 78 Q 67.5 75 50 95 Q 32.5 75 15 78 Z" fill="#D4AF37"/>
              <path d="M 19 86 Q 32.5 79 50 96.5 Q 67.5 79 81 86 Q 67.5 81.5 50 98.5 Q 32.5 81.5 19 86 Z" fill="#D4AF37"/>
              <path d="M 24 93 Q 32.5 87 50 101 Q 67.5 87 76 93 Q 67.5 88.5 50 102.5 Q 32.5 88.5 24 93 Z" fill="#D4AF37"/>
              <path d="M 35 45 L 35 58 C 35 66 50 71 50 71 C 50 71 65 66 65 58 L 65 45" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M 38 48.3 L 50 52.5 L 62 48.3 L 62 58 C 62 65 50 68 50 68 C 50 68 38 65 38 58 Z" fill="#D4AF37"/>
              <path d="M 50 23 L 87 36 L 50 49 L 13 36 Z" fill="none" stroke="#D4AF37" strokeWidth="3.5" strokeLinejoin="round"/>
              <ellipse cx="50" cy="36" rx="4" ry="2.5" fill="#D4AF37"/>
              <path d="M 50 36 Q 68 37 76 44 Q 78 52 76 60" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="76" cy="61" r="1.5" fill="#D4AF37"/>
              <path d="M 74 62 L 78 62 L 77 70 L 75 70 Z" fill="#D4AF37"/>
              <path d="M 5 15 Q 25 20 50 5 Q 75 20 95 15 L 95 60 C 95 95 50 115 50 115 C 50 115 5 95 5 60 Z" fill="#000000" stroke="#000000" strokeWidth="4" opacity="0.15" clipPath="url(#right-half-teacher-desktop)"/>
            </svg>
          </div>
          <div className="flex flex-col items-center mt-2">
            <span className="text-[17px] font-black text-white uppercase tracking-wider leading-none drop-shadow-sm">NhatTin University</span>
            <span className="text-[9px] text-[#F4C542] font-bold uppercase tracking-widest mt-1.5 leading-none">Trường Đại Học Nhất Tín</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
        <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-2 px-2">Menu</p>
        {menuItems.slice(0, 5).map((item) => {
          const Icon = item.icon; const isActive = activeMenu === item.id;
          return (
            <button key={item.id} onClick={() => handleNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ease-out ${isActive ? 'bg-[#F4C542] text-black shadow-md' : 'text-gray-300 hover:bg-[#1e2f4c] hover:text-[#F4C542]'}`}>
              <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
              <span className="font-medium whitespace-nowrap text-sm">{item.label}</span>
            </button>
          );
        })}
        <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mt-6 mb-2 px-2">Tiện Ích</p>
        {menuItems.slice(5).map((item) => {
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
              {(profile?.Avatar || user?.Avatar) ? <img src={profile?.Avatar || user?.Avatar} alt="Avatar" className="w-full h-full object-cover" /> : <span>TM</span>}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate group-hover:text-[#F4C542] transition-colors">{profile?.HoTen || user?.hoTen || 'Giảng Viên'}</p>
              <p className="text-xs text-gray-300 truncate">Giảng viên - Khoa CNTT</p>
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
          {renderSidebarContent()}
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
                {renderSidebarContent()}
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      )}

      <div className="flex-1 flex flex-col bg-transparent relative overflow-hidden">

        {/* Mobile Header */}
        {isMobile && (
          <div className="flex-shrink-0 h-16 bg-[#152238] flex items-center justify-between px-4 shadow-md z-30 border-b border-[#1e2f4c]">
            <button onClick={() => setMobileDrawerOpen(true)} className="p-2 rounded-xl text-white hover:bg-white/10 transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <div onClick={() => handleNavigate('tongquan')} className="flex items-center gap-2 cursor-pointer">
              <div className="relative w-9 h-11 flex items-center justify-center">
                <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-xl">
                  <defs><clipPath id="right-half-teacher-mobile"><rect x="50" y="0" width="50" height="120" /></clipPath></defs>
                  <path d="M 5 15 Q 25 20 50 5 Q 75 20 95 15 L 95 60 C 95 95 50 115 50 115 C 50 115 5 95 5 60 Z" fill="#152238" stroke="#D4AF37" strokeWidth="4" strokeLinejoin="round"/>
                  <path d="M 15 78 Q 32.5 68 50 91 Q 67.5 68 85 78 Q 67.5 75 50 95 Q 32.5 75 15 78 Z" fill="#D4AF37"/>
                  <path d="M 19 86 Q 32.5 79 50 96.5 Q 67.5 79 81 86 Q 67.5 81.5 50 98.5 Q 32.5 81.5 19 86 Z" fill="#D4AF37"/>
                  <path d="M 24 93 Q 32.5 87 50 101 Q 67.5 87 76 93 Q 67.5 88.5 50 102.5 Q 32.5 88.5 24 93 Z" fill="#D4AF37"/>
                  <path d="M 35 45 L 35 58 C 35 66 50 71 50 71 C 50 71 65 66 65 58 L 65 45" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M 38 48.3 L 50 52.5 L 62 48.3 L 62 58 C 62 65 50 68 50 68 C 50 68 38 65 38 58 Z" fill="#D4AF37"/>
                  <path d="M 50 23 L 87 36 L 50 49 L 13 36 Z" fill="none" stroke="#D4AF37" strokeWidth="3.5" strokeLinejoin="round"/>
                  <ellipse cx="50" cy="36" rx="4" ry="2.5" fill="#D4AF37"/>
                  <path d="M 50 36 Q 68 37 76 44 Q 78 52 76 60" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="76" cy="61" r="1.5" fill="#D4AF37"/>
                  <path d="M 74 62 L 78 62 L 77 70 L 75 70 Z" fill="#D4AF37"/>
                  <path d="M 5 15 Q 25 20 50 5 Q 75 20 95 15 L 95 60 C 95 95 50 115 50 115 C 50 115 5 95 5 60 Z" fill="#000000" stroke="#000000" strokeWidth="4" opacity="0.15" clipPath="url(#right-half-teacher-mobile)"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-black text-white uppercase tracking-widest leading-tight">NhatTin</span>
                <span className="text-[8px] text-[#F4C542] font-bold uppercase tracking-widest leading-none">Trường Đại Học Nhất Tín</span>
              </div>
            </div>
            <div onClick={() => handleNavigate('hoso')} className="w-9 h-9 bg-[#F4C542] rounded-full flex items-center justify-center font-bold text-black text-sm overflow-hidden cursor-pointer">
              {(profile?.Avatar || user?.Avatar) ? <img src={profile?.Avatar || user?.Avatar} alt="Avatar" className="w-full h-full object-cover" /> : 'GV'}
            </div>
          </div>
        )}

        {/* Desktop toggle */}
        {!isMobile && (
          <div className="absolute top-1/2 -translate-y-1/2 left-0 z-50">
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 bg-[#FFFFFF] rounded-r-full shadow-lg border border-[#E5E7EB] transition-all duration-200 ease-out">
              <ChevronRight className={`w-5 h-5 text-[#6B7280] transition-transform duration-300 ${sidebarOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}

        <main className={`flex-1 ${isMobile ? 'p-3 pb-20 overflow-x-hidden' : 'p-6'} overflow-y-auto transition-all duration-300 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
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

export default TeacherDashboard;
