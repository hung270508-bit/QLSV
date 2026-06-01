import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Navigation, CalendarRange, Loader2, BookOpen } from 'lucide-react';
import axios from 'axios';

function StudentSchedule({ user }) {
  const [viewType, setViewType] = useState('week'); 
  
  // Khởi tạo ngày hiện tại
  const [currentDate, setCurrentDate] = useState(new Date()); 
  
  const [allSchedules, setAllSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Gọi API lấy dữ liệu Lịch học thật từ Backend
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/schedule/student/${user?.username}`);
        
        // Chuyển đổi dữ liệu (Ca -> Tiết, NgayHoc -> Date object)
        const formattedData = response.data.map(item => {
          let tietBatDau = 1;
          let soTiet = 3;
          
          // Quy đổi Ca học sang Tiết bắt đầu (Giả sử: Ca 1 từ tiết 1, Ca 2 từ tiết 4...)
          const ca = String(item.CaHoc).trim();
          if (ca === '1') { tietBatDau = 1; soTiet = 3; }
          else if (ca === '2') { tietBatDau = 4; soTiet = 3; }
          else if (ca === '3') { tietBatDau = 7; soTiet = 3; }
          else if (ca === '4') { tietBatDau = 10; soTiet = 3; }

          return {
            id: item.MaLichHoc || Math.random(),
            tenMon: item.TenMonHoc || 'Môn học chưa xác định',
            phong: item.PhongHoc || 'Chưa xếp phòng',
            ngayHoc: new Date(item.NgayHoc), // Chuyển String từ DB thành Object Ngày tháng
            tietBatDau: tietBatDau,
            soTiet: soTiet
          };
        });

        setAllSchedules(formattedData);
      } catch (error) {
        console.error("Lỗi khi tải lịch học:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.username) {
      fetchSchedule();
    }
  }, [user]);

  // 2. Logic tính toán các ngày trong tuần (Thứ 2 đến Chủ nhật)
  const getWeekDates = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Điều chỉnh để Thứ 2 là đầu tuần
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

  // Điều hướng lịch
  const nextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(currentDate.getDate() + 7);
    setCurrentDate(next);
  };

  const prevWeek = () => {
    const prev = new Date(currentDate);
    prev.setDate(currentDate.getDate() - 7);
    setCurrentDate(prev);
  };

  const currentWeek = () => setCurrentDate(new Date());

  const formatDate = (date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  // Hàm kiểm tra 2 ngày có trùng nhau không
  const isSameDate = (date1, date2) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  // 3. THUẬT TOÁN TẠO MA TRẬN TKB TỰ ĐỘNG KHỚP NGÀY
  const matrix = Array(12).fill(null).map(() => Array(7).fill(null));

  allSchedules.forEach(item => {
    // Dò xem ngày học của môn này có rơi vào 1 trong 7 ngày của tuần đang mở không
    const dayIdx = weekDates.findIndex(date => isSameDate(date, item.ngayHoc));

    // Nếu tìm thấy (tức là có học trong tuần này)
    if (dayIdx !== -1) {
      const startRow = item.tietBatDau - 1; 

      if (startRow >= 0 && startRow < 12) {
        matrix[startRow][dayIdx] = item; // Đặt môn học vào ô

        // Đánh dấu SKIP cho các ô phía dưới bị gộp (rowSpan)
        for (let i = 1; i < item.soTiet; i++) {
          if (startRow + i < 12) {
            matrix[startRow + i][dayIdx] = 'SKIP';
          }
        }
      }
    }
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-blue-500 bg-white rounded-2xl shadow-sm border border-gray-200">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-medium">Đang đồng bộ thời khóa biểu...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Top Controls */}
      <div className="p-4 border-b border-gray-200 flex flex-col xl:flex-row items-center justify-between gap-4">
        
        {/* Toggle Tuần / Học kỳ */}
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" name="viewType" 
              checked={viewType === 'week'} onChange={() => setViewType('week')}
              className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="text-gray-700 font-medium">Xem TKB Tuần</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer opacity-50">
            <input 
              type="radio" name="viewType" disabled
              checked={viewType === 'semester'} onChange={() => setViewType('semester')}
              className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="text-gray-700 font-medium">Xem TKB Học Kỳ (Bảo trì)</span>
          </label>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center gap-2">
          <button 
            onClick={currentWeek}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            Tuần hiện tại
          </button>
          
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-1">
            <button onClick={prevWeek} className="p-1.5 hover:bg-gray-200 rounded-md transition-colors text-gray-600">
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="px-4 py-1 flex items-center gap-2 min-w-[240px] justify-center bg-white border border-gray-200 rounded-md shadow-sm">
              <CalendarRange className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                Tuần: {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
              </span>
            </div>
            
            <button onClick={nextWeek} className="p-1.5 hover:bg-gray-200 rounded-md transition-colors text-gray-600">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Lưới Lịch Học */}
      {allSchedules.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[1000px]">
            {/* Header các ngày trong tuần */}
            <thead>
              <tr>
                <th className="w-20 border border-gray-200 bg-white"></th>
                {weekDates.map((date, index) => (
                  <th key={index} className="border border-white bg-[#407BCA] text-white py-3 px-2 w-[14%] font-normal">
                    <div className="font-bold text-base mb-1">
                      {index === 6 ? 'Chủ nhật' : `Thứ ${index + 2}`}
                    </div>
                    <div className="text-xs text-blue-100">{formatDate(date)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            
            {/* Body các tiết học */}
            <tbody>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((tiet) => (
                <tr key={tiet}>
                  {/* Cột hiển thị Tiết */}
                  <td className="border border-white bg-[#407BCA] text-white text-center py-4 font-semibold text-sm">
                    Tiết {tiet}
                  </td>

                  {/* Các ô lịch học trong tuần */}
                  {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                    const cellData = matrix[tiet - 1][dayIdx];

                    if (cellData === 'SKIP') return null;

                    if (cellData) {
                      return (
                        <td 
                          key={dayIdx} 
                          rowSpan={cellData.soTiet} 
                          className="border border-gray-200 bg-[#FDE28A] p-3 align-top transition-colors cursor-pointer hover:brightness-95 shadow-sm"
                        >
                          <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="flex flex-col h-full"
                          >
                            <span className="font-bold text-gray-800 text-sm mb-2 leading-relaxed">
                              {cellData.tenMon}
                            </span>
                            <span className="flex items-center gap-1.5 text-gray-700 text-sm mt-auto font-medium bg-orange-100/50 p-1.5 rounded-md w-fit">
                              <Navigation className="w-3.5 h-3.5 text-orange-600" />
                              {cellData.phong}
                            </span>
                          </motion.div>
                        </td>
                      );
                    }

                    return (
                      <td 
                        key={dayIdx} 
                        className="border border-gray-200 h-14 bg-white transition-colors hover:bg-gray-50/50"
                      ></td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-16 text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-10 h-10 text-blue-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">Chưa có lịch học</h3>
          <p className="text-gray-500 max-w-md">
            Hệ thống chưa ghi nhận lịch học nào cho bạn. Hãy kiểm tra lại sau hoặc liên hệ Phòng Đào tạo nếu có sai sót.
          </p>
        </div>
      )}
    </div>
  );
}

export default StudentSchedule;