import { StudentOverviewSkeleton } from '../common/StudentSkeleton';
// npm install recharts lệnh cài thư viện vẽ biểu đồ, lưu ý không xóa nó 
import React, { useState, useEffect, useCallback } from 'react';
import API_URL from '../../api';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  BookOpen,
  ChevronRight,
  RefreshCw,
  Award,
  TrendingUp,
  BookCheck,
  CalendarCheck2
} from 'lucide-react';
import axios from 'axios';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

// Custom Tooltip cho Biểu đồ
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#FFFFFF]/95 backdrop-blur-sm rounded-2xl border border-blue-100 shadow-2xl p-4 min-w-[200px]">
        <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">{label}</p>
        <div className="space-y-2">
          {payload.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color || p.stroke }} />
              <span className="text-xs text-[#6B7280]">{p.name}</span>
              <span className="ml-auto text-xs font-bold text-[#1F2937]">
                {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

function StudentOverview({ user, setActiveMenu }) {
  const [loading, setLoading] = useState(true);

  // States cho các chỉ số
  const [stats, setStats] = useState({
    tongHocKy: 0,
    tongTinChi: 0,
    maxGPA: '0.00',
    currentGPA: '0.00',
    tinChiYeuCau: 120
  });

  const [chartData, setChartData] = useState([]);
  const [thisWeekClasses, setThisWeekClasses] = useState(0);

  // States dữ liệu thực
  const [trainingPoints, setTrainingPoints] = useState(0);
  const [todayClasses, setTodayClasses] = useState([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [recentGrades, setRecentGrades] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [gradesRes, scheduleRes, pointsRes, announcementsRes, supportRes, detailsRes] = await Promise.all([
        axios.get(`${API_URL}/api/grades/student/${user?.username}`),
        axios.get(`${API_URL}/api/students/${user.id}/schedule`),
        axios.get(`${API_URL}/api/training-points/student/${user?.username}`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/announcements/student/${user?.username}`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/support/student/${user?.username}`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/students/${user?.username}/details`).catch(() => ({ data: [] }))
      ]);

      const grades = gradesRes.data;
      const schedules = scheduleRes.data;
      const pointsData = pointsRes.data || [];
      const announcementsData = announcementsRes.data || [];
      const supportData = supportRes.data || [];
      
      const studentDetails = detailsRes.data && detailsRes.data.length > 0 ? detailsRes.data[0] : {};
      const requiredCredits = studentDetails.TinChiYeuCau || 120;

      setRecentRequests(supportData.slice(0, 2));
      setRecentAnnouncements(announcementsData.slice(0, 3));
      
      const latestPoint = pointsData.length > 0 ? (parseInt(pointsData[0].TongDiem) || 0) : 0;
      setTrainingPoints(latestPoint);

      // THUẬT TOÁN LỌC TRÙNG LẶP: Lọc bỏ các lịch học bị nhân bản do bấm Lưu nhiều lần
      // THUẬT TOÁN LỌC TRÙNG LẶP CHUẨN: Lọc theo Ngày Học và Ca Học
      const uniqueSchedules = Array.from(new Map(schedules.map(item => [`${item.NgayHoc}_${item.CaHoc}`, item])).values());

      // 1. TÍNH TOÁN DỮ LIỆU ĐIỂM & BIỂU ĐỒ
      const isGraded = (diemChu) => diemChu && diemChu.trim() !== '' && diemChu !== '-';

      const validGrades = grades.filter(g => isGraded(g.DiemChu));
      setRecentGrades([...validGrades].reverse().slice(0, 4));

      const groupedGrades = {};
      grades.forEach(g => {
        const hk = g.HocKy || 'Chưa xác định';
        if (!groupedGrades[hk]) groupedGrades[hk] = [];
        groupedGrades[hk].push(g);
      });

      const sortedSemesters = Object.keys(groupedGrades).sort();

      let totalAccumulatedCredits = 0;
      let totalGradePointsAttempted = 0;
      let totalCreditsAttempted = 0;
      let highestSemGPA = 0;

      const processedChartData = [];
      const passedSubjects = new Set();

      sortedSemesters.forEach(hk => {
        let semAttemptedCredits = 0;
        let semGradePoints = 0;

        groupedGrades[hk].forEach(grade => {
          // BỎ QUA CÁC MÔN CHƯA CÓ ĐIỂM CHỮ
          if (isGraded(grade.DiemChu)) {
            const tinChi = parseInt(grade.SoTinChi) || 0;
            const gpa = parseFloat(grade.DiemGPA) || 0;

            semAttemptedCredits += tinChi;
            semGradePoints += gpa * tinChi;

            totalCreditsAttempted += tinChi;
            totalGradePointsAttempted += gpa * tinChi;

            if (grade.DiemChu !== 'F' && grade.DiemChu !== 'F+') {
              if (!passedSubjects.has(grade.MaMonHoc)) {
                totalAccumulatedCredits += tinChi;
                passedSubjects.add(grade.MaMonHoc);
              }
            }
          }
        });

        // Chỉ tính GPA khi có môn đã chấm điểm
        const semGPA = semAttemptedCredits > 0 ? (semGradePoints / semAttemptedCredits).toFixed(2) : '0.00';
        if (parseFloat(semGPA) > highestSemGPA) highestSemGPA = parseFloat(semGPA);

        const cumGPA = totalCreditsAttempted > 0 ? (totalGradePointsAttempted / totalCreditsAttempted).toFixed(2) : '0.00';

        processedChartData.push({
          name: hk.replace('_', ' ').replace('_', '-'),
          semGPA: parseFloat(semGPA),
          cumGPA: parseFloat(cumGPA)
        });
      });

      const finalGPA = totalCreditsAttempted > 0 ? (totalGradePointsAttempted / totalCreditsAttempted).toFixed(2) : '0.00';

      setChartData(processedChartData);

      setStats({
        tongHocKy: sortedSemesters.length,
        tongTinChi: totalAccumulatedCredits,
        maxGPA: highestSemGPA.toFixed(2),
        currentGPA: finalGPA,
        tinChiYeuCau: requiredCredits
      });

      setChartData(processedChartData);

      // 2. TÍNH LỊCH HỌC TRONG TUẦN NÀY (Sử dụng uniqueSchedules đã được lọc sạch)
      const today = new Date();
      const currentDay = today.getDay();
      const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
      const startOfWeek = new Date(today.setDate(diff));
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      // SỬ DỤNG uniqueSchedules ở đây
      const classesInWeek = uniqueSchedules.filter(item => {
        const classDate = new Date(item.NgayHoc);
        return classDate >= startOfWeek && classDate <= endOfWeek;
      });

      setThisWeekClasses(classesInWeek.length);

      const todayDate = new Date();
      todayDate.setHours(0,0,0,0);
      const todayEnd = new Date();
      todayEnd.setHours(23,59,59,999);
      
      const classesToday = uniqueSchedules.filter(item => {
        const classDate = new Date(item.NgayHoc);
        return classDate >= todayDate && classDate <= todayEnd;
      });
      classesToday.sort((a,b) => {
        const caA = String(a.CaHoc || '').includes('Sáng') ? 1 : String(a.CaHoc || '').includes('Chiều') ? 2 : 3;
        const caB = String(b.CaHoc || '').includes('Sáng') ? 1 : String(b.CaHoc || '').includes('Chiều') ? 2 : 3;
        return caA - caB;
      });
      setTodayClasses(classesToday);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return <StudentOverviewSkeleton />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header Bar */}
      <div className="relative bg-[#152238] p-5 sm:p-6 px-6 sm:px-8 rounded-2xl shadow-sm border border-[#1e2f4c] overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative z-10 w-full sm:w-auto">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#F4C542] flex items-center gap-2 mb-1 tracking-tight break-words">
            Xin chào, {user?.hoTen || 'Sinh Viên'}!
          </h2>
        </div>
        <div className="relative z-10 text-left sm:text-right">
          <p className="text-3xl sm:text-4xl font-extrabold text-[#F4C542]">{stats.currentGPA}</p>
          <p className="text-xs sm:text-sm text-gray-300 font-medium tracking-wide uppercase mt-1">GPA tích lũy</p>
        </div>
      </div>

      {/* 4 Thẻ Thống Kê Nhanh */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <motion.div onClick={() => setActiveMenu('xemdiem')} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#FFFFFF] rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border-2 border-[#F4C542] relative overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:bg-[#F4C542]/5 transition-colors">
          <h3 className="text-2xl sm:text-3xl font-extrabold mb-1 text-[#F59E0B]">{stats.currentGPA}</h3>
          <p className="text-[#6B7280] font-bold text-[10px] sm:text-xs uppercase tracking-wide mt-1 text-center">GPA tích lũy</p>
        </motion.div>

        <motion.div onClick={() => setActiveMenu('xemdiem')} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#FFFFFF] rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-[#E5E7EB] relative overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors w-full">
          <h3 className="text-2xl sm:text-3xl font-extrabold mb-1 text-black">{stats.tongTinChi}<span className="text-sm text-gray-400 font-medium tracking-normal ml-1">/{stats.tinChiYeuCau}</span></h3>
          <p className="text-[#6B7280] font-bold text-[10px] sm:text-xs uppercase tracking-wide mt-1 text-center">Tín chỉ tích lũy</p>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-amber-500 h-1.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min((stats.tongTinChi / (stats.tinChiYeuCau || 120)) * 100, 100)}%` }}></div>
          </div>
        </motion.div>

        <motion.div onClick={() => setActiveMenu('renluyen')} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#FFFFFF] rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-[#E5E7EB] relative overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
          <h3 className="text-2xl sm:text-3xl font-extrabold mb-1 text-[#f97316]">{trainingPoints || 0}</h3>
          <p className="text-[#6B7280] font-bold text-[10px] sm:text-xs uppercase tracking-wide mt-1 text-center">Điểm rèn luyện</p>
        </motion.div>

        <motion.div onClick={() => setActiveMenu('lichhoc')} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#FFFFFF] rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-[#E5E7EB] relative overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
          <h3 className="text-2xl sm:text-3xl font-extrabold mb-1 text-black">{thisWeekClasses || 0}</h3>
          <p className="text-[#6B7280] font-bold text-[10px] sm:text-xs uppercase tracking-wide mt-1 text-center">Lớp học tuần này</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-[#FFFFFF] p-6 rounded-2xl shadow-sm border border-[#F4C542]/50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-[#1F2937]">Lịch học hôm nay</h3>
              <span onClick={() => setActiveMenu('lichhoc')} className="text-xs text-[#6B7280] font-semibold cursor-pointer hover:text-[#1F2937]">Xem TKB</span>
            </div>
            <div className="space-y-4">
              {todayClasses.length > 0 ? todayClasses.map((c, i) => (
                <div key={i} className={`flex items-start gap-4 border-l-2 pl-4 ${i === 0 ? 'border-[#F59E0B]' : 'border-[#152238]'}`}>
                  <div className="flex-1">
                    <h4 className="font-bold text-[#1F2937]">{c.TenMonHoc}</h4>
                    <p className="text-xs text-gray-600 mt-0.5">{c.ThoiGian} - Phòng {c.PhongHoc} - GV {c.TenGiangVien}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${i === 0 ? 'bg-[#F4C542] text-black' : 'bg-[#152238] text-[#F4C542]'}`}>{c.CaHoc}</span>
                </div>
              )) : (
                <p className="text-sm text-gray-400 font-medium">Hôm nay không có lịch học.</p>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-[#FFFFFF] p-6 rounded-2xl shadow-sm border border-[#E5E7EB]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-[#1F2937]">Thông báo mới</h3>
              <span onClick={() => setActiveMenu('thongbao')} className="text-xs text-[#6B7280] font-semibold cursor-pointer hover:text-[#1F2937]">Tất cả ({recentAnnouncements.length})</span>
            </div>
            <div className="space-y-4">
              {recentAnnouncements.length > 0 ? recentAnnouncements.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${i === 0 ? 'bg-[#F59E0B]' : i === 1 ? 'bg-[#152238]' : 'bg-gray-200'}`}></div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-[#1F2937] truncate">{a.TieuDe}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{a.NoiDung ? a.NoiDung.substring(0, 40) + '...' : ''} - {new Date(a.NgayDang || a.NgayTao).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-gray-400 font-medium">Không có thông báo mới.</p>
              )}
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-[#FFFFFF] p-6 rounded-2xl shadow-sm border border-[#E5E7EB]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-[#1F2937]">Kết quả gần nhất</h3>
              <span onClick={() => setActiveMenu('xemdiem')} className="text-xs text-[#6B7280] font-semibold cursor-pointer hover:text-[#1F2937]">Xem toàn bộ</span>
            </div>
            <div className="space-y-4">
              {recentGrades.length > 0 ? recentGrades.map((g, i) => (
                <div key={i} className="flex justify-between items-center border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg shrink-0 ${i % 2 === 0 ? 'bg-[#F59E0B]' : 'bg-[#152238]'}`}></div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1F2937]">{g.TenMonHoc}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">{g.SoTinChi} tín chỉ - HK {g.HocKy}</p>
                    </div>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    g.DiemChu === 'A' || g.DiemChu === 'A+' ? 'bg-[#F4C542] text-black' :
                    g.DiemChu === 'F' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-700'
                  }`}>{g.DiemChu}</div>
                </div>
              )) : (
                <p className="text-sm text-gray-400 font-medium">Chưa có kết quả.</p>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="bg-[#FFFFFF] p-6 rounded-2xl shadow-sm border border-[#E5E7EB]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-[#1F2937]">Yêu cầu của tôi</h3>
              <span onClick={() => setActiveMenu('hotro')} className="text-xs text-[#6B7280] font-semibold cursor-pointer hover:text-[#1F2937]">Xem tất cả</span>
            </div>
            <div className="space-y-4">
              {recentRequests.length > 0 ? recentRequests.map((r, i) => (
                <div key={i} className="flex items-start gap-3 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                  <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${r.TrangThai === 'Đã giải quyết' ? 'bg-green-500' : 'bg-[#F59E0B]'}`}></div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-[#1F2937]">{r.LoaiYeuCau}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{r.TrangThai} - {new Date(r.NgayGui || r.NgayTao).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                    r.TrangThai === 'Đã giải quyết' ? 'bg-green-100 text-green-700' : 'bg-[#FFF7D6] text-[#F59E0B]'
                  }`}>{r.TrangThai}</span>
                </div>
              )) : (
                <p className="text-sm text-gray-400 font-medium">Chưa có yêu cầu nào.</p>
              )}
              
              <button onClick={() => setActiveMenu('hotro')} className="w-full mt-2 bg-[#F4C542] hover:bg-[#F59E0B] text-black font-bold py-2 rounded-xl text-sm transition-colors shadow-sm">
                Tạo yêu cầu mới
              </button>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}

export default StudentOverview;
