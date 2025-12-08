// Trạng thái cơ bản dùng chung
export const BASE_STATUS = [
  { value: "active", label: "Hoạt động" },
  { value: "inactive", label: "Không hoạt động" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "archived", label: "Đã lưu trữ" },
] as const

// Kiểu dữ liệu cho trạng thái cơ bản
export type BaseStatus = (typeof BASE_STATUS)[number]["value"]
