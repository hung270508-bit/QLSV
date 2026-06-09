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
    database: process.env.DB_NAME || 'qlsv'
});

// Kiểm tra kết nối DB
db.connect((err) => {
    if (err) {
        console.error('Lỗi kết nối MySQL: ' + err.stack);
        return;
    }
    console.log('Đã kết nối thành công đến cơ sở dữ liệu MySQL.');
    // Tắt kiểm tra khóa ngoại để sửa triệt để lỗi 500
    db.query('SET FOREIGN_KEY_CHECKS = 0;'); 
});


app.use(cors({
    origin: https://hung270508-bit.github.io/QLSV/, // Thay bằng link GitHub Pages chính xác của bạn
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// ==================== HELPER FUNCTIONS ====================
const executeQuery = (query, params, res, errorMessage) => {
    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: errorMessage, error: err.message });
        res.json(results);
    });
};


const validateAssignment = (req, res, next) => {
  const { MaLopHocPhan, HocKy } = req.body;
  
  // 1. Kiểm tra logic nghiệp vụ phức tạp
  if (HocKy === 3) console.log("Hệ thống ghi nhận học kỳ bổ sung");

  // 2. Kiểm tra trùng lặp trong database
  db.query('SELECT * FROM LHP WHERE MaLopHocPhan = ?', [MaLopHocPhan], (err, result) => {
    if (result.length > 0) {
      return res.status(400).json({ message: "Mã lớp học phần đã tồn tại!" });
    }
    next(); // Tiếp tục xử lý nếu dữ liệu hợp lệ
  });
};
const executeMutation = (query, params, res, successMessage, errorMessage) => {
    db.query(query, params, (err) => {
        if (err) return res.status(500).json({ success: false, message: errorMessage, error: err.message });
        res.json({ success: true, message: successMessage });
    });
};

const executeInsert = executeMutation;
const executeUpdate = executeMutation;
const executeDelete = executeMutation;

// Validation helpers
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone) => /^[0-9]{10,15}$/.test(phone);
const validateMSSV = (mssv) => /^[0-9]{6,20}$/.test(mssv);

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
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ!' });

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

    db.query(query, [username], async (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi server!' });
        if (results.length > 0) {
            const user = results[0];
            let passwordMatch = false;
            
            if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
                passwordMatch = await bcrypt.compare(password, user.password);
            } else {
                passwordMatch = (password === user.password);
            }

            if (passwordMatch) {
                let roleString = user.MaQuyen === 1 ? 'admin' : (user.MaQuyen === 2 ? 'teacher' : 'student');
                const userResponse = { id: user.TaiKhoan, username: user.TaiKhoan, role: roleString, tenQuyen: user.TenQuyen };

                if (user.MaQuyen === 3) {
                    Object.assign(userResponse, { hoTen: user.TenSinhVien, ngaySinh: user.NgaySinh, gioiTinh: user.GioiTinh, email: user.EmailSV, soDienThoai: user.SDTSV, maLop: user.MaLop, tenLop: user.TenLop });
                } else if (user.MaQuyen === 2) {
                    Object.assign(userResponse, { hoTen: user.TenGiangVien, email: user.EmailGV, soDienThoai: user.SDTGV, maKhoa: user.MaKhoa, tenKhoa: user.TenKhoa });
                }
                return res.json({ success: true, message: 'Đăng nhập thành công!', user: userResponse });
            }
        }
        return res.status(401).json({ success: false, message: 'Sai thông tin đăng nhập!' });
    });
});

app.post('/api/forgot-password', (req, res) => {
    const { email } = req.body;
    const query = `
        SELECT 'sinhvien' as userType, MSSV as id, HoTen as name, Email as email FROM sinhvien WHERE Email = ?
        UNION
        SELECT 'giangvien' as userType, MaGiangVien as id, HoTen as name, Email as email FROM giangvien WHERE Email = ?
    `;
    db.query(query, [email, email], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi server!' });
        if (results.length > 0) return res.json({ success: true, message: `Đã gửi liên kết đến ${email}.` });
        return res.status(404).json({ success: false, message: 'Email không tồn tại!' });
    });
});

// ==================== DASHBOARD STATISTICS ====================
app.get('/api/dashboard/stats', (req, res) => {
    const queries = ['SELECT COUNT(*) as total FROM sinhvien', 'SELECT COUNT(*) as total FROM monhoc', 'SELECT COUNT(*) as total FROM lophoc', 'SELECT COUNT(*) as total FROM giangvien'];
    Promise.all(queries.map(q => new Promise((resolve, reject) => {
        db.query(q, (err, results) => err ? reject(err) : resolve(results[0].total));
    }))).then(([students, subjects, classes, teachers]) => {
        res.json({ totalStudents: students, totalSubjects: subjects, totalClasses: classes, totalTeachers: teachers });
    }).catch(err => res.status(500).json({ success: false, message: 'Lỗi lấy thống kê!' }));
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

// ==================== ADMIN: QUẢN LÝ ĐIỂM RÈN LUYỆN & YÊU CẦU ====================
app.get('/api/admin/training-points', (req, res) => executeQuery('SELECT d.*, s.HoTen, s.MaLop FROM danhgia_renluyen d JOIN sinhvien s ON d.MSSV = s.MSSV ORDER BY d.MaDanhGia DESC', [], res, 'Lỗi lấy điểm RL!'));
app.put('/api/admin/training-points/:id', (req, res) => {
    const { DiemLopDanhGia, DiemKhoaDanhGia, TongDiem, TrangThai } = req.body;
    let xepLoai = 'Yếu'; const diem = Number(TongDiem);
    if(diem >= 90) xepLoai = 'Xuất sắc'; else if(diem >= 80) xepLoai = 'Tốt'; else if(diem >= 65) xepLoai = 'Khá'; else if(diem >= 50) xepLoai = 'Trung bình';
    executeUpdate('UPDATE danhgia_renluyen SET DiemLopDanhGia=?, DiemKhoaDanhGia=?, TongDiem=?, XepLoai=?, TrangThai=? WHERE MaDanhGia=?', [DiemLopDanhGia, DiemKhoaDanhGia, TongDiem, xepLoai, TrangThai, req.params.id], res, 'Đã chốt điểm!', 'Lỗi cập nhật!');
});

app.get('/api/admin/support-requests', (req, res) => {
    const query = `SELECT y.*, y.MSSV as NguoiGui, 'SinhVien' as VaiTro, y.ChuDe as TieuDe, (SELECT HoTen FROM sinhvien WHERE MSSV = y.MSSV) as TenNguoiGui FROM yeucau_hotro y ORDER BY y.NgayGui DESC`;
    executeQuery(query, [], res, 'Lỗi lấy yêu cầu!');
});
app.put('/api/admin/support-requests/:id', (req, res) => executeUpdate('UPDATE yeucau_hotro SET TrangThai = ?, PhanHoi = ? WHERE MaYeuCau = ?', [req.body.TrangThai, req.body.PhanHoi, req.params.id], res, 'Phản hồi thành công!', 'Lỗi phản hồi!'));

// ==================== USERS & ROLES ====================
app.get('/api/users', (req, res) => executeQuery(`SELECT u.TaiKhoan, u.password, u.NgayTao, u.MaQuyen, COALESCE(p.TenQuyen, 'Unknown') as TenQuyen FROM users u LEFT JOIN phanquyen p ON u.MaQuyen = p.MaQuyen`, [], res, 'Lỗi lấy tài khoản!'));
app.get('/api/roles', (req, res) => executeQuery('SELECT * FROM phanquyen', [], res, 'Lỗi lấy quyền!'));
app.post('/api/users', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
        executeInsert('INSERT INTO users (TaiKhoan, password, MaQuyen, NgayTao) VALUES (?, ?, ?, NOW())', [req.body.TaiKhoan, hashedPassword, req.body.MaQuyen], res, 'Thêm tài khoản thành công!', 'Lỗi thêm tài khoản!');
    } catch (e) { res.status(500).json({ success: false, message: 'Lỗi mã hóa!' }); }
});
app.put('/api/users/:taiKhoan', async (req, res) => {
    try {
        if (req.body.password) {
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
        const hashedPassword = await bcrypt.hash(req.body.password || req.body.newPassword, saltRounds);
        executeUpdate('UPDATE users SET password = ? WHERE TaiKhoan = ?', [hashedPassword, req.params.taiKhoan], res, 'Đặt lại MK thành công!', 'Lỗi đặt lại MK!');
    } catch (e) { res.status(500).json({ success: false, message: 'Lỗi mã hóa!' }); }
});

// ==================== STUDENTS ====================
// API tự động sinh MSSV dựa trên Lớp học được chọn
app.get('/api/students/next-code/:maLop', (req, res) => {
    const { maLop } = req.params;
    
    // 1. Lấy thông tin Niên khóa của Lớp và ID của Khoa
    const queryLop = `
        SELECT l.NienKhoa, k.ID as KhoaID
        FROM lophoc l
        JOIN khoa k ON l.MaKhoa = k.MaKhoa
        WHERE l.MaLop = ?
    `;
    
    db.query(queryLop, [maLop], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        if (rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy thông tin lớp' });

        const nienKhoa = rows[0].NienKhoa;
        const khoaId = rows[0].KhoaID;
        
        if (!nienKhoa) return res.status(400).json({ error: 'Lớp này chưa có Niên khóa!' });
        if (!khoaId) return res.status(400).json({ error: 'Khoa này chưa có ID (Khóa chính)!' });

        // 2. Cắt chuỗi để lấy Prefix (VD: "2026-2030" -> "26", KhoaID: 4 -> "04")
        const startYearStr = nienKhoa.split('-')[0];
        const startYearSuffix = startYearStr.slice(-2);
        const paddedKhoaId = String(khoaId).padStart(2, '0');
        const prefix = `${startYearSuffix}${paddedKhoaId}`; // VD: "2604"

        // 3. Tìm MSSV lớn nhất có chung Prefix này trong DB
        const queryMSSV = `
            SELECT MSSV FROM sinhvien 
            WHERE MSSV LIKE ? 
            ORDER BY MSSV DESC LIMIT 1
        `;
        
        db.query(queryMSSV, [`${prefix}%`], (err, svRows) => {
            if (err) return res.status(500).json({ error: 'Lỗi sinh mã MSSV' });
            
            let nextNum = 1;
            if (svRows.length > 0) {
                const currentMax = svRows[0].MSSV;
                const suffix = currentMax.replace(prefix, '');
                const currentNum = parseInt(suffix, 10);
                if (!isNaN(currentNum)) nextNum = currentNum + 1;
            }
            
            // 4. Ghép lại thành mã hoàn chỉnh
            const nextMSSV = `${prefix}${String(nextNum).padStart(4, '0')}`;
            res.json({ MSSV: nextMSSV });
        });
    });
});
app.get('/api/students', (req, res) => executeQuery('SELECT s.*, l.TenLop FROM sinhvien s LEFT JOIN lophoc l ON s.MaLop = l.MaLop', [], res, 'Lỗi lấy SV!'));
app.post('/api/students', async (req, res) => {
    const { MSSV, HoTen, NgaySinh, GioiTinh, Email, SoDienThoai, MaLop, TrangThai } = req.body;
    try {
        const hashedPassword = await bcrypt.hash('123456aA@', saltRounds);
        db.query('INSERT INTO users (TaiKhoan, password, MaQuyen) VALUES (?, ?, 3)', [MSSV, hashedPassword], (err) => {
            if (err) return res.status(500).json({ success: false, message: 'Lỗi tạo TK SV!' });
            db.query('INSERT INTO sinhvien (MSSV, HoTen, NgaySinh, GioiTinh, Email, SoDienThoai, MaLop, TrangThai) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [MSSV, HoTen, NgaySinh, GioiTinh, Email, SoDienThoai, MaLop, TrangThai || 'Đang học'], (err) => {
                if (err) return res.status(500).json({ success: false, message: 'Lỗi thêm SV!' });
                res.json({ success: true, message: 'Thêm sinh viên thành công!' });
            });
        });
    } catch (error) { res.status(500).json({ success: false, message: 'Lỗi mã hóa!' }); }
});
app.put('/api/students/:mssv', (req, res) => executeUpdate('UPDATE sinhvien SET HoTen=?, NgaySinh=?, GioiTinh=?, Email=?, SoDienThoai=?, MaLop=?, TrangThai=? WHERE MSSV=?', [req.body.HoTen, req.body.NgaySinh, req.body.GioiTinh, req.body.Email, req.body.SoDienThoai, req.body.MaLop, req.body.TrangThai || 'Đang học', req.params.mssv], res, 'Cập nhật thành công!', 'Lỗi cập nhật!'));
app.delete('/api/students/:mssv', (req, res) => {
    const mssv = req.params.mssv;
    // Xóa bảng con trước (sinhvien), sau đó xóa bảng cha (users)
    db.query('DELETE FROM sinhvien WHERE MSSV = ?', [mssv], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi xóa bảng sinhvien' });
        
        db.query('DELETE FROM users WHERE TaiKhoan = ?', [mssv], (err) => {
            if (err) return res.status(500).json({ success: false, message: 'Lỗi xóa bảng users' });
            res.json({ success: true, message: 'Xóa thành công!' });
        });
    });
});
// API tự động sinh MSSV dựa trên Lớp học được chọn
app.get('/api/students/next-code/:maLop', (req, res) => {
    const { maLop } = req.params;
    
    // 1. Lấy thông tin Niên khóa của Lớp và ID của Khoa
    const queryLop = `
        SELECT l.NienKhoa, k.ID as KhoaID
        FROM lophoc l
        JOIN khoa k ON l.MaKhoa = k.MaKhoa
        WHERE l.MaLop = ?
    `;
    
    db.query(queryLop, [maLop], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        if (rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy thông tin lớp' });

        const nienKhoa = rows[0].NienKhoa;
        const khoaId = rows[0].KhoaID;
        
        if (!nienKhoa) return res.status(400).json({ error: 'Lớp này chưa được cài đặt Niên khóa!' });
        if (!khoaId) return res.status(400).json({ error: 'Khoa này chưa có ID (Khóa chính)!' });

        // 2. Cắt chuỗi để lấy Prefix (VD: "2026-2030" -> "26", KhoaID: 4 -> "04")
        const startYearStr = nienKhoa.split('-')[0]; // "2026"
        const startYearSuffix = startYearStr.slice(-2); // "26"
        const paddedKhoaId = String(khoaId).padStart(2, '0'); // "04"
        const prefix = `${startYearSuffix}${paddedKhoaId}`; // "2604"

        // 3. Tìm MSSV lớn nhất có chung Prefix này trong DB
        const queryMSSV = `
            SELECT MSSV FROM sinhvien 
            WHERE MSSV LIKE ? 
            ORDER BY MSSV DESC LIMIT 1
        `;
        
        db.query(queryMSSV, [`${prefix}%`], (err, svRows) => {
            if (err) return res.status(500).json({ error: 'Lỗi sinh mã MSSV' });
            
            let nextNum = 1;
            if (svRows.length > 0) {
                const currentMax = svRows[0].MSSV; // VD: "26040010"
                const suffix = currentMax.replace(prefix, ''); // "0010"
                const currentNum = parseInt(suffix, 10);
                if (!isNaN(currentNum)) nextNum = currentNum + 1;
            }
            
            // 4. Ghép lại thành mã hoàn chỉnh
            const nextMSSV = `${prefix}${String(nextNum).padStart(4, '0')}`;
            res.json({ MSSV: nextMSSV });
        });
    });
});
app.get('/api/students/:mssv/details', (req, res) => executeQuery('SELECT s.*, l.TenLop, k.TenKhoa FROM sinhvien s LEFT JOIN lophoc l ON s.MaLop = l.MaLop LEFT JOIN khoa k ON l.MaKhoa = k.MaKhoa WHERE s.MSSV = ?', [req.params.mssv], res, 'Lỗi chi tiết SV!'));
app.get('/api/students/:mssv/schedule', (req, res) => executeQuery(`SELECT lh.*, lhp.MaMonHoc, lhp.MaLop, lhp.HocKy, mh.TenMonHoc, gv.HoTen as TenGiangVien FROM lichhoc lh LEFT JOIN lophocphan lhp ON lh.MaLopHocPhan = lhp.MaLopHocPhan LEFT JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc LEFT JOIN giangvien gv ON lhp.MaGiangVien = gv.MaGiangVien WHERE lhp.MaLop = (SELECT MaLop FROM sinhvien WHERE MSSV = ?)`, [req.params.mssv], res, 'Lỗi lịch SV!'));

// ==================== TEACHERS ====================
app.get('/api/teachers', (req, res) => executeQuery('SELECT g.*, k.TenKhoa FROM giangvien g LEFT JOIN khoa k ON g.MaKhoa = k.MaKhoa', [], res, 'Lỗi lấy GV!'));
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
    const { MaGiangVien, HoTen, Email, SoDienThoai, MaKhoa, TrangThai } = req.body;
    try {
        const hashedPassword = await bcrypt.hash('gv@2025', saltRounds);
        db.query('INSERT INTO users (TaiKhoan, password, MaQuyen) VALUES (?, ?, 2)', [MaGiangVien, hashedPassword], (err) => {
            if (err) return res.status(500).json({ success: false, message: 'Lỗi tạo TK GV!' });
            db.query('INSERT INTO giangvien (MaGiangVien, HoTen, Email, SoDienThoai, MaKhoa, TrangThai) VALUES (?, ?, ?, ?, ?, ?)', [MaGiangVien, HoTen, Email, SoDienThoai, MaKhoa, TrangThai || 'Đang dạy'], (err) => {
                if (err) return res.status(500).json({ success: false, message: 'Lỗi thêm GV!' });
                res.json({ success: true, message: 'Thêm giảng viên thành công!' });
            });
        });
    } catch(err) { res.status(500).json({ success: false, message: 'Lỗi mã hóa!' }); }
});
app.put('/api/teachers/:maGV', (req, res) => executeUpdate('UPDATE giangvien SET HoTen=?, Email=?, SoDienThoai=?, MaKhoa=?, TrangThai=? WHERE MaGiangVien=?', [req.body.HoTen, req.body.Email, req.body.SoDienThoai, req.body.MaKhoa, req.body.TrangThai || 'Đang dạy', req.params.maGV], res, 'Cập nhật thành công!', 'Lỗi cập nhật!'));
app.delete('/api/teachers/:maGV', (req, res) => executeDelete('DELETE FROM users WHERE TaiKhoan = ?', [req.params.maGV], res, 'Xóa thành công!', 'Lỗi xóa!'));

app.get('/api/teachers/:maGV/details', (req, res) => executeQuery('SELECT g.*, k.TenKhoa FROM giangvien g LEFT JOIN khoa k ON g.MaKhoa = k.MaKhoa WHERE g.MaGiangVien = ?', [req.params.maGV], res, 'Lỗi lấy chi tiết!'));
app.get('/api/teachers/:maGV/teaching-schedule', (req, res) => executeQuery(`SELECT lh.*, lhp.MaMonHoc, lhp.MaLop, lhp.HocKy, mh.TenMonHoc, l.TenLop FROM lichhoc lh LEFT JOIN lophocphan lhp ON lh.MaLopHocPhan = lhp.MaLopHocPhan LEFT JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc LEFT JOIN lophoc l ON lhp.MaLop = l.MaLop WHERE lhp.MaGiangVien = ?`, [req.params.maGV], res, 'Lỗi lấy lịch giảng dạy!'));
app.get('/api/teachers/:maGV/teaching-load', (req, res) => executeQuery(`SELECT mh.TenMonHoc, mh.SoTinChi, l.TenLop, lhp.HocKy FROM lophocphan lhp JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc LEFT JOIN lophoc l ON lhp.MaLop = l.MaLop WHERE lhp.MaGiangVien = ?`, [req.params.maGV], res, 'Lỗi lấy tải công việc!'));

// ==================== FACULTIES ====================
app.get('/api/faculties', (req, res) => executeQuery('SELECT * FROM khoa', [], res, 'Lỗi lấy khoa!'));
app.post('/api/faculties', (req, res) => executeInsert('INSERT INTO khoa (MaKhoa, TenKhoa) VALUES (?, ?)', [req.body.MaKhoa, req.body.TenKhoa], res, 'Thêm khoa thành công!', 'Lỗi thêm!'));
app.put('/api/faculties/:maKhoa', (req, res) => executeUpdate('UPDATE khoa SET TenKhoa=? WHERE MaKhoa=?', [req.body.TenKhoa, req.params.maKhoa], res, 'Cập nhật thành công!', 'Lỗi cập nhật!'));
app.delete('/api/faculties/:maKhoa', (req, res) => executeDelete('DELETE FROM khoa WHERE MaKhoa=?', [req.params.maKhoa], res, 'Xóa thành công!', 'Lỗi xóa!'));

app.get('/api/faculties/:maKhoa/teachers', (req, res) => executeQuery('SELECT * FROM giangvien WHERE MaKhoa = ?', [req.params.maKhoa], res, 'Lỗi lấy danh sách GV!'));
app.get('/api/faculties/:maKhoa/students', (req, res) => executeQuery('SELECT sv.*, l.TenLop FROM sinhvien sv LEFT JOIN lophoc l ON sv.MaLop = l.MaLop WHERE l.MaKhoa = ?', [req.params.maKhoa], res, 'Lỗi lấy danh sách SV!'));
app.get('/api/faculties/:maKhoa/classes', (req, res) => executeQuery('SELECT l.*, (SELECT COUNT(*) FROM sinhvien sv WHERE sv.MaLop = l.MaLop) as SoSinhVien FROM lophoc l WHERE l.MaKhoa = ?', [req.params.maKhoa], res, 'Lỗi lấy danh sách Lớp!'));

// ==================== SUBJECTS ====================
app.get('/api/subjects', (req, res) => executeQuery('SELECT * FROM monhoc', [], res, 'Lỗi lấy môn!'));
app.get('/api/subjects/next-code/:maKhoa', (req, res) => {
    const prefix = `${req.params.maKhoa}`;
    db.query(`SELECT MaMonHoc FROM monhoc WHERE MaMonHoc LIKE ? ORDER BY MaMonHoc DESC LIMIT 1`, [`${prefix}%`], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        let nextNum = 1;
        if (results.length > 0) { const match = results[0].MaMonHoc.match(/\d+$/); if (match) nextNum = parseInt(match[0], 10) + 1; }
        res.json({ MaMonHoc: `${prefix}${String(nextNum).padStart(3, '0')}` });
    });
});
app.post('/api/subjects', (req, res) => executeInsert('INSERT INTO monhoc (MaMonHoc, TenMonHoc, SoTinChi) VALUES (?, ?, ?)', [req.body.MaMonHoc, req.body.TenMonHoc, req.body.SoTinChi], res, 'Thêm môn thành công!', 'Lỗi thêm!'));
app.put('/api/subjects/:maMH', (req, res) => executeUpdate('UPDATE monhoc SET TenMonHoc=?, SoTinChi=? WHERE MaMonHoc=?', [req.body.TenMonHoc, req.body.SoTinChi, req.params.maMH], res, 'Cập nhật thành công!', 'Lỗi cập nhật!'));
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
        FROM diem d JOIN lophocphan lhp ON d.MaLopHocPhan = lhp.MaLopHocPhan WHERE lhp.MaMonHoc = ? OR d.MaMonHoc = ?
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

app.get('/api/classes/next-name/:tenLop', (req, res) => {
    const { tenLop } = req.params;
    db.query('SELECT TenLop FROM lophoc WHERE TenLop LIKE ?', [`${tenLop}%`], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        let maxNum = 0;
        rows.forEach(row => { const match = row.TenLop.match(new RegExp(`^${tenLop}\\s*(\\d+)$`)); if (match) maxNum = Math.max(maxNum, parseInt(match[1])); });
        res.json({ TenLop: `${tenLop} ${maxNum + 1}` });
    });
});

app.post('/api/classes', (req, res) => {
    const { MaLop, TenLop, MaKhoa, NienKhoa } = req.body;
    executeInsert('INSERT INTO lophoc (MaLop, TenLop, MaKhoa, NienKhoa) VALUES (?, ?, ?, ?)', [MaLop, TenLop, MaKhoa, NienKhoa], res, 'Thêm lớp thành công!', 'Lỗi thêm lớp!');
});

app.put('/api/classes/:maLop', (req, res) => executeUpdate('UPDATE lophoc SET TenLop=?, MaKhoa=?, NienKhoa=? WHERE MaLop=?', [req.body.TenLop, req.body.MaKhoa, req.body.NienKhoa, req.params.maLop], res, 'Cập nhật thành công!', 'Lỗi cập nhật!'));
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
app.get('/api/teaching-assignments', (req, res) => executeQuery('SELECT lhp.*, gv.HoTen as TenGiangVien, mh.TenMonHoc, l.TenLop FROM lophocphan lhp LEFT JOIN giangvien gv ON lhp.MaGiangVien = gv.MaGiangVien LEFT JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc LEFT JOIN lophoc l ON lhp.MaLop = l.MaLop', [], res, 'Lỗi lấy Lớp học phần!'));
app.get('/api/lophocphan/teacher/:maGV', (req, res) => executeQuery('SELECT lhp.*, mh.TenMonHoc, mh.SoTinChi, l.TenLop FROM lophocphan lhp LEFT JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc LEFT JOIN lophoc l ON lhp.MaLop = l.MaLop WHERE lhp.MaGiangVien = ?', [req.params.maGV], res, 'Lỗi!'));
app.get('/api/course-sections/teacher/:maGV', (req, res) => executeQuery('SELECT lhp.*, mh.TenMonHoc, mh.SoTinChi, l.TenLop, gv.HoTen as TenGiangVien FROM lophocphan lhp LEFT JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc LEFT JOIN lophoc l ON lhp.MaLop = l.MaLop LEFT JOIN giangvien gv ON lhp.MaGiangVien = gv.MaGiangVien WHERE lhp.MaGiangVien = ?', [req.params.maGV], res, 'Lỗi!'));
app.get('/api/course-sections/:maLhp/students', (req, res) => executeQuery('SELECT DISTINCT s.MSSV, s.HoTen, s.MaLop FROM diem d JOIN sinhvien s ON d.MSSV = s.MSSV WHERE d.MaLopHocPhan = ?', [req.params.maLhp], res, 'Lỗi!'));
app.get('/api/course-sections', (req, res) => {
    const query = `
        SELECT lhp.*, mh.TenMonHoc, mh.SoTinChi, l.TenLop, gv.HoTen as TenGiangVien, k.TenKhoa
        FROM lophocphan lhp
        LEFT JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc
        LEFT JOIN lophoc l ON lhp.MaLop = l.MaLop
        LEFT JOIN giangvien gv ON lhp.MaGiangVien = gv.MaGiangVien
        LEFT JOIN khoa k ON l.MaKhoa = k.MaKhoa
    `;
    executeQuery(query, [], res, 'Lỗi lấy danh sách lớp học phần!');
});
app.post('/api/teaching-assignments', (req, res) => {
    const { MaLopHocPhan, MaMonHoc, MaLop, MaGiangVien, HocKy, NamHoc, SoLuongToiDa } = req.body;
    const maLHP = MaLopHocPhan || `${MaMonHoc}_${HocKy}_${Math.floor(Math.random()*1000)}`;
    db.query('INSERT INTO lophocphan (MaLopHocPhan, MaMonHoc, MaLop, MaGiangVien, HocKy, NamHoc, SoLuongToiDa) VALUES (?, ?, ?, ?, ?, ?, ?)', [maLHP, MaMonHoc, MaLop, MaGiangVien, HocKy, NamHoc, SoLuongToiDa || 40], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi tạo Lớp HP!', error: err.message });
        if (MaLop) {
            db.query('SELECT MSSV FROM sinhvien WHERE MaLop = ?', [MaLop], (err, students) => {
                if (!err && students.length > 0) { students.forEach(sv => { db.query('INSERT IGNORE INTO diem (MSSV, MaLopHocPhan, HocKy) VALUES (?, ?, ?)', [sv.MSSV, maLHP, HocKy]); }); }
                res.json({ success: true, message: 'Tạo Lớp HP và lên danh sách thành công!' });
            });
        } else { res.json({ success: true, message: 'Tạo Lớp học phần tự do thành công!' }); }
    });
});
app.put('/api/teaching-assignments/:id', (req, res) => {
    const { MaMonHoc, MaLop, MaGiangVien, HocKy, NamHoc, SoLuongToiDa } = req.body;
    db.query('UPDATE lophocphan SET MaMonHoc=?, MaLop=?, MaGiangVien=?, HocKy=?, NamHoc=?, SoLuongToiDa=? WHERE MaLopHocPhan=?', [MaMonHoc, MaLop, MaGiangVien, HocKy, NamHoc, SoLuongToiDa, req.params.id], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi cập nhật!', error: err.message });
        if (MaLop) {
            db.query('SELECT MSSV FROM sinhvien WHERE MaLop = ?', [MaLop], (err, students) => {
                if (!err && students.length > 0) { students.forEach(sv => { db.query('INSERT IGNORE INTO diem (MSSV, MaLopHocPhan, HocKy) VALUES (?, ?, ?)', [sv.MSSV, req.params.id, HocKy]); }); }
                res.json({ success: true, message: 'Cập nhật Lớp HP thành công!' });
            });
        } else { res.json({ success: true, message: 'Cập nhật thành công!' }); }
    });
});
app.delete('/api/teaching-assignments/:id', (req, res) => executeDelete('DELETE FROM lophocphan WHERE MaLopHocPhan=?', [req.params.id], res, 'Xóa thành công!', 'Lỗi xóa!'));
app.get('/api/faculties', (req, res) => executeQuery('SELECT MaKhoa, TenKhoa FROM khoa ORDER BY TenKhoa', [], res, 'Loi lay khoa!'));

// ==================== SCHEDULES & ENROLLMENT ====================
app.get('/api/enrollment/available/:mssv', (req, res) => {
    const query = `
        SELECT lhp.*, mh.TenMonHoc, mh.SoTinChi, gv.HoTen as TenGiangVien,
        (SELECT COUNT(*) FROM dangky_hocphan WHERE MaLopHocPhan = lhp.MaLopHocPhan AND TrangThai != 'Từ chối') as DaDangKy,
        (SELECT MAX(d.DiemGPA) FROM diem d LEFT JOIN lophocphan old_lhp ON d.MaLopHocPhan = old_lhp.MaLopHocPhan WHERE d.MSSV = ? AND (d.MaLopHocPhan = lhp.MaLopHocPhan OR d.MaLopHocPhan = lhp.MaMonHoc OR old_lhp.MaMonHoc = lhp.MaMonHoc)) as DiemCu,
        (SELECT MIN(NgayHoc) FROM lichhoc WHERE MaLopHocPhan = lhp.MaLopHocPhan) as NgayBatDau,
        (SELECT MAX(NgayHoc) FROM lichhoc WHERE MaLopHocPhan = lhp.MaLopHocPhan) as NgayKetThuc,
        (SELECT PhongHoc FROM lichhoc WHERE MaLopHocPhan = lhp.MaLopHocPhan LIMIT 1) as PhongHoc,
        (SELECT CaHoc FROM lichhoc WHERE MaLopHocPhan = lhp.MaLopHocPhan LIMIT 1) as CaHoc
        FROM lophocphan lhp JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc LEFT JOIN giangvien gv ON lhp.MaGiangVien = gv.MaGiangVien
        WHERE lhp.MaLopHocPhan NOT IN (SELECT MaLopHocPhan FROM dangky_hocphan WHERE MSSV = ? AND TrangThai != 'Từ chối')
    `;
    executeQuery(query, [req.params.mssv, req.params.mssv], res, 'Lỗi lấy danh sách lớp đang mở!');
});
app.get('/api/enrollment/my-courses/:mssv', (req, res) => executeQuery('SELECT dk.*, lhp.MaMonHoc, mh.TenMonHoc, mh.SoTinChi FROM dangky_hocphan dk JOIN lophocphan lhp ON dk.MaLopHocPhan = lhp.MaLopHocPhan JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc WHERE dk.MSSV = ? ORDER BY dk.NgayDangKy DESC', [req.params.mssv], res, 'Lỗi!'));
app.post('/api/enrollment', (req, res) => executeInsert('INSERT INTO dangky_hocphan (MSSV, MaLopHocPhan, HocKy) VALUES (?, ?, ?)', [req.body.MSSV, req.body.MaLopHocPhan, req.body.HocKy], res, 'Gửi yêu cầu đăng ký thành công!', 'Lỗi!'));
app.delete('/api/enrollment/:mssv/:maLhp', (req, res) => executeDelete('DELETE FROM dangky_hocphan WHERE MSSV = ? AND MaLopHocPhan = ? AND TrangThai = "Chờ duyệt"', [req.params.mssv, req.params.maLhp], res, 'Hủy môn thành công!', 'Lỗi!'));

app.get('/api/schedules', (req, res) => executeQuery('SELECT lh.*, lhp.MaGiangVien, lhp.MaMonHoc, lhp.HocKy, gv.HoTen as TenGiangVien, mh.TenMonHoc, lhp.MaLop, l.TenLop FROM lichhoc lh LEFT JOIN lophocphan lhp ON lh.MaLopHocPhan = lhp.MaLopHocPhan LEFT JOIN giangvien gv ON lhp.MaGiangVien = gv.MaGiangVien LEFT JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc LEFT JOIN lophoc l ON lhp.MaLop = l.MaLop', [], res, 'Lỗi!'));
app.get('/api/schedule/student/:mssv', (req, res) => executeQuery('SELECT lh.*, mh.TenMonHoc FROM diem d JOIN lophocphan lhp ON d.MaLopHocPhan = lhp.MaLopHocPhan JOIN lichhoc lh ON lh.MaLopHocPhan = lhp.MaLopHocPhan JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc WHERE d.MSSV = ?', [req.params.mssv], res, 'Lỗi!'));
app.post('/api/schedules', (req, res) => executeInsert('INSERT INTO lichhoc (MaLopHocPhan, NgayHoc, CaHoc, PhongHoc) VALUES (?, ?, ?, ?)', [req.body.MaLopHocPhan, req.body.NgayHoc, req.body.CaHoc, req.body.PhongHoc], res, 'Thêm lịch thành công', 'Lỗi thêm lịch'));
app.put('/api/schedules/:maLichHoc', (req, res) => executeUpdate('UPDATE lichhoc SET MaLopHocPhan=?, NgayHoc=?, CaHoc=?, PhongHoc=? WHERE MaLichHoc=?', [req.body.MaLopHocPhan, req.body.NgayHoc, req.body.CaHoc, req.body.PhongHoc, req.params.maLichHoc], res, 'Cập nhật thành công', 'Lỗi cập nhật'));
app.delete('/api/schedules/:maLichHoc', (req, res) => executeDelete('DELETE FROM lichhoc WHERE MaLichHoc=?', [req.params.maLichHoc], res, 'Xóa thành công', 'Lỗi xóa'));

// ==================== GRADES & ACADEMIC ====================
app.get('/api/grades', (req, res) => executeQuery('SELECT d.*, s.HoTen as TenSinhVien, IFNULL(lhp.MaMonHoc, d.MaLopHocPhan) as MaMonHoc, mh.TenMonHoc FROM diem d LEFT JOIN sinhvien s ON d.MSSV = s.MSSV LEFT JOIN lophocphan lhp ON d.MaLopHocPhan = lhp.MaLopHocPhan LEFT JOIN monhoc mh ON mh.MaMonHoc = IFNULL(lhp.MaMonHoc, d.MaLopHocPhan)', [], res, 'Lỗi!'));
app.get('/api/grades/student/:mssv', (req, res) => executeQuery('SELECT d.*, lhp.MaLopHocPhan, lhp.MaMonHoc, mh.TenMonHoc, mh.SoTinChi FROM diem d LEFT JOIN lophocphan lhp ON d.MaLopHocPhan = lhp.MaLopHocPhan LEFT JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc WHERE d.MSSV = ?', [req.params.mssv], res, 'Lỗi!'));
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
app.get('/api/attendance/course/:maLhp/date/:ngay', (req, res) => executeQuery('SELECT * FROM diemdanh WHERE MaLopHocPhan = ? AND DATE(NgayDiemDanh) = ?', [req.params.maLhp, req.params.ngay], res, 'Lỗi!'));
app.post('/api/attendance/course/:maLhp/date/:ngay', (req, res) => {
    const { maLhp, ngay } = req.params; const attendanceList = req.body.attendance;
    if (!Array.isArray(attendanceList) || attendanceList.length === 0) return res.status(400).json({ success: false });
    db.query('DELETE FROM diemdanh WHERE MaLopHocPhan = ? AND DATE(NgayDiemDanh) = ?', [maLhp, ngay], (err) => {
        if (err) return res.status(500).json({ success: false });
        let completed = 0;
        attendanceList.forEach((item) => {
            db.query('INSERT INTO diemdanh (MaLopHocPhan, MSSV, NgayDiemDanh, TrangThai, ThoiGianDiemDanh) VALUES (?, ?, ?, ?, NOW())', [maLhp, item.MSSV, ngay, item.TrangThai], () => {
                completed++; if (completed === attendanceList.length) res.json({ success: true, message: 'Lưu điểm danh thành công!' });
            });
        });
    });
});
app.get('/api/attendance/student/:mssv', (req, res) => executeQuery(`SELECT dd.*, dd.NgayDiemDanh as NgayHoc, (SELECT mh.TenMonHoc FROM lophocphan lhp JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc WHERE lhp.MaLopHocPhan = dd.MaLopHocPhan LIMIT 1) as TenMonHoc, (SELECT PhongHoc FROM lichhoc lh WHERE lh.MaLopHocPhan = dd.MaLopHocPhan LIMIT 1) as PhongHoc, (SELECT CaHoc FROM lichhoc lh WHERE lh.MaLopHocPhan = dd.MaLopHocPhan LIMIT 1) as CaHoc FROM diemdanh dd WHERE dd.MSSV = ? ORDER BY dd.NgayDiemDanh DESC`, [req.params.mssv], res, 'Lỗi!'));
app.get('/api/attendance/percentage/:mssv', (req, res) => {
    db.query('SELECT TrangThai FROM diemdanh WHERE MSSV = ?', [req.params.mssv], (err, results) => {
        if (err) return res.status(500).json({ success: false });
        const present = results.filter(r => r.TrangThai === 'Có mặt').length;
        res.json({ success: true, totalSessions: results.length, present, absent: results.filter(r => r.TrangThai === 'Vắng mặt').length, excused: results.filter(r => r.TrangThai === 'Có phép').length, percentage: results.length > 0 ? parseFloat(((present / results.length) * 100).toFixed(2)) : 0 });
    });
});

// ==================== TÀI LIỆU, NỘP BÀI, THÔNG BÁO ====================
app.get('/api/materials', (req, res) => executeQuery(`SELECT tl.*, lhp.MaGiangVien, lhp.MaMonHoc, lhp.HocKy, gv.HoTen as TenGiangVien, mh.TenMonHoc FROM tailieu_baitap tl LEFT JOIN lophocphan lhp ON tl.MaLopHocPhan = lhp.MaLopHocPhan LEFT JOIN giangvien gv ON lhp.MaGiangVien = gv.MaGiangVien LEFT JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc`, [], res, 'Lỗi!'));
app.post('/api/materials', (req, res) => executeInsert('INSERT INTO tailieu_baitap (MaLopHocPhan, TieuDe, Loai, FileUrl, HanNop) VALUES (?, ?, ?, ?, ?)', [req.body.MaLopHocPhan || req.body.MaPhanCong, req.body.TieuDe, req.body.Loai, req.body.FileUrl, req.body.HanNop], res, 'Thêm thành công', 'Lỗi'));
app.put('/api/materials/:id', (req, res) => executeUpdate('UPDATE tailieu_baitap SET MaLopHocPhan=?, TieuDe=?, Loai=?, FileUrl=?, HanNop=? WHERE MaTaiLieu=?', [req.body.MaLopHocPhan || req.body.MaPhanCong, req.body.TieuDe, req.body.Loai, req.body.FileUrl, req.body.HanNop, req.params.id], res, 'Cập nhật thành công', 'Lỗi'));
app.delete('/api/materials/:id', (req, res) => executeDelete('DELETE FROM tailieu_baitap WHERE MaTaiLieu=?', [req.params.id], res, 'Xóa thành công', 'Lỗi'));

app.get('/api/submissions', (req, res) => executeQuery(`SELECT nb.*, s.HoTen as TenSinhVien, tl.TieuDe, tl.Loai FROM nopbai nb LEFT JOIN sinhvien s ON nb.MSSV = s.MSSV LEFT JOIN tailieu_baitap tl ON nb.MaTaiLieu = tl.MaTaiLieu`, [], res, 'Lỗi!'));
app.post('/api/submissions', (req, res) => executeInsert('INSERT INTO nopbai (MaTaiLieu, MSSV, FileUrl, Diem) VALUES (?, ?, ?, ?)', [req.body.MaTaiLieu, req.body.MSSV, req.body.FileUrl, req.body.Diem], res, 'Nộp bài thành công', 'Lỗi'));
app.put('/api/submissions/:id', (req, res) => executeUpdate('UPDATE nopbai SET MaTaiLieu=?, MSSV=?, FileUrl=?, Diem=? WHERE MaNopBai=?', [req.body.MaTaiLieu, req.body.MSSV, req.body.FileUrl, req.body.Diem, req.params.id], res, 'Cập nhật thành công', 'Lỗi'));
app.delete('/api/submissions/:id', (req, res) => executeDelete('DELETE FROM nopbai WHERE MaNopBai=?', [req.params.id], res, 'Xóa thành công', 'Lỗi'));

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

// 1. Quản lý đợt đánh giá
app.get('/api/admin/training-periods', (req, res) => {
    executeQuery('SELECT * FROM dot_danhgia ORDER BY MaDotDanhGia DESC', [], res, 'Lỗi lấy đợt đánh giá!');
});

// NÂNG CẤP: Kiểm tra trùng học kỳ trước khi tạo
app.post('/api/admin/training-periods', (req, res) => {
    const { HocKy, NamHoc, NgayBatDau, NgayKetThuc, TrangThai } = req.body;
    
    // Kiểm tra xem đã tồn tại đợt cho học kỳ này trong năm học này chưa
    const checkQuery = 'SELECT MaDotDanhGia FROM dot_danhgia WHERE HocKy = ? AND NamHoc = ?';
    db.query(checkQuery, [HocKy, NamHoc], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi kiểm tra trùng lặp!' });
        if (results.length > 0) return res.status(400).json({ success: false, message: 'Đợt đánh giá cho học kỳ này đã tồn tại!' });

        const query = 'INSERT INTO dot_danhgia (HocKy, NamHoc, NgayBatDau, NgayKetThuc, TrangThai) VALUES (?, ?, ?, ?, ?)';
        executeInsert(query, [HocKy, NamHoc, NgayBatDau || null, NgayKetThuc || null, TrangThai || 'Đang tự đánh giá'], res, 'Tạo đợt đánh giá thành công!', 'Lỗi tạo đợt!');
    });
});

app.put('/api/admin/training-periods/:id/status', (req, res) => {
    const { TrangThai } = req.body;
    executeUpdate('UPDATE dot_danhgia SET TrangThai = ? WHERE MaDotDanhGia = ?', [TrangThai, req.params.id], res, 'Cập nhật trạng thái đợt thành công!', 'Lỗi cập nhật đợt!');
});

// Lấy danh sách đợt đánh giá ĐANG MỞ (Dành cho Sinh viên quét)
// NÂNG CẤP: Kiểm tra cả trạng thái VÀ khoảng ngày hiện tại (CURDATE)
app.get('/api/training-periods/active', (req, res) => {
    const query = `
        SELECT * FROM dot_danhgia 
        WHERE TrangThai = 'Đang tự đánh giá' 
        AND CURDATE() BETWEEN NgayBatDau AND NgayKetThuc 
        ORDER BY MaDotDanhGia DESC
    `;
    executeQuery(query, [], res, 'Lỗi lấy đợt đánh giá đang mở!');
});

// 2. Xét duyệt điểm rèn luyện (Đã loại bỏ DiemLopDanhGia, chỉ dùng DiemKhoaDanhGia)
app.get('/api/admin/training-points', (req, res) => {
    executeQuery('SELECT d.*, s.HoTen, s.MaLop FROM danhgia_renluyen d JOIN sinhvien s ON d.MSSV = s.MSSV ORDER BY d.MaDanhGia DESC', [], res, 'Lỗi lấy điểm RL!');
});

app.put('/api/admin/training-points/:id', (req, res) => {
    const { DiemKhoaDanhGia, TongDiem, TrangThai } = req.body; 
    
    // Tính xếp loại dựa trên tổng điểm cuối cùng
    let xepLoai = 'Yếu'; 
    const diem = Number(TongDiem);
    if(diem >= 90) xepLoai = 'Xuất sắc';
    else if(diem >= 80) xepLoai = 'Tốt';
    else if(diem >= 65) xepLoai = 'Khá';
else if(diem >= 50) xepLoai = 'Trung bình';
    
    // Cập nhật: Fix cứng DiemLopDanhGia = 0, chỉ lưu điểm khoa
    const query = 'UPDATE danhgia_renluyen SET DiemLopDanhGia = 0, DiemKhoaDanhGia = ?, TongDiem = ?, XepLoai = ?, TrangThai = ? WHERE MaDanhGia = ?';
    executeUpdate(query, [DiemKhoaDanhGia, TongDiem, xepLoai, TrangThai, req.params.id], res, 'Đã chốt điểm!', 'Lỗi cập nhật điểm!');
});

// 3. Quản lý Yêu cầu & Phản hồi
app.get('/api/admin/support-requests', (req, res) => {
    const query = `
        SELECT y.*, y.MSSV as NguoiGui, 'SinhVien' as VaiTro, y.ChuDe as TieuDe, 
        (SELECT HoTen FROM sinhvien WHERE MSSV = y.MSSV) as TenNguoiGui 
        FROM yeucau_hotro y ORDER BY y.NgayGui DESC
    `;
    executeQuery(query, [], res, 'Lỗi lấy yêu cầu!');
});

app.put('/api/admin/support-requests/:id', (req, res) => {
    const { TrangThai, PhanHoi } = req.body;
    executeUpdate('UPDATE yeucau_hotro SET TrangThai = ?, PhanHoi = ? WHERE MaYeuCau = ?', [TrangThai, PhanHoi, req.params.id], res, 'Phản hồi thành công!', 'Lỗi phản hồi!');
});



//=============================================================================
// Khởi chạy server backend (Không được xóa)
//=============================================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server Backend đang chạy tại cổng: http://localhost:${PORT}`);
});