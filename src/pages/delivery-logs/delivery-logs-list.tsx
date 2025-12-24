import React, { useState } from 'react';
import { Card, Table, Tag, Button, Space, Popconfirm, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import {
  useDeliveryLogs,
  useDeleteDeliveryLog,
  useUpdateDeliveryStatus,
} from '../../queries/delivery-logs';
import { DeliveryLog, DeliveryStatus } from '../../models/delivery-log.model';
import { formatCurrency } from '../../utils/format';

const { Option } = Select;

/**
 * Component danh sách phiếu giao hàng
 */
const DeliveryLogsList: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | undefined>();

  // Queries
  const { data, isLoading } = useDeliveryLogs({ page, limit, status: statusFilter });
  const deleteMutation = useDeleteDeliveryLog();
  const updateStatusMutation = useUpdateDeliveryStatus();

  // Handlers
  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleStatusChange = (id: number, status: DeliveryStatus) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleCreate = () => {
    navigate('/delivery-logs/create');
  };

  const handleEdit = (id: number) => {
    navigate(`/delivery-logs/${id}/edit`);
  };

  const handleView = (id: number) => {
    navigate(`/delivery-logs/${id}`);
  };

  // Render status tag
  const renderStatus = (status: DeliveryStatus) => {
    const statusConfig = {
      [DeliveryStatus.PENDING]: { color: 'orange', text: 'Chờ giao' },
      [DeliveryStatus.COMPLETED]: { color: 'green', text: 'Đã giao' },
      [DeliveryStatus.FAILED]: { color: 'red', text: 'Thất bại' },
      [DeliveryStatus.CANCELLED]: { color: 'default', text: 'Đã hủy' },
    };

    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // Table columns
  const columns: ColumnsType<DeliveryLog> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Ngày giao',
      dataIndex: 'delivery_date',
      key: 'delivery_date',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Hóa đơn',
      dataIndex: 'invoice_id',
      key: 'invoice_id',
      width: 100,
      render: (invoiceId: number) => invoiceId || '-',
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'delivery_address',
      key: 'delivery_address',
      ellipsis: true,
      render: (address: string) => address || '-',
    },
    {
      title: 'Người nhận',
      dataIndex: 'receiver_name',
      key: 'receiver_name',
      width: 150,
      render: (name: string) => name || '-',
    },
    {
      title: 'SĐT',
      dataIndex: 'receiver_phone',
      key: 'receiver_phone',
      width: 120,
      render: (phone: string) => phone || '-',
    },
    {
      title: 'Tài xế',
      dataIndex: 'driver_name',
      key: 'driver_name',
      width: 120,
      render: (name: string) => name || '-',
    },
    {
      title: 'Chi phí',
      dataIndex: 'total_cost',
      key: 'total_cost',
      width: 120,
      align: 'right',
      render: (cost: number) => formatCurrency(cost || 0),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: DeliveryStatus, record: DeliveryLog) => (
        <Select
          value={status}
          style={{ width: '100%' }}
          onChange={(value) => handleStatusChange(record.id!, value)}
          size="small"
        >
          <Option value={DeliveryStatus.PENDING}>
            <Tag color="orange">Chờ giao</Tag>
          </Option>
          <Option value={DeliveryStatus.COMPLETED}>
            <Tag color="green">Đã giao</Tag>
          </Option>
          <Option value={DeliveryStatus.FAILED}>
            <Tag color="red">Thất bại</Tag>
          </Option>
          <Option value={DeliveryStatus.CANCELLED}>
            <Tag color="default">Đã hủy</Tag>
          </Option>
        </Select>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record: DeliveryLog) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record.id!)}
          >
            Xem
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record.id!)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa?"
            description="Bạn có chắc chắn muốn xóa phiếu giao hàng này?"
            onConfirm={() => handleDelete(record.id!)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="Danh sách Phiếu Giao Hàng"
        extra={
          <Space>
            <Select
              placeholder="Lọc theo trạng thái"
              style={{ width: 200 }}
              allowClear
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value={DeliveryStatus.PENDING}>Chờ giao</Option>
              <Option value={DeliveryStatus.COMPLETED}>Đã giao</Option>
              <Option value={DeliveryStatus.FAILED}>Thất bại</Option>
              <Option value={DeliveryStatus.CANCELLED}>Đã hủy</Option>
            </Select>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Tạo phiếu giao hàng
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={data?.items || []}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1400 }}
          pagination={{
            current: page,
            pageSize: limit,
            total: data?.total || 0,
            onChange: setPage,
            showSizeChanger: false,
            showTotal: (total) => `Tổng ${total} phiếu`,
          }}
        />
      </Card>
    </div>
  );
};

export default DeliveryLogsList;
