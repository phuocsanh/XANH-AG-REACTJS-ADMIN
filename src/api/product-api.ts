import api from "@/utils/api"
import { Product } from "@/models/product.model"

// Interface cho API response theo đúng format của ComboBox
interface ProductSearchResponse {
  data: Array<{ value: number; label: string }>
  total: number
  hasMore: boolean
  nextPage?: number
}

/**
 * API function để search sản phẩm cho ComboBox
 * @param params - Các tham số tìm kiếm
 * @returns Promise với dữ liệu theo format của ComboBox
 */
export async function searchProducts({
  page = 1,
  limit = 20,
  search = "",
}: {
  page?: number
  limit?: number
  search?: string
}): Promise<ProductSearchResponse> {
  // Log để debug
  console.log("searchProducts called with:", { page, limit, search })

  try {
    // Nếu không có search term, load danh sách sản phẩm mặc định
    if (!search || search.trim().length === 0) {
      console.log("Loading default product list")

      // Tạo DTO để lấy danh sách sản phẩm mặc định (không có filter)
      const searchDto = {
        filters: [],
        operator: "AND",
      }

      // Gọi API để lấy danh sách sản phẩm mặc định
      const response = await api.postRaw<Product[]>(
        "/products/search",
        searchDto,
        {
          params: {
            page,
            limit,
          },
        }
      )

      // Log để debug
      console.log("Default product list response:", response)
      console.log("Response type:", typeof response)
      console.log("Is array:", Array.isArray(response))

      // Kiểm tra response có tồn tại và là mảng không
      if (!response || !Array.isArray(response)) {
        console.log(
          "Default product list response is not an array or is empty, returning empty result"
        )
        return {
          data: [],
          total: 0,
          hasMore: false,
          nextPage: undefined,
        }
      }

      // Log thông tin items
      console.log("Processing default items:", response.length, "items found")

      // Chuyển đổi dữ liệu sang format của ComboBox
      const data = response.map((product) => ({
        value: product.id,
        label: product.productName,
      }))

      // Log để debug
      console.log("Mapped default data for ComboBox:", data)

      // Trả về dữ liệu theo đúng format - có hỗ trợ load more
      return {
        data,
        total: response.length,
        hasMore: response.length >= limit, // Có thể còn trang tiếp theo nếu số lượng >= limit
        nextPage: response.length >= limit ? page + 1 : undefined,
      }
    }

    // Có search term - thực hiện tìm kiếm
    // Tạo search DTO theo format mới của server
    const searchDto = {
      filters: [
        {
          field: "productName",
          operator: "ilike",
          value: `%${search.trim()}%`,
        },
      ],
      operator: "AND",
    }

    // Gọi API POST /products/search với đúng format, truyền page và limit qua params
    const response = await api.postRaw<Product[]>(
      "/products/search",
      searchDto,
      {
        params: {
          page,
          limit,
        },
      }
    )

    // Log để debug
    console.log("Search product response:", response)
    console.log("Response type:", typeof response)
    console.log("Is array:", Array.isArray(response))

    // Kiểm tra response có tồn tại và là mảng không
    if (!response || !Array.isArray(response)) {
      console.log(
        "Search product response is not an array or is empty, returning empty result"
      )
      return {
        data: [],
        total: 0,
        hasMore: false,
        nextPage: undefined,
      }
    }

    // Log thông tin items
    console.log("Processing search items:", response.length, "items found")

    // Chuyển đổi dữ liệu sang format của ComboBox
    const data = response.map((product) => ({
      value: product.id,
      label: product.productName,
    }))

    // Log để debug
    console.log("Mapped search data for ComboBox:", data)

    // Trả về dữ liệu theo đúng format - có hỗ trợ load more
    return {
      data,
      total: response.length,
      hasMore: response.length >= limit, // Có thể còn trang tiếp theo nếu số lượng >= limit
      nextPage: response.length >= limit ? page + 1 : undefined,
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
