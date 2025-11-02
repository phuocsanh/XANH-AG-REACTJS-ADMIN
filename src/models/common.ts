// Các định nghĩa từ common.model.ts
import { BasicDialogChildrenProps } from "@/components/basic-dialog"
import { UserPermission } from "./permission"

export type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never

export type UploadPayloadType = {
  file: Blob
  type: string
  folder: string
}

export type UploadResponse = {
  filename: string
  size: number
  type: string
  path: string
}

export type FormInsideModalProps<T extends { id: number }> = {
  role?: UserPermission
  edit_id: T["id"]
} & BasicDialogChildrenProps

export type FilterColumnOption = { id: number; _id: string; label: string } & {
  [key: string | number]: unknown
}

// ========== CÁC ĐỊNH NGHĨA MỚI CHO RESPONSE ==========
// Interface cho metadata trong response
export interface ResponseMeta {
  timestamp: string
  path: string
  method: string
}

// Interface cho thông tin phân trang
export interface PaginationInfo {
  total: number
  page: number
  limit: number
  total_pages: number
}

// Interface cho response thành công không phân trang
export interface SuccessResponse<T> {
  success: true
  data: T
  meta: ResponseMeta
}

// Interface cho response thành công có phân trang
export interface PaginatedSuccessResponse<T> {
  success: true
  data: T[]
  meta: ResponseMeta
  pagination: PaginationInfo
}

// Interface cho lỗi RFC 7807
export interface RFC7807Error {
  type: string
  title: string
  status: number
  detail: string
  instance?: string
  details?: Array<{
    field?: string
    message: string
  }>
}

// Interface cho lỗi validation
export interface ValidationError {
  details: Array<{
    field?: string
    message: string
  }>
}

// ========== CÁC ĐỊNH NGHĨA CŨ ==========
enum Role {
  ADMIN = "admin",
  CUSTOMMER = "custommer",
}
export const RoleValues = [Role.ADMIN, Role.CUSTOMMER] as const

// Enum Status chung để sử dụng cho tất cả các bảng
export enum Status {
  ACTIVE = "active",
  INACTIVE = "inactive",
  ARCHIVED = "archived",
}
export const StatusValues = [
  Status.ACTIVE,
  Status.INACTIVE,
  Status.ARCHIVED,
] as const

export enum API_CODE {
  SUCCESS = 200,
  FAILURE = 400,
}
export type ApiResponse = {
  code: number
  message: string
}

export type ResponseData<D> = ApiResponse & {
  data: D
}
export type ApiResponseError = {
  status: number
  status_text: string
}

type Paging = {
  p?: number
  limit?: number
}

export type PagingParams<P = void> = P extends void ? Paging | void : Paging & P

export type PagingResponseData<D> = ApiResponse & {
  data: {
    current_page: number
    total_pages: number
    total: number
    data: D[]
  }
}

export type Timeout = ReturnType<typeof setTimeout>

export type Interval = ReturnType<typeof setInterval>
export type AnyObject = { [key: string]: unknown }
export type UploadFile = {
  uri: string
  name: string
  type: string
}
