import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { queryClient } from "@/provider/app-provider-tanstack"
import {
  User,
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
} from "@/models/user.model"

// Query keys cho user
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters: string) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
  profile: () => [...userKeys.all, "profile"] as const,
}

/**
 * Hook lấy danh sách tất cả người dùng
 */
export const useUsersQuery = () => {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: async () => {
      const response = await api.get<User[]>("/users")
      return response
    },
  })
}

/**
 * Hook lấy thông tin chi tiết một người dùng
 */
export const useUserQuery = (id: number) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<User>(`/users/${id}`)
      return response
    },
    enabled: !!id,
  })
}

/**
 * Hook lấy thông tin profile người dùng hiện tại
 */
export const useProfileQuery = () => {
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: async () => {
      const response = await api.get<User>("/users/profile")
      return response
    },
  })
}

/**
 * Hook tạo người dùng mới
 */
export const useCreateUserMutation = () => {
  return useMutation({
    mutationFn: async (userData: CreateUserDto) => {
      const response = await api.post<User>("/users", userData)
      return response
    },
    onSuccess: () => {
      // Invalidate và refetch danh sách users
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      toast.success("Tạo người dùng thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi tạo người dùng:", error)
      toast.error("Có lỗi xảy ra khi tạo người dùng")
    },
  })
}

/**
 * Hook cập nhật thông tin người dùng
 */
export const useUpdateUserMutation = () => {
  return useMutation({
    mutationFn: async ({
      id,
      userData,
    }: {
      id: number
      userData: UpdateUserDto
    }) => {
      const response = await api.patch<User>(`/users/${id}`, userData)
      return response
    },
    onSuccess: (data, variables) => {
      // Invalidate các queries liên quan
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: userKeys.profile() })
      toast.success("Cập nhật thông tin người dùng thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi cập nhật người dùng:", error)
      toast.error("Có lỗi xảy ra khi cập nhật thông tin người dùng")
    },
  })
}

/**
 * Hook xóa người dùng
 */
export const useDeleteUserMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<{ message: string }>(`/users/${id}`)
      return response
    },
    onSuccess: () => {
      // Invalidate danh sách users
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      toast.success("Xóa người dùng thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi xóa người dùng:", error)
      toast.error("Có lỗi xảy ra khi xóa người dùng")
    },
  })
}

/**
 * Hook thay đổi mật khẩu
 */
export const useChangePasswordMutation = () => {
  return useMutation({
    mutationFn: async (changePasswordData: ChangePasswordDto) => {
      const response = await api.patch<{ success: boolean; message: string }>(
        "/users/change-password",
        changePasswordData
      )
      return response
    },
    onSuccess: () => {
      toast.success("Đổi mật khẩu thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi đổi mật khẩu:", error)
      toast.error("Có lỗi xảy ra khi đổi mật khẩu")
    },
  })
}
