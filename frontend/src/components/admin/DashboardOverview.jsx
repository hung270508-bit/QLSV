import React, { useState, useEffect, useMemo } from 'react';
import API_URL from '../../api';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, BookOpen, Building2, GraduationCap, Activity, ArrowUpRight } from 'lucide-react';
import axios from 'axios';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

/* ─── Animation variants ─────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] } })
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: (i = 0) => ({ opacity: 1, scale: 1, transition: { duration: 0.4, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] } })
};

/* ─── Custom Tooltip ──────────────────────────────────────────────── */
const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  const order = ['Sinh viên', 'Giảng viên', 'Lớp học'];
  const sortedPayload = [...payload].sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-orange-100 shadow-2xl p-4 min-w-[160px]">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      {sortedPayload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.fill }} />
          <span className="text-xs text-gray-600">{p.name}</span>
          <span className="ml-auto text-xs font-bold text-gray-800">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value, payload: d } = payload[0];
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-orange-100 shadow-2xl p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
        <span className="text-xs font-semibold text-gray-700">{name}</span>
      </div>
      <p className="text-lg font-bold text-gray-800">{value} SV</p>
    </div>
  );
};

/* ─── Stat Card ───────────────────────────────────────────────────── */
const StatCard = ({ stat, index, onNavigate }) => {
  const Icon = stat.icon;
  return (
    <motion.div
      custom={index}
      variants={scaleIn}
      initial="hidden"
      animate="show"
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onNavigate?.(stat.menuId)}
      className="relative bg-white rounded-2xl p-6 shadow-lg border border-orange-100/60 overflow-hidden cursor-pointer group"
    >
      {/* Decorative blob */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 rounded-full blur-xl group-hover:opacity-20 transition-opacity duration-300`} />

      <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg mb-4`}>
        <Icon className="w-6 h-6 text-white" />
      </div>

      <p className="text-3xl font-extrabold text-gray-800 tracking-tight">{stat.value}</p>
      <p className="text-sm text-gray-400 font-medium mt-1">{stat.title}</p>

      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
        <ArrowUpRight className="w-4 h-4 text-orange-400" />
      </div>
    </motion.div>
  );
};

/* ─── Loading skeleton ───────────────────────────────────────────── */
const Skeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-32 bg-orange-100 rounded-2xl" />
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl" />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="h-96 bg-gray-100 rounded-2xl" />
      <div className="h-96 bg-gray-100 rounded-2xl" />
    </div>
    <div className="h-64 bg-gray-100 rounded-2xl" />
  </div>
);

/* ─── Main Component ─────────────────────────────────────────────── */
function DashboardOverview({ onNavigate }) {
  const [stats, setStats] = useState({ totalStudents: 0, totalSubjects: 0, totalClasses: 0, totalTeachers: 0 });
  const [facultyStats, setFacultyStats] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, facultyRes, teachersRes, allStudentsRes] = await Promise.all([
        axios.get(`${API_URL}/api/dashboard/stats`),
        axios.get(`${API_URL}/api/dashboard/stats-by-faculty`),
        axios.get(`${API_URL}/api/teachers`),
        axios.get(`${API_URL}/api/students`)
      ]);
      setStats(statsRes.data);
      setFacultyStats(facultyRes.data);
      setTeachers(teachersRes.data);
      setStudents(allStudentsRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = [
    '#f97316','#3b82f6','#22c55e','#eab308','#ef4444','#8b5cf6',
    '#06b6d4','#ec4899','#f59e0b','#14b8a6','#84cc16','#6366f1',
    '#d946ef','#f43f5e','#0ea5e9','#a855f7','#fb923c','#10b981'
  ];

  const statCards = [
    { title: 'Tổng sinh viên',  value: stats.totalStudents,  icon: Users,         color: 'from-orange-500 to-orange-600', menuId: 'sinhvien' },
    { title: 'Tổng môn học',    value: stats.totalSubjects,  icon: BookOpen,      color: 'from-amber-500  to-amber-600',  menuId: 'monhoc'   },
    { title: 'Tổng lớp học',    value: stats.totalClasses,   icon: Building2,     color: 'from-yellow-500 to-yellow-600', menuId: 'lophoc'   },
    { title: 'Tổng giảng viên', value: stats.totalTeachers,  icon: GraduationCap, color: 'from-orange-400 to-orange-500', menuId: 'giangvien'},
    { title: 'Tổng khoa',       value: facultyStats.length,  icon: Building2,     color: 'from-red-500    to-red-600',    menuId: 'khoa'     },
  ];

  const facultyStudentData = useMemo(() =>
    facultyStats.map((f, i) => ({
      name: f.TenKhoa,
      value: f.studentCount || 0,
      color: COLORS[i % COLORS.length]
    })), [facultyStats]);

  const totalStudents = useMemo(() =>
    facultyStudentData.reduce((s, d) => s + d.value, 0), [facultyStudentData]);

  // Top-5 for bar chart
  const top5ChartData = useMemo(() =>
    facultyStats
      .map(f => ({ name: f.TenKhoa, sinhVien: f.studentCount || 0, giangVien: f.teacherCount || 0, lopHoc: f.classCount || 0 }))
      .sort((a, b) => b.sinhVien - a.sinhVien)
      .slice(0, 5),
    [facultyStats]);

  if (loading) return <Skeleton />;

  return (
    <motion.div
      className="space-y-7"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.07 } } }}
    >
      {/* ── Hero Banner ── */}
      <motion.div variants={fadeUp} custom={0}>
        <div className="relative bg-gradient-to-r from-orange-500 via-orange-500 to-orange-400 rounded-2xl p-8 shadow-xl overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-white rounded-full translate-y-1/2" />
          </div>
          <div className="relative">
            <h2 className="text-2xl font-extrabold text-white mb-1 tracking-tight">Tổng quan hệ thống</h2>
            <p className="text-orange-100 text-base">Thống kê và thông tin chung về hệ thống quản lý sinh viên</p>
          </div>
        </div>
      </motion.div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat, i) => (
          <StatCard key={stat.title} stat={stat} index={i} onNavigate={onNavigate} />
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Bar Chart */}
        <motion.div variants={fadeUp} custom={1}
          className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100/60 hover:shadow-xl transition-shadow duration-300"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800">Thống kê theo khoa</h3>
                <p className="text-xs text-gray-400">Top 5 khoa nhiều sinh viên nhất</p>
              </div>
            </div>
            <div className="flex gap-1.5 text-[11px]">
              {[
                { label: 'Sinh viên', color: 'bg-blue-500' },
                { label: 'Giảng viên', color: 'bg-green-500' },
                { label: 'Lớp học', color: 'bg-yellow-400' },
              ].map(l => (
                <span key={l.label} className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-full border border-gray-100">
                  <span className={`w-2 h-2 rounded-full ${l.color}`} />
                  <span className="text-gray-500 font-medium">{l.label}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%" debounce={200}>
              <BarChart data={top5ChartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  tickFormatter={v => v.length > 10 ? v.slice(0, 10) + '…' : v}
                />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(249,115,22,0.04)', radius: 8 }} />
                <Bar dataKey="lopHoc"    stackId="a" fill="#facc15" name="Lớp học"    radius={[0,0,0,0]} isAnimationActive={true} animationDuration={600} />
                <Bar dataKey="giangVien" stackId="a" fill="#4ade80" name="Giảng viên" radius={[0,0,0,0]} isAnimationActive={true} animationDuration={700} />
                <Bar dataKey="sinhVien"  stackId="a" fill="#60a5fa" name="Sinh viên"  radius={[6,6,0,0]} isAnimationActive={true} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Pie Chart */}
        <motion.div variants={fadeUp} custom={2}
          className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100/60 hover:shadow-xl transition-shadow duration-300"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">Phân bổ sinh viên theo khoa</h3>
              <p className="text-xs text-gray-400">Tổng {totalStudents.toLocaleString()} sinh viên</p>
            </div>
          </div>

          <div className="flex h-72 gap-4">
            {/* Pie */}
            <div className="w-[45%] relative">
              <ResponsiveContainer width="100%" height="100%" debounce={200}>
                <PieChart>
                  <Pie
                    data={facultyStudentData}
                    cx="50%" cy="50%"
                    outerRadius={90} innerRadius={52}
                    dataKey="value"
                    labelLine={false}
                    isAnimationActive
                    animationBegin={200}
                    animationDuration={900}
                    animationEasing="ease-out"
                    stroke="none"
                  >
                    {facultyStudentData.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-orange-100">
              {facultyStudentData.map((item, i) => {
                const pct = totalStudents > 0 ? ((item.value / totalStudents) * 100).toFixed(1) : 0;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.04 }}
                    className="flex items-center gap-2 group"
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] text-gray-600 truncate">{item.name}</span>
                        <span className="text-[11px] font-bold text-gray-700 shrink-0">{pct}%</span>
                      </div>
                      <div className="h-1 bg-gray-100 rounded-full mt-0.5 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: item.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: 0.4 + i * 0.04 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── List Table ── */}
      <motion.div variants={fadeUp} custom={3}
        className="bg-white rounded-2xl shadow-lg border border-orange-100/60 overflow-hidden"
      >
        {/* Table header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-800">Danh sách</h3>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 bg-orange-50 p-1 rounded-xl border border-orange-100">
            {[
              { id: 'students', label: 'Sinh viên' },
              { id: 'teachers', label: 'Giảng viên' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors duration-200 ${
                  activeTab === tab.id ? 'text-orange-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="tab-bg"
                    className="absolute inset-0 bg-white rounded-lg shadow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'students' ? (
            <motion.div
              key="students"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left py-3 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">MSSV</th>
                    <th className="text-left py-3 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Họ tên</th>
                    <th className="text-left py-3 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Lớp</th>
                    <th className="text-left py-3 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Giới tính</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length > 0 ? (
                    students.slice(0, 10).map((student, i) => (
                      <motion.tr
                        key={student.MSSV}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="border-b border-gray-50 hover:bg-orange-50/40 transition-colors duration-150"
                      >
                        <td className="py-3.5 px-6">
                          <span className="font-mono text-sm font-semibold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-lg">{student.MSSV}</span>
                        </td>
                        <td className="py-3.5 px-6 text-sm font-semibold text-gray-700">{student.HoTen}</td>
                        <td className="py-3.5 px-6 text-sm text-gray-500">{student.TenLop || '—'}</td>
                        <td className="py-3.5 px-6">
                          <span className={`inline-flex text-xs px-2.5 py-1 rounded-full font-semibold ${
                            student.GioiTinh === 'Nam' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'
                          }`}>
                            {student.GioiTinh || '—'}
                          </span>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr><td colSpan="4" className="py-12 text-center text-gray-400 text-sm">Chưa có sinh viên nào</td></tr>
                  )}
                </tbody>
              </table>
            </motion.div>
          ) : (
            <motion.div
              key="teachers"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left py-3 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Mã GV</th>
                    <th className="text-left py-3 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Họ tên</th>
                    <th className="text-left py-3 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Khoa</th>
                    <th className="text-left py-3 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.length > 0 ? (
                    teachers.slice(0, 10).map((teacher, i) => (
                      <motion.tr
                        key={teacher.MaGiangVien}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="border-b border-gray-50 hover:bg-orange-50/40 transition-colors duration-150"
                      >
                        <td className="py-3.5 px-6">
                          <span className="font-mono text-sm font-semibold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-lg">{teacher.MaGiangVien}</span>
                        </td>
                        <td className="py-3.5 px-6 text-sm font-semibold text-gray-700">{teacher.HoTen}</td>
                        <td className="py-3.5 px-6">
                          <span className="text-xs bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full font-semibold border border-orange-100">
                            {teacher.TenKhoa || '—'}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-sm text-gray-500">{teacher.Email || '—'}</td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr><td colSpan="4" className="py-12 text-center text-gray-400 text-sm">Chưa có giảng viên nào</td></tr>
                  )}
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export default DashboardOverview;
