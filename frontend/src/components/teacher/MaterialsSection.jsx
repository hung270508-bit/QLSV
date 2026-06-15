import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, FolderOpen, CheckCircle, X } from 'lucide-react';
import API_URL from '../../api';

function MaterialsSection({ teachingAssignments }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadError, setUploadError] = useState(null);

  // Fetch materials on component load
  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await fetch(`${API_URL}/api/materials`);
      const data = await response.json();
      if (data.success) {
        setUploadedFiles(data.materials);
      }
    } catch (error) {
      console.error('Lỗi lấy danh sách tài liệu:', error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleButtonClick = () => {
    document.getElementById('file-input').click();
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('TieuDe', selectedFile.name);
    formData.append('Loai', 'Tài liệu');

    try {
      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        await fetchMaterials(); // Refresh the list from database
        setSelectedFile(null);
        document.getElementById('file-input').value = '';
      } else {
        setUploadError(data.message || 'Tải lên thất bại');
      }
    } catch (error) {
      setUploadError('Lỗi kết nối server');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = async (index) => {
    // For now, just remove from local state
    // In the future, you might want to add a delete API endpoint
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

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
            onClick={handleButtonClick}
            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
          >
            Chọn file
          </motion.button>
          <input
            type="file"
            id="file-input"
            onChange={handleFileSelect}
            className="hidden"
          />
          {selectedFile && (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-green-600 font-medium">
                Đã chọn: {selectedFile.name}
              </p>
              <div className="flex gap-2 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Đang tải lên...' : 'Tải lên'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedFile(null);
                    document.getElementById('file-input').value = '';
                  }}
                  disabled={uploading}
                  className="px-6 py-2 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </motion.button>
              </div>
            </div>
          )}
          {uploadError && (
            <p className="mt-4 text-sm text-red-600 font-medium">
              {uploadError}
            </p>
          )}
        </motion.div>

        <div className="mt-6">
          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
            Tài liệu đã tải lên
          </h4>
          {uploadedFiles.length === 0 ? (
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
          ) : (
            <div className="space-y-3">
              {uploadedFiles.map((file, index) => (
                <motion.div
                  key={file.MaTaiLieu || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{file.TieuDe || file.originalname}</p>
                      <p className="text-xs text-gray-500">
                        {file.Loai} {file.TenMonHoc ? `- ${file.TenMonHoc}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <a
                      href={`${API_URL}${file.FileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Tải xuống"
                    >
                      <FileText className="w-5 h-5 text-blue-500" />
                    </a>
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <X className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default MaterialsSection;
