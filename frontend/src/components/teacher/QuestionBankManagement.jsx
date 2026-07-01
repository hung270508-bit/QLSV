import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Search, X, FileText, CheckCircle2, AlertCircle, Eye, Save } from 'lucide-react';
import axios from 'axios';
import ModalPortal, { Toast, ConfirmDialog } from '../common/ModalPortal';
import API_URL from '../../api';

function QuestionBankManagement() {
    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [subjects, setSubjects] = useState([]);
    
    // Auth info (Mocking admin/teacher ID from localStorage or context if available)
    const currentUser = JSON.parse(localStorage.getItem('user')) || {};
    // Fallback to GVCNTT001 for demo if no user
    const teacherId = currentUser.role === 'admin' ? '' : (currentUser.id || 'GVCNTT001');

    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [confirmDialog, setConfirmDialog] = useState({ show: false, title: '', message: '', action: null });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false }), 3000);
    };

    // Upload Modal
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadData, setUploadData] = useState({ tieu_de: '', ma_mon_hoc: '', file: null });
    const [isUploading, setIsUploading] = useState(false);

    // Questions Modal
    const [showQuestionsModal, setShowQuestionsModal] = useState(false);
    const [currentBank, setCurrentBank] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [isApproveLoading, setIsApproveLoading] = useState(false);

    useEffect(() => {
        fetchBanks();
        fetchSubjects();
    }, []);

    const fetchBanks = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/api/ai-exams/banks/teacher/${teacherId}`);
            setBanks(res.data);
        } catch (error) {
            console.error('Error fetching banks:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubjects = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/subjects`);
            setSubjects(res.data);
        } catch (error) {
            console.error('Error fetching subjects', error);
        }
    };

    const handleFileChange = (e) => {
        setUploadData({ ...uploadData, file: e.target.files[0] });
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!uploadData.tieu_de || !uploadData.ma_mon_hoc || !uploadData.file) {
            return showToast('Vui lòng điền đủ thông tin và chọn file', 'error');
        }

        const formData = new FormData();
        formData.append('tieu_de', uploadData.tieu_de);
        formData.append('ma_mon_hoc', uploadData.ma_mon_hoc);
        formData.append('ma_giang_vien', teacherId);
        formData.append('file', uploadData.file);

        setIsUploading(true);
        try {
            await axios.post(`${API_URL}/api/ai-exams/banks/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showToast('Tạo ngân hàng câu hỏi bằng AI thành công!');
            setShowUploadModal(false);
            setUploadData({ tieu_de: '', ma_mon_hoc: '', file: null });
            fetchBanks();
        } catch (error) {
            showToast(error.response?.data?.message || 'Lỗi xử lý file', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const openBankDetail = async (bank) => {
        setCurrentBank(bank);
        setShowQuestionsModal(true);
        try {
            const res = await axios.get(`${API_URL}/api/ai-exams/banks/${bank.id}/questions`);
            setQuestions(res.data.data);
        } catch (error) {
            showToast('Lỗi lấy câu hỏi', 'error');
        }
    };

    const handleApproveBank = async () => {
        setConfirmDialog({
            show: true,
            title: 'Duyệt Ngân hàng câu hỏi',
            message: 'Sau khi duyệt, các câu hỏi này sẽ được phép sử dụng trong thi và luyện tập. Bạn có chắc chắn?',
            action: async () => {
                setConfirmDialog({ show: false, action: null });
                setIsApproveLoading(true);
                try {
                    await axios.put(`${API_URL}/api/ai-exams/banks/${currentBank.id}/approve`);
                    showToast('Đã duyệt thành công!');
                    setShowQuestionsModal(false);
                    fetchBanks();
                } catch (error) {
                    showToast('Lỗi duyệt ngân hàng', 'error');
                } finally {
                    setIsApproveLoading(false);
                }
            }
        });
    };

    return (
        <div className="space-y-8 p-4 max-w-screen-3xl mx-auto w-full">
            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
            
            <div className="bg-[#152238] rounded-2xl p-8 shadow-xl shadow-blue-900/20 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                            <FileText className="w-8 h-8 text-blue-400" />
                            Quản lý Ngân hàng Câu hỏi AI
                        </h2>
                        <p className="text-gray-300 text-lg">Tạo bộ câu hỏi trắc nghiệm tự động từ file Word</p>
                    </div>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Upload & Tạo bằng AI
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left py-4 px-6 font-bold text-gray-700">Tiêu đề</th>
                                <th className="text-left py-4 px-6 font-bold text-gray-700">Môn học</th>
                                <th className="text-center py-4 px-6 font-bold text-gray-700">Số câu</th>
                                <th className="text-center py-4 px-6 font-bold text-gray-700">Trạng thái</th>
                                <th className="text-center py-4 px-6 font-bold text-gray-700">Ngày tạo</th>
                                <th className="text-center py-4 px-6 font-bold text-gray-700">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {banks.map(bank => (
                                <tr key={bank.id} className="hover:bg-gray-50">
                                    <td className="py-4 px-6 font-semibold text-gray-800">{bank.tieu_de}</td>
                                    <td className="py-4 px-6 text-gray-600">{bank.TenMonHoc}</td>
                                    <td className="py-4 px-6 text-center text-blue-600 font-bold">{bank.tong_so_cau}</td>
                                    <td className="py-4 px-6 text-center">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${bank.trang_thai === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {bank.trang_thai}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-center text-sm text-gray-500">
                                        {new Date(bank.created_at).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <button onClick={() => openBankDetail(bank)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                                            <Eye className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {banks.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="6" className="py-10 text-center text-gray-500">Chưa có ngân hàng câu hỏi nào.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Upload */}
            {showUploadModal && (
                <ModalPortal>
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                        <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                            <h3 className="text-xl font-bold mb-4">Tạo Ngân hàng Câu hỏi</h3>
                            <form onSubmit={handleUploadSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Tiêu đề</label>
                                    <input type="text" required value={uploadData.tieu_de} onChange={e => setUploadData({...uploadData, tieu_de: e.target.value})} className="w-full p-3 border rounded-xl" placeholder="Ví dụ: Đề cương Giữa kỳ" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Môn học</label>
                                    <select required value={uploadData.ma_mon_hoc} onChange={e => setUploadData({...uploadData, ma_mon_hoc: e.target.value})} className="w-full p-3 border rounded-xl">
                                        <option value="">-- Chọn môn học --</option>
                                        {subjects.map(s => <option key={s.MaMonHoc} value={s.MaMonHoc}>{s.TenMonHoc}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">File tài liệu (.docx)</label>
                                    <input type="file" accept=".docx" required onChange={handleFileChange} className="w-full p-3 border rounded-xl" />
                                    <p className="text-xs text-gray-500 mt-1">Lưu ý: File word không chứa hình ảnh phức tạp, ưu tiên định dạng text.</p>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setShowUploadModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold">Hủy</button>
                                    <button type="submit" disabled={isUploading} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-70 flex justify-center items-center gap-2">
                                        {isUploading ? <><span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> Đang xử lý AI...</> : 'Bắt đầu AI Parsing'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* Modal View/Edit Questions */}
            {showQuestionsModal && currentBank && (
                <ModalPortal>
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                        <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl">
                            <div className="p-5 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                                <div>
                                    <h3 className="text-xl font-bold">{currentBank.tieu_de}</h3>
                                    <p className="text-sm text-gray-500">Môn: {currentBank.TenMonHoc} | Trạng thái: <span className={currentBank.trang_thai === 'Approved' ? 'text-green-600' : 'text-amber-600'}>{currentBank.trang_thai}</span></p>
                                </div>
                                <div className="flex gap-3">
                                    {currentBank.trang_thai !== 'Approved' && (
                                        <button onClick={handleApproveBank} disabled={isApproveLoading} className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-sm transition flex items-center gap-2">
                                            <CheckCircle2 className="w-5 h-5" />
                                            Duyệt bộ đề
                                        </button>
                                    )}
                                    <button onClick={() => setShowQuestionsModal(false)} className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300"><X className="w-5 h-5"/></button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-100">
                                {questions.map((q, index) => (
                                    <div key={q.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex gap-3 items-center">
                                                <span className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-lg text-sm">Câu {index + 1}</span>
                                                <span className={`text-xs font-bold px-2 py-1 rounded ${q.do_kho==='Easy'?'bg-green-100 text-green-700':q.do_kho==='Medium'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}`}>{q.do_kho}</span>
                                                <span className="text-sm text-gray-500">[{q.chu_de}]</span>
                                            </div>
                                        </div>
                                        <p className="font-semibold text-lg mb-4 text-gray-800">{q.noi_dung}</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                            {q.options?.map((opt, oIdx) => (
                                                <div key={opt.id} className={`p-3 rounded-lg border-2 ${opt.la_dap_an_dung ? 'border-green-500 bg-green-50 text-green-900 font-medium' : 'border-gray-200 text-gray-600'}`}>
                                                    {String.fromCharCode(65 + oIdx)}. {opt.noi_dung}
                                                </div>
                                            ))}
                                        </div>
                                        {q.giai_thich && (
                                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                                <p className="text-sm text-blue-800"><span className="font-bold">Giải thích:</span> {q.giai_thich}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}

            <ConfirmDialog show={confirmDialog.show} title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.action} onCancel={() => setConfirmDialog({ show: false })} />
        </div>
    );
}

export default QuestionBankManagement;
