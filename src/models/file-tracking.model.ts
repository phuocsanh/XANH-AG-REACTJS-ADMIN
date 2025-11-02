/**
 * Interface định nghĩa cấu trúc dữ liệu cho File Upload
 * Sử dụng để quản lý thông tin file đã upload
 */
export interface FileUpload {
  /** ID duy nhất của file upload */
  id: number
  /** ID công khai của file */
  public_id: string
  /** URL truy cập file */
  file_url: string
  /** Tên file */
  file_name: string
  /** Loại file */
  file_type: string
  /** Kích thước file (bytes) */
  file_size: number
  /** Thư mục chứa file */
  folder?: string
  /** Loại MIME của file */
  mime_type?: string
  /** Số lượng tham chiếu đến file */
  reference_count?: number
  /** Trạng thái file tạm thời */
  is_temporary?: boolean
  /** Trạng thái file không được sử dụng */
  is_orphaned?: boolean
  /** ID của người dùng upload file */
  uploaded_by_user_id?: number
  /** Mảng tag của file */
  tags?: string[]
  /** Metadata của file */
  metadata?: Record<string, unknown>
  /** Thời gian tạo file upload */
  created_at: Date
  /** Thời gian cập nhật gần nhất */
  updated_at: Date
  /** Thời gian đánh dấu để xóa file */
  marked_for_deletion_at?: Date
  /** Thời gian xóa file */
  deleted_at?: Date
}

/**
 * Interface định nghĩa cấu trúc dữ liệu cho File Reference
 * Sử dụng để quản lý tham chiếu file với các entity khác
 */
export interface FileReference {
  /** ID duy nhất của file reference */
  id: number
  /** ID của file upload */
  file_id: number
  /** Loại thực thể (ví dụ: 'product', 'user') */
  entity_type: string
  /** ID của thực thể */
  entity_id: number
  /** Tên trường chứa file */
  field_name?: string
  /** Vị trí trong mảng (nếu có) */
  array_index?: number
  /** ID người tạo */
  created_by_user_id?: number
  /** Thời gian tạo */
  created_at: Date
  /** Thời gian cập nhật */
  updated_at: Date
  /** ID người xóa */
  deleted_by_user_id?: number
  /** Thời gian xóa */
  deleted_at?: Date
}

/**
 * Interface định nghĩa request tạo file upload mới
 */
export interface CreateFileUploadRequest {
  [key: string]: unknown // Index signature để tương thích với AnyObject
  /** ID công khai của file */
  public_id: string
  /** URL truy cập file */
  file_url: string
  /** Tên file */
  file_name: string
  /** Loại file */
  file_type: string
  /** Kích thước file (bytes) */
  file_size: number
  /** Thư mục chứa file */
  folder?: string
  /** Loại MIME của file */
  mime_type?: string
  /** Số lượng tham chiếu đến file */
  reference_count?: number
  /** Trạng thái file tạm thời */
  is_temporary?: boolean
  /** Trạng thái file không được sử dụng */
  is_orphaned?: boolean
  /** ID của người dùng upload file */
  uploaded_by_user_id?: number
  /** Mảng tag của file */
  tags?: string[]
  /** Metadata của file */
  metadata?: Record<string, unknown>
  /** Thời gian đánh dấu để xóa file */
  marked_for_deletion_at?: Date
  /** Thời gian xóa file */
  deleted_at?: Date
}

/**
 * Interface định nghĩa request cập nhật file upload
 */
export interface UpdateFileUploadRequest
  extends Partial<CreateFileUploadRequest> {}

/**
 * Interface định nghĩa request tạo file reference
 */
export interface CreateFileReferenceRequest {
  [key: string]: unknown // Index signature để tương thích với AnyObject
  /** ID của file upload */
  file_id: number
  /** Loại thực thể */
  entity_type: string
  /** ID của thực thể */
  entity_id: number
  /** Tên trường chứa file */
  field_name?: string
  /** Vị trí trong mảng */
  array_index?: number
  /** ID người tạo */
  created_by_user_id?: number
}

/**
 * Interface định nghĩa response sau khi tạo file upload
 */
export interface CreateFileUploadResponse extends FileUpload {}

/**
 * Interface định nghĩa response sau khi cập nhật file upload
 */
export interface UpdateFileUploadResponse extends FileUpload {}

/**
 * Interface định nghĩa response danh sách file upload
 */
export interface FileUploadListResponse {
  /** Danh sách file upload */
  data: FileUpload[]
  /** Tổng số file */
  total: number
  /** Trang hiện tại */
  page?: number
  /** Số lượng file trên mỗi trang */
  limit?: number
}

/**
 * Interface định nghĩa response xóa file upload
 */
export interface DeleteFileUploadResponse {
  /** Thông báo kết quả */
  message: string
  /** Trạng thái thành công */
  success: boolean
}

/**
 * Interface định nghĩa response tìm file orphaned
 */
export interface OrphanedFilesResponse {
  /** Danh sách file orphaned */
  files: FileUpload[]
  /** Tổng số file orphaned */
  total: number
}

/**
 * Interface định nghĩa response file đã đánh dấu để xóa
 */
export interface MarkedForDeletionFilesResponse {
  /** Danh sách file đã đánh dấu để xóa */
  files: FileUpload[]
  /** Tổng số file đã đánh dấu */
  total: number
}

/**
 * Interface định nghĩa thống kê file tracking
 */
export interface FileTrackingStats {
  /** Tổng số file */
  total_files: number
  /** Tổng dung lượng file (bytes) */
  total_size: number
  /** Số file tạm thời */
  temporary_files: number
  /** Số file orphaned */
  orphaned_files: number
  /** Số file đã đánh dấu để xóa */
  marked_for_deletion_files: number
  /** Số file đã xóa */
  deleted_files: number
}

/**
 * Interface định nghĩa tham số tìm kiếm file
 */
export interface FileSearchParams {
  /** Tìm kiếm theo tên file */
  file_name?: string
  /** Tìm kiếm theo loại file */
  file_type?: string
  /** Tìm kiếm theo thư mục */
  folder?: string
  /** Tìm kiếm theo trạng thái tạm thời */
  is_temporary?: boolean
  /** Tìm kiếm theo trạng thái orphaned */
  is_orphaned?: boolean
  /** Tìm kiếm theo người upload */
  uploaded_by_user_id?: number
  /** Trang hiện tại */
  page?: number
  /** Số lượng trên mỗi trang */
  limit?: number
  /** Sắp xếp theo trường */
  sort_by?: string
  /** Thứ tự sắp xếp */
  sort_order?: "ASC" | "DESC"
}

/**
 * Interface định nghĩa chi tiết file
 */
export interface FileDetails extends FileUpload {
  /** Danh sách tham chiếu của file */
  references: FileReference[]
  /** Số lượng tham chiếu hiện tại */
  current_reference_count: number
}

/**
 * Interface định nghĩa request đánh dấu file để xóa
 */
export interface MarkFileForDeletionRequest {
  [key: string]: unknown // Index signature để tương thích với AnyObject
  /** ID của file */
  file_id: number
  /** Thời gian đánh dấu */
  marked_at?: Date
}

/**
 * Interface định nghĩa response đánh dấu file để xóa
 */
export interface MarkFileForDeletionResponse {
  /** Thông báo kết quả */
  message: string
  /** Trạng thái thành công */
  success: boolean
  /** Thông tin file đã đánh dấu */
  file: FileUpload
}
