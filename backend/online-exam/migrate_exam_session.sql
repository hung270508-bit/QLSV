-- Giai đoạn 1: Database schema cho Module Thi trực tuyến & Giám sát

USE quanlysv;

SELECT '=== [START] Migration Online Exam Session ===' AS migration_log;

-- 1. online_exam_schedules
CREATE TABLE IF NOT EXISTS online_exam_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ma_lop_hoc_phan VARCHAR(50) NOT NULL,
    ma_giang_vien VARCHAR(50) NOT NULL,
    thoi_gian_mo DATETIME NOT NULL,
    thoi_gian_dong DATETIME NOT NULL,
    so_cau_hoi INT NOT NULL,
    thoi_luong_phut INT NOT NULL,
    trang_thai VARCHAR(20) DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SELECT '=== [OK] Table online_exam_schedules ===' AS migration_log;

-- 2. online_exam_attempts
CREATE TABLE IF NOT EXISTS online_exam_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_schedule_id INT NOT NULL,
    ma_sinh_vien VARCHAR(50) NOT NULL,
    question_order JSON NOT NULL,
    option_order_map JSON NOT NULL,
    status VARCHAR(20) DEFAULT 'WAITING',
    started_at DATETIME,
    deadline_at DATETIME,
    submitted_at DATETIME,
    last_heartbeat_at DATETIME,
    UNIQUE KEY idx_unique_attempt (exam_schedule_id, ma_sinh_vien),
    FOREIGN KEY (exam_schedule_id) REFERENCES online_exam_schedules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SELECT '=== [OK] Table online_exam_attempts ===' AS migration_log;

-- 3. online_exam_answers
CREATE TABLE IF NOT EXISTS online_exam_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_option_id INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY idx_unique_answer (attempt_id, question_id),
    FOREIGN KEY (attempt_id) REFERENCES online_exam_attempts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SELECT '=== [OK] Table online_exam_answers ===' AS migration_log;

-- 4. online_exam_violation_events
CREATE TABLE IF NOT EXISTS online_exam_violation_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    violation_type VARCHAR(50) NOT NULL,
    occurred_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    note TEXT,
    FOREIGN KEY (attempt_id) REFERENCES online_exam_attempts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SELECT '=== [OK] Table online_exam_violation_events ===' AS migration_log;

-- 5. online_exam_connection_events
CREATE TABLE IF NOT EXISTS online_exam_connection_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    occurred_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attempt_id) REFERENCES online_exam_attempts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SELECT '=== [OK] Table online_exam_connection_events ===' AS migration_log;

SELECT '=== [END] Migration Online Exam Session successful ===' AS migration_log;
