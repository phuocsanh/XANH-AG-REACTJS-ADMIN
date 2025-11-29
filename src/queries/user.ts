import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/utils/api";
import { queryClient } from "@/provider/app-provider-tanstack";
import { toast } from "react-toastify";
import { handleApiError } from "@/utils/error-handler";
import { UserResponse } from "@/models/auth.model";

export const userKeys = {
  all: () => ["users"] as const,
  pending: () => ["users", "pending"] as const,
} as const;

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
      const response = await api.get<UserResponse[]>("/users/admin/pending");
      return response;
    },
  });
};

export const useAllUsersQuery = () => {
  return useQuery({
    queryKey: userKeys.all(),
    queryFn: async () => {
      const response = await api.get<UserResponse[]>("/users");
      return response;
    },
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
