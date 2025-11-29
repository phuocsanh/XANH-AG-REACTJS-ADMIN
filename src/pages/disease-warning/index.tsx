import React, { useState } from 'react';
import { 
  Row, 
  Col, 
  Button, 
  Space, 
  Typography, 
  Alert,
  Spin,
  Card,
  Tabs 
} from 'antd';
import { 
  ReloadOutlined, 
  ThunderboltOutlined,
  WarningOutlined,
  BugOutlined
} from '@ant-design/icons';
import { 
  useLocationQuery, 
  useUpdateLocationMutation, 
  useWarningQuery, 
  useRunAnalysisMutation 
} from '@/queries/rice-blast';
import {
  useBacterialBlightWarningQuery,
  useRunBacterialBlightAnalysisMutation
} from '@/queries/bacterial-blight';
import {
  usePestWarningQuery,
  useRunPestAnalysisMutation
} from '@/queries/pest-warning';
import { 
  WarningCard, 
  DailyDataTable, 
  LocationForm,
  PestWarningCard
} from '@/components/disease-warning';
import { UpdateLocationDto } from '@/models/rice-blast';

const { Title } = Typography;
const { TabPane } = Tabs;

/**
 * Trang cảnh báo bệnh/sâu hại lúa
 */
export const DiseaseWarningPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('rice-blast');
  
  // Queries
  const { data: location, isLoading: locationLoading } = useLocationQuery();
  const { data: riceBlastWarning, isLoading: riceBlastLoading, refetch: refetchRiceBlast } = useWarningQuery();
  const { data: bacterialBlightWarning, isLoading: bacterialBlightLoading, refetch: refetchBacterialBlight } = useBacterialBlightWarningQuery();
  const { data: pestWarning, isLoading: pestLoading, refetch: refetchPest } = usePestWarningQuery();
  
  // Mutations
  const updateLocationMutation = useUpdateLocationMutation();
  const runRiceBlastMutation = useRunAnalysisMutation();
  const runBacterialBlightMutation = useRunBacterialBlightAnalysisMutation();
  const runPestMutation = useRunPestAnalysisMutation();

  // Handlers
  const handleUpdateLocation = (values: UpdateLocationDto) => {
    updateLocationMutation.mutate(values);
  };

  const handleRunRiceBlastAnalysis = () => {
    runRiceBlastMutation.mutate();
  };

  const handleRunBacterialBlightAnalysis = () => {
    runBacterialBlightMutation.mutate();
  };

  const handleRunPestAnalysis = () => {
    runPestMutation.mutate();
  };

  const handleRefresh = () => {
    if (activeTab === 'rice-blast') {
      refetchRiceBlast();
    } else if (activeTab === 'bacterial-blight') {
      refetchBacterialBlight();
    } else {
      refetchPest();
    }
  };

  const handleRunAllAnalyses = () => {
    runRiceBlastMutation.mutate();
    runBacterialBlightMutation.mutate();
    runPestMutation.mutate();
  };

  const isLoading = locationLoading;
  const isAnalyzing = updateLocationMutation.isPending || 
                      runRiceBlastMutation.isPending || 
                      runBacterialBlightMutation.isPending ||
                      runPestMutation.isPending;

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2} style={{ margin: 0 }}>
            🌾 Cảnh Báo Bệnh/Sâu Hại Lúa
          </Title>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={
                activeTab === 'rice-blast' ? riceBlastLoading : 
                activeTab === 'bacterial-blight' ? bacterialBlightLoading :
                pestLoading
              }
            >
              Làm mới
            </Button>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={handleRunAllAnalyses}
              loading={isAnalyzing}
              disabled={!location}
            >
              {isAnalyzing ? 'Đang phân tích...' : 'Phân tích tất cả'}
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

            {/* Right Column - Disease Warnings */}
            <Col xs={24} lg={16}>
              <Card>
                <Tabs activeKey={activeTab} onChange={setActiveTab}>
                  {/* Rice Blast Tab */}
                  <TabPane tab="🦠 Bệnh Đạo Ôn" key="rice-blast">
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          type="primary"
                          icon={<ThunderboltOutlined />}
                          onClick={handleRunRiceBlastAnalysis}
                          loading={runRiceBlastMutation.isPending}
                          disabled={!location}
                        >
                          Phân tích bệnh đạo ôn
                        </Button>
                      </div>

                      {riceBlastWarning ? (
                        <>
                          <WarningCard warning={riceBlastWarning} loading={runRiceBlastMutation.isPending} />
                          {riceBlastWarning.daily_data && riceBlastWarning.daily_data.length > 0 && (
                            <Card title="📊 Dữ liệu chi tiết 7 ngày">
                              <DailyDataTable 
                                data={riceBlastWarning.daily_data} 
                                loading={runRiceBlastMutation.isPending}
                              />
                            </Card>
                          )}
                        </>
                      ) : (
                        <Alert
                          message="Chưa có dữ liệu cảnh báo bệnh đạo ôn"
                          description="Vui lòng cập nhật vị trí ruộng lúa và chạy phân tích."
                          type="warning"
                          showIcon
                          icon={<WarningOutlined />}
                        />
                      )}
                    </Space>
                  </TabPane>

                  {/* Bacterial Blight Tab */}
                  <TabPane tab="🍃 Bệnh Cháy Bìa Lá" key="bacterial-blight">
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          type="primary"
                          icon={<ThunderboltOutlined />}
                          onClick={handleRunBacterialBlightAnalysis}
                          loading={runBacterialBlightMutation.isPending}
                          disabled={!location}
                        >
                          Phân tích bệnh cháy bìa lá
                        </Button>
                      </div>

                      {bacterialBlightWarning ? (
                        <>
                          <WarningCard warning={bacterialBlightWarning} loading={runBacterialBlightMutation.isPending} />
                          {bacterialBlightWarning.daily_data && bacterialBlightWarning.daily_data.length > 0 && (
                            <Card title="📊 Dữ liệu chi tiết 7 ngày">
                              <DailyDataTable 
                                data={bacterialBlightWarning.daily_data} 
                                loading={runBacterialBlightMutation.isPending}
                                diseaseType="bacterial-blight"
                              />
                            </Card>
                          )}
                        </>
                      ) : (
                        <Alert
                          message="Chưa có dữ liệu cảnh báo bệnh cháy bìa lá"
                          description="Vui lòng cập nhật vị trí ruộng lúa và chạy phân tích."
                          type="warning"
                          showIcon
                          icon={<WarningOutlined />}
                        />
                      )}
                    </Space>
                  </TabPane>

                  {/* Pest Warning Tab */}
                  <TabPane tab="🐛 Cảnh Báo Sâu Hại" key="pest-warning">
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          type="primary"
                          icon={<BugOutlined />}
                          onClick={handleRunPestAnalysis}
                          loading={runPestMutation.isPending}
                          disabled={!location}
                        >
                          Phân tích sâu hại
                        </Button>
                      </div>

                      {pestWarning ? (
                        <PestWarningCard warning={pestWarning} loading={runPestMutation.isPending} />
                      ) : (
                        <Alert
                          message="Chưa có dữ liệu cảnh báo sâu hại"
                          description="Vui lòng cập nhật vị trí ruộng lúa và chạy phân tích."
                          type="warning"
                          showIcon
                          icon={<BugOutlined />}
                        />
                      )}
                    </Space>
                  </TabPane>
                </Tabs>
              </Card>
            </Col>
          </Row>
        )}
      </Space>
    </div>
  );
};

export default DiseaseWarningPage;

