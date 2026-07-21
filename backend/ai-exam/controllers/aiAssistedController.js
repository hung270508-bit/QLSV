module.exports = (service, dbPromise) => {
    return {
        // 1. Quản lý tài liệu Word
        uploadDocument: async (req, res) => {
            try {
                const file = req.file;
                const { ma_mon_hoc, ma_giang_vien, tieu_de, ten_mon_hoc } = req.body;
                
                if (!file || !ma_mon_hoc || !ma_giang_vien || !tieu_de) {
                    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ file tài liệu, môn học, giảng viên và tiêu đề.' });
                }

                const docData = await service.uploadDocument(file, { ma_mon_hoc, ma_giang_vien, tieu_de, ten_mon_hoc });
                res.json({ success: true, data: docData, is_relevant: docData.is_relevant, message: 'Tải lên tài liệu và phân tích nội dung thành công! Tài liệu đã sẵn sàng.' });
            } catch (error) {
                console.error('Upload document error:', error);
                res.status(500).json({ success: false, message: error.message });
            }
        },

        getDocumentsByTeacher: async (req, res) => {
            try {
                const { ma_giang_vien } = req.params;
                const rows = await service.getDocumentsByTeacher(ma_giang_vien);
                res.json({ success: true, data: rows, message: 'Lấy danh sách tài liệu thành công' });
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        },

        // 2. AI Advisor: Tạo gợi ý & xem gợi ý theo phiên
        suggestQuestions: async (req, res) => {
            try {
                const giangvien_id = req.user?.id || req.user?.username || req.user?.TaiKhoan;
                if (!giangvien_id) {
                    return res.status(401).json({ success: false, message: 'Không xác định được thông tin giảng viên từ token' });
                }

                const { mon_hoc_id, chuong_id, do_kho, so_luong, document_id } = req.body;
                if (!mon_hoc_id && !document_id) {
                    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã môn học hoặc tài liệu.' });
                }

                const result = await service.suggestQuestions({
                    mon_hoc_id,
                    chuong_id,
                    do_kho,
                    so_luong,
                    document_id,
                    giangvien_id
                });

                res.json({
                    success: true,
                    session_id: result.session_id,
                    goi_y: result.goi_y,
                    expires_at: result.expires_at,
                    message: `AI đã gợi ý ${result.goi_y.length} câu hỏi thành công!`
                });
            } catch (error) {
                console.error('Suggest questions error:', error);
                const statusCode = error.statusCode || 500;
                res.status(statusCode).json({
                    success: false,
                    message: error.message,
                    ...(error.validationCode ? { validationCode: error.validationCode } : {}),
                    ...(error.suggestedMax !== undefined ? { suggestedMax: error.suggestedMax } : {})
                });
            }
        },

        getSuggestions: async (req, res) => {
            try {
                const giangvien_id = req.user?.id || req.user?.username || req.user?.TaiKhoan;
                if (!giangvien_id) {
                    return res.status(401).json({ success: false, message: 'Không xác định được thông tin giảng viên' });
                }

                const { session_id } = req.params;
                const result = await service.getSuggestions(session_id, giangvien_id);

                res.json({
                    success: true,
                    session_id: result.session_id,
                    tieu_chi: result.tieu_chi,
                    goi_y: result.goi_y,
                    expires_at: result.expires_at
                });
            } catch (error) {
                console.error('Get suggestions error:', error);
                const statusCode = error.statusCode || 500;
                res.status(statusCode).json({ success: false, message: error.message });
            }
        },

        // 3. Quản lý Ngân hàng câu hỏi chính thức (tương thích ExamManagement)
        getTeacherQuestionBanks: async (req, res) => {
            try {
                const { ma_giang_vien } = req.params;
                const rows = await service.getTeacherQuestionBanks(ma_giang_vien);
                res.json({ success: true, data: rows, message: 'Lấy danh sách Ngân hàng câu hỏi chính thức thành công' });
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        },

        getBankQuestions: async (req, res) => {
            try {
                const { id } = req.params;
                const qs = await service.getBankQuestions(id);
                res.json({ success: true, data: qs, message: 'Lấy câu hỏi trong Ngân hàng thành công' });
            } catch (error) {
                console.error('Get bank questions error:', error);
                res.status(500).json({ success: false, message: error.message });
            }
        },

        deleteOfficialBank: async (req, res) => {
            try {
                const { id } = req.params;
                await service.deleteOfficialBank(id);
                res.json({ success: true, message: 'Đã xóa Ngân hàng câu hỏi!' });
            } catch (error) {
                console.error('Delete official bank error:', error);
                res.status(500).json({ success: false, message: error.message });
            }
        },

        updateOfficialBank: async (req, res) => {
            try {
                const { id } = req.params;
                const { tieu_de } = req.body;
                await service.updateOfficialBank(id, { tieu_de });
                res.json({ success: true, message: 'Cập nhật tên Ngân hàng thành công!' });
            } catch (error) {
                console.error('Update official bank error:', error);
                res.status(500).json({ success: false, message: error.message });
            }
        },

        createOfficialBank: async (req, res) => {
            try {
                const { ma_mon_hoc, ma_giang_vien, tieu_de, ma_lop_hoc_phan, questions } = req.body;
                if (!ma_mon_hoc || !ma_giang_vien || !tieu_de) {
                    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã môn học, giảng viên và tiêu đề Ngân hàng câu hỏi.' });
                }
                const bank = await service.createOfficialBank({ ma_mon_hoc, ma_giang_vien, tieu_de, ma_lop_hoc_phan, questions: Array.isArray(questions) ? questions : [] });
                res.json({ success: true, data: bank, message: 'Tạo Ngân hàng câu hỏi mới thành công!' });
            } catch (error) {
                console.error('Create official bank error:', error);
                res.status(500).json({ success: false, message: error.message });
            }
        },

        addQuestionToBank: async (req, res) => {
            try {
                const { id } = req.params; // bankId
                const { chu_de, noi_dung, giai_thich, do_kho, options, nguon, ai_generated } = req.body;
                const creator_id = req.user?.id || req.user?.username || req.user?.TaiKhoan || null;

                if (!noi_dung || !options || !Array.isArray(options) || options.length !== 4) {
                    return res.status(400).json({ success: false, message: 'Câu hỏi thủ công bắt buộc phải có nội dung và chính xác 4 đáp án.' });
                }
                if (!options.some(opt => opt.is_correct || opt.la_dap_an_dung)) {
                    return res.status(400).json({ success: false, message: 'Bắt buộc phải chọn ít nhất 1 đáp án đúng cho câu hỏi.' });
                }

                const questionId = await service.addQuestionToBank(id, { chu_de, noi_dung, giai_thich, do_kho, options, nguon: nguon || (ai_generated ? 'AI Gợi ý' : 'GV'), ai_generated, creator_id });
                res.json({ success: true, questionId, message: 'Đã lưu câu hỏi vào Ngân hàng chính thức thành công!' });
            } catch (error) {
                console.error('Add question to bank error:', error);
                const statusCode = error.statusCode || 500;
                res.status(statusCode).json({ success: false, message: error.message });
            }
        },

        addQuestionsBatchToBank: async (req, res) => {
            try {
                const { id } = req.params; // bankId
                const questions = Array.isArray(req.body.questions) ? req.body.questions : (Array.isArray(req.body) ? req.body : []);
                const creator_id = req.user?.id || req.user?.username || req.user?.TaiKhoan || null;

                if (!questions || questions.length === 0) {
                    return res.status(400).json({ success: false, message: 'Danh sách câu hỏi cần lưu trống.' });
                }

                for (const q of questions) {
                    if (!q.noi_dung && !q.cauhoi) {
                        return res.status(400).json({ success: false, message: 'Tất cả câu hỏi trong danh sách bắt buộc phải có nội dung.' });
                    }
                }

                const addedIds = await service.addQuestionsBatchToBank(id, questions, creator_id);
                res.json({ success: true, addedCount: addedIds.length, addedIds, message: `Đã lưu thành công ${addedIds.length} câu hỏi vào Ngân hàng chính thức!` });
            } catch (error) {
                console.error('Add questions batch error:', error);
                const statusCode = error.statusCode || 500;
                res.status(statusCode).json({ success: false, message: error.message });
            }
        },

        updateQuestion: async (req, res) => {
            try {
                const { id } = req.params;
                const { noi_dung, giai_thich, do_kho, chu_de, options } = req.body;

                if (!noi_dung || !options || !Array.isArray(options) || options.length !== 4) {
                    return res.status(400).json({ success: false, message: 'Câu hỏi bắt buộc phải có nội dung và chính xác 4 đáp án.' });
                }
                if (!options.some(opt => opt.is_correct)) {
                    return res.status(400).json({ success: false, message: 'Bắt buộc phải chọn ít nhất 1 đáp án đúng.' });
                }

                await service.updateQuestion(id, { noi_dung, giai_thich, do_kho, chu_de, options });
                res.json({ success: true, message: 'Cập nhật câu hỏi thành công!' });
            } catch (error) {
                console.error('Update question error:', error);
                res.status(500).json({ success: false, message: error.message });
            }
        },

        deleteQuestion: async (req, res) => {
            try {
                const { id } = req.params;
                await service.deleteQuestion(id);
                res.json({ success: true, message: 'Đã xóa câu hỏi!' });
            } catch (error) {
                console.error('Delete question error:', error);
                res.status(500).json({ success: false, message: error.message });
            }
        }
    };
};
