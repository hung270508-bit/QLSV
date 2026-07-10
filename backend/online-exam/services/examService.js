const shuffleArray = (array) => {
    let newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

class ExamService {
    constructor(db) {
        this.db = db;
    }

    async createSchedule(data, teacherId) {
        const { ma_lop_hoc_phan, thoi_gian_mo, thoi_gian_dong, so_cau_hoi, thoi_luong_phut } = data;
        const [result] = await this.db.query(`
            INSERT INTO online_exam_schedules 
            (ma_lop_hoc_phan, ma_giang_vien, thoi_gian_mo, thoi_gian_dong, so_cau_hoi, thoi_luong_phut, trang_thai) 
            VALUES (?, ?, ?, ?, ?, ?, 'SCHEDULED')
        `, [ma_lop_hoc_phan, teacherId, thoi_gian_mo, thoi_gian_dong, so_cau_hoi, thoi_luong_phut]);
        return result.insertId;
    }

    async getTeacherSchedules(teacherId) {
        const [rows] = await this.db.query(`
            SELECT * FROM online_exam_schedules WHERE ma_giang_vien = ? ORDER BY created_at DESC
        `, [teacherId]);
        return rows;
    }

    async getScheduleDetail(scheduleId, teacherId) {
        const [schedules] = await this.db.query(`
            SELECT 
                id, ma_giang_vien, ma_mon_hoc, ma_lop_hoc_phan, tieu_de, 
                thoi_gian_bat_dau AS thoi_gian_mo, 
                thoi_gian_ket_thuc AS thoi_gian_dong, 
                tong_so_cau AS so_cau_hoi, 
                thoi_gian_thi_phut AS thoi_luong_phut 
            FROM exams WHERE id = ? AND ma_giang_vien = ?
        `, [scheduleId, teacherId]);
        if (schedules.length === 0) return null;
        const schedule = schedules[0];
        
        const [students] = await this.db.query(`
            SELECT 
                dk.MSSV, sv.HoTen, sv.Email, 
                MAX(a.id) as attemptId, 
                MAX(a.trang_thai) as db_status,
                (SELECT COUNT(*) FROM exam_attempt_violations v WHERE v.attempt_id = MAX(a.id)) as violationCount
            FROM dangky_hocphan dk
            JOIN sinhvien sv ON dk.MSSV = sv.MSSV
            LEFT JOIN exam_attempts a ON sv.MSSV = a.mssv AND a.exam_id = ?
            WHERE dk.MaLopHocPhan = ? AND dk.TrangThai NOT IN ('Da huy', 'Tu choi', 'Đã hủy', 'Từ chối')
            GROUP BY dk.MSSV, sv.HoTen, sv.Email
        `, [scheduleId, schedule.ma_lop_hoc_phan]);
        
        return { schedule, students };
    }

    async getStudentSchedules(studentId) {
        const [rows] = await this.db.query(`
            SELECT e.* 
            FROM online_exam_schedules e
            JOIN dangky_hocphan dk ON e.ma_lop_hoc_phan = dk.MaLopHocPhan
            WHERE dk.MSSV = ? AND dk.TrangThai NOT IN ('Da huy', 'Tu choi', 'Đã hủy', 'Từ chối')
            ORDER BY e.thoi_gian_mo DESC
        `, [studentId]);
        return rows;
    }

    async startAttempt(scheduleId, studentId) {
        // 1. Kiểm tra lịch thi
        const [schedules] = await this.db.query(`SELECT * FROM online_exam_schedules WHERE id = ?`, [scheduleId]);
        if (schedules.length === 0) throw new Error('Kỳ thi không tồn tại');
        
        const schedule = schedules[0];
        const now = new Date();
        if (now < new Date(schedule.thoi_gian_mo)) throw new Error('Kỳ thi chưa mở');
        if (now > new Date(schedule.thoi_gian_dong)) throw new Error('Kỳ thi đã đóng');

        // 2. Check xem sinh viên có trong lớp không
        const [enrollments] = await this.db.query(`
            SELECT 1 FROM dangky_hocphan 
            WHERE MaLopHocPhan = ? AND MSSV = ? AND TrangThai NOT IN ('Da huy', 'Tu choi', 'Đã hủy', 'Từ chối')
        `, [schedule.ma_lop_hoc_phan, studentId]);
        if (enrollments.length === 0) throw new Error('Không có quyền truy cập kỳ thi này');

        // 3. Kiểm tra xem đã start chưa
        const [existing] = await this.db.query(`
            SELECT * FROM online_exam_attempts WHERE exam_schedule_id = ? AND ma_sinh_vien = ?
        `, [scheduleId, studentId]);
        
        if (existing.length > 0) {
            if (['SUBMITTED', 'AUTO_LOCKED'].includes(existing[0].status)) {
                throw new Error('Bạn đã nộp bài hoặc bài thi đã bị khóa.');
            }
            return existing[0];
        }

        // 4. Lấy ngẫu nhiên câu hỏi từ ngân hàng
        const [questions] = await this.db.query(`
            SELECT q.id FROM questions q
            JOIN question_banks qb ON q.bank_id = qb.id
            JOIN lophocphan lhp ON lhp.MaMonHoc = qb.ma_mon_hoc
            WHERE lhp.MaLopHocPhan = ? AND qb.trang_thai = 'Approved' AND q.trang_thai = 'Approved'
            ORDER BY RAND() LIMIT ?
        `, [schedule.ma_lop_hoc_phan, schedule.so_cau_hoi]);

        if (questions.length < schedule.so_cau_hoi) {
            throw new Error(`Ngân hàng câu hỏi không đủ (có ${questions.length}/${schedule.so_cau_hoi} câu). Vui lòng báo Giảng viên.`);
        }

        const questionIds = questions.map(q => q.id);
        const questionOrder = shuffleArray(questionIds);
        
        // 5. Lấy options và xáo trộn
        const optionOrderMap = {};
        if (questionIds.length > 0) {
            const [options] = await this.db.query(`
                SELECT id, question_id FROM question_options WHERE question_id IN (?)
            `, [questionIds]);
            
            const optionsByQ = {};
            options.forEach(opt => {
                if (!optionsByQ[opt.question_id]) optionsByQ[opt.question_id] = [];
                optionsByQ[opt.question_id].push(opt.id);
            });
            
            questionIds.forEach(qid => {
                optionOrderMap[qid] = optionsByQ[qid] ? shuffleArray(optionsByQ[qid]) : [];
            });
        }

        // 6. Tính deadline
        const deadlineAt = new Date(now.getTime() + schedule.thoi_luong_phut * 60000);
        const finalDeadline = deadlineAt > new Date(schedule.thoi_gian_dong) ? new Date(schedule.thoi_gian_dong) : deadlineAt;

        // 7. Insert attempt
        const [insertRes] = await this.db.query(`
            INSERT INTO online_exam_attempts 
            (exam_schedule_id, ma_sinh_vien, question_order, option_order_map, status, started_at, deadline_at, last_heartbeat_at)
            VALUES (?, ?, ?, ?, 'IN_PROGRESS', NOW(), ?, NOW())
        `, [
            scheduleId, 
            studentId, 
            JSON.stringify(questionOrder), 
            JSON.stringify(optionOrderMap),
            finalDeadline
        ]);

        return {
            id: insertRes.insertId,
            exam_schedule_id: scheduleId,
            status: 'IN_PROGRESS',
            deadline_at: finalDeadline
        };
    }

    async getAttemptDetail(attemptId, studentId) {
        const [attempts] = await this.db.query(`
            SELECT * FROM online_exam_attempts WHERE id = ? AND ma_sinh_vien = ?
        `, [attemptId, studentId]);
        if (attempts.length === 0) throw new Error('Attempt không tồn tại');
        const attempt = attempts[0];
        
        const questionOrder = typeof attempt.question_order === 'string' ? JSON.parse(attempt.question_order) : attempt.question_order;
        const optionOrderMap = typeof attempt.option_order_map === 'string' ? JSON.parse(attempt.option_order_map) : attempt.option_order_map;
        
        if (questionOrder.length === 0) return { attempt, questions: [] };

        const [questions] = await this.db.query(`
            SELECT id, noi_dung FROM questions WHERE id IN (?)
        `, [questionOrder]);
        
        const [options] = await this.db.query(`
            SELECT id, question_id, noi_dung FROM question_options WHERE question_id IN (?)
        `, [questionOrder]);
        
        const formattedQuestions = questionOrder.map(qid => {
            const q = questions.find(x => x.id === qid);
            const orderedOptionIds = optionOrderMap[qid] || [];
            const qOptions = orderedOptionIds.map(optId => options.find(o => o.id === optId)).filter(Boolean);
            
            return {
                id: q?.id,
                noi_dung: q?.noi_dung,
                options: qOptions.map(opt => ({ id: opt.id, noi_dung: opt.noi_dung }))
            };
        });
        
        return { attempt, questions: formattedQuestions };
    }

    async saveAnswer(attemptId, questionId, selectedOptionId) {
        const [result] = await this.db.query(`
            INSERT INTO online_exam_answers (attempt_id, question_id, selected_option_id)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE selected_option_id = VALUES(selected_option_id)
        `, [attemptId, questionId, selectedOptionId]);
        return result;
    }

    async recordViolation(attemptId, violationType, note) {
        const [result] = await this.db.query(`
            INSERT INTO online_exam_violation_events (attempt_id, violation_type, note)
            VALUES (?, ?, ?)
        `, [attemptId, violationType, note]);
        return result;
    }

    async submitAttempt(attemptId) {
        const [result] = await this.db.query(`
            UPDATE online_exam_attempts 
            SET status = 'SUBMITTED', submitted_at = NOW() 
            WHERE id = ? AND status IN ('IN_PROGRESS', 'DISCONNECTED')
        `, [attemptId]);
        return result;
    }
}
module.exports = ExamService;
