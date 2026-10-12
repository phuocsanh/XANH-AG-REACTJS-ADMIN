import { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Alert, Table, TableBody, TableCell, TableHead, TableRow, Chip, TextField, MenuItem } from '@mui/material';
import {
  ReceiptOutlined,
  AttachMoneyOutlined,
  Inventory2Outlined,
  PaymentOutlined,
  LocalOfferOutlined,
  TrendingUpOutlined,
  AccountBalanceOutlined,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
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
import { useDashboardStats, useDashboardRevenue, useDashboardReceivables, useTopProducts, useTopCustomers } from '@/queries/dashboard';
import { useSeasonsQuery } from '@/queries/season';
import { useDashboardWidgetStore, WIDGET_LABELS, roleCanView } from '@/stores/dashboard-widget.store';
import { useAppStore } from '@/stores';
import { DraggableWidget, DragHandle } from '@/components/dashboard/draggable-widget';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControlLabel, Checkbox } from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { useWarningQuery as useRiceBlastWarningQuery, useLocationQuery } from '@/queries/rice-blast';
import { useBacterialBlightWarningQuery } from '@/queries/bacterial-blight';
import { useStemBorerWarningQuery } from '@/queries/stem-borer';
import { useGallMidgeWarningQuery } from '@/queries/gall-midge';
import { useBrownPlantHopperWarningQuery } from '@/queries/brown-plant-hopper';
import { useSheathBlightWarningQuery } from '@/queries/sheath-blight';
import { useGrainDiscolorationWarningQuery } from '@/queries/grain-discoloration';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const StatCard = ({ title, value, icon, color, subtitle }: StatCardProps) => (
  <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography color="text.secondary" variant="body2" gutterBottom>
            {title}
          </Typography>
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{
              my: 1,
              fontSize: { xs: '1.55rem', sm: '2.125rem' },
              lineHeight: 1.15,
              overflowWrap: 'anywhere',
            }}
          >
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
            width: { xs: 48, sm: 60 },
            height: { xs: 48, sm: 60 },
            flex: '0 0 auto',
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

export const Dashboard = () => {
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | ''>('');
  const isSeasonView = Boolean(selectedSeasonId);
  const dashboardParams = isSeasonView
    ? { season_id: selectedSeasonId as number }
    : { period: 'all' };
  const periodLabel = isSeasonView ? 'theo mùa vụ' : 'tổng';
  const { data: seasonsData, isLoading: seasonsLoading } = useSeasonsQuery({
    page: 1,
    limit: 100,
  });

  const { data: statsData } = useDashboardStats(dashboardParams);

  const { data: revenueData } = useDashboardRevenue(dashboardParams);

  const { data: receivablesData, isLoading: receivablesLoading } = useDashboardReceivables({
    limit: 5,
    ...(selectedSeasonId ? { season_id: selectedSeasonId } : {}),
  });

  useTopProducts({
    ...dashboardParams,
    limit: 5,
  });

  const { data: topCustomersData, isLoading: topCustomersLoading } = useTopCustomers({
    ...dashboardParams,
    limit: 5,
  });

  const { data: diseaseLocation } = useLocationQuery();
  const { data: riceBlastWarning } = useRiceBlastWarningQuery();
  const { data: bacterialBlightWarning } = useBacterialBlightWarningQuery();
  const { data: stemBorerWarning } = useStemBorerWarningQuery();
  const { data: gallMidgeWarning } = useGallMidgeWarningQuery();
  const { data: brownPlantHopperWarning } = useBrownPlantHopperWarningQuery();
  const { data: sheathBlightWarning } = useSheathBlightWarningQuery();
  const { data: grainDiscolorationWarning } = useGrainDiscolorationWarningQuery();

  const { widgets, toggleWidget, resetWidgets, setUserRole } = useDashboardWidgetStore();
  const userInfo = useAppStore((state) => state.userInfo);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setUserRole(userInfo?.role?.code);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const formatShortCurrency = (value: number) => {
    return `${new Intl.NumberFormat('vi-VN', {
      maximumFractionDigits: 1,
    }).format(value / 1000000)}tr`;
  };

  const formatPercent = (value: number) => {
    return `${new Intl.NumberFormat('vi-VN', {
      maximumFractionDigits: 2,
    }).format(value)}%`;
  };

  const stats = statsData?.stats;
  const giftCosts = stats?.giftCosts;
  const loans = stats?.loans;
  const giftBreakdown = `HĐ ${formatShortCurrency(giftCosts?.invoiceGiftValue || 0)} | Tích lũy/tri ân ${formatShortCurrency(giftCosts?.accumulatedGiftCost || 0)} | Campaign ${formatShortCurrency(giftCosts?.campaignGiftCost || 0)}`;

  const revenueChartData = revenueData?.monthly.map((item) => ({
    month: item.month,
    revenue: item.revenue,
    count: item.count,
  })) || [];

  const debtChartData = (() => {
    const paidAmount = (statsData?.stats.debt.totalPaid || 0) / 1000000;
    const remainingAmount = (statsData?.stats.debt.totalRemaining || 0) / 1000000;
    return [
      { name: 'Đã thu', value: paidAmount > 0 ? paidAmount : 0.01, color: '#4caf50' },
      { name: 'Còn nợ', value: remainingAmount > 0 ? remainingAmount : 0.01, color: '#f44336' },
    ];
  })();

  const inventoryChartData = (() => {
    const expiring = (statsData?.stats.inventory.expiringValue || 0) / 1000000;
    const total = (statsData?.stats.inventory.totalValue || 0) / 1000000;
    const available = total - expiring;
    return [
      { name: 'Còn lại', value: Math.max(available, 0.01), color: '#2196f3' },
      { name: 'Sắp hết hạn', value: expiring > 0 ? expiring : 0.01, color: '#ff9800' },
    ];
  })();

  const warnings = [
    { name: 'Bệnh Đạo Ôn', data: riceBlastWarning },
    { name: 'Bệnh Cháy Bìa Lá', data: bacterialBlightWarning },
    { name: 'Sâu Đục Thân', data: stemBorerWarning },
    { name: 'Muỗi Hành', data: gallMidgeWarning },
    { name: 'Rầy Nâu', data: brownPlantHopperWarning },
    { name: 'Bệnh Khô Vằn', data: sheathBlightWarning },
    { name: 'Bệnh Lem Lép Hạt', data: grainDiscolorationWarning },
  ].filter((w) => w.data && (w.data.risk_level === 'CAO' || w.data.risk_level === 'TRUNG_BINH'));

  return (
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: '100%', overflowX: 'hidden' }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', md: 'center' }}
          flexDirection={{ xs: 'column', md: 'row' }}
          gap={2}
          mb={3}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' }, lineHeight: 1.15 }}
            >
              Tổng Quan Hệ Thống
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Chào mừng bạn đến với hệ thống quản lý Xanh AG
            </Typography>
          </Box>
          <Box
            display="flex"
            alignItems={{ xs: 'stretch', sm: 'center' }}
            flexDirection={{ xs: 'column', sm: 'row' }}
            gap={1.5}
            sx={{ width: { xs: '100%', md: 'auto' } }}
          >
            <TextField
              select
              size="small"
              label="Mùa vụ"
              value={selectedSeasonId}
              onChange={(event) => {
                const value = event.target.value;
                setSelectedSeasonId(value === '' ? '' : Number(value));
              }}
              sx={{ minWidth: { xs: 0, sm: 220 }, width: { xs: '100%', sm: 'auto' } }}
              disabled={seasonsLoading}
            >
              <MenuItem value="">Tất cả mùa vụ</MenuItem>
              {seasonsData?.data?.items?.map((season) => (
                <MenuItem key={season.id} value={season.id}>
                  {season.name} ({season.year})
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => setSettingsOpen(true)}
              size="small"
              sx={{ width: { xs: '100%', sm: 'auto' }, whiteSpace: 'nowrap' }}
            >
              Tùy chỉnh widget
            </Button>
          </Box>
        </Box>

        <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Tùy chỉnh Dashboard</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {Object.values(widgets).map((w) => {
                const roleDisabled = !roleCanView(w.requiredRole, useDashboardWidgetStore.getState().userRole);
                return (
                  <FormControlLabel
                    key={w.id}
                    control={
                      <Checkbox
                        checked={w.visible}
                        onChange={() => toggleWidget(w.id)}
                        color="primary"
                        disabled={roleDisabled}
                      />
                    }
                    label={w.label}
                    sx={{ opacity: roleDisabled ? 0.5 : 1 }}
                  />
                );
              })}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={resetWidgets} color="inherit">
              Đặt lại
            </Button>
            <Button onClick={() => setSettingsOpen(false)} color="primary" variant="contained">
              Áp dụng
            </Button>
          </DialogActions>
        </Dialog>

      {widgets['stat-main'].visible && (
        <DraggableWidget id="stat-main" dragLabel="Thẻ thống kê chính">
        <>
      {/* Thẻ thống kê chính */}
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
            title={`Đơn hàng ${periodLabel}`}
            value={statsData?.stats.totalOrders || 0}
            icon={<ReceiptOutlined sx={{ fontSize: 32 }} />}
            color="#2196f3"
            subtitle="Số hóa đơn"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Công nợ phải thu"
            value={formatCurrency(statsData?.stats.debt.totalRemaining || 0)}
            icon={<PaymentOutlined sx={{ fontSize: 32 }} />}
            color="#ff9800"
            subtitle={`${statsData?.stats.debt.overdueCount || 0} quá hạn`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tồn kho"
            value={formatCurrency(statsData?.stats.inventory.totalValue || 0)}
            icon={<Inventory2Outlined sx={{ fontSize: 32 }} />}
            color="#9c27b0"
            subtitle={`${statsData?.stats.inventory.lowStockCount || 0} thấp tồn`}
          />
        </Grid>
      </Grid>
      </>
      </DraggableWidget>
      )}

      {widgets['stat-secondary'].visible && (
        <DraggableWidget id="stat-secondary" dragLabel="Thẻ thống kê phụ">
        <>
      {/* Thẻ thống kê phụ */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={`Lợi nhuận ròng ${periodLabel}`}
            value={formatCurrency(stats?.netProfit || 0)}
            icon={<TrendingUpOutlined sx={{ fontSize: 32 }} />}
            color="#009688"
            subtitle={`Gộp ${formatCurrency(stats?.grossProfit || 0)}`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tỷ suất lợi nhuận"
            value={formatPercent(stats?.netProfitMargin || 0)}
            icon={<TrendingUpOutlined sx={{ fontSize: 32 }} />}
            color="#e91e63"
            subtitle={`Biên gộp ${formatPercent(stats?.grossProfitMargin || 0)}`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Chi phí vận hành"
            value={formatCurrency(stats?.operatingCost || 0)}
            icon={<PaymentOutlined sx={{ fontSize: 32 }} />}
            color="#ff5722"
            subtitle="Chi phí phát sinh"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Chi phí quà tặng"
            value={formatCurrency(stats?.totalGiftCost || 0)}
            icon={<LocalOfferOutlined sx={{ fontSize: 32 }} />}
            color="#9c27b0"
            subtitle={giftBreakdown}
          />
        </Grid>
      </Grid>
      </>
      </DraggableWidget>
      )}

      {widgets['stat-loans']?.visible && (
        <DraggableWidget id="stat-loans" dragLabel="Thống kê khoản vay">
        <>
      {/* Thống kê khoản vay */}
      <Box sx={{ mb: 1 }}>
        <Typography variant="h6" fontWeight="bold">
          Khoản vay <DragHandle />
        </Typography>
      </Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Vốn đang cho vay"
            value={formatCurrency(loans?.activePrincipal || 0)}
            icon={<AccountBalanceOutlined sx={{ fontSize: 32 }} />}
            color="#3f51b5"
            subtitle={`${loans?.activeCount || 0} khoản đang vay`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Lãi vay tạm tính"
            value={formatCurrency(loans?.estimatedInterest || 0)}
            icon={<TrendingUpOutlined sx={{ fontSize: 32 }} />}
            color="#00acc1"
            subtitle="Tính đến hôm nay"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Phải thu khoản vay"
            value={formatCurrency(loans?.activeReceivable || 0)}
            icon={<PaymentOutlined sx={{ fontSize: 32 }} />}
            color="#795548"
            subtitle="Gốc + lãi tạm tính"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Lãi đã tất toán"
            value={formatCurrency(loans?.realizedInterest || 0)}
            icon={<AttachMoneyOutlined sx={{ fontSize: 32 }} />}
            color="#607d8b"
            subtitle={`${loans?.paidCount || 0} khoản đã trả`}
          />
        </Grid>
      </Grid>
      </>
      </DraggableWidget>
      )}

      {widgets['revenue-chart'].visible && (
        <DraggableWidget id="revenue-chart" dragLabel="Biểu đồ doanh thu & công nợ">
        <>
      {/* Biểu đồ doanh thu + công nợ */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                flexDirection={{ xs: 'column', sm: 'row' }}
                gap={1}
                mb={2}
              >
                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                  📈 {isSeasonView ? 'Doanh Thu Theo Mùa Vụ' : 'Doanh Thu Tổng'} <DragHandle />
                </Typography>
                {revenueData?.growth.yoy !== undefined && (
                  <Typography
                    variant="body2"
                    color={revenueData.growth.yoy >= 0 ? 'success.main' : 'error.main'}
                  >
                    YoY: {revenueData.growth.yoy >= 0 ? '+' : ''}{revenueData.growth.yoy}%
                  </Typography>
                )}
              </Box>
              <Box sx={{ width: '100%', overflowX: 'auto' }}>
                <Box sx={{ minWidth: { xs: 520, sm: '100%' }, height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData} margin={{ top: 8, right: 16, left: -10, bottom: 8 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2196f3" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#2196f3" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(2)} triệu`, 'Doanh thu']}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2196f3"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    name="Doanh thu (triệu đồng)"
                  />
                </AreaChart>
              </ResponsiveContainer>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                💰 Tình Hình Công Nợ <DragHandle />
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={debtChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value.toFixed(1)}M`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {debtChartData.map((entry, index) => (
                      <Cell key={`debt-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toFixed(2)} triệu`} />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Grid container spacing={1} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="body2" color="text.secondary">Quá hạn</Typography>
                      <Typography variant="h6" color="error.main" fontWeight="bold">
                        {statsData?.stats.debt.overdueCount || 0}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="body2" color="text.secondary">Đang nợ</Typography>
                      <Typography variant="h6" color="warning.main" fontWeight="bold">
                        {statsData?.stats.debt.activeCount || 0}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      </>
      </DraggableWidget>
      )}

      {widgets['inventory-chart'].visible && (
      <DraggableWidget id="inventory-chart" dragLabel="Biểu đồ tồn kho">
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                flexDirection={{ xs: 'column', sm: 'row' }}
                gap={1.5}
                mb={2}
              >
                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                  📦 Tồn Kho & Hết Hạn <DragHandle />
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  <Chip
                    label={`${statsData?.stats.inventory.lowStockCount || 0} thấp tồn`}
                    size="small"
                    color="warning"
                  />
                  <Chip
                    label={`${statsData?.stats.inventory.expiringCount || 0} sắp hết hạn`}
                    size="small"
                    color="error"
                  />
                </Box>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Tổng giá trị
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" sx={{ overflowWrap: 'anywhere' }}>
                      {formatCurrency(statsData?.stats.inventory.totalValue || 0)}
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Sắp hết hạn
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="warning.main">
                      {formatCurrency(statsData?.stats.inventory.expiringValue || 0)}
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
              <Box mt={2} sx={{ width: '100%', overflowX: 'auto' }}>
                <Box sx={{ minWidth: { xs: 420, sm: '100%' }, height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inventoryChartData} margin={{ top: 8, right: 12, left: -8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`${value.toFixed(1)}M`, 'Giá trị']} />
                    <Bar dataKey="value" name="Tồn kho (triệu đồng)">
                      {inventoryChartData.map((_, i) => (
                        <Cell key={`inv-cell-${i}`} fill={inventoryChartData[i].color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      </DraggableWidget>
      )}

      {widgets['top-customers'].visible && (
      <DraggableWidget id="top-customers" dragLabel="Top khách hàng">
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                flexDirection={{ xs: 'column', sm: 'row' }}
                gap={1}
                mb={2}
              >
                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                  🏆 Top 5 Khách Hàng Tiêu Thụ <DragHandle />
                </Typography>
                <Chip
                  label={topCustomersData?.type || 'top-customers'}
                  size="small"
                  color="info"
                />
              </Box>
              <Box sx={{ width: '100%', overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 520 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Khách hàng</TableCell>
                    <TableCell align="right">Doanh thu</TableCell>
                    <TableCell align="right">Đơn</TableCell>
                    <TableCell align="right">Công nợ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topCustomersLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                        Đang tải...
                      </TableCell>
                    </TableRow>
                  ) : (
                    topCustomersData?.items?.map((item: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell>
                          {item.customerName || `KH ${item.customerId}`}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(item.totalAmount || 0)}
                        </TableCell>
                        <TableCell align="right">{item.invoiceCount || 0}</TableCell>
                        <TableCell align="right" color={item.remainingDebt > 0 ? 'error' : 'success'}>
                          {formatCurrency(item.remainingDebt || 0)}
                        </TableCell>
                      </TableRow>
                    )) || []
                  )}
                </TableBody>
              </Table>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      </DraggableWidget>
      )}

      {widgets['receivables-aging'].visible && (
      <DraggableWidget id="receivables-aging" dragLabel="Công nợ theo thời gian">
      <>
      {/* Công nợ phải thu chi tiết */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            flexDirection={{ xs: 'column', sm: 'row' }}
            gap={1}
            mb={2}
          >
              <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                📊 Công Nợ Phải Thu - Phân Bổ Theo Thời Gian <DragHandle />
              </Typography>
            <Chip
              label={receivablesData?.totalAmount !== undefined ? formatCurrency(receivablesData.totalAmount) : '-'}
              size="small"
              color="primary"
            />
          </Box>
          {receivablesLoading ? (
            <Typography sx={{ py: 3 }}>Đang tải...</Typography>
          ) : (
            <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 520 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Khoảng thời gian</TableCell>
                  <TableCell align="right">Số phiếu</TableCell>
                  <TableCell align="right">Số tiền</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  { label: `Chưa quá hạn`, bucket: { count: receivablesData?.activeCount || 0, amount: receivablesData?.activeAmount || 0 }, status: 'active' },
                  { label: '0-7 ngày', bucket: receivablesData?.aging['0_7_days'] },
                  { label: '8-30 ngày', bucket: receivablesData?.aging['8_30_days'] },
                  { label: '31-90 ngày', bucket: receivablesData?.aging['31_90_days'] },
                  { label: '90+ ngày', bucket: receivablesData?.aging['90_plus'] },
                ].map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      {row.status === 'active' && <Chip label={`Dưới ${receivablesData?.overdueAfterMonths || 4} tháng`} size="small" color="success" sx={{ mr: 1 }} />}
                      {idx === 1 && <Chip label="Quá hạn" size="small" color="error" sx={{ mr: 1 }} />}
                      {idx >= 3 && <Chip label="Nguy hiểm" size="small" color="error" sx={{ mr: 1 }} />}
                      {row.label}
                    </TableCell>
                    <TableCell align="right">{row.bucket?.count || 0}</TableCell>
                    <TableCell align="right">
                      {formatCurrency(row.bucket?.amount || 0)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell><strong>Tổng cộng</strong></TableCell>
                  <TableCell align="right"><strong>{(receivablesData?.activeCount || 0) + (receivablesData?.overdueCount || 0)}</strong></TableCell>
                  <TableCell align="right"><strong>{formatCurrency(receivablesData?.totalAmount || 0)}</strong></TableCell>
                </TableRow>
              </TableBody>
            </Table>
            </Box>
          )}
        </CardContent>
      </Card>
      </>
      </DraggableWidget>
      )}

      {widgets['disease-warnings'].visible && (
      <DraggableWidget id="disease-warnings" dragLabel="Cảnh báo bệnh hại">
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            ⚠️ Cảnh Báo Bệnh/Sâu Hại Hiện Tại <DragHandle />
            {diseaseLocation && (
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                (Tại {diseaseLocation.name})
              </Typography>
            )}
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {warnings.map((warning, index) => {
              const riskColor =
                warning.data!.risk_level === 'CAO' ? 'error' :
                warning.data!.risk_level === 'TRUNG_BINH' ? 'warning' : 'success';

              return (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Alert
                    severity={riskColor}
                    sx={{
                      '& .MuiAlert-message': { width: '100%' },
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight="bold">
                      {warning.name}
                    </Typography>
                    <Typography variant="caption">
                      Mức độ: {warning.data!.risk_level}
                    </Typography>
                  </Alert>
                </Grid>
              );
            })}
          </Grid>
          {warnings.length === 0 && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Hiện tại không có cảnh báo bệnh hại nào ở mức CAO hoặc TRUNG BÌNH
            </Alert>
          )}
        </CardContent>
      </Card>
      </DraggableWidget>
      )}
    </Box>
  );
};

export default Dashboard;
