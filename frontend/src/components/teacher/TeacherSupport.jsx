import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle, MessageSquare, FileText, Send,
  Clock, CheckCircle2, Monitor, CalendarOff, CalendarClock, FileEdit,
  AlertCircle, Loader2, X, Info, CheckCircle, ArrowRight, Sparkles
} from 'lucide-react';
import axios from 'axios';
import ModalPortal, { Toast, ConfirmDialog } from '../common/ModalPortal';
import API_URL from '../../api';

function TeacherSupport({ user, profile }) {
  const [activeTab, setActiveTab] = useState('requests');
  const [supportList, setSupportList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Question Form State
  const [formData, setFormData] = useState({ chuDe: '', noiDung: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({ chuDe: '', noiDung: '' });

  // Request Form State
  const [requestForm, setRequestForm] = useState({ show: false, chude: '', noiDung: '' });
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestFormErrors, setRequestFormErrors] = useState({ noiDung: '' });
  const [submittedData, setSubmittedData] = useState(null);
  const [viewResponse, setViewResponse] = useState(null);

  // Popup & Toast State
  const [confirmDialog, setConfirmDialog] = useState({ show: false, message: '', onConfirm: null, title: '' });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const fetchSupportData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/support/teacher/${user?.username}`);
      setSupportList(res.data);
    } catch (error) {
      console.error('Lỗi lấy dữ liệu hỗ trợ:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.username) fetchSupportData();
  }, [user]);

  const handleQuickRequest = (chude) => {
    const currentYear = new Date().getFullYear();
    const requestCount = supportList.filter(req =>
      req.LoaiYeuCau === 'Hành chính' &&
      req.ChuDe === chude &&
      new Date(req.NgayGui).getFullYear() === currentYear
    ).length;

    const limits = {
      'Đăng ký phòng học, thiết bị thực hành hoặc thiết bị thí nghiệm': 2,
      'Đơn xin nghỉ phép / Vắng dạy': Infinity,
      'Phiếu đề nghị điều chỉnh thời khóa biểu': Infinity,
      'Phiếu xin điều chỉnh lại bảng điểm': Infinity,
    };

    const maxLimit = limits[chude] || 5;

    if (maxLimit !== Infinity && requestCount >= maxLimit) {
      setToast({
        show: true,
        type: 'error',
        message: `Bạn đã gửi yêu cầu "${chude}" ${requestCount} lần trong năm nay (Giới hạn: ${maxLimit} lần/năm).`
      });
      return;
    }

    setRequestForm({ show: true, chude, noiDung: '' });
    setRequestFormErrors({ noiDung: '' });
  };

  const handleSubmitRequestForm = (e) => {
    e.preventDefault();
    const noiDungTrim = requestForm.noiDung.trim();
    const errors = { noiDung: '' };

    if (!noiDungTrim) {
      errors.noiDung = 'Vui lòng nhập nội dung yêu cầu!';
      setRequestFormErrors(errors);
      return;
    }
    if (noiDungTrim.length < 10) {
      errors.noiDung = 'Nội dung phải có tối thiểu 10 ký tự!';
      setRequestFormErrors(errors);
      return;
    }
    if (noiDungTrim.length > 1000) {
      errors.noiDung = 'Nội dung không được vượt quá 1000 ký tự!';
      setRequestFormErrors(errors);
      return;
    }

    setRequestFormErrors(errors);

    setConfirmDialog({
      show: true,
      title: 'Xác nhận gửi yêu cầu',
      message: `Bạn có chắc chắn muốn gửi yêu cầu "${requestForm.chude}" không?`,
      onConfirm: async () => {
        try {
          setRequestSubmitting(true);
          await axios.post(`${API_URL}/api/support/teacher`, {
            MaGiangVien: user.username,
            LoaiYeuCau: 'Hành chính',
            ChuDe: requestForm.chude,
            NoiDung: requestForm.noiDung
          });
          setSubmittedData({
            MaGiangVien: user.username,
            LoaiYeuCau: 'Hành chính',
            ChuDe: requestForm.chude,
            NoiDung: requestForm.noiDung,
            NgayGui: new Date().toISOString(),
            TrangThai: 'Chờ xử lý'
          });
          setToast({ show: true, message: 'Đã gửi yêu cầu hành chính thành công!', type: 'success' });
          setRequestForm({ show: false, chude: '', noiDung: '' });
          fetchSupportData();
        } catch {
          setToast({ show: true, type: 'error', message: 'Lỗi khi gửi yêu cầu! Vui lòng thử lại.' });
        } finally {
          setRequestSubmitting(false);
        }
      }
    });
  };

  const handleSubmitQuestion = (e) => {
    e.preventDefault();
    const errors = { chuDe: '', noiDung: '' };

    if (!formData.chuDe) {
      errors.chuDe = 'Vui lòng chọn chủ đề!';
      setFormErrors(errors);
      return;
    }
    if (!formData.noiDung) {
      errors.noiDung = 'Vui lòng nhập nội dung chi tiết!';
      setFormErrors(errors);
      return;
    }

    const noiDungTrim = formData.noiDung.trim();
    if (noiDungTrim.length < 10) {
      errors.noiDung = 'Nội dung phải có tối thiểu 10 ký tự!';
      setFormErrors(errors);
      return;
    }
    if (noiDungTrim.length > 1000) {
      errors.noiDung = 'Nội dung không được vượt quá 1000 ký tự!';
      setFormErrors(errors);
      return;
    }

    setFormErrors(errors);

    setConfirmDialog({
      show: true,
      title: 'Xác nhận gửi câu hỏi',
      message: `Bạn có chắc chắn muốn gửi câu hỏi về chủ đề "${formData.chuDe}" không?`,
      onConfirm: async () => {
        try {
          setSubmitting(true);
          await axios.post(`${API_URL}/api/support/teacher`, {
            MaGiangVien: user.username,
            LoaiYeuCau: 'Hỏi đáp',
            ChuDe: formData.chuDe,
            NoiDung: formData.noiDung
          });
          setToast({ show: true, type: 'success', message: 'Đã gửi câu hỏi thành công!' });
          setFormData({ chuDe: '', noiDung: '' });
          fetchSupportData();
        } catch {
          setToast({ show: true, type: 'error', message: 'Lỗi khi gửi câu hỏi! Vui lòng thử lại.' });
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  const requests = supportList.filter(item => item.LoaiYeuCau === 'Hành chính');
  const questions = supportList.filter(item => item.LoaiYeuCau === 'Hỏi đáp');

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const renderStatus = (status) => {
    switch (status) {
      case 'Đã hoàn thành':
      case 'Đã trả lời':
      case 'Đã duyệt':
      case 'Đã phản hồi':
        return <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-200/60"><CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> {status}</span>;
      case 'Chờ xử lý':
      case 'Đang xử lý':
        return <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold border border-amber-200/60"><Clock className="w-3.5 h-3.5 text-amber-600" /> {status}</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-xs font-semibold border border-rose-200/60"><AlertCircle className="w-3.5 h-3.5 text-rose-600" /> {status}</span>;
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-3" />
      <p className="text-sm font-medium text-slate-500">Đang tải trung tâm hỗ trợ...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 rounded-3xl p-6 sm:p-8 text-[#152238] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 rounded-full bg-white/20 blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/3 -mb-12 w-36 h-36 rounded-full bg-orange-300/30 blur-xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/40 backdrop-blur-md rounded-full text-xs font-bold text-[#152238] mb-3">
            <Sparkles className="w-3.5 h-3.5" /> TTrung tâm hỗ trợ Giảng viên
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#152238]">Hỗ trợ & Thủ tục Hành chính</h2>
          <p className="text-[#152238]/80 text-sm mt-1.5 font-medium max-w-xl">Thực hiện thủ tục hành chính trực tuyến và gửi câu hỏi đến các Phòng/Ban.</p>
        </div>
      </div>

      {/* Segmented Control Navigation */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
        {[
          { key: 'requests', label: 'Dịch vụ Hành chính', icon: FileText, count: requests.length },
          { key: 'questions', label: 'Hỏi đáp & Phản hồi', icon: MessageSquare, count: questions.length }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center gap-2 ${
                isActive ? 'text-amber-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-tab-bg"
                  className="absolute inset-0 bg-white rounded-xl shadow-sm"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
                {tab.label}
                <span className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-extrabold ${isActive ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'}`}>
                  {tab.count}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div className="min-h-[450px]">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: DỊCH VỤ HÀNH CHÍNH */}
          {activeTab === 'requests' && (
            <motion.div
              key="requests"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Quick Action Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    title: 'Đăng ký Thiết bị',
                    desc: 'Phòng học, thực hành, thí nghiệm',
                    icon: Monitor,
                    color: 'text-amber-600 bg-amber-50 border-amber-100 hover:border-amber-300',
                    chude: 'Đăng ký phòng học, thiết bị thực hành hoặc thiết bị thí nghiệm'
                  },
                  {
                    title: 'Nghỉ phép / Vắng dạy',
                    desc: 'Xin nghỉ phép, báo vắng dạy',
                    icon: CalendarOff,
                    color: 'text-blue-600 bg-blue-50 border-blue-100 hover:border-blue-300',
                    chude: 'Đơn xin nghỉ phép / Vắng dạy'
                  },
                  {
                    title: 'Điều chỉnh Lịch dạy',
                    desc: 'Phiếu đề nghị đổi TKB',
                    icon: CalendarClock,
                    color: 'text-purple-600 bg-purple-50 border-purple-100 hover:border-purple-300',
                    chude: 'Phiếu đề nghị điều chỉnh thời khóa biểu'
                  },
                  {
                    title: 'Điều chỉnh Bảng điểm',
                    desc: 'Phiếu điều chỉnh điểm số',
                    icon: FileEdit,
                    color: 'text-emerald-600 bg-emerald-50 border-emerald-100 hover:border-emerald-300',
                    chude: 'Phiếu xin điều chỉnh lại bảng điểm'
                  }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleQuickRequest(item.chude)}
                      className="group p-5 bg-white rounded-2xl border border-slate-200/80 hover:shadow-lg hover:-translate-y-0.5 transition-all text-left flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl ${item.color} border transition-colors`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm group-hover:text-amber-600 transition-colors">{item.title}</h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">{item.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Submitted Requests List Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-base">Danh sách Yêu cầu đã gửi</h3>
                  <span className="text-xs font-semibold text-slate-400">Tổng cộng: {requests.length}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/60 text-slate-500 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider">Tên biểu mẫu</th>
                        <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider">Thời gian gửi</th>
                        <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider">Trạng thái</th>
                        <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider text-right">Phản hồi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {requests.length > 0 ? requests.map((req) => (
                        <tr key={req.MaYeuCau} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-800">{req.ChuDe}</td>
                          <td className="px-6 py-4 text-slate-500 text-xs">{formatDateTime(req.NgayGui)}</td>
                          <td className="px-6 py-4">{renderStatus(req.TrangThai)}</td>
                          <td className="px-6 py-4 text-right">
                            {req.PhanHoi ? (
                              <button
                                onClick={() => setViewResponse(req)}
                                className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200/60 transition-colors inline-flex items-center gap-1"
                              >
                                Xem phản hồi
                              </button>
                            ) : (
                              <span className="text-xs text-slate-300 font-medium">Chưa có</span>
                            )}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                            <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                            <p className="font-semibold text-slate-500 text-sm">Chưa có yêu cầu hành chính nào.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: HỎI ĐÁP & HỖ TRỢ */}
          {activeTab === 'questions' && (
            <motion.div
              key="questions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Question Form */}
              <div className="lg:col-span-5">
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm sticky top-6">
                  <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2 text-base">
                    <Send className="w-4 h-4 text-amber-600" /> Gửi câu hỏi mới
                  </h3>
                  <form onSubmit={handleSubmitQuestion} noValidate className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                        Chủ đề <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.chuDe}
                        onChange={(e) => {
                          setFormData({ ...formData, chuDe: e.target.value });
                          if (formErrors.chuDe) setFormErrors({ ...formErrors, chuDe: '' });
                        }}
                        className={`w-full p-3 bg-slate-50 border rounded-xl outline-none text-sm font-medium transition-all ${
                          formErrors.chuDe
                            ? 'border-rose-300 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20'
                            : 'border-slate-200 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20'
                        }`}
                      >
                        <option value="">--- Chọn chủ đề ---</option>
                        <option value="Lỗi hệ thống Website / App">Lỗi hệ thống Website / App</option>
                        <option value="Chính sách - Quy định nhà trường">Chính sách - Quy định nhà trường</option>
                        <option value="Khác">Khác</option>
                      </select>
                      {formErrors.chuDe && <p className="text-rose-500 text-xs mt-1.5 font-semibold">{formErrors.chuDe}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                        Nội dung <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        value={formData.noiDung}
                        onChange={(e) => {
                          setFormData({ ...formData, noiDung: e.target.value.replace(/ +/g, ' ') });
                          if (formErrors.noiDung) setFormErrors({ ...formErrors, noiDung: '' });
                        }}
                        rows="5"
                        placeholder="Mô tả chi tiết nội dung cần giải đáp..."
                        className={`w-full p-3 bg-slate-50 border rounded-xl outline-none text-sm resize-none transition-all ${
                          formErrors.noiDung
                            ? 'border-rose-300 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20'
                            : 'border-slate-200 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20'
                        }`}
                      />
                      <div className="flex items-center justify-between mt-1">
                        {formErrors.noiDung ? <p className="text-rose-500 text-xs font-semibold">{formErrors.noiDung}</p> : <span />}
                        <p className="text-[11px] font-semibold text-slate-400">{formData.noiDung?.length || 0}/1000</p>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-[#152238] rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 text-sm"
                    >
                      {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang gửi...</> : <><Send className="w-4 h-4" /> Gửi Câu Hỏi</>}
                    </button>
                  </form>
                </div>
              </div>

              {/* Questions History */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-base">Lịch sử Hỏi đáp</h3>
                  <span className="text-xs font-semibold text-slate-400">{questions.length} câu hỏi</span>
                </div>

                {questions.map((q) => (
                  <div key={q.MaYeuCau} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm sm:text-base">{q.ChuDe}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(q.NgayGui)}</p>
                      </div>
                      {renderStatus(q.TrangThai)}
                    </div>

                    <p className="text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100 whitespace-pre-wrap leading-relaxed">
                      {q.NoiDung}
                    </p>

                    {q.PhanHoi && (
                      <div className="pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" /> Phản hồi từ Ban Quản lý
                          </span>
                          <span className="text-[11px] font-medium text-slate-400">{formatDateTime(q.NgayPhanHoi)}</span>
                        </div>
                        <p className="text-sm text-slate-800 bg-amber-50/40 p-3.5 rounded-xl border border-amber-100/60 whitespace-pre-wrap leading-relaxed">
                          {q.PhanHoi}
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                {questions.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                    <MessageSquare className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-500 text-sm">Bạn chưa gửi câu hỏi nào.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {/* Success Modal */}
        {submittedData && (
          <ModalPortal>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-100">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Gửi yêu cầu thành công
                  </h3>
                  <button onClick={() => setSubmittedData(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm space-y-2">
                  <p><span className="text-slate-400">Biểu mẫu:</span> <strong className="text-slate-800">{submittedData.ChuDe}</strong></p>
                  <p><span className="text-slate-400">Thời gian:</span> <strong className="text-slate-800">{formatDateTime(submittedData.NgayGui)}</strong></p>
                  <p><span className="text-slate-400">Trạng thái:</span> <strong className="text-amber-600">{submittedData.TrangThai}</strong></p>
                </div>
                <button onClick={() => setSubmittedData(null)} className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm">
                  ĐÓNG
                </button>
              </motion.div>
            </motion.div>
          </ModalPortal>
        )}

        {/* Request Form Modal */}
        {requestForm.show && (
          <ModalPortal>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-600" /> Đăng ký biểu mẫu hành chính
                  </h3>
                  <button onClick={() => setRequestForm({ show: false, chude: '', noiDung: '' })} className="p-1 text-slate-400 hover:text-slate-600 rounded-full"><X className="w-5 h-5" /></button>
                </div>

                <form onSubmit={handleSubmitRequestForm} noValidate className="p-6 space-y-4">
                  <div className="p-4 bg-amber-50/60 border border-amber-100 rounded-xl">
                    <h4 className="font-bold text-amber-900 text-sm">{requestForm.chude}</h4>
                    <p className="text-xs text-amber-700/80 mt-0.5">Vui lòng nhập lý do và thông tin chi tiết.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div><span className="text-slate-400">Giảng viên:</span> <strong className="text-slate-700 block">{profile?.HoTen || 'N/A'}</strong></div>
                    <div><span className="text-slate-400">Mã GV:</span> <strong className="text-slate-700 block">{user?.username || 'N/A'}</strong></div>
                    <div><span className="text-slate-400">Khoa / Bộ môn:</span> <strong className="text-slate-700 block">{profile?.TenKhoa || 'N/A'}</strong></div>
                    <div><span className="text-slate-400">Số điện thoại:</span> <strong className="text-slate-700 block">{profile?.SoDienThoai || 'N/A'}</strong></div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                      Nội dung chi tiết <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      value={requestForm.noiDung}
                      onChange={(e) => {
                        setRequestForm({ ...requestForm, noiDung: e.target.value.replace(/ +/g, ' ') });
                        if (requestFormErrors.noiDung) setRequestFormErrors({ noiDung: '' });
                      }}
                      rows="4"
                      placeholder="Nhập chi tiết nội dung hoặc lý do..."
                      className={`w-full p-3 bg-white border rounded-xl outline-none text-sm resize-none transition-all ${
                        requestFormErrors.noiDung
                          ? 'border-rose-300 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20'
                          : 'border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20'
                      }`}
                    />
                    <div className="flex items-center justify-between mt-1">
                      {requestFormErrors.noiDung ? <p className="text-rose-500 text-xs font-semibold">{requestFormErrors.noiDung}</p> : <span />}
                      <p className="text-[11px] font-semibold text-slate-400">{requestForm.noiDung?.length || 0}/1000</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2.5 pt-2">
                    <button type="button" onClick={() => setRequestForm({ show: false, chude: '', noiDung: '' })} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl text-xs">
                      HỦY BỎ
                    </button>
                    <button type="submit" disabled={requestSubmitting} className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-[#152238] font-bold rounded-xl shadow-sm text-xs disabled:opacity-60 flex items-center gap-1.5">
                      {requestSubmitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> ĐANG GỬI...</> : 'GỬI YÊU CẦU'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          </ModalPortal>
        )}

        {/* View Response Modal */}
        {viewResponse && (
          <ModalPortal>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-100">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-amber-600" /> Chi tiết phản hồi
                  </h3>
                  <button onClick={() => setViewResponse(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-full"><X className="w-5 h-5" /></button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <p className="font-bold text-slate-800 text-sm mb-1">{viewResponse.ChuDe}</p>
                    <p className="text-slate-400 mb-2">{formatDateTime(viewResponse.NgayGui)}</p>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{viewResponse.NoiDung}</p>
                  </div>

                  <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-100">
                    <p className="font-bold text-amber-900 flex items-center gap-1 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" /> Phản hồi từ Ban Quản lý
                    </p>
                    <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{viewResponse.PhanHoi}</p>
                    <p className="text-slate-400 mt-2 text-[11px]">Đã phản hồi lúc: {formatDateTime(viewResponse.NgayPhanHoi)}</p>
                  </div>
                </div>

                <button onClick={() => setViewResponse(null)} className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs">
                  ĐÓNG
                </button>
              </motion.div>
            </motion.div>
          </ModalPortal>
        )}
      </AnimatePresence>

      <ConfirmDialog
        show={confirmDialog.show}
        title={confirmDialog.title || "Xác nhận"}
        message={confirmDialog.message}
        onConfirm={() => {
          if (confirmDialog.onConfirm) confirmDialog.onConfirm();
          setConfirmDialog({ show: false, message: '', onConfirm: null, title: '' });
        }}
        onCancel={() => setConfirmDialog({ show: false, message: '', onConfirm: null, title: '' })}
      />

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: '', type: 'success' })}
      />
    </div>
  );
}

export default TeacherSupport;
