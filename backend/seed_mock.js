const path = require('path');
const isCloud = process.argv.includes('--cloud') || process.env.VERCEL === '1' || !!process.env.VERCEL;
const envFile = isCloud ? '.env' : '.env.local';
require('dotenv').config({ path: path.join(__dirname, envFile) });
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

function removeVietnameseTones(str) {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  return str;
}

function generateMaKhoa(tenKhoa) {
  return removeVietnameseTones(tenKhoa.replace(/-/g, ' '))
    .trim()
    .split(/\s+/)
    .filter(word => word)
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase();
}

const facultyNames = [
    "Công nghệ thông tin", "Kinh tế", "Ngoại ngữ", "Quản trị kinh doanh", "Du lịch",
    "Cơ khí", "Điện - Điện tử", "Xây dựng", "Môi trường", "Sinh học",
    "Hóa học", "Vật lý", "Toán học", "Giáo dục", "Tâm lý học",
    "Xã hội học", "Báo chí", "Lý luận chính trị", "Giáo dục thể chất", "Quốc phòng",
    "Y dược", "Kiểm toán", "Logistics", "Marketing", "Thương mại điện tử",
    "Công nghệ sinh học", "Hệ thống thông tin", "Khoa học máy tính", "Trí tuệ nhân tạo", "Luật"
];

const ho = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
const tenLot = ['Văn', 'Thị', 'Đức', 'Ngọc', 'Hữu', 'Minh', 'Thanh', 'Quang', 'Bảo', 'Hoài'];
const ten = ['Anh', 'Bình', 'Châu', 'Dũng', 'Em', 'Phong', 'Giang', 'Hải', 'Linh', 'Khánh', 'Lan', 'Mai', 'Nam', 'Oanh', 'Phúc', 'Quỳnh', 'Sơn', 'Tài', 'Uyên', 'Vy', 'Xuân', 'Yến'];

function getRandomName(i) {
    return `${ho[i % ho.length]} ${tenLot[(i*2) % tenLot.length]} ${ten[(i*3) % ten.length]}`;
}

async function seed() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
    });

    console.log("Connected to DB. Starting seed...");
    const defaultPassword = await bcrypt.hash('123456', 10);

    const generatedMaKhoas = new Set();
    const faculties = facultyNames.map(name => {
        let makhoa = generateMaKhoa(name);
        let i = 1;
        let base = makhoa;
        while(generatedMaKhoas.has(makhoa)) {
            makhoa = `${base}${i}`;
            i++;
        }
        generatedMaKhoas.add(makhoa);
        
        let weight = Math.random() * 10 + 1;
        if (['CNTT', 'KT', 'QTKD', 'NN', 'KHMT', 'HTTT'].includes(makhoa)) weight += 20; 
        return { name, makhoa, weight };
    });

    const totalWeight = faculties.reduce((sum, f) => sum + f.weight, 0);
    function getRandomFaculty() {
        let rand = Math.random() * totalWeight;
        for(let f of faculties) {
            if(rand < f.weight) return f;
            rand -= f.weight;
        }
        return faculties[faculties.length - 1];
    }

    console.log("Inserting Khoa...");
    for (const f of faculties) {
        await db.query('INSERT IGNORE INTO khoa (MaKhoa, TenKhoa) VALUES (?, ?)', [f.makhoa, f.name]);
    }
    
    const [khoaRows] = await db.query('SELECT ID, MaKhoa, TenKhoa FROM khoa');
    const khoaMap = {};
    for(const r of khoaRows) {
        khoaMap[r.MaKhoa] = r.ID;
    }

    console.log("Inserting MonHoc...");
    let subjectCounters = {};
    for (let i = 1; i <= 150; i++) {
        const f = getRandomFaculty();
        if(!subjectCounters[f.makhoa]) subjectCounters[f.makhoa] = 1;
        const maMon = `${f.makhoa}${String(subjectCounters[f.makhoa]++).padStart(3, '0')}`;
        const tenMon = `Môn học ${f.name} ${i}`;
        const stc = Math.floor(Math.random() * 3) + 2; 
        await db.query('INSERT IGNORE INTO monhoc (MaMonHoc, TenMonHoc, SoTinChi, MaKhoa) VALUES (?, ?, ?, ?)', [maMon, tenMon, stc, f.makhoa]);
    }

    console.log("Inserting LopHoc...");
    let classCounters = {};
    const startYears = ['2021', '2022', '2023', '2024'];
    const generatedClasses = [];
    for (let i = 1; i <= 100; i++) {
        const f = getRandomFaculty();
        const startYear = startYears[Math.floor(Math.random() * startYears.length)];
        const yearSuffix = startYear.slice(-2);
        const prefix = `${yearSuffix}${f.makhoa}`;
        if(!classCounters[prefix]) classCounters[prefix] = 1;
        const maLop = `${prefix}${classCounters[prefix]++}`;
        const tenLop = `Lớp ${maLop}`;
        const nienKhoa = `${startYear}-${parseInt(startYear)+4}`;
        
        await db.query('INSERT IGNORE INTO lophoc (MaLop, TenLop, MaKhoa, NienKhoa) VALUES (?, ?, ?, ?)', [maLop, tenLop, f.makhoa, nienKhoa]);
        generatedClasses.push({ maLop, maKhoa: f.makhoa, nienKhoa });
    }

    console.log("Inserting GiangVien...");
    let teacherCounters = {};
    for (let i = 1; i <= 200; i++) {
        const f = getRandomFaculty();
        if(!teacherCounters[f.makhoa]) teacherCounters[f.makhoa] = 1;
        const maGV = `GV${f.makhoa}${String(teacherCounters[f.makhoa]++).padStart(3, '0')}`;
        
        const hoTen = getRandomName(i);
        const email = `gv_${maGV.toLowerCase()}@example.com`;
        const phone = `09${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`;
        const gioiTinh = (i % 2 === 0) ? 'Nam' : 'Nữ';
        const ngaySinh = `198${i % 10}-0${(i % 9) + 1}-1${i % 9}`;
        
        await db.query('INSERT IGNORE INTO users (TaiKhoan, password, MaQuyen, TrangThai) VALUES (?, ?, ?, ?)', [maGV, defaultPassword, 2, 'Hoạt động']);
        await db.query('INSERT IGNORE INTO giangvien (MaGiangVien, HoTen, Email, SoDienThoai, MaKhoa, TrangThai, NgaySinh, GioiTinh) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [maGV, hoTen, email, phone, f.makhoa, 'Đang dạy', ngaySinh, gioiTinh]);
    }

    console.log("Inserting SinhVien...");
    let studentCounters = {}; 
    for (let i = 1; i <= 500; i++) {
        const lop = generatedClasses[Math.floor(Math.random() * generatedClasses.length)];
        const startYearStr = lop.nienKhoa.split('-')[0];
        const startYearSuffix = startYearStr.slice(-2);
        const khoaId = khoaMap[lop.maKhoa];
        if(!khoaId) continue; 
        
        const paddedKhoaId = String(khoaId).padStart(2, '0');
        const prefix = `${startYearSuffix}${paddedKhoaId}`;
        
        if(!studentCounters[prefix]) studentCounters[prefix] = 1;
        const mssv = `${prefix}${String(studentCounters[prefix]++).padStart(4, '0')}`;
        
        const hoTen = getRandomName(i + 200);
        const email = `sv_${mssv.toLowerCase()}@student.example.com`;
        const phone = `03${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`;
        const gioiTinh = (i % 2 === 0) ? 'Nam' : 'Nữ';
        const ngaySinh = `200${i % 5}-0${(i % 9) + 1}-1${i % 9}`;
        
        await db.query('INSERT IGNORE INTO users (TaiKhoan, password, MaQuyen, TrangThai) VALUES (?, ?, ?, ?)', [mssv, defaultPassword, 3, 'Hoạt động']);
        await db.query('INSERT IGNORE INTO sinhvien (MSSV, HoTen, NgaySinh, GioiTinh, Email, SoDienThoai, MaLop, TrangThai) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [mssv, hoTen, ngaySinh, gioiTinh, email, phone, lop.maLop, 'Đang học']);
    }

    console.log("Seeding completed successfully!");
    await db.end();
}

seed().catch(err => {
    console.error("Seeding error:", err);
    process.exit(1);
});
