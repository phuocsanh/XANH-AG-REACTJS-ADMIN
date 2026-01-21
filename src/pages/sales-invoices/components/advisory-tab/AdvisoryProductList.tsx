import React from 'react';
import { Box, Typography, Button, List, ListItem, Checkbox, Alert } from '@mui/material';
import { PrinterOutlined } from '@ant-design/icons';
import { Spin, Space, Tag } from 'antd';

interface AdvisoryProductListProps {
  items: any[];
  invoiceProducts: any[];
  selectedProductIdsForAdvisory: number[];
  handleProductToggleForAdvisory: (id: number) => void;
  handleAnalyze: () => void;
  handlePrint: () => void;
  isAnalyzing: boolean;
  mixResult: string;
  sortResult: string;
  sprayingRecommendations: any[];
}

export const AdvisoryProductList = React.memo<AdvisoryProductListProps>(({
  items,
  invoiceProducts,
  selectedProductIdsForAdvisory,
  handleProductToggleForAdvisory,
  handleAnalyze,
  handlePrint,
  isAnalyzing,
  mixResult,
  sortResult,
  sprayingRecommendations,
}) => {
  if (items.length === 0) {
    return (
      <Alert severity="info">
        Vui lòng thêm sản phẩm vào hóa đơn để sử dụng tính năng Phân tích Phối trộn & Sắp xếp thuốc.
        <br />
        Các tính năng Thời tiết bên dưới vẫn hoạt động bình thường.
      </Alert>
    );
  }

  return (
    <>
      <Typography variant="subtitle2" mb={1}>
        Sản phẩm trong hóa đơn (chọn để phân tích phối trộn):
      </Typography>
      <List>
        {invoiceProducts.map((product) => (
          <ListItem key={product.id} dense>
            <Checkbox
              checked={selectedProductIdsForAdvisory.includes(product.id)}
              onChange={() => handleProductToggleForAdvisory(product.id)}
            />
            <Box ml={2}>
              <Typography fontWeight="bold">
                {product.trade_name || product.name}
                {product.unit_name && (
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    ({product.unit_name})
                  </Typography>
                )}
              </Typography>
              <Box>
                {product.ingredient?.map((ing: string, index: number) => (
                  <Tag key={index} color="blue">{ing}</Tag>
                ))}
              </Box>
            </Box>
          </ListItem>
        ))}
      </List>

      <Box mt={2}>
        <Space>
          <Button
            variant="contained"
            onClick={handleAnalyze}
            disabled={isAnalyzing || selectedProductIdsForAdvisory.length < 2}
          >
            {isAnalyzing ? <Spin size="small" /> : 'Phân tích Phối trộn & Sắp xếp'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrinterOutlined />}
            onClick={handlePrint}
            disabled={!mixResult && !sortResult && sprayingRecommendations.length === 0}
          >
            In kết quả
          </Button>
        </Space>
      </Box>
    </>
  );
});

AdvisoryProductList.displayName = 'AdvisoryProductList';
