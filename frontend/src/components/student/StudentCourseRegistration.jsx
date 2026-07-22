import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BookPlus, Plus, Trash2, CheckCircle2, MapPin, CalendarDays, AlertCircle, 
  Save, XCircle, Wallet, Search, Hourglass, Users, GraduationCap, 
  LayoutList, LayoutGrid, RefreshCw, Layers, Check
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

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
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
      setLoading(false); 
    }
  }, [user?.username]);

  useEffect(() => {
    if (user?.username) fetchData();
  }, [fetchData, user?.username]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const activePhase = useMemo(() => {
    if (!fetchedPhase) return null;
    const p = fetchedPhase;
    return (p.TrangThai === 'Mo' && p.NgayTao && new Date(p.NgayTao) <= now && (!p.NgayDong || new Date(p.NgayDong) > now)) ? p : null;
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
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-[11px] font-bold border border-emerald-200 whitespace-nowrap"><CheckCircle2 className="w-3 h-3" /> {status}</span>;
      case 'Chờ đóng tiền':
      case 'Tạm lưu':
      case 'Đã lưu':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-md text-[11px] font-bold border border-amber-200 whitespace-nowrap"><Wallet className="w-3 h-3" /> {status}</span>;
      case 'Đã hủy':
      case 'Từ chối':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 rounded-md text-[11px] font-bold border border-rose-200 whitespace-nowrap"><XCircle className="w-3 h-3" /> {status}</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-[11px] font-bold border border-slate-200 whitespace-nowrap">{status}</span>;
    }
  };

  const renderTypeBadge = (c) => {
    if (c.DiemCu === null || c.DiemCu === undefined) {
      return <span className="inline-block bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-bold whitespace-nowrap">Học mới</span>;
    }
    if (parseFloat(c.DiemCu) < 1.0) {
      return <span className="inline-block bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[11px] font-bold whitespace-nowrap">Học lại ({c.DiemCu})</span>;
    }
    return <span className="inline-block bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-bold whitespace-nowrap">Cải thiện ({c.DiemCu})</span>;
  };

  if (loading) return <StudentCourseRegistrationSkeleton />;

  return (
    <div className="max-w-[1720px] mx-auto space-y-5 pb-12 px-3 sm:px-6 lg:px-8 font-sans">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: '', type: 'success' })} />
      <ConfirmDialog show={confirmDialog.show} title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.action} onCancel={() => setConfirmDialog({ show: false, title: '', message: '', action: null })} />

      {/* Top Banner Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl bg-slate-900 text-white p-5 sm:p-7 shadow-lg border border-slate-800">
        <div className="absolute -right-12 -top-12 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/15 shadow-sm shrink-0">
              <GraduationCap className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Đăng ký học phần</h1>
                {activePhase && (
                  <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Đang mở
                  </span>
                )}
              </div>
              <p className="text-slate-300 text-xs sm:text-sm mt-0.5 font-medium">
                {activePhase ? `${activePhase.TenDot} — ${activePhase.HocKy || ''}` : 'Hệ thống Đăng ký Tín chỉ Trực tuyến'}
              </p>
            </div>
          </div>

          {/* Quick Info & Timer */}
          <div className="flex flex-wrap items-center gap-3">
            {countdownText && (
              <div className="flex items-center gap-2.5 bg-slate-800/90 border border-slate-700/80 px-3.5 py-2 rounded-xl backdrop-blur-md">
                <Hourglass className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-none">Còn lại</p>
                  <p className="text-sm font-extrabold text-amber-400 leading-tight mt-0.5">{countdownText}</p>
                </div>
              </div>
            )}
            <button 
              onClick={fetchData} 
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-all flex items-center gap-2 text-xs font-semibold"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* Stats Summary Cards Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-800/60 backdrop-blur-sm p-3 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <p className="text-[11px] text-slate-400 font-medium">Tín chỉ đã chọn</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-amber-400">{totalCredits}</span>
              <span className="text-xs text-slate-400 font-bold">/ 23 TĐ</span>
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${totalCredits > 23 ? 'bg-rose-500' : totalCredits >= 18 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                style={{ width: `${Math.min(100, (totalCredits / 23) * 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-sm p-3 rounded-xl border border-slate-700/60">
            <p className="text-[11px] text-slate-400 font-medium">Môn tạm lưu (Giỏ)</p>
            <p className="text-xl font-black text-blue-400 mt-1">{cartItemsCount} <span className="text-xs text-slate-400 font-normal">môn</span></p>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-sm p-3 rounded-xl border border-slate-700/60">
            <p className="text-[11px] text-slate-400 font-medium">Môn đã đăng ký</p>
            <p className="text-xl font-black text-emerald-400 mt-1">{enrolledItemsCount} <span className="text-xs text-slate-400 font-normal">môn</span></p>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-sm p-3 rounded-xl border border-slate-700/60">
            <p className="text-[11px] text-slate-400 font-medium">Môn học có sẵn</p>
            <p className="text-xl font-black text-slate-200 mt-1">{filteredCourses.length} <span className="text-xs text-slate-400 font-normal">lớp</span></p>
          </div>
        </div>
      </motion.div>

      {/* Main Two-Column Container */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">

        {/* Left Column: Course List (Spacious Data View) */}
        <div className="flex-1 w-full flex flex-col gap-4 min-w-0">
          {activePhase ? (
            <>
              {/* Controls Bar: Tabs, Search, Filters & View Toggle */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  {/* Category Tabs */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                    <button
                      onClick={() => setActiveTab('TrongNganh')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap flex items-center gap-2 ${
                        activeTab === 'TrongNganh' 
                          ? 'bg-slate-900 text-white shadow-md' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      Môn Chuyên Ngành
                    </button>
                    <button
                      onClick={() => setActiveTab('NgoaiNganh')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap flex items-center gap-2 ${
                        activeTab === 'NgoaiNganh' 
                          ? 'bg-slate-900 text-white shadow-md' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                      }`}
                    >
                      <BookPlus className="w-3.5 h-3.5" />
                      Môn Đại Cương / Tự Chọn
                    </button>
                  </div>

                  {/* View Switcher: Table vs Cards */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                        viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <LayoutList className="w-3.5 h-3.5" />
                      <span>Bảng</span>
                    </button>
                    <button
                      onClick={() => setViewMode('cards')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                        viewMode === 'cards' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Thẻ</span>
                    </button>
                  </div>
                </div>

                {/* Filter Controls Bar */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm môn học, mã LHP, mã môn..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all h-9"
                    />
                    {searchTerm && (
                      <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold">
                        ×
                      </button>
                    )}
                  </div>

                  {/* Day Selector */}
                  <select
                    value={filterThu}
                    onChange={e => setFilterThu(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer h-9"
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

                  {/* Hide Full Checkbox */}
                  <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold cursor-pointer bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors select-none h-9">
                    <input 
                      type="checkbox" 
                      checked={hideFull} 
                      onChange={e => setHideFull(e.target.checked)} 
                      className="w-3.5 h-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900" 
                    />
                    Ẩn lớp đầy
                  </label>
                </div>
              </div>

              {/* Data View: Table Layout (perfect baseline alignment) */}
              {viewMode === 'table' ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[840px]">
                      <thead>
                        <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider">
                          <th className="py-3 px-4 w-[34%]">Mã & Tên môn học</th>
                          <th className="py-3 px-3 text-center w-[8%]">TC</th>
                          <th className="py-3 px-4 w-[20%]">Lịch học & Phòng</th>
                          <th className="py-3 px-4 w-[16%]">Giảng viên</th>
                          <th className="py-3 px-3 text-center w-[10%]">Sĩ số</th>
                          <th className="py-3 px-3 text-center w-[12%]">Loại</th>
                          <th className="py-3 px-4 text-right w-[14%]">Thao tác</th>
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
                              className={`transition-colors align-middle ${disabled ? 'bg-slate-50/60' : 'hover:bg-blue-50/30'}`}
                            >
                              {/* Course Name & Code */}
                              <td className="py-3.5 px-4 align-middle">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-mono font-bold text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200/80 inline-block">
                                      {c.MaLopHocPhan}
                                    </span>
                                    {c.MaLop && (
                                      <span className="font-bold text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200/80 inline-block">
                                        Lớp {c.MaLop}
                                      </span>
                                    )}
                                  </div>
                                  <p className="font-bold text-slate-900 text-sm leading-snug">{c.TenMonHoc}</p>
                                </div>
                              </td>

                              {/* Credits */}
                              <td className="py-3.5 px-3 text-center align-middle font-extrabold">
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-black text-xs">
                                  {c.SoTinChi}
                                </span>
                              </td>

                              {/* Schedule & Room */}
                              <td className="py-3.5 px-4 align-middle">
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
                                  <span className="text-slate-400 italic whitespace-nowrap">Chưa có lịch</span>
                                )}
                              </td>

                              {/* Lecturer */}
                              <td className="py-3.5 px-4 align-middle font-medium text-slate-700">
                                <div className="flex items-center gap-1.5 max-w-[150px]">
                                  <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="truncate" title={c.TenGiangVien || 'Chưa phân công'}>
                                    {c.TenGiangVien || 'Chưa phân công'}
                                  </span>
                                </div>
                              </td>

                              {/* Attendance / Sĩ số */}
                              <td className="py-3.5 px-3 text-center align-middle">
                                <div className="inline-flex flex-col items-center min-w-[65px]">
                                  <span className={`font-extrabold ${isFull ? 'text-rose-600' : 'text-slate-800'}`}>
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

                              {/* Registration Type */}
                              <td className="py-3.5 px-3 text-center align-middle whitespace-nowrap">
                                {renderTypeBadge(c)}
                              </td>

                              {/* Action Button */}
                              <td className="py-3.5 px-4 text-right align-middle whitespace-nowrap">
                                <button
                                  onClick={() => handleAddToCart(c)}
                                  disabled={disabled}
                                  className={`inline-flex items-center justify-center gap-1 px-3.5 py-1.5 rounded-xl font-bold transition-all shadow-sm ${
                                    isEnrolled 
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                                      : isInCart
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200 cursor-default'
                                      : isFull
                                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                      : noSchedule
                                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                      : 'bg-slate-900 hover:bg-blue-600 text-white hover:shadow-md'
                                  }`}
                                >
                                  {isEnrolled ? (
                                    <><Check className="w-3.5 h-3.5" /> Đã ĐK</>
                                  ) : isInCart ? (
                                    <><Check className="w-3.5 h-3.5" /> Tạm lưu</>
                                  ) : isFull ? (
                                    'Đã đầy'
                                  ) : noSchedule ? (
                                    'Chưa lịch'
                                  ) : (
                                    <><Plus className="w-3.5 h-3.5" /> Chọn môn</>
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
                    <div className="text-center py-12 px-4">
                      <BookPlus className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-700 font-bold text-sm">Không tìm thấy môn học phù hợp</p>
                      <p className="text-slate-400 text-xs mt-1">Thử thay đổi từ khóa hoặc điều chỉnh bộ lọc thứ.</p>
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
                        className={`bg-white rounded-2xl p-4 border shadow-sm transition-all flex flex-col justify-between ${
                          disabled ? 'border-slate-200 opacity-80' : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                  {c.MaLopHocPhan}
                                </span>
                                {c.MaLop && (
                                  <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                                    Lớp {c.MaLop}
                                  </span>
                                )}
                                {renderTypeBadge(c)}
                              </div>
                              <h3 className="font-extrabold text-slate-900 text-sm leading-snug">{c.TenMonHoc}</h3>
                            </div>
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-black text-xs rounded-lg shrink-0">
                              {c.SoTinChi} TC
                            </span>
                          </div>

                          <div className="bg-slate-50 p-2.5 rounded-xl space-y-1 text-xs text-slate-600 font-medium">
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

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Sĩ số</p>
                            <p className={`text-xs font-extrabold ${isFull ? 'text-rose-600' : 'text-slate-700'}`}>
                              {c.DaDangKy} / {c.SoLuongToiDa || 40}
                            </p>
                          </div>

                          <button
                            onClick={() => handleAddToCart(c)}
                            disabled={disabled}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              isEnrolled || isInCart
                                ? 'bg-slate-100 text-slate-500 border border-slate-200'
                                : isFull || noSchedule
                                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                : 'bg-slate-900 text-white hover:bg-blue-600'
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
            <div className="flex flex-col items-center justify-center p-10 bg-white rounded-2xl border border-slate-200 shadow-sm min-h-[320px] text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-3 text-slate-400">
                <CalendarDays className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Chưa đến đợt đăng ký</h3>
              <p className="text-slate-500 text-xs max-w-md mt-1">
                Hiện tại hệ thống không mở đợt đăng ký học phần cho tài khoản của bạn. Vui lòng kiểm tra lại sau hoặc liên hệ phòng đào tạo.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Registration Cart & Enrolled Courses Sidebar */}
        <div className="w-full lg:w-[380px] xl:w-[410px] shrink-0 lg:sticky lg:top-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            {/* Header with clear non-overflowing flex layout */}
            <div className="p-4 bg-slate-900 text-white">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h2 className="font-extrabold text-base flex items-center gap-2 truncate">
                  <Wallet className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Danh Sách Chọn Môn</span>
                </h2>
                <span className="bg-amber-400 text-slate-900 text-xs font-black px-2 py-0.5 rounded-lg shrink-0">
                  {totalCredits}/23 TC
                </span>
              </div>
              <p className="text-slate-400 text-[11px] font-medium">Học phần tạm lưu & đã chính thức lưu</p>

              {/* Cart Segmented Tabs */}
              <div className="flex items-center gap-1 mt-3 p-1 bg-slate-800 rounded-xl text-[11px] font-bold">
                <button
                  onClick={() => setCartTab('all')}
                  className={`flex-1 py-1 px-1.5 rounded-lg transition-all text-center truncate ${cartTab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  Tất cả ({activeDisplayList.length})
                </button>
                <button
                  onClick={() => setCartTab('cart')}
                  className={`flex-1 py-1 px-1.5 rounded-lg transition-all text-center truncate ${cartTab === 'cart' ? 'bg-amber-400 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  Tạm lưu ({cartItemsCount})
                </button>
                <button
                  onClick={() => setCartTab('enrolled')}
                  className={`flex-1 py-1 px-1.5 rounded-lg transition-all text-center truncate ${cartTab === 'enrolled' ? 'bg-emerald-400 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  Đã ĐK ({enrolledItemsCount})
                </button>
              </div>
            </div>

            {/* List Items */}
            <div className="p-3.5 max-h-[500px] overflow-y-auto space-y-2.5 divide-y divide-slate-100">
              <AnimatePresence mode="popLayout">
                {filteredCartList.map((c, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={c.MaLopHocPhan || i}
                    className={`pt-2.5 first:pt-0 ${c.isLocal ? 'bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/80' : ''}`}
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
                          <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
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
                            className={`p-1 rounded-lg transition-all shrink-0 ${
                              canRemove ? 'text-rose-500 hover:bg-rose-100 hover:text-rose-700' : 'text-slate-300 cursor-not-allowed'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        );
                      })()}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100/80 text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-600 font-medium whitespace-nowrap">
                        {c.Thu ? (
                          <span>{formatThu(c.Thu)} • Tiết {c.CaHoc || '—'}</span>
                        ) : (
                          <span className="text-slate-400 italic">Chưa lịch</span>
                        )}
                      </div>

                      {c.isLocal ? (
                        <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 whitespace-nowrap">
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
                <div className="py-10 text-center space-y-1.5">
                  <BookPlus className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-slate-600 font-bold text-xs">Chưa có môn học nào</p>
                  <p className="text-slate-400 text-[11px] max-w-[180px] mx-auto">Chọn môn từ danh sách bên trái để thêm vào giỏ đăng ký.</p>
                </div>
              )}
            </div>

            {/* Action Bar */}
            {cart.length > 0 && (
              <div className="p-3.5 bg-slate-50 border-t border-slate-200">
                <button
                  onClick={handleFinalize}
                  className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-xl font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                >
                  <Save className="w-3.5 h-3.5" />
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