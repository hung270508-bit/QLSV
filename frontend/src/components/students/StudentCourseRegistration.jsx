import { useState, useEffect } from 'react';
// Thêm MapPin, CalendarDays vào danh sách import
import { BookPlus, Plus, Trash2, Loader2, Clock, CheckCircle2, XCircle, MapPin, CalendarDays } from 'lucide-react';
import axios from 'axios';

function StudentCourseRegistration({ user }) {
  const [availableCourses, setAvailableCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [availRes, myRes] = await Promise.all([
        axios.get(`/api/enrollment/available/${user.username}`),
        // ĐÃ ĐỔI SANG GỌI API BẢNG ĐĂNG KÝ CHUẨN
        axios.get(`/api/enrollment/my-courses/${user.username}`) 
      ]);
      setAvailableCourses(availRes.data);
      setMyCourses(myRes.data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleEnroll = async (course) => {
    if(course.DaDangKy >= (course.SoLuongToiDa || 40)) return alert("Lớp này đã đầy!");
    if(!window.confirm(`Xác nhận gửi yêu cầu đăng ký môn ${course.TenMonHoc}?`)) return;
    try {
      await axios.post('/api/enrollment', { MSSV: user.username, MaLopHocPhan: course.MaLopHocPhan, HocKy: course.HocKy });
      alert("Đã gửi yêu cầu đăng ký! Vui lòng chờ duyệt.");
      fetchData();
    } catch (error) { alert("Lỗi khi đăng ký môn!"); }
  };

  const handleCancel = async (maLHP, trangThai) => {
    if (trangThai !== 'Chờ duyệt') {
      return alert('Chỉ có thể hủy môn khi trạng thái là "Chờ duyệt". Môn đã duyệt vui lòng liên hệ Phòng Đào tạo!');
    }
    if(!window.confirm(`Xác nhận HỦY đăng ký lớp ${maLHP}?`)) return;
    try {
      await axios.delete(`/api/enrollment/${user.username}/${maLHP}`);
      alert("Hủy môn thành công!");
      fetchData();
    } catch (error) { alert("Lỗi khi hủy môn!"); }
  };

  const renderStatus = (status) => {
    if (status === 'Đã duyệt') return <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Đã duyệt</span>;
    if (status === 'Từ chối') return <span className="text-red-500 font-bold flex items-center gap-1"><XCircle className="w-4 h-4"/> Từ chối</span>;
    return <span className="text-orange-500 font-bold flex items-center gap-1"><Clock className="w-4 h-4"/> Chờ duyệt</span>;
  };

  if (loading) return <div className="flex justify-center p-10 text-orange-500"><Loader2 className="w-10 h-10 animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-md flex items-center gap-4">
        <BookPlus className="w-10 h-10" />
        <div><h2 className="text-2xl font-bold">Đăng ký môn học trực tuyến</h2><p className="text-blue-100">Kỳ 2 - Năm học 2025-2026</p></div>
      </div>

      {/* Danh sách ĐÃ ĐĂNG KÝ */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2"><Clock className="w-5 h-5 text-orange-500" /> Tiến trình đăng ký ({myCourses.length} môn)</h3>
        <table className="w-full text-left text-sm">
          <thead className="bg-orange-50 text-gray-600">
            <tr><th className="p-3">Mã LHP</th><th className="p-3">Tên môn học</th><th className="p-3 text-center">Tín chỉ</th><th className="p-3">Trạng thái</th><th className="p-3 text-center">Hủy Đăng Ký</th></tr>
          </thead>
          <tbody>
            {myCourses.map((c, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="p-3 font-bold text-blue-600">{c.MaLopHocPhan}</td>
                <td className="p-3 font-semibold">{c.TenMonHoc}</td>
                <td className="p-3 text-center">{c.SoTinChi}</td>
                <td className="p-3">{renderStatus(c.TrangThai)}</td>
                <td className="p-3 text-center">
                  <button 
                    onClick={() => handleCancel(c.MaLopHocPhan, c.TrangThai)} 
                    disabled={c.TrangThai !== 'Chờ duyệt'}
                    className={`p-1.5 rounded transition flex items-center justify-center mx-auto ${c.TrangThai === 'Chờ duyệt' ? 'text-red-500 hover:bg-red-50 cursor-pointer' : 'text-gray-300 cursor-not-allowed'}`}
                  >
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </td>
              </tr>
            ))}
            {myCourses.length === 0 && <tr><td colSpan="5" className="p-6 text-center text-gray-400">Bạn chưa đăng ký môn nào</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Danh sách LỚP ĐANG MỞ */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Danh sách lớp học phần đang mở</h3>
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-3">Mã LHP</th>
              <th className="p-3 w-1/3">Môn học</th>
              <th className="p-3">Lịch học chi tiết</th>
              <th className="p-3 text-center">Tín chỉ</th>
              <th className="p-3">Giảng viên</th>
              <th className="p-3 text-center">Sĩ số</th>
              <th className="p-3 text-center">Đăng ký</th>
            </tr>
          </thead>
          <tbody>
            {availableCourses.map((c, i) => {
              const isFull = c.DaDangKy >= (c.SoLuongToiDa || 40);
              
              // Xử lý hiển thị Ca học -> Tiết học
              let tietStr = "Chưa rõ";
              if (c.CaHoc) {
                const caStr = String(c.CaHoc).replace(/\D/g, ''); 
                if (caStr === '1') tietStr = 'Tiết 1-3';
                else if (caStr === '2') tietStr = 'Tiết 4-6';
                else if (caStr === '3') tietStr = 'Tiết 7-9';
                else if (caStr === '4') tietStr = 'Tiết 10-12';
              }

              // Xử lý hiển thị Ngày
              const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '';

              return (
                <tr key={i} className={`border-b hover:bg-gray-50 ${isFull ? 'opacity-60 bg-gray-50' : ''}`}>
                  <td className="p-3 font-bold text-gray-700">{c.MaLopHocPhan}</td>
                  
                  {/* Cột Môn học + Huy hiệu Học mới/Học lại */}
                  <td className="p-3">
                    <div className="font-bold text-gray-800 text-base">{c.TenMonHoc}</div>
                    {(c.DiemCu === null || c.DiemCu === undefined) ? (
                      <span className="inline-block mt-1 bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider">Học mới</span>
                    ) : parseFloat(c.DiemCu) < 1.0 ? (
                      <span className="inline-block mt-1 bg-red-100 text-red-700 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider">Học lại (Điểm cũ: F)</span>
                    ) : (
                      <span className="inline-block mt-1 bg-white-100 text-red-700 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider">Học cải thiện (Điểm Cũ: {parseFloat(c.DiemCu).toFixed(2)})</span>
                    )}
                  </td>

                  {/* Cột Lịch học Chi tiết */}
                  <td className="p-3">
                    {c.NgayBatDau ? (
                      <div className="space-y-1.5 text-xs text-gray-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5 text-blue-500" />
                          {formatDate(c.NgayBatDau)} <span className="text-gray-400">→</span> {formatDate(c.NgayKetThuc)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-orange-500" />
                          Phòng: {c.PhongHoc} | {tietStr}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Chưa có lịch</span>
                    )}
                  </td>

                  <td className="p-3 text-center font-bold text-gray-700">{c.SoTinChi}</td>
                  <td className="p-3 font-medium text-gray-700">{c.TenGiangVien || 'Chưa xếp'}</td>
                  
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${isFull ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                      {c.DaDangKy} / {c.SoLuongToiDa || 40}
                    </span>
                  </td>
                  
                  <td className="p-3 text-center">
                    <button 
                      onClick={() => handleEnroll(c)} 
                      disabled={isFull}
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg font-bold text-xs mx-auto shadow-sm ${isFull ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 transition'}`}
                    >
                      {isFull ? 'Đã đầy' : <><Plus className="w-4 h-4"/> Đăng ký</>}
                    </button>
                  </td>
                </tr>
              )
            })}
            {availableCourses.length === 0 && <tr><td colSpan="7" className="p-8 text-center text-gray-400">Không có lớp học phần nào khả dụng cho bạn lúc này.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default StudentCourseRegistration;