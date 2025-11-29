import React from 'react';
import { Card, Tag, Typography, Space, Divider, Row, Col, Statistic } from 'antd';
import { 
  WarningOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  BugOutlined
} from '@ant-design/icons';
import { PestWarning } from '@/queries/pest-warning';
import dayjs from 'dayjs';

const { Text, Paragraph } = Typography;

interface PestWarningCardProps {
  warning: PestWarning;
  loading?: boolean;
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
  };
  return colorMap[riskLevel] || '#d9d9d9';
};

/**
 * Component hiển thị cảnh báo sâu hại
 */
export const PestWarningCard: React.FC<PestWarningCardProps> = ({ warning, loading = false }) => {
  return (
    <Card
      loading={loading}
      style={{
        borderLeft: `4px solid #722ed1`, // Màu tím cho sâu hại
        marginBottom: 24,
      }}
    >
      {/* Header */}
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Space size="middle" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space size="middle">
            <Tag
              icon={<BugOutlined />}
              color="#722ed1"
              style={{ fontSize: 16, padding: '4px 12px' }}
            >
              CẢNH BÁO SÂU HẠI
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

        {/* Statistics */}
        <Row gutter={24}>
          <Col span={12}>
            <Card size="small" bordered={false} style={{ background: '#fff7e6' }}>
              <Statistic 
                title={<Text strong>Sâu Đục Thân</Text>}
                value={warning.stem_borer_risk} 
                valueStyle={{ color: getRiskColor(warning.stem_borer_risk), fontWeight: 'bold' }} 
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" bordered={false} style={{ background: '#f9f0ff' }}>
              <Statistic 
                title={<Text strong>Muỗi Hành</Text>}
                value={warning.gall_midge_risk} 
                valueStyle={{ color: getRiskColor(warning.gall_midge_risk), fontWeight: 'bold' }} 
                prefix={<BugOutlined />}
              />
            </Card>
          </Col>
        </Row>

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
