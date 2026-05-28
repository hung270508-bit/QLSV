import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserCircle, Plus, Edit, Trash2, Search, X, Filter, XCircle, Key, Lock, Unlock, CheckCircle, XCircle as XCircleIcon } from 'lucide-react';
import axios from 'axios';

function UserAccountManagement() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [displaySearchTerm, setDisplaySearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    roleFilter: ''
  });
  const [displayFilters, setDisplayFilters] = useState({
    roleFilter: ''
  });
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [formData, setFormData] = useState({
    TaiKhoan: '',
    password: '',
    MaQuyen: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/users'),
        axios.get('http://localhost:5000/api/roles')
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await axios.put(`http://localhost:5000/api/users/${editingUser.TaiKhoan}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/users', formData);
      }
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Lỗi khi lưu tài khoản!');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      TaiKhoan: user.TaiKhoan,
      password: user.password,
      MaQuyen: user.MaQuyen
    });
    setShowModal(true);
  };

  const handleDelete = async (taiKhoan) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
      try {
        await axios.delete(`http://localhost:5000/api/users/${taiKhoan}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Lỗi khi xóa tài khoản!');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      TaiKhoan: '',
      password: '',
      MaQuyen: ''
    });
  };

  const handleResetPassword = (user) => {
    setSelectedUserForReset(user);
    setShowResetPasswordModal(true);
    setNewPassword('');
  };

  const handleCloseResetPasswordModal = () => {
    setShowResetPasswordModal(false);
    setSelectedUserForReset(null);
    setNewPassword('');
  };

  const handleResetPasswordSubmit = async () => {
    if (!newPassword) {
      alert('Vui lòng nhập mật khẩu mới!');
      return;
    }

    try {
      await axios.put(`http://localhost:5000/api/users/${selectedUserForReset.TaiKhoan}/reset-password`, { password: newPassword });
      fetchData();
      handleCloseResetPasswordModal();
      alert('Đặt lại mật khẩu thành công!');
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Lỗi khi đặt lại mật khẩu!');
    }
  };

  const handleToggleLock = async (user) => {
    try {
      const newStatus = user.TrangThai === 'Hoạt động' ? 'Khóa' : 'Hoạt động';
      await axios.put(`http://localhost:5000/api/users/${user.TaiKhoan}/status`, { TrangThai: newStatus });
      fetchData();
    } catch (error) {
      console.error('Error toggling lock status:', error);
      alert('Lỗi khi thay đổi trạng thái!');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.TaiKhoan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.TenQuyen?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = !filters.roleFilter || user.MaQuyen === parseInt(filters.roleFilter);
    
    return matchesSearch && matchesRole;
  });

  const handleSearch = () => {
    setSearchTerm(displaySearchTerm);
  };

  const handleApplyFilters = () => {
    setFilters({ ...displayFilters });
    setShowFilters(false);
  };


  const clearFilters = () => {
    setFilters({ roleFilter: '' });
    setDisplayFilters({ roleFilter: '' });
    setSearchTerm('');
    setDisplaySearchTerm('');
  };

  const activeFilterCount = (filters.roleFilter ? 1 : 0) + (searchTerm ? 1 : 0);
  const hasActiveFilters = filters.roleFilter || searchTerm;

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Quản lý tài khoản</h2>
          <p className="text-gray-500">Thêm, sửa, xóa tài khoản người dùng</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          Thêm tài khoản
        </motion.button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="relative w-1/2">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm tài khoản..."
              value={displaySearchTerm}
              onChange={(e) => setDisplaySearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                hasActiveFilters ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Filter className="w-5 h-5" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSearch}
            className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-xl shadow-lg transition-all"
          >
            <Search className="w-5 h-5" />
            Tìm kiếm
          </motion.button>
          {hasActiveFilters && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearFilters}
              className="px-4 py-3 bg-red-100 text-red-600 rounded-xl font-semibold hover:bg-red-200 transition-colors flex items-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              Xóa bộ lọc
            </motion.button>
          )}
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-gray-50 rounded-xl p-4 space-y-4 relative z-50 w-1/2"
          >
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Lọc theo quyền</label>
              <select
                value={displayFilters.roleFilter}
                onChange={(e) => setDisplayFilters({ ...displayFilters, roleFilter: e.target.value })}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
              >
                <option value="">Tất cả quyền</option>
                {roles.map((role) => (
                  <option key={role.MaQuyen} value={role.MaQuyen}>
                    {role.TenQuyen}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleApplyFilters}
                className="flex-1 bg-orange-500 text-white py-2 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
              >
                Áp dụng lọc
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setDisplayFilters({ roleFilter: '' })}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Đặt lại
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Tài khoản</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Quyền</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Trạng thái</th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.TaiKhoan}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-6 text-sm font-medium text-gray-800">{user.TaiKhoan}</td>
                    <td className="py-4 px-6 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.MaQuyen)}`}>
                        {user.TenQuyen || 'N/A'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                        user.TrangThai === 'Hoạt động' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {user.TrangThai === 'Hoạt động' ? <CheckCircle className="w-3 h-3" /> : <XCircleIcon className="w-3 h-3" />}
                        {user.TrangThai || 'Hoạt động'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleResetPassword(user)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Đặt lại mật khẩu"
                        >
                          <Key className="w-4 h-4" />
                        </motion.button>
                        {user.TaiKhoan !== 'admin' && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleToggleLock(user)}
                            className={`p-2 rounded-lg hover:opacity-80 transition-colors ${
                              user.TrangThai === 'Hoạt động' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
                            }`}
                            title={user.TrangThai === 'Hoạt động' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          >
                            {user.TrangThai === 'Hoạt động' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEdit(user)}
                          className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        {user.TaiKhoan !== 'admin' && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(user.TaiKhoan)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {editingUser ? 'Cập nhật tài khoản' : 'Thêm tài khoản mới'}
              </h3>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </motion.button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tài khoản</label>
                <input
                  type="text"
                  value={formData.TaiKhoan}
                  onChange={(e) => setFormData({ ...formData, TaiKhoan: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  required
                  disabled={!!editingUser}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quyền</label>
                <select
                  value={formData.MaQuyen}
                  onChange={(e) => setFormData({ ...formData, MaQuyen: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  required
                >
                  <option value="">Chọn quyền</option>
                  {roles.map((role) => (
                    <option key={role.MaQuyen} value={role.MaQuyen}>
                      {role.TenQuyen}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all"
                >
                  {editingUser ? 'Cập nhật' : 'Thêm mới'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Hủy
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && selectedUserForReset && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Đặt lại mật khẩu</h3>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleCloseResetPasswordModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </motion.button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Đặt lại mật khẩu cho tài khoản: <span className="font-semibold text-gray-800">{selectedUserForReset.TaiKhoan}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu mới</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleResetPasswordSubmit}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold shadow-lg transition-all"
                >
                  Đặt lại mật khẩu
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCloseResetPasswordModal}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Hủy
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default UserAccountManagement;
