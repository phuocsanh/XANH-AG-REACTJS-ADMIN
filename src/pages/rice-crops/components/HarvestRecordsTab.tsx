import React, { useState } from 'react';
import {
  Button,
  Table,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Row,
  Col,
  message,
  Card,
  Statistic,
} from 'antd';
import { DatePicker } from '@/components/common';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  GoldOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  useHarvestRecords,
  useCreateHarvestRecord,
  useUpdateHarvestRecord,
  useDeleteHarvestRecord,
} from '@/queries/harvest-record';
import { HarvestRecord, CreateHarvestRecordDto } from '@/types/rice-farming.types';

interface HarvestRecordsTabProps {
  riceCropId: number;
}

const HarvestRecordsTab: React.FC<HarvestRecordsTabProps> = ({ riceCropId }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<HarvestRecord | null>(null);
  const [form] = Form.useForm();

  // Queries
  const { data: harvestRecords, isLoading } = useHarvestRecords(riceCropId);
  
  const createMutation = useCreateHarvestRecord();
  const updateMutation = useUpdateHarvestRecord();
  const deleteMutation = useDeleteHarvestRecord();

  // Tính tổng sản lượng và doanh thu
  const totalYield = harvestRecords?.reduce((sum: number, item: HarvestRecord) => sum + item.yield_amount, 0) || 0;
  const totalRevenue = harvestRecords?.reduce((sum: number, item: HarvestRecord) => sum + item.total_revenue, 0) || 0;

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (item: HarvestRecord) => {
    setEditingItem(item);
    form.setFieldsValue({
      ...item,
      harvest_date: item.harvest_date ? dayjs(item.harvest_date) : null,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa đợt thu hoạch này?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await deleteMutation.mutateAsync({ id, cropId: riceCropId });
          message.success('Xóa đợt thu hoạch thành công');
        } catch {
          message.error('Có lỗi xảy ra khi xóa đợt thu hoạch');
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const dto: CreateHarvestRecordDto = {
        ...values,
        rice_crop_id: riceCropId,
        harvest_date: values.harvest_date?.format('YYYY-MM-DD'),
      };

      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, dto });
        message.success('Cập nhật đợt thu hoạch thành công');
      } else {
        await createMutation.mutateAsync(dto);
        message.success('Thêm đợt thu hoạch thành công');
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
      title: 'Ngày thu hoạch',
      dataIndex: 'harvest_date',
      key: 'harvest_date',
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
    },
    {
      title: 'Sản lượng (kg)',
      dataIndex: 'yield_amount',
      key: 'yield_amount',
      render: (val: number) => val.toLocaleString('vi-VN'),
    },
    {
      title: 'Độ ẩm (%)',
      dataIndex: 'moisture_content',
      key: 'moisture_content',
      render: (val: number) => val ? `${val}%` : '-',
    },
    {
      title: 'Giá bán (đ/kg)',
      dataIndex: 'unit_price',
      key: 'unit_price',
      render: (val: number) => val.toLocaleString('vi-VN'),
    },
    {
      title: 'Thành tiền',
      dataIndex: 'total_revenue',
      key: 'total_revenue',
      render: (val: number) => (
        <span className="font-medium text-green-600">
          {val.toLocaleString('vi-VN')}
        </span>
      ),
    },
    {
      title: 'Người mua',
      dataIndex: 'buyer_name',
      key: 'buyer_name',
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: HarvestRecord) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            className="flex items-center justify-center w-10 h-10"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(record);
            }}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            className="flex items-center justify-center w-10 h-10"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(record.id);
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8}>
            <Card bodyStyle={{ padding: '12px' }} className="h-full">
              <Statistic
                title={<span className="text-xs sm:text-base">Tổng sản lượng</span>}
                value={totalYield}
                precision={0}
                suffix={<span className="text-xs sm:text-base ml-0.5">kg</span>}
                prefix={<GoldOutlined style={{ fontSize: '14px' }} />}
                valueStyle={{ fontSize: '18px', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8}>
            <Card bodyStyle={{ padding: '12px' }} className="h-full">
              <Statistic
                title={<span className="text-xs sm:text-base">Tổng doanh thu</span>}
                value={totalRevenue}
                precision={0}
                valueStyle={{ color: '#3f8600', fontSize: '18px', fontWeight: 'bold' }}
                suffix={<span className="text-xs sm:text-base ml-0.5">₫</span>}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8} className="flex sm:justify-end items-center">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              className="w-full sm:w-auto mt-2 sm:mt-0"
              size="middle"
            >
              Thêm bản ghi
            </Button>
          </Col>
        </Row>
      </div>

      <Table
        columns={columns}
        dataSource={harvestRecords}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1000 }}
      />

      <Modal
        title={editingItem ? 'Sửa đợt thu hoạch' : 'Thêm đợt thu hoạch mới'}
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
                name="harvest_date"
                label="Ngày thu hoạch"
                rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="moisture_content"
                label="Độ ẩm (%)"
              >
                <InputNumber style={{ width: '100%' }} min={0} max={100} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="yield_amount"
                label="Sản lượng (kg)"
                rules={[{ required: true, message: 'Vui lòng nhập sản lượng' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  parser={(value) => (value ? value.replace(/\$\s?|(,*)/g, '') : '0') as any}
                  onChange={(val) => {
                    const price = form.getFieldValue('unit_price') || 0;
                    form.setFieldsValue({ total_revenue: (val || 0) * price });
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="unit_price"
                label="Đơn giá (đ/kg)"
                rules={[{ required: true, message: 'Vui lòng nhập đơn giá' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  parser={(value) => (value ? value.replace(/\$\s?|(,*)/g, '') : '0') as any}
                  onChange={(val) => {
                    const qty = form.getFieldValue('yield_amount') || 0;
                    form.setFieldsValue({ total_revenue: qty * (val || 0) });
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="total_revenue"
            label="Thành tiền"
            rules={[{ required: true, message: 'Vui lòng nhập thành tiền' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              parser={(value) => (value ? value.replace(/\$\s?|(,*)/g, '') : '0') as any}
            />
          </Form.Item>

          <Form.Item name="buyer_name" label="Người mua">
            <Input placeholder="Tên thương lái hoặc công ty" />
          </Form.Item>

          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HarvestRecordsTab;
