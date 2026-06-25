const mysql = require('mysql2/promise');
const isCloud = process.argv.includes('--cloud') || process.env.VERCEL;
const envFile = isCloud ? '.env' : '.env.local';
require('dotenv').config({ path: envFile });
console.log(`Using environment variables from: ${envFile}`);

function calculateGradeClassification(diemTong) {
    if (diemTong >= 8.5) return { gpa: 4.0, letter: 'A', classification: 'Giỏi' };
    if (diemTong >= 8.0) return { gpa: 3.5, letter: 'B+', classification: 'Khá' };
    if (diemTong >= 7.0) return { gpa: 3.0, letter: 'B', classification: 'Khá' };
    if (diemTong >= 6.5) return { gpa: 2.5, letter: 'C+', classification: 'Trung bình' };
    if (diemTong >= 5.5) return { gpa: 2.0, letter: 'C', classification: 'Trung bình' };
    if (diemTong >= 5.0) return { gpa: 1.5, letter: 'D+', classification: 'Trung bình yếu' };
    if (diemTong >= 4.0) return { gpa: 1.0, letter: 'D', classification: 'Trung bình yếu' };
    return { gpa: 0.0, letter: 'F', classification: 'Kém' };
}

function getRandomScore(min, max) {
    return (Math.random() * (max - min) + min).toFixed(1);
}

async function fillGrades() {
    console.log('Connecting to database...');
    // We try to connect to the DB based on env variables, or default to localhost
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '1234',
        database: process.env.DB_NAME || 'quanlysv',
        port: process.env.DB_PORT || 3306
    });

    console.log('Fetching null grades...');
    const [rows] = await db.query('SELECT MaDiem, MSSV, MaLopHocPhan FROM diem WHERE DiemTong IS NULL');
    
    console.log(`Found ${rows.length} grade records to fill.`);

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        // Random realistic scores
        const diemChuyenCan = parseFloat(getRandomScore(6.0, 10.0));
        const diemBaiTap = parseFloat(getRandomScore(5.0, 10.0));
        const diemGiuaKy = parseFloat(getRandomScore(4.0, 10.0));
        const diemCuoiKy = parseFloat(getRandomScore(3.0, 10.0));
        
        // Custom formula: Chuyên cần 10%, Bài tập 20%, Giữa kỳ 20%, Cuối kỳ 50%
        const diemTong = (diemChuyenCan * 0.1 + diemBaiTap * 0.2 + diemGiuaKy * 0.2 + diemCuoiKy * 0.5).toFixed(1);
        
        const stats = calculateGradeClassification(parseFloat(diemTong));

        await db.query(
            `UPDATE diem 
             SET DiemChuyenCan = ?, DiemBaiTap = ?, DiemGiuaKy = ?, DiemCuoiKy = ?, 
                 DiemTong = ?, DiemGPA = ?, DiemChu = ?, XepLoai = ?
             WHERE MaDiem = ?`,
            [diemChuyenCan, diemBaiTap, diemGiuaKy, diemCuoiKy, diemTong, stats.gpa, stats.letter, stats.classification, row.MaDiem]
        );
        
        if (i % 20 === 0 && i > 0) {
            console.log(`Updated ${i}/${rows.length} records...`);
        }
    }

    console.log(`Successfully finalized ${rows.length} grades!`);
    db.end();
}

fillGrades().catch(console.error);
