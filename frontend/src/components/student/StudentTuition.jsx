import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import API_URL from '../../api';
import {
  Wallet, AlertCircle, CheckCircle2, Clock, QrCode, Calendar,
  Copy, Check, Landmark, Info, ShieldAlert, CreditCard
} from 'lucide-react';

// ─── Axios instance với JWT từ storage ────────────────────────────────────────
const api = axios.create({ baseURL: API_URL });
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtMoney = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';
const fmtDate  = (d) => new Date(d).toLocaleString('vi-VN', {
  day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit'
});

const removeVietnameseTones = (str = '') => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D');
};

const BANK_ACCOUNTS = [
  {
    bankName: 'VietinBank',
    branch: 'Chi nhánh 1, TP.HCM',
    accountNumber: '108873448328',
    displayNumber: '1088 7344 8328',
    holder: 'TRƯỜNG ĐẠI HỌC NHẤT TÍN',
    isPrimary: true
  },
  {
    bankName: 'Vietcombank',
    branch: 'CN Tân Sơn Nhất, TP.HCM',
    accountNumber: '1068259999',
    displayNumber: '106 825 9999',
    holder: 'TRƯỜNG ĐẠI HỌC NHẤT TÍN'
  },
  {
    bankName: 'ACB',
    branch: 'Chi nhánh TP.HCM',
    accountNumber: '303600888',
    displayNumber: '303 600 888',
    holder: 'TRƯỜNG ĐẠI HỌC NHẤT TÍN'
  },
  {
    bankName: 'BIDV',
    branch: 'CN Phú Nhuận, TP.HCM',
    accountNumber: '3151099999',
    displayNumber: '315 109 9999',
    holder: 'TRƯỜNG ĐẠI HỌC NHẤT TÍN'
  }
];

// ─── Component CopyButton ─────────────────────────────────────────────────────
const CopyButton = ({ text, label = 'Copy' }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      title="Sao chép"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg hover:bg-gray-100 transition-colors text-blue-600 border border-blue-200/60 bg-white shadow-xs"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? <span className="text-emerald-600">Đã chép</span> : label}
    </button>
  );
};

// ─── Countdown ────────────────────────────────────────────────────────────────
const Countdown = ({ target, label = '' }) => {
  const [txt, setTxt] = useState('');
  useEffect(() => {
    const calc = () => {
      const ms = new Date(target) - new Date();
      if (ms <= 0) { setTxt('Đã hết hạn'); return; }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setTxt(h > 0
        ? `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
        : `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
      );
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [target]);
  return <span className="font-mono text-sm font-extrabold">{label && `${label} `}{txt}</span>;
};

// ─── QR Payment Modal (Cách 1) ────────────────────────────────────────────────
const QRModal = ({ open, hocPhi, onClose, onPaid }) => {
  const [step, setStep]     = useState('idle');
  const [qrData, setQrData] = useState(null);
  const [errMsg, setErrMsg] = useState('');
  const pollRef = useRef(null);

  const stopPoll = () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };

  const startPoll = useCallback((hocPhiId) => {
    stopPoll();
    pollRef.current = setInterval(async () => {
      try {
        const r = await api.get(`/api/student/tuitions/${hocPhiId}/payment-status`);
        const st = r.data?.data?.trang_thai || r.data?.data?.hp_trang_thai;
        if (st === 'thanh_cong' || r.data?.data?.hp_trang_thai === 'Đã đóng') {
          stopPoll();
          setStep('paid');
          onPaid?.();
        }
      } catch { /* silent */ }
    }, 5000);
  }, [onPaid]);

  const generateQR = async () => {
    setStep('loading'); setErrMsg('');
    try {
      const r = await api.post(`/api/student/tuitions/${hocPhi.id}/generate-qr`);
      setQrData(r.data?.data);
      setStep('qr');
      startPoll(hocPhi.id);
    } catch (e) {
      setErrMsg(e.response?.data?.message || 'Lỗi sinh QR, thử lại sau!');
      setStep('error');
    }
  };

  useEffect(() => {
    if (!open) { stopPoll(); setStep('idle'); setQrData(null); setErrMsg(''); return; }
    if (hocPhi?.trang_thai === 'Đã đóng') { setStep('paid'); return; }
    generateQR();
  }, [open, hocPhi?.id]);

  useEffect(() => () => stopPoll(), []);

  if (!open || !hocPhi) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-[#1a1a1a] p-5 text-white flex items-center justify-between">
          <div>
            <h3 className="font-black text-lg flex items-center gap-2">
              <QrCode className="w-5 h-5 text-[#F4BE2C]" /> Cổng VietQR Tự Động
            </h3>
            <p className="text-gray-400 text-xs mt-0.5">Xác nhận thanh toán tức thì sau 5s</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">✕</button>
        </div>

        <div className="p-5">
          {step === 'loading' && (
            <div className="flex flex-col items-center py-10 gap-4">
              <div className="w-12 h-12 border-4 border-[#F4BE2C] border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-600 text-sm font-semibold">Đang tạo mã VietQR bảo mật...</p>
            </div>
          )}

          {step === 'error' && (
            <div className="flex flex-col items-center py-8 gap-3">
              <AlertCircle className="w-12 h-12 text-rose-500" />
              <p className="text-rose-600 font-medium text-center text-sm">{errMsg}</p>
              <button onClick={generateQR} className="px-5 py-2.5 bg-rose-500 text-white rounded-xl font-bold text-sm hover:bg-rose-600 transition-colors">Thử lại</button>
            </div>
          )}

          {step === 'paid' && (
            <div className="flex flex-col items-center py-10 gap-4">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-emerald-700">Thanh toán thành công!</p>
                <p className="text-gray-500 text-sm mt-1">Hệ thống đã ghi nhận học phí của bạn.</p>
              </div>
              <button onClick={onClose} className="px-6 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors">Hoàn tất</button>
            </div>
          )}

          {step === 'qr' && qrData && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-3 border-2 border-[#F4BE2C] rounded-2xl shadow-lg bg-white">
                  <img
                    src={qrData.qr_url}
                    alt="VietQR"
                    className="w-52 h-52 rounded-xl object-contain"
                    onError={e => { e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData.qr_url)}`; }}
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5 text-sm border border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Ngân hàng</span>
                  <span className="font-extrabold text-gray-900">VietinBank</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Số tài khoản</span>
                  <span className="font-mono font-bold text-gray-900">108873448328</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Số tiền</span>
                  <span className="font-black text-emerald-600 text-base">{fmtMoney(qrData.so_tien)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-gray-500 text-xs">Nội dung</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-extrabold text-xs text-blue-700 max-w-[155px] truncate" title={qrData.noi_dung}>{qrData.noi_dung}</span>
                    <CopyButton text={qrData.noi_dung} />
                  </div>
                </div>
              </div>

              {qrData.het_han && (
                <div className="flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 rounded-xl py-2.5 px-4 text-amber-700">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span className="text-sm">Hạn mã QR (15 phút): </span>
                  <Countdown target={qrData.het_han} />
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-gray-500 justify-center font-medium">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                Đang chờ xác nhận thanh toán tự động...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component StudentTuition ────────────────────────────────────────────
const StudentTuition = () => {
  const [tuitions, setTuitions] = useState([]);
  const [selectedTuition, setSelectedTuition] = useState(null);
  const [chiTietList, setChiTietList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const fetchTuitions = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const r = await api.get('/api/student/tuitions/me');
      const list = r.data?.data || [];
      setTuitions(list);
      if (list.length > 0 && !selectedTuition) {
        setSelectedTuition(list[0]);
      }
    } catch (e) {
      if (e.response?.status === 403) setError('Bạn không có quyền xem thông tin này.');
      else if (e.response?.status === 401) setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      else setError('Không thể tải thông tin học phí. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [selectedTuition]);

  const fetchDetail = useCallback(async (hpId) => {
    if (!hpId) { setChiTietList([]); return; }
    try {
      setLoadingDetail(true);
      const r = await api.get(`/api/student/tuitions/${hpId}/detail`);
      setChiTietList(r.data?.data?.chi_tiet || []);
    } catch {
      setChiTietList([]);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    fetchTuitions();
  }, []);

  useEffect(() => {
    if (selectedTuition?.id) {
      fetchDetail(selectedTuition.id);
    }
  }, [selectedTuition, fetchDetail]);

  const handlePaid = useCallback(() => {
    fetchTuitions();
  }, [fetchTuitions]);

  const scrollToBankInfo = () => {
    const el = document.getElementById('bank-transfer-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Lấy chính xác Họ tên + MSSV + Học kỳ từ tài khoản đăng nhập hoặc selectedTuition
  const getTransferContent = () => {
    let svName = selectedTuition?.ten_sinh_vien || '';
    let mssv   = selectedTuition?.mssv || '';

    try {
      const uStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (uStr) {
        const u = JSON.parse(uStr);
        if (!svName) svName = u.HoTen || u.name || u.ten_sinh_vien || '';
        if (!mssv) mssv = u.MSSV || u.mssv || u.id || '';
      }
    } catch {}

    const svNameClean = removeVietnameseTones(svName || 'SINH VIEN').replace(/[^a-zA-Z0-9 ]/g, '').trim().toUpperCase();
    const hkClean = (selectedTuition?.hoc_ky || '').replace(/_/g, ' ').trim().toUpperCase();
    return `${svNameClean} ${mssv} ${hkClean}`.replace(/\s+/g, ' ').trim();
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-80 gap-4">
      <div className="w-12 h-12 border-4 border-[#F4BE2C] border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 text-sm font-semibold">Đang tải bảng học phí sinh viên...</p>
    </div>
  );

  if (error) return (
    <div className="max-w-md mx-auto mt-16 bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center">
      <AlertCircle className="w-14 h-14 text-rose-500 mx-auto mb-4" />
      <p className="text-rose-700 font-bold mb-4">{error}</p>
      <button onClick={fetchTuitions} className="px-6 py-2.5 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-colors">Thử lại</button>
    </div>
  );

  const isPaid = selectedTuition?.trang_thai === 'Đã đóng';
  const totalSTC = chiTietList.reduce((acc, cur) => acc + Number(cur.so_tin_chi || 0), 0);
  const tenDotHoacHocKy = selectedTuition?.ten_dot || selectedTuition?.hoc_ky || 'Học kỳ';

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 px-2 md:px-4 text-gray-800">
      <QRModal
        open={qrModalOpen}
        hocPhi={selectedTuition}
        onClose={() => setQrModalOpen(false)}
        onPaid={handlePaid}
      />

      {/* Header Banner cao cấp */}
      <div className="bg-[#1a1a1a] rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#F4BE2C]/15 to-transparent rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex items-center gap-5 relative z-10">
          <div className="p-4 bg-[#F4BE2C] text-[#1a1a1a] rounded-2xl font-black shadow-md">
            <Wallet className="w-9 h-9" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">Cổng Tra Cứu Học Phí</h2>
              <span className="px-2.5 py-0.5 bg-[#F4BE2C]/20 text-[#F4BE2C] text-xs font-bold rounded-full border border-[#F4BE2C]/30">Nhất Tín University</span>
            </div>
            <p className="text-gray-400 text-sm mt-1 font-medium">Bảng kê học phần & Thanh toán trực tuyến VietQR</p>
          </div>
        </div>

        {tuitions.length > 0 && (
          <div className="flex items-center gap-3 relative z-10">
            <span className="text-sm text-gray-300 font-semibold">Chọn học kỳ:</span>
            <select
              value={selectedTuition?.id || ''}
              onChange={e => {
                const item = tuitions.find(t => String(t.id) === e.target.value);
                if (item) setSelectedTuition(item);
              }}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#F4BE2C] transition-colors text-sm cursor-pointer"
            >
              {tuitions.map(t => (
                <option key={t.id} value={t.id} className="text-gray-900">
                  {t.ten_dot || t.hoc_ky}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {tuitions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center shadow-sm">
          <div className="text-6xl mb-4">🎓</div>
          <h3 className="text-xl font-bold text-gray-800">Hiện chưa có dữ liệu học phí</h3>
          <p className="text-gray-500 text-sm mt-1">Khi nhà trường mở đợt đóng học phí cho học kỳ của bạn, thông tin chi tiết sẽ hiển thị tại đây.</p>
        </div>
      ) : selectedTuition && (
        <>
          {/* PHẦN 1: BẢNG CHI TIẾT HỌC PHÍ */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header Bảng */}
            <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/60">
              <div>
                <h3 className="text-xl font-black text-[#1a1a1a] flex items-center gap-2.5">
                  <Calendar className="w-5 h-5 text-[#F4BE2C]" />
                  Bảng Chi Tiết Học Phí — {tenDotHoacHocKy}
                </h3>
                <p className="text-xs text-rose-600 font-semibold italic mt-1">
                  (Dữ liệu được cập nhật vào lúc: {fmtDate(selectedTuition.ngay_tinh || new Date())})
                </p>
              </div>

              {/* Nút hành động với màu vàng ấm chuẩn Ảnh 3 */}
              <div className="flex items-center gap-3 flex-wrap">
                {isPaid ? (
                  <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-100 text-emerald-800 rounded-xl font-extrabold text-sm border border-emerald-300">
                    <CheckCircle2 className="w-4 h-4" /> Đã hoàn tất học phí
                  </span>
                ) : (
                  <>
                    <button
                      onClick={() => setQrModalOpen(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F4BE2C] hover:bg-[#E0AB1D] text-[#1a1a1a] font-extrabold rounded-xl shadow-md hover:shadow-lg transition-all text-sm"
                    >
                      <QrCode className="w-4 h-4" /> Quét mã QR tự động (Cách 1)
                    </button>
                    <button
                      onClick={scrollToBankInfo}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors text-sm border border-gray-200"
                    >
                      <Landmark className="w-4 h-4" /> Chuyển khoản STK (Cách 2)
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Bảng Học Phần */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#1E293B] text-white font-bold text-xs uppercase tracking-wider">
                    <th className="py-3.5 px-4 text-center w-14">STT</th>
                    <th className="py-3.5 px-6 text-left">Mã Học Phần</th>
                    <th className="py-3.5 px-6 text-left">Tên Học Phần</th>
                    <th className="py-3.5 px-4 text-center">Số Tín Chỉ</th>
                    <th className="py-3.5 px-6 text-right">Phí Tài Liệu</th>
                    <th className="py-3.5 px-6 text-right">Học Phí</th>
                    <th className="py-3.5 px-6 text-right">Miễn Giảm</th>
                    <th className="py-3.5 px-6 text-right font-black">Phải Đóng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-700">
                  {loadingDetail ? (
                    <tr>
                      <td colSpan="8" className="py-14 text-center text-gray-400">
                        Đang tải danh sách học phần...
                      </td>
                    </tr>
                  ) : chiTietList.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-14 text-center text-gray-400">
                        Chưa có chi tiết học phần trong học kỳ này.
                      </td>
                    </tr>
                  ) : (
                    chiTietList.map((ct, idx) => (
                      <tr key={ct.id || idx} className="hover:bg-yellow-50/60 transition-colors">
                        <td className="py-4 px-4 text-center font-bold text-gray-500">{idx + 1}</td>
                        <td className="py-4 px-6 font-mono font-bold text-gray-900">{ct.ma_lop_hoc_phan}</td>
                        <td className="py-4 px-6 font-semibold text-gray-900">{ct.ten_mon_hoc}</td>
                        <td className="py-4 px-4 text-center font-extrabold text-gray-900">{ct.so_tin_chi}</td>
                        <td className="py-4 px-6 text-right text-gray-400 font-mono">0đ</td>
                        <td className="py-4 px-6 text-right font-mono font-semibold text-gray-800">{fmtMoney(ct.thanh_tien)}</td>
                        <td className="py-4 px-6 text-right text-gray-400 font-mono">0đ</td>
                        <td className="py-4 px-6 text-right font-mono font-black text-gray-900">{fmtMoney(ct.thanh_tien)}</td>
                      </tr>
                    ))
                  )}
                </tbody>

                {/* Dòng Tổng cộng bảng */}
                <tfoot className="bg-gray-50/90 font-bold border-t-2 border-gray-300 text-gray-900">
                  <tr>
                    <td colSpan="3" className="py-4 px-6 text-left font-black">
                      Tổng cộng ({tenDotHoacHocKy})
                    </td>
                    <td className="py-4 px-4 text-center font-black text-base">{totalSTC}</td>
                    <td className="py-4 px-6 text-right font-mono text-gray-400">0đ</td>
                    <td className="py-4 px-6 text-right font-mono font-bold">{fmtMoney(selectedTuition.so_tien)}</td>
                    <td className="py-4 px-6 text-right font-mono text-gray-400">0đ</td>
                    <td className="py-4 px-6 text-right font-mono font-black text-blue-700 text-lg">
                      {fmtMoney(selectedTuition.so_tien)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Khung thông tin tổng hợp thanh toán phía dưới bảng */}
            <div className="p-6 md:p-8 bg-gray-50/50 border-t border-gray-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-base">
                <span className="font-bold text-gray-700">
                  Tổng số tiền đã đóng ({tenDotHoacHocKy}):
                </span>
                <span className="font-black font-mono text-emerald-600 text-lg">
                  {isPaid ? fmtMoney(selectedTuition.so_tien) : '0đ'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-gray-200">
                <span className="font-black text-rose-600 text-lg">
                  Tổng số tiền còn phải đóng (tính đến {tenDotHoacHocKy}):
                </span>
                <span className="font-black font-mono text-rose-600 text-2xl">
                  {isPaid ? '0đ' : fmtMoney(selectedTuition.so_tien)}
                </span>
              </div>

              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 mt-2">
                <p className="text-xs sm:text-sm font-bold text-amber-800 leading-relaxed">
                  * Lưu ý: Đối với các học phần đăng ký online hoặc hủy học phần, học phí sẽ được hệ thống tính toán lại và cập nhật sau. Sinh viên vui lòng theo dõi thường xuyên bảng kê này.
                </p>
              </div>
            </div>
          </div>

          {/* PHẦN 2: DANH SÁCH TÀI KHOẢN & HƯỚNG DẪN CHUYỂN KHOẢN (ĐỒNG BỘ 4 THẺ TRẮNG, CHUẨN ẢNH) */}
          <div id="bank-transfer-section" className="space-y-6 pt-6">
            <div className="text-center space-y-1">
              <h3 className="text-xl md:text-2xl font-black text-[#1a1a1a] uppercase tracking-wide">
                Danh Sách Tài Khoản Thu Học Phí Trường Đại Học Nhất Tín
              </h3>
              <p className="text-gray-500 text-sm font-medium">
                Quý sinh viên có thể chuyển khoản đến số tài khoản chính hoặc quét mã VietQR tự động phía trên
              </p>
            </div>

            {/* Grid Thẻ Ngân Hàng - Đồng bộ 4 thẻ đều nền trắng sạch sẽ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {BANK_ACCOUNTS.map((bank, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-3xl border-2 p-5 flex flex-col justify-between transition-all ${
                    bank.isPrimary
                      ? 'border-[#F4BE2C] shadow-md ring-4 ring-[#F4BE2C]/15'
                      : 'border-gray-200 hover:border-gray-300 shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-black text-base text-gray-900">
                        {bank.bankName}
                      </span>
                      {bank.isPrimary && (
                        <span className="px-2.5 py-0.5 bg-[#F4BE2C] text-[#1a1a1a] text-[11px] font-black rounded-full uppercase">
                          CHÍNH
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-gray-500 mb-4">
                      {bank.branch}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
                    <p className="text-[11px] font-bold uppercase text-gray-400">
                      Số tài khoản
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono font-black text-base tracking-wide text-gray-900">
                        {bank.displayNumber}
                      </span>
                      <CopyButton text={bank.accountNumber} label="Copy" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 2 Cột Hướng Dẫn & Lưu Ý */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              {/* Cột Trái: Hướng dẫn đóng học phí */}
              <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm space-y-5">
                <h4 className="text-lg font-black text-[#1a1a1a] uppercase border-b border-gray-100 pb-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" /> Hướng Dẫn Đóng Học Phí Chuyển Khoản
                </h4>

                <ol className="space-y-4 text-sm text-gray-700 list-decimal list-inside font-medium">
                  <li>Chọn 1 trong các tài khoản ngân hàng của trường phía trên.</li>
                  <li>
                    Nhập chính xác số tiền cần đóng: <strong className="font-mono font-black text-gray-900 text-base">{fmtMoney(selectedTuition.so_tien)}</strong>.
                  </li>
                  <li>
                    Đơn vị thụ hưởng: <strong className="text-rose-600 font-bold uppercase">TRƯỜNG ĐẠI HỌC NHẤT TÍN</strong>.
                  </li>
                  {/* Cùng 1 hàng, không bị ngắt xuống dòng */}
                  <li>
                    <span className="font-bold text-gray-900">Nội dung đóng học phí bắt buộc ghi đúng:</span>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-rose-50/80 border border-rose-200 p-3.5 rounded-2xl mt-2">
                      <code className="font-mono font-black text-rose-600 text-sm md:text-base break-all">
                        {getTransferContent()}
                      </code>
                      <CopyButton text={getTransferContent()} label="Sao chép nội dung" />
                    </div>
                  </li>
                  <li>Xác nhận giao dịch & chụp lại chứng từ thành công để đối chiếu khi cần thiết.</li>
                </ol>
              </div>

              {/* Cột Phải: Lưu ý quan trọng */}
              <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm space-y-4">
                <h4 className="text-lg font-black text-[#1a1a1a] uppercase border-b border-gray-100 pb-3 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600" /> Lưu Ý Quan Trọng
                </h4>

                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-blue-950 font-bold">
                    ĐƠN VỊ THỤ HƯỞNG: TRƯỜNG ĐẠI HỌC NHẤT TÍN.
                  </p>
                </div>

                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-rose-900 font-semibold leading-relaxed">
                    Trường hợp sinh viên ghi sai hoặc thiếu <strong className="font-extrabold text-rose-700">MÃ SỐ SINH VIÊN</strong> → hệ thống sẽ không thể tự động gán học phí, sinh viên vẫn bị hiển thị nợ học phí.
                  </p>
                </div>

                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-rose-900 font-semibold leading-relaxed">
                    Không nộp học phí tại máy ATM vì giao dịch ATM không có dòng nội dung ghi thông tin sinh viên, học phí sẽ không thể cập nhật.
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-amber-950 font-semibold leading-relaxed">
                    Giấy nộp tiền / Ủy nhiệm chi / Màn hình giao dịch thành công từ ngân hàng có giá trị pháp lý tương đương <strong className="font-bold">PHIẾU THU HỌC PHÍ</strong>. Vui lòng lưu giữ cẩn thận.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentTuition;