// Định nghĩa các kiểu dữ liệu cho xác thực

export interface LoginRequest {
  userAccount: string;
  userPassword: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userID: number;
}

export interface UserResponse {
  id: number;
  account: string;
  email: string;
}

// Response từ API login thành công
export interface LoginResponse {
  user: UserResponse;
  token: TokenResponse;
  isSuccessful: boolean;
  errorMessage: string;
}

// Response từ API khi có lỗi
export interface ErrorResponse {
  code: number;
  message: string;
  details?: any;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// Định dạng response chung từ server
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp?: string;
  path?: string;
}
