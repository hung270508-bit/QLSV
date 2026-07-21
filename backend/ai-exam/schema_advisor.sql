-- ================================================================
-- SCHEMA FOR AI EXAM ADVISOR (SUGGEST-ONLY MODEL)
-- ================================================================

USE quanlysv;

-- Bảng lưu trữ phiên gợi ý câu hỏi AI (TTL 30 phút, không liên kết ngược với cauhoi/questions)
CREATE TABLE IF NOT EXISTS ai_suggestion_sessions (
  id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  giangvien_id    VARCHAR(20) NOT NULL,
  tieu_chi        JSON NOT NULL,      -- {mon_hoc_id, chuong_id, do_kho, so_luong}
  goi_y           JSON NOT NULL,      -- [{cauhoi, dapan_dung, dapan_nhieu}, ...] (đã qua aiContentValidator)
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at      TIMESTAMP NOT NULL, -- created_at + 30 phút
  FOREIGN KEY (giangvien_id) REFERENCES giangvien(MaGiangVien) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng audit log thống kê mức phụ thuộc AI (không lưu câu hỏi, chỉ lưu số câu gợi ý)
CREATE TABLE IF NOT EXISTS ai_suggestion_audit_log (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  giangvien_id    VARCHAR(20) NOT NULL,
  mon_hoc_id      VARCHAR(20),
  so_cau_goi_y    INT NOT NULL,
  thoi_gian       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (giangvien_id) REFERENCES giangvien(MaGiangVien) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
