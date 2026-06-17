import { useState, useEffect, useCallback } from 'react';
import API_URL from '../../api';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit, Search, X, Eye, EyeOff, Check, AlertCircle, Lock } from 'lucide-react';
import axios from 'axios';
import { TableSkeleton } from '../common/AdminSkeleton';
import ModalPortal from '../common/ModalPortal';
import Pagination from '../common/Pagination';

const getPasswordStrength = (pwd) => {
  if (!pwd) return { score: 0, label: '', color: 'bg-gray-200', textClass: 'text-gray-400' };
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
      return { score, label: 'Yếu', color: 'bg-red-500', textClass: 'text-red-500' };
    case 2:
      return { score, label: 'Trung bình', color: 'bg-orange-500', textClass: 'text-orange-500' };
    case 3:
      return { score, label: 'Mạnh', color: 'bg-blue-500', textClass: 'text-blue-500' };
    case 4:
      return { score, label: 'Rất mạnh', color: 'bg-green-500', textClass: 'text-green-500' };
    default:
      return { score: 0, label: '', color: 'bg-gray-200', textClass: 'text-gray-400' };
  }
};

function UserAccountManagement() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [displaySearchTerm, setDisplaySearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [roleFilter, setRoleFilter] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.TaiKhoan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.TenQuyen?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.MaQuyen === parseInt(roleFilter);
    return matchesSearch && matchesRole;
  }).sort((a, b) => {
    if (sortBy === 'asc') return a.TaiKhoan.localeCompare(b.TaiKhoan);
    if (sortBy === 'desc') return b.TaiKhoan.localeCompare(a.TaiKhoan);
    return 0;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, sortBy]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handleSearch = () => {
    setSearchTerm(displaySearchTerm);
  };

  const getRoleColor = (maQuyen) => {
    switch (maQuyen) {
      case 1: return 'bg-red-100 text-red-600';
      case 2: return 'bg-blue-100 text-blue-600';
      case 3: return 'bg-green-100 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) {
    return <TableSkeleton columns={4} rows={6} />;
  }

  return (
    <div className="flex gap-6 pb-10 max-w-7xl mx-auto">
      <div className="flex-1 space-y-8">

        {/* Toast Notification */}
        <AnimatePresence>
          {notification.show && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-8 right-8 px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 z-[100] ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}
            >
              {notification.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-semibold text-sm">{notification.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Section (Loại bỏ nút Thêm, bổ sung ghi chú tự động) */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Lock className="w-8 h-8" />
                Quản lý tài khoản
              </h2>
              <p className="text-orange-100 text-lg">Tài khoản được tạo tự động khi thêm mới sinh viên hoặc giảng viên.</p>
            </div>
          </div>
        </div>

        {/* Search và Filter */}
        <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow max-w-sm">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={displaySearchTerm}
                onChange={(e) => setDisplaySearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-sm font-medium"
              />
            </div>

            <select
              className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 cursor-pointer font-medium text-sm text-gray-700"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="default">Sắp xếp...</option>
              <option value="asc">Tài khoản: A-Z</option>
              <option value="desc">Tài khoản: Z-A</option>
            </select>

            <select
              className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 cursor-pointer font-medium text-sm text-gray-700"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">Tất cả quyền</option>
              {roles.map((role) => (
                <option key={role.MaQuyen} value={role.MaQuyen}>
                  {role.TenQuyen}
                </option>
              ))}
            </select>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSearch}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-orange-200 transition-all text-sm"
            >
              <Search className="w-4 h-4" />
              Tìm kiếm
            </motion.button>
          </div>
        </div>

        {/* Table (Loại bỏ nút Xóa, nút Thao tác giữ cố định) */}
        <div className="bg-white rounded-2xl shadow-xl border border-orange-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-orange-50 to-orange-100">
                <tr>
                  <th className="text-left py-5 px-6 text-sm font-bold text-orange-700 uppercase tracking-wider">Tài khoản</th>
                  <th className="text-left py-5 px-6 text-sm font-bold text-orange-700 uppercase tracking-wider">Quyền</th>
                  <th className="text-left py-5 px-6 text-sm font-bold text-orange-700 uppercase tracking-wider">Ngày tạo</th>
                  <th className="text-center py-5 px-6 text-sm font-bold text-orange-700 uppercase tracking-wider">Thao tác</th>
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
                      className="border-b border-orange-50 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 transition-all"
                    >
                      <td className="py-5 px-6">
                        <span className="font-bold text-gray-800 text-sm">{user.TaiKhoan}</span>
                      </td>
                      <td className="py-5 px-6 text-sm">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getRoleColor(user.MaQuyen)}`}>
                          {user.TenQuyen || 'N/A'}
                        </span>
                      </td>
                      <td className="py-5 px-6 text-sm font-medium text-gray-600">
                        {user.NgayTao ? new Date(user.NgayTao).toLocaleDateString('vi-VN') : 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEdit(user)}
                            className="p-2.5 bg-orange-100 text-orange-600 rounded-xl hover:bg-orange-200 transition-colors shadow-sm"
                            title="Đặt lại mật khẩu"
                          >
                            <Edit className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-16 text-center text-gray-500 font-semibold">
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
              onPageChange={setCurrentPage}
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
                className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
              >
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 flex justify-between items-center flex-shrink-0">
                  <div className="text-white">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      Cập nhật tài khoản
                    </h3>
                    <p className="text-orange-100 text-sm mt-0.5">Đặt lại mật khẩu truy cập hệ thống</p>
                  </div>
                  <button onClick={handleCloseForm} className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} noValidate className="p-6 space-y-6">
                  {/* Account Name Readonly */}
                  <div className="bg-orange-50 border border-orange-100 rounded-xl px-5 py-4 text-sm flex justify-between items-center">
                    <span className="text-gray-500 font-bold uppercase tracking-wider text-xs">Tài khoản thao tác:</span>
                    <span className="font-mono font-black text-orange-700 text-lg">{editingUser.TaiKhoan}</span>
                  </div>

                  {/* Password Input */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Mật khẩu mới <span className="text-red-500">*</span></label>
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
                        className={`w-full px-4 py-3.5 pr-12 bg-gray-50 border-2 rounded-xl focus:border-orange-500 outline-none transition-colors font-medium text-sm ${formErrors.password ? 'border-red-500 focus:bg-red-50' : 'border-gray-200 focus:bg-white'
                          }`}
                        placeholder="Mật khẩu từ 5 - 20 ký tự: chữ hoa, thường, số, ký tự đặc biệt"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5 text-gray-500" /> : <Eye className="w-5 h-5 text-gray-500" />}
                      </button>
                    </div>
                    {formData.password && (
                      <div className="mt-2.5 space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500 font-medium">Độ mạnh mật khẩu:</span>
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
                      <p className="text-red-500 text-xs mt-1.5 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {formErrors.password}
                      </p>
                    )}
                  </div>

                  {/* Role Select - LOCKED */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                      Quyền tài khoản
                    </label>
                    <select
                      disabled
                      value={formData.MaQuyen}
                      className="w-full px-4 py-3.5 bg-gray-100 border-2 border-gray-200 rounded-xl outline-none text-gray-500 font-bold cursor-not-allowed text-sm"
                    >
                      {roles.map((role) => (
                        <option key={role.MaQuyen} value={role.MaQuyen}>
                          {role.TenQuyen}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-orange-600 mt-2 flex items-center gap-1.5 font-semibold">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      Quyền tài khoản được quản lý tự động và không thể thay đổi tại đây.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={handleCloseForm}
                      className="flex-1 py-3 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl shadow-lg transition-all"
                    >
                      Lưu thay đổi
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </ModalPortal>
        )}
      </AnimatePresence>

      {/* Confirm Dialog (Hộp thoại xác nhận 2 bước chuẩn hệ thống) */}
      <AnimatePresence>
        {confirmDialog.show && (
          <ModalPortal>
            <div className="fixed inset-0 flex items-center justify-center z-[110] p-4 bg-black/40 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl border border-gray-100"
              >
                <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black text-gray-800 mb-2">{confirmDialog.title}</h3>
                <p className="text-gray-600 text-sm mb-6 font-medium leading-relaxed">{confirmDialog.message}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmDialog({ show: false, title: '', message: '', action: null })}
                    className="flex-1 py-2.5 bg-gray-100 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={confirmDialog.action}
                    className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors shadow-sm"
                  >
                    Đồng ý
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
