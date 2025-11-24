import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  CircularProgress,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import DataTable from '@/components/common/data-table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Customer } from '@/models/customer';
import {
  useCustomersQuery,
  useCustomerInvoicesQuery,
  useCustomerDebtsQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} from '@/queries/customer';
import {
  customerSchema,
  CustomerFormData,
  defaultCustomerValues,
  customerTypeLabels,
} from './form-config';

interface ExtendedCustomer extends Customer {
  key: string;
  [key: string]: any;
}

const Customers = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [detailTab, setDetailTab] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: defaultCustomerValues,
  });

  // Use hooks from queries
  const { data: customersData, isLoading } = useCustomersQuery({
    page: currentPage,
    limit: pageSize,
    search: searchTerm || undefined,
  });

  const { data: customerInvoices } = useCustomerInvoicesQuery(viewingCustomer?.id || 0);
  const { data: customerDebts } = useCustomerDebtsQuery(viewingCustomer?.id || 0);

  const createMutation = useCreateCustomerMutation();
  const updateMutation = useUpdateCustomerMutation();
  const deleteMutation = useDeleteCustomerMutation();

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    reset(defaultCustomerValues);
    setOpenDialog(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    reset({
      code: customer.code,
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      type: customer.type,
      tax_code: customer.tax_code || '',
      notes: customer.notes || '',
    });
    setOpenDialog(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setDeletingCustomer(customer);
    setOpenDeleteDialog(true);
  };

  const handleViewCustomer = (customer: Customer) => {
    setViewingCustomer(customer);
    setDetailTab(0);
    setOpenDetailDialog(true);
  };

  const onSubmit = (data: CustomerFormData) => {
    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, customer: data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleConfirmDelete = () => {
    if (deletingCustomer) {
      deleteMutation.mutate(deletingCustomer.id);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCustomer(null);
    reset(defaultCustomerValues);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setDeletingCustomer(null);
  };

  const handleCloseDetailDialog = () => {
    setOpenDetailDialog(false);
    setViewingCustomer(null);
  };

  const getCustomerList = (): ExtendedCustomer[] => {
    if (!customersData?.data?.items) return [];

    return customersData.data.items.map((customer: Customer) => ({
      ...customer,
      key: customer.id.toString(),
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const columns = [
    {
      title: 'Mã KH',
      dataIndex: 'code',
      key: 'code',
      width: 100,
      render: (value: unknown) => (
        <Typography variant="body2" fontWeight="bold">
          {String(value)}
        </Typography>
      ),
    },
    {
      title: 'Tên khách hàng',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (value: unknown) => <Typography variant="body2">{String(value)}</Typography>,
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
      render: (value: unknown) => <Typography variant="body2">{String(value)}</Typography>,
    },
    {
      title: 'Loại KH',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (value: unknown) => {
        const type = String(value) as keyof typeof customerTypeLabels;
        const colorMap = {
          regular: 'default',
          vip: 'warning',
          wholesale: 'info',
        } as const;
        return (
          <Chip
            label={String(customerTypeLabels[type] || value)}
            color={colorMap[type] || 'default'}
            size="small"
          />
        );
      },
    },
    {
      title: 'Tổng mua',
      dataIndex: 'total_purchases',
      key: 'total_purchases',
      width: 100,
      render: (value: unknown) => (
        <Typography variant="body2">{Number(value) || 0} đơn</Typography>
      ),
    },
    {
      title: 'Tổng chi tiêu',
      dataIndex: 'total_spent',
      key: 'total_spent',
      width: 130,
      render: (value: unknown) => (
        <Typography variant="body2" color="success.main">
          {formatCurrency(Number(value) || 0)}
        </Typography>
      ),
    },
    {
      title: 'Công nợ',
      dataIndex: 'current_debt',
      key: 'current_debt',
      width: 130,
      render: (value: unknown) => {
        const debt = Number(value) || 0;
        return (
          <Typography variant="body2" color={debt > 0 ? 'error.main' : 'text.secondary'}>
            {formatCurrency(debt)}
          </Typography>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 200,
      render: (_: unknown, record: ExtendedCustomer) => (
        <Box display="flex" gap={1}>
          <Button
            size="small"
            variant="outlined"
            color="info"
            startIcon={<ViewIcon />}
            onClick={() => handleViewCustomer(record)}
          >
            Xem
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => handleEditCustomer(record)}
          >
            Sửa
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => handleDeleteCustomer(record)}
          >
            Xóa
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Quản lý Khách hàng
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddCustomer}
        >
          Thêm khách hàng
        </Button>
      </Box>

      <Box mb={2}>
        <TextField
          fullWidth
          placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Box>

      <DataTable
        columns={columns}
        data={getCustomerList() as any}
        loading={isLoading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: customersData?.data?.total || 0,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          },
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} khách hàng`,
        }}
      />

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCustomer ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Mã khách hàng"
                  fullWidth
                  {...register('code')}
                  error={!!errors.code}
                  helperText={errors.code?.message}
                  placeholder="VD: KH001"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Tên khách hàng"
                  fullWidth
                  {...register('name')}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Số điện thoại"
                  fullWidth
                  {...register('phone')}
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  fullWidth
                  {...register('email')}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Địa chỉ"
                  fullWidth
                  {...register('address')}
                  error={!!errors.address}
                  helperText={errors.address?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.type}>
                  <InputLabel>Loại khách hàng</InputLabel>
                  <Select label="Loại khách hàng" {...register('type')} defaultValue="regular">
                    <MenuItem value="regular">Khách hàng thường</MenuItem>
                    <MenuItem value="vip">Khách hàng VIP</MenuItem>
                    <MenuItem value="wholesale">Khách hàng sỉ</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Mã số thuế"
                  fullWidth
                  {...register('tax_code')}
                  error={!!errors.tax_code}
                  helperText={errors.tax_code?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Ghi chú"
                  fullWidth
                  multiline
                  rows={3}
                  {...register('notes')}
                  error={!!errors.notes}
                  helperText={errors.notes?.message}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Hủy</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <CircularProgress size={24} />
              ) : editingCustomer ? (
                'Cập nhật'
              ) : (
                'Tạo mới'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa khách hàng <strong>{deletingCustomer?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Hủy</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? <CircularProgress size={24} /> : 'Xóa'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Customer Detail Dialog */}
      <Dialog
        open={openDetailDialog}
        onClose={handleCloseDetailDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Chi tiết khách hàng: {viewingCustomer?.name}</DialogTitle>
        <DialogContent>
          <Tabs value={detailTab} onChange={(_, newValue) => setDetailTab(newValue)}>
            <Tab label="Thông tin chung" />
            <Tab label="Lịch sử mua hàng" />
            <Tab label="Công nợ" />
          </Tabs>

          {detailTab === 0 && viewingCustomer && (
            <Box mt={2}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Mã khách hàng
                      </Typography>
                      <Typography variant="h6">{viewingCustomer.code}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Loại khách hàng
                      </Typography>
                      <Typography variant="h6">
                        {customerTypeLabels[viewingCustomer.type]}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Tổng số lần mua
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {viewingCustomer.total_purchases} đơn
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Tổng chi tiêu
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        {formatCurrency(viewingCustomer.total_spent)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Công nợ hiện tại
                      </Typography>
                      <Typography variant="h6" color="error.main">
                        {formatCurrency(viewingCustomer.current_debt || 0)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {detailTab === 1 && (
            <Box mt={2}>
              {customerInvoices && customerInvoices.length > 0 ? (
                <Box>
                  {customerInvoices.map((invoice: any) => (
                    <Card key={invoice.id} sx={{ mb: 1 }}>
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={3}>
                            <Typography variant="subtitle2">Mã HĐ</Typography>
                            <Typography fontWeight="bold">{invoice.code}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <Typography variant="subtitle2">Ngày</Typography>
                            <Typography>
                              {new Date(invoice.date).toLocaleDateString('vi-VN')}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <Typography variant="subtitle2">Tổng tiền</Typography>
                            <Typography color="success.main">
                              {formatCurrency(invoice.final_amount)}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <Typography variant="subtitle2">Trạng thái</Typography>
                            <Chip
                              label={invoice.status}
                              color={invoice.status === 'PAID' ? 'success' : 'warning'}
                              size="small"
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Typography textAlign="center" color="text.secondary">
                  Chưa có lịch sử mua hàng
                </Typography>
              )}
            </Box>
          )}

          {detailTab === 2 && (
            <Box mt={2}>
              {customerDebts && customerDebts.length > 0 ? (
                <Box>
                  {customerDebts.map((debt: any) => (
                    <Card key={debt.id} sx={{ mb: 1 }}>
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={3}>
                            <Typography variant="subtitle2">Mã phiếu nợ</Typography>
                            <Typography fontWeight="bold">{debt.code}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <Typography variant="subtitle2">Số tiền nợ</Typography>
                            <Typography color="error.main">
                              {formatCurrency(debt.remaining_amount)}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <Typography variant="subtitle2">Hạn trả</Typography>
                            <Typography>
                              {debt.due_date
                                ? new Date(debt.due_date).toLocaleDateString('vi-VN')
                                : '-'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <Typography variant="subtitle2">Trạng thái</Typography>
                            <Chip
                              label={debt.status}
                              color={
                                debt.status === 'paid'
                                  ? 'success'
                                  : debt.status === 'overdue'
                                    ? 'error'
                                    : 'warning'
                              }
                              size="small"
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Typography textAlign="center" color="text.secondary">
                  Không có công nợ
                </Typography>
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

export default Customers;
