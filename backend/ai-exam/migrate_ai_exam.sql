-- ================================================================
-- MIGRATION: AI Exam Refactor — An toàn với mọi phiên bản MySQL/MariaDB
-- Cách dùng: SOURCE "C:/New folder (2)/QLSV/backend/ai-exam/migrate_ai_exam.sql"
-- Có thể chạy lặp lại nhiều lần mà không bị lỗi "column already exists"
--
-- QUAN TRỌNG — THỨ TỰ DEPLOY:
--   1. Chạy file này TRƯỚC
--   2. Xác nhận bằng DESCRIBE ai_generated_questions; DESCRIBE questions;
--   3. Sau đó mới restart backend với code mới
--
-- Nếu migration fail giữa chừng (DDL không rollback):
--   - Mỗi bước in ra "=== [OK] ..." để bạn biết đã xong đến đâu
--   - Chạy lại file an toàn — procedure kiểm tra IF NOT EXISTS trước ALTER
-- ================================================================

USE quanlysv;

SELECT '=== [START] Migration AI Exam — bắt đầu ===' AS migration_log;

-- ----------------------------------------------------------------
-- 1. Tạo bảng cache Knowledge Graph (mới hoàn toàn)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS document_knowledge_graph (
    document_id INT PRIMARY KEY,
    kg_json     JSON NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '=== [OK] Bảng document_knowledge_graph đã sẵn sàng ===' AS migration_log;

-- ----------------------------------------------------------------
-- 2. Thêm cột mới vào bảng STAGING (ai_generated_questions)
--    Dùng stored procedure tạm để check-before-alter,
--    tương thích MySQL 5.7+ và MariaDB 10.0+
-- ----------------------------------------------------------------

DROP PROCEDURE IF EXISTS ai_exam_migrate_staging;
DELIMITER //
CREATE PROCEDURE ai_exam_migrate_staging()
BEGIN
    DECLARE col_exists INT DEFAULT 0;

    -- bloom_level
    SELECT COUNT(*) INTO col_exists FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'ai_generated_questions'
      AND COLUMN_NAME  = 'bloom_level';
    IF col_exists = 0 THEN
        ALTER TABLE ai_generated_questions
            ADD COLUMN bloom_level VARCHAR(20) NULL AFTER do_kho;
    END IF;

    -- chapter
    SELECT COUNT(*) INTO col_exists FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'ai_generated_questions'
      AND COLUMN_NAME  = 'chapter';
    IF col_exists = 0 THEN
        ALTER TABLE ai_generated_questions
            ADD COLUMN chapter VARCHAR(255) NULL AFTER bloom_level;
    END IF;

    -- question_type
    SELECT COUNT(*) INTO col_exists FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'ai_generated_questions'
      AND COLUMN_NAME  = 'question_type';
    IF col_exists = 0 THEN
        ALTER TABLE ai_generated_questions
            ADD COLUMN question_type VARCHAR(50) NULL AFTER chapter;
    END IF;

    -- keywords
    SELECT COUNT(*) INTO col_exists FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'ai_generated_questions'
      AND COLUMN_NAME  = 'keywords';
    IF col_exists = 0 THEN
        ALTER TABLE ai_generated_questions
            ADD COLUMN keywords JSON NULL AFTER question_type;
    END IF;
END //
DELIMITER ;

CALL ai_exam_migrate_staging();
DROP PROCEDURE IF EXISTS ai_exam_migrate_staging;

-- Log trạng thái bảng staging sau migration
SELECT '=== [OK] Bảng ai_generated_questions — cột đã có sau migration ===' AS migration_log;
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME   = 'ai_generated_questions'
  AND COLUMN_NAME  IN ('bloom_level', 'chapter', 'question_type', 'keywords')
ORDER BY ORDINAL_POSITION;

-- ----------------------------------------------------------------
-- 3. Thêm cột mới vào bảng BANK CHÍNH THỨC (questions)
--    Đảm bảo metadata không bị mất khi approveAndMoveToBank
-- ----------------------------------------------------------------

DROP PROCEDURE IF EXISTS ai_exam_migrate_bank;
DELIMITER //
CREATE PROCEDURE ai_exam_migrate_bank()
BEGIN
    DECLARE col_exists INT DEFAULT 0;

    -- bloom_level
    SELECT COUNT(*) INTO col_exists FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'questions'
      AND COLUMN_NAME  = 'bloom_level';
    IF col_exists = 0 THEN
        ALTER TABLE questions
            ADD COLUMN bloom_level VARCHAR(20) NULL AFTER do_kho;
    END IF;

    -- chapter
    SELECT COUNT(*) INTO col_exists FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'questions'
      AND COLUMN_NAME  = 'chapter';
    IF col_exists = 0 THEN
        ALTER TABLE questions
            ADD COLUMN chapter VARCHAR(255) NULL AFTER bloom_level;
    END IF;

    -- question_type
    SELECT COUNT(*) INTO col_exists FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'questions'
      AND COLUMN_NAME  = 'question_type';
    IF col_exists = 0 THEN
        ALTER TABLE questions
            ADD COLUMN question_type VARCHAR(50) NULL AFTER chapter;
    END IF;

    -- keywords
    SELECT COUNT(*) INTO col_exists FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'questions'
      AND COLUMN_NAME  = 'keywords';
    IF col_exists = 0 THEN
        ALTER TABLE questions
            ADD COLUMN keywords JSON NULL AFTER question_type;
    END IF;
END //
DELIMITER ;

CALL ai_exam_migrate_bank();
DROP PROCEDURE IF EXISTS ai_exam_migrate_bank;

-- Log trạng thái bảng bank sau migration
SELECT '=== [OK] Bảng questions (bank) — cột đã có sau migration ===' AS migration_log;
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME   = 'questions'
  AND COLUMN_NAME  IN ('bloom_level', 'chapter', 'question_type', 'keywords')
ORDER BY ORDINAL_POSITION;

SELECT '=== [DONE] Migration hoàn thành — tiếp theo: DESCRIBE để xác nhận, rồi mới restart backend ===' AS migration_log;

-- ----------------------------------------------------------------
-- Lệnh xác nhận thủ công sau khi chạy file này:
--   DESCRIBE ai_generated_questions;
--   DESCRIBE questions;
--   SELECT * FROM document_knowledge_graph LIMIT 1;
-- ----------------------------------------------------------------
