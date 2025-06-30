import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios"
import { useAppStore } from "@/stores"
import { toast } from "react-toastify"

// Cache cho key transformations để tránh regex lặp lại

// Định nghĩa kiểu dữ liệu cho response lỗi từ API
interface ApiErrorResponse {
  message: string
  statusCode?: number
  error?: string
  data?: unknown
}

// Mở rộng kiểu AxiosError để bao gồm response.data có kiểu ApiErrorResponse
interface AxiosApiError<T = unknown> extends AxiosError<T> {
  response?: AxiosResponse<T>
}

// Định nghĩa base URL cho API
export const API_URL = "http://localhost:8002/v1"

// Tạo instance axios với cấu hình mặc định
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Cache cho pending requests để tránh duplicate calls
const pendingRequests = new Map<string, Promise<unknown>>()

// Hàm tạo key cho request cache
const createRequestKey = (config: AxiosRequestConfig): string => {
  return `${config.method?.toUpperCase()}_${config.url}_${JSON.stringify(
    config.params || {}
  )}`
}

// Interceptor cho request với tối ưu hiệu suất
apiClient.interceptors.request.use(
  (config) => {
    const token = useAppStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Server đã chuyển sang camelCase, không cần transform data nữa
    // if (config.data && typeof config.data === 'object') {
    //   config.data = toSnakeCase(config.data)
    // }

    // if (config.params && typeof config.params === 'object') {
    //   config.params = toSnakeCase(config.params)
    // }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor cho response với tối ưu hiệu suất
apiClient.interceptors.response.use(
  (response) => {
    // Server đã trả về camelCase, không cần transform nữa
    // if (response.data && typeof response.data === 'object') {
    //   response.data = toCamelCase(response.data)
    // }
    return response
  },
  async (error: AxiosApiError<ApiErrorResponse>) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean
    }

    // Xử lý lỗi 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Thử refresh token
        const refreshToken = localStorage.getItem("refreshToken")
        if (refreshToken) {
          const response = await apiClient.post("/user/refresh-token", {
            refreshToken,
          })
          const { accessToken } = response.data.data

          // Cập nhật token mới
          useAppStore.setState({ accessToken: accessToken })
          localStorage.setItem("accessToken", accessToken)

          // Thử lại request ban đầu với token mới
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
          }
          return apiClient(originalRequest)
        }
      } catch {
        // Nếu refresh token thất bại, đăng xuất người dùng
        useAppStore.setState({ isLogin: false, accessToken: "" })
        localStorage.removeItem("accessToken")
        localStorage.removeItem("refreshToken")
        toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.")
        window.location.href = "/signIn"
      }
    }

    // Xử lý các lỗi khác
    const errorMessage = error.response?.data?.message || error.message

    // Nếu có thông báo lỗi từ server, sử dụng nó
    if (error.response?.data?.message) {
      error.message = error.response.data.message

      // Chỉ hiển thị toast cho lỗi không phải 401 (vì 401 đã xử lý riêng)
      if (error.response.status !== 401) {
        toast.error(error.message)
      }
    } else {
      // Nếu không có thông báo lỗi từ server, thêm thông báo mặc định
      error.message = errorMessage || "Đã có lỗi xảy ra. Vui lòng thử lại sau."
    }

    return Promise.reject(error)
  }
)

// Các hàm API helper với tối ưu hiệu suất
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) => {
    const requestKey = createRequestKey({ method: "GET", url, ...config })

    // Kiểm tra nếu request đang pending để tránh duplicate
    if (pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey) as Promise<T>
    }

    const promise = apiClient
      .get<T>(url, config)
      .then((res: AxiosResponse<T>) => {
        pendingRequests.delete(requestKey)
        return res.data
      })
      .catch((error) => {
        pendingRequests.delete(requestKey)
        throw error
      })

    pendingRequests.set(requestKey, promise)
    return promise
  },

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient
      .post<T>(url, data, config)
      .then((res: AxiosResponse<T>) => res.data),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient
      .put<T>(url, data, config)
      .then((res: AxiosResponse<T>) => res.data),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<T>(url, config).then((res: AxiosResponse<T>) => res.data),

  // Hàm clear pending requests cache
  clearPendingRequests: () => {
    pendingRequests.clear()
  },
}

export default api
