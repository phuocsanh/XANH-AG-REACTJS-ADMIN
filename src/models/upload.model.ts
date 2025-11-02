/**
 * Interface định nghĩa cấu trúc dữ liệu cho module Upload
 * Bao gồm các interface cho upload file, response và request
 */

// ========== INTERFACE CHO UPLOAD FILE ==========

/**
 * Interface cho thông tin file upload
 */
export interface FileUpload {
  id: string
  public_id: string
  file_url: string
  file_name: string
  file_type: string
  file_size: number
  created_at: string
  updated_at: string
}

/**
 * Interface cho response khi upload file thành công
 */
export interface UploadResponse {
  id: string
  public_id: string
  file_url: string
  file_name: string
  file_type: string
  file_size: number
  created_at: string
  updated_at: string
}

// ========== INTERFACE CHO REQUEST ==========

/**
 * Interface cho request xóa file
 */
export interface DeleteFileRequest {
  public_id: string
}

/**
 * Interface cho request đánh dấu file đã sử dụng
 */
export interface MarkFileUsedRequest {
  public_id: string
}

/**
 * Interface cho request upload file
 */
export interface UploadFileRequest {
  file: File
  folder?: string
}

// ========== INTERFACE CHO RESPONSE ==========

/**
 * Interface cho response xóa file
 */
export interface DeleteFileResponse {
  success: boolean
  message: string
}

/**
 * Interface cho response đánh dấu file đã sử dụng
 */
export interface MarkFileUsedResponse {
  success: boolean
  message: string
}

/**
 * Interface cho response dọn dẹp file không sử dụng
 */
export interface CleanupUnusedFilesResponse {
  success: boolean
  deleted_count: number
  message: string
}

// ========== INTERFACE CHO THỐNG KÊ ==========

/**
 * Interface cho thống kê file upload
 */
export interface UploadStats {
  total_files: number
  total_size: number
  image_files: number
  document_files: number
  other_files: number
  used_files: number
  unused_files: number
}

/**
 * Interface cho thông tin chi tiết file
 */
export interface FileDetails {
  id: string
  public_id: string
  file_url: string
  file_name: string
  original_name: string
  file_type: string
  mime_type: string
  file_size: number
  folder: string
  is_used: boolean
  usage_count: number
  created_at: string
  updated_at: string
  last_accessed_at?: string
}

/**
 * Interface cho danh sách file với phân trang
 */
export interface FileListResponse {
  files: FileDetails[]
  total: number
  page: number
  limit: number
  total_pages: number
}

/**
 * Interface cho tham số tìm kiếm file
 */
export interface FileSearchParams {
  page?: number
  limit?: number
  search?: string
  file_type?: string
  folder?: string
  is_used?: boolean
  sort_by?: "created_at" | "file_name" | "file_size" | "last_accessed_at"
  sort_order?: "asc" | "desc"
}
