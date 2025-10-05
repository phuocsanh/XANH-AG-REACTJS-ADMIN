import api from "@/utils/api"
import {
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
   * @param credentials Thông tin đăng nhập (userAccount và userPassword)
   * @returns Thông tin đăng nhập thành công
   * @throws Lỗi nếu đăng nhập thất bại
   */
  login: async (credentials: LoginApiPayload): Promise<LoginResponse> => {
    try {
      // Gửi request đến endpoint /auth/login với userAccount và userPassword
      const response = await api.postRaw<LoginResponse>(
        "/auth/login",
        {
          userAccount: credentials.userAccount,
          userPassword: credentials.userPassword
        }
      )

      console.log("Raw response từ API:", response)

      // Kiểm tra response hợp lệ
      if (!response) {
        throw new Error("Dữ liệu phản hồi không hợp lệ")
      }

      const { access_token, refresh_token, user } = response

      if (access_token && refresh_token) {
        console.log("Đăng nhập thành công, cập nhật state:", { access_token, refresh_token, user })
        
        // Cập nhật trạng thái đăng nhập với token từ server
        useAppStore.setState({
          accessToken: access_token,
          refreshToken: refresh_token,
          isLogin: true,
          userInfo: user,
        })

        // Lưu refresh token vào localStorage
        localStorage.setItem("refreshToken", refresh_token)
        
        // Kiểm tra state sau khi cập nhật
        const currentState = useAppStore.getState()
        console.log("State sau khi cập nhật:", currentState)
      }

      return response
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
      localStorage.removeItem("refreshToken")
    }
  },

  // Làm mới token
  refreshToken: async (): Promise<TokenResponse> => {
    try {
      const refreshToken = localStorage.getItem("refreshToken")
      if (!refreshToken) {
        throw new Error("Không tìm thấy refresh token")
      }

      // Gửi refresh_token trong body theo API backend
      const apiData = await api.postRaw<TokenResponse>(
        "/auth/refresh",
        { refresh_token: refreshToken }
      )

      console.log("Raw API response for refresh token:", apiData)

      if (!apiData) {
        throw new Error("Dữ liệu phản hồi không hợp lệ")
      }

      const { access_token, refresh_token } = apiData

      if (access_token && refresh_token) {
        // Cập nhật token mới
        useAppStore.setState((prev) => ({
          ...prev,
          accessToken: access_token,
          refreshToken: refresh_token,
        }))

        // Lưu refresh token mới vào localStorage
        localStorage.setItem("refreshToken", refresh_token)
      }

      return apiData
    } catch (error) {
      console.error("Lỗi khi refresh token:", error)
      // Xóa token cũ và chuyển về trang đăng nhập
       localStorage.removeItem("refreshToken")
       useAppStore.setState((prev) => ({
         ...prev,
         accessToken: undefined,
         refreshToken: undefined,
         isLogin: false,
         userInfo: undefined,
       }))
      throw error
    }
  },

  // Đăng ký người dùng mới
  register: async (userData: RegisterApiPayload): Promise<UserResponse> => {
    try {
      const apiData = await api.post<UserResponse>(
        "/auth/register",
        userData
      )

      console.log("Raw API response for register:", apiData)

      // Kiểm tra response hợp lệ
      if (!apiData) {
        throw new Error("Dữ liệu phản hồi không hợp lệ")
      }

      return apiData
    } catch (error: unknown) {
      console.error("Lỗi đăng ký:", error)
      throw error
    }
  },

  // Đổi mật khẩu
  changePassword: async (
    passwordData: ChangePasswordApiPayload
  ): Promise<{ success: boolean; message: string }> => {
    try {
      // Gửi request đến endpoint /auth/change-password với oldPassword và newPassword
      const apiData = await api.putRaw<{ success: boolean; message: string }>("/auth/change-password", {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      })

      console.log("Raw API response for change password:", apiData)

      if (!apiData) {
        throw new Error("Dữ liệu phản hồi không hợp lệ")
      }

      return apiData
    } catch (error) {
      console.error("Lỗi khi thay đổi mật khẩu:", error)
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
