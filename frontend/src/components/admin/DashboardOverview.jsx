import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, Building2, GraduationCap, TrendingUp, AlertCircle, Calendar, FileText, Settings, BarChart3, CheckCircle, XCircle, Clock } from 'lucide-react';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

function DashboardOverview() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSubjects: 0,
    totalClasses: 0,
    totalTeachers: 0
  });
  const [recentStudents, setRecentStudents] = useState([]);
  const [facultyStats, setFacultyStats] = useState([]);
  const [lecturerWorkload, setLecturerWorkload] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, studentsRes, facultyRes, workloadRes, teachersRes, allStudentsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/dashboard/stats'),
        axios.get('http://localhost:5000/api/dashboard/recent-students'),
        axios.get('http://localhost:5000/api/dashboard/stats-by-faculty'),
        axios.get('http://localhost:5000/api/dashboard/lecturer-workload'),
        axios.get('http://localhost:5000/api/teachers'),
        axios.get('http://localhost:5000/api/students')
      ]);
      setStats(statsRes.data);
      setRecentStudents(studentsRes.data);
      setFacultyStats(facultyRes.data);
      setLecturerWorkload(workloadRes.data);
      setTeachers(teachersRes.data);
      setStudents(allStudentsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Tổng sinh viên', value: stats.totalStudents, icon: Users, color: 'from-orange-500 to-orange-600' },
    { title: 'Tổng môn học', value: stats.totalSubjects, icon: BookOpen, color: 'from-amber-500 to-amber-600' },
    { title: 'Tổng lớp học', value: stats.totalClasses, icon: Building2, color: 'from-yellow-500 to-yellow-600' },
    { title: 'Tổng giảng viên', value: stats.totalTeachers, icon: GraduationCap, color: 'from-orange-400 to-orange-500' },
  ];

  const facultyStudentData = facultyStats.map((faculty, index) => ({
    name: faculty.TenKhoa,
    value: faculty.studentCount || 0,
    color: ['#f97316', '#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'][index % 8]
  }));

  const facultyChartData = facultyStats.map(faculty => ({
    name: faculty.TenKhoa,
    sinhVien: faculty.studentCount || 0,
    giangVien: faculty.teacherCount || 0,
    lopHoc: faculty.classCount || 0,
  }));

  const lecturerWorkloadData = lecturerWorkload.map((lecturer, index) => ({
    name: lecturer.HoTen,
    soMonHoc: lecturer.soMonHoc || 0,
    soLop: lecturer.soLop || 0,
    tongTinChi: lecturer.tongTinChi || 0,
  }));


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Tổng quan hệ thống</h2>
        <p className="text-gray-500">Xem thống kê và thông tin chung về hệ thống quản lý sinh viên</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-gray-500" />
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-1">{stat.value}</h3>
              <p className="text-gray-500 text-sm">{stat.title}</p>
            </motion.div>
          );
        })}
      </div>


      {/* Charts Section - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lecturer Workload Statistics - Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Thống kê tải công giảng viên</h3>
            <div className="flex gap-2 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                <span className="text-gray-600">Môn học</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span className="text-gray-600">Lớp</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span className="text-gray-600">Tín chỉ</span>
              </span>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lecturerWorkloadData} margin={{ top: 20, right: 20, left: 20, bottom: 70 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  interval={0}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    padding: '12px'
                  }}
                  itemStyle={{ fontSize: '12px', color: '#374151' }}
                  labelStyle={{ fontSize: '13px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}
                />
                <Bar dataKey="soMonHoc" fill="#f97316" name="Số môn học" radius={[6, 6, 0, 0]} barSize={24}>
                  <LabelList dataKey="soMonHoc" position="top" fontSize={11} fill="#f97316" />
                </Bar>
                <Bar dataKey="soLop" fill="#3b82f6" name="Số lớp" radius={[6, 6, 0, 0]} barSize={24}>
                  <LabelList dataKey="soLop" position="top" fontSize={11} fill="#3b82f6" />
                </Bar>
                <Bar dataKey="tongTinChi" fill="#22c55e" name="Tổng tín chỉ" radius={[6, 6, 0, 0]} barSize={24}>
                  <LabelList dataKey="tongTinChi" position="top" fontSize={11} fill="#22c55e" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Faculty Student Distribution - Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-4">Phân bổ sinh viên theo khoa</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={facultyStudentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1000}
                >
                  {facultyStudentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    borderRadius: '12px', 
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>


      {/* Tabbed List Section - Students and Lecturers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">Danh sách</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('students')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'students'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Sinh viên
            </button>
            <button
              onClick={() => setActiveTab('teachers')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'teachers'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Giảng viên
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'students' ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">MSSV</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Họ tên</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Lớp</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Giới tính</th>
                </tr>
              </thead>
              <tbody>
                {students.length > 0 ? (
                  students.slice(0, 10).map((student, index) => (
                    <tr key={index} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm text-gray-800 font-medium">{student.MSSV}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{student.HoTen}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{student.TenLop || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{student.GioiTinh || 'N/A'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500">Chưa có sinh viên nào</td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Mã GV</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Họ tên</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Khoa</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Email</th>
                </tr>
              </thead>
              <tbody>
                {teachers.length > 0 ? (
                  teachers.slice(0, 10).map((teacher, index) => (
                    <tr key={index} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm text-gray-800 font-medium">{teacher.MaGiangVien}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{teacher.HoTen}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{teacher.TenKhoa || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{teacher.Email || 'N/A'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500">Chưa có giảng viên nào</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default DashboardOverview;
