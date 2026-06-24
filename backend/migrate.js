const path = require('path');
const isCloud = process.argv.includes('--cloud');
const envFile = isCloud ? '.env' : '.env.local';
require('dotenv').config({ path: path.join(__dirname, envFile) });
const mysql = require('mysql2/promise');

async function run() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST, 
        user: process.env.DB_USER, 
        password: process.env.DB_PASSWORD, 
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    });
    
    try {
        await db.query("ALTER TABLE diemdanh ADD COLUMN LanDiemDanh INT DEFAULT 1;");
        console.log("Added LanDiemDanh to diemdanh");
    } catch(e) { console.log(e.message); }
    
    try {
        await db.query("ALTER TABLE lichhoc ADD COLUMN LanDiemDanhHienTai INT DEFAULT 0;");
        console.log("Added LanDiemDanhHienTai to lichhoc");
    } catch(e) { console.log(e.message); }
    
    process.exit(0);
}
run();
