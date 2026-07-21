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
      bg: 'bg-[#22C55E]/100',
      icon: CheckCircle
    },
    error: {
      bg: 'bg-[#EF4444]/100',
      icon: XCircle
    },
    warning: {
      bg: 'bg-amber-500',
      icon: AlertCircle
    },
    info: {
      bg: 'bg-[#3B82F6]/100',
      icon: Info
    }
  };

  const config = typeConfig[type] || typeConfig.success;
  const Icon = config.icon;
  const isSuccess = type === 'success';

  return (
    <AnimatePresence>
      {show && (
        <ModalPortal>
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-8 right-8 z-[100000] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border-l-4 ${
              isSuccess 
                ? 'bg-[#FFFFFF] border-green-500 text-[#1F2937]' 
                : 'bg-[#FFFFFF] border-red-500 text-[#1F2937]'
            }`}
          >
            {isSuccess ? (
              <div className="bg-[#22C55E]/20 p-2 rounded-full"><CheckCircle className="w-6 h-6 text-[#22C55E]" /></div>
            ) : (
              <div className="bg-[#EF4444]/20 p-2 rounded-full"><Icon className="w-6 h-6 text-[#EF4444]" /></div>
            )}
            <div>
              <p className="font-bold text-sm">{isSuccess ? 'Thành công' : 'Thất bại'}</p>
              <p className="text-[#6B7280] font-medium text-sm">{message}</p>
            </div>
            <button onClick={onClose} className="ml-4 text-gray-300 hover:text-[#6B7280]">
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </ModalPortal>
      )}
    </AnimatePresence>
  );
};

// Confirmation Dialog Component
export const ConfirmDialog = ({ show, message, onConfirm, onCancel, title = 'Xác nhận', requireCountdown = false, isSubmitting = false }) => {
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
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b bg-gray-50 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-100 text-[#D49A00] shrink-0">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-[#D49A00]">{title}</h3>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Vui lòng xác nhận trước khi tiếp tục</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onCancel}
                  className="p-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-full transition-colors shrink-0"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <p className="text-sm md:text-base font-semibold text-gray-800 leading-relaxed whitespace-pre-line">{message}</p>
              </div>

              <div className="p-5 border-t bg-gray-50 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (!isSubmitting) onCancel();
                  }}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-white border border-gray-300 rounded-2xl text-gray-700 font-bold hover:bg-gray-100 transition-all shadow-sm text-sm"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (countdown === 0 && !isSubmitting) onConfirm();
                  }}
                  disabled={countdown > 0 || isSubmitting}
                  className={`px-7 py-2.5 rounded-2xl shadow-md transition-all text-sm font-extrabold flex items-center gap-1.5 ${
                    countdown > 0 || isSubmitting
                      ? 'bg-orange-300 text-white cursor-not-allowed opacity-70'
                      : 'bg-[#F4C542] hover:bg-[#e0b134] text-[#152238]'
                  }`}
                >
                  <span>{countdown > 0 ? `Chờ ${countdown}s` : isSubmitting ? 'Đang xử lý...' : 'Đồng ý / Xác Nhận'}</span>
                </button>
              </div>
            </motion.div>
          </div>
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
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b bg-gray-50 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600 shrink-0">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-emerald-600">{title}</h3>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Thao tác thành công</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-full transition-colors shrink-0"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <p className="text-sm md:text-base font-semibold text-gray-800 leading-relaxed whitespace-pre-line">{message}</p>
              </div>

              <div className="p-5 border-t bg-gray-50 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-7 py-2.5 bg-[#F4C542] hover:bg-[#e0b134] text-[#152238] font-extrabold rounded-2xl shadow-md transition-all text-sm"
                >
                  Đã Hiểu / Đóng
                </button>
              </div>
            </motion.div>
          </div>
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
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b bg-gray-50 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-red-100 text-red-600 shrink-0">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-red-600">{title}</h3>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Vui lòng kiểm tra lại thông tin</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-full transition-colors shrink-0"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <p className="text-sm md:text-base font-semibold text-gray-800 leading-relaxed whitespace-pre-line">{message}</p>
              </div>

              <div className="p-5 border-t bg-gray-50 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-7 py-2.5 bg-[#F4C542] hover:bg-[#e0b134] text-[#152238] font-extrabold rounded-2xl shadow-md transition-all text-sm"
                >
                  Đã Hiểu / Đóng
                </button>
              </div>
            </motion.div>
          </div>
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
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b bg-gray-50 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-100 text-blue-600 shrink-0">
                    <Info className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-[#152238]">{title}</h3>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Thông tin chi tiết từ hệ thống</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-full transition-colors shrink-0"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <p className="text-sm md:text-base font-semibold text-gray-800 leading-relaxed whitespace-pre-line">{message}</p>
              </div>

              <div className="p-5 border-t bg-gray-50 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-7 py-2.5 bg-[#F4C542] hover:bg-[#e0b134] text-[#152238] font-extrabold rounded-2xl shadow-md transition-all text-sm"
                >
                  Đã Hiểu / Đóng
                </button>
              </div>
            </motion.div>
          </div>
        </ModalPortal>
      )}
    </AnimatePresence>
  );
};

export default ModalPortal;
