import api from './api';
import type {
  FileUpload,
  FileReference,
  CreateFileUploadRequest,
  UpdateFileUploadRequest,
  CreateFileReferenceRequest,
  CreateFileUploadResponse,
  UpdateFileUploadResponse,
  FileUploadListResponse,
  DeleteFileUploadResponse,
  OrphanedFilesResponse,
  MarkedForDeletionFilesResponse,
  FileTrackingStats,
  FileSearchParams,
  FileDetails,
  MarkFileForDeletionRequest,
  MarkFileForDeletionResponse,
} from '../models/file-tracking.model';

/**
 * Service xử lý các API endpoint cho module File-tracking
 * Quản lý file upload và file reference
 */
export const fileTrackingService = {
  // ========== QUẢN LÝ FILE UPLOAD ==========

  /**
   * Tạo file upload mới
   * @param data - Dữ liệu tạo file upload
   * @returns Promise chứa thông tin file upload đã tạo
   */
  createFileUpload: async (data: CreateFileUploadRequest): Promise<CreateFileUploadResponse> => {
    try {
      const response = await api.post<CreateFileUploadResponse>('/file-tracking/uploads', data);
      return response;
    } catch (error) {
      console.error('Lỗi khi tạo file upload:', error);
      throw error;
    }
  },

  /**
   * Lấy danh sách tất cả file upload
   * @param params - Tham số tìm kiếm và phân trang
   * @returns Promise chứa danh sách file upload
   */
  getAllFileUploads: async (params?: FileSearchParams): Promise<FileUploadListResponse> => {
    try {
      const response = await api.get<FileUploadListResponse>('/file-tracking/uploads', { params });
      return response;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách file upload:', error);
      throw error;
    }
  },

  /**
   * Tìm file upload theo ID
   * @param id - ID của file upload
   * @returns Promise chứa thông tin file upload
   */
  getFileUploadById: async (id: number): Promise<FileUpload> => {
    try {
      const response = await api.get<FileUpload>(`/file-tracking/uploads/${id}`);
      return response;
    } catch (error) {
      console.error(`Lỗi khi lấy file upload ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Tìm file upload theo public ID
   * @param publicId - Public ID của file upload
   * @returns Promise chứa thông tin file upload
   */
  getFileUploadByPublicId: async (publicId: string): Promise<FileUpload> => {
    try {
      const response = await api.get<FileUpload>(`/file-tracking/uploads/public/${publicId}`);
      return response;
    } catch (error) {
      console.error(`Lỗi khi lấy file upload public ID ${publicId}:`, error);
      throw error;
    }
  },

  /**
   * Cập nhật file upload
   * @param id - ID của file upload
   * @param data - Dữ liệu cập nhật
   * @returns Promise chứa thông tin file upload đã cập nhật
   */
  updateFileUpload: async (id: number, data: UpdateFileUploadRequest): Promise<UpdateFileUploadResponse> => {
    try {
      const response = await api.put<UpdateFileUploadResponse>(`/file-tracking/uploads/${id}`, data);
      return response;
    } catch (error) {
      console.error(`Lỗi khi cập nhật file upload ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Xóa file upload
   * @param id - ID của file upload
   * @returns Promise chứa kết quả xóa
   */
  deleteFileUpload: async (id: number): Promise<DeleteFileUploadResponse> => {
    try {
      const response = await api.delete<DeleteFileUploadResponse>(`/file-tracking/uploads/${id}`);
      return response;
    } catch (error) {
      console.error(`Lỗi khi xóa file upload ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Tìm các file không được sử dụng (orphaned)
   * @returns Promise chứa danh sách file orphaned
   */
  getOrphanedFiles: async (): Promise<OrphanedFilesResponse> => {
    try {
      const response = await api.get<OrphanedFilesResponse>('/file-tracking/uploads/orphaned');
      return response;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách file orphaned:', error);
      throw error;
    }
  },

  /**
   * Đánh dấu file để xóa
   * @param id - ID của file
   * @param data - Dữ liệu đánh dấu xóa
   * @returns Promise chứa kết quả đánh dấu
   */
  markFileForDeletion: async (id: number, data: MarkFileForDeletionRequest): Promise<MarkFileForDeletionResponse> => {
    try {
      const response = await api.put<MarkFileForDeletionResponse>(`/file-tracking/uploads/${id}/mark-for-deletion`, data);
      return response;
    } catch (error) {
      console.error(`Lỗi khi đánh dấu file ID ${id} để xóa:`, error);
      throw error;
    }
  },

  /**
   * Tìm các file đã đánh dấu để xóa
   * @returns Promise chứa danh sách file đã đánh dấu xóa
   */
  getFilesMarkedForDeletion: async (): Promise<MarkedForDeletionFilesResponse> => {
    try {
      const response = await api.get<MarkedForDeletionFilesResponse>('/file-tracking/uploads/marked-for-deletion');
      return response;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách file đã đánh dấu xóa:', error);
      throw error;
    }
  },

  // ========== CHỨC NĂNG BỔ SUNG ==========

  /**
   * Tìm kiếm file theo các tiêu chí
   * @param params - Tham số tìm kiếm
   * @returns Promise chứa danh sách file tìm được
   */
  searchFiles: async (params: FileSearchParams): Promise<FileUploadListResponse> => {
    try {
      const response = await api.get<FileUploadListResponse>('/file-tracking/uploads/search', { params });
      return response;
    } catch (error) {
      console.error('Lỗi khi tìm kiếm file:', error);
      throw error;
    }
  },

  /**
   * Lấy chi tiết file bao gồm các tham chiếu
   * @param id - ID của file
   * @returns Promise chứa chi tiết file
   */
  getFileDetails: async (id: number): Promise<FileDetails> => {
    try {
      const response = await api.get<FileDetails>(`/file-tracking/uploads/${id}/details`);
      return response;
    } catch (error) {
      console.error(`Lỗi khi lấy chi tiết file ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Xóa mềm file upload
   * @param id - ID của file
   * @returns Promise chứa kết quả xóa mềm
   */
  softDeleteFile: async (id: number): Promise<DeleteFileUploadResponse> => {
    try {
      const response = await api.put<DeleteFileUploadResponse>(`/file-tracking/uploads/${id}/soft-delete`);
      return response;
    } catch (error) {
      console.error(`Lỗi khi xóa mềm file ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Khôi phục file đã xóa mềm
   * @param id - ID của file
   * @returns Promise chứa kết quả khôi phục
   */
  restoreFile: async (id: number): Promise<UpdateFileUploadResponse> => {
    try {
      const response = await api.put<UpdateFileUploadResponse>(`/file-tracking/uploads/${id}/restore`);
      return response;
    } catch (error) {
      console.error(`Lỗi khi khôi phục file ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Tìm file theo URL
   * @param fileUrl - URL của file
   * @returns Promise chứa thông tin file
   */
  getFileByUrl: async (fileUrl: string): Promise<FileUpload> => {
    try {
      const response = await api.get<FileUpload>('/file-tracking/uploads/by-url', {
        params: { fileUrl },
      });
      return response;
    } catch (error) {
      console.error(`Lỗi khi tìm file theo URL ${fileUrl}:`, error);
      throw error;
    }
  },

  /**
   * Dọn dẹp các file không sử dụng
   * @returns Promise chứa kết quả dọn dẹp
   */
  cleanupUnusedFiles: async (): Promise<DeleteFileUploadResponse> => {
    try {
      const response = await api.post<DeleteFileUploadResponse>('/file-tracking/uploads/cleanup');
      return response;
    } catch (error) {
      console.error('Lỗi khi dọn dẹp file không sử dụng:', error);
      throw error;
    }
  },

  /**
   * Lấy thống kê file tracking
   * @returns Promise chứa thống kê
   */
  getFileTrackingStats: async (): Promise<FileTrackingStats> => {
    try {
      const response = await api.get<FileTrackingStats>('/file-tracking/uploads/stats');
      return response;
    } catch (error) {
      console.error('Lỗi khi lấy thống kê file tracking:', error);
      throw error;
    }
  },

  /**
   * Cập nhật metadata của file
   * @param id - ID của file
   * @param metadata - Metadata mới
   * @returns Promise chứa thông tin file đã cập nhật
   */
  updateFileMetadata: async (id: number, metadata: Record<string, unknown>): Promise<FileUpload> => {
    try {
      const response = await api.put<FileUpload>(`/file-tracking/uploads/${id}/metadata`, {
        metadata,
      });
      return response;
    } catch (error) {
      console.error(`Lỗi khi cập nhật metadata file ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Cập nhật tags của file
   * @param id - ID của file
   * @param tags - Mảng tags mới
   * @returns Promise chứa thông tin file đã cập nhật
   */
  updateFileTags: async (id: number, tags: string[]): Promise<FileUpload> => {
    try {
      const response = await api.put<FileUpload>(`/file-tracking/uploads/${id}/tags`, {
        tags,
      });
      return response;
    } catch (error) {
      console.error(`Lỗi khi cập nhật tags file ID ${id}:`, error);
      throw error;
    }
  },

  // ========== QUẢN LÝ FILE REFERENCE ==========

  /**
   * Tạo file reference mới
   * @param data - Dữ liệu tạo file reference
   * @returns Promise chứa thông tin file reference đã tạo
   */
  createFileReference: async (data: CreateFileReferenceRequest): Promise<FileReference> => {
    try {
      const response = await api.post<FileReference>('/file-tracking/references', data);
      return response;
    } catch (error) {
      console.error('Lỗi khi tạo file reference:', error);
      throw error;
    }
  },

  /**
   * Xóa file reference
   * @param id - ID của file reference
   * @returns Promise chứa kết quả xóa
   */
  deleteFileReference: async (id: number): Promise<DeleteFileUploadResponse> => {
    try {
      const response = await api.delete<DeleteFileUploadResponse>(`/file-tracking/references/${id}`);
      return response;
    } catch (error) {
      console.error(`Lỗi khi xóa file reference ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Tăng số lượng tham chiếu của file
   * @param fileUploadId - ID của file upload
   * @returns Promise chứa thông tin file đã cập nhật
   */
  incrementReferenceCount: async (fileUploadId: number): Promise<FileUpload> => {
    try {
      const response = await api.put<FileUpload>(`/file-tracking/uploads/${fileUploadId}/increment-reference`);
      return response;
    } catch (error) {
      console.error(`Lỗi khi tăng reference count file ID ${fileUploadId}:`, error);
      throw error;
    }
  },

  /**
   * Giảm số lượng tham chiếu của file
   * @param fileUploadId - ID của file upload
   * @returns Promise chứa thông tin file đã cập nhật
   */
  decrementReferenceCount: async (fileUploadId: number): Promise<FileUpload> => {
    try {
      const response = await api.put<FileUpload>(`/file-tracking/uploads/${fileUploadId}/decrement-reference`);
      return response;
    } catch (error) {
      console.error(`Lỗi khi giảm reference count file ID ${fileUploadId}:`, error);
      throw error;
    }
  },

  /**
   * Lấy danh sách file reference theo entity
   * @param entityType - Loại thực thể
   * @param entityId - ID của thực thể
   * @returns Promise chứa danh sách file reference
   */
  getFileReferencesByEntity: async (
    entityType: string,
    entityId: number
  ): Promise<FileReference[]> => {
    try {
      const response = await api.get<FileReference[]>('/file-tracking/references', {
        params: { entityType, entityId },
      });
      return response;
    } catch (error) {
      console.error(`Lỗi khi lấy file references cho entity ${entityType}:${entityId}:`, error);
      throw error;
    }
  },

  /**
   * Xóa hàng loạt tất cả file reference của một entity
   * @param entityType - Loại thực thể
   * @param entityId - ID của thực thể
   * @returns Promise chứa kết quả xóa
   */
  batchRemoveEntityFileReferences: async (
    entityType: string,
    entityId: number
  ): Promise<DeleteFileUploadResponse> => {
    try {
      const response = await api.delete<DeleteFileUploadResponse>(
        `/file-tracking/references/entity/${entityType}/${entityId}`
      );
      return response;
    } catch (error) {
      console.error(`Lỗi khi xóa hàng loạt file references cho entity ${entityType}:${entityId}:`, error);
      throw error;
    }
  },

  /**
   * Xóa file reference theo URL và entity
   * @param fileUrl - URL của file
   * @param entityType - Loại thực thể
   * @param entityId - ID của thực thể
   * @returns Promise chứa kết quả xóa
   */
  removeFileReferenceByUrl: async (
    fileUrl: string,
    entityType: string,
    entityId: number
  ): Promise<DeleteFileUploadResponse> => {
    try {
      const response = await api.delete<DeleteFileUploadResponse>('/file-tracking/references/by-url', {
        params: { fileUrl, entityType, entityId },
      });
      return response;
    } catch (error) {
      console.error(`Lỗi khi xóa file reference theo URL ${fileUrl}:`, error);
      throw error;
    }
  },

  /**
   * Xóa hàng loạt file reference theo danh sách URL
   * @param fileUrls - Mảng URL của các file
   * @param entityType - Loại thực thể
   * @param entityId - ID của thực thể
   * @returns Promise chứa kết quả xóa
   */
  batchRemoveFileReferencesByUrls: async (
    fileUrls: string[],
    entityType: string,
    entityId: number
  ): Promise<DeleteFileUploadResponse> => {
    try {
      const response = await api.delete<DeleteFileUploadResponse>('/file-tracking/references/batch-by-urls', {
        data: { fileUrls, entityType, entityId },
      });
      return response;
    } catch (error) {
      console.error('Lỗi khi xóa hàng loạt file references theo URLs:', error);
      throw error;
    }
  },
};

export default fileTrackingService;