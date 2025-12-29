/**
 * Trang báo cáo lợi nhuận theo mùa vụ
 * Dashboard tổng quan về doanh thu, chi phí, lợi nhuận
 */

import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Spin,
  Alert,
  Select,
  Divider,
  Typography,
  Tag,
} from 'antd';
import {
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  TrophyOutlined,
  TeamOutlined,
  ShoppingOutlined,
  CarOutlined,
} from '@ant-design/icons';
import { useSeasonStoreProfit } from '@/queries/store-profit-report';
import { useSeasonsQuery } from '@/queries/season';
import type {
  TopCustomerProfit,
  TopProductProfit,
} from '@/models/store-profit';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

/**
 * Format số tiền theo định dạng VNĐ
 */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);
};

/**
 * Format phần trăm
 */
const formatPercent = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

const SeasonProfitReportPage: React.FC = () => {
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | undefined>();

  // Lấy danh sách mùa vụ
  const { data: seasonsData, isLoading: seasonsLoading } = useSeasonsQuery({
    page: 1,
    limit: 100,
  });

  // Lấy báo cáo lợi nhuận
  const { data: reportData, isLoading: reportLoading } = useSeasonStoreProfit(
    selectedSeasonId || 0
  );

  const isLoading = seasonsLoading || reportLoading;

  // Columns cho bảng Top Khách Hàng
  const customerColumns: ColumnsType<TopCustomerProfit> = [
    {
      title: 'Hạng',
      key: 'rank',
      width: 60,
      align: 'center',
      render: (_: any, __: any, index: number) => (
        <Tag color={index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : 'default'}>
          {index + 1}
        </Tag>
      ),
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customer_name',
      key: 'customer_name',
    },
    {
      title: 'Số đơn',
      dataIndex: 'total_invoices',
      key: 'total_invoices',
      align: 'right',
    },
    {
      title: 'Doanh thu',
      dataIndex: 'total_revenue',
      key: 'total_revenue',
      align: 'right',
      render: (value: number) => formatCurrency(value),
    },
    {
      title: 'Lợi nhuận',
      dataIndex: 'total_profit',
      key: 'total_profit',
      align: 'right',
      render: (value: number) => (
        <Text strong style={{ color: value > 0 ? '#3f8600' : '#cf1322' }}>
          {formatCurrency(value)}
        </Text>
      ),
    },
    {
      title: 'Tỷ suất',
      dataIndex: 'avg_margin',
      key: 'avg_margin',
      align: 'right',
      render: (value: number) => formatPercent(value),
    },
  ];

  // Columns cho bảng Top Sản Phẩm
  const productColumns: ColumnsType<TopProductProfit> = [
    {
      title: 'Hạng',
      key: 'rank',
      width: 60,
      align: 'center',
      render: (_: any, __: any, index: number) => (
        <Tag color={index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : 'default'}>
          {index + 1}
        </Tag>
      ),
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'product_name',
      key: 'product_name',
    },
    {
      title: 'Số lượng bán',
      dataIndex: 'quantity_sold',
      key: 'quantity_sold',
      align: 'right',
    },
    {
      title: 'Doanh thu',
      dataIndex: 'total_revenue',
      key: 'total_revenue',
      align: 'right',
      render: (value: number) => formatCurrency(value),
    },
    {
      title: 'Lợi nhuận',
      dataIndex: 'total_profit',
      key: 'total_profit',
      align: 'right',
      render: (value: number) => (
        <Text strong style={{ color: value > 0 ? '#3f8600' : '#cf1322' }}>
          {formatCurrency(value)}
        </Text>
      ),
    },
    {
      title: 'Tỷ suất',
      dataIndex: 'margin',
      key: 'margin',
      align: 'right',
      render: (value: number) => formatPercent(value),
    },
  ];



  const isProfitable = reportData ? reportData.summary.net_profit > 0 : false;

  return (
    <div className="p-2 md:p-6">
      <div className="mb-6">
        <Title level={2}>Báo Cáo Lợi Nhuận Mùa Vụ</Title>
        <Text type="secondary">
          Tổng quan về doanh thu, chi phí và lợi nhuận theo từng mùa vụ
        </Text>
      </div>

      {/* Chọn mùa vụ */}
      <Card className="mb-6">
        <Row gutter={16} align="middle">
          <Col span={4}>
            <Text strong>Chọn mùa vụ:</Text>
          </Col>
          <Col span={8}>
            <Select
              style={{ width: '100%' }}
              placeholder="Chọn mùa vụ để xem báo cáo"
              value={selectedSeasonId}
              onChange={setSelectedSeasonId}
              loading={seasonsLoading}
              options={seasonsData?.data?.items?.map((season) => ({
                label: season.name,
                value: season.id,
              }))}
            />
          </Col>
        </Row>
      </Card>

      {/* Nội dung báo cáo */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin size="large" />
        </div>
      )}

      {!isLoading && !selectedSeasonId && (
        <Alert
          message="Vui lòng chọn mùa vụ"
          description="Chọn một mùa vụ từ dropdown bên trên để xem báo cáo lợi nhuận chi tiết."
          type="info"
          showIcon
        />
      )}

      {!isLoading && selectedSeasonId && !reportData && (
        <Alert
          message="Không có dữ liệu"
          description="Không tìm thấy dữ liệu báo cáo cho mùa vụ này."
          type="warning"
          showIcon
        />
      )}

      {!isLoading && reportData && (
        <>
          {/* Tổng quan */}
          <Row gutter={[16, 16]} className="mb-6">
            <Col span={6}>
              <Card>
                <Statistic
                  title="Tổng Doanh Thu"
                  value={reportData.summary.total_revenue}
                  formatter={(value) => formatCurrency(Number(value))}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
                <div className="mt-2 text-sm text-gray-500">
                  {reportData.summary.total_invoices} đơn hàng
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Giá Vốn Hàng Bán"
                  value={reportData.summary.cost_of_goods_sold}
                  formatter={(value) => formatCurrency(Number(value))}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Chi Phí Vận Hành"
                  value={reportData.summary.operating_costs}
                  formatter={(value) => formatCurrency(Number(value))}
                  valueStyle={{ color: '#ff4d4f' }}
                />
                {reportData.delivery_stats && (
                  <div className="mt-2 text-sm text-gray-500">
                    <CarOutlined /> {reportData.delivery_stats.total_deliveries} chuyến giao hàng
                  </div>
                )}
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Lợi Nhuận Ròng"
                  value={reportData.summary.net_profit}
                  prefix={isProfitable ? <RiseOutlined /> : <FallOutlined />}
                  suffix={`(${formatPercent(reportData.summary.net_margin)})`}
                  formatter={(value) => formatCurrency(Number(value))}
                  valueStyle={{ color: isProfitable ? '#3f8600' : '#cf1322', fontWeight: 600 }}
                />
              </Card>
            </Col>
          </Row>

          {/* Cảnh báo nếu lỗ */}
          {!isProfitable && (
            <Alert
              message="⚠️ Mùa vụ này đang lỗ"
              description="Tổng chi phí (giá vốn + vận hành) cao hơn doanh thu. Cần xem xét lại chiến lược kinh doanh."
              type="error"
              showIcon
              className="mb-6"
            />
          )}



          {/* Thống kê giao hàng */}
          {reportData.delivery_stats && (
            <Card className="mb-6" title={<><CarOutlined /> Thống Kê Giao Hàng</>}>
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title="Tổng số chuyến"
                    value={reportData.delivery_stats.total_deliveries}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Tổng chi phí"
                    value={reportData.delivery_stats.total_delivery_cost}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Chi phí TB/chuyến"
                    value={reportData.delivery_stats.avg_cost_per_delivery}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                </Col>
                {reportData.delivery_stats.total_distance && (
                  <Col span={6}>
                    <Statistic
                      title="Tổng quãng đường"
                      value={reportData.delivery_stats.total_distance}
                      suffix="km"
                    />
                  </Col>
                )}
              </Row>
            </Card>
          )}

          {/* Top Khách Hàng */}
          <Card
            className="mb-6"
            title={
              <>
                <TrophyOutlined /> Top Khách Hàng Mang Lại Lợi Nhuận Cao Nhất
              </>
            }
          >
            <Table
              dataSource={reportData.top_customers}
              columns={customerColumns}
              rowKey="customer_id"
              pagination={false}
              size="small"
            />
          </Card>

          {/* Top Sản Phẩm */}
          <Card
            title={
              <>
                <ShoppingOutlined /> Top Sản Phẩm Lãi Nhất
              </>
            }
          >
            <Table
              dataSource={reportData.top_products}
              columns={productColumns}
              rowKey="product_id"
              pagination={false}
              size="small"
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default SeasonProfitReportPage;
