import React from 'react';
import { Card, Tag, Typography, Space, Divider } from 'antd';
import { 
  WarningOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text, Paragraph } = Typography;

/**
 * Interface chung cho tất cả các loại cảnh báo
 */
export interface GenericWarning {
  id: number;
  generated_at: string;
  risk_level: string;
  message: string;
  daily_data?: any[];
  updated_at: string;
}

interface DiseaseWarningCardProps {
  warning: GenericWarning;
  loading?: boolean;
  title: string; // Tiêu đề của bệnh/sâu hại
  icon?: React.ReactNode; // Icon tùy chỉnh
  borderColor?: string; // Màu viền tùy chỉnh
}

/**
 * Lấy màu sắc theo mức độ nguy cơ
 */
const getRiskColor = (riskLevel: string): string => {
  const colorMap: Record<string, string> = {
    'CAO': '#ff4d4f',
    'TRUNG BÌNH': '#faad14',
    'THẤP': '#52c41a',
    'AN TOÀN': '#1890ff',
    'ĐANG CHỜ CẬP NHẬT': '#d9d9d9',
  };
  return colorMap[riskLevel] || '#d9d9d9';
};

/**
 * Lấy icon theo mức độ nguy cơ
 */
const getRiskIcon = (riskLevel: string) => {
  if (riskLevel === 'AN TOÀN') {
    return <CheckCircleOutlined />;
  } else if (riskLevel === 'ĐANG CHỜ CẬP NHẬT') {
    return <ClockCircleOutlined />;
  }
  return <WarningOutlined />;
};

/**
 * Component hiển thị cảnh báo bệnh/sâu hại tổng quát
 * Có thể tái sử dụng cho tất cả các loại cảnh báo
 */
export const DiseaseWarningCard: React.FC<DiseaseWarningCardProps> = ({ 
  warning, 
  loading = false,
  title,
  icon,
  borderColor
}) => {
  const riskColor = borderColor || getRiskColor(warning.risk_level);
  const riskIcon = icon || getRiskIcon(warning.risk_level);

  return (
    <Card
      loading={loading}
      style={{
        borderLeft: `4px solid ${riskColor}`,
        marginBottom: 24,
      }}
    >
      {/* Header */}
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Space size="middle" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space size="middle">
            <Tag
              icon={riskIcon}
              color={riskColor}
              style={{ fontSize: 16, padding: '4px 12px' }}
            >
              {title}
            </Tag>
            <Tag
              color={riskColor}
              style={{ fontSize: 14, padding: '2px 8px' }}
            >
              {warning.risk_level}
            </Tag>
          </Space>
          
          <Space>
            <ClockCircleOutlined />
            <Text type="secondary">
              Cập nhật: {dayjs(warning.updated_at).format('DD/MM/YYYY HH:mm')}
            </Text>
          </Space>
        </Space>

        <Divider style={{ margin: '12px 0' }} />

        {/* Message */}
        <Paragraph
          style={{
            whiteSpace: 'pre-wrap',
            backgroundColor: '#f5f5f5',
            padding: 16,
            borderRadius: 8,
            marginBottom: 0,
          }}
        >
          {warning.message}
        </Paragraph>
      </Space>
    </Card>
  );
};
