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
    origin: function (origin, callback) {
        // Cho phép tất cả các domain
        callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
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
    timezone: '+07:00', // Đảm bảo Node.js hiểu DB đang chạy ở múi giờ VN
    waitForConnections: true,
    // Tránh lỗi "Too many connections" trên Vercel Serverless bằng cách giới hạn pool rất nhỏ
    connectionLimit: isVercel ? 2 : 10,
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: false
    }
});

// Ép tất cả các luồng kết nối MySQL phải sử dụng múi giờ Việt Nam
db.on('connection', function (connection) {
    connection.query("SET time_zone = '+07:00'");
});

// Kiểm tra kết nối DB
db.getConnection((err, connection) => {
    if (err) {
        console.error('Lỗi kết nối MySQL: ' + err.stack);
        return;
    }
    console.log('Đã kết nối thành công đến cơ sở dữ liệu MySQL.');

    // Tự động tạo bảng lưu trạng thái RFID nếu chưa có
    const createRfidTable = `
        CREATE TABLE IF NOT EXISTS rfid_state (
            id INT PRIMARY KEY DEFAULT 1,
            mode VARCHAR(50) DEFAULT 'ATTENDANCE',
            targetMSSV VARCHAR(20) DEFAULT NULL,
            capturedUid VARCHAR(50) DEFAULT NULL
        )
    `;
    connection.query(createRfidTable, (errTbl) => {
        if (!errTbl) {
            connection.query('INSERT IGNORE INTO rfid_state (id, mode) VALUES (1, "ATTENDANCE")');
        }
    });

    // Tự động tạo bảng thẻ sinh viên the_sv nếu chưa có
    const createTheSvTable = `
        CREATE TABLE IF NOT EXISTS the_sv (
          uid varchar(20) NOT NULL,
          MSSV varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          PRIMARY KEY (uid),
          KEY fk_the_sv_sinhvien (MSSV),
          CONSTRAINT fk_the_sv_sinhvien FOREIGN KEY (MSSV) REFERENCES sinhvien (MSSV) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    connection.query(createTheSvTable, (errTheSv) => {
        if (errTheSv) {
            console.error('Lỗi tự động tạo bảng the_sv:', errTheSv);
        }
    });

    const createYCHTTable = `
        CREATE TABLE IF NOT EXISTS yeucau_hotro (
            MaYeuCau INT AUTO_INCREMENT PRIMARY KEY,
            MSSV VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
            MaGiangVien VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
            LoaiYeuCau VARCHAR(100) NOT NULL,
            ChuDe VARCHAR(255) NOT NULL,
            NoiDung TEXT NOT NULL,
            NgayGui DATETIME NOT NULL,
            TrangThai VARCHAR(50) NOT NULL,
            PhanHoi TEXT NULL,
            NgayPhanHoi DATETIME NULL,
            FOREIGN KEY (MSSV) REFERENCES sinhvien(MSSV) ON DELETE CASCADE,
            FOREIGN KEY (MaGiangVien) REFERENCES giangvien(MaGiangVien) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    connection.query(createYCHTTable, (errYCHT) => {
        if (errYCHT) {
            console.error('Lỗi tự động tạo bảng yeucau_hotro:', errYCHT);
        }
    });

    // Tự động thêm cột LanDiemDanh vào bảng diemdanh nếu chưa có
    connection.query("SHOW COLUMNS FROM diemdanh LIKE 'LanDiemDanh'", (err, results) => {
        if (!err && results.length === 0) {
            connection.query("ALTER TABLE diemdanh ADD COLUMN LanDiemDanh INT DEFAULT 1", (errAlter) => {
                if (errAlter) console.error("Lỗi thêm cột LanDiemDanh:", errAlter);
                else console.log("Đã tự động thêm cột LanDiemDanh vào bảng diemdanh.");
            });
        }
    });

    // Tự động thêm cột Avatar vào bảng users nếu chưa có
    connection.query("SHOW COLUMNS FROM users LIKE 'Avatar'", (err, results) => {
        if (!err && results.length === 0) {
            connection.query("ALTER TABLE users ADD COLUMN Avatar LONGTEXT", (errAlter) => {
                if (errAlter) console.error("Lỗi thêm cột Avatar:", errAlter);
                else console.log("Đã tự động thêm cột Avatar vào bảng users.");
            });
        }
    });

    // Tự động thêm cột LoaiMonHoc vào bảng monhoc nếu chưa có
    connection.query("SHOW COLUMNS FROM monhoc LIKE 'LoaiMonHoc'", (err, results) => {
        if (!err && results.length === 0) {
            connection.query("ALTER TABLE monhoc ADD COLUMN LoaiMonHoc VARCHAR(255) DEFAULT 'Đại cương'", (errAlter) => {
                if (errAlter) console.error("Lỗi thêm cột LoaiMonHoc:", errAlter);
                else {
                    console.log("Đã tự động thêm cột LoaiMonHoc vào bảng monhoc.");
                    connection.query("UPDATE monhoc SET LoaiMonHoc = 'Chuyên ngành' WHERE MaKhoa IS NOT NULL AND MaKhoa != ''");
                }
            });
        }
    });

    // Tự động thêm cột CapBac vào bảng giangvien nếu chưa có
    connection.query("SHOW COLUMNS FROM giangvien LIKE 'CapBac'", (err, results) => {
        if (!err && results.length === 0) {
            connection.query("ALTER TABLE giangvien ADD COLUMN CapBac VARCHAR(255) DEFAULT 'Thạc sĩ'", (errAlter) => {
                if (errAlter) console.error("Lỗi thêm cột CapBac:", errAlter);
                else console.log("Đã tự động thêm cột CapBac vào bảng giangvien.");
            });
        }
    });

    // Tự động thêm cột PhamViDangKy vào bảng lophocphan nếu chưa có
    connection.query("SHOW COLUMNS FROM lophocphan LIKE 'PhamViDangKy'", (err, results) => {
        if (!err && results.length === 0) {
            connection.query("ALTER TABLE lophocphan ADD COLUMN PhamViDangKy VARCHAR(20) DEFAULT 'THEO_KHOA'", (errAlter) => {
                if (errAlter) console.error("Lỗi thêm cột PhamViDangKy:", errAlter);
                else console.log("Đã tự động thêm cột PhamViDangKy vào bảng lophocphan.");
            });
        }
    });

    connection.query('SET FOREIGN_KEY_CHECKS = 0;', (err) => {
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
        } catch (error) {}
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
    const queries = ['SELECT COUNT(*) as total FROM sinhvien', 'SELECT COUNT(*) as total FROM monhoc', 'SELECT COUNT(*) as total FROM lophoc', 'SELECT COUNT(*) as total FROM giangvien'];
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
    const query = `SELECT k.MaKhoa, k.TenKhoa, (SELECT COUNT(*) FROM sinhvien s JOIN lophoc l ON s.MaLop = l.MaLop WHERE l.MaKhoa = k.MaKhoa) as studentCount, (SELECT COUNT(*) FROM giangvien WHERE MaKhoa = k.MaKhoa) as teacherCount, (SELECT COUNT(*) FROM lophoc WHERE MaKhoa = k.MaKhoa) as classCount FROM khoa k`;
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
    const validTrangThai = ['Đang học', 'Học lại', 'Nghỉ học'];
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
    const validTrangThai = ['Đang học', 'Học lại', 'Nghỉ học'];
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
app.get('/api/students/:mssv/details', (req, res) => executeQuery('SELECT s.*, l.TenLop, k.TenKhoa, u.Avatar FROM sinhvien s LEFT JOIN lophoc l ON s.MaLop = l.MaLop LEFT JOIN khoa k ON l.MaKhoa = k.MaKhoa LEFT JOIN users u ON s.MSSV = u.TaiKhoan WHERE s.MSSV = ?', [req.params.mssv], res, 'Lỗi chi tiết SV!'));
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
app.get('/api/faculties', (req, res) => executeQuery('SELECT MaKhoa, TenKhoa FROM khoa ORDER BY TenKhoa', [], res, 'Loi lay khoa!'));
app.post('/api/faculties', (req, res) => executeInsert('INSERT INTO khoa (MaKhoa, TenKhoa) VALUES (?, ?)', [req.body.MaKhoa, req.body.TenKhoa], res, 'Thêm khoa thành công!', 'Lỗi thêm!'));
app.put('/api/faculties/:maKhoa', (req, res) => {
    const maKhoaMoi = req.body.MaKhoa;
    const maKhoaCu = req.params.maKhoa;
    const tenKhoa = req.body.TenKhoa;

    if (maKhoaMoi && maKhoaMoi !== maKhoaCu) {
        db.getConnection((err, connection) => {
            if (err) return res.status(500).json({ success: false, message: 'Lỗi kết nối DB!' });
            connection.query('SET FOREIGN_KEY_CHECKS = 0;', (err) => {
                if (err) { connection.release(); return res.status(500).json({ success: false, message: 'Lỗi DB!' }); }
                connection.query('UPDATE khoa SET TenKhoa=?, MaKhoa=? WHERE MaKhoa=?', [tenKhoa, maKhoaMoi, maKhoaCu], (err) => {
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
        executeUpdate('UPDATE khoa SET TenKhoa=? WHERE MaKhoa=?', [tenKhoa, maKhoaCu], res, 'Cập nhật thành công!', 'Lỗi cập nhật!');
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
    db.query(`SELECT MaMonHoc FROM monhoc WHERE MaMonHoc LIKE ? ORDER BY MaMonHoc DESC LIMIT 1`, [`${prefix}%`], (err, results) => {
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
            lhp.*, mh.TenMonHoc, mh.SoTinChi, gv.HoTen AS TenGiangVien, l.TenLop, k.TenKhoa,
            (mh.SoTinChi * 9) AS TongTiet,
            COALESCE((SELECT SUM(SoTiet) FROM lichhoc WHERE MaLopHocPhan = lhp.MaLopHocPhan), 0) AS TietDaXep,
            (SELECT COUNT(DISTINCT MSSV) FROM (SELECT MSSV FROM dangky_hocphan WHERE MaLopHocPhan = lhp.MaLopHocPhan AND TrangThai NOT IN ('Da huy', 'Tu choi') UNION SELECT MSSV FROM diem WHERE MaLopHocPhan = lhp.MaLopHocPhan) AS tmp) AS SiSoThucTe
        FROM lophocphan lhp
        LEFT JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc
        LEFT JOIN khoa k ON mh.MaKhoa = k.MaKhoa
        LEFT JOIN giangvien gv ON lhp.MaGiangVien = gv.MaGiangVien
        LEFT JOIN lophoc l ON lhp.MaLop = l.MaLop
    `;
    executeQuery(query, [], res, 'Lỗi lấy danh sách lớp học phần!');
});
app.get('/api/lophocphan/teacher/:maGV', (req, res) => executeQuery("SELECT lhp.*, mh.TenMonHoc, mh.SoTinChi, l.TenLop, (SELECT COUNT(DISTINCT MSSV) FROM (SELECT MSSV FROM dangky_hocphan WHERE MaLopHocPhan = lhp.MaLopHocPhan AND TrangThai NOT IN ('Da huy', 'Tu choi') UNION SELECT MSSV FROM diem WHERE MaLopHocPhan = lhp.MaLopHocPhan) AS tmp) AS SiSoThucTe FROM lophocphan lhp LEFT JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc LEFT JOIN lophoc l ON lhp.MaLop = l.MaLop WHERE lhp.MaGiangVien = ?", [req.params.maGV], res, 'Lỗi!'));
app.get('/api/course-sections/teacher/:maGV', (req, res) => executeQuery("SELECT lhp.*, mh.TenMonHoc, mh.SoTinChi, l.TenLop, gv.HoTen as TenGiangVien, (SELECT COUNT(DISTINCT MSSV) FROM (SELECT MSSV FROM dangky_hocphan WHERE MaLopHocPhan = lhp.MaLopHocPhan AND TrangThai NOT IN ('Da huy', 'Tu choi') UNION SELECT MSSV FROM diem WHERE MaLopHocPhan = lhp.MaLopHocPhan) AS tmp) AS SiSoThucTe FROM lophocphan lhp LEFT JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc LEFT JOIN lophoc l ON lhp.MaLop = l.MaLop LEFT JOIN giangvien gv ON lhp.MaGiangVien = gv.MaGiangVien WHERE lhp.MaGiangVien = ?", [req.params.maGV], res, 'Lỗi!'));
app.get('/api/course-sections/:maLhp/students', (req, res) => executeQuery('SELECT DISTINCT s.MSSV, s.HoTen, s.MaLop FROM diem d JOIN sinhvien s ON d.MSSV = s.MSSV WHERE d.MaLopHocPhan = ?', [req.params.maLhp], res, 'Lỗi!'));

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
            (SELECT COUNT(DISTINCT MSSV) FROM (SELECT MSSV FROM dangky_hocphan WHERE MaLopHocPhan = lhp.MaLopHocPhan AND TrangThai NOT IN ('Da huy', 'Tu choi') UNION SELECT MSSV FROM diem WHERE MaLopHocPhan = lhp.MaLopHocPhan) AS tmp) AS SiSoThucTe
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

    db.query('INSERT INTO lophocphan (MaLopHocPhan, MaMonHoc, MaLop, MaGiangVien, HocKy, NamHoc, SoLuongToiDa, PhamViDangKy) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [maLHP, MaMonHoc, finalMaLop, MaGiangVien, HocKy, NamHoc, SoLuongToiDa || 40, finalPhamVi], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi tạo Lớp HP!', error: err.message });

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
    });
});

app.delete('/api/teaching-assignments/:id', (req, res) => {
    db.query('SELECT TrangThaiLich FROM lophocphan WHERE MaLopHocPhan = ?', [req.params.id], (errLock, resLock) => {
        const isChot = resLock && resLock.length > 0 && resLock[0].TrangThaiLich === 'DA_CHOT';
        db.query('SELECT COUNT(*) as count FROM lichhoc WHERE MaLopHocPhan = ?', [req.params.id], (errLich, resLich) => {
            const hasLich = resLich && resLich.length > 0 && resLich[0].count > 0;
            if (isChot || hasLich) {
                return res.status(400).json({ success: false, message: 'Lớp đã được xếp lịch, không được xóa!' });
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

// 1. API Lấy danh sách LHP có thể đăng ký
app.get('/api/enrollment/available/:mssv', async (req, res) => {
  const { mssv } = req.params;
  try {
    const [diemCu] = await db.promise().query(`
      SELECT lhp.MaMonHoc, d.DiemTong
      FROM diem d
      JOIN lophocphan lhp ON d.MaLopHocPhan = lhp.MaLopHocPhan
      WHERE d.MSSV = ?
      ORDER BY d.HocKy DESC
    `, [mssv]);
    
    const diemMap = {};
    for (const d of diemCu) {
      if (!(d.MaMonHoc in diemMap)) {
        diemMap[d.MaMonHoc] = d.DiemTong;
      }
    }

    const [rows] = await db.promise().query(`
      SELECT 
        lhp.MaLopHocPhan, lhp.HocKy, lhp.NamHoc, lhp.MaLop, lhp.PhamViDangKy, mh.MaMonHoc, mh.TenMonHoc, mh.SoTinChi, lhp.SoLuongToiDa,
        COALESCE(
          (SELECT COUNT(*) FROM dangky_hocphan dk2
           WHERE dk2.MaLopHocPhan = lhp.MaLopHocPhan
             AND dk2.TrangThai NOT IN ('Da huy', 'Tu choi')),
          0
        ) AS DaDangKy,
        gv.HoTen AS TenGiangVien,
        MIN(lh.NgayHoc) AS NgayBatDau,
        MAX(lh.NgayHoc) AS NgayKetThuc,
        MAX(lh.CaHoc) AS CaHoc,
        MAX(lh.SoTiet) AS SoTiet,
        MAX(lh.PhongHoc) AS PhongHoc
      FROM lophocphan lhp
      JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc
      LEFT JOIN giangvien gv ON lhp.MaGiangVien = gv.MaGiangVien
      LEFT JOIN lichhoc lh ON lhp.MaLopHocPhan = lh.MaLopHocPhan
      WHERE 
        lhp.MaLopHocPhan NOT IN (
          SELECT MaLopHocPhan FROM dangky_hocphan 
          WHERE MSSV = ? AND TrangThai NOT IN ('Da huy', 'Tu choi')
        )
        AND lhp.MaLopHocPhan NOT IN (
          SELECT MaLopHocPhan FROM diem WHERE MSSV = ?
        )
        AND lhp.MaMonHoc NOT IN (
          SELECT lhp2.MaMonHoc 
          FROM dangky_hocphan dk
          JOIN lophocphan lhp2 ON dk.MaLopHocPhan = lhp2.MaLopHocPhan
          WHERE dk.MSSV = ? 
            AND lhp2.HocKy = lhp.HocKy 
            AND dk.TrangThai NOT IN ('Da huy', 'Tu choi')
        )
        AND (
          COALESCE(lhp.PhamViDangKy, 'THEO_KHOA') = 'TOAN_TRUONG'
          OR (COALESCE(lhp.PhamViDangKy, 'THEO_KHOA') = 'THEO_KHOA' AND (
                (lhp.MaLop IS NULL AND mh.MaKhoa = (
                  SELECT l.MaKhoa 
                  FROM sinhvien s 
                  JOIN lophoc l ON s.MaLop = l.MaLop 
                  WHERE s.MSSV = ?
                ))
                OR ((SELECT s.MaLop FROM sinhvien s WHERE s.MSSV = ?) = lhp.MaLop)
              ))
        )
      GROUP BY 
        lhp.MaLopHocPhan, lhp.HocKy, lhp.NamHoc, lhp.MaLop, lhp.PhamViDangKy, mh.MaMonHoc, mh.TenMonHoc, mh.SoTinChi, lhp.SoLuongToiDa, gv.HoTen
      ORDER BY mh.TenMonHoc, lhp.MaLopHocPhan
    `, [mssv, mssv, mssv, mssv, mssv]);

    const result = rows.map(r => ({
      ...r,
      DiemCu: diemMap[r.MaMonHoc] !== undefined ? diemMap[r.MaMonHoc] : null,
    }));

    const filtered = result.filter(r => {
      if (!r.DiemCu) return true; 
      const diem = parseFloat(r.DiemCu);
      if (isNaN(diem)) return true; 
      if (diem < 4.0) return true; 
      if (diem < 6.5) return true; 
      return false; 
    });

    res.json(filtered);
  } catch (err) {
    console.error('GET /available error:', err);
    res.status(500).json({ message: 'Lỗi server khi tải danh sách môn học.' });
  }
});

// 2. API Lấy tiến trình đăng ký
app.get('/api/enrollment/my-courses/:mssv', async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT dk.*, lhp.MaMonHoc, mh.TenMonHoc, mh.SoTinChi 
      FROM dangky_hocphan dk 
      JOIN lophocphan lhp ON dk.MaLopHocPhan = lhp.MaLopHocPhan 
      JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc 
      WHERE dk.MSSV = ? 
      ORDER BY dk.NgayDangKy DESC
    `, [req.params.mssv]);
    res.json(rows);
  } catch (err) {
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

    const [[lhp]] = await conn.query(`SELECT lhp.MaLopHocPhan, lhp.MaMonHoc, lhp.HocKy, lhp.NamHoc, lhp.SoLuongToiDa, mh.TenMonHoc, mh.SoTinChi FROM lophocphan lhp JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc WHERE lhp.MaLopHocPhan = ? FOR UPDATE`, [MaLopHocPhan]);
    if (!lhp) throw new Error('Lớp học phần không tồn tại.');

    const [[siSo]] = await conn.query(`SELECT COUNT(*) AS DaDangKy FROM dangky_hocphan WHERE MaLopHocPhan = ? AND TrangThai NOT IN ('Da huy', 'Tu choi')`, [MaLopHocPhan]);
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
      if (ca === '1') return {start: 1, end: 3}; if (ca === '2') return {start: 4, end: 6};
      if (ca === '3') return {start: 7, end: 9}; if (ca === '4') return {start: 10, end: 12};
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

    await conn.query(`INSERT INTO dangky_hocphan (MSSV, MaLopHocPhan, HocKy, TrangThai, NgayDangKy) VALUES (?, ?, ?, 'Đã duyệt', NOW())`, [MSSV, MaLopHocPhan, lhp.HocKy]);
    await conn.query(`INSERT IGNORE INTO diem (MSSV, MaLopHocPhan, HocKy) VALUES (?, ?, ?)`, [MSSV, MaLopHocPhan, lhp.HocKy]);
    
    await conn.commit();
    res.json({ success: true, message: `Đăng ký thành công lớp ${MaLopHocPhan}!` });

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

    const parseCaHoc = (caStr) => {
      if (!caStr) return { start: 0, end: 0 };
      const match = String(caStr).match(/(\d+)\s*-\s*(\d+)/);
      if (match) return { start: parseInt(match[1]), end: parseInt(match[2]) };
      const ca = String(caStr).replace(/\D/g, '');
      if (ca === '1') return {start: 1, end: 3}; if (ca === '2') return {start: 4, end: 6};
      if (ca === '3') return {start: 7, end: 9}; if (ca === '4') return {start: 10, end: 12};
      return { start: 0, end: 0 }; 
    };

    for (const item of cart) {
      const MaLopHocPhan = item.MaLopHocPhan;

      const [[lhp]] = await conn.query(`SELECT lhp.MaLopHocPhan, lhp.MaMonHoc, lhp.HocKy, lhp.NamHoc, lhp.SoLuongToiDa, mh.TenMonHoc, mh.SoTinChi FROM lophocphan lhp JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc WHERE lhp.MaLopHocPhan = ? FOR UPDATE`, [MaLopHocPhan]);
      if (!lhp) throw new Error(`Lớp học phần ${MaLopHocPhan} không tồn tại.`);

      const [[siSo]] = await conn.query(`SELECT COUNT(*) AS DaDangKy FROM dangky_hocphan WHERE MaLopHocPhan = ? AND TrangThai NOT IN ('Da huy', 'Tu choi')`, [MaLopHocPhan]);
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

      await conn.query(`INSERT INTO dangky_hocphan (MSSV, MaLopHocPhan, HocKy, TrangThai, NgayDangKy) VALUES (?, ?, ?, 'Đã duyệt', NOW())`, [MSSV, MaLopHocPhan, lhp.HocKy]);
      await conn.query(`INSERT IGNORE INTO diem (MSSV, MaLopHocPhan, HocKy) VALUES (?, ?, ?)`, [MSSV, MaLopHocPhan, lhp.HocKy]);
    }

    await conn.commit();
    res.json({ success: true, message: `Đăng ký thành công ${cart.length} môn học!` });

  } catch (err) {
    await conn.rollback();
    res.status(400).json({ message: err.message || 'Lỗi hệ thống khi đăng ký.' });
  } finally { conn.release(); }
});

// 5. API Hủy môn
app.delete('/api/enrollment/:mssv/:maLhp', async (req, res) => {
  try {
    const conn = await db.promise().getConnection();
    await conn.query(`DELETE FROM dangky_hocphan WHERE MSSV = ? AND MaLopHocPhan = ?`, [req.params.mssv, req.params.maLhp]);
    await conn.query(`DELETE FROM diem WHERE MSSV = ? AND MaLopHocPhan = ?`, [req.params.mssv, req.params.maLhp]);
    conn.release();
    res.json({ success: true, message: 'Đã hủy đăng ký môn học.' });
  } catch (err) { res.status(500).json({ message: 'Lỗi hủy môn!' }); }
});

// ------------------------------------------------------------------
// CỤM API QUẢN LÝ LỊCH HỌC
// ------------------------------------------------------------------

app.get('/api/schedule-configs', async (req, res) => {
    try {
        const promiseRooms = new Promise((resolve, reject) => { db.query("SELECT MaPhong FROM phonghoc WHERE TrangThai = 'Hoạt động'", (err, results) => { if (err) reject(err); else resolve(results.map(r => r.MaPhong)); }); });
        const promisePeriods = new Promise((resolve, reject) => { db.query("SELECT Tiet, DATE_FORMAT(GioBatDau, '%H:%i') as start, DATE_FORMAT(GioKetThuc, '%H:%i') as end FROM tiethoc ORDER BY Tiet", (err, results) => { if (err) reject(err); else { const periods = {}; results.forEach(r => { periods[r.Tiet] = { start: r.start, end: r.end }; }); resolve(periods); } }); });
        const [roomList, periodTimes] = await Promise.all([promiseRooms, promisePeriods]);
        res.json({ success: true, rooms: roomList, periods: periodTimes, tanSuat: [ { value: 1, label: '1 buổi / tuần' }, { value: 2, label: '2 buổi / tuần' } ], thuList: [ { value: 1, label: 'Thứ 2' }, { value: 2, label: 'Thứ 3' }, { value: 3, label: 'Thứ 4' }, { value: 4, label: 'Thứ 5' }, { value: 5, label: 'Thứ 6' }, { value: 6, label: 'Thứ 7' }, { value: 0, label: 'Chủ Nhật' } ] });
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
            (SELECT COALESCE(SUM(lh2.SoTiet), 0) FROM lichhoc lh2 WHERE lh2.MaLopHocPhan = lh.MaLopHocPhan) AS TongTietDaHoc
        FROM lichhoc lh
        LEFT JOIN lophocphan lhp ON lh.MaLopHocPhan = lhp.MaLopHocPhan
        LEFT JOIN giangvien gv ON lhp.MaGiangVien = gv.MaGiangVien
        LEFT JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc
        LEFT JOIN lophoc l ON lhp.MaLop = l.MaLop
    `;
    executeQuery(query, [], res, 'Lỗi lấy lịch học!');
});

// ĐÃ FIX: Bổ sung mh.SoTinChi để frontend hiển thị đúng số lượng tín chỉ
app.get('/api/students/:mssv/schedule', (req, res) => {
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
app.post('/api/announcements', (req, res) => executeInsert('INSERT INTO thongbao (TieuDe, NoiDung, NguoiTao, MaLop_Nhan) VALUES (?, ?, ?, ?)', [req.body.TieuDe, req.body.NoiDung, req.body.NguoiTao, req.body.MaLop_Nhan], res, 'Thêm thông báo thành công', 'Lỗi'));
app.put('/api/announcements/:id', (req, res) => executeUpdate('UPDATE thongbao SET TieuDe=?, NoiDung=?, NguoiTao=?, MaLop_Nhan=? WHERE MaThongBao=?', [req.body.TieuDe, req.body.NoiDung, req.body.NguoiTao, req.body.MaLop_Nhan, req.params.id], res, 'Cập nhật thành công', 'Lỗi'));
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
    const { DiemKhoaDanhGia, TongDiem, TrangThai, NguoiDuyet } = req.body;
    let xepLoai = 'Yếu';
    const diem = Number(TongDiem);
    if (diem >= 90) xepLoai = 'Xuất sắc';
    else if (diem >= 80) xepLoai = 'Tốt';
    else if (diem >= 65) xepLoai = 'Khá';
    else if (diem >= 50) xepLoai = 'Trung bình';

    const query = 'UPDATE danhgia_renluyen SET DiemLopDanhGia = 0, DiemKhoaDanhGia = ?, TongDiem = ?, XepLoai = ?, TrangThai = ? WHERE MaDanhGia = ?';
    db.query(query, [DiemKhoaDanhGia, TongDiem, xepLoai, TrangThai, req.params.id], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi cập nhật điểm!', error: err.message });

        const nguoiDuyet = NguoiDuyet || 'admin';
        const logMsg = `Đã chốt điểm: Cộng thêm ${DiemKhoaDanhGia}đ, Tổng điểm ${TongDiem}đ (${xepLoai}), Trạng thái: ${TrangThai}`;
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
        FROM yeucau_hotro y ORDER BY y.NgayGui DESC
    `;
    executeQuery(query, [], res, 'Lỗi lấy yêu cầu!');
});

app.put('/api/admin/support-requests/:id', (req, res) => {
    const { TrangThai, PhanHoi } = req.body;
    executeUpdate('UPDATE yeucau_hotro SET TrangThai = ?, PhanHoi = ?, NgayPhanHoi = NOW() WHERE MaYeuCau = ?', [TrangThai, PhanHoi, req.params.id], res, 'Phản hồi thành công!', 'Lỗi phản hồi!');
});

app.delete('/api/admin/support-requests/:id', (req, res) => {
    executeDelete('DELETE FROM yeucau_hotro WHERE MaYeuCau = ?', [req.params.id], res, 'Xóa yêu cầu thành công!', 'Lỗi xóa yêu cầu!');
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
    console.log('ChiTiet data:', JSON.stringify(ChiTiet, null, 2));

    let xepLoai = 'Yếu';
    if (DiemTuDanhGia >= 90) xepLoai = 'Xuất sắc';
    else if (DiemTuDanhGia >= 80) xepLoai = 'Tốt';
    else if (DiemTuDanhGia >= 65) xepLoai = 'Khá';
    else if (DiemTuDanhGia >= 50) xepLoai = 'Trung bình';

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

app.put('/api/training-points/:id', (req, res) => {
    const { DiemTuDanhGia, ChiTiet } = req.body;
    let xepLoai = 'Yếu';
    if (DiemTuDanhGia >= 90) xepLoai = 'Xuất sắc';
    else if (DiemTuDanhGia >= 80) xepLoai = 'Tốt';
    else if (DiemTuDanhGia >= 65) xepLoai = 'Khá';
    else if (DiemTuDanhGia >= 50) xepLoai = 'Trung bình';

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

// ==================== [SINH VIÊN] YÊU CẦU & HỖ TRỢ ====================
app.get('/api/support/student/:mssv', (req, res) => {
    const query = 'SELECT * FROM yeucau_hotro WHERE MSSV = ? ORDER BY NgayGui DESC';
    executeQuery(query, [req.params.mssv], res, 'Lỗi lấy danh sách yêu cầu!');
});

app.post('/api/support', (req, res) => {
    const { MSSV, LoaiYeuCau, ChuDe, NoiDung } = req.body;
    const query = "INSERT INTO yeucau_hotro (MSSV, LoaiYeuCau, ChuDe, NoiDung, NgayGui, TrangThai) VALUES (?, ?, ?, ?, NOW(), 'Đang xử lý')";
    executeInsert(query, [MSSV, LoaiYeuCau, ChuDe, NoiDung], res, 'Gửi yêu cầu thành công!', 'Lỗi gửi yêu cầu!');
});

// ==================== [GIẢNG VIÊN] YÊU CẦU & HỖ TRỢ ====================
app.get('/api/support/teacher/:maGV', (req, res) => {
    const query = 'SELECT * FROM yeucau_hotro WHERE MaGiangVien = ? ORDER BY NgayGui DESC';
    executeQuery(query, [req.params.maGV], res, 'Lỗi lấy danh sách yêu cầu!');
});

app.post('/api/support/teacher', (req, res) => {
    const { MaGiangVien, LoaiYeuCau, ChuDe, NoiDung } = req.body;
    const query = "INSERT INTO yeucau_hotro (MaGiangVien, LoaiYeuCau, ChuDe, NoiDung, NgayGui, TrangThai) VALUES (?, ?, ?, ?, NOW(), 'Đang xử lý')";
    executeInsert(query, [MaGiangVien, LoaiYeuCau, ChuDe, NoiDung], res, 'Gửi yêu cầu thành công!', 'Lỗi gửi yêu cầu!');
});

//=============================================================================
// Khởi chạy server backend (Không được xóa)
//=============================================================================
if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server Backend đang chạy tại cổng: http://localhost:${PORT}`);
    });
}
//
module.exports = app;
