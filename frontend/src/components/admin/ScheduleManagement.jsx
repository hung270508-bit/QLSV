import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, Plus, Edit, Trash2, Search, X, 
  RefreshCw, CheckCircle2, AlertCircle, Clock, MapPin, BookOpen, Repeat, CalendarDays
} from 'lucide-react';
import axios from 'axios';

function ScheduleManagement() {
  const [schedules, setSchedules] = useState([]);
  const [lhpList, setLhpList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // === TOAST NOTIFICATION ===
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // === FORM STATE ===
  const [isRecurring, setIsRecurring] = useState(true); // Default to recurring for better UX
  const [formData, setFormData] = useState({ 
    MaLopHocPhan: '', 
    NgayHoc: '', // For single session
    NgayBatDau: '', // For recurring
    NgayKetThuc: '', // For recurring
    ThuHoc: '', // 0=CN, 1=T2, 2=T3...
    CaHoc: '', 
    PhongHoc: '' 
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedRes, lhpRes] = await Promise.all([
        axios.get('${API_URL}/api/schedules'),
        axios.get('${API_URL}/api/teaching-assignments')
      ]);
      // Sắp xếp lịch học từ mới nhất
      const sortedSchedules = schedRes.data.sort((a, b) => new Date(b.NgayHoc) - new Date(a.NgayHoc));
      setSchedules(sortedSchedules);
      setLhpList(lhpRes.data);
    } catch (e) {
      console.error(e);
      showToast('Lỗi tải dữ liệu!', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Tự động tính toán các ngày sẽ được tạo nếu chọn "Định kỳ"
  const previewDates = useMemo(() => {
    if (!isRecurring || !formData.NgayBatDau || !formData.NgayKetThuc || formData.ThuHoc === '') return [];
    
    let dates = [];
    let curr = new Date(formData.NgayBatDau);
    let end = new Date(formData.NgayKetThuc);
    let targetDay = parseInt(formData.ThuHoc); 
    
    // Safety break to prevent infinite loop if invalid dates
    let loops = 0;
    while(curr <= end && loops < 365) {
      if (curr.getDay() === targetDay) {
        dates.push(new Date(curr));
      }
      curr.setDate(curr.getDate() + 1);
      loops++;
    }
    return dates;
  }, [isRecurring, formData.NgayBatDau, formData.NgayKetThuc, formData.ThuHoc]);

  const validateScheduleForm = () => {
    const errors = {};
    if (!formData.MaLopHocPhan) errors.MaLopHocPhan = 'Vui lòng chọn lớp học phần';
    
    const today = new Date(); 
    today.setHours(0,0,0,0);

    if (isRecurring && !editingSchedule) {
      if (!formData.NgayBatDau) errors.NgayBatDau = 'Chọn ngày bắt đầu';
      if (!formData.NgayKetThuc) errors.NgayKetThuc = 'Chọn ngày kết thúc';
      if (formData.NgayBatDau && formData.NgayKetThuc && new Date(formData.NgayBatDau) > new Date(formData.NgayKetThuc)) {
        errors.NgayKetThuc = 'Ngày kết thúc phải sau ngày bắt đầu';
      }
      if (formData.ThuHoc === '') errors.ThuHoc = 'Chọn thứ học';
      if (previewDates.length === 0 && !errors.NgayKetThuc && formData.ThuHoc !== '') {
        errors.ThuHoc = 'Không có ngày nào khớp với thứ đã chọn trong khoảng thời gian này';
      }
    } else {
      if (!formData.NgayHoc) errors.NgayHoc = 'Vui lòng chọn ngày học';
    }

    if (!formData.CaHoc) errors.CaHoc = 'Vui lòng chọn ca học';
    if (!formData.PhongHoc.trim()) {
      errors.PhongHoc = 'Nhập phòng học';
    } else if (formData.PhongHoc.trim().length > 20) {
      errors.PhongHoc = 'Tối đa 20 ký tự';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateScheduleForm()) return;
    
    try {
      if (editingSchedule) {
        // Cập nhật 1 buổi
        await axios.put(`${API_URL}/api/schedules/${editingSchedule.MaLichHoc}`, {
          MaLopHocPhan: formData.MaLopHocPhan,
          NgayHoc: formData.NgayHoc,
          CaHoc: formData.CaHoc,
          PhongHoc: formData.PhongHoc
        });
        showToast('Cập nhật thành công!', 'success');
      } else {
        if (isRecurring) {
          // Gửi hàng loạt Request cho tạo định kỳ
          const promises = previewDates.map(dateObj => {
            // Fix timezone offset khi toISOString
            const localDate = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            return axios.post('${API_URL}/api/schedules', {
              MaLopHocPhan: formData.MaLopHocPhan,
              NgayHoc: localDate,
              CaHoc: formData.CaHoc,
              PhongHoc: formData.PhongHoc
            });
          });
          await Promise.all(promises);
          showToast(`Đã xếp thành công ${previewDates.length} buổi học!`, 'success');
        } else {
          // Tạo 1 buổi duy nhất
          await axios.post('${API_URL}/api/schedules', {
             MaLopHocPhan: formData.MaLopHocPhan, NgayHoc: formData.NgayHoc, CaHoc: formData.CaHoc, PhongHoc: formData.PhongHoc
          });
          showToast('Thêm lịch học thành công!', 'success');
        }
      }
      fetchData();
      handleCloseModal();
    } catch {
      showToast('Có lỗi xảy ra khi lưu!', 'error');
    }
  };

  const handleEdit = (s) => {
    setEditingSchedule(s);
    setIsRecurring(false); // Bắt buộc false khi edit
    setFormData({
      MaLopHocPhan: s.MaLopHocPhan,
      NgayHoc: s.NgayHoc ? s.NgayHoc.split('T')[0] : '',
      CaHoc: s.CaHoc,
      PhongHoc: s.PhongHoc,
      NgayBatDau: '', NgayKetThuc: '', ThuHoc: ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa lịch học này?')) return;
    try {
      await axios.delete(`${API_URL}/api/schedules/${id}`);
      fetchData();
      showToast('Đã xóa thành công', 'success');
    } catch {
      showToast('Lỗi khi xóa!', 'error');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSchedule(null);
    setFormData({ MaLopHocPhan: '', NgayHoc: '', CaHoc: '', PhongHoc: '', NgayBatDau: '', NgayKetThuc: '', ThuHoc: '' });
    setFormErrors({});
    setIsRecurring(true);
  };

  const getDayOfWeek = (d) => {
    if (!d) return '';
    return ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][new Date(d).getDay()];
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '';

  const dayColors = {
    'Thứ 2': 'text-blue-700 bg-blue-100 border-blue-200', 'Thứ 3': 'text-violet-700 bg-violet-100 border-violet-200',
    'Thứ 4': 'text-emerald-700 bg-emerald-100 border-emerald-200', 'Thứ 5': 'text-amber-700 bg-amber-100 border-amber-200',
    'Thứ 6': 'text-orange-700 bg-orange-100 border-orange-200', 'Thứ 7': 'text-pink-700 bg-pink-100 border-pink-200',
    'Chủ nhật': 'text-red-700 bg-red-100 border-red-200'
  };

  const filtered = schedules.filter(s =>
    s.TenMonHoc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.TenGiangVien?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.MaLopHocPhan?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-8 right-8 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border-l-4 ${toast.type === 'success' ? 'bg-white border-green-500 text-gray-800' : 'bg-white border-red-500 text-gray-800'}`}
          >
            {toast.type === 'success' ? <div className="bg-green-100 p-2 rounded-full"><CheckCircle2 className="w-6 h-6 text-green-600" /></div> : <div className="bg-red-100 p-2 rounded-full"><AlertCircle className="w-6 h-6 text-red-600" /></div>}
            <div><p className="font-bold text-sm">{toast.type === 'success' ? 'Thành công' : 'Thất bại'}</p><p className="text-gray-600 font-medium text-sm">{toast.message}</p></div>
            <button onClick={() => setToast({ show: false })} className="ml-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 rounded-3xl p-8 shadow-xl shadow-orange-200/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden"
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-5 relative z-10">
          <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner">
            <CalendarIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Quản lý Lịch học</h2>
            <p className="text-orange-100 text-sm mt-1 font-medium">Tự động hóa xếp lịch hàng tuần cho học kỳ</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02, translateY: -2 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowModal(true)}
          className="relative z-10 bg-white text-orange-600 px-6 py-3 rounded-xl flex items-center gap-2 font-bold shadow-lg hover:shadow-xl transition-all text-sm"
        >
          <Plus className="w-5 h-5" /> Thêm lịch học
        </motion.button>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100"
      >
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-orange-500" />
          <input
            type="text" placeholder="Tìm kiếm theo mã lớp, tên môn, giảng viên..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm font-medium text-slate-700 transition-all"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={fetchData}
          className="bg-slate-100 text-slate-600 p-3 rounded-xl hover:bg-slate-200 hover:text-slate-800 transition-colors border border-slate-200"
        >
          <RefreshCw className="w-5 h-5" />
        </motion.button>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                {['Thời gian', 'Phòng', 'Môn học', 'Mã Lớp HP', 'Giảng viên', 'Thao tác'].map((h, i) => (
                  <th key={h} className={`py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider ${h === 'Thao tác' ? 'text-center' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((s, i) => {
                const day = getDayOfWeek(s.NgayHoc);
                const dayClass = dayColors[day] || 'text-slate-600 bg-slate-100 border-slate-200';
                return (
                  <motion.tr
                    key={s.MaLichHoc}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                    className="hover:bg-orange-50/40 transition-colors duration-200 group"
                  >
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-black border ${dayClass} uppercase tracking-wider`}>
                          {day}
                        </span>
                        <span className="text-sm font-bold text-slate-800">{formatDate(s.NgayHoc)}</span>
                        <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 rounded-full mt-0.5">Ca {s.CaHoc}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-700">{s.PhongHoc}</td>
                    <td className="py-4 px-6">
                      <p className="text-sm font-bold text-slate-800">{s.TenMonHoc}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
                        {s.MaLopHocPhan}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm font-semibold text-slate-600">{s.TenGiangVien}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleEdit(s)}
                          className="p-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 border border-blue-100 shadow-sm" title="Sửa">
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleDelete(s.MaLichHoc)}
                          className="p-2 bg-white text-red-500 rounded-lg hover:bg-red-50 border border-red-100 shadow-sm" title="Xóa">
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 font-semibold text-lg">Chưa có lịch học nào</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Modal Mới - Tạo lịch tự động */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={handleCloseModal} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="relative bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-slate-50 px-6 py-5 border-b border-slate-100 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-2 rounded-xl">
                    <CalendarDays className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{editingSchedule ? 'Cập nhật lịch học' : 'Sắp xếp lịch học'}</h3>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">Xếp lịch thủ công hoặc tự động theo học kỳ</p>
                  </div>
                </div>
                <button onClick={handleCloseModal} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <form id="schedule-form" onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Chọn Lớp Học Phần */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-orange-500"/> Chọn Lớp Học Phần <span className="text-red-500">*</span></label>
                    <select
                      value={formData.MaLopHocPhan}
                      onChange={e => setFormData({ ...formData, MaLopHocPhan: e.target.value })}
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none text-sm font-medium transition-all ${formErrors.MaLopHocPhan ? 'border-red-400 focus:ring-red-500/20' : 'border-slate-200 focus:ring-orange-500/20 focus:border-orange-500'}`}
                    >
                      <option value="">-- Bấm để chọn lớp đã phân công --</option>
                      {lhpList.map(lhp => (
                        <option key={lhp.MaLopHocPhan} value={lhp.MaLopHocPhan}>
                          [{lhp.MaLopHocPhan}] - {lhp.TenMonHoc} (GV: {lhp.TenGiangVien})
                        </option>
                      ))}
                    </select>
                    {formErrors.MaLopHocPhan && <p className="text-red-500 text-xs mt-1.5 font-medium">{formErrors.MaLopHocPhan}</p>}
                  </div>

                  {/* Toggle Chế độ tạo lịch (Chỉ hiện khi tạo mới) */}
                  {!editingSchedule && (
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button 
                        type="button" onClick={() => setIsRecurring(true)}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${isRecurring ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      ><Repeat className="w-4 h-4"/> Lặp định kỳ (Cả HK)</button>
                      <button 
                        type="button" onClick={() => setIsRecurring(false)}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${!isRecurring ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      ><Clock className="w-4 h-4"/> Chỉ xếp 1 buổi (Học bù)</button>
                    </div>
                  )}

                  {/* Vùng chọn Thời gian */}
                  <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                    {isRecurring && !editingSchedule ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Ngày bắt đầu HK</label>
                            <input type="date" value={formData.NgayBatDau} onChange={e => setFormData({ ...formData, NgayBatDau: e.target.value })}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-orange-500 transition-all"/>
                            {formErrors.NgayBatDau && <p className="text-red-500 text-xs mt-1">{formErrors.NgayBatDau}</p>}
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Ngày kết thúc HK</label>
                            <input type="date" value={formData.NgayKetThuc} onChange={e => setFormData({ ...formData, NgayKetThuc: e.target.value })}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-orange-500 transition-all"/>
                            {formErrors.NgayKetThuc && <p className="text-red-500 text-xs mt-1">{formErrors.NgayKetThuc}</p>}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Học vào Thứ mấy?</label>
                            <select value={formData.ThuHoc} onChange={e => setFormData({ ...formData, ThuHoc: e.target.value })}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-orange-500 font-bold text-blue-700">
                              <option value="">-- Chọn Thứ --</option>
                              <option value="1">Thứ 2</option><option value="2">Thứ 3</option><option value="3">Thứ 4</option>
                              <option value="4">Thứ 5</option><option value="5">Thứ 6</option><option value="6">Thứ 7</option>
                              <option value="0">Chủ nhật</option>
                            </select>
                            {formErrors.ThuHoc && <p className="text-red-500 text-xs mt-1">{formErrors.ThuHoc}</p>}
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Ca học cố định</label>
                            <select value={formData.CaHoc} onChange={e => setFormData({ ...formData, CaHoc: e.target.value })}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-orange-500">
                              <option value="">-- Chọn Ca --</option>
                              <option value="1">Ca 1 (Tiết 1-3)</option><option value="2">Ca 2 (Tiết 4-6)</option>
                              <option value="3">Ca 3 (Tiết 7-9)</option><option value="4">Ca 4 (Tiết 10-12)</option>
                            </select>
                            {formErrors.CaHoc && <p className="text-red-500 text-xs mt-1">{formErrors.CaHoc}</p>}
                          </div>
                        </div>

                        {/* Preview Alert */}
                        {previewDates.length > 0 && (
                          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2">
                            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500"/>
                            <div>
                              Sẽ tự động tạo <span className="font-black text-emerald-600">{previewDates.length} buổi học</span> vào các ngày Thứ {parseInt(formData.ThuHoc) === 0 ? 'Chủ nhật' : parseInt(formData.ThuHoc)+1} trong thời gian trên.
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Chọn Ngày học</label>
                          <input type="date" value={formData.NgayHoc} onChange={e => setFormData({ ...formData, NgayHoc: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-all"/>
                          {formData.NgayHoc && <p className="text-xs text-blue-500 mt-1 font-bold">👉 {getDayOfWeek(formData.NgayHoc)}</p>}
                          {formErrors.NgayHoc && <p className="text-red-500 text-xs mt-1">{formErrors.NgayHoc}</p>}
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Ca học</label>
                          <select value={formData.CaHoc} onChange={e => setFormData({ ...formData, CaHoc: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500">
                            <option value="">-- Chọn Ca --</option>
                            <option value="1">Ca 1 (Tiết 1-3)</option><option value="2">Ca 2 (Tiết 4-6)</option>
                            <option value="3">Ca 3 (Tiết 7-9)</option><option value="4">Ca 4 (Tiết 10-12)</option>
                          </select>
                          {formErrors.CaHoc && <p className="text-red-500 text-xs mt-1">{formErrors.CaHoc}</p>}
                        </div>
                      </div>
                    )}

                    {/* Dùng chung cho cả 2 mode */}
                    <div className="pt-2 border-t border-slate-100">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-red-500"/> Phòng học</label>
                      <input type="text" placeholder="VD: E1-04.08/1" value={formData.PhongHoc} onChange={e => setFormData({ ...formData, PhongHoc: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-bold text-slate-700"/>
                      {formErrors.PhongHoc && <p className="text-red-500 text-xs mt-1.5 font-medium">{formErrors.PhongHoc}</p>}
                    </div>
                  </div>
                </form>
              </div>

              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex gap-3 shrink-0">
                <button type="button" onClick={handleCloseModal} className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors shadow-sm">Hủy</button>
                <button form="schedule-form" type="submit" 
                  className={`flex-1 py-3 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-white
                  ${isRecurring && !editingSchedule ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-orange-500/30' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/30'}`}
                >
                  {editingSchedule ? 'Lưu cập nhật' : isRecurring ? 'Tự động tạo lịch' : 'Thêm 1 buổi'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  );
}

export default ScheduleManagement;