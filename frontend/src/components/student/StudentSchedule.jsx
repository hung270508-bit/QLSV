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
    <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden relative">

      {/* TOOLTIP HIỂN THỊ KHI HOVER (LỊCH HỌC) */}
      {typeof document !== 'undefined' ? createPortal(
        <AnimatePresence>
          {tooltipData && viewType === 'week' && !selectedItem && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              className="fixed z-[9999] bg-white/95 backdrop-blur-md text-slate-800 text-sm p-4 rounded-2xl shadow-2xl border border-blue-200/80 pointer-events-none w-[260px]"
              style={{ top: safePos.y, left: safePos.x }}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                    Lịch học
                  </span>
                  <span className="text-[10px] font-mono bg-blue-50 px-2 py-0.5 rounded text-blue-600 border border-blue-100/50">
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
                    <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>Phòng: <strong className="text-slate-800 font-semibold">{tooltipData.phong}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>
                      Tiết {tooltipData.tietBatDau} - {tooltipData.tietBatDau + tooltipData.soTiet - 1} ({tooltipData.soTiet} tiết)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-blue-500 shrink-0" />
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
              className="fixed z-[9999] bg-white/95 backdrop-blur-md text-slate-800 text-sm p-4 rounded-2xl shadow-2xl border border-indigo-200/80 pointer-events-none w-[260px]"
              style={{ top: safePos.y, left: safePos.x }}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-indigo-600 tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                    Lịch thi
                  </span>
                  <span className="text-[10px] font-mono bg-indigo-50 px-2 py-0.5 rounded text-indigo-600 border border-indigo-100/50">
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
                    <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Phòng thi: <strong className="text-slate-800 font-semibold">{tooltipData.phongThi}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>
                      Giờ thi: <strong className="text-slate-800 font-semibold">{tooltipData.gioThi}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
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
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-gray-100"
            >
              <div className={`px-6 py-5 flex justify-between items-center text-white ${itemType === 'exam' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-cyan-600'}`}>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  {itemType === 'exam' ? <GraduationCap className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                  {itemType === 'exam' ? 'Chi tiết lịch thi' : 'Chi tiết học phần'}
                </h3>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-1.5 hover:bg-white/20 rounded-xl text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex flex-col gap-1.5 border-b border-gray-100 pb-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Môn học</span>
                    <span className="text-xs font-mono bg-gray-100 px-2.5 py-1 rounded-lg text-gray-600 font-semibold">{selectedItem.maHP}</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900 leading-snug mt-1">{selectedItem.tenMon}</span>
                  <span className="text-sm font-medium text-blue-600 bg-blue-50 w-fit px-3 py-1 rounded-full mt-1 flex items-center gap-1.5">
                    <Award className="w-4 h-4" /> {selectedItem.stc} tín chỉ
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {itemType === 'course' ? (
                    <>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:bg-gray-100 transition-colors">
                        <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mb-1.5">
                          <MapPin className="w-3.5 h-3.5" /> Phòng học
                        </span>
                        <div className="font-semibold text-gray-900">{selectedItem.phong}</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:bg-gray-100 transition-colors">
                        <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mb-1.5">
                          <Clock className="w-3.5 h-3.5" /> Giờ học
                        </span>
                        <div className="font-semibold text-gray-900">
                          Tiết {selectedItem.tietBatDau} - {selectedItem.tietBatDau + selectedItem.soTiet - 1}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:bg-gray-100 transition-colors">
                        <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mb-1.5">
                          <Tag className="w-3.5 h-3.5" /> Nhóm lớp
                        </span>
                        <div className="font-semibold text-gray-900">{selectedItem.nhom || 'N/A'}</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:bg-gray-100 transition-colors">
                        <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mb-1.5">
                          <Calendar className="w-3.5 h-3.5" /> Thứ
                        </span>
                        <div className="font-semibold text-gray-900">{selectedItem.thuStr}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 hover:bg-indigo-50 transition-colors col-span-2">
                        <span className="text-xs text-indigo-500 font-medium flex items-center gap-1.5 mb-1.5">
                          <CalendarDays className="w-3.5 h-3.5" /> Ngày thi
                        </span>
                        <div className="font-bold text-indigo-900 text-lg">{selectedItem.ngayThiStr}</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:bg-gray-100 transition-colors">
                        <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mb-1.5">
                          <Clock className="w-3.5 h-3.5" /> Giờ thi
                        </span>
                        <div className="font-semibold text-gray-900">{selectedItem.gioThi}</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:bg-gray-100 transition-colors">
                        <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mb-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Thời lượng
                        </span>
                        <div className="font-semibold text-gray-900">{selectedItem.thoiLuong} phút</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:bg-gray-100 transition-colors">
                        <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mb-1.5">
                          <MapPin className="w-3.5 h-3.5" /> Phòng thi
                        </span>
                        <div className="font-semibold text-gray-900">{selectedItem.phongThi}</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:bg-gray-100 transition-colors">
                        <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mb-1.5">
                          <ClipboardList className="w-3.5 h-3.5" /> Số báo danh
                        </span>
                        <div className="font-semibold text-gray-900">{selectedItem.sbd}</div>
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setSelectedItem(null)}
                    className={`w-full py-3.5 text-white font-bold rounded-2xl transition-all shadow-md active:scale-[0.98] ${itemType === 'exam' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'}`}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Top Controls */}
      <div className="p-5 border-b border-gray-100 flex flex-col xl:flex-row items-center justify-between gap-5 bg-white/50 backdrop-blur-xl">

        <div className="flex bg-gray-100/80 p-1.5 rounded-2xl border border-gray-200/50 w-full xl:w-auto">
          <button 
            onClick={() => setViewType('week')} 
            className={`flex-1 xl:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${viewType === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
          >
            <CalendarRange className="w-4 h-4" />
            <span className="hidden sm:inline">Lịch theo tuần</span>
            <span className="sm:hidden">Tuần</span>
          </button>
          <button 
            onClick={() => setViewType('semester')} 
            className={`flex-1 xl:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${viewType === 'semester' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Lịch học kỳ</span>
            <span className="sm:hidden">Học kỳ</span>
          </button>
          <button 
            onClick={() => setViewType('exam')} 
            className={`flex-1 xl:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${viewType === 'exam' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
          >
            <GraduationCap className="w-4 h-4" />
            <span className="hidden sm:inline">Lịch thi</span>
            <span className="sm:hidden">Thi</span>
          </button>
        </div>

        {(viewType === 'week' || viewType === 'exam') && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 w-full xl:w-auto justify-between xl:justify-end">
            <button onClick={currentWeek} className={`px-5 py-2.5 rounded-xl font-bold transition-colors ${viewType === 'exam' ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700'}`}>
              Hôm nay
            </button>
            <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl p-1.5 shadow-sm">
              <button onClick={prevWeek} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"><ChevronLeft className="w-5 h-5" /></button>
              <div className="px-4 py-1 flex items-center gap-2 min-w-[220px] justify-center">
                <CalendarDays className={`w-4 h-4 ${viewType === 'exam' ? 'text-indigo-500' : 'text-blue-500'}`} />
                <span className="text-sm font-bold text-gray-700">{formatDate(weekDates[0])} - {formatDate(weekDates[6])}</span>
              </div>
              <button onClick={nextWeek} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </motion.div>
        )}
      </div>

      {/* ======================================= */}
      {/* KHU VỰC 1: XEM THEO TUẦN (GRID MA TRẬN) */}
      {/* ======================================= */}
      {viewType === 'week' && (
        hasScheduleThisWeek ? (
          <div className="overflow-x-auto bg-gray-50/50 p-4">
            <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm">
              <table className="w-full border-collapse min-w-[1000px]">
                <thead>
                  <tr>
                    <th className="w-20 border-b border-r border-gray-200 bg-gray-50"></th>
                    {weekDates.map((date, index) => {
                      const isToday = isSameDate(date, new Date());
                      return (
                        <th key={index} className={`border-b border-gray-200 py-4 px-2 w-[14%] font-normal relative ${index !== 6 ? 'border-r' : ''} ${isToday ? 'bg-blue-50/50' : 'bg-white'}`}>
                          {isToday && <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>}
                          <div className={`font-bold text-sm mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>{index === 6 ? 'Chủ nhật' : `Thứ ${index + 2}`}</div>
                          <div className={`text-xs ${isToday ? 'text-blue-500 font-medium' : 'text-gray-400'}`}>{formatDate(date)}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((tiet) => (
                    <tr key={tiet}>
                      <td className="w-20 min-w-[80px] bg-gray-50 text-gray-500 font-bold text-xs text-center border-r border-b border-gray-200">
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
                              className={`border-b border-gray-200 p-2 align-top transition-all cursor-pointer ${dayIdx !== 6 ? 'border-r' : ''}`}
                            >
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }} 
                                animate={{ opacity: 1, scale: 1 }} 
                                className="flex flex-col h-full bg-gradient-to-br from-amber-200 to-amber-300 rounded-xl p-3 shadow-sm border border-amber-300/50 hover:shadow-md hover:scale-[1.02] transition-all"
                              >
                                <span className="font-bold text-amber-900 text-xs mb-1.5 leading-snug line-clamp-3">{cellData.tenMon}</span>
                                <span className="flex items-center gap-1.5 text-amber-800/80 text-[11px] mt-auto font-semibold">
                                  <MapPin className="w-3 h-3" /> {cellData.phong}
                                </span>
                              </motion.div>
                            </td>
                          );
                        }
                        return <td key={dayIdx} className={`border-b border-gray-100 h-14 bg-white transition-colors hover:bg-gray-50 ${dayIdx !== 6 ? 'border-r' : ''}`}></td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-20 text-center bg-gray-50/50">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 shadow-inner"><BookOpen className="w-10 h-10 text-blue-400" /></div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Trống lịch học</h3>
            <p className="text-gray-500 max-w-md">Không có lịch học trong tuần này. Hãy tận hưởng thời gian nghỉ ngơi nhé!</p>
          </div>
        )
      )}


      {/* ========================================= */}
      {/* KHU VỰC 2: XEM THEO HỌC KỲ (DẠNG DANH SÁCH) */}
      {/* ========================================= */}
      {viewType === 'semester' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white">

          {/* Tabs chuyển học kỳ */}
          <div className="flex border-b border-gray-100 px-4 pt-2 overflow-x-auto custom-scrollbar bg-gray-50/30">
            <button
              onClick={() => setActiveSemTab('all')}
              className={`px-5 py-3.5 font-bold text-sm whitespace-nowrap border-b-2 transition-all ${activeSemTab === 'all' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'}`}
            >
              Tất cả học kỳ
            </button>
            {Object.keys(semesterData).sort().map(hk => (
              <button
                key={hk}
                onClick={() => setActiveSemTab(hk)}
                className={`px-5 py-3.5 font-bold text-sm whitespace-nowrap border-b-2 transition-all ${activeSemTab === hk ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'}`}
              >
                {formatHocKyTitle(hk)}
              </button>
            ))}
          </div>

          {/* Bảng dữ liệu Học kỳ */}
          <div className="overflow-x-auto p-5">
            <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-bold border-b border-gray-200">Mã HP</th>
                    <th className="p-4 font-bold border-b border-gray-200 w-1/4">Môn học</th>
                    <th className="p-4 font-bold border-b border-gray-200 text-center">Nhóm</th>
                    <th className="p-4 font-bold border-b border-gray-200 text-center">STC</th>
                    <th className="p-4 font-bold border-b border-gray-200">Phòng</th>
                    <th className="p-4 font-bold border-b border-gray-200 text-center">Thứ</th>
                    <th className="p-4 font-bold border-b border-gray-200 text-center">Tiết BĐ</th>
                    <th className="p-4 font-bold border-b border-gray-200">Thời gian học</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Object.keys(semesterData).sort().filter(hk => activeSemTab === 'all' || activeSemTab === hk).map(hk => (
                    <React.Fragment key={hk}>
                      <tr>
                        <td colSpan="8" className="bg-blue-50/50 text-blue-800 font-bold px-5 py-3 text-sm border-y border-blue-100 flex items-center gap-2">
                          <CalendarRange className="w-4 h-4 text-blue-500" />
                          {formatHocKyTitle(hk)}
                        </td>
                      </tr>

                      {semesterData[hk].map((course, idx) => (
                        <tr
                          key={idx}
                          onClick={() => handleItemClick(course, 'course')}
                          className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                        >
                          <td className="p-4 text-sm text-gray-600 font-mono">{course.maHP}</td>
                          <td className="p-4 text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{course.tenMon}</td>
                          <td className="p-4 text-sm text-gray-600 text-center">
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded font-medium">{course.nhom}</span>
                          </td>
                          <td className="p-4 text-sm text-center">
                            <span className="font-bold text-blue-600">{course.stc}</span>
                          </td>
                          <td className="p-4 text-sm text-gray-700 font-medium">{course.phong}</td>
                          <td className="p-4 text-sm text-gray-700 text-center font-bold">{course.thuStr}</td>
                          <td className="p-4 text-sm text-gray-700 text-center">{course.tietBatDau}</td>
                          <td className="p-4 text-sm text-gray-600">{course.thoiGianHoc}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}

                  {Object.keys(semesterData).length === 0 && (
                    <tr>
                      <td colSpan="8" className="p-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <BookOpen className="w-12 h-12 text-gray-300 mb-3" />
                          <p className="text-gray-500 font-medium">Không có dữ liệu lịch học</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* ========================================= */}
      {/* KHU VỰC 3: XEM LỊCH THI */}
      {/* ========================================= */}
      {viewType === 'exam' && (
        hasExamThisWeek ? (
          <div className="overflow-x-auto bg-gray-50/50 p-4">
            <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm">
              <table className="w-full border-collapse min-w-[1000px]">
                <thead>
                  <tr>
                    <th className="w-20 border-b border-r border-gray-200 bg-gray-50"></th>
                    {weekDates.map((date, index) => {
                      const isToday = isSameDate(date, new Date());
                      return (
                        <th key={index} className={`border-b border-gray-200 py-4 px-2 w-[14%] font-normal relative ${index !== 6 ? 'border-r' : ''} ${isToday ? 'bg-indigo-50/50' : 'bg-white'}`}>
                          {isToday && <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500"></div>}
                          <div className={`font-bold text-sm mb-1 ${isToday ? 'text-indigo-600' : 'text-gray-700'}`}>{index === 6 ? 'Chủ nhật' : `Thứ ${index + 2}`}</div>
                          <div className={`text-xs ${isToday ? 'text-indigo-500 font-medium' : 'text-gray-400'}`}>{formatDate(date)}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((tiet) => (
                    <tr key={tiet}>
                      <td className="w-20 min-w-[80px] bg-gray-50 text-gray-500 font-bold text-xs text-center border-r border-b border-gray-200">
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
                              className={`border-b border-gray-200 p-2 align-top transition-all cursor-pointer ${dayIdx !== 6 ? 'border-r' : ''}`}
                            >
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }} 
                                animate={{ opacity: 1, scale: 1 }} 
                                className="flex flex-col h-full bg-gradient-to-br from-indigo-200 to-indigo-300 rounded-xl p-3 shadow-sm border border-indigo-300/50 hover:shadow-md hover:scale-[1.02] transition-all relative overflow-hidden"
                              >
                                <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-400/20 rounded-bl-full -z-0"></div>
                                <span className="font-bold text-indigo-900 text-xs mb-1.5 leading-snug line-clamp-3 relative z-10">{cellData.tenMon}</span>
                                <span className="flex items-center gap-1.5 text-indigo-900/80 text-[11px] mt-auto font-semibold relative z-10">
                                  <MapPin className="w-3 h-3" /> {cellData.phongThi}
                                </span>
                              </motion.div>
                            </td>
                          );
                        }
                        return <td key={dayIdx} className={`border-b border-gray-100 h-14 bg-white transition-colors hover:bg-gray-50 ${dayIdx !== 6 ? 'border-r' : ''}`}></td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-20 text-center bg-gray-50/50">
            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-inner"><GraduationCap className="w-10 h-10 text-indigo-400" /></div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Trống lịch thi</h3>
            <p className="text-gray-500 max-w-md">Không có lịch thi nào trong tuần này. Hãy tiếp tục học tập thật tốt nhé!</p>
          </div>
        )
      )}

    </div>
  );
}

export default StudentSchedule;
