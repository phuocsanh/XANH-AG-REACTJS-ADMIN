import { LoginResType } from "@/models/auth";
import { ResponseData } from "@/models/common";
import { useNavigate } from "react-router-dom";

import { useAppStore } from "@/stores";
import api from "@/utils/api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
export const useRefreshTokenMutation = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await fetch(
        "/api/auth/get-access-token-by-refresh-token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Gửi cookie tự động (chứa refreshToken)
        }
      );

      if (!response.ok) {
        throw response;
      }
      return response.json(); //
    },
  });
};
export const useLoginMutation = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (body: { email: string; password: string }) => {
      const res = await api.postRaw<ResponseData<LoginResType>>(
        "v1/api/auth/login",
        {
          ...body,
        }
      );

      if (res.data.tokens.accessToken) {
        useAppStore.setState({
          userToken: res.data.tokens.accessToken,
          isLogin: true,
        });
      }
      return res;
    },
    onError: (error) => {
      console.error("Error login:", error);
      toast(error.message);
    },
    onSuccess() {
      navigate("/");
      toast("Đăng nhập thành công!");
    },
  });
};

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
