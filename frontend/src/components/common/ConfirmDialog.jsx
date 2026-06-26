import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, AlertTriangle } from 'lucide-react';
import ModalPortal from './ModalPortal';

export default function ConfirmDialog({
  show,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  type = 'confirm',
}) {
  return (
    <AnimatePresence>
      {show && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-[#FFFFFF] rounded-2xl max-w-sm w-full p-6 shadow-xl text-center border border-[#E5E7EB]"
            >
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  type === 'danger' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'
                }`}
              >
                {type === 'danger' ? (
                  <AlertTriangle className="w-8 h-8" />
                ) : (
                  <HelpCircle className="w-8 h-8" />
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">{message}</p>
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 py-2.5 text-white font-semibold rounded-xl transition-colors ${
                    type === 'danger'
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-amber-500 hover:bg-amber-600'
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        </ModalPortal>
      )}
    </AnimatePresence>
  );
}
