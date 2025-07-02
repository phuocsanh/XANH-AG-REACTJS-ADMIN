import { BasicDialogChildrenProps } from "@/components/basic-dialog"
import { UserPermission } from "."

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
