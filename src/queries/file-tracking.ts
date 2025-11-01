import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { queryClient } from "@/provider/app-provider-tanstack"
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
} from "@/models/file-tracking.model"
import { handleApiError } from "@/utils/error-handler"
import type { ErrorResponse } from "@/models/network"

// ========== QUERY KEYS ==========
export const fileTrackingKeys = {
  all: ["fileTracking"] as const,
  uploads: () => [...fileTrackingKeys.all, "uploads"] as const,
  uploadsList: (params?: FileSearchParams) =>
    [...fileTrackingKeys.uploads(), "list", params] as const,
  upload: (id: number) =>
    [...fileTrackingKeys.uploads(), "detail", id] as const,
  uploadByPublicId: (publicId: string) =>
    [...fileTrackingKeys.uploads(), "public", publicId] as const,
  references: () => [...fileTrackingKeys.all, "references"] as const,
  reference: (id: number) =>
    [...fileTrackingKeys.references(), "detail", id] as const,
  referencesByEntity: (entityType: string, entityId: number) =>
    [...fileTrackingKeys.references(), entityType, entityId] as const,
  orphaned: () => [...fileTrackingKeys.all, "orphaned"] as const,
  markedForDeletion: () =>
    [...fileTrackingKeys.all, "markedForDeletion"] as const,
  stats: () => [...fileTrackingKeys.all, "stats"] as const,
} as const

// ========== FILE UPLOAD HOOKS ==========

/**
 * Hook tạo file upload mới
 */
export const useCreateFileUploadMutation = () => {
  return useMutation({
    mutationFn: async (data: CreateFileUploadRequest) => {
      const response = await api.postRaw<CreateFileUploadResponse>(
        "/file-tracking/uploads",
        data
      )
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fileTrackingKeys.uploads() })
      toast.success("Tạo file upload thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi tạo file upload")
    },
  })
}

/**
 * Hook lấy danh sách tất cả file upload
 */
export const useFileUploadsQuery = (params?: FileSearchParams) => {
  return useQuery({
    queryKey: fileTrackingKeys.uploadsList(params),
    queryFn: async () => {
      const response = await api.get<FileUploadListResponse>(
        "/file-tracking/uploads",
        { params }
      )
      return response
    },
  })
}

/**
 * Hook tìm file upload theo ID
 */
export const useFileUploadQuery = (id: number) => {
  return useQuery({
    queryKey: fileTrackingKeys.upload(id),
    queryFn: async () => {
      const response = await api.get<FileUpload>(`/file-tracking/uploads/${id}`)
      return response
    },
    enabled: !!id,
  })
}

/**
 * Hook tìm file upload theo public ID
 */
export const useFileUploadByPublicIdQuery = (publicId: string) => {
  return useQuery({
    queryKey: fileTrackingKeys.uploadByPublicId(publicId),
    queryFn: async () => {
      const response = await api.get<FileUpload>(
        `/file-tracking/uploads/public/${publicId}`
      )
      return response
    },
    enabled: !!publicId,
  })
}

/**
 * Hook cập nhật file upload
 */
export const useUpdateFileUploadMutation = () => {
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number
      data: UpdateFileUploadRequest
    }) => {
      const response = await api.putRaw<UpdateFileUploadResponse>(
        `/file-tracking/uploads/${id}`,
        data
      )
      return response
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(fileTrackingKeys.upload(variables.id), data)
      queryClient.invalidateQueries({ queryKey: fileTrackingKeys.uploads() })
      toast.success("Cập nhật file upload thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi cập nhật file upload")
    },
  })
}

/**
 * Hook xóa file upload
 */
export const useDeleteFileUploadMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<DeleteFileUploadResponse>(
        `/file-tracking/uploads/${id}`
      )
      return response
    },
    onSuccess: (_, variables) => {
      queryClient.removeQueries({
        queryKey: fileTrackingKeys.upload(variables),
      })
      queryClient.invalidateQueries({ queryKey: fileTrackingKeys.uploads() })
      toast.success("Xóa file upload thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi xóa file upload")
    },
  })
}

/**
 * Hook tìm các file không được sử dụng (orphaned)
 */
export const useOrphanedFilesQuery = () => {
  return useQuery({
    queryKey: fileTrackingKeys.orphaned(),
    queryFn: async () => {
      const response = await api.get<OrphanedFilesResponse>(
        "/file-tracking/uploads/orphaned"
      )
      return response
    },
  })
}

/**
 * Hook đánh dấu file để xóa
 */
export const useMarkFileForDeletionMutation = () => {
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number
      data: MarkFileForDeletionRequest
    }) => {
      const response = await api.putRaw<MarkFileForDeletionResponse>(
        `/file-tracking/uploads/${id}/mark-for-deletion`,
        data
      )
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fileTrackingKeys.uploads() })
      queryClient.invalidateQueries({
        queryKey: fileTrackingKeys.markedForDeletion(),
      })
      toast.success("Đánh dấu file để xóa thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi đánh dấu file để xóa")
    },
  })
}

/**
 * Hook tìm các file đã đánh dấu để xóa
 */
export const useMarkedForDeletionFilesQuery = () => {
  return useQuery({
    queryKey: fileTrackingKeys.markedForDeletion(),
    queryFn: async () => {
      const response = await api.get<MarkedForDeletionFilesResponse>(
        "/file-tracking/uploads/marked-for-deletion"
      )
      return response
    },
  })
}

// ========== ADDITIONAL FUNCTIONALITY HOOKS ==========

/**
 * Hook tìm kiếm file theo các tiêu chí
 */
export const useSearchFilesQuery = (params: FileSearchParams) => {
  return useQuery({
    queryKey: fileTrackingKeys.uploadsList(params),
    queryFn: async () => {
      const response = await api.get<FileUploadListResponse>(
        "/file-tracking/uploads/search",
        { params }
      )
      return response
    },
  })
}

/**
 * Hook lấy chi tiết file bao gồm các tham chiếu
 */
export const useFileDetailsQuery = (id: number) => {
  return useQuery({
    queryKey: fileTrackingKeys.upload(id),
    queryFn: async () => {
      const response = await api.get<FileDetails>(
        `/file-tracking/uploads/${id}/details`
      )
      return response
    },
    enabled: !!id,
  })
}

/**
 * Hook xóa mềm file upload
 */
export const useSoftDeleteFileMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.putRaw<DeleteFileUploadResponse>(
        `/file-tracking/uploads/${id}/soft-delete`
      )
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fileTrackingKeys.uploads() })
      toast.success("Xóa mềm file thành công!")
    },
    onError: (error: unknown) => {
      // Xử lý thông báo lỗi từ server theo chuẩn mới
      const errorResponse = error as { response?: { data?: ErrorResponse } }
      const errorMessage =
        errorResponse?.response?.data?.message ||
        (error as Error)?.message ||
        "Có lỗi xảy ra khi xóa mềm file"
      toast.error(errorMessage)
    },
  })
}

/**
 * Hook khôi phục file đã xóa mềm
 */
export const useRestoreFileMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.putRaw<UpdateFileUploadResponse>(
        `/file-tracking/uploads/${id}/restore`
      )
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fileTrackingKeys.uploads() })
      toast.success("Khôi phục file thành công!")
    },
    onError: (error: unknown) => {
      // Xử lý thông báo lỗi từ server theo chuẩn mới
      const errorResponse = error as { response?: { data?: ErrorResponse } }
      const errorMessage =
        errorResponse?.response?.data?.message ||
        (error as Error)?.message ||
        "Có lỗi xảy ra khi khôi phục file"
      toast.error(errorMessage)
    },
  })
}

/**
 * Hook tìm file theo URL
 */
export const useFileByUrlQuery = (fileUrl: string) => {
  return useQuery({
    queryKey: ["fileByUrl", fileUrl],
    queryFn: async () => {
      const response = await api.get<FileUpload>(
        "/file-tracking/uploads/by-url",
        {
          params: { fileUrl },
        }
      )
      return response
    },
    enabled: !!fileUrl,
  })
}

/**
 * Hook dọn dẹp các file không sử dụng
 */
export const useCleanupUnusedFilesMutation = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.postRaw<DeleteFileUploadResponse>(
        "/file-tracking/uploads/cleanup"
      )
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fileTrackingKeys.uploads() })
      queryClient.invalidateQueries({ queryKey: fileTrackingKeys.orphaned() })
      toast.success("Dọn dẹp file không sử dụng thành công!")
    },
    onError: (error: unknown) => {
      // Xử lý thông báo lỗi từ server theo chuẩn mới
      const errorResponse = error as { response?: { data?: ErrorResponse } }
      const errorMessage =
        errorResponse?.response?.data?.message ||
        (error as Error)?.message ||
        "Có lỗi xảy ra khi dọn dẹp file không sử dụng"
      toast.error(errorMessage)
    },
  })
}

/**
 * Hook lấy thống kê file tracking
 */
export const useFileTrackingStatsQuery = () => {
  return useQuery({
    queryKey: fileTrackingKeys.stats(),
    queryFn: async () => {
      const response = await api.get<FileTrackingStats>(
        "/file-tracking/uploads/stats"
      )
      return response
    },
  })
}

/**
 * Hook cập nhật metadata của file
 */
export const useUpdateFileMetadataMutation = () => {
  return useMutation({
    mutationFn: async ({
      id,
      metadata,
    }: {
      id: number
      metadata: Record<string, unknown>
    }) => {
      const response = await api.putRaw<FileUpload>(
        `/file-tracking/uploads/${id}/metadata`,
        {
          metadata,
        }
      )
      return response
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(fileTrackingKeys.upload(variables.id), data)
      queryClient.invalidateQueries({ queryKey: fileTrackingKeys.uploads() })
      toast.success("Cập nhật metadata file thành công!")
    },
    onError: (error: unknown) => {
      // Xử lý thông báo lỗi từ server theo chuẩn mới
      const errorResponse = error as { response?: { data?: ErrorResponse } }
      const errorMessage =
        errorResponse?.response?.data?.message ||
        (error as Error)?.message ||
        "Có lỗi xảy ra khi cập nhật metadata file"
      toast.error(errorMessage)
    },
  })
}

/**
 * Hook cập nhật tags của file
 */
export const useUpdateFileTagsMutation = () => {
  return useMutation({
    mutationFn: async ({ id, tags }: { id: number; tags: string[] }) => {
      const response = await api.putRaw<FileUpload>(
        `/file-tracking/uploads/${id}/tags`,
        {
          tags,
        }
      )
      return response
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(fileTrackingKeys.upload(variables.id), data)
      queryClient.invalidateQueries({ queryKey: fileTrackingKeys.uploads() })
      toast.success("Cập nhật tags file thành công!")
    },
    onError: (error: unknown) => {
      // Xử lý thông báo lỗi từ server theo chuẩn mới
      const errorResponse = error as { response?: { data?: ErrorResponse } }
      const errorMessage =
        errorResponse?.response?.data?.message ||
        (error as Error)?.message ||
        "Có lỗi xảy ra khi cập nhật tags file"
      toast.error(errorMessage)
    },
  })
}

// ========== FILE REFERENCE HOOKS ==========

/**
 * Hook tạo file reference mới
 */
export const useCreateFileReferenceMutation = () => {
  return useMutation({
    mutationFn: async (data: CreateFileReferenceRequest) => {
      const response = await api.postRaw<FileReference>(
        "/file-tracking/references",
        data
      )
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fileTrackingKeys.references() })
      toast.success("Tạo file reference thành công!")
    },
    onError: (error: unknown) => {
      // Xử lý thông báo lỗi từ server theo chuẩn mới
      const errorResponse = error as { response?: { data?: ErrorResponse } }
      const errorMessage =
        errorResponse?.response?.data?.message ||
        (error as Error)?.message ||
        "Có lỗi xảy ra khi tạo file reference"
      toast.error(errorMessage)
    },
  })
}

/**
 * Hook xóa file reference
 */
export const useDeleteFileReferenceMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<DeleteFileUploadResponse>(
        `/file-tracking/references/${id}`
      )
      return response
    },
    onSuccess: (_, variables) => {
      queryClient.removeQueries({
        queryKey: fileTrackingKeys.reference(variables),
      })
      queryClient.invalidateQueries({ queryKey: fileTrackingKeys.references() })
      toast.success("Xóa file reference thành công!")
    },
    onError: (error: unknown) => {
      // Xử lý thông báo lỗi từ server theo chuẩn mới
      const errorResponse = error as { response?: { data?: ErrorResponse } }
      const errorMessage =
        errorResponse?.response?.data?.message ||
        (error as Error)?.message ||
        "Có lỗi xảy ra khi xóa file reference"
      toast.error(errorMessage)
    },
  })
}

/**
 * Hook tăng số lượng tham chiếu của file
 */
export const useIncrementReferenceCountMutation = () => {
  return useMutation({
    mutationFn: async (fileUploadId: number) => {
      const response = await api.putRaw<FileUpload>(
        `/file-tracking/uploads/${fileUploadId}/increment-reference`
      )
      return response
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(fileTrackingKeys.upload(variables), data)
      queryClient.invalidateQueries({ queryKey: fileTrackingKeys.uploads() })
      toast.success("Tăng reference count thành công!")
    },
    onError: (error: unknown) => {
      // Xử lý thông báo lỗi từ server theo chuẩn mới
      const errorResponse = error as { response?: { data?: ErrorResponse } }
      const errorMessage =
        errorResponse?.response?.data?.message ||
        (error as Error)?.message ||
        "Có lỗi xảy ra khi tăng reference count"
      toast.error(errorMessage)
    },
  })
}

/**
 * Hook giảm số lượng tham chiếu của file
 */
export const useDecrementReferenceCountMutation = () => {
  return useMutation({
    mutationFn: async (fileUploadId: number) => {
      const response = await api.putRaw<FileUpload>(
        `/file-tracking/uploads/${fileUploadId}/decrement-reference`
      )
      return response
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(fileTrackingKeys.upload(variables), data)
      queryClient.invalidateQueries({ queryKey: fileTrackingKeys.uploads() })
      toast.success("Giảm reference count thành công!")
    },
    onError: (error: unknown) => {
      // Xử lý thông báo lỗi từ server theo chuẩn mới
      const errorResponse = error as { response?: { data?: ErrorResponse } }
      const errorMessage =
        errorResponse?.response?.data?.message ||
        (error as Error)?.message ||
        "Có lỗi xảy ra khi giảm reference count"
      toast.error(errorMessage)
    },
  })
}

/**
 * Hook lấy danh sách file reference theo entity
 */
export const useFileReferencesByEntityQuery = (
  entityType: string,
  entityId: number
) => {
  return useQuery({
    queryKey: fileTrackingKeys.referencesByEntity(entityType, entityId),
    queryFn: async () => {
      const response = await api.get<FileReference[]>(
        "/file-tracking/references",
        {
          params: { entityType, entityId },
        }
      )
      return response
    },
    enabled: !!entityType && !!entityId,
  })
}

/**
 * Hook xóa hàng loạt tất cả file reference của một entity
 */
export const useBatchRemoveEntityFileReferencesMutation = () => {
  return useMutation({
    mutationFn: async ({
      entityType,
      entityId,
    }: {
      entityType: string
      entityId: number
    }) => {
      const response = await api.delete<DeleteFileUploadResponse>(
        `/file-tracking/references/entity/${entityType}/${entityId}`
      )
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fileTrackingKeys.references() })
      toast.success("Xóa hàng loạt file references thành công!")
    },
    onError: (error: unknown) => {
      // Xử lý thông báo lỗi từ server theo chuẩn mới
      const errorResponse = error as { response?: { data?: ErrorResponse } }
      const errorMessage =
        errorResponse?.response?.data?.message ||
        (error as Error)?.message ||
        "Có lỗi xảy ra khi xóa hàng loạt file references"
      toast.error(errorMessage)
    },
  })
}

/**
 * Hook xóa file reference theo URL và entity
 */
export const useRemoveFileReferenceByUrlMutation = () => {
  return useMutation({
    mutationFn: async ({
      fileUrl,
      entityType,
      entityId,
    }: {
      fileUrl: string
      entityType: string
      entityId: number
    }) => {
      const response = await api.delete<DeleteFileUploadResponse>(
        "/file-tracking/references/by-url",
        {
          params: { fileUrl, entityType, entityId },
        }
      )
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fileTrackingKeys.references() })
      toast.success("Xóa file reference theo URL thành công!")
    },
    onError: (error: unknown) => {
      // Xử lý thông báo lỗi từ server theo chuẩn mới
      const errorResponse = error as { response?: { data?: ErrorResponse } }
      const errorMessage =
        errorResponse?.response?.data?.message ||
        (error as Error)?.message ||
        "Có lỗi xảy ra khi xóa file reference theo URL"
      toast.error(errorMessage)
    },
  })
}

/**
 * Hook xóa hàng loạt file reference theo danh sách URL
 */
export const useBatchRemoveFileReferencesByUrlsMutation = () => {
  return useMutation({
    mutationFn: async ({
      fileUrls,
      entityType,
      entityId,
    }: {
      fileUrls: string[]
      entityType: string
      entityId: number
    }) => {
      const response = await api.delete<DeleteFileUploadResponse>(
        "/file-tracking/references/batch-by-urls",
        {
          data: { fileUrls, entityType, entityId },
        }
      )
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fileTrackingKeys.references() })
      toast.success("Xóa hàng loạt file references theo URLs thành công!")
    },
    onError: (error: unknown) => {
      // Xử lý thông báo lỗi từ server theo chuẩn mới
      const errorResponse = error as { response?: { data?: ErrorResponse } }
      const errorMessage =
        errorResponse?.response?.data?.message ||
        (error as Error)?.message ||
        "Có lỗi xảy ra khi xóa hàng loạt file references theo URLs"
      toast.error(errorMessage)
    },
  })
}
