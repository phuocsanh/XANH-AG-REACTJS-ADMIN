import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Space } from 'antd';

interface DiseaseHeaderActionsProps {
  diseaseWarningTab: string;
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
  updateLocationMutation: any;
  diseaseLocation: any;
}

export const DiseaseHeaderActions = React.memo<DiseaseHeaderActionsProps>(({
  diseaseWarningTab,
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
  updateLocationMutation,
  diseaseLocation,
}) => {
  const isAnyAnalysisPending = 
    runRiceBlastMutation.isPending || 
    runBacterialBlightMutation.isPending ||
    runStemBorerMutation.isPending ||
    runGallMidgeMutation.isPending ||
    runBrownPlantHopperMutation.isPending ||
    runSheathBlightMutation.isPending ||
    runGrainDiscolorationMutation.isPending;

  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
      <Typography variant="h1"></Typography>
      <Space>
        <Button
          variant="outlined"
          startIcon={<ReloadOutlined />}
          onClick={() => {
            switch (diseaseWarningTab) {
              case 'rice-blast': if (riceBlastWarning) runRiceBlastMutation.mutate(); break;
              case 'bacterial-blight': if (bacterialBlightWarning) runBacterialBlightMutation.mutate(); break;
              case 'stem-borer': if (stemBorerWarning) runStemBorerMutation.mutate(); break;
              case 'gall-midge': if (gallMidgeWarning) runGallMidgeMutation.mutate(); break;
              case 'brown-plant-hopper': if (brownPlantHopperWarning) runBrownPlantHopperMutation.mutate(); break;
              case 'sheath-blight': if (sheathBlightWarning) runSheathBlightMutation.mutate(); break;
              case 'grain-discoloration': if (grainDiscolorationWarning) runGrainDiscolorationMutation.mutate(); break;
            }
            updateLocationMutation.mutate(diseaseLocation);
          }}
          disabled={isAnyAnalysisPending}
        >
          Làm mới
        </Button>
        <Button
          variant="contained"
          startIcon={<ThunderboltOutlined />}
          onClick={() => {
            runRiceBlastMutation.mutate();
            runBacterialBlightMutation.mutate();
            runStemBorerMutation.mutate();
            runGallMidgeMutation.mutate();
            runBrownPlantHopperMutation.mutate();
            runSheathBlightMutation.mutate();
            runGrainDiscolorationMutation.mutate();
          }}
          disabled={!diseaseLocation || isAnyAnalysisPending}
        >
          Phân tích tất cả
        </Button>
      </Space>
    </Box>
  );
});

DiseaseHeaderActions.displayName = 'DiseaseHeaderActions';
