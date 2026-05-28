import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Upload
} from 'lucide-react';
import axios from 'axios';

function TeacherDashboard({ user, onLogout }) {
  const [activeMenu, setActiveMenu] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [teachingAssignments, setTeachingAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTeacherData();
    }
  }, [user]);

  const fetchTeacherData = async () => {
    try {
      const [assignmentsRes, studentsRes, gradesRes, announcementsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/teaching-assignments'),
        axios.get('http://localhost:5000/api/students'),
        axios.get('http://localhost:5000/api/grades'),
        axios.get('http://localhost:5000/api/announcements')
      ]);
      
      // Filter assignments for this teacher
      const teacherAssignments = assignmentsRes.data.filter(a => a.MaGiangVien === user.id);
      setTeachingAssignments(teacherAssignments);
      setStudents(studentsRes.data);
      setGrades(gradesRes.data);
      setAnnouncements(announcementsRes.data);
    } catch (error) {
      console.error('Error fetching teacher data:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'students', label: 'Sinh viên', icon: Users },
    { id: 'grades', label: 'Quản lý điểm', icon: BookOpen },
    { id: 'attendance', label: 'Điểm danh', icon: ClipboardCheck },
    { id: 'materials', label: 'Tài liệu', icon: FileText },
    { id: 'schedule', label: 'Lịch giảng dạy', icon: Calendar },
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
        return <OverviewSection teachingAssignments={teachingAssignments} students={students} user={user} />;
      case 'students':
        return <StudentsSection students={students} teachingAssignments={teachingAssignments} />;
      case 'grades':
        return <GradesSection grades={grades} teachingAssignments={teachingAssignments} students={students} />;
      case 'attendance':
        return <AttendanceSection teachingAssignments={teachingAssignments} students={students} />;
      case 'materials':
        return <MaterialsSection teachingAssignments={teachingAssignments} />;
      case 'schedule':
        return <ScheduleSection teachingAssignments={teachingAssignments} />;
      case 'announcements':
        return <AnnouncementsSection announcements={announcements} user={user} />;
      default:
        return <OverviewSection teachingAssignments={teachingAssignments} students={students} user={user} />;
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
                <Award className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-800">Giảng Viên</span>
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
                Xin chào, {user?.hoTen || 'Giảng viên'}!
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{user?.tenKhoa || ''}</p>
                <p className="text-xs opacity-90">{user?.id || ''}</p>
              </div>
              <div className="w-10 h-10 bg-orange-400 rounded-full flex items-center justify-center">
                <Award className="w-5 h-5" />
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
function OverviewSection({ teachingAssignments, students, user }) {
  const myClasses = teachingAssignments.filter(a => a.MaGiangVien === user?.id);
  const totalStudents = students.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Tổng quan giảng dạy</h2>
        <p className="text-gray-500">Xem thông tin giảng dạy và thống kê</p>
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
              <BookOpen className="w-6 h-6 text-orange-500" />
            </div>
            <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-3 py-1 rounded-full">
              Lớp học
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800 mb-1">{myClasses.length}</p>
          <p className="text-sm text-gray-500">Lớp đang giảng dạy</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-green-500" />
            </div>
            <span className="text-xs font-semibold text-green-500 bg-green-50 px-3 py-1 rounded-full">
              Sinh viên
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800 mb-1">{totalStudents}</p>
          <p className="text-sm text-gray-500">Tổng số sinh viên</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-500" />
            </div>
            <span className="text-xs font-semibold text-blue-500 bg-blue-50 px-3 py-1 rounded-full">
              Học kỳ
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800 mb-1">
            {new Set(myClasses.map(c => c.HocKy)).size}
          </p>
          <p className="text-sm text-gray-500">Học kỳ đang dạy</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-500" />
            </div>
            <span className="text-xs font-semibold text-purple-500 bg-purple-50 px-3 py-1 rounded-full">
              Môn học
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800 mb-1">
            {new Set(myClasses.map(c => c.MaMonHoc)).size}
          </p>
          <p className="text-sm text-gray-500">Môn học khác nhau</p>
        </motion.div>
      </div>

      {/* Teaching Assignments */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Lớp đang giảng dạy</h3>
        {myClasses.length > 0 ? (
          <div className="space-y-3">
            {myClasses.map((assignment) => (
              <div key={assignment.MaPhanCong} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-800">{assignment.TenMonHoc}</h4>
                    <p className="text-sm text-gray-600">Lớp: {assignment.TenLop}</p>
                    <p className="text-sm text-gray-500">Học kỳ: {assignment.HocKy}</p>
                  </div>
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                    Đang dạy
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">Chưa có phân công giảng dạy</p>
        )}
      </div>
    </div>
  );
}

// Students Section
function StudentsSection({ students, teachingAssignments }) {
  const [searchTerm, setSearchTerm] = useState('');

  const myClasses = teachingAssignments.map(a => a.MaLop);
  const myStudents = students.filter(s => myClasses.includes(s.MaLop));

  const filteredStudents = myStudents.filter(student =>
    student.HoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.MSSV.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Sinh viên</h2>
        <p className="text-gray-500">Danh sách sinh viên trong các lớp bạn giảng dạy</p>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Tìm kiếm sinh viên..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
        />
        <BookOpen className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">MSSV</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Họ tên</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Lớp</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Email</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">SĐT</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, index) => (
                  <tr key={student.MSSV} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 text-sm font-medium text-gray-800">{student.MSSV}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{student.HoTen}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{student.TenLop}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{student.Email || 'N/A'}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{student.SoDienThoai || 'N/A'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-500">
                    Không tìm thấy sinh viên nào
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

// Grades Section
function GradesSection({ grades, teachingAssignments, students }) {
  const myClasses = teachingAssignments.map(a => a.MaLop);
  const myStudents = students.filter(s => myClasses.includes(s.MaLop)).map(s => s.MSSV);
  const myGrades = grades.filter(g => myStudents.includes(g.MSSV));

  const calculateAverage = (grade) => {
    const qt = parseFloat(grade.DiemQuaTrinh) || 0;
    const gk = parseFloat(grade.DiemGiuaKy) || 0;
    const ck = parseFloat(grade.DiemCuoiKy) || 0;
    return ((qt * 0.2) + (gk * 0.3) + (ck * 0.5)).toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Quản lý điểm</h2>
        <p className="text-gray-500">Xem và quản lý điểm sinh viên</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">MSSV</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Sinh viên</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Môn học</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">QT</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">GK</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">CK</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">TB</th>
              </tr>
            </thead>
            <tbody>
              {myGrades.length > 0 ? (
                myGrades.map((grade, index) => (
                  <tr key={grade.MaDiem} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 text-sm font-medium text-gray-800">{grade.MSSV}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{grade.TenSinhVien}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{grade.TenMonHoc}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{grade.DiemQuaTrinh || '-'}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{grade.DiemGiuaKy || '-'}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{grade.DiemCuoiKy || '-'}</td>
                    <td className="py-4 px-6 text-sm font-bold text-orange-600">{calculateAverage(grade)}</td>
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

// Attendance Section
function AttendanceSection({ teachingAssignments, students }) {
  const myClasses = teachingAssignments.map(a => a.MaLop);
  const myStudents = students.filter(s => myClasses.includes(s.MaLop));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Điểm danh</h2>
        <p className="text-gray-500">Quản lý điểm danh sinh viên</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <ClipboardCheck className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Điểm danh</h3>
            <p className="text-sm text-gray-500">Chọn lớp để điểm danh</p>
          </div>
        </div>

        <div className="space-y-4">
          {teachingAssignments.map((assignment) => (
            <div key={assignment.MaPhanCong} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-800">{assignment.TenMonHoc}</h4>
                  <p className="text-sm text-gray-600">Lớp: {assignment.TenLop}</p>
                </div>
                <button className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors">
                  Điểm danh
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Số sinh viên: {myStudents.filter(s => s.MaLop === assignment.MaLop).length}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Materials Section
function MaterialsSection({ teachingAssignments }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Tài liệu & Bài tập</h2>
        <p className="text-gray-500">Quản lý tài liệu học tập và bài tập</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Upload className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Tải lên tài liệu</h3>
            <p className="text-sm text-gray-500">Thêm tài liệu hoặc bài tập mới</p>
          </div>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Kéo và thả tài liệu vào đây</p>
          <p className="text-sm text-gray-400 mb-4">hoặc</p>
          <button className="px-6 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors">
            Chọn file
          </button>
        </div>

        <div className="mt-6">
          <h4 className="font-semibold text-gray-800 mb-3">Tài liệu đã tải lên</h4>
          <p className="text-gray-500 text-center py-4">Chưa có tài liệu nào</p>
        </div>
      </div>
    </div>
  );
}

// Schedule Section
function ScheduleSection({ teachingAssignments }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Lịch giảng dạy</h2>
        <p className="text-gray-500">Xem lịch giảng dạy của bạn</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        {teachingAssignments.length > 0 ? (
          <div className="space-y-4">
            {teachingAssignments.map((assignment) => (
              <div key={assignment.MaPhanCong} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <h4 className="font-semibold text-gray-800 mb-2">{assignment.TenMonHoc}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Lớp:</p>
                    <p className="font-medium">{assignment.TenLop}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Học kỳ:</p>
                    <p className="font-medium">{assignment.HocKy}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">Chưa có lịch giảng dạy</p>
        )}
      </div>
    </div>
  );
}

// Announcements Section
function AnnouncementsSection({ announcements, user }) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    TieuDe: '',
    NoiDung: '',
    MaLop_Nhan: ''
  });

  const myAnnouncements = announcements.filter(a => a.NguoiTao === user?.id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/announcements', {
        ...formData,
        NguoiTao: user.id
      });
      setShowModal(false);
      setFormData({ TieuDe: '', NoiDung: '', MaLop_Nhan: '' });
      // Refresh announcements
      const res = await axios.get('http://localhost:5000/api/announcements');
      // setAnnouncements(res.data);
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert('Lỗi khi tạo thông báo!');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Thông báo</h2>
          <p className="text-gray-500">Quản lý thông báo cho sinh viên</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl shadow-lg transition-all"
        >
          <Bell className="w-5 h-5" />
          Tạo thông báo
        </button>
      </div>

      <div className="space-y-4">
        {myAnnouncements.length > 0 ? (
          myAnnouncements.map((announcement) => (
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
            <p className="text-gray-500 text-center py-4">Chưa có thông báo nào</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/10">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Tạo thông báo mới</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tiêu đề</label>
                <input
                  type="text"
                  value={formData.TieuDe}
                  onChange={(e) => setFormData({ ...formData, TieuDe: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nội dung</label>
                <textarea
                  value={formData.NoiDung}
                  onChange={(e) => setFormData({ ...formData, NoiDung: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors h-32"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold shadow-lg transition-all"
                >
                  Đăng thông báo
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherDashboard;
