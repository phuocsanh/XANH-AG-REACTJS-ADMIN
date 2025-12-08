/**
 * Trang Báo cáo Lợi nhuận Bán hàng - Phiên bản đầy đủ
 * Bao gồm 3 tabs: Tổng quan Mùa vụ, Theo Vụ lúa, Chi tiết Hóa đơn
 */

import React, { useState } from 'react';
import {
  Tabs,
  Card,
  Statistic,
  Row,
  Col,
  Select,
  Spin,
  Empty,
  Table,
  Input,
  Tag,
} from 'antd';
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
import type { ColumnsType } from 'antd/es/table';

const ProfitReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('season');
  
  // State cho tab Season
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | undefined>();
  
  // State cho tab Rice Crop
  const [selectedRiceCropId, setSelectedRiceCropId] = useState<number | undefined>();
  
  // State cho tab Invoice
  const [invoiceId, setInvoiceId] = useState<number | undefined>();

  // State cho tab Customer
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | undefined>();
  const [customerSeasonFilter, setCustomerSeasonFilter] = useState<number | undefined>();

  // Queries
  const { data: seasonsData } = useSeasonsQuery();
  const { data: riceCropsData } = useRiceCrops();
  const { data: customersData } = useCustomersQuery({ limit: 100 });
  const { data: seasonProfit, isLoading: isLoadingSeasonProfit } = useSeasonStoreProfit(
    selectedSeasonId || 0
  );
  const { 
    data: riceCropProfit, 
    isLoading: isLoadingRiceCropProfit,
    error: riceCropError 
  } = useRiceCropProfitQuery(
    selectedRiceCropId || 0
  );
  const { data: invoiceProfit, isLoading: isLoadingInvoiceProfit } = useInvoiceProfit(
    invoiceId || 0
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
          <Select
            style={{ width: 300 }}
            placeholder="Chọn mùa vụ"
            value={selectedSeasonId}
            onChange={setSelectedSeasonId}
            showSearch
            filterOption={(input, option: any) =>
              option?.children?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {seasonsData?.data?.items?.map((season: any) => (
              <Select.Option key={season.id} value={season.id}>
                {season.name} ({season.year})
              </Select.Option>
            ))}
          </Select>
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
          </div>
        )}
      </div>
    );
  };

  // ==================== TAB 2: THEO VỤ LÚA ====================
  const renderRiceCropReport = () => {
    // Lọc rice crops theo season đã chọn
    const filteredRiceCrops = selectedSeasonId
      ? riceCropsData?.filter((crop: any) => crop.season_id === selectedSeasonId)
      : riceCropsData;

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
        <div className="mb-6">
          <label className="block mb-2 font-medium">Chọn vụ lúa:</label>
          <Select
            style={{ width: 400 }}
            placeholder="Chọn vụ lúa"
            value={selectedRiceCropId}
            onChange={setSelectedRiceCropId}
            showSearch
            filterOption={(input, option: any) =>
              option?.children?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {filteredRiceCrops?.map((crop: any) => (
              <Select.Option key={crop.id} value={crop.id}>
                {crop.field_name} - {crop.customer?.name} ({crop.season?.name})
              </Select.Option>
            ))}
          </Select>
        </div>

        {isLoadingRiceCropProfit && (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" tip="Đang tải báo cáo vụ lúa..." />
          </div>
        )}

        {!selectedRiceCropId && !isLoadingRiceCropProfit && (
          <Empty description="Vui lòng chọn vụ lúa để xem báo cáo lợi nhuận" />
        )}

        {selectedRiceCropId && riceCropError && (
          <Empty 
            description={
              <div>
                <p className="text-red-500 font-medium">Không tìm thấy dữ liệu báo cáo</p>
                <p className="text-gray-500 text-sm mt-2">
                  Vụ lúa này chưa có hóa đơn bán hàng nào. Vui lòng chọn vụ lúa khác hoặc tạo hóa đơn cho vụ lúa này.
                </p>
              </div>
            }
          />
        )}

        {selectedRiceCropId && riceCropProfit && !isLoadingRiceCropProfit && (
          <div>
            {/* Thông tin vụ lúa */}
            <Card title="Thông tin Vụ lúa" className="mb-6">
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
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Số hóa đơn"
                    value={riceCropProfit.summary?.total_invoices || 0}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Tổng Doanh thu"
                    value={riceCropProfit.summary?.total_revenue || 0}
                    formatter={(value) => formatCurrency(Number(value))}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Lợi nhuận"
                    value={riceCropProfit.summary?.total_profit || 0}
                    formatter={(value) => formatCurrency(Number(value))}
                    valueStyle={{ color: getProfitColor(riceCropProfit.summary?.total_profit || 0) }}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Tỷ suất TB (%)"
                    value={riceCropProfit.summary?.avg_margin || 0}
                    suffix="%"
                    precision={2}
                    valueStyle={{ color: getMarginColor(riceCropProfit.summary?.avg_margin || 0) }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Bảng danh sách hóa đơn */}
            <Card title="Danh sách Hóa đơn">
              <Table
                columns={invoiceColumns}
                dataSource={riceCropProfit.invoices || []}
                rowKey={(record) => `invoice-${record.invoice_id}`}
                pagination={{ pageSize: 10 }}
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
          <label className="block mb-2 font-medium">Nhập ID Hóa đơn:</label>
          <Input
            style={{ width: 300 }}
            placeholder="VD: 123"
            type="number"
            value={invoiceId}
            onChange={(e) => setInvoiceId(Number(e.target.value))}
            prefix={<SearchOutlined />}
          />
        </div>

        {isLoadingInvoiceProfit && (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" tip="Đang tải chi tiết hóa đơn..." />
          </div>
        )}

        {!invoiceId && !isLoadingInvoiceProfit && (
          <Empty description="Vui lòng nhập ID hóa đơn để xem báo cáo lợi nhuận" />
        )}

        {invoiceId && invoiceProfit && !isLoadingInvoiceProfit && (
          <div>
            {/* Thông tin hóa đơn */}
            <Card title="Thông tin Hóa đơn" className="mb-6">
              <Row gutter={16}>
                <Col span={12}>
                  <p><strong>Mã hóa đơn:</strong> {invoiceProfit.invoice_code}</p>
                  <p><strong>Khách hàng:</strong> {invoiceProfit.customer_name}</p>
                </Col>
                <Col span={12}>
                  <p><strong>Ngày tạo:</strong> {new Date(invoiceProfit.created_at).toLocaleString('vi-VN')}</p>
                </Col>
              </Row>
            </Card>

            {/* Tổng hợp lợi nhuận */}
            <Row gutter={[16, 16]} className="mb-6">
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Tổng Doanh thu"
                    value={invoiceProfit.total_amount}
                    formatter={(value) => formatCurrency(Number(value))}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Giá vốn"
                    value={invoiceProfit.cost_of_goods_sold}
                    formatter={(value) => formatCurrency(Number(value))}
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Lợi nhuận Gộp"
                    value={invoiceProfit.gross_profit}
                    formatter={(value) => formatCurrency(Number(value))}
                    valueStyle={{ color: getProfitColor(invoiceProfit.gross_profit) }}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Tỷ suất (%)"
                    value={invoiceProfit.gross_margin}
                    suffix="%"
                    precision={2}
                    valueStyle={{ color: getMarginColor(invoiceProfit.gross_margin) }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Bảng chi tiết sản phẩm */}
            <Card title="Chi tiết Sản phẩm">
              <Table
                columns={itemColumns}
                dataSource={invoiceProfit.item_details}
                rowKey={(record, index) => `item-${index}`}
                pagination={false}
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
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block mb-2 font-medium">Chọn khách hàng:</label>
            <Select
              style={{ width: '100%' }}
              placeholder="Chọn khách hàng"
              value={selectedCustomerId}
              onChange={setSelectedCustomerId}
              showSearch
              filterOption={(input, option: any) =>
                option?.children?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {customersData?.data?.items?.map((customer: any) => (
                <Select.Option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.phone}
                </Select.Option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block mb-2 font-medium">Lọc theo mùa vụ (tùy chọn):</label>
            <Select
              style={{ width: '100%' }}
              placeholder="Tất cả mùa vụ"
              value={customerSeasonFilter}
              onChange={setCustomerSeasonFilter}
              allowClear
            >
              {seasonsData?.data?.items?.map((season: any) => (
                <Select.Option key={season.id} value={season.id}>
                  {season.name} ({season.year})
                </Select.Option>
              ))}
            </Select>
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
            {/* Thông tin khách hàng */}
            <Card title="Thông tin Khách hàng" className="mb-6">
              <Row gutter={16}>
                <Col span={8}>
                  <p><strong>Tên:</strong> {customerProfit.customer_name}</p>
                </Col>
                <Col span={8}>
                  <p><strong>SĐT:</strong> {customerProfit.customer_phone || 'N/A'}</p>
                </Col>
                <Col span={8}>
                  <p><strong>Email:</strong> {customerProfit.customer_email || 'N/A'}</p>
                </Col>
              </Row>
            </Card>

            {/* Lifetime Summary - Luôn hiển thị */}
            {(customerProfit as any).lifetime_summary && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">📈 Tổng lợi nhuận từ trước đến nay</h3>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={6}>
                    <Card>
                      <Statistic
                        title="Tổng số HĐ"
                        value={(customerProfit as any).lifetime_summary.total_invoices}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card>
                      <Statistic
                        title="Tổng Doanh thu"
                        value={(customerProfit as any).lifetime_summary.total_revenue}
                        formatter={(value) => formatCurrency(Number(value))}
                        valueStyle={{ color: '#3f8600' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card>
                      <Statistic
                        title="Tổng Lợi nhuận"
                        value={(customerProfit as any).lifetime_summary.total_profit}
                        formatter={(value) => formatCurrency(Number(value))}
                        valueStyle={{ color: getProfitColor((customerProfit as any).lifetime_summary.total_profit) }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card>
                      <Statistic
                        title="Tỷ suất TB"
                        value={(customerProfit as any).lifetime_summary.avg_margin}
                        suffix="%"
                        precision={2}
                        valueStyle={{ color: getMarginColor((customerProfit as any).lifetime_summary.avg_margin) }}
                      />
                    </Card>
                  </Col>
                </Row>
              </div>
            )}

            {/* Current Season Summary - Chỉ hiển thị khi có filter season */}
            {customerSeasonFilter && (customerProfit as any).current_season_summary && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">
                  📊 Lợi nhuận trong mùa vụ: {(customerProfit as any).current_season_summary.season_name}
                </h3>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={6}>
                    <Card>
                      <Statistic
                        title="Số HĐ trong mùa"
                        value={(customerProfit as any).current_season_summary.total_invoices}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card>
                      <Statistic
                        title="Doanh thu mùa này"
                        value={(customerProfit as any).current_season_summary.total_revenue}
                        formatter={(value) => formatCurrency(Number(value))}
                        valueStyle={{ color: '#3f8600' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card>
                      <Statistic
                        title="Lợi nhuận mùa này"
                        value={(customerProfit as any).current_season_summary.total_profit}
                        formatter={(value) => formatCurrency(Number(value))}
                        valueStyle={{ color: getProfitColor((customerProfit as any).current_season_summary.total_profit) }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card>
                      <Statistic
                        title="Tỷ suất mùa này"
                        value={(customerProfit as any).current_season_summary.avg_margin}
                        suffix="%"
                        precision={2}
                        valueStyle={{ color: getMarginColor((customerProfit as any).current_season_summary.avg_margin) }}
                      />
                    </Card>
                  </Col>
                </Row>
              </div>
            )}

            {/* Summary - Fallback nếu không có lifetime_summary */}
            {!((customerProfit as any).lifetime_summary) && customerProfit.summary && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">📊 Tổng hợp</h3>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={6}>
                    <Card>
                      <Statistic
                        title="Tổng số HĐ"
                        value={customerProfit.summary.total_invoices}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card>
                      <Statistic
                        title="Tổng Doanh thu"
                        value={customerProfit.summary.total_revenue}
                        formatter={(value) => formatCurrency(Number(value))}
                        valueStyle={{ color: '#3f8600' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card>
                      <Statistic
                        title="Tổng Lợi nhuận"
                        value={customerProfit.summary.total_profit}
                        formatter={(value) => formatCurrency(Number(value))}
                        valueStyle={{ color: getProfitColor(customerProfit.summary.total_profit) }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card>
                      <Statistic
                        title="Tỷ suất TB"
                        value={customerProfit.summary.avg_margin}
                        suffix="%"
                        precision={2}
                        valueStyle={{ color: getMarginColor(customerProfit.summary.avg_margin) }}
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
                rowKey={(record) => `invoice-${record.invoice_id}`}
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

        <Tabs.TabPane tab="Theo Vụ lúa" key="rice-crop">
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
