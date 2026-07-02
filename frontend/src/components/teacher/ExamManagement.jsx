import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Calendar, Clock, BookOpen, UserCheck, AlertCircle, Sparkles } from 'lucide-react';
import axios from 'axios';
import ModalPortal, { Toast, ConfirmDialog } from '../common/ModalPortal';
import API_URL from '../../api';

function ExamManagement() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [banks, setBanks] = useState([]);

    const currentUser = JSON.parse(localStorage.getItem('user')) || {};
    const teacherId = currentUser.role === 'admin' ? '' : (currentUser.id || 'GVCNTT001');

    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const showToast = (message, type = 'success') => { setToast({ show: true, message, type }); setTimeout(() => setToast({ show: false }), 3000); };

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [autoCount, setAutoCount] = useState(25);
    const [formData, setFormData] = useState({
        ma_lop_hoc_phan: '', ma_mon_hoc: '', tieu_de: '', thoi_gian_thi_phut: 60,
        so_cau_de: 10, so_cau_tb: 10, so_cau_kho: 5,
        thoi_gian_bat_dau: '', thoi_gian_ket_thuc: '', cho_phep_thi_lai: false
    });

    const handleAutoDistributeAI = () => {
        const n = Math.max(1, Number(autoCount) || 10);
        const easy = Math.round(n * 0.4);
        const med = Math.round(n * 0.4);
        const hard = n - easy - med; // đảm bảo chính xác ràng buộc tổng số câu = dễ + tb + khó
        setFormData({ ...formData, so_cau_de: easy, so_cau_tb: med, so_cau_kho: hard });
        showToast(`⚡ AI đã phân chia: ${easy} Dễ, ${med} TB, ${hard} Khó (Tổng: ${n} câu)`, 'info');
    };

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
                axios.get(`${API_URL}/api/teaching-assignments`), // Dùng lớp học phần
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

    const totalConfigQuestions = Number(formData.so_cau_de) + Number(formData.so_cau_tb) + Number(formData.so_cau_kho);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.ma_mon_hoc || !formData.ma_lop_hoc_phan || !formData.tieu_de || !formData.thoi_gian_bat_dau || !formData.thoi_gian_ket_thuc) {
            return showToast('Vui lòng nhập đầy đủ các trường dữ liệu bắt buộc!', 'error');
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
            showToast('Tạo kỳ thi online thành công!');
            setShowCreateModal(false);
            fetchExams();
        } catch (error) {
            showToast(error.response?.data?.message || 'Lỗi tạo kỳ thi', 'error');
        }
    };

    return (
        <div className="space-y-8 p-4 max-w-screen-3xl mx-auto w-full">
            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
            
            <div className="bg-gradient-to-r from-purple-800 to-indigo-900 rounded-2xl p-8 shadow-xl text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                            <Calendar className="w-8 h-8 text-purple-300" />
                            Tổ chức Thi Online (AI)
                        </h2>
                        <p className="text-gray-200 text-lg">Thiết lập cấu trúc đề thi tự động từ Ngân hàng AI</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-white text-purple-900 px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-gray-100 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Tạo kỳ thi mới
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left py-4 px-6 font-bold text-gray-700">Tiêu đề kỳ thi</th>
                                <th className="text-left py-4 px-6 font-bold text-gray-700">Môn học</th>
                                <th className="text-center py-4 px-6 font-bold text-gray-700">Lớp HP</th>
                                <th className="text-center py-4 px-6 font-bold text-gray-700">Thời gian (phút)</th>
                                <th className="text-center py-4 px-6 font-bold text-gray-700">Số câu</th>
                                <th className="text-center py-4 px-6 font-bold text-gray-700">Thời gian mở phòng - Kết thúc ôn thi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {exams.map(exam => (
                                <tr key={exam.id} className="hover:bg-gray-50">
                                    <td className="py-4 px-6 font-semibold text-gray-800">{exam.tieu_de}</td>
                                    <td className="py-4 px-6 text-gray-600">{exam.TenMonHoc || exam.ma_mon_hoc} ({exam.ma_mon_hoc})</td>
                                    <td className="py-4 px-6 text-center text-purple-600 font-bold">{exam.ma_lop_hoc_phan}</td>
                                    <td className="py-4 px-6 text-center font-semibold">{exam.thoi_gian_thi_phut} phút</td>
                                    <td className="py-4 px-6 text-center text-blue-600 font-bold">{exam.tong_so_cau}</td>
                                    <td className="py-4 px-6 text-center text-sm text-gray-500">
                                        {new Date(exam.thoi_gian_bat_dau).toLocaleString('vi-VN')} <br/>
                                        - {new Date(exam.thoi_gian_ket_thuc).toLocaleString('vi-VN')}
                                    </td>
                                </tr>
                            ))}
                            {exams.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="6" className="py-10 text-center text-gray-500">Chưa có kỳ thi nào được tạo.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Create */}
            {showCreateModal && (
                <ModalPortal>
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
                        <div className="bg-white rounded-2xl w-full max-w-3xl h-[85vh] flex flex-col shadow-2xl">
                            <div className="p-5 border-b bg-purple-50 rounded-t-2xl">
                                <h3 className="text-xl font-bold text-purple-900">Tạo Kỳ thi Online</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6">
                                <form id="exam-form" onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Môn học</label>
                                            <select required value={formData.ma_mon_hoc} onChange={e => setFormData({...formData, ma_mon_hoc: e.target.value})} className="w-full p-3 border rounded-xl">
                                                <option value="">-- Chọn môn học --</option>
                                                {subjects.map(s => <option key={s.MaMonHoc} value={s.MaMonHoc}>{s.TenMonHoc} ({s.MaMonHoc})</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Lớp học phần</label>
                                            <select required value={formData.ma_lop_hoc_phan} onChange={e => setFormData({...formData, ma_lop_hoc_phan: e.target.value})} className="w-full p-3 border rounded-xl">
                                                <option value="">-- Chọn Lớp HP --</option>
                                                {classes.filter(c => c.MaMonHoc === formData.ma_mon_hoc).map(c => <option key={c.MaLopHocPhan} value={c.MaLopHocPhan}>{c.TenMonHoc} ({c.MaLopHocPhan})</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Tiêu đề kỳ thi</label>
                                        <input type="text" required value={formData.tieu_de} onChange={e => setFormData({...formData, tieu_de: e.target.value})} className="w-full p-3 border rounded-xl" placeholder="Ví dụ: Thi cuối kỳ môn Đám mây..." />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Thời gian mở phòng (Bắt đầu)</label>
                                            <input type="datetime-local" required value={formData.thoi_gian_bat_dau} onChange={e => setFormData({...formData, thoi_gian_bat_dau: e.target.value})} className="w-full p-3 border rounded-xl" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Thời gian kết thúc ôn thi</label>
                                            <input type="datetime-local" required value={formData.thoi_gian_ket_thuc} onChange={e => setFormData({...formData, thoi_gian_ket_thuc: e.target.value})} className="w-full p-3 border rounded-xl" />
                                        </div>
                                    </div>

                                    <div className="bg-purple-50 p-5 rounded-2xl border border-purple-100 space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-200/60 pb-3">
                                            <h4 className="font-bold text-purple-900 flex items-center gap-2"><BookOpen className="w-5 h-5"/> Cấu trúc đề thi (Từ Ngân hàng câu hỏi đã duyệt)</h4>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="200"
                                                    value={autoCount}
                                                    onChange={e => setAutoCount(Math.max(1, parseInt(e.target.value) || 10))}
                                                    className="w-20 p-2 text-xs font-bold text-center border rounded-lg bg-white"
                                                    title="Tổng số câu hỏi muốn chia tự động"
                                                    placeholder="Tổng câu"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAutoDistributeAI}
                                                    className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
                                                >
                                                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                                                    <span>⚡ AI Tự phân chia (40/40/20)</span>
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Dễ</label>
                                                <input type="number" min="0" required value={formData.so_cau_de} onChange={e => setFormData({...formData, so_cau_de: Math.max(0, Number(e.target.value))})} className="w-full p-3 border rounded-xl text-center font-bold text-blue-900" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Trung bình</label>
                                                <input type="number" min="0" required value={formData.so_cau_tb} onChange={e => setFormData({...formData, so_cau_tb: Math.max(0, Number(e.target.value))})} className="w-full p-3 border rounded-xl text-center font-bold text-yellow-900" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Khó</label>
                                                <input type="number" min="0" required value={formData.so_cau_kho} onChange={e => setFormData({...formData, so_cau_kho: Math.max(0, Number(e.target.value))})} className="w-full p-3 border rounded-xl text-center font-bold text-red-900" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-purple-700 uppercase mb-1">Tổng thời gian (phút)</label>
                                                <input type="number" min="1" required value={formData.thoi_gian_thi_phut} onChange={e => setFormData({...formData, thoi_gian_thi_phut: Math.max(1, Number(e.target.value))})} className="w-full p-3 border-2 border-purple-300 rounded-xl text-center font-bold text-purple-700 bg-white" />
                                            </div>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between text-xs font-semibold text-purple-800 bg-white/80 p-3 rounded-xl border border-purple-200">
                                            <div className="flex items-center gap-1.5">
                                                <AlertCircle className="w-4 h-4 text-purple-600"/>
                                                <span>Ràng buộc: Tổng câu ({totalConfigQuestions}) = Dễ ({formData.so_cau_de}) + TB ({formData.so_cau_tb}) + Khó ({formData.so_cau_kho})</span>
                                            </div>
                                            <span className="text-sm font-extrabold bg-purple-200 text-purple-900 px-3 py-1 rounded-lg">Tổng: {totalConfigQuestions} câu</span>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 font-semibold text-sm flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
                                        Mỗi sinh viên chỉ được phép làm bài thi và nộp bài 1 lần duy nhất trong kỳ thi này.
                                    </div>
                                </form>
                            </div>
                            <div className="p-5 border-t bg-gray-50 flex gap-3 shrink-0 rounded-b-2xl">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100">Hủy</button>
                                <button type="submit" form="exam-form" className="flex-1 py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-lg transition-all">Tạo Kỳ Thi</button>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
}

export default ExamManagement;
