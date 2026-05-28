import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Plus, Edit, Trash2, Search, X, Filter, XCircle, Download, BarChart3, FileText } from 'lucide-react';
import axios from 'axios';

function GradeManagement() {
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [displaySearchTerm, setDisplaySearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    subjectFilter: '',
    semesterFilter: ''
  });
  const [displayFilters, setDisplayFilters] = useState({
    subjectFilter: '',
    semesterFilter: ''
  });
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkGrades, setBulkGrades] = useState([]);
  const [gradeStats, setGradeStats] = useState({
    total: 0,
    average: 0,
    excellent: 0,
    good: 0,
    averageGrade: 0,
    fail: 0
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

  const handleSearch = () => {
    setSearchTerm(displaySearchTerm);
  };

  const handleApplyFilters = () => {
    setFilters({ ...displayFilters });
    setShowFilters(false);
  };


  const clearFilters = () => {
    setFilters({ subjectFilter: '', semesterFilter: '' });
    setDisplayFilters({ subjectFilter: '', semesterFilter: '' });
    setSearchTerm('');
    setDisplaySearchTerm('');
  };

  const activeFilterCount = (filters.subjectFilter ? 1 : 0) + (filters.semesterFilter ? 1 : 0) + (searchTerm ? 1 : 0);
  const hasActiveFilters = filters.subjectFilter || filters.semesterFilter || searchTerm;

  const calculateAverage = (grade) => {
    const qt = parseFloat(grade.DiemQuaTrinh) || 0;
    const gk = parseFloat(grade.DiemGiuaKy) || 0;
    const ck = parseFloat(grade.DiemCuoiKy) || 0;
    return ((qt * 0.2) + (gk * 0.3) + (ck * 0.5)).toFixed(2);
  };

  const calculateLetterGrade = (average) => {
    const avg = parseFloat(average);
    if (avg >= 8.5) return 'A';
    if (avg >= 7.0) return 'B';
    if (avg >= 5.5) return 'C';
    if (avg >= 4.0) return 'D';
    return 'F';
  };

  const calculateGradeStatistics = () => {
    if (filteredGrades.length === 0) {
      setGradeStats({ total: 0, average: 0, excellent: 0, good: 0, averageGrade: 0, fail: 0 });
      return;
    }

    const total = filteredGrades.length;
    let sum = 0;
    let excellent = 0;
    let good = 0;
    let averageGrade = 0;
    let fail = 0;

    filteredGrades.forEach(grade => {
      const avg = parseFloat(calculateAverage(grade));
      sum += avg;
      
      if (avg >= 8.5) excellent++;
      else if (avg >= 7.0) good++;
      else if (avg >= 5.5) averageGrade++;
      else if (avg >= 4.0) averageGrade++;
      else fail++;
    });

    setGradeStats({
      total,
      average: (sum / total).toFixed(2),
      excellent,
      good,
      averageGrade,
      fail
    });
  };

  const handleExportGrades = () => {
    const csvContent = [
      ['MSSV', 'Môn học', 'Học kỳ', 'QT', 'GK', 'CK', 'TB', 'Điểm chữ'],
      ...filteredGrades.map(g => [
        g.MSSV,
        g.TenMonHoc || g.MaMonHoc,
        g.HocKy,
        g.DiemQuaTrinh || '-',
        g.DiemGiuaKy || '-',
        g.DiemCuoiKy || '-',
        calculateAverage(g),
        calculateLetterGrade(calculateAverage(g))
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'diem.csv';
    link.click();
  };

  const handleOpenBulkModal = () => {
    setBulkGrades(students.map(student => ({
      MSSV: student.MSSV,
      HoTen: student.HoTen,
      MaMonHoc: '',
      HocKy: '',
      DiemQuaTrinh: '',
      DiemGiuaKy: '',
      DiemCuoiKy: ''
    })));
    setShowBulkModal(true);
  };

  const handleBulkSubmit = async () => {
    const validGrades = bulkGrades.filter(g => g.MaMonHoc && g.HocKy);
    
    if (validGrades.length === 0) {
      alert('Vui lòng nhập môn học và học kỳ!');
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/grades/bulk', { grades: validGrades });
      alert('Nhập điểm hàng loạt thành công!');
      setShowBulkModal(false);
      fetchData();
    } catch (error) {
      console.error('Error bulk inserting grades:', error);
      alert('Lỗi khi nhập điểm hàng loạt!');
    }
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
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenBulkModal}
            className="flex items-center gap-2 bg-purple-500 text-white px-6 py-3 rounded-xl shadow-lg transition-all"
          >
            <FileText className="w-5 h-5" />
            Nhập hàng loạt
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportGrades}
            className="flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg transition-all"
          >
            <Download className="w-5 h-5" />
            Export
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Thêm điểm
          </motion.button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="relative w-1/2">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm điểm..."
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
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSearch}
            className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-xl shadow-lg transition-all"
          >
            <Search className="w-5 h-5" />
            Tìm kiếm
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
            className="bg-gray-50 rounded-xl p-4 space-y-4 relative z-50 w-1/2"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lọc theo môn học</label>
                <select
                  value={displayFilters.subjectFilter}
                  onChange={(e) => setDisplayFilters({ ...displayFilters, subjectFilter: e.target.value })}
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
                  value={displayFilters.semesterFilter}
                  onChange={(e) => setDisplayFilters({ ...displayFilters, semesterFilter: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                >
                  <option value="">Tất cả học kỳ</option>
                  <option value="HK1_2025_2026">HK1 2025-2026</option>
                  <option value="HK2_2025_2026">HK2 2025-2026</option>
                </select>
              </div>
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
                onClick={() => setDisplayFilters({ subjectFilter: '', semesterFilter: '' })}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Đặt lại
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
      >
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-bold text-gray-800">Thống kê điểm</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <div className="text-2xl font-bold text-blue-600">{filteredGrades.length}</div>
            <div className="text-sm text-gray-600">Tổng điểm</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <div className="text-2xl font-bold text-green-600">
              {filteredGrades.length > 0 
                ? (filteredGrades.reduce((sum, g) => sum + parseFloat(calculateAverage(g)), 0) / filteredGrades.length).toFixed(2)
                : 0}
            </div>
            <div className="text-sm text-gray-600">Điểm TB</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-xl">
            <div className="text-2xl font-bold text-purple-600">
              {filteredGrades.filter(g => parseFloat(calculateAverage(g)) >= 8.5).length}
            </div>
            <div className="text-sm text-gray-600">Giỏi (A)</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-xl">
            <div className="text-2xl font-bold text-yellow-600">
              {filteredGrades.filter(g => parseFloat(calculateAverage(g)) >= 7.0 && parseFloat(calculateAverage(g)) < 8.5).length}
            </div>
            <div className="text-sm text-gray-600">Khá (B)</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-xl">
            <div className="text-2xl font-bold text-red-600">
              {filteredGrades.filter(g => parseFloat(calculateAverage(g)) < 4.0).length}
            </div>
            <div className="text-sm text-gray-600">Rớt (F)</div>
          </div>
        </div>
      </motion.div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">MSSV</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Sinh viên</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Môn học</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Học kỳ</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">QT</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">GK</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">CK</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">TB</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Điểm chữ</th>
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
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        calculateLetterGrade(calculateAverage(grade)) === 'A' ? 'bg-green-100 text-green-600' :
                        calculateLetterGrade(calculateAverage(grade)) === 'B' ? 'bg-blue-100 text-blue-600' :
                        calculateLetterGrade(calculateAverage(grade)) === 'C' ? 'bg-yellow-100 text-yellow-600' :
                        calculateLetterGrade(calculateAverage(grade)) === 'D' ? 'bg-orange-100 text-orange-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {calculateLetterGrade(calculateAverage(grade))}
                      </span>
                    </td>
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
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
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

      {/* Bulk Edit Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Nhập điểm hàng loạt</h3>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowBulkModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </motion.button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Môn học</label>
                  <select
                    value={bulkGrades[0]?.MaMonHoc || ''}
                    onChange={(e) => setBulkGrades(bulkGrades.map(g => ({ ...g, MaMonHoc: e.target.value })))}
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
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Học kỳ</label>
                  <select
                    value={bulkGrades[0]?.HocKy || ''}
                    onChange={(e) => setBulkGrades(bulkGrades.map(g => ({ ...g, HocKy: e.target.value })))}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                    required
                  >
                    <option value="">Chọn học kỳ</option>
                    <option value="HK1_2025_2026">HK1 2025-2026</option>
                    <option value="HK2_2025_2026">HK2 2025-2026</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">MSSV</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Họ tên</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">QT</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">GK</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">CK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkGrades.map((grade, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-sm font-medium text-gray-800">{grade.MSSV}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{grade.HoTen}</td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={grade.DiemQuaTrinh}
                            onChange={(e) => {
                              const newGrades = [...bulkGrades];
                              newGrades[index].DiemQuaTrinh = e.target.value;
                              setBulkGrades(newGrades);
                            }}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={grade.DiemGiuaKy}
                            onChange={(e) => {
                              const newGrades = [...bulkGrades];
                              newGrades[index].DiemGiuaKy = e.target.value;
                              setBulkGrades(newGrades);
                            }}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={grade.DiemCuoiKy}
                            onChange={(e) => {
                              const newGrades = [...bulkGrades];
                              newGrades[index].DiemCuoiKy = e.target.value;
                              setBulkGrades(newGrades);
                            }}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBulkSubmit}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 rounded-xl font-semibold shadow-lg transition-all"
                >
                  Lưu tất cả
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowBulkModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Hủy
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default GradeManagement;
