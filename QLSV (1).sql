-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: qlsv
-- ------------------------------------------------------
-- Server version	9.7.0

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

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ 'd5f339bb-590b-11f1-b192-e4a8dfba5018:1-156';

--
-- Table structure for table `diem`
--

DROP TABLE IF EXISTS `diem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `diem` (
  `MaDiem` int NOT NULL AUTO_INCREMENT,
  `MSSV` varchar(20) NOT NULL,
  `MaMonHoc` varchar(20) NOT NULL,
  `HocKy` varchar(20) NOT NULL,
  `DiemQuaTrinh` decimal(4,2) DEFAULT NULL,
  `DiemGiuaKy` decimal(4,2) DEFAULT NULL,
  `DiemCuoiKy` decimal(4,2) DEFAULT NULL,
  PRIMARY KEY (`MaDiem`),
  KEY `MSSV` (`MSSV`),
  KEY `MaMonHoc` (`MaMonHoc`),
  CONSTRAINT `diem_ibfk_1` FOREIGN KEY (`MSSV`) REFERENCES `sinhvien` (`MSSV`) ON DELETE CASCADE,
  CONSTRAINT `diem_ibfk_2` FOREIGN KEY (`MaMonHoc`) REFERENCES `monhoc` (`MaMonHoc`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `diem`
--

LOCK TABLES `diem` WRITE;
/*!40000 ALTER TABLE `diem` DISABLE KEYS */;
INSERT INTO `diem` VALUES (1,'123456','IT001','HK1_2025_2026',8.50,7.00,9.00),(2,'2380610573','IT001','HK1_2025_2026',7.00,6.50,8.00),(3,'2380610574','IT002','HK1_2025_2026',9.00,8.50,8.00),(4,'123456','IT004','HK1_2025_2026',8.00,7.50,8.50),(5,'2380610575','IT001','HK1_2025_2026',9.00,8.50,9.50),(6,'2380610576','IT002','HK1_2025_2026',7.50,7.00,8.00),(7,'2380610577','IT005','HK1_2025_2026',6.00,6.50,7.00),(8,'2380610578','IT005','HK1_2025_2026',8.50,8.00,8.00),(9,'2380610579','BA001','HK1_2025_2026',7.00,8.00,7.50),(10,'2380610580','BA001','HK1_2025_2026',9.50,9.00,9.00),(11,'2380610581','EN001','HK1_2025_2026',8.00,8.50,8.50),(12,'2380610582','BA001','HK1_2025_2026',6.50,7.00,6.50),(13,'2380610583','EN001','HK1_2025_2026',9.00,9.50,9.00);
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
  `MSSV` varchar(20) NOT NULL,
  `NgayDiemDanh` date NOT NULL,
  `TrangThai` enum('Có mặt','Vắng mặt','Có phép') NOT NULL,
  PRIMARY KEY (`MaDiemDanh`),
  KEY `MaLichHoc` (`MaLichHoc`),
  KEY `MSSV` (`MSSV`),
  CONSTRAINT `diemdanh_ibfk_1` FOREIGN KEY (`MaLichHoc`) REFERENCES `lichhoc` (`MaLichHoc`) ON DELETE CASCADE,
  CONSTRAINT `diemdanh_ibfk_2` FOREIGN KEY (`MSSV`) REFERENCES `sinhvien` (`MSSV`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `diemdanh`
--

LOCK TABLES `diemdanh` WRITE;
/*!40000 ALTER TABLE `diemdanh` DISABLE KEYS */;
INSERT INTO `diemdanh` VALUES (1,1,'123456','2025-09-08','Có mặt'),(2,1,'2380610573','2025-09-08','Vắng mặt'),(3,1,'2380610574','2025-09-08','Có mặt'),(4,1,'2380610575','2025-09-08','Có phép'),(5,1,'2380610576','2025-09-08','Có mặt'),(6,2,'123456','2025-09-10','Có mặt'),(7,2,'2380610573','2025-09-10','Có mặt'),(8,2,'2380610574','2025-09-10','Vắng mặt'),(9,3,'123456','2025-09-15','Có mặt'),(10,3,'2380610575','2025-09-15','Có mặt');
/*!40000 ALTER TABLE `diemdanh` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `giangvien`
--

DROP TABLE IF EXISTS `giangvien`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `giangvien` (
  `MaGiangVien` varchar(20) NOT NULL,
  `HoTen` varchar(100) NOT NULL,
  `Email` varchar(100) DEFAULT NULL,
  `SoDienThoai` varchar(15) DEFAULT NULL,
  `MaKhoa` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`MaGiangVien`),
  KEY `MaKhoa` (`MaKhoa`),
  CONSTRAINT `giangvien_ibfk_1` FOREIGN KEY (`MaGiangVien`) REFERENCES `users` (`TaiKhoan`) ON DELETE CASCADE,
  CONSTRAINT `giangvien_ibfk_2` FOREIGN KEY (`MaKhoa`) REFERENCES `khoa` (`MaKhoa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `giangvien`
--

LOCK TABLES `giangvien` WRITE;
/*!40000 ALTER TABLE `giangvien` DISABLE KEYS */;
INSERT INTO `giangvien` VALUES ('GV001','TS. Nguyễn Hữu A','nha@truong.edu.vn','0901111111','CNTT'),('GV002','ThS. Trần Thị B','ttb@truong.edu.vn','0902222222','CNTT'),('GV003','PGS.TS. Lê Văn C','lvc@truong.edu.vn','0903333333','KT'),('GV004','ThS. Phạm Thị D','ptd@truong.edu.vn','0904444444','NN'),('GV005','TS. Hoàng Văn E','hve@truong.edu.vn','0905555555','QTKD'),('GV006','ThS. Ngô Thị F','ntf@truong.edu.vn','0906666666','CNTT'),('GV007','ThS. Bùi Văn G','bvg@truong.edu.vn','0907777777','CNTT');
/*!40000 ALTER TABLE `giangvien` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `khoa`
--

DROP TABLE IF EXISTS `khoa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `khoa` (
  `MaKhoa` varchar(20) NOT NULL,
  `TenKhoa` varchar(100) NOT NULL,
  PRIMARY KEY (`MaKhoa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `khoa`
--

LOCK TABLES `khoa` WRITE;
/*!40000 ALTER TABLE `khoa` DISABLE KEYS */;
INSERT INTO `khoa` VALUES ('CK','Cơ khí điện tử'),('CNTT','Công nghệ Thông tin'),('DTVT','Điện tử Viễn thông'),('KT','Kinh tế - Tài chính'),('NN','Ngoại ngữ'),('QTKD','Quản trị Kinh doanh'),('XD','Xây dựng');
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
  `MaPhanCong` int NOT NULL,
  `Thu` int DEFAULT NULL,
  `CaHoc` int DEFAULT NULL,
  `PhongHoc` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`MaLichHoc`),
  KEY `MaPhanCong` (`MaPhanCong`),
  CONSTRAINT `lichhoc_ibfk_1` FOREIGN KEY (`MaPhanCong`) REFERENCES `phanconggiangday` (`MaPhanCong`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lichhoc`
--

LOCK TABLES `lichhoc` WRITE;
/*!40000 ALTER TABLE `lichhoc` DISABLE KEYS */;
INSERT INTO `lichhoc` VALUES (1,1,2,1,'Phòng A1-101'),(2,2,4,3,'Phòng B2-202'),(3,3,3,1,'Phòng C1-101'),(4,4,5,2,'Phòng C2-202'),(5,5,6,4,'Phòng D1-105'),(6,6,2,3,'Phòng D2-204'),(7,7,4,1,'Phòng E1-301'),(8,8,7,2,'Phòng E2-402');
/*!40000 ALTER TABLE `lichhoc` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lophoc`
--

DROP TABLE IF EXISTS `lophoc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lophoc` (
  `MaLop` varchar(20) NOT NULL,
  `TenLop` varchar(50) NOT NULL,
  `MaKhoa` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`MaLop`),
  KEY `MaKhoa` (`MaKhoa`),
  CONSTRAINT `lophoc_ibfk_1` FOREIGN KEY (`MaKhoa`) REFERENCES `khoa` (`MaKhoa`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lophoc`
--

LOCK TABLES `lophoc` WRITE;
/*!40000 ALTER TABLE `lophoc` DISABLE KEYS */;
INSERT INTO `lophoc` VALUES ('23DTH1','Kỹ thuật phần mềm 1','CNTT'),('23DTH2','An toàn thông tin 1','CNTT'),('23KT1','Tài chính ngân hàng 1','KT'),('23KT2','Kế toán doanh nghiệp 1','KT'),('23NN1','Ngôn ngữ Anh 1','NN'),('23QT1','Quản trị kinh doanh 1','QTKD'),('24DTH1','Công nghệ phần mềm 1','CNTT'),('24DTH2','Hệ thống thông tin 1','CNTT');
/*!40000 ALTER TABLE `lophoc` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `monhoc`
--

DROP TABLE IF EXISTS `monhoc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `monhoc` (
  `MaMonHoc` varchar(20) NOT NULL,
  `TenMonHoc` varchar(100) NOT NULL,
  `SoTinChi` int NOT NULL,
  PRIMARY KEY (`MaMonHoc`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `monhoc`
--

LOCK TABLES `monhoc` WRITE;
/*!40000 ALTER TABLE `monhoc` DISABLE KEYS */;
INSERT INTO `monhoc` VALUES ('BA001','Kinh tế vi mô',3),('EN001','Tiếng Anh giao tiếp',2),('IT001','Lập trình ứng dụng di động (Flutter)',3),('IT002','Phân tích thiết kế hệ thống',3),('IT003','Bảo mật cơ sở dữ liệu',3),('IT004','Cơ sở dữ liệu',3),('IT005','Mạng máy tính',3),('IT006','Cấu trúc dữ liệu và giải thuật',3),('IT007','Trí tuệ nhân tạo',4),('MA001','Toán cao cấp A1',3);
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
  `MSSV` varchar(20) NOT NULL,
  `FileUrl` varchar(255) DEFAULT NULL,
  `ThoiGianNop` datetime DEFAULT CURRENT_TIMESTAMP,
  `Diem` decimal(4,2) DEFAULT NULL,
  PRIMARY KEY (`MaNopBai`),
  KEY `MaTaiLieu` (`MaTaiLieu`),
  KEY `MSSV` (`MSSV`),
  CONSTRAINT `nopbai_ibfk_1` FOREIGN KEY (`MaTaiLieu`) REFERENCES `tailieu_baitap` (`MaTaiLieu`) ON DELETE CASCADE,
  CONSTRAINT `nopbai_ibfk_2` FOREIGN KEY (`MSSV`) REFERENCES `sinhvien` (`MSSV`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nopbai`
--

LOCK TABLES `nopbai` WRITE;
/*!40000 ALTER TABLE `nopbai` DISABLE KEYS */;
INSERT INTO `nopbai` VALUES (1,2,'123456','/uploads/nopbai/123456_bt1.zip','2025-09-14 10:00:00',9.00),(2,2,'2380610573','/uploads/nopbai/2380610573_bt1.zip','2025-09-15 20:30:00',8.50),(3,2,'2380610574','/uploads/nopbai/2380610574_bt1.zip','2025-09-15 23:50:00',7.00),(4,4,'2380610575','/uploads/nopbai/2380610575_btl.zip','2025-10-28 14:15:00',9.50),(5,4,'2380610576','/uploads/nopbai/2380610576_btl.zip','2025-10-30 09:45:00',8.00),(6,6,'2380610577','/uploads/nopbai/2380610577_tcpip.pdf','2025-09-19 21:00:00',8.50);
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
  `MaGiangVien` varchar(20) DEFAULT NULL,
  `MaMonHoc` varchar(20) DEFAULT NULL,
  `MaLop` varchar(20) DEFAULT NULL,
  `HocKy` varchar(20) NOT NULL,
  PRIMARY KEY (`MaPhanCong`),
  KEY `MaGiangVien` (`MaGiangVien`),
  KEY `MaMonHoc` (`MaMonHoc`),
  KEY `MaLop` (`MaLop`),
  CONSTRAINT `phanconggiangday_ibfk_1` FOREIGN KEY (`MaGiangVien`) REFERENCES `giangvien` (`MaGiangVien`),
  CONSTRAINT `phanconggiangday_ibfk_2` FOREIGN KEY (`MaMonHoc`) REFERENCES `monhoc` (`MaMonHoc`),
  CONSTRAINT `phanconggiangday_ibfk_3` FOREIGN KEY (`MaLop`) REFERENCES `lophoc` (`MaLop`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phanconggiangday`
--

LOCK TABLES `phanconggiangday` WRITE;
/*!40000 ALTER TABLE `phanconggiangday` DISABLE KEYS */;
INSERT INTO `phanconggiangday` VALUES (1,'GV001','IT001','23DTH1','HK1_2025_2026'),(2,'GV002','IT002','23DTH1','HK1_2025_2026'),(3,'GV001','IT004','23DTH1','HK1_2025_2026'),(4,'GV002','IT005','23DTH2','HK1_2025_2026'),(5,'GV003','BA001','23KT1','HK1_2025_2026'),(6,'GV004','EN001','23NN1','HK1_2025_2026'),(7,'GV006','IT006','24DTH1','HK2_2025_2026'),(8,'GV007','IT007','23DTH1','HK2_2025_2026');
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
  `TenQuyen` varchar(50) NOT NULL,
  PRIMARY KEY (`MaQuyen`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
  `MSSV` varchar(20) NOT NULL,
  `HoTen` varchar(100) NOT NULL,
  `NgaySinh` date DEFAULT NULL,
  `GioiTinh` enum('Nam','Nữ') DEFAULT NULL,
  `Email` varchar(100) DEFAULT NULL,
  `SoDienThoai` varchar(15) DEFAULT NULL,
  `MaLop` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`MSSV`),
  KEY `MaLop` (`MaLop`),
  CONSTRAINT `sinhvien_ibfk_1` FOREIGN KEY (`MSSV`) REFERENCES `users` (`TaiKhoan`) ON DELETE CASCADE,
  CONSTRAINT `sinhvien_ibfk_2` FOREIGN KEY (`MaLop`) REFERENCES `lophoc` (`MaLop`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sinhvien`
--

LOCK TABLES `sinhvien` WRITE;
/*!40000 ALTER TABLE `sinhvien` DISABLE KEYS */;
INSERT INTO `sinhvien` VALUES ('123456','Nguyễn Văn Nam','2004-05-12','Nam','nam@truong.edu.vn','0912345678','23DTH1'),('2380610573','Nguyễn Văn Toàn','2004-08-15','Nam','toan@truong.edu.vn','0911111111','23DTH1'),('2380610574','Lê Hải Điền','2004-02-22','Nam','dien@truong.edu.vn','0922222222','23DTH1'),('2380610575','Trần Mỹ Duyên','2004-11-03','Nữ','duyen@truong.edu.vn','0933333333','23DTH1'),('2380610576','Phạm Tú Uyên','2004-12-04','Nữ','uyen@truong.edu.vn','0944444444','23DTH1'),('2380610577','Vũ Đức Phát','2004-01-10','Nam','phat@truong.edu.vn','0955555551','23DTH2'),('2380610578','Đặng Thùy Trang','2004-03-15','Nữ','trang@truong.edu.vn','0955555552','23DTH2'),('2380610579','Bùi Ngọc Bảo','2004-06-20','Nam','bao@truong.edu.vn','0955555553','23KT1'),('2380610580','Lý Thu Hà','2004-09-25','Nữ','ha@truong.edu.vn','0955555554','23KT1'),('2380610581','Trịnh Hữu Thắng','2004-10-30','Nam','thang@truong.edu.vn','0955555555','23NN1'),('2380610582','Đỗ Minh Tuấn','2004-04-12','Nam','tuan@truong.edu.vn','0955555556','23QT1'),('2380610583','Nguyễn Phương Anh','2004-07-08','Nữ','anh@truong.edu.vn','0955555557','23NN1'),('2380610584','Lê Trọng Tấn','2004-11-18','Nam','tan@truong.edu.vn','0955555558','24DTH1'),('2380610585','Trần Bảo Ngọc','2005-02-14','Nữ','ngoc@truong.edu.vn','0955555559','24DTH1'),('2380610586','Phan Khắc Việt','2005-08-09','Nam','viet@truong.edu.vn','0955555560','23DTH1');
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
  `TieuDe` varchar(255) NOT NULL,
  `Loai` enum('Tài liệu','Bài tập') NOT NULL,
  `FileUrl` varchar(255) DEFAULT NULL,
  `HanNop` datetime DEFAULT NULL,
  PRIMARY KEY (`MaTaiLieu`),
  KEY `MaPhanCong` (`MaPhanCong`),
  CONSTRAINT `tailieu_baitap_ibfk_1` FOREIGN KEY (`MaPhanCong`) REFERENCES `phanconggiangday` (`MaPhanCong`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tailieu_baitap`
--

LOCK TABLES `tailieu_baitap` WRITE;
/*!40000 ALTER TABLE `tailieu_baitap` DISABLE KEYS */;
INSERT INTO `tailieu_baitap` VALUES (1,1,'Slide Bài 1: Giới thiệu chung','Tài liệu','/uploads/tailieu/bai1.pdf',NULL),(2,1,'Bài tập Tuần 1','Bài tập','/uploads/baitap/bt_tuan1.pdf','2025-09-15 23:59:59'),(3,2,'Slide Phân tích yêu cầu','Tài liệu','/uploads/tailieu/pt_yeucau.pdf',NULL),(4,2,'Bài tập lớn giữa kỳ','Bài tập','/uploads/baitap/btl_giuaky.docx','2025-11-01 23:59:59'),(5,3,'Giáo trình Cơ sở dữ liệu','Tài liệu','/uploads/tailieu/gt_csdl.pdf',NULL),(6,4,'Bài tập TCP/IP','Bài tập','/uploads/baitap/bt_tcpip.pdf','2025-09-20 23:59:59'),(7,5,'Tài liệu Kinh tế học','Tài liệu','/uploads/tailieu/kinhtehoc.pdf',NULL);
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
  `TieuDe` varchar(255) NOT NULL,
  `NoiDung` text NOT NULL,
  `NguoiTao` varchar(20) NOT NULL,
  `MaLop_Nhan` varchar(20) DEFAULT NULL,
  `NgayTao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`MaThongBao`),
  KEY `NguoiTao` (`NguoiTao`),
  KEY `MaLop_Nhan` (`MaLop_Nhan`),
  CONSTRAINT `thongbao_ibfk_1` FOREIGN KEY (`NguoiTao`) REFERENCES `users` (`TaiKhoan`),
  CONSTRAINT `thongbao_ibfk_2` FOREIGN KEY (`MaLop_Nhan`) REFERENCES `lophoc` (`MaLop`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `thongbao`
--

LOCK TABLES `thongbao` WRITE;
/*!40000 ALTER TABLE `thongbao` DISABLE KEYS */;
INSERT INTO `thongbao` VALUES (1,'Thông báo nghỉ học','Lớp 23DTH1 nghỉ học ngày 15/09 do giảng viên đi công tác.','GV001','23DTH1','2026-05-28 08:19:57'),(2,'Nhắc nhở nộp bài tập lớn','Các em chú ý hạn nộp bài tập lớn là 01/11. Nhớ nộp đúng hạn.','GV002','23DTH1','2026-05-28 08:19:57'),(3,'Thông báo phòng học mới','Môn CSDL chuyển sang học tại phòng C1-102 từ tuần sau.','GV003','23KT1','2026-05-28 08:19:57'),(4,'Kế hoạch thực tập','Sinh viên chú ý theo dõi kế hoạch thực tập trên cổng thông tin.','admin',NULL,'2026-05-28 08:19:57'),(5,'Đóng học phí','Hạn cuối đóng học phí học kỳ 1 là 30/09/2025.','admin',NULL,'2026-05-28 08:19:57');
/*!40000 ALTER TABLE `thongbao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `TaiKhoan` varchar(20) NOT NULL,
  `password` varchar(100) NOT NULL,
  `MaQuyen` int NOT NULL,
  `NgayTao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`TaiKhoan`),
  KEY `MaQuyen` (`MaQuyen`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`MaQuyen`) REFERENCES `phanquyen` (`MaQuyen`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('123456','123@',3,'2026-05-27 03:53:11'),('2380610573','123456aA@',3,'2026-05-27 03:53:11'),('2380610574','123456aA@',3,'2026-05-27 03:53:11'),('2380610575','123456aA@',3,'2026-05-27 03:53:11'),('2380610576','123456aA@',3,'2026-05-27 03:53:11'),('2380610577','123456aA@',3,'2026-05-28 08:19:57'),('2380610578','123456aA@',3,'2026-05-28 08:19:57'),('2380610579','123456aA@',3,'2026-05-28 08:19:57'),('2380610580','123456aA@',3,'2026-05-28 08:19:57'),('2380610581','123456aA@',3,'2026-05-28 08:19:57'),('2380610582','123456aA@',3,'2026-05-28 08:19:57'),('2380610583','123456aA@',3,'2026-05-28 08:19:57'),('2380610584','123456aA@',3,'2026-05-28 08:19:57'),('2380610585','123456aA@',3,'2026-05-28 08:19:57'),('2380610586','123456aA@',3,'2026-05-28 08:19:57'),('admin','admin@123',1,'2026-05-27 03:53:11'),('GV001','gv@123',2,'2026-05-27 03:53:11'),('GV002','gv@2025',2,'2026-05-27 03:53:11'),('GV003','gv@123',2,'2026-05-28 08:19:57'),('GV004','gv@123',2,'2026-05-28 08:19:57'),('GV005','gv@123',2,'2026-05-28 08:19:57'),('GV006','gv@123',2,'2026-05-28 08:19:57'),('GV007','gv@123',2,'2026-05-28 08:19:57');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
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

-- Dump completed on 2026-05-28 15:53:59
