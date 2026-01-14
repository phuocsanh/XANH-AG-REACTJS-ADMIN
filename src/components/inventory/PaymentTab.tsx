import React, { useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Button, 
  Table, 
  Alert, 
  Tag, 
  Space, 
  Typography,
  Popconfirm
} from 'antd';
import DataTable from '@/components/common/data-table';
import { 
  PlusOutlined, 
  DollarCircleOutlined, 
  DeleteOutlined,
  CalendarOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

import { 
  InventoryReceipt, 
  normalizeReceiptStatus,
  InventoryReceiptStatus,
  getInventoryReceiptStatusText
} from '@/models/inventory.model';
import { 
  useReceiptPaymentsQuery, 
  useDeletePaymentMutation,
} from '@/queries/inventory';
import { formatCurrency } from '@/utils/format';
import AddPaymentModal from './AddPaymentModal';

const { Text } = Typography;

interface PaymentTabProps {
  receipt: InventoryReceipt;
  onRefresh: () => void;
}

const PaymentTab: React.FC<PaymentTabProps> = ({ receipt, onRefresh }) => {
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const { data: payments = [], isLoading } = useReceiptPaymentsQuery(receipt.id);
  const deletePaymentMutation = useDeletePaymentMutation();

  const handleDeletePayment = async (paymentId: number) => {
    try {
      await deletePaymentMutation.mutateAsync({
        receiptId: receipt.id,
        paymentId
      });
      onRefresh();
    } catch (error) {
      console.error('Lỗi khi xóa thanh toán:', error);
    }
  };

  const columns = [
    {
      title: 'Ngày thanh toán',
      dataIndex: 'payment_date',
      key: 'payment_date',
      render: (date: string) => (
        <Space>
          <CalendarOutlined className="text-gray-400" />
          {dayjs(date).format('DD/MM/YYYY HH:mm')}
        </Space>
      ),
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      render: (amount: number) => (
        <Text strong className="text-blue-600">
          {formatCurrency(amount)}
        </Text>
      ),
    },
    {
      title: 'Phương thức',
      dataIndex: 'payment_method',
      key: 'payment_method',
      render: (method: string) => {
        const methods: Record<string, { label: string, color: string }> = {
          'cash': { label: 'Tiền mặt', color: 'orange' },
          'transfer': { label: 'Chuyển khoản', color: 'blue' },
          'debt': { label: 'Công nợ', color: 'red' },
        };
        const config = methods[method] || { label: method, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: 'Ghi chú',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (notes: string) => notes || '-',
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 80,
      align: 'center' as const,
      render: (_: any, record: any) => (
        <Popconfirm
          title="Xóa thanh toán"
          description="Bạn có chắc chắn muốn xóa bản ghi thanh toán này? Số nợ của phiếu sẽ được cập nhật lại."
          onConfirm={() => handleDeletePayment(record.id)}
          okText="Xóa"
          cancelText="Hủy"
          disabled={receipt.status === 'cancelled'}
          okButtonProps={{ danger: true }}
        >
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            disabled={receipt.status === 'cancelled'}
            loading={deletePaymentMutation.isPending}
          />
        </Popconfirm>
      ),
    },
  ];

  const paymentData = (payments || []) as any[];

  const grandTotal = Number(receipt.final_amount) || Number(receipt.total_amount) || 0;
  const supplierAmount = Number((receipt as any).supplier_amount) || grandTotal;
  const paidAmount = Number(receipt.paid_amount) || 0;
  const debtAmount = Number(receipt.debt_amount) || 0;

  const normalizedStatus = normalizeReceiptStatus(receipt.status_code || receipt.status);

  return (
    <div className="space-y-4 py-4">
      {/* 1. Tổng quan thanh toán */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card bordered={false} className="bg-gray-50 shadow-sm">
            <Statistic
              title="Tổng giá trị nhập"
              value={grandTotal}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#000' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card bordered={false} className="bg-orange-50 shadow-sm">
            <Statistic
              title="Tổng nợ thực tế (NCC)"
              value={supplierAmount}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#d46b08' }}
              suffix={supplierAmount !== grandTotal ? <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>*(Đã trừ phí trả ngoài)</Text> : null}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card bordered={false} className="bg-blue-50 shadow-sm">
            <Statistic
              title="Đã thanh toán"
              value={paidAmount}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#1890ff' }}
              prefix={<DollarCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card bordered={false} className={debtAmount > 0 ? "bg-red-50 shadow-sm" : "bg-green-50 shadow-sm"}>
            <Statistic
              title="Còn nợ NCC"
              value={debtAmount}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: debtAmount > 0 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 2. Trạng thái & Hành động */}
      <Card size="small" className="border-none shadow-none bg-transparent">
        <Row justify="space-between" align="middle">
          <Col>
            <Space direction="vertical" size={2}>
              <Text type="secondary" className="text-xs">Trạng thái thanh toán</Text>
              <Space>
                {receipt.payment_status === 'paid' && <Tag color="success" className="px-3 py-1 text-sm">✅ Đã thanh toán đầy đủ</Tag>}
                {receipt.payment_status === 'partial' && <Tag color="warning" className="px-3 py-1 text-sm">⚠️ Thanh toán một phần</Tag>}
                {(receipt.payment_status === 'unpaid' || !receipt.payment_status) && <Tag color="error" className="px-3 py-1 text-sm">❌ Chưa thanh toán</Tag>}
              </Space>
            </Space>
          </Col>
          <Col>
            {normalizedStatus === InventoryReceiptStatus.APPROVED && debtAmount > 0 && (
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                size="large"
                onClick={() => setIsAddPaymentModalOpen(true)}
              >
                Thêm thanh toán
              </Button>
            )}
          </Col>
        </Row>
      </Card>

      {/* 3. Cảnh báo nghiệp vụ */}
      {normalizedStatus === InventoryReceiptStatus.DRAFT && (
        <Alert
          message="Thông báo nghiệp vụ"
          description={`Phiếu nhập hàng đang ở trạng thái [${getInventoryReceiptStatusText(receipt.status_code || receipt.status)}]. Cần được DUYỆT trước khi thực hiện thanh toán. Vui lòng kiểm tra tab 'Thông tin' để duyệt phiếu.`}
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
        />
      )}

      {normalizedStatus === InventoryReceiptStatus.CANCELLED && (
        <Alert
          message="Phiếu đã hủy"
          description="Phiếu nhập hàng này đã bị hủy. Bạn không thể thực hiện thêm hoặc xóa các khoản thanh toán."
          type="warning"
          showIcon
        />
      )}

      {/* 4. Lịch sử chi tiết */}
      <Card 
        title={<Space><DollarCircleOutlined /><span>Lịch sử chi tiết</span></Space>} 
        size="small"
        className="shadow-sm"
      >
        <DataTable
          columns={columns as any}
          data={paymentData}
          rowKey="id"
          pagination={false}
          loading={isLoading}
          showActions={false}
          showSTT={true}
          locale={{ emptyText: 'Chưa có bản ghi thanh toán nào' }}
          summary={(pageData: readonly any[]) => {
            const totalPaid = pageData.reduce((sum, item) => sum + Number(item.amount || 0), 0);
            return (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={2}><Text strong>Tổng cộng</Text></Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">
                    <Text strong className="text-blue-600">{formatCurrency(totalPaid)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} colSpan={2} />
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        />
      </Card>

      {/* Add Payment Modal */}
      <AddPaymentModal
        receiptId={receipt.id}
        maxAmount={debtAmount}
        open={isAddPaymentModalOpen}
        onClose={() => {
          setIsAddPaymentModalOpen(false);
          onRefresh();
        }}
      />
    </div>
  );
};

export default PaymentTab;
