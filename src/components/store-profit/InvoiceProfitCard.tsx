/**
 * Component hiển thị phân tích lợi nhuận của một đơn hàng
 * Chỉ hiển thị cho user có quyền 'store-profit-report:read'
 */

import React from 'react';
import { Card, Statistic, Table, Alert, Spin, Row, Col, Divider } from 'antd';
import { DollarOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons';
import { useInvoiceProfit } from '@/queries/store-profit-report';
import type { InvoiceItemProfit } from '@/models/store-profit';
import type { ColumnsType } from 'antd/es/table';

interface InvoiceProfitCardProps {
  invoiceId: number;
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

const InvoiceProfitCard: React.FC<InvoiceProfitCardProps> = ({ invoiceId }) => {
  const { data, isLoading, error } = useInvoiceProfit(invoiceId);

  // Columns cho bảng chi tiết sản phẩm
  const columns: ColumnsType<InvoiceItemProfit> = [
    {
      title: 'Sản phẩm',
      dataIndex: 'product_name',
      key: 'product_name',
      width: '30%',
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right',
      width: '10%',
    },
    {
      title: 'Giá bán',
      dataIndex: 'unit_price',
      key: 'unit_price',
      align: 'right',
      width: '15%',
      render: (value: number) => formatCurrency(value),
    },
    {
      title: 'Giá vốn',
      dataIndex: 'avg_cost',
      key: 'avg_cost',
      align: 'right',
      width: '15%',
      render: (value: number) => formatCurrency(value),
    },
    {
      title: 'Lợi nhuận',
      dataIndex: 'profit',
      key: 'profit',
      align: 'right',
      width: '15%',
      render: (value: number) => (
        <span style={{ color: value > 0 ? '#3f8600' : '#cf1322', fontWeight: 500 }}>
          {formatCurrency(value)}
        </span>
      ),
    },
    {
      title: 'Tỷ suất',
      dataIndex: 'margin',
      key: 'margin',
      align: 'right',
      width: '15%',
      render: (value: number) => (
        <span style={{ color: value > 0 ? '#3f8600' : '#cf1322' }}>
          {formatPercent(value)}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <Card title="Phân Tích Lợi Nhuận" loading>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Phân Tích Lợi Nhuận">
        <Alert
          message="Lỗi khi tải dữ liệu"
          description="Không thể tải thông tin lợi nhuận. Vui lòng thử lại sau hoặc kiểm tra quyền truy cập."
          type="error"
          showIcon
        />
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const isProfitable = data.gross_profit > 0;

  return (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DollarOutlined />
          <span>Phân Tích Lợi Nhuận</span>
        </div>
      }
    >
      {/* Tổng quan lợi nhuận */}
      <Row gutter={16}>
        <Col span={6}>
          <Statistic
            title="Tổng Doanh Thu"
            value={data.total_amount}
            formatter={(value) => formatCurrency(Number(value))}
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Giá Vốn Hàng Bán"
            value={data.cost_of_goods_sold}
            formatter={(value) => formatCurrency(Number(value))}
            valueStyle={{ color: '#faad14' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Lợi Nhuận Gộp"
            value={data.gross_profit}
            prefix={isProfitable ? <RiseOutlined /> : <FallOutlined />}
            suffix={`(${formatPercent(data.gross_margin)})`}
            formatter={(value) => formatCurrency(Number(value))}
            valueStyle={{ color: isProfitable ? '#3f8600' : '#cf1322' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Tỷ Suất Lợi Nhuận"
            value={data.gross_margin}
            suffix="%"
            precision={2}
            valueStyle={{ color: isProfitable ? '#3f8600' : '#cf1322' }}
          />
        </Col>
      </Row>

      {/* Cảnh báo nếu lỗ */}
      {!isProfitable && (
        <>
          <Divider />
          <Alert
            message="⚠️ Đơn hàng này đang lỗ"
            description="Giá vốn cao hơn giá bán. Cần xem xét lại chiến lược giá hoặc chi phí nhập hàng."
            type="warning"
            showIcon
          />
        </>
      )}

      {/* Chi tiết từng sản phẩm */}
      <Divider orientation="left">Chi Tiết Lợi Nhuận Từng Sản Phẩm</Divider>
      <Table
        dataSource={data.item_details}
        columns={columns}
        rowKey={(record) => record.product_name}
        pagination={false}
        size="small"
        bordered
        summary={(pageData) => {
          const totalProfit = pageData.reduce((sum, item) => sum + item.profit, 0);
          const totalCOGS = pageData.reduce((sum, item) => sum + item.cogs, 0);
          const totalRevenue = pageData.reduce(
            (sum, item) => sum + item.quantity * item.unit_price,
            0
          );
          const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

          return (
            <Table.Summary.Row style={{ fontWeight: 600, backgroundColor: '#fafafa' }}>
              <Table.Summary.Cell index={0} colSpan={2}>
                Tổng cộng
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                {formatCurrency(totalRevenue)}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} align="right">
                {formatCurrency(totalCOGS)}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3} align="right">
                <span style={{ color: totalProfit > 0 ? '#3f8600' : '#cf1322' }}>
                  {formatCurrency(totalProfit)}
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4} align="right">
                <span style={{ color: avgMargin > 0 ? '#3f8600' : '#cf1322' }}>
                  {formatPercent(avgMargin)}
                </span>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          );
        }}
      />
    </Card>
  );
};

export default InvoiceProfitCard;
