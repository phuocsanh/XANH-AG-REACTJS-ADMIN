import { useQuery, UseQueryOptions } from "@tanstack/react-query"
import api from "@/utils/api"
import { PaginationResponse, PaginationData } from "@/models/pagination"

interface PaginationParams {
  page?: number
  limit?: number
  [key: string]: unknown
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
      const response = await api.get<PaginationData<T>>(url, {
        params: defaultParams,
      })

      // Xử lý response theo các định dạng khác nhau
      if (Array.isArray(response)) {
        // Trường hợp response là mảng trực tiếp
        const paginationData: PaginationData<T> = {
          items: response as unknown as T[], // Ép kiểu đúng
          total: response.length,
          page: 1,
          limit: response.length,
          total_pages: 1,
          has_next: false,
          has_prev: false,
        }

        return {
          data: paginationData,
          status: 200,
          message: "Success",
          success: true,
        } as PaginationResponse<T>
      } else if (typeof response === "object" && response !== null) {
        // Kiểm tra kiểu an toàn hơn
        if (
          "items" in response &&
          Array.isArray((response as unknown as PaginationData<T>).items)
        ) {
          // Trường hợp response là PaginationData trực tiếp
          return {
            data: response as unknown as PaginationData<T>,
            status: 200,
            message: "Success",
            success: true,
          } as PaginationResponse<T>
        } else if (
          "data" in response &&
          Array.isArray(response.data) &&
          ("pagination" in response || "total" in response)
        ) {
          // Trường hợp response mới từ NestJS: { success: true, data: [items], pagination: { total, ... } }
          // Hoặc cấu trúc { data: [items], total, page, limit }
          const pagination = (response as any).pagination || response;
          const total = pagination.total ?? response.data.length;
          const pageNum = pagination.page ?? 1;
          const limitNum = pagination.limit ?? 10;
          
          return {
            data: {
              items: response.data,
              total: total,
              page: pageNum,
              limit: limitNum,
              total_pages: pagination.totalPages || Math.ceil(total / limitNum),
              has_next: pagination.has_next ?? (pageNum * limitNum < total),
              has_prev: pagination.has_prev ?? (pageNum > 1),
            },
            status: (response as any).status || 200,
            message: (response as any).message || "Success",
            success: (response as any).success ?? true,
          } as PaginationResponse<T>
        } else if (
          "data" in response &&
          typeof response.data === "object" &&
          response.data !== null &&
          "items" in response.data &&
          Array.isArray((response.data as unknown as PaginationData<T>).items)
        ) {
          // Trường hợp response có cấu trúc {success: boolean, data: PaginationData<T>, ...}
          return {
            data: response.data as unknown as PaginationData<T>,
            status: (response as unknown as { status?: number }).status || 200,
            message:
              (response as unknown as { message?: string }).message ||
              "Success",
            success:
              (response as unknown as { success?: boolean }).success !==
              undefined
                ? (response as unknown as { success?: boolean }).success
                : true,
          } as PaginationResponse<T>
        }
      }

      // Trả về response nguyên gốc nếu không khớp các định dạng trên
      const paginationData: PaginationData<T> = {
        items: [] as unknown as T[], // Ép kiểu đúng
        total: 0,
        page: 1,
        limit: 10,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      }

      return {
        data: paginationData,
        status: 200,
        message: "Success",
        success: true,
      } as PaginationResponse<T>
    },
    refetchOnMount: true, // Luôn refetch khi component mount
    staleTime: 0, // Data luôn được coi là stale, sẽ refetch khi invalidate
    ...options,
  })
}
