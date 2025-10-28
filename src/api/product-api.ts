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
  try {
    // Gọi API với tham số tìm kiếm
    const response = await api.get<Product[]>("/products", {
      params: {
        params: {
          search: search || undefined,
          limit,
          offset: (page - 1) * limit,
        },
      },
    })

    // Chuyển đổi dữ liệu sang format của ComboBox
    const data = response.map((product) => ({
      value: product.id,
      label: product.productName,
    }))

    // Trả về dữ liệu theo đúng format
    return {
      data,
      total: response.length,
      hasMore: response.length === limit, // Nếu số lượng trả về bằng limit thì có thể còn trang tiếp theo
      nextPage: response.length === limit ? page + 1 : undefined,
    }
  } catch (error) {
    console.error("Error searching products:", error)
    throw error
  }
}
