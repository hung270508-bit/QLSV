import React, { useState, useEffect } from 'react';
import API_URL from '../../api';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Navigation, CalendarRange, Loader2, BookOpen, MapPin, Clock, Users, Award } from 'lucide-react';
import axios from 'axios';

function ScheduleSection({ user }) {
  const [viewType, setViewType] = useState('week'); 
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [allSchedules, setAllSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  // States cho tính năng Lịch dạy Học Kỳ
  const [activeSemTab, setActiveSemTab] = useState('all');
  const [semesterData, setSemesterData] = useState({});

  // States cho tính năng Tooltip (Hover hiện chi tiết)
  const [tooltipData, setTooltipData] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Modal chi tiết lịch dạy
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  // 1. LẤY DỮ LIỆU LỊCH GIẢNG DẠY
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        // Gọi API dành riêng cho giảng viên
        const response = await axios.get(`${API_URL}/api/teachers/${user?.username || user?.id}/teaching-schedule`);
        
        const formattedData = response.data.map(item => {
        // Ưu tiên lấy trực tiếp số tiết từ API nếu có
          let tietBatDau = item.TietBatDau ? parseInt(item.TietBatDau) : 1;
          let soTiet = item.SoTiet ? parseInt(item.SoTiet) : 3;
          
          // Nếu API trả về dạng chuỗi CaHoc (VD: "1-3", "4-6")
          if (!item.TietBatDau && item.CaHoc) {
            const match = String(item.CaHoc).trim().match(/(\d+)\s*-\s*(\d+)/);
            if (match) {
              tietBatDau = parseInt(match[1]);
              soTiet = parseInt(match[2]) - parseInt(match[1]) + 1;
            } else {
              // Fallback cho trường hợp lưu là dạng số ca "1", "2", "3"
              const caStr = String(item.CaHoc).replace(/\D/g, ''); 
              if (caStr === '1') { tietBatDau = 1; soTiet = 3; }
              else if (caStr === '2') { tietBatDau = 4; soTiet = 3; }
              else if (caStr === '3') { tietBatDau = 7; soTiet = 3; }
              else if (caStr === '4') { tietBatDau = 10; soTiet = 3; }
            }
          }

          const d = new Date(item.NgayHoc);
          const thu = d.getDay() === 0 ? 8 : d.getDay() + 1;

          return {
            id: item.MaLichHoc || Math.random(),
            maHP: item.MaLopHocPhan || item.MaMonHoc || 'N/A',
            tenMon: item.TenMonHoc || 'Môn học chưa xác định',
            tenLop: item.TenLop || item.MaLop || 'Lớp tự do', // Thêm Tên Lớp cho Giảng viên
            phong: item.PhongHoc || 'Chưa xếp phòng',
            ngayHoc: d,
            thuStr: thu === 8 ? 'CN' : `${thu}`,
            tietBatDau: tietBatDau,
            soTiet: soTiet,
            hocKy: item.HocKy || 'HK2_2025_2026', 
            stc: item.SoTinChi || 3,
            nhom: item.MaLop ? item.MaLop.slice(-2) : '01'
          };
        });

        setAllSchedules(formattedData);

        // THUẬT TOÁN GOM NHÓM CHO HỌC KỲ
        const semMap = {};
        formattedData.forEach(item => {
          const hk = item.hocKy;
          if (!semMap[hk]) semMap[hk] = {};

          const hpKey = item.maHP;
          if (!semMap[hk][hpKey]) {
            semMap[hk][hpKey] = { ...item, dates: [item.ngayHoc] };
          } else {
            semMap[hk][hpKey].dates.push(item.ngayHoc);
          }
        });

        const finalSemData = {};
        Object.keys(semMap).forEach(hk => {
          finalSemData[hk] = Object.values(semMap[hk]).map(course => {
            const sortedDates = course.dates.sort((a, b) => a - b);
            const startDate = sortedDates[0].toLocaleDateString('vi-VN', {day:'2-digit', month:'2-digit', year:'numeric'});
            const endDate = sortedDates[sortedDates.length - 1].toLocaleDateString('vi-VN', {day:'2-digit', month:'2-digit', year:'numeric'});
            return {
              ...course,
              thoiGianHoc: `${startDate} - ${endDate}`
            };
          });
        });

        setSemesterData(finalSemData);

      } catch (error) {
        console.error("Lỗi khi tải lịch giảng dạy:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchSchedule();
    }
  }, [user]);

  // 2. LOGIC TÍNH TOÁN NGÀY TRONG TUẦN
  const getWeekDates = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    
    const week = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      week.push(nextDay);
    }
    return week;
  };

  const weekDates = getWeekDates(currentDate);

  const nextWeek = () => { const next = new Date(currentDate); next.setDate(currentDate.getDate() + 7); setCurrentDate(next); };
  const prevWeek = () => { const prev = new Date(currentDate); prev.setDate(currentDate.getDate() - 7); setCurrentDate(prev); };
  const currentWeek = () => setCurrentDate(new Date());

  const formatDate = (date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const isSameDate = (date1, date2) => {
    return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate();
  };

  const matrix = Array(12).fill(null).map(() => Array(7).fill(null));
  allSchedules.forEach(item => {
    const dayIdx = weekDates.findIndex(date => isSameDate(date, item.ngayHoc));
    if (dayIdx !== -1) {
      const startRow = item.tietBatDau - 1; 
      if (startRow >= 0 && startRow < 12) {
        matrix[startRow][dayIdx] = item;
        for (let i = 1; i < item.soTiet; i++) {
          if (startRow + i < 12) matrix[startRow + i][dayIdx] = 'SKIP';
        }
      }
    }
  });

  const formatHocKyTitle = (hkStr) => {
    return hkStr.replace('HK', 'Học kỳ ').replace('_', ' - Năm học ').replace('_', ' - ');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[#F4C542] bg-[#FFFFFF] rounded-2xl shadow-sm border border-[#E5E7EB]">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-medium">Đang đồng bộ lịch giảng dạy...</p>
      </div>
    );
  }

  const getSafeTooltipPos = () => {
    if (!tooltipPos) return { x: 0, y: 0 };
    const tooltipWidth = 260;
    const tooltipHeight = 180;
    let x = tooltipPos.x + 15;
    let y = tooltipPos.y + 15;
    if (x + tooltipWidth > window.innerWidth) {
      x = tooltipPos.x - tooltipWidth - 15;
    }
    if (y + tooltipHeight > window.innerHeight) {
      y = tooltipPos.y - tooltipHeight - 15;
    }
    return { x, y };
  };
  const safePos = getSafeTooltipPos();

  const hasClassesThisWeek = allSchedules.some(item => 
    weekDates.some(date => isSameDate(date, item.ngayHoc))
  );

  return (
    <div className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden relative">
      
      {/* TOOLTIP HIỂN THỊ KHI HOVER */}
      <AnimatePresence>
        {tooltipData && viewType === 'week' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 bg-[#FFFFFF]/95 backdrop-blur-md text-slate-800 text-sm p-4 rounded-2xl shadow-2xl border border-[#F4C542]/30/80 pointer-events-none w-[260px]"
            style={{ top: safePos.y, left: safePos.x }}
          >
            <div className="flex flex-col gap-3">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[#F4C542] tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F4C542] animate-pulse"></span>
                  Lịch giảng dạy
                </span>
                <span className="text-[10px] font-mono bg-[#FFF7D6] px-2 py-0.5 rounded text-[#F4C542] border border-[#FFF7D6]/50">
                  {tooltipData.maHP}
                </span>
              </div>
              
              {/* Title */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 leading-tight">
                  {tooltipData.tenMon}
                </h4>
              </div>

              {/* Grid Details */}
              <div className="grid grid-cols-1 gap-2 text-xs text-slate-600 pt-1">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-[#F4C542] shrink-0" />
                  <span>Lớp: <strong className="text-slate-800 font-semibold">{tooltipData.tenLop}</strong> (Nhóm {tooltipData.nhom})</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#F4C542] shrink-0" />
                  <span>Phòng: <strong className="text-slate-800 font-semibold">{tooltipData.phong}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#F4C542] shrink-0" />
                  <span>
                    Tiết {tooltipData.tietBatDau} - {tooltipData.tietBatDau + tooltipData.soTiet - 1} ({tooltipData.soTiet} tiết)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-3.5 h-3.5 text-[#F4C542] shrink-0" />
                  <span>Số tín chỉ: <strong className="text-slate-800 font-semibold">{tooltipData.stc}</strong></span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Controls */}
      <div className="p-4 border-b border-[#E5E7EB] flex flex-col xl:flex-row items-center justify-between gap-4">
        
        {/* Đổi theme Xanh -> Cam */}
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              checked={viewType === 'week'} 
              onChange={() => setViewType('week')}
              className="w-5 h-5 text-[#F4C542] focus:ring-amber-500 border-gray-300" 
            />
            <span className={`font-medium ${viewType === 'week' ? 'text-[#F4C542]' : 'text-[#6B7280]'}`}>Lịch dạy Tuần</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              checked={viewType === 'semester'} 
              onChange={() => setViewType('semester')}
              className="w-5 h-5 text-[#F4C542] focus:ring-amber-500 border-gray-300" 
            />
            <span className={`font-medium ${viewType === 'semester' ? 'text-[#F4C542]' : 'text-[#6B7280]'}`}>Lịch dạy Học Kỳ</span>
          </label>
        </div>

        {viewType === 'week' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            <button onClick={currentWeek} className="px-4 py-2 bg-[#F4C542] hover:bg-[#F4C542]/90 text-[#152238] rounded-lg font-medium transition-colors shadow-sm">
              Tuần hiện tại
            </button>
            <div className="flex items-center gap-1 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-1">
              <button onClick={prevWeek} className="p-1.5 hover:bg-gray-200 rounded-md transition-colors text-[#6B7280]"><ChevronLeft className="w-5 h-5" /></button>
              <div className="px-4 py-1 flex items-center gap-2 min-w-[240px] justify-center bg-[#FFFFFF] border border-[#E5E7EB] rounded-md shadow-sm">
                <CalendarRange className="w-4 h-4 text-gray-300" />
                <span className="text-sm font-medium text-gray-700">Tuần: {formatDate(weekDates[0])} - {formatDate(weekDates[6])}</span>
              </div>
              <button onClick={nextWeek} className="p-1.5 hover:bg-gray-200 rounded-md transition-colors text-[#6B7280]"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </motion.div>
        )}
      </div>

      {/* ======================================= */}
      {/* KHU VỰC 1: XEM THEO TUẦN (GRID MA TRẬN) */}
      {/* ======================================= */}
      {viewType === 'week' && (
        hasClassesThisWeek ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[1000px]">
              <thead>
                <tr>
                  <th className="w-20 border border-[#E5E7EB] bg-[#FFFFFF]"></th>
                  {weekDates.map((date, index) => (
                    <th key={index} className="border border-white bg-[#F4C542] text-[#152238] py-3 px-2 w-[14%] font-normal">
                      <div className="font-bold text-base mb-1">{index === 6 ? 'Chủ nhật' : `Thứ ${index + 2}`}</div>
                      <div className="text-xs text-[#152238]/70">{formatDate(date)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((tiet) => (
                  <tr key={tiet}>
                    <td className="w-20 min-w-[80px] bg-[#F4C542] text-[#152238] font-bold text-center border border-[#E5E7EB]">
                      Tiết {tiet}
                    </td>
                    {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                      const cellData = matrix[tiet - 1][dayIdx];
                      if (cellData === 'SKIP') return null;

                      if (cellData) {
                        return (
                          <td 
                            key={dayIdx} 
                            rowSpan={cellData.soTiet} 
                            onMouseEnter={(e) => { setTooltipData(cellData); setTooltipPos({ x: e.clientX, y: e.clientY }); }}
                            onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
                            onMouseLeave={() => setTooltipData(null)}
                            onClick={() => setSelectedSchedule(cellData)}
                            className="border border-[#E5E7EB] bg-[#FDE28A] p-3 align-top transition-colors cursor-pointer hover:brightness-95 shadow-sm relative overflow-hidden"
                          >
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full z-10 relative">
                              <span className="font-bold text-[#1F2937] text-sm leading-relaxed">{cellData.tenMon}</span>
                              <span className="text-[#F4C542] font-bold text-xs mt-1">{cellData.tenLop}</span>
                              <span className="flex items-center gap-1.5 text-gray-700 text-sm mt-auto font-medium pt-2">
                                <Navigation className="w-3.5 h-3.5 text-[#6B7280]" /> {cellData.phong}
                              </span>
                            </motion.div>
                          </td>
                        );
                      }
                      return <td key={dayIdx} className="border border-[#E5E7EB] h-14 bg-[#FFFFFF] transition-colors hover:bg-[#F7F8FA]/50"></td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="w-20 h-20 bg-[#FFF7D6] rounded-full flex items-center justify-center mb-4"><BookOpen className="w-10 h-10 text-amber-300" /></div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{allSchedules.length === 0 ? "Chưa có lịch giảng dạy" : "Trống lịch tuần này"}</h3>
            <p className="text-gray-500 max-w-md">{allSchedules.length === 0 ? "Hiện tại bạn chưa được phân công lịch giảng dạy nào. Các lịch học sẽ hiển thị tại đây khi được phòng đào tạo xếp lịch." : "Tuần này bạn không có lịch lên lớp. Hãy chọn tuần khác hoặc chuyển sang Lịch dạy Học Kỳ."}</p>
          </div>
        )
      )}


      {/* ========================================= */}
      {/* KHU VỰC 2: XEM THEO HỌC KỲ (DẠNG DANH SÁCH) */}
      {/* ========================================= */}
      {viewType === 'semester' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#FFFFFF]">
          
          {/* Tabs chuyển học kỳ */}
          <div className="flex border-b border-[#E5E7EB] px-2 pt-2 overflow-x-auto custom-scrollbar">
            <button 
              onClick={() => setActiveSemTab('all')}
              className={`px-5 py-3 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${activeSemTab === 'all' ? 'border-[#F4C542] text-[#F4C542]' : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'}`}
            >
              Tất cả
            </button>
            {Object.keys(semesterData).sort().map(hk => (
              <button 
                key={hk}
                onClick={() => setActiveSemTab(hk)}
                className={`px-5 py-3 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${activeSemTab === hk ? 'border-[#F4C542] text-[#F4C542]' : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'}`}
              >
                {formatHocKyTitle(hk)}
              </button>
            ))}
          </div>

          {/* Bảng dữ liệu Học kỳ */}
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left border-collapse border border-[#E5E7EB] min-w-[1000px]">
              <thead>
                <tr className="bg-[#F7F8FA] text-[#6B7280] text-sm">
                  <th className="p-3 border border-[#E5E7EB] font-semibold">Mã HP</th>
                  <th className="p-3 border border-[#E5E7EB] font-semibold w-1/4">Môn học</th>
                  <th className="p-3 border border-[#E5E7EB] font-semibold text-center">Lớp</th>
                  <th className="p-3 border border-[#E5E7EB] font-semibold text-center">NH</th>
                  <th className="p-3 border border-[#E5E7EB] font-semibold text-center">STC</th>
                  <th className="p-3 border border-[#E5E7EB] font-semibold">Phòng</th>
                  <th className="p-3 border border-[#E5E7EB] font-semibold text-center">Thứ</th>
                  <th className="p-3 border border-[#E5E7EB] font-semibold text-center">Tiết BĐ</th>
                  <th className="p-3 border border-[#E5E7EB] font-semibold">Thời gian dạy</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(semesterData).sort().filter(hk => activeSemTab === 'all' || activeSemTab === hk).map(hk => (
                  <React.Fragment key={hk}>
                    {/* Hàng Header Học Kỳ */}
                    <tr>
                      <td colSpan="9" className="bg-[#F4C542] text-[#152238] font-bold px-4 py-2.5 text-sm">
                        {formatHocKyTitle(hk)}
                      </td>
                    </tr>
                    
                    {semesterData[hk].map((course, idx) => (
                      <tr key={idx} onClick={() => setSelectedSchedule(course)} className="border-b border-[#E5E7EB] hover:bg-[#FFF7D6] cursor-pointer transition-colors">
                        <td className="p-3 text-sm text-gray-700 font-medium">{course.maHP}</td>
                        <td className="p-3 text-sm font-semibold text-[#1F2937]">{course.tenMon}</td>
                        <td className="p-3 text-sm font-bold text-[#F4C542] text-center">{course.tenLop}</td>
                        <td className="p-3 text-sm text-gray-700 text-center">{course.nhom}</td>
                        <td className="p-3 text-sm text-gray-700 text-center">{course.stc}</td>
                        <td className="p-3 text-sm text-gray-700">{course.phong}</td>
                        <td className="p-3 text-sm font-bold text-[#1F2937] text-center">{course.thuStr}</td>
                        <td className="p-3 text-sm text-gray-700 text-center">{course.tietBatDau}</td>
                        <td className="p-3 text-sm text-gray-700 font-medium">{course.thoiGianHoc}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
                
                {Object.keys(semesterData).length === 0 && (
                  <tr><td colSpan="9" className="p-8 text-center text-[#6B7280] italic">Không có dữ liệu lịch giảng dạy</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* MODAL CHI TIẾT LỊCH DẠY */}
      <AnimatePresence>
        {selectedSchedule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
              onClick={() => setSelectedSchedule(null)} 
            />
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} 
              className="relative bg-[#FFFFFF] rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="bg-[#F4C542] px-6 py-5 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Chi tiết Lịch giảng dạy
                </h3>
                <button onClick={() => setSelectedSchedule(null)} className="p-2 hover:bg-white/40 rounded-lg transition-colors text-white">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <h4 className="text-2xl font-bold text-[#1F2937]">{selectedSchedule.tenMon}</h4>
                  <p className="text-[#F4C542] font-medium mt-1">Mã HP: {selectedSchedule.maHP}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-[#FFF7D6] rounded-xl p-4 border border-[#FFF7D6]">
                  <div>
                    <p className="text-sm text-[#6B7280] font-medium">Lớp sinh hoạt</p>
                    <p className="font-bold text-[#1F2937]">{selectedSchedule.tenLop}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6B7280] font-medium">Số tín chỉ</p>
                    <p className="font-bold text-[#1F2937]">{selectedSchedule.stc} tín chỉ</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6B7280] font-medium">Phòng học</p>
                    <p className="font-bold flex items-center gap-1 text-[#1F2937]"><MapPin className="w-4 h-4 text-[#F4C542]"/> {selectedSchedule.phong}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6B7280] font-medium">Thời gian</p>
                    <p className="font-bold flex items-center gap-1 text-[#1F2937]"><Clock className="w-4 h-4 text-[#F4C542]"/> Tiết {selectedSchedule.tietBatDau} - {selectedSchedule.tietBatDau + selectedSchedule.soTiet - 1}</p>
                  </div>
                </div>

                <div className="bg-[#F7F8FA] rounded-xl p-4 border border-[#E5E7EB]">
                  <p className="text-sm text-[#6B7280] font-medium mb-1">Thứ trong tuần</p>
                  <p className="font-bold text-[#1F2937]">{selectedSchedule.thuStr === 'CN' ? 'Chủ nhật' : `Thứ ${selectedSchedule.thuStr}`}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ScheduleSection;
