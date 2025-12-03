import { queryClient } from "@/provider/app-provider-tanstack"

/**
 * Helper function để invalidate tất cả queries liên quan đến một resource
 * Sử dụng exact: false để invalidate cả queries có params khác nhau
 * 
 * @param queryKeys - Mảng các queryKey cần invalidate
 * 
 * @example
 * invalidateResourceQueries(["/products"], ["products"])
 */
export const invalidateResourceQueries = (...queryKeys: unknown[][]) => {
  queryKeys.forEach((queryKey) => {
    queryClient.invalidateQueries({
      queryKey,
      exact: false,
    })
  })
}
