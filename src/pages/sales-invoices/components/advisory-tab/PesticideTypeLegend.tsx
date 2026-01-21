import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

const PESTICIDE_TYPES = [
  { group: 'Mát nhất', icon: '🟢', color: '#52c41a', bgColor: '#f6ffed', borderColor: '#b7eb8f', codes: ['SL', 'AL', 'SP', 'SG'] },
  { group: 'Mát vừa', icon: '🟡', color: '#faad14', bgColor: '#fffbe6', borderColor: '#ffe58f', codes: ['SC', 'WG', 'WP', 'DC'] },
  { group: 'Trung bình', icon: '🟠', color: '#fa8c16', bgColor: '#fff7e6', borderColor: '#ffd591', codes: ['CS', 'SE', 'ME', 'EW'] },
  { group: 'Gây nóng', icon: '🔴', color: '#ff4d4f', bgColor: '#fff1f0', borderColor: '#ffa39e', codes: ['EC', 'OD', 'DP', 'DS'] },
];

export const PesticideTypeLegend = React.memo(() => {
  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h6" mb={2}>
          📋 Danh sách Mã Dạng Thuốc BVTV (Từ Mát → Gây Nóng)
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Danh sách dưới đây sắp xếp các mã dạng thuốc từ an toàn nhất (mát) đến cần thận trọng nhất (gây nóng).
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 1.5,
          p: 2,
          bgcolor: '#f5f5f5',
          borderRadius: 1
        }}>
          {PESTICIDE_TYPES.map((group, gIdx) => (
            <React.Fragment key={gIdx}>
              {group.codes.map((code, cIdx) => (
                <Box key={`${gIdx}-${cIdx}`} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <span style={{ fontSize: '1.2rem' }}>{group.icon}</span>
                  <code style={{ 
                    backgroundColor: group.bgColor, 
                    border: `1px solid ${group.borderColor}`,
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    fontWeight: 600,
                    color: group.color
                  }}>{code}</code>
                </Box>
              ))}
            </React.Fragment>
          ))}
        </Box>

        <Box sx={{ mt: 2, p: 2, bgcolor: '#e6f7ff', borderRadius: 1 }}>
          <Typography variant="body2" color="primary.main">
            💡 <strong>Lưu ý:</strong> Dạng thuốc "mát" (🟢 SL, AL, SP, SG) an toàn khi phun trưa nắng. Dạng "gây nóng" (🔴 EC, OD, DP, DS) chỉ nên phun sáng sớm hoặc chiều mát để tránh phỏng lá.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
});

PesticideTypeLegend.displayName = 'PesticideTypeLegend';
