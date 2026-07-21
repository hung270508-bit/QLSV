import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import API_URL from '../../api';
import {
  CheckCircle2, XCircle, Clock, AlertCircle, Search, Plus,
  ChevronLeft, ChevronRight, RefreshCw, FileText, Check, X,
  Zap, User, FolderOpen, Trash2, Play, Square, CreditCard,
  DollarSign, BookOpen, ShieldCheck, HelpCircle, Calendar,
  ChevronDown, Filter, Layers, Info
} from 'lucide-react';

const api = axios.create({ baseURL: API_URL });
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_MAP = {
  chua_mo: { label: 'Chưa mở', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  dang_mo: { label: 'Đang mở', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  da_dong: { label: 'Đã đóng', cls: 'bg-rose-100 text-rose-600 border-rose-200' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const Toast = ({ msg, type, onClose }) => {
  useEffect(() => { if (msg) { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); } }, [msg]);
  if (!msg) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-white font-semibold text-sm transition-all ${type === 'error' ? 'bg-rose-500' : 'bg-emerald-600'}`}>
      {type === 'error' ? <XCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
      <span>{msg}</span>
    </div>
  );
};

const Spinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-10 h-10 border-4 border-[#F4BE2C] border-t-transparent rounded-full animate-spin" />
  </div>
);

// ─── Countdown component ──────────────────────────────────────────────────────
const Countdown = ({ ngay_dong }) => {
  const [diff, setDiff] = useState('');
  useEffect(() => {
    const calc = () => {
      const ms = new Date(ngay_dong) - new Date();
      if (ms <= 0) { setDiff('Đã hết hạn'); return; }
      const d = Math.floor(ms / 86400000);
      const h = Math.floor((ms % 86400000) / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      setDiff(d > 0 ? `${d}n ${h}g ${m}p` : `${h}g ${m}p`);
    };
    calc();
    const t = setInterval(calc, 30000);
    return () => clearInterval(t);
  }, [ngay_dong]);
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
      <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
      {diff}
    </span>
  );
};

// ─── Modal Tạo đợt ────────────────────────────────────────────────────────────
const CreatePeriodModal = ({ open, onClose, onSuccess }) => {
  const [dotDangKyList, setDotDangKyList] = useState([]);
  const [form, setForm] = useState({ ma_dot_dangky: '', hoc_ky: '', ten_dot: '', ngay_mo: '', ngay_dong: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!open) { setErr(''); return; }
    api.get('/api/admin/dot-dangky').then(r => setDotDangKyList(r.data?.data || [])).catch(() => {});
  }, [open]);

  const uniqueHocKyList = useMemo(() => {
    const map = {};
    dotDangKyList.forEach(d => {
      if (!d.HocKy) return;
      if (!map[d.HocKy]) {
        map[d.HocKy] = {
          hoc_ky: d.HocKy,
          ma_dot_dangky: d.MaDot,
          ten_dot: `Đợt thu học phí ${d.HocKy}`
        };
      }
    });
    return Object.values(map);
  }, [dotDangKyList]);

  const handleHocKyChange = (e) => {
    const val = e.target.value;
    const found = uniqueHocKyList.find(d => d.hoc_ky === val);
    setForm(f => ({
      ...f,
      hoc_ky: val,
      ma_dot_dangky: found ? found.ma_dot_dangky : '',
      ten_dot: found ? found.ten_dot : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.hoc_ky || !form.ten_dot || !form.ngay_mo || !form.ngay_dong) { setErr('Vui lòng điền đầy đủ thông tin!'); return; }
    setLoading(true); setErr('');
    try {
      const res = await api.post('/api/admin/tuition-periods', { ...form, don_gia_tin_chi: 1150000 });
      onSuccess(`Đã tạo đợt với ${res.data.so_sv} sinh viên!`);
      onClose();
    } catch (e) { setErr(e.response?.data?.message || 'Lỗi tạo đợt!'); }
    finally { setLoading(false); }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-[#F4C542] p-6 flex items-center gap-3">
          <div className="p-2.5 bg-[#152238] text-[#F4C542] rounded-xl font-black">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#152238]">Mở Đợt Đóng Học Phí</h3>
            <p className="text-sm text-[#152238]/80 mt-0.5 font-medium">Hệ thống tự thu thập toàn bộ sinh viên đã đăng ký của học kỳ</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {err && <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" /> {err}</div>}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Chọn Học kỳ cần thu học phí <span className="text-rose-500">*</span></label>
            <select value={form.hoc_ky} onChange={handleHocKyChange} required className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#F4C542] font-semibold text-gray-800">
              <option value="">-- Chọn Học kỳ --</option>
              {uniqueHocKyList.map(item => (
                <option key={item.hoc_ky} value={item.hoc_ky}>{item.hoc_ky}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1 font-medium">Hệ thống sẽ tự động tổng hợp toàn bộ sinh viên đã đăng ký của tất cả các khóa trong học kỳ này.</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Tên đợt thu học phí <span className="text-rose-500">*</span></label>
            <input type="text" value={form.ten_dot} onChange={e => setForm(f => ({ ...f, ten_dot: e.target.value }))} required placeholder="VD: Đợt thu học phí HK1_2026_2027" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#F4C542] font-semibold text-gray-800" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Ngày mở <span className="text-rose-500">*</span></label>
              <input type="datetime-local" value={form.ngay_mo} onChange={e => setForm(f => ({ ...f, ngay_mo: e.target.value }))} required className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#F4C542] font-semibold text-gray-800" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Ngày đóng <span className="text-rose-500">*</span></label>
              <input type="datetime-local" value={form.ngay_dong} onChange={e => setForm(f => ({ ...f, ngay_dong: e.target.value }))} required className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#F4C542] font-semibold text-gray-800" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Đơn giá / tín chỉ (VNĐ) <span className="text-emerald-600 font-extrabold">(Cố định theo quy định)</span></label>
            <input type="text" value="1.150.000 VNĐ / tín chỉ" disabled className="w-full p-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-700 font-bold cursor-not-allowed" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all">Hủy</button>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-[#152238] text-white font-extrabold rounded-xl hover:bg-[#0f1a2b] transition-all shadow-md disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Tạo đợt
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Modal Xác nhận thủ công ──────────────────────────────────────────────────
const ConfirmManualModal = ({ open, hocPhi, onClose, onSuccess }) => {
  const [ghi_chu, setGhiChu] = useState('');
  const [minh_chung_url, setMinhChung] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { if (!open) { setGhiChu(''); setMinhChung(''); setErr(''); } }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (ghi_chu.trim().length < 5) { setErr('Ghi chú tối thiểu 5 ký tự!'); return; }
    setLoading(true); setErr('');
    try {
      await api.put(`/api/admin/tuitions/${hocPhi.id}/confirm-manual`, { ghi_chu: ghi_chu.trim(), minh_chung_url: minh_chung_url.trim() || undefined });
      onSuccess('Xác nhận thủ công thành công!');
      onClose();
    } catch (e) { setErr(e.response?.data?.message || 'Lỗi xác nhận!'); }
    finally { setLoading(false); }
  };

  if (!open || !hocPhi) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-[#152238] p-6 flex items-center gap-3">
          <div className="p-2.5 bg-[#F4C542] text-[#152238] rounded-xl font-black">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Xác Nhận Thu Thủ Công</h3>
            <p className="text-gray-300 text-sm mt-0.5">MSSV: <strong className="text-white font-mono">{hocPhi.mssv}</strong> — <span className="text-emerald-400 font-mono font-black">{Number(hocPhi.so_tien).toLocaleString('vi-VN')}đ</span></p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {err && <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" /> {err}</div>}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Ghi chú <span className="text-rose-500">*</span> <span className="text-gray-400 font-normal">(tối thiểu 5 ký tự)</span></label>
            <textarea value={ghi_chu} onChange={e => setGhiChu(e.target.value)} rows={3} placeholder="VD: SV nộp tiền mặt tại phòng kế toán ngày 15/7/2026..." className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#F4C542] resize-none font-medium text-gray-800" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Link minh chứng <span className="text-gray-400 font-normal">(tùy chọn)</span></label>
            <input type="url" value={minh_chung_url} onChange={e => setMinhChung(e.target.value)} placeholder="https://..." className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#F4C542] font-medium text-gray-800" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">Hủy</button>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-[#152238] text-white font-extrabold rounded-xl hover:bg-[#0f1a2b] transition-all shadow-md disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang xác nhận...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Xác nhận thu
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Modal xác nhận duyệt / từ chối bằng popup (thay thế window.confirm) ─────────
const ActionConfirmModal = ({ open, type, hocPhi, onClose, onConfirm }) => {
  if (!open || !hocPhi) return null;
  const isApprove = type === 'approve';
  return createPortal(
    <div className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-2xl ${isApprove ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
            {isApprove ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900">{isApprove ? 'Xác Nhận Duyệt Thanh Toán' : 'Xác Nhận Trả Lại Học Phí'}</h3>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">MSSV: <strong className="text-gray-800 font-mono">{hocPhi.mssv || '—'}</strong> • {hocPhi.ten_sinh_vien || '—'}</p>
          </div>
        </div>

        <div className={`p-4 rounded-2xl text-sm leading-relaxed font-medium ${isApprove ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          {isApprove
            ? 'Bạn đã kiểm tra sao kê tài khoản ngân hàng và xác nhận đã nhận đúng số tiền cho khoản học phí này?'
            : 'Kiểm tra chưa nhận được chuyển khoản hoặc thông tin sai lệch. Hệ thống sẽ chuyển trạng thái về "Chưa đóng" cho sinh viên nộp lại.'}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm">Hủy bỏ</button>
          <button onClick={() => onConfirm(hocPhi.id)} className={`px-6 py-2.5 text-white font-extrabold rounded-xl shadow-md transition-all text-sm flex items-center gap-2 ${isApprove ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-500 hover:bg-rose-600'}`}>
            {isApprove ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Đồng ý duyệt
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                Xác nhận trả lại
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  , document.body);
};

// ─── Modals cho Đợt Học Phí (Xác nhận trạng thái, Xóa 2 bước, Cảnh báo 1 đợt mở) ────
const ConfirmStatusModal = ({ open, period, newStatus, onClose, onConfirm }) => {
  if (!open || !period) return null;
  const isOpening = newStatus === 'dang_mo';
  return createPortal(
    <div className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-2xl ${isOpening ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900">{isOpening ? 'Xác Nhận Mở Đợt Học Phí' : 'Xác Nhận Đóng Đợt Học Phí'}</h3>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">{period.ten_dot}</p>
          </div>
        </div>
        <div className={`p-4 rounded-2xl text-sm leading-relaxed font-medium ${isOpening ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-amber-50 text-amber-900 border border-amber-200'}`}>
          {isOpening
            ? `Bạn có chắc chắn muốn chuyển đợt "${period.ten_dot}" sang trạng thái ĐANG MỞ? Sinh viên thuộc học kỳ này sẽ có thể đóng tiền ngay lập tức.`
            : `Bạn có chắc chắn muốn đóng đợt "${period.ten_dot}"? Sau khi đóng, hệ thống sẽ tạm ngừng nhận giao dịch thanh toán của sinh viên cho đợt này.`}
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm">Hủy bỏ</button>
          <button onClick={() => onConfirm(period.id, newStatus)} className={`px-6 py-2.5 text-white font-extrabold rounded-xl shadow-md transition-all text-sm flex items-center gap-2 ${isOpening ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'}`}>
            <CheckCircle2 className="w-4 h-4" />
            {isOpening ? 'Xác nhận mở đợt' : 'Xác nhận đóng đợt'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const DeletePeriodModal = ({ open, step, period, onClose, onNextStep, onConfirmDelete }) => {
  if (!open || !period) return null;
  const isStep2 = step === 2;
  return createPortal(
    <div className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={`bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-200 border-2 ${isStep2 ? 'border-rose-500' : 'border-rose-200'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-2xl ${isStep2 ? 'bg-rose-600 text-white animate-pulse' : 'bg-rose-100 text-rose-600'}`}>
            <Trash2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-black text-rose-600">{isStep2 ? 'XÁC NHẬN CUỐI CÙNG (BƯỚC 2/2)' : 'CẢNH BÁO XÓA ĐỢT (BƯỚC 1/2)'}</h3>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">{period.ten_dot}</p>
          </div>
        </div>
        <div className={`p-4 rounded-2xl text-sm leading-relaxed font-bold ${isStep2 ? 'bg-rose-100 text-rose-950 border border-rose-300' : 'bg-rose-50 text-rose-900 border border-rose-200'}`}>
          {isStep2
            ? `CẢNH BÁO NGUY HIỂM: Toàn bộ lịch sử thu tiền, các giao dịch VietQR và danh sách công nợ của sinh viên trong đợt "${period.ten_dot}" sẽ bị XÓA VĨNH VIỄN khỏi hệ thống và KHÔNG THỂ KHÔI PHỤC! Bạn có chắc chắn 100% muốn xóa?`
            : `Bạn có chắc chắn muốn xóa đợt thu học phí "${period.ten_dot}"? Hệ thống yêu cầu xác nhận 2 lần trước khi thực hiện xóa dữ liệu này.`}
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          {isStep2 ? (
            <>
              <button onClick={onClose} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm">Hủy bỏ</button>
              <button onClick={() => onConfirmDelete(period.id)} className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl shadow-md shadow-rose-200 transition-all text-sm flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Xác nhận xóa vĩnh viễn
              </button>
            </>
          ) : (
            <>
              <button onClick={onClose} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm">Hủy bỏ</button>
              <button onClick={onNextStep} className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-extrabold rounded-xl shadow-md shadow-rose-200 transition-all text-sm flex items-center gap-2">
                Tiếp tục xóa (Bước 2) →
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

const AlertPopupModal = ({ open, title, message, onClose }) => {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-200 border border-amber-300">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900">{title || 'Thông báo hệ thống'}</h3>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">Quy định và kiểm tra trạng thái</p>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-amber-50 text-amber-950 border border-amber-200 text-sm leading-relaxed font-semibold">
          {message}
        </div>
        <div className="flex justify-end pt-2 border-t border-gray-100">
          <button onClick={onClose} className="px-6 py-2.5 bg-[#152238] hover:bg-[#0f1a2b] text-white font-extrabold rounded-xl shadow-md transition-all text-sm">
            Đã hiểu & Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Row chi tiết expanded ────────────────────────────────────────────────────
// ─── Modal chi tiết & xử lý giao dịch bằng popup (chuẩn form chữ lớn) ──────────
const DetailModal = ({ open, hocPhi, onClose, onApprove, onReject }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !hocPhi?.id) { setData(null); return; }
    setLoading(true);
    api.get(`/api/admin/tuitions/${hocPhi.id}/detail`)
      .then(r => setData(r.data?.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, hocPhi?.id]);

  if (!open || !hocPhi) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="bg-[#152238] p-6 text-white flex items-center justify-between border-b border-[#152238]/80 shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="font-black text-xl tracking-tight">Chi Tiết Học Phí & Xử Lý Giao Dịch</h3>
              <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full font-extrabold text-sm ${
                hocPhi.trang_thai === 'Đã đóng' ? 'bg-emerald-500 text-white' :
                hocPhi.trang_thai === 'Chờ duyệt' ? 'bg-blue-500 text-white animate-pulse' : 'bg-amber-500 text-white'
              }`}>
                {hocPhi.trang_thai === 'Đã đóng' ? (
                  <><CheckCircle2 className="w-4 h-4 shrink-0" /> Đã đóng</>
                ) : hocPhi.trang_thai === 'Chờ duyệt' ? (
                  <><Clock className="w-4 h-4 shrink-0" /> Chờ duyệt</>
                ) : (
                  <><AlertCircle className="w-4 h-4 shrink-0" /> Chưa đóng</>
                )}
              </span>
            </div>
            <p className="text-gray-300 text-sm font-semibold mt-1">
              Sinh viên: <span className="text-[#F4BE2C] font-bold">{hocPhi.ten_sinh_vien || '—'}</span> (MSSV: <span className="font-mono text-white">{hocPhi.mssv}</span>) • Tổng phải đóng: <span className="text-emerald-400 font-mono font-black text-base">{Number(hocPhi.so_tien || 0).toLocaleString('vi-VN')}đ</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
        </div>

        {/* Body Modal */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-gray-800">
          {loading ? (
            <div className="py-16 text-center text-gray-500 font-bold text-base animate-pulse flex items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-[#F4BE2C] border-t-transparent rounded-full animate-spin" />
              Đang tải chi tiết học phần và giao dịch...
            </div>
          ) : !data ? (
            <div className="py-16 text-center text-rose-500 font-bold text-base">Không tải được thông tin chi tiết.</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Bên trái: Chi tiết học phần (7 cột) */}
              <div className="lg:col-span-7 space-y-3">
                <h4 className="text-sm font-black text-gray-700 uppercase tracking-wide flex items-center gap-2 border-b border-gray-200 pb-2">
                  <BookOpen className="w-4 h-4 text-[#F4BE2C] shrink-0" /> Chi Tiết Học Phần ({data.chi_tiet?.length || 0} môn)
                </h4>
                <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="bg-gray-100/80 text-gray-700">
                      <tr>
                        <th className="px-3 py-3 text-left font-bold">Môn học</th>
                        <th className="px-2 py-3 text-center font-bold">TC</th>
                        <th className="px-3 py-3 text-right font-bold">Học phí</th>
                        <th className="px-3 py-3 text-right font-bold">Phí tài liệu</th>
                        <th className="px-3 py-3 text-right font-bold">Phải đóng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(data.chi_tiet || []).map((ct, i) => {
                        const hocPhiNum = Number(ct.hoc_phi || (ct.so_tin_chi * (ct.don_gia || Number(data.don_gia_tin_chi || 1150000))));
                        const phiTaiLieuNum = Number(ct.phi_tai_lieu || 0);
                        const thanhTienNum = Number(ct.thanh_tien || (hocPhiNum + phiTaiLieuNum - Number(ct.mien_giam || 0)));
                        return (
                          <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                            <td className="px-3 py-2.5 font-bold text-gray-800">
                              <div>{ct.ten_mon_hoc}</div>
                              {ct.ma_lop_hoc_phan && <div className="text-[11px] font-mono text-gray-400 font-semibold">{ct.ma_lop_hoc_phan}</div>}
                            </td>
                            <td className="px-2 py-2.5 text-center font-semibold text-gray-600">{ct.so_tin_chi}</td>
                            <td className="px-3 py-2.5 text-right font-mono font-semibold text-gray-700">{hocPhiNum.toLocaleString('vi-VN')}đ</td>
                            <td className="px-3 py-2.5 text-right font-mono font-semibold text-amber-600">
                              {phiTaiLieuNum > 0 ? `${phiTaiLieuNum.toLocaleString('vi-VN')}đ` : '-'}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono font-black text-emerald-700">{thanhTienNum.toLocaleString('vi-VN')}đ</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50 font-black border-t-2 border-gray-200 text-gray-800">
                      <tr>
                        <td className="px-3 py-3 text-left">Tổng cộng</td>
                        <td className="px-2 py-3 text-center">
                          {(data.chi_tiet || []).reduce((sum, ct) => sum + Number(ct.so_tin_chi || 0), 0)}
                        </td>
                        <td className="px-3 py-3 text-right font-mono">
                          {(data.chi_tiet || []).reduce((sum, ct) => sum + Number(ct.hoc_phi || (ct.so_tin_chi * (ct.don_gia || Number(data.don_gia_tin_chi || 1150000)))), 0).toLocaleString('vi-VN')}đ
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-amber-600">
                          {(data.chi_tiet || []).reduce((sum, ct) => sum + Number(ct.phi_tai_lieu || 0), 0).toLocaleString('vi-VN')}đ
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-emerald-700 text-sm">
                          {(data.chi_tiet || []).reduce((sum, ct) => {
                            const hp = Number(ct.hoc_phi || (ct.so_tin_chi * (ct.don_gia || Number(data.don_gia_tin_chi || 1150000))));
                            return sum + Number(ct.thanh_tien || (hp + Number(ct.phi_tai_lieu || 0) - Number(ct.mien_giam || 0)));
                          }, 0).toLocaleString('vi-VN')}đ
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Bên phải: Lịch sử giao dịch (5 cột) */}
              <div className="lg:col-span-5 space-y-3">
                <h4 className="text-sm font-black text-gray-700 uppercase tracking-wide flex items-center gap-2 border-b border-gray-200 pb-2">
                  <CreditCard className="w-4 h-4 text-[#F4BE2C] shrink-0" /> Lịch Sử Giao Dịch
                </h4>
                {(data.giao_dich || []).length === 0 ? (
                  <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 text-center text-gray-400 text-sm font-semibold">Chưa có thông tin giao dịch nào</div>
                ) : (
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {data.giao_dich.map((gd, i) => (
                      <div key={i} className="bg-white border-2 border-gray-200 rounded-2xl p-4 space-y-2 shadow-sm">
                        <div className="flex justify-between items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-gray-400">{gd.ma_giao_dich}</span>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-black text-xs ${
                            gd.trang_thai === 'thanh_cong' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            gd.trang_thai === 'cho_duyet' ? 'bg-blue-100 text-blue-800 border border-blue-300 animate-pulse' :
                            gd.trang_thai === 'cho_thanh_toan' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {gd.trang_thai === 'thanh_cong' ? (
                              <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Thành công</>
                            ) : gd.trang_thai === 'cho_duyet' ? (
                              <><Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" /> SV báo đã CK (Chờ duyệt)</>
                            ) : gd.trang_thai === 'cho_thanh_toan' ? (
                              <><Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" /> Chờ thanh toán</>
                            ) : (
                              <><XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" /> Thất bại</>
                            )}
                          </span>
                        </div>
                        {gd.so_tien && <div className="text-sm font-semibold text-gray-700">Số tiền: <strong className="font-mono font-black text-emerald-600">{Number(gd.so_tien).toLocaleString('vi-VN')}đ</strong></div>}
                        {gd.nguon_xac_nhan && (
                          <div className="text-sm text-gray-600 font-medium flex items-center gap-1.5">
                            Nguồn xác nhận: <strong className="text-gray-900 inline-flex items-center gap-1">
                              {gd.nguon_xac_nhan === 'auto' ? (
                                <><Zap className="w-3.5 h-3.5 text-amber-500" /> Cổng VietQR tự động</>
                              ) : gd.nguon_xac_nhan === 'student_report' ? (
                                <><User className="w-3.5 h-3.5 text-blue-500" /> Sinh viên bấm xác nhận</>
                              ) : (
                                <><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> {gd.admin_username || 'Admin'}</>
                              )}
                            </strong>
                          </div>
                        )}
                        {gd.ghi_chu && (
                          <div className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-200 font-medium flex items-start gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                            <span>{gd.ghi_chu}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Action Modal */}
        <div className="p-5 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-4 shrink-0 flex-wrap">
          <div className="text-sm text-gray-600 font-semibold">
            {hocPhi.trang_thai === 'Chờ duyệt' && (
              <span className="text-blue-600 font-extrabold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-blue-600" />
                Sinh viên đã chuyển khoản và báo cáo. Vui lòng kiểm tra sao kê ngân hàng trước khi chọn.
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button onClick={onClose} className="px-5 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-2xl transition-colors text-sm">Đóng</button>
            {(hocPhi.trang_thai === 'Chờ duyệt' || hocPhi.trang_thai === 'Chưa đóng') && (
              <>
                <button onClick={() => onReject(hocPhi.id)} className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-extrabold rounded-2xl transition-all shadow-md text-sm flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Chưa duyệt
                </button>
                <button onClick={() => onApprove(hocPhi.id)} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl transition-all shadow-md text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Đã duyệt
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  , document.body);
};

// ─── Main Component ───────────────────────────────────────────────────────────
const TuitionManagement = () => {
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [tuitions, setTuitions] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [khoaFilter, setKhoaFilter] = useState('all');
  const [nienKhoaFilter, setNienKhoaFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    status: 'all',
    khoa: 'all',
    nienKhoa: 'all',
    lop: 'all'
  });
  const [faculties, setFaculties] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTuitions, setLoadingTuitions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [detailModal, setDetailModal] = useState({ open: false, hp: null });
  const [actionModal, setActionModal] = useState({ open: false, type: '', hp: null });
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, hp: null });
  const [confirmStatusModal, setConfirmStatusModal] = useState({ open: false, period: null, newStatus: '' });
  const [deletePeriodModal, setDeletePeriodModal] = useState({ open: false, step: 1, period: null });
  const [alertPopupModal, setAlertPopupModal] = useState({ open: false, title: '', message: '' });
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const pollRef = useRef(null);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const selectedPeriodRef = useRef(selectedPeriod);
  useEffect(() => { selectedPeriodRef.current = selectedPeriod; }, [selectedPeriod]);

  const fetchPeriods = useCallback(async () => {
    try {
      const r = await api.get('/api/admin/tuition-periods');
      const list = r.data?.data || [];
      setPeriods(list);
      const current = selectedPeriodRef.current;
      if (!current && list.length > 0) {
        setSelectedPeriod(list[0]);
      } else if (current) {
        const updated = list.find(p => p.id === current.id);
        if (updated) {
          setSelectedPeriod(updated);
        } else if (list.length > 0) {
          setSelectedPeriod(list[0]);
        } else {
          setSelectedPeriod(null);
        }
      }
    } catch { showToast('Lỗi tải danh sách đợt!', 'error'); }
    finally { setLoading(false); }
  }, []);

  const fetchTuitions = useCallback(async (dotId, silent = false, filters = appliedFilters) => {
    if (!dotId) return;
    if (!silent) setLoadingTuitions(true);
    try {
      const r = await api.get('/api/admin/tuitions', {
        params: {
          dot_id: dotId,
          status: filters.status !== 'all' ? filters.status : undefined,
          search: filters.search || undefined,
          khoa: filters.khoa !== 'all' ? filters.khoa : undefined,
          nien_khoa: filters.nienKhoa !== 'all' ? filters.nienKhoa : undefined,
          lop: filters.lop !== 'all' ? filters.lop : undefined
        }
      });
      setTuitions(r.data?.data || []);
      if (!silent) setCurrentPage(1);
    } catch { showToast('Lỗi tải học phí!', 'error'); }
    finally { if (!silent) setLoadingTuitions(false); }
  }, [appliedFilters]);

  useEffect(() => {
    fetchPeriods();
    api.get('/api/faculties').then(r => setFaculties(r.data || [])).catch(() => {});
    api.get('/api/classes').then(r => setClasses(r.data || [])).catch(() => {});
  }, [fetchPeriods]);

  useEffect(() => {
    if (selectedPeriod) {
      setDetailModal({ open: false, hp: null });
      fetchTuitions(selectedPeriod.id, false, appliedFilters);
    }
  }, [selectedPeriod]);

  // Polling silent auto-refresh mỗi 10s (silent=true để không kích hoạt loading spinner)
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (selectedPeriod) {
      pollRef.current = setInterval(() => fetchTuitions(selectedPeriod.id, true, appliedFilters), 10000);
    }
    return () => clearInterval(pollRef.current);
  }, [selectedPeriod, appliedFilters, fetchTuitions]);

  const uniqueCohorts = useMemo(() => {
    const list = classes
      .filter(c => khoaFilter === 'all' || c.MaKhoa === khoaFilter)
      .map(c => c.NienKhoa)
      .filter(Boolean);
    tuitions.forEach(t => { if (t.nien_khoa) list.push(t.nien_khoa); });
    return Array.from(new Set(list)).sort();
  }, [classes, tuitions, khoaFilter]);

  const filteredClasses = useMemo(() => {
    const list = classes.filter(c =>
      (khoaFilter === 'all' || c.MaKhoa === khoaFilter) &&
      (nienKhoaFilter === 'all' || c.NienKhoa === nienKhoaFilter)
    );
    const existingLopSet = new Set(list.map(c => c.MaLop));
    tuitions.forEach(t => {
      if (t.MaLop && !existingLopSet.has(t.MaLop)) {
        if ((khoaFilter === 'all' || t.ma_khoa === khoaFilter) &&
            (nienKhoaFilter === 'all' || t.nien_khoa === nienKhoaFilter)) {
          list.push({ MaLop: t.MaLop, TenLop: t.MaLop });
          existingLopSet.add(t.MaLop);
        }
      }
    });
    return list.sort((a, b) => a.MaLop.localeCompare(b.MaLop));
  }, [classes, tuitions, khoaFilter, nienKhoaFilter]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const newApplied = {
      search: search.trim(),
      status: statusFilter,
      khoa: khoaFilter,
      nienKhoa: nienKhoaFilter,
      lop: classFilter
    };
    setAppliedFilters(newApplied);
    setCurrentPage(1);
    if (selectedPeriod) {
      fetchTuitions(selectedPeriod.id, false, newApplied);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setKhoaFilter('all');
    setNienKhoaFilter('all');
    setClassFilter('all');
    const defaultApplied = { search: '', status: 'all', khoa: 'all', nienKhoa: 'all', lop: 'all' };
    setAppliedFilters(defaultApplied);
    setCurrentPage(1);
    if (selectedPeriod) {
      fetchTuitions(selectedPeriod.id, false, defaultApplied);
    }
  };

  const enrichedTuitions = useMemo(() => {
    const classMap = new Map();
    classes.forEach(c => classMap.set(c.MaLop, c));
    return tuitions.map(t => {
      const cls = classMap.get(t.MaLop);
      return {
        ...t,
        ma_khoa: t.ma_khoa || cls?.MaKhoa || '',
        ten_khoa: t.ten_khoa || cls?.TenKhoa || '',
        nien_khoa: t.nien_khoa || cls?.NienKhoa || ''
      };
    });
  }, [tuitions, classes]);

  const filteredTuitions = useMemo(() => {
    return enrichedTuitions.filter(t => {
      if (appliedFilters.khoa !== 'all' && t.ma_khoa !== appliedFilters.khoa) return false;
      if (appliedFilters.nienKhoa !== 'all' && t.nien_khoa !== appliedFilters.nienKhoa) return false;
      if (appliedFilters.lop !== 'all' && t.MaLop !== appliedFilters.lop) return false;
      if (appliedFilters.status !== 'all' && t.trang_thai !== appliedFilters.status) return false;
      if (appliedFilters.search) {
        const q = appliedFilters.search.toLowerCase();
        const matchMssv = (t.mssv || '').toLowerCase().includes(q);
        const matchName = (t.ten_sinh_vien || '').toLowerCase().includes(q);
        if (!matchMssv && !matchName) return false;
      }
      return true;
    });
  }, [enrichedTuitions, appliedFilters]);

  const requestChangePeriodStatus = (period, newStatus) => {
    if (newStatus === 'dang_mo') {
      const activePeriod = periods.find(p => p.trang_thai === 'dang_mo' && p.id !== period.id);
      if (activePeriod) {
        setAlertPopupModal({
          open: true,
          title: 'Không thể mở đợt học phí mới!',
          message: `Hiện tại đợt "${activePeriod.ten_dot}" đang trong trạng thái MỞ. Hệ thống quy định chỉ cho phép duy nhất 1 đợt học phí được mở tại một thời điểm. Vui lòng đóng đợt "${activePeriod.ten_dot}" trước khi tiến hành mở đợt này!`
        });
        return;
      }
    }
    setConfirmStatusModal({ open: true, period, newStatus });
  };

  const handleConfirmChangePeriodStatus = async (periodId, newStatus) => {
    setConfirmStatusModal({ open: false, period: null, newStatus: '' });
    try {
      await api.put(`/api/admin/tuition-periods/${periodId}/status`, { trang_thai: newStatus });
      showToast('Cập nhật trạng thái đợt học phí thành công!');
      fetchPeriods();
    } catch (e) {
      showToast(e.response?.data?.message || 'Lỗi cập nhật!', 'error');
    }
  };

  const handleRequestDeletePeriod = (period) => {
    setDeletePeriodModal({ open: true, step: 1, period });
  };

  const executeDeletePeriod = async (periodId) => {
    try {
      await api.delete(`/api/admin/tuition-periods/${periodId}`);
      showToast('Đã xóa đợt đóng học phí thành công!');
      setDeletePeriodModal({ open: false, step: 1, period: null });
      if (selectedPeriod && selectedPeriod.id === periodId) {
        setSelectedPeriod(null);
      }
      fetchPeriods();
    } catch (e) {
      showToast(e.response?.data?.message || 'Lỗi khi xóa đợt học phí!', 'error');
    }
  };

  const handleApprovePayment = (hpId) => {
    const hp = tuitions.find(t => t.id === hpId) || detailModal.hp;
    setActionModal({ open: true, type: 'approve', hp: hp || { id: hpId } });
  };

  const handleRejectPayment = (hpId) => {
    const hp = tuitions.find(t => t.id === hpId) || detailModal.hp;
    setActionModal({ open: true, type: 'reject', hp: hp || { id: hpId } });
  };

  const executeApprovePayment = async (hpId) => {
    try {
      await api.put(`/api/admin/tuitions/${hpId}/approve-payment`);
      showToast('Đã duyệt thanh toán học phí thành công!');
      setDetailModal({ open: false, hp: null });
      setActionModal({ open: false, type: '', hp: null });
      if (selectedPeriod) fetchTuitions(selectedPeriod.id, true);
    } catch (e) {
      showToast(e.response?.data?.message || 'Lỗi duyệt thanh toán!', 'error');
    }
  };

  const executeRejectPayment = async (hpId) => {
    try {
      await api.put(`/api/admin/tuitions/${hpId}/reject-payment`);
      showToast('Đã chuyển lại trạng thái Chưa duyệt cho sinh viên!');
      setDetailModal({ open: false, hp: null });
      setActionModal({ open: false, type: '', hp: null });
      if (selectedPeriod) fetchTuitions(selectedPeriod.id, true);
    } catch (e) {
      showToast(e.response?.data?.message || 'Lỗi từ chối!', 'error');
    }
  };

  if (loading) return <Spinner />;

  const totalPages = Math.ceil(filteredTuitions.length / itemsPerPage) || 1;
  const paginatedTuitions = filteredTuitions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getPageNumbers = (current, total) => {
    if (total <= 7) return Array.from({ length: total }, (_, idx) => idx + 1);
    if (current <= 3 || current >= total - 2) return [1, 2, 3, '...', total - 2, total - 1, total];
    if (current === 4) return [1, 2, 3, 4, '...', total - 2, total - 1, total];
    if (current === total - 3) return [1, 2, 3, '...', total - 3, total - 2, total - 1, total];
    return [1, 2, 3, '...', current, '...', total - 2, total - 1, total];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: 'success' })} />
      <CreatePeriodModal open={createOpen} onClose={() => setCreateOpen(false)} onSuccess={(msg) => { showToast(msg); fetchPeriods(); }} />
      <ConfirmManualModal open={confirmModal.open} hocPhi={confirmModal.hp} onClose={() => setConfirmModal({ open: false, hp: null })} onSuccess={(msg) => { showToast(msg); if (selectedPeriod) fetchTuitions(selectedPeriod.id); }} />
      <DetailModal open={detailModal.open} hocPhi={detailModal.hp} onClose={() => setDetailModal({ open: false, hp: null })} onApprove={handleApprovePayment} onReject={handleRejectPayment} />
      <ActionConfirmModal open={actionModal.open} type={actionModal.type} hocPhi={actionModal.hp} onClose={() => setActionModal({ open: false, type: '', hp: null })} onConfirm={(hpId) => actionModal.type === 'approve' ? executeApprovePayment(hpId) : executeRejectPayment(hpId)} />
      <ConfirmStatusModal open={confirmStatusModal.open} period={confirmStatusModal.period} newStatus={confirmStatusModal.newStatus} onClose={() => setConfirmStatusModal({ open: false, period: null, newStatus: '' })} onConfirm={handleConfirmChangePeriodStatus} />
      <DeletePeriodModal open={deletePeriodModal.open} step={deletePeriodModal.step} period={deletePeriodModal.period} onClose={() => setDeletePeriodModal({ open: false, step: 1, period: null })} onNextStep={() => setDeletePeriodModal(prev => ({ ...prev, step: 2 }))} onConfirmDelete={executeDeletePeriod} />
      <AlertPopupModal open={alertPopupModal.open} title={alertPopupModal.title} message={alertPopupModal.message} onClose={() => setAlertPopupModal({ open: false, title: '', message: '' })} />

      {/* Header */}
      <div className="bg-[#F4C542] rounded-3xl p-8 shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5 relative z-10">
          <div className="p-4 bg-white/40 rounded-2xl backdrop-blur-sm">
            <CreditCard className="w-10 h-10 text-[#152238]" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-[#152238] mb-1">Quản lý Học Phí</h2>
            <p className="text-[#152238]/70 text-lg">Mở đợt, theo dõi và xác nhận thanh toán học phí sinh viên</p>
          </div>
        </div>
        <div className="flex gap-3 relative z-10">
          <button onClick={() => setCreateOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-[#FFFFFF] text-[#F4C542] hover:bg-gray-50 font-semibold rounded-xl shadow-lg transition-all text-sm">
            <Plus className="w-5 h-5 shrink-0" />
            <span>Mở đợt đóng tiền</span>
          </button>
        </div>
        <CreditCard className="absolute -right-6 -bottom-6 w-48 h-48 text-white opacity-10 transform rotate-12" />
      </div>

      {/* Period Tabs */}
      {periods.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-300">
          <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Chưa có đợt học phí nào. Nhấn <strong className="text-gray-900">"Mở đợt đóng tiền"</strong> để bắt đầu.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            {periods.map(p => {
              const st = STATUS_MAP[p.trang_thai] || STATUS_MAP.chua_mo;
              const isActive = selectedPeriod?.id === p.id;
              return (
                <button key={p.id} onClick={() => setSelectedPeriod(p)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm font-bold transition-all ${isActive ? 'bg-[#F4C542] text-[#152238] border-[#F4C542] shadow-lg ring-2 ring-[#F4C542]/40 font-black' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50'}`}>
                  {p.ten_dot}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${isActive ? 'bg-[#152238] text-white border-[#152238]' : st.cls}`}>{st.label}</span>
                  {p.trang_thai === 'dang_mo' && <Countdown ngay_dong={p.ngay_dong} />}
                  <span className={`px-1.5 py-0.5 rounded-lg text-xs ${isActive ? 'bg-[#152238]/15 text-[#152238] font-bold' : 'bg-gray-200 text-gray-600'}`}>{p.so_sv} SV</span>
                </button>
              );
            })}
          </div>

          {selectedPeriod && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Period info bar */}
              <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-black text-gray-900 text-lg">{selectedPeriod.ten_dot}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_MAP[selectedPeriod.trang_thai]?.cls}`}>{STATUS_MAP[selectedPeriod.trang_thai]?.label}</span>
                  </div>
                  <p className="text-sm text-gray-500">Mở: <strong className="text-gray-800">{new Date(selectedPeriod.ngay_mo).toLocaleString('vi-VN')}</strong> · Đóng: <strong className="text-gray-800">{new Date(selectedPeriod.ngay_dong).toLocaleString('vi-VN')}</strong> · Đơn giá: <strong className="text-gray-800">{Number(selectedPeriod.don_gia_tin_chi).toLocaleString('vi-VN')}đ/TC</strong></p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedPeriod.trang_thai === 'chua_mo' && (
                    <button onClick={() => requestChangePeriodStatus(selectedPeriod, 'dang_mo')} className="px-4 py-2 bg-[#152238] hover:bg-[#0f1a2b] text-white font-extrabold rounded-xl text-sm transition-all shadow-md flex items-center gap-1.5">
                      <Play className="w-4 h-4 fill-current text-[#F4C542]" /> Mở đợt
                    </button>
                  )}
                  {selectedPeriod.trang_thai === 'dang_mo' && (
                    <button onClick={() => requestChangePeriodStatus(selectedPeriod, 'da_dong')} className="px-4 py-2 bg-[#F4C542] hover:bg-[#e5a910] text-[#152238] font-extrabold rounded-xl text-sm transition-all shadow-md flex items-center gap-1.5">
                      <Square className="w-4 h-4 fill-current" /> Đóng đợt
                    </button>
                  )}
                  {selectedPeriod.trang_thai === 'da_dong' && (
                    <button onClick={() => requestChangePeriodStatus(selectedPeriod, 'dang_mo')} className="px-4 py-2 bg-[#152238] hover:bg-[#0f1a2b] text-white font-extrabold rounded-xl text-sm transition-all shadow-md flex items-center gap-1.5">
                      <Play className="w-4 h-4 fill-current text-[#F4C542]" /> Mở lại đợt
                    </button>
                  )}
                  <button onClick={() => handleRequestDeletePeriod(selectedPeriod)} className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-extrabold rounded-xl text-sm transition-all flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4" /> Xóa đợt
                  </button>
                </div>
              </div>

              {/* Filters Form */}
              <form onSubmit={handleSearchSubmit} className="p-5 border-b border-gray-100 space-y-4">
                {/* Dòng trên: Lọc sinh viên theo Khoa, Niên Khóa, Lớp */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                    <Filter className="w-4 h-4 text-[#F4BE2C]" /> Lọc sinh viên:
                  </span>
                  
                  {/* Khoa */}
                  <select
                    value={khoaFilter}
                    onChange={e => { setKhoaFilter(e.target.value); setNienKhoaFilter('all'); setClassFilter('all'); }}
                    className="px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-white font-bold text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F4BE2C] cursor-pointer"
                  >
                    <option value="all">Tất cả Khoa</option>
                    {faculties.map(f => (
                      <option key={f.MaKhoa} value={f.MaKhoa}>{f.TenKhoa}</option>
                    ))}
                  </select>

                  {/* Niên Khóa */}
                  <select
                    value={nienKhoaFilter}
                    onChange={e => { setNienKhoaFilter(e.target.value); setClassFilter('all'); }}
                    className="px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-white font-bold text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F4BE2C] cursor-pointer"
                  >
                    <option value="all">Tất cả Niên khóa</option>
                    {uniqueCohorts.map(nk => (
                      <option key={nk} value={nk}>Niên khóa {nk}</option>
                    ))}
                  </select>

                  {/* Lớp */}
                  <select
                    value={classFilter}
                    onChange={e => setClassFilter(e.target.value)}
                    className="px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-white font-bold text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F4BE2C] cursor-pointer"
                  >
                    <option value="all">Tất cả Lớp</option>
                    {filteredClasses.map(cls => (
                      <option key={cls.MaLop} value={cls.MaLop}>{cls.TenLop} ({cls.MaLop})</option>
                    ))}
                  </select>
                </div>

                {/* Dòng dưới: Khung tìm kiếm, Trạng thái & Nút Tìm / Xóa lọc */}
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input type="text" placeholder="Tìm MSSV, tên sinh viên..." value={search} onChange={e => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#F4BE2C] font-medium text-gray-800" />
                  </div>
                  
                  <div className="relative shrink-0">
                    <Filter className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none font-bold text-gray-800 cursor-pointer w-full md:w-auto">
                      <option value="all">Tất cả trạng thái</option>
                      <option value="Chờ duyệt">Chờ kiểm tra STK</option>
                      <option value="Chưa đóng">Chưa đóng</option>
                      <option value="Đã đóng">Đã đóng</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button type="submit" className="px-6 py-2.5 bg-[#152238] text-white rounded-xl text-sm font-bold hover:bg-[#0f1a2b] transition-colors flex items-center gap-1.5 shadow-sm">
                      <Search className="w-4 h-4 text-[#F4C542]" /> Tìm kiếm
                    </button>

                    {(khoaFilter !== 'all' || nienKhoaFilter !== 'all' || classFilter !== 'all' || statusFilter !== 'all' || search ||
                      appliedFilters.khoa !== 'all' || appliedFilters.nienKhoa !== 'all' || appliedFilters.lop !== 'all' || appliedFilters.status !== 'all' || appliedFilters.search) && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5 border border-rose-100"
                      >
                        <X className="w-4 h-4" /> Xóa lọc
                      </button>
                    )}
                  </div>
                </div>
              </form>

              {/* Table */}
              {loadingTuitions ? <Spinner /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left font-bold text-gray-600">MSSV</th>
                        <th className="px-6 py-4 text-left font-bold text-gray-600">Họ tên</th>
                        <th className="px-6 py-4 text-right font-bold text-gray-600">Số tiền</th>
                        <th className="px-6 py-4 text-center font-bold text-gray-600">Trạng thái</th>
                        <th className="px-6 py-4 text-center font-bold text-gray-600">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedTuitions.length === 0 ? (
                        <tr><td colSpan="5" className="py-16 text-center text-gray-400 font-medium text-base">Không có dữ liệu phù hợp</td></tr>
                      ) : paginatedTuitions.map(t => (
                        <React.Fragment key={t.id}>
                          <tr className={`hover:bg-yellow-50/70 transition-colors cursor-pointer ${detailModal.hp?.id === t.id ? 'bg-yellow-50/50' : ''}`} onClick={() => setDetailModal({ open: true, hp: t })}>
                            <td className="px-6 py-4 font-mono font-extrabold text-gray-900 text-base">{t.mssv}</td>
                            <td className="px-6 py-4">
                              <div className="text-gray-800 font-bold text-base">{t.ten_sinh_vien || '—'}</div>
                              <div className="text-xs font-semibold text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                                {t.MaLop && <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-mono border border-gray-200/80">{t.MaLop}</span>}
                                {t.ten_khoa && <span className="text-gray-600">{t.ten_khoa}</span>}
                                {t.nien_khoa && <span className="text-gray-500 font-mono">• NK {t.nien_khoa}</span>}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right font-black text-emerald-600 font-mono text-base">{Number(t.so_tien).toLocaleString('vi-VN')}đ</td>
                            <td className="px-6 py-4 text-center">
                              {t.trang_thai === 'Đã đóng' ? (
                                <div className="flex flex-col items-center gap-1">
                                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-black text-xs border border-emerald-300">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Đã đóng
                                  </span>
                                  {t.gd_nguon && (
                                    <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1" title={t.gd_ghi_chu ? `Ghi chú: ${t.gd_ghi_chu}\nAdmin: ${t.gd_admin}\nThời gian: ${new Date(t.gd_thoi_gian).toLocaleString('vi-VN')}` : ''}>
                                      {t.gd_nguon === 'auto' ? (
                                        <><Zap className="w-3 h-3 text-amber-500" /> Tự động</>
                                      ) : (
                                        <><ShieldCheck className="w-3 h-3 text-emerald-600" /> {t.gd_admin || 'Admin'}</>
                                      )}
                                    </span>
                                  )}
                                </div>
                              ) : t.trang_thai === 'Chờ duyệt' ? (
                                <div className="flex flex-col items-center gap-1">
                                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-blue-100 text-blue-800 rounded-full font-black text-xs border border-blue-300 animate-pulse">
                                    <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Chờ duyệt
                                  </span>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-amber-100 text-amber-800 rounded-full font-black text-xs border border-amber-300">
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" /> Chưa đóng
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-2.5 flex-wrap">
                                {(t.trang_thai === 'Chờ duyệt' || t.trang_thai === 'Chưa đóng') && (
                                  <>
                                    <button onClick={() => handleApprovePayment(t.id)}
                                      className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-black transition-all shadow-2xs flex items-center gap-1.5">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                      Duyệt
                                    </button>
                                    <button onClick={() => handleRejectPayment(t.id)}
                                      className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-extrabold transition-all shadow-2xs flex items-center gap-1.5">
                                      <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                      Hủy duyệt
                                    </button>
                                  </>
                                )}
                                {t.trang_thai === 'Đã đóng' && (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Đã hoàn tất
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination controls & summary */}
              {filteredTuitions.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4 text-xs font-semibold text-gray-600 flex-wrap">
                    <span>
                      Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredTuitions.length)} trên tổng <strong className="text-gray-900 font-black">{filteredTuitions.length}</strong> khoản
                    </span>
                    <span className="hidden sm:inline text-gray-300">|</span>
                    <span className="text-emerald-700 font-bold">{filteredTuitions.filter(t => t.trang_thai === 'Đã đóng').length} đã đóng</span>
                    <span className="text-blue-700 font-bold">{filteredTuitions.filter(t => t.trang_thai === 'Chờ duyệt').length} chờ duyệt</span>
                    <span className="text-amber-700 font-bold">{filteredTuitions.filter(t => t.trang_thai === 'Chưa đóng').length} chưa đóng</span>
                    
                    <div className="flex items-center gap-1.5 sm:border-l border-gray-300 sm:pl-4">
                      <span>Số dòng:</span>
                      <select
                        value={itemsPerPage}
                        onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        className="bg-white border border-gray-300 rounded-lg px-2 py-1 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F4BE2C]"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-all font-bold text-xs flex items-center gap-1 shadow-2xs"
                      >
                        <ChevronLeft className="w-4 h-4" /> Trước
                      </button>

                      <div className="flex items-center gap-1">
                        {getPageNumbers(currentPage, totalPages).map((page, idx) => (
                          page === '...' ? (
                            <span key={`dots-${idx}`} className="w-8 h-8 flex items-center justify-center font-black text-gray-400 text-xs tracking-widest select-none">
                              ...
                            </span>
                          ) : (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`w-8 h-8 rounded-xl font-black text-xs transition-all flex items-center justify-center ${
                                currentPage === page
                                  ? 'bg-[#152238] text-white shadow-md'
                                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {page}
                            </button>
                          )
                        ))}
                      </div>

                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-all font-bold text-xs flex items-center gap-1 shadow-2xs"
                      >
                        Sau <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TuitionManagement;