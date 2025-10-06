/**
 * Interface định nghĩa cấu trúc dữ liệu cho File Upload
 * Sử dụng để quản lý thông tin file đã upload
 */
export interface FileUpload {
  /** ID duy nhất của file upload */
  id: number;
  /** ID công khai của file */
  publicId: string;
  /** URL truy cập file */
  fileUrl: string;
  /** Tên file */
  fileName: string;
  /** Loại file */
  fileType: string;
  /** Kích thước file (bytes) */
  fileSize: number;
  /** Thư mục chứa file */
  folder?: string;
  /** Loại MIME của file */
  mimeType?: string;
  /** Số lượng tham chiếu đến file */
  referenceCount?: number;
  /** Trạng thái file tạm thời */
  isTemporary?: boolean;
  /** Trạng thái file không được sử dụng */
  isOrphaned?: boolean;
  /** ID của người dùng upload file */
  uploadedByUserId?: number;
  /** Mảng tag của file */
  tags?: string[];
  /** Metadata của file */
  metadata?: Record<string, unknown>;
  /** Thời gian tạo file upload */
  createdAt: Date;
  /** Thời gian cập nhật gần nhất */
  updatedAt: Date;
  /** Thời gian đánh dấu để xóa file */
  markedForDeletionAt?: Date;
  /** Thời gian xóa file */
  deletedAt?: Date;
}

/**
 * Interface định nghĩa cấu trúc dữ liệu cho File Reference
 * Sử dụng để quản lý tham chiếu file với các entity khác
 */
export interface FileReference {
  /** ID duy nhất của file reference */
  id: number;
  /** ID của file upload */
  fileId: number;
  /** Loại thực thể (ví dụ: 'product', 'user') */
  entityType: string;
  /** ID của thực thể */
  entityId: number;
  /** Tên trường chứa file */
  fieldName?: string;
  /** Vị trí trong mảng (nếu có) */
  arrayIndex?: number;
  /** ID người tạo */
  createdByUserId?: number;
  /** Thời gian tạo */
  createdAt: Date;
  /** Thời gian cập nhật */
  updatedAt: Date;
  /** ID người xóa */
  deletedByUserId?: number;
  /** Thời gian xóa */
  deletedAt?: Date;
}

/**
 * Interface định nghĩa request tạo file upload mới
 */
export interface CreateFileUploadRequest {
  [key: string]: unknown  // Index signature để tương thích với AnyObject
  /** ID công khai của file */
  publicId: string;
  /** URL truy cập file */
  fileUrl: string;
  /** Tên file */
  fileName: string;
  /** Loại file */
  fileType: string;
  /** Kích thước file (bytes) */
  fileSize: number;
  /** Thư mục chứa file */
  folder?: string;
  /** Loại MIME của file */
  mimeType?: string;
  /** Số lượng tham chiếu đến file */
  referenceCount?: number;
  /** Trạng thái file tạm thời */
  isTemporary?: boolean;
  /** Trạng thái file không được sử dụng */
  isOrphaned?: boolean;
  /** ID của người dùng upload file */
  uploadedByUserId?: number;
  /** Mảng tag của file */
  tags?: string[];
  /** Metadata của file */
  metadata?: Record<string, unknown>;
  /** Thời gian đánh dấu để xóa file */
  markedForDeletionAt?: Date;
  /** Thời gian xóa file */
  deletedAt?: Date;
}

/**
 * Interface định nghĩa request cập nhật file upload
 */
export interface UpdateFileUploadRequest extends Partial<CreateFileUploadRequest> {}

/**
 * Interface định nghĩa request tạo file reference
 */
export interface CreateFileReferenceRequest {
  [key: string]: unknown  // Index signature để tương thích với AnyObject
  /** ID của file upload */
  fileId: number;
  /** Loại thực thể */
  entityType: string;
  /** ID của thực thể */
  entityId: number;
  /** Tên trường chứa file */
  fieldName?: string;
  /** Vị trí trong mảng */
  arrayIndex?: number;
  /** ID người tạo */
  createdByUserId?: number;
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
  data: FileUpload[];
  /** Tổng số file */
  total: number;
  /** Trang hiện tại */
  page?: number;
  /** Số lượng file trên mỗi trang */
  limit?: number;
}

/**
 * Interface định nghĩa response xóa file upload
 */
export interface DeleteFileUploadResponse {
  /** Thông báo kết quả */
  message: string;
  /** Trạng thái thành công */
  success: boolean;
}

/**
 * Interface định nghĩa response tìm file orphaned
 */
export interface OrphanedFilesResponse {
  /** Danh sách file orphaned */
  files: FileUpload[];
  /** Tổng số file orphaned */
  total: number;
}

/**
 * Interface định nghĩa response file đã đánh dấu để xóa
 */
export interface MarkedForDeletionFilesResponse {
  /** Danh sách file đã đánh dấu để xóa */
  files: FileUpload[];
  /** Tổng số file đã đánh dấu */
  total: number;
}

/**
 * Interface định nghĩa thống kê file tracking
 */
export interface FileTrackingStats {
  /** Tổng số file */
  totalFiles: number;
  /** Tổng dung lượng file (bytes) */
  totalSize: number;
  /** Số file tạm thời */
  temporaryFiles: number;
  /** Số file orphaned */
  orphanedFiles: number;
  /** Số file đã đánh dấu để xóa */
  markedForDeletionFiles: number;
  /** Số file đã xóa */
  deletedFiles: number;
}

/**
 * Interface định nghĩa tham số tìm kiếm file
 */
export interface FileSearchParams {
  /** Tìm kiếm theo tên file */
  fileName?: string;
  /** Tìm kiếm theo loại file */
  fileType?: string;
  /** Tìm kiếm theo thư mục */
  folder?: string;
  /** Tìm kiếm theo trạng thái tạm thời */
  isTemporary?: boolean;
  /** Tìm kiếm theo trạng thái orphaned */
  isOrphaned?: boolean;
  /** Tìm kiếm theo người upload */
  uploadedByUserId?: number;
  /** Trang hiện tại */
  page?: number;
  /** Số lượng trên mỗi trang */
  limit?: number;
  /** Sắp xếp theo trường */
  sortBy?: string;
  /** Thứ tự sắp xếp */
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Interface định nghĩa chi tiết file
 */
export interface FileDetails extends FileUpload {
  /** Danh sách tham chiếu của file */
  references: FileReference[];
  /** Số lượng tham chiếu hiện tại */
  currentReferenceCount: number;
}

/**
 * Interface định nghĩa request đánh dấu file để xóa
 */
export interface MarkFileForDeletionRequest {
  [key: string]: unknown  // Index signature để tương thích với AnyObject
  /** ID của file */
  fileId: number;
  /** Thời gian đánh dấu */
  markedAt?: Date;
}

/**
 * Interface định nghĩa response đánh dấu file để xóa
 */
export interface MarkFileForDeletionResponse {
  /** Thông báo kết quả */
  message: string;
  /** Trạng thái thành công */
  success: boolean;
  /** Thông tin file đã đánh dấu */
  file: FileUpload;
}