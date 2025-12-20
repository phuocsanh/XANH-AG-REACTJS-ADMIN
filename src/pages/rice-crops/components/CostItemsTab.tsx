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
  Popconfirm,
  Empty
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useCostItems, useDeleteCostItem } from '@/queries/cost-item';
import type { CostItem } from '@/models/cost-item';
import { formatCurrency } from '@/utils/format';
import CreateCostItemModal from './CreateCostItemModal';

interface CostItemsTabProps {
  riceCropId: number;
}

/**
 * Tab hiển thị chi phí canh tác của ruộng lúa
 * (Giống, phân bón, thuốc, nhân công...)
 */
const CostItemsTab: React.FC<CostItemsTabProps> = ({ riceCropId }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<CostItem | null>(null);

  // Lấy danh sách chi phí canh tác
  const { data: costItems, isLoading } = useCostItems({
    rice_crop_id: riceCropId
  });

  const deleteMutation = useDeleteCostItem();

  const handleAdd = () => {
    setEditingItem(null);
    setIsModalVisible(true);
  };

  const handleEdit = (item: CostItem) => {
    setEditingItem(item);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id, cropId: riceCropId });
      message.success('Đã xóa chi phí canh tác');
    } catch (error) {
      message.error('Có lỗi xảy ra khi xóa');
    }
  };

  const items = costItems || [];
  const totalCost = items.reduce((sum, item) => sum + Number(item.total_cost || 0), 0);

  // Màu sắc cho loại chi phí
  const categoryColors: Record<string, string> = {
    seed: 'green',
    fertilizer: 'cyan',
    pesticide: 'red',
    labor: 'orange',
    machinery: 'blue',
    irrigation: 'purple',
    other: 'default'
  };

  const categoryLabels: Record<string, string> = {
    seed: 'Giống',
    fertilizer: 'Phân bón',
    pesticide: 'Thuốc BVTV',
    labor: 'Nhân công',
    machinery: 'Máy móc',
    irrigation: 'Tưới tiêu',
    other: 'Khác'
  };

  const columns = [
    {
      title: 'Tên chi phí',
      dataIndex: 'item_name',
      key: 'item_name',
      render: (text: string) => <span className="font-medium">{text}</span>
    },
    {
      title: 'Loại',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag color={categoryColors[category] || 'default'}>
          {categoryLabels[category] || category}
        </Tag>
      )
    },


    {
      title: 'Tổng tiền',
      dataIndex: 'total_cost',
      key: 'total_cost',
      align: 'right' as const,
      render: (val: number) => (
        <span className="text-red-600 font-bold">
          {formatCurrency(val)}
        </span>
      )
    },
    {
      title: 'Ngày chi',
      dataIndex: 'expense_date',
      key: 'expense_date',
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
    },
    {
      title: 'Ghi chú',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 120,
      render: (_: any, record: CostItem) => (
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
          <Col xs={24} sm={12} md={8}>
            <Card bodyStyle={{ padding: '12px 24px' }}>
              <Statistic
                title="Tổng chi phí canh tác"
                value={totalCost}
                precision={0}
                valueStyle={{ color: '#cf1322', fontWeight: 'bold' }}
                prefix={<DollarOutlined />}
                suffix="₫"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card bodyStyle={{ padding: '12px 24px' }}>
              <Statistic
                title="Số khoản chi"
                value={items.length}
                valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
                suffix="khoản"
              />
            </Card>
          </Col>
          <Col xs={24} md={8} className="flex justify-end items-end">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              style={{ marginTop: 16 }}
            >
              Thêm chi phí
            </Button>
          </Col>
        </Row>
      </div>

      <Table
        columns={columns}
        dataSource={items}
        rowKey="id"
        loading={isLoading}
        pagination={{ 
          pageSize: 10,
          showTotal: (total) => `Tổng ${total} khoản chi`
        }}
        locale={{
          emptyText: (
            <Empty
              description="Chưa có chi phí canh tác nào"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )
        }}
        scroll={{ x: 1000 }}
      />

      <CreateCostItemModal
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        initialData={editingItem}
        riceCropId={riceCropId}
      />
    </div>
  );
};

export default CostItemsTab;
