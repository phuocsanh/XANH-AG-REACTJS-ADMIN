import React, { useState } from 'react';
import {
  Button,
  Table,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  message,
  Card,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  useCostItems,
  useCostSummary,
  useCreateCostItem,
  useUpdateCostItem,
  useDeleteCostItem,
} from '@/queries/cost-item';
import { CostItem, CostCategory, CreateCostItemDto } from '@/types/rice-farming.types';

interface CostItemsTabProps {
  riceCropId: number;
}

const costCategoryLabels: Record<CostCategory, string> = {
  seed: 'Giống',
  fertilizer: 'Phân bón',
  pesticide: 'Thuốc BVTV',
  labor: 'Nhân công',
  machinery: 'Máy móc',
  irrigation: 'Tưới tiêu',
  other: 'Khác',
};

const costCategoryColors: Record<CostCategory, string> = {
  seed: 'green',
  fertilizer: 'cyan',
  pesticide: 'red',
  labor: 'orange',
  machinery: 'blue',
  irrigation: 'purple',
  other: 'default',
};

const CostItemsTab: React.FC<CostItemsTabProps> = ({ riceCropId }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<CostItem | null>(null);
  const [form] = Form.useForm();

  // Queries
  const { data: costItems, isLoading } = useCostItems({ rice_crop_id: riceCropId });
  const { data: summary } = useCostSummary(riceCropId);
  
  const createMutation = useCreateCostItem();
  const updateMutation = useUpdateCostItem();
  const deleteMutation = useDeleteCostItem();

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (item: CostItem) => {
    setEditingItem(item);
    form.setFieldsValue({
      ...item,
      purchase_date: item.purchase_date ? dayjs(item.purchase_date) : null,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa chi phí này?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await deleteMutation.mutateAsync({ id, cropId: riceCropId });
          message.success('Xóa chi phí thành công');
        } catch (error) {
          message.error('Có lỗi xảy ra khi xóa chi phí');
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const dto: CreateCostItemDto = {
        ...values,
        rice_crop_id: riceCropId,
        purchase_date: values.purchase_date?.format('YYYY-MM-DD'),
      };

      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, dto });
        message.success('Cập nhật chi phí thành công');
      } else {
        await createMutation.mutateAsync(dto);
        message.success('Thêm chi phí thành công');
      }

      setIsModalVisible(false);
      form.resetFields();
      setEditingItem(null);
    } catch (error) {
      console.error('Validate failed:', error);
    }
  };

  const columns = [
    {
      title: 'Ngày',
      dataIndex: 'purchase_date',
      key: 'purchase_date',
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
    },
    {
      title: 'Loại chi phí',
      dataIndex: 'category',
      key: 'category',
      render: (category: CostCategory) => (
        <Tag color={costCategoryColors[category]}>
          {costCategoryLabels[category]}
        </Tag>
      ),
    },
    {
      title: 'Hạng mục',
      dataIndex: 'item_name',
      key: 'item_name',
    },
    {
      title: 'Số lượng',
      key: 'quantity',
      render: (text: any, record: CostItem) => (
        <span>
          {record.quantity ? record.quantity.toLocaleString('vi-VN') : '-'}{' '}
          {record.unit || ''}
        </span>
      ),
    },
    {
      title: 'Đơn giá',
      dataIndex: 'unit_price',
      key: 'unit_price',
      render: (price: number) => price.toLocaleString('vi-VN'),
    },
    {
      title: 'Thành tiền',
      dataIndex: 'total_cost',
      key: 'total_cost',
      render: (cost: number) => (
        <span className="font-medium text-red-600">
          {cost.toLocaleString('vi-VN')}
        </span>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (text: any, record: CostItem) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4">
        <Row gutter={16}>
          <Col span={8}>
            <Card>
              <Statistic
                title="Tổng chi phí"
                value={summary?.total || 0}
                precision={0}
                valueStyle={{ color: '#cf1322' }}
                prefix={<DollarOutlined />}
                suffix="₫"
              />
            </Card>
          </Col>
          <Col span={16} className="flex justify-end items-end">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              Thêm chi phí
            </Button>
          </Col>
        </Row>
      </div>

      <Table
        columns={columns}
        dataSource={costItems}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingItem ? 'Sửa chi phí' : 'Thêm chi phí mới'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Loại chi phí"
                rules={[{ required: true, message: 'Vui lòng chọn loại chi phí' }]}
              >
                <Select>
                  {Object.entries(costCategoryLabels).map(([key, label]) => (
                    <Select.Option key={key} value={key}>
                      {label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="purchase_date"
                label="Ngày chi"
                rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="item_name"
            label="Tên hạng mục"
            rules={[{ required: true, message: 'Vui lòng nhập tên hạng mục' }]}
          >
            <Input placeholder="VD: Phân Ure, Thuốc trừ sâu..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="quantity"
                label="Số lượng"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  onChange={(val) => {
                    const price = form.getFieldValue('unit_price') || 0;
                    form.setFieldsValue({ total_cost: (val || 0) * price });
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="unit"
                label="Đơn vị"
              >
                <Input placeholder="kg, chai, bao..." />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="unit_price"
                label="Đơn giá"
                rules={[{ required: true, message: 'Vui lòng nhập đơn giá' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value?.replace(/\$\s?|(,*)/g, '') as any}
                  onChange={(val) => {
                    const qty = form.getFieldValue('quantity') || 0;
                    form.setFieldsValue({ total_cost: qty * (val || 0) });
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="total_cost"
            label="Thành tiền"
            rules={[{ required: true, message: 'Vui lòng nhập thành tiền' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value?.replace(/\$\s?|(,*)/g, '') as any}
            />
          </Form.Item>

          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CostItemsTab;
