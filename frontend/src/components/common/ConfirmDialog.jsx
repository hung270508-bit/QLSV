import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, AlertTriangle, XCircle } from 'lucide-react';
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
          <div className="fixed inset-0 z-[100000] flex items-start justify-center p-4 pt-16 md:pt-24 bg-slate-900/20 backdrop-blur-[2px] transition-all">
            <motion.div
              initial={{ y: -50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -50, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
              className="bg-white rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-left border border-gray-100"
            >
              <div className="p-6 border-b bg-gray-50 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-[#D49A00]'}`}>
                    {type === 'danger' ? <AlertTriangle className="w-6 h-6" /> : <HelpCircle className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className={`text-xl font-extrabold ${type === 'danger' ? 'text-red-600' : 'text-[#D49A00]'}`}>{title}</h3>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Vui lòng xác nhận trước khi thực hiện</p>
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
                  onClick={onCancel}
                  className="px-6 py-2.5 bg-white border border-gray-300 rounded-2xl text-gray-700 font-bold hover:bg-gray-100 transition-all shadow-sm text-sm"
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  className={`px-7 py-2.5 text-sm font-extrabold rounded-2xl shadow-md transition-all flex items-center gap-1.5 ${
                    type === 'danger'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-[#F4C542] hover:bg-[#e0b134] text-[#152238]'
                  }`}
                >
                  <span>{confirmText}</span>
                </button>
              </div>
            </motion.div>
          </div>
        </ModalPortal>
      )}
    </AnimatePresence>
  );
}
