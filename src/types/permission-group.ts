import { z } from 'zod';
import { ArrayElement } from '.';

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
});

export type PermissionGroup = z.infer<typeof permissionGroupSchema>;
export type PermissionGroupItem = ArrayElement<PermissionGroup['permission']>;
