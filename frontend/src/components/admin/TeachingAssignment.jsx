import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Search, X, RefreshCw, UserCheck, Users, ClipboardCheck, BookOpen, Clock, Building2, BookMarked, Users2 } from 'lucide-react';
import axios from 'axios';
import API_URL from '../../api';

function TeachingAssignment() {
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [khoas, setKhoas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchGV, setSearchGV] = useState('');

  // Hoc ky / nam hoc
  const [hocKySo, setHocKySo] = useState('');
  const [hocKyError, setHocKyError] = useState('');
  const [hocKyInfo, setHocKyInfo] = useState('');
  const [namBatDau, setNamBatDau] = useState('');
  const namKetThuc = useMemo(() => {
    const n = parseInt(namBatDau);
    return !isNaN(n) && namBatDau.length === 4 ? String(n + 1) : '';
  }, [namBatDau]);

  // Khoa & lop theo khoa
  const [selectedKhoa, setSelectedKhoa] = useState('');
  const filteredClasses = useMemo(
    () => selectedKhoa ? classes.filter(c => c.MaKhoa === selectedKhoa) : [],
    [classes, selectedKhoa]
  );

  const filteredGV = useMemo(() =>
    teachers.filter(t =>
      t.HoTen?.toLowerCase().includes(searchGV.toLowerCase()) ||
      t.TenKhoa?.toLowerCase().includes(searchGV.toLowerCase())
    ), [teachers, searchGV]
  );

  const [formData, setFormData] = useState({
    MaLopHocPhan: '', MaMonHoc: '', MaLop: '', MaGiangVien: '',
    HocKy: '', NamHoc: '', SoLuongToiDa: 40
  });
  const [formErrors, setFormErrors] = useState({});
const currentYear = new Date().getFullYear();

  const handleNamBatDauChange = (e) => {
    const val = e.target.value;
    // Chỉ cho phép nhập tối đa 4 ký tự
    if (val.length <= 4) {
      setNamBatDau(val);
    }
  };

  const handleNamBatDauBlur = () => {
    // Khi người dùng click ra ngoài, nếu năm lớn hơn năm hiện tại thì tự động đưa về năm hiện tại
    if (namBatDau.length === 4 && parseInt(namBatDau) > currentYear) {
      setNamBatDau(currentYear.toString());
    }
  };
// Sync HocKy & NamHoc vao formData
  useEffect(() => {
    if (hocKySo && !hocKyError && namBatDau.length === 4 && namKetThuc) {
      // Đã xóa bỏ logic 'HKP', trực tiếp ghép 'HK' với số học kỳ (1, 2, 3)
      const hk = `HK${hocKySo}_${namBatDau}_${namKetThuc}`;
      setFormData(f => ({ ...f, HocKy: hk, NamHoc: `${namBatDau}-${namKetThuc}` }));
    }
  }, [hocKySo, hocKyError, namBatDau, namKetThuc]);

  // Auto-generate ma lop HP
  useEffect(() => {
    if (!editingAssignment && formData.MaMonHoc && formData.HocKy && namBatDau.length === 4 && namKetThuc) {
      const hkCode = `HK${hocKySo}`; // Dùng thẳng HK1, HK2, HK3
      const namCode = `${namBatDau.slice(-2)}${namKetThuc.slice(-2)}`;
      const base = `${formData.MaMonHoc}.${hkCode}${namCode}`;
      const existing = assignments.filter(a => a.MaLopHocPhan?.startsWith(base));
      const stt = String(existing.length + 1).padStart(2, '0');
      setFormData(f => ({ ...f, MaLopHocPhan: `${base}.HP${stt}` }));
    }
  }, [formData.MaMonHoc, formData.HocKy, editingAssignment, hocKySo, namBatDau, namKetThuc, assignments]);

  const handleHocKyChange = (val) => {
    setHocKySo(val);
    setHocKyError('');
    setHocKyInfo('');
    if (val === '') return;
    const num = parseInt(val);
    if (isNaN(num) || num < 1 || num > 3 || val.includes('.') || val.includes('-')) {
      setHocKyError('Học kỳ chỉ 1, 2 hoặc 3');
    } else if (num === 3) {
      setHocKyInfo('Học kỳ bổ sung');
    }
  };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assRes, subRes, teachRes, classRes, khoaRes] = await Promise.all([
        axios.get('${API_URL}/api/teaching-assignments'),
        axios.get('${API_URL}/api/subjects'),
        axios.get('${API_URL}/api/teachers'),
        axios.get('${API_URL}/api/classes'),
        axios.get('${API_URL}/api/faculties')
      ]);
      setAssignments(assRes.data);
      setSubjects(subRes.data);
      setTeachers(teachRes.data);
      setClasses(classRes.data);
      setKhoas(khoaRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const validateAssignmentForm = () => {
    const errors = {};
    if (!editingAssignment && !formData.MaLopHocPhan.trim()) errors.MaLopHocPhan = 'Lỗi tạo mã LHP';
    if (!formData.MaMonHoc) errors.MaMonHoc = 'Vui lòng chọn môn học';
    if (!formData.MaGiangVien) errors.MaGiangVien = 'Vui lòng chọn giảng viên';
    const soluong = parseInt(formData.SoLuongToiDa);
    if (!formData.SoLuongToiDa || isNaN(soluong) || soluong < 1 || soluong > 200) {
      errors.SoLuongToiDa = 'Sĩ số từ 1-200';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAssignmentForm()) return;
    try {
      if (editingAssignment) {
        await axios.put(`${API_URL}/api/teaching-assignments/${editingAssignment.MaLopHocPhan}`, formData);
      } else {
        await axios.post('${API_URL}/api/teaching-assignments', formData);
      }
      fetchData();
      handleCloseModal();
    } catch {
      alert('Lỗi khi lưu phân công!');
    }
  };

  const handleEdit = (a) => {
    setEditingAssignment(a);
    setFormData({
      MaLopHocPhan: a.MaLopHocPhan, MaMonHoc: a.MaMonHoc,
      MaLop: a.MaLop || '', MaGiangVien: a.MaGiangVien,
      HocKy: a.HocKy, NamHoc: a.NamHoc, SoLuongToiDa: a.SoLuongToiDa
    });
  // Trích xuất học kỳ và năm học để fill lại state
    if (a.HocKy) {
      const parts = a.HocKy.split('_');
      // Thêm .replace('P', '3') để tương thích với các dữ liệu cũ đã lỡ lưu là HKP
      setHocKySo(parts[0].replace('HK', '').replace('P', '3')); 
      setNamBatDau(parts[1]);
    }
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa lớp học phần này?')) return;
    try {
      await axios.delete(`${API_URL}/api/teaching-assignments/${id}`);
      fetchData();
    } catch {
      alert('Lỗi khi xóa!');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAssignment(null);
    setFormErrors({});
    setHocKySo(''); setNamBatDau(''); setSelectedKhoa(''); setSearchGV('');
    setFormData({ MaLopHocPhan: '', MaMonHoc: '', MaLop: '', MaGiangVien: '', HocKy: '', NamHoc: '', SoLuongToiDa: 40 });
  };

  const filtered = assignments.filter(a =>
    a.TenMonHoc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.TenLop?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.MaLopHocPhan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.TenGiangVien?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 rounded-3xl p-8 shadow-xl shadow-orange-200/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden"
      >
        {/* Decorator circle */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute right-20 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>

        <div className="flex items-center gap-5 relative z-10">
          <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner">
            <ClipboardCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Quản lý Phân công</h2>
            <p className="text-orange-100 text-sm mt-1 font-medium">Tạo lớp học phần, tự động xếp danh sách sinh viên & lịch học</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02, translateY: -2 }} 
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowModal(true)}
          className="relative z-10 bg-white text-orange-600 px-6 py-3 rounded-xl flex items-center gap-2 font-bold shadow-lg hover:shadow-xl transition-all text-sm"
        >
          <Plus className="w-5 h-5" /> Mở lớp mới ngay
        </motion.button>
      </motion.div>

      {/* Action Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100"
      >
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-orange-500" />
          <input
            type="text"
            placeholder="Tìm kiếm theo mã lớp, tên môn, giảng viên..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm font-medium text-slate-700 transition-all"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={fetchData}
          className="bg-slate-100 text-slate-600 p-3 rounded-xl hover:bg-slate-200 hover:text-slate-800 transition-colors border border-slate-200 flex items-center justify-center"
          title="Làm mới dữ liệu"
        >
          <RefreshCw className="w-5 h-5" />
        </motion.button>
      </motion.div>

      {/* Main Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                {['Mã Lớp HP', 'Tên Môn Học', 'Giảng Viên', 'Lớp Tham Gia', 'Học Kỳ', 'Thao Tác'].map((h, i) => (
                  <th key={h} className={`py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider ${i >= 3 ? 'text-center' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((a, i) => (
                <motion.tr
                  key={a.MaLopHocPhan}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="hover:bg-orange-50/40 transition-colors duration-200 group"
                >
                  <td className="py-4 px-6">
                    <span className="font-mono text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 group-hover:border-orange-200 group-hover:bg-orange-100 group-hover:text-orange-700 transition-colors">
                      {a.MaLopHocPhan}
                    </span>
                  </td>
                  <td className="py-4 px-6">
  <p className="text-sm font-bold text-slate-800">{a.TenMonHoc}</p>
  <p className="text-xs text-slate-400 mt-0.5 font-medium">{a.SoTinChi || 0} tín chỉ</p>
</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{a.TenGiangVien}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    {a.TenLop ? (
                      <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                        {a.TenLop}
                      </span>
                    ) : (
                      <span className="inline-block bg-slate-100 text-slate-500 border border-slate-200 px-3 py-1 rounded-full text-xs font-semibold">
                        Lớp tự do
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                      {a.HocKy.replace('HK', 'Học kỳ ').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <motion.button 
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => handleEdit(a)}
                        className="p-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 border border-blue-100 shadow-sm"
                        title="Sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(a.MaLopHocPhan)}
                        className="p-2 bg-white text-red-500 rounded-lg hover:bg-red-50 border border-red-100 shadow-sm"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                      <Search className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-600 font-semibold text-lg">Không tìm thấy lớp học phần nào</p>
                    <p className="text-slate-400 text-sm mt-1">Hãy thử điều chỉnh từ khóa tìm kiếm</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Modal - The Premium Upgrade */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={handleCloseModal}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="relative bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="bg-slate-50 px-6 py-5 border-b border-slate-100 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-2 rounded-xl">
                    <ClipboardCheck className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">
                      {editingAssignment ? 'Cập nhật Lớp học phần' : 'Mở Lớp học phần mới'}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">Điền đầy đủ thông tin bên dưới để tiếp tục</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <form id="assignment-form" onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Section 1: Thời gian */}
                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wide">
                      <Clock className="w-4 h-4 text-orange-500" /> 1. Thời gian triển khai
                    </h4>
                    <div className="grid grid-cols-2 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Học kỳ <span className="text-red-500">*</span></label>
                        <input
                          type="number" placeholder="Nhập 1, 2 hoặc 3"
                          value={hocKySo} onChange={e => handleHocKyChange(e.target.value)}
                          className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all border bg-white focus:ring-2
                            ${hocKyError ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 
                              hocKyInfo ? 'border-emerald-300 focus:ring-emerald-500/20 focus:border-emerald-500' : 
                              'border-slate-200 focus:ring-orange-500/20 focus:border-orange-500'}`}
                        />
                        {hocKyError && <p className="text-xs text-red-500 mt-1.5 font-medium">{hocKyError}</p>}
                        {hocKyInfo && !hocKyError && <p className="text-xs text-emerald-600 mt-1.5 font-medium">{hocKyInfo}</p>}
                      </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Năm học <span className="text-red-500">*</span></label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number" 
                            placeholder={currentYear.toString()} 
                            value={namBatDau} 
                            onChange={handleNamBatDauChange}
                            onBlur={handleNamBatDauBlur}
                            max={currentYear}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                          />
                          <span className="text-slate-400 font-bold">-</span>
                          <input
                            readOnly value={namKetThuc} placeholder={(currentYear + 1).toString()}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-100 text-slate-500 cursor-not-allowed font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Chi tiết lớp học */}
                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wide">
                      <BookMarked className="w-4 h-4 text-blue-500" /> 2. Chi tiết Lớp học phần
                    </h4>
                    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-5">
                      
                      {/* Khoa & Lớp */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400"/> Khoa quản lý <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={selectedKhoa} onChange={e => { setSelectedKhoa(e.target.value); setFormData(f => ({ ...f, MaLop: '' })); }}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
                          >
                            <option value="">-- Chọn Khoa --</option>
                            {khoas.map(k => <option key={k.MaKhoa} value={k.MaKhoa}>{k.TenKhoa}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-400"/> Lớp sinh viên <span className="text-slate-400 font-normal">(Tùy chọn)</span>
                          </label>
                          <select
                            value={formData.MaLop} onChange={e => setFormData({ ...formData, MaLop: e.target.value })} disabled={!selectedKhoa}
                            className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all font-medium
                              ${selectedKhoa ? 'bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700' : 'bg-slate-100 border border-transparent text-slate-400 cursor-not-allowed'}`}
                          >
                            <option value="">{selectedKhoa ? '-- Lớp tự do (Cho phép ĐK) --' : 'Chọn Khoa trước'}</option>
                            {filteredClasses.map(c => <option key={c.MaLop} value={c.MaLop}>{c.TenLop} ({c.MaLop})</option>)}
                          </select>
                        </div>
                      </div>

                      {/* Môn & Sĩ số */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Môn học <span className="text-red-500">*</span></label>
                          <select
                            value={formData.MaMonHoc} onChange={e => setFormData({ ...formData, MaMonHoc: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-slate-700"
                          >
                            <option value="">-- Chọn Môn học --</option>
                            {subjects.map(s => <option key={s.MaMonHoc} value={s.MaMonHoc}>{s.TenMonHoc} ({s.SoTinChi} TC)</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Sĩ số tối đa</label>
                          <input
                            type="number" min="1" value={formData.SoLuongToiDa} onChange={e => setFormData({ ...formData, SoLuongToiDa: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-bold text-slate-800 text-center"
                          />
                        </div>
                      </div>

                      {/* Preview Mã LHP */}
                      {formData.MaLopHocPhan && !editingAssignment && (
                        <div className="bg-slate-800 rounded-xl p-3 flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-300">Mã LHP tự động tạo:</span>
                          <span className="font-mono text-sm font-bold text-emerald-400 tracking-wider">{formData.MaLopHocPhan}</span>
                        </div>
                      )}

                      {/* Giảng viên */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                          <Users2 className="w-3.5 h-3.5 text-slate-400"/> Phân công Giảng viên <span className="text-red-500">*</span>
                        </label>
                        {!selectedKhoa ? (
                          <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-sm text-slate-400 font-medium text-center italic">
                            Vui lòng chọn Khoa ở trên để tải danh sách Giảng viên
                          </div>
                        ) : (
                          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                            <div className="p-2 border-b border-slate-100 bg-slate-50 relative">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input 
                                placeholder="Tìm tên giảng viên..." value={searchGV} onChange={(e) => setSearchGV(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-white rounded-lg text-sm font-medium outline-none border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all"
                              />
                            </div>
                            <div className="max-h-48 overflow-y-auto custom-scrollbar">
                              {teachers.filter(t => t.MaKhoa === selectedKhoa).filter(t => t.HoTen?.toLowerCase().includes(searchGV.toLowerCase())).map(t => (
                                <div
                                  key={t.MaGiangVien}
                                  onClick={() => setFormData(f => ({ ...f, MaGiangVien: t.MaGiangVien }))}
                                  className={`p-3 cursor-pointer border-b border-slate-50 flex items-center justify-between transition-all
                                    ${formData.MaGiangVien === t.MaGiangVien ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs
                                      ${formData.MaGiangVien === t.MaGiangVien ? 'bg-blue-500 text-white shadow-md shadow-blue-200' : 'bg-slate-100 text-slate-500'}`}>
                                      {t.HoTen.charAt(0)}
                                    </div>
                                    <span className={`text-sm ${formData.MaGiangVien === t.MaGiangVien ? 'font-bold text-blue-700' : 'font-medium text-slate-700'}`}>
                                      {t.HoTen}
                                    </span>
                                  </div>
                                  {formData.MaGiangVien === t.MaGiangVien && (
                                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {formErrors.MaGiangVien && <p className="text-xs text-red-500 mt-1.5 font-medium">{formErrors.MaGiangVien}</p>}
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex gap-3 shrink-0">
                <button
                  type="button" onClick={handleCloseModal}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Hủy thao tác
                </button>
                <button
                  form="assignment-form" type="submit" disabled={!!hocKyError}
                  className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {editingAssignment ? <><Edit className="w-4 h-4"/> Lưu cập nhật</> : <><Plus className="w-4 h-4"/> Tạo Lớp học phần</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Style cho thanh scroll gọn gàng */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  );
}

export default TeachingAssignment;