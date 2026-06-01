import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Plus, Edit, Trash2, Search, X, RefreshCw } from 'lucide-react';
import axios from 'axios';

function ScheduleManagement() {
  const [schedules, setSchedules] = useState([]);
  const [lhpList, setLhpList] = useState([]); // Danh sách Lớp Học Phần
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    MaLopHocPhan: '',
    NgayHoc: '',
    CaHoc: '',
    PhongHoc: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [schedRes, lhpRes] = await Promise.all([
        axios.get('http://localhost:5000/api/schedules'),
        axios.get('http://localhost:5000/api/teaching-assignments') // Gọi danh sách LHP
      ]);
      setSchedules(schedRes.data);
      setLhpList(lhpRes.data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSchedule) {
        await axios.put(`http://localhost:5000/api/schedules/${editingSchedule.MaLichHoc}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/schedules', formData);
      }
      fetchData();
      handleCloseModal();
    } catch (error) {
      alert('Lỗi khi lưu lịch học!');
    }
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      MaLopHocPhan: schedule.MaLopHocPhan,
      NgayHoc: schedule.NgayHoc ? schedule.NgayHoc.split('T')[0] : '', // Chuyển ISO date sang YYYY-MM-DD cho input type="date"
      CaHoc: schedule.CaHoc,
      PhongHoc: schedule.PhongHoc
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lịch học này?')) {
      try {
        await axios.delete(`http://localhost:5000/api/schedules/${id}`);
        fetchData();
      } catch (error) {
        alert('Lỗi khi xóa!');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSchedule(null);
    setFormData({ MaLopHocPhan: '', NgayHoc: '', CaHoc: '', PhongHoc: '' });
  };

  // Hàm "phép thuật" chuyển Ngày sang Thứ
  const getDayOfWeek = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return days[date.getDay()];
  };

  // Hàm chuyển định dạng ngày YYYY-MM-DD sang DD/MM/YYYY
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const filteredSchedules = schedules.filter(s => 
    s.TenMonHoc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.TenGiangVien?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.MaLopHocPhan?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Quản lý lịch học</h2>
          <p className="text-gray-500">Thêm, sửa, xóa lịch học theo Lớp học phần</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="bg-orange-500 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-medium shadow-lg shadow-orange-200"
        >
          <Plus className="w-5 h-5" /> Thêm lịch học
        </motion.button>
      </div>

      {/* Tìm kiếm */}
      <div className="flex gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text" placeholder="Tìm kiếm theo tên môn, mã lớp, giảng viên..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-orange-500 outline-none"
          />
        </div>
        <button onClick={fetchData} className="bg-blue-500 text-white p-2.5 rounded-xl shadow-md"><RefreshCw className="w-5 h-5" /></button>
      </div>

      {/* Bảng Dữ liệu */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Ngày học</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Ca</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Phòng</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Môn học</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Mã Lớp HP</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Giảng viên</th>
              <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredSchedules.map((schedule) => (
              <tr key={schedule.MaLichHoc} className="border-b border-gray-50 hover:bg-orange-50/50">
                <td className="py-3 px-6">
                  <div className="font-bold text-blue-600">{getDayOfWeek(schedule.NgayHoc)}</div>
                  <div className="text-xs text-gray-500">{formatDate(schedule.NgayHoc)}</div>
                </td>
                <td className="py-3 px-6 text-sm text-gray-800 font-medium">Ca {schedule.CaHoc}</td>
                <td className="py-3 px-6 text-sm text-gray-600">{schedule.PhongHoc}</td>
                <td className="py-3 px-6 text-sm font-bold text-gray-800">{schedule.TenMonHoc}</td>
                <td className="py-3 px-6 text-sm text-gray-600">
                  <span className="bg-gray-100 px-2 py-1 rounded-md text-xs font-mono">{schedule.MaLopHocPhan}</span>
                </td>
                <td className="py-3 px-6 text-sm text-gray-600">{schedule.TenGiangVien}</td>
                <td className="py-3 px-6">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => handleEdit(schedule)} className="p-1.5 bg-orange-100 text-orange-600 rounded hover:bg-orange-200"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(schedule.MaLichHoc)} className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredSchedules.length === 0 && <tr><td colSpan="7" className="text-center py-8 text-gray-500">Không có dữ liệu</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/30 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{editingSchedule ? 'Cập nhật lịch học' : 'Tạo lịch học mới'}</h3>
              <button onClick={handleCloseModal}><X className="text-gray-500" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Lớp Học Phần</label>
                <select 
                  value={formData.MaLopHocPhan} 
                  onChange={(e) => setFormData({ ...formData, MaLopHocPhan: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500" required
                >
                  <option value="">-- Chọn Lớp Học Phần --</option>
                  {lhpList.map(lhp => (
                    <option key={lhp.MaLopHocPhan} value={lhp.MaLopHocPhan}>
                      {lhp.TenMonHoc} - {lhp.MaLopHocPhan} ({lhp.TenGiangVien})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Ngày học</label>
                  <input 
                    type="date" 
                    value={formData.NgayHoc} 
                    onChange={(e) => setFormData({ ...formData, NgayHoc: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500" required
                  />
                  {formData.NgayHoc && (
                    <p className="text-xs text-blue-600 mt-1 font-medium italic">👉 Nhận diện: {getDayOfWeek(formData.NgayHoc)}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Ca học</label>
                  <select 
                    value={formData.CaHoc} 
                    onChange={(e) => setFormData({ ...formData, CaHoc: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500" required
                  >
                    <option value="">Chọn Ca</option>
                    <option value="1">Ca 1 (Tiết 1-3)</option>
                    <option value="2">Ca 2 (Tiết 4-6)</option>
                    <option value="3">Ca 3 (Tiết 7-9)</option>
                    <option value="4">Ca 4 (Tiết 10-12)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Phòng học</label>
                <input 
                  type="text" placeholder="VD: E1-04.08/1"
                  value={formData.PhongHoc} 
                  onChange={(e) => setFormData({ ...formData, PhongHoc: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500" required
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={handleCloseModal} className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200">Hủy</button>
                <button type="submit" className="flex-1 py-2.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 shadow-md">
                  {editingSchedule ? 'Lưu thay đổi' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default ScheduleManagement;
