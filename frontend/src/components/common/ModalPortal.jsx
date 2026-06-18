import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ModalPortal = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Chỉ render portal khi component đã mount (tránh lỗi SSR hoặc hydration nếu có)
  if (!mounted) return null;

  // Render các thành phần con trực tiếp vào thẻ <body> của trang web
  return ReactDOM.createPortal(
    children,
    document.body
  );
};

// Toast Notification Component
export const Toast = ({ show, message, type = 'success', onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  const typeConfig = {
    success: {
      bg: 'bg-green-500',
      icon: CheckCircle
    },
    error: {
      bg: 'bg-red-500',
      icon: XCircle
    },
    warning: {
      bg: 'bg-amber-500',
      icon: AlertCircle
    },
    info: {
      bg: 'bg-blue-500',
      icon: Info
    }
  };

  const config = typeConfig[type] || typeConfig.success;
  const Icon = config.icon;
  const isSuccess = type === 'success';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className={`fixed top-8 right-8 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border-l-4 ${
            isSuccess 
              ? 'bg-white border-green-500 text-gray-800' 
              : 'bg-white border-red-500 text-gray-800'
          }`}
        >
          {isSuccess ? (
            <div className="bg-green-100 p-2 rounded-full"><CheckCircle className="w-6 h-6 text-green-600" /></div>
          ) : (
            <div className="bg-red-100 p-2 rounded-full"><Icon className="w-6 h-6 text-red-600" /></div>
          )}
          <div>
            <p className="font-bold text-sm">{isSuccess ? 'Thành công' : 'Thất bại'}</p>
            <p className="text-gray-600 font-medium text-sm">{message}</p>
          </div>
          <button onClick={onClose} className="ml-4 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Confirmation Dialog Component
export const ConfirmDialog = ({ show, message, onConfirm, onCancel, title = 'Xác nhận', requireCountdown = false }) => {
  const [countdown, setCountdown] = useState(requireCountdown ? 5 : 0);

  useEffect(() => {
    let timer;
    if (show && requireCountdown) {
      setCountdown(5);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (show) {
      setCountdown(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [show, requireCountdown]);

  return (
    <AnimatePresence>
      {show && (
        <ModalPortal>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-orange-100 rounded-full p-3">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">{title}</h3>
              </div>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="flex gap-3">
                <motion.button
                  whileHover={countdown === 0 ? { scale: 1.05 } : {}}
                  whileTap={countdown === 0 ? { scale: 0.95 } : {}}
                  onClick={() => {
                    if (countdown === 0) onConfirm();
                  }}
                  disabled={countdown > 0}
                  className={`flex-1 py-3 rounded-xl font-semibold shadow-lg transition-all flex items-center justify-center gap-2 ${
                    countdown > 0 
                      ? 'bg-orange-300 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                  }`}
                >
                  {countdown > 0 ? `Chờ ${countdown}s` : 'Xác nhận'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onCancel}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Hủy
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </ModalPortal>
      )}
    </AnimatePresence>
  );
};

// Success Dialog Component
export const SuccessDialog = ({ show, message, onClose, title = 'Thông báo' }) => {
  return (
    <AnimatePresence>
      {show && (
        <ModalPortal>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-100 rounded-full p-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">{title}</h3>
              </div>
              <p className="text-gray-600 mb-6">{message}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-semibold shadow-lg transition-all"
              >
                Đóng
              </motion.button>
            </motion.div>
          </motion.div>
        </ModalPortal>
      )}
    </AnimatePresence>
  );
};

// Error Dialog Component
export const ErrorDialog = ({ show, message, onClose, title = 'Lỗi' }) => {
  return (
    <AnimatePresence>
      {show && (
        <ModalPortal>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-100 rounded-full p-3">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">{title}</h3>
              </div>
              <p className="text-gray-600 mb-6">{message}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-semibold shadow-lg transition-all"
              >
                Đóng
              </motion.button>
            </motion.div>
          </motion.div>
        </ModalPortal>
      )}
    </AnimatePresence>
  );
};

// Info Dialog Component
export const InfoDialog = ({ show, message, onClose, title = 'Thông tin' }) => {
  return (
    <AnimatePresence>
      {show && (
        <ModalPortal>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 rounded-full p-3">
                  <Info className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">{title}</h3>
              </div>
              <p className="text-gray-600 mb-6">{message}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-semibold shadow-lg transition-all"
              >
                Đóng
              </motion.button>
            </motion.div>
          </motion.div>
        </ModalPortal>
      )}
    </AnimatePresence>
  );
};

export default ModalPortal;
