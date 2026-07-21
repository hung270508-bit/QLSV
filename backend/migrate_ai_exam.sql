USE quanlysv;

-- Tạo bảng AI Advisor Sessions
CREATE TABLE IF NOT EXISTS ai_suggestion_sessions (
    id VARCHAR(64) PRIMARY KEY,
    giangvien_id VARCHAR(20) NOT NULL,
    tieu_chi JSON NOT NULL,
    goi_y JSON NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    INDEX idx_expires_at (expires_at),
    FOREIGN KEY (giangvien_id) REFERENCES giangvien(MaGiangVien) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng AI Suggestion Audit Log
CREATE TABLE IF NOT EXISTS ai_suggestion_audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    giangvien_id VARCHAR(20) NOT NULL,
    mon_hoc_id VARCHAR(20) NULL,
    so_cau_goi_y INT DEFAULT 0,
    thoi_gian DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (giangvien_id) REFERENCES giangvien(MaGiangVien) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng cache Knowledge Graph cho tài liệu
CREATE TABLE IF NOT EXISTS document_knowledge_graph (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL UNIQUE,
    kg_json MEDIUMTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
