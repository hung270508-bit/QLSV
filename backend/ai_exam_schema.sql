USE quanlysv;

-- Bảng Ngân hàng câu hỏi
CREATE TABLE IF NOT EXISTS question_banks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ma_mon_hoc VARCHAR(20) NOT NULL,
    ma_giang_vien VARCHAR(20) NOT NULL,
    tieu_de VARCHAR(255) NOT NULL,
    file_url VARCHAR(255),
    tong_so_cau INT DEFAULT 0,
    trang_thai ENUM('Draft', 'Approved') DEFAULT 'Draft',
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ma_lop_hoc_phan) REFERENCES lophocphan(MaLopHocPhan) ON DELETE CASCADE,
    FOREIGN KEY (ma_mon_hoc) REFERENCES monhoc(MaMonHoc) ON DELETE CASCADE,
    FOREIGN KEY (ma_giang_vien) REFERENCES giangvien(MaGiangVien) ON DELETE CASCADE
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

-- Bảng Lượt luyện tập
CREATE TABLE IF NOT EXISTS practice_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mssv VARCHAR(20) NOT NULL,
    ma_mon_hoc VARCHAR(20) NOT NULL,
    tong_so_cau INT NOT NULL,
    diem_so FLOAT DEFAULT NULL,
    thoi_gian_bat_dau DATETIME DEFAULT CURRENT_TIMESTAMP,
    thoi_gian_nop_bai DATETIME NULL,
    FOREIGN KEY (mssv) REFERENCES sinhvien(MSSV) ON DELETE CASCADE,
    FOREIGN KEY (ma_mon_hoc) REFERENCES monhoc(MaMonHoc) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Câu trả lời luyện tập chi tiết
CREATE TABLE IF NOT EXISTS practice_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_option_id INT NULL,
    la_dap_an_dung BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (attempt_id) REFERENCES practice_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (selected_option_id) REFERENCES question_options(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
