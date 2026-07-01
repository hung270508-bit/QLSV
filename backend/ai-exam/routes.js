const express = require('express');
const multer = require('multer');
const { extractTextFromDocx, generateQuestionsFromText } = require('./aiService');

const router = express.Router();
const upload = multer({ dest: require('os').tmpdir() });

module.exports = (db) => {
    const dbPromise = db.promise();

    // Helper execute function for async pool queries
    const execute = async (query, params) => {
        const [rows] = await dbPromise.query(query, params);
        return rows;
    };

    // 1. Upload & Tạo Bank
    router.post('/banks/upload', upload.single('file'), async (req, res) => {
        let connection;
        try {
            const { ma_mon_hoc, ma_giang_vien, tieu_de } = req.body;
            const file = req.file;

            if (!file || !ma_mon_hoc || !ma_giang_vien || !tieu_de) {
                return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc!' });
            }

            const text = await extractTextFromDocx(file.path);
            const apiKey = process.env.OPENAI_API_KEY;
            
            if (!apiKey) {
                return res.status(500).json({ success: false, message: 'Chưa cấu hình OPENAI_API_KEY ở backend.' });
            }

            const questions = await generateQuestionsFromText(text, apiKey);

            connection = await dbPromise.getConnection();
            await connection.beginTransaction();

            const [bankResult] = await connection.query(
                `INSERT INTO question_banks (ma_mon_hoc, ma_giang_vien, tieu_de, file_url, tong_so_cau, trang_thai) VALUES (?, ?, ?, ?, ?, 'Draft')`,
                [ma_mon_hoc, ma_giang_vien, tieu_de, file.path, questions.length]
            );
            const bankId = bankResult.insertId;

            for (const q of questions) {
                const [qResult] = await connection.query(
                    `INSERT INTO questions (bank_id, chu_de, noi_dung, giai_thich, do_kho, ai_generated, trang_thai) VALUES (?, ?, ?, ?, ?, 1, 'Draft')`,
                    [bankId, q.topic || 'Chung', q.question, q.explanation, q.difficulty || 'Medium']
                );
                const questionId = qResult.insertId;

                for (const opt of q.options) {
                    await connection.query(
                        `INSERT INTO question_options (question_id, noi_dung, la_dap_an_dung) VALUES (?, ?, ?)`,
                        [questionId, opt.text, opt.is_correct ? 1 : 0]
                    );
                }
            }

            await connection.commit();
            res.json({ success: true, message: 'Tạo ngân hàng câu hỏi bằng AI thành công!', bankId });
        } catch (error) {
            if (connection) await connection.rollback();
            console.error('Error generating AI bank:', error);
            res.status(500).json({ success: false, message: error.message });
        } finally {
            if (connection) connection.release();
        }
    });

    // 2. Lấy danh sách Question Banks của Giảng viên
    router.get('/banks/teacher/:ma_giang_vien', async (req, res) => {
        try {
            const rows = await execute(`SELECT b.*, m.TenMonHoc FROM question_banks b JOIN monhoc m ON b.ma_mon_hoc = m.MaMonHoc WHERE b.ma_giang_vien = ? ORDER BY b.created_at DESC`, [req.params.ma_giang_vien]);
            res.json(rows);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 3. Lấy chi tiết câu hỏi trong Bank
    router.get('/banks/:id/questions', async (req, res) => {
        try {
            const questions = await execute(`SELECT * FROM questions WHERE bank_id = ?`, [req.params.id]);
            for (const q of questions) {
                const options = await execute(`SELECT * FROM question_options WHERE question_id = ?`, [q.id]);
                q.options = options;
            }
            res.json({ success: true, data: questions });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 4. Cập nhật trạng thái duyệt (Approve Bank)
    router.put('/banks/:id/approve', async (req, res) => {
        let connection;
        try {
            connection = await dbPromise.getConnection();
            await connection.beginTransaction();

            await connection.query(`UPDATE question_banks SET trang_thai = 'Approved' WHERE id = ?`, [req.params.id]);
            await connection.query(`UPDATE questions SET trang_thai = 'Approved' WHERE bank_id = ?`, [req.params.id]);

            await connection.commit();
            res.json({ success: true, message: 'Đã duyệt ngân hàng câu hỏi!' });
        } catch (error) {
            if (connection) await connection.rollback();
            res.status(500).json({ success: false, message: error.message });
        } finally {
            if (connection) connection.release();
        }
    });

    // 5. Luyện tập (Sinh viên)
    router.post('/practice/start', async (req, res) => {
        try {
            const { mssv, ma_mon_hoc, so_cau, do_kho } = req.body;
            let diffFilter = "";
            let params = [ma_mon_hoc];
            if (do_kho && do_kho !== 'Mix') {
                diffFilter = "AND q.do_kho = ?";
                params.push(do_kho);
            }
            
            const query = `
                SELECT q.id, q.noi_dung, q.giai_thich, q.do_kho, q.chu_de 
                FROM questions q 
                JOIN question_banks b ON q.bank_id = b.id 
                WHERE b.ma_mon_hoc = ? AND b.trang_thai = 'Approved' AND q.trang_thai = 'Approved' ${diffFilter}
                ORDER BY RAND() 
                LIMIT ?
            `;
            params.push(Number(so_cau) || 10);
            
            const questions = await execute(query, params);
            
            for (const q of questions) {
                const options = await execute(`SELECT id, noi_dung, la_dap_an_dung FROM question_options WHERE question_id = ? ORDER BY RAND()`, [q.id]);
                // Trả về cả cờ la_dap_an_dung để client tự hiện luôn giải thích (vì đây là luyện tập). Đối với thi thật thì ẩn.
                q.options = options.map(o => ({ id: o.id, text: o.noi_dung, is_correct: o.la_dap_an_dung === 1 }));
            }
            
            const [attRes] = await dbPromise.query(`INSERT INTO practice_attempts (mssv, ma_mon_hoc, tong_so_cau) VALUES (?, ?, ?)`, [mssv, ma_mon_hoc, questions.length]);
            
            res.json({ success: true, attempt_id: attRes.insertId, questions });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 6. Nộp bài Luyện tập
    router.post('/practice/submit', async (req, res) => {
        try {
            const { attempt_id, answers } = req.body; // answers: [{ question_id, selected_option_id }]
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
                    `INSERT INTO practice_answers (attempt_id, question_id, selected_option_id, la_dap_an_dung) VALUES (?, ?, ?, ?)`,
                    [attempt_id, ans.question_id, ans.selected_option_id || null, isCorrect ? 1 : 0]
                );
            }
            
            const score = answers.length > 0 ? (correctCount / answers.length) * 10 : 0;
            await dbPromise.query(`UPDATE practice_attempts SET diem_so = ?, thoi_gian_nop_bai = CURRENT_TIMESTAMP WHERE id = ?`, [score, attempt_id]);
            
            res.json({ success: true, score, correctCount, total: answers.length });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

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

    // 8. Lấy danh sách kỳ thi của Sinh viên
    router.get('/exams/student/:mssv', async (req, res) => {
        try {
            const query = `
                SELECT e.*, m.TenMonHoc 
                FROM exams e 
                JOIN monhoc m ON e.ma_mon_hoc = m.MaMonHoc
                JOIN dangkyhocphan dk ON e.ma_lop_hoc_phan = dk.MaLopHocPhan
                WHERE dk.MSSV = ? AND e.trang_thai != 'Completed'
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

            if (!exam.cho_phep_thi_lai) {
                const [prevAttempts] = await connection.query(`SELECT id FROM exam_attempts WHERE exam_id = ? AND mssv = ? AND trang_thai = 'Submitted'`, [examId, mssv]);
                if (prevAttempts.length > 0) return res.status(400).json({ success: false, message: 'Bạn đã nộp bài và không được phép thi lại.' });
            }

            const [attRes] = await connection.query(`INSERT INTO exam_attempts (exam_id, mssv) VALUES (?, ?)`, [examId, mssv]);
            const attemptId = attRes.insertId;

            const generateQs = async (diff, limit) => {
                const [qs] = await connection.query(`
                    SELECT q.id, q.noi_dung 
                    FROM questions q 
                    JOIN question_banks b ON q.bank_id = b.id 
                    WHERE b.ma_mon_hoc = ? AND q.do_kho = ? AND b.trang_thai = 'Approved' AND q.trang_thai = 'Approved'
                    ORDER BY RAND() LIMIT ?
                `, [exam.ma_mon_hoc, diff, limit]);
                return qs;
            };

            let questions = [];
            if (exam.so_cau_de > 0) questions.push(...await generateQs('Easy', exam.so_cau_de));
            if (exam.so_cau_tb > 0) questions.push(...await generateQs('Medium', exam.so_cau_tb));
            if (exam.so_cau_kho > 0) questions.push(...await generateQs('Hard', exam.so_cau_kho));

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
