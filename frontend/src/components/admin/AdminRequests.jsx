import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Filter, CheckCircle2, Clock, AlertCircle, X, Send, User, Reply, Search
} from 'lucide-react';
import axios from 'axios';

const statusConfig = {
  'Hoàn thành':   { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', Icon: CheckCircle2 },
  'Đã phản hồi':  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', Icon: CheckCircle2 },
  'Chờ xử lý':    { bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-200',     Icon: AlertCircle },
  'Đang xử lý':   { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-200',   Icon: Clock },
  'Từ chối':      { bg: 'bg-gray-100',   text: 'text-gray-600',    border: 'border-gray-200',    Icon: X },
};

function StatusBadge({ status }) {
  const cfg = statusConfig[status] || { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', Icon: AlertCircle };
  const { bg, text, border, Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${bg} ${text} ${border}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}

function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedReq, setSelectedReq] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [updateStatus, setUpdateStatus] = useState('');
  const [replyErrors, setReplyErrors] = useState({});

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/support-requests');
      setRequests(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleOpenModal = (req) => {
    setSelectedReq(req);
    setReplyText(req.PhanHoi || '');
    setUpdateStatus(req.TrangThai === 'Chờ xử lý' ? 'Đang xử lý' : req.TrangThai);
    setReplyErrors({});
  };

  const validateReply = () => {
    const errors = {};
    if (!updateStatus) {
      errors.updateStatus = 'Vui lòng chọn trạng thái';
    }
    const requiresReply = ['Đã phản hồi', 'Hoàn thành', 'Từ chối'].includes(updateStatus);
    if (requiresReply && !replyText.trim()) {
      errors.replyText = 'Vui lòng nhập nội dung phản hồi';
    } else if (replyText.trim() && replyText.trim().length < 10) {
      errors.replyText = 'Nội dung phản hồi phải có ít nhất 10 ký tự';
    } else if (replyText.trim().length > 1000) {
      errors.replyText = 'Nội dung phản hồi tối đa 1000 ký tự';
    }
    setReplyErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validateReply()) return;
    try {
      await axios.put(`/api/admin/support-requests/${selectedReq.MaYeuCau}`, {
        TrangThai: updateStatus,
        PhanHoi: replyText,
        NguoiTraLoi: 'Admin QLSV'
      });
      setSelectedReq(null);
      setReplyErrors({});
      fetchRequests();
    } catch (e) {
      setReplyErrors({ general: 'Có lỗi xảy ra khi xử lý yêu cầu!' });
    }
  };

  const filtered = requests.filter(req => {
    if (filterRole !== 'All' && req.VaiTro !== filterRole) return false;
    if (filterStatus !== 'All' && req.TrangThai !== filterStatus) return false;
    if (search && !req.TenNguoiGui?.toLowerCase().includes(search.toLowerCase()) &&
        !req.TieuDe?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const rowVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.2 } }),
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 shadow-lg shadow-blue-200/50 flex items-center gap-4"
      >
        <div className="p-3 bg-white/20 rounded-xl">
          <MessageSquare className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Quản lý Yêu cầu & Phản hồi</h2>
          <p className="text-blue-100 text-sm mt-0.5">Tiếp nhận và xử lý kiến nghị từ Sinh viên / Giảng viên</p>
        </div>
        <div className="ml-auto flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2">
          <span className="text-white font-bold text-lg">{requests.filter(r => r.TrangThai === 'Chờ xử lý').length}</span>
          <span className="text-blue-100 text-sm">chờ xử lý</span>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-3 items-center"
      >
        <div className="flex items-center gap-2 text-gray-500 font-semibold text-sm">
          <Filter className="w-4 h-4" /> Bộ lọc:
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm..."
            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 transition-colors w-48"
          />
        </div>
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
        >
          <option value="All">Tất cả đối tượng</option>
          <option value="SinhVien">Sinh viên</option>
          <option value="GiangVien">Giảng viên</option>
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
        >
          <option value="All">Tất cả trạng thái</option>
          <option value="Chờ xử lý">Chờ xử lý</option>
          <option value="Đang xử lý">Đang xử lý</option>
          <option value="Đã phản hồi">Đã phản hồi</option>
          <option value="Hoàn thành">Hoàn thành</option>
          <option value="Từ chối">Từ chối</option>
        </select>
        <span className="ml-auto text-sm text-gray-400">{filtered.length} kết quả</span>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
              <span className="text-sm text-gray-400">Đang tải dữ liệu...</span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wide w-14 text-center">ID</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wide">Người gửi</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wide">Loại / Chủ đề</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wide">Ngày gửi</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wide">Trạng thái</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wide text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((req, i) => (
                  <motion.tr
                    key={req.MaYeuCau}
                    custom={i}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors duration-150"
                  >
                    <td className="p-4 text-center">
                      <span className="text-xs font-mono font-bold text-gray-400">#{req.MaYeuCau}</span>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-gray-800 text-sm">{req.TenNguoiGui || 'N/A'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {req.VaiTro === 'SinhVien' ? 'Sinh viên' : 'Giảng viên'} · {req.NguoiGui}
                      </p>
                    </td>
                    <td className="p-4">
                      <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-semibold mb-1">{req.LoaiYeuCau}</span>
                      <p className="font-semibold text-gray-800 text-sm line-clamp-1 max-w-xs">{req.TieuDe}</p>
                    </td>
                    <td className="p-4 text-sm text-gray-500">{new Date(req.NgayGui).toLocaleDateString('vi-VN')}</td>
                    <td className="p-4"><StatusBadge status={req.TrangThai} /></td>
                    <td className="p-4 text-center">
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleOpenModal(req)}
                        className="px-4 py-1.5 bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg font-semibold text-xs transition-all duration-200 shadow-sm"
                      >
                        Xử lý
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-400">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                      <p className="font-medium">Không có yêu cầu nào</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {selectedReq && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 flex justify-between items-center text-white shrink-0">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Reply className="w-5 h-5" /> Xử lý yêu cầu #{selectedReq.MaYeuCau}
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { setSelectedReq(null); setReplyErrors({}); }}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              <div className="p-5 overflow-y-auto flex-1 space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0 border border-gray-100">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{selectedReq.TenNguoiGui}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Mã: {selectedReq.NguoiGui} · {selectedReq.VaiTro === 'SinhVien' ? 'Sinh viên' : 'Giảng viên'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(selectedReq.NgayGui).toLocaleString('vi-VN')}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 text-sm mb-2">Nội dung yêu cầu:</h4>
                  <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100">
                    <p className="font-semibold text-blue-900 text-sm mb-1">{selectedReq.TieuDe}</p>
                    <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{selectedReq.NoiDung}</p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <h4 className="font-semibold text-gray-700 text-sm">Phản hồi:</h4>
                  <div>
                    <select
                      value={updateStatus}
                      onChange={e => {
                        setUpdateStatus(e.target.value);
                        if (replyErrors.updateStatus) setReplyErrors(prev => ({ ...prev, updateStatus: '' }));
                      }}
                      className={`w-full p-2.5 bg-white border rounded-xl outline-none text-sm font-medium text-gray-700 transition-colors ${replyErrors.updateStatus ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-blue-400'}`}
                    >
                      <option value="Đang xử lý">Đang xử lý</option>
                      <option value="Đã phản hồi">Đã phản hồi</option>
                      <option value="Hoàn thành">Hoàn thành</option>
                      <option value="Từ chối">Từ chối</option>
                    </select>
                    {replyErrors.updateStatus && (
                      <p className="text-red-500 text-xs mt-1">{replyErrors.updateStatus}</p>
                    )}
                  </div>
                  <div>
                    <textarea
                      rows={4}
                      value={replyText}
                      onChange={e => {
                        setReplyText(e.target.value);
                        if (replyErrors.replyText) setReplyErrors(prev => ({ ...prev, replyText: '' }));
                      }}
                      placeholder={
                        ['Đã phản hồi', 'Hoàn thành', 'Từ chối'].includes(updateStatus)
                          ? 'Nội dung phản hồi (bắt buộc)...'
                          : 'Nhập nội dung phản hồi...'
                      }
                      className={`w-full p-3 bg-white border rounded-xl outline-none resize-none text-sm transition-colors ${replyErrors.replyText ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-blue-400'}`}
                    />
                    <div className="flex items-center justify-between mt-1">
                      {replyErrors.replyText
                        ? <p className="text-red-500 text-xs">{replyErrors.replyText}</p>
                        : <span />}
                      <p className="text-xs text-gray-400">{replyText.length}/1000</p>
                    </div>
                  </div>
                  {replyErrors.general && (
                    <p className="text-red-500 text-xs font-medium text-center bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                      {replyErrors.general}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-4 border-t border-gray-100 shrink-0 flex justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => { setSelectedReq(null); setReplyErrors({}); }}
                  className="px-5 py-2 font-semibold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 text-sm transition-colors"
                >
                  Hủy
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleUpdate}
                  className="px-6 py-2 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 flex items-center gap-2 text-sm transition-colors"
                >
                  <Send className="w-4 h-4" /> Gửi phản hồi
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminRequests;
