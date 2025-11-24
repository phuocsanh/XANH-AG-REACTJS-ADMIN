import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
} from '@mui/material';
import { Payment as PaymentIcon } from '@mui/icons-material';
import DataTable from '@/components/common/data-table';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DebtNote } from '@/models/debt-note';
import { useDebtNotesQuery, usePayDebtMutation } from '@/queries/debt-note';
import {
  payDebtSchema,
  PayDebtFormData,
  defaultPayDebtValues,
  debtStatusLabels,
  debtStatusColors,
} from './form-config';

interface ExtendedDebtNote extends DebtNote {
  key: string;
  [key: string]: any;
}

const DebtNotesList = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [openPayDialog, setOpenPayDialog] = useState(false);
  const [payingDebt, setPayingDebt] = useState<DebtNote | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PayDebtFormData>({
    resolver: zodResolver(payDebtSchema),
    defaultValues: defaultPayDebtValues,
  });

  // Fetch debt notes
  const { data: debtNotesData, isLoading } = useDebtNotesQuery({
    page: currentPage,
    limit: pageSize,
    status: statusFilter || undefined,
  });

  // Pay debt mutation
  const payDebtMutation = usePayDebtMutation();

  const handleOpenPayDialog = (debtNote: DebtNote) => {
    setPayingDebt(debtNote);
    reset({
      ...defaultPayDebtValues,
      amount: debtNote.remaining_amount,
    });
    setOpenPayDialog(true);
  };

  const handleClosePayDialog = () => {
    setOpenPayDialog(false);
    setPayingDebt(null);
    reset(defaultPayDebtValues);
  };

  const onSubmitPayDebt = (data: PayDebtFormData) => {
    if (payingDebt) {
      payDebtMutation.mutate(
        { id: payingDebt.id, data },
        {
          onSuccess: () => {
            handleClosePayDialog();
          },
        }
      );
    }
  };

  const getDebtNoteList = (): ExtendedDebtNote[] => {
    if (!debtNotesData?.data?.items) return [];

    return debtNotesData.data.items.map((debtNote: DebtNote) => ({
      ...debtNote,
      key: debtNote.id.toString(),
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
      title: 'Mã phiếu nợ',
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
      width: 180,
      render: (value: unknown) => <Typography variant="body2">{String(value)}</Typography>,
    },
    {
      title: 'Mùa vụ',
      dataIndex: 'season_name',
      key: 'season_name',
      width: 120,
      render: (value: unknown) => (
        <Typography variant="body2">{value ? String(value) : '-'}</Typography>
      ),
    },
    {
      title: 'Số tiền nợ',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      render: (value: unknown) => (
        <Typography variant="body2" color="text.secondary">
          {formatCurrency(Number(value))}
        </Typography>
      ),
    },
    {
      title: 'Đã trả',
      dataIndex: 'paid_amount',
      key: 'paid_amount',
      width: 130,
      render: (value: unknown) => (
        <Typography variant="body2" color="success.main">
          {formatCurrency(Number(value))}
        </Typography>
      ),
    },
    {
      title: 'Còn nợ',
      dataIndex: 'remaining_amount',
      key: 'remaining_amount',
      width: 130,
      render: (value: unknown) => (
        <Typography variant="body2" color="error.main" fontWeight="bold">
          {formatCurrency(Number(value))}
        </Typography>
      ),
    },
    {
      title: 'Hạn trả',
      dataIndex: 'due_date',
      key: 'due_date',
      width: 120,
      render: (value: unknown) => (
        <Typography variant="body2">
          {value ? new Date(String(value)).toLocaleDateString('vi-VN') : '-'}
        </Typography>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value: unknown) => {
        const status = String(value) as keyof typeof debtStatusLabels;
        return (
          <Chip
            label={String(debtStatusLabels[status] || value)}
            color={debtStatusColors[status] || 'default'}
            size="small"
          />
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      render: (_: unknown, record: ExtendedDebtNote) => (
        <Box>
          {record.remaining_amount > 0 && record.status !== 'paid' && (
            <Button
              size="small"
              variant="outlined"
              color="success"
              startIcon={<PaymentIcon />}
              onClick={() => handleOpenPayDialog(record)}
            >
              Trả nợ
            </Button>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Quản lý Công nợ
        </Typography>
      </Box>

      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Trạng thái</InputLabel>
            <Select
              value={statusFilter}
              label="Trạng thái"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">Tất cả</MenuItem>
              <MenuItem value="active">Đang nợ</MenuItem>
              <MenuItem value="overdue">Quá hạn</MenuItem>
              <MenuItem value="paid">Đã trả</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Summary Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'warning.light' }}>
            <CardContent>
              <Typography variant="subtitle2" color="warning.dark">
                Tổng công nợ
              </Typography>
              <Typography variant="h5" color="warning.dark" fontWeight="bold">
                {formatCurrency(
                  getDebtNoteList().reduce((sum, debt) => sum + debt.remaining_amount, 0)
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'error.light' }}>
            <CardContent>
              <Typography variant="subtitle2" color="error.dark">
                Quá hạn
              </Typography>
              <Typography variant="h5" color="error.dark" fontWeight="bold">
                {
                  getDebtNoteList().filter((debt) => debt.status === 'overdue').length
                } phiếu
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'info.light' }}>
            <CardContent>
              <Typography variant="subtitle2" color="info.dark">
                Đang nợ
              </Typography>
              <Typography variant="h5" color="info.dark" fontWeight="bold">
                {
                  getDebtNoteList().filter((debt) => debt.status === 'active').length
                } phiếu
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'success.light' }}>
            <CardContent>
              <Typography variant="subtitle2" color="success.dark">
                Đã trả
              </Typography>
              <Typography variant="h5" color="success.dark" fontWeight="bold">
                {
                  getDebtNoteList().filter((debt) => debt.status === 'paid').length
                } phiếu
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <DataTable
          columns={columns}
          data={getDebtNoteList() as any}
          loading={isLoading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: debtNotesData?.data?.total || 0,
            onChange: (page: number, size: number) => {
              setCurrentPage(page);
              setPageSize(size);
            },
            showSizeChanger: true,
            showTotal: (total: number, range: number[]) =>
              `${range[0]}-${range[1]} của ${total} phiếu nợ`,
          }}
        />

      {/* Pay Debt Dialog */}
      <Dialog open={openPayDialog} onClose={handleClosePayDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Trả nợ: {payingDebt?.code}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmitPayDebt)}>
          <DialogContent>
            {payingDebt && (
              <Box>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Khách hàng
                    </Typography>
                    <Typography variant="h6" gutterBottom>
                      {payingDebt.customer_name}
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary">
                      Số tiền còn nợ
                    </Typography>
                    <Typography variant="h5" color="error.main" fontWeight="bold">
                      {formatCurrency(payingDebt.remaining_amount)}
                    </Typography>
                  </CardContent>
                </Card>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Controller
                      name="amount"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Số tiền trả *"
                          type="number"
                          error={!!errors.amount}
                          helperText={errors.amount?.message}
                          inputProps={{
                            min: 0,
                            max: payingDebt.remaining_amount,
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Controller
                      name="payment_method"
                      control={control}
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
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClosePayDialog}>Hủy</Button>
            <Button
              type="submit"
              variant="contained"
              color="success"
              disabled={payDebtMutation.isPending}
            >
              {payDebtMutation.isPending ? 'Đang xử lý...' : 'Xác nhận trả nợ'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default DebtNotesList;
