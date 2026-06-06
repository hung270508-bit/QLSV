import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Building2,
  GraduationCap,
  BookOpen,
  Users,
  UserCheck,
  LogOut,
  ChevronRight,
  Calendar,
  FileText,
  Bell,
  ClipboardCheck,
  UserCircle,
  MessageSquare,
  Award
} from 'lucide-react';
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

function AdminDashboard({ user, onLogout }) {
  const [activeMenu, setActiveMenu] = useState(() => {
    return localStorage.getItem('activeMenu') || 'dashboard';
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

 useEffect(() => {
    localStorage.setItem('activeMenu', activeMenu);
  }, [activeMenu]);

  useEffect(() => {
    setMounted(true);
  }, []);

  
  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <DashboardOverview onNavigate={setActiveMenu} />;
      case 'sinhvien':
        return <StudentManagement />;
      case 'giangvien':
        return <TeacherManagement />;
      case 'khoa':
        return <FacultyManagement />;
      case 'monhoc':
        return <SubjectManagement />;
      case 'lophoc':
        return <ClassManagement />;
      case 'diem':
        return <GradeManagement />;
      case 'lichhoc':
        return <ScheduleManagement />;
      case 'phancong':
        return <TeachingAssignment />;
      case 'thongbao':
        return <AnnouncementManagement />;
      case 'yeucau':
        return <AdminRequests />;
      case 'diemrenluyen':
        return <AdminTrainingPoints />;
      case 'taikhoan':
        return <UserAccountManagement />;
      default:
        return <DashboardOverview onNavigate={setActiveMenu} />;
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30 flex overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`bg-white border-r shadow-border border-gray-200 overflow-hidden shrink-0 h-screen transition-all duration-300 ease-out ${sidebarOpen ? 'w-72' : 'w-0'}`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-orange-50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-800 whitespace-nowrap block">QLSV</span>
                <span className="text-xs text-orange-500 font-medium whitespace-nowrap block">Admin Panel</span>
              </div>
            </div>
          </div>

          {/* Menu Items */}
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

          {/* User Profile & Logout */}
          <div className="p-4 border-t border-orange-50 flex-shrink-0 bg-gradient-to-b from-transparent to-orange-50/30">
            <div className="flex items-center justify-between">
              <div 
                className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0"
                onClick={() => setActiveMenu('taikhoan')}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                  <UserCircle className="w-6 h-6 text-white" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-gray-800 truncate group-hover:text-orange-600 transition-colors">
                    {user?.name || 'Admin'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    Quản trị viên
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-transparent relative">
        {/* Toggle Button */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 z-50">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 bg-white rounded-r-full shadow-lg border border-gray-200 transition-all duration-200 ease-out"
          >
            <ChevronRight className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${sidebarOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Content Area */}
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

export default AdminDashboard;
