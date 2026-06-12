import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Search, X, ClipboardCheck, BookOpen, AlertCircle, CheckCircle2, UserCheck } from 'lucide-react';
import axios from 'axios';
import ModalPortal, { ConfirmDialog, SuccessDialog, ErrorDialog, Toast } from '../ModalPortal';
import API_URL from '../../api';

function TeachingAssignment() {
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [khoas, setKhoas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & Edit State
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  
  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [searchGV, setSearchGV] = useState('');

  // Dialog & Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, title: '', message: '', action: null });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Hoc ky / nam hoc
  const [hocKySo, setHocKySo] = useState('');
  const [hocKyError, setHocKyError] = useState('');
  const [hocKyInfo, setHocKyInfo] = useState('');
  const [namBatDau, setNamBatDau] = useState('');
  
  const namKetThuc = useMemo(() => {
    const n = parseInt(namBatDau);
    return !isNaN(n) && namBatDau.length === 4 ? String(n + 1) : '';
  }, [namBatDau]);

  // Form Data 
  const [formData, setFormData] = useState({
    MaKhoa: '',
    MaLopHocPhan: '',
    MaMonHoc: '',
    MaGiangVien: '',
    MaLop: '',
    HocKy: '',
    NamHoc: '',
    SoLuongToiDa: 40
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assignRes, subRes, teachRes, classRes, khoaRes] = await Promise.all([
        axios.get(`${API_URL}/api/teaching-assignments`),
        axios.get(`${API_URL}/api/subjects`),
        axios.get(`${API_URL}/api/teachers`),
        axios.get(`${API_URL}/api/classes`),
        axios.get(`${API_URL}/api/faculties`)
      ]);
      setAssignments(assignRes.data);
      setSubjects(subRes.data);
      setTeachers(teachRes.data);
      setClasses(classRes.data);
      setKhoas(khoaRes.data);
    } catch (error) {
      showToast('Lỗi khi tải dữ liệu!', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Lọc Môn học bằng Tiền tố Khoa
  const filteredSubjects = useMemo(() => {
    if (!formData.MaKhoa) return [];
    return subjects.filter(s => {
      if (!s.MaMonHoc) return false;
      return s.MaMonHoc.toUpperCase().startsWith(formData.MaKhoa.toUpperCase());
    });
  }, [formData.MaKhoa, subjects]);

  useEffect(() => {
    let msg = '';
    let err = '';
    if (hocKySo && namBatDau && namBatDau.length === 4) {
      msg = `Học kỳ ${hocKySo} - Năm học ${namBatDau}-${namKetThuc}`;
      const hk = `HK${hocKySo}_${namBatDau}_${namKetThuc}`;
      setFormData(f => ({ ...f, HocKy: hk, NamHoc: `${namBatDau}-${namKetThuc}` }));
    } else if (hocKySo || namBatDau) {
      err = 'Vui lòng nhập đầy đủ Học kỳ và Năm bắt đầu (VD: 2025)';
    }
    setHocKyInfo(msg);
    setHocKyError(err);
  }, [hocKySo, namBatDau, namKetThuc]);

  // =====================================================================
  // KHÔI PHỤC LOGIC TỰ ĐỘNG GEN MÃ LỚP HỌC PHẦN (Y NGUYÊN CỦA BẠN)
  // =====================================================================
  useEffect(() => {
    if (!editingAssignment && formData.MaMonHoc && formData.HocKy && namBatDau.length === 4 && namKetThuc) {
      const hkCode = `HK${hocKySo}`;
      const namCode = `${namBatDau.slice(-2)}${namKetThuc.slice(-2)}`;
      const base = `${formData.MaMonHoc}.${hkCode}${namCode}`;
      
      const existing = assignments.filter(a => a.MaLopHocPhan?.startsWith(base));
      const stt = String(existing.length + 1).padStart(2, '0');
      
      setFormData(f => ({ ...f, MaLopHocPhan: `${base}.HP${stt}` }));
      if (formErrors.MaLopHocPhan) setFormErrors(prev => ({ ...prev, MaLopHocPhan: '' }));
    }
  }, [formData.MaMonHoc, formData.HocKy, editingAssignment, hocKySo, namBatDau, namKetThuc, assignments]);


  const validateForm = () => {
    const errors = {};
    if (!formData.MaKhoa) errors.MaKhoa = 'Vui lòng chọn Khoa.';
    if (!formData.MaMonHoc) errors.MaMonHoc = 'Vui lòng chọn Môn học.';
    if (!formData.MaGiangVien) errors.MaGiangVien = 'Vui lòng chọn Giảng viên.';
    if (!formData.MaLopHocPhan) errors.MaLopHocPhan = 'Vui lòng tạo hoặc nhập Mã lớp học phần.';
    
    // Ràng buộc Sĩ số với custom error message
    const siSo = parseInt(formData.SoLuongToiDa);
    if (!formData.SoLuongToiDa || isNaN(siSo)) {
      errors.SoLuongToiDa = 'Vui lòng nhập Sĩ số.';
    } else if (siSo < 30 || siSo > 80) {
      errors.SoLuongToiDa = 'Sĩ số phải từ 30 đến 80 sinh viên.';
    }

    if (!hocKySo || hocKySo < 1 || hocKySo > 3) errors.HocKy = 'Vui lòng chọn Học kỳ hợp lệ.';
    if (!namBatDau || namBatDau.length !== 4) errors.NamHoc = 'Vui lòng nhập Năm học hợp lệ.';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleKhoaChange = (e) => {
    const maKhoa = e.target.value;
    setFormData(prev => ({ ...prev, MaKhoa: maKhoa, MaMonHoc: '', MaLopHocPhan: '' }));
    if (formErrors.MaKhoa) setFormErrors({ ...formErrors, MaKhoa: '' });
  };

  const handleMonHocChange = (e) => {
    const maMon = e.target.value;
    // Reset mã lớp học phần để kích hoạt lại useEffect sinh mã tự động
    setFormData(prev => ({ ...prev, MaMonHoc: maMon, MaLopHocPhan: '' }));
    if (formErrors.MaMonHoc) setFormErrors({ ...formErrors, MaMonHoc: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('Vui lòng kiểm tra lại các trường bị thiếu!', 'error');
      return;
    }

    const payload = {
      ...formData,
      HocKy: formData.HocKy
    };

    setConfirmDialog({
      show: true,
      title: editingAssignment ? 'Xác nhận cập nhật' : 'Xác nhận phân công',
      message: editingAssignment 
        ? 'Bạn có chắc chắn muốn cập nhật thông tin này không?' 
        : 'Bạn có chắc chắn muốn thêm phân công giảng dạy này không?',
      action: async () => {
        setConfirmDialog({ show: false, action: null });
        try {
          if (editingAssignment) {
            await axios.put(`${API_URL}/api/teaching-assignments/${editingAssignment.MaLopHocPhan}`, payload);
            showToast('Cập nhật phân công giảng dạy thành công.', 'success');
          } else {
            await axios.post(`${API_URL}/api/teaching-assignments`, payload);
            showToast('Thêm phân công giảng dạy thành công.', 'success');
          }
          fetchData();
          handleCloseModal();
        } catch (error) {
          showToast('Có lỗi xảy ra khi lưu!', 'error');
        }
      }
    });
  };

  const handleDelete = (id) => {
    setConfirmDialog({
      show: true,
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc chắn muốn xóa phân công giảng dạy này không?',
      action: async () => {
        setConfirmDialog({ show: false, action: null });
        try {
          await axios.delete(`${API_URL}/api/teaching-assignments/${id}`);
          showToast('Xóa phân công giảng dạy thành công.', 'success');
          fetchData();
        } catch (error) {
          showToast('Lỗi khi xóa phân công!', 'error');
        }
      }
    });
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    
    const hkParts = assignment.HocKy ? assignment.HocKy.split('_') : [];
    if(hkParts.length >= 2) {
      setHocKySo(hkParts[0].replace('HK', ''));
      setNamBatDau(hkParts[1]);
    }

    const extractKhoa = (maMon) => {
      const match = maMon?.match(/^[A-Z]+/i);
      return match ? match[0].toUpperCase() : '';
    };
    const maKhoa = extractKhoa(assignment.MaMonHoc);

    setFormData({
      MaKhoa: maKhoa,
      MaLopHocPhan: assignment.MaLopHocPhan,
      MaMonHoc: assignment.MaMonHoc,
      MaGiangVien: assignment.MaGiangVien,
      MaLop: assignment.MaLop || '',
      HocKy: assignment.HocKy,
      NamHoc: assignment.NamHoc,
      SoLuongToiDa: assignment.SoLuongToiDa || 40 
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAssignment(null);
    setFormData({ MaKhoa: '', MaLopHocPhan: '', MaMonHoc: '', MaGiangVien: '', MaLop: '', HocKy: '', NamHoc: '', SoLuongToiDa: 40 });
    setHocKySo(''); setNamBatDau(''); setHocKyError(''); setHocKyInfo('');
    setFormErrors({});
  };

  const filteredAssignments = assignments.filter(a => {
    const searchStr = searchTerm.toLowerCase();
    const gvStr = searchGV.toLowerCase();
    
    const matchSearch = 
      (a.TenMonHoc && a.TenMonHoc.toLowerCase().includes(searchStr)) ||
      (a.MaLopHocPhan && a.MaLopHocPhan.toLowerCase().includes(searchStr));
      
    const matchGV = 
      !searchGV || 
      (a.TenGiangVien && a.TenGiangVien.toLowerCase().includes(gvStr));
      
    return matchSearch && matchGV;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 max-w-screen-3xl mx-auto w-full">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`fixed top-8 right-8 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border-l-4 ${toast.type === 'success' ? 'bg-white border-green-500' : 'bg-white border-red-500'}`}>
            {toast.type === 'success' ? <CheckCircle2 className="text-green-500" /> : <AlertCircle className="text-red-500" />}
            <p className="font-bold text-sm text-gray-800">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Panel */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 shadow-xl shadow-orange-500/10">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <ClipboardCheck className="w-8 h-8" />
              Quản lý phân công
            </h2>
            <p className="text-orange-100 text-lg">Phân công giảng dạy và quản lý lớp học phần</p>
          </div>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-white text-orange-600 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Thêm phân công
            </motion.button>
          </div>
        </div>
      </div>

      {/* Box Tìm Kiếm */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="Tìm theo Mã LHP hoặc Tên Môn..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-gray-700" />
          </div>
          <div className="relative flex-1">
            <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="Lọc theo Tên Giảng Viên..." value={searchGV} onChange={(e) => setSearchGV(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-gray-700" />
          </div>
        </div>
      </div>

      {/* Danh sách lớp học phần - GIAO DIỆN BẢNG */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-orange-50 to-orange-100/60 border-b border-orange-100">
              <tr>
                <th className="text-left py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Mã LHP</th>
                <th className="text-left py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Môn học</th>
                <th className="text-left py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">HK / Năm học</th>
                <th className="text-center py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Sĩ số</th>
                <th className="text-left py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Giảng viên phụ trách</th>
                <th className="text-left py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Lớp tham gia</th>
                <th className="text-center py-5 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAssignments.length > 0 ? (
                filteredAssignments.map((assign, index) => (
                  <motion.tr
                    key={assign.MaLopHocPhan}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-orange-50/40 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <span className="font-semibold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg text-sm">{assign.MaLopHocPhan}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-gray-800">{assign.TenMonHoc}</div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {assign.HocKy?.replace(/_/g, ' ')}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        {assign.SoLuongToiDa || 0}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-700 font-medium">
                      {assign.TenGiangVien}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {assign.TenLop || 'Tất cả sinh viên'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(assign)}
                          className="p-2.5 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-100 transition-all shadow-sm border border-orange-100"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(assign.MaLopHocPhan)}
                          className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all shadow-sm border border-red-100"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-16">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <ClipboardCheck className="w-16 h-16 mb-4 text-orange-200" />
                      <p className="text-lg font-medium text-gray-600">Chưa có phân công giảng dạy nào</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm / Sửa Phân Công - Thêm noValidate để chặn bong bóng của trình duyệt */}
      {showModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseModal} />
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="relative bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 flex justify-between items-center flex-shrink-0">
                <div className="text-white">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    {editingAssignment ? 'Cập nhật Lớp học phần' : 'Tạo Lớp học phần mới'}
                  </h3>
                </div>
                <button onClick={handleCloseModal} className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar">
                <form id="assignment-form" onSubmit={handleSubmit} noValidate className="space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Trực thuộc Khoa <span className="text-red-500">*</span></label>
                      <select value={formData.MaKhoa} onChange={handleKhoaChange} className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl outline-none transition-all ${formErrors.MaKhoa ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'}`}>
                        <option value="">-- Chọn Khoa quản lý --</option>
                        {khoas.map(k => <option key={k.MaKhoa} value={k.MaKhoa}>{k.TenKhoa}</option>)}
                      </select>
                      {formErrors.MaKhoa && <p className="text-red-500 text-sm mt-1">{formErrors.MaKhoa}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Môn học giảng dạy <span className="text-red-500">*</span></label>
                      <select value={formData.MaMonHoc} onChange={handleMonHocChange} disabled={!formData.MaKhoa} className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl outline-none transition-all disabled:opacity-50 ${formErrors.MaMonHoc ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'}`}>
                        {filteredSubjects.length === 0 && formData.MaKhoa 
                          ? <option value="" disabled>Khoa này chưa có môn học</option> 
                          : <option value="">-- Chọn Môn học --</option>}
                        {filteredSubjects.map(sub => <option key={sub.MaMonHoc} value={sub.MaMonHoc}>[{sub.MaMonHoc}] {sub.TenMonHoc}</option>)}
                      </select>
                      {formErrors.MaMonHoc && <p className="text-red-500 text-sm mt-1">{formErrors.MaMonHoc}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Mã Lớp Học Phần <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.MaLopHocPhan} readOnly placeholder="Mã sẽ tự động sinh khi điền đủ Môn Học và Học Kỳ..." className={`w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-xl font-bold font-mono text-orange-600 outline-none opacity-80 ${formErrors.MaLopHocPhan ? 'border-red-500' : ''}`} />
                    {formErrors.MaLopHocPhan && <p className="text-red-500 text-sm mt-1">{formErrors.MaLopHocPhan}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Giảng viên phụ trách <span className="text-red-500">*</span></label>
                      <select value={formData.MaGiangVien} onChange={e => {setFormData({...formData, MaGiangVien: e.target.value}); setFormErrors({...formErrors, MaGiangVien: ''})}} className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl outline-none transition-all ${formErrors.MaGiangVien ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'}`}>
                        <option value="">-- Chọn giảng viên --</option>
                        {teachers.filter(t => t.TrangThai === 'Đang dạy').map(t => (<option key={t.MaGiangVien} value={t.MaGiangVien}>[{t.MaKhoa}] {t.HoTen}</option>))}
                      </select>
                      {formErrors.MaGiangVien && <p className="text-red-500 text-sm mt-1">{formErrors.MaGiangVien}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Lớp sinh hoạt tham gia (Tùy chọn)</label>
                      <select value={formData.MaLop} onChange={e => setFormData({...formData, MaLop: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none focus:border-orange-500 transition-all">
                        <option value="">-- Dành cho mọi sinh viên --</option>
                        {classes.map(c => <option key={c.MaLop} value={c.MaLop}>{c.TenLop} ({c.MaLop})</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Học kỳ <span className="text-red-500">*</span></label>
                        <select value={hocKySo} onChange={e => {setHocKySo(e.target.value); setFormErrors({...formErrors, HocKy: ''})}} className={`w-full p-3 bg-white border-2 rounded-xl font-bold outline-none focus:border-orange-500 ${formErrors.HocKy ? 'border-red-500' : 'border-gray-200'}`}>
                          <option value="">Chọn</option><option value="1">Học kỳ 1</option><option value="2">Học kỳ 2</option><option value="3">Học kỳ 3</option>
                        </select>
                        {formErrors.HocKy && <p className="text-red-500 text-sm mt-1">{formErrors.HocKy}</p>}
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Năm bắt đầu <span className="text-red-500">*</span></label>
                        <input type="number" placeholder="VD: 2025" value={namBatDau} onChange={e => {setNamBatDau(e.target.value); setFormErrors({...formErrors, NamHoc: ''})}} className={`w-full p-3 bg-white border-2 rounded-xl font-bold outline-none focus:border-orange-500 ${formErrors.NamHoc ? 'border-red-500' : 'border-gray-200'}`} />
                        {formErrors.NamHoc && <p className="text-red-500 text-sm mt-1">{formErrors.NamHoc}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Sĩ số (30 - 80) <span className="text-red-500">*</span></label>
                        {/* Đã xóa min/max để chặn bong bóng mặc định, chạy theo logic viền đỏ custom */}
                        <input type="number" value={formData.SoLuongToiDa} onChange={e => {setFormData({...formData, SoLuongToiDa: e.target.value}); setFormErrors({...formErrors, SoLuongToiDa: ''})}} className={`w-full p-3 bg-white border-2 rounded-xl font-bold text-orange-600 outline-none focus:border-orange-500 ${formErrors.SoLuongToiDa ? 'border-red-500 focus:border-red-500' : 'border-gray-200'}`} />
                        {formErrors.SoLuongToiDa && <p className="text-red-500 text-sm mt-1">{formErrors.SoLuongToiDa}</p>}
                      </div>
                    </div>

                    <div className="pt-1">
                      {hocKyError ? <p className="text-amber-600 text-sm font-bold flex items-center gap-1.5"><AlertCircle className="w-4 h-4"/> {hocKyError}</p> : <p className="text-green-600 text-sm font-bold flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4"/> Sẽ lưu với thông số: {hocKyInfo}</p>}
                    </div>
                  </div>

                </form>
              </div>

              <div className="bg-gray-50 px-6 py-4 flex gap-3 shrink-0">
                <button type="button" onClick={handleCloseModal} className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-sm">
                  Hủy
                </button>
                <button form="assignment-form" type="submit" disabled={!!hocKyError} className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {editingAssignment ? 'Lưu thay đổi' : 'Xác nhận phân công'}
                </button>
              </div>
            </motion.div>
          </div>
        </ModalPortal>
      )}

      {/* Confirm Dialog */}
      <AnimatePresence>
        {confirmDialog.show && (
          <ModalPortal>
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl border border-gray-100">
                <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-7 h-7" /></div>
                <h3 className="text-lg font-black text-gray-800 mb-2">{confirmDialog.title}</h3>
                <p className="text-gray-600 text-sm mb-6 font-medium">{confirmDialog.message}</p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmDialog({ show: false, action: null })} className="flex-1 py-2.5 bg-gray-100 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors">Hủy</button>
                  <button onClick={confirmDialog.action} className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors shadow-sm">Xác nhận</button>
                </div>
              </motion.div>
            </div>
          </ModalPortal>
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

export default TeachingAssignment;