import { useQuery, UseQueryOptions } from "@tanstack/react-query"
import api from "@/utils/api"

interface PaginationParams {
  page?: number
  limit?: number
  [key: string]: unknown
}

interface PaginationResponse<T> {
  data: T
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  meta?: Record<string, unknown>
}

/**
 * Hook dùng chung để xử lý phân trang
 * @param url - Endpoint API
 * @param params - Tham số cho API call
 * @param options - Tùy chọn cho useQuery
 */
export const usePaginationQuery = <T>(
  url: string & (T extends void ? "Bạn chưa khai báo kiểu trả về" : string),
  params?: PaginationParams,
  options?: Omit<
    UseQueryOptions<PaginationResponse<T>, Error>,
    "queryKey" | "queryFn"
  >
) => {
  // Thêm tham số phân trang mặc định
  const defaultParams = {
    page: 1,
    limit: 10,
    ...params,
  }

  return useQuery<PaginationResponse<T>, Error>({
    queryKey: [url, defaultParams],
    queryFn: async () => {
      const response = await api.get<T>(url, {
        params: defaultParams,
      })

      // Xử lý response theo các định dạng khác nhau
      if (Array.isArray(response)) {
        // Trường hợp response là mảng trực tiếp
        return {
          data: response as unknown as T,
        } as PaginationResponse<T>
      } else if (typeof response === "object" && response !== null) {
        // Trường hợp response có cấu trúc {success: boolean, data: T, ...}
        if ("data" in response) {
          return {
            data: response.data as T,
            pagination:
              "pagination" in response
                ? (response.pagination as PaginationResponse<T>["pagination"])
                : undefined,
            meta: "meta" in response ? response.meta : undefined,
          } as PaginationResponse<T>
        }
      }

      // Trả về response nguyên gốc nếu không khớp các định dạng trên
      return {
        data: response as unknown as T,
      } as PaginationResponse<T>
    },
    ...options,
  })
}
