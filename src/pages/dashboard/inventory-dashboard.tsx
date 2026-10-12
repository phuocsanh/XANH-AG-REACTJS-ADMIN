import { useEffect } from 'react';
import { Box, Grid, Card, CardContent, Typography, Table, TableBody, TableCell, TableHead, TableRow, Chip, Alert } from '@mui/material';
import {
  Inventory2Outlined,
  WarningAmberOutlined,
  PaymentOutlined,
  LocalOfferOutlined,
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useDashboardStats, useDashboardInventory } from '@/queries/dashboard';

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

export const InventoryDashboard = () => {
  const { data: statsData } = useDashboardStats({ period: 'month' });
  const { data: inventoryData, isLoading: inventoryLoading } = useDashboardInventory({ limit: 10 });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const inventoryChartData = [
    { name: 'Còn lại', value: (statsData?.stats.inventory.totalValue || 0) / 1000000, color: '#2196f3' },
    { name: 'Sắp hết hạn', value: (statsData?.stats.inventory.expiringValue || 0) > 0 ? (statsData?.stats.inventory.expiringValue || 0) / 1000000 : 0.01, color: '#ff9800' },
    { name: 'Hết hạn', value: (statsData?.stats.inventory.expiringValue || 0) / 1000000, color: '#f44336' },
  ].filter(item => item.value > 0);

  const lowStockProducts = inventoryData?.lowStock.products || [];
  const expiringBatches = lowStockProducts.slice(0, 10);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Dashboard Tồn Kho
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Tổng quan tình trạng tồn kho và cảnh báo
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tổng giá trị tồn kho"
            value={formatCurrency(statsData?.stats.inventory.totalValue || 0)}
            icon={<Inventory2Outlined sx={{ fontSize: 32 }} />}
            color="#2196f3"
            subtitle={`${statsData?.stats.inventory.totalBatches || 0} lô hàng`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Sản phẩm thấp tồn"
            value={statsData?.stats.inventory.lowStockCount || 0}
            icon={<PaymentOutlined sx={{ fontSize: 32 }} />}
            color="#ff9800"
            subtitle="Cần nhập thêm"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Sắp hết hạn"
            value={statsData?.stats.inventory.expiringCount || 0}
            icon={<WarningAmberOutlined sx={{ fontSize: 32 }} />}
            color="#f44336"
            subtitle={formatCurrency(statsData?.stats.inventory.expiringValue || 0)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Giá trị sắp hết hạn"
            value={formatCurrency(statsData?.stats.inventory.expiringValue || 0)}
            icon={<LocalOfferOutlined sx={{ fontSize: 32 }} />}
            color="#e91e63"
            subtitle="30 ngày tới"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                📦 Tỷ Lệ Tồn Kho
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={inventoryChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value.toFixed(1)}M`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {inventoryChartData.map((entry, index) => (
                      <Cell key={`inv-pie-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toFixed(2)} triệu`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Cảnh Báo Hết Hạn
              </Typography>
              <Box sx={{ mt: 2 }}>
                {expiringBatches.length === 0 ? (
                  <Alert severity="success">
                    Không có sản phẩm nào sắp hết hạn trong 30 ngày tới
                  </Alert>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Mã SP</TableCell>
                        <TableCell>Tên sản phẩm</TableCell>
                        <TableCell align="right">Tồn kho</TableCell>
                        <TableCell align="right">Giá trị</TableCell>
                        <TableCell>Hạn dùng</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {expiringBatches.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>{product.code}</TableCell>
                          <TableCell>{product.name}</TableCell>
                          <TableCell align="right">{product.quantity}</TableCell>
                          <TableCell align="right">
                            {formatCurrency(product.price)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label="Sắp hết"
                              size="small"
                              color="warning"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            ⚠️ Danh Sách Sản Phẩm Thấp Tồn
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Mã SP</TableCell>
                <TableCell>Tên sản phẩm</TableCell>
                <TableCell align="right">Tồn kho</TableCell>
                <TableCell align="right">Giá bán</TableCell>
                <TableCell align="right">Giá trị</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inventoryLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : (
                lowStockProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.code}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={product.quantity}
                        size="small"
                        color={product.quantity === 0 ? 'error' : 'warning'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(product.price)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(product.price * product.quantity)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
};

export default InventoryDashboard;
