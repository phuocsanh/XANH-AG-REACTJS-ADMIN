import { useNavigate, useLocation } from "react-router-dom"
import { useAppStore } from "@/stores"
import { useMutation } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { queryClient } from "@/provider/app-provider-tanstack"
import { 
  LoginApiPayload, 
  LoginResponse, 
  TokenResponse, 
  RegisterApiPayload, 
  ChangePasswordApiPayload,
  UserResponse
} from "@/models/auth.model"

// ========== QUERY KEYS ==========
export const authKeys = {
  all: ["auth"] as const,
  user: () => [...authKeys.all, "user"] as const,
} as const

// ========== AUTH HOOKS ==========

/**
 * Hook đăng nhập
 */
export const useLoginMutation = () => {
  const navigate = useNavigate()
  const location = useLocation()

  return useMutation({
    mutationFn: async (credentials: LoginApiPayload) => {
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
    },
    onError: (error: unknown) => {
      console.error("Lỗi đăng nhập:", error)

      // Hiển thị thông báo lỗi phù hợp dựa trên status code
      const axiosError = error as {
        response?: { status?: number }
        message?: string
      }

      if (axiosError?.response?.status === 401) {
        toast.error("Tài khoản hoặc mật khẩu không chính xác!")
      } else if (axiosError?.response?.status === 429) {
        toast.error("Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau!")
      } else if (
        axiosError?.response?.status &&
        axiosError.response.status >= 500
      ) {
        toast.error("Lỗi máy chủ. Vui lòng thử lại sau!")
      } else if (axiosError?.message) {
        toast.error(axiosError.message)
      } else {
        toast.error("Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại!")
      }
    },
    onSuccess: () => {
      // Cập nhật cache
      queryClient.invalidateQueries({ queryKey: ["user"] })

      // Hiển thị thông báo và chuyển hướng
      toast.success("Đăng nhập thành công!")

      // Lấy đường dẫn trước đó từ location state hoặc mặc định là '/'
      const from = (location.state as { from?: string })?.from || "/"
      console.log("Chuyển hướng đến:", from)
      navigate(from, { replace: true })
    },
  })
}

/**
 * Hook đăng xuất
 */
export const useLogoutMutation = () => {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async () => {
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
    onSuccess: () => {
      // Xóa cache và state
      queryClient.clear()

      navigate("/sign-in")
      toast.success("Đăng xuất thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi đăng xuất:", error)
      toast.error("Đã xảy ra lỗi khi đăng xuất.")
    },
  })
}

/**
 * Hook làm mới token
 */
export const useRefreshTokenMutation = () => {
  return useMutation({
    mutationFn: async () => {
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
    },
    onError: (error: Error) => {
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
  })
}

/**
 * Hook đăng ký người dùng mới
 */
export const useRegisterMutation = () => {
  return useMutation({
    mutationFn: async (userData: RegisterApiPayload) => {
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
    },
    onSuccess: () => {
      toast.success("Đăng ký tài khoản thành công!")
    },
    onError: (error: unknown) => {
      console.error("Lỗi đăng ký:", error)
      toast.error("Có lỗi xảy ra khi đăng ký tài khoản")
      throw error
    }
  })
}

/**
 * Hook đổi mật khẩu
 */
export const useChangePasswordMutation = () => {
  return useMutation({
    mutationFn: async (passwordData: ChangePasswordApiPayload) => {
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
    },
    onSuccess: () => {
      toast.success("Đổi mật khẩu thành công!")
    },
    onError: (error: unknown) => {
      console.error("Lỗi khi thay đổi mật khẩu:", error)
      toast.error("Có lỗi xảy ra khi đổi mật khẩu")
      throw error
    }
  })
}

/**
 * Hook kiểm tra trạng thái đăng nhập
 */
export const useAuthStatus = () => {
  const isLogin = useAppStore((state) => state.isLogin)
  const userToken = useAppStore((state) => state.accessToken)

  return {
    isAuthenticated: isLogin && !!userToken,
    token: userToken,
  }
}