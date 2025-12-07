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
  console.log('🔍 mapSearchResponse - Input:', { apiResponse, page, limit })
  
  const result = {
    data: {
      items: apiResponse.data || [],
      total: apiResponse.pagination?.total || 0,
      page: page,
      limit: limit,
      total_pages: apiResponse.pagination?.totalPages || Math.ceil((apiResponse.pagination?.total || 0) / limit),
      has_next: page * limit < (apiResponse.pagination?.total || 0),
      has_prev: page > 1,
    },
    status: 200,
    message: 'Success',
    success: true
  }
  
  console.log('✅ mapSearchResponse - Output:', result)
  return result
}
