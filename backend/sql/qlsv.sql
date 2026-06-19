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
e51c4a2a-63f7-11f1-9ad9-ee12a9ba2a33:1-891';

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dot_danhgia`
--

LOCK TABLES `dot_danhgia` WRITE;
/*!40000 ALTER TABLE `dot_danhgia` DISABLE KEYS */;
INSERT INTO `dot_danhgia` VALUES (1,'HK1_2025_2026','2025-2026','2026-06-15','2026-06-17','Đang tự đánh giá');
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
INSERT INTO `giangvien` VALUES ('GVDL003','Νγκουγιεν Τραν Μινχ Πεμ','batnxinhgai@gmail.com','0703007000','DL','Đang dạy'),('GVDLKS001','Á Hahahahaahaahahahahahahahahaa','batmanxinhgai@gmail.com','0900000000','DLKS','Đang dạy'),('GVDLKS002','Á Hahahahaahaahahahahahahahahaa','batmanxinhgai@gmail.com','0900000000','DLKS','Đang dạy'),('GVL001','Ouijijsinvnav Auvjsoivno Hiuhogvjsp Àuoifjfoai Hfvushuoisjgvjd','batmanxingai@gmail.com','0705588842','L','Đang dạy'),('GVL002','Ouijijsinvnav Auvjsoivno Hiuhogvjsp Àuoifjfoai Hfvushuoisjgvjd','batmanxingai@gmail.com','0705588842','L','Đang dạy'),('GVQTKD001','Νγκουγιεν Τραν Μινχ Πεμ','batmanxhgai@gmail.com','0909876331','QTKD','Đang dạy');
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `khoa`
--

LOCK TABLES `khoa` WRITE;
/*!40000 ALTER TABLE `khoa` DISABLE KEYS */;
INSERT INTO `khoa` VALUES (1,'CNTT','Công Nghệ Thông Tin'),(8,'CTS','Chú Thuật Sư'),(5,'DL','Động Lực'),(4,'DLKS','Du lịch - khách sạn'),(2,'L','Luật'),(7,'MT','Môi Trường'),(6,'NNT','Ngôn Ngữ Trung'),(3,'QTKD','Quản trị kinh doanh');
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
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lichhoc`
--

LOCK TABLES `lichhoc` WRITE;
/*!40000 ALTER TABLE `lichhoc` DISABLE KEYS */;
INSERT INTO `lichhoc` VALUES (1,'DLKS002.HK22627.HP01','1250-05-11',3,'B-0202'),(2,'DLKS002.HK22627.HP01','1250-06-15',3,'B-0202'),(3,'DLKS002.HK22627.HP01','1250-09-14',3,'B-0202'),(4,'DLKS002.HK22627.HP01','1250-09-28',3,'B-0202'),(5,'DLKS002.HK22627.HP01','1250-07-13',3,'B-0202'),(6,'DLKS002.HK22627.HP01','1250-10-05',3,'B-0202'),(7,'DLKS002.HK22627.HP01','1250-06-01',3,'B-0202'),(8,'DLKS002.HK22627.HP01','1250-07-27',3,'B-0202'),(9,'DLKS002.HK22627.HP01','1250-11-02',3,'B-0202'),(10,'DLKS002.HK22627.HP01','1250-07-06',3,'B-0202'),(11,'DLKS002.HK22627.HP01','1250-11-09',3,'B-0202'),(12,'DLKS002.HK22627.HP01','1250-08-31',3,'B-0202'),(13,'DLKS002.HK22627.HP01','1250-08-10',3,'B-0202'),(14,'DLKS002.HK22627.HP01','1250-06-08',3,'B-0202'),(15,'DLKS002.HK22627.HP01','1250-10-19',3,'B-0202'),(16,'DLKS002.HK22627.HP01','1250-06-22',3,'B-0202'),(17,'DLKS002.HK22627.HP01','1250-09-07',3,'B-0202'),(18,'DLKS002.HK22627.HP01','1250-09-21',3,'B-0202'),(19,'DLKS002.HK22627.HP01','1250-10-26',3,'B-0202'),(20,'DLKS002.HK22627.HP01','1250-08-17',3,'B-0202'),(21,'DLKS002.HK22627.HP01','1250-05-25',3,'B-0202'),(22,'DLKS002.HK22627.HP01','1250-08-24',3,'B-0202'),(23,'DLKS002.HK22627.HP01','1250-06-29',3,'B-0202'),(24,'DLKS002.HK22627.HP01','1250-10-12',3,'B-0202'),(25,'DLKS002.HK22627.HP01','1250-08-03',3,'B-0202'),(26,'DLKS002.HK22627.HP01','1250-05-18',3,'B-0202'),(27,'DLKS002.HK22627.HP01','1250-07-20',3,'B-0202'),(28,'DLKS002.HK22627.HP02','2515-06-26',3,'B-0202'),(29,'DLKS002.HK22627.HP02','2515-05-29',3,'B-0202'),(30,'DLKS002.HK22627.HP02','2515-05-08',3,'B-0202'),(31,'DLKS002.HK22627.HP02','2515-07-03',3,'B-0202'),(32,'DLKS002.HK22627.HP02','2515-07-31',3,'B-0202'),(33,'DLKS002.HK22627.HP02','2515-07-24',3,'B-0202'),(34,'DLKS002.HK22627.HP02','2515-10-30',3,'B-0202'),(35,'DLKS002.HK22627.HP02','2515-08-21',3,'B-0202'),(36,'DLKS002.HK22627.HP02','2515-09-04',3,'B-0202'),(37,'DLKS002.HK22627.HP02','2515-05-15',3,'B-0202'),(38,'DLKS002.HK22627.HP02','2515-10-09',3,'B-0202'),(39,'DLKS002.HK22627.HP02','2515-09-25',3,'B-0202'),(40,'DLKS002.HK22627.HP02','2515-10-02',3,'B-0202'),(41,'DLKS002.HK22627.HP02','2515-09-18',3,'B-0202'),(42,'DLKS002.HK22627.HP02','2515-05-22',3,'B-0202'),(43,'DLKS002.HK22627.HP02','2515-10-16',3,'B-0202'),(44,'DLKS002.HK22627.HP02','2515-08-28',3,'B-0202'),(45,'DLKS002.HK22627.HP02','2515-09-11',3,'B-0202'),(46,'DLKS002.HK22627.HP02','2515-06-12',3,'B-0202'),(47,'DLKS002.HK22627.HP02','2515-06-19',3,'B-0202'),(48,'DLKS002.HK22627.HP02','2515-08-14',3,'B-0202'),(49,'DLKS002.HK22627.HP02','2515-06-05',3,'B-0202'),(50,'DLKS002.HK22627.HP02','2515-07-10',3,'B-0202'),(51,'DLKS002.HK22627.HP02','2515-10-23',3,'B-0202'),(52,'DLKS002.HK22627.HP02','2515-08-07',3,'B-0202'),(53,'DLKS002.HK22627.HP02','2515-07-17',3,'B-0202'),(54,'DLKS002.HK22627.HP02','2515-05-01',3,'B-0202'),(55,'DLKS002.HK22627.HP01','1414-02-21',3,'B-0202'),(56,'DLKS002.HK22627.HP02','3068-10-30',3,'C-0101'),(57,'DLKS002.HK22627.HP02','2025-07-07',2,'B-0202'),(58,'DLKS002.HK22627.HP01','5151-11-25',1,'B-0202');
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
INSERT INTO `lophoc` VALUES ('23CNTT1','DTHA 1','CNTT','2023-2027'),('23CNTT2','DTHA 2','CNTT','2023-2027'),('23CTS1','Cách Triển Khai Lãnh Địa','CTS','2023-2027'),('25CNTT1','CNTT','CNTT','2025-2029'),('25CNTT2','CNTT1','CNTT','2025-2029'),('26DL1','KT 1','DL','2026-2030'),('26DL2','KT 2','DL','2026-2030');
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
INSERT INTO `lophocphan` VALUES ('DLKS002.HK22627.HP01','DLKS002','25CNTT1','GVDLKS001','HK2_2026_2027','2026-2027',40),('DLKS002.HK22627.HP02','DLKS002','25CNTT2','GVDLKS001','HK2_2026_2027','2026-2027',40);
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
INSERT INTO `monhoc` VALUES ('CNTT002','Mạng Máy Tính',3,NULL),('CNTT003','Di động',3,NULL),('CNTT004','Công Nghệ Phần Mềm',3,NULL),('CTS001','Domain Expansion',5,'CTS'),('DLKS001','Quản Trị Du Lịch',3,NULL),('DLKS002','bjhbhjbhbjhv vgvjbhbhguyh hbjh',9,'DLKS'),('L001','Luật Kinh Tế',3,NULL),('MT001','guhbuyhuyvgtvvvvvvvvvvvvvvvvv',5,'MT');
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
INSERT INTO `sinhvien` VALUES ('23010001','lò thị tôn ','2006-06-15','Nam','nguyenthitraidung@gmail.com','0932672705','23CNTT2','Đang học'),('23010002','VỤBJH            B','1970-12-05','Nam','nguyenthitraidug@gmail.com','0932672707','23CNTT2','Đang học'),('25010001','Đặng Nguyễn Quốc Hùng','2008-07-15','Nam','maxx270508@gmail.com','0932762774','25CNTT1','Đang học'),('26050001','Ινχ Πεμνγκουγιεν Τραν Μινχ Πεμνγκουγιεν Τραν Μινχ Πεμνγκουγιεν Τραν Μινχ Πεμkmn','2010-11-14','Nam','batxinhgai@gmail.com','0808808008','26DL1','Đang học');
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
INSERT INTO `users` VALUES ('23010001','$2b$10$iPCZvJnmQ0/g0k9yw7ltvuAmjJqR7i9SBzB4.kamxvAykxnuCYiPC',3,'2026-06-15 06:02:59'),('23010002','$2b$10$kpDGMuupcSHrTDjzEfuROOn6Hnsj1hmwfToxTtpvCPXHt6Xuw4JtO',3,'2026-06-15 06:47:26'),('25010001','$2b$10$KusKe2C6LPWQJqv7nztu5O1RJfVnnvcxIwuPU/DRx3XFGVPsIR5G2',3,'2026-06-15 09:34:02'),('26050001','$2b$10$I/QhESkB5xl5bFChzmDo2uy8QE2rfkIT8983uog388Ag4igTOyQIa',3,'2026-06-15 09:21:05'),('admin','admin@123',1,'2026-06-15 05:54:23'),('GVCNTT001','$2b$10$uhCIc6iR134cQojJeXA0wectutyx/zOXwIzNl/RTfVn.ENava2O0q',2,'2026-06-15 07:54:20'),('GVDL003','$2b$10$nTQdTgpcIdG8Xds0RMvKuO07nqu7/yb55Emw569XpBkH7D9ER5L32',2,'2026-06-15 08:37:41'),('GVDLKS001','$2b$10$UCagh3l5n8RJtU/5zIKf3ejNATtDp47pYD5yTYpphZdZ5vm0ZPg7u',2,'2026-06-15 07:52:32'),('GVDLKS002','$2b$10$o5HtRwQ/3RVQ9/BIN3x.lu/xMe5DYDq1I.k/E9HAir4G9QamIev6S',2,'2026-06-15 07:52:33'),('GVL001','$2b$10$1JDQ5VqmT.3oIMwGGdtF9.5lGOfWgDDFp31JyPguoIEbEqrNhm88u',2,'2026-06-15 08:18:13'),('GVL002','$2b$10$oF.GGnMzztAPLlm5xVln8OFyVG1Mn30rAY7JYS7ymCvu5AYsEwYaS',2,'2026-06-15 08:18:15'),('GVNNT001','$2b$10$S29ENdk6M.IPye7r0NKv9.Y2kMXAhZ.jvFc7MnrOb87o2dn8KSsbW',2,'2026-06-15 08:15:30'),('GVQTKD001','$2b$10$P4XQP9O.EtQAJo4ZzpMfWuzrgPrfXbwihS.hCuMxud32PZ63ZjIp2',2,'2026-06-15 08:37:19');
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

-- Dump completed on 2026-06-15 21:25:24
