import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Filter, CheckCircle2, Clock, Edit, X, Calculator, UserCheck } from 'lucide-react';
import axios from 'axios';

function AdminTrainingPoints() {
  const [pointsData, setPointsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterHocKy, setFilterHocKy] = useState('All');
  const [filterTrangThai, setFilterTrangThai] = useState('All');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [diemLop, setDiemLop] = useState(0);
  const [diemKhoa, setDiemKhoa] = useState(0);
  const [trangThaiDuyet, setTrangThaiDuyet] = useState('Đã xác nhận');

  const fetchPoints = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/admin/training-points');
      setPointsData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPoints(); }, []);

  const filteredData = pointsData.filter(item => {
    if (filterHocKy !== 'All' && item.HocKy !== filterHocKy) return false;
    if (filterTrangThai !== 'All' && item.TrangThai !== filterTrangThai) return false;
    return true;
  });

  const uniqueSemesters = [...new Set(pointsData.map(item => item.HocKy))];

  const handleOpenModal = (record) => {
    setSelectedRecord(record);
    setDiemLop(record.DiemLopDanhGia || record.DiemTuDanhGia);
    setDiemKhoa(record.DiemKhoaDanhGia || 0);
    setTrangThaiDuyet(record.TrangThai === 'Chờ lớp duyệt' ? 'Đã xác nhận' : record.TrangThai);
  };

  const handleSubmitReview = async () => {
    const tongDiem = Math.min(Number(diemLop) + Number(diemKhoa), 100);
    try {
      await axios.put(`http://localhost:5000/api/admin/training-points/${selectedRecord.MaDanhGia}`, {
        DiemLopDanhGia: diemLop,
        DiemKhoaDanhGia: diemKhoa,
        TongDiem: tongDiem,
        TrangThai: trangThaiDuyet
      });
      setSelectedRecord(null);
      fetchPoints();
    } catch {
      alert('Có lỗi xảy ra khi duyệt điểm!');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-500';
  };

  const tongDiemPreview = Math.min(Number(diemLop) + Number(diemKhoa), 100);

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 shadow-lg shadow-orange-200/50 flex items-center gap-4"
      >
        <div className="p-3 bg-white/20 rounded-xl">
          <Award className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Quản lý Điểm rèn luyện</h2>
          <p className="text-orange-100 text-sm mt-0.5">Theo dõi và xét duyệt điểm rèn luyện sinh viên</p>
        </div>
        <div className="ml-auto flex gap-3">
          <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
            <div className="text-white font-bold text-lg">{pointsData.filter(p => p.TrangThai === 'Chờ lớp duyệt').length}</div>
            <div className="text-orange-100 text-xs">Chờ duyệt</div>
          </div>
          <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
            <div className="text-white font-bold text-lg">{pointsData.filter(p => p.TrangThai === 'Đã xác nhận').length}</div>
            <div className="text-orange-100 text-xs">Đã duyệt</div>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-3 items-center"
      >
        <div className="flex items-center gap-2 text-gray-500 font-semibold text-sm">
          <Filter className="w-4 h-4" /> Bộ lọc:
        </div>
        <select
          value={filterHocKy}
          onChange={e => setFilterHocKy(e.target.value)}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 transition-all"
        >
          <option value="All">Tất cả học kỳ</option>
          {uniqueSemesters.map(hk => (
            <option key={hk} value={hk}>{hk.replace('HK', 'Học kỳ ').replace(/_/g, ' ')}</option>
          ))}
        </select>
        <select
          value={filterTrangThai}
          onChange={e => setFilterTrangThai(e.target.value)}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 transition-all"
        >
          <option value="All">Tất cả trạng thái</option>
          <option value="Chờ lớp duyệt">Chờ lớp duyệt</option>
          <option value="Đã xác nhận">Đã xác nhận</option>
        </select>
        <span className="ml-auto text-sm text-gray-400">{filteredData.length} sinh viên</span>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-10 h-10 border-orange-500 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3, borderStyle: 'solid' }} />
            <span className="text-sm text-gray-400">Đang tải...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  {['Sinh viên', 'Học kỳ', 'Tự ĐG', 'Lớp ĐG', 'Khoa ĐG', 'Tổng điểm', 'Trạng thái', 'Thao tác'].map(h => (
                    <th key={h} className={`p-4 text-xs font-bold text-gray-500 uppercase tracking-wide ${['Tự ĐG', 'Lớp ĐG', 'Khoa ĐG', 'Tổng điểm', 'Thao tác'].includes(h) ? 'text-center' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, i) => (
                  <motion.tr
                    key={item.MaDanhGia}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.035, duration: 0.2 }}
                    className="border-b border-gray-50 hover:bg-orange-50/30 transition-colors duration-150"
                  >
                    <td className="p-4">
                      <p className="font-semibold text-gray-800 text-sm">{item.HoTen}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.MSSV} · Lớp: {item.MaLop}</p>
                    </td>
                    <td className="p-4 text-sm text-gray-600 font-medium">
                      {item.HocKy.replace('HK', 'HK ').replace(/_/g, ' ')}
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-bold text-blue-600">{item.DiemTuDanhGia}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-semibold text-gray-600">{item.DiemLopDanhGia || '–'}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-semibold text-gray-600">{item.DiemKhoaDanhGia || '–'}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-lg font-black ${getScoreColor(item.TongDiem || item.DiemTuDanhGia)}`}>
                        {item.TongDiem || item.DiemTuDanhGia}
                      </span>
                    </td>
                    <td className="p-4">
                      {item.TrangThai === 'Đã xác nhận' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Đã xác nhận
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">
                          <Clock className="w-3 h-3" /> {item.TrangThai}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleOpenModal(item)}
                        className="px-3 py-1.5 bg-orange-50 border border-orange-200 text-orange-600 hover:bg-orange-600 hover:text-white rounded-lg font-semibold text-xs transition-all duration-200 inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <Edit className="w-3.5 h-3.5" /> Duyệt
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-gray-400">
                      <Award className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                      <p className="font-medium">Không có dữ liệu</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-5 flex justify-between items-center text-white">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <UserCheck className="w-5 h-5" /> Xét duyệt điểm rèn luyện
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedRecord(null)}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              <div className="p-5 space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                  <h4 className="font-bold text-gray-800">{selectedRecord.HoTen}</h4>
                  <p className="text-sm text-gray-500 mt-0.5">{selectedRecord.MSSV} · Lớp: {selectedRecord.MaLop}</p>
                  <span className="mt-2 inline-block px-3 py-1 bg-white border border-orange-200 text-orange-700 font-semibold rounded-lg text-sm">
                    {selectedRecord.HocKy.replace('HK', 'Học kỳ ').replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <span className="text-sm font-semibold text-blue-700">Điểm tự đánh giá:</span>
                  <span className="text-2xl font-black text-blue-600">{selectedRecord.DiemTuDanhGia}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Điểm Lớp đánh giá</label>
                    <input
                      type="number" max="100" min="0"
                      value={diemLop}
                      onChange={e => setDiemLop(e.target.value)}
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-orange-400 text-xl font-bold text-center transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Điểm Khoa (Cộng thêm)</label>
                    <input
                      type="number" max="20" min="0"
                      value={diemKhoa}
                      onChange={e => setDiemKhoa(e.target.value)}
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-orange-400 text-xl font-bold text-center transition-colors"
                    />
                  </div>
                </div>

                <select
                  value={trangThaiDuyet}
                  onChange={e => setTrangThaiDuyet(e.target.value)}
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-orange-400 text-sm font-medium text-gray-700 transition-colors"
                >
                  <option value="Chờ lớp duyệt">Lưu nháp</option>
                  <option value="Đã xác nhận">Đã xác nhận (Chốt sổ)</option>
                </select>

                <motion.div
                  key={tongDiemPreview}
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  className="flex items-center justify-between pt-3 border-t border-gray-100"
                >
                  <div className="flex items-center gap-2 text-gray-600 text-sm font-medium">
                    <Calculator className="w-4 h-4 text-orange-500" /> Tổng điểm dự kiến:
                  </div>
                  <span className={`text-4xl font-black ${getScoreColor(tongDiemPreview)}`}>
                    {tongDiemPreview}
                  </span>
                </motion.div>
              </div>

              <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedRecord(null)}
                  className="px-5 py-2 font-semibold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 text-sm transition-colors"
                >
                  Hủy
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleSubmitReview}
                  className="px-6 py-2 font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 shadow-md shadow-orange-200 flex items-center gap-2 text-sm transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" /> Lưu & Chốt điểm
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminTrainingPoints;
