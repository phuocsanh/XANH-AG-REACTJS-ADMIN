export interface PermissionMethod {
  isCreate: boolean;
  isUpdate: boolean;
  isDelete: boolean;
  isPrint: boolean;
  isShow: boolean;
  isImport: boolean;
  isExport: boolean;
}

export interface UserPermission extends PermissionMethod {
  permissionName?: string;
  userName?: string;
  id: number;
  userId: number;
  permissionId: number;
}

export interface Permission extends PermissionMethod {
  id: number;
  isActive: boolean;
  name: string;
  description: string;
  sort: number;
}
