require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();

// Middleware giải mã dữ liệu JSON và cho phép Frontend gọi API (CORS)
app.use(cors());
app.use(express.json());

// Cấu hình kết nối đến MySQL sử dụng biến môi trường từ file .env
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'quanlysv'
});

// Kiểm tra kết nối DB
db.connect((err) => {
    if (err) {
        console.error('Lỗi kết nối MySQL: ' + err.stack);
        return;
    }
    console.log('Đã kết nối thành công đến cơ sở dữ liệu MySQL.');
});

// Helper functions để giảm lặp code
const executeQuery = (query, params, res, errorMessage) => {
    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: errorMessage });
        res.json(results);
    });
};

// Validation helper functions
const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

const validatePhone = (phone) => {
    const re = /^[0-9]{10,15}$/;
    return re.test(phone);
};

const validateMSSV = (mssv) => {
    const re = /^[0-9]{6,20}$/;
    return re.test(mssv);
};

// Academic calculation functions
const calculateGPA = (diemTB) => {
    if (diemTB >= 8.5) return 4.0;
    if (diemTB >= 7.0) return 3.0;
    if (diemTB >= 5.5) return 2.0;
    if (diemTB >= 4.0) return 1.0;
    return 0.0;
};

const calculateAcademicStanding = (gpa) => {
    if (gpa >= 3.6) return 'Giỏi';
    if (gpa >= 3.2) return 'Khá';
    if (gpa >= 2.5) return 'Trung bình';
    if (gpa >= 2.0) return 'Đạt';
    return 'Cảnh báo học vụ';
};

const calculateGradeAverage = (diemQuaTrinh, diemGiuaKy, diemCuoiKy) => {
    const qt = parseFloat(diemQuaTrinh) || 0;
    const gk = parseFloat(diemGiuaKy) || 0;
    const ck = parseFloat(diemCuoiKy) || 0;
    return ((qt * 0.2) + (gk * 0.3) + (ck * 0.5)).toFixed(2);
};

const executeInsert = (query, params, res, successMessage, errorMessage) => {
    db.query(query, params, (err) => {
        if (err) return res.status(500).json({ success: false, message: errorMessage });
        res.json({ success: true, message: successMessage });
    });
};

const executeUpdate = (query, params, res, successMessage, errorMessage) => {
    db.query(query, params, (err) => {
        if (err) return res.status(500).json({ success: false, message: errorMessage });
        res.json({ success: true, message: successMessage });
    });
};

const executeDelete = (query, params, res, successMessage, errorMessage) => {
    db.query(query, params, (err) => {
        if (err) return res.status(500).json({ success: false, message: errorMessage });
        res.json({ success: true, message: successMessage });
    });
};

// ==================== API ĐĂNG NHẬP ====================
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!'
        });
    }

    const query = `
        SELECT u.TaiKhoan, u.password, u.MaQuyen, p.TenQuyen,
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

    console.log('Login attempt for username:', username);
    db.query(query, [username], async (err, results) => {
        if (err) {
            console.error('Lỗi truy vấn SQL: ', err);
            console.error('SQL Error Code:', err.code);
            console.error('SQL Error Message:', err.message);
            return res.status(500).json({ success: false, message: 'Có lỗi xảy ra tại hệ thống server!' });
        }
        console.log('Query results:', results.length, 'rows found');

        if (results.length > 0) {
            const user = results[0];
            
            // Check if password is hashed (bcrypt) or plain text (for backward compatibility)
            let passwordMatch = false;
            if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
                // Hashed password - use bcrypt compare
                passwordMatch = await bcrypt.compare(password, user.password);
            } else {
                // Plain text password - direct comparison (for existing users)
                passwordMatch = (password === user.password);
            }

            if (passwordMatch) {
                // Map MaQuyen sang string để FE xử lý giao diện
                let roleString = 'student';
                if (user.MaQuyen === 1) roleString = 'admin';
                else if (user.MaQuyen === 2) roleString = 'teacher';

                // Xây dựng user object với thông tin đầy đủ theo role
                const userResponse = {
                    id: user.TaiKhoan,
                    username: user.TaiKhoan,
                    role: roleString,
                    tenQuyen: user.TenQuyen
                };

                // Thêm thông tin chi tiết theo role
                if (user.MaQuyen === 3) {
                    // Sinh viên
                    userResponse.hoTen = user.TenSinhVien;
                    userResponse.ngaySinh = user.NgaySinh;
                    userResponse.gioiTinh = user.GioiTinh;
                    userResponse.email = user.EmailSV;
                    userResponse.soDienThoai = user.SDTSV;
                    userResponse.maLop = user.MaLop;
                    userResponse.tenLop = user.TenLop;
                } else if (user.MaQuyen === 2) {
                    // Giảng viên
                    userResponse.hoTen = user.TenGiangVien;
                    userResponse.email = user.EmailGV;
                    userResponse.soDienThoai = user.SDTGV;
                    userResponse.maKhoa = user.MaKhoa;
                    userResponse.tenKhoa = user.TenKhoa;
                }

                return res.json({
                    success: true,
                    message: 'Đăng nhập thành công!',
                    user: userResponse
                });
            } else {
                return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác!' });
            }
        } else {
            return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác!' });
        }
    });
});

// ==================== API QUÊN MẬT KHẨU ====================
app.post('/api/forgot-password', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập email!' });
    }

    const query = `
        SELECT 'sinhvien' as userType, MSSV as id, HoTen as name, Email as email 
        FROM sinhvien WHERE Email = ?
        UNION
        SELECT 'giangvien' as userType, MaGiangVien as id, HoTen as name, Email as email 
        FROM giangvien WHERE Email = ?
    `;
    
    db.query(query, [email, email], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Có lỗi xảy ra tại hệ thống server!' });

        if (results.length > 0) {
            return res.json({
                success: true,
                message: `Đã gửi liên kết đặt lại mật khẩu đến email ${email}. Vui lòng kiểm tra hộp thư!`
            });
        } else {
            return res.status(404).json({ success: false, message: 'Email không tồn tại trong hệ thống!' });
        }
    });
});

// ==================== DASHBOARD STATISTICS ====================
app.get('/api/dashboard/stats', (req, res) => {
    const queries = [
        'SELECT COUNT(*) as total FROM sinhvien',
        'SELECT COUNT(*) as total FROM monhoc',
        'SELECT COUNT(*) as total FROM lophoc',
        'SELECT COUNT(*) as total FROM giangvien'
    ];

    Promise.all(queries.map(q => new Promise((resolve, reject) => {
        db.query(q, (err, results) => {
            if (err) reject(err);
            else resolve(results[0].total);
        });
    })))
    .then(([students, subjects, classes, teachers]) => {
        res.json({ totalStudents: students, totalSubjects: subjects, totalClasses: classes, totalTeachers: teachers });
    })
    .catch(err => {
        console.error('Error fetching dashboard stats:', err);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy thống kê!' });
    });
});

// Dashboard statistics by faculty
app.get('/api/dashboard/stats-by-faculty', (req, res) => {
    const query = `
        SELECT k.MaKhoa, k.TenKhoa,
               (SELECT COUNT(*) FROM sinhvien s JOIN lophoc l ON s.MaLop = l.MaLop WHERE l.MaKhoa = k.MaKhoa) as studentCount,
               (SELECT COUNT(*) FROM giangvien WHERE MaKhoa = k.MaKhoa) as teacherCount,
               (SELECT COUNT(*) FROM lophoc WHERE MaKhoa = k.MaKhoa) as classCount
        FROM khoa k
    `;
    executeQuery(query, [], res, 'Lỗi khi lấy thống kê theo khoa!');
});

// Academic standing statistics
app.get('/api/dashboard/academic-standing', (req, res) => {
    const query = `
        SELECT 
            COUNT(*) as totalStudents,
            SUM(CASE WHEN gpa >= 3.6 THEN 1 ELSE 0 END) as excellent,
            SUM(CASE WHEN gpa >= 3.2 AND gpa < 3.6 THEN 1 ELSE 0 END) as veryGood,
            SUM(CASE WHEN gpa >= 2.5 AND gpa < 3.2 THEN 1 ELSE 0 END) as good,
            SUM(CASE WHEN gpa >= 2.0 AND gpa < 2.5 THEN 1 ELSE 0 END) as average,
            SUM(CASE WHEN gpa < 2.0 THEN 1 ELSE 0 END) as warning
        FROM (
            SELECT 
                s.MSSV,
                ((SUM((d.DiemQuaTrinh * 0.2 + d.DiemGiuaKy * 0.3 + d.DiemCuoiKy * 0.5) * mh.SoTinChi)) / 
                 SUM(mh.SoTinChi)) as gpa
            FROM sinhvien s
            LEFT JOIN diem d ON s.MSSV = d.MSSV
            LEFT JOIN monhoc mh ON d.MaMonHoc = mh.MaMonHoc
            GROUP BY s.MSSV
        ) as student_gpa
    `;
    
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi khi lấy thống kê học vụ!' });
        res.json(results[0] || { totalStudents: 0, excellent: 0, veryGood: 0, good: 0, average: 0, warning: 0 });
    });
});

// Attendance statistics
app.get('/api/dashboard/attendance-stats', (req, res) => {
    const query = `
        SELECT 
            COUNT(*) as totalRecords,
            SUM(CASE WHEN TrangThai = 'Có mặt' THEN 1 ELSE 0 END) as present,
            SUM(CASE WHEN TrangThai = 'Vắng mặt' THEN 1 ELSE 0 END) as absent,
            SUM(CASE WHEN TrangThai = 'Có phép' THEN 1 ELSE 0 END) as excused
        FROM diemdanh
    `;
    
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi khi lấy thống kê điểm danh!' });
        const data = results[0] || { totalRecords: 0, present: 0, absent: 0, excused: 0 };
        const percentage = data.totalRecords > 0 ? ((data.present / data.totalRecords) * 100).toFixed(2) : 0;
        res.json({ ...data, attendanceRate: parseFloat(percentage) });
    });
});

app.get('/api/dashboard/recent-students', (req, res) => {
    const query = `
        SELECT s.MSSV, s.HoTen, l.TenLop, u.NgayTao 
        FROM sinhvien s 
        LEFT JOIN lophoc l ON s.MaLop = l.MaLop 
        JOIN users u ON s.MSSV = u.TaiKhoan 
        ORDER BY u.NgayTao DESC 
        LIMIT 5
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách sinh viên mới!' });
        res.json(results);
    });
});

// Lecturer workload statistics
app.get('/api/dashboard/lecturer-workload', (req, res) => {
    const query = `
        SELECT 
            g.MaGiangVien,
            g.HoTen,
            COUNT(DISTINCT pc.MaMonHoc) as soMonHoc,
            COUNT(DISTINCT pc.MaLop) as soLop,
            SUM(mh.SoTinChi) as tongTinChi
        FROM giangvien g
        LEFT JOIN phanconggiangday pc ON g.MaGiangVien = pc.MaGiangVien
        LEFT JOIN monhoc mh ON pc.MaMonHoc = mh.MaMonHoc
        GROUP BY g.MaGiangVien, g.HoTen
        ORDER BY tongTinChi DESC
    `;
    executeQuery(query, [], res, 'Lỗi khi lấy thống kê tải công giảng viên!');
});

// ==================== STUDENTS (SINHVIEN) ====================
app.get('/api/students', (req, res) => {
    const query = `
        SELECT s.MSSV, s.HoTen, s.NgaySinh, s.GioiTinh, s.Email, s.SoDienThoai, s.MaLop, l.TenLop 
        FROM sinhvien s 
        LEFT JOIN lophoc l ON s.MaLop = l.MaLop
    `;
    executeQuery(query, [], res, 'Lỗi khi lấy danh sách sinh viên!');
});

app.post('/api/students', async (req, res) => {
    const { MSSV, HoTen, NgaySinh, GioiTinh, Email, SoDienThoai, MaLop } = req.body;

    // Validation
    if (!validateMSSV(MSSV)) {
        return res.status(400).json({ success: false, message: 'MSSV không hợp lệ! Phải là 6-20 chữ số.' });
    }
    if (Email && !validateEmail(Email)) {
        return res.status(400).json({ success: false, message: 'Email không hợp lệ!' });
    }
    if (SoDienThoai && !validatePhone(SoDienThoai)) {
        return res.status(400).json({ success: false, message: 'Số điện thoại không hợp lệ! Phải là 10-15 chữ số.' });
    }
    if (!HoTen || HoTen.trim().length < 2) {
        return res.status(400).json({ success: false, message: 'Họ tên không được để trống!' });
    }
    if (!MaLop) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn lớp!' });
    }

    try {
        // Hash password
        const hashedPassword = await bcrypt.hash('123456aA@', saltRounds);
        
        // MaQuyen = 3 (Sinh viên)
        const userQuery = 'INSERT INTO users (TaiKhoan, password, MaQuyen) VALUES (?, ?, 3)';
        db.query(userQuery, [MSSV, hashedPassword], (err) => {
            if (err) return res.status(500).json({ success: false, message: 'Lỗi khi tạo tài khoản! Có thể MSSV đã tồn tại.' });
            
            const studentQuery = 'INSERT INTO sinhvien (MSSV, HoTen, NgaySinh, GioiTinh, Email, SoDienThoai, MaLop) VALUES (?, ?, ?, ?, ?, ?, ?)';
            db.query(studentQuery, [MSSV, HoTen, NgaySinh, GioiTinh, Email, SoDienThoai, MaLop], (err) => {
                if (err) return res.status(500).json({ success: false, message: 'Lỗi khi thêm sinh viên!' });
                res.json({ success: true, message: 'Thêm sinh viên thành công!' });
            });
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Lỗi khi mã hóa mật khẩu!' });
    }
});

app.put('/api/students/:mssv', (req, res) => {
    const { mssv } = req.params;
    const { HoTen, NgaySinh, GioiTinh, Email, SoDienThoai, MaLop } = req.body;
    const query = 'UPDATE sinhvien SET HoTen = ?, NgaySinh = ?, GioiTinh = ?, Email = ?, SoDienThoai = ?, MaLop = ? WHERE MSSV = ?';
    executeUpdate(query, [HoTen, NgaySinh, GioiTinh, Email, SoDienThoai, MaLop, mssv], res, 'Cập nhật thành công!', 'Lỗi khi cập nhật!');
});

app.delete('/api/students/:mssv', (req, res) => {
    const { mssv } = req.params;
    // Bảng users đã cấu hình ON DELETE CASCADE nên chỉ cần xóa tài khoản là thông tin sv bay theo
    const query = 'DELETE FROM users WHERE TaiKhoan = ?'; 
    executeDelete(query, [mssv], res, 'Xóa thành công!', 'Lỗi khi xóa!');
});

// ==================== TEACHERS (GIANGVIEN) ====================
app.get('/api/teachers', (req, res) => {
    const query = `
        SELECT g.MaGiangVien, g.HoTen, g.Email, g.SoDienThoai, g.MaKhoa, k.TenKhoa 
        FROM giangvien g 
        LEFT JOIN khoa k ON g.MaKhoa = k.MaKhoa
    `;
    executeQuery(query, [], res, 'Lỗi lấy giảng viên!');
});

app.post('/api/teachers', async (req, res) => {
    const { MaGiangVien, HoTen, Email, SoDienThoai, MaKhoa } = req.body;

    // Validation
    if (!MaGiangVien || MaGiangVien.trim().length < 2) {
        return res.status(400).json({ success: false, message: 'Mã giảng viên không được để trống!' });
    }
    if (Email && !validateEmail(Email)) {
        return res.status(400).json({ success: false, message: 'Email không hợp lệ!' });
    }
    if (SoDienThoai && !validatePhone(SoDienThoai)) {
        return res.status(400).json({ success: false, message: 'Số điện thoại không hợp lệ! Phải là 10-15 chữ số.' });
    }
    if (!HoTen || HoTen.trim().length < 2) {
        return res.status(400).json({ success: false, message: 'Họ tên không được để trống!' });
    }

    try {
        // Hash password
        const hashedPassword = await bcrypt.hash('gv@2025', saltRounds);
        
        // MaQuyen = 2 (Giảng viên)
        const userQuery = 'INSERT INTO users (TaiKhoan, password, MaQuyen) VALUES (?, ?, 2)';
        db.query(userQuery, [MaGiangVien, hashedPassword], (err) => {
            if (err) return res.status(500).json({ success: false, message: 'Lỗi tạo tài khoản GV!' });
            
            const teacherQuery = 'INSERT INTO giangvien (MaGiangVien, HoTen, Email, SoDienThoai, MaKhoa) VALUES (?, ?, ?, ?, ?)';
            db.query(teacherQuery, [MaGiangVien, HoTen, Email, SoDienThoai, MaKhoa], (err) => {
                if (err) return res.status(500).json({ success: false, message: 'Lỗi khi thêm giảng viên!' });
                res.json({ success: true, message: 'Thêm giảng viên thành công!' });
            });
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Lỗi khi mã hóa mật khẩu!' });
    }
});

app.put('/api/teachers/:maGV', (req, res) => {
    const { maGV } = req.params;
    const { HoTen, Email, SoDienThoai, MaKhoa } = req.body;
    const query = 'UPDATE giangvien SET HoTen = ?, Email = ?, SoDienThoai = ?, MaKhoa = ? WHERE MaGiangVien = ?';
    executeUpdate(query, [HoTen, Email, SoDienThoai, MaKhoa, maGV], res, 'Cập nhật giảng viên thành công!', 'Lỗi cập nhật giảng viên!');
});

app.delete('/api/teachers/:maGV', (req, res) => {
    const { maGV } = req.params;
    const query = 'DELETE FROM users WHERE TaiKhoan = ?';
    executeDelete(query, [maGV], res, 'Xóa giảng viên thành công!', 'Lỗi xóa giảng viên!');
});

// ==================== FACULTIES (KHOA) ====================
app.get('/api/faculties', (req, res) => {
    executeQuery('SELECT * FROM khoa', [], res, 'Lỗi lấy danh sách khoa!');
});

app.post('/api/faculties', (req, res) => {
    const { MaKhoa, TenKhoa } = req.body;
    executeInsert('INSERT INTO khoa (MaKhoa, TenKhoa) VALUES (?, ?)', [MaKhoa, TenKhoa], res, 'Thêm khoa thành công!', 'Lỗi thêm khoa!');
});

app.put('/api/faculties/:maKhoa', (req, res) => {
    const { TenKhoa } = req.body;
    executeUpdate('UPDATE khoa SET TenKhoa = ? WHERE MaKhoa = ?', [TenKhoa, req.params.maKhoa], res, 'Cập nhật khoa thành công!', 'Lỗi cập nhật khoa!');
});

app.delete('/api/faculties/:maKhoa', (req, res) => {
    executeDelete('DELETE FROM khoa WHERE MaKhoa = ?', [req.params.maKhoa], res, 'Xóa khoa thành công!', 'Lỗi xóa khoa!');
});

// Faculty details APIs
app.get('/api/faculties/:maKhoa/teachers', (req, res) => {
    const query = `
        SELECT gv.*
        FROM giangvien gv
        WHERE gv.MaKhoa = ?
    `;
    executeQuery(query, [req.params.maKhoa], res, 'Lỗi lấy giảng viên của khoa!');
});

app.get('/api/faculties/:maKhoa/students', (req, res) => {
    const query = `
        SELECT sv.*, l.TenLop
        FROM sinhvien sv
        LEFT JOIN lophoc l ON sv.MaLop = l.MaLop
        WHERE l.MaKhoa = ?
    `;
    executeQuery(query, [req.params.maKhoa], res, 'Lỗi lấy sinh viên của khoa!');
});

app.get('/api/faculties/:maKhoa/classes', (req, res) => {
    const query = `
        SELECT l.*, (SELECT COUNT(*) FROM sinhvien sv WHERE sv.MaLop = l.MaLop) as SoSinhVien
        FROM lophoc l
        WHERE l.MaKhoa = ?
    `;
    executeQuery(query, [req.params.maKhoa], res, 'Lỗi lấy lớp của khoa!');
});

app.get('/api/faculties/:maKhoa/students', (req, res) => {
    const query = `
        SELECT s.MSSV, s.HoTen, s.NgaySinh, s.GioiTinh, s.Email, s.SoDienThoai, s.MaLop, l.TenLop, l.MaKhoa, k.TenKhoa 
        FROM sinhvien s 
        INNER JOIN lophoc l ON s.MaLop = l.MaLop
        INNER JOIN khoa k ON l.MaKhoa = k.MaKhoa
        WHERE l.MaKhoa = ?
    `;
    executeQuery(query, [req.params.maKhoa], res, 'Lỗi lấy danh sách sinh viên theo khoa!');
});

app.get('/api/faculties/:maKhoa/classes', (req, res) => {
    const query = `
        SELECT l.MaLop, l.TenLop, l.MaKhoa, k.TenKhoa 
        FROM lophoc l 
        INNER JOIN khoa k ON l.MaKhoa = k.MaKhoa
        WHERE l.MaKhoa = ?
    `;
    executeQuery(query, [req.params.maKhoa], res, 'Lỗi lấy danh sách lớp theo khoa!');
});

// ==================== SUBJECTS (MONHOC) ====================
app.get('/api/subjects', (req, res) => {
    executeQuery('SELECT * FROM monhoc', [], res, 'Lỗi lấy môn học!');
});

app.post('/api/subjects', (req, res) => {
    const { MaMonHoc, TenMonHoc, SoTinChi } = req.body;
    executeInsert('INSERT INTO monhoc (MaMonHoc, TenMonHoc, SoTinChi) VALUES (?, ?, ?)', [MaMonHoc, TenMonHoc, SoTinChi], res, 'Thêm môn học thành công!', 'Lỗi thêm môn học!');
});

app.put('/api/subjects/:maMH', (req, res) => {
    const { TenMonHoc, SoTinChi } = req.body;
    executeUpdate('UPDATE monhoc SET TenMonHoc = ?, SoTinChi = ? WHERE MaMonHoc = ?', [TenMonHoc, SoTinChi, req.params.maMH], res, 'Cập nhật môn học thành công!', 'Lỗi cập nhật môn học!');
});

app.delete('/api/subjects/:maMH', (req, res) => {
    executeDelete('DELETE FROM monhoc WHERE MaMonHoc = ?', [req.params.maMH], res, 'Xóa môn học thành công!', 'Lỗi xóa môn học!');
});

// Subject details APIs
app.get('/api/subjects/:maMH/classes', (req, res) => {
    const query = `
        SELECT l.*, (SELECT COUNT(*) FROM sinhvien sv WHERE sv.MaLop = l.MaLop) as SoSinhVien
        FROM lophoc l
        INNER JOIN phanconggiangday pc ON l.MaLop = pc.MaLop
        WHERE pc.MaMonHoc = ?
        GROUP BY l.MaLop
    `;
    executeQuery(query, [req.params.maMH], res, 'Lỗi lấy lớp của môn học!');
});

app.get('/api/subjects/:maMH/teachers', (req, res) => {
    const query = `
        SELECT DISTINCT gv.*
        FROM giangvien gv
        INNER JOIN phanconggiangday pc ON gv.MaGiangVien = pc.MaGiangVien
        WHERE pc.MaMonHoc = ?
    `;
    executeQuery(query, [req.params.maMH], res, 'Lỗi lấy giảng viên của môn học!');
});

// ==================== CLASSES (LOPHOC) ====================
app.get('/api/classes', (req, res) => {
    const query = `
        SELECT l.MaLop, l.TenLop, l.MaKhoa, k.TenKhoa,
               (SELECT COUNT(*) FROM sinhvien sv WHERE sv.MaLop = l.MaLop) as SoSinhVien
        FROM lophoc l LEFT JOIN khoa k ON l.MaKhoa = k.MaKhoa
        ORDER BY l.MaLop
    `;
    executeQuery(query, [], res, 'Lỗi lấy lớp học!');
});

app.post('/api/classes', (req, res) => {
    const { MaLop, TenLop, MaKhoa } = req.body;
    executeInsert('INSERT INTO lophoc (MaLop, TenLop, MaKhoa) VALUES (?, ?, ?)', [MaLop, TenLop, MaKhoa], res, 'Thêm lớp thành công!', 'Lỗi thêm lớp!');
});

app.put('/api/classes/:maLop', (req, res) => {
    const { TenLop, MaKhoa } = req.body;
    executeUpdate('UPDATE lophoc SET TenLop = ?, MaKhoa = ? WHERE MaLop = ?', [TenLop, MaKhoa, req.params.maLop], res, 'Cập nhật lớp thành công!', 'Lỗi cập nhật lớp!');
});

app.delete('/api/classes/:maLop', (req, res) => {
    executeDelete('DELETE FROM lophoc WHERE MaLop = ?', [req.params.maLop], res, 'Xóa lớp thành công!', 'Lỗi xóa lớp!');
});



// ==================== USERS (TAI KHOAN TONG HOP) ====================
app.get('/api/users', (req, res) => {
    const query = `
        SELECT u.TaiKhoan, u.password, u.NgayTao, p.TenQuyen 
        FROM users u JOIN phanquyen p ON u.MaQuyen = p.MaQuyen
    `;
    executeQuery(query, [], res, 'Lỗi lấy danh sách tài khoản!');
});

app.delete('/api/users/:taiKhoan', (req, res) => {
    executeDelete('DELETE FROM users WHERE TaiKhoan = ?', [req.params.taiKhoan], res, 'Xóa tài khoản thành công!', 'Lỗi xóa tài khoản!');
});

// Reset password
app.post('/api/users/:taiKhoan/reset-password', async (req, res) => {
    const { taiKhoan } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu mới!' });
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        const query = 'UPDATE users SET password = ? WHERE TaiKhoan = ?';
        executeUpdate(query, [hashedPassword, taiKhoan], res, 'Đặt lại mật khẩu thành công!', 'Lỗi khi đặt lại mật khẩu!');
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Lỗi khi mã hóa mật khẩu!' });
    }
});

// ==================== STUDENT DETAILS ====================
app.get('/api/students/:mssv/details', (req, res) => {
    const { mssv } = req.params;
    const query = `
        SELECT s.*, l.TenLop, k.TenKhoa
        FROM sinhvien s
        LEFT JOIN lophoc l ON s.MaLop = l.MaLop
        LEFT JOIN khoa k ON l.MaKhoa = k.MaKhoa
        WHERE s.MSSV = ?
    `;
    executeQuery(query, [mssv], res, 'Lỗi khi lấy chi tiết sinh viên!');
});

app.get('/api/students/:mssv/schedule', (req, res) => {
    const { mssv } = req.params;
    const query = `
        SELECT lh.*, pc.MaMonHoc, pc.MaLop, pc.HocKy, mh.TenMonHoc, gv.HoTen as TenGiangVien
        FROM lichhoc lh
        LEFT JOIN phanconggiangday pc ON lh.MaPhanCong = pc.MaPhanCong
        LEFT JOIN monhoc mh ON pc.MaMonHoc = mh.MaMonHoc
        LEFT JOIN giangvien gv ON pc.MaGiangVien = gv.MaGiangVien
        WHERE pc.MaLop = (SELECT MaLop FROM sinhvien WHERE MSSV = ?)
    `;
    executeQuery(query, [mssv], res, 'Lỗi khi lấy lịch học sinh viên!');
});

// ==================== TEACHER DETAILS ====================
app.get('/api/teachers/:maGV/details', (req, res) => {
    const { maGV } = req.params;
    const query = `
        SELECT g.*, k.TenKhoa
        FROM giangvien g
        LEFT JOIN khoa k ON g.MaKhoa = k.MaKhoa
        WHERE g.MaGiangVien = ?
    `;
    executeQuery(query, [maGV], res, 'Lỗi khi lấy chi tiết giảng viên!');
});

app.get('/api/teachers/:maGV/teaching-schedule', (req, res) => {
    const { maGV } = req.params;
    const query = `
        SELECT lh.*, pc.MaMonHoc, pc.MaLop, pc.HocKy, mh.TenMonHoc, l.TenLop
        FROM lichhoc lh
        LEFT JOIN phanconggiangday pc ON lh.MaPhanCong = pc.MaPhanCong
        LEFT JOIN monhoc mh ON pc.MaMonHoc = mh.MaMonHoc
        LEFT JOIN lophoc l ON pc.MaLop = l.MaLop
        WHERE pc.MaGiangVien = ?
    `;
    executeQuery(query, [maGV], res, 'Lỗi khi lấy lịch giảng dạy!');
});

app.get('/api/teachers/:maGV/teaching-load', (req, res) => {
    const { maGV } = req.params;
    const query = `
        SELECT pc.MaMonHoc, mh.TenMonHoc, mh.SoTinChi, pc.MaLop, l.TenLop, pc.HocKy
        FROM phanconggiangday pc
        LEFT JOIN monhoc mh ON pc.MaMonHoc = mh.MaMonHoc
        LEFT JOIN lophoc l ON pc.MaLop = l.MaLop
        WHERE pc.MaGiangVien = ?
    `;
    executeQuery(query, [maGV], res, 'Lỗi khi lấy tải giảng dạy!');
});

// ==================== BULK OPERATIONS ====================
// Bulk insert grades
app.post('/api/grades/bulk', (req, res) => {
    const { grades } = req.body; // Array of grade objects
    
    if (!Array.isArray(grades) || grades.length === 0) {
        return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ!' });
    }

    const query = 'INSERT INTO diem (MSSV, MaMonHoc, HocKy, DiemQuaTrinh, DiemGiuaKy, DiemCuoiKy) VALUES (?, ?, ?, ?, ?, ?)';
    
    let completed = 0;
    let errors = [];

    grades.forEach((grade, index) => {
        db.query(query, [grade.MSSV, grade.MaMonHoc, grade.HocKy, grade.DiemQuaTrinh, grade.DiemGiuaKy, grade.DiemCuoiKy], (err) => {
            if (err) errors.push({ index, error: err.message });
            completed++;

            if (completed === grades.length) {
                if (errors.length > 0) {
                    res.status(207).json({ success: true, message: 'Nhập điểm thành công với một số lỗi!', errors });
                } else {
                    res.json({ success: true, message: 'Nhập điểm hàng loạt thành công!' });
                }
            }
        });
    });
});

// Bulk insert attendance
app.post('/api/attendance/bulk', (req, res) => {
    const { attendance } = req.body; // Array of attendance objects
    
    if (!Array.isArray(attendance) || attendance.length === 0) {
        return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ!' });
    }

    const query = 'INSERT INTO diemdanh (MaLichHoc, MSSV, NgayDiemDanh, TrangThai) VALUES (?, ?, ?, ?)';
    
    let completed = 0;
    let errors = [];

    attendance.forEach((att, index) => {
        db.query(query, [att.MaLichHoc, att.MSSV, att.NgayDiemDanh, att.TrangThai], (err) => {
            if (err) errors.push({ index, error: err.message });
            completed++;

            if (completed === attendance.length) {
                if (errors.length > 0) {
                    res.status(207).json({ success: true, message: 'Điểm danh thành công với một số lỗi!', errors });
                } else {
                    res.json({ success: true, message: 'Điểm danh hàng loạt thành công!' });
                }
            }
        });
    });
});

// ==================== CLASS DETAILS ====================
const normalizeClassGradeStats = (row) => ({
    totalGrades: Number(row?.totalGrades) || 0,
    average: Number(row?.average) || 0,
    excellent: Number(row?.excellent) || 0,
    good: Number(row?.good) || 0,
    averageGrade: Number(row?.averageGrade) || 0,
    fail: Number(row?.fail) || 0
});

const emptyClassGradeStats = () => normalizeClassGradeStats({});

app.get('/api/classes/:maLop/details', (req, res) => {
    const { maLop } = req.params;

    const studentsQuery = `
        SELECT s.MSSV, s.HoTen, s.NgaySinh, s.GioiTinh, s.Email, s.SoDienThoai, l.TenLop
        FROM sinhvien s
        LEFT JOIN lophoc l ON s.MaLop = l.MaLop
        WHERE s.MaLop = ?
        ORDER BY s.HoTen
    `;
    const scheduleQuery = `
        SELECT lh.MaLichHoc, lh.Thu, lh.CaHoc, lh.PhongHoc,
               pc.MaMonHoc, pc.HocKy, mh.TenMonHoc, mh.SoTinChi,
               gv.MaGiangVien, gv.HoTen as TenGiangVien
        FROM lichhoc lh
        LEFT JOIN phanconggiangday pc ON lh.MaPhanCong = pc.MaPhanCong
        LEFT JOIN monhoc mh ON pc.MaMonHoc = mh.MaMonHoc
        LEFT JOIN giangvien gv ON pc.MaGiangVien = gv.MaGiangVien
        WHERE pc.MaLop = ?
        ORDER BY lh.Thu, lh.CaHoc
    `;
    const teachersQuery = `
        SELECT DISTINCT gv.MaGiangVien, gv.HoTen as TenGiangVien, mh.TenMonHoc, pc.HocKy
        FROM phanconggiangday pc
        LEFT JOIN giangvien gv ON pc.MaGiangVien = gv.MaGiangVien
        LEFT JOIN monhoc mh ON pc.MaMonHoc = mh.MaMonHoc
        WHERE pc.MaLop = ?
        ORDER BY gv.HoTen, mh.TenMonHoc
    `;
    const gradeStatsQuery = `
        SELECT 
            COUNT(*) as totalGrades,
            ROUND(AVG(d.DiemQuaTrinh * 0.2 + d.DiemGiuaKy * 0.3 + d.DiemCuoiKy * 0.5), 2) as classAverage,
            SUM(CASE WHEN (d.DiemQuaTrinh * 0.2 + d.DiemGiuaKy * 0.3 + d.DiemCuoiKy * 0.5) >= 8.5 THEN 1 ELSE 0 END) as excellent,
            SUM(CASE WHEN (d.DiemQuaTrinh * 0.2 + d.DiemGiuaKy * 0.3 + d.DiemCuoiKy * 0.5) >= 7.0
                     AND (d.DiemQuaTrinh * 0.2 + d.DiemGiuaKy * 0.3 + d.DiemCuoiKy * 0.5) < 8.5 THEN 1 ELSE 0 END) as good,
            SUM(CASE WHEN (d.DiemQuaTrinh * 0.2 + d.DiemGiuaKy * 0.3 + d.DiemCuoiKy * 0.5) >= 5.0
                     AND (d.DiemQuaTrinh * 0.2 + d.DiemGiuaKy * 0.3 + d.DiemCuoiKy * 0.5) < 7.0 THEN 1 ELSE 0 END) as averageGrade,
            SUM(CASE WHEN (d.DiemQuaTrinh * 0.2 + d.DiemGiuaKy * 0.3 + d.DiemCuoiKy * 0.5) < 5.0 THEN 1 ELSE 0 END) as fail
        FROM diem d
        LEFT JOIN sinhvien s ON d.MSSV = s.MSSV
        WHERE s.MaLop = ?
    `;

    const result = { students: [], schedule: [], teachers: [], gradeStats: emptyClassGradeStats() };
    let pending = 4;
    let failed = false;

    const finish = (key, err, data) => {
        if (failed) return;
        if (err) {
            failed = true;
            return res.status(500).json({ success: false, message: 'Lỗi khi lấy chi tiết lớp học!' });
        }
        result[key] = data;
        pending -= 1;
        if (pending === 0) {
            res.json(result);
        }
    };

    db.query(studentsQuery, [maLop], (err, rows) => finish('students', err, rows || []));
    db.query(scheduleQuery, [maLop], (err, rows) => finish('schedule', err, rows || []));
    db.query(teachersQuery, [maLop], (err, rows) => finish('teachers', err, rows || []));
    db.query(gradeStatsQuery, [maLop], (err, rows) => {
        if (err) return finish('gradeStats', err, null);
        const stats = rows && rows[0] ? rows[0] : {};
        finish('gradeStats', null, normalizeClassGradeStats({
            totalGrades: stats.totalGrades,
            average: stats.classAverage,
            excellent: stats.excellent,
            good: stats.good,
            averageGrade: stats.averageGrade,
            fail: stats.fail
        }));
    });
});

app.get('/api/classes/:maLop/students', (req, res) => {
    const { maLop } = req.params;
    const query = `
        SELECT s.MSSV, s.HoTen, s.NgaySinh, s.GioiTinh, s.Email, s.SoDienThoai, l.TenLop
        FROM sinhvien s
        LEFT JOIN lophoc l ON s.MaLop = l.MaLop
        WHERE s.MaLop = ?
        ORDER BY s.HoTen
    `;
    executeQuery(query, [maLop], res, 'Lỗi khi lấy danh sách sinh viên lớp!');
});

app.get('/api/classes/:maLop/schedule', (req, res) => {
    const { maLop } = req.params;
    const query = `
        SELECT lh.MaLichHoc, lh.Thu, lh.CaHoc, lh.PhongHoc,
               pc.MaMonHoc, pc.HocKy, mh.TenMonHoc, mh.SoTinChi,
               gv.MaGiangVien, gv.HoTen as TenGiangVien
        FROM lichhoc lh
        LEFT JOIN phanconggiangday pc ON lh.MaPhanCong = pc.MaPhanCong
        LEFT JOIN monhoc mh ON pc.MaMonHoc = mh.MaMonHoc
        LEFT JOIN giangvien gv ON pc.MaGiangVien = gv.MaGiangVien
        WHERE pc.MaLop = ?
        ORDER BY lh.Thu, lh.CaHoc
    `;
    executeQuery(query, [maLop], res, 'Lỗi khi lấy lịch học lớp!');
});

app.get('/api/classes/:maLop/grade-stats', (req, res) => {
    const { maLop } = req.params;
    const query = `
        SELECT 
            COUNT(*) as totalGrades,
            ROUND(AVG(d.DiemQuaTrinh * 0.2 + d.DiemGiuaKy * 0.3 + d.DiemCuoiKy * 0.5), 2) as classAverage,
            SUM(CASE WHEN (d.DiemQuaTrinh * 0.2 + d.DiemGiuaKy * 0.3 + d.DiemCuoiKy * 0.5) >= 8.5 THEN 1 ELSE 0 END) as excellent,
            SUM(CASE WHEN (d.DiemQuaTrinh * 0.2 + d.DiemGiuaKy * 0.3 + d.DiemCuoiKy * 0.5) >= 7.0
                     AND (d.DiemQuaTrinh * 0.2 + d.DiemGiuaKy * 0.3 + d.DiemCuoiKy * 0.5) < 8.5 THEN 1 ELSE 0 END) as good,
            SUM(CASE WHEN (d.DiemQuaTrinh * 0.2 + d.DiemGiuaKy * 0.3 + d.DiemCuoiKy * 0.5) >= 5.0
                     AND (d.DiemQuaTrinh * 0.2 + d.DiemGiuaKy * 0.3 + d.DiemCuoiKy * 0.5) < 7.0 THEN 1 ELSE 0 END) as averageGrade,
            SUM(CASE WHEN (d.DiemQuaTrinh * 0.2 + d.DiemGiuaKy * 0.3 + d.DiemCuoiKy * 0.5) < 5.0 THEN 1 ELSE 0 END) as fail
        FROM diem d
        LEFT JOIN sinhvien s ON d.MSSV = s.MSSV
        WHERE s.MaLop = ?
    `;
    db.query(query, [maLop], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi khi lấy thống kê điểm lớp!' });
        const stats = rows && rows[0] ? rows[0] : {};
        res.json([normalizeClassGradeStats({
            totalGrades: stats.totalGrades,
            average: stats.classAverage,
            excellent: stats.excellent,
            good: stats.good,
            averageGrade: stats.averageGrade,
            fail: stats.fail
        })]);
    });
});

// ==================== TEACHING ASSIGNMENTS (PHANCONGGIANGDAY) ====================
app.get('/api/teaching-assignments', (req, res) => {
    const query = `
        SELECT pc.*, gv.HoTen as TenGiangVien, mh.TenMonHoc, l.TenLop
        FROM phanconggiangday pc
        LEFT JOIN giangvien gv ON pc.MaGiangVien = gv.MaGiangVien
        LEFT JOIN monhoc mh ON pc.MaMonHoc = mh.MaMonHoc
        LEFT JOIN lophoc l ON pc.MaLop = l.MaLop
    `;
    executeQuery(query, [], res, 'Lỗi lấy phân công giảng dạy!');
});

app.post('/api/teaching-assignments', (req, res) => {
    const { MaGiangVien, MaMonHoc, MaLop, HocKy } = req.body;
    const query = 'INSERT INTO phanconggiangday (MaGiangVien, MaMonHoc, MaLop, HocKy) VALUES (?, ?, ?, ?)';
    executeInsert(query, [MaGiangVien, MaMonHoc, MaLop, HocKy], res, 'Thêm phân công giảng dạy thành công!', 'Lỗi thêm phân công giảng dạy!');
});

app.put('/api/teaching-assignments/:maPhanCong', (req, res) => {
    const { maPhanCong } = req.params;
    const { MaGiangVien, MaMonHoc, MaLop, HocKy } = req.body;
    const query = 'UPDATE phanconggiangday SET MaGiangVien = ?, MaMonHoc = ?, MaLop = ?, HocKy = ? WHERE MaPhanCong = ?';
    executeUpdate(query, [MaGiangVien, MaMonHoc, MaLop, HocKy, maPhanCong], res, 'Cập nhật phân công giảng dạy thành công!', 'Lỗi cập nhật phân công giảng dạy!');
});

app.delete('/api/teaching-assignments/:maPhanCong', (req, res) => {
    executeDelete('DELETE FROM phanconggiangday WHERE MaPhanCong = ?', [req.params.maPhanCong], res, 'Xóa phân công giảng dạy thành công!', 'Lỗi xóa phân công giảng dạy!');
});

// ==================== SCHEDULES (LICHHOC) ====================
app.get('/api/schedules', (req, res) => {
    const query = `
        SELECT lh.*, pc.MaGiangVien, pc.MaMonHoc, pc.MaLop, pc.HocKy,
               gv.HoTen as TenGiangVien, mh.TenMonHoc, l.TenLop
        FROM lichhoc lh
        LEFT JOIN phanconggiangday pc ON lh.MaPhanCong = pc.MaPhanCong
        LEFT JOIN giangvien gv ON pc.MaGiangVien = gv.MaGiangVien
        LEFT JOIN monhoc mh ON pc.MaMonHoc = mh.MaMonHoc
        LEFT JOIN lophoc l ON pc.MaLop = l.MaLop
    `;
    executeQuery(query, [], res, 'Lỗi lấy lịch học!');
});

app.post('/api/schedules', (req, res) => {
    const { MaPhanCong, Thu, CaHoc, PhongHoc } = req.body;
    const query = 'INSERT INTO lichhoc (MaPhanCong, Thu, CaHoc, PhongHoc) VALUES (?, ?, ?, ?)';
    executeInsert(query, [MaPhanCong, Thu, CaHoc, PhongHoc], res, 'Thêm lịch học thành công!', 'Lỗi thêm lịch học!');
});

app.put('/api/schedules/:maLichHoc', (req, res) => {
    const { maLichHoc } = req.params;
    const { MaPhanCong, Thu, CaHoc, PhongHoc } = req.body;
    const query = 'UPDATE lichhoc SET MaPhanCong = ?, Thu = ?, CaHoc = ?, PhongHoc = ? WHERE MaLichHoc = ?';
    executeUpdate(query, [MaPhanCong, Thu, CaHoc, PhongHoc, maLichHoc], res, 'Cập nhật lịch học thành công!', 'Lỗi cập nhật lịch học!');
});

app.delete('/api/schedules/:maLichHoc', (req, res) => {
    executeDelete('DELETE FROM lichhoc WHERE MaLichHoc = ?', [req.params.maLichHoc], res, 'Xóa lịch học thành công!', 'Lỗi xóa lịch học!');
});

// ==================== GRADES (DIEM) ====================
app.get('/api/grades', (req, res) => {
    const query = `
        SELECT d.*, s.HoTen as TenSinhVien, mh.TenMonHoc
        FROM diem d
        LEFT JOIN sinhvien s ON d.MSSV = s.MSSV
        LEFT JOIN monhoc mh ON d.MaMonHoc = mh.MaMonHoc
    `;
    executeQuery(query, [], res, 'Lỗi lấy điểm!');
});

app.get('/api/grades/student/:mssv', (req, res) => {
    const query = `
        SELECT d.*, mh.TenMonHoc, mh.SoTinChi
        FROM diem d
        LEFT JOIN monhoc mh ON d.MaMonHoc = mh.MaMonHoc
        WHERE d.MSSV = ?
    `;
    executeQuery(query, [req.params.mssv], res, 'Lỗi lấy điểm sinh viên!');
});

app.post('/api/grades', (req, res) => {
    // Cập nhật lấy các trường mới từ req.body
    const { MSSV, MaMonHoc, HocKy, DiemChuyenCan, DiemBaiTap, DiemGiuaKy, DiemCuoiKy, DiemTong, DiemGPA, DiemChu, XepLoai } = req.body;
    
    const query = `
        INSERT INTO diem (MSSV, MaMonHoc, HocKy, DiemChuyenCan, DiemBaiTap, DiemGiuaKy, DiemCuoiKy, DiemTong, DiemGPA, DiemChu, XepLoai) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    executeInsert(query, [MSSV, MaMonHoc, HocKy, DiemChuyenCan, DiemBaiTap, DiemGiuaKy, DiemCuoiKy, DiemTong, DiemGPA, DiemChu, XepLoai], res, 'Thêm điểm thành công!', 'Lỗi thêm điểm!');
});

app.put('/api/grades/:maDiem', (req, res) => {
    const { maDiem } = req.params;
    // Cập nhật lấy các trường mới từ req.body
    const { MSSV, MaMonHoc, HocKy, DiemChuyenCan, DiemBaiTap, DiemGiuaKy, DiemCuoiKy, DiemTong, DiemGPA, DiemChu, XepLoai } = req.body;
    
    const query = `
        UPDATE diem 
        SET MSSV = ?, MaMonHoc = ?, HocKy = ?, DiemChuyenCan = ?, DiemBaiTap = ?, DiemGiuaKy = ?, DiemCuoiKy = ?, DiemTong = ?, DiemGPA = ?, DiemChu = ?, XepLoai = ? 
        WHERE MaDiem = ?
    `;
    
    executeUpdate(query, [MSSV, MaMonHoc, HocKy, DiemChuyenCan, DiemBaiTap, DiemGiuaKy, DiemCuoiKy, DiemTong, DiemGPA, DiemChu, XepLoai, maDiem], res, 'Cập nhật điểm thành công!', 'Lỗi cập nhật điểm!');
});

app.delete('/api/grades/:maDiem', (req, res) => {
    executeDelete('DELETE FROM diem WHERE MaDiem = ?', [req.params.maDiem], res, 'Xóa điểm thành công!', 'Lỗi xóa điểm!');
});

// ==================== GRADE STATISTICS ====================
app.get('/api/grades/statistics/:maMonHoc', (req, res) => {
    const { maMonHoc } = req.params;
    const query = `
        SELECT d.DiemQuaTrinh, d.DiemGiuaKy, d.DiemCuoiKy
        FROM diem d
        WHERE d.MaMonHoc = ?
    `;
    
    db.query(query, [maMonHoc], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi khi lấy thống kê điểm!' });
        
        if (results.length === 0) {
            return res.json({ 
                success: true, 
                totalStudents: 0,
                average: 0,
                highest: 0,
                lowest: 0,
                passRate: 0,
                gradeDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 }
            });
        }

        const averages = results.map(grade => {
            return parseFloat(calculateGradeAverage(grade.DiemQuaTrinh, grade.DiemGiuaKy, grade.DiemCuoiKy));
        });

        const sum = averages.reduce((a, b) => a + b, 0);
        const average = (sum / averages.length).toFixed(2);
        const highest = Math.max(...averages).toFixed(2);
        const lowest = Math.min(...averages).toFixed(2);
        const passed = averages.filter(a => a >= 4.0).length;
        const passRate = ((passed / averages.length) * 100).toFixed(2);

        const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
        averages.forEach(avg => {
            if (avg >= 8.5) gradeDistribution.A++;
            else if (avg >= 7.0) gradeDistribution.B++;
            else if (avg >= 5.5) gradeDistribution.C++;
            else if (avg >= 4.0) gradeDistribution.D++;
            else gradeDistribution.F++;
        });

        res.json({
            success: true,
            totalStudents: results.length,
            average: parseFloat(average),
            highest: parseFloat(highest),
            lowest: parseFloat(lowest),
            passRate: parseFloat(passRate),
            gradeDistribution
        });
    });
});

app.get('/api/grades/class-averages/:hocKy', (req, res) => {
    const { hocKy } = req.params;
    const query = `
        SELECT d.MaMonHoc, mh.TenMonHoc, d.DiemQuaTrinh, d.DiemGiuaKy, d.DiemCuoiKy
        FROM diem d
        LEFT JOIN monhoc mh ON d.MaMonHoc = mh.MaMonHoc
        WHERE d.HocKy = ?
    `;
    
    db.query(query, [hocKy], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi khi lấy điểm trung bình lớp!' });
        
        if (results.length === 0) {
            return res.json({ success: true, classAverages: [] });
        }

        const subjectGroups = {};
        results.forEach(grade => {
            if (!subjectGroups[grade.MaMonHoc]) {
                subjectGroups[grade.MaMonHoc] = {
                    MaMonHoc: grade.MaMonHoc,
                    TenMonHoc: grade.TenMonHoc,
                    grades: []
                };
            }
            subjectGroups[grade.MaMonHoc].grades.push(
                parseFloat(calculateGradeAverage(grade.DiemQuaTrinh, grade.DiemGiuaKy, grade.DiemCuoiKy))
            );
        });

        const classAverages = Object.values(subjectGroups).map(subject => {
            const sum = subject.grades.reduce((a, b) => a + b, 0);
            const average = (sum / subject.grades.length).toFixed(2);
            return {
                MaMonHoc: subject.MaMonHoc,
                TenMonHoc: subject.TenMonHoc,
                average: parseFloat(average),
                studentCount: subject.grades.length
            };
        });

        res.json({ success: true, classAverages });
    });
});

// ==================== ACADEMIC CALCULATIONS (GPA & ACADEMIC STANDING) ====================
app.get('/api/academic/gpa/:mssv', (req, res) => {
    const { mssv } = req.params;
    const query = `
        SELECT d.DiemQuaTrinh, d.DiemGiuaKy, d.DiemCuoiKy, mh.SoTinChi, d.HocKy
        FROM diem d
        LEFT JOIN monhoc mh ON d.MaMonHoc = mh.MaMonHoc
        WHERE d.MSSV = ?
    `;
    
    db.query(query, [mssv], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi khi tính GPA!' });
        
        if (results.length === 0) {
            return res.json({ 
                success: true, 
                gpa: 0, 
                totalCredits: 0, 
                academicStanding: 'Chưa có dữ liệu',
                semesterGPA: [],
                cumulativeGPA: 0
            });
        }

        let totalWeightedPoints = 0;
        let totalCredits = 0;
        const semesterData = {};

        results.forEach(grade => {
            const diemTB = parseFloat(calculateGradeAverage(grade.DiemQuaTrinh, grade.DiemGiuaKy, grade.DiemCuoiKy));
            const gpa = calculateGPA(diemTB);
            const credits = grade.SoTinChi || 0;
            
            totalWeightedPoints += gpa * credits;
            totalCredits += credits;

            // Group by semester
            if (!semesterData[grade.HocKy]) {
                semesterData[grade.HocKy] = { totalPoints: 0, totalCredits: 0 };
            }
            semesterData[grade.HocKy].totalPoints += gpa * credits;
            semesterData[grade.HocKy].totalCredits += credits;
        });

        const cumulativeGPA = totalCredits > 0 ? (totalWeightedPoints / totalCredits).toFixed(2) : 0;
        const academicStanding = calculateAcademicStanding(parseFloat(cumulativeGPA));

        // Calculate semester GPA
        const semesterGPA = Object.keys(semesterData).map(semester => ({
            semester,
            gpa: (semesterData[semester].totalPoints / semesterData[semester].totalCredits).toFixed(2),
            credits: semesterData[semester].totalCredits
        }));

        res.json({
            success: true,
            gpa: parseFloat(cumulativeGPA),
            totalCredits,
            academicStanding,
            semesterGPA,
            cumulativeGPA: parseFloat(cumulativeGPA)
        });
    });
});

app.get('/api/academic/transcript/:mssv', (req, res) => {
    const { mssv } = req.params;
    const query = `
        SELECT d.*, mh.TenMonHoc, mh.SoTinChi, s.HoTen, s.NgaySinh, s.GioiTinh, s.Email, s.MaLop, l.TenLop
        FROM diem d
        LEFT JOIN monhoc mh ON d.MaMonHoc = mh.MaMonHoc
        LEFT JOIN sinhvien s ON d.MSSV = s.MSSV
        LEFT JOIN lophoc l ON s.MaLop = l.MaLop
        WHERE d.MSSV = ?
        ORDER BY d.HocKy ASC
    `;
    
    db.query(query, [mssv], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi khi lấy bảng điểm!' });
        
        if (results.length === 0) {
            return res.json({ success: true, transcript: [], summary: null });
        }

        const transcript = results.map(grade => {
            const diemTB = parseFloat(calculateGradeAverage(grade.DiemQuaTrinh, grade.DiemGiuaKy, grade.DiemCuoiKy));
            const gpa = calculateGPA(diemTB);
            const credits = grade.SoTinChi || 0;
            
            return {
                ...grade,
                DiemTB: diemTB,
                GPA: gpa,
                SoTinChi: credits,
                DiemChu: diemTB >= 8.5 ? 'A' : diemTB >= 7.0 ? 'B' : diemTB >= 5.5 ? 'C' : diemTB >= 4.0 ? 'D' : 'F'
            };
        });

        // Calculate summary
        let totalCredits = 0;
        let totalWeightedPoints = 0;
        let passedCredits = 0;

        transcript.forEach(course => {
            totalCredits += course.SoTinChi;
            totalWeightedPoints += course.GPA * course.SoTinChi;
            if (course.DiemTB >= 4.0) passedCredits += course.SoTinChi;
        });

        const cumulativeGPA = totalCredits > 0 ? (totalWeightedPoints / totalCredits).toFixed(2) : 0;
        const academicStanding = calculateAcademicStanding(parseFloat(cumulativeGPA));

        const summary = {
            totalCredits,
            passedCredits,
            cumulativeGPA: parseFloat(cumulativeGPA),
            academicStanding,
            passRate: totalCredits > 0 ? ((passedCredits / totalCredits) * 100).toFixed(2) : 0
        };

        res.json({ success: true, transcript, summary });
    });
});

// ==================== ATTENDANCE (DIEMDANH) ====================
app.get('/api/attendance', (req, res) => {
    const query = `
        SELECT dd.*, s.HoTen as TenSinhVien, lh.PhongHoc, lh.Thu, lh.CaHoc
        FROM diemdanh dd
        LEFT JOIN sinhvien s ON dd.MSSV = s.MSSV
        LEFT JOIN lichhoc lh ON dd.MaLichHoc = lh.MaLichHoc
    `;
    executeQuery(query, [], res, 'Lỗi lấy điểm danh!');
});

app.get('/api/attendance/student/:mssv', (req, res) => {
    const query = `
        SELECT dd.*, lh.PhongHoc, lh.Thu, lh.CaHoc
        FROM diemdanh dd
        LEFT JOIN lichhoc lh ON dd.MaLichHoc = lh.MaLichHoc
        WHERE dd.MSSV = ?
    `;
    executeQuery(query, [req.params.mssv], res, 'Lỗi lấy điểm danh sinh viên!');
});

app.get('/api/attendance/percentage/:mssv', (req, res) => {
    const { mssv } = req.params;
    const query = `
        SELECT TrangThai
        FROM diemdanh
        WHERE MSSV = ?
    `;
    
    db.query(query, [mssv], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi khi tính tỷ lệ điểm danh!' });
        
        if (results.length === 0) {
            return res.json({ 
                success: true, 
                totalSessions: 0,
                present: 0,
                absent: 0,
                excused: 0,
                percentage: 0
            });
        }

        const totalSessions = results.length;
        const present = results.filter(r => r.TrangThai === 'Có mặt').length;
        const absent = results.filter(r => r.TrangThai === 'Vắng mặt').length;
        const excused = results.filter(r => r.TrangThai === 'Có phép').length;
        const percentage = totalSessions > 0 ? ((present / totalSessions) * 100).toFixed(2) : 0;

        res.json({
            success: true,
            totalSessions,
            present,
            absent,
            excused,
            percentage: parseFloat(percentage)
        });
    });
});

app.post('/api/attendance', (req, res) => {
    const { MaLichHoc, MSSV, NgayDiemDanh, TrangThai } = req.body;
    const query = 'INSERT INTO diemdanh (MaLichHoc, MSSV, NgayDiemDanh, TrangThai) VALUES (?, ?, ?, ?)';
    executeInsert(query, [MaLichHoc, MSSV, NgayDiemDanh, TrangThai], res, 'Thêm điểm danh thành công!', 'Lỗi thêm điểm danh!');
});

app.put('/api/attendance/:maDiemDanh', (req, res) => {
    const { maDiemDanh } = req.params;
    const { MaLichHoc, MSSV, NgayDiemDanh, TrangThai } = req.body;
    const query = 'UPDATE diemdanh SET MaLichHoc = ?, MSSV = ?, NgayDiemDanh = ?, TrangThai = ? WHERE MaDiemDanh = ?';
    executeUpdate(query, [MaLichHoc, MSSV, NgayDiemDanh, TrangThai, maDiemDanh], res, 'Cập nhật điểm danh thành công!', 'Lỗi cập nhật điểm danh!');
});

app.delete('/api/attendance/:maDiemDanh', (req, res) => {
    executeDelete('DELETE FROM diemdanh WHERE MaDiemDanh = ?', [req.params.maDiemDanh], res, 'Xóa điểm danh thành công!', 'Lỗi xóa điểm danh!');
});

// ==================== MATERIALS/ASSIGNMENTS (TAILIEU_BAITAP) ====================
app.get('/api/materials', (req, res) => {
    const query = `
        SELECT tl.*, pc.MaGiangVien, pc.MaMonHoc, pc.MaLop, pc.HocKy,
               gv.HoTen as TenGiangVien, mh.TenMonHoc, l.TenLop
        FROM tailieu_baitap tl
        LEFT JOIN phanconggiangday pc ON tl.MaPhanCong = pc.MaPhanCong
        LEFT JOIN giangvien gv ON pc.MaGiangVien = gv.MaGiangVien
        LEFT JOIN monhoc mh ON pc.MaMonHoc = mh.MaMonHoc
        LEFT JOIN lophoc l ON pc.MaLop = l.MaLop
    `;
    executeQuery(query, [], res, 'Lỗi lấy tài liệu/bài tập!');
});

app.post('/api/materials', (req, res) => {
    const { MaPhanCong, TieuDe, Loai, FileUrl, HanNop } = req.body;
    const query = 'INSERT INTO tailieu_baitap (MaPhanCong, TieuDe, Loai, FileUrl, HanNop) VALUES (?, ?, ?, ?, ?)';
    executeInsert(query, [MaPhanCong, TieuDe, Loai, FileUrl, HanNop], res, 'Thêm tài liệu/bài tập thành công!', 'Lỗi thêm tài liệu/bài tập!');
});

app.put('/api/materials/:maTaiLieu', (req, res) => {
    const { maTaiLieu } = req.params;
    const { MaPhanCong, TieuDe, Loai, FileUrl, HanNop } = req.body;
    const query = 'UPDATE tailieu_baitap SET MaPhanCong = ?, TieuDe = ?, Loai = ?, FileUrl = ?, HanNop = ? WHERE MaTaiLieu = ?';
    executeUpdate(query, [MaPhanCong, TieuDe, Loai, FileUrl, HanNop, maTaiLieu], res, 'Cập nhật tài liệu/bài tập thành công!', 'Lỗi cập nhật tài liệu/bài tập!');
});

app.delete('/api/materials/:maTaiLieu', (req, res) => {
    executeDelete('DELETE FROM tailieu_baitap WHERE MaTaiLieu = ?', [req.params.maTaiLieu], res, 'Xóa tài liệu/bài tập thành công!', 'Lỗi xóa tài liệu/bài tập!');
});

// ==================== SUBMISSIONS (NOPBAI) ====================
app.get('/api/submissions', (req, res) => {
    const query = `
        SELECT nb.*, s.HoTen as TenSinhVien, tl.TieuDe, tl.Loai
        FROM nopbai nb
        LEFT JOIN sinhvien s ON nb.MSSV = s.MSSV
        LEFT JOIN tailieu_baitap tl ON nb.MaTaiLieu = tl.MaTaiLieu
    `;
    executeQuery(query, [], res, 'Lỗi lấy bài nộp!');
});

app.get('/api/submissions/student/:mssv', (req, res) => {
    const query = `
        SELECT nb.*, tl.TieuDe, tl.Loai, tl.HanNop
        FROM nopbai nb
        LEFT JOIN tailieu_baitap tl ON nb.MaTaiLieu = tl.MaTaiLieu
        WHERE nb.MSSV = ?
    `;
    executeQuery(query, [req.params.mssv], res, 'Lỗi lấy bài nộp sinh viên!');
});

app.post('/api/submissions', (req, res) => {
    const { MaTaiLieu, MSSV, FileUrl, Diem } = req.body;
    const query = 'INSERT INTO nopbai (MaTaiLieu, MSSV, FileUrl, Diem) VALUES (?, ?, ?, ?)';
    executeInsert(query, [MaTaiLieu, MSSV, FileUrl, Diem], res, 'Thêm bài nộp thành công!', 'Lỗi thêm bài nộp!');
});

app.put('/api/submissions/:maNopBai', (req, res) => {
    const { maNopBai } = req.params;
    const { MaTaiLieu, MSSV, FileUrl, Diem } = req.body;
    const query = 'UPDATE nopbai SET MaTaiLieu = ?, MSSV = ?, FileUrl = ?, Diem = ? WHERE MaNopBai = ?';
    executeUpdate(query, [MaTaiLieu, MSSV, FileUrl, Diem, maNopBai], res, 'Cập nhật bài nộp thành công!', 'Lỗi cập nhật bài nộp!');
});

app.delete('/api/submissions/:maNopBai', (req, res) => {
    executeDelete('DELETE FROM nopbai WHERE MaNopBai = ?', [req.params.maNopBai], res, 'Xóa bài nộp thành công!', 'Lỗi xóa bài nộp!');
});

// ==================== ANNOUNCEMENTS (THONGBAO) ====================
app.get('/api/announcements', (req, res) => {
    const query = `
        SELECT tb.*, u.TaiKhoan as NguoiTaoTen, l.TenLop
        FROM thongbao tb
        LEFT JOIN users u ON tb.NguoiTao = u.TaiKhoan
        LEFT JOIN lophoc l ON tb.MaLop_Nhan = l.MaLop
        ORDER BY tb.NgayTao DESC
    `;
    executeQuery(query, [], res, 'Lỗi lấy thông báo!');
});

app.get('/api/announcements/class/:maLop', (req, res) => {
    const query = `
        SELECT tb.*, u.TaiKhoan as NguoiTaoTen
        FROM thongbao tb
        LEFT JOIN users u ON tb.NguoiTao = u.TaiKhoan
        WHERE tb.MaLop_Nhan = ? OR tb.MaLop_Nhan IS NULL
        ORDER BY tb.NgayTao DESC
    `;
    executeQuery(query, [req.params.maLop], res, 'Lỗi lấy thông báo lớp!');
});

app.post('/api/announcements', (req, res) => {
    const { TieuDe, NoiDung, NguoiTao, MaLop_Nhan } = req.body;
    const query = 'INSERT INTO thongbao (TieuDe, NoiDung, NguoiTao, MaLop_Nhan) VALUES (?, ?, ?, ?)';
    executeInsert(query, [TieuDe, NoiDung, NguoiTao, MaLop_Nhan], res, 'Thêm thông báo thành công!', 'Lỗi thêm thông báo!');
});

app.put('/api/announcements/:maThongBao', (req, res) => {
    const { maThongBao } = req.params;
    const { TieuDe, NoiDung, NguoiTao, MaLop_Nhan } = req.body;
    const query = 'UPDATE thongbao SET TieuDe = ?, NoiDung = ?, NguoiTao = ?, MaLop_Nhan = ? WHERE MaThongBao = ?';
    executeUpdate(query, [TieuDe, NoiDung, NguoiTao, MaLop_Nhan, maThongBao], res, 'Cập nhật thông báo thành công!', 'Lỗi cập nhật thông báo!');
});

app.delete('/api/announcements/:maThongBao', (req, res) => {
    executeDelete('DELETE FROM thongbao WHERE MaThongBao = ?', [req.params.maThongBao], res, 'Xóa thông báo thành công!', 'Lỗi xóa thông báo!');
});

// Khởi chạy server backend
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server Backend đang chạy tại cổng: http://localhost:${PORT}`);
});