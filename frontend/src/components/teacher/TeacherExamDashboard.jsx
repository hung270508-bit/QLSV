import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

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
                        const violCount = s.violationCount || 0;
                        const hasViol = violCount > 0;
                        let currentStatus = 'WAITING';
                        
                        if (s.db_status === 'Disconnected' || s.db_status === 'DISCONNECTED') {
                            currentStatus = 'DISCONNECTED';
                        } else if (s.db_status === 'Locked' || s.db_status === 'AutoLocked' || s.db_status === 'AUTO_LOCKED' || violCount >= 3 || (hasViol && (s.db_status === 'Submitted' || s.db_status === 'SUBMITTED'))) {
                            currentStatus = 'AUTO_LOCKED';
                        } else if (s.db_status === 'InProgress' || s.db_status === 'In Progress') {
                            currentStatus = 'IN_PROGRESS';
                        } else if (s.db_status === 'Submitted' || s.db_status === 'SUBMITTED') {
                            currentStatus = 'SUBMITTED';
                        }
                        
                        return {
                            ...s,
                            status: currentStatus,
                            attemptId: s.attemptId || null,
                            violationCount: violCount,
                            hasViolation: hasViol
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
        // Socket.io has been removed
    }, [schedule, token]);

    useEffect(() => {
        const newStats = { WAITING: 0, IN_PROGRESS: 0, DISCONNECTED: 0, AUTO_LOCKED: 0, SUBMITTED: 0 };
        students.forEach(s => {
            if (newStats[s.status] !== undefined) newStats[s.status]++;
        });
        setStats(newStats);
    }, [students]);

    const attemptMap = useMemo(() => {
        const map = new Map();
        const activeStudents = students
            .filter((s) => s.attemptId != null)
            .sort((a, b) => a.attemptId - b.attemptId);
        activeStudents.forEach((s, idx) => {
            map.set(s.attemptId, idx + 1);
        });
        return map;
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

    const STATS_CONFIG = [
        {
            key: 'TOTAL',
            label: 'Tổng số sinh viên',
            bg: 'bg-white',
            border: 'border-gray-200',
            labelClass: 'text-xs uppercase font-extrabold tracking-wider text-[#152238]',
            badgeBg: 'bg-[#F4C542]/20',
            numberClass: 'text-3xl sm:text-4xl font-extrabold text-[#152238] tracking-tight mt-3 leading-none',
            icon: <Users className="w-5 h-5 text-[#152238]" />,
            isTotal: true
        },
        {
            key: 'WAITING',
            label: 'Chưa vào thi',
            bg: 'bg-white',
            border: 'border-gray-200',
            labelClass: 'text-xs uppercase font-extrabold tracking-wider text-gray-500',
            badgeBg: 'bg-gray-100',
            numberClass: 'text-3xl sm:text-4xl font-extrabold text-gray-800 tracking-tight mt-3 leading-none',
            pillClass: 'bg-gray-100 text-gray-700 border border-gray-200',
            icon: <Clock className="w-5 h-5 text-gray-600" />,
            cardHoverClass: 'hover:border-gray-400 hover:ring-2 hover:ring-gray-300/40 hover:shadow-lg hover:-translate-y-1'
        },
        {
            key: 'IN_PROGRESS',
            label: 'Đang thi',
            bg: 'bg-white',
            border: 'border-gray-200',
            labelClass: 'text-xs uppercase font-extrabold tracking-wider text-emerald-700',
            badgeBg: 'bg-emerald-100',
            numberClass: 'text-3xl sm:text-4xl font-extrabold text-emerald-700 tracking-tight mt-3 leading-none',
            pillClass: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
            icon: <MonitorPlay className="w-5 h-5 text-emerald-700" />,
            cardHoverClass: 'hover:border-emerald-500 hover:ring-2 hover:ring-emerald-500/30 hover:shadow-lg hover:-translate-y-1'
        },
        {
            key: 'DISCONNECTED',
            label: 'Mất kết nối',
            bg: 'bg-white',
            border: 'border-gray-200',
            labelClass: 'text-xs uppercase font-extrabold tracking-wider text-purple-700',
            badgeBg: 'bg-purple-100',
            numberClass: 'text-3xl sm:text-4xl font-extrabold text-purple-700 tracking-tight mt-3 leading-none',
            pillClass: 'bg-purple-100 text-purple-800 border border-purple-200',
            icon: <WifiOff className="w-5 h-5 text-purple-700" />,
            cardHoverClass: 'hover:border-purple-500 hover:ring-2 hover:ring-purple-500/30 hover:shadow-lg hover:-translate-y-1'
        },
        {
            key: 'AUTO_LOCKED',
            label: 'Bị khóa',
            bg: 'bg-white',
            border: 'border-gray-200',
            labelClass: 'text-xs uppercase font-extrabold tracking-wider text-red-700',
            badgeBg: 'bg-red-100',
            numberClass: 'text-3xl sm:text-4xl font-extrabold text-red-700 tracking-tight mt-3 leading-none',
            pillClass: 'bg-red-100 text-red-800 border border-red-200',
            icon: <Lock className="w-5 h-5 text-red-700" />,
            cardHoverClass: 'hover:border-red-600 hover:ring-2 hover:ring-red-500/40 hover:shadow-xl hover:-translate-y-1'
        },
        {
            key: 'SUBMITTED',
            label: 'Đã nộp bài',
            bg: 'bg-white',
            border: 'border-gray-200',
            labelClass: 'text-xs uppercase font-extrabold tracking-wider text-[#927117]',
            badgeBg: 'bg-[#F4C542]/25',
            numberClass: 'text-3xl sm:text-4xl font-extrabold text-[#927117] tracking-tight mt-3 leading-none',
            pillClass: 'bg-[#FFF7D6] text-[#927117] border border-[#F4C542]/40',
            icon: <CheckCircle2 className="w-5 h-5 text-[#927117]" />,
            cardHoverClass: 'hover:border-[#F4C542] hover:ring-2 hover:ring-[#F4C542]/40 hover:shadow-lg hover:-translate-y-1'
        }
    ];

    return (
        <div className="min-h-screen bg-[#F8F9FA] text-[#152238] pb-16 font-sans antialiased">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                {/* HERO BANNER BOX */}
                <div className="bg-[#F4C542] rounded-3xl p-6 md:p-8 shadow-xl text-[#152238] flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-12 h-12 rounded-2xl bg-[#152238] text-white flex items-center justify-center hover:bg-[#1e2f4c] transition-all shadow-md shrink-0"
                            title="Quay lại"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#152238] tracking-tight">
                                    Giám sát: {schedule.ma_lop_hoc_phan}
                                </h2>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#152238] text-[#F4C542] shadow-xs">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    Đang giám sát
                                </span>
                            </div>
                            <p className="text-sm sm:text-base text-[#152238]/80 font-semibold mt-1">
                                Môn học: {schedule.TenMonHoc || schedule.ma_mon_hoc} • Thời gian thực (Live Proctoring)
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 shrink-0 ml-auto w-full xl:w-auto text-xs sm:text-sm">
                        <div className="bg-white/95 px-4 py-2.5 rounded-2xl border border-white flex items-center justify-between sm:justify-start gap-2 shadow-xs">
                            <span className="text-gray-600 font-semibold">Bắt đầu:</span>
                            <span className="font-extrabold text-[#152238]">
                                {new Date(schedule.thoi_gian_mo).toLocaleString('vi-VN')}
                            </span>
                        </div>
                        <div className="bg-white/95 px-4 py-2.5 rounded-2xl border border-white flex items-center justify-between sm:justify-start gap-2 shadow-xs">
                            <span className="text-gray-600 font-semibold">Kết thúc:</span>
                            <span className="font-extrabold text-[#152238]">
                                {new Date(schedule.thoi_gian_dong).toLocaleString('vi-VN')}
                            </span>
                        </div>
                    </div>
                </div>
                {/* 6 Stats Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                    {STATS_CONFIG.map((conf) => {
                        const isSelected = conf.key === 'TOTAL' ? statusFilter === 'ALL' : statusFilter === conf.key;
                        const countValue =
                            stats[conf.key] !== undefined
                                ? stats[conf.key]
                                : conf.key === 'TOTAL'
                                ? students.length
                                : 0;

                        if (conf.isTotal) {
                            return (
                                <div
                                    key={conf.key}
                                    onClick={() => setStatusFilter('ALL')}
                                    className={`bg-white rounded-2xl border p-5 flex flex-col justify-between cursor-pointer transition-all duration-200 order-first ${
                                        conf.border
                                    } hover:shadow-md hover:-translate-y-0.5 ${
                                        statusFilter === 'ALL' ? 'ring-2 ring-[#152238] border-[#152238] shadow-sm bg-gray-50/40' : 'shadow-xs'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className={conf.labelClass}>
                                            {conf.label}
                                        </span>
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${conf.badgeBg}`}>
                                            {conf.icon}
                                        </div>
                                    </div>
                                    <div className={conf.numberClass}>
                                        {students.length}
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div
                                key={conf.key}
                                onClick={() => setStatusFilter(statusFilter === conf.key ? 'ALL' : conf.key)}
                                className={`rounded-2xl border p-5 flex flex-col justify-between cursor-pointer transition-all duration-200 bg-white ${
                                    conf.border || 'border-gray-200'
                                } hover:shadow-md hover:-translate-y-0.5 ${
                                    isSelected
                                        ? 'ring-2 ring-[#152238] border-[#152238] shadow-sm bg-gray-50/40'
                                        : 'shadow-xs'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className={conf.labelClass}>
                                        {conf.label}
                                    </span>
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${conf.badgeBg}`}>
                                        {conf.icon}
                                    </div>
                                </div>
                                <div className={conf.numberClass}>
                                    {countValue}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Toolbar */}
                <div className="mb-6 bg-white p-4 rounded-2xl border border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-2xs">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo MSSV hoặc Họ tên..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-[#FAFAF8] text-[13px] text-[#152238] placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#152238] focus:ring-1 focus:ring-[#152238] transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-3 text-xs sm:text-sm font-medium text-gray-600 self-end sm:self-auto">
                        <span>Hiển thị: <strong className="text-[#152238]">{filteredStudents.length}</strong> / {students.length} sinh viên</span>
                    </div>
                </div>

                {/* Student Cards Grid (4 columns desktop, 2 columns tablet, 1 column mobile) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-start">
                    {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => {
                            const statusConf = STATS_CONFIG.find((c) => c.key === student.status) || STATS_CONFIG[1];
                            const isWaiting = student.status === 'WAITING';
                            const hasRedBorder = student.hasViolation || student.status === 'AUTO_LOCKED';
                            const localNumber = student.attemptId ? attemptMap.get(student.attemptId) : null;

                            const borderAndHoverClass = hasRedBorder
                                ? 'border-[1.5px] border-red-500 ring-1 ring-red-500/20 bg-red-50/15 hover:border-red-600 hover:ring-2 hover:ring-red-500/40 hover:shadow-xl hover:-translate-y-1'
                                : `border-gray-200 bg-white ${statusConf.cardHoverClass || 'hover:border-[#152238]/30 hover:shadow-lg hover:-translate-y-1'}`;

                            return (
                                <div
                                    key={student.MSSV}
                                    className={`rounded-2xl border transition-all duration-200 ease-in-out overflow-hidden flex flex-col justify-between p-5 ${borderAndHoverClass} ${isWaiting ? 'opacity-70 hover:opacity-100 bg-[#FAFAF8]' : ''}`}
                                >
                                    <div>
                                        {/* Status Badge & Violation Badge */}
                                        <div className="flex items-center justify-between gap-2">
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${statusConf.pillClass}`}
                                            >
                                                {statusConf.icon}
                                                <span>{statusConf.label}</span>
                                            </span>
                                            {student.hasViolation && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-600 text-white font-bold text-xs shadow-xs animate-pulse">
                                                    <AlertTriangle className="w-3.5 h-3.5" />
                                                    Lần {student.violationCount}
                                                </span>
                                            )}
                                        </div>

                                        {/* Student Info */}
                                        <div className="mt-4">
                                            <h3
                                                className="font-extrabold text-[#152238] text-lg leading-snug truncate hover:text-[#152238]/80 transition-colors"
                                                title={student.HoTen}
                                            >
                                                {student.HoTen}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-xs text-gray-800 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg font-extrabold">
                                                    {student.MSSV}
                                                </span>
                                                {student.Email && student.Email.split('@')[0] !== student.MSSV && (
                                                    <span className="text-xs font-medium text-gray-500 truncate max-w-[140px]" title={student.Email}>
                                                        {student.Email.split('@')[0]}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Footer */}
                                    <div className="mt-5 pt-3.5 border-t border-gray-100 flex justify-between items-center">
                                        <span className="text-xs font-semibold text-gray-600">
                                            {localNumber ? (
                                                <span title={`ID làm bài trên cơ sở dữ liệu hệ thống (SysID): #${student.attemptId}`}>
                                                    Bài thi số: <strong className="text-[#152238] font-extrabold text-sm">#{String(localNumber).padStart(2, '0')}</strong>
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 font-medium">Chưa vào thi</span>
                                            )}
                                        </span>
                                        <button
                                            onClick={() => handleViewViolations(student.attemptId)}
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#152238] hover:text-[#152238] bg-gray-50 hover:bg-[#F4C542] px-3.5 py-1.5 rounded-xl transition-all border border-gray-200 shadow-2xs"
                                        >
                                            Chi tiết →
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-gray-200 p-8">
                            <p className="text-gray-500 text-base font-medium">
                                Không tìm thấy sinh viên nào khớp với điều kiện lọc hiện tại.
                            </p>
                            {statusFilter !== 'ALL' && (
                                <button
                                    onClick={() => setStatusFilter('ALL')}
                                    className="mt-3 px-4 py-2 bg-[#152238] text-[#F4C542] rounded-xl text-xs font-semibold hover:bg-[#1e2f4c] transition-colors"
                                >
                                    Xem tất cả sinh viên
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Violation Modal */}
            {showViolationModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-[#E5E4DD]">
                        <div className="px-6 py-4 border-b border-[#E5E4DD] flex justify-between items-center bg-[#F1EFE8]/50">
                            <h3 className="text-base font-bold text-[#17181A]">
                                Lịch sử vi phạm (Attempt ID: #{selectedAttemptId})
                            </h3>
                            <button
                                onClick={() => setShowViolationModal(false)}
                                className="text-gray-400 hover:text-gray-600 text-xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            {loadingViolations ? (
                                <div className="flex justify-center p-8">
                                    <div className="animate-spin w-7 h-7 border-b-2 border-[#17181A] rounded-full"></div>
                                </div>
                            ) : violations.length === 0 ? (
                                <div className="text-center py-6">
                                    <p className="text-[#8C8B82] text-sm">Không có ghi nhận vi phạm nào.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {violations.map((v, i) => (
                                        <div key={i} className="flex gap-3.5 p-4 rounded-xl bg-[#FCEBEB] border border-[#A32D2D]/20">
                                            <AlertTriangle className="w-5 h-5 text-[#A32D2D] flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-bold text-[#A32D2D] text-sm">{v.violation_type}</p>
                                                {v.note && <p className="text-xs text-[#A32D2D]/90 mt-1 font-medium">{v.note}</p>}
                                                <p className="text-[11px] text-[#A32D2D]/70 mt-2 font-mono">
                                                    Thời gian: {new Date(v.occurred_at).toLocaleString('vi-VN')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 bg-[#FAFAF8] border-t border-[#E5E4DD] text-right">
                            <button
                                onClick={() => setShowViolationModal(false)}
                                className="px-5 py-2.5 bg-[#17181A] hover:bg-black text-[#FFEC00] rounded-xl text-xs font-bold transition-colors shadow-sm"
                            >
                                Đóng cửa sổ
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
