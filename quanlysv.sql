-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1:3306
-- Thời gian đã tạo: Th5 26, 2026 lúc 04:05 AM
-- Phiên bản máy phục vụ: 8.4.7
-- Phiên bản PHP: 8.3.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `quanlysv`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `diem`
--

DROP TABLE IF EXISTS `diem`;
CREATE TABLE IF NOT EXISTS `diem` (
  `MaDiem` int NOT NULL AUTO_INCREMENT,
  `MSSV` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaMonHoc` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `HocKy` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `DiemGiuaKy` decimal(4,2) DEFAULT NULL,
  `DiemCuoiKy` decimal(4,2) DEFAULT NULL,
  `DiemTongKet` decimal(4,2) GENERATED ALWAYS AS (((`DiemGiuaKy` * 0.40) + (`DiemCuoiKy` * 0.60))) STORED,
  PRIMARY KEY (`MaDiem`),
  KEY `MSSV` (`MSSV`),
  KEY `MaMonHoc` (`MaMonHoc`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `diem`
--

INSERT INTO `diem` (`MaDiem`, `MSSV`, `MaMonHoc`, `HocKy`, `DiemGiuaKy`, `DiemCuoiKy`) VALUES
(1, 'SV001', 'MH001', 'HK1', 8.00, 8.00),
(2, 'SV001', 'MH004', 'HK1', 7.50, 8.50),
(3, 'SV002', 'MH001', 'HK1', 6.00, 7.00),
(4, 'SV002', 'MH004', 'HK1', 8.00, 9.00),
(5, 'SV003', 'MH002', 'HK1', 9.00, 8.50),
(6, 'SV004', 'MH003', 'HK1', 7.00, 7.50);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `giangvien`
--

DROP TABLE IF EXISTS `giangvien`;
CREATE TABLE IF NOT EXISTS `giangvien` (
  `MaGiangVien` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaTaiKhoan` int NOT NULL,
  `HoTen` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `SoDienThoai` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MaKhoa` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`MaGiangVien`),
  UNIQUE KEY `Email` (`Email`),
  UNIQUE KEY `MaTaiKhoan` (`MaTaiKhoan`),
  KEY `MaKhoa` (`MaKhoa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `giangvien`
--

INSERT INTO `giangvien` (`MaGiangVien`, `MaTaiKhoan`, `HoTen`, `Email`, `SoDienThoai`, `MaKhoa`) VALUES
('GV001', 2, 'Nguyễn Văn A', 'teacher@gmail.com', '12345678', 'CNTT-1'),
('GV002', 4, 'Trần Thị B', 'teacher2@gmail.com', '0987654321', 'KT-1'),
('GV003', 5, 'Lê Văn C', 'teacher3@gmail.com', '0912345678', 'NN-1'),
('GV004', 9, 'Đinh Văn G', 'teacher4@gmail.com', '0911223344', 'CNTT-1'),
('GV005', 10, 'Lý Thị H', 'teacher5@gmail.com', '0922334455', 'KT-1');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `khoa`
--

DROP TABLE IF EXISTS `khoa`;
CREATE TABLE IF NOT EXISTS `khoa` (
  `MaKhoa` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenKhoa` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`MaKhoa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `khoa`
--

INSERT INTO `khoa` (`MaKhoa`, `TenKhoa`) VALUES
('CNTT-1', 'Công nghệ thông tin'),
('KT-1', 'Kinh tế - Quản trị kinh doanh'),
('NN-1', 'Ngoại ngữ');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `lichhoc`
--

DROP TABLE IF EXISTS `lichhoc`;
CREATE TABLE IF NOT EXISTS `lichhoc` (
  `MaLichHoc` int NOT NULL AUTO_INCREMENT,
  `MaPhanCong` int NOT NULL,
  `Thu` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `CaHoc` int NOT NULL,
  `PhongHoc` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`MaLichHoc`),
  KEY `MaPhanCong` (`MaPhanCong`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `lichhoc`
--

INSERT INTO `lichhoc` (`MaLichHoc`, `MaPhanCong`, `Thu`, `CaHoc`, `PhongHoc`) VALUES
(1, 1, '3', 1, 'P-001'),
(2, 2, '4', 2, 'P-001'),
(3, 3, '5', 1, 'P-002'),
(4, 4, '6', 3, 'P-003');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `lophoc`
--

DROP TABLE IF EXISTS `lophoc`;
CREATE TABLE IF NOT EXISTS `lophoc` (
  `MaLop` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenLop` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaKhoa` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`MaLop`),
  KEY `MaKhoa` (`MaKhoa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `lophoc`
--

INSERT INTO `lophoc` (`MaLop`, `TenLop`, `MaKhoa`) VALUES
('ML-001', '23T4-LTM2', 'CNTT-1'),
('ML-002', '23KT-QTKD', 'KT-1'),
('ML-003', '23NN-NNA', 'NN-1');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `monhoc`
--

DROP TABLE IF EXISTS `monhoc`;
CREATE TABLE IF NOT EXISTS `monhoc` (
  `MaMonHoc` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenMonHoc` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `SoTinChi` int NOT NULL,
  PRIMARY KEY (`MaMonHoc`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `monhoc`
--

INSERT INTO `monhoc` (`MaMonHoc`, `TenMonHoc`, `SoTinChi`) VALUES
('MH001', 'Lập trình máy', 45),
('MH002', 'Kinh tế vi mô', 45),
('MH003', 'Tiếng Anh chuyên ngành', 60),
('MH004', 'Cơ sở dữ liệu', 45),
('MH005', 'Cấu trúc dữ liệu và Giải thuật', 45),
('MH006', 'Phát triển ứng dụng Web', 60),
('MH007', 'Mạng máy tính', 45),
('MH008', 'Quản trị học', 30),
('MH009', 'Marketing căn bản', 45),
('MH010', 'Tiếng Anh giao tiếp', 60),
('MH011', 'Toán cao cấp', 45),
('MH012', 'Triết học Mác - Lênin', 45),
('MH013', 'An toàn thông tin', 45),
('MH014', 'Phân tích và Thiết kế hệ thống', 60),
('MH015', 'Trí tuệ nhân tạo', 45);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `phanconggiangday`
--

DROP TABLE IF EXISTS `phanconggiangday`;
CREATE TABLE IF NOT EXISTS `phanconggiangday` (
  `MaPhanCong` int NOT NULL AUTO_INCREMENT,
  `MaGiangVien` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaMonHoc` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaLop` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `HocKy` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`MaPhanCong`),
  KEY `MaGiangVien` (`MaGiangVien`),
  KEY `MaMonHoc` (`MaMonHoc`),
  KEY `MaLop` (`MaLop`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `phanconggiangday`
--

INSERT INTO `phanconggiangday` (`MaPhanCong`, `MaGiangVien`, `MaMonHoc`, `MaLop`, `HocKy`) VALUES
(1, 'GV001', 'MH001', 'ML-001', 'HK1'),
(2, 'GV001', 'MH004', 'ML-001', 'HK1'),
(3, 'GV002', 'MH002', 'ML-002', 'HK1'),
(4, 'GV003', 'MH003', 'ML-003', 'HK1');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `sinhvien`
--

DROP TABLE IF EXISTS `sinhvien`;
CREATE TABLE IF NOT EXISTS `sinhvien` (
  `MSSV` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaTaiKhoan` int NOT NULL,
  `HoTen` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `NgaySinh` date NOT NULL,
  `GioiTinh` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `SoDienThoai` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `AnhDaiDien` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MaLop` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`MSSV`),
  UNIQUE KEY `Email` (`Email`),
  UNIQUE KEY `MaTaiKhoan` (`MaTaiKhoan`),
  KEY `MaLop` (`MaLop`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `sinhvien`
--

INSERT INTO `sinhvien` (`MSSV`, `MaTaiKhoan`, `HoTen`, `NgaySinh`, `GioiTinh`, `Email`, `SoDienThoai`, `AnhDaiDien`, `MaLop`) VALUES
('SV001', 1, 'Đặng nguyễn Quốc Hùng', '2008-05-27', 'Nam', 'student@gmail.com', '12345678', NULL, 'ML-001'),
('SV002', 3, 'Phạm Thị D', '2005-08-15', 'Nữ', 'student2@gmail.com', '0933112233', NULL, 'ML-001'),
('SV003', 6, 'Hoàng Văn E', '2004-12-20', 'Nam', 'student3@gmail.com', '0944223344', NULL, 'ML-002'),
('SV004', 7, 'Ngô Thị F', '2005-01-10', 'Nữ', 'student4@gmail.com', '0955334455', NULL, 'ML-003'),
('SV005', 11, 'Vũ Văn I', '2005-11-02', 'Nam', 'student5@gmail.com', '0966778899', NULL, 'ML-001'),
('SV006', 12, 'Bùi Thị K', '2004-03-25', 'Nữ', 'student6@gmail.com', '0977889900', NULL, 'ML-002'),
('SV007', 13, 'Châu Văn L', '2005-07-19', 'Nam', 'student7@gmail.com', '0988990011', NULL, 'ML-003');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `MaTaiKhoan` int NOT NULL AUTO_INCREMENT,
  `TenDangNhap` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','teacher','student') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `NgayTao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`MaTaiKhoan`),
  UNIQUE KEY `TenDangNhap` (`TenDangNhap`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`MaTaiKhoan`, `TenDangNhap`, `password`, `role`, `NgayTao`) VALUES
(1, 'admin', '123', 'admin', '2026-05-25 03:16:00'),
(2, 'giaovien', '123', 'teacher', '2026-05-25 03:16:00'),
(3, 'sinhvien', '123', 'student', '2026-05-25 03:17:06'),
(4, 'giaovien2', '123', 'teacher', '2026-05-26 03:59:46'),
(5, 'giaovien3', '123', 'teacher', '2026-05-26 03:59:46'),
(6, 'sinhvien2', '123', 'student', '2026-05-26 03:59:46'),
(7, 'sinhvien3', '123', 'student', '2026-05-26 03:59:46'),
(8, 'sinhvien4', '123', 'student', '2026-05-26 03:59:46'),
(9, 'giaovien4', '123', 'teacher', '2026-05-26 04:03:30'),
(10, 'giaovien5', '123', 'teacher', '2026-05-26 04:03:30'),
(11, 'sinhvien5', '123', 'student', '2026-05-26 04:03:30'),
(12, 'sinhvien6', '123', 'student', '2026-05-26 04:03:30'),
(13, 'sinhvien7', '123', 'student', '2026-05-26 04:03:30');

--
-- Ràng buộc đối với các bảng kết xuất
--

--
-- Ràng buộc cho bảng `diem`
--
ALTER TABLE `diem`
  ADD CONSTRAINT `diem_ibfk_1` FOREIGN KEY (`MSSV`) REFERENCES `sinhvien` (`MSSV`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `diem_ibfk_2` FOREIGN KEY (`MaMonHoc`) REFERENCES `monhoc` (`MaMonHoc`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ràng buộc cho bảng `giangvien`
--
ALTER TABLE `giangvien`
  ADD CONSTRAINT `giangvien_ibfk_1` FOREIGN KEY (`MaTaiKhoan`) REFERENCES `users` (`MaTaiKhoan`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `giangvien_ibfk_2` FOREIGN KEY (`MaKhoa`) REFERENCES `khoa` (`MaKhoa`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ràng buộc cho bảng `lichhoc`
--
ALTER TABLE `lichhoc`
  ADD CONSTRAINT `lichhoc_ibfk_1` FOREIGN KEY (`MaPhanCong`) REFERENCES `phanconggiangday` (`MaPhanCong`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ràng buộc cho bảng `lophoc`
--
ALTER TABLE `lophoc`
  ADD CONSTRAINT `lophoc_ibfk_1` FOREIGN KEY (`MaKhoa`) REFERENCES `khoa` (`MaKhoa`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ràng buộc cho bảng `phanconggiangday`
--
ALTER TABLE `phanconggiangday`
  ADD CONSTRAINT `phanconggiangday_ibfk_1` FOREIGN KEY (`MaGiangVien`) REFERENCES `giangvien` (`MaGiangVien`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `phanconggiangday_ibfk_2` FOREIGN KEY (`MaMonHoc`) REFERENCES `monhoc` (`MaMonHoc`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `phanconggiangday_ibfk_3` FOREIGN KEY (`MaLop`) REFERENCES `lophoc` (`MaLop`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ràng buộc cho bảng `sinhvien`
--
ALTER TABLE `sinhvien`
  ADD CONSTRAINT `sinhvien_ibfk_1` FOREIGN KEY (`MaTaiKhoan`) REFERENCES `users` (`MaTaiKhoan`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `sinhvien_ibfk_2` FOREIGN KEY (`MaLop`) REFERENCES `lophoc` (`MaLop`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
