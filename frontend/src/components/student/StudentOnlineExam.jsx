import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Clock, PlayCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import API_URL from '../../api';
import ModalPortal, { Toast, ConfirmDialog } from '../common/ModalPortal';

function StudentOnlineExam({ user }) {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isTakingExam, setIsTakingExam] = useState(false);
    const [currentExam, setCurrentExam] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [attemptId, setAttemptId] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);

    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const showToast = (message, type = 'success') => { setToast({ show: true, message, type }); setTimeout(() => setToast({ show: false }), 3000); };
    const [confirmDialog, setConfirmDialog] = useState({ show: false, title: '', message: '', action: null });

    useEffect(() => {
        if (!isTakingExam) {
            fetchExams();
        }
    }, [isTakingExam]);

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
            const res = await axios.get(`${API_URL}/api/ai-exams/exams/student/${user.MSSV}`);
            setExams(res.data);
        } catch (error) {
            console.error('Error fetching exams:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartExam = async (exam) => {
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
                    const res = await axios.post(`${API_URL}/api/ai-exams/exams/${exam.id}/start`, { mssv: user.MSSV });
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
            showToast(`Đã nộp bài thành công! Điểm của bạn: ${res.data.score.toFixed(2)}`, 'success');
        } catch (error) {
            showToast('Lỗi khi nộp bài!', 'error');
        }
    };

    const handleManualSubmit = () => {
        setConfirmDialog({
            show: true,
            title: 'Nộp bài thi',
            message: 'Bạn có chắc chắn muốn nộp bài? Sau khi nộp sẽ không thể thay đổi.',
            action: () => {
                setConfirmDialog({ show: false, action: null });
                submitExamAPI();
            }
        });
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
        return (
            <div className="fixed inset-0 z-50 bg-gray-50 overflow-y-auto flex flex-col">
                <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
                <ConfirmDialog show={confirmDialog.show} title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.action} onCancel={() => setConfirmDialog({ show: false, action: null })} />

                <div className="bg-white shadow-md p-4 sticky top-0 z-10 flex justify-between items-center border-b-2 border-indigo-500">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">{currentExam?.tieu_de}</h2>
                        <p className="text-sm text-gray-500">Môn: {currentExam?.TenMonHoc}</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className={`flex items-center gap-2 font-mono text-3xl font-black ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-indigo-600'}`}>
                            <Clock className="w-8 h-8" />
                            {formatTime(timeLeft)}
                        </div>
                        <button onClick={handleManualSubmit} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg">Nộp bài</button>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto w-full p-6 space-y-8 my-8">
                    {questions.map((q, index) => (
                        <div key={q.id} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                            <h3 className="text-xl font-bold mb-6 flex gap-3 text-gray-800">
                                <span className="text-indigo-600 flex-shrink-0">Câu {index + 1}.</span>
                                <span>{q.noi_dung}</span>
                            </h3>
                            <div className="space-y-3">
                                {q.options?.map((opt, oIdx) => {
                                    const isSelected = answers[q.id] === opt.id;
                                    return (
                                        <div 
                                            key={opt.id} 
                                            onClick={() => handleSelectOption(q.id, opt.id)} 
                                            className={`p-4 border-2 rounded-xl cursor-pointer transition-all flex items-center gap-4 ${isSelected ? 'border-indigo-500 bg-indigo-50 text-indigo-900 font-bold' : 'border-gray-200 hover:border-indigo-300 text-gray-700'}`}
                                        >
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-indigo-600' : 'border-gray-400'}`}>
                                                {isSelected && <div className="w-3 h-3 bg-indigo-600 rounded-full" />}
                                            </div>
                                            <span>{opt.text || opt.noi_dung}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-4 max-w-screen-3xl mx-auto w-full">
            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
            <ConfirmDialog show={confirmDialog.show} title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.action} onCancel={() => setConfirmDialog({ show: false, action: null })} />

            <div className="bg-[#152238] rounded-2xl p-8 shadow-xl text-white">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-indigo-500/20 rounded-2xl">
                        <Award className="w-10 h-10 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold mb-2">Kỳ thi Online</h2>
                        <p className="text-gray-300 text-lg">Danh sách các kỳ thi bạn được phép tham gia</p>
                    </div>
                </div>
            </div>

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
                            <p className="text-indigo-600 font-semibold mb-6">{exam.TenMonHoc}</p>

                            <div className="space-y-3 mb-8 flex-1">
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Clock className="w-5 h-5 text-gray-400" />
                                    <span>Thời gian làm bài: <strong className="text-gray-800">{exam.thoi_gian_thi_phut} phút</strong></span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <AlertTriangle className="w-5 h-5 text-gray-400" />
                                    <span>Mở: {new Date(exam.thoi_gian_bat_dau).toLocaleString('vi-VN')}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <CheckCircle className="w-5 h-5 text-gray-400" />
                                    <span>Đóng: {new Date(exam.thoi_gian_ket_thuc).toLocaleString('vi-VN')}</span>
                                </div>
                            </div>

                            <button 
                                onClick={() => handleStartExam(exam)}
                                disabled={!isOngoing && !isUpcoming} // Chỉ demo
                                className={`w-full py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all ${isOngoing ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                            >
                                <PlayCircle className="w-5 h-5" /> {isOngoing ? 'Vào phòng thi' : isUpcoming ? 'Chưa mở' : 'Đã khóa'}
                            </button>
                        </div>
                    );
                })}
            </div>
            
            {exams.length === 0 && !loading && (
                <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-xl font-bold text-gray-500">Chưa có kỳ thi nào dành cho bạn.</p>
                </div>
            )}
        </div>
    );
}

export default StudentOnlineExam;
