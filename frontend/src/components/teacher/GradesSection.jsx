import React, { useState, useEffect, useCallback, useMemo } from 'react';
import API_URL from '../../api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, Plus, Edit, Trash2, Search, X, Filter,
  XCircle, RefreshCw, CheckCircle, CheckCircle2, AlertCircle, AlertTriangle,
  Settings, Save, Info, ChevronDown, ChevronUp, Users, Lock, CheckSquare
} from 'lucide-react';
import axios from 'axios';

// ================================================================
// STORAGE KEY
// ================================================================
const getConfigKey = (maLopHocPhan) => `grade_config_${maLopHocPhan}`;
const getLockKey = (maLopHocPhan) => `grade_config_locked_${maLopHocPhan}`;

const DEFAULT_COMPONENTS = [
  { key: 'DiemChuyenCan', label: 'Chuyên cần', shortLabel: 'CC', weight: 10, enabled: true },
  { key: 'DiemBaiTap', label: 'Bài tập', shortLabel: 'BT', weight: 20, enabled: true },
  { key: 'DiemGiuaKy', label: 'Giữa kỳ', shortLabel: 'GK', weight: 20, enabled: true },
  { key: 'DiemCuoiKy', label: 'Cuối kỳ', shortLabel: 'CK', weight: 50, enabled: true },
];

const loadConfig = (maLopHocPhan) => {
  try {
    const saved = localStorage.getItem(getConfigKey(maLopHocPhan));
    if (saved) return JSON.parse(saved);
  } catch (_) { }
  return DEFAULT_COMPONENTS.map(c => ({ ...c }));
};

const saveConfig = (maLopHocPhan, components) => {
  try {
    localStorage.setItem(getConfigKey(maLopHocPhan), JSON.stringify(components));
  } catch (_) { }
};

// ================================================================
// Tính điểm theo config động
// ================================================================
const calcTotal10 = (formData, components) => {
  const active = components.filter(c => c.enabled && Number(c.weight) > 0);
  if (active.length === 0) return '0.00';
  const total = active.reduce((sum, c) => {
    let val = parseFloat(formData[c.key]);
    if (isNaN(val) || val < 0) val = 0;
    return sum + (val * (Number(c.weight) / 100));
  }, 0);
  return total.toFixed(2);
};

const convertToGPA = (total10) => {
  const t = parseFloat(total10);
  if (isNaN(t)) return { gpa: 0.0, letter: 'F', text: 'Chưa có điểm' };
  if (t >= 8.5) return { gpa: 4.0, letter: 'A', text: 'Xuất sắc' };
  if (t >= 7.8) return { gpa: 3.7, letter: 'B+', text: 'Giỏi' };
  if (t >= 7.0) return { gpa: 3.5, letter: 'B', text: 'Khá giỏi' };
  if (t >= 6.3) return { gpa: 3.0, letter: 'C+', text: 'Khá' };
  if (t >= 5.5) return { gpa: 2.5, letter: 'C', text: 'Trung bình khá' };
  if (t >= 4.8) return { gpa: 2.0, letter: 'D+', text: 'Trung bình' };
  if (t >= 4.0) return { gpa: 1.5, letter: 'D', text: 'Yếu' };
  if (t >= 3.0) return { gpa: 1.0, letter: 'F+', text: 'Kém' };
  return { gpa: 0.0, letter: 'F', text: 'Không đạt' };
};

const getLetterColor = (letter) => {
  if (!letter) return 'text-gray-300';
  if (letter === 'A') return 'text-[#22C55E]';
  if (letter.startsWith('B')) return 'text-[#3B82F6]';
  if (letter.startsWith('C')) return 'text-yellow-600';
  if (letter.startsWith('D')) return 'text-[#F4C542]';
  return 'text-[#EF4444]';
};

// ================================================================
// Component: ScoreInput
// ================================================================
function ScoreInput({ value, onChange, onError, disabled, placeholder = '—' }) {
  const [localVal, setLocalVal] = useState(value ?? '');
  const [err, setErr] = useState('');

  useEffect(() => {
    if ((value === '' || value == null) && localVal !== '') {
      setLocalVal(''); setErr(''); onError && onError(false);
    } else if (value !== localVal) {
      setLocalVal(value ?? '');
    }
  }, [value]);

  const setE = (msg) => { setErr(msg); onError && onError(!!msg); };

  const handle = (e) => {
    let raw = e.target.value;
    if (raw.includes('-')) return;

    setLocalVal(raw);
    if (raw === '') { setE(''); onChange(''); return; }
    const n = parseFloat(raw);
    if (isNaN(n)) { setE('Không hợp lệ'); return; }
    if (n < 0) { setE('Không được âm'); return; }
    if (n > 10) { setE('Tối đa 10'); return; }
    setE(''); onChange(raw);
  };

  const blockInvalidKeys = (e) => {
    if (['-', 'e', '+'].includes(e.key)) e.preventDefault();
  };

  return (
    <div>
      <input
        type="number" step="0.1" min="0" max="10"
        placeholder={placeholder}
        value={localVal}
        onChange={handle}
        onKeyDown={blockInvalidKeys}
        disabled={disabled}
        onWheel={e => e.target.blur()}
        className={`w-full px-3 py-2.5 border-2 rounded-xl focus:outline-none transition-colors text-sm font-semibold
          ${disabled ? 'bg-gray-100 opacity-50 cursor-not-allowed border-[#E5E7EB] text-[#6B7280]' :
            err ? 'border-red-500 bg-[#EF4444]/10' : 'bg-[#F7F8FA] border-[#E5E7EB] focus:border-[#F4C542] text-[#1F2937]'}`}
      />
      {err && <p className="text-[#EF4444] text-xs mt-1.5 font-bold">{err}</p>}
    </div>
  );
}

// ================================================================
// Component: ConfigPanel
// ================================================================
function ConfigPanel({ maLopHocPhan, tenLop, components, locked, onChange, onSaveRequest }) {
  const enabledCount = components.filter(c => c.enabled).length;
  const totalWeight = components.filter(c => c.enabled).reduce((s, c) => s + (parseInt(c.weight) || 0), 0);
  const isValid = totalWeight === 100 && enabledCount >= 1;

  const toggleComp = (key) => {
    if (locked) return;
    const next = components.map(c => c.key === key ? { ...c, enabled: !c.enabled, weight: !c.enabled ? c.weight : 0 } : c);
    onChange(next);
  };

  const setWeight = (key, val) => {
    if (locked) return;
    if (val.includes('-')) return;

    let n = parseInt(val, 10);
    if (isNaN(n) || n < 0) n = 0;
    if (n > 100) n = 100;
    const next = components.map(c => c.key === key ? { ...c, weight: n } : c);
    onChange(next);
  };

  const blockInvalidKeys = (e) => {
    if (['-', 'e', '+', '.', ','].includes(e.key)) e.preventDefault();
  };

  return (
    <div className={`border-2 rounded-2xl p-5 shadow-sm transition-colors ${locked ? 'bg-[#F7F8FA] border-[#E5E7EB]' : 'bg-[#FFFFFF] border-[#F4C542]/30'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {locked ? <Lock className="w-5 h-5 text-[#6B7280]" /> : <Settings className="w-5 h-5 text-[#F4C542]" />}
          <span className={`font-bold ${locked ? 'text-[#6B7280]' : 'text-[#1F2937]'}`}>
            Cấu hình điểm — {tenLop} {locked && '(Đã chốt)'}
          </span>
        </div>
        <div className={`text-sm font-bold px-3 py-1 rounded-full ${locked ? 'bg-gray-200 text-[#6B7280]' : isValid ? 'bg-[#22C55E]/20 text-green-700' : 'bg-[#EF4444]/20 text-[#EF4444]'}`}>
          Tổng: {totalWeight}% {isValid && !locked ? ' ✓' : ''}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {components.map(c => (
          <div key={c.key} className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all
            ${locked ? 'border-[#E5E7EB] bg-gray-100 opacity-80' : c.enabled ? 'border-[#F4C542]/30 bg-[#FFF7D6]/50 hover:bg-[#FFF7D6]' : 'border-[#E5E7EB] bg-[#F7F8FA] opacity-60'}`}>
            <input
              type="checkbox" checked={c.enabled} disabled={locked} onChange={() => toggleComp(c.key)}
              className="w-4 h-4 accent-orange-500 cursor-pointer disabled:cursor-not-allowed"
            />
            <span className="text-sm font-bold text-gray-700">{c.label}</span>
            <div className="flex items-center gap-1 ml-auto">
              <input
                type="number" min="0" max="100" value={c.enabled ? c.weight : ''} disabled={!c.enabled || locked}
                onChange={e => setWeight(c.key, e.target.value)} onKeyDown={blockInvalidKeys} placeholder="0"
                className={`w-14 text-center px-2 py-1.5 border-2 rounded-lg text-sm font-bold focus:outline-none transition-colors
                  ${(!c.enabled || locked) ? 'bg-gray-100 border-transparent text-gray-300 cursor-not-allowed' : 'bg-[#FFFFFF] border-orange-300 focus:border-[#F4C542] text-[#1F2937]'}`}
              />
              <span className="text-sm font-bold text-[#6B7280]">%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${locked ? 'bg-gray-400' : totalWeight === 100 ? 'bg-[#22C55E]/100' : totalWeight > 100 ? 'bg-[#EF4444]/100' : 'bg-orange-400'}`}
            style={{ width: `${Math.min(totalWeight, 100)}%` }}
          />
        </div>
        {locked ? (
          <button disabled className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-gray-200 text-[#6B7280] cursor-not-allowed border border-gray-300">
            <Lock className="w-4 h-4" /> Đã chốt cấu hình
          </button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} disabled={!isValid} onClick={() => isValid && onSaveRequest()}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md
              ${isValid ? 'bg-gradient-to-r from-[#F4C542] to-red-500 text-white' : 'bg-gray-200 text-gray-300 cursor-not-allowed'}`}
          >
            <Lock className="w-4 h-4" /> Chốt cấu hình điểm
          </motion.button>
        )}
      </div>

      {!isValid && totalWeight !== 0 && !locked && (
        <p className="text-[#EF4444] text-xs mt-3 flex items-center gap-1.5 font-bold">
          <AlertCircle className="w-4 h-4" />
          Tổng trọng số phải bằng đúng 100%. Hiện tại đang là {totalWeight}%.
        </p>
      )}
    </div>
  );
}

// ================================================================
// MAIN COMPONENT TEACHER
// ================================================================
function GradesSection({ grades, teachingAssignments, teachingSchedule, students, user, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState({ show: false, type: 'success', message: '' });
  const [deleteModal, setDeleteModal] = useState({ show: false, maDiem: null, tenSinhVien: '', tenMonHoc: '' });

  const [configConfirm, setConfigConfirm] = useState({ show: false, maLopHocPhan: null, checked: false });
  const [submitConfirmModal, setSubmitConfirmModal] = useState({ show: false, payload: null, isEdit: false });

  const [configOpen, setConfigOpen] = useState({});
  const [classConfigs, setClassConfigs] = useState({});
  const [activeConfigs, setActiveConfigs] = useState({});
  const [lockedConfigs, setLockedConfigs] = useState({});

  const [showModal, setShowModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const [formData, setFormData] = useState({
    MSSV: '', MaLopHocPhan: '', HocKy: '',
    DiemChuyenCan: '', DiemBaiTap: '', DiemGiuaKy: '', DiemCuoiKy: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [scoreInputErrors, setScoreInputErrors] = useState({});

  useEffect(() => {
    if (!teachingAssignments?.length) return;
    const configs = {};
    const active = {};
    const locks = {};
    teachingAssignments.forEach(ta => {
      const cfg = loadConfig(ta.MaLopHocPhan);
      configs[ta.MaLopHocPhan] = cfg;
      active[ta.MaLopHocPhan] = cfg;
      const savedLock = localStorage.getItem(getLockKey(ta.MaLopHocPhan));
      locks[ta.MaLopHocPhan] = savedLock === null ? true : (savedLock === 'true');
    });
    setClassConfigs(configs);
    setActiveConfigs(active);
    setLockedConfigs(locks);
  }, [teachingAssignments]);

  const getActiveConfig = (maLopHocPhan) => activeConfigs[maLopHocPhan] || DEFAULT_COMPONENTS.map(c => ({ ...c }));

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: 'success', message: '' }), 4000);
  };

  const handleConfigChange = (maLopHocPhan, next) => {
    setClassConfigs(prev => ({ ...prev, [maLopHocPhan]: next }));
  };

  const handleRequestSaveConfig = (maLopHocPhan) => {
    setConfigConfirm({ show: true, maLopHocPhan, checked: false });
  };

  const executeSaveConfig = () => {
    const { maLopHocPhan } = configConfirm;
    if (!maLopHocPhan) return;

    const cfg = classConfigs[maLopHocPhan];
    saveConfig(maLopHocPhan, cfg);
    localStorage.setItem(getLockKey(maLopHocPhan), 'true');

    setActiveConfigs(prev => ({ ...prev, [maLopHocPhan]: cfg }));
    setLockedConfigs(prev => ({ ...prev, [maLopHocPhan]: true }));
    setConfigConfirm({ show: false, maLopHocPhan: null, checked: false });

    showNotification('success', 'Đã chốt cấu hình điểm vĩnh viễn!');
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingGrade(null);
    setFormErrors({});
    setScoreInputErrors({});
  };

  const openAddModal = () => {
    setEditingGrade(null);
    setFormData({ MSSV: '', MaLopHocPhan: '', HocKy: '', DiemChuyenCan: '', DiemBaiTap: '', DiemGiuaKy: '', DiemCuoiKy: '' });
    setFormErrors({}); setScoreInputErrors({}); setShowModal(true);
  };

  const openAddGradeForStudent = (ta, student) => {
    if (!lockedConfigs[ta.MaLopHocPhan]) {
      showNotification('error', `Vui lòng chốt cấu hình điểm cho môn ${ta.TenMonHoc} trước khi nhập điểm!`);
      return;
    }
    setEditingGrade(null);
    setFormData({
      MSSV: student.MSSV, MaLopHocPhan: ta.MaLopHocPhan, HocKy: ta.HocKy || '',
      DiemChuyenCan: '', DiemBaiTap: '', DiemGiuaKy: '', DiemCuoiKy: ''
    });
    setFormErrors({}); setScoreInputErrors({}); setShowModal(true);
  };

  const openEditModal = (grade) => {
    if (!lockedConfigs[grade.MaLopHocPhan]) {
      showNotification('error', `Môn học này chưa chốt cấu hình điểm! Vui lòng chốt trước khi sửa.`);
      return;
    }
    setEditingGrade(grade);
    setFormData({
      MSSV: grade.MSSV, MaLopHocPhan: grade.MaLopHocPhan || '', HocKy: grade.HocKy || '',
      DiemChuyenCan: grade.DiemChuyenCan ?? '', DiemBaiTap: grade.DiemBaiTap ?? '',
      DiemGiuaKy: grade.DiemGiuaKy ?? '', DiemCuoiKy: grade.DiemCuoiKy ?? '',
    });
    setFormErrors({}); setScoreInputErrors({}); setShowModal(true);
  };

  const handleSubmit = (e) => {
    e?.preventDefault();

    if (Object.values(scoreInputErrors).some(Boolean)) return;
    const errors = {};
    if (!formData.MSSV) errors.MSSV = 'Vui lòng chọn sinh viên';
    if (!formData.MaLopHocPhan) errors.MaLopHocPhan = 'Vui lòng chọn lớp học phần';
    if (Object.keys(errors).length) { setFormErrors(errors); return; }

    if (!lockedConfigs[formData.MaLopHocPhan]) {
      showNotification('error', 'Vui lòng chốt cấu hình điểm trước khi lưu điểm!');
      return;
    }

    const cfg = getActiveConfig(formData.MaLopHocPhan);
    const ta = (teachingAssignments || []).find(a => a.MaLopHocPhan === formData.MaLopHocPhan);
    const t10 = calcTotal10(formData, cfg);
    const gpa = convertToGPA(t10);

    const weights = {};
    cfg.forEach(c => { if (c.enabled) weights[`TrongSo_${c.shortLabel}`] = Number(c.weight) / 100; });

    const getPayloadValue = (key) => {
      const comp = cfg.find(c => c.key === key);
      if (!comp || !comp.enabled || Number(comp.weight) === 0) return null;
      return formData[key] !== '' && formData[key] != null ? formData[key] : null;
    };

    const payload = {
      MSSV: formData.MSSV, MaLopHocPhan: formData.MaLopHocPhan, HocKy: ta?.HocKy || formData.HocKy || '',
      DiemChuyenCan: getPayloadValue('DiemChuyenCan'),
      DiemBaiTap: getPayloadValue('DiemBaiTap'),
      DiemGiuaKy: getPayloadValue('DiemGiuaKy'),
      DiemCuoiKy: getPayloadValue('DiemCuoiKy'),
      DiemTong: t10, DiemGPA: gpa.gpa, DiemChu: gpa.letter, XepLoai: gpa.text,
      ...weights,
    };

    setSubmitConfirmModal({ show: true, payload, isEdit: !!editingGrade });
  };

  const executeSubmitGrade = async () => {
    const { payload, isEdit } = submitConfirmModal;
    try {
      if (isEdit) {
        await axios.put(`${API_URL}/api/grades/${editingGrade.MaDiem}`, payload);
        showNotification('success', 'Cập nhật điểm thành công!');
      } else {
        const existing = (grades || []).find(g => g.MSSV === payload.MSSV && g.MaLopHocPhan === payload.MaLopHocPhan);
        if (existing?.MaDiem) {
          await axios.put(`${API_URL}/api/grades/${existing.MaDiem}`, payload);
        } else {
          await axios.post(`${API_URL}/api/grades`, payload);
        }
        showNotification('success', 'Thêm điểm thành công!');
      }
      onRefresh && onRefresh();
      closeModal();
      setSubmitConfirmModal({ show: false, payload: null, isEdit: false });
    } catch (err) {
      setSubmitConfirmModal({ show: false, payload: null, isEdit: false });
      showNotification('error', err.response?.data?.message || 'Lỗi khi lưu điểm!');
    }
  };

  const handleDeleteCancel = () => setDeleteModal({ show: false, maDiem: null, tenSinhVien: '', tenMonHoc: '' });

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`${API_URL}/api/grades/${deleteModal.maDiem}`);
      handleDeleteCancel();
      onRefresh && onRefresh();
      showNotification('success', 'Xóa điểm thành công!');
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Lỗi khi xóa điểm!');
    }
  };

  const getStudentsForLHP = useCallback((maLopHocPhan) => {
    if (!maLopHocPhan) return [];
    const ta = (teachingAssignments || []).find(cs => cs.MaLopHocPhan === maLopHocPhan);
    const map = new Map();

    if (ta && ta.MaLop) {
      (students || []).filter(s => s.MaLop === ta.MaLop).forEach(s => map.set(s.MSSV, { ...s }));
    }

    (grades || []).filter(g => g.MaLopHocPhan === maLopHocPhan).forEach(g => {
      if (!map.has(g.MSSV)) {
        const stuInfo = (students || []).find(s => s.MSSV === g.MSSV);
        map.set(g.MSSV, { MSSV: g.MSSV, HoTen: stuInfo?.HoTen || g.TenSinhVien || 'Sinh viên' });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.MSSV.localeCompare(b.MSSV));
  }, [teachingAssignments, students, grades]);

  // ĐÃ FIX: Biến hasPreview đúng tên
  const activeCfgForm = formData.MaLopHocPhan ? getActiveConfig(formData.MaLopHocPhan) : DEFAULT_COMPONENTS;
  const previewTotal = calcTotal10(formData, activeCfgForm);
  const previewGPA = convertToGPA(previewTotal);
  const hasPreview = activeCfgForm.some(c => c.enabled && Number(c.weight) > 0 && formData[c.key] !== '' && formData[c.key] != null);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="bg-[#F4C542] rounded-3xl p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-[#152238] mb-1">Quản lý điểm sinh viên</h2>
          <p className="text-[#152238]/70 text-sm font-medium">Cấu hình trọng số & nhập điểm theo từng lớp học phần</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={openAddModal}
          className="flex items-center gap-2 bg-[#FFFFFF] text-[#F4C542] px-6 py-3 rounded-xl shadow-lg font-bold"
        >
          <Plus className="w-5 h-5" /> Thêm điểm thủ công
        </motion.button>
      </motion.div>

      <div className="relative max-w-2xl">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
        <input
          type="text" placeholder="Tìm sinh viên theo MSSV hoặc Họ tên..."
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-14 pr-10 py-3.5 bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl focus:outline-none focus:border-[#F4C542] focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm font-medium text-sm"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#6B7280] p-1 bg-gray-100 rounded-full">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {(teachingAssignments || []).length > 0 ? (
        <div className="space-y-4 pb-12">
          {(teachingAssignments || []).map(ta => {
            const isOpen = configOpen[ta.MaLopHocPhan];
            const cfg = classConfigs[ta.MaLopHocPhan] || DEFAULT_COMPONENTS.map(c => ({ ...c }));
            const isLocked = lockedConfigs[ta.MaLopHocPhan];
            const active = getActiveConfig(ta.MaLopHocPhan).filter(c => c.enabled);
            const hasSchedule = (teachingSchedule || []).some(s => s.MaLopHocPhan === ta.MaLopHocPhan);

            const studentsWithGrades = getStudentsForLHP(ta.MaLopHocPhan).map(s => {
              const grade = (grades || []).find(g => g.MSSV === s.MSSV && g.MaLopHocPhan === ta.MaLopHocPhan);
              return { ...s, grade };
            });

            const term = searchTerm.toLowerCase();
            const matchClass = term && (
              ta.TenMonHoc?.toLowerCase().includes(term) ||
              ta.MaLopHocPhan?.toLowerCase().includes(term)
            );

            const filteredStudents = studentsWithGrades.filter(s =>
              !term || matchClass || s.HoTen?.toLowerCase().includes(term) || s.MSSV?.toLowerCase().includes(term)
            );

            if (term && !matchClass && filteredStudents.length === 0) return null;

            return (
              <div key={ta.MaLopHocPhan} className="bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <button
                  onClick={() => setConfigOpen(prev => ({ ...prev, [ta.MaLopHocPhan]: !isOpen }))}
                  className="w-full flex items-center justify-between px-6 py-4 bg-[#FFFFFF] hover:bg-[#FFF7D6]/50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-[#F4C542]/20 text-[#B45309] rounded-xl group-hover:scale-110 transition-transform"><GraduationCap className="w-6 h-6" /></div>
                    <div className="text-left">
                      <p className="font-bold text-[#1F2937] text-base">{ta.TenMonHoc} <span className="text-gray-300 font-medium ml-1 text-sm">({ta.MaLopHocPhan})</span></p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {active.map(c => (
                          <span key={c.key} className="text-[11px] bg-gray-100 text-[#6B7280] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
                            {c.shortLabel}: {Number(c.weight)}%
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {isLocked && <span className="text-[11px] text-green-700 bg-[#22C55E]/10 border border-green-200 px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 uppercase tracking-wide"><CheckCircle2 className="w-3.5 h-3.5" /> Đã chốt</span>}
                    {!isLocked && <span className="text-[11px] text-[#F4C542] bg-[#FFF7D6] border border-[#F4C542]/30 px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 uppercase tracking-wide"><AlertCircle className="w-3.5 h-3.5" /> Chưa chốt</span>}
                    <div className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                      <ChevronDown className={`w-5 h-5 text-gray-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-[#E5E7EB] bg-[#F7F8FA]/30">

                      {!hasSchedule ? (
                        <div className="p-8 text-center bg-[#FEF2F2]">
                          <AlertTriangle className="w-12 h-12 text-[#EF4444] mx-auto mb-3" />
                          <h4 className="text-[#991B1B] font-bold text-lg mb-1">Chưa có lịch giảng dạy</h4>
                          <p className="text-[#B91C1C] text-sm">Lớp học phần này chưa được xếp lịch. Vui lòng thiết lập lịch giảng dạy trước khi cấu hình và nhập điểm.</p>
                        </div>
                      ) : (
                        <>
                          <div className="p-6">
                            <ConfigPanel
                              maLopHocPhan={ta.MaLopHocPhan}
                              tenLop={ta.TenMonHoc}
                              components={cfg}
                              locked={isLocked}
                              onChange={(next) => handleConfigChange(ta.MaLopHocPhan, next)}
                              onSaveRequest={() => handleRequestSaveConfig(ta.MaLopHocPhan)}
                            />
                          </div>

                          <div className="px-6 pb-6">
                            <div className="flex items-center justify-between mb-4 bg-[#3B82F6]/10 px-4 py-3 rounded-xl border border-blue-100">
                              <h4 className="font-bold text-blue-800 flex items-center gap-2"><Users className="w-5 h-5 text-[#3B82F6]" />Danh sách điểm sinh viên lớp {ta.TenLop}</h4>
                              <span className="text-sm text-[#3B82F6] font-bold bg-[#FFFFFF] px-3 py-1 rounded-lg shadow-sm border border-blue-100">Sĩ số: {filteredStudents.length}</span>
                            </div>

                            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm">
                              <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                  <thead className="bg-[#F7F8FA]/80 border-b border-[#E5E7EB]">
                                    <tr>
                                      <th className="py-4 px-5 text-xs font-black text-[#6B7280] uppercase tracking-wider">MSSV</th>
                                      <th className="py-4 px-4 text-xs font-black text-[#6B7280] uppercase tracking-wider">Họ Tên</th>
                                      {active.map(c => <th key={c.key} className="py-4 px-3 text-xs font-black text-[#6B7280] uppercase tracking-wider text-center">{c.shortLabel}</th>)}
                                      <th className="py-4 px-3 text-xs font-black text-[#1F2937] uppercase tracking-wider text-center bg-gray-100/50">Hệ 10</th>
                                      <th className="py-4 px-3 text-xs font-black text-[#152238] uppercase tracking-wider text-center bg-[#FFF7D6]/50">GPA</th>
                                      <th className="py-4 px-4 text-xs font-black text-[#6B7280] uppercase tracking-wider text-center">Thao tác</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {filteredStudents.length > 0 ? filteredStudents.map((stu) => {
                                      const grade = stu.grade;
                                      const hasGrade = !!grade;
                                      const t10 = hasGrade && grade.DiemTong != null ? grade.DiemTong : calcTotal10(grade || {}, active);
                                      const gpa = convertToGPA(t10);
                                      return (
                                        <tr key={stu.MSSV} className="hover:bg-[#3B82F6]/10/40 transition-colors group">
                                          <td className="py-4 px-5 text-sm font-bold text-gray-700">{stu.MSSV}</td>
                                          <td className="py-4 px-4 text-sm font-bold text-[#1F2937]">{stu.HoTen}</td>
                                          {active.map(c => {
                                            const isZero = !c.enabled || Number(c.weight) === 0;
                                            const val = grade && grade[c.key];
                                            const displayVal = isZero ? '—' : (hasGrade && val != null && val !== '' ? val : '—');
                                            return (
                                              <td key={c.key} className="py-4 px-3 text-sm text-center text-[#6B7280] font-medium">
                                                {displayVal}
                                              </td>
                                            );
                                          })}
                                          <td className="py-4 px-3 text-sm text-center font-black text-[#1F2937] bg-[#F7F8FA]/50 group-hover:bg-transparent">{t10}</td>
                                          <td className="py-4 px-3 text-sm text-center font-black text-[#F4C542] bg-[#FFF7D6]/50 group-hover:bg-transparent">{gpa.gpa.toFixed(1)}</td>
                                          <td className="py-3 px-4">
                                            <div className="flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                              {hasGrade ? (
                                                <>
                                                  <button onClick={() => openEditModal({ ...grade, TenSinhVien: stu.HoTen, TenMonHoc: ta.TenMonHoc })} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm ${!isLocked ? 'bg-gray-100 text-gray-300 cursor-not-allowed border border-[#E5E7EB]' : 'text-[#3B82F6] bg-[#3B82F6]/10 hover:bg-blue-100 border border-blue-100 hover:border-blue-200'}`}><Edit className="w-3.5 h-3.5" /> Sửa</button>
                                                  <button onClick={() => setDeleteModal({ show: true, maDiem: grade.MaDiem, tenSinhVien: stu.HoTen, tenMonHoc: ta.TenMonHoc })} className="p-1.5 text-[#EF4444] bg-[#EF4444]/10 hover:bg-red-200 border border-red-200 hover:border-red-200 rounded-lg transition-colors shadow-sm"><Trash2 className="w-4 h-4" /></button>
                                                </>
                                              ) : (
                                                <button onClick={() => openAddGradeForStudent(ta, stu)} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm ${!isLocked ? 'bg-gray-100 text-gray-300 cursor-not-allowed border border-[#E5E7EB]' : 'text-[#F4C542] bg-[#FFF7D6] hover:bg-[#FFF7D6] border border-[#F4C542]/30'}`}><Plus className="w-3.5 h-3.5" /> Nhập</button>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    }) : <tr><td colSpan={active.length + 5} className="py-8 text-center text-sm text-gray-300 font-medium">Lớp này chưa có sinh viên đăng ký</td></tr>}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-[#FFFFFF] border border-[#E5E7EB] rounded-3xl shadow-sm">
          <Search className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="font-semibold text-[#6B7280] text-lg">Không tìm thấy Lớp Học Phần nào khớp với bộ lọc.</p>
        </div>
      )}

      {/* MODAL THÊM / SỬA ĐIỂM */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center z-[9990] p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-[#FFFFFF] rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col relative z-10"
            >
              <div className="bg-[#F4C542] rounded-t-[2rem] px-8 py-6 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-2xl font-bold text-[#152238] mb-1">{editingGrade ? 'Cập nhật điểm' : 'Nhập điểm sinh viên'}</h3>
                  <p className="text-[#152238]/70 text-sm font-medium">Hệ thống sẽ tự động tính toán theo cấu hình lớp</p>
                </div>
                <button type="button" onClick={closeModal} className="p-2.5 bg-[#FFFFFF]/10 hover:bg-white/40 rounded-full transition-colors">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-7">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Lớp học phần <span className="text-[#EF4444]">*</span></label>
                    <select
                      value={formData.MaLopHocPhan} disabled={!!editingGrade || !!formData.MSSV}
                      onChange={e => {
                        setFormData(prev => ({ ...prev, MaLopHocPhan: e.target.value, MSSV: '', DiemChuyenCan: '', DiemBaiTap: '', DiemGiuaKy: '', DiemCuoiKy: '' }));
                        if (formErrors.MaLopHocPhan) setFormErrors(p => ({ ...p, MaLopHocPhan: '' }));
                      }}
                      className={`w-full px-4 py-3.5 border-2 rounded-xl focus:outline-none text-sm font-bold transition-colors
                        ${(editingGrade || formData.MSSV) ? 'opacity-60 cursor-not-allowed bg-gray-100 border-[#E5E7EB]' :
                          formErrors.MaLopHocPhan ? 'border-red-500 bg-[#EF4444]/10' : 'bg-[#FFFFFF] border-[#E5E7EB] focus:border-[#F4C542] text-[#1F2937]'}`}
                    >
                      <option value="">Chọn lớp học phần</option>
                      {(teachingAssignments || []).map(ta => {
                        const isLocked = lockedConfigs[ta.MaLopHocPhan];
                        const hasSched = (teachingSchedule || []).some(s => s.MaLopHocPhan === ta.MaLopHocPhan);
                        return (
                          <option key={ta.MaLopHocPhan} value={ta.MaLopHocPhan} disabled={!isLocked || !hasSched}>
                            {ta.TenMonHoc} — {ta.MaLopHocPhan} {!hasSched ? '(Chưa có lịch)' : (!isLocked ? '(Chưa chốt cấu hình)' : '')}
                          </option>
                        )
                      })}
                    </select>
                    {formErrors.MaLopHocPhan && <p className="text-[#EF4444] text-xs mt-1.5 font-bold">{formErrors.MaLopHocPhan}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Sinh viên <span className="text-[#EF4444]">*</span></label>
                    <select
                      value={formData.MSSV} disabled={!formData.MaLopHocPhan || !!editingGrade}
                      onChange={e => {
                        setFormData(prev => ({ ...prev, MSSV: e.target.value }));
                        if (formErrors.MSSV) setFormErrors(p => ({ ...p, MSSV: '' }));
                      }}
                      className={`w-full px-4 py-3.5 border-2 rounded-xl focus:outline-none text-sm font-bold transition-colors
                        ${(!formData.MaLopHocPhan || !!editingGrade) ? 'opacity-60 cursor-not-allowed bg-gray-100 border-[#E5E7EB]' :
                          formErrors.MSSV ? 'border-red-500 bg-[#EF4444]/10' : 'bg-[#FFFFFF] border-[#E5E7EB] focus:border-[#F4C542] text-[#1F2937]'}`}
                    >
                      <option value="">{formData.MaLopHocPhan ? 'Chọn sinh viên' : 'Chưa chọn lớp học phần'}</option>
                      {getStudentsForLHP(formData.MaLopHocPhan).map(s => {
                        const existRecord = (grades || []).find(g => g.MSSV === s.MSSV && g.MaLopHocPhan === formData.MaLopHocPhan);
                        const hasScore = existRecord && activeCfgForm.some(c => c.enabled && existRecord[c.key] != null && existRecord[c.key] !== '');
                        return (
                          <option key={s.MSSV} value={s.MSSV} disabled={!!hasScore && !editingGrade}>
                            {s.MSSV} — {s.HoTen}{hasScore ? ' ✓ đã có điểm' : ''}
                          </option>
                        );
                      })}
                    </select>
                    {formErrors.MSSV && <p className="text-[#EF4444] text-xs mt-1.5 font-bold">{formErrors.MSSV}</p>}
                  </div>
                </div>

                <div className="bg-[#F7F8FA] border-2 border-[#E5E7EB] rounded-2xl p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    {activeCfgForm.map(c => {
                      const isZero = !c.enabled || Number(c.weight) === 0;
                      return (
                        <div key={c.key}>
                          <label className="block text-xs font-bold text-[#1F2937] mb-2 uppercase tracking-wide">
                            {c.label} {!isZero ? <span className="text-[#F4C542] text-[11px] ml-0.5 font-black">({c.weight}%)</span> : <span className="text-gray-300 text-[11px] ml-0.5">(0%)</span>}
                          </label>
                          <ScoreInput
                            value={isZero ? '' : formData[c.key]}
                            disabled={isZero}
                            placeholder={!isZero ? '0.0' : '—'}
                            onChange={val => setFormData(prev => ({ ...prev, [c.key]: val }))}
                            onError={hasErr => setScoreInputErrors(prev => ({ ...prev, [c.key]: hasErr }))}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {hasPreview && (
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-[#FFF7D6] rounded-2xl px-6 py-5 flex justify-between items-center shadow-sm">
                    <div>
                      <p className="text-xs text-[#F4C542] font-bold uppercase mb-1 tracking-wider">Hệ 10 (Tạm tính)</p>
                      <p className="text-[2.5rem] leading-none font-black text-[#1F2937]">{previewTotal}</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="text-xs text-[#F4C542] font-bold uppercase mb-1 tracking-wider">Quy đổi Hệ 4 & Chữ</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-[2rem] leading-none font-black text-[#F4C542]">{previewGPA.gpa.toFixed(1)}</p>
                        <p className="text-2xl font-black text-[#3B82F6]">({previewGPA.letter})</p>
                      </div>
                      <p className="text-xs text-[#6B7280] font-bold mt-1.5 uppercase bg-[#FFFFFF] px-2 py-0.5 rounded-md border border-[#E5E7EB]">{previewGPA.text}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-2">
                  <button type="button" onClick={closeModal} className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors text-base">Hủy bỏ</button>
                  <button type="submit" disabled={Object.values(scoreInputErrors).some(Boolean)} className={`flex-1 py-4 rounded-xl font-bold text-base shadow-md transition-all ${Object.values(scoreInputErrors).some(Boolean) ? 'bg-gray-200 text-gray-300 cursor-not-allowed border-none' : 'bg-[#F4C542] text-[#152238] hover:bg-[#F4C542]/90 hover:shadow-lg hover:-translate-y-0.5 border border-[#F4C542]'}`}>{editingGrade ? 'Lưu thay đổi' : 'Xác nhận Thêm điểm'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL CẢNH BÁO XÁC NHẬN LƯU ĐIỂM */}
      <AnimatePresence>
        {submitConfirmModal.show && (
          <div className="fixed inset-0 flex items-center justify-center z-[10005] p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSubmitConfirmModal({ show: false, payload: null, isEdit: false })} />
            <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }} className="bg-[#FFFFFF] rounded-3xl p-8 w-full max-w-sm shadow-2xl relative z-10 text-center">
              <div className="w-20 h-20 bg-[#3B82F6]/10 text-[#3B82F6] rounded-full flex items-center justify-center mx-auto mb-5 border-[6px] border-blue-100/50 shadow-inner">
                <Save className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-[#1F2937] mb-3 tracking-tight">Xác nhận lưu điểm</h3>
              <p className="text-[#6B7280] text-sm font-medium mb-7 px-2 leading-relaxed">
                Bạn có chắc chắn muốn lưu điểm cho sinh viên này vào hệ thống? Dữ liệu điểm sẽ được cập nhật ngay lập tức.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setSubmitConfirmModal({ show: false, payload: null, isEdit: false })} className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">Kiểm tra lại</button>
                <button onClick={executeSubmitGrade} className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 hover:shadow-blue-500/25 transition-all">
                  Đồng ý lưu
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL CẢNH BÁO 2 LỚP - CHỐT CẤU HÌNH ĐIỂM */}
      <AnimatePresence>
        {configConfirm.show && (
          <div className="fixed inset-0 flex items-center justify-center z-[10000] p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfigConfirm({ show: false, maLopHocPhan: null, checked: false })} />
            <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }} className="bg-[#FFFFFF] rounded-3xl p-8 w-full max-w-md shadow-2xl relative z-10 text-center">
              <div className="w-20 h-20 bg-red-100 text-[#DC2626] rounded-full flex items-center justify-center mx-auto mb-5 border-[6px] border-red-200/50 shadow-inner">
                <Lock className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-[#1F2937] mb-3 tracking-tight">Xác nhận chốt cấu hình</h3>
              <p className="text-[#6B7280] text-sm font-medium mb-6 px-2 leading-relaxed">
                Trọng số điểm của môn học này sẽ được áp dụng cho toàn bộ sinh viên trong danh sách.
              </p>

              <label className="flex items-start gap-3 bg-[#EF4444]/10/50 hover:bg-[#EF4444]/10 p-4 rounded-xl border-2 border-red-200 text-left cursor-pointer mb-7 transition-colors group">
                <div className="pt-0.5">
                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-red-600 rounded cursor-pointer"
                    checked={configConfirm.checked}
                    onChange={e => setConfigConfirm(prev => ({ ...prev, checked: e.target.checked }))}
                  />
                </div>
                <span className="text-sm font-bold text-red-800 leading-tight">
                  Tôi hiểu rằng sau khi bấm chốt, cấu hình sẽ bị KHÓA VĨNH VIỄN và tuyệt đối KHÔNG THỂ thay đổi được nữa.
                </span>
              </label>

              <div className="flex gap-3">
                <button onClick={() => setConfigConfirm({ show: false, maLopHocPhan: null, checked: false })} className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">Quay lại</button>
                <button
                  disabled={!configConfirm.checked}
                  onClick={executeSaveConfig}
                  className={`flex-1 py-3.5 rounded-xl font-bold shadow-md transition-all ${!configConfirm.checked ? 'bg-gray-200 text-gray-300 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-red-500/25'}`}
                >
                  Chốt vĩnh viễn
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL XÓA ĐIỂM */}
      <AnimatePresence>
        {deleteModal.show && (
          <div className="fixed inset-0 flex items-center justify-center z-[10000] p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleDeleteCancel} />
            <motion.div
              initial={{ scale: 0.85, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.85, y: 20, opacity: 0 }}
              className="bg-[#FFFFFF] rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center relative z-10"
            >
              <div className="w-20 h-20 bg-[#F4C542]/20 text-[#B45309] rounded-full flex items-center justify-center mx-auto mb-5 border-[6px] border-[#FFF7D6]/50">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-[#1F2937] mb-2 tracking-tight">Xác nhận xóa điểm</h3>
              <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl p-4 mb-7 space-y-1.5">
                <p className="text-sm text-[#6B7280] font-medium">Xóa điểm của sinh viên:</p>
                <p className="text-base font-black text-[#1F2937]">{deleteModal.tenSinhVien}</p>
                <p className="text-xs text-[#EF4444] font-bold mt-2 pt-2 border-t border-[#E5E7EB]">Dữ liệu xóa sẽ không thể khôi phục!</p>
              </div>
              <div className="flex gap-3">
                <button onClick={handleDeleteCancel} className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">Hủy</button>
                <button onClick={handleDeleteConfirm} className="flex-1 py-3.5 bg-[#F4C542] text-[#152238] rounded-xl font-bold shadow-md hover:from-orange-600 hover:to-red-700 transition-colors flex items-center justify-center gap-2"><Trash2 className="w-5 h-5" /> Xóa ngay</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={`fixed bottom-8 right-8 z-[11000] flex items-center gap-3.5 px-6 py-4 rounded-2xl shadow-2xl text-white font-bold tracking-wide
              ${notification.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-rose-600'}`}
          >
            {notification.type === 'success' ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            <span className="text-[15px]">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default GradesSection;