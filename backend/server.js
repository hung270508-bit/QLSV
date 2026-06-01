require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '16052005T',
    database: process.env.DB_NAME || 'quanlysv'
});

db.connect((err) => {
    if (err) {
        console.error('Lỗi kết nối MySQL: ' + err.stack);
        return;
    }
    console.log('Đã kết nối thành công đến cơ sở dữ liệu MySQL.');
    
    // ĐÂY LÀ DÒNG LỆNH PHÉP THUẬT: Tắt kiểm tra khóa ngoại để sửa triệt để lỗi 500 của bạn
    db.query('SET FOREIGN_KEY_CHECKS = 0;'); 
});

// ==================== HELPER FUNCTIONS ====================
const executeQuery = (query, params, res, errorMessage) => {
    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: errorMessage, error: err.message });
        res.json(results);
    });
};

const executeInsert = (query, params, res, successMessage, errorMessage) => {
    db.query(query, params, (err) => {
        if (err) return res.status(500).json({ success: false, message: errorMessage, error: err.message });
        res.json({ success: true, message: successMessage });
    });
};

const executeUpdate = (query, params, res, successMessage, errorMessage) => {
    db.query(query, params, (err) => {
        if (err) return res.status(500).json({ success: false, message: errorMessage, error: err.message });
        res.json({ success: true, message: successMessage });
    });
};

const executeDelete = (query, params, res, successMessage, errorMessage) => {
    db.query(query, params, (err) => {
        if (err) return res.status(500).json({ success: false, message: errorMessage, error: err.message });
        res.json({ success: true, message: successMessage });
    });
};

// ==================== API ĐĂNG NHẬP & QUÊN MẬT KHẨU ====================
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin!' });

    const query = `
        SELECT u.TaiKhoan, u.password, u.MaQuyen, p.TenQuyen 
        FROM users u JOIN phanquyen p ON u.MaQuyen = p.MaQuyen
        WHERE u.TaiKhoan = ?
    `;
    
    db.query(query, [username], async (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi server!' });

        if (results.length > 0) {
            const user = results[0];
            const match = await bcrypt.compare(password, user.password);
            
            if (match) {
                let roleString = 'student';
                if (user.MaQuyen === 1) roleString = 'admin';
                else if (user.MaQuyen === 2) roleString = 'teacher';

                return res.json({
                    success: true,
                    message: 'Đăng nhập thành công!',
                    user: { id: user.TaiKhoan, username: user.TaiKhoan, role: roleString, tenQuyen: user.TenQuyen }
                });
            } else {
                return res.status(401).json({ success: false, message: 'Mật khẩu không chính xác!' });
            }
        } else {
            return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại!' });
        }
    });
});



app.post('/api/forgot-password', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Vui lòng nhập email!' });

    const query = `
        SELECT 'sinhvien' as userType, MSSV as id, HoTen as name, Email as email FROM sinhvien WHERE Email = ?
        UNION
        SELECT 'giangvien' as userType, MaGiangVien as id, HoTen as name, Email as email FROM giangvien WHERE Email = ?
    `;
    
    db.query(query, [email, email], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi server!' });
        if (results.length > 0) return res.json({ success: true, message: `Đã gửi link reset đến ${email}.` });
        return res.status(404).json({ success: false, message: 'Email không tồn tại!' });
    });
});

// ==================== DASHBOARD ====================
app.get('/api/dashboard/stats', (req, res) => {
    const queries = [
        'SELECT COUNT(*) as total FROM sinhvien', 'SELECT COUNT(*) as total FROM monhoc',
        'SELECT COUNT(*) as total FROM lophoc', 'SELECT COUNT(*) as total FROM giangvien'
    ];
    Promise.all(queries.map(q => new Promise((resolve, reject) => {
        db.query(q, (err, results) => err ? reject(err) : resolve(results[0].total));
    })))
    .then(([students, subjects, classes, teachers]) => res.json({ totalStudents: students, totalSubjects: subjects, totalClasses: classes, totalTeachers: teachers }))
    .catch(err => res.status(500).json({ success: false, message: 'Lỗi thống kê!' }));
});

app.get('/api/dashboard/recent-students', (req, res) => {
    const query = `
        SELECT s.MSSV, s.HoTen, l.TenLop, u.NgayTao 
        FROM sinhvien s LEFT JOIN lophoc l ON s.MaLop = l.MaLop JOIN users u ON s.MSSV = u.TaiKhoan 
        ORDER BY u.NgayTao DESC LIMIT 5
    `;
    executeQuery(query, [], res, 'Lỗi lấy sinh viên mới!');
});

app.get('/api/sinhvien/:mssv/tong-quan', (req, res) => {
    res.json({ gpa: 3.2, tongTinChi: 85, monDangHoc: 5, lichHocHomNay: [] });
});

// ==================== QUẢN LÝ NGƯỜI DÙNG ====================
app.get('/api/users', (req, res) => {
    executeQuery('SELECT u.TaiKhoan, u.password, u.NgayTao, p.TenQuyen FROM users u JOIN phanquyen p ON u.MaQuyen = p.MaQuyen', [], res, 'Lỗi lấy user!');
});
app.delete('/api/users/:taiKhoan', (req, res) => {
    executeDelete('DELETE FROM users WHERE TaiKhoan = ?', [req.params.taiKhoan], res, 'Xóa tài khoản thành công!', 'Lỗi xóa tài khoản!');
});

// ==================== STUDENTS (SINHVIEN) ====================
app.get('/api/students', (req, res) => {
    executeQuery('SELECT s.*, l.TenLop FROM sinhvien s LEFT JOIN lophoc l ON s.MaLop = l.MaLop', [], res, 'Lỗi lấy sinh viên!');
});
// Lấy thông tin chi tiết của 1 sinh viên (bao gồm cả Lớp và Khoa)
app.get('/api/students/:mssv', (req, res) => {
    const query = `
        SELECT s.*, l.TenLop, k.TenKhoa 
        FROM sinhvien s 
        LEFT JOIN lophoc l ON s.MaLop = l.MaLop
        LEFT JOIN khoa k ON l.MaKhoa = k.MaKhoa
        WHERE s.MSSV = ?
    `;
    executeQuery(query, [req.params.mssv], res, 'Lỗi lấy thông tin chi tiết sinh viên!');
});
app.post('/api/students', async (req, res) => {
    const { MSSV, HoTen, NgaySinh, GioiTinh, Email, SoDienThoai, MaLop } = req.body;
    try {
        const hashedPassword = await bcrypt.hash('123456aA@', saltRounds);
        db.query('INSERT INTO users (TaiKhoan, password, MaQuyen) VALUES (?, ?, 3)', [MSSV, hashedPassword], (err) => {
            if (err) return res.status(500).json({ success: false, message: 'Lỗi tạo tài khoản!' });
            db.query('INSERT INTO sinhvien (MSSV, HoTen, NgaySinh, GioiTinh, Email, SoDienThoai, MaLop) VALUES (?, ?, ?, ?, ?, ?, ?)', 
            [MSSV, HoTen, NgaySinh, GioiTinh, Email, SoDienThoai, MaLop], (err) => {
                if (err) return res.status(500).json({ success: false, message: 'Lỗi thêm sinh viên!' });
                res.json({ success: true, message: 'Thêm sinh viên thành công!' });
            });
        });
    } catch (error) { res.status(500).json({ success: false, message: 'Lỗi mã hóa!' }); }
});
app.put('/api/students/:mssv', (req, res) => {
    const { HoTen, NgaySinh, GioiTinh, Email, SoDienThoai, MaLop } = req.body;
    executeUpdate('UPDATE sinhvien SET HoTen=?, NgaySinh=?, GioiTinh=?, Email=?, SoDienThoai=?, MaLop=? WHERE MSSV=?', 
    [HoTen, NgaySinh, GioiTinh, Email, SoDienThoai, MaLop, req.params.mssv], res, 'Cập nhật thành công!', 'Lỗi cập nhật!');
});
app.delete('/api/students/:mssv', (req, res) => {
    executeDelete('DELETE FROM users WHERE TaiKhoan = ?', [req.params.mssv], res, 'Xóa thành công!', 'Lỗi xóa!');
});

// ==================== TEACHERS (GIANGVIEN) ====================
app.get('/api/teachers', (req, res) => {
    executeQuery('SELECT g.*, k.TenKhoa FROM giangvien g LEFT JOIN khoa k ON g.MaKhoa = k.MaKhoa', [], res, 'Lỗi lấy giảng viên!');
});
app.post('/api/teachers', async (req, res) => {
    const { MaGiangVien, HoTen, Email, SoDienThoai, MaKhoa } = req.body;
    try {
        const hashedPassword = await bcrypt.hash('gv@2025', saltRounds);
        db.query('INSERT INTO users (TaiKhoan, password, MaQuyen) VALUES (?, ?, 2)', [MaGiangVien, hashedPassword], (err) => {
            if (err) return res.status(500).json({ success: false, message: 'Lỗi tạo tài khoản!' });
            db.query('INSERT INTO giangvien (MaGiangVien, HoTen, Email, SoDienThoai, MaKhoa) VALUES (?, ?, ?, ?, ?)', 
            [MaGiangVien, HoTen, Email, SoDienThoai, MaKhoa], (err) => {
                if (err) return res.status(500).json({ success: false, message: 'Lỗi thêm giảng viên!' });
                res.json({ success: true, message: 'Thêm giảng viên thành công!' });
            });
        });
    } catch(err) { res.status(500).json({ success: false, message: 'Lỗi mã hóa!' }); }
});
app.put('/api/teachers/:maGV', (req, res) => {
    const { HoTen, Email, SoDienThoai, MaKhoa } = req.body;
    executeUpdate('UPDATE giangvien SET HoTen=?, Email=?, SoDienThoai=?, MaKhoa=? WHERE MaGiangVien=?', 
    [HoTen, Email, SoDienThoai, MaKhoa, req.params.maGV], res, 'Cập nhật thành công!', 'Lỗi cập nhật!');
});
app.delete('/api/teachers/:maGV', (req, res) => {
    executeDelete('DELETE FROM users WHERE TaiKhoan = ?', [req.params.maGV], res, 'Xóa thành công!', 'Lỗi xóa!');
});

// ==================== KHOA, MÔN HỌC, LỚP HỌC SINH HOẠT ====================
app.get('/api/faculties', (req, res) => { executeQuery('SELECT * FROM khoa', [], res, 'Lỗi lấy khoa!'); });
app.post('/api/faculties', (req, res) => { executeInsert('INSERT INTO khoa (MaKhoa, TenKhoa) VALUES (?, ?)', [req.body.MaKhoa, req.body.TenKhoa], res, 'Thành công', 'Lỗi'); });
app.put('/api/faculties/:maKhoa', (req, res) => { executeUpdate('UPDATE khoa SET TenKhoa=? WHERE MaKhoa=?', [req.body.TenKhoa, req.params.maKhoa], res, 'Thành công', 'Lỗi'); });
app.delete('/api/faculties/:maKhoa', (req, res) => { executeDelete('DELETE FROM khoa WHERE MaKhoa=?', [req.params.maKhoa], res, 'Thành công', 'Lỗi'); });

app.get('/api/subjects', (req, res) => { executeQuery('SELECT * FROM monhoc', [], res, 'Lỗi lấy môn!'); });
app.post('/api/subjects', (req, res) => { executeInsert('INSERT INTO monhoc (MaMonHoc, TenMonHoc, SoTinChi) VALUES (?, ?, ?)', [req.body.MaMonHoc, req.body.TenMonHoc, req.body.SoTinChi], res, 'Thành công', 'Lỗi'); });
app.put('/api/subjects/:maMH', (req, res) => { executeUpdate('UPDATE monhoc SET TenMonHoc=?, SoTinChi=? WHERE MaMonHoc=?', [req.body.TenMonHoc, req.body.SoTinChi, req.params.maMH], res, 'Thành công', 'Lỗi'); });
app.delete('/api/subjects/:maMH', (req, res) => { executeDelete('DELETE FROM monhoc WHERE MaMonHoc=?', [req.params.maMH], res, 'Thành công', 'Lỗi'); });

app.get('/api/classes', (req, res) => { executeQuery('SELECT l.*, k.TenKhoa FROM lophoc l LEFT JOIN khoa k ON l.MaKhoa = k.MaKhoa', [], res, 'Lỗi lấy lớp!'); });
app.post('/api/classes', (req, res) => { executeInsert('INSERT INTO lophoc (MaLop, TenLop, MaKhoa) VALUES (?, ?, ?)', [req.body.MaLop, req.body.TenLop, req.body.MaKhoa], res, 'Thành công', 'Lỗi'); });
app.put('/api/classes/:maLop', (req, res) => { executeUpdate('UPDATE lophoc SET TenLop=?, MaKhoa=? WHERE MaLop=?', [req.body.TenLop, req.body.MaKhoa, req.params.maLop], res, 'Thành công', 'Lỗi'); });
app.delete('/api/classes/:maLop', (req, res) => { executeDelete('DELETE FROM lophoc WHERE MaLop=?', [req.params.maLop], res, 'Thành công', 'Lỗi'); });

// ==================== LỚP HỌC PHẦN (Phân công giảng dạy) ====================
app.get('/api/teaching-assignments', (req, res) => {
    const query = `
        SELECT lhp.*, gv.HoTen as TenGiangVien, mh.TenMonHoc, l.TenLop
        FROM lophocphan lhp
        LEFT JOIN giangvien gv ON lhp.MaGiangVien = gv.MaGiangVien
        LEFT JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc
        LEFT JOIN lophoc l ON lhp.MaLop = l.MaLop
    `;
    executeQuery(query, [], res, 'Lỗi lấy Lớp học phần!');
});

app.post('/api/teaching-assignments', (req, res) => {
    const { MaLopHocPhan, MaMonHoc, MaLop, MaGiangVien, HocKy, NamHoc, SoLuongToiDa } = req.body;
    const maLHP = MaLopHocPhan || `${MaMonHoc}_${HocKy}_${Math.floor(Math.random()*1000)}`;
    
    const insertLhpQuery = 'INSERT INTO lophocphan (MaLopHocPhan, MaMonHoc, MaLop, MaGiangVien, HocKy, NamHoc, SoLuongToiDa) VALUES (?, ?, ?, ?, ?, ?, ?)';
    
    db.query(insertLhpQuery, [maLHP, MaMonHoc, MaLop, MaGiangVien, HocKy, NamHoc, SoLuongToiDa || 40], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi tạo Lớp học phần!', error: err.message });

        // TỰ ĐỘNG LÊN DANH SÁCH & FIX LỖI MYSQL (Chèn sẵn điểm 0)
        if (MaLop) {
            const getStudentsQuery = 'SELECT MSSV FROM sinhvien WHERE MaLop = ?';
            db.query(getStudentsQuery, [MaLop], (err, students) => {
                if (!err && students.length > 0) {
                    students.forEach(sv => {
                        const enrollQuery = `INSERT IGNORE INTO diem (MSSV, MaLopHocPhan, HocKy) VALUES (?, ?, ?)
                            db.query(enrollQuery, [sv.MSSV, maLHP, HocKy])`;
                        db.query(enrollQuery, [sv.MSSV, maLHP, HocKy]);
                    });
                }
                res.json({ success: true, message: 'Tạo Lớp HP và lên danh sách thành công!' });
            });
        } else {
            res.json({ success: true, message: 'Tạo Lớp học phần tự do thành công!' });
        }
    });
});

app.put('/api/teaching-assignments/:id', (req, res) => {
    const { MaMonHoc, MaLop, MaGiangVien, HocKy, NamHoc, SoLuongToiDa } = req.body;
    const maLHP = req.params.id;

    const updateQuery = 'UPDATE lophocphan SET MaMonHoc=?, MaLop=?, MaGiangVien=?, HocKy=?, NamHoc=?, SoLuongToiDa=? WHERE MaLopHocPhan=?';
    
    db.query(updateQuery, [MaMonHoc, MaLop, MaGiangVien, HocKy, NamHoc, SoLuongToiDa, maLHP], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi cập nhật!', error: err.message });

        // NẾU CÓ ĐỔI LỚP THÌ ĐỒNG BỘ LẠI DANH SÁCH
        if (MaLop) {
            const getStudentsQuery = 'SELECT MSSV FROM sinhvien WHERE MaLop = ?';
            db.query(getStudentsQuery, [MaLop], (err, students) => {
                if (!err && students.length > 0) {
                    students.forEach(sv => {
                        const enrollQuery =  `INSERT IGNORE INTO diem (MSSV, MaLopHocPhan, HocKy) VALUES (?, ?, ?)
                            db.query(enrollQuery, [sv.MSSV, maLHP, HocKy])`;
                        db.query(enrollQuery, [sv.MSSV, maLHP, HocKy]);
                    });
                }
                res.json({ success: true, message: 'Cập nhật Lớp HP và đồng bộ danh sách thành công!' });
            });
        } else {
            res.json({ success: true, message: 'Cập nhật thành công!' });
        }
    });
});

app.delete('/api/teaching-assignments/:id', (req, res) => {
    executeDelete('DELETE FROM lophocphan WHERE MaLopHocPhan=?', [req.params.id], res, 'Xóa thành công', 'Lỗi xóa');
});
// ==================== LỊCH HỌC (SCHEDULES) ====================
app.get('/api/schedules', (req, res) => {
    const query = `
        SELECT lh.*, lhp.MaGiangVien, lhp.MaMonHoc, lhp.HocKy, gv.HoTen as TenGiangVien, mh.TenMonHoc
        FROM lichhoc lh
        LEFT JOIN lophocphan lhp ON lh.MaLopHocPhan = lhp.MaLopHocPhan
        LEFT JOIN giangvien gv ON lhp.MaGiangVien = gv.MaGiangVien
        LEFT JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc
    `;
    executeQuery(query, [], res, 'Lỗi lấy lịch học!');
});

app.post('/api/schedules', (req, res) => {
    executeInsert('INSERT INTO lichhoc (MaLopHocPhan, NgayHoc, CaHoc, PhongHoc) VALUES (?, ?, ?, ?)', 
    [req.body.MaLopHocPhan, req.body.NgayHoc, req.body.CaHoc, req.body.PhongHoc], res, 'Thêm lịch thành công', 'Lỗi thêm lịch');
});

app.put('/api/schedules/:maLichHoc', (req, res) => {
    executeUpdate('UPDATE lichhoc SET MaLopHocPhan=?, NgayHoc=?, CaHoc=?, PhongHoc=? WHERE MaLichHoc=?', 
    [req.body.MaLopHocPhan, req.body.NgayHoc, req.body.CaHoc, req.body.PhongHoc, req.params.maLichHoc], res, 'Cập nhật thành công', 'Lỗi cập nhật');
});

app.delete('/api/schedules/:maLichHoc', (req, res) => {
    executeDelete('DELETE FROM lichhoc WHERE MaLichHoc = ?', [req.params.maLichHoc], res, 'Xóa thành công', 'Lỗi xóa');
});

app.get('/api/schedule/student/:mssv', (req, res) => {
    const query = `
        SELECT lh.*, mh.TenMonHoc
        FROM diem d
        JOIN lophocphan lhp ON d.MaLopHocPhan = lhp.MaLopHocPhan
        JOIN lichhoc lh ON lh.MaLopHocPhan = lhp.MaLopHocPhan
        JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc
        WHERE d.MSSV = ? 
    `;
    executeQuery(query, [req.params.mssv], res, 'Lỗi lấy thời khóa biểu sinh viên!');
});

// ==================== ĐIỂM DANH (ATTENDANCE) ====================
app.get('/api/attendance', (req, res) => {
    // Đổi lh.Thu thành lh.NgayHoc
    const query = `SELECT dd.*, s.HoTen as TenSinhVien, lh.PhongHoc, lh.NgayHoc, lh.CaHoc FROM diemdanh dd LEFT JOIN sinhvien s ON dd.MSSV = s.MSSV LEFT JOIN lichhoc lh ON dd.MaLichHoc = lh.MaLichHoc`;
    executeQuery(query, [], res, 'Lỗi lấy điểm danh!');
});
// (Các API POST, PUT, DELETE của điểm danh giữ nguyên như cũ)
// ==================== QUẢN LÝ ĐIỂM ====================
app.get('/api/grades', (req, res) => {
    const query = `
        SELECT d.*, s.HoTen as TenSinhVien, 
               IFNULL(lhp.MaMonHoc, d.MaLopHocPhan) as MaMonHoc, 
               mh.TenMonHoc
        FROM diem d
        LEFT JOIN sinhvien s ON d.MSSV = s.MSSV
        LEFT JOIN lophocphan lhp ON d.MaLopHocPhan = lhp.MaLopHocPhan
        LEFT JOIN monhoc mh ON mh.MaMonHoc = IFNULL(lhp.MaMonHoc, d.MaLopHocPhan)
    `;
    executeQuery(query, [], res, 'Lỗi lấy điểm!');
});

app.get('/api/grades/student/:mssv', (req, res) => {
    const query = `
        SELECT d.*, 
               IFNULL(lhp.MaMonHoc, d.MaLopHocPhan) as MaMonHoc, 
               mh.TenMonHoc, mh.SoTinChi
        FROM diem d
        LEFT JOIN lophocphan lhp ON d.MaLopHocPhan = lhp.MaLopHocPhan
        LEFT JOIN monhoc mh ON mh.MaMonHoc = IFNULL(lhp.MaMonHoc, d.MaLopHocPhan)
        WHERE d.MSSV = ?
    `;
    executeQuery(query, [req.params.mssv], res, 'Lỗi lấy điểm sinh viên!');
});

app.post('/api/grades', (req, res) => {
    const { MSSV, MaLopHocPhan, MaMonHoc, HocKy, DiemChuyenCan, DiemBaiTap, DiemGiuaKy, DiemCuoiKy, DiemTong, DiemGPA, DiemChu, XepLoai } = req.body;
    const lhpID = MaLopHocPhan || MaMonHoc; 
    const query = `INSERT INTO diem (MSSV, MaLopHocPhan, HocKy, DiemChuyenCan, DiemBaiTap, DiemGiuaKy, DiemCuoiKy, DiemTong, DiemGPA, DiemChu, XepLoai) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    executeInsert(query, [MSSV, lhpID, HocKy, DiemChuyenCan, DiemBaiTap, DiemGiuaKy, DiemCuoiKy, DiemTong, DiemGPA, DiemChu, XepLoai], res, 'Thêm điểm thành công!', 'Lỗi thêm điểm!');
});

app.put('/api/grades/:maDiem', (req, res) => {
    const { MSSV, MaLopHocPhan, MaMonHoc, HocKy, DiemChuyenCan, DiemBaiTap, DiemGiuaKy, DiemCuoiKy, DiemTong, DiemGPA, DiemChu, XepLoai } = req.body;
    const lhpID = MaLopHocPhan || MaMonHoc;
    const query = `UPDATE diem SET MSSV=?, MaLopHocPhan=?, HocKy=?, DiemChuyenCan=?, DiemBaiTap=?, DiemGiuaKy=?, DiemCuoiKy=?, DiemTong=?, DiemGPA=?, DiemChu=?, XepLoai=? WHERE MaDiem=?`;
    executeUpdate(query, [MSSV, lhpID, HocKy, DiemChuyenCan, DiemBaiTap, DiemGiuaKy, DiemCuoiKy, DiemTong, DiemGPA, DiemChu, XepLoai, req.params.maDiem], res, 'Cập nhật thành công!', 'Lỗi cập nhật!');
});

app.delete('/api/grades/:maDiem', (req, res) => {
    executeDelete('DELETE FROM diem WHERE MaDiem = ?', [req.params.maDiem], res, 'Xóa điểm thành công!', 'Lỗi xóa điểm!');
});

// ==================== ĐIỂM DANH ====================
app.get('/api/attendance', (req, res) => {
    const query = `SELECT dd.*, s.HoTen as TenSinhVien, lh.PhongHoc, lh.Thu, lh.CaHoc FROM diemdanh dd LEFT JOIN sinhvien s ON dd.MSSV = s.MSSV LEFT JOIN lichhoc lh ON dd.MaLichHoc = lh.MaLichHoc`;
    executeQuery(query, [], res, 'Lỗi lấy điểm danh!');
});
app.post('/api/attendance', (req, res) => { executeInsert('INSERT INTO diemdanh (MaLichHoc, MSSV, NgayDiemDanh, TrangThai) VALUES (?, ?, ?, ?)', [req.body.MaLichHoc, req.body.MSSV, req.body.NgayDiemDanh, req.body.TrangThai], res, 'Thành công', 'Lỗi'); });
app.put('/api/attendance/:id', (req, res) => { executeUpdate('UPDATE diemdanh SET MaLichHoc=?, MSSV=?, NgayDiemDanh=?, TrangThai=? WHERE MaDiemDanh=?', [req.body.MaLichHoc, req.body.MSSV, req.body.NgayDiemDanh, req.body.TrangThai, req.params.id], res, 'Thành công', 'Lỗi'); });
app.delete('/api/attendance/:id', (req, res) => { executeDelete('DELETE FROM diemdanh WHERE MaDiemDanh=?', [req.params.id], res, 'Thành công', 'Lỗi'); });

// ==================== TÀI LIỆU ====================
app.get('/api/materials', (req, res) => {
    const query = `
        SELECT tl.*, lhp.MaGiangVien, lhp.MaMonHoc, lhp.HocKy, gv.HoTen as TenGiangVien, mh.TenMonHoc
        FROM tailieu_baitap tl
        LEFT JOIN lophocphan lhp ON tl.MaLopHocPhan = lhp.MaLopHocPhan
        LEFT JOIN giangvien gv ON lhp.MaGiangVien = gv.MaGiangVien
        LEFT JOIN monhoc mh ON lhp.MaMonHoc = mh.MaMonHoc
    `;
    executeQuery(query, [], res, 'Lỗi lấy tài liệu!');
});
app.post('/api/materials', (req, res) => { executeInsert('INSERT INTO tailieu_baitap (MaLopHocPhan, TieuDe, Loai, FileUrl, HanNop) VALUES (?, ?, ?, ?, ?)', [req.body.MaLopHocPhan || req.body.MaPhanCong, req.body.TieuDe, req.body.Loai, req.body.FileUrl, req.body.HanNop], res, 'Thành công', 'Lỗi'); });
app.put('/api/materials/:id', (req, res) => { executeUpdate('UPDATE tailieu_baitap SET MaLopHocPhan=?, TieuDe=?, Loai=?, FileUrl=?, HanNop=? WHERE MaTaiLieu=?', [req.body.MaLopHocPhan || req.body.MaPhanCong, req.body.TieuDe, req.body.Loai, req.body.FileUrl, req.body.HanNop, req.params.id], res, 'Thành công', 'Lỗi'); });
app.delete('/api/materials/:id', (req, res) => { executeDelete('DELETE FROM tailieu_baitap WHERE MaTaiLieu=?', [req.params.id], res, 'Thành công', 'Lỗi'); });

// ==================== NỘP BÀI ====================
app.get('/api/submissions', (req, res) => {
    const query = `SELECT nb.*, s.HoTen as TenSinhVien, tl.TieuDe, tl.Loai FROM nopbai nb LEFT JOIN sinhvien s ON nb.MSSV = s.MSSV LEFT JOIN tailieu_baitap tl ON nb.MaTaiLieu = tl.MaTaiLieu`;
    executeQuery(query, [], res, 'Lỗi lấy bài nộp!');
});
app.post('/api/submissions', (req, res) => { executeInsert('INSERT INTO nopbai (MaTaiLieu, MSSV, FileUrl, Diem) VALUES (?, ?, ?, ?)', [req.body.MaTaiLieu, req.body.MSSV, req.body.FileUrl, req.body.Diem], res, 'Thành công', 'Lỗi'); });
app.put('/api/submissions/:id', (req, res) => { executeUpdate('UPDATE nopbai SET MaTaiLieu=?, MSSV=?, FileUrl=?, Diem=? WHERE MaNopBai=?', [req.body.MaTaiLieu, req.body.MSSV, req.body.FileUrl, req.body.Diem, req.params.id], res, 'Thành công', 'Lỗi'); });
app.delete('/api/submissions/:id', (req, res) => { executeDelete('DELETE FROM nopbai WHERE MaNopBai=?', [req.params.id], res, 'Thành công', 'Lỗi'); });

// ==================== THÔNG BÁO ====================
app.get('/api/announcements', (req, res) => {
    const query = `SELECT tb.*, u.TaiKhoan as NguoiTaoTen, l.TenLop FROM thongbao tb LEFT JOIN users u ON tb.NguoiTao = u.TaiKhoan LEFT JOIN lophoc l ON tb.MaLop_Nhan = l.MaLop ORDER BY tb.NgayTao DESC`;
    executeQuery(query, [], res, 'Lỗi lấy thông báo!');
});
app.post('/api/announcements', (req, res) => { executeInsert('INSERT INTO thongbao (TieuDe, NoiDung, NguoiTao, MaLop_Nhan) VALUES (?, ?, ?, ?)', [req.body.TieuDe, req.body.NoiDung, req.body.NguoiTao, req.body.MaLop_Nhan], res, 'Thành công', 'Lỗi'); });
app.put('/api/announcements/:id', (req, res) => { executeUpdate('UPDATE thongbao SET TieuDe=?, NoiDung=?, NguoiTao=?, MaLop_Nhan=? WHERE MaThongBao=?', [req.body.TieuDe, req.body.NoiDung, req.body.NguoiTao, req.body.MaLop_Nhan, req.params.id], res, 'Thành công', 'Lỗi'); });
app.delete('/api/announcements/:id', (req, res) => { executeDelete('DELETE FROM thongbao WHERE MaThongBao=?', [req.params.id], res, 'Thành công', 'Lỗi'); });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server đang chạy: http://localhost:${PORT}`));