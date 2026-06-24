import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle, MessageSquare, FileText, Send,
  Clock, CheckCircle2, ShieldAlert, GraduationCap,
  AlertCircle, ChevronDown, Loader2, X, Info
} from 'lucide-react';
import axios from 'axios';
import ModalPortal, { Toast, ConfirmDialog } from '../common/ModalPortal';
import API_URL from '../../api';

function TeacherSupport({ user, profile }) {
  const [activeTab, setActiveTab] = useState('requests');
  const [supportList, setSupportList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({ chuDe: '', noiDung: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({ chuDe: '', noiDung: '' });

  const [requestForm, setRequestForm] = useState({ show: false, chude: '', noiDung: '' });
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestFormErrors, setRequestFormErrors] = useState({ noiDung: '' });
  const [submittedData, setSubmittedData] = useState(null);
  const [viewResponse, setViewResponse] = useState(null);

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
      'Xác nhận công tác giảng dạy': 3,
      'Đơn xin nghỉ phép / Vắng dạy': 5,
      'Yêu cầu cấp lại tài khoản / Hỗ trợ kỹ thuật': 3,
    };
    const maxLimit = limits[chude] || 5;
    if (requestCount >= maxLimit) {
      setToast({
        show: true,
        type: 'error',
        message: `Bạn đã yêu cầu "${chude}" ${requestCount} lần trong năm nay (Giới hạn: ${maxLimit} lần/năm).`
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
    if (!noiDungTrim) { errors.noiDung = 'Vui lòng nhập nội dung yêu cầu!'; setRequestFormErrors(errors); return; }
    if (noiDungTrim.length < 10) { errors.noiDung = 'Nội dung phải có ít nhất 10 ký tự!'; setRequestFormErrors(errors); return; }
    if (noiDungTrim.length > 1000) { errors.noiDung = 'Nội dung không được vượt quá 1000 ký tự!'; setRequestFormErrors(errors); return; }
    if (/[`~#^]/.test(noiDungTrim)) { errors.noiDung = 'Nội dung không được chứa ký tự đặc biệt: ` ~ # ^'; setRequestFormErrors(errors); return; }
    setRequestFormErrors(errors);
    setConfirmDialog({
      show: true,
      title: 'Xác nhận đăng ký biểu mẫu',
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
            MaGiangVien: user.username, LoaiYeuCau: 'Hành chính',
            ChuDe: requestForm.chude, NoiDung: requestForm.noiDung,
            NgayGui: new Date().toISOString(), TrangThai: 'Đang xử lý'
          });
          setToast({ show: true, message: 'Đã gửi yêu cầu thành công!', type: 'success' });
          setRequestForm({ show: false, chude: '', noiDung: '' });
          fetchSupportData();
        } catch { setToast({ show: true, type: 'error', message: 'Lỗi khi gửi yêu cầu! Vui lòng thử lại.' }); }
        finally { setRequestSubmitting(false); }
      }
    });
  };

  const handleSubmitQuestion = (e) => {
    e.preventDefault();
    const errors = { chuDe: '', noiDung: '' };
    if (!formData.chuDe) { errors.chuDe = 'Vui lòng chọn chủ đề!'; setFormErrors(errors); return; }
    if (!formData.noiDung) { errors.noiDung = 'Vui lòng nhập nội dung chi tiết!'; setFormErrors(errors); return; }
    const noiDungTrim = formData.noiDung.trim();
    if (noiDungTrim.length < 10) { errors.noiDung = 'Nội dung phải có ít nhất 10 ký tự!'; setFormErrors(errors); return; }
    if (noiDungTrim.length > 1000) { errors.noiDung = 'Nội dung không được vượt quá 1000 ký tự!'; setFormErrors(errors); return; }
    if (/[`~#^]/.test(noiDungTrim)) { errors.noiDung = 'Nội dung không được chứa ký tự đặc biệt: ` ~ # ^'; setFormErrors(errors); return; }
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
        } catch { setToast({ show: true, type: 'error', message: 'Lỗi khi gửi câu hỏi! Vui lòng thử lại.' }); }
        finally { setSubmitting(false); }
      }
    });
  };

  const requests = supportList.filter(item => item.LoaiYeuCau === 'Hành chính');
  const questions = supportList.filter(item => item.LoaiYeuCau === 'Hỏi đáp');

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const renderStatus = (status) => {
    switch (status) {
      case 'Đã hoàn thành': case 'Đã trả lời': case 'Đã duyệt': case 'Đã phản hồi':
        return <span className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1.5 rounded-full text-xs font-bold w-fit"><CheckCircle2 className="w-3.5 h-3.5" />{status}</span>;
      case 'Đang xử lý':
        return <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full text-xs font-bold w-fit"><Clock className="w-3.5 h-3.5" />{status}</span>;
      default:
        return <span className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1.5 rounded-full text-xs font-bold w-fit"><AlertCircle className="w-3.5 h-3.5" />{status}</span>;
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
            <HelpCircle className="w-7 h-7" /> Trung tâm Hỗ trợ Giảng viên
          </h2>
          <p className="text-orange-100 text-base">Thực hiện thủ tục hành chính trực tuyến và gửi câu hỏi đến các Phòng/Ban.</p>
        </div>
        <MessageSquare className="absolute -right-4 -bottom-4 w-40 h-40 text-white opacity-10 transform -rotate-12" />
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-xl p-1 shadow-sm border border-orange-100">
        <button onClick={() => setActiveTab('requests')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold transition-all duration-300 ${activeTab === 'requests' ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-200' : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'}`}>
          <FileText className="w-4 h-4" /> Dịch vụ Hành chính
        </button>
        <button onClick={() => setActiveTab('questions')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold transition-all duration-300 ${activeTab === 'questions' ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-200' : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'}`}>
          <MessageSquare className="w-4 h-4" /> Hỏi đáp - Hỗ trợ
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 min-h-[500px]">
        <AnimatePresence mode="wait">
          {/* TAB 1: HÀNH CHÍNH */}
          {activeTab === 'requests' && (
            <motion.div key="requests" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-5">
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-500" /> Tạo yêu cầu mới
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button onClick={() => handleQuickRequest('Xác nhận công tác giảng dạy')} className="group bg-white border-2 border-orange-200 hover:border-orange-500 rounded-xl p-6 transition-all shadow-sm hover:shadow-lg hover:-translate-y-1 flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-orange-100 group-hover:bg-orange-500 flex items-center justify-center transition-colors">
                      <GraduationCap className="w-8 h-8 text-orange-500 group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 group-hover:text-orange-600 transition-colors text-center">Xác nhận công tác giảng dạy</span>
                  </button>
                  <button onClick={() => handleQuickRequest('Đơn xin nghỉ phép / Vắng dạy')} className="group bg-white border-2 border-blue-200 hover:border-blue-500 rounded-xl p-6 transition-all shadow-sm hover:shadow-lg hover:-translate-y-1 flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-blue-100 group-hover:bg-blue-500 flex items-center justify-center transition-colors">
                      <ShieldAlert className="w-8 h-8 text-blue-500 group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors text-center">Đơn xin nghỉ phép / Vắng dạy</span>
                  </button>
                  <button onClick={() => handleQuickRequest('Phiếu đề nghị điều chỉnh thời khóa biểu')} className="group bg-white border-2 border-red-200 hover:border-red-500 rounded-xl p-6 transition-all shadow-sm hover:shadow-lg hover:-translate-y-1 flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-red-100 group-hover:bg-red-500 flex items-center justify-center transition-colors">
                      <AlertCircle className="w-8 h-8 text-red-500 group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 group-hover:text-red-600 transition-colors text-center">Phiếu đề nghị điều chỉnh thời khóa biểu</span>
                  </button>
                </div>
              </div>

              {/* Bảng biểu mẫu đã gửi */}
              <div>
                <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" /> Các biểu mẫu đã gửi
                  <span className="text-sm font-normal text-gray-400 ml-1">({requests.length})</span>
                </h3>
                <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs">
                        <th className="px-3 py-3 font-semibold w-14 text-center">STT</th>
                        <th className="px-3 py-3 font-semibold">Loại biểu mẫu</th>
                        <th className="px-3 py-3 font-semibold w-36">Ngày gửi</th>
                        <th className="px-3 py-3 font-semibold w-36">Ngày xác nhận</th>
                        <th className="px-3 py-3 font-semibold text-center w-32">Trạng thái</th>
                        <th className="px-3 py-3 font-semibold text-center w-24">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.length > 0 ? requests.map((req, index) => (
                        <tr key={req.MaYeuCau} className="border-b border-gray-100 hover:bg-orange-50/50 transition-colors">
                          <td className="px-3 py-3 text-gray-500 text-xs text-center font-medium">{index + 1}</td>
                          <td className="px-3 py-3 text-gray-800 font-medium text-xs">{req.ChuDe}</td>
                          <td className="px-3 py-3 text-gray-500 text-xs">
                            {req.NgayGui ? new Date(req.NgayGui).toLocaleDateString('vi-VN') + ' ' + new Date(req.NgayGui).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                          <td className="px-3 py-3 text-gray-500 text-xs">
                            {req.NgayPhanHoi ? new Date(req.NgayPhanHoi).toLocaleDateString('vi-VN') + ' ' + new Date(req.NgayPhanHoi).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </td>
                          <td className="px-3 py-3 text-center">
                            {req.TrangThai === 'Đang xử lý' ? (
                              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-md"><Clock className="w-3 h-3" /> Đang xử lý</span>
                            ) : req.TrangThai === 'Đã hoàn thành' || req.TrangThai === 'Đã duyệt' || req.TrangThai === 'Đã phản hồi' ? (
                              <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-md"><CheckCircle2 className="w-3 h-3" /> Đã xử lý</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-md"><AlertCircle className="w-3 h-3" /> {req.TrangThai}</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            {req.PhanHoi ? (
                              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setViewResponse(req)} className="px-3 py-1.5 bg-orange-50 border border-orange-200 text-orange-600 hover:bg-orange-600 hover:text-white rounded-lg font-semibold text-xs transition-all shadow-sm">
                                Xem
                              </motion.button>
                            ) : <span className="text-gray-400 text-xs">-</span>}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="6" className="text-center py-10 text-gray-400 italic">
                            <FileText className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                            Bạn chưa tạo yêu cầu hành chính nào.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: HỎI ĐÁP */}
          {activeTab === 'questions' && (
            <motion.div key="questions" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <div className="bg-orange-50 p-5 rounded-xl border border-orange-100">
                <h3 className="text-base font-bold text-orange-600 mb-4 flex items-center gap-2 border-b border-orange-200 pb-2">
                  <Send className="w-5 h-5" /> Gửi câu hỏi cho Nhà trường
                </h3>
                <form onSubmit={handleSubmitQuestion} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Chủ đề cần hỗ trợ <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <select required value={formData.chuDe} onChange={(e) => { setFormData({ ...formData, chuDe: e.target.value }); if (formErrors.chuDe) setFormErrors({ ...formErrors, chuDe: '' }); }} className={`w-full p-2.5 bg-white border rounded-lg appearance-none focus:outline-none focus:ring-2 font-medium text-gray-800 text-sm transition-all ${formErrors.chuDe ? 'border-red-400 focus:ring-red-500/20' : 'border-orange-200 focus:border-orange-500 focus:ring-orange-500/20'}`}>
                          <option value="">--- Chọn chủ đề ---</option>
                          <option value="Lỗi hệ thống Website / App">Lỗi hệ thống Website / App</option>
                          <option value="Chính sách - Quy định nhà trường">Chính sách - Quy định nhà trường</option>
                          <option value="Khác">Khác</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-orange-400 pointer-events-none" />
                      </div>
                      {formErrors.chuDe && <p className="text-red-500 text-xs mt-1">{formErrors.chuDe}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Phòng ban tiếp nhận</label>
                      <input type="text" disabled value="Hệ thống tự động phân luồng" className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 font-medium cursor-not-allowed text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Nội dung chi tiết <span className="text-red-500">*</span></label>
                    <textarea value={formData.noiDung} onChange={(e) => { setFormData({ ...formData, noiDung: e.target.value }); if (formErrors.noiDung) setFormErrors({ ...formErrors, noiDung: '' }); }} rows="4" placeholder="Vui lòng trình bày rõ vấn đề bạn đang gặp phải..." className={`w-full p-3 bg-white border rounded-lg focus:outline-none focus:ring-2 resize-none text-gray-800 text-sm transition-all ${formErrors.noiDung ? 'border-red-400 focus:ring-red-500/20' : 'border-orange-200 focus:border-orange-500 focus:ring-orange-500/20'}`}></textarea>
                    <div className="flex items-center justify-between mt-1">
                      {formErrors.noiDung ? <p className="text-red-500 text-xs">{formErrors.noiDung}</p> : <span />}
                      <p className="text-xs text-gray-400">{formData.noiDung?.length || 0}/1000</p>
                    </div>
                  </div>
                  <div className="text-right pt-1">
                    <button type="submit" disabled={submitting} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-all flex items-center gap-2 ml-auto shadow-md shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                      {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang gửi...</> : <><Send className="w-4 h-4" /> Gửi Yêu Cầu</>}
                    </button>
                  </div>
                </form>
              </div>

              <div>
                <h3 className="text-base font-bold text-gray-800 mb-3 border-b pb-2">Câu hỏi đã gửi ({questions.length})</h3>
                <div className="space-y-3">
                  {questions.map((q) => (
                    <div key={q.MaYeuCau} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-800 text-sm">{q.ChuDe}</h4>
                          <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" /> Gửi lúc: {formatDate(q.NgayGui)}</span>
                        </div>
                        {renderStatus(q.TrangThai)}
                      </div>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-xs border border-gray-100 whitespace-pre-wrap">{q.NoiDung}</p>
                      {q.PhanHoi && (
                        <div className="mt-3 pl-3 border-l-4 border-orange-500">
                          <p className="text-xs font-bold text-orange-700 mb-1 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Nhà trường phản hồi:</p>
                          <p className="text-xs text-gray-500 mb-1">Ngày phản hồi: {q.NgayPhanHoi ? formatDate(q.NgayPhanHoi) : 'N/A'}</p>
                          <p className="text-xs text-gray-800 bg-orange-50 p-3 rounded-lg border border-orange-100 whitespace-pre-wrap">{q.PhanHoi}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  {questions.length === 0 && (
                    <div className="text-center p-8 text-gray-400 italic bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      Bạn chưa gửi câu hỏi nào.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* POPUPS */}
      <AnimatePresence>
        {/* Modal thông tin đã gửi */}
        {submittedData && (
          <ModalPortal>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="bg-white w-full max-w-2xl rounded-xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-white flex justify-between items-center">
                  <h3 className="text-base font-bold flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> THÔNG TIN BIỂU MẪU ĐÃ GỬI</h3>
                  <button onClick={() => setSubmittedData(null)} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Mã GV:</span><span className="font-semibold">{submittedData.MaGiangVien}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Loại yêu cầu:</span><span className="font-semibold">{submittedData.LoaiYeuCau}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Chủ đề:</span><span className="font-semibold">{submittedData.ChuDe}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Ngày gửi:</span><span className="font-semibold">{new Date(submittedData.NgayGui).toLocaleString('vi-VN')}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Trạng thái:</span><span className="font-semibold text-orange-600">{submittedData.TrangThai}</span></div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h4 className="text-sm font-bold text-gray-700 mb-2">Nội dung yêu cầu:</h4>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap bg-white p-3 rounded-lg border border-gray-200">{submittedData.NoiDung}</p>
                  </div>
                  <div className="flex justify-center pt-2">
                    <button onClick={() => setSubmittedData(null)} className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg text-sm shadow-md shadow-orange-200">ĐÓNG</button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </ModalPortal>
        )}

        {/* Modal form đăng ký biểu mẫu */}
        {requestForm.show && (
          <ModalPortal>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="bg-white w-full max-w-2xl rounded-xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-white flex justify-between items-center">
                  <h3 className="text-base font-bold flex items-center gap-2"><FileText className="w-5 h-5" /> ĐĂNG KÝ BIỂU MẪU</h3>
                  <button onClick={() => setRequestForm({ show: false, chude: '', noiDung: '' })} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmitRequestForm} className="p-6">
                  <div className="text-center mb-5">
                    <h2 className="text-lg font-black text-orange-600 uppercase tracking-wider inline-block border-b-4 border-orange-500 pb-1">{requestForm.chude}</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 bg-orange-50/30 p-4 rounded-xl border border-orange-100/50">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <label className="w-24 text-xs font-bold text-gray-700 shrink-0">Họ và tên:</label>
                        <input type="text" disabled value={profile?.HoTen || 'Chưa cập nhật'} className="w-full p-2.5 bg-white/60 border border-gray-100 rounded-lg text-gray-800 font-semibold cursor-default focus:outline-none text-sm" />
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="w-24 text-xs font-bold text-gray-700 shrink-0">Mã GV:</label>
                        <input type="text" disabled value={user?.username || ''} className="w-full p-2.5 bg-white/60 border border-gray-100 rounded-lg text-gray-800 font-semibold cursor-default focus:outline-none text-sm" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <label className="w-24 text-xs font-bold text-gray-700 shrink-0">Khoa:</label>
                        <input type="text" disabled value={profile?.TenKhoa || 'Chưa cập nhật'} className="w-full p-2.5 bg-white/60 border border-gray-100 rounded-lg text-gray-800 font-semibold cursor-default focus:outline-none text-sm" />
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="w-24 text-xs font-bold text-gray-700 shrink-0">Điện thoại:</label>
                        <input type="text" disabled value={profile?.SoDienThoai || 'Chưa cập nhật'} className="w-full p-2.5 bg-white/60 border border-gray-100 rounded-lg text-gray-800 font-semibold cursor-default focus:outline-none text-sm" />
                      </div>
                    </div>
                  </div>
                  <div className="mb-5">
                    <label className="block text-xs font-bold text-gray-700 mb-2">Nội dung yêu cầu <span className="text-red-500">*</span></label>
                    <textarea value={requestForm.noiDung} onChange={(e) => { setRequestForm({ ...requestForm, noiDung: e.target.value }); if (requestFormErrors.noiDung) setRequestFormErrors({ noiDung: '' }); }} rows="4" placeholder="Vui lòng nhập lý do hoặc nội dung chi tiết..." className={`w-full p-3 bg-white border rounded-lg focus:outline-none focus:ring-2 resize-none text-gray-800 text-sm ${requestFormErrors.noiDung ? 'border-red-500 focus:ring-red-500/20' : 'border-orange-200 focus:border-orange-500 focus:ring-orange-500/20'}`} />
                    <div className="flex items-center justify-between mt-1">
                      {requestFormErrors.noiDung ? <p className="text-red-500 text-xs">{requestFormErrors.noiDung}</p> : <span />}
                      <p className="text-xs text-gray-400">{requestForm.noiDung?.length || 0}/1000</p>
                    </div>
                  </div>
                  <div className="flex justify-center gap-3 pt-4 border-t border-gray-100">
                    <button type="button" onClick={() => setRequestForm({ show: false, chude: '', noiDung: '' })} className="px-6 py-2.5 text-orange-600 bg-orange-50 hover:bg-orange-100 font-semibold rounded-lg border border-orange-200 text-sm">HỦY BỎ</button>
                    <button type="submit" disabled={requestSubmitting} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-2.5 px-8 rounded-lg shadow-md shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm">
                      {requestSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> ĐANG XỬ LÝ...</> : 'ĐĂNG KÝ'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          </ModalPortal>
        )}

        {/* Modal xem phản hồi */}
        {viewResponse && (
          <ModalPortal>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="bg-white w-full max-w-2xl rounded-xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-white flex justify-between items-center">
                  <h3 className="text-base font-bold flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> PHẢN HỒI TỪ ADMIN</h3>
                  <button onClick={() => setViewResponse(null)} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 space-y-2 text-sm">
                    <h4 className="font-bold text-orange-800 flex items-center gap-2 mb-2"><Info className="w-4 h-4" /> Thông tin yêu cầu</h4>
                    <div className="flex justify-between"><span className="text-gray-600">Loại biểu mẫu:</span><span className="font-semibold">{viewResponse.ChuDe}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Ngày gửi:</span><span className="font-semibold">{new Date(viewResponse.NgayGui).toLocaleString('vi-VN')}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Trạng thái:</span><span className="font-semibold text-green-600">{viewResponse.TrangThai}</span></div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h4 className="text-sm font-bold text-gray-700 mb-2">Nội dung yêu cầu của bạn:</h4>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap bg-white p-3 rounded-lg border border-gray-200">{viewResponse.NoiDung}</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                    <h4 className="text-sm font-bold text-orange-800 mb-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Phản hồi từ Admin</h4>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap bg-white p-3 rounded-lg border border-orange-200">{viewResponse.PhanHoi}</p>
                    <p className="text-xs text-gray-500 mt-2">Ngày phản hồi: {viewResponse.NgayPhanHoi ? new Date(viewResponse.NgayPhanHoi).toLocaleString('vi-VN') : 'N/A'}</p>
                  </div>
                  <div className="flex justify-center pt-2">
                    <button onClick={() => setViewResponse(null)} className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg text-sm shadow-md shadow-orange-200">ĐÓNG</button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </ModalPortal>
        )}
      </AnimatePresence>

      <ConfirmDialog
        show={confirmDialog.show}
        message={confirmDialog.message}
        onConfirm={() => { if (confirmDialog.onConfirm) confirmDialog.onConfirm(); setConfirmDialog({ show: false, message: '', onConfirm: null, title: '' }); }}
        onCancel={() => setConfirmDialog({ show: false, message: '', onConfirm: null, title: '' })}
        title={confirmDialog.title || 'Xác nhận'}
      />
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: '', type: 'success' })} />
    </div>
  );
}

export default TeacherSupport;
