import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import { Users, Clock, AlertTriangle, ArrowLeft, Activity, Search, Filter, CheckCircle2, WifiOff, Lock, MonitorPlay } from 'lucide-react';
import API_URL from '../../api';
import ModalPortal, { Toast, ConfirmDialog, InfoDialog } from '../common/ModalPortal';

export default function TeacherExamDashboard({ id: propId }) {
    const params = useParams();
    const id = propId || params.id;
    const navigate = useNavigate();
    const [schedule, setSchedule] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState(null);
    const [infoDialog, setInfoDialog] = useState({ show: false, message: '', title: '' });

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };
    const [stats, setStats] = useState({
        WAITING: 0,
        IN_PROGRESS: 0,
        DISCONNECTED: 0,
        AUTO_LOCKED: 0,
        SUBMITTED: 0
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const [showViolationModal, setShowViolationModal] = useState(false);
    const [selectedAttemptId, setSelectedAttemptId] = useState(null);
    const [violations, setViolations] = useState([]);
    const [loadingViolations, setLoadingViolations] = useState(false);

    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        const fetchDetail = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/exam/schedules/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    const fetchedSchedule = res.data.data.schedule;
                    const now = new Date();
                    
                    if (now > new Date(fetchedSchedule.thoi_gian_ket_thuc)) {
                        setError('Kỳ thi này đã kết thúc, không thể vào giám sát thời gian thực nữa.');
                        setLoading(false);
                        return;
                    }
                    
                    setSchedule(fetchedSchedule);
                    const studentsData = res.data.data.students.map(s => {
                        let currentStatus = 'WAITING';
                        if (s.db_status === 'InProgress' || s.db_status === 'In Progress') currentStatus = 'IN_PROGRESS';
                        else if (s.db_status === 'Submitted' || s.db_status === 'SUBMITTED') currentStatus = 'SUBMITTED';
                        
                        return {
                            ...s,
                            status: currentStatus,
                            attemptId: s.attemptId || null,
                            violationCount: s.violationCount || 0,
                            hasViolation: (s.violationCount || 0) > 0
                        };
                    });
                    setStudents(studentsData);
                } else {
                    setError(res.data.message);
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Lỗi khi tải chi tiết kỳ thi');
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [id, token, navigate]);

    useEffect(() => {
        if (!schedule || !token) return;

        const newSocket = io(API_URL, {
            auth: { token }
        });

        newSocket.on('connect', () => {
            console.log("Socket connected! Requesting join_exam...");
            newSocket.emit('join_exam', { exam_schedule_id: schedule.id }, (response) => {
                console.log("join_exam response:", response);
                if (!response?.success) {
                    setError(response?.message || 'Không thể join room');
                }
            });
        });

        newSocket.on('student_status_changed', (data) => {
            setStudents(prev => prev.map(st => {
                if (st.MSSV === data.ma_sinh_vien) {
                    return { ...st, status: data.status, attemptId: data.attemptId };
                }
                return st;
            }));
        });

        newSocket.on('student_violation_alert', (data) => {
            // Update violations list
            setViolations(prev => [data, ...prev]);
            
            // Also update student status if we want to mark them as violated? No, just keep the violation list.
            // If they reach auto_locked or submitted, status will update via student_status_changed.
            
            // Highlight the student in the list if needed by adding a 'hasViolation' flag
            setStudents(prev => prev.map(st => {
                if (st.MSSV === data.ma_sinh_vien) {
                    return { ...st, hasViolation: true, violationCount: (st.violationCount || 0) + 1 };
                }
                return st;
            }));
        });

        return () => {
            newSocket.disconnect();
        };
    }, [schedule, token]);

    useEffect(() => {
        const newStats = { WAITING: 0, IN_PROGRESS: 0, DISCONNECTED: 0, AUTO_LOCKED: 0, SUBMITTED: 0 };
        students.forEach(s => {
            if (newStats[s.status] !== undefined) newStats[s.status]++;
        });
        setStats(newStats);
    }, [students]);

    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            const matchSearch = s.HoTen.toLowerCase().includes(searchTerm.toLowerCase()) || s.MSSV.toLowerCase().includes(searchTerm.toLowerCase());
            const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [students, searchTerm, statusFilter]);

    const handleViewViolations = async (attemptId) => {
        if (!attemptId) {
            setInfoDialog({ 
                show: true, 
                title: 'Chưa có dữ liệu', 
                message: 'Sinh viên này chưa vào thi nên không có lịch sử ghi nhận nào để hiển thị.' 
            });
            return;
        }

        setSelectedAttemptId(attemptId);
        setShowViolationModal(true);
        setLoadingViolations(true);
        try {
            const res = await axios.get(`${API_URL}/api/exam/student/attempt/${attemptId}/violations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setViolations(res.data.violations);
            }
        } catch (err) {
            console.error(err);
            showToast('Lỗi tải lịch sử vi phạm', 'error');
        } finally {
            setLoadingViolations(false);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="p-8 text-center text-red-500 font-medium text-lg">{error}</div>;
    if (!schedule) return null;

    const STATUS_UI = {
        'WAITING': { color: 'bg-gray-100 text-gray-600 border-gray-300', icon: <Clock className="w-4 h-4" />, label: 'Chưa vào thi' },
        'IN_PROGRESS': { color: 'bg-green-100 text-green-700 border-green-500 shadow-green-200 shadow-lg', icon: <MonitorPlay className="w-4 h-4 animate-pulse" />, label: 'Đang thi' },
        'DISCONNECTED': { color: 'bg-yellow-100 text-yellow-700 border-yellow-500 animate-pulse', icon: <WifiOff className="w-4 h-4" />, label: 'Mất kết nối' },
        'AUTO_LOCKED': { color: 'bg-red-100 text-red-700 border-red-600 shadow-red-200 shadow-md', icon: <Lock className="w-4 h-4" />, label: 'Bị khóa' },
        'SUBMITTED': { color: 'bg-blue-100 text-blue-700 border-blue-500', icon: <CheckCircle2 className="w-4 h-4" />, label: 'Đã nộp bài' }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 pb-12">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 leading-tight">Giám sát: {schedule.ma_lop_hoc_phan}</h1>
                                <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                    <Activity className="w-4 h-4 text-green-500" /> Real-time Monitoring Active
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="text-right">
                                <div className="text-sm font-medium text-gray-500">Bắt đầu</div>
                                <div className="text-sm font-semibold">{new Date(schedule.thoi_gian_mo).toLocaleString()}</div>
                            </div>
                            <div className="w-px bg-gray-300"></div>
                            <div className="text-right">
                                <div className="text-sm font-medium text-gray-500">Kết thúc</div>
                                <div className="text-sm font-semibold text-red-600">{new Date(schedule.thoi_gian_dong).toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    {Object.entries(STATUS_UI).map(([statusKey, ui]) => (
                        <div key={statusKey} className={`bg-white rounded-xl border p-4 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 ${statusFilter === statusKey ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setStatusFilter(statusFilter === statusKey ? 'ALL' : statusKey)}>
                            <div className={`p-3 rounded-full mb-2 ${ui.color.split(' ')[0]} bg-opacity-50`}>
                                {React.cloneElement(ui.icon, { className: 'w-6 h-6 ' + ui.color.split(' ')[1] })}
                            </div>
                            <span className="text-2xl font-bold">{stats[statusKey]}</span>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">{ui.label}</span>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input type="text" placeholder="Tìm kiếm MSSV, Họ tên..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                        <Users className="w-5 h-5" /> Tổng số sinh viên: {students.length}
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
                    {filteredStudents.length > 0 ? filteredStudents.map(student => {
                        const ui = STATUS_UI[student.status];
                        return (
                            <div key={student.MSSV} className={`bg-white rounded-2xl border-2 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${student.hasViolation ? 'border-red-500' : ui.color.split(' ').find(c => c.startsWith('border-'))}`}>
                                <div className={`px-4 py-3 border-b flex justify-between items-center ${student.hasViolation ? 'bg-red-50' : ui.color.split(' ').find(c => c.startsWith('bg-'))}`}>
                                    <div className={`flex items-center gap-2 font-bold ${student.hasViolation ? 'text-red-700' : ui.color.split(' ').find(c => c.startsWith('text-'))}`}>
                                        {ui.icon}
                                        {ui.label}
                                        {student.hasViolation && <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-red-200 text-red-800">Lần {student.violationCount}</span>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {student.hasViolation && student.status !== 'AUTO_LOCKED' && <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" title={`Vi phạm ${student.violationCount} lần`} />}
                                        {student.status === 'DISCONNECTED' && <WifiOff className="w-5 h-5 text-yellow-600 animate-pulse" title="Mất kết nối" />}
                                        {student.status === 'AUTO_LOCKED' && <Lock className="w-5 h-5 text-red-600" title="Đã bị khóa" />}
                                    </div>
                                </div>
                                <div className="p-5">
                                    <h3 className="font-bold text-gray-900 text-lg truncate" title={student.HoTen}>{student.HoTen}</h3>
                                    <p className="text-gray-500 font-mono text-sm mt-1">{student.MSSV}</p>
                                    
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center w-full">
                                        <span className="text-xs text-gray-400 font-mono">ID: {student.attemptId || '---'}</span>
                                        <button className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors" onClick={() => handleViewViolations(student.attemptId)}>
                                            Xem chi tiết
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="col-span-full py-12 text-center text-gray-500">
                            Không tìm thấy sinh viên nào khớp với bộ lọc.
                        </div>
                    )}
                </div>
            </main>

            {/* Violation Modal */}
            {showViolationModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/10 backdrop-blur-[2px]">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">Lịch sử vi phạm (Attempt ID: {selectedAttemptId})</h3>
                            <button onClick={() => setShowViolationModal(false)} className="text-gray-400 hover:text-gray-600">
                                &times;
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            {loadingViolations ? (
                                <div className="flex justify-center p-4"><div className="animate-spin w-6 h-6 border-b-2 border-blue-600 rounded-full"></div></div>
                            ) : violations.length === 0 ? (
                                <p className="text-gray-500 text-center">Không có ghi nhận vi phạm nào.</p>
                            ) : (
                                <div className="space-y-4">
                                    {violations.map((v, i) => (
                                        <div key={i} className="flex gap-4 p-3 border rounded-lg bg-red-50 border-red-100">
                                            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-semibold text-red-800">{v.violation_type}</p>
                                                {v.note && <p className="text-sm text-red-600 mt-1">{v.note}</p>}
                                                <p className="text-xs text-red-400 mt-2">{new Date(v.occurred_at).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t text-right">
                            <button onClick={() => setShowViolationModal(false)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors">
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Info Dialog */}
            <InfoDialog 
                show={infoDialog.show} 
                title={infoDialog.title} 
                message={infoDialog.message} 
                onClose={() => setInfoDialog({ show: false, message: '', title: '' })} 
            />

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
