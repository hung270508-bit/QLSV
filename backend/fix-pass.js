const mysql = require('mysql2');
const bcrypt = require('bcrypt');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '16052005T', // Đã lấy đúng pass DB của bạn
    database: process.env.DB_NAME || 'quanlysv'
});

async function fixPasswords() {
    console.log("Đang tạo mã Hash chuẩn 100% từ Bcrypt...");
    
    try {
        // 1. Tạo Hash thật cho Admin
        const hashAdmin = await bcrypt.hash('admin@123', 10);
        db.query("UPDATE users SET password = ? WHERE MaQuyen = 1", [hashAdmin]);

        // 2. Tạo Hash thật cho Giảng viên
        const hashGV = await bcrypt.hash('gv@2025', 10);
        db.query("UPDATE users SET password = ? WHERE MaQuyen = 2", [hashGV]);

        // 3. Tạo Hash thật cho Sinh viên
        const hashSV = await bcrypt.hash('123456aA@', 10);
        db.query("UPDATE users SET password = ? WHERE MaQuyen = 3", [hashSV]);

        console.log("✅ Cập nhật mật khẩu mã hóa thành công!");
        console.log("Vui lòng nhấn Ctrl + C để thoát, sau đó ra web đăng nhập lại.");
    } catch (error) {
        console.error("❌ Có lỗi xảy ra:", error);
    }
}

fixPasswords();