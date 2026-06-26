import { useState, useEffect, useCallback } from 'react';
import API_URL from '../../api';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit, Search, X, Eye, EyeOff, Check, AlertCircle, Lock, Unlock, Filter, XCircle } from 'lucide-react';
import axios from 'axios';
import { TableSkeleton } from '../common/AdminSkeleton';
import ModalPortal, { Toast, ConfirmDialog } from '../common/ModalPortal';
import Pagination from '../common/Pagination';

const getPasswordStrength = (pwd) => {
  if (!pwd) return { score: 0, label: '', color: 'bg-gray-200', textClass: 'text-gray-300' };
  let score = 0;

  if (pwd.length >= 8) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\';/`~]/.test(pwd)) score++;

  if (pwd.length < 5 && score > 1) {
    score = 1;
  }

  switch (score) {
    case 0:
    case 1:
      return { score, label: 'Yếu', color: 'bg-[#EF4444]/100', textClass: 'text-[#EF4444]' };
    case 2:
      return { score, label: 'Trung bình', color: 'bg-[#F4C542]', textClass: 'text-[#F4C542]' };
    case 3:
      return { score, label: 'Mạnh', color: 'bg-[#3B82F6]/100', textClass: 'text-[#3B82F6]' };
    case 4:
      return { score, label: 'Rất mạnh', color: 'bg-[#22C55E]/100', textClass: 'text-[#22C55E]' };
    default:
      return { score: 0, label: '', color: 'bg-gray-200', textClass: 'text-gray-300' };
  }
};

function UserAccountManagement() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    roleFilter: '',
    sortBy: 'default'
  });
  const [displayFilters, setDisplayFilters] = useState({
    roleFilter: '',
    sortBy: 'default'
  });

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  const [showPassword, setShowPassword] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);

  // Custom Notification & Confirm Dialog
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, title: '', message: '', action: null });

  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    TaiKhoan: '',
    password: '',
    MaQuyen: ''
  });

  const showNotification = useCallback((type, message) => {
    setNotification({ show: true, type, message });
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        axios.get(`${API_URL}/api/users`),
        axios.get(`${API_URL}/api/roles`)
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification('error', 'Lỗi khi tải dữ liệu!');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, type: '', message: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  const validateForm = () => {
    if (editingUser?.TaiKhoan?.toLowerCase() === 'admin') return true;

    const errors = {};
    if (!formData.password) {
      errors.password = 'Vui lòng nhập mật khẩu';
    } else if (/\s/.test(formData.password)) {
      errors.password = 'Mật khẩu không được chứa khoảng trắng';
    } else {
      if (formData.password.length < 5) {
        errors.password = 'Mật khẩu phải có ít nhất 5 ký tự';
      } else if (formData.password.length > 20) {
        errors.password = 'Mật khẩu chỉ được tối đa 20 ký tự';
      } else if (!/[a-z]/.test(formData.password)) {
        errors.password = 'Mật khẩu phải chứa ít nhất một chữ thường';
      } else if (!/[A-Z]/.test(formData.password)) {
        errors.password = 'Mật khẩu phải chứa ít nhất một chữ hoa';
      } else if (!/[0-9]/.test(formData.password)) {
        errors.password = 'Mật khẩu phải chứa ít nhất một số';
      } else if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\';/`~]/.test(formData.password)) {
        errors.password = 'Mật khẩu phải chứa ít nhất một ký tự đặc biệt';
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // HIỂN THỊ XÁC NHẬN BƯỚC 1 THEO ĐÚNG YÊU CẦU
    setConfirmDialog({
      show: true,
      title: 'Xác nhận cập nhật',
      message: 'Bạn có chắc chắn muốn cập nhật thông tin tài khoản này không?',
      action: async () => {
        setConfirmDialog({ show: false, title: '', message: '', action: null });
        try {
          // BƯỚC 2: GỌI API & THÔNG BÁO THÀNH CÔNG
          await axios.put(`${API_URL}/api/users/${editingUser.TaiKhoan}`, {
            password: formData.password,
            MaQuyen: formData.MaQuyen
          });
          showNotification('success', 'Cập nhật thông tin tài khoản thành công.');
          fetchData();
          handleCloseForm();
        } catch (error) {
          console.error('Error saving user:', error);
          const errorMsg = error.response?.data?.message || 'Lỗi khi cập nhật tài khoản!';
          showNotification('error', errorMsg);
        }
      }
    });
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      TaiKhoan: user.TaiKhoan,
      password: '',
      MaQuyen: user.MaQuyen
    });
    setShowPassword(false);
    setFormErrors({});
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({ TaiKhoan: '', password: '', MaQuyen: '' });
    setShowPassword(false);
    setFormErrors({});
  };

  const handleToggleStatus = (user) => {
    const isLocked = user.TrangThai === 0 || user.TrangThai === false || user.TrangThai === 'Bị khóa';
    const newStatus = isLocked ? 'Hoạt động' : 'Bị khóa';
    const actionText = isLocked ? 'mở khóa' : 'khóa';

    setConfirmDialog({
      show: true,
      title: `Xác nhận ${actionText} tài khoản`,
      message: `Bạn có chắc chắn muốn ${actionText} tài khoản ${user.TaiKhoan} không?`,
      action: async () => {
        setConfirmDialog({ show: false, title: '', message: '', action: null });
        try {
          await axios.put(`${API_URL}/api/users/${user.TaiKhoan}/status`, {
            TrangThai: newStatus
          });
          showNotification('success', `${isLocked ? 'Mở khóa' : 'Khóa'} tài khoản thành công.`);
          fetchData();
        } catch (error) {
          console.error('Error toggling status:', error);
          const errorMsg = error.response?.data?.message || `Lỗi khi ${actionText} tài khoản!`;
          showNotification('error', errorMsg);
        }
      }
    });
  };

  const filteredUsers = users.filter(user => {
    if (debouncedSearchTerm.length > 0 && debouncedSearchTerm.trim() === '') return false;
    const searchLower = debouncedSearchTerm.toLowerCase();
    const matchesSearch =
      user.TaiKhoan?.toLowerCase().includes(searchLower) ||
      user.TenQuyen?.toLowerCase().includes(searchLower);
    const matchesRole = !filters.roleFilter || user.MaQuyen === parseInt(filters.roleFilter);
    return matchesSearch && matchesRole;
  }).sort((a, b) => {
    const isAdminA = a.TaiKhoan?.toLowerCase() === 'admin';
    const isAdminB = b.TaiKhoan?.toLowerCase() === 'admin';

    if (isAdminA && !isAdminB) return -1;
    if (!isAdminA && isAdminB) return 1;

    if (filters.sortBy === 'asc') return a.TaiKhoan.localeCompare(b.TaiKhoan);
    if (filters.sortBy === 'desc') return b.TaiKhoan.localeCompare(a.TaiKhoan);
    return 0;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handleClearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleApplyFilters = () => {
    setFilters({ ...displayFilters });
    setShowFilters(false);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ roleFilter: '', sortBy: 'default' });
    setDisplayFilters({ roleFilter: '', sortBy: 'default' });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const activeFilterCount = (filters.roleFilter ? 1 : 0) + (filters.sortBy !== 'default' ? 1 : 0) + (searchTerm ? 1 : 0);
  const hasActiveFilters = filters.roleFilter || filters.sortBy !== 'default' || searchTerm;

  const getRoleColor = (maQuyen) => {
    switch (maQuyen) {
      case 1: return 'bg-[#EF4444]/20 text-[#EF4444]';
      case 2: return 'bg-blue-100 text-[#3B82F6]';
      case 3: return 'bg-[#22C55E]/20 text-[#22C55E]';
      default: return 'bg-gray-100 text-[#6B7280]';
    }
  };

  if (loading) {
    return <TableSkeleton columns={4} rows={6} />;
  }

  return (
    <div className="flex gap-6 pb-10 max-w-7xl mx-auto">
      <div className="flex-1 space-y-8">

        {/* Toast Notification */}
        <Toast 
          show={notification.show} 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification({ ...notification, show: false })} 
        />

        {/* Header Section (Loại bỏ nút Thêm, bổ sung ghi chú tự động) */}
        <div className="bg-[#F4C542] rounded-2xl p-8 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="text-[#152238]">
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Lock className="w-8 h-8" />
                Quản lý tài khoản
              </h2>
              <p className="text-[#152238]/70 text-lg">Tài khoản được tạo tự động khi thêm mới sinh viên hoặc giảng viên.</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-[#E5E7EB] p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-300 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm tài khoản..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && handleClearSearch()}
                className="w-full pl-11 pr-10 py-2.5 bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#F4C542] focus:ring-2 focus:ring-[#F4C542]/20 transition-all text-gray-700 placeholder:font-semibold"
              />
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-[#6B7280] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowFilters(!showFilters)}
                className={`relative flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${
                  hasActiveFilters 
                    ? 'bg-[#F4C542] text-[#152238] shadow-lg shadow-amber-500/30' 
                    : 'bg-[#F4C542]/20 text-[#B45309] border border-[#FFF7D6] hover:bg-[#FFF7D6]'
                }`}
              >
                <Filter className="w-4 h-4" />
                Bộ lọc
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#EF4444]/100 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </motion.button>
              {hasActiveFilters && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={clearFilters}
                  className="px-5 py-2.5 bg-red-100 text-[#DC2626] rounded-xl font-medium hover:bg-red-200 transition-colors flex items-center gap-2 border border-red-200"
                >
                  <XCircle className="w-4 h-4" />
                  Xóa lọc
                </motion.button>
              )}
            </div>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-[#FFF7D6]/50 border border-[#FFF7D6] rounded-xl p-4 mt-4 space-y-4 relative z-10 w-full"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Sắp xếp</label>
                  <select
                    value={displayFilters.sortBy}
                    onChange={(e) => setDisplayFilters({ ...displayFilters, sortBy: e.target.value })}
                    className="w-full px-4 py-3 bg-[#FFFFFF] border-2 border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#F4C542] transition-colors text-gray-700"
                  >
                    <option value="default">Mặc định...</option>
                    <option value="asc">Tài khoản: A-Z</option>
                    <option value="desc">Tài khoản: Z-A</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Lọc theo quyền</label>
                  <select
                    value={displayFilters.roleFilter}
                    onChange={(e) => setDisplayFilters({ ...displayFilters, roleFilter: e.target.value })}
                    className="w-full px-4 py-3 bg-[#FFFFFF] border-2 border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#F4C542] transition-colors text-gray-700"
                  >
                    <option value="">Tất cả quyền</option>
                    {roles.map((role) => (
                      <option key={role.MaQuyen} value={role.MaQuyen}>
                        {role.TenQuyen}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleApplyFilters}
                  className="flex-1 bg-[#F4C542] text-[#152238] py-2.5 rounded-xl font-semibold hover:bg-[#F4C542]/90 transition-colors shadow-sm"
                >
                  Áp dụng bộ lọc
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setDisplayFilters({ roleFilter: '', sortBy: 'default' })}
                  className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Đặt lại
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Table (Loại bỏ nút Xóa, nút Thao tác giữ cố định) */}
        <div className="bg-[#FFFFFF] rounded-2xl shadow-xl border border-[#FFF7D6] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-amber-50 to-amber-100">
                <tr>
                  <th className="text-left py-5 px-6 text-sm font-bold text-[#152238] uppercase tracking-wider">Tài khoản</th>
                  <th className="text-left py-5 px-6 text-sm font-bold text-[#152238] uppercase tracking-wider">Quyền</th>
                  <th className="text-left py-5 px-6 text-sm font-bold text-[#152238] uppercase tracking-wider">Ngày tạo</th>
                  <th className="text-left py-5 px-6 text-sm font-bold text-[#152238] uppercase tracking-wider">Trạng thái</th>
                  <th className="text-center py-5 px-6 text-sm font-bold text-[#152238] uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.length > 0 ? (
                  currentUsers.map((user, index) => (
                    <motion.tr
                      key={user.TaiKhoan}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setViewingUser(user)}
                      className="border-b border-amber-50 hover:bg-gradient-to-r hover:from-amber-50 hover:to-amber-100 transition-all cursor-pointer"
                    >
                      <td className="py-5 px-6">
                        <span className="font-bold text-[#1F2937] text-sm">{user.TaiKhoan}</span>
                      </td>
                      <td className="py-5 px-6 text-sm">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getRoleColor(user.MaQuyen)}`}>
                          {user.TenQuyen || 'N/A'}
                        </span>
                      </td>
                      <td className="py-5 px-6 text-sm font-medium text-[#6B7280]">
                        {user.NgayTao ? new Date(user.NgayTao).toLocaleDateString('vi-VN') : 'N/A'}
                      </td>
                      <td className="py-5 px-6 text-sm">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${user.TrangThai === 0 || user.TrangThai === false || user.TrangThai === 'Bị khóa' ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'bg-[#22C55E]/20 text-[#22C55E]'}`}>
                          {user.TrangThai === 0 || user.TrangThai === false || user.TrangThai === 'Bị khóa' ? 'Đã khóa' : 'Hoạt động'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => { e.stopPropagation(); handleEdit(user); }}
                            className="p-2.5 bg-[#F4C542]/20 text-[#B45309] rounded-xl hover:bg-amber-200 transition-colors shadow-sm"
                            title="Cập nhật tài khoản"
                          >
                            <Edit className="w-4 h-4" />
                          </motion.button>
                          {user.TaiKhoan?.toLowerCase() !== 'admin' && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => { e.stopPropagation(); handleToggleStatus(user); }}
                              className={`p-2.5 rounded-xl transition-colors shadow-sm ${user.TrangThai === 0 || user.TrangThai === false || user.TrangThai === 'Bị khóa' ? 'bg-[#22C55E]/20 text-[#22C55E] hover:bg-green-200' : 'bg-[#EF4444]/20 text-[#EF4444] hover:bg-red-200'}`}
                              title={user.TrangThai === 0 || user.TrangThai === false || user.TrangThai === 'Bị khóa' ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                            >
                              {user.TrangThai === 0 || user.TrangThai === false || user.TrangThai === 'Bị khóa' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            </motion.button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-16 text-center text-[#6B7280] font-semibold">
                      Không tìm thấy tài khoản nào phù hợp
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 pb-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChưange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Modal Chỉnh Sửa Mật Khẩu (Khóa quyền) */}
      <AnimatePresence>
        {showForm && (
          <ModalPortal>
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/40 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#FFFFFF] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
              >
                <div className="bg-[#F4C542] px-6 py-5 flex justify-between items-center flex-shrink-0">
                  <div className="text-white">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      Cập nhật tài khoản
                    </h3>
                    <p className="text-[#152238]/70 text-sm mt-0.5">Đặt lại mật khẩu truy cập hệ thống</p>
                  </div>
                  <button onClick={handleCloseForm} className="p-2 hover:bg-white/40 rounded-lg text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} noValidate className="p-6 space-y-6">
                  {/* Account Name Readonly */}
                  <div className="bg-[#FFF7D6] border border-[#FFF7D6] rounded-xl px-5 py-4 text-sm flex justify-between items-center">
                    <span className="text-[#6B7280] font-bold uppercase tracking-wider text-xs">Tài khoản thao tác:</span>
                    <span className="font-mono font-black text-[#F4C542] text-lg">{editingUser.TaiKhoan}</span>
                  </div>

                  {/* Password Input (Hidden for admin) */}
                  {editingUser.TaiKhoan?.toLowerCase() !== 'admin' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Mật khẩu mới <span className="text-[#EF4444]">*</span></label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData({ ...formData, password: val });
                            if (val.length > 20) {
                              setFormErrors({ ...formErrors, password: 'Mật khẩu chỉ được tối đa 20 ký tự' });
                            } else {
                              setFormErrors({ ...formErrors, password: '' });
                            }
                          }}
                          className={`w-full px-4 py-3.5 pr-12 bg-[#F7F8FA] border-2 rounded-xl focus:border-[#F4C542] outline-none transition-colors font-medium text-sm ${formErrors.password ? 'border-red-500 focus:bg-[#EF4444]/10' : 'border-[#E5E7EB] focus:bg-[#FFFFFF]'
                            }`}
                          placeholder="Mật khẩu từ 5 - 20 ký tự: chữ hoa, thường, số, ký tự đặc biệt"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5 text-[#6B7280]" /> : <Eye className="w-5 h-5 text-[#6B7280]" />}
                        </button>
                      </div>
                      {formData.password && (
                        <div className="mt-2.5 space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-[#6B7280] font-medium">Độ mạnh mật khẩu:</span>
                            <span className={`font-bold transition-colors duration-300 ${getPasswordStrength(formData.password).textClass}`}>
                              {getPasswordStrength(formData.password).label}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex gap-1">
                            {[1, 2, 3, 4].map((index) => (
                              <div
                                key={index}
                                className={`h-full flex-1 transition-all duration-300 ${index <= getPasswordStrength(formData.password).score
                                  ? getPasswordStrength(formData.password).color
                                  : 'bg-gray-200'
                                  }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {formErrors.password && (
                        <p className="text-[#EF4444] text-xs mt-1.5 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {formErrors.password}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Role Select - LOCKED */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                      Quyền tài khoản
                    </label>
                    <select
                      disabled
                      value={formData.MaQuyen}
                      className="w-full px-4 py-3.5 bg-gray-100 border-2 border-[#E5E7EB] rounded-xl outline-none text-[#6B7280] font-bold cursor-not-allowed text-sm"
                    >
                      {roles.map((role) => (
                        <option key={role.MaQuyen} value={role.MaQuyen}>
                          {role.TenQuyen}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-[#F4C542] mt-2 flex items-center gap-1.5 font-semibold">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      Quyền tài khoản được quản lý tự động và không thể thay đổi tại đây.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-[#E5E7EB]">
                    {editingUser.TaiKhoan?.toLowerCase() === 'admin' ? (
                      <button
                        type="button"
                        onClick={handleCloseForm}
                        className="flex-1 py-3 bg-[#FFFFFF] border-2 border-[#E5E7EB] text-gray-700 font-bold rounded-xl hover:bg-[#F7F8FA] transition-colors"
                      >
                        Đóng
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleCloseForm}
                          className="flex-1 py-3 bg-[#FFFFFF] border-2 border-[#E5E7EB] text-gray-700 font-bold rounded-xl hover:bg-[#F7F8FA] transition-colors"
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-3 bg-[#F4C542] hover:from-amber-600 hover:to-amber-700 text-[#152238] font-bold rounded-xl shadow-lg transition-all"
                        >
                          Lưu thay đổi
                        </button>
                      </>
                    )}
                  </div>
                </form>
              </motion.div>
            </div>
          </ModalPortal>
        )}
      </AnimatePresence>

      {/* Confirm Dialog (Hộp thoại xác nhận 2 bước chuẩn hệ thống) */}
      <ConfirmDialog
        show={confirmDialog.show}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={() => confirmDialog.action && confirmDialog.action()}
        onCancel={() => setConfirmDialog({ show: false, title: '', message: '', action: null })}
      />

      {/* Modal Xem chi tiết người dùng */}
      <AnimatePresence>
        {viewingUser && (
          <ModalPortal>
            <div className="fixed inset-0 flex items-center justify-center z-[120] p-4 bg-black/40 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#FFFFFF] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
              >
                <div className="bg-[#F4C542] px-6 py-5 flex justify-between items-center flex-shrink-0">
                  <div className="text-white">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Chi tiết tài khoản
                    </h3>
                  </div>
                  <button onClick={() => setViewingUser(null)} className="p-2 hover:bg-white/40 rounded-lg text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-3 gap-4 border-b pb-4">
                    <div className="col-span-1 text-sm font-bold text-[#6B7280]">Tài khoản:</div>
                    <div className="col-span-2 text-sm font-bold text-[#1F2937]">{viewingUser.TaiKhoan}</div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 border-b pb-4">
                    <div className="col-span-1 text-sm font-bold text-[#6B7280]">Quyền:</div>
                    <div className="col-span-2 text-sm font-bold">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${getRoleColor(viewingUser.MaQuyen)}`}>
                        {viewingUser.TenQuyen || 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 border-b pb-4">
                    <div className="col-span-1 text-sm font-bold text-[#6B7280]">Ngày tạo:</div>
                    <div className="col-span-2 text-sm font-medium text-[#1F2937]">
                      {viewingUser.NgayTao ? new Date(viewingUser.NgayTao).toLocaleDateString('vi-VN') : 'N/A'}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 border-b pb-4">
                    <div className="col-span-1 text-sm font-bold text-[#6B7280]">Trạng thái:</div>
                    <div className="col-span-2 text-sm font-bold">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${viewingUser.TrangThai === 0 || viewingUser.TrangThai === false || viewingUser.TrangThai === 'Bị khóa' ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'bg-[#22C55E]/20 text-[#22C55E]'}`}>
                        {viewingUser.TrangThai === 0 || viewingUser.TrangThai === false || viewingUser.TrangThai === 'Bị khóa' ? 'Bị khóa' : 'Hoạt động'}
                      </span>
                    </div>
                  </div>

                  {viewingUser.MaQuyen === 3 && (
                    <>
                      <div className="grid grid-cols-3 gap-4 border-b pb-4">
                        <div className="col-span-1 text-sm font-bold text-[#6B7280]">Họ tên SV:</div>
                        <div className="col-span-2 text-sm font-medium text-[#1F2937]">{viewingUser.TenSinhVien || 'Chưa cập nhật'}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 border-b pb-4">
                        <div className="col-span-1 text-sm font-bold text-[#6B7280]">Lớp:</div>
                        <div className="col-span-2 text-sm font-medium text-[#1F2937]">{viewingUser.TenLop || 'Chưa cập nhật'}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 border-b pb-4">
                        <div className="col-span-1 text-sm font-bold text-[#6B7280]">Giới tính:</div>
                        <div className="col-span-2 text-sm font-medium text-[#1F2937]">{viewingUser.GioiTinhSV || 'Chưa cập nhật'}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 border-b pb-4">
                        <div className="col-span-1 text-sm font-bold text-[#6B7280]">Ngày sinh:</div>
                        <div className="col-span-2 text-sm font-medium text-[#1F2937]">
                          {viewingUser.NgaySinhSV ? new Date(viewingUser.NgaySinhSV).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 border-b pb-4">
                        <div className="col-span-1 text-sm font-bold text-[#6B7280]">Email:</div>
                        <div className="col-span-2 text-sm font-medium text-[#1F2937]">{viewingUser.EmailSV || 'Chưa cập nhật'}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1 text-sm font-bold text-[#6B7280]">Số điện thoại:</div>
                        <div className="col-span-2 text-sm font-medium text-[#1F2937]">{viewingUser.SDTSV || 'Chưa cập nhật'}</div>
                      </div>
                    </>
                  )}

                  {viewingUser.MaQuyen === 2 && (
                    <>
                      <div className="grid grid-cols-3 gap-4 border-b pb-4">
                        <div className="col-span-1 text-sm font-bold text-[#6B7280]">Họ tên GV:</div>
                        <div className="col-span-2 text-sm font-medium text-[#1F2937]">{viewingUser.TenGiangVien || 'Chưa cập nhật'}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 border-b pb-4">
                        <div className="col-span-1 text-sm font-bold text-[#6B7280]">Khoa:</div>
                        <div className="col-span-2 text-sm font-medium text-[#1F2937]">{viewingUser.TenKhoa || 'Chưa cập nhật'}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 border-b pb-4">
                        <div className="col-span-1 text-sm font-bold text-[#6B7280]">Email:</div>
                        <div className="col-span-2 text-sm font-medium text-[#1F2937]">{viewingUser.EmailGV || 'Chưa cập nhật'}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1 text-sm font-bold text-[#6B7280]">Số điện thoại:</div>
                        <div className="col-span-2 text-sm font-medium text-[#1F2937]">{viewingUser.SDTGV || 'Chưa cập nhật'}</div>
                      </div>
                    </>
                  )}
                </div>

                <div className="p-4 border-t border-[#E5E7EB] bg-[#F7F8FA] flex justify-end">
                  <button
                    onClick={() => setViewingUser(null)}
                    className="px-6 py-2.5 bg-[#FFFFFF] border-2 border-[#E5E7EB] text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </motion.div>
            </div>
          </ModalPortal>
        )}
      </AnimatePresence>

    </div>
  );
}

export default UserAccountManagement;
