/**
 * Tab hiển thị phân tích lợi nhuận của một khách hàng
 * Bao gồm: Tổng quan, Lịch sử đơn hàng, Phân tích theo mùa vụ
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
  Space,
  Typography,
  Divider,
  Tag,
} from 'antd';
import { DatePicker, RangePicker } from '@/components/common';
import {
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  ShoppingCartOutlined,
  PercentageOutlined,
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { useCustomerProfitReport } from '@/queries/store-profit-report';
import { useSeasonsQuery } from '@/queries/season';
import type {
  CustomerInvoice,
  CustomerSeasonSummary,
} from '@/models/store-profit';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';

const { Text, Title } = Typography;

interface CustomerProfitTabProps {
  customerId: number;
}

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

const CustomerProfitTab: React.FC<CustomerProfitTabProps> = ({ customerId }) => {
  const [seasonFilter, setSeasonFilter] = useState<number | undefined>();
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  // Lấy danh sách mùa vụ
  const { data: seasonsData } = useSeasonsQuery({ page: 1, limit: 100 });

  // Lấy báo cáo lợi nhuận khách hàng
  const { data: reportData, isLoading } = useCustomerProfitReport(customerId, {
    seasonId: seasonFilter,
    startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
    endDate: dateRange?.[1]?.format('YYYY-MM-DD'),
  });

  // Columns cho bảng lịch sử đơn hàng
  const invoiceColumns: ColumnsType<CustomerInvoice> = [
    {
      title: 'Mã HĐ',
      dataIndex: 'invoice_code',
      key: 'invoice_code',
      width: 120,
    },
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: Date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Mùa vụ',
      dataIndex: 'season_name',
      key: 'season_name',
      width: 150,
      render: (name?: string) => name || '-',
    },
    {
      title: 'Doanh thu',
      dataIndex: 'revenue',
      key: 'revenue',
      align: 'right',
      width: 130,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: 'Giá vốn',
      dataIndex: 'cost',
      key: 'cost',
      align: 'right',
      width: 130,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: 'Lợi nhuận',
      dataIndex: 'profit',
      key: 'profit',
      align: 'right',
      width: 130,
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
      width: 100,
      render: (value: number) => (
        <Tag color={value > 0 ? 'green' : 'red'}>{formatPercent(value)}</Tag>
      ),
    },
  ];

  // Columns cho bảng phân tích theo mùa vụ
  const seasonColumns: ColumnsType<CustomerSeasonSummary> = [
    {
      title: 'Mùa vụ',
      dataIndex: 'season_name',
      key: 'season_name',
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
      title: 'Giá vốn',
      dataIndex: 'total_cost',
      key: 'total_cost',
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
      title: 'Tỷ suất TB',
      dataIndex: 'avg_margin',
      key: 'avg_margin',
      align: 'right',
      render: (value: number) => formatPercent(value),
    },
  ];

  // Dữ liệu cho biểu đồ cột theo mùa vụ
  const getSeasonChartData = () => {
    if (!reportData?.by_season) return [];
    return reportData.by_season.map((item) => ({
      season: item.season_name,
      profit: item.total_profit,
    }));
  };



  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!reportData) {
    return (
      <Alert
        message="Không có dữ liệu"
        description="Không tìm thấy dữ liệu lợi nhuận cho khách hàng này."
        type="info"
        showIcon
      />
    );
  }

  const isProfitable = reportData.summary.total_profit > 0;

  return (
    <div>
      {/* Bộ lọc */}
      <Card className="mb-4">
        <Space size="middle" wrap>
          <div>
            <Text strong className="mr-2">
              Mùa vụ:
            </Text>
            <Select
              style={{ width: 200 }}
              placeholder="Tất cả mùa vụ"
              allowClear
              value={seasonFilter}
              onChange={setSeasonFilter}
              options={seasonsData?.data?.items?.map((season) => ({
                label: season.name,
                value: season.id,
              }))}
            />
          </div>
          <div>
            <Text strong className="mr-2">
              Khoảng thời gian:
            </Text>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              format="DD/MM/YYYY"
              placeholder={['Từ ngày', 'Đến ngày']}
            />
          </div>
        </Space>
      </Card>

      {/* Tổng quan */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng Số Đơn Hàng"
              value={reportData.summary.total_invoices}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng Doanh Thu"
              value={reportData.summary.total_revenue}
              formatter={(value) => formatCurrency(Number(value))}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng Lợi Nhuận"
              value={reportData.summary.total_profit}
              prefix={isProfitable ? <RiseOutlined /> : <FallOutlined />}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: isProfitable ? '#3f8600' : '#cf1322', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tỷ Suất Lợi Nhuận TB"
              value={reportData.summary.avg_margin}
              suffix="%"
              precision={2}
              prefix={<PercentageOutlined />}
              valueStyle={{ color: isProfitable ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Biểu đồ lợi nhuận theo mùa vụ */}
      {reportData.by_season.length > 0 && (
        <Card className="mb-6" title="Lợi Nhuận Theo Mùa Vụ">
          <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
              <BarChart
                data={getSeasonChartData()}
                margin={{ top: 30, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="season" 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => {
                    if (v === 0) return '0';
                    return v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : formatCurrency(v);
                  }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                  formatter={(value: number) => [formatCurrency(value), 'Lợi nhuận']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="profit" radius={[4, 4, 0, 0]} barSize={50}>
                  {getSeasonChartData().map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#3f8600' : '#cf1322'} />
                  ))}
                  <LabelList 
                    dataKey="profit" 
                    position="top" 
                    formatter={(v: number) => formatCurrency(v)}
                    style={{ fontSize: '12px', fill: '#666' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Bảng phân tích theo mùa vụ */}
      {reportData.by_season.length > 0 && (
        <>
          <Divider orientation="left">Phân Tích Theo Mùa Vụ</Divider>
          <Card className="mb-6">
            <Table
              dataSource={reportData.by_season}
              columns={seasonColumns}
              rowKey="season_id"
              pagination={false}
              size="small"
            />
          </Card>
        </>
      )}

      {/* Lịch sử đơn hàng */}
      <Divider orientation="left">Lịch Sử Lợi Nhuận Theo Đơn Hàng</Divider>
      <Card>
        <Table
          dataSource={reportData.invoices}
          columns={invoiceColumns}
          rowKey="invoice_id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} đơn hàng`,
          }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default CustomerProfitTab;
