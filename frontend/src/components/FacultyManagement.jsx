import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Plus, Edit, Trash2, Search, X, Users, GraduationCap, BookOpen } from 'lucide-react';
import axios from 'axios';

function FacultyManagement() {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFaculty, setExpandedFaculty] = useState(null);
  const [filterType, setFilterType] = useState('teachers'); // 'teachers', 'students', 'classes'
  const [filteredData, setFilteredData] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [formData, setFormData] = useState({
    MaKhoa: '',
    TenKhoa: ''
  });

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
    setFormData({
      MaKhoa: '',
      TenKhoa: ''
    });
  };

  const handleExpandFaculty = async (maKhoa) => {
    if (expandedFaculty === maKhoa) {
      setExpandedFaculty(null);
      setFilteredData([]);
    } else {
      setExpandedFaculty(maKhoa);
      setLoadingData(true);
      try {
        let endpoint;
        if (filterType === 'teachers') {
          endpoint = `http://localhost:5000/api/faculties/${maKhoa}/teachers`;
        } else if (filterType === 'students') {
          endpoint = `http://localhost:5000/api/faculties/${maKhoa}/students`;
        } else if (filterType === 'classes') {
          endpoint = `http://localhost:5000/api/faculties/${maKhoa}/classes`;
        }
        const response = await axios.get(endpoint);
        setFilteredData(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Lỗi khi lấy dữ liệu!');
      } finally {
        setLoadingData(false);
      }
    }
  };

  const handleFilterChange = async (newFilterType) => {
    setFilterType(newFilterType);
    if (expandedFaculty) {
      setLoadingData(true);
      try {
        let endpoint;
        if (newFilterType === 'teachers') {
          endpoint = `http://localhost:5000/api/faculties/${expandedFaculty}/teachers`;
        } else if (newFilterType === 'students') {
          endpoint = `http://localhost:5000/api/faculties/${expandedFaculty}/students`;
        } else if (newFilterType === 'classes') {
          endpoint = `http://localhost:5000/api/faculties/${expandedFaculty}/classes`;
        }
        const response = await axios.get(endpoint);
        setFilteredData(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Lỗi khi lấy dữ liệu!');
      } finally {
        setLoadingData(false);
      }
    }
  };

  const filteredFaculties = faculties.filter(faculty =>
    faculty.TenKhoa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faculty.MaKhoa.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Quản lý khoa</h2>
          <p className="text-gray-500">Thêm, sửa, xóa thông tin khoa</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all"
        >
          <Plus className="w-5 h-5" />
          Thêm khoa
        </motion.button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Tìm kiếm khoa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg shadow-orange-100 border border-orange-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-orange-50 to-orange-100">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Mã khoa</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Tên khoa</th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaculties.length > 0 ? (
                filteredFaculties.map((faculty, index) => (
                  <React.Fragment key={faculty.MaKhoa}>
                    <motion.tr
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 hover:bg-orange-50 transition-colors cursor-pointer"
                      onClick={() => handleExpandFaculty(faculty.MaKhoa)}
                    >
                      <td className="py-4 px-6 text-sm font-medium text-gray-800">{faculty.MaKhoa}</td>
                      <td className="py-4 px-6 text-sm text-gray-600">{faculty.TenKhoa}</td>
                      <td className="py-4 px-6 text-sm">
                        <div className="flex items-center justify-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(faculty);
                            }}
                            className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(faculty.MaKhoa);
                            }}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                    {expandedFaculty === faculty.MaKhoa && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-orange-50"
                      >
                        <td colSpan="3" className="py-4 px-6">
                          {/* Filter Tabs */}
                          <div className="flex gap-2 mb-4">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleFilterChange('teachers')}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                                filterType === 'teachers'
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-white text-gray-600 hover:bg-orange-100'
                              }`}
                            >
                              <Users className="w-4 h-4" />
                              Giảng viên
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleFilterChange('students')}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                                filterType === 'students'
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-white text-gray-600 hover:bg-orange-100'
                              }`}
                            >
                              <GraduationCap className="w-4 h-4" />
                              Sinh viên
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleFilterChange('classes')}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                                filterType === 'classes'
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-white text-gray-600 hover:bg-orange-100'
                              }`}
                            >
                              <BookOpen className="w-4 h-4" />
                              Lớp học
                            </motion.button>
                          </div>

                          {loadingData ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                            </div>
                          ) : filteredData.length > 0 ? (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                              <table className="w-full">
                                <thead className="bg-gray-50">
                                  <tr>
                                    {filterType === 'teachers' && (
                                      <>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Mã GV</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Họ tên</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">SĐT</th>
                                      </>
                                    )}
                                    {filterType === 'students' && (
                                      <>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">MSSV</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Họ tên</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Lớp</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                                      </>
                                    )}
                                    {filterType === 'classes' && (
                                      <>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Mã lớp</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tên lớp</th>
                                      </>
                                    )}
                                  </tr>
                                </thead>
                                <tbody>
                                  {filteredData.map((item, index) => (
                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                      {filterType === 'teachers' && (
                                        <>
                                          <td className="py-3 px-4 text-sm font-medium text-gray-800">{item.MaGiangVien}</td>
                                          <td className="py-3 px-4 text-sm text-gray-600">{item.HoTen}</td>
                                          <td className="py-3 px-4 text-sm text-gray-600">{item.Email}</td>
                                          <td className="py-3 px-4 text-sm text-gray-600">{item.SoDienThoai}</td>
                                        </>
                                      )}
                                      {filterType === 'students' && (
                                        <>
                                          <td className="py-3 px-4 text-sm font-medium text-gray-800">{item.MSSV}</td>
                                          <td className="py-3 px-4 text-sm text-gray-600">{item.HoTen}</td>
                                          <td className="py-3 px-4 text-sm text-gray-600">{item.TenLop}</td>
                                          <td className="py-3 px-4 text-sm text-gray-600">{item.Email}</td>
                                        </>
                                      )}
                                      {filterType === 'classes' && (
                                        <>
                                          <td className="py-3 px-4 text-sm font-medium text-gray-800">{item.MaLop}</td>
                                          <td className="py-3 px-4 text-sm text-gray-600">{item.TenLop}</td>
                                        </>
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-gray-500 text-center py-4">
                              {filterType === 'teachers' && 'Không có giảng viên nào trong khoa này'}
                              {filterType === 'students' && 'Không có sinh viên nào trong khoa này'}
                              {filterType === 'classes' && 'Không có lớp nào trong khoa này'}
                            </p>
                          )}
                        </td>
                      </motion.tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="py-12 text-center text-gray-500">
                    Không tìm thấy khoa nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
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
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all"
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
    </div>
  );
}

export default FacultyManagement;
