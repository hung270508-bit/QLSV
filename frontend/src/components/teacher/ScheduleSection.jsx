import React, { useState, useEffect } from 'react';
import API_URL from '../../api';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Navigation, CalendarRange, Loader2, BookOpen } from 'lucide-react';
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

  // 1. LẤY DỮ LIỆU LỊCH GIẢNG DẠY
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        // Gọi API dành riêng cho giảng viên
        const response = await axios.get(`${API_URL}/api/teachers/${user?.username || user?.id}/teaching-schedule`);
        
        const formattedData = response.data.map(item => {
          let tietBatDau = 1;
          let soTiet = 3;
          
          const caStr = String(item.CaHoc).replace(/\D/g, ''); 
          if (caStr === '1') { tietBatDau = 1; soTiet = 3; }
          else if (caStr === '2') { tietBatDau = 4; soTiet = 3; }
          else if (caStr === '3') { tietBatDau = 7; soTiet = 3; }
          else if (caStr === '4') { tietBatDau = 10; soTiet = 3; }

          const d = new Date(item.NgayHoc);
          const thu = d.getDay() === 0 ? 8 : d.getDay() + 1;

          return {
            id: item.MaLichHoc || Math.random(),
            maHP: item.MaLopHocPhan || item.MaMonHoc || 'N/A',
            tenMon: item.TenMonHoc || 'Môn học chưa xác định',
            tenLop: item.TenLop || item.MaLop || 'N/A', // Thêm Tên Lớp cho Giảng viên
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
      <div className="flex flex-col items-center justify-center h-64 text-orange-500 bg-white rounded-2xl shadow-sm border border-gray-200">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-medium">Đang đồng bộ lịch giảng dạy...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative">
      
      {/* TOOLTIP HIỂN THỊ KHI HOVER */}
      <AnimatePresence>
        {tooltipData && viewType === 'week' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 bg-[#333333] text-white text-sm p-3.5 rounded-lg shadow-xl pointer-events-none min-w-[200px]"
            style={{ top: tooltipPos.y + 15, left: tooltipPos.x + 15 }}
          >
            <div className="space-y-1.5">
              <p><span className="font-bold text-gray-300">Tên học phần:</span> {tooltipData.tenMon}</p>
              <p><span className="font-bold text-gray-300">Lớp học:</span> <span className="text-orange-400 font-bold">{tooltipData.tenLop}</span></p>
              <p><span className="font-bold text-gray-300">Phòng học:</span> {tooltipData.phong}</p>
              <p><span className="font-bold text-gray-300">Tiết bắt đầu:</span> {tooltipData.tietBatDau}</p>
              <p><span className="font-bold text-gray-300">Số tiết:</span> {tooltipData.soTiet}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Controls */}
      <div className="p-4 border-b border-gray-200 flex flex-col xl:flex-row items-center justify-between gap-4">
        
        {/* Đổi theme Xanh -> Cam */}
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              checked={viewType === 'week'} 
              onChange={() => setViewType('week')}
              className="w-5 h-5 text-orange-600 focus:ring-orange-500 border-gray-300" 
            />
            <span className={`font-medium ${viewType === 'week' ? 'text-orange-600' : 'text-gray-600'}`}>Lịch dạy Tuần</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              checked={viewType === 'semester'} 
              onChange={() => setViewType('semester')}
              className="w-5 h-5 text-orange-600 focus:ring-orange-500 border-gray-300" 
            />
            <span className={`font-medium ${viewType === 'semester' ? 'text-orange-600' : 'text-gray-600'}`}>Lịch dạy Học Kỳ</span>
          </label>
        </div>

        {viewType === 'week' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            <button onClick={currentWeek} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors shadow-sm">
              Tuần hiện tại
            </button>
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-1">
              <button onClick={prevWeek} className="p-1.5 hover:bg-gray-200 rounded-md transition-colors text-gray-600"><ChevronLeft className="w-5 h-5" /></button>
              <div className="px-4 py-1 flex items-center gap-2 min-w-[240px] justify-center bg-white border border-gray-200 rounded-md shadow-sm">
                <CalendarRange className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Tuần: {formatDate(weekDates[0])} - {formatDate(weekDates[6])}</span>
              </div>
              <button onClick={nextWeek} className="p-1.5 hover:bg-gray-200 rounded-md transition-colors text-gray-600"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </motion.div>
        )}
      </div>

      {/* ======================================= */}
      {/* KHU VỰC 1: XEM THEO TUẦN (GRID MA TRẬN) */}
      {/* ======================================= */}
      {viewType === 'week' && (
        allSchedules.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[1000px]">
              <thead>
                <tr>
                  <th className="w-20 border border-gray-200 bg-white"></th>
                  {weekDates.map((date, index) => (
                    <th key={index} className="border border-white bg-orange-500 text-white py-3 px-2 w-[14%] font-normal">
                      <div className="font-bold text-base mb-1">{index === 6 ? 'Chủ nhật' : `Thứ ${index + 2}`}</div>
                      <div className="text-xs text-orange-100">{formatDate(date)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((tiet) => (
                  <tr key={tiet}>
                    <td className="w-20 min-w-[80px] bg-orange-500 text-white font-bold text-center border border-gray-200">
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
                            className="border border-gray-200 bg-[#FDE28A] p-3 align-top transition-colors cursor-pointer hover:brightness-95 shadow-sm relative overflow-hidden"
                          >
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full z-10 relative">
                              <span className="font-bold text-gray-800 text-sm leading-relaxed">{cellData.tenMon}</span>
                              <span className="text-orange-600 font-bold text-xs mt-1">{cellData.tenLop}</span>
                              <span className="flex items-center gap-1.5 text-gray-700 text-sm mt-auto font-medium pt-2">
                                <Navigation className="w-3.5 h-3.5 text-gray-600" /> {cellData.phong}
                              </span>
                            </motion.div>
                          </td>
                        );
                      }
                      return <td key={dayIdx} className="border border-gray-200 h-14 bg-white transition-colors hover:bg-gray-50/50"></td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-4"><BookOpen className="w-10 h-10 text-orange-300" /></div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Chưa có lịch giảng dạy</h3>
            <p className="text-gray-500 max-w-md">Hệ thống chưa ghi nhận lịch giảng dạy nào cho tuần này.</p>
          </div>
        )
      )}


      {/* ========================================= */}
      {/* KHU VỰC 2: XEM THEO HỌC KỲ (DẠNG DANH SÁCH) */}
      {/* ========================================= */}
      {viewType === 'semester' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white">
          
          {/* Tabs chuyển học kỳ */}
          <div className="flex border-b border-gray-200 px-2 pt-2 overflow-x-auto custom-scrollbar">
            <button 
              onClick={() => setActiveSemTab('all')}
              className={`px-5 py-3 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${activeSemTab === 'all' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
            >
              Tất cả
            </button>
            {Object.keys(semesterData).sort().map(hk => (
              <button 
                key={hk}
                onClick={() => setActiveSemTab(hk)}
                className={`px-5 py-3 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${activeSemTab === hk ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
              >
                {formatHocKyTitle(hk)}
              </button>
            ))}
          </div>

          {/* Bảng dữ liệu Học kỳ */}
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left border-collapse border border-gray-200 min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm">
                  <th className="p-3 border border-gray-200 font-semibold">Mã HP</th>
                  <th className="p-3 border border-gray-200 font-semibold w-1/4">Môn học</th>
                  <th className="p-3 border border-gray-200 font-semibold text-center">Lớp</th>
                  <th className="p-3 border border-gray-200 font-semibold text-center">NH</th>
                  <th className="p-3 border border-gray-200 font-semibold text-center">STC</th>
                  <th className="p-3 border border-gray-200 font-semibold">Phòng</th>
                  <th className="p-3 border border-gray-200 font-semibold text-center">Thứ</th>
                  <th className="p-3 border border-gray-200 font-semibold text-center">Tiết BĐ</th>
                  <th className="p-3 border border-gray-200 font-semibold">Thời gian dạy</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(semesterData).sort().filter(hk => activeSemTab === 'all' || activeSemTab === hk).map(hk => (
                  <React.Fragment key={hk}>
                    {/* Hàng Header Học Kỳ */}
                    <tr>
                      <td colSpan="9" className="bg-orange-500 text-white font-bold px-4 py-2.5 text-sm">
                        {formatHocKyTitle(hk)}
                      </td>
                    </tr>
                    
                    {semesterData[hk].map((course, idx) => (
                      <tr key={idx} className="border-b border-gray-200 hover:bg-orange-50 transition-colors">
                        <td className="p-3 text-sm text-gray-700 font-medium">{course.maHP}</td>
                        <td className="p-3 text-sm font-semibold text-gray-800">{course.tenMon}</td>
                        <td className="p-3 text-sm font-bold text-orange-600 text-center">{course.tenLop}</td>
                        <td className="p-3 text-sm text-gray-700 text-center">{course.nhom}</td>
                        <td className="p-3 text-sm text-gray-700 text-center">{course.stc}</td>
                        <td className="p-3 text-sm text-gray-700">{course.phong}</td>
                        <td className="p-3 text-sm font-bold text-gray-800 text-center">{course.thuStr}</td>
                        <td className="p-3 text-sm text-gray-700 text-center">{course.tietBatDau}</td>
                        <td className="p-3 text-sm text-gray-700 font-medium">{course.thoiGianHoc}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
                
                {Object.keys(semesterData).length === 0 && (
                  <tr><td colSpan="9" className="p-8 text-center text-gray-500 italic">Không có dữ liệu lịch giảng dạy</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

    </div>
  );
}

export default ScheduleSection;
