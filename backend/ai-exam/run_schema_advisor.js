const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
const mysql = require('mysql2/promise');
const fs = require('fs');

async function run() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'quanlysv',
        multipleStatements: true
    });

    try {
        console.log('Connecting to database...');
        const schemaSql = fs.readFileSync(path.join(__dirname, 'schema_advisor.sql'), 'utf8');
        await pool.query(schemaSql);
        console.log('Successfully ran schema_advisor.sql');

        // Check if `nguon` column exists in `questions`
        const [cols] = await pool.query('SHOW COLUMNS FROM questions LIKE "nguon"');
        if (cols.length === 0) {
            await pool.query("ALTER TABLE questions ADD COLUMN nguon ENUM('AI', 'GV') NOT NULL DEFAULT 'GV'");
            console.log('Successfully added `nguon` column to table `questions`');
        } else {
            console.log('`nguon` column already exists in table `questions`');
        }

        // Check if `creator_id` column exists in `questions`
        const [creatorCols] = await pool.query('SHOW COLUMNS FROM questions LIKE "creator_id"');
        if (creatorCols.length === 0) {
            await pool.query("ALTER TABLE questions ADD COLUMN creator_id VARCHAR(50) NULL");
            console.log('Successfully added `creator_id` column to table `questions`');
        } else {
            console.log('`creator_id` column already exists in table `questions`');
        }

    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        await pool.end();
    }
}

run();
