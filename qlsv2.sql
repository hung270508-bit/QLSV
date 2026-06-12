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

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '4585fac6-63de-11f1-981c-06b3c0baae58:1-111,
e51c4a2a-63f7-11f1-9ad9-ee12a9ba2a33:1-582';

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
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `diem`
--

LOCK TABLES `diem` WRITE;
/*!40000 ALTER TABLE `diem` DISABLE KEYS */;
INSERT INTO `diem` VALUES (1,'24120001','AN002.HK22324.HP01','HK1_2025_2026',9.00,7.00,8.00,8.00,7.95,3.50,'B+','Khá'),(2,'24120001','AN001.HK22526.HP01','HK2_2025_2026',9.00,9.00,9.00,9.00,9.00,4.00,'A','Giỏi'),(3,'24120001','AN002.HK22324.HP01','HK1_2025_2026',8.00,8.00,8.00,8.00,8.00,3.50,'B+','Khá'),(8,'25110001','MTVTN001.HK22526.HP01','HK2_2025_2026',9.00,9.00,9.00,9.00,9.00,4.00,'A','Giỏi'),(9,'25110001','MTVTN001.HK22526.HP01','HK2_2025_2026',9.00,9.00,9.00,9.00,9.00,4.00,'A','Giỏi'),(10,'23130005','CNTT001.HK22526.HP01','HK2_2025_2026',9.00,9.00,9.00,9.00,9.00,4.00,'A','Giỏi');
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
  PRIMARY KEY (`MaDotDanhGia`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dot_danhgia`
--

LOCK TABLES `dot_danhgia` WRITE;
/*!40000 ALTER TABLE `dot_danhgia` DISABLE KEYS */;
INSERT INTO `dot_danhgia` VALUES (1,'HK2_2025_2026','2025-2026','2026-06-10','2026-06-14','Đã đóng đợt'),(2,'HK1_2025_2026','2025-2026','2026-06-10','2026-06-17','Đang tự đánh giá');
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
INSERT INTO `giangvien` VALUES ('GVAN001','Phan Việt Anh','va@gmail.com','0987456321','AN','Tạm nghỉ'),('GVAN002','Lý Tuân Trọng','ttrong@gmail.com','0985623896','AN','Đang dạy'),('GVCK001','Phùng Thanh Thanh','thanh@gmail.com','0985623122','CK','Đang dạy'),('GVCNTT001','Mã Giám Sinh','magiamsinh@gmail.com','0969278499','CNTT','Đang dạy'),('GVCNTT002','Nguyễn Thị Thư','T@gmail.com','0987654322','CNTT','Tạm nghỉ'),('GVCNTT003','Nguyễn Thị Na','Ta@gmail.com','0987654311','CNTT','Tạm nghỉ'),('GVMTVTN001','Nguyễn Phúc Minh','minh@gmail.com','0784484848','MTVTN','Đang dạy');
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
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `khoa`
--

LOCK TABLES `khoa` WRITE;
/*!40000 ALTER TABLE `khoa` DISABLE KEYS */;
INSERT INTO `khoa` VALUES (12,'AN','Âm Nhạc'),(4,'CK','Cơ Khí'),(13,'CNTT','Công Nghệ Thông Tin'),(6,'CNVL','Công Nghệ Vật Liệu'),(2,'DDT','Điện - Điện Tử'),(7,'KHUD','Khoa Học Ứng Dụng'),(5,'KHVKTMΤ','Khoa Học Và Kỹ Thuật Máy Τính'),(10,'KTDCVDK','Kỹ Thuật Địa Chất Và Dầu Khí'),(8,'KTGT','Kỹ Thuật Giao Thông'),(1,'KTHH','Kỹ Thuật Hóa Học'),(3,'KTXD','Kỹ Thuật Xây Dựng'),(11,'MTVTN','Môi Trường Và Tài Nguyên'),(9,'QLCN','Quản Lý Công Nghiệp');
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
  `CaHoc` int DEFAULT NULL,
  `PhongHoc` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`MaLichHoc`),
  KEY `MaLopHocPhan` (`MaLopHocPhan`),
  CONSTRAINT `lichhoc_ibfk_1` FOREIGN KEY (`MaLopHocPhan`) REFERENCES `lophocphan` (`MaLopHocPhan`)
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lichhoc`
--

LOCK TABLES `lichhoc` WRITE;
/*!40000 ALTER TABLE `lichhoc` DISABLE KEYS */;
INSERT INTO `lichhoc` VALUES (1,'AN001.HK22526.HP01','2026-07-18',2,'HA0202'),(2,'AN001.HK22526.HP01','2026-08-01',2,'HA0202'),(3,'AN001.HK22526.HP01','2026-06-20',2,'HA0202'),(4,'AN001.HK22526.HP01','2026-07-04',2,'HA0202'),(5,'AN001.HK22526.HP01','2026-07-11',2,'HA0202'),(6,'AN001.HK22526.HP01','2026-07-25',2,'HA0202'),(7,'AN001.HK22526.HP01','2026-06-13',2,'HA0202'),(8,'AN001.HK22526.HP01','2026-08-08',2,'HA0202'),(9,'AN001.HK22526.HP01','2026-06-27',2,'HA0202'),(10,'AN001.HK22526.HP01','2026-08-15',2,'HA0202'),(11,'AN002.HK22324.HP01','2026-07-02',3,'HA0901'),(12,'AN002.HK22324.HP01','2026-07-09',3,'HA0901'),(13,'AN002.HK22324.HP01','2026-08-06',3,'HA0901'),(14,'AN002.HK22324.HP01','2026-07-30',3,'HA0901'),(15,'AN002.HK22324.HP01','2026-08-27',3,'HA0901'),(16,'AN002.HK22324.HP01','2026-06-18',3,'HA0901'),(17,'AN002.HK22324.HP01','2026-08-20',3,'HA0901'),(18,'AN002.HK22324.HP01','2026-06-25',3,'HA0901'),(19,'AN002.HK22324.HP01','2026-08-13',3,'HA0901'),(20,'AN002.HK22324.HP01','2026-07-16',3,'HA0901'),(21,'AN002.HK22324.HP01','2026-07-23',3,'HA0901'),(22,'MTVTN001.HK22526.HP01','2026-08-27',3,'HB0505'),(23,'MTVTN001.HK22526.HP01','2026-06-18',3,'HB0505'),(24,'MTVTN001.HK22526.HP01','2026-07-23',3,'HB0505'),(25,'MTVTN001.HK22526.HP01','2026-07-16',3,'HB0505'),(26,'MTVTN001.HK22526.HP01','2026-07-30',3,'HB0505'),(27,'MTVTN001.HK22526.HP01','2026-08-20',3,'HB0505'),(28,'MTVTN001.HK22526.HP01','2026-07-02',3,'HB0505'),(29,'MTVTN001.HK22526.HP01','2026-08-06',3,'HB0505'),(30,'MTVTN001.HK22526.HP01','2026-08-13',3,'HB0505'),(31,'MTVTN001.HK22526.HP01','2026-07-09',3,'HB0505'),(32,'MTVTN001.HK22526.HP01','2026-06-25',3,'HB0505'),(33,'CNTT001.HK22526.HP01','2026-08-19',3,'B21'),(34,'CNTT001.HK22526.HP01','2026-07-08',3,'B21'),(35,'CNTT001.HK22526.HP01','2026-07-15',3,'B21'),(36,'CNTT001.HK22526.HP01','2026-08-12',3,'B21'),(37,'CNTT001.HK22526.HP01','2026-07-22',3,'B21'),(38,'CNTT001.HK22526.HP01','2026-06-24',3,'B21'),(39,'CNTT001.HK22526.HP01','2026-07-29',3,'B21'),(40,'CNTT001.HK22526.HP01','2026-09-16',3,'B21'),(41,'CNTT001.HK22526.HP01','2026-06-17',3,'B21'),(42,'CNTT001.HK22526.HP01','2026-07-01',3,'B21'),(43,'CNTT001.HK22526.HP01','2026-08-26',3,'B21'),(44,'CNTT001.HK22526.HP01','2026-08-05',3,'B21'),(45,'CNTT001.HK22526.HP01','2026-09-09',3,'B21'),(46,'CNTT001.HK22526.HP01','2026-09-02',1,'B22'),(47,'AN003.HK32627.HP01','2026-07-22',1,'E-0101'),(48,'AN003.HK32627.HP01','2026-06-24',1,'E-0101'),(49,'AN003.HK32627.HP01','2026-06-17',1,'E-0101'),(50,'AN003.HK32627.HP01','2026-07-08',1,'E-0101'),(51,'AN003.HK32627.HP01','2026-07-15',1,'E-0101'),(52,'AN003.HK32627.HP01','2026-06-10',1,'E-0101'),(53,'AN003.HK32627.HP01','2026-07-01',1,'E-0101'),(54,'CK002.HK22526.HP01','2026-09-10',3,'HA0902'),(55,'CK002.HK22526.HP01','2026-09-24',3,'HA0902'),(56,'CK002.HK22526.HP01','2026-08-20',3,'HA0902'),(57,'CK002.HK22526.HP01','2026-08-27',3,'HA0902'),(58,'CK002.HK22526.HP01','2026-08-13',3,'HA0902'),(59,'CK002.HK22526.HP01','2026-09-17',3,'HA0902'),(60,'CK002.HK22526.HP01','2026-09-03',3,'HA0902');
/*!40000 ALTER TABLE `lichhoc` ENABLE KEYS */;
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
INSERT INTO `lophoc` VALUES ('23CNTT1','23DTHB1','CNTT','2023-2027'),('23CNTT2','23DTHB2','CNTT','2023-2027'),('24AN1','ANCB1','AN','2024-2028'),('24CNTT1','24DTHB1','CNTT','2024-2028'),('24KHUD1','24KHUDA1','KHUD','2024-2028'),('25AN1','ANNC1','AN','2025-2029'),('25CK1','CK1','CK','2025-2029'),('25MTVTN1','MTVTN1','MTVTN','2025-2029');
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
INSERT INTO `lophocphan` VALUES ('AN001.HK22526.HP01','AN001','24AN1','GVAN001','HK2_2025_2026','2025-2026',40),('AN002.HK12324.HP01','AN002','23CNTT1','GVCNTT002','HK1_2023_2024','2023-2024',40),('AN002.HK22324.HP01','AN002','25AN1','GVAN002','HK2_2023_2024','2023-2024',40),('AN003.HK32627.HP01','AN003','23CNTT1','GVCNTT003','HK3_2026_2027','2026-2027',40),('CK002.HK22526.HP01','CK002','25CK1','GVCK001','HK2_2025_2026','2025-2026',77),('CNTT001.HK22122.HP01','CNTT001','23CNTT1','GVCNTT001','HK2_2021_2022','2021-2022',40),('CNTT001.HK22526.HP01','CNTT001','23CNTT1','GVCNTT001','HK2_2025_2026','2025-2026',40),('MTVTN001.HK22526.HP01','MTVTN001','25MTVTN1','GVMTVTN001','HK2_2025_2026','2025-2026',85),('MTVTN001.HK22627.HP01','AN003','25MTVTN1','GVMTVTN001','HK2_2026_2027','2026-2027',40);
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
INSERT INTO `monhoc` VALUES ('AN001','Âm Nhạc Cơ Bản',2,NULL),('AN002','Âm Nhạc Nâng Cao',2,NULL),('AN003','Thanh Nhạc',2,NULL),('CK001','Điện Lạnh',3,NULL),('CK002','Cơ Học Kỹ Thuật',3,NULL),('CNTT001','Cơ Sở Dữ Liệu',4,NULL),('MTVTN001','Hóa Học Môi Trường',3,NULL);
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
  `MSSV` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `HoTen` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `NgaySinh` date DEFAULT NULL,
  `GioiTinh` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `SoDienThoai` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MaLop` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `TrangThai` enum('Đang học','Học lại','Nghỉ học') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Đang học',
  `MaKhoa` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`MSSV`),
  KEY `MaLop` (`MaLop`),
  KEY `fk_sinhvien_khoa` (`MaKhoa`),
  CONSTRAINT `fk_sinhvien_khoa` FOREIGN KEY (`MaKhoa`) REFERENCES `khoa` (`MaKhoa`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `sinhvien_ibfk_1` FOREIGN KEY (`MSSV`) REFERENCES `users` (`TaiKhoan`) ON DELETE CASCADE,
  CONSTRAINT `sinhvien_ibfk_2` FOREIGN KEY (`MaLop`) REFERENCES `lophoc` (`MaLop`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sinhvien`
--

LOCK TABLES `sinhvien` WRITE;
/*!40000 ALTER TABLE `sinhvien` DISABLE KEYS */;
INSERT INTO `sinhvien` VALUES ('23130001','Nguyễn Văn Toàn','2005-06-10','Nữ','toanpham2005pr@gmail.com','0987654321','23CNTT2','Đang học',NULL),('23130002','Nguyễn Thị C','2006-06-10','Nữ','C@gmail.com','0987654312','23CNTT1','Đang học',NULL),('23130003','Nguyễn Thị Văn','2006-07-30','','V@gmail.com','0987654123','23CNTT2','Đang học',NULL),('23130005','Nguyễn Thế Vinh','2004-11-11','Nam','vinhnguyen5859@gmail.com','0932626719','23CNTT1','Đang học',NULL),('24120001','Nguyễn Lan Chi','2005-02-20','Nữ','chi@gmail.com','0988898951','24AN1','Đang học',NULL),('25040001','Lâm Tùng Quốc','2006-05-09','','quoc@gmail.com','0985623234','25CK1','Đang học',NULL),('25040002','Lò Văn Tôn','2006-05-06','','ton@gmail.com','0985632147','25CK1','Đang học',NULL),('25110001','Nguyễn Khải Vi Huyền','2007-03-06','Nữ','vhuyen@gmail.com','0987456321','25MTVTN1','Đang học',NULL);
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
INSERT INTO `thongbao` VALUES (1,'Có thay đổi về lịch học phần','Lớp HA0202 tuần này sẽ dời sang lớp HA0205','admin','24AN1','2026-06-11 01:34:50'),(2,'Nghỉ học','Lớp  sẽ nghỉ tuần này','admin','24AN1','2026-06-11 07:37:39'),(3,'Nghỉ học','Lớp  sẽ nghỉ tuần này','admin','25AN1','2026-06-11 07:37:39'),(4,'Tạm ngưng học','Đình chỉ học Nguyễn Văn Toàn rớt môn quá tín chỉ','admin','23CNTT2','2026-06-11 09:31:41');
/*!40000 ALTER TABLE `thongbao` ENABLE KEYS */;
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
INSERT INTO `users` VALUES ('23130001','$2b$10$usMAAz.50VlXzEVzh6G04u./igKMsJj/0N0KUrE5BjRVFoqcG.qF.',3,'2026-06-10 14:44:41'),('23130002','$2b$10$8NsKQB3HCgk2Qmq8onrglOFpyjNpHySqkltPxQc5KClpvqwYNDUSS',3,'2026-06-10 14:50:29'),('23130003','$2b$10$zpZUVFZrF09vpYdSUWB8au.O3MlC8mMw.MZTCSHAZgYwsNTarO1xe',3,'2026-06-10 14:54:41'),('23130005','$2b$10$seKyiuXaQMeWBwhmxBhDBOttjHZWQrYpTLt7k6SyrAxJN17WveIK.',3,'2026-06-10 22:10:14'),('24120001','$2b$10$Cz.2Yzhjf1awA5tpwdjRZeuDtALnwPuFqdf3ND8dvHLrH1E7P/5uS',3,'2026-06-11 01:16:40'),('25040001','$2b$10$mgE7j87VaEZ1KTavVPT3a.cIqFen/2n90O68WaA/GrSTeZ/f4lE3a',3,'2026-06-11 09:25:51'),('25040002','$2b$10$i0zAnkimxpF.bKQ7U3G8iOqC7M.FUlLLzDjEbL9nk9nAxxgzKWR2W',3,'2026-06-11 09:57:27'),('25110001','$2b$10$9BXRgJymmsqr8634wzdFBeza1mmi5QjMCrIWkLv9HMcKIKtV2/eWa',3,'2026-06-11 02:10:26'),('admin','$2b$10$QhFGFeUUlIs6jT0fwa4cpuQk0sbJvc31ESr5HqOrZk.ssmU7RZsqm',1,'2026-06-10 05:08:52'),('GVAN001','$2b$10$Fju1n0z5XAj15/DfLtY7b.haYC55z8k8yo/VqUaRXpFAwFOGAnHmW',2,'2026-06-11 01:14:11'),('GVAN002','$2b$10$u1cmNYTSjkWCJMKOT0J.4.68aoCt6.l4K2j56uht3BwKuNDEYY.w6',2,'2026-06-11 01:18:38'),('GVCK001','$2b$10$6PcpxCVe26hwLdbEPQRB4OvTWP1Y/9timX3lib.a4OCMFMaVcRVji',2,'2026-06-11 09:58:40'),('GVCNTT001','$2b$10$txa4He/MJ7RvIq5MVZ/oCOQrCAqQU27di8SlDRKZuOCnbZTSWLJ1i',2,'2026-06-10 14:58:11'),('GVCNTT002','$2b$10$Hl3wh87EQKYH05lq1zR9t.9jEybAwESCf/n299uUywJYeKNAFUmC.',2,'2026-06-10 14:59:29'),('GVCNTT003','$2b$10$/E.JqQoRC5iNUFgbOn8wmuSDjE74lWmni7AT1UxuRlXtqbIJA74ii',2,'2026-06-10 14:59:30'),('GVMTVTN001','$2b$10$.iS.1ZBK07PPJawGzyrMiuOOl.iFkL9m48zOVnuq/S.4pWVC0jrB6',2,'2026-06-11 02:11:25');
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
  `LoaiYeuCau` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ChuDe` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NoiDung` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `NgayGui` datetime DEFAULT NULL,
  `TrangThai` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Đang xử lý',
  `PhanHoi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`MaYeuCau`),
  KEY `MSSV` (`MSSV`),
  CONSTRAINT `yeucau_hotro_ibfk_1` FOREIGN KEY (`MSSV`) REFERENCES `sinhvien` (`MSSV`) ON DELETE CASCADE
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

-- Dump completed on 2026-06-11 17:40:50
