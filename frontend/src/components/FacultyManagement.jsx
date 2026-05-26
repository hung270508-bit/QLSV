import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Search, X, Building2, Users, TrendingUp } from 'lucide-react';
import axios from 'axios';

function FacultyManagement() {
  const [faculties, setFaculties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [formData, setFormData] = useState({
    MaKhoa: '',
    TenKhoa: ''
  });
  const [stats, setStats] = useState({ totalFaculties: 0, totalTeachers: 0, totalStudents: 0 });

  useEffect(() => {
    fetchFaculties();
    fetchStats();
  }, []);

  const fetchFaculties = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/faculties');
      setFaculties(response.data);
    } catch (error) {
      console.error('Error fetching faculties:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const [teachersRes, studentsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/teachers'),
        axios.get('http://localhost:5000/api/students')
      ]);
      setStats({
        totalFaculties: faculties.length,
        totalTeachers: teachersRes.data.length,
        totalStudents: studentsRes.data.length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleAdd = () => {
    setEditingFaculty(null);
    setFormData({ MaKhoa: '', TenKhoa: '' });
    setShowModal(true);
  };

  const handleEdit = (faculty) => {
    setEditingFaculty(faculty);
    setFormData(faculty);
    setShowModal(true);
  };

  const handleDelete = async (maKhoa) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khoa này?')) {
      try {
        await axios.delete(`http://localhost:5000/api/faculties/${maKhoa}`);
        setFaculties(faculties.filter(f => f.MaKhoa !== maKhoa));
      } catch (error) {
        console.error('Error deleting faculty:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFaculty) {
        await axios.put(`http://localhost:5000/api/faculties/${editingFaculty.MaKhoa}`, formData);
        setFaculties(faculties.map(f => f.MaKhoa === editingFaculty.MaKhoa ? formData : f));
      } else {
        await axios.post('http://localhost:5000/api/faculties', formData);
        setFaculties([...faculties, formData]);
      }
      setShowModal(false);
      fetchFaculties();
    } catch (error) {
      console.error('Error saving faculty:', error);
    }
  };

  const filteredFaculties = faculties.filter(faculty =>
    faculty.TenKhoa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faculty.MaKhoa.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Quản lý khoa</h2>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg shadow-orange-100 border border-orange-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Tổng số khoa</p>
              <p className="text-3xl font-bold text-gray-800">{faculties.length}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl">
              <Building2 className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg shadow-blue-100 border border-blue-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Tổng giảng viên</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalTeachers}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-lg shadow-green-100 border border-green-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Tổng sinh viên</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalStudents}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm khoa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 w-64"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAdd}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Thêm khoa
          </motion.button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg shadow-gray-100 border border-gray-100 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Mã khoa</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Tên khoa</th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredFaculties.map((faculty, index) => (
                  <motion.tr
                    key={faculty.MaKhoa}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-50 hover:bg-orange-50 transition-colors"
                  >
                    <td className="py-4 px-6 text-sm text-gray-800 font-medium">{faculty.MaKhoa}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{faculty.TenKhoa}</td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEdit(faculty)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(faculty.MaKhoa)}
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
      </motion.div>

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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingFaculty ? 'Cập nhật khoa' : 'Thêm khoa mới'}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Mã khoa</label>
                  <input
                    type="text"
                    value={formData.MaKhoa}
                    onChange={(e) => setFormData({ ...formData, MaKhoa: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    required
                    disabled={!!editingFaculty}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Tên khoa</label>
                  <input
                    type="text"
                    value={formData.TenKhoa}
                    onChange={(e) => setFormData({ ...formData, TenKhoa: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    required
                  />
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
                    className="px-6 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium"
                  >
                    {editingFaculty ? 'Cập nhật' : 'Thêm mới'}
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

export default FacultyManagement;
