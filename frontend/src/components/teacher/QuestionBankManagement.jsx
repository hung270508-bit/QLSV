import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Edit, Edit2, Trash2, Search, X, FileText, CheckCircle2, AlertCircle, 
    Eye, Save, Sparkles, RefreshCw, CheckCheck, Filter, BookOpen, Layers, 
    Clock, ArrowRight, UploadCloud, Check, HelpCircle, FolderCheck, Play, 
    BarChart2, CheckSquare, AlertTriangle, ChevronRight, Bookmark
} from 'lucide-react';
import axios from 'axios';
import ModalPortal, { Toast, ConfirmDialog } from '../common/ModalPortal';
import API_URL from '../../api';

function QuestionBankManagement() {
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

    const showCustomAlert = (message, title = '⚠️ Thông báo kiểm tra dữ liệu') => {
        setPopupAlert({ show: true, title, message });
        showToast(message, 'error');
    };

    const [sessions, setSessions] = useState([]);
    const [currentSession, setCurrentSession] = useState(null);
    const [stagingQuestions, setStagingQuestions] = useState([]);
    const [officialBanks, setOfficialBanks] = useState([]);
    
    // Cập nhật State để bắt được Lớp học phần
    const [uploadForm, setUploadForm] = useState({
        ma_mon_hoc: '',
        ma_lop_hoc_phan: [],
        tieu_de: '',
        so_cau_yeu_cau: 10,
        do_kho: 'Mixed',
        chu_de: 'Toàn bộ',
        file: null,
        file_name: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [isUploading, setIsUploading] = useState(false);
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
        try {
            const res = await axios.get(`${API_URL}/api/ai-exams/sessions/teacher/${teacherId}`);
            const list = res.data?.data || [];
            setSessions(list);
            if (!currentSession && list.length > 0) {
                setCurrentSession(list[0]);
            }
        } catch (error) {
            console.error('Lỗi lấy danh sách đề AI:', error);
        }
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
        try {
            const params = {};
            if (filterStatus !== 'All') params.trang_thai = filterStatus;
            if (filterDifficulty !== 'All') params.do_kho = filterDifficulty;
            
            const res = await axios.get(`${API_URL}/api/ai-exams/sessions/${sessionId}/questions`, { params });
            setStagingQuestions(res.data?.data || []);
        } catch (error) {
            console.error('Lỗi lấy câu hỏi đề AI:', error);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const ext = file.name.toLowerCase();
        if (!ext.endsWith('.docx') && !ext.endsWith('.doc')) {
            setFormErrors(prev => ({ ...prev, file: 'Bắt buộc định dạng Word (.doc, .docx). Không hỗ trợ ảnh hay PDF.' }));
            showCustomAlert('Bắt buộc định dạng Word (.doc, .docx). Không hỗ trợ ảnh hay PDF.', '⚠️ Định dạng file không hợp lệ');
            e.target.value = '';
            return;
        }

        setFormErrors(prev => ({ ...prev, file: '' }));
        setUploadForm(prev => ({
            ...prev,
            file: file,
            file_name: file.name,
            tieu_de: prev.tieu_de || file.name.replace(/\.[^/.]+$/, "")
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
                '⚠️ Đang mở một đề làm việc'
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
                '⚠️ Đang có bộ đề chưa tạo xong'
            );
        }

        const errors = {};
        const tieuDe = (uploadForm.tieu_de || '').trim();
        const chuDe = (uploadForm.chu_de || '').trim();
        const forbiddenChars = /[@#$%^&*!~`+=|<>?]/;
        const soCau = Number(uploadForm.so_cau_yeu_cau);

        if (!uploadForm.ma_mon_hoc && !tieuDe && !uploadForm.file) {
            errors.ma_mon_hoc = 'Vui lòng chọn Môn học / Lớp học phần được phân công!';
            errors.tieu_de = 'Vui lòng nhập tiêu đề bộ đề / tài liệu!';
            errors.file = 'Bắt buộc định dạng Word (.doc, .docx). Không hỗ trợ ảnh hay PDF.';
            setFormErrors(errors);
            return showCustomAlert('Vui lòng nhập đầy đủ thông tin: Chọn môn học, nhập tiêu đề bộ đề và tải lên file Word (.doc, .docx)!', '⚠️ Thiếu thông tin bắt buộc');
        }

        if (!uploadForm.ma_mon_hoc) {
            errors.ma_mon_hoc = 'Vui lòng chọn Môn học / Lớp học phần được phân công!';
        }

        if (!tieuDe || tieuDe.length < 10 || tieuDe.length > 50) {
            errors.tieu_de = 'Tiêu đề bộ đề / tài liệu phải từ 10 đến 50 ký tự!';
        } else if (forbiddenChars.test(tieuDe)) {
            errors.tieu_de = 'Tiêu đề bộ đề không được chứa ký tự đặc biệt (@, #, $, %, ...)!';
        }

        if (!uploadForm.file) {
            errors.file = 'Bắt buộc định dạng Word (.doc, .docx). Không hỗ trợ ảnh hay PDF.';
        } else {
            const ext = uploadForm.file.name.toLowerCase();
            if (!ext.endsWith('.doc') && !ext.endsWith('.docx')) {
                errors.file = 'Bắt buộc định dạng Word (.doc, .docx). Không hỗ trợ ảnh hay PDF.';
            }
        }

        if (chuDe && chuDe !== 'Toàn bộ') {
            if (chuDe.length < 10 || chuDe.length > 50) {
                errors.chu_de = 'Chủ đề / Chương phải từ 10 đến 50 ký tự!';
            } else if (forbiddenChars.test(chuDe)) {
                errors.chu_de = 'Chủ đề / Chương không được chứa ký tự đặc biệt!';
            }
        }

        if (!soCau || isNaN(soCau) || soCau < 1 || soCau > 100) {
            errors.so_cau_yeu_cau = 'Tổng số câu hỏi muốn tạo phải là số từ 1 đến tối đa 100 câu!';
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            if (errors.file && !uploadForm.file) {
                return showCustomAlert('Bắt buộc định dạng Word (.doc, .docx). Không hỗ trợ ảnh hay PDF.', '⚠️ Chưa chọn file tài liệu');
            } else if (errors.file) {
                return showCustomAlert(errors.file, '⚠️ Định dạng file không hợp lệ');
            }
            return showCustomAlert('Vui lòng kiểm tra lại và điền đầy đủ các mục bị báo lỗi đỏ bên dưới biểu mẫu!', '⚠️ Thiếu hoặc sai thông tin bắt buộc');
        }

        setFormErrors({});

        setIsUploading(true);
        try {
            // Nối thêm LHP vào tiêu đề nếu có chọn LHP để phân biệt rạch ròi
            const finalTieuDe = uploadForm.ma_lop_hoc_phan && uploadForm.ma_lop_hoc_phan.length > 0
                ? `${tieuDe} [${uploadForm.ma_lop_hoc_phan.map(code => code.split('.').pop()).join(', ')}]` 
                : tieuDe;

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
                        ma_giang_vien: teacherId || 'GVCNTT001',
                        so_cau_yeu_cau: soCau,
                        do_kho: uploadForm.do_kho,
                        chu_de: chuDe || 'Toàn bộ',
                        auto_generate: autoGen
                    });

                    if (startRes.data?.success) {
                        const newSession = startRes.data.data;
                        showToast(autoGen ? 'Khởi tạo bộ đề AI thành công! Đã tạo xong batch câu hỏi đầu tiên.' : 'Khởi tạo bộ đề AI thành công! Hãy nhấn "Sinh Tiếp 10 Câu" để bắt đầu.', 'success');
                        setSessions(prev => [newSession, ...prev]);
                        setCurrentSession(newSession);
                        
                        setUploadForm({
                            ma_mon_hoc: '',
                            ma_lop_hoc_phan: [],
                            tieu_de: '',
                            so_cau_yeu_cau: 10,
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
                    showToast(error.response?.data?.message || error.message || 'Có lỗi xảy ra khi tạo câu hỏi AI!', 'error');
                } finally {
                    setIsUploading(false);
                }
            };

            if (isRelevant === false) {
                setIsUploading(false);
                setConfirmDialog({
                    show: true,
                    title: '⚠️ Cảnh báo: Tài liệu có thể không phù hợp',
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
                    title: '✅ Kiểm duyệt thành công',
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
            showToast(error.response?.data?.message || error.message || 'Có lỗi xảy ra khi tạo câu hỏi AI!', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleResumeSession = async () => {
        if (!currentSession) return;
        setIsResuming(true);
        showToast('AI đang phân tích các câu cũ và tạo tiếp 10 câu hỏi mới không trùng lặp...', 'info');
        try {
            const res = await axios.post(`${API_URL}/api/ai-exams/sessions/${currentSession.id}/resume`);
            if (res.data?.success) {
                const updatedSession = res.data.data;
                setCurrentSession(updatedSession);
                setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
                await fetchStagingQuestions(updatedSession.id);
                showToast('⚡ Đã sinh thêm 10 câu hỏi thành công!', 'success');
            } else {
                throw new Error(res.data?.message || 'Lỗi khi sinh tiếp câu hỏi');
            }
        } catch (error) {
            console.error('Lỗi resume AI session:', error);
            showToast(error.response?.data?.message || error.message || 'Lỗi khi yêu cầu AI sinh tiếp câu hỏi!', 'error');
        } finally {
            setIsResuming(false);
        }
    }; 

    const handleSelectSessionFromHistory = async (s) => {
        try {
            const res = await axios.get(`${API_URL}/api/ai-exams/sessions/${s.id}/questions`);
            const qs = res.data?.data || [];
            const allApproved = qs.length > 0 && qs.every(q => q.trang_thai === 'APPROVED');
            
            if (allApproved || s.trang_thai === 'COMPLETED') {
                const bankTitle = s.tieu_de || `Bộ đề AI - ${s.TenMonHoc || s.ma_mon_hoc}`;
                const matchingBank = officialBanks.find(b => b.tieu_de === s.tieu_de || b.tieu_de === bankTitle || b.tieu_de.includes(s.tieu_de) || b.ma_mon_hoc === s.ma_mon_hoc) || officialBanks[0];
                if (matchingBank) {
                    showToast(`📚 Bộ đề #${s.id} đã hoàn tất duyệt! Đang mở Ngân hàng chính thức: "${matchingBank.tieu_de}"`, 'info');
                    setActiveTab('history');
                    handleViewBank(matchingBank);
                    return;
                }
            }
            setCurrentSession(s);
            setStagingQuestions(qs);
            showToast(`Đã tải lại bộ đề #${s.id}: ${s.doc_tieu_de || s.tieu_de}`, 'info');
        } catch (error) {
            console.error('Lỗi khi kiểm tra bộ đề AI:', error);
            setCurrentSession(s);
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
            return { text: 'Lỗi AI (Có thể thử lại)', color: 'text-rose-700 bg-rose-100 border-rose-300' };
        }
        return { text: 'Sẵn sàng / Chờ sinh tiếp', color: 'text-amber-700 bg-amber-100 border-amber-300' };
    };

    const displayedQuestions = stagingQuestions.filter(q => {
        if (q.trang_thai === 'APPROVED') return false; 
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

    const groupedOfficialBanks = officialBanks.reduce((groups, b) => {
        const subjectKey = b.TenMonHoc ? `${b.TenMonHoc} (${b.ma_mon_hoc})` : (b.ma_mon_hoc || 'Môn học khác');
        if (!groups[subjectKey]) groups[subjectKey] = [];
        groups[subjectKey].push(b);
        return groups;
    }, {});

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

            <AnimatePresence>
                {popupAlert.show && (
                    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5 border border-amber-200"
                        >
                            <div className="flex items-center gap-3 border-b pb-4">
                                <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                                    
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{popupAlert.title}</h3>
                                    <p className="text-xs text-gray-500">Thông báo từ Quản lý Sinh viên</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-700 font-medium leading-relaxed">{popupAlert.message}</p>
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

            <AnimatePresence>
                {renameDialog.show && (
                    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5 border border-gray-100"
                        >
                            <div className="flex items-center gap-3 border-b pb-4">
                                <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl">
                                    
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

            {/* HEADER & TABS */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#F4C542] p-6 rounded-3xl text-[#152238] shadow-xl">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-[#152238]">AI Assisted Question Bank Studio</h1>
                            <p className="text-sm font-medium text-[#152238]/80">Trợ lý AI phân tích tài liệu Word và hỗ trợ Giảng viên xây dựng bộ đề thi trắc nghiệm</p>
                        </div>
                    </div>
                </div>

                <div className="flex bg-[#152238]/10 p-1.5 rounded-2xl self-start md:self-auto">
                    <button
                        onClick={() => setActiveTab('studio')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                            activeTab === 'studio'
                                ? 'bg-[#152238] text-white shadow-lg font-bold'
                                : 'text-[#152238]/70 hover:text-[#152238] hover:bg-white/50'
                        }`}
                    >
                        <span>Studio Tạo Đề AI (Nháp)</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                            activeTab === 'history'
                                ? 'bg-[#152238] text-white shadow-lg font-bold'
                                : 'text-[#152238]/70 hover:text-[#152238] hover:bg-white/50'
                        }`}
                    >
                        <span>Ngân Hàng Chính Thức ({officialBanks.length})</span>
                    </button>
                </div>
            </div>

            {/* CONTENT TABS */}
            {activeTab === 'studio' ? (
                <div className="space-y-8">
                    {/* KHUNG 1 & 2: FORM UPLOAD & CẤU HÌNH AI */}
                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
                        <div className="flex items-center gap-3 border-b pb-4">
                            
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Khung Tải Lên Tài Liệu & Cấu Hình Trợ Lý AI</h2>
                                <p className="text-sm text-gray-500">Tải file Word tài liệu môn học và thiết lập thông số để AI tạo câu hỏi từng đợt (10 câu/lần)</p>
                            </div>
                        </div>

                        <form onSubmit={handleStartAISession} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2 lg:col-span-1">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Môn học phân công <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={uploadForm.ma_mon_hoc}
                                    onChange={e => {
                                        setUploadForm({ ...uploadForm, ma_mon_hoc: e.target.value, ma_lop_hoc_phan: [] });
                                        setFormErrors(prev => ({ ...prev, ma_mon_hoc: '' }));
                                    }}
                                    className={`w-full p-3.5 bg-gray-50 border rounded-2xl focus:ring-2 focus:bg-white transition-all text-sm font-medium ${
                                        formErrors.ma_mon_hoc ? 'border-red-500 focus:ring-red-500 bg-red-50/30' : 'border-gray-200 focus:ring-indigo-500'
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
                                    <p className="text-xs text-red-600 font-bold animate-pulse">❌ {formErrors.ma_mon_hoc}</p>
                                ) : (
                                    <p className="text-xs text-[#152238] font-medium">💡 Lấy tự động từ phân công giảng dạy của Admin</p>
                                )}

                                {uploadForm.ma_mon_hoc && assignments.some(a => a.MaMonHoc === uploadForm.ma_mon_hoc && a.MaLopHocPhan) && (
                                    <div className="mt-4 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                                        <label className="block text-xs font-bold text-indigo-900 mb-2">
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
                                                        className={`cursor-pointer px-3 py-1.5 border rounded-lg text-xs font-bold transition-all ${
                                                            isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50/30'
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
                                                                setUploadForm({...uploadForm, ma_lop_hoc_phan: newLhp});
                                                            }}
                                                        />
                                                        {hpCode} - {className}
                                                    </label>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 lg:col-span-1">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Tiêu đề bộ đề / tài liệu <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="VD: Ngân hàng đề thi Giữa kỳ Lập trình Web..."
                                    value={uploadForm.tieu_de}
                                    onChange={e => {
                                        setUploadForm({ ...uploadForm, tieu_de: e.target.value });
                                        setFormErrors(prev => ({ ...prev, tieu_de: '' }));
                                    }}
                                    className={`w-full p-3.5 bg-gray-50 border rounded-2xl focus:ring-2 focus:bg-white transition-all text-sm ${
                                        formErrors.tieu_de ? 'border-red-500 focus:ring-red-500 bg-red-50/30 font-semibold text-red-900' : 'border-gray-200 focus:ring-indigo-500'
                                    }`}
                                />
                                {formErrors.tieu_de ? (
                                    <p className="text-xs text-red-600 font-bold animate-pulse">❌ {formErrors.tieu_de}</p>
                                ) : (
                                    <p className="text-xs text-emerald-600 font-bold">✨ Tên LHP sẽ được tự động nối vào tiêu đề nếu có chọn.</p>
                                )}
                            </div>

                            <div className="space-y-2 lg:col-span-1">
                                <label className="block text-sm font-semibold text-gray-700">
                                    File tài liệu Word (.doc, .docx) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".doc,.docx"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        id="word-upload-input"
                                    />
                                    <label
                                        htmlFor="word-upload-input"
                                        className={`flex items-center justify-between p-3.5 border border-dashed rounded-2xl cursor-pointer transition-all ${
                                            formErrors.file
                                                ? 'bg-red-50 border-red-500 text-red-900 font-bold'
                                                : uploadForm.file 
                                                    ? 'bg-[#F4C542]/10 border-[#152238]/50 text-indigo-900 font-medium' 
                                                    : 'bg-gray-50 border-gray-300 hover:bg-gray-100 text-gray-600'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            
                                            <span className="text-sm truncate">
                                                {uploadForm.file_name || 'Chọn hoặc kéo thả file Word (.docx)'}
                                            </span>
                                        </div>
                                        <span className={`text-xs px-2.5 py-1 rounded-lg border shadow-sm font-semibold flex-shrink-0 ${formErrors.file ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600'}`}>
                                            Duyệt file
                                        </span>
                                    </label>
                                </div>
                                <p className={`text-xs font-bold transition-all ${formErrors.file ? 'text-red-600 animate-pulse text-sm' : 'text-rose-600 font-medium'}`}>
                                    {formErrors.file ? `❌ ${formErrors.file}` : '⚠️ Bắt buộc định dạng Word. Không hỗ trợ ảnh hay PDF.'}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Tổng số câu hỏi muốn AI hỗ trợ tạo (Tối đa 100 câu)
                                </label>
                                <input
                                    type="number"
                                    placeholder="Nhập số câu (1-100)..."
                                    value={uploadForm.so_cau_yeu_cau}
                                    onChange={e => {
                                        setFormErrors(prev => ({ ...prev, so_cau_yeu_cau: '' }));
                                        const val = e.target.value;
                                        if (val === '') {
                                            setUploadForm({ ...uploadForm, so_cau_yeu_cau: '' });
                                        } else {
                                            const num = parseInt(val, 10);
                                            if (!isNaN(num)) {
                                                setUploadForm({ ...uploadForm, so_cau_yeu_cau: Math.min(100, num) });
                                            }
                                        }
                                    }}
                                    className={`w-full p-3.5 bg-gray-50 border rounded-2xl focus:ring-2 focus:bg-white transition-all text-sm font-bold ${
                                        formErrors.so_cau_yeu_cau ? 'border-red-500 focus:ring-red-500 bg-red-50/30 text-red-900' : 'border-gray-200 focus:ring-indigo-500 text-indigo-900'
                                    }`}
                                />
                                {formErrors.so_cau_yeu_cau ? (
                                    <p className="text-xs text-red-600 font-bold animate-pulse">❌ {formErrors.so_cau_yeu_cau}</p>
                                ) : (
                                    <p className="text-xs text-gray-500">AI sẽ tự động đọc tài liệu và sinh ra một lần đủ số lượng câu hỏi theo yêu cầu.</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Cấu trúc mức độ độ khó
                                </label>
                                <select
                                    value={uploadForm.do_kho}
                                    onChange={e => setUploadForm({ ...uploadForm, do_kho: e.target.value })}
                                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-medium"
                                >
                                    <option value="Mixed">⚡ Tự phân chia hợp lý (Dễ, Trung bình, Khó)</option>
                                    <option value="Easy">🟢 Toàn bộ mức Dễ (Easy)</option>
                                    <option value="Medium">🟡 Toàn bộ mức Trung bình (Medium)</option>
                                    <option value="Hard">🔴 Toàn bộ mức Khó (Hard)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Chủ đề / Chương (Mặc định Toàn bộ)
                                </label>
                                <input
                                    type="text"
                                    placeholder="VD: Chương 1 - Tổng quan về NodeJS..."
                                    value={uploadForm.chu_de}
                                    onChange={e => {
                                        setUploadForm({ ...uploadForm, chu_de: e.target.value });
                                        setFormErrors(prev => ({ ...prev, chu_de: '' }));
                                    }}
                                    className={`w-full p-3.5 bg-gray-50 border rounded-2xl focus:ring-2 focus:bg-white transition-all text-sm ${
                                        formErrors.chu_de ? 'border-red-500 focus:ring-red-500 bg-red-50/30 font-semibold text-red-900' : 'border-gray-200 focus:ring-indigo-500'
                                    }`}
                                />
                                {formErrors.chu_de && (
                                    <p className="text-xs text-red-600 font-bold animate-pulse">❌ {formErrors.chu_de}</p>
                                )}
                            </div>

                            <div className="md:col-span-2 lg:col-span-3 pt-2 flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleStartAISession}
                                    disabled={isUploading}
                                    className="flex items-center justify-center gap-3 w-full md:w-auto px-8 py-4 bg-[#152238] hover:bg-[#152238]/90 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {isUploading ? (
                                        <>
                                            <span>AI Đang Phân Tích & Tạo Câu Hỏi...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Bắt Đầu Tạo Câu Hỏi AI</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* DANH SÁCH CÁC BỘ ĐỀ TẠO ĐỀ AI - HIỂN THỊ GOM NHÓM THEO MÔN */}
                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
                        <div className="flex items-center justify-between border-b pb-4">
                            <div className="flex items-center gap-3">
                                
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">🕒 Lịch Sử Các Bộ Đề Tải Lên & Sinh Đề Nháp ({sessions.length})</h2>
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
                                                            <span>{s.trang_thai === 'COMPLETED' ? '✓ Đã vào Ngân Hàng (Xem)' : 'Nhấn để mở / Tiếp tục tạo'}</span>
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

                    {/* KHUNG 3: THANH TIẾN ĐỘ BỘ ĐỀ & THAO TÁC HÀNG LOẠT */}
                    {currentSession ? (
                        <div className="bg-gradient-to-br from-indigo-900/5 via-purple-900/5 to-blue-900/5 rounded-3xl p-6 md:p-8 border border-indigo-100 shadow-sm space-y-6">
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

                                    {currentSession.so_cau_da_sinh < currentSession.so_cau_yeu_cau && currentSession.trang_thai !== 'COMPLETED' && (
                                        <button
                                            onClick={handleResumeSession}
                                            disabled={isResuming}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md transform hover:-translate-y-0.5 transition-all disabled:opacity-50 text-sm"
                                        >
                                            <Play className={`w-4 h-4 fill-current ${isResuming ? 'animate-spin' : ''}`} />
                                            <span>{isResuming ? 'Đang tạo tiếp...' : `⚡ Sinh Tiếp 10 Câu (${currentSession.so_cau_da_sinh}/${currentSession.so_cau_yeu_cau})`}</span>
                                        </button>
                                    )}

                                    {stagingQuestions.some(q => q.trang_thai === 'PENDING') && (
                                        <button
                                            onClick={handleApproveAll}
                                            disabled={isApprovingAll}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-md transform hover:-translate-y-0.5 transition-all disabled:opacity-50 text-sm"
                                        >
                                            <CheckCheck className="w-4 h-4" />
                                            <span>{isApprovingAll ? 'Đang duyệt...' : '✓ Duyệt Tất Cả Vào Ngân Hàng'}</span>
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
                                                                <span className="font-bold">💡 Giải thích từ AI: </span>
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
                                                            title="Xem và chỉnh sửa chi tiết câu hỏi trước khi chốt"
                                                            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#F4C542]/10 hover:bg-[#F4C542]/20 text-[#152238] font-bold rounded-xl text-xs transition-all border border-gray-200 w-full md:w-32"
                                                        >
                                                            
                                                            <span>Chỉnh sửa</span>
                                                        </button>


                                                        <button
                                                            onClick={() => handleDeleteQuestion(q)}
                                                            title="Xóa câu hỏi khỏi danh sách"
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
                                                                    {b.created_at ? `${new Date(b.created_at).toLocaleDateString('vi-VN')} ${new Date(b.created_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}` : 'Vừa mới tạo'}
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
            <AnimatePresence>
                {editingQuestion && (
                    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between border-b pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-[#F4C542]/20 text-[#152238] rounded-xl">
                                        
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-extrabold text-gray-900">Xem & Chỉnh Sửa Câu Hỏi #{editingQuestion.id}</h3>
                                        <p className="text-xs text-gray-500">Giảng viên chỉnh sửa chính xác các đáp án trước khi chốt lưu/duyệt</p>
                                    </div>
                                </div>
                                <button onClick={() => setEditingQuestion(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl">
                                    
                                </button>
                            </div>

                            <form onSubmit={handleSaveEditQuestion} className="space-y-5">
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
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Nội dung câu hỏi <span className="text-red-500">*</span></label>
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

                                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={() => setEditingQuestion(null)}
                                        className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-all"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSavingEdit}
                                        className="flex items-center gap-2 px-6 py-3 bg-[#152238] hover:bg-[#152238]/90 text-white font-bold rounded-xl text-sm shadow-md transition-all disabled:opacity-50"
                                    >
                                        <Save className="w-4 h-4" />
                                        <span>{isSavingEdit ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL XEM CHI TIẾT NGÂN HÀNG CÂU HỎI CHÍNH THỨC */}
            <AnimatePresence>
                {viewingBank && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between border-b pb-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">Ngân hàng đã duyệt</span>
                                        <span className="text-xs font-extrabold text-[#152238] bg-[#F4C542]/10 px-2.5 py-1 rounded-lg border border-gray-200">ID #{viewingBank.id}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <h3 className="text-xl font-extrabold text-gray-900"><span className="text-emerald-600 mr-1.5">[Đề #{viewingBank.id}]</span>{viewingBank.tieu_de}</h3>
                                        <button
                                            onClick={() => handleEditOfficialBankTitle(viewingBank)}
                                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg font-bold text-xs transition-all"
                                            title="Đổi tên Ngân hàng"
                                        >
                                            
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Môn học: <strong className="text-gray-700">{viewingBank.TenMonHoc || viewingBank.ma_mon_hoc}</strong> • Lớp HP: <strong className="text-[#152238] font-mono">{viewingBank.ma_mon_hoc}</strong> • Giảng viên: <strong className="text-gray-700">{viewingBank.ma_giang_vien}</strong> • Tổng số: <strong className="text-emerald-600">{bankQuestions.length} câu</strong>
                                    </p>
                                </div>
                                <button onClick={() => setViewingBank(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl">
                                    
                                </button>
                            </div>

                            {loadingBankQs ? (
                                <div className="p-12 text-center text-gray-500">
                                    
                                    <span>Đang tải danh sách câu hỏi...</span>
                                </div>
                            ) : bankQuestions.length > 0 ? (
                                <div className="space-y-4">
                                    {bankQuestions.map((q, qIdx) => (
                                        <div key={q.id || qIdx} className="p-5 rounded-2xl border bg-gray-50/50 space-y-3 hover:border-gray-200 transition-all">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-extrabold text-indigo-900 text-sm">Câu #{qIdx + 1} ({q.do_kho || 'Medium'})</span>
                                                    {q.chu_de && <span className="text-xs bg-white border px-2.5 py-1 rounded-md font-semibold text-gray-600">{q.chu_de}</span>}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingQuestion({ ...q })}
                                                        className="p-1.5 bg-[#F4C542]/10 hover:bg-[#F4C542]/20 text-[#152238] rounded-lg font-bold text-xs flex items-center gap-1 transition-all"
                                                        title="Sửa câu hỏi này"
                                                    >
                                                        
                                                        <span>Sửa</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteBankQuestion(q)}
                                                        className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-lg font-bold text-xs transition-all shadow-sm flex items-center justify-center"
                                                        title="Xóa câu hỏi khỏi Ngân hàng"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="font-bold text-gray-900 text-sm">{q.noi_dung}</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {q.options && q.options.map((opt, oIdx) => (
                                                    <div key={oIdx} className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${opt.la_dap_an_dung || opt.is_correct ? 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold' : 'bg-white border-gray-200 text-gray-700'}`}>
                                                        <span className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center font-bold text-[10px]">
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

                            <div className="flex justify-end pt-4 border-t">
                                <button
                                    onClick={() => setViewingBank(null)}
                                    className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-sm"
                                >
                                    Đóng
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default QuestionBankManagement;