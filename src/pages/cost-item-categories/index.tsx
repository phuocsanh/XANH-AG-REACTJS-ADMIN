import React, { useState } from 'react';
import { Button, Table, Tag, Space, Popconfirm, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import DataTable from '@/components/common/data-table';
import type { ColumnsType } from 'antd/es/table';
import {
  useCostItemCategories,
  useDeleteCostItemCategory,
} from '@/queries/cost-item-category';
import type { CostItemCategory } from '@/models/cost-item-category';
import CreateCostItemCategoryModal from './create-modal';

/**
 * Trang quản lý Loại chi phí canh tác (Admin only)
 */
const CostItemCategoriesPage: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CostItemCategory | null>(null);

  const { data: categoriesData, isLoading } = useCostItemCategories();
  const deleteMutation = useDeleteCostItemCategory();

  const categories = categoriesData?.data || [];

  const handleAdd = () => {
    setEditingCategory(null);
    setIsModalVisible(true);
  };

  const handleEdit = (category: CostItemCategory) => {
    setEditingCategory(category);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync(id);
  };

  const columns: ColumnsType<CostItemCategory> = [
    {
      title: 'Tên loại',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: 'Mã',
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 120,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Tạm ngưng'}
        </Tag>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 120,
      render: (_: any, record: CostItemCategory) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa loại chi phí này?"
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
    <div className="p-2 md:p-6">
      <Card
        title={
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">📋 Loại chi phí canh tác</span>
          </div>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Thêm loại chi phí
          </Button>
        }
      >
        <DataTable
          columns={columns as any}
          data={categories}
          rowKey="id"
          loading={isLoading}
          onView={(record: any) => handleEdit(record as any)}
          paginationConfig={{
            pageSize: 20,
            showTotal: (total: number) => `Tổng ${total} loại`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <CreateCostItemCategoryModal
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        initialData={editingCategory}
      />
    </div>
  );
};

export default CostItemCategoriesPage;
