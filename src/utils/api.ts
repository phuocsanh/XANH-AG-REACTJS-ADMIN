import axios, { AxiosInstance, CreateAxiosDefaults } from "axios"
import { isFile, isFileArray, isObjectLike } from "./check-type"
import { AnyObject, SuccessResponse } from "../models/common"
import { useAppStore } from "../stores"

export const URL = import.meta.env.VITE_API_URL || "http://localhost:3003"
export const BASE_URL = URL

export const URL_UPLOAD = BASE_URL + "/media/api/uploads/"

let isRefreshing = false
let failedQueue: {
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
}[] = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(
    (prom: {
      resolve: (value: unknown) => void
      reject: (reason?: unknown) => void
    }) => {
      if (error) {
        prom.reject(error)
      } else {
        prom.resolve(token)
      }
    }
  )

  failedQueue = []
}

// Hàm refresh token không sử dụng hook
const refreshToken = async (): Promise<string> => {
  // Sửa lại key để phù hợp với auth.ts
  const refreshToken = localStorage.getItem("refresh_token")
  if (!refreshToken) {
    throw new Error("Không tìm thấy refresh token")
  }

  try {
    // Gọi API refresh token trực tiếp bằng axios
    const response = await axios.post(`${BASE_URL}auth/refresh`, {
      refresh_token: refreshToken,
    })

    console.log("🔄 Refresh token response:", response.data)

    // Server wrap response trong { success, data }
    // Cần lấy từ response.data.data thay vì response.data
    const responseData = response.data?.data || response.data
    const { access_token, refresh_token: newRefreshToken } = responseData

    if (access_token && newRefreshToken) {
      // Cập nhật token mới vào store và localStorage
      useAppStore.setState({
        accessToken: access_token,
        refreshToken: newRefreshToken,
      })

      // Sửa lại key để phù hợp với auth.ts
      localStorage.setItem("refresh_token", newRefreshToken)
      localStorage.setItem("access_token", access_token)
      
      console.log("✅ Refresh token thành công")
      return access_token
    } else {
      console.error("❌ Không nhận được token mới:", responseData)
      throw new Error("Không nhận được token mới")
    }
  } catch (error) {
    console.error("❌ Lỗi refresh token:", error)
    
    // Xóa token và chuyển hướng về trang đăng nhập
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("access_token")
    useAppStore.setState({
      accessToken: undefined,
      refreshToken: undefined,
      isLogin: false,
      userInfo: undefined,
    })

    // Chuyển hướng về trang đăng nhập
    if (typeof window !== "undefined") {
      window.location.href = "/sign-in"
    }

    throw error
  }
}

const transformPostFormData = (object: AnyObject | FormData = {}) => {
  if (object instanceof FormData) {
    return object
  }
  const formData = new FormData()
  for (const [key, value] of Object.entries(object)) {
    if (isObjectLike(value)) {
      if (Array.isArray(value) && isFileArray(value)) {
        value.forEach((v) => {
          formData.append(key, v as unknown as Blob)
        })
      } else if (isFile(value)) {
        formData.append(key, value as unknown as Blob)
      } else {
        formData.append(key, JSON.stringify(value))
      }
    } else if (value != null) {
      // Handle different value types for FormData
      if (typeof value === "string" || value instanceof Blob) {
        formData.append(key, value)
      } else if (typeof value === "number" || typeof value === "boolean") {
        formData.append(key, String(value))
      } else {
        // For other types, convert to string
        formData.append(key, JSON.stringify(value))
      }
    }
  }
  return formData
}

export class Api {
  instance: AxiosInstance
  constructor(config?: CreateAxiosDefaults) {
    this.instance = axios.create(config)
  }

  async get<T = void>(
    url: string & (T extends void ? "Bạn chưa khai báo kiểu trả về" : string),
    params?: unknown
  ): Promise<T> {
    const response = await this.instance.get<T>(url, { params })
    console.log("__RESPONSE__GET", response)
    // Trả về response thay vì response.data vì interceptor đã xử lý
    return response as unknown as T
  }

  /** form-data */
  async postForm<T = SuccessResponse<unknown>>(
    url: string,
    body?: AnyObject | FormData,
    params?: unknown
  ): Promise<T> {
    const data = transformPostFormData(body)
    const response = await this.instance.postForm<T>(url, data, { params })
    return response as unknown as T
  }

  /** raw-JSON */
  async postRaw<T = SuccessResponse<unknown>>(
    url: string,
    body?: AnyObject,
    params?: unknown
  ): Promise<T> {
    const data = JSON.stringify(body)
    const response = await this.instance.post<T>(url, data, {
      params,
      headers: { "Content-Type": "application/json" },
    })
    return response as unknown as T
  }

  /** form-data */
  async putForm<T = SuccessResponse<unknown>>(
    url: string,
    body?: AnyObject | FormData,
    params?: unknown
  ): Promise<T> {
    const data = transformPostFormData(body)
    const response = await this.instance.putForm<T>(url, data, { params })
    return response as unknown as T
  }

  /** raw-JSON */
  async putRaw<T = SuccessResponse<unknown>>(
    url: string,
    body?: AnyObject,
    params?: unknown
  ): Promise<T> {
    const data = JSON.stringify(body)
    const response = await this.instance.put<T>(url, data, {
      params,
      headers: { "Content-Type": "application/json" },
    })
    return response as unknown as T
  }

  /** form-data */
  async patchForm<T = SuccessResponse<unknown>>(
    url: string,
    body?: AnyObject | FormData,
    params?: unknown
  ): Promise<T> {
    const data = transformPostFormData(body)
    const response = await this.instance.patchForm<T>(url, data, { params })
    return response as unknown as T
  }

  /** raw-JSON */
  async patchRaw<T = SuccessResponse<unknown>>(
    url: string,
    body?: AnyObject,
    params?: unknown
  ): Promise<T> {
    const data = JSON.stringify(body)
    const response = await this.instance.patch<T>(url, data, {
      params,
      headers: { "Content-Type": "application/json" },
    })
    return response as unknown as T
  }

  async delete<T = SuccessResponse<unknown>>(
    url: string,
    params?: unknown
  ): Promise<T> {
    const response = await this.instance.delete<T>(url, { params })
    return response as unknown as T
  }
}

const api = new Api({ baseURL: BASE_URL, timeout: 30000 })
api.instance.interceptors.request.use(
  (config) => {
    if (import.meta.env.MODE === "development") {
      console.log(
        `%c__REQUEST__${config.url}: %o`,
        "color: blue;font-weight: bold",
        config
      )
    }

    // Sửa lại key để phù hợp với auth.ts
    const token =
      useAppStore.getState().accessToken || localStorage.getItem("access_token")
    console.log("🚀 ~ token:", token)

    if (token) {
      config.headers.setAuthorization(`Bearer ${token}`)
    }
    return config
  },
  (error) => {
    throw error
  }
)

api.instance.interceptors.response.use(
  (response) => {
    console.log("Interceptor received response:", response)

    if (import.meta.env.MODE === "development") {
      console.log(
        `%c__RESPONSE__${response.config.url}: %o`,
        "color: green;font-weight: bold",
        response
      )
    }

    // Kiểm tra nếu response có dữ liệu
    if (!response || !response.data) {
      console.log("Response is empty or has no data")
      return response?.data
    }

    console.log("Response data:", response.data)
    console.log("Response data type:", typeof response.data)
    console.log("Response data keys:", Object.keys(response.data))

    // Kiểm tra nếu response có cấu trúc thành công mới (có trường success)
    if (
      typeof response.data === "object" &&
      response.data !== null &&
      "success" in response.data
    ) {
      console.log("Response has success field:", response.data)
      // Kiểm tra nếu success là boolean
      if (typeof response.data.success !== "boolean") {
        console.error("Response success field is not boolean:", response.data)
        return response.data
      }

      // Nếu success = true, trả về data
      if (response.data.success === true) {
        console.log("Response success is true")
        // Kiểm tra nếu data tồn tại
        if ("data" in response.data) {
          console.log("Returning response.data.data:", response.data.data)
          return response.data.data
        } else {
          console.error("Response data is missing 'data' field:", response.data)
          return response.data
        }
      }
      // Nếu success = false, ném lỗi
      else {
        console.log("Response success is false, throwing error")
        throw { response }
      }
    }

    // Kiểm tra nếu response có cấu trúc lỗi theo chuẩn RFC 7807
    if (
      typeof response.data === "object" &&
      response.data !== null &&
      "type" in response.data &&
      "title" in response.data
    ) {
      console.log("RFC 7807 Error detected:", response.data)
      throw { response }
    }

    // Kiểm tra nếu response có cấu trúc lỗi cũ (có trường code và code !== 200)
    if (
      typeof response.data === "object" &&
      response.data !== null &&
      "code" in response.data &&
      response.data.code !== 200
    ) {
      console.log("Legacy API Error detected:", response.data)
      throw { response }
    }

    // Trả về data như trước cho các response cũ không có cấu trúc đặc biệt
    console.log("Returning response.data as-is:", response.data)
    return response.data
  },
  async (error) => {
    const originalRequest = error.config

    if (import.meta.env.MODE === "development") {
      console.log(
        `%c__ERROR__${error.response?.config?.url}: %o`,
        "color: red;font-weight: bold",
        error.response || error
      )
    }

    // Kiểm tra nếu error có cấu trúc response
    if (!error || !error.response) {
      return Promise.reject(error)
    }

    // Xử lý lỗi 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Không thử refresh token cho endpoint đăng nhập
      if (originalRequest.url?.includes("/auth/login")) {
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // Nếu đang refresh token, thêm promise vào queue
        return new Promise<unknown>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token: unknown) => {
            originalRequest.headers["Authorization"] = "Bearer " + token
            return api.instance(originalRequest)
          })
          .catch((err: unknown) => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Sử dụng hàm refresh token thay vì hook
        const newAccessToken = await refreshToken()

        // Cập nhật header cho request gốc
        originalRequest.headers["Authorization"] = "Bearer " + newAccessToken

        // Xử lý các request trong queue
        processQueue(null, newAccessToken)

        // Gử lại request gốc
        return api.instance(originalRequest)
      } catch (refreshError) {
        // Xử lý lỗi refresh token
        processQueue(refreshError, null)
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)
export default api
