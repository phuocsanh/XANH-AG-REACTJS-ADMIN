import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Typography, 
  Space, 
  Divider, 
  Alert, 
  Spin,
  Table,
  Button,
  Segmented,
  Skeleton
} from 'antd';
import { DatePicker, ExportExcelButton } from '@/components/common';
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined,
  CalendarOutlined,
  SyncOutlined,
  ThunderboltOutlined,
  SaveOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import {
  usePeriodStoreProfitReport,
  useSyncTaxableDataV2Mutation,
  useTaxRevenueCutoverDateQuery,
  useUpdateTaxRevenueCutoverDateMutation,
} from '@/queries/store-profit-report';
import { useAppStore } from '@/stores';
import { hasPermission } from '@/utils/permission';

const { Title, Text } = Typography;

/**
 * Trang khai thuế theo ngày nhập
 */
const TaxRevenueReportPage: React.FC = () => {
  const defaultCutoverDate = '2026-01-01';
  // Mặc định xem báo cáo từ ngày cutover ban đầu
  const [dates, setDates] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs('2026-01-01'),
    dayjs(),
  ]);
  const [cutoverDateInput, setCutoverDateInput] = useState<Dayjs | null>(dayjs(defaultCutoverDate));
  const [taxableFilter, setTaxableFilter] = useState<'all' | 'yes' | 'no'>('yes');
  const [sortBy, setSortBy] = useState<string>('sale_date');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const {
    data: cutoverSetting,
    isLoading: isCutoverDateLoading,
  } = useTaxRevenueCutoverDateQuery();
  const {
    mutate: updateCutoverDate,
    isPending: isSavingCutoverDate,
  } = useUpdateTaxRevenueCutoverDateMutation();
  const userInfo = useAppStore((state) => state.userInfo);
  const canManageTaxReport = hasPermission(userInfo, 'inventory:manage');

  useEffect(() => {
    const savedDate = cutoverSetting?.cutover_date;
    if (!savedDate) return;

    const parsedDate = dayjs(savedDate);
    if (parsedDate.isValid()) {
      setCutoverDateInput(parsedDate);
    }
  }, [cutoverSetting?.cutover_date]);

  const startDate = dates[0]?.format('YYYY-MM-DD') || '2026-01-01';
  const endDate = dates[1]?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD');
  const cutoverDate = cutoverSetting?.cutover_date || cutoverDateInput?.format('YYYY-MM-DD') || defaultCutoverDate;
  const isCutoverDateDirty = cutoverDateInput?.format('YYYY-MM-DD') !== cutoverDate;

  const { data: report, isLoading, isError } = usePeriodStoreProfitReport(
    startDate, 
    endDate, 
    taxableFilter, 
    sortBy, 
    sortOrder,
    cutoverDate
  );

  const formatMoney = (amount: number = 0) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const summary = report?.summary;

  const { mutate: syncTaxableData, isPending: isSyncing } = useSyncTaxableDataV2Mutation();

  const handleSyncTaxableData = () => {
    console.log(`🔵 Bắt đầu đồng bộ dữ liệu thuế theo ngày nhập từ ${cutoverDate}...`);
    syncTaxableData(cutoverDate);
  };

  const handleSaveCutoverDate = () => {
    if (!cutoverDateInput) return;
    updateCutoverDate(cutoverDateInput.format('YYYY-MM-DD'));
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
            Khai thuế
          </Title>
          <Text type="secondary">
            Chỉ đồng bộ các sản phẩm có hóa đơn nhập từ <strong>{dayjs(cutoverDate).format('DD/MM/YYYY')}</strong>
          </Text>
          <div className="mt-2 flex items-center gap-2">
            {canManageTaxReport && (
              <Button 
                type="primary"
                icon={<SyncOutlined spin={isSyncing} />} 
                onClick={handleSyncTaxableData}
                loading={isSyncing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Đồng bộ dữ liệu khai thuế
              </Button>
            )}
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
                    value: (record) => record.is_summary ? '' : record.sale_date,
                    excelType: 'date',
                    minWidth: 14,
                  },
                  {
                    key: 'product_name',
                    header: 'Tên sản phẩm',
                    wrapText: true,
                    minWidth: 20,
                    maxWidth: 36,
                  },
                  {
                    key: 'taxable_quantity',
                    header: 'Số lượng',
                    value: (record) => record.is_summary ? '' : record.taxable_quantity,
                    excelType: 'integer',
                    minWidth: 12,
                  },
                  {
                    key: 'unit_name',
                    header: 'Đơn vị',
                    value: (record) => record.is_summary ? '' : record.unit_name,
                    minWidth: 12,
                  },
                  {
                    key: 'tax_selling_price',
                    header: 'Đơn giá khai thuế',
                    value: (record) => record.is_summary ? '' : record.tax_selling_price,
                    excelType: 'currency',
                    minWidth: 18,
                  },
                  {
                    key: 'taxable_total_amount',
                    header: 'Thành tiền khai thuế',
                    excelType: 'currency',
                    minWidth: 20,
                  }
                ]}
              />
            )}
          </div>
        </div>
        <Space direction="vertical" size={12} className="w-full md:w-auto">
          <Card className="shadow-sm border-blue-100" bodyStyle={{ padding: '12px 24px' }}>
            <Space direction="vertical" size={8}>
              <Text type="secondary"><CalendarOutlined /> Ngày cutover:</Text>
              {isCutoverDateLoading ? (
                <Skeleton.Input active size="default" className="!w-56" />
              ) : (
                <>
                  <Space.Compact>
                    <DatePicker
                      value={cutoverDateInput}
                      onChange={(val: any) => setCutoverDateInput(val)}
                      placeholder="Ngày cutover"
                      format="DD/MM/YYYY"
                      size="large"
                      allowClear={false}
                      disabled={!canManageTaxReport}
                    />
                    {canManageTaxReport && (
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={handleSaveCutoverDate}
                        loading={isSavingCutoverDate}
                        disabled={!cutoverDateInput || !isCutoverDateDirty}
                      >
                        Lưu
                      </Button>
                    )}
                  </Space.Compact>
                  {!canManageTaxReport && (
                    <Text type="secondary" className="text-xs">
                      Chỉ người có quyền quản lý kho mới được sửa ngày cutover.
                    </Text>
                  )}
                </>
              )}
            </Space>
          </Card>

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
        </Space>
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
          <div className="grid gap-4 mb-8 md:grid-cols-3">
            <Card className="rounded-2xl border-none shadow-sm">
              <Text type="secondary">Tổng hóa đơn</Text>
              <div className="mt-2 text-2xl font-semibold text-slate-800">{summary.invoice_count}</div>
              <div className="mt-1 text-xs text-slate-500">Trong kỳ báo cáo đã chọn</div>
            </Card>
            <Card className="rounded-2xl border-none shadow-sm">
              <Text type="secondary">Tổng doanh thu bán hàng</Text>
              <div className="mt-2 text-2xl font-semibold text-emerald-700">{formatMoney(summary.total_revenue)}</div>
              <div className="mt-1 text-xs text-slate-500">Tổng doanh thu của các hóa đơn trong kỳ</div>
            </Card>
            <Card className="rounded-2xl bg-blue-600 border-none shadow-md">
              <Text className="text-blue-100">Doanh thu khai thuế</Text>
              <div className="mt-2 text-2xl font-semibold text-white">{formatMoney(summary.taxable_revenue)}</div>
              <div className="mt-1 text-xs text-blue-100">Số liệu dùng cho kê khai thuế</div>
            </Card>
          </div>

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

export default TaxRevenueReportPage;
