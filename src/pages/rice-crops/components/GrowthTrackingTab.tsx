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
  Row,
  Col,
  message,
} from 'antd';
import { DatePicker } from '@/components/common';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  useGrowthTrackings,
  useCreateGrowthTracking,
  useUpdateGrowthTracking,
  useDeleteGrowthTracking,
} from '@/queries/growth-tracking';
import { GrowthTracking, CreateGrowthTrackingDto, GrowthStage } from '@/types/rice-farming.types';

interface GrowthTrackingTabProps {
  riceCropId: number;
}

const growthStageLabels: Record<GrowthStage, string> = {
  seedling: 'Giai đoạn mạ',
  tillering: 'Đẻ nhánh',
  panicle: 'Làm đòng',
  heading: 'Trổ bông',
  grain_filling: 'Vô gạo',
  ripening: 'Chín',
  harvested: 'Đã thu hoạch',
};

const growthStageColors: Record<GrowthStage, string> = {
  seedling: 'green',
  tillering: 'cyan',
  panicle: 'blue',
  heading: 'purple',
  grain_filling: 'geekblue',
  ripening: 'orange',
  harvested: 'gold',
};

const GrowthTrackingTab: React.FC<GrowthTrackingTabProps> = ({ riceCropId }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<GrowthTracking | null>(null);
  const [form] = Form.useForm();

  // Queries
  const { data: trackings, isLoading } = useGrowthTrackings(riceCropId);
  
  const createMutation = useCreateGrowthTracking();
  const updateMutation = useUpdateGrowthTracking();
  const deleteMutation = useDeleteGrowthTracking();

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (item: GrowthTracking) => {
    setEditingItem(item);
    form.setFieldsValue({
      ...item,
      check_date: item.check_date ? dayjs(item.check_date) : null,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa bản ghi này?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await deleteMutation.mutateAsync({ id, cropId: riceCropId });
          message.success('Xóa bản ghi thành công');
        } catch (error) {
          message.error('Có lỗi xảy ra khi xóa bản ghi');
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const dto: CreateGrowthTrackingDto = {
        ...values,
        rice_crop_id: riceCropId,
        check_date: values.check_date?.format('YYYY-MM-DD'),
      };

      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, dto });
        message.success('Cập nhật bản ghi thành công');
      } else {
        await createMutation.mutateAsync(dto);
        message.success('Thêm bản ghi thành công');
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
      title: 'Ngày kiểm tra',
      dataIndex: 'check_date',
      key: 'check_date',
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
      sorter: (a: GrowthTracking, b: GrowthTracking) => dayjs(a.check_date).unix() - dayjs(b.check_date).unix(),
    },
    {
      title: 'Giai đoạn',
      dataIndex: 'stage',
      key: 'stage',
      render: (stage: GrowthStage) => (
        <Tag color={growthStageColors[stage]}>
          {growthStageLabels[stage]}
        </Tag>
      ),
    },
    {
      title: 'Chiều cao (cm)',
      dataIndex: 'height_cm',
      key: 'height_cm',
      render: (val: number) => val ? `${val} cm` : '-',
    },
    {
      title: 'Màu lá',
      dataIndex: 'leaf_color',
      key: 'leaf_color',
    },
    {
      title: 'Tình trạng sâu bệnh',
      dataIndex: 'pest_status',
      key: 'pest_status',
      render: (text: string) => (
        <span className={text && text !== 'Không có' ? 'text-red-600' : 'text-green-600'}>
          {text || 'Không có'}
        </span>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (text: any, record: GrowthTracking) => (
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
      <div className="mb-4 flex justify-end">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          Thêm bản ghi
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={trackings}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingItem ? 'Sửa bản ghi sinh trưởng' : 'Thêm bản ghi mới'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        width={600}
        okText={editingItem ? 'Cập nhật' : 'Lưu'}
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="check_date"
                label="Ngày kiểm tra"
                rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="stage"
                label="Giai đoạn sinh trưởng"
                rules={[{ required: true, message: 'Vui lòng chọn giai đoạn' }]}
              >
                <Select>
                  {Object.entries(growthStageLabels).map(([key, label]) => (
                    <Select.Option key={key} value={key}>
                      {label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="height_cm"
                label="Chiều cao cây (cm)"
              >
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="leaf_color"
                label="Màu sắc lá"
              >
                <Input placeholder="VD: Xanh đậm, Vàng..." />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="pest_status" label="Tình trạng sâu bệnh">
            <Input placeholder="Mô tả sâu bệnh nếu có" />
          </Form.Item>

          <Form.Item name="notes" label="Ghi chú/Đánh giá chung">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item name="images" label="Hình ảnh (URL)">
            <Input placeholder="Link hình ảnh (nếu có)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GrowthTrackingTab;
