import React, { useState, useEffect } from 'react';
import API_URL from '../../api';
import { TrainingPointsSkeleton } from '../common/AdminSkeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, Filter, CheckCircle2, Clock, Edit, X, Calculator, 
  UserCheck, AlertCircle, CalendarDays, PlusCircle, Power, PlayCircle, StopCircle 
} from 'lucide-react';
import axios from 'axios';

function AdminTrainingPoints() {
  // === QUẢN LÝ TAB ===
  const [activeTab, setActiveTab] = useState('periods');

  // === THÊM STATE: QUẢN LÝ THÔNG BÁO (TOAST NOTIFICATION) ===
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Hàm hiển thị thông báo đẹp mắt thay cho alert()
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    // Tự động tắt sau 3 giây
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // === STATES: ĐỢT ĐÁNH GIÁ ===
  const [periods, setPeriods] = useState([]);
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [periodForm, setPeriodForm] = useState({ HocKy: 'HK1', NamHoc: '2025-2026', NgayBatDau: '', NgayKetThuc: '', TrangThai: 'Đang tự đánh giá' });
  const [periodFormErrors, setPeriodFormErrors] = useState({});

  // === STATES: XÉT DUYỆT ĐIỂM ===
  const [pointsData, setPointsData] = useState([]);
  const [filterHocKy, setFilterHocKy] = useState('All');
  const [filterTrangThai, setFilterTrangThai] = useState('All');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [diemKhoa, setDiemKhoa] = useState(0);
  const [trangThaiDuyet, setTrangThaiDuyet] = useState('Đã xác nhận');
  const [reviewErrors, setReviewErrors] = useState({});
  const [loading, setLoading] = useState(true);

  // === FETCH DATA ===
  const fetchData = async () => {
    try {
      setLoading(true);
      const [pointsRes, periodsRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/training-points`),
        axios.get(`${API_URL}/api/admin/training-periods`)
      ]);
      setPointsData(pointsRes.data);
      setPeriods(periodsRes.data);
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
  // Tách "Năm học" (niên khóa) dạng "YYYY-YYYY" thành năm bắt đầu/kết thúc
  const parseNienKhoa = (namHoc) => {
    const match = /^(\d{4})-(\d{4})$/.exec((namHoc || '').trim());
    if (!match) return null;
    const start = parseInt(match[1], 10);
    const end = parseInt(match[2], 10);
    if (end <= start) return null;
    return { start, end };
  };

  const nienKhoaRange = parseNienKhoa(periodForm.NamHoc);
  const minNgay = nienKhoaRange ? `${nienKhoaRange.start}-01-01` : '';
  const maxNgay = nienKhoaRange ? `${nienKhoaRange.end}-12-31` : '';

  // Khi đổi Năm học: nếu ngày đã chọn rơi ngoài niên khóa mới thì xóa để bắt nhập lại
  const handleNamHocChange = (value) => {
    setPeriodForm(prev => {
      const range = parseNienKhoa(value);
      let { NgayBatDau, NgayKetThuc } = prev;
      if (range) {
        const min = `${range.start}-01-01`;
        const max = `${range.end}-12-31`;
        if (NgayBatDau && (NgayBatDau < min || NgayBatDau > max)) NgayBatDau = '';
        if (NgayKetThuc && (NgayKetThuc < min || NgayKetThuc > max)) NgayKetThuc = '';
      }
      return { ...prev, NamHoc: value, NgayBatDau, NgayKetThuc };
    });
    setPeriodFormErrors(prev => ({ ...prev, NamHoc: '', NgayBatDau: '', NgayKetThuc: '' }));
  };

  // Khi chọn ngày: chặn ngay nếu nằm ngoài niên khóa, kèm thông báo lỗi rõ ràng
  const handleNgayChange = (field, value) => {
    setPeriodFormErrors(prev => ({ ...prev, [field]: '' }));
    if (nienKhoaRange && value && (value < minNgay || value > maxNgay)) {
      setPeriodFormErrors(prev => ({
        ...prev,
        [field]: `Phải nằm trong niên khóa ${nienKhoaRange.start}-${nienKhoaRange.end}`
      }));
      return;
    }
    setPeriodForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCreatePeriod = async () => {
    // Validate trước khi gửi (thay alert bằng showToast)
    if (!nienKhoaRange) return showToast('Vui lòng nhập Năm học đúng định dạng VD: 2025-2026!', 'error');
    if (!periodForm.NgayBatDau || !periodForm.NgayKetThuc) return showToast('Vui lòng chọn đầy đủ Ngày bắt đầu và kết thúc!', 'error');
    if (periodForm.NgayBatDau < minNgay || periodForm.NgayBatDau > maxNgay || periodForm.NgayKetThuc < minNgay || periodForm.NgayKetThuc > maxNgay) {
      return showToast(`Ngày bắt đầu/kết thúc phải nằm trong niên khóa ${nienKhoaRange.start}-${nienKhoaRange.end}!`, 'error');
    }
    if (new Date(periodForm.NgayBatDau) > new Date(periodForm.NgayKetThuc)) return showToast('Ngày kết thúc phải sau Ngày bắt đầu!', 'error');

    try {
      const formattedHocKy = `${periodForm.HocKy}_${periodForm.NamHoc.replace('-', '_')}`;
      
      const response = await axios.post(`${API_URL}/api/admin/training-periods`, {
        HocKy: formattedHocKy,
        NamHoc: periodForm.NamHoc,
        NgayBatDau: periodForm.NgayBatDau,
        NgayKetThuc: periodForm.NgayKetThuc,
        TrangThai: periodForm.TrangThai
      });
      
      // Thành công: Đóng Modal, reset form, load lại data và báo thành công
      setIsPeriodModalOpen(false);
      setPeriodForm({ HocKy: 'HK1', NamHoc: '2025-2026', NgayBatDau: '', NgayKetThuc: '', TrangThai: 'Đang tự đánh giá' });
      setPeriodFormErrors({});
      fetchData(); 
      showToast(response.data.message, 'success');
      
    } catch (error) {
      // Bắt lỗi 400 (Trùng học kỳ) từ Backend và thông báo UI đẹp
      if (error.response && error.response.status === 400) {
        showToast(error.response.data.message, 'error'); 
      } else {
        showToast('Có lỗi xảy ra khi tạo đợt đánh giá!', 'error');
      }
    }
  };

  const handleTogglePeriodStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Đang tự đánh giá' ? 'Đã đóng đợt' : 'Đang tự đánh giá';
    if (!window.confirm(`Bạn có chắc muốn chuyển trạng thái thành: "${newStatus}"?`)) return;
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
    if (filterHocKy !== 'All' && item.HocKy !== filterHocKy) return false;
    if (filterTrangThai !== 'All' && item.TrangThai !== filterTrangThai) return false;
    return true;
  });

  const uniqueSemesters = [...new Set(pointsData.map(item => item.HocKy))];

  const handleOpenReviewModal = (record) => {
    setSelectedRecord(record);
    setDiemKhoa(record.DiemKhoaDanhGia || 0);
    setTrangThaiDuyet(record.TrangThai === 'Chờ lớp duyệt' ? 'Đã xác nhận' : record.TrangThai);
    setReviewErrors({});
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
        TrangThai: trangThaiDuyet
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
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-500';
  };

  const diemSVHienTai = selectedRecord ? (parseInt(selectedRecord.DiemTuDanhGia) || 0) : 0;
  const diemKhoaNhap = parseInt(diemKhoa) || 0;
  const tongDiemPreview = Math.min(diemSVHienTai + diemKhoaNhap, 100);

  if (loading) return <TrainingPointsSkeleton />;

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative">
      
      {/* ======================================================= */}
      {/* GIAO DIỆN THÔNG BÁO TOAST (MỚI THÊM) */}
      {/* ======================================================= */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-8 right-8 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border-l-4 ${
              toast.type === 'success' 
                ? 'bg-white border-green-500 text-gray-800' 
                : 'bg-white border-red-500 text-gray-800'
            }`}
          >
            {toast.type === 'success' ? (
              <div className="bg-green-100 p-2 rounded-full"><CheckCircle2 className="w-6 h-6 text-green-600" /></div>
            ) : (
              <div className="bg-red-100 p-2 rounded-full"><AlertCircle className="w-6 h-6 text-red-600" /></div>
            )}
            <div>
              <p className="font-bold text-sm">{toast.type === 'success' ? 'Thành công' : 'Thất bại'}</p>
              <p className="text-gray-600 font-medium text-sm">{toast.message}</p>
            </div>
            <button onClick={() => setToast({ show: false })} className="ml-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-8 shadow-lg relative overflow-hidden flex items-center gap-5"
      >
        <div className="p-4 bg-white/20 rounded-2xl relative z-10 backdrop-blur-sm">
          <Award className="w-10 h-10 text-white" />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white mb-1">Cổng Rèn luyện</h2>
          <p className="text-orange-100 text-lg">Quản lý đợt mở và Xét duyệt điểm sinh viên</p>
        </div>
        <Award className="absolute -right-6 -bottom-6 w-48 h-48 text-white opacity-10 transform rotate-12" />
      </motion.div>

      {/* Tabs */}
      <div className="flex bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 w-fit">
        <button 
          onClick={() => setActiveTab('periods')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'periods' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <CalendarDays className="w-5 h-5" /> Quản lý Đợt đánh giá
        </button>
        <button 
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'reviews' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
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
              <h3 className="text-xl font-bold text-gray-800">Danh sách các đợt đã thiết lập</h3>
              <button 
                onClick={() => setIsPeriodModalOpen(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-5 rounded-xl transition-colors shadow-sm flex items-center gap-2"
              >
                <PlusCircle className="w-5 h-5" /> Mở đợt mới
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                      <th className="p-4 font-semibold w-16">ID</th>
                      <th className="p-4 font-semibold">Học kỳ / Năm học</th>
                      <th className="p-4 font-semibold">Thời gian mở</th>
                      <th className="p-4 font-semibold">Trạng thái</th>
                      <th className="p-4 font-semibold text-center">Điều khiển</th>
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map(p => (
                      <tr key={p.MaDotDanhGia} className="border-b border-gray-50 hover:bg-orange-50/20 transition-colors">
                        <td className="p-4 font-bold text-gray-400">#{p.MaDotDanhGia}</td>
                        <td className="p-4 font-bold text-gray-800">
                          {p.HocKy.replace('HK', 'Học kỳ ').replace(/_/g, ' ')}
                        </td>
                        <td className="p-4 text-sm text-gray-600 font-medium">
                          {formatDate(p.NgayBatDau)} <span className="mx-1 text-gray-400">→</span> {formatDate(p.NgayKetThuc)}
                        </td>
                        <td className="p-4">
                          {p.TrangThai === 'Đang tự đánh giá' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                              <PlayCircle className="w-3.5 h-3.5" /> Đang mở cho SV
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                              <StopCircle className="w-3.5 h-3.5" /> Đã đóng
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => handleTogglePeriodStatus(p.MaDotDanhGia, p.TrangThai)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border ${p.TrangThai === 'Đang tự đánh giá' ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-600 hover:text-white' : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-600 hover:text-white'}`}
                          >
                            <Power className="w-3.5 h-3.5 inline mr-1" />
                            {p.TrangThai === 'Đang tự đánh giá' ? 'Đóng đợt này' : 'Mở lại đợt'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {periods.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-gray-400 italic">Chưa có đợt đánh giá nào được tạo.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ======================================================= */}
        {/* TAB 2: XÉT DUYỆT ĐIỂM */}
        {/* ======================================================= */}
        {activeTab === 'reviews' && (
          <motion.div key="reviews" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            
            {/* Bộ lọc */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 text-gray-500 font-semibold text-sm">
                <Filter className="w-4 h-4" /> Bộ lọc:
              </div>
              <select
                value={filterHocKy} onChange={e => setFilterHocKy(e.target.value)}
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 outline-none"
              >
                <option value="All">Tất cả học kỳ</option>
                {uniqueSemesters.map(hk => (
                  <option key={hk} value={hk}>{hk.replace('HK', 'Học kỳ ').replace(/_/g, ' ')}</option>
                ))}
              </select>
              <select
                value={filterTrangThai} onChange={e => setFilterTrangThai(e.target.value)}
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 outline-none"
              >
                <option value="All">Tất cả trạng thái</option>
                <option value="Chờ lớp duyệt">Chờ duyệt</option>
                <option value="Đã xác nhận">Đã xác nhận</option>
              </select>
            </div>

            {/* Bảng dữ liệu Sinh viên */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[900px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm">
                      <th className="p-4 font-semibold w-1/4">Sinh viên</th>
                      <th className="p-4 font-semibold">Học kỳ</th>
                      <th className="p-4 font-semibold text-center">SV Tự ĐG</th>
                      <th className="p-4 font-semibold text-center">Admin Cộng thêm</th>
                      <th className="p-4 font-semibold text-center">Tổng điểm</th>
                      <th className="p-4 font-semibold">Trạng thái</th>
                      <th className="p-4 font-semibold text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((item) => (
                      <tr key={item.MaDanhGia} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-gray-800">{item.HoTen}</p>
                          <p className="text-xs text-gray-500 font-medium mt-0.5">{item.MSSV} · Lớp: {item.MaLop}</p>
                        </td>
                        <td className="p-4 text-sm font-medium text-gray-600">
                          {item.HocKy.replace('HK', 'HK ').replace(/_/g, ' ')}
                        </td>
                        <td className="p-4 text-center font-bold text-blue-600 bg-blue-50/20">{item.DiemTuDanhGia}</td>
                        <td className="p-4 text-center font-bold text-gray-500">{item.DiemKhoaDanhGia || '0'}</td>
                        <td className="p-4 text-center">
                          <span className={`text-lg font-black ${getScoreColor(item.TongDiem || item.DiemTuDanhGia)}`}>
                            {item.TongDiem || item.DiemTuDanhGia}
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
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => handleOpenReviewModal(item)}
                            className="px-4 py-2 bg-white border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg font-bold text-xs transition-colors shadow-sm inline-flex items-center gap-1.5"
                          >
                            <Edit className="w-3.5 h-3.5" /> Duyệt
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredData.length === 0 && (
                      <tr><td colSpan={7} className="p-12 text-center text-gray-400 italic">Không có dữ liệu phiếu đánh giá.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================================================= */}
      {/* MODAL: TẠO ĐỢT MỞ MỚI */}
      {/* ======================================================= */}
      <AnimatePresence>
        {isPeriodModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-orange-500 p-5 flex justify-between items-center text-white">
                <h3 className="text-lg font-bold flex items-center gap-2"><CalendarDays className="w-5 h-5"/> Thiết lập đợt đánh giá</h3>
                <button onClick={() => setIsPeriodModalOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Học kỳ</label>
                    <select value={periodForm.HocKy} onChange={e => setPeriodForm({...periodForm, HocKy: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-700">
                      <option value="HK1">Học kỳ 1</option>
                      <option value="HK2">Học kỳ 2</option>
                      <option value="HK3">Học kỳ 3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Năm học</label>
                    <input
                      type="text"
                      placeholder="VD: 2025-2026"
                      value={periodForm.NamHoc}
                      onChange={e => handleNamHocChange(e.target.value)}
                      className={`w-full p-3 bg-gray-50 border rounded-xl outline-none font-bold text-gray-700 ${!nienKhoaRange && periodForm.NamHoc ? 'border-red-400 focus:border-red-500' : 'border-gray-200'}`}
                    />
                    {!nienKhoaRange && periodForm.NamHoc && (
                      <p className="text-red-500 text-xs mt-1.5 font-medium">Định dạng phải là YYYY-YYYY, VD: 2025-2026</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Ngày bắt đầu</label>
                    <input
                      type="date"
                      value={periodForm.NgayBatDau}
                      onChange={e => handleNgayChange('NgayBatDau', e.target.value)}
                      min={minNgay || undefined}
                      max={maxNgay || undefined}
                      disabled={!nienKhoaRange}
                      className={`w-full p-3 bg-white border rounded-xl outline-none text-sm text-gray-600 disabled:bg-gray-100 disabled:cursor-not-allowed ${periodFormErrors.NgayBatDau ? 'border-red-500 focus:border-red-500' : 'border-gray-200'}`}
                    />
                    {periodFormErrors.NgayBatDau && (
                      <p className="text-red-500 text-xs mt-1.5 font-medium">{periodFormErrors.NgayBatDau}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Ngày kết thúc</label>
                    <input
                      type="date"
                      value={periodForm.NgayKetThuc}
                      onChange={e => handleNgayChange('NgayKetThuc', e.target.value)}
                      min={minNgay || undefined}
                      max={maxNgay || undefined}
                      disabled={!nienKhoaRange}
                      className={`w-full p-3 bg-white border rounded-xl outline-none text-sm text-gray-600 disabled:bg-gray-100 disabled:cursor-not-allowed ${periodFormErrors.NgayKetThuc ? 'border-red-500 focus:border-red-500' : 'border-gray-200'}`}
                    />
                    {periodFormErrors.NgayKetThuc && (
                      <p className="text-red-500 text-xs mt-1.5 font-medium">{periodFormErrors.NgayKetThuc}</p>
                    )}
                  </div>
                </div>
                {nienKhoaRange && (
                  <p className="text-[11px] text-gray-400 -mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Chỉ được chọn ngày trong khoảng {nienKhoaRange.start}-01-01 đến {nienKhoaRange.end}-12-31
                  </p>
                )}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Trạng thái khởi tạo</label>
                  <select value={periodForm.TrangThai} onChange={e => setPeriodForm({...periodForm, TrangThai: e.target.value})} className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-sm font-bold text-green-600">
                    <option value="Đang tự đánh giá">Mở cho phép Sinh viên làm bài ngay</option>
                    <option value="Đã đóng đợt">Đóng (Lưu nháp)</option>
                  </select>
                </div>
              </div>
              <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => { setIsPeriodModalOpen(false); setPeriodFormErrors({}); }} className="px-5 py-2.5 font-semibold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">Hủy</button>
                <button onClick={handleCreatePeriod} className="px-6 py-2.5 font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 shadow-md shadow-orange-200">Xác nhận tạo đợt</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================= */}
      {/* MODAL: XÉT DUYỆT ĐIỂM */}
      {/* ======================================================= */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-blue-600 p-5 flex justify-between items-center text-white">
                <h3 className="text-lg font-bold flex items-center gap-2"><UserCheck className="w-5 h-5" /> Xét duyệt điểm rèn luyện</h3>
                <button onClick={() => { setSelectedRecord(null); setReviewErrors({}); }} className="p-1.5 hover:bg-white/20 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-5">
                <div className="text-center">
                  <h4 className="font-bold text-gray-800 text-lg">{selectedRecord.HoTen}</h4>
                  <p className="text-sm text-gray-500 mt-0.5">{selectedRecord.MSSV} · Lớp: {selectedRecord.MaLop}</p>
                  <span className="mt-2 inline-block px-3 py-1 bg-gray-100 text-gray-600 font-bold rounded-lg text-sm">{selectedRecord.HocKy.replace('HK', 'Học kỳ ').replace(/_/g, ' ')}</span>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-blue-800">Điểm SV tự đánh giá:</span>
                    <span className="text-2xl font-black text-blue-600">{selectedRecord.DiemTuDanhGia} / 100</span>
                  </div>
                  <p className="text-[11px] text-blue-600 mt-2 italic flex gap-1 items-start">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Chỉ được phép cộng tối đa {100 - selectedRecord.DiemTuDanhGia} điểm để tổng không vượt 100.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Điểm Admin cộng thêm</label>
                  <input type="number" min="0" max={100 - selectedRecord.DiemTuDanhGia} value={diemKhoa} onChange={e => setDiemKhoa(e.target.value)} className={`w-full p-3 bg-white border ${reviewErrors.diemKhoa ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-400'} rounded-xl outline-none text-2xl font-black text-center transition-colors`} />
                  {reviewErrors.diemKhoa && <p className="text-red-500 text-sm mt-1.5 font-medium flex items-center gap-1"><AlertCircle className="w-4 h-4"/> {reviewErrors.diemKhoa}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Trạng thái phê duyệt</label>
                  <select value={trangThaiDuyet} onChange={e => setTrangThaiDuyet(e.target.value)} className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-400 text-sm font-bold text-gray-700 transition-colors">
                    <option value="Chờ lớp duyệt">Lưu nháp (Chưa chốt)</option>
                    <option value="Đã xác nhận">Đã xác nhận (Chốt sổ)</option>
                  </select>
                </div>
                <motion.div key={tongDiemPreview} initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-gray-600 text-sm font-bold"><Calculator className="w-5 h-5 text-blue-500" /> TỔNG ĐIỂM DỰ KIẾN:</div>
                  <span className={`text-4xl font-black ${getScoreColor(tongDiemPreview)}`}>{tongDiemPreview}</span>
                </motion.div>
              </div>
              <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => setSelectedRecord(null)} className="px-5 py-2.5 font-semibold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">Hủy</button>
                <button onClick={handleSubmitReview} className="px-6 py-2.5 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Chốt điểm</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 ${
              toast.type === 'success' 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
                : 'bg-gradient-to-r from-red-500 to-orange-600 text-white'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <AlertCircle className="w-6 h-6" />
            )}
            <span className="font-bold text-lg">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminTrainingPoints;