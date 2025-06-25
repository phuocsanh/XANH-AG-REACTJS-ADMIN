import api from "@/utils/api"
import {
  ApiResponse,
  LoginResponse,
  RefreshTokenRequest,
  TokenResponse,
  loginApiPayloadSchema,
  LoginApiPayload,
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
        "/user/login",
        credentials
      )

      // Kiểm tra response hợp lệ
      if (!response?.data) {
        throw new Error("Dữ liệu phản hồi không hợp lệ")
      }

      const { tokens, user } = response.data

      if (tokens) {
        // Lưu token vào localStorage và state

        // Cập nhật trạng thái đăng nhập
        useAppStore.setState((prev) => ({
          ...prev,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          isLogin: true,
          userInfo: user,
        }))

        // Lưu thông tin user vào localStorage
      }

      return response.data
    } catch (error: any) {
      console.error("Lỗi đăng nhập:", error)

      // Ném lỗi để interceptor xử lý
      throw error
    }
  },

  // Đăng xuất
  logout: async (): Promise<void> => {
    try {
      await api.post("/user/logout")
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
  refreshToken: async (refreshToken: string): Promise<TokenResponse> => {
    const response = await api.post<ApiResponse<TokenResponse>>(
      "/user/refresh-token",
      { refreshToken }
    )

    if (response.data && response.data.access_token) {
      // Cập nhật token mới
      useAppStore.setState({ accessToken: response.data.access_token })
    }

    return response.data
  },

  // Kiểm tra trạng thái đăng nhập
  checkAuthStatus: (): boolean => {
    const token = useAppStore.getState().accessToken

    const isLoggedIn = !!token

    // Cập nhật state nếu có token nhưng state chưa được cập nhật
    if (isLoggedIn && !useAppStore.getState().isLogin) {
      useAppStore.setState({
        accessToken: token,
        isLogin: true,
      })
    }

    return isLoggedIn
  },
}

export default authService
