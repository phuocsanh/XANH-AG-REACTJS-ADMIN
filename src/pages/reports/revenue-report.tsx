import React, { useState } from 'react';
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
  Tag
} from 'antd';
import { DatePicker } from '@/components/common';
import { 
  DollarOutlined, 
  ShoppingOutlined, 
  ArrowUpOutlined, 
  ArrowDownOutlined,
  CalendarOutlined,
  PieChartOutlined,
  FileProtectOutlined,
  FileExcelOutlined,
  MinusCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { usePeriodStoreProfitReport } from '@/queries/store-profit-report';

const { Title, Text } = Typography;

/**
 * Trang báo cáo doanh thu và lợi nhuận theo khoảng thời gian
 */
const RevenueReportPage: React.FC = () => {
  // Mặc định xem báo cáo tháng hiện tại
  const [dates, setDates] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  const startDate = dates[0]?.format('YYYY-MM-DD') || '';
  const endDate = dates[1]?.format('YYYY-MM-DD') || '';

  const { data: report, isLoading, isError } = usePeriodStoreProfitReport(startDate, endDate);

  const formatMoney = (amount: number = 0) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const summary = report?.summary;

  // Cấu hình bảng tóm tắt chi phí
  const expenseData = summary ? [
    {
      key: '1',
      type: 'Giá vốn hàng bán',
      amount: summary.total_cogs,
      icon: <ShoppingOutlined className="text-orange-500" />,
      description: 'Tổng chi phí nhập hàng của các sản phẩm đã bán'
    },
    {
      key: '2',
      type: 'Chi phí vận hành',
      amount: summary.total_operating_costs,
      icon: <MinusCircleOutlined className="text-red-400" />,
      description: 'Điện, nước, mặt bằng, nhân công...'
    },
    {
      key: '3',
      type: 'Quà tặng & Dịch vụ',
      amount: summary.total_gift_costs,
      icon: <DollarOutlined className="text-purple-400" />,
      description: 'Quà tặng cho khách hàng, chi phí kỹ thuật, giao hàng'
    },
  ] : [];

  const columns = [
    {
      title: 'Loại chi phí',
      dataIndex: 'type',
      key: 'type',
      render: (text: string, record: typeof expenseData[0]) => (
        <Space>
          {record.icon}
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      render: (amount: number) => <Text className="text-red-500 font-medium">{formatMoney(amount)}</Text>,
    },
  ];

  return (
    <div className='p-6 md:p-10 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <Title level={2} className="!mb-0 !text-emerald-800">Báo cáo doanh thu & Lợi nhuận</Title>
          <Text type="secondary">Thống kê chi tiết tình hình kinh doanh theo khoảng thời gian chọn lọc</Text>
        </div>
        <Card className="shadow-sm border-emerald-100" bodyStyle={{ padding: '12px 24px' }}>
          <Space direction="vertical" size={2}>
            <Text type="secondary"><CalendarOutlined /> Chọn khoảng thời gian:</Text>
            <Space.Compact>
              <DatePicker 
                className="rounded-l-lg"
                value={dates[0]}
                onChange={(val: Dayjs | null) => {
                  const newStartDate = val as Dayjs | null;
                  // Nếu ngày bắt đầu lớn hơn ngày kết thúc, tự động điều chỉnh ngày kết thúc
                  if (newStartDate && dates[1] && newStartDate.isAfter(dates[1])) {
                    setDates([newStartDate, newStartDate]);
                  } else {
                    setDates([newStartDate, dates[1]]);
                  }
                }}
                placeholder="Từ ngày"
                format="DD/MM/YYYY"
                size="large"
                allowClear={false}
              />
              <DatePicker 
                className="rounded-r-lg"
                value={dates[1]}
                onChange={(val: Dayjs | null) => {
                  const newEndDate = val as Dayjs | null;
                  // Nếu ngày kết thúc nhỏ hơn ngày bắt đầu, tự động điều chỉnh ngày bắt đầu
                  if (newEndDate && dates[0] && newEndDate.isBefore(dates[0])) {
                    setDates([newEndDate, newEndDate]);
                  } else {
                    setDates([dates[0], newEndDate]);
                  }
                }}
                placeholder="Đến ngày"
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
          <Text type="secondary">Đang tính toán dữ liệu báo cáo...</Text>
        </div>
      ) : isError ? (
        <Alert
          message="Lỗi tải dữ liệu"
          description="Đã có lỗi xảy ra khi lấy thông tin báo cáo. Vui lòng thử lại sau."
          type="error"
          showIcon
        />
      ) : summary ? (
        <div className="animate-in fade-in duration-500">
          {/* Main Stats */}
          <Row gutter={[24, 24]} className="mb-8">
            <Col xs={24} sm={12} md={8} lg={8} xl={4.8}>
              <Card className="rounded-2xl border-none shadow-sm h-full" bodyStyle={{ borderLeft: '4px solid #10b981' }}>
                <Statistic
                  title={<Text type="secondary" strong>TỔNG DOANH THU</Text>}
                  value={summary.total_revenue}
                  formatter={(value) => formatMoney(Number(value))}
                  prefix={<DollarOutlined className="text-emerald-500" />}
                />
                <div className="mt-2 text-xs">Phát sinh từ <strong>{summary.invoice_count}</strong> hóa đơn</div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={8} xl={4.8}>
              <Card className="rounded-2xl bg-blue-600 border-none shadow-md h-full">
                <Statistic
                  title={<Text className="text-blue-100" strong>DOANH THU KHAI BÁO THUẾ</Text>}
                  value={summary.taxable_revenue}
                  valueStyle={{ color: '#fff', fontSize: '20px', fontWeight: 'bold' }}
                  formatter={(value) => formatMoney(Number(value))}
                  prefix={<FileProtectOutlined className="text-blue-100" />}
                />
                <div className="mt-2 text-blue-100 text-xs">Chỉ tính sản phẩm có hóa đơn đầu vào</div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={8} xl={4.8}>
              <Card className="rounded-2xl border-none shadow-sm h-full" bodyStyle={{ borderLeft: '4px solid #f59e0b' }}>
                <Statistic
                  title={<Text type="secondary" strong>LỢI NHUẬN GỘP</Text>}
                  value={summary.gross_profit}
                  valueStyle={{ color: '#d97706' }}
                  formatter={(value) => formatMoney(Number(value))}
                  prefix={<ArrowUpOutlined />}
                />
                <div className="mt-2 text-xs text-gray-400">Chưa trừ chi phí vận hành</div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={12} lg={12} xl={4.8}>
              <Card className="rounded-2xl border-none shadow-sm h-full" bodyStyle={{ borderLeft: '4px solid #ef4444' }}>
                <Statistic
                  title={<Text type="secondary" strong>TỔNG CHI PHÍ KHÁC</Text>}
                  value={summary.total_operating_costs + summary.total_gift_costs}
                  valueStyle={{ color: '#dc2626' }}
                  formatter={(value) => formatMoney(Number(value))}
                  prefix={<ArrowDownOutlined />}
                />
                <div className="mt-2 text-xs text-gray-400">Gồm vận hành + quà tặng</div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={12} lg={12} xl={4.8}>
              <Card className="rounded-2xl bg-emerald-700 border-none shadow-md h-full">
                <Statistic
                  title={<Text className="text-emerald-100" strong>LỢI NHUẬN RÒNG</Text>}
                  value={summary.net_profit}
                  valueStyle={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}
                  formatter={(value) => formatMoney(Number(value))}
                />
                <div className="mt-2 text-emerald-100 text-xs">Số tiền thực tế còn lại</div>
              </Card>
            </Col>
          </Row>

          {/* Breakdown Section */}
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card 
                title={<Space><PieChartOutlined className="text-emerald-600" /> Phân tích doanh thu</Space>} 
                className="rounded-2xl shadow-sm border-none overflow-hidden"
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                    <Space size="middle">
                      <div className="bg-blue-500 p-3 rounded-lg text-white">
                        <FileProtectOutlined style={{ fontSize: '20px' }} />
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs">SẢN PHẨM CÓ HÓA ĐƠN</div>
                        <div className="text-lg font-bold text-blue-700">{formatMoney(summary.revenue_with_invoice)}</div>
                      </div>
                    </Space>
                    <Tag color="blue" className="rounded-full px-3">{Math.round((summary.revenue_with_invoice / summary.total_revenue) * 100) || 0}%</Tag>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <Space size="middle">
                      <div className="bg-gray-400 p-3 rounded-lg text-white">
                        <FileExcelOutlined style={{ fontSize: '20px' }} />
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs">SẢN PHẨM KHÔNG HÓA ĐƠN</div>
                        <div className="text-lg font-bold text-gray-700">{formatMoney(summary.revenue_no_invoice)}</div>
                      </div>
                    </Space>
                    <Tag color="default" className="rounded-full px-3">{Math.round((summary.revenue_no_invoice / summary.total_revenue) * 100) || 0}%</Tag>
                  </div>
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card 
                title={<Space><ShoppingOutlined className="text-orange-600" /> Phân tích giá vốn (COGS)</Space>} 
                className="rounded-2xl shadow-sm border-none overflow-hidden"
              >
                 <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Text type="secondary">Giá vốn (Có hóa đơn):</Text>
                    <Text strong>{formatMoney(summary.cogs_with_invoice)}</Text>
                  </div>
                  <div className="flex items-center justify-between">
                    <Text type="secondary">Giá vốn (Không hóa đơn):</Text>
                    <Text strong>{formatMoney(summary.cogs_no_invoice)}</Text>
                  </div>
                  <Divider className="my-2" />
                  <div className="flex items-center justify-between">
                    <Text strong>Tổng giá vốn:</Text>
                    <Text strong className="text-lg text-orange-600">{formatMoney(summary.total_cogs)}</Text>
                  </div>
                  <Alert 
                    message="Lưu ý"
                    description="Giá vốn được tính dựa trên giá nhập trung bình của sản phẩm tại thời điểm hiện tại."
                    type="info"
                    showIcon
                    className="mt-2"
                  />
                </div>
              </Card>
            </Col>

            <Col span={24}>
              <Card 
                title={<Space><MinusCircleOutlined className="text-red-500" /> Chi tiết các khoản chi phí</Space>} 
                className="rounded-2xl shadow-sm border-none"
              >
                <Table 
                  dataSource={expenseData} 
                  columns={columns} 
                  pagination={false} 
                  size="middle"
                  className="border-none"
                />
                
                <div className="mt-8 p-4 bg-emerald-50 rounded-xl flex justify-between items-center text-emerald-800">
                  <div className="font-bold uppercase tracking-wider">Lợi nhuận ròng cuối cùng:</div>
                  <div className="text-2xl font-black">{formatMoney(summary.net_profit)}</div>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      ) : (
        <Alert message="Không có dữ liệu cho khoảng thời gian này" type="info" showIcon />
      )}
    </div>
  );
};

export default RevenueReportPage;
