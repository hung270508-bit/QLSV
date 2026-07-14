-- =============================================================
-- Migration: Module Quản Lý Học Phí + Thanh Toán VietQR
-- Tạo ngày: 2026-07-13
-- Lưu ý: Không đụng bảng hoc_phi cũ để tránh mất dữ liệu.
-- Các bảng mới: dot_dong_hoc_phi, hoc_phi_v2, hoc_phi_chi_tiet, giao_dich_hoc_phi
-- =============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Đợt đóng học phí (liên kết với dot_dangky)
CREATE TABLE IF NOT EXISTS dot_dong_hoc_phi (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ma_dot_dangky INT NOT NULL COMMENT 'FK tới dot_dangky.MaDot',
  hoc_ky VARCHAR(20) NOT NULL,
  ten_dot VARCHAR(200) NOT NULL,
  ngay_mo DATETIME NOT NULL,
  ngay_dong DATETIME NOT NULL,
  trang_thai ENUM('chua_mo','dang_mo','da_dong') DEFAULT 'chua_mo',
  don_gia_tin_chi DECIMAL(15,0) NOT NULL COMMENT 'VND/tín chỉ',
  tao_boi VARCHAR(50) NOT NULL COMMENT 'username admin',
  ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Học phí tổng của 1 SV trong 1 đợt (tính tự động)
CREATE TABLE IF NOT EXISTS hoc_phi_v2 (
  id INT PRIMARY KEY AUTO_INCREMENT,
  mssv VARCHAR(20) NOT NULL,
  dot_id INT NOT NULL,
  so_tien DECIMAL(15,0) NOT NULL,
  trang_thai ENUM('Chưa đóng','Đã đóng') DEFAULT 'Chưa đóng',
  ngay_tinh DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_mssv_dot (mssv, dot_id)
);

-- Breakdown chi tiết học phần trong 1 khoản học phí
CREATE TABLE IF NOT EXISTS hoc_phi_chi_tiet (
  id INT PRIMARY KEY AUTO_INCREMENT,
  hoc_phi_id INT NOT NULL,
  ma_lop_hoc_phan VARCHAR(50) NOT NULL,
  ten_mon_hoc VARCHAR(100) NOT NULL,
  so_tin_chi INT NOT NULL,
  don_gia DECIMAL(15,0) NOT NULL,
  thanh_tien DECIMAL(15,0) NOT NULL,
  FOREIGN KEY (hoc_phi_id) REFERENCES hoc_phi_v2(id) ON DELETE CASCADE
);

-- Giao dịch thanh toán (audit trail)
CREATE TABLE IF NOT EXISTS giao_dich_hoc_phi (
  id INT PRIMARY KEY AUTO_INCREMENT,
  hoc_phi_id INT NOT NULL,
  ma_giao_dich VARCHAR(80) UNIQUE NOT NULL,
  so_tien DECIMAL(15,0) NOT NULL,
  noi_dung VARCHAR(100) NOT NULL,
  qr_url TEXT NULL,
  trang_thai ENUM('cho_thanh_toan','thanh_cong','that_bai','het_han') DEFAULT 'cho_thanh_toan',
  nguon_xac_nhan ENUM('auto','manual') NULL,
  admin_username VARCHAR(50) NULL,
  minh_chung_url VARCHAR(255) NULL,
  ghi_chu TEXT NULL,
  thoi_gian_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
  thoi_gian_xac_nhan DATETIME NULL,
  FOREIGN KEY (hoc_phi_id) REFERENCES hoc_phi_v2(id)
);

SET FOREIGN_KEY_CHECKS = 1;
