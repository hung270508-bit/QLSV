import React, { useEffect, useState, useMemo } from 'react';
import API_URL from '../../api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardCheck, Calendar, ArrowLeft, Clock, 
  MapPin, Users, BookOpen, CheckCircle2, AlertCircle 
} from 'lucide-react';
import axios from 'axios';

const STATUS_OPTIONS = [
  { value: 'Chưa điểm danh', label: 'Chưa điểm danh', color: 'text-gray-500 bg-gray-50 border-gray-200' },
  { value: 'Có mặt', label: 'Có mặt', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { value: 'Vắng mặt', label: 'Vắng mặt', color: 'text-rose-700 bg-rose-50 border-rose-200' }
];

function AttendanceSection({ teachingSchedule = [], students = [] }) {
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [classStudents, setClassStudents] = useState([]); 
  const [isSaving, setIsSaving] = useState(false);

  const today = new Date();

  const isSameDay = (dateString, compareDate) => {
    const date = new Date(dateString);
    return (
      date.getFullYear() === compareDate.getFullYear() &&
      date.getMonth() === compareDate.getMonth() &&
      date.getDate() === compareDate.getDate()
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const todaySchedules = useMemo(() => {
    if (!Array.isArray(teachingSchedule)) return [];
    return teachingSchedule.filter(item => item.NgayHoc && isSameDay(item.NgayHoc, today));
  }, [teachingSchedule, today]);

  const availableSchedules = todaySchedules.length > 0 ? todaySchedules : Array.isArray(teachingSchedule) ? teachingSchedule : [];

  const fetchScheduleAttendance = async (maLopHocPhan, dateString) => {
    try {
      const res = await axios.get(`${API_URL}/api/attendance/course/${maLopHocPhan}/date/${dateString}`);
      const records = Array.isArray(res.data) ? res.data : [];
      if (records.length > 0) {
        const restored = {};
        records.forEach(record => {
          restored[record.MSSV] = record.TrangThai;
        });
        setAttendanceStatus(prev => ({ ...prev, ...restored }));
      }
    } catch (err) {
      console.warn('Không có dữ liệu điểm danh cũ:', err);
    }
  };

  const handleSelectSchedule = async (schedule) => {
    if (!schedule.MaLopHocPhan) return alert("Lỗi dữ liệu: Lớp này không có Mã Lớp Học Phần!");
    
    setSelectedSchedule(schedule);
    setAttendanceStatus({});
    setClassStudents([]);

    try {
      const res = await axios.get(`${API_URL}/api/course-sections/${schedule.MaLopHocPhan}/students`);
      const enrolledStudents = res.data;
      setClassStudents(enrolledStudents);

      const initialStatus = {};
      enrolledStudents.forEach(student => {
        initialStatus[student.MSSV] = 'Chưa điểm danh';
      });
      setAttendanceStatus(initialStatus);

      const todayDate = new Date().toISOString().split('T')[0];
      fetchScheduleAttendance(schedule.MaLopHocPhan, todayDate);
      
    } catch (error) {
      console.error("Lỗi tải danh sách sinh viên:", error);
      alert("Không thể tải danh sách sinh viên!");
    }
  };

  const handleStatusChange = (mssv, value) => {
    setAttendanceStatus(prev => ({ ...prev, [mssv]: value }));
  };

  const handleBack = () => {
    setSelectedSchedule(null);
    setAttendanceStatus({});
    setClassStudents([]);
  };

  const handleSaveAttendance = async () => {
    if (!selectedSchedule || !selectedSchedule.MaLopHocPhan) {
      return alert("Lỗi: Không tìm thấy Mã Lớp Học Phần!");
    }

    setIsSaving(true);
    try {
      const todayDate = new Date().toISOString().split('T')[0];
      
      const attendanceData = classStudents
        .map(student => ({
            MSSV: student.MSSV,
            TrangThai: attendanceStatus[student.MSSV] || 'Chưa điểm danh'
          }))
        .filter(p => p.TrangThai !== 'Chưa điểm danh');

      if (attendanceData.length === 0) {
        setIsSaving(false);
        return alert("Vui lòng điểm danh ít nhất 1 sinh viên trước khi lưu!");
      }

      await axios.post(`${API_URL}/api/attendance/course/${selectedSchedule.MaLopHocPhan}/date/${todayDate}`, { 
        attendance: attendanceData 
      });

      alert('Lưu điểm danh thành công!');
      handleBack(); 

    } catch (error) {
      console.error('Lỗi khi lưu điểm danh:', error);
      alert('Lỗi khi lưu điểm danh! Vui lòng kiểm tra lại.');
    } finally {
      setIsSaving(false);
    }
  };

  const counts = useMemo(() => {
    const summary = { present: 0, absent: 0 };
    Object.values(attendanceStatus).forEach(status => {
      if (status === 'Có mặt') summary.present += 1;
      if (status === 'Vắng mặt') summary.absent += 1;
    });
    return summary;
  }, [attendanceStatus]);

  const hasFinalized = useMemo(() => {
    const vals = Object.values(attendanceStatus);
    if (vals.length === 0) return false;
    return vals.some(s => s && s !== 'Chưa điểm danh');
  }, [attendanceStatus]);

  const renderAvatar = (student) => {
    const initial = student.HoTen?.charAt(0).toUpperCase() || student.MSSV?.charAt(0);
    return (
      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center text-lg font-bold shadow-sm">
        {initial}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-8 shadow-lg relative overflow-hidden"
      >
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
            <ClipboardCheck className="w-10 h-10 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">Điểm danh</h2>
            <p className="text-orange-100 text-lg">Hiển thị lớp theo lịch giảng dạy và thực hiện điểm danh nhanh.</p>
          </div>
        </div>
        <ClipboardCheck className="absolute -right-6 -bottom-6 w-48 h-48 text-white opacity-10 transform -rotate-12" />
      </motion.div>

      {/* MAIN CONTENT */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
        className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 pb-6 border-b border-gray-100">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-orange-600 font-bold mb-1">Lịch học hôm nay</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {todaySchedules.length ? 'Các lớp của hôm nay' : 'Không có lớp hôm nay'}
            </h3>
            <p className="mt-1 text-sm text-gray-500 font-medium">
              {todaySchedules.length ? 'Chọn lớp để xem danh sách sinh viên và điểm danh.' : 'Hiển thị tất cả lớp của giảng viên khi không có lớp trong ngày.'}
            </p>
          </div>
          <div className="bg-orange-50 px-5 py-3 rounded-2xl flex items-center gap-3 border border-orange-100 shadow-inner">
            <Calendar className="w-5 h-5 text-orange-500" /> 
            <span className="font-bold text-orange-700 text-sm tracking-wide">{formatDate(today.toISOString())}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {availableSchedules.map((schedule, index) => (
            <motion.button
              key={schedule.MaLopHocPhan || index}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleSelectSchedule(schedule)}
              className="relative group bg-white text-left rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-orange-200 transition-all overflow-hidden flex flex-col h-full"
            >
              {/* Highlight bar */}
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-orange-400 to-orange-600"></div>
              
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold mb-3 uppercase tracking-wider">
                    {schedule.MaLopHocPhan}
                  </span>
                  <h4 className="text-xl font-bold text-gray-800 leading-tight group-hover:text-orange-600 transition-colors">
                    {schedule.TenMonHoc || schedule.MaMonHoc}
                  </h4>
                </div>
                <div className="flex flex-col items-center justify-center bg-orange-50 w-12 h-12 rounded-2xl shrink-0 border border-orange-100">
                  <span className="text-xs font-bold text-orange-400">Ca</span>
                  <span className="text-lg font-black text-orange-600">{schedule.CaHoc || '-'}</span>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-50 flex items-center gap-4 text-sm text-gray-500 font-medium">
                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {schedule.PhongHoc || 'Chưa xếp'}
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                  <Users className="w-4 h-4 text-gray-400" />
                  Lớp: {schedule.TenLop || schedule.MaLop}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
        
        {availableSchedules.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">Trống lịch giảng dạy</h3>
            <p className="text-gray-500">Bạn không có lịch giảng dạy nào được xếp vào lúc này.</p>
          </div>
        )}
      </motion.div>

      {/* MODAL CHI TIẾT ĐIỂM DANH */}
      <AnimatePresence>
        {selectedSchedule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-gray-50 w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-white px-8 py-6 border-b border-gray-200 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleBack}
                      className="p-3 bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-600 rounded-full transition-colors"
                    >
                      <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-bold tracking-wider">
                          MÃ LHP: {selectedSchedule.MaLopHocPhan}
                        </span>
                        <span className="text-gray-500 text-sm font-medium flex items-center gap-1">
                          <Calendar className="w-4 h-4" /> {formatDate(today.toISOString())}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800">{selectedSchedule.TenMonHoc}</h3>
                    </div>
                  </div>
                  
                  {/* Stats Mini Cards */}
                  <div className="hidden md:flex items-center gap-3">
                    <div className="bg-blue-50 px-4 py-2 rounded-xl text-center border border-blue-100">
                      <p className="text-xs font-bold text-blue-600 uppercase">Tổng SV</p>
                      <p className="text-xl font-black text-blue-800">{classStudents.length}</p>
                    </div>
                    <div className="bg-emerald-50 px-4 py-2 rounded-xl text-center border border-emerald-100">
                      <p className="text-xs font-bold text-emerald-600 uppercase">Có mặt</p>
                      <p className="text-xl font-black text-emerald-800">{counts.present}</p>
                    </div>
                    <div className="bg-rose-50 px-4 py-2 rounded-xl text-center border border-rose-100">
                      <p className="text-xs font-bold text-rose-600 uppercase">Vắng</p>
                      <p className="text-xl font-black text-rose-800">{counts.absent}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* List Students */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {classStudents.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {classStudents.map(student => {
                      const status = attendanceStatus[student.MSSV] || 'Chưa điểm danh';
                      const currentOption = STATUS_OPTIONS.find(opt => opt.value === status);

                      return (
                        <div key={student.MSSV} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow group">
                          {renderAvatar(student)}
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-bold text-gray-800 truncate">{student.HoTen}</p>
                            <p className="text-xs text-gray-500 font-medium">MSSV: {student.MSSV} • Lớp: {student.MaLop || 'N/A'}</p>
                          </div>
                          <div className="shrink-0">
                            <select
                              value={status}
                              onChange={(e) => handleStatusChange(student.MSSV, e.target.value)}
                              className={`w-36 rounded-xl border px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 transition-colors cursor-pointer appearance-none text-center ${currentOption?.color}`}
                              style={{ backgroundImage: 'none' }}
                            >
                              {STATUS_OPTIONS.map(option => (
                                <option key={option.value} value={option.value} className="text-gray-800 bg-white">
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <BookOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-700">Lớp học phần trống</h3>
                    <p className="text-gray-500">Chưa có sinh viên nào đăng ký vào danh sách lớp này.</p>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="bg-white p-6 border-t border-gray-200 shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <AlertCircle className="w-5 h-5 text-orange-500" /> 
                  Hệ thống tự động lưu thời gian khi bấm "Chốt sổ"
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <button
                    onClick={handleBack}
                    className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors w-full sm:w-auto"
                  >
                    Hủy bỏ
                  </button>
                  {hasFinalized && classStudents.length > 0 && (
                    <button
                      onClick={handleSaveAttendance}
                      disabled={isSaving}
                      className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-200 hover:from-orange-600 hover:to-orange-700 transition-all w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {isSaving ? (
                        <>Đang lưu...</>
                      ) : (
                        <><CheckCircle2 className="w-5 h-5" /> Chốt sổ điểm danh</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AttendanceSection; 