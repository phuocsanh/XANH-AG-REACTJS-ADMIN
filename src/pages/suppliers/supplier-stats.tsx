import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Typography, 
  Space, 
  Divider, 
  Alert, 
  Spin,
  Table,
  Tag,
  Button
} from 'antd';
import { DatePicker } from '@/components/common';
import { 
  DollarOutlined, 
  ShoppingOutlined, 
  ArrowUpOutlined, 
  CalendarOutlined,
  LeftOutlined,
  BarChartOutlined,
  PieChartOutlined,
  ProfileOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useSupplierSalesStats } from '@/queries/supplier-report';
import { formatCurrency } from '@/utils/format';

const { Title, Text } = Typography;

/**
 * Trang thống kê chi tiết sản phẩm đã bán và lợi nhuận của một nhà cung cấp
 */
const SupplierStatsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const supplierId = Number(id);

  // Mặc định xem báo cáo tháng hiện tại
  const [dates, setDates] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  const startDate = dates[0]?.format('YYYY-MM-DD') || '';
  const endDate = dates[1]?.format('YYYY-MM-DD') || '';

  const { data: report, isLoading, isError } = useSupplierSalesStats(supplierId, {
    startDate,
    endDate
  });

  const formatMoney = (amount: number = 0) => {
    return formatCurrency(amount);
  };

  const summary = report?.summary;

  const productColumns = [
    {
      title: 'Mã SP',
      dataIndex: 'product_code',
      key: 'product_code',
      width: 120,
      render: (code: string) => <Tag color="blue">{code}</Tag>
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'product_name',
      key: 'product_name',
      render: (name: string) => <Text strong>{name}</Text>
    },
    {
      title: 'SL đã bán',
      dataIndex: 'quantity_sold',
      key: 'quantity_sold',
      align: 'center' as const,
      width: 120,
      render: (qty: number, record: any) => <Text>{qty} {record.unit_name}</Text>
    },
    {
      title: 'Giá trị đã bán (Giá bán)',
      dataIndex: 'total_revenue',
      key: 'total_revenue',
      align: 'right' as const,
      width: 180,
      render: (val: number) => <Text strong className="text-emerald-700">{formatMoney(val)}</Text>
    },
    {
      title: 'Giá trị đã bán (Giá nhập)',
      dataIndex: 'total_cost',
      key: 'total_cost',
      align: 'right' as const,
      width: 180,
      render: (val: number) => <Text className="text-orange-600">{formatMoney(val)}</Text>
    },
    {
      title: 'Lợi nhuận',
      dataIndex: 'profit',
      key: 'profit',
      align: 'right' as const,
      width: 150,
      render: (val: number) => <Text strong className="text-blue-600">{formatMoney(val)}</Text>
    },
    {
        title: 'Tỷ suất',
        dataIndex: 'margin',
        key: 'margin',
        align: 'center' as const,
        width: 100,
        render: (val: number) => <Tag color={val > 0 ? "green" : "volcano"}>{val}%</Tag>
      },
  ];

  return (
    <div className='p-4 md:p-8 bg-gray-50 min-h-screen animate-in fade-in duration-500'>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <Space align="center">
            <Button 
                shape="circle" 
                icon={<LeftOutlined />} 
                onClick={() => navigate('/suppliers')}
                className="shadow-sm hover:bg-emerald-50"
            />
            <div>
              <Title level={2} className="!mb-0 !text-emerald-800">Thống kê nhà cung cấp</Title>
              <Title level={4} className="!mt-0 text-emerald-600 font-medium">#{report?.supplier_name || 'Đang tải...'}</Title>
              <Text type="secondary">Phân tích hiệu quả kinh doanh của các sản phẩm thuộc nhà cung cấp này</Text>
            </div>
          </Space>
        </div>
        
        <Card className="shadow-sm border-emerald-100" bodyStyle={{ padding: '12px 24px' }}>
          <Space direction="vertical" size={2}>
            <Text type="secondary" style={{ fontSize: '12px' }}><CalendarOutlined /> Phạm vi thống kê:</Text>
            <Space.Compact>
              <DatePicker 
                className="rounded-l-lg"
                value={dates[0]}
                onChange={(val: Dayjs | null) => setDates([val, dates[1]])}
                format="DD/MM/YYYY"
                size="large"
                allowClear={false}
              />
              <DatePicker 
                className="rounded-r-lg"
                value={dates[1]}
                onChange={(val: Dayjs | null) => setDates([dates[0], val])}
                format="DD/MM/YYYY"
                size="large"
                allowClear={false}
              />
            </Space.Compact>
          </Space>
        </Card>
      </div>

      <Divider />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm">
          <Spin size="large" className="mb-4" />
          <Text type="secondary" className="animate-pulse">Đang truy vấn dữ liệu từ máy chủ...</Text>
        </div>
      ) : isError ? (
        <Alert
          message="Lỗi truy xuất dữ liệu"
          description="Đã có lỗi xảy ra hoặc do backend chưa hỗ trợ thống kê này. Vui lòng kiểm tra lại sau."
          type="error"
          showIcon
          className="rounded-xl shadow-sm"
        />
      ) : summary ? (
        <div>
          {/* Main Stats Cards */}
          <Row gutter={[20, 20]} className="mb-8">
            <Col xs={24} sm={12} md={6}>
              <Card className="rounded-2xl border-none shadow-sm hover:shadow-md transition-shadow h-full bg-blue-600">
                <Statistic
                  title={<Text className="text-blue-100" strong>GIÁ TRỊ BÁN RA</Text>}
                  value={summary.total_revenue}
                  formatter={(value) => formatMoney(Number(value))}
                  valueStyle={{ color: '#fff', fontSize: '22px', fontWeight: 'bold' }}
                  prefix={<ShoppingOutlined className="text-blue-100" />}
                />
                <div className="mt-2 text-blue-100 text-xs truncate">Phát sinh từ {summary.product_count} sản phẩm</div>
              </Card>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Card className="rounded-2xl border-none shadow-sm h-full" bodyStyle={{ borderLeft: '4px solid #f97316' }}>
                <Statistic
                  title={<Text type="secondary" strong>GIÁ TRỊ NHẬP VÀO</Text>}
                  value={summary.total_cost}
                  formatter={(value) => formatMoney(Number(value))}
                  valueStyle={{ color: '#ea580c', fontSize: '20px' }}
                  prefix={<DollarOutlined />}
                />
                <div className="mt-2 text-xs text-gray-400">Giá vốn các sản phẩm đã bán</div>
              </Card>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Card className="rounded-2xl border-none shadow-sm h-full" bodyStyle={{ borderLeft: '4px solid #10b981' }}>
                <Statistic
                  title={<Text type="secondary" strong>LỢI NHUẬN GỘP</Text>}
                  value={summary.gross_profit}
                  formatter={(value) => formatMoney(Number(value))}
                  valueStyle={{ color: '#059669', fontSize: '22px', fontWeight: 'bold' }}
                  prefix={<ArrowUpOutlined />}
                />
                <div className="mt-2 text-xs text-emerald-600 font-medium">Tỷ suất: {summary.gross_margin}%</div>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Card className="rounded-2xl border-none shadow-sm h-full" bodyStyle={{ borderLeft: '4px solid #3b82f6' }}>
                <Statistic
                  title={<Text type="secondary" strong>CÁC ĐƠN HÀNG</Text>}
                  value={summary.invoice_count}
                  valueStyle={{ color: '#2563eb', fontSize: '22px' }}
                  prefix={<ProfileOutlined />}
                />
                <div className="mt-2 text-xs text-gray-400">Số lượng hóa đơn có liên quan</div>
              </Card>
            </Col>
          </Row>

          {/* Detailed Product Table */}
          <Row gutter={[24, 24]}>
            <Col span={24}>
              <Card 
                title={
                    <Space size="middle">
                        <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                            <BarChartOutlined style={{ fontSize: '18px' }} />
                        </div>
                        <Text strong>Chi tiết sản phẩm đã bán</Text>
                    </Space>
                } 
                className="rounded-2xl shadow-sm border-none overflow-hidden"
              >
                <Table 
                  dataSource={report?.products || []} 
                  columns={productColumns} 
                  rowKey="product_id"
                  pagination={{ pageSize: 20 }}
                  className="supplier-stats-table"
                  scroll={{ x: 800 }}
                  summary={(pageData) => {
                    let totalRevenue = 0;
                    let totalCost = 0;
                    let totalProfit = 0;

                    pageData.forEach(({ total_revenue, total_cost, profit }) => {
                      totalRevenue += total_revenue;
                      totalCost += total_cost;
                      totalProfit += profit;
                    });

                    return (
                      <Table.Summary fixed>
                        <Table.Summary.Row className="bg-emerald-50 font-bold">
                          <Table.Summary.Cell index={0} colSpan={3} className="text-center">TỔNG CỘNG</Table.Summary.Cell>
                          <Table.Summary.Cell index={1} align="right">{formatMoney(totalRevenue)}</Table.Summary.Cell>
                          <Table.Summary.Cell index={2} align="right">{formatMoney(totalCost)}</Table.Summary.Cell>
                          <Table.Summary.Cell index={3} align="right" className="text-blue-700">{formatMoney(totalProfit)}</Table.Summary.Cell>
                          <Table.Summary.Cell index={4}></Table.Summary.Cell>
                        </Table.Summary.Row>
                      </Table.Summary>
                    );
                  }}
                />
              </Card>
            </Col>
          </Row>

          {/* Quick Insights */}
          <Row gutter={[24, 24]} className="mt-8">
            <Col xs={24} lg={12}>
                <Card className="rounded-2xl shadow-sm border-none bg-emerald-50 overflow-hidden">
                    <Row gutter={16} align="middle">
                        <Col span={4}>
                            <div className="bg-emerald-500 rounded-full w-12 h-12 flex items-center justify-center text-white">
                                <PieChartOutlined style={{ fontSize: '24px' }} />
                            </div>
                        </Col>
                        <Col span={20}>
                            <Title level={5} className="!mb-1">Tỷ suất lợi nhuận trung bình</Title>
                            <Text type="secondary">Nhà cung cấp này mang lại lợi nhuận gộp trung bình khoảng <strong>{summary.gross_margin}%</strong> trên mỗi đơn vị sản phẩm bán ra.</Text>
                        </Col>
                    </Row>
                </Card>
            </Col>
          </Row>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-20 bg-white rounded-2xl shadow-sm border border-dashed border-gray-300">
            <ShoppingOutlined style={{ fontSize: '48px', color: '#d1d5db', marginBottom: '16px' }} />
            <Title level={4} style={{ color: '#9ca3af' }}>Không tìm thấy dữ liệu</Title>
            <Text type="secondary">Chưa có sản phẩm nào của nhà cung cấp này phát sinh doanh thu trong khoảng thời gian đã chọn.</Text>
        </div>
      )}
    </div>
  );
};

export default SupplierStatsPage;
