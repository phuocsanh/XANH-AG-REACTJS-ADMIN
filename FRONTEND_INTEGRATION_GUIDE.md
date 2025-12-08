# 📢 Frontend Integration Guide (Backend Refactoring Update)

Tài liệu này tổng hợp các thay đổi mới nhất ở phía Backend (NestJS) và hướng dẫn Frontend (React/Next.js) kiểm tra, tích hợp.

## 🟢 Tóm Tắt Tình Trạng
*   **API Breaking Changes:** 0 (API giữ nguyên cấu trúc Input/Output).
*   **Logic Changes:** Có (Product Creation, Auth Security).
*   **FE Action Required:** Kiểm tra (Sanity Check) & Cấu hình môi trường.

---

## 1. 📦 Quản Lý Sản Phẩm (Product Management)
**Thay đổi Backend:**
*   Đã **GỠ BỎ** hoàn toàn logic Factory Pattern (`FertilizerProductFactory`, `PesticideProductFactory`).
*   Backend hiện tại lưu trực tiếp mọi dữ liệu Frontend gửi lên mà không can thiệp sâu.

**👉 Lưu ý cho Frontend:**
*   **Attributes Field (`JSONB`):** Frontend có toàn quyền quyết định cấu trúc `attributes`. Backend sẽ lưu nguyên trạng (As-Is) những gì FE gửi lên (ví dụ: `{ "npk": "20-20-15" }` hay `{ "active_ingredient": "..." }`).
    *   *Action:* FE tự đảm bảo validate form nhập liệu (nếu cần) trước khi gửi API.
*   **Product Type:** Backend không còn tự động gán ID (ví dụ 3 hay 4) dựa trên logic ngầm. Backend sẽ tin tưởng giá trị `type` (number) mà FE gửi lên trong `CreateProductDto`.
    *   *Action:* Đảm bảo Dropdown chọn "Loại sản phẩm" gửi đúng ID (ví dụ: `1` cho Fertilizer, `2` cho Pesticide... tùy DB real).

## 2. 🔐 Authentication & Security
**Thay đổi Backend:**
*   **Gỡ bỏ Fallback Secret Key:** Backend sẽ **Crash (Báo lỗi)** ngay lập tức nếu thiếu biến môi trường `JWT_SECRET` hoặc `JWT_REFRESH_SECRET`. Không còn dùng key mặc định `'my_jwt_secret_key'` nữa.
*   **Check Active User:** Logic check user status chặt chẽ hơn (`BaseStatus.ACTIVE`).

**👉 Lưu ý cho Frontend / DevOps:**
*   **Môi trường Dev/Prod:** Bắt buộc phải cấu hình file `.env` đầy đủ các biến Secret.
*   **Login Flow:** Không thay đổi.

## 3. 👥 User Roles & Enums
**Thay đổi Backend:**
*   Backend đã chuẩn hóa Role check bằng Enum (`RoleCode`) thay vì string hardcode.

**👉 Lưu ý cho Frontend:**
*   API Response cho field `user.role.code` vẫn trả về các chuỗi chuẩn như cũ: `'SUPER_ADMIN'`, `'ADMIN'`, `'MANAGER'`, `'STAFF'`, `'FARMER'`, `'USER'`.
*   *Action:* FE yên tâm tiếp tục dùng các chuỗi này để phân quyền giao diện (RBAC).

## 4. ⚠️ Những thứ GIỮ NGUYÊN (Không đổi)
*   **Inventory Status:** Các trạng thái phiếu kho vẫn là chuỗi thường (lowercase string): `'draft'`, `'completed'`, `'cancelled'`. Frontend **TUYỆT ĐỐI KHÔNG** tự ý đổi sang chữ hoa (như `'COMPLETED'`) hay Enum số, vì DB đang lưu string.

---

## ✅ Checklist cho Frontend
1.  [ ] Thử tạo mới một sản phẩm (Phân bón & Thuốc) -> Kiểm tra xem `attributes` lưu vào DB có đúng như form nhập không.
2.  [ ] Đảm bảo file `.env` local của Frontend/Backend khớp secret key (nếu chạy chung repo/monorepo).
3.  [ ] Verify tính năng Login của User bình thường.

*Hết.*
