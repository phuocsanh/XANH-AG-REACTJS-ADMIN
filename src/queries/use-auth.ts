import { LoginApiPayload } from "@/models/auth.model"
import { useNavigate, useLocation } from "react-router-dom"
import { useAppStore } from "@/stores"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "react-toastify"
import authService from "@/services/auth.service"

// Hook đăng nhập
export const useLoginMutation = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const location = useLocation()

  return useMutation({
    mutationFn: async (credentials: LoginApiPayload) => {
      return await authService.login(credentials)
    },
    onError: (error: unknown) => {
      console.error("Lỗi đăng nhập:", error)
      
      // Hiển thị thông báo lỗi phù hợp dựa trên status code
      const axiosError = error as { response?: { status?: number }; message?: string }
      
      if (axiosError?.response?.status === 401) {
        toast.error("Tài khoản hoặc mật khẩu không chính xác!")
      } else if (axiosError?.response?.status === 429) {
        toast.error("Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau!")
      } else if (axiosError?.response?.status && axiosError.response.status >= 500) {
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

// Hook đăng xuất
export const useLogoutMutation = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      return await authService.logout()
    },
    onSuccess: () => {
      // Xóa cache và state
      queryClient.clear()

      navigate("/signIn")
      toast.success("Đăng xuất thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi đăng xuất:", error)
      toast.error("Đã xảy ra lỗi khi đăng xuất.")
    },
  })
}

// Hook kiểm tra trạng thái đăng nhập
export const useAuthStatus = () => {
  const isLogin = useAppStore((state) => state.isLogin)
  const userToken = useAppStore((state) => state.accessToken)

  return {
    isAuthenticated: isLogin && !!userToken,
    token: userToken,
  }
}
