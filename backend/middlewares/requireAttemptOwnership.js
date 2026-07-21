const requireAttemptOwnership = (dbPromise) => {
    return async (req, res, next) => {
        try {
            const attemptId = req.params.attemptId || req.body.attemptId || req.body.attempt_id;
            
            if (!attemptId) {
                return res.status(400).json({ success: false, message: 'Thiếu attemptId' });
            }

            const ma_sinh_vien = req.user.id || req.user.MSSV || req.user.mssv || req.user.username;

            // 1. Kiểm tra trong bảng online_exam_attempts
            const [rows1] = await dbPromise.query(
                `SELECT ma_sinh_vien FROM online_exam_attempts WHERE id = ?`,
                [attemptId]
            );

            if (rows1.length > 0) {
                if (String(rows1[0].ma_sinh_vien) !== String(ma_sinh_vien)) {
                    return res.status(403).json({ success: false, message: 'Forbidden' });
                }
                req.attemptId = attemptId;
                return next();
            }

            // 2. Kiểm tra trong bảng exam_attempts
            const [rows2] = await dbPromise.query(
                `SELECT mssv FROM exam_attempts WHERE id = ?`,
                [attemptId]
            );

            if (rows2.length > 0) {
                if (String(rows2[0].mssv) !== String(ma_sinh_vien)) {
                    return res.status(403).json({ success: false, message: 'Forbidden' });
                }
                req.attemptId = attemptId;
                return next();
            }

            return res.status(404).json({ success: false, message: 'Không tìm thấy lượt thi' });
        } catch (error) {
            console.error('requireAttemptOwnership Error:', error);
            res.status(500).json({ success: false, message: 'Lỗi server khi kiểm tra quyền' });
        }
    };
};

module.exports = requireAttemptOwnership;
