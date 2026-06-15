import React, { useState } from 'react';
import API_URL from './api';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, GraduationCap, School, ShieldAlert, Loader2, Eye, EyeOff, Mail, ChevronDown, X } from 'lucide-react';
import axios from 'axios';
import AdminDashboard from './components/admin/AdminDashboard';
import StudentDashboard from './components/students/StudentDashboard';
import TeacherDashboard from './components/teacher/TeacherDashboard';

function App() {
  const getSavedAccounts = () => {
    try {
      const accounts = JSON.parse(localStorage.getItem('savedAccounts') || '[]');
      // Clean up old accounts that still have passwords stored (security fix)
      const cleanedAccounts = accounts.map(acc => {
        const { password, ...rest } = acc;
        return rest;
      });
      if (JSON.stringify(accounts) !== JSON.stringify(cleanedAccounts)) {
        localStorage.setItem('savedAccounts', JSON.stringify(cleanedAccounts));
      }
      return cleanedAccounts;
    } catch {
      return [];
    }
  };
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [savedAccounts, setSavedAccounts] = useState(getSavedAccounts);
  const [showAccountList, setShowAccountList] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || null;
  });
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, message: '' });
  const [sessionTimeout, setSessionTimeout] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [newPasswordStrength, setNewPasswordStrength] = useState({ score: 0, message: '' });

  const handleSelectAccount = (acc) => {
    setUsername(acc.username);
    setPassword(''); // Security: Don't auto-fill password from localStorage
    setShowAccountList(false);
    setMessage({ type: 'info', text: 'Vui lòng nhập mật khẩu cho tài khoản đã lưu.' });
  };

  const handleRemoveAccount = (e, accUsername) => {
    e.stopPropagation();
    const accounts = getSavedAccounts().filter(acc => acc.username !== accUsername);
    localStorage.setItem('savedAccounts', JSON.stringify(accounts));
    setSavedAccounts(accounts);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Form validation
    if (!username.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập tên đăng nhập!' });
      setLoading(false);
      return;
    }
    if (!password) {
      setMessage({ type: 'error', text: 'Vui lòng nhập mật khẩu!' });
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/login`, {
        username,
        password
      });

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: response.data.message
      });

      // Save JWT token
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        setToken(response.data.token);
      }

      // Save user data
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setLoggedInUser(response.data.user);

      // Save only username (not password) for convenience
      if (rememberMe) {
        const accounts = getSavedAccounts().filter(acc => acc.username !== username);
        accounts.unshift({ username, role: response.data.user.role, tenQuyen: response.data.user.tenQuyen });
        const trimmed = accounts.slice(0, 5);
        localStorage.setItem('savedAccounts', JSON.stringify(trimmed));
        setSavedAccounts(trimmed);
      }

      // Set session timeout (24 hours)
      const timeoutId = setTimeout(() => {
        handleLogout();
        setMessage({ type: 'info', text: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
      }, 24 * 60 * 60 * 1000);
      setSessionTimeout(timeoutId);
    }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Không thể kết nối đến server!';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const renderRoleBadge = (role) => {
    switch (role) {
      case 'admin': return { label: 'Quản trị viên', icon: <ShieldAlert className="w-16 h-16 text-red-500" />, color: 'bg-red-100 text-red-700' };
      case 'teacher': return { label: 'Giảng viên', icon: <School className="w-16 h-16 text-orange-500" />, color: 'bg-orange-100 text-orange-700' };
      case 'student': return { label: 'Sinh viên', icon: <GraduationCap className="w-16 h-16 text-amber-500" />, color: 'bg-amber-100 text-amber-700' };
      default: return { label: 'Người dùng', icon: <User className="w-16 h-16 text-gray-500" />, color: 'bg-gray-100 text-gray-700' };
    }
  };

  const handleLogout = () => {
    // Clear session timeout
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
      setSessionTimeout(null);
    }

    // Clear token and user data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setLoggedInUser(null);
    setUsername('');
    setPassword('');
    setMessage({ type: '', text: '' });
  };

  const checkPasswordStrength = (password) => {
    let score = 0;
    let message = '';

    if (password.length === 0) {
      return { score: 0, message: '' };
    }

    if (password.length < 6) {
      return { score: 1, message: 'Mật khẩu quá yếu' };
    }

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    if (score <= 2) message = 'Mật khẩu yếu';
    else if (score <= 4) message = 'Mật khẩu trung bình';
    else if (score <= 5) message = 'Mật khẩu mạnh';
    else message = 'Mật khẩu rất mạnh';

    return { score, message };
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(checkPasswordStrength(newPassword));
  };

  const handleNewPasswordChange = (e) => {
    const newPass = e.target.value;
    setNewPassword(newPass);
    setNewPasswordStrength(checkPasswordStrength(newPass));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangePasswordLoading(true);
    setMessage({ type: '', text: '' });

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ thông tin!' });
      setChangePasswordLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu mới không khớp!' });
      setChangePasswordLoading(false);
      return;
    }

    if (newPasswordStrength.score < 3) {
      setMessage({ type: 'error', text: 'Mật khẩu mới quá yếu!' });
      setChangePasswordLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/change-password`,
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setMessage({ type: 'success', text: response.data.message });
        setShowChangePassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setNewPasswordStrength({ score: 0, message: '' });
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Không thể kết nối đến server!';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.post(`${API_URL}/api/forgot-password`, {
        email: forgotEmail
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: response.data.message });
        setForgotEmail('');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Không thể kết nối đến server!';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setForgotLoading(false);
    }
  };

  // Show AdminDashboard for admin users
  if (loggedInUser && loggedInUser.role === 'admin') {
    return (
      <>
        <AdminDashboard user={loggedInUser} onLogout={handleLogout} />
        {showChangePassword && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Đổi Mật Khẩu</h3>
              {message.text && (
                <div className={`p-4 rounded-xl text-sm mb-4 text-center font-medium ${
                  message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-200' : 
                  message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' :
                  'bg-blue-50 text-blue-600 border border-blue-200'
                }`}>
                  {message.text}
                </div>
              )}
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu mới</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={handleNewPasswordChange}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    required
                  />
                  {newPasswordStrength.message && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${(newPasswordStrength.score / 6) * 100}%` }}
                          className={`h-full transition-colors ${
                            newPasswordStrength.score <= 2 ? 'bg-red-500' :
                            newPasswordStrength.score <= 4 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        newPasswordStrength.score <= 2 ? 'text-red-500' :
                        newPasswordStrength.score <= 4 ? 'text-yellow-500' :
                        'text-green-500'
                      }`}>
                        {newPasswordStrength.message}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangePassword(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setNewPasswordStrength({ score: 0, message: '' });
                      setMessage({ type: '', text: '' });
                    }}
                    className="flex-1 py-3 text-gray-600 font-semibold rounded-xl border-2 border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={changePasswordLoading}
                    className="flex-1 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {changePasswordLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </>
    );
  }

  // Show StudentDashboard for student users
  if (loggedInUser && loggedInUser.role === 'student') {
    return (
      <>
        <StudentDashboard user={loggedInUser} onLogout={handleLogout} />
        {showChangePassword && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Đổi Mật Khẩu</h3>
              {message.text && (
                <div className={`p-4 rounded-xl text-sm mb-4 text-center font-medium ${
                  message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-200' : 
                  message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' :
                  'bg-blue-50 text-blue-600 border border-blue-200'
                }`}>
                  {message.text}
                </div>
              )}
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu mới</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={handleNewPasswordChange}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    required
                  />
                  {newPasswordStrength.message && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${(newPasswordStrength.score / 6) * 100}%` }}
                          className={`h-full transition-colors ${
                            newPasswordStrength.score <= 2 ? 'bg-red-500' :
                            newPasswordStrength.score <= 4 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        newPasswordStrength.score <= 2 ? 'text-red-500' :
                        newPasswordStrength.score <= 4 ? 'text-yellow-500' :
                        'text-green-500'
                      }`}>
                        {newPasswordStrength.message}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangePassword(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setNewPasswordStrength({ score: 0, message: '' });
                      setMessage({ type: '', text: '' });
                    }}
                    className="flex-1 py-3 text-gray-600 font-semibold rounded-xl border-2 border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={changePasswordLoading}
                    className="flex-1 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {changePasswordLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </>
    );
  }

  // Show TeacherDashboard for teacher users
  if (loggedInUser && loggedInUser.role === 'teacher') {
    return (
      <>
        <TeacherDashboard user={loggedInUser} onLogout={handleLogout} />
        {showChangePassword && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Đổi Mật Khẩu</h3>
              {message.text && (
                <div className={`p-4 rounded-xl text-sm mb-4 text-center font-medium ${
                  message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-200' : 
                  message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' :
                  'bg-blue-50 text-blue-600 border border-blue-200'
                }`}>
                  {message.text}
                </div>
              )}
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu mới</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={handleNewPasswordChange}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    required
                  />
                  {newPasswordStrength.message && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${(newPasswordStrength.score / 6) * 100}%` }}
                          className={`h-full transition-colors ${
                            newPasswordStrength.score <= 2 ? 'bg-red-500' :
                            newPasswordStrength.score <= 4 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        newPasswordStrength.score <= 2 ? 'text-red-500' :
                        newPasswordStrength.score <= 4 ? 'text-yellow-500' :
                        'text-green-500'
                      }`}>
                        {newPasswordStrength.message}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangePassword(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setNewPasswordStrength({ score: 0, message: '' });
                      setMessage({ type: '', text: '' });
                    }}
                    className="flex-1 py-3 text-gray-600 font-semibold rounded-xl border-2 border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={changePasswordLoading}
                    className="flex-1 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {changePasswordLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100 p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-20 left-20 w-64 h-64 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          rotate: [90, 0, 90],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute bottom-20 right-20 w-64 h-64 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
      />

      <AnimatePresence mode="wait">
        
        {!loggedInUser ? (
          <motion.div
            key="login-form"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl shadow-orange-200/50 border border-orange-100 relative z-10"
          >
            <div className="text-center mb-8">
              <motion.div 
                initial={{ scale: 0.8, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                className="inline-flex p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl text-white mb-4 shadow-xl shadow-orange-300"
              >
                <School className="w-10 h-10" />
              </motion.div>
              <h2 className="text-3xl font-bold text-gray-800">Hệ Thống Quản Lý</h2>
              <p className="text-gray-400 text-sm mt-2">Vui lòng đăng nhập để tiếp tục</p>
            </div>

            {message.text && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={`p-4 rounded-xl text-sm mb-6 text-center font-medium ${
                  message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-200' : 
                  message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' :
                  'bg-blue-50 text-blue-600 border border-blue-200'
                }`}
              >
                {message.text}
              </motion.div>
            )}

            {!showForgotPassword ? (
              <form onSubmit={handleLogin} className="space-y-5">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mã số tài khoản</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onFocus={() => savedAccounts.length > 0 && setShowAccountList(true)}
                      className="w-full pl-12 pr-10 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-orange-500 focus:bg-white transition-all duration-300 text-gray-700 group-hover:border-gray-300"
                      placeholder="Nhập MSSV hoặc Mã GV..."
                      required
                    />
                    {savedAccounts.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowAccountList(!showAccountList)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <ChevronDown className={`w-5 h-5 transition-transform ${showAccountList ? 'rotate-180' : ''}`} />
                      </button>
                    )}

                    {showAccountList && savedAccounts.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute left-0 right-0 mt-2 bg-white border-2 border-orange-100 rounded-2xl shadow-xl z-20 overflow-hidden"
                      >
                        {savedAccounts.map((acc) => (
                          <div
                            key={acc.username}
                            onClick={() => handleSelectAccount(acc)}
                            className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-orange-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4" />
                              </div>
                              <div className="text-left overflow-hidden">
                                <div className="font-semibold text-gray-700 text-sm truncate">{acc.username}</div>
                                <div className="text-xs text-gray-400 truncate">{acc.tenQuyen || acc.role || 'Tài khoản'}</div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => handleRemoveAccount(e, acc.username)}
                              className="p-1.5 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={handlePasswordChange}
                      className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-orange-500 focus:bg-white transition-all duration-300 text-gray-700 group-hover:border-gray-300"
                      placeholder="Nhập mật khẩu..."
                      required
                    />
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </motion.button>
                  </div>
                  {passwordStrength.message && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 flex items-center gap-2"
                    >
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                          className={`h-full transition-colors ${
                            passwordStrength.score <= 2 ? 'bg-red-500' :
                            passwordStrength.score <= 4 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        passwordStrength.score <= 2 ? 'text-red-500' :
                        passwordStrength.score <= 4 ? 'text-yellow-500' :
                        'text-green-500'
                      }`}>
                        {passwordStrength.message}
                      </span>
                    </motion.div>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center justify-between"
                >
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400 cursor-pointer"
                    />
                    Lưu thông tin đăng nhập
                  </label>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowForgotPassword(true);
                      setMessage({ type: '', text: '' });
                    }}
                    className="text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors"
                  >
                    Quên mật khẩu?
                  </motion.button>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.02, boxShadow: "0 10px 40px -10px rgba(249, 115, 22, 0.5)" }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-300 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Đăng Nhập
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <User className="w-5 h-5" />
                      </motion.div>
                    </>
                  )}
                </motion.button>
              </form>
            ) : (
              <motion.form
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handleForgotPassword}
                className="space-y-5"
              >
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-orange-500 focus:bg-white transition-all duration-300 text-gray-700 group-hover:border-gray-300"
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ scale: 1.02, boxShadow: "0 10px 40px -10px rgba(249, 115, 22, 0.5)" }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-300 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {forgotLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Gửi liên kết đặt lại mật khẩu'
                  )}
                </motion.button>

                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setMessage({ type: '', text: '' });
                  }}
                  className="w-full py-3 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
                >
                  ← Quay lại đăng nhập
                </motion.button>
              </motion.form>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="dashboard-mock"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl border border-orange-100 text-center"
          >
            <div className="flex justify-center mb-4">
              <motion.div
                initial={{ rotate: -10, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              >
                {renderRoleBadge(loggedInUser.role).icon}
              </motion.div>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-800">
              Xin chào, {loggedInUser.username}!
            </h1>
            <p className="text-gray-400 text-sm mt-1">Bạn đã đăng nhập thành công vào hệ thống.</p>
            
            <div className="my-6 inline-block">
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${renderRoleBadge(loggedInUser.role).color}`}>
                Quyền: {loggedInUser.tenQuyen || renderRoleBadge(loggedInUser.role).label}
              </span>
            </div>

            <div className="p-4 bg-orange-50 rounded-xl text-left text-sm text-gray-600 space-y-2 mb-6">
              <p><strong>Mã tài khoản:</strong> {loggedInUser.id}</p>
              <p><strong>Trạng thái phân trang:</strong> Giao diện dành riêng cho <span className="font-semibold text-orange-600">{loggedInUser.tenQuyen || renderRoleBadge(loggedInUser.role).label}</span> đã sẵn sàng tải.</p>
            </div>

            <button
              onClick={handleLogout}
              className="text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors underline bg-transparent border-none cursor-pointer"
            >
              Đăng xuất khỏi tài khoản
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

export default App;