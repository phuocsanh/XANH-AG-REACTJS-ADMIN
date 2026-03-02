// Component hiển thị tổng kết thanh toán
import React from 'react';
import { Box, Card, CardContent, Typography, Grid } from '@mui/material';
import { Control } from 'react-hook-form';
import { FormFieldNumber, FormField } from '@/components/form';
import { SalesInvoiceFormData } from '../../form-config';
import { useRewardPreviewBySeasonQuery } from '@/queries/debt-note';
import { Divider, Tag, Space, Spin, Alert } from 'antd';
import { GiftOutlined } from '@ant-design/icons';

interface PaymentSummarySectionProps {
  control: Control<SalesInvoiceFormData>;
  totalAmount: number;
  finalAmount: number;
  partialPaymentAmount: number;
  formatCurrency: (value: number) => string;
  customerId?: number;
  seasonId?: number;
}

export const PaymentSummarySection = React.memo<PaymentSummarySectionProps>(({
  control,
  totalAmount,
  finalAmount,
  partialPaymentAmount,
  formatCurrency,
  customerId,
  seasonId,
}) => {
  const remainingAmount = finalAmount - partialPaymentAmount;

  // Query xem trước phần thưởng
  const { data: rewardPreview, isLoading: isLoadingReward } = useRewardPreviewBySeasonQuery(
    customerId || 0,
    seasonId || 0,
    finalAmount // Doanh số cộng thêm chính là tổng tiền hóa đơn này
  );

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" mb={1}>
          Thanh toán
        </Typography>

        {/* Layout for MOBILE - Single column with correct order */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography>Tổng tiền hàng:</Typography>
            <Typography fontWeight="bold">{formatCurrency(totalAmount)}</Typography>
          </Box>

          <FormFieldNumber
            name="discount_amount"
            control={control}
            label="Giảm giá tổng đơn"
            min={0}
            size="large"
            placeholder="0"
            className="mb-4"
          />

          <FormFieldNumber
            name="partial_payment_amount"
            control={control}
            label="Khách trả trước"
            min={0}
            size="large"
            placeholder="0"
            className="mb-4"
          />

          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography fontWeight="bold">Tổng cộng:</Typography>
            <Typography fontWeight="bold" color="primary.main">
              {formatCurrency(finalAmount)}
            </Typography>
          </Box>

          <Box display="flex" justifyContent="space-between">
            <Typography fontWeight="bold">Còn lại:</Typography>
            <Typography 
              fontWeight="bold" 
              color={remainingAmount > 0 ? 'error.main' : 'success.main'}
            >
              {formatCurrency(remainingAmount)}
            </Typography>
          </Box>
        </Box>

        {/* Layout for DESKTOP - Two columns */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Box display="flex" gap={2}>
            {/* Left Column */}
            <Box flex={1}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Tổng tiền hàng:</Typography>
                <Typography fontWeight="bold">{formatCurrency(totalAmount)}</Typography>
              </Box>

              <FormFieldNumber
                name="discount_amount"
                control={control}
                label="Giảm giá tổng đơn"
                min={0}
                size="large"
                placeholder="0"
                className="mb-4"
              />

              <Box display="flex" justifyContent="space-between">
                <Typography fontWeight="bold">Tổng cộng:</Typography>
                <Typography fontWeight="bold" color="primary.main">
                  {formatCurrency(finalAmount)}
                </Typography>
              </Box>
            </Box>

            {/* Right Column */}
            <Box flex={1}>
              {/* Căn rỗng để khớp với "Tổng tiền hàng" bên trái */}
              <Box mb={1} sx={{ display: { xs: 'none', md: 'block' } }}>
                <Typography>&nbsp;</Typography>
              </Box>
              
              <FormFieldNumber
                name="partial_payment_amount"
                control={control}
                label="Khách trả trước"
                min={0}
                size="large"
                placeholder="0"
                className="mb-4"
              />

              <Box display="flex" justifyContent="space-between">
                <Typography fontWeight="bold">Còn lại:</Typography>
                <Typography 
                  fontWeight="bold" 
                  color={remainingAmount > 0 ? 'error.main' : 'success.main'}
                >
                  {formatCurrency(remainingAmount)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* --- PHẦN THƯỞNG TÍCH LŨY --- */}
        {customerId && seasonId && (
          <Box mt={3}>
            <Divider orientation="left" style={{ margin: '0 0 12px' }}>
              <Space>
                <GiftOutlined style={{ color: '#faad14' }} />
                <span style={{ fontWeight: 500 }}>Tích lũy & Quà tặng</span>
              </Space>
            </Divider>

            {isLoadingReward ? (
              <Box py={2} textAlign="center">
                <Spin size="small" tip="Đang tính toán tích lũy..." />
              </Box>
            ) : rewardPreview?.summary ? (
              <Box 
                sx={{ 
                  bgcolor: 'orange.50', 
                  p: 2, 
                  borderRadius: 1, 
                  border: '1px solid',
                  borderColor: 'orange.100'
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Typography variant="body2" color="text.secondary">
                    Tổng tích lũy (bao gồm đơn này):
                  </Typography>
                  <Typography variant="subtitle2" color="primary.main" fontWeight="bold">
                    {formatCurrency(rewardPreview.summary.total_after_close || 0)}
                  </Typography>
                </Box>

                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        Trạng thái thưởng:
                      </Typography>
                      <Tag color={rewardPreview.summary.will_receive_reward ? "gold" : "default"} style={{ margin: 0 }}>
                        {rewardPreview.summary.will_receive_reward 
                          ? `Đủ điều kiện tặng ${rewardPreview.summary.reward_count} quà` 
                          : "Chưa đạt mốc nhận quà"}
                      </Tag>
                    </Box>

                    {!rewardPreview.summary.will_receive_reward && (
                      <Box display="flex" justifyContent="flex-end" mb={2}>
                        <Typography variant="caption" color="warning.main" sx={{ fontStyle: 'italic' }}>
                          Còn thiếu {formatCurrency(rewardPreview.summary.shortage_to_next)} để nhận quà
                        </Typography>
                      </Box>
                    )}

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormField
                          name="gift_description"
                          control={control}
                          label="Mô tả quà tặng"
                          placeholder="Phiếu quà tặng, hiện vật..."
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormFieldNumber
                          name="gift_value"
                          control={control}
                          label="Giá trị quà (VND)"
                          placeholder="0"
                        />
                      </Grid>
                    </Grid>
                  </Box>
              </Box>
            ) : null}
          </Box>
        )}
      </CardContent>
    </Card>
  );
});

PaymentSummarySection.displayName = 'PaymentSummarySection';
