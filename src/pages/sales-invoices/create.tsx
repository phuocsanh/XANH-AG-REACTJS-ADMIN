import { useState, useEffect } from 'react';
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
  Divider,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateSalesInvoiceMutation } from '@/queries/sales-invoice';
import { useCustomerSearchQuery } from '@/queries/customer';
import { useSeasonsQuery, useActiveSeasonQuery } from '@/queries/season';
import { Customer } from '@/models/customer';
import { Season } from '@/models/season';
import {
  salesInvoiceSchema,
  SalesInvoiceFormData,
  defaultSalesInvoiceValues,
  defaultSalesInvoiceItemValues,
  paymentMethodLabels,
} from './form-config';

// Mock product API - replace with actual API
const mockProducts = [
  { id: 1, name: 'Phân NPK Phú Mỹ 16-16-8', price: 850000, unit: 'Bao 50kg' },
  { id: 2, name: 'Thuốc trừ sâu Rùa Vàng', price: 120000, unit: 'Chai 500ml' },
  { id: 3, name: 'Phân DAP', price: 750000, unit: 'Bao 50kg' },
  { id: 4, name: 'Thuốc diệt cỏ', price: 95000, unit: 'Chai 1L' },
];

const CreateSalesInvoice = () => {
  const navigate = useNavigate();
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isGuestCustomer, setIsGuestCustomer] = useState(true);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SalesInvoiceFormData>({
    resolver: zodResolver(salesInvoiceSchema),
    defaultValues: defaultSalesInvoiceValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // Use hooks from queries
  const { data: customers } = useCustomerSearchQuery(customerSearch);
  const { data: activeSeason } = useActiveSeasonQuery();
  const { data: seasons } = useSeasonsQuery();

  const createMutation = useCreateSalesInvoiceMutation();

  // Set active season as default
  useEffect(() => {
    if (activeSeason) {
      setValue('season_id', activeSeason.id);
    }
  }, [activeSeason, setValue]);

  // Watch items to calculate totals
  const items = watch('items');
  const discountAmount = watch('discount_amount');
  const partialPaymentAmount = watch('partial_payment_amount');

  useEffect(() => {
    const total = items.reduce((sum, item) => {
      return sum + item.quantity * item.unit_price - (item.discount_amount || 0);
    }, 0);
    setValue('total_amount', total);
    setValue('final_amount', total - discountAmount);
  }, [items, discountAmount, setValue]);

  const handleCustomerSelect = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    if (customer) {
      setIsGuestCustomer(false);
      setValue('customer_id', customer.id);
      setValue('customer_name', customer.name);
      setValue('customer_phone', customer.phone);
      setValue('customer_address', customer.address || '');
    } else {
      setIsGuestCustomer(true);
      setValue('customer_id', undefined);
      setValue('customer_name', '');
      setValue('customer_phone', '');
      setValue('customer_address', '');
    }
  };

  const handleAddProduct = (product: any) => {
    append({
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      unit_price: product.price,
      discount_amount: 0,
      notes: '',
    });
    setProductSearch('');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const onSubmit = (data: SalesInvoiceFormData) => {
    // Calculate remaining amount
    const remainingAmount = data.final_amount - data.partial_payment_amount;
    
    const submitData = {
      ...data,
      remaining_amount: remainingAmount,
    };

    createMutation.mutate(submitData as any, {
      onSuccess: () => {
        navigate('/sales-invoices');
      }
    });
  };

  const totalAmount = watch('total_amount');
  const finalAmount = watch('final_amount');
  const remainingAmount = finalAmount - partialPaymentAmount;

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/sales-invoices')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight="bold">
          Tạo hóa đơn bán hàng mới
        </Typography>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          {/* Customer Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  Thông tin khách hàng
                </Typography>

                <Autocomplete
                  options={customers || []}
                  getOptionLabel={(option) => `${option.name} - ${option.phone}`}
                  value={selectedCustomer}
                  onChange={(_, newValue) => handleCustomerSelect(newValue)}
                  onInputChange={(_, newInputValue) => setCustomerSearch(newInputValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Tìm khách hàng (tên hoặc SĐT)"
                      placeholder="Nhập tên hoặc số điện thoại..."
                      helperText="Để trống nếu là khách vãng lai"
                    />
                  )}
                  sx={{ mb: 2 }}
                />

                <Controller
                  name="customer_name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Tên khách hàng *"
                      error={!!errors.customer_name}
                      helperText={errors.customer_name?.message}
                      disabled={!isGuestCustomer}
                      sx={{ mb: 2 }}
                    />
                  )}
                />

                <Controller
                  name="customer_phone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Số điện thoại *"
                      error={!!errors.customer_phone}
                      helperText={errors.customer_phone?.message}
                      disabled={!isGuestCustomer}
                      sx={{ mb: 2 }}
                    />
                  )}
                />

                <Controller
                  name="customer_address"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Địa chỉ"
                      multiline
                      rows={2}
                      disabled={!isGuestCustomer}
                    />
                  )}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Invoice Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  Thông tin hóa đơn
                </Typography>

                <Controller
                  name="season_id"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Mùa vụ</InputLabel>
                      <Select {...field} label="Mùa vụ">
                        {seasons?.data?.items?.map((season: Season) => (
                          <MenuItem key={season.id} value={season.id}>
                            {season.name} ({season.year})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />

                <Controller
                  name="payment_method"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Phương thức thanh toán *</InputLabel>
                      <Select {...field} label="Phương thức thanh toán *">
                        {Object.entries(paymentMethodLabels).map(([value, label]) => (
                          <MenuItem key={value} value={value}>
                            {label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />

                <Controller
                  name="warning"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Lưu ý quan trọng"
                      placeholder="VD: Giao hàng trước 9h sáng"
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

          {/* Products */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  Danh sách sản phẩm
                </Typography>

                <Autocomplete
                  options={mockProducts}
                  getOptionLabel={(option) => `${option.name} - ${formatCurrency(option.price)}`}
                  onChange={(_, newValue) => {
                    if (newValue) {
                      handleAddProduct(newValue);
                    }
                  }}
                  inputValue={productSearch}
                  onInputChange={(_, newInputValue) => setProductSearch(newInputValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Thêm sản phẩm"
                      placeholder="Tìm kiếm sản phẩm..."
                    />
                  )}
                  sx={{ mb: 2 }}
                />

                {errors.items && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {errors.items.message}
                  </Alert>
                )}

                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Sản phẩm</TableCell>
                        <TableCell align="right">Số lượng</TableCell>
                        <TableCell align="right">Đơn giá</TableCell>
                        <TableCell align="right">Giảm giá</TableCell>
                        <TableCell align="right">Thành tiền</TableCell>
                        <TableCell align="center">Xóa</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {fields.map((field, index) => {
                        const itemTotal =
                          watch(`items.${index}.quantity`) * watch(`items.${index}.unit_price`) -
                          (watch(`items.${index}.discount_amount`) || 0);

                        return (
                          <TableRow key={field.id}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">
                                {watch(`items.${index}.product_name`)}
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
                                    inputProps={{ min: 1 }}
                                    sx={{ width: 80 }}
                                  />
                                )}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Controller
                                name={`items.${index}.unit_price`}
                                control={control}
                                render={({ field }) => (
                                  <TextField
                                    {...field}
                                    type="number"
                                    size="small"
                                    inputProps={{ min: 0 }}
                                    sx={{ width: 120 }}
                                  />
                                )}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Controller
                                name={`items.${index}.discount_amount`}
                                control={control}
                                render={({ field }) => (
                                  <TextField
                                    {...field}
                                    type="number"
                                    size="small"
                                    inputProps={{ min: 0 }}
                                    sx={{ width: 100 }}
                                  />
                                )}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="bold" color="success.main">
                                {formatCurrency(itemTotal)}
                              </Typography>
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
              </CardContent>
            </Card>
          </Grid>

          {/* Payment Summary */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  Thanh toán
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>Tổng tiền hàng:</Typography>
                      <Typography fontWeight="bold">{formatCurrency(totalAmount)}</Typography>
                    </Box>

                    <Controller
                      name="discount_amount"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Giảm giá tổng đơn"
                          type="number"
                          inputProps={{ min: 0 }}
                          sx={{ mb: 2 }}
                        />
                      )}
                    />

                    <Divider sx={{ my: 2 }} />

                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography variant="h6">Tổng thanh toán:</Typography>
                      <Typography variant="h6" color="success.main" fontWeight="bold">
                        {formatCurrency(finalAmount)}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Controller
                      name="partial_payment_amount"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Số tiền khách trả trước"
                          type="number"
                          inputProps={{ min: 0, max: finalAmount }}
                          helperText="Nhập số tiền khách trả trước (nếu trả một phần)"
                          sx={{ mb: 2 }}
                        />
                      )}
                    />

                    {remainingAmount > 0 && (
                      <Alert severity="warning">
                        <Typography variant="body2">
                          Số tiền còn nợ: <strong>{formatCurrency(remainingAmount)}</strong>
                        </Typography>
                        <Typography variant="caption">
                          Hệ thống sẽ tự động tạo công nợ cho số tiền này
                        </Typography>
                      </Alert>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Actions */}
          <Grid item xs={12}>
            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => navigate('/sales-invoices')}
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
                {createMutation.isPending ? 'Đang tạo...' : 'Tạo hóa đơn'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default CreateSalesInvoice;
