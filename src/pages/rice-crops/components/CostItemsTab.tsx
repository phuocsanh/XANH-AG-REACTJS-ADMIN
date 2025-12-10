import React, { useState } from 'react';
import {
  Button,
  Table,
  Tag,
  Space,
  Modal,
  message,
  Card,
  Row,
  Col,
  Statistic,
  Popconfirm
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  useOperatingCosts,
  useDeleteOperatingCost,
} from '@/queries/operating-cost';
import { useRiceCrop } from '@/queries/rice-crop';
import { OperatingCost } from '@/types/operating-cost.types';
import CreateOperatingCostModal from '@/pages/operating-costs/create-modal';

interface CostItemsTabProps {
  riceCropId: number;
}

const CostItemsTab: React.FC<CostItemsTabProps> = ({ riceCropId }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<OperatingCost | null>(null);

  // Get Rice Crop details (for season_id)
  const { data: riceCrop } = useRiceCrop(riceCropId);

  // Queries - Filter by rice_crop_id
  const { data: costsData, isLoading } = useOperatingCosts({
    limit: 100, // Load all for this crop (assumption)
    filters: {
        rice_crop_id: riceCropId 
    }
  });

  const deleteMutation = useDeleteOperatingCost();

  const handleAdd = () => {
    setEditingItem(null);
    setIsModalVisible(true);
  };

  const handleEdit = (item: OperatingCost) => {
    setEditingItem(item);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      message.success('Đã xóa chi phí');
    } catch (error) {
      message.error('Có lỗi xảy ra khi xóa chi phí');
    }
  };

  // Calculate total
  const totalCost = costsData?.data?.reduce((sum, item) => sum + Number(item.value), 0) || 0;

  const columns = [
    {
      title: 'Tên chi phí',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="font-medium">{text}</span>
    },
    {
      title: 'Số tiền',
      dataIndex: 'value',
      key: 'value',
      render: (val: any) => <span className="text-red-600 font-bold">{Number(val).toLocaleString('vi-VN')} đ</span>,
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
          const colors: Record<string, string> = {
              fertilizer: 'green',
              pesticide: 'red',
              labor: 'orange',
              machinery: 'blue',
              fuel: 'purple',
              other: 'default'
          };
          const labels: Record<string, string> = {
              fertilizer: 'Phân bón',
              pesticide: 'Thuốc BVTV',
              labor: 'Nhân công',
              machinery: 'Máy móc',
              fuel: 'Nhiên liệu',
              other: 'Khác'
          };
          return <Tag color={colors[type] || 'default'}>{labels[type] || type}</Tag>;
      }
    },
    {
      title: 'Ngày chi',
      dataIndex: 'expense_date',
      key: 'expense_date',
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
    },
    {
        title: 'Ghi chú',
        dataIndex: 'description',
        key: 'description',
        ellipsis: true,
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: OperatingCost) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa chi phí này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
             <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4">
        <Row gutter={16}>
          <Col span={8}>
            <Card bodyStyle={{ padding: '12px 24px' }}>
              <Statistic
                title="Tổng chi phí"
                value={totalCost}
                precision={0}
                valueStyle={{ color: '#cf1322', fontWeight: 'bold' }}
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
        dataSource={costsData?.data || []}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
      />

      <CreateOperatingCostModal
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        initialData={editingItem}
        defaultValues={{
            rice_crop_id: riceCropId,
            season_id: riceCrop?.season_id // Pre-fill season from current rice crop
        }}
      />
    </div>
  );
};

export default CostItemsTab;
