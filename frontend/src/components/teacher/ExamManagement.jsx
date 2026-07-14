import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    Plus, Calendar, BookOpen, AlertCircle, Sparkles, 
    Trash2, BarChart2, XCircle, CheckCircle, Users,
    ClipboardList, History, ChevronLeft, Edit2, MonitorPlay, Clock
} from 'lucide-react';
import axios from 'axios';
import ModalPortal, { Toast, ConfirmDialog } from '../common/ModalPortal';
import API_URL from '../../api';

function ExamManagement() {
    const navigate = useNavigate();
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
    const initialFormData = {
        ma_lop_hoc_phan: '', ma_mon_hoc: '', bank_id: '', tieu_de: '', thoi_gian_thi_phut: 60,
        tong_so_cau: 30,
        so_cau_de: 0, so_cau_tb: 0, so_cau_kho: 0,
        thoi_gian_bat_dau: '', thoi_gian_ket_thuc: ''
    };
    const [formData, setFormData] = useState(initialFormData);
    const [confirmDialog, setConfirmDialog] = useState({ show: false, message: '', title: '', onConfirm: null });
    const [submitErrors, setSubmitErrors] = useState({});

    const openConfirmDialog = (title, message, onConfirm) => {
        setConfirmDialog({ show: true, title, message, onConfirm });
    };

    const closeConfirmDialog = () => {
        setConfirmDialog(prev => ({ ...prev, show: false }));
    };

    // States Lịch sử & Bảng điểm
    const [selectedExamForResults, setSelectedExamForResults] = useState(null);
    const [examResults, setExamResults] = useState([]);
    const [loadingResults, setLoadingResults] = useState(false);

    // States Edit Exam
    const [showEditModal, setShowEditModal] = useState(false);
    const [editExamData, setEditExamData] = useState(null);

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
            setBanks((bankRes.data?.data || bankRes.data || []).filter(b => b.trang_thai === 'Approved'));

        } catch (error) {
            console.error('Error fetching options', error);
        }
    };

    const isBankAvailableForClass = (b, maMonHoc, maLopHocPhan) => {
        if (!maMonHoc || b.ma_mon_hoc !== maMonHoc) return false;
        if (!maLopHocPhan) return true;

        const shortLhp = maLopHocPhan.split('.').pop(); // VD: HP01, HP02
        const bankLhp = (b.ma_lop_hoc_phan || '').toString().trim();
        const hasBracketTag = /\[([^\]]*HP[^\]]*)\]/i.test(b.tieu_de || '');

        // Nếu bộ đề KHÔNG gán riêng cho LHP nào (tạo chung cho môn học ở Ảnh 2)
        if ((!bankLhp || bankLhp === '[]' || bankLhp === 'null') && !hasBracketTag) {
            return true;
        }

        // Nếu bộ đề có gán LHP -> chỉ hiện khi LHP đang chọn khớp với LHP của bộ đề
        if (bankLhp && (bankLhp.includes(maLopHocPhan) || bankLhp.includes(shortLhp))) {
            return true;
        }
        if (hasBracketTag && ((b.tieu_de || '').includes(shortLhp) || (b.tieu_de || '').includes(maLopHocPhan))) {
            return true;
        }

        return false;
    };

    const VNDateTimePicker = ({ value, onChange, disabled = false, defaultTime = '08:00', hasError = false }) => {
        const dateRef = useRef(null);

        const parseValue = (val) => {
            if (!val) return { dateStr: '', timeStr: defaultTime, displayDate: '' };
            const [d, t] = val.split('T');
            let displayDate = '';
            if (d && d.includes('-')) {
                const [y, m, day] = d.split('-');
                displayDate = `${day}/${m}/${y}`;
            }
            return { dateStr: d || '', timeStr: (t || defaultTime).slice(0, 5), displayDate };
        };

        const { dateStr, timeStr, displayDate } = parseValue(value);

        const handleDateChange = (newYMD) => {
            if (!newYMD) {
                onChange('');
                return;
            }
            onChange(`${newYMD}T${timeStr || defaultTime}`);
        };

        const handleTimeChange = (newTime) => {
            const t = newTime || defaultTime;
            if (!dateStr) {
                const today = new Date().toISOString().slice(0, 10);
                onChange(`${today}T${t}`);
                return;
            }
            onChange(`${dateStr}T${t}`);
        };

        return (
            <div className={`flex items-center gap-2 w-full p-3.5 bg-gray-50 border ${hasError ? 'border-red-500 bg-red-50/30' : 'border-gray-200'} rounded-xl focus-within:ring-2 focus-within:ring-purple-500 focus-within:bg-white transition-all ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
                {/* Lịch chọn ngày (DD/MM/YYYY) */}
                <div 
                    className={`relative flex-1 flex items-center gap-2.5 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    onClick={() => !disabled && dateRef.current && dateRef.current.showPicker && dateRef.current.showPicker()}
                >
                    <Calendar className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    <span className={`text-sm font-medium ${displayDate ? 'text-gray-800 font-bold' : 'text-gray-400 font-medium'}`}>
                        {displayDate || 'dd/mm/yyyy'}
                    </span>
                    <input
                        ref={dateRef}
                        type="date"
                        disabled={disabled}
                        value={dateStr}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                </div>

                <div className="h-5 w-px bg-gray-200 flex-shrink-0" />

                {/* Chọn giờ (HH:mm) */}
                <div className="flex items-center gap-1.5 px-1">
                    <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <input
                        type="time"
                        disabled={disabled}
                        value={timeStr}
                        onChange={(e) => handleTimeChange(e.target.value)}
                        className="bg-transparent border-0 text-sm font-bold text-gray-800 focus:outline-none cursor-pointer p-0"
                    />
                </div>
            </div>
        );
    };

    const handleDeleteExam = async (exam) => {
        if (Number(exam.attempt_count) > 0) {
            return showToast('Không thể xóa đợt thi đã có sinh viên tham gia và có kết quả.', 'error');
        }
        
        openConfirmDialog(
            'Xác nhận xóa',
            `Bạn có chắc chắn muốn xóa kỳ thi "${exam.tieu_de}" không? Hành động này không thể hoàn tác.`,
            async () => {
                closeConfirmDialog();
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
        );
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

    const totalConfigQuestions = Number(formData.tong_so_cau);
    const selectedBankInfo = banks.find(b => String(b.id) === String(formData.bank_id));
    const maxAvailableQuestions = selectedBankInfo ? selectedBankInfo.tong_so_cau : 0;

    const formatDateDisplay = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        let errors = {};
        
        if (!formData.ma_mon_hoc || !formData.ma_lop_hoc_phan || !formData.bank_id || !formData.thoi_gian_bat_dau || !formData.thoi_gian_ket_thuc) {
            return showToast('Vui lòng điền đầy đủ các thông tin (Bao gồm cả Chọn Ngân hàng đề)!', 'error');
        }
        
        const tieuDeTrim = formData.tieu_de ? formData.tieu_de.trim() : '';
        if (!tieuDeTrim) {
            errors.tieu_de = 'Không được bỏ trống tiêu đề đợt thi!';
        } else if (tieuDeTrim.length < 10) {
            errors.tieu_de = 'Tiêu đề đợt thi phải từ 10 ký tự trở lên!';
        } else if (formData.tieu_de.length > 30) {
            errors.tieu_de = 'Tiêu đề đợt thi không được vượt quá 30 ký tự!';
        } else {
            const validRegex = /^[a-zA-Z0-9\s\-\(\)ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ]*$/;
            if (!validRegex.test(formData.tieu_de)) {
                errors.tieu_de = 'Chỉ được phép sử dụng chữ cái, số, khoảng trắng và các ký tự: - ( )';
            }
        }

        const now = new Date();
        if (new Date(formData.thoi_gian_bat_dau) < new Date(now.getTime() - 60000)) {
            return showToast('Thời gian mở phòng thi (bắt đầu) không được chọn ở quá khứ!', 'error');
        }

        if (new Date(formData.thoi_gian_ket_thuc) <= new Date(formData.thoi_gian_bat_dau)) {
            return showToast('Thời gian kết thúc ôn thi phải sau thời gian mở phòng!', 'error');
        }

        const tongSoCauVal = Number(formData.tong_so_cau);
        
        if (selectedBankInfo) {
            if (maxAvailableQuestions >= 20) {
                if (tongSoCauVal < 20 || !Number.isInteger(tongSoCauVal)) {
                    errors.tong_so_cau = 'Tổng số câu hỏi phải là số nguyên và tối thiểu từ 20 câu trở lên!';
                } else if (tongSoCauVal > maxAvailableQuestions) {
                    errors.tong_so_cau = `Tổng số câu hỏi (${tongSoCauVal}) vượt quá số lượng câu hỏi có trong ngân hàng đề (${maxAvailableQuestions})!`;
                }
            } else {
                // Ngân hàng có dưới 20 câu
                if (tongSoCauVal !== maxAvailableQuestions) {
                    errors.tong_so_cau = `Ngân hàng đề chỉ có ${maxAvailableQuestions} câu (chưa đủ 20). Bạn phải chọn toàn bộ ${maxAvailableQuestions} câu để tạo đề!`;
                }
            }
        } else {
            if (tongSoCauVal < 20 || !Number.isInteger(tongSoCauVal)) {
                errors.tong_so_cau = 'Tổng số câu hỏi phải là số nguyên và lớn hơn hoặc bằng 20!';
            }
        }

        const thoiGianVal = Number(formData.thoi_gian_thi_phut);
        if (thoiGianVal < 5 || !Number.isInteger(thoiGianVal)) {
            errors.thoi_gian_thi_phut = 'Thời gian làm bài phải là số nguyên và lớn hơn hoặc bằng 5 phút!';
        }

        setSubmitErrors(errors);
        
        if (Object.keys(errors).length > 0) {
            return; // Dừng lại nếu có lỗi
        }

        const payload = {
            ...formData,
            ma_giang_vien: teacherId,
            tong_so_cau: totalConfigQuestions,
            cho_phep_thi_lai: false
        };

        openConfirmDialog(
            'Xác nhận tạo kỳ thi',
            `Bạn có chắc chắn muốn tạo kỳ thi "${formData.tieu_de}" với ${totalConfigQuestions} câu hỏi không?`,
            async () => {
                closeConfirmDialog();
                try {
                    await axios.post(`${API_URL}/api/ai-exams/exams`, payload);
                    showToast('Tạo đợt kiểm tra mới thành công!');
                    setShowCreateModal(false);
                    setFormData(initialFormData);
                    setSubmitErrors({});
                    fetchExams();
                } catch (error) {
                    showToast(error.response?.data?.message || 'Lỗi tạo kỳ thi', 'error');
                }
            }
        );
    };

    const handleOpenEditModal = (exam) => {
        if (new Date(exam.thoi_gian_ket_thuc) <= new Date()) {
            return showToast('Đợt thi đã kết thúc. Không thể sửa thông tin!', 'error');
        }

        // Date parsing helper to handle timezone cleanly for datetime-local input
        const formatForInput = (isoString) => {
            if (!isoString) return '';
            const d = new Date(isoString);
            return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        };
        
        setEditExamData({
            ...exam,
            thoi_gian_bat_dau: formatForInput(exam.thoi_gian_bat_dau),
            thoi_gian_ket_thuc: formatForInput(exam.thoi_gian_ket_thuc)
        });
        setSubmitErrors({});
        setShowEditModal(true);
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        let errors = {};
        
        const tieuDeTrim = editExamData.tieu_de ? editExamData.tieu_de.trim() : '';
        if (!tieuDeTrim) {
            errors.tieu_de = 'Không được bỏ trống tiêu đề đợt thi!';
        } else if (tieuDeTrim.length < 10) {
            errors.tieu_de = 'Tiêu đề đợt thi phải từ 10 ký tự trở lên!';
        } else if (editExamData.tieu_de.length > 30) {
            errors.tieu_de = 'Tiêu đề đợt thi không được vượt quá 30 ký tự!';
        }
        
        const thoiGianVal = Number(editExamData.thoi_gian_thi_phut);
        if (thoiGianVal < 5 || !Number.isInteger(thoiGianVal)) {
            errors.thoi_gian_thi_phut = 'Thời gian làm bài phải là số nguyên và lớn hơn hoặc bằng 5 phút!';
        }
        
        const now = new Date();
        const thoiGianBatDau = new Date(editExamData.thoi_gian_bat_dau);
        const thoiGianKetThuc = new Date(editExamData.thoi_gian_ket_thuc);
        
        if (thoiGianKetThuc <= thoiGianBatDau) {
            errors.thoi_gian_ket_thuc = 'Thời gian kết thúc phải sau thời gian mở phòng!';
        }
        
        if (thoiGianKetThuc <= now) {
            errors.thoi_gian_ket_thuc = 'Thời gian kết thúc phải ở trong tương lai (sau hiện tại)!';
        }
        
        setSubmitErrors(errors);
        
        if (Object.keys(errors).length > 0) return;
        
        try {
            await axios.put(`${API_URL}/api/ai-exams/exams/${editExamData.id}`, editExamData);
            showToast('Cập nhật kỳ thi thành công!');
            setShowEditModal(false);
            setEditExamData(null);
            fetchExams();
        } catch (error) {
            showToast(error.response?.data?.message || 'Lỗi cập nhật kỳ thi', 'error');
        }
    };

    return (
        <div className="space-y-6 p-4 max-w-screen-3xl mx-auto w-full">
            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
            
            <ConfirmDialog 
                show={confirmDialog.show} 
                title={confirmDialog.title} 
                message={confirmDialog.message} 
                onConfirm={confirmDialog.onConfirm} 
                onCancel={closeConfirmDialog} 
            />
            
            {/* HEADER & TABS */}
            <div className="bg-[#F4C542] rounded-3xl p-6 md:p-8 shadow-xl text-[#152238] flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold mb-2 flex items-center gap-3 text-[#152238]">
                        Tổ chức Thi Online (AI)
                    </h2>
                    <p className="text-[#152238]/80 font-medium text-lg">Quản lý đợt thi, ngân hàng câu hỏi & lịch sử thi</p>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 w-max">
                <button
                    onClick={() => { setActiveTab('exams'); setSelectedExamForResults(null); }}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'exams' ? 'bg-[#152238] text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    <BookOpen className="w-4 h-4" />
                    Quản lý đợt thi
                </button>
                <button
                    onClick={() => { setActiveTab('history'); setSelectedExamForResults(null); }}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-[#152238] text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    <History className="w-4 h-4" />
                    Lịch sử & Bảng điểm
                </button>
            </div>

            {/* TAB 1: QUẢN LÝ ĐỢT THI */}
            {activeTab === 'exams' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-[#F4C542]/20 text-[#152238] rounded-xl">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Danh sách các đợt thi</h3>
                                <p className="text-sm text-gray-500 font-medium">Bạn có tổng cộng {exams.length} đợt kiểm tra</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => {
                                setFormData(initialFormData);
                                setSubmitErrors({});
                                setShowCreateModal(true);
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-[#F4C542] hover:bg-[#e3b637] text-[#152238] font-extrabold rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 text-sm"
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
                                        <tr key={exam.id} className="hover:bg-gray-50/30 transition-colors">
                                            <td className="py-4 px-6 font-bold text-gray-900">{exam.tieu_de}</td>
                                            <td className="py-4 px-6 text-gray-600 font-medium">{exam.TenMonHoc || exam.ma_mon_hoc}</td>
                                            <td className="py-4 px-6 text-center">
                                                <span className="bg-[#F4C542]/20 text-[#152238] px-3 py-1 rounded-lg font-bold text-xs border border-[#F4C542]/30">
                                                    {exam.ma_lop_hoc_phan}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center font-bold text-gray-700">{exam.thoi_gian_thi_phut}</td>
                                            <td className="py-4 px-6 text-center">
                                                <span className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-lg font-extrabold text-xs shadow-sm border border-yellow-100">
                                                    {exam.tong_so_cau}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center text-xs font-medium">
                                                <div className="flex flex-col gap-1.5 items-center">
                                                    <div className="text-yellow-700 bg-yellow-50 px-2.5 py-1 rounded-md border border-yellow-100 shadow-sm w-max">
                                                        <span className="font-bold text-yellow-800">Mở:</span> {new Date(exam.thoi_gian_bat_dau).toLocaleString('vi-VN')}
                                                    </div>
                                                    <div className="text-yellow-700 bg-yellow-50 px-2.5 py-1 rounded-md border border-yellow-100 shadow-sm w-max">
                                                        <span className="font-bold text-yellow-800">Đóng:</span> {new Date(exam.thoi_gian_ket_thuc).toLocaleString('vi-VN')}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button 
                                                        onClick={() => {
                                                            if (new Date(exam.thoi_gian_ket_thuc) <= new Date()) {
                                                                return showToast('Đợt thi đã kết thúc. Không thể vào màn hình giám sát!', 'error');
                                                            }
                                                            navigate(`/teacher/online-exams/dashboard/${exam.id}`);
                                                        }}
                                                        className={`p-2 rounded-xl transition-all shadow-sm border flex items-center justify-center ${
                                                            new Date(exam.thoi_gian_ket_thuc) <= new Date()
                                                            ? 'text-gray-300 border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                                                            : 'text-blue-600 hover:bg-blue-100 border-blue-200 bg-blue-50'
                                                        }`}
                                                        title={new Date(exam.thoi_gian_ket_thuc) <= new Date() ? "Kỳ thi đã kết thúc, không thể giám sát" : "Giám sát kỳ thi (Real-time)"}
                                                    >
                                                        <MonitorPlay className="w-5 h-5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleOpenEditModal(exam)}
                                                        className={`p-2 rounded-xl transition-all shadow-sm border flex items-center justify-center ${
                                                            new Date(exam.thoi_gian_ket_thuc) <= new Date()
                                                            ? 'text-gray-300 border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                                                            : 'text-[#152238] hover:bg-[#F4C542]/20 border-[#152238]/20 bg-gray-50'
                                                        }`}
                                                        title={new Date(exam.thoi_gian_ket_thuc) <= new Date() ? "Kỳ thi đã kết thúc, không thể sửa" : "Sửa kỳ thi này"}
                                                    >
                                                        <Edit2 className="w-5 h-5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteExam(exam)}
                                                        className={`p-2 rounded-xl transition-all shadow-sm border flex items-center justify-center ${
                                                            Number(exam.attempt_count) > 0 
                                                            ? 'text-gray-300 border-gray-100 bg-gray-50 cursor-not-allowed opacity-60' 
                                                            : 'text-rose-500 hover:bg-rose-100 border-rose-200 bg-rose-50'
                                                        }`}
                                                        title={Number(exam.attempt_count) > 0 ? "Không thể xóa đợt thi đã có sinh viên tham gia" : "Xóa kỳ thi này"}
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {exams.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan="7" className="py-12 text-center text-gray-500">
                                                
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
                            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-[#F4C542]/20 text-[#152238] rounded-xl">
                                        <BarChart2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">Lịch sử Thi & Bảng Điểm</h3>
                                        <p className="text-sm text-gray-500 font-medium">Chọn một đợt kiểm tra để xem điểm chi tiết của sinh viên</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {exams.map(exam => (
                                    <div 
                                        key={exam.id} 
                                        onClick={() => handleViewResults(exam)}
                                        className="p-5 rounded-2xl border border-gray-200 bg-white hover:border-[#F4C542]/50 hover:shadow-lg transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <h4 className="font-bold text-gray-800 text-lg group-hover:text-[#D49A00] transition-colors line-clamp-2">{exam.tieu_de}</h4>
                                            <span className="bg-[#F4C542]/20 text-[#152238] p-2 rounded-xl"><ClipboardList className="w-5 h-5"/></span>
                                        </div>
                                        <div className="space-y-2 text-sm text-gray-600">
                                            <div className="flex items-center gap-2"><BookOpen className="w-4 h-4"/> <span className="font-medium">{exam.TenMonHoc || exam.ma_mon_hoc}</span></div>
                                            <div className="flex items-center gap-2"><Users className="w-4 h-4"/> <span>Lớp: <span className="font-bold">{exam.ma_lop_hoc_phan}</span></span></div>
                                            <div className="flex items-center gap-2"><Calendar className="w-4 h-4"/> <span>Ngày thi: {new Date(exam.thoi_gian_bat_dau).toLocaleDateString('vi-VN')}</span></div>
                                        </div>
                                    </div>
                                ))}
                                {exams.length === 0 && !loading && (
                                    <div className="col-span-full py-10 text-center text-gray-500">Chưa có dữ liệu kỳ thi nào.</div>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="details"
                            initial={{ opacity: 0, x: 20 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            exit={{ opacity: 0, x: 20 }}
                            className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
                        >
                            {/* Header Bảng điểm */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 md:p-8 border-b border-gray-100">
                                <div className="flex flex-col gap-2">
                                    <button 
                                        onClick={() => setSelectedExamForResults(null)}
                                        className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-bold mb-1 transition-colors w-max"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                        Quay lại danh sách
                                    </button>
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                                            <ClipboardList className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-extrabold text-gray-900">{selectedExamForResults.tieu_de}</h3>
                                            <p className="text-gray-500 font-medium mt-1">Lớp: <span className="font-bold text-gray-700">{selectedExamForResults.ma_lop_hoc_phan}</span> • Môn: <span className="font-bold text-gray-700">{selectedExamForResults.TenMonHoc || selectedExamForResults.ma_mon_hoc}</span></p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-blue-50 border border-blue-100 px-6 py-4 rounded-2xl text-center">
                                    <div className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">Tổng sinh viên nộp bài</div>
                                    <div className="text-3xl font-extrabold text-blue-700">{examResults.filter(r => r.trang_thai_hien_thi === 'Đã nộp bài').length}</div>
                                </div>
                            </div>

                            {/* Bảng điểm chi tiết */}
                            <div className="p-6 md:p-8">
                                {loadingResults ? (
                                    <div className="py-12 text-center text-gray-500 font-medium animate-pulse">Đang tải dữ liệu...</div>
                                ) : (
                                    <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="text-left py-4 px-6 font-bold text-gray-700">MSSV</th>
                                                    <th className="text-left py-4 px-6 font-bold text-gray-700">Họ & Tên</th>
                                                    <th className="text-center py-4 px-6 font-bold text-gray-700">Lớp</th>
                                                    <th className="text-center py-4 px-6 font-bold text-gray-700">Trạng thái</th>
                                                    <th className="text-center py-4 px-6 font-bold text-gray-700">Nộp bài lúc</th>
                                                    <th className="text-center py-4 px-6 font-bold text-gray-700">Số câu đúng</th>
                                                    <th className="text-center py-4 px-6 font-bold text-gray-700">Điểm số</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {examResults.map((result, idx) => (
                                                    <tr key={result.attempt_id || idx} className="hover:bg-blue-50/50 transition-colors">
                                                        <td className="py-4 px-6 font-bold text-gray-900">{result.mssv}</td>
                                                        <td className="py-4 px-6 text-gray-700 font-medium">{result.HoTen}</td>
                                                        <td className="py-4 px-6 text-center">
                                                            <span className="bg-[#F4C542]/20 text-[#152238] px-3 py-1 rounded-lg font-bold text-xs border border-[#F4C542]/30">
                                                                {result.MaLop}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6 text-center">
                                                            <span className={`px-3 py-1 rounded-full font-bold text-xs ${result.trang_thai_hien_thi === 'Đã nộp bài' ? 'bg-blue-100 text-blue-700' : result.trang_thai_hien_thi === 'Chưa nộp bài' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                                {result.trang_thai_hien_thi}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6 text-center text-sm text-gray-500">
                                                            {result.thoi_gian_nop_bai ? new Date(result.thoi_gian_nop_bai).toLocaleString('vi-VN') : '-'}
                                                        </td>
                                                        <td className="py-4 px-6 text-center">
                                                            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg font-bold text-sm">
                                                                {result.so_cau_dung} / {Number(result.so_cau_dung || 0) + Number(result.so_cau_sai || 0)}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6 text-center">
                                                            <span className={`font-extrabold text-lg ${result.diem_so >= 5 ? 'text-blue-600' : 'text-rose-600'}`}>
                                                                {Math.round((Number(result.diem_so) + Number.EPSILON) * 100) / 100}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {examResults.length === 0 && (
                                                    <tr>
                                                        <td colSpan="6" className="py-12 text-center text-gray-500">Chưa có sinh viên nào nộp bài.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
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
                            <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-extrabold text-[#D49A00]">Tạo Đợt Kiểm Tra Mới</h3>
                                    <p className="text-sm text-gray-700 font-medium mt-1">Hệ thống sẽ tạo ra 1 cột điểm độc lập cho đợt thi này</p>
                                </div>
                                <button 
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setFormData(initialFormData);
                                        setSubmitErrors({});
                                    }} 
                                    className="p-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-full transition-colors"
                                >
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                                <form id="exam-form" onSubmit={handleSubmit} noValidate className="space-y-6">
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
                                            <select required value={formData.ma_lop_hoc_phan} onChange={e => setFormData({...formData, ma_lop_hoc_phan: e.target.value, bank_id: ''})} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white font-medium">
                                                <option value="">-- Chọn Lớp HP --</option>
                                                {classes.filter(c => c.MaMonHoc === formData.ma_mon_hoc).map(c => <option key={c.MaLopHocPhan} value={c.MaLopHocPhan}>{c.TenMonHoc} ({c.MaLopHocPhan})</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* NÂNG CẤP: CHỌN ĐÚNG NGÂN HÀNG ĐỀ THEO LỚP HP HỌC HOẶC ĐỀ CHUNG */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Chọn Ngân hàng đề để bốc câu hỏi <span className="text-rose-500">*</span></label>
                                        <select required value={formData.bank_id} onChange={e => setFormData({...formData, bank_id: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white font-medium text-gray-800">
                                            <option value="">-- Chọn bộ đề thi (Vui lòng chọn môn học trước) --</option>
                                            {banks.filter(b => isBankAvailableForClass(b, formData.ma_mon_hoc, formData.ma_lop_hoc_phan)).map(b => (
                                                <option key={b.id} value={b.id}>{b.tieu_de} (Có {b.tong_so_cau} câu)</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Tiêu đề đợt thi <span className="text-rose-500">*</span></label>
                                        <input type="text" required
                                            value={formData.tieu_de}
                                            onChange={e => {
                                                setFormData({...formData, tieu_de: e.target.value});
                                                setSubmitErrors(prev => ({ ...prev, tieu_de: undefined }));
                                            }}
                                            placeholder="VD: Kiểm tra giữa kỳ môn Cơ sở dữ liệu"
                                            className={`w-full p-3.5 bg-gray-50 border ${submitErrors.tieu_de ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-purple-500'} rounded-xl font-medium text-gray-800 focus:bg-white focus:ring-2`} />
                                        {submitErrors.tieu_de && (
                                            <div className="mt-1 flex items-center gap-1 text-sm text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                                                <span className="font-medium">{submitErrors.tieu_de}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Mở phòng thi (Bắt đầu) <span className="text-rose-500">*</span></label>
                                            <VNDateTimePicker 
                                                value={formData.thoi_gian_bat_dau}
                                                onChange={val => setFormData({...formData, thoi_gian_bat_dau: val})}
                                                defaultTime="08:00"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Đóng phòng thi (Kết thúc) <span className="text-rose-500">*</span></label>
                                            <VNDateTimePicker 
                                                value={formData.thoi_gian_ket_thuc}
                                                onChange={val => setFormData({...formData, thoi_gian_ket_thuc: val})}
                                                defaultTime="17:00"
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-5">
                                        <div className="flex flex-col border-b border-gray-200 pb-4">
                                            <h4 className="font-extrabold text-[#152238] flex items-center gap-2"> Cấu trúc đề thi</h4>
                                            {selectedBankInfo && (
                                                <span className="text-sm font-semibold text-rose-600 mt-1">
                                                    * Ngân hàng đề hiện có tối đa {maxAvailableQuestions} câu.
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Tổng số câu hỏi <span className="text-rose-500">*</span></label>
                                                <input type="number" required
                                                    value={formData.tong_so_cau}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        setFormData({...formData, tong_so_cau: val});
                                                        if (val !== '') {
                                                            const numVal = Number(val);
                                                            if (numVal < 0 || !Number.isInteger(numVal)) {
                                                                setSubmitErrors(prev => ({ ...prev, tong_so_cau: 'Không được nhập số thập phân hoặc số âm!' }));
                                                            } else {
                                                                setSubmitErrors(prev => ({ ...prev, tong_so_cau: undefined }));
                                                            }
                                                        } else {
                                                            setSubmitErrors(prev => ({ ...prev, tong_so_cau: undefined }));
                                                        }
                                                    }}
                                                    onBlur={e => setFormData({...formData, tong_so_cau: Number(formData.tong_so_cau) || 0})}
                                                    className={`w-full p-3.5 bg-white border ${submitErrors.tong_so_cau ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-purple-500'} rounded-xl font-medium text-gray-800 focus:ring-2`} />
                                                {submitErrors.tong_so_cau && (
                                                    <div className="mt-1 flex items-center gap-1 text-sm text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                                                        <span className="font-medium">{submitErrors.tong_so_cau}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Thời gian (phút) <span className="text-rose-500">*</span></label>
                                                <input type="number" required
                                                    value={formData.thoi_gian_thi_phut}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        setFormData({...formData, thoi_gian_thi_phut: val});
                                                        if (val !== '') {
                                                            const numVal = Number(val);
                                                            if (numVal < 0 || !Number.isInteger(numVal)) {
                                                                setSubmitErrors(prev => ({ ...prev, thoi_gian_thi_phut: 'Không được nhập số thập phân hoặc số âm!' }));
                                                            } else {
                                                                setSubmitErrors(prev => ({ ...prev, thoi_gian_thi_phut: undefined }));
                                                            }
                                                        } else {
                                                            setSubmitErrors(prev => ({ ...prev, thoi_gian_thi_phut: undefined }));
                                                        }
                                                    }}
                                                    onBlur={e => setFormData({...formData, thoi_gian_thi_phut: Number(formData.thoi_gian_thi_phut) || 0})}
                                                    className={`w-full p-3.5 bg-white border ${submitErrors.thoi_gian_thi_phut ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-purple-500'} rounded-xl font-medium text-gray-800 focus:ring-2`} />
                                                {submitErrors.thoi_gian_thi_phut && (
                                                    <div className="mt-1 flex items-center gap-1 text-sm text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                                                        <span className="font-medium">{submitErrors.thoi_gian_thi_phut}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                        <span>Lưu ý: Mỗi sinh viên của lớp chỉ được phép làm và nộp bài 1 lần duy nhất trong đợt kiểm tra này.</span>
                                    </div>
                                </form>
                            </div>
                            <div className="p-5 border-t bg-gray-50 flex gap-4 shrink-0">
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setFormData(initialFormData);
                                        setSubmitErrors({});
                                    }} 
                                    className="flex-1 py-3.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-all"
                                >
                                    Hủy bỏ
                                </button>
                                <button 
                                    type="submit" 
                                    form="exam-form" 
                                    className="flex-1 py-3.5 bg-[#F4C542] hover:bg-[#e3b637] text-[#152238] font-extrabold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5"
                                >
                                    Tạo Kỳ Thi
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </ModalPortal>
            )}
            {/* MODAL SỬA KỲ THI */}
            {showEditModal && editExamData && (
                <ModalPortal>
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white rounded-3xl w-full max-w-3xl h-[85vh] flex flex-col shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-extrabold text-[#152238]">Sửa Đợt Kiểm Tra</h3>
                                    <p className="text-sm text-gray-700 font-medium mt-1">Chỉnh sửa thông tin kỳ thi (Thời gian, tiêu đề)</p>
                                </div>
                                <button onClick={() => setShowEditModal(false)} className="p-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-full">
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </div>
                            
                            {Number(editExamData.attempt_count) > 0 && (
                                <div className="mx-6 mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-start gap-3 shadow-sm">
                                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold">Đợt thi đã có sinh viên tham gia.</p>
                                        <p className="text-sm mt-0.5">Bạn không thể thay đổi thời gian làm bài và giờ mở phòng.</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                                <form id="edit-exam-form" onSubmit={handleUpdateSubmit} noValidate className="space-y-6">
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Tiêu đề đợt thi</label>
                                        <input type="text" required
                                            value={editExamData.tieu_de}
                                            onChange={e => {
                                                setEditExamData({...editExamData, tieu_de: e.target.value});
                                                setSubmitErrors(prev => ({ ...prev, tieu_de: undefined }));
                                            }}
                                            className={`w-full p-3.5 bg-gray-50 border ${submitErrors.tieu_de ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-purple-500'} rounded-xl font-medium focus:bg-white focus:ring-2`} />
                                        {submitErrors.tieu_de && <div className="mt-1 text-sm text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">{submitErrors.tieu_de}</div>}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Mở phòng thi (Bắt đầu) <span className="text-rose-500">*</span></label>
                                            <VNDateTimePicker 
                                                value={editExamData.thoi_gian_bat_dau}
                                                disabled={Number(editExamData.attempt_count) > 0}
                                                hasError={!!submitErrors.thoi_gian_bat_dau}
                                                onChange={val => {
                                                    setEditExamData({...editExamData, thoi_gian_bat_dau: val});
                                                    setSubmitErrors(prev => ({ ...prev, thoi_gian_bat_dau: undefined }));
                                                }}
                                                defaultTime="08:00"
                                            />
                                            {submitErrors.thoi_gian_bat_dau && <div className="mt-1 text-sm text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">{submitErrors.thoi_gian_bat_dau}</div>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Đóng phòng thi (Kết thúc) <span className="text-rose-500">*</span></label>
                                            <VNDateTimePicker 
                                                value={editExamData.thoi_gian_ket_thuc}
                                                hasError={!!submitErrors.thoi_gian_ket_thuc}
                                                onChange={val => {
                                                    setEditExamData({...editExamData, thoi_gian_ket_thuc: val});
                                                    setSubmitErrors(prev => ({ ...prev, thoi_gian_ket_thuc: undefined }));
                                                }}
                                                defaultTime="17:00"
                                            />
                                            {submitErrors.thoi_gian_ket_thuc && <div className="mt-1 text-sm text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">{submitErrors.thoi_gian_ket_thuc}</div>}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Thời gian làm bài (phút) <span className="text-rose-500">*</span></label>
                                        <input type="number" required
                                            value={editExamData.thoi_gian_thi_phut}
                                            disabled={Number(editExamData.attempt_count) > 0}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setEditExamData({...editExamData, thoi_gian_thi_phut: val});
                                                if (val !== '') {
                                                    const numVal = Number(val);
                                                    if (numVal < 0 || !Number.isInteger(numVal)) {
                                                        setSubmitErrors(prev => ({ ...prev, thoi_gian_thi_phut: 'Không được nhập số thập phân hoặc số âm!' }));
                                                    } else {
                                                        setSubmitErrors(prev => ({ ...prev, thoi_gian_thi_phut: undefined }));
                                                    }
                                                }
                                            }}
                                            className={`w-full p-3.5 bg-gray-50 border ${submitErrors.thoi_gian_thi_phut ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-purple-500'} rounded-xl font-medium text-gray-800 focus:bg-white focus:ring-2 ${Number(editExamData.attempt_count) > 0 ? 'opacity-60 cursor-not-allowed' : ''}`} />
                                        {submitErrors.thoi_gian_thi_phut && <div className="mt-1 text-sm text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">{submitErrors.thoi_gian_thi_phut}</div>}
                                    </div>
                                </form>
                            </div>
                            <div className="p-5 border-t bg-gray-50 flex gap-4 shrink-0">
                                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-3.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-all">Hủy bỏ</button>
                                <button type="submit" form="edit-exam-form" className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5">Lưu Thay Đổi</button>
                            </div>
                        </motion.div>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
}

export default ExamManagement;