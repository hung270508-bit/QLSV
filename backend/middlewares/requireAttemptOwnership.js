const requireAttemptOwnership = (dbPromise) => {
    return async (req, res, next) => {
        try {
            const attemptId = req.params.attemptId || req.body.attemptId || req.body.attempt_id;
            
            if (!attemptId) {
                return res.status(400).json({ success: false, message: 'Thiếu attemptId' });
            }

            const ma_sinh_vien = req.user.id;

            const [rows] = await dbPromise.query(
                `SELECT ma_sinh_vien FROM online_exam_attempts WHERE id = ?`,
                [attemptId]
            );

            if (rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy lượt thi' });
            }

            if (rows[0].ma_sinh_vien !== ma_sinh_vien) {
                // Trả về chung chung để không tiết lộ thông tin của attempt khác
                return res.status(403).json({ success: false, message: 'Forbidden' });
            }

            req.attemptId = attemptId;
            next();
        } catch (error) {
            console.error('requireAttemptOwnership Error:', error);
            res.status(500).json({ success: false, message: 'Lỗi server khi kiểm tra quyền' });
        }
    };
};

module.exports = requireAttemptOwnership;
