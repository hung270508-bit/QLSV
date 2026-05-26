import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Search, X, BookOpen, Clock, Award } from 'lucide-react';
import axios from 'axios';

function SubjectManagement() {
  const [subjects, setSubjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCredits, setFilterCredits] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({
    MaMonHoc: '',
    TenMonHoc: '',
    SoTinChi: ''
  });
  const [stats, setStats] = useState({ totalSubjects: 0, totalCredits: 0 });

  useEffect(() => {
    fetchSubjects();
    fetchStats();
  }, []);

  const fetchStats = () => {
    setStats({
      totalSubjects: subjects.length,
      totalCredits: subjects.reduce((sum, s) => sum + parseInt(s.SoTinChi || 0), 0)
    });
  };

  const fetchSubjects = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/subjects');
      setSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleAdd = () => {
    setEditingSubject(null);
    setFormData({ MaMonHoc: '', TenMonHoc: '', SoTinChi: '' });
    setShowModal(true);
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setFormData(subject);
    setShowModal(true);
  };

  const handleDelete = async (maMH) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa môn học này?')) {
      try {
        await axios.delete(`http://localhost:5000/api/subjects/${maMH}`);
        setSubjects(subjects.filter(s => s.MaMonHoc !== maMH));
      } catch (error) {
        console.error('Error deleting subject:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        await axios.put(`http://localhost:5000/api/subjects/${editingSubject.MaMonHoc}`, formData);
        setSubjects(subjects.map(s => s.MaMonHoc === editingSubject.MaMonHoc ? formData : s));
      } else {
        await axios.post('http://localhost:5000/api/subjects', formData);
        setSubjects([...subjects, formData]);
      }
      setShowModal(false);
      fetchSubjects();
    } catch (error) {
      console.error('Error saving subject:', error);
    }
  };

  const filteredSubjects = subjects.filter(subject =>
    (subject.TenMonHoc.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.MaMonHoc.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterCredits === '' || subject.SoTinChi === parseInt(filterCredits))
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Quản lý môn học</h2>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg shadow-orange-100 border border-orange-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Tổng số môn học</p>
              <p className="text-3xl font-bold text-gray-800">{subjects.length}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl">
              <BookOpen className="w-6 h-6 text-orange-600" />
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
              <p className="text-sm text-gray-500 mb-1">Tổng số tín chỉ</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalCredits}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Award className="w-6 h-6 text-blue-600" />
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
              placeholder="Tìm kiếm môn học..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 w-64"
            />
          </div>
          <select
            value={filterCredits}
            onChange={(e) => setFilterCredits(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
          >
            <option value="">Tất cả tín chỉ</option>
            <option value="30">30 tín chỉ</option>
            <option value="45">45 tín chỉ</option>
            <option value="60">60 tín chỉ</option>
          </select>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAdd}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Thêm môn học
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
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Mã môn học</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Tên môn học</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Số tín chỉ</th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredSubjects.map((subject, index) => (
                  <motion.tr
                    key={subject.MaMonHoc}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-50 hover:bg-orange-50 transition-colors"
                  >
                    <td className="py-4 px-6 text-sm text-gray-800 font-medium">{subject.MaMonHoc}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{subject.TenMonHoc}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{subject.SoTinChi}</td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEdit(subject)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(subject.MaMonHoc)}
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
                  {editingSubject ? 'Cập nhật môn học' : 'Thêm môn học mới'}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Mã môn học</label>
                  <input
                    type="text"
                    value={formData.MaMonHoc}
                    onChange={(e) => setFormData({ ...formData, MaMonHoc: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    required
                    disabled={!!editingSubject}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Tên môn học</label>
                  <input
                    type="text"
                    value={formData.TenMonHoc}
                    onChange={(e) => setFormData({ ...formData, TenMonHoc: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Số tín chỉ</label>
                  <input
                    type="number"
                    value={formData.SoTinChi}
                    onChange={(e) => setFormData({ ...formData, SoTinChi: e.target.value })}
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
                    {editingSubject ? 'Cập nhật' : 'Thêm mới'}
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

export default SubjectManagement;
