import api from "@/utils/api"
import { ApiResponse } from "@/models/auth.model"

// Interface cho User từ server
export interface User {
  userId: number
  userAccount: string
  userEmail?: string
  userState?: number
  createdAt?: string
  updatedAt?: string
}

// Interface cho tạo user mới
export interface CreateUserDto extends Record<string, unknown> {
  userAccount: string
  userPassword: string
  userSalt: string
  userEmail?: string
  userState?: number
}

// Interface cho cập nhật user
export interface UpdateUserDto extends Record<string, unknown> {
  userAccount?: string
  userPassword?: string
  userSalt?: string
  userEmail?: string
  userState?: number
}

// Interface cho đổi mật khẩu
export interface ChangePasswordDto extends Record<string, unknown> {
  oldPassword: string
  newPassword: string
}

/**
 * Service xử lý các chức năng liên quan đến quản lý người dùng
 */
export const userService = {
  /**
   * Lấy danh sách tất cả người dùng
   * @returns Danh sách người dùng
   */
  getAll: async (): Promise<User[]> => {
    const response = await api.get<ApiResponse<User[]>>("/users")
    return response.data
  },

  /**
   * Lấy thông tin chi tiết một người dùng theo ID
   * @param id ID của người dùng
   * @returns Thông tin người dùng
   */
  getById: async (id: number): Promise<User> => {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`)
    return response.data
  },

  /**
   * Lấy thông tin profile của người dùng hiện tại
   * @returns Thông tin profile người dùng
   */
  getProfile: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>("/users/profile")
    return response.data
  },

  /**
   * Tạo người dùng mới
   * @param userData Dữ liệu người dùng mới
   * @returns Thông tin người dùng đã tạo
   */
  create: async (userData: CreateUserDto): Promise<User> => {
    const response = await api.post<ApiResponse<User>>("/users", userData)
    return response.data
  },

  /**
   * Cập nhật thông tin người dùng
   * @param id ID của người dùng
   * @param userData Dữ liệu cập nhật
   * @returns Thông tin người dùng đã cập nhật
   */
  update: async (id: number, userData: UpdateUserDto): Promise<User> => {
    const response = await api.patch<ApiResponse<User>>(`/users/${id}`, userData)
    return response.data
  },

  /**
   * Xóa người dùng
   * @param id ID của người dùng cần xóa
   * @returns Kết quả xóa
   */
  delete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/users/${id}`)
    return response.data
  },

  /**
   * Thay đổi mật khẩu người dùng
   * @param changePasswordData Dữ liệu đổi mật khẩu
   * @returns Kết quả thay đổi mật khẩu
   */
  changePassword: async (changePasswordData: ChangePasswordDto): Promise<{ success: boolean; message: string }> => {
    const response = await api.put<ApiResponse<{ success: boolean; message: string }>>("/auth/change-password", changePasswordData)
    return response.data
  },
}

export default userService