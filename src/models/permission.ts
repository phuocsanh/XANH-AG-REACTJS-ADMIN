import { z } from "zod"

export const permissionGroupSchema = z.object({
  // creatorId: 0,
  // createdTime: '2023-09-21T03:57:41.173Z',
  // updaterId: 0,
  // updatedTime: '2023-09-21T03:57:41.173Z',
  isActive: z.boolean(),
  id: z.number(),
  name: z.string(),
  description: z.string(),
  sort: z.number(),
  permission: z.array(
    z.object({
      permissionId: z.number(),
      permissionName: z.string(),
    })
  ),
})

export type PermissionGroup = z.infer<typeof permissionGroupSchema>

// Thay thế ArrayElement bằng cách định nghĩa trực tiếp
export type PermissionGroupItem = PermissionGroup["permission"][number]

// Thêm định nghĩa UserPermission
export interface PermissionMethod {
  isCreate: boolean
  isUpdate: boolean
  isDelete: boolean
  isPrint: boolean
  isShow: boolean
  isImport: boolean
  isExport: boolean
}

export interface UserPermission extends PermissionMethod {
  permissionName?: string
  userName?: string
  id: number
  userId: number
  permissionId: number
}

export interface Permission extends PermissionMethod {
  id: number
  isActive: boolean
  name: string
  description: string
  sort: number
}
