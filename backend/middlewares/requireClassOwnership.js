const requireClassOwnership = (dbPromise) => {
    return async (req, res, next) => {
        try {
            // Thường exam_schedule_id được truyền qua params hoặc body
            const examId = req.params.exam_schedule_id || req.body.exam_schedule_id || req.params.id;
            
            if (!examId) {
                return res.status(400).json({ success: false, message: 'Thiếu exam_schedule_id hoặc id kỳ thi' });
            }

            const ma_giang_vien = req.user.id;

            // Truy vấn exam_schedules để check quyền sở hữu
            const [rows] = await dbPromise.query(
                `SELECT ma_giang_vien FROM exam_schedules WHERE id = ?`, 
                [examId]
            );

            if (rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy kỳ thi' });
            }

            if (rows[0].ma_giang_vien !== ma_giang_vien) {
                return res.status(403).json({ success: false, message: 'Forbidden: Không có quyền truy cập kỳ thi của lớp này' });
            }

            next();
        } catch (error) {
            console.error('requireClassOwnership Error:', error);
            res.status(500).json({ success: false, message: 'Lỗi server khi kiểm tra quyền' });
        }
    };
};

module.exports = requireClassOwnership;
