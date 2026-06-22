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
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-blue-100 shadow-2xl p-4 min-w-[200px]">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
        <div className="space-y-2">
          {payload.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color || p.stroke }} />
              <span className="text-xs text-gray-600">{p.name}</span>
              <span className="ml-auto text-xs font-bold text-gray-800">
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
      startOfWeek.setHours(0,0,0,0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23,59,59,999);

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
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-orange-500" /> Biểu đồ kết quả học tập
        </h2>
        <button onClick={fetchDashboardData} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* CỘT TRÁI: THỐNG KÊ VÀ BIỂU ĐỒ (Chiếm 3 phần) */}
        <div className="xl:col-span-3 space-y-6">
          
          {/* 4 Thẻ Thống Kê Nhanh */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-blue-500 text-white rounded-2xl p-5 shadow-lg shadow-blue-200 relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-4xl font-bold mb-1">{stats.tongHocKy}</h3>
                <p className="text-blue-100 font-medium text-sm">Tổng học kỳ</p>
              </div>
              <CalendarDays className="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-20" />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-orange-500 text-white rounded-2xl p-5 shadow-lg shadow-orange-200 relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-4xl font-bold mb-1">{stats.tongTinChi}</h3>
                <p className="text-orange-100 font-medium text-sm">Tổng tín chỉ tích lũy</p>
              </div>
              <Award className="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-20" />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-cyan-500 text-white rounded-2xl p-5 shadow-lg shadow-cyan-200 relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-4xl font-bold mb-1">{stats.maxGPA}</h3>
                <p className="text-cyan-100 font-medium text-sm">GPA cao nhất</p>
              </div>
              <TrendingUp className="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-20" />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-emerald-500 text-white rounded-2xl p-5 shadow-lg shadow-emerald-200 relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-4xl font-bold mb-1">{stats.currentGPA}</h3>
                <p className="text-emerald-100 font-medium text-sm">GPA hiện tại</p>
              </div>
              <BookCheck className="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-20" />
            </motion.div>
          </div>

          {/* Vùng Biểu đồ Recharts */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            {chartData.length > 0 ? (
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6B7280', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      yAxisId="left" 
                      domain={[0, 4]} 
                      ticks={[0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0]}
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      label={{ value: 'Điểm (Hệ 4)', angle: -90, position: 'insideLeft', fill: '#4B5563', fontWeight: 'bold' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="top" 
                      height={50}
                      iconType="circle"
                      formatter={(value) => <span className="text-gray-600 font-medium ml-1">{value}</span>}
                    />
                    
                    <Bar 
                      yAxisId="left" 
                      dataKey="semGPA" 
                      name="Điểm TB học kỳ (hệ 4)" 
                      fill="#60A5FA" 
                      radius={[4, 4, 0, 0]} 
                      barSize={40}
                    />
                    
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="cumGPA" 
                      name="Điểm TB tích lũy (hệ 4)" 
                      stroke="#F97316" 
                      strokeWidth={3}
                      dot={{ r: 6, fill: '#F97316', stroke: '#FFF', strokeWidth: 2 }}
                      activeDot={{ r: 8 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[400px] flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <TrendingUp className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">Chưa có đủ dữ liệu điểm để vẽ biểu đồ.</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* CỘT PHẢI: CẦN LƯU Ý (Chiếm 1 phần) */}
        <div className="xl:col-span-1">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-lg">Cần lưu ý</h3>
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </div>
            
            <div className="p-3">
              {/* Lịch học trong tuần */}
              <button 
                onClick={() => setActiveMenu && setActiveMenu('lichhoc')}
                className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-orange-50 transition-colors group mb-2"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-gray-700">Lịch học trong tuần</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-gray-800">{thisWeekClasses}</span>
                  {/* Đã cập nhật thành 'ca học' */}
                  <span className="text-xs text-gray-500">ca học</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors ml-1" />
                </div>
              </button>

              {/* Lịch thi trong tuần (Dữ liệu tĩnh chờ nâng cấp sau) */}
              <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-orange-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center group-hover:bg-rose-200 transition-colors">
                    <CalendarCheck2 className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-gray-700">Lịch thi trong tuần</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-gray-800">0</span>
                  <span className="text-xs text-gray-500">môn thi</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors ml-1" />
                </div>
              </button>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}

export default StudentOverview;
