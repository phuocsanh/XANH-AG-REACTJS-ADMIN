import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios"
import { useAppStore } from "@/stores"
import { toast } from "react-toastify"

// Hàm chuyển đổi object từ camelCase sang snake_case
const toSnakeCase = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => toSnakeCase(item));
  }
  
  return Object.keys(obj).reduce((acc: any, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    const value = obj[key];
    
    if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
      acc[snakeKey] = toSnakeCase(value);
    } else {
      acc[snakeKey] = value;
    }
    
    return acc;
  }, {});
};

// Hàm chuyển đổi object từ snake_case sang camelCase
const toCamelCase = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  }
  
  return Object.keys(obj).reduce((acc: any, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    const value = obj[key];
    
    if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
      acc[camelKey] = toCamelCase(value);
    } else {
      acc[camelKey] = value;
    }
    
    return acc;
  }, {});
};

// Định nghĩa kiểu dữ liệu cho response lỗi từ API
interface ApiErrorResponse {
  message: string
  statusCode?: number
  error?: string
  data?: any
}

// Mở rộng kiểu AxiosError để bao gồm response.data có kiểu ApiErrorResponse
interface AxiosApiError<T = any> extends AxiosError<T> {
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

// Interceptor cho request
apiClient.interceptors.request.use(
  (config) => {
    const token = useAppStore.getState().userToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Chuyển đổi request data từ camelCase sang snake_case
    if (config.data) {
      config.data = toSnakeCase(config.data);
    }
    
    // Chuyển đổi params từ camelCase sang snake_case
    if (config.params) {
      config.params = toSnakeCase(config.params);
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor cho response
apiClient.interceptors.response.use(
  (response) => {
    // Chuyển đổi response data từ snake_case sang camelCase
    if (response.data) {
      response.data = toCamelCase(response.data);
    }
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
          useAppStore.setState({ userToken: accessToken })
          localStorage.setItem("accessToken", accessToken)

          // Thử lại request ban đầu với token mới
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
          }
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        // Nếu refresh token thất bại, đăng xuất người dùng
        useAppStore.setState({ isLogin: false, userToken: "" })
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
        toast.error(error.message);
      }
    } else {
      // Nếu không có thông báo lỗi từ server, thêm thông báo mặc định
      error.message = errorMessage || 'Đã có lỗi xảy ra. Vui lòng thử lại sau.'
    }
    
    return Promise.reject(error)
  }
)

// Các hàm API helper
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<T>(url, config).then((res: AxiosResponse<T>) => res.data),

  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient
      .post<T>(url, data, config)
      .then((res: AxiosResponse<T>) => res.data),

  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient
      .put<T>(url, data, config)
      .then((res: AxiosResponse<T>) => res.data),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<T>(url, config).then((res: AxiosResponse<T>) => res.data),
}

export default api
