import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, Building2, GraduationCap, TrendingUp } from 'lucide-react';
import axios from 'axios';

function DashboardOverview() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSubjects: 0,
    totalClasses: 0,
    totalTeachers: 0
  });
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, studentsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/dashboard/stats'),
        axios.get('http://localhost:5000/api/dashboard/recent-students')
      ]);
      setStats(statsRes.data);
      setRecentStudents(studentsRes.data);
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

      {/* Recent Students */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
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
