import React from 'react';
import { Box } from '@mui/material';
import { LocationForm } from '@/components/disease-warning';
import { DiseaseHeaderActions } from './DiseaseHeaderActions';
import { DiseaseTabsContent } from './DiseaseTabsContent';

interface DiseaseWarningTabProps {
  diseaseWarningTab: string;
  setDiseaseWarningTab: (key: string) => void;
  diseaseLocation: any;
  updateLocationMutation: any;
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

export const DiseaseWarningTab = React.memo<DiseaseWarningTabProps>(({
  diseaseWarningTab,
  setDiseaseWarningTab,
  diseaseLocation,
  updateLocationMutation,
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
    <Box sx={{ px: 2, mt: -5 }}>
      <DiseaseHeaderActions 
        diseaseWarningTab={diseaseWarningTab}
        riceBlastWarning={riceBlastWarning}
        bacterialBlightWarning={bacterialBlightWarning}
        stemBorerWarning={stemBorerWarning}
        gallMidgeWarning={gallMidgeWarning}
        brownPlantHopperWarning={brownPlantHopperWarning}
        sheathBlightWarning={sheathBlightWarning}
        grainDiscolorationWarning={grainDiscolorationWarning}
        runRiceBlastMutation={runRiceBlastMutation}
        runBacterialBlightMutation={runBacterialBlightMutation}
        runStemBorerMutation={runStemBorerMutation}
        runGallMidgeMutation={runGallMidgeMutation}
        runBrownPlantHopperMutation={runBrownPlantHopperMutation}
        runSheathBlightMutation={runSheathBlightMutation}
        runGrainDiscolorationMutation={runGrainDiscolorationMutation}
        updateLocationMutation={updateLocationMutation}
        diseaseLocation={diseaseLocation}
      />

      <Box sx={{ mb: 3 }}>
        <LocationForm
          location={diseaseLocation}
          onSubmit={(values: any) => {
            updateLocationMutation.mutate(values, {
              onSuccess: () => {
                setTimeout(() => {
                  runRiceBlastMutation.mutate();
                  runBacterialBlightMutation.mutate();
                  runStemBorerMutation.mutate();
                  runGallMidgeMutation.mutate();
                  runBrownPlantHopperMutation.mutate();
                  runSheathBlightMutation.mutate();
                  runGrainDiscolorationMutation.mutate();
                }, 500);
              }
            });
          }}
          loading={updateLocationMutation.isPending}
        />
      </Box>

      <DiseaseTabsContent 
        diseaseWarningTab={diseaseWarningTab}
        setDiseaseWarningTab={setDiseaseWarningTab}
        riceBlastWarning={riceBlastWarning}
        bacterialBlightWarning={bacterialBlightWarning}
        stemBorerWarning={stemBorerWarning}
        gallMidgeWarning={gallMidgeWarning}
        brownPlantHopperWarning={brownPlantHopperWarning}
        sheathBlightWarning={sheathBlightWarning}
        grainDiscolorationWarning={grainDiscolorationWarning}
        runRiceBlastMutation={runRiceBlastMutation}
        runBacterialBlightMutation={runBacterialBlightMutation}
        runStemBorerMutation={runStemBorerMutation}
        runGallMidgeMutation={runGallMidgeMutation}
        runBrownPlantHopperMutation={runBrownPlantHopperMutation}
        runSheathBlightMutation={runSheathBlightMutation}
        runGrainDiscolorationMutation={runGrainDiscolorationMutation}
      />
    </Box>
  );
});

DiseaseWarningTab.displayName = 'DiseaseWarningTab';
