import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, Plus, Edit, Trash2, Search, X, 
  RefreshCw, CheckCircle2, AlertCircle, Clock, MapPin, Repeat, CalendarDays, BookOpen, Layers
} from 'lucide-react';
import axios from 'axios';
import API_URL from '../../api';

// Danh sách phòng học cố định hệ thống
const ROOM_LIST = [
  'E-0101', 'E-0102', 'E-0201', 'E-0202', 'E-0301', 'E-0302',
  'A-0101', 'A-0102', 'A-0201', 'A-0202',
  'B-0101', 'B-0102', 'B-0201', 'B-0202',
  'C-0101', 'C-0102', 'C-0201', 'C-0202'
];

function ScheduleManagement() {
  const [schedules, setSchedules] = useState([]);
  const [lhpList, setLhpList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, title: '', message: '', action: null });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const [isRecurring, setIsRecurring] = useState(true);
  const [formData, setFormData] = useState({ 
    MaLopHocPhan: '', NgayHoc: '', NgayBatDau: '', CaHoc: '', PhongHoc: '' 
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedRes, lhpRes] = await Promise.all([
        axios.get(`${API_URL}/api/schedules`),
        axios.get(`${API_URL}/api/teaching-assignments`)
      ]);
      setSchedules(schedRes.data);
      lhpList && setLhpList(lhpRes.data);
    } catch (e) {
      showToast('Lỗi tải dữ liệu!', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getLocalYYYYMMDD = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Hàm chuyển đổi Date -> "Thứ..., DD/MM/YYYY"
  const getDayAndDateStr = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return '';
    const names = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const dayName = names[d.getDay()];
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dayName}, ${dd}/${mm}/${yyyy}`;
  };

  const groupedSchedules = useMemo(() => {
    const filtered = schedules.filter(s =>
      s.TenMonHoc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.TenGiangVien?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.MaLopHocPhan?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groups = {};
    filtered.forEach(s => {
      const dateKey = s.NgayHoc ? getLocalYYYYMMDD(s.NgayHoc) : 'Chưa xác định';
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(s);
    });

    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => parseInt(String(a.CaHoc).replace(/\D/g, '')) - parseInt(String(b.CaHoc).replace(/\D/g, '')));
    });

    return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  }, [schedules, searchTerm]);

  // LOGIC AUTO TÍNH BUỔI HỌC DỰA VÀO TÍN CHỈ
  const selectedLHPInfo = useMemo(() => {
    const lhp = lhpList.find(l => String(l.MaLopHocPhan).trim().toLowerCase() === String(formData.MaLopHocPhan).trim().toLowerCase());
    if (!lhp) return { tinChi: 0, soBuoiHoc: 0, soTietHoc: 0 };
    // Mặc định 3 tín chỉ nếu API chưa trả về
    const tc = lhp.TinChi || lhp.SoTinChi || 3; 
    // Quy chuẩn: 1 Tín chỉ = 3 Ca = 9 Tiết. 
    return { tinChi: tc, soBuoiHoc: tc * 3, soTietHoc: tc * 9 };
  }, [formData.MaLopHocPhan, lhpList]);

  // TẠO LỘ TRÌNH LỊCH HỌC TỰ ĐỘNG (1 Buổi/Tuần)
  const previewDates = useMemo(() => {
    if (!isRecurring || !formData.NgayBatDau || !formData.MaLopHocPhan) return [];
    
    let dates = [];
    let curr = new Date(formData.NgayBatDau + 'T00:00:00'); 
    if (isNaN(curr.getTime())) return [];

    const numSessions = selectedLHPInfo.soBuoiHoc;
    
    for (let i = 0; i < numSessions; i++) {
      dates.push(new Date(curr));
      // Tự động nhảy lịch sang tuần tiếp theo
      curr.setDate(curr.getDate() + 7);
    }
    return dates;
  }, [isRecurring, formData.NgayBatDau, formData.MaLopHocPhan, selectedLHPInfo]);

  const validateScheduleForm = () => {
    const errors = {};
    if (!formData.MaLopHocPhan) errors.MaLopHocPhan = 'Vui lòng chọn lớp học phần';
    if (isRecurring && !editingSchedule) {
      if (!formData.NgayBatDau) errors.NgayBatDau = 'Chọn ngày bắt đầu';
    } else {
      if (!formData.NgayHoc) errors.NgayHoc = 'Vui lòng chọn ngày học';
    }
    if (!formData.CaHoc) errors.CaHoc = 'Vui lòng chọn ca học';
    if (!formData.PhongHoc) errors.PhongHoc = 'Vui lòng chọn phòng học';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateScheduleForm()) return;

    const currentFormLHP = String(formData.MaLopHocPhan).trim().toLowerCase();
    const selectedLHP = lhpList.find(l => String(l.MaLopHocPhan).trim().toLowerCase() === currentFormLHP);
    if (!selectedLHP) { showToast('Không tìm thấy lớp học phần hợp lệ!', 'error'); return; }

    if (isRecurring && !editingSchedule) {
      const isAlreadyScheduled = schedules.some(s => String(s.MaLopHocPhan).trim().toLowerCase() === currentFormLHP);
      if (isAlreadyScheduled) {
        showToast(`Lớp HP ${formData.MaLopHocPhan} đã được xếp lịch chính thức! Vui lòng chọn chế độ "Học bù (1 buổi)".`, 'error');
        return; 
      }
    }

    const caNew = String(formData.CaHoc).replace(/\D/g, ''); 
    let targetDates = [];
    if (editingSchedule) {
      targetDates.push(getLocalYYYYMMDD(formData.NgayHoc));
    } else if (isRecurring && previewDates.length > 0) {
      previewDates.forEach(dateObj => targetDates.push(getLocalYYYYMMDD(dateObj)));
    } else {
      targetDates.push(getLocalYYYYMMDD(formData.NgayHoc));
    }

    // SIÊU LƯỚI LỌC TRÙNG LỊCH: Kiểm tra kỹ Phòng học
    for (const targetDate of targetDates) {
      const displayDate = targetDate.split('-').reverse().join('/'); 

      const conflictingSchedules = schedules.filter(s => {
        if (editingSchedule && s.MaLichHoc === editingSchedule.MaLichHoc) return false;
        const existingDate = getLocalYYYYMMDD(s.NgayHoc);
        const caExisting = String(s.CaHoc).replace(/\D/g, ''); 
        return existingDate === targetDate && caExisting === caNew; 
      });

      for (const conflict of conflictingSchedules) {
        // TRÙNG PHÒNG HỌC -> CHẶN
        if (String(conflict.PhongHoc).trim().toLowerCase() === String(formData.PhongHoc).trim().toLowerCase()) {
          showToast(`Trùng lịch: Phòng ${formData.PhongHoc} đã có lớp học vào Ca ${caNew} ngày ${displayDate}!`, 'error');
          return; 
        }

        const conflictLHP = lhpList.find(l => String(l.MaLopHocPhan).trim().toLowerCase() === String(conflict.MaLopHocPhan).trim().toLowerCase());
        if (conflictLHP) {
          const sameTeacherMa = selectedLHP.MaGiangVien && conflictLHP.MaGiangVien && String(selectedLHP.MaGiangVien) === String(conflictLHP.MaGiangVien);
          const sameTeacherTen = selectedLHP.TenGiangVien && conflictLHP.TenGiangVien && String(selectedLHP.TenGiangVien).trim().toLowerCase() === String(conflictLHP.TenGiangVien).trim().toLowerCase();
          
          if (sameTeacherMa || sameTeacherTen) {
            showToast(`Trùng lịch: GV ${conflictLHP.TenGiangVien} đã bị kẹt dạy lớp khác vào Ca ${caNew} ngày ${displayDate}!`, 'error');
            return;
          }
          
          const sameClassMa = selectedLHP.MaLop && conflictLHP.MaLop && String(selectedLHP.MaLop) === String(conflictLHP.MaLop);
          const sameClassTen = selectedLHP.TenLop && conflictLHP.TenLop && String(selectedLHP.TenLop).trim().toLowerCase() === String(conflictLHP.TenLop).trim().toLowerCase();

          if (sameClassMa || sameClassTen) {
            showToast(`Trùng lịch: Lớp ${conflictLHP.TenLop} đã bận học môn khác vào Ca ${caNew} ngày ${displayDate}!`, 'error');
            return;
          }
        }
      }
    }

    setConfirmDialog({
      show: true,
      title: editingSchedule ? 'Xác nhận cập nhật' : 'Xác nhận xếp lịch',
      message: editingSchedule 
        ? 'Bạn có chắc chắn muốn lưu thay đổi cho buổi học này?' 
        : isRecurring
            ? `Hệ thống sẽ tạo ${previewDates.length} buổi học định kỳ (1 buổi/tuần). Xác nhận lưu?` 
            : 'Bạn có chắc chắn muốn thêm buổi học bù này?',
      action: async () => {
        setConfirmDialog({ show: false, title: '', message: '', action: null });
        try {
          if (editingSchedule) {
            await axios.put(`${API_URL}/api/schedules/${editingSchedule.MaLichHoc}`, {
              MaLopHocPhan: formData.MaLopHocPhan, NgayHoc: getLocalYYYYMMDD(formData.NgayHoc), CaHoc: formData.CaHoc, PhongHoc: formData.PhongHoc
            });
            showToast('Cập nhật lịch học thành công!', 'success');
          } else {
            if (isRecurring && previewDates && previewDates.length > 0) {
              const promises = previewDates.map(dateObj => {
                return axios.post(`${API_URL}/api/schedules`, {
                  MaLopHocPhan: formData.MaLopHocPhan, NgayHoc: getLocalYYYYMMDD(dateObj), CaHoc: formData.CaHoc, PhongHoc: formData.PhongHoc
                });
              });
              await Promise.all(promises);
              showToast(`Đã xếp thành công ${previewDates.length} buổi học định kỳ!`, 'success');
            } else {
              await axios.post(`${API_URL}/api/schedules`, {
                 MaLopHocPhan: formData.MaLopHocPhan, NgayHoc: getLocalYYYYMMDD(formData.NgayHoc), CaHoc: formData.CaHoc, PhongHoc: formData.PhongHoc
              });
              showToast('Thêm lịch học phát sinh thành công!', 'success');
            }
          }
          fetchData();
          handleCloseModal();
        } catch {
          showToast('Có lỗi xảy ra khi lưu lịch học!', 'error');
        }
      }
    });
  };

  const handleDelete = (id) => {
    setConfirmDialog({
      show: true,
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc chắn muốn xóa buổi học này không? Hành động không thể hoàn tác.',
      action: async () => {
        setConfirmDialog({ show: false, action: null });
        try {
          await axios.delete(`${API_URL}/api/schedules/${id}`);
          showToast('Xóa lịch học thành công!', 'success');
          fetchData();
        } catch { showToast('Lỗi khi xóa lịch!', 'error'); }
      }
    });
  };

  const handleEdit = (s) => {
    setEditingSchedule(s);
    setIsRecurring(false);
    setFormData({
      MaLopHocPhan: s.MaLopHocPhan,
      NgayHoc: getLocalYYYYMMDD(s.NgayHoc),
      CaHoc: String(s.CaHoc).replace(/\D/g, ''),
      PhongHoc: s.PhongHoc,
      NgayBatDau: ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false); setEditingSchedule(null);
    setFormData({ MaLopHocPhan: '', NgayHoc: '', CaHoc: '', PhongHoc: '', NgayBatDau: '' });
    setFormErrors({}); setIsRecurring(true);
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><RefreshCw className="animate-spin text-orange-500 w-12 h-12" /></div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 px-4">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded border-l-4 shadow-xl ${toast.type === 'success' ? 'bg-white border-green-500' : 'bg-white border-red-500'}`}>
            {toast.type === 'success' ? <CheckCircle2 className="text-green-500 w-5 h-5" /> : <AlertCircle className="text-red-500 w-5 h-5" />}
            <p className="font-bold text-sm text-gray-800">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 shadow-xl text-white flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-full border border-white/10 flex items-center justify-center shrink-0"><CalendarIcon className="w-6 h-6 text-white" /></div>
          <div>
            <h2 className="text-2xl font-bold">Quản lý lịch học</h2>
            <p className="text-orange-100 text-sm mt-0.5">Xếp lịch giảng dạy và điều phối thời gian biểu học phần</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-white text-orange-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-transform"><Plus className="w-5 h-5"/> Xếp lịch học</button>
      </div>

      {/* Tìm kiếm */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input type="text" placeholder="Tìm kiếm mã lớp học phần, tên môn học, giảng viên..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl shadow-sm outline-none focus:border-orange-500 text-sm font-medium" />
      </div>

      {/* Danh sách Timeline */}
      <div className="space-y-6">
        {groupedSchedules.length > 0 ? groupedSchedules.map(([date, items]) => (
          <div key={date} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-sm md:text-base">
                ▼ {getDayAndDateStr(date)}
              </h3>
              <span className="bg-orange-50 text-orange-600 text-xs font-bold px-3 py-1 rounded-full border border-orange-100">
                {items.length} ca học
              </span>
            </div>
            
            <div className="divide-y divide-gray-100">
              {items.map(s => (
                <div key={s.MaLichHoc} className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-4 items-center w-full">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Ca:</span>
                      <span className="font-black text-orange-700 bg-orange-50 px-3 py-1 rounded-full text-xs border border-orange-100">Ca {String(s.CaHoc).replace(/\D/g, '')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Phòng</span>
                      <span className="font-bold text-gray-800 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-red-500"/> P.{s.PhongHoc}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Môn học</span>
                      <span className="font-semibold text-gray-800 text-sm line-clamp-1">{s.TenMonHoc}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Lớp học phần</span>
                      <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">{s.MaLopHocPhan}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Giảng viên</span>
                      <span className="font-medium text-gray-600 text-sm line-clamp-1">{s.TenGiangVien}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                    <button onClick={() => handleEdit(s)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:text-orange-600 hover:border-orange-300 transition-colors">
                      <Edit className="w-3.5 h-3.5" /> Sửa
                    </button>
                    <button onClick={() => handleDelete(s.MaLichHoc)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:text-red-600 hover:border-red-300 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )) : (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-xl shadow-sm">
            <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium text-sm">Chưa có lịch học nào được xếp.</p>
          </div>
        )}
      </div>

      {/* Modal Sắp Xếp / Sửa Lịch */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseModal} />
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }} className="relative bg-white rounded-xl w-full max-w-[700px] shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-2"><CalendarDays className="w-5 h-5 text-orange-500"/> {editingSchedule ? 'Cập nhật lịch học' : 'Xếp lịch học mới'}</h3>
                <button onClick={handleCloseModal} className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-4">
                <form id="schedule-form" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Lớp học phần <span className="text-red-500">*</span></label>
                    <select 
                      value={formData.MaLopHocPhan} 
                      onChange={e => setFormData({ ...formData, MaLopHocPhan: e.target.value })} 
                      disabled={!!editingSchedule}
                      className={`w-full p-2.5 border rounded-lg outline-none text-sm transition-all ${
                        editingSchedule 
                          ? 'bg-gray-100 border-gray-200 text-gray-500 font-semibold cursor-not-allowed opacity-90' 
                          : `bg-white focus:border-orange-500 ${formErrors.MaLopHocPhan ? 'border-red-500' : 'border-gray-300'}`
                      }`}
                    >
                      <option value="">-- Chọn lớp học phần --</option>
                      {lhpList.map(lhp => (<option key={lhp.MaLopHocPhan} value={lhp.MaLopHocPhan}>[{lhp.MaLopHocPhan}] {lhp.TenMonHoc} - GV: {lhp.TenGiangVien}</option>))}
                    </select>
                    {formErrors.MaLopHocPhan && <p className="text-red-500 text-xs mt-1">{formErrors.MaLopHocPhan}</p>}
                    
                    {/* KHỐI HIỂN THỊ TÍN CHỈ VÀ LỘ TRÌNH TỰ ĐỘNG MỚI */}
                    {formData.MaLopHocPhan && !editingSchedule && isRecurring && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 p-4 bg-orange-50 border border-orange-100 rounded-xl shadow-sm overflow-hidden">
                        <div className="flex flex-col md:flex-row justify-between items-center text-sm w-full gap-3">
                          <span className="font-semibold text-gray-700 flex items-center gap-1.5 w-full md:w-auto"><BookOpen className="w-4 h-4 text-orange-500"/> Tín chỉ môn: <span className="text-orange-600 font-black text-base ml-1">{selectedLHPInfo.tinChi} TC</span></span>
                          <span className="font-semibold text-gray-700 flex items-center gap-1.5 w-full md:w-auto"><Layers className="w-4 h-4 text-orange-500"/> Tổng số tiết: <span className="text-orange-600 font-black text-base ml-1">{selectedLHPInfo.soTietHoc} tiết</span></span>
                          <span className="font-semibold text-gray-700 flex items-center gap-1.5 w-full md:w-auto"><CalendarDays className="w-4 h-4 text-orange-500"/> Lộ trình: <span className="text-orange-600 font-black text-base ml-1">{selectedLHPInfo.soBuoiHoc} buổi học</span></span>
                        </div>
                      </motion.div>
                    )}

                    {editingSchedule && (
                      <p className="text-xs text-orange-600 mt-1.5 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5"/> 
                        Không thể thay đổi lớp học phần khi đang cập nhật lịch đã xếp
                      </p>
                    )}
                  </div>

                  {!editingSchedule && (
                    <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                      <button type="button" onClick={() => setIsRecurring(true)} className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-all ${isRecurring ? 'bg-orange-500 text-white shadow-sm border-orange-600' : 'text-gray-500 border-transparent'}`}><Repeat className="w-3.5 h-3.5"/> Lặp định kỳ</button>
                      <button type="button" onClick={() => setIsRecurring(false)} className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-all ${!isRecurring ? 'bg-orange-500 text-white shadow-sm border-orange-600' : 'text-gray-500 border-transparent'}`}><Clock className="w-3.5 h-3.5"/> Học bù (1 buổi)</button>
                    </div>
                  )}

                  <div className="p-5 border border-gray-200 rounded-xl bg-gray-50/50 space-y-5">
                    {isRecurring && !editingSchedule ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Ngày bắt đầu học <span className="text-red-500">*</span></label>
                            <input type="date" value={formData.NgayBatDau} onChange={e => setFormData({ ...formData, NgayBatDau: e.target.value })} className={`w-full p-2.5 bg-white border rounded-lg outline-none text-sm focus:border-orange-500 ${formErrors.NgayBatDau ? 'border-red-500' : 'border-gray-300'}`}/>
                            {formErrors.NgayBatDau && <p className="text-red-500 text-xs mt-1">{formErrors.NgayBatDau}</p>}
                            {/* Chú thích hiển thị ngày rõ ràng bằng tiếng Việt */}
                            {formData.NgayBatDau && !formErrors.NgayBatDau && (
                              <p className="text-blue-600 text-xs mt-1.5 font-bold flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5"/> Lịch khởi động: {getDayAndDateStr(formData.NgayBatDau)}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Dự kiến kết thúc</label>
                            <input type="text" value={previewDates.length > 0 ? getDayAndDateStr(getLocalYYYYMMDD(previewDates[previewDates.length - 1])) : ''} disabled placeholder="Hệ thống tự động tính toán..." className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm font-bold text-gray-500 cursor-not-allowed"/>
                            {previewDates.length > 0 && (
                              <p className="text-emerald-600 text-xs mt-1.5 font-bold flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5"/>
                                Buổi {selectedLHPInfo.soBuoiHoc}: Mở hệ thống nhập điểm
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Phòng học <span className="text-red-500">*</span></label>
                            <select value={formData.PhongHoc} onChange={e => setFormData({ ...formData, PhongHoc: e.target.value })} className={`w-full p-2.5 bg-white border rounded-lg outline-none text-sm focus:border-orange-500 ${formErrors.PhongHoc ? 'border-red-500' : 'border-gray-300'}`}>
                              <option value="">-- Chọn Phòng --</option>
                              {ROOM_LIST.map(r => <option key={r} value={r}>Phòng {r}</option>)}
                            </select>
                            {formErrors.PhongHoc && <p className="text-red-500 text-xs mt-1">{formErrors.PhongHoc}</p>}
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Ca học <span className="text-red-500">*</span></label>
                            <select value={formData.CaHoc} onChange={e => setFormData({ ...formData, CaHoc: e.target.value })} className={`w-full p-2.5 bg-white border rounded-lg outline-none text-sm focus:border-orange-500 ${formErrors.CaHoc ? 'border-red-500' : 'border-gray-300'}`}>
                              <option value="">-- Chọn Ca --</option>
                              <option value="1">Ca 1 (Tiết 1-3 | 07:00 - 09:30)</option>
                              <option value="2">Ca 2 (Tiết 4-6 | 09:30 - 12:00)</option>
                              <option value="3">Ca 3 (Tiết 7-9 | 12:30 - 14:30)</option>
                              <option value="4">Ca 4 (Tiết 10-12 | 14:30 - 16:30)</option>
                            </select>
                            {formErrors.CaHoc && <p className="text-red-500 text-xs mt-1">{formErrors.CaHoc}</p>}
                          </div>
                        </div>
                      </>
                    ) : (
                      // FORM CHO "HỌC BÙ (1 BUỔI)" HOẶC "SỬA LỊCH"
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div>
                          <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Ngày học <span className="text-red-500">*</span></label>
                          <input type="date" value={formData.NgayHoc} onChange={e => setFormData({ ...formData, NgayHoc: e.target.value })} className={`w-full p-2.5 bg-white border rounded-lg outline-none text-sm focus:border-orange-500 ${formErrors.NgayHoc ? 'border-red-500' : 'border-gray-300'}`}/>
                          {formErrors.NgayHoc && <p className="text-red-500 text-xs mt-1">{formErrors.NgayHoc}</p>}
                          {formData.NgayHoc && !formErrors.NgayHoc && (
                            <p className="text-blue-600 text-[11px] mt-1.5 font-bold flex items-center gap-1"><CalendarDays className="w-3 h-3"/> {getDayAndDateStr(formData.NgayHoc)}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Phòng học <span className="text-red-500">*</span></label>
                          <select value={formData.PhongHoc} onChange={e => setFormData({ ...formData, PhongHoc: e.target.value })} className={`w-full p-2.5 bg-white border rounded-lg outline-none text-sm focus:border-orange-500 ${formErrors.PhongHoc ? 'border-red-500' : 'border-gray-300'}`}>
                            <option value="">-- Chọn Phòng --</option>
                            {ROOM_LIST.map(r => <option key={r} value={r}>Phòng {r}</option>)}
                          </select>
                          {formErrors.PhongHoc && <p className="text-red-500 text-xs mt-1">{formErrors.PhongHoc}</p>}
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Ca học <span className="text-red-500">*</span></label>
                          <select value={formData.CaHoc} onChange={e => setFormData({ ...formData, CaHoc: e.target.value })} className={`w-full p-2.5 bg-white border rounded-lg outline-none text-sm focus:border-orange-500 ${formErrors.CaHoc ? 'border-red-500' : 'border-gray-300'}`}>
                            <option value="">-- Chọn Ca --</option>
                            <option value="1">Ca 1 (Tiết 1-3 | 07:00 - 09:30)</option>
                            <option value="2">Ca 2 (Tiết 4-6 | 09:30 - 12:00)</option>
                            <option value="3">Ca 3 (Tiết 7-9 | 12:30 - 14:30)</option>
                            <option value="4">Ca 4 (Tiết 10-12 | 14:30 - 16:30)</option>
                          </select>
                          {formErrors.CaHoc && <p className="text-red-500 text-xs mt-1">{formErrors.CaHoc}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              </div>

              <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors">Hủy</button>
                <button form="schedule-form" type="submit" className="px-5 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition-colors shadow-sm">
                  {editingSchedule ? 'Lưu thay đổi' : 'Xác nhận xếp lịch'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Dialog */}
      <AnimatePresence>
        {confirmDialog.show && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="bg-white rounded-xl p-6 w-full max-w-sm text-center shadow-2xl border border-gray-100">
              <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-3 border border-orange-100"><AlertCircle className="w-6 h-6" /></div>
              <h3 className="text-base font-bold text-gray-800 mb-1.5">{confirmDialog.title}</h3>
              <p className="text-gray-500 text-xs md:text-sm mb-5 leading-relaxed font-medium">{confirmDialog.message}</p>
              <div className="flex gap-2.5">
                <button onClick={() => setConfirmDialog({ show: false })} className="flex-1 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Hủy</button>
                <button onClick={confirmDialog.action} className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition-colors shadow-sm">Xác nhận</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ScheduleManagement;