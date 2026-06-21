const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false }
});

const ids = [1]; // Assume ID 1 exists, or it won't affect rows but will validate syntax
const query = `
        UPDATE danhgia_renluyen 
        SET TrangThai = 'Đã xác nhận',
            TongDiem = DiemTuDanhGia + DiemKhoaDanhGia,
            XepLoai = CASE 
                WHEN (DiemTuDanhGia + DiemKhoaDanhGia) >= 90 THEN 'Xuất sắc'
                WHEN (DiemTuDanhGia + DiemKhoaDanhGia) >= 80 THEN 'Tốt'
                WHEN (DiemTuDanhGia + DiemKhoaDanhGia) >= 65 THEN 'Khá'
                WHEN (DiemTuDanhGia + DiemKhoaDanhGia) >= 50 THEN 'Trung bình'
                ELSE 'Yếu'
            END
        WHERE MaDanhGia IN (?)
    `;

db.query(query, [ids], (err, results) => {
    if (err) console.error("ERROR:", err.message);
    else console.log("SUCCESS:", results.affectedRows);
    db.end();
});
