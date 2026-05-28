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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, studentsRes, facultyRes] = await Promise.all([
        axios.get('http://localhost:5000/api/dashboard/stats'),
        axios.get('http://localhost:5000/api/dashboard/recent-students'),
        axios.get('http://localhost:5000/api/dashboard/stats-by-faculty')
      ]);
      setStats(statsRes.data);
      setRecentStudents(studentsRes.data);
      setFacultyStats(facultyRes.data);
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
        {/* Faculty Statistics - Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-4">Thống kê theo khoa</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={facultyChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80} 
                  tick={{ fontSize: 11 }}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    borderRadius: '12px', 
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Bar dataKey="sinhVien" fill="#f97316" name="Sinh viên" radius={[4, 4, 0, 0]} />
                <Bar dataKey="giangVien" fill="#3b82f6" name="Giảng viên" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lopHoc" fill="#22c55e" name="Lớp học" radius={[4, 4, 0, 0]} />
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


      {/* Recent Students */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
      >
        <h3 className="text-lg font-bold text-gray-800 mb-4">Sinh viên mới đăng ký</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">MSSV</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Họ tên</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Lớp</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {recentStudents.length > 0 ? (
                recentStudents.map((student, index) => (
                  <tr key={index} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm text-gray-800 font-medium">{student.MSSV}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{student.HoTen}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{student.TenLop || 'N/A'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(student.NgayTao).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-gray-500">Chưa có sinh viên nào</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

export default DashboardOverview;
