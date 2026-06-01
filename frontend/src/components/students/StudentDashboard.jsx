import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
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
  AlertCircle
} from 'lucide-react';
import axios from 'axios';

function StudentDashboard({ user, onLogout }) {
  const [activeMenu, setActiveMenu] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [gpaData, setGpaData] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStudentData();
    }
  }, [user]);

  const fetchStudentData = async () => {
    try {
      const [gpaRes, transcriptRes, attendanceRes, announcementsRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/academic/gpa/${user.id}`),
        axios.get(`http://localhost:5000/api/academic/transcript/${user.id}`),
        axios.get(`http://localhost:5000/api/attendance/percentage/${user.id}`),
        axios.get(`http://localhost:5000/api/announcements/class/${user.maLop}`)
      ]);
      
      setGpaData(gpaRes.data);
      setTranscript(transcriptRes.data);
      setAttendance(attendanceRes.data);
      setAnnouncements(announcementsRes.data);
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'grades', label: 'Bảng điểm', icon: BookOpen },
    { id: 'transcript', label: 'Bảng điểm tổng hợp', icon: FileText },
    { id: 'attendance', label: 'Điểm danh', icon: ClipboardCheck },
    { id: 'schedule', label: 'Lịch học', icon: Calendar },
    { id: 'announcements', label: 'Thông báo', icon: Bell },
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      );
    }

    switch (activeMenu) {
      case 'overview':
        return <OverviewSection gpaData={gpaData} attendance={attendance} announcements={announcements} user={user} />;
      case 'grades':
        return <GradesSection transcript={transcript} />;
      case 'transcript':
        return <TranscriptSection transcript={transcript} />;
      case 'attendance':
        return <AttendanceSection attendance={attendance} />;
      case 'schedule':
        return <ScheduleSection user={user} />;
      case 'announcements':
        return <AnnouncementsSection announcements={announcements} />;
      default:
        return <OverviewSection gpaData={gpaData} attendance={attendance} announcements={announcements} user={user} />;
    }
  };

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={{ width: sidebarOpen ? 260 : 0 }}
        animate={{ width: sidebarOpen ? 260 : 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white border-r border-orange-100 overflow-hidden flex-shrink-0 h-screen"
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-orange-100 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-800">Sinh Viên</span>
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
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Top Bar */}
        <header className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4 shadow-lg">
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
                Xin chào, {user?.hoTen || 'Sinh viên'}!
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{user?.tenLop || ''}</p>
                <p className="text-xs opacity-90">{user?.id || ''}</p>
              </div>
              <div className="w-10 h-10 bg-orange-400 rounded-full flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

// Overview Section
function OverviewSection({ gpaData, attendance, announcements, user }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Tổng quan học tập</h2>
        <p className="text-gray-500">Xem thông tin học tập và kết quả của bạn</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-orange-500" />
            </div>
            <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-3 py-1 rounded-full">
              GPA
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800 mb-1">{gpaData?.gpa || 0}</p>
          <p className="text-sm text-gray-500">Điểm tích lũy</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
            <span className="text-xs font-semibold text-green-500 bg-green-50 px-3 py-1 rounded-full">
              Xếp loại
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800 mb-1">{gpaData?.academicStanding || 'N/A'}</p>
          <p className="text-sm text-gray-500">Học lực</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-500" />
            </div>
            <span className="text-xs font-semibold text-blue-500 bg-blue-50 px-3 py-1 rounded-full">
              Tin chỉ
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800 mb-1">{gpaData?.totalCredits || 0}</p>
          <p className="text-sm text-gray-500">Tổng số tín chỉ</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <ClipboardCheck className="w-6 h-6 text-purple-500" />
            </div>
            <span className="text-xs font-semibold text-purple-500 bg-purple-50 px-3 py-1 rounded-full">
              Điểm danh
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800 mb-1">{attendance?.percentage || 0}%</p>
          <p className="text-sm text-gray-500">Tỷ lệ có mặt</p>
        </motion.div>
      </div>

      {/* Recent Announcements */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Thông báo gần đây</h3>
        {announcements && announcements.length > 0 ? (
          <div className="space-y-3">
            {announcements.slice(0, 3).map((announcement) => (
              <div key={announcement.MaThongBao} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <h4 className="font-semibold text-gray-800 mb-1">{announcement.TieuDe}</h4>
                <p className="text-sm text-gray-600 line-clamp-2">{announcement.NoiDung}</p>
                <p className="text-xs text-gray-400 mt-2">{new Date(announcement.NgayTao).toLocaleDateString('vi-VN')}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">Không có thông báo mới</p>
        )}
      </div>
    </div>
  );
}

// Grades Section
function GradesSection({ transcript }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Điểm học phần</h2>
        <p className="text-gray-500">Xem điểm các môn học đã đăng ký</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Môn học</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">QT</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">GK</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">CK</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">TB</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Điểm chữ</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">TC</th>
              </tr>
            </thead>
            <tbody>
              {transcript?.transcript && transcript.transcript.length > 0 ? (
                transcript.transcript.map((grade, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 text-sm text-gray-800 font-medium">{grade.TenMonHoc}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{grade.DiemQuaTrinh || '-'}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{grade.DiemGiuaKy || '-'}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{grade.DiemCuoiKy || '-'}</td>
                    <td className="py-4 px-6 text-sm font-bold text-orange-600">{grade.DiemTB || '-'}</td>
                    <td className="py-4 px-6 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        grade.DiemChu === 'A' ? 'bg-green-100 text-green-700' :
                        grade.DiemChu === 'B' ? 'bg-blue-100 text-blue-700' :
                        grade.DiemChu === 'C' ? 'bg-yellow-100 text-yellow-700' :
                        grade.DiemChu === 'D' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {grade.DiemChu || '-'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">{grade.SoTinChi}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-500">
                    Chưa có dữ liệu điểm
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Transcript Section
function TranscriptSection({ transcript }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Bảng điểm tổng hợp</h2>
        <p className="text-gray-500">Bảng điểm học tập chính thức</p>
      </div>

      {transcript?.summary && (
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm opacity-90 mb-1">Tổng tín chỉ</p>
              <p className="text-3xl font-bold">{transcript.summary.totalCredits}</p>
            </div>
            <div>
              <p className="text-sm opacity-90 mb-1">Tín chỉ đạt</p>
              <p className="text-3xl font-bold">{transcript.summary.passedCredits}</p>
            </div>
            <div>
              <p className="text-sm opacity-90 mb-1">GPA tích lũy</p>
              <p className="text-3xl font-bold">{transcript.summary.cumulativeGPA}</p>
            </div>
            <div>
              <p className="text-sm opacity-90 mb-1">Xếp loại</p>
              <p className="text-3xl font-bold">{transcript.summary.academicStanding}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Học kỳ</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Môn học</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">QT</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">GK</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">CK</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">TB</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Điểm chữ</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">TC</th>
              </tr>
            </thead>
            <tbody>
              {transcript?.transcript && transcript.transcript.length > 0 ? (
                transcript.transcript.map((grade, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 text-sm text-gray-600">{grade.HocKy}</td>
                    <td className="py-4 px-6 text-sm text-gray-800 font-medium">{grade.TenMonHoc}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{grade.DiemQuaTrinh || '-'}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{grade.DiemGiuaKy || '-'}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{grade.DiemCuoiKy || '-'}</td>
                    <td className="py-4 px-6 text-sm font-bold text-orange-600">{grade.DiemTB || '-'}</td>
                    <td className="py-4 px-6 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        grade.DiemChu === 'A' ? 'bg-green-100 text-green-700' :
                        grade.DiemChu === 'B' ? 'bg-blue-100 text-blue-700' :
                        grade.DiemChu === 'C' ? 'bg-yellow-100 text-yellow-700' :
                        grade.DiemChu === 'D' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {grade.DiemChu || '-'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">{grade.SoTinChi}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-500">
                    Chưa có dữ liệu điểm
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Attendance Section
function AttendanceSection({ attendance }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Điểm danh</h2>
        <p className="text-gray-500">Theo dõi tình trạng điểm danh của bạn</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <ClipboardCheck className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-800">{attendance?.present || 0}</p>
              <p className="text-sm text-gray-500">Có mặt</p>
            </div>
          </div>
        </motion.div>

        <motion.div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-800">{attendance?.absent || 0}</p>
              <p className="text-sm text-gray-500">Vắng mặt</p>
            </div>
          </div>
        </motion.div>

        <motion.div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-800">{attendance?.excused || 0}</p>
              <p className="text-sm text-gray-500">Có phép</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">Tổng quan điểm danh</h3>
          <span className="text-2xl font-bold text-orange-600">{attendance?.percentage || 0}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className="bg-gradient-to-r from-orange-500 to-orange-600 h-4 rounded-full transition-all duration-300"
            style={{ width: `${attendance?.percentage || 0}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Tổng số buổi: {attendance?.totalSessions || 0}
        </p>
      </div>
    </div>
  );
}

// Schedule Section
function ScheduleSection({ user }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Lịch học</h2>
        <p className="text-gray-500">Xem lịch học của bạn</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <p className="text-gray-500 text-center py-8">
          Tính năng đang được phát triển
        </p>
      </div>
    </div>
  );
}

// Announcements Section
function AnnouncementsSection({ announcements }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Thông báo</h2>
        <p className="text-gray-500">Xem các thông báo từ giảng viên và nhà trường</p>
      </div>

      <div className="space-y-4">
        {announcements && announcements.length > 0 ? (
          announcements.map((announcement) => (
            <div key={announcement.MaThongBao} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-2">{announcement.TieuDe}</h3>
              <p className="text-gray-600 mb-4">{announcement.NoiDung}</p>
              <p className="text-sm text-gray-400">
                {new Date(announcement.NgayTao).toLocaleString('vi-VN')}
              </p>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <p className="text-gray-500 text-center py-4">Không có thông báo</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentDashboard;
