require('dotenv').config({path: '.env'});
const mysql = require('mysql2/promise');

async function migrate() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
        ssl: {rejectUnauthorized: false}
    });

    try {
        await db.query(`ALTER TABLE lichhoc ADD COLUMN TrangThaiDiemDanh VARCHAR(20) DEFAULT 'PENDING', ADD COLUMN ThoiGianMoDiemDanh DATETIME NULL`);
        console.log('ALTER SUCCESS');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('ALTER ALREADY DONE');
        } else {
            console.log('ALTER ERROR:', e.message);
        }
    }
    process.exit(0);
}

migrate();
