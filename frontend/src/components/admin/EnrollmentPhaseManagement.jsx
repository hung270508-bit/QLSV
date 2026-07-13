import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import API_URL from '../../api';
import { CalendarDays, Plus, Trash2, Pencil, CheckCircle2, AlertCircle, X, Clock } from 'lucide-react';

// Chỉ cho phép chữ (có dấu tiếng Việt), số, khoảng trắng và một số ký tự thông dụng: - _ ( ) , .
const TEN_DOT_ALLOWED_REGEX = /^[\p{L}\p{N}\s\-_(),.]*$/u;
const TEN_DOT_INVALID_CHARS_REGEX = /[^\p{L}\p{N}\s\-_(),.]/gu;

function EnrollmentPhaseManagement() {
  const [phases, setPhases] = useState([]);
  const [courseSections, setCourseSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPhase, setEditingPhase] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState([]);
  const [tenDotError, setTenDotError] = useState('');
  const [toast, setToast] = useState(null); // { message: string, type: 'warning' | 'success' | 'error' }
  const [confirmDialog, setConfirmDialog] = useState(null); // { title, message, confirmLabel, variant, onConfirm }
  const [now, setNow] = useState(() => new Date()); // dùng để đếm ngược thời gian đóng đợt đang mở
  const [form, setForm] = useState({
    TenDot: '',
    MoTa: '',
    HocKy: '',
    NamHoc: '',
    NienKhoa: '',
    NgayMo: '',
    NgayDong: ''
  });

  const showToast = (message, type = 'warning') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchPhases = async () => {
    try {
      setLoading(true);
      const phasesRes = await axios.get(`${API_URL}/api/enrollment/phases`);
      setPhases(phasesRes.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseSections = async () => {
    try {
      const sectionsRes = await axios.get(`${API_URL}/api/course-sections`);
      setCourseSections(sectionsRes.data || []);
    } catch (error) {
      console.error('Lỗi lấy danh sách học phần:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const studentsRes = await axios.get(`${API_URL}/api/students`);
      setStudents(studentsRes.data || []);
    } catch (error) {
      console.error('Lỗi lấy danh sách sinh viên:', error);
    }
  };

  const courseYearOptions = useMemo(() => {
    const years = Array.from(new Set(courseSections.map((cs) => cs.NamHoc).filter(Boolean)));
    return years.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  }, [courseSections]);

  // Học kỳ chỉ được lấy từ dữ liệu các lớp học phần đã có, không cho nhập tay
  const hocKyOptions = useMemo(() => {
    const values = Array.from(new Set(courseSections.map((cs) => cs.HocKy).filter(Boolean)));
    return values.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [courseSections]);

  const nienKhoaOptions = useMemo(() => {
    const values = Array.from(new Set(students.map((sv) => sv.NienKhoa).filter(Boolean)));
    return values.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  }, [students]);

  useEffect(() => {
    if (!editingPhase && !form.NamHoc && courseYearOptions.length > 0) {
      setForm((prev) => ({ ...prev, NamHoc: courseYearOptions[0] }));
    }
  }, [courseYearOptions, editingPhase, form.NamHoc]);

  useEffect(() => {
    if (!editingPhase && !form.NienKhoa && nienKhoaOptions.length > 0) {
      setForm((prev) => ({ ...prev, NienKhoa: nienKhoaOptions[0] }));
    }
  }, [nienKhoaOptions, editingPhase, form.NienKhoa]);

  useEffect(() => {
    if (!editingPhase && !form.HocKy && hocKyOptions.length > 0) {
      setForm((prev) => ({ ...prev, HocKy: hocKyOptions[0] }));
    }
  }, [hocKyOptions, editingPhase, form.HocKy]);

  useEffect(() => { fetchPhases(); fetchCourseSections(); fetchStudents(); }, []);

  // Cập nhật mốc thời gian hiện tại mỗi phút để đồng hồ đếm ngược luôn chính xác
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Tìm đợt đang mở (còn hạn) thuộc học kỳ khác với học kỳ đang thao tác (dùng để chặn mở song song nhiều học kỳ)
  const findConflictingOpenPhase = (hocKy, excludeId) => {
    if (!hocKy) return null;
    const now = new Date();
    return (
      phases.find((p) => {
        if (excludeId && p.MaDot === excludeId) return false;
        if (p.TrangThai !== 'Mo') return false;
        if (!p.HocKy || p.HocKy === hocKy) return false;
        if (p.NgayDong && new Date(p.NgayDong) <= now) return false; // đã hết hạn thì không tính là đang mở
        return true;
      }) || null
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Ràng buộc ký tự đặc biệt cho tên đợt
    if (!TEN_DOT_ALLOWED_REGEX.test(form.TenDot)) {
      setTenDotError('Tên đợt chứa ký tự không hợp lệ. Chỉ cho phép chữ, số, khoảng trắng và - _ ( ) , .');
      return;
    }
    setTenDotError('');

    // Chỉ cho phép mở đăng ký của 1 học kỳ duy nhất tại một thời điểm.
    // Đợt đang chỉnh sửa (nếu có) sẽ giữ trạng thái hiện tại; nếu đợt đó đang mở
    // hoặc đợt mới sẽ được tạo (mặc định mở), thì kiểm tra xung đột học kỳ.
    const willBeOpen = editingPhase ? editingPhase.TrangThai === 'Mo' : true;
    if (willBeOpen) {
      const conflictPhase = findConflictingOpenPhase(form.HocKy, editingPhase?.MaDot);
      if (conflictPhase) {
        showToast(
          `Học kỳ "${conflictPhase.HocKy}" đang có đợt đăng ký mở ("${conflictPhase.TenDot}"). ` +
          `Chỉ được mở đăng ký cho 1 học kỳ duy nhất — vui lòng đóng đợt của học kỳ "${conflictPhase.HocKy}" ` +
          `hoặc chờ đến khi đợt đó hết hạn (${conflictPhase.NgayDong ? new Date(conflictPhase.NgayDong).toLocaleString('vi-VN') : '—'}) trước khi mở đợt cho học kỳ "${form.HocKy}".`,
          'warning'
        );
        return;
      }
    }

    // Mọi điều kiện hợp lệ -> mở popup xác nhận trước khi thực sự lưu
    setConfirmDialog({
      title: editingPhase ? 'Xác nhận cập nhật đợt đăng ký' : 'Xác nhận tạo đợt đăng ký',
      message: editingPhase
        ? `Bạn có chắc muốn lưu thay đổi cho đợt "${form.TenDot}" không?`
        : `Bạn có chắc muốn tạo đợt đăng ký "${form.TenDot}" không?`,
      confirmLabel: 'Lưu',
      variant: 'primary',
      onConfirm: performSave
    });
  };

  const performSave = async () => {
    try {
      if (editingPhase) {
        await axios.put(`${API_URL}/api/enrollment/phases/${editingPhase.MaDot}`, {
          ...form,
          TrangThai: editingPhase.TrangThai || 'Mo'
        });
      } else {
        await axios.post(`${API_URL}/api/enrollment/phases`, form);
      }
      showToast('Lưu đợt đăng ký thành công!', 'success');
      resetForm();
      fetchPhases();
    } catch (error) {
      showToast(error.response?.data?.message || 'Không thể lưu đợt đăng ký', 'error');
    } finally {
      setConfirmDialog(null);
    }
  };

  const closePhase = async (id) => {
    try {
      await axios.post(`${API_URL}/api/enrollment/phases/${id}/close`);
      showToast('Đã đóng đợt đăng ký.', 'success');
      fetchPhases();
    } catch (error) {
      showToast('Không thể đóng đợt đăng ký', 'error');
    }
  };

  const openPhase = async (id) => {
    const phase = phases.find((item) => item.MaDot === id);
    if (!phase) return;

    try {
      await axios.put(`${API_URL}/api/enrollment/phases/${id}`, {
        TenDot: phase.TenDot,
        MoTa: phase.MoTa,
        HocKy: phase.HocKy,
        NamHoc: phase.NamHoc,
        NienKhoa: phase.NienKhoa,
        NgayMo: phase.NgayMo,
        NgayDong: phase.NgayDong,
        TrangThai: 'Mo'
      });
      showToast('Đã mở lại đợt đăng ký.', 'success');
      fetchPhases();
    } catch (error) {
      showToast('Không thể mở lại đợt đăng ký', 'error');
    }
  };

  const requestDeletePhase = (phase) => {
    setConfirmDialog({
      title: 'Xóa đợt đăng ký',
      message: `Bạn có chắc muốn xóa đợt "${phase.TenDot}" không? Hành động này không thể hoàn tác.`,
      confirmLabel: 'Xóa',
      variant: 'danger',
      onConfirm: () => performDeletePhase(phase.MaDot)
    });
  };

  const performDeletePhase = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/enrollment/phases/${id}`);
      showToast('Đã xóa đợt đăng ký thành công!', 'success');
      fetchPhases();
    } catch (error) {
      showToast(`Không thể xóa đợt đăng ký: ${error.response?.data?.message || 'Lỗi không xác định'}`, 'error');
    } finally {
      setConfirmDialog(null);
    }
  };
  const resetForm = () => {
    setEditingPhase(null);
    setTenDotError('');
    setForm({ TenDot: '', MoTa: '', HocKy: '', NamHoc: '', NienKhoa: '', NgayMo: '', NgayDong: '' });
  };

  const handleEditPhase = (phase) => {
    setEditingPhase(phase);
    setTenDotError('');
    setForm({
      TenDot: phase.TenDot || '',
      MoTa: phase.MoTa || '',
      HocKy: phase.HocKy || '',
      NamHoc: phase.NamHoc || '',
      NienKhoa: phase.NienKhoa || '',
      NgayMo: phase.NgayMo ? phase.NgayMo.slice(0, 16) : '',
      NgayDong: phase.NgayDong ? phase.NgayDong.slice(0, 16) : ''
    });
  };

  const phaseSummary = useMemo(() => {
    const openCount = phases.filter((p) => p.TrangThai === 'Mo').length;
    const closedCount = phases.filter((p) => p.TrangThai === 'Đóng').length;

    return {
      total: phases.length,
      open: openCount,
      closed: closedCount
    };
  }, [phases]);

  // Đếm ngược đến thời điểm đóng của đợt đang mở gần đóng nhất (cập nhật theo `now`)
  const closingCountdown = useMemo(() => {
    const upcomingCloses = phases.filter(
      (p) => p.TrangThai === 'Mo' && p.NgayDong && new Date(p.NgayDong) > now
    );
    const nextClose = upcomingCloses.sort((a, b) => new Date(a.NgayDong) - new Date(b.NgayDong))[0];
    if (!nextClose) return null;

    const diffMs = new Date(nextClose.NgayDong) - now;
    const totalMinutes = Math.max(0, Math.floor(diffMs / 60000));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    let text;
    if (days > 0) text = `${days} ngày ${hours} giờ`;
    else if (hours > 0) text = `${hours} giờ ${minutes} phút`;
    else text = `${minutes} phút`;

    return { phase: nextClose, text };
  }, [phases, now]);

  // Sắp xếp các đợt theo ngày mở để hiển thị dạng dòng thời gian (timeline)
  const timelinePhases = useMemo(() => {
    const now = new Date();
    return [...phases]
      .sort((a, b) => new Date(a.NgayMo) - new Date(b.NgayMo))
      .map((phase) => {
        const start = phase.NgayMo ? new Date(phase.NgayMo) : null;
        const end = phase.NgayDong ? new Date(phase.NgayDong) : null;
        let timelineStatus = 'closed'; // closed | ongoing | upcoming
        if (phase.TrangThai === 'Mo' && start && end && start <= now && now <= end) {
          timelineStatus = 'ongoing';
        } else if (start && start > now) {
          timelineStatus = 'upcoming';
        }
        return { ...phase, timelineStatus };
      });
  }, [phases]);

  const filteredPhases = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return phases.filter((phase) => {
      if (filterStatus !== 'all' && phase.TrangThai !== filterStatus) {
        return false;
      }
      if (!term) return true;
      return [phase.TenDot, phase.HocKy, phase.NamHoc, phase.NienKhoa]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(term));
    });
  }, [phases, filterStatus, searchTerm]);

  const toastStyles = {
    warning: { border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-800', icon: 'text-amber-600' },
    success: { border: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-800', icon: 'text-emerald-600' },
    error: { border: 'border-red-200', bg: 'bg-red-50', text: 'text-red-800', icon: 'text-red-600' }
  };

  return (
    <div className="space-y-6">
      {toast && (() => {
        const style = toastStyles[toast.type] || toastStyles.warning;
        return (
          <div className="fixed top-4 right-4 z-50 w-full max-w-sm animate-in fade-in slide-in-from-top-2">
            <div className={`flex items-start gap-3 rounded-2xl border ${style.border} ${style.bg} p-4 shadow-lg`}>
              {toast.type === 'success' ? (
                <CheckCircle2 className={`w-5 h-5 mt-0.5 flex-shrink-0 ${style.icon}`} />
              ) : (
                <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${style.icon}`} />
              )}
              <div className={`flex-1 text-sm ${style.text}`}>{toast.message}</div>
              <button
                type="button"
                onClick={() => setToast(null)}
                className={`${style.icon} hover:opacity-70`}
                aria-label="Đóng thông báo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })()}

      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-800">{confirmDialog.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{confirmDialog.message}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${
                  confirmDialog.variant === 'danger'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-[#152238] hover:bg-[#0f1a2b]'
                }`}
              >
                {confirmDialog.confirmLabel || 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#F4C542] rounded-2xl p-6 text-[#152238] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-white/50"><CalendarDays className="w-6 h-6" /></div>
          <div>
            <h2 className="text-xl font-black">Quản lý đợt đăng ký học phần</h2>
            <p className="text-sm font-medium text-[#152238]/70">Thiết lập thời gian mở/đóng theo từng khóa, năm học và theo từng đợt đăng ký.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200">
          <p className="text-sm font-semibold text-slate-500">Tổng số đợt</p>
          <p className="text-3xl font-black text-[#152238]">{phaseSummary.total}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200">
          <p className="text-sm font-semibold text-slate-500">Đợt đang mở</p>
          <p className="text-3xl font-black text-[#16a34a]">{phaseSummary.open}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200">
          <p className="text-sm font-semibold text-slate-500">Đợt đã đóng</p>
          <p className="text-3xl font-black text-[#475569]">{phaseSummary.closed}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 col-span-1 md:col-span-3">
          <p className="text-sm font-semibold text-slate-500 flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> Đếm ngược đợt đang mở
          </p>
          {closingCountdown ? (
            <>
              <p className="text-2xl font-black text-[#152238]">Còn {closingCountdown.text}</p>
              <p className="mt-1 text-sm text-slate-500">
                Đợt "{closingCountdown.phase.TenDot}" ({closingCountdown.phase.HocKy || '—'}) sẽ đóng lúc{' '}
                {new Date(closingCountdown.phase.NgayDong).toLocaleString('vi-VN')}
              </p>
            </>
          ) : (
            <p className="text-2xl font-black text-[#152238]">Không có đợt đang mở</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 bg-white rounded-2xl p-5 border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-[#F4C542]" /> {editingPhase ? 'Chỉnh sửa đợt' : 'Tạo đợt mới'}</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <input
                className={`w-full rounded-xl border px-3 py-2 ${tenDotError ? 'border-red-400' : 'border-slate-200'}`}
                placeholder="Tên đợt"
                value={form.TenDot}
                maxLength={100}
                onChange={(e) => {
                  const raw = e.target.value;
                  // Lọc ngay các ký tự đặc biệt không cho phép khi gõ
                  const filtered = raw.replace(TEN_DOT_INVALID_CHARS_REGEX, '');
                  setForm({ ...form, TenDot: filtered });
                  setTenDotError(
                    raw !== filtered
                      ? 'Đã tự động loại bỏ ký tự đặc biệt không hợp lệ trong tên đợt.'
                      : ''
                  );
                }}
                required
              />
              {tenDotError ? (
                <p className="mt-1 text-xs text-red-500">{tenDotError}</p>
              ) : (
                <p className="mt-1 text-xs text-slate-400">Chỉ cho phép chữ, số, khoảng trắng và - _ ( ) , .</p>
              )}
            </div>
            <textarea className="w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="Mô tả" value={form.MoTa} onChange={(e) => setForm({ ...form, MoTa: e.target.value })} rows={3} />
            {hocKyOptions.length > 0 ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Học kỳ</label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
                  value={form.HocKy}
                  onChange={(e) => {
                    const newHocKy = e.target.value;
                    setForm({ ...form, HocKy: newHocKy });
                    const conflictPhase = findConflictingOpenPhase(newHocKy, editingPhase?.MaDot);
                    if (conflictPhase) {
                      showToast(
                        `Đang có đợt đăng ký mở cho học kỳ "${conflictPhase.HocKy}" ("${conflictPhase.TenDot}"). ` +
                        `Không thể mở song song đợt cho học kỳ "${newHocKy}" cho đến khi đợt đó đóng/hết hạn.`
                      );
                    }
                  }}
                  required
                >
                  <option value="" disabled>Chọn học kỳ từ dữ liệu lớp học phần</option>
                  {hocKyOptions.map((hk) => (
                    <option key={hk} value={hk}>{hk}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">Học kỳ được lấy tự động từ dữ liệu các lớp học phần, không thể nhập tay.</p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Học kỳ</label>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 text-slate-400"
                  placeholder="Chưa có dữ liệu học kỳ từ lớp học phần"
                  value=""
                  readOnly
                  disabled
                />
                <p className="mt-1 text-xs text-slate-500">Cần có dữ liệu lớp học phần trước khi tạo đợt đăng ký.</p>
              </div>
            )}
            {courseYearOptions.length > 0 ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Năm học</label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
                  value={form.NamHoc}
                  onChange={(e) => setForm({ ...form, NamHoc: e.target.value })}
                  required
                >
                  <option value="" disabled>Chọn năm học từ học phần</option>
                  {courseYearOptions.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Năm học</label>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  placeholder="Không có học phần để chọn"
                  value={form.NamHoc}
                  onChange={(e) => setForm({ ...form, NamHoc: e.target.value })}
                />
                <p className="mt-1 text-xs text-slate-500">Năm học sẽ hiển thị từ dữ liệu học phần.</p>
              </div>
            )}
            {nienKhoaOptions.length > 0 ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Niên khóa</label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
                  value={form.NienKhoa}
                  onChange={(e) => setForm({ ...form, NienKhoa: e.target.value })}
                  required
                >
                  <option value="" disabled>Chọn niên khóa theo sinh viên</option>
                  {nienKhoaOptions.map((nienKhoa) => (
                    <option key={nienKhoa} value={nienKhoa}>{nienKhoa}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Niên khóa</label>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  placeholder="Không có sinh viên để chọn niên khóa"
                  value={form.NienKhoa}
                  onChange={(e) => setForm({ ...form, NienKhoa: e.target.value })}
                />
                <p className="mt-1 text-xs text-slate-500">Niên khóa sẽ hiển thị từ dữ liệu sinh viên.</p>
              </div>
            )}
            <label className="block text-sm font-medium text-slate-700">Ngày mở</label>
            <input type="datetime-local" className="w-full rounded-xl border border-slate-200 px-3 py-2" value={form.NgayMo} onChange={(e) => setForm({ ...form, NgayMo: e.target.value })} required />
            <label className="block text-sm font-medium text-slate-700">Ngày đóng</label>
            <input type="datetime-local" className="w-full rounded-xl border border-slate-200 px-3 py-2" value={form.NgayDong} onChange={(e) => setForm({ ...form, NgayDong: e.target.value })} required />
            <div className="flex gap-3">
              <button type="submit" className="flex-1 rounded-xl bg-[#152238] text-white py-2.5 font-semibold">Lưu</button>
              {editingPhase && <button type="button" onClick={resetForm} className="flex-1 rounded-xl border border-slate-300 text-slate-700 py-2.5 font-semibold">Hủy</button>}
            </div>
          </form>
        </div>

        <div className="xl:col-span-2 bg-white rounded-2xl p-5 border border-slate-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800">Danh sách đợt đăng ký</h3>
              <p className="text-sm text-slate-500">Xem, tìm kiếm và quản lý các đợt đăng ký của trường.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                className="w-full sm:w-72 rounded-xl border border-slate-200 px-3 py-2"
                placeholder="Tìm theo tên, học kỳ, niên khóa"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className="w-full sm:w-52 rounded-xl border border-slate-200 bg-white px-3 py-2"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="Mo">Đang mở</option>
                <option value="Đóng">Đã đóng</option>
              </select>
            </div>
          </div>

          {loading ? <p className="text-sm text-slate-500">Đang tải...</p> : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-slate-600">
                    <th className="px-4 py-3">Tên đợt</th>
                    <th className="px-4 py-3">Học kỳ / Năm học / Niên khóa</th>
                    <th className="px-4 py-3">Thời gian</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPhases.map((phase) => (
                    <tr key={phase.MaDot}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{phase.TenDot}</div>
                        <div className="text-slate-500">{phase.MoTa || 'Không có mô tả'}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-slate-600">
                        {phase.HocKy || '—'} / {phase.NamHoc || '—'} / {phase.NienKhoa || '—'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-slate-600">
                        {new Date(phase.NgayMo).toLocaleString('vi-VN')}<br />
                        <span className="text-slate-400">→ {new Date(phase.NgayDong).toLocaleString('vi-VN')}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {phase.TrangThai === 'Mo' ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Đang mở</span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">Đã đóng</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <div className="inline-flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditPhase(phase)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 hover:bg-slate-50"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {phase.TrangThai === 'Mo' ? (
                            <button
                              type="button"
                              onClick={() => closePhase(phase.MaDot)}
                              className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700 hover:bg-amber-100"
                            >Đóng</button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openPhase(phase.MaDot)}
                              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 hover:bg-slate-100"
                            >Mở lại</button>
                          )}
                          <button
                            type="button"
                            onClick={() => requestDeletePhase(phase)}
                            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-600 hover:bg-red-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPhases.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-slate-500">Không tìm thấy đợt đăng ký phù hợp.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200">
        <div className="mb-4">
          <h3 className="font-bold text-slate-800">Dòng thời gian đợt đăng ký</h3>
          <p className="text-sm text-slate-500">Các đợt được sắp xếp theo thời gian mở, giúp theo dõi đợt nào đang diễn ra, sắp mở hay đã kết thúc.</p>
        </div>

        {timelinePhases.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có đợt đăng ký nào để hiển thị.</p>
        ) : (
          <ol className="relative border-s-2 border-slate-200 ms-3">
            {timelinePhases.map((phase, index) => {
              const dotStyles = {
                ongoing: 'bg-emerald-500 ring-emerald-100',
                upcoming: 'bg-amber-400 ring-amber-100',
                closed: 'bg-slate-300 ring-slate-100'
              };
              const badge = {
                ongoing: { label: 'Đang diễn ra', className: 'bg-emerald-50 text-emerald-700' },
                upcoming: { label: 'Sắp mở', className: 'bg-amber-50 text-amber-700' },
                closed: { label: phase.TrangThai === 'Mo' ? 'Đã hết hạn' : 'Đã đóng', className: 'bg-slate-100 text-slate-600' }
              }[phase.timelineStatus];

              return (
                <li key={phase.MaDot} className={`ms-6 ${index === timelinePhases.length - 1 ? '' : 'pb-6'}`}>
                  <span
                    className={`absolute -start-[9px] flex h-4 w-4 items-center justify-center rounded-full ring-4 ${dotStyles[phase.timelineStatus]}`}
                  />
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900">{phase.TenDot}</p>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {phase.HocKy || '—'} / {phase.NamHoc || '—'} / {phase.NienKhoa || '—'}
                    </p>
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      {phase.NgayMo ? new Date(phase.NgayMo).toLocaleString('vi-VN') : '—'}
                      <span className="text-slate-400">→</span>
                      {phase.NgayDong ? new Date(phase.NgayDong).toLocaleString('vi-VN') : '—'}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}

export default EnrollmentPhaseManagement;