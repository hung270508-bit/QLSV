import { Award, Clock, PlayCircle, AlertTriangle, CheckCircle, History, BookOpen, XCircle, X, Flag, FlagOff, Trash2, Edit2, Upload, Download, Calendar, Settings, FileText, Eye, AlertCircle, ChevronDown, Search, Filter, Plus, Check, Info, Camera, Edit, CheckCircle2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import axios from 'axios';
import API_URL from '../../api';
import ModalPortal, { Toast, ConfirmDialog } from '../common/ModalPortal';

function StudentOnlineExam({ user }) {
    const mssv = user?.username || user?.MSSV || user?.id || 'SV000016';
    const [activeTab, setActiveTab] = useState('exams');
    const [exams, setExams] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isTakingExam, setIsTakingExam] = useState(false);
    const [currentExam, setCurrentExam] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [attemptId, setAttemptId] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [flaggedQuestions, setFlaggedQuestions] = useState({});
    
    const [reviewData, setReviewData] = useState(null);
    const [resultModalData, setResultModalData] = useState(null);

    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const showToast = (message, type = 'success') => { setToast({ show: true, message, type }); setTimeout(() => setToast({ show: false }), 3000); };
    const [confirmDialog, setConfirmDialog] = useState({ show: false, title: '', message: '', action: null });

    useEffect(() => {
        if (!isTakingExam) {
            if (activeTab === 'exams') fetchExams();
            else fetchHistory();
        }
    }, [isTakingExam, activeTab]);

    useEffect(() => {
        let timer;
        if (isTakingExam && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
        } else if (isTakingExam && timeLeft === 0) {
            // Auto submit when time's up
            handleAutoSubmit();
        }
        return () => clearInterval(timer);
    }, [isTakingExam, timeLeft]);

    const fetchExams = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/api/ai-exams/exams/student/${mssv}`);
            setExams(res.data);
        } catch (error) {
            console.error('Error fetching exams:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/api/ai-exams/exams/history/student/${mssv}`);
            setHistory(res.data.data || []);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReviewExam = async (attempt_id) => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/api/ai-exams/attempts/${attempt_id}/details`);
            if (res.data.success) {
                setReviewData(res.data.data);
            }
        } catch (error) {
            showToast('Không thể tải chi tiết bài thi!', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleStartExam = async (exam) => {
        if (exam.is_submitted > 0) {
            showToast('Bạn đã làm bài thi này rồi!', 'error');
            return;
        }
        const now = new Date();
        if (now < new Date(exam.thoi_gian_bat_dau)) {
            return showToast('Chưa tới giờ thi!', 'error');
        }
        
        setConfirmDialog({
            show: true,
            title: 'Bắt đầu làm bài',
            message: `Bạn chuẩn bị làm bài thi: ${exam.tieu_de}. Thời gian làm bài là ${exam.thoi_gian_thi_phut} phút. Trong quá trình làm bài tuyệt đối không tải lại trang. Bạn đã sẵn sàng?`,
            action: async () => {
                setConfirmDialog({ show: false, action: null });
                try {
                    const res = await axios.post(`${API_URL}/api/ai-exams/exams/${exam.id}/start`, { mssv });
                    setCurrentExam(exam);
                    setQuestions(res.data.questions);
                    setAttemptId(res.data.attempt_id);
                    setTimeLeft(res.data.duration * 60);
                    setAnswers({});
                    setIsTakingExam(true);
                } catch (error) {
                    showToast(error.response?.data?.message || 'Lỗi khi vào phòng thi!', 'error');
                }
            }
        });
    };

    const handleSelectOption = (qId, oId) => {
        setAnswers({ ...answers, [qId]: oId });
        // Optional: Call sync auto-save API here
    };

    const submitExamAPI = async () => {
        const answersArray = questions.map(q => ({
            question_id: q.id,
            selected_option_id: answers[q.id] || null
        }));
        
        try {
            const res = await axios.post(`${API_URL}/api/ai-exams/exams/submit`, {
                attempt_id: attemptId,
                answers: answersArray
            });
            setIsTakingExam(false);
            setResultModalData({
                score: res.data.score,
                correct: res.data.correct,
                total: res.data.total
            });
        } catch (error) {
            showToast('Lỗi khi nộp bài!', 'error');
        }
    };

    const handleManualSubmit = () => {
        const answeredCount = Object.keys(answers).length;
        const totalCount = questions.length;
        const unansweredCount = totalCount - answeredCount;

        if (unansweredCount > 0) {
            setConfirmDialog({
                show: true,
                title: 'Chưa hoàn thành bài thi',
                message: `Bạn còn ${unansweredCount} câu chưa điền đáp án. Bạn có chắc chắn muốn nộp bài sớm không?`,
                action: () => {
                    setConfirmDialog({ show: false, action: null });
                    submitExamAPI();
                }
            });
        } else {
            setConfirmDialog({
                show: true,
                title: 'Nộp bài thi',
                message: 'Bạn đã chọn đủ đáp án. Bạn có chắc chắn muốn nộp bài? Sau khi nộp sẽ không thể thay đổi.',
                action: () => {
                    setConfirmDialog({ show: false, action: null });
                    submitExamAPI();
                }
            });
        }
    };

    const handleAutoSubmit = () => {
        showToast('Đã hết giờ làm bài! Hệ thống đang tự động nộp bài...', 'error');
        submitExamAPI();
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (isTakingExam) {
        const answeredCount = Object.keys(answers).length;
        const totalCount = questions.length;
        const flaggedCount = Object.keys(flaggedQuestions).filter(k => flaggedQuestions[k]).length;
        const unansweredCount = totalCount - answeredCount;
        const progressPercent = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

        const scrollToQuestion = (index) => {
            const el = document.getElementById(`question-${index}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        };

        const toggleFlag = (qId) => {
            setFlaggedQuestions(prev => ({ ...prev, [qId]: !prev[qId] }));
        };

        return (
            <div className="fixed inset-0 z-50 bg-[#F4F7FE] overflow-y-auto flex flex-col font-sans">
                <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
                <ConfirmDialog show={confirmDialog.show} title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.action} onCancel={() => setConfirmDialog({ show: false, action: null })} />

                {/* Top Navigation Bar */}
                <div className="bg-white shadow-sm px-6 py-4 sticky top-0 z-20 flex justify-between items-center border-b border-gray-200">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#F4C542]/20 rounded-full flex items-center justify-center text-[#152238] font-bold">
                            {currentExam?.TenMonHoc?.[0] || 'M'}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">{currentExam?.tieu_de}</h2>
                            <p className="text-xs text-gray-500">Chung - {totalCount} câu hỏi - {currentExam?.thoi_gian_thi_phut} phút</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className={`flex items-center gap-2 font-mono text-2xl font-black px-4 py-2 rounded-xl border ${timeLeft < 300 ? 'text-red-600 border-red-200 bg-red-50 animate-pulse' : 'text-[#152238] border-indigo-100 bg-[#F4C542]/10'}`}>
                            
                            {formatTime(timeLeft)}
                        </div>
                        <div className="text-sm font-bold text-gray-500 bg-gray-100 px-4 py-2 rounded-xl">
                            {answeredCount}/{totalCount} đã trả lời
                        </div>
                        <button onClick={handleManualSubmit} className="px-6 py-2.5 bg-[#152238] hover:bg-[#152238]/90 text-white font-bold rounded-xl shadow-md transition-all active:scale-95">Nộp bài thi</button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 max-w-7xl mx-auto w-full p-6 flex flex-col lg:flex-row gap-6 relative">
                    
                    {/* Left Column - Questions List */}
                    <div className="flex-1 space-y-6 lg:pb-32">
                        {questions.map((q, index) => {
                            const isFlagged = flaggedQuestions[q.id];
                            return (
                                <div id={`question-${index}`} key={q.id} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 relative">
                                    <button 
                                        onClick={() => toggleFlag(q.id)}
                                        className={`absolute top-6 right-6 p-2 rounded-lg transition-colors ${isFlagged ? 'bg-orange-100 text-orange-500' : 'bg-gray-50 text-gray-300 hover:bg-gray-100 hover:text-gray-500'}`}
                                        title={isFlagged ? 'Bỏ đánh dấu' : 'Đánh dấu xem lại'}
                                    >
                                        <Flag size={20} className={isFlagged ? 'fill-current' : ''} />
                                    </button>

                                    <div className="flex gap-4 mb-6 pr-10">
                                        <div className="w-10 h-10 shrink-0 bg-[#152238] text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md">
                                            {index + 1}
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-800 leading-relaxed pt-1">
                                            {q.noi_dung}
                                        </h3>
                                    </div>

                                    <div className="space-y-3 pl-14">
                                        {q.options?.map((opt, oIdx) => {
                                            const isSelected = answers[q.id] === opt.id;
                                            const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
                                            const label = optionLabels[oIdx] || '';
                                            return (
                                                <div 
                                                    key={opt.id} 
                                                    onClick={() => handleSelectOption(q.id, opt.id)} 
                                                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all flex items-center justify-between group ${isSelected ? 'border-[#F4C542] bg-[#F4C542] text-[#152238] shadow-md font-semibold' : 'border-gray-200 hover:border-[#152238]/50 bg-white text-gray-700 hover:bg-[#F4C542]/10'}`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <span className={`font-bold ${isSelected ? 'text-[#152238]' : 'text-gray-500 group-hover:text-indigo-500'}`}>{label}.</span>
                                                        <span className="font-medium">{opt.text || opt.noi_dung}</span>
                                                    </div>
                                                    
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="w-full lg:w-[320px] shrink-0">
                        <div className="sticky top-[104px] space-y-6">
                            
                            {/* Progress Box */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                                <h4 className="font-extrabold text-gray-800 mb-6 flex items-center gap-2">
                                    <div className="w-1 h-5 bg-[#152238] rounded-full" />
                                    Tiến độ làm bài
                                </h4>
                                <div className="flex items-center gap-6 mb-6">
                                    {/* Progress Circle using SVG */}
                                    <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                            <path className="text-gray-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                            <path className="text-[#152238] transition-all duration-500" strokeDasharray={`${progressPercent}, 100`} strokeWidth="3" stroke="currentColor" fill="none" strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-2xl font-black text-gray-800">{answeredCount}</span>
                                            <span className="text-xs text-gray-400 font-bold border-t border-gray-200 w-8 text-center pt-0.5">/{totalCount}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center justify-between text-sm font-bold">
                                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#152238]" /> <span className="text-gray-600">Đã trả lời</span></div>
                                            <span className="text-[#152238]">{answeredCount}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm font-bold">
                                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500" /> <span className="text-gray-600">Đánh dấu</span></div>
                                            <span className="text-orange-500">{flaggedCount}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm font-bold">
                                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-gray-200" /> <span className="text-gray-600">Chưa làm</span></div>
                                            <span className="text-gray-500">{unansweredCount}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                                    <div className="bg-[#152238] h-1.5 rounded-full transition-all" style={{ width: `${progressPercent}%` }}></div>
                                </div>
                                <p className="text-right text-xs font-bold text-gray-400">{progressPercent}% hoàn thành</p>
                            </div>

                            {/* Question Grid Box */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
                                <h4 className="font-extrabold text-gray-800 mb-6 flex items-center gap-2">
                                    <div className="w-1 h-5 bg-[#152238] rounded-full" />
                                    Bảng câu hỏi
                                </h4>
                                <div className="grid grid-cols-5 gap-2 mb-6">
                                    {questions.map((q, index) => {
                                        const isAnswered = !!answers[q.id];
                                        const isFlagged = flaggedQuestions[q.id];
                                        
                                        let btnClass = "bg-white border-gray-200 text-gray-600 hover:border-[#152238]/50";
                                        if (isAnswered) btnClass = "bg-[#152238] border-[#152238] text-white font-bold shadow-sm";
                                        if (isFlagged) btnClass = "bg-orange-500 border-orange-500 text-white font-bold shadow-sm";

                                        return (
                                            <button
                                                key={q.id}
                                                onClick={() => scrollToQuestion(index)}
                                                className={`w-full aspect-square flex items-center justify-center rounded-xl border-2 transition-all ${btnClass}`}
                                            >
                                                {index + 1}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="flex items-center justify-center gap-4 text-xs font-bold text-gray-500 mb-6">
                                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-[#152238] rounded-sm" /> Đã trả lời</div>
                                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-orange-500 rounded-sm" /> Đánh dấu</div>
                                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-white border border-gray-300 rounded-sm" /> Chưa làm</div>
                                </div>
                                <button onClick={handleManualSubmit} className="w-full py-3.5 bg-[#152238] hover:bg-[#152238]/90 text-white font-black rounded-xl shadow-md transition-all active:scale-95">
                                    Nộp bài ({answeredCount}/{totalCount})
                                </button>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-4 max-w-screen-3xl mx-auto w-full">
            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
            <ConfirmDialog show={confirmDialog.show} title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.action} onCancel={() => setConfirmDialog({ show: false, action: null })} />

            {/* HEADER & TABS */}
            <div className="bg-[#F4C542] rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold mb-2 text-[#152238]">Kỳ thi Online</h2>
                    <p className="text-[#152238]/80 text-sm font-medium">Danh sách các kỳ thi & lịch sử làm bài</p>
                </div>
                
                <div className="flex bg-[#152238]/10 p-1.5 rounded-2xl">
                    <button 
                        onClick={() => setActiveTab('exams')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'exams' ? 'bg-[#152238] text-white shadow-lg' : 'text-[#152238]/70 hover:text-[#152238] hover:bg-white/50'}`}
                    >
                        Kỳ thi trực tuyến
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'history' ? 'bg-[#152238] text-white shadow-lg' : 'text-[#152238]/70 hover:text-[#152238] hover:bg-white/50'}`}
                    >
                        Lịch sử làm bài
                    </button>
                </div>
            </div>

            {activeTab === 'exams' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {exams.map(exam => {
                            const now = new Date();
                            const isOngoing = now >= new Date(exam.thoi_gian_bat_dau) && now <= new Date(exam.thoi_gian_ket_thuc);
                            const isUpcoming = now < new Date(exam.thoi_gian_bat_dau);
                            
                            return (
                                <div key={exam.id} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 flex flex-col h-full hover:shadow-xl transition-shadow">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${isOngoing ? 'bg-green-100 text-green-700' : isUpcoming ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {isOngoing ? 'Đang diễn ra' : isUpcoming ? 'Sắp diễn ra' : 'Đã kết thúc'}
                                        </span>
                                        <span className="font-bold text-gray-400 text-sm">Lớp HP: {exam.ma_lop_hoc_phan}</span>
                                    </div>
                                    
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">{exam.tieu_de}</h3>
                                    <p className="text-[#152238] font-semibold mb-6">{exam.TenMonHoc}</p>

                                    <div className="space-y-3 mb-8 flex-1">
                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            
                                            <span>Thời gian làm bài: <strong className="text-gray-800">{exam.thoi_gian_thi_phut} phút</strong></span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            
                                            <span>Mở: {new Date(exam.thoi_gian_bat_dau).toLocaleString('vi-VN')}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            
                                            <span>Đóng: {new Date(exam.thoi_gian_ket_thuc).toLocaleString('vi-VN')}</span>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => handleStartExam(exam)}
                                        disabled={(!isOngoing && !isUpcoming) || exam.is_submitted > 0} 
                                        className={`w-full py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all ${isOngoing && !exam.is_submitted ? 'bg-[#152238] hover:bg-[#152238]/90 text-white shadow-md' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                    >
                                         {exam.is_submitted > 0 ? 'Đã hoàn thành' : (isOngoing ? 'Vào phòng thi' : isUpcoming ? 'Chưa mở' : 'Đã khóa')}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                    
                    {exams.length === 0 && !loading && (
                        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                            
                            <p className="text-xl font-bold text-gray-500">Chưa có kỳ thi nào dành cho bạn.</p>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'history' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {history.map(item => (
                            <div key={item.attempt_id} 
                                onClick={() => handleReviewExam(item.attempt_id)}
                                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col h-full hover:shadow-xl hover:border-[#152238]/50 cursor-pointer transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#F4C542]/100 transform origin-left scale-y-0 group-hover:scale-y-100 transition-transform duration-300 ease-out" />
                                
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-[#F4C542]/20 text-[#152238] rounded-xl">
                                        
                                    </div>
                                    <span className="bg-green-100 text-green-700 font-black px-4 py-1.5 rounded-lg text-lg shadow-sm border border-green-200">
                                        {Number(item.diem_so).toFixed(2)} điểm
                                    </span>
                                </div>
                                
                                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#152238] transition-colors line-clamp-2">
                                    {item.tieu_de}
                                </h3>
                                <p className="text-gray-500 font-semibold mb-6 text-sm">{item.TenMonHoc}</p>

                                <div className="mt-auto pt-4 border-t border-gray-100 flex flex-col gap-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500 font-medium flex items-center gap-2"> Nộp lúc:</span>
                                        <span className="font-bold text-gray-800">{new Date(item.thoi_gian_nop_bai).toLocaleString('vi-VN')}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {history.length === 0 && !loading && (
                        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                            
                            <p className="text-xl font-bold text-gray-500">Bạn chưa làm bài kiểm tra nào.</p>
                        </div>
                    )}
                </>
            )}

            {/* MODAL XEM LẠI BÀI */}
            <AnimatePresence>
                {reviewData && (
                    <ModalPortal>
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                            <motion.div 
                                initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="bg-white rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden"
                            >
                                <div className="p-6 md:p-8 border-b bg-gray-50 flex justify-between items-center shrink-0">
                                    <div>
                                        <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Xem Lại Bài Thi: <span className="text-[#152238]">{reviewData.attempt.tieu_de}</span></h3>
                                        <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                                            <span className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 shadow-sm flex items-center gap-2">
                                                 Nộp lúc: {new Date(reviewData.attempt.thoi_gian_nop_bai).toLocaleString('vi-VN')}
                                            </span>
                                            <span className="bg-green-100 border border-green-200 px-4 py-1.5 rounded-lg text-green-700 shadow-sm font-black text-lg flex items-center gap-2">
                                                 Tổng điểm: {Number(reviewData.attempt.diem_so).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setReviewData(null)} 
                                        className="p-3 bg-white border border-gray-200 text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 rounded-xl transition-all shadow-sm"
                                    >
                                        
                                    </button>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50 space-y-8">
                                    {reviewData.answers.map((ans, index) => {
                                        const isRight = ans.is_correct === 1;
                                        return (
                                            <div key={`${ans.question_id}-${index}`} className={`bg-white p-6 rounded-2xl shadow-sm border-2 ${isRight ? 'border-green-400' : 'border-red-400'}`}>
                                                <div className="flex items-start justify-between mb-6 gap-4">
                                                    <h4 className="text-lg font-bold text-gray-800 flex-1">
                                                        <span className="text-gray-500 mr-2">Câu {index + 1}:</span>
                                                        {ans.question_content}
                                                    </h4>
                                                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 shrink-0 ${isRight ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        
                                                        {isRight ? 'Đúng' : 'Sai'}
                                                    </span>
                                                </div>
                                                
                                                <div className="space-y-3">
                                                    {ans.options?.map((opt) => {
                                                        const isSelected = ans.selected_option_id === opt.id;
                                                        const isCorrectOpt = opt.la_dap_an_dung === 1;
                                                        
                                                        let optClass = "border-gray-200 text-gray-600 bg-white";
                                                        let icon = null;
                                                        
                                                        if (isCorrectOpt) {
                                                            optClass = "border-green-500 bg-green-50 text-green-800 font-bold shadow-sm";
                                                        } else if (isSelected && !isCorrectOpt) {
                                                            optClass = "border-red-500 bg-red-50 text-red-800 font-bold shadow-sm";
                                                        } else if (isSelected && isCorrectOpt) {
                                                            optClass = "border-green-500 bg-green-50 text-green-800 font-bold shadow-sm";
                                                        }

                                                        return (
                                                            <div key={opt.id} className={`p-4 border-2 rounded-xl flex items-center justify-between ${optClass}`}>
                                                                <span className="flex-1 pr-4">{opt.noi_dung}</span>
                                                                {icon && <div className="shrink-0">{icon}</div>}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        </div>
                    </ModalPortal>
                )}

                {resultModalData && (
                    <ModalPortal>
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100"
                            >
                                <div className="p-8 pb-6 text-center relative overflow-hidden">
                                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#F4C542]/20 to-transparent"></div>
                                    <div className="relative">
                                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-5 shadow-xl border-4 border-[#F4C542]">
                                            <CheckCircle className="w-10 h-10 text-[#F4C542]" />
                                        </div>
                                        <h3 className="text-2xl font-black text-[#152238] mb-2">Nộp Bài Thành Công!</h3>
                                        <p className="text-gray-500 font-medium">Hệ thống đã ghi nhận kết quả bài làm của bạn.</p>
                                    </div>
                                </div>
                                
                                <div className="px-8 pb-8 space-y-6 relative">
                                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col items-center justify-center">
                                        <span className="text-gray-400 font-bold mb-1 uppercase text-xs tracking-widest">Tổng Điểm</span>
                                        <div className="text-5xl font-black text-[#152238]">
                                            {resultModalData.score ? resultModalData.score.toFixed(2) : '0.00'}
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-green-50/50 p-4 rounded-2xl flex flex-col items-center border border-green-100">
                                            <span className="text-green-600 font-black text-3xl mb-1">{resultModalData.correct || 0}</span>
                                            <span className="text-green-700 text-xs font-bold uppercase tracking-wider">Câu Đúng</span>
                                        </div>
                                        <div className="bg-red-50/50 p-4 rounded-2xl flex flex-col items-center border border-red-100">
                                            <span className="text-red-600 font-black text-3xl mb-1">{(resultModalData.total || 0) - (resultModalData.correct || 0)}</span>
                                            <span className="text-red-700 text-xs font-bold uppercase tracking-wider">Câu Sai</span>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => {
                                            setIsTakingExam(false);
                                            setResultModalData(null);
                                            setActiveTab('history');
                                            fetchHistory();
                                        }}
                                        className="w-full py-4 bg-[#152238] hover:bg-[#152238]/90 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 text-lg"
                                    >
                                        Đóng & Xem Lịch Sử
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </ModalPortal>
                )}
            </AnimatePresence>
        </div>
    );
}

export default StudentOnlineExam;
