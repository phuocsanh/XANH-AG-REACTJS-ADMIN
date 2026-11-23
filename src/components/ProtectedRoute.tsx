import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/stores';
import { hasPermission } from '@/utils/permission';
import { Result, Button } from 'antd';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredPermission, requiredRole }) => {
  const isLogin = useAppStore((state) => state.isLogin);
  const userInfo = useAppStore((state) => state.userInfo);
  const location = useLocation();

  if (!isLogin) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  if (
    (requiredRole && userInfo?.role?.code !== requiredRole) ||
    (requiredPermission && !hasPermission(userInfo, requiredPermission))
  ) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        background: '#f0f2f5'
      }}>
        <Result
          status="403"
          title="403"
          subTitle="Xin lỗi, bạn không có quyền truy cập trang này."
          extra={
            <Button type="primary" onClick={() => window.history.back()}>
              Quay lại
            </Button>
          }
        />
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
