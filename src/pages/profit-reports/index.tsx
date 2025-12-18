/**
 * Trang Báo cáo Lợi nhuận Bán hàng - Phiên bản đầy đủ
 * Bao gồm 3 tabs: Tổng quan Mùa vụ, Theo Ruộng lúa, Chi tiết Hóa đơn
 */

import React, { useState } from 'react';
import {
  Tabs,
  Card,
  Statistic,
  Row,
  Col,
  Tag,
  Divider,
  Spin,
  Empty,
  Table,
  Input,
} from 'antd';
import ComboBox from '@/components/common/combo-box';
import {
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  PercentageOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useSeasonsQuery } from '@/queries/season';
import { useRiceCrops } from '@/queries/rice-crop';
import { useCustomersQuery } from '@/queries/customer';
import {
  useSeasonStoreProfit,
  useInvoiceProfit,
  useRiceCropProfitQuery,
  useCustomerProfitReport,
} from '@/queries/store-profit-report';
import { useInvoiceByCodeQuery } from '@/queries/sales';
import type { RiceCropProfit } from '@/types/store-profit.types';
import type { ColumnsType } from 'antd/es/table';

const ProfitReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('rice-crop');
  
  // State cho tab Season
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | undefined>();
  
  // State cho tab Rice Crop
  const [selectedRiceCropId, setSelectedRiceCropId] = useState<number | undefined>();
  const [selectedRiceCropCustomerId, setSelectedRiceCropCustomerId] = useState<number | undefined>();
  
  // State cho tab Invoice
  const [invoiceCode, setInvoiceCode] = useState<string>('');
  const [debouncedInvoiceCode, setDebouncedInvoiceCode] = useState<string>('');
  
  // Debounce tìm kiếm hóa đơn
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedInvoiceCode(invoiceCode);
    }, 1000); // Đợi 1 giây sau khi ngừng nhập
    return () => clearTimeout(timer);
  }, [invoiceCode]);

  // State cho tab Customer
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | undefined>();
  const [customerSeasonFilter, setCustomerSeasonFilter] = useState<number | undefined>();

  // State cho tìm kiếm mùa vụ
  const [seasonKeyword, setSeasonKeyword] = useState<string>('');
  
  // State cho tìm kiếm khách hàng
  const [customerKeyword, setCustomerKeyword] = useState<string>('');
  
  // Queries
  const { data: seasonsData, isLoading: isLoadingSeasons } = useSeasonsQuery({ 
    limit: 20, 
    keyword: seasonKeyword,
    sort_by: 'id',
    sort_order: 'DESC'
  });

  const { data: customersData, isLoading: isLoadingCustomers } = useCustomersQuery({ 
    limit: 20,
    keyword: customerKeyword
  });

  // Tự động chọn mùa vụ mới nhất khi dữ liệu được tải về
  React.useEffect(() => {
    const items = seasonsData?.data?.items;
    if (items && Array.isArray(items) && items.length > 0 && !selectedSeasonId) {
      // Giả định backend trả về danh sách có thể chưa sắp xếp, tìm ID lớn nhất
      const latestSeason = [...items].sort((a, b) => b.id - a.id)[0];
      if (latestSeason) {
        setSelectedSeasonId(latestSeason.id);
      }
    }
  }, [seasonsData, selectedSeasonId]);
  
  // Prepare params for Rice Crop query - React Query sẽ tự động refetch khi params thay đổi
  const riceCropQueryParams = React.useMemo(() => ({ 
    limit: 1000,
    ...(selectedSeasonId && { season_id: selectedSeasonId }),
    ...(selectedRiceCropCustomerId && { customer_id: selectedRiceCropCustomerId })
  }), [selectedSeasonId, selectedRiceCropCustomerId]);

  const { data: riceCropsData } = useRiceCrops(riceCropQueryParams, { 
    enabled: activeTab === 'rice-crop' // Chỉ gọi API khi ở tab Rice Crop
  });
  const { data: seasonProfit, isLoading: isLoadingSeasonProfit } = useSeasonStoreProfit(
    selectedSeasonId || 0
  );
  const { 
    data: riceCropProfitData, 
    isLoading: isLoadingRiceCropProfit,
    error: riceCropError,
  } = useRiceCropProfitQuery(selectedRiceCropId || 0);
  const riceCropProfit = riceCropProfitData as RiceCropProfit;

  const { 
    data: invoiceProfit, isLoading: isLoadingInvoiceProfit } = useInvoiceByCodeQuery(
    debouncedInvoiceCode
  );
  const { 
    data: customerProfit, 
    isLoading: isLoadingCustomerProfit 
  } = useCustomerProfitReport(
    selectedCustomerId || 0,
    { seasonId: customerSeasonFilter }
  );

  // Format số tiền
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  // Format phần trăm
  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Get profit color
  const getProfitColor = (value: number) => {
    return value >= 0 ? '#3f8600' : '#cf1322';
  };

  // Get margin color
  const getMarginColor = (margin: number) => {
    if (margin >= 30) return '#3f8600'; // Xanh đậm
    if (margin >= 10) return '#1890ff'; // Xanh nhạt
    return '#faad14'; // Vàng cảnh báo
  };

  // ==================== TAB 1: TỔNG QUAN MÙA VỤ ====================
  const renderSeasonOverview = () => {
    return (
      <div>
        <div className="mb-6">
          <label className="block mb-2 font-medium">Chọn mùa vụ:</label>
          <ComboBox
            style={{ width: 300 }}
            placeholder="Tìm kiếm mùa vụ..."
            value={selectedSeasonId}
            onChange={(val) => setSelectedSeasonId(val ? Number(val) : undefined)}
            onSearch={setSeasonKeyword}
            filterOption={false}
            options={seasonsData?.data?.items?.map((season: any) => ({
              value: season.id,
              label: `${season.name} (${season.year})`
            })) || []}
            isLoading={isLoadingSeasons}
          />
        </div>

        {isLoadingSeasonProfit && (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" tip="Đang tải báo cáo..." />
          </div>
        )}

        {!selectedSeasonId && !isLoadingSeasonProfit && (
          <Empty description="Vui lòng chọn mùa vụ để xem báo cáo" />
        )}

        {selectedSeasonId && seasonProfit && !isLoadingSeasonProfit && (
          <div>
            {/* Cards tổng hợp */}
            <Row gutter={[16, 16]} className="mb-6">
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Tổng Doanh thu"
                    value={seasonProfit.summary?.total_revenue || 0}
                    formatter={(value) => formatCurrency(Number(value))}
                    prefix={<DollarOutlined />}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Lợi nhuận Gộp"
                    value={seasonProfit.summary?.gross_profit || 0}
                    formatter={(value) => formatCurrency(Number(value))}
                    prefix={<RiseOutlined />}
                    valueStyle={{ color: getProfitColor(seasonProfit.summary?.gross_profit || 0) }}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Chi phí Vận hành"
                    value={seasonProfit.summary?.operating_costs || 0}
                    formatter={(value) => formatCurrency(Number(value))}
                    prefix={<FallOutlined />}
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Lợi nhuận Ròng"
                    value={seasonProfit.summary?.net_profit || 0}
                    formatter={(value) => formatCurrency(Number(value))}
                    prefix={<DollarOutlined />}
                    valueStyle={{ color: getProfitColor(seasonProfit.summary?.net_profit || 0) }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Tỷ suất lợi nhuận */}
            <Row gutter={[16, 16]} className="mb-6">
              <Col xs={24} sm={12}>
                <Card>
                  <Statistic
                    title="Tỷ suất Lợi nhuận Gộp"
                    value={seasonProfit.summary?.gross_margin || 0}
                    suffix="%"
                    prefix={<PercentageOutlined />}
                    precision={2}
                    valueStyle={{ color: getMarginColor(seasonProfit.summary?.gross_margin || 0) }}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12}>
                <Card>
                  <Statistic
                    title="Tỷ suất Lợi nhuận Ròng"
                    value={seasonProfit.summary?.net_margin || 0}
                    suffix="%"
                    prefix={<PercentageOutlined />}
                    precision={2}
                    valueStyle={{ color: getMarginColor(seasonProfit.summary?.net_margin || 0) }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Thông tin bổ sung */}
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card title="📊 Thống kê">
                  <p><strong>Tổng số hóa đơn:</strong> {seasonProfit.summary?.total_invoices || 0}</p>
                  <p><strong>Tổng số khách hàng:</strong> {seasonProfit.summary?.total_customers || 0}</p>
                  <p><strong>Giá vốn hàng bán:</strong> {formatCurrency(seasonProfit.summary?.cost_of_goods_sold || 0)}</p>
                </Card>
              </Col>

              <Col xs={24} md={12}>
                <Card title="🚚 Thống kê Giao hàng">
                  {seasonProfit.delivery_stats ? (
                    <>
                      <p><strong>Tổng số chuyến:</strong> {seasonProfit.delivery_stats.total_deliveries}</p>
                      <p><strong>Chi phí giao hàng:</strong> {formatCurrency(seasonProfit.delivery_stats.total_delivery_cost)}</p>
                      <p><strong>Chi phí TB/chuyến:</strong> {formatCurrency(seasonProfit.delivery_stats.avg_cost_per_delivery)}</p>
                    </>
                  ) : (
                    <Empty description="Không có dữ liệu giao hàng" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  )}
                </Card>
              </Col>
            </Row>

            {/* Bảng Top Customers */}
            <Row gutter={[16, 16]} className="mt-6">
              <Col span={24}>
                <Card title="🏆 Top Khách hàng mang lại lợi nhuận">
                  <Table
                    columns={[
                      { title: 'Khách hàng', dataIndex: 'customer_name', key: 'customer_name' },
                      { title: 'Số HĐ', dataIndex: 'total_invoices', key: 'total_invoices' },
                      { 
                        title: 'Doanh thu', 
                        dataIndex: 'total_revenue', 
                        key: 'total_revenue',
                        render: (val) => formatCurrency(val)
                      },
                      { 
                        title: 'Lợi nhuận', 
                        dataIndex: 'total_profit', 
                        key: 'total_profit',
                        render: (val) => (
                          <span style={{ color: getProfitColor(val), fontWeight: 'bold' }}>
                            {formatCurrency(val)}
                          </span>
                        )
                      },
                      { 
                        title: 'Tỷ suất (%)', 
                        dataIndex: 'avg_margin', 
                        key: 'avg_margin',
                        render: (val) => <Tag color={getMarginColor(val)}>{val}%</Tag>
                      },
                    ]}
                    dataSource={seasonProfit.top_customers || []}
                    rowKey="customer_id"
                    pagination={false}
                  />
                </Card>
              </Col>
            </Row>

            {/* Bảng Top Products */}
            <Row gutter={[16, 16]} className="mt-6">
              <Col span={24}>
                <Card title="📦 Danh mục sản phẩm hiệu quả">
                  <Table
                    columns={[
                      { title: 'Sản phẩm', dataIndex: 'product_name', key: 'product_name' },
                      { title: 'Số lượng bán', dataIndex: 'quantity_sold', key: 'quantity_sold' },
                      { 
                        title: 'Doanh thu', 
                        dataIndex: 'total_revenue', 
                        key: 'total_revenue',
                        render: (val) => formatCurrency(val)
                      },
                      { 
                        title: 'Lợi nhuận', 
                        dataIndex: 'total_profit', 
                        key: 'total_profit',
                        render: (val) => (
                          <span style={{ color: getProfitColor(val), fontWeight: 'bold' }}>
                            {formatCurrency(val)}
                          </span>
                        )
                      },
                      { 
                        title: 'Tỷ suất (%)', 
                        dataIndex: 'margin', 
                        key: 'margin',
                        render: (val) => <Tag color={getMarginColor(val)}>{val}%</Tag>
                      },
                    ]}
                    dataSource={seasonProfit.top_products || []}
                    rowKey="product_id"
                    pagination={false}
                  />
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </div>
    );
  };

  // ==================== TAB 2: THEO Ruộng lúa ====================
  const renderRiceCropReport = () => {
    // Dữ liệu đã được lọc từ Server thông qua useRiceCrops params
    const filteredRiceCrops = riceCropsData?.data || [];

    // Columns cho bảng invoices của rice crop
    const invoiceColumns: ColumnsType<any> = [
      {
        title: 'Mã HĐ',
        dataIndex: 'invoice_code',
        key: 'invoice_code',
      },
      {
        title: 'Ngày',
        dataIndex: 'date',
        key: 'date',
        render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
      },
      {
        title: 'Doanh thu',
        dataIndex: 'revenue',
        key: 'revenue',
        render: (value: number) => formatCurrency(value),
      },
      {
        title: 'Giá vốn',
        dataIndex: 'cost',
        key: 'cost',
        render: (value: number) => formatCurrency(value),
      },
      {
        title: 'Lợi nhuận',
        dataIndex: 'profit',
        key: 'profit',
        render: (value: number) => (
          <span style={{ color: getProfitColor(value) }}>
            {formatCurrency(value)}
          </span>
        ),
      },
      {
        title: 'Tỷ suất (%)',
        dataIndex: 'margin',
        key: 'margin',
        render: (value: number) => (
          <Tag color={getMarginColor(value)}>{formatPercent(value)}</Tag>
        ),
      },
    ];

    return (
      <div>
        <div className="mb-6 flex gap-4">
          <div style={{ width: 400 }}>
            <label className="block mb-2 font-medium">Chọn Khách hàng (Lọc ruộng lúa):</label>
            <ComboBox
              style={{ width: '100%' }}
              placeholder="Tìm kiếm khách hàng..."
              value={selectedRiceCropCustomerId}
              onChange={(val) => {
                setSelectedRiceCropCustomerId(val ? Number(val) : undefined);
                setSelectedRiceCropId(undefined); // Reset ruộng lúa khi đổi khách
              }}
              onSearch={setCustomerKeyword}
              filterOption={false}
              options={customersData?.data?.items?.map((customer: any) => ({
                value: customer.id,
                label: `${customer.name} - ${customer.phone || ''}`
              })) || []}
              isLoading={isLoadingCustomers}
            />
          </div>

          <div style={{ width: 400 }}>
            <label className="block mb-2 font-medium">Chọn Ruộng lúa:</label>
            <ComboBox
              style={{ width: '100%' }}
              placeholder="Chọn Ruộng lúa"
              value={selectedRiceCropId}
              onChange={(val) => setSelectedRiceCropId(Number(val))}
              options={filteredRiceCrops?.map((crop: any) => ({
                value: crop.id,
                label: `${crop.field_name} - ${crop.customer?.name || ''} (${crop.season?.name || ''})`
              })) || []}
              disabled={!filteredRiceCrops || filteredRiceCrops.length === 0}
            />
          </div>
        </div>

        {isLoadingRiceCropProfit && (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" tip="Đang tải báo cáo Ruộng lúa..." />
          </div>
        )}

        {!selectedRiceCropId && !isLoadingRiceCropProfit && (
          <Empty description="Vui lòng chọn Ruộng lúa để xem báo cáo lợi nhuận" />
        )}

        {selectedRiceCropId && riceCropError && (
          <Empty 
            description={
              <div>
                <p className="text-red-500 font-medium">Không tìm thấy dữ liệu báo cáo</p>
                <p className="text-gray-500 text-sm mt-2">
                  Ruộng lúa này chưa có hóa đơn bán hàng nào. Vui lòng chọn Ruộng lúa khác hoặc tạo hóa đơn cho Ruộng lúa này.
                </p>
              </div>
            }
          />
        )}

        {selectedRiceCropId && riceCropProfit && !isLoadingRiceCropProfit && (
          <div>
            {/* Thông tin Ruộng lúa */}
            <Card title="Thông tin Ruộng lúa" className="mb-6">
              <Row gutter={16}>
                <Col span={8}>
                  <p><strong>Tên ruộng:</strong> {riceCropProfit.field_name}</p>
                </Col>
                <Col span={8}>
                  <p><strong>Khách hàng:</strong> {riceCropProfit.customer_name}</p>
                </Col>
                <Col span={8}>
                  <p><strong>Mùa vụ:</strong> {riceCropProfit.season_name}</p>
                </Col>
              </Row>
            </Card>

            {/* Cards tổng hợp */}
            <Row gutter={[16, 16]} className="mb-6">
              <Col xs={24} sm={12} lg={4}>
                <Card>
                  <Statistic
                    title="Tổng Doanh thu"
                    value={riceCropProfit.summary?.total_revenue || 0}
                    formatter={(val) => formatCurrency(Number(val))}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              
              <Col xs={24} sm={12} lg={4}>
                <Card>
                  <Statistic
                    title="Lợi nhuận Gộp"
                    value={riceCropProfit.summary?.gross_profit || 0}
                    formatter={(val) => formatCurrency(Number(val))}
                    valueStyle={{ color: getProfitColor(riceCropProfit.summary?.gross_profit || 0) }}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={4}>
                <Card>
                  <Statistic
                    title="CP Vận hành"
                    value={riceCropProfit.summary?.operating_costs || 0}
                    formatter={(val) => formatCurrency(Number(val))}
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={4}>
                <Card>
                  <Statistic
                    title="CP Canh tác"
                    value={riceCropProfit.summary?.production_costs || 0}
                    formatter={(val) => formatCurrency(Number(val))}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={8}>
                <Card>
                  <Statistic
                    title="LỢI NHUẬN RÒNG"
                    value={riceCropProfit.summary?.net_profit || 0}
                    formatter={(val) => formatCurrency(Number(val))}
                    valueStyle={{ 
                      color: getProfitColor(riceCropProfit.summary?.net_profit || 0),
                      fontSize: '24px',
                      fontWeight: 'bold'
                    }}
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    Tỷ suất: {formatPercent(riceCropProfit.summary?.net_margin || 0)}
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Chi tiết chi phí */}
            <Row gutter={[16, 16]} className="mb-6">
              <Col xs={24} md={12}>
                <Card title="⚙️ Chi phí Vận hành (Quản lý)">
                  <Table
                    columns={[
                      { title: 'Tên chi phí', dataIndex: 'name', key: 'name' },
                      { 
                        title: 'Số tiền', 
                        dataIndex: 'amount', 
                        key: 'amount',
                        render: (val) => formatCurrency(val)
                      },
                      { 
                        title: 'Ngày', 
                        dataIndex: 'date', 
                        key: 'date',
                        render: (date) => new Date(date).toLocaleDateString('vi-VN')
                      },
                    ]}
                    dataSource={riceCropProfit.operating_costs_breakdown || []}
                    pagination={false}
                    size="small"
                  />
                </Card>
              </Col>

              <Col xs={24} md={12}>
                <Card title="🌱 Chi phí Canh tác (Phân, Thuốc...)">
                  <Table
                    columns={[
                      { title: 'Vật tư', dataIndex: 'name', key: 'name' },
                      { 
                        title: 'Số tiền', 
                        dataIndex: 'amount', 
                        key: 'amount',
                        render: (val) => formatCurrency(val)
                      },
                      { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity' },
                    ]}
                    dataSource={riceCropProfit.production_costs_breakdown || []}
                    pagination={false}
                    size="small"
                  />
                </Card>
              </Col>
            </Row>

            {/* Danh sách hóa đơn gắn với ruộng này */}
            <Card title="📄 Hóa đơn liên quan">
              <Table
                columns={[
                  { title: 'Mã HĐ', dataIndex: 'invoice_code', key: 'invoice_code' },
                  { 
                    title: 'Ngày', 
                    dataIndex: 'date', 
                    key: 'date',
                    render: (date) => new Date(date).toLocaleDateString('vi-VN')
                  },
                  { 
                    title: 'Doanh thu', 
                    dataIndex: 'revenue', 
                    key: 'revenue',
                    render: (val) => formatCurrency(val)
                  },
                  { 
                    title: 'Lợi nhuận', 
                    dataIndex: 'profit', 
                    key: 'profit',
                    render: (val) => (
                      <span style={{ color: getProfitColor(val), fontWeight: 'bold' }}>
                        {formatCurrency(val)}
                      </span>
                    )
                  },
                ]}
                dataSource={riceCropProfit.invoices || []}
                rowKey="invoice_id"
              />
            </Card>
          </div>
        )}
      </div>
    );
  };

  // ==================== TAB 3: CHI TIẾT HÓA ĐƠN ====================
  const renderInvoiceDetail = () => {
    // Columns cho bảng chi tiết sản phẩm
    const itemColumns: ColumnsType<any> = [
      {
        title: 'Sản phẩm',
        dataIndex: 'product_name',
        key: 'product_name',
      },
      {
        title: 'SL',
        dataIndex: 'quantity',
        key: 'quantity',
      },
      {
        title: 'Giá bán',
        dataIndex: 'unit_price',
        key: 'unit_price',
        render: (value: number) => formatCurrency(value),
      },
      {
        title: 'Giá vốn',
        dataIndex: 'avg_cost',
        key: 'avg_cost',
        render: (value: number) => formatCurrency(value),
      },
      {
        title: 'Tổng giá vốn',
        dataIndex: 'cogs',
        key: 'cogs',
        render: (value: number) => formatCurrency(value),
      },
      {
        title: 'Lợi nhuận',
        dataIndex: 'profit',
        key: 'profit',
        render: (value: number) => (
          <span style={{ color: getProfitColor(value), fontWeight: 'bold' }}>
            {formatCurrency(value)}
          </span>
        ),
      },
      {
        title: 'Tỷ suất (%)',
        dataIndex: 'margin',
        key: 'margin',
        render: (value: number) => (
          <Tag color={getMarginColor(value)}>{formatPercent(value)}</Tag>
        ),
      },
    ];

    return (
      <div>
        <div className="mb-6">
          <label className="block mb-2 font-medium">Nhập Mã Hóa đơn:</label>
          <Input
            style={{ width: 300 }}
            placeholder="VD: HD001, HD002..."
            value={invoiceCode}
            onChange={(e) => setInvoiceCode(e.target.value)}
            prefix={<SearchOutlined />}
          />
        </div>

        {isLoadingInvoiceProfit && (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" tip="Đang tải chi tiết hóa đơn..." />
          </div>
        )}

        {!invoiceCode && !isLoadingInvoiceProfit && (
          <Empty description="Vui lòng nhập mã hóa đơn để xem báo cáo lợi nhuận" />
        )}
        
        {invoiceCode && !invoiceProfit && !isLoadingInvoiceProfit && (
          <Empty description="Không tìm thấy hóa đơn với mã này" />
        )}

        {invoiceCode && invoiceProfit && !isLoadingInvoiceProfit && (
          <div className="max-w-4xl mx-auto">
            <Card title={`Chi tiết Lợi nhuận Hóa đơn: ${invoiceProfit.invoice_code}`}>
              <div className="mb-6">
                <Row gutter={16}>
                  <Col span={12}>
                    <p><strong>Khách hàng:</strong> {invoiceProfit.customer_name}</p>
                    <p><strong>Ngày tạo:</strong> {new Date(invoiceProfit.created_at).toLocaleString('vi-VN')}</p>
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Lợi nhuận gộp"
                      value={invoiceProfit.gross_profit}
                      formatter={(val) => formatCurrency(Number(val))}
                      valueStyle={{ color: getProfitColor(invoiceProfit.gross_profit) }}
                    />
                    <div className="mt-1">
                      <Tag color={getMarginColor(invoiceProfit.gross_margin)}>
                        Tỷ suất: {invoiceProfit.gross_margin}%
                      </Tag>
                    </div>
                  </Col>
                </Row>
              </div>

              <Divider>Chi tiết từng sản phẩm</Divider>

              <Table
                columns={[
                  { title: 'Sản phẩm', dataIndex: 'product_name', key: 'product_name' },
                  { title: 'SL', dataIndex: 'quantity', key: 'quantity' },
                  { 
                    title: 'Giá bán', 
                    dataIndex: 'unit_price', 
                    key: 'unit_price',
                    render: (val) => formatCurrency(val)
                  },
                  { 
                    title: 'Giá vốn', 
                    dataIndex: 'avg_cost', 
                    key: 'avg_cost',
                    render: (val) => formatCurrency(val)
                  },
                  { 
                    title: 'Lợi nhuận', 
                    dataIndex: 'profit', 
                    key: 'profit',
                    render: (val) => (
                      <span style={{ color: getProfitColor(val), fontWeight: 'bold' }}>
                        {formatCurrency(val)}
                      </span>
                    )
                  },
                ]}
                dataSource={invoiceProfit.item_details || []}
                pagination={false}
                rowKey="product_name"
              />

              {invoiceProfit.gift_value > 0 && (
                <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded">
                  <p className="text-orange-800 mb-1">🎁 <strong>Quà tặng đi kèm:</strong> {invoiceProfit.gift_description}</p>
                  <p className="text-orange-800">
                    Giá trị quà tặng: <strong>-{formatCurrency(invoiceProfit.gift_value)}</strong> (Đã trừ vào lợi nhuận ròng)
                  </p>
                  <div className="mt-2 text-lg font-bold">
                    LỢI NHUẬN RÒNG SAU QUÀ TẶNG: 
                    <span className="ml-2" style={{ color: getProfitColor(invoiceProfit.net_profit) }}>
                      {formatCurrency(invoiceProfit.net_profit)}
                    </span>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    );
  };

  // ==================== TAB 4: THEO KHÁCH HÀNG ====================
  const renderCustomerReport = () => {
    return (
      <div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block mb-2 font-medium">Chọn khách hàng:</label>
            <ComboBox
              style={{ width: '100%' }}
              placeholder="Tìm kiếm khách hàng..."
              value={selectedCustomerId}
              onChange={(val) => setSelectedCustomerId(val ? Number(val) : undefined)}
              onSearch={setCustomerKeyword}
              filterOption={false}
              options={customersData?.data?.items?.map((customer: any) => ({
                value: customer.id,
                label: `${customer.name} - ${customer.phone || ''}`
              })) || []}
              isLoading={isLoadingCustomers}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Lọc theo mùa vụ (tùy chọn):</label>
            <ComboBox
              style={{ width: '100%' }}
              placeholder="Tìm kiếm mùa vụ..."
              value={customerSeasonFilter}
              onChange={(val) => setCustomerSeasonFilter(val ? Number(val) : undefined)}
              onSearch={setSeasonKeyword}
              filterOption={false}
              options={seasonsData?.data?.items?.map((season: any) => ({
                value: season.id,
                label: `${season.name} (${season.year})`
              })) || []}
              isLoading={isLoadingSeasons}
            />
          </div>
        </div>

        {isLoadingCustomerProfit && (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" tip="Đang tải báo cáo khách hàng..." />
          </div>
        )}

        {!selectedCustomerId && !isLoadingCustomerProfit && (
          <Empty description="Vui lòng chọn khách hàng để xem báo cáo lợi nhuận" />
        )}

        {selectedCustomerId && customerProfit && !isLoadingCustomerProfit && (
          <div>
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
              <h2 className="text-xl font-bold text-blue-800 mb-2">👤 Khách hàng: {customerProfit.customer_name}</h2>
              <Row gutter={16}>
                <Col span={12}>
                  <p><strong>Số điện thoại:</strong> {customerProfit.customer_phone || '-'}</p>
                </Col>
                <Col span={12}>
                  <p><strong>Email:</strong> {customerProfit.customer_email || '-'}</p>
                </Col>
              </Row>
            </div>

            {/* Lifetime Summary */}
            {customerProfit.lifetime_summary && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">💎 Tổng hợp trọn đời (Lifetime)</h3>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={6}>
                    <Card style={{ borderLeft: '4px solid #1890ff' }}>
                      <Statistic
                        title="Tổng số HĐ"
                        value={customerProfit.lifetime_summary.total_invoices}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card style={{ borderLeft: '4px solid #3f8600' }}>
                      <Statistic
                        title="Doanh thu trọn đời"
                        value={customerProfit.lifetime_summary.total_revenue}
                        formatter={(value) => formatCurrency(Number(value))}
                        valueStyle={{ color: '#3f8600' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card style={{ borderLeft: '4px solid #52c41a' }}>
                      <Statistic
                        title="Lợi nhuận trọn đời"
                        value={customerProfit.lifetime_summary.total_profit}
                        formatter={(value) => formatCurrency(Number(value))}
                        valueStyle={{ color: getProfitColor(customerProfit.lifetime_summary.total_profit) }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card style={{ borderLeft: '4px solid #faad14' }}>
                      <Statistic
                        title="Tỷ suất TB"
                        value={customerProfit.lifetime_summary.avg_margin}
                        suffix="%"
                        precision={2}
                        valueStyle={{ color: getMarginColor(customerProfit.lifetime_summary.avg_margin) }}
                      />
                    </Card>
                  </Col>
                </Row>
              </div>
            )}

            {/* Current Season Summary */}
            {customerSeasonFilter && customerProfit.current_season_summary && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">
                  📊 Lợi nhuận vụ này: {customerProfit.current_season_summary.season_name}
                </h3>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={3}>
                    <Card>
                      <Statistic
                        title="Số HĐ"
                        value={customerProfit.current_season_summary.total_invoices}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={7}>
                    <Card>
                      <Statistic
                        title="Doanh thu"
                        value={customerProfit.current_season_summary.total_revenue}
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={7}>
                    <Card>
                      <Statistic
                        title="Lợi nhuận"
                        value={customerProfit.current_season_summary.total_profit}
                        formatter={(value) => formatCurrency(Number(value))}
                        valueStyle={{ color: getProfitColor(customerProfit.current_season_summary.total_profit) }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={7}>
                    <Card>
                      <Statistic
                        title="Tỷ suất"
                        value={customerProfit.current_season_summary.avg_margin}
                        suffix="%"
                        precision={2}
                        valueStyle={{ color: getMarginColor(customerProfit.current_season_summary.avg_margin) }}
                      />
                    </Card>
                  </Col>
                </Row>
              </div>
            )}

            {/* Bảng danh sách hóa đơn */}
            <Card title="Danh sách Hóa đơn">
              <Table
                columns={[
                  {
                    title: 'Mã HĐ',
                    dataIndex: 'invoice_code',
                    key: 'invoice_code',
                  },
                  {
                    title: 'Ngày',
                    dataIndex: 'date',
                    key: 'date',
                    render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
                  },
                  {
                    title: 'Mùa vụ',
                    dataIndex: 'season_name',
                    key: 'season_name',
                    render: (name: string) => name || '-',
                  },
                  {
                    title: 'Doanh thu',
                    dataIndex: 'revenue',
                    key: 'revenue',
                    render: (value: number) => formatCurrency(value),
                  },
                  {
                    title: 'Giá vốn',
                    dataIndex: 'cost',
                    key: 'cost',
                    render: (value: number) => formatCurrency(value),
                  },
                  {
                    title: 'Lợi nhuận',
                    dataIndex: 'profit',
                    key: 'profit',
                    render: (value: number) => (
                      <span style={{ color: getProfitColor(value), fontWeight: 'bold' }}>
                        {formatCurrency(value)}
                      </span>
                    ),
                  },
                  {
                    title: 'Tỷ suất (%)',
                    dataIndex: 'margin',
                    key: 'margin',
                    render: (value: number) => (
                      <Tag color={getMarginColor(value)}>{formatPercent(value)}</Tag>
                    ),
                  },
                ]}
                dataSource={customerProfit.invoices || []}
                rowKey={(record) => `inv-${record.invoice_id}`}
                pagination={{ pageSize: 10 }}
              />
            </Card>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">📊 Báo cáo Lợi nhuận Bán hàng</h1>

      <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
        <Tabs.TabPane tab="Tổng quan Mùa vụ" key="season">
          {renderSeasonOverview()}
        </Tabs.TabPane>

        <Tabs.TabPane tab="Theo Ruộng lúa" key="rice-crop">
          {renderRiceCropReport()}
        </Tabs.TabPane>

        <Tabs.TabPane tab="Chi tiết Hóa đơn" key="invoice">
          {renderInvoiceDetail()}
        </Tabs.TabPane>

        <Tabs.TabPane tab="Theo Khách hàng" key="customer">
          {renderCustomerReport()}
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default ProfitReportsPage;
