import api from './api';
import { ApiResponse, LoginRequest, LoginResponse, RefreshTokenRequest, TokenResponse } from '@/models/auth.model';
import { useAppStore } from '@/stores';

// Service xử lý các chức năng liên quan đến xác thực
export const authService = {
  /**
   * Đăng nhập người dùng
   * @param credentials Thông tin đăng nhập
   * @returns Thông tin đăng nhập thành công
   * @throws Lỗi nếu đăng nhập thất bại
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await api.post<ApiResponse<LoginResponse>>('/user/login', {
        userAccount: credentials.userAccount,
        userPassword: credentials.userPassword
      });
      
      // Kiểm tra response hợp lệ
      if (!response?.data) {
        throw new Error('Dữ liệu phản hồi không hợp lệ');
      }
      
      const { token, user } = response.data;
      
      if (token) {
        // Lưu token vào localStorage và state
        localStorage.setItem('accessToken', token.accessToken);
        localStorage.setItem('refreshToken', token.refreshToken);
        
        // Cập nhật trạng thái đăng nhập
        useAppStore.setState(prev => ({
          ...prev,
          userToken: token.accessToken,
          isLogin: true,
          userInfo: user
        }));
        
        // Lưu thông tin user vào localStorage
        localStorage.setItem('userData', JSON.stringify(user));
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Lỗi đăng nhập:', error);
      
      // Ném lỗi để interceptor xử lý
      throw error;
    }
  },
  
  // Đăng xuất
  logout: async (): Promise<void> => {
    try {
      await api.post('/user/logout');
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
    } finally {
      // Xóa token khỏi localStorage và state
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userData');
      
      useAppStore.setState({
        userToken: '',
        isLogin: false
      });
    }
  },
  
  // Làm mới token
  refreshToken: async (refreshToken: string): Promise<TokenResponse> => {
    const response = await api.post<ApiResponse<TokenResponse>>('/user/refresh-token', { refreshToken });
    
    if (response.data && response.data.accessToken) {
      // Cập nhật token mới
      localStorage.setItem('accessToken', response.data.accessToken);
      useAppStore.setState({ userToken: response.data.accessToken });
    }
    
    return response.data;
  },
  
  // Kiểm tra trạng thái đăng nhập
  checkAuthStatus: (): boolean => {
    const token = localStorage.getItem('accessToken');
    const isLoggedIn = !!token;
    
    // Cập nhật state nếu có token nhưng state chưa được cập nhật
    if (isLoggedIn && !useAppStore.getState().isLogin) {
      useAppStore.setState({
        userToken: token,
        isLogin: true
      });
    }
    
    return isLoggedIn;
  }
};

export default authService;
