import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Calendar, Clock, BookOpen, UserCheck, AlertCircle } from 'lucide-react';
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
    const [formData, setFormData] = useState({
        ma_lop_hoc_phan: '', ma_mon_hoc: '', tieu_de: '', thoi_gian_thi_phut: 60,
        so_cau_de: 10, so_cau_tb: 10, so_cau_kho: 5,
        thoi_gian_bat_dau: '', thoi_gian_ket_thuc: '', cho_phep_thi_lai: false
    });

    useEffect(() => {
        fetchExams();
        fetchOptions();
    }, []);

    const fetchExams = async () => {
        // Mock API cho demo vì chưa viết GET /exams/teacher, tạm dùng danh sách rỗng hoặc giả lập
        setLoading(false);
        // Trong thực tế sẽ gọi API GET /api/ai-exams/exams/teacher/:id
    };

    const fetchOptions = async () => {
        try {
            const [clsRes, subRes, bankRes] = await Promise.all([
                axios.get(`${API_URL}/api/teaching-assignments`), // Dùng lớp học phần
                axios.get(`${API_URL}/api/subjects`),
                axios.get(`${API_URL}/api/ai-exams/banks/teacher/${teacherId}`)
            ]);
            setClasses(clsRes.data);
            setSubjects(subRes.data);
            setBanks(bankRes.data.filter(b => b.trang_thai === 'Approved'));
        } catch (error) {
            console.error('Error fetching options', error);
        }
    };

    const totalConfigQuestions = Number(formData.so_cau_de) + Number(formData.so_cau_tb) + Number(formData.so_cau_kho);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const payload = {
            ...formData,
            ma_giang_vien: teacherId,
            tong_so_cau: totalConfigQuestions
        };

        try {
            await axios.post(`${API_URL}/api/ai-exams/exams`, payload);
            showToast('Tạo kỳ thi thành công!');
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
                                                {subjects.map(s => <option key={s.MaMonHoc} value={s.MaMonHoc}>{s.TenMonHoc}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Lớp học phần</label>
                                            <select required value={formData.ma_lop_hoc_phan} onChange={e => setFormData({...formData, ma_lop_hoc_phan: e.target.value})} className="w-full p-3 border rounded-xl">
                                                <option value="">-- Chọn Lớp HP --</option>
                                                {classes.filter(c => c.MaMonHoc === formData.ma_mon_hoc).map(c => <option key={c.MaLopHocPhan} value={c.MaLopHocPhan}>{c.MaLopHocPhan} - {c.TenMonHoc}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Tiêu đề kỳ thi</label>
                                        <input type="text" required value={formData.tieu_de} onChange={e => setFormData({...formData, tieu_de: e.target.value})} className="w-full p-3 border rounded-xl" placeholder="Ví dụ: Thi cuối kỳ môn Đám mây..." />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Thời gian bắt đầu</label>
                                            <input type="datetime-local" required value={formData.thoi_gian_bat_dau} onChange={e => setFormData({...formData, thoi_gian_bat_dau: e.target.value})} className="w-full p-3 border rounded-xl" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Thời gian kết thúc</label>
                                            <input type="datetime-local" required value={formData.thoi_gian_ket_thuc} onChange={e => setFormData({...formData, thoi_gian_ket_thuc: e.target.value})} className="w-full p-3 border rounded-xl" />
                                        </div>
                                    </div>

                                    <div className="bg-purple-50 p-5 rounded-2xl border border-purple-100">
                                        <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2"><BookOpen className="w-5 h-5"/> Cấu trúc đề thi (Random AI)</h4>
                                        <div className="grid grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Dễ</label>
                                                <input type="number" min="0" value={formData.so_cau_de} onChange={e => setFormData({...formData, so_cau_de: e.target.value})} className="w-full p-3 border rounded-xl text-center" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Trung bình</label>
                                                <input type="number" min="0" value={formData.so_cau_tb} onChange={e => setFormData({...formData, so_cau_tb: e.target.value})} className="w-full p-3 border rounded-xl text-center" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Khó</label>
                                                <input type="number" min="0" value={formData.so_cau_kho} onChange={e => setFormData({...formData, so_cau_kho: e.target.value})} className="w-full p-3 border rounded-xl text-center" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-purple-700 uppercase mb-1">Tổng thời gian (phút)</label>
                                                <input type="number" min="5" value={formData.thoi_gian_thi_phut} onChange={e => setFormData({...formData, thoi_gian_thi_phut: e.target.value})} className="w-full p-3 border-2 border-purple-300 rounded-xl text-center font-bold text-purple-700 bg-white" />
                                            </div>
                                        </div>
                                        <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-purple-800">
                                            <AlertCircle className="w-4 h-4"/> Tổng số câu hỏi trong mỗi đề: <span className="text-xl bg-purple-200 px-3 py-1 rounded-lg">{totalConfigQuestions}</span>
                                        </div>
                                    </div>
                                    
                                    <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border cursor-pointer">
                                        <input type="checkbox" checked={formData.cho_phep_thi_lai} onChange={e => setFormData({...formData, cho_phep_thi_lai: e.target.checked})} className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500" />
                                        <span className="font-semibold text-gray-800">Cho phép thi lại nhiều lần</span>
                                    </label>
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
