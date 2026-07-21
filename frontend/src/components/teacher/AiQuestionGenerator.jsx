import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, UploadCloud, FileText, CheckCircle2, AlertCircle, RefreshCw,
    ArrowRight, Check, HelpCircle, Clock, BookOpen, Layers, Plus, Save,
    FolderPlus, Copy, Edit3, Trash2, CheckSquare, ChevronRight, AlertTriangle
} from 'lucide-react';
import axios from 'axios';
import API_URL from '../../api';

function AiQuestionGenerator({ officialBanks = [], refreshBanks, subjects = [], assignments = [], teacherId }) {
    // Left Panel State: AI Advisor
    const [documents, setDocuments] = useState([]);
    const [selectedDocId, setSelectedDocId] = useState('');
    const [uploadFile, setUploadFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    
    const [advisorConfig, setAdvisorConfig] = useState({
        mon_hoc_id: '',
        chuong_id: 'Toàn bộ',
        do_kho: 'Mixed',
        so_luong: 10
    });
    
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState('');
    const [expiresAt, setExpiresAt] = useState(null);
    const [recoverSessionId, setRecoverSessionId] = useState('');
    const [showRecoverBox, setShowRecoverBox] = useState(false);

    // Right Panel State: Manual Editor & Bank Target
    const [targetBankId, setTargetBankId] = useState('');
    const [isCreatingBank, setIsCreatingBank] = useState(false);
    const [newBankForm, setNewBankForm] = useState({ tieu_de: '', ma_mon_hoc: '', ma_lop_hoc_phan: '' });
    const [isSavingBank, setIsSavingBank] = useState(false);

    const [manualForm, setManualForm] = useState({
        chu_de: 'Chung',
        do_kho: 'Medium',
        noi_dung: '',
        giai_thich: '',
        options: [
            { text: '', is_correct: false },
            { text: '', is_correct: true },
            { text: '', is_correct: false },
            { text: '', is_correct: false }
        ]
    });
    const [isSavingQuestion, setIsSavingQuestion] = useState(false);
    const [savedQuestionsList, setSavedQuestionsList] = useState([]);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false }), 3500);
    };

    // Load documents list
    const fetchDocuments = async () => {
        if (!teacherId) return;
        try {
            const res = await axios.get(`${API_URL}/api/ai-exams/documents/teacher/${teacherId}`);
            if (res.data?.success) {
                setDocuments(res.data.data || []);
            }
        } catch (err) {
            console.error('Lỗi tải danh sách tài liệu:', err);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [teacherId]);

    // Helper to upload file directly
    const uploadFileDirect = async (fileToUpload) => {
        if (!fileToUpload || !advisorConfig.mon_hoc_id) return null;
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('ma_mon_hoc', advisorConfig.mon_hoc_id);
        formData.append('ma_giang_vien', teacherId);
        formData.append('tieu_de', fileToUpload.name.replace(/\.[^/.]+$/, ''));
        const subjectObj = subjects.find(s => s.MaMonHoc === advisorConfig.mon_hoc_id);
        formData.append('ten_mon_hoc', subjectObj?.TenMonHoc || advisorConfig.mon_hoc_id);

        try {
            const res = await axios.post(`${API_URL}/api/ai-exams/documents/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data?.success && res.data.data?.id) {
                const newDocId = String(res.data.data.id);
                showToast(res.data.message || 'Tải lên tài liệu mới thành công!');
                setSelectedDocId(newDocId);
                setUploadFile(null);
                await fetchDocuments();
                return newDocId;
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Lỗi tải lên tài liệu';
            showToast(msg, 'error');
            setErrorMessage(msg);
        } finally {
            setIsUploading(false);
        }
        return null;
    };

    // Handle File Upload via button
    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!uploadFile) {
            showToast('Vui lòng chọn file Word (.doc, .docx)', 'error');
            return;
        }
        if (!advisorConfig.mon_hoc_id) {
            showToast('Vui lòng chọn môn học trước khi tải tài liệu', 'error');
            return;
        }
        await uploadFileDirect(uploadFile);
    };

    // Handle AI Suggestion request
    const handleRequestSuggestions = async () => {
        if (!advisorConfig.mon_hoc_id) {
            showToast('Vui lòng chọn môn học trước khi nhờ AI gợi ý', 'error');
            setErrorMessage('Vui lòng chọn môn học trước khi nhờ AI gợi ý');
            return;
        }

        setIsSuggesting(true);
        setErrorMessage('');
        try {
            let activeDocId = selectedDocId;
            // Nếu người dùng vừa chọn file mới mà chưa bấm "Tải Word", tự động tải lên và dùng ID mới luôn
            if (uploadFile) {
                const newId = await uploadFileDirect(uploadFile);
                if (newId) {
                    activeDocId = newId;
                } else {
                    setIsSuggesting(false);
                    return;
                }
            }

            const token = localStorage.getItem('token');
            const payload = {
                mon_hoc_id: advisorConfig.mon_hoc_id,
                chuong_id: advisorConfig.chuong_id || 'Toàn bộ',
                do_kho: advisorConfig.do_kho,
                so_luong: Number(advisorConfig.so_luong) || 10,
                document_id: activeDocId || undefined
            };

            const res = await axios.post(`${API_URL}/api/ai-exams/suggest-questions`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data?.success) {
                setSuggestions(res.data.goi_y || []);
                setCurrentSessionId(res.data.session_id || '');
                setExpiresAt(res.data.expires_at ? new Date(res.data.expires_at) : null);
                showToast(res.data.message || `AI đã gợi ý ${res.data.goi_y?.length || 0} câu hỏi!`);
            } else {
                const msg = res.data?.message || 'Không thể sinh gợi ý';
                showToast(msg, 'error');
                setErrorMessage(msg);
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Lỗi khi yêu cầu AI gợi ý';
            showToast(msg, 'error');
            setErrorMessage(msg);
        } finally {
            setIsSuggesting(false);
        }
    };

    // Handle Recover Session
    const handleRecoverSession = async () => {
        if (!recoverSessionId.trim()) {
            showToast('Vui lòng nhập Mã phiên gợi ý', 'error');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/ai-exams/suggestions/${recoverSessionId.trim()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data?.success) {
                setSuggestions(res.data.goi_y || []);
                setCurrentSessionId(res.data.session_id || '');
                setExpiresAt(res.data.expires_at ? new Date(res.data.expires_at) : null);
                setShowRecoverBox(false);
                showToast('Phục hồi phiên gợi ý thành công!');
            }
        } catch (err) {
            showToast(err.response?.data?.message || err.message || 'Không thể phục hồi phiên (có thể đã hết hạn 30 phút)', 'error');
        }
    };

    // Load AI suggestion into Manual Editor (Panel Right)
    const handleLoadToManualForm = (suggestion) => {
        const dapanDung = suggestion.dapan_dung || '';
        const dapanNhieu = Array.isArray(suggestion.dapan_nhieu) ? suggestion.dapan_nhieu : [];
        
        const allOpts = [
            { text: dapanDung, is_correct: true },
            ...dapanNhieu.slice(0, 3).map(text => ({ text, is_correct: false }))
        ];

        while (allOpts.length < 4) {
            allOpts.push({ text: '', is_correct: false });
        }

        setManualForm({
            chu_de: suggestion.chu_de || advisorConfig.chuong_id || 'Chung',
            do_kho: suggestion.do_kho || 'Medium',
            noi_dung: suggestion.cauhoi || '',
            giai_thich: suggestion.giai_thich || '',
            options: allOpts.slice(0, 4),
            ai_generated: true,
            nguon: 'AI Gợi ý'
        });
        showToast('Đã chuyển sang Form soạn thảo bên phải! Bạn có thể chỉnh sửa trước khi lưu.', 'success');
    };

    const handleDirectTransferSingle = async (suggestion) => {
        if (!targetBankId) {
            showToast('Vui lòng chọn hoặc tạo Ngân hàng câu hỏi đích bên Panel 2 trước khi chuyển đề AI', 'error');
            return;
        }
        const dapanDung = suggestion.dapan_dung || '';
        const dapanNhieu = Array.isArray(suggestion.dapan_nhieu) ? suggestion.dapan_nhieu : [];
        const allOpts = [
            { text: dapanDung, is_correct: true },
            ...dapanNhieu.slice(0, 3).map(text => ({ text, is_correct: false }))
        ];
        while (allOpts.length < 4) allOpts.push({ text: '', is_correct: false });

        setIsSavingQuestion(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/api/ai-exams/banks/${targetBankId}/questions`, {
                chu_de: suggestion.chu_de || advisorConfig.chuong_id || 'Chung',
                noi_dung: suggestion.cauhoi || '',
                giai_thich: suggestion.giai_thich || '',
                do_kho: suggestion.do_kho || 'Medium',
                options: allOpts.slice(0, 4),
                ai_generated: true,
                nguon: 'AI Gợi ý'
            }, { headers: { Authorization: `Bearer ${token}` } });

            if (res.data?.success) {
                showToast('Đã chuyển nhanh 1 câu hỏi AI vào Ngân hàng!', 'success');
                if (refreshBanks) refreshBanks();
                const savedQ = {
                    id: res.data.questionId || Date.now(),
                    noi_dung: suggestion.cauhoi || '',
                    do_kho: suggestion.do_kho || 'Medium',
                    chu_de: suggestion.chu_de || 'Chung',
                    bank_id: targetBankId,
                    ai_generated: true,
                    nguon: 'AI Gợi ý'
                };
                setSavedQuestionsList(prev => [savedQ, ...prev]);
            }
        } catch (err) {
            showToast(err.response?.data?.message || err.message || 'Lỗi khi chuyển câu hỏi AI', 'error');
        } finally {
            setIsSavingQuestion(false);
        }
    };

    const handleBatchTransferToBank = async () => {
        if (!targetBankId) {
            showToast('Vui lòng chọn hoặc tạo Ngân hàng câu hỏi đích bên Panel 2 trước khi chuyển cả bộ', 'error');
            return;
        }
        if (!suggestions || suggestions.length === 0) {
            showToast('Không có gợi ý nào để chuyển', 'error');
            return;
        }
        setIsSavingQuestion(true);
        try {
            const token = localStorage.getItem('token');
            const formattedList = suggestions.map(s => {
                const dapanDung = s.dapan_dung || '';
                const dapanNhieu = Array.isArray(s.dapan_nhieu) ? s.dapan_nhieu : [];
                const allOpts = [
                    { text: dapanDung, is_correct: true },
                    ...dapanNhieu.slice(0, 3).map(text => ({ text, is_correct: false }))
                ];
                while (allOpts.length < 4) allOpts.push({ text: '', is_correct: false });
                return {
                    chu_de: s.chu_de || advisorConfig.chuong_id || 'Chung',
                    noi_dung: s.cauhoi || '',
                    giai_thich: s.giai_thich || '',
                    do_kho: s.do_kho || 'Medium',
                    options: allOpts.slice(0, 4),
                    ai_generated: true,
                    nguon: 'AI Gợi ý'
                };
            });

            const res = await axios.post(`${API_URL}/api/ai-exams/banks/${targetBankId}/questions/batch`, {
                questions: formattedList
            }, { headers: { Authorization: `Bearer ${token}` } });

            if (res.data?.success) {
                showToast(res.data.message || `Đã chuyển toàn bộ bộ đề AI sang Ngân hàng chính thức!`, 'success');
                if (refreshBanks) refreshBanks();
                const newSavedQs = formattedList.map((sq, i) => ({
                    id: (res.data.addedIds && res.data.addedIds[i]) || Date.now() + i,
                    noi_dung: sq.noi_dung,
                    do_kho: sq.do_kho,
                    chu_de: sq.chu_de,
                    bank_id: targetBankId,
                    ai_generated: true,
                    nguon: 'AI Gợi ý'
                }));
                setSavedQuestionsList(prev => [...newSavedQs, ...prev]);
            }
        } catch (err) {
            showToast(err.response?.data?.message || err.message || 'Lỗi khi chuyển cả lô câu hỏi AI', 'error');
        } finally {
            setIsSavingQuestion(false);
        }
    };

    // Handle Create Official Bank
    const handleCreateBank = async (e) => {
        e.preventDefault();
        if (!newBankForm.tieu_de || !newBankForm.ma_mon_hoc) {
            showToast('Vui lòng nhập tên Ngân hàng và chọn môn học', 'error');
            return;
        }
        setIsSavingBank(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/api/ai-exams/banks`, {
                ma_mon_hoc: newBankForm.ma_mon_hoc,
                ma_giang_vien: teacherId,
                tieu_de: newBankForm.tieu_de,
                ma_lop_hoc_phan: newBankForm.ma_lop_hoc_phan || undefined
            }, { headers: { Authorization: `Bearer ${token}` } });

            if (res.data?.success && res.data.data) {
                showToast(res.data.message || 'Tạo Ngân hàng câu hỏi thành công!');
                if (refreshBanks) await refreshBanks();
                setTargetBankId(String(res.data.data.id));
                setIsCreatingBank(false);
                setNewBankForm({ tieu_de: '', ma_mon_hoc: '', ma_lop_hoc_phan: '' });
            }
        } catch (err) {
            showToast(err.response?.data?.message || err.message || 'Lỗi khi tạo ngân hàng', 'error');
        } finally {
            setIsSavingBank(false);
        }
    };

    // Handle Save Manual Question into Official Bank
    const handleSaveManualQuestion = async (e) => {
        e.preventDefault();
        if (!targetBankId) {
            showToast('Vui lòng chọn hoặc tạo Ngân hàng câu hỏi đích trước khi lưu', 'error');
            return;
        }
        if (!manualForm.noi_dung.trim()) {
            showToast('Vui lòng nhập nội dung câu hỏi', 'error');
            return;
        }
        if (manualForm.options.some(o => !o.text.trim())) {
            showToast('Vui lòng nhập đầy đủ nội dung 4 đáp án', 'error');
            return;
        }
        if (!manualForm.options.some(o => o.is_correct)) {
            showToast('Vui lòng chọn đúng 1 đáp án đúng', 'error');
            return;
        }

        setIsSavingQuestion(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/api/ai-exams/banks/${targetBankId}/questions`, {
                chu_de: manualForm.chu_de,
                noi_dung: manualForm.noi_dung,
                giai_thich: manualForm.giai_thich,
                do_kho: manualForm.do_kho,
                options: manualForm.options,
                ai_generated: Boolean(manualForm.ai_generated),
                nguon: manualForm.nguon || 'GV'
            }, { headers: { Authorization: `Bearer ${token}` } });

            if (res.data?.success) {
                showToast('Đã lưu chính thức câu hỏi vào Ngân hàng!', 'success');
                if (refreshBanks) refreshBanks();
                
                const savedQ = {
                    id: res.data.questionId || Date.now(),
                    noi_dung: manualForm.noi_dung,
                    do_kho: manualForm.do_kho,
                    chu_de: manualForm.chu_de,
                    bank_id: targetBankId,
                    ai_generated: Boolean(manualForm.ai_generated),
                    nguon: manualForm.nguon || 'GV'
                };
                setSavedQuestionsList(prev => [savedQ, ...prev]);

                // Reset options text for next question while keeping topic & difficulty
                setManualForm(prev => ({
                    ...prev,
                    noi_dung: '',
                    giai_thich: '',
                    ai_generated: false,
                    nguon: 'GV',
                    options: [
                        { text: '', is_correct: false },
                        { text: '', is_correct: true },
                        { text: '', is_correct: false },
                        { text: '', is_correct: false }
                    ]
                }));
            }
        } catch (err) {
            showToast(err.response?.data?.message || err.message || 'Lỗi khi lưu câu hỏi', 'error');
        } finally {
            setIsSavingQuestion(false);
        }
    };

    // Calculate remaining TTL
    const [timeLeftStr, setTimeLeftStr] = useState('');
    useEffect(() => {
        if (!expiresAt) {
            setTimeLeftStr('');
            return;
        }
        const updateTimer = () => {
            const diff = Math.max(0, expiresAt.getTime() - Date.now());
            if (diff === 0) {
                setTimeLeftStr('Đã hết hạn');
            } else {
                const mins = Math.floor(diff / 60000);
                const secs = Math.floor((diff % 60000) / 1000);
                setTimeLeftStr(`${mins}m ${secs}s`);
            }
        };
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [expiresAt]);

    return (
        <div className="space-y-6 font-sans">
            {/* Toast */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-2xl shadow-xl font-bold text-sm flex items-center gap-2 text-white ${
                            toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
                        }`}
                    >
                        {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Banner hướng dẫn mô hình AI Advisor */}
            <div className="bg-gradient-to-r from-[#152238] to-indigo-950 text-white p-6 rounded-3xl shadow-md border border-[#F4C542]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#F4C542] text-[#152238] flex items-center justify-center font-black flex-shrink-0 shadow-lg">
                        <Sparkles className="w-6 h-6 fill-current animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-lg md:text-xl font-extrabold text-[#F4C542] flex items-center gap-2">
                            Mô hình AI Gợi Ý & Soạn Đề Thủ Công (Advisor Studio)
                        </h2>
                        <p className="text-xs md:text-sm text-gray-200 mt-1 max-w-3xl leading-relaxed">
                            <strong>Nguyên tắc bảo mật học thuật:</strong> AI chỉ đóng vai trò Trợ lý Gợi ý (bên trái). Giảng viên bắt buộc kiểm tra, chỉnh sửa và tự tay gõ/chuyển sang Form Soạn Thảo (bên phải) để lưu chính thức vào Ngân hàng đề thi. Gợi ý có hạn sử dụng <strong>30 phút</strong>.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowRecoverBox(!showRecoverBox)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all flex items-center gap-1.5 shrink-0"
                >
                    <RefreshCw className="w-4 h-4" />
                    Phục hồi phiên cũ
                </button>
            </div>

            {/* Hộp phục hồi phiên cũ nếu cần */}
            {showRecoverBox && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-wrap items-center gap-3">
                    <span className="text-xs font-bold text-amber-800">Nhập Mã phiên gợi ý cũ (Session ID):</span>
                    <input
                        type="text"
                        value={recoverSessionId}
                        onChange={(e) => setRecoverSessionId(e.target.value)}
                        placeholder="VD: a1b2c3d4-..."
                        className="flex-1 min-w-[200px] px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-mono outline-none"
                    />
                    <button
                        onClick={handleRecoverSession}
                        className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all"
                    >
                        Tải lại gợi ý
                    </button>
                </div>
            )}

            {/* 2-PANEL LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* PANEL TRÁI: AI ADVISOR (CHỈ ĐỌC & THAM KHẢO) - 6 COLS */}
                <div className="lg:col-span-6 bg-white rounded-3xl p-6 shadow-sm border border-gray-200 space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base text-[#152238]">Panel 1: AI Gợi Ý Câu Hỏi</h3>
                                <p className="text-xs text-gray-500">Dựa trên cấu trúc kiến thức & môn học</p>
                            </div>
                        </div>
                        {expiresAt && (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold border border-amber-200">
                                <Clock className="w-3.5 h-3.5" />
                                <span>TTL: {timeLeftStr}</span>
                            </div>
                        )}
                    </div>

                    {/* Form cấu hình gợi ý */}
                    <div className="space-y-4 bg-gray-50/70 p-4 rounded-2xl border border-gray-200/60">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Môn học *</label>
                                <select
                                    value={advisorConfig.mon_hoc_id}
                                    onChange={(e) => setAdvisorConfig({ ...advisorConfig, mon_hoc_id: e.target.value })}
                                    className="w-full px-3 py-2 text-xs font-semibold bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#152238] outline-none"
                                >
                                    <option value="">-- Chọn Môn học --</option>
                                    {subjects.map((s) => (
                                        <option key={s.MaMonHoc} value={s.MaMonHoc}>
                                            {s.TenMonHoc} ({s.MaMonHoc})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Chương / Chủ đề</label>
                                <input
                                    type="text"
                                    value={advisorConfig.chuong_id}
                                    onChange={(e) => setAdvisorConfig({ ...advisorConfig, chuong_id: e.target.value })}
                                    placeholder="VD: Chương 1 hoặc Toàn bộ"
                                    className="w-full px-3 py-2 text-xs font-semibold bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#152238] outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Độ khó mong muốn</label>
                                <select
                                    value={advisorConfig.do_kho}
                                    onChange={(e) => setAdvisorConfig({ ...advisorConfig, do_kho: e.target.value })}
                                    className="w-full px-3 py-2 text-xs font-semibold bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#152238] outline-none"
                                >
                                    <option value="Mixed">Mixed (Phân bổ tự động)</option>
                                    <option value="Easy">Easy (Dễ)</option>
                                    <option value="Medium">Medium (Trung bình)</option>
                                    <option value="Hard">Hard (Khó)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Số lượng câu gợi ý</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={advisorConfig.so_luong}
                                    onChange={(e) => setAdvisorConfig({ ...advisorConfig, so_luong: e.target.value })}
                                    className="w-full px-3 py-2 text-xs font-semibold bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#152238] outline-none"
                                />
                            </div>
                        </div>

                        {/* Tải lên tài liệu Word phân tích */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                Tài liệu Word phân tích
                            </label>

                            {/* Upload Word form */}
                            <form onSubmit={handleFileUpload} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200">
                                <input
                                    type="file"
                                    accept=".doc,.docx"
                                    onChange={(e) => {
                                        setUploadFile(e.target.files[0]);
                                        setErrorMessage('');
                                    }}
                                    className="flex-1 text-[11px] text-gray-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                                />
                                <button
                                    type="submit"
                                    disabled={isUploading || !uploadFile}
                                    className="px-3 py-1.5 bg-[#152238] hover:bg-indigo-900 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1 shrink-0"
                                >
                                    {isUploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                                    <span>Tải Word</span>
                                </button>
                            </form>
                        </div>

                        {errorMessage && (
                            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-semibold">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        {/* Nút gọi AI gợi ý */}
                        <button
                            onClick={handleRequestSuggestions}
                            disabled={isSuggesting}
                            className="w-full py-2.5 bg-gradient-to-r from-[#F4C542] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-[#152238] font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                            {isSuggesting ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>AI đang suy luận & kiểm duyệt gợi ý...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 fill-current" />
                                    <span>Nhờ AI gợi ý câu hỏi ({advisorConfig.so_luong} câu)</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Nút chuyển nhanh toàn bộ bộ đề AI sang Panel 2 */}
                    {suggestions.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="text-xs font-semibold text-amber-900">
                                <span className="font-extrabold text-amber-950 block">🚀 Chuyển nhanh sang Ngân hàng chính thức (Panel 2)</span>
                                <span>Giảng viên ưng ý có thể chuyển ngay cả lô ({suggestions.length} câu). <strong className="text-red-600">Lưu ý: Tối đa 10 câu AI / bộ đề.</strong></span>
                            </div>
                            <button
                                type="button"
                                onClick={handleBatchTransferToBank}
                                disabled={isSavingQuestion || !targetBankId}
                                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0"
                            >
                                {isSavingQuestion ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                <span>Chuyển cả lô {suggestions.length} câu vào Ngân hàng</span>
                            </button>
                        </div>
                    )}

                    {/* Danh sách kết quả gợi ý (Chỉ đọc) */}
                    <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                        {suggestions.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                                <Sparkles className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-xs font-bold text-gray-500">Chưa có câu hỏi gợi ý nào.</p>
                                <p className="text-[11px] text-gray-400 mt-1">Chọn môn học và nhấn nút "Nhờ AI gợi ý" phía trên để bắt đầu.</p>
                            </div>
                        ) : (
                            suggestions.map((q, idx) => (
                                <div key={idx} className="p-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30 hover:border-indigo-300 transition-all shadow-sm relative group">
                                    <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="px-2.5 py-0.5 bg-[#152238] text-white font-black text-xs rounded-lg">
                                                Gợi ý #{idx + 1}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                                                q.do_kho === 'Easy' ? 'bg-emerald-100 text-emerald-800' :
                                                q.do_kho === 'Hard' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                                            }`}>
                                                {q.do_kho || 'Medium'}
                                            </span>
                                            {q.chu_de && (
                                                <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                                                    {q.chu_de}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => handleDirectTransferSingle(q)}
                                                disabled={isSavingQuestion || !targetBankId}
                                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-[11px] rounded-xl shadow-sm transition-all flex items-center gap-1"
                                                title="Lưu thẳng câu này vào Ngân hàng chính thức Panel 2"
                                            >
                                                <Save className="w-3.5 h-3.5" />
                                                <span>Lưu thẳng</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleLoadToManualForm(q)}
                                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                                                title="Nạp vào Form soạn thảo thủ công bên phải"
                                            >
                                                <span>Sử dụng gợi ý này</span>
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-xs font-bold text-gray-900 leading-relaxed mb-2.5">
                                        {q.cauhoi}
                                    </p>

                                    {/* Đáp án */}
                                    <div className="grid grid-cols-1 gap-1.5 text-xs font-medium mb-2.5">
                                        {q.dapan_dung && (
                                            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                                <span className="font-bold">[Đáp án đúng] {q.dapan_dung}</span>
                                            </div>
                                        )}
                                        {Array.isArray(q.dapan_nhieu) && q.dapan_nhieu.map((opt, oIdx) => (
                                            <div key={oIdx} className="p-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 pl-8">
                                                [Nhiễu] {opt}
                                            </div>
                                        ))}
                                    </div>

                                    {q.giai_thich && (
                                        <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900">
                                            <strong>Giải thích:</strong> {q.giai_thich}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* PANEL PHẢI: FORM SOẠN THẢO THỦ CÔNG & LƯU VÀO NGÂN HÀNG (6 COLS) */}
                <div className="lg:col-span-6 bg-white rounded-3xl p-6 shadow-sm border border-gray-200 space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                <Edit3 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base text-[#152238]">Panel 2: Soạn Đề & Lưu Vào Ngân Hàng</h3>
                                <p className="text-xs text-gray-500">Giảng viên tự tay kiểm duyệt, chỉnh sửa & lưu chính thức</p>
                            </div>
                        </div>
                    </div>

                    {/* Hướng dẫn 2 lựa chọn cho Giảng viên */}
                    <div className="p-3.5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200 rounded-2xl space-y-1.5 text-xs">
                        <div className="font-extrabold text-[#152238] flex items-center gap-1.5">
                            <span className="px-2 py-0.5 bg-[#152238] text-[#F4C542] rounded font-black text-[11px]">2 LỰA CHỌN TẠO ĐỀ</span>
                            <span>Quy trình nạp vào Ngân hàng chính thức:</span>
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-gray-700 font-medium pl-1">
                            <li><strong className="text-emerald-800">Lựa chọn 1 (Tự thêm bằng tay):</strong> Điền Form bên dưới (nhập 4 đáp án & gán 1 đáp án đúng) rồi bấm Lưu (gắn nhãn <strong>[👤 Giảng viên]</strong>).</li>
                            <li><strong className="text-indigo-800">Lựa chọn 2 (AI sinh & bấm 1 nút nhảy sang):</strong> Nhấn nút "Nhờ AI gợi ý" ở Panel 1 $\rightarrow$ Bấm nút vàng <strong className="text-amber-800">🚀 Chuyển cả lô</strong> hoặc nút xanh <strong className="text-emerald-800">[Lưu thẳng]</strong> để nhảy sang đây ngay (gắn nhãn <strong>[🤖 AI Gợi ý]</strong>, <strong className="text-red-600">tối đa 10 câu AI / bộ đề</strong>).</li>
                        </ul>
                    </div>

                    {/* Chọn hoặc Tạo Ngân hàng đích */}
                    <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200/60 space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                                <FolderPlus className="w-4 h-4 text-emerald-700" />
                                <span>Ngân hàng câu hỏi chính thức đích *</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setIsCreatingBank(!isCreatingBank)}
                                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 underline flex items-center gap-1"
                            >
                                {isCreatingBank ? 'Chọn ngân hàng có sẵn' : '+ Tạo Ngân hàng mới'}
                            </button>
                        </div>

                        {isCreatingBank ? (
                            <form onSubmit={handleCreateBank} className="space-y-2.5 bg-white p-3 rounded-xl border border-emerald-200 shadow-sm">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <select
                                        value={newBankForm.ma_mon_hoc}
                                        onChange={(e) => setNewBankForm({ ...newBankForm, ma_mon_hoc: e.target.value })}
                                        className="w-full px-2.5 py-1.5 text-xs font-semibold border border-gray-300 rounded-lg outline-none"
                                    >
                                        <option value="">-- Môn học --</option>
                                        {subjects.map(s => <option key={s.MaMonHoc} value={s.MaMonHoc}>{s.TenMonHoc}</option>)}
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Mã Lớp HP (tuỳ chọn)"
                                        value={newBankForm.ma_lop_hoc_phan}
                                        onChange={(e) => setNewBankForm({ ...newBankForm, ma_lop_hoc_phan: e.target.value })}
                                        className="w-full px-2.5 py-1.5 text-xs font-semibold border border-gray-300 rounded-lg outline-none"
                                    />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Tên Ngân hàng mới (VD: Đề thi Giữa kỳ CNTT1)"
                                    value={newBankForm.tieu_de}
                                    onChange={(e) => setNewBankForm({ ...newBankForm, tieu_de: e.target.value })}
                                    className="w-full px-2.5 py-1.5 text-xs font-semibold border border-gray-300 rounded-lg outline-none"
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreatingBank(false)}
                                        className="px-3 py-1 text-xs font-bold text-gray-500 hover:text-gray-700"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSavingBank}
                                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm"
                                    >
                                        {isSavingBank ? 'Đang tạo...' : 'Xác nhận tạo'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <select
                                value={targetBankId}
                                onChange={(e) => setTargetBankId(e.target.value)}
                                className="w-full px-3 py-2 text-xs font-bold text-emerald-950 bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
                            >
                                <option value="">-- Chọn Ngân hàng chính thức để lưu câu hỏi --</option>
                                {officialBanks.map(b => (
                                    <option key={b.id} value={b.id}>
                                        [Đề #{b.id}] {b.tieu_de} ({b.TenMonHoc || b.ma_mon_hoc} - {b.tong_so_cau || 0} câu)
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Form Soạn Thảo Câu Hỏi */}
                    <form onSubmit={handleSaveManualQuestion} className="space-y-4">
                        {manualForm.ai_generated && (
                            <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between text-xs text-indigo-900">
                                <div className="flex items-center gap-2 font-bold">
                                    <Sparkles className="w-4 h-4 text-indigo-600" />
                                    <span>[🤖 Đang chỉnh sửa từ AI Gợi ý - Khi lưu sẽ ghi nhận là nguồn AI]</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setManualForm(prev => ({ ...prev, ai_generated: false, nguon: 'GV' }))}
                                    className="text-[11px] font-bold text-indigo-700 underline hover:text-indigo-950"
                                >
                                    Chuyển sang nguồn GV tự soạn
                                </button>
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Chủ đề câu hỏi</label>
                                <input
                                    type="text"
                                    value={manualForm.chu_de}
                                    onChange={(e) => setManualForm({ ...manualForm, chu_de: e.target.value })}
                                    placeholder="VD: Chương 1, Khái niệm..."
                                    className="w-full px-3 py-2 text-xs font-semibold bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#152238] outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Độ khó</label>
                                <select
                                    value={manualForm.do_kho}
                                    onChange={(e) => setManualForm({ ...manualForm, do_kho: e.target.value })}
                                    className="w-full px-3 py-2 text-xs font-semibold bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#152238] outline-none"
                                >
                                    <option value="Easy">Easy (Dễ)</option>
                                    <option value="Medium">Medium (Trung bình)</option>
                                    <option value="Hard">Hard (Khó)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Nội dung câu hỏi trắc nghiệm *</label>
                            <textarea
                                rows={3}
                                value={manualForm.noi_dung}
                                onChange={(e) => setManualForm({ ...manualForm, noi_dung: e.target.value })}
                                placeholder="Nhập nội dung câu hỏi hoặc nhấn 'Sử dụng gợi ý này' từ Panel trái..."
                                className="w-full px-3 py-2.5 text-xs font-semibold bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#152238] outline-none leading-relaxed"
                            />
                        </div>

                        {/* 4 Đáp án */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-700">
                                4 Đáp án trắc nghiệm (Chọn đáp án đúng bằng nút tròn tròn bên trái) *
                            </label>
                            {manualForm.options.map((opt, index) => (
                                <div key={index} className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                                    opt.is_correct ? 'bg-emerald-50/80 border-emerald-400 font-bold' : 'bg-gray-50 border-gray-200'
                                }`}>
                                    <input
                                        type="radio"
                                        name="correct_option"
                                        checked={Boolean(opt.is_correct)}
                                        onChange={() => {
                                            const newOptions = manualForm.options.map((o, i) => ({
                                                ...o,
                                                is_correct: i === index
                                            }));
                                            setManualForm({ ...manualForm, options: newOptions });
                                        }}
                                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                                    />
                                    <span className="text-xs font-black w-6 text-gray-500">
                                        {['A', 'B', 'C', 'D'][index]}
                                    </span>
                                    <input
                                        type="text"
                                        value={opt.text}
                                        onChange={(e) => {
                                            const newOptions = [...manualForm.options];
                                            newOptions[index].text = e.target.value;
                                            setManualForm({ ...manualForm, options: newOptions });
                                        }}
                                        placeholder={`Nhập nội dung đáp án ${['A', 'B', 'C', 'D'][index]}...`}
                                        className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>
                            ))}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Giải thích chi tiết (Tuỳ chọn)</label>
                            <textarea
                                rows={2}
                                value={manualForm.giai_thich}
                                onChange={(e) => setManualForm({ ...manualForm, giai_thich: e.target.value })}
                                placeholder="Giải thích lý do tại sao đáp án lại đúng..."
                                className="w-full px-3 py-2 text-xs font-medium bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#152238] outline-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSavingQuestion || !targetBankId}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSavingQuestion ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Đang ghi vào Ngân hàng chính thức...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>Lưu câu hỏi vào Ngân hàng đề chính thức</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Danh sách câu hỏi vừa lưu trong phiên */}
                    {savedQuestionsList.length > 0 && (
                        <div className="pt-4 border-t border-gray-100 space-y-2">
                            <h4 className="text-xs font-extrabold text-gray-700 flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>Câu hỏi vừa lưu trong phiên này ({savedQuestionsList.length}):</span>
                            </h4>
                            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                {savedQuestionsList.map((sq, sIdx) => (
                                    <div key={sq.id || sIdx} className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs flex items-center justify-between gap-2">
                                        <div className="min-w-0 flex-1 flex items-center gap-1.5 flex-wrap">
                                            <span className="font-bold text-emerald-700">[#{(savedQuestionsList.length - sIdx)}]</span>
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                                                sq.ai_generated || String(sq.nguon).includes('AI')
                                                    ? 'bg-indigo-100 text-indigo-800'
                                                    : 'bg-gray-200 text-gray-700'
                                            }`}>
                                                {sq.ai_generated || String(sq.nguon).includes('AI') ? '🤖 AI Gợi ý' : '👤 Giảng viên'}
                                            </span>
                                            <span className="font-medium text-gray-800 truncate block sm:inline">{sq.noi_dung}</span>
                                        </div>
                                        <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-bold text-gray-600 shrink-0">
                                            {sq.do_kho}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AiQuestionGenerator;
