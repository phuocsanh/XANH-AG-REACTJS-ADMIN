import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { queryClient } from "@/provider/app-provider-tanstack"
import { handleApiError } from "@/utils/error-handler"

// Interface cho News
export interface News {
  id: number
  title: string
  slug: string
  category?: string
  content: string
  thumbnail_url?: string
  images: string[]
  author?: string
  status: string
  tags: string[]
  views: number
  created_at: string
  updated_at: string
  related_product_ids?: number[]
  is_pinned: boolean
}

export interface CreateNewsRequest {
  title: string
  category?: string
  content: string
  thumbnail_url?: string
  images?: string[]
  author?: string
  status?: string
  tags?: string[]
  related_product_ids?: number[]
  is_pinned?: boolean
  [key: string]: unknown // Cho phép truyền vào AnyObject
}

export type UpdateNewsRequest = Partial<CreateNewsRequest>

export interface NewsSearchResponse {
  items: News[]
  total: number
  page: number
  limit: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

// Query keys cho news
export const newsKeys = {
  all: ["news"] as const,
  lists: () => [...newsKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) => [...newsKeys.lists(), params] as const,
  details: () => [...newsKeys.all, "detail"] as const,
  detail: (id: number) => [...newsKeys.details(), id] as const,
}

/**
 * Hook lấy danh sách bài viết
 */
export const useNewsQuery = (params?: Record<string, unknown>) => {
  const page = (params?.page as number) || 1
  const limit = (params?.limit as number) || 10

  return useQuery({
    queryKey: newsKeys.list(params || {}),
    queryFn: async () => {
      const payload = {
        page,
        limit,
        ...params
      };

      const response = await api.postRaw<{data: News[]
        total: number
        page: number
        limit: number
        pagination?: any
      }>('/news/search', payload)

      return {
        items: response.data || [],
        total: (response.pagination?.total ?? response.total) || 0,
        page: page,
        limit: limit,
        total_pages: Math.ceil((response.total || 0) / limit),
        has_next: page * limit < (response.total || 0),
        has_prev: page > 1,
      } as NewsSearchResponse
    },
  })
}

/**
 * Hook lấy chi tiết bài viết
 */
export const useNewsDetailQuery = (id: number) => {
  return useQuery({
    queryKey: newsKeys.detail(id),
    queryFn: async () => {
      return await api.get<News>(`/news/${id}`)
    },
    enabled: !!id,
  })
}

/**
 * Hook tạo bài viết mới
 */
export const useCreateNewsMutation = () => {
  return useMutation({
    mutationFn: async (data: CreateNewsRequest) => {
      return await api.postRaw<News>("/news", data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsKeys.all })
      toast.success("Tạo bài viết thành công!")
    },
    onError: (error: Error | unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi tạo bài viết")
    }
  })
}

/**
 * Hook cập nhật bài viết
 */
export const useUpdateNewsMutation = () => {
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateNewsRequest }) => {
      return await api.patchRaw<News>(`/news/${id}`, data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: newsKeys.all })
      queryClient.invalidateQueries({ queryKey: newsKeys.detail(variables.id) })
      toast.success("Cập nhật bài viết thành công!")
    },
    onError: (error: Error | unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi cập nhật bài viết")
    }
  })
}

/**
 * Hook xóa bài viết
 */
export const useDeleteNewsMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      return await api.delete<void>(`/news/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsKeys.all })
      toast.success("Xóa bài viết thành công!")
    },
    onError: (error: Error | unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi xóa bài viết")
    }
  })
}
