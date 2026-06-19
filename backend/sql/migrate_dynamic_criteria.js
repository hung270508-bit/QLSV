const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    async function addColumnIfNotExists(table, column, definition) {
        const [rows] = await connection.execute(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
            [process.env.DB_NAME, table, column]
        );
        if (rows.length > 0) {
            console.log(`SKIP: ${table}.${column} already exists`);
            return;
        }
        await connection.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        console.log(`OK: ${table}.${column} added`);
    }

    try {
        await addColumnIfNotExists('dot_danhgia', 'CauTrucTieuChi', 'JSON DEFAULT NULL');
        await addColumnIfNotExists('danhgia_renluyen', 'MaDotDanhGia', 'INT DEFAULT NULL');
        console.log('\nMigration completed successfully!');
    } catch (error) {
        console.error('Migration error:', error.message);
    } finally {
        await connection.end();
    }
}

migrate();
