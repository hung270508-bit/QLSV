import React, { useState, useEffect, useMemo, useRef } from 'react';
import API_URL from '../../api';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, BookOpen, Building2, GraduationCap, Activity, ArrowUpRight } from 'lucide-react';
import axios from 'axios';
import Pagination from '../common/Pagination';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

/* ─── Animation variants ─────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] } })
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: (i = 0) => ({ opacity: 1, scale: 1, transition: { duration: 0.3, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] } })
};

/* ─── Custom Tooltip ──────────────────────────────────────────────── */
const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  const order = ['Sinh viên', 'Giảng viên', 'Lớp học'];
  const sortedPayload = [...payload].sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));

  return (
    <div className="bg-[#FFFFFF]/95 backdrop-blur-sm rounded-2xl border border-[#FFF7D6] shadow-2xl p-4 min-w-[160px]">
      <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">{label}</p>
      {sortedPayload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.fill }} />
          <span className="text-xs text-[#6B7280]">{p.name}</span>
          <span className="ml-auto text-xs font-bold text-[#1F2937]">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value, payload: d } = payload[0];
  return (
    <div className="bg-[#FFFFFF]/95 backdrop-blur-sm rounded-2xl border border-[#FFF7D6] shadow-2xl p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
        <span className="text-xs font-semibold text-gray-700">{name}</span>
      </div>
      <p className="text-lg font-bold text-[#1F2937]">{value} SV</p>
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
      whileHover={{ y: -6, boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.05)" }}
      whileTap={{ scale: 0.96 }}
      onClick={() => onNavigate?.(stat.menuId)}
      className="relative bg-[#FFFFFF] rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-[#E5E7EB] overflow-hidden cursor-pointer group transition-all duration-300"
    >
      <div className="flex justify-between items-start">
        <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-4 ${stat.bgColor} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.iconColor}`} />
        </div>
        <div className="bg-gray-50 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
          <ArrowUpRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      <p className="text-xl sm:text-3xl font-extrabold text-[#1F2937] tracking-tight group-hover:text-[#F4C542] transition-colors duration-300">{stat.value}</p>
      <p className="text-xs text-gray-400 font-medium mt-0.5 sm:mt-1 leading-tight">{stat.title}</p>
      <div className="absolute bottom-0 left-0 h-1 bg-[#F4C542] w-0 group-hover:w-full transition-all duration-500 ease-out" />
    </motion.div>
  );
};

/* ─── Loading skeleton ───────────────────────────────────────────── */
const Skeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-32 bg-[#FFF7D6] rounded-2xl" />
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

/* ─── Custom Bar Shape ────────────────────────────────────────────── */
const BouncyBarSegment = (props) => {
  const { x, y, width, height, fill, index, radius, isBouncy = true, isInitialRender = true } = props;
  const r = radius && Array.isArray(radius) ? radius[0] : 0;
  
  if (width == null || height == null || height === 0) return null;

  const yBottom = y + height;
  const rSafe = Math.min(r, width / 2, height / 2);

  const initialD = `M${x},${yBottom} L${x},${yBottom} Q${x},${yBottom} ${x + rSafe},${yBottom} L${x + width - rSafe},${yBottom} Q${x + width},${yBottom} ${x + width},${yBottom} L${x + width},${yBottom} Z`;

  const animateD = `M${x},${yBottom} L${x},${y + rSafe} Q${x},${y} ${x + rSafe},${y} L${x + width - rSafe},${y} Q${x + width},${y} ${x + width},${y + rSafe} L${x + width},${yBottom} Z`;

  const initialPath = isInitialRender ? initialD : animateD;

  return (
    <motion.path
      fill={fill}
      initial={{ d: initialPath }}
      animate={{ d: animateD }}
      transition={isBouncy ? {
        type: 'spring',
        stiffness: 250,
        damping: 14,
        delay: 0.3 + index * 0.12
      } : {
        duration: 0.5,
        ease: "easeOut",
        delay: 0.3 + index * 0.12
      }}
    />
  );
};

/* ─── Main Component ─────────────────────────────────────────────── */
function DashboardOverview({ onNavigate }) {
  const [stats, setStats] = useState({ totalStudents: 0, totalSubjects: 0, totalClasses: 0, totalTeachers: 0 });
  const [facultyStats, setFacultyStats] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('students');
  const [listCurrentPage, setListCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [isInitialRender, setIsInitialRender] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialRender(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setListCurrentPage(1);
  };

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
      setTeachers(teachersRes.data.filter(t => t.TrangThai === 'Đang dạy'));
      setStudents(allStudentsRes.data.filter(s => s.TrangThai === 'Đang học'));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Set up polling interval for real-time data updates
    const intervalId = setInterval(() => {
      fetchDashboardData();
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const COLORS = [
    '#F4C542', '#152238', '#e5e7eb', '#9ca3af', '#4b5563', '#6b7280'
  ];

  const statCards = [
    { title: 'Sinh viên', value: stats.totalStudents, icon: Users, bgColor: 'bg-[#F4C542]', iconColor: 'text-[#152238]', menuId: 'sinhvien' },
    { title: 'Giảng viên', value: stats.totalTeachers, icon: GraduationCap, bgColor: 'bg-[#152238]', iconColor: 'text-[#F4C542]', menuId: 'giangvien' },
    { title: 'Lớp học', value: stats.totalClasses, icon: Building2, bgColor: 'bg-[#F4C542]', iconColor: 'text-[#152238]', menuId: 'lophoc' },
    { title: 'Môn học', value: stats.totalSubjects, icon: BookOpen, bgColor: 'bg-[#152238]', iconColor: 'text-[#F4C542]', menuId: 'monhoc' },
    { title: 'Khoa', value: facultyStats.length, icon: Building2, bgColor: 'bg-[#F4C542]', iconColor: 'text-[#152238]', menuId: 'khoa' },
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
      .filter(f => f.sinhVien > 0 || f.giangVien > 0 || f.lopHoc > 0)
      .sort((a, b) => b.sinhVien - a.sinhVien)
      .slice(0, 5),
    [facultyStats]);

  // Check which data series have data
  const hasSinhVien = top5ChartData.some(d => d.sinhVien > 0);
  const hasGiangVien = top5ChartData.some(d => d.giangVien > 0);
  const hasLopHoc = top5ChartData.some(d => d.lopHoc > 0);

  // Build legend items dynamically based on available data
  const legendItems = [
    { label: 'Sinh viên', color: 'bg-[#3B82F6]/100', show: hasSinhVien },
    { label: 'Giảng viên', color: 'bg-[#22C55E]/100', show: hasGiangVien },
    { label: 'Lớp học', color: 'bg-yellow-400', show: hasLopHoc },
  ].filter(item => item.show);

  const currentList = activeTab === 'students' ? students : teachers;
  const totalPages = Math.ceil(currentList.length / itemsPerPage);
  const currentStudents = students.slice((listCurrentPage - 1) * itemsPerPage, listCurrentPage * itemsPerPage);
  const currentTeachers = teachers.slice((listCurrentPage - 1) * itemsPerPage, listCurrentPage * itemsPerPage);

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
        <div className="relative bg-[#F4C542] rounded-2xl p-6 px-8 shadow-sm flex items-center justify-between overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-black rounded-full -translate-y-1/2 translate-x-1/2" />
          </div>
          <div className="relative z-10">
            <h2 className="text-base sm:text-xl md:text-2xl font-extrabold text-black mb-1 tracking-tight">NhatTin University — Tổng quan hệ thống</h2>
          </div>
        </div>
      </motion.div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {statCards.map((stat, i) => (
          <StatCard key={stat.title} stat={stat} index={i} onNavigate={onNavigate} />
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Bar Chart */}
        <motion.div variants={fadeUp} custom={1}
          className="bg-[#FFFFFF] rounded-2xl p-6 shadow-sm border border-[#E5E7EB]"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#1F2937]">Thống kê theo khoa</h3>
                <p className="text-xs text-gray-400">Top 5 khoa nhiều sinh viên nhất</p>
              </div>
            </div>
            <div className="flex gap-4 text-xs font-medium text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#F4C542]" /> Sinh viên</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#152238]" /> Giảng viên</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#8697A6]" /> Lớp học</span>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%" debounce={10}>
              <BarChart data={top5ChartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  axisLine={{ stroke: '#f3f4f6' }}
                  tickLine={false}
                  interval={0}
                  tickFormatter={v => v.length > 10 ? v.slice(0, 10) + '…' : v}
                />
                <YAxis tick={false} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(28,28,30,0.04)' }} />
                <Bar dataKey="lopHoc" stackId="a" fill="#8697A6" name="Lớp học" shape={<BouncyBarSegment isBouncy={false} isInitialRender={isInitialRender} />} isAnimationActive={false} barSize={40} />
                <Bar dataKey="giangVien" stackId="a" fill="#152238" name="Giảng viên" shape={<BouncyBarSegment isBouncy={false} isInitialRender={isInitialRender} />} isAnimationActive={false} />
                <Bar dataKey="sinhVien" stackId="a" fill="#F4C542" name="Sinh viên" radius={[8, 8, 0, 0]} shape={<BouncyBarSegment isBouncy={true} isInitialRender={isInitialRender} />} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Pie Chart */}
        <motion.div variants={fadeUp} custom={2}
          className="bg-[#FFFFFF] rounded-2xl p-6 shadow-sm border border-[#E5E7EB]"
        >
          <div className="flex items-center gap-3 mb-5">
            <div>
              <h3 className="text-sm font-bold text-[#1F2937]">Sinh viên theo khoa</h3>

            </div>
          </div>

          <div className="flex h-72 gap-4">
            {/* Pie */}
            <div className="w-[45%] relative">
              <motion.div 
                className="w-full h-full"
                initial={isInitialRender ? { scale: 0, rotate: -120 } : { scale: 1, rotate: 0 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 150, damping: 14, delay: 0.3 }}
              >
                <ResponsiveContainer width="100%" height="100%" debounce={10}>
                  <PieChart>
                    <Pie
                      data={facultyStudentData}
                      cx="50%" cy="50%"
                      outerRadius={90} innerRadius={55}
                      dataKey="value"
                      labelLine={false}
                      isAnimationActive={false}
                      stroke="none"
                    >
                      {facultyStudentData.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            {/* Legend */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-amber-100">
              {facultyStudentData.map((item, i) => {
                const pct = totalStudents > 0 ? ((item.value / totalStudents) * 100).toFixed(1) : 0;
                return (
                  <motion.div
                    key={i}
                    initial={isInitialRender ? { opacity: 0, x: 12 } : { opacity: 1, x: 0 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.04 }}
                    className="flex items-center gap-2 group"
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] text-[#6B7280] truncate">{item.name}</span>
                        <span className="text-[11px] font-bold text-gray-700 shrink-0">{pct}%</span>
                      </div>
                      <div className="h-1 bg-gray-100 rounded-full mt-0.5 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: item.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.4, delay: 0.2 + i * 0.03, ease: 'easeOut' }}
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
        className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden"
      >
        {/* Table header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-[#1F2937]">Danh sách</h3>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 bg-[#FFF7D6] p-1 rounded-xl border border-[#FFF7D6]">
            {[
              { id: 'students', label: 'Sinh viên' },
              { id: 'teachers', label: 'Giảng viên' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`relative px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors duration-200 ${activeTab === tab.id ? 'text-[#F4C542]' : 'text-[#6B7280] hover:text-gray-700'
                  }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="tab-bg"
                    className="absolute inset-0 bg-[#FFFFFF] rounded-lg shadow-sm"
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
              {/* Mobile: card list */}
              <div className="block sm:hidden">
                {currentStudents.length > 0 ? currentStudents.map((student, i) => (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} key={student.MSSV} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-[#FFF7D6]/40 transition-colors group cursor-pointer">
                    <span className="font-mono text-xs font-semibold text-[#F4C542] bg-[#FFF7D6] px-2 py-1 rounded-lg flex-shrink-0 group-hover:bg-[#F4C542] group-hover:text-white transition-colors">{student.MSSV}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-700 truncate group-hover:text-[#F4C542] transition-colors">{student.HoTen}</p>
                      <p className="text-xs text-[#6B7280]">{student.TenLop || '—'} · {student.GioiTinh || '—'}</p>
                    </div>
                  </motion.div>
                )) : <p className="py-8 text-center text-gray-300 text-sm">Chưa có sinh viên nào</p>}
              </div>
              {/* Desktop: table */}
              <table className="hidden sm:table w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left py-3 px-6 text-xs font-bold text-gray-300 uppercase tracking-wider">MSSV</th>
                    <th className="text-left py-3 px-6 text-xs font-bold text-gray-300 uppercase tracking-wider">Họ tên</th>
                    <th className="text-left py-3 px-6 text-xs font-bold text-gray-300 uppercase tracking-wider">Lớp</th>
                    <th className="text-left py-3 px-6 text-xs font-bold text-gray-300 uppercase tracking-wider">Giới tính</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStudents.length > 0 ? (
                    currentStudents.map((student, i) => (
                      <motion.tr key={student.MSSV} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        className="border-b border-gray-50 hover:bg-[#FFF7D6]/40 transition-colors duration-150 group cursor-pointer">
                        <td className="py-3.5 px-6"><span className="font-mono text-sm font-semibold text-[#F4C542] bg-[#FFF7D6] px-2 py-0.5 rounded-lg group-hover:bg-[#F4C542] group-hover:text-white transition-colors">{student.MSSV}</span></td>
                        <td className="py-3.5 px-6 text-sm font-semibold text-gray-700 group-hover:text-[#F4C542] transition-colors">{student.HoTen}</td>
                        <td className="py-3.5 px-6 text-sm text-[#6B7280]">{student.TenLop || '—'}</td>
                        <td className="py-3.5 px-6">
                          <span className={`inline-flex text-xs px-2.5 py-1 rounded-full font-semibold ${student.GioiTinh === 'Nam' ? 'bg-[#3B82F6]/10 text-[#3B82F6]' : 'bg-pink-50 text-pink-600'}`}>{student.GioiTinh || '—'}</span>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr><td colSpan="4" className="py-12 text-center text-gray-300 text-sm">Chưa có sinh viên nào</td></tr>
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
              {/* Mobile: card list */}
              <div className="block sm:hidden">
                {currentTeachers.length > 0 ? currentTeachers.map((teacher, i) => (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} key={teacher.MaGiangVien} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-[#FFF7D6]/40 transition-colors group cursor-pointer">
                    <span className="font-mono text-xs font-semibold text-[#F4C542] bg-[#FFF7D6] px-2 py-1 rounded-lg flex-shrink-0 group-hover:bg-[#F4C542] group-hover:text-white transition-colors">{teacher.MaGiangVien}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-700 truncate group-hover:text-[#F4C542] transition-colors">{teacher.HoTen}</p>
                      <p className="text-xs text-[#6B7280] truncate">{teacher.TenKhoa || '—'} · {teacher.Email || '—'}</p>
                    </div>
                  </motion.div>
                )) : <p className="py-8 text-center text-gray-300 text-sm">Chưa có giảng viên nào</p>}
              </div>
              {/* Desktop: table */}
              <table className="hidden sm:table w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left py-3 px-6 text-xs font-bold text-gray-300 uppercase tracking-wider">Mã GV</th>
                    <th className="text-left py-3 px-6 text-xs font-bold text-gray-300 uppercase tracking-wider">Họ tên</th>
                    <th className="text-left py-3 px-6 text-xs font-bold text-gray-300 uppercase tracking-wider">Khoa</th>
                    <th className="text-left py-3 px-6 text-xs font-bold text-gray-300 uppercase tracking-wider">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTeachers.length > 0 ? (
                    currentTeachers.map((teacher, i) => (
                      <motion.tr key={teacher.MaGiangVien} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        className="border-b border-gray-50 hover:bg-[#FFF7D6]/40 transition-colors duration-150 group cursor-pointer">
                        <td className="py-3.5 px-6"><span className="font-mono text-sm font-semibold text-[#F4C542] bg-[#FFF7D6] px-2 py-0.5 rounded-lg group-hover:bg-[#F4C542] group-hover:text-white transition-colors">{teacher.MaGiangVien}</span></td>
                        <td className="py-3.5 px-6 text-sm font-semibold text-gray-700 group-hover:text-[#F4C542] transition-colors">{teacher.HoTen}</td>
                        <td className="py-3.5 px-6">
                          <span className="text-xs bg-[#F4C542]/20 text-[#B45309] px-2.5 py-1 rounded-full font-semibold border border-[#FFF7D6]">{teacher.TenKhoa || '—'}</span>
                        </td>
                        <td className="py-3.5 px-6 text-sm text-[#6B7280]">{teacher.Email || '—'}</td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr><td colSpan="4" className="py-12 text-center text-gray-300 text-sm">Chưa có giảng viên nào</td></tr>
                  )}
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination control */}
        {totalPages > 1 && (
          <div className="border-t border-gray-100 bg-gray-50/50">
            <Pagination 
              currentPage={listCurrentPage} 
              totalPages={totalPages} 
              onPageChange={setListCurrentPage} 
            />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default DashboardOverview;
