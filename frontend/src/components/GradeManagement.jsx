import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Search, X, Filter, RefreshCw, FileUp, FileDown, BarChart2 } from 'lucide-react';
import axios from 'axios';

function GradeManagement() {
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States cho Modal Thêm/Sửa 1 điểm
  const [showModal, setShowModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const [formData, setFormData] = useState({
    MSSV: '', MaMonHoc: '', HocKy: '', DiemChuyenCan: '', DiemBaiTap: '', DiemGiuaKy: '', DiemCuoiKy: ''
  });

  // States cho Modal Nhập Hàng Loạt
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkSubject, setBulkSubject] = useState('');
  const [bulkSemester, setBulkSemester] = useState('');
  const [bulkGrades, setBulkGrades] = useState([]);
  const [isSavingBulk, setIsSavingBulk] = useState(false);

  // States Tìm kiếm & Lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [displaySearchTerm, setDisplaySearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ subjectFilter: '', semesterFilter: '' });
  const [displayFilters, setDisplayFilters] = useState({ subjectFilter: '', semesterFilter: '' });

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

  // Logic Tính toán
  const calculateTotal10 = (cc, bt, gk, ck) => {
    const dcc = parseFloat(cc) || 0;
    const dbt = parseFloat(bt) || 0;
    const dgk = parseFloat(gk) || 0;
    const dck = parseFloat(ck) || 0;
    return ((dcc * 0.1) + (dbt * 0.15) + (dgk * 0.25) + (dck * 0.5)).toFixed(2);
  };

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

  // Xử lý Lọc dữ liệu
  const filteredGrades = grades.filter(grade => {
    const matchesSearch = 
      grade.TenSinhVien?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grade.MSSV?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grade.TenMonHoc?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = !filters.subjectFilter || grade.MaMonHoc === filters.subjectFilter;
    const matchesSemester = !filters.semesterFilter || grade.HocKy === filters.semesterFilter;
    return matchesSearch && matchesSubject && matchesSemester;
  });

  // ==========================================
  // THỐNG KÊ DỮ LIỆU ĐIỂM CHỮ
  // ==========================================
  const totalGradesCount = filteredGrades.length;

  const countGrades = {
    'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'D+': 0, 'D': 0, 'F+': 0, 'F': 0
  };

  filteredGrades.forEach(g => {
    if (g.DiemChu && countGrades[g.DiemChu] !== undefined) {
      countGrades[g.DiemChu]++;
    }
  });

  const statCards = [
    { label: 'A', value: countGrades['A'], color: 'text-purple-600', bg: 'bg-purple-50/50', border: 'border-purple-100' },
    { label: 'B+', value: countGrades['B+'], color: 'text-indigo-500', bg: 'bg-indigo-50/50', border: 'border-indigo-100' },
    { label: 'B', value: countGrades['B'], color: 'text-blue-500', bg: 'bg-blue-50/50', border: 'border-blue-100' },
    { label: 'C+', value: countGrades['C+'], color: 'text-cyan-600', bg: 'bg-cyan-50/50', border: 'border-cyan-100' },
    { label: 'C', value: countGrades['C'], color: 'text-teal-500', bg: 'bg-teal-50/50', border: 'border-teal-100' },
    { label: 'D+', value: countGrades['D+'], color: 'text-yellow-600', bg: 'bg-yellow-50/50', border: 'border-yellow-100' },
    { label: 'D', value: countGrades['D'], color: 'text-orange-500', bg: 'bg-orange-50/50', border: 'border-orange-100' },
    { label: 'F+', value: countGrades['F+'], color: 'text-rose-500', bg: 'bg-rose-50/50', border: 'border-rose-100' },
    { label: 'F', value: countGrades['F'], color: 'text-red-600', bg: 'bg-red-50/50', border: 'border-red-100' },
  ];

  // Xử lý Export CSV
  const handleExport = () => {
    if (filteredGrades.length === 0) return alert("Không có dữ liệu để xuất!");
    const headers = ['MSSV', 'Sinh Vien', 'Mon Hoc', 'Hoc Ky', 'CC(10%)', 'BT(15%)', 'GK(25%)', 'CK(50%)', 'He 10', 'GPA', 'Diem Chu'];
    const csvContent = [
      headers.join(','),
      ...filteredGrades.map(g => 
        `${g.MSSV},"${g.TenSinhVien || ''}","${g.TenMonHoc || ''}",${g.HocKy},${g.DiemChuyenCan||0},${g.DiemBaiTap||0},${g.DiemGiuaKy||0},${g.DiemCuoiKy||0},${g.DiemTong||0},${g.DiemGPA||0},${g.DiemChu||''}`
      )
    ].join('\n');
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'DanhSachDiem.csv';
    link.click();
  };

  // Mở Modal Nhập Hàng Loạt
  const openBulkModal = () => {
    const initialBulk = students.map(st => ({
      MSSV: st.MSSV, TenSinhVien: st.HoTen, DiemChuyenCan: '', DiemBaiTap: '', DiemGiuaKy: '', DiemCuoiKy: ''
    }));
    setBulkGrades(initialBulk);
    setBulkSubject('');
    setBulkSemester('');
    setShowBulkModal(true);
  };

  const handleBulkGradeChange = (index, field, value) => {
    const updatedBulk = [...bulkGrades];
    updatedBulk[index][field] = value;
    setBulkGrades(updatedBulk);
  };

  const handleSaveBulk = async () => {
    if (!bulkSubject || !bulkSemester) return alert("Vui lòng chọn Môn học và Học kỳ!");
    
    const gradesToSave = bulkGrades.filter(g => g.DiemChuyenCan !== '' || g.DiemBaiTap !== '' || g.DiemGiuaKy !== '' || g.DiemCuoiKy !== '');
    
    if (gradesToSave.length === 0) return alert("Chưa có điểm nào được nhập!");
    
    setIsSavingBulk(true);
    try {
      const promises = gradesToSave.map(g => {
        const diemTong10 = calculateTotal10(g.DiemChuyenCan, g.DiemBaiTap, g.DiemGiuaKy, g.DiemCuoiKy);
        const gpaResult = convertToGPA(diemTong10);
        return axios.post('http://localhost:5000/api/grades', {
          MSSV: g.MSSV,
          MaMonHoc: bulkSubject,
          HocKy: bulkSemester,
          DiemChuyenCan: g.DiemChuyenCan,
          DiemBaiTap: g.DiemBaiTap,
          DiemGiuaKy: g.DiemGiuaKy,
          DiemCuoiKy: g.DiemCuoiKy,
          DiemTong: diemTong10,
          DiemGPA: gpaResult.gpa,
          DiemChu: gpaResult.letter,
          XepLoai: gpaResult.text
        });
      });

      await Promise.all(promises);
      alert("Đã lưu điểm hàng loạt thành công!");
      fetchData();
      setShowBulkModal(false);
    } catch (error) {
      console.error('Error saving bulk grades:', error);
      alert("Có lỗi xảy ra khi lưu điểm hàng loạt. (Có thể do trùng lặp dữ liệu)");
    } finally {
      setIsSavingBulk(false);
    }
  };

  // Submit form 1 điểm (Thêm/Sửa)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const diemTong10 = calculateTotal10(formData.DiemChuyenCan, formData.DiemBaiTap, formData.DiemGiuaKy, formData.DiemCuoiKy);
      const gpaResult = convertToGPA(diemTong10);
      const payload = {
        ...formData, DiemTong: diemTong10, DiemGPA: gpaResult.gpa, DiemChu: gpaResult.letter, XepLoai: gpaResult.text
      };

      if (editingGrade) {
        await axios.put(`http://localhost:5000/api/grades/${editingGrade.MaDiem}`, payload);
      } else {
        await axios.post('http://localhost:5000/api/grades', payload);
      }
      fetchData();
      handleCloseModal();
    } catch (error) {
      alert('Lỗi khi lưu điểm!');
    }
  };

  const handleEdit = (grade) => {
    setEditingGrade(grade);
    setFormData({
      MSSV: grade.MSSV, MaMonHoc: grade.MaMonHoc, HocKy: grade.HocKy,
      DiemChuyenCan: grade.DiemChuyenCan || '', DiemBaiTap: grade.DiemBaiTap || '',
      DiemGiuaKy: grade.DiemGiuaKy || '', DiemCuoiKy: grade.DiemCuoiKy || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (maDiem) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa điểm này?')) {
      try {
        await axios.delete(`http://localhost:5000/api/grades/${maDiem}`);
        fetchData();
      } catch (error) {
        alert('Lỗi khi xóa điểm!');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGrade(null);
    setFormData({
      MSSV: '', MaMonHoc: '', HocKy: '', DiemChuyenCan: '', DiemBaiTap: '', DiemGiuaKy: '', DiemCuoiKy: ''
    });
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;

  return (
    <div className="space-y-6">
      {/* Header & Bộ 3 Nút */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Quản lý điểm sinh viên</h2>
          <p className="text-gray-500">Thêm, sửa, xóa và thống kê điểm</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={openBulkModal}
            className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-5 py-2.5 rounded-xl shadow-md transition-colors font-medium"
          >
            <FileUp className="w-4 h-4" /> Nhập hàng loạt
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleExport}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl shadow-md transition-colors font-medium"
          >
            <FileDown className="w-4 h-4" /> Export
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => { setEditingGrade(null); setFormData({ MSSV: '', MaMonHoc: '', HocKy: '', DiemChuyenCan: '', DiemBaiTap: '', DiemGiuaKy: '', DiemCuoiKy: '' }); setShowModal(true); }}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl shadow-md transition-colors font-medium"
          >
            <Plus className="w-4 h-4" /> Thêm điểm
          </motion.button>
        </div>
      </div>

      {/* Tìm kiếm và Lọc */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text" placeholder="Tìm kiếm điểm..."
            value={displaySearchTerm} onChange={(e) => setDisplaySearchTerm(e.target.value)}
            className="w-full pl-12 pr-12 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${showFilters || filters.subjectFilter ? 'text-orange-500' : 'text-gray-400'}`}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>
        <button onClick={() => setSearchTerm(displaySearchTerm)} className="bg-orange-500 text-white px-6 py-2.5 rounded-xl font-medium">Tìm kiếm</button>
        <button onClick={fetchData} className="bg-blue-500 text-white p-2.5 rounded-xl"><RefreshCw className="w-5 h-5" /></button>
      </div>

      {/* Khung Thống kê Điểm Chi tiết A-F */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4 text-gray-800">
          <BarChart2 className="w-5 h-5 text-orange-500" />
          <h3 className="font-bold text-lg">Thống kê điểm số</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-10 gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <h4 className="text-2xl font-bold text-slate-700">{totalGradesCount}</h4>
            <p className="text-xs font-semibold text-slate-500 mt-1 uppercase">Tổng điểm</p>
          </div>
          {statCards.map((stat, idx) => (
            <div key={idx} className={`${stat.bg} border ${stat.border} rounded-xl p-3 text-center`}>
              <h4 className={`text-2xl font-bold ${stat.color}`}>{stat.value}</h4>
              <p className="text-xs font-semibold text-gray-600 mt-1">ĐIỂM {stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bảng Dữ liệu Điểm */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">MSSV</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Sinh viên</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Môn học</th>
                <th className="text-center py-4 px-2 text-sm font-semibold text-gray-700">CC(10%)</th>
                <th className="text-center py-4 px-2 text-sm font-semibold text-gray-700">BT(15%)</th>
                <th className="text-center py-4 px-2 text-sm font-semibold text-gray-700">GK(25%)</th>
                <th className="text-center py-4 px-2 text-sm font-semibold text-gray-700">CK(50%)</th>
                <th className="text-center py-4 px-3 text-sm font-bold text-gray-800">Hệ 10</th>
                <th className="text-center py-4 px-3 text-sm font-bold text-orange-600">GPA</th>
                <th className="text-center py-4 px-3 text-sm font-semibold text-gray-700">Điểm chữ</th>
                <th className="text-center py-4 px-4 text-sm font-semibold text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredGrades.map((grade) => (
                <tr key={grade.MaDiem} className="border-b border-gray-50 hover:bg-orange-50">
                  <td className="py-3 px-4 text-sm font-medium text-gray-800">{grade.MSSV}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{grade.TenSinhVien}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 truncate max-w-[150px]">{grade.TenMonHoc}</td>
                  <td className="py-3 px-2 text-sm text-center">{grade.DiemChuyenCan}</td>
                  <td className="py-3 px-2 text-sm text-center">{grade.DiemBaiTap}</td>
                  <td className="py-3 px-2 text-sm text-center">{grade.DiemGiuaKy}</td>
                  <td className="py-3 px-2 text-sm text-center">{grade.DiemCuoiKy}</td>
                  <td className="py-3 px-3 text-sm text-center font-bold">{grade.DiemTong}</td>
                  <td className="py-3 px-3 text-sm text-center font-bold text-orange-600">{grade.DiemGPA}</td>
                  <td className="py-3 px-3 text-sm text-center font-semibold text-blue-600">{grade.DiemChu}</td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEdit(grade)} className="p-1.5 bg-orange-100 text-orange-600 rounded-md hover:bg-orange-200"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(grade.MaDiem)} className="p-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL NHẬP HÀNG LOẠT ================= */}
      {showBulkModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Nhập điểm hàng loạt</h3>
                <p className="text-sm text-gray-500 mt-1">Điền điểm trực tiếp vào bảng bên dưới cho toàn bộ sinh viên</p>
              </div>
              <button onClick={() => setShowBulkModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            
            <div className="p-6 flex-1 overflow-hidden flex flex-col">
              <div className="flex gap-4 mb-4">
                <select value={bulkSubject} onChange={(e) => setBulkSubject(e.target.value)} className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none">
                  <option value="">-- Chọn Môn học --</option>
                  {subjects.map(s => <option key={s.MaMonHoc} value={s.MaMonHoc}>{s.TenMonHoc}</option>)}
                </select>
                <select value={bulkSemester} onChange={(e) => setBulkSemester(e.target.value)} className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none">
                  <option value="">-- Chọn Học kỳ --</option>
                  <option value="HK1_2025_2026">HK1 2025-2026</option>
                  <option value="HK2_2025_2026">HK2 2025-2026</option>
                </select>
              </div>

              <div className="flex-1 overflow-auto border border-gray-200 rounded-xl">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">MSSV</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Họ và tên</th>
                      <th className="py-3 px-2 text-center text-sm font-semibold text-gray-600">CC (10%)</th>
                      <th className="py-3 px-2 text-center text-sm font-semibold text-gray-600">BT (15%)</th>
                      <th className="py-3 px-2 text-center text-sm font-semibold text-gray-600">GK (25%)</th>
                      <th className="py-3 px-2 text-center text-sm font-semibold text-gray-600">CK (50%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkGrades.map((studentGrade, index) => (
                      <tr key={studentGrade.MSSV} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-4 text-sm font-medium text-gray-800">{studentGrade.MSSV}</td>
                        <td className="py-2 px-4 text-sm text-gray-600">{studentGrade.TenSinhVien}</td>
                        <td className="py-2 px-2"><input type="number" step="0.1" min="0" max="10" value={studentGrade.DiemChuyenCan} onChange={(e) => handleBulkGradeChange(index, 'DiemChuyenCan', e.target.value)} className="w-full text-center px-2 py-1.5 border border-gray-200 rounded focus:border-purple-500 outline-none" placeholder="-" /></td>
                        <td className="py-2 px-2"><input type="number" step="0.1" min="0" max="10" value={studentGrade.DiemBaiTap} onChange={(e) => handleBulkGradeChange(index, 'DiemBaiTap', e.target.value)} className="w-full text-center px-2 py-1.5 border border-gray-200 rounded focus:border-purple-500 outline-none" placeholder="-" /></td>
                        <td className="py-2 px-2"><input type="number" step="0.1" min="0" max="10" value={studentGrade.DiemGiuaKy} onChange={(e) => handleBulkGradeChange(index, 'DiemGiuaKy', e.target.value)} className="w-full text-center px-2 py-1.5 border border-gray-200 rounded focus:border-purple-500 outline-none" placeholder="-" /></td>
                        <td className="py-2 px-2"><input type="number" step="0.1" min="0" max="10" value={studentGrade.DiemCuoiKy} onChange={(e) => handleBulkGradeChange(index, 'DiemCuoiKy', e.target.value)} className="w-full text-center px-2 py-1.5 border border-gray-200 rounded focus:border-purple-500 outline-none" placeholder="-" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowBulkModal(false)} className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300">Hủy</button>
              <button onClick={handleSaveBulk} disabled={isSavingBulk} className="px-6 py-2 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 disabled:opacity-70 flex items-center gap-2">
                {isSavingBulk ? <RefreshCw className="w-5 h-5 animate-spin" /> : <FileUp className="w-5 h-5" />}
                Lưu hàng loạt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL THÊM / SỬA 1 ĐIỂM (GIAO DIỆN BẠN CHỌN) ================= */}
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
                <div className="md:col-span-2">
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
                
                <div>
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

                {/* Các trường nhập điểm mới */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Chuyên cần (10%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.DiemChuyenCan}
                    onChange={(e) => setFormData({ ...formData, DiemChuyenCan: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Bài tập (15%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.DiemBaiTap}
                    onChange={(e) => setFormData({ ...formData, DiemBaiTap: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Giữa kỳ (25%)</label>
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
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Cuối kỳ/Báo cáo (50%)</label>
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