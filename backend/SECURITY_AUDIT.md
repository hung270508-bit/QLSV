# Báo cáo Audit Bảo mật (Module: Thi trực tuyến & Giám sát)

Dựa trên quá trình quét toàn bộ mã nguồn tại thư mục `backend/` (`server.js`, `ai-exam/routes.js` và file báo cáo `scan_routes.js`, `routes_no_auth.json`), đây là báo cáo đánh giá hiện trạng bảo mật của dự án QLSV.

## 1. Hiện trạng Xác thực (Authentication) & Phân quyền (Authorization)

Dự án hiện tại ĐANG RẤT THIẾU CƠ CHẾ BẢO VỆ ở cấp độ API. Hầu hết các route không sử dụng middleware để kiểm tra token hợp lệ hoặc quyền hạn của người gọi.

| File / Module | Có xác thực (JWT/Session)? | Có check role? | Có check ownership (IDOR)? | Ghi chú |
| :--- | :---: | :---: | :---: | :--- |
| `backend/server.js` (Hàng trăm routes CRUD: `/api/students`, `/api/classes`, `/api/schedules`...) | ❌ Không | ❌ Không | ❌ Không | Bất kỳ ai gọi trực tiếp API cũng có thể lấy, thêm, sửa, xóa dữ liệu. File `routes_no_auth.json` ghi nhận hơn 140+ route không có auth. |
| `backend/ai-exam/routes.js` (Module Ngân hàng câu hỏi AI) | ❌ Không | ❌ Không | ❌ Không | Không có middleware bảo vệ, các API như tạo kỳ thi (`POST /exams`) hoặc bắt đầu thi (`POST /exams/:exam_id/start`) đều đang ở trạng thái mở. |
| `backend/scan_routes.js` | N/A | N/A | N/A | Script do ai đó để lại nhằm kiểm tra các lỗ hổng trên server. Nó cũng phát hiện hàng loạt vấn đề IDOR và SQL Injection. |

## 2. Cơ chế sinh Token (JWT) hiện tại

Hệ thống ĐÃ CÓ cơ chế sinh JWT chuẩn, được đặt tại endpoint `POST /api/login` trong file `server.js` (dòng 268 - 400).

- **Payload của JWT:**
  ```json
  {
      "id": "MSSV_Hoac_MaGV_Hoac_Admin",
      "username": "MSSV_Hoac_MaGV_Hoac_Admin",
      "role": "admin" | "teacher" | "student",
      "maQuyen": 1 | 2 | 3
  }
  ```
- **Secret Key:** Lấy từ biến môi trường `process.env.JWT_SECRET`, nếu không có sẽ fallback về chuỗi mặc định `'your-secret-key-change-in-production'`.
- **Thời hạn (ExpiresIn):** `24h`.

## 3. Đề xuất vị trí đặt Middleware chuẩn

Vì hiện trạng toàn bộ hệ thống (`server.js`, `ai-exam`) đều đang trống middleware xác thực và sớm muộn gì cũng cần được "vá" hàng loạt, tôi đề xuất đặt các middleware mới tạo (cho module thi trực tuyến) tại thư mục dùng chung toàn cục:
👉 `backend/middlewares/`

Việc này giúp:
1. **Dùng chung cho toàn bộ project sau này**: `authenticate.js` và `requireRole.js` có thể dễ dàng import vào `server.js` để vá các API cũ.
2. **Không bị trói buộc**: Module thi trực tuyến mới (ví dụ `backend/online-exam/`) có thể import từ `../middlewares/` mà không gây lộn xộn cấu trúc.

---
**Agent Note:** Tôi đã tạm dừng Giai đoạn 0 tại đây và CHƯA tạo file middleware hay đụng vào code. Xin người dùng xem qua `SECURITY_AUDIT.md` và xác nhận:
1. Có đồng ý đặt middleware tại thư mục dùng chung `backend/middlewares/` không?
2. Có thể tiến hành tạo file code cho Giai đoạn 0B (Dựng middleware) và chuyển sang Giai đoạn 1 (Thiết kế DB) được chưa?
