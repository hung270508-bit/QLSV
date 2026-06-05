import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Search, X, Eye, EyeOff, RefreshCw, Check, AlertCircle, Lock } from 'lucide-react';
import axios from 'axios';
import ModalPortal from '../ModalPortal';

function UserAccountManagement() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [displaySearchTerm, setDisplaySearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('default'); // 'default', 'asc', 'desc'
  const [roleFilter, setRoleFilter] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
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
        axios.get('http://localhost:5000/api/users'),
        axios.get('http://localhost:5000/api/roles')
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
    const loadData = async () => {
      await fetchData();
    };

    loadData();
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
    
    if (!formData.TaiKhoan?.trim()) {
      errors.TaiKhoan = 'Tài khoản không được để trống';
    } else if (formData.TaiKhoan.trim().length < 3) {
      errors.TaiKhoan = 'Tài khoản phải có ít nhất 3 ký tự';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.TaiKhoan)) {
      errors.TaiKhoan = 'Tài khoản chỉ được chứa chữ, số và dấu gạch dưới';
    }
    
    if (!formData.password?.trim()) {
      errors.password = 'Mật khẩu không được để trống';
    } else if (formData.password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    
    if (!editingUser && formData.password !== confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    if (!formData.MaQuyen) {
      errors.MaQuyen = 'Quyền không được để trống';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const generatePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData({ ...formData, password });
    setConfirmPassword(password);
    showNotification('success', 'Mật khẩu được tạo ngẫu nhiên');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (editingUser) {
        await axios.put(`http://localhost:5000/api/users/${editingUser.TaiKhoan}`, {
          password: formData.password,
          MaQuyen: formData.MaQuyen
        });
        showNotification('success', 'Cập nhật tài khoản thành công!');
      } else {
        // Kiểm tra tài khoản có tồn tại không
        const existingUser = users.find(u => u.TaiKhoan === formData.TaiKhoan);
        if (existingUser) {
          showNotification('error', 'Tài khoản này đã tồn tại!');
          setFormErrors({ TaiKhoan: 'Tài khoản đã tồn tại' });
          return;
        }
        
        await axios.post('http://localhost:5000/api/users', formData);
        showNotification('success', 'Thêm tài khoản thành công!');
      }
      fetchData();
      handleCloseForm();
    } catch (error) {
      console.error('Error saving user:', error);
      const errorMsg = error.response?.data?.message || 'Lỗi khi lưu tài khoản!';
      showNotification('error', errorMsg);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      TaiKhoan: user.TaiKhoan,
      password: '',
      MaQuyen: user.MaQuyen
    });
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setFormErrors({});
    setShowForm(true);
  };

  const handleDelete = async (taiKhoan) => {
    if (taiKhoan === 'admin') {
      showNotification('error', 'Không thể xóa tài khoản admin!');
      return;
    }
    
    if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
      try {
        await axios.delete(`http://localhost:5000/api/users/${taiKhoan}`);
        showNotification('success', 'Xóa tài khoản thành công!');
        fetchData();
      } catch (error) {
        console.error('Error deleting user:', error);
        showNotification('error', 'Lỗi khi xóa tài khoản!');
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({
      TaiKhoan: '',
      password: '',
      MaQuyen: ''
    });
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
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

  const handleSearch = () => {
    setSearchTerm(displaySearchTerm);
  };

  const getRoleColor = (maQuyen) => {
    switch(maQuyen) {
      case 1: return 'bg-red-100 text-red-600';
      case 2: return 'bg-blue-100 text-blue-600';
      case 3: return 'bg-green-100 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className="flex-1 space-y-8">
      {/* Notification */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 z-[100] ${
              notification.type === 'success'
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {notification.type === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-semibold">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Lock className="w-8 h-8" />
              Quản lý tài khoản
            </h2>
            <p className="text-orange-100 text-lg">Tạo, cập nhật và quản lý tài khoản người dùng hệ thống</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setEditingUser(null);
              setFormData({ TaiKhoan: '', password: '', MaQuyen: '' });
              setConfirmPassword('');
              setShowPassword(false);
              setShowConfirmPassword(false);
              setFormErrors({});
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-white text-orange-600 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Thêm tài khoản
          </motion.button>
        </div>
      </div>

      {/* Search và Filter */}
      <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6">
        <div className="flex gap-4">
          {/* Thanh tìm kiếm */}
          <div className="relative flex-grow max-w-sm">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={displaySearchTerm}
              onChange={(e) => setDisplaySearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
            />
          </div>

          {/* Chọn sắp xếp */}
          <select 
            className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 cursor-pointer"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="default">Sắp xếp...</option>
            <option value="asc">Tài khoản: A-Z</option>
            <option value="desc">Tài khoản: Z-A</option>
          </select>

          {/* Lọc theo quyền */}
          <select 
            className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 cursor-pointer"
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

          {/* Nút tìm kiếm */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSearch}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-orange-200 transition-all"
          >
            <Search className="w-5 h-5" />
            Tìm kiếm
          </motion.button>
        </div>
      </div>

      {/* Table */}
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
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.TaiKhoan}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-orange-50 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 transition-all"
                  >
                    <td className="py-5 px-6">
                      <span className="font-semibold text-gray-800 text-base">{user.TaiKhoan}</span>
                    </td>
                    <td className="py-5 px-6 text-sm">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getRoleColor(user.MaQuyen)}`}>
                        {user.TenQuyen || 'N/A'}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-sm text-gray-600">
                      {user.NgayTao ? new Date(user.NgayTao).toLocaleDateString('vi-VN') : 'N/A'}
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center justify-center gap-3">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEdit(user)}
                          className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        {user.TaiKhoan !== 'admin' && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(user.TaiKhoan)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-gray-500">
                    Không tìm thấy tài khoản nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showForm && (
          <ModalPortal>
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/40 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
              >
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 flex justify-between items-center flex-shrink-0">
                  <div className="text-white">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      {editingUser ? 'Cập nhật tài khoản' : 'Thêm tài khoản mới'}
                    </h3>
                    <p className="text-orange-100 text-sm mt-0.5">
                      {editingUser ? 'Cập nhật mật khẩu hoặc quyền truy cập' : 'Tạo tài khoản người dùng trong hệ thống'}
                    </p>
                  </div>
                  <button onClick={handleCloseForm} className="p-2 hover:bg-white/20 rounded-lg text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                  {!editingUser && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Tài khoản *</label>
                      <input
                        type="text"
                        value={formData.TaiKhoan}
                        onChange={(e) => {
                          setFormData({ ...formData, TaiKhoan: e.target.value });
                          setFormErrors({ ...formErrors, TaiKhoan: '' });
                        }}
                        className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:border-orange-500 outline-none transition-colors ${
                          formErrors.TaiKhoan
                            ? 'border-red-500 focus:bg-red-50'
                            : 'border-gray-200 focus:bg-white'
                        }`}
                        required
                        placeholder="Nhập tài khoản (tối thiểu 3 ký tự)"
                      />
                      {formErrors.TaiKhoan && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {formErrors.TaiKhoan}
                        </p>
                      )}
                    </div>
                  )}

                  {editingUser && (
                    <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 text-sm">
                      <span className="text-gray-500">Tài khoản: </span>
                      <span className="font-mono font-bold text-orange-700">{editingUser.TaiKhoan}</span>
                    </div>
                  )}

                  <div className={`grid grid-cols-1 ${editingUser ? '' : 'sm:grid-cols-2'} gap-4`}>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => {
                            setFormData({ ...formData, password: e.target.value });
                            setFormErrors({ ...formErrors, password: '' });
                          }}
                          className={`w-full px-4 py-3 pr-16 bg-gray-50 border-2 rounded-xl focus:border-orange-500 outline-none transition-colors ${
                            formErrors.password
                              ? 'border-red-500 focus:bg-red-50'
                              : 'border-gray-200 focus:bg-white'
                          }`}
                          required
                          placeholder={editingUser ? 'Nhập mật khẩu mới' : 'Tối thiểu 6 ký tự'}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="w-5 h-5 text-gray-500" />
                            ) : (
                              <Eye className="w-5 h-5 text-gray-500" />
                            )}
                          </button>
                          {!editingUser && (
                            <button
                              type="button"
                              onClick={generatePassword}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                              title="Tạo mật khẩu ngẫu nhiên"
                            >
                              <RefreshCw className="w-5 h-5 text-gray-500" />
                            </button>
                          )}
                        </div>
                      </div>
                      {formErrors.password && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {formErrors.password}
                        </p>
                      )}
                    </div>

                    {!editingUser && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Xác nhận mật khẩu *</label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => {
                              setConfirmPassword(e.target.value);
                              setFormErrors({ ...formErrors, confirmPassword: '' });
                            }}
                            className={`w-full px-4 py-3 pr-12 bg-gray-50 border-2 rounded-xl focus:border-orange-500 outline-none transition-colors ${
                              formErrors.confirmPassword
                                ? 'border-red-500 focus:bg-red-50'
                                : 'border-gray-200 focus:bg-white'
                            }`}
                            required
                            placeholder="Nhập lại mật khẩu"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-5 h-5 text-gray-500" />
                            ) : (
                              <Eye className="w-5 h-5 text-gray-500" />
                            )}
                          </button>
                        </div>
                        {formErrors.confirmPassword && (
                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {formErrors.confirmPassword}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="bg-orange-50 p-4 rounded-xl border-2 border-orange-100">
                    <label className="flex items-center gap-2 text-sm font-semibold text-orange-800 mb-2">
                      <Lock className="w-4 h-4" />
                      Quyền tài khoản *
                    </label>
                    <select
                      value={formData.MaQuyen}
                      onChange={(e) => {
                        setFormData({ ...formData, MaQuyen: e.target.value });
                        setFormErrors({ ...formErrors, MaQuyen: '' });
                      }}
                      className={`w-full px-4 py-3 bg-white border-2 rounded-xl focus:border-orange-500 outline-none transition-colors ${
                        formErrors.MaQuyen
                          ? 'border-red-500 focus:bg-red-50'
                          : 'border-orange-200'
                      }`}
                      required
                      disabled={editingUser?.TaiKhoan === 'admin'}
                    >
                      <option value="">— Chọn quyền —</option>
                      {roles.map((role) => (
                        <option key={role.MaQuyen} value={role.MaQuyen}>
                          {role.TenQuyen}
                        </option>
                      ))}
                    </select>
                    {editingUser?.TaiKhoan === 'admin' && (
                      <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Không được thay đổi quyền của tài khoản admin
                      </p>
                    )}
                    {formErrors.MaQuyen && (
                      <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.MaQuyen}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCloseForm}
                      className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-lg"
                    >
                      {editingUser ? 'Lưu thay đổi' : 'Thêm tài khoản'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </ModalPortal>
        )}
      </AnimatePresence>
    </div>
  );
}

export default UserAccountManagement;