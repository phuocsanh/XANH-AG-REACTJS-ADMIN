// Component hiển thị tổng kết thanh toán
import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { Control } from 'react-hook-form';
import { FormFieldNumber } from '@/components/form';
import { SalesInvoiceFormData } from '../../form-config';

interface PaymentSummarySectionProps {
  control: Control<SalesInvoiceFormData>;
  totalAmount: number;
  finalAmount: number;
  partialPaymentAmount: number;
  formatCurrency: (value: number) => string;
}

export const PaymentSummarySection = React.memo<PaymentSummarySectionProps>(({
  control,
  totalAmount,
  finalAmount,
  partialPaymentAmount,
  formatCurrency,
}) => {
  const remainingAmount = finalAmount - partialPaymentAmount;

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
      </CardContent>
    </Card>
  );
});

PaymentSummarySection.displayName = 'PaymentSummarySection';
