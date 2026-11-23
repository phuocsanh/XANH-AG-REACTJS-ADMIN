import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import {
  ManagedRole,
  Permission,
  RolePermissionAuditEntry,
  RolePermissionUserOption,
  UserPermissionDetails,
} from '@/models/auth.model';

const ROOT = '/role-permissions';

export const rolePermissionKeys = {
  catalog: ['role-permission', 'catalog'] as const,
  roles: ['role-permission', 'roles'] as const,
  user: (userId?: number) => ['role-permission', 'user', userId] as const,
  audit: (params: Record<string, number | string | undefined>) => ['role-permission', 'audit', params] as const,
};

export const usePermissionCatalog = () => useQuery({
  queryKey: rolePermissionKeys.catalog,
  queryFn: () => api.get<Permission[]>(`${ROOT}/permissions`),
});

export const useManagedRoles = () => useQuery({
  queryKey: rolePermissionKeys.roles,
  queryFn: () => api.get<ManagedRole[]>(`${ROOT}/roles`),
});

export const useRolePermissionUserSearch = (keyword: string) => useQuery({
  queryKey: ['role-permission', 'user-search', keyword],
  enabled: keyword.trim().length >= 2,
  queryFn: async () => {
    const response = await api.get<{
      data: RolePermissionUserOption[];
      pagination?: { total: number };
      total?: number;
    }>(`${ROOT}/users/search`, { keyword: keyword.trim(), page: 1, limit: 20 });
    return response.data;
  },
  staleTime: 15_000,
});

export const useUserPermissionDetails = (userId?: number) => useQuery({
  queryKey: rolePermissionKeys.user(userId),
  queryFn: () => api.get<UserPermissionDetails>(`${ROOT}/users/${userId}`),
  enabled: Boolean(userId),
});

export const useUpdateRolePermissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, permissionCodes }: { roleId: number; permissionCodes: string[] }) =>
      api.putRaw(`${ROOT}/roles/${roleId}`, { permissionCodes }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rolePermissionKeys.roles });
      await queryClient.invalidateQueries({ queryKey: ['role-permission', 'audit'] });
    },
  });
};

export const useUpdateUserPermissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, permissionCodes }: { userId: number; permissionCodes: string[] }) =>
      api.putRaw(`${ROOT}/users/${userId}`, { permissionCodes }),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: rolePermissionKeys.user(variables.userId) });
      await queryClient.invalidateQueries({ queryKey: ['role-permission', 'audit'] });
    },
  });
};

export const useResetUserPermissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => api.delete(`${ROOT}/users/${userId}`),
    onSuccess: async (_data, userId) => {
      await queryClient.invalidateQueries({ queryKey: rolePermissionKeys.user(userId) });
      await queryClient.invalidateQueries({ queryKey: ['role-permission', 'audit'] });
    },
  });
};

export const usePermissionAudit = (params: {
  targetType?: string;
  roleCode?: string;
  userId?: number;
  page: number;
  limit: number;
}) => useQuery({
  queryKey: rolePermissionKeys.audit(params),
  enabled:
    (params.targetType !== 'user' || Boolean(params.userId)) &&
    (params.targetType !== 'role' || Boolean(params.roleCode)),
  queryFn: () => api.get<{
    data: RolePermissionAuditEntry[];
    total: number;
    page: number;
    limit: number;
    pagination?: { total: number; totalPages: number };
  }>(`${ROOT}/audit`, params),
});
