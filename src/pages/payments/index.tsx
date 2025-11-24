import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  Chip,
  Autocomplete,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  AccountBalance as SettleIcon,
} from '@mui/icons-material';
import DataTable from '@/components/common/data-table';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Payment, PaymentAllocation } from '@/models/payment';
import {
  usePaymentsQuery,
  usePaymentAllocationsQuery,
  useCreatePaymentMutation,
  useSettlePaymentMutation,
} from '@/queries/payment';
import {
  useCustomerSearchQuery,
  useCustomerInvoicesQuery,
  useCustomerDebtsQuery,
} from '@/queries/customer';
import { useSeasonsQuery } from '@/queries/season';
import { Customer } from '@/models/customer';
import { Season } from '@/models/season';
import {
  simplePaymentSchema,
  settlePaymentSchema,
  SimplePaymentFormData,
  SettlePaymentFormData,
  defaultSimplePaymentValues,
  defaultSettlePaymentValues,
  paymentMethodLabels,
} from './form-config';

interface ExtendedPayment extends Payment {
  key: string;
  [key: string]: any;
}

const PaymentsList = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [openSimpleDialog, setOpenSimpleDialog] = useState(false);
  const [openSettleDialog, setOpenSettleDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);

  // Form for simple payment
  const simpleForm = useForm<SimplePaymentFormData>({
    resolver: zodResolver(simplePaymentSchema),
    defaultValues: defaultSimplePaymentValues,
  });

  // Form for settle payment
  const settleForm = useForm<SettlePaymentFormData>({
    resolver: zodResolver(settlePaymentSchema),
    defaultValues: defaultSettlePaymentValues,
  });

  // Fetch payments
  const { data: paymentsData, isLoading } = usePaymentsQuery({
    page: currentPage,
    limit: pageSize,
  });

  // Fetch customers for autocomplete
  const { data: customers } = useCustomerSearchQuery(customerSearch);

  // Fetch customer invoices when customer selected
  const { data: customerInvoices } = useCustomerInvoicesQuery(selectedCustomer?.id || 0);

  // Fetch customer debts
  const { data: customerDebts } = useCustomerDebtsQuery(selectedCustomer?.id || 0);

  // Fetch seasons
  const { data: seasons } = useSeasonsQuery();

  // Fetch payment allocations
  const { data: allocations } = usePaymentAllocationsQuery(viewingPayment?.id || 0);

  // Create simple payment mutation
  const createSimplePaymentMutation = useCreatePaymentMutation();

  // Settle payment mutation
  const settlePaymentMutation = useSettlePaymentMutation();

  const handleOpenSimpleDialog = () => {
    simpleForm.reset(defaultSimplePaymentValues);
    setSelectedCustomer(null);
    setOpenSimpleDialog(true);
  };

  const handleCloseSimpleDialog = () => {
    setOpenSimpleDialog(false);
    setSelectedCustomer(null);
  };

  const handleOpenSettleDialog = () => {
    settleForm.reset(defaultSettlePaymentValues);
    setSelectedCustomer(null);
    setSelectedInvoices([]);
    setOpenSettleDialog(true);
  };

  const handleCloseSettleDialog = () => {
    setOpenSettleDialog(false);
    setSelectedCustomer(null);
    setSelectedInvoices([]);
  };

  const handleViewPayment = (payment: Payment) => {
    setViewingPayment(payment);
    setOpenDetailDialog(true);
  };

  const handleCloseDetailDialog = () => {
    setOpenDetailDialog(false);
    setViewingPayment(null);
  };

  const handleCustomerSelect = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    if (customer) {
      simpleForm.setValue('customer_id', customer.id);
      settleForm.setValue('customer_id', customer.id);
    }
  };

  const handleInvoiceToggle = (invoiceId: number) => {
    setSelectedInvoices((prev) =>
      prev.includes(invoiceId)
        ? prev.filter((id) => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const onSubmitSimplePayment = (data: SimplePaymentFormData) => {
    createSimplePaymentMutation.mutate(data, {
      onSuccess: () => {
        handleCloseSimpleDialog();
      },
    });
  };

  const onSubmitSettlePayment = (data: SettlePaymentFormData) => {
    const submitData = {
      ...data,
      invoice_ids: selectedInvoices.length > 0 ? selectedInvoices : undefined,
    };
    settlePaymentMutation.mutate(submitData, {
      onSuccess: () => {
        handleCloseSettleDialog();
      },
    });
  };

  const getPaymentList = (): ExtendedPayment[] => {
    if (!paymentsData?.data?.items) return [];

    return paymentsData.data.items.map((payment: Payment) => ({
      ...payment,
      key: payment.id.toString(),
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const calculateTotalDebt = () => {
    if (!customerInvoices && !customerDebts) return 0;
    
    const invoicesDebt = customerInvoices?.reduce(
      (sum: number, inv: any) => sum + (inv.remaining_amount || 0),
      0
    ) || 0;
    
    const debtsAmount = customerDebts?.reduce(
      (sum: number, debt: any) => sum + (debt.remaining_amount || 0),
      0
    ) || 0;
    
    return invoicesDebt + debtsAmount;
  };

  const calculateSelectedDebt = () => {
    if (!customerInvoices) return 0;
    return customerInvoices
      .filter((inv: any) => selectedInvoices.includes(inv.id))
      .reduce((sum: number, inv: any) => sum + (inv.remaining_amount || 0), 0);
  };

  const columns = [
    {
      title: 'Mã PT',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (value: unknown) => (
        <Typography variant="body2" fontWeight="bold">
          {String(value)}
        </Typography>
      ),
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 200,
      render: (value: unknown) => <Typography variant="body2">{String(value)}</Typography>,
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      render: (value: unknown) => (
        <Typography variant="body2" color="success.main" fontWeight="bold">
          {formatCurrency(Number(value))}
        </Typography>
      ),
    },
    {
      title: 'Đã phân bổ',
      dataIndex: 'allocated_amount',
      key: 'allocated_amount',
      width: 150,
      render: (value: unknown) => (
        <Typography variant="body2" color="info.main">
          {formatCurrency(Number(value))}
        </Typography>
      ),
    },
    {
      title: 'Phương thức',
      dataIndex: 'payment_method',
      key: 'payment_method',
      width: 130,
      render: (value: unknown) => (
        <Chip
          label={paymentMethodLabels[value as keyof typeof paymentMethodLabels] || String(value)}
          size="small"
          color="primary"
          variant="outlined"
        />
      ),
    },
    {
      title: 'Ngày thu',
      dataIndex: 'payment_date',
      key: 'payment_date',
      width: 120,
      render: (value: unknown) => (
        <Typography variant="body2">
          {new Date(String(value)).toLocaleDateString('vi-VN')}
        </Typography>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      render: (_: unknown, record: ExtendedPayment) => (
        <Button
          size="small"
          variant="outlined"
          color="info"
          startIcon={<ViewIcon />}
          onClick={() => handleViewPayment(record)}
        >
          Xem
        </Button>
      ),
    },
  ];

  const settleAmount = settleForm.watch('amount');
  const selectedDebt = calculateSelectedDebt();
  const remainingDebt = selectedDebt - settleAmount;
  const createDebtNote = settleForm.watch('create_debt_note');

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Quản lý Thanh toán
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenSimpleDialog}
          >
            Thu tiền đơn giản
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<SettleIcon />}
            onClick={handleOpenSettleDialog}
          >
            Chốt sổ công nợ
          </Button>
        </Box>
      </Box>

      <DataTable
        columns={columns}
        data={getPaymentList() as any}
        loading={isLoading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: paymentsData?.data?.total || 0,
          onChange: (page: number, size: number) => {
            setCurrentPage(page);
            setPageSize(size);
          },
          showSizeChanger: true,
          showTotal: (total: number, range: number[]) =>
            `${range[0]}-${range[1]} của ${total} phiếu thu`,
        }}
      />

      {/* Simple Payment Dialog */}
      <Dialog open={openSimpleDialog} onClose={handleCloseSimpleDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Thu tiền đơn giản</DialogTitle>
        <form onSubmit={simpleForm.handleSubmit(onSubmitSimplePayment)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Autocomplete
                  options={customers || []}
                  getOptionLabel={(option) => `${option.name} - ${option.phone}`}
                  value={selectedCustomer}
                  onChange={(_, newValue) => handleCustomerSelect(newValue)}
                  onInputChange={(_, newInputValue) => setCustomerSearch(newInputValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Khách hàng *"
                      error={!!simpleForm.formState.errors.customer_id}
                      helperText={simpleForm.formState.errors.customer_id?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="amount"
                  control={simpleForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Số tiền *"
                      type="number"
                      error={!!simpleForm.formState.errors.amount}
                      helperText={simpleForm.formState.errors.amount?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="payment_method"
                  control={simpleForm.control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Phương thức thanh toán</InputLabel>
                      <Select {...field} label="Phương thức thanh toán">
                        <MenuItem value="cash">Tiền mặt</MenuItem>
                        <MenuItem value="transfer">Chuyển khoản</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="payment_date"
                  control={simpleForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Ngày thu"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="notes"
                  control={simpleForm.control}
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
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseSimpleDialog}>Hủy</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createSimplePaymentMutation.isPending}
            >
              {createSimplePaymentMutation.isPending ? 'Đang xử lý...' : 'Tạo phiếu thu'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Settle Payment Dialog */}
      <Dialog open={openSettleDialog} onClose={handleCloseSettleDialog} maxWidth="md" fullWidth>
        <DialogTitle>Chốt sổ công nợ</DialogTitle>
        <form onSubmit={settleForm.handleSubmit(onSubmitSettlePayment)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Autocomplete
                  options={customers || []}
                  getOptionLabel={(option) => `${option.name} - ${option.phone}`}
                  value={selectedCustomer}
                  onChange={(_, newValue) => handleCustomerSelect(newValue)}
                  onInputChange={(_, newInputValue) => setCustomerSearch(newInputValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Khách hàng *" />
                  )}
                />
              </Grid>

              {selectedCustomer && (
                <>
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Tổng công nợ hiện tại
                        </Typography>
                        <Typography variant="h5" color="error.main" fontWeight="bold">
                          {formatCurrency(calculateTotalDebt())}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Chọn hóa đơn cần thanh toán
                    </Typography>
                    <List sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid #ddd' }}>
                      {customerInvoices?.map((invoice: any) => (
                        <ListItem key={invoice.id} dense>
                          <ListItemIcon>
                            <Checkbox
                              checked={selectedInvoices.includes(invoice.id)}
                              onChange={() => handleInvoiceToggle(invoice.id)}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={`${invoice.code} - ${formatCurrency(invoice.remaining_amount)}`}
                            secondary={new Date(invoice.created_at).toLocaleDateString('vi-VN')}
                          />
                        </ListItem>
                      ))}
                    </List>
                    {selectedInvoices.length > 0 && (
                      <Typography variant="body2" color="info.main" mt={1}>
                        Tổng nợ đã chọn: {formatCurrency(selectedDebt)}
                      </Typography>
                    )}
                  </Grid>
                </>
              )}

              <Grid item xs={12} sm={6}>
                <Controller
                  name="amount"
                  control={settleForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Số tiền khách trả *"
                      type="number"
                      error={!!settleForm.formState.errors.amount}
                      helperText={settleForm.formState.errors.amount?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="payment_method"
                  control={settleForm.control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Phương thức</InputLabel>
                      <Select {...field} label="Phương thức">
                        <MenuItem value="cash">Tiền mặt</MenuItem>
                        <MenuItem value="transfer">Chuyển khoản</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              {remainingDebt > 0 && (
                <Grid item xs={12}>
                  <Alert severity="warning">
                    <Typography variant="body2">
                      Số tiền còn thiếu: <strong>{formatCurrency(remainingDebt)}</strong>
                    </Typography>
                  </Alert>

                  <Controller
                    name="create_debt_note"
                    control={settleForm.control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Checkbox {...field} checked={field.value} />}
                        label="Tạo phiếu nợ mới cho số tiền còn thiếu"
                      />
                    )}
                  />

                  {createDebtNote && (
                    <Grid container spacing={2} mt={1}>
                      <Grid item xs={12}>
                        <Controller
                          name="debt_note_config.season_id"
                          control={settleForm.control}
                          render={({ field }) => (
                            <FormControl fullWidth>
                              <InputLabel>Mùa vụ</InputLabel>
                              <Select {...field} label="Mùa vụ">
                                {seasons?.data?.items?.map((season: Season) => (
                                  <MenuItem key={season.id} value={season.id}>
                                    {season.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Controller
                          name="debt_note_config.notes"
                          control={settleForm.control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Ghi chú phiếu nợ"
                              multiline
                              rows={2}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>
                  )}
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseSettleDialog}>Hủy</Button>
            <Button
              type="submit"
              variant="contained"
              color="success"
              disabled={settlePaymentMutation.isPending}
            >
              {settlePaymentMutation.isPending ? 'Đang xử lý...' : 'Chốt sổ'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Payment Detail Dialog */}
      <Dialog open={openDetailDialog} onClose={handleCloseDetailDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Chi tiết phiếu thu: {viewingPayment?.code}</DialogTitle>
        <DialogContent>
          {viewingPayment && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Khách hàng
                  </Typography>
                  <Typography variant="h6">{viewingPayment.customer_name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Số tiền
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {formatCurrency(viewingPayment.amount)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Đã phân bổ
                  </Typography>
                  <Typography variant="h6" color="info.main">
                    {formatCurrency(viewingPayment.allocated_amount)}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Chi tiết phân bổ
              </Typography>
              {allocations && allocations.length > 0 ? (
                <List>
                  {allocations.map((allocation: PaymentAllocation) => (
                    <ListItem key={allocation.id}>
                      <ListItemText
                        primary={
                          allocation.allocation_type === 'invoice'
                            ? `Hóa đơn: ${allocation.invoice_code}`
                            : `Phiếu nợ: ${allocation.debt_note_code}`
                        }
                        secondary={formatCurrency(allocation.amount)}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">Chưa có phân bổ</Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailDialog}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentsList;
