import React, { useState, useEffect } from 'react';
import API_URL from '../../api';
import { Award, PlusCircle, CheckCircle2, Clock, Loader2, X, FileSignature, Edit, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// --- MOCK DATA: BAREME ĐIỂM CHUẨN CỦA NHÀ TRƯỜNG ---
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
  const [loading, setLoading] = useState(true);
  
  // States quản lý Modal và Chế độ Sửa/Thêm mới
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState('HK2_2025_2026');
  const [editingRecord, setEditingRecord] = useState(null); // Lưu trữ ID bản ghi đang sửa
  const [formScores, setFormScores] = useState({});

  const fetchPoints = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/training-points/student/${user?.username}`);
      setPoints(res.data);
    } catch (error) {
      console.error(error);
    } finally { setLoading(false); }
  };

  useEffect(() => { 
    if(user?.username) fetchPoints(); 
  }, [user]);

  const currentTotalScore = Object.values(formScores).reduce((sum, val) => sum + val, 0);

  const handleSelectOption = (itemId, point) => {
    setFormScores(prev => ({ ...prev, [itemId]: point }));
  };

  // Mở Form Đánh giá mới
  const handleOpenNew = () => {
    setEditingRecord(null);
    setFormScores({});
    setIsModalOpen(true);
  };

  // Mở Form để Sửa (Edit)
  const handleEdit = (record) => {
    setEditingRecord(record);
    setSelectedSemester(record.HocKy);
    setFormScores({}); // Reset tick vì DB không lưu chi tiết tick, bắt SV tick lại
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    const totalItems = EVALUATION_CRITERIA.reduce((sum, sec) => sum + sec.items.length, 0);
    if (Object.keys(formScores).length < totalItems) {
      return alert("Vui lòng đánh giá đầy đủ tất cả các tiêu chí trước khi nộp!");
    }

    if (!window.confirm(`Xác nhận ${editingRecord ? 'cập nhật' : 'nộp'} phiếu đánh giá với tổng điểm: ${currentTotalScore}đ?`)) return;

    try {
      if (editingRecord) {
        // GỌI API PUT ĐỂ SỬA
        await axios.put(`${API_URL}/api/training-points/${editingRecord.MaDanhGia}`, { 
          DiemTuDanhGia: currentTotalScore 
        });
        alert("Cập nhật điểm đánh giá thành công!");
      } else {
        // GỌI API POST ĐỂ THÊM MỚI
        await axios.post(`${API_URL}/api/training-points`, { 
          MSSV: user.username, 
          HocKy: selectedSemester,
          DiemTuDanhGia: currentTotalScore 
        });
        alert("Nộp phiếu đánh giá thành công!");
      }
      
      setIsModalOpen(false); 
      setFormScores({}); 
      fetchPoints(); 
    } catch (error) { 
      alert("Lỗi hệ thống. Có thể bạn đã nộp cho học kỳ này rồi!"); 
    }
  };

  if (loading) return <div className="flex justify-center p-16 text-orange-500"><Loader2 className="w-12 h-12 animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative">
      
      {/* HEADER */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
          <Award className="w-12 h-12" />
          <div>
            <h2 className="text-3xl font-bold mb-1">Đánh giá rèn luyện</h2>
            <p className="text-orange-100 text-lg">Khai báo và theo dõi điểm rèn luyện các học kỳ</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* CỘT TRÁI (1 phần) */}
        <div className="xl:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
            <FileSignature className="w-5 h-5 text-blue-500" /> Làm phiếu đánh giá
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Chọn học kỳ cần đánh giá</label>
              <select 
                value={selectedSemester} 
                onChange={e => setSelectedSemester(e.target.value)} 
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 font-medium text-gray-700"
              >
                <option value="HK2_2025_2026">Học kỳ 2 - Năm học 2025-2026</option>
                <option value="HK1_2025_2026">Học kỳ 1 - Năm học 2025-2026</option>
              </select>
            </div>
            
            <button 
              onClick={handleOpenNew}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-5 h-5" />
              Mở phiếu đánh giá mới
            </button>
            <p className="text-xs text-gray-500 text-center italic mt-2">
              * Sinh viên tự đánh giá dựa trên bareme quy định của Nhà trường.
            </p>
          </div>
        </div>

        {/* CỘT PHẢI (3 phần) - BẢNG ĐÃ FIX GIAO DIỆN */}
        <div className="xl:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-bold text-gray-800 text-lg">Lịch sử rèn luyện</h3>
          </div>
          
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-100 text-gray-600 text-sm">
                  <th className="p-4 font-semibold rounded-l-xl w-1/4">Học kỳ</th>
                  <th className="p-4 font-semibold text-center whitespace-nowrap">Tự ĐG</th>
                  <th className="p-4 font-semibold text-center whitespace-nowrap">Lớp ĐG</th>
                  <th className="p-4 font-semibold text-center whitespace-nowrap">Tổng điểm</th>
                  <th className="p-4 font-semibold text-center w-1/6">Xếp loại</th>
                  <th className="p-4 font-semibold w-1/5">Trạng thái</th>
                  <th className="p-4 font-semibold text-center rounded-r-xl">Tác vụ</th>
                </tr>
              </thead>
              <tbody>
                {points.map((p, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-orange-50/50 text-sm transition-colors group">
                    <td className="p-4 font-bold text-gray-800">{p.HocKy.replace('HK', 'Học kỳ ').replace(/_/g, ' ')}</td>
                    <td className="p-4 text-center font-bold text-blue-600 bg-blue-50/30">{p.DiemTuDanhGia}</td>
                    <td className="p-4 text-center text-gray-500 font-medium">{p.DiemLopDanhGia || '-'}</td>
                    <td className="p-4 text-center font-bold text-orange-600 text-base bg-orange-50/30">{p.TongDiem || p.DiemTuDanhGia}</td>
                    <td className="p-4 text-center font-bold text-gray-700">{p.XepLoai}</td>
                    <td className="p-4 whitespace-nowrap">
                      {p.TrangThai === 'Chờ lớp duyệt' ? (
                         <span className="text-orange-500 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 w-fit font-bold text-xs"><Clock className="w-3.5 h-3.5"/> Chờ duyệt</span>
                      ) : (
                         <span className="text-green-600 bg-green-50 border border-green-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 w-fit font-bold text-xs"><CheckCircle2 className="w-3.5 h-3.5"/> Đã xác nhận</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {p.TrangThai === 'Chờ lớp duyệt' ? (
                        <button 
                          onClick={() => handleEdit(p)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white font-bold text-xs transition-colors mx-auto"
                        >
                          <Edit className="w-3.5 h-3.5" /> Sửa
                        </button>
                      ) : (
                        <span className="flex items-center justify-center gap-1 text-gray-400 text-xs font-medium cursor-not-allowed">
                          <Lock className="w-3.5 h-3.5" /> Đã khóa
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {points.length === 0 && <tr><td colSpan="7" className="text-center p-8 text-gray-400 italic">Bạn chưa nộp phiếu đánh giá nào.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL PHIẾU ĐÁNH GIÁ (Giữ nguyên không đổi, chỉ đổi title nếu đang Edit) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gray-50 p-6 border-b border-gray-200 flex justify-between items-start shrink-0">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    {editingRecord ? 'CHỈNH SỬA KẾT QUẢ RÈN LUYỆN' : 'PHIẾU ĐÁNH GIÁ KẾT QUẢ RÈN LUYỆN'}
                  </h2>
                  <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm text-gray-600 font-medium">
                    <p>Họ và tên: <span className="font-bold text-gray-800">{user?.hoTen}</span></p>
                    <p>Mã sinh viên: <span className="font-bold text-gray-800">{user?.username}</span></p>
                    <p>Học kỳ: <span className="font-bold text-blue-600">{selectedSemester.replace('HK', 'HK ').replace(/_/g, ' ')}</span></p>
                    <p>Khoa: <span className="font-bold text-gray-800">{user?.tenKhoa || 'Công nghệ Thông tin'}</span></p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-200 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors text-gray-500">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
                {editingRecord && (
                   <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm font-medium flex items-center gap-2">
                      <Edit className="w-4 h-4"/> 
                      Bạn đang chỉnh sửa phiếu đánh giá. Vui lòng tick lại các lựa chọn để hệ thống tính lại điểm.
                   </div>
                )}
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-blue-50 text-blue-900">
                      <th className="border border-blue-100 p-3 text-left w-3/4">Nội dung đánh giá</th>
                      <th className="border border-blue-100 p-3 text-center w-1/4">SV tự đánh giá</th>
                    </tr>
                  </thead>
                  <tbody>
                    {EVALUATION_CRITERIA.map((section) => (
                      <React.Fragment key={section.id}>
                        <tr className="bg-gray-100">
                          <td colSpan="2" className="border border-gray-200 p-3 font-bold text-gray-800 text-base">{section.title}</td>
                        </tr>
                        {section.items.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                            <td className="border border-gray-200 p-4">
                              <p className="font-semibold text-gray-700 mb-3">{item.label}</p>
                              <div className="space-y-2 pl-4">
                                {item.options.map((opt, idx) => (
                                  <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                      type="radio" 
                                      name={item.id} 
                                      value={opt.point}
                                      checked={formScores[item.id] === opt.point}
                                      onChange={() => handleSelectOption(item.id, opt.point)}
                                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
                                    />
                                    <span className="text-gray-600 group-hover:text-blue-600 transition-colors">{opt.label}</span>
                                  </label>
                                ))}
                              </div>
                            </td>
                            <td className="border border-gray-200 p-4 text-center align-middle">
                              <span className={`text-lg font-bold ${formScores[item.id] !== undefined ? 'text-blue-600' : 'text-gray-300'}`}>
                                {formScores[item.id] !== undefined ? `+${formScores[item.id]}đ` : '-'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 border-t border-gray-200 p-6 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-gray-600 font-medium">Tổng điểm tự đánh giá:</span>
                  <span className="text-3xl font-black text-orange-600">{currentTotalScore} <span className="text-lg">/ 100</span></span>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 sm:flex-none px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors">Hủy bỏ</button>
                  <button onClick={handleSubmit} className="flex-1 sm:flex-none px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 transition-colors flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> {editingRecord ? 'Cập nhật phiếu' : 'Nộp phiếu'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default StudentTrainingPoints;