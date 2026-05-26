import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Search, X, Calendar, Clock, MapPin } from 'lucide-react';
import axios from 'axios';

function ScheduleManagement() {
  const [schedules, setSchedules] = useState([]);
  const [courseSections, setCourseSections] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formData, setFormData] = useState({
    MaLichHoc: '',
    MaPhanCong: '',
    Thu: '',
    CaHoc: '',
    PhongHoc: ''
  });

  const days = ['2', '3', '4', '5', '6', '7', 'CN'];
  const periods = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

  useEffect(() => {
    fetchSchedules();
    fetchCourseSections();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/schedules');
      setSchedules(response.data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const fetchCourseSections = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/course-sections');
      setCourseSections(response.data);
    } catch (error) {
      console.error('Error fetching course sections:', error);
    }
  };

  const handleAdd = () => {
    setEditingSchedule(null);
    setFormData({ MaLichHoc: '', MaPhanCong: '', Thu: '', CaHoc: '', PhongHoc: '' });
    setShowModal(true);
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setFormData(schedule);
    setShowModal(true);
  };

  const handleDelete = async (maLichHoc) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lịch học này?')) {
      try {
        await axios.delete(`http://localhost:5000/api/schedules/${maLichHoc}`);
        setSchedules(schedules.filter(s => s.MaLichHoc !== maLichHoc));
      } catch (error) {
        console.error('Error deleting schedule:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSchedule) {
        await axios.put(`http://localhost:5000/api/schedules/${editingSchedule.MaLichHoc}`, formData);
        setSchedules(schedules.map(s => s.MaLichHoc === editingSchedule.MaLichHoc ? formData : s));
      } else {
        await axios.post('http://localhost:5000/api/schedules', formData);
        setSchedules([...schedules, { ...formData, MaLichHoc: schedules.length + 1 }]);
      }
      setShowModal(false);
      fetchSchedules();
    } catch (error) {
      console.error('Error saving schedule:', error);
    }
  };

  const getDayName = (day) => {
    const dayNames = {
      '2': 'Thứ 2',
      '3': 'Thứ 3',
      '4': 'Thứ 4',
      '5': 'Thứ 5',
      '6': 'Thứ 6',
      '7': 'Thứ 7',
      'CN': 'Chủ Nhật'
    };
    return dayNames[day] || day;
  };

  const getCourseSectionInfo = (maPhanCong) => {
    const section = courseSections.find(s => s.MaPhanCong === maPhanCong);
    if (section) {
      return `${section.TenMonHoc} - ${section.TenLop}`;
    }
    return maPhanCong;
  };

  const filteredSchedules = schedules.filter(schedule =>
    schedule.PhongHoc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    schedule.Thu?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Quản lý lịch học</h2>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm kiếm theo phòng, ngày học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-orange-50 transition-colors duration-200 text-gray-700"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-200 transition-colors duration-200"
        >
          <Plus className="w-5 h-5" />
          Thêm lịch học
        </motion.button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg shadow-orange-100 border border-orange-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-orange-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-orange-700 uppercase tracking-wider">Mã lịch</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-orange-700 uppercase tracking-wider">Lớp học phần</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-orange-700 uppercase tracking-wider">Thứ</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-orange-700 uppercase tracking-wider">Ca học</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-orange-700 uppercase tracking-wider">Phòng</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-orange-700 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSchedules.map((schedule) => (
                <tr key={schedule.MaLichHoc} className="hover:bg-orange-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{schedule.MaLichHoc}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{getCourseSectionInfo(schedule.MaPhanCong)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{getDayName(schedule.Thu)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{schedule.CaHoc}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{schedule.PhongHoc || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEdit(schedule)}
                        className="p-2 text-orange-500 hover:bg-orange-100 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(schedule.MaLichHoc)}
                        className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingSchedule ? 'Cập nhật lịch học' : 'Thêm lịch học mới'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Lớp học phần</label>
                  <select
                    value={formData.MaPhanCong}
                    onChange={(e) => setFormData({ ...formData, MaPhanCong: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-colors duration-200 text-gray-700"
                    required
                  >
                    <option value="">Chọn lớp học phần</option>
                    {courseSections.map((section) => (
                      <option key={section.MaPhanCong} value={section.MaPhanCong}>
                        {section.TenMonHoc} - {section.TenLop}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Thứ</label>
                  <select
                    value={formData.Thu}
                    onChange={(e) => setFormData({ ...formData, Thu: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-colors duration-200 text-gray-700"
                    required
                  >
                    <option value="">Chọn thứ</option>
                    {days.map((day) => (
                      <option key={day} value={day}>{getDayName(day)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Ca học</label>
                  <select
                    value={formData.CaHoc}
                    onChange={(e) => setFormData({ ...formData, CaHoc: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-colors duration-200 text-gray-700"
                    required
                  >
                    <option value="">Chọn ca học</option>
                    {periods.map((period) => (
                      <option key={period} value={period}>Ca {period}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Phòng học</label>
                  <input
                    type="text"
                    value={formData.PhongHoc}
                    onChange={(e) => setFormData({ ...formData, PhongHoc: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-colors duration-200 text-gray-700"
                    placeholder="P-001"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl shadow-lg shadow-orange-200 transition-colors duration-200"
                >
                  {editingSchedule ? 'Cập nhật' : 'Thêm mới'}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ScheduleManagement;
