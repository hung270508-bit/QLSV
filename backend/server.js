require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

// Middleware giải mã dữ liệu JSON và cho phép Frontend gọi API (CORS)
app.use(cors());
app.use(express.json());

// Cấu hình kết nối đến MySQL sử dụng biến môi trường từ file .env
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
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

// API Đăng nhập
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    // Kiểm tra đầu vào dữ liệu trống
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!'
        });
    }

    // Truy vấn kiểm tra tài khoản từ bảng users
    const query = 'SELECT MaTaiKhoan, TenDangNhap, role FROM users WHERE TenDangNhap = ? AND password = ?';
    
    db.query(query, [username, password], (err, results) => {
        if (err) {
            console.error('Lỗi truy vấn: ', err);
            return res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra tại hệ thống server!'
            });
        }

        // Nếu tìm thấy tài khoản trùng khớp
        if (results.length > 0) {
            const user = results[0];
            return res.json({
                success: true,
                message: 'Đăng nhập thành công!',
                user: {
                    id: user.MaTaiKhoan,       // Map lại thành id cho trùng khớp frontend
                    username: user.TenDangNhap, // Map lại thành username cho trùng khớp frontend
                    role: user.role
                }
            });
        } else {
            // Nếu không khớp tài khoản hoặc mật khẩu
            return res.status(401).json({
                success: false,
                message: 'Tên đăng nhập hoặc mật khẩu không chính xác!'
            });
        }
    });
});

// API Quên mật khẩu
app.post('/api/forgot-password', (req, res) => {
    const { email } = req.body;

    // Kiểm tra đầu vào dữ liệu trống
    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng nhập email!'
        });
    }

    // Truy vấn kiểm tra email trong bảng sinhvien và giangvien
    const query = `
        SELECT 'sinhvien' as userType, MSSV as id, HoTen as name, Email as email 
        FROM sinhvien WHERE Email = ?
        UNION
        SELECT 'giangvien' as userType, MaGiangVien as id, HoTen as name, Email as email 
        FROM giangvien WHERE Email = ?
    `;
    
    db.query(query, [email, email], (err, results) => {
        if (err) {
            console.error('Lỗi truy vấn: ', err);
            return res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra tại hệ thống server!'
            });
        }

        // Nếu tìm thấy email
        if (results.length > 0) {
            const user = results[0];
            // Trong thực tế, ở đây sẽ gửi email với link reset mật khẩu
            // Hiện tại chỉ trả về thông báo thành công
            return res.json({
                success: true,
                message: `Đã gửi liên kết đặt lại mật khẩu đến email ${email}. Vui lòng kiểm tra hộp thư của bạn!`
            });
        } else {
            // Nếu không tìm thấy email
            return res.status(404).json({
                success: false,
                message: 'Email không tồn tại trong hệ thống!'
            });
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
        res.json({
            totalStudents: students,
            totalSubjects: subjects,
            totalClasses: classes,
            totalTeachers: teachers
        });
    })
    .catch(err => {
        console.error('Error fetching dashboard stats:', err);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy thống kê!' });
    });
});

app.get('/api/dashboard/recent-students', (req, res) => {
    const query = `
        SELECT s.MSSV, s.HoTen, l.TenLop, u.NgayTao 
        FROM sinhvien s 
        JOIN lophoc l ON s.MaLop = l.MaLop 
        JOIN users u ON s.MaTaiKhoan = u.MaTaiKhoan 
        ORDER BY u.NgayTao DESC 
        LIMIT 5
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching recent students:', err);
            return res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách sinh viên mới!' });
        }
        res.json(results);
    });
});

// ==================== STUDENTS (SINHVIEN) ====================
app.get('/api/students', (req, res) => {
    const query = `
        SELECT s.MSSV, s.HoTen, s.NgaySinh, s.GioiTinh, s.Email, s.SoDienThoai, s.MaLop, l.TenLop 
        FROM sinhvien s 
        LEFT JOIN lophoc l ON s.MaLop = l.MaLop
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching students:', err);
            return res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách sinh viên!' });
        }
        res.json(results);
    });
});

app.post('/api/students', (req, res) => {
    const { MSSV, HoTen, NgaySinh, GioiTinh, Email, SoDienThoai, MaLop } = req.body;
    
    // First create user account
    const userQuery = 'INSERT INTO users (TenDangNhap, password, role) VALUES (?, ?, ?)';
    db.query(userQuery, [MSSV, '123', 'student'], (err, userResult) => {
        if (err) {
            console.error('Error creating user:', err);
            return res.status(500).json({ success: false, message: 'Lỗi khi tạo tài khoản!' });
        }
        
        const MaTaiKhoan = userResult.insertId;
        const studentQuery = 'INSERT INTO sinhvien (MSSV, MaTaiKhoan, HoTen, NgaySinh, GioiTinh, Email, SoDienThoai, MaLop) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        
        db.query(studentQuery, [MSSV, MaTaiKhoan, HoTen, NgaySinh, GioiTinh, Email, SoDienThoai, MaLop], (err) => {
            if (err) {
                console.error('Error creating student:', err);
                return res.status(500).json({ success: false, message: 'Lỗi khi thêm sinh viên!' });
            }
            res.json({ success: true, message: 'Thêm sinh viên thành công!' });
        });
    });
});

app.put('/api/students/:mssv', (req, res) => {
    const { mssv } = req.params;
    const { HoTen, NgaySinh, GioiTinh, Email, SoDienThoai, MaLop } = req.body;
    
    const query = 'UPDATE sinhvien SET HoTen = ?, NgaySinh = ?, GioiTinh = ?, Email = ?, SoDienThoai = ?, MaLop = ? WHERE MSSV = ?';
    
    db.query(query, [HoTen, NgaySinh, GioiTinh, Email, SoDienThoai, MaLop, mssv], (err) => {
        if (err) {
            console.error('Error updating student:', err);
            return res.status(500).json({ success: false, message: 'Lỗi khi cập nhật sinh viên!' });
        }
        res.json({ success: true, message: 'Cập nhật sinh viên thành công!' });
    });
});

app.delete('/api/students/:mssv', (req, res) => {
    const { mssv } = req.params;
    
    const query = 'DELETE FROM sinhvien WHERE MSSV = ?';
    
    db.query(query, [mssv], (err) => {
        if (err) {
            console.error('Error deleting student:', err);
            return res.status(500).json({ success: false, message: 'Lỗi khi xóa sinh viên!' });
        }
        res.json({ success: true, message: 'Xóa sinh viên thành công!' });
    });
});

// ==================== TEACHERS (GIANGVIEN) ====================
app.get('/api/teachers', (req, res) => {
    const query = `
        SELECT g.MaGiangVien, g.HoTen, g.Email, g.SoDienThoai, g.MaKhoa, k.TenKhoa 
        FROM giangvien g 
        LEFT JOIN khoa k ON g.MaKhoa = k.MaKhoa
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching teachers:', err);
            return res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách giảng viên!' });
        }
        res.json(results);
    });
});

app.post('/api/teachers', (req, res) => {
    const { MaGiangVien, HoTen, Email, SoDienThoai, MaKhoa } = req.body;
    
    // First create user account
    const userQuery = 'INSERT INTO users (TenDangNhap, password, role) VALUES (?, ?, ?)';
    db.query(userQuery, [MaGiangVien, '123', 'teacher'], (err, userResult) => {
        if (err) {
            console.error('Error creating user:', err);
            return res.status(500).json({ success: false, message: 'Lỗi khi tạo tài khoản!' });
        }
        
        const MaTaiKhoan = userResult.insertId;
        const teacherQuery = 'INSERT INTO giangvien (MaGiangVien, MaTaiKhoan, HoTen, Email, SoDienThoai, MaKhoa) VALUES (?, ?, ?, ?, ?, ?)';
        
        db.query(teacherQuery, [MaGiangVien, MaTaiKhoan, HoTen, Email, SoDienThoai, MaKhoa], (err) => {
            if (err) {
                console.error('Error creating teacher:', err);
                return res.status(500).json({ success: false, message: 'Lỗi khi thêm giảng viên!' });
            }
            res.json({ success: true, message: 'Thêm giảng viên thành công!' });
        });
    });
});

app.put('/api/teachers/:maGV', (req, res) => {
    const { maGV } = req.params;
    const { HoTen, Email, SoDienThoai, MaKhoa } = req.body;
    
    const query = 'UPDATE giangvien SET HoTen = ?, Email = ?, SoDienThoai = ?, MaKhoa = ? WHERE MaGiangVien = ?';
    
    db.query(query, [HoTen, Email, SoDienThoai, MaKhoa, maGV], (err) => {
        if (err) {
            console.error('Error updating teacher:', err);
            return res.status(500).json({ success: false, message: 'Lỗi khi cập nhật giảng viên!' });
        }
        res.json({ success: true, message: 'Cập nhật giảng viên thành công!' });
    });
});

app.delete('/api/teachers/:maGV', (req, res) => {
    const { maGV } = req.params;
    
    const query = 'DELETE FROM giangvien WHERE MaGiangVien = ?';
    
    db.query(query, [maGV], (err) => {
        if (err) {
            console.error('Error deleting teacher:', err);
            return res.status(500).json({ success: false, message: 'Lỗi khi xóa giảng viên!' });
        }
        res.json({ success: true, message: 'Xóa giảng viên thành công!' });
    });
});

// ==================== FACULTIES (KHOA) ====================
app.get('/api/faculties', (req, res) => {
    const query = 'SELECT * FROM khoa';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching faculties:', err);
            return res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách khoa!' });
        }
        res.json(results);
    });
});

app.post('/api/faculties', (req, res) => {
    const { MaKhoa, TenKhoa } = req.body;
    
    const query = 'INSERT INTO khoa (MaKhoa, TenKhoa) VALUES (?, ?)';
    
    db.query(query, [MaKhoa, TenKhoa], (err) => {
        if (err) {
            console.error('Error creating faculty:', err);
            return res.status(500).json({ success: false, message: 'Lỗi khi thêm khoa!' });
        }
        res.json({ success: true, message: 'Thêm khoa thành công!' });
    });
});

app.put('/api/faculties/:maKhoa', (req, res) => {
    const { maKhoa } = req.params;
    const { TenKhoa } = req.body;
    
    const query = 'UPDATE khoa SET TenKhoa = ? WHERE MaKhoa = ?';
    
    db.query(query, [TenKhoa, maKhoa], (err) => {
        if (err) {
            console.error('Error updating faculty:', err);
            return res.status(500).json({ success: false, message: 'Lỗi khi cập nhật khoa!' });
        }
        res.json({ success: true, message: 'Cập nhật khoa thành công!' });
    });
});

app.delete('/api/faculties/:maKhoa', (req, res) => {
    const { maKhoa } = req.params;
    
    const query = 'DELETE FROM khoa WHERE MaKhoa = ?';
    
    db.query(query, [maKhoa], (err) => {
        if (err) {
            console.error('Error deleting faculty:', err);
            return res.status(500).json({ success: false, message: 'Lỗi khi xóa khoa!' });
        }
        res.json({ success: true, message: 'Xóa khoa thành công!' });
    });
});

// ==================== SUBJECTS (MONHOC) ====================
app.get('/api/subjects', (req, res) => {
    const query = 'SELECT * FROM monhoc';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching subjects:', err);
            return res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách môn học!' });
        }
        res.json(results);
    });
});

app.post('/api/subjects', (req, res) => {
    const { MaMonHoc, TenMonHoc, SoTinChi } = req.body;
    
    const query = 'INSERT INTO monhoc (MaMonHoc, TenMonHoc, SoTinChi) VALUES (?, ?, ?)';
    
    db.query(query, [MaMonHoc, TenMonHoc, SoTinChi], (err) => {
        if (err) {
            console.error('Error creating subject:', err);
            return res.status(500).json({ success: false, message: 'Lỗi khi thêm môn học!' });
        }
        res.json({ success: true, message: 'Thêm môn học thành công!' });
    });
});

app.put('/api/subjects/:maMH', (req, res) => {
    const { maMH } = req.params;
    const { TenMonHoc, SoTinChi } = req.body;
    
    const query = 'UPDATE monhoc SET TenMonHoc = ?, SoTinChi = ? WHERE MaMonHoc = ?';
    
    db.query(query, [TenMonHoc, SoTinChi, maMH], (err) => {
        if (err) {
            console.error('Error updating subject:', err);
            return res.status(500).json({ success: false, message: 'Lỗi khi cập nhật môn học!' });
        }
        res.json({ success: true, message: 'Cập nhật môn học thành công!' });
    });
});

app.delete('/api/subjects/:maMH', (req, res) => {
    const { maMH } = req.params;
    
    const query = 'DELETE FROM monhoc WHERE MaMonHoc = ?';
    
    db.query(query, [maMH], (err) => {
        if (err) {
            console.error('Error deleting subject:', err);
            return res.status(500).json({ success: false, message: 'Lỗi khi xóa môn học!' });
        }
        res.json({ success: true, message: 'Xóa môn học thành công!' });
    });
});

// ==================== CLASSES (LOPHOC) ====================
app.get('/api/classes', (req, res) => {
    const query = `
        SELECT l.MaLop, l.TenLop, l.MaKhoa, k.TenKhoa 
        FROM lophoc l 
        LEFT JOIN khoa k ON l.MaKhoa = k.MaKhoa
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching classes:', err);
            return res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách lớp!' });
        }
        res.json(results);
    });
});

app.post('/api/classes', (req, res) => {
    const { MaLop, TenLop, MaKhoa } = req.body;
    
    const query = 'INSERT INTO lophoc (MaLop, TenLop, MaKhoa) VALUES (?, ?, ?)';
    
    db.query(query, [MaLop, TenLop, MaKhoa], (err) => {
        if (err) {
            console.error('Error creating class:', err);
            return res.status(500).json({ success: false, message: 'Lỗi khi thêm lớp!' });
        }
        res.json({ success: true, message: 'Thêm lớp thành công!' });
    });
});

app.put('/api/classes/:maLop', (req, res) => {
    const { maLop } = req.params;
    const { TenLop, MaKhoa } = req.body;
    
    const query = 'UPDATE lophoc SET TenLop = ?, MaKhoa = ? WHERE MaLop = ?';
    
    db.query(query, [TenLop, MaKhoa, maLop], (err) => {
        if (err) {
            console.error('Error updating class:', err);
            return res.status(500).json({ success: false, message: 'Lỗi khi cập nhật lớp!' });
        }
        res.json({ success: true, message: 'Cập nhật lớp thành công!' });
    });
});

app.delete('/api/classes/:maLop', (req, res) => {
    const { maLop } = req.params;
    
    const query = 'DELETE FROM lophoc WHERE MaLop = ?';
    
    db.query(query, [maLop], (err) => {
        if (err) {
            console.error('Error deleting class:', err);
            return res.status(500).json({ success: false, message: 'Lỗi khi xóa lớp!' });
        }
        res.json({ success: true, message: 'Xóa lớp thành công!' });
    });
});

// ==================== GRADES (DIEM) ====================
app.get('/api/grades', (req, res) => {
    const { MaLop, MaMonHoc, HocKy } = req.query;
    let query = `
        SELECT d.*, s.HoTen, s.MSSV, m.TenMonHoc 
        FROM diem d 
        JOIN sinhvien s ON d.MSSV = s.MSSV
        JOIN monhoc m ON d.MaMonHoc = m.MaMonHoc
    `;
    const params = [];
    
    if (MaLop) {
        query += ' JOIN lophoc l ON s.MaLop = l.MaLop WHERE l.MaLop = ?';
        params.push(MaLop);
    }
    if (MaMonHoc) {
        query += params.length ? ' AND d.MaMonHoc = ?' : ' WHERE d.MaMonHoc = ?';
        params.push(MaMonHoc);
    }
    if (HocKy) {
        query += params.length ? ' AND d.HocKy = ?' : ' WHERE d.HocKy = ?';
        params.push(HocKy);
    }
    
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Error fetching grades:', err);
            return res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách điểm!' });
        }
        res.json(results);
    });
});

app.post('/api/grades', (req, res) => {
    const grades = req.body.grades;
    
    const promises = grades.map(grade => {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO diem (MSSV, MaMonHoc, HocKy, DiemGiuaKy, DiemCuoiKy) 
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE DiemGiuaKy = VALUES(DiemGiuaKy), DiemCuoiKy = VALUES(DiemCuoiKy)
            `;
            db.query(query, [grade.MSSV, grade.MaMonHoc, grade.HocKy, grade.DiemGiuaKy, grade.DiemCuoiKy], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });
    
    Promise.all(promises)
        .then(() => res.json({ success: true, message: 'Lưu điểm thành công!' }))
        .catch(err => {
            console.error('Error saving grades:', err);
            res.status(500).json({ success: false, message: 'Lỗi khi lưu điểm!' });
        });
});

// ==================== COURSE SECTIONS (PHANCONG GIANG DAY) ====================
app.get('/api/course-sections', (req, res) => {
    const query = `
        SELECT pc.*, g.HoTen as TenGiangVien, m.TenMonHoc, l.TenLop
        FROM phanconggiangday pc
        LEFT JOIN giangvien g ON pc.MaGiangVien = g.MaGiangVien
        LEFT JOIN monhoc m ON pc.MaMonHoc = m.MaMonHoc
        LEFT JOIN lophoc l ON pc.MaLop = l.MaLop
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching course sections:', err);
            return res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách học phần!' });
        }
        res.json(results);
    });
});

app.post('/api/course-sections', (req, res) => {
    const { MaGiangVien, MaMonHoc, MaLop, HocKy } = req.body;

    const query = 'INSERT INTO phanconggiangday (MaGiangVien, MaMonHoc, MaLop, HocKy) VALUES (?, ?, ?, ?)';

    db.query(query, [MaGiangVien, MaMonHoc, MaLop, HocKy], (err) => {
        if (err) {
            console.error('Error creating course section:', err);
            return res.status(500).json({ success: false, message: 'Lỗi khi thêm học phần!' });
        }
        res.json({ success: true, message: 'Thêm học phần thành công!' });
    });
});

app.put('/api/course-sections/:maPC', (req, res) => {
    const { maPC } = req.params;
    const { MaGiangVien, MaMonHoc, MaLop, HocKy } = req.body;

    const query = 'UPDATE phanconggiangday SET MaGiangVien = ?, MaMonHoc = ?, MaLop = ?, HocKy = ? WHERE MaPhanCong = ?';

    db.query(query, [MaGiangVien, MaMonHoc, MaLop, HocKy, maPC], (err) => {
        if (err) {
            console.error('Error updating course section:', err);
            return res.status(500).json({ success: false, message: 'Lỗi khi cập nhật học phần!' });
        }
        res.json({ success: true, message: 'Cập nhật học phần thành công!' });
    });
});

app.delete('/api/course-sections/:maPC', (req, res) => {
    const { maPC } = req.params;

    const query = 'DELETE FROM phanconggiangday WHERE MaPhanCong = ?';

    db.query(query, [maPC], (err) => {
        if (err) {
            console.error('Error deleting course section:', err);
            return res.status(500).json({ success: false, message: 'Lỗi khi xóa học phần!' });
        }
        res.json({ success: true, message: 'Xóa học phần thành công!' });
    });
});

// ==================== USERS (TAI KHOAN) ====================
app.get('/api/users', (req, res) => {
    const query = 'SELECT MaTaiKhoan, TenDangNhap, role, NgayTao FROM users';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách tài khoản!' });
        }
        res.json(results);
    });
});

app.post('/api/users', (req, res) => {
    const { TenDangNhap, password, role } = req.body;
    
    const query = 'INSERT INTO users (TenDangNhap, password, role) VALUES (?, ?, ?)';
    
    db.query(query, [TenDangNhap, password, role], (err) => {
        if (err) {
            console.error('Error creating user:', err);
            return res.status(500).json({ success: false, message: 'Lỗi khi thêm tài khoản!' });
        }
        res.json({ success: true, message: 'Thêm tài khoản thành công!' });
    });
});

app.put('/api/users/:maTaiKhoan', (req, res) => {
    const { maTaiKhoan } = req.params;
    const { TenDangNhap, password, role } = req.body;
    
    const query = 'UPDATE users SET TenDangNhap = ?, password = ?, role = ? WHERE MaTaiKhoan = ?';
    
    db.query(query, [TenDangNhap, password, role, maTaiKhoan], (err) => {
        if (err) {
            console.error('Error updating user:', err);
            return res.status(500).json({ success: false, message: 'Lỗi khi cập nhật tài khoản!' });
        }
        res.json({ success: true, message: 'Cập nhật tài khoản thành công!' });
    });
});

app.delete('/api/users/:maTaiKhoan', (req, res) => {
    const { maTaiKhoan } = req.params;
    
    const query = 'DELETE FROM users WHERE MaTaiKhoan = ?';
    
    db.query(query, [maTaiKhoan], (err) => {
        if (err) {
            console.error('Error deleting user:', err);
            return res.status(500).json({ success: false, message: 'Lỗi khi xóa tài khoản!' });
        }
        res.json({ success: true, message: 'Xóa tài khoản thành công!' });
    });
});

// ==================== SCHEDULES (LICHHOC) ====================
app.get('/api/schedules', (req, res) => {
    const query = `
        SELECT l.*, pc.MaPhanCong, m.TenMonHoc, lop.TenLop
        FROM lichhoc l
        LEFT JOIN phanconggiangday pc ON l.MaPhanCong = pc.MaPhanCong
        LEFT JOIN monhoc m ON pc.MaMonHoc = m.MaMonHoc
        LEFT JOIN lophoc lop ON pc.MaLop = lop.MaLop
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching schedules:', err);
            return res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách lịch học!' });
        }
        res.json(results);
    });
});

app.post('/api/schedules', (req, res) => {
    const { MaPhanCong, Thu, CaHoc, PhongHoc } = req.body;

    const query = 'INSERT INTO lichhoc (MaPhanCong, Thu, CaHoc, PhongHoc) VALUES (?, ?, ?, ?)';

    db.query(query, [MaPhanCong, Thu, CaHoc, PhongHoc], (err) => {
        if (err) {
            console.error('Error creating schedule:', err);
            return res.status(500).json({ success: false, message: 'Lỗi khi thêm lịch học!' });
        }
        res.json({ success: true, message: 'Thêm lịch học thành công!' });
    });
});

app.put('/api/schedules/:maLichHoc', (req, res) => {
    const { maLichHoc } = req.params;
    const { MaPhanCong, Thu, CaHoc, PhongHoc } = req.body;

    const query = 'UPDATE lichhoc SET MaPhanCong = ?, Thu = ?, CaHoc = ?, PhongHoc = ? WHERE MaLichHoc = ?';

    db.query(query, [MaPhanCong, Thu, CaHoc, PhongHoc, maLichHoc], (err) => {
        if (err) {
            console.error('Error updating schedule:', err);
            return res.status(500).json({ success: false, message: 'Lỗi khi cập nhật lịch học!' });
        }
        res.json({ success: true, message: 'Cập nhật lịch học thành công!' });
    });
});

app.delete('/api/schedules/:maLichHoc', (req, res) => {
    const { maLichHoc } = req.params;

    const query = 'DELETE FROM lichhoc WHERE MaLichHoc = ?';

    db.query(query, [maLichHoc], (err) => {
        if (err) {
            console.error('Error deleting schedule:', err);
            return res.status(500).json({ success: false, message: 'Lỗi khi xóa lịch học!' });
        }
        res.json({ success: true, message: 'Xóa lịch học thành công!' });
    });
});

// Khởi chạy server backend
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server Backend đang chạy tại cổng: http://localhost:${PORT}`);
});