const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });
const mysql = require('mysql2/promise');

async function run() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '16052005T',
        database: process.env.DB_NAME || 'quanlysv',
        port: process.env.DB_PORT || 3306
    });

    console.log('Connected to MySQL...');

    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS ai_suggestion_sessions (
              id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
              giangvien_id    VARCHAR(20) NOT NULL,
              tieu_chi        JSON NOT NULL,
              goi_y           JSON NOT NULL,
              created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              expires_at      TIMESTAMP NOT NULL,
              FOREIGN KEY (giangvien_id) REFERENCES giangvien(MaGiangVien) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('Created ai_suggestion_sessions table successfully with DEFAULT (UUID()).');
    } catch (e) {
        console.log('Note on DEFAULT (UUID()):', e.message);
        if (e.message.includes('DEFAULT') || e.message.includes('syntax')) {
            console.log('Falling back to CHAR(36) PRIMARY KEY without DEFAULT (UUID())...');
            await db.query(`
                CREATE TABLE IF NOT EXISTS ai_suggestion_sessions (
                  id              CHAR(36) PRIMARY KEY,
                  giangvien_id    VARCHAR(20) NOT NULL,
                  tieu_chi        JSON NOT NULL,
                  goi_y           JSON NOT NULL,
                  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  expires_at      TIMESTAMP NOT NULL,
                  FOREIGN KEY (giangvien_id) REFERENCES giangvien(MaGiangVien) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `);
            console.log('Created ai_suggestion_sessions table successfully without DEFAULT UUID.');
        } else {
            throw e;
        }
    }

    await db.query(`
        CREATE TABLE IF NOT EXISTS ai_suggestion_audit_log (
          id              INT AUTO_INCREMENT PRIMARY KEY,
          giangvien_id    VARCHAR(20) NOT NULL,
          mon_hoc_id      VARCHAR(20),
          so_cau_goi_y    INT NOT NULL,
          thoi_gian       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (giangvien_id) REFERENCES giangvien(MaGiangVien) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Created ai_suggestion_audit_log table successfully.');

    await db.end();
}

run().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
