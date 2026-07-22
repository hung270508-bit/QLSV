import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BookPlus, Plus, Trash2, CheckCircle2, MapPin, CalendarDays, AlertCircle, 
  Save, XCircle, Wallet, Search, Hourglass, Users, GraduationCap, 
  LayoutList, LayoutGrid, RefreshCw, Layers, Check, Sparkles, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import API_URL from '../../api';
import { Toast, ConfirmDialog } from '../common/ModalPortal';
import { StudentCourseRegistrationSkeleton } from '../common/StudentSkeleton';

function StudentCourseRegistration({ user }) {
  const [availableCourses, setAvailableCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [fetchedPhase, setFetchedPhase] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter, Search & View Mode states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterThu, setFilterThu] = useState('all');
  const [hideFull, setHideFull] = useState(false);
  const [activeTab, setActiveTab] = useState('TrongNganh'); // 'TrongNganh' | 'NgoaiNganh'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [cartTab, setCartTab] = useState('all'); // 'all' | 'cart' | 'enrolled'

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, title: '', message: '', action: null });
  const [now, setNow] = useState(() => new Date());

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const [availRes, myRes, activePhaseRes] = await Promise.all([
        axios.get(`${API_URL}/api/enrollment/available/${user?.username}`),
        axios.get(`${API_URL}/api/enrollment/my-courses/${user?.username}`),
        axios.get(`${API_URL}/api/enrollment/active-phase/${user?.username}`)
      ]);
      setAvailableCourses(availRes.data || []);
      setMyCourses(myRes.data || []);
      setFetchedPhase(activePhaseRes.data?.phase || null);
    } catch (e) {
      console.error(e);
      showToast('Lỗi tải dữ liệu. Vui lòng thử lại!', 'error');
    } finally { 
      if (isInitial) setLoading(false); 
    }
  }, [user?.username]);

  useEffect(() => {
    if (!user?.username) return;

    fetchData(true);

    // 1. Lắng nghe sự kiện thời gian thực (SSE Stream) từ Admin khi Đợt đăng ký thay đổi
    let eventSource = null;
    try {
      eventSource = new EventSource(`${API_URL}/api/enrollment/phases/stream`);
      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'PHASE_CHANGED') {
            fetchData(false);
          }
        } catch {
          // Ignore JSON parse error
        }
      };
    } catch {
      // Ignore EventSource creation error
    }

    // 2. Tự động đồng bộ định kỳ 10s dự phòng (nối tiếp ngầm không chớp trang)
    const pollTimer = setInterval(() => {
      fetchData(false);
    }, 10000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(pollTimer);
    };
  }, [fetchData, user?.username]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(t);
  }, []);

  const activePhase = useMemo(() => {
    if (!fetchedPhase) return null;
    const p = fetchedPhase;
    const startDate = p.NgayMo || p.NgayTao;
    const endDate = p.NgayDong;
    const isMo = p.TrangThai === 'Mo';
    const isStarted = !startDate || new Date(startDate) <= now;
    const isNotEnded = !endDate || new Date(endDate) > now;
    return (isMo && isStarted && isNotEnded) ? p : null;
  }, [fetchedPhase, now]);

  const currentSemesterMyCourses = useMemo(() => {
    if (!activePhase) return [];
    return myCourses.filter(c => 
      c.HocKy === activePhase.HocKy && 
      c.TrangThai !== 'Đã hủy' && 
      c.TrangThai !== 'Từ chối' &&
      c.TrangThai !== 'Da huy' &&
      c.TrangThai !== 'Tu choi'
    );
  }, [myCourses, activePhase]);

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

  const formatThu = (thu) => {
    if (thu === null || thu === undefined || thu === '') return '—';
    const val = String(thu).trim().toUpperCase();
    if (val === 'CN' || val === '1') return 'Chủ nhật';
    const num = parseInt(val, 10);
    if (!Number.isNaN(num) && num >= 2 && num <= 7) return `Thứ ${num}`;
    return val;
  };

  const checkClash = (newCourse) => {
    const activeEnrolled = currentSemesterMyCourses;
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
    const activeEnrolled = currentSemesterMyCourses;
    const currentActiveCredits = [...cart, ...activeEnrolled].reduce((acc, c) => acc + (parseInt(c.SoTinChi) || 0), 0);
    const newTotalCredits = currentActiveCredits + parseInt(course.SoTinChi || 0, 10);
    if (newTotalCredits > 23) {
      return showToast(`Vượt giới hạn 23 tín chỉ! Không thể chọn thêm môn ${course.TenMonHoc}.`, "error");
    }

    if (cart.find(c => c.MaMonHoc === course.MaMonHoc)) {
      return showToast(`Môn ${course.TenMonHoc} đã có trong danh sách tạm!`, "error");
    }

    if (activeEnrolled.find(c => c.MaMonHoc === course.MaMonHoc)) {
      return showToast(`Bạn đã đăng ký môn ${course.TenMonHoc} rồi!`, "error");
    }

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
    if (cart.length === 0) return showToast("Danh sách tạm đang trống!", "error");

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
      const isTuDo = !c.MaLop || c.MaLop.trim() === '';
      const isDaiCuong = c.LoaiMonHoc === 'Đại cương' || c.LoaiMonHoc === 'Cơ bản';
      const isDungKhoa = c.MaKhoaMonHoc === c.MaKhoaSinhVien;

      if (isDaiCuong && !isTuDo) return false;

      if (activeTab === 'TrongNganh') {
        if (!isDungKhoa || isTuDo) return false;
      } else {
        if (!isTuDo) return false;
      }

      if (hideFull && c.DaDangKy >= (c.SoLuongToiDa || 40)) return false;
      if (filterThu !== 'all' && String(c.Thu) !== String(filterThu)) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return c.TenMonHoc?.toLowerCase().includes(term) || c.MaLopHocPhan?.toLowerCase().includes(term);
      }
      return true;
    });
  }, [availableCourses, searchTerm, filterThu, hideFull, activeTab]);

  const displayList = useMemo(() => [
    ...cart.map(c => ({ ...c, isLocal: true, TrangThai: 'Tạm lưu' })),
    ...currentSemesterMyCourses.map(c => ({ ...c, isLocal: false }))
  ], [cart, currentSemesterMyCourses]);

  const activeDisplayList = useMemo(() => 
    displayList.filter(c => c.TrangThai !== 'Đã hủy' && c.TrangThai !== 'Từ chối'), 
    [displayList]
  );
  
  const totalCredits = useMemo(() => 
    activeDisplayList.reduce((acc, c) => acc + (parseInt(c.SoTinChi) || 0), 0),
    [activeDisplayList]
  );

  const cartItemsCount = cart.length;
  const enrolledItemsCount = currentSemesterMyCourses.length;

  const filteredCartList = useMemo(() => {
    if (cartTab === 'cart') return activeDisplayList.filter(c => c.isLocal);
    if (cartTab === 'enrolled') return activeDisplayList.filter(c => !c.isLocal);
    return activeDisplayList;
  }, [activeDisplayList, cartTab]);

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Thành công':
      case 'Đã đăng ký':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[11px] font-bold border border-emerald-200 whitespace-nowrap"><CheckCircle2 className="w-3 h-3" /> {status}</span>;
      case 'Chờ đóng tiền':
      case 'Tạm lưu':
      case 'Đã lưu':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg text-[11px] font-bold border border-amber-200 whitespace-nowrap"><Wallet className="w-3 h-3" /> {status}</span>;
      case 'Đã hủy':
      case 'Từ chối':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg text-[11px] font-bold border border-rose-200 whitespace-nowrap"><XCircle className="w-3 h-3" /> {status}</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold border border-slate-200 whitespace-nowrap">{status}</span>;
    }
  };

  const renderTypeBadge = (c) => {
    if (c.DiemCu === null || c.DiemCu === undefined) {
      return <span className="inline-block bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md text-[11px] font-bold whitespace-nowrap">Học mới</span>;
    }
    if (parseFloat(c.DiemCu) < 1.0) {
      return <span className="inline-block bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md text-[11px] font-bold whitespace-nowrap">Học lại ({c.DiemCu})</span>;
    }
    return <span className="inline-block bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md text-[11px] font-bold whitespace-nowrap">Cải thiện ({c.DiemCu})</span>;
  };

  if (loading) return <StudentCourseRegistrationSkeleton />;

  return (
    <div className="space-y-6 pb-12 font-sans">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: '', type: 'success' })} />
      <ConfirmDialog show={confirmDialog.show} title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.action} onCancel={() => setConfirmDialog({ show: false, title: '', message: '', action: null })} />

      {/* Hero Header Banner (Yellow Theme to match website) */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] bg-[#F4C542] p-8 text-[#152238] shadow-xl"
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-white/40 backdrop-blur-md rounded-2xl border border-white/40 shadow-sm shrink-0">
              <GraduationCap className="w-8 h-8 text-[#152238]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/40 backdrop-blur-md rounded-full text-xs font-bold text-[#152238]">
                  <Sparkles className="w-3.5 h-3.5" /> Hệ thống Đăng ký Tín chỉ Trực tuyến
                </div>
                {activePhase && (
                  <span className="bg-[#152238] text-white font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    Đợt Đang Mở
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-black tracking-tight text-[#152238] mt-1.5">Đăng ký học phần</h1>
              <p className="text-[#152238]/80 text-sm mt-1 font-medium">
                {activePhase ? `${activePhase.TenDot} — ${activePhase.HocKy || ''}` : 'Chọn học phần chuyên ngành & tự do cho học kỳ hiện tại'}
              </p>
            </div>
          </div>

          {/* Timer & Refresh Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {countdownText && (
              <div className="flex items-center gap-2.5 bg-white/40 backdrop-blur-md border border-white/50 px-4 py-2.5 rounded-2xl shadow-sm">
                <Hourglass className="w-4 h-4 text-[#152238] animate-pulse shrink-0" />
                <div>
                  <p className="text-[10px] text-[#152238]/70 font-bold uppercase tracking-wider leading-none">Thời gian còn lại</p>
                  <p className="text-sm font-black text-[#152238] leading-tight mt-0.5">{countdownText}</p>
                </div>
              </div>
            )}
            <motion.button 
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={fetchData} 
              className="px-4 py-2.5 bg-white hover:bg-white/90 text-[#152238] rounded-2xl shadow-md transition-all flex items-center gap-2 text-xs font-extrabold"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Làm mới</span>
            </motion.button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#152238]/10">
          <div className="bg-white/40 backdrop-blur-md p-3.5 rounded-2xl border border-white/40">
            <p className="text-xs font-bold text-[#152238]/70 uppercase tracking-wider">Tín chỉ đã chọn</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-[#152238]">{totalCredits}</span>
              <span className="text-xs text-[#152238]/70 font-bold">/ 23 TĐ</span>
            </div>
            <div className="w-full bg-white/60 h-2 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${totalCredits > 23 ? 'bg-rose-600' : totalCredits >= 18 ? 'bg-amber-600' : 'bg-emerald-600'}`}
                style={{ width: `${Math.min(100, (totalCredits / 23) * 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-white/40 backdrop-blur-md p-3.5 rounded-2xl border border-white/40">
            <p className="text-xs font-bold text-[#152238]/70 uppercase tracking-wider">Môn tạm lưu (Giỏ)</p>
            <p className="text-2xl font-black text-[#152238] mt-1">{cartItemsCount} <span className="text-xs font-bold">môn</span></p>
          </div>

          <div className="bg-white/40 backdrop-blur-md p-3.5 rounded-2xl border border-white/40">
            <p className="text-xs font-bold text-[#152238]/70 uppercase tracking-wider">Môn đã đăng ký</p>
            <p className="text-2xl font-black text-[#152238] mt-1">{enrolledItemsCount} <span className="text-xs font-bold">môn</span></p>
          </div>

          <div className="bg-white/40 backdrop-blur-md p-3.5 rounded-2xl border border-white/40">
            <p className="text-xs font-bold text-[#152238]/70 uppercase tracking-wider">Lớp mở có sẵn</p>
            <p className="text-2xl font-black text-[#152238] mt-1">{filteredCourses.length} <span className="text-xs font-bold">lớp</span></p>
          </div>
        </div>
      </motion.div>

      {/* Main Container */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* Left Column: Course List */}
        <div className="flex-1 w-full flex flex-col gap-4 min-w-0">
          {activePhase ? (
            <>
              {/* Controls Bar */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  {/* Category Tabs */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                    <button
                      onClick={() => setActiveTab('TrongNganh')}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap flex items-center gap-2 ${
                        activeTab === 'TrongNganh' 
                          ? 'bg-[#152238] text-white shadow-md' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Layers className="w-4 h-4 text-[#F4C542]" />
                      Môn Chuyên Ngành
                    </button>
                    <button
                      onClick={() => setActiveTab('NgoaiNganh')}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap flex items-center gap-2 ${
                        activeTab === 'NgoaiNganh' 
                          ? 'bg-[#152238] text-white shadow-md' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <BookPlus className="w-4 h-4 text-[#F4C542]" />
                      Môn Đại Cương / Tự Chọn
                    </button>
                  </div>

                  {/* View Switcher */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl shrink-0 self-start sm:self-auto">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                        viewMode === 'table' ? 'bg-white text-[#152238] shadow-sm' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <LayoutList className="w-3.5 h-3.5" />
                      <span>Bảng</span>
                    </button>
                    <button
                      onClick={() => setViewMode('cards')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                        viewMode === 'cards' ? 'bg-white text-[#152238] shadow-sm' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Thẻ</span>
                    </button>
                  </div>
                </div>

                {/* Search & Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[240px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm theo tên môn, mã LHP, mã môn học..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-9 py-2.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#F4C542] focus:bg-white transition-colors"
                    />
                    {searchTerm && (
                      <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <select
                    value={filterThu}
                    onChange={e => setFilterThu(e.target.value)}
                    className="px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#F4C542] cursor-pointer"
                  >
                    <option value="all">Tất cả các Thứ</option>
                    <option value="2">Thứ 2</option>
                    <option value="3">Thứ 3</option>
                    <option value="4">Thứ 4</option>
                    <option value="5">Thứ 5</option>
                    <option value="6">Thứ 6</option>
                    <option value="7">Thứ 7</option>
                    <option value="CN">Chủ nhật</option>
                  </select>

                  <label className="flex items-center gap-2 text-xs text-slate-700 font-bold cursor-pointer bg-slate-50/50 border border-slate-200 px-3.5 py-2.5 rounded-2xl hover:bg-slate-100 transition-colors select-none">
                    <input 
                      type="checkbox" 
                      checked={hideFull} 
                      onChange={e => setHideFull(e.target.checked)} 
                      className="w-4 h-4 rounded accent-amber-500" 
                    />
                    Ẩn lớp đầy
                  </label>
                </div>
              </div>

              {/* Data Table */}
              {viewMode === 'table' ? (
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[840px]">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-xs font-black uppercase tracking-wider">
                          <th className="py-4 px-6 w-[34%]">Mã & Tên môn học</th>
                          <th className="py-4 px-3 text-center w-[8%]">TC</th>
                          <th className="py-4 px-4 w-[20%]">Lịch học & Phòng</th>
                          <th className="py-4 px-4 w-[16%]">Giảng viên</th>
                          <th className="py-4 px-3 text-center w-[10%]">Sĩ số</th>
                          <th className="py-4 px-3 text-center w-[12%]">Loại</th>
                          <th className="py-4 px-6 text-right w-[14%]">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {filteredCourses.map((c) => {
                          const isFull = c.DaDangKy >= (c.SoLuongToiDa || 40);
                          const isInCart = cart.some(cartItem => cartItem.MaLopHocPhan === c.MaLopHocPhan);
                          const isEnrolled = currentSemesterMyCourses.some(en => en.MaLopHocPhan === c.MaLopHocPhan);
                          const noSchedule = !c.NgayBatDau;
                          const disabled = isFull || isInCart || isEnrolled || noSchedule;
                          const percentFull = Math.min(100, Math.round((c.DaDangKy / (c.SoLuongToiDa || 40)) * 100));

                          return (
                            <tr 
                              key={c.MaLopHocPhan}
                              className={`transition-colors align-middle ${disabled ? 'bg-slate-50/60' : 'hover:bg-amber-50/40'}`}
                            >
                              <td className="py-4 px-6 align-middle">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-mono font-bold text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 inline-block">
                                      {c.MaLopHocPhan}
                                    </span>
                                    {c.MaLop && (
                                      <span className="font-bold text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 inline-block">
                                        Lớp {c.MaLop}
                                      </span>
                                    )}
                                  </div>
                                  <p className="font-bold text-slate-900 text-sm leading-snug">{c.TenMonHoc}</p>
                                </div>
                              </td>

                              <td className="py-4 px-3 text-center align-middle font-black">
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-50 text-[#B45309] border border-amber-200/80 font-black text-xs">
                                  {c.SoTinChi}
                                </span>
                              </td>

                              <td className="py-4 px-4 align-middle">
                                {c.NgayBatDau ? (
                                  <div className="space-y-1 font-semibold text-slate-700">
                                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                                      <CalendarDays className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                      <span>{formatThu(c.Thu)} • Tiết {c.CaHoc}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-500 whitespace-nowrap">
                                      <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                      <span>P.{c.PhongHoc || 'Chưa XĐ'}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic whitespace-nowrap font-medium">Chưa có lịch</span>
                                )}
                              </td>

                              <td className="py-4 px-4 align-middle font-medium text-slate-700">
                                <div className="flex items-center gap-1.5 max-w-[150px]">
                                  <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="truncate font-semibold" title={c.TenGiangVien || 'Chưa phân công'}>
                                    {c.TenGiangVien || 'Chưa phân công'}
                                  </span>
                                </div>
                              </td>

                              <td className="py-4 px-3 text-center align-middle">
                                <div className="inline-flex flex-col items-center min-w-[65px]">
                                  <span className={`font-black ${isFull ? 'text-rose-600' : 'text-slate-800'}`}>
                                    {c.DaDangKy} / {c.SoLuongToiDa || 40}
                                  </span>
                                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                                    <div 
                                      className={`h-full ${isFull ? 'bg-rose-500' : percentFull >= 80 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                      style={{ width: `${percentFull}%` }}
                                    />
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 px-3 text-center align-middle whitespace-nowrap">
                                {renderTypeBadge(c)}
                              </td>

                              <td className="py-4 px-6 text-right align-middle whitespace-nowrap">
                                <button
                                  onClick={() => handleAddToCart(c)}
                                  disabled={disabled}
                                  className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl font-bold transition-all shadow-sm text-xs ${
                                    isEnrolled 
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                                      : isInCart
                                      ? 'bg-amber-50 text-amber-800 border border-amber-200 cursor-default'
                                      : isFull
                                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                      : noSchedule
                                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                      : 'bg-[#152238] hover:bg-[#0f1a2b] text-white hover:shadow-md'
                                  }`}
                                >
                                  {isEnrolled ? (
                                    <><Check className="w-4 h-4" /> Đã ĐK</>
                                  ) : isInCart ? (
                                    <><Check className="w-4 h-4" /> Tạm lưu</>
                                  ) : isFull ? (
                                    'Đã đầy'
                                  ) : noSchedule ? (
                                    'Chưa lịch'
                                  ) : (
                                    <><Plus className="w-4 h-4" /> Chọn môn</>
                                  )}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {filteredCourses.length === 0 && (
                    <div className="text-center py-14 px-4">
                      <BookPlus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-700 font-bold text-base">Không tìm thấy môn học phù hợp</p>
                      <p className="text-slate-400 text-xs mt-1 font-medium">Thử thay đổi từ khóa hoặc điều chỉnh bộ lọc thứ.</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Card View Alternative */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCourses.map((c) => {
                    const isFull = c.DaDangKy >= (c.SoLuongToiDa || 40);
                    const isInCart = cart.some(cartItem => cartItem.MaLopHocPhan === c.MaLopHocPhan);
                    const isEnrolled = currentSemesterMyCourses.some(en => en.MaLopHocPhan === c.MaLopHocPhan);
                    const noSchedule = !c.NgayBatDau;
                    const disabled = isFull || isInCart || isEnrolled || noSchedule;

                    return (
                      <div
                        key={c.MaLopHocPhan}
                        className={`bg-white rounded-3xl p-5 border shadow-sm transition-all flex flex-col justify-between ${
                          disabled ? 'border-slate-200 bg-slate-50/50' : 'border-slate-200/80 hover:border-amber-400 hover:shadow-md'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                  {c.MaLopHocPhan}
                                </span>
                                {c.MaLop && (
                                  <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                                    Lớp {c.MaLop}
                                  </span>
                                )}
                                {renderTypeBadge(c)}
                              </div>
                              <h3 className="font-extrabold text-slate-900 text-sm leading-snug">{c.TenMonHoc}</h3>
                            </div>
                            <span className="px-3 py-1 bg-amber-50 text-[#B45309] font-black text-xs rounded-xl shrink-0 border border-amber-200/80">
                              {c.SoTinChi} TC
                            </span>
                          </div>

                          <div className="bg-slate-50 p-3 rounded-2xl space-y-1.5 text-xs text-slate-600 font-semibold">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span>{formatThu(c.Thu)} • Tiết {c.CaHoc || '—'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span>Phòng {c.PhongHoc || 'Chưa xếp'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>GV: {c.TenGiangVien || 'Chưa phân công'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sĩ số</p>
                            <p className={`text-xs font-black ${isFull ? 'text-rose-600' : 'text-slate-800'}`}>
                              {c.DaDangKy} / {c.SoLuongToiDa || 40}
                            </p>
                          </div>

                          <button
                            onClick={() => handleAddToCart(c)}
                            disabled={disabled}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                              isEnrolled || isInCart
                                ? 'bg-slate-100 text-slate-500 border border-slate-200'
                                : isFull || noSchedule
                                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                : 'bg-[#152238] text-white hover:bg-[#0f1a2b]'
                            }`}
                          >
                            {isEnrolled ? 'Đã đăng ký' : isInCart ? 'Đã tạm lưu' : isFull ? 'Hết chỗ' : noSchedule ? 'Chưa lịch' : '+ Chọn môn'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200 shadow-sm min-h-[340px] text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                <CalendarDays className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Chưa đến đợt đăng ký</h3>
              <p className="text-slate-500 text-xs max-w-md mt-1.5 font-medium leading-relaxed">
                Hiện tại hệ thống không mở đợt đăng ký học phần cho tài khoản của bạn. Vui lòng kiểm tra lại sau hoặc liên hệ phòng đào tạo.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Registration Basket Sidebar */}
        <div className="w-full lg:w-[380px] xl:w-[410px] shrink-0 lg:sticky lg:top-4 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            {/* Sidebar Header */}
            <div className="p-5 bg-[#F4C542] text-[#152238]">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h2 className="font-bold text-base flex items-center gap-2.5 truncate">
                  <Wallet className="w-4 h-4 text-[#152238] shrink-0" />
                  <span>Danh Sách Chọn Môn</span>
                </h2>
                <span className="bg-[#152238] text-white text-xs font-black px-2.5 py-0.5 rounded-lg shrink-0">
                  {totalCredits}/23 TC
                </span>
              </div>
              <p className="text-[#152238]/75 text-xs font-medium">Học phần tạm lưu & đã đăng ký chính thức</p>

              {/* Segmented Tabs */}
              <div className="flex items-center gap-1 mt-4 p-1 bg-[#152238]/10 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setCartTab('all')}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center truncate ${cartTab === 'all' ? 'bg-white text-[#152238] shadow-sm font-black' : 'text-[#152238]/70 hover:text-[#152238]'}`}
                >
                  Tất cả ({activeDisplayList.length})
                </button>
                <button
                  onClick={() => setCartTab('cart')}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center truncate ${cartTab === 'cart' ? 'bg-[#152238] text-white shadow-sm font-black' : 'text-[#152238]/70 hover:text-[#152238]'}`}
                >
                  Tạm lưu ({cartItemsCount})
                </button>
                <button
                  onClick={() => setCartTab('enrolled')}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center truncate ${cartTab === 'enrolled' ? 'bg-emerald-700 text-white shadow-sm font-black' : 'text-[#152238]/70 hover:text-[#152238]'}`}
                >
                  Đã ĐK ({enrolledItemsCount})
                </button>
              </div>
            </div>

            {/* List Items */}
            <div className="p-4 max-h-[500px] overflow-y-auto space-y-3 divide-y divide-slate-100">
              <AnimatePresence mode="popLayout">
                {filteredCartList.map((c, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={c.MaLopHocPhan || i}
                    className={`pt-3 first:pt-0 ${c.isLocal ? 'bg-amber-50/60 p-3 rounded-2xl border border-amber-200/80' : ''}`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1 flex-1 pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {c.MaLopHocPhan}
                          </span>
                          {c.MaLop && (
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                              Lớp {c.MaLop}
                            </span>
                          )}
                          <span className="text-[10px] font-extrabold text-[#B45309] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80">
                            {c.SoTinChi} TC
                          </span>
                        </div>
                        <p className="font-bold text-slate-900 text-xs leading-snug">{c.TenMonHoc}</p>
                      </div>

                      {/* Remove Button */}
                      {(() => {
                        const canRemoveSaved = !c.isLocal && !!c.CoTheXoa;
                        const canRemove = (c.isLocal || canRemoveSaved) && !!activePhase;
                        if (!canRemove && c.TrangThai !== 'Chờ đóng tiền' && c.TrangThai !== 'Tạm lưu') return null;
                        return (
                          <button
                            onClick={() => c.isLocal ? handleRemoveFromCart(c.MaLopHocPhan) : handleRemoveSaved(c)}
                            disabled={!canRemove}
                            title={canRemove ? 'Xóa môn này' : 'Không thể xóa'}
                            className={`p-1.5 rounded-lg transition-all shrink-0 ${
                              canRemove ? 'text-rose-500 hover:bg-rose-100 hover:text-rose-700' : 'text-slate-300 cursor-not-allowed'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        );
                      })()}
                    </div>

                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100/80 text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-600 font-medium whitespace-nowrap">
                        {c.Thu ? (
                          <span>{formatThu(c.Thu)} • Tiết {c.CaHoc || '—'}</span>
                        ) : (
                          <span className="text-slate-400 italic">Chưa lịch</span>
                        )}
                      </div>

                      {c.isLocal ? (
                        <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 whitespace-nowrap">
                          <AlertCircle className="w-3 h-3" /> Tạm lưu
                        </span>
                      ) : (
                        renderStatusBadge(c.TrangThai)
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredCartList.length === 0 && (
                <div className="py-12 text-center space-y-2">
                  <BookPlus className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-slate-700 font-bold text-xs">Chưa chọn môn học nào</p>
                  <p className="text-slate-400 text-[11px] max-w-[200px] mx-auto font-medium">Chọn môn từ danh sách bên trái để thêm vào giỏ đăng ký.</p>
                </div>
              )}
            </div>

            {/* Action Bar */}
            {cart.length > 0 && (
              <div className="p-4 bg-slate-50 border-t border-slate-200">
                <button
                  onClick={handleFinalize}
                  className="w-full py-3 bg-[#F4C542] hover:bg-[#e4b532] text-[#152238] rounded-2xl font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                >
                  <Save className="w-4 h-4" />
                  Lưu Đăng Ký ({cart.length} môn)
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default StudentCourseRegistration;