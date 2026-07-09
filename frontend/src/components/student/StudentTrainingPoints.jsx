import React, { useState, useEffect, useRef } from 'react';
import {
  Award, CheckCircle2, Clock, X, FileSignature,
  Edit, AlertTriangle, AlertCircle, Eye, MessageSquare, Send,
  Upload, FileImage, Trash2, CalendarDays, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import API_URL from '../../api';
import ModalPortal, { Toast, ConfirmDialog } from '../common/ModalPortal';

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

function StudentTrainingPointsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 relative animate-pulse pb-10">
      <div className="bg-slate-200 h-28 rounded-3xl" />
      <div className="flex gap-2 mb-6">
        <div className="w-40 h-10 bg-slate-200 rounded-xl" />
        <div className="w-40 h-10 bg-slate-200 rounded-xl" />
      </div>
      <div className="bg-[#FFFFFF] p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
        <div className="h-6 bg-slate-200 rounded w-1/4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-14 bg-slate-50 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

function StudentTrainingPoints({ user }) {
  const [points, setPoints] = useState([]);
  const [activePeriods, setActivePeriods] = useState([]);
  const [activeTab, setActiveTab] = useState('periods');
  const [supportRequests, setSupportRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [editingRecord, setEditingRecord] = useState(null);
  const [formScores, setFormScores] = useState({});

  // Toast & Confirm states using common components
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, title: '', message: '', action: null });

  // Appeals (Khiếu nại) states
  const [isAppealModalOpen, setIsAppealModalOpen] = useState(false);
  const [appealSemester, setAppealSemester] = useState('');
  const [appealCategory, setAppealCategory] = useState('');
  const [appealReason, setAppealReason] = useState('');
  const [appealError, setAppealError] = useState('');
  const [appealCriteria, setAppealCriteria] = useState([]);
  const [appealFile, setAppealFile] = useState(null);
  const fileInputRef = useRef(null);

  // State xem phản hồi khiếu nại
  const [viewFeedback, setViewFeedback] = useState(null);

  // State xem ảnh popup
  const [previewImage, setPreviewImage] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pointsRes, periodsRes, supportRes] = await Promise.all([
        axios.get(`${API_URL}/api/training-points/student/${user?.username}`),
        axios.get(`${API_URL}/api/training-periods/active`),
        axios.get(`${API_URL}/api/support/student/${user?.username}`)
      ]);
      setPoints(pointsRes.data);
      setActivePeriods(periodsRes.data);
      setSupportRequests(supportRes.data || []);
    } catch (error) {
      showToast('Lỗi khi tải dữ liệu!', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.username) fetchData();
  }, [user]);

  const currentCriteria = (() => {
    if (editingRecord?.CauTrucTieuChi) {
      return typeof editingRecord.CauTrucTieuChi === 'string' ? JSON.parse(editingRecord.CauTrucTieuChi) : editingRecord.CauTrucTieuChi;
    }
    if (selectedSemester) {
      const p = activePeriods.find(p => p.HocKy === selectedSemester);
      if (p?.CauTrucTieuChi) return typeof p.CauTrucTieuChi === 'string' ? JSON.parse(p.CauTrucTieuChi) : p.CauTrucTieuChi;
    }
    return DEFAULT_CRITERIA;
  })();

  const currentTotalScore = Object.values(formScores).reduce((sum, item) => sum + item.point, 0);
  const totalItems = currentCriteria.reduce((sum, sec) => sum + (sec.items?.length || 0), 0);
  const completedCount = Object.keys(formScores).length;

  const pendingPeriods = activePeriods.filter(period =>
    !points.some(p => p.HocKy === period.HocKy)
  );

  const handleSelectOption = (itemId, point, optionIndex) => {
    if (viewOnly) return;
    setFormScores(prev => {
      const current = prev[itemId] || {};
      return {
        ...prev,
        [itemId]: {
          point,
          optionIndex,
          Files: current.Files || []
        }
      };
    });
  };

  const handleFileUpload = (itemId, file) => {
    if (viewOnly) return;

    // Validate file size
    const isImage = file.type.startsWith('image/');
    const maxSizeImage = 5 * 1024 * 1024; // 5 MB
    const maxSizeDoc = 50 * 1024 * 1024; // 50 MB

    if (isImage && file.size > maxSizeImage) {
      showToast('Dung lượng ảnh tải lên không được vượt quá 5MB!', 'error');
      return;
    }

    if (!isImage && file.size > maxSizeDoc) {
      showToast('Dung lượng tệp tài liệu tải lên không được vượt quá 50MB!', 'error');
      return;
    }

    setFormScores(prev => {
      const current = prev[itemId] || { point: 0, optionIndex: 0 };
      const currentFiles = current.Files || [];

      // Check for duplicate file by name
      if (currentFiles.some(f => f.name === file.name)) {
        showToast('Tệp này đã được tải lên!', 'error');
        return prev;
      }

      // Validate max 3 files
      if (currentFiles.length >= 3) {
        showToast('Mỗi tiêu chí chỉ được tải lên tối đa 3 tệp!', 'error');
        return prev;
      }

      // Mark as uploading to prevent duplicates
      const updatedFiles = [...currentFiles, { name: file.name, type: file.type, data: null, uploading: true }];
      return {
        ...prev,
        [itemId]: {
          ...current,
          Files: updatedFiles
        }
      };
    });

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormScores(prev => {
        const updatedCurrent = prev[itemId] || { point: 0, optionIndex: 0 };
        const updatedFiles = (updatedCurrent.Files || []).map(f =>
          f.name === file.name ? { name: file.name, type: file.type, data: reader.result } : f
        );
        return {
          ...prev,
          [itemId]: {
            ...updatedCurrent,
            Files: updatedFiles
          }
        };
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = (itemId, fileIndex) => {
    if (viewOnly) return;
    setFormScores(prev => {
      const current = prev[itemId] || { point: 0, optionIndex: 0 };
      const updatedFiles = (current.Files || []).filter((_, index) => index !== fileIndex);
      return {
        ...prev,
        [itemId]: { ...current, Files: updatedFiles }
      };
    });
  };

  const handleOpenNew = (hocKy) => {
    const period = activePeriods.find(p => p.HocKy === hocKy);
    if (period && getDaysLeft(period.NgayKetThuc) < 0) {
      showToast('Đợt đánh giá đã hết hạn, không thể khai báo!', 'error');
      return;
    }
    setSelectedSemester(hocKy);
    setEditingRecord(null);
    setFormScores({});
    setViewOnly(false);
    setIsModalOpen(true);
  };

  const handleEdit = async (record) => {
    const period = activePeriods.find(ap => ap.HocKy === record.HocKy);
    if (!period) {
      showToast('Đợt đánh giá đã đóng, không thể chỉnh sửa!', 'error');
      return;
    }
    if (getDaysLeft(period.NgayKetThuc) < 0) {
      showToast('Đợt đánh giá đã hết hạn, không thể chỉnh sửa!', 'error');
      return;
    }
    setEditingRecord(record);
    setSelectedSemester(record.HocKy);
    setFormScores({});
    setViewOnly(false);
    try {
      const res = await axios.get(`${API_URL}/api/training-points/${record.MaDanhGia}/details`);
      if (res.data && res.data.length > 0) {
        const restored = {};
        res.data.forEach(ct => {
          restored[ct.MaTieuChi] = {
            point: ct.DiemChon,
            optionIndex: ct.ChiSoOption,
            Files: ct.MinhChung ? JSON.parse(ct.MinhChung) : []
          };
        });
        setFormScores(restored);
      }
    } catch (err) {
      console.error('Không thể tải chi tiết phiếu cũ:', err);
    }
    setIsModalOpen(true);
  };

  const handleViewDetails = async (record) => {
    setEditingRecord(record);
    setSelectedSemester(record.HocKy);
    setFormScores({});
    setViewOnly(true);
    try {
      const res = await axios.get(`${API_URL}/api/training-points/${record.MaDanhGia}/details`);
      if (res.data && res.data.length > 0) {
        const restored = {};
        res.data.forEach(ct => {
          restored[ct.MaTieuChi] = {
            point: ct.DiemChon,
            optionIndex: ct.ChiSoOption,
            Files: ct.MinhChung ? JSON.parse(ct.MinhChung) : []
          };
        });
        setFormScores(restored);
      }
    } catch (err) {
      console.error('Không thể tải chi tiết phiếu cũ:', err);
    }
    setIsModalOpen(true);
  };

  const buildChiTiet = () => {
    return Object.entries(formScores).map(([maTieuChi, data]) => ({
      MaTieuChi: maTieuChi,
      DiemChon: data.point,
      ChiSoOption: data.optionIndex,
      Files: data.Files || null
    }));
  };

  const handlePreSubmit = () => {
    if (completedCount < totalItems) {
      return showToast("Vui lòng đánh giá đầy đủ tất cả các tiêu chí!", "error");
    }
    setConfirmDialog({
      show: true,
      title: editingRecord ? 'Cập nhật phiếu' : 'Xác nhận nộp phiếu',
      message: `Xác nhận gửi kết quả đánh giá với tổng điểm là ${currentTotalScore}đ?`,
      action: async () => {
        try {
          const chiTiet = buildChiTiet();
          if (editingRecord) {
            await axios.put(`${API_URL}/api/training-points/${editingRecord.MaDanhGia}`, { DiemTuDanhGia: currentTotalScore, ChiTiet: chiTiet });
            showToast("Cập nhật thành công!", "success");
          } else {
            const activeP = activePeriods.find(p => p.HocKy === selectedSemester);
            await axios.post(`${API_URL}/api/training-points`, {
              MSSV: user.username,
              HocKy: selectedSemester,
              DiemTuDanhGia: currentTotalScore,
              ChiTiet: chiTiet,
              MaDotDanhGia: activeP ? activeP.MaDotDanhGia : null
            });
            showToast("Nộp phiếu thành công!", "success");
          }
          setIsModalOpen(false);
          setConfirmDialog({ show: false, title: '', message: '', action: null });
          fetchData();
        } catch (error) {
          showToast("Lỗi hệ thống hoặc hết hạn!", "error");
          setConfirmDialog({ show: false, title: '', message: '', action: null });
        }
      }
    });
  };

  // Nộp đơn khiếu nại điểm
  const handleOpenAppeal = (hocKy) => {
    setAppealSemester(hocKy);
    setAppealCategory('');
    setAppealCriteria([]);
    setAppealFile(null);
    setAppealReason('');
    setAppealError('');
    setIsAppealModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB
        setAppealError('File minh chứng quá lớn! Vui lòng chọn file dưới 2MB.');
        setAppealFile(null);
        return;
      }
      setAppealError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setAppealFile({ name: file.name, data: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendAppeal = async () => {
    if (!appealCategory) {
      setAppealError('Vui lòng chọn loại khiếu nại!');
      return;
    }
    if (appealCategory === 'Chấm sai/Sót điểm' && appealCriteria.length === 0) {
      setAppealError('Vui lòng chọn tiêu chí bị chấm sai!');
      return;
    }
    if (!appealReason.trim()) {
      setAppealError('Vui lòng điền nội dung khiếu nại chi tiết!');
      return;
    }

    let compiledContent = ``;
    if (appealCriteria.length > 0) compiledContent += `- Tiêu chí khiếu nại:\n  + ${appealCriteria.join('\n  + ')}\n`;
    compiledContent += `- Chi tiết lý do: ${appealReason}`;

    if (appealFile) {
      compiledContent += `\n\n[FILE_MINH_CHUNG_START]\n${appealFile.data}\n[FILE_MINH_CHUNG_END]`;
    }

    try {
      const appealHocKy = appealSemester.replace('HK', 'Học kỳ ').replace(/_/g, ' ');
      await axios.post(`${API_URL}/api/support`, {
        MSSV: user.username,
        LoaiYeuCau: 'Khiếu nại điểm rèn luyện',
        ChuDe: `[${appealCategory}] Khiếu nại điểm rèn luyện - ${appealHocKy}`,
        NoiDung: compiledContent
      });
      showToast('Gửi khiếu nại thành công!', 'success');
      setIsAppealModalOpen(false);
      fetchData(); // reload support requests
    } catch {
      showToast('Lỗi gửi khiếu nại!', 'error');
    }
  };

  const getDaysLeft = (dateStr) => {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(dateStr);
    end.setHours(0, 0, 0, 0);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  const parseAdminFeedback = (ghiChu) => {
    if (!ghiChu) return { comment: '', adjustments: {} };
    let comment = ghiChu;
    let adjustments = {};
    const match = ghiChu.match(/\[Chi tiết điều chỉnh: ([\s\S]*)\]/);
    if (match) {
      comment = ghiChu.replace(` | [Chi tiết điều chỉnh: ${match[1]}]`, '').replace(`[Chi tiết điều chỉnh: ${match[1]}]`, '').trim();
      const parts = match[1].split('; ');
      parts.forEach(part => {
        const m = part.match(/Mục (.*?): (-?[\d.]+)đ -> (-?[\d.]+)đ \(([\s\S]*)\)/);
        if (m) {
          adjustments[m[1]] = { old: m[2], new: m[3], reason: m[4] };
        }
      });
    }
    return { comment, adjustments };
  };

  const adminFeedback = viewOnly && editingRecord ? parseAdminFeedback(editingRecord.GhiChu) : { comment: '', adjustments: {} };

  const getRealTimeRating = (score) => {
    if (score >= 90) return 'Xuất sắc';

    if (score >= 80) return 'Tốt';
    if (score >= 65) return 'Khá';
    if (score >= 50) return 'Trung bình';
    return 'Yếu';
  };

  const getRatingColor = (score) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 80) return 'text-[#22C55E]';
    if (score >= 65) return 'text-[#3B82F6]';
    if (score >= 50) return 'text-amber-600';
    return 'text-rose-500';
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

  if (loading) return <StudentTrainingPointsSkeleton />;

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative pb-10">

      {/* Toast và ConfirmDialog dùng chung */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: '', type: 'success' })}
      />

      <ConfirmDialog
        show={confirmDialog.show}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog({ show: false, title: '', message: '', action: null })}
      />

      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-[#F4C542] rounded-3xl p-8 shadow-lg relative overflow-hidden flex items-center gap-5"
      >
        <div className="p-4 bg-white/40 rounded-2xl relative z-10 backdrop-blur-sm">
          <Award className="w-10 h-10 text-[#152238]" />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-[#152238] mb-1">Đánh giá rèn luyện</h2>
          <p className="text-[#152238]/70 text-lg">Khai báo tự đánh giá và theo dõi điểm rèn luyện</p>
        </div>
        <Award className="absolute -right-6 -bottom-6 w-48 h-48 text-white opacity-10 transform rotate-12" />
      </motion.div>

      {/* Tabs */}
      <div className="flex bg-[#FFFFFF] rounded-2xl p-1.5 shadow-sm border border-[#E5E7EB] w-fit">
        <button
          onClick={() => setActiveTab('periods')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'periods' ? 'bg-[#F4C542]/20 text-[#B45309] shadow-sm' : 'text-[#6B7280] hover:bg-[#F7F8FA]'}`}
        >
          <CalendarDays className="w-5 h-5" /> Khai báo điểm
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'history' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-[#6B7280] hover:bg-[#F7F8FA]'}`}
        >
          <Clock className="w-5 h-5" /> Lịch sử rèn luyện
        </button>
      </div>

      {/* BANNER NHẮC NHỞ TỰ ĐÁNH GIÁ (REMINDERS) */}
      <AnimatePresence>
        {pendingPeriods.map(period => {
          const daysLeft = getDaysLeft(period.NgayKetThuc);
          return (
            <motion.div
              key={period.MaDotDanhGia}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-rose-50 border border-rose-200 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-center gap-3.5 text-center sm:text-left">
                <div className="p-3 bg-rose-100 rounded-2xl text-rose-600 shrink-0 animate-bounce">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-rose-800 text-base leading-tight">Yêu cầu hoàn thành Phiếu Tự Đánh Giá</h4>
                  <p className="text-xs text-rose-600 font-medium mt-1">
                    Đợt đánh giá rèn luyện <span className="font-black text-rose-800">{period.HocKy.replace('HK', 'Học kỳ ').replace(/_/g, ' ')}</span> đang mở!
                    Hạn chót: <span className="font-bold text-rose-800">{formatDate(period.NgayKetThuc)}</span>
                    {daysLeft !== null && ` (Còn ${daysLeft >= 0 ? daysLeft : 0} ngày)`}.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleOpenNew(period.HocKy)}
                disabled={daysLeft !== null && daysLeft < 0}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:shadow-none text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-rose-100 shrink-0"
              >
                Khai báo ngay
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* TAB: KHAI BÁO ĐIỂM (CÁC ĐỢT ĐANG MỞ) */}
        {activeTab === 'periods' && (
          <motion.div key="periods" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-4">
              <FileSignature className="w-5 h-5 text-[#F4C542]" /> Danh sách Đợt đánh giá
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activePeriods.map((period) => {
                const hasSubmitted = points.some(p => p.HocKy === period.HocKy);
                const daysLeft = getDaysLeft(period.NgayKetThuc);

                return (
                  <div key={period.MaDotDanhGia} className="p-6 bg-[#FFFFFF] rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#F4C542]/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="font-black text-slate-800 text-xl">{period.HocKy.replace('HK', 'Học kỳ ').replace(/_/g, ' ')}</p>
                          <p className="text-sm text-slate-500 font-medium mt-1 flex items-center gap-1">
                            Năm học: <span className="text-slate-700">{period.NamHoc}</span>
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <FileSignature className="w-6 h-6" />
                        </div>
                      </div>

                      <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500 font-medium flex items-center gap-1.5"><CalendarDays className="w-4 h-4" /> Hạn nộp</span>
                          <span className="font-bold text-slate-700">{formatDate(period.NgayKetThuc)}</span>
                        </div>
                        {daysLeft !== null && (
                          <div className="flex justify-end">
                            {daysLeft > 0 ? (
                              <span className="px-2.5 py-1 rounded-lg font-bold text-xs bg-[#3B82F6]/10 text-[#3B82F6] border border-blue-100">
                                Còn {daysLeft} ngày
                              </span>
                            ) : daysLeft === 0 ? (
                              <span className="px-2.5 py-1 rounded-lg font-bold text-xs bg-amber-50 text-amber-600 border border-amber-200 animate-pulse">
                                Hạn cuối hôm nay!
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg font-bold text-xs bg-slate-100 text-slate-500 border border-slate-200">
                                Đã hết hạn
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      {hasSubmitted ? (
                        <div className="text-sm font-bold text-emerald-600 bg-emerald-50 p-3.5 rounded-xl flex items-center justify-center gap-2 border border-emerald-200">
                          <CheckCircle2 className="w-5 h-5" /> Bạn đã nộp phiếu
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenNew(period.HocKy)}
                          disabled={daysLeft !== null && daysLeft < 0}
                          className="w-full bg-[#F4C542] hover:bg-amber-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none text-[#152238] font-bold py-3.5 rounded-xl text-sm shadow-md shadow-[#F4C542]/30 transition-colors flex items-center justify-center gap-2"
                        >
                          <Edit className="w-4 h-4" /> Khai báo ngay
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {activePeriods.length === 0 && (
                <div className="col-span-full bg-[#FFFFFF] p-10 rounded-3xl shadow-sm border border-slate-100 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <FileSignature className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium">Hiện tại không có đợt đánh giá nào đang mở.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB: LỊCH SỬ RÈN LUYỆN */}
        {activeTab === 'history' && (
          <motion.div key="history" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div className="bg-[#FFFFFF] rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" /> Lịch sử rèn luyện của bạn
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                      <th className="p-5 font-bold whitespace-nowrap">Học kỳ</th>
                      <th className="p-5 font-bold text-center whitespace-nowrap">SV ĐG</th>
                      <th className="p-5 font-bold text-center whitespace-nowrap">Khoa ĐG</th>
                      <th className="p-5 font-bold text-center whitespace-nowrap">Điểm chốt</th>
                      <th className="p-5 font-bold text-center whitespace-nowrap">Xếp loại</th>
                      <th className="p-5 font-bold whitespace-nowrap">Trạng thái</th>
                      <th className="p-5 font-bold text-center whitespace-nowrap">Tác vụ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {points.map((p, i) => {
                      const appealReq = supportRequests.find(r =>
                        r.LoaiYeuCau === 'Khiếu nại điểm rèn luyện' &&
                        r.ChuDe.includes(p.HocKy)
                      );

                      return (
                        <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-5 font-bold text-slate-700 whitespace-nowrap">{p.HocKy.replace('HK', 'Học kỳ ').replace(/_/g, ' ')}</td>
                          <td className="p-5 text-center font-bold text-[#3B82F6] whitespace-nowrap"><span className="bg-[#3B82F6]/10 px-3 py-1.5 rounded-lg border border-blue-100">{p.DiemTuDanhGia}đ</span></td>
                          <td className="p-5 text-center text-slate-600 font-semibold whitespace-nowrap">{p.DiemKhoaDanhGia || '0'}đ</td>
                          <td className="p-5 text-center font-black text-[#F4C542] text-lg whitespace-nowrap">{p.TongDiem || p.DiemTuDanhGia}đ</td>
                          <td className="p-5 text-center whitespace-nowrap">
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${getXepLoaiBadge(p.XepLoai)}`}>
                              {p.XepLoai || 'Chưa xếp'}
                            </span>
                          </td>
                          <td className="p-5 whitespace-nowrap">
                            {p.TrangThai === 'Đã xác nhận' ? (
                              <span className="text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 w-fit font-bold text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Đã xác nhận
                              </span>
                            ) : (
                              <span className="text-[#F4C542] bg-[#FFF7D6] border border-[#F4C542]/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 w-fit font-bold text-xs">
                                <Clock className="w-3.5 h-3.5" /> Chờ duyệt
                              </span>
                            )}
                          </td>
                          <td className="p-5 text-center whitespace-nowrap">
                            <div className="inline-flex gap-2 justify-center items-center">
                              {/* Nút Xem chi tiết */}
                              <button
                                onClick={() => handleViewDetails(p)}
                                className="p-2.5 bg-[#FFFFFF] border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl shadow-sm hover:text-blue-600 hover:border-blue-200 transition-all"
                                title="Xem chi tiết phiếu"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Nút Sửa (chỉ khi chưa duyệt và đợt còn mở) */}
                              {p.TrangThai !== 'Đã xác nhận' && activePeriods.some(ap => ap.HocKy === p.HocKy && getDaysLeft(ap.NgayKetThuc) >= 0) && (
                                <button
                                  onClick={() => handleEdit(p)}
                                  className="p-2.5 bg-[#FFFFFF] border border-blue-200 text-[#3B82F6] hover:bg-[#3B82F6]/10 rounded-xl shadow-sm transition-all"
                                  title="Sửa phiếu"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}

                              {/* Khiếu nại (khi đã duyệt chốt) */}
                              {p.TrangThai === 'Đã xác nhận' && (
                                <>
                                  {!appealReq ? (
                                    <button
                                      onClick={() => handleOpenAppeal(p.HocKy)}
                                      className="px-4 py-2 bg-[#EF4444]/10 hover:bg-red-100 text-[#EF4444] border border-red-200 font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
                                    >
                                      Khiếu nại
                                    </button>
                                  ) : appealReq.TrangThai === 'Đã xử lý' ? (
                                    <button
                                      onClick={() => setViewFeedback(appealReq)}
                                      className="px-4 py-2 bg-[#3B82F6]/10 hover:bg-blue-100 text-[#3B82F6] border border-blue-200 font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" /> Xem phản hồi
                                    </button>
                                  ) : (
                                    <span className="px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs rounded-xl flex items-center gap-1.5">
                                      <Clock className="w-3.5 h-3.5" /> Đang giải quyết
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {points.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-slate-400 font-medium">Chưa có lịch sử rèn luyện.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL PHIẾU ĐÁNH GIÁ (FORM) */}
      <ModalPortal>
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#FFFFFF] w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">

                {/* Header Form */}
                <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center"><FileSignature className="w-6 h-6" /></div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-800 mb-1">
                        {viewOnly ? 'Chi Tiết Phiếu Đánh Giá' : editingRecord ? 'Cập nhật Phiếu Đánh Giá' : 'Khai báo Phiếu Đánh Giá'}
                      </h2>
                      <p className="text-sm font-medium text-slate-500">{user?.hoTen} - {user?.username} ({selectedSemester.replace('HK', 'Học kỳ ').replace(/_/g, ' ')})</p>
                    </div>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
                </div>

                {/* Progress Bar & Real-time ratings (Chỉ hiện ở chế độ điền form) */}
                {!viewOnly && (
                  <div className="bg-[#3B82F6]/10/50 px-8 py-3 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between shrink-0">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                        <span>Tiến trình hoàn thiện phiếu</span>
                        <span>Đã tích {completedCount}/{totalItems} tiêu chí ({Math.round(completedCount / totalItems * 100)}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${(completedCount / totalItems) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 uppercase">Xếp loại dự kiến:</span>
                      <span className={`text-base font-black px-3 py-1 bg-[#FFFFFF] border border-slate-200 rounded-xl ${getRatingColor(currentTotalScore)}`}>
                        {getRealTimeRating(currentTotalScore)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Hiển thị phản hồi chung từ Admin nếu có */}
                {viewOnly && adminFeedback.comment && (
                  <div className={`mx-8 mt-6 rounded-2xl p-4 flex gap-4 items-start shrink-0 shadow-sm border ${editingRecord?.TrangThai === 'Đã xác nhận'
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-amber-50 border-amber-200'
                    }`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${editingRecord?.TrangThai === 'Đã xác nhận' ? 'bg-emerald-100' : 'bg-amber-100'
                      }`}>
                      <MessageSquare className={`w-5 h-5 ${editingRecord?.TrangThai === 'Đã xác nhận' ? 'text-emerald-600' : 'text-amber-600'
                        }`} />
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-black text-sm mb-1 uppercase tracking-wider ${editingRecord?.TrangThai === 'Đã xác nhận' ? 'text-emerald-800' : 'text-amber-800'
                        }`}>Phản hồi từ Khoa/Trường</h4>
                      <p className={`text-sm font-medium whitespace-pre-wrap ${editingRecord?.TrangThai === 'Đã xác nhận' ? 'text-emerald-700' : 'text-amber-700'
                        }`}>{adminFeedback.comment}</p>
                    </div>
                  </div>
                )}

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 custom-scrollbar">
                  {currentCriteria.map((section) => (
                    <div key={section.id} className="border border-slate-200 rounded-3xl overflow-hidden bg-[#FFFFFF] shadow-sm">
                      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                        <h3 className="font-black text-slate-800 text-base">{section.title}</h3>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {section.items.map((item) => (
                          <div key={item.id} className="p-6 flex flex-col md:flex-row gap-6">
                            <div className="flex-1">
                              <p className="font-bold text-slate-700 mb-4 text-sm">{item.label}</p>
                              {viewOnly ? (
                                <div className="space-y-3">
                                  {formScores[item.id] !== undefined ? (
                                    <p className="text-sm text-[#3B82F6] bg-[#3B82F6]/10 border border-blue-100 rounded-lg p-3 font-medium">
                                      <span className="font-bold mr-1">SV Chọn:</span> {item.options[formScores[item.id].optionIndex]?.label || 'Không xác định'}
                                    </p>
                                  ) : (
                                    <p className="text-sm text-[#EF4444] italic bg-[#EF4444]/10 rounded-lg p-3 font-medium border border-red-100">
                                      SV không tích chọn mục này
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {item.options.map((opt, idx) => {
                                    const isSelected = formScores[item.id]?.optionIndex === idx;
                                    return (
                                      <div
                                        key={idx}
                                        onClick={() => handleSelectOption(item.id, opt.point, idx)}
                                        className={`flex items-center gap-4 p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${isSelected
                                          ? 'border-blue-500 bg-[#3B82F6]/10'
                                          : 'border-slate-100 hover:bg-slate-50'
                                          }`}
                                      >
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-blue-500' : 'border-slate-300'}`}>
                                          {isSelected && <div className="w-2.5 h-2.5 bg-[#3B82F6]/100 rounded-full" />}
                                        </div>
                                        <span className={`text-sm font-medium leading-snug ${isSelected ? 'text-blue-700 font-bold' : 'text-slate-600'}`}>
                                          {opt.label}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Minh chứng hoạt động */}
                              {formScores[item.id] !== undefined && formScores[item.id].point > 0 && (
                                <div className="mt-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-2">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                    🔗 Minh chứng hoạt động
                                  </label>
                                  {viewOnly ? (
                                    <div className="space-y-2">
                                      {(formScores[item.id]?.Files || []).length > 0 && (
                                        <div className="space-y-2">
                                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                            Tệp đính kèm ({formScores[item.id].Files.length}/3)
                                          </p>
                                          {formScores[item.id].Files.map((file, fileIndex) => (
                                            <div key={fileIndex} className="flex items-center gap-2 p-2 bg-[#FFFFFF] rounded-lg border border-slate-200">
                                              <FileImage className="w-4 h-4 text-[#3B82F6] shrink-0" />
                                              <span className="text-xs font-medium text-slate-700 truncate flex-1">
                                                {file.name}
                                              </span>
                                              {file.type.startsWith('image/') && (
                                                <button
                                                  onClick={() => setPreviewImage(file.data)}
                                                  className="text-xs font-bold text-[#3B82F6] hover:underline shrink-0"
                                                >
                                                  Xem ảnh
                                                </button>
                                              )}
                                            </div>
                                          ))}
                                          {/* Image previews */}
                                          {formScores[item.id].Files.filter(f => f.type.startsWith('image/')).length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                              {formScores[item.id].Files
                                                .filter(f => f.type.startsWith('image/'))
                                                .map((file, fileIndex) => (
                                                  <img
                                                    key={fileIndex}
                                                    src={file.data}
                                                    alt={`Minh chứng ${fileIndex + 1}`}
                                                    className="w-16 h-16 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => setPreviewImage(file.data)}
                                                  />
                                                ))}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      {(!formScores[item.id]?.Files || formScores[item.id].Files.length === 0) && (
                                        <span className="text-xs font-medium text-slate-400 italic">Không nộp kèm minh chứng</span>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <label className={`flex-1 flex items-center gap-2 px-3.5 py-2.5 bg-[#FFFFFF] border rounded-xl text-xs cursor-pointer transition-colors ${(formScores[item.id]?.Files || []).length >= 3 ? 'border-slate-200 bg-slate-50 cursor-not-allowed' : 'border-slate-200 hover:bg-slate-50'}`}>
                                          <Upload className="w-4 h-4 text-slate-500" />
                                          <span className="font-medium text-slate-600">
                                            {(formScores[item.id]?.Files || []).length >= 3
                                              ? `Đã tải tối đa (3/3)`
                                              : `Tải lên tệp/hình ảnh (${(formScores[item.id]?.Files || []).length}/3)`
                                            }
                                          </span>
                                          <input
                                            type="file"
                                            accept="image/*,.pdf,.doc,.docx"
                                            disabled={(formScores[item.id]?.Files || []).length >= 3}
                                            onChange={e => {
                                              const file = e.target.files[0];
                                              if (file) {
                                                handleFileUpload(item.id, file);
                                                e.target.value = ''; // Reset file input
                                              }
                                            }}
                                            className="hidden"
                                          />
                                        </label>
                                      </div>
                                      {/* Display uploaded files with individual delete buttons */}
                                      {(formScores[item.id]?.Files || []).length > 0 && (
                                        <div className="space-y-2 mt-2">
                                          {formScores[item.id].Files.map((file, fileIndex) => (
                                            <div key={fileIndex} className="flex items-center gap-2 p-2 bg-[#FFFFFF] rounded-lg border border-slate-200">
                                              <FileImage className="w-4 h-4 text-[#3B82F6] shrink-0" />
                                              <span className="text-xs font-medium text-slate-700 truncate flex-1">
                                                {file.name}
                                              </span>
                                              <button
                                                onClick={() => handleRemoveFile(item.id, fileIndex)}
                                                className="p-1.5 bg-red-100 text-[#DC2626] rounded-lg hover:bg-red-200 transition-colors shrink-0"
                                                title="Xóa tệp này"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      {/* Display image previews */}
                                      {(formScores[item.id]?.Files || []).filter(f => f.type.startsWith('image/')).length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                          {formScores[item.id].Files
                                            .filter(f => f.type.startsWith('image/'))
                                            .map((file, fileIndex) => (
                                              <div key={fileIndex} className="relative">
                                                <img
                                                  src={file.data}
                                                  alt={`Minh chứng ${fileIndex + 1}`}
                                                  className="w-20 h-20 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                                                  onClick={() => setPreviewImage(file.data)}
                                                />
                                              </div>
                                            ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}

                            </div>

                            <div className="shrink-0 flex flex-col items-start md:items-end mt-4 md:mt-0 md:w-64">
                              {viewOnly ? (
                                <>
                                  <div className={`px-4 py-2 rounded-xl border-2 font-black text-lg shadow-sm text-center min-w-[8rem] ${adminFeedback.adjustments[item.id]
                                    ? 'bg-amber-50 border-amber-200 text-amber-600'
                                    : 'bg-[#FFFFFF] border-[#E5E7EB] text-gray-700'
                                    }`}>
                                    +{adminFeedback.adjustments[item.id] ? adminFeedback.adjustments[item.id].new : (formScores[item.id]?.point || 0)}đ
                                  </div>
                                  {adminFeedback.adjustments[item.id] ? (
                                    <div className="mt-2 text-left md:text-right w-full">
                                      <span className="text-[10px] font-bold text-amber-600 uppercase bg-amber-100 px-2 py-1 rounded-md inline-block mb-1">Điều chỉnh từ khoa</span>
                                      <p className="text-xs text-gray-400 font-medium mb-1.5"><span className="line-through">SV chấm: {adminFeedback.adjustments[item.id].old}đ</span></p>
                                      <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-lg text-left text-xs text-amber-800 shadow-sm">
                                        <span className="font-bold block mb-0.5">Lý do:</span>
                                        {adminFeedback.adjustments[item.id].reason}
                                      </div>
                                    </div>
                                  ) : (
                                    formScores[item.id] !== undefined && (
                                      <div className="mt-2">
                                        <span className="text-[10px] font-bold text-emerald-600 uppercase bg-emerald-100 px-2 py-1 rounded-md inline-block">Đã duyệt</span>
                                      </div>
                                    )
                                  )}
                                </>
                              ) : (
                                <div className={`px-4 py-2 rounded-xl border-2 font-black text-lg shadow-sm min-w-[8rem] text-center ${formScores[item.id] !== undefined
                                  ? 'bg-[#FFFFFF] border-[#E5E7EB] text-[#3B82F6]'
                                  : 'bg-slate-50 border-slate-100 text-slate-300'
                                  }`}>
                                  {formScores[item.id] !== undefined ? `+${formScores[item.id].point}đ` : '-'}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Form */}
                <div className="bg-slate-50 border-t border-slate-200 px-8 py-5 flex justify-between items-center shrink-0">
                  <div className="flex gap-12">
                    <div className="flex flex-col">
                      <span className="text-slate-500 font-bold text-xs uppercase">Điểm tự đánh giá</span>
                      <div className="text-4xl font-black text-[#3B82F6]">{currentTotalScore} <span className="text-xl text-slate-400">/ 100</span></div>
                    </div>
                    {viewOnly && editingRecord?.TongDiem !== undefined && editingRecord?.TongDiem !== null && (
                      <div className="flex flex-col">
                        <span className="text-emerald-700 font-bold text-xs uppercase">Khoa quyết định</span>
                        <div className="text-4xl font-black text-emerald-600">{editingRecord.TongDiem} <span className="text-xl text-emerald-400/50">/ 100</span></div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 bg-[#FFFFFF] border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors">
                      {viewOnly ? 'Đóng' : 'Hủy'}
                    </button>
                    {!viewOnly && (
                      <button onClick={handlePreSubmit} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all">
                        Gửi phiếu ngay
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </ModalPortal>

      {/* MODAL KHIẾU NẠI (APPEAL) */}
      <ModalPortal>
        <AnimatePresence>
          {isAppealModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#FFFFFF] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              >
                <div className="bg-red-600 p-5 flex justify-between items-center text-white shrink-0">
                  <h3 className="text-lg font-bold flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Khiếu nại kết quả rèn luyện</h3>
                  <button onClick={() => setIsAppealModalOpen(false)} className="p-1 hover:bg-white/40 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 shadow-sm">
                    <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-bold mb-1">Lưu ý trước khi khiếu nại:</p>
                      <ul className="list-disc pl-4 space-y-1 text-amber-700/90 marker:text-amber-400">
                        <li>Chỉ khiếu nại khi có minh chứng rõ ràng, hợp lệ.</li>
                        <li>Ghi rõ số thứ tự mục tiêu chí (Ví dụ: Mục 1.2).</li>
                        <li>Sinh viên chịu trách nhiệm về tính trung thực.</li>
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-sm font-semibold text-slate-500 mb-1.5">Đợt</p>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-800 h-[46px] flex items-center">
                        {appealSemester.replace('HK', 'Học kỳ ').replace(/_/g, ' ')}
                      </div>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Loại khiếu nại <span className="text-red-500">*</span></label>
                      <select
                        value={appealCategory}
                        onChange={e => { setAppealCategory(e.target.value); setAppealError(''); }}
                        className="w-full bg-[#FFFFFF] border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all outline-none h-[46px]"
                      >
                        <option value="" disabled>-- Chọn phân loại --</option>
                        <option value="Chấm sai/Sót điểm">Chấm sai / Sót điểm</option>
                        <option value="Hệ thống lỗi">Lỗi hệ thống</option>
                        <option value="Đánh giá chưa thỏa đáng">Đánh giá chưa thỏa đáng</option>
                        <option value="Khác">Lý do khác</option>
                      </select>
                    </div>
                  </div>

                  <AnimatePresence>
                    {appealCategory === 'Chấm sai/Sót điểm' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-2 gap-4 overflow-hidden"
                      >
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mục tiêu chí bị chấm sai <span className="text-red-500">*</span></label>
                          <div className="w-full bg-[#FFFFFF] border border-slate-200 rounded-xl p-3 max-h-52 overflow-y-auto custom-scrollbar space-y-3">
                            <label className="flex items-start gap-2.5 cursor-pointer group">
                              <input 
                                type="checkbox"
                                checked={appealCriteria.includes("Toàn bộ phiếu (Nhiều mục)")}
                                onChange={(e) => {
                                  setAppealError('');
                                  if (e.target.checked) {
                                    setAppealCriteria(["Toàn bộ phiếu (Nhiều mục)"]);
                                  } else {
                                    setAppealCriteria([]);
                                  }
                                }}
                                className="mt-0.5 w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer shrink-0"
                              />
                              <span className="text-sm font-bold text-slate-700 group-hover:text-red-600 transition-colors leading-tight">
                                Toàn bộ phiếu (Nhiều mục)
                              </span>
                            </label>
                            
                            <div className="h-px bg-slate-100 w-full my-2"></div>
                            
                            {currentCriteria.flatMap(sec => sec.items).map(item => (
                              <label key={item.id} className="flex items-start gap-2.5 cursor-pointer group">
                                <input 
                                  type="checkbox"
                                  checked={appealCriteria.includes(item.label)}
                                  onChange={(e) => {
                                    setAppealError('');
                                    if (e.target.checked) {
                                      setAppealCriteria([...appealCriteria.filter(c => c !== "Toàn bộ phiếu (Nhiều mục)"), item.label]);
                                    } else {
                                      setAppealCriteria(appealCriteria.filter(c => c !== item.label));
                                    }
                                  }}
                                  className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer shrink-0"
                                />
                                <span className="text-sm text-slate-700 group-hover:text-slate-900 leading-tight">
                                  {item.label}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nội dung chi tiết <span className="text-red-500">*</span></label>
                    <textarea
                      rows="4"
                      value={appealReason}
                      onChange={e => { setAppealReason(e.target.value); setAppealError(''); }}
                      placeholder="Vui lòng diễn giải chi tiết vấn đề bạn đang gặp phải..."
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 focus:bg-[#FFFFFF] transition-all text-sm text-slate-700 placeholder-slate-400"
                    />

                    {/* Tải file minh chứng */}
                    <div className="mt-3">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*,.pdf"
                        className="hidden"
                      />
                      {appealFile ? (
                        <div className="flex justify-between items-center bg-blue-50 border border-blue-200 rounded-xl p-3">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileImage className="w-5 h-5 text-blue-600 shrink-0" />
                            <span className="text-sm font-medium text-blue-800 truncate">{appealFile.name}</span>
                          </div>
                          <button
                            onClick={() => setAppealFile(null)}
                            className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                            title="Xóa file"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => fileInputRef.current.click()}
                          className="flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-4 py-2.5 rounded-xl transition-colors w-full justify-center"
                        >
                          <Upload className="w-4 h-4" />
                          Chọn file đính kèm (Tối đa 2MB)
                        </button>
                      )}
                    </div>

                    {appealError && <p className="text-[#EF4444] text-xs mt-2 font-bold flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> {appealError}</p>}
                  </div>
                </div>
                <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                  <button onClick={() => setIsAppealModalOpen(false)} className="px-5 py-2.5 font-semibold text-slate-600 bg-[#FFFFFF] border border-gray-300 rounded-xl hover:bg-slate-100">Hủy</button>
                  <button onClick={handleSendAppeal} className="px-6 py-2.5 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md shadow-red-200 flex items-center gap-1.5">
                    <Send className="w-4 h-4" /> Gửi khiếu nại
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </ModalPortal>

      {/* DIALOG XEM PHẢN HỒI KHIẾU NẠI */}
      <ModalPortal>
        <AnimatePresence>
          {viewFeedback && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#FFFFFF] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              >
                <div className="bg-blue-600 p-5 flex justify-between items-center text-white shrink-0">
                  <h3 className="text-lg font-bold flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Kết quả phản hồi khiếu nại</h3>
                  <button onClick={() => setViewFeedback(null)} className="p-1 hover:bg-white/40 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lý do khiếu nại của bạn:</p>
                    <p className="text-sm text-slate-700 font-medium mt-1 leading-relaxed">{viewFeedback.NoiDung}</p>
                    <p className="text-[10px] text-slate-400 mt-2 font-medium">Gửi ngày: {new Date(viewFeedback.NgayGui).toLocaleString('vi-VN')}</p>
                  </div>
                  <div className="bg-[#22C55E]/10/50 rounded-2xl p-4 border border-green-150">
                    <p className="text-xs font-bold text-green-700 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Phản hồi từ Ban cán sự / Admin:
                    </p>
                    <p className="text-sm text-green-800 font-semibold mt-1.5 leading-relaxed">
                      {viewFeedback.PhanHoi || 'Đơn khiếu nại đã được giải quyết điểm rèn luyện.'}
                    </p>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end shrink-0">
                  <button onClick={() => setViewFeedback(null)} className="px-6 py-2.5 font-bold text-slate-600 bg-[#FFFFFF] border border-gray-300 rounded-xl hover:bg-slate-100">Đóng</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </ModalPortal>

      {/* Image Preview Modal */}
      <ModalPortal>
        <AnimatePresence>
          {previewImage && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
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
      </ModalPortal>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}} />
    </div>
  );
}

export default StudentTrainingPoints;
