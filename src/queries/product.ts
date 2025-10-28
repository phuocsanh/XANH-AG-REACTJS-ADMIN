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
}

// Interface cho API response theo đúng format của ComboBox
export interface ProductSearchResponse {
  data: Array<{ value: number; label: string }>
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
    console.log("Searching products with params:", { page, limit, search })

    // Luôn gọi API POST /products/search cho cả trường hợp mặc định và tìm kiếm
    // Tạo search DTO theo format mới của server - bao gồm page và limit trong body
    const searchDto = {
      page,
      limit,
      filters: search.trim()
        ? [
            {
              field: "productName",
              operator: "ilike",
              value: `%${search.trim()}%`,
            },
          ]
        : [],
      operator: "AND",
    }

    // Gọi API POST /products/search với đúng format, page và limit trong body
    const response = await api.postRaw<{
      data: Product[]
      page: number
      limit: number
      total: number
    }>("/products/search", searchDto)

    // Log để debug
    console.log("Search product response:", response)

    // Kiểm tra response có tồn tại không
    if (!response || !response.data) {
      console.log(
        "Search product response is invalid or empty, returning empty result"
      )
      return {
        data: [],
        total: 0,
        hasMore: false,
        nextPage: undefined,
      }
    }

    // Chuyển đổi dữ liệu sang format của ComboBox
    const data = response.data.map((product: Product) => ({
      value: product.id,
      label: product.name?.trim() || `Sản phẩm ${product.id}`,
    }))

    // Log để debug
    console.log("Mapped search data for ComboBox:", data)

    // Tính toán hasMore dựa trên total và page/limit
    const hasMore = response.total > response.page * response.limit

    // Trả về dữ liệu theo đúng format - có hỗ trợ load more
    return {
      data,
      total: response.total,
      hasMore,
      nextPage: hasMore ? response.page + 1 : undefined,
    }
  } catch (error) {
    console.error("Error searching products:", error)
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
      console.log("useProductSearch response:", response)
      console.log("useProductSearch pageParam:", pageParam)

      return response
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      // Log để debug
      console.log("getNextPageParam lastPage:", lastPage)
      console.log("getNextPageParam hasMore:", lastPage.hasMore)
      console.log("getNextPageParam nextPage:", lastPage.nextPage)

      // Nếu còn dữ liệu thì trả về page tiếp theo
      return lastPage.hasMore ? lastPage.nextPage : undefined
    },
    enabled: enabled, // Luôn enable để fetch dữ liệu mặc định
  })
}

/**
 * Hook lấy danh sách sản phẩm
 */
export const useProductsQuery = (params?: ExtendedProductListParams) => {
  return useQuery({
    queryKey: productKeys.list(params || {}),
    queryFn: async () => {
      const response = await api.get<Product[]>("/products", {
        params: { params },
      })
      return response
    },
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
      // Invalidate và refetch danh sách products
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      toast.success("Tạo sản phẩm thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi tạo sản phẩm:", error)
      toast.error("Có lỗi xảy ra khi tạo sản phẩm")
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
      const response = await api.patchRaw<Product>(
        `/products/${id}`,
        productData
      )
      return response
    },
    onSuccess: (data, variables) => {
      // Invalidate các queries liên quan
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.id),
      })
      toast.success("Cập nhật thông tin sản phẩm thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi cập nhật sản phẩm:", error)
      toast.error("Có lỗi xảy ra khi cập nhật thông tin sản phẩm")
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
      // Invalidate danh sách products
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      toast.success("Xóa sản phẩm thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi xóa sản phẩm:", error)
      toast.error("Có lỗi xảy ra khi xóa sản phẩm")
    },
  })
}
