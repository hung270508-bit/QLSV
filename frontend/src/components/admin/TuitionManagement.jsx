import React, { useState, useEffect, useCallback, useRef } from 'react';
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

  const handleDotChange = (e) => {
    const dot = dotDangKyList.find(d => String(d.MaDot) === e.target.value);
    setForm(f => ({ ...f, ma_dot_dangky: e.target.value, hoc_ky: dot?.HocKy || '', ten_dot: dot?.TenDot || '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.ma_dot_dangky || !form.ngay_mo || !form.ngay_dong) { setErr('Vui lòng điền đầy đủ thông tin!'); return; }
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
        <div className="bg-[#F4BE2C] p-6 flex items-center gap-3">
          <div className="p-2.5 bg-[#1a1a1a] text-[#F4BE2C] rounded-xl font-black">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#1a1a1a]">Mở Đợt Đóng Học Phí</h3>
            <p className="text-sm text-[#1a1a1a]/80 mt-0.5 font-medium">Hệ thống tự tính học phí cho toàn bộ sinh viên đã đăng ký</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {err && <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" /> {err}</div>}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Chọn đợt đăng ký học phần <span className="text-rose-500">*</span></label>
            <select value={form.ma_dot_dangky} onChange={handleDotChange} required className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#F4BE2C] font-semibold text-gray-800">
              <option value="">-- Chọn đợt --</option>
              {dotDangKyList.map(d => (
                <option key={d.MaDot} value={d.MaDot}>{d.TenDot} ({d.HocKy})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Ngày mở <span className="text-rose-500">*</span></label>
              <input type="datetime-local" value={form.ngay_mo} onChange={e => setForm(f => ({ ...f, ngay_mo: e.target.value }))} required className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#F4BE2C] font-semibold text-gray-800" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Ngày đóng <span className="text-rose-500">*</span></label>
              <input type="datetime-local" value={form.ngay_dong} onChange={e => setForm(f => ({ ...f, ngay_dong: e.target.value }))} required className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#F4BE2C] font-semibold text-gray-800" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Đơn giá / tín chỉ (VNĐ) <span className="text-emerald-600 font-extrabold">(Cố định theo quy định)</span></label>
            <input type="text" value="1.150.000 VNĐ / tín chỉ" disabled className="w-full p-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-700 font-bold cursor-not-allowed" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all">Hủy</button>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-[#1a1a1a] text-white font-extrabold rounded-xl hover:bg-gray-800 transition-all shadow-md disabled:opacity-60 flex items-center justify-center gap-2">
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
        <div className="bg-[#1a1a1a] p-6 flex items-center gap-3">
          <div className="p-2.5 bg-[#F4BE2C] text-[#1a1a1a] rounded-xl font-black">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Xác Nhận Thu Thủ Công</h3>
            <p className="text-gray-400 text-sm mt-0.5">MSSV: <strong className="text-white font-mono">{hocPhi.mssv}</strong> — <span className="text-emerald-400 font-mono font-black">{Number(hocPhi.so_tien).toLocaleString('vi-VN')}đ</span></p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {err && <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" /> {err}</div>}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Ghi chú <span className="text-rose-500">*</span> <span className="text-gray-400 font-normal">(tối thiểu 5 ký tự)</span></label>
            <textarea value={ghi_chu} onChange={e => setGhiChu(e.target.value)} rows={3} placeholder="VD: SV nộp tiền mặt tại phòng kế toán ngày 15/7/2026..." className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none font-medium text-gray-800" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Link minh chứng <span className="text-gray-400 font-normal">(tùy chọn)</span></label>
            <input type="url" value={minh_chung_url} onChange={e => setMinhChung(e.target.value)} placeholder="https://..." className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 font-medium text-gray-800" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">Hủy</button>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-[#1a1a1a] text-white font-extrabold rounded-xl hover:bg-gray-800 transition-all shadow-md disabled:opacity-60 flex items-center justify-center gap-2">
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
        <div className="bg-[#1a1a1a] p-6 text-white flex items-center justify-between border-b border-gray-800 shrink-0">
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
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100/80 text-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold">Môn học</th>
                        <th className="px-3 py-3 text-center font-bold">TC</th>
                        <th className="px-4 py-3 text-right font-bold">Phải đóng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(data.chi_tiet || []).map((ct, i) => (
                        <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-4 py-2.5 font-bold text-gray-800">{ct.ten_mon_hoc}</td>
                          <td className="px-3 py-2.5 text-center font-semibold text-gray-600">{ct.so_tin_chi}</td>
                          <td className="px-4 py-2.5 text-right font-mono font-black text-emerald-700">{Number(ct.thanh_tien || 0).toLocaleString('vi-VN')}đ</td>
                        </tr>
                      ))}
                    </tbody>
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
  const [loading, setLoading] = useState(true);
  const [loadingTuitions, setLoadingTuitions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [detailModal, setDetailModal] = useState({ open: false, hp: null });
  const [actionModal, setActionModal] = useState({ open: false, type: '', hp: null });
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, hp: null });
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const pollRef = useRef(null);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const fetchPeriods = useCallback(async () => {
    try {
      const r = await api.get('/api/admin/tuition-periods');
      const list = r.data?.data || [];
      setPeriods(list);
      if (list.length > 0 && !selectedPeriod) setSelectedPeriod(list[0]);
    } catch { showToast('Lỗi tải danh sách đợt!', 'error'); }
    finally { setLoading(false); }
  }, [selectedPeriod]);

  const fetchTuitions = useCallback(async (dotId, silent = false) => {
    if (!dotId) return;
    if (!silent) setLoadingTuitions(true);
    try {
      const r = await api.get('/api/admin/tuitions', { params: { dot_id: dotId, status: statusFilter !== 'all' ? statusFilter : undefined, search: search || undefined } });
      setTuitions(r.data?.data || []);
      if (!silent) setCurrentPage(1);
    } catch { showToast('Lỗi tải học phí!', 'error'); }
    finally { if (!silent) setLoadingTuitions(false); }
  }, [statusFilter, search]);

  useEffect(() => { fetchPeriods(); }, []);
  useEffect(() => { if (selectedPeriod) { setDetailModal({ open: false, hp: null }); fetchTuitions(selectedPeriod.id); } }, [selectedPeriod, statusFilter]);

  // Polling silent auto-refresh mỗi 10s (silent=true để không kích hoạt loading spinner)
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (selectedPeriod) {
      pollRef.current = setInterval(() => fetchTuitions(selectedPeriod.id, true), 10000);
    }
    return () => clearInterval(pollRef.current);
  }, [selectedPeriod, fetchTuitions]);

  const handleSearch = (e) => { e.preventDefault(); if (selectedPeriod) fetchTuitions(selectedPeriod.id); };

  const handleChangePeriodStatus = async (periodId, newStatus) => {
    try {
      await api.put(`/api/admin/tuition-periods/${periodId}/status`, { trang_thai: newStatus });
      showToast('Cập nhật trạng thái thành công!');
      fetchPeriods();
    } catch (e) { showToast(e.response?.data?.message || 'Lỗi cập nhật!', 'error'); }
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

  const totalPages = Math.ceil(tuitions.length / itemsPerPage) || 1;
  const paginatedTuitions = tuitions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

      {/* Header */}
      <div className="bg-[#1a1a1a] rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black flex items-center gap-3">Quản lý Học Phí</h2>
          <p className="text-gray-400 mt-1">Mở đợt, theo dõi và xác nhận thanh toán học phí sinh viên</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-[#F4BE2C] hover:bg-[#E0AB1D] text-[#1a1a1a] font-extrabold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 text-sm">
          <Plus className="w-4 h-4 shrink-0" />
          <span>Mở đợt đóng tiền</span>
        </button>
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
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm font-bold transition-all ${isActive ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-lg' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'}`}>
                  {p.ten_dot}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${isActive ? 'bg-white/20 text-white border-white/30' : st.cls}`}>{st.label}</span>
                  {p.trang_thai === 'dang_mo' && <Countdown ngay_dong={p.ngay_dong} />}
                  <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-lg text-xs">{p.so_sv} SV</span>
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
                    <button onClick={() => handleChangePeriodStatus(selectedPeriod.id, 'dang_mo')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm flex items-center gap-1.5">
                      <Play className="w-4 h-4 fill-current" /> Mở đợt
                    </button>
                  )}
                  {selectedPeriod.trang_thai === 'dang_mo' && (
                    <button onClick={() => handleChangePeriodStatus(selectedPeriod.id, 'da_dong')} className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-sm transition-all shadow-sm flex items-center gap-1.5">
                      <Square className="w-4 h-4 fill-current" /> Đóng đợt
                    </button>
                  )}
                  {selectedPeriod.trang_thai === 'da_dong' && (
                    <button onClick={() => handleChangePeriodStatus(selectedPeriod.id, 'dang_mo')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm flex items-center gap-1.5">
                      <Play className="w-4 h-4 fill-current" /> Mở lại đợt
                    </button>
                  )}
                </div>
              </div>

              {/* Filters */}
              <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-3">
                <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input type="text" placeholder="Tìm MSSV, tên sinh viên..." value={search} onChange={e => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#F4BE2C] font-medium text-gray-800" />
                  </div>
                  <button type="submit" className="px-5 py-2.5 bg-[#1a1a1a] text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors">Tìm</button>
                </form>
                <div className="relative">
                  <Filter className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none font-bold text-gray-800 cursor-pointer">
                    <option value="all">Tất cả trạng thái</option>
                    <option value="Chờ duyệt">Chờ kiểm tra STK</option>
                    <option value="Chưa đóng">Chưa đóng</option>
                    <option value="Đã đóng">Đã đóng</option>
                  </select>
                </div>
              </div>

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
                            <td className="px-6 py-4 text-gray-800 font-bold text-base">{t.ten_sinh_vien || '—'}</td>
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
                                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-sm flex items-center gap-1.5">
                                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                                      Đã duyệt
                                    </button>
                                    <button onClick={() => handleRejectPayment(t.id)}
                                      className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-extrabold transition-all shadow-sm flex items-center gap-1.5">
                                      <XCircle className="w-4 h-4 shrink-0" />
                                      Chưa duyệt
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
              {tuitions.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4 text-xs font-semibold text-gray-600 flex-wrap">
                    <span>
                      Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, tuitions.length)} trên tổng <strong className="text-gray-900 font-black">{tuitions.length}</strong> khoản
                    </span>
                    <span className="hidden sm:inline text-gray-300">|</span>
                    <span className="text-emerald-700 font-bold">{tuitions.filter(t => t.trang_thai === 'Đã đóng').length} đã đóng</span>
                    <span className="text-blue-700 font-bold">{tuitions.filter(t => t.trang_thai === 'Chờ duyệt').length} chờ duyệt</span>
                    <span className="text-amber-700 font-bold">{tuitions.filter(t => t.trang_thai === 'Chưa đóng').length} chưa đóng</span>
                    
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
                                  ? 'bg-[#1a1a1a] text-white shadow-md'
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