import React, { useState, useEffect } from 'react';
import API_URL from '../../api';
import { motion } from 'framer-motion';
import { 
  BookOpen, Users, Calendar, TrendingUp, 
  Clock, MapPin, ChevronRight, Loader2 
} from 'lucide-react';
import axios from 'axios';

// Lưu ý: Đảm bảo prop 'setActiveMenu' được truyền từ TeacherDashboard sang OverviewSection
// Ví dụ ở TeacherDashboard: <OverviewSection user={user} setActiveMenu={setActiveMenu} />

function OverviewSection({ user, setActiveMenu }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    courses: [],
    todaySchedules: [],
    totalSchedules: 0,
    totalStudents: 0,
    totalSubjects: 0
  });

  useEffect(() => {
    const fetchOverviewData = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        
        // 1. Lấy danh sách lớp HP và Lịch dạy
        const [coursesRes, schedulesRes] = await Promise.all([
          axios.get(`${API_URL}/api/course-sections/teacher/${user.id}`),
          axios.get(`${API_URL}/api/teachers/${user.id}/teaching-schedule`)
        ]);

        const courses = coursesRes.data;
        const schedules = schedulesRes.data;

        // 2. Lọc lịch dạy hôm nay
        const today = new Date();
        const todaySchedules = schedules.filter(s => {
          if (!s.NgayHoc) return false;
          const d = new Date(s.NgayHoc);
          return d.getDate() === today.getDate() && 
                 d.getMonth() === today.getMonth() && 
                 d.getFullYear() === today.getFullYear();
        });

        // 3. Tính tổng số sinh viên duy nhất đang dạy (Gọi API lấy SV cho từng lớp HP)
        const studentPromises = courses.map(c => 
          axios.get(`${API_URL}/api/course-sections/${c.MaLopHocPhan}/students`).catch(() => ({ data: [] }))
        );
        const studentsResponses = await Promise.all(studentPromises);
        const uniqueStudents = new Set();
        studentsResponses.forEach(res => {
          res.data.forEach(student => uniqueStudents.add(student.MSSV));
        });

        setData({
          courses: courses,
          todaySchedules: todaySchedules,
          totalSchedules: schedules.length,
          totalStudents: uniqueStudents.size,
          totalSubjects: new Set(courses.map(c => c.MaMonHoc)).size
        });

      } catch (error) {
        console.error("Lỗi tải dữ liệu tổng quan:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOverviewData();
  }, [user]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-[#F4C542]">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-medium text-lg">Đang tải dữ liệu tổng quan...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* HEADER */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-[#152238] rounded-3xl p-8 px-10 text-white shadow-sm border border-[#1e2f4c] relative overflow-hidden"
      >
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-extrabold mb-2 text-[#F4C542]">Xin chào, {user?.hoTen || 'Trần Văn Minh'}!</h2>
          </div>
          <div className="text-right">
            <p className="text-5xl font-extrabold text-[#F4C542]">{data.todaySchedules.length}</p>
            <p className="text-gray-300 font-bold uppercase tracking-widest text-sm mt-2">Ca dạy hôm nay</p>
          </div>
        </div>
      </motion.div>

      {/* 4 CARDS THỐNG KÊ (CÓ THỂ CLICK ĐỂ CHUYỂN TRANG) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          onClick={() => setActiveMenu && setActiveMenu('lichgiangday')}
          className="bg-[#FFFFFF] rounded-2xl p-6 shadow-sm border-2 border-[#F4C542] cursor-pointer relative overflow-hidden flex flex-col items-center justify-center h-32"
        >
          <h3 className="text-4xl font-extrabold mb-2 text-[#F59E0B]">{data.totalSubjects}</h3>
          <p className="text-[#6B7280] font-bold text-xs uppercase tracking-wide">Môn giảng dạy</p>
        </motion.div>

        <motion.div 
          onClick={() => setActiveMenu && setActiveMenu('sinhvien')}
          className="bg-[#FFFFFF] rounded-2xl p-6 shadow-sm border border-[#E5E7EB] cursor-pointer relative overflow-hidden flex flex-col items-center justify-center h-32"
        >
          <h3 className="text-4xl font-extrabold mb-2 text-black">{data.totalStudents}</h3>
          <p className="text-[#6B7280] font-bold text-xs uppercase tracking-wide">Tổng sinh viên</p>
        </motion.div>

        <motion.div 
          onClick={() => setActiveMenu && setActiveMenu('diemdanh')}
          className="bg-[#FFFFFF] rounded-2xl p-6 shadow-sm border border-[#E5E7EB] cursor-pointer relative overflow-hidden flex flex-col items-center justify-center h-32"
        >
          <h3 className="text-4xl font-extrabold mb-2 text-[#f97316]">{data.todaySchedules.length}</h3>
          <p className="text-[#6B7280] font-bold text-xs uppercase tracking-wide">Lịch hôm nay</p>
        </motion.div>

        <motion.div 
          onClick={() => setActiveMenu && setActiveMenu('lichgiangday')}
          className="bg-[#FFFFFF] rounded-2xl p-6 shadow-sm border border-[#E5E7EB] cursor-pointer relative overflow-hidden flex flex-col items-center justify-center h-32"
        >
          <h3 className="text-4xl font-extrabold mb-2 text-black">{data.totalSchedules}</h3>
          <p className="text-[#6B7280] font-bold text-xs uppercase tracking-wide">Tổng ca dạy</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LỊCH DẠY HÔM NAY */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#FFFFFF] rounded-3xl shadow-sm border border-[#E5E7EB] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[#E5E7EB] flex justify-between items-center bg-[#F7F8FA]/50">
            <h3 className="text-lg font-bold text-[#1F2937] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#F59E0B]" /> Lịch dạy hôm nay
            </h3>
            <span className="text-sm font-bold text-black bg-[#F4C542] px-3 py-1 rounded-lg">
              {formatDate(new Date().toISOString())}
            </span>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
            {data.todaySchedules.length > 0 ? (
              <div className="space-y-4">
                {data.todaySchedules.map((schedule, idx) => (
                  <div key={idx} onClick={() => setActiveMenu && setActiveMenu('diemdanh')} className="border-l-4 border-[#F4C542] border-y border-r border-[#E5E7EB] rounded-r-2xl p-5 hover:border-[#E5E7EB] hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-[#1F2937] text-lg group-hover:text-black transition-colors">{schedule.TenMonHoc}</h4>
                        <p className="text-sm text-[#6B7280] font-medium mt-1">Lớp: {schedule.TenLop} • Mã LHP: {schedule.MaLopHocPhan}</p>
                      </div>
                      <div className="bg-[#152238] text-[#F4C542] font-bold px-3 py-1.5 rounded-xl border border-[#1e2f4c] flex flex-col items-center shrink-0">
                        <span className="text-xs">Ca</span>
                        <span className="text-lg leading-none">{schedule.CaHoc || '-'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm font-medium text-[#6B7280]">
                      <span className="flex items-center gap-1.5 bg-[#F7F8FA] px-2.5 py-1 rounded-lg"><MapPin className="w-4 h-4 text-gray-300" /> Phòng: {schedule.PhongHoc || 'Chưa xếp'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-300 py-10">
                <Calendar className="w-16 h-16 mb-3 opacity-20" />
                <p className="font-medium text-[#6B7280]">Hôm nay bạn không có lịch dạy nào.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* DANH SÁCH LỚP GIẢNG DẠY */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#FFFFFF] rounded-3xl shadow-sm border border-[#E5E7EB] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[#E5E7EB] flex justify-between items-center bg-[#F7F8FA]/50">
            <h3 className="text-lg font-bold text-[#1F2937] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#1F2937]" /> Lớp đang giảng dạy
            </h3>
            <button onClick={() => setActiveMenu && setActiveMenu('lichgiangday')} className="text-sm font-bold text-[#6B7280] hover:text-black flex items-center gap-1 transition-colors">
              Xem tất cả <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
            {data.courses.length > 0 ? (
              <div className="space-y-4">
                {data.courses.slice(0, 5).map((course, idx) => (
                  <div key={idx} onClick={() => setActiveMenu && setActiveMenu('sinhvien')} className="flex items-center justify-between p-4 rounded-2xl bg-[#F7F8FA] hover:bg-[#F4C542]/10 transition-colors border border-transparent hover:border-[#F4C542]/30 cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#152238] shadow-sm flex items-center justify-center text-[#F4C542] font-bold shrink-0">
                        {course.TenMonHoc ? course.TenMonHoc.charAt(0) : 'M'}
                      </div>
                      <div>
                        <h4 className="font-bold text-[#1F2937] group-hover:text-black transition-colors">{course.TenMonHoc}</h4>
                        <p className="text-xs text-[#6B7280] font-medium mt-0.5">Mã LHP: {course.MaLopHocPhan} • Tín chỉ: {course.SoTinChi}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#F59E0B]" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-300 py-10">
                <BookOpen className="w-16 h-16 mb-3 opacity-20" />
                <p className="font-medium text-[#6B7280]">Bạn chưa được phân công giảng dạy lớp nào.</p>
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}

export default OverviewSection;
