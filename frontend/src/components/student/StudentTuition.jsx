import React, { useState, useEffect } from 'react';
import { Wallet, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import axios from 'axios';
import API_URL from '../../api';

const StudentTuition = () => {
  const [tuitions, setTuitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [maSinhVien, setMaSinhVien] = useState(null);

  // Lấy mã sinh viên với retry
  useEffect(() => {
  const storageUser =
    JSON.parse(localStorage.getItem("user") || "null") ||
    JSON.parse(sessionStorage.getItem("user") || "null");

  console.log("User:", storageUser);

  if (!storageUser) {
    setError("Không tìm thấy thông tin đăng nhập.");
    setLoading(false);
    return;
  }

  const msv =
    storageUser.id ||
    storageUser.username ||
    storageUser.MSSV ||
    storageUser.ma_sinh_vien;

  console.log("Mã SV:", msv);

  if (!msv) {
    setError("Không tìm thấy mã sinh viên.");
    setLoading(false);
    return;
  }

  setMaSinhVien(msv);
}, []);

  // Fetch dữ liệu khi có mã SV
  useEffect(() => {
    if (maSinhVien) {
      fetchMyTuitions();
    }
  }, [maSinhVien]);

  const fetchMyTuitions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/student/tuitions/${maSinhVien}`);
      console.log("📊 Dữ liệu học phí:", response.data);
      setTuitions(response.data || []);
    } catch (err) {
      console.error("❌ Lỗi tải học phí:", err);
      setError("Không thể tải thông tin học phí.");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    window.location.reload(); // Hard refresh để chắc chắn
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-amber-500"></div>
        <p className="mt-4 text-slate-600">Đang tải thông tin học phí...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <p className="mt-4 text-red-600 font-medium">{error}</p>
        <button 
          onClick={handleRetry}
          className="mt-6 px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl">
            <Wallet className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-3xl font-black">Học Phí</h2>
            <p className="text-white/80 mt-1">Thông tin các khoản học phí theo học kỳ</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <h3 className="font-bold text-slate-800 text-xl mb-6 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-amber-500" />
          Các khoản học phí của bạn
        </h3>

        {tuitions.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            Hiện bạn không có khoản học phí nào.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tuitions.map((t) => (
              <div key={t.id} className="border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-lg">{t.hoc_ky}</h4>
                    <p className="text-sm text-slate-500 mt-1">Mã SV: {t.ma_sinh_vien}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    t.trang_thai === 'Đã đóng' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {t.trang_thai}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-lg">
                    <span className="text-slate-500">Số tiền:</span>
                    <span className="font-semibold text-red-600">
                      {Number(t.so_tien).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hạn nộp:</span>
                    <span>{new Date(t.han_nop).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>

                {t.trang_thai === 'Chưa đóng' && (
                  <button onClick={() => alert("Tính năng thanh toán đang được phát triển")} className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium">
                    Thanh toán ngay
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentTuition;