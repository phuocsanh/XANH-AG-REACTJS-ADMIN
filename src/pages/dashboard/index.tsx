import { useEffect, useMemo } from 'react';
import { Box, Grid, Card, CardContent, Typography, Paper, Alert } from '@mui/material';
import { 
  ReceiptOutlined, 
  AttachMoneyOutlined, 
  WarningAmberOutlined,
  PeopleOutlineOutlined 
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
  Cell
} from 'recharts';
import { useSalesInvoicesQuery } from '@/queries/sales-invoice';
import { useCustomersQuery } from '@/queries/customer';
import { useWarningQuery as useRiceBlastWarningQuery, useLocationQuery } from '@/queries/rice-blast';
import { useBacterialBlightWarningQuery } from '@/queries/bacterial-blight';
import { useStemBorerWarningQuery } from '@/queries/stem-borer';
import { useGallMidgeWarningQuery } from '@/queries/gall-midge';
import { useBrownPlantHopperWarningQuery } from '@/queries/brown-plant-hopper';
import { useSheathBlightWarningQuery } from '@/queries/sheath-blight';
import { useGrainDiscolorationWarningQuery } from '@/queries/grain-discoloration';

// Component thẻ thống kê
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const StatCard = ({ title, value, icon, color, subtitle }: StatCardProps) => (
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

export const Dashboard = () => {
  // Queries
  const { data: invoicesData } = useSalesInvoicesQuery({ limit: 100 });
  const { data: customersData } = useCustomersQuery({ limit: 100 });
  
  // Disease Warning Queries
  const { data: diseaseLocation } = useLocationQuery();
  const { data: riceBlastWarning } = useRiceBlastWarningQuery();
  const { data: bacterialBlightWarning } = useBacterialBlightWarningQuery();
  const { data: stemBorerWarning } = useStemBorerWarningQuery();
  const { data: gallMidgeWarning } = useGallMidgeWarningQuery();
  const { data: brownPlantHopperWarning } = useBrownPlantHopperWarningQuery();
  const { data: sheathBlightWarning } = useSheathBlightWarningQuery();
  const { data: grainDiscolorationWarning } = useGrainDiscolorationWarningQuery();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Tính toán thống kê
  const stats = useMemo(() => {
    const invoices = invoicesData?.data?.items || [];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Hóa đơn tháng này
    const monthInvoices = invoices.filter((inv: any) => {
      const invDate = new Date(inv.sale_date || inv.created_at);
      return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
    });

    // Tổng doanh thu tháng này
    const monthRevenue = monthInvoices.reduce((sum: number, inv: any) => sum + (inv.final_amount || 0), 0);

    // Tổng công nợ
    const totalDebt = invoices.reduce((sum: number, inv: any) => sum + (inv.remaining_amount || 0), 0);

    // Đếm cảnh báo bệnh hại mức CAO và TRUNG BÌNH
    const warnings = [
      riceBlastWarning,
      bacterialBlightWarning,
      stemBorerWarning,
      gallMidgeWarning,
      brownPlantHopperWarning,
      sheathBlightWarning,
      grainDiscolorationWarning
    ].filter(w => w && (w.risk_level === 'CAO' || w.risk_level === 'TRUNG_BINH'));

    // Khách hàng mới tháng này
    const customers = customersData?.data?.items || [];
    const newCustomers = customers.filter((cust: any) => {
      const custDate = new Date(cust.created_at);
      return custDate.getMonth() === currentMonth && custDate.getFullYear() === currentYear;
    });

    return {
      monthInvoices: monthInvoices.length,
      monthRevenue,
      totalDebt,
      warningCount: warnings.length,
      newCustomers: newCustomers.length,
      totalCustomers: customers.length
    };
  }, [invoicesData, customersData, riceBlastWarning, bacterialBlightWarning, stemBorerWarning, gallMidgeWarning, brownPlantHopperWarning, sheathBlightWarning, grainDiscolorationWarning]);

  // Dữ liệu biểu đồ doanh thu 6 tháng gần nhất
  const revenueChartData = useMemo(() => {
    const invoices = invoicesData?.data?.items || [];
    const monthNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const data = [];
    for (let i = 5; i >= 0; i--) {
      let month = currentMonth - i;
      let year = currentYear;
      if (month < 0) {
        month += 12;
        year -= 1;
      }

      const monthInvoices = invoices.filter((inv: any) => {
        const invDate = new Date(inv.sale_date || inv.created_at);
        return invDate.getMonth() === month && invDate.getFullYear() === year;
      });

      const revenue = monthInvoices.reduce((sum: number, inv: any) => sum + (inv.final_amount || 0), 0);

      data.push({
        month: monthNames[month],
        revenue: revenue / 1000000, // Chuyển sang triệu đồng
        count: monthInvoices.length
      });
    }

    return data;
  }, [invoicesData]);

  // Dữ liệu biểu đồ công nợ
  const debtChartData = useMemo(() => {
    const invoices = invoicesData?.data?.items || [];
    const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + (inv.final_amount || 0), 0);
    const totalPaid = invoices.reduce((sum: number, inv: any) => sum + ((inv.final_amount || 0) - (inv.remaining_amount || 0)), 0);
    const totalDebt = invoices.reduce((sum: number, inv: any) => sum + (inv.remaining_amount || 0), 0);

    return [
      { name: 'Đã thu', value: totalPaid / 1000000, color: '#4caf50' },
      { name: 'Còn nợ', value: totalDebt / 1000000, color: '#f44336' }
    ];
  }, [invoicesData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Tổng Quan Hệ Thống
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Chào mừng bạn đến với hệ thống quản lý Xanh AG
      </Typography>

      {/* Thẻ thống kê */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Hóa đơn tháng này"
            value={stats.monthInvoices}
            icon={<ReceiptOutlined sx={{ fontSize: 32 }} />}
            color="#2196f3"
            subtitle="Tổng số hóa đơn"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Doanh thu tháng này"
            value={formatCurrency(stats.monthRevenue)}
            icon={<AttachMoneyOutlined sx={{ fontSize: 32 }} />}
            color="#4caf50"
            subtitle="Tổng doanh thu"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Cảnh báo bệnh hại"
            value={stats.warningCount}
            icon={<WarningAmberOutlined sx={{ fontSize: 32 }} />}
            color="#ff9800"
            subtitle="Mức CAO & TRUNG BÌNH"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Khách hàng mới"
            value={`${stats.newCustomers}/${stats.totalCustomers}`}
            icon={<PeopleOutlineOutlined sx={{ fontSize: 32 }} />}
            color="#9c27b0"
            subtitle="Tháng này / Tổng"
          />
        </Grid>
      </Grid>

      {/* Biểu đồ */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Biểu đồ doanh thu */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                📈 Doanh Thu 6 Tháng Gần Nhất
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2196f3" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#2196f3" stopOpacity={0}/>
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
            </CardContent>
          </Card>
        </Grid>

        {/* Biểu đồ công nợ */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                💰 Tình Hình Công Nợ
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
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toFixed(2)} triệu`} />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Tổng công nợ: <strong>{formatCurrency(stats.totalDebt)}</strong>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Cảnh báo bệnh hại */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            ⚠️ Cảnh Báo Bệnh/Sâu Hại Hiện Tại
            {diseaseLocation && (
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                (Tại {diseaseLocation.name})
              </Typography>
            )}
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {[
              { name: 'Bệnh Đạo Ôn', data: riceBlastWarning },
              { name: 'Bệnh Cháy Bìa Lá', data: bacterialBlightWarning },
              { name: 'Sâu Đục Thân', data: stemBorerWarning },
              { name: 'Muỗi Hành', data: gallMidgeWarning },
              { name: 'Rầy Nâu', data: brownPlantHopperWarning },
              { name: 'Bệnh Khô Vằn', data: sheathBlightWarning },
              { name: 'Bệnh Lem Lép Hạt', data: grainDiscolorationWarning }
            ].map((warning, index) => {
              if (!warning.data) return null;
              
              const riskColor = 
                warning.data.risk_level === 'CAO' ? 'error' :
                warning.data.risk_level === 'TRUNG_BINH' ? 'warning' : 'success';

              return (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Alert 
                    severity={riskColor}
                    sx={{ 
                      '& .MuiAlert-message': { width: '100%' }
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight="bold">
                      {warning.name}
                    </Typography>
                    <Typography variant="caption">
                      Mức độ: {warning.data.risk_level}
                    </Typography>
                  </Alert>
                </Grid>
              );
            })}
          </Grid>
          {stats.warningCount === 0 && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Hiện tại không có cảnh báo bệnh hại nào ở mức CAO hoặc TRUNG BÌNH
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;
