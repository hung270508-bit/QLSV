import React, { useState, useEffect } from 'react';
import { Award, PlusCircle, CheckCircle2, Clock, Loader2, X, FileSignature, Edit, Lock, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const EVALUATION_CRITERIA = [
  {
    id: 'sec1',
    title: '1. Đánh giá về ý thức tham gia học tập (Tối đa 20đ)',
    items: [
      {
        id: '1.1', label: '1.1. Kết quả học tập có điểm trung bình học kỳ',
        options: [
          { label: 'Từ 3.5 đến 4.0 / Xuất sắc (+10đ)', point: 10 },
          { label: 'Từ 3.2 đến dưới 3.5 / Giỏi (+9đ)', point: 9 },
          { label: 'Từ 2.5 đến dưới 3.2 / Khá (+8đ)', point: 8 },
          { label: 'Từ 2.0 đến dưới 2.5 / Trung bình (+7đ)', point: 7 },
          { label: 'Dưới 2.0 / Không đạt (+0đ)', point: 0 }
        ]
      },
      {
        id: '1.2', label: '1.2. Ý thức đi học chuyên cần, đúng giờ',
        options: [
          { label: 'Đi học đầy đủ và không đi trễ (+6đ)', point: 6 },
          { label: 'Đi học đầy đủ và có đi trễ (+4đ)', point: 4 },
          { label: 'Nghỉ học nhiều, không đầy đủ (+0đ)', point: 0 }
        ]
      },
      {
        id: '1.3', label: '1.3. Thái độ học tập tích cực, đóng góp xây dựng bài',
        options: [
          { label: 'Tích cực tương tác, giúp đỡ bạn bè (+4đ)', point: 4 },
          { label: 'Bình thường, ít tương tác (+2đ)', point: 2 }
        ]
      }
    ]
  },
  {
    id: 'sec2',
    title: '2. Đánh giá ý thức chấp hành nội quy, quy chế (Tối đa 25đ)',
    items: [
      {
        id: '2.1', label: '2.1. Thực hiện tốt nội quy nhà trường',
        options: [
          { label: 'Không vi phạm quy chế (+15đ)', point: 15 },
          { label: 'Có vi phạm nhẹ bị nhắc nhở (+5đ)', point: 5 },
          { label: 'Bị kỷ luật cấp khoa/trường (+0đ)', point: 0 }
        ]
      },
      {
        id: '2.2', label: '2.2. Tham gia các buổi sinh hoạt lớp/khoa',
        options: [
          { label: 'Tham gia đầy đủ 100% (+10đ)', point: 10 },
          { label: 'Vắng 1-2 buổi có phép (+5đ)', point: 5 },
          { label: 'Không tham gia (+0đ)', point: 0 }
        ]
      }
    ]
  },
  {
    id: 'sec3',
    title: '3. Tham gia hoạt động chính trị, xã hội, văn thể mỹ (Tối đa 55đ)',
    items: [
      {
        id: '3.1', label: '3.1. Tham gia các hoạt động do Trường/Khoa tổ chức',
        options: [
          { label: 'Tham gia trên 5 hoạt động (+30đ)', point: 30 },
          { label: 'Tham gia từ 2 - 4 hoạt động (+20đ)', point: 20 },
          { label: 'Không tham gia (+0đ)', point: 0 }
        ]
      },
      {
        id: '3.2', label: '3.2. Chấp hành tốt đường lối của Đảng, pháp luật của Nhà nước',
        options: [
          { label: 'Chấp hành tốt, công dân gương mẫu (+25đ)', point: 25 },
          { label: 'Có vi phạm hành chính/pháp luật (+0đ)', point: 0 }
        ]
      }
    ]
  }
];

function StudentTrainingPoints({ user }) {
  const [points, setPoints] = useState([]);
  const [activePeriods, setActivePeriods] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [editingRecord, setEditingRecord] = useState(null); 
  const [formScores, setFormScores] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, title: '', message: '', action: null });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pointsRes, periodsRes] = await Promise.all([
        axios.get(`${API_URL}/api/training-points/student/${user?.username}`),
        axios.get('${API_URL}/api/training-periods/active')
      ]);
      setPoints(pointsRes.data);
      setActivePeriods(periodsRes.data);
    } catch (error) {
      showToast('Lỗi khi tải dữ liệu!', 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { if(user?.username) fetchData(); }, [user]);

  const currentTotalScore = Object.values(formScores).reduce((sum, val) => sum + val, 0);

  const handleSelectOption = (itemId, point) => {
    setFormScores(prev => ({ ...prev, [itemId]: point }));
  };

  const handleOpenNew = (hocKy) => {
    setSelectedSemester(hocKy);
    setEditingRecord(null);
    setFormScores({});
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setSelectedSemester(record.HocKy);
    setFormScores({}); // Note: CSDL chỉ lưu tổng điểm nên Form sẽ reset để SV tích lại
    setIsModalOpen(true);
  };

  const handlePreSubmit = () => {
    const totalItems = EVALUATION_CRITERIA.reduce((sum, sec) => sum + sec.items.length, 0);
    if (Object.keys(formScores).length < totalItems) {
      return showToast("Vui lòng đánh giá đầy đủ tất cả các tiêu chí!", "error");
    }
    setConfirmDialog({
      show: true,
      title: editingRecord ? 'Cập nhật phiếu' : 'Xác nhận nộp phiếu',
      message: `Xác nhận gửi kết quả đánh giá với tổng điểm là ${currentTotalScore}đ?`,
      action: async () => {
        try {
          if (editingRecord) {
            await axios.put(`${API_URL}/api/training-points/${editingRecord.MaDanhGia}`, { DiemTuDanhGia: currentTotalScore });
            showToast("Cập nhật thành công!", "success");
          } else {
            await axios.post('${API_URL}/api/training-points', { MSSV: user.username, HocKy: selectedSemester, DiemTuDanhGia: currentTotalScore });
            showToast("Nộp phiếu thành công!", "success");
          }
          setIsModalOpen(false); 
          setConfirmDialog({ show: false });
          fetchData(); 
        } catch (error) { 
          showToast("Lỗi hệ thống hoặc hết hạn!", "error");
          setConfirmDialog({ show: false });
        }
      }
    });
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-10 h-10 animate-spin text-orange-500" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative pb-10">
      {/* TOAST & DIALOG */}
      <AnimatePresence>
        {toast.show && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`fixed top-8 right-8 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border-l-4 ${toast.type === 'success' ? 'bg-white border-green-500' : 'bg-white border-red-500'}`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-6 h-6 text-green-600" /> : <AlertCircle className="w-6 h-6 text-red-600" />}
            <div><p className="font-bold text-sm text-slate-800">{toast.type === 'success' ? 'Thành công' : 'Thất bại'}</p><p className="text-slate-600 text-sm">{toast.message}</p></div>
            <button onClick={() => setToast({ show: false })} className="ml-4 text-slate-400"><X className="w-5 h-5" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDialog.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><HelpCircle className="w-8 h-8" /></div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{confirmDialog.title}</h3>
              <p className="text-slate-500 text-sm mb-6">{confirmDialog.message}</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDialog({ show: false })} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl">Hủy</button>
                <button onClick={confirmDialog.action} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl">Xác nhận</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-8 text-white shadow-xl flex items-center gap-5 relative overflow-hidden">
        <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl"><Award className="w-10 h-10" /></div>
        <div><h2 className="text-3xl font-black mb-1">Đánh giá rèn luyện</h2><p className="text-orange-100 font-medium">Khai báo tự đánh giá và theo dõi điểm rèn luyện</p></div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-fit">
          <h3 className="font-bold text-slate-800 text-lg mb-5 flex items-center gap-2"><FileSignature className="w-5 h-5 text-orange-500" /> Đợt đánh giá</h3>
          <div className="space-y-4">
            {activePeriods.map((period) => {
              const hasSubmitted = points.some(p => p.HocKy === period.HocKy);
              return (
                <div key={period.MaDotDanhGia} className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="font-bold text-slate-800 text-base">{period.HocKy.replace('HK', 'Học kỳ ').replace(/_/g, ' ')}</p>
                  <p className="text-xs text-slate-500 mt-1">Năm học: {period.NamHoc}</p>
                  {hasSubmitted ? <div className="mt-4 text-xs font-bold text-emerald-600 bg-emerald-50 p-3 rounded-xl flex items-center justify-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Đã nộp phiếu</div> : 
                  <button onClick={() => handleOpenNew(period.HocKy)} className="w-full mt-4 bg-orange-600 text-white font-bold py-3 rounded-xl text-sm shadow-md shadow-orange-200">Khai báo ngay</button>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="xl:col-span-3 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50"><h3 className="font-bold text-slate-800 text-lg">Lịch sử rèn luyện</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-5 font-bold">Học kỳ</th><th className="p-5 font-bold text-center">SV ĐG</th><th className="p-5 font-bold text-center">Khoa ĐG</th><th className="p-5 font-bold text-center">Điểm chốt</th><th className="p-5 font-bold">Trạng thái</th><th className="p-5 font-bold text-center">Tác vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {points.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-5 font-bold text-slate-700">{p.HocKy.replace('HK', 'Học kỳ ').replace(/_/g, ' ')}</td>
                    <td className="p-5 text-center font-bold text-blue-600"><span className="bg-blue-50 px-3 py-1 rounded-md">{p.DiemTuDanhGia}</span></td>
                    <td className="p-5 text-center text-slate-500 font-semibold">{p.DiemKhoaDanhGia || '0'}</td>
                    <td className="p-5 text-center font-black text-orange-600 text-lg">{p.TongDiem || p.DiemTuDanhGia}</td>
                    <td className="p-5 whitespace-nowrap">{p.TrangThai === 'Đã xác nhận' ? <span className="text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 w-fit font-bold text-xs"><CheckCircle2 className="w-3.5 h-3.5"/> Đã xác nhận</span> : <span className="text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 w-fit font-bold text-xs"><Clock className="w-3.5 h-3.5"/> Chờ duyệt</span>}</td>
                    <td className="p-5 text-center">{p.TrangThai !== 'Đã xác nhận' ? <button onClick={() => handleEdit(p)} className="p-2 bg-white border border-blue-200 text-blue-600 rounded-lg shadow-sm"><Edit className="w-4 h-4" /></button> : <Lock className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL CHI TIẾT */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-5xl h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
              <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center"><FileSignature className="w-6 h-6" /></div>
                  <div><h2 className="text-2xl font-black text-slate-800 mb-1">{editingRecord ? 'Cập nhật Phiếu Đánh Giá' : 'Khai báo Phiếu Đánh Giá'}</h2><p className="text-sm font-medium text-slate-500">{user?.hoTen} - {user?.username}</p></div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full"><X className="w-6 h-6 text-slate-400" /></button>
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 custom-scrollbar">
                {EVALUATION_CRITERIA.map((section) => (
                  <div key={section.id} className="border border-slate-200 rounded-3xl overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200"><h3 className="font-black text-slate-800 text-base">{section.title}</h3></div>
                    <div className="divide-y divide-slate-100">
                      {section.items.map((item) => (
                        <div key={item.id} className="p-6 flex flex-col md:flex-row gap-6">
                          <div className="flex-1">
                            <p className="font-bold text-slate-700 mb-4 text-sm">{item.label}</p>
                            <div className="space-y-3">
                              {item.options.map((opt, idx) => {
                                const isSelected = formScores[item.id] === opt.point;
                                return (
                                  <div key={idx} 
                                       onClick={() => handleSelectOption(item.id, opt.point)}
                                       className={`flex items-center gap-4 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:bg-slate-50'}`}>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-blue-500' : 'border-slate-300'}`}>{isSelected && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}</div>
                                    <span className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>{opt.label}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <div className="md:w-32 flex items-center justify-center bg-slate-50 rounded-2xl p-4 border border-slate-100 shrink-0"><span className={`text-3xl font-black ${formScores[item.id] !== undefined ? 'text-blue-600' : 'text-slate-200'}`}>{formScores[item.id] !== undefined ? `+${formScores[item.id]}` : '-'}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 border-t border-slate-200 px-8 py-5 flex justify-between items-center shrink-0">
                <div className="flex flex-col"><span className="text-slate-500 font-bold text-xs uppercase">Điểm tự đánh giá</span><div className="text-4xl font-black text-blue-600">{currentTotalScore} <span className="text-xl text-slate-400">/ 100</span></div></div>
                <div className="flex gap-3"><button onClick={() => setIsModalOpen(false)} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl">Hủy</button><button onClick={handlePreSubmit} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all">Gửi phiếu ngay</button></div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}} />
    </div>
  );
}

export default StudentTrainingPoints;