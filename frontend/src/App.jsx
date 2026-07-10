import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import API_URL from './api';
import axios from 'axios';
import AdminDashboard from './components/admin/AdminDashboard';
import StudentDashboard from './components/student/StudentDashboard';
import TeacherDashboard from './components/teacher/TeacherDashboard';
import TeacherExamDashboard from './components/teacher/TeacherExamDashboard';
import ResetPassword from './components/auth/ResetPassword';
import LoginForm from './components/auth/LoginForm';
import StudentWaitRoom from './components/student/StudentWaitRoom';
import StudentExamAttempt from './components/student/StudentExamAttempt';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, LogIn } from 'lucide-react';

const DASHBOARD_MAP = {
  admin: AdminDashboard,
  student: StudentDashboard,
  teacher: TeacherDashboard,
};

function App() {
  const getSavedAccounts = () => {
    try {
      return JSON.parse(localStorage.getItem('savedAccounts') || '[]');
    } catch {
      return [];
    }
  };

  const [username, setUsername] = useState(() => {
    return localStorage.getItem('rememberedUsername') || '';
  });
  const [password, setPassword] = useState(() => {
    const savedPassword = localStorage.getItem('rememberedPassword') || '';
    if (savedPassword) {
      try {
        return atob(savedPassword);
      } catch {
        return savedPassword;
      }
    }
    return '';
  });
  const [rememberMe, setRememberMe] = useState(() => {
    return !!localStorage.getItem('rememberedUsername');
  });
  const [savedAccounts, setSavedAccounts] = useState(getSavedAccounts);
  const [showAccountList, setShowAccountList] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const showForgotPassword = location.pathname === '/forgot-password';
  const setShowForgotPassword = (val) => {
    if (val) {
      navigate('/forgot-password');
    } else {
      navigate(-1);
    }
  };
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(() => {
    const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || sessionStorage.getItem('token') || null;
  });
  const [sessionTimeout, setSessionTimeout] = useState(null);
  
  // State quản lý thông báo UI khi bị khóa tài khoản
  const [lockedAccountInfo, setLockedAccountInfo] = useState(null);

  useEffect(() => {
    if (!loggedInUser) {
      const path = location.pathname;
      const hash = location.hash;
      const isResetPassword = path.startsWith('/reset-password/');
      const isForgotPassword = path === '/forgot-password';
      const isRoot = path === '/' || path === '';

      if (!isRoot && !isResetPassword && !isForgotPassword) {
        navigate('/', { replace: true });
      } else if (hash && !isResetPassword && !isForgotPassword) {
        window.history.replaceState(null, '', '/');
      }
    }
  }, [loggedInUser, location.pathname, location.hash, navigate]);

  // Thêm mới: Polling kiểm tra trạng thái khóa tài khoản thời gian thực (mỗi 3 giây)
  useEffect(() => {
    let intervalId;
    if (loggedInUser && token) {
      intervalId = setInterval(async () => {
        try {
          await axios.get(`${API_URL}/api/verify-token`);
        } catch (error) {
          // Lỗi 403 sẽ được xử lý tự động ở interceptor trong main.jsx
          if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('user');
            window.location.reload();
          }
        }
      }, 60000); // Tăng lên 60 giây (60000ms) để tránh spam API và tốn Vercel Functions
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [loggedInUser, token]);

  // Lắng nghe sự kiện forceLogout từ main.jsx để hiển thị Modal xịn xò
  useEffect(() => {
    const handleForceLogout = (e) => {
      // Chỉ hiển thị thông báo, không clear token ngay lập tức
      // để người dùng vẫn thấy giao diện phía sau mờ mờ cho đến khi bấm nút
      if (!lockedAccountInfo) {
        setLockedAccountInfo(e.detail.message);
      }
    };

    window.addEventListener('forceLogout', handleForceLogout);
    return () => window.removeEventListener('forceLogout', handleForceLogout);
  }, [lockedAccountInfo]);

  const handleSelectAccount = (acc) => {
    setUsername(acc.username);
    let decodedPwd = '';
    if (acc.password) {
      try {
        decodedPwd = atob(acc.password);
      } catch {
        decodedPwd = acc.password;
      }
    }
    setPassword(decodedPwd);
    setRememberMe(true);
    setShowAccountList(false);
    setMessage({ type: 'info', text: 'Đã tự động điền thông tin tài khoản đã lưu.' });
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

    const cleanUsername = username.replace(/\s/g, '');
    const cleanPassword = password.replace(/\s/g, '');

    setUsername(cleanUsername);
    setPassword(cleanPassword);

    if (!cleanUsername) {
      setMessage({ type: 'error', text: 'Vui lòng nhập tên đăng nhập!' });
      setLoading(false);
      return;
    }
    if (!cleanPassword) {
      setMessage({ type: 'error', text: 'Vui lòng nhập mật khẩu!' });
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/login`, {
        username: cleanUsername,
        password: cleanPassword
      });

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: response.data.message
        });

        const storage = rememberMe ? localStorage : sessionStorage;

        if (response.data.token) {
          storage.setItem('token', response.data.token);
          setToken(response.data.token);
        }

        storage.setItem('user', JSON.stringify(response.data.user));
        setLoggedInUser(response.data.user);

        if (rememberMe) {
          localStorage.setItem('rememberedUsername', cleanUsername);
          try {
            localStorage.setItem('rememberedPassword', btoa(cleanPassword));
          } catch {
            localStorage.setItem('rememberedPassword', cleanPassword);
          }

          let encodedPwd = '';
          try {
            encodedPwd = btoa(cleanPassword);
          } catch {
            encodedPwd = cleanPassword;
          }

          const accounts = getSavedAccounts().filter(acc => acc.username !== cleanUsername);
          accounts.unshift({
            username: cleanUsername,
            password: encodedPwd,
            role: response.data.user.role,
            tenQuyen: response.data.user.tenQuyen
          });
          const trimmed = accounts.slice(0, 5);
          localStorage.setItem('savedAccounts', JSON.stringify(trimmed));
          setSavedAccounts(trimmed);
        } else {
          localStorage.removeItem('rememberedUsername');
          localStorage.removeItem('rememberedPassword');
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
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setToken(null);
    setLoggedInUser(null);

    // Clear URL hash to avoid back button issues with leftover hashes
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    const remembered = localStorage.getItem('rememberedUsername') || '';
    const rememberedPwd = localStorage.getItem('rememberedPassword') || '';
    let decodedPwd = '';
    if (rememberedPwd) {
      try {
        decodedPwd = atob(rememberedPwd);
      } catch {
        decodedPwd = rememberedPwd;
      }
    }
    setUsername(remembered);
    setPassword(decodedPwd);
    setRememberMe(!!remembered);
    setMessage({ type: '', text: '' });
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setMessage({ type: '', text: '' });

    const trimmedEmail = forgotEmail.trim();
    setForgotEmail(trimmedEmail);

    if (!trimmedEmail) {
      setMessage({ type: 'error', text: 'Vui lòng nhập email!' });
      setForgotLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setMessage({ type: 'error', text: 'Email không đúng định dạng!' });
      setForgotLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/forgot-password`, {
        email: trimmedEmail
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
    const isTeacherExamDashboard = location.pathname.startsWith('/teacher/online-exams/dashboard/');
    if (isTeacherExamDashboard && (loggedInUser.role === 'teacher' || loggedInUser.role === 'admin')) {
      const parts = location.pathname.split('/');
      const id = parts[parts.length - 1];
      return <TeacherExamDashboard id={id} />;
    }

    // Các Route riêng biệt dành cho sinh viên tham gia thi trực tuyến
    const isStudentWaitRoom = location.pathname.match(/^\/student\/online-exams\/\d+\/wait$/);
    if (isStudentWaitRoom && loggedInUser.role === 'student') {
      return <StudentWaitRoom />;
    }

    const isStudentAttempt = location.pathname.match(/^\/student\/online-exams\/attempt\/\d+$/);
    if (isStudentAttempt && loggedInUser.role === 'student') {
      return <StudentExamAttempt />;
    }

    const DashboardComponent = DASHBOARD_MAP[loggedInUser.role];
    if (DashboardComponent) {
      return (
        <>
          <DashboardComponent user={loggedInUser} onLogout={handleLogout} />
          {/* Giao diện hiện đại thông báo khóa tài khoản */}
          <AnimatePresence>
            {lockedAccountInfo && (
              <div className="fixed inset-0 flex items-center justify-center z-[999999] p-4 bg-black/60 backdrop-blur-md">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-[#FFFFFF] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col border border-red-100"
                >
                  <div className="bg-gradient-to-r from-red-500 to-rose-600 px-8 py-10 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_white_0%,_transparent_100%)]"></div>
                    <div className="bg-white/40 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10 backdrop-blur-sm border border-white/30 shadow-inner">
                      <ShieldAlert className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-white relative z-10 tracking-wide">TÀI KHOẢN BỊ KHÓA</h2>
                  </div>
                  <div className="p-8 text-center bg-[#FFFFFF] space-y-6">
                    <div className="bg-[#EF4444]/10 text-red-700 p-5 rounded-2xl border border-red-100 text-sm font-semibold leading-relaxed shadow-sm">
                      {lockedAccountInfo}
                    </div>
                    <button
                      onClick={() => {
                        setLockedAccountInfo(null);
                        // Thực hiện clear token và logout TẠI ĐÂY sau khi người dùng xác nhận
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        sessionStorage.removeItem('token');
                        sessionStorage.removeItem('user');
                        setToken(null);
                        setLoggedInUser(null);
                      }}
                      className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                      <LogIn className="w-5 h-5" />
                      Xác nhận và quay lại đăng nhập
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      );
    }
  }

  return (
    <>
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
                setMessage={setMessage}
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

      {/* Giao diện hiện đại thông báo khóa tài khoản */}
      <AnimatePresence>
        {lockedAccountInfo && (
          <div className="fixed inset-0 flex items-center justify-center z-[999999] p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#FFFFFF] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col border border-red-100"
            >
              <div className="bg-gradient-to-r from-red-500 to-rose-600 px-8 py-10 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_white_0%,_transparent_100%)]"></div>
                <div className="bg-white/40 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10 backdrop-blur-sm border border-white/30 shadow-inner">
                  <ShieldAlert className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-black text-white relative z-10 tracking-wide">TÀI KHOẢN BỊ KHÓA</h2>
              </div>
              <div className="p-8 text-center bg-[#FFFFFF] space-y-6">
                <div className="bg-[#EF4444]/10 text-red-700 p-5 rounded-2xl border border-red-100 text-sm font-semibold leading-relaxed shadow-sm">
                  {lockedAccountInfo}
                </div>
                <button
                  onClick={() => {
                    setLockedAccountInfo(null);
                    // Thực hiện clear token và logout TẠI ĐÂY sau khi người dùng xác nhận
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    sessionStorage.removeItem('token');
                    sessionStorage.removeItem('user');
                    setToken(null);
                    setLoggedInUser(null);
                  }}
                  className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  <LogIn className="w-5 h-5" />
                  Xác nhận và quay lại đăng nhập
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default App;
