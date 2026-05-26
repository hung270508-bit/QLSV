import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Search, X, Download, Filter, ChevronDown } from 'lucide-react';
import axios from 'axios';

function TeacherManagement() {
  const [teachers, setTeachers] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [filterFaculty, setFilterFaculty] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [formData, setFormData] = useState({
    MaGiangVien: '',
    HoTen: '',
    Email: '',
    SoDienThoai: '',
    MaKhoa: ''
  });

  useEffect(() => {
    fetchTeachers();
    fetchFaculties();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/teachers');
      setTeachers(response.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchFaculties = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/faculties');
      setFaculties(response.data.map(f => f.MaKhoa));
    } catch (error) {
      console.error('Error fetching faculties:', error);
    }
  };

  const handleAdd = () => {
    setEditingTeacher(null);
    setFormData({
      MaGiangVien: '',
      HoTen: '',
      Email: '',
      SoDienThoai: '',
      MaKhoa: ''
    });
    setShowModal(true);
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setFormData(teacher);
    setShowModal(true);
  };

  const handleDelete = async (maGV) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa giảng viên này?')) {
      try {
        await axios.delete(`http://localhost:5000/api/teachers/${maGV}`);
        setTeachers(teachers.filter(t => t.MaGiangVien !== maGV));
      } catch (error) {
        console.error('Error deleting teacher:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTeacher) {
        await axios.put(`http://localhost:5000/api/teachers/${editingTeacher.MaGiangVien}`, formData);
        setTeachers(teachers.map(t => t.MaGiangVien === editingTeacher.MaGiangVien ? formData : t));
      } else {
        await axios.post('http://localhost:5000/api/teachers', formData);
        setTeachers([...teachers, formData]);
      }
      setShowModal(false);
      fetchTeachers();
    } catch (error) {
      console.error('Error saving teacher:', error);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Mã GV', 'Họ tên', 'Email', 'SĐT', 'Khoa'],
      ...filteredTeachers.map(t => [t.MaGiangVien, t.HoTen, t.Email, t.SoDienThoai, t.MaKhoa])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'giangvien.csv';
    link.click();
  };

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.HoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.MaGiangVien.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.Email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !filterFaculty || teacher.MaKhoa === filterFaculty;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <h2 className="text-2xl font-bold text-gray-800">Quản lý giảng viên</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm giảng viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 w-64 transition-all"
            />
          </div>
          
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowFilter(!showFilter)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:border-orange-500 transition-all"
            >
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Lọc</span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showFilter ? 'rotate-180' : ''}`} />
            </motion.button>
            
            <AnimatePresence>
              {showFilter && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-48 z-10"
                >
                  <label className="block text-sm font-medium text-gray-600 mb-2">Lọc theo khoa</label>
                  <select
                    value={filterFaculty}
                    onChange={(e) => setFilterFaculty(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 text-sm"
                  >
                    <option value="">Tất cả</option>
                    {faculties.map(fac => (
                      <option key={fac} value={fac}>{fac}</option>
                    ))}
                  </select>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:border-orange-500 transition-all"
          >
            <Download className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Xuất</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAdd}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-md shadow-orange-200"
          >
            <Plus className="w-5 h-5" />
            Thêm giảng viên
          </motion.button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Tổng giảng viên</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{teachers.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Đang hiển thị</p>
          <p className="text-2xl font-bold text-orange-500 mt-1">{filteredTeachers.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Số khoa</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{faculties.length}</p>
        </div>
      </motion.div>

      {/* Teachers Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Mã GV</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Họ tên</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">SĐT</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Khoa</th>
                <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredTeachers.map((teacher, index) => (
                  <motion.tr
                    key={teacher.MaGiangVien}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: index * 0.03, duration: 0.2, ease: "easeOut" }}
                    whileHover={{ scale: 1.005, backgroundColor: "rgba(249, 115, 22, 0.03)" }}
                    className="border-b border-gray-100 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-6 text-sm text-gray-800 font-medium">{teacher.MaGiangVien}</td>
                    <td className="py-4 px-6 text-sm text-gray-700">{teacher.HoTen}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{teacher.Email}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{teacher.SoDienThoai}</td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold">
                        {teacher.MaKhoa}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEdit(teacher)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(teacher.MaGiangVien)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
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
        {filteredTeachers.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-500 font-medium">Không tìm thấy giảng viên nào</p>
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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingTeacher ? 'Cập nhật giảng viên' : 'Thêm giảng viên mới'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Mã giảng viên</label>
                    <input
                      type="text"
                      value={formData.MaGiangVien}
                      onChange={(e) => setFormData({ ...formData, MaGiangVien: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-all"
                      required
                      disabled={!!editingTeacher}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Họ tên</label>
                    <input
                      type="text"
                      value={formData.HoTen}
                      onChange={(e) => setFormData({ ...formData, HoTen: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={formData.Email}
                      onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Số điện thoại</label>
                    <input
                      type="text"
                      value={formData.SoDienThoai}
                      onChange={(e) => setFormData({ ...formData, SoDienThoai: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Khoa</label>
                    <select
                      value={formData.MaKhoa}
                      onChange={(e) => setFormData({ ...formData, MaKhoa: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-all"
                      required
                    >
                      <option value="">Chọn khoa</option>
                      {faculties.map(fac => (
                        <option key={fac} value={fac}>{fac}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium shadow-md shadow-orange-200"
                  >
                    {editingTeacher ? 'Cập nhật' : 'Thêm mới'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TeacherManagement;
