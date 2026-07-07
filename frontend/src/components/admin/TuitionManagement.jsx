import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Import axios
import API_URL from '../../api'; // Import URL từ file của bạn

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});
const TuitionManagement = () => {
  const [tuitions, setTuitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  useEffect(() => {
    fetchTuitions();
  }, []);

  const fetchTuitions = async () => {
  try {
    setLoading(true);
    // Change this line:
    const response = await api.get('/api/admin/tuitions');
    setTuitions(response.data);
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu học phí:", error);
    alert("Không thể tải dữ liệu.");
  } finally {
    setLoading(false);
  }
};
  const confirmPayment = async (mssv, maLhp) => {
    await axios.post(`${API_URL}/api/admin/confirm-tuition`, { MSSV: mssv, MaLopHocPhan: maLhp });
};
  const toggleStatus = async (id, currentStatus) => {
  const newStatus = currentStatus === 'Chưa đóng' ? 'Đã đóng' : 'Chưa đóng';
  try {
    // Change this line:
    await api.put(`/api/admin/tuitions/${id}/status`, { trang_thai: newStatus });
    
    setTuitions(prev => 
      prev.map(t => t.id === id ? { ...t, trang_thai: newStatus } : t)
    );
  } catch (error) {
    console.error(error);
    alert("Cập nhật trạng thái thất bại!");
  }
};

  // Lọc dữ liệu
  const filteredTuitions = tuitions
    .filter(t => 
      t.ma_sinh_vien?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.ten_sinh_vien && t.ten_sinh_vien.toLowerCase().includes(searchTerm.toLowerCase())) ||
      t.hoc_ky?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(t => statusFilter === 'all' || t.trang_thai === statusFilter)
    .filter(t => semesterFilter === 'all' || t.hoc_ky === semesterFilter);

  const semesters = [...new Set(tuitions.map(t => t.hoc_ky))];

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Quản lý Học Phí</h2>
          <p className="text-gray-500 mt-1">Thống kê và xác nhận thanh toán học phí sinh viên</p>
        </div>
        
        <button 
          onClick={fetchTuitions}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl flex items-center gap-2 transition"
        >
          ↻ Làm mới
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Tìm theo mã SV, tên SV hoặc học kỳ..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="Đã đóng">Đã đóng</option>
            <option value="Chưa đóng">Chưa đóng</option>
          </select>

          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả học kỳ</option>
            {semesters.map(sem => (
              <option key={sem} value={sem}>{sem}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Mã SV</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Họ Tên</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Học Kỳ</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Số Tiền</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Hạn Nộp</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Trạng Thái</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600 w-48">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-16 text-center text-gray-500">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : filteredTuitions.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-16 text-center text-gray-500">
                  Không tìm thấy khoản học phí nào phù hợp
                </td>
              </tr>
            ) : (
              filteredTuitions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{t.ma_sinh_vien}</td>
                  <td className="px-6 py-4 text-gray-700 font-medium">{t.ten_sinh_vien || '—'}</td>
                  <td className="px-6 py-4 text-gray-700">{t.hoc_ky}</td>
                  <td className="px-6 py-4 font-semibold text-emerald-600">
                    {Number(t.so_tien).toLocaleString('vi-VN')} đ
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(t.han_nop).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3.5 py-1 text-sm font-medium rounded-full ${
                      t.trang_thai === 'Đã đóng' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {t.trang_thai}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {t.trang_thai === 'Chưa đóng' ? (
                      <button 
                        onClick={() => toggleStatus(t.id, t.trang_thai)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition shadow-sm w-full"
                      >
                        Xác nhận đã thu
                      </button>
                    ) : (
                      <button 
                        onClick={() => toggleStatus(t.id, t.trang_thai)}
                        className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition shadow-sm w-full"
                      >
                        Hủy xác nhận
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-500 flex justify-between items-center">
        <div>
          Hiển thị <span className="font-medium text-gray-700">{filteredTuitions.length}</span> / {tuitions.length} khoản
        </div>
      </div>
    </div>
  );
};

export default TuitionManagement;