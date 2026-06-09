import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Search, X, RefreshCw, UserCheck, Users, ClipboardCheck, BookOpen, Wand2 } from 'lucide-react';
import axios from 'axios';

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

  // Sync HocKy & NamHoc vao formData
  useEffect(() => {
    if (hocKySo && !hocKyError && namBatDau.length === 4 && namKetThuc) {
      const hk = hocKySo === '3'
        ? `HKP_${namBatDau}_${namKetThuc}`
        : `HK${hocKySo}_${namBatDau}_${namKetThuc}`;
      setFormData(f => ({ ...f, HocKy: hk, NamHoc: `${namBatDau}-${namKetThuc}` }));
    }
  }, [hocKySo, hocKyError, namBatDau, namKetThuc]);

  // Auto-generate ma lop HP khi co du Mon + HocKy
  // Format: {MaMonHoc}.{HKx}{2 so cuoi nam dau}{2 so cuoi nam cuoi}.N{stt}
  // Vi du: CNTT101.HK12526.N01
  useEffect(() => {
    if (!editingAssignment && formData.MaMonHoc && formData.HocKy && namBatDau.length === 4 && namKetThuc) {
      const hkCode = hocKySo === '3' ? 'HKP' : `HK${hocKySo}`;
      const namCode = `${namBatDau.slice(-2)}${namKetThuc.slice(-2)}`;
      const base = `${formData.MaMonHoc}.${hkCode}${namCode}`;
      const existing = assignments.filter(a => a.MaLopHocPhan?.startsWith(base));
      const stt = String(existing.length + 1).padStart(2, '0');
      setFormData(f => ({ ...f, MaLopHocPhan: `${base}.HP${stt}` }));
    }
  }, [formData.MaMonHoc, formData.HocKy, editingAssignment]);

  const handleHocKyChange = (val) => {
    setHocKySo(val);
    setHocKyError('');
    setHocKyInfo('');
    if (val === '') return;
    const num = parseInt(val);
    if (isNaN(num) || num < 1 || num > 3 || val.includes('.') || val.includes('-')) {
      setHocKyError('Hoc ky chi duoc nhap 1, 2 hoac 3');
    } else if (num === 3) {
      setHocKyInfo('Hoc ky bo sung');
    }
  };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [assRes, subRes, teachRes, classRes, khoaRes] = await Promise.all([
        axios.get('http://localhost:5000/api/teaching-assignments'),
        axios.get('http://localhost:5000/api/subjects'),
        axios.get('http://localhost:5000/api/teachers'),
        axios.get('http://localhost:5000/api/classes'),
        axios.get('http://localhost:5000/api/faculties')
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
    if (!editingAssignment) {
      if (!formData.MaLopHocPhan.trim()) {
        errors.MaLopHocPhan = 'Mã lớp học phần không được để trống';
      } else if (formData.MaLopHocPhan.trim().length < 3) {
        errors.MaLopHocPhan = 'Mã lớp học phần phải có ít nhất 3 ký tự';
      } else if (formData.MaLopHocPhan.trim().length > 20) {
        errors.MaLopHocPhan = 'Mã lớp học phần tối đa 20 ký tự';
      } else if (!/^[a-zA-Z0-9_.]+$/.test(formData.MaLopHocPhan.trim())) {
        errors.MaLopHocPhan = 'Chỉ được dùng chữ, số, dấu chấm và gạch dưới';
      }
    }
    if (!formData.MaMonHoc) errors.MaMonHoc = 'Vui lòng chọn môn học';
    if (!formData.MaGiangVien) errors.MaGiangVien = 'Vui lòng chọn giảng viên';
    const soluong = parseInt(formData.SoLuongToiDa);
    if (!formData.SoLuongToiDa || isNaN(soluong) || soluong < 1 || soluong > 200) {
      errors.SoLuongToiDa = 'Sĩ số phải từ 1 đến 200';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAssignmentForm()) return;
    try {
      if (editingAssignment) {
        await axios.put(`http://localhost:5000/api/teaching-assignments/${editingAssignment.MaLopHocPhan}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/teaching-assignments', formData);
      }
      fetchData();
      handleCloseModal();
    } catch {
      alert('Loi khi luu phan cong!');
    }
  };

  const handleEdit = (a) => {
    setEditingAssignment(a);
    setFormData({
      MaLopHocPhan: a.MaLopHocPhan, MaMonHoc: a.MaMonHoc,
      MaLop: a.MaLop || '', MaGiangVien: a.MaGiangVien,
      HocKy: a.HocKy, NamHoc: a.NamHoc, SoLuongToiDa: a.SoLuongToiDa
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xoa lop hoc phan nay?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/teaching-assignments/${id}`);
      fetchData();
    } catch {
      alert('Loi khi xoa!');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAssignment(null);
    setFormErrors({});
    setFormData({ MaLopHocPhan: '', MaMonHoc: '', MaLop: '', MaGiangVien: '', HocKy: 'HK1_2025_2026', NamHoc: '2025-2026', SoLuongToiDa: 40 });
  };

  const filtered = assignments.filter(a =>
    a.TenMonHoc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.TenLop?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.MaLopHocPhan?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-10 h-10 border-orange-500 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3, borderStyle: 'solid' }} />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 shadow-lg shadow-orange-200/50 flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <ClipboardCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Quản lý Phân công & Mở lớp</h2>
            <p className="text-orange-100 text-sm mt-0.5">Tạo lớp học phần, tự động xếp danh sách sinh viên</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          onClick={() => setShowModal(true)}
          className="bg-white text-orange-600 px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold shadow-md hover:shadow-lg transition-shadow text-sm"
        >
          <Plus className="w-4 h-4" /> Mở lớp học phần
        </motion.button>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        className="flex gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-100"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm theo mã lớp, tên môn, giảng viên..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-orange-400 focus:bg-white outline-none text-sm transition-all"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={fetchData}
          className="bg-blue-500 text-white p-2.5 rounded-xl shadow-sm hover:bg-blue-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </motion.button>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <table className="w-full">
          <thead className="bg-gray-50/80 border-b border-gray-100">
            <tr>
              {['Mã Lớp HP', 'Tên Môn Học', 'Giảng Viên', 'Lớp Tham Gia', 'Học Kỳ', 'Thao Tác'].map(h => (
                <th key={h} className={`py-3.5 px-5 text-xs font-bold text-gray-500 uppercase tracking-wide ${h === 'Thao tac' || h === 'Hoc ky' ? 'text-center' : 'text-left'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a, i) => (
              <motion.tr
                key={a.MaLopHocPhan}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.18 }}
                className="border-b border-gray-50 hover:bg-orange-50/30 transition-colors duration-150"
              >
                <td className="py-3.5 px-5">
                  <span className="font-mono text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{a.MaLopHocPhan}</span>
                </td>
                <td className="py-3.5 px-5 text-sm font-semibold text-gray-800">{a.TenMonHoc}</td>
                <td className="py-3.5 px-5 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {a.TenGiangVien}
                  </div>
                </td>
                <td className="py-3.5 px-5">
                  {a.TenLop
                    ? <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-lg text-xs font-semibold">{a.TenLop}</span>
                    : <span className="text-gray-400 text-xs italic">Lop tu do</span>
                  }
                </td>
                <td className="py-3.5 px-5 text-center text-xs text-gray-500 font-medium">{a.HocKy}</td>
                <td className="py-3.5 px-5">
                  <div className="flex items-center justify-center gap-2">
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={() => handleEdit(a)}
                      className="p-1.5 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors border border-orange-100"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(a.MaLopHocPhan)}
                      className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors border border-red-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </td>
              </motion.tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  <ClipboardCheck className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                  <p className="font-medium">Khong co du lieu</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-orange-500" />
                  {editingAssignment ? 'Cập nhật Lớp học phần' : 'Mở Lớp học phần mới'}
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                  onClick={handleCloseModal}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </motion.button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
              

                {/* BUOC 1: Hoc ky & Nam hoc */}
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                  <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> 1 — Học kỳ & Năm học
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Hoc ky <span className="text-red-400">*</span></label>
                      <input
                        type="number"
                        placeholder="1, 2 hoac 3"
                        value={hocKySo}
                        onChange={e => handleHocKyChange(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-xl text-sm outline-none transition-colors bg-white
                          ${hocKyError ? 'border-red-400' : hocKyInfo ? 'border-green-400' : 'border-gray-200 focus:border-orange-400'}`}
                      />
                      {hocKyError && <p className="text-xs text-red-500 mt-1">&#9888; {hocKyError}</p>}
                      {hocKyInfo && !hocKyError && <p className="text-xs text-green-600 mt-1">&#10003; {hocKyInfo}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Nam hoc <span className="text-red-400">*</span></label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number" placeholder="2025" value={namBatDau}
                          onChange={e => setNamBatDau(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400 bg-white"
                        />
                        <span className="text-gray-400 font-bold flex-shrink-0">-</span>
                        <input
                          readOnly value={namKetThuc} placeholder="2026"
                          className="w-full px-3 py-2 border border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                  {formData.HocKy && (
                    <div className="mt-2.5 px-3 py-1.5 bg-white rounded-lg border border-orange-200 text-xs text-orange-700 font-mono">
                      Mã học kỳ: <span className="font-bold">{formData.HocKy}</span>
                    </div>
                  )}
                </div>

                {/* BUOC 2: Khoa & Lop */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> 2 — Khoa &amp; Lớp tham gia
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Khoa <span className="text-red-400">*</span></label>
                    <select
                      value={selectedKhoa}
                      onChange={e => { setSelectedKhoa(e.target.value); setFormData(f => ({ ...f, MaLop: '' })); }}
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl outline-none focus:border-blue-400 text-sm"
                    >
                      <option value="">-- Chọn Khoa --</option>
                      {khoas.map(k => <option key={k.MaKhoa} value={k.MaKhoa}>{k.TenKhoa}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Lớp <span className="text-gray-400 font-normal">(không bắt buộc)</span></label>
                    <select
                      value={formData.MaLop}
                      onChange={e => setFormData({ ...formData, MaLop: e.target.value })}
                      disabled={!selectedKhoa}
                      className={`w-full px-3 py-2 border rounded-xl text-sm outline-none transition-colors
                        ${selectedKhoa ? 'bg-white border-blue-200 focus:border-blue-400' : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'}`}
                    >
                      <option value="">{selectedKhoa ? '-- Lớp tự do --' : '-- Chọn Khoa trước --'}</option>
                      {filteredClasses.map(c => <option key={c.MaLop} value={c.MaLop}>{c.TenLop} ({c.MaLop})</option>)}
                    </select>
                    {selectedKhoa && filteredClasses.length === 0 && (
                      <p className="text-xs text-blue-400 mt-1">Không có lớp nào thuộc khoa này</p>
                    )}
                  </div>
                </div>

                {/* BUOC 3: Mon hoc */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    3 — Môn học <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.MaMonHoc}
                    onChange={e => setFormData({ ...formData, MaMonHoc: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400 transition-colors"
                    required
                  >
                    <option value="">-- Chọn Môn học --</option>
                    {subjects.map(s => <option key={s.MaMonHoc} value={s.MaMonHoc}>{s.TenMonHoc} ({s.MaMonHoc})</option>)}
                  </select>
                </div>

                {/* Ma lop HP auto-generated */}
      

                    {/* BUOC 4: Giang vien (Chi hien thi khi da chon khoa) */}
              {/* BUOC 4: Giang vien (Danh sach filter & scroll) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">4 — Giảng viên <span className="text-red-400">*</span></label>
                
                {!selectedKhoa ? (
                  <div className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500">
                    Vui lòng chọn Khoa 
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                    {/* O tim kiem de filter */}
                    <div className="p-2 border-b border-gray-100">
                      <input 
                        placeholder="Loc ten giang vien..."
                        value={searchGV}
                        onChange={(e) => setSearchGV(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm outline-none focus:bg-white border border-transparent focus:border-orange-300"
                      />
                    </div>
                    
                    {/* Danh sach scroll */}
                    <div className="max-h-40 overflow-y-auto">
                      {teachers
                        .filter(t => t.MaKhoa === selectedKhoa) // Filter theo khoa
                        .filter(t => t.HoTen?.toLowerCase().includes(searchGV.toLowerCase())) // Filter theo text tim kiem
                        .map(t => (
                          <div
                            key={t.MaGiangVien}
                            onClick={() => setFormData(f => ({ ...f, MaGiangVien: t.MaGiangVien }))}
                            className={`p-3 cursor-pointer border-b border-gray-50 flex items-center justify-between transition-colors
                              ${formData.MaGiangVien === t.MaGiangVien 
                                ? 'bg-orange-50 border-l-4 border-l-orange-500' 
                                : 'hover:bg-gray-50'}`}
                          >
                            <span className={`text-sm ${formData.MaGiangVien === t.MaGiangVien ? 'font-bold text-orange-700' : 'text-gray-700'}`}>
                              {t.HoTen}
                            </span>
                            {formData.MaGiangVien === t.MaGiangVien && (
                              <span className="text-[10px] bg-orange-200 text-orange-700 px-2 py-0.5 rounded-full font-bold">DA CHON</span>
                            )}
                          </div>
                        ))}
                        
                      {/* Truong hop khong tim thay */}
                      {teachers.filter(t => t.MaKhoa === selectedKhoa).filter(t => t.HoTen?.toLowerCase().includes(searchGV.toLowerCase())).length === 0 && (
                        <div className="p-4 text-center text-sm text-gray-400">Khong tim thay giang vien phu hop</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

                {/* Si so */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sĩ số tối đa</label>
                  <input
                    type="number" min="1"
                    value={formData.SoLuongToiDa}
                    onChange={e => setFormData({ ...formData, SoLuongToiDa: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400 transition-colors"
                  />
                </div>

                <div className="flex gap-3 pt-3 border-t border-gray-100">
                  <motion.button
                    type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleCloseModal}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 text-sm transition-colors"
                  >
                    Huy
                  </motion.button>
                  <motion.button
                    type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    disabled={!!hocKyError}
                    className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingAssignment ? 'Lưu thay đổi' : 'Tạo lớp & lên danh sách'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TeachingAssignment;