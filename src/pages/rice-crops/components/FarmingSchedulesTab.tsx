import React, { useState } from 'react';
import {
  Button,
  Table,
  Tag,
  Space,
  Modal,
  Popconfirm,
  Form,
  Input,
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
  CheckOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  useFarmingSchedules,
  useCreateFarmingSchedule,
  useUpdateFarmingSchedule,
  useDeleteFarmingSchedule,
  useCompleteFarmingSchedule,
} from '@/queries/farming-schedule';
import { FarmingSchedule, CreateFarmingScheduleDto, ScheduleStatus } from '@/types/rice-farming.types';

interface FarmingSchedulesTabProps {
  riceCropId: number;
}


const scheduleStatusLabels: Record<ScheduleStatus, string> = {
  pending: 'Chờ thực hiện',
  completed: 'Đã hoàn thành',
  cancelled: 'Đã hủy',
  overdue: 'Quá hạn',
};

const scheduleStatusColors: Record<ScheduleStatus, string> = {
  pending: 'warning',
  completed: 'success',
  cancelled: 'default',
  overdue: 'error',
};

const FarmingSchedulesTab: React.FC<FarmingSchedulesTabProps> = ({ riceCropId }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<FarmingSchedule | null>(null);
  const [form] = Form.useForm();

  // Queries
  const { data: schedules, isLoading } = useFarmingSchedules({ rice_crop_id: riceCropId });
  
  const createMutation = useCreateFarmingSchedule();
  const updateMutation = useUpdateFarmingSchedule();
  const deleteMutation = useDeleteFarmingSchedule();
  const completeMutation = useCompleteFarmingSchedule();

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (item: FarmingSchedule) => {
    setEditingItem(item);
    form.setFieldsValue({
      ...item,
      scheduled_date: item.scheduled_date ? dayjs(item.scheduled_date) : null,
      completed_date: item.completed_date ? dayjs(item.completed_date) : null,
      activity_name: item.activity_name,
      instructions: item.instructions,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id, cropId: riceCropId });
      message.success('Xóa lịch canh tác thành công');
    } catch (error) {
      message.error('Có lỗi xảy ra khi xóa lịch canh tác');
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await completeMutation.mutateAsync(id);
      message.success('Đã đánh dấu hoàn thành');
    } catch (error) {
      message.error('Có lỗi xảy ra');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const dto: CreateFarmingScheduleDto = {
        ...values,
        rice_crop_id: riceCropId,
        scheduled_date: values.scheduled_date?.format('YYYY-MM-DD'),
        completed_date: values.completed_date?.format('YYYY-MM-DD'),
      };

      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, dto });
        message.success('Cập nhật lịch canh tác thành công');
      } else {
        await createMutation.mutateAsync(dto);
        message.success('Thêm lịch canh tác thành công');
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
      title: 'Ngày dự kiến',
      dataIndex: 'scheduled_date',
      key: 'scheduled_date',
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
      sorter: (a: FarmingSchedule, b: FarmingSchedule) => dayjs(a.scheduled_date).unix() - dayjs(b.scheduled_date).unix(),
    },
    {
      title: 'Công việc',
      dataIndex: 'activity_name',
      key: 'activity_name',
      render: (text: string) => (
        <span className="font-medium">
          {text}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: ScheduleStatus) => (
        <Tag color={scheduleStatusColors[status]}>
          {scheduleStatusLabels[status]}
        </Tag>
      ),
    },
    {
      title: 'Ngày hoàn thành',
      dataIndex: 'completed_date',
      key: 'completed_date',
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: FarmingSchedule) => (
        <Space size="middle">
          {record.status === 'pending' && (
            <Popconfirm
              title="Xác nhận hoàn thành"
              description="Đánh dấu công việc này đã hoàn thành hôm nay?"
              onConfirm={() => handleComplete(record.id)}
              okText="Đồng ý"
              cancelText="Hủy"
            >
              <Button
                type="text"
                icon={<CheckOutlined />}
                className="text-green-600 flex items-center justify-center w-10 h-10"
                title="Đánh dấu hoàn thành"
              />
            </Popconfirm>
          )}
          <Button
            type="text"
            icon={<EditOutlined />}
            className="flex items-center justify-center w-10 h-10"
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa lịch canh tác này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              className="flex items-center justify-center w-10 h-10"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex sm:justify-end">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          className="w-full sm:w-auto"
        >
          Thêm công việc
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={Array.isArray(schedules) ? schedules : []}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }}
      />

      <Modal
        title={editingItem ? 'Sửa lịch canh tác' : 'Thêm công việc mới'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        width={600}
        okText={editingItem ? 'Cập nhật' : 'Lưu'}
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="activity_name"
            label="Tên công việc"
            rules={[{ required: true, message: 'Vui lòng nhập tên công việc' }]}
          >
            <Input placeholder="VD: Bón phân đợt 1" />
          </Form.Item>

          <Row gutter={16} style={{ display: 'flex', flexWrap: 'wrap' }}>
            <Col span={24}>
              <Form.Item
                name="scheduled_date"
                label="Ngày dự kiến"
                rules={[{ required: true, message: 'Vui lòng chọn ngày dự kiến' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16} style={{ display: 'flex', flexWrap: 'wrap' }}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Trạng thái"
                initialValue="pending"
              >
                <Select>
                  {Object.entries(scheduleStatusLabels).map(([key, label]) => (
                    <Select.Option key={key} value={key}>
                      {label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => prevValues.status !== currentValues.status}
              >
                {({ getFieldValue }) =>
                  getFieldValue('status') === 'completed' ? (
                    <Form.Item name="completed_date" label="Ngày hoàn thành thực tế">
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                  ) : null
                }
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="instructions" label="Mô tả chi tiết">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FarmingSchedulesTab;
