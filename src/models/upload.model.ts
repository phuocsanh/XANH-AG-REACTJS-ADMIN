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
  publicId: string
  fileUrl: string
  fileName: string
  fileType: string
  fileSize: number
  createdAt: string
  updatedAt: string
}

/**
 * Interface cho response khi upload file thành công
 */
export interface UploadResponse {
  id: string
  publicId: string
  fileUrl: string
  fileName: string
  fileType: string
  fileSize: number
  createdAt: string
  updatedAt: string
}

// ========== INTERFACE CHO REQUEST ==========

/**
 * Interface cho request xóa file
 */
export interface DeleteFileRequest {
  publicId: string
}

/**
 * Interface cho request đánh dấu file đã sử dụng
 */
export interface MarkFileUsedRequest {
  publicId: string
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
  deletedCount: number
  message: string
}

// ========== INTERFACE CHO THỐNG KÊ ==========

/**
 * Interface cho thống kê file upload
 */
export interface UploadStats {
  totalFiles: number
  totalSize: number
  imageFiles: number
  documentFiles: number
  otherFiles: number
  usedFiles: number
  unusedFiles: number
}

/**
 * Interface cho thông tin chi tiết file
 */
export interface FileDetails {
  id: string
  publicId: string
  fileUrl: string
  fileName: string
  originalName: string
  fileType: string
  mimeType: string
  fileSize: number
  folder: string
  isUsed: boolean
  usageCount: number
  createdAt: string
  updatedAt: string
  lastAccessedAt?: string
}

/**
 * Interface cho danh sách file với phân trang
 */
export interface FileListResponse {
  files: FileDetails[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Interface cho tham số tìm kiếm file
 */
export interface FileSearchParams {
  page?: number
  limit?: number
  search?: string
  fileType?: string
  folder?: string
  isUsed?: boolean
  sortBy?: 'createdAt' | 'fileName' | 'fileSize' | 'lastAccessedAt'
  sortOrder?: 'asc' | 'desc'
}