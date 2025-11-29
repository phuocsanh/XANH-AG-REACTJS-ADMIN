import React from 'react';
import { Card, Tag, Typography, Space, Divider } from 'antd';
import { 
  WarningOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  CalendarOutlined 
} from '@ant-design/icons';
import { RiceBlastWarning, RiskLevel } from '@/models/rice-blast';
import { BacterialBlightWarning } from '@/queries/bacterial-blight';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

interface WarningCardProps {
  warning: RiceBlastWarning | BacterialBlightWarning;
  loading?: boolean;
}

/**
 * Lấy màu sắc theo mức độ nguy cơ
 */
const getRiskColor = (riskLevel: RiskLevel): string => {
  const colorMap: Record<RiskLevel, string> = {
    'RẤT CAO': '#ff4d4f',
    'CAO': '#fa8c16',
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
const getRiskIcon = (riskLevel: RiskLevel) => {
  if (riskLevel === 'AN TOÀN') {
    return <CheckCircleOutlined />;
  } else if (riskLevel === 'ĐANG CHỜ CẬP NHẬT') {
    return <ClockCircleOutlined />;
  }
  return <WarningOutlined />;
};

/**
 * Component hiển thị cảnh báo bệnh đạo ôn
 */
export const WarningCard: React.FC<WarningCardProps> = ({ warning, loading = false }) => {
  const riskColor = getRiskColor(warning.risk_level as RiskLevel);
  const riskIcon = getRiskIcon(warning.risk_level as RiskLevel);

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
              {warning.risk_level}
            </Tag>
            <Text strong style={{ fontSize: 18 }}>
              {warning.probability}%
            </Text>
          </Space>
          
          {warning.peak_days && (
            <Space>
              <CalendarOutlined style={{ color: riskColor }} />
              <Text type="danger" strong>
                Ngày cao điểm: {warning.peak_days}
              </Text>
            </Space>
          )}
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

        <Divider style={{ margin: '12px 0' }} />

        {/* Footer */}
        <Space size="middle">
          <ClockCircleOutlined />
          <Text type="secondary">
            Cập nhật: {dayjs(warning.updated_at).format('DD/MM/YYYY HH:mm')}
          </Text>
        </Space>
      </Space>
    </Card>
  );
};
