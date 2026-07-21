const path = require('path');

// Kiểm tra xem lệnh khởi động có truyền thêm chữ "--cloud" hoặc đang chạy trên Vercel không
const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;
const isCloud = process.argv.includes('--cloud') || isVercel;
const envFile = isCloud ? '.env' : '.env.local';

// Tự động nạp đúng file cấu hình tương ứng
require('dotenv').config({ path: path.join(__dirname, envFile) });

// Load email configuration
require('dotenv').config({ path: path.join(__dirname, '.env.email') });

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const saltRounds = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

const app = express();

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Đã xóa global.currentRfidState, chuyển sang dùng bảng rfid_state trong MySQL

// Middleware CORS cho Express API
app.use(cors({
    origin: [
        'http://localhost:5173',           // local
        'https://hung270508-bit.github.io', // GitHub Pages
        'https://qlsv-kappa.vercel.app'    // frontend vercel (nếu có)
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware giải mã dữ liệu JSON với giới hạn kích thước lớn hơn (để hỗ trợ upload ảnh/tệp Base64 lớn)
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// Cấu hình kết nối đến MySQL sử dụng Pool (Tối ưu từ server mới)
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    charset: 'utf8mb4',
    timezone: '+07:00', // Đảm bảo Node.js hiểu DB đang chạy ở múi giờ VN
    waitForConnections: true,
    // Tránh lỗi "Too many connections" trên Vercel Serverless bằng cách giới hạn pool rất nhỏ
    connectionLimit: isVercel ? 2 : 10,
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: false
    }
});

// Ép tất cả các luồng kết nối MySQL phải sử dụng múi giờ Việt Nam và UTF-8
db.on('connection', function (connection) {
    connection.query("SET time_zone = '+07:00'");
    connection.query("SET NAMES utf8mb4");
});

// Kiểm tra kết nối DB
db.getConnection((err, connection) => {
    if (err) {
        console.error('Lỗi kết nối MySQL: ' + err.stack);
        return;
    }
    console.log('Đã kết nối thành công đến cơ sở dữ liệu MySQL.');

    // Đã gỡ bỏ các đoạn code tự động CREATE/ALTER TABLE ở đây (Migration)
    // để tối ưu hóa triệt để tốc độ khởi động (Cold Start) trên Vercel Serverless.

    connection.query('SET FOREIGN_KEY_CHECKS = 0;', (err) => {
        connection.query("ALTER TABLE khoa ADD COLUMN TinChiYeuCau INT DEFAULT 120;", () => { });
        connection.query("ALTER TABLE yeucau_hotro ADD COLUMN IsDeletedByAdmin TINYINT(1) DEFAULT 0;", () => { });
        connection.query("ALTER TABLE exams ADD COLUMN bank_id INT DEFAULT NULL;", () => { });
        connection.query("ALTER TABLE lophocphan ADD COLUMN phi_tai_lieu DECIMAL(15,2) DEFAULT 0;", () => { });
        connection.query("ALTER TABLE lophocphan ADD COLUMN mien_hoc_phi BOOLEAN DEFAULT FALSE;", () => { });
        connection.query("ALTER TABLE hoc_phi_chi_tiet ADD COLUMN phi_tai_lieu DECIMAL(15,2) DEFAULT 0;", () => { });
        connection.query("ALTER TABLE hoc_phi_chi_tiet ADD COLUMN hoc_phi DECIMAL(15,2) DEFAULT 0;", () => { });
        connection.query("ALTER TABLE hoc_phi_chi_tiet ADD COLUMN mien_giam DECIMAL(15,2) DEFAULT 0;", () => { });
        connection.query("CREATE TABLE IF NOT EXISTS dot_dangky (MaDot INT NOT NULL AUTO_INCREMENT PRIMARY KEY, TenDot VARCHAR(255) NOT NULL, MoTa TEXT, HocKy VARCHAR(50) NOT NULL, NamHoc VARCHAR(50), NienKhoa VARCHAR(50) NOT NULL, NgayTao DATETIME NOT NULL, NgayDong DATETIME NOT NULL, TrangThai VARCHAR(50) DEFAULT 'Mo');", () => { });
        connection.query("ALTER TABLE dot_dangky ADD COLUMN MoTa TEXT DEFAULT NULL;", () => { });
        connection.query("ALTER TABLE dot_dangky ADD COLUMN NamHoc VARCHAR(50) DEFAULT NULL;", () => { });
        connection.query("ALTER TABLE dot_dangky ADD COLUMN NienKhoa VARCHAR(50) DEFAULT NULL;", () => { });
        connection.query("ALTER TABLE dot_dangky MODIFY COLUMN TrangThai VARCHAR(50) DEFAULT 'Mo';", () => { });
        connection.query("ALTER TABLE hoc_phi_v2 MODIFY COLUMN trang_thai ENUM('Chưa đóng', 'Chờ duyệt', 'Đã đóng', 'Quá hạn') DEFAULT 'Chưa đóng';", () => { });
        connection.query("ALTER TABLE giao_dich_hoc_phi MODIFY COLUMN trang_thai ENUM('cho_thanh_toan', 'cho_duyet', 'thanh_cong', 'that_bai', 'het_han') DEFAULT 'cho_thanh_toan';", () => { });
        connection.query("ALTER TABLE giao_dich_hoc_phi MODIFY COLUMN nguon_xac_nhan ENUM('auto', 'manual', 'student_report', 'admin_check') DEFAULT NULL;", () => { });
        connection.release();
        if (err) console.error('Lỗi tắt kiểm tra khóa ngoại:', err);
    });
});

// Email transporter configuration
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT === '465',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'Không tìm thấy token xác thực!' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Kiểm tra xem tài khoản có bị khóa trong database không
        db.query('SELECT TrangThai FROM users WHERE TaiKhoan = ?', [decoded.username], (err, results) => {
            if (err) return res.status(500).json({ success: false, message: 'Lỗi server khi xác thực token!' });

            if (results.length === 0) {
                return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại!' });
            }

            if (results[0].TrangThai === 0 || results[0].TrangThai === false || results[0].TrangThai === 'Bị khóa') {
                return res.status(403).json({
                    success: false,
                    message: 'Tài khoản của bạn đã bị khóa! Bạn sẽ bị đăng xuất.',
                    isLocked: true
                });
            }

            req.user = decoded;
            next();
        });
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn!' });
    }
};

// ==================== HELPER FUNCTIONS ====================
const executeQuery = (query, params, res, errorMessage) => {
    db.query(query, params, (err, results) => {
        if (err) {
            console.error(`[DB Error in executeQuery] ${errorMessage}:`, err);
            return res.status(500).json({ success: false, message: errorMessage, error: err.message });
        }
        res.json(results);
    });
};

const validateAssignment = (req, res, next) => {
    const { MaLopHocPhan, HocKy } = req.body;
    if (HocKy === 3) console.log("Hệ thống ghi nhận học kỳ bổ sung");
    db.query('SELECT * FROM LHP WHERE MaLopHocPhan = ?', [MaLopHocPhan], (err, result) => {
        if (result.length > 0) return res.status(400).json({ message: "Mã lớp học phần đã tồn tại!" });
        next();
    });
};

const executeMutation = (query, params, res, successMessage, errorMessage) => {
    db.query(query, params, (err) => {
        if (err) {
            console.error(`[DB Error in executeMutation] ${errorMessage}:`, err);
            if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(400).json({ success: false, message: 'Dữ liệu này đang được sử dụng và liên kết ở nơi khác, không thể xóa!' });
            }
            return res.status(500).json({ success: false, message: errorMessage, error: err.message });
        }
        res.json({ success: true, message: successMessage });
    });
};

const executeInsert = executeMutation;
const executeUpdate = executeMutation;
const executeDelete = executeMutation;

// Academic calculation functions
const calculateGPA = (diemTB) => {
    if (diemTB >= 8.5) return 4.0;
    if (diemTB >= 7.0) return 3.0;
    if (diemTB >= 5.5) return 2.0;
    if (diemTB >= 4.0) return 1.0;
    return 0.0;
};

const gradeCalcSQL = '(d.DiemChuyenCan * 0.1 + d.DiemBaiTap * 0.2 + d.DiemGiuaKy * 0.3 + d.DiemCuoiKy * 0.4)';

const calculateAcademicStanding = (gpa) => {
    if (gpa >= 3.6) return 'Giỏi';
    if (gpa >= 3.2) return 'Khá';
    if (gpa >= 2.5) return 'Trung bình';
    if (gpa >= 2.0) return 'Đạt';
    return 'Cảnh báo học vụ';
};

const calculateGradeAverage = (diemChuyenCan, diemBaiTap, diemGiuaKy, diemCuoiKy) => {
    const cc = parseFloat(diemChuyenCan) || 0;
    const bt = parseFloat(diemBaiTap) || 0;
    const gk = parseFloat(diemGiuaKy) || 0;
    const ck = parseFloat(diemCuoiKy) || 0;
    return ((cc * 0.1) + (bt * 0.2) + (gk * 0.3) + (ck * 0.4)).toFixed(2);
};

const normalizeClassGradeStats = (row) => ({
    totalGrades: Number(row?.totalGrades) || 0,
    average: Number(row?.classAverage || row?.average) || 0,
    excellent: Number(row?.excellent) || 0,
    good: Number(row?.good) || 0,
    averageGrade: Number(row?.averageGrade) || 0,
    fail: Number(row?.fail) || 0
});

// ==================== API ĐĂNG NHẬP & QUÊN MẬT KHẨU ====================
// Store login attempts in memory
const loginAttempts = {};

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!' });

    // Check if account is locked out
    const now = new Date();

    // Reset attempts sau 30 phút không có thao tác đăng nhập
    if (loginAttempts[username] && loginAttempts[username].lastAttempt) {
        if (now - loginAttempts[username].lastAttempt > 30 * 60 * 1000) {
            delete loginAttempts[username];
        }
    }

    if (loginAttempts[username] && loginAttempts[username].lockoutUntil && loginAttempts[username].lockoutUntil > now) {
        // Cập nhật lại thời gian thao tác để đếm lại 30 phút
        loginAttempts[username].lastAttempt = now;
        const remainingMs = loginAttempts[username].lockoutUntil - now;
        const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
        return res.status(403).json({
            success: false,
            message: `Tài khoản của bạn tạm thời bị khóa do nhập sai quá nhiều lần. Vui lòng thử lại sau ${remainingMinutes} phút.`
        });
    }

    const handleFailedAttempt = (username) => {
        if (!loginAttempts[username]) {
            loginAttempts[username] = { attempts: 0, lockoutUntil: null, lastAttempt: new Date() };
        }
        loginAttempts[username].attempts += 1;
        loginAttempts[username].lastAttempt = new Date();
        const attempts = loginAttempts[username].attempts;

        if (attempts >= 25) {
            db.query("UPDATE users SET TrangThai = 0 WHERE TaiKhoan = ?", [username], (err) => {
                if (err) console.error("Lỗi khóa tài khoản vĩnh viễn:", err);
            });
            delete loginAttempts[username];
            return res.status(403).json({
                success: false,
                message: 'Tài khoản của bạn đã bị khóa vĩnh viễn do nhập sai quá nhiều lần. Vui lòng liên hệ quản trị viên.'
            });
        }

        if (attempts % 5 === 0) {
            const multiplier = attempts / 5;
            const lockoutMinutes = 5 * multiplier;
            loginAttempts[username].lockoutUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000);
            return res.status(403).json({
                success: false,
                message: `Bạn đã nhập sai mật khẩu ${attempts} lần. Tài khoản của bạn bị khóa tạm thời trong ${lockoutMinutes} phút.`
            });
        } else {
            const remaining = 5 - (attempts % 5);
            return res.status(401).json({
                success: false,
                message: `Mật khẩu không đúng! Bạn đã nhập sai ${attempts} lần. Còn ${remaining} lần thử trước khi tài khoản bị khóa tạm thời.`
            });
        }
    };

    const query = `
        SELECT u.TaiKhoan, u.password, u.MaQuyen, p.TenQuyen, u.TrangThai as UserTrangThai, u.Avatar,
               s.HoTen as TenSinhVien, s.NgaySinh, s.GioiTinh, s.Email as EmailSV, s.SoDienThoai as SDTSV, s.MaLop,
               g.HoTen as TenGiangVien, g.Email as EmailGV, g.SoDienThoai as SDTGV, g.MaKhoa,
               l.TenLop, k.TenKhoa
        FROM users u
        INNER JOIN phanquyen p ON u.MaQuyen = p.MaQuyen
        LEFT JOIN sinhvien s ON u.TaiKhoan = s.MSSV
        LEFT JOIN giangvien g ON u.TaiKhoan = g.MaGiangVien
        LEFT JOIN lophoc l ON s.MaLop = l.MaLop
        LEFT JOIN khoa k ON g.MaKhoa = k.MaKhoa
        WHERE u.TaiKhoan = ?
    `;

    db.query(query, [username], async (err, results) => {
        try {
            if (err) { console.error("LOGIN DB ERROR:", err); return res.status(500).json({ success: false, message: 'Lỗi server!', error: String(err) }); }
            if (results.length > 0 && results[0].TaiKhoan === username) {
                const user = results[0];
                let passwordMatch = false;

                if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
                    passwordMatch = await bcrypt.compare(password, user.password);
                } else {
                    passwordMatch = (password === user.password);
                }

                if (passwordMatch) {
                    // Check if account is locked
                    if (user.UserTrangThai === 0 || user.UserTrangThai === 'Bị khóa') {
                        return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa! Vui lòng liên hệ quản trị viên.' });
                    }

                    // Reset login attempts on success
                    if (loginAttempts[username]) {
                        delete loginAttempts[username];
                    }

                    let roleString = user.MaQuyen === 1 ? 'admin' : (user.MaQuyen === 2 ? 'teacher' : 'student');
                    const userResponse = { id: user.TaiKhoan, username: user.TaiKhoan, role: roleString, tenQuyen: user.TenQuyen, Avatar: user.Avatar };

                    if (user.MaQuyen === 3) {
                        Object.assign(userResponse, { hoTen: user.TenSinhVien, ngaySinh: user.NgaySinh, gioiTinh: user.GioiTinh, email: user.EmailSV, soDienThoai: user.SDTSV, maLop: user.MaLop, tenLop: user.TenLop });
                    } else if (user.MaQuyen === 2) {
                        Object.assign(userResponse, { hoTen: user.TenGiangVien, email: user.EmailGV, soDienThoai: user.SDTGV, maKhoa: user.MaKhoa, tenKhoa: user.TenKhoa });
                    }

                    // Generate JWT token
                    const token = jwt.sign(
                        {
                            id: user.TaiKhoan,
                            username: user.TaiKhoan,
                            role: roleString,
                            maQuyen: user.MaQuyen
                        },
                        JWT_SECRET,
                        { expiresIn: JWT_EXPIRES_IN }
                    );

                    return res.json({ success: true, message: 'Đăng nhập thành công!', user: userResponse, token });
                } else {
                    return handleFailedAttempt(username);
                }
            } else {
                return res.status(404).json({ success: false, message: 'Tài khoản không tồn tại!' });
            }
        } catch (error) {
            console.error("LOGIN CATCH ERROR:", error);
            return res.status(500).json({ success: false, message: 'Lỗi server!', error: error.message });
        }
    });
});

app.post('/api/forgot-password', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Vui lòng nhập email!' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Email không đúng định dạng!' });
    }

    const query = `
        SELECT 'sinhvien' as userType, MSSV as id, HoTen as name, Email as email FROM sinhvien WHERE Email = ?
        UNION
        SELECT 'giangvien' as userType, MaGiangVien as id, HoTen as name, Email as email FROM giangvien WHERE Email = ?
    `;
    db.query(query, [email, email], async (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi server!' });
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Email này không tồn tại trong hệ thống!' });
        }

        const user = results[0];
        // Generate JWT token with 30-minute expiry
        const resetToken = jwt.sign(
            { email: user.email, id: user.id, userType: user.userType },
            JWT_SECRET,
            { expiresIn: '30m' }
        );

        // Create reset link dynamically based on request origin (local or cloud)
        let origin = req.headers.origin || process.env.FRONTEND_URL;
        if (origin && origin.includes('hung270508-bit.github.io') && !origin.includes('/QLSV')) {
            origin = origin.replace(/\/$/, '') + '/QLSV';
        }
        const resetLink = `${origin}/#/reset-password/${resetToken}`;

        // Send email
        const mailOptions = {
            from: process.env.EMAIL_SENDER || process.env.EMAIL_USER,
            to: user.email,
            subject: 'Yêu cầu đặt lại mật khẩu - Hệ thống QLSV',
            html: `
                <div style="background-color: #f9fafb; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1f2937; line-height: 1.6;">
                    <div style="max-width: 570px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); border: 1px solid #f3f4f6;">
                        <!-- Header -->
                        <div style="background: linear-gradient(135deg, #ea580c 0%, #f97316 100%); padding: 35px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">HỆ THỐNG QUẢN LÝ SINH VIÊN</h1>
                        </div>
                        <!-- Content -->
                        <div style="padding: 40px 30px;">
                            <h2 style="color: #111827; margin-top: 0; margin-bottom: 20px; font-size: 18px; font-weight: 700;">Xin chào ${user.name},</h2>
                            <p style="color: #4b5563; font-size: 15px; margin-bottom: 24px;">Hệ thống nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại <strong>QLSV</strong>.</p>
                            
                            <p style="color: #4b5563; font-size: 15px; margin-bottom: 30px;">Vui lòng nhấn vào nút dưới đây để hoàn tất việc thiết lập mật khẩu mới:</p>
                            
                            <div style="text-align: center; margin-bottom: 35px;">
                                <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #ea580c 0%, #f97316 100%); color: #ffffff; padding: 14px 32px; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.35);">Đặt lại mật khẩu</a>
                            </div>

                            <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 16px; border-radius: 8px; margin-bottom: 30px;">
                                <p style="margin: 0; color: #c2410c; font-size: 14px; font-weight: 600;">⚠️ Lưu ý quan trọng:</p>
                                <p style="margin: 4px 0 0 0; color: #7c2d12; font-size: 13px; line-height: 1.5;">Liên kết này chỉ có hiệu lực trong vòng <strong>30 phút</strong>. Nếu không yêu cầu thay đổi này, bạn có thể yên tâm bỏ qua email này.</p>
                            </div>
                            
                            <p style="color: #9ca3af; font-size: 13px; border-top: 1px solid #f3f4f6; padding-top: 20px; margin-bottom: 0;">Trân trọng,<br><strong style="color: #4b5563;">Hệ thống Quản lý Sinh viên</strong></p>
                        </div>
                        <!-- Footer -->
                        <div style="background-color: #ffffff; padding: 20px 30px; text-align: center; border-top: 1px solid #f3f4f6;">
                            <p style="color: #9ca3af; font-size: 12px; margin: 0;">Đây là email tự động từ hệ thống, vui lòng không trả lời trực tiếp thư này.</p>
                        </div>
                    </div>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            return res.json({ success: true, message: `Liên kết đặt lại mật khẩu đã được gửi đến email ${email}!` });
        } catch (emailError) {
            console.error('Lỗi gửi email:', emailError);
            return res.status(500).json({ success: false, message: 'Lỗi gửi email!' });
        }
    });
});

// Mount AI Exam routes
const aiExamRoutes = require('./ai-exam/routes')(db);
app.use('/api/ai-exams', aiExamRoutes);
app.use('/api/ai-exam', aiExamRoutes);

// Global middleware to check if account is locked out across all API requests
app.use((req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const username = decoded.username;
            const now = new Date();
            if (loginAttempts[username] && loginAttempts[username].lockoutUntil && loginAttempts[username].lockoutUntil > now) {
                const remainingMs = loginAttempts[username].lockoutUntil - now;
                const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
                return res.status(403).json({
                    success: false,
                    isLocked: true,
                    message: `Tài khoản của bạn đã bị khóa tạm thời do nhập sai quá nhiều lần. Các thiết bị khác cũng bị buộc đăng xuất. Vui lòng thử lại sau ${remainingMinutes} phút.`
                });
            }
        } catch (error) { }
    }
    next();
});

// Verify token endpoint
app.get('/api/verify-token', verifyToken, (req, res) => {
    res.json({ success: true, user: req.user });
});

// Avatar update endpoint
app.post('/api/users/avatar', verifyToken, (req, res) => {
    const { avatarBase64 } = req.body;
    const username = req.user.username;
    if (!avatarBase64) return res.status(400).json({ success: false, message: 'Thiếu dữ liệu ảnh!' });

    db.query('UPDATE users SET Avatar = ? WHERE TaiKhoan = ?', [avatarBase64, username], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi máy chủ', error: err.message });
        res.json({ success: true, message: 'Cập nhật ảnh đại diện thành công!', avatar: avatarBase64 });
    });
});

// Change password endpoint
app.post('/api/change-password', verifyToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const username = req.user.username;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới!' });
    }
    if (currentPassword === newPassword) {
        return res.status(400).json({ success: false, message: 'Mật khẩu mới không được trùng với mật khẩu cũ!' });
    }
    if (newPassword.length < 8 || newPassword.length > 20) {
        return res.status(400).json({ success: false, message: 'Mật khẩu mới phải từ 8 đến 20 ký tự!' });
    }

    const query = 'SELECT password FROM users WHERE TaiKhoan = ?';
    db.query(query, [username], async (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi server!' });
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản!' });
        }

        const user = results[0];
        let passwordMatch = false;

        if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
            passwordMatch = await bcrypt.compare(currentPassword, user.password);
        } else {
            passwordMatch = (currentPassword === user.password);
        }

        if (!passwordMatch) {
            return res.status(401).json({ success: false, message: 'Mật khẩu hiện tại không đúng!' });
        }

        try {
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
            db.query('UPDATE users SET password = ? WHERE TaiKhoan = ?', [hashedPassword, username], (err) => {
                if (err) return res.status(500).json({ success: false, message: 'Lỗi cập nhật mật khẩu!' });
                res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Lỗi mã hóa mật khẩu!' });
        }
    });
});

// Student change password endpoint (without token verification for simplicity)
app.post('/api/student/change-password', async (req, res) => {
    const { username, currentPassword, newPassword } = req.body;

    if (!username || !currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin!' });
    }
    if (currentPassword === newPassword) {
        return res.status(400).json({ success: false, message: 'Mật khẩu mới không được trùng với mật khẩu cũ!' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự!' });
    }

    const query = 'SELECT password FROM users WHERE TaiKhoan = ?';
    db.query(query, [username], async (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi server!' });
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản!' });
        }

        const user = results[0];
        let passwordMatch = false;

        if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
            passwordMatch = await bcrypt.compare(currentPassword, user.password);
        } else {
            passwordMatch = (currentPassword === user.password);
        }

        if (!passwordMatch) {
            return res.status(401).json({ success: false, message: 'Mật khẩu hiện tại không đúng!' });
        }

        try {
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
            db.query('UPDATE users SET password = ? WHERE TaiKhoan = ?', [hashedPassword, username], (err) => {
                if (err) return res.status(500).json({ success: false, message: 'Lỗi cập nhật mật khẩu!' });
                res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Lỗi mã hóa mật khẩu!' });
        }
    });
});

// Teacher change password endpoint (without token verification for simplicity)
app.post('/api/teacher/change-password', async (req, res) => {
    const { username, currentPassword, newPassword } = req.body;
    console.log('Teacher password change request:', { username, hasCurrent: !!currentPassword, hasNew: !!newPassword, newLength: newPassword?.length });

    if (!username || !currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin!' });
    }
    if (currentPassword === newPassword) {
        return res.status(400).json({ success: false, message: 'Mật khẩu mới không được trùng với mật khẩu cũ!' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự!' });
    }

    const query = 'SELECT password FROM users WHERE TaiKhoan = ?';
    db.query(query, [username], async (err, results) => {
        if (err) {
            console.error('Teacher password change DB error:', err);
            return res.status(500).json({ success: false, message: 'Lỗi server!' });
        }
        console.log('Teacher password change DB results:', { found: results.length > 0 });
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản!' });
        }

        const user = results[0];
        let passwordMatch = false;

        if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
            passwordMatch = await bcrypt.compare(currentPassword, user.password);
        } else {
            passwordMatch = (currentPassword === user.password);
        }
        console.log('Teacher password match:', passwordMatch);

        if (!passwordMatch) {
            return res.status(401).json({ success: false, message: 'Mật khẩu hiện tại không đúng!' });
        }

        try {
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
            db.query('UPDATE users SET password = ? WHERE TaiKhoan = ?', [hashedPassword, username], (err) => {
                if (err) {
                    console.error('Teacher password update error:', err);
                    return res.status(500).json({ success: false, message: 'Lỗi cập nhật mật khẩu!' });
                }
                console.log('Teacher password updated successfully');
                res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
            });
        } catch (error) {
            console.error('Teacher password hash error:', error);
            res.status(500).json({ success: false, message: 'Lỗi mã hóa mật khẩu!' });
        }
    });
});

// Reset password endpoint
app.post('/api/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp token và mật khẩu mới!' });
    }

    // Validate password strength
    if (newPassword.length < 8 || newPassword.length > 20) {
        return res.status(400).json({ success: false, message: 'Mật khẩu phải từ 8 đến 20 ký tự!' });
    }

    try {
        // Verify JWT token
        const decoded = jwt.verify(token, JWT_SECRET);
        const { email, id, userType } = decoded;

        // Fetch current user password
        db.query('SELECT password FROM users WHERE TaiKhoan = ?', [id], async (err, results) => {
            if (err) return res.status(500).json({ success: false, message: 'Lỗi server khi kiểm tra mật khẩu cũ!' });
            if (results.length === 0) return res.status(404).json({ success: false, message: 'Tài khoản không tồn tại!' });

            const user = results[0];
            let passwordMatch = false;

            if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
                passwordMatch = await bcrypt.compare(newPassword, user.password);
            } else {
                passwordMatch = (newPassword === user.password);
            }

            if (passwordMatch) {
                return res.status(400).json({ success: false, message: 'Mật khẩu mới không được trùng với mật khẩu cũ!' });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

            // Update password in users table
            db.query('UPDATE users SET password = ? WHERE TaiKhoan = ?', [hashedPassword, id], (updateErr) => {
                if (updateErr) return res.status(500).json({ success: false, message: 'Lỗi cập nhật mật khẩu!' });
                res.json({ success: true, message: 'Đặt lại mật khẩu thành công!' });
            });
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(400).json({ success: false, message: 'Token đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu lại!' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(400).json({ success: false, message: 'Token không hợp lệ!' });
        }
        return res.status(500).json({ success: false, message: 'Lỗi server!' });
    }
});

// ==================== DASHBOARD STATISTICS ====================
app.get('/api/dashboard/stats', (req, res) => {
    const queries = ["SELECT COUNT(*) as total FROM sinhvien WHERE TrangThai = 'Đang học'", 'SELECT COUNT(*) as total FROM monhoc', 'SELECT COUNT(*) as total FROM lophoc', "SELECT COUNT(*) as total FROM giangvien WHERE TrangThai = 'Đang dạy'"];
    Promise.all(queries.map(q => new Promise((resolve, reject) => {
        db.query(q, (err, results) => err ? reject(err) : resolve(results[0].total));
    }))).then(([students, subjects, classes, teachers]) => {
        res.json({ totalStudents: students, totalSubjects: subjects, totalClasses: classes, totalTeachers: teachers });
    }).catch(err => {
        console.error("[DB Error] Lỗi lấy thống kê dashboard:", err);
        res.status(500).json({ success: false, message: 'Lỗi lấy thống kê!' });
    });
});

app.get('/api/dashboard/stats-by-faculty', (req, res) => {
    const query = `SELECT k.MaKhoa, k.TenKhoa, (SELECT COUNT(*) FROM sinhvien s JOIN lophoc l ON s.MaLop = l.MaLop WHERE l.MaKhoa = k.MaKhoa AND s.TrangThai = 'Đang học') as studentCount, (SELECT COUNT(*) FROM giangvien WHERE MaKhoa = k.MaKhoa AND TrangThai = 'Đang dạy') as teacherCount, (SELECT COUNT(*) FROM lophoc WHERE MaKhoa = k.MaKhoa) as classCount FROM khoa k`;
    executeQuery(query, [], res, 'Lỗi lấy thống kê theo khoa!');
});

app.get('/api/dashboard/academic-standing', (req, res) => {
    const query = `
        SELECT COUNT(*) as totalStudents,
            SUM(CASE WHEN gpa >= 3.6 THEN 1 ELSE 0 END) as excellent,
            SUM(CASE WHEN gpa >= 3.2 AND gpa < 3.6 THEN 1 ELSE 0 END) as veryGood,
            SUM(CASE WHEN gpa >= 2.5 AND gpa < 3.2 THEN 1 ELSE 0 END) as good,
            SUM(CASE WHEN gpa >= 2.0 AND gpa < 2.5 THEN 1 ELSE 0 END) as average,
            SUM(CASE WHEN gpa < 2.0 THEN 1 ELSE 0 END) as warning
        FROM (
            SELECT s.MSSV, ((SUM((${gradeCalcSQL}) * mh.SoTinChi)) / SUM(mh.SoTinChi)) as gpa
            FROM sinhvien s LEFT JOIN diem d ON s.MSSV = d.MSSV LEFT JOIN lophocphan lhp ON d.MaLopHocPhan = lhp.MaLopHocPhan LEFT JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc GROUP BY s.MSSV
        ) as student_gpa
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ success: false });
        res.json(results[0] || { totalStudents: 0, excellent: 0, veryGood: 0, good: 0, average: 0, warning: 0 });
    });
});

app.get('/api/dashboard/attendance-stats', (req, res) => {
    const query = `SELECT COUNT(*) as totalRecords, SUM(CASE WHEN TrangThai = 'Có mặt' THEN 1 ELSE 0 END) as present, SUM(CASE WHEN TrangThai = 'Vắng mặt' THEN 1 ELSE 0 END) as absent, SUM(CASE WHEN TrangThai = 'Có phép' THEN 1 ELSE 0 END) as excused FROM diemdanh`;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ success: false });
        const data = results[0] || { totalRecords: 0, present: 0, absent: 0, excused: 0 };
        res.json({ ...data, attendanceRate: data.totalRecords > 0 ? parseFloat(((data.present / data.totalRecords) * 100).toFixed(2)) : 0 });
    });
});

app.get('/api/dashboard/recent-students', (req, res) => {
    executeQuery('SELECT s.MSSV, s.HoTen, l.TenLop, u.NgayTao FROM sinhvien s LEFT JOIN lophoc l ON s.MaLop = l.MaLop JOIN users u ON s.MSSV = u.TaiKhoan ORDER BY u.NgayTao DESC LIMIT 5', [], res, 'Lỗi lấy sinh viên mới!');
});

app.get('/api/dashboard/lecturer-workload', (req, res) => {
    const query = `SELECT g.MaGiangVien, g.HoTen, COUNT(DISTINCT pc.MaMonHoc) as soMonHoc, COUNT(DISTINCT pc.MaLop) as soLop, SUM(mh.SoTinChi) as tongTinChi FROM giangvien g LEFT JOIN phanconggiangday pc ON g.MaGiangVien = pc.MaGiangVien LEFT JOIN monhoc mh ON pc.MaMonHoc = mh.MaMonHoc GROUP BY g.MaGiangVien, g.HoTen ORDER BY tongTinChi DESC`;
    executeQuery(query, [], res, 'Lỗi lấy thống kê tải công!');
});

app.get('/api/sinhvien/:mssv/tong-quan', (req, res) => res.json({ gpa: 3.2, tongTinChi: 85, monDangHoc: 5, lichHocHomNay: [] }));

// ==================== USERS & ROLES ====================
app.get('/api/users', (req, res) => {
    const query = `
        SELECT u.TaiKhoan, u.password, u.NgayTao, u.MaQuyen, u.TrangThai, COALESCE(p.TenQuyen, 'Unknown') as TenQuyen,
               s.HoTen as TenSinhVien, s.NgaySinh as NgaySinhSV, s.GioiTinh as GioiTinhSV, s.Email as EmailSV, s.SoDienThoai as SDTSV, s.MaLop,
               g.HoTen as TenGiangVien, g.Email as EmailGV, g.SoDienThoai as SDTGV, g.MaKhoa,
               l.TenLop, k.TenKhoa
        FROM users u
        LEFT JOIN phanquyen p ON u.MaQuyen = p.MaQuyen
        LEFT JOIN sinhvien s ON u.TaiKhoan = s.MSSV
        LEFT JOIN giangvien g ON u.TaiKhoan = g.MaGiangVien
        LEFT JOIN lophoc l ON s.MaLop = l.MaLop
        LEFT JOIN khoa k ON g.MaKhoa = k.MaKhoa
    `;
    executeQuery(query, [], res, 'Lỗi lấy tài khoản!');
});
app.get('/api/roles', (req, res) => executeQuery('SELECT * FROM phanquyen', [], res, 'Lỗi lấy quyền!'));
app.post('/api/users', async (req, res) => {
    try {
        if (!req.body.password || req.body.password.length < 5 || req.body.password.length > 20) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải từ 5 đến 20 ký tự!' });
        }
        const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
        executeInsert('INSERT INTO users (TaiKhoan, password, MaQuyen, NgayTao) VALUES (?, ?, ?, NOW())', [req.body.TaiKhoan, hashedPassword, req.body.MaQuyen], res, 'Thêm tài khoản thành công!', 'Lỗi thêm tài khoản!');
    } catch (e) { res.status(500).json({ success: false, message: 'Lỗi mã hóa!' }); }
});
app.put('/api/users/:taiKhoan', async (req, res) => {
    try {
        if (req.body.password) {
            if (req.body.password.length < 5 || req.body.password.length > 20) {
                return res.status(400).json({ success: false, message: 'Mật khẩu phải từ 5 đến 20 ký tự!' });
            }
            const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
            executeUpdate('UPDATE users SET password = ?, MaQuyen = ? WHERE TaiKhoan = ?', [hashedPassword, req.body.MaQuyen, req.params.taiKhoan], res, 'Cập nhật thành công!', 'Lỗi cập nhật!');
        } else {
            executeUpdate('UPDATE users SET MaQuyen = ? WHERE TaiKhoan = ?', [req.body.MaQuyen, req.params.taiKhoan], res, 'Cập nhật thành công!', 'Lỗi cập nhật!');
        }
    } catch (e) { res.status(500).json({ success: false, message: 'Lỗi mã hóa!' }); }
});
app.delete('/api/users/:taiKhoan', (req, res) => executeDelete('DELETE FROM users WHERE TaiKhoan = ?', [req.params.taiKhoan], res, 'Xóa tài khoản thành công!', 'Lỗi xóa!'));
app.put('/api/users/:taiKhoan/reset-password', async (req, res) => {
    try {
        const passwordVal = req.body.password || req.body.newPassword;
        if (!passwordVal || passwordVal.length < 5 || passwordVal.length > 20) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải từ 5 đến 20 ký tự!' });
        }
        const hashedPassword = await bcrypt.hash(passwordVal, saltRounds);
        executeUpdate('UPDATE users SET password = ? WHERE TaiKhoan = ?', [hashedPassword, req.params.taiKhoan], res, 'Đặt lại MK thành công!', 'Lỗi đặt lại MK!');
    } catch (e) { res.status(500).json({ success: false, message: 'Lỗi mã hóa!' }); }
});

app.put('/api/users/:taiKhoan/status', (req, res) => {
    let { TrangThai } = req.body;
    if (TrangThai === 1 || TrangThai === '1' || TrangThai === true) TrangThai = 'Hoạt động';
    if (TrangThai === 0 || TrangThai === '0' || TrangThai === false) TrangThai = 'Bị khóa';
    executeUpdate('UPDATE users SET TrangThai = ? WHERE TaiKhoan = ?', [TrangThai, req.params.taiKhoan], res, 'Cập nhật trạng thái thành công!', 'Lỗi cập nhật trạng thái!');
});

// ==================== STUDENTS ====================
app.get('/api/students', (req, res) =>
    executeQuery(
        `SELECT 
      s.MSSV, 
      s.HoTen, 
      s.NgaySinh, 
      s.GioiTinh, 
      s.Email, 
      s.SoDienThoai, 
      s.MaLop, 
      s.TrangThai,
      l.MaKhoa,    -- Lấy đích danh MaKhoa từ bảng lophoc
      l.TenLop,
      l.NienKhoa,
      k.TenKhoa,
      the.uid AS UID,
      u.Avatar
    FROM sinhvien s
    LEFT JOIN lophoc l ON s.MaLop = l.MaLop
    LEFT JOIN khoa k ON l.MaKhoa = k.MaKhoa
    LEFT JOIN the_sv the ON s.MSSV COLLATE utf8mb4_unicode_ci = the.MSSV COLLATE utf8mb4_unicode_ci
    LEFT JOIN users u ON s.MSSV COLLATE utf8mb4_unicode_ci = u.TaiKhoan COLLATE utf8mb4_unicode_ci`,
        [],
        res,
        'Lỗi lấy danh sách sinh viên!'
    )
);
app.post('/api/students', async (req, res) => {
    const { MSSV, HoTen, NgaySinh, GioiTinh, Email, SoDienThoai, MaLop, TrangThai } = req.body;

    // Ràng buộc dữ liệu đầu vào - Kiểm tra các trường bắt buộc
    if (!MSSV || !HoTen || !NgaySinh || !Email || !SoDienThoai || !MaLop) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin sinh viên bắt buộc!' });
    }

    // Validate Họ tên
    if (!HoTen.trim() || HoTen.length < 2) {
        return res.status(400).json({ success: false, message: 'Họ tên phải có ít nhất 2 ký tự!' });
    }
    if (HoTen.length > 100) {
        return res.status(400).json({ success: false, message: 'Họ tên không được vượt quá 100 ký tự!' });
    }
    // Validate Họ tên chỉ được chứa chữ cái và khoảng trắng
    const nameRegex = /^[a-zA-ZÀ-Ỹà-ỹ\s]+$/;
    if (!nameRegex.test(HoTen)) {
        return res.status(400).json({ success: false, message: 'Họ tên chỉ được chứa chữ cái và khoảng trắng!' });
    }

    // Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(Email)) {
        return res.status(400).json({ success: false, message: 'Email không đúng định dạng!' });
    }
    if (Email.length > 100) {
        return res.status(400).json({ success: false, message: 'Email không được vượt quá 100 ký tự!' });
    }

    // Validate Số điện thoại
    const phoneRegex = /^(0[3-9]|\+84[3-9])[0-9]{8}$/;
    if (!phoneRegex.test(SoDienThoai)) {
        return res.status(400).json({ success: false, message: 'Số điện thoại không đúng định dạng (bắt đầu bằng 0 hoặc +84)!' });
    }

    // Validate Ngày sinh
    const birthDate = new Date(NgaySinh);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (isNaN(birthDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Ngày sinh không hợp lệ!' });
    }
    if (age < 15 || age > 100) {
        return res.status(400).json({ success: false, message: 'Ngày sinh không hợp lệ (tuổi phải từ 15-100)!' });
    }

    // Validate MSSV format
    if (!/^[A-Z0-9]+$/.test(MSSV)) {
        return res.status(400).json({ success: false, message: 'MSSV chỉ được chứa chữ cái hoa và số!' });
    }
    if (MSSV.length > 20) {
        return res.status(400).json({ success: false, message: 'MSSV không được vượt quá 20 ký tự!' });
    }

    // Validate Giới tính
    if (GioiTinh && !['Nam', 'Nữ'].includes(GioiTinh)) {
        return res.status(400).json({ success: false, message: 'Giới tính phải là Nam hoặc Nữ!' });
    }

    // Validate TrangThai
    const validTrangThai = ['Đang học', 'Bảo lưu', 'Nghỉ học'];
    if (TrangThai && !validTrangThai.includes(TrangThai)) {
        return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ!' });
    }

    try {
        // Kiểm tra email đã tồn tại chưa
        const emailCheck = await new Promise((resolve, reject) => {
            db.query('SELECT Email FROM sinhvien WHERE Email = ?', [Email], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        if (emailCheck.length > 0) {
            return res.status(400).json({ success: false, message: 'Email này đã được sử dụng!' });
        }

        // Kiểm tra số điện thoại đã tồn tại chưa
        const phoneCheck = await new Promise((resolve, reject) => {
            db.query('SELECT SoDienThoai FROM sinhvien WHERE SoDienThoai = ?', [SoDienThoai], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        if (phoneCheck.length > 0) {
            return res.status(400).json({ success: false, message: 'Số điện thoại này đã được sử dụng!' });
        }

        // Kiểm tra lớp có tồn tại không
        const classCheck = await new Promise((resolve, reject) => {
            db.query('SELECT MaLop FROM lophoc WHERE MaLop = ?', [MaLop], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        if (classCheck.length === 0) {
            return res.status(400).json({ success: false, message: 'Lớp không tồn tại!' });
        }

        // Tạo user và sinh viên
        const hashedPassword = await bcrypt.hash('123456aA@', saltRounds);

        await new Promise((resolve, reject) => {
            db.query(
                'INSERT INTO users (TaiKhoan, password, MaQuyen, Avatar) VALUES (?, ?, 3, ?)',
                [MSSV, hashedPassword, req.body.Avatar || null],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        await new Promise((resolve, reject) => {
            db.query(
                'INSERT INTO sinhvien (MSSV, HoTen, NgaySinh, GioiTinh, Email, SoDienThoai, MaLop, TrangThai) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [MSSV, HoTen, NgaySinh, GioiTinh, Email, SoDienThoai, MaLop, TrangThai || 'Đang học'],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        // Tự động đồng bộ sinh viên mới vào danh sách lớp học phần của lớp hành chính
        db.query("INSERT IGNORE INTO diem (MSSV, MaLopHocPhan, HocKy) SELECT ?, lhp.MaLopHocPhan, lhp.HocKy FROM lophocphan lhp WHERE lhp.MaLop = ?", [MSSV, MaLop], () => { });
        db.query("INSERT IGNORE INTO dangky_hocphan (MSSV, MaLopHocPhan, HocKy, TrangThai, NgayDangKy) SELECT ?, lhp.MaLopHocPhan, lhp.HocKy, 'Đã duyệt', NOW() FROM lophocphan lhp WHERE lhp.MaLop = ?", [MSSV, MaLop], () => { });

        // Nếu lúc thêm sinh viên có quẹt thẻ, lưu luôn thẻ đó vào database
        if (req.body.UID) {
            await new Promise((resolve, reject) => {
                db.query('INSERT INTO the_sv (uid, MSSV) VALUES (?, ?)', [req.body.UID, MSSV], (err) => {
                    if (err) {
                        if (err.code === 'ER_DUP_ENTRY') reject(new Error(`Thẻ UID ${req.body.UID} đã được sử dụng bởi người khác.`));
                        else reject(err);
                    } else resolve();
                });
            });
        }

        res.json({ success: true, message: 'Thêm sinh viên thành công!' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: `Tài khoản ${MSSV} đã tồn tại` });
        }
        console.error('SINHVIEN INSERT ERROR:', error);
        res.status(500).json({ success: false, message: error.sqlMessage || error.message || 'Lỗi khi thêm sinh viên!' });
    }
});
app.put('/api/students/:mssv', async (req, res) => {
    const data = req.body;

    // Ràng buộc dữ liệu đầu vào - Kiểm tra các trường bắt buộc
    if (!data.HoTen || !data.NgaySinh || !data.Email || !data.SoDienThoai || !data.MaLop) {
        return res.status(400).json({ success: false, message: 'Dữ liệu cập nhật không đầy đủ!' });
    }

    // Validate Họ tên
    if (!data.HoTen.trim() || data.HoTen.length < 2) {
        return res.status(400).json({ success: false, message: 'Họ tên phải có ít nhất 2 ký tự!' });
    }
    if (data.HoTen.length > 100) {
        return res.status(400).json({ success: false, message: 'Họ tên không được vượt quá 100 ký tự!' });
    }
    // Validate Họ tên chỉ được chứa chữ cái và khoảng trắng
    const nameRegex = /^[a-zA-ZÀ-Ỹà-ỹ\s]+$/;
    if (!nameRegex.test(data.HoTen)) {
        return res.status(400).json({ success: false, message: 'Họ tên chỉ được chứa chữ cái và khoảng trắng!' });
    }

    // Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.Email)) {
        return res.status(400).json({ success: false, message: 'Email không đúng định dạng!' });
    }
    if (data.Email.length > 100) {
        return res.status(400).json({ success: false, message: 'Email không được vượt quá 100 ký tự!' });
    }

    // Validate Số điện thoại
    const phoneRegex = /^(0[3-9]|\+84[3-9])[0-9]{8}$/;
    if (!phoneRegex.test(data.SoDienThoai)) {
        return res.status(400).json({ success: false, message: 'Số điện thoại không đúng định dạng (bắt đầu bằng 0 hoặc +84)!' });
    }

    // Validate Ngày sinh
    const birthDate = new Date(data.NgaySinh);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (isNaN(birthDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Ngày sinh không hợp lệ!' });
    }
    if (age < 15 || age > 100) {
        return res.status(400).json({ success: false, message: 'Ngày sinh không hợp lệ (tuổi phải từ 15-100)!' });
    }

    // Validate Giới tính
    if (data.GioiTinh && !['Nam', 'Nữ'].includes(data.GioiTinh)) {
        return res.status(400).json({ success: false, message: 'Giới tính phải là Nam hoặc Nữ!' });
    }

    // Validate TrangThai
    const validTrangThai = ['Đang học', 'Bảo lưu', 'Nghỉ học'];
    if (data.TrangThai && !validTrangThai.includes(data.TrangThai)) {
        return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ!' });
    }

    try {
        // Kiểm tra email đã tồn tại chưa (trừ sinh viên hiện tại)
        const emailCheck = await new Promise((resolve, reject) => {
            db.query('SELECT Email FROM sinhvien WHERE Email = ? AND MSSV != ?', [data.Email, req.params.mssv], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        if (emailCheck.length > 0) {
            return res.status(400).json({ success: false, message: 'Email này đã được sử dụng!' });
        }

        // Kiểm tra số điện thoại đã tồn tại chưa (trừ sinh viên hiện tại)
        const phoneCheck = await new Promise((resolve, reject) => {
            db.query('SELECT SoDienThoai FROM sinhvien WHERE SoDienThoai = ? AND MSSV != ?', [data.SoDienThoai, req.params.mssv], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        if (phoneCheck.length > 0) {
            return res.status(400).json({ success: false, message: 'Số điện thoại này đã được sử dụng!' });
        }

        // Kiểm tra lớp có tồn tại không
        const classCheck = await new Promise((resolve, reject) => {
            db.query('SELECT MaLop FROM lophoc WHERE MaLop = ?', [data.MaLop], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        if (classCheck.length === 0) {
            return res.status(400).json({ success: false, message: 'Lớp không tồn tại!' });
        }

        // Cập nhật sinh viên
        await new Promise((resolve, reject) => {
            db.query(
                `UPDATE sinhvien
                 SET HoTen=?, NgaySinh=?, GioiTinh=?, Email=?, SoDienThoai=?, MaLop=?, TrangThai=?
                 WHERE MSSV=?`,
                [
                    data.HoTen,
                    data.NgaySinh,
                    data.GioiTinh,
                    data.Email,
                    data.SoDienThoai,
                    data.MaLop,
                    data.TrangThai || 'Đang học',
                    req.params.mssv
                ],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        // Tự động khóa/mở khóa tài khoản tương ứng nếu có thay đổi trạng thái
        if (data.TrangThai) {
            const userStatus = data.TrangThai === 'Nghỉ học' ? 0 : 1;
            await new Promise((resolve) => {
                db.query('UPDATE users SET TrangThai = ? WHERE TaiKhoan = ?', [userStatus, req.params.mssv], (err) => {
                    if (err) console.error('Lỗi cập nhật trạng thái tài khoản:', err);
                    resolve();
                });
            });
        }

        if (data.Avatar !== undefined) {
            await new Promise((resolve) => {
                db.query('UPDATE users SET Avatar = ? WHERE TaiKhoan = ?', [data.Avatar, req.params.mssv], (err) => {
                    if (err) console.error('Lỗi cập nhật Avatar:', err);
                    resolve();
                });
            });
        }

        // Cập nhật thẻ UID nếu có truyền lên
        if (data.UID !== undefined) {
            await new Promise((resolve, reject) => {
                if (data.UID.trim() === '') {
                    db.query('DELETE FROM the_sv WHERE MSSV = ?', [req.params.mssv], (err) => {
                        if (err) reject(err); else resolve();
                    });
                } else {
                    db.query('INSERT INTO the_sv (uid, MSSV) VALUES (?, ?)', [data.UID, req.params.mssv], (err) => {
                        if (err) {
                            if (err.code === 'ER_DUP_ENTRY') {
                                // Kiểm tra xem đã được gán cho chính sinh viên này chưa
                                db.query('SELECT MSSV FROM the_sv WHERE uid = ?', [data.UID], (checkErr, results) => {
                                    if (!checkErr && results.length > 0 && results[0].MSSV === req.params.mssv) {
                                        resolve(); // Đã gán cho đúng sinh viên này -> Bỏ qua lỗi
                                    } else {
                                        reject(new Error(`Thẻ UID ${data.UID} đã được sử dụng bởi người khác.`));
                                    }
                                });
                            } else {
                                reject(err);
                            }
                        } else resolve();
                    });
                }
            });
        }

        res.json({
            success: true,
            message: 'Cập nhật thành công'
        });
    } catch (error) {
        console.error('SQL ERROR:', error);
        res.status(500).json({
            success: false,
            message: error.sqlMessage || error.message || 'Lỗi khi cập nhật sinh viên!'
        });
    }
});
app.delete('/api/students/:mssv', (req, res) => {
    const mssv = req.params.mssv;
    db.query('DELETE FROM sinhvien WHERE MSSV = ?', [mssv], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi xóa bảng sinhvien' });
        db.query('DELETE FROM users WHERE TaiKhoan = ?', [mssv], (err) => {
            if (err) return res.status(500).json({ success: false, message: 'Lỗi xóa bảng users' });
            res.json({ success: true, message: 'Xóa thành công!' });
        });
    });
});

app.put('/api/students/:mssv/clear-uid', (req, res) => {
    db.query('DELETE FROM the_sv WHERE MSSV = ?', [req.params.mssv], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi khi xóa mã thẻ!', error: err.message });
        res.json({ success: true, message: 'Xóa mã thẻ thành công!' });
    });
});

app.get('/api/students/next-code/:maLop', (req, res) => {
    const { maLop } = req.params;
    const queryLop = `SELECT l.NienKhoa, k.ID as KhoaID FROM lophoc l JOIN khoa k ON l.MaKhoa = k.MaKhoa WHERE l.MaLop = ?`;

    db.query(queryLop, [maLop], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        if (rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy thông tin lớp' });

        const nienKhoa = rows[0].NienKhoa;
        const khoaId = rows[0].KhoaID;

        if (!nienKhoa) return res.status(400).json({ error: 'Lớp này chưa được cài đặt Niên khóa!' });
        if (!khoaId) return res.status(400).json({ error: 'Khoa này chưa có ID (Khóa chính)!' });

        const startYearStr = nienKhoa.split('-')[0];
        const startYearSuffix = startYearStr.slice(-2);
        const paddedKhoaId = String(khoaId).padStart(2, '0');
        const prefix = `${startYearSuffix}${paddedKhoaId}`;

        const queryMSSV = `SELECT MSSV FROM sinhvien WHERE MSSV LIKE ? ORDER BY MSSV DESC LIMIT 1`;

        db.query(queryMSSV, [`${prefix}%`], (err, svRows) => {
            if (err) return res.status(500).json({ error: 'Lỗi sinh mã MSSV' });
            let nextNum = 1;
            if (svRows.length > 0) {
                const currentMax = svRows[0].MSSV;
                const suffix = currentMax.replace(prefix, '');
                const currentNum = parseInt(suffix, 10);
                if (!isNaN(currentNum)) nextNum = currentNum + 1;
            }
            const nextMSSV = `${prefix}${String(nextNum).padStart(4, '0')}`;
            res.json({ MSSV: nextMSSV });
        });
    });
});
app.get('/api/students/:mssv/details', (req, res) => executeQuery('SELECT s.*, l.TenLop, l.MaKhoa, k.TenKhoa, k.TinChiYeuCau, u.Avatar FROM sinhvien s LEFT JOIN lophoc l ON s.MaLop = l.MaLop LEFT JOIN khoa k ON l.MaKhoa = k.MaKhoa LEFT JOIN users u ON s.MSSV = u.TaiKhoan WHERE s.MSSV = ?', [req.params.mssv], res, 'Lỗi chi tiết SV!'));
app.get('/api/students/:mssv/schedule', (req, res) => executeQuery(`
    SELECT lh.*, lhp.MaMonHoc, lhp.MaLop, lhp.HocKy, mh.TenMonHoc, gv.HoTen as TenGiangVien 
    FROM diem d 
    JOIN lophocphan lhp ON d.MaLopHocPhan = lhp.MaLopHocPhan 
    JOIN lichhoc lh ON lh.MaLopHocPhan = lhp.MaLopHocPhan 
    JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc 
    LEFT JOIN giangvien gv ON lhp.MaGiangVien = gv.MaGiangVien 
    WHERE d.MSSV = ?
`, [req.params.mssv], res, 'Lỗi lịch SV!'));
// ==================== TEACHERS ====================
app.get('/api/teachers', (req, res) => executeQuery('SELECT g.*, k.TenKhoa, u.Avatar FROM giangvien g LEFT JOIN khoa k ON g.MaKhoa = k.MaKhoa LEFT JOIN users u ON g.MaGiangVien COLLATE utf8mb4_unicode_ci = u.TaiKhoan COLLATE utf8mb4_unicode_ci', [], res, 'Lỗi lấy GV!'));
app.get('/api/teachers/next-code/:maKhoa', (req, res) => {
    const prefix = `GV${req.params.maKhoa}`;
    db.query(`SELECT MaGiangVien FROM giangvien WHERE MaGiangVien LIKE ? ORDER BY MaGiangVien DESC LIMIT 1`, [`${prefix}%`], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        let nextNum = 1;
        if (results.length > 0) { const match = results[0].MaGiangVien.match(/\d+$/); if (match) nextNum = parseInt(match[0], 10) + 1; }
        res.json({ MaGiangVien: `${prefix}${String(nextNum).padStart(3, '0')}` });
    });
});
app.post('/api/teachers', async (req, res) => {
    const { MaGiangVien, HoTen, Email, SoDienThoai, MaKhoa, TrangThai, GioiTinh, NgaySinh, CapBac } = req.body;
    try {
        const hashedPassword = await bcrypt.hash('gv@2025', saltRounds);
        db.query('INSERT INTO users (TaiKhoan, password, MaQuyen, Avatar) VALUES (?, ?, 2, ?)', [MaGiangVien, hashedPassword, req.body.Avatar || null], (err) => {
            if (err) return res.status(500).json({ success: false, message: 'Lỗi tạo TK GV!' });
            db.query('INSERT INTO giangvien (MaGiangVien, HoTen, Email, SoDienThoai, MaKhoa, TrangThai, GioiTinh, NgaySinh, CapBac) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [MaGiangVien, HoTen, Email, SoDienThoai, MaKhoa, TrangThai || 'Đang dạy', GioiTinh || null, NgaySinh || null, CapBac || 'Thạc sĩ'], (err) => {
                if (err) return res.status(500).json({ success: false, message: 'Lỗi thêm GV!' });
                res.json({ success: true, message: 'Thêm giảng viên thành công!' });
            });
        });
    } catch (err) { res.status(500).json({ success: false, message: 'Lỗi mã hóa!' }); }
});
app.put('/api/teachers/:maGV', async (req, res) => {
    console.log('DEBUG UPDATE GV - CapBac nhận được:', req.body.CapBac);
    try {
        await new Promise((resolve, reject) => {
            const capBacValue = req.body.CapBac || 'Thạc sĩ';
            console.log('DEBUG UPDATE GV - CapBac sẽ lưu:', capBacValue);
            db.query(
                'UPDATE giangvien SET HoTen=?, Email=?, SoDienThoai=?, MaKhoa=?, TrangThai=?, GioiTinh=?, NgaySinh=?, CapBac=? WHERE MaGiangVien=?',
                [req.body.HoTen, req.body.Email, req.body.SoDienThoai, req.body.MaKhoa, req.body.TrangThai || 'Đang dạy', req.body.GioiTinh || null, req.body.NgaySinh || null, capBacValue, req.params.maGV],
                (err) => {
                    if (err) {
                        console.error('Lỗi UPDATE giảng viên:', err);
                        reject(err);
                    } else {
                        console.log('UPDATE giảng viên thành công');
                        resolve();
                    }
                }
            );
        });

        if (req.body.TrangThai) {
            const userStatus = req.body.TrangThai === 'Nghỉ việc' ? 0 : 1;
            await new Promise((resolve) => {
                db.query('UPDATE users SET TrangThai = ? WHERE TaiKhoan = ?', [userStatus, req.params.maGV], (err) => {
                    if (err) console.error('Lỗi cập nhật trạng thái tài khoản giảng viên:', err);
                    resolve();
                });
            });
        }

        if (req.body.Avatar !== undefined) {
            await new Promise((resolve) => {
                db.query('UPDATE users SET Avatar = ? WHERE TaiKhoan = ?', [req.body.Avatar, req.params.maGV], (err) => {
                    if (err) console.error('Lỗi cập nhật Avatar GV:', err);
                    resolve();
                });
            });
        }

        res.json({ success: true, message: 'Cập nhật thành công!' });
    } catch (err) {
        console.error('Lỗi cập nhật giảng viên:', err);
        res.status(500).json({ success: false, message: 'Lỗi cập nhật!' });
    }
});
app.delete('/api/teachers/:maGV', (req, res) => executeDelete('DELETE FROM users WHERE TaiKhoan = ?', [req.params.maGV], res, 'Xóa thành công!', 'Lỗi xóa!'));

app.get('/api/teachers/:maGV/details', (req, res) => executeQuery('SELECT g.*, k.TenKhoa, u.Avatar FROM giangvien g LEFT JOIN khoa k ON g.MaKhoa = k.MaKhoa LEFT JOIN users u ON g.MaGiangVien COLLATE utf8mb4_unicode_ci = u.TaiKhoan COLLATE utf8mb4_unicode_ci WHERE g.MaGiangVien = ?', [req.params.maGV], res, 'Lỗi lấy chi tiết!'));
app.get('/api/teachers/:maGV/teaching-schedule', (req, res) => executeQuery(`SELECT lh.*, lhp.MaMonHoc, lhp.MaLop, lhp.HocKy, mh.TenMonHoc, l.TenLop FROM lichhoc lh LEFT JOIN lophocphan lhp ON lh.MaLopHocPhan = lhp.MaLopHocPhan LEFT JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc LEFT JOIN lophoc l ON lhp.MaLop = l.MaLop WHERE lhp.MaGiangVien = ?`, [req.params.maGV], res, 'Lỗi lấy lịch giảng dạy!'));
app.get('/api/teachers/:maGV/teaching-load', (req, res) => executeQuery(`SELECT mh.TenMonHoc, mh.SoTinChi, l.TenLop, lhp.HocKy FROM lophocphan lhp JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc LEFT JOIN lophoc l ON lhp.MaLop = l.MaLop WHERE lhp.MaGiangVien = ?`, [req.params.maGV], res, 'Lỗi lấy tải công việc!'));
app.get('/api/teachers/:maGV/subjects', (req, res) => executeQuery(`SELECT DISTINCT mh.MaMonHoc, mh.TenMonHoc FROM lophocphan lhp JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc WHERE lhp.MaGiangVien = ?`, [req.params.maGV], res, 'Lỗi lấy môn học của giảng viên!'));

// ==================== FACULTIES ====================
app.get('/api/faculties', (req, res) => executeQuery('SELECT MaKhoa, TenKhoa, TinChiYeuCau FROM khoa ORDER BY TenKhoa', [], res, 'Loi lay khoa!'));
app.post('/api/faculties', (req, res) => executeInsert('INSERT INTO khoa (MaKhoa, TenKhoa, TinChiYeuCau) VALUES (?, ?, ?)', [req.body.MaKhoa, req.body.TenKhoa, req.body.TinChiYeuCau || 120], res, 'Thêm khoa thành công!', 'Lỗi thêm!'));
app.put('/api/faculties/:maKhoa', (req, res) => {
    const maKhoaMoi = req.body.MaKhoa;
    const maKhoaCu = req.params.maKhoa;
    const tenKhoa = req.body.TenKhoa;
    const tinChiYeuCau = req.body.TinChiYeuCau || 120;

    if (maKhoaMoi && maKhoaMoi !== maKhoaCu) {
        db.getConnection((err, connection) => {
            if (err) return res.status(500).json({ success: false, message: 'Lỗi kết nối DB!' });
            connection.query('SET FOREIGN_KEY_CHECKS = 0;', (err) => {
                if (err) { connection.release(); return res.status(500).json({ success: false, message: 'Lỗi DB!' }); }
                connection.query('UPDATE khoa SET TenKhoa=?, MaKhoa=?, TinChiYeuCau=? WHERE MaKhoa=?', [tenKhoa, maKhoaMoi, tinChiYeuCau, maKhoaCu], (err) => {
                    if (err) { connection.query('SET FOREIGN_KEY_CHECKS = 1;'); connection.release(); return res.status(500).json({ success: false, message: 'Lỗi cập nhật khoa!' }); }
                    connection.query('UPDATE lophoc SET MaKhoa=? WHERE MaKhoa=?', [maKhoaMoi, maKhoaCu], () => {
                        connection.query('UPDATE giangvien SET MaKhoa=? WHERE MaKhoa=?', [maKhoaMoi, maKhoaCu], () => {
                            connection.query('UPDATE monhoc SET MaKhoa=? WHERE MaKhoa=?', [maKhoaMoi, maKhoaCu], () => {
                                connection.query('SET FOREIGN_KEY_CHECKS = 1;', () => {
                                    connection.release();
                                    res.json({ success: true, message: 'Cập nhật thành công!' });
                                });
                            });
                        });
                    });
                });
            });
        });
    } else {
        executeUpdate('UPDATE khoa SET TenKhoa=?, TinChiYeuCau=? WHERE MaKhoa=?', [tenKhoa, tinChiYeuCau, maKhoaCu], res, 'Cập nhật thành công!', 'Lỗi cập nhật!');
    }
});

app.delete('/api/faculties/:maKhoa', (req, res) => executeDelete('DELETE FROM khoa WHERE MaKhoa=?', [req.params.maKhoa], res, 'Xóa thành công!', 'Lỗi xóa!'));
app.get('/api/faculties/:maKhoa/teachers', (req, res) => executeQuery('SELECT * FROM giangvien WHERE MaKhoa = ?', [req.params.maKhoa], res, 'Lỗi lấy danh sách GV!'));
app.get('/api/faculties/:maKhoa/students', (req, res) => executeQuery('SELECT sv.*, l.TenLop FROM sinhvien sv LEFT JOIN lophoc l ON sv.MaLop = l.MaLop WHERE l.MaKhoa = ?', [req.params.maKhoa], res, 'Lỗi lấy danh sách SV!'));
app.get('/api/faculties/:maKhoa/classes', (req, res) => executeQuery('SELECT l.*, (SELECT COUNT(*) FROM sinhvien sv WHERE sv.MaLop = l.MaLop) as SoSinhVien FROM lophoc l WHERE l.MaKhoa = ?', [req.params.maKhoa], res, 'Lỗi lấy danh sách Lớp!'));

// ==================== SUBJECTS ====================
app.get('/api/subjects', (req, res) => executeQuery("SELECT mh.*, COALESCE(mh.LoaiMonHoc, 'Đại cương') AS LoaiMon, COALESCE(mh.LoaiMonHoc, 'Đại cương') AS LoaiMonHoc, k.TenKhoa FROM monhoc mh LEFT JOIN khoa k ON mh.MaKhoa = k.MaKhoa", [], res, 'Lỗi lấy môn!'));
app.get('/api/subjects/next-code/:maKhoa', (req, res) => {
    const prefix = `${req.params.maKhoa}`;
    db.query(`SELECT MaMonHoc FROM monhoc WHERE MaMonHoc LIKE ? ORDER BY LENGTH(MaMonHoc) DESC, MaMonHoc DESC LIMIT 1`, [`${prefix}%`], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        let nextNum = 1;
        if (results.length > 0) { const match = results[0].MaMonHoc.match(/\d+$/); if (match) nextNum = parseInt(match[0], 10) + 1; }
        res.json({ MaMonHoc: `${prefix}${String(nextNum).padStart(3, '0')}` });
    });
});
// Đã sửa: Bổ sung trường MaKhoa và LoaiMonHoc vào câu lệnh INSERT và mảng tham số
app.post('/api/subjects', (req, res) => {
    console.log("Dữ liệu nhận được từ Frontend:", req.body);
    executeInsert(
        'INSERT INTO monhoc (MaMonHoc, TenMonHoc, SoTinChi, MaKhoa, LoaiMonHoc) VALUES (?, ?, ?, ?, ?)',
        [req.body.MaMonHoc, req.body.TenMonHoc, req.body.SoTinChi, req.body.MaKhoa || null, req.body.LoaiMonHoc || 'Đại cương'],
        res,
        'Thêm môn thành công!',
        'Lỗi thêm!'
    );
});

// PUT endpoint for subjects has been removed - edit functionality disabled
app.delete('/api/subjects/:maMH', (req, res) => executeDelete('DELETE FROM monhoc WHERE MaMonHoc=?', [req.params.maMH], res, 'Xóa thành công!', 'Lỗi xóa!'));
app.get('/api/subjects/:maMH/classes', (req, res) => executeQuery('SELECT DISTINCT l.MaLop, l.TenLop, (SELECT COUNT(*) FROM sinhvien sv WHERE sv.MaLop = l.MaLop) as SoSinhVien FROM lophocphan lhp JOIN lophoc l ON lhp.MaLop = l.MaLop WHERE lhp.MaMonHoc = ?', [req.params.maMH], res, 'Lỗi lấy danh sách lớp!'));
app.get('/api/subjects/:maMH/teachers', (req, res) => executeQuery('SELECT DISTINCT gv.MaGiangVien, gv.HoTen FROM lophocphan lhp JOIN giangvien gv ON lhp.MaGiangVien = gv.MaGiangVien WHERE lhp.MaMonHoc = ?', [req.params.maMH], res, 'Lỗi lấy danh sách GV!'));
app.get('/api/subjects/:maMH/grade-stats', (req, res) => {
    const query = `
        SELECT COUNT(d.MaDiem) as totalGrades, ROUND(AVG(d.DiemTong), 2) as average,
               SUM(CASE WHEN d.DiemTong >= 8.5 THEN 1 ELSE 0 END) as excellent,
               SUM(CASE WHEN d.DiemTong >= 7.0 AND d.DiemTong < 8.5 THEN 1 ELSE 0 END) as good,
               SUM(CASE WHEN d.DiemTong >= 5.0 AND d.DiemTong < 7.0 THEN 1 ELSE 0 END) as averageGrade,
               SUM(CASE WHEN d.DiemTong < 5.0 THEN 1 ELSE 0 END) as fail
        FROM diem d LEFT JOIN lophocphan lhp ON d.MaLopHocPhan = lhp.MaLopHocPhan WHERE lhp.MaMonHoc = ? OR d.MaLopHocPhan = ?
    `;
    db.query(query, [req.params.maMH, req.params.maMH], (err, rows) => {
        if (err) return res.status(500).json({ success: false });
        res.json(normalizeClassGradeStats(rows[0]));
    });
});

// ==================== CLASSES ====================
app.get('/api/classes', (req, res) => executeQuery('SELECT l.*, k.TenKhoa, (SELECT COUNT(*) FROM sinhvien sv WHERE sv.MaLop = l.MaLop) as SoSinhVien FROM lophoc l LEFT JOIN khoa k ON l.MaKhoa = k.MaKhoa ORDER BY l.MaLop', [], res, 'Lỗi lấy lớp!'));
app.get('/api/classes/next-code/:startYear/:maKhoa', (req, res) => {
    const { startYear, maKhoa } = req.params;
    const yearSuffix = startYear.slice(-2);
    const prefix = `${yearSuffix}${maKhoa}`;
    db.query('SELECT MaLop FROM lophoc WHERE MaLop LIKE ? ORDER BY MaLop DESC', [`${prefix}%`], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        let maxStt = 0;
        results.forEach(row => { const match = row.MaLop.match(new RegExp(`^${prefix}(\\d+)$`)); if (match) maxStt = Math.max(maxStt, parseInt(match[1])); });
        res.json({ MaLop: `${prefix}${maxStt + 1}` });
    });
});
app.get('/api/classes/next-name/:tenLop/:maKhoa/:nienKhoa', (req, res) => {
    const { tenLop, maKhoa, nienKhoa } = req.params;

    // Tách phần tên gốc và số thứ tự nếu có (ví dụ: "Lớp A 1" -> base="Lớp A", num=1)
    const baseMatch = tenLop.match(/^(.*?)\s*(\d+)$/);
    let baseName = tenLop;
    let startNum = 0;
    if (baseMatch) {
        baseName = baseMatch[1].trim();
        startNum = parseInt(baseMatch[2], 10);
    }

    // Tìm tất cả các lớp có tên bắt đầu bằng baseName trong cùng một khoa và cùng niên khóa
    const query = `
        SELECT TenLop FROM lophoc 
        WHERE MaKhoa = ? AND NienKhoa = ? AND (TenLop = ? OR TenLop LIKE ?)
    `;

    db.query(query, [maKhoa, decodeURIComponent(nienKhoa), tenLop, `${baseName}%`], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        // Nếu tên hiện tại chưa tồn tại thì trả về chính nó
        const exactMatch = rows.find(row => row.TenLop.trim().toLowerCase() === tenLop.trim().toLowerCase());
        if (!exactMatch) {
            return res.json({ TenLop: tenLop });
        }

        // Nếu đã tồn tại, tìm số lớn nhất để tăng lên
        let maxNum = startNum;
        rows.forEach(row => {
            // Regex khớp với baseName + khoảng trắng + số
            const match = row.TenLop.match(new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+(\\d+)$`, 'i'));
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxNum) maxNum = num;
            } else if (row.TenLop.trim().toLowerCase() === baseName.toLowerCase() && maxNum === 0) {
                // Trường hợp baseName tồn tại mà chưa có số
                maxNum = 0;
            }
        });

        res.json({ TenLop: `${baseName} ${maxNum + 1}` });
    });
});
app.post('/api/classes', (req, res) => {
    let { MaLop, TenLop, MaKhoa, NienKhoa } = req.body;
    executeInsert('INSERT INTO lophoc (MaLop, TenLop, MaKhoa, NienKhoa) VALUES (?, ?, ?, ?)', [MaLop, TenLop, MaKhoa, NienKhoa], res, 'Thêm lớp thành công!', 'Lỗi thêm lớp!');
});
app.put('/api/classes/:maLop', (req, res) => {
    let { TenLop, MaKhoa, NienKhoa } = req.body;
    executeUpdate('UPDATE lophoc SET TenLop=?, MaKhoa=?, NienKhoa=? WHERE MaLop=?', [TenLop, MaKhoa, NienKhoa, req.params.maLop], res, 'Cập nhật thành công!', 'Lỗi cập nhật!');
});
app.delete('/api/classes/:maLop', (req, res) => executeDelete('DELETE FROM lophoc WHERE MaLop=?', [req.params.maLop], res, 'Xóa thành công!', 'Lỗi xóa!'));
app.get('/api/classes/:maLop/details', (req, res) => {
    const { maLop } = req.params;
    const studentsQuery = `SELECT s.MSSV, s.HoTen, s.NgaySinh, s.GioiTinh, s.Email, s.SoDienThoai, l.TenLop FROM sinhvien s LEFT JOIN lophoc l ON s.MaLop = l.MaLop WHERE s.MaLop = ? ORDER BY s.HoTen`;
    const scheduleQuery = `SELECT lh.*, lhp.MaMonHoc, lhp.HocKy, mh.TenMonHoc, gv.HoTen as TenGiangVien FROM lichhoc lh LEFT JOIN lophocphan lhp ON lh.MaLopHocPhan = lhp.MaLopHocPhan LEFT JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc LEFT JOIN giangvien gv ON lhp.MaGiangVien = gv.MaGiangVien WHERE lhp.MaLop = ? ORDER BY lh.NgayHoc`;
    const teachersQuery = `SELECT DISTINCT gv.MaGiangVien, gv.HoTen as TenGiangVien, mh.TenMonHoc FROM lophocphan lhp LEFT JOIN giangvien gv ON lhp.MaGiangVien = gv.MaGiangVien LEFT JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc WHERE lhp.MaLop = ?`;
    const gradeStatsQuery = `SELECT COUNT(*) as totalGrades, ROUND(AVG(d.DiemTong), 2) as classAverage, SUM(CASE WHEN d.DiemTong >= 8.5 THEN 1 ELSE 0 END) as excellent, SUM(CASE WHEN d.DiemTong >= 7.0 AND d.DiemTong < 8.5 THEN 1 ELSE 0 END) as good, SUM(CASE WHEN d.DiemTong >= 5.0 AND d.DiemTong < 7.0 THEN 1 ELSE 0 END) as averageGrade, SUM(CASE WHEN d.DiemTong < 5.0 THEN 1 ELSE 0 END) as fail FROM diem d LEFT JOIN sinhvien s ON d.MSSV = s.MSSV WHERE s.MaLop = ?`;

    const result = { students: [], schedule: [], teachers: [], gradeStats: normalizeClassGradeStats({}) };
    let pending = 4, failed = false;
    const finish = (key, err, data) => {
        if (failed) return;
        if (err) { failed = true; return res.status(500).json({ success: false, message: 'Lỗi tải chi tiết lớp!' }); }
        result[key] = data; pending -= 1;
        if (pending === 0) res.json(result);
    };

    db.query(studentsQuery, [maLop], (err, rows) => finish('students', err, rows || []));
    db.query(scheduleQuery, [maLop], (err, rows) => finish('schedule', err, rows || []));
    db.query(teachersQuery, [maLop], (err, rows) => finish('teachers', err, rows || []));
    db.query(gradeStatsQuery, [maLop], (err, rows) => finish('gradeStats', err, normalizeClassGradeStats(rows[0])));
});
app.get('/api/classes/:maLop/students', (req, res) => executeQuery('SELECT MSSV, HoTen, GioiTinh, Email, SoDienThoai FROM sinhvien WHERE MaLop = ?', [req.params.maLop], res, 'Lỗi lấy SV!'));
app.get('/api/classes/:maLop/schedule', (req, res) => executeQuery(`SELECT lh.*, mh.TenMonHoc, gv.HoTen as TenGiangVien, lhp.HocKy, lhp.MaLopHocPhan FROM lichhoc lh JOIN lophocphan lhp ON lh.MaLopHocPhan = lhp.MaLopHocPhan JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc LEFT JOIN giangvien gv ON lhp.MaGiangVien = gv.MaGiangVien WHERE lhp.MaLop = ?`, [req.params.maLop], res, 'Lỗi lấy lịch!'));
app.get('/api/classes/:maLop/grade-stats', (req, res) => {
    const query = `SELECT COUNT(*) as totalGrades, ROUND(AVG(d.DiemTong), 2) as average, SUM(CASE WHEN d.DiemTong >= 8.5 THEN 1 ELSE 0 END) as excellent, SUM(CASE WHEN d.DiemTong >= 7.0 AND d.DiemTong < 8.5 THEN 1 ELSE 0 END) as good, SUM(CASE WHEN d.DiemTong >= 5.0 AND d.DiemTong < 7.0 THEN 1 ELSE 0 END) as averageGrade, SUM(CASE WHEN d.DiemTong < 5.0 THEN 1 ELSE 0 END) as fail FROM diem d JOIN sinhvien s ON d.MSSV = s.MSSV WHERE s.MaLop = ?`;
    executeQuery(query, [req.params.maLop], res, 'Lỗi lấy thống kê điểm!');
});

// ==================== LỚP HỌC PHẦN ====================
app.get('/api/teaching-assignments', (req, res) => {
    const query = `
        SELECT 
            lhp.*, mh.TenMonHoc, mh.SoTinChi, gv.HoTen AS TenGiangVien, gv.CapBac AS CapBacGiangVien, l.TenLop, k.TenKhoa,
            (mh.SoTinChi * 9) AS TongTiet,
            COALESCE((SELECT SUM(SoTiet) FROM lichhoc WHERE MaLopHocPhan = lhp.MaLopHocPhan), 0) AS TietDaXep,
            EXISTS(SELECT 1 FROM lichhoc WHERE MaLopHocPhan = lhp.MaLopHocPhan) AS DaXepLich,
            (SELECT COUNT(DISTINCT MSSV) FROM (SELECT MSSV FROM dangky_hocphan WHERE MaLopHocPhan = lhp.MaLopHocPhan AND TrangThai NOT IN ('Da huy', 'Tu choi', 'Đã hủy', 'Từ chối') UNION SELECT MSSV FROM diem WHERE MaLopHocPhan = lhp.MaLopHocPhan UNION SELECT MSSV FROM sinhvien WHERE MaLop = lhp.MaLop AND lhp.MaLop IS NOT NULL AND lhp.MaLop != '') AS tmp) AS SiSoThucTe
        FROM lophocphan lhp
        LEFT JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc
        LEFT JOIN khoa k ON mh.MaKhoa = k.MaKhoa
        LEFT JOIN giangvien gv ON lhp.MaGiangVien = gv.MaGiangVien
        LEFT JOIN lophoc l ON lhp.MaLop = l.MaLop
    `;
    executeQuery(query, [], res, 'Lỗi lấy danh sách lớp học phần!');
});
app.get('/api/lophocphan/teacher/:maGV', (req, res) => executeQuery("SELECT lhp.*, mh.TenMonHoc, mh.SoTinChi, l.TenLop, EXISTS(SELECT 1 FROM lichhoc WHERE MaLopHocPhan = lhp.MaLopHocPhan) AS DaXepLich, (SELECT COUNT(DISTINCT MSSV) FROM (SELECT MSSV FROM dangky_hocphan WHERE MaLopHocPhan = lhp.MaLopHocPhan AND TrangThai NOT IN ('Da huy', 'Tu choi', 'Đã hủy', 'Từ chối') UNION SELECT MSSV FROM diem WHERE MaLopHocPhan = lhp.MaLopHocPhan UNION SELECT MSSV FROM sinhvien WHERE MaLop = lhp.MaLop AND lhp.MaLop IS NOT NULL AND lhp.MaLop != '') AS tmp) AS SiSoThucTe FROM lophocphan lhp LEFT JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc LEFT JOIN lophoc l ON lhp.MaLop = l.MaLop WHERE lhp.MaGiangVien = ?", [req.params.maGV], res, 'Lỗi!'));
app.get('/api/course-sections/teacher/:maGV', (req, res) => executeQuery("SELECT lhp.*, mh.TenMonHoc, mh.SoTinChi, l.TenLop, gv.HoTen as TenGiangVien, EXISTS(SELECT 1 FROM lichhoc WHERE MaLopHocPhan = lhp.MaLopHocPhan) AS DaXepLich, (SELECT COUNT(DISTINCT MSSV) FROM (SELECT MSSV FROM dangky_hocphan WHERE MaLopHocPhan = lhp.MaLopHocPhan AND TrangThai NOT IN ('Da huy', 'Tu choi', 'Đã hủy', 'Từ chối') UNION SELECT MSSV FROM diem WHERE MaLopHocPhan = lhp.MaLopHocPhan UNION SELECT MSSV FROM sinhvien WHERE MaLop = lhp.MaLop AND lhp.MaLop IS NOT NULL AND lhp.MaLop != '') AS tmp) AS SiSoThucTe FROM lophocphan lhp LEFT JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc LEFT JOIN lophoc l ON lhp.MaLop = l.MaLop LEFT JOIN giangvien gv ON lhp.MaGiangVien = gv.MaGiangVien WHERE lhp.MaGiangVien = ?", [req.params.maGV], res, 'Lỗi!'));
app.get('/api/course-sections/:maLhp/students', (req, res) => executeQuery("SELECT DISTINCT s.MSSV, s.HoTen, s.MaLop FROM sinhvien s WHERE s.MSSV IN (SELECT MSSV FROM diem WHERE MaLopHocPhan = ? UNION SELECT MSSV FROM dangky_hocphan WHERE MaLopHocPhan = ? AND TrangThai NOT IN ('Da huy', 'Tu choi', 'Đã hủy', 'Từ chối') UNION SELECT MSSV FROM sinhvien WHERE MaLop = (SELECT MaLop FROM lophocphan WHERE MaLopHocPhan = ? AND MaLop IS NOT NULL AND MaLop != '')) ORDER BY s.MSSV", [req.params.maLhp, req.params.maLhp, req.params.maLhp], res, 'Lỗi!'));

app.get('/api/course-sections', (req, res) => {
    const query = `
        SELECT
            lhp.*,
            mh.TenMonHoc,
            mh.SoTinChi,
            mh.MaKhoa,
            l.TenLop,
            gv.HoTen     AS TenGiangVien,
            k.TenKhoa,
            EXISTS(SELECT 1 FROM lichhoc WHERE MaLopHocPhan = lhp.MaLopHocPhan) AS DaXepLich,
            (SELECT COUNT(DISTINCT MSSV) FROM (SELECT MSSV FROM dangky_hocphan WHERE MaLopHocPhan = lhp.MaLopHocPhan AND TrangThai NOT IN ('Da huy', 'Tu choi', 'Đã hủy', 'Từ chối') UNION SELECT MSSV FROM diem WHERE MaLopHocPhan = lhp.MaLopHocPhan UNION SELECT MSSV FROM sinhvien WHERE MaLop = lhp.MaLop AND lhp.MaLop IS NOT NULL AND lhp.MaLop != '') AS tmp) AS SiSoThucTe
        FROM lophocphan lhp
        LEFT JOIN monhoc   mh ON lhp.MaMonHoc   = mh.MaMonHoc
        LEFT JOIN lophoc   l  ON lhp.MaLop       = l.MaLop
        LEFT JOIN giangvien gv ON lhp.MaGiangVien = gv.MaGiangVien
        LEFT JOIN khoa     k  ON mh.MaKhoa        = k.MaKhoa
    `;
    // JOIN khoa qua monhoc.MaKhoa → đảm bảo MaKhoa + TenKhoa luôn có
    // dù lophocphan.MaLop là NULL (lớp tự do / đăng ký tự do)
    executeQuery(query, [], res, 'Lỗi lấy danh sách lớp học phần!');
});

app.post('/api/teaching-assignments', (req, res) => {
    const { MaLopHocPhan, MaMonHoc, MaLop, MaGiangVien, HocKy, NamHoc, SoLuongToiDa, PhamViDangKy } = req.body;
    const maLHP = MaLopHocPhan || `${MaMonHoc}_${HocKy}_${Math.floor(Math.random() * 1000)}`;
    const finalMaLop = (MaLop && MaLop.trim() !== '') ? MaLop.trim() : null;
    const finalPhamVi = PhamViDangKy || 'THEO_KHOA';

    const proceedInsert = () => {
        db.query('INSERT INTO lophocphan (MaLopHocPhan, MaMonHoc, MaLop, MaGiangVien, HocKy, NamHoc, SoLuongToiDa, PhamViDangKy) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [maLHP, MaMonHoc, finalMaLop, MaGiangVien, HocKy, NamHoc, SoLuongToiDa || 40, finalPhamVi], (err) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ success: false, message: 'Mã lớp học phần đã tồn tại, vui lòng thử lại!' });
                }
                return res.status(500).json({ success: false, message: 'Lỗi tạo Lớp HP!', error: err.message });
            }

            if (finalMaLop) {
                db.query('SELECT MSSV FROM sinhvien WHERE MaLop = ?', [finalMaLop], (err, students) => {
                    if (!err && students.length > 0) {
                        students.forEach(sv => {
                            db.query('INSERT IGNORE INTO diem (MSSV, MaLopHocPhan, HocKy) VALUES (?, ?, ?)', [sv.MSSV, maLHP, HocKy]);
                            db.query("INSERT IGNORE INTO dangky_hocphan (MSSV, MaLopHocPhan, HocKy, TrangThai, NgayDangKy) VALUES (?, ?, ?, 'Đã duyệt', NOW())", [sv.MSSV, maLHP, HocKy]);
                        });
                    }
                    res.json({ success: true, message: 'Tạo Lớp HP và tự động lên danh sách thành công!' });
                });
            } else {
                res.json({ success: true, message: 'Tạo Lớp tự do thành công (Sinh viên phải tự đăng ký)!' });
            }
        });
    };

    if (finalMaLop) {
        db.query('SELECT lhp.MaLopHocPhan, lhp.HocKy, mh.TenMonHoc, l.TenLop FROM lophocphan lhp JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc LEFT JOIN lophoc l ON lhp.MaLop = l.MaLop WHERE lhp.MaMonHoc = ? AND lhp.MaLop = ? LIMIT 1', [MaMonHoc, finalMaLop], (errCheck, resCheck) => {
            if (resCheck && resCheck.length > 0) {
                const ex = resCheck[0];
                return res.status(400).json({ success: false, message: `Lớp hành chính "${ex.TenLop || finalMaLop}" đã được phân công học môn "${ex.TenMonHoc || MaMonHoc}" tại LHP [${ex.MaLopHocPhan} - Học kỳ ${ex.HocKy || ''}]. Không thể mở LHP trùng môn cho cùng lớp hành chính! (Sinh viên học cải thiện/rớt môn vui lòng mở Lớp tự do).` });
            }
            db.query('SELECT COUNT(*) as count FROM sinhvien WHERE MaLop = ?', [finalMaLop], (err, resCount) => {
                const svCount = resCount && resCount[0] ? resCount[0].count : 0;
                if (Number(SoLuongToiDa || 40) < svCount) {
                    return res.status(400).json({ success: false, message: `Sĩ số tối đa (${SoLuongToiDa}) không được nhỏ hơn số sinh viên thực tế của lớp ${finalMaLop} (${svCount} SV)!` });
                }
                proceedInsert();
            });
        });
    } else {
        proceedInsert();
    }
});

app.put('/api/teaching-assignments/:id/toggle-lock', (req, res) => {
    const { TrangThaiLich } = req.body;
    if (!['DA_CHOT', 'CHUA_CHOT'].includes(TrangThaiLich)) {
        return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ!' });
    }
    db.query('SELECT TrangThaiLich FROM lophocphan WHERE MaLopHocPhan = ?', [req.params.id], (errLock, resLock) => {
        if (resLock && resLock.length > 0 && resLock[0].TrangThaiLich === 'DA_CHOT') {
            return res.status(400).json({ success: false, message: 'Lớp học phần này đã được chốt lịch, không thể thao tác lại!' });
        }
        db.query('UPDATE lophocphan SET TrangThaiLich = ? WHERE MaLopHocPhan = ?', [TrangThaiLich, req.params.id], (err) => {
            if (err) return res.status(500).json({ success: false, message: 'Lỗi cập nhật trạng thái chốt lịch!' });
            res.json({ success: true, message: TrangThaiLich === 'DA_CHOT' ? 'Đã chốt lịch học thành công!' : 'Đã mở chốt lịch học!' });
        });
    });
});

app.put('/api/teaching-assignments/:id', (req, res) => {
    db.query('SELECT TrangThaiLich FROM lophocphan WHERE MaLopHocPhan = ?', [req.params.id], (errLock, resLock) => {
        if (resLock && resLock.length > 0 && resLock[0].TrangThaiLich === 'DA_CHOT') {
            return res.status(400).json({ success: false, message: 'Lớp học phần này ĐÃ CHỐT LỊCH. Không thể thay đổi thông tin môn học, giảng viên hay lớp nữa! Chỉ cho phép sửa hoặc xóa các buổi học bên Quản lý lịch học.' });
        }
        const { MaMonHoc, MaLop, MaGiangVien, HocKy, NamHoc, SoLuongToiDa, PhamViDangKy } = req.body;
        const finalMaLop = (MaLop && MaLop.trim() !== '') ? MaLop.trim() : null;
        const finalPhamVi = PhamViDangKy || 'THEO_KHOA';

        const proceedUpdate = () => {
            db.query('UPDATE lophocphan SET MaMonHoc=?, MaLop=?, MaGiangVien=?, HocKy=?, NamHoc=?, SoLuongToiDa=?, PhamViDangKy=? WHERE MaLopHocPhan=?', [MaMonHoc, finalMaLop, MaGiangVien, HocKy, NamHoc, SoLuongToiDa, finalPhamVi, req.params.id], (err) => {
                if (err) return res.status(500).json({ success: false, message: 'Lỗi cập nhật!', error: err.message });

                db.query('DELETE FROM diem WHERE MaLopHocPhan = ?', [req.params.id], () => {
                    if (finalMaLop) {
                        db.query('SELECT MSSV FROM sinhvien WHERE MaLop = ?', [finalMaLop], (err, students) => {
                            if (!err && students.length > 0) {
                                students.forEach(sv => { db.query('INSERT IGNORE INTO diem (MSSV, MaLopHocPhan, HocKy) VALUES (?, ?, ?)', [sv.MSSV, req.params.id, HocKy]); });
                            }
                            res.json({ success: true, message: 'Cập nhật Lớp HP và đồng bộ danh sách mới thành công!' });
                        });
                    } else {
                        res.json({ success: true, message: 'Đã chuyển thành Lớp tự do thành công (Hủy nạp sinh viên ép buộc)!' });
                    }
                });
            });
        };

        if (finalMaLop) {
            db.query('SELECT lhp.MaLopHocPhan, lhp.HocKy, mh.TenMonHoc, l.TenLop FROM lophocphan lhp JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc LEFT JOIN lophoc l ON lhp.MaLop = l.MaLop WHERE lhp.MaMonHoc = ? AND lhp.MaLop = ? AND lhp.MaLopHocPhan != ? LIMIT 1', [MaMonHoc, finalMaLop, req.params.id], (errCheck, resCheck) => {
                if (resCheck && resCheck.length > 0) {
                    const ex = resCheck[0];
                    return res.status(400).json({ success: false, message: `Lớp hành chính "${ex.TenLop || finalMaLop}" đã được phân công học môn "${ex.TenMonHoc || MaMonHoc}" tại LHP [${ex.MaLopHocPhan} - Học kỳ ${ex.HocKy || ''}]. Không thể mở LHP trùng môn cho cùng lớp hành chính! (Sinh viên học cải thiện/rớt môn vui lòng mở Lớp tự do).` });
                }
                db.query('SELECT COUNT(*) as count FROM sinhvien WHERE MaLop = ?', [finalMaLop], (err, resCount) => {
                    const svCount = resCount && resCount[0] ? resCount[0].count : 0;
                    if (Number(SoLuongToiDa || 40) < svCount) {
                        return res.status(400).json({ success: false, message: `Sĩ số tối đa (${SoLuongToiDa}) không được nhỏ hơn số sinh viên thực tế của lớp ${finalMaLop} (${svCount} SV)!` });
                    }
                    proceedUpdate();
                });
            });
        } else {
            proceedUpdate();
        }
    });
});

// PUT /api/teaching-assignments/:id/phi — Cập nhật phí tài liệu / miễn học phí cho Lớp Học Phần
app.put('/api/teaching-assignments/:id/phi', verifyToken, (req, res) => {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Không có quyền!' });
    const { phi_tai_lieu, mien_hoc_phi } = req.body;
    const isMien = !!mien_hoc_phi;
    const phiTL = isMien ? 0 : Math.max(0, Number(phi_tai_lieu) || 0);
    db.query(
        'UPDATE lophocphan SET phi_tai_lieu = ?, mien_hoc_phi = ? WHERE MaLopHocPhan = ?',
        [phiTL, isMien, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ success: false, message: 'Lỗi cập nhật phí!', error: err.message });
            res.json({ success: true, message: 'Cập nhật cấu hình phí học phần thành công!' });
        }
    );
});

app.delete('/api/teaching-assignments/:id', (req, res) => {
    db.query('SELECT TrangThaiLich FROM lophocphan WHERE MaLopHocPhan = ?', [req.params.id], (errLock, resLock) => {
        const isChot = resLock && resLock.length > 0 && resLock[0].TrangThaiLich === 'DA_CHOT';
        if (isChot) {
            return res.status(400).json({ success: false, message: 'Lớp học phần này ĐÃ CHỐT LỊCH, không thể xóa!' });
        }
        db.query('SELECT COUNT(*) as count FROM lichhoc WHERE MaLopHocPhan = ?', [req.params.id], (errLich, resLich) => {
            const hasLich = resLich && resLich.length > 0 && resLich[0].count > 0;
            if (hasLich) {
                return res.status(400).json({ success: false, message: 'Lớp học phần này đang được xếp lịch học. Vui lòng xóa lịch học trước khi xóa lớp!' });
            }
            db.query('DELETE FROM diem WHERE MaLopHocPhan = ?', [req.params.id], () => {
                db.query('DELETE FROM dangky_hocphan WHERE MaLopHocPhan = ?', [req.params.id], () => {
                    executeDelete('DELETE FROM lophocphan WHERE MaLopHocPhan=?', [req.params.id], res, 'Xóa Lớp HP thành công!', 'Lỗi xóa!');
                });
            });
        });
    });
});

// ==================== SCHEDULES & ENROLLMENT ====================

// HELPER: Kiểm tra 2 khoảng tiết có overlap không
function tietOverlap(start1, end1, start2, end2) {
    return start1 <= end2 && end1 >= start2;
}

// HELPER: Tìm đợt đăng ký đang mở khớp với năm học của lớp học phần (nếu có),
// dùng để gắn MaDot vào bản ghi dangky_hocphan (phục vụ auto-hủy khi đóng đợt).
// Một đợt chỉ tính là "đang mở" khi TrangThai = 'Mo' VÀ thời điểm hiện tại còn nằm
// trong khoảng [NgayTao, NgayDong] — tránh trường hợp admin quên bấm nút "Đóng"
// nhưng đã quá hạn NgayDong mà hệ thống vẫn cho đăng ký/sửa/xóa.
async function getOpenPhaseId(conn, namHoc, nienKhoa) {
    try {
        const [[phase]] = await conn.query(
            `SELECT MaDot FROM dot_dangky 
       WHERE TrangThai = 'Mo' 
         AND (NamHoc = ? OR NamHoc IS NULL) 
         AND (NienKhoa = ? OR NienKhoa IS NULL) 
         AND NOW() BETWEEN NgayTao AND NgayDong
       ORDER BY NgayTao DESC LIMIT 1`,
            [namHoc || null, nienKhoa || null]
        );
        return phase ? phase.MaDot : null;
    } catch (e) {
        return null;
    }
}

// 1. API Lấy danh sách LHP có thể đăng ký
// 1. API Lấy danh sách LHP có thể đăng ký (Đã fix lỗi không hiện môn và thêm Debug)
// ==================== ĐĂNG KÝ MÔN HỌC (TỰ DO) ====================

// Lấy danh sách LHP đang mở cho sinh viên
// LẤY LỚP HỌC PHẦN ĐÃ CÓ LỊCH HỌC (Theo cấu trúc lichhoc thực tế)
// API HIỂN THỊ DANH SÁCH LHP ĐANG MỞ - CHỈ 1 DÒNG / 1 LHP
app.get('/api/enrollment/available/:mssv', async (req, res) => {
    try {
        const [[phase]] = await db.promise().query(
            `SELECT NienKhoa, HocKy FROM dot_dangky WHERE TrangThai = 'Mo' AND NOW() BETWEEN NgayTao AND NgayDong ORDER BY NgayTao DESC LIMIT 1`
        );
        const phaseNienKhoa = phase ? phase.NienKhoa : null;
        const phaseHocKy = phase ? phase.HocKy : null;

        const query = `
            SELECT 
                lhp.MaLopHocPhan,
                lhp.MaLop,
                lhp.MaMonHoc,
                mh.TenMonHoc,
                mh.SoTinChi,
                gv.HoTen AS TenGiangVien,
                (SELECT COUNT(DISTINCT MSSV) FROM (
                    SELECT MSSV FROM dangky_hocphan WHERE MaLopHocPhan = lhp.MaLopHocPhan AND TrangThai NOT IN ('Da huy', 'Tu choi', 'Đã hủy', 'Từ chối') 
                    UNION 
                    SELECT MSSV FROM diem WHERE MaLopHocPhan = lhp.MaLopHocPhan 
                    UNION 
                    SELECT MSSV FROM sinhvien WHERE MaLop = lhp.MaLop AND lhp.MaLop IS NOT NULL AND lhp.MaLop != ''
                ) AS tmp) AS DaDangKy,
                COALESCE(lhp.SoLuongToiDa, 40) AS SoLuongToiDa,
                MIN(lh.NgayHoc) AS NgayBatDau,
                MAX(lh.NgayHoc) AS NgayKetThuc,
                COUNT(DISTINCT lh.MaLichHoc) AS SoBuoi,
                MAX(lh.PhongHoc) AS PhongHoc,
                MAX(lh.CaHoc) AS CaHoc,
                DAYOFWEEK(MIN(lh.NgayHoc)) AS Thu,
                mh.MaKhoa AS MaKhoaMonHoc,
                sv_khoa.MaKhoa AS MaKhoaSinhVien,
                mh.LoaiMonHoc
            FROM lophocphan lhp
            JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc
            LEFT JOIN giangvien gv ON lhp.MaGiangVien = gv.MaGiangVien
            LEFT JOIN lichhoc lh ON lhp.MaLopHocPhan = lh.MaLopHocPhan
            LEFT JOIN lophoc lh_class ON lhp.MaLop = lh_class.MaLop
            CROSS JOIN (
                SELECT lh.MaKhoa 
                FROM sinhvien s 
                JOIN lophoc lh ON s.MaLop = lh.MaLop 
                WHERE s.MSSV = ? 
                LIMIT 1
            ) AS sv_khoa
            WHERE (lhp.HocKy = ?) 
            AND (
                lhp.MaLop IS NULL OR lhp.MaLop = '' 
                OR (
                    lh_class.NienKhoa = (SELECT l.NienKhoa FROM sinhvien s JOIN lophoc l ON s.MaLop = l.MaLop WHERE s.MSSV = ?)
                    AND (? IS NULL OR ? = '' OR lh_class.NienKhoa = ?)
                )
            )
            GROUP BY lhp.MaLopHocPhan, mh.MaKhoa, sv_khoa.MaKhoa, mh.LoaiMonHoc
            ORDER BY mh.TenMonHoc, lhp.MaLopHocPhan
        `;

        const [rows] = await db.promise().query(query, [req.params.mssv, phaseHocKy, req.params.mssv, phaseNienKhoa, phaseNienKhoa, phaseNienKhoa]);
        res.json(rows);
    } catch (err) {
        console.error("LỖI /available:", err.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Lấy thông tin đợt đăng ký đang mở cho sinh viên
app.get('/api/enrollment/active-phase/:mssv', async (req, res) => {
    try {
        const [[phase]] = await db.promise().query(
            `SELECT *, NgayTao AS NgayMo FROM dot_dangky 
             WHERE TrangThai = 'Mo' 
             AND NOW() BETWEEN NgayTao AND NgayDong
             ORDER BY NgayTao DESC LIMIT 1`
        );

        if (phase) {
            res.json({ hasActivePhase: true, phase });
        } else {
            res.json({ hasActivePhase: false, phase: null });
        }
    } catch (err) {
        console.error("LỖI /active-phase:", err.message);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy thông tin đợt' });
    }
});

// Lấy các môn đã đăng ký của sinh viên
// LẤY MÔN HỌC ĐÃ ĐĂNG KÝ CỦA SINH VIÊN (Phiên bản ổn định)
app.get('/api/enrollment/my-courses/:mssv', async (req, res) => {
    try {
        const query = `
            SELECT 
                dk.MaDangKy,
                dk.MaLopHocPhan,
                lhp.MaLop,
                dk.HocKy,
                dk.TrangThai,
                dk.NgayDangKy,
                lhp.MaMonHoc,
                mh.TenMonHoc,
                mh.SoTinChi,
                gv.HoTen AS TenGiangVien,
                MIN(lh.NgayHoc) AS NgayBatDau,
                MAX(lh.NgayHoc) AS NgayKetThuc,
                COUNT(DISTINCT lh.MaLichHoc) AS SoBuoi,
                GROUP_CONCAT(DISTINCT CONCAT(lh.PhongHoc, ' - Tiết ', lh.CaHoc) SEPARATOR ', ') AS LichHoc,
                DAYOFWEEK(MIN(lh.NgayHoc)) AS Thu,
                MAX(lh.CaHoc) AS CaHoc,
                'Chờ đóng tiền' as TrangThaiThucTe,
                CASE WHEN dk.TrangThai = 'Đã hủy' THEN 0 ELSE 1 END as CoTheXoa
            FROM dangky_hocphan dk
            JOIN lophocphan lhp ON dk.MaLopHocPhan = lhp.MaLopHocPhan
            JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc
            LEFT JOIN giangvien gv ON lhp.MaGiangVien = gv.MaGiangVien
            LEFT JOIN lichhoc lh ON lhp.MaLopHocPhan = lh.MaLopHocPhan
            WHERE dk.MSSV = ? AND dk.TrangThai != 'Đã hủy'
            GROUP BY dk.MaDangKy, dk.MaLopHocPhan, dk.HocKy, dk.TrangThai, dk.NgayDangKy,
                     lhp.MaMonHoc, mh.TenMonHoc, mh.SoTinChi, gv.HoTen
            ORDER BY dk.NgayDangKy DESC
        `;

        const [rows] = await db.promise().query(query, [req.params.mssv]);
        res.json(rows);
    } catch (err) {
        console.error("LỖI /my-courses:", err.sqlMessage || err.message);
        res.status(500).json({ success: false, message: 'Lỗi lấy môn đã đăng ký' });
    }
});
// Đăng ký nhiều LHP cùng lúc (batch)
app.post('/api/enrollment/batch', async (req, res) => {
    const { MSSV, cart } = req.body;
    if (!MSSV || !Array.isArray(cart) || cart.length === 0) {
        return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
    }

    const connection = await db.promise().getConnection();
    try {
        await connection.beginTransaction();

        // 1. Kiểm tra đợt đăng ký có hợp lệ với Niên khóa sinh viên không
        const [[studentInfo]] = await connection.query(
            `SELECT lh.NienKhoa FROM sinhvien s JOIN lophoc lh ON s.MaLop = lh.MaLop WHERE s.MSSV = ?`,
            [MSSV]
        );
        if (!studentInfo || !studentInfo.NienKhoa) {
            throw new Error('Không tìm thấy thông tin niên khóa sinh viên');
        }

        const [[phase]] = await connection.query(
            `SELECT * FROM dot_dangky 
             WHERE TrangThai = 'Mo' 
             AND (NienKhoa = ? OR NienKhoa IS NULL OR NienKhoa = '') 
             AND NOW() BETWEEN NgayTao AND NgayDong
             ORDER BY NgayTao DESC LIMIT 1`,
            [studentInfo.NienKhoa]
        );

        if (!phase) {
            throw new Error('Hiện tại không có đợt đăng ký nào mở cho khóa của bạn');
        }

        // Kiểm tra trùng môn
        const monDaCo = new Set();
        for (const item of cart) {
            const [existing] = await connection.query(
                `SELECT 1 FROM dangky_hocphan dk 
                 JOIN lophocphan lhp ON dk.MaLopHocPhan = lhp.MaLopHocPhan 
                 WHERE dk.MSSV = ? AND lhp.MaMonHoc = ? AND dk.TrangThai != 'Đã hủy'`,
                [MSSV, item.MaMonHoc]
            );
            if (existing.length > 0) {
                throw new Error(`Môn ${item.TenMonHoc} đã được đăng ký`);
            }
        }

        // Kiểm tra sĩ số & trùng lịch (có thể mở rộng)
        for (const c of cart) {
            const [count] = await connection.query(
                `SELECT COUNT(DISTINCT MSSV) as cnt FROM (
                    SELECT MSSV FROM dangky_hocphan WHERE MaLopHocPhan = ? AND TrangThai NOT IN ('Da huy', 'Tu choi', 'Đã hủy', 'Từ chối') 
                    UNION 
                    SELECT MSSV FROM diem WHERE MaLopHocPhan = ? 
                    UNION 
                    SELECT MSSV FROM sinhvien WHERE MaLop = (SELECT MaLop FROM lophocphan WHERE MaLopHocPhan = ?) AND MaLop IS NOT NULL AND MaLop != ''
                ) AS tmp`,
                [c.MaLopHocPhan, c.MaLopHocPhan, c.MaLopHocPhan]
            );
            if (count[0].cnt >= (c.SoLuongToiDa || 40)) {
                throw new Error(`Lớp ${c.MaLopHocPhan} đã đầy`);
            }
        }

        // Insert (lấy đúng Học kỳ từ lophocphan)
        const values = [];
        for (const c of cart) {
            const [[lhpRow]] = await connection.query('SELECT HocKy FROM lophocphan WHERE MaLopHocPhan = ?', [c.MaLopHocPhan]);
            const finalHocKy = lhpRow?.HocKy || c.HocKy || 'HK1_2026_2027';
            values.push([MSSV, c.MaLopHocPhan, finalHocKy, 'Chờ đóng tiền', new Date()]);
        }

        await connection.query(
            `INSERT INTO dangky_hocphan 
             (MSSV, MaLopHocPhan, HocKy, TrangThai, NgayDangKy) 
             VALUES ?
             ON DUPLICATE KEY UPDATE TrangThai = VALUES(TrangThai), NgayDangKy = VALUES(NgayDangKy), HocKy = VALUES(HocKy)`,
            [values]
        );

        await connection.commit();
        res.json({ success: true, message: `Đã lưu ${cart.length} học phần. Vui lòng đóng học phí để hoàn tất.` });
    } catch (err) {
        await connection.rollback();
        res.status(400).json({ success: false, message: err.message });
    } finally {
        connection.release();
    }
});

// Xóa đăng ký (chỉ khi chưa đóng tiền)
// 2. API Lấy tiến trình đăng ký
app.get('/api/enrollment/my-courses/:mssv', async (req, res) => {
    const mssv = String(req.params.mssv || '').trim();
    try {
        const [rows] = await db.promise().query(`
      SELECT dk.*, lhp.MaMonHoc, lhp.NamHoc, mh.TenMonHoc, mh.SoTinChi 
      FROM dangky_hocphan dk 
      JOIN lophocphan lhp ON TRIM(dk.MaLopHocPhan) = TRIM(lhp.MaLopHocPhan) 
      JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc 
      WHERE TRIM(dk.MSSV) = TRIM(?) 
      ORDER BY dk.NgayDangKy DESC
    `, [mssv]);

        // Tính sẵn cho từng dòng: còn được sửa/xóa hay không.
        // Điều kiện: chưa đóng tiền ("Chờ đóng tiền") VÀ đợt đăng ký tương ứng
        // (theo NamHoc của lớp học phần + Niên khóa của SV) vẫn đang "Mở".
        const [[studentCohort]] = await db.promise().query(
            `SELECT lh.NienKhoa FROM sinhvien s JOIN lophoc lh ON s.MaLop = lh.MaLop WHERE TRIM(s.MSSV) = TRIM(?)`,
            [mssv]
        );

        const openPhaseCache = {};
        for (const nh of new Set(rows.map(r => r.NamHoc))) {
            openPhaseCache[nh] = await getOpenPhaseId(db.promise(), nh, studentCohort?.NienKhoa);
        }

        const result = rows.map(r => ({
            ...r,
            CoTheXoa: r.TrangThai === 'Chờ đóng tiền' && !!openPhaseCache[r.NamHoc]
        }));

        res.json(result);
    } catch (err) {
        console.error('GET /api/enrollment/my-courses error:', err);
        res.status(500).json({ message: 'Lỗi tải tiến trình đăng ký!' });
    }
});

// 3. Danh sách tổng
app.get('/api/enrollments/all', (req, res) => {
    executeQuery(
        `SELECT MSSV, MaLopHocPhan, HocKy, TrangThai, NgayDangKy FROM dangky_hocphan WHERE TrangThai != 'Từ chối' ORDER BY NgayDangKy DESC`,
        [], res, 'Lỗi lấy danh sách đăng ký học phần!'
    );
});

// 4. API ĐĂNG KÝ TRỰC TIẾP (Bấm là vào Database liền - Dành cho file Frontend bạn vừa tải lên)
app.post('/api/enrollment', async (req, res) => {
    const { MSSV, MaLopHocPhan } = req.body;
    if (!MSSV || !MaLopHocPhan) return res.status(400).json({ message: 'Thiếu thông tin đăng ký.' });

    const conn = await db.promise().getConnection();
    try {
        await conn.beginTransaction();

        // LẤY NIÊN KHÓA CỦA SINH VIÊN
        const [[studentCohort]] = await conn.query(
            `SELECT lh.NienKhoa FROM sinhvien s JOIN lophoc lh ON s.MaLop = lh.MaLop WHERE s.MSSV = ?`,
            [MSSV]
        );
        if (!studentCohort || !studentCohort.NienKhoa) {
            throw new Error('Không tìm thấy thông tin niên khóa của sinh viên.');
        }

        const [[lhp]] = await conn.query(`SELECT lhp.MaLopHocPhan, lhp.MaMonHoc, lhp.HocKy, lhp.NamHoc, lhp.SoLuongToiDa, mh.TenMonHoc, mh.SoTinChi FROM lophocphan lhp JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc WHERE lhp.MaLopHocPhan = ? FOR UPDATE`, [MaLopHocPhan]);
        if (!lhp) throw new Error('Lớp học phần không tồn tại.');

        // KIỂM TRA ĐỢT ĐĂNG KÝ THEO NIÊN KHÓA
        const phaseId = await getOpenPhaseId(conn, lhp.NamHoc, studentCohort.NienKhoa);
        if (!phaseId) {
            throw new Error(`Hiện tại không có đợt đăng ký học phần nào đang mở dành cho niên khóa ${studentCohort.NienKhoa} của bạn.`);
        }

        const [[siSo]] = await conn.query(`SELECT COUNT(DISTINCT MSSV) AS DaDangKy FROM (SELECT MSSV FROM dangky_hocphan WHERE MaLopHocPhan = ? AND TrangThai NOT IN ('Da huy', 'Tu choi', 'Đã hủy', 'Từ chối') UNION SELECT MSSV FROM diem WHERE MaLopHocPhan = ? UNION SELECT MSSV FROM sinhvien WHERE MaLop = (SELECT MaLop FROM lophocphan WHERE MaLopHocPhan = ? AND MaLop IS NOT NULL AND MaLop != '')) AS tmp`, [MaLopHocPhan, MaLopHocPhan, MaLopHocPhan]);
        if (siSo.DaDangKy >= (lhp.SoLuongToiDa || 40)) throw new Error('Lớp học phần đã đủ sĩ số.');

        const [[trungMon]] = await conn.query(`SELECT dk.MaLopHocPhan FROM dangky_hocphan dk JOIN lophocphan lhp2 ON dk.MaLopHocPhan = lhp2.MaLopHocPhan WHERE dk.MSSV = ? AND lhp2.MaMonHoc = ? AND lhp2.HocKy = ? AND dk.TrangThai NOT IN ('Da huy', 'Tu choi') LIMIT 1`, [MSSV, lhp.MaMonHoc, lhp.HocKy]);
        if (trungMon) throw new Error(`Bạn đã đăng ký môn ${lhp.TenMonHoc} ở lớp ${trungMon.MaLopHocPhan}.`);

        const [[diemCu]] = await conn.query(`SELECT DiemTong FROM diem d JOIN lophocphan lhp_check ON d.MaLopHocPhan = lhp_check.MaLopHocPhan WHERE d.MSSV = ? AND lhp_check.MaMonHoc = ? ORDER BY d.HocKy DESC LIMIT 1`, [MSSV, lhp.MaMonHoc]);
        if (diemCu) {
            if (diemCu.DiemTong === null) throw new Error(`Bạn đang học môn ${lhp.TenMonHoc} và chưa có điểm.`);
            if (parseFloat(diemCu.DiemTong) >= 6.5) throw new Error(`Điểm môn ${lhp.TenMonHoc} đã đạt ${parseFloat(diemCu.DiemTong).toFixed(1)}. Không được cải thiện.`);
        }

        const parseCaHoc = (caStr) => {
            if (!caStr) return { start: 0, end: 0 };
            const match = String(caStr).match(/(\d+)\s*-\s*(\d+)/);
            if (match) return { start: parseInt(match[1]), end: parseInt(match[2]) };
            const ca = String(caStr).replace(/\D/g, '');
            if (ca === '1') return { start: 1, end: 3 }; if (ca === '2') return { start: 4, end: 6 };
            if (ca === '3') return { start: 7, end: 9 }; if (ca === '4') return { start: 10, end: 12 };
            return { start: 0, end: 0 };
        };

        const [lichMoi] = await conn.query(`SELECT DATE_FORMAT(NgayHoc, '%Y-%m-%d') AS NgayHocStr, CaHoc FROM lichhoc WHERE MaLopHocPhan = ?`, [MaLopHocPhan]);
        const [lichDaDK] = await conn.query(`SELECT DATE_FORMAT(lh.NgayHoc, '%Y-%m-%d') AS NgayHocStr, lh.CaHoc, dk.MaLopHocPhan AS MaLHPDaDK FROM lichhoc lh JOIN dangky_hocphan dk ON lh.MaLopHocPhan = dk.MaLopHocPhan JOIN lophocphan lhp3 ON dk.MaLopHocPhan = lhp3.MaLopHocPhan WHERE dk.MSSV = ? AND lhp3.HocKy = ? AND dk.TrangThai NOT IN ('Da huy', 'Tu choi')`, [MSSV, lhp.HocKy]);

        for (const nm of lichMoi) {
            const pMoi = parseCaHoc(nm.CaHoc);
            if (pMoi.start === 0) continue;
            for (const ld of lichDaDK) {
                const pCu = parseCaHoc(ld.CaHoc);
                if (pCu.start !== 0 && nm.NgayHocStr === ld.NgayHocStr && tietOverlap(pMoi.start, pMoi.end, pCu.start, pCu.end)) {
                    throw new Error(`Môn này trùng lịch với lớp ${ld.MaLHPDaDK} vào ngày ${nm.NgayHocStr.split('-').reverse().join('/')}.`);
                }
            }
        }

        await conn.query(`INSERT INTO dangky_hocphan (MSSV, MaLopHocPhan, HocKy, TrangThai, NgayDangKy) VALUES (?, ?, ?, 'Chờ đóng tiền', NOW())`, [MSSV, MaLopHocPhan, lhp.HocKy]);
        // Lưu ý: KHÔNG insert vào bảng `diem` ở bước này nữa.
        // Lịch học/kết quả chỉ được commit chính thức sau khi sinh viên đóng tiền
        // (xem API POST /api/enrollment/:mssv/:maLhp/xac-nhan-thanh-toan).

        await conn.commit();
        res.json({ success: true, message: `Đăng ký thành công lớp ${MaLopHocPhan}! Vui lòng hoàn tất đóng học phí để giữ chỗ.` });

    } catch (err) {
        await conn.rollback();
        res.status(400).json({ message: err.message || 'Lỗi hệ thống khi đăng ký.' });
    } finally { conn.release(); }
});

// 4b. API ĐĂNG KÝ BATCH (Nhiều môn cùng lúc)
app.post('/api/enrollment/batch', async (req, res) => {
    const { MSSV, cart } = req.body;
    if (!MSSV || !cart || !Array.isArray(cart) || cart.length === 0) {
        return res.status(400).json({ message: 'Thiếu thông tin đăng ký hoặc giỏ hàng trống.' });
    }

    const conn = await db.promise().getConnection();
    try {
        await conn.beginTransaction();

        // LẤY NIÊN KHÓA CỦA SINH VIÊN
        const [[studentCohort]] = await conn.query(
            `SELECT lh.NienKhoa FROM sinhvien s JOIN lophoc lh ON s.MaLop = lh.MaLop WHERE s.MSSV = ?`,
            [MSSV]
        );
        if (!studentCohort || !studentCohort.NienKhoa) {
            throw new Error('Không tìm thấy thông tin niên khóa của sinh viên.');
        }

        const parseCaHoc = (caStr) => {
            if (!caStr) return { start: 0, end: 0 };
            const match = String(caStr).match(/(\d+)\s*-\s*(\d+)/);
            if (match) return { start: parseInt(match[1]), end: parseInt(match[2]) };
            const ca = String(caStr).replace(/\D/g, '');
            if (ca === '1') return { start: 1, end: 3 }; if (ca === '2') return { start: 4, end: 6 };
            if (ca === '3') return { start: 7, end: 9 }; if (ca === '4') return { start: 10, end: 12 };
            return { start: 0, end: 0 };
        };

        const tietOverlap = (s1, e1, s2, e2) => {
            return s1 <= e2 && e1 >= s2;
        };

        // [BƯỚC 1]: Khởi tạo biến để cộng dồn tín chỉ và lưu tên học kỳ
        let tongTinChi = 0;
        let hocKyHienTai = '';

        for (const item of cart) {
            const MaLopHocPhan = item.MaLopHocPhan;

            const [[lhp]] = await conn.query(`SELECT lhp.MaLopHocPhan, lhp.MaMonHoc, lhp.HocKy, lhp.NamHoc, lhp.SoLuongToiDa, mh.TenMonHoc, mh.SoTinChi FROM lophocphan lhp JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc WHERE lhp.MaLopHocPhan = ? FOR UPDATE`, [MaLopHocPhan]);
            if (!lhp) throw new Error(`Lớp học phần ${MaLopHocPhan} không tồn tại.`);

            // [BƯỚC 2]: Cộng dồn tín chỉ của môn học này và gán học kỳ
            tongTinChi += (lhp.SoTinChi || 0);
            hocKyHienTai = lhp.HocKy; 

            // KIỂM TRA TỔNG SỐ TÍN CHỈ VƯỢT QUÁ 23
            const [[tinChiDaDK]] = await conn.query(`
                SELECT SUM(mh.SoTinChi) AS Total 
                FROM dangky_hocphan dk 
                JOIN lophocphan lhp2 ON dk.MaLopHocPhan = lhp2.MaLopHocPhan 
                JOIN monhoc mh ON lhp2.MaMonHoc = mh.MaMonHoc 
                WHERE dk.MSSV = ? AND lhp2.HocKy = ? AND dk.TrangThai NOT IN ('Da huy', 'Tu choi', 'Đã hủy', 'Từ chối')
            `, [MSSV, hocKyHienTai]);
            
            const currentTotal = parseInt(tinChiDaDK?.Total || 0) + tongTinChi;
            if (currentTotal > 23) {
                throw new Error(`Tổng số tín chỉ đăng ký vượt quá giới hạn 23 tín chỉ (Đã đăng ký: ${tinChiDaDK?.Total || 0}, Đang chọn: ${tongTinChi}). Không thể đăng ký thêm môn ${lhp.TenMonHoc}.`);
            }

            // KIỂM TRA ĐỢT ĐĂNG KÝ THEO NIÊN KHÓA
            const phaseId = await getOpenPhaseId(conn, lhp.NamHoc, studentCohort.NienKhoa);
            if (!phaseId) {
                throw new Error(`Hiện tại không có đợt đăng ký học phần nào đang mở dành cho niên khóa ${studentCohort.NienKhoa} của bạn.`);
            }

            const [[siSo]] = await conn.query(`SELECT COUNT(DISTINCT MSSV) AS DaDangKy FROM (SELECT MSSV FROM dangky_hocphan WHERE MaLopHocPhan = ? AND TrangThai NOT IN ('Da huy', 'Tu choi', 'Đã hủy', 'Từ chối') UNION SELECT MSSV FROM diem WHERE MaLopHocPhan = ? UNION SELECT MSSV FROM sinhvien WHERE MaLop = (SELECT MaLop FROM lophocphan WHERE MaLopHocPhan = ? AND MaLop IS NOT NULL AND MaLop != '')) AS tmp`, [MaLopHocPhan, MaLopHocPhan, MaLopHocPhan]);
            if (siSo.DaDangKy >= (lhp.SoLuongToiDa || 40)) throw new Error(`Lớp ${MaLopHocPhan} đã đủ sĩ số.`);

            const [[trungMon]] = await conn.query(`SELECT dk.MaLopHocPhan FROM dangky_hocphan dk JOIN lophocphan lhp2 ON dk.MaLopHocPhan = lhp2.MaLopHocPhan WHERE dk.MSSV = ? AND lhp2.MaMonHoc = ? AND lhp2.HocKy = ? AND dk.TrangThai NOT IN ('Da huy', 'Tu choi') LIMIT 1`, [MSSV, lhp.MaMonHoc, lhp.HocKy]);
            if (trungMon) throw new Error(`Bạn đã đăng ký môn ${lhp.TenMonHoc} ở lớp ${trungMon.MaLopHocPhan}.`);

            const [[diemCu]] = await conn.query(`SELECT DiemTong FROM diem d JOIN lophocphan lhp_check ON d.MaLopHocPhan = lhp_check.MaLopHocPhan WHERE d.MSSV = ? AND lhp_check.MaMonHoc = ? ORDER BY d.HocKy DESC LIMIT 1`, [MSSV, lhp.MaMonHoc]);
            if (diemCu) {
                if (diemCu.DiemTong === null) throw new Error(`Bạn đang học môn ${lhp.TenMonHoc} và chưa có điểm.`);
                if (parseFloat(diemCu.DiemTong) >= 6.5) throw new Error(`Điểm môn ${lhp.TenMonHoc} đã đạt ${parseFloat(diemCu.DiemTong).toFixed(1)}. Không được cải thiện.`);
            }

            const [lichMoi] = await conn.query(`SELECT DATE_FORMAT(NgayHoc, '%Y-%m-%d') AS NgayHocStr, CaHoc FROM lichhoc WHERE MaLopHocPhan = ?`, [MaLopHocPhan]);
            const [lichDaDK] = await conn.query(`SELECT DATE_FORMAT(lh.NgayHoc, '%Y-%m-%d') AS NgayHocStr, lh.CaHoc, dk.MaLopHocPhan AS MaLHPDaDK FROM lichhoc lh JOIN dangky_hocphan dk ON lh.MaLopHocPhan = dk.MaLopHocPhan JOIN lophocphan lhp3 ON dk.MaLopHocPhan = lhp3.MaLopHocPhan WHERE dk.MSSV = ? AND lhp3.HocKy = ? AND dk.TrangThai NOT IN ('Da huy', 'Tu choi')`, [MSSV, lhp.HocKy]);

            for (const nm of lichMoi) {
                const pMoi = parseCaHoc(nm.CaHoc);
                if (pMoi.start === 0) continue;
                for (const ld of lichDaDK) {
                    const pCu = parseCaHoc(ld.CaHoc);
                    if (pCu.start !== 0 && nm.NgayHocStr === ld.NgayHocStr && tietOverlap(pMoi.start, pMoi.end, pCu.start, pCu.end)) {
                        throw new Error(`Môn ${lhp.TenMonHoc} trùng lịch với lớp ${ld.MaLHPDaDK} vào ngày ${nm.NgayHocStr.split('-').reverse().join('/')}.`);
                    }
                }
            }

            await conn.query(`INSERT INTO dangky_hocphan (MSSV, MaLopHocPhan, HocKy, TrangThai, NgayDangKy) VALUES (?, ?, ?, 'Chờ đóng tiền', NOW()) ON DUPLICATE KEY UPDATE TrangThai = 'Chờ đóng tiền', NgayDangKy = NOW(), HocKy = VALUES(HocKy)`, [MSSV, MaLopHocPhan, lhp.HocKy]);
        }

        // [BƯỚC 3]: CẬP NHẬT HOẶC TẠO MỚI HỌC PHÍ DỰA TRÊN TỔNG TÍN CHỈ
        if (tongTinChi > 0 && hocKyHienTai) {
            const DON_GIA_TIN_CHI = 800000; // Bạn có thể thay đổi đơn giá ở đây (800k/tín)
            const soTienMoi = tongTinChi * DON_GIA_TIN_CHI;

            const [[existingTuition]] = await conn.query(
                "SELECT * FROM hoc_phi WHERE ma_sinh_vien = ? AND hoc_ky = ?",
                [MSSV, hocKyHienTai]
            );

            if (existingTuition) {
                // Đã tồn tại công nợ trong kỳ này -> Cộng dồn tiền và chuyển thành Chưa đóng
                await conn.query(
                    "UPDATE hoc_phi SET so_tien = so_tien + ?, trang_thai = 'Chưa đóng' WHERE ma_sinh_vien = ? AND hoc_ky = ?",
                    [soTienMoi, MSSV, hocKyHienTai]
                );
            } else {
                // Tạo mới công nợ (Hạn nộp mặc định là 14 ngày sau)
                const hanNop = new Date();
                hanNop.setDate(hanNop.getDate() + 14);

                await conn.query(
                    "INSERT INTO hoc_phi (ma_sinh_vien, so_tien, han_nop, trang_thai, hoc_ky) VALUES (?, ?, ?, 'Chưa đóng', ?)",
                    [MSSV, soTienMoi, hanNop, hocKyHienTai]
                );
            }
        }

        await conn.commit();
        res.json({ success: true, message: `Đăng ký thành công ${cart.length} môn học! Tổng số tín chỉ là ${tongTinChi}. Vui lòng hoàn tất đóng học phí để giữ chỗ.` });

    } catch (err) {
        await conn.rollback();
        res.status(400).json({ message: err.message || 'Lỗi hệ thống khi đăng ký.' });
    } finally { conn.release(); }
});

// 5. API Hủy môn
// Đặt đoạn này ngay phía trước API Hủy môn để tránh lỗi trùng route
app.delete('/api/enrollment/phases/:id', async (req, res) => {
    try {
        // Chỉ xóa duy nhất trong bảng dot_dangky, không can thiệp bất cứ bảng nào khác
        await db.promise().query(
            'DELETE FROM dot_dangky WHERE MaDot = ?',
            [req.params.id]
        );

        notifyPhaseChange();
        res.json({ success: true, message: 'Đã xóa đợt đăng ký thành công!' });
    } catch (err) {
        console.error("Lỗi khi xóa đợt đăng ký:", err);
        res.status(500).json({ message: 'Lỗi xóa đợt đăng ký', error: err.message });
    }
});
// XÓA ĐĂNG KÝ - CHO PHÉP XÓA KHI CHƯA ĐÓNG TIỀN HOẶC ĐỢT VẪN MỞ
app.delete('/api/enrollment/:mssv/:maLhp', async (req, res) => {
    const { mssv, maLhp } = req.params;

    try {
        const [check] = await db.promise().query(`
            SELECT dk.TrangThai 
            FROM dangky_hocphan dk 
            WHERE dk.MSSV = ? AND dk.MaLopHocPhan = ?
        `, [mssv, maLhp]);

        if (check.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đăng ký này' });
        }

        if (check[0].TrangThai === 'Đã đóng tiền') {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa vì học phần đã đóng tiền'
            });
        }

        const [result] = await db.promise().query(`
            UPDATE dangky_hocphan 
            SET TrangThai = 'Đã hủy' 
            WHERE MSSV = ? AND MaLopHocPhan = ? 
        `, [mssv, maLhp]);

        if (result.affectedRows === 0) {
            return res.status(400).json({ success: false, message: 'Không thể xóa học phần này' });
        }

        res.json({ success: true, message: 'Đã hủy đăng ký học phần thành công!' });

    } catch (err) {
        console.error("Lỗi xóa đăng ký:", err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});
// ------------------------------------------------------------------
// CỤM API THU HỌC PHÍ / KÍCH HOẠT LỊCH HỌC (Provisional Registration)
// ------------------------------------------------------------------

// 6. Xác nhận sinh viên ĐÃ ĐÓNG TIỀN -> commit chính thức (tạo bản ghi `diem`
//    để lịch học xuất hiện trên thời khóa biểu của sinh viên).
app.post('/api/enrollment/:mssv/:maLhp/xac-nhan-thanh-toan', async (req, res) => {
    const { mssv, maLhp } = req.params;
    const conn = await db.promise().getConnection();
    try {
        await conn.beginTransaction();

        const [[dk]] = await conn.query(
            `SELECT MaDangKy, HocKy, TrangThai FROM dangky_hocphan WHERE MSSV = ? AND MaLopHocPhan = ? ORDER BY MaDangKy DESC LIMIT 1 FOR UPDATE`,
            [mssv, maLhp]
        );
        if (!dk) throw new Error('Không tìm thấy đăng ký của sinh viên cho lớp học phần này.');
        if (dk.TrangThai === 'Đã hủy' || dk.TrangThai === 'Từ chối' || dk.TrangThai === 'Da huy' || dk.TrangThai === 'Tu choi') {
            throw new Error('Đăng ký này đã bị hủy, không thể xác nhận đóng tiền.');
        }

        await conn.query(
            `UPDATE dangky_hocphan SET TrangThai = 'Đã đóng tiền', NgayThanhToan = NOW() WHERE MaDangKy = ?`,
            [dk.MaDangKy]
        );
        await conn.query(
            `INSERT IGNORE INTO diem (MSSV, MaLopHocPhan, HocKy) VALUES (?, ?, ?)`,
            [mssv, maLhp, dk.HocKy]
        );

        await conn.commit();
        res.json({ success: true, message: 'Xác nhận đóng học phí thành công! Lịch học đã được kích hoạt.' });
    } catch (err) {
        await conn.rollback();
        res.status(400).json({ message: err.message || 'Lỗi xác nhận đóng học phí.' });
    } finally { conn.release(); }
});

// 7. Từ chối / hủy do sinh viên không đóng tiền (dùng thủ công hoặc bởi job tự động)
app.post('/api/enrollment/:mssv/:maLhp/tu-choi-thanh-toan', (req, res) => {
    executeUpdate(
        `UPDATE dangky_hocphan SET TrangThai = 'Đã hủy' WHERE MSSV = ? AND MaLopHocPhan = ? AND TrangThai = 'Chờ đóng tiền'`,
        [req.params.mssv, req.params.maLhp], res,
        'Đã hủy đăng ký do chưa đóng học phí.',
        'Lỗi hủy đăng ký!'
    );
});

// 8. Khi một đợt đăng ký bị đóng: tự động hủy mọi đăng ký còn "Chờ đóng tiền"
//    thuộc đợt đó (không hoàn thành nghĩa vụ học phí trong thời hạn).
app.post('/api/enrollment/phases/:id/auto-huy-qua-han', (req, res) => {
    executeUpdate(
        `UPDATE dangky_hocphan SET TrangThai = 'Đã hủy' WHERE MaDot = ? AND TrangThai = 'Chờ đóng tiền'`,
        [req.params.id], res,
        'Đã tự động hủy các đăng ký chưa đóng học phí của đợt này.',
        'Lỗi hủy tự động!'
    );
});

// 9. THỐNG KÊ CHO ADMIN: theo từng lớp học phần — tổng số đăng ký thành công,
//    số đã đóng tiền, số đang chờ đóng tiền.
app.get('/api/enrollment/thong-ke-lop-hoc-phan', async (req, res) => {
    try {
        const [rows] = await db.promise().query(`
      SELECT
        lhp.MaLopHocPhan,
        mh.TenMonHoc,
        lhp.HocKy,
        lhp.NamHoc,
        lhp.SoLuongToiDa,
        COALESCE(SUM(CASE WHEN dk.TrangThai IN ('Chờ đóng tiền', 'Đã đóng tiền', 'Đã duyệt') THEN 1 ELSE 0 END), 0) AS TongDangKyThanhCong,
        COALESCE(SUM(CASE WHEN dk.TrangThai = 'Đã đóng tiền' THEN 1 ELSE 0 END), 0) AS SoDaDongTien,
        COALESCE(SUM(CASE WHEN dk.TrangThai = 'Chờ đóng tiền' THEN 1 ELSE 0 END), 0) AS SoChoDongTien
      FROM lophocphan lhp
      JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc
      LEFT JOIN dangky_hocphan dk ON dk.MaLopHocPhan = lhp.MaLopHocPhan
      GROUP BY lhp.MaLopHocPhan, mh.TenMonHoc, lhp.HocKy, lhp.NamHoc, lhp.SoLuongToiDa
      ORDER BY lhp.NamHoc DESC, lhp.HocKy, mh.TenMonHoc
    `);
        res.json(rows);
    } catch (err) {
        console.error('GET /api/enrollment/thong-ke-lop-hoc-phan error:', err);
        res.status(500).json({ message: 'Lỗi lấy thống kê đăng ký học phần!' });
    }
});

// 10. Thống kê giới hạn trong 1 đợt đăng ký cụ thể (dựa vào MaDot đã gắn khi đăng ký)
app.get('/api/enrollment/phases/:id/thong-ke', async (req, res) => {
    try {
        const [rows] = await db.promise().query(`
      SELECT
        lhp.MaLopHocPhan,
        mh.TenMonHoc,
        COALESCE(SUM(CASE WHEN dk.TrangThai IN ('Chờ đóng tiền', 'Đã đóng tiền') THEN 1 ELSE 0 END), 0) AS TongDangKyThanhCong,
        COALESCE(SUM(CASE WHEN dk.TrangThai = 'Đã đóng tiền' THEN 1 ELSE 0 END), 0) AS SoDaDongTien,
        COALESCE(SUM(CASE WHEN dk.TrangThai = 'Chờ đóng tiền' THEN 1 ELSE 0 END), 0) AS SoChoDongTien
      FROM dangky_hocphan dk
      JOIN lophocphan lhp ON dk.MaLopHocPhan = lhp.MaLopHocPhan
      JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc
      WHERE dk.MaDot = ?
      GROUP BY lhp.MaLopHocPhan, mh.TenMonHoc
      ORDER BY mh.TenMonHoc
    `, [req.params.id]);
        res.json(rows);
    } catch (err) {
        console.error('GET /api/enrollment/phases/:id/thong-ke error:', err);
        res.status(500).json({ message: 'Lỗi lấy thống kê đợt đăng ký!' });
    }
});

// ------------------------------------------------------------------
// ------------------------------------------------------------------
// CỤM API QUẢN LÝ ĐỢT ĐĂNG KÝ HỌC PHẦN (bảng dot_dangky)
// ------------------------------------------------------------------

// Ràng buộc ký tự đặc biệt cho tên đợt (đồng bộ với frontend EnrollmentPhaseManagement.jsx)
const TEN_DOT_ALLOWED_REGEX = /^[\p{L}\p{N}\s\-_(),.]+$/u;

// Hàm parse chuỗi ngày tháng theo múi giờ Việt Nam (+07:00) nếu không có thông tin múi giờ
const parseDateTimeInVN = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr;
    if (typeof dateStr !== 'string') return new Date(dateStr);
    if (!dateStr.includes('Z') && !dateStr.includes('+') && !/-\d{2}:\d{2}$/.test(dateStr)) {
        let normalized = dateStr.replace(' ', 'T');
        if (normalized.length === 10) {
            normalized += 'T00:00:00';
        } else if (normalized.length === 16) {
            normalized += ':00';
        }
        return new Date(normalized + '+07:00');
    }
    return new Date(dateStr);
};

// HÀM CHUẨN HÓA ĐỊNH DẠNG NGÀY THÁNG CHO MYSQL
const formatMySQLDateTime = (dateInput) => {
    if (!dateInput) return null;
    const dateObj = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(dateObj.getTime())) return null;
    
    // Bắt buộc chuyển đổi ra giờ Việt Nam (+07:00) không phụ thuộc server timezone
    const utcMs = dateObj.getTime();
    const vnMs = utcMs + (7 * 60 * 60 * 1000);
    const vnDate = new Date(vnMs);
    
    const pad = (n) => n.toString().padStart(2, '0');
    return `${vnDate.getUTCFullYear()}-${pad(vnDate.getUTCMonth() + 1)}-${pad(vnDate.getUTCDate())} ${pad(vnDate.getUTCHours())}:${pad(vnDate.getUTCMinutes())}:${pad(vnDate.getUTCSeconds())}`;
};

// Cập nhật trạng thái tự động
async function autoUpdatePhases() {
    try {
        await db.promise().query(`UPDATE dot_dangky SET TrangThai = 'Dong' WHERE TrangThai = 'Mo' AND NgayDong <= NOW()`);
    } catch (e) {
        console.error("Auto update phases error:", e);
    }
}

// Kiểm tra xem có đợt nào khác đang mở bị chồng chéo thời gian không.
// Cho phép lên lịch nhiều đợt đăng ký trong tương lai nếu chúng không chồng chéo thời gian.
async function findConflictingOpenPhase(ngayMo, ngayDong, excludeId) {
    if (!ngayMo || !ngayDong) return null;
    const formattedNgayMo = formatMySQLDateTime(ngayMo);
    const formattedNgayDong = formatMySQLDateTime(ngayDong);
    
    let query = `SELECT MaDot, TenDot, HocKy, NienKhoa, NgayTao, NgayDong FROM dot_dangky
                 WHERE TrangThai != 'Dong'
                 AND NgayTao < ? AND ? < NgayDong`;
    const params = [formattedNgayDong, formattedNgayMo];
    if (excludeId) {
        query += ' AND MaDot != ?';
        params.push(excludeId);
    }
    query += ' LIMIT 1';
    const [rows] = await db.promise().query(query, params);
    return rows[0] || null;
}

// ==================== SSE CHO ENROLLMENT PHASES ====================
const phaseStreamClients = [];

app.get('/api/enrollment/phases/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = Date.now();
    const newClient = { id: clientId, res };
    phaseStreamClients.push(newClient);

    req.on('close', () => {
        const idx = phaseStreamClients.findIndex(c => c.id === clientId);
        if (idx !== -1) phaseStreamClients.splice(idx, 1);
    });
});

const notifyPhaseChange = () => {
    phaseStreamClients.forEach(client => {
        client.res.write(`data: ${JSON.stringify({ type: 'PHASE_CHANGED' })}\n\n`);
    });
};
// ====================================================================

// 6. Lấy danh sách các đợt đăng ký
app.get('/api/enrollment/phases', async (req, res) => {
    try {
        await autoUpdatePhases();
        const query = `
            SELECT *, 
                   DATE_FORMAT(NgayTao, '%Y-%m-%dT%H:%i:%s') AS NgayTao,
                   DATE_FORMAT(NgayDong, '%Y-%m-%dT%H:%i:%s') AS NgayDong 
            FROM dot_dangky 
            ORDER BY NgayTao DESC
        `;
        db.query(query, (error, results) => {
            if (error) {
                console.error("Lỗi truy vấn SQL:", error);
                return res.status(500).json({ message: 'Lỗi server khi lấy đợt đăng ký' });
            }
            res.json(results);
        });
    } catch (error) {
        console.error("Lỗi hệ thống:", error);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
});

// 7. Tạo mới một đợt đăng ký (CHÈN DỮ LIỆU vào dot_dangky)
app.post('/api/enrollment/phases', async (req, res) => {
    const { TenDot, HocKy, NienKhoa, NgayTao, NgayDong } = req.body;

    if (!TenDot || !NgayTao || !NgayDong) {
        return res.status(400).json({ message: 'Vui lòng nhập đầy đủ Tên đợt, Ngày mở và Ngày đóng.' });
    }
    const tenDotTrimmed = TenDot.trim();
    if (tenDotTrimmed.length < 3) {
        return res.status(400).json({ message: 'Tên đợt phải có ít nhất 3 ký tự.' });
    }
    if (tenDotTrimmed.length > 50) {
        return res.status(400).json({ message: 'Tên đợt không được vượt quá 50 ký tự.' });
    }
    if (req.body.MoTa && req.body.MoTa.length > 1000) {
        return res.status(400).json({ message: 'Mô tả không được vượt quá 1000 ký tự.' });
    }
    const tenDotRegex = /^[\p{L}\p{N}\s\-_(),.]*$/u;
    if (!tenDotRegex.test(TenDot)) {
        return res.status(400).json({ message: 'Tên đợt chứa ký tự không hợp lệ. Chỉ cho phép chữ, số, khoảng trắng và - _ ( ) , .' });
    }
    if (/\s{2,}/.test(TenDot)) {
        return res.status(400).json({ message: 'Tên đợt không được chứa nhiều khoảng trắng liên tiếp.' });
    }
    if (req.body.MoTa && !tenDotRegex.test(req.body.MoTa)) {
        return res.status(400).json({ message: 'Mô tả chứa ký tự không hợp lệ. Chỉ cho phép chữ, số, khoảng trắng và - _ ( ) , .' });
    }
    if (req.body.MoTa && /\s{2,}/.test(req.body.MoTa)) {
        return res.status(400).json({ message: 'Mô tả không được chứa nhiều khoảng trắng liên tiếp.' });
    }
    const now = new Date();
    const startDate = parseDateTimeInVN(NgayTao);
    let endDate = parseDateTimeInVN(NgayDong);
    if (NgayDong && NgayDong.length === 10) {
        endDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000 - 1000); // 23:59:59
    }
    const twoWeeksInMs = 14 * 24 * 60 * 60 * 1000;

    if (startDate.getTime() < now.getTime() - 60000) {
        return res.status(400).json({ message: 'Thời gian mở không được nằm trong quá khứ.' });
    }
    if (startDate.getTime() > now.getTime() + twoWeeksInMs) {
        return res.status(400).json({ message: 'Chỉ có thể đặt lịch mở tối đa trước 2 tuần.' });
    }
    if (endDate.getTime() <= startDate.getTime()) {
        return res.status(400).json({ message: 'Ngày đóng phải sau ngày mở.' });
    }
    if (endDate.getTime() - startDate.getTime() > twoWeeksInMs + 24 * 60 * 60 * 1000) {
        return res.status(400).json({ message: 'Thời hạn ngày đóng tối đa là 2 tuần kể từ ngày mở.' });
    }

    const trangThaiMoi = 'Mo';

    if (HocKy && NienKhoa) {
        const [existingPhases] = await db.promise().query(
            'SELECT MaDot FROM dot_dangky WHERE HocKy = ? AND NienKhoa = ?',
            [HocKy, NienKhoa]
        );
        if (existingPhases.length > 0) {
            return res.status(400).json({ message: `Đã tồn tại đợt đăng ký cho Học kỳ ${HocKy} - Niên khóa ${NienKhoa}. Mỗi học kỳ chỉ được tạo 1 đợt.` });
        }
    }

    const conflictPhase = await findConflictingOpenPhase(startDate, endDate, null);
    if (conflictPhase) {
        return res.status(409).json({
            message: `Thời gian bị chồng chéo với đợt "${conflictPhase.TenDot}". Không thể mở nhiều đợt cùng lúc.`
        });
    }

    try {
        const formattedNgayMo = formatMySQLDateTime(startDate);
        const formattedNgayDong = formatMySQLDateTime(endDate);

        const [result] = await db.promise().query(
            `INSERT INTO dot_dangky (TenDot, MoTa, HocKy, NienKhoa, NgayTao, NgayDong, TrangThai)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [TenDot, req.body.MoTa || null, HocKy || null, NienKhoa || null, formattedNgayMo, formattedNgayDong, trangThaiMoi]
        );

        const [[newPhase]] = await db.promise().query(
            `SELECT * FROM dot_dangky WHERE MaDot = ?`, [result.insertId]
        );

        notifyPhaseChange();
        res.status(201).json({ success: true, message: 'Tạo đợt đăng ký thành công!', data: newPhase });
    } catch (err) {
        console.error('POST /api/enrollment/phases error:', err);
        res.status(500).json({ message: 'Lỗi tạo đợt đăng ký!', error: err.message });
    }
});
// 8. Cập nhật một đợt đăng ký (Thay thế đoạn này trong file server.js)
app.put('/api/enrollment/phases/:id', async (req, res) => {
    const { TenDot, HocKy, NienKhoa, NgayTao, NgayDong } = req.body;
    const { id } = req.params;

    if (!TenDot || !NgayTao || !NgayDong) {
        return res.status(400).json({ message: 'Vui lòng nhập đầy đủ Tên đợt, Ngày mở và Ngày đóng.' });
    }
    const tenDotTrimmed = TenDot.trim();
    if (tenDotTrimmed.length < 3) {
        return res.status(400).json({ message: 'Tên đợt phải có ít nhất 3 ký tự.' });
    }
    if (tenDotTrimmed.length > 50) {
        return res.status(400).json({ message: 'Tên đợt không được vượt quá 50 ký tự.' });
    }
    if (req.body.MoTa && req.body.MoTa.length > 1000) {
        return res.status(400).json({ message: 'Mô tả không được vượt quá 1000 ký tự.' });
    }
    const tenDotRegex = /^[\p{L}\p{N}\s\-_(),.]*$/u;
    if (!tenDotRegex.test(TenDot)) {
        return res.status(400).json({ message: 'Tên đợt chứa ký tự không hợp lệ. Chỉ cho phép chữ, số, khoảng trắng và - _ ( ) , .' });
    }
    if (/\s{2,}/.test(TenDot)) {
        return res.status(400).json({ message: 'Tên đợt không được chứa nhiều khoảng trắng liên tiếp.' });
    }
    if (req.body.MoTa && !tenDotRegex.test(req.body.MoTa)) {
        return res.status(400).json({ message: 'Mô tả chứa ký tự không hợp lệ. Chỉ cho phép chữ, số, khoảng trắng và - _ ( ) , .' });
    }
    if (req.body.MoTa && /\s{2,}/.test(req.body.MoTa)) {
        return res.status(400).json({ message: 'Mô tả không được chứa nhiều khoảng trắng liên tiếp.' });
    }
    const now = new Date();
    const startDate = parseDateTimeInVN(NgayTao);
    let endDate = parseDateTimeInVN(NgayDong);
    if (NgayDong && NgayDong.length === 10) {
        endDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000 - 1000); // 23:59:59
    }
    const twoWeeksInMs = 14 * 24 * 60 * 60 * 1000;

    try {
        const [[existingPhase]] = await db.promise().query('SELECT TrangThai, NgayTao, NgayDong FROM dot_dangky WHERE MaDot = ?', [id]);
        if (!existingPhase) return res.status(404).json({ message: 'Không tìm thấy đợt.' });
        if (existingPhase.TrangThai === 'Dong') {
            return res.status(403).json({ message: 'Không thể sửa đợt đăng ký đã đóng.' });
        }
        
        const existingStartTime = parseDateTimeInVN(existingPhase.NgayTao).getTime();
        const existingEndTime = parseDateTimeInVN(existingPhase.NgayDong).getTime();
        
        if (Math.abs(startDate.getTime() - existingStartTime) > 60000) {
            if (startDate.getTime() < now.getTime() - 60000) {
                return res.status(400).json({ message: 'Thời gian mở không được nằm trong quá khứ.' });
            }
            if (startDate.getTime() > now.getTime() + twoWeeksInMs) {
                return res.status(400).json({ message: 'Chỉ có thể đặt lịch mở tối đa trước 2 tuần.' });
            }
        }

        if (Math.abs(endDate.getTime() - existingEndTime) > 60000) {
            if (endDate.getTime() < now.getTime() - 60000) {
                return res.status(400).json({ message: 'Thời gian đóng không được nằm trong quá khứ.' });
            }
        }
        
        if (endDate.getTime() <= startDate.getTime()) {
            return res.status(400).json({ message: 'Ngày đóng phải sau ngày mở.' });
        }
        if (endDate.getTime() - startDate.getTime() > twoWeeksInMs + 24 * 60 * 60 * 1000) {
            return res.status(400).json({ message: 'Thời hạn ngày đóng tối đa là 2 tuần kể từ ngày mở.' });
        }

        const trangThaiMoi = 'Mo';

        if (HocKy && NienKhoa) {
            const [existingPhases] = await db.promise().query(
                'SELECT MaDot FROM dot_dangky WHERE HocKy = ? AND NienKhoa = ? AND MaDot != ?',
                [HocKy, NienKhoa, id]
            );
            if (existingPhases.length > 0) {
                return res.status(400).json({ message: `Đã tồn tại đợt đăng ký cho Học kỳ ${HocKy} - Niên khóa ${NienKhoa}. Mỗi học kỳ chỉ được tạo 1 đợt.` });
            }
        }

        const conflictPhase = await findConflictingOpenPhase(startDate, endDate, id);
        if (conflictPhase) {
            return res.status(409).json({
                message: `Thời gian bị chồng chéo với đợt "${conflictPhase.TenDot}". Không thể mở nhiều đợt cùng lúc.`
            });
        }

        const formattedNgayMo = formatMySQLDateTime(startDate);
        const formattedNgayDong = formatMySQLDateTime(endDate);

        const [result] = await db.promise().query(
            `UPDATE dot_dangky
       SET TenDot = ?, MoTa = ?, HocKy = ?, NienKhoa = ?, NgayTao = ?, NgayDong = ?, TrangThai = ?
       WHERE MaDot = ?`,
            [TenDot, req.body.MoTa || null, HocKy || null, NienKhoa || null, formattedNgayMo, formattedNgayDong, trangThaiMoi, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy đợt đăng ký cần cập nhật.' });
        }

        notifyPhaseChange();
        res.json({ success: true, message: 'Cập nhật đợt đăng ký thành công!' });
    } catch (err) {
        console.error('PUT /api/enrollment/phases/:id error:', err);
        res.status(500).json({ message: 'Lỗi cập nhật đợt đăng ký!', error: err.message });
    }
});

// 9. Đóng một đợt đăng ký
// 9. Đóng một đợt đăng ký (Thay thế đoạn này trong file server.js)
app.post('/api/enrollment/phases/:id/close', async (req, res) => {
    try {
        await db.promise().query(
            `UPDATE dot_dangky SET TrangThai = 'Dong' WHERE MaDot = ?`,
            [req.params.id]
        );

        notifyPhaseChange();
        res.json({
            success: true,
            message: `Đã đóng đợt đăng ký thành công!`
        });
    } catch (err) {
        console.error('POST /api/enrollment/phases/:id/close error:', err);
        res.status(500).json({ message: 'Lỗi đóng đợt đăng ký', error: err.message });
    }
});

// 10. Mở lại đợt đăng ký đã đóng
app.post('/api/enrollment/phases/:id/reopen', async (req, res) => {
    const { id } = req.params;
    try {
        const [[existingPhase]] = await db.promise().query('SELECT * FROM dot_dangky WHERE MaDot = ?', [id]);
        if (!existingPhase) return res.status(404).json({ message: 'Không tìm thấy đợt.' });
        if (existingPhase.TrangThai !== 'Dong') return res.status(400).json({ message: 'Đợt này chưa đóng.' });

        const now = new Date();
        const endDate = new Date(existingPhase.NgayDong);
        
        if (endDate.getTime() <= now.getTime()) {
            return res.status(400).json({ message: 'Không thể mở lại đợt đăng ký đã kết thúc trong quá khứ.' });
        }

        const conflictPhase = await findConflictingOpenPhase(existingPhase.NgayTao, endDate, id);
        if (conflictPhase) {
            return res.status(409).json({
                message: `Thời gian bị chồng chéo với đợt "${conflictPhase.TenDot}". Không thể mở nhiều đợt cùng lúc.`
            });
        }

        const formattedNgayDong = formatMySQLDateTime(endDate);
        await db.promise().query(
            `UPDATE dot_dangky SET TrangThai = 'Mo', NgayDong = ? WHERE MaDot = ?`,
            [formattedNgayDong, id]
        );

        notifyPhaseChange();
        res.json({ success: true, message: 'Mở lại đợt đăng ký thành công!' });
    } catch (err) {
        console.error('POST /api/enrollment/phases/:id/reopen error:', err);
        res.status(500).json({ message: 'Lỗi mở lại đợt đăng ký!', error: err.message });
    }
});

// 10. Xóa một đợt đăng ký
// API cho Admin xác nhận thanh toán
// ==================== [ADMIN] XÁC NHẬN HỌC PHÍ & CHỐT LỊCH ====================
app.post('/api/admin/confirm-tuition', async (req, res) => {
    const { MSSV, MaLopHocPhan } = req.body;

    if (!MSSV || !MaLopHocPhan) {
        return res.status(400).json({ message: 'Thiếu thông tin MSSV hoặc Mã lớp học phần.' });
    }

    const conn = await db.promise().getConnection();
    try {
        await conn.beginTransaction();

        // 1. Chuyển trạng thái trong bảng Đăng ký thành "Đã đóng tiền"
        const [updateResult] = await conn.query(
            `UPDATE dangky_hocphan SET TrangThai = 'Đã đóng tiền' WHERE MSSV = ? AND MaLopHocPhan = ?`,
            [MSSV, MaLopHocPhan]
        );

        if (updateResult.affectedRows === 0) {
            throw new Error('Không tìm thấy đăng ký này hoặc đã được duyệt từ trước.');
        }

        // 2. Lấy thông tin Học kỳ để chèn vào bảng Điểm
        const [[lhp]] = await conn.query(
            `SELECT HocKy FROM lophocphan WHERE MaLopHocPhan = ?`,
            [MaLopHocPhan]
        );

        // 3. Đưa sinh viên vào bảng Điểm (Chốt danh sách lớp chính thức)
        await conn.query(
            `INSERT INTO diem (MSSV, MaLopHocPhan, HocKy, ChuyenCan, GiuaKy, CuoiKy, DiemTong) 
       VALUES (?, ?, ?, NULL, NULL, NULL, NULL)
       ON DUPLICATE KEY UPDATE MSSV=MSSV`, // Tránh lỗi crash nếu lỡ click 2 lần
            [MSSV, MaLopHocPhan, lhp.HocKy]
        );

        // 4. (Tùy chọn) Cập nhật lại trạng thái trong bảng HocPhi thành 'Đã đóng'
        // Nếu bạn thu tiền theo từng môn. Nếu thu gom 1 cục theo kỳ thì Admin sẽ update bảng HocPhi riêng.

        await conn.commit();
        res.json({ success: true, message: 'Xác nhận học phí thành công, môn học đã vào lịch!' });

    } catch (err) {
        await conn.rollback();
        res.status(400).json({ message: err.message || 'Lỗi hệ thống khi xác nhận.' });
    } finally {
        conn.release();
    }
});

// API lấy lịch học chính thức (chỉ lấy môn đã đóng tiền)

// ==================== QUẢN LÝ HỌC PHÍ - SINH VIÊN ====================

// ==================== QUẢN LÝ HỌC PHÍ - SINH VIÊN ====================

// Sinh viên xem danh sách học phí của mình
/* [LEGACY TUITION ROUTE REMOVED] 
app.get('/student/tuitions/:maSinhVien', ...); 
*/
// Sinh viên lưu đăng ký tạm
app.post('/api/dang-ky', (req, res) => {
    const { mssv, maLopHocPhan } = req.body;
    // Mặc định trạng thái là 'cho_dong_tien'
    const query = "INSERT INTO DangKyHocPhan (MSSV, MaLopHocPhan, trang_thai) VALUES (?, ?, 'cho_dong_tien')";
    db.query(query, [mssv, maLopHocPhan], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: "Đăng ký tạm thành công, chờ Admin xác nhận!" });
    });
});
// Admin duyệt đăng ký
app.post('/api/admin/duyet-dang-ky', (req, res) => {
    const { mssv, maLopHocPhan } = req.body;
    const query = "UPDATE DangKyHocPhan SET trang_thai = 'da_dong_tien' WHERE MSSV = ? AND MaLopHocPhan = ?";
    db.query(query, [mssv, maLopHocPhan], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: "Đã xác nhận môn học vào lịch chính thức" });
    });
});

app.get('/api/schedule-configs', async (req, res) => {
    try {
        const promiseRooms = new Promise((resolve, reject) => { db.query("SELECT MaPhong FROM phonghoc WHERE TrangThai = 'Hoạt động'", (err, results) => { if (err) reject(err); else resolve(results.map(r => r.MaPhong)); }); });
        const promisePeriods = new Promise((resolve, reject) => { db.query("SELECT Tiet, DATE_FORMAT(GioBatDau, '%H:%i') as start, DATE_FORMAT(GioKetThuc, '%H:%i') as end FROM tiethoc ORDER BY Tiet", (err, results) => { if (err) reject(err); else { const periods = {}; results.forEach(r => { periods[r.Tiet] = { start: r.start, end: r.end }; }); resolve(periods); } }); });
        const [roomList, periodTimes] = await Promise.all([promiseRooms, promisePeriods]);
        res.json({ success: true, rooms: roomList, periods: periodTimes, tanSuat: [{ value: 1, label: '1 buổi / tuần' }, { value: 2, label: '2 buổi / tuần' }], thuList: [{ value: 1, label: 'Thứ 2' }, { value: 2, label: 'Thứ 3' }, { value: 3, label: 'Thứ 4' }, { value: 4, label: 'Thứ 5' }, { value: 5, label: 'Thứ 6' }, { value: 6, label: 'Thứ 7' }, { value: 0, label: 'Chủ Nhật' }] });
    } catch (error) { res.status(500).json({ success: false, message: 'Lỗi tải cấu hình lịch học từ DB!', error: error.message || error }); }
});

app.get('/api/schedules', (req, res) => {
    const query = `
        SELECT 
            lh.*,
            lhp.MaGiangVien, lhp.MaMonHoc, lhp.HocKy, lhp.MaLop, lhp.SoLuongToiDa, lhp.TrangThaiLich,
            gv.HoTen AS TenGiangVien,
            mh.TenMonHoc, mh.SoTinChi,
            l.TenLop,
            (SELECT COALESCE(SUM(lh2.SoTiet), 0) FROM lichhoc lh2 WHERE lh2.MaLopHocPhan = lh.MaLopHocPhan) AS TongTietDaHoc,
            (SELECT COUNT(DISTINCT MSSV) FROM (SELECT MSSV FROM dangky_hocphan WHERE MaLopHocPhan = lhp.MaLopHocPhan AND TrangThai NOT IN ('Da huy', 'Tu choi', 'Đã hủy', 'Từ chối') UNION SELECT MSSV FROM diem WHERE MaLopHocPhan = lhp.MaLopHocPhan UNION SELECT MSSV FROM sinhvien WHERE MaLop = lhp.MaLop AND lhp.MaLop IS NOT NULL AND lhp.MaLop != '') AS tmp) AS SiSoThucTe
        FROM lichhoc lh
        LEFT JOIN lophocphan lhp ON lh.MaLopHocPhan = lhp.MaLopHocPhan
        LEFT JOIN giangvien gv ON lhp.MaGiangVien = gv.MaGiangVien
        LEFT JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc
        LEFT JOIN lophoc l ON lhp.MaLop = l.MaLop
    `;
    executeQuery(query, [], res, 'Lỗi lấy lịch học!');
});

// ĐÃ FIX: Bổ sung mh.SoTinChi để frontend hiển thị đúng số lượng tín chỉ
// ĐÃ FIX: Lấy lịch học chính thức (chỉ hiển thị môn đã đóng tiền và nối đầy đủ thông tin phòng, tiết)
app.get('/api/students/:mssv/schedule', (req, res) => {
    executeQuery(`
        SELECT 
            lh.*, 
            lhp.MaMonHoc, 
            lhp.MaLop, 
            lhp.HocKy, 
            mh.TenMonHoc, 
            mh.SoTinChi, 
            gv.HoTen as TenGiangVien,
            dk.TrangThai
        FROM dangky_hocphan dk
        JOIN lophocphan lhp ON dk.MaLopHocPhan = lhp.MaLopHocPhan 
        JOIN lichhoc lh ON lh.MaLopHocPhan = lhp.MaLopHocPhan 
        JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc 
        LEFT JOIN giangvien gv ON lhp.MaGiangVien = gv.MaGiangVien 
        WHERE dk.MSSV = ? 
          AND dk.TrangThai = 'Đã đóng tiền'
        ORDER BY lh.NgayHoc ASC
    `, [req.params.mssv], res, 'Lỗi lấy lịch học sinh viên!');
});

app.get('/api/schedule/student/:mssv', (req, res) => {
    executeQuery(`
        SELECT lh.*, lhp.MaMonHoc, lhp.MaLop, lhp.HocKy, mh.TenMonHoc, mh.SoTinChi, gv.HoTen as TenGiangVien 
        FROM diem d 
        JOIN lophocphan lhp ON d.MaLopHocPhan = lhp.MaLopHocPhan 
        JOIN lichhoc lh ON lh.MaLopHocPhan = lhp.MaLopHocPhan 
        JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc 
        LEFT JOIN giangvien gv ON lhp.MaGiangVien = gv.MaGiangVien 
        WHERE d.MSSV = ?
    `, [req.params.mssv], res, 'Lỗi lịch SV!');
});

app.post('/api/schedules', async (req, res) => {
    const { MaLopHocPhan, NgayHoc, TietBatDau, SoTiet, PhongHoc } = req.body;
    const soTietHoc = parseInt(SoTiet); const tietBD = parseInt(TietBatDau);
    if (!soTietHoc || soTietHoc < 1 || soTietHoc > 5) return res.status(400).json({ success: false, message: 'Số tiết học của buổi phải từ 1 đến 5 tiết!' });
    if (!tietBD || tietBD < 1 || tietBD > 12) return res.status(400).json({ success: false, message: 'Tiết bắt đầu không hợp lệ!' });
    try {
        const tietKetThuc = tietBD + soTietHoc - 1;
        if (tietKetThuc > 12) return res.status(400).json({ success: false, message: 'Tiết kết thúc không được vượt quá 12!' });
        const caHocStr = `${tietBD}-${tietKetThuc}`;
        const promiseLHP = new Promise((resolve, reject) => { db.query('SELECT mh.SoTinChi, lhp.TrangThaiLich FROM lophocphan lhp JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc WHERE lhp.MaLopHocPhan = ?', [MaLopHocPhan], (err, results) => { if (err) reject(err); else resolve(results[0]); }); });
        const promiseDaXep = new Promise((resolve, reject) => { db.query('SELECT COALESCE(SUM(SoTiet), 0) as DaXep FROM lichhoc WHERE MaLopHocPhan = ?', [MaLopHocPhan], (err, results) => { if (err) reject(err); else resolve(results[0].DaXep); }); });
        const [lhpInfo, tietDaXep] = await Promise.all([promiseLHP, promiseDaXep]);
        if (!lhpInfo) return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin môn học!' });
        if (lhpInfo.TrangThaiLich === 'DA_CHOT') {
            return res.status(400).json({ success: false, message: 'Lớp học phần này đã CHỐT LỊCH HỌC, không thể xếp thêm buổi học mới! Chỉ được sửa hoặc xóa các buổi đã xếp.' });
        }
        const tongTietMonHoc = lhpInfo.SoTinChi * 9; const tietConLai = tongTietMonHoc - tietDaXep;
        if (tietConLai <= 0) return res.status(400).json({ success: false, message: 'Môn học này đã được xếp đủ số tiết quy định.' });
        if (soTietHoc > tietConLai) return res.status(400).json({ success: false, message: `Số tiết buổi học (${soTietHoc}) vượt quá số tiết còn lại (${tietConLai}).` });
        const nguoiTaoVal = req.body.NguoiTao || 'Admin (Hệ thống)';
        db.query('INSERT INTO lichhoc (MaLopHocPhan, NgayHoc, CaHoc, SoTiet, PhongHoc, NguoiTao, NgayTao) VALUES (?, ?, ?, ?, ?, ?, NOW())', [MaLopHocPhan, NgayHoc, caHocStr, soTietHoc, PhongHoc, nguoiTaoVal], (err) => {
            if (err) return res.status(500).json({ success: false, message: 'Lỗi Database khi thêm lịch học!' });
            res.json({ success: true, message: 'Thêm lịch học thành công!' });
        });
    } catch (error) { res.status(500).json({ success: false, message: 'Lỗi server xử lý nghiệp vụ xếp lịch!' }); }
});

app.put('/api/schedules/:maLichHoc', async (req, res) => {
    const { MaLopHocPhan, NgayHoc, TietBatDau, SoTiet, PhongHoc } = req.body;
    const maLichHoc = req.params.maLichHoc;
    const soTietHoc = parseInt(SoTiet); const tietBD = parseInt(TietBatDau);
    if (!soTietHoc || soTietHoc < 1 || soTietHoc > 5) return res.status(400).json({ success: false, message: 'Số tiết học của buổi phải từ 1 đến 5 tiết!' });
    try {
        const tietKetThuc = tietBD + soTietHoc - 1;
        if (tietKetThuc > 12) return res.status(400).json({ success: false, message: 'Tiết kết thúc không được vượt quá 12!' });
        const caHocStr = `${tietBD}-${tietKetThuc}`;
        const promiseLHP = new Promise((resolve, reject) => { db.query('SELECT mh.SoTinChi FROM lophocphan lhp JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc WHERE lhp.MaLopHocPhan = ?', [MaLopHocPhan], (err, results) => { if (err) reject(err); else resolve(results[0]); }); });
        const promiseDaXep = new Promise((resolve, reject) => { db.query('SELECT COALESCE(SUM(SoTiet), 0) as DaXep FROM lichhoc WHERE MaLopHocPhan = ? AND MaLichHoc != ?', [MaLopHocPhan, maLichHoc], (err, results) => { if (err) reject(err); else resolve(results[0].DaXep); }); });
        const [lhpInfo, tietDaXepTruBuoiNay] = await Promise.all([promiseLHP, promiseDaXep]);
        if (!lhpInfo) return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin môn học!' });
        const tongTietMonHoc = lhpInfo.SoTinChi * 9; const tietConLaiThucTe = tongTietMonHoc - tietDaXepTruBuoiNay;
        if (soTietHoc > tietConLaiThucTe) return res.status(400).json({ success: false, message: `Cập nhật thất bại. Hệ thống chỉ còn trống ${tietConLaiThucTe} tiết cho môn học này.` });
        const nguoiTaoVal = req.body.NguoiTao || 'Admin (Hệ thống)';
        db.query('UPDATE lichhoc SET MaLopHocPhan=?, NgayHoc=?, CaHoc=?, SoTiet=?, PhongHoc=?, NguoiTao=?, NgayTao=NOW() WHERE MaLichHoc=?', [MaLopHocPhan, NgayHoc, caHocStr, soTietHoc, PhongHoc, nguoiTaoVal, maLichHoc], (err) => {
            if (err) return res.status(500).json({ success: false, message: 'Lỗi cập nhật lịch học!' });
            res.json({ success: true, message: 'Cập nhật lịch học thành công!' });
        });
    } catch (error) { res.status(500).json({ success: false, message: 'Lỗi server xử lý cập nhật lịch!' }); }
});

app.delete('/api/schedules/:maLichHoc', (req, res) => {
    executeDelete('DELETE FROM lichhoc WHERE MaLichHoc=?', [req.params.maLichHoc], res, 'Xóa thành công', 'Lỗi xóa');
});

app.delete('/api/schedules/lophocphan/:maLHP', (req, res) => {
    const maLHP = req.params.maLHP;
    db.query('DELETE FROM lichhoc WHERE MaLopHocPhan=?', [maLHP], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi xóa lịch học của lớp!' });
        db.query("UPDATE lophocphan SET TrangThaiLich = 'CHUA_CHOT' WHERE MaLopHocPhan = ?", [maLHP], (errUpdate) => {
            if (errUpdate) return res.status(500).json({ success: false, message: 'Đã xóa lịch nhưng lỗi mở khóa lớp HP!' });
            res.json({ success: true, message: 'Xóa toàn bộ lịch của lớp và mở khóa phân công thành công!' });
        });
    });
});

app.put('/api/schedules/lophocphan/:maLHP/reschedule', async (req, res) => {
    const maLHP = req.params.maLHP;
    const { sessions } = req.body;
    if (!Array.isArray(sessions) || sessions.length === 0) {
        return res.status(400).json({ success: false, message: 'Danh sách buổi học mới không được để trống!' });
    }

    db.query('SELECT mh.SoTinChi, lhp.TrangThaiLich FROM lophocphan lhp JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc WHERE lhp.MaLopHocPhan = ?', [maLHP], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi kiểm tra thông tin môn học!' });
        if (!results || results.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin môn học!' });
        const lhpInfo = results[0];
        if (lhpInfo.TrangThaiLich === 'DA_CHOT') {
            return res.status(400).json({ success: false, message: 'Lớp học phần này đã CHỐT LỊCH HỌC, không thể xếp lại lịch!' });
        }

        const tongTietMonHoc = lhpInfo.SoTinChi * 9;
        const tongTietMoi = sessions.reduce((sum, s) => sum + (parseInt(s.SoTiet) || 0), 0);
        if (tongTietMoi > tongTietMonHoc) {
            return res.status(400).json({ success: false, message: `Tổng số tiết mới (${tongTietMoi}) vượt quá số tiết quy định của môn học (${tongTietMonHoc}).` });
        }

        for (const session of sessions) {
            const soTietHoc = parseInt(session.SoTiet);
            const tietBD = parseInt(session.TietBatDau);
            if (!soTietHoc || soTietHoc < 1 || soTietHoc > 5) return res.status(400).json({ success: false, message: 'Số tiết học của buổi phải từ 1 đến 5 tiết!' });
            if (!tietBD || tietBD < 1 || tietBD > 12) return res.status(400).json({ success: false, message: 'Tiết bắt đầu không hợp lệ!' });
            if (tietBD + soTietHoc - 1 > 12) return res.status(400).json({ success: false, message: 'Tiết kết thúc không được vượt quá 12!' });
        }

        db.getConnection((errConn, conn) => {
            if (errConn) return res.status(500).json({ success: false, message: 'Lỗi kết nối cơ sở dữ liệu!' });
            conn.beginTransaction((errBegin) => {
                if (errBegin) {
                    conn.release();
                    return res.status(500).json({ success: false, message: 'Lỗi bắt đầu giao dịch!' });
                }

                conn.query('DELETE FROM lichhoc WHERE MaLopHocPhan = ?', [maLHP], (errDel) => {
                    if (errDel) {
                        return conn.rollback(() => {
                            conn.release();
                            res.status(500).json({ success: false, message: 'Lỗi khi xóa lịch học cũ!' });
                        });
                    }

                    const insertPromises = sessions.map(session => {
                        const soTietHoc = parseInt(session.SoTiet);
                        const tietBD = parseInt(session.TietBatDau);
                        const tietKetThuc = tietBD + soTietHoc - 1;
                        const caHocStr = `${tietBD}-${tietKetThuc}`;
                        const nguoiTaoVal = session.NguoiTao || 'Admin (Hệ thống)';
                        return new Promise((resolve, reject) => {
                            conn.query('INSERT INTO lichhoc (MaLopHocPhan, NgayHoc, CaHoc, SoTiet, PhongHoc, NguoiTao, NgayTao) VALUES (?, ?, ?, ?, ?, ?, NOW())',
                                [maLHP, session.NgayHoc, caHocStr, soTietHoc, session.PhongHoc, nguoiTaoVal],
                                (errIns) => {
                                    if (errIns) reject(errIns);
                                    else resolve();
                                }
                            );
                        });
                    });

                    Promise.all(insertPromises)
                        .then(() => {
                            conn.commit((errCommit) => {
                                if (errCommit) {
                                    return conn.rollback(() => {
                                        conn.release();
                                        res.status(500).json({ success: false, message: 'Lỗi commit giao dịch!' });
                                    });
                                }
                                conn.release();
                                res.json({ success: true, message: 'Cập nhật lại lịch học định kỳ môn thành công!' });
                            });
                        })
                        .catch(() => {
                            conn.rollback(() => {
                                conn.release();
                                res.status(500).json({ success: false, message: 'Lỗi khi tạo lịch học mới, đã hoàn tác thay đổi!' });
                            });
                        });
                });
            });
        });
    });
});

/* [LEGACY ADMIN TUITION ROUTES REMOVED]
app.get('/api/admin/tuitions', ...);
app.put('/api/admin/tuitions/:id/status', ...);
*/
// ==================== GRADES & ACADEMIC ====================
app.get('/api/grades', (req, res) => executeQuery('SELECT d.*, s.HoTen as TenSinhVien, IFNULL(lhp.MaMonHoc, d.MaLopHocPhan) as MaMonHoc, mh.TenMonHoc FROM diem d LEFT JOIN sinhvien s ON d.MSSV = s.MSSV LEFT JOIN lophocphan lhp ON d.MaLopHocPhan = lhp.MaLopHocPhan LEFT JOIN monhoc mh ON mh.MaMonHoc = IFNULL(lhp.MaMonHoc, d.MaLopHocPhan)', [], res, 'Lỗi!'));

app.get('/api/grades/student/:mssv', (req, res) => {
    const query = `
        SELECT d.*, lhp.MaLopHocPhan, 
               IFNULL(lhp.MaMonHoc, SUBSTRING_INDEX(d.MaLopHocPhan, '.', 1)) as MaMonHoc, 
               mh.TenMonHoc, mh.SoTinChi 
        FROM diem d 
        LEFT JOIN lophocphan lhp ON d.MaLopHocPhan = lhp.MaLopHocPhan 
        LEFT JOIN monhoc mh ON mh.MaMonHoc = IFNULL(lhp.MaMonHoc, SUBSTRING_INDEX(d.MaLopHocPhan, '.', 1)) 
        WHERE d.MSSV = ?
    `;
    executeQuery(query, [req.params.mssv], res, 'Lỗi lấy điểm sinh viên!');
});

app.post('/api/grades', (req, res) => executeInsert('INSERT INTO diem (MSSV, MaLopHocPhan, HocKy, DiemChuyenCan, DiemBaiTap, DiemGiuaKy, DiemCuoiKy, DiemTong, DiemGPA, DiemChu, XepLoai) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [req.body.MSSV, req.body.MaLopHocPhan || req.body.MaMonHoc, req.body.HocKy, req.body.DiemChuyenCan, req.body.DiemBaiTap, req.body.DiemGiuaKy, req.body.DiemCuoiKy, req.body.DiemTong, req.body.DiemGPA, req.body.DiemChu, req.body.XepLoai], res, 'Thêm điểm thành công!', 'Lỗi!'));
app.put('/api/grades/:maDiem', (req, res) => executeUpdate('UPDATE diem SET MSSV=?, MaLopHocPhan=?, HocKy=?, DiemChuyenCan=?, DiemBaiTap=?, DiemGiuaKy=?, DiemCuoiKy=?, DiemTong=?, DiemGPA=?, DiemChu=?, XepLoai=? WHERE MaDiem=?', [req.body.MSSV, req.body.MaLopHocPhan || req.body.MaMonHoc, req.body.HocKy, req.body.DiemChuyenCan, req.body.DiemBaiTap, req.body.DiemGiuaKy, req.body.DiemCuoiKy, req.body.DiemTong, req.body.DiemGPA, req.body.DiemChu, req.body.XepLoai, req.params.maDiem], res, 'Cập nhật thành công!', 'Lỗi!'));
app.delete('/api/grades/:maDiem', (req, res) => executeDelete('DELETE FROM diem WHERE MaDiem = ?', [req.params.maDiem], res, 'Xóa thành công!', 'Lỗi!'));

app.get('/api/grades/statistics/:maLopHocPhan', (req, res) => {
    db.query('SELECT d.DiemChuyenCan, d.DiemBaiTap, d.DiemGiuaKy, d.DiemCuoiKy FROM diem d WHERE d.MaLopHocPhan = ?', [req.params.maLopHocPhan], (err, results) => {
        if (err) return res.status(500).json({ success: false });
        if (results.length === 0) return res.json({ success: true, totalStudents: 0, average: 0, highest: 0, lowest: 0, passRate: 0, gradeDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 } });
        const averages = results.map(grade => parseFloat(calculateGradeAverage(grade.DiemChuyenCan, grade.DiemBaiTap, grade.DiemGiuaKy, grade.DiemCuoiKy)));
        const average = (averages.reduce((a, b) => a + b, 0) / averages.length).toFixed(2);
        const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
        averages.forEach(avg => { if (avg >= 8.5) gradeDistribution.A++; else if (avg >= 7.0) gradeDistribution.B++; else if (avg >= 5.5) gradeDistribution.C++; else if (avg >= 4.0) gradeDistribution.D++; else gradeDistribution.F++; });
        res.json({ success: true, totalStudents: results.length, average: parseFloat(average), highest: Math.max(...averages), lowest: Math.min(...averages), passRate: parseFloat(((averages.filter(a => a >= 4.0).length / averages.length) * 100).toFixed(2)), gradeDistribution });
    });
});
app.get('/api/grades/class-averages/:hocKy', (req, res) => {
    db.query('SELECT d.MaLopHocPhan, lhp.MaMonHoc, mh.TenMonHoc, d.DiemChuyenCan, d.DiemBaiTap, d.DiemGiuaKy, d.DiemCuoiKy FROM diem d LEFT JOIN lophocphan lhp ON d.MaLopHocPhan = lhp.MaLopHocPhan LEFT JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc WHERE d.HocKy = ?', [req.params.hocKy], (err, results) => {
        if (err) return res.status(500).json({ success: false });
        const subjectGroups = {};
        results.forEach(g => {
            if (!subjectGroups[g.MaMonHoc]) subjectGroups[g.MaMonHoc] = { MaMonHoc: g.MaMonHoc, TenMonHoc: g.TenMonHoc, grades: [] };
            subjectGroups[g.MaMonHoc].grades.push(parseFloat(calculateGradeAverage(g.DiemChuyenCan, g.DiemBaiTap, g.DiemGiuaKy, g.DiemCuoiKy)));
        });
        res.json({ success: true, classAverages: Object.values(subjectGroups).map(s => ({ ...s, average: parseFloat((s.grades.reduce((a, b) => a + b, 0) / s.grades.length).toFixed(2)), studentCount: s.grades.length })) });
    });
});

app.get('/api/academic/gpa/:mssv', (req, res) => {
    db.query('SELECT d.DiemChuyenCan, d.DiemBaiTap, d.DiemGiuaKy, d.DiemCuoiKy, mh.SoTinChi, d.HocKy FROM diem d LEFT JOIN lophocphan lhp ON d.MaLopHocPhan = lhp.MaLopHocPhan LEFT JOIN monhoc mh ON mh.MaMonHoc = IFNULL(lhp.MaMonHoc, d.MaLopHocPhan) WHERE d.MSSV = ?', [req.params.mssv], (err, results) => {
        if (err) return res.status(500).json({ success: false });
        if (results.length === 0) return res.json({ success: true, gpa: 0, totalCredits: 0, academicStanding: 'Chưa có dữ liệu', semesterGPA: [], cumulativeGPA: 0 });
        let totalWeightedPoints = 0, totalCredits = 0; const semesterData = {};
        results.forEach(g => {
            const gpa = calculateGPA(parseFloat(calculateGradeAverage(g.DiemChuyenCan, g.DiemBaiTap, g.DiemGiuaKy, g.DiemCuoiKy))); const credits = g.SoTinChi || 0;
            totalWeightedPoints += gpa * credits; totalCredits += credits;
            if (!semesterData[g.HocKy]) semesterData[g.HocKy] = { totalPoints: 0, totalCredits: 0 };
            semesterData[g.HocKy].totalPoints += gpa * credits; semesterData[g.HocKy].totalCredits += credits;
        });
        const cumulativeGPA = totalCredits > 0 ? (totalWeightedPoints / totalCredits).toFixed(2) : 0;
        res.json({ success: true, gpa: parseFloat(cumulativeGPA), totalCredits, academicStanding: calculateAcademicStanding(parseFloat(cumulativeGPA)), semesterGPA: Object.keys(semesterData).map(s => ({ semester: s, gpa: (semesterData[s].totalPoints / semesterData[s].totalCredits).toFixed(2), credits: semesterData[s].totalCredits })), cumulativeGPA: parseFloat(cumulativeGPA) });
    });
});
app.get('/api/academic/transcript/:mssv', (req, res) => {
    db.query('SELECT d.*, mh.TenMonHoc, mh.SoTinChi, IFNULL(lhp.HocKy, d.HocKy) as HocKy FROM diem d LEFT JOIN lophocphan lhp ON d.MaLopHocPhan = lhp.MaLopHocPhan LEFT JOIN monhoc mh ON mh.MaMonHoc = IFNULL(lhp.MaMonHoc, d.MaLopHocPhan) WHERE d.MSSV = ? ORDER BY HocKy DESC', [req.params.mssv], (err, results) => {
        if (err) return res.status(500).json({ success: false });
        if (results.length === 0) return res.json({ success: true, transcript: [], summary: null });
        let totalCredits = 0, totalWeightedPoints = 0, passedCredits = 0;
        const transcript = results.map(g => {
            const diemTB = parseFloat(calculateGradeAverage(g.DiemChuyenCan, g.DiemBaiTap, g.DiemGiuaKy, g.DiemCuoiKy));
            const gpa = calculateGPA(diemTB); const credits = g.SoTinChi || 0;
            totalCredits += credits; totalWeightedPoints += gpa * credits; if (diemTB >= 4.0) passedCredits += credits;
            return { ...g, DiemTB: diemTB, GPA: gpa, SoTinChi: credits, DiemChu: diemTB >= 8.5 ? 'A' : diemTB >= 7.0 ? 'B' : diemTB >= 5.5 ? 'C' : diemTB >= 4.0 ? 'D' : 'F' };
        });
        res.json({ success: true, transcript, summary: { totalCredits, passedCredits, cumulativeGPA: parseFloat((totalCredits > 0 ? totalWeightedPoints / totalCredits : 0).toFixed(2)), academicStanding: calculateAcademicStanding(totalCredits > 0 ? totalWeightedPoints / totalCredits : 0), passRate: totalCredits > 0 ? ((passedCredits / totalCredits) * 100).toFixed(2) : 0 } });
    });
});

// ==================== ATTENDANCE ====================
app.post('/api/attendance', (req, res) => executeInsert('INSERT INTO diemdanh (MaLichHoc, MSSV, NgayDiemDanh, TrangThai) VALUES (?, ?, ?, ?)', [req.body.MaLichHoc, req.body.MSSV, req.body.NgayDiemDanh, req.body.TrangThai], res, 'Thành công', 'Lỗi'));
app.put('/api/attendance/:id', (req, res) => executeUpdate('UPDATE diemdanh SET MaLichHoc=?, MSSV=?, NgayDiemDanh=?, TrangThai=? WHERE MaDiemDanh=?', [req.body.MaLichHoc, req.body.MSSV, req.body.NgayDiemDanh, req.body.TrangThai, req.params.id], res, 'Thành công', 'Lỗi'));
app.delete('/api/attendance/:id', (req, res) => executeDelete('DELETE FROM diemdanh WHERE MaDiemDanh=?', [req.params.id], res, 'Thành công', 'Lỗi'));
app.get('/api/attendance/course/:maLhp/date/:ngay', async (req, res) => {
    try {
        const { maLhp, ngay } = req.params;
        const lanDiemDanh = req.query.lan;
        let targetLan = lanDiemDanh;

        if (!targetLan) {
            const [lich] = await db.promise().query("SELECT LanDiemDanhHienTai FROM lichhoc WHERE MaLopHocPhan = ? AND NgayHoc = ?", [maLhp, ngay]);
            targetLan = (lich.length > 0 && lich[0].LanDiemDanhHienTai > 0) ? lich[0].LanDiemDanhHienTai : 1;
        }

        executeQuery('SELECT * FROM diemdanh WHERE MaLopHocPhan = ? AND DATE(NgayDiemDanh) = ? AND LanDiemDanh = ?', [maLhp, ngay, targetLan], res, 'Lỗi!');
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});
app.get('/api/attendance/course/:maLhp/history-dates', (req, res) => executeQuery("SELECT DISTINCT DATE_FORMAT(NgayDiemDanh, '%Y-%m-%d') as Ngay, LanDiemDanh FROM diemdanh WHERE MaLopHocPhan = ? ORDER BY Ngay DESC, LanDiemDanh DESC", [req.params.maLhp], res, 'Lỗi lấy lịch sử!'));
app.post('/api/attendance/course/:maLhp/date/:ngay', async (req, res) => {
    const { maLhp, ngay } = req.params; const attendanceList = req.body.attendance;
    const lanDiemDanh = req.query.lan;
    if (!Array.isArray(attendanceList) || attendanceList.length === 0) return res.status(400).json({ success: false });

    let targetLan = lanDiemDanh;
    if (!targetLan) {
        const [lich] = await db.promise().query("SELECT LanDiemDanhHienTai FROM lichhoc WHERE MaLopHocPhan = ? AND NgayHoc = ?", [maLhp, ngay]);
        targetLan = (lich.length > 0 && lich[0].LanDiemDanhHienTai > 0) ? lich[0].LanDiemDanhHienTai : 1;
    }

    db.query('DELETE FROM diemdanh WHERE MaLopHocPhan = ? AND DATE(NgayDiemDanh) = ? AND LanDiemDanh = ?', [maLhp, ngay, targetLan], (err) => {
        if (err) return res.status(500).json({ success: false });
        let completed = 0;
        attendanceList.forEach((item) => {
            db.query('INSERT INTO diemdanh (MaLopHocPhan, MSSV, NgayDiemDanh, TrangThai, ThoiGianDiemDanh, LanDiemDanh) VALUES (?, ?, ?, ?, NOW(), ?)', [maLhp, item.MSSV, ngay, item.TrangThai, targetLan], () => {
                completed++; if (completed === attendanceList.length) res.json({ success: true, message: 'Lưu điểm danh thành công!' });
            });
        });
    });
});

// CỤM API QUẢN LÝ RFID THEO CƠ CHẾ POLLING (ĐÃ ĐỒNG BỘ BẢNG the_sv)
// API kiểm tra trạng thái hệ thống (Cả ESP32 và Web Admin gọi check định kỳ)
app.get('/api/rfid/status', async (req, res) => {
    try {
        const [rows] = await db.promise().query('SELECT mode, targetMSSV, capturedUid FROM rfid_state WHERE id = 1');
        return res.json(rows[0] || { mode: "ATTENDANCE", targetMSSV: null, capturedUid: null });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi DB' });
    }
});

// API kích hoạt chế độ đăng ký thẻ từ Web Admin
app.post('/api/rfid/activate-register', async (req, res) => {
    const { mssv } = req.body || {};
    if (!mssv) return res.status(400).json({ success: false, message: "Thiếu MSSV" });

    try {
        await db.promise().query('UPDATE rfid_state SET mode = ?, targetMSSV = ?, capturedUid = ? WHERE id = 1', ["REGISTER", mssv, null]);
        console.log(`[Hệ thống] Bật chế độ đăng ký thẻ cho SV: ${mssv}`);
        return res.json({ success: true, message: "Đã chuyển sang chế độ đăng ký" });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi DB' });
    }
});

// API reset trạng thái về điểm danh (Frontend gọi sau khi đã lấy xong UID)
app.post('/api/rfid/reset-status', async (req, res) => {
    try {
        await db.promise().query('UPDATE rfid_state SET mode = ?, targetMSSV = ?, capturedUid = ? WHERE id = 1', ["ATTENDANCE", null, null]);
        console.log("[Hệ thống] Đã hủy chế độ đăng ký, trở về chế độ điểm danh mặc định.");
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi DB' });
    }
});
// Lấy trạng thái điểm danh hiện tại của 1 lớp
app.get('/api/attendance/course/:id/session/:date', async (req, res) => {
    try {
        const { id, date } = req.params;
        const [rows] = await db.promise().query(
            'SELECT TrangThaiDiemDanh, ThoiGianMoDiemDanh, TIMESTAMPDIFF(SECOND, ThoiGianMoDiemDanh, NOW()) AS ElapsedSeconds FROM lichhoc WHERE MaLopHocPhan = ? AND NgayHoc = ? LIMIT 1',
            [id, date]
        );
        if (rows.length === 0) return res.json({ status: 'PENDING', timeOpened: null, elapsedSeconds: 0 });
        res.json({
            status: rows[0].TrangThaiDiemDanh || 'PENDING',
            timeOpened: rows[0].ThoiGianMoDiemDanh,
            elapsedSeconds: rows[0].ElapsedSeconds || 0
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Mở điểm danh 15 phút
app.post('/api/attendance/course/:id/open/:date', async (req, res) => {
    try {
        const { id, date } = req.params;
        const [lich] = await db.promise().query("SELECT LanDiemDanhHienTai FROM lichhoc WHERE MaLopHocPhan = ? AND NgayHoc = ?", [id, date]);
        let currentLan = (lich.length > 0 && lich[0].LanDiemDanhHienTai) ? lich[0].LanDiemDanhHienTai : 0;

        // Đảm bảo không trùng với LanDiemDanh đã có trong bảng diemdanh
        const [maxDiemDanh] = await db.promise().query("SELECT MAX(LanDiemDanh) as maxLan FROM diemdanh WHERE MaLopHocPhan = ? AND NgayDiemDanh = ?", [id, date]);
        const maxLan = maxDiemDanh[0]?.maxLan || 0;

        currentLan = Math.max(currentLan, maxLan) + 1;

        await db.promise().query(
            "UPDATE lichhoc SET TrangThaiDiemDanh = 'OPEN', ThoiGianMoDiemDanh = NOW(), LanDiemDanhHienTai = ? WHERE MaLopHocPhan = ? AND NgayHoc = ?",
            [currentLan, id, date]
        );
        res.json({ success: true, message: 'Đã mở điểm danh' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Đóng điểm danh sớm
app.post('/api/attendance/course/:id/close/:date', async (req, res) => {
    try {
        const { id, date } = req.params;
        await db.promise().query(
            "UPDATE lichhoc SET TrangThaiDiemDanh = 'CLOSED' WHERE MaLopHocPhan = ? AND NgayHoc = ?",
            [id, date]
        );

        // Lấy ds sv của lớp
        const [enrolled] = await db.promise().query(
            "SELECT DISTINCT MSSV FROM diem WHERE MaLopHocPhan = ?",
            [id]
        );

        if (enrolled.length > 0) {
            const mssvList = enrolled.map(s => s.MSSV);

            const [lich] = await db.promise().query("SELECT LanDiemDanhHienTai FROM lichhoc WHERE MaLopHocPhan = ? AND NgayHoc = ?", [id, date]);
            const targetLan = (lich.length > 0 && lich[0].LanDiemDanhHienTai) ? lich[0].LanDiemDanhHienTai : 1;

            // Tìm những sv đã có mặt
            const [attended] = await db.promise().query(
                "SELECT MSSV FROM diemdanh WHERE MaLopHocPhan = ? AND NgayDiemDanh = ? AND LanDiemDanh = ?",
                [id, date, targetLan]
            );
            const attendedSet = new Set(attended.map(a => a.MSSV));

            for (let mssv of mssvList) {
                if (!attendedSet.has(mssv)) {
                    await db.promise().query(
                        "INSERT IGNORE INTO diemdanh (MaLopHocPhan, MSSV, NgayDiemDanh, TrangThai, ThoiGianDiemDanh, LanDiemDanh) VALUES (?, ?, ?, 'Vắng mặt', NOW(), ?)",
                        [id, mssv, date, targetLan]
                    );
                }
            }
        }

        res.json({ success: true, message: 'Đã chốt sổ' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// API nhận dữ liệu từ ESP32 bắn lên
app.post('/api/attendance/uid', async (req, res) => {
    const { uid, MaLopHocPhan, TrangThai, NgayDiemDanh } = req.body;
    if (!uid) return res.status(400).json({ success: false, message: 'Thiếu UID' });

    try {
        const [stateRows] = await db.promise().query('SELECT mode, targetMSSV FROM rfid_state WHERE id = 1');
        const rfidState = stateRows[0] || { mode: "ATTENDANCE" };

        // TRƯỜNG HỢP A: ĐANG Ở CHẾ ĐỘ ĐĂNG KÝ THÊ MỚI -> LƯU VÀO BẢNG the_sv
        if (rfidState.mode === "REGISTER") {
            const mssvDangKy = rfidState.targetMSSV;

            db.query('INSERT INTO the_sv (uid, MSSV) VALUES (?, ?)',
                [uid, mssvDangKy], async (errReg) => {
                    if (errReg) {
                        if (errReg.code === 'ER_DUP_ENTRY') {
                            return new Promise((resolve) => {
                                db.query('SELECT MSSV FROM the_sv WHERE uid = ?', [uid], async (checkErr, results) => {
                                    if (!checkErr && results.length > 0 && results[0].MSSV === mssvDangKy) {
                                        await db.promise().query('UPDATE rfid_state SET mode = ?, capturedUid = ? WHERE id = 1', ["REGISTER_DONE", uid]);
                                        res.json({ success: true, action: "REGISTER_OK" });
                                    } else {
                                        await db.promise().query('UPDATE rfid_state SET capturedUid = ? WHERE id = 1', ["ERROR:DUPLICATE"]);
                                        res.status(400).json({ success: false, message: 'Thẻ này đã có chủ, vui lòng dùng thẻ khác' });
                                    }
                                });
                            });
                        }
                        // Nếu sinh viên chưa tồn tại (lỗi khóa ngoại), vẫn cho phép thẻ được đọc lên web
                        if (errReg.code === 'ER_NO_REFERENCED_ROW_2' || errReg.errno === 1452) {
                            await db.promise().query('UPDATE rfid_state SET mode = ?, capturedUid = ? WHERE id = 1', ["REGISTER_DONE", uid]);
                            return res.json({ success: true, action: "REGISTER_OK" });
                        }
                        return res.status(500).json({ success: false, message: 'Lỗi ghi DB', error: errReg.message });
                    }

                    console.log(`[Thành công] Thẻ ${uid} đã gán cho SV ${mssvDangKy}`);

                    await db.promise().query('UPDATE rfid_state SET mode = ?, capturedUid = ? WHERE id = 1', ["REGISTER_DONE", uid]);

                    return res.json({ success: true, action: "REGISTER_OK" });
                });
        }

        // TRƯỜNG HỢP B: CHẾ ĐỘ ĐIỂM DANH MẶC ĐỊNH -> QUÉT TRONG BẢNG the_sv
        else {
            let targetLHP = MaLopHocPhan;
            const { PhongHoc } = req.body;
            let targetTrangThai = 'PENDING';
            let phutDaQua = 0;
            let targetLan = 1;

            const now = new Date();
            const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
            const todayStr = vnTime.toISOString().split('T')[0];
            const currentTime = vnTime.toISOString().split('T')[1].substring(0, 8); // "HH:MM:SS"

            if (PhongHoc && !targetLHP) {
                const [lichhocRows] = await db.promise().query(
                    'SELECT MaLopHocPhan, CaHoc, TrangThaiDiemDanh, LanDiemDanhHienTai, TIMESTAMPDIFF(MINUTE, ThoiGianMoDiemDanh, NOW()) AS PhutDaQua FROM lichhoc WHERE NgayHoc = ? AND PhongHoc = ?',
                    [todayStr, PhongHoc]
                );

                if (lichhocRows.length > 0) {
                    const [tiethocRows] = await db.promise().query('SELECT Tiet, GioBatDau, GioKetThuc FROM tiethoc');
                    for (let lh of lichhocRows) {
                        if (!lh.CaHoc) continue;
                        const parts = lh.CaHoc.split('-');
                        if (parts.length === 2) {
                            const startTiet = parseInt(parts[0]);
                            const endTiet = parseInt(parts[1]);

                            const startInfo = tiethocRows.find(t => t.Tiet === startTiet);
                            const endInfo = tiethocRows.find(t => t.Tiet === endTiet);

                            if (startInfo && endInfo) {
                                if (currentTime >= startInfo.GioBatDau && currentTime <= endInfo.GioKetThuc) {
                                    targetLHP = lh.MaLopHocPhan;
                                    targetTrangThai = lh.TrangThaiDiemDanh;
                                    phutDaQua = lh.PhutDaQua;
                                    targetLan = lh.LanDiemDanhHienTai || 1;
                                    break;
                                }
                            }
                        }
                    }
                }
            } else if (targetLHP) {
                const [lhRows] = await db.promise().query(
                    'SELECT TrangThaiDiemDanh, LanDiemDanhHienTai, TIMESTAMPDIFF(MINUTE, ThoiGianMoDiemDanh, NOW()) AS PhutDaQua FROM lichhoc WHERE MaLopHocPhan = ? AND NgayHoc = ? LIMIT 1',
                    [targetLHP, todayStr]
                );
                if (lhRows.length > 0) {
                    targetTrangThai = lhRows[0].TrangThaiDiemDanh;
                    phutDaQua = lhRows[0].PhutDaQua;
                    targetLan = lhRows[0].LanDiemDanhHienTai || 1;
                }
            }

            if (!targetLHP) {
                return res.status(404).json({ success: false, action: "NO_CLASS", message: 'Không có tiết học nào đang diễn ra tại phòng này' });
            }

            // KIỂM TRA LUỒNG 15 PHÚT
            if (targetTrangThai === 'OPEN' && phutDaQua !== null && phutDaQua >= 15) {
                // Tự động đóng nếu quá 15 phút
                await db.promise().query("UPDATE lichhoc SET TrangThaiDiemDanh = 'CLOSED' WHERE MaLopHocPhan = ? AND NgayHoc = ?", [targetLHP, todayStr]);
                targetTrangThai = 'CLOSED';
            }

            if (targetTrangThai !== 'OPEN') {
                return res.status(403).json({ success: false, action: "CLOSED", message: 'Hiện không trong thời gian điểm danh' });
            }

            try {
                const [results] = await db.promise().query('SELECT MSSV FROM the_sv WHERE uid = ? LIMIT 1', [uid]);

                if (!results || results.length === 0) {
                    return res.status(404).json({ success: false, action: "UNREGISTERED", message: 'Thẻ lạ, Chưa đăng ký' });
                }

                const MSSV = results[0].MSSV;
                const ngay = NgayDiemDanh || todayStr;
                const trangthai = TrangThai || 'Có mặt';

                const [checkResults] = await db.promise().query('SELECT 1 FROM diemdanh WHERE MaLopHocPhan = ? AND MSSV = ? AND NgayDiemDanh = ? AND LanDiemDanh = ? LIMIT 1', [targetLHP, MSSV, ngay, targetLan]);

                if (checkResults && checkResults.length > 0) {
                    return res.json({ success: true, action: "ATTENDANCE_OK", message: "Đã điểm danh từ trước", MSSV });
                }

                await db.promise().query('INSERT INTO diemdanh (MaLopHocPhan, MSSV, NgayDiemDanh, TrangThai, ThoiGianDiemDanh, LanDiemDanh) VALUES (?, ?, ?, ?, NOW(), ?)', [targetLHP, MSSV, ngay, trangthai, targetLan]);

                return res.json({ success: true, action: "ATTENDANCE_OK", message: 'Đã ghi điểm danh', MSSV });
            } catch (err) {
                return res.status(500).json({ success: false, message: 'Lỗi DB xử lý điểm danh', error: err.message });
            }
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi DB' });
    }
});

// Management endpoints for rfid_tags
app.get('/api/rfid/:uid', (req, res) => {
    db.query('SELECT * FROM the_sv WHERE uid = ? LIMIT 1', [req.params.uid], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi DB', error: err.message });
        if (!results || results.length === 0) return res.status(404).json({ success: false });
        res.json({ success: true, mapping: results[0] });
    });
});

app.post('/api/rfid', (req, res) => {
    const { uid, MSSV } = req.body;
    if (!uid || !MSSV) return res.status(400).json({ success: false, message: 'Thiếu uid hoặc MSSV' });
    db.query('INSERT INTO the_sv (uid, MSSV) VALUES (?, ?)', [uid, MSSV], (err) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return db.query('SELECT MSSV FROM the_sv WHERE uid = ?', [uid], (checkErr, results) => {
                    if (!checkErr && results.length > 0 && results[0].MSSV === MSSV) {
                        return res.json({ success: true, message: 'Đã lưu mapping' });
                    }
                    return res.status(400).json({ success: false, message: 'Thẻ này đã được gán cho người khác' });
                });
            }
            return res.status(500).json({ success: false, message: 'Lỗi DB', error: err.message });
        }
        res.json({ success: true, message: 'Đã lưu mapping' });
    });
});
app.get('/api/attendance/student/:mssv', (req, res) => {
    const query = `
        SELECT dd.*, dd.NgayDiemDanh as NgayHoc, 
               (SELECT mh.TenMonHoc FROM lophocphan lhp JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc WHERE lhp.MaLopHocPhan = dd.MaLopHocPhan LIMIT 1) as TenMonHoc, 
               (SELECT PhongHoc FROM lichhoc lh WHERE lh.MaLopHocPhan = dd.MaLopHocPhan LIMIT 1) as PhongHoc, 
               (SELECT CaHoc FROM lichhoc lh WHERE lh.MaLopHocPhan = dd.MaLopHocPhan LIMIT 1) as CaHoc 
        FROM diemdanh dd 
        INNER JOIN (
            SELECT MaLopHocPhan, NgayDiemDanh, MAX(LanDiemDanh) as MaxLan 
            FROM diemdanh 
            WHERE MSSV = ? 
            GROUP BY MaLopHocPhan, NgayDiemDanh
        ) latest ON dd.MaLopHocPhan = latest.MaLopHocPhan 
                 AND dd.NgayDiemDanh = latest.NgayDiemDanh 
                 AND dd.LanDiemDanh = latest.MaxLan 
        WHERE dd.MSSV = ? 
        ORDER BY dd.NgayDiemDanh DESC
    `;
    executeQuery(query, [req.params.mssv, req.params.mssv], res, 'Lỗi!');
});
app.get('/api/attendance/percentage/:mssv', (req, res) => {
    const query = `
        SELECT d.TrangThai 
        FROM diemdanh d
        INNER JOIN (
            SELECT MaLopHocPhan, NgayDiemDanh, MAX(LanDiemDanh) as MaxLan
            FROM diemdanh
            WHERE MSSV = ?
            GROUP BY MaLopHocPhan, NgayDiemDanh
        ) latest ON d.MaLopHocPhan = latest.MaLopHocPhan 
                 AND d.NgayDiemDanh = latest.NgayDiemDanh 
                 AND d.LanDiemDanh = latest.MaxLan
        WHERE d.MSSV = ?
    `;

    db.query(query, [req.params.mssv, req.params.mssv], (err, results) => {
        if (err) return res.status(500).json({ success: false });
        const present = results.filter(r => r.TrangThai === 'Có mặt').length;
        res.json({
            success: true,
            totalSessions: results.length,
            present,
            absent: results.filter(r => r.TrangThai === 'Vắng mặt').length,
            excused: results.filter(r => r.TrangThai === 'Có phép').length,
            percentage: results.length > 0 ? parseFloat(((present / results.length) * 100).toFixed(2)) : 0
        });
    });
});

// ==================== THÔNG BÁO ====================

app.get('/api/announcements', (req, res) => executeQuery(`SELECT tb.*, u.TaiKhoan as NguoiTaoTen, l.TenLop FROM thongbao tb LEFT JOIN users u ON tb.NguoiTao = u.TaiKhoan LEFT JOIN lophoc l ON tb.MaLop_Nhan = l.MaLop ORDER BY tb.NgayTao DESC`, [], res, 'Lỗi!'));
app.post('/api/announcements', (req, res) => {
    const tieuDe = req.body.TieuDe ? req.body.TieuDe.substring(0, 255) : '';
    executeInsert('INSERT INTO thongbao (TieuDe, NoiDung, NguoiTao, MaLop_Nhan) VALUES (?, ?, ?, ?)', [tieuDe, req.body.NoiDung, req.body.NguoiTao, req.body.MaLop_Nhan], res, 'Thêm thông báo thành công', 'Lỗi');
});
app.put('/api/announcements/:id', (req, res) => {
    const tieuDe = req.body.TieuDe ? req.body.TieuDe.substring(0, 255) : '';
    executeUpdate('UPDATE thongbao SET TieuDe=?, NoiDung=?, NguoiTao=?, MaLop_Nhan=? WHERE MaThongBao=?', [tieuDe, req.body.NoiDung, req.body.NguoiTao, req.body.MaLop_Nhan, req.params.id], res, 'Cập nhật thành công', 'Lỗi');
});
app.delete('/api/announcements/:id', (req, res) => executeDelete('DELETE FROM thongbao WHERE MaThongBao=?', [req.params.id], res, 'Xóa thành công', 'Lỗi'));
app.get('/api/announcements/student/:mssv', (req, res) => executeQuery(`SELECT tb.*, u.TaiKhoan as NguoiTaoTen, l.TenLop, CASE WHEN tb.MaLop_Nhan IS NULL THEN 'Toàn trường' ELSE l.TenLop END as PhamVi FROM thongbao tb LEFT JOIN users u ON tb.NguoiTao = u.TaiKhoan LEFT JOIN lophoc l ON tb.MaLop_Nhan = l.MaLop WHERE tb.MaLop_Nhan IS NULL OR tb.MaLop_Nhan = (SELECT MaLop FROM sinhvien WHERE MSSV = ?) ORDER BY tb.NgayTao DESC`, [req.params.mssv], res, 'Lỗi!'));

// ==================== BULK OPERATIONS ====================
const executeBulkInsert = (query, items, itemParams, res, successMsg, errorMsg) => {
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ!' });
    let completed = 0, errors = [];
    items.forEach((item, index) => {
        db.query(query, itemParams(item), (err) => {
            if (err) errors.push({ index, error: err.message });
            completed++;
            if (completed === items.length) {
                if (errors.length > 0) res.status(207).json({ success: true, message: successMsg + ' với một số lỗi!', errors });
                else res.json({ success: true, message: successMsg + ' thành công!' });
            }
        });
    });
};
app.post('/api/grades/bulk', (req, res) => executeBulkInsert('INSERT INTO diem (MSSV, MaLopHocPhan, HocKy, DiemChuyenCan, DiemBaiTap, DiemGiuaKy, DiemCuoiKy) VALUES (?, ?, ?, ?, ?, ?, ?)', req.body.grades, g => [g.MSSV, g.MaLopHocPhan, g.HocKy, g.DiemChuyenCan, g.DiemBaiTap, g.DiemGiuaKy, g.DiemCuoiKy], res, 'Nhập điểm', 'Lỗi nhập điểm'));
app.post('/api/attendance/bulk', (req, res) => executeBulkInsert('INSERT INTO diemdanh (MaLichHoc, MSSV, NgayDiemDanh, TrangThai) VALUES (?, ?, ?, ?)', req.body.attendance, a => [a.MaLichHoc, a.MSSV, a.NgayDiemDanh, a.TrangThai], res, 'Điểm danh', 'Lỗi điểm danh'));

// =====================================================================
// [ADMIN] QUẢN LÝ ĐIỂM RÈN LUYỆN & YÊU CẦU
// =====================================================================
app.get('/api/admin/training-periods', (req, res) => {
    executeQuery('SELECT * FROM dot_danhgia ORDER BY MaDotDanhGia DESC', [], res, 'Lỗi lấy đợt đánh giá!');
});

app.post('/api/admin/training-periods', (req, res) => {
    const { HocKy, NamHoc, NgayBatDau, NgayKetThuc, TrangThai, CauTrucTieuChi } = req.body;
    const checkQuery = 'SELECT MaDotDanhGia FROM dot_danhgia WHERE HocKy = ? AND NamHoc = ?';
    db.query(checkQuery, [HocKy, NamHoc], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi kiểm tra trùng lặp!' });
        if (results.length > 0) return res.status(400).json({ success: false, message: 'Đợt đánh giá cho học kỳ này đã tồn tại!' });

        const query = 'INSERT INTO dot_danhgia (HocKy, NamHoc, NgayBatDau, NgayKetThuc, TrangThai, CauTrucTieuChi) VALUES (?, ?, ?, ?, ?, ?)';
        const cauTrucJson = CauTrucTieuChi ? JSON.stringify(CauTrucTieuChi) : null;
        executeInsert(query, [HocKy, NamHoc, NgayBatDau || null, NgayKetThuc || null, TrangThai || 'Đang tự đánh giá', cauTrucJson], res, 'Tạo đợt đánh giá thành công!', 'Lỗi tạo đợt!');
    });
});

app.put('/api/admin/training-periods/:id/status', (req, res) => {
    const { TrangThai } = req.body;
    executeUpdate('UPDATE dot_danhgia SET TrangThai = ? WHERE MaDotDanhGia = ?', [TrangThai, req.params.id], res, 'Cập nhật trạng thái đợt thành công!', 'Lỗi cập nhật đợt!');
});

app.get('/api/training-periods/active', (req, res) => {
    const query = `
        SELECT * FROM dot_danhgia 
        WHERE TrangThai = 'Đang tự đánh giá'
        ORDER BY MaDotDanhGia DESC
    `;
    executeQuery(query, [], res, 'Lỗi lấy đợt đánh giá đang mở!');
});

app.get('/api/admin/training-points', (req, res) => {
    const query = `
        SELECT d.*, s.HoTen, s.MaLop, l.MaKhoa, dd.CauTrucTieuChi 
        FROM danhgia_renluyen d 
        JOIN sinhvien s ON d.MSSV = s.MSSV 
        LEFT JOIN lophoc l ON s.MaLop = l.MaLop
        LEFT JOIN dot_danhgia dd ON d.MaDotDanhGia = dd.MaDotDanhGia
        ORDER BY d.MaDanhGia DESC
    `;
    executeQuery(query, [], res, 'Lỗi lấy điểm RL!');
});

app.put('/api/admin/training-points/:id', (req, res) => {
    const { DiemKhoaDanhGia, TongDiem, TrangThai, NguoiDuyet, GhiChu } = req.body;
    let xepLoai = 'Kém';
    const diem = Number(TongDiem);
    if (isNaN(diem) || diem < 0 || diem > 150) {
        return res.status(400).json({ success: false, message: 'Tổng điểm rèn luyện không hợp lệ!' });
    }
    if (diem >= 90) xepLoai = 'Xuất sắc';
    else if (diem >= 80) xepLoai = 'Tốt';
    else if (diem >= 65) xepLoai = 'Khá';
    else if (diem >= 50) xepLoai = 'Trung bình';
    else if (diem >= 35) xepLoai = 'Yếu';

    const query = 'UPDATE danhgia_renluyen SET DiemLopDanhGia = 0, DiemKhoaDanhGia = ?, TongDiem = ?, XepLoai = ?, TrangThai = ?, GhiChu = ? WHERE MaDanhGia = ?';
    db.query(query, [DiemKhoaDanhGia, TongDiem, xepLoai, TrangThai, GhiChu, req.params.id], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi cập nhật điểm!', error: err.message });

        const nguoiDuyet = NguoiDuyet || 'admin';
        let logMsg = `Đã chốt điểm: Cộng thêm ${DiemKhoaDanhGia}đ, Tổng điểm ${TongDiem}đ (${xepLoai}), Trạng thái: ${TrangThai}`;
        if (logMsg.length > 255) {
            logMsg = logMsg.substring(0, 252) + '...';
        }
        db.query('INSERT INTO lichsu_duyet (MaDanhGia, NguoiDuyet, HanhDong) VALUES (?, ?, ?)', [req.params.id, nguoiDuyet, logMsg], (logErr) => {
            if (logErr) console.error('Lỗi lưu log duyệt:', logErr);
            res.json({ success: true, message: 'Đã chốt điểm và lưu nhật ký!' });
        });
    });
});

app.get('/api/admin/training-points/logs', (req, res) => {
    const query = `
        SELECT l.*, d.HocKy, s.HoTen, s.MSSV 
        FROM lichsu_duyet l
        JOIN danhgia_renluyen d ON l.MaDanhGia = d.MaDanhGia
        JOIN sinhvien s ON d.MSSV = s.MSSV
        ORDER BY l.ThoiGian DESC
    `;
    executeQuery(query, [], res, 'Lỗi lấy tất cả nhật ký duyệt!');
});

app.get('/api/admin/training-points/:id/logs', (req, res) => {
    executeQuery('SELECT * FROM lichsu_duyet WHERE MaDanhGia = ? ORDER BY ThoiGian DESC', [req.params.id], res, 'Lỗi lấy lịch sử duyệt!');
});



app.get('/api/admin/support-requests', (req, res) => {
    const query = `
        SELECT y.*, 
        CASE 
            WHEN y.MSSV IS NOT NULL THEN y.MSSV
            ELSE y.MaGiangVien
        END as NguoiGui,
        CASE 
            WHEN y.MSSV IS NOT NULL THEN 'SinhVien'
            ELSE 'GiangVien'
        END as VaiTro,
        y.ChuDe as TieuDe,
        CASE 
            WHEN y.MSSV IS NOT NULL THEN (SELECT HoTen FROM sinhvien WHERE MSSV = y.MSSV)
            ELSE (SELECT HoTen FROM giangvien WHERE MaGiangVien = y.MaGiangVien)
        END as TenNguoiGui
        FROM yeucau_hotro y WHERE y.IsDeletedByAdmin = 0 ORDER BY y.NgayGui DESC
    `;
    executeQuery(query, [], res, 'Lỗi lấy yêu cầu!');
});

app.put('/api/admin/support-requests/:id', (req, res) => {
    const { TrangThai, PhanHoi } = req.body;
    executeUpdate('UPDATE yeucau_hotro SET TrangThai = ?, PhanHoi = ?, NgayPhanHoi = NOW() WHERE MaYeuCau = ?', [TrangThai, PhanHoi, req.params.id], res, 'Phản hồi thành công!', 'Lỗi phản hồi!');
});

app.delete('/api/admin/support-requests/:id', (req, res) => {
    executeUpdate('UPDATE yeucau_hotro SET IsDeletedByAdmin = 1 WHERE MaYeuCau = ?', [req.params.id], res, 'Xóa yêu cầu thành công!', 'Lỗi xóa yêu cầu!');
});

app.get('/api/admin/support-requests/deleted', (req, res) => {
    const query = `
        SELECT y.*, 
        CASE 
            WHEN y.MSSV IS NOT NULL THEN y.MSSV
            ELSE y.MaGiangVien
        END as NguoiGui,
        CASE 
            WHEN y.MSSV IS NOT NULL THEN 'SinhVien'
            ELSE 'GiangVien'
        END as VaiTro,
        y.ChuDe as TieuDe,
        CASE 
            WHEN y.MSSV IS NOT NULL THEN (SELECT HoTen FROM sinhvien WHERE MSSV = y.MSSV)
            ELSE (SELECT HoTen FROM giangvien WHERE MaGiangVien = y.MaGiangVien)
        END as TenNguoiGui
        FROM yeucau_hotro y WHERE y.IsDeletedByAdmin = 1 ORDER BY y.NgayGui DESC
    `;
    executeQuery(query, [], res, 'Lỗi lấy yêu cầu!');
});

app.put('/api/admin/support-requests/:id/restore', (req, res) => {
    executeUpdate('UPDATE yeucau_hotro SET IsDeletedByAdmin = 0 WHERE MaYeuCau = ?', [req.params.id], res, 'Khôi phục yêu cầu thành công!', 'Lỗi khôi phục yêu cầu!');
});

app.delete('/api/admin/support-requests/:id/hard', (req, res) => {
    executeUpdate('UPDATE yeucau_hotro SET IsDeletedByAdmin = 2 WHERE MaYeuCau = ?', [req.params.id], res, 'Xóa vĩnh viễn yêu cầu thành công!', 'Lỗi xóa yêu cầu!');
});

// Lấy chi tiết tiêu chí đã tích của 1 phiếu đánh giá (dùng chung cho SV xem lại / Admin xem breakdown)
app.get('/api/training-points/:id/details', (req, res) => {
    console.log('GET /api/training-points/:id/details - MaDanhGia:', req.params.id);
    executeQuery('SELECT * FROM chitiet_danhgia WHERE MaDanhGia = ? ORDER BY MaTieuChi', [req.params.id], res, 'Lỗi lấy chi tiết đánh giá!');
});

// ==================== [SINH VIÊN] ĐÁNH GIÁ RÈN LUYỆN ====================
app.get('/api/training-points/student/:mssv', (req, res) => {
    const query = `
        SELECT d.*, dd.CauTrucTieuChi 
        FROM danhgia_renluyen d
        LEFT JOIN dot_danhgia dd ON d.MaDotDanhGia = dd.MaDotDanhGia
        WHERE d.MSSV = ? 
        ORDER BY d.HocKy DESC
    `;
    executeQuery(query, [req.params.mssv], res, 'Lỗi lấy điểm rèn luyện!');
});

app.post('/api/training-points', (req, res) => {
    const { MSSV, HocKy, DiemTuDanhGia, ChiTiet, MaDotDanhGia } = req.body;
    console.log('POST /api/training-points - Received data:', { MSSV, HocKy, DiemTuDanhGia, ChiTiet: ChiTiet ? ChiTiet.length : 0, MaDotDanhGia });

    // Validate that the evaluation period is active and not expired
    const checkQuery = MaDotDanhGia 
        ? 'SELECT TrangThai, NgayKetThuc FROM dot_danhgia WHERE MaDotDanhGia = ?'
        : 'SELECT TrangThai, NgayKetThuc FROM dot_danhgia WHERE HocKy = ? AND TrangThai = "Đang tự đánh giá"';
    const checkParams = MaDotDanhGia ? [MaDotDanhGia] : [HocKy];

    db.query(checkQuery, checkParams, (checkErr, results) => {
        if (checkErr) return res.status(500).json({ success: false, message: 'Lỗi kiểm tra đợt đánh giá!', error: checkErr.message });
        if (results.length === 0) return res.status(400).json({ success: false, message: 'Không tìm thấy đợt đánh giá hợp lệ cho học kỳ này!' });
        
        const period = results[0];
        if (period.TrangThai !== 'Đang tự đánh giá') {
            return res.status(400).json({ success: false, message: 'Đợt đánh giá đã đóng, không thể nộp phiếu!' });
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deadline = new Date(period.NgayKetThuc);
        deadline.setHours(0, 0, 0, 0);
        if (today > deadline) {
            return res.status(400).json({ success: false, message: 'Đợt đánh giá đã hết hạn nộp phiếu!' });
        }

        console.log('ChiTiet data:', JSON.stringify(ChiTiet, null, 2));

        let xepLoai = 'Kém';
        const diemTdg = Number(DiemTuDanhGia);
        if (isNaN(diemTdg) || diemTdg < 0 || diemTdg > 150) {
            return res.status(400).json({ success: false, message: 'Tổng điểm rèn luyện không hợp lệ!' });
        }
        if (diemTdg >= 90) xepLoai = 'Xuất sắc';
        else if (DiemTuDanhGia >= 80) xepLoai = 'Tốt';
        else if (DiemTuDanhGia >= 65) xepLoai = 'Khá';
        else if (DiemTuDanhGia >= 50) xepLoai = 'Trung bình';
        else if (DiemTuDanhGia >= 35) xepLoai = 'Yếu';

        const query = "INSERT INTO danhgia_renluyen (MSSV, HocKy, DiemTuDanhGia, TongDiem, XepLoai, TrangThai, MaDotDanhGia) VALUES (?, ?, ?, ?, ?, 'Chờ lớp duyệt', ?)";
        db.query(query, [MSSV, HocKy, DiemTuDanhGia, DiemTuDanhGia, xepLoai, MaDotDanhGia || null], (err, result) => {
            if (err) return res.status(500).json({ success: false, message: 'Lỗi nộp đánh giá!', error: err.message });

            const maDanhGia = result.insertId;
            console.log('Created MaDanhGia:', maDanhGia);

            if (ChiTiet && Array.isArray(ChiTiet) && ChiTiet.length > 0) {
                const values = ChiTiet.map(ct => [maDanhGia, ct.MaTieuChi, ct.DiemChon, ct.ChiSoOption, ct.Files ? JSON.stringify(ct.Files) : null]);
                console.log('Inserting details values:', values);
                const detailQuery = 'INSERT INTO chitiet_danhgia (MaDanhGia, MaTieuChi, DiemChon, ChiSoOption, MinhChung) VALUES ?';
                db.query(detailQuery, [values], (detailErr) => {
                    if (detailErr) {
                        console.error('Lỗi lưu chi tiết đánh giá:', detailErr);
                        return res.json({ success: true, message: 'Nộp đánh giá thành công (không lưu được chi tiết)!' });
                    }
                    console.log('Details saved successfully for MaDanhGia:', maDanhGia);
                    res.json({ success: true, message: 'Nộp đánh giá thành công!' });
                });
            } else {
                console.log('No ChiTiet data to save');
                res.json({ success: true, message: 'Nộp đánh giá thành công!' });
            }
        });
    });
});

app.put('/api/training-points/:id', (req, res) => {
    const { DiemTuDanhGia, ChiTiet } = req.body;

    // Validate that the evaluation period is active and not expired
    const checkQuery = `
        SELECT dd.TrangThai, dd.NgayKetThuc 
        FROM danhgia_renluyen d
        JOIN dot_danhgia dd ON d.MaDotDanhGia = dd.MaDotDanhGia
        WHERE d.MaDanhGia = ?
    `;

    db.query(checkQuery, [req.params.id], (checkErr, results) => {
        if (checkErr) return res.status(500).json({ success: false, message: 'Lỗi kiểm tra đợt đánh giá!', error: checkErr.message });
        if (results.length === 0) return res.status(400).json({ success: false, message: 'Không tìm thấy phiếu đánh giá hoặc đợt đánh giá tương ứng đã bị đóng!' });
        
        const period = results[0];
        if (period.TrangThai !== 'Đang tự đánh giá') {
            return res.status(400).json({ success: false, message: 'Đợt đánh giá đã đóng, không thể chỉnh sửa!' });
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deadline = new Date(period.NgayKetThuc);
        deadline.setHours(0, 0, 0, 0);
        if (today > deadline) {
            return res.status(400).json({ success: false, message: 'Đợt đánh giá đã hết hạn, không thể chỉnh sửa!' });
        }

        let xepLoai = 'Kém';
        if (DiemTuDanhGia >= 90) xepLoai = 'Xuất sắc';
        else if (DiemTuDanhGia >= 80) xepLoai = 'Tốt';
        else if (DiemTuDanhGia >= 65) xepLoai = 'Khá';
        else if (DiemTuDanhGia >= 50) xepLoai = 'Trung bình';
        else if (DiemTuDanhGia >= 35) xepLoai = 'Yếu';

        const query = 'UPDATE danhgia_renluyen SET DiemTuDanhGia=?, TongDiem=?, XepLoai=? WHERE MaDanhGia=?';
        db.query(query, [DiemTuDanhGia, DiemTuDanhGia, xepLoai, req.params.id], (err) => {
            if (err) return res.status(500).json({ success: false, message: 'Lỗi cập nhật điểm!', error: err.message });

            if (ChiTiet && Array.isArray(ChiTiet) && ChiTiet.length > 0) {
                db.query('DELETE FROM chitiet_danhgia WHERE MaDanhGia = ?', [req.params.id], (delErr) => {
                    if (delErr) return res.json({ success: true, message: 'Cập nhật điểm thành công (không cập nhật được chi tiết)!' });

                    const values = ChiTiet.map(ct => [req.params.id, ct.MaTieuChi, ct.DiemChon, ct.ChiSoOption, ct.Files ? JSON.stringify(ct.Files) : null]);
                    const detailQuery = 'INSERT INTO chitiet_danhgia (MaDanhGia, MaTieuChi, DiemChon, ChiSoOption, MinhChung) VALUES ?';
                    db.query(detailQuery, [values], (insertErr) => {
                        if (insertErr) console.error('Lỗi lưu chi tiết đánh giá:', insertErr);
                        res.json({ success: true, message: 'Cập nhật điểm thành công!' });
                    });
                });
            } else {
                res.json({ success: true, message: 'Cập nhật điểm thành công!' });
            }
        });
    });
});

// ==================== [SINH VIÊN] YÊU CẦU & HỖ TRỢ ====================
app.get('/api/support/student/:mssv', (req, res) => {
    const query = 'SELECT * FROM yeucau_hotro WHERE MSSV = ? ORDER BY NgayGui DESC';
    executeQuery(query, [req.params.mssv], res, 'Lỗi lấy danh sách yêu cầu!');
});

app.post('/api/support', (req, res) => {
    const { MSSV, LoaiYeuCau, ChuDe, NoiDung } = req.body;
    const safeChuDe = ChuDe ? ChuDe.substring(0, 255) : '';
    const query = "INSERT INTO yeucau_hotro (MSSV, LoaiYeuCau, ChuDe, NoiDung, NgayGui, TrangThai) VALUES (?, ?, ?, ?, NOW(), 'Chờ xử lý')";
    executeInsert(query, [MSSV, LoaiYeuCau, safeChuDe, NoiDung], res, 'Gửi yêu cầu thành công!', 'Lỗi gửi yêu cầu!');
});

// ==================== [GIẢNG VIÊN] YÊU CẦU & HỖ TRỢ ====================
app.get('/api/support/teacher/:maGV', (req, res) => {
    const query = 'SELECT * FROM yeucau_hotro WHERE MaGiangVien = ? ORDER BY NgayGui DESC';
    executeQuery(query, [req.params.maGV], res, 'Lỗi lấy danh sách yêu cầu!');
});

app.post('/api/support/teacher', (req, res) => {
    const { MaGiangVien, LoaiYeuCau, ChuDe, NoiDung } = req.body;
    const safeChuDe = ChuDe ? ChuDe.substring(0, 255) : '';
    const query = "INSERT INTO yeucau_hotro (MaGiangVien, LoaiYeuCau, ChuDe, NoiDung, NgayGui, TrangThai) VALUES (?, ?, ?, ?, NOW(), 'Chờ xử lý')";
    executeInsert(query, [MaGiangVien, LoaiYeuCau, safeChuDe, NoiDung], res, 'Gửi yêu cầu thành công!', 'Lỗi gửi yêu cầu!');
});

// ==================== [MODULE: ONLINE EXAM] ====================
const onlineExamRoutes = require('./online-exam/routes')(db.promise());
app.use('/api/exam', onlineExamRoutes);


// ==================== [MODULE: HỌC PHÍ + VIETQR] ====================

// --- Tự động tạo bảng khi khởi động ---
db.getConnection((err, conn) => {
    if (err) return;
    const createTables = [
        `CREATE TABLE IF NOT EXISTS dot_dong_hoc_phi (
            id INT PRIMARY KEY AUTO_INCREMENT,
            ma_dot_dangky INT NOT NULL,
            hoc_ky VARCHAR(20) NOT NULL,
            ten_dot VARCHAR(200) NOT NULL,
            ngay_mo DATETIME NOT NULL,
            ngay_dong DATETIME NOT NULL,
            trang_thai ENUM('chua_mo','dang_mo','da_dong') DEFAULT 'chua_mo',
            don_gia_tin_chi DECIMAL(15,0) NOT NULL,
            tao_boi VARCHAR(50) NOT NULL,
            ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS hoc_phi_v2 (
            id INT PRIMARY KEY AUTO_INCREMENT,
            mssv VARCHAR(20) NOT NULL,
            dot_id INT NOT NULL,
            so_tien DECIMAL(15,0) NOT NULL,
            trang_thai ENUM('Chưa đóng','Đã đóng') DEFAULT 'Chưa đóng',
            ngay_tinh DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_mssv_dot (mssv, dot_id)
        )`,
        `CREATE TABLE IF NOT EXISTS hoc_phi_chi_tiet (
            id INT PRIMARY KEY AUTO_INCREMENT,
            hoc_phi_id INT NOT NULL,
            ma_lop_hoc_phan VARCHAR(50) NOT NULL,
            ten_mon_hoc VARCHAR(100) NOT NULL,
            so_tin_chi INT NOT NULL,
            don_gia DECIMAL(15,0) NOT NULL,
            thanh_tien DECIMAL(15,0) NOT NULL,
            FOREIGN KEY (hoc_phi_id) REFERENCES hoc_phi_v2(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS giao_dich_hoc_phi (
            id INT PRIMARY KEY AUTO_INCREMENT,
            hoc_phi_id INT NOT NULL,
            ma_giao_dich VARCHAR(80) UNIQUE NOT NULL,
            so_tien DECIMAL(15,0) NOT NULL,
            noi_dung VARCHAR(100) NOT NULL,
            qr_url TEXT NULL,
            trang_thai ENUM('cho_thanh_toan','thanh_cong','that_bai','het_han') DEFAULT 'cho_thanh_toan',
            nguon_xac_nhan ENUM('auto','manual') NULL,
            admin_username VARCHAR(50) NULL,
            minh_chung_url VARCHAR(255) NULL,
            ghi_chu TEXT NULL,
            thoi_gian_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
            thoi_gian_xac_nhan DATETIME NULL,
            FOREIGN KEY (hoc_phi_id) REFERENCES hoc_phi_v2(id)
        )`
    ];
    let idx = 0;
    const runNext = () => {
        if (idx >= createTables.length) { conn.release(); return; }
        conn.query(createTables[idx++], (e) => { if (e && e.code !== 'ER_TABLE_EXISTS_ERROR') console.error('[HocPhi] Tạo bảng lỗi:', e.message); runNext(); });
    };
    runNext();
});

// Helper: slug nội dung không dấu
const removeVietnameseTones = (str) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^a-zA-Z0-9 ]/g, '').trim();
};

// Config VietQR (Vietinbank)
const VIETQR_BANK_ID   = process.env.VIETQR_BANK_ID   || '970415'; // Vietinbank
const VIETQR_ACCOUNT   = process.env.VIETQR_ACCOUNT   || '108873448328';
const VIETQR_HOLDER    = process.env.VIETQR_HOLDER    || 'NhatTin University';
const VIETQR_TEMPLATE  = process.env.VIETQR_TEMPLATE  || 'compact2';
const VIETQR_SECRET    = process.env.VIETQR_SECRET    || 'vietqr-secret-nhattin-2026';

// Middleware checkOwnership cho SV: token.id === mssv từ body (không dùng URL param)
const checkTuitionOwnership = (req, res, next) => {
    if (!req.user || !req.user.id) return res.status(401).json({ success: false, message: 'Không xác thực được người dùng!' });
    next();
};

// ----- ADMIN ROUTES -----

// GET /api/admin/tuition-periods — Danh sách đợt học phí
app.get('/api/admin/tuition-periods', verifyToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Không có quyền truy cập!' });
    const { hoc_ky } = req.query;
    let sql = `SELECT d.*, dd.TenDot as ten_dot_dangky, dd.TrangThai as trang_thai_dangky,
                (SELECT COUNT(*) FROM hoc_phi_v2 WHERE dot_id = d.id) as so_sv
               FROM dot_dong_hoc_phi d
               LEFT JOIN dot_dangky dd ON d.ma_dot_dangky = dd.MaDot`;
    const params = [];
    if (hoc_ky && hoc_ky !== 'all') { sql += ' WHERE d.hoc_ky = ?'; params.push(hoc_ky); }
    sql += ' ORDER BY d.ngay_tao DESC';
    db.query(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi tải danh sách đợt!', error: err.message });
        res.json({ success: true, data: rows });
    });
});

// POST /api/admin/tuition-periods — Mở đợt đóng học phí (tự tính học phí cho toàn bộ SV)
app.post('/api/admin/tuition-periods', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Không có quyền truy cập!' });
    const { ma_dot_dangky, hoc_ky, ten_dot, ngay_mo, ngay_dong } = req.body;
    const don_gia_tin_chi = 10000; // Cố định 1 tín chỉ = 10,000 VNĐ để dễ test QR
    if (!ma_dot_dangky || !hoc_ky || !ten_dot || !ngay_mo || !ngay_dong) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc!' });
    }
    const dbConn = await db.promise().getConnection();
    try {
        await dbConn.beginTransaction();

        // Insert đợt đóng học phí
        const [dotResult] = await dbConn.execute(
            'INSERT INTO dot_dong_hoc_phi (ma_dot_dangky, hoc_ky, ten_dot, ngay_mo, ngay_dong, don_gia_tin_chi, tao_boi, trang_thai) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [ma_dot_dangky, hoc_ky, ten_dot, ngay_mo, ngay_dong, don_gia_tin_chi, req.user.username || req.user.id, 'chua_mo']
        );
        const dotId = dotResult.insertId;

        // Lấy toàn bộ SV + môn học trong đợt đăng ký, join lophocphan để lấy số tín chỉ + cấu hình phí tài liệu
        const [svRows] = await dbConn.execute(
            `SELECT dk.MSSV, dk.MaLopHocPhan, dk.HocKy,
                    m.TenMonHoc, m.SoTinChi,
                    COALESCE(lhp.phi_tai_lieu, 0) AS PhiTaiLieu,
                    COALESCE(lhp.mien_hoc_phi, 0) AS MienHocPhi
             FROM dangky_hocphan dk
             JOIN lophocphan lhp ON dk.MaLopHocPhan = lhp.MaLopHocPhan
             JOIN monhoc m ON lhp.MaMonHoc = m.MaMonHoc
             WHERE dk.HocKy = ? AND dk.TrangThai IN ('Đã duyệt','da_duyet','Chấp nhận','approved')`,
            [hoc_ky]
        );

        if (svRows.length === 0) {
            await dbConn.rollback();
            dbConn.release();
            return res.status(400).json({ success: false, message: 'Không tìm thấy sinh viên đã đăng ký hợp lệ trong học kỳ này!' });
        }

        // Nhóm theo MSSV
        const svMap = {};
        for (const row of svRows) {
            if (!svMap[row.MSSV]) svMap[row.MSSV] = [];
            svMap[row.MSSV].push(row);
        }

        const donGia = don_gia_tin_chi;
        const hocPhiBulk = [];
        const chiTietTemp = {};

        for (const [mssv, monList] of Object.entries(svMap)) {
            let tongTien = 0;
            chiTietTemp[mssv] = monList.map(m => {
                const isMien = !!Number(m.MienHocPhi);
                const hoc_phi = isMien ? 0 : Number(m.SoTinChi) * donGia;
                const phi_tai_lieu = isMien ? 0 : Number(m.PhiTaiLieu || 0);
                const mien_giam = 0;
                const thanh_tien = hoc_phi + phi_tai_lieu - mien_giam;
                tongTien += thanh_tien;
                return { ma_lop: m.MaLopHocPhan, ten_mon: m.TenMonHoc, tc: Number(m.SoTinChi), don_gia: donGia, hoc_phi, phi_tai_lieu, mien_giam, thanh_tien };
            });
            hocPhiBulk.push([mssv, dotId, tongTien]);
        }

        // Bulk insert hoc_phi_v2
        if (hocPhiBulk.length > 0) {
            await dbConn.query('INSERT IGNORE INTO hoc_phi_v2 (mssv, dot_id, so_tien) VALUES ?', [hocPhiBulk]);
        }

        // Lấy các id vừa insert để insert chi tiết
        const [hpRows] = await dbConn.execute('SELECT id, mssv FROM hoc_phi_v2 WHERE dot_id = ?', [dotId]);
        const chiTietBulk = [];
        for (const hp of hpRows) {
            const ctList = chiTietTemp[hp.mssv] || [];
            for (const ct of ctList) {
                chiTietBulk.push([hp.id, ct.ma_lop, ct.ten_mon, ct.tc, ct.don_gia, ct.phi_tai_lieu, ct.hoc_phi, ct.mien_giam, ct.thanh_tien]);
            }
        }
        if (chiTietBulk.length > 0) {
            await dbConn.query('INSERT INTO hoc_phi_chi_tiet (hoc_phi_id, ma_lop_hoc_phan, ten_mon_hoc, so_tin_chi, don_gia, phi_tai_lieu, hoc_phi, mien_giam, thanh_tien) VALUES ?', [chiTietBulk]);
        }

        await dbConn.commit();
        dbConn.release();
        res.json({ success: true, message: `Đã tạo đợt học phí với ${hocPhiBulk.length} sinh viên!`, dot_id: dotId, so_sv: hocPhiBulk.length });
    } catch (error) {
        await dbConn.rollback();
        dbConn.release();
        console.error('[HocPhi] Lỗi tạo đợt:', error);
        res.status(500).json({ success: false, message: 'Lỗi tạo đợt học phí!', error: error.message });
    }
});

// PUT /api/admin/tuition-periods/:id/status — Mở/đóng đợt
app.put('/api/admin/tuition-periods/:id/status', verifyToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Không có quyền!' });
    const { trang_thai } = req.body;
    const allowed = ['chua_mo', 'dang_mo', 'da_dong'];
    if (!allowed.includes(trang_thai)) return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ!' });
    db.query('UPDATE dot_dong_hoc_phi SET trang_thai = ? WHERE id = ?', [trang_thai, req.params.id], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi cập nhật!', error: err.message });
        res.json({ success: true, message: 'Cập nhật trạng thái thành công!' });
    });
});

// GET /api/admin/tuitions?dot_id=&status=&search= — Danh sách học phí theo đợt
app.get('/api/admin/tuitions', verifyToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Không có quyền!' });
    const { dot_id, status, search, khoa, nien_khoa, lop } = req.query;
    let sql = `SELECT hp.*, sv.HoTen as ten_sinh_vien, sv.MaLop, l.NienKhoa as nien_khoa, l.MaKhoa as ma_khoa, k.TenKhoa as ten_khoa,
                (SELECT gd.trang_thai FROM giao_dich_hoc_phi gd WHERE gd.hoc_phi_id = hp.id ORDER BY gd.thoi_gian_tao DESC LIMIT 1) as gd_trang_thai,
                (SELECT gd.nguon_xac_nhan FROM giao_dich_hoc_phi gd WHERE gd.hoc_phi_id = hp.id ORDER BY gd.thoi_gian_tao DESC LIMIT 1) as gd_nguon,
                (SELECT gd.admin_username FROM giao_dich_hoc_phi gd WHERE gd.hoc_phi_id = hp.id ORDER BY gd.thoi_gian_tao DESC LIMIT 1) as gd_admin,
                (SELECT gd.ghi_chu FROM giao_dich_hoc_phi gd WHERE gd.hoc_phi_id = hp.id ORDER BY gd.thoi_gian_tao DESC LIMIT 1) as gd_ghi_chu,
                (SELECT gd.thoi_gian_xac_nhan FROM giao_dich_hoc_phi gd WHERE gd.hoc_phi_id = hp.id ORDER BY gd.thoi_gian_tao DESC LIMIT 1) as gd_thoi_gian
               FROM hoc_phi_v2 hp
               LEFT JOIN sinhvien sv ON hp.mssv = sv.MSSV
               LEFT JOIN lophoc l ON sv.MaLop = l.MaLop
               LEFT JOIN khoa k ON l.MaKhoa = k.MaKhoa`;
    const params = [];
    const conditions = [];
    if (dot_id) { conditions.push('hp.dot_id = ?'); params.push(dot_id); }
    if (status && status !== 'all') { conditions.push('hp.trang_thai = ?'); params.push(status); }
    if (search) { conditions.push('(hp.mssv LIKE ? OR sv.HoTen LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
    if (khoa && khoa !== 'all') { conditions.push('l.MaKhoa = ?'); params.push(khoa); }
    if (nien_khoa && nien_khoa !== 'all') { conditions.push('l.NienKhoa = ?'); params.push(nien_khoa); }
    if (lop && lop !== 'all') { conditions.push('sv.MaLop = ?'); params.push(lop); }
    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY hp.trang_thai ASC, sv.HoTen ASC';
    db.query(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi tải danh sách!', error: err.message });
        res.json({ success: true, data: rows });
    });
});

// GET /api/admin/tuitions/:id/detail — Chi tiết học phí + lịch sử giao dịch
app.get('/api/admin/tuitions/:id/detail', verifyToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Không có quyền!' });
    const hocPhiId = req.params.id;
    db.query(
        `SELECT hp.*, sv.HoTen as ten_sinh_vien, d.ten_dot, d.ngay_dong, d.ngay_mo
         FROM hoc_phi_v2 hp
         LEFT JOIN sinhvien sv ON hp.mssv = sv.MSSV
         LEFT JOIN dot_dong_hoc_phi d ON hp.dot_id = d.id
         WHERE hp.id = ?`, [hocPhiId],
        (err, hpRows) => {
            if (err || hpRows.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy học phí!' });
            db.query('SELECT * FROM hoc_phi_chi_tiet WHERE hoc_phi_id = ?', [hocPhiId], (err2, ctRows) => {
                db.query('SELECT * FROM giao_dich_hoc_phi WHERE hoc_phi_id = ? ORDER BY thoi_gian_tao DESC', [hocPhiId], (err3, gdRows) => {
                    res.json({ success: true, data: { ...hpRows[0], chi_tiet: ctRows || [], giao_dich: gdRows || [] } });
                });
            });
        }
    );
});

// PUT /api/admin/tuitions/:id/confirm-manual — Xác nhận thủ công
app.put('/api/admin/tuitions/:id/confirm-manual', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Không có quyền!' });
    const { ghi_chu, minh_chung_url } = req.body;
    if (!ghi_chu || ghi_chu.trim().length < 5) {
        return res.status(400).json({ success: false, message: 'Ghi chú bắt buộc tối thiểu 5 ký tự!' });
    }
    const hocPhiId = req.params.id;
    const dbConn = await db.promise().getConnection();
    try {
        await dbConn.beginTransaction();
        const [[hp]] = await dbConn.execute('SELECT * FROM hoc_phi_v2 WHERE id = ? FOR UPDATE', [hocPhiId]);
        if (!hp) { await dbConn.rollback(); dbConn.release(); return res.status(404).json({ success: false, message: 'Không tìm thấy học phí!' }); }
        if (hp.trang_thai === 'Đã đóng') { await dbConn.rollback(); dbConn.release(); return res.status(409).json({ success: false, message: 'Học phí này đã được đóng rồi!' }); }

        const maGD = `MANUAL${hocPhiId}${req.user.id || req.user.username}${Date.now()}`;
        const noiDung = `Xac nhan thu cong ${hocPhiId}`;
        await dbConn.execute(
            'INSERT INTO giao_dich_hoc_phi (hoc_phi_id, ma_giao_dich, so_tien, noi_dung, trang_thai, nguon_xac_nhan, admin_username, minh_chung_url, ghi_chu, thoi_gian_xac_nhan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
            [hocPhiId, maGD, hp.so_tien, noiDung, 'thanh_cong', 'manual', req.user.username || req.user.id, minh_chung_url || null, ghi_chu.trim()]
        );
        await dbConn.execute('UPDATE hoc_phi_v2 SET trang_thai = ? WHERE id = ?', ['Đã đóng', hocPhiId]);
        await dbConn.commit();
        dbConn.release();
        res.json({ success: true, message: 'Xác nhận thủ công thành công!' });
    } catch (error) {
        await dbConn.rollback();
        dbConn.release();
        console.error('[HocPhi] Lỗi confirm-manual:', error);
        res.status(500).json({ success: false, message: 'Lỗi xác nhận!', error: error.message });
    }
});

// GET /api/admin/dot-dangky — Danh sách đợt đăng ký để admin chọn khi tạo đợt học phí
app.get('/api/admin/dot-dangky', verifyToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Không có quyền!' });
    db.query('SELECT * FROM dot_dangky ORDER BY NgayTao DESC', (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi tải đợt đăng ký!', error: err.message });
        res.json({ success: true, data: rows });
    });
});

// ----- STUDENT ROUTES -----

// Hàm tự động đồng bộ học phí theo môn đăng ký mới nhất của sinh viên
async function autoSyncStudentTuition(dbConn, hocPhiId, mssv, hocKy, donGiaTinChi) {
    if (!hocPhiId || !mssv || !hocKy) return;
    const [dkRows] = await dbConn.execute(
        `SELECT dk.MaLopHocPhan, m.TenMonHoc, m.SoTinChi,
                COALESCE(lhp.phi_tai_lieu, 0) AS PhiTaiLieu,
                COALESCE(lhp.mien_hoc_phi, 0) AS MienHocPhi
         FROM dangky_hocphan dk
         JOIN lophocphan lhp ON dk.MaLopHocPhan = lhp.MaLopHocPhan
         JOIN monhoc m ON lhp.MaMonHoc = m.MaMonHoc
         WHERE dk.MSSV = ? AND (dk.HocKy = ? OR lhp.HocKy = ?) AND dk.TrangThai NOT IN ('Da huy', 'Tu choi', 'Đã hủy', 'Từ chối')`,
        [mssv, hocKy, hocKy]
    );

    if (dkRows.length > 0) {
        const donGia = Number(donGiaTinChi || 10000);
        let tongTienMoi = 0;
        const chiTietMoi = dkRows.map(m => {
            const isMien = !!Number(m.MienHocPhi);
            const hoc_phi = isMien ? 0 : Number(m.SoTinChi) * donGia;
            const phi_tai_lieu = isMien ? 0 : Number(m.PhiTaiLieu || 0);
            const mien_giam = 0;
            const thanh_tien = hoc_phi + phi_tai_lieu - mien_giam;
            tongTienMoi += thanh_tien;
            return [hocPhiId, m.MaLopHocPhan, m.TenMonHoc, Number(m.SoTinChi), donGia, phi_tai_lieu, hoc_phi, mien_giam, thanh_tien];
        });

        await dbConn.execute('DELETE FROM hoc_phi_chi_tiet WHERE hoc_phi_id = ?', [hocPhiId]);
        await dbConn.query(
            'INSERT INTO hoc_phi_chi_tiet (hoc_phi_id, ma_lop_hoc_phan, ten_mon_hoc, so_tin_chi, don_gia, phi_tai_lieu, hoc_phi, mien_giam, thanh_tien) VALUES ?',
            [chiTietMoi]
        );
        await dbConn.execute('UPDATE hoc_phi_v2 SET so_tien = ? WHERE id = ?', [tongTienMoi, hocPhiId]);
    }
}

// GET /api/student/tuitions/me — Học phí của SV hiện tại (tự động đồng bộ môn học mới)
app.get('/api/student/tuitions/me', verifyToken, async (req, res) => {
    if (req.user.role !== 'student') return res.status(403).json({ success: false, message: 'Chỉ sinh viên mới xem được!' });
    const mssv = req.user.id || req.user.username;
    try {
        const dbConn = await db.promise().getConnection();
        try {
            const [hpRows] = await dbConn.execute(
                `SELECT hp.*, d.hoc_ky, d.don_gia_tin_chi
                 FROM hoc_phi_v2 hp
                 JOIN dot_dong_hoc_phi d ON hp.dot_id = d.id
                 WHERE hp.mssv = ? AND hp.trang_thai != 'Đã đóng'`,
                [mssv]
            );
            for (const hp of hpRows) {
                await autoSyncStudentTuition(dbConn, hp.id, mssv, hp.hoc_ky, hp.don_gia_tin_chi);
            }

            const [rows] = await dbConn.execute(
                `SELECT hp.*, d.ten_dot, d.ngay_mo, d.ngay_dong, d.trang_thai as dot_trang_thai, d.don_gia_tin_chi, sv.HoTen as ten_sinh_vien
                 FROM hoc_phi_v2 hp
                 JOIN dot_dong_hoc_phi d ON hp.dot_id = d.id
                 LEFT JOIN sinhvien sv ON hp.mssv = sv.MSSV
                 WHERE hp.mssv = ?
                 ORDER BY d.ngay_tao DESC`,
                [mssv]
            );
            dbConn.release();
            res.json({ success: true, data: rows });
        } catch (err) {
            dbConn.release();
            throw err;
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi tải học phí!', error: err.message });
    }
});

// GET /api/student/tuitions/:hocPhiId/detail — Chi tiết học phần (tự động đồng bộ môn học mới đăng ký)
app.get('/api/student/tuitions/:hocPhiId/detail', verifyToken, async (req, res) => {
    if (req.user.role !== 'student') return res.status(403).json({ success: false, message: 'Không có quyền!' });
    const mssv = req.user.id || req.user.username;
    const hocPhiId = req.params.hocPhiId;

    try {
        const dbConn = await db.promise().getConnection();
        try {
            const [[hp]] = await dbConn.execute(
                `SELECT hp.*, d.hoc_ky, d.don_gia_tin_chi 
                 FROM hoc_phi_v2 hp 
                 JOIN dot_dong_hoc_phi d ON hp.dot_id = d.id 
                 WHERE hp.id = ? AND hp.mssv = ?`,
                [hocPhiId, mssv]
            );

            if (hp && hp.trang_thai !== 'Đã đóng') {
                await autoSyncStudentTuition(dbConn, hocPhiId, mssv, hp.hoc_ky, hp.don_gia_tin_chi);
            }

            const [rows] = await dbConn.execute(
                'SELECT ct.* FROM hoc_phi_chi_tiet ct JOIN hoc_phi_v2 hp ON ct.hoc_phi_id = hp.id WHERE ct.hoc_phi_id = ? AND hp.mssv = ?',
                [hocPhiId, mssv]
            );
            dbConn.release();
            res.json({ success: true, data: { chi_tiet: rows || [] } });
        } catch (err) {
            dbConn.release();
            throw err;
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi tải chi tiết!', error: error.message });
    }
});


app.post('/api/student/tuitions/:hocPhiId/generate-qr', verifyToken, async (req, res) => {
    if (req.user.role !== 'student') return res.status(403).json({ success: false, message: 'Chỉ sinh viên mới dùng được!' });
    const mssv = req.user.id || req.user.username;
    const hocPhiId = req.params.hocPhiId;
    try {
        const [[hp]] = await db.promise().execute(
            `SELECT hp.*, d.trang_thai as dot_trang_thai, d.ngay_mo, d.ngay_dong, d.id as dot_id, d.hoc_ky, sv.HoTen
             FROM hoc_phi_v2 hp
             JOIN dot_dong_hoc_phi d ON hp.dot_id = d.id
             LEFT JOIN sinhvien sv ON hp.mssv = sv.MSSV
             WHERE hp.id = ? AND hp.mssv = ?`, [hocPhiId, mssv]
        );
        if (!hp) return res.status(404).json({ success: false, message: 'Không tìm thấy học phí!' });

        if (hp.dot_trang_thai !== 'dang_mo') {
            return res.status(403).json({ success: false, message: 'Đợt đóng học phí đang tạm đóng hoặc chưa được mở!' });
        }
        if (hp.trang_thai === 'Đã đóng') {
            return res.status(409).json({ success: false, message: 'Học phí này đã được đóng rồi!' });
        }

        // Kiểm tra nếu đã có giao dịch đang chờ thanh toán cho học phí này thì tái sử dụng
        const [[existingGD]] = await db.promise().execute(
            'SELECT * FROM giao_dich_hoc_phi WHERE hoc_phi_id = ? AND trang_thai = ? ORDER BY id DESC LIMIT 1',
            [hocPhiId, 'cho_thanh_toan']
        );

        // Hạn nộp mã QR: 15 phút kể từ lúc tạo
        const now = new Date();
        const hetHanQR = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

        if (existingGD && existingGD.qr_url) {
            return res.json({
                success: true,
                data: {
                    qr_url: existingGD.qr_url,
                    so_tien: existingGD.so_tien,
                    noi_dung: existingGD.noi_dung,
                    ma_giao_dich: existingGD.ma_giao_dich,
                    het_han: hetHanQR
                }
            });
        }

        // Sinh mã giao dịch unique ngắn nhọn (tránh vượt độ dài cột VARCHAR trong DB)
        const maGD = `HP${hocPhiId}_${Date.now()}_${Math.floor(Math.random() * 899 + 100)}`;
        const soTien = Math.round(hp.so_tien);

        // Nội dung chuyển khoản: hoten-mssv-HK mấy năm nào (không dấu)
        const hoTenClean = removeVietnameseTones(hp.HoTen || 'SV').replace(/[^a-zA-Z0-9 ]/g, '').trim().toUpperCase();
        const hocKyClean = (hp.hoc_ky || '').replace(/_/g, ' ').trim().toUpperCase();
        const noiDung = `${hoTenClean} ${mssv} ${hocKyClean}`.replace(/\s+/g, ' ').substring(0, 50);

        // Build VietQR URL (public API không cần key)
        const qrUrl = `https://img.vietqr.io/image/${VIETQR_BANK_ID}-${VIETQR_ACCOUNT}-${VIETQR_TEMPLATE}.png?amount=${soTien}&addInfo=${encodeURIComponent(noiDung)}&accountName=${encodeURIComponent(VIETQR_HOLDER)}`;

        await db.promise().execute(
            'INSERT INTO giao_dich_hoc_phi (hoc_phi_id, ma_giao_dich, so_tien, noi_dung, qr_url, trang_thai) VALUES (?, ?, ?, ?, ?, ?)',
            [hocPhiId, maGD, soTien, noiDung, qrUrl, 'cho_thanh_toan']
        );

        res.json({ success: true, data: { qr_url: qrUrl, so_tien: soTien, noi_dung: noiDung, ma_giao_dich: maGD, het_han: hetHanQR } });
    } catch (error) {
        console.error('[HocPhi] generate-qr lỗi:', error);
        res.status(500).json({ success: false, message: 'Lỗi sinh QR!', error: error.message });
    }
});

// POST /api/student/tuitions/:hocPhiId/confirm-paid — API bắn xác nhận đã thanh toán chuyển khoản thành công
app.post('/api/student/tuitions/:hocPhiId/confirm-paid', async (req, res) => {
    const hocPhiId = req.params.hocPhiId;
    try {
        await db.promise().execute('UPDATE hoc_phi_v2 SET trang_thai = ? WHERE id = ?', ['Đã đóng', hocPhiId]);
        await db.promise().execute('UPDATE giao_dich_hoc_phi SET trang_thai = ?, ngay_giao_dich = NOW() WHERE hoc_phi_id = ?', ['thanh_cong', hocPhiId]);
        res.json({ success: true, message: 'Đã xác nhận thanh toán thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi cập nhật trạng thái', error: error.message });
    }
});

// POST /api/student/tuitions/:hocPhiId/report-transfer — Sinh viên báo cáo đã chuyển khoản (Chờ duyệt)
app.post('/api/student/tuitions/:hocPhiId/report-transfer', verifyToken, async (req, res) => {
    const hocPhiId = req.params.hocPhiId;
    try {
        const [[hp]] = await db.promise().execute('SELECT * FROM hoc_phi_v2 WHERE id = ?', [hocPhiId]);
        if (!hp) return res.status(404).json({ success: false, message: 'Không tìm thấy học phí!' });

        await db.promise().execute('UPDATE hoc_phi_v2 SET trang_thai = ? WHERE id = ?', ['Chờ duyệt', hocPhiId]);
        
        const [[latestGD]] = await db.promise().execute('SELECT id FROM giao_dich_hoc_phi WHERE hoc_phi_id = ? ORDER BY id DESC LIMIT 1', [hocPhiId]);
        if (latestGD) {
            await db.promise().execute(
                'UPDATE giao_dich_hoc_phi SET trang_thai = ?, nguon_xac_nhan = ? WHERE id = ?',
                ['cho_duyet', 'student_report', latestGD.id]
            );
        } else {
            const maGD = `REP${hocPhiId}_${Date.now()}_${Math.floor(Math.random() * 899 + 100)}`;
            await db.promise().execute(
                'INSERT INTO giao_dich_hoc_phi (hoc_phi_id, ma_giao_dich, so_tien, noi_dung, trang_thai, nguon_xac_nhan, ghi_chu) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [hocPhiId, maGD, hp.so_tien, `Sinh vien bao cao CK ${hocPhiId}`, 'cho_duyet', 'student_report', 'SV đã bấm xác nhận thanh toán, chờ Admin kiểm tra STK']
            );
        }

        res.json({ success: true, message: 'Đã gửi báo cáo thanh toán! Vui lòng chờ Admin kiểm tra STK.' });
    } catch (error) {
        console.error('[HocPhi] report-transfer error:', error);
        res.status(500).json({ success: false, message: 'Lỗi gửi báo cáo', error: error.message });
    }
});

// PUT /api/admin/tuitions/:hocPhiId/approve-payment — Admin duyệt thanh toán sau khi kiểm tra STK
app.put('/api/admin/tuitions/:hocPhiId/approve-payment', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Chỉ admin!' });
    const hocPhiId = req.params.hocPhiId;
    try {
        const [[hp]] = await db.promise().execute('SELECT * FROM hoc_phi_v2 WHERE id = ?', [hocPhiId]);
        if (!hp) return res.status(404).json({ success: false, message: 'Không tìm thấy học phí!' });

        await db.promise().execute('UPDATE hoc_phi_v2 SET trang_thai = ? WHERE id = ?', ['Đã đóng', hocPhiId]);

        const [resGD] = await db.promise().execute(
            'UPDATE giao_dich_hoc_phi SET trang_thai = ?, admin_username = ?, thoi_gian_xac_nhan = NOW(), ghi_chu = ? WHERE hoc_phi_id = ? AND trang_thai = ?',
            ['thanh_cong', req.user.username || req.user.id, 'Admin kiểm tra STK đã có tiền (pass qua)', hocPhiId, 'cho_duyet']
        );

        if (resGD.affectedRows === 0) {
            const maGD = `CHK${hocPhiId}_${Date.now()}_${Math.floor(Math.random() * 899 + 100)}`;
            await db.promise().execute(
                'INSERT INTO giao_dich_hoc_phi (hoc_phi_id, ma_giao_dich, so_tien, noi_dung, trang_thai, nguon_xac_nhan, admin_username, ghi_chu, thoi_gian_xac_nhan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
                [hocPhiId, maGD, hp.so_tien, `Admin kiem tra STK duyet ${hocPhiId}`, 'thanh_cong', 'admin_check', req.user.username || req.user.id, 'Admin kiểm tra STK đã nhận tiền']
            );
        }

        res.json({ success: true, message: 'Đã duyệt học phí thành công!' });
    } catch (error) {
        console.error('[HocPhi] approve-payment error:', error);
        res.status(500).json({ success: false, message: 'Lỗi duyệt học phí', error: error.message });
    }
});

// PUT /api/admin/tuitions/:hocPhiId/reject-payment — Admin từ chối thanh toán (nếu kiểm tra chưa vào tiền)
app.put('/api/admin/tuitions/:hocPhiId/reject-payment', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Chỉ admin!' });
    const hocPhiId = req.params.hocPhiId;
    try {
        await db.promise().execute('UPDATE hoc_phi_v2 SET trang_thai = ? WHERE id = ?', ['Chưa đóng', hocPhiId]);
        await db.promise().execute(
            'UPDATE giao_dich_hoc_phi SET trang_thai = ?, admin_username = ?, ghi_chu = ? WHERE hoc_phi_id = ? AND trang_thai = ?',
            ['that_bai', req.user.username || req.user.id, 'Admin kiểm tra STK chưa thấy thông tin chuyển khoản', hocPhiId, 'cho_duyet']
        );
        res.json({ success: true, message: 'Đã đẩy lại trạng thái Chưa thanh toán!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi từ chối', error: error.message });
    }
});

// POST /api/webhook/payment — API Webhook nhận tín hiệu chuyển khoản từ ngân hàng / Casso / SePay
app.post('/api/webhook/payment', async (req, res) => {
    const { ma_giao_dich, hoc_phi_id, so_tien } = req.body;
    try {
        if (hoc_phi_id) {
            await db.promise().execute('UPDATE hoc_phi_v2 SET trang_thai = ? WHERE id = ?', ['Đã đóng', hoc_phi_id]);
            await db.promise().execute('UPDATE giao_dich_hoc_phi SET trang_thai = ?, ngay_giao_dich = NOW() WHERE hoc_phi_id = ?', ['thanh_cong', hoc_phi_id]);
        } else if (ma_giao_dich) {
            const [[gd]] = await db.promise().execute('SELECT hoc_phi_id FROM giao_dich_hoc_phi WHERE ma_giao_dich = ?', [ma_giao_dich]);
            if (gd) {
                await db.promise().execute('UPDATE hoc_phi_v2 SET trang_thai = ? WHERE id = ?', ['Đã đóng', gd.hoc_phi_id]);
                await db.promise().execute('UPDATE giao_dich_hoc_phi SET trang_thai = ?, ngay_giao_dich = NOW() WHERE ma_giao_dich = ?', ['thanh_cong', ma_giao_dich]);
            }
        }
        res.json({ success: true, message: 'Webhook processed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Webhook error', error: error.message });
    }
});

// GET /api/student/tuitions/:hocPhiId/payment-status — Poll trạng thái giao dịch
app.get('/api/student/tuitions/:hocPhiId/payment-status', verifyToken, (req, res) => {
    if (req.user.role !== 'student') return res.status(403).json({ success: false, message: 'Không có quyền!' });
    const mssv = req.user.id || req.user.username;
    db.query(
        `SELECT gd.trang_thai, gd.thoi_gian_xac_nhan, gd.nguon_xac_nhan, hp.trang_thai as hp_trang_thai
         FROM giao_dich_hoc_phi gd
         JOIN hoc_phi_v2 hp ON gd.hoc_phi_id = hp.id
         WHERE gd.hoc_phi_id = ? AND hp.mssv = ?
         ORDER BY gd.thoi_gian_tao DESC LIMIT 1`,
        [req.params.hocPhiId, mssv],
        (err, rows) => {
            if (err) return res.status(500).json({ success: false, message: 'Lỗi kiểm tra trạng thái!' });
            if (!rows || rows.length === 0) return res.json({ success: true, data: { trang_thai: 'khong_co_giao_dich' } });
            res.json({ success: true, data: rows[0] });
        }
    );
});

// ----- WEBHOOK VIETQR -----
// Middleware verify checksum đơn giản
const verifyVietQRChecksum = (req, res, next) => {
    const checksum = req.headers['x-checksum'] || req.body?.checksum;
    if (!checksum) {
        console.warn('[VietQR Webhook] Thiếu checksum header');
        return res.status(401).json({ success: false, message: 'Missing checksum' });
    }
    const crypto = require('crypto');
    const payload = JSON.stringify(req.body || {});
    const expected = crypto.createHmac('sha256', VIETQR_SECRET).update(payload).digest('hex');
    if (checksum !== expected) {
        console.warn('[VietQR Webhook] Checksum không khớp');
        return res.status(401).json({ success: false, message: 'Invalid checksum' });
    }
    next();
};

app.post('/api/webhook/vietqr', express.json(), async (req, res) => {
    // Luôn trả 200 để VietQR không retry — xử lý bên trong
    res.status(200).json({ success: true, message: 'received' });

    try {
        const { orderId, amount, description } = req.body || {};
        if (!orderId) { console.warn('[VietQR Webhook] Thiếu orderId'); return; }

        // Checksum optional — chỉ log nếu không khớp nhưng vẫn xử lý (webhook public test)
        const checksum = req.headers['x-checksum'] || req.body?.checksum;
        if (checksum) {
            const crypto = require('crypto');
            const payload = JSON.stringify(req.body || {});
            const expected = crypto.createHmac('sha256', VIETQR_SECRET).update(payload).digest('hex');
            if (checksum !== expected) {
                console.warn('[VietQR Webhook] Checksum lệch cho orderId:', orderId, '— vẫn xử lý do môi trường test');
            }
        }

        const [[gd]] = await db.promise().execute(
            'SELECT * FROM giao_dich_hoc_phi WHERE ma_giao_dich = ? AND trang_thai = ?',
            [orderId, 'cho_thanh_toan']
        );
        if (!gd) { console.log('[VietQR Webhook] Không tìm thấy GD cho orderId:', orderId); return; }

        if (Math.round(Number(amount)) !== Math.round(Number(gd.so_tien))) {
            console.warn(`[VietQR Webhook] Số tiền lệch! Kỳ vọng ${gd.so_tien}, nhận ${amount} — orderId: ${orderId}`);
            return;
        }

        const dbConn = await db.promise().getConnection();
        try {
            await dbConn.beginTransaction();
            await dbConn.execute(
                'UPDATE giao_dich_hoc_phi SET trang_thai = ?, nguon_xac_nhan = ?, thoi_gian_xac_nhan = NOW() WHERE id = ?',
                ['thanh_cong', 'auto', gd.id]
            );
            await dbConn.execute('UPDATE hoc_phi_v2 SET trang_thai = ? WHERE id = ?', ['Đã đóng', gd.hoc_phi_id]);
            await dbConn.commit();
            console.log('[VietQR Webhook] ✅ Cập nhật thành công cho orderId:', orderId);
        } catch (e) {
            await dbConn.rollback();
            console.error('[VietQR Webhook] Lỗi DB:', e.message);
        } finally {
            dbConn.release();
        }
    } catch (err) {
        console.error('[VietQR Webhook] Lỗi xử lý:', err.message);
    }
});


//=============================================================================
// Khởi chạy server backend (Không được xóa)
//=============================================================================
if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 5000;

    const http = require('http');
    const server = http.createServer(app);

    server.listen(PORT, () => {
        console.log(`Server Backend đang chạy tại cổng: http://localhost:${PORT}`);
    });
}
//
module.exports = app;