import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Search, X, RefreshCw, UserCheck, Users } from 'lucide-react';
import axios from 'axios';

function TeachingAssignment() {
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]); // Chứa danh sách lớp sinh hoạt
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    MaLopHocPhan: '', MaMonHoc: '', MaLop: '', MaGiangVien: '',
    HocKy: 'HK1_2025_2026', NamHoc: '2025-2026', SoLuongToiDa: 40
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assRes, subRes, teachRes, classRes] = await Promise.all([
        axios.get('http://localhost:5000/api/teaching-assignments'),
        axios.get('http://localhost:5000/api/subjects'),
        axios.get('http://localhost:5000/api/teachers'),
        axios.get('http://localhost:5000/api/classes') // Gọi API lấy Lớp
      ]);
      setAssignments(assRes.data);
      setSubjects(subRes.data);
      setTeachers(teachRes.data);
      setClasses(classRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAssignment) {
        // Tạm thời chưa viết logic tự động cập nhật lại danh sách sinh viên khi sửa lớp
        await axios.put(`http://localhost:5000/api/teaching-assignments/${editingAssignment.MaLopHocPhan}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/teaching-assignments', formData);
      }
      fetchData();
      handleCloseModal();
    } catch (error) {
      alert('Lỗi khi lưu phân công / mở lớp!');
    }
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      MaLopHocPhan: assignment.MaLopHocPhan, MaMonHoc: assignment.MaMonHoc,
      MaLop: assignment.MaLop || '', MaGiangVien: assignment.MaGiangVien,
      HocKy: assignment.HocKy, NamHoc: assignment.NamHoc, SoLuongToiDa: assignment.SoLuongToiDa
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa Lớp học phần này?')) {
      try {
        await axios.delete(`http://localhost:5000/api/teaching-assignments/${id}`);
        fetchData();
      } catch (error) {
        alert('Lỗi khi xóa!');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAssignment(null);
    setFormData({ MaLopHocPhan: '', MaMonHoc: '', MaLop: '', MaGiangVien: '', HocKy: 'HK1_2025_2026', NamHoc: '2025-2026', SoLuongToiDa: 40 });
  };

  const filteredAssignments = assignments.filter(a =>
    a.TenMonHoc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.TenLop?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.MaLopHocPhan?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Quản lý Phân công & Mở lớp</h2>
          <p className="text-gray-500">Tạo Lớp học phần, tự động xếp danh sách sinh viên</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="bg-orange-500 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-medium shadow-lg shadow-orange-200"
        >
          <Plus className="w-5 h-5" /> Mở lớp học phần
        </motion.button>
      </div>

      <div className="flex gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text" placeholder="Tìm theo mã lớp, tên môn..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-orange-500 outline-none"
          />
        </div>
        <button onClick={fetchData} className="bg-blue-500 text-white p-2.5 rounded-xl shadow-md"><RefreshCw className="w-5 h-5" /></button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Mã Lớp HP</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Môn học</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Giảng viên</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Lớp tham gia</th>
              <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">Học kỳ</th>
              <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssignments.map((a) => (
              <tr key={a.MaLopHocPhan} className="border-b border-gray-50 hover:bg-orange-50/50">
                <td className="py-3 px-6 text-sm font-bold text-blue-600">{a.MaLopHocPhan}</td>
                <td className="py-3 px-6 text-sm text-gray-800 font-medium">{a.TenMonHoc}</td>
                <td className="py-3 px-6 text-sm text-gray-600 flex items-center gap-2"><UserCheck className="w-4 h-4 text-green-500"/> {a.TenGiangVien}</td>
                <td className="py-3 px-6 text-sm text-gray-600">
                  {a.TenLop ? <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded font-medium">{a.TenLop}</span> : <span className="text-gray-400 italic">Lớp tự do</span>}
                </td>
                <td className="py-3 px-6 text-sm text-center text-gray-600">{a.HocKy}</td>
                <td className="py-3 px-6">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => handleEdit(a)} className="p-1.5 bg-orange-100 text-orange-600 rounded hover:bg-orange-200"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(a.MaLopHocPhan)} className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/30 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{editingAssignment ? 'Cập nhật Lớp học phần' : 'Mở Lớp học phần mới'}</h3>
              <button onClick={handleCloseModal}><X className="text-gray-500" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingAssignment && (
                <div>
                  <label className="block text-sm font-semibold mb-2">Mã Lớp Học Phần</label>
                  <input 
                    type="text" placeholder="VD: IT001_N01"
                    value={formData.MaLopHocPhan} 
                    onChange={(e) => setFormData({ ...formData, MaLopHocPhan: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Môn học</label>
                  <select value={formData.MaMonHoc} onChange={(e) => setFormData({ ...formData, MaMonHoc: e.target.value })} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl" required>
                    <option value="">-- Chọn Môn --</option>
                    {subjects.map(s => <option key={s.MaMonHoc} value={s.MaMonHoc}>{s.TenMonHoc}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Giảng viên</label>
                  <select value={formData.MaGiangVien} onChange={(e) => setFormData({ ...formData, MaGiangVien: e.target.value })} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl" required>
                    <option value="">-- Chọn GV --</option>
                    {teachers.map(t => <option key={t.MaGiangVien} value={t.MaGiangVien}>{t.HoTen}</option>)}
                  </select>
                </div>
              </div>

              {/* Ô CHỌN LỚP SINH HOẠT MỚI THÊM VÀO */}
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <label className="flex items-center gap-2 text-sm font-semibold text-blue-800 mb-2">
                  <Users className="w-4 h-4"/> Chọn Lớp tham gia (Tự động lên danh sách)
                </label>
                <select 
                  value={formData.MaLop} 
                  onChange={(e) => setFormData({ ...formData, MaLop: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-blue-200 rounded-xl outline-none focus:border-blue-500"
                >
                  <option value="">-- Tạo lớp tự do (Sinh viên tự đăng ký) --</option>
                  {classes.map(c => <option key={c.MaLop} value={c.MaLop}>{c.TenLop} ({c.MaLop})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Học kỳ</label>
                  <select value={formData.HocKy} onChange={(e) => setFormData({ ...formData, HocKy: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                    <option value="HK1_2025_2026">HK1 2025-2026</option>
                    <option value="HK2_2025_2026">HK2 2025-2026</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Sỉ số tối đa</label>
                  <input type="number" min="1" value={formData.SoLuongToiDa} onChange={(e) => setFormData({ ...formData, SoLuongToiDa: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl"/>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={handleCloseModal} className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200">Hủy</button>
                <button type="submit" className="flex-1 py-2.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 shadow-md">
                  {editingAssignment ? 'Lưu thay đổi' : 'Tạo lớp & Lên danh sách'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default TeachingAssignment;
