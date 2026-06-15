import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, School, Loader2, Eye, EyeOff, Mail, ChevronDown, X } from 'lucide-react';

const LoginForm = ({
  username,
  setUsername,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  rememberMe,
  setRememberMe,
  savedAccounts,
  showAccountList,
  setShowAccountList,
  loading,
  message,
  showForgotPassword,
  setShowForgotPassword,
  forgotEmail,
  setForgotEmail,
  forgotLoading,
  handleLogin,
  handleForgotPassword,
  handleSelectAccount,
  handleRemoveAccount
}) => {
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
                    onChange={(e) => setPassword(e.target.value)}
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
                }}
                className="w-full py-3 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Quay lại đăng nhập
              </motion.button>
            </motion.form>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default LoginForm;
