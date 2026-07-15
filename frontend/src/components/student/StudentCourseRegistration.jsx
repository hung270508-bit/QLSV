import { useState, useEffect, useMemo, useCallback } from 'react';
import { BookPlus, Plus, Trash2, CheckCircle2, MapPin, CalendarDays, AlertCircle, Save, XCircle, Wallet, Search, Hourglass, Users, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import API_URL from '../../api';
import { Toast, ConfirmDialog } from '../common/ModalPortal';
import { StudentCourseRegistrationSkeleton } from '../common/StudentSkeleton';

function StudentCourseRegistration({ user }) {
  const [availableCourses, setAvailableCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [phases, setPhases] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterThu, setFilterThu] = useState('all');
  const [hideFull, setHideFull] = useState(false);

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, title: '', message: '', action: null });
  const [now, setNow] = useState(() => new Date());

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [availRes, myRes, phaseRes] = await Promise.all([
        axios.get(`${API_URL}/api/enrollment/available/${user?.username}`),
        axios.get(`${API_URL}/api/enrollment/my-courses/${user?.username}`),
        axios.get(`${API_URL}/api/enrollment/phases`)
      ]);
      setAvailableCourses(availRes.data || []);
      setMyCourses(myRes.data || []);
      setPhases(phaseRes.data || []);
    } catch (e) {
      console.error(e);
      showToast('Lỗi tải dữ liệu. Vui lòng refresh lại trang!', 'error');
    } finally { setLoading(false); }
  }, [user?.username]);

  useEffect(() => {
    if (user?.username) fetchData();
  }, [fetchData, user?.username]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const activePhase = useMemo(() => {
    return phases.find(p => p.TrangThai === 'Mo' && p.NgayTao && new Date(p.NgayTao) <= now && (!p.NgayDong || new Date(p.NgayDong) > now)) || null;
  }, [phases, now]);

  function diffText(ms) {
    const totalMin = Math.max(0, Math.floor(ms / 60000));
    const days = Math.floor(totalMin / 1440);
    const hours = Math.floor((totalMin % 1440) / 60);
    const mins = totalMin % 60;
    if (days > 0) return `${days} ngày ${hours} giờ`;
    if (hours > 0) return `${hours} giờ ${mins} phút`;
    return `${mins} phút`;
  }

  let countdownText = null;
  if (activePhase && activePhase.NgayDong) {
    const end = new Date(activePhase.NgayDong);
    if (end > now) {
      countdownText = diffText(end - now);
    }
  }

  const checkClash = (newCourse) => {
    const activeEnrolled = myCourses.filter(c => c.TrangThai !== 'Đã hủy' && c.TrangThai !== 'Từ chối');
    const allChecking = [...cart, ...activeEnrolled];

    for (const c of allChecking) {
      if (c.Thu === newCourse.Thu && c.Thu) {
        const getRange = (ca) => {
          if (!ca) return null;
          const match = String(ca).match(/(\d+)\s*-\s*(\d+)/);
          if (match) return [parseInt(match[1]), parseInt(match[2])];
          const caStr = String(ca).replace(/\D/g, '');
          if (caStr === '1') return [1, 3];
          if (caStr === '2') return [4, 6];
          if (caStr === '3') return [7, 9];
          if (caStr === '4') return [10, 12];
          return null;
        };
        const r1 = getRange(c.CaHoc);
        const r2 = getRange(newCourse.CaHoc);
        if (r1 && r2) {
          if (r1[0] <= r2[1] && r1[1] >= r2[0]) {
            return `Trùng lịch với môn ${c.TenMonHoc} (Thứ ${formatThu(c.Thu)}, Tiết ${c.CaHoc})`;
          }
        }
      }
    }
    return null;
  };

  const handleAddToCart = (course) => {
    // 1. Kiểm tra giới hạn tín chỉ (23 tín)
    const activeEnrolled = myCourses.filter(c => c.TrangThai !== 'Đã hủy' && c.TrangThai !== 'Từ chối');
    const currentActiveCredits = [...cart, ...activeEnrolled].reduce((acc, c) => acc + (parseInt(c.SoTinChi) || 0), 0);
    const newTotalCredits = currentActiveCredits + parseInt(course.SoTinChi || 0, 10);
    if (newTotalCredits > 23) {
      return showToast(`Vượt giới hạn 23 tín chỉ! Không thể chọn thêm môn ${course.TenMonHoc}.`, "error");
    }

    // 2. Kiểm tra trùng môn trong giỏ
    if (cart.find(c => c.MaMonHoc === course.MaMonHoc)) {
      return showToast(`Môn ${course.TenMonHoc} đã có trong danh sách tạm!`, "error");
    }

    // 3. Kiểm tra đã đăng ký
    if (activeEnrolled.find(c => c.MaMonHoc === course.MaMonHoc)) {
      return showToast(`Bạn đã đăng ký môn ${course.TenMonHoc} rồi!`, "error");
    }

    // 4. Kiểm tra trùng lịch
    const clashMsg = checkClash(course);
    if (clashMsg) {
      return showToast(clashMsg, "error");
    }

    setCart([...cart, course]);
    showToast(`Đã thêm môn ${course.TenMonHoc} vào danh sách tạm`, "success");
  };

  const handleRemoveFromCart = (maLHP) => {
    setCart(cart.filter(c => c.MaLopHocPhan !== maLHP));
  };

  const handleRemoveSaved = (course) => {
    setConfirmDialog({
      show: true,
      title: 'Xóa học phần đã đăng ký',
      message: `Bạn có chắc muốn xóa lớp học phần ${course.MaLopHocPhan} - ${course.TenMonHoc} khỏi danh sách đã đăng ký?`,
      action: async () => {
        try {
          await axios.delete(`${API_URL}/api/enrollment/${user.username}/${course.MaLopHocPhan}`);
          showToast('Đã xóa học phần khỏi danh sách đăng ký!', 'success');
          fetchData();
          setConfirmDialog({ show: false });
        } catch (error) {
          showToast(error.response?.data?.message || 'Không thể xóa học phần này!', 'error');
          setConfirmDialog({ show: false });
        }
      }
    });
  };

  const handleFinalize = () => {
    if (cart.length === 0) return showToast("Tiến trình đang trống!", "error");

    setConfirmDialog({
      show: true,
      title: 'Xác nhận Đăng ký',
      message: `Hệ thống sẽ lưu tạm ${cart.length} môn học này. Vui lòng đóng học phí để hoàn tất đăng ký chính thức.`,
      action: async () => {
        try {
          const res = await axios.post(`${API_URL}/api/enrollment/batch`, {
            MSSV: user.username,
            cart: cart.map(c => ({
              ...c,
              HocKy: activePhase ? activePhase.HocKy : (c.HocKy || '')
            }))
          });

          showToast(res.data.message || "Gửi yêu cầu đăng ký thành công!", "success");
          setCart([]);
          fetchData();
          setConfirmDialog({ show: false });
        } catch (error) {
          showToast(error.response?.data?.message || "Có lỗi xảy ra khi lưu đăng ký!", "error");
          setConfirmDialog({ show: false });
        }
      }
    });
  };

  const filteredCourses = useMemo(() => {
    return availableCourses.filter(c => {
      if (hideFull && c.DaDangKy >= (c.SoLuongToiDa || 40)) return false;
      if (filterThu !== 'all' && String(c.Thu) !== String(filterThu)) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return c.TenMonHoc?.toLowerCase().includes(term) || c.MaLopHocPhan?.toLowerCase().includes(term);
      }
      return true;
    });
  }, [availableCourses, searchTerm, filterThu, hideFull]);

  const displayList = [
    ...cart.map(c => ({ ...c, isLocal: true, TrangThai: 'Tạm lưu' })),
    ...myCourses.map(c => ({ ...c, isLocal: false }))
  ];

  const activeDisplayList = displayList.filter(c => c.TrangThai !== 'Đã hủy' && c.TrangThai !== 'Từ chối');
  const totalCredits = activeDisplayList.reduce((acc, c) => acc + (parseInt(c.SoTinChi) || 0), 0);

  const formatThu = (thu) => {
    if (thu === null || thu === undefined || thu === '') return '—';
    const val = String(thu).trim().toUpperCase();
    if (val === 'CN' || val === '1') return 'Chủ nhật';
    const num = parseInt(val, 10);
    if (!Number.isNaN(num) && num >= 2 && num <= 7) return `Thứ ${num}`;
    return val;
  };

  // formatDate removed as it is unused

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Thành công':
      case 'Đã đăng ký':
        return <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5" /> {status}</span>;
      case 'Chờ đóng tiền':
      case 'Tạm lưu':
      case 'Đã lưu':
        return <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold border border-amber-200"><Wallet className="w-3.5 h-3.5" /> {status}</span>;
      case 'Đã hủy':
      case 'Từ chối':
        return <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold border border-red-200"><XCircle className="w-3.5 h-3.5" /> {status}</span>;
      default:
        return <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold border border-slate-200">{status}</span>;
    }
  };

  if (loading) return <StudentCourseRegistrationSkeleton />;

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 relative pb-12 px-4 xl:px-8">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: '', type: 'success' })} />
      <ConfirmDialog show={confirmDialog.show} title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.action} onCancel={() => setConfirmDialog({ show: false, title: '', message: '', action: null })} />

      {/* Header Banner - Premium Glassmorphism */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[2.5rem] bg-[#152238] p-8 md:p-10 text-white shadow-2xl">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_100%_0%,#F4C542_0%,transparent_50%)]" />
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_0%_100%,#ffffff_0%,transparent_50%)]" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="p-4 md:p-5 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
              <GraduationCap className="w-10 h-10 md:w-12 md:h-12 text-[#F4C542]" />
            </div>
            <div>
              <h2 className="text-3xl md:text-5xl font-black mb-2 tracking-tight">Đăng ký học phần</h2>
              <div className="flex items-center gap-3">
                <p className="text-white/80 font-medium text-sm md:text-lg">
                  {activePhase ? `Thuộc: ${activePhase.TenDot} (${activePhase.HocKy || ''})` : 'Hệ thống Đăng ký Tín chỉ'}
                </p>
              </div>
            </div>
          </div>

          {countdownText && (
            <div className="flex items-center gap-4 bg-white/10 border border-white/20 px-6 py-4 rounded-3xl backdrop-blur-md self-start lg:self-auto shadow-inner">
              <div className="p-2.5 bg-[#F4C542]/20 rounded-2xl">
                <Hourglass className="w-6 h-6 text-[#F4C542] animate-pulse" />
              </div>
              <div>
                <p className="text-xs text-white/70 font-semibold uppercase tracking-wider mb-0.5">Thời gian còn lại</p>
                <p className="text-xl md:text-2xl font-black text-[#F4C542] leading-none tracking-tight">{countdownText}</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Main Two-Column Layout */}
      <div className="flex flex-col xl:flex-row gap-8 items-start">

        {/* Left Column: Available Courses List */}
        <div className="flex-1 w-full flex flex-col gap-6">
          {activePhase ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/60 backdrop-blur-xl p-4 rounded-3xl border border-slate-200/60 shadow-sm sticky top-0 z-20">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm môn học, mã LHP..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6] font-medium shadow-sm transition-all"
                />
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={filterThu}
                  onChange={e => setFilterThu(e.target.value)}
                  className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 text-slate-700 font-semibold shadow-sm cursor-pointer"
                >
                  <option value="all">Tất cả thứ</option>
                  <option value="2">Thứ 2</option>
                  <option value="3">Thứ 3</option>
                  <option value="4">Thứ 4</option>
                  <option value="5">Thứ 5</option>
                  <option value="6">Thứ 6</option>
                  <option value="7">Thứ 7</option>
                  <option value="CN">Chủ nhật</option>
                </select>
                <label className="flex items-center gap-2 text-sm text-slate-700 font-bold cursor-pointer bg-white border border-slate-200 px-4 py-3 rounded-2xl shadow-sm hover:bg-slate-50 transition-colors select-none">
                  <input type="checkbox" checked={hideFull} onChange={e => setHideFull(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-[#152238] focus:ring-[#152238]" />
                  Ẩn lớp đầy
                </label>
              </div>
            </div>
          </div>

          {/* Modern Card List for Courses */}
          <div className="space-y-4">
            <AnimatePresence>
              {filteredCourses.map((c, i) => {
                const isFull = c.DaDangKy >= (c.SoLuongToiDa || 40);
                const isInCart = cart.some(cartItem => cartItem.MaLopHocPhan === c.MaLopHocPhan);
                const isEnrolled = myCourses.some(en => en.MaLopHocPhan === c.MaLopHocPhan && en.TrangThai !== 'Đã hủy');
                const noSchedule = !c.NgayBatDau;
                const disabled = isFull || isInCart || isEnrolled || noSchedule;

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i > 10 ? 0 : i * 0.03 }}
                    key={c.MaLopHocPhan}
                    className={`bg-white rounded-3xl p-5 md:p-6 shadow-sm border ${disabled ? 'border-slate-100 opacity-75' : 'border-slate-200 hover:border-blue-300 hover:shadow-md'} transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 group`}
                  >
                    {/* Left: Info */}
                    <div className="flex items-start md:items-center gap-5 md:gap-6 flex-1">
                      <div className={`w-14 h-14 shrink-0 rounded-2xl flex flex-col items-center justify-center font-black shadow-inner border ${disabled ? 'bg-slate-50 text-slate-400 border-slate-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                        <span className="text-xl leading-none">{c.SoTinChi}</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider mt-0.5">Tín chỉ</span>
                      </div>
                      <div className="space-y-2.5 flex-1">
                        <div>
                          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                            <h4 className={`font-black text-lg ${disabled ? 'text-slate-600' : 'text-slate-900 group-hover:text-[#152238]'} transition-colors leading-tight`}>{c.TenMonHoc}</h4>
                            {c.MaLop && (
                              <span className="bg-purple-50 text-purple-600 border border-purple-100 font-bold text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider">Lớp {c.MaLop}</span>
                            )}
                            <span className="bg-slate-100 text-slate-500 font-bold text-[10px] px-2.5 py-1 rounded-md uppercase tracking-wider">{c.MaLopHocPhan}</span>
                            {(c.DiemCu === null || c.DiemCu === undefined)
                              ? <span className="bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">Học mới</span>
                              : parseFloat(c.DiemCu) < 1.0
                                ? <span className="bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">Học lại</span>
                                : <span className="bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">Cải thiện</span>
                            }
                          </div>
                        </div>

                        {/* Schedule Details */}
                        {c.NgayBatDau ? (
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 font-medium">
                            <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100"><CalendarDays className="w-4 h-4 text-blue-500" /> {formatThu(c.Thu)} • Tiết {c.CaHoc}</span>
                            <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100"><MapPin className="w-4 h-4 text-amber-500" /> P.{c.PhongHoc || 'Chưa XĐ'}</span>
                            <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100"><Users className="w-4 h-4 text-emerald-500" /> GV: {c.TenGiangVien || 'Chưa phân công'}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-sm">Lớp chưa có lịch cụ thể</span>
                        )}
                      </div>
                    </div>

                    {/* Right: Status & Action */}
                    <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <div className="text-left md:text-right">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Sĩ số</p>
                        <div className="text-base font-black text-slate-700">
                          <span className={isFull ? 'text-red-500' : 'text-emerald-500'}>{c.DaDangKy}</span>
                          <span className="text-slate-300 mx-1">/</span>
                          {c.SoLuongToiDa || 40}
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddToCart(c)}
                        disabled={disabled}
                        className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm min-w-[120px] transition-all duration-300 ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' : 'bg-[#152238] text-white hover:bg-[#1e3a5f] hover:shadow-xl hover:shadow-[#152238]/20 hover:-translate-y-0.5'}`}
                      >
                        {isInCart || isEnrolled ? 'Đã Chọn' : isFull ? 'Đã đầy' : noSchedule ? 'Chưa có lịch' : <><Plus className="w-5 h-5" /> Chọn môn</>}
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {filteredCourses.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5">
                  <BookPlus className="w-10 h-10 text-slate-300" />
                </div>
                <p className="text-slate-600 font-bold text-lg">Không tìm thấy môn học nào</p>
                <p className="text-slate-400 text-sm mt-2">Vui lòng thử thay đổi từ khóa hoặc bộ lọc của bạn.</p>
              </div>
            )}
          </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/60 shadow-sm min-h-[400px]">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <CalendarDays className="w-12 h-12 text-slate-300" />
              </div>
              <h3 className="text-2xl font-black text-slate-700 mb-2">Chưa đến đợt đăng ký</h3>
              <p className="text-slate-500 text-center max-w-sm">Hiện tại hệ thống không có đợt đăng ký học phần nào đang mở dành cho bạn. Vui lòng theo dõi thông báo và quay lại sau.</p>
            </div>
          )}
        </div>

        {/* Right Column: Sticky Premium Cart */}
        <div className="w-full xl:w-[480px] xl:sticky xl:top-6 flex flex-col gap-6">
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col max-h-[calc(100vh-60px)] relative">
            {/* Cart Header */}
            <div className="p-8 pb-6 bg-gradient-to-b from-slate-50 to-white relative z-10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-black text-2xl text-slate-800 flex items-center gap-3">
                  Giỏ Đăng Ký
                </h3>
                <div className="bg-[#152238] text-[#F4C542] px-4 py-1.5 rounded-xl font-black text-lg shadow-md">
                  {totalCredits} <span className="text-xs font-semibold text-white/70 uppercase">Tín chỉ</span>
                </div>
              </div>
              <p className="text-slate-500 font-medium text-sm">Tiến trình chọn môn học hiện tại của bạn</p>
            </div>

            {/* Cart Items List */}
            <div className="px-6 pb-6 overflow-y-auto flex-1 space-y-4">
              <AnimatePresence mode="popLayout">
                {displayList.map((c, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={c.MaLopHocPhan || i}
                    className={`p-5 rounded-3xl border-2 ${c.isLocal ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100 bg-white hover:border-slate-200'} shadow-sm relative group transition-all`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="pr-10">
                        <p className="font-bold text-slate-800 text-base leading-tight mb-1">{c.TenMonHoc}</p>
                        <div className="flex items-center gap-2">
                          {c.MaLop && <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 uppercase">Lớp {c.MaLop}</span>}
                          <p className="text-xs text-slate-500 font-semibold tracking-wide uppercase">{c.MaLopHocPhan}</p>
                        </div>
                      </div>

                      {/* Remove action */}
                      {(() => {
                        const canRemoveSaved = !c.isLocal && !!c.CoTheXoa;
                        const canRemove = (c.isLocal || canRemoveSaved) && !!activePhase;
                        if (!canRemove && c.TrangThai !== 'Chờ đóng tiền' && c.TrangThai !== 'Tạm lưu') return null;
                        return (
                          <button
                            onClick={() => c.isLocal ? handleRemoveFromCart(c.MaLopHocPhan) : handleRemoveSaved(c)}
                            disabled={!canRemove}
                            title={canRemove ? 'Hủy chọn môn này' : 'Không thể hủy lúc này'}
                            className={`absolute top-5 right-5 p-2 rounded-xl transition-all ${canRemove ? 'text-red-400 bg-red-50 hover:bg-red-500 hover:text-white shadow-sm' : 'text-slate-300 cursor-not-allowed opacity-50'}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )
                      })()}
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-3">
                        {(c.Thu || c.CaHoc) ? (
                          <>
                            {c.Thu && (
                              <span className="flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-lg">
                                <CalendarDays className="w-3.5 h-3.5 text-blue-500" /> {formatThu(c.Thu)}
                              </span>
                            )}
                            {c.CaHoc && (
                              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-lg">Tiết {c.CaHoc}</span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs font-bold text-slate-400 italic">Chưa xếp lịch</span>
                        )}
                      </div>

                      {c.isLocal
                        ? <span className="text-amber-600 bg-amber-100 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Tạm lưu</span>
                        : <div className="scale-90 origin-right">{renderStatusBadge(c.TrangThai)}</div>
                      }
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {displayList.length === 0 && (
                <div className="text-center py-16 h-full flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-slate-100">
                    <BookPlus className="w-10 h-10 text-slate-300" />
                  </div>
                  <p className="text-slate-600 font-bold text-lg mb-2">Chưa chọn môn nào</p>
                  <p className="text-slate-400 text-sm max-w-[250px] mx-auto">Vui lòng chọn môn học từ danh sách bên trái để thêm vào giỏ.</p>
                </div>
              )}
            </div>

            {/* Action Button Footer */}
            {cart.length > 0 && (
              <div className="p-6 bg-white border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] z-10 relative">
                <button onClick={handleFinalize} className="w-full py-4 bg-[#F4C542] hover:bg-[#eab308] text-[#152238] rounded-2xl text-base font-black shadow-xl shadow-amber-500/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02]">
                  <Save className="w-5 h-5" /> Gửi Đăng Ký Lên Hệ Thống
                </button>
                <p className="text-center text-xs text-slate-400 mt-4 font-semibold flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Sẽ tự động kiểm tra điều kiện & tạo phiếu thu
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentCourseRegistration;