import React from 'react';
import { Box, Alert } from '@mui/material';
import { Card as AntCard, Tabs as AntTabs } from 'antd';
import { WarningCard, DailyDataTable, DiseaseWarningCard } from '@/components/disease-warning';

const { TabPane } = AntTabs;

interface DiseaseTabsContentProps {
  diseaseWarningTab: string;
  setDiseaseWarningTab: (key: string) => void;
  riceBlastWarning: any;
  bacterialBlightWarning: any;
  stemBorerWarning: any;
  gallMidgeWarning: any;
  brownPlantHopperWarning: any;
  sheathBlightWarning: any;
  grainDiscolorationWarning: any;
  runRiceBlastMutation: any;
  runBacterialBlightMutation: any;
  runStemBorerMutation: any;
  runGallMidgeMutation: any;
  runBrownPlantHopperMutation: any;
  runSheathBlightMutation: any;
  runGrainDiscolorationMutation: any;
}

export const DiseaseTabsContent = React.memo<DiseaseTabsContentProps>(({
  diseaseWarningTab,
  setDiseaseWarningTab,
  riceBlastWarning,
  bacterialBlightWarning,
  stemBorerWarning,
  gallMidgeWarning,
  brownPlantHopperWarning,
  sheathBlightWarning,
  grainDiscolorationWarning,
  runRiceBlastMutation,
  runBacterialBlightMutation,
  runStemBorerMutation,
  runGallMidgeMutation,
  runBrownPlantHopperMutation,
  runSheathBlightMutation,
  runGrainDiscolorationMutation,
}) => {
  return (
    <AntCard>
      <AntTabs activeKey={diseaseWarningTab} onChange={setDiseaseWarningTab}>
        {/* Rice Blast Tab */}
        <TabPane tab="🦠 Bệnh Đạo Ôn" key="rice-blast">
          <Box sx={{ pt: 2 }}>
            {riceBlastWarning ? (
              <>
                <WarningCard warning={riceBlastWarning} title="Bệnh Đạo Ôn" loading={runRiceBlastMutation.isPending} />
                {riceBlastWarning.daily_data && riceBlastWarning.daily_data.length > 0 && (
                  <AntCard title="📊 Dữ liệu chi tiết 7 ngày" style={{ marginTop: 16 }}>
                    <DailyDataTable 
                      data={riceBlastWarning.daily_data} 
                      loading={runRiceBlastMutation.isPending}
                    />
                  </AntCard>
                )}
              </>
            ) : (
              <Alert severity="warning">
                Chưa có dữ liệu cảnh báo bệnh đạo ôn. Vui lòng cập nhật vị trí ruộng lúa.
              </Alert>
            )}
          </Box>
        </TabPane>

        {/* Bacterial Blight Tab */}
        <TabPane tab="🍃 Bệnh Cháy Bìa Lá" key="bacterial-blight">
          <Box sx={{ pt: 2 }}>
            {bacterialBlightWarning ? (
              <>
                <WarningCard warning={bacterialBlightWarning} title="Bệnh Cháy Bìa Lá" loading={runBacterialBlightMutation.isPending} />
                {bacterialBlightWarning.daily_data && bacterialBlightWarning.daily_data.length > 0 && (
                  <AntCard title="📊 Dữ liệu chi tiết 7 ngày" style={{ marginTop: 16 }}>
                    <DailyDataTable 
                      data={bacterialBlightWarning.daily_data} 
                      loading={runBacterialBlightMutation.isPending}
                      diseaseType="bacterial-blight"
                    />
                  </AntCard>
                )}
              </>
            ) : (
              <Alert severity="warning">
                Chưa có dữ liệu cảnh báo bệnh cháy bìa lá. Vui lòng cập nhật vị trí ruộng lúa.
              </Alert>
            )}
          </Box>
        </TabPane>

        {/* Stem Borer Tab */}
        <TabPane tab="🐛 Sâu Đục Thân" key="stem-borer">
          <Box sx={{ pt: 2 }}>
            {stemBorerWarning ? (
              <>
                <DiseaseWarningCard 
                  warning={stemBorerWarning} 
                  loading={runStemBorerMutation.isPending}
                  title="SÂU ĐỤC THÂN"
                  borderColor="#fa8c16"
                />
                {stemBorerWarning.daily_data && stemBorerWarning.daily_data.length > 0 && (
                  <AntCard title="📊 Dữ liệu chi tiết 7 ngày" style={{ marginTop: 16 }}>
                    <DailyDataTable 
                      data={stemBorerWarning.daily_data} 
                      loading={runStemBorerMutation.isPending}
                      diseaseType="stem-borer"
                    />
                  </AntCard>
                )}
              </>
            ) : (
              <Alert severity="warning">
                Chưa có dữ liệu cảnh báo Sâu Đục Thân. Vui lòng cập nhật vị trí ruộng lúa.
              </Alert>
            )}
          </Box>
        </TabPane>

        {/* Gall Midge Tab */}
        <TabPane tab="🦟 Muỗi Hành" key="gall-midge">
          <Box sx={{ pt: 2 }}>
            {gallMidgeWarning ? (
              <>
                <DiseaseWarningCard 
                  warning={gallMidgeWarning} 
                  loading={runGallMidgeMutation.isPending}
                  title="MUỖI HÀNH"
                  borderColor="#722ed1"
                />
                {gallMidgeWarning.daily_data && gallMidgeWarning.daily_data.length > 0 && (
                  <AntCard title="📊 Dữ liệu chi tiết 7 ngày" style={{ marginTop: 16 }}>
                    <DailyDataTable 
                      data={gallMidgeWarning.daily_data} 
                      loading={runGallMidgeMutation.isPending}
                      diseaseType="gall-midge"
                    />
                  </AntCard>
                )}
              </>
            ) : (
              <Alert severity="warning">
                Chưa có dữ liệu cảnh báo Muỗi Hành. Vui lòng cập nhật vị trí ruộng lúa.
              </Alert>
            )}
          </Box>
        </TabPane>

        {/* Brown Plant Hopper Tab */}
        <TabPane tab="🦗 Rầy Nâu" key="brown-plant-hopper">
          <Box sx={{ pt: 2 }}>
            {brownPlantHopperWarning ? (
              <>
                <DiseaseWarningCard 
                  warning={brownPlantHopperWarning} 
                  loading={runBrownPlantHopperMutation.isPending}
                  title="RẦY NÂU"
                  borderColor="#13c2c2"
                />
                {brownPlantHopperWarning.daily_data && brownPlantHopperWarning.daily_data.length > 0 && (
                  <AntCard title="📊 Dữ liệu chi tiết 7 ngày" style={{ marginTop: 16 }}>
                    <DailyDataTable 
                      data={brownPlantHopperWarning.daily_data} 
                      loading={runBrownPlantHopperMutation.isPending}
                      diseaseType="brown-plant-hopper"
                    />
                  </AntCard>
                )}
              </>
            ) : (
              <Alert severity="warning">
                Chưa có dữ liệu cảnh báo Rầy Nâu. Vui lòng cập nhật vị trí ruộng lúa.
              </Alert>
            )}
          </Box>
        </TabPane>

        {/* Sheath Blight Tab */}
        <TabPane tab="🍂 Bệnh Khô Vằn" key="sheath-blight">
          <Box sx={{ pt: 2 }}>
            {sheathBlightWarning ? (
              <>
                <DiseaseWarningCard 
                  warning={sheathBlightWarning} 
                  loading={runSheathBlightMutation.isPending}
                  title="BỆNH KHÔ VẰN"
                  borderColor="#eb2f96"
                />
                {sheathBlightWarning.daily_data && sheathBlightWarning.daily_data.length > 0 && (
                  <AntCard title="📊 Dữ liệu chi tiết 7 ngày" style={{ marginTop: 16 }}>
                    <DailyDataTable 
                      data={sheathBlightWarning.daily_data} 
                      loading={runSheathBlightMutation.isPending}
                      diseaseType="sheath-blight"
                    />
                  </AntCard>
                )}
              </>
            ) : (
              <Alert severity="warning">
                Chưa có dữ liệu cảnh báo Bệnh Khô Vằn. Vui lòng cập nhật vị trí ruộng lúa.
              </Alert>
            )}
          </Box>
        </TabPane>

        {/* Grain Discoloration Tab */}
        <TabPane tab="🌾 Bệnh Lem Lép Hạt" key="grain-discoloration">
          <Box sx={{ pt: 2 }}>
            {grainDiscolorationWarning ? (
              <>
                <DiseaseWarningCard 
                  warning={grainDiscolorationWarning} 
                  loading={runGrainDiscolorationMutation.isPending}
                  title="BỆNH LEM LÉP HẠT"
                  borderColor="#a0d911"
                />
                {grainDiscolorationWarning.daily_data && grainDiscolorationWarning.daily_data.length > 0 && (
                  <AntCard title="📊 Dữ liệu chi tiết 7 ngày" style={{ marginTop: 16 }}>
                    <DailyDataTable 
                      data={grainDiscolorationWarning.daily_data} 
                      loading={runGrainDiscolorationMutation.isPending}
                      diseaseType="grain-discoloration"
                    />
                  </AntCard>
                )}
              </>
            ) : (
              <Alert severity="warning">
                Chưa có dữ liệu cảnh báo Bệnh Lem Lép Hạt. Vui lòng cập nhật vị trí ruộng lúa.
              </Alert>
            )}
          </Box>
        </TabPane>
      </AntTabs>
    </AntCard>
  );
});

DiseaseTabsContent.displayName = 'DiseaseTabsContent';
