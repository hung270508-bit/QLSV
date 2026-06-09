import React, { useState, useEffect } from 'react';
import API_URL from '../../api';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Plus, Edit, Trash2, Search, X, Filter, XCircle, Download, FileText, BarChart3 } from 'lucide-react';
import axios from 'axios';
import ModalPortal from '../ModalPortal';

function GradeManagement() {
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [courseSections, setCourseSections] = useState([]);
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
    a: 0,
    bPlus: 0,
    b: 0,
    cPlus: 0,
    c: 0,
    dPlus: 0,
    d: 0,
    fPlus: 0,
    f: 0
  });

  // Cập nhật lại formData để khớp với các cột điểm mới
  const [formData, setFormData] = useState({
    MSSV: '',
    MaLopHocPhan: '',
    HocKy: '',
    DiemChuyenCan: '',
    DiemBaiTap: '',
    DiemGiuaKy: '',
    DiemCuoiKy: ''
  });
  const [formErrors, setFormErrors] = useState({});

useEffect(() => {
  fetchData(); 
}, []);

  const fetchData = async () => {
    try {
      const [gradesRes, studentsRes, courseSectionsRes, subjectsRes] = await Promise.all([
        axios.get(`${API_URL}/api/grades`),
        axios.get(`${API_URL}/api/students`),
        axios.get(`${API_URL}/api/course-sections`),
        axios.get(`${API_URL}/api/subjects`)
      ]);
      setGrades(gradesRes.data);
      setStudents(studentsRes.data);
      setCourseSections(courseSectionsRes.data);
      setSubjects(subjectsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Hàm tính điểm tổng hệ 10
  const calculateTotal10 = (cc, bt, gk, ck) => {
    const dcc = parseFloat(cc) || 0;
    const dbt = parseFloat(bt) || 0;
    const dgk = parseFloat(gk) || 0;
    const dck = parseFloat(ck) || 0;
    
    // 10% CC + 15% BT + 25% GK + 50% CK
    return ((dcc * 0.1) + (dbt * 0.15) + (dgk * 0.25) + (dck * 0.5)).toFixed(2);
  };

  // Hàm quy đổi sang hệ 4.0 và Điểm chữ
  const convertToGPA = (total10) => {
    const t = parseFloat(total10);
    if (t >= 8.5) return { letter: 'A', gpa: 4.0, text: 'Giỏi' };
    if (t >= 7.8) return { letter: 'B+', gpa: 3.5, text: 'Khá' };
    if (t >= 7.0) return { letter: 'B', gpa: 3.0, text: 'Khá' };
    if (t >= 6.3) return { letter: 'C+', gpa: 2.5, text: 'Trung bình' };
    if (t >= 5.5) return { letter: 'C', gpa: 2.0, text: 'Trung bình' };
    if (t >= 4.8) return { letter: 'D+', gpa: 1.5, text: 'Trung bình yếu' };
    if (t >= 4.0) return { letter: 'D', gpa: 1.0, text: 'Trung bình yếu' };
    if (t >= 3.0) return { letter: 'F+', gpa: 0.5, text: 'Kém' };
    return { letter: 'F', gpa: 0.0, text: 'Kém' };
  };

  const validateGradeForm = () => {
    const errors = {};
    if (!formData.MSSV) errors.MSSV = 'Vui lòng chọn sinh viên';
    if (!formData.MaLopHocPhan) errors.MaLopHocPhan = 'Vui lòng chọn lớp học phần';
    if (!formData.HocKy) errors.HocKy = 'Vui lòng chọn học kỳ';
    ['DiemChuyenCan','DiemBaiTap','DiemGiuaKy','DiemCuoiKy'].forEach(field => {
      const val = formData[field];
      if (val !== '' && val !== null && val !== undefined) {
        const num = parseFloat(val);
        if (isNaN(num) || num < 0 || num > 10) errors[field] = 'Điểm phải từ 0 đến 10';
      }
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateGradeForm()) return;
    try {
      // Tính toán trực tiếp ở FE trước khi gửi
      const diemTong10 = calculateTotal10(
        formData.DiemChuyenCan,
        formData.DiemBaiTap,
        formData.DiemGiuaKy,
        formData.DiemCuoiKy
      );
      const gpaResult = convertToGPA(diemTong10);

      // Đóng gói payload gửi về Backend
      const payload = {
        ...formData,
        DiemTong: diemTong10,
        DiemGPA: gpaResult.gpa,
        DiemChu: gpaResult.letter,
        XepLoai: gpaResult.text
      };

      if (editingGrade) {
        await axios.put(`${API_URL}/api/grades/${editingGrade.MaDiem}`, payload);
      } else {
        await axios.post(`${API_URL}/api/grades`, payload);
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
      MaLopHocPhan: grade.MaLopHocPhan,
      HocKy: grade.HocKy,
      DiemChuyenCan: grade.DiemChuyenCan || '',
      DiemBaiTap: grade.DiemBaiTap || '',
      DiemGiuaKy: grade.DiemGiuaKy || '',
      DiemCuoiKy: grade.DiemCuoiKy || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (maDiem) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa điểm này?')) {
      try {
        await axios.delete(`${API_URL}/api/grades/${maDiem}`);
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
      MaLopHocPhan: '',
      HocKy: '',
      DiemChuyenCan: '',
      DiemBaiTap: '',
      DiemGiuaKy: '',
      DiemCuoiKy: ''
    });
    setFormErrors({});
  };

  const filteredGrades = grades.filter(grade => {
    const matchesSearch = 
      grade.TenSinhVien?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grade.MSSV?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grade.TenMonHoc?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = !filters.subjectFilter || grade.MaLopHocPhan === filters.subjectFilter;
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

  // Calculate statistics
  const calculateGradeStatistics = () => {
    if (filteredGrades.length === 0) {
      setGradeStats({ total: 0, a: 0, bPlus: 0, b: 0, cPlus: 0, c: 0, dPlus: 0, d: 0, fPlus: 0, f: 0 });
      return;
    }

    const total = filteredGrades.length;
    let a = 0;
    let bPlus = 0;
    let b = 0;
    let cPlus = 0;
    let c = 0;
    let dPlus = 0;
    let d = 0;
    let fPlus = 0;
    let f = 0;

    filteredGrades.forEach(grade => {
      const total10 = calculateTotal10(grade.DiemChuyenCan, grade.DiemBaiTap, grade.DiemGiuaKy, grade.DiemCuoiKy);
      const t = parseFloat(total10);

      if (t >= 8.5) a++;
      else if (t >= 7.8) bPlus++;
      else if (t >= 7.0) b++;
      else if (t >= 6.3) cPlus++;
      else if (t >= 5.5) c++;
      else if (t >= 4.8) dPlus++;
      else if (t >= 4.0) d++;
      else if (t >= 3.0) fPlus++;
      else f++;
    });

    setGradeStats({
      total,
      a,
      bPlus,
      b,
      cPlus,
      c,
      dPlus,
      d,
      fPlus,
      f
    });
  };

  // Export grades to CSV
  const handleExportGrades = () => {
    const csvContent = [
      ['MSSV', 'Sinh viên', 'Môn học', 'Học kỳ', 'CC', 'BT', 'GK', 'CK', 'TB', 'GPA', 'Điểm chữ'],
      ...filteredGrades.map(g => {
        const total10 = calculateTotal10(g.DiemChuyenCan, g.DiemBaiTap, g.DiemGiuaKy, g.DiemCuoiKy);
        const gpaData = convertToGPA(total10);
        return [
          g.MSSV,
          g.TenSinhVien || 'N/A',
          g.TenMonHoc || g.MaMonHoc,
          g.HocKy,
          g.DiemChuyenCan || '-',
          g.DiemBaiTap || '-',
          g.DiemGiuaKy || '-',
          g.DiemCuoiKy || '-',
          g.DiemTong || total10,
          g.DiemGPA || gpaData.gpa.toFixed(1),
          g.DiemChu || gpaData.letter
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'diem.csv';
    link.click();
  };

  // Open bulk import modal
  const handleOpenBulkModal = () => {
    setBulkGrades(students.map(student => ({
      MSSV: student.MSSV,
      HoTen: student.HoTen,
      MaLopHocPhan: '',
      HocKy: '',
      DiemChuyenCan: '',
      DiemBaiTap: '',
      DiemGiuaKy: '',
      DiemCuoiKy: ''
    })));
    setShowBulkModal(true);
  };

  // Handle bulk import submit
  const handleBulkSubmit = async () => {
    const validGrades = bulkGrades.filter(g => g.MaLopHocPhan && g.HocKy);

    if (validGrades.length === 0) {
      alert('Vui lòng nhập môn học và học kỳ!');
      return;
    }

    try {
      // Calculate grades for each student
      const gradesWithCalculation = validGrades.map(g => {
        const diemTong10 = calculateTotal10(g.DiemChuyenCan, g.DiemBaiTap, g.DiemGiuaKy, g.DiemCuoiKy);
        const gpaResult = convertToGPA(diemTong10);
        return {
          ...g,
          DiemTong: diemTong10,
          DiemGPA: gpaResult.gpa,
          DiemChu: gpaResult.letter,
          XepLoai: gpaResult.text
        };
      });

      await axios.post(`${API_URL}/api/grades/bulk`, { grades: gradesWithCalculation });
      alert('Nhập điểm hàng loạt thành công!');
      setShowBulkModal(false);
      fetchData();
    } catch (error) {
      console.error('Error bulk inserting grades:', error);
      alert('Lỗi khi nhập điểm hàng loạt!');
    }
  };

  // Calculate statistics when filtered grades change
  useEffect(() => {
    calculateGradeStatistics();
  }, [filteredGrades]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 shadow-lg shadow-orange-200/50 flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl"><GraduationCap className="w-7 h-7 text-white" /></div>
          <div>
            <h2 className="text-xl font-bold text-white">Quản lý điểm sinh viên</h2>
            <p className="text-orange-100 text-sm mt-0.5">Thêm, sửa, xóa điểm sinh viên</p>
          </div>
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
      </motion.div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="relative w-2/3">
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
            className="bg-gray-50 rounded-xl p-4 space-y-4 relative z-50 w-2/3"
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
                  {courseSections.map((cs) => (
                    <option key={cs.MaLopHocPhan} value={cs.MaLopHocPhan}>
                      {cs.TenMonHoc} - {cs.TenLop}
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
            <div className="text-2xl font-bold text-green-600">{gradeStats.a}</div>
            <div className="text-sm text-gray-600">A (≥8.5)</div>
          </div>
          <div className="text-center p-4 bg-emerald-50 rounded-xl">
            <div className="text-2xl font-bold text-emerald-600">{gradeStats.bPlus}</div>
            <div className="text-sm text-gray-600">B+ (≥7.8)</div>
          </div>
          <div className="text-center p-4 bg-teal-50 rounded-xl">
            <div className="text-2xl font-bold text-teal-600">{gradeStats.b}</div>
            <div className="text-sm text-gray-600">B (≥7.0)</div>
          </div>
          <div className="text-center p-4 bg-cyan-50 rounded-xl">
            <div className="text-2xl font-bold text-cyan-600">{gradeStats.cPlus}</div>
            <div className="text-sm text-gray-600">C+ (≥6.3)</div>
          </div>
          <div className="text-center p-4 bg-sky-50 rounded-xl">
            <div className="text-2xl font-bold text-sky-600">{gradeStats.c}</div>
            <div className="text-sm text-gray-600">C (≥5.5)</div>
          </div>
          <div className="text-center p-4 bg-indigo-50 rounded-xl">
            <div className="text-2xl font-bold text-indigo-600">{gradeStats.dPlus}</div>
            <div className="text-sm text-gray-600">D+ (≥4.8)</div>
          </div>
          <div className="text-center p-4 bg-violet-50 rounded-xl">
            <div className="text-2xl font-bold text-violet-600">{gradeStats.d}</div>
            <div className="text-sm text-gray-600">D (≥4.0)</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-xl">
            <div className="text-2xl font-bold text-orange-600">{gradeStats.fPlus}</div>
            <div className="text-sm text-gray-600">F+ (≥3.0)</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-xl">
            <div className="text-2xl font-bold text-red-600">{gradeStats.f}</div>
            <div className="text-sm text-gray-600">F (&lt;3.0)</div>
          </div>
        </div>
      </motion.div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">MSSV</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Sinh viên</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Môn học</th>
                <th className="text-center py-4 px-2 text-sm font-semibold text-gray-700">CC<br/><span className="text-xs font-normal text-gray-500">(10%)</span></th>
                <th className="text-center py-4 px-2 text-sm font-semibold text-gray-700">BT<br/><span className="text-xs font-normal text-gray-500">(15%)</span></th>
                <th className="text-center py-4 px-2 text-sm font-semibold text-gray-700">GK<br/><span className="text-xs font-normal text-gray-500">(25%)</span></th>
                <th className="text-center py-4 px-2 text-sm font-semibold text-gray-700">CK<br/><span className="text-xs font-normal text-gray-500">(50%)</span></th>
                <th className="text-center py-4 px-3 text-sm font-bold text-gray-800">TB</th>
                <th className="text-center py-4 px-3 text-sm font-bold text-orange-600">GPA</th>
                <th className="text-center py-4 px-3 text-sm font-semibold text-gray-700">Xếp loại</th>
                <th className="text-center py-4 px-4 text-sm font-semibold text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredGrades.length > 0 ? (
                filteredGrades.map((grade, index) => {
                  // Gọi hàm tính toán realtime để render (Trường hợp DB chưa có các trường này)
                  const total10 = calculateTotal10(grade.DiemChuyenCan, grade.DiemBaiTap, grade.DiemGiuaKy, grade.DiemCuoiKy);
                  const gpaData = convertToGPA(total10);

                  return (
                    <motion.tr
                      key={grade.MaDiem}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 hover:bg-orange-50 transition-colors"
                    >
                      <td className="py-4 px-4 text-sm font-medium text-gray-800">{grade.MSSV}</td>
                      <td className="py-4 px-4 text-sm text-gray-600">{grade.TenSinhVien || 'N/A'}</td>
                      <td className="py-4 px-4 text-sm text-gray-600 truncate max-w-[150px]">{grade.TenMonHoc || 'N/A'}</td>
                      <td className="py-4 px-2 text-sm text-center text-gray-600">{grade.DiemChuyenCan || '-'}</td>
                      <td className="py-4 px-2 text-sm text-center text-gray-600">{grade.DiemBaiTap || '-'}</td>
                      <td className="py-4 px-2 text-sm text-center text-gray-600">{grade.DiemGiuaKy || '-'}</td>
                      <td className="py-4 px-2 text-sm text-center text-gray-600">{grade.DiemCuoiKy || '-'}</td>
                      <td className="py-4 px-3 text-sm text-center font-bold text-gray-800">{grade.DiemTong || total10}</td>
                      <td className="py-4 px-3 text-sm text-center font-bold text-orange-600">{grade.DiemGPA || gpaData.gpa.toFixed(1)}</td>
                      <td className="py-4 px-3 text-sm text-center font-semibold text-blue-600">{grade.DiemChu || gpaData.letter}</td>
                      <td className="py-4 px-4 text-sm">
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
                  );
                })
              ) : (
                <tr>
                  <td colSpan="11" className="py-12 text-center text-gray-500">
                    Không tìm thấy điểm nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm/Sửa */}
      {showModal && (
        <ModalPortal>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 flex justify-between items-center flex-shrink-0">
              <div className="text-white">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  {editingGrade ? 'Cập nhật điểm' : 'Thêm điểm mới'}
                </h3>
                <p className="text-orange-100 text-sm mt-0.5">
                  {editingGrade ? 'Chỉnh sửa điểm học phần' : 'Nhập điểm thành phần và xem quy đổi GPA'}
                </p>
              </div>
              <button onClick={handleCloseModal} className="p-2 hover:bg-white/20 rounded-lg text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sinh viên</label>
                  <select
                    value={formData.MSSV}
                    onChange={(e) => {
                      setFormData({ ...formData, MSSV: e.target.value });
                      if (formErrors.MSSV) setFormErrors(prev => ({ ...prev, MSSV: '' }));
                    }}
                    className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors ${formErrors.MSSV ? 'border-red-500' : 'border-gray-200 focus:border-orange-500'}`}
                    required
                  >
                    <option value="">Chọn sinh viên</option>
                    {students.map((student) => (
                      <option key={student.MSSV} value={student.MSSV}>
                        {student.MSSV} - {student.HoTen}
                      </option>
                    ))}
                  </select>
                  {formErrors.MSSV && <p className="text-red-500 text-xs mt-1">{formErrors.MSSV}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Lớp học phần</label>
                  <select
                    value={formData.MaLopHocPhan}
                    onChange={(e) => {
                      setFormData({ ...formData, MaLopHocPhan: e.target.value });
                      if (formErrors.MaLopHocPhan) setFormErrors(prev => ({ ...prev, MaLopHocPhan: '' }));
                    }}
                    className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors ${formErrors.MaLopHocPhan ? 'border-red-500' : 'border-gray-200 focus:border-orange-500'}`}
                    required
                  >
                    <option value="">Chọn lớp học phần</option>
                    {courseSections.map((cs) => (
                      <option key={cs.MaLopHocPhan} value={cs.MaLopHocPhan}>
                        {cs.TenMonHoc} - {cs.TenLop} - {cs.HocKy}
                      </option>
                    ))}
                  </select>
                  {formErrors.MaLopHocPhan && <p className="text-red-500 text-xs mt-1">{formErrors.MaLopHocPhan}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Học kỳ</label>
                  <select
                    value={formData.HocKy}
                    onChange={(e) => {
                      setFormData({ ...formData, HocKy: e.target.value });
                      if (formErrors.HocKy) setFormErrors(prev => ({ ...prev, HocKy: '' }));
                    }}
                    className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors ${formErrors.HocKy ? 'border-red-500' : 'border-gray-200 focus:border-orange-500'}`}
                    required
                  >
                    <option value="">Chọn học kỳ</option>
                    <option value="HK1_2025_2026">HK1 2025-2026</option>
                    <option value="HK2_2025_2026">HK2 2025-2026</option>
                  </select>
                  {formErrors.HocKy && <p className="text-red-500 text-xs mt-1">{formErrors.HocKy}</p>}
                </div>

                {/* Các trường nhập điểm mới */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Chuyên cần (10%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.DiemChuyenCan}
                    onChange={(e) => {
                      setFormData({ ...formData, DiemChuyenCan: e.target.value });
                      if (formErrors.DiemChuyenCan) setFormErrors(prev => ({ ...prev, DiemChuyenCan: '' }));
                    }}
                    className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors ${formErrors.DiemChuyenCan ? 'border-red-500' : 'border-gray-200 focus:border-orange-500'}`}
                  />
                  {formErrors.DiemChuyenCan && <p className="text-red-500 text-xs mt-1">{formErrors.DiemChuyenCan}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Bài tập (15%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.DiemBaiTap}
                    onChange={(e) => {
                      setFormData({ ...formData, DiemBaiTap: e.target.value });
                      if (formErrors.DiemBaiTap) setFormErrors(prev => ({ ...prev, DiemBaiTap: '' }));
                    }}
                    className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors ${formErrors.DiemBaiTap ? 'border-red-500' : 'border-gray-200 focus:border-orange-500'}`}
                  />
                  {formErrors.DiemBaiTap && <p className="text-red-500 text-xs mt-1">{formErrors.DiemBaiTap}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Giữa kỳ (25%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.DiemGiuaKy}
                    onChange={(e) => {
                      setFormData({ ...formData, DiemGiuaKy: e.target.value });
                      if (formErrors.DiemGiuaKy) setFormErrors(prev => ({ ...prev, DiemGiuaKy: '' }));
                    }}
                    className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors ${formErrors.DiemGiuaKy ? 'border-red-500' : 'border-gray-200 focus:border-orange-500'}`}
                  />
                  {formErrors.DiemGiuaKy && <p className="text-red-500 text-xs mt-1">{formErrors.DiemGiuaKy}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Cuối kỳ/Báo cáo (50%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.DiemCuoiKy}
                    onChange={(e) => {
                      setFormData({ ...formData, DiemCuoiKy: e.target.value });
                      if (formErrors.DiemCuoiKy) setFormErrors(prev => ({ ...prev, DiemCuoiKy: '' }));
                    }}
                    className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors ${formErrors.DiemCuoiKy ? 'border-red-500' : 'border-gray-200 focus:border-orange-500'}`}
                  />
                  {formErrors.DiemCuoiKy && <p className="text-red-500 text-xs mt-1">{formErrors.DiemCuoiKy}</p>}
                </div>
              </div>

              {/* Box Preview điểm tạm tính */}
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-center justify-between mt-4">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Tạm tính Hệ 10:</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {calculateTotal10(formData.DiemChuyenCan, formData.DiemBaiTap, formData.DiemGiuaKy, formData.DiemCuoiKy)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 font-medium">Quy đổi GPA:</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {convertToGPA(calculateTotal10(formData.DiemChuyenCan, formData.DiemBaiTap, formData.DiemGiuaKy, formData.DiemCuoiKy)).gpa.toFixed(1)} 
                    <span className="text-lg text-blue-600 ml-2">
                      ({convertToGPA(calculateTotal10(formData.DiemChuyenCan, formData.DiemBaiTap, formData.DiemGiuaKy, formData.DiemCuoiKy)).letter})
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-lg"
                >
                  {editingGrade ? 'Lưu thay đổi' : 'Thêm điểm'}
                </button>
              </div>
            </form>
          </motion.div>
          </motion.div>
        </ModalPortal>
      )}

      {/* Bulk Edit Modal */}
      {showBulkModal && (
        <ModalPortal>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/40"
          >
            <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
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
                      <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">CC<br/><span className="text-xs font-normal text-gray-500">(10%)</span></th>
                      <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">BT<br/><span className="text-xs font-normal text-gray-500">(15%)</span></th>
                      <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">GK<br/><span className="text-xs font-normal text-gray-500">(25%)</span></th>
                      <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">CK<br/><span className="text-xs font-normal text-gray-500">(50%)</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkGrades.map((grade, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-sm font-medium text-gray-800">{grade.MSSV}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{grade.HoTen}</td>
                        <td className="py-3 px-2">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={grade.DiemChuyenCan}
                            onChange={(e) => {
                              const newGrades = [...bulkGrades];
                              newGrades[index].DiemChuyenCan = e.target.value;
                              setBulkGrades(newGrades);
                            }}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={grade.DiemBaiTap}
                            onChange={(e) => {
                              const newGrades = [...bulkGrades];
                              newGrades[index].DiemBaiTap = e.target.value;
                              setBulkGrades(newGrades);
                            }}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                          />
                        </td>
                        <td className="py-3 px-2">
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
                        <td className="py-3 px-2">
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
          </motion.div>
        </ModalPortal>
      )}
    </div>
  );
}

export default GradeManagement;