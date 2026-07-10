const rateLimit = require('express-rate-limit');

const answerRateLimiter = rateLimit({
    windowMs: 1000, // 1 giây
    max: 2, // Tối đa 2 request/giây
    message: { success: false, message: 'Thao tác quá nhanh, vui lòng thử lại sau.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const violationRateLimiter = rateLimit({
    windowMs: 1000, 
    max: 1, // Tối đa 1 vi phạm / giây (nếu có nhiều hơn sẽ bị drop/block)
    message: { success: false, message: 'Quá nhiều request.' },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    answerRateLimiter,
    violationRateLimiter
};
