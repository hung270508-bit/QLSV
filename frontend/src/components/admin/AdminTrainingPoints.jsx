import { useState, useEffect } from 'react';
import API_URL from '../../api';
import { TrainingPointsSkeleton } from '../common/AdminSkeleton';
import Pagination from '../common/Pagination';
import ModalPortal, { Toast, ConfirmDialog } from '../common/ModalPortal';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award, Filter, CheckCircle2, Clock, X, Calculator,
  UserCheck, AlertCircle, CalendarDays, PlusCircle, Power,
  StopCircle, Search, Users, BookOpen, Loader2, FileImage, ChevronRight
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

  const parseAppealContent = (content) => {
    if (!content) return { text: '', fileData: null };
    const match = content.match(/\[FILE_MINH_CHUNG_START\]\n([\s\S]*?)\n\[FILE_MINH_CHUNG_END\]/);
    let text = content;
    let fileData = null;
    if (match) {
      text = content.replace(`\n\n[FILE_MINH_CHUNG_START]\n${match[1]}\n[FILE_MINH_CHUNG_END]`, '').trim();
      fileData = match[1];
    }
    return { text, fileData };
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
  const [trangThaiDuyet, setTrangThaiDuyet] = useState('Đã xác nhận');
  const [reviewErrors, setReviewErrors] = useState({});
  const [loading, setLoading] = useState(true);

  // States cho chi tiết phiếu tự đánh giá & lịch sử duyệt (Audit log)
  const [recordDetails, setRecordDetails] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // States hỗ trợ điều chỉnh chi tiết và ghi chú lý do
  const [adjustedItems, setAdjustedItems] = useState({});
  const [tempAdjustments, setTempAdjustments] = useState({});
  const [showAdjustmentForm, setShowAdjustmentForm] = useState({});
  const [adminComment, setAdminComment] = useState('');

  // State cho xem ảnh popup
  const [previewImage, setPreviewImage] = useState(null);

  // States cho khiếu nại (appeal) liên kết
  const [activeAppeal, setActiveAppeal] = useState(null);
  const [resolveAppealCheckbox, setResolveAppealCheckbox] = useState(false);



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
      const sortedPoints = (pointsRes.data || []).sort((a, b) => {
        if (a.MaDotDanhGia !== b.MaDotDanhGia) return a.MaDotDanhGia - b.MaDotDanhGia;
        return (a.MSSV || '').localeCompare(b.MSSV || '');
      });
      const sortedPeriods = (periodsRes.data || []).sort((a, b) => a.MaDotDanhGia - b.MaDotDanhGia);

      setPointsData(sortedPoints);
      setPeriods(sortedPeriods);
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
      console.error(error);
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
    setTrangThaiDuyet(record.TrangThai === 'Chờ lớp duyệt' ? 'Đã xác nhận' : record.TrangThai);
    setReviewErrors({});
    setRecordDetails([]);
    setAdjustedItems({});
    setAdminComment('');
    setActiveAppeal(null);
    setResolveAppealCheckbox(false);

    setLoadingDetails(true);
    try {
      const [detailsRes, supportRes] = await Promise.all([
        axios.get(`${API_URL}/api/training-points/${record.MaDanhGia}/details`),
        axios.get(`${API_URL}/api/support/student/${record.MSSV}`)
      ]);
      const details = detailsRes.data || [];
      setRecordDetails(details);

      // Find active appeal for this student in this semester
      const supportRequests = supportRes.data || [];
      const appealHocKy = record.HocKy.replace('HK', 'Học kỳ ').replace(/_/g, ' ');
      const appeal = supportRequests.find(req => 
        req.LoaiYeuCau === 'Khiếu nại điểm rèn luyện' &&
        req.ChuDe.includes(appealHocKy) &&
        req.TrangThai === 'Chờ xử lý'
      );
      setActiveAppeal(appeal || null);
      setResolveAppealCheckbox(!!appeal);

      // Khởi tạo trạng thái mặc định của các tiêu chí là đã đồng ý
      const initialAdjusted = {};
      details.forEach(ct => {
        initialAdjusted[ct.MaTieuChi] = {
          status: 'approved',
          diem: ct.DiemChon,
          lyDo: ''
        };
      });

      // Parse existing GhiChu to restore previous adjustments and comment
      if (record.GhiChu) {
        let comment = record.GhiChu;
        const match = record.GhiChu.match(/\[Chi tiết điều chỉnh: ([\s\S]*)\]/);
        if (match) {
          comment = record.GhiChu.replace(` | [Chi tiết điều chỉnh: ${match[1]}]`, '').replace(`[Chi tiết điều chỉnh: ${match[1]}]`, '').trim();
          const parts = match[1].split('; ');
          parts.forEach(part => {
            const m = part.match(/Mục (.*?): (-?[\d.]+)đ -> (-?[\d.]+)đ \(([\s\S]*)\)/);
            if (m && initialAdjusted[m[1]]) {
              initialAdjusted[m[1]] = {
                status: 'rejected',
                diem: m[3],
                lyDo: m[4] === 'Không có lý do riêng' ? '' : m[4]
              };
            }
          });
        }
        setAdminComment(comment);
      }

      setAdjustedItems(initialAdjusted);
    } catch (err) {
      console.error('Không thể tải chi tiết phiếu hoặc nhật ký duyệt:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Tạo map chi tiết tiêu chí sinh viên tự đánh giá để hiển thị breakdown
  const detailsMap = {};
  recordDetails.forEach(d => {
    detailsMap[d.MaTieuChi] = {
      diem: d.DiemChon,
      index: d.ChiSoOption,
      Files: d.MinhChung ? JSON.parse(d.MinhChung) : []
    };
  });

  const getTongDiemDuyet = () => {
    let total = 0;
    const criteriaList = selectedRecord?.CauTrucTieuChi ? (typeof selectedRecord.CauTrucTieuChi === 'string' ? JSON.parse(selectedRecord.CauTrucTieuChi) : selectedRecord.CauTrucTieuChi) : DEFAULT_CRITERIA;

    criteriaList.forEach(sec => {
      sec.items?.forEach(item => {
        const detail = detailsMap[item.id];
        const studentScore = detail ? detail.diem : 0;

        const adj = adjustedItems[item.id];
        if (adj && adj.status !== 'approved') {
          total += Number(adj.diem) || 0;
        } else {
          total += studentScore;
        }
      });
    });
    return Math.min(total, 100);
  };

  const tongDiemPreview = selectedRecord ? getTongDiemDuyet() : 0;
  const diemSVHienTai = selectedRecord ? (parseInt(selectedRecord.DiemTuDanhGia) || 0) : 0;
  const computedDiemKhoa = tongDiemPreview - diemSVHienTai;

  const compileGhiChu = () => {
    const adjustments = Object.entries(adjustedItems)
      .filter(([, data]) => data.status !== 'approved')
      .map(([id, data]) => {
        const original = detailsMap[id]?.diem || 0;
        return `Mục ${id}: ${original}đ -> ${data.diem}đ (${data.lyDo || 'Không có lý do riêng'})`;
      });

    let finalComment = adminComment.trim();
    if (adjustments.length > 0) {
      const adjustText = `[Chi tiết điều chỉnh: ${adjustments.join('; ')}]`;
      finalComment = finalComment ? `${finalComment} | ${adjustText}` : adjustText;
    }
    return finalComment;
  };

  const validateReview = () => {
    const errors = {};
    Object.entries(adjustedItems).forEach(([id, data]) => {
      if (data.status !== 'approved') {
        if (data.diem === '' || data.diem === null || isNaN(data.diem)) {
          errors[id] = 'Vui lòng nhập điểm!';
        } else {
          const score = Number(data.diem);
          if (score < 0) {
            errors[id] = 'Điểm không được âm!';
          }
        }
      }
    });
    setReviewErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitReview = async () => {
    if (!validateReview()) {
      showToast('Vui lòng kiểm tra lại các mục tiêu chí đã điều chỉnh!', 'error');
      return;
    }

    try {
      const ghiChuCompiled = compileGhiChu();
      await axios.put(`${API_URL}/api/admin/training-points/${selectedRecord.MaDanhGia}`, {
        DiemKhoaDanhGia: computedDiemKhoa,
        TongDiem: tongDiemPreview,
        TrangThai: trangThaiDuyet,
        NguoiDuyet: 'admin',
        GhiChu: ghiChuCompiled
      });

      // Nếu có khiếu nại hoạt động liên kết và admin chọn giải quyết khiếu nại này
      if (activeAppeal && resolveAppealCheckbox) {
        await axios.put(`${API_URL}/api/admin/support-requests/${activeAppeal.MaYeuCau}`, {
          TrangThai: 'Đã xử lý',
          PhanHoi: 'Đã cập nhật/xác nhận điểm rèn luyện sau khi xem xét khiếu nại.'
        });
      }

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
    if (score >= 35) return 'text-[#EF4444]';
    return 'text-red-700 font-black';
  };

  const getXepLoaiBadge = (xepLoai) => {
    const colors = {
      'Xuất sắc': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      'Tốt': 'bg-[#22C55E]/10 text-green-700 border border-green-200',
      'Khá': 'bg-[#3B82F6]/10 text-blue-700 border border-blue-200',
      'Trung bình': 'bg-amber-50 text-amber-700 border border-amber-200',
      'Yếu': 'bg-rose-50 text-rose-700 border border-rose-200',
      'Kém': 'bg-red-50 text-red-700 border border-red-200'
    };
    return colors[xepLoai] || 'bg-[#F7F8FA] text-gray-700 border border-[#E5E7EB]';
  };

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
                      <th className="p-4 font-semibold">Thời gian</th>
                      <th className="p-4 font-semibold">Trạng thái</th>
                      <th className="p-4 font-semibold text-center">Điều khiển</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPeriods.map(p => (
                      <tr key={p.MaDotDanhGia} className="border-b border-gray-50 hover:bg-[#F7F8FA] transition-colors">
                        <td className="p-4 text-xs font-bold text-gray-400">#{p.MaDotDanhGia}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                              {p.HocKy.split('_')[0].replace('HK', '')}
                            </div>
                            <div>
                              <p className="font-bold text-[#1F2937]">{p.HocKy.split('_')[0].replace('HK', 'Học kỳ ')}</p>
                              <p className="text-xs text-gray-500 font-medium">Năm học: {p.NamHoc || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-gray-700 flex items-center gap-2"><CalendarDays className="w-3.5 h-3.5 text-emerald-500" /> Từ: {formatDate(p.NgayBatDau)}</span>
                            <span className="text-sm font-medium text-gray-500 flex items-center gap-2"><CalendarDays className="w-3.5 h-3.5 text-rose-400" /> Đến: {formatDate(p.NgayKetThuc)}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          {p.TrangThai === 'Đang tự đánh giá' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#22C55E]/10 text-green-700 border border-green-100">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                              </span>
                              Đang mở cho SV
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-[#6B7280] border border-[#E5E7EB]">
                              <StopCircle className="w-3.5 h-3.5" /> Đã đóng
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleTogglePeriodStatus(p.MaDotDanhGia, p.TrangThai)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${p.TrangThai === 'Đang tự đánh giá' ? 'bg-red-50 text-[#DC2626] border-red-200 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'}`}
                          >
                            <Power className="w-3.5 h-3.5 inline mr-1" />
                            {p.TrangThai === 'Đang tự đánh giá' ? 'Đóng đợt' : 'Mở lại đợt'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {periods.length === 0 && <tr><td colSpan="5" className="p-12 text-center text-gray-400 font-medium">Chưa có đợt đánh giá nào được tạo.</td></tr>}
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
            <div className="bg-[#FFFFFF] p-4 lg:p-6 rounded-2xl shadow-sm border border-[#E5E7EB] flex flex-col gap-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-[#1F2937] font-bold text-base">
                  <Filter className="w-5 h-5 text-blue-500" /> Bộ lọc danh sách
                </div>
                
                {/* Vùng tìm kiếm và Hành động */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                  <div className="relative w-full sm:w-[300px]">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm theo MSSV, Họ tên sinh viên..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-[#FFFFFF] transition-all outline-none text-gray-700"
                    />
                  </div>
                  <button
                    onClick={handleOpenAllLogs}
                    className="w-full sm:w-auto px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Clock className="w-4 h-4" /> Nhật ký duyệt
                  </button>
                </div>
              </div>

              {/* Vùng dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full pt-4 border-t border-gray-100">
                <select
                  value={filterHocKy} onChange={e => setFilterHocKy(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl text-sm font-semibold focus:outline-none focus:border-blue-400 focus:bg-[#FFFFFF] transition-colors text-gray-700 cursor-pointer"
                >
                  <option value="All">Tất cả học kỳ</option>
                  {uniqueSemesters.map(hk => (
                    <option key={hk} value={hk}>{hk.split('_')[0].replace('HK', 'Học kỳ ')}{hk.includes('_') ? ` (${hk.split('_')[1]}-${hk.split('_')[2]})` : ''}</option>
                  ))}
                </select>

                <select
                  value={filterKhoa}
                  onChange={e => {
                    setFilterKhoa(e.target.value);
                    setFilterLop('All');
                  }}
                  className="w-full px-4 py-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl text-sm font-semibold focus:outline-none focus:border-blue-400 focus:bg-[#FFFFFF] transition-colors text-gray-700 cursor-pointer"
                >
                  <option value="All">Tất cả khoa</option>
                  {faculties.map(k => (
                    <option key={k.MaKhoa} value={k.MaKhoa}>{k.TenKhoa}</option>
                  ))}
                </select>

                <select
                  value={filterLop}
                  onChange={e => setFilterLop(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl text-sm font-semibold focus:outline-none focus:border-blue-400 focus:bg-[#FFFFFF] transition-colors text-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={filterKhoa === 'All' && classes.length === 0}
                >
                  <option value="All">Tất cả lớp</option>
                  {(filterKhoa === 'All' ? classes : classes.filter(c => c.MaKhoa === filterKhoa)).map(l => (
                    <option key={l.MaLop} value={l.MaLop}>{l.TenLop || l.MaLop}</option>
                  ))}
                </select>

                <select
                  value={filterTrangThai} onChange={e => setFilterTrangThai(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl text-sm font-semibold focus:outline-none focus:border-blue-400 focus:bg-[#FFFFFF] transition-colors text-gray-700 cursor-pointer"
                >
                  <option value="All">Tất cả trạng thái</option>
                  <option value="Chờ lớp duyệt">Chờ duyệt</option>
                  <option value="Đã xác nhận">Đã xác nhận</option>
                </select>
              </div>
            </div>

            {/* Bảng dữ liệu Sinh viên */}
            <div className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[950px]">
                  <thead>
                    <tr className="bg-[#F7F8FA] border-b border-[#E5E7EB] text-[#6B7280] text-sm">
                      <th className="p-4 font-semibold">Sinh viên</th>
                      <th className="p-4 font-semibold text-center">Tự ĐG</th>
                      <th className="p-4 font-semibold text-center">Admin chấm</th>
                      <th className="p-4 font-semibold text-center">Tổng ĐRL</th>
                      <th className="p-4 font-semibold text-center">Xếp loại</th>
                      <th className="p-4 font-semibold">Trạng thái</th>
                      <th className="p-4 font-semibold text-right pr-6">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentReviews.map((item) => {
                      return (
                        <tr key={item.MaDanhGia} className="border-b border-gray-50 transition-colors hover:bg-blue-50/50 group">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-600 font-bold shrink-0">
                                {item.HoTen.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-[#1F2937] leading-tight">{item.HoTen}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[11px] text-[#6B7280] font-medium bg-gray-100 px-1.5 py-0.5 rounded border border-[#E5E7EB]">{item.MSSV}</span>
                                  <span className="text-[11px] text-[#6B7280] font-medium bg-gray-100 px-1.5 py-0.5 rounded border border-[#E5E7EB]">{item.MaLop}</span>
                                  <span className="text-[11px] text-[#6B7280] font-medium bg-gray-100 px-1.5 py-0.5 rounded border border-[#E5E7EB]">{item.HocKy.split('_')[0].replace('HK', 'HK ')}{item.HocKy.includes('_') ? ` (${item.HocKy.split('_')[1]}-${item.HocKy.split('_')[2]})` : ''}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 font-bold rounded-lg text-sm">{item.DiemTuDanhGia}</span>
                          </td>
                          <td className="p-4 text-center font-bold text-gray-500">
                            {item.DiemKhoaDanhGia > 0 ? `+${item.DiemKhoaDanhGia}` : (item.DiemKhoaDanhGia || '0')}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`text-lg font-black ${getScoreColor(item.TongDiem || item.DiemTuDanhGia)}`}>
                              {item.TongDiem || item.DiemTuDanhGia}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${getXepLoaiBadge(item.XepLoai)}`}>
                              {item.XepLoai || 'Chưa xếp loại'}
                            </span>
                          </td>
                          <td className="p-4">
                            {item.TrangThai === 'Đã xác nhận' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Đã duyệt
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">
                                <Clock className="w-3.5 h-3.5" /> Chờ duyệt
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right pr-6">
                            <button
                              onClick={() => handleOpenReviewModal(item)}
                              className="px-4 py-2 bg-white border border-[#E5E7EB] text-gray-700 group-hover:border-blue-500 group-hover:text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl font-bold text-xs transition-all shadow-sm inline-flex items-center gap-1.5"
                            >
                              Duyệt <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredData.length === 0 && (
                      <tr><td colSpan={7} className="p-12 text-center text-gray-400 font-medium">Không tìm thấy phiếu đánh giá phù hợp.</td></tr>
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
          <ModalPortal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#FFFFFF] w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
                {/* Header Modal */}
                <div className="bg-[#1F2937] p-5 flex justify-between items-center text-white shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <CalendarDays className="w-5 h-5 text-[#F4C542]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold leading-tight">Thiết lập đợt đánh giá</h3>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">Cấu hình thời gian và tiêu chí chấm điểm</p>
                    </div>
                  </div>
                  <button onClick={() => { setIsPeriodModalOpen(false); setPeriodModalTab('info'); }} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </div>

                {/* Tabs */}
                <div className="flex px-6 border-b border-[#E5E7EB] bg-gray-50/50 shrink-0">
                  <button onClick={() => setPeriodModalTab('info')} className={`py-4 px-6 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${periodModalTab === 'info' ? 'border-[#F4C542] text-[#1F2937]' : 'border-transparent text-[#6B7280] hover:text-gray-700'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${periodModalTab === 'info' ? 'bg-[#F4C542]/20 text-[#B45309]' : 'bg-gray-200 text-gray-500'}`}>1</div>
                    Thông tin chung
                  </button>
                  <button onClick={() => setPeriodModalTab('builder')} className={`py-4 px-6 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${periodModalTab === 'builder' ? 'border-[#F4C542] text-[#1F2937]' : 'border-transparent text-[#6B7280] hover:text-gray-700'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${periodModalTab === 'builder' ? 'bg-[#F4C542]/20 text-[#B45309]' : 'bg-gray-200 text-gray-500'}`}>2</div>
                    Thiết kế bộ tiêu chí
                    {(() => {
                      let t = 0;
                      periodForm.CauTrucTieuChi?.forEach(s => s.items?.forEach(i => { t += Math.max(0, ...i.options.map(o => Number(o.point) || 0)); }));
                      return <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-black text-white ${t === 100 ? 'bg-emerald-500' : 'bg-rose-500'}`}>{t}/100</span>;
                    })()}
                  </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar bg-gray-50/30">
                  {periodModalTab === 'info' && (
                    <div className="max-w-2xl mx-auto space-y-6">
                      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm space-y-5">
                        <h4 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-blue-500" /> Học kỳ & Thời gian</h4>
                        <div className="grid grid-cols-2 gap-5">
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Học kỳ</label>
                            <select value={periodForm.HocKy} onChange={e => setPeriodForm({ ...periodForm, HocKy: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-700 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all">
                              <option value="HK1">Học kỳ 1</option>
                              <option value="HK2">Học kỳ 2</option>
                              <option value="HK3">Học kỳ 3</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Niên khóa</label>
                            <input type="text" value={periodForm.NamHoc} readOnly disabled className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl outline-none font-bold text-gray-500 cursor-not-allowed" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Ngày bắt đầu <span className="text-red-500">*</span></label>
                            <input type="date" value={periodForm.NgayBatDau} onChange={e => handleNgayChange('NgayBatDau', e.target.value)} max={maxNgay || undefined} disabled={!nienKhoaRange} className={`w-full p-3 bg-white border rounded-xl outline-none text-sm text-gray-700 focus:ring-2 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed ${periodFormErrors.NgayBatDau ? 'border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-blue-400 focus:ring-blue-100'}`} />
                            {periodFormErrors.NgayBatDau && <p className="text-red-500 text-xs mt-1.5 font-bold flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {periodFormErrors.NgayBatDau}</p>}
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Ngày kết thúc <span className="text-red-500">*</span></label>
                            <input type="date" value={periodForm.NgayKetThuc} onChange={e => handleNgayChange('NgayKetThuc', e.target.value)} max={maxNgay || undefined} disabled={!nienKhoaRange} className={`w-full p-3 bg-white border rounded-xl outline-none text-sm text-gray-700 focus:ring-2 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed ${periodFormErrors.NgayKetThuc ? 'border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-blue-400 focus:ring-blue-100'}`} />
                            {periodFormErrors.NgayKetThuc && <p className="text-red-500 text-xs mt-1.5 font-bold flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {periodFormErrors.NgayKetThuc}</p>}
                          </div>
                        </div>
                        {nienKhoaRange && <p className="text-xs text-[#B45309] bg-[#F4C542]/10 p-2.5 rounded-lg border border-[#F4C542]/30 flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" /> Khung thời gian hợp lệ đến <b>{nienKhoaRange.end}-12-31</b> theo niên khóa.</p>}
                      </div>

                      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
                        <h4 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Trạng thái khởi tạo</h4>
                        <select value={periodForm.TrangThai} onChange={e => setPeriodForm({ ...periodForm, TrangThai: e.target.value })} className="w-full p-3.5 bg-white border border-gray-200 rounded-xl outline-none font-bold text-gray-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all">
                          <option value="Đang tự đánh giá">Mở cho phép Sinh viên làm bài ngay</option>
                          <option value="Đã đóng đợt">Đóng (Chỉ lưu nháp)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {periodModalTab === 'builder' && (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                        <div>
                          <h4 className="font-bold text-blue-900">Thiết kế tiêu chí động</h4>
                          <p className="text-sm text-blue-700 mt-0.5">Tùy chỉnh nhóm tiêu chí, mục điểm và các mức điểm cho đợt này.</p>
                        </div>
                        <button onClick={() => setPeriodForm({ ...periodForm, CauTrucTieuChi: JSON.parse(JSON.stringify(DEFAULT_CRITERIA)) })} className="text-sm font-bold bg-white text-blue-600 px-4 py-2 rounded-xl shadow-sm hover:bg-blue-600 hover:text-white transition-all border border-blue-200">
                          Khôi phục mẫu mặc định
                        </button>
                      </div>

                      <div className="space-y-5">
                        {periodForm.CauTrucTieuChi?.map((sec, secIdx) => (
                          <div key={sec.id} className="border border-[#E5E7EB] rounded-2xl bg-[#FFFFFF] shadow-sm overflow-hidden group/section">
                            <div className="bg-gray-50 p-4 flex justify-between items-center border-b border-[#E5E7EB]">
                              <div className="flex-1 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gray-200 text-gray-600 flex items-center justify-center font-black text-sm">
                                  {secIdx + 1}
                                </div>
                                <input
                                  type="text"
                                  value={sec.title}
                                  onChange={e => {
                                    const newCriteria = [...periodForm.CauTrucTieuChi];
                                    newCriteria[secIdx].title = e.target.value;
                                    setPeriodForm({ ...periodForm, CauTrucTieuChi: newCriteria });
                                  }}
                                  className="font-bold text-gray-800 text-lg bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 outline-none w-full max-w-lg transition-colors px-1"
                                  placeholder="Nhập tên nhóm tiêu chí..."
                                />
                              </div>
                              <button onClick={() => {
                                const newCriteria = [...periodForm.CauTrucTieuChi];
                                newCriteria.splice(secIdx, 1);
                                setPeriodForm({ ...periodForm, CauTrucTieuChi: newCriteria });
                              }} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Xóa nhóm này"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="p-5 space-y-4">
                              {sec.items.map((item, itemIdx) => (
                                <div key={item.id} className="bg-gray-50/50 border border-[#E5E7EB] p-4 rounded-xl relative group/item">
                                  <div className="flex gap-3 items-start mb-4">
                                    <input
                                      type="text"
                                      value={item.id}
                                      onChange={e => {
                                        const newCriteria = [...periodForm.CauTrucTieuChi];
                                        newCriteria[secIdx].items[itemIdx].id = e.target.value;
                                        setPeriodForm({ ...periodForm, CauTrucTieuChi: newCriteria });
                                      }}
                                      className="w-16 text-sm font-bold text-center border-b-2 border-gray-300 focus:border-blue-500 bg-transparent outline-none py-1 transition-colors"
                                      placeholder="Mã số (VD: 1.1)"
                                    />
                                    <textarea
                                      value={item.label}
                                      onChange={e => {
                                        const newCriteria = [...periodForm.CauTrucTieuChi];
                                        newCriteria[secIdx].items[itemIdx].label = e.target.value;
                                        setPeriodForm({ ...periodForm, CauTrucTieuChi: newCriteria });
                                      }}
                                      rows={1}
                                      className="flex-1 text-sm font-semibold border border-[#E5E7EB] rounded-lg p-2.5 bg-[#FFFFFF] focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none resize-none transition-all"
                                      placeholder="Nhập nội dung mô tả của tiêu chí này..."
                                    />
                                    <button onClick={() => {
                                      const newCriteria = [...periodForm.CauTrucTieuChi];
                                      newCriteria[secIdx].items.splice(itemIdx, 1);
                                      setPeriodForm({ ...periodForm, CauTrucTieuChi: newCriteria });
                                    }} className="text-gray-400 hover:text-red-500 mt-2 opacity-0 group-hover/item:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
                                  </div>

                                  <div className="pl-4 sm:pl-[76px] space-y-2">
                                    {item.options.map((opt, optIdx) => (
                                      <div key={optIdx} className="flex gap-3 items-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                        <input
                                          type="text"
                                          value={opt.label}
                                          onChange={e => {
                                            const newCriteria = [...periodForm.CauTrucTieuChi];
                                            newCriteria[secIdx].items[itemIdx].options[optIdx].label = e.target.value;
                                            setPeriodForm({ ...periodForm, CauTrucTieuChi: newCriteria });
                                          }}
                                          className="flex-1 text-sm border-b border-dashed border-gray-300 focus:border-blue-500 focus:border-solid bg-transparent px-1 py-1 outline-none transition-colors"
                                          placeholder="Mô tả mức điểm (VD: Học lực Xuất sắc, Đi học đầy đủ...)"
                                        />
                                        <div className="flex items-center gap-1 bg-white border border-[#E5E7EB] rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400">
                                          <input
                                            type="number"
                                            value={opt.point}
                                            onChange={e => {
                                              const newCriteria = [...periodForm.CauTrucTieuChi];
                                              newCriteria[secIdx].items[itemIdx].options[optIdx].point = Number(e.target.value);
                                              setPeriodForm({ ...periodForm, CauTrucTieuChi: newCriteria });
                                            }}
                                            className="w-16 text-sm text-center py-1.5 font-bold text-blue-600 bg-transparent outline-none"
                                            placeholder="Điểm số"
                                          />
                                          <span className="text-xs font-bold text-gray-400 pr-2">đ</span>
                                        </div>
                                        <button onClick={() => {
                                          const newCriteria = [...periodForm.CauTrucTieuChi];
                                          newCriteria[secIdx].items[itemIdx].options.splice(optIdx, 1);
                                          setPeriodForm({ ...periodForm, CauTrucTieuChi: newCriteria });
                                        }} className="text-gray-300 hover:text-red-500 p-1"><X className="w-4 h-4" /></button>
                                      </div>
                                    ))}
                                    <button onClick={() => {
                                      const newCriteria = [...periodForm.CauTrucTieuChi];
                                      newCriteria[secIdx].items[itemIdx].options.push({ label: 'Mức điểm mới', point: 0 });
                                      setPeriodForm({ ...periodForm, CauTrucTieuChi: newCriteria });
                                    }} className="text-xs text-blue-600 font-bold flex items-center gap-1.5 hover:bg-blue-50 px-2 py-1.5 rounded-lg w-max mt-2 transition-colors">
                                      <PlusCircle className="w-3.5 h-3.5" /> Thêm mức điểm
                                    </button>
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
                              }} className="w-full py-3 border-2 border-dashed border-blue-200 rounded-xl text-sm font-bold text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-colors flex items-center justify-center gap-2">
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
                        }} className="w-full py-4 bg-gray-50 text-gray-600 rounded-2xl font-bold border-2 border-dashed border-gray-300 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-800 transition-colors flex items-center justify-center gap-2">
                          <PlusCircle className="w-5 h-5" /> Thêm nhóm tiêu chí lớn
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white p-5 border-t border-gray-200 flex justify-end gap-3 shrink-0">
                  <button onClick={() => { setIsPeriodModalOpen(false); setPeriodModalTab('info'); setPeriodFormErrors({}); }} className="px-6 py-2.5 font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-700 transition-colors">Hủy thao tác</button>
                  {periodModalTab === 'info' ? (
                    <button onClick={() => {
                      const diffTime = new Date(periodForm.NgayKetThuc) - new Date(periodForm.NgayBatDau);
                      if (!periodForm.NgayBatDau || !periodForm.NgayKetThuc || diffTime < 24 * 60 * 60 * 1000 || periodForm.NgayBatDau < minNgay || periodForm.NgayKetThuc < minNgay) {
                        showToast('Vui lòng kiểm tra lại ngày hợp lệ (ngày kết thúc phải cách ngày bắt đầu ít nhất 1 ngày)!', 'error');
                        return;
                      }
                      setPeriodModalTab('builder');
                    }} className="px-6 py-2.5 font-bold text-[#1F2937] bg-[#F4C542] rounded-xl hover:bg-[#F4C542]/90 shadow-md flex items-center gap-2 transition-all">
                      Tiếp theo (Cấu hình tiêu chí) <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={triggerCreatePeriod} className="px-6 py-2.5 font-bold text-[#1F2937] bg-[#F4C542] rounded-xl hover:bg-[#F4C542]/90 shadow-md flex items-center gap-2 transition-all">
                      <CheckCircle2 className="w-5 h-5" /> Xác nhận tạo đợt
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          </ModalPortal>
        )}
      </AnimatePresence>

      {/* ======================================================= */}
      {/* MODAL: XÉT DUYỆT ĐIỂM + XEM BREAKDOWN & TIMELINE LOGS */}
      {/* ======================================================= */}
      <AnimatePresence>
        {selectedRecord && (
          <ModalPortal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#FFFFFF] w-[98vw] max-w-[98vw] rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[96vh] max-h-[96vh]"
              >
                {/* Header Modal */}
                <div className="bg-blue-600 p-5 flex justify-between items-center text-white shrink-0">
                  <h3 className="text-lg font-bold flex items-center gap-2"><UserCheck className="w-5 h-5" /> Xét duyệt điểm rèn luyện</h3>
                  <button onClick={() => { setSelectedRecord(null); setReviewErrors({}); }} className="p-1.5 hover:bg-white/40 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </div>

                {/* Body Modal */}
                <div className="flex-1 min-h-0 p-5 flex flex-col gap-5 overflow-y-auto bg-gray-50/50">

                  {/* 1. Header Info Card */}
                  <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#E5E7EB] shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6 shrink-0">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-[#3B82F6] font-bold text-2xl shrink-0">
                        {selectedRecord.HoTen.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-[#1F2937] text-xl leading-tight">{selectedRecord.HoTen}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="text-xs text-[#6B7280] font-medium bg-[#F7F8FA] px-2.5 py-1 rounded-md border border-[#E5E7EB]">
                            {selectedRecord.MSSV}
                          </span>
                          <span className="text-xs text-[#6B7280] font-medium bg-[#F7F8FA] px-2.5 py-1 rounded-md border border-[#E5E7EB]">
                            Lớp: {selectedRecord.MaLop}
                          </span>
                          <span className="text-xs text-[#6B7280] font-bold bg-[#F7F8FA] px-2.5 py-1 rounded-md border border-[#E5E7EB]">
                            {selectedRecord.HocKy.split('_')[0].replace('HK', 'Học kỳ ')}{selectedRecord.HocKy.includes('_') ? ` (${selectedRecord.HocKy.split('_')[1]}-${selectedRecord.HocKy.split('_')[2]})` : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 divide-x divide-gray-200">
                      <div className="text-center px-4">
                        <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-1">SV Tự đánh giá</p>
                        <p className="text-2xl font-black text-[#3B82F6]">{selectedRecord.DiemTuDanhGia}đ</p>
                      </div>
                      <div className="text-center px-4">
                        <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-1">Chênh lệch</p>
                        <p className={`text-2xl font-black ${computedDiemKhoa >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {computedDiemKhoa > 0 ? `+${computedDiemKhoa}` : computedDiemKhoa}đ
                        </p>
                      </div>
                      <div className="text-center px-4">
                        <p className="text-[11px] text-blue-600 font-bold uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                          <Calculator className="w-3.5 h-3.5" /> Tổng dự kiến
                        </p>
                        <p className={`text-4xl font-black ${getScoreColor(tongDiemPreview)}`}>{tongDiemPreview}đ</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
                    {/* Left Col: Breakdown chi tiết (8 cols) */}
                    <div className="lg:col-span-8 flex flex-col overflow-hidden bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] shadow-sm">
                      <div className="bg-[#F7F8FA] px-5 py-4 border-b border-[#E5E7EB] shrink-0">
                        <h5 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-[#3B82F6]" /> Chi tiết phiếu tự đánh giá
                        </h5>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {loadingDetails ? (
                          <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
                            <span className="text-sm font-bold">Đang tải dữ liệu tự chấm...</span>
                          </div>
                        ) : (
                          (selectedRecord?.CauTrucTieuChi || DEFAULT_CRITERIA).map(sec => (
                            <div key={sec.id} className="border border-[#E5E7EB] rounded-xl overflow-hidden bg-[#FFFFFF] shadow-sm">
                              <div className="bg-[#F7F8FA] px-4 py-3 border-b border-[#E5E7EB]">
                                <span className="text-sm font-bold text-gray-700">{sec.title}</span>
                              </div>
                              <div className="divide-y divide-gray-100">
                                {sec.items.map(item => {
                                  const sel = detailsMap[item.id];
                                  const maxPossible = Math.max(0, ...item.options.map(o => Number(o.point) || 0));
                                  const adj = adjustedItems[item.id];
                                  const isAdjusted = adj && adj.status !== 'approved';
                                  const currentScore = isAdjusted ? (adj.diem === '' ? 0 : Number(adj.diem)) : (sel ? sel.diem : 0);

                                  return (
                                    <div key={item.id} className="p-4 lg:p-5 flex flex-col xl:flex-row gap-4 xl:gap-6 justify-between items-start hover:bg-gray-50/50 transition-colors">
                                      <div className="flex-1 w-full space-y-2">
                                        <p className="text-sm font-semibold text-gray-800 leading-normal">{item.label}</p>

                                        {sel !== undefined ? (
                                          <p className="text-sm text-[#3B82F6] bg-[#3B82F6]/10 border border-blue-100 rounded-lg p-3 font-medium">
                                            <span className="font-bold mr-1">SV Chọn:</span> {item.options[sel.index]?.label || 'Chưa xác định'}
                                          </p>
                                        ) : (
                                          <p className="text-sm text-[#EF4444] italic bg-[#EF4444]/10 rounded-lg p-3 font-medium border border-red-100">
                                            SV không tích chọn mục này
                                          </p>
                                        )}

                                        {/* Panels Duyệt / Điều chỉnh tiêu chí */}
                                        {sel !== undefined && (
                                          <div className="mt-4 bg-[#FFFFFF] p-4 rounded-xl border border-[#E5E7EB] shadow-sm space-y-3">
                                            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                                              <span className="font-bold text-[#1F2937]">Quyết định điểm:</span>
                                              <div className="flex bg-[#F7F8FA] p-1 rounded-xl border border-gray-200">
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    setAdjustedItems(prev => ({ ...prev, [item.id]: { status: 'approved', diem: sel.diem, lyDo: '' } }));
                                                    setShowAdjustmentForm(prev => ({ ...prev, [item.id]: false }));
                                                    setTempAdjustments(prev => {
                                                      const copy = { ...prev };
                                                      delete copy[item.id];
                                                      return copy;
                                                    });
                                                    setReviewErrors(prev => {
                                                      const copy = { ...prev };
                                                      delete copy[item.id];
                                                      return copy;
                                                    });
                                                  }}
                                                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${(!adjustedItems[item.id] || adjustedItems[item.id].status === 'approved')
                                                    ? 'bg-emerald-100 text-emerald-700 shadow-sm'
                                                    : 'text-[#6B7280] hover:bg-gray-100'
                                                    }`}
                                                >
                                                  Đồng ý (+{sel.diem}đ)
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    setShowAdjustmentForm(prev => ({ ...prev, [item.id]: true }));
                                                    setTempAdjustments(prev => ({
                                                      ...prev,
                                                      [item.id]: {
                                                        diem: tempAdjustments[item.id]?.diem !== undefined 
                                                          ? tempAdjustments[item.id].diem 
                                                          : (adjustedItems[item.id]?.status !== 'approved' ? adjustedItems[item.id].diem : sel.diem),
                                                        lyDo: tempAdjustments[item.id]?.lyDo !== undefined 
                                                          ? tempAdjustments[item.id].lyDo 
                                                          : (adjustedItems[item.id]?.status !== 'approved' ? adjustedItems[item.id].lyDo : '')
                                                      }
                                                    }));
                                                  }}
                                                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${(adjustedItems[item.id] && adjustedItems[item.id].status !== 'approved')
                                                    ? 'bg-amber-100 text-amber-700 shadow-sm'
                                                    : 'text-[#6B7280] hover:bg-gray-100'
                                                    }`}
                                                >
                                                  Điều chỉnh
                                                </button>
                                              </div>
                                            </div>

                                            {/* Summary of applied adjustment when form is closed */}
                                            {adjustedItems[item.id] && adjustedItems[item.id].status !== 'approved' && !showAdjustmentForm[item.id] && (
                                              <div className="mt-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex justify-between items-center">
                                                <span>
                                                  <b>Đã điều chỉnh:</b> {adjustedItems[item.id].diem}đ (Lý do: {adjustedItems[item.id].lyDo || 'Không có lý do riêng'})
                                                </span>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    setTempAdjustments(prev => ({
                                                      ...prev,
                                                      [item.id]: { diem: adjustedItems[item.id].diem, lyDo: adjustedItems[item.id].lyDo }
                                                    }));
                                                    setShowAdjustmentForm(prev => ({ ...prev, [item.id]: true }));
                                                  }}
                                                  className="text-blue-600 hover:text-blue-800 font-bold transition-colors ml-2"
                                                >
                                                  Sửa
                                                </button>
                                              </div>
                                            )}

                                            <AnimatePresence>
                                              {showAdjustmentForm[item.id] && tempAdjustments[item.id] && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-3 pt-3 border-t border-gray-100 overflow-hidden">
                                                  <div className="flex flex-wrap items-center gap-3">
                                                    <span className="text-xs text-gray-700 font-bold shrink-0">Điểm thực tế:</span>
                                                    <input
                                                      type="number"
                                                      min="0" max={maxPossible}
                                                      placeholder="Nhập số điểm..."
                                                      value={tempAdjustments[item.id].diem}
                                                      onChange={e => {
                                                        const val = e.target.value;
                                                        setTempAdjustments(prev => ({
                                                          ...prev,
                                                          [item.id]: { ...prev[item.id], diem: val === '' ? '' : Number(val) }
                                                        }));
                                                      }}
                                                      className={`w-24 px-3 py-1.5 text-sm border rounded-lg font-bold text-center bg-[#FFFFFF] shadow-sm outline-none transition-all ${reviewErrors[item.id] ? 'border-red-500 text-red-600 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100'
                                                        }`}
                                                    />
                                                    <span className="text-xs text-gray-400 font-medium">(Tối đa: {maxPossible}đ)</span>
                                                  </div>
                                                  
                                                  <div className="flex flex-col gap-1.5">
                                                    <span className="text-xs text-gray-700 font-bold">Lý do điều chỉnh:</span>
                                                    <input
                                                      type="text" placeholder="Nhập lý do điều chỉnh cụ thể..."
                                                      value={tempAdjustments[item.id].lyDo || ''}
                                                      onChange={e => {
                                                        const val = e.target.value;
                                                        setTempAdjustments(prev => ({
                                                          ...prev,
                                                          [item.id]: { ...prev[item.id], lyDo: val }
                                                        }));
                                                      }}
                                                      className="w-full px-3 py-2 text-sm border border-gray-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 rounded-lg outline-none bg-[#FFFFFF] font-medium shadow-sm transition-all"
                                                    />
                                                  </div>
                                                  {reviewErrors[item.id] && <p className="text-[11px] text-red-500 font-bold">{reviewErrors[item.id]}</p>}

                                                  <div className="flex gap-2 justify-end pt-1">
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        setShowAdjustmentForm(prev => ({ ...prev, [item.id]: false }));
                                                        setReviewErrors(prev => {
                                                          const copy = { ...prev };
                                                          delete copy[item.id];
                                                          return copy;
                                                        });
                                                      }}
                                                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-lg transition-colors border border-gray-200"
                                                    >
                                                      Hủy
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        const temp = tempAdjustments[item.id];
                                                        if (!temp || temp.diem === '' || temp.diem === null || isNaN(temp.diem)) {
                                                          setReviewErrors(prev => ({ ...prev, [item.id]: 'Vui lòng nhập điểm!' }));
                                                          return;
                                                        }
                                                        const score = Number(temp.diem);
                                                        if (score < 0) {
                                                          setReviewErrors(prev => ({ ...prev, [item.id]: 'Điểm không được âm!' }));
                                                          return;
                                                        }
                                                        if (score > maxPossible) {
                                                          setReviewErrors(prev => ({ ...prev, [item.id]: `Điểm tối đa là ${maxPossible}đ!` }));
                                                          return;
                                                        }
                                                        if (!temp.lyDo || !temp.lyDo.trim()) {
                                                          setReviewErrors(prev => ({ ...prev, [item.id]: 'Vui lòng nhập lý do điều chỉnh!' }));
                                                          return;
                                                        }

                                                        setAdjustedItems(prev => ({
                                                          ...prev,
                                                          [item.id]: { status: 'adjusted', diem: score, lyDo: temp.lyDo.trim() }
                                                        }));
                                                        setShowAdjustmentForm(prev => ({ ...prev, [item.id]: false }));
                                                        setReviewErrors(prev => {
                                                          const copy = { ...prev };
                                                          delete copy[item.id];
                                                          return copy;
                                                        });
                                                      }}
                                                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                                                    >
                                                      Xác nhận
                                                    </button>
                                                  </div>
                                                </motion.div>
                                              )}
                                            </AnimatePresence>
                                          </div>
                                        )}

                                        {sel !== undefined && sel.diem > 0 && sel.Files && sel.Files.length > 0 && (
                                          <div className="mt-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 space-y-3">
                                            <p className="text-xs font-bold text-[#3B82F6] uppercase tracking-wider flex items-center gap-1.5">
                                              <FileImage className="w-4 h-4" /> Tệp đính kèm ({sel.Files.length})
                                            </p>

                                            {/* Preview row */}
                                            {sel.Files.filter(f => f.type.startsWith('image/')).length > 0 && (
                                              <div className="flex flex-wrap gap-3">
                                                {sel.Files.filter(f => f.type.startsWith('image/')).map((file, fileIndex) => (
                                                  <div key={fileIndex} className="relative group cursor-pointer" onClick={() => setPreviewImage(file.data)}>
                                                    <img src={file.data} alt="Minh chứng" className="w-20 h-20 object-cover rounded-xl border border-blue-200 shadow-sm group-hover:shadow-md transition-all" />
                                                    <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                      <Search className="w-6 h-6 text-white" />
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            )}

                                            {/* File list */}
                                            <div className="space-y-2">
                                              {sel.Files.map((file, fileIndex) => (
                                                <div key={fileIndex} className="flex items-center gap-3 p-2.5 bg-[#FFFFFF] rounded-lg border border-gray-200 shadow-sm">
                                                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                                                    <FileImage className="w-4 h-4 text-[#3B82F6]" />
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-gray-700 truncate">{file.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-medium">{(file.data.length * 3 / 4 / 1024).toFixed(1)} KB</p>
                                                  </div>
                                                  {file.type.startsWith('image/') && (
                                                    <button onClick={() => setPreviewImage(file.data)} className="px-3 py-1.5 bg-[#F7F8FA] hover:bg-gray-200 text-[#3B82F6] text-xs font-bold rounded-lg transition-colors shrink-0">
                                                      Xem
                                                    </button>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      <div className="shrink-0 flex items-center gap-2 xl:flex-col xl:items-end mt-2 xl:mt-0">
                                        <div className={`px-4 py-2 rounded-xl border-2 font-black text-lg shadow-sm ${isAdjusted ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-[#FFFFFF] border-[#E5E7EB] text-gray-700'}`}>
                                          +{currentScore}đ
                                        </div>
                                        {isAdjusted && <span className="text-[10px] font-bold text-amber-600 uppercase">Đã điều chỉnh</span>}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Right Col: Phê duyệt & Nhật ký (4 cols) */}
                    <div className="lg:col-span-4 flex flex-col gap-5 overflow-y-auto custom-scrollbar pr-1 pb-1 min-h-0">
                      {/* Active Appeal Box */}
                      {activeAppeal && (
                        <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-5 shadow-sm space-y-4 shrink-0">
                          <div className="flex items-center gap-2 text-rose-800">
                            <AlertCircle className="w-5 h-5 animate-pulse" />
                            <span className="text-sm font-black uppercase tracking-wider">Đơn khiếu nại chưa xử lý</span>
                          </div>
                          <div className="space-y-2.5">
                            <div>
                              <span className="text-[10px] font-bold text-rose-500 uppercase">Chủ đề:</span>
                              <p className="text-xs font-bold text-slate-800 leading-tight mt-0.5">{activeAppeal.ChuDe}</p>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-rose-500 uppercase">Nội dung khiếu nại:</span>
                              <div className="bg-white border border-rose-100 p-3 rounded-xl text-xs text-slate-700 leading-relaxed max-h-40 overflow-y-auto custom-scrollbar mt-0.5">
                                {(() => {
                                  const parsed = parseAppealContent(activeAppeal.NoiDung);
                                  return (
                                    <div className="space-y-3">
                                      <p className="font-semibold whitespace-pre-wrap">{parsed.text}</p>
                                      {parsed.fileData && (
                                        <div className="pt-2 border-t border-rose-100">
                                          <p className="text-[10px] font-bold text-rose-400 uppercase mb-1.5 flex items-center gap-1">🔗 Tệp khiếu nại:</p>
                                          {parsed.fileData.startsWith('data:image/') ? (
                                            <div className="relative group cursor-pointer w-24" onClick={() => setPreviewImage(parsed.fileData)}>
                                              <img src={parsed.fileData} alt="Minh chứng khiếu nại" className="w-24 h-24 object-cover rounded-lg border border-rose-200" />
                                              <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Search className="w-4 h-4 text-white" />
                                              </div>
                                            </div>
                                          ) : (
                                            <span className="text-xs text-blue-600 font-bold">Minh chứng đính kèm</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                          <div className="pt-1">
                            <label className="flex items-center gap-2 cursor-pointer group bg-white border border-rose-200 p-2.5 rounded-xl hover:bg-rose-50/50 transition-colors">
                              <input
                                type="checkbox"
                                checked={resolveAppealCheckbox}
                                onChange={e => setResolveAppealCheckbox(e.target.checked)}
                                className="w-4 h-4 text-rose-600 border-rose-300 rounded focus:ring-rose-500 cursor-pointer shrink-0"
                              />
                              <span className="text-xs font-black text-rose-800 group-hover:text-rose-950 leading-tight">
                                Đồng bộ xử lý đơn khiếu nại
                              </span>
                            </label>
                          </div>
                        </div>
                      )}

                      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] shadow-sm flex flex-col shrink-0">
                        <div className="bg-[#F7F8FA] px-5 py-4 border-b border-[#E5E7EB]">
                          <h5 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Quyết định phê duyệt
                          </h5>
                        </div>
                        <div className="p-5 space-y-5">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Trạng thái phê duyệt</label>
                            <select
                              value={trangThaiDuyet}
                              onChange={e => setTrangThaiDuyet(e.target.value)}
                              className="w-full p-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl outline-none focus:border-blue-400 focus:bg-[#FFFFFF] text-sm font-bold text-gray-700 transition-colors"
                            >
                              <option value="Đã xác nhận">Đã xác nhận (Chốt điểm)</option>
                              <option value="Yêu cầu chỉnh sửa">Trả lại phiếu (Yêu cầu SV sửa)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Nhận xét/Ý kiến</label>
                            <textarea
                              rows="3"
                              placeholder="Nhập nhận xét chung về kết quả rèn luyện của sinh viên..."
                              value={adminComment}
                              onChange={e => setAdminComment(e.target.value)}
                              className="w-full p-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl outline-none focus:border-blue-400 focus:bg-[#FFFFFF] text-sm font-semibold text-gray-700 transition-all resize-none custom-scrollbar"
                            />
                            <div className="flex flex-wrap gap-2 mt-2">
                              {['Đạt yêu cầu', 'Thiếu minh chứng', 'Ảnh mờ', 'Không hợp lệ'].map((template) => (
                                <button
                                  key={template}
                                  type="button"
                                  onClick={() => setAdminComment(template)}
                                  className="px-2.5 py-1 text-[11px] bg-[#FFFFFF] hover:bg-gray-100 border border-gray-300 text-[#6B7280] font-bold rounded-lg transition-colors shadow-sm"
                                >
                                  {template}
                                </button>
                              ))}
                            </div>
                          </div>
                          {/* Xóa khối xem trước nhật ký */}
                        </div>
                      </div>


                    </div>
                  </div>
                </div>

                {/* Footer Modal */}
                <div className="bg-[#F7F8FA] p-4 border-t border-[#E5E7EB] flex justify-end gap-3 shrink-0 mt-auto">
                  <button onClick={() => setSelectedRecord(null)} className="px-5 py-2.5 font-semibold text-[#6B7280] bg-[#FFFFFF] border border-gray-300 rounded-xl hover:bg-[#F7F8FA]">Hủy</button>
                  <button onClick={handleSubmitReview} className="px-6 py-2.5 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Chốt điểm</button>
                </div>
              </motion.div>
            </div>
          </ModalPortal>
        )}
      </AnimatePresence>

      {/* ======================================================= */}
      {/* MODAL: XEM TẤT CẢ LỊCH SỬ DUYỆT */}
      {/* ======================================================= */}
      <AnimatePresence>
        {isAllLogsModalOpen && (
          <ModalPortal>
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
                                    {log.HocKy.split('_')[0].replace('HK', 'HK ')}{log.HocKy.includes('_') ? ` (${log.HocKy.split('_')[1]}-${log.HocKy.split('_')[2]})` : ''}
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
          </ModalPortal>
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
