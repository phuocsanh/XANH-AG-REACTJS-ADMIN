# KẾ HOẠCH DI CHUYỂN DỰ ÁN TỪ SERVICE-BASED SANG HOOK-BASED

## Mục tiêu
- Loại bỏ hoàn toàn lớp service và chuyển sang sử dụng React Query hooks trực tiếp
- Tái sử dụng models và API functions một lần cho nhiều component
- Áp dụng kiến trúc khoa học và mô-đun từ dự án mobile

## Giai đoạn 1: Di chuyển User Service (ĐÃ HOÀN THÀNH)
- [x] Di chuyển tất cả logic từ src/services/user.service.ts sang query
- [x] Cập nhật tất cả component sử dụng user service
- [x] Xóa src/services/user.service.ts

## Giai đoạn 2: Di chuyển Product Service (ĐÃ HOÀN THÀNH)
- [x] Di chuyển tất cả logic từ src/services/product.service.ts sang query
- [x] Cập nhật tất cả component sử dụng product service
- [x] Xóa src/services/product.service.ts

## Giai đoạn 3: Di chuyển Product Subtype Service (ĐÃ HOÀN THÀNH)
- [x] Di chuyển tất cả logic từ src/services/product-subtype.service.ts sang query
- [x] Cập nhật tất cả component sử dụng product subtype service
- [x] Xóa src/services/product-subtype.service.ts

## Giai đoạn 4: Di chuyển Upload Service (ĐÃ HOÀN THÀNH)
- [x] Di chuyển tất cả logic từ src/services/upload.service.ts sang query
- [x] Cập nhật tất cả component sử dụng upload service
- [x] Xóa src/services/upload.service.ts

## Giai đoạn 5: Di chuyển Auth Service (ĐÃ HOÀN THÀNH)
- [x] Di chuyển tất cả logic từ src/services/auth.service.ts sang query
- [x] Cập nhật tất cả component sử dụng auth service
- [x] Xóa src/services/auth.service.ts

## Giai đoạn 6: Di chuyển Inventory Service (ĐÃ HOÀN THÀNH)
- [x] Di chuyển tất cả logic từ src/services/inventory.service.ts sang query
- [x] Cập nhật tất cả component sử dụng inventory service
- [x] Xóa src/services/inventory.service.ts

## Giai đoạn 7: Di chuyển Unit Service (ĐÃ HOÀN THÀNH)
- [x] Di chuyển tất cả logic từ src/services/unit.service.ts sang query
- [x] Cập nhật tất cả component sử dụng unit service
- [x] Xóa src/services/unit.service.ts

## Giai đoạn 8: Di chuyển Product Type Service (ĐÃ HOÀN THÀNH)
- [x] Di chuyển tất cả logic từ src/services/product-type.service.ts sang query
- [x] Cập nhật tất cả component sử dụng product type service
- [x] Xóa src/services/product-type.service.ts

## Giai đoạn 9: Di chuyển Sales Service (ĐÃ HOÀN THÀNH)
- [x] Di chuyển tất cả logic từ src/services/sales.service.ts sang query
- [x] Cập nhật tất cả component sử dụng sales service
- [x] Xóa src/services/sales.service.ts

## Giai đoạn 10: Di chuyển File Tracking Service (ĐÃ HOÀN THÀNH)
- [x] Di chuyển tất cả logic từ src/services/file-tracking.service.ts sang query
- [x] Cập nhật tất cả component sử dụng file tracking service
- [x] Xóa src/services/file-tracking.service.ts

## Giai đoạn 11: Cập nhật Components (ĐÃ HOÀN THÀNH)
- [x] Cập nhật tất cả component để sử dụng query hooks thay vì service
- [x] Đảm bảo không còn import service cũ
- [x] Kiểm tra và fix các lỗi phát sinh

## Giai đoạn 12: Kiểm tra và xác nhận (ĐÃ HOÀN THÀNH)
- [x] Kiểm tra toàn bộ chức năng của ứng dụng
- [x] Đảm bảo không còn service files trong thư mục src/services
- [x] Xác nhận kiến trúc mới hoạt động đúng

## Quy trình di chuyển từng service
1. Tạo file query mới trong thư mục src/queries
2. Di chuyển logic từ service sang query hooks
3. Cập nhật component sử dụng query hooks mới
4. Xóa file service cũ
5. Kiểm tra và fix lỗi nếu có

## Lưu ý quan trọng
- Luôn đảm bảo backward compatibility khi cập nhật component
- Kiểm tra kỹ trước khi xóa bất kỳ service file nào
- Cập nhật documentation nếu cần thiết
