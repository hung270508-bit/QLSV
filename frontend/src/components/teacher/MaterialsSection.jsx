import { motion } from 'framer-motion';
import { Upload, FileText, FolderOpen } from 'lucide-react';

function MaterialsSection({ teachingAssignments }) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 shadow-xl"
      >
        <h2 className="text-2xl font-bold text-white mb-2">Tài liệu & Bài tập</h2>
        <p className="text-orange-100">Quản lý tài liệu học tập và bài tập</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-gray-100/50"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Upload className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Tải lên tài liệu</h3>
            <p className="text-sm text-gray-500">Thêm tài liệu hoặc bài tập mới</p>
          </div>
        </div>

        <motion.div
          whileHover={{ scale: 1.01, borderColor: "#f97316" }}
          className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center transition-all cursor-pointer hover:bg-orange-50/30"
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mx-auto mb-4"
          >
            <Upload className="w-8 h-8 text-orange-500" />
          </motion.div>
          <p className="text-gray-600 mb-2 font-semibold">Kéo và thả tài liệu vào đây</p>
          <p className="text-sm text-gray-400 mb-4">hoặc</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
          >
            Chọn file
          </motion.button>
        </motion.div>

        <div className="mt-6">
          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
            Tài liệu đã tải lên
          </h4>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">Chưa có tài liệu nào</p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default MaterialsSection;
