import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Calendar,
  ClipboardCheck,
  FileText,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronRight,
  TrendingUp,
  Award,
  AlertCircle,
  Upload,
  UserCircle // Đã thêm UserCircle để hiển thị Avatar góc phải
} from 'lucide-react';
import axios from 'axios';

// Các thư viện component của bạn
import TeacherProfileManagement from './TeacherProfileManagement';
import OverviewSection from './OverviewSection';
import StudentsSection from './StudentsSection';
import GradesSection from './GradesSection';
import AttendanceSection from './AttendanceSection';
import MaterialsSection from './MaterialsSection';
import ScheduleSection from './ScheduleSection';
import AnnouncementsSection from './AnnouncementsSection';

function TeacherDashboard({ user, onLogout }) {
  // 1. VIỆT HÓA BIẾN MẶC ĐỊNH
  const [activeMenu, setActiveMenu] = useState('tongquan'); 
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [teachingAssignments, setTeachingAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [teachingSchedule, setTeachingSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  // === ĐÂY LÀ ĐOẠN CODE BẠN QUÊN Ở BƯỚC TRƯỚC ===
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Lấy dữ liệu Hồ sơ cá nhân của Giảng viên
  useEffect(() => {
    if (user?.id) {
      axios.get(`http://localhost:5000/api/teachers/${user.id}/details`)
        .then(res => {
          if (res.data.length > 0) {
            setProfile(res.data[0]);
          }
        })
        .catch(err => console.error("Lỗi lấy hồ sơ giảng viên:", err))
        .finally(() => setLoadingProfile(false));
    }
  }, [user]);
  // ==============================================

  useEffect(() => {
    if (user) {
      fetchTeacherData();
    }
  }, [user]);

  const fetchTeacherData = async () => {
    try {
      const [assignmentsRes, studentsRes, gradesRes, announcementsRes, scheduleRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/course-sections/teacher/${user.id}`),
        axios.get('http://localhost:5000/api/students'),
        axios.get('http://localhost:5000/api/grades'),
        axios.get('http://localhost:5000/api/announcements'),
        axios.get(`http://localhost:5000/api/teachers/${user.id}/teaching-schedule`)
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

  // 2. VIỆT HÓA ID CỦA MENU
  const menuItems = [
    { id: 'tongquan', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'sinhvien', label: 'Sinh viên', icon: Users },
    { id: 'quanlydiem', label: 'Quản lý điểm', icon: BookOpen },
    { id: 'diemdanh', label: 'Điểm danh', icon: ClipboardCheck },
    { id: 'tailieu', label: 'Tài liệu', icon: FileText },
    { id: 'lichgiangday', label: 'Lịch giảng dạy', icon: Calendar },
    { id: 'hoso', label: 'Hồ sơ cá nhân', icon: Award },
    { id: 'thongbao', label: 'Thông báo', icon: Bell },
  ];

  // 3. VIỆT HÓA CÁC CASE RENDER
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
        // Đã truyền profile và loadingProfile vào component của bạn
        return <TeacherProfileManagement user={user} onLogout={onLogout} profile={profile} loading={loadingProfile} />;
      case 'thongbao':
        return <AnnouncementsSection announcements={announcements} user={user} onRefresh={fetchTeacherData} />;
      default:
        return <OverviewSection teachingAssignments={teachingAssignments} students={students} user={user} />;
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 flex overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={{ width: sidebarOpen ? 280 : 0 }}
        animate={{ width: sidebarOpen ? 280 : 0 }}
        transition={{ duration: 0.3, type: "spring" }}
        className="bg-white/80 backdrop-blur-xl border-r border-orange-100 overflow-hidden flex-shrink-0 h-screen"
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-orange-100 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200/50">
                <Award className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Giảng Viên</span>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <motion.button
                  key={item.id}
                  onClick={() => setActiveMenu(item.id)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, type: "spring" }}
                  whileHover={{ x: 6 }}
                  whileTap={{ scale: 0.97 }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-200'
                      : 'text-gray-600 hover:bg-orange-50 hover:text-orange-500'
                  }`}
                >
                  <div className={`relative z-10 ${isActive ? 'text-white' : ''}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="ml-auto"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </nav>

          {/* Profile Section */}
          <div className="p-4 border-t border-orange-100 flex-shrink-0">
            <div className="flex items-center gap-3">
              <motion.div
                onClick={() => setActiveMenu('hoso')}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden cursor-pointer"
              >
                <UserCircle className="w-10 h-10 text-white mt-1" />
              </motion.div>
              <div className="flex-1 cursor-pointer" onClick={() => setActiveMenu('hoso')}>
                <p className="text-sm font-bold text-gray-800">{profile?.HoTen || user?.hoTen || 'Đang tải...'}</p>
                <p className="text-xs text-gray-500">{profile?.MaGiangVien || user?.username}</p>
              </div>
              <motion.button
                onClick={onLogout}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500"
              >
                <LogOut className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default TeacherDashboard;