// Component hiển thị thông tin hóa đơn (mùa vụ, ruộng lúa, thanh toán, lưu ý, quà tặng)
import React from 'react';
import { Box, Card, CardContent, Typography, Alert, CircularProgress, Button } from '@mui/material';
import { Control, UseFormSetValue } from 'react-hook-form';
import { FormComboBox, FormField, FormFieldNumber, FormDatePicker } from '@/components/form';
import { Season } from '@/models/season';
import { RiceCrop } from '@/models/rice-farming';
import { SalesInvoiceFormData, paymentMethodLabels } from '../../form-config';
import { SyncOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import { SalesInvoice } from '@/models/sales-invoice';

interface InvoiceInfoSectionProps {
  control: Control<SalesInvoiceFormData>;
  setValue: UseFormSetValue<SalesInvoiceFormData>;
  selectedCustomer: any;
  seasons: { data?: { items?: Season[] } } | undefined;
  customerRiceCrops: { data?: RiceCrop[] } | undefined;
  isLoadingRiceCrops: boolean;
  latestInvoice: SalesInvoice | null;
  conflictWarning: string | null;
  isCheckingConflict: boolean;
  isGeneratingWarning: boolean;
  handleGenerateWarning: (silent: boolean) => void;
  items: any[];
}

export const InvoiceInfoSection = React.memo<InvoiceInfoSectionProps>(({
  control,
  setValue,
  selectedCustomer,
  seasons,
  customerRiceCrops,
  isLoadingRiceCrops,
  latestInvoice,
  conflictWarning,
  isCheckingConflict,
  isGeneratingWarning,
  handleGenerateWarning,
  items,
}) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" mb={2}>
          Thông tin hóa đơn
        </Typography>

        <FormComboBox
          name="season_id"
          control={control}
          label="Mùa vụ"
          placeholder="Chọn mùa vụ"
          required
          options={seasons?.data?.items?.map((season: Season) => ({
            value: season.id,
            label: `${season.name} (${season.year})`
          })) || []}
          allowClear
          showSearch
        />

        {/* Chọn Ruộng lúa - BẮT BUỘC khi đã chọn khách hàng */}
        {selectedCustomer && (
          <Box sx={{ mt: 2 }}>
            {isLoadingRiceCrops ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: 56 }}>
                <CircularProgress size={24} />
                <Typography variant="body2" color="text.secondary">
                  Đang tải Danh sách ruộng lúa...
                </Typography>
              </Box>
            ) : customerRiceCrops?.data && customerRiceCrops.data.length > 0 ? (
              <FormComboBox
                name="rice_crop_id"
                control={control}
                label="Ruộng lúa"
                placeholder="Chọn ruộng lúa"
                required
                options={customerRiceCrops.data.map((crop: RiceCrop) => ({
                  value: crop.id,
                  label: `${crop.field_name} - ${crop.rice_variety} (${new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(crop.field_area))} m²)`
                }))}
                onSelectionChange={() => {
                  // Không cần set state rời rạc, react-hook-form đã quản lý rice_crop_id
                }}
                allowClear
                showSearch
              />
            ) : (
              <Alert severity="warning">
                Khách hàng này chưa có Ruộng lúa nào trong mùa vụ này.
              </Alert>
            )}
          </Box>
        )}

        <FormDatePicker
          name="sale_date"
          control={control}
          label="Ngày bán (mặc định hôm nay)"
          placeholder="Chọn ngày bán"
          format="DD/MM/YYYY"
        />

        <FormComboBox
          name="payment_method"
          control={control}
          label="Phương thức thanh toán"
          placeholder="Chọn phương thức thanh toán"
          required
          options={Object.entries(paymentMethodLabels).map(([value, label]) => ({
            value,
            label
          }))}
          allowClear={false}
          showSearch={false}
        />

        <Box sx={{ mb: 2 }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Typography variant="body2" color="text.secondary">
              Lưu ý quan trọng
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleGenerateWarning(false)}
              disabled={isGeneratingWarning || items.length === 0}
              startIcon={
                isGeneratingWarning ? (
                  <Spin size="small" />
                ) : (
                  <SyncOutlined />
                )
              }
              sx={{ ml: 'auto' }}
            >
              {isGeneratingWarning ? 'Đang tạo...' : 'Tạo bằng AI'}
            </Button>
          </Box>
          <FormField
            name="warning"
            control={control}
            label=""
            placeholder="AI sẽ tự động tạo lưu ý dựa trên mô tả sản phẩm, hoặc bạn có thể nhập thủ công"
            type="textarea"
            rows={2}
          />
        </Box>

        {latestInvoice?.warning && (
          <Alert 
            severity="info" 
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={() => setValue('warning', latestInvoice.warning)}>
                Sử dụng
              </Button>
            }
          >
            <Typography variant="caption" display="block" fontWeight="bold">
              Lưu ý từ đơn hàng trước ({new Date(latestInvoice.sale_date || latestInvoice.created_at).toLocaleDateString('vi-VN')}):
            </Typography>
            <Typography variant="body2">
              {latestInvoice.warning}
            </Typography>
          </Alert>
        )}

        {conflictWarning && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            icon={isCheckingConflict ? <Spin size="small" /> : undefined}
          >
            <Typography variant="caption" display="block" fontWeight="bold">
              ⚠️ Cảnh báo xung đột:
            </Typography>
            <Typography variant="body2">
              {conflictWarning}
            </Typography>
          </Alert>
        )}

        <FormField
          name="notes"
          control={control}
          label="Ghi chú"
          type="textarea"
          rows={3}
          placeholder="Nhập ghi chú hóa đơn..."
          className="mb-4"
        />

      </CardContent>
    </Card>
  );
});

InvoiceInfoSection.displayName = 'InvoiceInfoSection';
