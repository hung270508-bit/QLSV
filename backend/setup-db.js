require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');
const fs = require('fs');

async function setup() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'quanlysv',
            multipleStatements: true
        });

        const sql = fs.readFileSync('ai_exam_schema.sql', 'utf8');
        await connection.query(sql);
        console.log('Tạo bảng thành công!');
        await connection.end();
    } catch (error) {
        console.error('Lỗi tạo bảng:', error);
    }
}

setup();
