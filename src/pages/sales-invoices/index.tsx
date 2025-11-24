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
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import DataTable from '@/components/common/data-table';
import { useNavigate } from 'react-router-dom';
import { SalesInvoice } from '@/models/sales-invoice';
import { 
  useSalesInvoicesQuery, 
  useAddPaymentMutation 
} from '@/queries/sales-invoice';
import { invoiceStatusLabels, paymentMethodLabels } from './form-config';

interface ExtendedSalesInvoice extends SalesInvoice {
  key: string;
  [key: string]: any;
}

const SalesInvoicesList = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [viewingInvoice, setViewingInvoice] = useState<SalesInvoice | null>(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const navigate = useNavigate();

  // Use hooks from queries
  const { data: invoicesData, isLoading } = useSalesInvoicesQuery({
    page: currentPage,
    limit: pageSize,
    status: statusFilter || undefined,
  });

  const addPaymentMutation = useAddPaymentMutation();

  const handleViewInvoice = (invoice: SalesInvoice) => {
    setViewingInvoice(invoice);
    setOpenDetailDialog(true);
  };

  const handleOpenPaymentDialog = (invoice: SalesInvoice) => {
    setViewingInvoice(invoice);
    setPaymentAmount(invoice.remaining_amount);
    setOpenPaymentDialog(true);
  };

  const handleCloseDetailDialog = () => {
    setOpenDetailDialog(false);
    setViewingInvoice(null);
  };

  const handleClosePaymentDialog = () => {
    setOpenPaymentDialog(false);
    setViewingInvoice(null);
    setPaymentAmount(0);
  };

  const handleSubmitPayment = () => {
    if (viewingInvoice && paymentAmount > 0) {
      addPaymentMutation.mutate(
        { id: viewingInvoice.id, data: { amount: paymentAmount } },
        {
          onSuccess: () => {
            handleClosePaymentDialog();
          }
        }
      );
    }
  };

  const getInvoiceList = (): ExtendedSalesInvoice[] => {
    if (!invoicesData?.data?.items) return [];

    return invoicesData.data.items.map((invoice: SalesInvoice) => ({
      ...invoice,
      key: invoice.id.toString(),
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, any> = {
      draft: 'default',
      confirmed: 'info',
      paid: 'success',
      cancelled: 'error',
      refunded: 'warning',
    };
    return colorMap[status] || 'default';
  };

  const columns = [
    {
      title: 'Mã HĐ',
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
      title: 'SĐT',
      dataIndex: 'customer_phone',
      key: 'customer_phone',
      width: 120,
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
      title: 'Tổng tiền',
      dataIndex: 'final_amount',
      key: 'final_amount',
      width: 130,
      render: (value: unknown) => (
        <Typography variant="body2" color="success.main">
          {formatCurrency(Number(value))}
        </Typography>
      ),
    },
    {
      title: 'Đã trả',
      dataIndex: 'partial_payment_amount',
      key: 'partial_payment_amount',
      width: 130,
      render: (value: unknown) => (
        <Typography variant="body2" color="info.main">
          {formatCurrency(Number(value))}
        </Typography>
      ),
    },
    {
      title: 'Còn nợ',
      dataIndex: 'remaining_amount',
      key: 'remaining_amount',
      width: 130,
      render: (value: unknown) => {
        const amount = Number(value);
        return (
          <Typography variant="body2" color={amount > 0 ? 'error.main' : 'text.secondary'}>
            {formatCurrency(amount)}
          </Typography>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (value: unknown) => {
        const status = String(value);
        return (
          <Chip
            label={invoiceStatusLabels[status as keyof typeof invoiceStatusLabels] || status}
            color={getStatusColor(status)}
            size="small"
          />
        );
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
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
      width: 200,
      render: (_: unknown, record: ExtendedSalesInvoice) => (
        <Box display="flex" gap={1}>
          <Button
            size="small"
            variant="outlined"
            color="info"
            startIcon={<ViewIcon />}
            onClick={() => handleViewInvoice(record)}
          >
            Xem
          </Button>
          {record.remaining_amount > 0 && (
            <Button
              size="small"
              variant="outlined"
              color="success"
              startIcon={<PaymentIcon />}
              onClick={() => handleOpenPaymentDialog(record)}
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
          Quản lý Hóa đơn bán hàng
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/sales-invoices/create')}
        >
          Tạo hóa đơn mới
        </Button>
      </Box>

      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            placeholder="Tìm kiếm theo mã HĐ, tên khách hàng, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Trạng thái</InputLabel>
            <Select
              value={statusFilter}
              label="Trạng thái"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">Tất cả</MenuItem>
              <MenuItem value="draft">Nháp</MenuItem>
              <MenuItem value="confirmed">Đã xác nhận</MenuItem>
              <MenuItem value="paid">Đã thanh toán</MenuItem>
              <MenuItem value="cancelled">Đã hủy</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <DataTable
        columns={columns}
        data={getInvoiceList() as any}
        loading={isLoading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: invoicesData?.data?.total || 0,
          onChange: (page: number, size: number) => {
            setCurrentPage(page);
            setPageSize(size);
          },
          showSizeChanger: true,
          showTotal: (total: number, range: number[]) =>
            `${range[0]}-${range[1]} của ${total} hóa đơn`,
        }}
      />

      {/* Detail Dialog */}
      <Dialog open={openDetailDialog} onClose={handleCloseDetailDialog} maxWidth="md" fullWidth>
        <DialogTitle>Chi tiết hóa đơn: {viewingInvoice?.code}</DialogTitle>
        <DialogContent>
          {viewingInvoice && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Khách hàng
                      </Typography>
                      <Typography variant="h6">{viewingInvoice.customer_name}</Typography>
                      <Typography variant="body2">{viewingInvoice.customer_phone}</Typography>
                      {viewingInvoice.customer_address && (
                        <Typography variant="body2" color="text.secondary">
                          {viewingInvoice.customer_address}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Thông tin thanh toán
                      </Typography>
                      <Typography variant="body2">
                        Phương thức:{' '}
                        {
                          paymentMethodLabels[
                            viewingInvoice.payment_method as keyof typeof paymentMethodLabels
                          ]
                        }
                      </Typography>
                      <Typography variant="body2">
                        Tổng tiền: {formatCurrency(viewingInvoice.final_amount)}
                      </Typography>
                      <Typography variant="body2" color="success.main">
                        Đã trả: {formatCurrency(viewingInvoice.partial_payment_amount)}
                      </Typography>
                      <Typography variant="body2" color="error.main">
                        Còn nợ: {formatCurrency(viewingInvoice.remaining_amount)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {viewingInvoice.warning && (
                <Box mt={2}>
                  <Card sx={{ bgcolor: 'error.light' }}>
                    <CardContent>
                      <Typography variant="subtitle2" color="error.dark" fontWeight="bold">
                        ⚠️ Lưu ý quan trọng
                      </Typography>
                      <Typography variant="body2" color="error.dark">
                        {viewingInvoice.warning}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              )}

              {viewingInvoice.notes && (
                <Box mt={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Ghi chú
                  </Typography>
                  <Typography variant="body2">{viewingInvoice.notes}</Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" mb={2}>
                Danh sách sản phẩm
              </Typography>
              {viewingInvoice.items && viewingInvoice.items.length > 0 ? (
                <Box>
                  {viewingInvoice.items.map((item, index) => (
                    <Card key={index} sx={{ mb: 1 }}>
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Typography fontWeight="bold">{item.product_name}</Typography>
                          </Grid>
                          <Grid item xs={6} sm={2}>
                            <Typography variant="body2">SL: {item.quantity}</Typography>
                          </Grid>
                          <Grid item xs={6} sm={2}>
                            <Typography variant="body2">
                              Giá: {formatCurrency(item.unit_price)}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <Typography variant="body2" fontWeight="bold" color="success.main">
                              {formatCurrency(item.quantity * item.unit_price - item.discount_amount)}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary">Không có sản phẩm</Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailDialog}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={openPaymentDialog} onClose={handleClosePaymentDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Trả nợ hóa đơn: {viewingInvoice?.code}</DialogTitle>
        <DialogContent>
          {viewingInvoice && (
            <Box mt={2}>
              <Typography variant="body2" mb={2}>
                Số tiền còn nợ: <strong>{formatCurrency(viewingInvoice.remaining_amount)}</strong>
              </Typography>
              <TextField
                fullWidth
                label="Số tiền trả"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                inputProps={{
                  min: 0,
                  max: viewingInvoice.remaining_amount,
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentDialog}>Hủy</Button>
          <Button
            onClick={handleSubmitPayment}
            variant="contained"
            color="success"
            disabled={addPaymentMutation.isPending || paymentAmount <= 0}
          >
            {addPaymentMutation.isPending ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalesInvoicesList;
