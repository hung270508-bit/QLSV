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
          <div className="fixed inset-0 flex items-center justify-center z-[110] p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#FFFFFF] rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl border border-[#E5E7EB]"
            >
              <div className="w-14 h-14 bg-red-100 text-[#DC2626] rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-[#1F2937] mb-2">{title}</h3>
              <p className="text-[#6B7280] text-sm mb-6 font-medium leading-relaxed">{message}</p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-gray-100 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm bg-[#EF4444]/100 text-white hover:bg-red-600"
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
