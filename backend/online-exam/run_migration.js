const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env.local' });

async function run() {
    try {
        const sql = fs.readFileSync('migrate_exam_session.sql', 'utf8');
        const db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306,
            multipleStatements: true
        });

        console.log('Running migration (first time)...');
        await db.query(sql);
        console.log('Success (first time)!');

        console.log('Running migration (second time)...');
        await db.query(sql);
        console.log('Success (second time)!');

        console.log('\nDescribing tables:');
        const tables = ['online_exam_schedules', 'online_exam_attempts', 'online_exam_answers', 'online_exam_violation_events', 'online_exam_connection_events'];
        for (const table of tables) {
            const [desc] = await db.query(`DESCRIBE ${table}`);
            console.log(`\nTable: ${table}`);
            console.table(desc);
        }

        console.log('\nTesting UNIQUE constraint...');
        await db.query(`INSERT INTO online_exam_schedules (id, ma_lop_hoc_phan, ma_giang_vien, thoi_gian_mo, thoi_gian_dong, so_cau_hoi, thoi_luong_phut) VALUES (999, 'LHP01', 'GV01', '2026-01-01 00:00:00', '2026-01-02 00:00:00', 10, 60) ON DUPLICATE KEY UPDATE id=id`);
        
        try {
            await db.query(`INSERT INTO online_exam_attempts (exam_schedule_id, ma_sinh_vien, question_order, option_order_map) VALUES (999, 'SV01', '[]', '{}')`);
            console.log('Insert attempt 1: Success');
            await db.query(`INSERT INTO online_exam_attempts (exam_schedule_id, ma_sinh_vien, question_order, option_order_map) VALUES (999, 'SV01', '[]', '{}')`);
            console.log('Insert attempt 2: Success (THIS SHOULD NOT HAPPEN)');
        } catch (e) {
            if (e.code === 'ER_DUP_ENTRY') {
                console.log('Insert attempt 2: Blocked by UNIQUE constraint (EXPECTED)');
            } else {
                console.error('Insert attempt 2: Failed with unknown error:', e);
            }
        }
        
        await db.query(`DELETE FROM online_exam_schedules WHERE id = 999`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}
run();
