// Component hiển thị các nút hành động của hóa đơn
import React from 'react';
import { Box, Button, IconButton } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { ThunderboltOutlined } from '@ant-design/icons';
import { Popover } from 'antd';

interface InvoiceActionsProps {
  onCancel: () => void;
  onSaveDraft: () => void;
  onSaveConfirm: () => void;
  isPending: boolean;
  calculatedProfit: {
    revenue: number;
    cost: number;
    profit: number;
    margin: number;
  };
}

export const InvoiceActions = React.memo<InvoiceActionsProps>(({
  onCancel,
  onSaveDraft,
  onSaveConfirm,
  isPending,
  calculatedProfit,
}) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', position: 'relative' }}>
      {/* Nút hiển thị lợi nhuận - Hover để xem */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          bottom: 0,
        }}
      >
        <Popover
          content={
            <div style={{ minWidth: 200 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                Dự kiến:
              </div>
              <div 
                style={{ 
                  fontSize: 20, 
                  fontWeight: 'bold',
                  color: calculatedProfit.profit >= 0 ? '#52c41a' : '#ff4d4f',
                  marginBottom: 4,
                }}
              >
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(calculatedProfit.profit)}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>
                Tỷ suất: {calculatedProfit.margin.toFixed(2)}%
              </div>
            </div>
          }
          trigger="hover"
          placement="topLeft"
        >
          <IconButton
            size="small"
            sx={{
              bgcolor: calculatedProfit.profit >= 0 ? 'success.light' : 'error.light',
              '&:hover': {
                bgcolor: calculatedProfit.profit >= 0 ? 'success.main' : 'error.main',
              },
              width: 32,
              height: 32,
              cursor: 'pointer',
            }}
          >
            <ThunderboltOutlined style={{ fontSize: 16, color: '#fff' }} />
          </IconButton>
        </Popover>
      </Box>

      <Button
        variant="outlined"
        onClick={onCancel}
        disabled={isPending}
      >
        Hủy
      </Button>
      <Button
        variant="outlined"
        onClick={onSaveDraft}
        disabled={isPending}
        startIcon={<SaveIcon sx={{ color: 'text.secondary' }} />}
      >
        Lưu nháp
      </Button>
      <Button
        variant="contained"
        color="primary"
        startIcon={<SaveIcon />}
        onClick={onSaveConfirm}
        disabled={isPending}
      >
        {isPending ? 'Đang tạo...' : 'Lưu & Xác nhận'}
      </Button>
    </Box>
  );
});

InvoiceActions.displayName = 'InvoiceActions';
