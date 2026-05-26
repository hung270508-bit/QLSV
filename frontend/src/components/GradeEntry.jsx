import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Search, BookOpen, User, Filter, Edit2, Trash2, Plus, Eye, TrendingUp, Award, X } from 'lucide-react';
import axios from 'axios';

function GradeEntry() {
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [semester, setSemester] = useState('');
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState({});
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [allGrades, setAllGrades] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [editingGrade, setEditingGrade] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const semesters = ['HK1', 'HK2', 'HK3'];

  useEffect(() => {
    fetchClasses();
    fetchSubjects();
    fetchAllGrades();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSubject && semester) {
      fetchStudents();
    }
  }, [selectedClass, selectedSubject, semester]);

  const fetchClasses = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/classes');
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/subjects');
      setSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchAllGrades = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/grades');
      setAllGrades(response.data);
    } catch (error) {
      console.error('Error fetching all grades:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const maMonHoc = selectedSubject.split(' - ')[0];
      const response = await axios.get('http://localhost:5000/api/grades', {
        params: { MaLop: selectedClass, MaMonHoc: maMonHoc, HocKy: semester }
      });
      
      if (response.data.length > 0) {
        setStudents(response.data);
        const initialGrades = {};
        response.data.forEach(student => {
          initialGrades[student.MSSV] = {
            DiemGiuaKy: student.DiemGiuaKy || '',
            DiemCuoiKy: student.DiemCuoiKy || ''
          };
        });
        setGrades(initialGrades);
      } else {
        const studentsResponse = await axios.get('http://localhost:5000/api/students');
        const classStudents = studentsResponse.data.filter(s => s.MaLop === selectedClass);
        setStudents(classStudents);
        
        const initialGrades = {};
        classStudents.forEach(student => {
          initialGrades[student.MSSV] = {
            DiemGiuaKy: '',
            DiemCuoiKy: ''
          };
        });
        setGrades(initialGrades);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleGradeChange = (mssv, field, value) => {
    setGrades(prev => ({
      ...prev,
      [mssv]: {
        ...prev[mssv],
        [field]: value
      }
    }));
  };

  const calculateFinalGrade = (diemGiuaKy, diemCuoiKy) => {
    const dgk = parseFloat(diemGiuaKy) || 0;
    const dck = parseFloat(diemCuoiKy) || 0;
    return (dgk * 0.4 + dck * 0.6).toFixed(2);
  };

  const handleSave = async () => {
    try {
      const maMonHoc = selectedSubject.split(' - ')[0];
      const gradesArray = Object.keys(grades).map(mssv => ({
        MSSV: mssv,
        MaMonHoc: maMonHoc,
        HocKy: semester,
        DiemGiuaKy: grades[mssv].DiemGiuaKy || null,
        DiemCuoiKy: grades[mssv].DiemCuoiKy || null
      }));

      await axios.post('http://localhost:5000/api/grades', { grades: gradesArray });
      alert('Đã lưu điểm thành công!');
      fetchAllGrades();
    } catch (error) {
      console.error('Error saving grades:', error);
      alert('Lỗi khi lưu điểm!');
    }
  };

  const handleEditGrade = (grade) => {
    setEditingGrade(grade);
    setShowEditModal(true);
  };

  const handleUpdateGrade = async () => {
    try {
      const gradesArray = [{
        MSSV: editingGrade.MSSV,
        MaMonHoc: editingGrade.MaMonHoc,
        HocKy: editingGrade.HocKy,
        DiemGiuaKy: editingGrade.DiemGiuaKy || null,
        DiemCuoiKy: editingGrade.DiemCuoiKy || null
      }];

      await axios.post('http://localhost:5000/api/grades', { grades: gradesArray });
      alert('Cập nhật điểm thành công!');
      setShowEditModal(false);
      fetchAllGrades();
    } catch (error) {
      console.error('Error updating grade:', error);
      alert('Lỗi khi cập nhật điểm!');
    }
  };

  const handleDeleteGrade = async (grade) => {
    if (!confirm('Bạn có chắc chắn muốn xóa điểm này?')) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/grades/${grade.MaDiem}`);
      alert('Xóa điểm thành công!');
      fetchAllGrades();
    } catch (error) {
      console.error('Error deleting grade:', error);
      alert('Lỗi khi xóa điểm!');
    }
  };

  const getGradeColor = (grade) => {
    const finalGrade = parseFloat(grade);
    if (finalGrade >= 8.5) return 'bg-green-100 text-green-700 border-green-200';
    if (finalGrade >= 7.0) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (finalGrade >= 5.5) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (finalGrade >= 4.0) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  const filteredGrades = allGrades.filter(grade => {
    const matchesSearch = grade.HoTen?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         grade.MSSV?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !filterClass || grade.MaLop === filterClass;
    const matchesSubject = !filterSubject || grade.MaMonHoc === filterSubject;
    const matchesSemester = !filterSemester || grade.HocKy === filterSemester;
    
    return matchesSearch && matchesClass && matchesSubject && matchesSemester;
  });

  const stats = {
    totalGrades: allGrades.length,
    averageGrade: allGrades.reduce((acc, g) => acc + (parseFloat(g.DiemTongKet) || 0), 0) / allGrades.length || 0,
    excellentCount: allGrades.filter(g => parseFloat(g.DiemTongKet) >= 8.5).length,
    passCount: allGrades.filter(g => parseFloat(g.DiemTongKet) >= 4.0).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Quản lý điểm</h2>
          <p className="text-gray-500 mt-1">Nhập và quản lý điểm sinh viên</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowEntryModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-200 transition-all"
        >
          <Plus className="w-5 h-5" />
          Nhập điểm
        </motion.button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-xl shadow-orange-100/50 border border-orange-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Tổng số điểm</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalGrades}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-xl shadow-orange-100/50 border border-orange-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Điểm trung bình</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.averageGrade.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-xl shadow-orange-100/50 border border-orange-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Giỏi (≥8.5)</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.excellentCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-xl shadow-orange-100/50 border border-orange-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Đạt (≥4.0)</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.passCount}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-xl shadow-orange-100/50 border border-orange-100"
      >
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-bold text-gray-800">Tìm kiếm & Lọc</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Tìm kiếm</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên hoặc MSSV..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Lớp</label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
            >
              <option value="">Tất cả</option>
              {classes.map(cls => (
                <option key={cls.MaLop} value={cls.MaLop}>{cls.TenLop}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Môn học</label>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
            >
              <option value="">Tất cả</option>
              {subjects.map(sub => (
                <option key={sub.MaMonHoc} value={sub.MaMonHoc}>{sub.TenMonHoc} ({sub.MaMonHoc})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Học kỳ</label>
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
            >
              <option value="">Tất cả</option>
              {semesters.map(sem => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Grades List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl shadow-orange-100/50 border border-orange-100 overflow-hidden"
      >
        <div className="p-6 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Danh sách điểm ({filteredGrades.length})</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-orange-50 to-orange-100/50">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">MSSV</th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">Họ tên</th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">Môn học</th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">Học kỳ</th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">Giữa kỳ</th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">Cuối kỳ</th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">Tổng kết</th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredGrades.map((grade, index) => (
                <motion.tr
                  key={grade.MaDiem}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-b border-orange-50 hover:bg-orange-50/50 transition-colors"
                >
                  <td className="py-4 px-6 text-sm text-gray-800 font-semibold">{grade.MSSV}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{grade.HoTen}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    <div className="flex flex-col">
                      <span className="font-medium">{grade.TenMonHoc || grade.MaMonHoc}</span>
                      <span className="text-xs text-gray-400">{grade.MaMonHoc}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                      {grade.HocKy}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">{grade.DiemGiuaKy || '-'}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{grade.DiemCuoiKy || '-'}</td>
                  <td className="py-4 px-6">
                    <span className={`px-4 py-2 rounded-lg font-bold border ${getGradeColor(grade.DiemTongKet)}`}>
                      {grade.DiemTongKet || '-'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEditGrade(grade)}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteGrade(grade)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredGrades.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-orange-500" />
            </div>
            <p className="text-gray-500 font-medium">Không tìm thấy kết quả</p>
          </div>
        )}
      </motion.div>

      {/* Entry Modal */}
      <AnimatePresence>
        {showEntryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEntryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-orange-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Nhập điểm sinh viên</h3>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowEntryModal(false)}
                  className="p-2 hover:bg-orange-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </motion.button>
              </div>
              <div className="p-6 space-y-6">
                {/* Filters */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-orange-500" />
                    <h3 className="text-lg font-bold text-gray-800">Bộ lọc</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1.5">Lớp học</label>
                      <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                      >
                        <option value="">Chọn lớp</option>
                        {classes.map(cls => (
                          <option key={cls.MaLop} value={cls.MaLop}>{cls.TenLop}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1.5">Môn học</label>
                      <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                      >
                        <option value="">Chọn môn học</option>
                        {subjects.map(sub => (
                          <option key={sub.MaMonHoc} value={`${sub.MaMonHoc} - ${sub.TenMonHoc}`}>
                            {sub.MaMonHoc} - {sub.TenMonHoc}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1.5">Học kỳ</label>
                      <select
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                      >
                        <option value="">Chọn học kỳ</option>
                        {semesters.map(sem => (
                          <option key={sem} value={sem}>{sem}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Grades Table */}
                {students.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-800">Bảng điểm sinh viên</h3>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md transition-all"
                      >
                        <Save className="w-4 h-4" />
                        Lưu điểm
                      </motion.button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">MSSV</th>
                            <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Họ tên</th>
                            <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Điểm giữa kỳ</th>
                            <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Điểm cuối kỳ</th>
                            <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Điểm tổng kết</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map((student, index) => (
                            <tr
                              key={student.MSSV}
                              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                            >
                              <td className="py-3 px-4 text-sm text-gray-800 font-semibold">{student.MSSV}</td>
                              <td className="py-3 px-4 text-sm text-gray-600">{student.HoTen}</td>
                              <td className="py-3 px-4">
                                <input
                                  type="number"
                                  min="0"
                                  max="10"
                                  step="0.1"
                                  value={grades[student.MSSV]?.DiemGiuaKy || ''}
                                  onChange={(e) => handleGradeChange(student.MSSV, 'DiemGiuaKy', e.target.value)}
                                  className="w-20 px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                                  placeholder="0-10"
                                />
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  type="number"
                                  min="0"
                                  max="10"
                                  step="0.1"
                                  value={grades[student.MSSV]?.DiemCuoiKy || ''}
                                  onChange={(e) => handleGradeChange(student.MSSV, 'DiemCuoiKy', e.target.value)}
                                  className="w-20 px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                                  placeholder="0-10"
                                />
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-3 py-1.5 rounded-lg font-bold border ${getGradeColor(calculateFinalGrade(grades[student.MSSV]?.DiemGiuaKy, grades[student.MSSV]?.DiemCuoiKy))}`}>
                                  {calculateFinalGrade(grades[student.MSSV]?.DiemGiuaKy, grades[student.MSSV]?.DiemCuoiKy)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {students.length === 0 && selectedClass && selectedSubject && semester && (
                  <div className="bg-white rounded-2xl p-12 shadow-lg border border-gray-200 text-center">
                    <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="w-10 h-10 text-orange-500" />
                    </div>
                    <p className="text-gray-500 font-medium">Không có sinh viên trong lớp này</p>
                  </div>
                )}

                {!selectedClass || !selectedSubject || !semester && (
                  <div className="bg-white rounded-2xl p-12 shadow-lg border border-gray-200 text-center">
                    <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Filter className="w-10 h-10 text-orange-500" />
                    </div>
                    <p className="text-gray-500 font-medium">Vui lòng chọn lớp, môn học và học kỳ để nhập điểm</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && editingGrade && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-800 mb-6">Chỉnh sửa điểm</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Sinh viên</label>
                  <input
                    type="text"
                    value={`${editingGrade.MSSV} - ${editingGrade.HoTen}`}
                    disabled
                    className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Môn học</label>
                  <input
                    type="text"
                    value={`${editingGrade.MaMonHoc} - ${editingGrade.TenMonHoc || ''}`}
                    disabled
                    className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-600 mb-4"
                  />
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Điểm giữa kỳ</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={editingGrade.DiemGiuaKy || ''}
                    onChange={(e) => setEditingGrade({ ...editingGrade, DiemGiuaKy: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Điểm cuối kỳ</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={editingGrade.DiemCuoiKy || ''}
                    onChange={(e) => setEditingGrade({ ...editingGrade, DiemCuoiKy: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpdateGrade}
                  className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
                >
                  Cập nhật
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default GradeEntry;
