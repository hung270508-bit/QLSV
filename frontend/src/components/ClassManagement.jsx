import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Search, X, Users, Building2, GraduationCap } from 'lucide-react';
import axios from 'axios';

function ClassManagement() {
  const [classes, setClasses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFaculty, setFilterFaculty] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({
    MaLop: '',
    TenLop: '',
    MaKhoa: ''
  });
  const [stats, setStats] = useState({ totalClasses: 0, totalStudents: 0 });

  useEffect(() => {
    fetchClasses();
    fetchFaculties();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const studentsRes = await axios.get('http://localhost:5000/api/students');
      setStats({
        totalClasses: classes.length,
        totalStudents: studentsRes.data.length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
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

  const fetchFaculties = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/faculties');
      setFaculties(response.data.map(f => f.MaKhoa));
    } catch (error) {
      console.error('Error fetching faculties:', error);
    }
  };

  const handleAdd = () => {
    setEditingClass(null);
    setFormData({ MaLop: '', TenLop: '', MaKhoa: '' });
    setShowModal(true);
  };

  const handleEdit = (cls) => {
    setEditingClass(cls);
    setFormData(cls);
    setShowModal(true);
  };

  const handleDelete = async (maLop) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lớp này?')) {
      try {
        await axios.delete(`http://localhost:5000/api/classes/${maLop}`);
        setClasses(classes.filter(c => c.MaLop !== maLop));
      } catch (error) {
        console.error('Error deleting class:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClass) {
        await axios.put(`http://localhost:5000/api/classes/${editingClass.MaLop}`, formData);
        setClasses(classes.map(c => c.MaLop === editingClass.MaLop ? formData : c));
      } else {
        await axios.post('http://localhost:5000/api/classes', formData);
        setClasses([...classes, formData]);
      }
      setShowModal(false);
      fetchClasses();
    } catch (error) {
      console.error('Error saving class:', error);
    }
  };

  const filteredClasses = classes.filter(cls =>
    (cls.TenLop.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.MaLop.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterFaculty === '' || cls.MaKhoa === filterFaculty)
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Quản lý lớp học</h2>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg shadow-orange-100 border border-orange-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Tổng số lớp</p>
              <p className="text-3xl font-bold text-gray-800">{classes.length}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl">
              <Users className="w-6 h-6 text-orange-600" />
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
              <p className="text-sm text-gray-500 mb-1">Tổng sinh viên</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalStudents}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <GraduationCap className="w-6 h-6 text-blue-600" />
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
              placeholder="Tìm kiếm lớp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 w-64"
            />
          </div>
          <select
            value={filterFaculty}
            onChange={(e) => setFilterFaculty(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
          >
            <option value="">Tất cả khoa</option>
            {faculties.map(fac => (
              <option key={fac} value={fac}>{fac}</option>
            ))}
          </select>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAdd}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Thêm lớp
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
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Mã lớp</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Tên lớp</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Khoa</th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredClasses.map((cls, index) => (
                  <motion.tr
                    key={cls.MaLop}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-50 hover:bg-orange-50 transition-colors"
                  >
                    <td className="py-4 px-6 text-sm text-gray-800 font-medium">{cls.MaLop}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{cls.TenLop}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{cls.MaKhoa}</td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEdit(cls)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(cls.MaLop)}
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
                  {editingClass ? 'Cập nhật lớp' : 'Thêm lớp mới'}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Mã lớp</label>
                  <input
                    type="text"
                    value={formData.MaLop}
                    onChange={(e) => setFormData({ ...formData, MaLop: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    required
                    disabled={!!editingClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Tên lớp</label>
                  <input
                    type="text"
                    value={formData.TenLop}
                    onChange={(e) => setFormData({ ...formData, TenLop: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Khoa</label>
                  <select
                    value={formData.MaKhoa}
                    onChange={(e) => setFormData({ ...formData, MaKhoa: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    required
                  >
                    <option value="">Chọn khoa</option>
                    {faculties.map(fac => (
                      <option key={fac} value={fac}>{fac}</option>
                    ))}
                  </select>
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
                    {editingClass ? 'Cập nhật' : 'Thêm mới'}
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

export default ClassManagement;
