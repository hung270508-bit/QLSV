import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Search, X, ClipboardCheck, BookOpen, AlertCircle, CheckCircle2, UserCheck } from 'lucide-react';
import axios from 'axios';
import { TableSkeleton } from '../common/AdminSkeleton';
import ModalPortal, { ConfirmDialog, SuccessDialog, ErrorDialog, Toast } from '../common/ModalPortal';
import API_URL from '../../api';

function TeachingAssignment() {
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [khoas, setKhoas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);

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

  // Cố định Năm bắt đầu là 2026 theo yêu cầu
  const [hocKySo, setHocKySo] = useState('');
  const [hocKyError, setHocKyError] = useState('');
  const [hocKyInfo, setHocKyInfo] = useState('');
  const namBatDau = '2026';
  const namKetThuc = '2027';

  // Form Data 
  const [formData, setFormData] = useState({
    MaKhoa: '',
    TenKhoa: '',
    LoaiMonHoc: '',
    PhamViDangKy: '', // 'TOAN_TRUONG' | 'THEO_KHOA' - tự động suy ra từ Loại môn
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

  // Hàm suy ra Khoa phụ trách của 1 Môn học — dùng ĐÚNG field MaKhoa/TenKhoa
  // có sẵn trên bản ghi môn học (giống cách Quản lý môn học đang hiển thị).
  // Môn Đại cương có MaKhoa rỗng => trả về null (nghĩa là "Tất cả khoa").
  const getKhoaCuaMonHoc = (mon) => {
    if (!mon || !mon.MaKhoa) return null;
    const k = khoas.find(kh => String(kh.MaKhoa).trim().toUpperCase() === String(mon.MaKhoa).trim().toUpperCase());
    return k || { MaKhoa: mon.MaKhoa, TenKhoa: mon.TenKhoa || mon.MaKhoa };
  };

  // Toàn bộ Môn học, gom nhóm theo Khoa phụ trách để dễ tìm (không còn lọc theo Khoa trước)
  const subjectsByKhoa = useMemo(() => {
    const groups = {};
    subjects.forEach(s => {
      const k = getKhoaCuaMonHoc(s);
      const key = k ? k.TenKhoa : 'Tất cả khoa (Đại cương)';
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });
    return groups;
  }, [subjects, khoas]);

  // LỌC GIẢNG VIÊN THEO KHOA PHỤ TRÁCH CỦA MÔN HỌC
  // Lấy đúng giảng viên thuộc khoa của môn học đó, không lấy lung tung từ các khoa khác
  const filteredTeachers = useMemo(() => {
    if (!formData.MaMonHoc) return [];
    if (!formData.MaKhoa) return teachers.filter(t => t.TrangThai === 'Đang dạy');
    return teachers.filter(t => t.TrangThai === 'Đang dạy' && String(t.MaKhoa).trim().toUpperCase() === String(formData.MaKhoa).trim().toUpperCase());
  }, [formData.MaMonHoc, formData.MaKhoa, teachers]);

  // LỌC LỚP:
  // - Môn Đại cương -> cho phép chọn toàn bộ lớp trong trường (hoặc lớp tự do)
  // - Môn Chuyên ngành -> chỉ lọc các lớp thuộc đúng khoa phụ trách
  const filteredClasses = useMemo(() => {
    if (formData.PhamViDangKy === 'TOAN_TRUONG' || formData.LoaiMon === 'Đại cương' || formData.LoaiMonHoc === 'Đại cương') {
      return classes;
    }
    if (!formData.MaKhoa) return [];
    return classes.filter(c => String(c.MaKhoa).trim().toUpperCase() === String(formData.MaKhoa).trim().toUpperCase());
  }, [formData.PhamViDangKy, formData.LoaiMon, formData.LoaiMonHoc, formData.MaKhoa, classes]);

  // RÀNG BUỘC CỐ ĐỊNH NĂM 2026
  useEffect(() => {
    let msg = '';
    let err = '';
    if (hocKySo) {
      msg = `Học kỳ ${hocKySo} - Năm học ${namBatDau}-${namKetThuc}`;
      const hk = `HK${hocKySo}_${namBatDau}_${namKetThuc}`;
      setFormData(f => ({ ...f, HocKy: hk, NamHoc: `${namBatDau}-${namKetThuc}` }));
    } else {
      err = 'Vui lòng chọn Học kỳ để phân công';
    }
    setHocKyInfo(msg);
    setHocKyError(err);
  }, [hocKySo]);

  // TỰ ĐỘNG GEN MÃ LỚP HỌC PHẦN (CHẠY NGẦM, ẨN KHỎI FORM)
  useEffect(() => {
    if (formData.MaMonHoc && formData.HocKy) {
      const hkCode = `HK${hocKySo}`;
      const namCode = `${namBatDau.slice(-2)}${namKetThuc.slice(-2)}`;
      const base = `${formData.MaMonHoc}.${hkCode}${namCode}`;

      const existing = assignments.filter(a => a.MaLopHocPhan?.startsWith(base));
      const stt = String(existing.length + 1).padStart(2, '0');

      setFormData(f => ({ ...f, MaLopHocPhan: `${base}.HP${stt}` }));
      setFormErrors(prev => ({ ...prev, MaLopHocPhan: '' }));
    }
  }, [formData.MaMonHoc, formData.HocKy, hocKySo, assignments]);

  const validateForm = () => {
    const errors = {};
    if (!formData.MaMonHoc) errors.MaMonHoc = 'Vui lòng chọn Môn học.';
    else if (formData.LoaiMonHoc !== 'Đại cương' && !formData.MaKhoa) errors.MaKhoa = 'Không xác định được Khoa phụ trách của môn học này. Vui lòng kiểm tra lại cấu hình Môn học.';
    if (!formData.MaGiangVien) errors.MaGiangVien = 'Vui lòng chọn Giảng viên.';

    // Ràng buộc: Giảng viên không được dạy lại chính lớp A cho cùng 1 môn
    if (formData.MaLop && formData.MaGiangVien && formData.MaMonHoc) {
      const isDuplicate = assignments.some(a =>
        String(a.MaGiangVien).trim().toLowerCase() === String(formData.MaGiangVien).trim().toLowerCase() &&
        String(a.MaLop).trim().toLowerCase() === String(formData.MaLop).trim().toLowerCase() &&
        String(a.MaMonHoc).trim().toLowerCase() === String(formData.MaMonHoc).trim().toLowerCase()
      );
      if (isDuplicate) {
        errors.MaLop = 'Giảng viên này đã được phân công dạy môn này cho lớp đã chọn.';
      }
    }

    // Ràng buộc: Lớp sinh hoạt phải có >= 20 sinh viên
    if (formData.MaLop) {
      const selectedClass = classes.find(c => String(c.MaLop).trim() === String(formData.MaLop).trim());
      if (selectedClass && selectedClass.SoSinhVien < 20) {
        errors.MaLop = `Lớp này chỉ có ${selectedClass.SoSinhVien} sinh viên, không đủ điều kiện (tối thiểu 20 sinh viên).`;
      }
    }

    // Ràng buộc Sĩ số: Phải là SỐ NGUYÊN và nằm trong khoảng 20 - 80
    const siSo = Number(formData.SoLuongToiDa);
    if (!formData.SoLuongToiDa || isNaN(siSo)) {
      errors.SoLuongToiDa = 'Vui lòng nhập Sĩ số.';
    } else if (!Number.isInteger(siSo)) {
      errors.SoLuongToiDa = 'Sĩ số bắt buộc phải là số nguyên.';
    } else if (siSo < 20 || siSo > 80) {
      errors.SoLuongToiDa = 'Sĩ số phải từ 20 đến 80 sinh viên.';
    }

    if (!hocKySo || hocKySo < 1 || hocKySo > 3) errors.HocKy = 'Vui lòng chọn Học kỳ hợp lệ.';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Khi chọn Môn học: tự động suy ra Khoa phụ trách + Loại môn + Phạm vi đăng ký
  // (Đại cương -> Toàn trường, Chuyên ngành -> Theo Khoa), đồng thời reset GV/Lớp đã chọn trước đó.
  const handleMonHocChange = (e) => {
    const maMon = e.target.value;
    const mon = subjects.find(s => s.MaMonHoc === maMon);
    const khoa = getKhoaCuaMonHoc(mon);
    const loaiMon = mon?.LoaiMonHoc || 'Đại cương';
    const phamVi = loaiMon === 'Đại cương' ? 'TOAN_TRUONG' : 'THEO_KHOA';

    setFormData(prev => ({
      ...prev,
      MaMonHoc: maMon,
      MaKhoa: khoa?.MaKhoa || '',
      TenKhoa: khoa ? khoa.TenKhoa : (maMon ? 'Tất cả khoa' : ''),
      LoaiMonHoc: maMon ? loaiMon : '',
      PhamViDangKy: maMon ? phamVi : '',
      MaLopHocPhan: '',
      MaGiangVien: '',
      MaLop: ''
    }));
    setFormErrors(prev => ({ ...prev, MaMonHoc: '', MaKhoa: '', MaGiangVien: '', MaLop: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('Vui lòng kiểm tra lại các trường bị thiếu hoặc sai định dạng!', 'error');
      return;
    }

    const payload = {
      ...formData,
      SoLuongToiDa: parseInt(formData.SoLuongToiDa), // Đảm bảo gửi lên DB là số nguyên chuẩn
      HocKy: formData.HocKy,
      // PhamViDangKy: 'TOAN_TRUONG' (đại cương - mọi SV toàn trường) | 'THEO_KHOA' (chuyên ngành - giới hạn theo Khoa/Lớp)
      PhamViDangKy: formData.PhamViDangKy
    };

    setConfirmDialog({
      show: true,
      title: 'Xác nhận phân công',
      message: 'Bạn có chắc chắn muốn thêm phân công giảng dạy này không?',
      action: async () => {
        setConfirmDialog({ show: false, action: null });
        try {
          await axios.post(`${API_URL}/api/teaching-assignments`, payload);
          showToast('Thêm phân công giảng dạy thành công.', 'success');
          fetchData();
          handleCloseModal();
        } catch (error) {
          showToast(error.response?.data?.message || 'Có lỗi xảy ra khi lưu!', 'error');
        }
      }
    });
  };

  // LOGIC BẢO MẬT 2 LỚP KHI XÓA
  const handleDelete = (id) => {
    // Lớp 1: Hỏi xác nhận bình thường
    setConfirmDialog({
      show: true,
      title: 'Xác nhận xóa (Bước 1/2)',
      message: 'Bạn có chắc chắn muốn xóa phân công giảng dạy này không?',
      action: () => {
        // Lớp 2: Cảnh báo xóa vĩnh viễn
        setConfirmDialog({
          show: true,
          title: 'Cảnh báo xóa vĩnh viễn (Bước 2/2)',
          message: 'Hành động này không thể hoàn tác! Bạn có chắc chắn 100% muốn xóa lớp học phần này? (Lưu ý: Chỉ xóa được khi lớp chưa có sinh viên đăng ký)',
          action: async () => {
            setConfirmDialog({ show: false, action: null });
            try {
              await axios.delete(`${API_URL}/api/teaching-assignments/${id}`);
              showToast('Xóa phân công giảng dạy thành công.', 'success');
              fetchData();
            } catch (error) {
              showToast(error.response?.data?.message || 'Lớp HP đã có dữ liệu ràng buộc, không thể xóa!', 'error');
            }
          }
        });
      }
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ MaKhoa: '', TenKhoa: '', LoaiMonHoc: '', PhamViDangKy: '', MaLopHocPhan: '', MaMonHoc: '', MaGiangVien: '', MaLop: '', HocKy: '', NamHoc: '', SoLuongToiDa: 40 });
    setHocKySo(''); setHocKyError(''); setHocKyInfo('');
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
    return <TableSkeleton columns={7} rows={5} />;
  }

  return (
    <div className="space-y-8 p-4 max-w-screen-3xl mx-auto w-full">

      {/* Toast Notification */}
      <Toast 
        show={toast.show} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, show: false })} 
      />

      {/* Header Panel */}
      <div className="bg-[#F4C542] rounded-2xl p-8 shadow-xl shadow-amber-500/10">
        <div className="flex items-center justify-between">
          <div className="text-[#152238]">
            <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <ClipboardCheck className="w-8 h-8" />
              Quản lý phân công
            </h2>
            <p className="text-[#152238]/70 text-lg">Tạo lớp học phần mới và quản lý quy mô sinh viên</p>
          </div>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-[#FFFFFF] text-[#F4C542] px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Mở lớp mới ngay
            </motion.button>
          </div>
        </div>
      </div>

      {/* Box Tìm Kiếm */}
      <div className="bg-[#FFFFFF] rounded-2xl shadow-md border border-[#E5E7EB] p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
            <input type="text" placeholder="Tìm theo Mã LHP hoặc Tên Môn..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-[#F7F8FA] border-2 border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#F4C542] focus:bg-[#FFFFFF] transition-all text-gray-700" />
          </div>
          <div className="relative flex-1">
            <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
            <input type="text" placeholder="Lọc theo Tên Giảng Viên..." value={searchGV} onChange={(e) => setSearchGV(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-[#F7F8FA] border-2 border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#F4C542] focus:bg-[#FFFFFF] transition-all text-gray-700" />
          </div>
        </div>
      </div>

      {/* Danh sách lớp học phần - GIAO DIỆN BẢNG */}
      <div className="bg-[#FFFFFF] rounded-2xl shadow-xl border border-[#E5E7EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-amber-50 to-amber-100/60 border-b border-[#FFF7D6]">
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
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-[#FFF7D6]/40 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-[#F4C542] bg-[#FFF7D6] px-2.5 py-1 rounded-lg text-sm">{assign.MaLopHocPhan}</span>
                        {assign.TrangThaiLich === 'DA_CHOT' && (
                          <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded border border-red-200 flex items-center gap-1" title="Lớp học phần này đã được chốt lịch">
                          Đã chốt
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-[#1F2937]">{assign.TenMonHoc}</div>
                    </td>
                    <td className="py-4 px-6 text-sm text-[#6B7280]">
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
                    <td className="py-4 px-6 text-sm text-[#6B7280]">
                      {assign.TenLop || 'Lớp tự do'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            if (assign.TrangThaiLich === 'DA_CHOT') {
                              showToast('Lớp đã được xếp lịch, không được xóa!', 'error');
                              return;
                            }
                            handleDelete(assign.MaLopHocPhan);
                          }}
                          className="p-2.5 rounded-xl transition-all shadow-sm border bg-red-100 text-[#DC2626] hover:bg-red-200 border-red-200 active:scale-95"
                          title="Xóa phân công"
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
                    <div className="flex flex-col items-center justify-center text-gray-300">
                      <ClipboardCheck className="w-16 h-16 mb-4 text-amber-200" />
                      <p className="text-lg font-medium text-[#6B7280]">Chưa có phân công giảng dạy nào</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm Phân Công */}
      {showModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseModal} />
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="relative bg-[#FFFFFF] rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
              <div className="bg-[#F4C542] px-6 py-5 flex justify-between items-center flex-shrink-0">
                <div className="text-white">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Mở Lớp học phần mới
                  </h3>
                </div>
                <button onClick={handleCloseModal} className="p-2 hover:bg-white/40 rounded-lg transition-colors text-white"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar">
                <form id="assignment-form" onSubmit={handleSubmit} noValidate className="space-y-6">

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Môn học giảng dạy <span className="text-[#EF4444]">*</span></label>
                    <select value={formData.MaMonHoc} onChange={handleMonHocChange} className={`w-full px-4 py-3 bg-[#F7F8FA] border-2 rounded-xl outline-none transition-all ${formErrors.MaMonHoc ? 'border-red-500 focus:border-red-500' : 'border-[#E5E7EB] focus:border-[#F4C542]'}`}>
                      <option value="">-- Chọn Môn học --</option>
                      {Object.entries(subjectsByKhoa).map(([tenKhoa, subs]) => (
                        <optgroup key={tenKhoa} label={tenKhoa}>
                          {subs.map(sub => <option key={sub.MaMonHoc} value={sub.MaMonHoc}>[{sub.MaMonHoc}] {sub.TenMonHoc} ({sub.SoTinChi || 0} TC - {sub.LoaiMonHoc || sub.LoaiMon || 'Đại cương'})</option>)}
                        </optgroup>
                      ))}
                    </select>
                    {formErrors.MaMonHoc && <p className="text-[#EF4444] text-sm mt-1">{formErrors.MaMonHoc}</p>}
                  </div>

                  {formData.MaMonHoc && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Khoa</label>
                        <div className="w-full px-4 py-3 bg-gray-100 border-2 border-[#E5E7EB] rounded-xl text-gray-500 font-medium flex items-center gap-2">
                          {formData.TenKhoa || '—'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Loại môn</label>
                        <div className={`w-full px-4 py-3 border-2 rounded-xl font-semibold flex items-center gap-2 ${formData.LoaiMonHoc === 'Đại cương' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                          {formData.LoaiMonHoc || '—'}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Giảng viên phụ trách <span className="text-[#EF4444]">*</span></label>
                      <select disabled={!formData.MaMonHoc} value={formData.MaGiangVien} onChange={e => { setFormData({ ...formData, MaGiangVien: e.target.value }); setFormErrors(prev => ({ ...prev, MaGiangVien: '', MaLop: '' })) }} className={`w-full px-4 py-3 bg-[#F7F8FA] border-2 rounded-xl outline-none transition-all disabled:opacity-50 ${formErrors.MaGiangVien ? 'border-red-500 focus:border-red-500' : 'border-[#E5E7EB] focus:border-[#F4C542]'}`}>
                        {filteredTeachers.length === 0 && formData.MaMonHoc
                          ? <option value="" disabled>{formData.LoaiMonHoc === 'Đại cương' ? 'Chưa có giảng viên nào đang dạy' : 'Khoa này chưa có giảng viên'}</option>
                          : <option value="">-- Chọn giảng viên --</option>}
                        {filteredTeachers.map(t => (<option key={t.MaGiangVien} value={t.MaGiangVien}>[{t.MaKhoa}] {t.HoTen}</option>))}
                      </select>
                      {formErrors.MaGiangVien && <p className="text-[#EF4444] text-sm mt-1">{formErrors.MaGiangVien}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Lớp sinh hoạt tham gia (Tùy chọn)</label>
                      <select disabled={!formData.MaMonHoc} value={formData.MaLop} onChange={e => { setFormData({ ...formData, MaLop: e.target.value }); setFormErrors(prev => ({ ...prev, MaLop: '' })) }} className="w-full px-4 py-3 bg-[#F7F8FA] border-2 border-[#E5E7EB] rounded-xl outline-none focus:border-[#F4C542] transition-all disabled:opacity-50 text-gray-700 font-medium cursor-pointer">
                        <option value="">
                          {formData.PhamViDangKy === 'TOAN_TRUONG' || formData.LoaiMon === 'Đại cương' || formData.LoaiMonHoc === 'Đại cương'
                            ? '-- Lớp tự do (Mở cho toàn trường không giới hạn) --'
                            : `-- Toàn bộ SV Khoa ${formData.TenKhoa || ''} --`}
                        </option>
                        {filteredClasses.map(c => <option key={c.MaLop} value={c.MaLop}>{c.TenLop} ({c.MaLop}) - {c.SoSinhVien || 0} SV</option>)}
                      </select>
                      {formData.PhamViDangKy === 'TOAN_TRUONG' || formData.LoaiMon === 'Đại cương' || formData.LoaiMonHoc === 'Đại cương' ? (
                        <p className="text-[#3B82F6] text-xs font-medium mt-1.5 flex items-center gap-1">
                          <span></span>Dù chọn Lớp hay Lớp tự do, sinh viên toàn trường đều có thể thấy và đăng ký học.
                        </p>
                      ) : null}
                      {formErrors.MaLop && <p className="text-[#EF4444] text-sm mt-1">{formErrors.MaLop}</p>}
                    </div>
                  </div>

                  <div className="bg-[#FFF7D6]/50 p-5 rounded-2xl border border-[#FFF7D6] space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#6B7280] uppercase mb-2">Học kỳ <span className="text-[#EF4444]">*</span></label>
                        <select value={hocKySo} onChange={e => { setHocKySo(e.target.value); setFormErrors({ ...formErrors, HocKy: '' }) }} className={`w-full p-3 bg-[#FFFFFF] border-2 rounded-xl font-bold outline-none focus:border-[#F4C542] ${formErrors.HocKy ? 'border-red-500' : 'border-[#E5E7EB]'}`}>
                          <option value="">Chọn</option><option value="1">Học kỳ 1</option><option value="2">Học kỳ 2</option><option value="3">Học kỳ 3</option>
                        </select>
                        {formErrors.HocKy && <p className="text-[#EF4444] text-sm mt-1">{formErrors.HocKy}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#6B7280] uppercase mb-2">Năm bắt đầu <span className="text-[#EF4444]">*</span></label>
                        <input type="text" value="2026" disabled className="w-full p-3 bg-gray-100 border-2 border-[#E5E7EB] rounded-xl font-bold text-[#6B7280] outline-none cursor-not-allowed" />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#6B7280] uppercase mb-2">Sĩ số (20 - 80) <span className="text-[#EF4444]">*</span></label>
                        <input type="number" min="20" max="80" step="1" onKeyDown={(e) => { if (e.key === '.' || e.key === ',' || e.key === 'e') e.preventDefault(); }} value={formData.SoLuongToiDa} onChange={e => { setFormData({ ...formData, SoLuongToiDa: e.target.value }); setFormErrors({ ...formErrors, SoLuongToiDa: '' }) }} className={`w-full p-3 bg-[#FFFFFF] border-2 rounded-xl font-bold text-[#F4C542] outline-none focus:border-[#F4C542] ${formErrors.SoLuongToiDa ? 'border-red-500 focus:border-red-500' : 'border-[#E5E7EB]'}`} />
                        {formErrors.SoLuongToiDa && <p className="text-[#EF4444] text-sm mt-1">{formErrors.SoLuongToiDa}</p>}
                      </div>
                    </div>

                    <div className="pt-1">
                      {hocKyError ? <p className="text-amber-600 text-sm font-bold flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> {hocKyError}</p> : <p className="text-[#22C55E] text-sm font-bold flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Sẽ lưu với thông số: {hocKyInfo}</p>}
                    </div>
                  </div>

                </form>
              </div>

              <div className="bg-[#F7F8FA] px-6 py-4 flex gap-3 shrink-0">
                <button type="button" onClick={handleCloseModal} className="flex-1 py-3 bg-[#FFFFFF] border border-[#E5E7EB] text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-sm">
                  Hủy
                </button>
                <button form="assignment-form" type="submit" disabled={!!hocKyError} className="flex-1 py-3 bg-[#F4C542] hover:from-amber-600 hover:to-amber-700 text-[#152238] font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  Xác nhận phân công
                </button>
              </div>
            </motion.div>
          </div>
        </ModalPortal>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        show={confirmDialog.show}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={() => confirmDialog.action && confirmDialog.action()}
        onCancel={() => setConfirmDialog({ show: false, title: '', message: '', action: null })}
      />

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  );
}

export default TeachingAssignment;