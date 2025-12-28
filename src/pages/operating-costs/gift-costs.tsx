import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Tag, Popconfirm, message, DatePicker } from 'antd';
import { EditOutlined, DeleteOutlined, SearchOutlined, GiftOutlined } from '@ant-design/icons';
import { useFarmServiceCostsQuery, useDeleteFarmServiceCostMutation } from '@/queries/farm-service-cost';
import { FarmServiceCost } from '@/models/farm-service-cost';
import dayjs from 'dayjs';
import { useSeasonsQuery, useActiveSeasonQuery } from '@/queries/season';
import DataTable from "@/components/common/data-table";
import FilterHeader from "@/components/common/filter-header";
import { FarmServiceCostModal } from '../farm-service-costs/FarmServiceCostModal';

/**
 * Trang quản lý chi phí quà tặng khách hàng
 * Tự động filter chỉ hiển thị các chi phí có category "Quà tặng khách hàng"
 */
const GiftCostsPage: React.FC = () => {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<FarmServiceCost | null>(null);

  const { data: seasons } = useSeasonsQuery({ limit: 100 });
  const { data: activeSeason } = useActiveSeasonQuery();

  // Tự động set mùa vụ gần nhất làm filter mặc định
  useEffect(() => {
    const defaultFilters: Record<string, any> = {};
    
    if (activeSeason && !filters.season_id) {
      defaultFilters.season_id = activeSeason.id;
    }
    
    // Luôn lọc theo nguồn quà tặng
    if (!filters.source) {
       // Ở trang này ta mặc định xem quà tặng từ hóa đơn và từ chốt sổ
       // Backend Search hỗ trợ một source duy nhất hoặc filter thêm ở FE nếu cần
       // Tuy nhiên ta nên để user chọn, mặc định là gift_from_invoice
       defaultFilters.source = 'gift_from_invoice';
    }
    
    if (Object.keys(defaultFilters).length > 0) {
      setFilters(prev => ({ ...prev, ...defaultFilters }));
    }
  }, [activeSeason]);

  // Query - Flatten filters to match backend expectation
  const { data: costsData, isLoading } = useFarmServiceCostsQuery({
    page: currentPage,
    limit: pageSize,
    ...filters,
  });

  const deleteMutation = useDeleteFarmServiceCostMutation();

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      message.success('Đã xóa chi phí quà tặng');
    } catch (error) {
      message.error('Lỗi khi xóa');
    }
  };

  const handleEdit = (record: FarmServiceCost) => {
    setEditingItem(record);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setEditingItem(null);
  };

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    if (!value && value !== 0) delete newFilters[key];
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleClearAllFilters = () => {
    setFilters({ source: 'gift_from_invoice' });
    setCurrentPage(1);
  };

  const handleTableChange = (pagination: any, tableFilters: any, sorter: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);

    const newFilters = { ...filters };

    // Date range filter
    if (tableFilters.expense_date && tableFilters.expense_date.length === 2) {
        newFilters.start_date = tableFilters.expense_date[0];
        newFilters.end_date = tableFilters.expense_date[1];
    } else {
        delete newFilters.start_date;
        delete newFilters.end_date;
    }

    setFilters(newFilters);
  };

  // Date Filter UI Helper
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
                    clearFilters();
                    confirm();
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
  });

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
      width: 250,
      ellipsis: {
        showTitle: true,
      },
      render: (text: string) => <span className="font-medium">{text}</span>
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      render: (val: any) => <span className="text-red-600 font-bold">{Number(val).toLocaleString('vi-VN')} đ</span>,
      sorter: (a: FarmServiceCost, b: FarmServiceCost) => Number(a.amount) - Number(b.amount),
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
      render: (_: any, record: FarmServiceCost) => (
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
      render: (_: any, record: FarmServiceCost) => (
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
      render: (_: any, record: FarmServiceCost) => (
          record.rice_crop ? <Tag color="cyan">{record.rice_crop.field_name}</Tag> : '-'
      )
    },
    {
      title: (
          <FilterHeader
            title="Nguồn"
            dataIndex="source"
            value={filters.source}
            inputType="select"
            options={[
                { label: 'Từ Hóa đơn', value: 'gift_from_invoice' },
                { label: 'Từ Chốt sổ', value: 'reward_from_debt_note' },
                { label: 'Tặng thủ công', value: 'manual_gift' },
                { label: 'Nhập tay', value: 'manual' },
            ]}
            onChange={(val) => handleFilterChange('source', val)}
          />
      ),
      dataIndex: 'source',
      key: 'source',
      width: 150,
      render: (source: string) => {
          let color = 'blue';
          let label = source;
          if (source === 'gift_from_invoice') { color = 'green'; label = 'Từ Hóa đơn'; }
          if (source === 'reward_from_debt_note') { color = 'gold'; label = 'Từ Chốt sổ'; }
          if (source === 'manual_gift') { color = 'purple'; label = 'Tặng thủ công'; }
          return <Tag color={color}>{label}</Tag>
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
        dataIndex: 'notes',
        key: 'notes',
        width: 150,
        ellipsis: {
          showTitle: true,
        },
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 120,
      render: (_: any, record: FarmServiceCost) => (
        <Space>
           {record.source === 'manual_gift' && (
             <Button 
               icon={<EditOutlined />} 
               onClick={() => handleEdit(record)} 
               size="small"
             />
           )}
          <Popconfirm title="Bạn có chắc muốn xóa?" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} danger size="small" loading={deleteMutation.isPending}/>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-2 md:p-6">
      <div className='flex justify-between items-center mb-6'>
         <h1 className="text-2xl font-bold">Quản Lý Chi Phí Quà Tặng Khách Hàng</h1>
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={(Array.isArray(costsData?.data) ? costsData.data : []) as any}
          loading={isLoading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: costsData?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} mục`,
          }}
          onChange={handleTableChange}
          rowKey="id"
          scroll={{ x: 1200 }}
        />
      </Card>

      <FarmServiceCostModal
        open={isModalVisible}
        onCancel={handleCloseModal}
        editingCost={editingItem}
        // Ta có thể thêm prop để ép source là manual_gift nếu muốn
      />
    </div>
  );
};

export default GiftCostsPage;
