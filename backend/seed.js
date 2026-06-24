require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function seed() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
    });

    console.log("Connected to DB");
    const defaultPassword = await bcrypt.hash('123456', 10);

    // 1. Khoa (30)
    const khoaPrefixes = ['KT', 'NN', 'NNH', 'DL', 'CK', 'DDT', 'QTKD', 'TCKT', 'XD', 'MT', 'SH', 'HH', 'VL', 'KHTN', 'GD', 'TL', 'XH', 'BCTT', 'LLCT', 'GDTC', 'QPAN', 'YD', 'KTNN', 'CNTP', 'CNTT', 'QT', 'LOG', 'MKT', 'TMDT', 'KTD'];
    const khoaNames = ['Kinh tế', 'Ngoại ngữ', 'Nông nghiệp', 'Du lịch', 'Cơ khí', 'Điện - Điện tử', 'Quản trị kinh doanh', 'Tài chính kế toán', 'Xây dựng', 'Môi trường', 'Sinh học', 'Hóa học', 'Vật lý', 'Khoa học tự nhiên', 'Giáo dục', 'Tâm lý', 'Xã hội', 'Báo chí', 'Lý luận chính trị', 'Giáo dục thể chất', 'Quốc phòng', 'Y dược', 'Kinh tế nông nghiệp', 'Công nghệ thực phẩm', 'Công nghệ thông tin', 'Quốc tế', 'Logistics', 'Marketing', 'Thương mại điện tử', 'Kiểm toán'];
    
    let khoas = [];
    for (let i = 0; i < 30; i++) {
        const makhoa = khoaPrefixes[i] || `KHOA${i}`;
        const tenkhoa = khoaNames[i] || `Khoa ${i}`;
        khoas.push(makhoa);
        await db.query('INSERT IGNORE INTO khoa (MaKhoa, TenKhoa) VALUES (?, ?)', [makhoa, tenkhoa]);
    }
    console.log("Seeded 30 Khoa");

    // 2. Lớp học (100)
    let lops = [];
    for (let i = 1; i <= 100; i++) {
        const maKhoa = khoas[i % khoas.length];
        const nienKhoa = `202${(i % 4) + 1}-202${(i % 4) + 5}`;
        const maLop = `${nienKhoa.substring(2, 4)}${maKhoa}${i}`;
        const tenLop = `Lớp ${maKhoa} ${i}`;
        lops.push(maLop);
        await db.query('INSERT IGNORE INTO lophoc (MaLop, TenLop, MaKhoa, NienKhoa) VALUES (?, ?, ?, ?)', [maLop, tenLop, maKhoa, nienKhoa]);
    }
    console.log("Seeded 100 LopHoc");

    // 3. Môn học (100)
    let mons = [];
    for (let i = 1; i <= 100; i++) {
        const maKhoa = khoas[i % khoas.length];
        const maMon = `${maKhoa}${String(i).padStart(3, '0')}`;
        const tenMon = `Môn học ${maKhoa} ${i}`;
        const stc = (i % 3) + 2; // 2, 3, 4
        mons.push(maMon);
        await db.query('INSERT IGNORE INTO monhoc (MaMonHoc, TenMonHoc, SoTinChi, MaKhoa) VALUES (?, ?, ?, ?)', [maMon, tenMon, stc, maKhoa]);
    }
    console.log("Seeded 100 MonHoc");

    // 4. Giảng viên (200)
    let gvs = [];
    const ho = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
    const tenLot = ['Văn', 'Thị', 'Đức', 'Ngọc', 'Hữu', 'Minh', 'Thanh', 'Quang', 'Bảo', 'Hoài'];
    const ten = ['Anh', 'Bình', 'Châu', 'Dũng', 'Em', 'Phong', 'Giang', 'Hải', 'Linh', 'Khánh', 'Lan', 'Mai', 'Nam', 'Oanh', 'Phúc', 'Quỳnh', 'Sơn', 'Tài', 'Uyên', 'Vy', 'Xuân', 'Yến'];
    
    for (let i = 1; i <= 200; i++) {
        const maKhoa = khoas[i % khoas.length];
        const maGV = `GV${maKhoa}${String(i).padStart(3, '0')}`;
        const hoTen = `${ho[i % ho.length]} ${tenLot[i % tenLot.length]} ${ten[i % ten.length]}`;
        const email = `gv${i}@example.com`;
        const phone = `09${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`;
        const gioiTinh = (i % 2 === 0) ? 'Nam' : 'Nữ';
        const ngaySinh = `198${i % 10}-0${(i % 9) + 1}-1${i % 9}`;
        gvs.push(maGV);
        // Add user for teacher FIRST due to foreign key
        await db.query('INSERT IGNORE INTO users (TaiKhoan, password, MaQuyen, TrangThai) VALUES (?, ?, ?, ?)', [maGV, defaultPassword, 2, 'Hoạt động']);

        await db.query('INSERT IGNORE INTO giangvien (MaGiangVien, HoTen, Email, SoDienThoai, MaKhoa, TrangThai, NgaySinh, GioiTinh) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [maGV, hoTen, email, phone, maKhoa, 'Đang dạy', ngaySinh, gioiTinh]);
    }
    console.log("Seeded 200 GiangVien");

    // 5. Sinh viên (500)
    for (let i = 1; i <= 500; i++) {
        const maLop = lops[i % lops.length];
        const mssv = `SV${String(i).padStart(6, '0')}`;
        const hoTen = `${ho[i % ho.length]} ${tenLot[(i+1) % tenLot.length]} ${ten[(i+2) % ten.length]}`;
        const email = `sv${i}@student.example.com`;
        const phone = `03${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`;
        const gioiTinh = (i % 2 === 0) ? 'Nam' : 'Nữ';
        const ngaySinh = `200${i % 5}-0${(i % 9) + 1}-1${i % 9}`;
        // Add user for student FIRST due to foreign key
        await db.query('INSERT IGNORE INTO users (TaiKhoan, password, MaQuyen, TrangThai) VALUES (?, ?, ?, ?)', [mssv, defaultPassword, 3, 'Hoạt động']);

        await db.query('INSERT IGNORE INTO sinhvien (MSSV, HoTen, NgaySinh, GioiTinh, Email, SoDienThoai, MaLop, TrangThai) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [mssv, hoTen, ngaySinh, gioiTinh, email, phone, maLop, 'Đang học']);
    }
    console.log("Seeded 500 SinhVien");

    await db.end();
    console.log("Done seeding!");
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
