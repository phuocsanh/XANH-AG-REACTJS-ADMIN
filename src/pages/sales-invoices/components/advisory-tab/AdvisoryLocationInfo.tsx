import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { EnvironmentOutlined, AimOutlined } from '@ant-design/icons';
import { Save as SaveIcon } from '@mui/icons-material';
import { Location } from '@/constants/locations';

interface AdvisoryLocationInfoProps {
  selectedLocation: Location;
  detectUserLocation: () => void;
  setIsMapModalVisible: (visible: boolean) => void;
  updateLocationMutation: any;
  antMessage: any;
}

export const AdvisoryLocationInfo = React.memo<AdvisoryLocationInfoProps>(({
  selectedLocation,
  detectUserLocation,
  setIsMapModalVisible,
  updateLocationMutation,
  antMessage,
}) => {
  return (
    <Box sx={{ mb: 2, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
        {/* Location Info */}
        <Box display="flex" alignItems="center" gap={1} flex={1} minWidth={0}>
          <EnvironmentOutlined style={{ fontSize: 18, color: '#1976d2' }} />
          <Typography fontWeight="bold" noWrap sx={{ flex: 1, minWidth: 0 }}>
            {selectedLocation.name}
          </Typography>
        </Box>
        
        {/* Action Buttons - Icon Only */}
        <Box display="flex" gap={0.5}>
          <IconButton 
            size="small" 
            onClick={detectUserLocation} 
            title="Lấy vị trí hiện tại"
            color="default"
          >
            <AimOutlined />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => setIsMapModalVisible(true)}
            title="Chọn vị trí trên bản đồ"
            color="primary"
          >
            <EnvironmentOutlined />
          </IconButton>
          <IconButton 
            size="small"
            onClick={() => {
              updateLocationMutation.mutate({
                name: selectedLocation.name,
                lat: selectedLocation.latitude,
                lon: selectedLocation.longitude
              });
              antMessage.success('Đã lưu vị trí!');
            }}
            disabled={updateLocationMutation.isPending}
            title="Lưu vị trí"
            color="success"
          >
            <SaveIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
});

AdvisoryLocationInfo.displayName = 'AdvisoryLocationInfo';
