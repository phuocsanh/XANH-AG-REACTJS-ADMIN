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
  Tooltip,
} from 'antd';
import dayjs from 'dayjs';
import ComboBox from '@/components/common/combo-box';
import {
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  PercentageOutlined,
  SearchOutlined,
  GiftOutlined,
  CarOutlined,
  CarryOutOutlined,
  SettingOutlined,
  PieChartOutlined,
  DashboardOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { useSeasonsQuery } from '@/queries/season';
import { useRiceCrops } from '@/queries/rice-crop';
import { useCustomersQuery } from '@/queries/customer';
import {
  useSeasonStoreProfit,
  useInvoiceProfit,
  useRiceCropProfitQuery,
  useCustomerProfitReport,
  useInvoiceProfitByCodeQuery,
} from '@/queries/store-profit-report';
import type { RiceCropProfit } from '@/models/store-profit';
import type { ColumnsType } from 'antd/es/table';

const ProfitReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('season');
  
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
  const [guestCustomerName, setGuestCustomerName] = useState<string>('');
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
    data: invoiceProfit, isLoading: isLoadingInvoiceProfit } = useInvoiceProfitByCodeQuery(
    debouncedInvoiceCode
  );
  const { 
    data: customerProfit, 
    isLoading: isLoadingCustomerProfit 
  } = useCustomerProfitReport(
    selectedCustomerId || 0,
    { 
      customerName: guestCustomerName,
      seasonId: customerSeasonFilter 
    }
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

  /**
   * Thành phần Card thống kê kiểu Premium
   * Tối ưu hiển thị cho cả Desktop và Mobile
   */
  const ReportStatCard = ({ 
    title, 
    value, 
    icon, 
    color = 'blue', 
    suffix, 
    secondaryValue, 
    secondaryTitle,
    isNetProfit = false 
  }: any) => {
    const colorMap: any = {
      green: { bg: '#f6ffed', border: '#b7eb8f', icon: '#52c41a', text: '#3f8600' },
      blue: { bg: '#e6f7ff', border: '#91d5ff', icon: '#1890ff', text: '#0050b3' },
      red: { bg: '#fff1f0', border: '#ffa39e', icon: '#f5222d', text: '#cf1322' },
      orange: { bg: '#fff7e6', border: '#ffd591', icon: '#fa8c16', text: '#d46b08' },
      purple: { bg: '#f9f0ff', border: '#d3adf7', icon: '#722ed1', text: '#531dab' },
      gold: { bg: '#fffbe6', border: '#ffe58f', icon: '#faad14', text: '#ad8b00' },
    };

    const s = colorMap[color] || colorMap.blue;

    return (
      <Card 
        style={{ 
          height: '100%', 
          borderRadius: '12px', 
          border: `1px solid ${isNetProfit ? s.border : '#f0f0f0'}`,
          background: isNetProfit ? s.bg : '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          transition: 'all 0.3s ease',
          overflow: 'hidden'
        }}
        bodyStyle={{ padding: '16px' }}
        className="hover:shadow-md transition-all duration-300"
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-start mb-2">
            <span style={{ color: '#8c8c8c', fontSize: '13px', fontWeight: 500, lineHeight: '1.4' }}>{title}</span>
            <div style={{ 
              backgroundColor: isNetProfit ? '#fff' : s.bg, 
              padding: '6px', 
              borderRadius: '8px',
              color: s.icon,
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isNetProfit ? `0 2px 4px ${s.border}` : 'none',
              minWidth: '32px',
              height: '32px'
            }}>
              {icon}
            </div>
          </div>
          <div className="mt-auto">
            <div style={{ 
              fontSize: '18px', 
              fontWeight: 700, 
              color: s.text,
              lineHeight: '1.2',
              wordBreak: 'break-word'
            }}>
              {typeof value === 'number' ? formatCurrency(value) : value}
              {suffix && <span style={{ fontSize: '12px', fontWeight: 400, marginLeft: '4px', color: '#bfbfbf' }}>{suffix}</span>}
            </div>
            {secondaryValue !== undefined && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#8c8c8c', borderTop: '1px solid #f5f5f5', paddingTop: '8px' }}>
                {secondaryTitle}: <span style={{ fontWeight: 600, color: '#595959' }}>{secondaryValue}</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
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
            {/* Cards tổng hợp Premium */}
            <Row gutter={[12, 12]} className="mb-6">
              <Col xs={12} sm={12} md={8} lg={4}>
                <ReportStatCard
                  title="Tổng Doanh thu"
                  value={seasonProfit.summary?.total_revenue || 0}
                  icon={<DollarOutlined />}
                  color="blue"
                />
              </Col>
              
              <Col xs={12} sm={12} md={8} lg={4}>
                <ReportStatCard
                  title="Lợi nhuận Gộp"
                  value={seasonProfit.summary?.gross_profit || 0}
                  icon={<RiseOutlined />}
                  color="green"
                  secondaryValue={formatPercent(seasonProfit.summary?.gross_margin || 0)}
                  secondaryTitle="Tỷ suất gộp"
                />
              </Col>

              <Col xs={12} sm={12} md={8} lg={4}>
                <ReportStatCard
                  title="Chi phí Dịch vụ"
                  value={seasonProfit.summary?.service_costs || 0}
                  icon={<CarryOutOutlined />}
                  color="blue"
                />
              </Col>

              <Col xs={12} sm={12} md={8} lg={4}>
                <ReportStatCard
                  title="Chi phí Quà tặng"
                  value={seasonProfit.summary?.gift_costs || 0}
                  icon={<GiftOutlined />}
                  color="red"
                />
              </Col>

              <Col xs={12} sm={12} md={8} lg={4}>
                <ReportStatCard
                  title="Chi phí Giao hàng"
                  value={seasonProfit.summary?.delivery_costs || 0}
                  icon={<CarOutlined />}
                  color="orange"
                />
              </Col>

              <Col xs={12} sm={12} md={8} lg={4}>
                <ReportStatCard
                  title="Chi phí Vận hành"
                  value={seasonProfit.summary?.operating_costs || 0}
                  icon={<SettingOutlined />}
                  color="purple"
                />
              </Col>
              <Col xs={12} sm={12} md={8} lg={4}>
                <ReportStatCard
                  title="LỢI NHUẬN RÒNG"
                  value={seasonProfit.summary?.net_profit || 0}
                  icon={<PieChartOutlined />}
                  color="green"
                  isNetProfit={true}
                  secondaryValue={formatPercent(seasonProfit.summary?.net_margin || 0)}
                  secondaryTitle="Tỷ suất ròng"
                />
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
            <Row gutter={[16, 16]} className="mb-6">
              <Col xs={24} lg={8}>
                <Card title="📋 Danh sách Chi phí Dịch vụ" size="small" bodyStyle={{ padding: 0 }}>
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
                    dataSource={(seasonProfit.farm_service_costs_breakdown || []).filter((c: any) => c.type === 'service')}
                    pagination={{ pageSize: 5 }}
                    size="small"
                  />
                </Card>
              </Col>

              <Col xs={24} lg={8}>
                <Card title="🎁 Danh sách Quà tặng" size="small" bodyStyle={{ padding: 0 }}>
                  <Table
                    columns={[
                      { title: 'Quà tặng', dataIndex: 'name', key: 'name' },
                      { 
                        title: 'Giá trị', 
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
                    dataSource={(seasonProfit.farm_service_costs_breakdown || []).filter((c: any) => c.type !== 'service')}
                    pagination={{ pageSize: 5 }}
                    size="small"
                  />
                </Card>
              </Col>
              
              <Col xs={24} lg={8}>
                <Card title="⚙️ Chi phí Vận hành Cửa hàng" size="small" bodyStyle={{ padding: 0 }}>
                  <Table
                    columns={[
                      { title: 'Tên', dataIndex: 'name', key: 'name' },
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
                    dataSource={seasonProfit.operating_costs_breakdown || []}
                    pagination={{ pageSize: 5 }}
                    size="small"
                  />
                </Card>
              </Col>
            </Row>

            {/* Bảng Top Customers */}
            <Row gutter={[16, 16]} className="mt-6">
              <Col span={24}>
                <Card title="🏆 Top Khách hàng mang lại lợi nhuận">
                  <Table
                    columns={[
                      { 
                        title: 'Khách hàng', 
                        dataIndex: 'customer_name', 
                        key: 'customer_name', 
                        width: 180, 
                        render: (text, record: any) => (
                          <div 
                            style={{ minWidth: 160, fontWeight: 500, whiteSpace: 'normal', color: '#1890ff', cursor: 'pointer' }}
                            onClick={() => {
                              setActiveTab('customer');
                              if (record.customer_id) {
                                setSelectedCustomerId(record.customer_id);
                                setGuestCustomerName('');
                              } else {
                                setSelectedCustomerId(0);
                                setGuestCustomerName(record.customer_name);
                              }
                            }}
                          >
                            {text}
                          </div>
                        )
                      },
                      { title: 'Số HĐ', dataIndex: 'total_invoices', key: 'total_invoices', width: 100 },
                      { 
                        title: 'Doanh thu', 
                        dataIndex: 'total_revenue', 
                        key: 'total_revenue',
                        width: 160,
                        render: (val) => formatCurrency(val)
                      },
                      { 
                        title: 'Lợi nhuận', 
                        dataIndex: 'total_profit', 
                        key: 'total_profit',
                        width: 160,
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
                        width: 120,
                        render: (val) => <Tag color={getMarginColor(val)}>{val}%</Tag>
                      },
                    ]}
                    dataSource={seasonProfit.top_customers || []}
                    rowKey="customer_id"
                    pagination={false}
                    scroll={{ x: 1000 }}
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
                      { 
                        title: 'Sản phẩm', 
                        dataIndex: 'product_name', 
                        key: 'product_name', 
                        width: 250, 
                        render: (text) => <div style={{ minWidth: 220, fontWeight: 500, whiteSpace: 'normal' }}>{text}</div>
                      },
                      { title: 'Số lượng bán', dataIndex: 'quantity_sold', key: 'quantity_sold', width: 120 },
                      { 
                        title: 'Doanh thu', 
                        dataIndex: 'total_revenue', 
                        key: 'total_revenue',
                        width: 160,
                        render: (val) => formatCurrency(val)
                      },
                      { 
                        title: 'Lợi nhuận', 
                        dataIndex: 'total_profit', 
                        key: 'total_profit',
                        width: 160,
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
                        width: 120,
                        render: (val) => <Tag color={getMarginColor(val)}>{val}%</Tag>
                      },
                    ]}
                    dataSource={seasonProfit.top_products || []}
                    rowKey="product_id"
                    pagination={false}
                    scroll={{ x: 1100 }}
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
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12}>
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
          </Col>

          <Col xs={24} sm={12}>
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
          </Col>
        </Row>

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

            {/* Cards tổng hợp Premium */}
            <Row gutter={[12, 12]} className="mb-6">
              <Col xs={12} sm={12} md={8} lg={4}>
                <ReportStatCard
                  title="Doanh thu"
                  value={riceCropProfit.summary?.total_revenue || 0}
                  icon={<DollarOutlined />}
                  color="blue"
                />
              </Col>
              
              <Col xs={12} sm={12} md={8} lg={4}>
                <ReportStatCard
                  title="Lợi nhuận Gộp"
                  value={riceCropProfit.summary?.gross_profit || 0}
                  icon={<RiseOutlined />}
                  color="green"
                  secondaryValue={formatPercent(riceCropProfit.summary?.avg_margin || 0)}
                  secondaryTitle="Tỷ suất gộp"
                />
              </Col>

              <Col xs={12} sm={12} md={8} lg={4}>
                <ReportStatCard
                  title="Chi phí Dịch vụ"
                  value={riceCropProfit.summary?.service_costs || 0}
                  icon={<CarryOutOutlined />}
                  color="blue"
                />
              </Col>

              <Col xs={12} sm={12} md={8} lg={4}>
                <ReportStatCard
                  title="Chi phí Quà tặng"
                  value={riceCropProfit.summary?.gift_costs || 0}
                  icon={<GiftOutlined />}
                  color="red"
                />
              </Col>

              <Col xs={12} sm={12} md={8} lg={4}>
                <ReportStatCard
                  title="Chi phí Giao hàng"
                  value={riceCropProfit.summary?.delivery_costs || 0}
                  icon={<CarOutlined />}
                  color="orange"
                />
              </Col>

              <Col xs={12} sm={12} md={8} lg={4}>
                <ReportStatCard
                  title="LỢI NHUẬN RÒNG"
                  value={riceCropProfit.summary?.net_profit || 0}
                  icon={<PieChartOutlined />}
                  color="green"
                  isNetProfit={true}
                  secondaryValue={formatPercent(riceCropProfit.summary?.net_margin || 0)}
                  secondaryTitle="Tỷ suất ròng"
                />
              </Col>
            </Row>


            {/* Chi tiết chi phí */}
            <Row gutter={[16, 16]} className="mb-6">
              <Col xs={24} lg={12}>
                <Card title="📋 Chi phí Dịch vụ" size="small" bodyStyle={{ padding: 0 }}>
                  <Table
                    columns={[
                      { title: 'Tên', dataIndex: 'name', key: 'name' },
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
                        render: (date) => new Date(date!).toLocaleDateString('vi-VN')
                      },
                    ]}
                    dataSource={(riceCropProfit.farm_service_costs_breakdown || []).filter((c: any) => c.type === 'service')}
                    pagination={{ pageSize: 5 }}
                    size="small"
                    scroll={{ x: true }}
                  />
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card title="🎁 Quà tặng" size="small" bodyStyle={{ padding: 0 }}>
                  <Table
                    columns={[
                      { title: 'Tên', dataIndex: 'name', key: 'name' },
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
                        render: (date) => new Date(date!).toLocaleDateString('vi-VN')
                      },
                    ]}
                    dataSource={(riceCropProfit.farm_service_costs_breakdown || []).filter((c: any) => c.type !== 'service')}
                    pagination={{ pageSize: 5 }}
                    size="small"
                    scroll={{ x: true }}
                  />
                </Card>
              </Col>


            </Row>

            {/* Danh sách hóa đơn gắn với ruộng này */}
            <Card title="📄 Hóa đơn liên quan">
              <Table
                columns={[
                  { 
                    title: 'Mã HĐ', 
                    dataIndex: 'invoice_code', 
                    key: 'invoice_code',
                    render: (code) => (
                      <Tooltip title={code}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                          {code}
                        </div>
                      </Tooltip>
                    )
                  },
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
                scroll={{ x: true }}
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
        width: 250,
        render: (text: string) => <div style={{ minWidth: 220, fontWeight: 500, whiteSpace: 'normal' }}>{text}</div>
      },
      {
        title: 'SL',
        dataIndex: 'quantity',
        key: 'quantity',
        width: 80,
      },
      {
        title: 'Giá bán',
        dataIndex: 'unit_price',
        key: 'unit_price',
        width: 140,
        render: (value: number) => formatCurrency(value),
      },
      {
        title: 'Giá vốn',
        dataIndex: 'avg_cost',
        key: 'avg_cost',
        width: 140,
        render: (value: number) => formatCurrency(value),
      },
      {
        title: 'Tổng giá vốn',
        dataIndex: 'cogs',
        key: 'cogs',
        width: 160,
        render: (value: number) => formatCurrency(value),
      },
      {
        title: 'Lợi nhuận',
        dataIndex: 'profit',
        key: 'profit',
        width: 160,
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
        width: 120,
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
            onChange={(e) => setInvoiceCode(e.target.value.trim())}
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
              {/* Tổng quan Lợi nhuận và Chi phí */}
              <Row gutter={[12, 12]} className="mb-6">
                <Col xs={12} sm={12} md={6}>
                  <Card style={{ height: '100%', borderLeft: '4px solid #52c41a' }}>
                    <Statistic
                      title="💰 Lợi nhuận gộp"
                      value={invoiceProfit.gross_profit}
                      formatter={(val) => formatCurrency(Number(val))}
                      valueStyle={{ color: '#52c41a', fontSize: '16px', fontWeight: 'bold' }}
                    />
                    <div className="mt-1 text-xs text-gray-600">
                      Tỷ suất: {invoiceProfit.gross_margin}%
                    </div>
                  </Card>
                </Col>

                <Col xs={12} sm={12} md={6}>
                  <Card style={{ height: '100%', borderLeft: '4px solid #fa8c16' }}>
                    <Statistic
                      title="🎁 Quà tặng"
                      value={invoiceProfit.gift_value || 0}
                      formatter={(val) => formatCurrency(Number(val))}
                      valueStyle={{ color: '#fa8c16', fontSize: '16px' }}
                    />
                    {invoiceProfit.gift_description && (
                      <div className="mt-1 text-xs text-gray-600 truncate">
                        {invoiceProfit.gift_description}
                      </div>
                    )}
                  </Card>
                </Col>

                <Col xs={12} sm={12} md={6}>
                  <Card style={{ height: '100%', borderLeft: '4px solid #1890ff' }}>
                    <Statistic
                      title="🚚 Giao hàng"
                      value={invoiceProfit.delivery_cost || 0}
                      formatter={(val) => formatCurrency(Number(val))}
                      valueStyle={{ color: '#1890ff', fontSize: '16px' }}
                    />
                  </Card>
                </Col>

                <Col xs={12} sm={12} md={6}>
                  <Card style={{ height: '100%', borderLeft: '4px solid #13c2c2', backgroundColor: '#e6fffb' }}>
                    <Statistic
                      title="✅ LỢI NHUẬN RÒNG"
                      value={invoiceProfit.net_profit}
                      formatter={(val) => formatCurrency(Number(val))}
                      valueStyle={{ color: getProfitColor(invoiceProfit.net_profit), fontWeight: 'bold', fontSize: '18px' }}
                    />
                    <div className="mt-1 text-xs text-gray-600">
                      Gộp - Quà - Giao hàng
                    </div>
                  </Card>
                </Col>
              </Row>

              {/* Thông tin bổ sung */}
              <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
                <p><strong>Khách hàng:</strong> {invoiceProfit.customer_name}</p>
                <p><strong>Ngày bán:</strong> {dayjs(invoiceProfit.sale_date || invoiceProfit.created_at).format('DD/MM/YYYY HH:mm')}</p>
              </div>

              <Divider>Chi tiết từng sản phẩm</Divider>

              <Table
                columns={itemColumns}
                dataSource={invoiceProfit.item_details || []}
                pagination={false}
                rowKey="product_name"
                scroll={{ x: 1200 }}
              />
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block mb-2 font-medium">Chọn khách hàng hệ thống:</label>
            <ComboBox
              style={{ width: '100%' }}
              placeholder="Tìm kiếm khách hàng hệ thống..."
              value={selectedCustomerId || undefined}
              onChange={(val) => {
                setSelectedCustomerId(val ? Number(val) : undefined);
                if (val) setGuestCustomerName('');
              }}
              onSearch={setCustomerKeyword}
              filterOption={false}
              options={customersData?.data?.items?.map((customer: any) => ({
                value: customer.id,
                label: `${customer.name} - ${customer.phone || ''}`
              })) || []}
              isLoading={isLoadingCustomers}
              allowClear
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Tìm tên khách vãng lai:</label>
            <Input.Search
              placeholder="Nhập tên khách vãng lai (VD: Lễ...)"
              allowClear
              enterButton="Tìm kiếm"
              onSearch={(val) => {
                if (val.trim()) {
                  setGuestCustomerName(val.trim());
                  setSelectedCustomerId(0);
                } else {
                  setGuestCustomerName('');
                }
              }}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Lọc theo mùa vụ:</label>
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
              allowClear
            />
          </div>
        </div>

        {isLoadingCustomerProfit && (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" tip="Đang tải báo cáo khách hàng..." />
          </div>
        )}

        {!selectedCustomerId && !guestCustomerName && !isLoadingCustomerProfit && (
          <Empty description="Vui lòng chọn khách hàng hoặc nhập tên khách vãng lai để xem báo cáo lợi nhuận" />
        )}

        {(selectedCustomerId || guestCustomerName) && customerProfit && !isLoadingCustomerProfit && (
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

            {/* Lifetime Summary - chỉ hiển thị khi KHÔNG lọc mùa vụ */}
            {customerProfit.lifetime_summary && !customerSeasonFilter && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">💎 Tổng hợp trọn đời (Lifetime)</h3>
                <Row gutter={[12, 12]}>
                  <Col xs={12} sm={12} md={6}>
                    <ReportStatCard
                      title="Số hóa đơn"
                      value={customerProfit.lifetime_summary.total_invoices}
                      icon={<SearchOutlined />}
                      color="blue"
                    />
                  </Col>
                  <Col xs={12} sm={12} md={6}>
                    <ReportStatCard
                      title="Doanh thu"
                      value={customerProfit.lifetime_summary.total_revenue}
                      icon={<DollarOutlined />}
                      color="blue"
                    />
                  </Col>
                  <Col xs={12} sm={12} md={6}>
                    <ReportStatCard
                      title="Lợi nhuận"
                      value={customerProfit.lifetime_summary.total_profit}
                      icon={<RiseOutlined />}
                      color="green"
                      secondaryValue={formatPercent(customerProfit.lifetime_summary.avg_margin)}
                      secondaryTitle="Tỷ suất TB"
                    />
                  </Col>
                  <Col xs={12} sm={12} md={6} lg={4}>
                    <ReportStatCard
                      title="Chi phí Giao hàng"
                      value={customerProfit.lifetime_summary.delivery_costs || 0}
                      icon={<CarOutlined />}
                      color="orange"
                    />
                  </Col>
                  <Col xs={12} sm={12} md={6} lg={4}>
                    <ReportStatCard
                      title="Chi phí Dịch vụ"
                      value={customerProfit.lifetime_summary.service_costs || 0}
                      icon={<CarryOutOutlined />}
                      color="blue"
                    />
                  </Col>
                  <Col xs={12} sm={12} md={6} lg={4}>
                    <ReportStatCard
                      title="Chi phí Quà tặng"
                      value={customerProfit.lifetime_summary.gift_costs || 0}
                      icon={<GiftOutlined />}
                      color="red"
                    />
                  </Col>
                  <Col xs={24} sm={24} md={12} lg={8}>
                    <ReportStatCard
                      title="LỢI NHUẬN RÒNG TRỌN ĐỜI"
                      value={customerProfit.lifetime_summary.net_profit || 0}
                      icon={<PieChartOutlined />}
                      color="green"
                      isNetProfit={true}
                    />
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
                <Row gutter={[12, 12]}>
                  <Col xs={12} sm={12} md={6}>
                    <ReportStatCard
                      title="Số hóa đơn"
                      value={customerProfit.current_season_summary.total_invoices}
                      icon={<SearchOutlined />}
                      color="blue"
                    />
                  </Col>
                  <Col xs={12} sm={12} md={6}>
                    <ReportStatCard
                      title="Doanh thu"
                      value={customerProfit.current_season_summary.total_revenue}
                      icon={<DollarOutlined />}
                      color="blue"
                    />
                  </Col>
                  <Col xs={12} sm={12} md={6}>
                    <ReportStatCard
                      title="Lợi nhuận"
                      value={customerProfit.current_season_summary.total_profit}
                      icon={<RiseOutlined />}
                      color="green"
                      secondaryValue={formatPercent(customerProfit.current_season_summary.avg_margin)}
                      secondaryTitle="Tỷ suất"
                    />
                  </Col>
                  <Col xs={12} sm={12} md={6} lg={4}>
                    <ReportStatCard
                      title="Giao hàng"
                      value={customerProfit.current_season_summary.delivery_costs || 0}
                      icon={<CarOutlined />}
                      color="orange"
                    />
                  </Col>
                  <Col xs={12} sm={12} md={6} lg={4}>
                    <ReportStatCard
                      title="Chi phí Dịch vụ"
                      value={customerProfit.current_season_summary.service_costs || 0}
                      icon={<CarryOutOutlined />}
                      color="blue"
                    />
                  </Col>
                  <Col xs={12} sm={12} md={6} lg={4}>
                    <ReportStatCard
                      title="Chi phí Quà tặng"
                      value={customerProfit.current_season_summary.gift_costs || 0}
                      icon={<GiftOutlined />}
                      color="red"
                    />
                  </Col>
                  <Col xs={24} sm={24} md={12} lg={8}>
                    <ReportStatCard
                      title="LỢI NHUẬN RÒNG VỤ NÀY"
                      value={customerProfit.current_season_summary.net_profit || 0}
                      icon={<PieChartOutlined />}
                      color="green"
                      isNetProfit={true}
                    />
                  </Col>
                </Row>
              </div>
            )}

            {/* Bảng chi tiết chi phí */}
            <Row gutter={[16, 16]} className="mb-6">
              <Col xs={24} lg={12}>
                <Card title="📋 Chi phí Dịch vụ" size="small" bodyStyle={{ padding: 0 }}>
                  <Table
                    columns={[
                      { title: 'Tên', dataIndex: 'name', key: 'name' },
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
                    dataSource={(customerProfit.farm_service_costs_breakdown || []).filter((c: any) => c.type === 'service')}
                    pagination={{ pageSize: 5 }}
                    size="small"
                    scroll={{ x: true }}
                  />
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card title="🎁 Quà tặng" size="small" bodyStyle={{ padding: 0 }}>
                  <Table
                    columns={[
                      { title: 'Tên quà tặng', dataIndex: 'name', key: 'name' },
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
                    dataSource={(customerProfit.farm_service_costs_breakdown || []).filter((c: any) => c.type !== 'service')}
                    pagination={{ pageSize: 5 }}
                    size="small"
                    scroll={{ x: true }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Bảng danh sách hóa đơn */}
            <Card title="📄 Danh sách Hóa đơn">
              <Table
                columns={[
                  {
                    title: 'Mã HĐ',
                    dataIndex: 'invoice_code',
                    key: 'invoice_code',
                    width: 200,
                  },
                  {
                    title: 'Ngày',
                    dataIndex: 'date',
                    key: 'date',
                    width: 130,
                    render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
                  },
                  {
                    title: 'Mùa vụ',
                    dataIndex: 'season_name',
                    key: 'season_name',
                    width: 300,
                    render: (name: string) => name || '-',
                  },
                  {
                    title: 'Doanh thu',
                    dataIndex: 'revenue',
                    key: 'revenue',
                    width: 160,
                    render: (value: number) => formatCurrency(value),
                  },
                  {
                    title: 'Giá vốn',
                    dataIndex: 'cost',
                    key: 'cost',
                    width: 160,
                    render: (value: number) => formatCurrency(value),
                  },
                  {
                    title: 'Lợi nhuận',
                    dataIndex: 'profit',
                    key: 'profit',
                    width: 160,
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
                    width: 130,
                    render: (value: number) => (
                      <Tag color={getMarginColor(value)}>{formatPercent(value)}</Tag>
                    ),
                  },
                ]}
                dataSource={customerProfit.invoices || []}
                rowKey={(record) => `inv-${record.invoice_id}`}
                pagination={{ pageSize: 10 }}
                scroll={{ x: true }}
              />
            </Card>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-2 md:p-6">
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
