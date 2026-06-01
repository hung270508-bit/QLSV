import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Plus, Edit, Trash2, Search, X, Users, BookOpen, BarChart3 } from 'lucide-react';
import axios from 'axios';

function FacultyManagement() {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [displaySearchTerm, setDisplaySearchTerm] = useState('');
  const [formData, setFormData] = useState({
    MaKhoa: '',
    TenKhoa: ''
  });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [facultyTeachers, setFacultyTeachers] = useState([]);
  const [facultyStudents, setFacultyStudents] = useState([]);
  const [facultyClasses, setFacultyClasses] = useState([]);
  const [facultyStats, setFacultyStats] = useState({
    totalTeachers: 0,
    totalStudents: 0,
    totalClasses: 0
  });
  const [detailTab, setDetailTab] = useState('teachers');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/faculties');
      setFaculties(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFaculty) {
        await axios.put(`http://localhost:5000/api/faculties/${editingFaculty.MaKhoa}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/faculties', formData);
      }
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving faculty:', error);
      alert('Lỗi khi lưu khoa!');
    }
  };

  const handleEdit = (faculty) => {
    setEditingFaculty(faculty);
    setFormData({
      MaKhoa: faculty.MaKhoa,
      TenKhoa: faculty.TenKhoa
    });
    setShowModal(true);
  };

  const handleDelete = async (maKhoa) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khoa này?')) {
      try {
        await axios.delete(`http://localhost:5000/api/faculties/${maKhoa}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting faculty:', error);
        alert('Lỗi khi xóa khoa!');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingFaculty(null);
    setFormData({ MaKhoa: '', TenKhoa: '' });
  };

  const handleViewDetails = async (faculty) => {
    setSelectedFaculty(faculty);
    setShowDetailModal(true);
    setDetailTab('teachers');
    try {
      const [teachersRes, studentsRes, classesRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/faculties/${faculty.MaKhoa}/teachers`),
        axios.get(`http://localhost:5000/api/faculties/${faculty.MaKhoa}/students`),
        axios.get(`http://localhost:5000/api/faculties/${faculty.MaKhoa}/classes`)
      ]);
      setFacultyTeachers(teachersRes.data);
      setFacultyStudents(studentsRes.data);
      setFacultyClasses(classesRes.data);
      setFacultyStats({
        totalTeachers: teachersRes.data.length,
        totalStudents: studentsRes.data.length,
        totalClasses: classesRes.data.length
      });
    } catch (error) {
      console.error('Error fetching faculty details:', error);
    }
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedFaculty(null);
    setFacultyTeachers([]);
    setFacultyStudents([]);
    setFacultyClasses([]);
    setFacultyStats({ totalTeachers: 0, totalStudents: 0, totalClasses: 0 });
    setDetailTab('teachers');
  };

  const filteredFaculties = faculties.filter(faculty =>
    faculty.TenKhoa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faculty.MaKhoa.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearch = () => {
    setSearchTerm(displaySearchTerm);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Building2 className="w-8 h-8" />
              Quản lý khoa
            </h2>
            <p className="text-orange-100 text-lg">Thêm, sửa, xóa thông tin khoa</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-white text-orange-600 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Thêm khoa
          </motion.button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm khoa theo tên hoặc mã khoa..."
              value={displaySearchTerm}
              onChange={(e) => setDisplaySearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSearch}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-orange-200 transition-all"
          >
            <Search className="w-5 h-5" />
            Tìm kiếm
          </motion.button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xl border border-orange-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-orange-50 to-orange-100">
              <tr>
                <th className="text-left py-5 px-6 text-sm font-bold text-orange-700 uppercase tracking-wider">Mã khoa</th>
                <th className="text-left py-5 px-6 text-sm font-bold text-orange-700 uppercase tracking-wider">Tên khoa</th>
                <th className="text-center py-5 px-6 text-sm font-bold text-orange-700 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaculties.length > 0 ? (
                filteredFaculties.map((faculty, index) => (
                  <motion.tr
                    key={faculty.MaKhoa}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-orange-50 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 transition-all cursor-pointer"
                    onClick={() => handleViewDetails(faculty)}
                  >
                    <td className="py-5 px-6">
                      <span className="font-semibold text-gray-800 text-base">{faculty.MaKhoa}</span>
                    </td>
                    <td className="py-5 px-6">
                      <span className="font-semibold text-gray-800">{faculty.TenKhoa}</span>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEdit(faculty)}
                          className="p-3 bg-orange-100 text-orange-600 rounded-xl hover:bg-orange-200 transition-all shadow-sm"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(faculty.MaKhoa)}
                          className="p-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all shadow-sm"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="py-16">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Building2 className="w-16 h-16 mb-4 text-gray-300" />
                      <p className="text-lg font-medium">Không tìm thấy khoa nào</p>
                      <p className="text-sm mt-2">Thử tìm kiếm với từ khóa khác</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal CRUD */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {editingFaculty ? 'Cập nhật khoa' : 'Thêm khoa mới'}
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
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mã khoa</label>
                <input
                  type="text"
                  value={formData.MaKhoa}
                  onChange={(e) => setFormData({ ...formData, MaKhoa: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  required
                  disabled={!!editingFaculty}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tên khoa</label>
                <input
                  type="text"
                  value={formData.TenKhoa}
                  onChange={(e) => setFormData({ ...formData, TenKhoa: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold shadow-lg transition-all"
                >
                  {editingFaculty ? 'Cập nhật' : 'Thêm mới'}
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

      {/* Detail Modal */}
      {showDetailModal && selectedFaculty && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Chi tiết khoa: {selectedFaculty.TenKhoa}</h3>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleCloseDetailModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </motion.button>
            </div>
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
              {[
                { id: 'teachers', label: 'Giảng viên', icon: Users },
                { id: 'students', label: 'Sinh viên', icon: Users },
                { id: 'classes', label: 'Lớp', icon: BookOpen },
                { id: 'stats', label: 'Thống kê', icon: BarChart3 }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setDetailTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
                      detailTab === tab.id
                        ? 'text-orange-600 border-b-2 border-orange-600'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
            {/* Tab Content */}
            {detailTab === 'teachers' && (
              <div className="space-y-4">
                {facultyTeachers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Mã GV</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Họ tên</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">SĐT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {facultyTeachers.map((teacher, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="py-3 px-4 text-sm text-gray-800">{teacher.MaGiangVien}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{teacher.HoTen}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{teacher.Email || '-'}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{teacher.SoDienThoai || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">Chưa có giảng viên nào</p>
                )}
              </div>
            )}
            {detailTab === 'students' && (
              <div className="space-y-4">
                {facultyStudents.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">MSSV</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Họ tên</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Giới tính</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Lớp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {facultyStudents.map((student, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="py-3 px-4 text-sm text-gray-800">{student.MSSV}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{student.HoTen}</td>
                            <td className="py-3 px-4 text-sm">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                student.GioiTinh === 'Nam'
                                  ? 'bg-blue-100 text-blue-700'
                                  : student.GioiTinh === 'Nữ'
                                  ? 'bg-pink-100 text-pink-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {student.GioiTinh || '-'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">{student.TenLop || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">Chưa có sinh viên nào</p>
                )}
              </div>
            )}
            {detailTab === 'classes' && (
              <div className="space-y-4">
                {facultyClasses.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Mã lớp</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tên lớp</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Số sinh viên</th>
                        </tr>
                      </thead>
                      <tbody>
                        {facultyClasses.map((cls, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="py-3 px-4 text-sm text-gray-800">{cls.MaLop}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{cls.TenLop}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{cls.SoSinhVien || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">Chưa có lớp nào</p>
                )}
              </div>
            )}
            {detailTab === 'stats' && (
              <div className="space-y-4">
                {/* Grid changed from grid-cols-4 to grid-cols-3 since "Môn học" was removed */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-6 rounded-xl text-center">
                    <div className="text-3xl font-bold text-blue-600">{facultyStats.totalTeachers}</div>
                    <div className="text-sm text-gray-600">Giảng viên</div>
                  </div>
                  <div className="bg-green-50 p-6 rounded-xl text-center">
                    <div className="text-3xl font-bold text-green-600">{facultyStats.totalStudents}</div>
                    <div className="text-sm text-gray-600">Sinh viên</div>
                  </div>
                  <div className="bg-purple-50 p-6 rounded-xl text-center">
                    <div className="text-3xl font-bold text-purple-600">{facultyStats.totalClasses}</div>
                    <div className="text-sm text-gray-600">Lớp học</div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default FacultyManagement;