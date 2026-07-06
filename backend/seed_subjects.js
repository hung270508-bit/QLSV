const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function fix() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'qlsv_db'
  });

  try {
    console.log('Fixing old mock subjects...');
    await connection.query("UPDATE monhoc SET LoaiMonHoc = 'Chuyên ngành' WHERE TenMonHoc LIKE 'Môn học %'");
    
    console.log('Adding explicit generic subjects...');
    const genericSubjects = [
      { MaMonHoc: 'DC01', TenMonHoc: 'Toán cao cấp A1', SoTinChi: 3, MaKhoa: 'TH', LoaiMonHoc: 'Đại cương' },
      { MaMonHoc: 'DC02', TenMonHoc: 'Toán cao cấp A2', SoTinChi: 3, MaKhoa: 'TH', LoaiMonHoc: 'Đại cương' },
      { MaMonHoc: 'DC03', TenMonHoc: 'Vật lý đại cương 1', SoTinChi: 3, MaKhoa: 'VL', LoaiMonHoc: 'Đại cương' },
      { MaMonHoc: 'DC04', TenMonHoc: 'Vật lý đại cương 2', SoTinChi: 3, MaKhoa: 'VL', LoaiMonHoc: 'Đại cương' },
      { MaMonHoc: 'DC05', TenMonHoc: 'Triết học Mác - Lênin', SoTinChi: 3, MaKhoa: 'LLCT', LoaiMonHoc: 'Đại cương' },
      { MaMonHoc: 'DC06', TenMonHoc: 'Pháp luật đại cương', SoTinChi: 2, MaKhoa: 'L1', LoaiMonHoc: 'Đại cương' },
      { MaMonHoc: 'DC07', TenMonHoc: 'Tiếng Anh sơ cấp', SoTinChi: 3, MaKhoa: 'NN', LoaiMonHoc: 'Đại cương' },
      { MaMonHoc: 'DC08', TenMonHoc: 'Giáo dục thể chất 1', SoTinChi: 1, MaKhoa: 'GDTC', LoaiMonHoc: 'Đại cương' }
    ];

    for (const sub of genericSubjects) {
      await connection.query(
        'INSERT INTO monhoc (MaMonHoc, TenMonHoc, SoTinChi, MaKhoa, LoaiMonHoc) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE TenMonHoc=VALUES(TenMonHoc), SoTinChi=VALUES(SoTinChi), MaKhoa=VALUES(MaKhoa), LoaiMonHoc=VALUES(LoaiMonHoc)',
        [sub.MaMonHoc, sub.TenMonHoc, sub.SoTinChi, sub.MaKhoa, sub.LoaiMonHoc]
      );
    }
    console.log('Fixed subject assignments successfully.');
  } catch (error) {
    console.error(error);
  } finally {
    await connection.end();
  }
}
fix();
