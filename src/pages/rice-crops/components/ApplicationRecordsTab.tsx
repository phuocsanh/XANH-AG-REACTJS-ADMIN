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
  useApplicationRecords,
  useCreateApplicationRecord,
  useUpdateApplicationRecord,
  useDeleteApplicationRecord,
} from '@/queries/application-record';
import { ApplicationRecord, CreateApplicationRecordDto, ApplicationType } from '@/types/rice-farming.types';

interface ApplicationRecordsTabProps {
  riceCropId: number;
}

const applicationTypeLabels: Record<ApplicationType, string> = {
  fertilizer: 'Bón phân',
  pesticide: 'Phun thuốc',
  other: 'Khác',
};

const applicationTypeColors: Record<ApplicationType, string> = {
  fertilizer: 'cyan',
  pesticide: 'red',
  other: 'default',
};

const ApplicationRecordsTab: React.FC<ApplicationRecordsTabProps> = ({ riceCropId }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ApplicationRecord | null>(null);
  const [form] = Form.useForm();

  // Queries
  const { data: records, isLoading } = useApplicationRecords(riceCropId);
  
  const createMutation = useCreateApplicationRecord();
  const updateMutation = useUpdateApplicationRecord();
  const deleteMutation = useDeleteApplicationRecord();

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (item: ApplicationRecord) => {
    setEditingItem(item);
    form.setFieldsValue({
      ...item,
      application_date: item.application_date ? dayjs(item.application_date) : null,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa nhật ký này?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await deleteMutation.mutateAsync({ id, cropId: riceCropId });
          message.success('Xóa nhật ký thành công');
        } catch (error) {
          message.error('Có lỗi xảy ra khi xóa nhật ký');
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const dto: CreateApplicationRecordDto = {
        ...values,
        rice_crop_id: riceCropId,
        application_date: values.application_date?.format('YYYY-MM-DD'),
      };

      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, dto });
        message.success('Cập nhật nhật ký thành công');
      } else {
        await createMutation.mutateAsync(dto);
        message.success('Thêm nhật ký thành công');
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
      title: 'Ngày thực hiện',
      dataIndex: 'application_date',
      key: 'application_date',
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
      sorter: (a: ApplicationRecord, b: ApplicationRecord) => dayjs(a.application_date).unix() - dayjs(b.application_date).unix(),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      render: (type: ApplicationType) => (
        <Tag color={applicationTypeColors[type]}>
          {applicationTypeLabels[type]}
        </Tag>
      ),
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'product_name',
      key: 'product_name',
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: 'Liều lượng',
      key: 'dosage',
      render: (text: any, record: ApplicationRecord) => (
        <span>
          {record.dosage} {record.unit}
        </span>
      ),
    },
    {
      title: 'Diện tích áp dụng',
      dataIndex: 'area_applied',
      key: 'area_applied',
      render: (val: number) => val ? `${val.toLocaleString('vi-VN')} m²` : '-',
    },
    {
      title: 'Người thực hiện',
      dataIndex: 'applicator_name',
      key: 'applicator_name',
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (text: any, record: ApplicationRecord) => (
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
          Thêm nhật ký
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={records}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingItem ? 'Sửa nhật ký' : 'Thêm nhật ký mới'}
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
                name="type"
                label="Loại hoạt động"
                rules={[{ required: true, message: 'Vui lòng chọn loại hoạt động' }]}
              >
                <Select>
                  {Object.entries(applicationTypeLabels).map(([key, label]) => (
                    <Select.Option key={key} value={key}>
                      {label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="application_date"
                label="Ngày thực hiện"
                rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="product_name"
            label="Tên sản phẩm (Phân bón/Thuốc)"
            rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
          >
            <Input placeholder="VD: Phân Ure, Thuốc trừ sâu..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="dosage"
                label="Liều lượng"
                rules={[{ required: true, message: 'Vui lòng nhập liều lượng' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} placeholder="VD: 50" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="unit"
                label="Đơn vị"
                rules={[{ required: true, message: 'Vui lòng nhập đơn vị' }]}
              >
                <Input placeholder="VD: kg/ha, lít/ha" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="area_applied"
                label="Diện tích áp dụng (m²)"
              >
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="applicator_name"
                label="Người thực hiện"
              >
                <Input placeholder="Tên người phun/bón" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ApplicationRecordsTab;
