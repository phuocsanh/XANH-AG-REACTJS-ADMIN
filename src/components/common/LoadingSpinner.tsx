import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

interface LoadingSpinnerProps {
  size?: 'small' | 'default' | 'large';
  tip?: string;
  spinning?: boolean;
  children?: React.ReactNode;
  overlay?: boolean; // Hiển thị overlay toàn màn hình
  className?: string;
}

/**
 * Component LoadingSpinner tái sử dụng
 * Hỗ trợ nhiều kích thước và có thể wrap children components
 * Có thể hiển thị như overlay hoặc inline spinner
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'default',
  tip,
  spinning = true,
  children,
  overlay = false,
  className,
}) => {
  // Custom loading icon
  const antIcon = <LoadingOutlined style={{ fontSize: getSizeValue(size) }} spin />;

  // Lấy giá trị size theo pixel
  function getSizeValue(size: 'small' | 'default' | 'large'): number {
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 32;
      default:
        return 24;
    }
  }

  // Nếu có children, wrap chúng với Spin
  if (children) {
    return (
      <Spin 
        spinning={spinning} 
        tip={tip} 
        size={size}
        indicator={antIcon}
        className={className}
      >
        {children}
      </Spin>
    );
  }

  // Nếu là overlay, hiển thị full screen
  if (overlay) {
    return (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}
        className={className}
      >
        <div style={{ textAlign: 'center' }}>
          <Spin 
            spinning={spinning} 
            tip={tip} 
            size={size}
            indicator={antIcon}
          />
        </div>
      </div>
    );
  }

  // Spinner đơn giản
  return (
    <div 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '20px',
      }}
      className={className}
    >
      <Spin 
        spinning={spinning} 
        tip={tip} 
        size={size}
        indicator={antIcon}
      />
    </div>
  );
};

export default LoadingSpinner;