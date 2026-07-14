import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import API_URL from '../../api';

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
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-white font-semibold text-sm transition-all ${type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`}>
      <span>{type === 'error' ? '✕' : '✓'}</span> {msg}
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
  return <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">⏱ {diff}</span>;
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
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-[#F4BE2C] p-6">
          <h3 className="text-xl font-black text-[#1a1a1a]">Mở Đợt Đóng Học Phí</h3>
          <p className="text-sm text-[#1a1a1a]/80 mt-1 font-medium">Hệ thống tự tính học phí cho toàn bộ sinh viên đã đăng ký</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {err && <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium">{err}</div>}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Chọn đợt đăng ký học phần <span className="text-rose-500">*</span></label>
            <select value={form.ma_dot_dangky} onChange={handleDotChange} required className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#F4BE2C]">
              <option value="">-- Chọn đợt --</option>
              {dotDangKyList.map(d => (
                <option key={d.MaDot} value={d.MaDot}>{d.TenDot} ({d.HocKy})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Ngày mở <span className="text-rose-500">*</span></label>
              <input type="datetime-local" value={form.ngay_mo} onChange={e => setForm(f => ({ ...f, ngay_mo: e.target.value }))} required className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#F4BE2C]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Ngày đóng <span className="text-rose-500">*</span></label>
              <input type="datetime-local" value={form.ngay_dong} onChange={e => setForm(f => ({ ...f, ngay_dong: e.target.value }))} required className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#F4BE2C]" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Đơn giá / tín chỉ (VNĐ) <span className="text-emerald-600 font-extrabold">(Cố định theo quy định)</span></label>
            <input type="text" value="1.150.000 VNĐ / tín chỉ" disabled className="w-full p-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-700 font-bold cursor-not-allowed" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all">Hủy</button>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-[#F4BE2C] text-[#1a1a1a] font-extrabold rounded-xl hover:bg-[#E0AB1D] transition-all shadow-md disabled:opacity-60">
              {loading ? 'Đang tạo...' : '✓ Tạo đợt'}
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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gray-900 p-6">
          <h3 className="text-xl font-black text-white">👤 Xác nhận thủ công</h3>
          <p className="text-gray-400 text-sm mt-1">MSSV: <strong className="text-white">{hocPhi.mssv}</strong> — {Number(hocPhi.so_tien).toLocaleString('vi-VN')}đ</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {err && <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium">{err}</div>}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Ghi chú <span className="text-rose-500">*</span> <span className="text-gray-400 font-normal">(tối thiểu 5 ký tự)</span></label>
            <textarea value={ghi_chu} onChange={e => setGhiChu(e.target.value)} rows={3} placeholder="VD: SV nộp tiền mặt tại phòng kế toán ngày 15/7/2026..." className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Link minh chứng <span className="text-gray-400 font-normal">(tùy chọn)</span></label>
            <input type="url" value={minh_chung_url} onChange={e => setMinhChung(e.target.value)} placeholder="https://..." className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200">Hủy</button>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all disabled:opacity-60">
              {loading ? 'Đang xác nhận...' : '✓ Xác nhận thu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Row chi tiết expanded ────────────────────────────────────────────────────
const DetailRow = ({ hocPhiId }) => {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get(`/api/admin/tuitions/${hocPhiId}/detail`).then(r => setData(r.data?.data)).catch(() => {});
  }, [hocPhiId]);
  if (!data) return <tr><td colSpan="8" className="py-4 text-center text-gray-400 animate-pulse">Đang tải chi tiết...</td></tr>;
  return (
    <tr>
      <td colSpan="8" className="px-8 pb-4 bg-gray-50/80">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Chi tiết học phần</p>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-100"><tr>
                  <th className="px-3 py-2 text-left">Môn học</th>
                  <th className="px-3 py-2 text-center">TC</th>
                  <th className="px-3 py-2 text-right">Học phí</th>
                  <th className="px-3 py-2 text-right">Phí tài liệu</th>
                  <th className="px-3 py-2 text-right">Phải đóng</th>
                </tr></thead>
                <tbody>{(data.chi_tiet || []).map((ct, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-3 py-1.5 font-medium">{ct.ten_mon_hoc}</td>
                    <td className="px-3 py-1.5 text-center">{ct.so_tin_chi}</td>
                    <td className="px-3 py-1.5 text-right font-mono">{Number(ct.hoc_phi ?? ct.thanh_tien).toLocaleString('vi-VN')}đ</td>
                    <td className="px-3 py-1.5 text-right font-mono text-amber-700">{Number(ct.phi_tai_lieu || 0).toLocaleString('vi-VN')}đ</td>
                    <td className="px-3 py-1.5 text-right font-mono text-emerald-700">{Number(ct.thanh_tien).toLocaleString('vi-VN')}đ</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Lịch sử giao dịch</p>
            {(data.giao_dich || []).length === 0 ? <p className="text-xs text-gray-400">Chưa có giao dịch</p> : (
              <div className="space-y-2">
                {data.giao_dich.map((gd, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl p-3 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="font-mono text-gray-500">{gd.ma_giao_dich}</span>
                      <span className={`px-2 py-0.5 rounded-full font-bold ${gd.trang_thai === 'thanh_cong' ? 'bg-emerald-100 text-emerald-700' : gd.trang_thai === 'cho_thanh_toan' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-600'}`}>{gd.trang_thai}</span>
                    </div>
                    {gd.nguon_xac_nhan && <div className="text-gray-500">Nguồn: <strong>{gd.nguon_xac_nhan === 'auto' ? '⚡ Tự động' : `👤 ${gd.admin_username || 'Admin'}`}</strong></div>}
                    {gd.ghi_chu && <div className="text-gray-500">📝 {gd.ghi_chu}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
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
  const [expandedRow, setExpandedRow] = useState(null);
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

  const fetchTuitions = useCallback(async (dotId) => {
    if (!dotId) return;
    setLoadingTuitions(true);
    try {
      const r = await api.get('/api/admin/tuitions', { params: { dot_id: dotId, status: statusFilter !== 'all' ? statusFilter : undefined, search: search || undefined } });
      setTuitions(r.data?.data || []);
    } catch { showToast('Lỗi tải học phí!', 'error'); }
    finally { setLoadingTuitions(false); }
  }, [statusFilter, search]);

  useEffect(() => { fetchPeriods(); }, []);
  useEffect(() => { if (selectedPeriod) { setExpandedRow(null); fetchTuitions(selectedPeriod.id); } }, [selectedPeriod, statusFilter]);

  // Polling 5s để auto-refresh khi có payment mới
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (selectedPeriod) {
      pollRef.current = setInterval(() => fetchTuitions(selectedPeriod.id), 5000);
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

  if (loading) return <Spinner />;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: 'success' })} />
      <CreatePeriodModal open={createOpen} onClose={() => setCreateOpen(false)} onSuccess={(msg) => { showToast(msg); fetchPeriods(); }} />
      <ConfirmManualModal open={confirmModal.open} hocPhi={confirmModal.hp} onClose={() => setConfirmModal({ open: false, hp: null })} onSuccess={(msg) => { showToast(msg); if (selectedPeriod) fetchTuitions(selectedPeriod.id); }} />

      {/* Header */}
      <div className="bg-[#1a1a1a] rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black flex items-center gap-3">Quản lý Học Phí</h2>
          <p className="text-gray-400 mt-1">Mở đợt, theo dõi và xác nhận thanh toán học phí sinh viên</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-[#F4BE2C] hover:bg-[#E0AB1D] text-[#1a1a1a] font-extrabold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 text-sm">
          + Mở đợt đóng tiền
        </button>
      </div>

      {/* Period Tabs */}
      {periods.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-300">
          <p className="text-4xl mb-4">📭</p>
          <p className="text-gray-500 font-medium">Chưa có đợt học phí nào. Nhấn <strong>"Mở đợt đóng tiền"</strong> để bắt đầu.</p>
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
                  <p className="text-sm text-gray-500">Mở: <strong>{new Date(selectedPeriod.ngay_mo).toLocaleString('vi-VN')}</strong> · Đóng: <strong>{new Date(selectedPeriod.ngay_dong).toLocaleString('vi-VN')}</strong> · Đơn giá: <strong>{Number(selectedPeriod.don_gia_tin_chi).toLocaleString('vi-VN')}đ/TC</strong></p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedPeriod.trang_thai === 'chua_mo' && (
                    <button onClick={() => handleChangePeriodStatus(selectedPeriod.id, 'dang_mo')} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all shadow-sm">▶ Mở đợt</button>
                  )}
                  {selectedPeriod.trang_thai === 'dang_mo' && (
                    <button onClick={() => handleChangePeriodStatus(selectedPeriod.id, 'da_dong')} className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-sm transition-all shadow-sm">■ Đóng đợt</button>
                  )}
                  {selectedPeriod.trang_thai === 'da_dong' && (
                    <button onClick={() => handleChangePeriodStatus(selectedPeriod.id, 'dang_mo')} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all shadow-sm">▶ Mở lại đợt</button>
                  )}
                </div>
              </div>

              {/* Filters */}
              <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-3">
                <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                  <input type="text" placeholder="Tìm MSSV, tên sinh viên..." value={search} onChange={e => setSearch(e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#F4BE2C]" />
                  <button type="submit" className="px-4 py-2.5 bg-[#1a1a1a] text-white rounded-xl text-sm font-bold hover:bg-gray-800">Tìm</button>
                </form>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none">
                  <option value="all">Tất cả</option>
                  <option value="Chưa đóng">Chưa đóng</option>
                  <option value="Đã đóng">Đã đóng</option>
                </select>
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
                      {tuitions.length === 0 ? (
                        <tr><td colSpan="5" className="py-16 text-center text-gray-400">Không có dữ liệu</td></tr>
                      ) : tuitions.map(t => (
                        <React.Fragment key={t.id}>
                          <tr className={`hover:bg-yellow-50/50 transition-colors cursor-pointer ${expandedRow === t.id ? 'bg-yellow-50/30' : ''}`} onClick={() => setExpandedRow(prev => prev === t.id ? null : t.id)}>
                            <td className="px-6 py-4 font-mono font-bold text-gray-900">{t.mssv}</td>
                            <td className="px-6 py-4 text-gray-700 font-medium">{t.ten_sinh_vien || '—'}</td>
                            <td className="px-6 py-4 text-right font-bold text-emerald-600 font-mono">{Number(t.so_tien).toLocaleString('vi-VN')}đ</td>
                            <td className="px-6 py-4 text-center">
                              {t.trang_thai === 'Đã đóng' ? (
                                <div className="flex flex-col items-center gap-1">
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-bold text-xs">
                                    ✓ Đã đóng
                                  </span>
                                  {t.gd_nguon && (
                                    <span className="text-xs text-gray-500" title={t.gd_ghi_chu ? `Ghi chú: ${t.gd_ghi_chu}\nAdmin: ${t.gd_admin}\nThời gian: ${new Date(t.gd_thoi_gian).toLocaleString('vi-VN')}` : ''}>
                                      {t.gd_nguon === 'auto' ? '⚡ Tự động' : `👤 ${t.gd_admin || 'Admin'}`}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="inline-flex px-3 py-1 bg-amber-100 text-amber-700 rounded-full font-bold text-xs">⏳ Chưa đóng</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => setExpandedRow(prev => prev === t.id ? null : t.id)}
                                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-all">
                                  {expandedRow === t.id ? '▲ Ẩn' : '▼ Chi tiết'}
                                </button>
                                {t.trang_thai === 'Chưa đóng' && (
                                  <button onClick={() => setConfirmModal({ open: true, hp: t })}
                                    className="px-3 py-1.5 bg-[#1a1a1a] hover:bg-gray-800 text-white rounded-lg text-xs font-bold transition-all">
                                    👤 Xác nhận thủ công
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {expandedRow === t.id && <DetailRow hocPhiId={t.id} />}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500">
                Hiển thị {tuitions.length} khoản • <span className="text-emerald-600 font-bold">{tuitions.filter(t => t.trang_thai === 'Đã đóng').length}</span> đã đóng · <span className="text-amber-600 font-bold">{tuitions.filter(t => t.trang_thai === 'Chưa đóng').length}</span> chưa đóng
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TuitionManagement;