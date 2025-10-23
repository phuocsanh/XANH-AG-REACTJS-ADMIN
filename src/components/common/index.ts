// Export tất cả common components
export { default as FormField } from "../form/form-field"
export { default as RichTextEditor } from "./rich-text-editor"
export { default as LoadingSpinner } from "./loading-spinner"
export { default as ConfirmDialog, useConfirmDialog } from "./confirm-dialog"
export { default as DataTable } from "./data-table"
export { default as SearchFilter } from "./search-filter"
export { default as StatusBadge } from "./status-badge"
export { default as FormComboBox } from "../form/form-combo-box"

// Export types
export type { DataTableProps, ActionButton } from "./data-table"
export type { SearchFilterProps, FilterField } from "./search-filter"
export type { StatusBadgeProps } from "./status-badge"
export type { FormComboBoxProps, ComboBoxOption } from "../form/form-combo-box"

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
