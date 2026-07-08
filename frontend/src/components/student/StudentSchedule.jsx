import { StudentScheduleSkeleton } from '../common/StudentSkeleton';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CalendarRange, BookOpen, X, MapPin, Clock, Award, Tag, GraduationCap, CalendarDays, ClipboardList, Calendar, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import API_URL from '../../api';

function StudentSchedule({ user }) {
  const [viewType, setViewType] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [allSchedules, setAllSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeSemTab, setActiveSemTab] = useState('all');
  const [semesterData, setSemesterData] = useState({});

  const [tooltipData, setTooltipData] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // State quản lý việc hiển thị Popup chi tiết môn học / môn thi
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemType, setItemType] = useState('course'); // 'course' or 'exam'

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/students/${user?.username || user?.id}/schedule`);

        const formattedData = response.data.map(item => {
          let tietBatDau = item.TietBatDau ? parseInt(item.TietBatDau) : 1;
          let soTiet = item.SoTiet ? parseInt(item.SoTiet) : 3;

          if (!item.TietBatDau && item.CaHoc) {
            const match = String(item.CaHoc).trim().match(/(\d+)\s*-\s*(\d+)/);
            if (match) {
              tietBatDau = parseInt(match[1]);
              soTiet = parseInt(match[2]) - parseInt(match[1]) + 1;
            } else {
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
            const startDate = sortedDates[0].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const endDate = sortedDates[sortedDates.length - 1].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
            return {
              ...course,
              thoiGianHoc: `${startDate} - ${endDate}`
            };
          });
        });

        setSemesterData(finalSemData);

      } catch (error) {
        console.error("Lỗi khi tải lịch học:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchSchedule();
    }
  }, [user]);

  const getMockExamDates = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));

    const d1 = new Date(monday); d1.setDate(monday.getDate() + 1); // Thứ 3
    const d2 = new Date(monday); d2.setDate(monday.getDate() + 3); // Thứ 5
    const d3 = new Date(monday); d3.setDate(monday.getDate() + 5); // Thứ 7

    const formatDateString = (date) => {
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return [
      { id: 1, maHP: 'IT001', tenMon: 'Nhập môn lập trình', ngayThi: d1, ngayThiStr: formatDateString(d1), gioThi: '07:30', thoiLuong: 90, phongThi: 'A1-101', hinhThuc: 'Tự luận', sbd: '012', stc: 3, hocKy: 'HK2_2025_2026', nhom: '01', tietBatDau: 1, soTiet: 2 },
      { id: 2, maHP: 'IT002', tenMon: 'Cấu trúc dữ liệu và giải thuật', ngayThi: d2, ngayThiStr: formatDateString(d2), gioThi: '13:30', thoiLuong: 120, phongThi: 'B1-205', hinhThuc: 'Thực hành trên máy', sbd: '045', stc: 4, hocKy: 'HK2_2025_2026', nhom: '02', tietBatDau: 7, soTiet: 3 },
      { id: 3, maHP: 'MA003', tenMon: 'Đại số tuyến tính', ngayThi: d3, ngayThiStr: formatDateString(d3), gioThi: '09:00', thoiLuong: 90, phongThi: 'C2-302', hinhThuc: 'Trắc nghiệm', sbd: '105', stc: 3, hocKy: 'HK2_2025_2026', nhom: '01', tietBatDau: 3, soTiet: 2 },
    ];
  };

  const [examSchedules] = useState(getMockExamDates());

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

  // Ma trận Lịch Học
  const matrix = Array(12).fill(null).map(() => Array(7).fill(null));
  let hasScheduleThisWeek = false;

  allSchedules.forEach(item => {
    const dayIdx = weekDates.findIndex(date => isSameDate(date, item.ngayHoc));
    if (dayIdx !== -1) {
      const startRow = item.tietBatDau - 1;
      if (startRow >= 0 && startRow < 12) {
        matrix[startRow][dayIdx] = item;
        hasScheduleThisWeek = true;
        for (let i = 1; i < item.soTiet; i++) {
          if (startRow + i < 12) matrix[startRow + i][dayIdx] = 'SKIP';
        }
      }
    }
  });

  // Ma trận Lịch Thi
  const examMatrix = Array(12).fill(null).map(() => Array(7).fill(null));
  let hasExamThisWeek = false;

  examSchedules.forEach(item => {
    if (!item.ngayThi) return;
    const dayIdx = weekDates.findIndex(date => isSameDate(date, item.ngayThi));
    if (dayIdx !== -1) {
      const startRow = item.tietBatDau - 1;
      if (startRow >= 0 && startRow < 12) {
        examMatrix[startRow][dayIdx] = item;
        hasExamThisWeek = true;
        for (let i = 1; i < item.soTiet; i++) {
          if (startRow + i < 12) examMatrix[startRow + i][dayIdx] = 'SKIP';
        }
      }
    }
  });

  const formatHocKyTitle = (hkStr) => {
    if (!hkStr) return 'N/A';
    return hkStr.replace('HK', 'Học kỳ ').replace('_', ' - Năm học ').replace('_', ' - ');
  };

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

  const handleItemClick = (item, type) => {
    setSelectedItem(item);
    setItemType(type);
  };

  if (loading) {
    return <StudentScheduleSkeleton />;
  }

  
  return (
    <div className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden relative">

      {/* TOOLTIP HIỂN THỊ KHI HOVER (LỊCH HỌC) */}
      {typeof document !== 'undefined' ? createPortal(
        <AnimatePresence>
          {tooltipData && viewType === 'week' && !selectedItem && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              className="fixed z-[9999] bg-[#FFFFFF]/95 backdrop-blur-md text-slate-800 text-sm p-4 rounded-2xl shadow-2xl border border-[#F4C542]/30/80 pointer-events-none w-[260px]"
              style={{ top: safePos.y, left: safePos.x }}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[#F4C542] tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F4C542] animate-pulse"></span>
                    Lịch học
                  </span>
                  <span className="text-[10px] font-mono bg-[#FFF7D6] px-2 py-0.5 rounded text-[#F4C542] border border-[#FFF7D6]/50">
                    {tooltipData.maHP}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 leading-tight">
                    {tooltipData.tenMon}
                  </h4>
                </div>
                <div className="grid grid-cols-1 gap-2 text-xs text-slate-600 pt-1">
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
        </AnimatePresence>,
        document.body
      ) : null}
      
      {/* TOOLTIP HIỂN THỊ KHI HOVER (LỊCH THI) */}
      {typeof document !== 'undefined' ? createPortal(
        <AnimatePresence>
          {tooltipData && viewType === 'exam' && !selectedItem && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              className="fixed z-[9999] bg-[#FFFFFF]/95 backdrop-blur-md text-slate-800 text-sm p-4 rounded-2xl shadow-2xl border border-[#EF4444]/30/80 pointer-events-none w-[260px]"
              style={{ top: safePos.y, left: safePos.x }}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[#EF4444] tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse"></span>
                    Lịch thi
                  </span>
                  <span className="text-[10px] font-mono bg-[#FEF2F2] px-2 py-0.5 rounded text-[#EF4444] border border-[#FEE2E2]/50">
                    {tooltipData.maHP}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 leading-tight">
                    {tooltipData.tenMon}
                  </h4>
                </div>
                <div className="grid grid-cols-1 gap-2 text-xs text-slate-600 pt-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />
                    <span>Phòng thi: <strong className="text-slate-800 font-semibold">{tooltipData.phongThi}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />
                    <span>
                      Giờ thi: <strong className="text-slate-800 font-semibold">{tooltipData.gioThi}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />
                    <span>Số báo danh: <strong className="text-slate-800 font-semibold">{tooltipData.sbd}</strong></span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      ) : null}

      {/* POPUP (MODAL) CHI TIẾT HỌC PHẦN HOẶC LỊCH THI */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#FFFFFF] rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden relative"
            >
              <div className="bg-[#F4C542] px-6 py-5 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  {itemType === 'exam' ? <GraduationCap className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                  {itemType === 'exam' ? 'Chi tiết Lịch thi' : 'Chi tiết Lịch học'}
                </h3>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-2 hover:bg-white/40 rounded-lg transition-colors text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <h4 className="text-2xl font-bold text-[#1F2937]">{selectedItem.tenMon}</h4>
                  <p className="text-[#F4C542] font-medium mt-1">Mã HP: {selectedItem.maHP}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-[#FFF7D6] rounded-xl p-4 border border-[#FFF7D6]">
                  {itemType === 'course' ? (
                    <>
                      <div>
                        <p className="text-sm text-[#6B7280] font-medium">Nhóm lớp</p>
                        <p className="font-bold text-[#1F2937]">{selectedItem.nhom || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#6B7280] font-medium">Số tín chỉ</p>
                        <p className="font-bold text-[#1F2937]">{selectedItem.stc} tín chỉ</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#6B7280] font-medium">Phòng học</p>
                        <p className="font-bold flex items-center gap-1 text-[#1F2937]"><MapPin className="w-4 h-4 text-[#F4C542]"/> {selectedItem.phong}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#6B7280] font-medium">Thời gian</p>
                        <p className="font-bold flex items-center gap-1 text-[#1F2937]"><Clock className="w-4 h-4 text-[#F4C542]"/> Tiết {selectedItem.tietBatDau} - {selectedItem.tietBatDau + selectedItem.soTiet - 1}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm text-[#6B7280] font-medium">Ngày thi</p>
                        <p className="font-bold text-[#1F2937] text-lg text-indigo-700">{selectedItem.ngayThiStr}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#6B7280] font-medium">Giờ thi</p>
                        <p className="font-bold text-[#1F2937]">{selectedItem.gioThi}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#6B7280] font-medium">Phòng thi</p>
                        <p className="font-bold flex items-center gap-1 text-[#1F2937]"><MapPin className="w-4 h-4 text-[#F4C542]"/> {selectedItem.phongThi}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#6B7280] font-medium">Số báo danh</p>
                        <p className="font-bold flex items-center gap-1 text-[#1F2937]">{selectedItem.sbd}</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="bg-[#F7F8FA] rounded-xl p-4 border border-[#E5E7EB]">
                  {itemType === 'course' ? (
                    <>
                      <p className="text-sm text-[#6B7280] font-medium mb-1">Thứ trong tuần</p>
                      <p className="font-bold text-[#1F2937]">{selectedItem.thuStr === 'CN' ? 'Chủ nhật' : `Thứ ${selectedItem.thuStr}`}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-[#6B7280] font-medium mb-1">Hình thức</p>
                      <p className="font-bold text-[#1F2937]">{selectedItem.hinhThuc} ({selectedItem.thoiLuong} phút)</p>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Top Controls */}
      <div className="p-4 border-b border-[#E5E7EB] flex flex-col xl:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              checked={viewType === 'week'} 
              onChange={() => setViewType('week')}
              className="w-5 h-5 text-[#F4C542] focus:ring-amber-500 border-gray-300" 
            />
            <span className={`font-medium ${viewType === 'week' ? 'text-[#F4C542]' : 'text-[#6B7280]'}`}>Lịch học Tuần</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              checked={viewType === 'semester'} 
              onChange={() => setViewType('semester')}
              className="w-5 h-5 text-[#F4C542] focus:ring-amber-500 border-gray-300" 
            />
            <span className={`font-medium ${viewType === 'semester' ? 'text-[#F4C542]' : 'text-[#6B7280]'}`}>Lịch học Học Kỳ</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              checked={viewType === 'exam'} 
              onChange={() => setViewType('exam')}
              className="w-5 h-5 text-[#F4C542] focus:ring-amber-500 border-gray-300" 
            />
            <span className={`font-medium ${viewType === 'exam' ? 'text-[#F4C542]' : 'text-[#6B7280]'}`}>Lịch thi</span>
          </label>
        </div>

        {(viewType === 'week' || viewType === 'exam') && (
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
        hasScheduleThisWeek ? (
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
                            onClick={() => handleItemClick(cellData, 'course')}
                            className="border border-[#E5E7EB] bg-[#FDE28A] p-3 align-top transition-colors cursor-pointer hover:brightness-95 shadow-sm relative overflow-hidden"
                          >
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full z-10 relative">
                              <span className="font-bold text-[#1F2937] text-sm leading-relaxed">{cellData.tenMon}</span>
                              <span className="text-[#F4C542] font-bold text-xs mt-1">Nhóm: {cellData.nhom || '01'}</span>
                              <span className="flex items-center gap-1.5 text-gray-700 text-sm mt-auto font-medium pt-2">
                                <MapPin className="w-3.5 h-3.5 text-[#6B7280]" /> {cellData.phong}
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
            <h3 className="text-xl font-bold text-gray-800 mb-2">Trống lịch học</h3>
            <p className="text-gray-500 max-w-md">Tuần này bạn không có lịch học. Hãy chọn tuần khác hoặc chuyển sang Lịch học Học Kỳ.</p>
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
                  <th className="p-3 border border-[#E5E7EB] font-semibold text-center">Nhóm</th>
                  <th className="p-3 border border-[#E5E7EB] font-semibold text-center">STC</th>
                  <th className="p-3 border border-[#E5E7EB] font-semibold">Phòng</th>
                  <th className="p-3 border border-[#E5E7EB] font-semibold text-center">Thứ</th>
                  <th className="p-3 border border-[#E5E7EB] font-semibold text-center">Tiết BĐ</th>
                  <th className="p-3 border border-[#E5E7EB] font-semibold">Thời gian học</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(semesterData).sort().filter(hk => activeSemTab === 'all' || activeSemTab === hk).map(hk => (
                  <React.Fragment key={hk}>
                    {/* Hàng Header Học Kỳ */}
                    <tr>
                      <td colSpan="8" className="bg-[#F4C542] text-[#152238] font-bold px-4 py-2.5 text-sm">
                        {formatHocKyTitle(hk)}
                      </td>
                    </tr>

                    {semesterData[hk].map((course, idx) => (
                      <tr key={idx} onClick={() => handleItemClick(course, 'course')} className="border-b border-[#E5E7EB] hover:bg-[#FFF7D6] cursor-pointer transition-colors">
                        <td className="p-3 text-sm text-gray-700 font-medium">{course.maHP}</td>
                        <td className="p-3 text-sm font-semibold text-[#1F2937]">{course.tenMon}</td>
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
                  <tr><td colSpan="8" className="p-8 text-center text-[#6B7280] italic">Không có dữ liệu lịch học</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ========================================= */}
      {/* KHU VỰC 3: XEM LỊCH THI */}
      {/* ========================================= */}
      {viewType === 'exam' && (
        hasExamThisWeek ? (
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
                      const cellData = examMatrix[tiet - 1][dayIdx];
                      if (cellData === 'SKIP') return null;

                      if (cellData) {
                        return (
                          <td
                            key={dayIdx}
                            rowSpan={cellData.soTiet}
                            onMouseEnter={(e) => { setTooltipData(cellData); setTooltipPos({ x: e.clientX, y: e.clientY }); }}
                            onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
                            onMouseLeave={() => setTooltipData(null)}
                            onClick={() => handleItemClick(cellData, 'exam')}
                            className="border border-[#E5E7EB] bg-[#FCA5A5]/30 p-3 align-top transition-colors cursor-pointer hover:brightness-95 shadow-sm relative overflow-hidden"
                          >
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full z-10 relative">
                              <span className="font-bold text-[#1F2937] text-sm leading-relaxed">{cellData.tenMon}</span>
                              <span className="text-[#EF4444] font-bold text-xs mt-1">Phòng thi: {cellData.phongThi}</span>
                              <span className="flex items-center gap-1.5 text-gray-700 text-sm mt-auto font-medium pt-2">
                                <Clock className="w-3.5 h-3.5 text-[#6B7280]" /> Giờ: {cellData.gioThi}
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
            <div className="w-20 h-20 bg-[#FEE2E2] rounded-full flex items-center justify-center mb-4"><GraduationCap className="w-10 h-10 text-red-400" /></div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Trống lịch thi</h3>
            <p className="text-gray-500 max-w-md">Tuần này bạn không có lịch thi nào.</p>
          </div>
        )
      )}

    </div>
  );

}

export default StudentSchedule;
