import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, CheckCircle2, 
  XCircle, Clock, Loader2, BookOpen, MapPin, 
  AlertCircle, Info, CalendarClock, UserCheck, X
} from 'lucide-react';
import axios from 'axios';

// Tự động lấy cấu hình môi trường hoặc mặc định localhost
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000' 
    : 'https://qlsv-huq1.onrender.com';
const API_BASE = `${API_URL}/api`;
function StudentAttendance({ user }) {
  const [subjects, setSubjects] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedSubject, setSelectedSubject] = useState(null);
  // State quản lý Modal "Xem chi tiết"
  const [detailModal, setDetailModal] = useState({ isOpen: false, data: null });

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [gradesRes, attendanceRes] = await Promise.all([
          axios.get(`${API_URL}/api/grades/student/${user?.username}`),
          axios.get(`${API_URL}/api/attendance/student/${user?.username}`)
        ]);

        setSubjects(gradesRes.data);
        setAttendanceHistory(attendanceRes.data);
      } catch (error) {
        console.error("Lỗi tải dữ liệu điểm danh:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.username) {
      fetchData();
    }
  }, [user]);

  // Logic tính tỷ lệ điểm danh chung cho tất cả các môn
  const overallStats = {
    total: attendanceHistory.length,
    present: attendanceHistory.filter(a => a.TrangThai === 'Có mặt').length,
    absent: attendanceHistory.filter(a => a.TrangThai === 'Vắng mặt').length,
    excused: attendanceHistory.filter(a => a.TrangThai === 'Có phép').length,
  };
  const overallPercentage = overallStats.total > 0 
    ? Math.round((overallStats.present / overallStats.total) * 100) 
    : 0;

  // Render trạng thái badge
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Có mặt':
        return <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold border border-green-200"><CheckCircle2 className="w-4 h-4" /> Có mặt</span>;
      case 'Vắng mặt':
        return <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1.5 rounded-full text-xs font-bold border border-red-200"><XCircle className="w-4 h-4" /> Vắng mặt</span>;
      case 'Có phép':
        return <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-xs font-bold border border-amber-200"><AlertCircle className="w-4 h-4" /> Có phép</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-xs font-bold border border-gray-200"><Clock className="w-4 h-4" /> Chưa rõ</span>;
    }
  };

  // Convert Date
  const formatExactTime = (dateStr) => {
    if (!dateStr) return 'Chưa ghi nhận';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' - ' + d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  
  const formatDateOnly = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getTietString = (caStr) => {
    const ca = String(caStr).replace(/\D/g, ''); 
    if (ca === '1') return '1 - 3';
    if (ca === '2') return '4 - 6';
    if (ca === '3') return '7 - 9';
    if (ca === '4') return '10 - 12';
    return caStr || '?';
  };

  // Lọc dữ liệu môn học hiển thị ra Card
  const validSubjects = subjects.filter(subject => {
    // FIX: CHẶN BÓNG MA DỮ LIỆU. Loại bỏ các môn học bị rỗng/null do đã xóa ở bảng môn học
    if (!subject.MaLopHocPhan || !subject.TenMonHoc) return false;
    
    const searchLower = searchTerm.trim().toLowerCase();
    if (searchLower === '') return true;

    return (
      subject.TenMonHoc.toLowerCase().includes(searchLower) ||
      subject.MaLopHocPhan.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-orange-500 bg-white rounded-2xl shadow-sm border border-gray-200">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-medium text-gray-500">Đang tổng hợp dữ liệu điểm danh...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* Header Panel */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-orange-50 to-orange-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
              <CalendarClock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Điểm danh & Chuyên cần</h2>
          </div>
          <p className="text-gray-500 font-medium">Theo dõi lịch sử và tỷ lệ tham gia lớp học của bạn.</p>
        </div>

        <div className="flex items-center gap-6 relative z-10 bg-gray-50 p-5 rounded-2xl border border-gray-100 min-w-[300px]">
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f3f4f6" strokeWidth="3.5" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f97316" strokeWidth="3.5" strokeDasharray={`${overallPercentage}, 100`} className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-lg font-bold text-orange-600 leading-none">{overallPercentage}%</span>
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Tổng quan kỳ này</h4>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm font-medium">
              <div className="flex items-center justify-between"><span className="text-gray-500">Có mặt:</span> <span className="text-green-600 bg-green-50 px-2 rounded-md">{overallStats.present}</span></div>
              <div className="flex items-center justify-between"><span className="text-gray-500">Vắng:</span> <span className="text-red-600 bg-red-50 px-2 rounded-md">{overallStats.absent}</span></div>
              <div className="flex items-center justify-between"><span className="text-gray-500">Có phép:</span> <span className="text-amber-600 bg-amber-50 px-2 rounded-md">{overallStats.excused}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout (Split View) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Danh sách môn học */}
        <div className="lg:col-span-1 space-y-4">
          
          <div className="relative">
            <input 
              type="text" 
              placeholder="Tìm kiếm môn học..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-gray-700 shadow-sm"
            />
            <BookOpen className="absolute right-3.5 top-3.5 w-5 h-5 text-gray-400" />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col max-h-[600px]">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Môn học đang đăng ký ({validSubjects.length})</h3>
            </div>
            
            <div className="overflow-y-auto custom-scrollbar flex-1 p-3 space-y-2">
              {validSubjects.map((sub, idx) => {
                // Tính toán tỷ lệ riêng cho môn này
                const subHistory = attendanceHistory.filter(a => a.MaLopHocPhan === sub.MaLopHocPhan);
                const subPresent = subHistory.filter(a => a.TrangThai === 'Có mặt').length;
                const subPct = subHistory.length > 0 ? Math.round((subPresent / subHistory.length) * 100) : 0;
                
                // Xác định màu sắc cảnh báo
                let borderCol = 'border-transparent';
                let textCol = 'text-gray-500';
                if (subHistory.length > 0) {
                  if (subPct < 80) { borderCol = 'border-red-200'; textCol = 'text-red-500'; }
                  else if (subPct < 90) { borderCol = 'border-amber-200'; textCol = 'text-amber-500'; }
                  else { borderCol = 'border-green-200'; textCol = 'text-green-500'; }
                }

                const isSelected = selectedSubject?.MaLopHocPhan === sub.MaLopHocPhan;

                return (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => setSelectedSubject(sub)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      isSelected 
                        ? 'bg-orange-50 border-orange-500 shadow-sm' 
                        : `bg-white hover:bg-gray-50 ${borderCol}`
                    }`}
                  >
                    <h4 className={`font-bold text-sm mb-1 line-clamp-1 ${isSelected ? 'text-orange-700' : 'text-gray-800'}`}>
                      {sub.TenMonHoc}
                    </h4>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-mono bg-white px-2 py-1 rounded-md text-gray-500 border border-gray-100">
                        {sub.MaLopHocPhan}
                      </span>
                      {subHistory.length > 0 ? (
                        <span className={`text-xs font-bold ${textCol}`}>
                          {subPresent}/{subHistory.length} ({subPct}%)
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Chưa điểm danh</span>
                      )}
                    </div>
                  </motion.button>
                );
              })}

              {validSubjects.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                  <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-medium">Không tìm thấy dữ liệu môn học.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Lịch sử chi tiết */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full min-h-[500px] flex flex-col overflow-hidden">
            
            {!selectedSubject ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-400">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <UserCheck className="w-12 h-12 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-600 mb-2">Chưa chọn môn học</h3>
                <p className="max-w-sm font-medium">Vui lòng chọn một môn học ở danh sách bên trái để xem chi tiết lịch sử điểm danh.</p>
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="inline-block px-3 py-1 bg-gray-700 text-gray-300 text-xs font-bold rounded-lg font-mono mb-2">
                      {selectedSubject.MaLopHocPhan}
                    </span>
                    <h3 className="text-xl font-bold text-white leading-tight">
                      {selectedSubject.TenMonHoc}
                    </h3>
                  </div>
                  
                  {(() => {
                    const h = attendanceHistory.filter(a => a.MaLopHocPhan === selectedSubject.MaLopHocPhan);
                    const p = h.filter(a => a.TrangThai === 'Có mặt').length;
                    const pct = h.length > 0 ? Math.round((p / h.length) * 100) : 0;
                    return (
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex items-center gap-4 border border-white/10 shrink-0">
                        <div>
                          <p className="text-xs text-black-400 font-medium mb-1">Tỷ lệ chuyên cần</p>
                          <p className={`text-xl font-bold ${pct < 80 ? 'text-while-400' : pct < 90 ? 'text-amber-400' : 'text-green-400'}`}>
                            {h.length > 0 ? `${pct}%` : 'N/A'}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="flex-1 p-6 overflow-y-auto bg-gray-50/30">
                  {(() => {
                    const subHistory = attendanceHistory.filter(a => a.MaLopHocPhan === selectedSubject.MaLopHocPhan);
                    
                    if (subHistory.length === 0) {
                      return (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                          <CalendarClock className="w-16 h-16 mb-4 text-gray-200" />
                          <p className="font-medium">Giảng viên chưa điểm danh buổi nào cho môn học này.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {subHistory.map((record, index) => (
                          <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            key={record.MaDiemDanh || index} 
                            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="flex items-start gap-4">
                              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center min-w-[70px] shrink-0">
                                <span className="block text-xs font-bold text-gray-400 uppercase">Ngày</span>
                                <span className="block text-lg font-bold text-gray-800 leading-none mt-1">
                                  {formatDateOnly(record.NgayHoc)}
                                </span>
                              </div>
                              <div className="pt-1">
                                <h5 className="font-bold text-gray-800 text-base mb-1.5 flex items-center gap-2">
                                  Buổi học {index + 1}
                                </h5>
                                <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
                                  <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md"><MapPin className="w-3.5 h-3.5" /> P.{record.PhongHoc || '—'}</span>
                                  <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md"><Clock className="w-3.5 h-3.5" /> Tiết {getTietString(record.CaHoc)}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-4 sm:pt-0 border-gray-100 w-full sm:w-auto">
                              {renderStatusBadge(record.TrangThai)}
                              <button 
                                onClick={() => setDetailModal({ isOpen: true, data: record })}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                title="Xem chi tiết"
                              >
                                <Info className="w-5 h-5" />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* POPUP CHI TIẾT */}
      <AnimatePresence>
        {detailModal.isOpen && detailModal.data && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  Chi tiết điểm danh
                </h3>
                <button 
                  onClick={() => setDetailModal({ isOpen: false, data: null })}
                  className="text-gray-400 hover:text-gray-700 hover:bg-gray-200 p-1.5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="text-center">
                  <div className="inline-block mb-3">
                    {renderStatusBadge(detailModal.data.TrangThai)}
                  </div>
                  <h4 className="font-bold text-gray-800 text-lg">{detailModal.data.TenMonHoc}</h4>
                  <p className="text-sm font-mono text-gray-500 mt-1">{detailModal.data.MaLopHocPhan}</p>
                </div>

                <div className="space-y-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 bg-blue-50 rounded-lg text-blue-600"><CalendarClock className="w-5 h-5" /></div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-0.5">Thời gian Giảng viên chốt sổ</p>
                      <p className="text-gray-800 font-bold">
                        {formatExactTime(detailModal.data.ThoiGianDiemDanh)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 bg-orange-50 rounded-lg text-orange-600"><MapPin className="w-5 h-5" /></div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-0.5">Địa điểm học</p>
                      <p className="text-gray-800 font-bold">Phòng {detailModal.data.PhongHoc || 'Chưa rõ'} — Tiết {getTietString(detailModal.data.CaHoc)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <button 
                  onClick={() => setDetailModal({ isOpen: false, data: null })}
                  className="w-full py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default StudentAttendance;