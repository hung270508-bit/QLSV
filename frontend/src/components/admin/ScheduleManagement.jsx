import React, { useState, useEffect } from 'react';
import API_URL from '../../api';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Plus, Edit, Trash2, Search, X, RefreshCw } from 'lucide-react';
import axios from 'axios';

function ScheduleManagement() {
  const [schedules, setSchedules] = useState([]);
  const [lhpList, setLhpList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ MaLopHocPhan: '', NgayHoc: '', CaHoc: '', PhongHoc: '' });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [schedRes, lhpRes] = await Promise.all([
        axios.get(`${API_URL}/api/schedules`),
        axios.get(`${API_URL}/api/teaching-assignments`)
      ]);
      setSchedules(schedRes.data);
      setLhpList(lhpRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const validateScheduleForm = () => {
    const errors = {};
    if (!formData.MaLopHocPhan) errors.MaLopHocPhan = 'Vui lòng chọn lớp học phần';
    if (!formData.NgayHoc) {
      errors.NgayHoc = 'Vui lòng chọn ngày học';
    } else {
      const today = new Date(); today.setHours(0,0,0,0);
      const selected = new Date(formData.NgayHoc);
      if (selected < today) errors.NgayHoc = 'Ngày học không được là ngày trong quá khứ';
    }
    if (!formData.CaHoc) errors.CaHoc = 'Vui lòng chọn ca học';
    if (!formData.PhongHoc.trim()) {
      errors.PhongHoc = 'Phòng học không được để trống';
    } else if (formData.PhongHoc.trim().length < 2) {
      errors.PhongHoc = 'Phòng học phải có ít nhất 2 ký tự';
    } else if (formData.PhongHoc.trim().length > 20) {
      errors.PhongHoc = 'Phòng học tối đa 20 ký tự';
    } else if (!/^[a-zA-Z0-9\-._\/]+$/.test(formData.PhongHoc.trim())) {
      errors.PhongHoc = 'Phòng học chỉ gồm chữ, số và ký tự - . _';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateScheduleForm()) return;
    try {
      if (editingSchedule) {
        await axios.put(`${API_URL}/api/schedules/${editingSchedule.MaLichHoc}`, formData);
      } else {
        await axios.post(`${API_URL}/api/schedules`, formData);
      }
      fetchData();
      handleCloseModal();
    } catch {
      alert('Lỗi khi lưu lịch học!');
    }
  };

  const handleEdit = (s) => {
    setEditingSchedule(s);
    setFormData({
      MaLopHocPhan: s.MaLopHocPhan,
      NgayHoc: s.NgayHoc ? s.NgayHoc.split('T')[0] : '',
      CaHoc: s.CaHoc,
      PhongHoc: s.PhongHoc
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa lịch học này?')) return;
    try {
      await axios.delete(`${API_URL}/api/schedules/${id}`);
      fetchData();
    } catch {
      alert('Lỗi khi xóa!');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSchedule(null);
    setFormData({ MaLopHocPhan: '', NgayHoc: '', CaHoc: '', PhongHoc: '' });
    setFormErrors({});
  };

  const getDayOfWeek = (d) => {
    if (!d) return '';
    return ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][new Date(d).getDay()];
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '';

  const dayColors = {
    'Thứ 2': 'text-blue-600 bg-blue-50', 'Thứ 3': 'text-violet-600 bg-violet-50',
    'Thứ 4': 'text-emerald-600 bg-emerald-50', 'Thứ 5': 'text-amber-600 bg-amber-50',
    'Thứ 6': 'text-orange-600 bg-orange-50', 'Thứ 7': 'text-pink-600 bg-pink-50',
    'Chủ nhật': 'text-red-600 bg-red-50'
  };

  const filtered = schedules.filter(s =>
    s.TenMonHoc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.TenGiangVien?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.MaLopHocPhan?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-10 h-10 border-orange-500 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3, borderStyle: 'solid' }} />
      <span className="text-sm text-gray-400">Đang tải...</span>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 shadow-lg shadow-orange-200/50 flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <CalendarIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Quản lý lịch học</h2>
            <p className="text-orange-100 text-sm mt-0.5">Thêm, sửa, xóa lịch học theo lớp học phần</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          onClick={() => setShowModal(true)}
          className="bg-white text-orange-600 px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold shadow-md hover:shadow-lg transition-shadow text-sm"
        >
          <Plus className="w-4 h-4" /> Thêm lịch học
        </motion.button>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        className="flex gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-100"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm theo tên môn, mã lớp, giảng viên..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-orange-400 focus:bg-white outline-none text-sm transition-all"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={fetchData}
          className="bg-blue-500 text-white p-2.5 rounded-xl shadow-sm hover:bg-blue-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </motion.button>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <table className="w-full">
          <thead className="bg-gray-50/80 border-b border-gray-100">
            <tr>
              {['Ngày học', 'Ca', 'Phòng', 'Môn học', 'Mã Lớp HP', 'Giảng viên', 'Thao tác'].map(h => (
                <th key={h} className={`py-3.5 px-5 text-xs font-bold text-gray-500 uppercase tracking-wide ${h === 'Thao tác' ? 'text-center' : 'text-left'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => {
              const day = getDayOfWeek(s.NgayHoc);
              const dayClass = dayColors[day] || 'text-gray-600 bg-gray-50';
              return (
                <motion.tr
                  key={s.MaLichHoc}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.18 }}
                  className="border-b border-gray-50 hover:bg-orange-50/30 transition-colors duration-150"
                >
                  <td className="py-3.5 px-5">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${dayClass}`}>{day}</span>
                    <div className="text-xs text-gray-400 mt-0.5">{formatDate(s.NgayHoc)}</div>
                  </td>
                  <td className="py-3.5 px-5 text-sm font-semibold text-gray-700">Ca {s.CaHoc}</td>
                  <td className="py-3.5 px-5 text-sm text-gray-600">{s.PhongHoc}</td>
                  <td className="py-3.5 px-5 text-sm font-semibold text-gray-800">{s.TenMonHoc}</td>
                  <td className="py-3.5 px-5">
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-mono">{s.MaLopHocPhan}</span>
                  </td>
                  <td className="py-3.5 px-5 text-sm text-gray-600">{s.TenGiangVien}</td>
                  <td className="py-3.5 px-5">
                    <div className="flex items-center justify-center gap-2">
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => handleEdit(s)}
                        className="p-1.5 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors border border-orange-100"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(s.MaLichHoc)}
                        className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                  <p className="font-medium">Không có dữ liệu</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-orange-500" />
                  {editingSchedule ? 'Cập nhật lịch học' : 'Tạo lịch học mới'}
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                  onClick={handleCloseModal}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </motion.button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Lớp Học Phần</label>
                  <select
                    value={formData.MaLopHocPhan}
                    onChange={e => {
                      setFormData({ ...formData, MaLopHocPhan: e.target.value });
                      if (formErrors.MaLopHocPhan) setFormErrors(prev => ({ ...prev, MaLopHocPhan: '' }));
                    }}
                    className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl outline-none text-sm transition-colors ${formErrors.MaLopHocPhan ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-orange-400'}`}
                    required
                  >
                    <option value="">-- Chọn Lớp Học Phần --</option>
                    {lhpList.map(lhp => (
                      <option key={lhp.MaLopHocPhan} value={lhp.MaLopHocPhan}>
                        {lhp.TenMonHoc} - {lhp.MaLopHocPhan} ({lhp.TenGiangVien})
                      </option>
                    ))}
                  </select>
                  {formErrors.MaLopHocPhan && <p className="text-red-500 text-xs mt-1">{formErrors.MaLopHocPhan}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ngày học</label>
                    <input
                      type="date"
                      value={formData.NgayHoc}
                      onChange={e => {
                        setFormData({ ...formData, NgayHoc: e.target.value });
                        if (formErrors.NgayHoc) setFormErrors(prev => ({ ...prev, NgayHoc: '' }));
                      }}
                      className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl outline-none text-sm transition-colors ${formErrors.NgayHoc ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-orange-400'}`}
                      required
                    />
                    {formData.NgayHoc && !formErrors.NgayHoc && (
                      <p className="text-xs text-blue-500 mt-1 font-medium">👉 {getDayOfWeek(formData.NgayHoc)}</p>
                    )}
                    {formErrors.NgayHoc && <p className="text-red-500 text-xs mt-1">{formErrors.NgayHoc}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ca học</label>
                    <select
                      value={formData.CaHoc}
                      onChange={e => {
                        setFormData({ ...formData, CaHoc: e.target.value });
                        if (formErrors.CaHoc) setFormErrors(prev => ({ ...prev, CaHoc: '' }));
                      }}
                      className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl outline-none text-sm transition-colors ${formErrors.CaHoc ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-orange-400'}`}
                      required
                    >
                      <option value="">Chọn Ca</option>
                      <option value="1">Ca 1 (Tiết 1-3)</option>
                      <option value="2">Ca 2 (Tiết 4-6)</option>
                      <option value="3">Ca 3 (Tiết 7-9)</option>
                      <option value="4">Ca 4 (Tiết 10-12)</option>
                    </select>
                    {formErrors.CaHoc && <p className="text-red-500 text-xs mt-1">{formErrors.CaHoc}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phòng học</label>
                  <input
                    type="text"
                    placeholder="VD: E1-04.08/1"
                    value={formData.PhongHoc}
                    onChange={e => {
                      setFormData({ ...formData, PhongHoc: e.target.value });
                      if (formErrors.PhongHoc) setFormErrors(prev => ({ ...prev, PhongHoc: '' }));
                    }}
                    className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl outline-none text-sm transition-colors ${formErrors.PhongHoc ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-orange-400'}`}
                    required
                  />
                  {formErrors.PhongHoc && <p className="text-red-500 text-xs mt-1">{formErrors.PhongHoc}</p>}
                </div>

                <div className="flex gap-3 pt-3 border-t border-gray-100">
                  <motion.button
                    type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleCloseModal}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 text-sm transition-colors"
                  >
                    Hủy
                  </motion.button>
                  <motion.button
                    type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-md text-sm"
                  >
                    {editingSchedule ? 'Lưu thay đổi' : 'Thêm mới'}
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

export default ScheduleManagement;
