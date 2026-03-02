import React, { useState } from 'react';
import { Card, Table, Button, Space, Tag, Popconfirm, Empty, Tabs, Row, Col, Statistic } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CarryOutOutlined, GiftOutlined } from '@ant-design/icons';
import ComboBox from '@/components/common/combo-box';
import FilterHeader from '@/components/common/filter-header';
import dayjs from 'dayjs';
import { 
  useFarmServiceCostsQuery, 
  useDeleteFarmServiceCostMutation,
  useFarmGiftCostsQuery,
  useDeleteFarmGiftCostMutation
} from '@/queries/farm-service-cost';
import { useSeasonsQuery } from '@/queries/season';
import { useCustomersQuery } from '@/queries/customer';
import { useRiceCrops } from '@/queries/rice-crop';
import type { FarmServiceCost, FarmGiftCost } from '@/models/farm-service-cost';
import { FarmServiceCostModal } from './FarmServiceCostModal';

interface FilterState {
  name?: string;
  season_id?: number;
  customer_id?: number;
  rice_crop_id?: number;
  source?: string;
}

const FarmServiceCostList: React.FC = () => {
  const [activeTab, setActiveTab] = useState('service');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCost, setEditingCost] = useState<any>(null);
  
  // Search states for ComboBox
  const [seasonSearch, setSeasonSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [riceCropSearch, setRiceCropSearch] = useState('');
  
  // Filters state
  const [filters, setFilters] = useState<FilterState>({});

  // Queries
  const { data: seasons, isLoading: isSeasonsLoading } = useSeasonsQuery({
    page: 1, limit: 100, keyword: seasonSearch
  });
  
  const { data: customers, isLoading: isCustomersLoading } = useCustomersQuery({
    page: 1, limit: 100, keyword: customerSearch
  });
  
  const { data: riceCrops, isLoading: isRiceCropsLoading } = useRiceCrops({
    season_id: filters.season_id,
    keyword: riceCropSearch,
    limit: 100,
  });
  
  // Data for Service Costs
  const { data: serviceData, isLoading: isServiceLoading } = useFarmServiceCostsQuery({
    ...filters,
    limit: 1000,
  });

  // Data for Gift Costs
  const { data: giftData, isLoading: isGiftLoading } = useFarmGiftCostsQuery({
    ...filters,
    limit: 1000,
  });

  const deleteServiceMutation = useDeleteFarmServiceCostMutation();
  const deleteGiftMutation = useDeleteFarmGiftCostMutation();

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency', currency: 'VND',
    }).format(value);
  };

  const commonColumns = [
    {
      key: 'name',
      title: (
        <FilterHeader 
          title="Tên hạng mục" 
          dataIndex="name" 
          value={filters.name} 
          onChange={(val) => handleFilterChange('name', val)}
          inputType="text"
        />
      ),
      width: 250,
      render: (record: any) => <div className="font-medium">{record.name}</div>,
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
      key: 'season',
      title: 'Mùa vụ',
      width: 150,
      render: (record: any) => record.season ? `${record.season.name} (${record.season.year || ''})` : '-',
    },
    {
      key: 'customer',
      title: 'Khách hàng',
      width: 150,
      render: (record: any) => record.customer?.name || '-',
    },
    {
      key: 'notes',
      dataIndex: 'notes',
      title: 'Ghi chú',
      width: 200,
      render: (notes?: string) => <div className="truncate max-w-[200px]">{notes || '-'}</div>,
    }
  ];

  const serviceColumns = [
    ...commonColumns,
    {
      key: 'date',
      dataIndex: 'expense_date',
      title: 'Ngày chi',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      width: 100,
      fixed: 'right' as const,
      render: (record: FarmServiceCost) => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="Xóa chi phí?" onConfirm={() => handleDelete(record.id)} okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    }
  ];

  const giftColumns = [
    ...commonColumns,
    {
      key: 'date',
      dataIndex: 'gift_date',
      title: 'Ngày tặng',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      key: 'source',
      dataIndex: 'source',
      title: 'Nguồn',
      width: 150,
      render: (source: string) => {
        const labels: any = {
          'manually_awarded': { text: 'Nhập tay', color: 'blue' },
          'gift_from_invoice': { text: 'Từ Hóa đơn', color: 'green' },
          'reward_from_debt_note': { text: 'Thưởng tích lũy', color: 'purple' },
        };
        const item = labels[source] || { text: source, color: 'default' };
        return <Tag color={item.color}>{item.text}</Tag>;
      }
    },
    {
      key: 'actions',
      title: 'Thao tác',
      width: 100,
      fixed: 'right' as const,
      render: (record: FarmGiftCost) => (
        <Space size="middle">
          {record.source === 'manually_awarded' ? (
            <>
              <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
              <Popconfirm title="Xóa quà tặng?" onConfirm={() => handleDelete(record.id)} okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}>
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          ) : (
            <Tag color="orange">Tự động</Tag>
          )}
        </Space>
      ),
    }
  ];

  const totalService = serviceData?.data?.reduce((sum: number, item: any) => sum + Number(item.amount), 0) || 0;
  const totalGift = giftData?.data?.reduce((sum: number, item: any) => sum + Number(item.amount), 0) || 0;

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            {activeTab === 'service' ? <CarryOutOutlined className="text-blue-600" /> : <GiftOutlined className="text-pink-600" />}
            Quản lý Chi phí {activeTab === 'service' ? 'Dịch vụ' : 'Quà tặng'}
          </h1>
          <p className="text-gray-500 mt-1">Theo dõi các khoản chi phục vụ nông dân và khách hàng</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          size="large"
          className={activeTab === 'service' ? 'bg-blue-600' : 'bg-pink-600'}
        >
          Thêm {activeTab === 'service' ? 'chi phí' : 'quà tặng'}
        </Button>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12}>
          <Card bordered={false} className="shadow-sm rounded-xl">
            <Statistic 
              title="Tổng Chi phí Dịch vụ" 
              value={totalService} 
              suffix="đ" 
              valueStyle={{ color: '#2563eb', fontWeight: 800 }} 
              prefix={<CarryOutOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card bordered={false} className="shadow-sm rounded-xl">
            <Statistic 
              title="Tổng Giá trị Quà tặng" 
              value={totalGift} 
              suffix="đ" 
              valueStyle={{ color: '#db2777', fontWeight: 800 }} 
              prefix={<GiftOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card bordered={false} className="shadow-md rounded-2xl overflow-hidden">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="px-6 pt-2"
          items={[
            {
              key: 'service',
              label: <span className="flex items-center gap-2"><CarryOutOutlined /> Chi phí Dịch vụ</span>,
              children: (
                <Table
                  columns={serviceColumns}
                  dataSource={serviceData?.data || []}
                  rowKey="id"
                  loading={isServiceLoading}
                  pagination={{ pageSize: 20 }}
                  scroll={{ x: 1200 }}
                />
              )
            },
            {
              key: 'gift',
              label: <span className="flex items-center gap-2"><GiftOutlined /> Quà tặng</span>,
              children: (
                <Table
                  columns={giftColumns}
                  dataSource={giftData?.data || []}
                  rowKey="id"
                  loading={isGiftLoading}
                  pagination={{ pageSize: 20 }}
                  scroll={{ x: 1200 }}
                />
              )
            }
          ]}
        />
      </Card>

      <FarmServiceCostModal
        open={isModalVisible}
        onCancel={() => { setIsModalVisible(false); setEditingCost(null); }}
        editingCost={editingCost}
        mode={activeTab as any}
      />
    </div>
  );
};

export default FarmServiceCostList;
