import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { queryClient } from "@/provider/app-provider-tanstack"
import { ProductUnitConversion } from "../models/product.model"
import { handleApiError } from "@/utils/error-handler"

// Query keys cho product unit conversion
export const productUnitConversionKeys = {
  all: ["product-unit-conversions"] as const,
  byProduct: (productId: number) => [...productUnitConversionKeys.all, "product", productId] as const,
}

/**
 * Hook lấy danh sách quy đổi đơn vị theo sản phẩm
 */
export const useProductUnitConversionsQuery = (productId: number) => {
  return useQuery({
    queryKey: productUnitConversionKeys.byProduct(productId),
    queryFn: async () => {
      const response = await api.get<ProductUnitConversion[]>(`/product-unit-conversions/product/${productId}`)
      return response
    },
    enabled: !!productId,
  })
}

/**
 * Hook lưu tất cả quy đổi đơn vị cho một sản phẩm
 */
export const useSaveAllProductUnitConversionsMutation = () => {
  return useMutation({
    mutationFn: async ({
      productId,
      conversions,
    }: {
      productId: number
      conversions: ProductUnitConversion[]
    }) => {
      const response = await api.postRaw<ProductUnitConversion[]>(
        `/product-unit-conversions/product/${productId}/save-all`,
        { conversions }
      )
      return response
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: productUnitConversionKeys.byProduct(variables.productId),
      })
      toast.success("Lưu quy đổi đơn vị tính thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error)
    },
  })
}
