import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  Grid,
  Card,
  CardContent,
  Autocomplete,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  FormHelperText,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateSalesReturnMutation } from '@/queries/sales-return';
import { useSalesInvoicesQuery } from '@/queries/sales-invoice';
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
    status: 'paid', // Only allow returning paid/confirmed invoices
  });

  const createMutation = useCreateSalesReturnMutation();

  const handleInvoiceSelect = (invoice: SalesInvoice | null) => {
    setSelectedInvoice(invoice);
    if (invoice) {
      setValue('invoice_id', invoice.id);
      // Reset items
      replace([]);
    } else {
      setValue('invoice_id', 0);
      replace([]);
    }
  };

  const handleAddItem = (product: any) => {
    // Check if item already exists
    const exists = fields.some((field) => field.product_id === product.product_id);
    if (exists) return;

    append({
      product_id: product.product_id,
      product_name: product.product_name,
      quantity: 1,
      unit_price: product.unit_price,
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

                <Autocomplete
                  options={invoiceList}
                  getOptionLabel={(option) => `${option.code} - ${option.customer_name}`}
                  value={selectedInvoice}
                  onChange={(_, newValue) => handleInvoiceSelect(newValue)}
                  onInputChange={(_, newInputValue) => setInvoiceSearch(newInputValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Tìm hóa đơn"
                      placeholder="Nhập mã hóa đơn hoặc tên khách hàng..."
                      error={!!errors.invoice_id}
                      helperText={errors.invoice_id?.message}
                    />
                  )}
                  sx={{ mb: 2 }}
                />

                {selectedInvoice && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Khách hàng:
                    </Typography>
                    <Typography variant="body1" mb={1}>
                      {selectedInvoice.customer_name} - {selectedInvoice.customer_phone}
                    </Typography>
                    
                    <Typography variant="subtitle2" color="text.secondary">
                      Ngày mua:
                    </Typography>
                    <Typography variant="body1" mb={1}>
                      {new Date(selectedInvoice.created_at).toLocaleDateString('vi-VN')}
                    </Typography>

                    <Typography variant="subtitle2" color="text.secondary">
                      Tổng tiền:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color="success.main">
                      {formatCurrency(selectedInvoice.final_amount)}
                    </Typography>
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

                <Controller
                  name="refund_method"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Phương thức hoàn tiền</InputLabel>
                      <Select {...field} label="Phương thức hoàn tiền">
                        {Object.entries(refundMethodLabels).map(([value, label]) => (
                          <MenuItem key={value} value={value}>
                            {label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />

                <Controller
                  name="reason"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Lý do trả hàng"
                      placeholder="VD: Hàng lỗi, khách đổi ý..."
                      sx={{ mb: 2 }}
                    />
                  )}
                />

                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Ghi chú"
                      multiline
                      rows={3}
                    />
                  )}
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
                      {selectedInvoice.items?.map((item) => (
                        <Button
                          key={item.id}
                          variant="outlined"
                          size="small"
                          onClick={() => handleAddItem(item)}
                          disabled={fields.some((f) => f.product_id === item.product_id)}
                        >
                          {item.product_name}
                        </Button>
                      ))}
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
                                    <TextField
                                      {...field}
                                      type="number"
                                      size="small"
                                      inputProps={{ min: 1, max: maxQuantity }}
                                      sx={{ width: 80 }}
                                      error={!!errors.items?.[index]?.quantity}
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
                                <Controller
                                  name={`items.${index}.reason`}
                                  control={control}
                                  render={({ field }) => (
                                    <TextField
                                      {...field}
                                      size="small"
                                      placeholder="Lý do..."
                                      fullWidth
                                    />
                                  )}
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
