import React, { useState, useEffect } from 'react';
import API_URL from '../../api';
import { RequestsSkeleton } from '../common/AdminSkeleton';
import Pagination from '../common/Pagination';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Filter, CheckCircle2, Clock, AlertCircle, X, Send, User, Reply, Search, Trash2, Check
} from 'lucide-react';
import axios from 'axios';
import ModalPortal, { ConfirmDialog, Toast } from '../common/ModalPortal';
import ConfirmDeleteModal from '../common/ConfirmDeleteModal';

const statusConfig = {
  'Hoàn thành': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', Icon: CheckCircle2 },
  'Đã phản hồi': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', Icon: CheckCircle2 },
  'Đang xử lý': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', Icon: Clock },
  'Từ chối': { bg: 'bg-gray-100', text: 'text-[#6B7280]', border: 'border-[#E5E7EB]', Icon: X },
};

function StatusBadge({ status }) {
  const cfg = statusConfig[status] || { bg: 'bg-[#3B82F6]/10', text: 'text-blue-700', border: 'border-blue-200', Icon: AlertCircle };
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
  const [deleteDialog, setDeleteDialog] = useState({ show: false, requestId: null });
  const [selectedRequests, setSelectedRequests] = useState(new Set());
  const [confirmDialog, setConfirmDialog] = useState({ show: false, message: '', onConfirm: null });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isViewOnly, setIsViewOnly] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/admin/support-requests`);
      setRequests(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && selectedReq) {
        setSelectedReq(null);
        setReplyErrors({});
        setIsViewOnly(false);
      }
    };
    if (selectedReq) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [selectedReq]);

  const handleOpenModal = (req, viewOnly = false) => {
    setSelectedReq(req);
    setReplyText(req.PhanHoi || '');
    setUpdateStatus(req.TrangThai);
    setReplyErrors({});
    setIsViewOnly(viewOnly);
  };

  const validateReply = () => {
    const errors = {};
    if (!updateStatus) {
      errors.updateStatus = 'Vui lòng chọn trạng thái';
    }
    if (updateStatus === 'Đang xử lý') {
      errors.updateStatus = 'Vui lòng phản hồi';
    } else if (['Đã phản hồi', 'Từ chối'].includes(updateStatus) && !replyText.trim()) {
      errors.replyText = 'Vui lòng nhập nội dung phản hồi';
    } else if (replyText.trim().length > 0 && replyText.trim().length < 10) {
      errors.replyText = 'Nội dung phản hồi tối thiểu 10 ký tự';
    } else if (replyText.trim().length > 1000) {
      errors.replyText = 'Nội dung phản hồi tối đa 1000 ký tự';
    }
    setReplyErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validateReply()) return;
    if (!navigator.onLine) {
      setToast({ show: true, message: 'Mất kết nối Internet. Vui lòng kiểm tra lại mạng.', type: 'error' });
      return;
    }
    try {
      await axios.put(`${API_URL}/api/admin/support-requests/${selectedReq.MaYeuCau}`, {
        TrangThai: updateStatus,
        PhanHoi: replyText,
        NguoiTraLoi: 'Admin QLSV'
      }, { timeout: 10000 });
      setToast({ show: true, message: 'Gửi phản hồi thành công!', type: 'success' });
      setSelectedReq(null);
      setReplyErrors({});
      fetchRequests();
    } catch (e) {
      if (e.code === 'ERR_NETWORK' || e.code === 'ECONNABORTED' || !e.response) {
        setToast({ show: true, message: 'Mất kết nối Internet. Vui lòng kiểm tra lại mạng.', type: 'error' });
      } else {
        setToast({ show: true, message: 'Có lỗi xảy ra khi xử lý yêu cầu!', type: 'error' });
      }
    }
  };

  const handleDelete = (requestId) => {
    setDeleteDialog({ show: true, requestId });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.requestId) return;
    const requestIdToDelete = deleteDialog.requestId;
    const isBulkDelete = requestIdToDelete === 'bulk';
    setDeleteDialog({ show: false, requestId: null });
    setConfirmDialog({
      show: true,
      message: isBulkDelete
        ? `Bạn có chắc chắn muốn xóa ${selectedRequests.size} yêu cầu đã chọn không?`
        : 'Bạn có chắc chắn muốn xóa yêu cầu này không?',
      onConfirm: async () => {
        if (!navigator.onLine) {
          setToast({ show: true, message: 'Mất kết nối Internet. Vui lòng kiểm tra lại mạng.', type: 'error' });
          setConfirmDialog({ show: false, message: '', onConfirm: null });
          return;
        }
        try {
          if (isBulkDelete) {
            console.log('Bulk deleting requests:', Array.from(selectedRequests));
            await Promise.all(
              Array.from(selectedRequests).map(id =>
                axios.delete(`${API_URL}/api/admin/support-requests/${id}`, { timeout: 10000 })
              )
            );
            console.log('Bulk delete successful');
            setToast({ show: true, message: `Đã xóa ${selectedRequests.size} yêu cầu thành công!`, type: 'success' });
            setSelectedRequests(new Set());
          } else {
            console.log('Deleting request:', requestIdToDelete);
            await axios.delete(`${API_URL}/api/admin/support-requests/${requestIdToDelete}`, { timeout: 10000 });
            console.log('Delete successful');
            setToast({ show: true, message: 'Xóa yêu cầu thành công!', type: 'success' });
          }
          fetchRequests();
          setConfirmDialog({ show: false, message: '', onConfirm: null });
        } catch (error) {
          console.error('Error deleting request:', error);
          if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || !error.response) {
            setToast({ show: true, message: 'Mất kết nối Internet. Vui lòng kiểm tra lại mạng.', type: 'error' });
          } else {
            setToast({ show: true, message: 'Lỗi khi xóa yêu cầu!', type: 'error' });
          }
          setConfirmDialog({ show: false, message: '', onConfirm: null });
        }
      }
    });
  };

  const filtered = requests.filter(req => {
    if (search && search.length > 0 && search.trim() === '') return false;
    if (filterRole !== 'All' && req.VaiTro !== filterRole) return false;
    if (filterStatus !== 'All' && req.TrangThai !== filterStatus) return false;
    if (search && !req.TenNguoiGui?.toLowerCase().includes(search.toLowerCase()) &&
      !req.TieuDe?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterRole, filterStatus]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({ opacity: 1, x: 0, transition: { delay: i * 0.04, duration: 0.2 } }),
  };

  if (loading) return <RequestsSkeleton />;

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-[#F4C542] rounded-2xl p-6 shadow-lg shadow-blue-200/50 flex items-center gap-4"
      >
        <div className="p-3 bg-white/40 rounded-xl">
          <MessageSquare className="w-7 h-7 text-[#152238]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#152238]">Quản lý Yêu cầu & Phản hồi</h2>
          <p className="text-[#152238]/70 text-sm mt-0.5">Tiếp nhận và xử lý kiến nghị từ Sinh viên / Giảng viên</p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        className="bg-[#FFFFFF] p-4 rounded-2xl shadow-sm border border-[#E5E7EB] flex flex-wrap gap-3 items-center"
      >
        <div className="flex items-center gap-2 text-[#6B7280] font-semibold text-sm">
          <Filter className="w-4 h-4" /> Bộ lọc:
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm..."
            className="pl-9 pr-4 py-2 bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:border-blue-400 transition-colors w-48"
          />
        </div>
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          className="px-3 py-2 bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
        >
          <option value="All">Tất cả đối tượng</option>
          <option value="SinhVien">Sinh viên</option>
          <option value="GiangVien">Giảng viên</option>
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
        >
          <option value="All">Tất cả trạng thái</option>
          <option value="Đang xử lý">Đang xử lý</option>
          <option value="Đã phản hồi">Đã phản hồi</option>
          <option value="Từ chối">Từ chối</option>
        </select>
        {selectedRequests.size > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => setDeleteDialog({ show: true, requestId: 'bulk' })}
            className="px-4 py-2 bg-[#EF4444]/10 border border-red-200 text-[#EF4444] hover:bg-red-600 hover:text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Xóa {selectedRequests.size} mục
          </motion.button>
        )}
        <span className="ml-auto text-sm text-gray-300">{filtered.length} kết quả</span>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
        className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F7F8FA]/80 border-b border-[#E5E7EB]">
                <th className="p-4 text-xs font-bold text-[#6B7280] uppercase tracking-wide w-12 text-center">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedRequests.size === filtered.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRequests(new Set(filtered.map(req => req.MaYeuCau)));
                      } else {
                        setSelectedRequests(new Set());
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-[#3B82F6] focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="p-4 text-xs font-bold text-[#6B7280] uppercase tracking-wide w-14 text-center">ID</th>
                <th className="p-4 text-xs font-bold text-[#6B7280] uppercase tracking-wide">Người gửi</th>
                <th className="p-4 text-xs font-bold text-[#6B7280] uppercase tracking-wide">Loại / Chủ đề</th>
                <th className="p-4 text-xs font-bold text-[#6B7280] uppercase tracking-wide">Ngày gửi</th>
                <th className="p-4 text-xs font-bold text-[#6B7280] uppercase tracking-wide">Ngày phản hồi</th>
                <th className="p-4 text-xs font-bold text-[#6B7280] uppercase tracking-wide">Trạng thái</th>
                <th className="p-4 text-xs font-bold text-[#6B7280] uppercase tracking-wide text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((req, i) => (
                <motion.tr
                  key={req.MaYeuCau}
                  custom={i}
                  variants={rowVariants}
                  initial="hidden"
                  animate="visible"
                  className={`border-b border-gray-50 hover:bg-[#3B82F6]/10/30 transition-colors duration-150 cursor-pointer ${selectedRequests.has(req.MaYeuCau) ? 'bg-[#3B82F6]/10/50' : ''}`}
                  onClick={() => handleOpenModal(req, true)}
                >
                  <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRequests.has(req.MaYeuCau)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedRequests);
                        if (e.target.checked) {
                          newSelected.add(req.MaYeuCau);
                        } else {
                          newSelected.delete(req.MaYeuCau);
                        }
                        setSelectedRequests(newSelected);
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-[#3B82F6] focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-xs font-mono font-bold text-gray-300">#{req.MaYeuCau}</span>
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-[#1F2937] text-sm">{req.TenNguoiGui || 'N/A'}</p>
                    <p className="text-xs text-gray-300 mt-0.5">
                      {req.VaiTro === 'SinhVien' ? 'Sinh viên' : 'Giảng viên'} · {req.NguoiGui}
                    </p>
                  </td>
                  <td className="p-4">
                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-[#6B7280] rounded text-xs font-semibold mb-1">{req.LoaiYeuCau}</span>
                    <p className="font-semibold text-[#1F2937] text-sm line-clamp-1 max-w-xs">{req.TieuDe}</p>
                  </td>
                  <td className="p-4 text-sm text-[#6B7280]">{new Date(req.NgayGui).toLocaleDateString('vi-VN')}</td>
                  <td className="p-4 text-sm text-[#6B7280]">
                    {req.PhanHoi ? (req.NgayPhanHoi ? new Date(req.NgayPhanHoi).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')) : '-'}
                  </td>
                  <td className="p-4"><StatusBadge status={req.TrangThai} /></td>
                  <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2">
                      {req.TrangThai === 'Đang xử lý' ? (
                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => handleOpenModal(req, false)}
                          className="px-4 py-1.5 bg-[#3B82F6]/10 border border-blue-200 text-[#3B82F6] hover:bg-blue-600 hover:text-white rounded-lg font-semibold text-xs transition-all duration-200 shadow-sm"
                        >
                          Xử lý
                        </motion.button>
                      ) : null}
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleDelete(req.MaYeuCau)}
                        className="p-1.5 bg-[#EF4444]/10 border border-red-200 text-[#EF4444] hover:bg-red-600 hover:text-white rounded-lg font-semibold text-xs transition-all duration-200 shadow-sm"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-300">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                    <p className="font-medium">Không có yêu cầu nào</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 pb-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
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
              className="bg-[#FFFFFF] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-[#F4C542] p-5 flex justify-between items-center text-[#152238] shrink-0">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Reply className="w-5 h-5" /> Chi tiết yêu cầu #{selectedReq.MaYeuCau}
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { setSelectedReq(null); setReplyErrors({}); }}
                  className="p-1.5 hover:bg-white/40 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              <div className="p-5 overflow-y-auto flex-1 space-y-4">
                <div className="bg-[#F7F8FA] p-4 rounded-xl border border-[#E5E7EB] flex gap-3">
                  <div className="w-10 h-10 bg-[#FFFFFF] rounded-full flex items-center justify-center shadow-sm shrink-0 border border-[#E5E7EB]">
                    <User className="w-5 h-5 text-gray-300" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1F2937]">{selectedReq.TenNguoiGui}</h4>
                    <p className="text-xs text-[#6B7280] mt-0.5">Mã: {selectedReq.NguoiGui} · {selectedReq.VaiTro === 'SinhVien' ? 'Sinh viên' : 'Giảng viên'}</p>
                    <p className="text-xs text-gray-300 mt-0.5">{new Date(selectedReq.NgayGui).toLocaleString('vi-VN')}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 text-sm mb-2">Thông tin yêu cầu:</h4>
                  <div className="bg-[#FFF7D6]/60 p-4 rounded-xl border border-[#FFF7D6] space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-[#6B7280]">Loại yêu cầu:</span>
                      <span className="text-xs font-bold text-[#F4C542] bg-[#FFF7D6] px-2 py-1 rounded">{selectedReq.LoaiYeuCau}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-[#6B7280]">Chủ đề:</span>
                      <span className="text-xs font-semibold text-[#1F2937]">{selectedReq.ChuDe || selectedReq.TieuDe}</span>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-[#6B7280] block mb-1">Nội dung chi tiết:</span>
                      <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed bg-[#FFFFFF] p-3 rounded-lg border border-[#F4C542]/30">{selectedReq.NoiDung}</p>
                    </div>
                  </div>
                </div>

                {!isViewOnly && (
                  <div className="border-t border-[#E5E7EB] pt-4 space-y-3">
                    <h4 className="font-semibold text-gray-700 text-sm">Phản hồi:</h4>
                    <div>
                      <select
                        value={updateStatus}
                        onChange={e => {
                          setUpdateStatus(e.target.value);
                          if (replyErrors.updateStatus) setReplyErrors(prev => ({ ...prev, updateStatus: '' }));
                        }}
                        className={`w-full p-2.5 bg-[#FFFFFF] border rounded-xl outline-none text-sm font-medium text-gray-700 transition-colors ${replyErrors.updateStatus ? 'border-red-400 focus:border-red-400' : 'border-[#E5E7EB] focus:border-blue-400'}`}
                      >
                        <option value="Đang xử lý">Đang xử lý</option>
                        <option value="Đã phản hồi">Đã phản hồi</option>
                        <option value="Từ chối">Từ chối</option>
                      </select>
                      {replyErrors.updateStatus && (
                        <p className="text-[#EF4444] text-xs mt-1">{replyErrors.updateStatus}</p>
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
                          ['Đã phản hồi', 'Từ chối'].includes(updateStatus)
                            ? 'Nội dung phản hồi (bắt buộc)...'
                            : 'Nhập nội dung phản hồi...'
                        }
                        className={`w-full p-3 bg-[#FFFFFF] border rounded-xl outline-none resize-none text-sm transition-colors ${replyErrors.replyText ? 'border-red-400 focus:border-red-400' : 'border-[#E5E7EB] focus:border-blue-400'}`}
                      />
                      <div className="flex items-center justify-between mt-1">
                        {replyErrors.replyText
                          ? <p className="text-[#EF4444] text-xs">{replyErrors.replyText}</p>
                          : <span />}
                        <p className="text-xs text-gray-300">{replyText.length}/1000</p>
                      </div>
                    </div>
                    {replyErrors.general && (
                      <p className="text-[#EF4444] text-xs font-medium text-center bg-[#EF4444]/10 border border-red-200 rounded-xl px-3 py-2">
                        {replyErrors.general}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-[#F7F8FA] p-4 border-t border-[#E5E7EB] shrink-0 flex justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => { setSelectedReq(null); setReplyErrors({}); setIsViewOnly(false); }}
                  className="px-5 py-2 font-semibold text-[#6B7280] bg-[#FFFFFF] border border-gray-300 rounded-xl hover:bg-[#F7F8FA] text-sm transition-colors"
                >
                  Đóng
                </motion.button>
                {!isViewOnly && (
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleUpdate}
                    className="px-6 py-2 font-bold text-white bg-[#F4C542] rounded-xl hover:bg-[#F4C542]/90 shadow-md shadow-[#F4C542]/30 flex items-center gap-2 text-sm transition-colors"
                  >
                    <Send className="w-4 h-4" /> Gửi phản hồi
                  </motion.button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDeleteModal
        isOpen={deleteDialog.show}
        onClose={() => setDeleteDialog({ show: false, requestId: null })}
        onConfirm={confirmDelete}
        title="Xác nhận xóa yêu cầu"
        message="Bạn có chắc chắn muốn xóa yêu cầu này không? Hành động này không thể hoàn tác."
      />

      <ConfirmDialog
        show={confirmDialog.show}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ show: false, message: '', onConfirm: null })}
        requireCountdown={false}
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

export default AdminRequests;
