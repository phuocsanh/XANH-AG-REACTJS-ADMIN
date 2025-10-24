export type ResponseSuccess<T> = {
  code: number
  data: T
  message: string
  fieldName?: string
}

export type ResponseFailure = {
  code: number
  fieldName: string
  message: string
}

export type PaginationResponse<T, TSummary = never> = {
  items: T[]
  pageIndex: number
  pageSize: number
  total: number
  summary?: TSummary
}

export type ExportResponse = {
  path: string
}

export type FieldColumn = {
  column: string
  keySearch: string
  expression: string
}

export type QueryListPayloadType = {
  filterColumn: FieldColumn[]
  searchStartDate?: Date | null
  searchEndDate?: Date | null
  idSearch?: number
  pageIndex?: number
  pageSize?: number
  sortColumn: string
  sortOrder: number
}

export type QueryListComponentType = {
  keySearch: string
  id: number
  pageIndex: number
  pageSize: number
  isGetAll: boolean
}

export type ListComponentResponse = {
  name?: string
  code?: string
  title?: string
  id: number
  _id?: string
}
