import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import ModalPortal from './ModalPortal';

export default function ConfirmDeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Xác nhận xóa", 
  message = "Bạn có chắc chắn muốn xóa dữ liệu này không? Hành động này không thể hoàn tác." 
}) {

  return (
    <AnimatePresence>
      {isOpen && (
        <ModalPortal>
          <div className="fixed inset-0 flex items-center justify-center z-[110] p-4 bg-slate-900/40 backdrop-blur-sm transition-all">
            <motion.div
              initial={{ y: -20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
              className="bg-[#FFFFFF] rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl border border-[#E5E7EB]"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">{message}</p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
                >
                  Xác nhận xóa
                </button>
              </div>
            </motion.div>
          </div>
        </ModalPortal>
      )}
    </AnimatePresence>
  );
}
