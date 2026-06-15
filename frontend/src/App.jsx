import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import API_URL from './api';
import axios from 'axios';
import AdminDashboard from './components/admin/AdminDashboard';
import StudentDashboard from './components/students/StudentDashboard';
import TeacherDashboard from './components/teacher/TeacherDashboard';
import ResetPassword from './components/ResetPassword';
import ChangePasswordModal from './components/ChangePasswordModal';
import LoginForm from './components/LoginForm';

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
  const [sessionTimeout, setSessionTimeout] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

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
        <ChangePasswordModal
          show={showChangePassword}
          onClose={() => {
            setShowChangePassword(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setMessage({ type: '', text: '' });
          }}
          onSubmit={handleChangePassword}
          currentPassword={currentPassword}
          setCurrentPassword={setCurrentPassword}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          loading={changePasswordLoading}
          message={message}
        />
      </>
    );
  }

  // Show StudentDashboard for student users
  if (loggedInUser && loggedInUser.role === 'student') {
    return (
      <>
        <StudentDashboard user={loggedInUser} onLogout={handleLogout} />
        <ChangePasswordModal
          show={showChangePassword}
          onClose={() => {
            setShowChangePassword(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setMessage({ type: '', text: '' });
          }}
          onSubmit={handleChangePassword}
          currentPassword={currentPassword}
          setCurrentPassword={setCurrentPassword}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          loading={changePasswordLoading}
          message={message}
        />
      </>
    );
  }

  // Show TeacherDashboard for teacher users
  if (loggedInUser && loggedInUser.role === 'teacher') {
    return (
      <>
        <TeacherDashboard user={loggedInUser} onLogout={handleLogout} />
        <ChangePasswordModal
          show={showChangePassword}
          onClose={() => {
            setShowChangePassword(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setMessage({ type: '', text: '' });
          }}
          onSubmit={handleChangePassword}
          currentPassword={currentPassword}
          setCurrentPassword={setCurrentPassword}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          loading={changePasswordLoading}
          message={message}
        />
      </>
    );
  }

  return (
    <Routes>
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route
        path="*"
        element={
          !loggedInUser ? (
            <LoginForm
              username={username}
              setUsername={setUsername}
              password={password}
              setPassword={setPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              rememberMe={rememberMe}
              setRememberMe={setRememberMe}
              savedAccounts={savedAccounts}
              showAccountList={showAccountList}
              setShowAccountList={setShowAccountList}
              loading={loading}
              message={message}
              showForgotPassword={showForgotPassword}
              setShowForgotPassword={setShowForgotPassword}
              forgotEmail={forgotEmail}
              setForgotEmail={setForgotEmail}
              forgotLoading={forgotLoading}
              handleLogin={handleLogin}
              handleForgotPassword={handleForgotPassword}
              handleSelectAccount={handleSelectAccount}
              handleRemoveAccount={handleRemoveAccount}
            />
          ) : null
        }
      />
    </Routes>
  );
}

export default App;
