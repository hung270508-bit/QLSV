import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, Search, Filter, CheckCircle2, 
  Clock, Edit, X, Calculator, UserCheck
} from 'lucide-react';
import axios from 'axios';

function AdminTrainingPoints() {
  const [pointsData, setPointsData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States cho Bộ lọc
  const [filterHocKy, setFilterHocKy] = useState('All');
  const [filterTrangThai, setFilterTrangThai] = useState('All');
  
  // State cho Modal Duyệt điểm
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [diemLop, setDiemLop] = useState(0);
  const [diemKhoa, setDiemKhoa] = useState(0);
  const [trangThaiDuyet, setTrangThaiDuyet] = useState('Đã xác nhận');

  const fetchPoints = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/admin/training-points');
      setPointsData(res.data);
    } catch (error) {
      console.error('Lỗi tải dữ liệu điểm rèn luyện:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoints();
  }, []);

  // Lọc dữ liệu
  const filteredData = pointsData.filter(item => {
    if (filterHocKy !== 'All' && item.HocKy !== filterHocKy) return false;
    if (filterTrangThai !== 'All' && item.TrangThai !== filterTrangThai) return false;
    return true;
  });

  // Tạo danh sách Học kỳ duy nhất cho bộ lọc
  const uniqueSemesters = [...new Set(pointsData.map(item => item.HocKy))];

  const handleOpenModal = (record) => {
    setSelectedRecord(record);
    setDiemLop(record.DiemLopDanhGia || record.DiemTuDanhGia); // Mặc định gợi ý bằng điểm tự đánh giá
    setDiemKhoa(record.DiemKhoaDanhGia || 0);
    setTrangThaiDuyet(record.TrangThai === 'Chờ lớp duyệt' ? 'Đã xác nhận' : record.TrangThai);
  };

  const handleSubmitReview = async () => {
    const tongDiemToiDa = Math.min(Number(diemLop) + Number(diemKhoa), 100); // Tối đa 100 điểm
    
    try {
      await axios.put(`http://localhost:5000/api/admin/training-points/${selectedRecord.MaDanhGia}`, {
        DiemLopDanhGia: diemLop,
        DiemKhoaDanhGia: diemKhoa,
        TongDiem: tongDiemToiDa,
        TrangThai: trangThaiDuyet
      });
      alert('Đã duyệt điểm rèn luyện thành công!');
      setSelectedRecord(null);
      fetchPoints();
    } catch (error) {
      alert('Có lỗi xảy ra khi duyệt điểm!');
    }
  };

  const renderStatus = (status) => {
    if (status === 'Đã xác nhận' || status === 'Đã duyệt') {
      return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle2 className="w-3.5 h-3.5"/> {status}</span>;
    }
    return <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 w-fit"><Clock className="w-3.5 h-3.5"/> {status}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="p-4 bg-orange-50 rounded-2xl">
          <Award className="w-8 h-8 text-orange-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Quản lý Điểm rèn luyện</h2>
          <p className="text-gray-500 font-medium">Theo dõi và xét duyệt điểm rèn luyện của sinh viên</p>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-gray-600 font-bold bg-gray-50 px-4 py-2 rounded-xl">
          <Filter className="w-4 h-4" /> Bộ lọc:
        </div>
        
        <select 
          value={filterHocKy} 
          onChange={(e) => setFilterHocKy(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-orange-100 outline-none"
        >
          <option value="All">Tất cả Học kỳ</option>
          {uniqueSemesters.map(hk => (
            <option key={hk} value={hk}>{hk.replace('HK', 'Học kỳ ').replace(/_/g, ' ')}</option>
          ))}
        </select>

        <select 
          value={filterTrangThai} 
          onChange={(e) => setFilterTrangThai(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-orange-100 outline-none"
        >
          <option value="All">Tất cả Trạng thái</option>
          <option value="Chờ lớp duyệt">Chờ lớp duyệt</option>
          <option value="Đã xác nhận">Đã xác nhận</option>
        </select>
      </div>

      {/* Bảng danh sách */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                <th className="p-4 font-semibold">Sinh viên</th>
                <th className="p-4 font-semibold">Học kỳ</th>
                <th className="p-4 font-semibold text-center">Tự ĐG</th>
                <th className="p-4 font-semibold text-center">Lớp ĐG</th>
                <th className="p-4 font-semibold text-center">Khoa ĐG</th>
                <th className="p-4 font-semibold text-center">Tổng điểm</th>
                <th className="p-4 font-semibold">Trạng thái</th>
                <th className="p-4 font-semibold text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.MaDanhGia} className="border-b border-gray-50 hover:bg-orange-50/30 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-gray-800">{item.HoTen}</p>
                    <p className="text-xs text-gray-500 font-medium">{item.MSSV} • Lớp: {item.MaLop}</p>
                  </td>
                  <td className="p-4 text-sm font-medium text-gray-600">
                    {item.HocKy.replace('HK', 'HK ').replace(/_/g, ' ')}
                  </td>
                  <td className="p-4 text-center font-bold text-blue-600">{item.DiemTuDanhGia}</td>
                  <td className="p-4 text-center font-bold text-gray-600">{item.DiemLopDanhGia || '-'}</td>
                  <td className="p-4 text-center font-bold text-gray-600">{item.DiemKhoaDanhGia || '-'}</td>
                  <td className="p-4 text-center font-black text-orange-600 text-base">{item.TongDiem || item.DiemTuDanhGia}</td>
                  <td className="p-4">{renderStatus(item.TrangThai)}</td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => handleOpenModal(item)}
                      className="px-4 py-2 bg-white border border-orange-200 text-orange-600 hover:bg-orange-600 hover:text-white rounded-lg font-bold text-sm transition-colors shadow-sm inline-flex items-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" /> Duyệt
                    </button>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr><td colSpan="8" className="p-8 text-center text-gray-500 italic">Không có dữ liệu điểm rèn luyện.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Duyệt Điểm */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="bg-orange-500 p-6 flex justify-between items-center text-white shrink-0">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <UserCheck className="w-5 h-5" /> Xét duyệt điểm rèn luyện
                </h3>
                <button onClick={() => setSelectedRecord(null)} className="p-1.5 hover:bg-white/20 rounded-full transition-colors"><X className="w-6 h-6" /></button>
              </div>

              <div className="p-6 space-y-6">
                
                {/* Info Sinh Viên */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                  <h4 className="font-bold text-gray-800 text-lg mb-1">{selectedRecord.HoTen}</h4>
                  <p className="text-sm text-gray-500 font-medium">MSSV: {selectedRecord.MSSV} • Lớp: {selectedRecord.MaLop}</p>
                  <div className="mt-3 inline-block px-3 py-1 bg-white border border-orange-200 text-orange-700 font-bold rounded-lg text-sm">
                    {selectedRecord.HocKy.replace('HK', 'Học kỳ ').replace(/_/g, ' ')}
                  </div>
                </div>

                {/* Form Chấm Điểm */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl">
                    <span className="font-semibold text-blue-800">Điểm Sinh viên tự đánh giá:</span>
                    <span className="text-xl font-black text-blue-600">{selectedRecord.DiemTuDanhGia}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Điểm Lớp Đánh giá</label>
                      <input 
                        type="number" max="100" min="0"
                        value={diemLop} onChange={(e) => setDiemLop(e.target.value)}
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-orange-500 text-lg font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Điểm Khoa (Cộng thêm)</label>
                      <input 
                        type="number" max="20" min="0"
                        value={diemKhoa} onChange={(e) => setDiemKhoa(e.target.value)}
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-orange-500 text-lg font-bold text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Cập nhật Trạng thái</label>
                    <select 
                      value={trangThaiDuyet} onChange={(e) => setTrangThaiDuyet(e.target.value)}
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-orange-500 font-medium text-gray-700"
                    >
                      <option value="Chờ lớp duyệt">Chờ lớp duyệt (Lưu nháp)</option>
                      <option value="Đã xác nhận">Đã xác nhận (Chốt sổ)</option>
                    </select>
                  </div>
                  
                  {/* Preview Tổng Điểm */}
                  <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600 font-medium">
                      <Calculator className="w-5 h-5 text-orange-500" /> Tổng điểm dự kiến:
                    </div>
                    <div className="text-3xl font-black text-orange-600">
                      {Math.min(Number(diemLop) + Number(diemKhoa), 100)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 border-t border-gray-200 shrink-0 flex justify-end gap-3">
                <button onClick={() => setSelectedRecord(null)} className="px-6 py-2.5 font-bold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">Hủy</button>
                <button onClick={handleSubmitReview} className="px-8 py-2.5 font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 shadow-md shadow-orange-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Lưu & Chốt điểm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminTrainingPoints;