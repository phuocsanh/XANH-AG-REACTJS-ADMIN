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
    const deliveryLog = data?.data?.find(log => log.id === id);
    navigate(`/delivery-logs/edit/${id}`, { state: { deliveryLog } });
  };

  const handleView = (id: number) => {
    const deliveryLog = data?.data?.find(log => log.id === id);
    navigate(`/delivery-logs/${id}`, { state: { deliveryLog } });
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
      title: 'STT',
      key: 'stt',
      width: 60,
      align: 'center',
      render: (_: unknown, __: DeliveryLog, index: number) => {
        // Tính STT dựa trên trang hiện tại và limit
        const stt = (page - 1) * limit + index + 1;
        return <div className='font-medium text-gray-600'>{stt}</div>;
      },
    },
    {
      title: 'Ngày giao',
      dataIndex: 'delivery_date',
      key: 'delivery_date',
      width: 150,
      render: (_: string, record: DeliveryLog) => {
        const date = new Date(record.delivery_date).toLocaleDateString('vi-VN');
        const timeStr = (record as any).delivery_start_time || '';
        // Chuyển HH:mm:ss thành HH:mm
        const time = timeStr ? timeStr.substring(0, 5) : '';
        return (
          <div>
            <div style={{ fontSize: '14px', fontWeight: 500 }}>{date}</div>
            {time && <div style={{ fontSize: '14px', color: '#595959', marginTop: '2px', fontWeight: 500 }}>{time}</div>}
          </div>
        );
      },
    },
    {
      title: 'Loại phiếu',
      key: 'type',
      width: 120,
      align: 'center',
      render: (_: unknown, record: DeliveryLog) => {
        const hasInvoice = record.invoice_id || (record as any).invoice?.code || (record as any).invoice_code;
        return hasInvoice 
          ? <Tag color="blue">Từ hóa đơn</Tag>
          : <Tag color="green">Tự tạo</Tag>;
      },
    },
    {
      title: 'Hóa đơn',
      dataIndex: 'invoice_id',
      key: 'invoice_id',
      width: 150,
      render: (_: number, record: DeliveryLog) => {
        // Hiển thị mã hóa đơn nếu có, nếu không thì hiển thị '-'
        return (record as any).invoice?.code || (record as any).invoice_code || '-';
      },
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
      width: 150,
      render: (status: DeliveryStatus, record: DeliveryLog) => (
        <Select
          value={status}
          style={{ width: '100%' }}
          onChange={(value) => handleStatusChange(record.id!, value)}
          size="small"
          bordered={false}
        >
          <Option value={DeliveryStatus.PENDING}>Chờ giao</Option>
          <Option value={DeliveryStatus.COMPLETED}>Đã giao</Option>
          <Option value={DeliveryStatus.FAILED}>Thất bại</Option>
          <Option value={DeliveryStatus.CANCELLED}>Đã hủy</Option>
        </Select>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      render: (_, record: DeliveryLog) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record.id!)}
          />
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record.id!)}
          />
          <Popconfirm
            title="Xác nhận xóa?"
            description="Bạn có chắc chắn muốn xóa phiếu giao hàng này?"
            onConfirm={() => handleDelete(record.id!)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
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
          dataSource={data?.data || []}
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
