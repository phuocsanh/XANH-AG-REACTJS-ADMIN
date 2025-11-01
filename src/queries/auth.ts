import { useEffect } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "react-toastify"
import { LoginApiPayload, UserResponse } from "@/models/auth.model"
import { handleApiError } from "@/utils/error-handler"
import { useAppStore } from "@/stores"

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

      // Gọi trực tiếp axios mà không qua interceptor
      const response = await axios.post("http://localhost:3003/auth/login", {
        userAccount: credentials.userAccount,
        userPassword: credentials.userPassword,
      })

      // Log để debug
      console.log("Raw axios response:", response.data)

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
      if (!("userId" in data.user) || !("userAccount" in data.user)) {
        console.error("User is missing required fields:", data.user)
        toast.error("Đăng nhập thất bại: Dữ liệu không hợp lệ")
        return
      }

      setAccessToken(data.access_token)
      setRefreshToken(data.refresh_token)
      setUserInfo(data.user as UserResponse)
      setIsLogin(true)

      // Lưu token vào localStorage để đảm bảo persist
      localStorage.setItem("access_token", data.access_token)
      localStorage.setItem("refresh_token", data.refresh_token)

      // Redirect đến trang dashboard
      window.location.href = "/"
    },
    onError: (error: unknown) => {
      handleApiError(error, "Đăng nhập không thành công")
    },
  })
}
