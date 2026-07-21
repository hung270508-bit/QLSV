import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import API_URL from '../../api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays, Plus, Trash2, Pencil, CheckCircle2, AlertCircle,
  X, ChevronRight, Calendar, AlertTriangle, Search,
  ToggleLeft, ToggleRight, Hourglass, TrendingUp, Clock
} from 'lucide-react';

const TEN_DOT_ALLOWED_REGEX = /^[\p{L}\p{N}\s\-_(),.]*$/u;
const TEN_DOT_INVALID_CHARS_REGEX = /[^\p{L}\p{N}\s\-_(),.]/gu;

const fmtDateTime = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

function diffText(ms) {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `${days}n ${hours}g`;
  if (hours > 0) return `${hours}g ${mins}p`;
  return `${mins} phút`;
}

const getMinDateTimeStr = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  const localTime = new Date(d.getTime() - offset);
  return localTime.toISOString().slice(0, 16);
};

const toLocalISOString = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const offset = d.getTimezoneOffset() * 60000;
  const localTime = new Date(d.getTime() - offset);
  return localTime.toISOString().slice(0, 16);
};

// ── sub-components ────────────────────────────────────────────────────────────
function Toast({ toast, onClose }) {
  const cfg = {
    success: { bg: 'bg-[#10B981]', text: 'text-white', icon: <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0" /> },
    warning: { bg: 'bg-[#F59E0B]', text: 'text-white', icon: <AlertTriangle className="w-5 h-5 text-white flex-shrink-0" /> },
    error: { bg: 'bg-[#EF4444]', text: 'text-white', icon: <AlertCircle className="w-5 h-5 text-white flex-shrink-0" /> },
  }[toast.type] || {};
  return (
    <motion.div initial={{ opacity: 0, y: -24, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -24, scale: 0.95 }}
      className={`flex items-center gap-3 rounded-xl shadow-xl px-5 py-3.5 max-w-sm w-full ${cfg.bg} ${cfg.text}`}>
      {cfg.icon}
      <p className={`flex-1 text-sm font-medium leading-relaxed`}>{toast.message}</p>
      <button onClick={onClose} className="text-white/70 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
    </motion.div>
  );
}

function ConfirmModal({ dialog, onClose }) {
  if (!dialog) return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className={`px-6 py-4 ${dialog.variant === 'danger' ? 'bg-red-50 border-b border-red-100' : 'bg-slate-50 border-b border-slate-100'}`}>
          <h3 className={`font-bold text-base ${dialog.variant === 'danger' ? 'text-red-800' : 'text-slate-800'}`}>{dialog.title}</h3>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-slate-600 leading-relaxed">{dialog.message}</p>
        </div>
        <div className="px-6 pb-5 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Hủy</button>
          <button onClick={dialog.onConfirm} className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors ${dialog.variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#152238] hover:bg-[#0f1a2b]'}`}>
            {dialog.confirmLabel || 'Xác nhận'}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

function AlertDialog({ dialog, onClose }) {
  if (!dialog) return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-amber-300">
        <div className="px-6 py-4 bg-amber-50 border-b border-amber-100 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
          <h3 className="font-bold text-base text-amber-900">{dialog.title || 'Thông báo hệ thống'}</h3>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-slate-700 leading-relaxed font-medium">{dialog.message}</p>
        </div>
        <div className="px-6 pb-5 flex justify-end">
          <button onClick={onClose} className="rounded-xl bg-[#152238] hover:bg-[#0f1a2b] px-5 py-2 text-sm font-semibold text-white transition-colors">
            Đóng thông báo
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

// ── PhaseFormModal ────────────────────────────────────────────────────────────
function PhaseFormModal({ open, onClose, editingPhase, form, setForm, onSubmit, hocKyOptions, nienKhoaOptions }) {
  if (!open) return null;
  const isEdit = !!editingPhase;
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* ── header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#152238]/10">
              <CalendarDays className="w-4 h-4 text-[#152238]" />
            </div>
            <span className="font-bold text-slate-800 text-base">
              {isEdit ? 'Chỉnh sửa đợt đăng ký' : 'Tạo đợt đăng ký mới'}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── body ── */}
        <form onSubmit={onSubmit} className="px-6 py-5 space-y-4" noValidate>

          {/* Info Alert Box */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex gap-2.5 text-xs text-slate-600">
            <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-slate-700">Quy tắc xếp lịch & thời gian:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
                <li>Không chọn ngày mở trong quá khứ hoặc trước quá 2 tuần.</li>
                <li>Thời hạn đợt đăng ký tối đa 2 tuần kể từ thời điểm mở.</li>
                <li>Không chồng chéo thời gian với đợt mở khác của cùng học kỳ & khóa.</li>
              </ul>
            </div>
          </div>

          {/* Tên đợt */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Tên đợt <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#152238]/20 focus:border-[#152238]/40"
              placeholder="VD: Đợt 1 HK1 2024-2025"
              value={form.TenDot} minLength={3} maxLength={50}
              onChange={(e) => { const raw = e.target.value; const filtered = raw.replace(TEN_DOT_INVALID_CHARS_REGEX, ''); setForm({ ...form, TenDot: filtered }); }}
              required
            />
            <p className="mt-1 text-xs text-slate-400">Cho phép: chữ, số, khoảng trắng, - _ ( ) , .</p>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mô tả</label>
            <textarea
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#152238]/20 focus:border-[#152238]/40 resize-none"
              placeholder="Mô tả ngắn về đợt đăng ký (không bắt buộc)…" rows={2}
              maxLength={1000}
              value={form.MoTa} onChange={(e) => setForm({ ...form, MoTa: e.target.value })}
            />
          </div>

          {/* Học kỳ + Niên khóa — 2 cột */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Học kỳ <span className="text-red-500">*</span></label>
              {hocKyOptions.length > 0 ? (
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#152238]/20"
                  value={form.HocKy} onChange={(e) => setForm({ ...form, HocKy: e.target.value })} required>
                  <option value="" disabled>Chọn</option>
                  {hocKyOptions.map(hk => <option key={hk} value={hk}>{hk}</option>)}
                </select>
              ) : (
                <input className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-slate-50 text-slate-400" value="" readOnly disabled placeholder="Chưa có" />
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Niên khóa <span className="text-red-500">*</span></label>
              {nienKhoaOptions.length > 0 ? (
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#152238]/20"
                  value={form.NienKhoa} onChange={(e) => setForm({ ...form, NienKhoa: e.target.value })} required>
                  <option value="" disabled>Chọn</option>
                  {nienKhoaOptions.map(nk => <option key={nk} value={nk}>{nk}</option>)}
                </select>
              ) : (
                <input className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" placeholder="VD: 2022-2026"
                  value={form.NienKhoa} onChange={(e) => setForm({ ...form, NienKhoa: e.target.value })} />
              )}
            </div>
          </div>

          {/* Thời gian mở + Thời gian đóng — 2 cột */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Thời gian mở <span className="text-red-500">*</span></label>
              <input type="datetime-local"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#152238]/20"
                value={form.NgayTao} onChange={(e) => setForm({ ...form, NgayTao: e.target.value })}
                min={isEdit ? undefined : getMinDateTimeStr()}
                required />
              <p className="mt-1 text-xs text-slate-400">Lên lịch trước tối đa 2 tuần.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Thời gian đóng <span className="text-red-500">*</span></label>
              <input type="datetime-local"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#152238]/20"
                value={form.NgayDong} onChange={(e) => setForm({ ...form, NgayDong: e.target.value })}
                min={form.NgayTao || getMinDateTimeStr()}
                required />
              <p className="mt-1 text-xs text-slate-400">Thời hạn mở tối đa 2 tuần.</p>
            </div>
          </div>

          {/* ── footer buttons bên trong form ── */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Hủy
            </button>
            <button type="submit"
              className="flex-1 rounded-xl bg-[#152238] py-2.5 text-sm font-semibold text-white hover:bg-[#0f1a2b] transition-colors flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {isEdit ? 'Lưu thay đổi' : 'Tạo đợt'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>,
    document.body
  );
}

function PhaseViewModal({ phase, onClose }) {
  if (!phase) return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#152238]/10">
              <CalendarDays className="w-4 h-4 text-[#152238]" />
            </div>
            <span className="font-bold text-slate-800 text-base">Thông tin đợt đăng ký</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div><p className="text-xs text-slate-500 mb-1 font-medium">Tên đợt</p><p className="font-semibold text-slate-800">{phase.TenDot}</p></div>
          {phase.MoTa && <div><p className="text-xs text-slate-500 mb-1 font-medium">Mô tả</p><p className="text-slate-700 text-sm whitespace-pre-wrap">{phase.MoTa}</p></div>}
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-xs text-slate-500 mb-1 font-medium">Học kỳ</p><p className="font-semibold text-slate-800">{phase.HocKy}</p></div>
            <div><p className="text-xs text-slate-500 mb-1 font-medium">Niên khóa</p><p className="font-semibold text-slate-800">{phase.NienKhoa}</p></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-xs text-slate-500 mb-1 font-medium">Thời gian mở</p><p className="font-semibold text-slate-800">{fmtDateTime(phase.NgayTao)}</p></div>
            <div><p className="text-xs text-slate-500 mb-1 font-medium">Thời gian đóng</p><p className="font-semibold text-slate-800">{fmtDateTime(phase.NgayDong)}</p></div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Đóng</button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

// ── StatusBadge ───────────────────────────────────────────────────────────────
function StatusBadge({ phase, now }) {
  if (phase.TrangThai === 'Mo') {
    const start = phase.NgayTao ? new Date(phase.NgayTao) : null;
    const end = phase.NgayDong ? new Date(phase.NgayDong) : null;
    if (start && now < start) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-700">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />Chờ mở
        </span>
      );
    }
    if (end && now > end) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-700">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Hết hạn
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Đang mở
      </span>
    );
  }
  if (phase.TrangThai === 'Dong') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-500">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />Đã đóng
      </span>
    );
  }
  return null;
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
function EnrollmentPhaseManagement() {
  const [phases, setPhases] = useState([]);
  const [courseSections, setCourseSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPhase, setEditingPhase] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [alertDialog, setAlertDialog] = useState(null);
  const [viewingPhase, setViewingPhase] = useState(null);
  const [now, setNow] = useState(() => new Date());
  const [form, setForm] = useState({ TenDot: '', MoTa: '', HocKy: '', NienKhoa: '', NgayTao: '', NgayDong: '' });

  const showToast = (message, type = 'warning') => setToast({ message, type });
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 5000); return () => clearTimeout(t); }, [toast]);
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 10000); return () => clearInterval(t); }, []);

  const fetchPhases = async () => {
    try { const r = await axios.get(`${API_URL}/api/enrollment/phases?_t=${Date.now()}`); setPhases(r.data || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  const fetchCourseSections = async () => {
    try { const r = await axios.get(`${API_URL}/api/course-sections`); setCourseSections(r.data || []); }
    catch (e) { console.error(e); }
  };
  const fetchStudents = async () => {
    try { const r = await axios.get(`${API_URL}/api/students`); setStudents(r.data || []); }
    catch (e) { console.error(e); }
  };
  useEffect(() => { 
    fetchPhases(); 
    fetchCourseSections(); 
    fetchStudents(); 

    let eventSource = null;
    try {
      eventSource = new EventSource(`${API_URL}/api/enrollment/phases/stream`);
      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'PHASE_CHANGED') {
            fetchPhases();
          }
        } catch (e) {
          console.error("SSE parse error", e);
        }
      };
    } catch (e) {
      console.error("SSE init error", e);
    }

    const pollTimer = setInterval(() => {
      fetchPhases();
    }, 10000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(pollTimer);
    };
  }, []);

  // options
  const hocKyOptions = useMemo(() => {
    const vals = [...new Set(courseSections.map(cs => cs.HocKy).filter(Boolean))];
    return vals.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [courseSections]);
  const nienKhoaOptions = useMemo(() => {
    const vals = [...new Set(students.map(sv => sv.NienKhoa).filter(Boolean))];
    return vals.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  }, [students]);

  // auto-fill defaults
  useEffect(() => { if (!editingPhase && !form.NienKhoa && nienKhoaOptions.length > 0) setForm(p => ({ ...p, NienKhoa: nienKhoaOptions[0] })); }, [nienKhoaOptions, editingPhase, form.NienKhoa]);
  useEffect(() => { if (!editingPhase && !form.HocKy && hocKyOptions.length > 0) setForm(p => ({ ...p, HocKy: hocKyOptions[0] })); }, [hocKyOptions, editingPhase, form.HocKy]);

  const findConflictingOpenPhase = (ngayMo, ngayDong, excludeId) => {
    if (!ngayMo || !ngayDong) return null;
    const start = new Date(ngayMo);
    const end = new Date(ngayDong);
    return phases.find(p => {
      if (excludeId && p.MaDot === excludeId) return false;
      if (p.TrangThai === 'Dong') return false;
      const pStart = new Date(p.NgayTao);
      const pEnd = new Date(p.NgayDong);
      // Chồng chéo nếu: start < pEnd và pStart < end
      return start < pEnd && pStart < end;
    }) || null;
  };

  const openCreateForm = () => { setEditingPhase(null); setForm({ TenDot: '', MoTa: '', HocKy: hocKyOptions[0] || '', NienKhoa: nienKhoaOptions[0] || '', NgayTao: '', NgayDong: '' }); setFormOpen(true); };
  const openEditForm = (phase) => { setEditingPhase(phase); setForm({ TenDot: phase.TenDot || '', MoTa: phase.MoTa || '', HocKy: phase.HocKy || '', NienKhoa: phase.NienKhoa || '', NgayTao: phase.NgayTao ? toLocalISOString(phase.NgayTao) : '', NgayDong: phase.NgayDong ? toLocalISOString(phase.NgayDong) : '' }); setFormOpen(true); };
  const closeForm = () => { setFormOpen(false); setEditingPhase(null); };

  const handleSubmit = (e) => {
    e.preventDefault();
    let errors = [];

    const tenDotTrimmed = form.TenDot.trim();
    if (!tenDotTrimmed) { errors.push('Vui lòng nhập tên đợt.'); }
    else if (tenDotTrimmed.length < 3) { errors.push('Tên đợt phải có ít nhất 3 ký tự.'); }
    else if (tenDotTrimmed.length > 50) { errors.push('Tên đợt không được vượt quá 50 ký tự.'); }
    else if (!TEN_DOT_ALLOWED_REGEX.test(form.TenDot)) { errors.push('Tên đợt chứa ký tự không hợp lệ.'); }
    else if (/\s{2,}/.test(form.TenDot)) { errors.push('Tên đợt không được chứa nhiều khoảng trắng liên tiếp.'); }

    if (form.MoTa) {
      if (form.MoTa.length > 1000) { errors.push('Mô tả không được vượt quá 1000 ký tự.'); }
      else if (!TEN_DOT_ALLOWED_REGEX.test(form.MoTa)) {
        errors.push('Mô tả chứa ký tự không hợp lệ. Chỉ cho phép chữ, số, khoảng trắng và - _ ( ) , .');
      } else if (/\s{2,}/.test(form.MoTa)) {
        errors.push('Mô tả không được chứa nhiều khoảng trắng liên tiếp.');
      }
    }

    if (!form.HocKy) { errors.push('Vui lòng chọn học kỳ.'); }
    if (!form.NienKhoa) { errors.push('Vui lòng chọn niên khóa.'); }
    if (!form.NgayTao) { errors.push('Vui lòng chọn ngày mở.'); }
    if (!form.NgayDong) { errors.push('Vui lòng chọn ngày đóng.'); }

    if (form.NgayTao && form.NgayDong) {
      const now = new Date();
      const startDateStr = form.NgayTao.includes('+') || form.NgayTao.includes('Z') ? form.NgayTao : `${form.NgayTao}:00+07:00`;
      const endDateStr = form.NgayDong.includes('+') || form.NgayDong.includes('Z') ? form.NgayDong : `${form.NgayDong}:00+07:00`;
      
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);
      const twoWeeksInMs = 14 * 24 * 60 * 60 * 1000;

      let isNgayTaoChanged = true;
      if (editingPhase && editingPhase.NgayTao) {
        if (form.NgayTao === toLocalISOString(editingPhase.NgayTao)) isNgayTaoChanged = false;
      }

      if (isNgayTaoChanged) {
        if (startDate.getTime() < now.getTime() - 60000) errors.push('Thời gian mở không được nằm trong quá khứ.');
        if (startDate.getTime() > now.getTime() + twoWeeksInMs) errors.push('Chỉ có thể đặt lịch mở tối đa trước 2 tuần.');
      }

      let isNgayDongChanged = true;
      if (editingPhase && editingPhase.NgayDong) {
        if (form.NgayDong === toLocalISOString(editingPhase.NgayDong)) isNgayDongChanged = false;
      }

      if (isNgayDongChanged) {
        if (endDate.getTime() < now.getTime() - 60000) errors.push('Thời gian đóng không được nằm trong quá khứ.');
      }

      if (endDate <= startDate) errors.push('Ngày đóng phải sau ngày mở.');
      if (endDate.getTime() - startDate.getTime() > twoWeeksInMs) errors.push('Thời hạn ngày đóng tối đa là 2 tuần kể từ ngày mở.');
    }

    const duplicatePhase = phases.find(p => p.HocKy === form.HocKy && p.NienKhoa === form.NienKhoa && (!editingPhase || p.MaDot !== editingPhase.MaDot));
    if (duplicatePhase) {
      errors.push(`Học kỳ ${form.HocKy} đã tồn tại.`);
    }

    const willBeOpen = editingPhase ? editingPhase.TrangThai !== 'Dong' : true;
    if (willBeOpen) {
      const conflict = findConflictingOpenPhase(form.NgayTao, form.NgayDong, editingPhase?.MaDot);
      if (conflict) {
        errors.push(`Thời gian đợt đăng ký bị chồng chéo với đợt "${conflict.TenDot}".`);
      }
    }

    if (errors.length > 0) {
      showToast(errors[0], 'error');
      setAlertDialog({ title: 'Không thể lưu đợt đăng ký', message: errors[0] });
      return;
    }
    setConfirmDialog({
      title: editingPhase ? 'Xác nhận cập nhật' : 'Xác nhận tạo đợt',
      message: editingPhase ? `Bạn có muốn lưu thay đổi cấu hình cho đợt "${form.TenDot}"?` : `Bạn có chắc chắn muốn tạo đợt đăng ký mới "${form.TenDot}"?`,
      confirmLabel: 'Lưu & Kích hoạt', variant: 'primary', onConfirm: performSave
    });
  };

  const performSave = async () => {
    try {
      const payload = { ...form };

      if (editingPhase) {
        await axios.put(`${API_URL}/api/enrollment/phases/${editingPhase.MaDot}`, { ...payload, TrangThai: editingPhase.TrangThai || 'Mo' });
      } else {
        await axios.post(`${API_URL}/api/enrollment/phases`, payload);
      }
      showToast('Lưu đợt đăng ký thành công!', 'success');
      closeForm(); fetchPhases();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Không thể lưu đợt đăng ký';
      showToast(errMsg, 'error');
      setAlertDialog({ title: 'Lỗi Lưu Dữ Liệu', message: errMsg });
    } finally { setConfirmDialog(null); }
  };

  const requestClose = (phase) => setConfirmDialog({
    title: 'Xác Nhận Đóng Đợt Đăng Ký',
    message: `Bạn có chắc chắn muốn đóng đợt "${phase.TenDot}"? Sau khi đóng, sinh viên sẽ tạm dừng không thể đăng ký hay hủy môn học trong đợt này nữa.`,
    confirmLabel: 'Đóng đợt ngay', variant: 'warning', onConfirm: () => closePhase(phase.MaDot)
  });
  const closePhase = async (id) => {
    try {
      await axios.post(`${API_URL}/api/enrollment/phases/${id}/close`);
      showToast('Đóng đợt đăng ký thành công!', 'success');
      fetchPhases();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Không thể đóng đợt đăng ký';
      showToast(errMsg, 'error');
      setAlertDialog({ title: 'Lỗi Đóng Đợt', message: errMsg });
    } finally { setConfirmDialog(null); }
  };

  const requestOpen = (phase) => {
    const now = new Date();
    const end = new Date(phase.NgayDong);
    
    if (end <= now) {
      showToast('Không thể mở lại đợt đăng ký đã kết thúc trong quá khứ.', 'error');
      setAlertDialog({
        title: 'Không thể mở lại đợt đã kết thúc',
        message: `Đợt "${phase.TenDot}" có ngày kết thúc (${end.toLocaleString('vi-VN')}) nằm trong quá khứ. Vui lòng bấm vào nút Chỉnh sửa (hình cây bút) để gia hạn ngày đóng trước khi mở lại!`
      });
      return;
    }
    
    const conflict = findConflictingOpenPhase(phase.NgayTao, end, phase.MaDot);
    if (conflict) {
      showToast(`Thời gian bị chồng chéo với đợt "${conflict.TenDot}". Không thể mở nhiều đợt cùng lúc.`, 'warning');
      setAlertDialog({
        title: 'Trùng lặp thời gian mở đợt!',
        message: `Khung thời gian của đợt này bị chồng chéo với đợt "${conflict.TenDot}". Hệ thống không cho phép mở nhiều đợt có thời gian trùng nhau cho cùng học kỳ/niên khóa để tránh xung đột dữ liệu!`
      });
      return;
    }
    
    setConfirmDialog({
      title: 'Xác Nhận Mở Lại Đợt Đăng Ký',
      message: `Bạn có chắc chắn muốn mở lại đợt "${phase.TenDot}"? Sinh viên có thể tiếp tục đăng ký các môn học trong khung thời gian quy định.`,
      confirmLabel: 'Mở lại ngay', variant: 'primary', onConfirm: () => openPhase(phase.MaDot)
    });
  };
  const openPhase = async (id) => {
    try {
      await axios.post(`${API_URL}/api/enrollment/phases/${id}/reopen`);
      showToast('Mở đợt đăng ký thành công!', 'success');
      fetchPhases();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Không thể mở lại đợt đăng ký';
      showToast(errMsg, 'error');
      setAlertDialog({ title: 'Lỗi Mở Đợt', message: errMsg });
    } finally { setConfirmDialog(null); }
  };

  const requestDelete = (phase) => setConfirmDialog({
    title: 'Xác Nhận Xóa Đợt Đăng Ký',
    message: `CẢNH BÁO: Bạn có chắc chắn muốn xóa đợt "${phase.TenDot}"? Toàn bộ cấu hình và dữ liệu của đợt này sẽ bị xóa bỏ hoàn toàn khỏi hệ thống và không thể khôi phục.`,
    confirmLabel: 'Xác nhận Xóa', variant: 'danger', onConfirm: () => performDelete(phase.MaDot)
  });

  const performDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/enrollment/phases/${id}`);
      showToast('Xóa đợt đăng ký thành công!', 'success');
      fetchPhases();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Lỗi không xác định';
      showToast(`Không thể xóa: ${errMsg}`, 'error');
      setAlertDialog({ title: 'Không thể xóa đợt đăng ký', message: errMsg });
    } finally { setConfirmDialog(null); }
  };

  // derived data
  const stats = useMemo(() => ({
    total: phases.length,
    active: phases.filter(p => p.TrangThai === 'Mo' && p.NgayTao && new Date(p.NgayTao) <= now).length,
    cho: phases.filter(p => p.TrangThai === 'Mo' && p.NgayTao && new Date(p.NgayTao) > now).length,
    closed: phases.filter(p => p.TrangThai === 'Dong').length,
  }), [phases, now]);

  const filteredPhases = useMemo(() => {
    return phases.filter(phase => {
      if (filterStatus !== 'all') {
        const isUpcoming = phase.TrangThai === 'Mo' && phase.NgayTao && new Date(phase.NgayTao) > now;
        if (filterStatus === 'Cho' && !isUpcoming) return false;
        if (filterStatus === 'Mo' && (phase.TrangThai !== 'Mo' || isUpcoming)) return false;
        if (filterStatus === 'Dong' && phase.TrangThai !== 'Dong') return false;
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return phase.TenDot?.toLowerCase().includes(term) || phase.HocKy?.toLowerCase().includes(term) || phase.NienKhoa?.toLowerCase().includes(term);
      }
      return true;
    });
  }, [phases, filterStatus, searchTerm, now]);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-8">
      {/* Toast */}
      {createPortal(
        <div className="fixed top-4 right-4 z-[999999] flex flex-col gap-2 pointer-events-none">
          <AnimatePresence>
            {toast && <div className="pointer-events-auto"><Toast toast={toast} onClose={() => setToast(null)} /></div>}
          </AnimatePresence>
        </div>,
        document.body
      )}

      {/* Confirm & Alert dialogs */}
      <AnimatePresence>
        {confirmDialog && <ConfirmModal dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />}
        {alertDialog && <AlertDialog dialog={alertDialog} onClose={() => setAlertDialog(null)} />}
      </AnimatePresence>

      {/* Form slide-over */}
      <AnimatePresence>
        {formOpen && (
          <PhaseFormModal open={formOpen} onClose={closeForm} editingPhase={editingPhase}
            form={form} setForm={setForm} onSubmit={handleSubmit}
            hocKyOptions={hocKyOptions} nienKhoaOptions={nienKhoaOptions} />
        )}
      </AnimatePresence>

      {/* ── Page header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#152238] to-[#1e3a5f] p-6 text-white shadow-lg">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_80%_50%,white_0%,transparent_60%)]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
              <CalendarDays className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">Quản lý đợt đăng ký học phần</h2>
              <p className="text-sm text-white/70 mt-0.5">Thiết lập và theo dõi các đợt đăng ký theo học kỳ, năm học, niên khóa</p>
            </div>
          </div>
          <button onClick={openCreateForm}
            className="flex items-center gap-2 rounded-xl bg-[#F4C542] px-5 py-2.5 text-sm font-bold text-[#152238] hover:bg-[#e6b83a] transition-colors shadow-md flex-shrink-0 self-start sm:self-auto">
            <Plus className="w-4 h-4" /> Tạo đợt mới
          </button>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng số đợt', value: stats.total, color: 'text-[#152238]', bg: 'bg-white', border: 'border-slate-200', icon: <TrendingUp className="w-5 h-5 text-[#152238]/40" /> },
          { label: 'Đang mở', value: stats.active, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <ToggleRight className="w-5 h-5 text-emerald-500" /> },
          { label: 'Chờ', value: stats.cho, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: <Clock className="w-5 h-5 text-amber-500" /> },
          { label: 'Đã đóng', value: stats.closed, color: 'text-slate-600', bg: 'bg-white', border: 'border-slate-200', icon: <ToggleLeft className="w-5 h-5 text-slate-400" /> },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border ${s.border} ${s.bg} p-5 flex items-center justify-between`}>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{s.label}</p>
              <p className={`text-3xl font-black mt-1 ${s.color}`}>{s.value}</p>
            </div>
            <div className="p-2 rounded-xl bg-white/60">{s.icon}</div>
          </div>
        ))}
      </div>

      {/* ── Phase list ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800">Danh sách đợt đăng ký</h3>
            <p className="text-xs text-slate-500 mt-0.5">{filteredPhases.length} đợt{filterStatus !== 'all' || searchTerm ? ' (đã lọc)' : ''}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {/* search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-[#152238]/20"
                placeholder="Tìm tên đợt, học kỳ, niên khóa…"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>}
            </div>
            {/* filter */}
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 p-1">
              {[['all', 'Tất cả'], ['Mo', 'Đang mở'], ['Cho', 'Chờ'], ['Dong', 'Đã đóng']].map(([val, label]) => (
                <button key={val} onClick={() => setFilterStatus(val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filterStatus === val ? 'bg-[#152238] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* table */}
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">Đang tải dữ liệu…</div>
        ) : filteredPhases.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">Không tìm thấy đợt nào</p>
            <p className="text-xs text-slate-400 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Đợt đăng ký</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Học kỳ / Niên khóa</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Thời gian</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <AnimatePresence>
                  {filteredPhases.map((phase, i) => {
                    const start = phase.NgayTao ? new Date(phase.NgayTao) : null;
                    const end = phase.NgayDong ? new Date(phase.NgayDong) : null;
                    const isExpired = phase.TrangThai === 'Mo' && end && end < now;
                    const isActive = phase.TrangThai === 'Mo' && (!start || start <= now) && (!end || end >= now);
                    return (
                    <motion.tr key={phase.MaDot} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      onClick={() => setViewingPhase(phase)}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{phase.TenDot}</p>
                        {(() => {
                          if (phase.TrangThai !== 'Mo' || isExpired) return null;
                          const isWaiting = start && start > now;
                          const targetDate = isWaiting ? start : end;
                          if (!targetDate) return null;
                          const prefix = isWaiting ? 'Mở sau' : 'Còn';
                          const colorClass = isWaiting ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-amber-600 bg-amber-50 border-amber-200';
                          return (
                            <div className={`flex items-center gap-1.5 mt-1 text-[11px] font-semibold px-2 py-0.5 rounded border w-fit ${colorClass}`}>
                              <Hourglass className="w-3 h-3" /> {prefix} {diffText(targetDate - now)}
                            </div>
                          );
                        })()}
                        {phase.MoTa && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{phase.MoTa}</p>}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap hidden md:table-cell">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-slate-700">{phase.HocKy || '—'}</span>
                          <span className="text-xs text-slate-400">{phase.NienKhoa || '—'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap hidden sm:table-cell">
                        <div className="flex flex-col gap-0.5 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{fmtDateTime(phase.NgayTao)}</span>
                          <span className="flex items-center gap-1 text-slate-400"><ChevronRight className="w-3 h-3" />{fmtDateTime(phase.NgayDong)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4"><StatusBadge phase={phase} now={now} /></td>
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                          {phase.TrangThai !== 'Dong' && (
                            <button onClick={() => openEditForm(phase)} title={isActive ? "Không thể sửa đợt đang mở" : "Chỉnh sửa"} disabled={isActive}
                              className={`p-2 rounded-xl border transition-colors ${isActive ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}>
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {phase.TrangThai === 'Mo' && (
                            <button onClick={() => requestClose(phase)}
                              className="px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-semibold transition-colors">
                              Đóng
                            </button>
                          )}
                          {phase.TrangThai === 'Dong' && (
                            <button onClick={() => requestOpen(phase)}
                              title={end && end <= now ? "Không thể mở lại đợt đã kết thúc" : "Mở lại đợt"}
                              disabled={end && end <= now}
                              className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${end && end <= now ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'}`}>
                              Mở lại
                            </button>
                          )}
                          <button onClick={() => requestDelete(phase)} title={isActive ? "Không thể xóa đợt đang mở" : "Xóa"} disabled={isActive}
                            className={`p-2 rounded-xl border transition-colors ${isActive ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed' : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'}`}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )})}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
      <PhaseViewModal phase={viewingPhase} onClose={() => setViewingPhase(null)} />
    </div>
  );
}

export default EnrollmentPhaseManagement;
