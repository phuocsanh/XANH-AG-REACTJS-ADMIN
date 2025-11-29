import React from 'react';
import { 
  Row, 
  Col, 
  Button, 
  Space, 
  Typography, 
  Alert,
  Spin,
  Card 
} from 'antd';
import { 
  ReloadOutlined, 
  ThunderboltOutlined,
  WarningOutlined 
} from '@ant-design/icons';
import { 
  useLocationQuery, 
  useUpdateLocationMutation, 
  useWarningQuery, 
  useRunAnalysisMutation 
} from '@/queries/rice-blast';
import { 
  WarningCard, 
  DailyDataTable, 
  LocationForm 
} from '@/components/rice-blast';
import { UpdateLocationDto } from '@/models/rice-blast';

const { Title } = Typography;

/**
 * Trang cảnh báo bệnh đạo ôn lúa
 */
export const RiceBlastWarningPage: React.FC = () => {
  // Queries
  const { data: location, isLoading: locationLoading } = useLocationQuery();
  const { data: warning, isLoading: warningLoading, refetch: refetchWarning } = useWarningQuery();
  
  // Mutations
  const updateLocationMutation = useUpdateLocationMutation();
  const runAnalysisMutation = useRunAnalysisMutation();

  // Handlers
  const handleUpdateLocation = (values: UpdateLocationDto) => {
    updateLocationMutation.mutate(values);
  };

  const handleRunAnalysis = () => {
    runAnalysisMutation.mutate();
  };

  const handleRefresh = () => {
    refetchWarning();
  };

  const isLoading = locationLoading || warningLoading;
  const isAnalyzing = updateLocationMutation.isPending || runAnalysisMutation.isPending;

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2} style={{ margin: 0 }}>
            🌾 Cảnh Báo Bệnh Đạo Ôn Lúa
          </Title>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={warningLoading}
            >
              Làm mới
            </Button>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={handleRunAnalysis}
              loading={isAnalyzing}
              disabled={!location}
            >
              {isAnalyzing ? 'Đang phân tích...' : 'Phân tích ngay'}
            </Button>
          </Space>
        </div>

        {/* Info Alert */}
        <Alert
          message="Hệ thống tự động cập nhật mỗi ngày lúc 6:00 sáng"
          description="Bạn có thể cập nhật vị trí ruộng lúa hoặc chạy phân tích thủ công bất kỳ lúc nào. Lưu ý: Phân tích thủ công có thể mất 5-10 giây."
          type="info"
          showIcon
        />

        {/* Main Content */}
        {isLoading ? (
          <Card>
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>Đang tải dữ liệu...</div>
            </div>
          </Card>
        ) : (
          <Row gutter={[24, 24]}>
            {/* Left Column - Location Form */}
            <Col xs={24} lg={8}>
              <LocationForm
                location={location}
                onSubmit={handleUpdateLocation}
                loading={updateLocationMutation.isPending}
              />
            </Col>

            {/* Right Column - Warning & Data */}
            <Col xs={24} lg={16}>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* Warning Card */}
                {warning ? (
                  <WarningCard warning={warning} loading={isAnalyzing} />
                ) : (
                  <Alert
                    message="Chưa có dữ liệu cảnh báo"
                    description="Vui lòng cập nhật vị trí ruộng lúa và chạy phân tích."
                    type="warning"
                    showIcon
                    icon={<WarningOutlined />}
                  />
                )}

                {/* Daily Data Table */}
                {warning && warning.daily_data && warning.daily_data.length > 0 && (
                  <Card title="📊 Dữ liệu chi tiết 7 ngày">
                    <DailyDataTable 
                      data={warning.daily_data} 
                      loading={isAnalyzing}
                    />
                  </Card>
                )}
              </Space>
            </Col>
          </Row>
        )}
      </Space>
    </div>
  );
};

export default RiceBlastWarningPage;
