import React, { useState, useEffect } from 'react';
import API_URL from '../../api';
import { RequestsSkeleton } from '../common/AdminSkeleton';
import Pagination from '../common/Pagination';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Filter, CheckCircle2, Clock, AlertCircle, X, Send, User, Reply, Search, Trash2, Check, Paperclip, Archive, RefreshCcw
} from 'lucide-react';
import axios from 'axios';
import ModalPortal, { ConfirmDialog, Toast } from '../common/ModalPortal';
import ConfirmDeleteModal from '../common/ConfirmDeleteModal';

const statusConfig = {
  'Hoàn thành': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', Icon: CheckCircle2 },
  'Đã phản hồi': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', Icon: CheckCircle2 },
  'Chờ xử lý': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', Icon: Clock },
  'Từ chối': { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', Icon: X },
};

function StatusBadge({ status }) {
  const displayStatus = status === 'Đang xử lý' ? 'Chờ xử lý' : status;
  const cfg = statusConfig[displayStatus] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', Icon: AlertCircle };
  const { bg, text, border, Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${bg} ${text} ${border}`}>
      <Icon className="w-3.5 h-3.5" />
      {displayStatus}
    </span>
  );
}

function AdminRequests({ refreshBadge }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterTopic, setFilterTopic] = useState('All');
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
  const [isRecycleBinMode, setIsRecycleBinMode] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const url = isRecycleBinMode
        ? `${API_URL}/api/admin/support-requests/deleted`
        : `${API_URL}/api/admin/support-requests`;
      const res = await axios.get(url);
      setRequests(res.data);
      if (refreshBadge && !isRecycleBinMode) refreshBadge();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, [isRecycleBinMode]);

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
    setUpdateStatus(req.TrangThai === 'Đang xử lý' ? 'Chờ xử lý' : req.TrangThai);
    setReplyErrors({});
    setIsViewOnly(viewOnly);
  };

  const validateReply = () => {
    const errors = {};
    if (!updateStatus) {
      errors.updateStatus = 'Vui lòng chọn trạng thái';
    }
    if (updateStatus === 'Chờ xử lý' || updateStatus === 'Đang xử lý') {
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

  const handleRestore = async (requestId) => {
    try {
      await axios.put(`${API_URL}/api/admin/support-requests/${requestId}/restore`);
      setToast({ show: true, message: 'Khôi phục yêu cầu thành công!', type: 'success' });
      fetchRequests();
    } catch (error) {
      setToast({ show: true, message: 'Lỗi khi khôi phục yêu cầu!', type: 'error' });
    }
  };

  const handleHardDelete = (requestId) => {
    setConfirmDialog({
      show: true,
      message: 'Bạn có chắc chắn muốn xóa vĩnh viễn yêu cầu này không? Hành động này không thể hoàn tác.',
      onConfirm: async () => {
        try {
          await axios.delete(`${API_URL}/api/admin/support-requests/${requestId}/hard`);
          setToast({ show: true, message: 'Xóa vĩnh viễn thành công!', type: 'success' });
          fetchRequests();
        } catch (error) {
          setToast({ show: true, message: 'Lỗi khi xóa vĩnh viễn!', type: 'error' });
        } finally {
          setConfirmDialog({ show: false, message: '', onConfirm: null });
        }
      }
    });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.requestId) return;
    const requestIdToDelete = deleteDialog.requestId;
    const isBulkDelete = requestIdToDelete === 'bulk';
    setDeleteDialog({ show: false, requestId: null });
    setConfirmDialog({
      show: true,
      message: isBulkDelete
        ? `Bạn có chắc chắn muốn xóa ${isRecycleBinMode ? 'vĩnh viễn ' : ''}${selectedRequests.size} yêu cầu đã chọn khỏi danh sách quản lý không? ${isRecycleBinMode ? '(Sinh viên/Giảng viên vẫn sẽ thấy yêu cầu này trong lịch sử của họ)' : ''}`
        : `Bạn có chắc chắn muốn xóa ${isRecycleBinMode ? 'vĩnh viễn ' : ''}yêu cầu này khỏi danh sách quản lý không? ${isRecycleBinMode ? '(Sinh viên/Giảng viên vẫn sẽ thấy yêu cầu này trong lịch sử của họ)' : ''}`,
      onConfirm: async () => {
        if (!navigator.onLine) {
          setToast({ show: true, message: 'Mất kết nối Internet. Vui lòng kiểm tra lại mạng.', type: 'error' });
          setConfirmDialog({ show: false, message: '', onConfirm: null });
          return;
        }
        try {
          const endpointSuffix = isRecycleBinMode ? '/hard' : '';
          if (isBulkDelete) {
            console.log('Bulk deleting requests:', Array.from(selectedRequests));
            await Promise.all(
              Array.from(selectedRequests).map(id =>
                axios.delete(`${API_URL}/api/admin/support-requests/${id}${endpointSuffix}`, { timeout: 10000 })
              )
            );
            console.log('Bulk delete successful');
            setToast({ show: true, message: `Đã xóa ${isRecycleBinMode ? 'vĩnh viễn ' : ''}${selectedRequests.size} yêu cầu thành công!`, type: 'success' });
            setSelectedRequests(new Set());
          } else {
            console.log('Deleting request:', requestIdToDelete);
            await axios.delete(`${API_URL}/api/admin/support-requests/${requestIdToDelete}${endpointSuffix}`, { timeout: 10000 });
            console.log('Delete successful');
            setToast({ show: true, message: `Xóa ${isRecycleBinMode ? 'vĩnh viễn ' : ''}yêu cầu thành công!`, type: 'success' });
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
    if (filterTopic !== 'All' && req.LoaiYeuCau !== filterTopic) return false;
    if (filterStatus === 'Chờ xử lý') {
      if (req.TrangThai !== 'Chờ xử lý' && req.TrangThai !== 'Đang xử lý') return false;
    } else if (filterStatus !== 'All' && req.TrangThai !== filterStatus) return false;
    if (search && !req.TenNguoiGui?.toLowerCase().includes(search.toLowerCase()) &&
      !req.TieuDe?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterRole, filterStatus, filterTopic]);

  const topics = Array.from(new Set(requests.map(req => req.LoaiYeuCau).filter(Boolean)));

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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-[#F4C542] rounded-2xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#FDE68A] rounded-xl flex items-center justify-center shadow-sm">
            <MessageSquare className="w-7 h-7 text-[#152238]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#152238] tracking-tight">Quản lý Yêu cầu & Phản hồi</h2>
            <p className="text-[#152238]/80 text-sm mt-1 font-medium">Tiếp nhận và xử lý kiến nghị từ Sinh viên / Giảng viên nhanh chóng và hiệu quả</p>
          </div>
        </div>
      </motion.div>

      {/* Filters Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap xl:flex-nowrap items-center justify-between gap-4"
      >
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="relative flex-1 min-w-[200px] xl:min-w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo mã, tên..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-transparent rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100/50 transition-all outline-none"
            />
          </div>
          <div className="h-8 w-px bg-slate-200 hidden md:block mx-2"></div>
          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-transparent rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100/50 transition-all outline-none cursor-pointer appearance-none"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1rem', paddingRight: '2.5rem' }}
          >
            <option value="All">Mọi đối tượng</option>
            <option value="SinhVien">Sinh viên</option>
            <option value="GiangVien">Giảng viên</option>
          </select>
          <select
            value={filterTopic}
            onChange={e => setFilterTopic(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-transparent rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100/50 transition-all outline-none cursor-pointer appearance-none"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1rem', paddingRight: '2.5rem' }}
          >
            <option value="All">Mọi chủ đề</option>
            {topics.map(topic => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-transparent rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100/50 transition-all outline-none cursor-pointer appearance-none"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1rem', paddingRight: '2.5rem' }}
          >
            <option value="All">Mọi trạng thái</option>
            <option value="Chờ xử lý">Chờ xử lý</option>
            <option value="Đã phản hồi">Đã phản hồi</option>
            <option value="Từ chối">Từ chối</option>
          </select>
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
          {selectedRequests.size > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => setDeleteDialog({ show: true, requestId: 'bulk' })}
              className="px-4 py-2.5 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> {isRecycleBinMode ? 'Xóa vĩnh viễn' : 'Xóa'} {selectedRequests.size}
            </motion.button>
          )}
          <button
            onClick={() => setIsRecycleBinMode(!isRecycleBinMode)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2 border ${isRecycleBinMode ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-indigo-600'}`}
          >
            <Archive className={`w-4 h-4 ${isRecycleBinMode ? 'text-indigo-600' : ''}`} />
            {isRecycleBinMode ? 'Thoát Thùng rác' : 'Thùng rác'}
          </button>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
        className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider w-14 text-center">
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
                    className="w-4.5 h-4.5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-colors"
                  />
                </th>
                <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider w-16 text-center">ID</th>
                <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Người gửi</th>
                <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Nội dung</th>
                <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Thời gian</th>
                <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {currentItems.map((req, i) => (
                <motion.tr
                  key={req.MaYeuCau}
                  custom={i}
                  variants={rowVariants}
                  initial="hidden"
                  animate="visible"
                  className={`hover:bg-slate-50/80 transition-colors duration-200 cursor-pointer group ${selectedRequests.has(req.MaYeuCau) ? 'bg-indigo-50/30' : ''}`}
                  onClick={() => handleOpenModal(req, true)}
                >
                  <td className="p-5 text-center" onClick={(e) => e.stopPropagation()}>
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
                      className="w-4.5 h-4.5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-colors"
                    />
                  </td>
                  <td className="p-5 text-center">
                    <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">#{req.MaYeuCau}</span>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${req.VaiTro === 'SinhVien' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {req.TenNguoiGui ? req.TenNguoiGui.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{req.TenNguoiGui || 'Người dùng ẩn danh'}</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {req.VaiTro === 'SinhVien' ? 'SV' : 'GV'} · {req.NguoiGui}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-5 max-w-sm">
                    <div className="flex flex-col gap-1.5">
                      <span className="inline-flex w-fit px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[11px] font-bold uppercase tracking-wide">{req.LoaiYeuCau}</span>
                      <p className="font-semibold text-slate-800 text-sm line-clamp-1">{req.TieuDe}</p>
                    </div>
                  </td>
                  <td className="p-5">
                    <p className="text-sm font-semibold text-slate-700">{new Date(req.NgayGui).toLocaleDateString('vi-VN')}</p>
                    {req.NgayPhanHoi && <p className="text-xs text-slate-400 font-medium mt-1">TL: {new Date(req.NgayPhanHoi).toLocaleDateString('vi-VN')}</p>}
                  </td>
                  <td className="p-5"><StatusBadge status={req.TrangThai} /></td>
                  <td className="p-5 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2">
                      {isRecycleBinMode ? (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleRestore(req.MaYeuCau)}
                            className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm"
                            title="Khôi phục"
                          >
                            <RefreshCcw className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleHardDelete(req.MaYeuCau)}
                            className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm"
                            title="Xóa vĩnh viễn"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </>
                      ) : (
                        <>
                          {(req.TrangThai === 'Chờ xử lý' || req.TrangThai === 'Đang xử lý') && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleOpenModal(req, false)}
                              className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm"
                              title="Xử lý yêu cầu"
                            >
                              <Reply className="w-4 h-4" />
                            </motion.button>
                          )}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(req.MaYeuCau)}
                            className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-16 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                      <MessageSquare className="w-10 h-10 text-slate-300" />
                    </div>
                    <p className="font-bold text-slate-600 text-lg">Không tìm thấy yêu cầu nào</p>
                    <p className="text-slate-400 text-sm mt-1">Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/50">
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-white p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                    <Reply className="w-4 h-4 text-indigo-600" />
                  </div>
                  Chi tiết yêu cầu #{selectedReq.MaYeuCau}
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { setSelectedReq(null); setReplyErrors({}); }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-4 items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-sm ${selectedReq.VaiTro === 'SinhVien' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                    {selectedReq.TenNguoiGui ? selectedReq.TenNguoiGui.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-base">{selectedReq.TenNguoiGui || 'Người dùng ẩn danh'}</h4>
                    <p className="text-sm font-medium text-slate-500 mt-0.5">Mã: {selectedReq.NguoiGui} · {selectedReq.VaiTro === 'SinhVien' ? 'Sinh viên' : 'Giảng viên'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{new Date(selectedReq.NgayGui).toLocaleString('vi-VN')}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-3">Thông tin yêu cầu</h4>
                  <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-50 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:justify-between">
                      <span className="text-sm font-semibold text-slate-500">Loại yêu cầu:</span>
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full w-fit">{selectedReq.LoaiYeuCau}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-1 sm:justify-between">
                      <span className="text-sm font-semibold text-slate-500 shrink-0">Chủ đề:</span>
                      <span className="text-sm font-bold text-slate-800 sm:text-right">{selectedReq.ChuDe || selectedReq.TieuDe}</span>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-slate-500 block mb-2">Nội dung chi tiết:</span>
                      <div className="bg-white p-4 rounded-xl border border-indigo-100/50 shadow-sm">
                        {(() => {
                          const noiDung = selectedReq.NoiDung;
                          if (!noiDung) return null;
                          const fileStartIdx = noiDung.indexOf('[FILE_MINH_CHUNG_START]');
                          const fileEndIdx = noiDung.indexOf('[FILE_MINH_CHUNG_END]');
                          
                          if (fileStartIdx !== -1 && fileEndIdx !== -1) {
                            const textContent = noiDung.substring(0, fileStartIdx).trim();
                            const fileData = noiDung.substring(fileStartIdx + '[FILE_MINH_CHUNG_START]'.length, fileEndIdx).trim();
                            const isImage = fileData.startsWith('data:image/');
                            
                            return (
                              <div className="space-y-4">
                                <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">{textContent}</p>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                  <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">File đính kèm:</p>
                                  {isImage ? (
                                    <a href={fileData} target="_blank" rel="noopener noreferrer" className="block w-fit">
                                      <img src={fileData} alt="Minh chứng" className="max-w-[200px] max-h-[150px] object-cover rounded-lg border border-slate-200 shadow-sm hover:opacity-90 transition-opacity" />
                                    </a>
                                  ) : (
                                    <a href={fileData} download="minh_chung" className="text-indigo-600 hover:text-indigo-700 hover:underline text-sm font-semibold flex items-center gap-1.5 w-fit">
                                      <Paperclip className="w-4 h-4" /> Tải xuống file đính kèm
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          }
                          
                          return <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">{noiDung}</p>;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {isViewOnly && selectedReq.TrangThai !== 'Chờ xử lý' && selectedReq.TrangThai !== 'Đang xử lý' && (
                  <div className="border-t border-slate-100 pt-5 space-y-4">
                    <h4 className="font-bold text-slate-800 text-sm">Phản hồi từ Ban Quản lý</h4>
                    <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-50 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-slate-500">Trạng thái xử lý:</span>
                        <StatusBadge status={selectedReq.TrangThai} />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-slate-500">Thời gian phản hồi:</span>
                        <span className="text-sm font-bold text-slate-800">
                          {selectedReq.NgayPhanHoi ? new Date(selectedReq.NgayPhanHoi).toLocaleString('vi-VN') : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-slate-500 block mb-2">Nội dung phản hồi:</span>
                        <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">{selectedReq.PhanHoi || 'Không có nội dung phản hồi.'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {!isViewOnly && (
                  <div className="border-t border-slate-100 pt-5 space-y-4">
                    <h4 className="font-bold text-slate-800 text-sm">Phản hồi yêu cầu</h4>
                    <div>
                      <select
                        value={updateStatus}
                        onChange={e => {
                          setUpdateStatus(e.target.value);
                          if (replyErrors.updateStatus) setReplyErrors(prev => ({ ...prev, updateStatus: '' }));
                        }}
                        className={`w-full p-3 bg-white border rounded-xl outline-none text-sm font-semibold text-slate-700 transition-all ${replyErrors.updateStatus ? 'border-rose-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100/50' : 'border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50'}`}
                      >
                        <option value="Chờ xử lý">Chờ xử lý</option>
                        <option value="Đã phản hồi">Đã phản hồi</option>
                        <option value="Từ chối">Từ chối</option>
                      </select>
                      {replyErrors.updateStatus && (
                        <p className="text-rose-500 text-xs font-medium mt-1.5">{replyErrors.updateStatus}</p>
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
                            ? 'Nhập nội dung phản hồi (bắt buộc)...'
                            : 'Nhập nội dung phản hồi (tùy chọn)...'
                        }
                        className={`w-full p-3.5 bg-white border rounded-xl outline-none resize-none text-sm font-medium transition-all ${replyErrors.replyText ? 'border-rose-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100/50' : 'border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50'}`}
                      />
                      <div className="flex items-center justify-between mt-1.5">
                        {replyErrors.replyText
                          ? <p className="text-rose-500 text-xs font-medium">{replyErrors.replyText}</p>
                          : <span />}
                        <p className="text-xs font-medium text-slate-400">{replyText.length}/1000</p>
                      </div>
                    </div>
                    {replyErrors.general && (
                      <p className="text-rose-600 text-xs font-bold text-center bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                        {replyErrors.general}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-5 border-t border-slate-100 shrink-0 flex justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => { setSelectedReq(null); setReplyErrors({}); setIsViewOnly(false); }}
                  className="px-5 py-2.5 font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-sm transition-all shadow-sm"
                >
                  Đóng
                </motion.button>
                {!isViewOnly && (
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleUpdate}
                    className="px-6 py-2.5 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-600/20 flex items-center gap-2 text-sm transition-all"
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
