// Interface cho dữ liệu phân trang
export interface PaginationData<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// Interface cho response API phân trang
export interface PaginationResponse<T> {
  data: PaginationData<T>
  status: number
  message: string
  success: boolean
}
