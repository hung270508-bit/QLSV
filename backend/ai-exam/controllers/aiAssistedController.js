module.exports = (service, dbPromise) => {
    return {
        // 1. Quản lý tài liệu
        uploadDocument: async (req, res) => {
            try {
                const file = req.file;
                const { ma_mon_hoc, ma_giang_vien, tieu_de } = req.body;
                
                if (!file || !ma_mon_hoc || !ma_giang_vien || !tieu_de) {
                    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ file tài liệu, môn học, giảng viên và tiêu đề.' });
                }

                const docData = await service.uploadDocument(file, { ma_mon_hoc, ma_giang_vien, tieu_de });
                res.json({ success: true, data: docData, message: 'Tải lên tài liệu và phân tích nội dung thành công! Tài liệu đã sẵn sàng.' });
            } catch (error) {
                console.error('Upload document error:', error);
                res.status(500).json({ success: false, message: error.message });
            }
        },

        getDocumentsByTeacher: async (req, res) => {
            try {
                const { ma_giang_vien } = req.params;
                const [rows] = await dbPromise.query(
                    `SELECT d.*, m.TenMonHoc 
                     FROM documents d 
                     JOIN monhoc m ON d.ma_mon_hoc = m.MaMonHoc 
                     WHERE d.ma_giang_vien = ? 
                     ORDER BY d.created_at DESC`,
                    [ma_giang_vien]
                );
                res.json({ success: true, data: rows, message: 'Lấy danh sách tài liệu thành công' });
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        },

        // 2. Quản lý phiên sinh AI
        startSession: async (req, res) => {
            try {
                const { document_id, ma_mon_hoc, ma_giang_vien, so_cau_yeu_cau, do_kho, chu_de } = req.body;
                if (!document_id || !ma_mon_hoc || !ma_giang_vien) {
                    return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc để khởi tạo phiên sinh câu hỏi.' });
                }

                const session = await service.startSession({
                    document_id,
                    ma_mon_hoc,
                    ma_giang_vien,
                    so_cau_yeu_cau: so_cau_yeu_cau || 10,
                    do_kho: do_kho || 'Mixed',
                    chu_de: chu_de || 'Toàn bộ'
                });

                res.json({ success: true, data: session, message: 'Bắt đầu sinh câu hỏi bằng AI thành công!' });
            } catch (error) {
                console.error('Start AI session error:', error);
                res.status(500).json({ success: false, message: error.message });
            }
        },

        resumeSession: async (req, res) => {
            try {
                const { id } = req.params;
                const session = await service.resumeSession(id);
                res.json({ success: true, data: session, message: 'Đã sinh thêm 10 câu hỏi thành công!' });
            } catch (error) {
                console.error('Resume AI session error:', error);
                res.status(500).json({ success: false, message: error.message });
            }
        },

        getSessionsByTeacher: async (req, res) => {
            try {
                const { ma_giang_vien } = req.params;
                const sessions = await service.getSessionsByTeacher(ma_giang_vien);
                res.json({ success: true, data: sessions, message: 'Lấy danh sách phiên sinh câu hỏi thành công' });
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        },

        // 3. Quản lý câu hỏi chờ duyệt / đã duyệt
        getQuestionsBySession: async (req, res) => {
            try {
                const { id } = req.params;
                const { trang_thai, do_kho } = req.query;
                const questions = await service.getQuestionsBySession(id, { trang_thai, do_kho });
                res.json({ success: true, data: questions, message: 'Lấy danh sách câu hỏi thành công' });
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        },

        updateQuestionStatus: async (req, res) => {
            try {
                const { id } = req.params;
                const { trang_thai } = req.body; // PENDING, APPROVED, REJECTED
                if (!['PENDING', 'APPROVED', 'REJECTED'].includes(trang_thai)) {
                    return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
                }

                await service.updateQuestionStatus(id, trang_thai);
                res.json({ success: true, message: trang_thai === 'APPROVED' ? 'Đã duyệt câu hỏi vào Ngân hàng chính thức!' : 'Đã cập nhật trạng thái câu hỏi!' });
            } catch (error) {
                console.error('Update question status error:', error);
                res.status(500).json({ success: false, message: error.message });
            }
        },

        approveAllInSession: async (req, res) => {
            try {
                const { id } = req.params;
                const count = await service.approveAllInSession(id);
                res.json({ success: true, data: { approved_count: count }, message: `Đã duyệt thành công ${count} câu hỏi vào Ngân hàng chính thức!` });
            } catch (error) {
                console.error('Approve all error:', error);
                res.status(500).json({ success: false, message: error.message });
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
        },

        // 4. Quản lý Ngân hàng câu hỏi chính thức (dùng cho kỳ thi Online)
        getTeacherQuestionBanks: async (req, res) => {
            try {
                const { ma_giang_vien } = req.params;
                const [rows] = await dbPromise.query(
                    `SELECT b.*, m.TenMonHoc 
                     FROM question_banks b 
                     JOIN monhoc m ON b.ma_mon_hoc = m.MaMonHoc 
                     WHERE b.ma_giang_vien = ? 
                     ORDER BY b.created_at DESC`,
                    [ma_giang_vien]
                );
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
        }
    };
};
