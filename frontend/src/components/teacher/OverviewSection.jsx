import React, { useState, useEffect } from 'react';
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
    totalStudents: 0
  });

  useEffect(() => {
    const fetchOverviewData = async () => {
      if (!user?.username) return;
      try {
        setLoading(true);
        
        // 1. Lấy danh sách lớp HP và Lịch dạy
        const [coursesRes, schedulesRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/course-sections/teacher/${user.username}`),
          axios.get(`http://localhost:5000/api/teachers/${user.username}/teaching-schedule`)
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
          axios.get(`http://localhost:5000/api/course-sections/${c.MaLopHocPhan}/students`).catch(() => ({ data: [] }))
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
          totalStudents: uniqueStudents.size
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
      <div className="flex flex-col items-center justify-center h-[70vh] text-orange-500">
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
        className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden"
      >
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Tổng quan giảng dạy</h2>
          <p className="text-orange-100 text-lg">Xem thông tin giảng dạy và thống kê nhanh</p>
        </div>
        <TrendingUp className="absolute -right-4 -bottom-4 w-40 h-40 text-white opacity-10 transform -rotate-12" />
      </motion.div>

      {/* 4 CARDS THỐNG KÊ (CÓ THỂ CLICK ĐỂ CHUYỂN TRANG) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          whileHover={{ y: -5, scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setActiveMenu && setActiveMenu('lichgiangday')}
          className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-orange-200 transition-all flex items-center gap-5"
        >
          <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center shrink-0">
            <BookOpen className="w-8 h-8 text-orange-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Lớp giảng dạy</p>
            <h3 className="text-3xl font-black text-gray-800">{data.courses.length}</h3>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5, scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setActiveMenu && setActiveMenu('sinhvien')}
          className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all flex items-center gap-5"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
            <Users className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Sinh viên</p>
            <h3 className="text-3xl font-black text-gray-800">{data.totalStudents}</h3>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5, scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setActiveMenu && setActiveMenu('diemdanh')}
          className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all flex items-center gap-5"
        >
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Lịch hôm nay</p>
            <h3 className="text-3xl font-black text-gray-800">{data.todaySchedules.length}</h3>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5, scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setActiveMenu && setActiveMenu('lichgiangday')}
          className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-purple-200 transition-all flex items-center gap-5"
        >
          <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0">
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Tổng ca dạy</p>
            <h3 className="text-3xl font-black text-gray-800">{data.totalSchedules}</h3>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LỊCH DẠY HÔM NAY */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" /> Lịch dạy hôm nay
            </h3>
            <span className="text-sm font-bold text-orange-600 bg-orange-100 px-3 py-1 rounded-lg">
              {formatDate(new Date().toISOString())}
            </span>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
            {data.todaySchedules.length > 0 ? (
              <div className="space-y-4">
                {data.todaySchedules.map((schedule, idx) => (
                  <div key={idx} onClick={() => setActiveMenu && setActiveMenu('diemdanh')} className="border border-gray-100 rounded-2xl p-5 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-gray-800 text-lg group-hover:text-orange-600 transition-colors">{schedule.TenMonHoc}</h4>
                        <p className="text-sm text-gray-500 font-medium mt-1">Lớp: {schedule.TenLop} • Mã LHP: {schedule.MaLopHocPhan}</p>
                      </div>
                      <div className="bg-orange-50 text-orange-600 font-bold px-3 py-1.5 rounded-xl border border-orange-100 flex flex-col items-center shrink-0">
                        <span className="text-xs">Ca</span>
                        <span className="text-lg leading-none">{schedule.CaHoc || '-'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm font-medium text-gray-600">
                      <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg"><MapPin className="w-4 h-4 text-gray-400" /> Phòng: {schedule.PhongHoc || 'Chưa xếp'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
                <Calendar className="w-16 h-16 mb-3 opacity-20" />
                <p className="font-medium text-gray-500">Hôm nay bạn không có lịch dạy nào.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* DANH SÁCH LỚP GIẢNG DẠY */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-500" /> Lớp đang giảng dạy
            </h3>
            <button onClick={() => setActiveMenu && setActiveMenu('lichgiangday')} className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
              Xem tất cả <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
            {data.courses.length > 0 ? (
              <div className="space-y-4">
                {data.courses.slice(0, 5).map((course, idx) => (
                  <div key={idx} onClick={() => setActiveMenu && setActiveMenu('sinhvien')} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-100 cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-blue-500 font-bold shrink-0">
                        {course.TenMonHoc ? course.TenMonHoc.charAt(0) : 'M'}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 group-hover:text-blue-700 transition-colors">{course.TenMonHoc}</h4>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Mã LHP: {course.MaLopHocPhan} • Tín chỉ: {course.SoTinChi}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
                <BookOpen className="w-16 h-16 mb-3 opacity-20" />
                <p className="font-medium text-gray-500">Bạn chưa được phân công giảng dạy lớp nào.</p>
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}

export default OverviewSection;