import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/stores';
import { isPublicRoute } from '@/config/routes';
import { toast } from 'react-toastify';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const isAuthenticated = useAppStore(state => state.isLogin);
  const [initialCheck, setInitialCheck] = useState(false);
  const [hasShownToast, setHasShownToast] = useState(false);
  const currentPath = location.pathname;

  useEffect(() => {
    if (!initialCheck) {
      setInitialCheck(true);
      return;
    }

    // Chỉ hiển thị thông báo nếu đã check xác thực và người dùng chưa đăng nhập
    // và không phải là trang công khai
    if (!isAuthenticated && !isPublicRoute(currentPath) && !hasShownToast) {
      toast.error('Vui lòng đăng nhập để truy cập trang này');
      setHasShownToast(true);
    }
  }, [isAuthenticated, currentPath, initialCheck, hasShownToast]);

  if (!initialCheck) {
    return null; // Hoặc một loading spinner
  }

  if (!isAuthenticated && !isPublicRoute(currentPath)) {
    return <Navigate to="/signIn" state={{ from: currentPath }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
