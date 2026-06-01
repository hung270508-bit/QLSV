import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, GraduationCap, School, ShieldAlert, Loader2, Eye, EyeOff, Mail } from 'lucide-react';
import axios from 'axios';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/student/StudentDashboard'; 
import TeacherDashboard from './components/teacher/TeacherDashboard'; 

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.post('http://localhost:5000/api/login', {
        username,
        password
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: response.data.message });
        setLoggedInUser(response.data.user);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Không thể kết nối đến server!';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const renderRoleBadge = (role) => {
    const safeRole = role ? role.toLowerCase() : '';
    switch (safeRole) {
      case 'admin': 
      case 'quantri':
        return { label: 'Quản trị viên', icon: <ShieldAlert className="w-16 h-16 text-red-500" />, color: 'bg-red-100 text-red-700' };
      case 'teacher': 
      case 'giangvien':
        return { label: 'Giảng viên', icon: <School className="w-16 h-16 text-orange-500" />, color: 'bg-orange-100 text-orange-700' };
      case 'student': 
      case 'sinhvien':
        return { label: 'Sinh viên', icon: <GraduationCap className="w-16 h-16 text-amber-500" />, color: 'bg-amber-100 text-amber-700' };
      default: 
        return { label: 'Người dùng', icon: <User className="w-16 h-16 text-gray-500" />, color: 'bg-gray-100 text-gray-700' };
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setUsername('');
    setPassword('');
    setMessage({ type: '', text: '' });
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.post('http://localhost:5000/api/forgot-password', {
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

  // PHÂN LUỒNG GIAO DIỆN CHÍNH Ở ĐÂY
  if (loggedInUser) {
    // Chuyển role về chữ thường để tránh lỗi do API trả về chữ in hoa (vd: 'SinhVien' -> 'sinhvien')
    const currentRole = loggedInUser.role ? loggedInUser.role.toLowerCase() : '';

    switch (currentRole) {
      case 'admin':
      case 'quantri':
        return <AdminDashboard user={loggedInUser} onLogout={handleLogout} />;
      
      case 'student': 
      case 'sinhvien': // Bắt luôn trường hợp API trả về 'sinhvien'
        return <StudentDashboard user={loggedInUser} onLogout={handleLogout} />;
        
      case 'teacher':
      case 'giangvien': // Bắt luôn trường hợp API trả về 'giangvien'
        return <TeacherDashboard user={loggedInUser} onLogout={handleLogout} />;
        
      default:
        // Nếu role không khớp bất kỳ case nào ở trên, nó sẽ thoát switch và chạy xuống giao diện báo lỗi bên dưới
        break; 
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100 p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-20 left-20 w-64 h-64 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
      />
      <motion.div
        animate={{ scale: [1.2, 1, 1.2], rotate: [90, 0, 90] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
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
                  message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
                }`}
              >
                {message.text}
              </motion.div>
            )}

            {!showForgotPassword ? (
              <form onSubmit={handleLogin} className="space-y-5">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mã số tài khoản</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-orange-500 focus:bg-white transition-all duration-300 text-gray-700 group-hover:border-gray-300"
                      placeholder="Nhập MSSV hoặc Mã GV..."
                      required
                    />
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-orange-500 focus:bg-white transition-all duration-300 text-gray-700 group-hover:border-gray-300"
                      placeholder="••••••••"
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
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-right">
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
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
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
                      <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                        <User className="w-5 h-5" />
                      </motion.div>
                    </>
                  )}
                </motion.button>
              </form>
            ) : (
              <motion.form initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} onSubmit={handleForgotPassword} className="space-y-5">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
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
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  whileHover={{ scale: 1.02, boxShadow: "0 10px 40px -10px rgba(249, 115, 22, 0.5)" }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-300 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {forgotLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Gửi liên kết đặt lại mật khẩu'}
                </motion.button>

                <motion.button
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
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
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl border border-red-100 text-center"
          >
            <div className="flex justify-center mb-4">
              <ShieldAlert className="w-16 h-16 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-800">Lỗi xác thực quyền!</h1>
            <p className="text-gray-500 text-sm mt-2">Hệ thống nhận diện được bạn đã đăng nhập nhưng <span className="font-bold text-red-500">quyền (role)</span> trả về từ server không khớp với giao diện nào cả.</p>
            
            <div className="p-4 mt-4 bg-gray-50 rounded-xl text-left text-sm text-gray-600 border border-gray-200">
              <p><strong>Mã tài khoản:</strong> {loggedInUser.id || loggedInUser.username}</p>
              <p><strong>Role từ Backend gửi lên:</strong> <code className="bg-gray-200 px-1 rounded text-red-500">{loggedInUser.role}</code></p>
              <p className="mt-2 text-xs italic text-gray-400">* Hãy kiểm tra lại API Login của Backend xem field role đang trả về chuỗi chính xác là gì.</p>
            </div>

            <button
              onClick={handleLogout}
              className="mt-6 w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
            >
              Quay lại đăng nhập
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;