import React, { useState, useEffect } from 'react';
import API_URL from '../../api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, CheckCircle2, 
  XCircle, Clock, Loader2, BookOpen, MapPin, 
  AlertCircle, Info, CalendarClock, UserCheck, X
} from 'lucide-react';
import axios from 'axios';

function StudentAttendance({ user }) {
  const [subjects, setSubjects] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedSubject, setSelectedSubject] = useState(null);
  // State quản lý Modal "Xem chi tiết"
  const [detailModal, setDetailModal] = useState({ isOpen: false, data: null });

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

    if (user?.username) fetchData();
  }, [user]);

  const getTietString = (ca) => {
    const c = String(ca).replace(/\D/g, ''); 
    if (c === '1') return '1 - 3';
    if (c === '2') return '4 - 6';
    if (c === '3') return '7 - 9';
    if (c === '4') return '10 - 12';
    return 'Chưa rõ';
  };

  const renderStatus = (status) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('có mặt') || s.includes('hiện diện')) {
      return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Có mặt</span>;
    } else if (s.includes('vắng')) {
      return <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold">Vắng</span>;
    } else if (s.includes('trễ') || s.includes('muộn')) {
      return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">Đi trễ</span>;
    }
    return <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold">{status || 'Chưa điểm danh'}</span>;
  };

  // Hàm chuyển đổi Giờ:Phút:Giây
  const formatExactTime = (datetimeStr) => {
    if (!datetimeStr) return 'Chưa ghi nhận hệ thống';
    const d = new Date(datetimeStr);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' - ' + d.toLocaleDateString('vi-VN');
  };

  const getStats = (maLopHocPhan, tenMonHoc) => {
    const records = attendanceHistory.filter(a => 
      a.MaLopHocPhan === maLopHocPhan || 
      (a.TenMonHoc === tenMonHoc && tenMonHoc)
    );
    const present = records.filter(a => a.TrangThai?.toLowerCase().includes('có mặt')).length;
    const absent = records.filter(a => a.TrangThai?.toLowerCase().includes('vắng')).length;
    return { total: records.length, present, absent };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-orange-500">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-medium text-lg">Đang tổng hợp dữ liệu chuyên cần...</p>
      </div>
    );
  }

  const currentRecords = selectedSubject 
    ? attendanceHistory.filter(a => 
        a.MaLopHocPhan === selectedSubject.MaLopHocPhan || 
        (a.TenMonHoc === selectedSubject.TenMonHoc && selectedSubject.TenMonHoc)
      ) 
    : [];

  return (
    <div className="max-w-4xl mx-auto min-h-[70vh] relative">
      <AnimatePresence mode="wait">
        
        {/* ==================== MÀN HÌNH 1 ==================== */}
        {!selectedSubject && (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-orange-500" /> Danh sách lớp học
                </h2>
                <p className="text-sm text-gray-500 mt-1">Chọn một môn học để xem chi tiết điểm danh</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjects.map((sub, index) => {
                const stats = getStats(sub.MaLopHocPhan, sub.TenMonHoc);
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                    key={sub.MaDiem || sub.MaLopHocPhan || `subject-${index}`}
                    onClick={() => setSelectedSubject(sub)}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 cursor-pointer hover:shadow-md hover:border-orange-300 transition-all group"
                  >
                    <h3 className="font-bold text-gray-800 text-lg mb-3 group-hover:text-orange-600 transition-colors">
                      {sub.TenMonHoc || '(N/A - Môn học lỗi)'}
                    </h3>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600 font-medium mb-4">
                      <span>TC: <span className="text-gray-800 font-bold">{sub.SoTinChi || '?'}</span></span>
                      <span>Mã Lớp HP: <span className="text-gray-800 font-bold">{sub.MaLopHocPhan || 'Chưa rõ'}</span></span>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex gap-3 text-xs font-semibold">
                        {stats.total > 0 ? (
                          <>
                            <span className="text-green-600 bg-green-50 px-2 py-1 rounded-md">Có mặt: {stats.present}</span>
                            {stats.absent > 0 && <span className="text-red-600 bg-red-50 px-2 py-1 rounded-md">Vắng: {stats.absent}</span>}
                          </>
                        ) : (
                          <span className="text-gray-400">Chưa có lịch sử</span>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ==================== MÀN HÌNH 2 ==================== */}
        {selectedSubject && (
          <motion.div 
            key="detail"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 sticky top-0 z-10">
              <button 
                onClick={() => setSelectedSubject(null)}
                className="p-2 hover:bg-orange-50 rounded-full transition-colors text-gray-500 hover:text-orange-600"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-lg font-bold text-gray-800">{selectedSubject.TenMonHoc || 'Chi tiết điểm danh'}</h2>
                <p className="text-sm text-gray-500">Mã Lớp HP: {selectedSubject.MaLopHocPhan || 'Chưa rõ'}</p>
              </div>
            </div>

            <div className="space-y-3 pb-6">
              {currentRecords.length > 0 ? (
                currentRecords.map((record, idx) => (
                  <div key={record.MaDiemDanh || idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                    <div className="space-y-1.5">
                      <p className="text-gray-800 font-extrabold text-base flex items-center gap-2">
                        Ngày: {new Date(record.NgayHoc).toLocaleDateString('vi-VN')}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" /> Tiết: {getTietString(record.CaHoc)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" /> {record.PhongHoc || 'Chưa rõ'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                      {renderStatus(record.TrangThai)}
                      
                      {/* SỰ KIỆN MỞ MODAL CHI TIẾT */}
                      <button 
                        onClick={() => setDetailModal({ isOpen: true, data: record })}
                        className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-xs font-bold transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg"
                      >
                        <Info className="w-3.5 h-3.5" /> Xem chi tiết
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-gray-700 font-bold mb-1">Chưa có dữ liệu điểm danh</h3>
                  <p className="text-gray-500 text-sm">Giảng viên chưa chốt điểm danh cho môn học này.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* MODAL: HIỂN THỊ CHI TIẾT GIỜ GIẤC ĐIỂM DANH               */}
      {/* ========================================================= */}
      <AnimatePresence>
        {detailModal.isOpen && detailModal.data && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white relative">
                <button 
                  onClick={() => setDetailModal({ isOpen: false, data: null })}
                  className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-1">Chi tiết điểm danh</h3>
                <p className="text-blue-100 text-sm opacity-90">{selectedSubject?.TenMonHoc}</p>
              </div>

              <div className="p-6 space-y-5">
                {/* Dòng trạng thái */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">Trạng thái ghi nhận</span>
                  <div className="scale-110 origin-right">{renderStatus(detailModal.data.TrangThai)}</div>
                </div>

                {/* Thông tin thời gian */}
                <div className="space-y-4">
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