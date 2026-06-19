-- ============================================================
-- Bảng: chitiet_danhgia
-- Mục đích: Lưu chi tiết từng tiêu chí SV đã tích khi tự đánh giá
-- Quan hệ: N-1 với bảng danhgia_renluyen (qua MaDanhGia)
-- ============================================================

CREATE TABLE IF NOT EXISTS chitiet_danhgia (
    MaChiTiet INT AUTO_INCREMENT PRIMARY KEY,
    MaDanhGia INT NOT NULL,
    MaTieuChi VARCHAR(10) NOT NULL COMMENT 'VD: 1.1, 1.2, 2.1, 3.1...',
    DiemChon INT NOT NULL DEFAULT 0 COMMENT 'Điểm SV đã chọn cho tiêu chí này',
    ChiSoOption INT NOT NULL DEFAULT 0 COMMENT 'Index option đã chọn (0-based)',
    CONSTRAINT fk_chitiet_danhgia FOREIGN KEY (MaDanhGia) 
        REFERENCES danhgia_renluyen(MaDanhGia) ON DELETE CASCADE,
    UNIQUE KEY uk_danhgia_tieuchi (MaDanhGia, MaTieuChi)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
