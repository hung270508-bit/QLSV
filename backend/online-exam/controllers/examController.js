const ExamService = require('../services/examService');

class ExamController {
    constructor(dbPromise) {
        this.examService = new ExamService(dbPromise);
    }

    // ================== API GIẢNG VIÊN ==================
    createSchedule = async (req, res) => {
        try {
            const teacherId = req.user.id;
            const data = req.body;
            
            if (!data.ma_lop_hoc_phan || !data.thoi_gian_mo || !data.thoi_gian_dong || !data.so_cau_hoi || !data.thoi_luong_phut) {
                return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
            }
            const scheduleId = await this.examService.createSchedule(data, teacherId);
            res.json({ success: true, message: 'Tạo cấu hình thi thành công', scheduleId });
        } catch (error) {
            console.error('createSchedule error:', error);
            res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
        }
    };

    getTeacherSchedules = async (req, res) => {
        try {
            const schedules = await this.examService.getTeacherSchedules(req.user.id);
            res.json({ success: true, schedules });
        } catch (error) {
            console.error('getTeacherSchedules error:', error);
            res.status(500).json({ success: false, message: 'Lỗi server' });
        }
    };

    getScheduleDetail = async (req, res) => {
        try {
            const data = await this.examService.getScheduleDetail(req.params.id, req.user.id);
            if (!data) return res.status(404).json({ success: false, message: 'Không tìm thấy kỳ thi hoặc không có quyền truy cập' });
            res.json({ success: true, data });
        } catch (error) {
            console.error('getScheduleDetail error:', error);
            res.status(500).json({ success: false, message: 'Lỗi server' });
        }
    };

    // ================== API SINH VIÊN ==================
    getStudentSchedules = async (req, res) => {
        try {
            const schedules = await this.examService.getStudentSchedules(req.user.id);
            res.json({ success: true, schedules });
        } catch (error) {
            console.error('getStudentSchedules error:', error);
            res.status(500).json({ success: false, message: 'Lỗi server' });
        }
    };

    startAttempt = async (req, res) => {
        try {
            if (!req.body.scheduleId) return res.status(400).json({ success: false, message: 'Thiếu scheduleId' });
            const result = await this.examService.startAttempt(req.body.scheduleId, req.user.id);
            res.json({ success: true, message: 'Bắt đầu bài thi thành công', data: result });
        } catch (error) {
            console.error('startAttempt error:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    };

    getAttemptDetail = async (req, res) => {
        try {
            const data = await this.examService.getAttemptDetail(req.attemptId, req.user.id);
            res.json({ success: true, data });
        } catch (error) {
            console.error('getAttemptDetail error:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    };

    saveAnswer = async (req, res) => {
        try {
            const { questionId, selectedOptionId } = req.body;
            if (!questionId) return res.status(400).json({ success: false, message: 'Thiếu questionId' });
            await this.examService.saveAnswer(req.attemptId, questionId, selectedOptionId);
            res.json({ success: true, message: 'Đã lưu đáp án' });
        } catch (error) {
            console.error('saveAnswer error:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    };

    recordViolation = async (req, res) => {
        try {
            const { violationType, note } = req.body;
            if (!violationType) return res.status(400).json({ success: false, message: 'Thiếu violationType' });
            await this.examService.recordViolation(req.attemptId, violationType, note);
            res.json({ success: true, message: 'Đã ghi nhận vi phạm' });
        } catch (error) {
            console.error('recordViolation error:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    };

    submitAttempt = async (req, res) => {
        try {
            await this.examService.submitAttempt(req.attemptId);
            res.json({ success: true, message: 'Nộp bài thành công' });
        } catch (error) {
            console.error('submitAttempt error:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    };

    getAttemptViolations = async (req, res) => {
        try {
            // Chỉ GV hoặc Admin mới được xem
            const { attemptId } = req.params;
            const [rows] = await this.examService.db.query(
                `SELECT * FROM exam_attempt_violations WHERE attempt_id = ? ORDER BY occurred_at DESC`,
                [attemptId]
            );
            res.json({ success: true, violations: rows });
        } catch (error) {
            console.error('getAttemptViolations error:', error);
            res.status(500).json({ success: false, message: 'Lỗi server' });
        }
    };
}
module.exports = ExamController;
