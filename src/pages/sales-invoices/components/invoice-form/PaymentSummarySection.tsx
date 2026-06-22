// Component hiển thị tổng kết thanh toán
import React from 'react';
import { Box, Card, CardContent, Typography, Grid } from '@mui/material';
import { Control, Controller, UseFormSetValue, useWatch } from 'react-hook-form';
import { FormFieldNumber, FormField, FormComboBox } from '@/components/form';
import { SalesInvoiceFormData } from '../../form-config';
import { useRewardPreviewBySeasonQuery } from '@/queries/debt-note';
import { Divider, Space, Select, Form } from 'antd';
import { GiftOutlined } from '@ant-design/icons';
import { useProductSearch } from '@/queries/product';
import type { Product } from '@/models/product.model';

interface PaymentSummarySectionProps {
  control: Control<SalesInvoiceFormData>;
  setValue: UseFormSetValue<SalesInvoiceFormData>;
  totalAmount: number;
  finalAmount: number;
  partialPaymentAmount: number;
  formatCurrency: (value: number) => string;
  customerId?: number;
  seasonId?: number;
}

export const PaymentSummarySection = React.memo<PaymentSummarySectionProps>(({
  control,
  setValue,
  totalAmount,
  finalAmount,
  partialPaymentAmount,
  formatCurrency,
  customerId,
  seasonId,
}) => {
  const remainingAmount = finalAmount - partialPaymentAmount;
  const [giftProductSearch, setGiftProductSearch] = React.useState('');
  const watchedGiftProductId = useWatch({ control, name: 'gift_product_id' });
  const watchedGiftQuantity = useWatch({ control, name: 'gift_quantity' });
  const watchedGiftUnitPrice = useWatch({ control, name: 'gift_unit_price' });
  const { data: productsSearchData, isLoading: isProductsLoading } = useProductSearch(
    giftProductSearch,
    20,
    true
  );
  const productOptions = React.useMemo(
    () => productsSearchData?.pages.flatMap((page) => page.data) || [],
    [productsSearchData]
  );
  const selectedGiftProduct = React.useMemo(
    () => productOptions.find((p: Product) => Number(p.id) === Number(watchedGiftProductId)),
    [productOptions, watchedGiftProductId]
  );

  React.useEffect(() => {
    if (!watchedGiftProductId) return;
    setValue(
      'gift_value',
      Math.round(Number(watchedGiftQuantity || 0) * Number(watchedGiftUnitPrice || 0)),
      { shouldValidate: true, shouldDirty: true },
    );
  }, [watchedGiftProductId, watchedGiftQuantity, watchedGiftUnitPrice, setValue]);

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

        {/* --- PHẦN QUÀ TẶNG --- */}
        <Box mt={3}>
          <Divider orientation="left" style={{ margin: '0 0 12px' }}>
            <Space>
              <GiftOutlined style={{ color: '#faad14' }} />
              <span style={{ fontWeight: 500 }}>Quà tặng tri ân (Không trừ tích lũy)</span>
            </Space>
          </Divider>

          {/* Đã xóa phần xem trước tích lũy theo yêu cầu */}


          {/* Các trường nhập quà tặng luôn hiển thị */}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Form.Item label="Sản phẩm quà từ kho" layout="vertical">
                <Controller
                  name="gift_product_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      showSearch
                      allowClear
                      placeholder="Tìm và chọn sản phẩm trong cửa hàng..."
                      loading={isProductsLoading}
                      filterOption={false}
                      onSearch={setGiftProductSearch}
                      onClear={() => {
                        field.onChange(undefined);
                        setValue('gift_quantity', 1, { shouldDirty: true });
                        setValue('gift_unit_price', 0, { shouldDirty: true });
                      }}
                      onChange={(value) => {
                        field.onChange(value);
                        const product = productOptions.find((p: any) => Number(p.id) === Number(value));
                        if (!product) return;

                        const defaultPrice = Number(
                          product.latest_purchase_price ||
                          product.average_cost_price ||
                          product.price ||
                          0
                        );
                        setValue('gift_description', product.trade_name || product.name || `Sản phẩm #${product.id}`, { shouldDirty: true });
                        setValue('gift_quantity', 1, { shouldDirty: true });
                        setValue('gift_unit_price', defaultPrice, { shouldDirty: true });
                      }}
                      options={productOptions.map((product: any) => ({
                        value: product.id,
                        label: `${product.label || product.trade_name || product.name} - tồn ${Number(product.quantity || 0)} ${product.unit?.name || product.unit_name || ''}`,
                      }))}
                    />
                  )}
                />
                {watchedGiftProductId && (
                  <Typography variant="caption" color="text.secondary">
                    Tồn kho hiện tại: {Number(selectedGiftProduct?.quantity || 0)} {selectedGiftProduct?.unit?.name || selectedGiftProduct?.unit_name || ''}
                  </Typography>
                )}
              </Form.Item>
            </Grid>
            {watchedGiftProductId && (
              <>
                <Grid item xs={12} sm={6}>
                  <FormFieldNumber
                    name="gift_quantity"
                    control={control}
                    label="Số lượng sản phẩm quà"
                    placeholder="1"
                    decimalScale={4}
                    min={0.0001}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormFieldNumber
                    name="gift_unit_price"
                    control={control}
                    label="Đơn giá hạch toán (VND)"
                    placeholder="0"
                    decimalScale={0}
                    min={0}
                  />
                </Grid>
              </>
            )}
            <Grid item xs={12} sm={6}>
              <FormField
                name="gift_description"
                control={control}
                label="Mô tả quà tri ân"
                placeholder="Ví dụ: Bộ ấm trà, Phiếu quà tặng..."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormFieldNumber
                name="gift_value"
                control={control}
                label="Giá trị quà (VND)"
                placeholder="0"
                disabled={!!watchedGiftProductId}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormComboBox
                name="gift_status"
                control={control}
                label="Trạng thái quà"
                placeholder="Chọn trạng thái"
                options={[
                  { label: 'Đã trao ngay', value: 'delivered' },
                  { label: 'Chờ trao sau', value: 'pending' },
                ]}
              />
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
});

PaymentSummarySection.displayName = 'PaymentSummarySection';
