import React, { useState, useEffect } from 'react';
import { 
  Award, CheckCircle2, Clock, X, FileSignature, 
  Edit, AlertTriangle, AlertCircle, Eye, MessageSquare, Send,
  Upload, FileImage, Trash2
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
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-72 space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/2" />
          <div className="h-36 bg-slate-100 rounded-2xl animate-pulse" />
        </div>
        <div className="xl:col-span-3 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-14 bg-slate-50 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentTrainingPoints({ user }) {
  const [points, setPoints] = useState([]);
  const [activePeriods, setActivePeriods] = useState([]); 
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
  const [appealReason, setAppealReason] = useState('');
  const [appealError, setAppealError] = useState('');
  
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
    setSelectedSemester(hocKy);
    setEditingRecord(null);
    setFormScores({});
    setViewOnly(false);
    setIsModalOpen(true);
  };

  const handleEdit = async (record) => {
    const isPeriodActive = activePeriods.some(ap => ap.HocKy === record.HocKy);
    if (!isPeriodActive) {
      showToast('Đợt đánh giá đã đóng, không thể chỉnh sửa!', 'error');
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
    setAppealReason('');
    setAppealError('');
    setIsAppealModalOpen(true);
  };

  const handleSendAppeal = async () => {
    if (!appealReason.trim()) {
      setAppealError('Vui lòng điền nội dung khiếu nại!');
      return;
    }
    try {
      const appealHocKy = appealSemester.replace('HK', 'Học kỳ ').replace(/_/g, ' ');
      await axios.post(`${API_URL}/api/support`, {
        MSSV: user.username,
        LoaiYeuCau: 'Khiếu nại điểm rèn luyện',
        ChuDe: `Khiếu nại điểm rèn luyện - ${appealHocKy}`,
        NoiDung: appealReason
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
    today.setHours(0,0,0,0);
    const end = new Date(dateStr);
    end.setHours(0,0,0,0);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  const getRealTimeRating = (score) => {
    if (score >= 90) return 'Xuất sắc';
    if (score >= 80) return 'Tốt';
    if (score >= 65) return 'Khá';
    if (score >= 50) return 'Trung bình';
    return 'Yếu';
  };

  const getRatingColor = (score) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 80) return 'text-green-600';
    if (score >= 65) return 'text-blue-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-rose-500';
  };

  const getXepLoaiBadge = (xepLoai) => {
    const colors = {
      'Xuất sắc': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      'Tốt': 'bg-green-50 text-green-700 border border-green-200',
      'Khá': 'bg-blue-50 text-blue-700 border border-blue-200',
      'Trung bình': 'bg-amber-50 text-amber-700 border border-amber-200',
      'Yếu': 'bg-rose-50 text-rose-700 border border-rose-200'
    };
    return colors[xepLoai] || 'bg-gray-50 text-gray-700 border border-gray-200';
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
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-8 text-white shadow-xl flex items-center gap-5 relative overflow-hidden">
        <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl"><Award className="w-10 h-10" /></div>
        <div><h2 className="text-3xl font-black mb-1">Đánh giá rèn luyện</h2><p className="text-orange-100 font-medium">Khai báo tự đánh giá và theo dõi điểm rèn luyện</p></div>
      </motion.div>

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
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-rose-100 shrink-0"
              >
                Khai báo ngay
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* SIDEBAR: ĐỢT ĐÁNH GIÁ */}
        <div className="xl:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-fit space-y-5">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 border-b border-slate-50 pb-3">
            <FileSignature className="w-5 h-5 text-orange-500" /> Đợt đánh giá
          </h3>
          <div className="space-y-4">
            {activePeriods.map((period) => {
              const hasSubmitted = points.some(p => p.HocKy === period.HocKy);
              const daysLeft = getDaysLeft(period.NgayKetThuc);
              
              return (
                <div key={period.MaDotDanhGia} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative overflow-hidden">
                  <div>
                    <p className="font-bold text-slate-800 text-base">{period.HocKy.replace('HK', 'Học kỳ ').replace(/_/g, ' ')}</p>
                    <p className="text-[11px] text-slate-500 font-medium mt-1">Năm học: {period.NamHoc}</p>
                  </div>
                  
                  {/* Countdown và Hạn nộp */}
                  <div className="border-t border-slate-200/60 pt-2 space-y-1 text-xs">
                    <p className="text-slate-500 font-medium">Hạn nộp: <span className="font-bold text-slate-700">{formatDate(period.NgayKetThuc)}</span></p>
                    {daysLeft !== null && (
                      <div className="mt-1.5 inline-block">
                        {daysLeft > 0 ? (
                          <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-blue-50 text-blue-600 border border-blue-100">
                            Còn {daysLeft} ngày
                          </span>
                        ) : daysLeft === 0 ? (
                          <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-amber-50 text-amber-600 border border-amber-200 animate-pulse">
                            Hạn cuối hôm nay!
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-200 text-slate-500">
                            Đã hết hạn
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {hasSubmitted ? (
                    <div className="text-xs font-bold text-emerald-600 bg-emerald-50 p-3 rounded-xl flex items-center justify-center gap-1.5 border border-emerald-100">
                      <CheckCircle2 className="w-4 h-4" /> Đã nộp phiếu
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleOpenNew(period.HocKy)} 
                      disabled={daysLeft !== null && daysLeft < 0}
                      className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none text-white font-bold py-3 rounded-xl text-sm shadow-md shadow-orange-200 transition-colors"
                    >
                      Khai báo ngay
                    </button>
                  )}
                </div>
              );
            })}
            {activePeriods.length === 0 && (
              <p className="text-slate-400 text-sm italic text-center p-4">Hiện không có đợt đánh giá nào mở.</p>
            )}
          </div>
        </div>

        {/* LỊCH SỬ RÈN LUYỆN */}
        <div className="xl:col-span-3 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-lg">Lịch sử rèn luyện</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-5 font-bold">Học kỳ</th>
                  <th className="p-5 font-bold text-center">SV ĐG</th>
                  <th className="p-5 font-bold text-center">Khoa ĐG</th>
                  <th className="p-5 font-bold text-center">Điểm chốt</th>
                  <th className="p-5 font-bold text-center">Xếp loại</th>
                  <th className="p-5 font-bold">Trạng thái</th>
                  <th className="p-5 font-bold text-center">Tác vụ</th>
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
                      <td className="p-5 font-bold text-slate-700">{p.HocKy.replace('HK', 'Học kỳ ').replace(/_/g, ' ')}</td>
                      <td className="p-5 text-center font-bold text-blue-600"><span className="bg-blue-50 px-3 py-1 rounded-md">{p.DiemTuDanhGia}đ</span></td>
                      <td className="p-5 text-center text-slate-500 font-semibold">{p.DiemKhoaDanhGia || '0'}đ</td>
                      <td className="p-5 text-center font-black text-orange-600 text-lg">{p.TongDiem || p.DiemTuDanhGia}đ</td>
                      <td className="p-5 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getXepLoaiBadge(p.XepLoai)}`}>
                          {p.XepLoai || 'Chưa xếp'}
                        </span>
                      </td>
                      <td className="p-5 whitespace-nowrap">
                        {p.TrangThai === 'Đã xác nhận' ? (
                          <span className="text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 w-fit font-bold text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5"/> Đã xác nhận
                          </span>
                        ) : (
                          <span className="text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 w-fit font-bold text-xs">
                            <Clock className="w-3.5 h-3.5"/> Chờ duyệt
                          </span>
                        )}
                      </td>
                      <td className="p-5 text-center text-nowrap">
                        <div className="inline-flex gap-2 justify-center items-center">
                          {/* Nút Xem chi tiết */}
                          <button 
                            onClick={() => handleViewDetails(p)} 
                            className="p-2 bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-lg shadow-sm"
                            title="Xem chi tiết phiếu"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Nút Sửa (chỉ khi chưa duyệt và đợt còn mở) */}
                          {p.TrangThai !== 'Đã xác nhận' && activePeriods.some(ap => ap.HocKy === p.HocKy) && (
                            <button 
                              onClick={() => handleEdit(p)} 
                              className="p-2 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg shadow-sm"
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
                                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs rounded-lg shadow-sm flex items-center gap-1"
                                >
                                  Khiếu nại
                                </button>
                              ) : appealReq.TrangThai === 'Đã xử lý' ? (
                                <button
                                  onClick={() => setViewFeedback(appealReq)}
                                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 font-bold text-xs rounded-lg shadow-sm flex items-center gap-1"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" /> Xem phản hồi
                                </button>
                              ) : (
                                <span className="px-2.5 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs rounded-lg flex items-center gap-1">
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
                    <td colSpan={7} className="p-10 text-center text-slate-400 italic">Chưa có lịch sử rèn luyện.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL PHIẾU ĐÁNH GIÁ (FORM) */}
      <ModalPortal>
        <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
              
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
                <div className="bg-blue-50/50 px-8 py-3 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between shrink-0">
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
                    <span className={`text-base font-black px-3 py-1 bg-white border border-slate-200 rounded-xl ${getRatingColor(currentTotalScore)}`}>
                      {getRealTimeRating(currentTotalScore)}
                    </span>
                  </div>
                </div>
              )}

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 custom-scrollbar">
                {currentCriteria.map((section) => (
                  <div key={section.id} className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-sm">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                      <h3 className="font-black text-slate-800 text-base">{section.title}</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {section.items.map((item) => (
                        <div key={item.id} className="p-6 flex flex-col md:flex-row gap-6">
                          <div className="flex-1">
                            <p className="font-bold text-slate-700 mb-4 text-sm">{item.label}</p>
                            <div className="space-y-3">
                              {item.options.map((opt, idx) => {
                                const isSelected = formScores[item.id]?.optionIndex === idx;
                                return (
                                  <div 
                                    key={idx} 
                                    onClick={() => handleSelectOption(item.id, opt.point, idx)}
                                    className={`flex items-center gap-4 p-3.5 rounded-2xl border-2 transition-all ${
                                      viewOnly 
                                        ? isSelected 
                                          ? 'border-blue-300 bg-blue-50/20 cursor-default' 
                                          : 'border-slate-100 opacity-60 cursor-default'
                                        : isSelected 
                                          ? 'border-blue-500 bg-blue-50/50 cursor-pointer' 
                                          : 'border-slate-100 hover:bg-slate-50 cursor-pointer'
                                    }`}
                                  >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-blue-500' : 'border-slate-300'}`}>
                                      {isSelected && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                                    </div>
                                    <span className={`text-sm font-medium ${isSelected ? 'text-blue-700 font-bold' : 'text-slate-600'}`}>
                                      {opt.label}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                            
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
                                          <div key={fileIndex} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                                            <FileImage className="w-4 h-4 text-blue-500 shrink-0" />
                                            <span className="text-xs font-medium text-slate-700 truncate flex-1">
                                              {file.name}
                                            </span>
                                            {file.type.startsWith('image/') && (
                                              <button 
                                                onClick={() => setPreviewImage(file.data)}
                                                className="text-xs font-bold text-blue-600 hover:underline shrink-0"
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
                                      <label className={`flex-1 flex items-center gap-2 px-3.5 py-2.5 bg-white border rounded-xl text-xs cursor-pointer transition-colors ${(formScores[item.id]?.Files || []).length >= 3 ? 'border-slate-200 bg-slate-50 cursor-not-allowed' : 'border-slate-200 hover:bg-slate-50'}`}>
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
                                          <div key={fileIndex} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                                            <FileImage className="w-4 h-4 text-blue-500 shrink-0" />
                                            <span className="text-xs font-medium text-slate-700 truncate flex-1">
                                              {file.name}
                                            </span>
                                            <button
                                              onClick={() => handleRemoveFile(item.id, fileIndex)}
                                              className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors shrink-0"
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
                          <div className="md:w-32 flex items-center justify-center bg-slate-50 rounded-2xl p-4 border border-slate-100 shrink-0">
                            <span className={`text-3xl font-black ${formScores[item.id] !== undefined ? 'text-blue-600' : 'text-slate-200'}`}>
                              {formScores[item.id] !== undefined ? `+${formScores[item.id].point}` : '-'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Form */}
              <div className="bg-slate-50 border-t border-slate-200 px-8 py-5 flex justify-between items-center shrink-0">
                <div className="flex flex-col">
                  <span className="text-slate-500 font-bold text-xs uppercase">Điểm tự đánh giá</span>
                  <div className="text-4xl font-black text-blue-600">{currentTotalScore} <span className="text-xl text-slate-400">/ 100</span></div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors">
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
              className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
            >
              <div className="bg-red-600 p-5 flex justify-between items-center text-white">
                <h3 className="text-lg font-bold flex items-center gap-2"><AlertTriangle className="w-5 h-5"/> Khiếu nại kết quả rèn luyện</h3>
                <button onClick={() => setIsAppealModalOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Học kỳ khiếu nại</p>
                  <p className="text-base font-bold text-slate-800 mt-0.5">
                    {appealSemester.replace('HK', 'Học kỳ ').replace(/_/g, ' ')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Lý do khiếu nại chi tiết</label>
                  <textarea 
                    rows="4" 
                    value={appealReason}
                    onChange={e => { setAppealReason(e.target.value); setAppealError(''); }}
                    placeholder="Vui lòng ghi rõ lý do bạn khiếu nại (ví dụ: bị cộng thiếu điểm chuyên cần, chưa cộng hoạt động ngoại khóa đã nộp minh chứng...)"
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-red-400 focus:bg-white transition-all text-sm text-slate-700 placeholder-slate-400"
                  />
                  {appealError && <p className="text-red-500 text-xs mt-1.5 font-semibold flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/> {appealError}</p>}
                </div>
              </div>
              <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={() => setIsAppealModalOpen(false)} className="px-5 py-2.5 font-semibold text-slate-600 bg-white border border-gray-300 rounded-xl hover:bg-slate-100">Hủy</button>
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
              className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
            >
              <div className="bg-blue-600 p-5 flex justify-between items-center text-white">
                <h3 className="text-lg font-bold flex items-center gap-2"><MessageSquare className="w-5 h-5"/> Kết quả phản hồi khiếu nại</h3>
                <button onClick={() => setViewFeedback(null)} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lý do khiếu nại của bạn:</p>
                  <p className="text-sm text-slate-700 font-medium mt-1 leading-relaxed">{viewFeedback.NoiDung}</p>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">Gửi ngày: {new Date(viewFeedback.NgayGui).toLocaleString('vi-VN')}</p>
                </div>
                <div className="bg-green-50/50 rounded-2xl p-4 border border-green-150">
                  <p className="text-xs font-bold text-green-700 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Phản hồi từ Ban cán sự / Admin:
                  </p>
                  <p className="text-sm text-green-800 font-semibold mt-1.5 leading-relaxed">
                    {viewFeedback.PhanHoi || 'Đơn khiếu nại đã được giải quyết điểm rèn luyện.'}
                  </p>
                </div>
              </div>
              <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
                <button onClick={() => setViewFeedback(null)} className="px-6 py-2.5 font-bold text-slate-600 bg-white border border-gray-300 rounded-xl hover:bg-slate-100">Đóng</button>
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
                  className="absolute -top-12 right-0 md:-right-12 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
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

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}} />
    </div>
  );
}

export default StudentTrainingPoints;
