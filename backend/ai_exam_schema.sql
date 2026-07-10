USE quanlysv;

-- Xóa bảng luyện tập cũ
DROP TABLE IF EXISTS practice_answers;
DROP TABLE IF EXISTS practice_attempts;

-- Bảng Ngân hàng câu hỏi
CREATE TABLE IF NOT EXISTS question_banks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ma_mon_hoc VARCHAR(20) NOT NULL,
    ma_giang_vien VARCHAR(20) NOT NULL,
    tieu_de VARCHAR(255) NOT NULL,
    file_url VARCHAR(255),
    tong_so_cau INT DEFAULT 0,
    trang_thai ENUM('Draft', 'Approved') DEFAULT 'Draft',
    session_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ma_mon_hoc) REFERENCES monhoc(MaMonHoc) ON DELETE CASCADE,
    FOREIGN KEY (ma_giang_vien) REFERENCES giangvien(MaGiangVien) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Câu hỏi
CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bank_id INT NOT NULL,
    chuong VARCHAR(100),
    chu_de VARCHAR(150),
    noi_dung TEXT NOT NULL,
    giai_thich TEXT,
    do_kho ENUM('Easy', 'Medium', 'Hard') DEFAULT 'Medium',
    ai_generated BOOLEAN DEFAULT TRUE,
    trang_thai ENUM('Draft', 'Approved') DEFAULT 'Draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bank_id) REFERENCES question_banks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Đáp án cho câu hỏi
CREATE TABLE IF NOT EXISTS question_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    noi_dung TEXT NOT NULL,
    la_dap_an_dung BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Kỳ thi
CREATE TABLE IF NOT EXISTS exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ma_lop_hoc_phan VARCHAR(30) NOT NULL,
    ma_mon_hoc VARCHAR(20) NOT NULL,
    ma_giang_vien VARCHAR(20) NOT NULL,
    tieu_de VARCHAR(255) NOT NULL,
    thoi_gian_thi_phut INT DEFAULT 60,
    tong_so_cau INT NOT NULL,
    so_cau_de INT DEFAULT 0,
    so_cau_tb INT DEFAULT 0,
    so_cau_kho INT DEFAULT 0,
    thoi_gian_bat_dau DATETIME NOT NULL,
    thoi_gian_ket_thuc DATETIME NOT NULL,
    cho_phep_thi_lai BOOLEAN DEFAULT FALSE,
    trang_thai ENUM('Upcoming', 'Ongoing', 'Completed') DEFAULT 'Upcoming',
    bank_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ma_lop_hoc_phan) REFERENCES lophocphan(MaLopHocPhan) ON DELETE CASCADE,
    FOREIGN KEY (ma_mon_hoc) REFERENCES monhoc(MaMonHoc) ON DELETE CASCADE,
    FOREIGN KEY (ma_giang_vien) REFERENCES giangvien(MaGiangVien) ON DELETE CASCADE,
    FOREIGN KEY (bank_id) REFERENCES question_banks(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Lượt làm bài thi
CREATE TABLE IF NOT EXISTS exam_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    mssv VARCHAR(20) NOT NULL,
    thoi_gian_bat_dau DATETIME DEFAULT CURRENT_TIMESTAMP,
    thoi_gian_nop_bai DATETIME NULL,
    diem_so FLOAT DEFAULT NULL,
    trang_thai ENUM('InProgress', 'Submitted', 'Timeout') DEFAULT 'InProgress',
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (mssv) REFERENCES sinhvien(MSSV) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Lưu trữ vi phạm
CREATE TABLE IF NOT EXISTS exam_attempt_violations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    violation_type VARCHAR(50) NOT NULL,
    occurred_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    note TEXT,
    FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Câu trả lời thi chi tiết
CREATE TABLE IF NOT EXISTS exam_attempt_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_option_id INT NULL,
    la_dap_an_dung BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (selected_option_id) REFERENCES question_options(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- CÁC BẢNG MỚI CHO AI ASSISTED QUESTION BANK WORKFLOW
-- =========================================================

-- 1. Bảng Quản lý Tài liệu Word tải lên
CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ma_mon_hoc VARCHAR(20) NOT NULL,
    ma_giang_vien VARCHAR(20) NOT NULL,
    tieu_de VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    text_content MEDIUMTEXT NOT NULL,
    trang_thai ENUM('READY', 'PROCESSING', 'ARCHIVED') DEFAULT 'READY',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ma_mon_hoc) REFERENCES monhoc(MaMonHoc) ON DELETE CASCADE,
    FOREIGN KEY (ma_giang_vien) REFERENCES giangvien(MaGiangVien) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng Quản lý Phiên sinh câu hỏi AI (Sessions)
CREATE TABLE IF NOT EXISTS ai_generation_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL,
    ma_mon_hoc VARCHAR(20) NOT NULL,
    ma_giang_vien VARCHAR(20) NOT NULL,
    so_cau_yeu_cau INT DEFAULT 10,
    so_cau_da_sinh INT DEFAULT 0,
    do_kho ENUM('Easy', 'Medium', 'Hard', 'Mixed') DEFAULT 'Mixed',
    chu_de VARCHAR(255) DEFAULT 'Toàn bộ',
    trang_thai ENUM('READY', 'RUNNING', 'FAILED', 'COMPLETED') DEFAULT 'READY',
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (ma_mon_hoc) REFERENCES monhoc(MaMonHoc) ON DELETE CASCADE,
    FOREIGN KEY (ma_giang_vien) REFERENCES giangvien(MaGiangVien) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng Câu hỏi tạm thời do AI sinh ra (Staging Questions)
CREATE TABLE IF NOT EXISTS ai_generated_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    document_id INT NOT NULL,
    bank_question_id INT NULL,
    chu_de VARCHAR(150),
    noi_dung TEXT NOT NULL,
    giai_thich TEXT,
    do_kho ENUM('Easy', 'Medium', 'Hard') DEFAULT 'Medium',
    trang_thai ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES ai_generation_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (bank_question_id) REFERENCES questions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng Đáp án cho Câu hỏi tạm thời do AI sinh ra
CREATE TABLE IF NOT EXISTS ai_generated_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    noi_dung TEXT NOT NULL,
    la_dap_an_dung BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (question_id) REFERENCES ai_generated_questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
