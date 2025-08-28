import api from "@/utils/api"
import {
  ApiResponse,
  LoginResponse,
  TokenResponse,
  LoginApiPayload,
  RegisterApiPayload,
  ChangePasswordApiPayload,
  UserResponse,
} from "@/models/auth.model"
import { useAppStore } from "@/stores"

// Service xử lý các chức năng liên quan đến xác thực
export const authService = {
  /**
   * Đăng nhập người dùng
   * @param credentials Thông tin đăng nhập (snake_case format)
   * @returns Thông tin đăng nhập thành công
   * @throws Lỗi nếu đăng nhập thất bại
   */
  login: async (credentials: LoginApiPayload): Promise<LoginResponse> => {
    try {
      // Validate dữ liệu đầu vào với type safety - theo pattern của example

      const response = await api.postRaw<ApiResponse<LoginResponse>>(
        "/auth/login",
        credentials
      )

      // Kiểm tra response hợp lệ
      if (!response?.data) {
        throw new Error("Dữ liệu phản hồi không hợp lệ")
      }

      const { access_token, user } = response.data

      if (access_token) {
        // Cập nhật trạng thái đăng nhập với token từ server
        useAppStore.setState((prev) => ({
          ...prev,
          accessToken: access_token,
          refreshToken: "", // Server chưa có refresh token
          isLogin: true,
          userInfo: user,
        }))
      }

      return response.data
    } catch (error: unknown) {
      console.error("Lỗi đăng nhập:", error)

      // Ném lỗi để interceptor xử lý
      throw error
    }
  },

  // Đăng xuất
  logout: async (): Promise<void> => {
    try {
      // Server không có endpoint logout, chỉ xóa token ở client
      // await api.post("/auth/logout")
    } catch (error) {
      console.error("Lỗi đăng xuất:", error)
    } finally {
      useAppStore.setState({
        accessToken: "",
        refreshToken: "",
        isLogin: false,
      })
    }
  },

  // Làm mới token
  refreshToken: async (_refreshToken: string): Promise<TokenResponse> => {
    // Server chưa có endpoint refresh token, cần implement sau
    // const response = await api.post<ApiResponse<TokenResponse>>(
    //   "/auth/refresh-token",
    //   { refreshToken: _refreshToken }
    // )
    // if (response.data && response.data.accessToken) {
    //   useAppStore.setState({ accessToken: response.data.accessToken })
    // }
    // return response.data
    
    throw new Error("Refresh token chưa được implement trên server")
  },

  // Đăng ký người dùng mới
  register: async (userData: RegisterApiPayload): Promise<UserResponse> => {
    try {
      const response = await api.post<ApiResponse<UserResponse>>(
        "/auth/register",
        userData
      )

      // Kiểm tra response hợp lệ
      if (!response?.data) {
        throw new Error("Dữ liệu phản hồi không hợp lệ")
      }

      return response.data
    } catch (error: unknown) {
      console.error("Lỗi đăng ký:", error)
      throw error
    }
  },

  // Đổi mật khẩu
  changePassword: async (passwordData: ChangePasswordApiPayload): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.put<ApiResponse<{ success: boolean; message: string }>>(
        "/auth/change-password",
        passwordData
      )

      // Kiểm tra response hợp lệ
      if (!response?.data) {
        throw new Error("Dữ liệu phản hồi không hợp lệ")
      }

      return response.data
    } catch (error: unknown) {
      console.error("Lỗi đổi mật khẩu:", error)
      throw error
    }
  },

  // Kiểm tra trạng thái đăng nhập
  checkAuthStatus: (): boolean => {
    const state = useAppStore.getState()
    const { accessToken, isLogin } = state

    const hasValidToken = !!accessToken && accessToken !== ""

    // Đồng bộ state nếu có token nhưng isLogin = false
    if (hasValidToken && !isLogin) {
      useAppStore.setState({
        isLogin: true,
      })
      return true
    }

    // Nếu không có token nhưng isLogin = true, reset state
    if (!hasValidToken && isLogin) {
      useAppStore.setState({
        isLogin: false,
        accessToken: undefined,
        refreshToken: undefined,
        userInfo: null,
      })
      return false
    }

    return hasValidToken
  },
}

export default authService
