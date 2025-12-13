import { toast } from "react-toastify"
import { RFC7807Error, ValidationError } from "@/models/common"

/**
 * Xử lý lỗi từ API theo chuẩn RFC 7807 và hiển thị toast thông báo
 * @param error Lỗi từ API
 * @param defaultMessage Thông báo mặc định nếu không parse được lỗi
 */
export const handleApiError = (
  error: unknown,
  defaultMessage: string = "Đã xảy ra lỗi không xác định"
) => {
  console.log("API Error:", error)

  // Kiểm tra nếu error có cấu trúc response từ axios
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as { response?: { data?: RFC7807Error } }
    const errorData = axiosError.response?.data

    // Kiểm tra errorData có tồn tại không
    if (!errorData) {
      toast.error(defaultMessage)
      return
    }

    // Kiểm tra errorData có phải là object không
    if (typeof errorData !== "object" || errorData === null) {
      toast.error(defaultMessage)
      return
    }

    // Ưu tiên xử lý lỗi validation (có details) trước vì nó cụ thể hơn
    if ("details" in errorData) {
      const validationError = errorData as ValidationError
      if (Array.isArray(validationError.details) && validationError.details.length > 0) {
        const validationErrors = validationError.details
          .map(
            (detail: { message?: string; field?: string }) => 
              detail.message || detail.field || "Lỗi không xác định"
          )
          .join("\n") // Dùng xuống dòng cho dễ nhìn nếu có nhiều lỗi
        toast.error(validationErrors)
        return
      }
    }

    // Xử lý lỗi theo chuẩn RFC 7807
    if (
      "title" in errorData &&
      "detail" in errorData
    ) {
      // Kiểm tra nếu title và detail là string (ép kiểu về string để an toàn)
      const detail = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
      
      const errorMessage = `${errorData.title}: ${detail}`
      toast.error(errorMessage)
      return
    }
    
    // Fallback cho trường hợp backend trả về message đơn giản
    if ("message" in errorData && typeof (errorData as any).message === 'string') {
        toast.error((errorData as any).message);
        return;
    }
  }

  // Nếu không phải lỗi từ axios, hiển thị lỗi mặc định
  const errorMessage = (error as Error)?.message || defaultMessage
  toast.error(errorMessage)
}