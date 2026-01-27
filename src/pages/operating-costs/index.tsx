import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Tag, Popconfirm, message, Modal, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, FilterOutlined, SearchOutlined } from '@ant-design/icons';
import { useOperatingCosts, useDeleteOperatingCost } from '@/queries/operating-cost';
import { OperatingCost } from '@/models/operating-cost';
import CreateOperatingCostModal from './create-modal';
import dayjs from 'dayjs';
import { useSeasonsQuery, useActiveSeasonQuery } from '@/queries/season';
import { useOperatingCostCategories } from '@/queries/operating-cost-category';
import DataTable from "@/components/common/data-table";
import FilterHeader from "@/components/common/filter-header";
import type { TableProps } from "antd";

const OperatingCostsPage: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<OperatingCost | null>(null);
  
  // Filters State
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data: seasons } = useSeasonsQuery({ limit: 100 });
  const { data: activeSeason } = useActiveSeasonQuery();
  const { data: categories } = useOperatingCostCategories({ limit: 100 });

  // Tự động set mùa vụ gần nhất làm filter mặc định
  useEffect(() => {
    if (activeSeason && !filters.season_id) {
      setFilters({ season_id: activeSeason.id });
    }
  }, [activeSeason]);

  // Query - Flatten filters to match backend expectation
  const { data: costsData, isLoading } = useOperatingCosts({
    page: currentPage,
    limit: pageSize,
    ...filters, // Spread filters to top level
  });

  const deleteMutation = useDeleteOperatingCost();

  const handleEdit = (record: OperatingCost) => {
    setEditingItem(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      message.success('Đã xóa chi phí');
    } catch (error) {
      message.error('Lỗi khi xóa');
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setIsModalVisible(true);
  };

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    if (!value && value !== 0) delete newFilters[key];
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleClearAllFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  // Date Filter UI Helper (Similar to PaymentsList)
  const getDateColumnSearchProps = (dataIndex: string): any => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <DatePicker.RangePicker
            style={{ marginBottom: 8, display: 'flex' }}
            format="DD/MM/YYYY"
            value={
                selectedKeys && selectedKeys[0]
                ? [dayjs(selectedKeys[0]), dayjs(selectedKeys[1])]
                : undefined
            }
            onChange={(dates: any) => {
                if (dates && dates[0] && dates[1]) {
                    setSelectedKeys([
                        dates[0].startOf('day').toISOString(),
                        dates[1].endOf('day').toISOString()
                    ])
                } else {
                    setSelectedKeys([])
                }
            }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => confirm({ closeDropdown: false })}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Lọc
          </Button>
          <Button
            onClick={() => {
                if (clearFilters) {
                    clearFilters()
                    confirm()
                }
            }}
            size="small"
            style={{ width: 90 }}
          >
            Xóa
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
  })

  // Handle Table Change (Pagination, Filters, Sorter)
  const handleTableChange = (
    pagination: any,
    tableFilters: any,
    sorter: any
  ) => {
    setCurrentPage(pagination.current || 1);
    setPageSize(pagination.pageSize || 20);
    
    // Handle Date Range Filter
    const newFilters = { ...filters };
    
    // Check expense_date filter
    if (tableFilters.expense_date && tableFilters.expense_date.length === 2) {
        newFilters.start_date = tableFilters.expense_date[0];
        newFilters.end_date = tableFilters.expense_date[1];
    } else {
        delete newFilters.start_date;
        delete newFilters.end_date;
    }

    setFilters(newFilters);
  };

  const columns: any[] = [
    {
      title: (
        <FilterHeader
          title="Tên chi phí"
          dataIndex="name"
          value={filters.name}
          onChange={(val) => handleFilterChange('name', val)}
        />
      ),
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: {
        showTitle: true,
      },
      render: (text: string) => <span className="font-medium">{text}</span>
    },
    {
      title: 'Số tiền',
      dataIndex: 'value',
      key: 'value',
      width: 150,
      render: (val: any) => <span className="text-red-600 font-bold">{Number(val).toLocaleString('vi-VN')} đ</span>,
      sorter: (a: OperatingCost, b: OperatingCost) => Number(a.value) - Number(b.value),
    },
    {
      title: (
          <FilterHeader
            title="Mùa vụ"
            dataIndex="season_id"
            value={filters.season_id}
            inputType="select"
             options={seasons?.data?.items?.map((s: any) => ({
                label: `${s.name} (${s.year})`,
                value: s.id
            }))}
            onChange={(val) => handleFilterChange('season_id', val)}
          />
      ),
      key: 'season',
      width: 180,
      render: (_: any, record: OperatingCost) => (
          record.season ? <Tag color="blue">{record.season.name}</Tag> : '-'
      )
    },
    {
      title: (
          <FilterHeader
            title="Khách hàng"
            dataIndex="customer_name"
            value={filters.customer_name}
            inputType="text"
            onChange={(val) => handleFilterChange('customer_name', val)}
          />
      ),
      key: 'customer',
      width: 180,
      render: (_: any, record: OperatingCost) => (
          record.customer ? <Tag color="green">{record.customer.name}</Tag> : '-'
      )
    },
    {
      title: (
          <FilterHeader
            title="Ruộng lúa"
            dataIndex="rice_crop_name"
            value={filters.rice_crop_name}
            inputType="text"
            onChange={(val) => handleFilterChange('rice_crop_name', val)}
          />
      ),
      key: 'rice_crop',
      width: 150,
      render: (_: any, record: OperatingCost) => (
          record.rice_crop ? <Tag color="cyan">{record.rice_crop.field_name}</Tag> : '-'
      )
    },
    {
      title: (
          <FilterHeader
            title="Loại"
            dataIndex="category_id"
            value={filters.category_id}
            inputType="select"
            options={categories?.data?.map((c: any) => ({
                label: c.name,
                value: c.id
            }))}
            onChange={(val) => handleFilterChange('category_id', val)}
          />
      ),
      key: 'type',
      width: 200,
      render: (_: any, record: OperatingCost) => {
          // Hiển thị từ relation category (mới) hoặc fallback sang type (cũ)
          const displayName = record.category?.name || record.type;
          const type = record.type || 'other';
          
          const colors: Record<string, string> = {
              fertilizer: 'green',
              pesticide: 'red',
              labor: 'blue',
              machinery: 'orange',
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
          
          return <Tag color={colors[type] || 'default'}>{displayName || labels[type] || type}</Tag>;
      }
    },
    {
      title: 'Ngày chi',
      dataIndex: 'expense_date',
      key: 'expense_date',
      width: 120,
      ...getDateColumnSearchProps('expense_date'),
      filteredValue: (filters.start_date && filters.end_date) ? [filters.start_date, filters.end_date] : null,
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
    },
    {
        title: 'Ghi chú',
        dataIndex: 'description',
        key: 'description',
        width: 120,
        ellipsis: {
          showTitle: true,
        },
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 120,
      render: (_: any, record: OperatingCost) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} size="small"/>
          <Popconfirm title="Bạn có chắc muốn xóa?" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} danger size="small"/>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-2 md:p-6">
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6'>
         <h1 className="text-2xl font-bold">Quản Lý Chi Phí Vận Hành</h1>
         <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
          {Object.keys(filters).length > 0 && (
            <Button
                onClick={handleClearAllFilters}
                icon={<FilterOutlined />}
                danger
                className="w-full sm:w-auto"
            >
                Xóa bộ lọc
            </Button>
          )}
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleCreate}
            className="w-full sm:w-auto"
          >
            Thêm Chi Phí
          </Button>
         </div>
      </div>

      <div className='bg-white rounded shadow'>
        <DataTable
          columns={columns}
          data={(costsData?.data || []) as any[]}
          rowKey="id" // Ensure your data has a unique 'id' field
          loading={isLoading}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: costsData?.total,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total: number) => `Tổng ${total} mục`
          }}
        />
      </div>

      <CreateOperatingCostModal
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        initialData={editingItem}
      />
    </div>
  );
};

export default OperatingCostsPage;
