-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: quanlysv
-- ------------------------------------------------------
-- Server version	8.0.46

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

--
-- Table structure for table `diem`
--

DROP TABLE IF EXISTS `diem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `diem` (
  `MaDiem` int NOT NULL AUTO_INCREMENT,
  `MSSV` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaLopHocPhan` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `HocKy` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `DiemChuyenCan` decimal(4,2) DEFAULT NULL,
  `DiemBaiTap` decimal(4,2) DEFAULT NULL,
  `DiemGiuaKy` decimal(4,2) DEFAULT NULL,
  `DiemCuoiKy` decimal(4,2) DEFAULT NULL,
  `DiemTong` decimal(4,2) DEFAULT NULL,
  `DiemGPA` decimal(4,2) DEFAULT NULL,
  `DiemChu` varchar(5) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `XepLoai` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`MaDiem`),
  KEY `MSSV` (`MSSV`),
  KEY `MaLopHocPhan` (`MaLopHocPhan`),
  CONSTRAINT `diem_ibfk_1` FOREIGN KEY (`MSSV`) REFERENCES `sinhvien` (`MSSV`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `diem`
--

LOCK TABLES `diem` WRITE;
/*!40000 ALTER TABLE `diem` DISABLE KEYS */;
INSERT INTO `diem` VALUES (7,'123456','IT003','HK1_2025_2026',6.00,8.00,7.00,9.00,8.05,3.50,'B+','Khá'),(8,'2380610573','IT001','HK1_2025_2026',10.00,10.00,6.50,8.00,8.13,3.50,'B+','Khá'),(9,'2380610574',NULL,'HK1_2025_2026',NULL,NULL,8.50,8.50,NULL,NULL,NULL,NULL),(10,'2380610576',NULL,'HK2_2025_2026',NULL,NULL,8.00,5.00,NULL,NULL,NULL,NULL),(11,'123456','IT001','HK2_2025_2026',10.00,8.00,8.00,9.00,8.70,4.00,'A','Giỏi'),(12,'2380610573',NULL,'HK1_2025_2026',5.00,0.00,8.00,5.00,5.00,1.50,'D+','Trung bình yếu'),(13,'2380610574','IT001','HK1_2025_2026',10.00,2.00,5.00,10.00,7.55,3.00,'B','Khá'),(14,'123456','IT004','HK1_2025_2026',8.00,4.00,6.00,7.00,6.40,2.50,'C+','Trung bình'),(16,'00123456789','LTDD01','HK2_2025_2026',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(17,'2380610573','LTDD01','HK2_2025_2026',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(18,'2380610574','LTDD01','HK2_2025_2026',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(19,'2380610575','LTDD01','HK2_2025_2026',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(20,'2380610576','LTDD01','HK2_2025_2026',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(21,'00123456789','LTDD01','HK2_2025_2026',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(22,'2380610573','LTDD01','HK2_2025_2026',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(23,'2380610574','LTDD01','HK2_2025_2026',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(24,'2380610575','LTDD01','HK2_2025_2026',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(25,'2380610576','LTDD01','HK2_2025_2026',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(26,'00123456789','LTDD01','HK2_2025_2026',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(27,'2380610573','LTDD01','HK2_2025_2026',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(28,'2380610574','LTDD01','HK2_2025_2026',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(29,'2380610575','LTDD01','HK2_2025_2026',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(30,'2380610576','LTDD01','HK2_2025_2026',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(31,'123456','IT004','HK1_2025_2026',10.00,10.00,9.00,9.00,9.25,4.00,'A','Giỏi');
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
  `MaLichHoc` int NOT NULL,
  `MSSV` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `NgayDiemDanh` date NOT NULL,
  `TrangThai` enum('Có mặt','Vắng mặt','Có phép') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`MaDiemDanh`),
  KEY `MaLichHoc` (`MaLichHoc`),
  KEY `MSSV` (`MSSV`),
  CONSTRAINT `diemdanh_ibfk_1` FOREIGN KEY (`MaLichHoc`) REFERENCES `lichhoc` (`MaLichHoc`) ON DELETE CASCADE,
  CONSTRAINT `diemdanh_ibfk_2` FOREIGN KEY (`MSSV`) REFERENCES `sinhvien` (`MSSV`) ON DELETE CASCADE
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
-- Table structure for table `giangvien`
--

DROP TABLE IF EXISTS `giangvien`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `giangvien` (
  `MaGiangVien` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `HoTen` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `SoDienThoai` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MaKhoa` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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
INSERT INTO `giangvien` VALUES ('GV001','TS. Nguyễn Hữu A','nha@truong.edu.vn','0901111111','CNTT'),('GV002','ThS. Trần Thị B','ttb@truong.edu.vn','0902222222','CNTT'),('GV003','Nguyễn Văn B','b@gmail.com','099992288','CNTT');
/*!40000 ALTER TABLE `giangvien` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `khoa`
--

DROP TABLE IF EXISTS `khoa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `khoa` (
  `MaKhoa` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenKhoa` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`MaKhoa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `khoa`
--

LOCK TABLES `khoa` WRITE;
/*!40000 ALTER TABLE `khoa` DISABLE KEYS */;
INSERT INTO `khoa` VALUES ('CNTT','Công nghệ Thông tin'),('KT','Kinh tế - Tài chính');
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
  `MaLopHocPhan` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NgayHoc` date DEFAULT NULL,
  `CaHoc` int DEFAULT NULL,
  `PhongHoc` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`MaLichHoc`),
  KEY `MaLopHocPhan` (`MaLopHocPhan`),
  CONSTRAINT `lichhoc_ibfk_1` FOREIGN KEY (`MaLopHocPhan`) REFERENCES `lophocphan` (`MaLopHocPhan`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lichhoc`
--

LOCK TABLES `lichhoc` WRITE;
/*!40000 ALTER TABLE `lichhoc` DISABLE KEYS */;
INSERT INTO `lichhoc` VALUES (1,'PL-001','2026-05-30',1,'E-2222'),(2,'PT','2026-05-30',4,'E3-123'),(3,'PL-001','2026-05-31',2,'E1-01-1');
/*!40000 ALTER TABLE `lichhoc` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lophoc`
--

DROP TABLE IF EXISTS `lophoc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lophoc` (
  `MaLop` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenLop` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaKhoa` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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
INSERT INTO `lophoc` VALUES ('123123','23DTHB9','CNTT'),('23DTH1','Kỹ thuật phần mềm 1','CNTT'),('23DTH2','An toàn thông tin 1','CNTT');
/*!40000 ALTER TABLE `lophoc` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lophocphan`
--

DROP TABLE IF EXISTS `lophocphan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lophocphan` (
  `MaLopHocPhan` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaMonHoc` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MaLop` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MaGiangVien` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `HocKy` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NamHoc` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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
INSERT INTO `lophocphan` VALUES ('LTDD01','IT001','123123','GV002','HK2_2025_2026','2025-2026',35),('PL-001','IT004','123123','GV001','HK1_2025_2026','2025-2026',25),('PT','IT002','123123','GV001','HK2_2025_2026','2025-2026',40);
/*!40000 ALTER TABLE `lophocphan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `monhoc`
--

DROP TABLE IF EXISTS `monhoc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `monhoc` (
  `MaMonHoc` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenMonHoc` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `SoTinChi` int NOT NULL,
  PRIMARY KEY (`MaMonHoc`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `monhoc`
--

LOCK TABLES `monhoc` WRITE;
/*!40000 ALTER TABLE `monhoc` DISABLE KEYS */;
INSERT INTO `monhoc` VALUES ('IT001','Lập trình ứng dụng di động (Flutter)',3),('IT002','Phân tích thiết kế hệ thống',3),('IT003','Bảo mật cơ sở dữ liệu',3),('IT004','Pháp Luật',3);
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
  `MSSV` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `FileUrl` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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
  `MaGiangVien` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MaMonHoc` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MaLop` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `HocKy` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`MaPhanCong`),
  KEY `MaGiangVien` (`MaGiangVien`),
  KEY `MaMonHoc` (`MaMonHoc`),
  KEY `MaLop` (`MaLop`),
  CONSTRAINT `phanconggiangday_ibfk_1` FOREIGN KEY (`MaGiangVien`) REFERENCES `giangvien` (`MaGiangVien`),
  CONSTRAINT `phanconggiangday_ibfk_2` FOREIGN KEY (`MaMonHoc`) REFERENCES `monhoc` (`MaMonHoc`),
  CONSTRAINT `phanconggiangday_ibfk_3` FOREIGN KEY (`MaLop`) REFERENCES `lophoc` (`MaLop`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phanconggiangday`
--

LOCK TABLES `phanconggiangday` WRITE;
/*!40000 ALTER TABLE `phanconggiangday` DISABLE KEYS */;
INSERT INTO `phanconggiangday` VALUES (1,'GV001','IT001','23DTH1','HK1_2025_2026'),(2,'GV002','IT002','23DTH1','HK1_2025_2026'),(3,'GV002','IT001','23DTH1','HK1_2025_2026');
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
  `TenQuyen` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`MaQuyen`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phanquyen`
--

LOCK TABLES `phanquyen` WRITE;
/*!40000 ALTER TABLE `phanquyen` DISABLE KEYS */;
INSERT INTO `phanquyen` VALUES (1,'Admin'),(2,'Giảng viên'),(3,'Sinh viên');
/*!40000 ALTER TABLE `phanquyen` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sinhvien`
--

DROP TABLE IF EXISTS `sinhvien`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sinhvien` (
  `MSSV` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `HoTen` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `NgaySinh` date DEFAULT NULL,
  `GioiTinh` enum('Nam','Nữ') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `SoDienThoai` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MaLop` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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
INSERT INTO `sinhvien` VALUES ('00123456789','Nguyễn Văn Nam','2004-05-12','Nam','nam@truong.edu.vn','0912345678','23DTH1'),('123456','Nguyễn Văn C','2004-05-10','Nam','nam@btruong.edu.vn','0912345688','123123'),('2380610573','Nguyễn Văn Toàn','2004-08-15','Nam','toan@truong.edu.vn','0911111111','23DTH1'),('2380610574','Lê Hải Điền','2004-02-22','Nam','dien@truong.edu.vn','0922222222','23DTH1'),('2380610575','Trần Mỹ Duyên','2004-11-03','Nữ','duyen@truong.edu.vn','0933333333','23DTH1'),('2380610576','Phạm Tú Uyên','2004-12-04','Nữ','uyen@truong.edu.vn','0944444444','23DTH1');
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
  `TieuDe` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Loai` enum('Tài liệu','Bài tập') COLLATE utf8mb4_unicode_ci NOT NULL,
  `FileUrl` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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
-- Table structure for table `thongbao`
--

DROP TABLE IF EXISTS `thongbao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `thongbao` (
  `MaThongBao` int NOT NULL AUTO_INCREMENT,
  `TieuDe` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `NoiDung` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `NguoiTao` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaLop_Nhan` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NgayTao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`MaThongBao`),
  KEY `NguoiTao` (`NguoiTao`),
  KEY `MaLop_Nhan` (`MaLop_Nhan`),
  CONSTRAINT `thongbao_ibfk_1` FOREIGN KEY (`NguoiTao`) REFERENCES `users` (`TaiKhoan`),
  CONSTRAINT `thongbao_ibfk_2` FOREIGN KEY (`MaLop_Nhan`) REFERENCES `lophoc` (`MaLop`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `thongbao`
--

LOCK TABLES `thongbao` WRITE;
/*!40000 ALTER TABLE `thongbao` DISABLE KEYS */;
/*!40000 ALTER TABLE `thongbao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `TaiKhoan` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaQuyen` int NOT NULL,
  `NgayTao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
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
INSERT INTO `users` VALUES ('00123456789','$2b$10$NXxsISkdDyVWcrVgj1DAT.1V2CD5O.KpCVvVlQGBr.oIH0i1XCKoW',3,'2026-05-27 03:19:34'),('123456','$2b$10$NXxsISkdDyVWcrVgj1DAT.1V2CD5O.KpCVvVlQGBr.oIH0i1XCKoW',3,'2026-05-27 03:33:32'),('2380610573','$2b$10$NXxsISkdDyVWcrVgj1DAT.1V2CD5O.KpCVvVlQGBr.oIH0i1XCKoW',3,'2026-05-27 03:19:34'),('2380610574','$2b$10$NXxsISkdDyVWcrVgj1DAT.1V2CD5O.KpCVvVlQGBr.oIH0i1XCKoW',3,'2026-05-27 03:19:34'),('2380610575','$2b$10$NXxsISkdDyVWcrVgj1DAT.1V2CD5O.KpCVvVlQGBr.oIH0i1XCKoW',3,'2026-05-27 03:19:34'),('2380610576','$2b$10$NXxsISkdDyVWcrVgj1DAT.1V2CD5O.KpCVvVlQGBr.oIH0i1XCKoW',3,'2026-05-27 03:19:34'),('admin','$2b$10$3SkSOiEaJ8YFrBVLDbwCp.NTMrU6Rrq8gLrdgSV8.PxlVQ4tmrQIu',1,'2026-05-27 03:19:34'),('GV001','$2b$10$wFUSrEx9Ek1Nyn1qMwUFfetWGIz9ic6zyPDUK3jN73KnPFgjlxr0a',2,'2026-05-27 03:19:34'),('GV002','$2b$10$wFUSrEx9Ek1Nyn1qMwUFfetWGIz9ic6zyPDUK3jN73KnPFgjlxr0a',2,'2026-05-27 03:19:34'),('GV003','$2b$10$wFUSrEx9Ek1Nyn1qMwUFfetWGIz9ic6zyPDUK3jN73KnPFgjlxr0a',2,'2026-05-28 06:44:43');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-29 16:20:27
