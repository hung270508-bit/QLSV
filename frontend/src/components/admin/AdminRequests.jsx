import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Filter, Search, CheckCircle2, 
  Clock, AlertCircle, X, Send, User, Reply
} from 'lucide-react';
import axios from 'axios';

function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('All'); // All, SinhVien, GiangVien
  const [filterStatus, setFilterStatus] = useState('All');
  
  // Modal State
  const [selectedReq, setSelectedReq] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [updateStatus, setUpdateStatus] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/admin/support-requests');
      setRequests(res.data);
    } catch (error) {
      console.error('Lỗi tải danh sách yêu cầu:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleOpenModal = (req) => {
    setSelectedReq(req);
    setReplyText(req.PhanHoi || '');
    setUpdateStatus(req.TrangThai === 'Chờ xử lý' ? 'Đang xử lý' : req.TrangThai);
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`http://localhost:5000/api/admin/support-requests/${selectedReq.MaYeuCau}`, {
        TrangThai: updateStatus,
        PhanHoi: replyText,
        NguoiTraLoi: 'Admin QLSV' // Có thể lấy từ context user đăng nhập
      });
      alert('Đã xử lý phản hồi thành công!');
      setSelectedReq(null);
      fetchRequests();
    } catch (error) {
      alert('Có lỗi xảy ra khi xử lý!');
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filterRole !== 'All' && req.VaiTro !== filterRole) return false;
    if (filterStatus !== 'All' && req.TrangThai !== filterStatus) return false;
    return true;
  });

  const renderStatus = (status) => {
    switch (status) {
      case 'Hoàn thành':
      case 'Đã phản hồi':
        return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle2 className="w-3.5 h-3.5"/> {status}</span>;
      case 'Chờ xử lý':
        return <span className="bg-red-100 text-red-600 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 w-fit"><AlertCircle className="w-3.5 h-3.5"/> {status}</span>;
      case 'Đang xử lý':
        return <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 w-fit"><Clock className="w-3.5 h-3.5"/> {status}</span>;
      case 'Từ chối':
        return <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 w-fit"><X className="w-3.5 h-3.5"/> Từ chối</span>;
      default:
        return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-4 bg-blue-50 rounded-2xl">
            <MessageSquare className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Quản lý Yêu cầu & Phản hồi</h2>
            <p className="text-gray-500 font-medium">Tiếp nhận và xử lý kiến nghị từ Sinh viên / Giảng viên</p>
          </div>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-gray-600 font-bold bg-gray-50 px-4 py-2 rounded-xl">
          <Filter className="w-4 h-4" /> Bộ lọc:
        </div>
        
        <select 
          value={filterRole} 
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
        >
          <option value="All">Tất cả đối tượng</option>
          <option value="SinhVien">Sinh viên</option>
          <option value="GiangVien">Giảng viên</option>
        </select>

        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
        >
          <option value="All">Tất cả trạng thái</option>
          <option value="Chờ xử lý">Chờ xử lý</option>
          <option value="Đang xử lý">Đang xử lý</option>
          <option value="Đã phản hồi">Đã phản hồi</option>
          <option value="Hoàn thành">Hoàn thành</option>
          <option value="Từ chối">Từ chối</option>
        </select>
      </div>

      {/* Danh sách yêu cầu */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                <th className="p-4 font-semibold w-16 text-center">ID</th>
                <th className="p-4 font-semibold">Người gửi</th>
                <th className="p-4 font-semibold">Loại / Chủ đề</th>
                <th className="p-4 font-semibold">Ngày gửi</th>
                <th className="p-4 font-semibold">Trạng thái</th>
                <th className="p-4 font-semibold text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req) => (
                <tr key={req.MaYeuCau} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                  <td className="p-4 text-center font-bold text-gray-500">#{req.MaYeuCau}</td>
                  <td className="p-4">
                    <p className="font-bold text-gray-800">{req.TenNguoiGui || 'N/A'}</p>
                    <p className="text-xs text-gray-500 font-medium">
                      {req.VaiTro === 'SinhVien' ? 'Sinh viên' : 'Giảng viên'} - {req.NguoiGui}
                    </p>
                  </td>
                  <td className="p-4">
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-bold mb-1">{req.LoaiYeuCau}</span>
                    <p className="font-bold text-gray-800 text-sm line-clamp-1 max-w-xs">{req.TieuDe}</p>
                  </td>
                  <td className="p-4 text-sm text-gray-500 font-medium">
                    {new Date(req.NgayGui).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="p-4">{renderStatus(req.TrangThai)}</td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => handleOpenModal(req)}
                      className="px-4 py-2 bg-white border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg font-bold text-sm transition-colors shadow-sm"
                    >
                      Xử lý
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRequests.length === 0 && (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500 italic">Không có yêu cầu nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Xử lý yêu cầu */}
      <AnimatePresence>
        {selectedReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-blue-600 p-6 flex justify-between items-center text-white shrink-0">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Reply className="w-5 h-5" /> Xử lý yêu cầu #{selectedReq.MaYeuCau}
                </h3>
                <button onClick={() => setSelectedReq(null)} className="p-1.5 hover:bg-white/20 rounded-full transition-colors"><X className="w-6 h-6" /></button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                
                {/* Info Nguoi Gui */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex gap-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                    <User className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg">{selectedReq.TenNguoiGui}</h4>
                    <p className="text-sm text-gray-500 font-medium">Mã: {selectedReq.NguoiGui} • Vai trò: {selectedReq.VaiTro === 'SinhVien' ? 'Sinh viên' : 'Giảng viên'}</p>
                    <p className="text-xs text-gray-400 mt-1">Gửi lúc: {new Date(selectedReq.NgayGui).toLocaleString('vi-VN')}</p>
                  </div>
                </div>

                {/* Nội dung yêu cầu */}
                <div>
                  <h4 className="font-bold text-gray-800 mb-2">Nội dung yêu cầu:</h4>
                  <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                    <p className="font-bold text-blue-900 mb-2">{selectedReq.TieuDe}</p>
                    <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{selectedReq.NoiDung}</p>
                  </div>
                </div>

                {/* Form Xử lý */}
                <div className="border-t border-gray-100 pt-6">
                  <h4 className="font-bold text-gray-800 mb-4">Phản hồi của Nhà trường:</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Cập nhật trạng thái</label>
                      <select 
                        value={updateStatus}
                        onChange={(e) => setUpdateStatus(e.target.value)}
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium text-gray-700"
                      >
                        <option value="Đang xử lý">Đang xử lý</option>
                        <option value="Đã phản hồi">Đã phản hồi (Chờ người dùng xác nhận)</option>
                        <option value="Hoàn thành">Hoàn thành (Đóng Ticket)</option>
                        <option value="Từ chối">Từ chối yêu cầu</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Nội dung trả lời</label>
                      <textarea 
                        rows="4"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Nhập nội dung phản hồi cho Sinh viên/Giảng viên..."
                        className="w-full p-4 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 resize-none"
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 border-t border-gray-200 shrink-0 flex justify-end gap-3">
                <button onClick={() => setSelectedReq(null)} className="px-6 py-2.5 font-bold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">Hủy</button>
                <button onClick={handleUpdate} className="px-8 py-2.5 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 flex items-center gap-2">
                  <Send className="w-4 h-4" /> Gửi phản hồi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminRequests;