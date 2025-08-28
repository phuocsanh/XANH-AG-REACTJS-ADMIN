import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "react-toastify"
import userService, { CreateUserDto, UpdateUserDto, ChangePasswordDto } from "@/services/user.service"

// Query keys cho user
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: string) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
}

/**
 * Hook lấy danh sách tất cả người dùng
 */
export const useUsersQuery = () => {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: () => userService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 phút
  })
}

/**
 * Hook lấy thông tin chi tiết một người dùng
 */
export const useUserQuery = (id: number) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => userService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 phút
  })
}

/**
 * Hook lấy thông tin profile người dùng hiện tại
 */
export const useProfileQuery = () => {
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: () => userService.getProfile(),
    staleTime: 5 * 60 * 1000, // 5 phút
  })
}

/**
 * Hook tạo người dùng mới
 */
export const useCreateUserMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userData: CreateUserDto) => userService.create(userData),
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
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, userData }: { id: number; userData: UpdateUserDto }) => 
      userService.update(id, userData),
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
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => userService.delete(id),
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
    mutationFn: (changePasswordData: ChangePasswordDto) => 
      userService.changePassword(changePasswordData),
    onSuccess: () => {
      toast.success("Đổi mật khẩu thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi đổi mật khẩu:", error)
      toast.error("Có lỗi xảy ra khi đổi mật khẩu")
    },
  })
}