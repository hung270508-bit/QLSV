import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Search, X, BookOpen } from 'lucide-react';
import axios from 'axios';

function CourseSection() {
  const [courseSections, setCourseSections] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [formData, setFormData] = useState({
    MaPhanCong: '',
    MaGiangVien: '',
    MaMonHoc: '',
    MaLop: '',
    HocKy: ''
  });

  useEffect(() => {
    fetchCourseSections();
    fetchTeachers();
    fetchSubjects();
    fetchClasses();
  }, []);

  const fetchCourseSections = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/course-sections');
      setCourseSections(response.data);
    } catch (error) {
      console.error('Error fetching course sections:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/teachers');
      setTeachers(response.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/subjects');
      setSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
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
    setEditingSection(null);
    setFormData({ MaPhanCong: '', MaGiangVien: '', MaMonHoc: '', MaLop: '', HocKy: '' });
    setShowModal(true);
  };

  const handleEdit = (section) => {
    setEditingSection(section);
    setFormData(section);
    setShowModal(true);
  };

  const handleDelete = async (maPC) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa học phần này?')) {
      try {
        await axios.delete(`http://localhost:5000/api/course-sections/${maPC}`);
        setCourseSections(courseSections.filter(s => s.MaPhanCong !== maPC));
      } catch (error) {
        console.error('Error deleting course section:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSection) {
        await axios.put(`http://localhost:5000/api/course-sections/${editingSection.MaPhanCong}`, formData);
        setCourseSections(courseSections.map(s => s.MaPhanCong === editingSection.MaPhanCong ? formData : s));
      } else {
        await axios.post('http://localhost:5000/api/course-sections', formData);
        setCourseSections([...courseSections, { ...formData, MaPhanCong: courseSections.length + 1 }]);
      }
      setShowModal(false);
      fetchCourseSections();
    } catch (error) {
      console.error('Error saving course section:', error);
    }
  };

  const filteredSections = courseSections.filter(section => {
    const matchesSearch = searchTerm === '' || 
      section.MaLop?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.MaMonHoc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.TenMonHoc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.MaGiangVien?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.TenGiangVien?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.TenLop?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeacher = !filterTeacher || section.MaGiangVien === filterTeacher;
    const matchesSubject = !filterSubject || section.MaMonHoc === filterSubject;
    const matchesClass = !filterClass || section.MaLop === filterClass;
    const matchesSemester = !filterSemester || section.HocKy === filterSemester;
    return matchesSearch && matchesTeacher && matchesSubject && matchesClass && matchesSemester;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Lớp học phần</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 w-64"
            />
          </div>
          <select
            value={filterTeacher}
            onChange={(e) => setFilterTeacher(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
          >
            <option value="">Tất cả giảng viên</option>
            {teachers.map(t => (
              <option key={t.MaGiangVien} value={t.MaGiangVien}>{t.HoTen} ({t.MaGiangVien})</option>
            ))}
          </select>
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
          >
            <option value="">Tất cả môn học</option>
            {subjects.map(s => (
              <option key={s.MaMonHoc} value={s.MaMonHoc}>{s.TenMonHoc} ({s.MaMonHoc})</option>
            ))}
          </select>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
          >
            <option value="">Tất cả lớp</option>
            {classes.map(c => (
              <option key={c.MaLop} value={c.MaLop}>{c.TenLop} ({c.MaLop})</option>
            ))}
          </select>
          <select
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
          >
            <option value="">Tất cả học kỳ</option>
            <option value="HK1">HK1</option>
            <option value="HK2">HK2</option>
            <option value="HK3">HK3</option>
          </select>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAdd}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Thêm học phần
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
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Mã học phần</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Giảng viên</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Môn học</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Lớp</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Học kỳ</th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredSections.map((section, index) => (
                  <motion.tr
                    key={section.MaPhanCong}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-50 hover:bg-orange-50 transition-colors"
                  >
                    <td className="py-4 px-6 text-sm text-gray-800 font-medium">{section.MaPhanCong}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      <div className="flex flex-col">
                        <span className="font-medium">{section.TenGiangVien || section.MaGiangVien}</span>
                        <span className="text-xs text-gray-400">{section.MaGiangVien}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      <div className="flex flex-col">
                        <span className="font-medium">{section.TenMonHoc || section.MaMonHoc}</span>
                        <span className="text-xs text-gray-400">{section.MaMonHoc}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      <div className="flex flex-col">
                        <span className="font-medium">{section.TenLop || section.MaLop}</span>
                        <span className="text-xs text-gray-400">{section.MaLop}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">{section.HocKy}</td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEdit(section)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(section.MaPhanCong)}
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
                  {editingSection ? 'Cập nhật học phần' : 'Thêm học phần mới'}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Giảng viên</label>
                  <select
                    value={formData.MaGiangVien}
                    onChange={(e) => setFormData({ ...formData, MaGiangVien: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    required
                  >
                    <option value="">Chọn giảng viên</option>
                    {teachers.map(t => (
                      <option key={t.MaGiangVien} value={t.MaGiangVien}>{t.HoTen} ({t.MaGiangVien})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Môn học</label>
                  <select
                    value={formData.MaMonHoc}
                    onChange={(e) => setFormData({ ...formData, MaMonHoc: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    required
                  >
                    <option value="">Chọn môn học</option>
                    {subjects.map(s => (
                      <option key={s.MaMonHoc} value={s.MaMonHoc}>{s.TenMonHoc} ({s.MaMonHoc})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Lớp</label>
                  <select
                    value={formData.MaLop}
                    onChange={(e) => setFormData({ ...formData, MaLop: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    required
                  >
                    <option value="">Chọn lớp</option>
                    {classes.map(c => (
                      <option key={c.MaLop} value={c.MaLop}>{c.TenLop} ({c.MaLop})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Học kỳ</label>
                  <select
                    value={formData.HocKy}
                    onChange={(e) => setFormData({ ...formData, HocKy: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    required
                  >
                    <option value="">Chọn học kỳ</option>
                    <option value="HK1">HK1</option>
                    <option value="HK2">HK2</option>
                    <option value="HK3">HK3</option>
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
                    {editingSection ? 'Cập nhật' : 'Thêm mới'}
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

export default CourseSection;
