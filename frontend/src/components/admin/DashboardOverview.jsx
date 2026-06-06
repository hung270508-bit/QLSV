import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Users, BookOpen, Building2, GraduationCap, TrendingUp, AlertCircle, Calendar, FileText, Settings, BarChart3, CheckCircle, XCircle, Clock, Activity } from 'lucide-react';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, AreaChart, Area, Line, LineChart } from 'recharts';

function DashboardOverview({ onNavigate }) {
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    setMounted(true);
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
    { title: 'Tổng sinh viên', value: stats.totalStudents, icon: Users, color: 'from-orange-500 to-orange-600', menuId: 'sinhvien' },
    { title: 'Tổng môn học', value: stats.totalSubjects, icon: BookOpen, color: 'from-amber-500 to-amber-600', menuId: 'monhoc' },
    { title: 'Tổng lớp học', value: stats.totalClasses, icon: Building2, color: 'from-yellow-500 to-yellow-600', menuId: 'lophoc' },
    { title: 'Tổng giảng viên', value: stats.totalTeachers, icon: GraduationCap, color: 'from-orange-400 to-orange-500', menuId: 'giangvien' },
    { title: 'Tổng khoa', value: facultyStats.length, icon: Building2, color: 'from-red-500 to-red-600', menuId: 'khoa' },
  ];

  const facultyStudentData = facultyStats.map((faculty, index) => ({
    name: faculty.TenKhoa,
    maKhoa: faculty.MaKhoa || faculty.maKhoa || '',
    value: faculty.studentCount || 0,
    color: [
      '#f97316', '#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899',
      '#f59e0b', '#14b8a6', '#84cc16', '#6366f1', '#d946ef', '#f43f5e', '#0ea5e9', '#a855f7',
      '#fb923c', '#10b981', '#eab308', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f59e0b'
    ][index % 24]
  }));

  const totalStudents = facultyStudentData.reduce((sum, item) => sum + item.value, 0);

  const facultyChartData = facultyStats.map(faculty => ({
    name: faculty.TenKhoa,
    sinhVien: faculty.studentCount || 0,
    giangVien: faculty.teacherCount || 0,
    lopHoc: faculty.classCount || 0,
  }));

  const lecturerWorkloadData = lecturerWorkload
    .map((lecturer, index) => ({
      name: lecturer.HoTen,
      soMonHoc: lecturer.soMonHoc || 0,
      soLop: lecturer.soLop || 0,
      tongTinChi: lecturer.tongTinChi || 0,
    }))
    .sort((a, b) => b.tongTinChi - a.tongTinChi)
    .slice(0, 10);

  // Memoize chart data to prevent unnecessary re-renders
  const memoizedFacultyChartData = useMemo(() => facultyChartData, [facultyStats]);
  const memoizedFacultyStudentData = useMemo(() => facultyStudentData, [facultyStats]);


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 shadow-xl border border-orange-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-200 to-orange-300 rounded-xl animate-pulse"></div>
                <div className="w-5 h-5 bg-orange-200 rounded animate-pulse"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 shadow-xl border border-orange-100 h-96"
            >
              <div className="h-6 bg-gray-200 rounded animate-pulse mb-4 w-1/3"></div>
              <div className="h-72 bg-gray-100 rounded-xl animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <h2 className="text-2xl font-bold text-white mb-2">Tổng quan hệ thống</h2>
          <p className="text-orange-100 text-lg">Xem thống kê và thông tin chung về hệ thống quản lý sinh viên</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              onClick={() => onNavigate && onNavigate(stat.menuId)}
              className={`bg-white rounded-2xl p-6 shadow-xl border border-orange-100/50 hover:shadow-2xl hover:border-orange-200/50 transition-all duration-300 relative overflow-hidden group hover:-translate-y-1 cursor-pointer ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: mounted ? `${index * 100}ms` : '0ms' }}
            >
              <div className="flex items-center mb-4 relative z-10">
                <div className={`w-14 h-14 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center shadow-xl shadow-orange-300/40 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
              </div>
              <h3 className="text-4xl font-bold text-gray-800 mb-1 relative z-10">{stat.value}</h3>
              <p className="text-gray-500 text-sm font-medium relative z-10">{stat.title}</p>
            </div>
          );
        })}
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className={`bg-white rounded-2xl p-6 shadow-xl border border-orange-100/50 hover:shadow-2xl hover:border-orange-200/50 transition-all duration-300 hover:-translate-y-1 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: mounted ? '500ms' : '0ms' }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center hover:scale-110 transition-transform duration-300">
                <Activity className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Thống kê theo khoa</h3>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/80 rounded-full border border-blue-100 hover:bg-blue-100 transition-colors duration-200">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span className="text-gray-600 font-medium">Sinh viên</span>
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50/80 rounded-full border border-green-100 hover:bg-green-100 transition-colors duration-200">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                <span className="text-gray-600 font-medium">Giảng viên</span>
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50/80 rounded-full border border-yellow-100 hover:bg-yellow-100 transition-colors duration-200">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                <span className="text-gray-600 font-medium">Lớp học</span>
              </span>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%" debounce={200}>
              <BarChart data={memoizedFacultyChartData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
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
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    padding: '12px'
                  }}
                  itemStyle={{ fontSize: '12px', color: '#374151' }}
                  labelStyle={{ fontSize: '13px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}
                />
                <Bar dataKey="lopHoc" stackId="a" fill="#eab308" name="Lớp học" radius={[0, 0, 0, 0]} stroke="#ca8a04" strokeWidth={1} isAnimationActive={false} />
                <Bar dataKey="giangVien" stackId="a" fill="#22c55e" name="Giảng viên" radius={[0, 0, 0, 0]} stroke="#16a34a" strokeWidth={1} isAnimationActive={false} />
                <Bar dataKey="sinhVien" stackId="a" fill="#3b82f6" name="Sinh viên" radius={[10, 10, 0, 0]} stroke="#2563eb" strokeWidth={1} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className={`bg-white rounded-2xl p-6 shadow-xl border border-orange-100/50 hover:shadow-2xl hover:border-orange-200/50 transition-all duration-300 hover:-translate-y-1 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: mounted ? '600ms' : '0ms' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center hover:scale-110 transition-transform duration-300">
              <Activity className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Phân bổ sinh viên theo khoa</h3>
          </div>
          <div className="flex h-80 gap-6">
            <div className="w-1/2 relative">
              <ResponsiveContainer width="100%" height="100%" debounce={200}>
                <PieChart>
                  <Pie
                    data={memoizedFacultyStudentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    isAnimationActive={true}
                    animationDuration={800}
                    animationEasing="ease-out"
                  >
                    {memoizedFacultyStudentData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke={entry.color}
                        strokeWidth={1}
                        style={{
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => {
                      const percentage = totalStudents > 0 ? ((value / totalStudents) * 100).toFixed(1) : 0;
                      return [`${percentage}%`, name];
                    }}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.98)',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.15)',
                      padding: '12px'
                    }}
                    itemStyle={{ fontSize: '12px', color: '#374151' }}
                    labelStyle={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 flex flex-col justify-center overflow-y-auto max-h-80 pr-2">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {memoizedFacultyStudentData.map((item, index) => {
                  const percentage = totalStudents > 0 ? ((item.value / totalStudents) * 100).toFixed(1) : 0;
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs font-medium text-gray-700">{item.name} ({percentage}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>


      <div
        className={`bg-white rounded-2xl p-6 shadow-xl border border-orange-100/50 hover:shadow-2xl hover:border-orange-200/50 transition-all duration-300 hover:-translate-y-1 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        style={{ transitionDelay: mounted ? '700ms' : '0ms' }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center hover:scale-110 transition-transform duration-300">
              <Users className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Danh sách</h3>
          </div>
          <div className="flex gap-2 bg-orange-50/50 p-1.5 rounded-xl border border-orange-100">
            <button
              onClick={() => setActiveTab('students')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'students'
                  ? 'bg-white text-orange-500 shadow-md'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
              }`}
            >
              Sinh viên
            </button>
            <button
              onClick={() => setActiveTab('teachers')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'teachers'
                  ? 'bg-white text-orange-500 shadow-md'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
              }`}
            >
              Giảng viên
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-100">
          {activeTab === 'students' ? (
            <table className="w-full">
              <thead>
                <tr className="bg-orange-50/50 border-b border-orange-100">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">MSSV</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Họ tên</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Lớp</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Giới tính</th>
                </tr>
              </thead>
              <tbody>
                {students.length > 0 ? (
                  students.slice(0, 10).map((student, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-orange-50/50 transition-colors duration-200">
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
                <tr className="bg-orange-50/50 border-b border-orange-100">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Mã GV</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Họ tên</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Khoa</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                </tr>
              </thead>
              <tbody>
                {teachers.length > 0 ? (
                  teachers.slice(0, 10).map((teacher, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-orange-50/50 transition-colors duration-200">
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
      </div>
    </div>
  );
}

export default DashboardOverview;
