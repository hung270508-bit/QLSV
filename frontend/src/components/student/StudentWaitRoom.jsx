import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MonitorPlay, Clock, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import API_URL from '../../api';
import ModalPortal, { Toast } from '../common/ModalPortal';

function StudentWaitRoom() {
    const { scheduleId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [schedule, setSchedule] = useState(null);
    const [offset, setOffset] = useState(0);
    const [timeLeft, setTimeLeft] = useState(null);
    const [starting, setStarting] = useState(false);
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');

    // Khởi tạo phòng chờ
    useEffect(() => {
        const init = async () => {
            try {
                // 1. Đồng bộ giờ server
                const timeRes = await axios.get(`${API_URL}/api/exam/server-time`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const serverTime = new Date(timeRes.data.serverTime).getTime();
                const localTime = Date.now();
                const timeOffset = serverTime - localTime;
                setOffset(timeOffset);

                // 2. Lấy thông tin schedule
                const schRes = await axios.get(`${API_URL}/api/exam/student/schedules`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (schRes.data.success) {
                    const currentSch = schRes.data.schedules.find(s => s.id === parseInt(scheduleId));
                    if (!currentSch) {
                        Toast.error('Không tìm thấy kỳ thi hoặc bạn không có quyền truy cập');
                        navigate('/student');
                        return;
                    }
                    setSchedule(currentSch);
                }

                setLoading(false);
            } catch (error) {
                console.error('Lỗi khi tải phòng chờ:', error);
                Toast.error('Lỗi khi tải dữ liệu phòng chờ');
                setLoading(false);
            }
        };

        init();
    }, [scheduleId, token, navigate]);

    // Socket.io connection removed

    // Đếm ngược
    useEffect(() => {
        if (!schedule) return;

        const thoiGianMo = new Date(schedule.thoi_gian_mo).getTime();
        const thoiGianDong = new Date(schedule.thoi_gian_dong).getTime();

        const timer = setInterval(() => {
            const nowReal = Date.now() + offset;
            
            // Nếu đã quá giờ đóng phòng
            if (nowReal > thoiGianDong) {
                clearInterval(timer);
                Toast.error('Kỳ thi đã kết thúc!');
                navigate('/student');
                return;
            }

            const diff = thoiGianMo - nowReal;
            
            if (diff <= 0) {
                clearInterval(timer);
                setTimeLeft(0);
                if (!starting) {
                    handleStartExam();
                }
            } else {
                setTimeLeft(diff);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [schedule, offset, starting]);

    const handleStartExam = async () => {
        if (starting) return;
        setStarting(true);
        try {
            const res = await axios.post(`${API_URL}/api/exam/student/start`, 
                { exam_schedule_id: schedule.id },
                { headers: { Authorization: `Bearer ${token}` }}
            );
            
            if (res.data.success) {
                Toast.success('Bắt đầu làm bài!');
                navigate(`/student/online-exams/attempt/${res.data.attemptId}`, { replace: true });
            } else {
                Toast.error(res.data.message || 'Không thể bắt đầu kỳ thi');
                setStarting(false);
            }
        } catch (error) {
            console.error('Start exam error:', error);
            // Kiểm tra xem backend có trả về thông báo attempt đã tồn tại không
            if (error.response?.data?.message?.includes('Đã có lượt thi đang diễn ra')) {
                // Thử tìm attemptId đang dang dở (Nếu có API lấy attempt hiện tại thì gọi)
                // Ở đây backend hiện tại trả ra lỗi "Đã có lượt thi...", ta có thể xử lý UX ở đây
                Toast.error('Bạn đang có lượt thi diễn ra. Vui lòng thử tải lại trang hoặc liên hệ Giám thị.');
            } else {
                Toast.error(error.response?.data?.message || 'Lỗi kết nối khi bắt đầu thi');
            }
            setStarting(false);
        }
    };

    const formatTime = (ms) => {
        if (ms <= 0) return '00:00:00';
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

    if (!schedule) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <MonitorPlay className="w-8 h-8 text-blue-600" />
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">Phòng chờ Kỳ thi</h1>
                            <p className="text-sm text-gray-500">Hệ thống Thi Trực Tuyến NhatTin University</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                        <ShieldCheck className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-blue-800">{user.username} - {user.HoTen}</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 max-w-3xl w-full mx-auto p-6 flex flex-col items-center justify-center">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white w-full rounded-3xl shadow-xl overflow-hidden border border-gray-100"
                >
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-center text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                        <h2 className="text-2xl font-bold mb-2 relative z-10">{schedule.tieu_de || `Kỳ thi ${schedule.ma_lop_hoc_phan}`}</h2>
                        <p className="text-blue-100 font-medium relative z-10">Lớp học phần: {schedule.ma_lop_hoc_phan}</p>
                    </div>

                    <div className="p-8 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full font-semibold text-sm mb-8 border border-emerald-200">
                            <CheckCircle2 className="w-4 h-4" />
                            Đã kết nối máy chủ giám sát
                        </div>

                        {timeLeft !== null && timeLeft > 0 ? (
                            <div>
                                <p className="text-gray-500 mb-4 font-medium uppercase tracking-wider text-sm">Kỳ thi sẽ bắt đầu sau</p>
                                <div className="text-6xl font-black text-gray-800 tracking-tight font-mono mb-6 drop-shadow-sm">
                                    {formatTime(timeLeft)}
                                </div>
                                <div className="flex justify-center gap-6 text-sm text-gray-500 font-medium bg-gray-50 py-4 rounded-2xl mx-12 border border-gray-100">
                                    <div className="flex flex-col">
                                        <span className="text-gray-400 text-xs uppercase mb-1">Mở phòng</span>
                                        <span className="text-gray-800">{new Date(schedule.thoi_gian_mo).toLocaleTimeString('vi-VN')}</span>
                                    </div>
                                    <div className="w-px bg-gray-200"></div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-400 text-xs uppercase mb-1">Thời lượng</span>
                                        <span className="text-gray-800">{schedule.thoi_luong_phut} phút</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-10">
                                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                                <p className="text-xl font-bold text-gray-800 mb-2">Đang tải đề thi...</p>
                                <p className="text-gray-500">Vui lòng đợi trong giây lát</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="bg-orange-50 p-6 flex gap-4 items-start border-t border-orange-100">
                        <AlertTriangle className="w-6 h-6 text-orange-500 shrink-0" />
                        <div className="text-sm text-orange-800 space-y-1">
                            <p className="font-bold">Lưu ý trước khi thi:</p>
                            <ul className="list-disc pl-4 space-y-1 opacity-90">
                                <li>Không tải lại trang (F5) khi đang làm bài trừ khi gặp lỗi mạng.</li>
                                <li>Hệ thống giám sát sẽ ghi nhận nếu bạn chuyển tab hoặc mở ứng dụng khác.</li>
                                <li>Thời gian được đồng bộ tự động với máy chủ, hãy để nguyên tab này chờ đến giờ làm bài.</li>
                            </ul>
                        </div>
                    </div>
                </motion.div>
            </div>
            <ModalPortal />
        </div>
    );
}

export default StudentWaitRoom;
