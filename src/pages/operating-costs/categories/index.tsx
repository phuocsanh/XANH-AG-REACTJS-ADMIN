import React, { useState } from 'react';
import { Button, Space, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import DataTable from '@/components/common/data-table';
import FilterHeader from '@/components/common/filter-header';
import { ConfirmModal } from '@/components/common';
import { useOperatingCostCategories, useDeleteOperatingCostCategory } from '@/queries/operating-cost-category';
import { OperatingCostCategory } from '@/models/operating-cost-category';
import CategoryModal from './modal';
import dayjs from 'dayjs';

const OperatingCostCategoriesPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<OperatingCostCategory | null>(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deletingItem, setDeletingItem] = useState<OperatingCostCategory | null>(null);

  const { data: categoriesData, isLoading } = useOperatingCostCategories({
    page: currentPage,
    limit: pageSize,
    ...filters
  });

  const deleteMutation = useDeleteOperatingCostCategory();

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    if (!value) delete newFilters[key];
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setIsModalVisible(true);
  };

  const handleEdit = (record: OperatingCostCategory) => {
    setEditingItem(record);
    setIsModalVisible(true);
  };

  const handleDelete = (record: OperatingCostCategory) => {
    setDeletingItem(record);
    setDeleteConfirmVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    
    try {
      await deleteMutation.mutateAsync(deletingItem.id);
      message.success('Đã xóa loại chi phí');
      setDeleteConfirmVisible(false);
      setDeletingItem(null);
    } catch (error) {
      message.error('Có lỗi xảy ra khi xóa');
      setDeleteConfirmVisible(false);
      setDeletingItem(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmVisible(false);
    setDeletingItem(null);
  };

  const columns: any[] = [
    {
      title: (
        <FilterHeader
          title="Tên loại"
          dataIndex="name"
          value={filters.name}
          onChange={(val) => handleFilterChange('name', val)}
          inputType="text"
        />
      ),
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="font-medium">{text}</span>
    },
    {
      title: (
        <FilterHeader
          title="Mã loại"
          dataIndex="code"
          value={filters.code}
          onChange={(val) => handleFilterChange('code', val)}
          inputType="text"
        />
      ),
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 100,
      render: (_: any, record: OperatingCostCategory) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} size="small" />
          <Button 
            icon={<DeleteOutlined />} 
            danger 
            size="small" 
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="p-2 md:p-6">
       <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-lg shadow-sm">
        <h1 className="text-xl font-bold m-0">Danh sách Loại chi phí vận hành</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          className="bg-green-600 hover:bg-green-500"
        >
          Thêm loại mới
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm">
        <DataTable
          columns={columns}
          data={(categoriesData?.data as any[]) || []}
          loading={isLoading}
          onChange={handleTableChange}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: categoriesData?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total: number, range: [number, number]) => 
                `${range[0]}-${range[1]} của ${total} mục`,
          }}
          rowKey="id"
        />
      </div>

      <CategoryModal
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        initialData={editingItem}
      />

      <ConfirmModal
        open={deleteConfirmVisible}
        title='Xác nhận xóa'
        content={
          deletingItem
            ? `Bạn có chắc chắn muốn xóa loại chi phí "${deletingItem.name}"?`
            : ""
        }
        okText='Xóa'
        okType='primary'
        cancelText='Hủy'
        confirmLoading={deleteMutation.isPending}
        onOk={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default OperatingCostCategoriesPage;
