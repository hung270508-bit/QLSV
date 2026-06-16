import React, { useState, useEffect } from 'react';
import { BookPlus, Plus, Trash2, Loader2, Clock, CheckCircle2, XCircle, MapPin, CalendarDays, X, AlertCircle, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import API_URL from '../../api';

function StudentCourseRegistration({ user }) {
  const [availableCourses, setAvailableCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // === THÊM STATE CHO UI MỚI (TOAST & DIALOG) ===
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, title: '', message: '', action: null });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [availRes, myRes] = await Promise.all([
        axios.get(`${API_URL}/api/enrollment/available/${user.username}`),
        axios.get(`${API_URL}/api/enrollment/my-courses/${user.username}`) 
      ]);
      setAvailableCourses(availRes.data);
      setMyCourses(myRes.data);
    } catch (error) { 
      console.error(error); 
      showToast('Lỗi tải dữ liệu!', 'error');
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { if (user?.username) fetchData(); }, [user]);

  // NÂNG CẤP: Logic Đăng ký dùng Custom Dialog
  const handleEnroll = async (course) => {
    if(course.DaDangKy >= (course.SoLuongToiDa || 40)) {
      return showToast("Lớp học phần này đã đủ Sĩ số!", "error");
    }
    
    setConfirmDialog({
      show: true,
      title: 'Xác nhận Đăng ký',
      message: `Bạn có chắc chắn muốn đăng ký lớp học phần ${course.MaLopHocPhan} - môn ${course.TenMonHoc}?`,
      action: async () => {
        try {
          // Nhờ API mới bên server.js, trạng thái sẽ tự động duyệt và lên lịch ngay
          const res = await axios.post(`${API_URL}/api/enrollment`, { MSSV: user.username, MaLopHocPhan: course.MaLopHocPhan, HocKy: course.HocKy });
          showToast(res.data.message || "Đăng ký thành công!", "success");
          setConfirmDialog({ show: false });
          fetchData();
        } catch (error) { 
          showToast("Lỗi khi đăng ký môn!", "error");
          setConfirmDialog({ show: false });
        }
      }
    });
  };

  // NÂNG CẤP: Logic Hủy môn dùng Custom Dialog
  const handleCancel = async (maLHP, trangThai) => {
    if (trangThai !== 'Chờ duyệt') {
      return showToast('Chỉ có thể tự hủy môn khi trạng thái "Chờ duyệt". Đã duyệt vui lòng liên hệ Giáo vụ!', 'error');
    }
    
    setConfirmDialog({
      show: true,
      title: 'Hủy đăng ký',
      message: `Hành động này không thể hoàn tác. Xác nhận hủy đăng ký lớp ${maLHP}?`,
      action: async () => {
        try {
          await axios.delete(`${API_URL}/api/enrollment/${user.username}/${maLHP}`);
          showToast("Hủy môn học thành công!", "success");
          setConfirmDialog({ show: false });
          fetchData();
        } catch (error) { 
          showToast("Lỗi khi hủy môn!", "error");
          setConfirmDialog({ show: false });
        }
      }
    });
  };

  const renderStatus = (status) => {
    if (status === 'Đã duyệt') return <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 w-fit text-xs"><CheckCircle2 className="w-3.5 h-3.5"/> Đã duyệt</span>;
    if (status === 'Từ chối') return <span className="text-red-500 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 w-fit text-xs"><XCircle className="w-3.5 h-3.5"/> Từ chối</span>;
    return <span className="text-orange-500 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 w-fit text-xs"><Clock className="w-3.5 h-3.5"/> Chờ duyệt</span>;
  };

  if (loading) return <div className="flex justify-center p-16 text-orange-500"><Loader2 className="w-12 h-12 animate-spin" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative pb-10">
      
      {/* === TOAST NOTIFICATION === */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-8 right-8 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border-l-4 ${toast.type === 'success' ? 'bg-white border-green-500' : 'bg-white border-red-500'}`}
          >
            {toast.type === 'success' ? <div className="bg-green-100 p-2 rounded-full"><CheckCircle2 className="w-6 h-6 text-green-600" /></div> : <div className="bg-red-100 p-2 rounded-full"><AlertCircle className="w-6 h-6 text-red-600" /></div>}
            <div>
              <p className="font-bold text-sm text-slate-800">{toast.type === 'success' ? 'Thành công' : 'Thất bại'}</p>
              <p className="text-slate-600 font-medium text-sm">{toast.message}</p>
            </div>
            <button onClick={() => setToast({ show: false })} className="ml-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === CUSTOM CONFIRM DIALOG === */}
      <AnimatePresence>
        {confirmDialog.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{confirmDialog.title}</h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">{confirmDialog.message}</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDialog({ show: false })} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Hủy bỏ</button>
                <button onClick={confirmDialog.action} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all">Xác nhận</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HEADER TỔNG */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-8 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex items-center gap-5">
          <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
            <BookPlus className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-3xl font-black mb-1">Đăng ký môn học</h2>
            <p className="text-orange-100 font-medium">Học kỳ hiện tại - Danh sách lớp học phần đang mở</p>
          </div>
        </div>
      </motion.div>

      {/* Danh sách ĐÃ ĐĂNG KÝ */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800 text-lg mb-5 flex items-center gap-2 border-b border-slate-100 pb-4">
          <Clock className="w-5 h-5 text-orange-500" /> Tiến trình đăng ký ({myCourses.length} môn)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold rounded-tl-xl">Mã LHP</th>
                <th className="p-4 font-bold">Tên môn học</th>
                <th className="p-4 text-center font-bold">Tín chỉ</th>
                <th className="p-4 font-bold">Trạng thái</th>
                <th className="p-4 text-center font-bold rounded-tr-xl">Tác vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {myCourses.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="p-4 font-bold text-blue-600 bg-blue-50/20">{c.MaLopHocPhan}</td>
                  <td className="p-4 font-bold text-slate-700">{c.TenMonHoc}</td>
                  <td className="p-4 text-center font-bold text-slate-600">{c.SoTinChi}</td>
                  <td className="p-4">{renderStatus(c.TrangThai)}</td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => handleCancel(c.MaLopHocPhan, c.TrangThai)} 
                      disabled={c.TrangThai !== 'Chờ duyệt'}
                      className={`p-2.5 rounded-lg transition-all flex items-center justify-center mx-auto shadow-sm
                        ${c.TrangThai === 'Chờ duyệt' ? 'bg-white border border-red-200 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed'}`}
                      title={c.TrangThai === 'Chờ duyệt' ? "Hủy đăng ký" : "Đã chốt, không thể hủy"}
                    >
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </td>
                </tr>
              ))}
              {myCourses.length === 0 && <tr><td colSpan="5" className="p-10 text-center text-slate-400 font-medium">Bạn chưa đăng ký môn học nào.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Danh sách LỚP ĐANG MỞ */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800 text-lg mb-5 border-b border-slate-100 pb-4 flex items-center gap-2">
          <BookPlus className="w-5 h-5 text-blue-500" /> Danh sách lớp học phần đang mở
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold rounded-tl-xl">Mã LHP</th>
                <th className="p-4 font-bold w-1/3">Môn học</th>
                <th className="p-4 font-bold">Lịch học chi tiết</th>
                <th className="p-4 text-center font-bold">Tín chỉ</th>
                <th className="p-4 font-bold">Giảng viên</th>
                <th className="p-4 text-center font-bold">Sĩ số</th>
                <th className="p-4 text-center font-bold rounded-tr-xl">Đăng ký</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {availableCourses.map((c, i) => {
                const isFull = c.DaDangKy >= (c.SoLuongToiDa || 40);
                
                let tietStr = "Chưa rõ";
                if (c.CaHoc) {
                  const caStr = String(c.CaHoc).replace(/\D/g, ''); 
                  if (caStr === '1') tietStr = 'Tiết 1-3';
                  else if (caStr === '2') tietStr = 'Tiết 4-6';
                  else if (caStr === '3') tietStr = 'Tiết 7-9';
                  else if (caStr === '4') tietStr = 'Tiết 10-12';
                }

                const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '';

                return (
                  <tr key={i} className={`hover:bg-slate-50/50 transition-colors group ${isFull ? 'opacity-70 bg-slate-50' : ''}`}>
                    <td className="p-4 font-bold text-slate-700 bg-slate-50/30">{c.MaLopHocPhan}</td>
                    
                    <td className="p-4">
                      <div className="font-bold text-slate-800 text-sm mb-1.5">{c.TenMonHoc}</div>
                      {(c.DiemCu === null || c.DiemCu === undefined) ? (
                        <span className="inline-block bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide">Học mới</span>
                      ) : parseFloat(c.DiemCu) < 1.0 ? (
                        <span className="inline-block bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide">Học lại (Điểm cũ: F)</span>
                      ) : (
                        <span className="inline-block bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide">Học cải thiện (Cũ: {parseFloat(c.DiemCu).toFixed(2)})</span>
                      )}
                    </td>

                    <td className="p-4">
                      {c.NgayBatDau ? (
                        <div className="space-y-2 text-xs text-slate-600 font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><CalendarDays className="w-3 h-3" /></div>
                            {formatDate(c.NgayBatDau)} <span className="text-slate-400">→</span> {formatDate(c.NgayKetThuc)}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center text-orange-600"><MapPin className="w-3 h-3" /></div>
                            Phòng: {c.PhongHoc} | {tietStr}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs font-medium">Đang cập nhật lịch...</span>
                      )}
                    </td>

                    <td className="p-4 text-center font-bold text-slate-700">{c.SoTinChi}</td>
                    <td className="p-4 font-semibold text-slate-700">{c.TenGiangVien || 'Chưa xếp'}</td>
                    
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${isFull ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                        {c.DaDangKy} / {c.SoLuongToiDa || 40}
                      </span>
                    </td>
                    
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleEnroll(c)} 
                        disabled={isFull}
                        className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs mx-auto shadow-sm transition-all
                          ${isFull ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 shadow-blue-500/30'}`}
                      >
                        {isFull ? 'Lớp đầy' : <><Plus className="w-4 h-4"/> Đăng ký</>}
                      </button>
                    </td>
                  </tr>
                )
              })}
              {availableCourses.length === 0 && <tr><td colSpan="7" className="p-12 text-center text-slate-400 font-medium text-base">Hiện không có lớp học phần nào khả dụng cho bạn lúc này.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default StudentCourseRegistration;
