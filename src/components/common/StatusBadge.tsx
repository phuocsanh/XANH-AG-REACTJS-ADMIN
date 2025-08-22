import React from 'react';
import { Badge, Tag } from 'antd';
import type { BadgeProps, TagProps } from 'antd';

type StatusType = 'success' | 'error' | 'warning' | 'info' | 'default' | 'processing';

interface StatusConfig {
  color: string;
  text: string;
  badgeStatus?: BadgeProps['status'];
}

interface StatusBadgeProps {
  status: StatusType | string;
  text?: string;
  type?: 'badge' | 'tag';
  size?: 'small' | 'default';
  customConfig?: Record<string, StatusConfig>;
  showDot?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Component StatusBadge tái sử dụng
 * Hiển thị trạng thái với Badge hoặc Tag
 * Hỗ trợ custom config cho các trạng thái
 * Có thể tùy chỉnh màu sắc và text
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  text,
  type = 'tag',
  size = 'default',
  customConfig = {},
  showDot = false,
  className,
  style,
}) => {
  // Cấu hình mặc định cho các trạng thái
  const defaultStatusConfig: Record<string, StatusConfig> = {
    success: {
      color: '#52c41a',
      text: 'Thành công',
      badgeStatus: 'success',
    },
    error: {
      color: '#ff4d4f',
      text: 'Lỗi',
      badgeStatus: 'error',
    },
    warning: {
      color: '#faad14',
      text: 'Cảnh báo',
      badgeStatus: 'warning',
    },
    info: {
      color: '#1890ff',
      text: 'Thông tin',
      badgeStatus: 'processing',
    },
    default: {
      color: '#d9d9d9',
      text: 'Mặc định',
      badgeStatus: 'default',
    },
    processing: {
      color: '#1890ff',
      text: 'Đang xử lý',
      badgeStatus: 'processing',
    },
    // Các trạng thái phổ biến trong ứng dụng
    active: {
      color: '#52c41a',
      text: 'Hoạt động',
      badgeStatus: 'success',
    },
    inactive: {
      color: '#d9d9d9',
      text: 'Không hoạt động',
      badgeStatus: 'default',
    },
    pending: {
      color: '#faad14',
      text: 'Chờ xử lý',
      badgeStatus: 'warning',
    },
    approved: {
      color: '#52c41a',
      text: 'Đã duyệt',
      badgeStatus: 'success',
    },
    rejected: {
      color: '#ff4d4f',
      text: 'Từ chối',
      badgeStatus: 'error',
    },
    draft: {
      color: '#d9d9d9',
      text: 'Bản nháp',
      badgeStatus: 'default',
    },
    published: {
      color: '#52c41a',
      text: 'Đã xuất bản',
      badgeStatus: 'success',
    },
  };

  // Kết hợp config mặc định với custom config
  const statusConfig = { ...defaultStatusConfig, ...customConfig };

  // Lấy config cho status hiện tại
  const currentConfig = statusConfig[status] || {
    color: '#d9d9d9',
    text: status.toString(),
    badgeStatus: 'default' as BadgeProps['status'],
  };

  // Text hiển thị
  const displayText = text || currentConfig.text;

  // Render Badge
  if (type === 'badge') {
    return (
      <Badge
        status={currentConfig.badgeStatus}
        text={displayText}
        className={className}
        style={style}
      />
    );
  }

  // Render Tag
  const tagProps: TagProps = {
    color: currentConfig.color,
    className,
    style,
  };

  if (size === 'small') {
    tagProps.style = { ...tagProps.style, fontSize: '12px', padding: '0 4px' };
  }

  return (
    <Tag {...tagProps}>
      {showDot && (
        <span
          style={{
            display: 'inline-block',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'currentColor',
            marginRight: '4px',
          }}
        />
      )}
      {displayText}
    </Tag>
  );
};

export default StatusBadge;
export type { StatusBadgeProps, StatusConfig, StatusType };