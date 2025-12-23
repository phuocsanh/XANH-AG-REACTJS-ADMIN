/**
 * Tab quản lý chi phí dịch vụ/quà tặng của cửa hàng dành cho ruộng lúa
 */

import React, { useState } from 'react';
import { Table, Button, Space, Tag, Popconfirm, Card, Empty } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useFarmServiceCostsQuery, useDeleteFarmServiceCostMutation } from '@/queries/farm-service-cost';
import type { FarmServiceCost } from '@/models/farm-service-cost';
import { FarmServiceCostModal } from './FarmServiceCostModal';

interface FarmServiceCostTabProps {
  riceCropId: number;
}

const FarmServiceCostTab: React.FC<FarmServiceCostTabProps> = ({ riceCropId }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCost, setEditingCost] = useState<FarmServiceCost | null>(null);

  // Query để lấy danh sách chi phí
  const { data, isLoading } = useFarmServiceCostsQuery({
    rice_crop_id: riceCropId,
    limit: 100,
  });

  const deleteMutation = useDeleteFarmServiceCostMutation();

  const handleAdd = () => {
    setEditingCost(null);
    setIsModalVisible(true);
  };

  const handleEdit = (record: FarmServiceCost) => {
    setEditingCost(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync(id);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setEditingCost(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const columns = [
    {
      title: 'Tên chi phí/Quà tặng',
      dataIndex: 'name',
      key: 'name',
      width: '25%',
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      width: '15%',
      render: (amount: number) => (
        <span className="font-semibold text-red-600">{formatCurrency(amount)}</span>
      ),
    },
    {
      title: 'Ngày phát sinh',
      dataIndex: 'expense_date',
      key: 'expense_date',
      width: '12%',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Nguồn',
      dataIndex: 'source',
      key: 'source',
      width: '12%',
      render: (source: string) => (
        <Tag color={source === 'gift_from_invoice' ? 'green' : 'blue'}>
          {source === 'gift_from_invoice' ? 'Quà tặng HĐ' : 'Nhập tay'}
        </Tag>
      ),
    },
    {
      title: 'Ghi chú',
      dataIndex: 'notes',
      key: 'notes',
      width: '26%',
      render: (notes?: string) => notes || '-',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: '10%',
      render: (_: any, record: FarmServiceCost) => (
        <Space size="small">
          {record.source === 'manual' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                Sửa
              </Button>
              <Popconfirm
                title="Xác nhận xóa"
                description="Bạn có chắc muốn xóa chi phí này?"
                onConfirm={() => handleDelete(record.id)}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  loading={deleteMutation.isPending}
                >
                  Xóa
                </Button>
              </Popconfirm>
            </>
          )}
          {record.source === 'gift_from_invoice' && (
            <Tag color="gold">Tự động từ HĐ</Tag>
          )}
        </Space>
      ),
    },
  ];

  const totalAmount = data?.data?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

  return (
    <Card
      title={
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm sm:text-base">🎁 Chi phí DV/Quà tặng</span>
            {data?.data && data.data.length > 0 && (
              <span className="text-base sm:text-lg font-bold text-red-600">
                {formatCurrency(totalAmount)}
              </span>
            )}
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            size="small"
            className="sm:size-default"
          >
            Thêm
          </Button>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <Table
          columns={columns}
          dataSource={data?.data || []}
          rowKey="id"
          loading={isLoading}
          pagination={false}
          locale={{
            emptyText: (
              <Empty
                description="Chưa có chi phí dịch vụ/quà tặng nào"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                  Thêm chi phí đầu tiên
                </Button>
              </Empty>
            ),
          }}
          scroll={{ x: 800 }}
        />
      </div>

      <FarmServiceCostModal
        open={isModalVisible}
        onCancel={handleModalClose}
        riceCropId={riceCropId}
        editingCost={editingCost}
      />
    </Card>
  );
};

export default FarmServiceCostTab;
