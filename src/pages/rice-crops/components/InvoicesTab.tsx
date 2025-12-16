import React, { useEffect } from 'react';
import { Table, Tag, Typography, Card, Statistic, Row, Col, Empty, Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import api from '@/utils/api';
import { SalesInvoice } from '@/models/sales-invoice';
import { formatCurrency } from '@/utils/format';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

interface InvoicesTabProps {
  riceCropId: number;
}

/**
 * Component hiển thị danh sách hóa đơn của một Ruộng lúa
 */
export const InvoicesTab: React.FC<InvoicesTabProps> = ({ riceCropId }) => {
  // Fetch danh sách hóa đơn của Ruộng lúa
  const { data: invoicesResponse, isLoading, refetch } = useQuery({
    queryKey: ['rice-crop-invoices', riceCropId],
    queryFn: async () => {
      const response = await api.postRaw<{
        success: boolean;
        data: SalesInvoice[];
        pagination: {
          total: number;
          totalPages: number | null;
        };
      }>('/sales/invoices/search', {
        page: 1,
        limit: 100,
        filters: [
          {
            field: 'rice_crop_id',
            operator: 'eq',
            value: riceCropId
          }
        ]
      });

      return response;
    },
    enabled: !!riceCropId,
  });

  // Refetch khi riceCropId thay đổi
  useEffect(() => {
    if (riceCropId) {
      refetch();
    }
  }, [riceCropId, refetch]);

  const invoices = invoicesResponse?.data || [];
  const total = invoicesResponse?.pagination?.total || 0;

  // Tính tổng tiền
  const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.final_amount || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.partial_payment_amount || 0), 0);
  const totalRemaining = invoices.reduce((sum, inv) => sum + Number(inv.remaining_amount || 0), 0);

  // Cấu hình columns cho bảng
  const columns: ColumnsType<SalesInvoice> = [
    {
      title: 'Mã HĐ',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (code: string) => <Text strong>{code}</Text>,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'items',
      key: 'items',
      width: 100,
      render: (items: any[]) => `${items?.length || 0} sản phẩm`,
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'final_amount',
      key: 'final_amount',
      width: 150,
      align: 'right',
      render: (amount: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          {formatCurrency(amount)}
        </Text>
      ),
    },
    {
      title: 'Đã trả',
      dataIndex: 'partial_payment_amount',
      key: 'partial_payment_amount',
      width: 150,
      align: 'right',
      render: (amount: number) => (
        <Text style={{ color: '#1890ff' }}>
          {formatCurrency(amount || 0)}
        </Text>
      ),
    },
    {
      title: 'Còn nợ',
      dataIndex: 'remaining_amount',
      key: 'remaining_amount',
      width: 150,
      align: 'right',
      render: (amount: number) => (
        <Text style={{ color: amount > 0 ? '#ff4d4f' : '#52c41a' }}>
          {formatCurrency(amount || 0)}
        </Text>
      ),
    },
    {
      title: 'Phương thức',
      dataIndex: 'payment_method',
      key: 'payment_method',
      width: 120,
      render: (method: string) => {
        const methodLabels: Record<string, { text: string; color: string }> = {
          cash: { text: 'Tiền mặt', color: 'green' },
          debt: { text: 'Công nợ', color: 'orange' },
          transfer: { text: 'Chuyển khoản', color: 'blue' },
        };
        const label = methodLabels[method] || { text: method, color: 'default' };
        return <Tag color={label.color}>{label.text}</Tag>;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const statusConfig: Record<string, { text: string; color: string }> = {
          draft: { text: 'Nháp', color: 'default' },
          confirmed: { text: 'Đã xác nhận', color: 'blue' },
          paid: { text: 'Đã thanh toán', color: 'green' },
          cancelled: { text: 'Đã hủy', color: 'red' },
        };
        const config = statusConfig[status] || { text: status, color: 'default' };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
  ];

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="Đang tải danh sách hóa đơn..." />
      </div>
    );
  }

  return (
    <div>
      {/* Thống kê tổng quan */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Số hóa đơn"
              value={total}
              suffix="hóa đơn"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng chi phí"
              value={totalAmount}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Đã thanh toán"
              value={totalPaid}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Còn nợ"
              value={totalRemaining}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: totalRemaining > 0 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Bảng danh sách hóa đơn */}
      <Card title={<Title level={5}>Danh sách hóa đơn mua hàng</Title>}>
        <Table
          columns={columns}
          dataSource={invoices}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} hóa đơn`,
          }}
          locale={{
            emptyText: (
              <Empty
                description="Chưa có hóa đơn nào cho Ruộng lúa này"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};
