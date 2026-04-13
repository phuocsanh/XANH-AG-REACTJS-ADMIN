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
  SyncOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { PeriodInvoice, PeriodInvoiceItem } from '@/models/store-profit';
import { usePeriodStoreProfitReport, useSyncTaxableDataV2Mutation } from '@/queries/store-profit-report';

const { Title, Text } = Typography;

/**
 * Trang báo cáo doanh thu và lợi nhuận 2026 - Đồng bộ thuế theo ngày nhập 2026
 */
const TaxRevenueReport2026Page: React.FC = () => {
  // Mặc định xem báo cáo từ 1/1/2026
  const [dates, setDates] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs('2026-01-01'),
    dayjs(),
  ]);
  const [taxableFilter, setTaxableFilter] = useState<'all' | 'yes' | 'no'>('yes');
  const [sortBy, setSortBy] = useState<string>('sale_date');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const startDate = dates[0]?.format('YYYY-MM-DD') || '2026-01-01';
  const endDate = dates[1]?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD');

  const { data: report, isLoading, isError } = usePeriodStoreProfitReport(
    startDate, 
    endDate, 
    taxableFilter, 
    sortBy, 
    sortOrder,
    '2026-01-01' // Chỉ lấy sản phẩm có hóa đơn nhập từ 2026
  );

  const formatMoney = (amount: number = 0) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const summary = report?.summary;

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
      render: (text: string, record: any) => (
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

  // Sử dụng Mutation V2 cho năm 2026
  const { mutate: syncTaxableData2026, isPending: isSyncing } = useSyncTaxableDataV2Mutation();

  const handleSyncTaxableData = () => {
    console.log('🔵 [2026] Bắt đầu đồng bộ dữ liệu thuế theo ngày nhập từ 1/1/2026...');
    syncTaxableData2026('2026-01-01');
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
        .revenue-invoices-table .ant-table-tbody > tr.ant-table-expanded-row > td {
          background: #ffffff !important;
          border-bottom: 1px solid #f3f4f6 !important;
          border-bottom-left-radius: 12px;
          border-bottom-right-radius: 12px;
          padding-top: 0 !important;
          padding-bottom: 24px !important;
        }
        .revenue-invoices-table .ant-table-tbody::after {
          content: "";
          display: block;
          height: 16px;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <Title level={2} className="!mb-0 !text-blue-800">
            <ThunderboltOutlined className="mr-2" />
            Đồng bộ thuế 2026 (Theo ngày nhập)
          </Title>
          <Text type="secondary">Chỉ đồng bộ các sản phẩm có hóa đơn nhập từ <strong>01/01/2026</strong></Text>
          <div className="mt-2 flex items-center gap-2">
            <Button 
              type="primary"
              icon={<SyncOutlined spin={isSyncing} />} 
              onClick={handleSyncTaxableData}
              loading={isSyncing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Đồng bộ dữ liệu thuế thực tế 2026
            </Button>
            {report && (
              <ExportExcelButton 
                label="Xuất Excel Kê Thuế"
                fileName={`Bao-cao-thue-2026-${startDate}-den-${endDate}`}
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
                  { key: 'sale_date', header: 'Ngày bán', format: (val, record) => record.is_summary ? '' : dayjs(val).format('DD/MM/YYYY') },
                  { key: 'product_name', header: 'Tên sản phẩm' },
                  { key: 'taxable_quantity', header: 'Số lượng', format: (val, record) => record.is_summary ? '' : val },
                  { key: 'unit_name', header: 'Đơn vị', format: (val, record) => record.is_summary ? '' : val },
                  { key: 'tax_selling_price', header: 'Đơn giá khai thuế', format: (val, record) => record.is_summary ? '' : Number(val || 0).toLocaleString('vi-VN') },
                  { key: 'taxable_total_amount', header: 'Thành tiền khai thuế', format: (val) => Number(val || 0).toLocaleString('vi-VN') }
                ]}
              />
            )}
          </div>
        </div>
        <Card className="shadow-sm border-blue-100" bodyStyle={{ padding: '12px 24px' }}>
          <Space direction="vertical" size={2}>
            <Text type="secondary"><CalendarOutlined /> Phạm vi lọc báo cáo:</Text>
            <Space.Compact>
              <DatePicker 
                className="rounded-l-lg"
                value={dates[0]}
                onChange={(val: any) => setDates([val, dates[1]])}
                placeholder="Từ ngày"
                format="DD/MM/YYYY"
                size="large"
                allowClear={false}
              />
              <DatePicker 
                className="rounded-r-lg"
                value={dates[1]}
                onChange={(val: any) => setDates([dates[0], val])}
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
          <Text type="secondary">Đang tải dữ liệu...</Text>
        </div>
      ) : isError ? (
        <Alert message="Lỗi tải dữ liệu" type="error" showIcon />
      ) : summary ? (
        <div className="animate-in fade-in duration-500">
          <Row gutter={[24, 24]} className="mb-8">
            <Col xs={24} sm={12} md={4.8}>
              <Card className="rounded-2xl border-none shadow-sm h-full" bodyStyle={{ borderLeft: '4px solid #10b981' }}>
                <Statistic title="TỔNG DOANH THU" value={summary.total_revenue} formatter={(v) => formatMoney(Number(v))} />
                <div className="mt-2 text-xs">Phát sinh từ {summary.invoice_count} hóa đơn</div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={4.8}>
              <Card className="rounded-2xl bg-blue-600 border-none shadow-md h-full">
                <Statistic title={<span className="text-white">DOANH THU THUẾ</span>} value={summary.taxable_revenue} valueStyle={{ color: '#fff' }} formatter={(v) => formatMoney(Number(v))} />
                <div className="mt-2 text-blue-100 text-xs">Dữ liệu sau khi đồng bộ</div>
              </Card>
            </Col>
            {/* Các statistik khác giữ nguyên tương tự RevenueReportPage */}
            <Col xs={24} sm={12} md={4.8}>
              <Card className="rounded-2xl border-none shadow-sm h-full" bodyStyle={{ borderLeft: '4px solid #ef4444' }}>
                <Statistic title="LỢI NHUẬN GỘP" value={summary.gross_profit} valueStyle={{ color: '#dc2626' }} formatter={(v) => formatMoney(Number(v))} />
              </Card>
            </Col>
            {/* ... */}
          </Row>

          <Card title="Danh sách hóa đơn & Sản phẩm (Kỳ báo cáo)" className="rounded-2xl shadow-sm border-none">
             <div className="px-4 py-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <Segmented
                      value={taxableFilter}
                      onChange={(val) => setTaxableFilter(val as any)}
                      options={[
                        { label: 'Tất cả', value: 'all' },
                        { label: 'Có hóa đơn', value: 'yes' },
                        { label: 'Không hóa đơn', value: 'no' },
                      ]}
                    />
                    <Space>
                       <Segmented
                        value={sortBy}
                        onChange={(val) => setSortBy(val as string)}
                        options={[
                          { label: 'Ngày bán', value: 'sale_date' },
                          { label: 'Thành tiền', value: 'total_amount' },
                        ]}
                      />
                      <Button 
                        icon={sortOrder === 'DESC' ? <ArrowDownOutlined /> : <ArrowUpOutlined />} 
                        onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
                      />
                    </Space>
             </div>

             <div className="p-4 space-y-4">
                {report.invoices.map((invoice: any) => {
                   const filteredItems = invoice.items.filter((item: any) => {
                      const taxableQty = Number(item.taxable_quantity || 0);
                      if (taxableFilter === 'yes') return taxableQty > 0;
                      if (taxableFilter === 'no') return taxableQty === 0;
                      return true;
                   });
                   if (filteredItems.length === 0) return null;

                   return (
                      <div key={invoice.invoice_id} className="bg-white rounded-xl border border-gray-100 shadow-sm mb-4">
                         <div className="flex justify-between px-4 py-3 bg-gray-50 rounded-t-xl">
                            <Text strong>{invoice.invoice_code} - {invoice.customer_name}</Text>
                            <Text>{dayjs(invoice.sale_date).format('DD/MM/YYYY')}</Text>
                         </div>
                         <Table 
                            dataSource={filteredItems}
                            pagination={false}
                            size="small"
                            tableLayout="fixed"
                            columns={[
                               { title: 'Sản phẩm', dataIndex: 'product_trade_name', key: 'name', width: '45%', ellipsis: true },
                               { title: 'SL', dataIndex: 'quantity', key: 'qty', width: '8%', align: 'right' as const },
                               { title: 'ĐVT', dataIndex: 'unit_name', key: 'unit', width: '10%', align: 'center' as const },
                               { title: 'GBKT', dataIndex: 'tax_selling_price', key: 'tax_price', width: '17%', align: 'right' as const, render: (v: any) => formatMoney(Number(v)) },
                               { title: 'TTKT', dataIndex: 'taxable_total_amount', key: 'tax_total', width: '20%', align: 'right' as const, render: (v: any) => <Text strong className="text-blue-600">{formatMoney(Number(v))}</Text> },
                            ]}
                         />
                      </div>
                   )
                })}
             </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
};

export default TaxRevenueReport2026Page;
