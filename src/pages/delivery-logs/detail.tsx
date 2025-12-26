import React from 'react';
import { Card, Descriptions, Tag, Button, Space, Spin, Table } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useDeliveryLog } from '../../queries/delivery-logs';
import { DeliveryStatus, DeliveryLog as DeliveryLogType } from '../../models/delivery-log.model';
import { formatCurrency } from '../../utils/format';
import dayjs from 'dayjs';

/**
 * Trang xem chi tiết phiếu giao hàng
 */
const DeliveryLogDetail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  
  // Ưu tiên dùng data từ state, chỉ load từ API nếu không có
  const stateData = location.state?.deliveryLog as DeliveryLogType | undefined;
  const { data: apiData, isLoading } = useDeliveryLog(Number(id));
  
  const deliveryLog = stateData || apiData;

  const loading = !stateData && isLoading;

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!deliveryLog) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <p>Không tìm thấy phiếu giao hàng</p>
          <Button onClick={() => navigate('/delivery-logs')}>Quay lại</Button>
        </Card>
      </div>
    );
  }

  const statusConfig = {
    [DeliveryStatus.PENDING]: { color: 'orange', text: 'Chờ giao' },
    [DeliveryStatus.COMPLETED]: { color: 'green', text: 'Đã giao' },
    [DeliveryStatus.FAILED]: { color: 'red', text: 'Thất bại' },
    [DeliveryStatus.CANCELLED]: { color: 'default', text: 'Đã hủy' },
  };

  const config = statusConfig[deliveryLog.status!] || { color: 'default', text: deliveryLog.status };

  const columns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'product_name',
      key: 'product_name',
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity_delivered',
      key: 'quantity_delivered',
      align: 'right' as const,
    },
    {
      title: 'Đơn vị',
      dataIndex: 'unit',
      key: 'unit',
    },
    {
      title: 'Ghi chú',
      dataIndex: 'notes',
      key: 'notes',
      render: (text: string) => text || '-',
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/delivery-logs')}
        >
          Quay lại
        </Button>

        <Card title={`Chi tiết phiếu giao hàng #${deliveryLog.id}`}>
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Ngày giao">
              {deliveryLog.delivery_date ? dayjs(deliveryLog.delivery_date).format('DD/MM/YYYY') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Giờ xuất phát">
              {deliveryLog.delivery_start_time || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Địa chỉ giao">
              {deliveryLog.delivery_address || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Người nhận">
              {deliveryLog.receiver_name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="SĐT người nhận">
              {deliveryLog.receiver_phone || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Tài xế">
              {deliveryLog.driver_name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Biển số xe">
              {deliveryLog.vehicle_number || deliveryLog.vehicle_plate || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={config.color}>{config.text}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Chi phí nhiên liệu">
              {formatCurrency(deliveryLog.fuel_cost || 0)}
            </Descriptions.Item>
            <Descriptions.Item label="Chi phí tài xế">
              {formatCurrency(deliveryLog.driver_cost || 0)}
            </Descriptions.Item>
            <Descriptions.Item label="Chi phí khác">
              {formatCurrency(deliveryLog.other_costs || 0)}
            </Descriptions.Item>
            <Descriptions.Item label="Tổng chi phí">
              <strong>{formatCurrency(deliveryLog.total_cost || 0)}</strong>
            </Descriptions.Item>
            {deliveryLog.delivery_notes && (
              <Descriptions.Item label="Ghi chú" span={2}>
                {deliveryLog.delivery_notes}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {deliveryLog.items && deliveryLog.items.length > 0 && (
          <Card title="Danh sách sản phẩm">
            <Table
              columns={columns}
              dataSource={deliveryLog.items}
              rowKey="id"
              pagination={false}
            />
          </Card>
        )}
      </Space>
    </div>
  );
};

export default DeliveryLogDetail;
