import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, GraduationCap, TrendingUp, PieChart, Award, Clock } from 'lucide-react';
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

  const StatCard = ({ title, value, icon: Icon, color, delay }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.3, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 relative overflow-hidden group"
    >
      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-gray-500 text-sm font-semibold mb-2 uppercase tracking-wide">{title}</p>
          <p className={`text-4xl font-bold`} style={{ color }}>
            {value}
          </p>
        </div>
        <div className="w-14 h-14 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-7 h-7" style={{ color }} />
        </div>
      </div>
    </motion.div>
  );

  const ChartCard = ({ title, children, icon: Icon, delay }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.3, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md transition-transform duration-300 hover:scale-105">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
      </div>
      {children}
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-3xl font-bold text-gray-800">Tổng quan hệ thống</h2>
        <p className="text-gray-500 mt-2">Chào mừng bạn trở lại! Đây là thống kê mới nhất.</p>
      </motion.div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng sinh viên"
          value={stats.totalStudents}
          icon={Users}
          color="#f97316"
          delay={0}
        />
        <StatCard
          title="Số môn học"
          value={stats.totalSubjects}
          icon={BookOpen}
          color="#3b82f6"
          delay={0.1}
        />
        <StatCard
          title="Số lớp học"
          value={stats.totalClasses}
          icon={GraduationCap}
          color="#22c55e"
          delay={0.2}
        />
        <StatCard
          title="Số giảng viên"
          value={stats.totalTeachers}
          icon={TrendingUp}
          color="#a855f7"
          delay={0.3}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Thống kê số sinh viên theo tháng" icon={TrendingUp} delay={0.4}>
          <div className="h-72 flex items-end gap-3 px-4">
            {[30, 45, 35, 50, 65, 55, 70, 80, 75, 90, 85, 100].map((value, index) => (
              <motion.div
                key={index}
                initial={{ height: 0 }}
                animate={{ height: `${value}%` }}
                transition={{ delay: 0.4 + index * 0.03, duration: 0.5, ease: "easeOut" }}
                whileHover={{ scale: 1.05 }}
                className="flex-1 bg-gradient-to-t from-orange-500 via-orange-400 to-orange-300 rounded-t-lg shadow-lg shadow-orange-200 cursor-pointer relative group"
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {value} sinh viên
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex justify-between mt-6 text-xs font-semibold text-gray-500 px-4">
            <span>T1</span><span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span>
            <span>T7</span><span>T8</span><span>T9</span><span>T10</span><span>T11</span><span>T12</span>
          </div>
        </ChartCard>

        <ChartCard title="Phân bố theo Khoa" icon={PieChart} delay={0.5}>
          <div className="h-72 flex items-center justify-center">
            <div className="relative w-56 h-56">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <motion.circle
                  initial={{ strokeDasharray: "0 251" }}
                  animate={{ strokeDasharray: "100 151" }}
                  transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                  cx="50" cy="50" r="40" fill="none" stroke="#f97316" strokeWidth="20"
                />
                <motion.circle
                  initial={{ strokeDasharray: "0 251" }}
                  animate={{ strokeDasharray: "60 191" }}
                  transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                  cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="20" strokeDashoffset="-100"
                />
                <motion.circle
                  initial={{ strokeDasharray: "0 251" }}
                  animate={{ strokeDasharray: "40 211" }}
                  transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
                  cx="50" cy="50" r="40" fill="none" stroke="#22c55e" strokeWidth="20" strokeDashoffset="-160"
                />
                <motion.circle
                  initial={{ strokeDasharray: "0 251" }}
                  animate={{ strokeDasharray: "51 200" }}
                  transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
                  cx="50" cy="50" r="40" fill="none" stroke="#a855f7" strokeWidth="20" strokeDashoffset="-200"
                />
              </svg>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9, duration: 0.3 }}
              className="flex items-center gap-2"
            >
              <div className="w-4 h-4 bg-orange-500 rounded-full shadow-lg shadow-orange-200"></div>
              <span className="text-sm font-semibold text-gray-700">CNTT (40%)</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, duration: 0.3 }}
              className="flex items-center gap-2"
            >
              <div className="w-4 h-4 bg-blue-500 rounded-full shadow-lg shadow-blue-200"></div>
              <span className="text-sm font-semibold text-gray-700">KT (24%)</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1, duration: 0.3 }}
              className="flex items-center gap-2"
            >
              <div className="w-4 h-4 bg-green-500 rounded-full shadow-lg shadow-green-200"></div>
              <span className="text-sm font-semibold text-gray-700">NNA (16%)</span>
            </motion.div>
          </div>
        </ChartCard>
      </div>

      {/* Recent Students */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.3, ease: "easeOut" }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md transition-transform duration-300 hover:scale-105">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Sinh viên mới</h3>
              <p className="text-sm text-gray-500">Danh sách sinh viên vừa đăng ký</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-orange-500 bg-orange-50 px-3 py-1.5 rounded-full">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-semibold">Cập nhật gần đây</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">MSSV</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Họ tên</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Lớp</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Ngày đăng ký</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {recentStudents.map((student, index) => (
                <motion.tr
                  key={student.MSSV}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.03, duration: 0.2, ease: "easeOut" }}
                  whileHover={{ backgroundColor: "rgba(249, 115, 22, 0.03)" }}
                  className="border-b border-gray-100 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4 text-sm text-gray-800 font-medium">{student.MSSV}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{student.HoTen}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold">
                      {student.TenLop || student.MaLop}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{student.NgayTao}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      Đang học
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {recentStudents.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-orange-500" />
            </div>
            <p className="text-gray-500 font-medium">Chưa có sinh viên mới</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default DashboardOverview;
