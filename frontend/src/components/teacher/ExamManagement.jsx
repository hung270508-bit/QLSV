import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Calendar, BookOpen, AlertCircle, Sparkles, 
    Trash2, BarChart2, XCircle, CheckCircle, Users,
    ClipboardList, History, ChevronLeft
} from 'lucide-react';
import axios from 'axios';
import ModalPortal, { Toast, ConfirmDialog } from '../common/ModalPortal';
import API_URL from '../../api';

function ExamManagement() {
    // State Tab & Exams
    const [activeTab, setActiveTab] = useState('exams'); // 'exams' (Mở Đề Thi) hoặc 'history' (Lịch Sử Làm Bài)
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // States Dữ liệu Select
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [banks, setBanks] = useState([]);

    const currentUser = JSON.parse(localStorage.getItem('user')) || {};
    const teacherId = currentUser.role === 'admin' ? '' : (currentUser.id || 'GVCNTT001');

    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const showToast = (message, type = 'success') => { setToast({ show: true, message, type }); setTimeout(() => setToast({ show: false }), 3000); };

    // States Tạo kỳ thi - Cập nhật thêm bank_id
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [autoCount, setAutoCount] = useState(25);
    const [formData, setFormData] = useState({
        ma_lop_hoc_phan: '', ma_mon_hoc: '', bank_id: '', tieu_de: '', thoi_gian_thi_phut: 60,
        so_cau_de: 10, so_cau_tb: 10, so_cau_kho: 5,
        thoi_gian_bat_dau: '', thoi_gian_ket_thuc: ''
    });

    // States Lịch sử & Bảng điểm
    const [selectedExamForResults, setSelectedExamForResults] = useState(null);
    const [examResults, setExamResults] = useState([]);
    const [loadingResults, setLoadingResults] = useState(false);

    useEffect(() => {
        fetchExams();
        fetchOptions();
    }, []);

    const fetchExams = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/api/ai-exams/exams/teacher/${teacherId}`);
            setExams(res.data);
        } catch (error) {
            console.error('Error fetching exams:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOptions = async () => {
        try {
            const [clsRes, bankRes] = await Promise.all([
                axios.get(`${API_URL}/api/teaching-assignments`), 
                axios.get(`${API_URL}/api/ai-exams/banks/teacher/${teacherId}`)
            ]);
            
            let subRes;
            if (currentUser.role === 'admin') {
                subRes = await axios.get(`${API_URL}/api/subjects`);
            } else {
                subRes = await axios.get(`${API_URL}/api/teachers/${teacherId}/subjects`);
            }
            
            setClasses(currentUser.role === 'admin' ? clsRes.data : clsRes.data.filter(item => item.MaGiangVien === teacherId));
            setSubjects(subRes.data);
            setBanks(bankRes.data.filter(b => b.trang_thai === 'Approved'));
        } catch (error) {
            console.error('Error fetching options', error);
        }
    };

    const handleAutoDistributeAI = () => {
        const n = Math.max(1, Number(autoCount) || 10);
        const easy = Math.round(n * 0.4);
        const med = Math.round(n * 0.4);
        const hard = n - easy - med; 
        setFormData({ ...formData, so_cau_de: easy, so_cau_tb: med, so_cau_kho: hard });
        showToast(`⚡ AI đã phân chia: ${easy} Dễ, ${med} TB, ${hard} Khó (Tổng: ${n} câu)`, 'info');
    };

    const handleDeleteExam = async (exam) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa kỳ thi "${exam.tieu_de}" không? Hành động này không thể hoàn tác.`)) {
            try {
                await axios.delete(`${API_URL}/api/ai-exams/exams/${exam.id}`);
                showToast('Đã xóa kỳ thi thành công!', 'success');
                fetchExams();
                if (selectedExamForResults?.id === exam.id) {
                    setSelectedExamForResults(null);
                }
            } catch (error) {
                showToast(error.response?.data?.message || 'Lỗi khi xóa kỳ thi', 'error');
            }
        }
    };

    const handleViewResults = async (exam) => {
        setSelectedExamForResults(exam);
        setLoadingResults(true);
        try {
            const res = await axios.get(`${API_URL}/api/ai-exams/exams/${exam.id}/results`);
            if (res.data?.success) {
                setExamResults(res.data.data || []);
            } else {
                throw new Error(res.data?.message || 'Lỗi dữ liệu');
            }
        } catch (error) {
            console.error('Lỗi lấy điểm:', error);
            showToast('Lỗi khi tải bảng điểm!', 'error');
            setExamResults([]);
        } finally {
            setLoadingResults(false);
        }
    };

    const totalConfigQuestions = Number(formData.so_cau_de) + Number(formData.so_cau_tb) + Number(formData.so_cau_kho);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.ma_mon_hoc || !formData.ma_lop_hoc_phan || !formData.bank_id || !formData.tieu_de || !formData.thoi_gian_bat_dau || !formData.thoi_gian_ket_thuc) {
            return showToast('Vui lòng điền đầy đủ các thông tin (Bao gồm cả Chọn Ngân hàng đề)!', 'error');
        }

        const now = new Date();
        if (new Date(formData.thoi_gian_bat_dau) < new Date(now.getTime() - 60000)) {
            return showToast('Thời gian mở phòng thi (bắt đầu) không được chọn ở quá khứ!', 'error');
        }

        if (new Date(formData.thoi_gian_ket_thuc) <= new Date(formData.thoi_gian_bat_dau)) {
            return showToast('Thời gian kết thúc ôn thi phải sau thời gian mở phòng!', 'error');
        }

        if (Number(formData.so_cau_de) < 0 || Number(formData.so_cau_tb) < 0 || Number(formData.so_cau_kho) < 0) {
            return showToast('Cấu trúc đề thi không được nhập số lượng câu hỏi là số âm!', 'error');
        }

        if (Number(formData.thoi_gian_thi_phut) <= 0) {
            return showToast('Thời gian làm bài thi phải lớn hơn 0 phút!', 'error');
        }

        if (totalConfigQuestions <= 0) {
            return showToast('Tổng số câu hỏi của kỳ thi phải lớn hơn 0!', 'error');
        }

        const payload = {
            ...formData,
            ma_giang_vien: teacherId,
            tong_so_cau: totalConfigQuestions,
            cho_phep_thi_lai: false
        };

        try {
            await axios.post(`${API_URL}/api/ai-exams/exams`, payload);
            showToast('Tạo đợt kiểm tra mới thành công!');
            setShowCreateModal(false);
            fetchExams();
        } catch (error) {
            showToast(error.response?.data?.message || 'Lỗi tạo kỳ thi', 'error');
        }
    };

    return (
        <div className="space-y-6 p-4 max-w-screen-3xl mx-auto w-full">
            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
            
            {/* HEADER & TABS */}
            <div className="bg-gradient-to-r from-purple-800 to-indigo-900 rounded-3xl p-6 md:p-8 shadow-xl text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-purple-300" />
                        Tổ chức Thi Online (AI)
                    </h2>
                    <p className="text-purple-200 text-base">Tạo các đợt kiểm tra và quản lý cột điểm của sinh viên</p>
                </div>
                
                <div className="flex bg-black/20 p-1.5 rounded-2xl backdrop-blur-md border border-white/10 self-start md:self-auto">
                    <button
                        onClick={() => setActiveTab('exams')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                            activeTab === 'exams'
                                ? 'bg-white text-purple-950 shadow-lg font-bold'
                                : 'text-purple-100 hover:text-white hover:bg-white/10'
                        }`}
                    >
                        <ClipboardList className="w-5 h-5" />
                        <span>Mở Đề Thi</span>
                    </button>
                    <button
                        onClick={() => { setActiveTab('history'); setSelectedExamForResults(null); }}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                            activeTab === 'history'
                                ? 'bg-white text-purple-950 shadow-lg font-bold'
                                : 'text-purple-100 hover:text-white hover:bg-white/10'
                        }`}
                    >
                        <History className="w-5 h-5" />
                        <span>Lịch Sử Làm Bài</span>
                    </button>
                </div>
            </div>

            {/* TAB 1: MỞ ĐỀ THI */}
            {activeTab === 'exams' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <div className="text-gray-600 font-medium text-sm flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-purple-500" />
                            <span>Mỗi lần "Tạo kỳ thi mới" sẽ mở một đợt thi độc lập để lấy một cột điểm mới.</span>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                        >
                            <Plus className="w-5 h-5" />
                            Tạo kỳ thi mới
                        </button>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700">Tiêu đề đợt thi</th>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700">Môn học</th>
                                        <th className="text-center py-4 px-6 font-bold text-gray-700">Lớp HP</th>
                                        <th className="text-center py-4 px-6 font-bold text-gray-700">Thời gian (phút)</th>
                                        <th className="text-center py-4 px-6 font-bold text-gray-700">Số câu</th>
                                        <th className="text-center py-4 px-6 font-bold text-gray-700">Mở phòng - Đóng phòng</th>
                                        <th className="text-center py-4 px-6 font-bold text-gray-700">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {exams.map(exam => (
                                        <tr key={exam.id} className="hover:bg-purple-50/30 transition-colors">
                                            <td className="py-4 px-6 font-bold text-gray-900">{exam.tieu_de}</td>
                                            <td className="py-4 px-6 text-gray-600 font-medium">{exam.TenMonHoc || exam.ma_mon_hoc}</td>
                                            <td className="py-4 px-6 text-center">
                                                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg font-bold text-xs">
                                                    {exam.ma_lop_hoc_phan}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center font-bold text-gray-700">{exam.thoi_gian_thi_phut}p</td>
                                            <td className="py-4 px-6 text-center font-bold text-blue-600">{exam.tong_so_cau}</td>
                                            <td className="py-4 px-6 text-center text-sm text-gray-500 font-medium">
                                                <div className="text-emerald-600">{new Date(exam.thoi_gian_bat_dau).toLocaleString('vi-VN')}</div>
                                                <div className="text-rose-500">{new Date(exam.thoi_gian_ket_thuc).toLocaleString('vi-VN')}</div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <button 
                                                    onClick={() => handleDeleteExam(exam)}
                                                    className="p-2 text-rose-500 hover:bg-rose-100 rounded-xl transition-all"
                                                    title="Xóa kỳ thi này"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {exams.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan="7" className="py-12 text-center text-gray-500">
                                                <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                                <p className="font-semibold text-lg">Chưa có đợt kiểm tra nào.</p>
                                                <p className="text-sm">Nhấn "Tạo kỳ thi mới" để bắt đầu thiết lập.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* TAB 2: LỊCH SỬ LÀM BÀI & XEM ĐIỂM */}
            {activeTab === 'history' && (
                <AnimatePresence mode="wait">
                    {!selectedExamForResults ? (
                        <motion.div 
                            key="grid"
                            initial={{ opacity: 0, x: -20 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8"
                        >
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b pb-4">
                                <History className="w-6 h-6 text-indigo-600" />
                                Chọn đợt kiểm tra để lấy bảng điểm
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {exams.map(exam => (
                                    <div 
                                        key={exam.id} 
                                        onClick={() => handleViewResults(exam)} 
                                        className="relative group p-6 border border-gray-200 rounded-2xl cursor-pointer hover:border-indigo-400 hover:shadow-xl transition-all bg-gradient-to-br from-white to-indigo-50/30 overflow-hidden"
                                    >
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 transform origin-left scale-y-0 group-hover:scale-y-100 transition-transform duration-300 ease-out" />
                                        
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                                                <BookOpen className="w-6 h-6" />
                                            </div>
                                            <span className="bg-white border border-gray-200 text-gray-600 font-bold px-3 py-1 rounded-lg text-xs shadow-sm">
                                                {exam.ma_lop_hoc_phan}
                                            </span>
                                        </div>
                                        
                                        <h4 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 group-hover:text-indigo-700 transition-colors">
                                            {exam.tieu_de}
                                        </h4>
                                        <p className="text-sm text-gray-500 font-medium mb-5 line-clamp-1">{exam.TenMonHoc || exam.ma_mon_hoc}</p>
                                        
                                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                            <div className="text-sm font-semibold text-gray-600">
                                                <span className="text-indigo-600 font-extrabold">{exam.tong_so_cau}</span> câu hỏi
                                            </div>
                                            <div className="text-indigo-600 font-bold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                                Xem điểm <ChevronLeft className="w-4 h-4 rotate-180" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {exams.length === 0 && !loading && (
                                    <div className="col-span-full py-16 text-center text-gray-500">
                                        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p className="font-bold text-lg text-gray-700">Chưa có đợt kiểm tra nào trong hệ thống.</p>
                                        <p className="text-sm mt-1">Vui lòng quay lại tab "Mở Đề Thi" để khởi tạo.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="detail"
                            initial={{ opacity: 0, x: 20 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            exit={{ opacity: 0, x: 20 }}
                            className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden flex flex-col"
                        >
                            <div className="p-6 md:p-8 border-b bg-gradient-to-r from-indigo-50/50 to-blue-50/50">
                                <button 
                                    onClick={() => setSelectedExamForResults(null)} 
                                    className="flex items-center gap-2 text-indigo-700 hover:text-indigo-900 font-bold mb-6 text-sm bg-white px-4 py-2 rounded-xl shadow-sm border border-indigo-100 transition-all hover:-translate-x-1 w-max"
                                >
                                    <ChevronLeft className="w-4 h-4" /> Trở lại danh sách đợt thi
                                </button>
                                
                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                    <div>
                                        <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                                            <BarChart2 className="w-8 h-8 text-indigo-500" />
                                            Bảng Điểm: {selectedExamForResults.tieu_de}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-3 mt-3">
                                            <span className="text-sm text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-lg font-bold shadow-sm">
                                                Lớp: <span className="text-indigo-700">{selectedExamForResults.ma_lop_hoc_phan}</span>
                                            </span>
                                            <span className="text-sm text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-lg font-bold shadow-sm">
                                                Môn: {selectedExamForResults.TenMonHoc || selectedExamForResults.ma_mon_hoc}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md">
                                        Tổng nộp: {examResults.length} SV
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-6 md:p-8 min-h-[400px]">
                                {loadingResults ? (
                                    <div className="flex flex-col items-center justify-center h-full pt-12 text-indigo-600">
                                        <Sparkles className="w-12 h-12 animate-spin mb-4" />
                                        <p className="font-bold text-lg">Hệ thống đang tổng hợp điểm...</p>
                                    </div>
                                ) : examResults.length > 0 ? (
                                    <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-gray-50 border-b border-gray-200 font-extrabold text-gray-600 uppercase text-xs tracking-wider">
                                                    <tr>
                                                        <th className="px-6 py-4 text-center w-16">STT</th>
                                                        <th className="px-6 py-4">Sinh viên</th>
                                                        <th className="px-6 py-4 text-center">Thời gian nộp bài</th>
                                                        <th className="px-6 py-4 text-center">Đúng / Sai</th>
                                                        <th className="px-6 py-4 text-center">Điểm Hệ 10</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 bg-white">
                                                    {examResults.map((rs, idx) => (
                                                        <tr key={rs.attempt_id} className="hover:bg-indigo-50/30 transition-colors">
                                                            <td className="px-6 py-4 text-center font-bold text-gray-400">{idx + 1}</td>
                                                            <td className="px-6 py-4">
                                                                <div className="font-bold text-gray-900 text-base">{rs.HoTen || 'Chưa cập nhật'}</div>
                                                                <div className="text-xs font-bold text-indigo-600 mt-1">{rs.mssv}</div>
                                                            </td>
                                                            <td className="px-6 py-4 text-center font-semibold text-gray-600">
                                                                {new Date(rs.thoi_gian_nop_bai).toLocaleString('vi-VN')}
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <div className="flex items-center justify-center gap-3">
                                                                    <span className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                                                                        <CheckCircle className="w-4 h-4"/> {rs.so_cau_dung || 0}
                                                                    </span>
                                                                    <span className="flex items-center gap-1.5 text-rose-700 font-bold bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
                                                                        <XCircle className="w-4 h-4"/> {rs.so_cau_sai || 0}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl font-extrabold text-lg shadow-sm border-2 ${
                                                                    Number(rs.diem_so) >= 8 ? 'bg-emerald-50 text-emerald-600 border-emerald-300' : 
                                                                    Number(rs.diem_so) >= 5 ? 'bg-indigo-50 text-indigo-600 border-indigo-300' : 
                                                                    'bg-rose-50 text-rose-600 border-rose-300'
                                                                }`}>
                                                                    {Number(rs.diem_so).toFixed(1)}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center pt-16 pb-8 text-gray-500">
                                        <Users className="w-16 h-16 mb-4 text-gray-300" />
                                        <p className="text-xl font-bold text-gray-800">Chưa có dữ liệu điểm</p>
                                        <p className="text-sm mt-2 text-gray-500">Danh sách sẽ tự động cập nhật ngay khi có sinh viên nộp bài.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* MODAL TẠO KỲ THI ĐÃ NÂNG CẤP */}
            {showCreateModal && (
                <ModalPortal>
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white rounded-3xl w-full max-w-3xl h-[85vh] flex flex-col shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b bg-purple-50">
                                <h3 className="text-2xl font-extrabold text-purple-900">Tạo Đợt Kiểm Tra Mới</h3>
                                <p className="text-sm text-purple-700 font-medium mt-1">Hệ thống sẽ tạo ra 1 cột điểm độc lập cho đợt thi này</p>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                                <form id="exam-form" onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Môn học</label>
                                            <select required value={formData.ma_mon_hoc} onChange={e => setFormData({...formData, ma_mon_hoc: e.target.value, bank_id: ''})} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white font-medium">
                                                <option value="">-- Chọn môn học --</option>
                                                {subjects.map(s => <option key={s.MaMonHoc} value={s.MaMonHoc}>{s.TenMonHoc} ({s.MaMonHoc})</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Lớp học phần</label>
                                            <select required value={formData.ma_lop_hoc_phan} onChange={e => setFormData({...formData, ma_lop_hoc_phan: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white font-medium">
                                                <option value="">-- Chọn Lớp HP --</option>
                                                {classes.filter(c => c.MaMonHoc === formData.ma_mon_hoc).map(c => <option key={c.MaLopHocPhan} value={c.MaLopHocPhan}>{c.TenMonHoc} ({c.MaLopHocPhan})</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* NÂNG CẤP: CHỌN ĐÚNG NGÂN HÀNG ĐỀ */}
                                    <div>
                                        <label className="block text-sm font-extrabold text-indigo-700 mb-2">Chọn Ngân hàng đề để bốc câu hỏi <span className="text-rose-500">*</span></label>
                                        <select required value={formData.bank_id} onChange={e => setFormData({...formData, bank_id: e.target.value})} className="w-full p-3.5 bg-indigo-50/50 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-900">
                                            <option value="">-- Chọn bộ đề thi (Vui lòng chọn môn học trước) --</option>
                                            {banks.filter(b => b.ma_mon_hoc === formData.ma_mon_hoc).map(b => (
                                                <option key={b.id} value={b.id}>{b.tieu_de} (Có {b.tong_so_cau} câu)</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Tiêu đề đợt thi</label>
                                        <input type="text" required value={formData.tieu_de} onChange={e => setFormData({...formData, tieu_de: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white font-medium" placeholder="Ví dụ: Kiểm tra 15p - Đợt 1..." />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Thời gian mở phòng</label>
                                            <input type="datetime-local" required value={formData.thoi_gian_bat_dau} onChange={e => setFormData({...formData, thoi_gian_bat_dau: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white font-medium" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Thời gian đóng phòng</label>
                                            <input type="datetime-local" required value={formData.thoi_gian_ket_thuc} onChange={e => setFormData({...formData, thoi_gian_ket_thuc: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white font-medium" />
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-2xl border border-purple-100 space-y-5">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-200/60 pb-4">
                                            <h4 className="font-extrabold text-purple-900 flex items-center gap-2"><BookOpen className="w-5 h-5"/> Cấu trúc đề thi tự động</h4>
                                            <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-purple-100">
                                                <input
                                                    type="number" min="1" max="200" value={autoCount}
                                                    onChange={e => setAutoCount(Math.max(1, parseInt(e.target.value) || 10))}
                                                    className="w-16 p-2 text-sm font-bold text-center border-none bg-transparent focus:ring-0"
                                                    title="Tổng số câu" placeholder="C"
                                                />
                                                <button
                                                    type="button" onClick={handleAutoDistributeAI}
                                                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-lg text-xs shadow-sm hover:opacity-90"
                                                >
                                                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> Chia Tự Động
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Dễ</label>
                                                <input type="number" min="0" required value={formData.so_cau_de} onChange={e => setFormData({...formData, so_cau_de: Math.max(0, Number(e.target.value))})} className="w-full p-3 bg-white border border-gray-200 rounded-xl text-center font-bold text-blue-600 focus:ring-2 focus:ring-blue-500" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Trung bình</label>
                                                <input type="number" min="0" required value={formData.so_cau_tb} onChange={e => setFormData({...formData, so_cau_tb: Math.max(0, Number(e.target.value))})} className="w-full p-3 bg-white border border-gray-200 rounded-xl text-center font-bold text-yellow-600 focus:ring-2 focus:ring-yellow-500" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Khó</label>
                                                <input type="number" min="0" required value={formData.so_cau_kho} onChange={e => setFormData({...formData, so_cau_kho: Math.max(0, Number(e.target.value))})} className="w-full p-3 bg-white border border-gray-200 rounded-xl text-center font-bold text-red-600 focus:ring-2 focus:ring-red-500" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-extrabold text-purple-700 uppercase mb-1">Thời gian (phút)</label>
                                                <input type="number" min="1" required value={formData.thoi_gian_thi_phut} onChange={e => setFormData({...formData, thoi_gian_thi_phut: Math.max(1, Number(e.target.value))})} className="w-full p-3 border-2 border-purple-400 bg-white rounded-xl text-center font-extrabold text-purple-700 focus:ring-2 focus:ring-purple-500 shadow-inner" />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-sm font-semibold text-purple-900 bg-white p-3 rounded-xl border border-purple-200 shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4 text-purple-600"/>
                                                <span>Tổng: Dễ ({formData.so_cau_de}) + TB ({formData.so_cau_tb}) + Khó ({formData.so_cau_kho})</span>
                                            </div>
                                            <span className="font-extrabold bg-purple-100 px-3 py-1 rounded-lg">= {totalConfigQuestions} câu</span>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200 text-amber-800 font-bold text-sm flex items-center gap-3">
                                        <AlertCircle className="w-6 h-6 shrink-0 text-amber-500" />
                                        <span>Lưu ý: Mỗi sinh viên của lớp chỉ được phép làm và nộp bài 1 lần duy nhất trong đợt kiểm tra này.</span>
                                    </div>
                                </form>
                            </div>
                            <div className="p-5 border-t bg-gray-50 flex gap-4 shrink-0">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-all">Hủy bỏ</button>
                                <button type="submit" form="exam-form" className="flex-1 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5">Tạo Kỳ Thi</button>
                            </div>
                        </motion.div>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
}

export default ExamManagement;