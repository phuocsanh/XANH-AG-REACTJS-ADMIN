import { Api } from '@/utils/api'
import {
  UploadResponse,
  DeleteFileResponse,
  MarkFileUsedRequest,
  MarkFileUsedResponse,
  CleanupUnusedFilesResponse,
  UploadStats,
  FileDetails,
  FileListResponse,
  FileSearchParams,
} from '@/models/upload.model'

const api = new Api()

/**
 * Service xử lý các API liên quan đến upload file
 * Bao gồm upload, xóa, quản lý file và thống kê
 */
export const uploadService = {
  // ========== UPLOAD FILE ==========

  /**
   * Upload file hình ảnh
   * @param file - File hình ảnh cần upload
   * @returns Promise chứa thông tin file đã upload
   */
  uploadImage: async (file: File): Promise<{ data: UploadResponse }> => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post<UploadResponse>('/upload/images', formData as unknown as Record<string, unknown>, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return { data: response }
    } catch (error) {
      console.error('Lỗi khi upload hình ảnh:', error)
      throw error
    }
  },

  /**
   * Upload file tài liệu
   * @param file - File tài liệu cần upload
   * @returns Promise chứa thông tin file đã upload
   */
  uploadFile: async (file: File): Promise<{ data: UploadResponse }> => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post<UploadResponse>('/upload/files', formData as unknown as Record<string, unknown>, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return { data: response }
    } catch (error) {
      console.error('Lỗi khi upload file:', error)
      throw error
    }
  },

  // ========== QUẢN LÝ FILE ==========

  /**
   * Xóa file theo folder và filename
   * @param folder - Thư mục chứa file
   * @param filename - Tên file cần xóa
   * @returns Promise chứa kết quả xóa
   */
  deleteFile: async (folder: string, filename: string): Promise<{ data: DeleteFileResponse }> => {
    try {
      const response = await api.delete<DeleteFileResponse>(`/upload/files/${folder}/${filename}`)
      return { data: response }
    } catch (error) {
      console.error(`Lỗi khi xóa file ${folder}/${filename}:`, error)
      throw error
    }
  },

  /**
   * Đánh dấu file đã được sử dụng
   * @param publicId - Public ID của file
   * @returns Promise chứa kết quả đánh dấu
   */
  markFileAsUsed: async (publicId: string): Promise<{ data: MarkFileUsedResponse }> => {
    try {
      const requestData: MarkFileUsedRequest = { publicId }
      const response = await api.patch<MarkFileUsedResponse>('/upload/files/mark-used', requestData as unknown as Record<string, unknown>)
      return { data: response }
    } catch (error) {
      console.error(`Lỗi khi đánh dấu file ${publicId} đã sử dụng:`, error)
      throw error
    }
  },

  /**
   * Dọn dẹp các file không sử dụng
   * @returns Promise chứa kết quả dọn dẹp
   */
  cleanupUnusedFiles: async (): Promise<{ data: CleanupUnusedFilesResponse }> => {
    try {
      const response = await api.post<CleanupUnusedFilesResponse>('/upload/files/cleanup')
      return { data: response }
    } catch (error) {
      console.error('Lỗi khi dọn dẹp file không sử dụng:', error)
      throw error
    }
  },

  // ========== THỐNG KÊ VÀ BÁO CÁO ==========

  /**
   * Lấy thống kê file upload
   * @returns Promise chứa thống kê file
   */
  getUploadStats: async (): Promise<{ data: UploadStats }> => {
    try {
      // Giả lập API endpoint cho thống kê (có thể cần thêm vào backend)
      const response = await api.get<UploadStats>('/upload/files/stats')
      return { data: response }
    } catch (error) {
      console.error('Lỗi khi lấy thống kê upload:', error)
      // Trả về thống kê mặc định nếu API chưa có
      const defaultStats: UploadStats = {
        totalFiles: 0,
        totalSize: 0,
        imageFiles: 0,
        documentFiles: 0,
        otherFiles: 0,
        usedFiles: 0,
        unusedFiles: 0,
      }
      return { data: defaultStats }
    }
  },

  /**
   * Lấy danh sách file với tìm kiếm và phân trang
   * @param params - Tham số tìm kiếm và phân trang
   * @returns Promise chứa danh sách file
   */
  getFileList: async (params?: FileSearchParams): Promise<{ data: FileListResponse }> => {
    try {
      // Giả lập API endpoint cho danh sách file (có thể cần thêm vào backend)
      const response = await api.get<FileListResponse>('/upload/files/list', { params })
      return { data: response }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách file:', error)
      // Trả về danh sách rỗng nếu API chưa có
      const defaultResponse: FileListResponse = {
        files: [],
        total: 0,
        page: params?.page || 1,
        limit: params?.limit || 10,
        totalPages: 0,
      }
      return { data: defaultResponse }
    }
  },

  /**
   * Lấy thông tin chi tiết file theo ID
   * @param fileId - ID của file
   * @returns Promise chứa thông tin chi tiết file
   */
  getFileDetails: async (fileId: string): Promise<{ data: FileDetails }> => {
    try {
      // Giả lập API endpoint cho chi tiết file (có thể cần thêm vào backend)
      const response = await api.get<FileDetails>(`/upload/files/details/${fileId}`)
      return { data: response }
    } catch (error) {
      console.error(`Lỗi khi lấy chi tiết file ${fileId}:`, error)
      throw error
    }
  },
}

// Giữ lại hàm cũ để tương thích ngược
export const uploadFile = async (
  file: File,
  _folder?: string
): Promise<UploadResponse> => {
  try {
    const result = await uploadService.uploadFile(file)
    return result.data
  } catch (error) {
    console.error('Lỗi khi upload file (legacy function):', error)
    throw error
  }
}

export default uploadService
