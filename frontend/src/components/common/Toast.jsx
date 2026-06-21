import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import ModalPortal from './ModalPortal';

export default function Toast({ show, message, type = 'success', onClose }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <ModalPortal>
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-8 right-8 z-[100000] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border-l-4 bg-white/95 backdrop-blur-md ${
              type === 'success' ? 'border-green-500 text-gray-800' : 'border-red-500 text-gray-800'
            }`}
          >
            {type === 'success' ? (
              <div className="bg-green-100 p-2 rounded-full">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            ) : (
              <div className="bg-red-100 p-2 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            )}
            <div>
              <p className="font-bold text-sm">
                {type === 'success' ? 'Thành công' : 'Thất bại'}
              </p>
              <p className="text-gray-600 font-medium text-sm">{message}</p>
            </div>
            <button
              onClick={onClose}
              className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </ModalPortal>
      )}
    </AnimatePresence>
  );
}
