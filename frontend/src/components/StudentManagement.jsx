import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Search, UserPlus, X, Users } from 'lucide-react';
import axios from 'axios';

function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    MSSV: '',
    HoTen: '',
    NgaySinh: '',
    GioiTinh: 'Nam',
    Email: '',
    SoDienThoai: '',
    MaLop: ''
  });

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/students');
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/classes');
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleAdd = () => {
    setEditingStudent(null);
    setFormData({
      MSSV: '',
      HoTen: '',
      NgaySinh: '',
      GioiTinh: 'Nam',
      Email: '',
      SoDienThoai: '',
      MaLop: ''
    });
    setShowModal(true);
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData(student);
    setShowModal(true);
  };

  const handleDelete = async (mssv) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sinh viên này?')) {
      try {
        await axios.delete(`http://localhost:5000/api/students/${mssv}`);
        setStudents(students.filter(s => s.MSSV !== mssv));
      } catch (error) {
        console.error('Error deleting student:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await axios.put(`http://localhost:5000/api/students/${editingStudent.MSSV}`, formData);
        setStudents(students.map(s => s.MSSV === editingStudent.MSSV ? formData : s));
      } else {
        await axios.post('http://localhost:5000/api/students', formData);
        setStudents([...students, formData]);
      }
      setShowModal(false);
      fetchStudents();
    } catch (error) {
      console.error('Error saving student:', error);
    }
  };

  const filteredStudents = students.filter(student =>
    student.HoTen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.MSSV?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: students.length,
    male: students.filter(s => s.GioiTinh === 'Nam').length,
    female: students.filter(s => s.GioiTinh === 'Nữ').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Quản lý sinh viên</h2>
          <p className="text-gray-500 mt-1">Quản lý thông tin sinh viên trong hệ thống</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm sinh viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 w-64 shadow-sm transition-all"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAdd}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-200 transition-all"
          >
            <Plus className="w-5 h-5" />
            Thêm sinh viên
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -5 }}
          className="bg-white rounded-2xl p-6 shadow-xl shadow-orange-100/50 border border-orange-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-semibold mb-1 uppercase tracking-wide">Tổng số</p>
              <p className="text-3xl font-bold text-orange-500">{stats.total}</p>
            </div>
            <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center">
              <Users className="w-7 h-7 text-orange-500" />
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -5 }}
          className="bg-white rounded-2xl p-6 shadow-xl shadow-blue-100/50 border border-blue-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-semibold mb-1 uppercase tracking-wide">Nam</p>
              <p className="text-3xl font-bold text-blue-500">{stats.male}</p>
            </div>
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
              <UserPlus className="w-7 h-7 text-blue-500" />
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ y: -5 }}
          className="bg-white rounded-2xl p-6 shadow-xl shadow-pink-100/50 border border-pink-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-semibold mb-1 uppercase tracking-wide">Nữ</p>
              <p className="text-3xl font-bold text-pink-500">{stats.female}</p>
            </div>
            <div className="w-14 h-14 bg-pink-100 rounded-2xl flex items-center justify-center">
              <Users className="w-7 h-7 text-pink-500" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Students Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-xl shadow-orange-100/50 border border-orange-100 overflow-hidden"
      >
        <div className="p-6 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Danh sách sinh viên ({filteredStudents.length})</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-orange-50 to-orange-100/50">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wide">MSSV</th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wide">Họ tên</th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wide">Ngày sinh</th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wide">Giới tính</th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wide">Email</th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wide">SĐT</th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wide">Lớp</th>
                <th className="text-center py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wide">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredStudents.map((student, index) => (
                  <motion.tr
                    key={student.MSSV}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: 0.5 + index * 0.03 }}
                    whileHover={{ scale: 1.01, backgroundColor: "rgba(249, 115, 22, 0.05)" }}
                    className="border-b border-orange-50 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-6 text-sm text-gray-800 font-semibold">{student.MSSV}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{student.HoTen}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{student.NgaySinh}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        student.GioiTinh === 'Nam' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-pink-100 text-pink-700'
                      }`}>
                        {student.GioiTinh}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">{student.Email}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{student.SoDienThoai || '-'}</td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                        {student.MaLop}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEdit(student)}
                          className="p-2.5 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors shadow-sm"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(student.MSSV)}
                          className="p-2.5 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {filteredStudents.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-orange-500" />
            </div>
            <p className="text-gray-500 font-medium">Không tìm thấy sinh viên</p>
          </motion.div>
        )}
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-orange-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {editingStudent ? 'Cập nhật sinh viên' : 'Thêm sinh viên mới'}
                  </h3>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-orange-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </motion.button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">MSSV</label>
                    <input
                      type="text"
                      value={formData.MSSV}
                      onChange={(e) => setFormData({ ...formData, MSSV: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                      required
                      disabled={!!editingStudent}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Họ tên</label>
                    <input
                      type="text"
                      value={formData.HoTen}
                      onChange={(e) => setFormData({ ...formData, HoTen: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ngày sinh</label>
                    <input
                      type="date"
                      value={formData.NgaySinh}
                      onChange={(e) => setFormData({ ...formData, NgaySinh: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Giới tính</label>
                    <select
                      value={formData.GioiTinh}
                      onChange={(e) => setFormData({ ...formData, GioiTinh: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                      required
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={formData.Email}
                      onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Số điện thoại</label>
                    <input
                      type="text"
                      value={formData.SoDienThoai}
                      onChange={(e) => setFormData({ ...formData, SoDienThoai: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Lớp</label>
                    <select
                      value={formData.MaLop}
                      onChange={(e) => setFormData({ ...formData, MaLop: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                      required
                    >
                      <option value="">Chọn lớp</option>
                      {classes.map(cls => (
                        <option key={cls.MaLop} value={cls.MaLop}>{cls.TenLop}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
                  >
                    Hủy
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold shadow-lg shadow-orange-200 transition-all"
                  >
                    {editingStudent ? 'Cập nhật' : 'Thêm mới'}
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

export default StudentManagement;
