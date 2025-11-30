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
  useStemBorerWarningQuery,
  useRunStemBorerAnalysisMutation
} from '@/queries/stem-borer';
import {
  useGallMidgeWarningQuery,
  useRunGallMidgeAnalysisMutation
} from '@/queries/gall-midge';
import {
  useBrownPlantHopperWarningQuery,
  useRunBrownPlantHopperAnalysisMutation
} from '@/queries/brown-plant-hopper';
import {
  useSheathBlightWarningQuery,
  useRunSheathBlightAnalysisMutation
} from '@/queries/sheath-blight';
import {
  useGrainDiscolorationWarningQuery,
  useRunGrainDiscolorationAnalysisMutation
} from '@/queries/grain-discoloration';
import { 
  WarningCard, 
  DailyDataTable, 
  LocationForm,
  DiseaseWarningCard
} from '@/components/disease-warning';
import { UpdateLocationDto } from '@/models/rice-blast';

const { Title } = Typography;
const { TabPane } = Tabs;

/**
 * Trang cảnh báo bệnh/sâu hại lúa
 */
export const DiseaseWarningPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('rice-blast');
  
  // Queries - Bệnh
  const { data: location, isLoading: locationLoading } = useLocationQuery();
  const { data: riceBlastWarning, isLoading: riceBlastLoading, refetch: refetchRiceBlast } = useWarningQuery();
  const { data: bacterialBlightWarning, isLoading: bacterialBlightLoading, refetch: refetchBacterialBlight } = useBacterialBlightWarningQuery();
  const { data: sheathBlightWarning, isLoading: sheathBlightLoading, refetch: refetchSheathBlight } = useSheathBlightWarningQuery();
  const { data: grainDiscolorationWarning, isLoading: grainDiscolorationLoading, refetch: refetchGrainDiscoloration } = useGrainDiscolorationWarningQuery();
  
  // Queries - Sâu hại
  const { data: stemBorerWarning, isLoading: stemBorerLoading, refetch: refetchStemBorer } = useStemBorerWarningQuery();
  const { data: gallMidgeWarning, isLoading: gallMidgeLoading, refetch: refetchGallMidge } = useGallMidgeWarningQuery();
  const { data: brownPlantHopperWarning, isLoading: brownPlantHopperLoading, refetch: refetchBrownPlantHopper } = useBrownPlantHopperWarningQuery();
  
  // Mutations
  const updateLocationMutation = useUpdateLocationMutation();
  const runRiceBlastMutation = useRunAnalysisMutation();
  const runBacterialBlightMutation = useRunBacterialBlightAnalysisMutation();
  const runStemBorerMutation = useRunStemBorerAnalysisMutation();
  const runGallMidgeMutation = useRunGallMidgeAnalysisMutation();
  const runBrownPlantHopperMutation = useRunBrownPlantHopperAnalysisMutation();
  const runSheathBlightMutation = useRunSheathBlightAnalysisMutation();
  const runGrainDiscolorationMutation = useRunGrainDiscolorationAnalysisMutation();

  // Handlers
  const handleUpdateLocation = (values: UpdateLocationDto) => {
    updateLocationMutation.mutate(values, {
      onSuccess: () => {
        // Tự động chạy phân tích cho tất cả các loại sau khi cập nhật vị trí
        setTimeout(() => {
          runRiceBlastMutation.mutate();
          runBacterialBlightMutation.mutate();
          runStemBorerMutation.mutate();
          runGallMidgeMutation.mutate();
          runBrownPlantHopperMutation.mutate();
          runSheathBlightMutation.mutate();
          runGrainDiscolorationMutation.mutate();
        }, 500); // Delay nhỏ để đảm bảo location đã được cập nhật
      }
    });
  };

  const handleRefresh = () => {
    switch (activeTab) {
      case 'rice-blast':
        refetchRiceBlast();
        break;
      case 'bacterial-blight':
        refetchBacterialBlight();
        break;
      case 'stem-borer':
        refetchStemBorer();
        break;
      case 'gall-midge':
        refetchGallMidge();
        break;
      case 'brown-plant-hopper':
        refetchBrownPlantHopper();
        break;
      case 'sheath-blight':
        refetchSheathBlight();
        break;
      case 'grain-discoloration':
        refetchGrainDiscoloration();
        break;
    }
  };

  const handleRunAllAnalyses = () => {
    runRiceBlastMutation.mutate();
    runBacterialBlightMutation.mutate();
    runStemBorerMutation.mutate();
    runGallMidgeMutation.mutate();
    runBrownPlantHopperMutation.mutate();
    runSheathBlightMutation.mutate();
    runGrainDiscolorationMutation.mutate();
  };

  const isLoading = locationLoading;
  const isAnalyzing = updateLocationMutation.isPending || 
                      runRiceBlastMutation.isPending || 
                      runBacterialBlightMutation.isPending ||
                      runStemBorerMutation.isPending ||
                      runGallMidgeMutation.isPending ||
                      runBrownPlantHopperMutation.isPending ||
                      runSheathBlightMutation.isPending ||
                      runGrainDiscolorationMutation.isPending;

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
                activeTab === 'stem-borer' ? stemBorerLoading :
                activeTab === 'gall-midge' ? gallMidgeLoading :
                activeTab === 'brown-plant-hopper' ? brownPlantHopperLoading :
                activeTab === 'sheath-blight' ? sheathBlightLoading :
                grainDiscolorationLoading
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
          <>
            {/* Location Form - Full Width at Top */}
            <LocationForm
              location={location}
              onSubmit={handleUpdateLocation}
              loading={updateLocationMutation.isPending}
            />

            {/* Disease Warnings Tabs - Full Width Below */}
            <Card>
                <Tabs activeKey={activeTab} onChange={setActiveTab}>
                  {/* Rice Blast Tab */}
                  <TabPane tab="🦠 Bệnh Đạo Ôn" key="rice-blast">
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          type="primary"
                          icon={<ThunderboltOutlined />}
                          onClick={() => runRiceBlastMutation.mutate()}
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
                          onClick={() => runBacterialBlightMutation.mutate()}
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

                  {/* Stem Borer Tab */}
                  <TabPane tab="🐛 Sâu Đục Thân" key="stem-borer">
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          type="primary"
                          icon={<BugOutlined />}
                          onClick={() => runStemBorerMutation.mutate()}
                          loading={runStemBorerMutation.isPending}
                          disabled={!location}
                        >
                          Phân tích Sâu Đục Thân
                        </Button>
                      </div>

                      {stemBorerWarning ? (
                        <DiseaseWarningCard 
                          warning={stemBorerWarning} 
                          loading={runStemBorerMutation.isPending}
                          title="SÂU ĐỤC THÂN"
                          borderColor="#fa8c16"
                        />
                      ) : (
                        <Alert
                          message="Chưa có dữ liệu cảnh báo Sâu Đục Thân"
                          description="Vui lòng cập nhật vị trí ruộng lúa và chạy phân tích."
                          type="warning"
                          showIcon
                          icon={<BugOutlined />}
                        />
                      )}
                    </Space>
                  </TabPane>

                  {/* Gall Midge Tab */}
                  <TabPane tab="🦟 Muỗi Hành" key="gall-midge">
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          type="primary"
                          icon={<BugOutlined />}
                          onClick={() => runGallMidgeMutation.mutate()}
                          loading={runGallMidgeMutation.isPending}
                          disabled={!location}
                        >
                          Phân tích Muỗi Hành
                        </Button>
                      </div>

                      {gallMidgeWarning ? (
                        <DiseaseWarningCard 
                          warning={gallMidgeWarning} 
                          loading={runGallMidgeMutation.isPending}
                          title="MUỖI HÀNH"
                          borderColor="#722ed1"
                        />
                      ) : (
                        <Alert
                          message="Chưa có dữ liệu cảnh báo Muỗi Hành"
                          description="Vui lòng cập nhật vị trí ruộng lúa và chạy phân tích."
                          type="warning"
                          showIcon
                          icon={<BugOutlined />}
                        />
                      )}
                    </Space>
                  </TabPane>

                  {/* Brown Plant Hopper Tab */}
                  <TabPane tab="🦗 Rầy Nâu" key="brown-plant-hopper">
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          type="primary"
                          icon={<BugOutlined />}
                          onClick={() => runBrownPlantHopperMutation.mutate()}
                          loading={runBrownPlantHopperMutation.isPending}
                          disabled={!location}
                        >
                          Phân tích Rầy Nâu
                        </Button>
                      </div>

                      {brownPlantHopperWarning ? (
                        <DiseaseWarningCard 
                          warning={brownPlantHopperWarning} 
                          loading={runBrownPlantHopperMutation.isPending}
                          title="RẦY NÂU"
                          borderColor="#13c2c2"
                        />
                      ) : (
                        <Alert
                          message="Chưa có dữ liệu cảnh báo Rầy Nâu"
                          description="Vui lòng cập nhật vị trí ruộng lúa và chạy phân tích."
                          type="warning"
                          showIcon
                          icon={<BugOutlined />}
                        />
                      )}
                    </Space>
                  </TabPane>

                  {/* Sheath Blight Tab */}
                  <TabPane tab="🍂 Bệnh Khô Vằn" key="sheath-blight">
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          type="primary"
                          icon={<ThunderboltOutlined />}
                          onClick={() => runSheathBlightMutation.mutate()}
                          loading={runSheathBlightMutation.isPending}
                          disabled={!location}
                        >
                          Phân tích Bệnh Khô Vằn
                        </Button>
                      </div>

                      {sheathBlightWarning ? (
                        <DiseaseWarningCard 
                          warning={sheathBlightWarning} 
                          loading={runSheathBlightMutation.isPending}
                          title="BỆNH KHÔ VẰN"
                          borderColor="#eb2f96"
                        />
                      ) : (
                        <Alert
                          message="Chưa có dữ liệu cảnh báo Bệnh Khô Vằn"
                          description="Vui lòng cập nhật vị trí ruộng lúa và chạy phân tích."
                          type="warning"
                          showIcon
                          icon={<WarningOutlined />}
                        />
                      )}
                    </Space>
                  </TabPane>

                  {/* Grain Discoloration Tab */}
                  <TabPane tab="🌾 Bệnh Lem Lép Hạt" key="grain-discoloration">
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          type="primary"
                          icon={<ThunderboltOutlined />}
                          onClick={() => runGrainDiscolorationMutation.mutate()}
                          loading={runGrainDiscolorationMutation.isPending}
                          disabled={!location}
                        >
                          Phân tích Bệnh Lem Lép Hạt
                        </Button>
                      </div>

                      {grainDiscolorationWarning ? (
                        <DiseaseWarningCard 
                          warning={grainDiscolorationWarning} 
                          loading={runGrainDiscolorationMutation.isPending}
                          title="BỆNH LEM LÉP HẠT"
                          borderColor="#a0d911"
                        />
                      ) : (
                        <Alert
                          message="Chưa có dữ liệu cảnh báo Bệnh Lem Lép Hạt"
                          description="Vui lòng cập nhật vị trí ruộng lúa và chạy phân tích."
                          type="warning"
                          showIcon
                          icon={<WarningOutlined />}
                        />
                      )}
                    </Space>
                  </TabPane>
                </Tabs>
              </Card>
            </>
          )}
      </Space>
    </div>
  );
};

export default DiseaseWarningPage;
