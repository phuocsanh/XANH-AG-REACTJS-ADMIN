// Component hiển thị thông tin khách hàng trong form tạo hóa đơn
import React from 'react';
import { Box, Card, CardContent, Typography, Alert, CircularProgress } from '@mui/material';
import { Control } from 'react-hook-form';
import { FormComboBox, FormField } from '@/components/form';
import { Customer } from '@/models/customer';
import { SalesInvoiceFormData } from '../../form-config';

interface CustomerInfoSectionProps {
  control: Control<SalesInvoiceFormData>;
  customers: Customer[] | undefined;
  customerSearch: string;
  setCustomerSearch: (value: string) => void;
  handleCustomerSelect: (customer: Customer | null) => void;
  selectedCustomer: Customer | null;
  isGuestCustomer: boolean;
  customerSeasonStats?: {
    totalPurchase: number;
    totalDebt: number;
  };
  formatCurrency: (value: number) => string;
}

export const CustomerInfoSection = React.memo<CustomerInfoSectionProps>(({
  control,
  customers,
  customerSearch,
  setCustomerSearch,
  handleCustomerSelect,
  selectedCustomer,
  isGuestCustomer,
  customerSeasonStats,
  formatCurrency,
}) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" mb={2}>
          Thông tin khách hàng
        </Typography>

        <FormComboBox
          name="customer_id"
          control={control}
          label="Tìm khách hàng (tên hoặc SĐT)"
          placeholder="Nhập tên hoặc số điện thoại... (Để trống nếu là khách vãng lai)"
          data={customers?.map((c: Customer) => ({
            value: c.id,
            label: `${c.name} - ${c.phone}`
          })) || []}
          onSearch={setCustomerSearch}
          onSelectionChange={(value) => {
            const customer = customers?.find((c: Customer) => c.id === value);
            handleCustomerSelect(customer || null);
          }}
          filterOption={false}
          allowClear
          showSearch
        />

        {isGuestCustomer && (
          <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
            Khách vãng lai - Vui lòng nhập thông tin bên dưới
          </Alert>
        )}

        <FormField
          name="customer_name"
          control={control}
          label={isGuestCustomer ? 'Tên khách hàng *' : 'Tên khách hàng'}
          placeholder="Nhập tên khách hàng"
          disabled={!isGuestCustomer}
          required={isGuestCustomer}
        />

        <FormField
          name="customer_phone"
          control={control}
          label={isGuestCustomer ? 'Số điện thoại *' : 'Số điện thoại'}
          placeholder="Nhập số điện thoại"
          disabled={!isGuestCustomer}
          required={isGuestCustomer}
        />

        <FormField
          name="customer_address"
          control={control}
          label="Địa chỉ"
          placeholder="Nhập địa chỉ"
          disabled={!isGuestCustomer}
        />

        {/* Hiển thị thống kê khách hàng trong mùa vụ */}
        {selectedCustomer && customerSeasonStats && (
          <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" mb={1} fontWeight="bold">
              📊 Thống kê mùa vụ này
            </Typography>
            <Box display="flex" flexDirection="column" gap={0.5}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Tổng tiền mua hàng:
                </Typography>
                <Typography variant="body2" fontWeight="bold" color="success.main">
                  {formatCurrency(customerSeasonStats.totalPurchase || 0)}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Tổng nợ:
                </Typography>
                <Typography variant="body2" fontWeight="bold" color="error.main">
                  {formatCurrency(customerSeasonStats.totalDebt || 0)}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
});

CustomerInfoSection.displayName = 'CustomerInfoSection';
