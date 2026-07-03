const express = require('express');
const multer = require('multer');
const { extractTextFromDocx, generateQuestionsFromText } = require('./services/aiService');

const router = express.Router();
const upload = multer({ dest: require('os').tmpdir() });

module.exports = (db) => {
    const dbPromise = db.promise();

    // Helper execute function for async pool queries
    const execute = async (query, params) => {
        const [rows] = await dbPromise.query(query, params);
        return rows;
    };

    // 1. Khởi tạo Repository, Service & Controller cho AI Assisted Question Bank
    const aiAssistedRepo = require('./repositories/aiAssistedRepo')(dbPromise);
    const aiAssistedService = require('./services/aiAssistedService')(aiAssistedRepo);
    const aiAssistedController = require('./controllers/aiAssistedController')(aiAssistedService, dbPromise);

    // 2. Các routes mới của AI Assisted Question Bank
    router.post('/documents/upload', upload.single('file'), aiAssistedController.uploadDocument);
    router.get('/documents/teacher/:ma_giang_vien', aiAssistedController.getDocumentsByTeacher);

    router.post('/sessions/start', aiAssistedController.startSession);
    router.post('/sessions/:id/resume', aiAssistedController.resumeSession);
    router.get('/sessions/teacher/:ma_giang_vien', aiAssistedController.getSessionsByTeacher);

    router.get('/sessions/:id/questions', aiAssistedController.getQuestionsBySession);
    router.put('/questions/:id/status', aiAssistedController.updateQuestionStatus);
    router.put('/questions/:id', aiAssistedController.updateQuestion);
    router.post('/sessions/:id/approve-all', aiAssistedController.approveAllInSession);
    router.delete('/questions/:id', aiAssistedController.deleteQuestion);

    // Route giữ lại để tương thích với ExamManagement.jsx khi chọn Ngân hàng câu hỏi
    router.get('/banks/teacher/:ma_giang_vien', aiAssistedController.getTeacherQuestionBanks);
    router.get('/banks/:id/questions', aiAssistedController.getBankQuestions);
    router.delete('/banks/:id', aiAssistedController.deleteOfficialBank);
    router.put('/banks/:id', aiAssistedController.updateOfficialBank);

    // 7. Tạo kỳ thi (Giảng viên)
    router.post('/exams', async (req, res) => {
        try {
            const { ma_lop_hoc_phan, ma_mon_hoc, ma_giang_vien, tieu_de, thoi_gian_thi_phut, tong_so_cau, so_cau_de, so_cau_tb, so_cau_kho, thoi_gian_bat_dau, thoi_gian_ket_thuc, cho_phep_thi_lai } = req.body;

            const [result] = await dbPromise.query(
                `INSERT INTO exams (ma_lop_hoc_phan, ma_mon_hoc, ma_giang_vien, tieu_de, thoi_gian_thi_phut, tong_so_cau, so_cau_de, so_cau_tb, so_cau_kho, thoi_gian_bat_dau, thoi_gian_ket_thuc, cho_phep_thi_lai) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [ma_lop_hoc_phan, ma_mon_hoc, ma_giang_vien, tieu_de, thoi_gian_thi_phut, tong_so_cau, so_cau_de, so_cau_tb, so_cau_kho, thoi_gian_bat_dau, thoi_gian_ket_thuc, cho_phep_thi_lai]
            );
            res.json({ success: true, exam_id: result.insertId });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 7b. Lấy danh sách kỳ thi của Giảng viên
    router.get('/exams/teacher/:ma_giang_vien', async (req, res) => {
        try {
            const query = `
                SELECT e.*, m.TenMonHoc 
                FROM exams e 
                LEFT JOIN monhoc m ON e.ma_mon_hoc = m.MaMonHoc
                WHERE e.ma_giang_vien = ?
                ORDER BY e.id DESC
            `;
            const exams = await execute(query, [req.params.ma_giang_vien]);
            res.json(exams);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 8. Lấy danh sách kỳ thi của Sinh viên
    router.get('/exams/student/:mssv', async (req, res) => {
        try {
            const query = `
                SELECT e.*, m.TenMonHoc 
                FROM exams e 
                JOIN monhoc m ON e.ma_mon_hoc = m.MaMonHoc
                JOIN dangky_hocphan dk ON e.ma_lop_hoc_phan = dk.MaLopHocPhan
                WHERE dk.MSSV = ? AND dk.TrangThai NOT IN ('Da huy', 'Tu choi', 'Đã hủy', 'Từ chối') AND (e.trang_thai != 'Completed' OR e.trang_thai IS NULL)
            `;
            const exams = await execute(query, [req.params.mssv]);
            res.json(exams);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 9. Bắt đầu thi
    router.post('/exams/:exam_id/start', async (req, res) => {
        let connection;
        try {
            const examId = req.params.exam_id;
            const { mssv } = req.body;

            connection = await dbPromise.getConnection();
            const [exams] = await connection.query(`SELECT * FROM exams WHERE id = ?`, [examId]);
            const exam = exams[0];
            if (!exam) return res.status(404).json({ success: false, message: 'Không tìm thấy kỳ thi' });

            const now = new Date();
            if (now < new Date(exam.thoi_gian_bat_dau)) return res.status(400).json({ success: false, message: 'Chưa tới giờ thi' });
            if (now > new Date(exam.thoi_gian_ket_thuc)) return res.status(400).json({ success: false, message: 'Đã quá giờ thi' });

            const [prevAttempts] = await connection.query(`SELECT id FROM exam_attempts WHERE exam_id = ? AND mssv = ? AND trang_thai = 'Submitted'`, [examId, mssv]);
            if (prevAttempts.length > 0) return res.status(400).json({ success: false, message: 'Bạn đã hoàn thành bài thi này. Mỗi sinh viên chỉ được thi 1 lần duy nhất!' });

            const [attRes] = await connection.query(`INSERT INTO exam_attempts (exam_id, mssv) VALUES (?, ?)`, [examId, mssv]);
            const attemptId = attRes.insertId;

            const generateQs = async (diff, limit) => {
                let diffCond = '';
                if (diff === 'Easy') diffCond = "(q.do_kho = 'Easy' OR q.do_kho = 'Dễ' OR q.do_kho = 'easy' OR q.do_kho = 'dễ')";
                else if (diff === 'Medium') diffCond = "(q.do_kho = 'Medium' OR q.do_kho = 'Trung bình' OR q.do_kho = 'medium' OR q.do_kho = 'trung bình')";
                else if (diff === 'Hard') diffCond = "(q.do_kho = 'Hard' OR q.do_kho = 'Khó' OR q.do_kho = 'hard' OR q.do_kho = 'khó')";
                else diffCond = "q.do_kho = ?";

                const [qs] = await connection.query(`
                    SELECT q.id, q.noi_dung 
                    FROM questions q 
                    JOIN question_banks b ON q.bank_id = b.id 
                    WHERE b.ma_mon_hoc = ? AND ${diffCond} AND b.trang_thai = 'Approved' AND q.trang_thai = 'Approved'
                    ORDER BY RAND() LIMIT ?
                `, [exam.ma_mon_hoc, limit]);
                return qs;
            };

            let questions = [];
            if (exam.so_cau_de > 0) questions.push(...await generateQs('Easy', exam.so_cau_de));
            if (exam.so_cau_tb > 0) questions.push(...await generateQs('Medium', exam.so_cau_tb));
            if (exam.so_cau_kho > 0) questions.push(...await generateQs('Hard', exam.so_cau_kho));

            const targetTotal = Number(exam.tong_so_cau) || (Number(exam.so_cau_de) + Number(exam.so_cau_tb) + Number(exam.so_cau_kho));
            if (questions.length < targetTotal) {
                const needed = targetTotal - questions.length;
                const existingIds = questions.map(q => q.id);
                const notInClause = existingIds.length > 0 ? `AND q.id NOT IN (${existingIds.join(',')})` : '';
                const [extraQs] = await connection.query(`
                    SELECT q.id, q.noi_dung 
                    FROM questions q 
                    JOIN question_banks b ON q.bank_id = b.id 
                    WHERE b.ma_mon_hoc = ? AND b.trang_thai = 'Approved' AND q.trang_thai = 'Approved' ${notInClause}
                    ORDER BY RAND() LIMIT ?
                `, [exam.ma_mon_hoc, needed]);
                questions.push(...extraQs);
            }

            questions.sort(() => Math.random() - 0.5);

            for (const q of questions) {
                const [options] = await connection.query(`SELECT id, noi_dung FROM question_options WHERE question_id = ? ORDER BY RAND()`, [q.id]);
                q.options = options;
            }

            res.json({ success: true, attempt_id: attemptId, questions, duration: exam.thoi_gian_thi_phut });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: error.message });
        } finally {
            if (connection) connection.release();
        }
    });

    // 10. Nộp bài thi
    router.post('/exams/submit', async (req, res) => {
        try {
            const { attempt_id, answers } = req.body;
            let correctCount = 0;

            for (const ans of answers) {
                let isCorrect = false;
                if (ans.selected_option_id) {
                    const [opt] = await execute(`SELECT la_dap_an_dung FROM question_options WHERE id = ?`, [ans.selected_option_id]);
                    if (opt && opt.la_dap_an_dung === 1) {
                        isCorrect = true;
                        correctCount++;
                    }
                }

                await dbPromise.query(
                    `INSERT INTO exam_attempt_answers (attempt_id, question_id, selected_option_id, la_dap_an_dung) VALUES (?, ?, ?, ?)`,
                    [attempt_id, ans.question_id, ans.selected_option_id || null, isCorrect ? 1 : 0]
                );
            }

            const score = answers.length > 0 ? (correctCount / answers.length) * 10 : 0;
            await dbPromise.query(`UPDATE exam_attempts SET diem_so = ?, thoi_gian_nop_bai = CURRENT_TIMESTAMP, trang_thai = 'Submitted' WHERE id = ?`, [score, attempt_id]);

            res.json({ success: true, score });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    return router;
};
