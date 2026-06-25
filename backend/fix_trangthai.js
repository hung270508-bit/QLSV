const mysql = require('mysql2/promise');
async function run() {
    const db = await mysql.createConnection({ host: 'localhost', user: 'root', password: '1234', database: 'quanlysv' });
    await db.query(`UPDATE users SET TrangThai = 1 WHERE TrangThai = 0 AND TaiKhoan != 'admin'`);
    console.log('Updated users TrangThai to 1');
    db.end();
}
run();
