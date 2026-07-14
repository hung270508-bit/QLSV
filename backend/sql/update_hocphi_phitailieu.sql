-- Script cập nhật cấu trúc database bổ sung Phí tài liệu và chi tiết học phí cho MySQL Online/Production
-- Chạy script này trong phpMyAdmin hoặc trình quản lý MySQL nếu không muốn đợi Backend tự đồng bộ.

ALTER TABLE `lophocphan` 
ADD COLUMN IF NOT EXISTS `phi_tai_lieu` DECIMAL(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS `mien_hoc_phi` BOOLEAN DEFAULT FALSE;

ALTER TABLE `hoc_phi_chi_tiet` 
ADD COLUMN IF NOT EXISTS `phi_tai_lieu` DECIMAL(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS `hoc_phi` DECIMAL(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS `mien_giam` DECIMAL(15, 2) DEFAULT 0;
