import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Search, X, RefreshCw, UserCheck, Users, ClipboardCheck } from 'lucide-react';
import axios from 'axios';

function TeachingAssignment() {
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    MaLopHocPhan: '', MaMonHoc: '', MaLop: '', MaGiangVien: '',
    HocKy: 'HK1_2025_2026', NamHoc: '2025-2026', SoLuongToiDa: 40
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [assRes, subRes, teachRes, classRes] = await Promise.all([
        axios.get('http://localhost:5000/api/teaching-assignments'),
        axios.get('http://localhost:5000/api/subjects'),
        axios.get('http://localhost:5000/api/teachers'),
        axios.get('http://localhost:5000/api/classes')
      ]);
      setAssignments(assRes.data);
      setSubjects(subRes.data);
      setTeachers(teachRes.data);
      setClasses(classRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const validateAssignmentForm = () => {
    const errors = {};
    if (!editingAssignment) {
      if (!formData.MaLopHocPhan.trim()) {
        errors.MaLopHocPhan = 'Mã lớp học phần không được để trống';
      } else if (formData.MaLopHocPhan.trim().length < 3) {
        errors.MaLopHocPhan = 'Mã lớp học phần phải có ít nhất 3 ký tự';
      } else if (formData.MaLopHocPhan.trim().length > 20) {
        errors.MaLopHocPhan = 'Mã lớp học phần tối đa 20 ký tự';
      } else if (!/^[a-zA-Z0-9_.]+$/.test(formData.MaLopHocPhan.trim())) {
        errors.MaLopHocPhan = 'Chỉ được dùng chữ, số, dấu chấm và gạch dưới';
      }
    }
    if (!formData.MaMonHoc) errors.MaMonHoc = 'Vui lòng chọn môn học';
    if (!formData.MaGiangVien) errors.MaGiangVien = 'Vui lòng chọn giảng viên';
    const soluong = parseInt(formData.SoLuongToiDa);
    if (!formData.SoLuongToiDa || isNaN(soluong) || soluong < 1 || soluong > 200) {
      errors.SoLuongToiDa = 'Sĩ số phải từ 1 đến 200';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAssignmentForm()) return;
    try {
      if (editingAssignment) {
        await axios.put(`http://localhost:5000/api/teaching-assignments/${editingAssignment.MaLopHocPhan}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/teaching-assignments', formData);
      }
      fetchData();
      handleCloseModal();
    } catch {
      alert('Lỗi khi lưu phân công!');
    }
  };

  const handleEdit = (a) => {
    setEditingAssignment(a);
    setFormData({
      MaLopHocPhan: a.MaLopHocPhan, MaMonHoc: a.MaMonHoc,
      MaLop: a.MaLop || '', MaGiangVien: a.MaGiangVien,
      HocKy: a.HocKy, NamHoc: a.NamHoc, SoLuongToiDa: a.SoLuongToiDa
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa lớp học phần này?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/teaching-assignments/${id}`);
      fetchData();
    } catch {
      alert('Lỗi khi xóa!');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAssignment(null);
    setFormErrors({});
    setFormData({ MaLopHocPhan: '', MaMonHoc: '', MaLop: '', MaGiangVien: '', HocKy: 'HK1_2025_2026', NamHoc: '2025-2026', SoLuongToiDa: 40 });
  };

  const filtered = assignments.filter(a =>
    a.TenMonHoc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.TenLop?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.MaLopHocPhan?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-10 h-10 border-orange-500 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3, borderStyle: 'solid' }} />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 shadow-lg shadow-orange-200/50 flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <ClipboardCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Quản lý Phân công & Mở lớp</h2>
            <p className="text-orange-100 text-sm mt-0.5">Tạo lớp học phần, tự động xếp danh sách sinh viên</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          onClick={() => setShowModal(true)}
          className="bg-white text-orange-600 px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold shadow-md hover:shadow-lg transition-shadow text-sm"
        >
          <Plus className="w-4 h-4" /> Mở lớp học phần
        </motion.button>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        className="flex gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-100"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm theo mã lớp, tên môn, giảng viên..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-orange-400 focus:bg-white outline-none text-sm transition-all"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={fetchData}
          className="bg-blue-500 text-white p-2.5 rounded-xl shadow-sm hover:bg-blue-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </motion.button>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <table className="w-full">
          <thead className="bg-gray-50/80 border-b border-gray-100">
            <tr>
              {['Mã Lớp HP', 'Môn học', 'Giảng viên', 'Lớp tham gia', 'Học kỳ', 'Thao tác'].map(h => (
                <th key={h} className={`py-3.5 px-5 text-xs font-bold text-gray-500 uppercase tracking-wide ${h === 'Thao tác' || h === 'Học kỳ' ? 'text-center' : 'text-left'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a, i) => (
              <motion.tr
                key={a.MaLopHocPhan}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.18 }}
                className="border-b border-gray-50 hover:bg-orange-50/30 transition-colors duration-150"
              >
                <td className="py-3.5 px-5">
                  <span className="font-mono text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{a.MaLopHocPhan}</span>
                </td>
                <td className="py-3.5 px-5 text-sm font-semibold text-gray-800">{a.TenMonHoc}</td>
                <td className="py-3.5 px-5 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {a.TenGiangVien}
                  </div>
                </td>
                <td className="py-3.5 px-5">
                  {a.TenLop
                    ? <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-lg text-xs font-semibold">{a.TenLop}</span>
                    : <span className="text-gray-400 text-xs italic">Lớp tự do</span>
                  }
                </td>
                <td className="py-3.5 px-5 text-center text-xs text-gray-500 font-medium">{a.HocKy}</td>
                <td className="py-3.5 px-5">
                  <div className="flex items-center justify-center gap-2">
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={() => handleEdit(a)}
                      className="p-1.5 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors border border-orange-100"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(a.MaLopHocPhan)}
                      className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors border border-red-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </td>
              </motion.tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  <ClipboardCheck className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                  <p className="font-medium">Không có dữ liệu</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
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
              className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-orange-500" />
                  {editingAssignment ? 'Cập nhật Lớp học phần' : 'Mở Lớp học phần mới'}
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                  onClick={handleCloseModal}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </motion.button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingAssignment && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mã Lớp Học Phần</label>
                    <input
                      type="text" placeholder="VD: IT001_N01"
                      value={formData.MaLopHocPhan}
                      onChange={e => {
                        setFormData({ ...formData, MaLopHocPhan: e.target.value });
                        if (formErrors.MaLopHocPhan) setFormErrors({ ...formErrors, MaLopHocPhan: '' });
                      }}
                      className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm outline-none transition-colors ${formErrors.MaLopHocPhan ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-orange-400'}`}
                    />
                    {formErrors.MaLopHocPhan && <p className="text-red-500 text-xs mt-1">{formErrors.MaLopHocPhan}</p>}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Môn học</label>
                    <select
                      value={formData.MaMonHoc}
                      onChange={e => setFormData({ ...formData, MaMonHoc: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400 transition-colors"
                      required
                    >
                      <option value="">-- Chọn Môn --</option>
                      {subjects.map(s => <option key={s.MaMonHoc} value={s.MaMonHoc}>{s.TenMonHoc}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Giảng viên</label>
                    <select
                      value={formData.MaGiangVien}
                      onChange={e => setFormData({ ...formData, MaGiangVien: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400 transition-colors"
                      required
                    >
                      <option value="">-- Chọn GV --</option>
                      {teachers.map(t => <option key={t.MaGiangVien} value={t.MaGiangVien}>{t.HoTen}</option>)}
                    </select>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <label className="flex items-center gap-2 text-sm font-semibold text-blue-800 mb-2">
                    <Users className="w-4 h-4" /> Chọn Lớp tham gia
                  </label>
                  <select
                    value={formData.MaLop}
                    onChange={e => setFormData({ ...formData, MaLop: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-blue-200 rounded-xl outline-none focus:border-blue-400 text-sm transition-colors"
                  >
                    <option value="">-- Lớp tự do --</option>
                    {classes.map(c => <option key={c.MaLop} value={c.MaLop}>{c.TenLop} ({c.MaLop})</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Học kỳ</label>
                    <select
                      value={formData.HocKy}
                      onChange={e => setFormData({ ...formData, HocKy: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400 transition-colors"
                    >
                      <option value="HK1_2025_2026">HK1 2025-2026</option>
                      <option value="HK2_2025_2026">HK2 2025-2026</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sỉ số tối đa</label>
                    <input
                      type="number" min="1"
                      value={formData.SoLuongToiDa}
                      onChange={e => setFormData({ ...formData, SoLuongToiDa: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-3 border-t border-gray-100">
                  <motion.button
                    type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleCloseModal}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 text-sm transition-colors"
                  >
                    Hủy
                  </motion.button>
                  <motion.button
                    type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-md text-sm"
                  >
                    {editingAssignment ? 'Lưu thay đổi' : 'Tạo lớp & Lên danh sách'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TeachingAssignment;
