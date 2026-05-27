import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Plus, Edit, Trash2, Search, X, Filter, XCircle } from 'lucide-react';
import axios from 'axios';

function GradeManagement() {
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    subjectFilter: '',
    semesterFilter: ''
  });
  const [formData, setFormData] = useState({
    MSSV: '',
    MaMonHoc: '',
    HocKy: '',
    DiemQuaTrinh: '',
    DiemGiuaKy: '',
    DiemCuoiKy: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [gradesRes, studentsRes, subjectsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/grades'),
        axios.get('http://localhost:5000/api/students'),
        axios.get('http://localhost:5000/api/subjects')
      ]);
      setGrades(gradesRes.data);
      setStudents(studentsRes.data);
      setSubjects(subjectsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingGrade) {
        await axios.put(`http://localhost:5000/api/grades/${editingGrade.MaDiem}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/grades', formData);
      }
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving grade:', error);
      alert('Lỗi khi lưu điểm!');
    }
  };

  const handleEdit = (grade) => {
    setEditingGrade(grade);
    setFormData({
      MSSV: grade.MSSV,
      MaMonHoc: grade.MaMonHoc,
      HocKy: grade.HocKy,
      DiemQuaTrinh: grade.DiemQuaTrinh || '',
      DiemGiuaKy: grade.DiemGiuaKy || '',
      DiemCuoiKy: grade.DiemCuoiKy || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (maDiem) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa điểm này?')) {
      try {
        await axios.delete(`http://localhost:5000/api/grades/${maDiem}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting grade:', error);
        alert('Lỗi khi xóa điểm!');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGrade(null);
    setFormData({
      MSSV: '',
      MaMonHoc: '',
      HocKy: '',
      DiemQuaTrinh: '',
      DiemGiuaKy: '',
      DiemCuoiKy: ''
    });
  };

  const filteredGrades = grades.filter(grade => {
    const matchesSearch = 
      grade.TenSinhVien?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grade.MSSV?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grade.TenMonHoc?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = !filters.subjectFilter || grade.MaMonHoc === filters.subjectFilter;
    const matchesSemester = !filters.semesterFilter || grade.HocKy === filters.semesterFilter;
    
    return matchesSearch && matchesSubject && matchesSemester;
  });

  const clearFilters = () => {
    setFilters({ subjectFilter: '', semesterFilter: '' });
    setSearchTerm('');
  };

  const hasActiveFilters = filters.subjectFilter || filters.semesterFilter || searchTerm;

  const calculateAverage = (grade) => {
    const qt = parseFloat(grade.DiemQuaTrinh) || 0;
    const gk = parseFloat(grade.DiemGiuaKy) || 0;
    const ck = parseFloat(grade.DiemCuoiKy) || 0;
    return ((qt * 0.2) + (gk * 0.3) + (ck * 0.5)).toFixed(2);
  };

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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Quản lý điểm sinh viên</h2>
          <p className="text-gray-500">Thêm, sửa, xóa điểm sinh viên</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all"
        >
          <Plus className="w-5 h-5" />
          Thêm điểm
        </motion.button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm điểm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              showFilters 
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' 
                : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-orange-500'
            }`}
          >
            <Filter className="w-5 h-5" />
          </motion.button>
          {hasActiveFilters && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearFilters}
              className="px-4 py-3 bg-red-100 text-red-600 rounded-xl font-semibold hover:bg-red-200 transition-colors flex items-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              Xóa bộ lọc
            </motion.button>
          )}
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-orange-50 rounded-xl p-4 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lọc theo môn học</label>
                <select
                  value={filters.subjectFilter}
                  onChange={(e) => setFilters({ ...filters, subjectFilter: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                >
                  <option value="">Tất cả môn</option>
                  {subjects.map((subject) => (
                    <option key={subject.MaMonHoc} value={subject.MaMonHoc}>
                      {subject.TenMonHoc}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lọc theo học kỳ</label>
                <select
                  value={filters.semesterFilter}
                  onChange={(e) => setFilters({ ...filters, semesterFilter: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                >
                  <option value="">Tất cả học kỳ</option>
                  <option value="HK1_2025_2026">HK1 2025-2026</option>
                  <option value="HK2_2025_2026">HK2 2025-2026</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg shadow-orange-100 border border-orange-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-orange-50 to-orange-100">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">MSSV</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Sinh viên</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Môn học</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Học kỳ</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">QT</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">GK</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">CK</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">TB</th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredGrades.length > 0 ? (
                filteredGrades.map((grade, index) => (
                  <motion.tr
                    key={grade.MaDiem}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-orange-50 transition-colors"
                  >
                    <td className="py-4 px-6 text-sm font-medium text-gray-800">{grade.MSSV}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{grade.TenSinhVien || 'N/A'}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{grade.TenMonHoc || 'N/A'}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{grade.HocKy}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{grade.DiemQuaTrinh || '-'}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{grade.DiemGiuaKy || '-'}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{grade.DiemCuoiKy || '-'}</td>
                    <td className="py-4 px-6 text-sm font-bold text-orange-600">{calculateAverage(grade)}</td>
                    <td className="py-4 px-6 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEdit(grade)}
                          className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(grade.MaDiem)}
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
                  <td colSpan="9" className="py-12 text-center text-gray-500">
                    Không tìm thấy điểm nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {editingGrade ? 'Cập nhật điểm' : 'Thêm điểm mới'}
              </h3>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </motion.button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sinh viên</label>
                  <select
                    value={formData.MSSV}
                    onChange={(e) => setFormData({ ...formData, MSSV: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                    required
                  >
                    <option value="">Chọn sinh viên</option>
                    {students.map((student) => (
                      <option key={student.MSSV} value={student.MSSV}>
                        {student.MSSV} - {student.HoTen}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Môn học</label>
                  <select
                    value={formData.MaMonHoc}
                    onChange={(e) => setFormData({ ...formData, MaMonHoc: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                    required
                  >
                    <option value="">Chọn môn học</option>
                    {subjects.map((subject) => (
                      <option key={subject.MaMonHoc} value={subject.MaMonHoc}>
                        {subject.TenMonHoc}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Học kỳ</label>
                  <select
                    value={formData.HocKy}
                    onChange={(e) => setFormData({ ...formData, HocKy: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                    required
                  >
                    <option value="">Chọn học kỳ</option>
                    <option value="HK1_2025_2026">HK1 2025-2026</option>
                    <option value="HK2_2025_2026">HK2 2025-2026</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Điểm quá trình (20%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.DiemQuaTrinh}
                    onChange={(e) => setFormData({ ...formData, DiemQuaTrinh: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Điểm giữa kỳ (30%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.DiemGiuaKy}
                    onChange={(e) => setFormData({ ...formData, DiemGiuaKy: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Điểm cuối kỳ (50%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.DiemCuoiKy}
                    onChange={(e) => setFormData({ ...formData, DiemCuoiKy: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all"
                >
                  {editingGrade ? 'Cập nhật' : 'Thêm mới'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleCloseModal}
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

export default GradeManagement;
