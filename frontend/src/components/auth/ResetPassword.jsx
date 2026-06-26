import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import API_URL from '../../api';

const getPasswordStrength = (pwd) => {
  if (!pwd) return { score: 0, label: '', color: 'bg-gray-200', textClass: 'text-gray-300' };
  let score = 0;

  if (pwd.length >= 8) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\';/`~]/.test(pwd)) score++;

  if (pwd.length < 6 && score > 1) {
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

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({ newPassword: '', confirmPassword: '' });

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const newErrors = { newPassword: '', confirmPassword: '' };
    let hasError = false;

    if (!newPassword) {
      newErrors.newPassword = 'Vui lòng nhập mật khẩu';
      hasError = true;
    } else if (/\s/.test(newPassword)) {
      newErrors.newPassword = 'Mật khẩu không được chứa khoảng trắng!';
      hasError = true;
    } else {
      if (newPassword.length < 8) {
        newErrors.newPassword = 'Mật khẩu phải có ít nhất 8 ký tự!';
        hasError = true;
      } else if (newPassword.length > 20) {
        newErrors.newPassword = 'Mật khẩu chỉ được tối đa 20 ký tự!';
        hasError = true;
      } else if (!/[a-z]/.test(newPassword)) {
        newErrors.newPassword = 'Mật khẩu phải chứa ít nhất một chữ thường!';
        hasError = true;
      } else if (!/[A-Z]/.test(newPassword)) {
        newErrors.newPassword = 'Mật khẩu phải chứa ít nhất một chữ hoa!';
        hasError = true;
      } else if (!/[0-9]/.test(newPassword)) {
        newErrors.newPassword = 'Mật khẩu phải chứa ít nhất một số!';
        hasError = true;
      } else if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\';/`~]/.test(newPassword)) {
        newErrors.newPassword = 'Mật khẩu phải chứa ít nhất một ký tự đặc biệt!';
        hasError = true;
      }
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng nhập mật khẩu';
      hasError = true;
    } else if (/\s/.test(confirmPassword)) {
      newErrors.confirmPassword = 'Mật khẩu không được chứa khoảng trắng!';
      hasError = true;
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp!';
      hasError = true;
    }

    setErrors(newErrors);

    if (hasError) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/reset-password`, {
        token,
        newPassword
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: response.data.message });
        setSuccess(true);
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Không thể kết nối đến server!';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-amber-100 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#FFFFFF] w-full max-w-md p-8 rounded-3xl shadow-2xl text-center"
        >
          <XCircle className="w-16 h-16 text-[#EF4444] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#1F2937] mb-2">Token Không Hợp Lệ</h2>
          <p className="text-[#6B7280] mb-6">Không tìm thấy token đặt lại mật khẩu.</p>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="px-6 py-3 bg-[#F4C542] text-white font-semibold rounded-xl hover:bg-[#F4C542]/90 transition-colors"
          >
            Quay lại trang đăng nhập
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-amber-100 p-4 relative overflow-hidden">
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
        className="absolute top-20 left-20 w-64 h-64 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
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

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#FFFFFF] w-full max-w-md p-8 rounded-3xl shadow-2xl shadow-[#F4C542]/30/50 border border-[#FFF7D6] relative z-10"
      >
        <div className="text-center mb-8">
          {success ? (
            <motion.div
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="inline-flex p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-3xl text-white mb-4 shadow-xl shadow-green-300"
            >
              <CheckCircle className="w-10 h-10" />
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
              className="inline-flex p-4 bg-gradient-to-br from-[#F4C542] to-[#F4C542]/90 rounded-3xl text-white mb-4 shadow-xl shadow-amber-300"
            >
              <Lock className="w-10 h-10" />
            </motion.div>
          )}
          <h2 className="text-3xl font-bold text-[#1F2937]">
            {success ? 'Đặt Lại Mật Khẩu Thành Công!' : 'Đặt Lại Mật Khẩu'}
          </h2>
          <p className="text-gray-300 text-sm mt-2">
            {success ? 'Bạn sẽ được chuyển đến trang đăng nhập...' : 'Nhập mật khẩu mới của bạn'}
          </p>
        </div>

        {message.text && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`p-4 rounded-xl text-sm mb-6 text-center font-medium ${message.type === 'success' ? 'bg-[#22C55E]/10 text-[#22C55E] border border-green-200' :
              message.type === 'error' ? 'bg-red-100 text-[#DC2626] border border-red-200' :
                'bg-[#3B82F6]/10 text-[#3B82F6] border border-blue-200'
              }`}
          >
            {message.text}
          </motion.div>
        )}

        {!success && (
          <form onSubmit={handleResetPassword} noValidate className="space-y-5">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu mới</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300 group-focus-within:text-[#F4C542] transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewPassword(val);
                    setErrors(prev => ({ ...prev, newPassword: '' }));
                  }}
                  className="w-full pl-12 pr-12 py-3.5 bg-[#F7F8FA] border-2 border-[#E5E7EB] rounded-2xl focus:outline-none focus:border-[#F4C542] focus:bg-[#FFFFFF] transition-all duration-300 text-gray-700 group-hover:border-gray-300"
                  placeholder="Nhập mật khẩu mới..."
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-300 hover:text-[#6B7280] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </motion.button>
              </div>
              {newPassword && (
                <div className="mt-2.5 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#6B7280] font-medium">Độ mạnh mật khẩu:</span>
                    <span className={`font-bold transition-colors duration-300 ${getPasswordStrength(newPassword).textClass}`}>
                      {getPasswordStrength(newPassword).label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex gap-1">
                    {[1, 2, 3, 4].map((index) => (
                      <div
                        key={index}
                        className={`h-full flex-1 transition-all duration-300 ${index <= getPasswordStrength(newPassword).score
                          ? getPasswordStrength(newPassword).color
                          : 'bg-gray-200'
                          }`}
                      />
                    ))}
                  </div>
                </div>
              )}
              {errors.newPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[#EF4444] text-xs mt-1.5 ml-2 font-medium"
                >
                  {errors.newPassword}
                </motion.p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-sm font-semibold text-gray-700 mb-2">Xác nhận mật khẩu</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300 group-focus-within:text-[#F4C542] transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    const val = e.target.value;
                    setConfirmPassword(val);
                    setErrors(prev => ({ ...prev, confirmPassword: '' }));
                  }}
                  className="w-full pl-12 pr-12 py-3.5 bg-[#F7F8FA] border-2 border-[#E5E7EB] rounded-2xl focus:outline-none focus:border-[#F4C542] focus:bg-[#FFFFFF] transition-all duration-300 text-gray-700 group-hover:border-gray-300"
                  placeholder="Nhập lại mật khẩu mới..."
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-300 hover:text-[#6B7280] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </motion.button>
              </div>
              {errors.confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[#EF4444] text-xs mt-1.5 ml-2 font-medium"
                >
                  {errors.confirmPassword}
                </motion.p>
              )}
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02, boxShadow: "0 10px 40px -10px rgba(249, 115, 22, 0.5)" }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-[#F4C542] hover:from-amber-600 hover:to-amber-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-amber-300 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Đặt Lại Mật Khẩu'
              )}
            </motion.button>
          </form>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-center"
        >
          <button
            onClick={() => navigate('/', { replace: true })}
            className="text-sm font-semibold text-[#6B7280] hover:text-[#F4C542] transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại trang đăng nhập
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default ResetPassword;
