import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import API_URL from './api';
import axios from 'axios';
import AdminDashboard from './components/admin/AdminDashboard';
import StudentDashboard from './components/students/StudentDashboard';
import TeacherDashboard from './components/teacher/TeacherDashboard';
import ResetPassword from './components/ResetPassword';
import LoginForm from './components/LoginForm';

const DASHBOARD_MAP = {
  admin: AdminDashboard,
  student: StudentDashboard,
  teacher: TeacherDashboard,
};

function App() {
  const getSavedAccounts = () => {
    try {
      const accounts = JSON.parse(localStorage.getItem('savedAccounts') || '[]');
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

  const handleSelectAccount = (acc) => {
    setUsername(acc.username);
    setPassword('');
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

        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          setToken(response.data.token);
        }

        localStorage.setItem('user', JSON.stringify(response.data.user));
        setLoggedInUser(response.data.user);

        if (rememberMe) {
          const accounts = getSavedAccounts().filter(acc => acc.username !== username);
          accounts.unshift({ username, role: response.data.user.role, tenQuyen: response.data.user.tenQuyen });
          const trimmed = accounts.slice(0, 5);
          localStorage.setItem('savedAccounts', JSON.stringify(trimmed));
          setSavedAccounts(trimmed);
        }

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

  const handleLogout = () => {
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
      setSessionTimeout(null);
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setLoggedInUser(null);
    setUsername('');
    setPassword('');
    setMessage({ type: '', text: '' });
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setMessage({ type: '', text: '' });

    if (!forgotEmail) {
      setMessage({ type: 'error', text: 'Vui lòng nhập email!' });
      setForgotLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail)) {
      setMessage({ type: 'error', text: 'Email không đúng định dạng!' });
      setForgotLoading(false);
      return;
    }

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

  // Render the appropriate dashboard based on role using a single lookup
  if (loggedInUser) {
    const DashboardComponent = DASHBOARD_MAP[loggedInUser.role];
    if (DashboardComponent) {
      return <DashboardComponent user={loggedInUser} onLogout={handleLogout} />;
    }
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
