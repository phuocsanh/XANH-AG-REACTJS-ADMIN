import React, { useState } from 'react';
import { Table, Tag, Typography, Card, Statistic, Row, Col, Empty, Spin, Button, Modal, Select, Space, Form, Input, InputNumber } from 'antd';
import { PlusOutlined, LinkOutlined, ShopOutlined, FileTextOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import { formatCurrency } from '@/utils/format';
import type { ColumnsType } from 'antd/es/table';
import { useMergedPurchases, useCreateExternalPurchase, useDeleteExternalPurchase } from '@/queries/external-purchase';
import type { MergedPurchase } from '@/models/external-purchase.model';
import { SalesInvoice } from '@/models/sales-invoice';
import dayjs from 'dayjs';
import { message } from 'antd';
import { DatePicker } from '@/components/common';

const { Title, Text } = Typography;

interface InvoicesTabProps {
  riceCropId: number;
}

/**
 * Component hiển thị danh sách hóa đơn của một Ruộng lúa (cả system và external)
 */
export const InvoicesTab: React.FC<InvoicesTabProps> = ({ riceCropId }) => {
  const queryClient = useQueryClient();
  const [isLinkModalVisible, setIsLinkModalVisible] = useState(false);
  const [isExternalModalVisible, setIsExternalModalVisible] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [externalForm] = Form.useForm();

  // Fetch thông tin rice crop để lấy customer_id
  const { data: riceCropData } = useQuery({
    queryKey: ['rice-crop', riceCropId],
    queryFn: async () => {
      return await api.get<any>(`/rice-crops/${riceCropId}`);
    },
    enabled: !!riceCropId,
  });

  React.useEffect(() => {
    if (riceCropData?.customer_id) {
      setCustomerId(riceCropData.customer_id);
    }
  }, [riceCropData]);

  // Fetch tất cả hóa đơn (merged: system + external)
  const { data: allPurchases, isLoading } = useMergedPurchases(riceCropId);

  // Fetch danh sách hóa đơn system chưa gắn rice_crop
  const { data: availableInvoicesResponse } = useQuery({
    queryKey: ['available-invoices', customerId],
    queryFn: async () => {
      if (!customerId) return { data: [] };
      
      const response = await api.postRaw<{
        success: boolean;
        data: SalesInvoice[];
      }>('/sales/invoices/search', {
        page: 1,
        limit: 100,
        filters: [
          {
            field: 'customer_id',
            operator: 'eq',
            value: customerId
          },
          {
            field: 'rice_crop_id',
            operator: 'is_null',
            value: true
          }
        ]
      });

      return response;
    },
    enabled: !!customerId && isLinkModalVisible,
  });

  // Mutation để link system invoice
  const linkInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: number) => {
      return await api.patchRaw(`/sales/invoice/${invoiceId}`, {
        rice_crop_id: riceCropId
      });
    },
    onSuccess: () => {
      message.success('Đã thêm hóa đơn vào Ruộng lúa');
      queryClient.invalidateQueries({ queryKey: ['merged-purchases', riceCropId] });
      queryClient.invalidateQueries({ queryKey: ['available-invoices', customerId] });
      setIsLinkModalVisible(false);
      setSelectedInvoiceId(null);
    },
    onError: () => {
      message.error('Có lỗi xảy ra khi thêm hóa đơn');
    }
  });

  // Mutations
  const createExternalMutation = useCreateExternalPurchase();
  const deleteExternalMutation = useDeleteExternalPurchase();

  const purchases = allPurchases || [];
  const availableInvoices = availableInvoicesResponse?.data || [];

  // Tính tổng tiền
  const totalAmount = purchases.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
  const totalPaid = purchases.reduce((sum, inv) => sum + Number(inv.paid_amount || 0), 0);
  const totalRemaining = purchases.reduce((sum, inv) => sum + Number(inv.remaining_amount || 0), 0);

  // Tách riêng system và external
  const systemCount = purchases.filter(p => p.source === 'system').length;
  const externalCount = purchases.filter(p => p.source === 'external').length;

  const handleLinkSystemInvoice = () => {
    setIsLinkModalVisible(true);
  };

  const handleLinkInvoice = () => {
    if (!selectedInvoiceId) {
      message.warning('Vui lòng chọn hóa đơn');
      return;
    }
    linkInvoiceMutation.mutate(selectedInvoiceId);
  };

  const handleCreateExternal = () => {
    setIsExternalModalVisible(true);
  };

  const handleDeleteExternal = (id: string) => {
    const numericId = parseInt(id.replace('ext-', ''));
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa hóa đơn này?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => {
        deleteExternalMutation.mutate({ id: numericId, riceCropId });
      },
    });
  };

  const handleExternalFormSubmit = async (values: any) => {
    // Tính tổng tiền
    const total = values.items.reduce((sum: number, item: any) => 
      sum + (Number(item.quantity) * Number(item.unit_price)), 0
    );

    await createExternalMutation.mutateAsync({
      rice_crop_id: riceCropId,
      purchase_date: values.purchase_date.format('YYYY-MM-DD'),
      supplier_name: values.supplier_name,
      total_amount: total,
      notes: values.notes,
      items: values.items.map((item: any) => ({
        product_name: item.product_name,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        total_price: Number(item.quantity) * Number(item.unit_price),
        notes: item.notes,
      })),
    });

    setIsExternalModalVisible(false);
    externalForm.resetFields();
  };

  // Cấu hình columns cho bảng
  const columns: ColumnsType<MergedPurchase> = [
    {
      title: 'Nguồn',
      dataIndex: 'source',
      key: 'source',
      width: 100,
      render: (source: string) => (
        source === 'external' ? (
          <Tag color="orange" icon={<FileTextOutlined />}>Tự nhập</Tag>
        ) : (
          <Tag color="blue" icon={<ShopOutlined />}>Hệ thống</Tag>
        )
      ),
      filters: [
        { text: 'Hệ thống', value: 'system' },
        { text: 'Tự nhập', value: 'external' },
      ],
      onFilter: (value, record) => record.source === value,
    },
    {
      title: 'Mã HĐ',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (code: string) => <Text strong>{code}</Text>,
    },
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
      sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      title: 'Nhà cung cấp',
      dataIndex: 'supplier',
      key: 'supplier',
      width: 150,
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'items',
      key: 'items',
      width: 100,
      render: (items: any[]) => `${items?.length || 0} SP`,
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 150,
      align: 'right',
      render: (amount: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          {formatCurrency(amount)}
        </Text>
      ),
      sorter: (a, b) => a.total_amount - b.total_amount,
    },
    {
      title: 'Đã trả',
      dataIndex: 'paid_amount',
      key: 'paid_amount',
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
    {
      title: 'Hành động',
      key: 'action',
      width: 80,
      render: (_, record) => (
        record.source === 'external' ? (
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteExternal(record.id as string)}
          >
            Xóa
          </Button>
        ) : null
      ),
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
              title="Tổng hóa đơn"
              value={purchases.length}
              suffix="hóa đơn"
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
              <ShopOutlined /> {systemCount} hệ thống • <FileTextOutlined /> {externalCount} tự nhập
            </div>
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
      <Card 
        title={<Title level={5}>Danh sách hóa đơn mua hàng</Title>}
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleCreateExternal}
          >
            Tự nhập hóa đơn
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={purchases}
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
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Modal link hóa đơn từ hệ thống */}
      <Modal
        title="Thêm hóa đơn từ hệ thống"
        open={isLinkModalVisible}
        onOk={handleLinkInvoice}
        onCancel={() => {
          setIsLinkModalVisible(false);
          setSelectedInvoiceId(null);
        }}
        okText="Thêm"
        cancelText="Hủy"
        confirmLoading={linkInvoiceMutation.isPending}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            Chọn hóa đơn chưa gắn với Ruộng lúa nào để thêm vào đây
          </Text>
        </div>
        <Select
          style={{ width: '100%' }}
          placeholder="Chọn hóa đơn"
          value={selectedInvoiceId}
          onChange={setSelectedInvoiceId}
          showSearch
          optionFilterProp="children"
        >
          {availableInvoices.map((invoice) => (
            <Select.Option key={invoice.id} value={invoice.id}>
              <Space>
                <Text strong>{invoice.code}</Text>
                <Text type="secondary">-</Text>
                <Text>{new Date(invoice.created_at).toLocaleDateString('vi-VN')}</Text>
                <Text type="secondary">-</Text>
                <Text style={{ color: '#52c41a' }}>{formatCurrency(invoice.final_amount)}</Text>
              </Space>
            </Select.Option>
          ))}
        </Select>
        {availableInvoices.length === 0 && (
          <Empty 
            description="Không có hóa đơn nào chưa gắn với Ruộng lúa" 
            style={{ marginTop: 16 }}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Modal>

      {/* Modal tự nhập hóa đơn */}
      <Modal
        title="Tự nhập hóa đơn mua hàng"
        open={isExternalModalVisible}
        onCancel={() => {
          setIsExternalModalVisible(false);
          externalForm.resetFields();
        }}
        onOk={() => externalForm.submit()}
        width={900}
        confirmLoading={createExternalMutation.isPending}
        okText="Lưu hóa đơn"
        cancelText="Hủy"
      >
        <Form
          form={externalForm}
          layout="vertical"
          onFinish={handleExternalFormSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="supplier_name"
                label="Tên cửa hàng/nhà cung cấp"
                rules={[{ required: true, message: 'Vui lòng nhập tên nhà cung cấp' }]}
              >
                <Input placeholder="VD: Cửa hàng phân bón Bến Tre" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="purchase_date"
                label="Ngày mua"
                rules={[{ required: true, message: 'Vui lòng chọn ngày mua' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  placeholder="Chọn ngày mua"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Danh sách sản phẩm">
            <Form.List name="items" initialValue={[{}]}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field, index) => (
                    <Card 
                      key={field.key} 
                      size="small" 
                      style={{ marginBottom: 12 }}
                      title={`Sản phẩm ${index + 1}`}
                      extra={
                        fields.length > 1 && (
                          <Button 
                            type="text" 
                            danger 
                            size="small"
                            onClick={() => remove(field.name)}
                          >
                            Xóa
                          </Button>
                        )
                      }
                    >
                      <Row gutter={12}>
                        <Col span={10}>
                          <Form.Item
                            {...field}
                            name={[field.name, 'product_name']}
                            label="Tên sản phẩm"
                            rules={[{ required: true, message: 'Nhập tên sản phẩm' }]}
                          >
                            <Input placeholder="VD: Phân DAP" />
                          </Form.Item>
                        </Col>
                        <Col span={5}>
                          <Form.Item
                            {...field}
                            name={[field.name, 'quantity']}
                            label="Số lượng"
                            rules={[{ required: true, message: 'Nhập số lượng' }]}
                          >
                            <InputNumber 
                              min={0.01} 
                              style={{ width: '100%' }} 
                              placeholder="0"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={5}>
                          <Form.Item
                            {...field}
                            name={[field.name, 'unit_price']}
                            label="Đơn giá"
                            rules={[{ required: true, message: 'Nhập đơn giá' }]}
                          >
                            <InputNumber 
                              min={0} 
                              style={{ width: '100%' }}
                              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                              placeholder="0"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item label="Thành tiền">
                            <Form.Item noStyle shouldUpdate>
                              {() => {
                                const items = externalForm.getFieldValue('items') || [];
                                const item = items[field.name];
                                const total = (item?.quantity || 0) * (item?.unit_price || 0);
                                return (
                                  <Input 
                                    value={formatCurrency(total)} 
                                    disabled 
                                    style={{ fontWeight: 'bold', color: '#52c41a' }}
                                  />
                                );
                              }}
                            </Form.Item>
                          </Form.Item>
                        </Col>
                      </Row>
                      <Form.Item
                        {...field}
                        name={[field.name, 'notes']}
                        label="Ghi chú"
                      >
                        <Input.TextArea rows={1} placeholder="Ghi chú (nếu có)" />
                      </Form.Item>
                    </Card>
                  ))}
                  <Button 
                    type="dashed" 
                    onClick={() => add()} 
                    block 
                    icon={<PlusOutlined />}
                  >
                    Thêm sản phẩm
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>

          <Form.Item name="notes" label="Ghi chú chung">
            <Input.TextArea rows={2} placeholder="Ghi chú cho hóa đơn (nếu có)" />
          </Form.Item>

          {/* Tổng tiền */}
          <Form.Item label="Tổng cộng">
            <Form.Item noStyle shouldUpdate>
              {() => {
                const items = externalForm.getFieldValue('items') || [];
                const total = items.reduce((sum: number, item: any) => 
                  sum + ((item?.quantity || 0) * (item?.unit_price || 0)), 0
                );
                return (
                  <Input 
                    value={formatCurrency(total)} 
                    disabled 
                    style={{ 
                      fontWeight: 'bold', 
                      fontSize: 18, 
                      color: '#52c41a',
                      textAlign: 'right'
                    }}
                  />
                );
              }}
            </Form.Item>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
