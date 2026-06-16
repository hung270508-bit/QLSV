import React, { useState, useEffect, useCallback } from 'react';
import API_URL from '../../api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, Plus, Edit, Trash2, Search, X, Filter,
  XCircle, Download, FileText, BarChart3, AlertCircle, CheckCircle2
} from 'lucide-react';
import axios from 'axios';
import { GradeSkeleton } from './AdminSkeleton';
import ModalPortal from '../common/ModalPortal';

// ================================================================
// Toast — góc trên phải, tự biến mất sau 4s
// ================================================================
function Toast({ toasts, onRemove }) {
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ duration: 0.22 }}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border min-w-[280px] max-w-sm
              ${t.type === 'error'   ? 'bg-red-50 border-red-200 text-red-800'
              : t.type === 'success' ? 'bg-green-50 border-green-200 text-green-800'
              :                        'bg-blue-50 border-blue-200 text-blue-800'}`}
          >
            {t.type === 'error'
              ? <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
              : <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-500 mt-0.5" />}
            <p className="text-sm font-medium flex-1">{t.message}</p>
            <button onClick={() => onRemove(t.id)} className="ml-2 opacity-50 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ================================================================
// ConfirmDialog — xác nhận 2 bước
// ================================================================
function ConfirmDialog({ open, title, message, confirmLabel = 'Xác nhận', confirmClass = 'bg-red-500 hover:bg-red-600', onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500 mt-1">{message}</p>
            </div>
          </div>
        </div>
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors text-sm"
          >Hủy bỏ</button>
          <button onClick={onConfirm}
            className={`flex-1 py-2.5 text-white font-semibold rounded-xl transition-colors text-sm ${confirmClass}`}
          >{confirmLabel}</button>
        </div>
      </motion.div>
    </div>
  );
}

// ================================================================
// ScoreInput — validate 0-10 realtime, KHÔNG dùng min/max của browser
// ================================================================
function ScoreInput({ value, onChange, placeholder = 'Để trống nếu chưa có', error }) {
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    const raw = e.target.value;
    if (raw === '') { setLocalError(''); onChange(''); return; }
    const num = parseFloat(raw);
    if (isNaN(num))  { setLocalError('Giá trị không hợp lệ'); return; }
    if (num < 0)     { setLocalError('Điểm không được âm — vui lòng nhập lại'); onChange(''); return; }
    if (num > 10)    { setLocalError('Điểm không được vượt quá 10 — vui lòng nhập lại'); onChange(''); return; }
    setLocalError('');
    onChange(raw);
  };

  const displayError = localError || error;
  return (
    <div>
      <input
        type="number" step="0.1"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onWheel={e => e.target.blur()}
        className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors
          ${displayError ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-orange-500'}`}
      />
      {displayError && (
        <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1.5 bg-red-50 px-2 py-1 rounded-lg border border-red-100">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="underline decoration-red-400 decoration-dotted">{displayError}</span>
        </p>
      )}
    </div>
  );
}

// ================================================================
// BulkScoreInput — compact, dùng trong bảng hàng loạt
// ================================================================
function BulkScoreInput({ value, onChange }) {
  const [err, setErr] = useState('');
  const handle = (e) => {
    const raw = e.target.value;
    if (raw === '') { setErr(''); onChange(''); return; }
    const n = parseFloat(raw);
    if (isNaN(n) || n < 0) { setErr('Âm'); onChange(''); return; }
    if (n > 10)             { setErr('>10'); onChange(''); return; }
    setErr('');
    onChange(raw);
  };
  return (
    <div className="relative pb-4">
      <input
        type="number" step="0.1"
        placeholder="—"
        value={value}
        onChange={handle}
        onWheel={e => e.target.blur()}
        className={`w-16 text-center px-2 py-2 border rounded-lg focus:outline-none text-sm transition-colors
          ${err ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-orange-500 bg-white'}`}
      />
      {err && (
        <span className="absolute bottom-0 left-0 text-red-500 text-[10px] underline whitespace-nowrap">{err}</span>
      )}
    </div>
  );
}

// ================================================================
// Main Component
// ================================================================
function GradeManagement() {
  const [grades, setGrades]                   = useState([]);
  const [students, setStudents]               = useState([]);
  const [courseSections, setCourseSections]   = useState([]);
  const [faculties, setFaculties]             = useState([]);
  const [enrollments, setEnrollments]         = useState([]);
  const [loading, setLoading]                 = useState(true);

  // Toast
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  // Confirm dialog
  const [confirm, setConfirm] = useState({
    open: false, title: '', message: '', confirmLabel: '', confirmClass: '', onConfirm: null
  });
  const closeConfirm = () => setConfirm(p => ({ ...p, open: false }));

  // Modal thêm/sửa
  const [showModal, setShowModal]         = useState(false);
  const [editingGrade, setEditingGrade]   = useState(null);
  const [formData, setFormData]           = useState({
    selectedKhoa: '', MSSV: '', MaLopHocPhan: '', HocKy: '',
    DiemChuyenCan: '', DiemBaiTap: '', DiemGiuaKy: '', DiemCuoiKy: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Bulk modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkKhoa, setBulkKhoa]           = useState('');
  const [bulkSection, setBulkSection]     = useState('');
  const [bulkGrades, setBulkGrades]       = useState([]);
  const [bulkError, setBulkError]         = useState('');

  // Search & filter
  const [searchTerm, setSearchTerm]               = useState('');
  const [displaySearchTerm, setDisplaySearchTerm] = useState('');
  const [showFilters, setShowFilters]             = useState(false);
  const [filters, setFilters]                     = useState({ khoaFilter: '', sectionFilter: '' });
  const [displayFilters, setDisplayFilters]       = useState({ khoaFilter: '', sectionFilter: '' });

  // Stats — khai báo riêng, không lẫn với confirm
  const [gradeStats, setGradeStats] = useState(
    { a: 0, bPlus: 0, b: 0, cPlus: 0, c: 0, dPlus: 0, d: 0, fPlus: 0, f: 0 }
  );

  const SCORE_FIELDS = ['DiemChuyenCan', 'DiemBaiTap', 'DiemGiuaKy', 'DiemCuoiKy'];

  // ================================================================
  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [gradesRes, studentsRes, sectionsRes, facultiesRes, enrollmentsRes] = await Promise.all([
        axios.get(`${API_URL}/api/grades`),
        axios.get(`${API_URL}/api/students`),
        axios.get(`${API_URL}/api/course-sections`),
        axios.get(`${API_URL}/api/faculties`),
        axios.get(`${API_URL}/api/enrollments/all`).catch(() => ({ data: [] }))
      ]);
      setGrades(gradesRes.data);
      setStudents(studentsRes.data);
      setCourseSections(sectionsRes.data);
      setFaculties(facultiesRes.data);
      setEnrollments(enrollmentsRes.data);
    } catch (err) {
      console.error('fetchData error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ================================================================
  // Helpers tính điểm
  // ================================================================
  const hasAnyScore = (cc, bt, gk, ck) =>
    (cc !== '' && cc != null) ||
    (bt !== '' && bt != null) ||
    (gk !== '' && gk != null) ||
    (ck !== '' && ck != null);

  const isScoreValid = (val) => {
    if (val === '' || val == null) return true;
    const n = parseFloat(val);
    return !isNaN(n) && n >= 0 && n <= 10;
  };

  const calculateTotal10 = (cc, bt, gk, ck) => {
    const d = [cc, bt, gk, ck].map(v => parseFloat(v) || 0);
    return ((d[0] * 0.1) + (d[1] * 0.15) + (d[2] * 0.25) + (d[3] * 0.5)).toFixed(2);
  };

  const convertToGPA = (total10) => {
    const t = parseFloat(total10);
    if (t >= 8.5) return { letter: 'A',  gpa: 4.0, text: 'Xuất sắc / Giỏi' };
    if (t >= 7.8) return { letter: 'B+', gpa: 3.5, text: 'Giỏi' };
    if (t >= 7.0) return { letter: 'B',  gpa: 3.0, text: 'Khá' };
    if (t >= 6.3) return { letter: 'C+', gpa: 2.5, text: 'Khá' };
    if (t >= 5.5) return { letter: 'C',  gpa: 2.0, text: 'Trung bình' };
    if (t >= 4.8) return { letter: 'D+', gpa: 1.5, text: 'Trung bình yếu' };
    if (t >= 4.0) return { letter: 'D',  gpa: 1.0, text: 'Yếu' };
    if (t >= 3.0) return { letter: 'F+', gpa: 0.5, text: 'Kém' };
    return         { letter: 'F',  gpa: 0.0, text: 'Kém' };
  };

  const getLetterColor = (letter) => {
    if (!letter) return 'text-gray-300';
    if (letter === 'A')                    return 'text-green-600';
    if (letter === 'B+' || letter === 'B') return 'text-blue-600';
    if (letter === 'C+' || letter === 'C') return 'text-yellow-600';
    if (letter === 'D+' || letter === 'D') return 'text-orange-500';
    return 'text-red-600';
  };

  // ================================================================
  // SIÊU FIX: Hàm gọt bỏ khoảng trắng & chuẩn hóa trích xuất Khoa
  // ================================================================
  const extractKhoa = (maKhoaDB, maMonHoc) => {
    // Ưu tiên cột MaKhoa, nếu không có thì Regex bóc tách chữ cái đầu mã môn học (VD: CNTT001 -> CNTT)
    const k = maKhoaDB || (maMonHoc ? maMonHoc.match(/^[A-Z]+/i)?.[0] : '');
    return String(k).trim().toUpperCase(); // Cắt sạch khoảng trắng dư thừa
  };

  const getSectionsByKhoa = (maKhoa) => {
    if (!maKhoa) return courseSections;
    const targetKhoa = String(maKhoa).trim().toUpperCase();
    return courseSections.filter(cs => extractKhoa(cs.MaKhoa, cs.MaMonHoc) === targetKhoa);
  };

  // SV đã đăng ký LHP cụ thể (từ enrollments/diem)
  const getEnrolledStudents = (maLopHocPhan) => {
    if (!maLopHocPhan) return [];
    if (enrollments.length === 0) {
      // Fallback: lấy SV từ bảng diem nếu chưa có API enrollments
      const mssvsFromGrades = [...new Set(grades.filter(g => g.MaLopHocPhan === maLopHocPhan).map(g => g.MSSV))];
      return students.filter(s => mssvsFromGrades.includes(s.MSSV));
    }
    const mssv = enrollments
      .filter(e => e.MaLopHocPhan === maLopHocPhan && e.TrangThai !== 'Từ chối')
      .map(e => e.MSSV);
    return students.filter(s => mssv.includes(s.MSSV));
  };

  // ================================================================
  // Payload builder
  // ================================================================
  const buildPayload = (data) => {
    const { DiemChuyenCan: cc, DiemBaiTap: bt, DiemGiuaKy: gk, DiemCuoiKy: ck } = data;
    const scored = hasAnyScore(cc, bt, gk, ck);
    const base = {
      MSSV: data.MSSV,
      MaLopHocPhan: data.MaLopHocPhan,
      HocKy: data.HocKy,
      DiemChuyenCan: (cc !== '' && cc != null) ? cc : null,
      DiemBaiTap:    (bt !== '' && bt != null) ? bt : null,
      DiemGiuaKy:    (gk !== '' && gk != null) ? gk : null,
      DiemCuoiKy:    (ck !== '' && ck != null) ? ck : null,
    };
    if (scored) {
      const t10 = calculateTotal10(cc, bt, gk, ck);
      const gpa = convertToGPA(t10);
      return { ...base, DiemTong: t10, DiemGPA: gpa.gpa, DiemChu: gpa.letter, XepLoai: gpa.text };
    }
    return { ...base, DiemTong: null, DiemGPA: null, DiemChu: null, XepLoai: null };
  };

  // ================================================================
  // Form modal — validate
  // ================================================================
  const validateForm = () => {
    const errors = {};
    if (!formData.MSSV)         errors.MSSV = 'Vui lòng chọn sinh viên';
    if (!formData.MaLopHocPhan) errors.MaLopHocPhan = 'Vui lòng chọn lớp học phần';

    if (formData.MSSV && formData.MaLopHocPhan && !editingGrade) {
      // Kiểm tra đã có điểm chưa
      const dup = grades.some(g => g.MSSV === formData.MSSV && g.MaLopHocPhan === formData.MaLopHocPhan);
      if (dup) {
        errors.MaLopHocPhan = 'Sinh viên này đã có điểm môn học phần này rồi';
      } else if (enrollments.length > 0) {
        // Kiểm tra đăng ký
        const enrolled = enrollments.some(
          e => e.MSSV === formData.MSSV &&
               e.MaLopHocPhan === formData.MaLopHocPhan &&
               e.TrangThai !== 'Từ chối'
        );
        if (!enrolled) errors.MaLopHocPhan = 'Sinh viên chưa đăng ký lớp học phần này';
      }
    }

    // Điểm số hợp lệ
    SCORE_FIELDS.forEach(f => {
      if (!isScoreValid(formData[f])) {
        const n = parseFloat(formData[f]);
        errors[f] = n < 0 ? 'Điểm không được âm' : 'Điểm không được vượt quá 10';
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit → confirm → API
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    const isEdit = !!editingGrade;
    setConfirm({
      open: true,
      title: isEdit ? 'Xác nhận cập nhật điểm' : 'Xác nhận thêm điểm',
      message: isEdit
        ? 'Bạn có chắc chắn muốn lưu thay đổi điểm này không?'
        : 'Bạn có chắc chắn muốn thêm điểm mới không?',
      confirmLabel: isEdit ? 'Lưu thay đổi' : 'Thêm điểm',
      confirmClass: 'bg-orange-500 hover:bg-orange-600',
      onConfirm: async () => {
        closeConfirm();
        try {
          const payload = buildPayload(formData);
          if (isEdit) {
            await axios.put(`${API_URL}/api/grades/${editingGrade.MaDiem}`, payload);
            addToast('Cập nhật điểm thành công!', 'success');
          } else {
            await axios.post(`${API_URL}/api/grades`, payload);
            addToast('Thêm điểm thành công!', 'success');
          }
          fetchData();
          handleCloseModal();
        } catch (err) {
          addToast(err.response?.data?.message || 'Lỗi khi lưu điểm!', 'error');
        }
      }
    });
  };

  const handleEdit = (grade) => {
    const sec = courseSections.find(cs => cs.MaLopHocPhan === grade.MaLopHocPhan);
    setEditingGrade(grade);
    setFormData({
      selectedKhoa:  sec ? extractKhoa(sec.MaKhoa, sec.MaMonHoc) : '',
      MSSV:          grade.MSSV,
      MaLopHocPhan:  grade.MaLopHocPhan,
      HocKy:         grade.HocKy || '',
      DiemChuyenCan: grade.DiemChuyenCan ?? '',
      DiemBaiTap:    grade.DiemBaiTap    ?? '',
      DiemGiuaKy:    grade.DiemGiuaKy   ?? '',
      DiemCuoiKy:    grade.DiemCuoiKy   ?? ''
    });
    setShowModal(true);
  };

  const handleDelete = (maDiem, tenSinhVien, tenMonHoc) => {
    setConfirm({
      open: true,
      title: 'Xác nhận xóa điểm',
      message: `Bạn có chắc chắn muốn xóa điểm của ${tenSinhVien || 'sinh viên này'} — ${tenMonHoc || 'môn này'}? Hành động không thể hoàn tác.`,
      confirmLabel: 'Xóa điểm',
      confirmClass: 'bg-red-500 hover:bg-red-600',
      onConfirm: async () => {
        closeConfirm();
        try {
          await axios.delete(`${API_URL}/api/grades/${maDiem}`);
          addToast('Đã xóa điểm thành công!', 'success');
          fetchData();
        } catch {
          addToast('Lỗi khi xóa điểm!', 'error');
        }
      }
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGrade(null);
    setFormData({ selectedKhoa: '', MSSV: '', MaLopHocPhan: '', HocKy: '', DiemChuyenCan: '', DiemBaiTap: '', DiemGiuaKy: '', DiemCuoiKy: '' });
    setFormErrors({});
  };

  // Chọn LHP → auto-fill HocKy, reset SV
  const handleSectionChange = (maLopHocPhan) => {
    const sec = courseSections.find(cs => cs.MaLopHocPhan === maLopHocPhan);
    const hocKy = sec ? `HK${sec.HocKy || ''} ${sec.NamBatDau || ''}`.trim() : '';
    setFormData(prev => ({ ...prev, MaLopHocPhan: maLopHocPhan, HocKy: hocKy, MSSV: '' }));
    if (formErrors.MaLopHocPhan) setFormErrors(p => ({ ...p, MaLopHocPhan: '' }));
  };

  // ================================================================
  // Bulk modal
  // ================================================================
  const handleOpenBulkModal = () => {
    setBulkKhoa(''); setBulkSection(''); setBulkGrades([]); setBulkError('');
    setShowBulkModal(true);
  };

  const handleBulkSectionChange = (maLopHocPhan) => {
    setBulkSection(maLopHocPhan);
    setBulkError('');
    if (!maLopHocPhan) { setBulkGrades([]); return; }
    const enrolled = getEnrolledStudents(maLopHocPhan);
    if (enrolled.length === 0) { setBulkGrades([]); return; }
    setBulkGrades(enrolled.map(student => {
      const existing = grades.find(g => g.MSSV === student.MSSV && g.MaLopHocPhan === maLopHocPhan);
      return {
        MSSV: student.MSSV, HoTen: student.HoTen,
        MaLopHocPhan: maLopHocPhan,
        DiemChuyenCan: existing?.DiemChuyenCan ?? '',
        DiemBaiTap:    existing?.DiemBaiTap    ?? '',
        DiemGiuaKy:    existing?.DiemGiuaKy   ?? '',
        DiemCuoiKy:    existing?.DiemCuoiKy   ?? '',
        alreadyExists: !!existing,
        MaDiem: existing?.MaDiem || null,
        rowErrors: {}
      };
    }));
  };

  const handleBulkFieldChange = (index, field, val) => {
    setBulkGrades(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      const n = parseFloat(val);
      const err = val !== '' && (isNaN(n) || n < 0 || n > 10)
        ? (n < 0 ? 'Âm' : '>10') : '';
      next[index].rowErrors = { ...next[index].rowErrors, [field]: err };
      return next;
    });
  };

  const handleBulkSubmit = () => {
    if (!bulkSection) { setBulkError('Vui lòng chọn lớp học phần'); return; }
    const hasErr = bulkGrades.some(g => Object.values(g.rowErrors || {}).some(Boolean));
    if (hasErr) { setBulkError('Có điểm không hợp lệ — kiểm tra lại các ô đỏ'); return; }
    setConfirm({
      open: true,
      title: 'Xác nhận lưu điểm hàng loạt',
      message: `Bạn có chắc chắn muốn lưu điểm cho ${bulkGrades.length} sinh viên không?`,
      confirmLabel: 'Lưu tất cả',
      confirmClass: 'bg-purple-500 hover:bg-purple-600',
      onConfirm: async () => {
        closeConfirm();
        const sec = courseSections.find(cs => cs.MaLopHocPhan === bulkSection);
        const hocKy = sec ? `HK${sec.HocKy || ''} ${sec.NamBatDau || ''}`.trim() : '';
        try {
          await Promise.all(bulkGrades.map(g => {
            const payload = buildPayload({ ...g, HocKy: hocKy });
            if (g.alreadyExists && g.MaDiem)
              return axios.put(`${API_URL}/api/grades/${g.MaDiem}`, payload);
            return axios.post(`${API_URL}/api/grades`, payload);
          }));
          addToast(`Đã lưu điểm ${bulkGrades.length} sinh viên thành công!`, 'success');
          setShowBulkModal(false);
          fetchData();
        } catch (err) {
          setBulkError(err.response?.data?.message || 'Lỗi khi lưu điểm hàng loạt!');
        }
      }
    });
  };

  // ================================================================
  // Search & filter
  // ================================================================
  
  // Trích xuất lọc cho an toàn tuyệt đối
  const filteredSectionsForFilter = displayFilters.khoaFilter
    ? courseSections.filter(cs => extractKhoa(cs.MaKhoa, cs.MaMonHoc) === String(displayFilters.khoaFilter).trim().toUpperCase())
    : courseSections;

  const filteredGrades = grades.filter(grade => {
    const term = searchTerm.toLowerCase();
    const sec  = courseSections.find(cs => cs.MaLopHocPhan === grade.MaLopHocPhan);
    const matchSearch = !searchTerm ||
      grade.TenSinhVien?.toLowerCase().includes(term) ||
      grade.MSSV?.toLowerCase().includes(term) ||
      grade.TenMonHoc?.toLowerCase().includes(term) ||
      (grade.TenKhoa || sec?.TenKhoa || '')?.toLowerCase().includes(term) ||
      grade.MaLopHocPhan?.toLowerCase().includes(term);
    
    // Gọt khoảng trắng khi filter bằng Khoa
    const gradeKhoa = extractKhoa(grade.MaKhoa || sec?.MaKhoa, grade.MaMonHoc || sec?.MaMonHoc);
    const matchKhoa = !filters.khoaFilter || gradeKhoa === String(filters.khoaFilter).trim().toUpperCase();
    
    const matchSection = !filters.sectionFilter || grade.MaLopHocPhan === filters.sectionFilter;
    return matchSearch && matchKhoa && matchSection;
  });

  const hasActiveFilters   = filters.khoaFilter || filters.sectionFilter || searchTerm;
  const activeFilterCount  = (filters.khoaFilter ? 1 : 0) + (filters.sectionFilter ? 1 : 0) + (searchTerm ? 1 : 0);

  const clearFilters = () => {
    setFilters({ khoaFilter: '', sectionFilter: '' });
    setDisplayFilters({ khoaFilter: '', sectionFilter: '' });
    setSearchTerm(''); setDisplaySearchTerm('');
  };

  // ================================================================
  // Stats — chỉ đếm bản ghi đã có điểm
  // ================================================================
  useEffect(() => {
    const stats = { a: 0, bPlus: 0, b: 0, cPlus: 0, c: 0, dPlus: 0, d: 0, fPlus: 0, f: 0 };
    filteredGrades.forEach(g => {
      if (!hasAnyScore(g.DiemChuyenCan, g.DiemBaiTap, g.DiemGiuaKy, g.DiemCuoiKy)) return;
      const t = parseFloat(calculateTotal10(g.DiemChuyenCan, g.DiemBaiTap, g.DiemGiuaKy, g.DiemCuoiKy));
      if (t >= 8.5)      stats.a++;
      else if (t >= 7.8) stats.bPlus++;
      else if (t >= 7.0) stats.b++;
      else if (t >= 6.3) stats.cPlus++;
      else if (t >= 5.5) stats.c++;
      else if (t >= 4.8) stats.dPlus++;
      else if (t >= 4.0) stats.d++;
      else if (t >= 3.0) stats.fPlus++;
      else               stats.f++;
    });
    setGradeStats(stats);
  }, [filteredGrades]);

  // ================================================================
  // Export CSV
  // ================================================================
  const handleExport = () => {
    const rows = [
      ['MSSV','Sinh viên','Môn học','Khoa','Học kỳ','CC(10%)','BT(15%)','GK(25%)','CK(50%)','TB','GPA','Điểm chữ','Xếp loại'],
      ...filteredGrades.map(g => {
        const scored = hasAnyScore(g.DiemChuyenCan, g.DiemBaiTap, g.DiemGiuaKy, g.DiemCuoiKy);
        if (!scored) return [g.MSSV, g.TenSinhVien||'N/A', g.TenMonHoc||'N/A', g.TenKhoa||'', g.HocKy||'', '-','-','-','-','Chưa có điểm','','',''];
        const t10 = calculateTotal10(g.DiemChuyenCan, g.DiemBaiTap, g.DiemGiuaKy, g.DiemCuoiKy);
        const gpa = convertToGPA(t10);
        return [g.MSSV, g.TenSinhVien||'N/A', g.TenMonHoc||'N/A', g.TenKhoa||'', g.HocKy||'',
          g.DiemChuyenCan??'-', g.DiemBaiTap??'-', g.DiemGiuaKy??'-', g.DiemCuoiKy??'-',
          g.DiemTong||t10, g.DiemGPA??gpa.gpa.toFixed(1), g.DiemChu||gpa.letter, gpa.text];
      })
    ].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + rows], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'diem_sinh_vien.csv';
    a.click();
  };

  // ================================================================
  // Preview trong modal
  // ================================================================
  const previewTotal   = calculateTotal10(formData.DiemChuyenCan, formData.DiemBaiTap, formData.DiemGiuaKy, formData.DiemCuoiKy);
  const previewGPA     = convertToGPA(previewTotal);
  const hasPreview     = hasAnyScore(formData.DiemChuyenCan, formData.DiemBaiTap, formData.DiemGiuaKy, formData.DiemCuoiKy);
  const allScoresValid = SCORE_FIELDS.every(f => isScoreValid(formData[f]));

  if (loading) return <GradeSkeleton />;

  return (
    <div className="space-y-6">
      <Toast toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        confirmLabel={confirm.confirmLabel}
        confirmClass={confirm.confirmClass}
        onConfirm={confirm.onConfirm}
        onCancel={closeConfirm}
      />

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 shadow-lg shadow-orange-200/50 flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl"><GraduationCap className="w-7 h-7 text-white" /></div>
          <div>
            <h2 className="text-xl font-bold text-white">Quản lý điểm sinh viên</h2>
            <p className="text-orange-100 text-sm mt-0.5">Thêm, sửa, xóa điểm sinh viên</p>
          </div>
        </div>
        <div className="flex gap-3">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleOpenBulkModal}
            className="flex items-center gap-2 bg-purple-500 text-white px-5 py-3 rounded-xl shadow-lg"
          ><FileText className="w-5 h-5" /> Nhập hàng loạt</motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleExport}
            className="flex items-center gap-2 bg-green-500 text-white px-5 py-3 rounded-xl shadow-lg"
          ><Download className="w-5 h-5" /> Export</motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-white text-orange-600 font-semibold px-5 py-3 rounded-xl shadow-lg"
          ><Plus className="w-5 h-5" /> Thêm điểm</motion.button>
        </div>
      </motion.div>

      {/* ── Search & Filters ── */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="text"
              placeholder="Tìm theo MSSV, tên sinh viên, tên môn, khoa, mã lớp học phần..."
              value={displaySearchTerm}
              onChange={e => setDisplaySearchTerm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setSearchTerm(displaySearchTerm)}
              className="w-full pl-12 pr-12 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
            />
            <button type="button" onClick={() => setShowFilters(v => !v)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${hasActiveFilters ? 'text-orange-500' : 'text-gray-400'}`}
            >
              <Filter className="w-5 h-5" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setSearchTerm(displaySearchTerm)}
            className="flex items-center gap-2 bg-orange-500 text-white px-5 py-3 rounded-xl shadow-lg"
          ><Search className="w-5 h-5" /> Tìm kiếm</motion.button>
          {hasActiveFilters && (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={clearFilters}
              className="px-4 py-3 bg-red-100 text-red-600 rounded-xl font-semibold hover:bg-red-200 flex items-center gap-2"
            ><XCircle className="w-5 h-5" /> Xóa bộ lọc</motion.button>
          )}
        </div>

        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            className="bg-gray-50 rounded-xl p-4 space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lọc theo Khoa</label>
                <select value={displayFilters.khoaFilter}
                  onChange={e => setDisplayFilters(p => ({ ...p, khoaFilter: e.target.value, sectionFilter: '' }))}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                >
                  <option value="">Tất cả khoa</option>
                  {faculties.map(f => <option key={f.MaKhoa} value={f.MaKhoa}>{f.TenKhoa}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lọc theo Lớp học phần</label>
                <select value={displayFilters.sectionFilter}
                  onChange={e => setDisplayFilters(p => ({ ...p, sectionFilter: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                >
                  <option value="">Tất cả lớp học phần</option>
                  {filteredSectionsForFilter.map(cs => (
                    <option key={cs.MaLopHocPhan} value={cs.MaLopHocPhan}>
                      {cs.TenMonHoc} — {cs.MaLopHocPhan}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setFilters({ ...displayFilters }); setShowFilters(false); }}
                className="flex-1 bg-orange-500 text-white py-2 rounded-xl font-semibold hover:bg-orange-600"
              >Áp dụng</button>
              <button onClick={() => setDisplayFilters({ khoaFilter: '', sectionFilter: '' })}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-xl font-semibold hover:bg-gray-300"
              >Đặt lại</button>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Thống kê ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
      >
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-bold text-gray-800">Thống kê điểm</h3>
          <span className="ml-auto text-sm text-gray-400">
            {filteredGrades.length} bản ghi · {filteredGrades.filter(g => hasAnyScore(g.DiemChuyenCan, g.DiemBaiTap, g.DiemGiuaKy, g.DiemCuoiKy)).length} đã có điểm
          </span>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-9 gap-3">
          {[
            { label: 'A',  sub: '≥8.5', color: 'green',   val: gradeStats.a },
            { label: 'B+', sub: '≥7.8', color: 'emerald', val: gradeStats.bPlus },
            { label: 'B',  sub: '≥7.0', color: 'teal',    val: gradeStats.b },
            { label: 'C+', sub: '≥6.3', color: 'cyan',    val: gradeStats.cPlus },
            { label: 'C',  sub: '≥5.5', color: 'sky',     val: gradeStats.c },
            { label: 'D+', sub: '≥4.8', color: 'indigo',  val: gradeStats.dPlus },
            { label: 'D',  sub: '≥4.0', color: 'violet',  val: gradeStats.d },
            { label: 'F+', sub: '≥3.0', color: 'orange',  val: gradeStats.fPlus },
            { label: 'F',  sub: '<3.0', color: 'red',     val: gradeStats.f },
          ].map(({ label, sub, color, val }) => (
            <div key={label} className={`text-center p-3 bg-${color}-50 rounded-xl`}>
              <div className={`text-xl font-bold text-${color}-600`}>{val}</div>
              <div className={`text-sm font-semibold text-${color}-700`}>{label}</div>
              <div className="text-xs text-gray-400">{sub}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Bảng điểm ── */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">MSSV</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Sinh viên</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Môn học</th>
                <th className="text-left py-4 px-3 text-sm font-semibold text-gray-500">Học kỳ</th>
                <th className="text-center py-4 px-2 text-sm font-semibold text-gray-700">CC<br/><span className="text-xs font-normal text-gray-400">(10%)</span></th>
                <th className="text-center py-4 px-2 text-sm font-semibold text-gray-700">BT<br/><span className="text-xs font-normal text-gray-400">(15%)</span></th>
                <th className="text-center py-4 px-2 text-sm font-semibold text-gray-700">GK<br/><span className="text-xs font-normal text-gray-400">(25%)</span></th>
                <th className="text-center py-4 px-2 text-sm font-semibold text-gray-700">CK<br/><span className="text-xs font-normal text-gray-400">(50%)</span></th>
                <th className="text-center py-4 px-3 text-sm font-bold text-gray-800">TB</th>
                <th className="text-center py-4 px-3 text-sm font-bold text-orange-600">GPA</th>
                <th className="text-center py-4 px-3 text-sm font-semibold text-gray-700">Xếp loại</th>
                <th className="text-center py-4 px-4 text-sm font-semibold text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredGrades.length > 0 ? filteredGrades.map((grade, idx) => {
                const scored = hasAnyScore(grade.DiemChuyenCan, grade.DiemBaiTap, grade.DiemGiuaKy, grade.DiemCuoiKy);
                const t10    = scored ? calculateTotal10(grade.DiemChuyenCan, grade.DiemBaiTap, grade.DiemGiuaKy, grade.DiemCuoiKy) : null;
                const gpa    = t10 ? convertToGPA(t10) : null;
                const letter = scored ? (grade.DiemChu || gpa?.letter) : null;
                return (
                  <motion.tr key={grade.MaDiem}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}
                    className="border-b border-gray-100 hover:bg-orange-50 transition-colors"
                  >
                    <td className="py-4 px-4 text-sm font-medium text-gray-800">{grade.MSSV}</td>
                    <td className="py-4 px-4 text-sm text-gray-700">{grade.TenSinhVien || 'N/A'}</td>
                    <td className="py-4 px-4 text-sm text-gray-600 max-w-[160px] truncate">{grade.TenMonHoc || 'N/A'}</td>
                    <td className="py-4 px-3 text-xs text-gray-400">{grade.HocKy || '—'}</td>
                    <td className="py-4 px-2 text-sm text-center text-gray-600">{grade.DiemChuyenCan ?? '—'}</td>
                    <td className="py-4 px-2 text-sm text-center text-gray-600">{grade.DiemBaiTap    ?? '—'}</td>
                    <td className="py-4 px-2 text-sm text-center text-gray-600">{grade.DiemGiuaKy   ?? '—'}</td>
                    <td className="py-4 px-2 text-sm text-center text-gray-600">{grade.DiemCuoiKy   ?? '—'}</td>
                    <td className="py-4 px-3 text-sm text-center font-bold text-gray-800">
                      {scored ? (grade.DiemTong || t10) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-4 px-3 text-sm text-center font-bold text-orange-600">
                      {scored ? (grade.DiemGPA ?? gpa?.gpa.toFixed(1)) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className={`py-4 px-3 text-sm text-center font-bold ${getLetterColor(letter)}`}>
                      {letter ?? <span className="text-gray-300 font-normal">—</span>}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => handleEdit(grade)}
                          className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200"
                        ><Edit className="w-4 h-4" /></motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(grade.MaDiem, grade.TenSinhVien, grade.TenMonHoc)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                        ><Trash2 className="w-4 h-4" /></motion.button>
                      </div>
                    </td>
                  </motion.tr>
                );
              }) : (
                <tr>
                  <td colSpan="12" className="py-16 text-center text-gray-400">
                    <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    Không tìm thấy điểm nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Thêm / Sửa ── */}
      {showModal && (
        <ModalPortal>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 flex justify-between items-center flex-shrink-0">
                <div className="text-white">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    {editingGrade ? 'Cập nhật điểm' : 'Thêm điểm mới'}
                  </h3>
                  <p className="text-orange-100 text-sm mt-0.5">Nhập điểm thành phần và xem quy đổi GPA</p>
                </div>
                <button onClick={handleCloseModal} className="p-2 hover:bg-white/20 rounded-lg text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                {/* 1. Chọn Khoa */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Khoa <span className="text-gray-400 font-normal">(lọc lớp học phần)</span>
                  </label>
                  <select value={formData.selectedKhoa}
                    onChange={e => setFormData(prev => ({
                      ...prev, selectedKhoa: e.target.value, MaLopHocPhan: '', HocKy: '', MSSV: ''
                    }))}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                  >
                    <option value="">Tất cả khoa</option>
                    {faculties.map(f => <option key={f.MaKhoa} value={f.MaKhoa}>{f.TenKhoa}</option>)}
                  </select>
                </div>

                {/* 2. Chọn LHP */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Lớp học phần <span className="text-red-500">*</span>
                  </label>
                  <select value={formData.MaLopHocPhan}
                    onChange={e => handleSectionChange(e.target.value)}
                    className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors
                      ${formErrors.MaLopHocPhan ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-orange-500'}`}
                    required
                  >
                    <option value="">Chọn lớp học phần</option>
                    {getSectionsByKhoa(formData.selectedKhoa).map(cs => (
                      <option key={cs.MaLopHocPhan} value={cs.MaLopHocPhan}>
                        {cs.TenMonHoc} — {cs.MaLopHocPhan}
                      </option>
                    ))}
                  </select>
                  {formErrors.MaLopHocPhan && (
                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1.5 bg-red-50 px-2 py-1 rounded-lg border border-red-100">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="underline decoration-red-400 decoration-dotted">{formErrors.MaLopHocPhan}</span>
                    </p>
                  )}
                </div>

                {/* Học kỳ readonly */}
                {formData.HocKy && (
                  <div className="px-4 py-2 bg-gray-100 rounded-xl text-sm text-gray-600 flex items-center gap-2">
                    <span className="font-semibold">Học kỳ:</span> {formData.HocKy}
                  </div>
                )}

                {/* 3. Chọn SV */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sinh viên <span className="text-red-500">*</span>
                    {formData.MaLopHocPhan && (
                      <span className="ml-2 text-xs font-normal text-orange-500">
                        ({getEnrolledStudents(formData.MaLopHocPhan).length} sinh viên trong lớp)
                      </span>
                    )}
                  </label>
                  <select value={formData.MSSV}
                    disabled={!formData.MaLopHocPhan}
                    onChange={e => {
                      setFormData(prev => ({ ...prev, MSSV: e.target.value }));
                      if (formErrors.MSSV) setFormErrors(p => ({ ...p, MSSV: '' }));
                    }}
                    className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors
                      ${!formData.MaLopHocPhan ? 'opacity-50 cursor-not-allowed' : ''}
                      ${formErrors.MSSV ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-orange-500'}`}
                    required
                  >
                    <option value="">{formData.MaLopHocPhan ? 'Chọn sinh viên trong lớp' : 'Chọn lớp học phần trước'}</option>
                    {getEnrolledStudents(formData.MaLopHocPhan).map(s => {
                      const alreadyGraded = !editingGrade && grades.some(g => g.MSSV === s.MSSV && g.MaLopHocPhan === formData.MaLopHocPhan);
                      return (
                        <option key={s.MSSV} value={s.MSSV} disabled={alreadyGraded}>
                          {s.MSSV} — {s.HoTen}{alreadyGraded ? ' ✓ đã có điểm' : ''}
                        </option>
                      );
                    })}
                  </select>
                  {formErrors.MSSV && (
                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1.5 bg-red-50 px-2 py-1 rounded-lg border border-red-100">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="underline decoration-red-400 decoration-dotted">{formErrors.MSSV}</span>
                    </p>
                  )}
                </div>

                {/* 4. Điểm thành phần */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { field: 'DiemChuyenCan', label: 'Chuyên cần', pct: '10%' },
                    { field: 'DiemBaiTap',    label: 'Bài tập',    pct: '15%' },
                    { field: 'DiemGiuaKy',    label: 'Giữa kỳ',   pct: '25%' },
                    { field: 'DiemCuoiKy',    label: 'Cuối kỳ',   pct: '50%' },
                  ].map(({ field, label, pct }) => (
                    <div key={field}>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {label} <span className="text-gray-400 font-normal">({pct})</span>
                      </label>
                      <ScoreInput
                        value={formData[field]}
                        onChange={val => {
                          setFormData(prev => ({ ...prev, [field]: val }));
                          if (formErrors[field]) setFormErrors(p => ({ ...p, [field]: '' }));
                        }}
                        error={formErrors[field]}
                      />
                    </div>
                  ))}
                </div>

                {/* Preview */}
                <div className={`p-4 rounded-xl border flex items-center justify-between
                  ${hasPreview && allScoresValid ? 'bg-orange-50 border-orange-100' : 'bg-gray-50 border-gray-100'}`}
                >
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Tạm tính Hệ 10</p>
                    <p className={`text-2xl font-bold ${hasPreview && allScoresValid ? 'text-gray-800' : 'text-gray-300'}`}>
                      {hasPreview && allScoresValid ? previewTotal : '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 font-medium">Quy đổi GPA</p>
                    {hasPreview && allScoresValid ? (
                      <p className="text-2xl font-bold text-orange-600">
                        {previewGPA.gpa.toFixed(1)}
                        <span className={`text-lg ml-2 ${getLetterColor(previewGPA.letter)}`}>
                          ({previewGPA.letter})
                        </span>
                      </p>
                    ) : (
                      <p className="text-2xl font-bold text-gray-300">—</p>
                    )}
                  </div>
                </div>
                {hasPreview && allScoresValid && (
                  <p className="text-center text-sm text-gray-500">{previewGPA.text}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={handleCloseModal}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200"
                  >Hủy</button>
                  <button type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-lg"
                  >{editingGrade ? 'Lưu thay đổi' : 'Thêm điểm'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </ModalPortal>
      )}

      {/* ── Modal Nhập hàng loạt ── */}
      {showBulkModal && (
        <ModalPortal>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/40"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white rounded-2xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Nhập điểm hàng loạt</h3>
                  <p className="text-sm text-gray-500 mt-1">Chọn Khoa → Lớp học phần → hệ thống tải đúng sinh viên đã đăng ký</p>
                </div>
                <button onClick={() => setShowBulkModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {bulkError && (
                <div className="mb-4 flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="underline decoration-red-400">{bulkError}</span>
                  <button onClick={() => setBulkError('')} className="ml-auto"><X className="w-4 h-4" /></button>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Khoa</label>
                    <select value={bulkKhoa}
                      onChange={e => { setBulkKhoa(e.target.value); setBulkSection(''); setBulkGrades([]); }}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    >
                      <option value="">Tất cả khoa</option>
                      {faculties.map(f => <option key={f.MaKhoa} value={f.MaKhoa}>{f.TenKhoa}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Lớp học phần <span className="text-red-500">*</span>
                    </label>
                    <select value={bulkSection} onChange={e => handleBulkSectionChange(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    >
                      <option value="">Chọn lớp học phần</option>
                      {getSectionsByKhoa(bulkKhoa).map(cs => (
                        <option key={cs.MaLopHocPhan} value={cs.MaLopHocPhan}>
                          {cs.TenMonHoc} — {cs.MaLopHocPhan} — HK{cs.HocKy} {cs.NamBatDau}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {bulkGrades.length > 0 ? (
                  <div className="overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">MSSV</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Họ tên</th>
                          <th className="text-center py-3 px-3 text-sm font-semibold text-gray-700">CC<br/><span className="text-xs font-normal text-gray-400">(10%)</span></th>
                          <th className="text-center py-3 px-3 text-sm font-semibold text-gray-700">BT<br/><span className="text-xs font-normal text-gray-400">(15%)</span></th>
                          <th className="text-center py-3 px-3 text-sm font-semibold text-gray-700">GK<br/><span className="text-xs font-normal text-gray-400">(25%)</span></th>
                          <th className="text-center py-3 px-3 text-sm font-semibold text-gray-700">CK<br/><span className="text-xs font-normal text-gray-400">(50%)</span></th>
                          <th className="text-center py-3 px-3 text-sm font-semibold text-gray-700">TB</th>
                          <th className="text-center py-3 px-3 text-sm font-semibold text-gray-700">Xếp loại</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkGrades.map((grade, idx) => {
                          const scored    = hasAnyScore(grade.DiemChuyenCan, grade.DiemBaiTap, grade.DiemGiuaKy, grade.DiemCuoiKy);
                          const hasRowErr = SCORE_FIELDS.some(f => grade.rowErrors?.[f]);
                          const t10       = scored && !hasRowErr ? calculateTotal10(grade.DiemChuyenCan, grade.DiemBaiTap, grade.DiemGiuaKy, grade.DiemCuoiKy) : null;
                          const gpa       = t10 ? convertToGPA(t10) : null;
                          return (
                            <tr key={idx} className={`border-b border-gray-100 ${grade.alreadyExists ? 'bg-blue-50/40' : ''} ${hasRowErr ? 'bg-red-50/30' : ''}`}>
                              <td className="py-3 px-4 text-sm font-medium text-gray-800">
                                {grade.MSSV}
                                {grade.alreadyExists && <span className="ml-1 text-xs text-blue-500">(cập nhật)</span>}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600">{grade.HoTen}</td>
                              {SCORE_FIELDS.map(field => (
                                <td key={field} className="py-4 px-3 text-center">
                                  <BulkScoreInput
                                    value={grade[field]}
                                    onChange={val => handleBulkFieldChange(idx, field, val)}
                                  />
                                </td>
                              ))}
                              <td className="py-3 px-3 text-center text-sm font-bold text-gray-700">
                                {t10 ?? <span className="text-gray-300">—</span>}
                              </td>
                              <td className={`py-3 px-3 text-center text-sm font-bold ${getLetterColor(gpa?.letter)}`}>
                                {gpa?.letter ?? <span className="text-gray-300">—</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : bulkSection ? (
                  <div className="py-10 text-center text-gray-400">Không có sinh viên nào đã đăng ký lớp này</div>
                ) : null}

                <div className="flex gap-3 pt-2">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleBulkSubmit}
                    disabled={bulkGrades.length === 0}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 rounded-xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >Lưu tất cả ({bulkGrades.length} sinh viên)</motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setShowBulkModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300"
                  >Hủy</motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </ModalPortal>
      )}
    </div>
  );
}

export default GradeManagement;
