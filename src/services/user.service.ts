import api from "@/utils/api"

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
    const apiData = await api.get<User[]>("/users")
    console.log("Raw API response for users:", apiData)
    return apiData
  },

  /**
   * Lấy thông tin chi tiết một người dùng theo ID
   * @param id ID của người dùng
   * @returns Thông tin người dùng
   */
  getById: async (id: number): Promise<User> => {
    const apiData = await api.get<User>(`/users/${id}`)
    console.log("Raw API response for user by id:", apiData)
    return apiData
  },

  /**
   * Lấy thông tin profile của người dùng hiện tại
   * @returns Thông tin profile người dùng
   */
  getProfile: async (): Promise<User> => {
    const apiData = await api.get<User>("/users/profile")
    console.log("Raw API response for user profile:", apiData)
    return apiData
  },

  /**
   * Tạo người dùng mới
   * @param userData Dữ liệu người dùng mới
   * @returns Thông tin người dùng đã tạo
   */
  create: async (userData: CreateUserDto): Promise<User> => {
    const apiData = await api.post<User>("/users", userData)
    console.log("Raw API response for create user:", apiData)
    return apiData
  },

  /**
   * Cập nhật thông tin người dùng
   * @param id ID của người dùng
   * @param userData Dữ liệu cập nhật
   * @returns Thông tin người dùng đã cập nhật
   */
  update: async (id: number, userData: UpdateUserDto): Promise<User> => {
    const apiData = await api.patch<User>(`/users/${id}`, userData)
    console.log("Raw API response for update user:", apiData)
    return apiData
  },

  /**
   * Xóa người dùng
   * @param id ID của người dùng cần xóa
   * @returns Kết quả xóa
   */
  delete: async (id: number): Promise<{ message: string }> => {
    const apiData = await api.delete<{ message: string }>(`/users/${id}`)
    console.log("Raw API response for delete user:", apiData)
    return apiData
  },

  /**
   * Thay đổi mật khẩu người dùng
   * @param changePasswordData Dữ liệu đổi mật khẩu
   * @returns Kết quả thay đổi mật khẩu
   */
  changePassword: async (changePasswordData: ChangePasswordDto): Promise<{ success: boolean; message: string }> => {
    const apiData = await api.patch<{ success: boolean; message: string }>("/users/change-password", changePasswordData)
    console.log("Raw API response for change password:", apiData)
    return apiData
  },
}

export default userService