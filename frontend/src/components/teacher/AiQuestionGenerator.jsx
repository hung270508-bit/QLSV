import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, UploadCloud, CheckCircle2, AlertCircle, RefreshCw,
    ArrowRight, Clock, Plus, Save, FolderPlus, Edit3,
    Trash2, AlertTriangle, BookmarkCheck, Layers, Check, XCircle
} from 'lucide-react';
import axios from 'axios';
import API_URL from '../../api';
import ModalPortal from '../common/ModalPortal';

// ── Helpers ──
const createBlankQuestion = () => ({
    localId: crypto.randomUUID(),
    chu_de: 'Chung',
    do_kho: 'Medium',
    noi_dung: '',
    giai_thich: '',
    options: [
        { text: '', is_correct: false },
        { text: '', is_correct: true },
        { text: '', is_correct: false },
        { text: '', is_correct: false }
    ],
    ai_generated: false,
    nguon: 'GV'
});

const createQuestionFromSuggestion = (suggestion, chuongDefault = 'Chung') => {
    const dapanDung = suggestion.dapan_dung || '';
    const dapanNhieu = Array.isArray(suggestion.dapan_nhieu) ? suggestion.dapan_nhieu : [];
    const allOpts = [
        { text: dapanDung, is_correct: true },
        ...dapanNhieu.slice(0, 3).map(t => ({ text: t, is_correct: false }))
    ];
    while (allOpts.length < 4) allOpts.push({ text: '', is_correct: false });
    return {
        localId: crypto.randomUUID(),
        chu_de: suggestion.chu_de || chuongDefault || 'Chung',
        do_kho: suggestion.do_kho || 'Medium',
        noi_dung: suggestion.cauhoi || '',
        giai_thich: suggestion.giai_thich || '',
        options: allOpts.slice(0, 4),
        ai_generated: true,
        nguon: 'AI Gợi ý'
    };
};

const validateChuong = (val) => {
    const str = String(val !== undefined && val !== null ? val : '').trim();
    if (!str) {
        return 'Vui lòng nhập thông tin chương hoặc chủ đề (ví dụ: Toàn bộ, Chương 1...)';
    }
    if (str.length > 50) {
        return `Tên chương/chủ đề không được vượt quá 50 ký tự (hiện tại: ${str.length} ký tự).`;
    }
    const forbiddenChars = /[@#$%^&*<>{}|\\~`"']+/;
    if (forbiddenChars.test(str)) {
        return 'Chương/Chủ đề không được chứa ký tự đặc biệt lạ (@, #, $, %, ^, &, *, <, >...).';
    }
    return '';
};

const validateSoLuong = (val) => {
    const str = String(val !== undefined && val !== null ? val : '').trim();
    if (!str || str === 'NaN') {
        return 'Vui lòng nhập số lượng câu hỏi muốn AI gợi ý!';
    }
    if (str.includes('-') || Number(str) < 0) {
        return 'Số lượng không được là số âm! Vui lòng nhập số nguyên dương từ 1 đến 50.';
    }
    if (Number(str) === 0) {
        return 'Số lượng câu hỏi phải từ 1 câu trở lên! Không được nhập số 0.';
    }
    if (!/^\d+$/.test(str)) {
        return 'Số lượng chỉ được nhập chữ số nguyên dương (1 - 50). Không được nhập chữ cái, số âm hay ký tự đặc biệt!';
    }
    const num = Number(str);
    if (num > 50) {
        return 'Số lượng tối đa mỗi lần AI gợi ý là 50 câu! Vui lòng nhập từ 1 đến 50.';
    }
    return '';
};

function AiQuestionGenerator({ officialBanks = [], refreshBanks, subjects = [], assignments = [], teacherId, onDirtyChange }) {
    // ── AI Advisor State ──
    const [uploadFile, setUploadFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [advisorConfig, setAdvisorConfig] = useState({
        mon_hoc_id: '',
        chuong_id: 'Toàn bộ',
        do_kho: 'Mixed',
        so_luong: 10
    });
    const [advisorErrors, setAdvisorErrors] = useState({
        chuong_id: '',
        so_luong: ''
    });

    const handleChuongChange = (val) => {
        setAdvisorConfig(prev => ({ ...prev, chuong_id: val }));
        const err = validateChuong(val);
        setAdvisorErrors(prev => ({ ...prev, chuong_id: err }));
    };

    const handleSoLuongChange = (val) => {
        setAdvisorConfig(prev => ({ ...prev, so_luong: val }));
        const err = validateSoLuong(val);
        setAdvisorErrors(prev => ({ ...prev, so_luong: err }));
    };

    const [isSuggesting, setIsSuggesting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [expiresAt, setExpiresAt] = useState(null);

    // ── Bank Draft State (nháp phía client, chưa lưu DB) ──
    const [bankDraft, setBankDraft] = useState(null);
    // bankDraft = { ma_mon_hoc, ma_lop_hoc_phan, tieu_de }
    const [pendingBankId, setPendingBankId] = useState(null);
    // pendingBankId: bank đã tạo được trong DB nhưng batch câu hỏi bị lỗi → dùng lại lần thử tiếp

    // ── Form Bước 1 ──
    const [newBankForm, setNewBankForm] = useState({ tieu_de: '', ma_mon_hoc: '', ma_lop_hoc_phan: [] });

    // ── Manual Questions List ──
    const [manualQuestions, setManualQuestions] = useState([]);
    const [isSavingAll, setIsSavingAll] = useState(false);
    const [savedQuestionsList, setSavedQuestionsList] = useState([]);

    // ── UI State ──
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [popupAlert, setPopupAlert] = useState({ show: false, title: '', message: '', type: 'error', onConfirm: null });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false }), 3500);
    };

    const showPopup = (title, message, type = 'error', onConfirm = null) => {
        setPopupAlert({ show: true, title, message, type, onConfirm });
    };

    const prevDirtyRef = React.useRef({ isDirty: false, title: '', count: 0 });
    useEffect(() => {
        const isDirty = Boolean(bankDraft || manualQuestions.length > 0);
        const title = bankDraft?.tieu_de || '';
        const count = manualQuestions.length;
        if (
            prevDirtyRef.current.isDirty !== isDirty ||
            prevDirtyRef.current.title !== title ||
            prevDirtyRef.current.count !== count
        ) {
            prevDirtyRef.current = { isDirty, title, count };
            if (onDirtyChange) {
                onDirtyChange(isDirty, title, count);
            }
        }
        const handleBeforeUnload = (e) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        if (isDirty) {
            window.addEventListener('beforeunload', handleBeforeUnload);
        }
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [bankDraft, manualQuestions, onDirtyChange]);

    // ── Upload Word ──
    const uploadFileDirect = async (fileToUpload, isFromSuggest = false) => {
        if (!fileToUpload || !advisorConfig.mon_hoc_id) return null;
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('ma_mon_hoc', advisorConfig.mon_hoc_id);
        formData.append('ma_giang_vien', teacherId);
        formData.append('tieu_de', fileToUpload.name.replace(/\.[^/.]+$/, '').slice(0, 30));
        const subjectObj = subjects.find(s => s.MaMonHoc === advisorConfig.mon_hoc_id);
        formData.append('ten_mon_hoc', subjectObj?.TenMonHoc || advisorConfig.mon_hoc_id);
        try {
            const res = await axios.post(`${API_URL}/api/ai-exams/documents/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data?.success && res.data.data?.id) {
                const newDocId = String(res.data.data.id);
                const isRelevant = res.data.is_relevant ?? res.data.data?.is_relevant ?? true;
                if (!isRelevant && !isFromSuggest) {
                    showPopup(
                        'Cảnh Báo Nội Dung Tài Liệu Không Khớp',
                        `AI phát hiện nội dung file Word "${fileToUpload.name}" dường như KHÔNG KHỚP hoặc ít liên quan đến môn học đã chọn (${subjectObj?.TenMonHoc || advisorConfig.mon_hoc_id}).\n\nVui lòng kiểm tra lại xem bạn có chọn nhầm tài liệu cho môn học khác không nhé!`,
                        'warning'
                    );
                } else if (isRelevant && !isFromSuggest) {
                    showToast(res.data.message || 'Tải lên tài liệu thành công!');
                }
                setUploadFile(null);
                return { id: newDocId, isRelevant };
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Lỗi tải lên tài liệu';
            showPopup('Lỗi Kiểm Tra Tài Liệu Tải Lên', msg, 'error');
            setErrorMessage(msg);
        } finally {
            setIsUploading(false);
        }
        return null;
    };

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!uploadFile) { showPopup('Chưa Chọn File', 'Vui lòng chọn file Word (.doc, .docx) để tải lên.', 'warning'); return; }
        if (!advisorConfig.mon_hoc_id) { showPopup('Chưa Chọn Môn Học', 'Vui lòng chọn môn học trước khi tải tài liệu lên.', 'warning'); return; }
        await uploadFileDirect(uploadFile, false);
    };

    // ── AI Suggestions ──
    const executeSuggestApi = async (docIdToUse) => {
        setIsSuggesting(true);
        setErrorMessage('');
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/api/ai-exams/suggest-questions`, {
                mon_hoc_id: advisorConfig.mon_hoc_id,
                chuong_id: advisorConfig.chuong_id || 'Toàn bộ',
                do_kho: advisorConfig.do_kho,
                so_luong: Number(advisorConfig.so_luong) || 10,
                document_id: docIdToUse || undefined
            }, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data?.success) {
                const goiYList = res.data.goi_y || [];
                setSuggestions(goiYList);
                setExpiresAt(res.data.expires_at ? new Date(res.data.expires_at) : null);
                if (goiYList.length > 0) {
                    showPopup(
                        'Sinh Gợi Ý AI Thành Công',
                        `AI đã phân tích và sinh thành công ${goiYList.length} câu hỏi gợi ý bên cột phải (Trợ lý tham khảo).\n\nGiảng viên hãy xem rà soát từng câu bên phải, ưng ý câu nào thì bấm "+ Thêm" (hoặc bấm "+ Thêm tất cả vào danh sách") để chuyển câu hỏi sang danh sách thẻ bên trái của bộ đề nhé!`,
                        'success'
                    );
                } else {
                    showToast(res.data.message || 'AI đã gợi ý 0 câu hỏi!');
                }
            } else {
                const msg = res.data?.message || 'Không thể sinh gợi ý';
                setErrorMessage(msg);
                showPopup('Lỗi Yêu Cầu AI Gợi Ý', msg, 'error');
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Lỗi khi yêu cầu AI gợi ý';
            setErrorMessage(msg);
            showPopup('Kiểm Tra Ràng Buộc & Điều Kiện AI', msg, 'error');
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleRequestSuggestions = async () => {
        const chuongErr = validateChuong(advisorConfig.chuong_id);
        const soLuongErr = validateSoLuong(advisorConfig.so_luong);
        if (chuongErr || soLuongErr) {
            setAdvisorErrors({
                chuong_id: chuongErr || '',
                so_luong: soLuongErr || ''
            });
            showPopup(
                'Thông Tin Cấu Hình AI Chưa Hợp Lệ',
                `Vui lòng kiểm tra và sửa các lỗi cấu hình AI dưới cột phải:\n\n` +
                (chuongErr ? `• Chương / Chủ đề: ${chuongErr}\n` : '') +
                (soLuongErr ? `• Số lượng câu hỏi: ${soLuongErr}` : ''),
                'warning'
            );
            return;
        }
        if (!advisorConfig.mon_hoc_id) {
            showPopup('Chưa Chọn Môn Học', 'Vui lòng chọn môn học trước khi nhờ AI gợi ý.', 'warning');
            setErrorMessage('Vui lòng chọn môn học trước khi nhờ AI gợi ý');
            return;
        }
        if (uploadFile) {
            const result = await uploadFileDirect(uploadFile, true);
            if (!result || !result.id) return;
            if (!result.isRelevant) {
                const subjectObj = subjects.find(s => s.MaMonHoc === advisorConfig.mon_hoc_id);
                showPopup(
                    'Cảnh Báo Tài Liệu Không Khớp Môn Học',
                    `AI phân tích thấy nội dung file Word "${uploadFile.name}" dường như KHÔNG KHỚP hoặc không thuộc lĩnh vực của môn học "${subjectObj?.TenMonHoc || advisorConfig.mon_hoc_id}".\n\nHệ thống tạm dừng tạo câu hỏi để tránh tạo sai đề. Bạn có chắc chắn vẫn muốn dùng tài liệu này để sinh gợi ý không?`,
                    'warning',
                    () => { executeSuggestApi(result.id); }
                );
                return;
            }
            await executeSuggestApi(result.id);
        } else {
            await executeSuggestApi('');
        }
    };

    // ── Load AI suggestion → add new card to list ──
    const handleLoadToManualForm = (suggestion) => {
        const newCard = createQuestionFromSuggestion(suggestion, advisorConfig.chuong_id);
        setManualQuestions(prev => [...prev, newCard]);
        setSuggestions(prev => prev.filter(s => s !== suggestion));
        showToast('✓ Đã chuyển câu hỏi qua danh sách tạo bộ đề bên trái!', 'success');
    };

    // ── Add all suggestions to manual list ──
    const handleAddAllSuggestionsToList = () => {
        if (!suggestions || suggestions.length === 0) {
            showPopup('Không Có Câu Hỏi Gợi Ý', 'Chưa có gợi ý AI. Vui lòng bấm "Nhờ AI gợi ý" trước.', 'warning');
            return;
        }
        const newCards = suggestions.map(s => createQuestionFromSuggestion(s, advisorConfig.chuong_id));
        setManualQuestions(prev => [...prev, ...newCards]);
        setSuggestions([]);
        showToast(`✓ Đã chuyển toàn bộ ${newCards.length} câu AI qua danh sách tạo bộ đề bên trái!`, 'success');
    };

    // ── Step 1: Submit bank form (chỉ lưu nháp, KHÔNG gọi API) ──
    const handleSubmitBankDraft = (e) => {
        e.preventDefault();
        if (!newBankForm.ma_mon_hoc) {
            showPopup(' Ràng Buộc Môn Học', 'Vui lòng chọn Môn học giảng dạy trước khi tiếp tục!', 'warning');
            return;
        }
        const tieuDeTrim = (newBankForm.tieu_de || '').trim();
        if (!tieuDeTrim) {
            showPopup(' Ràng Buộc Tên Bộ Đề', 'Vui lòng nhập Tên Bộ đề / Ngân hàng mới cho môn học!', 'warning');
            return;
        }
        if (tieuDeTrim.length < 5) {
            showPopup(' Ràng Buộc Tên Bộ Đề', 'Tên bộ đề quá ngắn! Vui lòng nhập từ 5 đến 30 ký tự để rõ ràng và dễ quản lý.', 'warning');
            return;
        }
        if (tieuDeTrim.length > 30) {
            showPopup(' Ràng Buộc Tên Bộ Đề', `Tên bộ đề không được vượt quá 30 ký tự (hiện tại: ${tieuDeTrim.length} ký tự).`, 'warning');
            return;
        }
        const invalidCharRegex = /[@#$%^&*<>{}|\\~`"']+/;
        if (invalidCharRegex.test(tieuDeTrim)) {
            showPopup(
                ' Tên Bộ Đề Chứa Ký Tự Không Hợp Lệ',
                'Tên bộ đề không được chứa các ký tự đặc biệt lạ hoặc nguy hiểm (như @, #, $, %, ^, &, *, <, >, {, }, |, \\, ~, `).\n\nChỉ cho phép: Chữ cái tiếng Việt, chữ số, khoảng trắng và các dấu thông dụng: - _ ( ) / + , . :',
                'warning'
            );
            return;
        }

        // Tính lớp học phần
        let finalLopHP = '';
        if (Array.isArray(newBankForm.ma_lop_hoc_phan) && newBankForm.ma_lop_hoc_phan.length > 0) {
            finalLopHP = newBankForm.ma_lop_hoc_phan.join(', ');
        } else {
            const classList = assignments.filter(a => a.MaMonHoc === newBankForm.ma_mon_hoc && a.MaLopHocPhan);
            finalLopHP = classList.length > 0 ? classList.map(a => a.MaLopHocPhan).join(', ') : 'Tất cả lớp học phần';
        }

        const subjectObj = subjects.find(s => s.MaMonHoc === newBankForm.ma_mon_hoc) || assignments.find(a => a.MaMonHoc === newBankForm.ma_mon_hoc);
        const subjectName = subjectObj?.TenMonHoc ? `${subjectObj.TenMonHoc} (${newBankForm.ma_mon_hoc})` : newBankForm.ma_mon_hoc;

        showPopup(
            'Xác Nhận Tạo Bộ Đề Mới',
            `Bạn có chắc chắn muốn tạo bộ đề mới với các thông tin sau không?\n\n• Môn học: ${subjectName}\n• Lớp áp dụng: ${finalLopHP}\n• Tên bộ đề: "${tieuDeTrim}"\n\nSau khi xác nhận, bạn sẽ chuyển sang Bước 2 để nhập danh sách câu hỏi.`,
            'warning',
            () => {
                setBankDraft({
                    ma_mon_hoc: newBankForm.ma_mon_hoc,
                    ma_lop_hoc_phan: finalLopHP,
                    tieu_de: tieuDeTrim
                });
                setManualQuestions([]);
                setSavedQuestionsList([]);
                setPendingBankId(null);
            }
        );
    };

    // ── Validate a single question card ──
    const validateCard = (q, index) => {
        const errors = [];
        if (!q.noi_dung.trim()) errors.push(`Câu hỏi ${index + 1}: Chưa nhập nội dung câu hỏi.`);
        if (q.options.some(o => !o.text.trim())) errors.push(`Câu hỏi ${index + 1}: Chưa nhập đủ 4 đáp án.`);
        if (!q.options.some(o => o.is_correct)) errors.push(`Câu hỏi ${index + 1}: Chưa chọn đáp án đúng.`);
        return errors;
    };

    // ── Step 2: "Lưu bộ đề" — tạo bank + batch câu hỏi cùng lúc ──
    const handleSaveExamBank = async () => {
        if (!bankDraft) return;
        if (manualQuestions.length === 0) {
            showPopup(' Danh Sách Trống', 'Chưa có câu hỏi nào. Bấm "+ Thêm câu hỏi" hoặc dùng AI gợi ý để thêm câu hỏi vào danh sách.', 'warning');
            return;
        }
        const allErrors = manualQuestions.flatMap((q, i) => validateCard(q, i));
        if (allErrors.length > 0) {
            showPopup(' Một Số Câu Hỏi Chưa Hợp Lệ', allErrors.join('\n'), 'warning');
            return;
        }

        showPopup(
            'Xác Nhận Lưu Bộ Đề',
            `Bạn có chắc chắn muốn lưu chính thức bộ đề "${bankDraft.tieu_de}" với tổng cộng ${manualQuestions.length} câu hỏi vào Ngân hàng chính thức không?\n\nSau khi lưu thành công, bộ đề sẽ xuất hiện trong tab Ngân Hàng Đề Thi và sẵn sàng cho các kỳ thi Online.`,
            'warning',
            async () => {
                setIsSavingAll(true);
                try {
                    const token = localStorage.getItem('token');

                    let bankId = pendingBankId;
                    if (!bankId) {
                        const bankRes = await axios.post(`${API_URL}/api/ai-exams/banks`, {
                            ma_mon_hoc: bankDraft.ma_mon_hoc,
                            ma_giang_vien: teacherId,
                            tieu_de: bankDraft.tieu_de,
                            ma_lop_hoc_phan: bankDraft.ma_lop_hoc_phan
                        }, { headers: { Authorization: `Bearer ${token}` } });

                        if (!bankRes.data?.success || !bankRes.data?.data?.id) {
                            showPopup(' Lỗi Tạo Bộ Đề', bankRes.data?.message || 'Không thể tạo bộ đề — vui lòng thử lại.', 'error');
                            return;
                        }
                        bankId = String(bankRes.data.data.id);
                        setPendingBankId(bankId);
                    }

                    const formattedList = manualQuestions.map(q => ({
                        chu_de: q.chu_de,
                        noi_dung: q.noi_dung,
                        giai_thich: q.giai_thich,
                        do_kho: q.do_kho,
                        options: q.options,
                        ai_generated: Boolean(q.ai_generated),
                        nguon: q.nguon || 'GV'
                    }));

                    const batchRes = await axios.post(`${API_URL}/api/ai-exams/banks/${bankId}/questions/batch`, {
                        questions: formattedList
                    }, { headers: { Authorization: `Bearer ${token}` } });

                    if (batchRes.data?.success) {
                        if (refreshBanks) await refreshBanks();
                        showPopup(
                            '🎉 Lưu Bộ Đề Thành Công!',
                            `Bộ đề "${bankDraft.tieu_de}" đã được tạo với ${manualQuestions.length} câu hỏi!\n\nBộ đề đã xuất hiện trong Ngân hàng chính thức. Bạn có thể bắt đầu soạn bộ đề tiếp theo.`,
                            'success'
                        );
                        setBankDraft(null);
                        setPendingBankId(null);
                        setManualQuestions([]);
                        setSavedQuestionsList([]);
                        setNewBankForm({ tieu_de: '', ma_mon_hoc: '', ma_lop_hoc_phan: [] });
                    } else {
                        showPopup(' Lỗi Lưu Câu Hỏi', batchRes.data?.message || 'Lưu câu hỏi thất bại — dữ liệu của bạn vẫn còn, vui lòng thử lại.', 'error');
                    }
                } catch (err) {
                    const msg = err.response?.data?.message || err.message || 'Lỗi không xác định';
                    showPopup(' Lỗi Khi Lưu Bộ Đề', `${msg}\n\nDữ liệu của bạn vẫn còn, vui lòng thử lại.`, 'error');
                } finally {
                    setIsSavingAll(false);
                }
            }
        );
    };

    // ── Question List Mutation Helpers ──
    const addQuestion = () => {
        setManualQuestions(prev => [...prev, createBlankQuestion()]);
    };

    const removeQuestion = (localId) => {
        const targetQ = manualQuestions.find(q => q.localId === localId);
        showPopup(
            'Xác Nhận Xóa Câu Hỏi',
            `Bạn có chắc chắn muốn xóa câu hỏi "${(targetQ?.noi_dung || 'Chưa có nội dung').slice(0, 60)}..." khỏi danh sách đang soạn không?`,
            'warning',
            () => {
                setManualQuestions(prev => prev.filter(q => q.localId !== localId));
                showToast('Đã xóa câu hỏi khỏi danh sách!', 'success');
            }
        );
    };

    const updateQuestion = (localId, patch) => {
        setManualQuestions(prev => prev.map(q => q.localId === localId ? { ...q, ...patch } : q));
    };

    const updateOption = (localId, optIndex, text) => {
        setManualQuestions(prev => prev.map(q => {
            if (q.localId !== localId) return q;
            const newOptions = [...q.options];
            newOptions[optIndex] = { ...newOptions[optIndex], text };
            return { ...q, options: newOptions };
        }));
    };

    const setCorrectOption = (localId, optIndex) => {
        setManualQuestions(prev => prev.map(q => {
            if (q.localId !== localId) return q;
            return { ...q, options: q.options.map((o, i) => ({ ...o, is_correct: i === optIndex })) };
        }));
    };

    // ── TTL Countdown ──
    const [timeLeftStr, setTimeLeftStr] = useState('');
    useEffect(() => {
        if (!expiresAt) { setTimeLeftStr(''); return; }
        const update = () => {
            const diff = Math.max(0, expiresAt.getTime() - Date.now());
            if (diff === 0) {
                setTimeLeftStr('Đã hết hạn');
            } else {
                const mins = Math.floor(diff / 60000);
                const secs = Math.floor((diff % 60000) / 1000);
                setTimeLeftStr(`${mins}m ${secs}s`);
            }
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [expiresAt]);

    // ═══════════════════════════════════════════════════════
    //  RENDER
    // ═══════════════════════════════════════════════════════
    return (
        <div className="space-y-6 font-sans">
            {/* ── Toast ── */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-2xl shadow-xl font-bold text-sm flex items-center gap-2 text-white ${toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'}`}
                    >
                        {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Page Header ── */}
            <div className="bg-gradient-to-r from-[#152238] to-indigo-950 text-white p-5 sm:p-6 rounded-3xl shadow-md border border-[#F4C542]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-[#F4C542] text-[#152238] flex items-center justify-center font-black shrink-0 shadow-lg">
                        <Edit3 className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg md:text-xl font-extrabold text-[#F4C542]">Soạn Đề & Ngân Hàng Câu Hỏi Chính Thức</h2>
                        <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                            {bankDraft
                                ? `Đang soạn: "${bankDraft.tieu_de}" — Nhập câu hỏi rồi bấm "Lưu bộ đề" để lưu tất cả vào Ngân hàng.`
                                : 'Điền thông tin bộ đề → soạn câu hỏi → bấm "Lưu bộ đề" để lưu chính thức vào Ngân hàng.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* ════════════════════════════════════════
                BƯỚC 1 — Điền thông tin bộ đề (nháp)
                ════════════════════════════════════════ */}
            {!bankDraft ? (
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border-2 border-emerald-500 space-y-5">
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                <FolderPlus className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-black text-base text-[#152238]">Bước 1: Thông Tin Bộ Đề</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Điền thông tin cơ bản — bộ đề sẽ được lưu vào Ngân hàng sau khi bạn hoàn thành nhập câu hỏi</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmitBankDraft} className="space-y-4">
                            {/* Môn học */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">Môn học giảng dạy <span className="text-red-500">*</span></label>
                                <select
                                    value={newBankForm.ma_mon_hoc}
                                    onChange={(e) => setNewBankForm({ ...newBankForm, ma_mon_hoc: e.target.value, ma_lop_hoc_phan: [] })}
                                    className="w-full px-3 py-2.5 text-sm font-semibold text-[#152238] bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                >
                                    <option value="">-- Chọn môn học --</option>
                                    {assignments && assignments.length > 0 ? (
                                        Array.from(new Set(assignments.map(a => a.MaMonHoc))).map(ma => {
                                            const a = assignments.find(item => item.MaMonHoc === ma);
                                            return <option key={ma} value={ma}>{a.TenMonHoc} ({ma})</option>;
                                        })
                                    ) : (
                                        subjects.map(s => <option key={s.MaMonHoc} value={s.MaMonHoc}>{s.TenMonHoc} ({s.MaMonHoc})</option>)
                                    )}
                                </select>
                            </div>

                            {/* Lớp học phần */}
                            {newBankForm.ma_mon_hoc && (
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2.5">
                                    <label className="block text-xs font-extrabold text-[#152238]">
                                        Chọn Lớp học phần áp dụng{' '}
                                        <span className="font-semibold text-gray-500">(để trống = gộp hết lớp của môn này)</span>
                                    </label>
                                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
                                        {(() => {
                                            const classList = assignments.filter(a => a.MaMonHoc === newBankForm.ma_mon_hoc && a.MaLopHocPhan);
                                            if (classList.length === 0) return <span className="text-xs text-gray-400 italic py-1">Môn học này không có lớp học phần riêng.</span>;
                                            return classList.map(a => {
                                                const isSel = Array.isArray(newBankForm.ma_lop_hoc_phan) && newBankForm.ma_lop_hoc_phan.includes(a.MaLopHocPhan);
                                                return (
                                                    <button
                                                        type="button"
                                                        key={a.MaLopHocPhan}
                                                        onClick={() => {
                                                            const cur = Array.isArray(newBankForm.ma_lop_hoc_phan) ? newBankForm.ma_lop_hoc_phan : [];
                                                            setNewBankForm({ ...newBankForm, ma_lop_hoc_phan: isSel ? cur.filter(x => x !== a.MaLopHocPhan) : [...cur, a.MaLopHocPhan] });
                                                        }}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm ${isSel ? 'bg-[#152238] text-[#F4C542] border-[#152238]' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'}`}
                                                    >
                                                        {isSel ? '✓ ' : ''}{a.TenLop ? `Lớp ${a.TenLop}` : a.MaLopHocPhan} ({a.MaLopHocPhan})
                                                    </button>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            )}

                            {/* Tên bộ đề */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold text-gray-700">Tên Bộ đề <span className="text-red-500">*</span> (tối đa 30 ký tự)</label>
                                    <span className={`text-[11px] font-extrabold ${
                                        newBankForm.tieu_de.length >= 30 ? 'text-red-600' : 'text-gray-400'
                                    }`}>
                                        {newBankForm.tieu_de.length}/30
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    maxLength={30}
                                    placeholder="VD: Đề thi Giữa kỳ CNTT1..."
                                    value={newBankForm.tieu_de}
                                    onChange={(e) => setNewBankForm({ ...newBankForm, tieu_de: e.target.value })}
                                    className="w-full px-3 py-2.5 text-sm font-semibold bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>

                            <div className="flex justify-end pt-1 border-t border-gray-100">
                                <button
                                    type="submit"
                                    className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
                                >
                                    <ArrowRight className="w-4 h-4" />
                                    <span>Tiếp tục nhập câu hỏi</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

            ) : (
                /* ════════════════════════════════════════
                   BƯỚC 2 — 2-column: câu hỏi (8/12) | AI sidebar (4/12)
                   ════════════════════════════════════════ */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

                    {/* ─── CỘT TRÁI: Danh sách thẻ câu hỏi (8/12) ─── */}
                    <div className="lg:col-span-8 space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div>
                                <h3 className="font-extrabold text-[#152238] text-base flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-emerald-600" />
                                    Bước 2: Soạn Câu Hỏi
                                    {manualQuestions.length > 0 && (
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-black">{manualQuestions.length} câu</span>
                                    )}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Bộ đề: <strong className="text-[#152238]">"{bankDraft.tieu_de}"</strong>
                                    {pendingBankId && <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[11px] font-bold"> Lưu câu hỏi bị lỗi lần trước — bấm "Lưu bộ đề" để thử lại</span>}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (manualQuestions.length > 0) {
                                            showPopup(
                                                ' Cảnh Báo Đang Soạn Bộ Đề',
                                                `Bạn đang trong quá trình soạn bộ đề "${bankDraft?.tieu_de}" với ${manualQuestions.length} câu hỏi chưa lưu.\n\nNếu quay lại Bước 1, dữ liệu câu hỏi đang nhập sẽ bị xoá hoàn toàn.\n\nBạn có chắc chắn muốn quay lại Bước 1 không?`,
                                                'warning',
                                                () => {
                                                    setBankDraft(null);
                                                    setPendingBankId(null);
                                                    setManualQuestions([]);
                                                    setSavedQuestionsList([]);
                                                }
                                            );
                                        } else {
                                            setBankDraft(null);
                                            setPendingBankId(null);
                                            setManualQuestions([]);
                                            setSavedQuestionsList([]);
                                        }
                                    }}
                                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 transition-all"
                                >
                                    ← Quay lại Bước 1
                                </button>
                                <button
                                    type="button"
                                    onClick={addQuestion}
                                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Thêm câu hỏi</span>
                                </button>
                            </div>
                        </div>

                        {/* Empty state */}
                        {manualQuestions.length === 0 && (
                            <div
                                onClick={addQuestion}
                                className="border-2 border-dashed border-gray-300 rounded-3xl p-10 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all group"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-gray-100 group-hover:bg-emerald-100 text-gray-400 group-hover:text-emerald-600 flex items-center justify-center mx-auto mb-3 transition-all">
                                    <Plus className="w-7 h-7" />
                                </div>
                                <p className="font-black text-gray-500 group-hover:text-emerald-700 text-sm transition-colors">Bấm để thêm câu hỏi đầu tiên</p>
                                <p className="text-xs text-gray-400 mt-1">Hoặc dùng panel AI bên phải để gợi ý và thêm câu hỏi tự động</p>
                            </div>
                        )}

                        {/* Question Cards */}
                        <AnimatePresence>
                            {manualQuestions.map((q, idx) => (
                                <motion.div
                                    key={q.localId}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.97 }}
                                    transition={{ duration: 0.2 }}
                                    className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200 space-y-4"
                                >
                                    {/* Card header */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <span className="w-8 h-8 rounded-xl bg-[#152238] text-white font-black text-sm flex items-center justify-center shrink-0">{idx + 1}</span>
                                            <div>
                                                <span className="font-black text-[#152238] text-sm">Câu hỏi {idx + 1}</span>
                                                {q.ai_generated && (
                                                    <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[11px] font-extrabold rounded-md"> AI Gợi ý</span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeQuestion(q.localId)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                            title="Xoá câu hỏi này"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Chủ đề & Độ khó */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1">Chủ đề câu hỏi</label>
                                            <input
                                                type="text"
                                                value={q.chu_de}
                                                onChange={(e) => updateQuestion(q.localId, { chu_de: e.target.value })}
                                                placeholder="VD: Chương 1, Khái niệm..."
                                                className="w-full px-3 py-2 text-xs font-semibold bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#152238] outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1">Độ khó</label>
                                            <select
                                                value={q.do_kho}
                                                onChange={(e) => updateQuestion(q.localId, { do_kho: e.target.value })}
                                                className="w-full px-3 py-2 text-xs font-semibold bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#152238] outline-none"
                                            >
                                                <option value="Mixed">Hỗn hợp</option>
                                                <option value="Easy">Dễ</option>
                                                <option value="Medium">Trung bình</option>
                                                <option value="Hard">Khó</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Nội dung câu hỏi */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">
                                            Nội dung câu hỏi trắc nghiệm <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            rows={1}
                                            value={q.noi_dung}
                                            onChange={(e) => updateQuestion(q.localId, { noi_dung: e.target.value })}
                                            className="w-full px-3 py-2 text-xs font-semibold bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#152238] outline-none leading-relaxed resize-none"
                                        />
                                    </div>

                                    {/* 4 Đáp án */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-gray-600">
                                            Chọn đáp án đúng bằng nút tròn bên trái <span className="text-red-500">*</span>
                                        </label>
                                        {q.options.map((opt, oIdx) => (
                                            <div key={oIdx} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border-2 transition-all ${opt.is_correct ? 'bg-emerald-50 border-emerald-400' : 'bg-gray-50 border-gray-200'}`}>
                                                <input
                                                    type="radio"
                                                    name={`correct-${q.localId}`}
                                                    checked={Boolean(opt.is_correct)}
                                                    onChange={() => setCorrectOption(q.localId, oIdx)}
                                                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                                                />
                                                <span className={`text-xs font-black w-5 shrink-0 ${opt.is_correct ? 'text-emerald-700' : 'text-gray-400'}`}>
                                                    {['A', 'B', 'C', 'D'][oIdx]}
                                                </span>
                                                <input
                                                    type="text"
                                                    value={opt.text}
                                                    onChange={(e) => updateOption(q.localId, oIdx, e.target.value)}
                                                    placeholder={`Nhập đáp án ${['A', 'B', 'C', 'D'][oIdx]}...`}
                                                    className="flex-1 px-2.5 py-1 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500"
                                                />
                                                {opt.is_correct && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Giải thích */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Giải thích chi tiết (Tuỳ chọn)</label>
                                        <textarea
                                            rows={2}
                                            value={q.giai_thich}
                                            onChange={(e) => updateQuestion(q.localId, { giai_thich: e.target.value })}
                                            placeholder="Giải thích lý do đáp án đó đúng..."
                                            className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#152238] outline-none resize-none"
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Add more (bottom) */}
                        {manualQuestions.length > 0 && (
                            <>
                                <button
                                    type="button"
                                    onClick={addQuestion}
                                    className="w-full py-3 border-2 border-dashed border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/30 rounded-2xl text-xs font-black text-gray-500 hover:text-emerald-700 transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Thêm câu hỏi tiếp theo (Câu {manualQuestions.length + 1})</span>
                                </button>

                                {/* Nút Lưu bộ đề (bottom) */}
                                <button
                                    type="button"
                                    onClick={handleSaveExamBank}
                                    disabled={isSavingAll}
                                    className="w-full py-3.5 bg-gradient-to-r from-[#F4C542] to-amber-500 hover:from-amber-400 hover:to-amber-600 text-[#152238] font-black text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2.5 disabled:opacity-60"
                                >
                                    {isSavingAll ? (
                                        <><RefreshCw className="w-5 h-5 animate-spin text-[#152238]" /><span>Đang tạo bộ đề & lưu câu hỏi...</span></>
                                    ) : (
                                        <><BookmarkCheck className="w-5 h-5 text-[#152238]" /><span>Lưu {manualQuestions.length} câu hỏi vào kho đề</span></>
                                    )}
                                </button>
                            </>
                        )}
                    </div>

                {/* --- CỘT PHẢI: AI GỢI Ý (30%) --- */}
                <div className="w-full lg:w-[320px] shrink-0 border-t lg:border-t-0 lg:border-l border-gray-200 bg-white flex flex-col">
                    <div className="sticky top-0 z-10 bg-white">
                        {/* Sidebar Header */}
                        <div className="bg-gradient-to-br from-[#152238] to-indigo-900 p-4 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-[#F4C542] text-[#152238] flex items-center justify-center shrink-0">
                                        <Sparkles className="w-5 h-5 fill-current" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-sm text-[#F4C542]">AI Gợi Ý Sinh Đề</h4>
                                        <p className="text-[11px] text-gray-300">Trợ lý tham khảo — hạn 30 phút</p>
                                    </div>
                                </div>
                                {expiresAt && (
                                    <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 border border-amber-400/30 text-amber-300 rounded-xl text-[11px] font-bold shrink-0">
                                        <Clock className="w-3 h-3" />
                                        <span>{timeLeftStr}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar Content */}
                        <div className="max-h-[calc(100vh-180px)] overflow-y-auto">
                            <div className="p-4 space-y-4">
                                {/* Cấu hình AI */}
                                <div className="bg-gray-50 rounded-2xl p-3 border border-gray-200 space-y-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-600 mb-1">Môn học *</label>
                                        <select
                                            value={advisorConfig.mon_hoc_id}
                                            onChange={(e) => setAdvisorConfig({ ...advisorConfig, mon_hoc_id: e.target.value })}
                                            className="w-full px-2.5 py-2 text-xs font-semibold bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#152238] outline-none"
                                        >
                                            <option value="">-- Chọn Môn học --</option>
                                            {subjects.map(s => <option key={s.MaMonHoc} value={s.MaMonHoc}>{s.TenMonHoc} ({s.MaMonHoc})</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-600 mb-1">Chương / Chủ đề *</label>
                                            <input
                                                type="text"
                                                value={advisorConfig.chuong_id}
                                                onChange={(e) => handleChuongChange(e.target.value)}
                                                placeholder="VD: Chương 1 hoặc Toàn bộ"
                                                className={`w-full px-2.5 py-2 text-xs font-semibold bg-white border rounded-xl focus:ring-2 focus:ring-[#152238] outline-none transition-all ${
                                                    advisorErrors.chuong_id ? 'border-red-500 bg-red-50/40 text-red-900 ring-1 ring-red-500' : 'border-gray-300'
                                                }`}
                                            />
                                            {advisorErrors.chuong_id && (
                                                <div className="mt-1.5 p-2 bg-red-50 border border-red-200 rounded-xl flex items-start gap-1.5 text-[11px] text-red-600 font-bold leading-snug shadow-sm">
                                                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-600" />
                                                    <span>{advisorErrors.chuong_id}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-[11px] font-bold text-gray-600 mb-1">Độ khó</label>
                                                <select
                                                    value={advisorConfig.do_kho}
                                                    onChange={(e) => setAdvisorConfig({ ...advisorConfig, do_kho: e.target.value })}
                                                    className="w-full px-2 py-2 text-xs font-semibold bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#152238] outline-none"
                                                >
                                                    <option value="Mixed">Hỗn hợp</option>
                                                    <option value="Easy">Dễ</option>
                                                    <option value="Medium">Trung bình</option>
                                                    <option value="Hard">Khó</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-gray-600 mb-1">Số lượng *</label>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={advisorConfig.so_luong}
                                                    onChange={(e) => handleSoLuongChange(e.target.value)}
                                                    placeholder="VD: 10"
                                                    className={`w-full px-2 py-2 text-xs font-semibold bg-white border rounded-xl focus:ring-2 focus:ring-[#152238] outline-none transition-all ${
                                                        advisorErrors.so_luong ? 'border-red-500 bg-red-50/40 text-red-900 ring-1 ring-red-500' : 'border-gray-300'
                                                    }`}
                                                />
                                            </div>
                                            {advisorErrors.so_luong && (
                                                <div className="col-span-2 mt-0.5 p-2 bg-red-50 border border-red-200 rounded-xl flex items-start gap-1.5 text-[11px] text-red-600 font-bold leading-snug shadow-sm">
                                                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-600" />
                                                    <span>{advisorErrors.so_luong}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Upload Word */}
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-600 mb-1">Tài liệu Word (Tuỳ chọn)</label>
                                            <form onSubmit={handleFileUpload} className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-gray-200">
                                                <input
                                                    type="file"
                                                    accept=".doc,.docx"
                                                    onChange={(e) => { setUploadFile(e.target.files[0]); setErrorMessage(''); }}
                                                    className="flex-1 text-[10px] text-gray-600 file:mr-1.5 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer min-w-0"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={isUploading || !uploadFile}
                                                    className="px-2.5 py-1.5 bg-[#152238] hover:bg-indigo-900 disabled:opacity-50 text-white font-bold text-[11px] rounded-lg transition-all flex items-center gap-1 shrink-0"
                                                >
                                                    {isUploading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <UploadCloud className="w-3 h-3" />}
                                                    <span>Tải</span>
                                                </button>
                                            </form>
                                        </div>

                                        {errorMessage && (
                                            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-[11px] rounded-xl flex items-center gap-1.5 font-semibold">
                                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                                <span>{errorMessage}</span>
                                            </div>
                                        )}

                                        {/* Nút gọi AI */}
                                        <button
                                            onClick={handleRequestSuggestions}
                                            disabled={isSuggesting}
                                            className="w-full py-2.5 bg-gradient-to-r from-[#F4C542] to-amber-500 hover:from-amber-400 hover:to-amber-600 text-[#152238] font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                                        >
                                            {isSuggesting ? (
                                                <><RefreshCw className="w-4 h-4 animate-spin" /><span>AI đang suy luận...</span></>
                                            ) : (
                                                <><Sparkles className="w-4 h-4 fill-current" /><span>Nhờ AI gợi ý ({advisorConfig.so_luong} câu)</span></>
                                            )}
                                        </button>
                                    </div>

                                    {/* Banner thêm cả lô vào danh sách */}
                                    {suggestions.length > 0 && (
                                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
                                            <div className="text-[11px] font-semibold text-amber-900">
                                                <span className="font-extrabold text-amber-950 block">📋 Thêm toàn bộ {suggestions.length} gợi ý vào danh sách</span>
                                                <span>Câu hỏi sẽ được thêm vào Bước 2 để bạn rà soát trước khi lưu.</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleAddAllSuggestionsToList}
                                                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                <span>Thêm cả {suggestions.length} câu vào danh sách</span>
                                            </button>
                                        </div>
                                    )}

                                    {/* Danh sách gợi ý */}
                                    {suggestions.length === 0 ? (
                                        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-2xl">
                                            <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                            <p className="text-xs font-bold text-gray-400">Chưa có gợi ý nào.</p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">Chọn môn học và bấm "Nhờ AI gợi ý".</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <p className="text-xs font-extrabold text-gray-700">{suggestions.length} câu hỏi gợi ý:</p>
                                            {suggestions.map((q, idx) => (
                                                <div key={idx} className="p-3 rounded-2xl border border-indigo-100 bg-indigo-50/30 hover:border-indigo-300 transition-all">
                                                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="px-2 py-0.5 bg-[#152238] text-white font-black text-[10px] rounded-md">#{idx + 1}</span>
                                                            <span className={`px-1.5 py-0.5 rounded-md font-bold text-[10px] ${q.do_kho === 'Easy' ? 'bg-emerald-100 text-emerald-800' : q.do_kho === 'Hard' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                                                                {q.do_kho || 'Medium'}
                                                            </span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleLoadToManualForm(q)}
                                                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg shadow-sm transition-all flex items-center gap-0.5"
                                                            title="Thêm vào danh sách câu hỏi để rà soát"
                                                        >
                                                            <span>Dùng gợi ý này</span>
                                                            <ArrowRight className="w-3 h-3" />
                                                        </button>
                                                    </div>

                                                    <p className="text-[11px] font-bold text-gray-900 leading-snug mb-2">{q.cauhoi}</p>

                                                    <div className="space-y-1 text-[10px]">
                                                        {q.dapan_dung && (
                                                            <div className="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-1.5">
                                                                <CheckCircle2 className="w-3 h-3 shrink-0" />
                                                                <span className="font-bold">{q.dapan_dung}</span>
                                                            </div>
                                                        )}
                                                        {Array.isArray(q.dapan_nhieu) && q.dapan_nhieu.map((opt, oIdx) => (
                                                            <div key={oIdx} className="px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 pl-5">{opt}</div>
                                                        ))}
                                                    </div>

                                                    {q.giai_thich && (
                                                        <div className="mt-2 p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-[10px] text-indigo-800">
                                                            <strong>Giải thích:</strong> {q.giai_thich}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Popup Thông Báo & Ràng Buộc (Chuẩn UI/UX Ảnh 2: Centered Modal + Dim Backdrop + Clean Header/Footer) ── */}
            <AnimatePresence>
                {popupAlert.show && (
                    <ModalPortal>
                        <div className="fixed inset-0 z-[100000] flex items-start justify-center p-4 pt-16 md:pt-24 bg-slate-900/20 backdrop-blur-[2px] transition-all">
                            <motion.div
                                initial={{ y: -50, opacity: 0, scale: 0.95 }}
                                animate={{ y: 0, opacity: 1, scale: 1 }}
                                exit={{ y: -50, opacity: 0, scale: 0.95 }}
                                transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
                                className="bg-white rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100"
                            >
                                {/* Header Chuẩn Ảnh 2 */}
                                <div className="p-6 border-b bg-gray-50 flex justify-between items-center shrink-0">
                                    <div className="flex items-center gap-3">
                                        {popupAlert.type === 'success' && <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600 shrink-0"><CheckCircle2 className="w-6 h-6" /></div>}
                                        {popupAlert.type === 'warning' && <div className="p-2 rounded-xl bg-amber-100 text-[#D49A00] shrink-0"><AlertTriangle className="w-6 h-6" /></div>}
                                        {popupAlert.type === 'error' && <div className="p-2 rounded-xl bg-red-100 text-red-600 shrink-0"><AlertCircle className="w-6 h-6" /></div>}
                                        <div>
                                            <h3 className={`text-xl font-extrabold ${
                                                popupAlert.type === 'warning' ? 'text-[#D49A00]' :
                                                popupAlert.type === 'success' ? 'text-emerald-600' :
                                                popupAlert.type === 'error' ? 'text-red-600' : 'text-[#152238]'
                                            }`}>{popupAlert.title}</h3>
                                            <p className="text-xs text-gray-500 font-medium mt-0.5">Hệ thống ghi nhận thông báo chi tiết</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setPopupAlert({ ...popupAlert, show: false })}
                                        className="p-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-full transition-colors shrink-0"
                                    >
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Body Chuẩn Ảnh 2 */}
                                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                                    <p className="text-sm md:text-base font-semibold text-gray-800 leading-relaxed whitespace-pre-line">
                                        {popupAlert.message}
                                    </p>
                                </div>

                                {/* Footer Chuẩn Ảnh 2 */}
                                <div className="p-5 border-t bg-gray-50 flex justify-end gap-3 shrink-0">
                                    {popupAlert.onConfirm ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => setPopupAlert({ ...popupAlert, show: false })}
                                                className="px-6 py-2.5 bg-white border border-gray-300 rounded-2xl text-gray-700 font-bold hover:bg-gray-100 transition-all shadow-sm text-sm"
                                            >
                                                Hủy bỏ
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (popupAlert.onConfirm) popupAlert.onConfirm();
                                                    setPopupAlert({ ...popupAlert, show: false });
                                                }}
                                                className="px-7 py-2.5 bg-[#F4C542] hover:bg-[#e0b134] text-[#152238] font-extrabold rounded-2xl shadow-md transition-all text-sm flex items-center gap-1.5"
                                            >
                                                <span>Đồng ý / Xác Nhận</span>
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setPopupAlert({ ...popupAlert, show: false })}
                                            className="px-7 py-2.5 bg-[#F4C542] hover:bg-[#e0b134] text-[#152238] font-extrabold rounded-2xl shadow-md transition-all text-sm"
                                        >
                                            Đã Hiểu / Đóng
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </ModalPortal>
                )}
            </AnimatePresence>
        </div>
    );
}

export default AiQuestionGenerator;
