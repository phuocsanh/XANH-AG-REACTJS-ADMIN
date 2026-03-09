/**
 * Helper function để map response từ API search endpoint
 * API trả về: { success, data, pagination: { total, totalPages } }
 * Frontend expect: { data: { items, total, page, limit, ... } }
 */
export function mapSearchResponse<T>(
  apiResponse: {
    success: boolean
    data: T[]
    pagination: {
      total: number
      totalPages: number | null
    }
  },
  page: number,
  limit: number
) {
  // console.log('🔍 mapSearchResponse - Input:', { apiResponse, page, limit })
  
  // Bóc tách pagination linh hoạt
  const apiPagination = (apiResponse as any).pagination;
  const total = apiPagination?.total ?? (apiResponse as any).total ?? 0;
  const apiPage = apiPagination?.page ?? (apiResponse as any).page ?? page;
  const apiLimit = apiPagination?.limit ?? (apiResponse as any).limit ?? limit;
  const totalPages = apiPagination?.totalPages ?? (apiResponse as any).totalPages ?? Math.ceil(total / apiLimit);

  const result = {
    data: {
      items: apiResponse.data || [],
      total: total,
      page: apiPage,
      limit: apiLimit,
      total_pages: totalPages,
      has_next: apiPage * apiLimit < total,
      has_prev: apiPage > 1,
    },
    status: 200,
    message: 'Success',
    success: true
  }
  
  // console.log('✅ mapSearchResponse - Output:', result)
  return result;
}
