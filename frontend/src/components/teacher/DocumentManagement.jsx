import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Edit, Trash2, Search, X, Filter, XCircle, Download, Upload, CheckCircle } from 'lucide-react';
import axios from 'axios';

function DocumentManagement() {
  const [materials, setMaterials] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [teachingAssignments, setTeachingAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [activeTab, setActiveTab] = useState('materials'); // 'materials' or 'submissions'
  const [searchTerm, setSearchTerm] = useState('');
  const [displaySearchTerm, setDisplaySearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    typeFilter: '',
    assignmentFilter: ''
  });
  const [displayFilters, setDisplayFilters] = useState({
    typeFilter: '',
    assignmentFilter: ''
  });
  const [materialFormData, setMaterialFormData] = useState({
    MaPhanCong: '',
    TieuDe: '',
    Loai: 'Tài liệu',
    FileUrl: '',
    HanNop: ''
  });
  const [submissionFormData, setSubmissionFormData] = useState({
    MaTaiLieu: '',
    MSSV: '',
    FileUrl: '',
    Diem: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [materialsRes, submissionsRes, assignmentsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/materials'),
        axios.get('http://localhost:5000/api/submissions'),
        axios.get('http://localhost:5000/api/teaching-assignments')
      ]);
      setMaterials(materialsRes.data);
      setSubmissions(submissionsRes.data);
      setTeachingAssignments(assignmentsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMaterialSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMaterial) {
        await axios.put(`http://localhost:5000/api/materials/${editingMaterial.MaTaiLieu}`, materialFormData);
      } else {
        await axios.post('http://localhost:5000/api/materials', materialFormData);
      }
      fetchData();
      handleCloseMaterialModal();
    } catch (error) {
      console.error('Error saving material:', error);
      alert('Lỗi khi lưu tài liệu!');
    }
  };

  const handleMaterialEdit = (material) => {
    setEditingMaterial(material);
    setMaterialFormData({
      MaPhanCong: material.MaPhanCong,
      TieuDe: material.TieuDe,
      Loai: material.Loai,
      FileUrl: material.FileUrl,
      HanNop: material.HanNop
    });
    setShowMaterialModal(true);
  };

  const handleMaterialDelete = async (maTaiLieu) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) {
      try {
        await axios.delete(`http://localhost:5000/api/materials/${maTaiLieu}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting material:', error);
        alert('Lỗi khi xóa tài liệu!');
      }
    }
  };

  const handleCloseMaterialModal = () => {
    setShowMaterialModal(false);
    setEditingMaterial(null);
    setMaterialFormData({
      MaPhanCong: '',
      TieuDe: '',
      Loai: 'Tài liệu',
      FileUrl: '',
      HanNop: ''
    });
  };

  const handleSubmissionSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/submissions', submissionFormData);
      fetchData();
      handleCloseSubmissionModal();
    } catch (error) {
      console.error('Error saving submission:', error);
      alert('Lỗi khi lưu bài nộp!');
    }
  };

  const handleSubmissionEdit = async (submission) => {
    try {
      await axios.put(`http://localhost:5000/api/submissions/${submission.MaNopBai}`, {
        MaTaiLieu: submission.MaTaiLieu,
        MSSV: submission.MSSV,
        FileUrl: submission.FileUrl,
        Diem: submission.Diem
      });
      fetchData();
    } catch (error) {
      console.error('Error updating submission:', error);
      alert('Lỗi khi cập nhật bài nộp!');
    }
  };

  const handleSubmissionDelete = async (maNopBai) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài nộp này?')) {
      try {
        await axios.delete(`http://localhost:5000/api/submissions/${maNopBai}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting submission:', error);
        alert('Lỗi khi xóa bài nộp!');
      }
    }
  };

  const handleCloseSubmissionModal = () => {
    setShowSubmissionModal(false);
    setSubmissionFormData({
      MaTaiLieu: '',
      MSSV: '',
      FileUrl: '',
      Diem: ''
    });
  };

  const handleSearch = () => {
    setSearchTerm(displaySearchTerm);
  };

  const handleApplyFilters = () => {
    setFilters({ ...displayFilters });
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({ typeFilter: '', assignmentFilter: '' });
    setDisplayFilters({ typeFilter: '', assignmentFilter: '' });
    setSearchTerm('');
    setDisplaySearchTerm('');
  };

  const activeFilterCount = (filters.typeFilter ? 1 : 0) + (filters.assignmentFilter ? 1 : 0) + (searchTerm ? 1 : 0);
  const hasActiveFilters = filters.typeFilter || filters.assignmentFilter || searchTerm;

  const getTypeColor = (type) => {
    return type === 'Bài tập' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600';
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = 
      material.TieuDe?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.TenMonHoc?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !filters.typeFilter || material.Loai === filters.typeFilter;
    const matchesAssignment = !filters.assignmentFilter || material.MaPhanCong === filters.assignmentFilter;
    
    return matchesSearch && matchesType && matchesAssignment;
  });

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = 
      submission.TenSinhVien?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.TieuDe?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Quản lý tài liệu & bài tập</h2>
          <p className="text-gray-500">Upload tài liệu, đăng bài tập, xem và chấm bài nộp</p>
        </div>
        {activeTab === 'materials' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowMaterialModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Thêm tài liệu
          </motion.button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('materials')}
          className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
            activeTab === 'materials'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Tài liệu & Bài tập
        </button>
        <button
          onClick={() => setActiveTab('submissions')}
          className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
            activeTab === 'submissions'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Upload className="w-4 h-4" />
          Bài nộp
        </button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="relative w-1/2">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={activeTab === 'materials' ? 'Tìm kiếm tài liệu...' : 'Tìm kiếm bài nộp...'}
              value={displaySearchTerm}
              onChange={(e) => setDisplaySearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                hasActiveFilters ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSearch}
            className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
          >
            Tìm kiếm
          </motion.button>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeTab === 'materials' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Lọc theo loại</label>
                    <select
                      value={displayFilters.typeFilter}
                      onChange={(e) => setDisplayFilters({ ...displayFilters, typeFilter: e.target.value })}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                    >
                      <option value="">Tất cả loại</option>
                      <option value="Tài liệu">Tài liệu</option>
                      <option value="Bài tập">Bài tập</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Lọc theo phân công</label>
                    <select
                      value={displayFilters.assignmentFilter}
                      onChange={(e) => setDisplayFilters({ ...displayFilters, assignmentFilter: e.target.value })}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                    >
                      <option value="">Tất cả phân công</option>
                      {teachingAssignments.map((ta) => (
                        <option key={ta.MaPhanCong} value={ta.MaPhanCong}>
                          {ta.TenMonHoc} - {ta.TenLop}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleApplyFilters}
                className="flex-1 bg-orange-500 text-white py-2 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
              >
                Áp dụng lọc
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setDisplayFilters({ typeFilter: '', assignmentFilter: '' })}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Đặt lại
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Materials Table */}
      {activeTab === 'materials' && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Tiêu đề</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Loại</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Môn học</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Lớp</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Giảng viên</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Hạn nộp</th>
                  <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterials.length > 0 ? (
                  filteredMaterials.map((material, index) => (
                    <motion.tr
                      key={material.MaTaiLieu}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 hover:bg-orange-50 transition-colors"
                    >
                      <td className="py-4 px-6 text-sm font-medium text-gray-800">{material.TieuDe}</td>
                      <td className="py-4 px-6 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(material.Loai)}`}>
                          {material.Loai}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">{material.TenMonHoc || 'N/A'}</td>
                      <td className="py-4 px-6 text-sm text-gray-600">{material.TenLop || 'N/A'}</td>
                      <td className="py-4 px-6 text-sm text-gray-600">{material.TenGiangVien || 'N/A'}</td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {material.HanNop ? new Date(material.HanNop).toLocaleDateString('vi-VN') : '-'}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <div className="flex items-center justify-center gap-2">
                          {material.FileUrl && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => window.open(material.FileUrl, '_blank')}
                              className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                            >
                              <Download className="w-4 h-4" />
                            </motion.button>
                          )}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleMaterialEdit(material)}
                            className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleMaterialDelete(material.MaTaiLieu)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-gray-500">Chưa có tài liệu nào</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submissions Table */}
      {activeTab === 'submissions' && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Sinh viên</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Bài tập</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Loại</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">File</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Thời gian nộp</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Điểm</th>
                  <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.length > 0 ? (
                  filteredSubmissions.map((submission, index) => (
                    <motion.tr
                      key={submission.MaNopBai}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 hover:bg-orange-50 transition-colors"
                    >
                      <td className="py-4 px-6 text-sm font-medium text-gray-800">{submission.TenSinhVien}</td>
                      <td className="py-4 px-6 text-sm text-gray-600">{submission.TieuDe}</td>
                      <td className="py-4 px-6 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(submission.Loai)}`}>
                          {submission.Loai}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm">
                        {submission.FileUrl ? (
                          <a href={submission.FileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Xem file
                          </a>
                        ) : '-'}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {submission.ThoiGianNop ? new Date(submission.ThoiGianNop).toLocaleString('vi-VN') : '-'}
                      </td>
                      <td className="py-4 px-6 text-sm font-bold text-orange-600">{submission.Diem || '-'}</td>
                      <td className="py-4 px-6 text-sm">
                        <div className="flex items-center justify-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              const diem = prompt('Nhập điểm:', submission.Diem || '');
                              if (diem !== null) {
                                handleSubmissionEdit({ ...submission, Diem: diem });
                              }
                            }}
                            className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleSubmissionDelete(submission.MaNopBai)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-gray-500">Chưa có bài nộp nào</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Material Modal */}
      {showMaterialModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {editingMaterial ? 'Cập nhật tài liệu' : 'Thêm tài liệu mới'}
              </h3>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleCloseMaterialModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </motion.button>
            </div>

            <form onSubmit={handleMaterialSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phân công giảng dạy</label>
                  <select
                    value={materialFormData.MaPhanCong}
                    onChange={(e) => setMaterialFormData({ ...materialFormData, MaPhanCong: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                    required
                  >
                    <option value="">Chọn phân công</option>
                    {teachingAssignments.map((ta) => (
                      <option key={ta.MaPhanCong} value={ta.MaPhanCong}>
                        {ta.TenMonHoc} - {ta.TenLop} - {ta.HocKy}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tiêu đề</label>
                  <input
                    type="text"
                    value={materialFormData.TieuDe}
                    onChange={(e) => setMaterialFormData({ ...materialFormData, TieuDe: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Loại</label>
                  <select
                    value={materialFormData.Loai}
                    onChange={(e) => setMaterialFormData({ ...materialFormData, Loai: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                    required
                  >
                    <option value="Tài liệu">Tài liệu</option>
                    <option value="Bài tập">Bài tập</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">URL File</label>
                  <input
                    type="text"
                    value={materialFormData.FileUrl}
                    onChange={(e) => setMaterialFormData({ ...materialFormData, FileUrl: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                    placeholder="https://..."
                  />
                </div>
                {materialFormData.Loai === 'Bài tập' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Hạn nộp</label>
                    <input
                      type="date"
                      value={materialFormData.HanNop}
                      onChange={(e) => setMaterialFormData({ ...materialFormData, HanNop: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold shadow-lg transition-all"
                >
                  {editingMaterial ? 'Cập nhật' : 'Thêm mới'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleCloseMaterialModal}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Hủy
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default DocumentManagement;
