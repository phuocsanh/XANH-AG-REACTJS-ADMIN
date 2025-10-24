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
  statusText: string
}

type Paging = {
  p?: number
  limit?: number
}

export type PagingParams<P = void> = P extends void ? Paging | void : Paging & P

export type PagingResponseData<D> = ApiResponse & {
  data: {
    currentPage: number
    totalPages: number
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

// Các định nghĩa từ common.model.ts
import { BasicDialogChildrenProps } from "@/components/basic-dialog"
import { UserPermission } from "./permission"

export type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never

export type UploadPayloadType = {
  File: Blob
  Type: string
  Folder: string
}

export type UploadResponse = {
  filename: string
  size: number
  type: string
  path: string
}

export type FormInsideModalProps<T extends { id: number }> = {
  role?: UserPermission
  editId: T["id"]
} & BasicDialogChildrenProps

export type FilterColumnOption = { id: number; _id: string; label: string } & {
  [key: string | number]: unknown
}
