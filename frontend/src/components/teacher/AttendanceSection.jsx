import React, { useEffect, useState, useMemo, useRef } from 'react';
import API_URL from '../../api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardCheck, Calendar, ArrowLeft, Clock,
  MapPin, Users, BookOpen, CheckCircle2, AlertCircle, History
} from 'lucide-react';
import axios from 'axios';

const STATUS_OPTIONS = [
  { value: 'Chưa điểm danh', label: 'Chưa điểm danh', color: 'text-gray-500 bg-gray-50 border-gray-200' },
  { value: 'Có mặt', label: 'Có mặt', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { value: 'Vắng mặt', label: 'Vắng mặt', color: 'text-rose-700 bg-rose-50 border-rose-200' }
];

function AttendanceSection({ teachingSchedule = [], students = [] }) {
  const [activeTab, setActiveTab] = useState('today'); // 'today' | 'history'

  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(null);
  const [historyDates, setHistoryDates] = useState([]); // List of past dates for a selected course

  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [attendanceTimes, setAttendanceTimes] = useState({}); // Lưu giờ:phút:giây
  const manualEditsRef = useRef(new Set()); // Lưu MSSV đã bị chỉnh tay

  const [classStudents, setClassStudents] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionState, setSessionState] = useState('PENDING');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isTimeUp, setIsTimeUp] = useState(false);

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
  }, [teachingSchedule]);

  // Unique courses for history tab
  const uniqueCourses = useMemo(() => {
    if (!Array.isArray(teachingSchedule)) return [];
    const map = new Map();
    teachingSchedule.forEach(item => {
      if (!map.has(item.MaLopHocPhan)) {
        map.set(item.MaLopHocPhan, item);
      }
    });
    return Array.from(map.values());
  }, [teachingSchedule]);

  const fetchScheduleAttendance = async (maLopHocPhan, dateString) => {
    try {
      const res = await axios.get(`${API_URL}/api/attendance/course/${maLopHocPhan}/date/${dateString}`);
      const records = Array.isArray(res.data) ? res.data : [];
      if (records.length > 0) {
        const restoredStatus = {};
        const restoredTimes = {};
        records.forEach(record => {
          // KHÔNG ghi đè nếu giảng viên đã chỉnh tay
          if (!manualEditsRef.current.has(record.MSSV)) {
            restoredStatus[record.MSSV] = record.TrangThai;
          }
          // Lấy giờ phút giây
          if (record.ThoiGianDiemDanh) {
            const t = new Date(record.ThoiGianDiemDanh);
            restoredTimes[record.MSSV] = `${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')}:${t.getSeconds().toString().padStart(2, '0')}`;
          }
        });
        setAttendanceStatus(prev => ({ ...prev, ...restoredStatus }));
        setAttendanceTimes(prev => ({ ...prev, ...restoredTimes }));
      }

      const sessionRes = await axios.get(`${API_URL}/api/attendance/course/${maLopHocPhan}/session/${dateString}`);
      const { status, timeOpened } = sessionRes.data;
      setSessionState(status);

      if (status === 'OPEN' && timeOpened && activeTab === 'today') {
        const elapsed = (new Date().getTime() - new Date(timeOpened).getTime()) / 1000;
        const remaining = 900 - Math.floor(elapsed);
        if (remaining <= 0) {
          handleCloseSession(maLopHocPhan, dateString);
          setIsTimeUp(true);
        } else {
          setTimeRemaining(remaining);
        }
      } else {
        setTimeRemaining(0);
      }
    } catch (err) {
      console.warn('Không có dữ liệu điểm danh cũ:', err);
    }
  };

  const handleOpenSession = async () => {
    if (!selectedSchedule) return;
    try {
      const todayDate = new Date().toISOString().split('T')[0];
      await axios.post(`${API_URL}/api/attendance/course/${selectedSchedule.MaLopHocPhan}/open/${todayDate}`);
      setSessionState('OPEN');
      setTimeRemaining(900);
    } catch (err) {
      alert("Lỗi khi mở điểm danh");
    }
  };

  const handleCloseSession = async (maLopHocPhan, dateString) => {
    try {
      const lhp = maLopHocPhan || selectedSchedule?.MaLopHocPhan;
      const date = dateString || new Date().toISOString().split('T')[0];
      if (!lhp) return;
      await axios.post(`${API_URL}/api/attendance/course/${lhp}/close/${date}`);
      setSessionState('CLOSED');
      setTimeRemaining(0);
      fetchScheduleAttendance(lhp, date);
    } catch (err) {
      console.error("Lỗi khi chốt sổ:", err);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const loadCourseHistoryDates = async (schedule) => {
    setSelectedSchedule(schedule);
    setHistoryDates([]);
    try {
      const res = await axios.get(`${API_URL}/api/attendance/course/${schedule.MaLopHocPhan}/history-dates`);
      setHistoryDates(res.data);
    } catch (err) {
      console.error("Lỗi lấy lịch sử:", err);
    }
  };

  const handleSelectSchedule = async (schedule, historyDate = null) => {
    if (!schedule.MaLopHocPhan) return alert("Lỗi dữ liệu: Lớp này không có Mã Lớp Học Phần!");

    setSelectedSchedule(schedule);
    setSelectedHistoryDate(historyDate);
    setAttendanceStatus({});
    setAttendanceTimes({});
    manualEditsRef.current.clear();
    setClassStudents([]);
    setIsTimeUp(false);

    try {
      const res = await axios.get(`${API_URL}/api/course-sections/${schedule.MaLopHocPhan}/students`);
      const enrolledStudents = res.data;
      setClassStudents(enrolledStudents);

      const initialStatus = {};
      enrolledStudents.forEach(student => {
        initialStatus[student.MSSV] = 'Chưa điểm danh';
      });
      setAttendanceStatus(initialStatus);

      const targetDate = historyDate || new Date().toISOString().split('T')[0];
      fetchScheduleAttendance(schedule.MaLopHocPhan, targetDate);

    } catch (error) {
      console.error("Lỗi tải danh sách sinh viên:", error);
      alert("Không thể tải danh sách sinh viên!");
    }
  };

  // Auto polling CHỈ DÀNH CHO TAB "HÔM NAY"
  useEffect(() => {
    if (!selectedSchedule || activeTab === 'history') return;

    const todayDate = new Date().toISOString().split('T')[0];

    const intervalId = setInterval(() => {
      fetchScheduleAttendance(selectedSchedule.MaLopHocPhan, todayDate);
    }, 2000);

    return () => clearInterval(intervalId);
  }, [selectedSchedule, activeTab]);

  // Countdown timer local tick
  useEffect(() => {
    if (sessionState !== 'OPEN' || timeRemaining <= 0 || activeTab === 'history') return;
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          const todayDate = new Date().toISOString().split('T')[0];
          handleCloseSession(selectedSchedule?.MaLopHocPhan, todayDate);
          setIsTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionState, timeRemaining, selectedSchedule, activeTab]);

  const handleEarlyClose = async () => {
    setIsTimeUp(false);
    await handleSaveAttendance(true);
  };

  const handleStatusChange = (mssv, value) => {
    manualEditsRef.current.add(mssv);
    setAttendanceStatus(prev => ({ ...prev, [mssv]: value }));
  };

  const handleBack = () => {
    if (activeTab === 'history' && selectedHistoryDate) {
      // Back từ chi tiết 1 ngày lịch sử ra danh sách các ngày
      setSelectedHistoryDate(null);
      setAttendanceStatus({});
      setAttendanceTimes({});
      manualEditsRef.current.clear();
      setClassStudents([]);
    } else {
      setSelectedSchedule(null);
      setAttendanceStatus({});
      setAttendanceTimes({});
      manualEditsRef.current.clear();
      setClassStudents([]);
      setHistoryDates([]);
    }
  };

  const handleSaveAttendance = async (shouldCloseModal = true) => {
    if (!selectedSchedule || !selectedSchedule.MaLopHocPhan) {
      return alert("Lỗi: Không tìm thấy Mã Lớp Học Phần!");
    }

    setIsSaving(true);
    try {
      const targetDate = selectedHistoryDate || new Date().toISOString().split('T')[0];

      const attendanceData = classStudents
        .map(student => ({
          MSSV: student.MSSV,
          TrangThai: attendanceStatus[student.MSSV] || 'Chưa điểm danh'
        }))
        .filter(p => p.TrangThai !== 'Chưa điểm danh');

      if (attendanceData.length > 0) {
        await axios.post(`${API_URL}/api/attendance/course/${selectedSchedule.MaLopHocPhan}/date/${targetDate}`, {
          attendance: attendanceData
        });
      }

      if (activeTab === 'today') {
        await handleCloseSession(selectedSchedule.MaLopHocPhan, targetDate);
        setIsTimeUp(false);
      } else {
        alert("Đã cập nhật lịch sử thành công!");
      }

      manualEditsRef.current.clear(); // Xóa lịch sử chỉnh sửa tay sau khi lưu thành công

      if (shouldCloseModal) {
        handleBack();
      } else {
        fetchScheduleAttendance(selectedSchedule.MaLopHocPhan, targetDate);
      }
    } catch (error) {
      console.error('Lỗi khi lưu điểm danh:', error);
      alert('Lỗi khi lưu điểm danh! Vui lòng kiểm tra lại.');
    } finally {
      setIsSaving(false);
    }
  };

  const counts = useMemo(() => {
    const summary = { present: 0, absent: 0 };
    classStudents.forEach(student => {
      const status = attendanceStatus[student.MSSV];
      if (status === 'Có mặt') summary.present += 1;
      if (status === 'Vắng mặt') summary.absent += 1;
    });
    return summary;
  }, [attendanceStatus, classStudents]);

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
      {/* HEADER TABS */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="bg-white rounded-3xl shadow-sm p-4 relative overflow-hidden flex flex-col sm:flex-row items-center gap-4 border border-gray-100"
      >
        <button
          onClick={() => { setActiveTab('today'); handleBack(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-bold transition-all ${activeTab === 'today'
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-200'
              : 'text-gray-500 hover:bg-orange-50 hover:text-orange-600'
            }`}
        >
          <ClipboardCheck className="w-5 h-5" />
          Lịch dạy hôm nay
        </button>
        <button
          onClick={() => { setActiveTab('history'); handleBack(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-bold transition-all ${activeTab === 'history'
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-200'
              : 'text-gray-500 hover:bg-orange-50 hover:text-orange-600'
            }`}
        >
          <History className="w-5 h-5" />
          Lịch sử điểm danh
        </button>
      </motion.div>

      {/* MAIN CONTENT */}
      {!selectedSchedule ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 pb-6 border-b border-gray-100">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-orange-600 font-bold mb-1">
                {activeTab === 'today' ? 'Lịch dạy hôm nay' : 'Lịch sử điểm danh'}
              </p>
              <h3 className="text-2xl font-bold text-gray-800">
                {activeTab === 'today'
                  ? (todaySchedules.length ? 'Các lớp của hôm nay' : 'Chưa có lịch dạy')
                  : 'Chọn lớp để xem lịch sử'}
              </h3>
            </div>
            {activeTab === 'today' && (
              <div className="bg-orange-50 px-5 py-3 rounded-2xl flex items-center gap-3 border border-orange-100 shadow-inner">
                <Calendar className="w-5 h-5 text-orange-500" />
                <span className="font-bold text-orange-700 text-sm tracking-wide">{formatDate(today.toISOString())}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {(activeTab === 'today' ? todaySchedules : uniqueCourses).map((schedule, index) => (
              <motion.button
                key={schedule.MaLopHocPhan || index}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  if (activeTab === 'today') handleSelectSchedule(schedule);
                  else loadCourseHistoryDates(schedule);
                }}
                className="relative group bg-white text-left rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-orange-200 transition-all overflow-hidden flex flex-col h-full"
              >
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

          {(activeTab === 'today' ? todaySchedules : uniqueCourses).length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-700 mb-2">Trống</h3>
              <p className="text-gray-500">Chưa có dữ liệu lịch dạy hoặc lịch sử.</p>
            </div>
          )}
        </motion.div>
      ) : activeTab === 'history' && !selectedHistoryDate ? (
        /* DANH SÁCH NGÀY TRONG LỊCH SỬ CỦA 1 LỚP */
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
        >
          <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
            <button
              onClick={handleBack}
              className="p-3 bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-600 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-orange-600 font-bold mb-1">
                Lịch sử điểm danh
              </p>
              <h3 className="text-2xl font-bold text-gray-800">
                {selectedSchedule.TenMonHoc}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {historyDates.map((item, i) => (
              <button
                key={i}
                onClick={() => handleSelectSchedule(selectedSchedule, item.Ngay)}
                className="p-5 border border-gray-200 rounded-2xl hover:border-orange-500 hover:shadow-md transition-all text-left flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-lg">{formatDate(item.Ngay)}</p>
                  <p className="text-sm text-gray-500">Bấm để xem chi tiết</p>
                </div>
              </button>
            ))}
          </div>

          {historyDates.length === 0 && (
            <div className="text-center py-16">
              <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Lớp này chưa có bản ghi điểm danh nào trong quá khứ.</p>
            </div>
          )}
        </motion.div>
      ) : null}

      {/* MODAL CHI TIẾT ĐIỂM DANH */}
      <AnimatePresence>
        {selectedSchedule && (activeTab === 'today' || (activeTab === 'history' && selectedHistoryDate)) && (
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
                          <Calendar className="w-4 h-4" /> {formatDate(selectedHistoryDate || today.toISOString())}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800">{selectedSchedule.TenMonHoc}</h3>
                    </div>
                  </div>

                  {/* Stats Mini Cards */}
                  <div className="hidden md:flex items-center gap-3 ml-4">
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
                      const tG = attendanceTimes[student.MSSV]; // Giờ:Phút:Giây

                      return (
                        <div key={student.MSSV} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow group relative">
                          {renderAvatar(student)}
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-bold text-gray-800 truncate">{student.HoTen}</p>
                            <p className="text-xs text-gray-500 font-medium">MSSV: {student.MSSV}</p>
                          </div>
                          <div className="shrink-0 flex flex-col items-end gap-1">
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
                            {/* Hiển thị giờ quét thẻ nếu có mặt (chỉ ở tab Lịch sử) */}
                            {status === 'Có mặt' && tG && activeTab === 'history' && (
                              <div className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {tG}
                              </div>
                            )}
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
              <div className="bg-white p-6 border-t border-gray-200 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  {activeTab === 'today'
                    ? 'Hệ thống tự động lưu thời gian khi bấm "Chốt sổ"'
                    : 'Chỉnh sửa lịch sử sẽ thay đổi kết quả điểm danh của sinh viên trong quá khứ.'}
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <button
                    onClick={handleBack}
                    className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors w-full sm:w-auto"
                  >
                    Hủy bỏ
                  </button>

                  {/* CHỈ HIỂN THỊ NÚT BẮT ĐẦU NẾU LÀ HÔM NAY VÀ CHƯA HẾT 15P */}
                  {activeTab === 'today' && (sessionState === 'PENDING' || (sessionState === 'CLOSED' && !isTimeUp)) && (
                    <button
                      onClick={handleOpenSession}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:from-emerald-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                      <Clock className="w-5 h-5" />
                      Bắt đầu điểm danh
                    </button>
                  )}

                  {activeTab === 'today' && sessionState === 'OPEN' && (
                    <button
                      onClick={handleEarlyClose}
                      disabled={isSaving}
                      className="px-8 py-3 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-200 hover:from-orange-500 hover:to-orange-600 transition-all flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-70"
                    >
                      <Clock className="w-5 h-5 animate-pulse" />
                      {formatTime(timeRemaining)} - Chốt sổ sớm
                    </button>
                  )}

                  {((activeTab === 'today' && sessionState === 'CLOSED' && isTimeUp) || activeTab === 'history') && (
                    <button
                      onClick={() => handleSaveAttendance(true)}
                      disabled={isSaving}
                      className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-200 hover:from-orange-600 hover:to-orange-700 transition-all w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {isSaving ? (
                        <>Đang lưu...</>
                      ) : (
                        <><CheckCircle2 className="w-5 h-5" /> Lưu trạng thái</>
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
