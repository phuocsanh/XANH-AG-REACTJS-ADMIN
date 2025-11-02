import { useMutation } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import {
  UploadResponse,
  DeleteFileResponse,
  MarkFileUsedResponse,
  CleanupUnusedFilesResponse,
  UploadStats,
  FileListResponse,
  FileDetails,
  FileSearchParams,
} from "@/models/upload.model"
import { handleApiError } from "@/utils/error-handler"

// ========== UPLOAD HOOKS ==========

interface UploadFileRequest {
  file: File
  type: string
  folder: string
}

/**
 * Hook upload file
 */
export const useUploadFileMutation = () => {
  return useMutation({
    mutationFn: async (uploadData: UploadFileRequest) => {
      const formData = new FormData()
      formData.append("file", uploadData.file)
      formData.append("type", uploadData.type)
      formData.append("folder", uploadData.folder)

      const response = await api.postForm<UploadResponse>("/uploads", formData)
      return response
    },
    onSuccess: (data) => {
      console.log("Upload successful:", data)
      toast.success("Upload file thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Upload file không thành công")
    },
  })
}

/**
 * Hook upload file hình ảnh
 */
export const useUploadImageMutation = () => {
  return useMutation({
    mutationFn: async (uploadData: UploadFileRequest) => {
      const formData = new FormData()
      formData.append("file", uploadData.file)
      formData.append("type", uploadData.type)
      formData.append("folder", uploadData.folder)

      const response = await api.postForm<UploadResponse>(
        "/upload/image",
        formData
      )

      return response
    },
    onSuccess: () => {
      toast.success("Upload hình ảnh thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi upload hình ảnh")
    },
  })
}

/**
 * Hook upload file tài liệu
 */
export const useUploadDocumentMutation = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)

      const response = await api.postForm<UploadResponse>(
        "/upload/file",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      )

      return response
    },
    onSuccess: () => {
      toast.success("Upload file thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi upload file")
    },
  })
}

/**
 * Hook xóa file theo folder và filename
 */
export const useDeleteFileMutation = () => {
  return useMutation({
    mutationFn: async ({
      folder,
      filename,
    }: {
      folder: string
      filename: string
    }) => {
      const response = await api.delete<DeleteFileResponse>(
        `/upload/file/${folder}/${filename}`
      )
      return response
    },
    onSuccess: () => {
      toast.success("Xóa file thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi xóa file")
    },
  })
}

/**
 * Hook đánh dấu file đã được sử dụng
 */
export const useMarkFileAsUsedMutation = () => {
  return useMutation({
    mutationFn: async (publicId: string) => {
      const requestData = { publicId }
      const response = await api.patchRaw<MarkFileUsedResponse>(
        "/upload/file/mark-used",
        requestData as unknown as Record<string, unknown>
      )
      return response
    },
    onSuccess: () => {
      toast.success("Đánh dấu file đã sử dụng thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi đánh dấu file đã sử dụng")
    },
  })
}

/**
 * Hook dọn dẹp các file không sử dụng
 */
export const useCleanupUnusedFilesMutation = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.postRaw<CleanupUnusedFilesResponse>(
        "/upload/file/cleanup"
      )
      return response
    },
    onSuccess: () => {
      toast.success("Dọn dẹp file không sử dụng thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi dọn dẹp file không sử dụng")
    },
  })
}

/**
 * Hook lấy thống kê file upload
 */
export const useUploadStatsQuery = () => {
  return useMutation({
    mutationFn: async () => {
      // Giả lập API endpoint cho thống kê (có thể cần thêm vào backend)
      const response = await api.get<UploadStats>("/upload/file/stats")
      return response
    },
    onError: (error: unknown) => {
      handleApiError(error, "Lỗi khi lấy thống kê upload")
    },
  })
}

/**
 * Hook lấy danh sách file với tìm kiếm và phân trang
 */
export const useFileListQuery = () => {
  return useMutation({
    mutationFn: async (params?: FileSearchParams) => {
      // Giả lập API endpoint cho danh sách file (có thể cần thêm vào backend)
      const response = await api.get<FileListResponse>("/upload/file/list", {
        params,
      })
      return response
    },
    onError: (error: unknown) => {
      handleApiError(error, "Lỗi khi lấy danh sách file")
    },
  })
}

/**
 * Hook lấy thông tin chi tiết file theo ID
 */
export const useFileDetailsQuery = () => {
  return useMutation({
    mutationFn: async (fileId: string) => {
      // Giả lập API endpoint cho chi tiết file (có thể cần thêm vào backend)
      const response = await api.get<FileDetails>(
        `/upload/file/details/${fileId}`
      )
      return response
    },
    onError: (error: unknown) => {
      handleApiError(error, "Lỗi khi lấy chi tiết file")
    },
  })
}
