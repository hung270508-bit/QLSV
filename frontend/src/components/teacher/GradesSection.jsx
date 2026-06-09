import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Plus, Edit, Trash2, Search, X, Filter, XCircle, RefreshCw, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import axios from 'axios';

function GradesSection({ grades, teachingAssignments, students, user, onRefresh }) {
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradeData, setGradeData] = useState({});
  const [editingStudent, setEditingStudent] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [displaySearchTerm, setDisplaySearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ subjectFilter: '', semesterFilter: '' });
  const [displayFilters, setDisplayFilters] = useState({ subjectFilter: '', semesterFilter: '' });
  const [lophocphanList, setLophocphanList] = useState([]);
  const [notification, setNotification] = useState({ show: false, type: 'success', message: '' });
  const [validationError, setValidationError] = useState('');
  const [deleteModal, setDeleteModal] = useState({ show: false, maDiem: null, tenSinhVien: '', tenMonHoc: '' });

  const initialFormState = {
    MSSV: '', MaLopHocPhan: '', HocKy: '', DiemChuyenCan: '', DiemBaiTap: '', DiemGiuaKy: '', DiemCuoiKy: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (teachingAssignments?.length > 0) setLophocphanList(teachingAssignments);
  }, [teachingAssignments]);

  const myClasses = teachingAssignments.map(a => a.MaLop);
  const myLopHocPhans = teachingAssignments.map(a => a.MaLopHocPhan);
  const myStudents = students.filter(s => myClasses.includes(s.MaLop));
  const myGrades = grades.filter(g => 
    myStudents.map(s => s.MSSV).includes(g.MSSV) && myLopHocPhans.includes(g.MaLopHocPhan)
  );

  const calculateTotal10 = (cc, bt, gk, ck) => {
    return ((parseFloat(cc) || 0) * 0.1 + (parseFloat(bt) || 0) * 0.15 + (parseFloat(gk) || 0) * 0.25 + (parseFloat(ck) || 0) * 0.5).toFixed(2);
  };

  const convertToGPA = (total10) => {
    const total = parseFloat(total10);
    if (total >= 8.5) return { gpa: 4.0, letter: 'A', classification: 'Xuất sắc' };
    if (total >= 7.0) return { gpa: 3.5, letter: 'B', classification: 'Giỏi' };
    if (total >= 5.5) return { gpa: 3.0, letter: 'C', classification: 'Khá' };
    if (total >= 4.0) return { gpa: 2.0, letter: 'D', classification: 'Đạt' };
    return { gpa: 0.0, letter: 'F', classification: 'Không đạt' };
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: 'success', message: '' }), 3000);
  };

  const validateGradeInput = (value) => {
    // Check if the value is empty (allow empty for now, will validate on submit)
    if (value === '' || value === undefined || value === null) {
      return { valid: true, message: '' };
    }
    
    // Check for whitespace
    if (/\s/.test(value)) {
      return { valid: false, message: 'Không được nhập khoảng trắng' };
    }
    
    // Check for letters and special characters
    const regex = /^\d*\.?\d*$/;
    if (!regex.test(value)) {
      return { valid: false, message: 'Vui lòng nhập số từ 0 tới 10' };
    }
    
    // Check if the value is a valid number between 0 and 10
    const num = parseFloat(value);
    if (isNaN(num)) {
      return { valid: false, message: 'Vui lòng nhập số' };
    }
    
    if (num < 0) {
      return { valid: false, message: 'Không được nhập số âm' };
    }
    
    if (num > 10) {
      return { valid: false, message: 'Điểm tối đa là 10' };
    }
    
    return { valid: true, message: '' };
  };

  const handleGradeInputChange = (field, value) => {
    const validation = validateGradeInput(value);
    setValidationError(validation.message);
    setFormData({ ...formData, [field]: value });
  };

  const handleGradeChange = (mssv, field, value) => {
    const validation = validateGradeInput(value);
    setValidationError(validation.message);
    setGradeData(prev => ({ ...prev, [mssv]: { ...prev[mssv], [field]: value } }));
  };

  const handleEdit = (grade) => {
    setEditingGrade(grade);
    setFormData({
      MSSV: grade.MSSV, MaLopHocPhan: grade.MaLopHocPhan || '', HocKy: grade.HocKy,
      DiemChuyenCan: grade.DiemChuyenCan || '', DiemBaiTap: grade.DiemBaiTap || '',
      DiemGiuaKy: grade.DiemGiuaKy || '', DiemCuoiKy: grade.DiemCuoiKy || ''
    });
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setEditingGrade(null);
    setFormData(initialFormState);
    setValidationError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all grade fields before submission
    const gradeFields = ['DiemChuyenCan', 'DiemBaiTap', 'DiemGiuaKy', 'DiemCuoiKy'];
    for (const field of gradeFields) {
      const value = formData[field];
      if (value !== '' && value !== undefined && value !== null) {
        const validation = validateGradeInput(value);
        if (!validation.valid) {
          setValidationError(validation.message);
          return;
        }
      }
    }
    
    setValidationError('');
    
    try {
      const diemTong10 = calculateTotal10(formData.DiemChuyenCan, formData.DiemBaiTap, formData.DiemGiuaKy, formData.DiemCuoiKy);
      const gpaResult = convertToGPA(diemTong10);

      const payload = {
        ...formData,
        DiemChuyenCan: formData.DiemChuyenCan || null, DiemBaiTap: formData.DiemBaiTap || null,
        DiemGiuaKy: formData.DiemGiuaKy || null, DiemCuoiKy: formData.DiemCuoiKy || null,
        DiemTong: diemTong10, DiemGPA: gpaResult.gpa, DiemChu: gpaResult.letter, XepLoai: gpaResult.classification
      };

      if (editingGrade) {
        await axios.put(`/api/grades/${editingGrade.MaDiem}`, payload);
      } else {
        await axios.post('/api/grades', payload);
      }
      onRefresh();
      handleCloseAddModal();
      showNotification('success', editingGrade ? 'Cập nhật điểm thành công!' : 'Thêm điểm thành công!');
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'Lỗi khi lưu điểm!');
    }
  };

  const handleSaveGrades = async () => {
    try {
      const promises = Object.entries(gradeData).map(async ([mssv, data]) => {
        const total = calculateTotal10(data.DiemChuyenCan, data.DiemBaiTap, data.DiemGiuaKy, data.DiemCuoiKy);
        const gpaData = convertToGPA(total);
        const payload = {
          MSSV: mssv, MaLopHocPhan: selectedSubject.id, HocKy: data.HocKy,
          DiemChuyenCan: data.DiemChuyenCan || null, DiemBaiTap: data.DiemBaiTap || null,
          DiemGiuaKy: data.DiemGiuaKy || null, DiemCuoiKy: data.DiemCuoiKy || null,
          DiemTong: total, DiemGPA: gpaData.gpa, DiemChu: gpaData.letter, XepLoai: gpaData.classification
        };

        if (data.MaDiem) return axios.put(`/api/grades/${data.MaDiem}`, payload);
        if (data.DiemChuyenCan || data.DiemBaiTap || data.DiemGiuaKy || data.DiemCuoiKy) {
          return axios.post('/api/grades', payload);
        }
        return Promise.resolve();
      });

      await Promise.all(promises);
      showNotification('success', 'Lưu điểm thành công!');
      setShowGradeModal(false);
      setEditingStudent(null);
      onRefresh();
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'Lỗi khi lưu điểm!');
    }
  };

  const handleDeleteClick = (grade) => {
    setDeleteModal({ show: true, maDiem: grade.MaDiem, tenSinhVien: grade.TenSinhVien || grade.MSSV, tenMonHoc: grade.TenMonHoc || '' });
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/grades/${deleteModal.maDiem}`);
      setDeleteModal({ show: false, maDiem: null, tenSinhVien: '', tenMonHoc: '' });
      onRefresh();
      showNotification('success', 'Xóa điểm thành công!');
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'Lỗi khi xóa điểm!');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ show: false, maDiem: null, tenSinhVien: '', tenMonHoc: '' });
  };

  const filteredGrades = myGrades.filter(grade => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = grade.TenSinhVien?.toLowerCase().includes(term) || grade.MSSV?.toLowerCase().includes(term) || grade.TenMonHoc?.toLowerCase().includes(term);
    const matchesSubject = !filters.subjectFilter || grade.MaLopHocPhan === filters.subjectFilter;
    const matchesSemester = !filters.semesterFilter || grade.HocKy === filters.semesterFilter;
    return matchesSearch && matchesSubject && matchesSemester;
  });

  const clearFilters = () => {
    setFilters({ subjectFilter: '', semesterFilter: '' });
    setDisplayFilters({ subjectFilter: '', semesterFilter: '' });
    setSearchTerm('');
    setDisplaySearchTerm('');
  };

  const activeFilterCount = (filters.subjectFilter ? 1 : 0) + (filters.semesterFilter ? 1 : 0) + (searchTerm ? 1 : 0);
  const hasActiveFilters = filters.subjectFilter || filters.semesterFilter || searchTerm;

  // Helpers for reducing UI code
  const gradeFields = [
    { key: 'DiemChuyenCan', label: 'Chuyên cần (10%)' },
    { key: 'DiemBaiTap', label: 'Bài tập (15%)' },
    { key: 'DiemGiuaKy', label: 'Giữa kỳ (25%)' },
    { key: 'DiemCuoiKy', label: 'Cuối kỳ/Báo cáo (50%)' }
  ];

  const studentsToRender = editingStudent ? [editingStudent] : students.filter(s => s.MaLop === selectedClass?.id);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 shadow-xl flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Quản lý điểm sinh viên</h2>
          <p className="text-orange-100">Thêm, sửa, xóa điểm sinh viên</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-white text-orange-600 px-6 py-3 rounded-xl shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" /> Thêm điểm
        </motion.button>
      </motion.div>

      {/* Cụm Tìm kiếm & Lọc */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="space-y-4"
      >
        <div className="flex gap-3">
          <div className="relative w-2/3">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text" placeholder="Tìm kiếm điểm..." value={displaySearchTerm}
              onChange={(e) => setDisplaySearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-2.5 bg-white/80 backdrop-blur-xl border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-all shadow-lg"
            />
            <button type="button" onClick={() => setShowFilters(!showFilters)} className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${hasActiveFilters ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'}`}>
              <Filter className="w-5 h-5" />
              {activeFilterCount > 0 && (<span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{activeFilterCount}</span>)}
            </button>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setSearchTerm(displaySearchTerm)} className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-xl shadow-lg transition-all"><Search className="w-5 h-5" /> Tìm kiếm</motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onRefresh} className="flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-xl shadow-lg transition-all"><RefreshCw className="w-5 h-5" /> Làm mới</motion.button>
          {hasActiveFilters && (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={clearFilters} className="px-4 py-3 bg-red-100 text-red-600 rounded-xl font-semibold hover:bg-red-200 transition-colors flex items-center gap-2"><XCircle className="w-5 h-5" /> Xóa bộ lọc</motion.button>
          )}
        </div>

        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 space-y-4 relative z-50 w-2/3 shadow-xl border border-gray-100/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Lọc theo môn học</label>
                <select value={displayFilters.subjectFilter} onChange={(e) => setDisplayFilters({ ...displayFilters, subjectFilter: e.target.value })} className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-all">
                  <option value="">Tất cả môn học</option>
                  {teachingAssignments.map((ta, idx) => <option key={ta.MaLopHocPhan || idx} value={ta.MaLopHocPhan}>{ta.TenMonHoc}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Lọc theo học kỳ</label>
                <select value={displayFilters.semesterFilter} onChange={(e) => setDisplayFilters({ ...displayFilters, semesterFilter: e.target.value })} className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-all">
                  <option value="">Tất cả học kỳ</option>
                  <option value="HK1_2025_2026">HK1 2025-2026</option>
                  <option value="HK2_2025_2026">HK2 2025-2026</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setFilters({ ...displayFilters }); setShowFilters(false); }} className="flex-1 bg-orange-500 text-white py-2 rounded-xl font-bold hover:bg-orange-600 transition-colors">Áp dụng lọc</motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setDisplayFilters({ subjectFilter: '', semesterFilter: '' })} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-xl font-bold hover:bg-gray-300 transition-colors">Đặt lại</motion.button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Bảng Hiển thị Điểm */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-100/50 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-orange-50 to-amber-50">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">MSSV</th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">Sinh viên</th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">Môn học</th>
                <th className="text-center py-4 px-2 text-sm font-bold text-gray-700">CC (10%)</th>
                <th className="text-center py-4 px-2 text-sm font-bold text-gray-700">BT (15%)</th>
                <th className="text-center py-4 px-2 text-sm font-bold text-gray-700">GK (25%)</th>
                <th className="text-center py-4 px-2 text-sm font-bold text-gray-700">CK (50%)</th>
                <th className="text-center py-4 px-3 text-sm font-bold text-gray-800">Hệ 10</th>
                <th className="text-center py-4 px-3 text-sm font-bold text-orange-600">Hệ 4</th>
                <th className="text-center py-4 px-3 text-sm font-bold text-gray-700">Điểm chữ</th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredGrades.length > 0 ? (
                filteredGrades.map((grade, index) => {
                  const total10 = grade.DiemTong || calculateTotal10(grade.DiemChuyenCan, grade.DiemBaiTap, grade.DiemGiuaKy, grade.DiemCuoiKy);
                  const gpaData = convertToGPA(total10);
                  return (
                    <motion.tr key={grade.MaDiem || `grade-${index}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05, type: "spring" }} whileHover={{ x: 5, backgroundColor: "rgba(251, 146, 60, 0.05)" }} className="border-b border-gray-100 transition-all cursor-pointer">
                      <td className="py-4 px-4 text-sm font-bold text-gray-800">{grade.MSSV}</td>
                      <td className="py-4 px-4 text-sm text-gray-600">{grade.TenSinhVien || 'N/A'}</td>
                      <td className="py-4 px-4 text-sm text-gray-600 truncate max-w-[150px]">{grade.TenMonHoc || 'N/A'}</td>
                      <td className="py-4 px-2 text-sm text-center text-gray-600">{grade.DiemChuyenCan || '-'}</td>
                      <td className="py-4 px-2 text-sm text-center text-gray-600">{grade.DiemBaiTap || '-'}</td>
                      <td className="py-4 px-2 text-sm text-center text-gray-600">{grade.DiemGiuaKy || '-'}</td>
                      <td className="py-4 px-2 text-sm text-center text-gray-600">{grade.DiemCuoiKy || '-'}</td>
                      <td className="py-4 px-3 text-sm text-center font-bold text-gray-800">{grade.DiemTong || total10}</td>
                      <td className="py-4 px-3 text-sm text-center font-bold text-orange-600">{grade.DiemGPA || gpaData.gpa.toFixed(1)}</td>
                      <td className="py-4 px-3 text-sm text-center font-bold text-blue-600">{grade.DiemChu || gpaData.letter}</td>
                      <td className="py-4 px-4 text-sm">
                        <div className="flex items-center justify-center gap-2">
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleEdit(grade)} className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"><Edit className="w-4 h-4" /></motion.button>
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleDeleteClick(grade)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"><Trash2 className="w-4 h-4" /></motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr><td colSpan={11} className="py-16">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center text-gray-400"
                  >
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <GraduationCap className="w-10 h-10 text-gray-300" />
                    </div>
                    <p className="text-lg font-medium text-gray-600">Không tìm thấy điểm nào</p>
                  </motion.div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Modal Thêm/Sửa Điểm Đơn Lẻ */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/40"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">{editingGrade ? 'Cập nhật điểm' : 'Thêm điểm mới'}</h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCloseAddModal}
                  className="p-2.5 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </motion.button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sinh viên</label>
                  <select value={formData.MSSV} onChange={(e) => setFormData({ ...formData, MSSV: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500" required>
                    <option value="">Chọn sinh viên</option>
                    {myStudents.map((s) => <option key={s.MSSV} value={s.MSSV}>{s.MSSV} - {s.HoTen}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Lớp học phần</label>
                  <select value={formData.MaLopHocPhan || ''} onChange={(e) => setFormData({ ...formData, MaLopHocPhan: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500" required>
                    <option value="">Chọn lớp học phần</option>
                    {lophocphanList.map((lhp) => <option key={lhp.MaLopHocPhan} value={lhp.MaLopHocPhan}>{lhp.TenMonHoc} - {lhp.TenLop} ({lhp.HocKy})</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Học kỳ</label>
                  <select value={formData.HocKy} onChange={(e) => setFormData({ ...formData, HocKy: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500" required>
                    <option value="">Chọn học kỳ</option>
                    <option value="HK1_2025_2026">HK1 2025-2026</option>
                    <option value="HK2_2025_2026">HK2 2025-2026</option>
                  </select>
                </div>

                {gradeFields.map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{field.label}</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      min="0" 
                      max="10" 
                      value={formData[field.key]} 
                      onChange={(e) => handleGradeInputChange(field.key, e.target.value)} 
                      className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-all ${validationError ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'}`}
                    />
                  </div>
                ))}
              </div>

              {/* Validation Error Message */}
              {validationError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium"
                >
                  {validationError}
                </motion.div>
              )}

              {/* Tính toán hiển thị nhanh */}
              {(() => {
                const curTotal = calculateTotal10(formData.DiemChuyenCan, formData.DiemBaiTap, formData.DiemGiuaKy, formData.DiemCuoiKy);
                const curGPA = convertToGPA(curTotal);
                return (
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex justify-between mt-4">
                    <div><p className="text-sm text-gray-600 font-medium">Tạm tính Hệ 10:</p><p className="text-2xl font-bold text-gray-800">{curTotal}</p></div>
                    <div className="text-right"><p className="text-sm text-gray-600 font-medium">Quy đổi Hệ 4:</p><p className="text-2xl font-bold text-orange-600">{curGPA.gpa.toFixed(1)} <span className="text-lg text-blue-600 ml-2">({curGPA.letter})</span></p></div>
                  </div>
                )
              })()}

              <div className="flex gap-3 pt-4">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold shadow-lg">{editingGrade ? 'Cập nhật' : 'Thêm mới'}</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button" onClick={handleCloseAddModal} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300">Hủy</motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Cập nhật Danh sách Điểm (Nhập nhiều) */}
      {showGradeModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/10">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div><h3 className="text-xl font-bold text-gray-800">Nhập điểm</h3><p className="text-sm text-gray-500">{selectedSubject?.name} - {selectedClass?.name}</p></div>
              <button onClick={() => {setShowGradeModal(false); setValidationError('');}} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            {/* Validation Error Message */}
            {validationError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium mb-4"
              >
                {validationError}
              </motion.div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">MSSV</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Họ tên</th>
                    <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">CC(10%)</th>
                    <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">BT(15%)</th>
                    <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">GK(25%)</th>
                    <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">CK(50%)</th>
                    <th className="text-center py-3 px-3 text-sm font-bold text-gray-800">Hệ 10</th>
                    <th className="text-center py-3 px-3 text-sm font-bold text-orange-600">Hệ 4</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsToRender.map((student) => {
                    const stData = gradeData[student.MSSV] || {};
                    const t10 = calculateTotal10(stData.DiemChuyenCan, stData.DiemBaiTap, stData.DiemGiuaKy, stData.DiemCuoiKy);
                    const gpa = convertToGPA(t10);
                    return (
                      <tr key={student.MSSV} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-sm font-medium text-gray-800">{student.MSSV}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{student.HoTen}</td>
                        {gradeFields.map(field => (
                          <td key={field.key} className="py-3 px-2">
                            <input 
                              type="number" 
                              min="0" 
                              max="10" 
                              step="0.1" 
                              value={stData[field.key] || ''} 
                              onChange={(e) => handleGradeChange(student.MSSV, field.key, e.target.value)} 
                              className={`w-full px-3 py-2 border rounded-lg text-center focus:outline-none transition-all ${validationError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-orange-500'}`}
                            />
                          </td>
                        ))}
                        <td className="py-3 px-3 text-center font-bold text-gray-800">{t10}</td>
                        <td className="py-3 px-3 text-center font-bold text-orange-600">{gpa.gpa.toFixed(1)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 pt-6">
              <button onClick={handleSaveGrades} className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold shadow-lg">Lưu điểm</button>
              <button onClick={() => setShowGradeModal(false)} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác nhận Xóa */}
      <AnimatePresence>
        {deleteModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/40"
            onClick={handleDeleteCancel}
          >
            <motion.div
              initial={{ scale: 0.85, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-800 text-center mb-2">Xác nhận xóa điểm</h3>

              {/* Info */}
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5 text-center space-y-1">
                <p className="text-sm text-gray-600">
                  Bạn sắp xóa điểm của sinh viên
                </p>
                <p className="font-bold text-gray-800">{deleteModal.tenSinhVien}</p>
                {deleteModal.tenMonHoc && (
                  <p className="text-sm text-gray-500">Môn: <span className="font-semibold text-gray-700">{deleteModal.tenMonHoc}</span></p>
                )}
                <p className="text-xs text-red-500 font-medium mt-1">Hành động này không thể hoàn tác.</p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleDeleteCancel}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleDeleteConfirm}
                  className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold shadow-lg shadow-red-100 hover:from-red-600 hover:to-red-700 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Xóa điểm
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Thông báo Toast */}
      <AnimatePresence>
        {notification.show && (
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }} className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl text-white ${notification.type === 'success' ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`}>
            {notification.type === 'success' ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            <span className="font-semibold">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default GradesSection;