import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Chip,
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
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Check as ApproveIcon,
  Close as RejectIcon,
} from '@mui/icons-material';
import DataTable from '@/components/common/data-table';
import { useNavigate } from 'react-router-dom';
import { SalesReturn } from '@/models/sales-return';
import { 
  useSalesReturnsQuery, 
  useUpdateSalesReturnStatusMutation 
} from '@/queries/sales-return';
import { returnStatusLabels, returnStatusColors, refundMethodLabels } from './form-config';

interface ExtendedSalesReturn extends SalesReturn {
  key: string;
  [key: string]: any;
}

const SalesReturnsList = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [viewingReturn, setViewingReturn] = useState<SalesReturn | null>(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const navigate = useNavigate();

  // Use hooks from queries
  const { data: returnsData, isLoading } = useSalesReturnsQuery({
    page: currentPage,
    limit: pageSize,
    status: statusFilter || undefined,
  });

  const updateStatusMutation = useUpdateSalesReturnStatusMutation();

  const handleViewReturn = (salesReturn: SalesReturn) => {
    setViewingReturn(salesReturn);
    setOpenDetailDialog(true);
  };

  const handleCloseDetailDialog = () => {
    setOpenDetailDialog(false);
    setViewingReturn(null);
  };

  const handleApprove = (id: number) => {
    if (window.confirm('Bạn có chắc muốn duyệt phiếu trả hàng này?')) {
      updateStatusMutation.mutate({ id, data: { status: 'approved' } });
    }
  };

  const handleReject = (id: number) => {
    if (window.confirm('Bạn có chắc muốn từ chối phiếu trả hàng này?')) {
      updateStatusMutation.mutate({ id, data: { status: 'rejected' } });
    }
  };

  const getReturnList = (): ExtendedSalesReturn[] => {
    if (!returnsData?.data?.items) return [];

    return returnsData.data.items.map((salesReturn: SalesReturn) => ({
      ...salesReturn,
      key: salesReturn.id.toString(),
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
      title: 'Mã phiếu trả',
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
      title: 'Hóa đơn gốc',
      dataIndex: 'invoice_code',
      key: 'invoice_code',
      width: 120,
      render: (value: unknown) => <Typography variant="body2">{String(value)}</Typography>,
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 180,
      render: (value: unknown) => <Typography variant="body2">{String(value)}</Typography>,
    },
    {
      title: 'Số tiền hoàn',
      dataIndex: 'total_refund_amount',
      key: 'total_refund_amount',
      width: 130,
      render: (value: unknown) => (
        <Typography variant="body2" color="error.main" fontWeight="bold">
          {formatCurrency(Number(value))}
        </Typography>
      ),
    },
    {
      title: 'Phương thức',
      dataIndex: 'refund_method',
      key: 'refund_method',
      width: 130,
      render: (value: unknown) => (
        <Chip
          label={refundMethodLabels[value as keyof typeof refundMethodLabels] || String(value)}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value: unknown) => {
        const status = String(value) as keyof typeof returnStatusLabels;
        return (
          <Chip
            label={returnStatusLabels[status] || String(value)}
            color={returnStatusColors[status] || 'default'}
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
      width: 250,
      render: (_: unknown, record: ExtendedSalesReturn) => (
        <Box display="flex" gap={1}>
          <Button
            size="small"
            variant="outlined"
            color="info"
            startIcon={<ViewIcon />}
            onClick={() => handleViewReturn(record)}
          >
            Xem
          </Button>
          {record.status === 'pending' && (
            <>
              <Button
                size="small"
                variant="outlined"
                color="success"
                startIcon={<ApproveIcon />}
                onClick={() => handleApprove(record.id)}
              >
                Duyệt
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<RejectIcon />}
                onClick={() => handleReject(record.id)}
              >
                Từ chối
              </Button>
            </>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Quản lý Trả hàng
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/sales-returns/create')}
        >
          Tạo phiếu trả hàng
        </Button>
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
              <MenuItem value="pending">Chờ duyệt</MenuItem>
              <MenuItem value="approved">Đã duyệt</MenuItem>
              <MenuItem value="rejected">Từ chối</MenuItem>
              <MenuItem value="completed">Hoàn tất</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <DataTable
        columns={columns}
        data={getReturnList() as any}
        loading={isLoading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: returnsData?.data?.total || 0,
          onChange: (page: number, size: number) => {
            setCurrentPage(page);
            setPageSize(size);
          },
          showSizeChanger: true,
          showTotal: (total: number, range: number[]) =>
            `${range[0]}-${range[1]} của ${total} phiếu trả`,
        }}
      />

      {/* Detail Dialog */}
      <Dialog open={openDetailDialog} onClose={handleCloseDetailDialog} maxWidth="md" fullWidth>
        <DialogTitle>Chi tiết phiếu trả: {viewingReturn?.code}</DialogTitle>
        <DialogContent>
          {viewingReturn && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Hóa đơn gốc
                      </Typography>
                      <Typography variant="h6">{viewingReturn.invoice_code}</Typography>
                      <Typography variant="subtitle2" color="text.secondary" mt={1}>
                        Khách hàng
                      </Typography>
                      <Typography variant="body1">{viewingReturn.customer_name}</Typography>
                      <Typography variant="body2">{viewingReturn.customer_phone}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Thông tin hoàn tiền
                      </Typography>
                      <Typography variant="h5" color="error.main" fontWeight="bold">
                        {formatCurrency(viewingReturn.total_refund_amount)}
                      </Typography>
                      <Typography variant="body2" mt={1}>
                        Phương thức:{' '}
                        {
                          refundMethodLabels[
                            viewingReturn.refund_method as keyof typeof refundMethodLabels
                          ]
                        }
                      </Typography>
                      <Typography variant="body2">
                        Trạng thái:{' '}
                        <Chip
                          label={
                            returnStatusLabels[
                              viewingReturn.status as keyof typeof returnStatusLabels
                            ]
                          }
                          color={
                            returnStatusColors[
                              viewingReturn.status as keyof typeof returnStatusColors
                            ]
                          }
                          size="small"
                        />
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {viewingReturn.reason && (
                <Box mt={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Lý do trả hàng
                  </Typography>
                  <Typography variant="body2">{viewingReturn.reason}</Typography>
                </Box>
              )}

              {viewingReturn.notes && (
                <Box mt={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Ghi chú
                  </Typography>
                  <Typography variant="body2">{viewingReturn.notes}</Typography>
                </Box>
              )}

              <Box mt={3}>
                <Typography variant="h6" mb={2}>
                  Danh sách sản phẩm trả
                </Typography>
                {viewingReturn.items && viewingReturn.items.length > 0 ? (
                  <Box>
                    {viewingReturn.items.map((item, index) => (
                      <Card key={index} sx={{ mb: 1 }}>
                        <CardContent>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Typography fontWeight="bold">{item.product_name}</Typography>
                              {item.reason && (
                                <Typography variant="caption" color="text.secondary">
                                  Lý do: {item.reason}
                                </Typography>
                              )}
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
                              <Typography variant="body2" fontWeight="bold" color="error.main">
                                {formatCurrency(item.refund_amount)}
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

export default SalesReturnsList;
