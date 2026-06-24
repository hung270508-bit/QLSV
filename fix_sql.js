const fs = require('fs');
const lines = fs.readFileSync('qlsv.sql', 'utf8').split('\n');
// Truncate at line 755
const goodLines = lines.slice(0, 755);

const newTable = `DROP TABLE IF EXISTS \`yeucau_hotro\`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE \`yeucau_hotro\` (
  \`MaYeuCau\` int NOT NULL AUTO_INCREMENT,
  \`MSSV\` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`MaGiangVien\` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`LoaiYeuCau\` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`ChuDe\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`NoiDung\` text COLLATE utf8mb4_unicode_ci NOT NULL,
  \`NgayGui\` datetime NOT NULL,
  \`TrangThai\` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Đang xử lý',
  \`PhanHoi\` text COLLATE utf8mb4_unicode_ci,
  \`NgayPhanHoi\` datetime DEFAULT NULL,
  PRIMARY KEY (\`MaYeuCau\`),
  KEY \`MSSV\` (\`MSSV\`),
  KEY \`MaGiangVien\` (\`MaGiangVien\`),
  CONSTRAINT \`yeucau_hotro_ibfk_1\` FOREIGN KEY (\`MSSV\`) REFERENCES \`sinhvien\` (\`MSSV\`) ON DELETE CASCADE,
  CONSTRAINT \`yeucau_hotro_ibfk_2\` FOREIGN KEY (\`MaGiangVien\`) REFERENCES \`giangvien\` (\`MaGiangVien\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table \`yeucau_hotro\`
--

LOCK TABLES \`yeucau_hotro\` WRITE;
/*!40000 ALTER TABLE \`yeucau_hotro\` DISABLE KEYS */;
/*!40000 ALTER TABLE \`yeucau_hotro\` ENABLE KEYS */;
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
`;

fs.writeFileSync('qlsv.sql', goodLines.join('\n') + '\n' + newTable);
console.log("SQL fixed!");
