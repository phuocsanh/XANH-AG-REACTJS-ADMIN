import { LoginApiPayload, LoginResponse } from "@/models/auth.model"
import { useNavigate } from "react-router-dom"
import { useAppStore } from "@/stores"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "react-toastify"
import authService from "@/services/auth.service"

// Hook đăng nhập
export const useLoginMutation = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (credentials: LoginApiPayload) => {
      return await authService.login(credentials)
    },
    onError: (error: any) => {
      console.error("Lỗi đăng nhập:", error)
      // Không hiển thị toast ở đây nữa vì đã xử lý trong interceptor
    },
    onSuccess: (data: LoginResponse) => {
      // Cập nhật cache
      queryClient.invalidateQueries({ queryKey: ["user"] })

      // Cập nhật trạng thái đăng nhập trong store

      // Hiển thị thông báo và chuyển hướng
      toast.success("Đăng nhập thành công!")

      // Lấy đường dẫn trước đó từ state hoặc mặc định là '/'
      const from = window.history.state?.from?.pathname || "/"
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
    onError: (error: any) => {
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

// export const useUpdatePassRegisterMutation = () => {
//   return useMutation<ResponseData<UpdatePassType>, Error, UpdatePassBodyType>({
//     mutationFn: async (data) => {
//       const response = await fetch("/api/auth/register/update-pass", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(data),
//       });
//       if (!response.ok) {
//         throw response;
//       }
//       return response.json(); //
//     },
//   });
// };
// export const useVerifyOTPMutation = () => {
//   return useMutation<ResponseData<VerifyOTPType>, Error, RegisterVerifyOTPType>(
//     {
//       mutationFn: async (data) => {
//         const response = await fetch("/api/auth/register/verify-otp", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify(data),
//         });
//         if (!response.ok) {
//           throw response;
//         }
//         return response.json(); //
//       },
//     }
//   );
// };

// export const useRegisterEmailMutation = () => {
//   return useMutation<ResponseData<null>, Error, RegisterEmailType>({
//     mutationFn: async (data) => {
//       const response = await fetch("/api/auth/register/email", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(data),
//       });

//       if (!response.ok) {
//         throw response;
//       }

//       return response.json(); // TypeScript sẽ hiểu kết quả trả về có kiểu RegisterEmailResponse
//     },
//     onError: () => {
//       // Xử lý lỗi ở đây, ví dụ: hiển thị thông báo lỗi cho người dùng
//     },
//   });
// };
