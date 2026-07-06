require('dotenv').config();
const mysql = require('mysql2/promise');

const FIRST_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
const MIDDLE_NAMES = ['Văn', 'Thị', 'Ngọc', 'Hữu', 'Minh', 'Thanh', 'Đức', 'Hoài', 'Thu', 'Anh', 'Hải', 'Xuân', 'Gia'];
const LAST_NAMES = ['An', 'Anh', 'Bình', 'Châu', 'Dũng', 'Duy', 'Đạt', 'Hoa', 'Hùng', 'Hương', 'Khoa', 'Linh', 'Minh', 'Nam', 'Nga', 'Phong', 'Quân', 'Quỳnh', 'Sơn', 'Trang', 'Tùng', 'Tuấn', 'Uyên', 'Vinh', 'Vy', 'Yến'];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomName() {
  const first = FIRST_NAMES[getRandomInt(0, FIRST_NAMES.length - 1)];
  const middle = MIDDLE_NAMES[getRandomInt(0, MIDDLE_NAMES.length - 1)];
  const last = LAST_NAMES[getRandomInt(0, LAST_NAMES.length - 1)];
  return `${first} ${middle} ${last}`;
}

function getRandomPhone() {
  let phone = '09';
  for (let i = 0; i < 8; i++) {
    phone += getRandomInt(0, 9);
  }
  return phone;
}

function getRandomDate() {
  const start = new Date(2000, 0, 1).getTime();
  const end = new Date(2005, 11, 31).getTime();
  const date = new Date(start + Math.random() * (end - start));
  return date.toISOString().split('T')[0];
}

async function seed() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  try {
    const [lops] = await conn.query('SELECT MaLop FROM lophoc');
    if (lops.length === 0) throw new Error('No classes found');

    const defaultPasswordHash = '$2b$10$xe0SXGjhwQBa71abIWGQg.vtU766lJoOzqFrRFcgoZjy3YcXhzJ0y';
    
    // Find the max MSSV that we generated to continue from it
    const [maxMssvRow] = await conn.query("SELECT MAX(CAST(MSSV AS UNSIGNED)) as maxMssv FROM sinhvien WHERE MSSV LIKE '24%'");
    let mssvCounter = maxMssvRow[0].maxMssv ? parseInt(maxMssvRow[0].maxMssv) + 1 : 24600001;

    let totalNewStudents = 0;
    const usersData = [];
    const sinhVienData = [];

    for (const lop of lops) {
      const maLop = lop.MaLop;
      const [countRow] = await conn.query('SELECT COUNT(*) as cnt FROM sinhvien WHERE MaLop = ?', [maLop]);
      const currentCount = countRow[0].cnt;
      
      const targetCount = getRandomInt(30, 50);
      
      if (currentCount < targetCount) {
        const toAdd = targetCount - currentCount;
        for (let i = 0; i < toAdd; i++) {
          const mssv = mssvCounter.toString();
          mssvCounter++;
          
          usersData.push([
            mssv,
            defaultPasswordHash,
            3, // MaQuyen for student
            new Date(),
            'Hoạt động'
          ]);

          sinhVienData.push([
            mssv,
            getRandomName(),
            getRandomDate(),
            getRandomInt(0, 1) === 0 ? 'Nam' : 'Nữ',
            `${mssv}@student.edu.vn`,
            getRandomPhone(),
            maLop,
            'Đang học'
          ]);
          totalNewStudents++;
        }
      }
    }

    console.log(`Need to add ${totalNewStudents} more students across ${lops.length} classes.`);

    if (usersData.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < usersData.length; i += batchSize) {
        const batch = usersData.slice(i, i + batchSize);
        await conn.query('INSERT INTO users (TaiKhoan, password, MaQuyen, NgayTao, TrangThai) VALUES ?', [batch]);
      }
      console.log('Inserted users.');

      for (let i = 0; i < sinhVienData.length; i += batchSize) {
        const batch = sinhVienData.slice(i, i + batchSize);
        await conn.query('INSERT INTO sinhvien (MSSV, HoTen, NgaySinh, GioiTinh, Email, SoDienThoai, MaLop, TrangThai) VALUES ?', [batch]);
      }
      console.log('Inserted sinhvien.');
    }

    console.log('Seed completed successfully!');

  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await conn.end();
  }
}

seed();
