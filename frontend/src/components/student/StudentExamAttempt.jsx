import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Send, AlertTriangle, HelpCircle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import API_URL from '../../api';
import { io } from 'socket.io-client';
import ModalPortal, { Toast, ConfirmDialog } from '../common/ModalPortal';

function StudentExamAttempt() {
    const { attemptId } = useParams();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [attemptData, setAttemptData] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [offset, setOffset] = useState(0);
    const [timeLeft, setTimeLeft] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    
    const socketRef = useRef(null);
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    // 1. Khởi tạo: Đồng bộ giờ & Tải đề thi
    useEffect(() => {
        const init = async () => {
            try {
                // Đồng bộ giờ
                const timeRes = await axios.get(`${API_URL}/api/exam/server-time`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const serverTime = new Date(timeRes.data.serverTime).getTime();
                const localTime = Date.now();
                setOffset(serverTime - localTime);

                // Fetch attempt
                const res = await axios.get(`${API_URL}/api/exam/student/attempt/${attemptId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.data.success) {
                    const { attempt, questions, existingAnswers } = res.data;
                    
                    if (attempt.status === 'COMPLETED' || attempt.status === 'CANCELLED') {
                        Toast.info('Bài thi này đã kết thúc!');
                        navigate('/student');
                        return;
                    }

                    setAttemptData(attempt);
                    setQuestions(questions);
                    
                    // Khôi phục đáp án (F5)
                    if (existingAnswers && existingAnswers.length > 0) {
                        const ansMap = {};
                        existingAnswers.forEach(ans => {
                            ansMap[ans.question_id] = ans.selected_option;
                        });
                        setAnswers(ansMap);
                    }
                }
            } catch (error) {
                console.error('Lỗi khi tải đề thi:', error);
                Toast.error(error.response?.data?.message || 'Không thể tải đề thi');
                navigate('/student');
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [attemptId, token, navigate]);

    // 2. Kết nối Socket & Heartbeat
    useEffect(() => {
        if (!loading && attemptData) {
            socketRef.current = io(API_URL, {
                auth: { token }
            });

            socketRef.current.on('connect', () => {
                socketRef.current.emit('register_attempt', { 
                    attemptId: attemptData.id,
                    exam_schedule_id: attemptData.exam_schedule_id
                });
            });

            // Heartbeat mỗi 15 giây
            const heartbeatInterval = setInterval(() => {
                if (socketRef.current && socketRef.current.connected) {
                    socketRef.current.emit('heartbeat', { attemptId: attemptData.id });
                }
            }, 15000);

            return () => {
                clearInterval(heartbeatInterval);
                if (socketRef.current) {
                    socketRef.current.disconnect();
                }
            };
        }
    }, [loading, attemptData, token]);

    // 3. Đếm ngược thời gian
    useEffect(() => {
        if (!attemptData || !attemptData.deadline_at) return;

        const deadline = new Date(attemptData.deadline_at).getTime();

        const timer = setInterval(() => {
            const nowReal = Date.now() + offset;
            const diff = deadline - nowReal;

            if (diff <= 0) {
                clearInterval(timer);
                setTimeLeft(0);
                if (!submitting) {
                    handleAutoSubmit();
                }
            } else {
                setTimeLeft(diff);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [attemptData, offset, submitting]);

    const handleAutoSubmit = () => {
        Toast.error('Đã hết thời gian làm bài! Hệ thống đang tự động nộp bài...');
        submitExam();
    };

    const handleManualSubmit = () => {
        const total = questions.length;
        const answeredCount = Object.keys(answers).length;
        
        let message = `Bạn đã làm ${answeredCount}/${total} câu. Bạn có chắc chắn muốn nộp bài không?`;
        if (answeredCount < total) {
            message = `CẢNH BÁO: Bạn vẫn còn ${total - answeredCount} câu chưa làm. Bạn có chắc chắn muốn nộp bài?`;
        }

        ConfirmDialog({
            title: 'Nộp bài thi',
            message: message,
            onConfirm: () => submitExam()
        });
    };

    const submitExam = async () => {
        if (submitting) return;
        setSubmitting(true);
        
        try {
            const res = await axios.post(`${API_URL}/api/exam/student/attempt/${attemptId}/submit`, 
                {}, 
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                Toast.success('Đã nộp bài thành công!');
                // Ngắt kết nối socket để không gửi disconnect event lặp
                if (socketRef.current) {
                    socketRef.current.disconnect();
                }
                setTimeout(() => navigate('/student'), 1500);
            }
        } catch (error) {
            console.error('Lỗi khi nộp bài:', error);
            Toast.error('Lỗi khi nộp bài. Xin vui lòng thử lại!');
            setSubmitting(false);
        }
    };

    const handleSelectOption = async (questionId, optionKey) => {
        if (submitting || timeLeft <= 0) return;

        // Cập nhật State ngay lập tức để UX mượt (Optimistic UI)
        setAnswers(prev => ({ ...prev, [questionId]: optionKey }));

        // Gọi API ngầm lưu đáp án
        try {
            await axios.post(`${API_URL}/api/exam/student/attempt/${attemptId}/answer`, {
                question_id: questionId,
                selected_option: optionKey
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Lỗi khi lưu đáp án:', error);
            // Nếu lỗi, có thể rollback state, nhưng để đơn giản ta báo lỗi
            Toast.error('Không thể lưu đáp án! Vui lòng kiểm tra kết nối mạng.');
        }
    };

    const formatTime = (ms) => {
        if (!ms || ms <= 0) return '00:00:00';
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!attemptData) return null;

    const totalQuestions = questions.length;
    const answeredQuestions = Object.keys(answers).length;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header dính trên cùng */}
            <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Bài Thi Trực Tuyến</h1>
                        <p className="text-sm text-gray-500">Mã lượt thi: #{attemptData.id}</p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end">
                                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Thời gian còn lại</span>
                                <div className={`font-mono text-2xl font-black ${timeLeft < 300000 ? 'text-red-600 animate-pulse' : 'text-blue-700'}`}>
                                    {formatTime(timeLeft)}
                                </div>
                            </div>
                            <Clock className={`w-8 h-8 ${timeLeft < 300000 ? 'text-red-500' : 'text-blue-500'}`} />
                        </div>
                        <div className="w-px h-10 bg-gray-200"></div>
                        <button 
                            onClick={handleManualSubmit}
                            disabled={submitting}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
                        >
                            <Send className="w-4 h-4" />
                            Nộp Bài
                        </button>
                    </div>
                </div>
            </div>

            {/* Layout 2 cột: Sidebar danh sách câu & Khung làm bài */}
            <div className="flex-1 max-w-7xl w-full mx-auto p-6 flex gap-6 items-start relative">
                
                {/* Cột trái: Khung làm bài */}
                <div className="flex-1 space-y-6 pb-20">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex gap-3 text-yellow-800 shadow-sm">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <div className="text-sm">
                            <strong>Lưu ý:</strong> Đáp án của bạn sẽ được lưu tự động mỗi khi bạn chọn. Nếu bạn F5 hoặc mất mạng, bài làm vẫn sẽ được khôi phục nguyên vẹn.
                        </div>
                    </div>

                    {questions.map((q, index) => (
                        <motion.div 
                            key={q.id} 
                            id={`question-${q.id}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                        >
                            <div className="flex gap-4 mb-4">
                                <div className="shrink-0 bg-blue-100 text-blue-800 font-bold w-10 h-10 rounded-full flex items-center justify-center border border-blue-200">
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="text-gray-900 font-medium text-lg leading-relaxed mb-4">
                                        <div dangerouslySetInnerHTML={{ __html: q.noi_dung }} />
                                    </div>
                                    <div className="space-y-3">
                                        {['A', 'B', 'C', 'D'].map(optKey => {
                                            const optValue = q[`lua_chon_${optKey.toLowerCase()}`];
                                            if (!optValue) return null;
                                            
                                            const isSelected = answers[q.id] === optKey;
                                            
                                            return (
                                                <div 
                                                    key={optKey} 
                                                    onClick={() => handleSelectOption(q.id, optKey)}
                                                    className={`
                                                        p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3
                                                        ${isSelected 
                                                            ? 'border-blue-500 bg-blue-50 shadow-sm' 
                                                            : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                                                        }
                                                    `}
                                                >
                                                    <div className={`
                                                        w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5
                                                        ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}
                                                    `}>
                                                        {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                                                    </div>
                                                    <div className="flex-1 text-gray-800 font-medium">
                                                        <span className="font-bold mr-2">{optKey}.</span> 
                                                        {optValue}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Cột phải: Sidebar điều hướng (Dính - Sticky) */}
                <div className="w-72 shrink-0 sticky top-24 space-y-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <HelpCircle className="w-5 h-5 text-blue-500" />
                            Tiến độ làm bài
                        </h3>
                        
                        <div className="mb-4">
                            <div className="flex justify-between text-sm mb-1 font-medium">
                                <span className="text-gray-500">Đã làm</span>
                                <span className="text-blue-600">{answeredQuestions}/{totalQuestions}</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-blue-500 transition-all duration-500" 
                                    style={{ width: `${(answeredQuestions / totalQuestions) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-5 gap-2">
                            {questions.map((q, idx) => {
                                const isAnswered = !!answers[q.id];
                                return (
                                    <button 
                                        key={q.id}
                                        onClick={() => {
                                            const el = document.getElementById(`question-${q.id}`);
                                            if (el) {
                                                const yOffset = -100;
                                                const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
                                                window.scrollTo({top: y, behavior: 'smooth'});
                                            }
                                        }}
                                        className={`
                                            h-10 rounded-lg font-bold text-sm transition-all border
                                            ${isAnswered 
                                                ? 'bg-blue-500 text-white border-blue-600 shadow-sm' 
                                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                            }
                                        `}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

            </div>
            <ModalPortal />
        </div>
    );
}

export default StudentExamAttempt;
