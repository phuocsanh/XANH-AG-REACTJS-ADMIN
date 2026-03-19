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
  Tag,
  Button,
  Segmented
} from 'antd';
import { DatePicker, ExportExcelButton } from '@/components/common';
import { 
  DollarOutlined, 
  ShoppingOutlined, 
  ArrowUpOutlined, 
  ArrowDownOutlined,
  CalendarOutlined,
  PieChartOutlined,
  FileProtectOutlined,
  FileExcelOutlined,
  MinusCircleOutlined,
  SyncOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { PeriodInvoice, PeriodInvoiceItem } from '@/models/store-profit';
import { usePeriodStoreProfitReport, useSyncTaxableDataMutation } from '@/queries/store-profit-report';

const { Title, Text } = Typography;

/**
 * Trang báo cáo doanh thu và lợi nhuận theo khoảng thời gian
 */
const RevenueReportPage: React.FC = () => {
  // Mặc định xem báo cáo tháng hiện tại
  const [dates, setDates] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().startOf('year'),
    dayjs(),
  ]);
  const [taxableFilter, setTaxableFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [sortBy, setSortBy] = useState<string>('sale_date');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const startDate = dates[0]?.format('YYYY-MM-DD') || '';
  const endDate = dates[1]?.format('YYYY-MM-DD') || '';

  const { data: report, isLoading, isError } = usePeriodStoreProfitReport(startDate, endDate, taxableFilter, sortBy, sortOrder);

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

  const { mutate: syncTaxableData, isPending: isSyncing } = useSyncTaxableDataMutation();

  const handleSyncTaxableData = () => {
    console.log('🔵 Bắt đầu đồng bộ dữ liệu thuế...');
    syncTaxableData();
  };

  return (
    <div className='p-6 md:p-10 bg-gray-50 min-h-screen'>
      <style>{`
        .revenue-invoices-table .ant-table {
          background: transparent !important;
        }
        .revenue-invoices-table .ant-table-thead > tr > th {
          background: transparent !important;
          border-bottom: none !important;
          font-weight: 600;
          color: #6b7280;
        }
        .revenue-invoices-table .ant-table-tbody > tr.invoice-row {
          background: #ffffff !important;
        }
        /* Tạo khoảng cách giữa các khối hóa đơn */
        .revenue-invoices-table .ant-table-tbody > tr.invoice-row > td {
          border-top: 1px solid #f3f4f6 !important;
          border-bottom: 1px solid #f3f4f6 !important;
          padding: 20px 16px !important;
        }
        .revenue-invoices-table .ant-table-tbody > tr.invoice-row > td:first-child {
          border-left: 1px solid #f3f4f6 !important;
          border-top-left-radius: 12px;
          border-bottom-left-radius: 12px;
        }
        .revenue-invoices-table .ant-table-tbody > tr.invoice-row > td:last-child {
          border-right: 1px solid #f3f4f6 !important;
          border-top-right-radius: 12px;
          border-bottom-right-radius: 12px;
        }
        /* Tạo khoảng trống phía dưới mỗi khối row + expanded row */
        .revenue-invoices-table .ant-table-tbody > tr.ant-table-expanded-row > td {
          background: #ffffff !important;
          border-bottom: 1px solid #f3f4f6 !important;
          border-bottom-left-radius: 12px;
          border-bottom-right-radius: 12px;
          padding-top: 0 !important;
          padding-bottom: 24px !important;
        }
        /* Hack để tạo khoảng cách giữa các "card" */
        .revenue-invoices-table .ant-table-tbody > tr.ant-table-expanded-row {
          display: table-row;
        }
        .revenue-invoices-table .ant-table-row-indent + .ant-table-row {
           border-top: 10px solid transparent;
        }
        .revenue-invoices-table .ant-table-tbody::after {
          content: "";
          display: block;
          height: 16px;
        }
      `}</style>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <Title level={2} className="!mb-0 !text-emerald-800">Báo cáo doanh thu & Lợi nhuận</Title>
          <Text type="secondary">Thống kê chi tiết tình hình kinh doanh theo khoảng thời gian chọn lọc</Text>
          <div className="mt-2 flex items-center gap-2">
            <Button 
              type="link" 
              icon={<SyncOutlined spin={isSyncing} />} 
              onClick={handleSyncTaxableData}
              loading={isSyncing}
              className="p-0 text-emerald-600 hover:text-emerald-700"
            >
              Đồng bộ dữ liệu thuế cũ
            </Button>
            {report && (
              <ExportExcelButton 
                label="Xuất Excel Kê Thuế"
                fileName={`Bao-cao-thue-${startDate}-den-${endDate}`}
                data={[
                  ...report.invoices.flatMap(invoice => 
                    invoice.items
                      .filter(item => {
                        const taxableQty = Number(item.taxable_quantity || 0);
                        if (taxableFilter === 'yes') return taxableQty > 0;
                        if (taxableFilter === 'no') return taxableQty === 0;
                        return true;
                      })
                      .map(item => ({
                        ...item,
                        invoice_code: invoice.invoice_code,
                        sale_date: invoice.sale_date,
                        customer_name: invoice.customer_name,
                      }))
                  ),
                  // Thêm dòng tổng cộng ở cuối
                  {
                    is_summary: true,
                    product_name: 'TỔNG CỘNG',
                    taxable_total_amount: report.invoices.reduce((acc, inv) => {
                      return acc + inv.items.reduce((itemAcc, item) => {
                        const taxableQty = Number(item.taxable_quantity || 0);
                        if (taxableFilter === 'yes' && taxableQty === 0) return itemAcc;
                        if (taxableFilter === 'no' && taxableQty > 0) return itemAcc;
                        return itemAcc + Number(item.taxable_total_amount || 0);
                      }, 0);
                    }, 0)
                  }
                ]}
                columns={[
                  { 
                    key: 'sale_date', 
                    header: 'Ngày bán', 
                    format: (val, record) => record.is_summary ? '' : dayjs(val).format('DD/MM/YYYY') 
                  },
                  { 
                    key: 'product_name', 
                    header: 'Tên sản phẩm' 
                  },
                  {
                    key: 'taxable_quantity',
                    header: 'Số lượng',
                    format: (val, record) => record.is_summary ? '' : val
                  },
                  {
                    key: 'unit_name',
                    header: 'Đơn vị',
                    format: (val, record) => record.is_summary ? '' : val
                  },
                  { 
                    key: 'tax_selling_price', 
                    header: 'Đơn giá khai thuế (GBKT)',
                    format: (val, record) => record.is_summary ? '' : Number(val || 0).toLocaleString('vi-VN')
                  },
                  { 
                    key: 'taxable_total_amount', 
                    header: 'Thành tiền khai thuế (TTKT)',
                    format: (val) => Number(val || 0).toLocaleString('vi-VN')
                  }
                ]}
              />
            )}
          </div>
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

            <Col span={24}>
              <Card 
                title={
                  <Space size="large">
                    <Space><ShoppingOutlined className="text-emerald-600" /> Danh sách hóa đơn & Sản phẩm đã bán</Space>
                  </Space>
                } 
                extra={
                  <Space>
                    <Text type="secondary" className="hidden md:inline">Lọc theo SP:</Text>
                    <Segmented
                      value={taxableFilter}
                      onChange={(val) => setTaxableFilter(val as any)}
                      options={[
                        { label: 'Tất cả', value: 'all' },
                        { label: 'Có hóa đơn', value: 'yes', icon: <FileProtectOutlined className="text-blue-500" /> },
                        { label: 'Không hóa đơn', value: 'no', icon: <FileExcelOutlined className="text-gray-400" /> },
                      ]}
                    />
                    <Divider type="vertical" className="h-8 mx-2" />
                    <Text type="secondary" className="hidden lg:inline">Sắp xếp:</Text>
                    <Space.Compact>
                      <Segmented
                        value={sortBy}
                        onChange={(val) => setSortBy(val as string)}
                        options={[
                          { label: 'Ngày bán', value: 'sale_date', icon: <CalendarOutlined /> },
                          { label: 'Thành tiền', value: 'total_amount', icon: <DollarOutlined /> },
                        ]}
                      />
                      <Button 
                        icon={sortOrder === 'DESC' ? <ArrowDownOutlined /> : <ArrowUpOutlined />} 
                        onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
                        className="flex items-center justify-center border-l-0"
                      />
                    </Space.Compact>
                  </Space>
                }
                className="rounded-2xl shadow-sm border-none overflow-hidden"
                bodyStyle={{ padding: 0 }}
              >
                {/* Danh sách hóa đơn - mỗi hóa đơn là một card riêng biệt */}
                <div className="p-4 space-y-4">
                  {(report?.invoices || []).length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <ShoppingOutlined style={{ fontSize: 40 }} className="mb-3 block" />
                      Không có hóa đơn nào trong khoảng thời gian này
                    </div>
                  ) : (
                    (report?.invoices || []).map((invoice: PeriodInvoice) => {
                      // Lọc items bên trong hóa đơn theo bộ lọc thuế
                      const filteredItems = invoice.items.filter((item: PeriodInvoiceItem) => {
                        const taxableQty = Number(item.taxable_quantity || 0);
                        if (taxableFilter === 'yes') return taxableQty > 0;
                        if (taxableFilter === 'no') return taxableQty === 0;
                        return true; // 'all' - hiển thị tất cả
                      });

                      // Ẩn hóa đơn nếu sau khi lọc không còn item nào
                      if (filteredItems.length === 0) return null;

                      return (
                      <div
                        key={invoice.invoice_id}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                      >
                        {/* Header hóa đơn */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-100 gap-2">
                          <div className="flex items-center gap-3">
                            <Text strong className="text-emerald-700 text-base">{invoice.invoice_code}</Text>
                            <Text type="secondary">·</Text>
                            <Text type="secondary">{invoice.customer_name}</Text>
                          </div>
                          <div className="flex items-center gap-4">
                            <Text type="secondary" className="text-sm">
                              {dayjs(invoice.sale_date).format('DD/MM/YYYY HH:mm')}
                            </Text>
                            <Text strong className="text-base">{formatMoney(invoice.total_amount)}</Text>
                          </div>
                        </div>

                        {/* Bảng chi tiết sản phẩm */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-gray-400 font-medium uppercase text-[11px] bg-gray-50/50">
                                <th className="px-5 py-3 text-left font-semibold" style={{ width: 'auto', minWidth: '300px' }}>Tên sản phẩm</th>
                                <th className="px-4 py-3 text-center font-semibold" style={{ width: '110px' }}>Số lượng</th>
                                <th className="px-4 py-3 text-right font-semibold" style={{ width: '130px' }}>Đơn giá</th>
                                <th className="px-4 py-3 text-right font-semibold" style={{ width: '140px' }}>Thành tiền</th>
                                <th className="px-4 py-3 text-right font-semibold" style={{ width: '110px' }}>GBKT</th>
                                <th className="px-4 py-3 text-right font-semibold" style={{ width: '130px' }}>TTKT</th>
                                <th className="px-4 py-3 text-center font-semibold" style={{ width: '160px' }}>Hóa đơn đầu vào</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredItems.map((item: PeriodInvoiceItem, idx: number) => {
                                const taxableQty = Number(item.taxable_quantity || 0);
                                const totalQty = Number(item.quantity || 1);
                                const isFullyTaxable = taxableQty >= totalQty;
                                const hasInvoice = taxableQty > 0;
                                return (
                                  <tr
                                    key={`${invoice.invoice_id}-${idx}`}
                                    className={`border-t border-gray-50 hover:bg-gray-50/60 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/30' : ''}`}
                                  >
                                    <td className="px-5 py-3">
                                      <div className="font-medium text-gray-800 leading-tight">{item.product_trade_name}</div>
                                      <div className="text-[11px] text-gray-400 mt-0.5">{item.product_name}</div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 rounded-full px-3 py-0.5 text-xs font-medium">
                                        {item.quantity} {item.unit_name}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-600">{formatMoney(item.unit_price)}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-emerald-600">{formatMoney(item.total_price)}</td>
                                    <td className="px-4 py-3 text-right text-gray-500">
                                      {Number(item.tax_selling_price) > 0 ? formatMoney(Number(item.tax_selling_price)) : <span className="text-gray-300">-</span>}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      {Number(item.taxable_total_amount) > 0
                                        ? <span className="font-semibold text-blue-600">{formatMoney(Number(item.taxable_total_amount))}</span>
                                        : <span className="text-gray-300">-</span>
                                      }
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      {hasInvoice ? (
                                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md px-2.5 py-1 text-xs font-medium">
                                          <FileProtectOutlined />
                                          {isFullyTaxable ? 'Có' : `Có (${taxableQty}/${totalQty})`}
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 border border-gray-200 rounded-md px-2.5 py-1 text-xs">
                                          <FileExcelOutlined />
                                          Không
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      );
                    })
                  )}
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
