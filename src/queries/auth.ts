import { useEffect } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "react-toastify"
import {
  LoginApiPayload,
  UserResponse,
  RegisterApiPayload,
} from "@/models/auth.model"
import { handleApiError } from "@/utils/error-handler"
import { useAppStore } from "@/stores"
import { API_ENDPOINTS } from "@/config/api.config"

// ========== AUTH HOOKS ==========

/**
 * Hook để kiểm tra và cập nhật trạng thái xác thực
 * Tự động kiểm tra token và cập nhật trạng thái đăng nhập
 */
export const useAuthStatus = () => {
  const setIsLogin = useAppStore((state) => state.setIsLogin)
  const setUserInfo = useAppStore((state) => state.setUserInfo)
  const setAccessToken = useAppStore((state) => state.setAccessToken)
  const setRefreshToken = useAppStore((state) => state.setRefreshToken)
  const accessToken = useAppStore((state) => state.accessToken)

  useEffect(() => {
    // Chỉ kiểm tra khi có accessToken
    if (accessToken) {
      // Trong trường hợp này, chúng ta giả định rằng nếu có accessToken thì người dùng đã đăng nhập
      // Bạn có thể thêm logic kiểm tra token ở đây nếu cần
      setIsLogin(true)
    } else {
      setIsLogin(false)
      setUserInfo(null)
    }
  }, [accessToken, setIsLogin, setUserInfo, setAccessToken, setRefreshToken])
}

/**
 * Hook đăng nhập
 */
export const useLoginMutation = () => {
  const setIsLogin = useAppStore((state) => state.setIsLogin)
  const setUserInfo = useAppStore((state) => state.setUserInfo)
  const setAccessToken = useAppStore((state) => state.setAccessToken)
  const setRefreshToken = useAppStore((state) => state.setRefreshToken)

  return useMutation({
    mutationFn: async (credentials: LoginApiPayload) => {
      // Import axios trực tiếp để tránh interceptor xử lý
      const axios = (await import("axios")).default

      // Log để debug
      console.log("Sending login request with credentials:", credentials)

      // Gọi trực tiếp axios mà không qua interceptor
      // Sử dụng đúng tên trường mà server expect: 'account' và 'password'
      const response = await axios.post(
        API_ENDPOINTS.AUTH_LOGIN,
        {
          account: credentials.user_account,
          password: credentials.user_password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )

      // Log để debug
      console.log("Raw axios response:", response)
      console.log("Raw axios response data:", response.data)
      console.log("Raw axios response status:", response.status)
      console.log("Raw axios response headers:", response.headers)

      // Trả về response.data (đây là phần dữ liệu đầy đủ từ API)
      return response.data
    },
    onSuccess: (response) => {
      // Xử lý token và user info trong onSuccess callback của component
      console.log("Login successful - Response received:", response)

      // Kiểm tra response có tồn tại không
      if (!response) {
        console.error("Response is undefined or null")
        toast.error("Đăng nhập thất bại: Dữ liệu không hợp lệ")
        return
      }

      // Kiểm tra response có cấu trúc đúng không
      if (typeof response !== "object" || response === null) {
        console.error("Response is not an object:", response)
        toast.error("Đăng nhập thất bại: Dữ liệu không hợp lệ")
        return
      }

      // Kiểm tra nếu response có trường success
      if (!("success" in response)) {
        console.error("Response is missing 'success' field:", response)
        toast.error("Đăng nhập thất bại: Dữ liệu không hợp lệ")
        return
      }

      // Kiểm tra nếu success là boolean
      if (typeof response.success !== "boolean") {
        console.error("Response success field is not boolean:", response)
        toast.error("Đăng nhập thất bại: Dữ liệu không hợp lệ")
        return
      }

      // Kiểm tra nếu success = true
      if (response.success !== true) {
        console.error("Login failed - success is false:", response)
        toast.error("Đăng nhập thất bại")
        return
      }

      // Kiểm tra nếu response có trường data
      if (!("data" in response)) {
        console.error("Response is missing 'data' field:", response)
        toast.error("Đăng nhập thất bại: Dữ liệu không hợp lệ")
        return
      }

      const data = response.data

      // Kiểm tra data có cấu trúc đúng không
      if (typeof data !== "object" || data === null) {
        console.error("Data is not an object:", data)
        toast.error("Đăng nhập thất bại: Dữ liệu không hợp lệ")
        return
      }

      // Kiểm tra nếu data có các trường cần thiết
      if (
        !("access_token" in data) ||
        !("refresh_token" in data) ||
        !("user" in data)
      ) {
        console.error("Data is missing required fields:", data)
        toast.error("Đăng nhập thất bại: Dữ liệu không hợp lệ")
        return
      }

      // Kiểm tra nếu access_token và refresh_token là string
      if (
        typeof data.access_token !== "string" ||
        typeof data.refresh_token !== "string"
      ) {
        console.error("Access token or refresh token is not string:", data)
        toast.error("Đăng nhập thất bại: Dữ liệu không hợp lệ")
        return
      }

      // Kiểm tra nếu user là object
      if (typeof data.user !== "object" || data.user === null) {
        console.error("User is not an object:", data.user)
        toast.error("Đăng nhập thất bại: Dữ liệu không hợp lệ")
        return
      }

      // Kiểm tra nếu user có các trường cần thiết
      // Server trả về userId và userAccount (camelCase) thay vì user_id và user_account (snake_case)
      // RBAC update: Server might return 'id', 'account', 'role'
      const userId = data.user.id || data.user.userId
      const userAccount = data.user.account || data.user.userAccount

      if (!userId || !userAccount) {
        console.error("User is missing required fields:", data.user)
        toast.error("Đăng nhập thất bại: Dữ liệu không hợp lệ")
        return
      }

      setAccessToken(data.access_token)
      setRefreshToken(data.refresh_token)
      // Sử dụng đúng tên trường từ server response
      setUserInfo({
        user_id: userId,
        user_account: userAccount,
        id: userId,
        account: userAccount,
        nickname: data.user.nickname,
        role: data.user.role,
      } as UserResponse)
      setIsLogin(true)

      // Lưu token vào localStorage để đảm bảo persist
      localStorage.setItem("access_token", data.access_token)
      localStorage.setItem("refresh_token", data.refresh_token)

      // Redirect đến trang dashboard
      window.location.href = "/"
    },
    onError: (error: unknown) => {
      console.error("Login error:", error)
      // Log thêm thông tin chi tiết về lỗi
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data?: unknown; status?: number; headers?: unknown }
        }
        console.error("Login error response data:", axiosError.response?.data)
        console.error(
          "Login error response status:",
          axiosError.response?.status
        )
        console.error(
          "Login error response headers:",
          axiosError.response?.headers
        )
      }
      handleApiError(error, "Đăng nhập không thành công")
    },
  })
}

/**
 * Hook đăng ký người dùng mới
 */
export const useRegisterMutation = () => {
  return useMutation({
    mutationFn: async (userData: RegisterApiPayload) => {
      // Import axios trực tiếp để tránh interceptor xử lý
      const axios = (await import("axios")).default

      // Log để debug
      console.log("Sending register request with user data:", userData)

      // Chuẩn bị payload - chỉ gửi email nếu có
      const payload: { account: string; password: string; email?: string } = {
        account: userData.user_account,
        password: userData.user_password,
      }

      // Chỉ thêm email vào payload nếu người dùng đã nhập
      if (userData.user_email) {
        payload.email = userData.user_email
      }

      // Gọi trực tiếp axios mà không qua interceptor
      const response = await axios.post(
        API_ENDPOINTS.AUTH_REGISTER,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )

      // Log để debug
      console.log("Raw axios response:", response)
      console.log("Raw axios response data:", response.data)
      console.log("Raw axios response status:", response.status)
      console.log("Raw axios response headers:", response.headers)

      // Trả về response.data (đây là phần dữ liệu đầy đủ từ API)
      return response.data
    },
    onSuccess: (response) => {
      // Xử lý kết quả đăng ký thành công
      console.log("Register successful - Response received:", response)

      // Kiểm tra response có tồn tại không
      if (!response) {
        console.error("Response is undefined or null")
        toast.error("Đăng ký thất bại: Dữ liệu không hợp lệ")
        return
      }

      // Kiểm tra response có cấu trúc đúng không
      if (typeof response !== "object" || response === null) {
        console.error("Response is not an object:", response)
        toast.error("Đăng ký thất bại: Dữ liệu không hợp lệ")
        return
      }

      // Kiểm tra nếu response có trường success
      if (!("success" in response)) {
        console.error("Response is missing 'success' field:", response)
        toast.error("Đăng ký thất bại: Dữ liệu không hợp lệ")
        return
      }

      // Kiểm tra nếu success là boolean
      if (typeof response.success !== "boolean") {
        console.error("Response success field is not boolean:", response)
        toast.error("Đăng ký thất bại: Dữ liệu không hợp lệ")
        return
      }

      // Kiểm tra nếu success = true
      if (response.success !== true) {
        console.error("Register failed - success is false:", response)
        toast.error("Đăng ký thất bại")
        return
      }

      // Kiểm tra nếu response có trường message
      if ("message" in response) {
        toast.success(response.message || "Đăng ký tài khoản thành công!")
      } else {
        toast.success("Đăng ký tài khoản thành công!")
      }

      // Trả về response để component có thể xử lý thêm nếu cần
      return response
    },
    onError: (error: unknown) => {
      console.error("Register error:", error)
      // Log thêm thông tin chi tiết về lỗi
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data?: unknown; status?: number; headers?: unknown }
        }
        console.error(
          "Register error response data:",
          axiosError.response?.data
        )
        console.error(
          "Register error response status:",
          axiosError.response?.status
        )
        console.error(
          "Register error response headers:",
          axiosError.response?.headers
        )
      }
      handleApiError(error, "Đăng ký không thành công")
    },
  })
}

/**
 * Hook đổi mật khẩu
 */
export const useChangePasswordMutation = () => {
  const setIsLogin = useAppStore((state) => state.setIsLogin)
  const setUserInfo = useAppStore((state) => state.setUserInfo)
  const setAccessToken = useAppStore((state) => state.setAccessToken)
  const setRefreshToken = useAppStore((state) => state.setRefreshToken)
  const accessToken = useAppStore((state) => state.accessToken)

  return useMutation({
    mutationFn: async (data: {
      old_password: string
      new_password: string
    }) => {
      // Import axios trực tiếp để tránh interceptor xử lý
      const axios = (await import("axios")).default

      // Log để debug (không log mật khẩu thực tế)
      console.log("Sending change password request")

      // Gọi API với access token
      const response = await axios.put(
        API_ENDPOINTS.AUTH_CHANGE_PASSWORD,
        {
          old_password: data.old_password,
          new_password: data.new_password,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      console.log("Change password response:", response.data)
      return response.data
    },
    onSuccess: (response) => {
      console.log("Change password successful:", response)

      // Kiểm tra response
      if (!response || typeof response !== "object") {
        toast.error("Đổi mật khẩu thất bại: Dữ liệu không hợp lệ")
        return
      }

      // Kiểm tra success field
      if ("success" in response && response.success === true) {
        toast.success("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.")

        // Logout user sau khi đổi mật khẩu thành công
        setTimeout(() => {
          setIsLogin(false)
          setUserInfo(null)
          setAccessToken("")
          setRefreshToken("")
          localStorage.removeItem("access_token")
          localStorage.removeItem("refresh_token")
          window.location.href = "/sign-in"
        }, 1500)
      } else {
        toast.error("Đổi mật khẩu thất bại")
      }
    },
    onError: (error: unknown) => {
      console.error("Change password error:", error)
      handleApiError(error, "Đổi mật khẩu không thành công")
    },
  })
}
