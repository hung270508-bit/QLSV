const path = require('path');
const isCloud = process.argv.includes('--cloud') || process.env.VERCEL === '1' || !!process.env.VERCEL;
const envFile = isCloud ? '.env' : '.env.local';
require('dotenv').config({ path: path.join(__dirname, envFile) });
const mysql = require('mysql2/promise');

async function seedSchedule() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
    });

    console.log("Connected to DB. Starting seed for schedule and teaching assignments...");

    try {
        // Lấy dữ liệu giảng viên, môn học, lớp học
        const [giangViens] = await db.query('SELECT MaGiangVien, MaKhoa FROM giangvien');
        const [monHocs] = await db.query('SELECT MaMonHoc, MaKhoa, SoTinChi FROM monhoc');
        const [lopHocs] = await db.query('SELECT MaLop, MaKhoa FROM lophoc');

        if (giangViens.length === 0 || monHocs.length === 0 || lopHocs.length === 0) {
            console.error("Missing master data (giangvien, monhoc, or lophoc)!");
            return;
        }

        const hocKys = ['HK1_2023_2024', 'HK2_2023_2024', 'HK1_2024_2025'];
        const phongHocs = ['A1.101', 'A1.102', 'B2.201', 'B2.202', 'C3.301', 'C3.302'];
        const caHocs = ['Ca 1 (7h - 9h)', 'Ca 2 (9h30 - 11h30)', 'Ca 3 (13h - 15h)', 'Ca 4 (15h30 - 17h30)'];
        
        // Tạo 20 Phân công giảng dạy (Lớp học phần)
        for (let i = 1; i <= 20; i++) {
            // Chọn ngẫu nhiên môn học
            const mh = monHocs[Math.floor(Math.random() * monHocs.length)];
            
            // Tìm giảng viên và lớp học cùng khoa với môn học để hợp logic
            let gvCungKhoa = giangViens.filter(g => g.MaKhoa === mh.MaKhoa);
            let lopCungKhoa = lopHocs.filter(l => l.MaKhoa === mh.MaKhoa);
            
            // Nếu không có, fallback lấy ngẫu nhiên
            if (gvCungKhoa.length === 0) gvCungKhoa = giangViens;
            if (lopCungKhoa.length === 0) lopCungKhoa = lopHocs;

            const gv = gvCungKhoa[Math.floor(Math.random() * gvCungKhoa.length)];
            const lh = lopCungKhoa[Math.floor(Math.random() * lopCungKhoa.length)];
            
            const hk = hocKys[Math.floor(Math.random() * hocKys.length)];
            const namHoc = hk.split('_')[1] + '-' + hk.split('_')[2];
            
            const stt = String(i).padStart(2, '0');
            const maLHP = `${mh.MaMonHoc}.HP${stt}`;

            // Tạo lớp học phần
            await db.query(
                'INSERT IGNORE INTO lophocphan (MaLopHocPhan, MaMonHoc, MaLop, MaGiangVien, HocKy, NamHoc, SoLuongToiDa) VALUES (?, ?, ?, ?, ?, ?, ?)', 
                [maLHP, mh.MaMonHoc, lh.MaLop, gv.MaGiangVien, hk, namHoc, 40]
            );

            // Cũng thêm vào bảng phanconggiangday cho đầy đủ logic
            await db.query(
                'INSERT IGNORE INTO phanconggiangday (MaGiangVien, MaMonHoc, MaLop, HocKy) VALUES (?, ?, ?, ?)',
                [gv.MaGiangVien, mh.MaMonHoc, lh.MaLop, hk]
            );

            // Tự động phân sinh viên của lớp vào lớp học phần
            const [sinhViens] = await db.query('SELECT MSSV FROM sinhvien WHERE MaLop = ?', [lh.MaLop]);
            for (const sv of sinhViens) {
                await db.query('INSERT IGNORE INTO diem (MSSV, MaLopHocPhan, HocKy) VALUES (?, ?, ?)', [sv.MSSV, maLHP, hk]);
                await db.query("INSERT IGNORE INTO dangky_hocphan (MSSV, MaLopHocPhan, HocKy, TrangThai, NgayDangKy) VALUES (?, ?, ?, 'Đã duyệt', NOW())", [sv.MSSV, maLHP, hk]);
            }

            // Tạo Lịch học (mỗi lớp HP có 2-3 buổi học)
            const numSessions = Math.floor(Math.random() * 2) + 2; 
            for(let j = 0; j < numSessions; j++) {
                // Tạo ngày ngẫu nhiên trong vài tháng tới hoặc quá khứ gần
                const dateOffset = Math.floor(Math.random() * 60) - 30; // -30 to +30 days
                const date = new Date();
                date.setDate(date.getDate() + dateOffset);
                const dateStr = date.toISOString().split('T')[0];
                
                const phong = phongHocs[Math.floor(Math.random() * phongHocs.length)];
                const ca = caHocs[Math.floor(Math.random() * caHocs.length)];
                
                await db.query(
                    'INSERT IGNORE INTO lichhoc (MaLopHocPhan, NgayHoc, CaHoc, PhongHoc, SoTiet) VALUES (?, ?, ?, ?, ?)',
                    [maLHP, dateStr, ca, phong, 3]
                );
            }
        }

        console.log("Seeding schedule and teaching assignments completed!");
    } catch (error) {
        console.error("Error during seeding:", error);
    } finally {
        await db.end();
    }
}

seedSchedule();
