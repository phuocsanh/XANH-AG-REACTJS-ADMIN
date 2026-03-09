import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/utils/api";
import { queryClient } from "@/provider/app-provider-tanstack";
import { toast } from "react-toastify";
import { handleApiError } from "@/utils/error-handler";
import { UserResponse, Role } from "@/models/auth.model";

export const userKeys = {
  all: () => ["users"] as const,
  pending: () => ["users", "pending"] as const,
  roles: () => ["roles"] as const,
} as const;

export const useRolesQuery = () => {
    return useQuery({
        queryKey: userKeys.roles(),
        queryFn: async () => {
             const response = await api.get<Role[]>("/users/roles-list");
             return response;
        },
        staleTime: 60 * 60 * 1000, // 1 hour
    });
};

export interface CreateUserByAdminDto {
  account: string;
  password: string;
  nickname: string;
  role_id: number;
  email?: string;
  mobile?: string;
  [key: string]: any; // Index signature for compatibility
}

export const usePendingUsersQuery = () => {
  return useQuery({
    queryKey: userKeys.pending(),
    queryFn: async () => {
      const response = await api.postRaw<{data: UserResponse[]
        pagination?: any
      }>("/users/search", { 
        status: "pending",
        page: 1,
        limit: 1000 
      });
      return response.data;
    },
  });
};

export const useAllUsersQuery = (params?: Record<string, unknown>) => {
  const page = (params?.page as number) || 1
  const limit = (params?.limit as number) || 1000 // Lấy nhiều để hiển thị tất cả

  return useQuery({
    queryKey: [...userKeys.all(), params],
    queryFn: async () => {
      const response = await api.postRaw<{data: UserResponse[]
        total: number
        page: number
        limit: number
        pagination?: any
      }>('/users/search', {
        page,
        limit,
        ...params
      })

      return {
        data: {
          items: response.data,
          total: response.pagination?.total ?? response.total,
          page: response.pagination?.page ?? response.page,
          limit: response.pagination?.limit ?? response.limit,
          total_pages: Math.ceil((response.pagination?.total ?? response.total ?? 0) / (response.pagination?.limit ?? response.limit ?? 10)),
          has_next: (response.pagination?.page ?? response.page ?? 1) * (response.pagination?.limit ?? response.limit ?? 10) < (response.pagination?.total ?? response.total ?? 0),
          has_prev: response.page > 1,
        },
        status: 200,
        message: 'Success',
        success: true
      }
    },
    refetchOnMount: true,
    staleTime: 0,
  });
};

export const useApproveUserMutation = () => {
  return useMutation({
    mutationFn: async (userId: number) => {
      const response = await api.postRaw("/users/admin/approve", { user_id: userId });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.pending() });
      queryClient.invalidateQueries({ queryKey: userKeys.all() });
      toast.success("Duyệt người dùng thành công!");
    },
    onError: (error) => {
      handleApiError(error, "Có lỗi khi duyệt người dùng");
    },
  });
};

export const useCreateUserByAdminMutation = () => {
  return useMutation({
    mutationFn: async (data: CreateUserByAdminDto) => {
      const response = await api.postRaw("/users/admin/create", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all() });
      toast.success("Tạo tài khoản thành công!");
    },
    onError: (error) => {
      handleApiError(error, "Có lỗi khi tạo tài khoản");
    },
  });
};

export const useActivateUserMutation = () => {
  return useMutation({
    mutationFn: async (userId: number) => {
      const response = await api.postRaw(`/users/${userId}/activate`, {});
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.pending() });
      queryClient.invalidateQueries({ queryKey: userKeys.all() });
      toast.success("Kích hoạt tài khoản thành công!");
    },
    onError: (error) => {
      handleApiError(error, "Có lỗi khi kích hoạt tài khoản");
    },
  });
};

export const useDeactivateUserMutation = () => {
  return useMutation({
    mutationFn: async (userId: number) => {
      const response = await api.postRaw(`/users/${userId}/deactivate`, {});
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.pending() });
      queryClient.invalidateQueries({ queryKey: userKeys.all() });
      toast.success("Vô hiệu hóa tài khoản thành công!");
    },
    onError: (error) => {
      handleApiError(error, "Có lỗi khi vô hiệu hóa tài khoản");
    },
  });
};

export const useDeleteUserMutation = () => {
  return useMutation({
    mutationFn: async (userId: number) => {
      const response = await api.delete(`/users/${userId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.pending() });
      queryClient.invalidateQueries({ queryKey: userKeys.all() });
      toast.success("Xóa tài khoản thành công!");
    },
    onError: (error) => {
      handleApiError(error, "Có lỗi khi xóa tài khoản");
    },
  });
};

export const useResetPasswordMutation = () => {
  return useMutation({
    mutationFn: async ({ userId, password }: { userId: number; password: string }) => {
      const response = await api.postRaw(`/users/${userId}/reset-password`, { password });
      return response;
    },
    onSuccess: () => {
      toast.success("Đặt lại mật khẩu thành công!");
    },
    onError: (error) => {
      handleApiError(error, "Có lỗi khi đặt lại mật khẩu");
    },
  });
};
