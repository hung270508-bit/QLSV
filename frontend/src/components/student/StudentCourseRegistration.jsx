import React, { useState, useEffect } from 'react';
import { BookPlus, Plus, Trash2, Clock, CheckCircle2, MapPin, CalendarDays, AlertCircle, Save, XCircle, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import API_URL from '../../api';
import ModalPortal, { Toast, ConfirmDialog } from '../common/ModalPortal';
import { StudentCourseRegistrationSkeleton } from '../common/StudentSkeleton';

function StudentCourseRegistration({ user }) {
  const [availableCourses, setAvailableCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [cart, setCart] = useState([]); // GIỎ HÀNG ẢO CHƯA LƯU
  const [loading, setLoading] = useState(true);

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
      showToast('Lỗi tải dữ liệu. Vui lòng refresh lại trang!', 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { console.log("User data:", user);           // ← thêm dòng này
    if (user?.username) fetchData(); }, [user]);

  // LOGIC 1: ĐƯA VÀO GIỎ HÀNG TẠM (Chưa ném lên Server)
  // LOGIC 1: CHỈ CHO CHỌN 1 LỚP CHO 1 MÔN + ẨN NÚT CHỌN KHI ĐÃ CÓ
const handleAddToCart = (course) => {
    // Kiểm tra đã có trong giỏ tạm
    if (cart.find(c => c.MaMonHoc === course.MaMonHoc)) {
        return showToast(`Môn ${course.TenMonHoc} đã có trong danh sách tạm!`, "error");
    }

    // Kiểm tra đã đăng ký rồi
    if (myCourses.find(c => c.MaMonHoc === course.MaMonHoc)) {
        return showToast(`Bạn đã đăng ký môn ${course.TenMonHoc} rồi!`, "error");
    }

    setCart([...cart, course]);
    showToast(`Đã thêm môn ${course.TenMonHoc} (${course.SoBuoi || '?'} buổi) vào danh sách tạm`, "success");
};
  // LOGIC 2: XÓA KHỎI GIỎ HÀNG (Chỉ xóa local)
  const handleRemoveFromCart = (maLHP) => {
    setCart(cart.filter(c => c.MaLopHocPhan !== maLHP));
  };

  // LOGIC 2b: XÓA HỌC PHẦN ĐÃ LƯU TRONG DB.
  // Chỉ hiện/enable nút này khi TrangThai còn "Chờ đóng tiền" (chưa đóng tiền, chưa hủy).
  // Việc đợt đăng ký còn "Mở" hay đã đóng do BACKEND kiểm tra và quyết định thật sự
  // (theo đúng niên khóa của từng SV) — nếu đợt đã đóng, server sẽ từ chối và trả lỗi
  // rõ ràng, hiển thị qua toast bên dưới.
  const handleRemoveSaved = (course) => {
    setConfirmDialog({
      show: true,
      title: 'Xóa học phần đã đăng ký',
      message: `Bạn có chắc muốn xóa lớp học phần ${course.MaLopHocPhan} - ${course.TenMonHoc} khỏi danh sách đã đăng ký? Sau khi xóa bạn có thể chọn môn/lớp khác trong đợt đăng ký này.`,
      action: async () => {
        try {
          // Đúng thứ tự tham số backend: DELETE /api/enrollment/:mssv/:maLhp
          await axios.delete(`${API_URL}/api/enrollment/${user.username}/${course.MaLopHocPhan}`);
          showToast('Đã xóa học phần khỏi danh sách đăng ký!', 'success');
          fetchData();
          setConfirmDialog({ show: false });
        } catch (error) {
          showToast(error.response?.data?.message || 'Không thể xóa học phần này!', 'error');
          setConfirmDialog({ show: false });
        }
      }
    });
  };

  // LOGIC 3: LƯU TOÀN BỘ VÀO DATABASE
  // LOGIC 3: LƯU TOÀN BỘ VÀO DATABASE
const handleFinalize = () => {
    if (cart.length === 0) return showToast("Tiến trình đang trống!", "error");
    
    setConfirmDialog({
        show: true,
        title: 'Lưu thông tin đăng ký',
        message: `Hệ thống sẽ tiến hành kiểm tra trùng lịch và lưu tạm ${cart.length} môn học này với trạng thái "Chờ đóng tiền"...`,
        action: async () => {
            try {
                const res = await axios.post(`${API_URL}/api/enrollment/batch`, { 
                    MSSV: user.username, 
                    cart: cart.map(c => ({ 
                        ...c, 
                        HocKy: '2025.1'   // ← Thêm dòng này (hoặc năm học hiện tại)
                    })) 
                });
                
                showToast(res.data.message || "Lưu thông tin đăng ký thành công!", "success");
                setCart([]); 
                fetchData(); 
                setConfirmDialog({ show: false });
            } catch (error) {
                showToast(error.response?.data?.message || "Có lỗi xảy ra khi kiểm tra môn học!", "error");
                setConfirmDialog({ show: false });
            }
        }
    });
};

  // Lấy tổng hợp danh sách đang hiển thị ở Tiến trình (Mix giữa DB và Local)
  const displayList = [
    ...cart.map(c => ({ ...c, isLocal: true, TrangThai: 'Tạm lưu' })),
    ...myCourses.map(c => ({ ...c, isLocal: false }))
  ];

  // Hiển thị đúng trạng thái đăng ký/đóng tiền trả về từ server
  const renderStatusBadge = (trangThai) => {
    switch (trangThai) {
      case 'Đã đóng tiền':
        return <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 w-fit text-xs"><CheckCircle2 className="w-3.5 h-3.5"/> Đã đóng tiền</span>;
      case 'Đã hủy':
      case 'Từ chối':
        return <span className="text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 w-fit text-xs"><XCircle className="w-3.5 h-3.5"/> Đã hủy</span>;
      case 'Chờ đóng tiền':
      default:
        return <span className="text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 w-fit text-xs"><Wallet className="w-3.5 h-3.5"/> Chờ đóng tiền</span>;
    }
  };

  if (loading) return <StudentCourseRegistrationSkeleton />;

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative pb-10">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: '', type: 'success' })} />
      <ConfirmDialog show={confirmDialog.show} title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.action} onCancel={() => setConfirmDialog({ show: false, title: '', message: '', action: null })} />

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#F4C542] rounded-3xl p-8 text-[#152238] shadow-xl shadow-amber-500/20 relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-5">
          <div className="p-4 bg-white/40 backdrop-blur-sm rounded-2xl"><BookPlus className="w-10 h-10" /></div>
          <div><h2 className="text-3xl font-black mb-1">Đăng ký môn học</h2><p className="text-[#152238]/70 font-medium">Học kỳ hiện tại - Danh sách lớp học phần đang mở</p></div>
        </div>
      </motion.div>

      {/* TIẾN TRÌNH ĐĂNG KÝ VÀ NÚT CHỐT LƯU */}
      <div className="bg-[#FFFFFF] p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 border-b border-slate-100 pb-4">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#F4C542]" /> Tiến trình đăng ký ({displayList.length} môn)
          </h3>
          {cart.length > 0 && (
            <button onClick={handleFinalize} className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-500/30 flex items-center gap-2 transition-all hover:scale-105 animate-pulse">
              <Save className="w-4 h-4"/> Lưu lại ngay
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold rounded-tl-xl">Mã LHP</th><th className="p-4 font-bold">Tên môn học</th><th className="p-4 text-center font-bold">Tín chỉ</th><th className="p-4 font-bold">Trạng thái</th><th className="p-4 text-center font-bold rounded-tr-xl">Tác vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {displayList.map((c, i) => (
                <tr key={i} className={`hover:bg-slate-50/80 transition-colors ${c.isLocal ? 'bg-[#FFF7D6]/30' : ''}`}>
                  <td className="p-4 font-bold text-[#3B82F6]">{c.MaLopHocPhan}</td>
                  <td className="p-4 font-bold text-slate-700">{c.TenMonHoc}</td>
                  <td className="p-4 text-center font-bold text-slate-600">{c.SoTinChi}</td>
                  <td className="p-4">
                    {c.isLocal 
                      ? <span className="text-[#F4C542] bg-[#FFF7D6] border border-[#FFF7D6] px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 w-fit text-xs"><AlertCircle className="w-3.5 h-3.5"/> Tạm lưu</span>
                      : renderStatusBadge(c.TrangThai)
                    }
                  </td>
                  <td className="p-4 text-center">
                    {(() => {
                      // Học phần local (chưa lưu): luôn xóa được khỏi giỏ.
                      // Học phần đã lưu (DB): dùng field CoTheXoa do BACKEND tính sẵn
                      // (đúng theo niên khóa của SV + trạng thái đợt đăng ký thật sự) —
                      // đợt đóng thì nút tự chuyển xám ngay, không cần bấm thử mới biết.
                      const canRemoveSaved = !c.isLocal && !!c.CoTheXoa;
                      const canRemove = c.isLocal || canRemoveSaved;
                      const title = c.isLocal
                        ? 'Xóa khỏi danh sách tạm'
                        : canRemoveSaved
                          ? 'Xóa học phần đã đăng ký (đợt đang mở)'
                          : c.TrangThai !== 'Chờ đóng tiền'
                            ? 'Đã đóng tiền hoặc đã hủy, không thể xóa'
                            : 'Đợt đăng ký đã đóng, không thể sửa/xóa';
                      return (
                        <button
                          onClick={() => {
                            if (c.isLocal) return handleRemoveFromCart(c.MaLopHocPhan);
                            if (canRemoveSaved) return handleRemoveSaved(c);
                          }}
                          disabled={!canRemove}
                          title={title}
                          className={`p-2.5 rounded-lg transition-all mx-auto shadow-sm flex items-center justify-center ${canRemove ? 'bg-[#FFFFFF] border border-red-200 text-[#EF4444] hover:bg-[#EF4444]/100 hover:text-white' : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'}`}
                        >
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      );
                    })()}
                  </td>
                </tr>
              ))}
              {displayList.length === 0 && <tr><td colSpan="5" className="p-10 text-center text-slate-400 font-medium">Bạn chưa chọn môn học nào.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-[#FFFFFF] p-6 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800 text-lg mb-5 border-b border-slate-100 pb-4 flex items-center gap-2"><BookPlus className="w-5 h-5 text-[#3B82F6]" /> Danh sách lớp học phần đang mở</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold rounded-tl-xl">Mã LHP</th><th className="p-4 font-bold w-1/3">Môn học</th><th className="p-4 font-bold">Lịch học chi tiết</th><th className="p-4 text-center font-bold">Tín chỉ</th><th className="p-4 font-bold">Giảng viên</th><th className="p-4 text-center font-bold">Sĩ số</th><th className="p-4 text-center font-bold rounded-tr-xl">Đăng ký</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {availableCourses.map((c, i) => {
                const isFull = c.DaDangKy >= (c.SoLuongToiDa || 40);
                const isInCart = cart.some(cartItem => cartItem.MaLopHocPhan === c.MaLopHocPhan);
                // Lớp học phần bắt buộc phải được xếp lịch (có NgayBatDau) trước khi cho SV đăng ký.
                const noSchedule = !c.NgayBatDau;
                
                let tietStr = "Chưa rõ";
                if (c.CaHoc) {
                  const match = String(c.CaHoc).match(/(\d+)\s*-\s*(\d+)/);
                  if (match) { tietStr = `Tiết ${match[1]}-${match[2]}`; } 
                  else {
                    const caStr = String(c.CaHoc).replace(/\D/g, ''); 
                    if (caStr === '1') tietStr = 'Tiết 1-3'; else if (caStr === '2') tietStr = 'Tiết 4-6'; else if (caStr === '3') tietStr = 'Tiết 7-9'; else if (caStr === '4') tietStr = 'Tiết 10-12';
                  }
                }
                const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '';
                return (
                  <tr key={i} className={`hover:bg-slate-50/50 transition-colors ${(isFull || isInCart || noSchedule) ? 'opacity-70 bg-slate-50' : ''}`}>
                    <td className="p-4 font-bold text-slate-700 bg-slate-50/30">{c.MaLopHocPhan}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800 text-sm mb-1.5">{c.TenMonHoc}</div>
                      {(c.DiemCu === null || c.DiemCu === undefined) ? <span className="bg-[#3B82F6]/10 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">Học mới</span> : parseFloat(c.DiemCu) < 1.0 ? <span className="bg-[#EF4444]/10 text-red-700 border border-red-200 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">Học lại (F)</span> : <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">Học cải thiện ({parseFloat(c.DiemCu).toFixed(2)})</span>}
                    </td>
                    <td className="p-4">
    {c.NgayBatDau ? (
        <div className="space-y-2 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[#3B82F6]">
                    <CalendarDays className="w-3 h-3" />
                </div>
                {formatDate(c.NgayBatDau)} → {formatDate(c.NgayKetThuc)}
            </div>
            
            <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#FFF7D6] flex items-center justify-center text-[#F4C542]">
                    <MapPin className="w-3 h-3" />
                </div>
                Phòng: {c.PhongHoc || 'Chưa cập nhật'}
            </div>

            {c.CaHoc && (
                <div className="flex items-center gap-2 text-amber-600 font-semibold">
    {c.CaHoc ? `Tiết ${c.CaHoc}` : 'Chưa rõ'} 
    {c.SoBuoi && ` • ${c.SoBuoi} buổi`}
</div>
            )}
        </div>
    ) : (
        <span className="text-slate-400 italic text-xs">Đang cập nhật lịch...</span>
    )}
</td>
                    <td className="p-4 text-center font-bold text-slate-700">{c.SoTinChi}</td>
                    <td className="p-4 font-semibold text-slate-700">{c.TenGiangVien || 'Chưa xếp'}</td>
                    <td className="p-4 text-center"><span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${isFull ? 'bg-red-100 text-[#DC2626] border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>{c.DaDangKy} / {c.SoLuongToiDa || 40}</span></td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleAddToCart(c)}
                        disabled={isFull || isInCart || noSchedule}
                        title={noSchedule ? 'Lớp học phần chưa được xếp lịch, chưa thể đăng ký' : undefined}
                        className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs mx-auto shadow-sm transition-all ${(isFull || isInCart || noSchedule) ? 'bg-slate-100 text-slate-400 cursor-not-allowed border' : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:scale-105 shadow-blue-500/30'}`}
                      >
                        {isInCart ? 'Đã Chọn' : isFull ? 'Lớp đầy' : noSchedule ? 'Chưa có lịch' : <><Plus className="w-4 h-4"/> Chọn</>}
                      </button>
                    </td>
                  </tr>
                )
              })}
              {availableCourses.length === 0 && <tr><td colSpan="7" className="p-12 text-center text-slate-400 font-medium">Hiện không có môn học nào khả dụng.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default StudentCourseRegistration;