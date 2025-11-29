import { UserResponse } from "@/models/auth.model";

/**
 * Kiểm tra user có quyền cụ thể hay không
 * @param user User object từ store
 * @param requiredPermission Mã quyền cần kiểm tra (VD: 'USER_VIEW')
 * @returns boolean
 */
export const hasPermission = (user: UserResponse | null | undefined, requiredPermission: string): boolean => {
  // Nếu không có user, return false
  if (!user) return false;
  
  // Super Admin luôn có quyền
  if (user.role?.code === 'SUPER_ADMIN') return true;

  // Nếu không có role hoặc permissions, return false
  if (!user.role || !user.role.permissions) return false;

  return user.role.permissions.some(p => p.code === requiredPermission);
};

/**
 * Kiểm tra user có ít nhất một trong các quyền trong danh sách
 * @param user User object từ store
 * @param permissionsArray Danh sách mã quyền
 * @returns boolean
 */
export const hasAnyPermission = (user: UserResponse | null | undefined, permissionsArray: string[]): boolean => {
  if (!user || !user.role) return false;
  
  if (user.role.code === 'SUPER_ADMIN') return true;
  
  if (!user.role.permissions) return false;

  return user.role.permissions.some(p => permissionsArray.includes(p.code));
};

/**
 * Kiểm tra user có phải là Admin (SUPER_ADMIN hoặc ADMIN) hay không
 */
export const isAdmin = (user: UserResponse | null | undefined): boolean => {
  if (!user || !user.role) return false;
  return ['SUPER_ADMIN', 'ADMIN'].includes(user.role.code);
};

/**
 * Kiểm tra user hiện tại có thể quản lý (sửa/xóa/kích hoạt) user khác không
 * @param currentUser User đang đăng nhập
 * @param targetUser User cần quản lý
 * @returns boolean
 */
export const canManageUser = (
  currentUser: UserResponse | null | undefined,
  targetUser: UserResponse | null | undefined
): boolean => {
  if (!currentUser || !targetUser) return false;

  // Không thể tự quản lý chính mình (xóa, vô hiệu hóa, kích hoạt)
  if (currentUser.id === targetUser.id || currentUser.user_id === targetUser.id || 
      (targetUser.user_id && currentUser.id === targetUser.user_id)) {
      return false;
  }

  // Fallback: Nếu không có role nhưng account là admin, cho phép quản lý
  // (Trừ khi target là super admin khác)
  const isFallbackAdmin = !currentUser.role && (currentUser.account === 'admin' || currentUser.user_account === 'admin');
  
  if (isFallbackAdmin) {
     // Admin fallback không thể quản lý Super Admin (giả sử role_id 1 là Super Admin)
     const targetRoleId = targetUser.role?.id || (targetUser as any).role_id;
     if (targetRoleId === 1) return false;
     return true;
  }

  if (!currentUser.role || !targetUser.role) {
    // Nếu target user có role_id nhưng không có role object, ta vẫn có thể check
    const targetRoleId = (targetUser as any).role_id;
    if (currentUser.role?.code === 'SUPER_ADMIN') return true;
    if (currentUser.role?.code === 'ADMIN') {
        // Admin không thể quản lý Super Admin (1) hoặc Admin (2)
        return ![1, 2].includes(targetRoleId);
    }
    return false;
  }

  // Super Admin có thể quản lý tất cả
  if (currentUser.role.code === 'SUPER_ADMIN') return true;

  // Admin không thể quản lý Super Admin hoặc Admin khác
  if (currentUser.role.code === 'ADMIN') {
    return !['SUPER_ADMIN', 'ADMIN'].includes(targetUser.role.code);
  }

  return false;
};
