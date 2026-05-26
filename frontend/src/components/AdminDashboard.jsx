
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Building2,
  GraduationCap,
  BookOpen,
  Users,
  UserCheck,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Calendar,
  Settings
} from 'lucide-react';
import DashboardOverview from './DashboardOverview';
import StudentManagement from './StudentManagement';
import TeacherManagement from './TeacherManagement';
import FacultyManagement from './FacultyManagement';
import SubjectManagement from './SubjectManagement';
import ClassManagement from './ClassManagement';
import GradeEntry from './GradeEntry';
import CourseSection from './CourseSection';
import ScheduleManagement from './ScheduleManagement';
import UserManagement from './UserManagement';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'khoa', label: 'Quản lý khoa', icon: Building2 },
  { id: 'lophoc', label: 'Quản lý lớp học', icon: Users },
  { id: 'monhoc', label: 'Quản lý môn học', icon: BookOpen },
  { id: 'lophocphan', label: 'Lớp học phần', icon: BookOpen },
  { id: 'lichhoc', label: 'Lịch học', icon: Calendar },
  { id: 'nhapdiem', label: 'Quản lý điểm', icon: GraduationCap },
  { id: 'sinhvien', label: 'Quản lý sinh viên', icon: UserCheck },
  { id: 'giangvien', label: 'Quản lý giảng viên', icon: Users },
  { id: 'taikhoan', label: 'Quản lý tài khoản', icon: Settings },
];

function AdminDashboard({ user, onLogout }) {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <DashboardOverview />;
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
      case 'nhapdiem':
        return <GradeEntry />;
      case 'lophocphan':
        return <CourseSection />;
      case 'lichhoc':
        return <ScheduleManagement />;
      case 'taikhoan':
        return <UserManagement />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={{ width: sidebarOpen ? 260 : 0 }}
        animate={{ width: sidebarOpen ? 260 : 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="bg-white shadow-lg overflow-hidden flex-shrink-0 h-screen"
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-gray-100 flex-shrink-0">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-800">QLSV</span>
            </motion.div>
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
                  transition={{ delay: index * 0.05, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  whileHover={{ x: 4, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
                      : 'text-gray-600 hover:bg-orange-50 hover:text-orange-500'
                  }`}
                >
                  <motion.div
                    whileHover={{ rotate: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.div>
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

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-100 flex-shrink-0">
            <motion.button
              onClick={onLogout}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all duration-200"
            >
              <motion.div
                whileHover={{ rotate: -10 }}
                transition={{ duration: 0.2 }}
              >
                <LogOut className="w-5 h-5" />
              </motion.div>
              <span className="font-medium">Đăng xuất</span>
            </motion.button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: scrolled ? -100 : 0, opacity: scrolled ? 0 : 1 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="bg-orange-500 text-white px-6 py-4 shadow-lg fixed top-0 left-0 right-0 z-10"
          style={{ marginLeft: sidebarOpen ? '260px' : '0', transition: 'margin-left 0.4s ease' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-orange-600 rounded-lg transition-colors"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </motion.button>
              <h1 className="text-xl font-bold">
                Xin chào, {user?.username || user?.TenDangNhap || 'Admin'} hệ thống !!
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-400 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>
        </motion.header>

        {/* Content Area */}
        <main 
          className="flex-1 p-6 overflow-y-auto pt-24"
          onScroll={(e) => {
            const scrollTop = e.target.scrollTop;
            setScrolled(scrollTop > 20);
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMenu}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
