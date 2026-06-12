import React, { useState, useEffect } from 'react';
import API_URL from '../../api';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Calendar,
  ClipboardCheck,
  FileText,
  Bell,
  LogOut,
  ChevronRight,
  Award,
  Upload,
  UserCircle
} from 'lucide-react';
import axios from 'axios';

import TeacherProfileManagement from './TeacherProfileManagement';
import OverviewSection from './OverviewSection';
import StudentsSection from './StudentsSection';
import GradesSection from './GradesSection';
import AttendanceSection from './AttendanceSection';
import MaterialsSection from './MaterialsSection';
import ScheduleSection from './ScheduleSection';
import AnnouncementsSection from './AnnouncementsSection';

const menuItems = [
  { id: 'tongquan', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'sinhvien', label: 'Sinh viên', icon: Users },
  { id: 'quanlydiem', label: 'Quản lý điểm', icon: BookOpen },
  { id: 'diemdanh', label: 'Điểm danh', icon: ClipboardCheck },
  { id: 'tailieu', label: 'Tài liệu', icon: FileText },
  { id: 'lichgiangday', label: 'Lịch giảng dạy', icon: Calendar },
  { id: 'hoso', label: 'Hồ sơ cá nhân', icon: UserCircle },
  { id: 'thongbao', label: 'Thông báo', icon: Bell },
];

function TeacherDashboard({ user, onLogout }) {
  const [activeMenu, setActiveMenu] = useState(() => {
    return localStorage.getItem('activeMenu') || 'tongquan';
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [teachingAssignments, setTeachingAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [teachingSchedule, setTeachingSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    localStorage.setItem('activeMenu', activeMenu);
  }, [activeMenu]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user?.id) {
      axios.get(`${API_URL}/api/teachers/${user.id}/details`)
        .then(res => {
          if (res.data.length > 0) {
            setProfile(res.data[0]);
          }
        })
        .catch(err => console.error("Lỗi lấy hồ sơ giảng viên:", err))
        .finally(() => setLoadingProfile(false));
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchTeacherData();
    }
  }, [user]);

  const fetchTeacherData = async () => {
    try {
      const [assignmentsRes, studentsRes, gradesRes, announcementsRes, scheduleRes] = await Promise.all([
        axios.get(`${API_URL}/api/course-sections/teacher/${user.id}`),
        axios.get(`${API_URL}/api/students`),
        axios.get(`${API_URL}/api/grades`),
        axios.get(`${API_URL}/api/announcements`),
        axios.get(`${API_URL}/api/teachers/${user.id}/teaching-schedule`)
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

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      );
    }

    switch (activeMenu) {
      case 'tongquan':
        return <OverviewSection teachingAssignments={teachingAssignments} teachingSchedule={teachingSchedule} students={students} user={user} />;
      case 'sinhvien':
        return <StudentsSection students={students} teachingAssignments={teachingAssignments} />;
      case 'quanlydiem':
        return <GradesSection grades={grades} teachingAssignments={teachingAssignments} students={students} user={user} onRefresh={fetchTeacherData} />;
      case 'diemdanh':
        return <AttendanceSection teachingSchedule={teachingSchedule} students={students} />;
      case 'tailieu':
        return <MaterialsSection teachingAssignments={teachingAssignments} />;
      case 'lichgiangday':
        return <ScheduleSection teachingSchedule={teachingSchedule} teachingAssignments={teachingAssignments} user={user} />;
      case 'hoso':
        return <TeacherProfileManagement user={user} onLogout={onLogout} profile={profile} loading={loadingProfile} />;
      case 'thongbao':
        return <AnnouncementsSection announcements={announcements} user={user} onRefresh={fetchTeacherData} classes={teachingAssignments} />;
      default:
        return <OverviewSection teachingAssignments={teachingAssignments} students={students} user={user} />;
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30 flex overflow-hidden">
      <aside
        className={`bg-white border-r shadow-border border-gray-200 overflow-hidden shrink-0 h-screen transition-all duration-300 ease-out ${sidebarOpen ? 'w-72' : 'w-0'}`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-orange-50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-800 whitespace-nowrap block">QLSV</span>
                <span className="text-xs text-orange-500 font-medium whitespace-nowrap block">Giảng Viên</span>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveMenu(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ease-out ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                  <span className="font-medium whitespace-nowrap text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-orange-50 flex-shrink-0 bg-gradient-to-b from-transparent to-orange-50/30">
            <div className="flex items-center justify-between">
              <div 
                className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0"
                onClick={() => setActiveMenu('hoso')}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                  <UserCircle className="w-6 h-6 text-white" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-gray-800 truncate group-hover:text-orange-600 transition-colors">
                    {profile?.HoTen || user?.hoTen || 'Giảng Viên'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    Mã GV: {profile?.MaGiangVien || user?.username}
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-2.5 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-500 transition-all duration-200 ease-out flex-shrink-0"
                title="Đăng xuất"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col bg-transparent relative">
        <div className="absolute top-1/2 -translate-y-1/2 left-0 z-50">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 bg-white rounded-r-full shadow-lg border border-gray-200 transition-all duration-200 ease-out"
          >
            <ChevronRight className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${sidebarOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <main className={`flex-1 p-6 overflow-y-auto transition-all duration-300 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: mounted ? '300ms' : '0ms' }}
        >
          <div className="h-full">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default TeacherDashboard;
