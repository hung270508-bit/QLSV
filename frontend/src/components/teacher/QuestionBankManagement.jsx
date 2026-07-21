import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Edit, Edit2, Trash2, Search, X, FileText, CheckCircle2, AlertCircle,
    Eye, Save, Sparkles, RefreshCw, CheckCheck, Filter, BookOpen, Layers,
    Clock, ArrowRight, UploadCloud, Check, HelpCircle, FolderCheck, Play,
    BarChart2, CheckSquare, AlertTriangle, ChevronRight, Bookmark, Bell, Wand2
} from 'lucide-react';
import axios from 'axios';
import ModalPortal, { Toast, ConfirmDialog } from '../common/ModalPortal';
import API_URL from '../../api';
import AiQuestionGenerator from './AiQuestionGenerator';

function QuestionBankManagement({ targetSession, onClearTargetSession, onAiGeneratorDirtyChange }) {
    const [activeTab, setActiveTab] = useState('studio');
    const [loading, setLoading] = useState(false);
    const [subjects, setSubjects] = useState([]);
    const [assignments, setAssignments] = useState([]);

    const currentUser = JSON.parse(localStorage.getItem('user')) || {};
    const teacherId = currentUser.role === 'admin' ? '' : (currentUser.id || 'GVCNTT001');

    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [confirmDialog, setConfirmDialog] = useState({ show: false, title: '', message: '', action: null });
    const [renameDialog, setRenameDialog] = useState({ show: false, bank: null, newTitle: '' });
    const [popupAlert, setPopupAlert] = useState({ show: false, title: '', message: '' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false }), 3500);
    };

    const showCustomAlert = (message, title = 'Thông báo kiểm tra dữ liệu') => {
        setPopupAlert({ show: true, title, message });
        showToast(message, 'error');
    };

    const [sessions, setSessions] = useState([]);
    const [currentSession, setCurrentSession] = useState(null);
    const [stagingQuestions, setStagingQuestions] = useState([]);
    const [officialBanks, setOfficialBanks] = useState([]);
    const [aiGeneratorDirty, setAiGeneratorDirty] = useState({ isDirty: false, title: '', count: 0 });

    const handleTabSwitch = (newTab) => {
        if (activeTab === newTab) return;
        if (activeTab === 'studio' && aiGeneratorDirty.isDirty) {
            setConfirmDialog({
                show: true,
                title: '⚠️ Cảnh Báo Đang Soạn Bộ Đề',
                message: `Bạn đang trong quá trình soạn bộ đề "${aiGeneratorDirty.title || 'Mới'}" (${aiGeneratorDirty.count} câu hỏi chưa lưu) tại Kênh Soạn Đề AI.\n\nNếu chuyển sang tab khác lúc này, phiên soạn thảo chưa lưu sẽ bị xóa hoàn toàn.\n\nBạn có chắc chắn muốn rời đi không?`,
                action: () => {
                    setAiGeneratorDirty({ isDirty: false, title: '', count: 0 });
                    if (onAiGeneratorDirtyChange) onAiGeneratorDirtyChange(false, '', 0);
                    setActiveTab(newTab);
                }
            });
            return;
        }
        setActiveTab(newTab);
    };

    const handleAiGeneratorDirtyChange = React.useCallback((isDirty, title, count) => {
        setAiGeneratorDirty(prev => {
            if (prev.isDirty === isDirty && prev.title === title && prev.count === count) return prev;
            return { isDirty, title, count };
        });
        if (onAiGeneratorDirtyChange) {
            onAiGeneratorDirtyChange(isDirty, title, count);
        }
    }, [onAiGeneratorDirtyChange]);

    // Cập nhật State để bắt được Lớp học phần
    const [uploadForm, setUploadForm] = useState({
        ma_mon_hoc: '',
        ma_lop_hoc_phan: [],
        tieu_de: '',
        so_cau_yeu_cau: '',
        do_kho: 'Mixed',
        chu_de: 'Toàn bộ',
        file: null,
        file_name: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [isUploading, setIsUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isResuming, setIsResuming] = useState(false);
    const [isApprovingAll, setIsApprovingAll] = useState(false);

    const [filterStatus, setFilterStatus] = useState('All');
    const [filterDifficulty, setFilterDifficulty] = useState('All');
    const [searchKeyword, setSearchKeyword] = useState('');

    const [editingQuestion, setEditingQuestion] = useState(null);
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const [viewingBank, setViewingBank] = useState(null);
    const [bankQuestions, setBankQuestions] = useState([]);
    const [loadingBankQs, setLoadingBankQs] = useState(false);

    // Chuẩn LMS: Notification Bell & Quick-Select states
    const [notifications, setNotifications] = useState([]);
    const [showNotificationMenu, setShowNotificationMenu] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const reviewPanelRef = React.useRef(null);
    const sessionsRef = React.useRef(sessions);
    useEffect(() => {
        sessionsRef.current = sessions;
    }, [sessions]);

    const currentSessionRef = React.useRef(currentSession);
    useEffect(() => {
        currentSessionRef.current = currentSession;
    }, [currentSession]);


    useEffect(() => {
        if (targetSession) {
            setActiveTab('studio');
            handleSelectSessionFromHistory(targetSession);
            if (onClearTargetSession) onClearTargetSession();
        }
    }, [targetSession]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (currentSession) {
            fetchStagingQuestions(currentSession.id);
        }
    }, [currentSession, filterStatus, filterDifficulty]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                fetchSubjects(),
                fetchAssignments(),
                fetchSessions(),
                fetchOfficialBanks()
            ]);
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu ban đầu:', error);
            showToast('Không thể tải dữ liệu hệ thống. Vui lòng thử lại!', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchSubjects = async () => {
        try {
            const res = currentUser.role === 'admin'
                ? await axios.get(`${API_URL}/api/subjects`)
                : await axios.get(`${API_URL}/api/teachers/${teacherId}/subjects`);
            setSubjects(res.data || []);
        } catch (error) {
            console.error('Lỗi lấy danh sách môn học:', error);
        }
    };

    const fetchAssignments = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/teaching-assignments`);
            if (currentUser.role === 'admin') {
                setAssignments(res.data || []);
            } else {
                setAssignments((res.data || []).filter(item => item.MaGiangVien === teacherId));
            }
        } catch (error) {
            console.error('Lỗi lấy phân công giảng dạy:', error);
        }
    };

    const fetchSessions = async () => {
        // Deprecated staging sessions API removed in refactor
        setSessions([]);
    };

    const fetchOfficialBanks = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/ai-exams/banks/teacher/${teacherId}`);
            setOfficialBanks(Array.isArray(res.data) ? res.data : (res.data?.data || []));
        } catch (error) {
            console.error('Lỗi lấy ngân hàng câu hỏi:', error);
        }
    };

    const fetchStagingQuestions = async (sessionId) => {
        setStagingQuestions([]);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const ext = file.name.toLowerCase();
        if (!ext.endsWith('.docx') && !ext.endsWith('.doc')) {
            setFormErrors(prev => ({ ...prev, file: 'Bắt buộc định dạng Word (.doc, .docx). Không hỗ trợ ảnh hay PDF.' }));
            showCustomAlert('Bắt buộc định dạng Word (.doc, .docx). Không hỗ trợ ảnh hay PDF.', 'Định dạng file không hợp lệ');
            e.target.value = '';
            return;
        }

        setFormErrors(prev => ({ ...prev, file: '' }));
        setUploadForm(prev => ({
            ...prev,
            file: file,
            file_name: file.name,
            tieu_de: prev.tieu_de
        }));
    };

    const handleStartAISession = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        if (isUploading || isResuming) {
            return showCustomAlert(
                'Hệ thống đang trong quá trình tải tài liệu hoặc sinh câu hỏi cho bộ đề hiện tại. Vui lòng chờ quá trình hoàn tất trước khi thao tác tiếp!',
                '⏳ Đang xử lý tạo đề'
            );
        }

        const pendingCount = stagingQuestions.filter(q => q.trang_thai === 'PENDING').length;
        if (currentSession && pendingCount > 0) {
            return showCustomAlert(
                `Bạn đang mở và làm việc với Đề #${currentSession.id} và còn ${pendingCount} câu chưa xử lý. Vui lòng duyệt câu hỏi vào Ngân hàng, hoặc xóa, hoặc bấm nút "Đóng" đề làm việc hiện tại bên dưới trước khi khởi tạo bộ đề mới!`,
                'Đang mở một đề làm việc'
            );
        }

        const runningSession = sessions.find(s => s.trang_thai === 'RUNNING');
        if (runningSession) {
            return showCustomAlert(
                `Hệ thống đang ngầm sinh câu hỏi AI cho Đề #${runningSession.id} (${runningSession.doc_tieu_de || runningSession.tieu_de || 'AI Session'}). Vui lòng chờ quá trình sinh đề đó hoàn tất trước khi tạo đề mới!`,
                '⏳ Đang có đề AI đang sinh câu hỏi'
            );
        }

        const unfinishedSession = sessions.find(s => s.trang_thai !== 'COMPLETED' && (s.so_cau_da_sinh || 0) < (s.so_cau_yeu_cau || 0));
        if (unfinishedSession) {
            return showCustomAlert(
                `Bạn đang có Đề #${unfinishedSession.id} (${unfinishedSession.doc_tieu_de || unfinishedSession.tieu_de || 'AI Session'}) chưa hoàn thành tạo đủ số câu hỏi (${unfinishedSession.so_cau_da_sinh || 0}/${unfinishedSession.so_cau_yeu_cau} câu). Vui lòng hoàn tất hoặc nhấn vào đề đó để sinh tiếp trước khi mở đề mới!`,
                'Đang có bộ đề chưa tạo xong'
            );
        }

        const errors = {};
        const tieuDeInput = (uploadForm.tieu_de || '').trim();
        const autoTieuDe = uploadForm.file ? uploadForm.file.name.replace(/\.[^/.]+$/, "") : '';
        const effectiveTieuDe = tieuDeInput || autoTieuDe;
        const forbiddenChars = /[@#$%^&*!~`+=|<>?]/;
        const soCau = Number(uploadForm.so_cau_yeu_cau);

        if (!uploadForm.ma_mon_hoc && !effectiveTieuDe && !uploadForm.file && !soCau) {
            errors.ma_mon_hoc = 'Vui lòng chọn Môn học / Lớp học phần được phân công!';
            errors.file = 'Vui lòng tải lên file tài liệu Word (.doc, .docx) để AI phân tích!';
            errors.so_cau_yeu_cau = 'Vui lòng chọn số lượng câu hỏi muốn tạo!';
            setFormErrors(errors);
            return showCustomAlert('Vui lòng chọn Môn học phân công, tải lên file tài liệu Word (.docx) và cấu hình số câu hỏi trước khi nhấn "Bắt đầu tạo câu hỏi AI"!', 'Vui lòng hoàn thiện cấu hình tạo đề');
        }

        if (!uploadForm.ma_mon_hoc) {
            errors.ma_mon_hoc = 'Vui lòng chọn Môn học / Lớp học phần được phân công!';
        }

        if (tieuDeInput !== '') {
            if (tieuDeInput.length < 10 || tieuDeInput.length > 50) {
                errors.tieu_de = 'Tiêu đề bộ đề tự nhập phải từ 10 đến 50 ký tự!';
            } else if (forbiddenChars.test(tieuDeInput)) {
                errors.tieu_de = 'Tiêu đề bộ đề không được chứa ký tự đặc biệt (@, #, $, %, ...)!';
            }
        } else if (!uploadForm.file) {
            errors.tieu_de = 'Vui lòng nhập tiêu đề bộ đề hoặc chọn file tài liệu Word để tự động lấy tên!';
        }

        if (!uploadForm.file) {
            errors.file = 'Vui lòng kéo thả hoặc tải lên file tài liệu Word (.doc, .docx) để AI phân tích!';
        } else {
            const ext = uploadForm.file.name.toLowerCase();
            if (!ext.endsWith('.doc') && !ext.endsWith('.docx')) {
                errors.file = 'Hệ thống chỉ hỗ trợ định dạng Word (.doc, .docx). Không hỗ trợ ảnh hay PDF!';
            }
        }

        if (!soCau || isNaN(soCau) || soCau < 10 || soCau > 100) {
            errors.so_cau_yeu_cau = 'Tổng số câu hỏi muốn tạo phải là số nguyên từ tối thiểu 10 đến tối đa 100 câu!';
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            if (errors.file && !uploadForm.file && Object.keys(errors).length === 1) {
                return showCustomAlert('Vui lòng kéo thả hoặc nhấn chọn file tài liệu Word (.doc, .docx) để AI có nguồn tài liệu phân tích!', 'Vui lòng tải lên file tài liệu Word');
            } else if (errors.file && uploadForm.file && Object.keys(errors).length === 1) {
                return showCustomAlert(errors.file, 'Định dạng file không hợp lệ');
            } else if (errors.ma_mon_hoc && Object.keys(errors).length === 1) {
                return showCustomAlert('Vui lòng chọn Môn học / Lớp học phần được phân công ở thẻ "Nguồn tài liệu" trước khi tạo đề!', 'Vui lòng chọn môn học');
            } else if (errors.so_cau_yeu_cau && Object.keys(errors).length === 1) {
                return showCustomAlert('Vui lòng chọn số lượng câu hỏi muốn tạo (10, 20, 50 hoặc tùy chỉnh tối thiểu 10 đến tối đa 100 câu)!', 'Vui lòng chọn số câu hỏi');
            }
            return showCustomAlert('Vui lòng kiểm tra và hoàn thiện các mục đang báo lỗi đỏ bên dưới (Môn học, File Word hoặc Số câu hỏi) trước khi tạo câu hỏi AI!', 'Vui lòng hoàn thiện thông tin');
        }

        setFormErrors({});

        setIsUploading(true);
        try {
            // Nối thêm LHP vào tiêu đề nếu có chọn LHP để phân biệt rạch ròi
            const baseTieuDe = effectiveTieuDe || 'Tài liệu môn học';
            const finalTieuDe = uploadForm.ma_lop_hoc_phan && uploadForm.ma_lop_hoc_phan.length > 0
                ? `${baseTieuDe} [${uploadForm.ma_lop_hoc_phan.map(code => code.split('.').pop()).join(', ')}]`
                : baseTieuDe;

            const formData = new FormData();
            formData.append('file', uploadForm.file);
            formData.append('ma_mon_hoc', uploadForm.ma_mon_hoc);
            formData.append('ma_giang_vien', teacherId || 'GVCNTT001');
            formData.append('tieu_de', finalTieuDe);

            const selectedSubject = subjects.find(s => s.MaMonHoc === uploadForm.ma_mon_hoc);
            if (selectedSubject) {
                formData.append('ten_mon_hoc', selectedSubject.TenMonHoc);
            }

            showToast('Đang tải lên tài liệu và trích xuất nội dung Word...', 'info');
            const uploadRes = await axios.post(`${API_URL}/api/ai-exams/documents/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (!uploadRes.data?.success) {
                throw new Error(uploadRes.data?.message || 'Lỗi tải lên tài liệu');
            }

            const docId = uploadRes.data.data.id;
            const isRelevant = uploadRes.data.is_relevant;

            const proceedToGenerate = async (autoGen = true) => {
                setIsUploading(true);
                try {
                    showToast(autoGen ? 'Tài liệu sẵn sàng! AI đang phân tích và tạo batch 10 câu hỏi đầu tiên...' : 'Đã tải tài liệu lên thành công. Bạn có thể bấm "Sinh Tiếp" khi sẵn sàng!', 'info');
                    const startRes = await axios.post(`${API_URL}/api/ai-exams/sessions/start`, {
                        document_id: docId,
                        ma_mon_hoc: uploadForm.ma_mon_hoc,
                        ma_lop_hoc_phan: Array.isArray(uploadForm.ma_lop_hoc_phan)
                            ? (uploadForm.ma_lop_hoc_phan.length > 0 ? uploadForm.ma_lop_hoc_phan.join(',') : null)
                            : (uploadForm.ma_lop_hoc_phan || null),
                        ma_giang_vien: teacherId || 'GVCNTT001',
                        so_cau_yeu_cau: soCau,
                        do_kho: uploadForm.do_kho,
                        chu_de: uploadForm.chu_de || 'Toàn bộ',
                        auto_generate: autoGen
                    });

                    if (startRes.data?.success) {
                        const newSession = startRes.data.data;
                        const notifMsg = autoGen
                            ? `Yêu cầu tạo ${soCau} câu hỏi đang được xử lý ngầm. Quá trình này có thể mất vài phút. Bạn có thể chuyển sang màn hình khác mà không làm gián đoạn luồng tạo đề!`
                            : 'Khởi tạo bộ đề AI thành công! Hãy nhấn "Sinh Tiếp" để bắt đầu.';
                        showCustomAlert(notifMsg, 'Yêu cầu đang được xử lý ngầm vui lòng đợi');
                        showToast(notifMsg, 'info');
                        setSessions(prev => [newSession, ...prev]);
                        setCurrentSession(newSession);

                        setUploadForm({
                            ma_mon_hoc: '',
                            ma_lop_hoc_phan: [],
                            tieu_de: '',
                            so_cau_yeu_cau: '',
                            do_kho: 'Mixed',
                            chu_de: 'Toàn bộ',
                            file: null,
                            file_name: ''
                        });
                    } else {
                        throw new Error(startRes.data?.message || 'Lỗi khởi tạo đề AI');
                    }
                } catch (error) {
                    console.error('Lỗi khởi tạo AI Session:', error);
                    const resData = error.response?.data;
                    const is422 = error.response?.status === 422 || resData?.validationCode;

                    if (is422) {
                        // Lỗi validation tài liệu: hiện dialog rõ ràng, không dùng toast biến mất nhanh
                        const extra = resData?.suggestedMax
                            ? `\n\nGợi ý: Tài liệu này chỉ đủ nội dung để tạo tối đa ${resData.suggestedMax} câu hỏi.`
                            : '';
                        showCustomAlert(
                            (resData?.message || error.message || 'Tài liệu không đủ chất lượng để sinh câu hỏi.') + extra,
                            'Tài liệu không đạt yêu cầu'
                        );
                    } else {
                        const errMsg = resData?.message || error.message || 'Có lỗi xảy ra khi tạo câu hỏi AI!';
                        showToast(errMsg, 'error');
                        showCustomAlert(errMsg, '❌ Lỗi hệ thống');
                    }
                } finally {
                    setIsUploading(false);
                }
            };

            if (isRelevant === false) {
                setIsUploading(false);
                setConfirmDialog({
                    show: true,
                    title: 'Cảnh báo: Tài liệu có thể không phù hợp',
                    message: 'AI nhận thấy nội dung file tài liệu này KHÔNG LIÊN QUAN đến môn học bạn đã chọn. Nếu bạn vô ý chọn nhầm file, vui lòng tải lại. Bạn có chắc chắn muốn giữ file này làm tài liệu nguồn không?',
                    action: async () => {
                        setConfirmDialog({ show: false, action: null });
                        await proceedToGenerate(false); // Do not auto generate, wait for manual trigger
                    }
                });
                return;
            } else {
                setIsUploading(false);
                setConfirmDialog({
                    show: true,
                    title: 'Kiểm duyệt thành công',
                    message: 'Tài liệu hoàn toàn phù hợp với môn học. Bạn có chắc chắn muốn bắt đầu tạo bộ đề AI từ tài liệu này không?',
                    action: async () => {
                        setConfirmDialog({ show: false, action: null });
                        await proceedToGenerate(true); // Auto generate since it is correct
                    }
                });
                return;
            }
        } catch (error) {
            console.error('Lỗi khởi tạo AI Session:', error);
            const resData = error.response?.data;
            const is422 = error.response?.status === 422 || resData?.validationCode;

            if (is422) {
                const extra = resData?.suggestedMax
                    ? `\n\n Gợi ý: Tài liệu này chỉ đủ nội dung để tạo tối đa ${resData.suggestedMax} câu hỏi.`
                    : '';
                showCustomAlert(
                    (resData?.message || error.message || 'Tài liệu không đủ chất lượng để sinh câu hỏi.') + extra,
                    ' Tài liệu không đạt yêu cầu'
                );
            } else {
                const errMsg = resData?.message || error.message || 'Có lỗi xảy ra khi tạo câu hỏi AI!';
                showToast(errMsg, 'error');
                showCustomAlert(errMsg, 'Lỗi hệ thống');
            }
        } finally {
            setIsUploading(false);
        }
    };

    const handleResumeSession = async () => {
        if (!currentSession) return;
        setIsResuming(true);
        showToast('AI đang tiếp tục tạo câu hỏi mới cho đủ số lượng yêu cầu...', 'info');
        try {
            const runningS = { ...currentSession, trang_thai: 'RUNNING' };
            setCurrentSession(runningS);
            setSessions(prev => prev.map(s => s.id === runningS.id ? runningS : s));

            const res = await axios.post(`${API_URL}/api/ai-exams/sessions/${currentSession.id}/resume`);
            if (res.data?.success) {
                const updatedSession = res.data.data;
                setCurrentSession(updatedSession);
                setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
                await fetchStagingQuestions(updatedSession.id);
                showToast('Yêu cầu sinh tiếp câu hỏi đang được AI xử lý...', 'info');
            } else {
                throw new Error(res.data?.message || 'Lỗi khi sinh tiếp câu hỏi');
            }
        } catch (error) {
            console.error('Lỗi resume AI session:', error);
            const resData = error.response?.data;
            const is422 = error.response?.status === 422 || resData?.validationCode;

            if (is422) {
                const extra = resData?.suggestedMax
                    ? `\n\n Gợi ý: Tài liệu này chỉ đủ nội dung để tạo tối đa ${resData.suggestedMax} câu hỏi.`
                    : '';
                showCustomAlert(
                    (resData?.message || error.message || 'Lỗi khi yêu cầu AI sinh tiếp câu hỏi!') + extra,
                    'Không thể sinh tiếp câu hỏi'
                );
            } else {
                const errMsg = resData?.message || error.message || 'Lỗi khi yêu cầu AI sinh tiếp câu hỏi!';
                showToast(errMsg, 'error');
                showCustomAlert(errMsg, 'Lỗi hệ thống');
            }
        } finally {
            setIsResuming(false);
        }
    };

    const handleSelectSessionFromHistory = async (s) => {
        try {
            const res = await axios.get(`${API_URL}/api/ai-exams/sessions/${s.id}/questions`);
            const qs = res.data?.data || [];
            const allApproved = qs.length > 0 && qs.every(q => q.trang_thai === 'APPROVED');

            // CHỈ chuyển sang Ngân hàng chính thức khi và chỉ khi TẤT CẢ câu hỏi đã được giảng viên duyệt chính thức (allApproved = true)
            // KHÔNG chuyển khi AI vừa sinh xong (để giảng viên kiểm tra, sửa, xóa hoặc duyệt từng câu)
            if (allApproved) {
                const bankTitle = s.tieu_de || `Bộ đề AI - ${s.TenMonHoc || s.ma_mon_hoc}`;
                const matchingBank = officialBanks.find(b => b.tieu_de === s.tieu_de || b.tieu_de === bankTitle || b.tieu_de.includes(s.tieu_de) || b.ma_mon_hoc === s.ma_mon_hoc) || officialBanks[0];
                if (matchingBank) {
                    showToast(`📚 Bộ đề #${s.id} đã hoàn tất duyệt! Đang mở Ngân hàng chính thức: "${matchingBank.tieu_de}"`, 'info');
                    setActiveTab('history');
                    handleViewBank(matchingBank);
                    return;
                }
            }
            setActiveTab('studio');
            setCurrentSession(s);
            setStagingQuestions(qs);
            showToast(`Đã mở bộ đề #${s.id}: ${s.doc_tieu_de || s.tieu_de} (${qs.length} câu hỏi đang chờ duyệt)`, 'info');
            setTimeout(() => {
                if (reviewPanelRef.current) {
                    reviewPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 80);
        } catch (error) {
            console.error('Lỗi khi kiểm tra bộ đề AI:', error);
            setCurrentSession(s);
            setTimeout(() => {
                if (reviewPanelRef.current) {
                    reviewPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 80);
        }
    };

    const handleUpdateStatus = async (questionId, status) => {
        try {
            const res = await axios.put(`${API_URL}/api/ai-exams/questions/${questionId}/status`, {
                trang_thai: status
            });
            if (res.data?.success) {
                showToast(status === 'APPROVED' ? '✓ Đã duyệt câu hỏi vào Ngân hàng chính thức!' : 'Đã cập nhật trạng thái câu hỏi!', 'success');
                if (currentSession) fetchStagingQuestions(currentSession.id);
                fetchOfficialBanks();
            }
        } catch (error) {
            console.error('Lỗi cập nhật trạng thái câu hỏi:', error);
            showToast('Lỗi cập nhật trạng thái câu hỏi!', 'error');
        }
    };

    const handleDeleteQuestion = (question) => {
        setConfirmDialog({
            show: true,
            title: 'Xác nhận xóa câu hỏi',
            message: `Bạn có chắc chắn muốn xóa câu hỏi "${question.noi_dung.slice(0, 60)}..." khỏi danh sách? Thao tác này không thể khôi phục.`,
            action: async () => {
                try {
                    const res = await axios.delete(`${API_URL}/api/ai-exams/questions/${question.id}`);
                    if (res.data?.success) {
                        showToast('Đã xóa câu hỏi thành công!', 'success');
                        if (currentSession) {
                            fetchStagingQuestions(currentSession.id);
                            setCurrentSession(prev => prev ? { ...prev, so_cau_da_sinh: Math.max(0, prev.so_cau_da_sinh - 1) } : null);
                        }
                    }
                } catch (error) {
                    console.error('Lỗi xóa câu hỏi:', error);
                    showToast('Không thể xóa câu hỏi. Vui lòng thử lại!', 'error');
                }
            }
        });
    };

    const handleDeleteSession = (session) => {
        setConfirmDialog({
            show: true,
            title: 'Xác nhận xóa bộ đề AI',
            message: `Bạn có chắc chắn muốn xóa bộ đề "${session.doc_tieu_de || session.tieu_de}"? Toàn bộ câu hỏi chưa duyệt sẽ bị xóa khỏi hệ thống.`,
            action: async () => {
                try {
                    const res = await axios.delete(`${API_URL}/api/ai-exams/sessions/${session.id}`);
                    if (res.data?.success) {
                        showToast('Đã xóa bộ đề AI thành công!', 'success');
                        if (currentSession?.id === session.id) {
                            setCurrentSession(null);
                            setStagingQuestions([]);
                        }
                        await fetchSessions();
                    }
                } catch (error) {
                    console.error('Lỗi xóa bộ đề:', error);
                    showToast('Không thể xóa bộ đề. Vui lòng thử lại!', 'error');
                }
            }
        });
    };

    const handleCompleteSession = async () => {
        if (!currentSession) return;
        setConfirmDialog({
            show: true,
            title: 'Hoàn tất & Đóng Phiên AI',
            message: `Bạn có chắc chắn muốn đóng phiên AI gợi ý "${currentSession.doc_tieu_de || currentSession.tieu_de}" không?\n\nCác câu hỏi đã duyệt sẽ nằm trong Ngân hàng chính thức. Các câu chưa duyệt sẽ bị loại bỏ.`,
            action: async () => {
                try {
                    const res = await axios.put(`${API_URL}/api/ai-exams/sessions/${currentSession.id}/complete`);
                    if (res.data?.success) {
                        showToast('Đã kết thúc sớm và đóng bộ đề!', 'success');
                        await fetchSessions();
                        setCurrentSession(null);
                        setStagingQuestions([]);
                    }
                } catch (error) {
                    console.error('Lỗi khi đóng bộ đề:', error);
                    showToast('Lỗi khi hoàn tất bộ đề', 'error');
                }
            }
        });
    };

    const handleApproveAll = () => {
        if (!currentSession) return;
        const pendingCount = stagingQuestions.filter(q => q.trang_thai === 'PENDING').length;
        if (pendingCount === 0) {
            return showToast('Không có câu hỏi nào đang ở trạng thái Chờ duyệt!', 'info');
        }

        setConfirmDialog({
            show: true,
            title: 'Duyệt hàng loạt vào Ngân hàng',
            message: `Bạn có chắc chắn muốn duyệt toàn bộ ${pendingCount} câu hỏi đang "Chờ duyệt" trong bộ đề này vào Ngân hàng chính thức để sử dụng cho Kỳ thi Online không?`,
            action: async () => {
                setIsApprovingAll(true);
                try {
                    const res = await axios.post(`${API_URL}/api/ai-exams/sessions/${currentSession.id}/approve-all`);
                    if (res.data?.success) {
                        showToast(`✓ ${res.data.message || 'Đã duyệt thành công tất cả câu hỏi!'}`, 'success');
                        fetchStagingQuestions(currentSession.id);
                        fetchOfficialBanks();
                    }
                } catch (error) {
                    console.error('Lỗi duyệt hàng loạt:', error);
                    showToast('Lỗi khi duyệt hàng loạt câu hỏi!', 'error');
                } finally {
                    setIsApprovingAll(false);
                }
            }
        });
    };

    const handleOpenEditModal = (question) => {
        setEditingQuestion({
            ...question,
            options: question.options ? question.options.map(o => ({ ...o })) : [
                { text: '', is_correct: false },
                { text: '', is_correct: false },
                { text: '', is_correct: false },
                { text: '', is_correct: false }
            ]
        });
    };

    const handleSaveEditQuestion = async (e) => {
        e.preventDefault();
        if (!editingQuestion) return;

        if (!editingQuestion.noi_dung.trim()) {
            return showToast('Nội dung câu hỏi không được để trống!', 'error');
        }
        if (editingQuestion.options.some(o => !o.text.trim())) {
            return showToast('Vui lòng nhập đầy đủ nội dung cho 4 đáp án!', 'error');
        }
        if (!editingQuestion.options.some(o => o.is_correct)) {
            return showToast('Bắt buộc phải chọn chính xác 1 đáp án đúng!', 'error');
        }

        setIsSavingEdit(true);
        try {
            const res = await axios.put(`${API_URL}/api/ai-exams/questions/${editingQuestion.id}`, {
                noi_dung: editingQuestion.noi_dung,
                giai_thich: editingQuestion.giai_thich,
                do_kho: editingQuestion.do_kho,
                chu_de: editingQuestion.chu_de,
                options: editingQuestion.options
            });

            if (res.data?.success) {
                showToast('💾 Đã cập nhật câu hỏi thành công!', 'success');
                setEditingQuestion(null);
                if (currentSession) fetchStagingQuestions(currentSession.id);
                fetchOfficialBanks();
                if (viewingBank) {
                    const bRes = await axios.get(`${API_URL}/api/ai-exams/banks/${viewingBank.id}/questions`);
                    setBankQuestions(bRes.data?.data || []);
                }
            }
        } catch (error) {
            console.error('Lỗi lưu chỉnh sửa câu hỏi:', error);
            showToast(error.response?.data?.message || 'Lỗi khi lưu câu hỏi!', 'error');
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleOptionTextChange = (index, value) => {
        if (!editingQuestion) return;
        const newOpts = [...editingQuestion.options];
        newOpts[index].text = value;
        setEditingQuestion({ ...editingQuestion, options: newOpts });
    };

    const handleOptionCorrectChange = (selectedIndex) => {
        if (!editingQuestion) return;
        const newOpts = editingQuestion.options.map((opt, idx) => ({
            ...opt,
            is_correct: idx === selectedIndex
        }));
        setEditingQuestion({ ...editingQuestion, options: newOpts });
    };

    const handleViewBank = async (bank) => {
        setViewingBank(bank);
        setLoadingBankQs(true);
        try {
            const res = await axios.get(`${API_URL}/api/ai-exams/banks/${bank.id}/questions`);
            setBankQuestions(res.data?.data || []);
        } catch (error) {
            console.error('Lỗi lấy câu hỏi trong Ngân hàng:', error);
            showToast('Lỗi khi tải chi tiết Ngân hàng câu hỏi!', 'error');
        } finally {
            setLoadingBankQs(false);
        }
    };

    const handleDeleteOfficialBank = (bank) => {
        setConfirmDialog({
            show: true,
            title: 'Xóa Ngân hàng câu hỏi chính thức',
            message: `Bạn có chắc chắn muốn xóa bộ đề "${bank.tieu_de}" (${bank.tong_so_cau || 0} câu hỏi)? Các kỳ thi Online đang sử dụng ngân hàng này có thể bị ảnh hưởng.`,
            action: async () => {
                try {
                    const res = await axios.delete(`${API_URL}/api/ai-exams/banks/${bank.id}`);
                    if (res.data?.success) {
                        showToast('Đã xóa Ngân hàng câu hỏi chính thức!', 'success');
                        fetchOfficialBanks();
                        fetchSessions();
                        if (viewingBank?.id === bank.id) setViewingBank(null);
                        if (currentSession && (currentSession.tieu_de === bank.tieu_de || currentSession.doc_tieu_de === bank.tieu_de)) {
                            setCurrentSession(null);
                            setStagingQuestions([]);
                        }
                    }
                } catch (error) {
                    console.error('Lỗi xóa bank:', error);
                    showToast('Lỗi khi xóa Ngân hàng câu hỏi!', 'error');
                }
            }
        });
    };

    const handleDeleteBankQuestion = (q) => {
        setConfirmDialog({
            show: true,
            title: 'Xóa câu hỏi khỏi Ngân hàng',
            message: `Bạn có chắc chắn muốn xóa câu hỏi này khỏi bộ đề "${viewingBank?.tieu_de}"?`,
            action: async () => {
                try {
                    const res = await axios.delete(`${API_URL}/api/ai-exams/questions/${q.id}`);
                    if (res.data?.success) {
                        showToast('Đã xóa câu hỏi khỏi bộ đề!', 'success');
                        if (viewingBank) {
                            const bRes = await axios.get(`${API_URL}/api/ai-exams/banks/${viewingBank.id}/questions`);
                            setBankQuestions(bRes.data?.data || []);
                        }
                        fetchOfficialBanks();
                    }
                } catch (error) {
                    console.error('Lỗi xóa câu hỏi:', error);
                    showToast('Lỗi khi xóa câu hỏi!', 'error');
                }
            }
        });
    };

    const handleEditOfficialBankTitle = (bank) => {
        setRenameDialog({
            show: true,
            bank: bank,
            newTitle: bank.tieu_de || ''
        });
    };

    const handleSaveRenameBank = async (e) => {
        if (e) e.preventDefault();
        if (!renameDialog.bank || !renameDialog.newTitle.trim()) {
            setRenameDialog({ show: false, bank: null, newTitle: '' });
            return;
        }
        if (renameDialog.newTitle.trim() === renameDialog.bank.tieu_de) {
            setRenameDialog({ show: false, bank: null, newTitle: '' });
            return;
        }
        try {
            const res = await axios.put(`${API_URL}/api/ai-exams/banks/${renameDialog.bank.id}`, {
                tieu_de: renameDialog.newTitle.trim()
            });
            if (res.data?.success) {
                showToast('✏️ Đã đổi tên Ngân hàng thành công!', 'success');
                fetchOfficialBanks();
                if (viewingBank?.id === renameDialog.bank.id) {
                    setViewingBank({ ...viewingBank, tieu_de: renameDialog.newTitle.trim() });
                }
                setRenameDialog({ show: false, bank: null, newTitle: '' });
            }
        } catch (error) {
            console.error('Lỗi khi đổi tên Ngân hàng:', error);
            showToast('Lỗi khi đổi tên Ngân hàng!', 'error');
        }
    };

    const getStatusBadgeVN = (status) => {
        switch (status) {
            case 'PENDING':
                return { text: 'Chờ duyệt', className: 'bg-amber-100 text-amber-800 border-amber-300' };
            case 'APPROVED':
                return { text: 'Đã duyệt vào Ngân hàng', className: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
            case 'REJECTED':
                return { text: 'Từ chối', className: 'bg-rose-100 text-rose-800 border-rose-300' };
            default:
                return { text: status || 'Chờ duyệt', className: 'bg-gray-100 text-gray-800 border-gray-300' };
        }
    };

    const getDifficultyBadgeVN = (diff) => {
        switch (diff) {
            case 'Easy':
            case 'Dễ':
            case 'easy':
                return { text: 'Dễ', className: 'bg-blue-100 text-blue-800 border-blue-300' };
            case 'Medium':
            case 'Trung bình':
            case 'medium':
                return { text: 'Trung bình', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
            case 'Hard':
            case 'Khó':
            case 'hard':
                return { text: 'Khó', className: 'bg-red-100 text-red-800 border-red-300' };
            default:
                return { text: diff || 'Trung bình', className: 'bg-gray-100 text-gray-800 border-gray-300' };
        }
    };

    const getSessionStatusVN = (session) => {
        if (!session) return { text: 'Chưa chọn bộ đề', color: 'text-gray-500 bg-gray-100' };
        if (session.trang_thai === 'COMPLETED' || session.so_cau_da_sinh >= session.so_cau_yeu_cau) {
            return { text: 'Hoàn thành tạo đề', color: 'text-emerald-700 bg-emerald-100 border-emerald-300' };
        }
        if (session.trang_thai === 'RUNNING') {
            return { text: 'Đang sinh AI...', color: 'text-blue-700 bg-blue-100 border-blue-300 animate-pulse' };
        }
        if (session.trang_thai === 'FAILED') {
            return { text: 'Dừng đột ngột (Nhấn Sinh tiếp để tạo tiếp)', color: 'text-rose-700 bg-rose-100 border-rose-300' };
        }
        return { text: 'Dừng đột ngột (Nhấn Sinh tiếp để tạo tiếp)', color: 'text-amber-700 bg-amber-100 border-amber-300' };
    };

    const displayedQuestions = stagingQuestions.filter(q => {
        if (filterStatus !== 'All' && q.trang_thai !== filterStatus) return false;
        if (filterDifficulty !== 'All' && q.do_kho && q.do_kho !== filterDifficulty) return false;
        if (!searchKeyword.trim()) return true;
        const kw = searchKeyword.toLowerCase();
        return (
            (q.noi_dung && q.noi_dung.toLowerCase().includes(kw)) ||
            (q.chu_de && q.chu_de.toLowerCase().includes(kw))
        );
    });

    // LOGIC GOM NHÓM THEO MÔN HỌC
    const groupedSessions = sessions.reduce((groups, s) => {
        const subjectKey = s.TenMonHoc ? `${s.TenMonHoc} (${s.ma_mon_hoc})` : (s.ma_mon_hoc || 'Môn học khác');
        if (!groups[subjectKey]) groups[subjectKey] = [];
        groups[subjectKey].push(s);
        return groups;
    }, {});
    Object.values(groupedSessions).forEach(list => list.sort((a, b) => b.id - a.id));

    const groupedOfficialBanks = officialBanks.reduce((groups, b) => {
        const subjectKey = b.TenMonHoc ? `${b.TenMonHoc} (${b.ma_mon_hoc})` : (b.ma_mon_hoc || 'Môn học khác');
        if (!groups[subjectKey]) groups[subjectKey] = [];
        groups[subjectKey].push(b);
        return groups;
    }, {});
    Object.values(groupedOfficialBanks).forEach(list => list.sort((a, b) => b.id - a.id));

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <ModalPortal />
            {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ show: false })} />}
            {confirmDialog.show && (
                <ConfirmDialog
                    show={true}
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                    onConfirm={() => {
                        if (confirmDialog.action) confirmDialog.action();
                        setConfirmDialog({ show: false });
                    }}
                    onCancel={() => setConfirmDialog({ show: false })}
                />
            )}

            <ModalPortal>
                <AnimatePresence>
                    {popupAlert.show && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5 border border-amber-200"
                            >
                                <div className="flex items-center gap-3 border-b pb-4">
                                    <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                                        <AlertCircle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{popupAlert.title}</h3>
                                        <p className="text-xs text-gray-500">Thông báo từ Quản lý Sinh viên</p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">{popupAlert.message}</p>
                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setPopupAlert({ show: false, title: '', message: '' })}
                                        className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-md transition-all text-sm"
                                    >
                                        Đã hiểu & Quay lại
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </ModalPortal>

            <ModalPortal>
                <AnimatePresence>
                    {renameDialog.show && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5 border border-gray-100"
                            >
                                <div className="flex items-center gap-3 border-b pb-4">
                                    <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl">
                                        <Edit2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-extrabold text-gray-900">Đổi Tên Ngân Hàng Câu Hỏi</h3>
                                            {renameDialog.bank && <span className="px-2 py-0.5 bg-[#F4C542]/20 text-[#152238] font-extrabold text-xs rounded-lg">[Đề #{renameDialog.bank.id}]</span>}
                                        </div>
                                        <p className="text-xs text-gray-500">Nhập tên mới cho bộ đề chính thức</p>
                                    </div>
                                </div>

                                <form onSubmit={handleSaveRenameBank} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Tên Ngân Hàng Mới <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            required
                                            autoFocus
                                            value={renameDialog.newTitle}
                                            onChange={e => setRenameDialog({ ...renameDialog, newTitle: e.target.value })}
                                            placeholder="Nhập tên bộ đề..."
                                            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl font-semibold text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white text-gray-900"
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setRenameDialog({ show: false, bank: null, newTitle: '' })}
                                            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-all"
                                        >
                                            Hủy bỏ
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all"
                                        >
                                            Lưu thay đổi
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </ModalPortal>


            {/* HEADER & TABS */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#F4C542] p-6 rounded-3xl text-[#152238] shadow-xl">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-[#152238]">Ngân hàng đề thi</h1>
                            <p className="text-sm font-medium text-[#152238]/80">Giảng viên có thể tự tạo câu hỏi hoặc nhờ AI gợi ý câu hỏi</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 self-start md:self-auto">
                    {/* LMS Notification Bell */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => {
                                setShowNotificationMenu(!showNotificationMenu);
                                if (!showNotificationMenu) setUnreadCount(0);
                            }}
                            className="relative p-3 rounded-2xl bg-white/60 hover:bg-white text-[#152238] border border-[#152238]/15 transition-all shadow-sm flex items-center justify-center"
                            title="Thông báo tiến trình AI"
                        >
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 bg-rose-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        <AnimatePresence>
                            {showNotificationMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 mt-2.5 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-[100] overflow-hidden"
                                >
                                    <div className="p-3.5 bg-gray-50 border-b flex items-center justify-between">
                                        <span className="font-bold text-sm text-gray-800 flex items-center gap-2">
                                            <Bell className="w-4 h-4 text-indigo-600" /> Thông báo tiến trình AI
                                        </span>
                                        {notifications.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setNotifications([])}
                                                className="text-xs text-gray-500 hover:text-red-600 font-semibold"
                                            >
                                                Xóa tất cả
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                                        {notifications.length === 0 ? (
                                            <div className="p-6 text-center text-gray-400 text-xs font-medium">
                                                Chưa có thông báo mới nào
                                            </div>
                                        ) : (
                                            notifications.map((item) => (
                                                <div
                                                    key={item.id}
                                                    onClick={() => {
                                                        setShowNotificationMenu(false);
                                                        if (item.session) {
                                                            handleSelectSessionFromHistory(item.session);
                                                        }
                                                    }}
                                                    className="p-3.5 hover:bg-indigo-50/60 cursor-pointer transition-colors flex items-start gap-3"
                                                >
                                                    <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-1">
                                                            <p className="text-xs font-bold text-gray-900 truncate">{item.title}</p>
                                                            <span className="text-[10px] text-gray-400">{item.time}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">{item.message}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex bg-[#152238]/10 p-1.5 rounded-2xl">
                    <button
                        onClick={() => handleTabSwitch('studio')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${activeTab === 'studio'
                                ? 'bg-[#152238] text-white shadow-lg font-bold'
                                : 'text-[#152238]/70 hover:text-[#152238] hover:bg-white/50'
                            }`}
                    >
                        <span>Soạn Đề Thi</span>
                    </button>
                    <button
                        onClick={() => handleTabSwitch('history')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${activeTab === 'history'
                                ? 'bg-[#152238] text-white shadow-lg font-bold'
                                : 'text-[#152238]/70 hover:text-[#152238] hover:bg-white/50'
                            }`}
                    >
                        <span>Ngân Hàng Đề Thi ({officialBanks.length})</span>
                    </button>
                </div>
            </div>
        </div>

            {/* CONTENT TABS */}
            {activeTab === 'studio' ? (
                <AiQuestionGenerator
                    officialBanks={officialBanks}
                    refreshBanks={fetchOfficialBanks}
                    subjects={subjects}
                    assignments={assignments}
                    teacherId={teacherId}
                    onDirtyChange={handleAiGeneratorDirtyChange}
                />
            ) : activeTab === 'legacy_staging_disabled' ? (
                <div className="space-y-8">
                    {/* KHUNG 1 & 2: FORM UPLOAD & CẤU HÌNH AI (NHATTIN UNIVERSITY DESIGN SYSTEM) */}
                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6 font-sans">
                        {/* HEADER */}
                        <div className="flex items-center gap-4 border-b border-gray-200 pb-5">
                            <div className="w-11 h-11 rounded-2xl bg-[#F4C542] flex items-center justify-center flex-shrink-0 shadow-sm">
                                <Sparkles className="w-6 h-6 text-[#152238]" />
                            </div>
                            <div>
                                <h2 className="text-xl md:text-2xl font-bold text-[#152238] leading-snug tracking-tight">Tạo câu hỏi bằng AI</h2>
                                <p className="text-sm md:text-base font-medium text-gray-600 mt-1">Tải tài liệu môn học, AI sẽ đọc và sinh câu hỏi theo lô 10 câu/lần.</p>
                            </div>
                        </div>

                        <form onSubmit={handleStartAISession} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* CARD 1: NGUỒN TÀI LIỆU */}
                            <div className="border border-gray-200 rounded-2xl p-6 bg-white transition-all space-y-5 shadow-sm">
                                <span className="text-sm font-extrabold uppercase tracking-wider text-gray-700 block border-b border-gray-100 pb-2.5">NGUỒN TÀI LIỆU</span>

                                {/* Môn học phân công */}
                                <div>
                                    <label className="block text-base font-bold text-[#152238] mb-2">
                                        Môn học phân công <span className="text-red-500 font-bold ml-1">*</span>
                                    </label>
                                    <select
                                        value={uploadForm.ma_mon_hoc}
                                        onChange={e => {
                                            setUploadForm({ ...uploadForm, ma_mon_hoc: e.target.value, ma_lop_hoc_phan: [] });
                                            setFormErrors(prev => ({ ...prev, ma_mon_hoc: '' }));
                                        }}
                                        className={`w-full p-3.5 bg-white border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#F4C542] focus:border-[#F4C542] transition-all text-base font-medium text-[#152238] ${
                                            formErrors.ma_mon_hoc ? 'border-red-500 bg-red-50/30' : 'border-gray-200'
                                        }`}
                                    >
                                        <option value="">-- Chọn môn học --</option>
                                        {assignments.length > 0 ? (
                                            Array.from(new Set(assignments.map(a => a.MaMonHoc))).map(ma => {
                                                const a = assignments.find(item => item.MaMonHoc === ma);
                                                return (
                                                    <option key={ma} value={ma}>
                                                        {a.TenMonHoc} ({ma})
                                                    </option>
                                                );
                                            })
                                        ) : (
                                            subjects.map(s => (
                                                <option key={s.MaMonHoc} value={s.MaMonHoc}>
                                                    {s.TenMonHoc} ({s.MaMonHoc})
                                                </option>
                                            ))
                                        )}
                                    </select>
                                    {formErrors.ma_mon_hoc ? (
                                        <p className="text-xs text-red-600 font-medium mt-1.5">{formErrors.ma_mon_hoc}</p>
                                    ) : (
                                        <p className="text-xs md:text-sm text-gray-500 font-medium mt-2">Lấy tự động từ phân công giảng dạy của admin.</p>
                                    )}

                                    {uploadForm.ma_mon_hoc && assignments.some(a => a.MaMonHoc === uploadForm.ma_mon_hoc && a.MaLopHocPhan) && (
                                        <div className="mt-3.5 p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                                            <label className="block text-sm font-bold text-[#152238] mb-2.5">
                                                Chọn Lớp học phần áp dụng (Tùy chọn)
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {assignments.filter(a => a.MaMonHoc === uploadForm.ma_mon_hoc && a.MaLopHocPhan).map(a => {
                                                    const hpCode = a.MaLopHocPhan.split('.').pop();
                                                    const className = a.TenLop ? `Lớp ${a.TenLop}` : 'Lớp tự do';
                                                    const isSelected = uploadForm.ma_lop_hoc_phan.includes(a.MaLopHocPhan);
                                                    return (
                                                        <label
                                                            key={a.MaLopHocPhan}
                                                            className={`cursor-pointer px-3.5 py-1.5 border rounded-xl text-xs md:text-sm font-bold transition-all ${
                                                                isSelected ? 'bg-[#152238] border-[#152238] text-white shadow-sm' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                className="hidden"
                                                                checked={isSelected}
                                                                onChange={(e) => {
                                                                    const newLhp = e.target.checked
                                                                        ? [...uploadForm.ma_lop_hoc_phan, a.MaLopHocPhan]
                                                                        : uploadForm.ma_lop_hoc_phan.filter(id => id !== a.MaLopHocPhan);
                                                                    setUploadForm({ ...uploadForm, ma_lop_hoc_phan: newLhp });
                                                                }}
                                                            />
                                                            {hpCode} - {className}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Tiêu đề bộ đề / tài liệu */}
                                <div>
                                    <label className="block text-base font-bold text-[#152238] mb-2">
                                        Tiêu đề bộ đề / tài liệu
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Để trống để lấy tên theo file Word..."
                                        value={uploadForm.tieu_de}
                                        onChange={e => {
                                            setUploadForm({ ...uploadForm, tieu_de: e.target.value });
                                            setFormErrors(prev => ({ ...prev, tieu_de: '' }));
                                        }}
                                        className={`w-full p-3.5 bg-white border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#F4C542] focus:border-[#F4C542] transition-all text-base font-medium text-[#152238] ${
                                            formErrors.tieu_de ? 'border-red-500 bg-red-50/30 font-medium text-red-900' : 'border-gray-200'
                                        }`}
                                    />
                                    {formErrors.tieu_de ? (
                                        <p className="text-xs text-red-600 font-medium mt-1.5">{formErrors.tieu_de}</p>
                                    ) : (
                                        <div className="space-y-1 mt-2">
                                            <p className="text-xs md:text-sm text-gray-600 font-medium">Nếu để trống: Tên tài liệu/bộ đề sẽ tự động lấy theo tên file Word (.docx).</p>
                                            <p className="text-xs md:text-sm text-gray-500">10–50 ký tự, không chứa ký tự đặc biệt (@ # $ ...).</p>
                                        </div>
                                    )}
                                </div>

                                {/* File tài liệu Word (.docx) */}
                                <div>
                                    <label className="block text-base font-bold text-[#152238] mb-2">
                                        File tài liệu Word (.docx) <span className="text-red-500 font-bold ml-1">*</span>
                                    </label>
                                    <input
                                        type="file"
                                        accept=".doc,.docx"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        id="word-upload-input"
                                    />
                                    <label
                                        htmlFor="word-upload-input"
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setIsDragOver(true);
                                        }}
                                        onDragLeave={(e) => {
                                            e.preventDefault();
                                            setIsDragOver(false);
                                        }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            setIsDragOver(false);
                                            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                                handleFileSelect({ target: { files: e.dataTransfer.files, value: '' } });
                                            }
                                        }}
                                        className={`flex flex-col items-center justify-center p-6 md:p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                                            formErrors.file
                                                ? 'border-red-500 bg-red-50/60'
                                                : isDragOver
                                                    ? 'border-[#D85A30] bg-[#F4C542]/25'
                                                    : uploadForm.file
                                                        ? 'border-[#F4C542] bg-[#F4C542]/15'
                                                        : 'border-[#F4C542]/80 bg-[#F4C542]/5 hover:border-[#F4C542] hover:bg-[#F4C542]/15'
                                        }`}
                                    >
                                        {uploadForm.file ? (
                                            <div className="flex flex-col items-center gap-2.5 w-full">
                                                <div className="flex items-center justify-between gap-3 max-w-full px-4 py-3 bg-white rounded-2xl border border-[#F4C542] shadow-sm w-full">
                                                    <div className="flex items-center gap-2.5 truncate">
                                                        <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                                                        <span className="text-base font-bold text-[#152238] truncate">{uploadForm.file_name}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            e.preventDefault();
                                                            setUploadForm(prev => ({ ...prev, file: null, file_name: '' }));
                                                            setFormErrors(prev => ({ ...prev, file: '' }));
                                                            const inputEl = document.getElementById('word-upload-input');
                                                            if (inputEl) inputEl.value = '';
                                                        }}
                                                        title="Xóa file đã chọn"
                                                        className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-colors flex-shrink-0"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>
                                                <span className="text-sm text-emerald-700 font-bold">Đã tải lên sẵn sàng tạo câu hỏi</span>
                                            </div>
                                        ) : (
                                            <>
                                                <UploadCloud className="w-8 h-8 text-[#152238] mb-2" />
                                                <p className="text-base font-bold text-[#152238]">Kéo thả file .docx vào đây</p>
                                                <span className="text-sm text-gray-500 my-2 font-medium">hoặc</span>
                                                <span className="px-5 py-2.5 bg-[#152238] hover:bg-[#152238]/90 text-white text-sm font-bold rounded-xl shadow-sm transition-all inline-block">
                                                    Chọn file
                                                </span>
                                            </>
                                        )}
                                    </label>
                                    {formErrors.file ? (
                                        <p className="text-xs text-red-600 font-medium mt-2 flex items-center gap-1.5 justify-center">
                                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                            <span>{formErrors.file}</span>
                                        </p>
                                    ) : (
                                        <p className="text-xs md:text-sm font-bold text-amber-900 mt-2.5 text-center">
                                            Chỉ hỗ trợ .doc, .docx – không hỗ trợ ảnh hay PDF.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* CARD 2: CẤU HÌNH AI */}
                            <div className="border border-gray-200 rounded-2xl p-6 bg-white transition-all space-y-5 shadow-sm">
                                <span className="text-sm font-extrabold uppercase tracking-wider text-gray-700 block border-b border-gray-100 pb-2.5">CẤU HÌNH AI</span>

                                {/* Tổng số câu hỏi */}
                                <div>
                                    <label className="block text-base font-bold text-[#152238] mb-2">
                                        Tổng số câu hỏi <span className="text-red-500 font-bold ml-1">*</span>
                                    </label>

                                    {/* 4 nút chọn nhanh dạng grid 4 cột */}
                                    <div className="grid grid-cols-4 gap-2.5 mb-3.5">
                                        {[10, 20, 50].map((num) => {
                                            const isSelected = Number(uploadForm.so_cau_yeu_cau) === num;
                                            return (
                                                <button
                                                    key={num}
                                                    type="button"
                                                    onClick={() => {
                                                        setUploadForm(prev => ({ ...prev, so_cau_yeu_cau: num }));
                                                        setFormErrors(prev => ({ ...prev, so_cau_yeu_cau: '' }));
                                                    }}
                                                    className={`py-3 px-2 rounded-2xl text-sm md:text-base font-bold transition-all border flex items-center justify-center shadow-sm ${
                                                        isSelected
                                                            ? 'bg-[#F4C542] border border-[#d8aa26] text-[#152238] font-extrabold ring-2 ring-[#F4C542]/40 shadow-md'
                                                            : 'bg-white border-gray-200 text-gray-700 hover:border-[#F4C542] hover:bg-[#F4C542]/10'
                                                    }`}
                                                >
                                                    <span>{num} câu</span>
                                                </button>
                                            );
                                        })}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if ([10, 20, 50].includes(Number(uploadForm.so_cau_yeu_cau))) {
                                                    setUploadForm(prev => ({ ...prev, so_cau_yeu_cau: '' }));
                                                }
                                            }}
                                            className={`py-3 px-2 rounded-2xl text-sm md:text-base font-bold transition-all border flex items-center justify-center shadow-sm ${
                                                !uploadForm.so_cau_yeu_cau || ![10, 20, 50].includes(Number(uploadForm.so_cau_yeu_cau))
                                                    ? 'bg-[#F4C542] border border-[#d8aa26] text-[#152238] font-extrabold ring-2 ring-[#F4C542]/40 shadow-md'
                                                    : 'bg-white border-gray-200 text-gray-700 hover:border-[#F4C542] hover:bg-[#F4C542]/10'
                                            }`}
                                        >
                                            <span>Tùy chỉnh</span>
                                        </button>
                                    </div>

                                    {/* Gợi ý thông minh theo độ dài tài liệu Word */}
                                    {uploadForm.file && (() => {
                                        const sizeKB = Math.round(uploadForm.file.size / 1024);
                                        const estPages = Math.max(1, Math.round((sizeKB - 6) / 2));
                                        let recMin = 10, recMax = 20;
                                        if (estPages >= 4 && estPages <= 8) { recMin = 20; recMax = 30; }
                                        else if (estPages > 8) { recMin = 30; recMax = 50; }
                                        return (
                                            <div className="p-3.5 mb-3.5 bg-[#F4C542]/20 border border-[#F4C542] rounded-2xl flex items-center justify-between gap-3 shadow-sm">
                                                <div className="flex items-center gap-2.5 text-xs md:text-sm font-semibold text-[#152238]">
                                                    <Sparkles className="w-5 h-5 text-[#D85A30] flex-shrink-0" />
                                                    <span>
                                                        Dung lượng file: <strong>{sizeKB} KB (~{estPages} trang Word)</strong>. AI gợi ý tối ưu <strong>{recMin} - {recMax} câu hỏi</strong>.
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setUploadForm(prev => ({ ...prev, so_cau_yeu_cau: recMax }));
                                                        setFormErrors(prev => ({ ...prev, so_cau_yeu_cau: '' }));
                                                    }}
                                                    className="px-3.5 py-1.5 bg-[#152238] hover:bg-[#152238]/90 text-[#F4C542] text-xs md:text-sm font-bold rounded-xl transition-all flex-shrink-0 shadow-sm"
                                                >
                                                    Chọn {recMax} câu
                                                </button>
                                            </div>
                                        );
                                    })()}

                                    {/* Input số tùy chỉnh */}
                                    <input
                                        type="number"
                                        min="10"
                                        max="100"
                                        step="1"
                                        placeholder="Nhập số câu (tối thiểu 10, tối đa 100)..."
                                        value={uploadForm.so_cau_yeu_cau}
                                        onKeyDown={(e) => {
                                            if (['-', '+', 'e', 'E', '.', ','].includes(e.key)) {
                                                e.preventDefault();
                                            }
                                        }}
                                        onPaste={(e) => {
                                            const pasteText = (e.clipboardData || window.clipboardData).getData('text');
                                            const parsed = Number(pasteText);
                                            if (!/^\d+$/.test(pasteText) || isNaN(parsed) || parsed < 10 || parsed > 100) {
                                                e.preventDefault();
                                                setFormErrors(prev => ({ ...prev, so_cau_yeu_cau: 'Chỉ được dán số nguyên từ tối thiểu 10 đến tối đa 100 câu!' }));
                                                showCustomAlert('Chỉ được nhập số nguyên từ tối thiểu 10 đến tối đa 100 câu!', 'Dữ liệu không hợp lệ');
                                            }
                                        }}
                                        onChange={e => {
                                            const val = e.target.value;
                                            if (val === '') {
                                                setUploadForm({ ...uploadForm, so_cau_yeu_cau: '' });
                                                setFormErrors(prev => ({ ...prev, so_cau_yeu_cau: '' }));
                                                return;
                                            }
                                            const num = Number(val);
                                            if (num > 100) {
                                                setUploadForm({ ...uploadForm, so_cau_yeu_cau: 100 });
                                                setFormErrors(prev => ({ ...prev, so_cau_yeu_cau: 'Tối đa là 100 câu! Không được nhập câu 101 trở lên.' }));
                                                showCustomAlert('Số lượng câu hỏi tối đa cho một lần tạo là 100 câu! Không được nhập quá 100 câu.', 'Giới hạn tối đa 100 câu');
                                            } else if (num < 10 || isNaN(num) || !Number.isInteger(num)) {
                                                setUploadForm({ ...uploadForm, so_cau_yeu_cau: val });
                                                setFormErrors(prev => ({ ...prev, so_cau_yeu_cau: 'Số câu hỏi tối thiểu là 10 câu và tối đa 100 câu!' }));
                                            } else {
                                                setUploadForm({ ...uploadForm, so_cau_yeu_cau: num });
                                                setFormErrors(prev => ({ ...prev, so_cau_yeu_cau: '' }));
                                            }
                                        }}
                                        className={`w-full p-3.5 bg-white border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#F4C542] focus:border-[#F4C542] transition-all text-base font-medium text-[#152238] ${
                                            formErrors.so_cau_yeu_cau ? 'border-red-500 bg-red-50/30 text-red-900' : 'border-gray-200'
                                        }`}
                                    />
                                    {formErrors.so_cau_yeu_cau && (
                                        <p className="text-xs text-red-600 font-medium mt-1.5">{formErrors.so_cau_yeu_cau}</p>
                                    )}
                                </div>

                                {/* Cấu trúc mức độ độ khó */}
                                <div>
                                    <label className="block text-base font-bold text-[#152238] mb-2">
                                        Cấu trúc mức độ độ khó
                                    </label>
                                    <select
                                        value={uploadForm.do_kho}
                                        onChange={e => setUploadForm({ ...uploadForm, do_kho: e.target.value })}
                                        className="w-full p-3.5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#F4C542] focus:border-[#F4C542] transition-all text-base font-medium text-[#152238]"
                                    >
                                        <option value="Mixed">Tự phân chia hợp lý (Dễ, Trung bình, Khó)</option>
                                        <option value="Easy">🟢 Toàn bộ mức Dễ (Easy)</option>
                                        <option value="Medium">🟡 Toàn bộ mức Trung bình (Medium)</option>
                                        <option value="Hard">🔴 Toàn bộ mức Khó (Hard)</option>
                                    </select>
                                </div>
                            </div>

                            {/* NÚT HÀNH ĐỘNG CHÍNH */}
                            <div className="col-span-1 md:col-span-2 flex justify-end pt-3">
                                <div className="w-full md:w-auto inline-block">
                                    <button
                                        type="button"
                                        onClick={handleStartAISession}
                                        disabled={isUploading}
                                        className="flex items-center justify-center gap-3 w-full md:w-auto py-4 px-8 bg-[#152238] hover:bg-[#152238]/90 text-white font-extrabold text-base rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:bg-[#152238] disabled:opacity-75 disabled:cursor-not-allowed"
                                    >
                                        {isUploading ? (
                                            <>
                                                <Sparkles className="w-5 h-5 text-[#F4C542] animate-spin" />
                                                <span>AI Đang Phân Tích & Tạo Câu Hỏi...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Wand2 className="w-5 h-5 text-[#F4C542]" />
                                                <span>Bắt đầu tạo câu hỏi AI</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* KHUNG 2: BỘ ĐỀ ĐANG LÀM VIỆC */}
                    {currentSession ? (
                        <div ref={reviewPanelRef} className="bg-gradient-to-br from-indigo-900/5 via-purple-900/5 to-blue-900/5 rounded-3xl p-6 md:p-8 border border-indigo-100 shadow-sm space-y-6 scroll-mt-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-100 pb-5">
                                <div>
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#152238] mb-1">
                                        <span>Bộ đề đang làm việc #{currentSession.id}</span>
                                    </div>
                                    <h3 className="text-xl font-extrabold text-gray-900">
                                        {currentSession.doc_tieu_de || currentSession.tieu_de || 'Tài liệu không tên'}
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-0.5">
                                        Môn học: <span className="font-bold text-indigo-900">{currentSession.TenMonHoc || currentSession.ma_mon_hoc}</span> • File: <span className="underline">{currentSession.file_name || 'Tài liệu Word'}</span>
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <span className={`px-4 py-2 rounded-xl text-sm font-bold border flex items-center gap-2 ${getSessionStatusVN(currentSession).color}`}>
                                        <span>{getSessionStatusVN(currentSession).text}</span>
                                    </span>

                                    {currentSession.so_cau_da_sinh < currentSession.so_cau_yeu_cau && currentSession.trang_thai !== 'COMPLETED' && currentSession.trang_thai !== 'RUNNING' && (
                                        <button
                                            onClick={handleResumeSession}
                                            disabled={isResuming}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md transform hover:-translate-y-0.5 transition-all disabled:opacity-50 text-sm"
                                        >
                                            <Play className={`w-4 h-4 fill-current ${isResuming ? 'animate-spin' : ''}`} />
                                                <span>{isResuming ? 'Đang tạo tiếp...' : `Sinh Tiếp Câu Hỏi (${currentSession.so_cau_da_sinh}/${currentSession.so_cau_yeu_cau})`}</span>
                                        </button>
                                    )}

                                    {stagingQuestions.some(q => q.trang_thai === 'PENDING') && (
                                        <button
                                            onClick={handleApproveAll}
                                            disabled={isApprovingAll}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-md transform hover:-translate-y-0.5 transition-all disabled:opacity-50 text-sm"
                                        >
                                            <CheckCheck className="w-4 h-4" />
                                            <span>{isApprovingAll ? 'Đang duyệt...' : 'Duyệt Tất Cả Vào Ngân Hàng'}</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            if (stagingQuestions.length > 0 && stagingQuestions.every(q => q.trang_thai === 'APPROVED')) {
                                                handleCompleteSession();
                                            } else {
                                                handleDeleteSession(currentSession);
                                            }
                                        }}
                                        className={`flex items-center gap-2 px-5 py-2.5 ${
                                            stagingQuestions.length > 0 && stagingQuestions.every(q => q.trang_thai === 'APPROVED') 
                                            ? 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700' 
                                            : 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700'
                                        } text-white font-bold rounded-xl shadow-md transform hover:-translate-y-0.5 transition-all text-sm`}
                                        title={stagingQuestions.length > 0 && stagingQuestions.every(q => q.trang_thai === 'APPROVED') ? "Kết thúc tạo đề sớm và dọn dẹp không gian làm việc" : "Xóa bộ đề đang làm việc (Bỏ qua)"}
                                    >
                                        {stagingQuestions.length > 0 && stagingQuestions.every(q => q.trang_thai === 'APPROVED') ? (
                                            <>
                                                <CheckCheck className="w-4 h-4" />
                                                <span>Đóng Đề & Dọn Dẹp</span>
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="w-4 h-4" />
                                                <span>Xóa Bộ Đề</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm font-bold">
                                    <span className="text-gray-700">Tiến độ tạo câu hỏi từ trợ lý AI:</span>
                                    <span className="text-[#152238] font-extrabold">
                                        Đã tạo: {currentSession.so_cau_da_sinh || 0} / {currentSession.so_cau_yeu_cau || 10} câu ({Math.round(((currentSession.so_cau_da_sinh || 0) / (currentSession.so_cau_yeu_cau || 10)) * 100)}%)
                                    </span>
                                </div>
                                <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden p-0.5 border border-gray-300">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, ((currentSession.so_cau_da_sinh || 0) / (currentSession.so_cau_yeu_cau || 10)) * 100)}%` }}
                                        transition={{ duration: 0.8, ease: 'easeOut' }}
                                        className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-full shadow-inner"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {/* KHUNG 4 & 5 & 6: BỘ LỌC & DANH SÁCH CÂU HỎI STAGING */}
                    {currentSession && (stagingQuestions.some(q => q.trang_thai !== 'APPROVED') || isResuming || isUploading) && (
                        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-gray-50 text-purple-600 rounded-xl">
                                        <CheckSquare className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">Danh Sách Câu Hỏi Trợ Lý AI Tạo Ra ({displayedQuestions.length})</h2>
                                        <p className="text-sm text-gray-500">Giảng viên xem xét, chỉnh sửa đáp án và duyệt câu hỏi vào Ngân hàng chính thức</p>
                                    </div>
                                </div>

                                {/* BỘ LỌC */}
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Tìm từ khóa nội dung..."
                                            value={searchKeyword}
                                            onChange={e => setSearchKeyword(e.target.value)}
                                            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all w-48 md:w-60"
                                        />
                                        {searchKeyword && (
                                            <button onClick={() => setSearchKeyword('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
                                        <button
                                            onClick={() => setFilterStatus('All')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === 'All' ? 'bg-white text-indigo-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                                        >
                                            Tất cả
                                        </button>
                                        <button
                                            onClick={() => setFilterStatus('PENDING')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === 'PENDING' ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                                        >
                                            Chờ duyệt ({stagingQuestions.filter(q => q.trang_thai === 'PENDING').length})
                                        </button>
                                        <button
                                            onClick={() => setFilterStatus('APPROVED')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === 'APPROVED' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                                        >
                                            Đã duyệt ({stagingQuestions.filter(q => q.trang_thai === 'APPROVED').length})
                                        </button>
                                    </div>

                                    <select
                                        value={filterDifficulty}
                                        onChange={e => setFilterDifficulty(e.target.value)}
                                        className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="All">Độ khó: Tất cả</option>
                                        <option value="Easy">Dễ (Easy)</option>
                                        <option value="Medium">Trung bình (Medium)</option>
                                        <option value="Hard">Khó (Hard)</option>
                                    </select>
                                </div>
                            </div>

                            {displayedQuestions.length > 0 ? (
                                <div className="space-y-4">
                                    {displayedQuestions.map((q, idx) => {
                                        const statusBadge = getStatusBadgeVN(q.trang_thai);
                                        const diffBadge = getDifficultyBadgeVN(q.do_kho);
                                        return (
                                            <div 
                                                key={q.id}
                                                className={`p-6 rounded-2xl border transition-all ${
                                                    q.trang_thai === 'APPROVED' ? 'bg-emerald-50/30 border-emerald-200' :
                                                    q.trang_thai === 'REJECTED' ? 'bg-rose-50/30 border-rose-200 opacity-75' :
                                                    'bg-white border-gray-200 hover:border-[#152238]/50 shadow-sm'
                                                }`}
                                            >
                                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                                    <div className="space-y-3 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="w-8 h-8 rounded-lg bg-[#F4C542]/20 text-indigo-800 font-extrabold flex items-center justify-center text-sm">
                                                                #{idx + 1}
                                                            </span>
                                                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${diffBadge.className}`}>
                                                                {diffBadge.text}
                                                            </span>
                                                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${statusBadge.className}`}>
                                                                {statusBadge.text}
                                                            </span>
                                                            {q.chu_de && (
                                                                <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md font-medium">
                                                                    📚 {q.chu_de}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <p className="text-base font-bold text-gray-900 leading-relaxed">
                                                            {q.noi_dung}
                                                        </p>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                                                            {q.options && q.options.map((opt, oIdx) => (
                                                                <div
                                                                    key={opt.id || oIdx}
                                                                    className={`p-3 rounded-xl border flex items-center justify-between text-sm ${
                                                                        opt.is_correct
                                                                            ? 'bg-emerald-100 border-emerald-400 text-emerald-950 font-bold shadow-sm'
                                                                            : 'bg-gray-50 border-gray-200 text-gray-700'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-2.5 truncate pr-2">
                                                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 ${
                                                                            opt.is_correct ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
                                                                        }`}>
                                                                            {String.fromCharCode(65 + oIdx)}
                                                                        </span>
                                                                        <span className="truncate">{opt.text}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {q.giai_thich && (
                                                            <div className="mt-3 p-3.5 bg-[#F4C542]/10/60 rounded-xl border border-indigo-100 text-xs text-indigo-900">
                                                                <span className="font-bold">Giải thích từ AI: </span>
                                                                <span>{q.giai_thich}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex md:flex-col items-center gap-2 self-end md:self-start pt-3 md:pt-0 border-t md:border-t-0 w-full md:w-auto justify-end">
                                                        {q.trang_thai !== 'APPROVED' && (
                                                            <button
                                                                onClick={() => handleUpdateStatus(q.id, 'APPROVED')}
                                                                title="Duyệt câu hỏi vào Ngân hàng chính thức"
                                                                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm w-full md:w-32"
                                                            >
                                                                <span>Duyệt</span>
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleOpenEditModal(q)}
                                                            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#F4C542]/10 hover:bg-[#F4C542]/20 text-[#152238] font-bold rounded-xl text-xs transition-all border border-gray-200 w-full md:w-32"
                                                        >
                                                            <span>Chỉnh sửa</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteQuestion(q)}
                                                            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition-all border border-rose-200 w-full md:w-32"
                                                        >
                                                            <span>Xóa câu</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    </div>
                                ) : (
                                    <div className="p-12 text-center text-gray-500 bg-gray-50 rounded-2xl">
                                        <p className="text-base font-semibold">Không tìm thấy câu hỏi nào phù hợp với bộ lọc hiện tại</p>
                                    </div>
                                )}
                            </div>
                        )}

                    {/* KHUNG 3: DANH SÁCH CÁC BỘ ĐỀ TẠO ĐỀ AI - HIỂN THỊ GOM NHÓM THEO MÔN */}
                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
                        <div className="flex items-center justify-between border-b pb-4">
                            <div className="flex items-center gap-3">

                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Lịch Sử Các Bộ Đề Tải Lên & Sinh Đề Nháp ({sessions.length})</h2>
                                    <p className="text-sm text-gray-500">Các đề được phân loại rõ ràng theo từng Môn học</p>
                                </div>
                            </div>
                            <button
                                onClick={fetchSessions}
                                className="p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                                title="Làm mới danh sách"
                            >

                            </button>
                        </div>

                        {Object.keys(groupedSessions).length > 0 ? (
                            <div className="space-y-8">
                                {Object.entries(groupedSessions).map(([subjectName, sessionList]) => (
                                    <div key={subjectName} className="bg-gray-50/50 rounded-3xl p-6 border border-gray-100">
                                        <div className="flex items-center gap-3 mb-5 border-b border-gray-200/60 pb-3">
                                            <div className="p-2 bg-[#F4C542]/20 text-[#152238] rounded-xl">

                                            </div>
                                            <h3 className="text-lg font-extrabold text-gray-800">{subjectName}</h3>
                                            <span className="px-3 py-1 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-lg shadow-sm">
                                                {sessionList.length} đề tải lên
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                            {sessionList.map(s => {
                                                const statusVN = getSessionStatusVN(s);
                                                const isAlreadyBank = officialBanks.some(b => b.session_id === s.id);
                                                return (
                                                    <div
                                                        key={s.id}
                                                        onClick={() => handleSelectSessionFromHistory(s)}
                                                        className="p-5 rounded-2xl border bg-white border-gray-200 hover:border-indigo-400 hover:shadow-lg cursor-pointer transition-all transform hover:-translate-y-1"
                                                    >
                                                        <div className="flex items-center justify-between gap-2 mb-3">
                                                            <span className="text-xs font-extrabold text-[#152238] uppercase bg-[#F4C542]/10 px-2.5 py-1 rounded-lg">
                                                                Đề #{s.id}
                                                            </span>
                                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${statusVN.color}`}>
                                                                {statusVN.text}
                                                            </span>
                                                        </div>

                                                        <h4 className="font-bold text-gray-900 text-base line-clamp-2 mb-4" title={s.doc_tieu_de || s.tieu_de}>
                                                            {s.doc_tieu_de || s.tieu_de || 'Tài liệu không tên'}
                                                        </h4>

                                                        <div className="space-y-1.5">
                                                            <div className="flex justify-between text-xs font-bold text-gray-600">
                                                                <span>Tiến độ tạo:</span>
                                                                <span>{s.so_cau_da_sinh || 0} / {s.so_cau_yeu_cau || 10} câu ({Math.round(((s.so_cau_da_sinh || 0) / (s.so_cau_yeu_cau || 10)) * 100)}%)</span>
                                                            </div>
                                                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                                <div
                                                                    style={{ width: `${Math.min(100, ((s.so_cau_da_sinh || 0) / (s.so_cau_yeu_cau || 10)) * 100)}%` }}
                                                                    className="h-full bg-[#152238] rounded-full"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-[#152238]">
                                                            <span>{isAlreadyBank ? '✓ Đã vào Ngân Hàng (Xem)' : '🔍 Nhấn để kiểm tra & duyệt đề'}</span>
                                                            <ChevronRight className="w-4 h-4" />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center text-gray-500 bg-gray-50 rounded-2xl">
                                <p className="text-base font-semibold">Chưa có bộ đề AI nào</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* TAB 2: NGÂN HÀNG CHÍNH THỨC - ĐÃ GOM NHÓM HIỂN THỊ TRỰC QUAN THEO MÔN */
                <div className="space-y-8">
                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
                        <div className="flex items-center justify-between border-b pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                                    <Bookmark className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Ngân Hàng Câu Hỏi Chính Thức ({officialBanks.length})</h2>
                                    <p className="text-sm text-gray-500">Các bộ đề đã được phân loại chi tiết theo từng môn học</p>
                                </div>
                            </div>
                        </div>

                        {Object.keys(groupedOfficialBanks).length > 0 ? (
                            <div className="space-y-8">
                                {Object.entries(groupedOfficialBanks).map(([subjectName, banks]) => (
                                    <div key={subjectName} className="bg-gray-50/50 rounded-3xl p-6 border border-gray-100">
                                        <div className="flex items-center gap-3 mb-5 border-b border-gray-200/60 pb-3">
                                            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">

                                            </div>
                                            <h3 className="text-xl font-extrabold text-gray-800">{subjectName}</h3>
                                            <span className="px-3 py-1 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-lg shadow-sm">
                                                {banks.length} bộ đề
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {banks.map(b => (
                                                <div key={b.id} className="p-6 rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/50 hover:border-emerald-400 hover:shadow-lg transition-all flex flex-col justify-between space-y-4 transform hover:-translate-y-1">
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-extrabold rounded-lg border border-emerald-300">
                                                                ✓ Đã Duyệt Chính Thức
                                                            </span>
                                                            <span className="text-xs font-black text-[#152238] bg-[#F4C542]/10 px-2.5 py-1 rounded-lg border border-gray-200">
                                                                ID #{b.id}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-start justify-between gap-2 pt-1">
                                                            <h4 className="font-extrabold text-gray-900 text-lg line-clamp-2 flex-1 leading-snug" title={b.tieu_de}>
                                                                <span className="text-emerald-700 font-black mr-1.5 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-sm">[Đề #{b.id}]</span>
                                                                <span>{b.tieu_de}</span>
                                                            </h4>
                                                            <button
                                                                onClick={() => handleEditOfficialBankTitle(b)}
                                                                className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition-all shrink-0"
                                                                title="Đổi tên Ngân hàng"
                                                            >

                                                            </button>
                                                        </div>
                                                        <div className="space-y-1.5 bg-gray-50/80 p-3 rounded-xl border border-gray-100 text-xs text-gray-600">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-gray-500 font-medium">Môn học:</span>
                                                                <span className="font-bold text-gray-800 line-clamp-1 text-right max-w-[160px]" title={b.TenMonHoc || b.ma_mon_hoc}>{b.TenMonHoc || b.ma_mon_hoc}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-gray-500 font-medium">Lớp HP:</span>
                                                                <span className="font-extrabold text-[#152238] font-mono">{b.ma_mon_hoc}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-gray-500 font-medium">Giảng viên:</span>
                                                                <span className="font-bold text-gray-800">{b.ma_giang_vien}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-gray-500 font-medium">Ngày tạo:</span>
                                                                <span className="font-semibold text-gray-700">
                                                                    {b.created_at ? `${new Date(b.created_at).toLocaleDateString('vi-VN')} ${new Date(b.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : 'Vừa mới tạo'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                                        <div className="text-sm">
                                                            <span className="font-extrabold text-emerald-600 text-lg">{b.tong_so_cau || 0}</span>
                                                            <span className="text-gray-500 font-semibold"> câu hỏi</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleViewBank(b)}
                                                                className="px-4 py-1.5 bg-[#F4C542] hover:bg-[#F4C542]/90 border-2 border-[#152238] text-[#152238] rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                                                                title="Xem chi tiết câu hỏi"
                                                            >
                                                                <span>Xem chi tiết</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteOfficialBank(b)}
                                                                className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-xl font-bold text-xs transition-all shadow-sm flex items-center justify-center"
                                                                title="Xóa bộ đề"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center text-gray-500 bg-gray-50 rounded-2xl">
                                <p className="text-base font-semibold">Chưa có bộ đề chính thức nào được duyệt</p>
                                <p className="text-xs text-gray-400 mt-1">Khi Giảng viên nhấn "Duyệt" trên các câu hỏi ở Kênh Tạo Đề AI, hệ thống sẽ tự động tổng hợp vào đây.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL CHỈNH SỬA CÂU HỎI TRƯỚC KHI DUYỆT */}
            <ModalPortal>
                <AnimatePresence>
                    {editingQuestion && (
                        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-100"
                            >
                                <div className="p-6 border-b bg-white shrink-0 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-[#F4C542]/20 text-[#152238] rounded-xl">
                                            <Edit2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-extrabold text-gray-900">Xem & Chỉnh Sửa Câu Hỏi #{editingQuestion.id}</h3>
                                            <p className="text-xs text-gray-500">Giảng viên chỉnh sửa chính xác các đáp án trước khi chốt lưu/duyệt</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setEditingQuestion(null)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                                    <form id="edit-question-form" onSubmit={handleSaveEditQuestion} className="space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Độ khó câu hỏi</label>
                                                <select
                                                    value={editingQuestion.do_kho || 'Medium'}
                                                    onChange={e => setEditingQuestion({ ...editingQuestion, do_kho: e.target.value })}
                                                    className="w-full p-3 bg-gray-50 border rounded-xl font-medium text-sm focus:ring-2 focus:ring-indigo-500"
                                                >
                                                    <option value="Easy">🟢 Dễ (Easy)</option>
                                                    <option value="Medium">🟡 Trung bình (Medium)</option>
                                                    <option value="Hard">🔴 Khó (Hard)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Chủ đề / Chương</label>
                                                <input
                                                    type="text"
                                                    value={editingQuestion.chu_de || ''}
                                                    onChange={e => setEditingQuestion({ ...editingQuestion, chu_de: e.target.value })}
                                                    placeholder="VD: Chương 1..."
                                                    className="w-full p-3 bg-gray-50 border rounded-xl font-medium text-sm focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                                Nội dung câu hỏi <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                rows="3"
                                                required
                                                value={editingQuestion.noi_dung}
                                                onChange={e => setEditingQuestion({ ...editingQuestion, noi_dung: e.target.value })}
                                                className="w-full p-3.5 bg-gray-50 border rounded-xl font-medium text-sm focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>

                                        {/* 4 ĐÁP ÁN */}
                                        <div className="space-y-3">
                                            <label className="block text-sm font-bold text-gray-700">
                                                Chỉnh sửa 4 đáp án (Chọn tròn vào đáp án đúng nhất) <span className="text-red-500">*</span>
                                            </label>
                                            {editingQuestion.options && editingQuestion.options.map((opt, idx) => (
                                                <div key={idx} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${opt.is_correct ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-300' : 'bg-gray-50 border-gray-200'}`}>
                                                    <input
                                                        type="radio"
                                                        name="edit-correct-option"
                                                        checked={opt.is_correct || false}
                                                        onChange={() => handleOptionCorrectChange(idx)}
                                                        className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                    />
                                                    <span className="w-7 h-7 rounded-lg bg-white border font-extrabold flex items-center justify-center text-xs text-gray-700">
                                                        {String.fromCharCode(65 + idx)}
                                                    </span>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={opt.text || ''}
                                                        onChange={e => handleOptionTextChange(idx, e.target.value)}
                                                        placeholder={`Nhập nội dung đáp án ${String.fromCharCode(65 + idx)}...`}
                                                        className="flex-1 p-2 bg-transparent border-0 focus:ring-0 font-medium text-sm"
                                                    />
                                                    {opt.is_correct && <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md">Đáp án đúng</span>}
                                                </div>
                                            ))}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Giải thích chi tiết</label>
                                            <textarea
                                                rows="2"
                                                value={editingQuestion.giai_thich || ''}
                                                onChange={e => setEditingQuestion({ ...editingQuestion, giai_thich: e.target.value })}
                                                placeholder="Nhập lời giải thích tại sao đáp án lại đúng..."
                                                className="w-full p-3 bg-gray-50 border rounded-xl font-medium text-sm focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </form>
                                </div>

                                <div className="flex items-center justify-end gap-3 p-5 border-t bg-gray-50 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setEditingQuestion(null)}
                                        className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl text-sm transition-all"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        type="submit"
                                        form="edit-question-form"
                                        disabled={isSavingEdit}
                                        className="flex items-center gap-2 px-6 py-3 bg-[#152238] hover:bg-[#152238]/90 text-white font-bold rounded-xl text-sm shadow-md transition-all disabled:opacity-50"
                                    >
                                        <Save className="w-4 h-4" />
                                        <span>{isSavingEdit ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </ModalPortal>

            {/* MODAL XEM CHI TIẾT NGÂN HÀNG CÂU HỎI CHÍNH THỨC */}
            <ModalPortal>
                <AnimatePresence>
                    {viewingBank && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[88vh] overflow-hidden border border-gray-100"
                            >
                                {/* Header cố định không cuộn */}
                                <div className="p-6 border-b bg-white shrink-0 flex items-start justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">Ngân hàng đã duyệt</span>
                                            <span className="text-xs font-extrabold text-[#152238] bg-[#F4C542]/10 px-2.5 py-1 rounded-lg border border-gray-200">ID #{viewingBank.id}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <h3 className="text-xl font-extrabold text-gray-900">
                                                <span className="text-emerald-600 mr-1.5">[Đề #{viewingBank.id}]</span>
                                                {viewingBank.tieu_de}
                                            </h3>
                                            <button
                                                type="button"
                                                onClick={() => handleEditOfficialBankTitle(viewingBank)}
                                                className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg font-bold text-xs transition-all flex items-center gap-1"
                                                title="Đổi tên Ngân hàng"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                                <span>Sửa tên</span>
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Môn học: <strong className="text-gray-700">{viewingBank.TenMonHoc || viewingBank.ma_mon_hoc}</strong> • Lớp HP: <strong className="text-[#152238] font-mono">{viewingBank.ma_mon_hoc}</strong> • Giảng viên: <strong className="text-gray-700">{viewingBank.ma_giang_vien}</strong> • Tổng số: <strong className="text-emerald-600">{bankQuestions.length} câu</strong>
                                        </p>
                                    </div>
                                    <button type="button" onClick={() => setViewingBank(null)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Thân cuộn riêng biệt cho danh sách câu hỏi */}
                                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 bg-gray-50/60">
                                    {loadingBankQs ? (
                                        <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
                                            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                                            <span>Đang tải danh sách câu hỏi...</span>
                                        </div>
                                    ) : bankQuestions.length > 0 ? (
                                        <div className="space-y-4">
                                            {bankQuestions.map((q, qIdx) => (
                                                <div key={q.id || qIdx} className="p-5 rounded-2xl border border-gray-200/80 bg-white shadow-sm space-y-3 hover:border-gray-300 transition-all">
                                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-extrabold text-[#152238] text-sm">Câu #{qIdx + 1} ({q.do_kho || 'Medium'})</span>
                                                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-black ${
                                                                q.ai_generated || String(q.nguon || '').includes('AI')
                                                                    ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                                                                    : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                                            }`}>
                                                                {q.ai_generated || String(q.nguon || '').includes('AI') ? 'AI Gợi ý' : 'Giảng viên'}
                                                            </span>
                                                            {q.chu_de && <span className="text-xs bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-md font-semibold text-gray-600">{q.chu_de}</span>}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditingQuestion({ ...q })}
                                                                className="p-1.5 px-3 bg-[#F4C542]/20 hover:bg-[#F4C542]/30 text-[#152238] rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all"
                                                                title="Sửa câu hỏi này"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                                <span>Sửa</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteBankQuestion(q)}
                                                                className="p-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-lg font-bold text-xs transition-all shadow-sm flex items-center justify-center"
                                                                title="Xóa câu hỏi khỏi Ngân hàng"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <p className="font-bold text-gray-900 text-sm leading-relaxed">{q.noi_dung}</p>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                                        {q.options && q.options.map((opt, oIdx) => (
                                                            <div key={oIdx} className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2.5 ${opt.la_dap_an_dung || opt.is_correct ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold shadow-sm' : 'bg-gray-50/80 border-gray-200 text-gray-700'}`}>
                                                                <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${opt.la_dap_an_dung || opt.is_correct ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                                                                    {String.fromCharCode(65 + oIdx)}
                                                                </span>
                                                                <span className="truncate">{opt.noi_dung || opt.text}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-12 text-center text-gray-500">
                                            Chưa có câu hỏi nào trong ngân hàng này
                                        </div>
                                    )}
                                </div>

                                {/* Footer cố định không cuộn */}
                                <div className="p-4 px-6 border-t bg-white shrink-0 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setViewingBank(null)}
                                        className="px-6 py-2.5 bg-[#152238] hover:bg-[#152238]/90 text-white font-bold rounded-xl text-sm shadow-md transition-all"
                                    >
                                        Đóng
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </ModalPortal>
        </div>
    );
}

export default QuestionBankManagement;