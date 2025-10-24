import { useMutation } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import {
  UploadResponse,
  DeleteFileResponse,
  MarkFileUsedResponse,
  CleanupUnusedFilesResponse,
  UploadStats,
  FileDetails,
  FileListResponse,
  FileSearchParams,
} from "@/models/upload.model"

/**
 * Hook upload file hình ảnh
 */
export const useUploadImageMutation = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)

      const response = await api.post<UploadResponse>(
        "/upload/images",
        formData as unknown as Record<string, unknown>,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      )

      return response
    },
    onSuccess: () => {
      toast.success("Upload hình ảnh thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi upload hình ảnh:", error)
      toast.error("Có lỗi xảy ra khi upload hình ảnh")
    },
  })
}

/**
 * Hook upload file tài liệu
 */
export const useUploadFileMutation = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)

      const response = await api.post<UploadResponse>(
        "/upload/files",
        formData as unknown as Record<string, unknown>,
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
    onError: (error: Error) => {
      console.error("Lỗi upload file:", error)
      toast.error("Có lỗi xảy ra khi upload file")
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
        `/upload/files/${folder}/${filename}`
      )
      return response
    },
    onSuccess: () => {
      toast.success("Xóa file thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi xóa file:", error)
      toast.error("Có lỗi xảy ra khi xóa file")
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
      const response = await api.patch<MarkFileUsedResponse>(
        "/upload/files/mark-used",
        requestData as unknown as Record<string, unknown>
      )
      return response
    },
    onSuccess: () => {
      toast.success("Đánh dấu file đã sử dụng thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi đánh dấu file đã sử dụng:", error)
      toast.error("Có lỗi xảy ra khi đánh dấu file đã sử dụng")
    },
  })
}

/**
 * Hook dọn dẹp các file không sử dụng
 */
export const useCleanupUnusedFilesMutation = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post<CleanupUnusedFilesResponse>(
        "/upload/files/cleanup"
      )
      return response
    },
    onSuccess: () => {
      toast.success("Dọn dẹp file không sử dụng thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi dọn dẹp file không sử dụng:", error)
      toast.error("Có lỗi xảy ra khi dọn dẹp file không sử dụng")
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
      const response = await api.get<UploadStats>("/upload/files/stats")
      return response
    },
    onError: (error: Error) => {
      console.error("Lỗi khi lấy thống kê upload:", error)
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
      const response = await api.get<FileListResponse>("/upload/files/list", {
        params,
      })
      return response
    },
    onError: (error: Error) => {
      console.error("Lỗi khi lấy danh sách file:", error)
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
        `/upload/files/details/${fileId}`
      )
      return response
    },
    onError: (error: Error) => {
      console.error(`Lỗi khi lấy chi tiết file:`, error)
    },
  })
}
