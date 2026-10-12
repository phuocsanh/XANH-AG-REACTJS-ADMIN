import { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Table, TableBody, TableCell, TableHead, TableRow, Chip, Alert, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import {
  ReceiptOutlined,
  AttachMoneyOutlined,
  Inventory2Outlined,
  PaymentOutlined,
  TrendingUpOutlined,
  LocalOfferOutlined,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useDashboardStats, useDashboardRevenue, useTopProducts, useTopCustomers, useTopEmployees } from '@/queries/dashboard';
import { useSeasonsQuery } from '@/queries/season';

const StatCard = ({ title, value, icon, color, subtitle }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}) => (
  <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography color="text.secondary" variant="body2" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="bold" sx={{ my: 1 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(135deg, ${color}22 0%, ${color}44 100%)`,
            color: color,
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);
};

export const SalesDashboard = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [selectedSeasonId, setSelectedSeasonId] = useState<number | ''>('');
  const { data: seasonsData, isLoading: seasonsLoading } = useSeasonsQuery({ page: 1, limit: 50 });

  const isSeasonView = Boolean(selectedSeasonId);
  const periodLabel = isSeasonView ? 'theo mùa vụ' : `tháng ${month}/${year}`;

  const dashboardParams = isSeasonView
    ? { season_id: selectedSeasonId as number }
    : { period: 'month', year, month };

  const { data: statsData } = useDashboardStats(dashboardParams as any);
  const { data: revenueData } = useDashboardRevenue(dashboardParams as any);
  const { data: topProductsData, isLoading: topProductsLoading } = useTopProducts(dashboardParams as any);
  const { data: topCustomersData, isLoading: topCustomersLoading } = useTopCustomers(dashboardParams as any);
  const { data: topEmployeesData, isLoading: topEmployeesLoading } = useTopEmployees(dashboardParams as any);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const revenueChartData = revenueData?.monthly.map((item) => ({
    month: item.month,
    revenue: item.revenue,
    profit: item.profit,
  })) || [];

  const profitMargin = statsData?.stats.totalRevenue ?
    ((statsData.stats.totalProfit / statsData.stats.totalRevenue) * 100) : 0;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Dashboard Doanh Số Bán Hàng
      </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Tháng {month}/{year}
      </Typography>

      <FormControl size="small" sx={{ mb: 3, minWidth: 200 }}>
        <InputLabel id="season-select-label">Chọn mùa vụ</InputLabel>
        <Select
          labelId="season-select-label"
          value={selectedSeasonId}
          label="Chọn mùa vụ"
          onChange={(e) => setSelectedSeasonId(e.target.value === '' ? '' : Number(e.target.value))}
          disabled={seasonsLoading}
        >
          <MenuItem value="">Tất cả tháng</MenuItem>
          {seasonsData?.data?.items?.map((season) => (
            <MenuItem key={season.id} value={season.id}>
              {season.name} ({season.year})
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={`Doanh thu ${periodLabel}`}
            value={formatCurrency(statsData?.stats.totalRevenue || 0)}
            icon={<AttachMoneyOutlined sx={{ fontSize: 32 }} />}
            color="#4caf50"
            subtitle="Tổng doanh thu"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={`Lợi nhuận ${periodLabel}`}
            value={formatCurrency(statsData?.stats.totalProfit || 0)}
            icon={<TrendingUpOutlined sx={{ fontSize: 32 }} />}
            color="#009688"
            subtitle={`${profitMargin.toFixed(1)}% lợi nhuận gộp`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={`Chi phí COGS ${periodLabel}`}
            value={formatCurrency(statsData?.stats.totalCost || 0)}
            icon={<PaymentOutlined sx={{ fontSize: 32 }} />}
            color="#2196f3"
            subtitle="Giá vốn hàng bán"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={`Giảm giá ${periodLabel}`}
            value={formatCurrency(statsData?.stats.totalDiscount || 0)}
            icon={<LocalOfferOutlined sx={{ fontSize: 32 }} />}
            color="#e91e63"
            subtitle="Tổng chiết khấu"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                📈 Doanh Thu & Lợi Nhuận
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="colorRevenueSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2196f3" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#2196f3" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(2)} triệu`, 'Giá trị']}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2196f3"
                    fillOpacity={1}
                    fill="url(#colorRevenueSales)"
                    name="Doanh thu"
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="#009688"
                    fill="url(#colorRevenueSales)"
                    name="Lợi nhuận"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                💰 Công Nợ Phải Thu
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box textAlign="center" sx={{ p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Đã thanh toán
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" color="success.main">
                        {formatCurrency(statsData?.stats.debt.totalPaid || 0)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center" sx={{ p: 2, bgcolor: 'error.50', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Còn nợ
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" color="error.main">
                        {formatCurrency(statsData?.stats.debt.totalRemaining || 0)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center" sx={{ p: 2, bgcolor: 'warning.50', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Quá hạn
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" color="warning.main">
                        {statsData?.stats.debt.overdueCount || 0} phiếu
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center" sx={{ p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Đang nợ
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" color="info.main">
                        {statsData?.stats.debt.activeCount || 0} phiếu
                      </Typography>
                    </Box>
      </Grid>
    </Grid>

    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                🏆 Top 10 Nhân Viên Bán Hàng
              </Typography>
              <Chip label="Lợi nhuận" size="small" color="primary" />
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>STT</TableCell>
                  <TableCell>Nhân viên</TableCell>
                  <TableCell align="right">Doanh thu</TableCell>
                  <TableCell align="right">Lợi nhuận</TableCell>
                  <TableCell align="right">Đơn</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topEmployeesLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : (
                  topEmployeesData?.items?.map((item: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                        {item.fullName || item.account || '-'}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(item.totalAmount || 0)}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(item.totalProfit || 0)}
                      </TableCell>
                      <TableCell align="right">{item.invoiceCount || 0}</TableCell>
                    </TableRow>
                  )) || []
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  🏆 Top 10 Sản Phẩm Bán Chạm
                </Typography>
                <Chip label="Doanh thu" size="small" color="primary" />
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>STT</TableCell>
                    <TableCell>Sản phẩm</TableCell>
                    <TableCell align="right">Doanh thu</TableCell>
                    <TableCell align="right">Số lượng</TableCell>
                    <TableCell align="right">Đơn</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topProductsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        Đang tải...
                      </TableCell>
                    </TableRow>
                  ) : (
                    topProductsData?.items?.map((item: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>
                          {item.name || item.code || '-'}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(item.totalAmount || 0)}
                        </TableCell>
                        <TableCell align="right">{item.totalQuantity || 0}</TableCell>
                        <TableCell align="right">{item.invoiceCount || 0}</TableCell>
                      </TableRow>
                    )) || []
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  🏆 Top 10 Khách Hàng
                </Typography>
                <Chip label="Doanh thu" size="small" color="primary" />
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>STT</TableCell>
                    <TableCell>Khách hàng</TableCell>
                    <TableCell align="right">Doanh thu</TableCell>
                    <TableCell align="right">Đơn</TableCell>
                    <TableCell align="right">Công nợ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topCustomersLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        Đang tải...
                      </TableCell>
                    </TableRow>
                  ) : (
                    topCustomersData?.items?.map((item: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>
                          {item.customerName || `KH ${item.customerId}`}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(item.totalAmount || 0)}
                        </TableCell>
                        <TableCell align="right">{item.invoiceCount || 0}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={item.remainingDebt > 0 ? formatCurrency(item.remainingDebt || 0) : 'Đã trả'}
                            size="small"
                            color={item.remainingDebt > 0 ? 'warning' : 'success'}
                          />
                        </TableCell>
                      </TableRow>
                    )) || []
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SalesDashboard;
