/**
 * Tab quản lý chi phí dịch vụ của cửa hàng dành cho ruộng lúa
 */

import React, { useState } from 'react';
import { Table, Button, Space, Tag, Popconfirm, Card, Empty, Tabs } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { 
  useFarmServiceCostsQuery, 
  useDeleteFarmServiceCostMutation,
  useFarmGiftCostsQuery,
  useDeleteFarmGiftCostMutation
} from '@/queries/farm-service-cost';
import type { FarmServiceCost } from '@/models/farm-service-cost';
import { FarmServiceCostModal } from './FarmServiceCostModal';

interface FarmServiceCostTabProps {
  riceCropId: number;
  customerId: number;
}

const FarmServiceCostTab: React.FC<FarmServiceCostTabProps> = ({ riceCropId, customerId }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCost, setEditingCost] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'service' | 'gift'>('service');

  // Query để lấy danh sách chi phí dịch vụ
  const { data: serviceData, isLoading: isServiceLoading } = useFarmServiceCostsQuery({
    rice_crop_id: riceCropId,
    customer_id: customerId,
    limit: 100,
  });

  // Query để lấy danh sách quà tặng
  const { data: giftData, isLoading: isGiftLoading } = useFarmGiftCostsQuery({
    rice_crop_id: riceCropId,
    customer_id: customerId,
    limit: 100,
  });

  const deleteServiceMutation = useDeleteFarmServiceCostMutation();
  const deleteGiftMutation = useDeleteFarmGiftCostMutation();

  const handleAdd = () => {
    setEditingCost(null);
    setIsModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingCost(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    if (activeTab === 'service') {
      await deleteServiceMutation.mutateAsync(id);
    } else {
      await deleteGiftMutation.mutateAsync(id);
    }
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setEditingCost(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("de-DE").format(value) + " ₫";
  };

  const columns = [
    {
      title: activeTab === 'service' ? 'Tên chi phí dịch vụ' : 'Tên quà tặng',
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
        <span className={`font-semibold ${activeTab === 'service' ? 'text-red-600' : 'text-pink-600'}`}>
          {formatCurrency(amount)}
        </span>
      ),
    },
    {
      title: activeTab === 'service' ? 'Ngày phát sinh' : 'Ngày tặng',
      dataIndex: activeTab === 'service' ? 'expense_date' : 'gift_date',
      key: 'date',
      width: '12%',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Nguồn',
      dataIndex: 'source',
      key: 'source',
      width: '12%',
      render: (source: string) => {
        const labels: any = {
          'manual': { text: 'Nhập tay', color: 'blue' },
          'manually_awarded': { text: 'Nhập tay', color: 'blue' },
          'gift_from_invoice': { text: 'Từ HĐ', color: 'green' },
          'reward_from_debt_note': { text: 'Từ Chốt sổ', color: 'purple' },
        };
        const item = labels[source] || { text: source, color: 'default' };
        return <Tag color={item.color}>{item.text}</Tag>;
      }
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
      width: '15%',
      render: (_: any, record: any) => {
        const canEdit = record.source === 'manual' || record.source === 'manually_awarded';
        return (
          <Space size="small">
            {canEdit ? (
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
                  description="Bạn có chắc muốn xóa mục này?"
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
                    loading={deleteServiceMutation.isPending || deleteGiftMutation.isPending}
                  >
                    Xóa
                  </Button>
                </Popconfirm>
              </>
            ) : (
              <Tag color="orange">Tự động</Tag>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <Card
      title={
        <div className="flex justify-between items-center w-full">
           <span>💰 Chi phí cửa hàng</span>
           <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            size="small"
          >
            Thêm {activeTab === 'service' ? 'chi phí' : 'quà tặng'}
          </Button>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <Tabs
          activeKey={activeTab}
          onChange={(key: any) => setActiveTab(key)}
          items={[
            {
              key: 'service',
              label: `💸 Chi phí Dịch vụ (${formatCurrency(serviceData?.data?.reduce((sum: number, item: any) => sum + Number(item.amount), 0) || 0)})`,
              children: (
                <Table
                  columns={columns}
                  dataSource={serviceData?.data || []}
                  rowKey="id"
                  loading={isServiceLoading}
                  pagination={false}
                  scroll={{ x: 800 }}
                />
              )
            },
            {
              key: 'gift',
              label: `🎁 Quà tặng (${formatCurrency(giftData?.data?.reduce((sum: number, item: any) => sum + Number(item.amount), 0) || 0)})`,
              children: (
                <Table
                  columns={columns}
                  dataSource={giftData?.data || []}
                  rowKey="id"
                  loading={isGiftLoading}
                  pagination={false}
                  scroll={{ x: 800 }}
                />
              )
            }
          ]}
        />
      </div>

      <FarmServiceCostModal
        open={isModalVisible}
        onCancel={handleModalClose}
        riceCropId={riceCropId}
        editingCost={editingCost}
        mode={activeTab}
      />
    </Card>
  );
};

export default FarmServiceCostTab;
