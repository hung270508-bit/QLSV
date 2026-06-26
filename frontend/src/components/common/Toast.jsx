import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ show, message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => onClose && onClose(), duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  const colors = {
    success: 'bg-green-50 text-green-500 border-green-200',
    error: 'bg-red-50 text-red-500 border-red-200',
    warning: 'bg-amber-50 text-amber-500 border-amber-200',
    info: 'bg-blue-50 text-blue-500 border-blue-200',
  };

  const title = {
    success: 'Thành công',
    error: 'Lỗi',
    warning: 'Cảnh báo',
    info: 'Thông tin'
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`fixed bottom-4 right-4 z-[100000] flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border bg-[#FFFFFF]`}
        >
          <div className={`mt-0.5 p-1.5 rounded-lg ${colors[type].split(' ')[0]} ${colors[type].split(' ')[1]}`}>
            {icons[type]}
          </div>
          <div className="pr-4">
            <h4 className="font-bold text-sm text-gray-800 mb-0.5">{title[type]}</h4>
            <p className="text-sm font-medium text-gray-600">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 -mt-1 -mr-1"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
