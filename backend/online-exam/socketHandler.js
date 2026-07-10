const { Server } = require('socket.io');
const { verifyTokenLogic } = require('../middlewares/authenticate');

// Constants
const DISCONNECT_GRACE_PERIOD_MS = 3 * 60 * 1000; // 3 phút
const HEARTBEAT_TIMEOUT_MS = 20 * 1000; // 20 giây

let io;
let dbPromise;

const initSocket = (server, db) => {
    dbPromise = db;
    io = new Server(server, {
        cors: {
            origin: "*", 
            methods: ["GET", "POST"]
        }
    });

    // 🔒 Bảo mật cho Socket.io
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
        if (!token) {
            return next(new Error('Authentication error: Token missing'));
        }
        
        const decoded = verifyTokenLogic(token);
        if (!decoded) {
            return next(new Error('Authentication error: Invalid or expired token'));
        }
        
        socket.user = decoded; // { id, username, role, maQuyen }
        next();
    });

    io.on('connection', (socket) => {
        console.log(`[Socket] User ${socket.user.id} connected (${socket.id})`);

        // Đăng ký attempt ngay khi bắt đầu
        socket.on('register_attempt', (data) => {
            socket.activeAttemptId = data.attemptId;
            socket.examScheduleId = data.exam_schedule_id;
        });

        // ----------------------------------------------------
        // LOGIC MỚI: TÍCH HỢP VỚI BẢNG EXAMS (AI EXAMS CŨ)
        // ----------------------------------------------------

        // Sinh viên bắt đầu làm bài thi (Tự động join và tạo attempt ảo để giám sát)
        socket.on('student_join_exam', async (data) => {
            console.log(`[Socket] Received student_join_exam from ${socket.user.id}:`, data);
            try {
                const { scheduleId, studentId, studentName, attemptId } = data;
                if (!scheduleId || !studentId || !attemptId) {
                    console.log(`[Socket] student_join_exam missing data!`, { scheduleId, studentId, attemptId });
                    return;
                }

                socket.activeAttemptId = attemptId;
                socket.examScheduleId = scheduleId;
                
                const roomName = `exam:${scheduleId}:students`;
                socket.join(roomName);
                console.log(`[Socket] Student ${studentId} joined ${roomName} for Exam ${scheduleId}`);

                // Thông báo cho Giảng viên
                console.log(`[Socket] Emitting student_status_changed to exam:${scheduleId}:monitor for student ${studentId}`);
                io.to(`exam:${scheduleId}:monitor`).emit('student_status_changed', {
                    attemptId: attemptId,
                    status: 'IN_PROGRESS',
                    ma_sinh_vien: studentId
                });
            } catch (err) {
                console.error('[Socket] student_join_exam error:', err);
            }
        });



        // Sinh viên gửi heartbeat liên tục
        socket.on('student_heartbeat', async (data) => {
            const { scheduleId, studentId, status, attemptId } = data;
            if (!attemptId || !scheduleId || !studentId) return;
            try {
                // Not saving to DB to avoid foreign key issues with new table structure,
                // just emit real-time status to teacher
                io.to(`exam:${scheduleId}:monitor`).emit('student_status_changed', {
                    attemptId: attemptId,
                    status: status,
                    ma_sinh_vien: studentId
                });
            } catch (err) {}
        });

        // Sinh viên vi phạm (chuyển tab, v.v.)
        socket.on('student_violation', async (data) => {
            const { scheduleId, studentId, type, description, attemptId } = data;
            if (!attemptId) return;
            try {
                // Lưu vào DB
                await dbPromise.query(
                    `INSERT INTO exam_attempt_violations (attempt_id, violation_type, note) VALUES (?, ?, ?)`,
                    [attemptId, type, description]
                );

                // Gửi thông báo realtime
                io.to(`exam:${scheduleId}:monitor`).emit('student_violation_alert', {
                    attemptId: attemptId,
                    ma_sinh_vien: studentId,
                    type,
                    description,
                    timestamp: new Date()
                });
                console.log(`[Socket] VIOLATION: Student ${studentId} switched tab in Exam ${scheduleId}`);
                
                // If type is AUTO_LOCKED, update status
                if (type === 'TAB_SWITCH' && description.includes('Bắt buộc nộp bài')) {
                    io.to(`exam:${scheduleId}:monitor`).emit('student_status_changed', {
                        attemptId: attemptId,
                        status: 'AUTO_LOCKED',
                        ma_sinh_vien: studentId
                    });
                }
            } catch (err) {
                console.error('[Socket] student_violation error:', err);
            }
        });

        // Giảng viên bắt buộc thu bài
        socket.on('force_submit_student', async (data) => {
            const { examId, studentId } = data;
            // Validate teacher permission later if needed
            io.to(`exam:${examId}:students`).emit('force_submit'); 
            // In reality, we should target only the specific student's socket, but for simplicity we can broadcast or find the socket.
        });

        // Sinh viên nộp bài thành công
        socket.on('student_submit_exam', async (data) => {
            const { scheduleId, studentId, attemptId } = data;
            if (!attemptId) return;
            try {
                // Not saving to DB, emit directly
                io.to(`exam:${scheduleId}:monitor`).emit('student_status_changed', {
                    attemptId: attemptId,
                    status: 'SUBMITTED',
                    ma_sinh_vien: studentId
                });
            } catch (err) {}
        });

        // Sinh viên join room thi
        socket.on('join_exam', async (data, callback) => {
            try {
                const { exam_schedule_id } = data;
                if (!exam_schedule_id) return callback({ success: false, message: 'Thiếu exam_schedule_id' });

                if (socket.user.role === 'student') {
                    // Kiểm tra sinh viên có trong lớp không
                    const [rows] = await dbPromise.query(`
                        SELECT 1 FROM online_exam_schedules e
                        JOIN dangky_hocphan dk ON e.ma_lop_hoc_phan = dk.MaLopHocPhan
                        WHERE e.id = ? AND dk.MSSV = ? AND dk.TrangThai NOT IN ('Da huy', 'Tu choi', 'Đã hủy', 'Từ chối')
                    `, [exam_schedule_id, socket.user.id]);
                    
                    if (rows.length === 0) {
                        return callback({ success: false, message: 'Không có quyền truy cập kỳ thi này' });
                    }
                    
                    const roomName = `exam:${exam_schedule_id}:students`;
                    socket.join(roomName);
                    console.log(`[Socket] Student ${socket.user.id} joined ${roomName}`);
                    return callback({ success: true, room: roomName });
                } 
                else if (socket.user.role === 'teacher' || socket.user.role === 'admin') {
                    // Giảng viên join room giám sát
                    const [rows] = await dbPromise.query(`
                        SELECT ma_giang_vien FROM exams WHERE id = ?
                    `, [exam_schedule_id]);
                    
                    if (rows.length === 0) return callback({ success: false, message: 'Kỳ thi không tồn tại' });
                    
                    if (rows[0].ma_giang_vien !== socket.user.id && socket.user.role !== 'admin') {
                        return callback({ success: false, message: 'Không có quyền giám sát lớp này' });
                    }
                    
                    const roomName = `exam:${exam_schedule_id}:monitor`;
                    socket.join(roomName);
                    console.log(`[Socket] Teacher ${socket.user.id} joined ${roomName}`);
                    return callback({ success: true, room: roomName });
                }
            } catch (err) {
                console.error('[Socket] join_exam error:', err);
                if(callback) callback({ success: false, message: 'Lỗi server' });
            }
        });

        // Heartbeat từ sinh viên
        socket.on('heartbeat', async (data) => {
            const { attemptId } = data;
            if (!attemptId || socket.user.role !== 'student') return;

            try {
                const [attempts] = await dbPromise.query(`
                    SELECT id, status, exam_schedule_id FROM online_exam_attempts WHERE id = ? AND ma_sinh_vien = ?
                `, [attemptId, socket.user.id]);

                if (attempts.length > 0) {
                    const attempt = attempts[0];
                    await dbPromise.query(`
                        UPDATE online_exam_attempts SET last_heartbeat_at = NOW() WHERE id = ?
                    `, [attemptId]);

                    // Nếu đang DISCONNECTED (chưa quá 3 phút), chuyển lại IN_PROGRESS
                    if (attempt.status === 'DISCONNECTED') {
                        await dbPromise.query(`
                            UPDATE online_exam_attempts SET status = 'IN_PROGRESS' WHERE id = ?
                        `, [attemptId]);
                        
                        await dbPromise.query(`
                            INSERT INTO online_exam_connection_events (attempt_id, event_type) VALUES (?, 'RECONNECTED')
                        `, [attemptId]);

                        // Broadcast cho GV
                        io.to(`exam:${attempt.exam_schedule_id}:monitor`).emit('student_status_changed', {
                            attemptId: attemptId,
                            status: 'IN_PROGRESS',
                            ma_sinh_vien: socket.user.id
                        });
                        console.log(`[Socket] Attempt ${attemptId} RECONNECTED`);
                    }
                }
            } catch (err) {
                console.error('[Socket] heartbeat error:', err);
            }
        });

        // Event disconnect tức thời
        socket.on('disconnect', async () => {
            console.log(`[Socket] User ${socket.user.id} disconnected (${socket.id})`);
            if (socket.activeAttemptId && socket.user.role === 'student') {
                try {
                    const [attempts] = await dbPromise.query(`
                        SELECT status FROM online_exam_attempts WHERE id = ? AND ma_sinh_vien = ?
                    `, [socket.activeAttemptId, socket.user.id]);
                    
                    if (attempts.length > 0 && attempts[0].status === 'IN_PROGRESS') {
                        await dbPromise.query(`
                            UPDATE online_exam_attempts SET status = 'DISCONNECTED' WHERE id = ?
                        `, [socket.activeAttemptId]);
                        
                        await dbPromise.query(`
                            INSERT INTO online_exam_connection_events (attempt_id, event_type) VALUES (?, 'DISCONNECTED')
                        `, [socket.activeAttemptId]);

                        // Broadcast tới GV
                        io.to(`exam:${socket.examScheduleId}:monitor`).emit('student_status_changed', {
                            attemptId: socket.activeAttemptId,
                            status: 'DISCONNECTED',
                            ma_sinh_vien: socket.user.id
                        });
                        console.log(`[Socket] Attempt ${socket.activeAttemptId} DISCONNECTED (Immediate)`);
                    }
                } catch (err) {
                    console.error('[Socket] immediate disconnect error:', err);
                }
            }
        });
    });

    // setInterval quét toàn bộ attempt IN_PROGRESS và DISCONNECTED
    setInterval(async () => {
        try {
            // 1. Quét IN_PROGRESS mất heartbeat > 20s
            const [staleInProgress] = await dbPromise.query(`
                SELECT id, exam_schedule_id, ma_sinh_vien FROM online_exam_attempts 
                WHERE status = 'IN_PROGRESS' 
                AND last_heartbeat_at < DATE_SUB(NOW(), INTERVAL ? SECOND)
            `, [HEARTBEAT_TIMEOUT_MS / 1000]);

            for (const attempt of staleInProgress) {
                await dbPromise.query(`UPDATE online_exam_attempts SET status = 'DISCONNECTED' WHERE id = ?`, [attempt.id]);
                await dbPromise.query(`INSERT INTO online_exam_connection_events (attempt_id, event_type) VALUES (?, 'DISCONNECTED')`, [attempt.id]);
                
                io.to(`exam:${attempt.exam_schedule_id}:monitor`).emit('student_status_changed', {
                    attemptId: attempt.id,
                    status: 'DISCONNECTED',
                    ma_sinh_vien: attempt.ma_sinh_vien
                });
                console.log(`[Socket] Attempt ${attempt.id} DISCONNECTED (Timeout)`);
            }

            // 2. Quét DISCONNECTED quá 3 phút -> AUTO_LOCKED
            const [staleDisconnected] = await dbPromise.query(`
                SELECT id, exam_schedule_id, ma_sinh_vien FROM online_exam_attempts 
                WHERE status = 'DISCONNECTED' 
                AND last_heartbeat_at < DATE_SUB(NOW(), INTERVAL ? SECOND)
            `, [DISCONNECT_GRACE_PERIOD_MS / 1000]);

            for (const attempt of staleDisconnected) {
                await dbPromise.query(`UPDATE online_exam_attempts SET status = 'AUTO_LOCKED' WHERE id = ?`, [attempt.id]);
                await dbPromise.query(`INSERT INTO online_exam_connection_events (attempt_id, event_type) VALUES (?, 'AUTO_LOCKED_TIMEOUT')`, [attempt.id]);
                
                io.to(`exam:${attempt.exam_schedule_id}:monitor`).emit('student_status_changed', {
                    attemptId: attempt.id,
                    status: 'AUTO_LOCKED',
                    ma_sinh_vien: attempt.ma_sinh_vien
                });
                console.log(`[Socket] Attempt ${attempt.id} AUTO_LOCKED`);
            }
        } catch (err) {
            console.error('[Socket] Interval sweep error:', err);
        }
    }, 5000);
};

const getIO = () => {
    if (!io) throw new Error("Socket.io is not initialized!");
    return io;
};

module.exports = { initSocket, getIO };
