import { useQuery, useInfiniteQuery, useMutation } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { queryClient } from "@/provider/app-provider-tanstack"
import {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ExtendedProductListParams,
} from "@/models/product.model"
import { handleApiError } from "@/utils/error-handler"
import { mapSearchResponse } from "@/utils/api-response-mapper"


// Query keys cho product
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params: ExtendedProductListParams) =>
    [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: number) => [...productKeys.details(), id] as const,
  search: (searchTerm: string) =>
    [...productKeys.all, "search", searchTerm] as const,
  // Thêm key cho multiple products
  multiple: (ids: number[]) => [...productKeys.all, "multiple", ids] as const,
}

// Interface cho API response theo đúng format của ComboBox
export interface ProductSearchResponse {
  data: Array<any>
  total: number
  hasMore: boolean
  nextPage?: number
}

interface SearchProductsParams {
  page: number
  limit: number
  search?: string
}

// Hàm search sản phẩm mới với phân trang đúng
export const searchProductsApi = async ({
  page,
  limit,
  search = "",
}: SearchProductsParams): Promise<ProductSearchResponse> => {
  try {
    // Log để debug


    // Luôn gọi API POST /products/search cho cả trường hợp mặc định và tìm kiếm
    // Tạo search DTO theo format mới của server - dùng flat params
    const searchDto: any = {
      page,
      limit,
    }

    // Thêm keyword nếu có search term
    if (search.trim()) {
      searchDto.keyword = search.trim()
    }

    // Gọi API POST /products/search với đúng format
    const response = await api.postRaw<
      | {
          data: Product[]
          page: number
          limit: number
          total: number
        }
      | Product[]
    >("/products/search", searchDto)

    // Log để debug


    // Xử lý response - có thể là array trực tiếp hoặc object có data property
    let products: Product[] = []
    let total = 0
    let currentPage = page
    let currentLimit = limit

    // Xử lý response linh hoạt cho mọi trường hợp
    if (Array.isArray(response)) {
      // Case 1: Response là array trực tiếp
      products = response
      total = response.length
    } 
    else if (response && typeof response === 'object') {
      const respAny = response as any;
      
      // Case 2: Response chuẩn { data: [], pagination: {} }
      if (Array.isArray(respAny.data)) {
          products = respAny.data;

          if (respAny.pagination) {
             total = respAny.pagination.total;
             currentPage = respAny.pagination.page;
             currentLimit = respAny.pagination.limit;
          } else {
             total = respAny.total || products.length;
             currentPage = respAny.page || page;
             currentLimit = respAny.limit || limit;
          }
      }
      // Case 3: Double wrap { data: { data: [] } } - phòng hờ
      else if (respAny.data && Array.isArray(respAny.data.data)) {
          products = respAny.data.data;
          
          if (respAny.data.pagination) {
             total = respAny.data.pagination.total;
          } else {
             total = respAny.data.total || products.length;
          }
      }
    }

    // Chuyển đổi dữ liệu sang format của ComboBox
    const data = products.map((product: Product) => ({
      ...product,
      value: product.id,
      label: product.trade_name?.trim() || product.name?.trim() || `Sản phẩm ${product.id}`,
    }))

    // Log để debug


    // Tính toán hasMore dựa trên total và page/limit
    const hasMore = total > currentPage * currentLimit

    // Trả về dữ liệu theo đúng format - có hỗ trợ load more
    return {
      data,
      total,
      hasMore,
      nextPage: hasMore ? currentPage + 1 : undefined,
    }
  } catch (error) {
    console.error("Error searching products:", error)
    handleApiError(error, "Có lỗi xảy ra khi tìm kiếm sản phẩm")
    // Trả về kết quả rỗng khi có lỗi
    return {
      data: [],
      total: 0,
      hasMore: false,
      nextPage: undefined,
    }
  }
}

/**
 * Hàm lấy thông tin chi tiết nhiều sản phẩm theo IDs
 */
export const getProductsByIds = async (ids: number[]): Promise<Product[]> => {
  try {
    // TODO: Kiểm tra xem backend có hỗ trợ filter theo IDs không
    // Nếu không, cần gọi từng product riêng lẻ hoặc yêu cầu backend thêm endpoint mới
    
    // Tạm thời dùng cách gọi từng product
    const products = await Promise.all(
      ids.map(async (id) => {
        try {
          const response = await api.get<Product>(`/products/${id}`)
          return response
        } catch (error) {
          console.error(`Error fetching product ${id}:`, error)
          return null
        }
      })
    )

    return products.filter((p): p is Product => p !== null)
  } catch (error) {
    console.error("Error fetching products by IDs:", error)
    handleApiError(error, "Có lỗi xảy ra khi lấy thông tin sản phẩm")
    return []
  }
}

/**
 * Hook lấy thông tin chi tiết nhiều sản phẩm theo IDs
 */
export const useProductsByIdsQuery = (ids: number[]) => {
  return useQuery({
    queryKey: productKeys.multiple(ids),
    queryFn: () => getProductsByIds(ids),
    enabled: ids.length > 0,
  })
}

/**
 * Hook search sản phẩm cho ComboBox với infinite loading
 */
export const useProductSearch = (
  searchTerm: string = "",
  limit: number = 20,
  enabled: boolean = true
) => {
  return useInfiniteQuery<ProductSearchResponse, Error>({
    queryKey: productKeys.search(searchTerm),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await searchProductsApi({
        page: pageParam as number,
        limit,
        search: searchTerm,
      })

      // Log để debug


      return response
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      // Log để debug


      // Nếu còn dữ liệu thì trả về page tiếp theo
      return lastPage.hasMore ? lastPage.nextPage : undefined
    },
    enabled: enabled, // Luôn enable để fetch dữ liệu mặc định
    staleTime: 0,
    gcTime: 0,
  })
}

/**
 * Hook lấy danh sách sản phẩm (POST /products/search)
 */
// Hook lấy danh sách sản phẩm (POST /products/search)
export const useProductsQuery = (params?: Record<string, any>) => {
  const page = (params?.page as number) || 1
  const limit = (params?.limit as number) || 10

  return useQuery({
    queryKey: productKeys.list(params || {}),
    queryFn: async () => {
      // Build Payload chuẩn Flat Params
      const payload: any = {
        page,
        limit,
      };

      if (params?.keyword) payload.keyword = params.keyword;
      if (params?.trade_name) payload.trade_name = params.trade_name;
      if (params?.name) payload.name = params.name;
      if (params?.code) payload.code = params.code;
      if (params?.status) payload.status = params.status;
      if (params?.type_id) payload.type_id = params.type_id; // Filter theo loại SP

      // Sort
      if (params?.sort_by) {
        const field = String(params.sort_by);
        const dir = String(params.sort_direction || 'DESC');
        payload.sort = `${field}:${dir}`; 
      }

      const response = await api.postRaw<{
        success: boolean
        data: Product[]
        pagination: {
          total: number
          totalPages: number | null
        }
      }>('/products/search', payload)

      return mapSearchResponse(response, page, limit)
    },
    refetchOnMount: true,
    staleTime: 0,
  })
}


/**
 * Hook lấy thông tin chi tiết một sản phẩm
 */
export const useProductQuery = (id: number) => {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<Product>(`/products/${id}`)
      return response
    },
    enabled: !!id,
  })
}

/**
 * Hook tạo sản phẩm mới
 */
export const useCreateProductMutation = () => {
  return useMutation({
    mutationFn: async (productData: CreateProductRequest) => {
      const response = await api.postRaw<Product>("/products", productData)
      return response
    },
    onSuccess: () => {
      // Invalidate tất cả queries liên quan đến products
      queryClient.invalidateQueries({ 
        queryKey: ["/products"],
        exact: false 
      })
      toast.success("Tạo sản phẩm thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi tạo sản phẩm")
    },
  })
}

/**
 * Hook cập nhật thông tin sản phẩm
 */
export const useUpdateProductMutation = () => {
  return useMutation({
    mutationFn: async ({
      id,
      productData,
    }: {
      id: number
      productData: UpdateProductRequest
    }) => {
      const response = await api.putRaw<Product>(
        `/products/${id}`,
        productData
      )
      return response
    },
    onSuccess: (data, variables) => {
      // Invalidate tất cả queries liên quan đến products
      queryClient.invalidateQueries({ 
        queryKey: ["/products"],
        exact: false 
      })
      // Invalidate query detail cụ thể
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.id),
      })
      toast.success("Cập nhật thông tin sản phẩm thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi cập nhật thông tin sản phẩm")
    },
  })
}

/**
 * Hook xóa sản phẩm
 */
export const useDeleteProductMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<void>(`/products/${id}`)
      return response
    },
    onSuccess: () => {
      // Invalidate tất cả queries liên quan đến products
      queryClient.invalidateQueries({ 
        queryKey: ["/products"],
        exact: false 
      })
      toast.success("Xóa sản phẩm thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi xóa sản phẩm")
    },
  })
}
