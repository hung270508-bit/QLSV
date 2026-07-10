const fs = require('fs');
const routes = require('./routes_no_authz.json');

let markdown = `# Bảng Đề Xuất Role Đã Cập Nhật (180 APIs)

| # | Method | Route | Role Đề Xuất | Có Cần Ownership Check | Ghi chú |
|---|--------|-------|--------------|------------------------|---------|
`;

routes.forEach((r, idx) => {
    let role = 'admin'; // Default to admin for safety
    let ownership = 'Không';
    let note = '';
    
    const url = r.route;
    const method = r.method;
    
    // RFID Hardware
    if (url === '/api/attendance/uid' || url === '/api/rfid/status') {
        role = 'Hardware/Public (Dual-auth)';
        note = 'Gọi từ ESP32 hoặc Frontend (cần Dual Auth JWT/API Key)';
    } else if (url.startsWith('/api/rfid/activate-register') || url.startsWith('/api/rfid/reset-status')) {
        role = 'admin, teacher';
        note = 'Gọi từ Web Admin';
    } 
    // Users & Roles
    else if (url.startsWith('/api/users') || url.startsWith('/api/roles')) {
        role = 'admin';
    }
    // Teachers
    else if (url.includes('/teacher/:ma_giang_vien') || url.includes('/teacher/:maGV')) {
        role = 'teacher, admin';
        ownership = 'Có (teacher xem của mình)';
    } else if (url.includes('/teachers/:maGV')) {
        role = 'teacher, admin';
        ownership = 'Có (teacher xem/cập nhật thông tin)';
    } else if (url === '/api/teachers' || url.startsWith('/api/teachers/next-code')) {
        role = method === 'GET' ? 'admin, teacher, student' : 'admin';
    }
    // Students
    else if (url.includes('/:mssv/schedule') || url.includes('/schedule/student/:mssv')) {
        role = 'student, admin, teacher';
        ownership = 'Có (student xem lịch của mình)';
        if (url === '/api/students/:mssv/schedule') note = 'TRÙNG LẶP (Chưa được xoá - xem giải thích bên dưới)';
    } else if (url.includes('/student/:mssv') || url.includes('/:mssv/tong-quan') || url.includes('/:mssv/details') || url.includes('/my-courses/:mssv') || url.includes('/student/tuitions/:maSinhVien')) {
        role = 'student, admin, teacher';
        ownership = 'Có (student xem của mình)';
    } else if (url === '/api/students' || url.startsWith('/api/students/next-code')) {
        role = method === 'GET' ? 'admin, teacher' : 'admin';
    } else if (url.includes('/students/:mssv')) {
        role = 'student, admin';
        ownership = 'Có (student thao tác của mình)';
    }
    // Enrollment
    else if (url.includes('/api/enrollment/available/:mssv')) {
        role = 'student, admin';
        ownership = 'Có (student thao tác của mình)';
    } else if (url === '/api/enrollment/phases/:id/thong-ke') {
        role = 'admin';
        note = 'Dữ liệu tổng hợp toàn trường, chỉ admin được xem';
    } else if (url.startsWith('/api/enrollment/phases')) {
        role = method === 'GET' ? 'admin, student' : 'admin';
    } else if (url === '/api/enrollment' || url === '/api/enrollment/batch') {
        role = method === 'GET' ? 'admin, teacher' : (method === 'POST' ? 'student, admin' : 'admin');
        if(method === 'POST') ownership = 'Có (check từ req.body.MSSV)';
    } else if (url.includes('/tu-choi-thanh-toan') || url.includes('/xac-nhan-thanh-toan') || url.includes('/api/admin/confirm-tuition') || url.includes('/api/admin/tuitions') || url.includes('/api/dang-ky') || url.includes('/api/admin/duyet-dang-ky')) {
        role = 'admin';
        if (url === '/api/dang-ky' && method === 'POST') {
             role = 'student, admin';
             ownership = 'Có (nếu là student, dựa theo req.body.MSSV)';
        }
    } else if (url.includes('/api/enrollment/thong-ke') || url === '/api/enrollments/all') {
        role = 'admin';
    } else if (url.startsWith('/api/enrollment/')) { // Xoá đăng ký: DELETE /api/enrollment/:mssv/:maLhp
        role = 'student, admin';
        ownership = 'Có (nếu là student, từ params.mssv)';
    }
    // Schedule Configs & Assignments
    else if (url.startsWith('/api/schedule-configs') || url.startsWith('/api/teaching-assignments') || url.startsWith('/api/schedules')) {
        role = method === 'GET' ? 'admin, teacher, student' : 'admin';
    }
    // Faculties, Subjects, Classes, Course Sections
    else if (url.startsWith('/api/faculties') || url.startsWith('/api/subjects') || url.startsWith('/api/classes') || url.startsWith('/api/course-sections')) {
        role = method === 'GET' ? 'admin, teacher, student' : 'admin';
    }
    // Grades & Attendance
    else if (url.startsWith('/api/grades/student') || url.startsWith('/api/academic') || url.startsWith('/api/attendance/student') || url.startsWith('/api/attendance/percentage')) {
        role = 'student, admin, teacher';
        ownership = 'Có';
    } else if (url.startsWith('/api/grades') || url.startsWith('/api/attendance')) {
        role = method === 'GET' ? 'admin, teacher' : 'admin, teacher'; 
    }
    // Training points, announcements, support
    else if (url.startsWith('/api/training-points') || url.startsWith('/api/admin/training-points') || url.startsWith('/api/admin/training-periods') || url.startsWith('/api/training-periods')) {
        role = method === 'GET' ? 'admin, teacher, student' : 'admin, teacher';
    } else if (url.startsWith('/api/announcements')) {
        role = method === 'GET' ? 'admin, teacher, student' : 'admin';
    } else if (url.startsWith('/api/support/student')) {
        role = 'student, admin';
        ownership = 'Có';
    } else if (url === '/api/support') {
        role = method === 'POST' ? 'student' : 'admin';
    } else if (url.startsWith('/api/support/teacher')) {
        role = 'teacher, admin';
        ownership = 'Có (teacher xem của mình)';
    } else if (url.startsWith('/api/admin/support-requests')) {
        role = 'admin';
    }
    // AI Exam
    else if (url.startsWith('/documents') || url.startsWith('/sessions') || url.startsWith('/banks') || url.startsWith('/questions')) {
        role = 'teacher, admin';
    } else if (url === '/exams' || url.startsWith('/exams/teacher')) {
        role = 'teacher, admin';
    } else if (url.startsWith('/exams/student') || url.startsWith('/exams/history/student')) {
        role = 'student';
        ownership = 'Có';
    } else if (url.startsWith('/exams/') && (url.includes('/start') || url.includes('submit'))) {
        role = 'student';
    } else if (url.startsWith('/exams/')) {
        role = method === 'GET' ? 'student, teacher, admin' : 'teacher, admin';
    }

    markdown += `| ${idx + 1} | ${method} | ${url} | ${role} | ${ownership} | ${note} |\n`;
});

markdown += `

## Giải đáp và xác nhận các yêu cầu mới nhất (Lần 3):

### 1. Ownership check với \`req.body\` cho API \`/api/enrollment\` và \`/batch\`
Middleware ownership (mặc định đọc params) sẽ được thiết kế riêng linh hoạt hơn để đọc cả \`req.body.MSSV\`.
Cụ thể, cả 2 API \`POST /api/enrollment\` và \`POST /api/enrollment/batch\` đều **chỉ nhận 1 trường \`MSSV\` duy nhất** (không nhận mảng MSSV).
Ví dụ payload của /batch: \`{ MSSV: "21T102", cart: [{maLhp: "..."}] }\`. 
Do đó, nếu user có role student gọi POST, ta chỉ cần kiểm tra \`req.user.id === req.body.MSSV\`. Nếu sai lệch (ví dụ ID trong token là A nhưng req.body.MSSV là B) -> ném lỗi 403 Forbidden. Bạn hoàn toàn yên tâm sẽ không thể có chuyện "đăng ký hộ".

### 2. Gán sai role cho \`/api/enrollment/phases/:id/thong-ke\`
Bạn phân tích cực kỳ chính xác. Tôi đã đọc lại controller ở dòng 2220, API này trả về tổng hợp: \`TongDangKyThanhCong, SoDaDongTien, SoChoDongTien\`. Đây hoàn toàn là dữ liệu quản trị.
Tôi đã chuyển role của route này thành **chỉ \`admin\`**. Sinh viên sẽ bị 403.

### 3. Việc xoá route 1257 (trùng lặp schedule)
Tôi đã quét (grep) toàn bộ Frontend một lần nữa với key \`/schedule\` và gọi \`ScheduleDetailView\`. Kết quả cho thấy: 
- Component \`StudentManagement.jsx\` (của Admin) có gọi \`axios.get(\${API_BASE}/students/\${student.MSSV}/schedule)\` để xem lịch học của 1 sinh viên.
- Màn hình Admin này truyền dữ liệu vào Component \`ScheduleDetailView\` (không hiển thị field \`SoTinChi\` và không quan tâm \`TrangThai\`).
Vì vậy, nếu xoá route cũ, Admin sẽ bị áp dụng logic mới: "chỉ lấy những môn đã đóng tiền". Đây có thể là thay đổi logic kinh doanh không mong muốn (Admin có thể muốn xem tất cả môn, kể cả chưa đóng tiền).
**Kết luận:** Tôi hoàn toàn nhất trí **KHÔNG XÓA route 1257**. 
Giải pháp đề xuất trong Phase 2:
- Giữ nguyên \`GET /api/students/:mssv/schedule\` (route cũ, trả đủ) cho màn hình Admin.
- Sửa route 2503 thành một path mới, ví dụ: \`GET /api/students/:mssv/official-schedule\`. Sau đó, tôi sẽ sửa lại component \`StudentSchedule.jsx\` bên frontend để gọi API mới này.
Mọi thứ sẽ được code an toàn nhất, đảm bảo Admin và Sinh viên đều chạy đúng logic của mình. Xin bạn yên tâm duyệt.
`;

fs.writeFileSync('C:/Users/TOAN/.gemini/antigravity-ide/brain/ed450130-3b8f-4d74-b487-e4c3c243ed43/roles_proposal.md', markdown);
console.log('Done generating updated roles proposal v2');
