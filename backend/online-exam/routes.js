const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authenticate');
const requireRole = require('../middlewares/requireRole');
const requireAttemptOwnershipFactory = require('../middlewares/requireAttemptOwnership');
const ExamController = require('./controllers/examController');

module.exports = (dbPromise) => {
    const examController = new ExamController(dbPromise);
    const requireAttemptOwnership = requireAttemptOwnershipFactory(dbPromise);

    // API đồng bộ giờ server (Không yêu cầu DB, nhưng cần check token để tránh spam)
    router.get('/server-time', authenticate, (req, res) => {
        res.json({ success: true, serverTime: new Date().toISOString() });
    });

    // ================== API GIẢNG VIÊN ==================
    const teacherAuth = [authenticate, requireRole('teacher', 'admin')];

    router.post('/schedules', teacherAuth, examController.createSchedule);
    router.get('/schedules', teacherAuth, examController.getTeacherSchedules);
    router.get('/schedules/:id', teacherAuth, examController.getScheduleDetail);
    router.get('/student/attempt/:attemptId/violations', teacherAuth, examController.getAttemptViolations);

    // ================== API SINH VIÊN ==================
    const studentAuth = [authenticate, requireRole('student')];

    router.get('/student/schedules', studentAuth, examController.getStudentSchedules);
    router.post('/student/start', studentAuth, examController.startAttempt);

    // Bất kỳ thao tác nào lên lượt thi (attempt) cụ thể đều cần requireAttemptOwnership
    const attemptAuth = [authenticate, requireRole('student'), requireAttemptOwnership];

    router.get('/student/attempt/:attemptId', attemptAuth, examController.getAttemptDetail);
    router.post('/student/attempt/:attemptId/answer', attemptAuth, examController.saveAnswer);
    router.post('/student/attempt/:attemptId/violation', attemptAuth, examController.recordViolation);
    router.post('/student/attempt/:attemptId/submit', attemptAuth, examController.submitAttempt);

    return router;
};
