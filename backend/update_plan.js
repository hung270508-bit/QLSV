const fs = require('fs');

const oldPlanPath = 'C:/Users/TOAN/.gemini/antigravity-ide/brain/ed450130-3b8f-4d74-b487-e4c3c243ed43/implementation_plan.md';
let oldPlan = fs.readFileSync(oldPlanPath, 'utf8');

const reportDetails = fs.readFileSync('C:/Users/TOAN/.gemini/antigravity-ide/brain/ed450130-3b8f-4d74-b487-e4c3c243ed43/report_details.md', 'utf8');

let newPlan = `# Báo Cáo Phase 1 - Quét Bảo Mật Backend QLSV (Đã Cập Nhật Bổ Sung)

## 1. Kết Quả Scan API (Lỗ Hổng & Điểm Yếu Chi Tiết)

` + reportDetails + `

## 2. Phân Tích Logic & Cấu Hình (Cập Nhật)

### A. Quan hệ Giảng viên ↔ Môn học ↔ Lớp (cho checkTeacherPermission)
Dữ liệu phân công giảng dạy thực tế được quản lý ở bảng **lophocphan**.

### B. Xử lý JWT_SECRET và Cấu Hình Khác
- **JWT Secret**: Đã kiểm tra file \`.env.local\`, hiện tại **CHƯA CÓ** biến \`JWT_SECRET\`.
  **Giải pháp (Phase 2)**: Thay vì dùng fallback hardcode, tôi sẽ cấu hình server ném lỗi \`throw new Error('FATAL ERROR: JWT_SECRET is not defined in .env')\` và dừng khởi động ngay lập tức nếu thiếu cấu hình. 
  > [!WARNING]
  > Yêu cầu User bổ sung biến \`JWT_SECRET=your_secure_random_string\` vào file \`.env.local\` trước khi bắt đầu Phase 2.
- **Password Hashing**: Đã triển khai tốt (bcrypt).
- **Helmet**: Chưa có.
- **CORS**: Đang cấu hình quá lỏng (\`callback(null, true)\`).
- **Rate Limiter**: Đã import express-rate-limit nhưng chưa dùng.
- **Error Handler**: Chưa có middleware xử lý lỗi tập trung.

### C. Thư viện Validation (Chốt validateRequest)
Đề xuất sử dụng **\`express-validator\`**.
**Lý do**:
- Rất phổ biến, chuẩn mực cho dự án Express.js.
- Cung cấp chuỗi hàm validate tiện lợi dưới dạng middleware (ví dụ: \`body('email').isEmail()\`).
- Dễ dàng tích hợp vào middleware chain hiện tại trước khi qua bước authorizeRole.
- Rất nhẹ và không yêu cầu thay đổi nhiều kiến trúc hiện tại.

---

## Kế Hoạch Triển Khai Phase 2 (Cần Duyệt)

Trong Phase 2, tôi sẽ triển khai theo từng module (Student -> Teacher -> Admin -> AI Exam) với các bước:

### Proposed Changes

#### Các file sẽ tạo mới (trong \`backend/middlewares/\`):
- \`[NEW] authMiddleware.js\` (\`verifyToken\`, \`authorizeRole\`)
- \`[NEW] ownershipMiddleware.js\` (\`checkStudentOwnership\`, \`checkTeacherPermission\`)
- \`[NEW] validationMiddleware.js\` (chứa các rules của \`express-validator\`)

#### [MODIFY] server.js
- Thêm check \`JWT_SECRET\` cứng (throw error).
- Thêm Helmet, Rate Limiter, CORS an toàn.
- Bổ sung Error Handler tập trung.
- Gắn chain middleware cho từng group API theo module (không đổi logic/Response JSON, không xoá route cũ).

#### [MODIFY] ai-exam/routes.js
- Gắn middleware tương tự cho module AI Exam.

## User Review Required
> [!IMPORTANT]
> Đã cập nhật chi tiết danh sách tất cả các API bị lỗi (không viết tắt) và hướng xử lý JWT/Validation. Xin vui lòng review và chọn **Proceed / Duyệt** nếu đồng ý để tiến hành Phase 2. Đừng quên bổ sung \`JWT_SECRET\` vào \`.env.local\`.
`;

fs.writeFileSync(oldPlanPath, newPlan);
console.log('Updated plan with details');
