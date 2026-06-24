-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: mysql-d508c3a-hung270508-ae5d.h.aivencloud.com    Database: defaultdb
-- ------------------------------------------------------
-- Server version	8.4.8

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '0fcfb20c-6d7d-11f1-bdec-6e6f7ddf02a9:1-734,
4585fac6-63de-11f1-981c-06b3c0baae58:1-111,
e51c4a2a-63f7-11f1-9ad9-ee12a9ba2a33:1-1474';

--
-- Table structure for table `chitiet_danhgia`
--

DROP TABLE IF EXISTS `chitiet_danhgia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chitiet_danhgia` (
  `MaChiTiet` int NOT NULL AUTO_INCREMENT,
  `MaDanhGia` int NOT NULL,
  `MaTieuChi` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'VD: 1.1, 1.2, 2.1, 3.1...',
  `DiemChon` int NOT NULL DEFAULT '0' COMMENT 'Điểm SV đã chọn cho tiêu chí này',
  `ChiSoOption` int NOT NULL DEFAULT '0' COMMENT 'Index option đã chọn (0-based)',
  `MinhChung` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'JSON array of uploaded files (max 3)',
  PRIMARY KEY (`MaChiTiet`),
  UNIQUE KEY `uk_danhgia_tieuchi` (`MaDanhGia`,`MaTieuChi`),
  CONSTRAINT `fk_chitiet_danhgia` FOREIGN KEY (`MaDanhGia`) REFERENCES `danhgia_renluyen` (`MaDanhGia`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chitiet_danhgia`
--

LOCK TABLES `chitiet_danhgia` WRITE;
/*!40000 ALTER TABLE `chitiet_danhgia` DISABLE KEYS */;
/*!40000 ALTER TABLE `chitiet_danhgia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dangky_hocphan`
--

DROP TABLE IF EXISTS `dangky_hocphan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dangky_hocphan` (
  `MaDangKy` int NOT NULL AUTO_INCREMENT,
  `MSSV` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MaLopHocPhan` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `HocKy` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NgayDangKy` datetime DEFAULT CURRENT_TIMESTAMP,
  `TrangThai` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Chờ duyệt',
  PRIMARY KEY (`MaDangKy`),
  KEY `MSSV` (`MSSV`),
  KEY `MaLopHocPhan` (`MaLopHocPhan`),
  CONSTRAINT `dangky_hocphan_ibfk_1` FOREIGN KEY (`MSSV`) REFERENCES `sinhvien` (`MSSV`) ON DELETE CASCADE,
  CONSTRAINT `dangky_hocphan_ibfk_2` FOREIGN KEY (`MaLopHocPhan`) REFERENCES `lophocphan` (`MaLopHocPhan`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dangky_hocphan`
--

LOCK TABLES `dangky_hocphan` WRITE;
/*!40000 ALTER TABLE `dangky_hocphan` DISABLE KEYS */;
/*!40000 ALTER TABLE `dangky_hocphan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `danhgia_renluyen`
--

DROP TABLE IF EXISTS `danhgia_renluyen`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `danhgia_renluyen` (
  `MaDanhGia` int NOT NULL AUTO_INCREMENT,
  `MSSV` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `HocKy` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `DiemTuDanhGia` int DEFAULT '0',
  `DiemLopDanhGia` int DEFAULT '0',
  `DiemKhoaDanhGia` int DEFAULT '0',
  `TongDiem` int DEFAULT '0',
  `XepLoai` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `TrangThai` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Chờ lớp duyệt',
  `MaDotDanhGia` int DEFAULT NULL,
  PRIMARY KEY (`MaDanhGia`),
  KEY `MSSV` (`MSSV`),
  CONSTRAINT `danhgia_renluyen_ibfk_1` FOREIGN KEY (`MSSV`) REFERENCES `sinhvien` (`MSSV`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `danhgia_renluyen`
--

LOCK TABLES `danhgia_renluyen` WRITE;
/*!40000 ALTER TABLE `danhgia_renluyen` DISABLE KEYS */;
/*!40000 ALTER TABLE `danhgia_renluyen` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `diem`
--

DROP TABLE IF EXISTS `diem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `diem` (
  `MaDiem` int NOT NULL AUTO_INCREMENT,
  `MSSV` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaLopHocPhan` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `HocKy` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `DiemChuyenCan` decimal(4,2) DEFAULT NULL,
  `DiemBaiTap` decimal(4,2) DEFAULT NULL,
  `DiemGiuaKy` decimal(4,2) DEFAULT NULL,
  `DiemCuoiKy` decimal(4,2) DEFAULT NULL,
  `DiemTong` decimal(4,2) DEFAULT NULL,
  `DiemGPA` decimal(4,2) DEFAULT NULL,
  `DiemChu` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `XepLoai` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`MaDiem`),
  KEY `MSSV` (`MSSV`),
  KEY `MaLopHocPhan` (`MaLopHocPhan`),
  CONSTRAINT `diem_ibfk_1` FOREIGN KEY (`MSSV`) REFERENCES `sinhvien` (`MSSV`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `diem`
--

LOCK TABLES `diem` WRITE;
/*!40000 ALTER TABLE `diem` DISABLE KEYS */;
/*!40000 ALTER TABLE `diem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `diemdanh`
--

DROP TABLE IF EXISTS `diemdanh`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `diemdanh` (
  `MaDiemDanh` int NOT NULL AUTO_INCREMENT,
  `MaLopHocPhan` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MSSV` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NgayDiemDanh` date DEFAULT NULL,
  `TrangThai` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ThoiGianDiemDanh` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`MaDiemDanh`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `diemdanh`
--

LOCK TABLES `diemdanh` WRITE;
/*!40000 ALTER TABLE `diemdanh` DISABLE KEYS */;
/*!40000 ALTER TABLE `diemdanh` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dot_dangky`
--

DROP TABLE IF EXISTS `dot_dangky`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dot_dangky` (
  `MaDot` int NOT NULL AUTO_INCREMENT,
  `TenDot` varchar(200) NOT NULL,
  `HocKy` varchar(20) NOT NULL,
  `NamHoc` varchar(20) NOT NULL,
  `ThoiGianMo` datetime NOT NULL,
  `ThoiGianDong` datetime NOT NULL,
  `IsActive` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`MaDot`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dot_dangky`
--

LOCK TABLES `dot_dangky` WRITE;
/*!40000 ALTER TABLE `dot_dangky` DISABLE KEYS */;
INSERT INTO `dot_dangky` VALUES (1,'Đợt 1 - HK1 2026-2027','HK1','2026-2027','2026-06-23 10:01:09','2026-07-23 10:01:09',1);
/*!40000 ALTER TABLE `dot_dangky` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dot_danhgia`
--

DROP TABLE IF EXISTS `dot_danhgia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dot_danhgia` (
  `MaDotDanhGia` int NOT NULL AUTO_INCREMENT,
  `HocKy` varchar(50) DEFAULT NULL,
  `NamHoc` varchar(50) DEFAULT NULL,
  `NgayBatDau` date DEFAULT NULL,
  `NgayKetThuc` date DEFAULT NULL,
  `TrangThai` varchar(50) DEFAULT 'Đang tự đánh giá',
  `CauTrucTieuChi` json DEFAULT NULL,
  PRIMARY KEY (`MaDotDanhGia`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dot_danhgia`
--

LOCK TABLES `dot_danhgia` WRITE;
/*!40000 ALTER TABLE `dot_danhgia` DISABLE KEYS */;
/*!40000 ALTER TABLE `dot_danhgia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `giangvien`
--

DROP TABLE IF EXISTS `giangvien`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `giangvien` (
  `MaGiangVien` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `HoTen` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `SoDienThoai` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MaKhoa` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `TrangThai` enum('Đang dạy','Tạm nghỉ','Nghỉ việc') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Đang dạy',
  `NgaySinh` date DEFAULT NULL,
  `GioiTinh` enum('Nam','Nữ') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Nam',
  PRIMARY KEY (`MaGiangVien`),
  KEY `MaKhoa` (`MaKhoa`),
  CONSTRAINT `giangvien_ibfk_1` FOREIGN KEY (`MaGiangVien`) REFERENCES `users` (`TaiKhoan`) ON DELETE CASCADE,
  CONSTRAINT `giangvien_ibfk_2` FOREIGN KEY (`MaKhoa`) REFERENCES `khoa` (`MaKhoa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `giangvien`
--

LOCK TABLES `giangvien` WRITE;
/*!40000 ALTER TABLE `giangvien` DISABLE KEYS */;
/*!40000 ALTER TABLE `giangvien` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `khoa`
--

DROP TABLE IF EXISTS `khoa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `khoa` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `MaKhoa` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenKhoa` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`MaKhoa`),
  UNIQUE KEY `ID` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `khoa`
--

LOCK TABLES `khoa` WRITE;
/*!40000 ALTER TABLE `khoa` DISABLE KEYS */;
/*!40000 ALTER TABLE `khoa` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lichhoc`
--

DROP TABLE IF EXISTS `lichhoc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lichhoc` (
  `MaLichHoc` int NOT NULL AUTO_INCREMENT,
  `MaLopHocPhan` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NgayHoc` date DEFAULT NULL,
  `CaHoc` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `PhongHoc` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `SoTiet` int NOT NULL DEFAULT '3',
  `TrangThaiDiemDanh` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `ThoiGianMoDiemDanh` datetime DEFAULT NULL,
  PRIMARY KEY (`MaLichHoc`),
  KEY `MaLopHocPhan` (`MaLopHocPhan`),
  CONSTRAINT `lichhoc_ibfk_1` FOREIGN KEY (`MaLopHocPhan`) REFERENCES `lophocphan` (`MaLopHocPhan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lichhoc`
--

LOCK TABLES `lichhoc` WRITE;
/*!40000 ALTER TABLE `lichhoc` DISABLE KEYS */;
/*!40000 ALTER TABLE `lichhoc` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lichsu_duyet`
--

DROP TABLE IF EXISTS `lichsu_duyet`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lichsu_duyet` (
  `MaLog` int NOT NULL AUTO_INCREMENT,
  `MaDanhGia` int NOT NULL,
  `NguoiDuyet` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tên tài khoản người duyệt (VD: admin)',
  `HanhDong` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nội dung hành động',
  `ThoiGian` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`MaLog`),
  KEY `fk_lichsu_duyet_danhgia` (`MaDanhGia`),
  CONSTRAINT `fk_lichsu_duyet_danhgia` FOREIGN KEY (`MaDanhGia`) REFERENCES `danhgia_renluyen` (`MaDanhGia`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lichsu_duyet`
--

LOCK TABLES `lichsu_duyet` WRITE;
/*!40000 ALTER TABLE `lichsu_duyet` DISABLE KEYS */;
/*!40000 ALTER TABLE `lichsu_duyet` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lophoc`
--

DROP TABLE IF EXISTS `lophoc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lophoc` (
  `MaLop` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenLop` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaKhoa` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NienKhoa` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`MaLop`),
  KEY `MaKhoa` (`MaKhoa`),
  CONSTRAINT `lophoc_ibfk_1` FOREIGN KEY (`MaKhoa`) REFERENCES `khoa` (`MaKhoa`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lophoc`
--

LOCK TABLES `lophoc` WRITE;
/*!40000 ALTER TABLE `lophoc` DISABLE KEYS */;
/*!40000 ALTER TABLE `lophoc` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lophocphan`
--

DROP TABLE IF EXISTS `lophocphan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lophocphan` (
  `MaLopHocPhan` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaMonHoc` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MaLop` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MaGiangVien` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `HocKy` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NamHoc` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `SoLuongToiDa` int DEFAULT '40',
  PRIMARY KEY (`MaLopHocPhan`),
  KEY `MaMonHoc` (`MaMonHoc`),
  KEY `MaGiangVien` (`MaGiangVien`),
  CONSTRAINT `lophocphan_ibfk_1` FOREIGN KEY (`MaMonHoc`) REFERENCES `monhoc` (`MaMonHoc`),
  CONSTRAINT `lophocphan_ibfk_2` FOREIGN KEY (`MaGiangVien`) REFERENCES `giangvien` (`MaGiangVien`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lophocphan`
--

LOCK TABLES `lophocphan` WRITE;
/*!40000 ALTER TABLE `lophocphan` DISABLE KEYS */;
/*!40000 ALTER TABLE `lophocphan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `monhoc`
--

DROP TABLE IF EXISTS `monhoc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `monhoc` (
  `MaMonHoc` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenMonHoc` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `SoTinChi` int NOT NULL,
  `MaKhoa` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`MaMonHoc`),
  KEY `MaKhoa` (`MaKhoa`),
  CONSTRAINT `monhoc_ibfk_1` FOREIGN KEY (`MaKhoa`) REFERENCES `khoa` (`MaKhoa`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `monhoc`
--

LOCK TABLES `monhoc` WRITE;
/*!40000 ALTER TABLE `monhoc` DISABLE KEYS */;
/*!40000 ALTER TABLE `monhoc` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nopbai`
--

DROP TABLE IF EXISTS `nopbai`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nopbai` (
  `MaNopBai` int NOT NULL AUTO_INCREMENT,
  `MaTaiLieu` int NOT NULL,
  `MSSV` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `FileUrl` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ThoiGianNop` datetime DEFAULT CURRENT_TIMESTAMP,
  `Diem` decimal(4,2) DEFAULT NULL,
  PRIMARY KEY (`MaNopBai`),
  KEY `MaTaiLieu` (`MaTaiLieu`),
  KEY `MSSV` (`MSSV`),
  CONSTRAINT `nopbai_ibfk_1` FOREIGN KEY (`MaTaiLieu`) REFERENCES `tailieu_baitap` (`MaTaiLieu`) ON DELETE CASCADE,
  CONSTRAINT `nopbai_ibfk_2` FOREIGN KEY (`MSSV`) REFERENCES `sinhvien` (`MSSV`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nopbai`
--

LOCK TABLES `nopbai` WRITE;
/*!40000 ALTER TABLE `nopbai` DISABLE KEYS */;
/*!40000 ALTER TABLE `nopbai` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `phanconggiangday`
--

DROP TABLE IF EXISTS `phanconggiangday`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phanconggiangday` (
  `MaPhanCong` int NOT NULL AUTO_INCREMENT,
  `MaGiangVien` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MaMonHoc` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MaLop` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `HocKy` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`MaPhanCong`),
  KEY `MaGiangVien` (`MaGiangVien`),
  KEY `MaMonHoc` (`MaMonHoc`),
  KEY `MaLop` (`MaLop`),
  CONSTRAINT `phanconggiangday_ibfk_1` FOREIGN KEY (`MaGiangVien`) REFERENCES `giangvien` (`MaGiangVien`),
  CONSTRAINT `phanconggiangday_ibfk_2` FOREIGN KEY (`MaMonHoc`) REFERENCES `monhoc` (`MaMonHoc`),
  CONSTRAINT `phanconggiangday_ibfk_3` FOREIGN KEY (`MaLop`) REFERENCES `lophoc` (`MaLop`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phanconggiangday`
--

LOCK TABLES `phanconggiangday` WRITE;
/*!40000 ALTER TABLE `phanconggiangday` DISABLE KEYS */;
/*!40000 ALTER TABLE `phanconggiangday` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `phanquyen`
--

DROP TABLE IF EXISTS `phanquyen`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phanquyen` (
  `MaQuyen` int NOT NULL AUTO_INCREMENT,
  `TenQuyen` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`MaQuyen`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phanquyen`
--

LOCK TABLES `phanquyen` WRITE;
/*!40000 ALTER TABLE `phanquyen` DISABLE KEYS */;
INSERT INTO `phanquyen` VALUES (1,'Admin'),(2,'GiangVien'),(3,'SinhVien');
/*!40000 ALTER TABLE `phanquyen` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `phonghoc`
--

DROP TABLE IF EXISTS `phonghoc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phonghoc` (
  `MaPhong` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `TrangThai` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT 'Hoạt động',
  PRIMARY KEY (`MaPhong`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phonghoc`
--

LOCK TABLES `phonghoc` WRITE;
/*!40000 ALTER TABLE `phonghoc` DISABLE KEYS */;
INSERT INTO `phonghoc` VALUES ('A-0101','Hoạt động'),('A-0102','Hoạt động'),('A-0201','Hoạt động'),('A-0202','Hoạt động'),('B-0101','Hoạt động'),('B-0102','Hoạt động'),('B-0201','Hoạt động'),('B-0202','Hoạt động'),('C-0101','Hoạt động'),('C-0102','Hoạt động'),('C-0201','Hoạt động'),('C-0202','Hoạt động'),('E-0101','Hoạt động'),('E-0102','Hoạt động'),('E-0201','Hoạt động'),('E-0202','Hoạt động'),('E-0301','Hoạt động'),('E-0302','Hoạt động');
/*!40000 ALTER TABLE `phonghoc` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rfid_state`
--

DROP TABLE IF EXISTS `rfid_state`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rfid_state` (
  `id` int NOT NULL DEFAULT '1',
  `mode` varchar(50) DEFAULT 'ATTENDANCE',
  `targetMSSV` varchar(20) DEFAULT NULL,
  `capturedUid` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rfid_state`
--

LOCK TABLES `rfid_state` WRITE;
/*!40000 ALTER TABLE `rfid_state` DISABLE KEYS */;
INSERT INTO `rfid_state` VALUES (1,'ATTENDANCE',NULL,NULL);
/*!40000 ALTER TABLE `rfid_state` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sinhvien`
--

DROP TABLE IF EXISTS `sinhvien`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sinhvien` (
  `MSSV` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `HoTen` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `NgaySinh` date DEFAULT NULL,
  `GioiTinh` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `SoDienThoai` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MaLop` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `TrangThai` enum('Đang học','Học lại','Nghỉ học') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Đang học',
  PRIMARY KEY (`MSSV`),
  KEY `MaLop` (`MaLop`),
  CONSTRAINT `sinhvien_ibfk_1` FOREIGN KEY (`MSSV`) REFERENCES `users` (`TaiKhoan`) ON DELETE CASCADE,
  CONSTRAINT `sinhvien_ibfk_2` FOREIGN KEY (`MaLop`) REFERENCES `lophoc` (`MaLop`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sinhvien`
--

LOCK TABLES `sinhvien` WRITE;
/*!40000 ALTER TABLE `sinhvien` DISABLE KEYS */;
/*!40000 ALTER TABLE `sinhvien` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tailieu_baitap`
--

DROP TABLE IF EXISTS `tailieu_baitap`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tailieu_baitap` (
  `MaTaiLieu` int NOT NULL AUTO_INCREMENT,
  `MaPhanCong` int NOT NULL,
  `TieuDe` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Loai` enum('Tài liệu','Bài tập') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `FileUrl` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `HanNop` datetime DEFAULT NULL,
  PRIMARY KEY (`MaTaiLieu`),
  KEY `MaPhanCong` (`MaPhanCong`),
  CONSTRAINT `tailieu_baitap_ibfk_1` FOREIGN KEY (`MaPhanCong`) REFERENCES `phanconggiangday` (`MaPhanCong`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tailieu_baitap`
--

LOCK TABLES `tailieu_baitap` WRITE;
/*!40000 ALTER TABLE `tailieu_baitap` DISABLE KEYS */;
/*!40000 ALTER TABLE `tailieu_baitap` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `the_sv`
--

DROP TABLE IF EXISTS `the_sv`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `the_sv` (
  `uid` varchar(20) NOT NULL,
  `MSSV` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`uid`),
  KEY `fk_the_sv_sinhvien` (`MSSV`),
  CONSTRAINT `fk_the_sv_sinhvien` FOREIGN KEY (`MSSV`) REFERENCES `sinhvien` (`MSSV`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `the_sv`
--

LOCK TABLES `the_sv` WRITE;
/*!40000 ALTER TABLE `the_sv` DISABLE KEYS */;
INSERT INTO `the_sv` VALUES ('079CBF95','23010001'),('532ED526','23010002'),('B753FE95','23010003');
/*!40000 ALTER TABLE `the_sv` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `thongbao`
--

DROP TABLE IF EXISTS `thongbao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `thongbao` (
  `MaThongBao` int NOT NULL AUTO_INCREMENT,
  `TieuDe` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `NoiDung` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `NguoiTao` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaLop_Nhan` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NgayTao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`MaThongBao`),
  KEY `NguoiTao` (`NguoiTao`),
  KEY `MaLop_Nhan` (`MaLop_Nhan`),
  CONSTRAINT `thongbao_ibfk_1` FOREIGN KEY (`NguoiTao`) REFERENCES `users` (`TaiKhoan`),
  CONSTRAINT `thongbao_ibfk_2` FOREIGN KEY (`MaLop_Nhan`) REFERENCES `lophoc` (`MaLop`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `thongbao`
--

LOCK TABLES `thongbao` WRITE;
/*!40000 ALTER TABLE `thongbao` DISABLE KEYS */;
/*!40000 ALTER TABLE `thongbao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tiethoc`
--

DROP TABLE IF EXISTS `tiethoc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tiethoc` (
  `Tiet` int NOT NULL,
  `GioBatDau` time DEFAULT NULL,
  `GioKetThuc` time DEFAULT NULL,
  PRIMARY KEY (`Tiet`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tiethoc`
--

LOCK TABLES `tiethoc` WRITE;
/*!40000 ALTER TABLE `tiethoc` DISABLE KEYS */;
INSERT INTO `tiethoc` VALUES (1,'07:00:00','07:50:00'),(2,'07:50:00','08:40:00'),(3,'08:40:00','09:30:00'),(4,'09:30:00','10:20:00'),(5,'10:20:00','11:10:00'),(6,'11:10:00','12:00:00'),(7,'12:30:00','13:10:00'),(8,'13:10:00','13:50:00'),(9,'13:50:00','14:30:00'),(10,'14:30:00','15:10:00'),(11,'15:10:00','15:50:00'),(12,'15:50:00','16:30:00');
/*!40000 ALTER TABLE `tiethoc` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `TaiKhoan` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaQuyen` int NOT NULL,
  `NgayTao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `TrangThai` enum('Hoạt động','Bị khóa') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Hoạt động',
  PRIMARY KEY (`TaiKhoan`),
  KEY `MaQuyen` (`MaQuyen`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`MaQuyen`) REFERENCES `phanquyen` (`MaQuyen`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('admin','admin@123',1,'2026-06-23 10:01:32','Hoạt động');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `yeucau_hotro`
--

DROP TABLE IF EXISTS `yeucau_hotro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `yeucau_hotro` (
  `MaYeuCau` int NOT NULL AUTO_INCREMENT,
  `MSSV` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MaGiangVien` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `LoaiYeuCau` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ChuDe` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `NoiDung` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `NgayGui` datetime NOT NULL,
  `TrangThai` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Đang xử lý',
  `PhanHoi` text COLLATE utf8mb4_unicode_ci,
  `NgayPhanHoi` datetime DEFAULT NULL,
  PRIMARY KEY (`MaYeuCau`),
  KEY `MSSV` (`MSSV`),
  KEY `MaGiangVien` (`MaGiangVien`),
  CONSTRAINT `yeucau_hotro_ibfk_1` FOREIGN KEY (`MSSV`) REFERENCES `sinhvien` (`MSSV`) ON DELETE CASCADE,
  CONSTRAINT `yeucau_hotro_ibfk_2` FOREIGN KEY (`MaGiangVien`) REFERENCES `giangvien` (`MaGiangVien`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `yeucau_hotro`
--

LOCK TABLES `yeucau_hotro` WRITE;
/*!40000 ALTER TABLE `yeucau_hotro` DISABLE KEYS */;
/*!40000 ALTER TABLE `yeucau_hotro` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-23 17:02:27
