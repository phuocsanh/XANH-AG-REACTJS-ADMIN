import React, { useState } from 'react';
import { Table, Tag, Typography, Card, Statistic, Row, Col, Empty, Spin, Button, Modal, Select, Space, Form, Input, InputNumber } from 'antd';
import { PlusOutlined, LinkOutlined, ShopOutlined, FileTextOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import { formatCurrency } from '@/utils/format';
import type { ColumnsType } from 'antd/es/table';
import { 
  useMergedPurchases, 
  useCreateExternalPurchase, 
  useUpdateExternalPurchase, 
  useDeleteExternalPurchase 
} from '@/queries/external-purchase';
import type { MergedPurchase } from '@/models/external-purchase.model';
import { SalesInvoice } from '@/models/sales-invoice';
import dayjs from 'dayjs';
import { message } from 'antd';
import { DatePicker } from '@/components/common';
import { useAppStore } from '@/stores';

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
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MergedPurchase | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [externalForm] = Form.useForm();
  
  // Lấy thông tin người dùng hiện tại
  const userInfo = useAppStore((state) => state.userInfo);
  const currentUserId = userInfo?.id || userInfo?.user_id;
  const isAdmin = userInfo?.role?.code === 'admin';

  // Fetch thông tin rice crop để lấy customer_id
  const { data: riceCropData } = useQuery({
    queryKey: ['rice-crop', riceCropId],
    queryFn: async () => {
      const response = await api.get<any>(`/rice-crops/${riceCropId}`);
      return response.data || response;
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
  const updateExternalMutation = useUpdateExternalPurchase();
  const deleteExternalMutation = useDeleteExternalPurchase();

  const purchases = allPurchases || [];
  const availableInvoices = (availableInvoicesResponse as any)?.data || [];

  // Tính tổng tiền
  const totalAmount = purchases.reduce((sum: number, inv: MergedPurchase) => sum + Number(inv.total_amount || 0), 0);
  const totalPaid = purchases.reduce((sum: number, inv: MergedPurchase) => sum + Number(inv.paid_amount || 0), 0);
  const totalRemaining = purchases.reduce((sum: number, inv: MergedPurchase) => sum + Number(inv.remaining_amount || 0), 0);

  // Tách riêng system và external
  const systemCount = purchases.filter((p: MergedPurchase) => p.source === 'system').length;
  const externalCount = purchases.filter((p: MergedPurchase) => p.source === 'external').length;

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
    setIsEditMode(false);
    setEditingRecord(null);
    externalForm.resetFields();
    setIsExternalModalVisible(true);
  };

  const handleEditExternal = (record: MergedPurchase) => {
    setIsEditMode(true);
    setEditingRecord(record);
    
    externalForm.setFieldsValue({
      purchase_date: dayjs(record.date),
      supplier_name: record.supplier,
      notes: record.notes,
      payment_status: record.status,
      paid_amount: record.paid_amount,
      items: record.items.map(item => ({
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        notes: item.notes,
      })),
    });
    setIsExternalModalVisible(true);
  };

  const handleDeleteExternal = (record: MergedPurchase) => {
    const id = record.id as string;
    const numericId = parseInt(id.replace('ext-', ''));
    
    if (!isAdmin && record.created_by !== currentUserId) {
      message.error('Bạn không có quyền xóa hóa đơn này');
      return;
    }

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
    const total = values.items.reduce((sum: number, item: any) => 
      sum + (Number(item.quantity) * Number(item.unit_price)), 0
    );

    const dto = {
      rice_crop_id: riceCropId,
      purchase_date: values.purchase_date.format('YYYY-MM-DD'),
      supplier_name: values.supplier_name,
      total_amount: total,
      paid_amount: values.payment_status === 'paid' ? total : (values.paid_amount || 0),
      payment_status: values.payment_status,
      notes: values.notes,
      items: values.items.map((item: any) => ({
        product_name: item.product_name,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        total_price: Number(item.quantity) * Number(item.unit_price),
        notes: item.notes,
      })),
    };

    try {
      if (isEditMode && editingRecord) {
        const id = (editingRecord.id as string).replace('ext-', '');
        await updateExternalMutation.mutateAsync({
          id: parseInt(id),
          dto,
        });
      } else {
        await createExternalMutation.mutateAsync(dto);
      }

      setIsExternalModalVisible(false);
      externalForm.resetFields();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
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
          partial: { text: 'Thanh toán một phần', color: 'orange' },
          pending: { text: 'Chưa thanh toán', color: 'red' },
          cancelled: { text: 'Đã hủy', color: 'red' },
        };
        const config = statusConfig[status] || { text: status, color: 'default' };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 150,
      render: (_, record) => {
        const canEdit = isAdmin || record.created_by === currentUserId;
        
        return record.source === 'external' ? (
          <Space size="middle">
            {canEdit && (
              <Button
                type="text"
                icon={<EditOutlined style={{ color: '#1890ff' }} />}
                className="flex items-center justify-center w-10 h-10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditExternal(record);
                }}
              />
            )}
            {canEdit && (
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                className="flex items-center justify-center w-10 h-10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteExternal(record);
                }}
              />
            )}
          </Space>
        ) : null;
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
      <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={12} md={6}>
          <Card bodyStyle={{ padding: '8px 10px' }} className="h-full shadow-none border-gray-100">
            <Statistic
              title={<span className="text-[10px] sm:text-xs text-gray-500 uppercase">Tổng hóa đơn</span>}
              value={purchases.length}
              suffix={<span className="text-[10px] ml-0.5 text-gray-400">HĐ</span>}
              valueStyle={{ color: '#1890ff', fontSize: '14px', fontWeight: 'bold', lineHeight: '1.2' }}
            />
            <div className="text-[9px] text-gray-400 mt-0.5 flex gap-1">
              <span>{systemCount} HT</span>
              <span>•</span>
              <span>{externalCount} TN</span>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card bodyStyle={{ padding: '8px 10px' }} className="h-full shadow-none border-gray-100 flex flex-col justify-center">
            <Statistic
              title={<span className="text-[10px] sm:text-xs text-gray-500 uppercase">Tổng chi phí</span>}
              value={totalAmount}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#52c41a', fontSize: '14px', fontWeight: 'bold', lineHeight: '1.2' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card bodyStyle={{ padding: '8px 10px' }} className="h-full shadow-none border-gray-100 flex flex-col justify-center">
            <Statistic
              title={<span className="text-[10px] sm:text-xs text-gray-500 uppercase">Đã thanh toán</span>}
              value={totalPaid}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#1890ff', fontSize: '14px', fontWeight: 'bold', lineHeight: '1.2' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card bodyStyle={{ padding: '8px 10px' }} className="h-full shadow-none border-gray-100 flex flex-col justify-center">
            <Statistic
              title={<span className="text-[10px] sm:text-xs text-gray-500 uppercase">Còn nợ</span>}
              value={totalRemaining}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: totalRemaining > 0 ? '#ff4d4f' : '#52c41a', fontSize: '14px', fontWeight: 'bold', lineHeight: '1.2' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Bảng danh sách hóa đơn */}
      <Card 
        className="shadow-sm"
        title={<Title level={5} className="m-0 text-base sm:text-lg">Danh sách hóa đơn</Title>}
        extra={
          <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreateExternal}
              className="px-2 sm:px-4"
          >
              <span className="hidden sm:inline">Tự nhập hóa đơn</span>
              <span className="sm:hidden">Tự nhập</span>
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
          scroll={{ x: 1000 }}
          locale={{
            emptyText: (
              <Empty
                description="Chưa có hóa đơn nào cho Ruộng lúa này"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
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
          {availableInvoices.map((invoice: any) => (
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
        title={isEditMode ? "Chỉnh sửa hóa đơn" : "Tự nhập hóa đơn mua hàng"}
        open={isExternalModalVisible}
        onCancel={() => {
          setIsExternalModalVisible(false);
          setEditingRecord(null);
          externalForm.resetFields();
        }}
        onOk={() => externalForm.submit()}
        width={900}
        confirmLoading={createExternalMutation.isPending || updateExternalMutation.isPending}
        okText={isEditMode ? "Cập nhật" : "Lưu hóa đơn"}
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

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="payment_status"
                label="Trạng thái thanh toán"
                initialValue="paid"
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
              >
                <Select>
                  <Select.Option value="paid">Đã thanh toán</Select.Option>
                  <Select.Option value="partial">Thanh toán một phần</Select.Option>
                  <Select.Option value="pending">Chưa thanh toán</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.payment_status !== currentValues.payment_status}>
                {({ getFieldValue }) => {
                  const status = getFieldValue('payment_status');
                  if (status === 'partial') {
                    return (
                      <Form.Item
                        name="paid_amount"
                        label="Số tiền đã trả"
                        rules={[{ required: true, message: 'Vui lòng nhập số tiền đã trả' }]}
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0}
                          formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          placeholder="0"
                          addonAfter="₫"
                        />
                      </Form.Item>
                    );
                  }
                  return null;
                }}
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
