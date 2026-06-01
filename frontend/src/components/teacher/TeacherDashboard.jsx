import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  UserCircle,
  CalendarClock,
  Users,
  UserCheck,
  FileEdit,
  LogOut,
  Menu,
  X,
  ChevronRight,
  BookOpenCheck
} from 'lucide-react';

// TODO: Import các component tương ứng từ thư mục /teacher
// import TeacherOverview from './TeacherOverview';
// import Attendance from './Attendance';
// ...

const menuItems = [
  { id: 'dashboard', label: 'Trang chủ', icon: LayoutDashboard },
  { id: 'hoso', label: 'Hồ sơ cá nhân', icon: UserCircle },
  { id: 'lichday', label: 'Lịch giảng dạy', icon: CalendarClock },
  { id: 'lophoc', label: 'Lớp phụ trách', icon: Users },
  { id: 'diemdanh', label: 'Điểm danh sinh viên', icon: UserCheck },
  { id: 'nhapdiem', label: 'Nhập điểm', icon: FileEdit },
];

function TeacherDashboard({ user, onLogout }) {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <div className="p-4 bg-white rounded-xl shadow-sm">Giao diện Tổng quan GV (Lịch dạy hôm nay, Lớp chủ nhiệm...)</div>;
      case 'hoso':
        return <div className="p-4 bg-white rounded-xl shadow-sm">Giao diện Hồ sơ Giảng viên</div>;
      case 'lichday':
        return <div className="p-4 bg-white rounded-xl shadow-sm">Giao diện Xem lịch dạy chi tiết</div>;
      case 'lophoc':
        return <div className="p-4 bg-white rounded-xl shadow-sm">Giao diện Danh sách lớp & ca phụ trách</div>;
      case 'diemdanh':
        return <div className="p-4 bg-white rounded-xl shadow-sm">Giao diện Điểm danh (Thủ công)</div>;
      case 'nhapdiem':
        return <div className="p-4 bg-white rounded-xl shadow-sm">Giao diện Nhập điểm sinh viên</div>;
      default:
        return <div className="p-4 bg-white rounded-xl shadow-sm">Giao diện Tổng quan GV</div>;
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={{ width: sidebarOpen ? 260 : 0 }}
        animate={{ width: sidebarOpen ? 260 : 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white border-r border-orange-100 overflow-hidden flex-shrink-0 h-screen shadow-sm"
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-orange-100 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
                <BookOpenCheck className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-800">Cổng Giảng Viên</span>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <motion.button
                  key={item.id}
                  onClick={() => setActiveMenu(item.id)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.97 }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-200'
                      : 'text-gray-600 hover:bg-orange-50 hover:text-orange-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{item.label}</span>
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
          <div className="p-4 border-t border-orange-100 flex-shrink-0">
            <motion.button
              onClick={onLogout}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Đăng xuất</span>
            </motion.button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        {/* Top Bar */}
        <header className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4 shadow-md z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-orange-600 rounded-lg transition-colors"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </motion.button>
              <h1 className="text-xl font-bold">
                Xin chào Giảng viên, {user?.username || 'Thầy/Cô'}!
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-400 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                <UserCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMenu}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default TeacherDashboard;