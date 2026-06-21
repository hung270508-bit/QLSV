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
          <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center border border-slate-100"
            >
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  type === 'danger' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
                }`}
              >
                {type === 'danger' ? (
                  <AlertTriangle className="w-8 h-8" />
                ) : (
                  <HelpCircle className="w-8 h-8" />
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">{message}</p>
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 py-3 text-white font-bold rounded-xl transition-colors shadow-lg ${
                    type === 'danger'
                      ? 'bg-red-600 hover:bg-red-700 shadow-red-100'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
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
