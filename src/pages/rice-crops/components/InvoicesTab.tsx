import React, { useState, useEffect } from 'react';
import { Table, Tag, Typography, Card, Statistic, Row, Col, Empty, Spin, Button, Modal, Select, Space, Input, Divider } from 'antd';
import { PlusOutlined, ShopOutlined, FileTextOutlined, DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray, useWatch, Control } from 'react-hook-form';
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
import { useAppStore } from '@/stores';
import { FormField, FormFieldNumber, FormDatePicker } from '@/components/form';

const { Title, Text } = Typography;

interface InvoicesTabProps {
  riceCropId: number;
}

interface ExternalPurchaseFormValues {
  supplier_name: string;
  purchase_date: string | null;
  payment_status: string;
  paid_amount?: number;
  notes?: string;
  items: {
    product_name: string;
    quantity: number;
    unit_price: number;
    notes?: string;
  }[];
}

const TotalCalculator = ({ control }: { control: Control<ExternalPurchaseFormValues> }) => {
  const items = useWatch({
    control,
    name: "items",
    defaultValue: []
  });

  // Tính tổng tiền an toàn với fallback value
  const total = items?.reduce((sum, item) => {
    const qty = Number(item?.quantity) || 0;
    const price = Number(item?.unit_price) || 0;
    return sum + (qty * price);
  }, 0) || 0;

  return (
    <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded mb-4">
      <span className="font-semibold text-gray-700">Tổng cộng:</span>
      <span className="text-lg font-bold text-green-600">{formatCurrency(total)}</span>
    </div>
  );
};

const ItemTotal = ({ control, index }: { control: Control<ExternalPurchaseFormValues>, index: number }) => {
  const qty = useWatch({
    control,
    name: `items.${index}.quantity`,
  });
  const price = useWatch({
    control,
    name: `items.${index}.unit_price`,
  });

  const total = (Number(qty) || 0) * (Number(price) || 0);

  return (
    <Input 
      value={formatCurrency(total)} 
      disabled 
      className="text-green-600 font-bold"
    />
  );
};

export const InvoicesTab: React.FC<InvoicesTabProps> = ({ riceCropId }) => {
  const queryClient = useQueryClient();
  const [isLinkModalVisible, setIsLinkModalVisible] = useState(false);
  const [isExternalModalVisible, setIsExternalModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MergedPurchase | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentViewingRecord, setCurrentViewingRecord] = useState<MergedPurchase | null>(null);
  
  // React Hook Form
  const { control, handleSubmit, reset, watch, setValue } = useForm<ExternalPurchaseFormValues>({
    defaultValues: {
      items: [{ product_name: '', quantity: 0, unit_price: 0 }],
      payment_status: 'paid',
      purchase_date: new Date().toISOString() // Mặc định là ngày hiện tại
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const paymentStatus = useWatch({
    control,
    name: 'payment_status',
  });
  
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

  useEffect(() => {
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
    reset({
      items: [{ product_name: '', quantity: 0, unit_price: 0 }],
      payment_status: 'paid',
      purchase_date: new Date().toISOString(),
      supplier_name: '',
      notes: ''
    });
    setIsExternalModalVisible(true);
  };

  const handleEditExternal = (record: MergedPurchase) => {
    setIsEditMode(true);
    setEditingRecord(record);
    
    reset({
      supplier_name: record.supplier,
      purchase_date: record.date ? new Date(record.date).toISOString() : null,
      payment_status: record.status,
      paid_amount: record.paid_amount,
      notes: record.notes,
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
  
  // Xử lý xem chi tiết hóa đơn
  const handleViewDetail = (record: MergedPurchase) => {
    setCurrentViewingRecord(record);
    setIsDetailModalOpen(true);
  };

  const onExternalFormSubmit = async (values: ExternalPurchaseFormValues) => {
    // Tính lại tổng tiền để đảm bảo chính xác
    const total = values.items.reduce((sum, item) => 
      sum + (Number(item.quantity) * Number(item.unit_price)), 0
    );

    const dto = {
      rice_crop_id: riceCropId,
      purchase_date: values.purchase_date ? dayjs(values.purchase_date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
      supplier_name: values.supplier_name,
      total_amount: total,
      paid_amount: values.payment_status === 'paid' ? total : (values.paid_amount || 0),
      payment_status: values.payment_status,
      notes: values.notes,
      items: values.items.map(item => ({
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
      reset(); // Reset form
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
      width: 150,
      render: (source: string) => (
        source === 'external' ? (
          <Tag color="orange" icon={<FileTextOutlined />}>Tự nhập</Tag>
        ) : (
          <Tag color="blue" icon={<ShopOutlined />}>Cửa hàng XANH</Tag>
        )
      ),
      filters: [
        { text: 'Cửa hàng XANH', value: 'system' },
        { text: 'Tự nhập', value: 'external' },
      ],
      onFilter: (value, record) => record.source === value,
    },
    {
      title: 'Mã HĐ',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      render: (code: string) => <Text strong>{code}</Text>,
    },
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      width: 150,
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
      sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      title: 'Nhà cung cấp',
      dataIndex: 'supplier',
      key: 'supplier',
      width: 250,
      render: (supplier: string) => supplier === 'Hệ thống' ? 'Cửa hàng XANH' : supplier,
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'items',
      key: 'items',
      width: 120,
      render: (items: any[]) => `${items?.length || 0} SP`,
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 180,
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
      width: 180,
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
      width: 180,
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
      width: 180,
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
        
        return (
          <Space size="middle">
            <Button
              type="text"
              icon={<EyeOutlined style={{ color: '#52c41a' }} />}
              className="flex items-center justify-center w-10 h-10"
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetail(record);
              }}
            />
            {record.source === 'external' && (
              <>
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
              </>
            )}
          </Space>
        );
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
          scroll={{ x: 1500 }}
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
                <Text>{new Date(invoice.sale_date || invoice.created_at).toLocaleDateString('vi-VN')}</Text>
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

      {/* Modal tự nhập hóa đơn (React Hook Form + Custom Components) */}
      <Modal
        title={isEditMode ? "Chỉnh sửa hóa đơn" : "Tự nhập hóa đơn mua hàng"}
        open={isExternalModalVisible}
        onCancel={() => {
          setIsExternalModalVisible(false);
          setEditingRecord(null);
          reset();
        }}
        onOk={handleSubmit(onExternalFormSubmit)}
        width={900}
        confirmLoading={createExternalMutation.isPending || updateExternalMutation.isPending}
        okText={isEditMode ? "Cập nhật" : "Lưu hóa đơn"}
        cancelText="Hủy"
        maskClosable={false} // Chặn click ra ngoài
      >
        <form onSubmit={handleSubmit(onExternalFormSubmit)} className="flex flex-col gap-4 mt-4">
          <Row gutter={16}>
            <Col span={12}>
              <FormField
                control={control}
                name="supplier_name"
                label="Tên cửa hàng/nhà cung cấp"
                placeholder="VD: Cửa hàng phân bón Bến Tre"
                required
              />
            </Col>
            <Col span={12}>
              <FormDatePicker
                control={control}
                name="purchase_date"
                label="Ngày mua"
                placeholder="Chọn ngày mua"
                required
              />
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <FormField
                control={control}
                name="payment_status"
                label="Trạng thái thanh toán"
                type="select"
                options={[
                  { label: "Đã thanh toán", value: "paid" },
                  { label: "Thanh toán một phần", value: "partial" },
                  { label: "Chưa thanh toán", value: "pending" },
                ]}
                required
              />
            </Col>
            <Col span={12}>
              {paymentStatus === 'partial' && (
                <FormFieldNumber
                  control={control}
                  name="paid_amount"
                  label="Số tiền đã trả"
                  placeholder="0"
                  suffix="₫"
                  required
                  rules={{ required: "Vui lòng nhập số tiền đã trả" }}
                  min={0}
                />
              )}
            </Col>
          </Row>

          <div className="border rounded-md p-4 bg-gray-50/50">
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium">Danh sách sản phẩm</span>
              <Button 
                type="dashed" 
                onClick={() => append({ product_name: '', quantity: 1, unit_price: 0 })} 
                icon={<PlusOutlined />}
                size="small"
              >
                Thêm sản phẩm
              </Button>
            </div>
            
            <div className="space-y-4">
              {fields.map((field, index) => (
                <Card 
                  key={field.id} 
                  size="small"
                  title={`Sản phẩm ${index + 1}`}
                  extra={
                    fields.length > 1 && (
                      <Button 
                        type="text" 
                        danger 
                        size="small"
                        onClick={() => remove(index)}
                        icon={<DeleteOutlined />}
                      />
                    )
                  }
                  className="shadow-sm border-gray-200"
                >
                  <Row gutter={12}>
                    <Col span={10}>
                      <FormField
                        control={control}
                        name={`items.${index}.product_name`}
                        label="Tên sản phẩm"
                        placeholder="VD: Phân DAP"
                        required
                      />
                    </Col>
                    <Col span={5}>
                      <FormFieldNumber
                        control={control}
                        name={`items.${index}.quantity`}
                        label="Số lượng"
                        placeholder="0"
                        min={0}
                        required
                      />
                    </Col>
                    <Col span={5}>
                      <FormFieldNumber
                        control={control}
                        name={`items.${index}.unit_price`}
                        label="Đơn giá"
                        placeholder="0"
                        min={0}
                        required
                      />
                    </Col>
                    <Col span={4}>
                      <div className="ant-form-item-label">
                        <label className="">Thành tiền</label>
                      </div>
                      <ItemTotal control={control} index={index} />
                    </Col>
                  </Row>
                  <FormField
                    control={control}
                    name={`items.${index}.notes`}
                    label="Ghi chú"
                    placeholder="Ghi chú (nếu có)"
                  />
                </Card>
              ))}
            </div>
          </div>

          <FormField
            control={control}
            name="notes"
            label="Ghi chú chung"
            type="textarea"
            rows={2}
            placeholder="Ghi chú cho hóa đơn (nếu có)"
          />

          <TotalCalculator control={control} />
        </form>
      </Modal>

      {/* Modal xem chi tiết hóa đơn */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <FileTextOutlined className="text-blue-500" />
            <span>Chi tiết hóa đơn {currentViewingRecord?.code}</span>
            {currentViewingRecord?.source === 'system' ? (
              <Tag color="blue">Cửa hàng XANH</Tag>
            ) : (
              <Tag color="orange">Tự nhập</Tag>
            )}
          </div>
        }
        open={isDetailModalOpen}
        onCancel={() => {
          setIsDetailModalOpen(false);
          setCurrentViewingRecord(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setIsDetailModalOpen(false);
            setCurrentViewingRecord(null);
          }}>
            Đóng
          </Button>
        ]}
        width={700}
      >
        {currentViewingRecord && (
          <div className="py-2">
            <Row gutter={[24, 24]}>
              <Col span={12}>
                <div className="mb-4">
                  <Text type="secondary" className="block text-xs uppercase mb-1">Nhà cung cấp</Text>
                  <Text strong className="text-base">
                    {currentViewingRecord.supplier === 'Hệ thống' ? 'Cửa hàng XANH' : currentViewingRecord.supplier}
                  </Text>
                </div>
                <div className="mb-4">
                  <Text type="secondary" className="block text-xs uppercase mb-1">Ngày lập hóa đơn</Text>
                  <Text strong>{dayjs(currentViewingRecord.date).format('DD/MM/YYYY')}</Text>
                </div>
              </Col>
              <Col span={12}>
                <div className="mb-4 text-right">
                  <Text type="secondary" className="block text-xs uppercase mb-1">Trạng thái</Text>
                  {(() => {
                    const statusConfig: Record<string, { text: string; color: string }> = {
                      draft: { text: 'Nháp', color: 'default' },
                      confirmed: { text: 'Đã xác nhận', color: 'blue' },
                      paid: { text: 'Đã thanh toán', color: 'green' },
                      partial: { text: 'Thanh toán một phần', color: 'orange' },
                      pending: { text: 'Chưa thanh toán', color: 'red' },
                      cancelled: { text: 'Đã hủy', color: 'red' },
                    };
                    const config = statusConfig[currentViewingRecord.status] || { text: currentViewingRecord.status, color: 'default' };
                    return <Tag color={config.color} className="mr-0">{config.text}</Tag>;
                  })()}
                </div>
                <div className="mb-4 text-right">
                  <Text type="secondary" className="block text-xs uppercase mb-1">Phương thức thanh toán</Text>
                  <Tag color="blue" className="mr-0">{currentViewingRecord.payment_method || 'Không rõ'}</Tag>
                </div>
              </Col>
            </Row>

            <Divider className="my-2" />

            <div className="mb-4">
              <Text strong className="block mb-2">Danh sách sản phẩm</Text>
              <Table
                dataSource={currentViewingRecord.items}
                pagination={false}
                size="small"
                rowKey={(record, index) => index?.toString() || '0'}
                columns={[
                  {
                    title: 'Sản phẩm',
                    dataIndex: 'product_name',
                    key: 'product_name',
                    render: (text, item) => text || item?.product?.trade_name || item?.product?.name || 'Sản phẩm'
                  },
                  {
                    title: 'SL',
                    dataIndex: 'quantity',
                    key: 'quantity',
                    width: 70,
                    align: 'center',
                  },
                  {
                    title: 'Đơn giá',
                    dataIndex: 'unit_price',
                    key: 'unit_price',
                    align: 'right',
                    render: (val) => formatCurrency(val || 0)
                  },
                  {
                    title: 'Thành tiền',
                    key: 'total',
                    align: 'right',
                    render: (_, item) => formatCurrency((item.quantity || 0) * (item.unit_price || 0))
                  }
                ]}
              />
            </div>

            {currentViewingRecord.notes && (
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <Text type="secondary" className="block text-xs uppercase mb-1">Ghi chú</Text>
                <Text italic>{currentViewingRecord.notes}</Text>
              </div>
            )}

            <Card bodyStyle={{ padding: '12px' }} className="bg-gray-50 border-none shadow-none">
              <Row gutter={16}>
                <Col span={8} className="text-center">
                  <Text type="secondary" className="block text-xs uppercase">Tổng tiền</Text>
                  <Text strong className="text-lg text-green-600">{formatCurrency(currentViewingRecord.total_amount)}</Text>
                </Col>
                <Col span={8} className="text-center border-x border-gray-200">
                  <Text type="secondary" className="block text-xs uppercase">Đã thanh toán</Text>
                  <Text strong className="text-lg text-blue-600">{formatCurrency(currentViewingRecord.paid_amount || 0)}</Text>
                </Col>
                <Col span={8} className="text-center">
                  <Text type="secondary" className="block text-xs uppercase">Còn nợ</Text>
                  <Text strong className="text-lg text-red-600">{formatCurrency(currentViewingRecord.remaining_amount || 0)}</Text>
                </Col>
              </Row>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};
