-- ============================================================
-- Bảng: lichsu_duyet
-- Mục đích: Lưu lịch sử phê duyệt điểm rèn luyện (Audit Log)
-- ============================================================

CREATE TABLE IF NOT EXISTS lichsu_duyet (
    MaLog INT AUTO_INCREMENT PRIMARY KEY,
    MaDanhGia INT NOT NULL,
    NguoiDuyet VARCHAR(50) NOT NULL COMMENT 'Tên tài khoản người duyệt (VD: admin)',
    HanhDong VARCHAR(255) NOT NULL COMMENT 'Nội dung hành động',
    ThoiGian TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_lichsu_duyet_danhgia FOREIGN KEY (MaDanhGia) 
        REFERENCES danhgia_renluyen(MaDanhGia) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
