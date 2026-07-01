import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Play, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import axios from 'axios';
import API_URL from '../../api';
import ModalPortal, { Toast, ConfirmDialog } from '../common/ModalPortal';

function StudentAIPractice({ user }) {
    const [subjects, setSubjects] = useState([]);
    const [config, setConfig] = useState({ ma_mon_hoc: '', so_cau: 10, do_kho: 'Mix' });
    
    const [isPracticing, setIsPracticing] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { question_id: option_id }
    const [attemptId, setAttemptId] = useState(null);
    
    const [result, setResult] = useState(null); // { score, correctCount, total }
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const showToast = (message, type = 'success') => { setToast({ show: true, message, type }); setTimeout(() => setToast({ show: false }), 3000); };

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                // Should fetch registered subjects for the student, or all subjects
                const res = await axios.get(`${API_URL}/api/subjects`);
                setSubjects(res.data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchSubjects();
    }, []);

    const handleStart = async (e) => {
        e.preventDefault();
        if (!config.ma_mon_hoc) return showToast('Vui lòng chọn môn học!', 'error');

        try {
            const res = await axios.post(`${API_URL}/api/ai-exams/practice/start`, {
                mssv: user.MSSV,
                ...config
            });
            if (res.data.questions.length === 0) {
                return showToast('Môn học này chưa có câu hỏi nào được duyệt!', 'error');
            }
            setQuestions(res.data.questions);
            setAttemptId(res.data.attempt_id);
            setIsPracticing(true);
            setAnswers({});
            setResult(null);
            setCurrentQIndex(0);
        } catch (error) {
            showToast('Lỗi khi tải đề!', 'error');
        }
    };

    const handleSelectOption = (qId, oId) => {
        if (result) return; // Đã nộp thì không đổi
        setAnswers({ ...answers, [qId]: oId });
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const answersArray = questions.map(q => ({
            question_id: q.id,
            selected_option_id: answers[q.id] || null
        }));

        try {
            const res = await axios.post(`${API_URL}/api/ai-exams/practice/submit`, {
                attempt_id: attemptId,
                answers: answersArray
            });
            setResult(res.data);
            showToast(`Bạn đạt ${res.data.score.toFixed(2)} điểm!`);
        } catch (error) {
            showToast('Lỗi khi nộp bài!', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isPracticing) {
        const currentQ = questions[currentQIndex];
        return (
            <div className="p-4 max-w-4xl mx-auto space-y-6">
                <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
                <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2"><BrainCircuit className="w-6 h-6 text-indigo-500" /> Luyện tập AI</h2>
                        <p className="text-gray-500">Đang luyện tập môn học</p>
                    </div>
                    {result ? (
                        <div className="text-right">
                            <p className="text-sm font-bold text-gray-500 uppercase">Kết quả</p>
                            <p className="text-3xl font-black text-indigo-600">{result.score.toFixed(2)} <span className="text-lg text-gray-400">/ 10</span></p>
                        </div>
                    ) : (
                        <button onClick={() => setConfirmDialog({show: true, title: 'Thoát luyện tập?', message: 'Bài làm sẽ không được lưu. Bạn có chắc?', action: () => setIsPracticing(false)})} className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200">
                            Thoát
                        </button>
                    )}
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <span className="bg-indigo-100 text-indigo-800 px-4 py-1.5 rounded-full font-bold text-sm">Câu {currentQIndex + 1} / {questions.length}</span>
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${currentQ.do_kho==='Easy'?'bg-green-100 text-green-700':currentQ.do_kho==='Medium'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}`}>{currentQ.do_kho}</span>
                    </div>

                    <h3 className="text-xl font-semibold mb-6 text-gray-800">{currentQ.noi_dung}</h3>

                    <div className="space-y-3">
                        {currentQ.options?.map((opt, oIdx) => {
                            const isSelected = answers[currentQ.id] === opt.id;
                            let style = "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700";
                            
                            if (isSelected) style = "border-indigo-500 bg-indigo-50 text-indigo-900 font-medium";
                            
                            // Nếu đã nộp bài, hiển thị đáp án đúng sai
                            if (result) {
                                if (opt.is_correct) {
                                    style = "border-green-500 bg-green-50 text-green-900 font-bold shadow-sm";
                                } else if (isSelected && !opt.is_correct) {
                                    style = "border-red-500 bg-red-50 text-red-900 font-bold";
                                } else {
                                    style = "border-gray-100 opacity-50";
                                }
                            }

                            return (
                                <div key={opt.id} onClick={() => handleSelectOption(currentQ.id, opt.id)} className={`p-4 border-2 rounded-xl cursor-pointer transition-all flex items-center justify-between ${style}`}>
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-sm font-bold shadow-sm">{String.fromCharCode(65 + oIdx)}</span>
                                        <span>{opt.text}</span>
                                    </div>
                                    {result && opt.is_correct && <CheckCircle2 className="w-6 h-6 text-green-500" />}
                                    {result && isSelected && !opt.is_correct && <XCircle className="w-6 h-6 text-red-500" />}
                                </div>
                            );
                        })}
                    </div>

                    <AnimatePresence>
                        {result && currentQ.giai_thich && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-6 bg-blue-50 border border-blue-100 p-5 rounded-xl">
                                <h4 className="text-blue-900 font-bold mb-2 flex items-center gap-2"><BrainCircuit className="w-5 h-5"/> Giải thích từ AI</h4>
                                <p className="text-blue-800 text-sm leading-relaxed">{currentQ.giai_thich}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
                        <button disabled={currentQIndex === 0} onClick={() => setCurrentQIndex(i => i - 1)} className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl disabled:opacity-50">Trước</button>
                        
                        {!result && currentQIndex === questions.length - 1 ? (
                            <button onClick={handleSubmit} disabled={isSubmitting} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700">
                                {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
                            </button>
                        ) : (
                            <div className="flex gap-3">
                                {result && currentQIndex === questions.length - 1 && (
                                    <button onClick={() => setIsPracticing(false)} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg flex items-center gap-2">
                                        <RotateCcw className="w-5 h-5" /> Luyện tập lại
                                    </button>
                                )}
                                <button disabled={currentQIndex === questions.length - 1} onClick={() => setCurrentQIndex(i => i + 1)} className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl disabled:opacity-50 hover:bg-gray-200 transition-colors">Sau</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-4 max-w-4xl mx-auto w-full">
            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
            
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-10 shadow-2xl text-white text-center">
                <BrainCircuit className="w-16 h-16 mx-auto mb-4 text-indigo-200" />
                <h2 className="text-4xl font-black mb-3">Luyện tập AI Thông minh</h2>
                <p className="text-indigo-100 text-lg max-w-2xl mx-auto">Hệ thống AI sẽ lựa chọn ngẫu nhiên các câu hỏi trong Ngân hàng đề để giúp bạn củng cố kiến thức tốt nhất.</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
                <form onSubmit={handleStart} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-3">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Chọn môn học cần luyện tập</label>
                            <select required value={config.ma_mon_hoc} onChange={e => setConfig({...config, ma_mon_hoc: e.target.value})} className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none transition-colors text-lg font-medium text-gray-700 bg-gray-50">
                                <option value="">-- Môn học --</option>
                                {subjects.map(s => <option key={s.MaMonHoc} value={s.MaMonHoc}>{s.TenMonHoc}</option>)}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Số lượng câu hỏi</label>
                            <select value={config.so_cau} onChange={e => setConfig({...config, so_cau: e.target.value})} className="w-full p-4 border-2 border-gray-200 rounded-xl outline-none focus:border-indigo-500 bg-gray-50">
                                <option value="10">10 câu</option>
                                <option value="20">20 câu</option>
                                <option value="30">30 câu</option>
                                <option value="50">50 câu</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Độ khó mong muốn</label>
                            <div className="grid grid-cols-4 gap-3">
                                {['Mix', 'Easy', 'Medium', 'Hard'].map(level => (
                                    <div 
                                        key={level} 
                                        onClick={() => setConfig({...config, do_kho: level})} 
                                        className={`cursor-pointer text-center p-3 rounded-xl border-2 font-bold transition-all ${config.do_kho === level ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-indigo-300'}`}
                                    >
                                        {level === 'Mix' ? 'Trộn lẫn' : level === 'Easy' ? 'Dễ' : level === 'Medium' ? 'Vừa' : 'Khó'}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="w-full py-4 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xl rounded-xl shadow-[0_8px_30px_rgb(79,70,229,0.3)] hover:shadow-[0_8px_40px_rgb(79,70,229,0.5)] transition-all flex justify-center items-center gap-3">
                        <Play className="w-6 h-6 fill-current" />
                        Bắt Đầu Luyện Tập
                    </button>
                </form>
            </div>
        </div>
    );
}

export default StudentAIPractice;
