import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { FormField, FormComboBox } from '@/components/form';
import NumberInput from '@/components/common/number-input';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateSalesReturnMutation } from '@/queries/sales-return';
import { useSalesInvoicesQuery, useSalesInvoiceQuery } from '@/queries/sales-invoice';
import { SalesInvoice } from '@/models/sales-invoice';
import {
  salesReturnSchema,
  SalesReturnFormData,
  defaultSalesReturnValues,
  refundMethodLabels,
} from './form-config';

const CreateSalesReturn = () => {
  const navigate = useNavigate();
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SalesReturnFormData>({
    resolver: zodResolver(salesReturnSchema),
    defaultValues: defaultSalesReturnValues,
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'items',
  });

  // Search invoices
  const { data: invoicesData } = useSalesInvoicesQuery({
    page: 1,
    limit: 20,
    search: invoiceSearch,
    status: ['confirmed', 'paid'], // Cho phép trả hàng với đơn đã xác nhận hoặc đã thanh toán
  });

  // Get selected invoice ID
  const selectedInvoiceId = watch('invoice_id');

  // Load Invoice Details (to get items)
  const { data: invoiceDetail } = useSalesInvoiceQuery(selectedInvoiceId || 0);

  // Update selectedInvoice state and auto-select refund method
  useEffect(() => {
    if (invoiceDetail) {
      setSelectedInvoice(invoiceDetail);
      
      // Auto-select refund method based on debt
      const remainingResult = parseFloat(invoiceDetail.remaining_amount?.toString() || '0');
      if (remainingResult > 0) {
        setValue('refund_method', 'debt_credit'); // Trừ công nợ
      } else {
        setValue('refund_method', 'cash'); // Hoàn tiền mặt
      }
    } else {
        // Only reset if we don't have an ID (cleared)
        if (!selectedInvoiceId) {
            setSelectedInvoice(null);
        }
    }
  }, [invoiceDetail, setValue, selectedInvoiceId]);

  const createMutation = useCreateSalesReturnMutation();

  const handleInvoiceSelect = (id: number | undefined) => {
    if (id) {
      setValue('invoice_id', id);
      // Reset selected items when invoice changes
      replace([]);
    } else {
      setValue('invoice_id', undefined as any);
      replace([]);
      setSelectedInvoice(null);
    }
  };

  const handleAddItem = (item: any) => {
    // Check if item already exists
    const exists = fields.some((field) => field.product_id === item.product_id);
    if (exists) return;

    // Lấy tên sản phẩm từ relation product hoặc fallback về product_name
    const productName = item.product?.name || item.product_name || 'Sản phẩm không xác định';

    append({
      product_id: item.product_id,
      product_name: productName,
      quantity: 1,
      unit_price: item.unit_price,
      reason: '',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const onSubmit = (data: SalesReturnFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        navigate('/sales-returns');
      },
    });
  };

  // Get invoice list from pagination response
  const invoiceList = invoicesData?.data?.items || (Array.isArray(invoicesData?.data) ? invoicesData.data : []) || [];

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/sales-returns')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight="bold">
          Tạo phiếu trả hàng
        </Typography>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          {/* Invoice Selection */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  Thông tin hóa đơn
                </Typography>

                <FormComboBox
                  name="invoice_id"
                  control={control}
                  label="Tìm hóa đơn"
                  placeholder="Nhập mã hóa đơn hoặc tên khách hàng..."
                  data={invoiceList.map((invoice: SalesInvoice) => ({
                    value: invoice.id,
                    label: `${invoice.code} - ${invoice.customer_name}`
                  }))}
                  onSearch={setInvoiceSearch}
                  onSelectionChange={(value) => {
                    handleInvoiceSelect(Number(value));
                  }}
                  allowClear
                  showSearch
                />

                {selectedInvoice && (
                  <Box mt={2} p={2} sx={{ bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Khách hàng:</strong> {selectedInvoice.customer_name} - {selectedInvoice.customer_phone}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Ngày mua:</strong> {new Date(selectedInvoice.created_at).toLocaleDateString('vi-VN')}
                      {' • '}
                      <strong>Tổng tiền:</strong>{' '}
                      <Box component="span" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                        {formatCurrency(selectedInvoice.final_amount)}
                      </Box>
                      {' • '}
                      <strong>Thanh toán:</strong>{' '}
                      <Box 
                        component="span" 
                        sx={{ 
                          color: selectedInvoice.payment_method === 'debt' ? 'warning.main' : 'primary.main',
                          fontWeight: 'bold' 
                        }}
                      >
                        {selectedInvoice.payment_method === 'cash' && 'Tiền mặt'}
                        {selectedInvoice.payment_method === 'debt' && 'Công nợ'}
                        {selectedInvoice.payment_method === 'transfer' && 'Chuyển khoản'}
                      </Box>
                    </Typography>
                    {(selectedInvoice.season || selectedInvoice.rice_crop) && (
                      <Typography variant="body2" color="text.secondary">
                        {selectedInvoice.season && (
                          <>
                            <strong>Mùa vụ:</strong> {selectedInvoice.season.name || selectedInvoice.season_name}
                          </>
                        )}
                        {selectedInvoice.season && selectedInvoice.rice_crop && ' • '}
                        {selectedInvoice.rice_crop && (
                          <>
                            <strong>Ruộng lúa:</strong> {selectedInvoice.rice_crop.field_name}
                          </>
                        )}
                      </Typography>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Return Info */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  Thông tin trả hàng
                </Typography>

                <FormField
                  name="refund_method"
                  control={control}
                  label="Phương thức hoàn tiền"
                  type="select"
                  options={Object.entries(refundMethodLabels).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                  className="mb-4"
                />

                <FormField
                  name="reason"
                  control={control}
                  label="Lý do trả hàng"
                  placeholder="VD: Hàng lỗi, khách đổi ý..."
                  className="mb-4"
                />

                <FormField
                  name="notes"
                  control={control}
                  label="Ghi chú"
                  type="textarea"
                  rows={3}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Products Selection */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  Sản phẩm trả lại
                </Typography>

                {selectedInvoice ? (
                  <Box mb={3}>
                    <Typography variant="subtitle2" mb={1}>
                      Chọn sản phẩm từ hóa đơn:
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {selectedInvoice.items?.map((item) => {
                        // Lấy tên sản phẩm từ relation product
                        const productName = item.product?.name || item.product_name || `Sản phẩm #${item.product_id}`;
                        
                        return (
                          <Button
                            key={item.id}
                            variant="outlined"
                            size="small"
                            onClick={() => handleAddItem(item)}
                            disabled={fields.some((f) => f.product_id === item.product_id)}
                          >
                            {productName}
                          </Button>
                        );
                      })}
                    </Box>
                  </Box>
                ) : (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Vui lòng chọn hóa đơn trước
                  </Alert>
                )}

                {errors.items && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {errors.items.message}
                  </Alert>
                )}

                {fields.length > 0 && (
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Sản phẩm</TableCell>
                          <TableCell align="right">Số lượng trả</TableCell>
                          <TableCell align="right">Đơn giá</TableCell>
                          <TableCell align="right">Thành tiền hoàn</TableCell>
                          <TableCell>Lý do (tùy chọn)</TableCell>
                          <TableCell align="center">Xóa</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {fields.map((field, index) => {
                          const quantity = watch(`items.${index}.quantity`);
                          const unitPrice = watch(`items.${index}.unit_price`);
                          const total = quantity * unitPrice;

                          // Find max quantity from invoice
                          const invoiceItem = selectedInvoice?.items?.find(
                            (i) => i.product_id === field.product_id
                          );
                          const maxQuantity = invoiceItem ? invoiceItem.quantity : 999;

                          return (
                            <TableRow key={field.id}>
                              <TableCell>
                                <Typography variant="body2" fontWeight="bold">
                                  {field.product_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Đã mua: {maxQuantity}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Controller
                                  name={`items.${index}.quantity`}
                                  control={control}
                                  render={({ field }) => (
                                    <NumberInput
                                      value={field.value ? Number(field.value) : null}
                                      onChange={(val) => field.onChange(val)}
                                      min={1}
                                      max={maxQuantity}
                                      size="small"
                                      style={{ width: 80 }}
                                      status={errors.items?.[index]?.quantity ? "error" : undefined}
                                    />
                                  )}
                                />
                              </TableCell>
                              <TableCell align="right">
                                {formatCurrency(unitPrice)}
                              </TableCell>
                              <TableCell align="right">
                                <Typography fontWeight="bold" color="error.main">
                                  {formatCurrency(total)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <FormField
                                  name={`items.${index}.reason`}
                                  control={control}
                                  label=""
                                  placeholder="Lý do..."
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="center">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => remove(index)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>


          {/* Processing Info - Thông báo xử lý */}
          {selectedInvoice && fields.length > 0 && (() => {
            // Tính tổng giá trị trả
            const totalRefund = fields.reduce((sum, field, index) => {
              const quantity = watch(`items.${index}.quantity`) || 0;
              const unitPrice = watch(`items.${index}.unit_price`) || 0;
              return sum + (quantity * unitPrice);
            }, 0);

            // Lấy công nợ hiện tại
            const remainingAmount = parseFloat(selectedInvoice.remaining_amount?.toString() || '0');
            
            // Tính công nợ mới
            const newRemaining = Math.max(0, remainingAmount - totalRefund);
            
            // Kiểm tra cần hoàn tiền không
            const needRefund = remainingAmount === 0 && totalRefund > 0;

            return (
              <Grid item xs={12}>
                <Card sx={{ bgcolor: 'info.lighter', borderLeft: 4, borderColor: 'info.main' }}>
                  <CardContent>
                    <Typography variant="h6" color="info.dark" gutterBottom>
                      💡 Thông tin xử lý
                    </Typography>
                    
                    <Typography variant="body1" fontWeight="bold" mb={1}>
                      Tổng giá trị trả: {formatCurrency(totalRefund)}
                    </Typography>

                    {totalRefund > 0 && (
                      <Box mt={2}>
                        {needRefund ? (
                          <Alert severity="warning" sx={{ mb: 1 }}>
                            <Typography variant="body2" fontWeight="bold" gutterBottom>
                              💰 PHIẾU HOÀN TIỀN
                            </Typography>
                            <Typography variant="body2">
                              • Khách đã trả đủ tiền
                            </Typography>
                            <Typography variant="body2" color="error.main" fontWeight="bold">
                              • Sẽ tạo phiếu hoàn tiền: {formatCurrency(totalRefund)}
                            </Typography>
                            <Typography variant="body2" color="error.main">
                              ⚠️ Nhân viên cần hoàn tiền mặt cho khách!
                            </Typography>
                          </Alert>
                        ) : (
                          <Alert severity="success">
                            <Typography variant="body2">
                              • Còn nợ {formatCurrency(remainingAmount)} → Trừ vào công nợ
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" color="success.dark">
                              • Công nợ mới: {formatCurrency(newRemaining)}
                            </Typography>
                          </Alert>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })()}

          {/* Actions */}
          <Grid item xs={12}>
            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => navigate('/sales-returns')}
                disabled={createMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Đang tạo...' : 'Tạo phiếu trả'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default CreateSalesReturn;
