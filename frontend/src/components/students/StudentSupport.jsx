import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, MessageSquare, FileText, Send, 
  Clock, CheckCircle2, ShieldAlert, GraduationCap,
  AlertCircle, ChevronDown, Loader2
} from 'lucide-react';
import axios from 'axios';
import ModalPortal, { SuccessDialog, ErrorDialog, Toast, ConfirmDialog } from '../ModalPortal';

// Tự động lấy cấu hình môi trường hoặc mặc định localhost
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000' 
    : 'https://qlsv-huq1.onrender.com';
const API_BASE = `${API_URL}/api`;
function StudentSupport({ user }) {
  const [activeTab, setActiveTab] = useState('requests'); 
  const [supportList, setSupportList] = useState([]);
  const [loading, setLoading] = useState(true);

  // State cho Form gửi câu hỏi
  const [formData, setFormData] = useState({ chuDe: '', noiDung: '' });
  const [submitting, setSubmitting] = useState(false);

  // States quản lý Popup thay cho alert()
  const [confirmDialog, setConfirmDialog] = useState({ show: false, message: '', onConfirm: null });
  const [successDialog, setSuccessDialog] = useState({ show: false, message: '' });
  const [errorDialog, setErrorDialog] = useState({ show: false, message: '' });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // 1. TẢI DỮ LIỆU TỪ DATABASE
  const fetchSupportData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/support/student/${user?.username}`);
      setSupportList(res.data);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu hỗ trợ:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.username) fetchSupportData();
  }, [user]);

  // 2. HÀM XỬ LÝ: BẤM NÚT XIN GIẤY TỜ NHANH (CÓ RÀNG BUỘC SỐ LẦN)
  const handleQuickRequest = (chude) => {
    // ---- BƯỚC 1: KIỂM TRA RÀNG BUỘC SỐ LẦN YÊU CẦU TRONG NĂM ----
    const currentYear = new Date().getFullYear();
    
    // Đếm xem sinh viên này đã xin loại giấy này bao nhiêu lần trong năm nay
    const requestCount = supportList.filter(req => 
      req.LoaiYeuCau === 'Hành chính' && 
      req.ChuDe === chude && 
      new Date(req.NgayGui).getFullYear() === currentYear
    ).length;

    // Cấu hình giới hạn số lần cho từng loại giấy tờ (Bạn có thể tùy chỉnh ở đây)
    const limits = {
      'Giấy xác nhận hoãn Nghĩa vụ quân sự': 2, // Max 2 lần/năm
      'Giấy xác nhận sinh viên Khoa trực thuộc': 3, // Max 3 lần/năm
      'Đơn xin tạm nghỉ học / Bảo lưu kết quả': 1 // Max 1 lần/năm
    };

    const maxLimit = limits[chude] || 5; // Giới hạn mặc định nếu không có trong list

    // Nếu vượt quá giới hạn -> Chặn lại và báo lỗi
    if (requestCount >= maxLimit) {
      setErrorDialog({ 
        show: true, 
        message: `Bạn đã yêu cầu cấp "${chude}" ${requestCount} lần trong năm nay. (Giới hạn quy định: ${maxLimit} lần/năm). Nếu cần hỗ trợ khẩn cấp, vui lòng liên hệ trực tiếp Phòng Công tác Sinh viên!` 
      });
      return;
    }

    // ---- BƯỚC 2: NẾU HỢP LỆ THÌ MỚI HIỆN POPUP XÁC NHẬN ----
    setConfirmDialog({
      show: true,
      message: `Bạn có chắc chắn muốn gửi yêu cầu: "${chude}" không?`,
      onConfirm: async () => {
        try {
          await axios.post(`${API_URL}/api/support`, {
            MSSV: user.username,
            LoaiYeuCau: 'Hành chính',
            ChuDe: chude,
            NoiDung: `Sinh viên yêu cầu cấp: ${chude}`
          });
          setToast({ show: true, message: 'Đã gửi yêu cầu thành công! Vui lòng theo dõi trạng thái.', type: 'success' });
          fetchSupportData(); // Tải lại danh sách
        } catch (error) {
          setErrorDialog({ show: true, message: 'Lỗi khi gửi yêu cầu! Vui lòng thử lại.' });
        }
      }
    });
  };

  // 3. HÀM XỬ LÝ: ĐIỀN FORM HỎI ĐÁP
  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    if (!formData.chuDe || !formData.noiDung) {
      return setErrorDialog({ show: true, message: 'Vui lòng chọn Chủ đề và nhập Nội dung chi tiết!' });
    }
    try {
      setSubmitting(true);
      await axios.post(`${API_URL}/api/support`, {
        MSSV: user.username,
        LoaiYeuCau: 'Hỏi đáp',
        ChuDe: formData.chuDe,
        NoiDung: formData.noiDung
      });
      setSuccessDialog({ show: true, message: 'Đã gửi câu hỏi thành công!' });
      setFormData({ chuDe: '', noiDung: '' }); // Xóa trắng form
      fetchSupportData(); // Tải lại danh sách
    } catch (error) {
      setErrorDialog({ show: true, message: 'Lỗi khi gửi câu hỏi! Vui lòng thử lại.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Lọc dữ liệu ra 2 tab riêng biệt
  const requests = supportList.filter(item => item.LoaiYeuCau === 'Hành chính');
  const questions = supportList.filter(item => item.LoaiYeuCau === 'Hỏi đáp');

  // Format hiển thị ngày giờ
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const renderStatus = (status) => {
    switch (status) {
      case 'Đã hoàn thành':
      case 'Đã trả lời':
      case 'Đã duyệt':
        return <span className="flex items-center justify-center gap-1 text-green-600 bg-green-50 px-3 py-1.5 rounded-full text-xs font-bold w-fit"><CheckCircle2 className="w-3.5 h-3.5" /> {status}</span>;
      case 'Đang xử lý':
        return <span className="flex items-center justify-center gap-1 text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full text-xs font-bold w-fit"><Clock className="w-3.5 h-3.5" /> {status}</span>;
      default:
        return <span className="flex items-center justify-center gap-1 text-red-600 bg-red-50 px-3 py-1.5 rounded-full text-xs font-bold w-fit"><AlertCircle className="w-3.5 h-3.5" /> {status}</span>;
    }
  };

  if (loading) return <div className="flex justify-center p-16 text-orange-500"><Loader2 className="w-12 h-12 animate-spin" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <HelpCircle className="w-8 h-8" /> Trung tâm Hỗ trợ Sinh viên
          </h2>
          <p className="text-orange-100 text-lg">Thực hiện thủ tục hành chính trực tuyến và gửi câu hỏi đến các Phòng/Ban.</p>
        </div>
        <MessageSquare className="absolute -right-6 -bottom-6 w-48 h-48 text-white opacity-10 transform -rotate-12" />
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-gray-100">
        <button onClick={() => setActiveTab('requests')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${activeTab === 'requests' ? 'bg-orange-100 text-orange-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
          <FileText className="w-5 h-5" /> Dịch vụ Hành chính
        </button>
        <button onClick={() => setActiveTab('questions')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${activeTab === 'questions' ? 'bg-blue-100 text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
          <MessageSquare className="w-5 h-5" /> Hỏi đáp - Hỗ trợ
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[500px]">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: DỊCH VỤ HÀNH CHÍNH */}
          {activeTab === 'requests' && (
            <motion.div key="requests" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
              
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Tạo yêu cầu mới</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button onClick={() => handleQuickRequest('Giấy xác nhận hoãn Nghĩa vụ quân sự')} className="flex flex-col items-center p-6 bg-gray-50 rounded-xl hover:bg-orange-50 border border-transparent transition-all group shadow-sm hover:shadow-md">
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm text-orange-500 group-hover:scale-110 transition-transform mb-3">
                      <ShieldAlert className="w-7 h-7" />
                    </div>
                    <span className="font-semibold text-gray-700 text-center group-hover:text-orange-600">Xin giấy tạm hoãn NVQS</span>
                  </button>
                  <button onClick={() => handleQuickRequest('Giấy xác nhận sinh viên Khoa trực thuộc')} className="flex flex-col items-center p-6 bg-gray-50 rounded-xl hover:bg-blue-50 border border-transparent transition-all group shadow-sm hover:shadow-md">
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-500 group-hover:scale-110 transition-transform mb-3">
                      <GraduationCap className="w-7 h-7" />
                    </div>
                    <span className="font-semibold text-gray-700 text-center group-hover:text-blue-600">Xin giấy xác nhận SV</span>
                  </button>
                  <button onClick={() => handleQuickRequest('Đơn xin tạm nghỉ học / Bảo lưu kết quả')} className="flex flex-col items-center p-6 bg-gray-50 rounded-xl hover:bg-red-50 border border-transparent transition-all group shadow-sm hover:shadow-md">
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm text-red-500 group-hover:scale-110 transition-transform mb-3">
                      <AlertCircle className="w-7 h-7" />
                    </div>
                    <span className="font-semibold text-gray-700 text-center group-hover:text-red-600">Xin tạm nghỉ / Bảo lưu</span>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Lịch sử yêu cầu ({requests.length})</h3>
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 text-sm">
                        <th className="p-4 font-semibold border-b border-gray-100">Mã YC</th>
                        <th className="p-4 font-semibold border-b border-gray-100">Loại giấy tờ / Yêu cầu</th>
                        <th className="p-4 font-semibold border-b border-gray-100">Ngày gửi</th>
                        <th className="p-4 font-semibold border-b border-gray-100 text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((req) => (
                        <tr key={req.MaYeuCau} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="p-4 font-medium text-gray-500 text-sm">#{req.MaYeuCau}</td>
                          <td className="p-4 font-bold text-gray-800">{req.ChuDe}</td>
                          <td className="p-4 text-gray-500 text-sm">{formatDate(req.NgayGui)}</td>
                          <td className="p-4 text-center">{renderStatus(req.TrangThai)}</td>
                        </tr>
                      ))}
                      {requests.length === 0 && (
                        <tr>
                          <td colSpan="4" className="text-center p-12 text-gray-400 italic">
                            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-200" />
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

          {/* TAB 2: HỎI ĐÁP & HỖ TRỢ */}
          {activeTab === 'questions' && (
            <motion.div key="questions" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              
              <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
                  <Send className="w-5 h-5" /> Gửi câu hỏi cho Nhà trường
                </h3>
                <form onSubmit={handleSubmitQuestion} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Chủ đề cần hỗ trợ <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <select required value={formData.chuDe} onChange={(e) => setFormData({...formData, chuDe: e.target.value})} className="w-full p-3 bg-white border border-gray-200 rounded-xl appearance-none focus:outline-none focus:border-blue-500 font-medium text-gray-700">
                          <option value="">--- Chọn chủ đề ---</option>
                          <option value="Lỗi hệ thống Website / App">Lỗi hệ thống Website / App</option>
                          <option value="Thắc mắc Điểm thi / Điểm danh">Thắc mắc Điểm thi / Điểm danh</option>
                          <option value="Học phí & Học bổng">Học phí & Học bổng</option>
                          <option value="Khác">Khác</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Phòng ban tiếp nhận</label>
                      <input type="text" disabled value="Hệ thống tự động phân luồng" className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 font-medium cursor-not-allowed" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nội dung chi tiết <span className="text-red-500">*</span></label>
                    <textarea required value={formData.noiDung} onChange={(e) => setFormData({...formData, noiDung: e.target.value})} rows="4" placeholder="Vui lòng trình bày rõ vấn đề bạn đang gặp phải..." className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none text-gray-700"></textarea>
                  </div>
                  <div className="text-right">
                    <button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-colors flex items-center gap-2 ml-auto shadow-md shadow-blue-200 disabled:bg-blue-300 disabled:cursor-not-allowed">
                      {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Đang gửi...</> : <><Send className="w-5 h-5" /> Gửi Yêu Cầu</>}
                    </button>
                  </div>
                </form>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Câu hỏi đã gửi ({questions.length})</h3>
                <div className="space-y-4">
                  {questions.map((q) => (
                    <div key={q.MaYeuCau} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-white">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div>
                          <h4 className="font-bold text-gray-800 text-lg">{q.ChuDe}</h4>
                          <span className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-1"><Clock className="w-3.5 h-3.5" /> Gửi lúc: {formatDate(q.NgayGui)}</span>
                        </div>
                        {renderStatus(q.TrangThai)}
                      </div>
                      <p className="text-gray-700 bg-gray-50 p-4 rounded-xl text-sm border border-gray-100 whitespace-pre-wrap">{q.NoiDung}</p>
                      
                      {q.PhanHoi && (
                        <div className="mt-4 pl-4 border-l-4 border-green-500">
                          <p className="text-xs font-bold text-green-700 mb-1.5 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Nhà trường phản hồi:</p>
                          <p className="text-sm text-gray-800 bg-green-50 p-4 rounded-xl border border-green-100 whitespace-pre-wrap">{q.PhanHoi}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  {questions.length === 0 && (
                    <div className="text-center p-12 text-gray-400 italic bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      Bạn chưa gửi câu hỏi nào.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CÁC COMPONENT POPUP */}
      <ConfirmDialog
        show={confirmDialog.show}
        message={confirmDialog.message}
        onConfirm={() => {
          if (confirmDialog.onConfirm) confirmDialog.onConfirm();
          setConfirmDialog({ show: false, message: '', onConfirm: null });
        }}
        onCancel={() => setConfirmDialog({ show: false, message: '', onConfirm: null })}
        title="Xác nhận gửi yêu cầu"
      />
      <SuccessDialog
        show={successDialog.show}
        message={successDialog.message}
        onClose={() => setSuccessDialog({ show: false, message: '' })}
      />
      <ErrorDialog
        show={errorDialog.show}
        message={errorDialog.message}
        onClose={() => setErrorDialog({ show: false, message: '' })}
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

export default StudentSupport;