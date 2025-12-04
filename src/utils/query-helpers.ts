import { queryClient } from "@/provider/app-provider-tanstack"

/**
 * Helper function để invalidate tất cả queries liên quan đến một resource URL
 * Sử dụng exact: false để invalidate cả queries có params khác nhau
 * 
 * @param url - URL endpoint của resource (ví dụ: "/products", "/customers")
 * 
 * @example
 * invalidateResourceQueries("/products")
 */
export const invalidateResourceQueries = (url: string) => {
  queryClient.invalidateQueries({
    queryKey: [url],
    exact: false,
  })
}
