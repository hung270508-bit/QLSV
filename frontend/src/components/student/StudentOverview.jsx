import { StudentOverviewSkeleton } from '../common/StudentSkeleton';
// npm install recharts lệnh cài thư viện vẽ biểu đồ, lưu ý không xóa nó 
import { useState, useEffect } from 'react';
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
    currentGPA: '0.00'
  });

  const [chartData, setChartData] = useState([]);
  const [thisWeekClasses, setThisWeekClasses] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      const [gradesRes, scheduleRes] = await Promise.all([
        axios.get(`${API_URL}/api/grades/student/${user?.username}`),
        // Đã giữ nguyên API mới của bạn:
        axios.get(`${API_URL}/api/students/${user.id}/schedule`)
      ]);

      const grades = gradesRes.data;
      const schedules = scheduleRes.data;

      // THUẬT TOÁN LỌC TRÙNG LẶP: Lọc bỏ các lịch học bị nhân bản do bấm Lưu nhiều lần
      // THUẬT TOÁN LỌC TRÙNG LẶP CHUẨN: Lọc theo Ngày Học và Ca Học
      const uniqueSchedules = Array.from(new Map(schedules.map(item => [`${item.NgayHoc}_${item.CaHoc}`, item])).values());

      // 1. TÍNH TOÁN DỮ LIỆU ĐIỂM & BIỂU ĐỒ
      const isGraded = (diemChu) => diemChu && diemChu.trim() !== '' && diemChu !== '-';

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
              totalAccumulatedCredits += tinChi;
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

      const currentCumGPA = totalCreditsAttempted > 0 ? (totalGradePointsAttempted / totalCreditsAttempted).toFixed(2) : '0.00';

      setStats({
        tongHocKy: sortedSemesters.length,
        tongTinChi: totalAccumulatedCredits,
        maxGPA: highestSemGPA.toFixed(2),
        currentGPA: currentCumGPA
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

    } catch (error) {
      console.error('Lỗi khi tải dữ liệu tổng quan:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <StudentOverviewSkeleton />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header Bar */}
      <div className="relative bg-[#152238] p-6 px-8 rounded-2xl shadow-sm border border-[#1e2f4c] overflow-hidden flex items-center justify-between">
        <div className="relative z-10">
          <h2 className="text-2xl font-extrabold text-[#F4C542] flex items-center gap-2 mb-1 tracking-tight">
            Xin chào, {user?.hoTen || 'Sinh Viên'}!
          </h2>
        </div>
        <div className="relative z-10 text-right">
          <p className="text-4xl font-extrabold text-[#F4C542]">{stats.currentGPA}</p>
          <p className="text-sm text-gray-300 font-medium tracking-wide uppercase mt-1">GPA tích lũy</p>
        </div>
      </div>

      {/* 4 Thẻ Thống Kê Nhanh */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#FFFFFF] rounded-2xl p-6 shadow-sm border-2 border-[#F4C542] relative overflow-hidden flex flex-col items-center justify-center">
          <h3 className="text-3xl font-extrabold mb-1 text-[#F59E0B]">{stats.currentGPA}</h3>
          <p className="text-[#6B7280] font-bold text-xs uppercase tracking-wide mt-1">GPA tích lũy</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#FFFFFF] rounded-2xl p-6 shadow-sm border border-[#E5E7EB] relative overflow-hidden flex flex-col items-center justify-center">
          <h3 className="text-3xl font-extrabold mb-1 text-black">{stats.tongTinChi}</h3>
          <p className="text-[#6B7280] font-bold text-xs uppercase tracking-wide mt-1">Tín chỉ tích lũy</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#FFFFFF] rounded-2xl p-6 shadow-sm border border-[#E5E7EB] relative overflow-hidden flex flex-col items-center justify-center">
          <h3 className="text-3xl font-extrabold mb-1 text-[#f97316]">82</h3>
          <p className="text-[#6B7280] font-bold text-xs uppercase tracking-wide mt-1">Điểm rèn luyện</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#FFFFFF] rounded-2xl p-6 shadow-sm border border-[#E5E7EB] relative overflow-hidden flex flex-col items-center justify-center">
          <h3 className="text-3xl font-extrabold mb-1 text-black">6</h3>
          <p className="text-[#6B7280] font-bold text-xs uppercase tracking-wide mt-1">Môn học kỳ này</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-[#FFFFFF] p-6 rounded-2xl shadow-sm border border-[#F4C542]/50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-[#1F2937]">Lịch học hôm nay</h3>
              <span className="text-xs text-[#6B7280] font-semibold cursor-pointer hover:text-[#1F2937]">Xem TKB</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-4 border-l-2 border-[#F59E0B] pl-4">
                <div className="flex-1">
                  <h4 className="font-bold text-[#1F2937]">Giải tích 2</h4>
                  <p className="text-xs text-gray-300 mt-0.5">07:00 - 09:15 - Phòng A201 - GV Nguyễn A</p>
                </div>
                <span className="bg-[#F4C542] text-black text-[10px] font-bold px-2 py-1 rounded-full">Sắp tới</span>
              </div>
              <div className="flex items-start gap-4 border-l-2 border-[#152238] pl-4">
                <div className="flex-1">
                  <h4 className="font-bold text-[#1F2937]">Cơ sở dữ liệu</h4>
                  <p className="text-xs text-gray-300 mt-0.5">09:30 - 11:45 - Phòng B305 - GV Trần B</p>
                </div>
                <span className="bg-[#152238] text-[#F4C542] text-[10px] font-bold px-2 py-1 rounded-full">Tiếp theo</span>
              </div>
              <div className="flex items-start gap-4 border-l-2 border-[#F4C542]/30 pl-4 opacity-50">
                <div className="flex-1">
                  <h4 className="font-bold text-[#1F2937]">Mạng máy tính</h4>
                  <p className="text-xs text-gray-300 mt-0.5">13:00 - 15:15 - Phòng C102 - GV Lê C</p>
                </div>
                <span className="bg-gray-100 text-[#6B7280] text-[10px] font-bold px-2 py-1 rounded-full">Chiều</span>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-[#FFFFFF] p-6 rounded-2xl shadow-sm border border-[#E5E7EB]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-[#1F2937]">Thông báo mới</h3>
              <span className="text-xs text-[#6B7280] font-semibold cursor-pointer hover:text-[#1F2937]">Tất cả (3)</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F59E0B] shrink-0"></div>
                <div>
                  <h4 className="text-sm font-bold text-[#1F2937]">Hạn đăng ký học phần HK2 còn 3 ngày</h4>
                  <p className="text-xs text-gray-300">Quan trọng - 2 giờ trước</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#152238] shrink-0"></div>
                <div>
                  <h4 className="text-sm font-bold text-[#1F2937]">Điểm môn Giải tích đã được công bố</h4>
                  <p className="text-xs text-gray-300">Kết quả - Hôm qua</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#fefce8] border border-[#F4C542] shrink-0"></div>
                <div>
                  <h4 className="text-sm font-bold text-[#1F2937]">Yêu cầu xác nhận sinh viên đã duyệt</h4>
                  <p className="text-xs text-gray-300">Xong - 3 ngày trước</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-[#FFFFFF] p-6 rounded-2xl shadow-sm border border-[#E5E7EB]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-[#1F2937]">Kết quả gần nhất</h3>
              <span className="text-xs text-[#6B7280] font-semibold cursor-pointer hover:text-[#1F2937]">Xem toàn bộ</span>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F59E0B] shrink-0"></div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1F2937]">Giải tích 1</h4>
                    <p className="text-xs text-gray-300">3 tín chỉ</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#F59E0B] flex items-center justify-center text-white font-bold text-sm">A</div>
              </div>
              <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#152238] shrink-0"></div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1F2937]">Lập trình C</h4>
                    <p className="text-xs text-gray-300">3 tín chỉ</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#F4C542] flex items-center justify-center text-black font-bold text-sm">A</div>
              </div>
              <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#4b5563] shrink-0"></div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1F2937]">Kiến trúc máy tính</h4>
                    <p className="text-xs text-gray-300">2 tín chỉ</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-sm">B+</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F59E0B] shrink-0"></div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1F2937]">Mạng máy tính</h4>
                    <p className="text-xs text-gray-300">3 tín chỉ</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#F4C542] flex items-center justify-center text-black font-bold text-sm">A+</div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="bg-[#FFFFFF] p-6 rounded-2xl shadow-sm border border-[#E5E7EB] flex flex-col h-[280px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-[#1F2937]">Yêu cầu của tôi</h3>
              <span className="text-xs text-[#6B7280] font-semibold cursor-pointer hover:text-[#1F2937]">Xem tất cả</span>
            </div>
            <div className="space-y-4 flex-1">
              <div className="flex items-start justify-between border border-[#E5E7EB] rounded-xl p-3 bg-[#F7F8FA]/50">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E]/100 mt-1.5"></div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1F2937]">Xác nhận sinh viên đang học</h4>
                    <p className="text-xs text-gray-300 mt-0.5">Xong - 3 ngày trước</p>
                  </div>
                </div>
                <span className="bg-[#22C55E]/20 text-green-700 text-[10px] font-bold px-2 py-1 rounded-lg border border-green-200">Xong</span>
              </div>
              <div className="flex items-start justify-between border border-[#E5E7EB] rounded-xl p-3 bg-[#F7F8FA]/50">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] mt-1.5"></div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1F2937]">Phúc khảo điểm CSDL</h4>
                    <p className="text-xs text-gray-300 mt-0.5">Đang xử lý - Hôm qua</p>
                  </div>
                </div>
                <span className="bg-[#fefce8] text-[#F59E0B] text-[10px] font-bold px-2 py-1 rounded-lg border border-[#F4C542]">Đang xử lý</span>
              </div>
            </div>
            <button className="w-full mt-4 py-2.5 bg-[#F59E0B] hover:bg-[#F4C542] text-black font-bold rounded-xl transition-colors">
              Tạo yêu cầu mới
            </button>
          </motion.div>
        </div>

      </div>
    </div>
  );
}

export default StudentOverview;
