import React, { useState, useEffect } from 'react';
import API_URL from '../../api';
import { TrainingPointsSkeleton } from '../common/AdminSkeleton';
import Pagination from '../common/Pagination';
import ModalPortal, { Toast, ConfirmDialog } from '../common/ModalPortal';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award, Filter, CheckCircle2, Clock, Edit, X, Calculator,
  UserCheck, AlertCircle, CalendarDays, PlusCircle, Power, PlayCircle,
  StopCircle, Search, Users, BookOpen, Loader2, FileImage
} from 'lucide-react';
import axios from 'axios';

const DEFAULT_CRITERIA = [
  {
    id: 'sec1',
    title: '1. Đánh giá về ý thức tham gia học tập (Tối đa 20đ)',
    items: [
      {
        id: '1.1', label: '1.1. Kết quả học tập có điểm trung bình học kỳ',
        options: [
          { label: 'Từ 3.5 đến 4.0 / Xuất sắc (+10đ)', point: 10 },
          { label: 'Từ 3.2 đến dưới 3.5 / Giỏi (+9đ)', point: 9 },
          { label: 'Từ 2.5 đến dưới 3.2 / Khá (+8đ)', point: 8 },
          { label: 'Từ 2.0 đến dưới 2.5 / Trung bình (+7đ)', point: 7 },
          { label: 'Dưới 2.0 / Không đạt (+0đ)', point: 0 }
        ]
      },
      {
        id: '1.2', label: '1.2. Ý thức đi học chuyên cần, đúng giờ',
        options: [
          { label: 'Đi học đầy đủ và không đi trễ (+6đ)', point: 6 },
          { label: 'Đi học đầy đủ và có đi trễ (+4đ)', point: 4 },
          { label: 'Nghỉ học nhiều, không đầy đủ (+0đ)', point: 0 }
        ]
      },
      {
        id: '1.3', label: '1.3. Thái độ học tập tích cực, đóng góp xây dựng bài',
        options: [
          { label: 'Tích cực tương tác, giúp đỡ bạn bè (+4đ)', point: 4 },
          { label: 'Bình thường, ít tương tác (+2đ)', point: 2 }
        ]
      }
    ]
  },
  {
    id: 'sec2',
    title: '2. Đánh giá ý thức chấp hành nội quy, quy chế (Tối đa 25đ)',
    items: [
      {
        id: '2.1', label: '2.1. Thực hiện tốt nội quy nhà trường',
        options: [
          { label: 'Không vi phạm quy chế (+15đ)', point: 15 },
          { label: 'Có vi phạm nhẹ bị nhắc nhở (+5đ)', point: 5 },
          { label: 'Bị kỷ luật cấp khoa/trường (+0đ)', point: 0 }
        ]
      },
      {
        id: '2.2', label: '2.2. Tham gia các buổi sinh hoạt lớp/khoa',
        options: [
          { label: 'Tham gia đầy đủ 100% (+10đ)', point: 10 },
          { label: 'Vắng 1-2 buổi có phép (+5đ)', point: 5 },
          { label: 'Không tham gia (+0đ)', point: 0 }
        ]
      }
    ]
  },
  {
    id: 'sec3',
    title: '3. Tham gia hoạt động chính trị, xã hội, văn thể mỹ (Tối đa 55đ)',
    items: [
      {
        id: '3.1', label: '3.1. Tham gia các hoạt động do Trường/Khoa tổ chức',
        options: [
          { label: 'Tham gia trên 5 hoạt động (+30đ)', point: 30 },
          { label: 'Tham gia từ 2 - 4 hoạt động (+20đ)', point: 20 },
          { label: 'Không tham gia (+0đ)', point: 0 }
        ]
      },
      {
        id: '3.2', label: '3.2. Chấp hành tốt đường lối của Đảng, pháp luật của Nhà nước',
        options: [
          { label: 'Chấp hành tốt, công dân gương mẫu (+25đ)', point: 25 },
          { label: 'Có vi phạm hành chính/pháp luật (+0đ)', point: 0 }
        ]
      }
    ]
  }
];

function AdminTrainingPoints() {
  // === QUẢN LÝ TAB ===
  const [activeTab, setActiveTab] = useState('periods');

  // === THÊM STATE: QUẢN LÝ THÔNG BÁO (TOAST NOTIFICATION) ===
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Hàm hiển thị thông báo đẹp mắt thay cho alert()
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const getCurrentNienKhoa = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1-12
    return month >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  };

  const getLocalDateString = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // === STATES: ĐỢT ĐÁNH GIÁ ===
  const [periods, setPeriods] = useState([]);
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [periodForm, setPeriodForm] = useState({ HocKy: 'HK1', NamHoc: getCurrentNienKhoa(), NgayBatDau: getLocalDateString(), NgayKetThuc: '', TrangThai: 'Đang tự đánh giá', CauTrucTieuChi: JSON.parse(JSON.stringify(DEFAULT_CRITERIA)) });
  const [periodFormErrors, setPeriodFormErrors] = useState({});
  const [periodModalTab, setPeriodModalTab] = useState('info'); // 'info' or 'builder'
  // State cho Modal xác nhận chuyển trạng thái đợt
  const [confirmModal, setConfirmModal] = useState({ show: false, id: null, newStatus: '' });
  const [isConfirmCreateOpen, setIsConfirmCreateOpen] = useState(false);

  // === STATES: XÉT DUYỆT ĐIỂM ===
  const [pointsData, setPointsData] = useState([]);
  const [filterHocKy, setFilterHocKy] = useState('All');
  const [filterTrangThai, setFilterTrangThai] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [diemKhoa, setDiemKhoa] = useState(0);
  const [trangThaiDuyet, setTrangThaiDuyet] = useState('Đã xác nhận');
  const [reviewErrors, setReviewErrors] = useState({});
  const [loading, setLoading] = useState(true);

  // States cho chi tiết phiếu tự đánh giá & lịch sử duyệt (Audit log)
  const [recordDetails, setRecordDetails] = useState([]);
  const [recordLogs, setRecordLogs] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // State cho xem ảnh popup
  const [previewImage, setPreviewImage] = useState(null);



  // States cho nhật ký duyệt toàn bộ
  const [isAllLogsModalOpen, setIsAllLogsModalOpen] = useState(false);
  const [allLogs, setAllLogs] = useState([]);
  const [loadingAllLogs, setLoadingAllLogs] = useState(false);
  const [allLogsSearch, setAllLogsSearch] = useState('');

  // States cho bộ lọc nâng cao Khoa và Lớp
  const [faculties, setFaculties] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filterKhoa, setFilterKhoa] = useState('All');
  const [filterLop, setFilterLop] = useState('All');

  const handleOpenAllLogs = async () => {
    setIsAllLogsModalOpen(true);
    setLoadingAllLogs(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/training-points/logs`);
      setAllLogs(res.data || []);
    } catch {
      showToast('Lỗi tải nhật ký duyệt!', 'error');
    } finally {
      setLoadingAllLogs(false);
    }
  };

  // === FETCH DATA ===
  const fetchData = async () => {
    try {
      setLoading(true);
      const [pointsRes, periodsRes, facultiesRes, classesRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/training-points`),
        axios.get(`${API_URL}/api/admin/training-periods`),
        axios.get(`${API_URL}/api/faculties`),
        axios.get(`${API_URL}/api/classes`)
      ]);
      setPointsData(pointsRes.data);
      setPeriods(periodsRes.data);
      setFaculties(facultiesRes.data || []);
      setClasses(classesRes.data || []);
    } catch (e) {
      console.error(e);
      showToast('Lỗi tải dữ liệu từ máy chủ!', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ==========================================
  // LOGIC: QUẢN LÝ ĐỢT ĐÁNH GIÁ
  // ==========================================
  const calculateTotalPoints = (criteria) => {
    let total = 0;
    if (!criteria) return 0;
    criteria.forEach(sec => {
      sec.items?.forEach(item => {
        const maxPoint = Math.max(0, ...item.options.map(o => Number(o.point) || 0));
        total += maxPoint;
      });
    });
    return total;
  };

  const parseNienKhoa = (namHoc) => {
    const match = /^(\d{4})-(\d{4})$/.exec((namHoc || '').trim());
    if (!match) return null;
    const start = parseInt(match[1], 10);
    const end = parseInt(match[2], 10);
    if (end <= start) return null;
    return { start, end };
  };

  const nienKhoaRange = parseNienKhoa(periodForm.NamHoc);
  const todayDateStr = getLocalDateString();
  const minNgay = todayDateStr; // Không cho phép chọn quá khứ
  const maxNgay = nienKhoaRange ? `${nienKhoaRange.end}-12-31` : '';

  const handleNgayChange = (field, value) => {
    setPeriodFormErrors(prev => ({ ...prev, [field]: '' }));

    // Luôn cập nhật giá trị vào state để UI cho phép chọn ngày
    setPeriodForm(prev => ({ ...prev, [field]: value }));

    if (value && value < minNgay) {
      setPeriodFormErrors(prev => ({
        ...prev,
        [field]: `Không được chọn ngày trong quá khứ!`
      }));
      return;
    }
    if (nienKhoaRange && value && value > maxNgay) {
      setPeriodFormErrors(prev => ({
        ...prev,
        [field]: `Phải nằm trong niên khóa (tối đa ${maxNgay})`
      }));
      return;
    }
  };

  const triggerCreatePeriod = () => {
    if (!nienKhoaRange) return showToast('Vui lòng nhập Năm học đúng định dạng VD: 2025-2026!', 'error');
    if (!periodForm.NgayBatDau || !periodForm.NgayKetThuc) return showToast('Vui lòng chọn đầy đủ Ngày bắt đầu và kết thúc!', 'error');
    if (periodForm.NgayBatDau < minNgay || periodForm.NgayKetThuc < minNgay) {
      return showToast('Không được chọn ngày trong quá khứ!', 'error');
    }
    if (periodForm.NgayBatDau > maxNgay || periodForm.NgayKetThuc > maxNgay) {
      return showToast(`Ngày không được vượt quá niên khóa (tối đa ${maxNgay})!`, 'error');
    }
    const diffTime = new Date(periodForm.NgayKetThuc) - new Date(periodForm.NgayBatDau);
    if (diffTime < 24 * 60 * 60 * 1000) {
      return showToast('Ngày kết thúc phải cách ngày bắt đầu ít nhất 1 ngày!', 'error');
    }

    const totalPoints = calculateTotalPoints(periodForm.CauTrucTieuChi);
    if (totalPoints !== 100) return showToast(`Tổng điểm tối đa của bộ tiêu chí phải bằng 100 (hiện tại là ${totalPoints})!`, 'error');

    setIsConfirmCreateOpen(true);
  };

  const handleCreatePeriod = async () => {
    setIsConfirmCreateOpen(false);
    try {
      const formattedHocKy = `${periodForm.HocKy}_${periodForm.NamHoc.replace('-', '_')}`;

      const response = await axios.post(`${API_URL}/api/admin/training-periods`, {
        HocKy: formattedHocKy,
        NamHoc: periodForm.NamHoc,
        NgayBatDau: periodForm.NgayBatDau,
        NgayKetThuc: periodForm.NgayKetThuc,
        TrangThai: periodForm.TrangThai,
        CauTrucTieuChi: periodForm.CauTrucTieuChi
      });

      setIsPeriodModalOpen(false);
      setPeriodForm({ HocKy: 'HK1', NamHoc: getCurrentNienKhoa(), NgayBatDau: getLocalDateString(), NgayKetThuc: '', TrangThai: 'Đang tự đánh giá', CauTrucTieuChi: JSON.parse(JSON.stringify(DEFAULT_CRITERIA)) });
      setPeriodModalTab('info');
      setPeriodFormErrors({});
      fetchData();
      showToast(response.data.message, 'success');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        showToast(error.response.data.message, 'error');
      } else {
        showToast('Có lỗi xảy ra khi tạo đợt đánh giá!', 'error');
      }
    }
  };

  const handleTogglePeriodStatus = (id, currentStatus) => {
    const newStatus = currentStatus === 'Đang tự đánh giá' ? 'Đã đóng đợt' : 'Đang tự đánh giá';
    setConfirmModal({ show: true, id, newStatus });
  };

  const confirmTogglePeriodStatus = async () => {
    const { id, newStatus } = confirmModal;
    setConfirmModal({ show: false, id: null, newStatus: '' });
    try {
      await axios.put(`${API_URL}/api/admin/training-periods/${id}/status`, { TrangThai: newStatus });
      fetchData();
      showToast(`Đã chuyển trạng thái thành: ${newStatus}`, 'success');
    } catch (error) {
      showToast('Lỗi cập nhật trạng thái đợt!', 'error');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  // ==========================================
  // LOGIC: XÉT DUYỆT ĐIỂM
  // ==========================================
  const filteredData = pointsData.filter(item => {
    if (searchTerm.length > 0 && searchTerm.trim() === '') return false;
    if (filterHocKy !== 'All' && item.HocKy !== filterHocKy) return false;
    if (filterTrangThai !== 'All' && item.TrangThai !== filterTrangThai) return false;
    if (filterKhoa !== 'All' && item.MaKhoa !== filterKhoa) return false;
    if (filterLop !== 'All' && item.MaLop !== filterLop) return false;
    if (searchTerm.trim() !== '') {
      const search = searchTerm.toLowerCase();
      const nameMatch = (item.HoTen || '').toLowerCase().includes(search);
      const mssvMatch = (item.MSSV || '').toLowerCase().includes(search);
      if (!nameMatch && !mssvMatch) return false;
    }
    return true;
  });

  // Tách biệt state currentPage cho 2 tab để tránh nhảy trang chéo tab
  const [currentPagePeriods, setCurrentPagePeriods] = useState(1);
  const [currentPageReviews, setCurrentPageReviews] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPageReviews(1);
  }, [filterHocKy, filterTrangThai, filterKhoa, filterLop, searchTerm]);



  const indexOfLastPeriod = currentPagePeriods * itemsPerPage;
  const indexOfFirstPeriod = indexOfLastPeriod - itemsPerPage;
  const currentPeriods = periods.slice(indexOfFirstPeriod, indexOfLastPeriod);
  const totalPagesPeriods = Math.ceil(periods.length / itemsPerPage);

  const indexOfLastReview = currentPageReviews * itemsPerPage;
  const indexOfFirstReview = indexOfLastReview - itemsPerPage;
  const currentReviews = filteredData.slice(indexOfFirstReview, indexOfLastReview);
  const totalPagesReviews = Math.ceil(filteredData.length / itemsPerPage);

  const uniqueSemesters = [...new Set(pointsData.map(item => item.HocKy))];

  // === THỐNG KÊ TỔNG QUAN (Summary Cards) ===
  const totalSubmitted = filteredData.length;
  const totalPending = filteredData.filter(item => item.TrangThai !== 'Đã xác nhận').length;
  const totalApproved = filteredData.filter(item => item.TrangThai === 'Đã xác nhận').length;


  // === XÉT DUYỆT CHI TIẾT ===
  const handleOpenReviewModal = async (record) => {
    // Kiểm tra xem đợt đánh giá đã đóng chưa
    const period = periods.find(p => p.HocKy === record.HocKy);
    if (!period || period.TrangThai !== 'Đã đóng đợt') {
      showToast('Phải đóng đợt đánh giá trước thì mới được duyệt điểm!', 'error');
      return;
    }

    setSelectedRecord(record);
    setDiemKhoa(record.DiemKhoaDanhGia || 0);
    setTrangThaiDuyet(record.TrangThai === 'Chờ lớp duyệt' ? 'Đã xác nhận' : record.TrangThai);
    setReviewErrors({});
    setRecordDetails([]);
    setRecordLogs([]);

    setLoadingDetails(true);
    try {
      const [detailsRes, logsRes] = await Promise.all([
        axios.get(`${API_URL}/api/training-points/${record.MaDanhGia}/details`),
        axios.get(`${API_URL}/api/admin/training-points/${record.MaDanhGia}/logs`)
      ]);
      setRecordDetails(detailsRes.data || []);
      setRecordLogs(logsRes.data || []);
    } catch (err) {
      console.error('Không thể tải chi tiết phiếu hoặc nhật ký duyệt:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const validateReview = () => {
    const errors = {};
    const khoa = parseInt(diemKhoa);
    const diemSV = parseInt(selectedRecord.DiemTuDanhGia) || 0;
    const maxChoPhep = 100 - diemSV;

    if (diemKhoa === '' || diemKhoa === null || isNaN(khoa)) {
      errors.diemKhoa = 'Vui lòng nhập điểm!';
    } else if (khoa < 0) {
      errors.diemKhoa = 'Tuyệt đối không được nhập số âm!';
    } else if (khoa > maxChoPhep) {
      errors.diemKhoa = `Sinh viên đã tự chấm ${diemSV}đ. Chỉ được cộng tối đa ${maxChoPhep}đ!`;
    }

    setReviewErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitReview = async () => {
    if (!validateReview()) return;

    const diemSV = parseInt(selectedRecord.DiemTuDanhGia) || 0;
    const diemCong = parseInt(diemKhoa) || 0;
    const tongDiem = diemSV + diemCong;

    try {
      await axios.put(`${API_URL}/api/admin/training-points/${selectedRecord.MaDanhGia}`, {
        DiemKhoaDanhGia: diemCong,
        TongDiem: tongDiem,
        TrangThai: trangThaiDuyet,
        NguoiDuyet: 'admin'
      });
      setSelectedRecord(null);
      setReviewErrors({});
      fetchData();
      showToast('Xét duyệt điểm thành công!', 'success');
    } catch {
      showToast('Có lỗi xảy ra khi duyệt điểm!', 'error');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 80) return 'text-[#22C55E]';
    if (score >= 65) return 'text-[#3B82F6]';
    if (score >= 50) return 'text-amber-600';
    return 'text-[#EF4444]';
  };

  const getXepLoaiBadge = (xepLoai) => {
    const colors = {
      'Xuất sắc': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      'Tốt': 'bg-[#22C55E]/10 text-green-700 border border-green-200',
      'Khá': 'bg-[#3B82F6]/10 text-blue-700 border border-blue-200',
      'Trung bình': 'bg-amber-50 text-amber-700 border border-amber-200',
      'Yếu': 'bg-rose-50 text-rose-700 border border-rose-200'
    };
    return colors[xepLoai] || 'bg-[#F7F8FA] text-gray-700 border border-[#E5E7EB]';
  };

  const diemSVHienTai = selectedRecord ? (parseInt(selectedRecord.DiemTuDanhGia) || 0) : 0;
  const diemKhoaNhap = parseInt(diemKhoa) || 0;
  const tongDiemPreview = Math.min(diemSVHienTai + diemKhoaNhap, 100);

  // Tạo map chi tiết tiêu chí sinh viên tự đánh giá để hiển thị breakdown
  const detailsMap = {};
  recordDetails.forEach(d => {
    detailsMap[d.MaTieuChi] = {
      diem: d.DiemChon,
      index: d.ChiSoOption,
      Files: d.MinhChung ? JSON.parse(d.MinhChung) : []
    };
  });

  if (loading) return <TrainingPointsSkeleton />;

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative">

      {/* Toast component dùng chung */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: '', type: 'success' })}
      />

      {/* ConfirmDialog thay đổi trạng thái đợt */}
      <ConfirmDialog
        show={confirmModal.show}
        title="Xác nhận thay đổi trạng thái"
        message={`Bạn có chắc muốn chuyển trạng thái đợt đánh giá thành: "${confirmModal.newStatus}"?`}
        onConfirm={confirmTogglePeriodStatus}
        onCancel={() => setConfirmModal({ show: false, id: null, newStatus: '' })}
        type={confirmModal.newStatus === 'Đã đóng đợt' ? 'danger' : 'confirm'}
      />

      {/* ConfirmDialog xác nhận tạo đợt mới */}
      <ConfirmDialog
        show={isConfirmCreateOpen}
        title="Xác nhận tạo đợt đánh giá mới"
        message={`Bạn có chắc muốn tạo đợt đánh giá mới cho ${periodForm.HocKy.replace('HK', 'Học kỳ ')} năm học ${periodForm.NamHoc}?`}
        onConfirm={handleCreatePeriod}
        onCancel={() => setIsConfirmCreateOpen(false)}
        type="confirm"
      />



      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-[#F4C542] rounded-3xl p-8 shadow-lg relative overflow-hidden flex items-center gap-5"
      >
        <div className="p-4 bg-white/40 rounded-2xl relative z-10 backdrop-blur-sm">
          <Award className="w-10 h-10 text-[#152238]" />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-[#152238] mb-1">Cổng Rèn luyện</h2>
          <p className="text-[#152238]/70 text-lg">Quản lý đợt mở và Xét duyệt điểm sinh viên</p>
        </div>
        <Award className="absolute -right-6 -bottom-6 w-48 h-48 text-white opacity-10 transform rotate-12" />
      </motion.div>

      {/* Tabs */}
      <div className="flex bg-[#FFFFFF] rounded-2xl p-1.5 shadow-sm border border-[#E5E7EB] w-fit">
        <button
          onClick={() => setActiveTab('periods')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'periods' ? 'bg-[#F4C542]/20 text-[#B45309] shadow-sm' : 'text-[#6B7280] hover:bg-[#F7F8FA]'}`}
        >
          <CalendarDays className="w-5 h-5" /> Quản lý Đợt đánh giá
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'reviews' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-[#6B7280] hover:bg-[#F7F8FA]'}`}
        >
          <UserCheck className="w-5 h-5" /> Xét duyệt điểm SV
        </button>
      </div>

      <AnimatePresence mode="wait">

        {/* ======================================================= */}
        {/* TAB 1: QUẢN LÝ ĐỢT MỞ */}
        {/* ======================================================= */}
        {activeTab === 'periods' && (
          <motion.div key="periods" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#1F2937]">Danh sách các đợt đã thiết lập</h3>
              <button
                onClick={() => {
                  setPeriodForm({ HocKy: 'HK1', NamHoc: getCurrentNienKhoa(), NgayBatDau: getLocalDateString(), NgayKetThuc: '', TrangThai: 'Đang tự đánh giá', CauTrucTieuChi: [] });
                  setPeriodFormErrors({});
                  setIsPeriodModalOpen(true);
                }}
                className="bg-[#F4C542] hover:bg-[#F4C542]/90 text-[#152238] font-bold py-2.5 px-5 rounded-xl transition-colors shadow-sm flex items-center gap-2"
              >
                <PlusCircle className="w-5 h-5" /> Mở đợt mới
              </button>
            </div>

            <div className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#F7F8FA] text-[#6B7280] text-sm border-b border-[#E5E7EB]">
                      <th className="p-4 font-semibold w-16">ID</th>
                      <th className="p-4 font-semibold">Học kỳ / Năm học</th>
                      <th className="p-4 font-semibold">Thời gian mở</th>
                      <th className="p-4 font-semibold">Trạng thái</th>
                      <th className="p-4 font-semibold text-center">Điều khiển</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPeriods.map(p => (
                      <tr key={p.MaDotDanhGia} className="border-b border-gray-50 hover:bg-[#FFF7D6]/20 transition-colors">
                        <td className="p-4 font-bold text-gray-300">#{p.MaDotDanhGia}</td>
                        <td className="p-4 font-bold text-[#1F2937]">
                          {p.HocKy.replace('HK', 'Học kỳ ').replace(/_/g, ' ')}
                        </td>
                        <td className="p-4 text-sm text-[#6B7280] font-medium">
                          {formatDate(p.NgayBatDau)} <span className="mx-1 text-gray-300">→</span> {formatDate(p.NgayKetThuc)}
                        </td>
                        <td className="p-4">
                          {p.TrangThai === 'Đang tự đánh giá' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-[#22C55E]/10 text-green-700 border border-green-200">
                              <PlayCircle className="w-3.5 h-3.5" /> Đang mở cho SV
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-gray-100 text-[#6B7280] border border-[#E5E7EB]">
                              <StopCircle className="w-3.5 h-3.5" /> Đã đóng
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleTogglePeriodStatus(p.MaDotDanhGia, p.TrangThai)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border ${p.TrangThai === 'Đang tự đánh giá' ? 'bg-red-100 text-[#DC2626] border-red-200 hover:bg-red-600 hover:text-white' : 'bg-[#22C55E]/10 text-[#22C55E] border-green-200 hover:bg-green-600 hover:text-white'}`}
                          >
                            <Power className="w-3.5 h-3.5 inline mr-1" />
                            {p.TrangThai === 'Đang tự đánh giá' ? 'Đóng đợt này' : 'Mở lại đợt'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {periods.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-gray-300 italic">Chưa có đợt đánh giá nào được tạo.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPagesPeriods > 1 && (
              <div className="mt-4 pb-4">
                <Pagination
                  currentPage={currentPagePeriods}
                  totalPages={totalPagesPeriods}
                  onPageChange={setCurrentPagePeriods}
                />
              </div>
            )}
          </motion.div>
        )}

        {/* ======================================================= */}
        {/* TAB 2: XÉT DUYỆT ĐIỂM */}
        {/* ======================================================= */}
        {activeTab === 'reviews' && (
          <motion.div key="reviews" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">

            {/* THỐNG KÊ TỔNG QUAN (Summary Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
              <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#E5E7EB] shadow-sm flex items-center gap-4">
                <div className="p-3 bg-[#3B82F6]/10 rounded-xl text-[#3B82F6]"><Users className="w-6 h-6" /></div>
                <div>
                  <p className="text-xs font-bold text-gray-300 uppercase">Tổng SV đã nộp</p>
                  <p className="text-2xl font-black text-[#1F2937]">{totalSubmitted}</p>
                </div>
              </div>
              <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#E5E7EB] shadow-sm flex items-center gap-4">
                <div className="p-3 bg-amber-50 rounded-xl text-amber-600"><Clock className="w-6 h-6" /></div>
                <div>
                  <p className="text-xs font-bold text-gray-300 uppercase">Đang chờ duyệt</p>
                  <p className="text-2xl font-black text-[#1F2937]">{totalPending}</p>
                </div>
              </div>
              <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#E5E7EB] shadow-sm flex items-center gap-4">
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><CheckCircle2 className="w-6 h-6" /></div>
                <div>
                  <p className="text-xs font-bold text-gray-300 uppercase">Đã xác nhận</p>
                  <p className="text-2xl font-black text-[#1F2937]">{totalApproved}</p>
                </div>
              </div>
            </div>

            {/* Bộ lọc & Tìm kiếm */}
            <div className="bg-[#FFFFFF] p-4 rounded-2xl shadow-sm border border-[#E5E7EB] flex flex-wrap gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-3 items-center flex-1">
                <div className="flex items-center gap-2 text-[#6B7280] font-semibold text-sm">
                  <Filter className="w-4 h-4" /> Bộ lọc:
                </div>
                <select
                  value={filterHocKy} onChange={e => setFilterHocKy(e.target.value)}
                  className="px-4 py-2.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 outline-none"
                >
                  <option value="All">Tất cả học kỳ</option>
                  {uniqueSemesters.map(hk => (
                    <option key={hk} value={hk}>{hk.replace('HK', 'Học kỳ ').replace(/_/g, ' ')}</option>
                  ))}
                </select>
                <select
                  value={filterTrangThai} onChange={e => setFilterTrangThai(e.target.value)}
                  className="px-4 py-2.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 outline-none"
                >
                  <option value="All">Tất cả trạng thái</option>
                  <option value="Chờ lớp duyệt">Chờ duyệt</option>
                  <option value="Đã xác nhận">Đã xác nhận</option>
                </select>
                <select
                  value={filterKhoa}
                  onChange={e => {
                    setFilterKhoa(e.target.value);
                    setFilterLop('All');
                  }}
                  className="px-4 py-2.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 outline-none"
                >
                  <option value="All">Tất cả khoa</option>
                  {faculties.map(k => (
                    <option key={k.MaKhoa} value={k.MaKhoa}>{k.TenKhoa}</option>
                  ))}
                </select>
                <select
                  value={filterLop}
                  onChange={e => setFilterLop(e.target.value)}
                  className="px-4 py-2.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 outline-none"
                >
                  <option value="All">Tất cả lớp</option>
                  {(filterKhoa === 'All' ? classes : classes.filter(c => c.MaKhoa === filterKhoa)).map(l => (
                    <option key={l.MaLop} value={l.MaLop}>{l.TenLop || l.MaLop}</option>
                  ))}
                </select>
                <div className="relative w-full max-w-[280px]">
                  <Search className="w-4 h-4 text-gray-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm theo MSSV / Họ tên..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-[#FFFFFF] transition-all outline-none"
                  />
                </div>
              </div>

              {/* Nút hành động */}
              <div className="flex items-center gap-2 shrink-0">

                <button
                  onClick={handleOpenAllLogs}
                  className="px-5 py-2.5 bg-[#FFFFFF] border border-[#E5E7EB] hover:bg-[#F7F8FA] text-gray-700 font-bold text-sm rounded-xl transition-all shadow-sm flex items-center gap-2"
                >
                  <Clock className="w-4 h-4 text-[#F4C542]" /> Nhật ký duyệt
                </button>
              </div>
            </div>

            {/* Bảng dữ liệu Sinh viên */}
            <div className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[950px]">
                  <thead>
                    <tr className="bg-[#F7F8FA] border-b border-[#E5E7EB] text-[#6B7280] text-sm">

                      <th className="p-4 font-semibold w-1/4">Sinh viên</th>
                      <th className="p-4 font-semibold">Học kỳ</th>
                      <th className="p-4 font-semibold text-center">SV Tự ĐG</th>
                      <th className="p-4 font-semibold text-center">Cộng thêm</th>
                      <th className="p-4 font-semibold text-center">Tổng điểm</th>
                      <th className="p-4 font-semibold text-center">Xếp loại</th>
                      <th className="p-4 font-semibold">Trạng thái</th>
                      <th className="p-4 font-semibold text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentReviews.map((item) => {
                      return (
                        <tr key={item.MaDanhGia} className="border-b border-gray-50 transition-colors hover:bg-[#3B82F6]/10/10">
                          <td className="p-4">
                            <p className="font-bold text-[#1F2937] leading-tight">{item.HoTen}</p>
                            <p className="text-xs text-[#6B7280] font-medium mt-1">{item.MSSV} · Lớp: {item.MaLop}</p>
                          </td>
                          <td className="p-4 text-sm font-medium text-[#6B7280]">
                            {item.HocKy.replace('HK', 'HK ').replace(/_/g, ' ')}
                          </td>
                          <td className="p-4 text-center font-bold text-[#3B82F6] bg-[#3B82F6]/10/20">{item.DiemTuDanhGia}</td>
                          <td className="p-4 text-center font-bold text-[#6B7280]">{item.DiemKhoaDanhGia || '0'}</td>
                          <td className="p-4 text-center">
                            <span className={`text-lg font-black ${getScoreColor(item.TongDiem || item.DiemTuDanhGia)}`}>
                              {item.TongDiem || item.DiemTuDanhGia}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getXepLoaiBadge(item.XepLoai)}`}>
                              {item.XepLoai || 'Chưa xếp loại'}
                            </span>
                          </td>
                          <td className="p-4">
                            {item.TrangThai === 'Đã xác nhận' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Đã xác nhận
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">
                                <Clock className="w-3 h-3" /> Chờ duyệt
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-center text-nowrap">
                            <button
                              onClick={() => handleOpenReviewModal(item)}
                              className="px-4 py-2 bg-[#FFFFFF] border border-blue-200 text-[#3B82F6] hover:bg-blue-600 hover:text-white rounded-lg font-bold text-xs transition-colors shadow-sm inline-flex items-center gap-1.5"
                            >
                              <Edit className="w-3.5 h-3.5" /> Duyệt
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredData.length === 0 && (
                      <tr><td colSpan={9} className="p-12 text-center text-gray-300 italic">Không tìm thấy phiếu đánh giá phù hợp.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPagesReviews > 1 && (
              <div className="mt-4 pb-4">
                <Pagination
                  currentPage={currentPageReviews}
                  totalPages={totalPagesReviews}
                  onPageChange={setCurrentPageReviews}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================================================= */}
      {/* MODAL: TẠO ĐỢT MỞ MỚI & THIẾT KẾ TIÊU CHÍ */}
      {/* ======================================================= */}
      <AnimatePresence>
        {isPeriodModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#FFFFFF] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
              <div className="bg-[#F4C542] p-5 flex justify-between items-center text-[#152238] shrink-0">
                <h3 className="text-lg font-bold flex items-center gap-2"><CalendarDays className="w-5 h-5" /> Thiết lập đợt đánh giá</h3>
                <button onClick={() => { setIsPeriodModalOpen(false); setPeriodModalTab('info'); }} className="p-1 hover:bg-white/40 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-[#E5E7EB] bg-[#F7F8FA] shrink-0">
                <button onClick={() => setPeriodModalTab('info')} className={`flex-1 py-3 font-bold text-sm border-b-2 transition-colors ${periodModalTab === 'info' ? 'border-[#F4C542] text-[#F4C542] bg-[#FFFFFF]' : 'border-transparent text-[#6B7280] hover:text-gray-700'}`}>
                  1. Thông tin chung
                </button>
                <button onClick={() => setPeriodModalTab('builder')} className={`flex-1 py-3 font-bold text-sm border-b-2 transition-colors flex items-center justify-center gap-2 ${periodModalTab === 'builder' ? 'border-[#F4C542] text-[#F4C542] bg-[#FFFFFF]' : 'border-transparent text-[#6B7280] hover:text-gray-700'}`}>
                  2. Thiết kế bộ tiêu chí
                  {(() => {
                    let t = 0;
                    periodForm.CauTrucTieuChi?.forEach(s => s.items?.forEach(i => { t += Math.max(0, ...i.options.map(o => Number(o.point) || 0)); }));
                    return <span className={`px-2 py-0.5 rounded text-xs text-white ${t === 100 ? 'bg-[#22C55E]/100' : 'bg-[#EF4444]/100'}`}>{t}/100</span>;
                  })()}
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                {periodModalTab === 'info' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Học kỳ</label>
                        <select value={periodForm.HocKy} onChange={e => setPeriodForm({ ...periodForm, HocKy: e.target.value })} className="w-full p-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl outline-none font-bold text-gray-700">
                          <option value="HK1">Học kỳ 1</option>
                          <option value="HK2">Học kỳ 2</option>
                          <option value="HK3">Học kỳ 3</option>
                        </select>
                        <p className="text-[11px] text-gray-300 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> Chọn học kỳ áp dụng cho đợt đánh giá này.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Năm học (Niên khóa)</label>
                        <input type="text" value={periodForm.NamHoc} readOnly disabled className="w-full p-3 bg-gray-100 border border-[#E5E7EB] rounded-xl outline-none font-bold text-[#6B7280] cursor-not-allowed" />
                        <p className="text-[11px] text-gray-300 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> Niên khóa tự động tính theo năm hiện tại.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Ngày bắt đầu <span className="text-[#EF4444]">*</span></label>
                        <input type="date" value={periodForm.NgayBatDau} onChange={e => handleNgayChange('NgayBatDau', e.target.value)} max={maxNgay || undefined} disabled={!nienKhoaRange} className={`w-full p-3 bg-[#FFFFFF] border rounded-xl outline-none text-sm text-[#6B7280] disabled:bg-gray-100 disabled:cursor-not-allowed ${periodFormErrors.NgayBatDau ? 'border-red-500 focus:border-red-500' : 'border-[#E5E7EB]'}`} />
                        {periodFormErrors.NgayBatDau ? (
                          <p className="text-[#EF4444] text-xs mt-1.5 font-medium flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {periodFormErrors.NgayBatDau}</p>
                        ) : (
                          <p className="text-[11px] text-gray-300 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> Có thể chọn để xem thông báo lỗi nếu là ngày quá khứ.</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Ngày kết thúc <span className="text-[#EF4444]">*</span></label>
                        <input type="date" value={periodForm.NgayKetThuc} onChange={e => handleNgayChange('NgayKetThuc', e.target.value)} max={maxNgay || undefined} disabled={!nienKhoaRange} className={`w-full p-3 bg-[#FFFFFF] border rounded-xl outline-none text-sm text-[#6B7280] disabled:bg-gray-100 disabled:cursor-not-allowed ${periodFormErrors.NgayKetThuc ? 'border-red-500 focus:border-red-500' : 'border-[#E5E7EB]'}`} />
                        {periodFormErrors.NgayKetThuc ? (
                          <p className="text-[#EF4444] text-xs mt-1.5 font-medium flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {periodFormErrors.NgayKetThuc}</p>
                        ) : (
                          <p className="text-[11px] text-gray-300 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> Phải sau ngày bắt đầu ít nhất 1 ngày.</p>
                        )}
                      </div>
                    </div>
                    {nienKhoaRange && <p className="text-[11px] text-gray-300 -mt-2 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> Khoảng thời gian hợp lệ đến tối đa {nienKhoaRange.end}-12-31</p>}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Trạng thái khởi tạo</label>
                      <select value={periodForm.TrangThai} onChange={e => setPeriodForm({ ...periodForm, TrangThai: e.target.value })} className="w-full p-3 bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl outline-none text-sm font-bold text-[#22C55E]">
                        <option value="Đang tự đánh giá">Mở cho phép Sinh viên làm bài ngay</option>
                        <option value="Đã đóng đợt">Đóng (Lưu nháp)</option>
                      </select>
                      <p className="text-[11px] text-gray-300 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> Trạng thái ban đầu sau khi tạo xong đợt này.</p>
                    </div>
                  </div>
                )}

                {periodModalTab === 'builder' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-sm text-[#6B7280] font-medium">Bạn có thể tự thiết kế bộ tiêu chí động riêng cho đợt này.</p>
                      <button onClick={() => setPeriodForm({ ...periodForm, CauTrucTieuChi: JSON.parse(JSON.stringify(DEFAULT_CRITERIA)) })} className="text-xs font-bold bg-[#F4C542]/20 text-[#B45309] px-3 py-1.5 rounded-lg hover:bg-amber-200 transition-colors">
                        Dùng mẫu mặc định
                      </button>
                    </div>

                    {periodForm.CauTrucTieuChi?.map((sec, secIdx) => (
                      <div key={sec.id} className="border border-[#E5E7EB] rounded-xl bg-[#F7F8FA] overflow-hidden">
                        <div className="bg-gray-200/50 p-3 flex justify-between items-center border-b border-[#E5E7EB]">
                          <input
                            type="text"
                            value={sec.title}
                            onChange={e => {
                              const newCriteria = [...periodForm.CauTrucTieuChi];
                              newCriteria[secIdx].title = e.target.value;
                              setPeriodForm({ ...periodForm, CauTrucTieuChi: newCriteria });
                            }}
                            className="font-bold text-gray-700 bg-transparent border-none outline-none w-full focus:bg-[#FFFFFF] focus:ring-2 focus:ring-amber-200 rounded px-2 py-1"
                            placeholder="Nhập tên nhóm tiêu chí..."
                          />
                          <button onClick={() => {
                            const newCriteria = [...periodForm.CauTrucTieuChi];
                            newCriteria.splice(secIdx, 1);
                            setPeriodForm({ ...periodForm, CauTrucTieuChi: newCriteria });
                          }} className="text-red-400 hover:text-[#EF4444] p-1 ml-2"><X className="w-4 h-4" /></button>
                        </div>

                        <div className="p-4 space-y-4">
                          {sec.items.map((item, itemIdx) => (
                            <div key={item.id} className="bg-[#FFFFFF] border border-[#E5E7EB] p-3 rounded-lg shadow-sm">
                              <div className="flex gap-2 items-start mb-3">
                                <input
                                  type="text"
                                  value={item.id}
                                  onChange={e => {
                                    const newCriteria = [...periodForm.CauTrucTieuChi];
                                    newCriteria[secIdx].items[itemIdx].id = e.target.value;
                                    setPeriodForm({ ...periodForm, CauTrucTieuChi: newCriteria });
                                  }}
                                  className="w-16 text-xs font-bold text-center border border-[#E5E7EB] rounded p-1.5 bg-[#F7F8FA] focus:bg-[#FFFFFF] outline-none"
                                  placeholder="Mã"
                                />
                                <input
                                  type="text"
                                  value={item.label}
                                  onChange={e => {
                                    const newCriteria = [...periodForm.CauTrucTieuChi];
                                    newCriteria[secIdx].items[itemIdx].label = e.target.value;
                                    setPeriodForm({ ...periodForm, CauTrucTieuChi: newCriteria });
                                  }}
                                  className="flex-1 text-sm font-semibold border border-[#E5E7EB] rounded p-1.5 focus:bg-[#FFFFFF] focus:ring-1 focus:ring-amber-300 outline-none"
                                  placeholder="Nội dung tiêu chí..."
                                />
                                <button onClick={() => {
                                  const newCriteria = [...periodForm.CauTrucTieuChi];
                                  newCriteria[secIdx].items.splice(itemIdx, 1);
                                  setPeriodForm({ ...periodForm, CauTrucTieuChi: newCriteria });
                                }} className="text-red-400 hover:text-[#EF4444] p-1"><X className="w-4 h-4" /></button>
                              </div>

                              <div className="pl-8 space-y-2">
                                {item.options.map((opt, optIdx) => (
                                  <div key={optIdx} className="flex gap-2 items-center">
                                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                    <input
                                      type="text"
                                      value={opt.label}
                                      onChange={e => {
                                        const newCriteria = [...periodForm.CauTrucTieuChi];
                                        newCriteria[secIdx].items[itemIdx].options[optIdx].label = e.target.value;
                                        setPeriodForm({ ...periodForm, CauTrucTieuChi: newCriteria });
                                      }}
                                      className="flex-1 text-xs border border-[#E5E7EB] rounded px-2 py-1 focus:bg-[#FFFFFF] focus:border-amber-300 outline-none"
                                      placeholder="Mô tả mức điểm..."
                                    />
                                    <input
                                      type="number"
                                      value={opt.point}
                                      onChange={e => {
                                        const newCriteria = [...periodForm.CauTrucTieuChi];
                                        newCriteria[secIdx].items[itemIdx].options[optIdx].point = Number(e.target.value);
                                        setPeriodForm({ ...periodForm, CauTrucTieuChi: newCriteria });
                                      }}
                                      className="w-16 text-xs text-center border border-[#E5E7EB] rounded px-2 py-1 font-bold text-[#F4C542] focus:bg-[#FFFFFF] focus:border-amber-300 outline-none"
                                      placeholder="Điểm"
                                    />
                                    <button onClick={() => {
                                      const newCriteria = [...periodForm.CauTrucTieuChi];
                                      newCriteria[secIdx].items[itemIdx].options.splice(optIdx, 1);
                                      setPeriodForm({ ...periodForm, CauTrucTieuChi: newCriteria });
                                    }} className="text-gray-300 hover:text-[#EF4444]"><X className="w-3 h-3" /></button>
                                  </div>
                                ))}
                                <button onClick={() => {
                                  const newCriteria = [...periodForm.CauTrucTieuChi];
                                  newCriteria[secIdx].items[itemIdx].options.push({ label: 'Mức điểm mới', point: 0 });
                                  setPeriodForm({ ...periodForm, CauTrucTieuChi: newCriteria });
                                }} className="text-xs text-[#3B82F6] font-bold flex items-center gap-1 hover:text-blue-700 mt-1"><PlusCircle className="w-3 h-3" /> Thêm...</button>
                              </div>
                            </div>
                          ))}

                          <button onClick={() => {
                            const newCriteria = [...periodForm.CauTrucTieuChi];
                            newCriteria[secIdx].items.push({
                              id: `new-${Date.now().toString().slice(-4)}`,
                              label: 'Tiêu chí mới',
                              options: [{ label: 'Đạt (+10đ)', point: 10 }, { label: 'Không đạt (+0đ)', point: 0 }]
                            });
                            setPeriodForm({ ...periodForm, CauTrucTieuChi: newCriteria });
                          }} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm font-bold text-[#6B7280] hover:bg-gray-100 hover:border-gray-400 transition-colors flex items-center justify-center gap-2">
                            <PlusCircle className="w-4 h-4" /> Thêm tiêu chí con
                          </button>
                        </div>
                      </div>
                    ))}

                    <button onClick={() => {
                      const newCriteria = [...periodForm.CauTrucTieuChi];
                      newCriteria.push({
                        id: `sec-${Date.now()}`,
                        title: 'Nhóm tiêu chí mới',
                        items: []
                      });
                      setPeriodForm({ ...periodForm, CauTrucTieuChi: newCriteria });
                    }} className="w-full py-3 bg-[#F4C542]/20 text-[#B45309] rounded-xl font-bold border border-[#F4C542]/30 hover:bg-[#FFF7D6] transition-colors flex items-center justify-center gap-2">
                      <PlusCircle className="w-5 h-5" /> Thêm nhóm tiêu chí
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-[#F7F8FA] p-4 border-t border-[#E5E7EB] flex justify-end gap-3 shrink-0">
                <button onClick={() => { setIsPeriodModalOpen(false); setPeriodModalTab('info'); setPeriodFormErrors({}); }} className="px-5 py-2.5 font-semibold text-[#6B7280] bg-[#FFFFFF] border border-gray-300 rounded-xl hover:bg-[#F7F8FA]">Hủy</button>
                {periodModalTab === 'info' ? (
                  <button onClick={() => {
                    const diffTime = new Date(periodForm.NgayKetThuc) - new Date(periodForm.NgayBatDau);
                    if (!periodForm.NgayBatDau || !periodForm.NgayKetThuc || diffTime < 24 * 60 * 60 * 1000 || periodForm.NgayBatDau < minNgay || periodForm.NgayKetThuc < minNgay) {
                      showToast('Vui lòng kiểm tra lại ngày hợp lệ (ngày kết thúc phải cách ngày bắt đầu ít nhất 1 ngày)!', 'error');
                      return;
                    }
                    setPeriodModalTab('builder');
                  }} className="px-6 py-2.5 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 flex items-center gap-2">
                    Tiếp theo (Thiết kế tiêu chí)
                  </button>
                ) : (
                  <button onClick={triggerCreatePeriod} className="px-6 py-2.5 font-bold text-white bg-[#F4C542] rounded-xl hover:bg-amber-700 shadow-md shadow-[#F4C542]/30 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> Xác nhận tạo đợt
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================= */}
      {/* MODAL: XÉT DUYỆT ĐIỂM + XEM BREAKDOWN & TIMELINE LOGS */}
      {/* ======================================================= */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#FFFFFF] w-full max-w-7xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]"
            >
              {/* Header Modal */}
              <div className="bg-blue-600 p-5 flex justify-between items-center text-white shrink-0">
                <h3 className="text-lg font-bold flex items-center gap-2"><UserCheck className="w-5 h-5" /> Xét duyệt điểm rèn luyện</h3>
                <button onClick={() => { setSelectedRecord(null); setReviewErrors({}); }} className="p-1.5 hover:bg-white/40 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>

              {/* Body Modal */}
              <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto">
                {/* Cột Trái: Thông tin xét duyệt & Timeline (5 cols) */}
                <div className="lg:col-span-5 space-y-5 border-r border-[#E5E7EB] lg:pr-6">
                  <div className="text-center bg-[#F7F8FA] rounded-2xl p-4 border border-[#E5E7EB]">
                    <h4 className="font-bold text-[#1F2937] text-lg leading-tight">{selectedRecord.HoTen}</h4>
                    <p className="text-xs text-[#6B7280] font-medium mt-1">{selectedRecord.MSSV} · Lớp: {selectedRecord.MaLop}</p>
                    <span className="mt-2 inline-block px-3 py-1 bg-[#FFFFFF] border border-[#E5E7EB] text-[#6B7280] font-bold rounded-lg text-xs">
                      {selectedRecord.HocKy.replace('HK', 'Học kỳ ').replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="bg-[#3B82F6]/10 border border-blue-100 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-blue-800">SV tự đánh giá:</span>
                      <span className="text-2xl font-black text-[#3B82F6]">{selectedRecord.DiemTuDanhGia}đ</span>
                    </div>
                    <p className="text-[10px] text-[#3B82F6] mt-2 italic flex gap-1 items-start">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Chỉ được phép cộng tối đa {100 - selectedRecord.DiemTuDanhGia} điểm để tổng không vượt 100.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Điểm Admin cộng thêm</label>
                    <input
                      type="number"
                      min="0"
                      max={100 - selectedRecord.DiemTuDanhGia}
                      value={diemKhoa}
                      onChange={e => setDiemKhoa(e.target.value)}
                      className={`w-full p-3 bg-[#FFFFFF] border ${reviewErrors.diemKhoa ? 'border-red-500 focus:border-red-500' : 'border-[#E5E7EB] focus:border-blue-400'} rounded-xl outline-none text-2xl font-black text-center transition-colors`}
                    />
                    {reviewErrors.diemKhoa && <p className="text-[#EF4444] text-xs mt-1.5 font-medium flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {reviewErrors.diemKhoa}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Trạng thái phê duyệt</label>
                    <select
                      value={trangThaiDuyet}
                      onChange={e => setTrangThaiDuyet(e.target.value)}
                      className="w-full p-3 bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl outline-none focus:border-blue-400 text-sm font-bold text-gray-700 transition-colors"
                    >
                      <option value="Chờ lớp duyệt">Lưu nháp (Chờ duyệt)</option>
                      <option value="Đã xác nhận">Đã xác nhận (Chốt sổ)</option>
                    </select>
                  </div>

                  <motion.div key={tongDiemPreview} initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
                    <div className="flex items-center gap-2 text-[#6B7280] text-sm font-bold"><Calculator className="w-5 h-5 text-[#3B82F6]" /> TỔNG ĐIỂM DỰ KIẾN:</div>
                    <span className={`text-4xl font-black ${getScoreColor(tongDiemPreview)}`}>{tongDiemPreview}đ</span>
                  </motion.div>

                  {/* Lịch sử phê duyệt (Timeline) */}
                  <div className="pt-4 border-t border-[#E5E7EB]">
                    <h5 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">Nhật ký phê duyệt</h5>
                    <div className="space-y-3 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                      {recordLogs.map((log) => (
                        <div key={log.MaLog} className="flex gap-2.5 items-start text-xs border-b border-gray-50 pb-2">
                          <div className="w-1.5 h-1.5 bg-[#3B82F6]/100 rounded-full mt-1.5 shrink-0" />
                          <div className="flex-1">
                            <p className="font-semibold text-gray-700 leading-tight">{log.HanhDong}</p>
                            <p className="text-[10px] text-gray-300 mt-1">{new Date(log.ThoiGian).toLocaleString('vi-VN')} · {log.NguoiDuyet}</p>
                          </div>
                        </div>
                      ))}
                      {recordLogs.length === 0 && (
                        <p className="text-[11px] text-gray-300 italic">Chưa có nhật ký phê duyệt.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cột Phải: Breakdown chi tiết tự chấm của SV (7 cols) */}
                <div className="lg:col-span-7 flex flex-col min-h-[300px]">
                  <h5 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-[#3B82F6]" /> Chi tiết phiếu tự đánh giá
                  </h5>
                  {loadingDetails ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-2">
                      <PlayCircle className="w-8 h-8 animate-spin text-[#3B82F6]" />
                      <span className="text-xs font-bold">Đang tải dữ liệu tự chấm...</span>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto pr-2 max-h-[500px] space-y-4 custom-scrollbar">
                      {(selectedRecord?.CauTrucTieuChi || DEFAULT_CRITERIA).map(sec => (
                        <div key={sec.id} className="border border-gray-150 rounded-xl overflow-hidden bg-[#FFFFFF] shadow-sm">
                          <div className="bg-[#F7F8FA] px-4 py-2 border-b border-gray-150">
                            <span className="text-xs font-bold text-gray-700">{sec.title}</span>
                          </div>
                          <div className="divide-y divide-gray-100">
                            {sec.items.map(item => {
                              const sel = detailsMap[item.id];
                              return (
                                <div key={item.id} className="p-4 flex gap-4 justify-between items-start">
                                  <div className="flex-1 space-y-1">
                                    <p className="text-xs font-semibold text-gray-700 leading-normal">{item.label}</p>
                                    {sel !== undefined ? (
                                      <p className="text-xs text-[#3B82F6] bg-[#3B82F6]/10/50 border border-blue-100 rounded-lg p-2 font-medium leading-relaxed">
                                        Lựa chọn: {item.options[sel.index]?.label || 'Chưa xác định'}
                                      </p>
                                    ) : (
                                      <p className="text-xs text-[#EF4444] italic bg-[#EF4444]/10 rounded-lg p-2 font-medium">
                                        Không tích chọn mục này
                                      </p>
                                    )}
                                    {sel !== undefined && sel.diem > 0 && (sel.Files && sel.Files.length > 0) && (
                                      <div className="mt-2 pl-1 space-y-2">
                                        {sel.Files && sel.Files.length > 0 && (
                                          <div className="space-y-2">
                                            <p className="text-[10px] font-bold text-[#3B82F6] uppercase tracking-wider">
                                              Tệp đính kèm ({sel.Files.length}/3)
                                            </p>
                                            {sel.Files.map((file, fileIndex) => (
                                              <div key={fileIndex} className="flex items-center gap-2 p-2 bg-[#3B82F6]/10 rounded-lg border border-blue-100">
                                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                                                  <FileImage className="w-4 h-4 text-[#3B82F6]" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-[11px] font-bold text-blue-800 truncate">{file.name}</p>
                                                  <p className="text-[10px] text-[#3B82F6]">{(file.data.length * 3 / 4 / 1024).toFixed(1)} KB</p>
                                                </div>
                                                {file.type.startsWith('image/') && (
                                                  <button
                                                    onClick={() => setPreviewImage(file.data)}
                                                    className="px-2 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-md hover:bg-blue-700 transition-colors shrink-0"
                                                  >
                                                    Xem ảnh
                                                  </button>
                                                )}
                                              </div>
                                            ))}
                                            {/* Image previews */}
                                            {sel.Files.filter(f => f.type.startsWith('image/')).length > 0 && (
                                              <div className="flex flex-wrap gap-2 mt-2">
                                                {sel.Files
                                                  .filter(f => f.type.startsWith('image/'))
                                                  .map((file, fileIndex) => (
                                                    <img
                                                      key={fileIndex}
                                                      src={file.data}
                                                      alt={`Minh chứng ${fileIndex + 1}`}
                                                      className="w-16 h-16 object-cover rounded-lg border border-blue-100 cursor-pointer hover:opacity-90 transition-opacity"
                                                      onClick={() => setPreviewImage(file.data)}
                                                    />
                                                  ))}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div className="shrink-0 bg-[#F7F8FA] px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] font-bold text-xs text-[#6B7280]">
                                    {sel !== undefined ? `+${sel.diem}đ` : '0đ'}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Modal */}
              <div className="bg-[#F7F8FA] p-4 border-t border-[#E5E7EB] flex justify-end gap-3 shrink-0">
                <button onClick={() => setSelectedRecord(null)} className="px-5 py-2.5 font-semibold text-[#6B7280] bg-[#FFFFFF] border border-gray-300 rounded-xl hover:bg-[#F7F8FA]">Hủy</button>
                <button onClick={handleSubmitReview} className="px-6 py-2.5 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Chốt điểm</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================= */}
      {/* MODAL: XEM TẤT CẢ LỊCH SỬ DUYỆT */}
      {/* ======================================================= */}
      <AnimatePresence>
        {isAllLogsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#FFFFFF] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="bg-[#F4C542] p-5 flex justify-between items-center text-[#152238] shrink-0">
                <h3 className="text-lg font-bold flex items-center gap-2"><Clock className="w-5 h-5" /> Nhật ký phê duyệt điểm rèn luyện</h3>
                <button onClick={() => setIsAllLogsModalOpen(false)} className="p-1.5 hover:bg-white/40 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 flex flex-col flex-1 overflow-hidden space-y-4">
                {/* Thanh tìm kiếm nhật ký */}
                <div className="relative shrink-0">
                  <Search className="w-4 h-4 text-gray-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm theo MSSV, Họ tên hoặc nội dung..."
                    value={allLogsSearch}
                    onChange={e => setAllLogsSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-100 focus:bg-[#FFFFFF] transition-all outline-none"
                  />
                </div>

                {/* Danh sách nhật ký */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                  {loadingAllLogs ? (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-300 gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-[#F4C542]" />
                      <span className="text-xs font-bold">Đang tải nhật ký...</span>
                    </div>
                  ) : (
                    <>
                      {allLogs
                        .filter(log => {
                          if (!allLogsSearch.trim()) return true;
                          const s = allLogsSearch.toLowerCase();
                          return (
                            (log.HoTen || '').toLowerCase().includes(s) ||
                            (log.MSSV || '').toLowerCase().includes(s) ||
                            (log.HanhDong || '').toLowerCase().includes(s) ||
                            (log.NguoiDuyet || '').toLowerCase().includes(s)
                          );
                        })
                        .map(log => (
                          <div key={log.MaLog} className="p-4 bg-[#F7F8FA] rounded-2xl border border-[#E5E7EB] hover:bg-[#FFF7D6]/15 transition-colors flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-[#F4C542]/20 text-[#B45309] flex items-center justify-center shrink-0">
                              <UserCheck className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                                <span className="font-bold text-[#1F2937] text-sm">{log.HoTen} <span className="text-gray-300 font-medium">({log.MSSV})</span></span>
                                <span className="text-[10px] font-bold bg-[#FFFFFF] px-2 py-0.5 rounded border border-[#E5E7EB] text-[#6B7280]">
                                  {log.HocKy.replace('HK', 'HK ').replace(/_/g, ' ')}
                                </span>
                              </div>
                              <p className="text-sm text-[#6B7280] font-medium leading-relaxed">{log.HanhDong}</p>
                              <div className="flex items-center gap-1.5 text-[10px] text-gray-300 mt-2 font-medium">
                                <span>Người duyệt: <strong className="text-[#6B7280]">{log.NguoiDuyet}</strong></span>
                                <span>•</span>
                                <span>{new Date(log.ThoiGian).toLocaleString('vi-VN')}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      {allLogs.length === 0 && (
                        <p className="text-center py-10 text-gray-300 italic text-sm">Chưa có nhật ký phê duyệt nào.</p>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="bg-[#F7F8FA] p-4 border-t border-[#E5E7EB] flex justify-end shrink-0">
                <button onClick={() => { setIsAllLogsModalOpen(false); setAllLogsSearch(''); }} className="px-6 py-2.5 font-bold text-[#6B7280] bg-[#FFFFFF] border border-gray-300 rounded-xl hover:bg-[#F7F8FA]">Đóng</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute -top-12 right-0 md:-right-12 p-2 bg-[#FFFFFF]/10 hover:bg-white/40 text-white rounded-full backdrop-blur-md transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={previewImage}
                alt="Bản xem trước minh chứng"
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}} />
    </div>
  );
}

export default AdminTrainingPoints;
