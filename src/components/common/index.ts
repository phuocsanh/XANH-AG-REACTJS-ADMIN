// Export tất cả common components
export { default as FormField } from "../Form/FormField"
export { default as RichTextEditor } from "./RichTextEditor"
export { default as LoadingSpinner } from "./LoadingSpinner"
export { default as ConfirmDialog, useConfirmDialog } from "./ConfirmDialog"
export { default as DataTable } from "./DataTable"
export { default as SearchFilter } from "./SearchFilter"
export { default as StatusBadge } from "./StatusBadge"
export { default as FormComboBox } from "../Form/FormComboBox"

// Export types
export type { DataTableProps, ActionButton } from "./DataTable"
export type { SearchFilterProps, FilterField } from "./SearchFilter"
export type { StatusBadgeProps } from "./StatusBadge"
export type { FormComboBoxProps, ComboBoxOption } from "../Form/FormComboBox"

/**
 * Common Components Library
 *
 * Thư viện các component tái sử dụng cho dự án
 * Bao gồm:
 * - FormField: Component form field đa năng
 * - RichTextEditor: Trình soạn thảo văn bản phong phú
 * - LoadingSpinner: Component loading với nhiều tùy chọn
 * - ConfirmDialog: Dialog xác nhận với hook hỗ trợ
 * - DataTable: Bảng dữ liệu với action buttons
 * - SearchFilter: Component tìm kiếm và lọc
 * - StatusBadge: Hiển thị trạng thái với Badge/Tag
 */
