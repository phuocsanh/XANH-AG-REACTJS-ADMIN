/**
 * Trang danh sách Chi phí Dịch vụ/Quà tặng
 * Quản lý tất cả chi phí dịch vụ với filter trong column headers
 */

import React, { useState } from 'react';
import { Card, Table, Button, Space, Tag, Popconfirm, Empty } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import ComboBox from '@/components/common/combo-box';
import FilterHeader from '@/components/common/filter-header';
import dayjs from 'dayjs';
import { useFarmServiceCostsQuery, useDeleteFarmServiceCostMutation } from '@/queries/farm-service-cost';
import { useSeasonsQuery } from '@/queries/season';
import { useCustomersQuery } from '@/queries/customer';
import { useRiceCrops } from '@/queries/rice-crop';
import type { FarmServiceCost } from '@/models/farm-service-cost';
import { FarmServiceCostModal } from './FarmServiceCostModal';

const FarmServiceCostList: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCost, setEditingCost] = useState<FarmServiceCost | null>(null);
  
  // Search states for ComboBox
  const [seasonSearch, setSeasonSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [riceCropSearch, setRiceCropSearch] = useState('');
  
  // Filters state
  const [filters, setFilters] = useState<{
    name?: string;
    season_id?: number;
    customer_id?: number;
    rice_crop_id?: number;
    source?: string;
  }>({});

  // Queries with search
  const { data: seasons, isLoading: isSeasonsLoading } = useSeasonsQuery({
    page: 1,
    limit: 20,
    keyword: seasonSearch,
  });
  
  const { data: customers, isLoading: isCustomersLoading } = useCustomersQuery({
    page: 1,
    limit: 20,
    keyword: customerSearch,
  });
  
  const { data: riceCrops, isLoading: isRiceCropsLoading } = useRiceCrops({
    season_id: filters.season_id,
    keyword: riceCropSearch,
    limit: 20,
  });
  
  const { data, isLoading } = useFarmServiceCostsQuery({
    ...filters,
    limit: 1000,
  });

  const deleteMutation = useDeleteFarmServiceCostMutation();

  // Handle filter change
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

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
      key: 'name',
      title: (
        <FilterHeader 
          title="Tên chi phí/Quà tặng" 
          dataIndex="name" 
          value={filters.name} 
          onChange={(val) => handleFilterChange('name', val)}
          inputType="text"
        />
      ),
      width: 200,
      render: (record: FarmServiceCost) => (
        <div className="font-medium">{record.name}</div>
      ),
    },
    {
      key: 'amount',
      dataIndex: 'amount',
      title: 'Số tiền',
      width: 130,
      render: (amount: number) => (
        <span className="font-semibold text-red-600">{formatCurrency(amount)}</span>
      ),
    },
    {
      key: 'season_id',
      title: (
        <div className="flex flex-col gap-2 py-1" onClick={(e) => e.stopPropagation()}>
          <div className="font-semibold text-gray-700">Mùa vụ</div>
          <ComboBox
            placeholder="Chọn mùa vụ"
            value={filters.season_id}
            onChange={(val) => handleFilterChange('season_id', val)}
            onSearch={setSeasonSearch}
            options={(seasons?.data?.items || []).map((s: any) => ({
              value: s.id,
              label: `${s.name} (${s.year})`,
            }))}
            isLoading={isSeasonsLoading}
            allowClear
            showSearch
            filterOption={false}
            style={{ width: '100%', minWidth: 120 }}
            size="small"
          />
        </div>
      ),
      width: 150,
      render: (record: FarmServiceCost) => (
        <span>{record.season?.name} ({record.season?.year})</span>
      ),
    },
    {
      key: 'customer_id',
      title: (
        <div className="flex flex-col gap-2 py-1" onClick={(e) => e.stopPropagation()}>
          <div className="font-semibold text-gray-700">Khách hàng</div>
          <ComboBox
            placeholder="Chọn khách hàng"
            value={filters.customer_id}
            onChange={(val) => handleFilterChange('customer_id', val)}
            onSearch={setCustomerSearch}
            options={(customers?.data?.items || []).map((c: any) => ({
              value: c.id,
              label: c.name,
            }))}
            isLoading={isCustomersLoading}
            allowClear
            showSearch
            filterOption={false}
            style={{ width: '100%', minWidth: 120 }}
            size="small"
          />
        </div>
      ),
      width: 150,
      render: (record: FarmServiceCost) => (
        <div>{record.customer?.name}</div>
      ),
    },
    {
      key: 'rice_crop_id',
      title: (
        <div className="flex flex-col gap-2 py-1" onClick={(e) => e.stopPropagation()}>
          <div className="font-semibold text-gray-700">Ruộng lúa</div>
          <ComboBox
            placeholder="Chọn ruộng"
            value={filters.rice_crop_id}
            onChange={(val) => handleFilterChange('rice_crop_id', val)}
            onSearch={setRiceCropSearch}
            options={(riceCrops?.data || []).map((r: any) => ({
              value: r.id,
              label: r.field_name,
            }))}
            isLoading={isRiceCropsLoading}
            allowClear
            showSearch
            filterOption={false}
            style={{ width: '100%', minWidth: 120 }}
            size="small"
          />
        </div>
      ),
      width: 150,
      render: (record: FarmServiceCost) => (
        <div>{record.rice_crop?.field_name || '-'}</div>
      ),
    },
    {
      key: 'expense_date',
      dataIndex: 'expense_date',
      title: 'Ngày phát sinh',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      key: 'source',
      title: (
        <div className="flex flex-col gap-2 py-1" onClick={(e) => e.stopPropagation()}>
          <div className="font-semibold text-gray-700">Nguồn</div>
          <ComboBox
            placeholder="Chọn nguồn"
            value={filters.source}
            onChange={(val) => handleFilterChange('source', val)}
            options={[
              { value: 'manual', label: 'Nhập tay' },
              { value: 'gift_from_invoice', label: 'Quà tặng HĐ' },
            ]}
            allowClear
            style={{ width: '100%', minWidth: 120 }}
            size="small"
          />
        </div>
      ),
      width: 130,
      render: (record: FarmServiceCost) => (
        <Tag color={record.source === 'gift_from_invoice' ? 'green' : 'blue'}>
          {record.source === 'gift_from_invoice' ? 'Quà tặng HĐ' : 'Nhập tay'}
        </Tag>
      ),
    },
    {
      key: 'notes',
      dataIndex: 'notes',
      title: 'Ghi chú',
      width: 180,
      render: (notes?: string) => notes || '-',
    },
    {
      key: 'actions',
      title: 'Thao tác',
      width: 100,
      render: (record: FarmServiceCost) => (
        <Space size="small">
          {record.source === 'manual' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
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
                />
              </Popconfirm>
            </>
          )}
          {record.source === 'gift_from_invoice' && (
            <Tag color="gold">Tự động</Tag>
          )}
        </Space>
      ),
    },
  ];

  const totalAmount = data?.data?.reduce((sum: number, item: FarmServiceCost) => sum + Number(item.amount), 0) || 0;

  return (
    <div className="p-2 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🎁 Chi phí Dịch vụ/Quà tặng</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          size="large"
        >
          Thêm chi phí
        </Button>
      </div>

      {/* Summary */}
      {data?.data && data.data.length > 0 && (
        <Card className="mb-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-gray-600">Tổng số bản ghi: </span>
              <span className="font-bold">{data.data.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Tổng chi phí: </span>
              <span className="text-xl font-bold text-red-600">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={data?.data || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 50,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} bản ghi`,
          }}
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
          scroll={{ x: 1400 }}
        />
      </Card>

      <FarmServiceCostModal
        open={isModalVisible}
        onCancel={handleModalClose}
        editingCost={editingCost}
      />
    </div>
  );
};

export default FarmServiceCostList;
