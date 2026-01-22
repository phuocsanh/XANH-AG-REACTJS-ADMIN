/**
 * Trang danh sách Quản Lý Canh Tác
 * Bao gồm: Xem, Thêm, Sửa, Xóa Ruộng lúa
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Input,
  Modal,
  Tag,
  Space,
  Form,
  Select,
  InputNumber,
  message,
} from 'antd';
import { DatePicker, ComboBox } from '@/components/common';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import DataTable from '@/components/common/data-table';
import FilterHeader from '@/components/common/filter-header';
import { ConfirmModal } from '@/components/common';
import { TablePaginationConfig, TableProps } from 'antd';
import { FilterValue, SorterResult } from 'antd/es/table/interface';
import { useRiceCrops, useCreateRiceCrop, useUpdateRiceCrop, useDeleteRiceCrop } from '@/queries/rice-crop';
import { useAppStore } from '@/stores/store';
import { useSeasonsQuery } from '@/queries/season';
import { useCustomersQuery } from '@/queries/customer';
// Import component mới
import { CreateRiceCropModal } from './components/CreateRiceCropModal';
// Import query cho diện tích mỗi công đất
import { useAreasQuery } from "@/queries/area-of-each-plot-of-land";
import type { RiceCrop, CreateRiceCropDto, GrowthStage, CropStatus } from '@/models/rice-farming';
import dayjs from 'dayjs';

// Extend RiceCrop interface để tương thích với DataTable
interface ExtendedRiceCrop extends RiceCrop {
  key: string;
  [key: string]: any;
}

// Màu sắc cho giai đoạn sinh trưởng
const growthStageColors: Record<GrowthStage, string> = {
  seedling: 'green',
  tillering: 'cyan',
  panicle: 'blue',
  heading: 'purple',
  grain_filling: 'geekblue',
  ripening: 'orange',
  harvested: 'gold',
};

// Màu sắc cho trạng thái
const statusColors: Record<CropStatus, string> = {
  active: 'processing',
  harvested: 'success',
  failed: 'error',
};

// Nhãn tiếng Việt
const growthStageLabels: Record<GrowthStage, string> = {
  seedling: 'Giai đoạn mạ',
  tillering: 'Đẻ nhánh',
  panicle: 'Làm đòng',
  heading: 'Trổ bông',
  grain_filling: 'Vô gạo',
  ripening: 'Chín',
  harvested: 'Đã thu hoạch',
};

const statusLabels: Record<CropStatus, string> = {
  active: 'Đang canh tác',
  harvested: 'Đã thu hoạch',
  failed: 'Thất bại',
};

const RiceCropsList: React.FC = () => {
  const navigate = useNavigate();
  const { confirm: confirmModal } = Modal;
  
  // State for combobox search
  const [customerSearch, setCustomerSearch] = useState('');
  const [seasonSearch, setSeasonSearch] = useState('');

  // Load Customers for filter options
  const { data: customersData, isLoading: isCustomerLoading } = useCustomersQuery({ 
      page: 1, limit: 20, keyword: customerSearch 
  });
  const customerOptions = React.useMemo(() => 
    customersData?.data?.items?.map((c: any) => ({ label: c.name, value: c.id })) || [], 
    [customersData]
  );

  // Load Seasons for filter options
  const { data: seasonsData, isLoading: isSeasonLoading } = useSeasonsQuery({ 
      page: 1, limit: 20, keyword: seasonSearch 
  });
  const seasonOptions = React.useMemo(() => 
    seasonsData?.data?.items?.map((s: any) => ({ label: s.name, value: s.id })) || [], 
    [seasonsData]
  );
  // State quản lý UI
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Set default season filter
  const hasInitializedSeasonRef = React.useRef(false);

  React.useEffect(() => {
    if (!hasInitializedSeasonRef.current && seasonOptions.length > 0) {
      const latestSeason = seasonOptions[0];
      setFilters((prev) => ({ ...prev, season_id: latestSeason.value }));
      hasInitializedSeasonRef.current = true;
    }
  }, [seasonOptions]);
  const [isFormModalVisible, setIsFormModalVisible] = useState<boolean>(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState<boolean>(false);
  const [deletingCrop, setDeletingCrop] = useState<RiceCrop | null>(null);
  const [editingCrop, setEditingCrop] = useState<RiceCrop | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);



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

  // Handle Table Change
  const handleTableChange: TableProps<ExtendedRiceCrop>['onChange'] = (
    pagination,
    tableFilters,
    sorter,
    extra
  ) => {
    setCurrentPage(pagination.current || 1)
    setPageSize(pagination.pageSize || 10)
    
    const newFilters = { ...filters }
    
    // Status
    if (tableFilters.status && tableFilters.status.length > 0) {
      newFilters.status = tableFilters.status[0]
    } else {
      delete newFilters.status
    }
    
    // Customer Name (text search)
    if (tableFilters.customer_name && tableFilters.customer_name[0]) {
       // FilterHeader puts value directly, but if sorting or other AntD mechanism puts it in array
       // we handle it here if needed, but primarily handled via handleFilterChange
    }

    // Season Name (text search)
     if (tableFilters.season_name && tableFilters.season_name[0]) {
       // Similar to customer_name
    }
    
    // Growth Stage
    if (tableFilters.growth_stage && tableFilters.growth_stage.length > 0) {
      newFilters.growth_stage = tableFilters.growth_stage[0]
    } else {
      delete newFilters.growth_stage
    }

    // Sowing Date Range
    if (tableFilters.sowing_date && tableFilters.sowing_date.length === 2) {
      newFilters.started_at_start = tableFilters.sowing_date[0]
      newFilters.started_at_end = tableFilters.sowing_date[1]
    } else {
        delete newFilters.started_at_start
        delete newFilters.started_at_end
    }

    setFilters(newFilters)
  }

  // Handle Filter Change
  const handleFilterChange = (key: string, value: any) => {
      const newFilters = { ...filters, [key]: value }
      if (!value) delete newFilters[key]
      setFilters(newFilters)
      setCurrentPage(1)
  }

  // Form instance
  // Get user info
  const { userInfo } = useAppStore();
  const isCustomer = userInfo?.role?.code === 'CUSTOMER';

  // Queries
  const { data: cropsData, isLoading } = useRiceCrops({
      page: currentPage,
      limit: pageSize,
      ...filters
  });
  // Hooks for customers and seasons are moved to the top

  const { data: areasData } = useAreasQuery({ limit: 100 }); // Load danh sách diện tích
  const deleteMutation = useDeleteRiceCrop();

  // Handlers
  const handleAddCrop = () => {
    setEditingCrop(null);
    setIsFormModalVisible(true);
  };

  const handleEditCrop = (crop: RiceCrop) => {
    setEditingCrop(crop);
    setIsFormModalVisible(true);
  };

  const handleViewCrop = (crop: RiceCrop) => {
    navigate(`/rice-crops/${crop.id}`);
  };

  const handleDelete = (crop: RiceCrop) => {
    setDeletingCrop(crop);
    setDeleteConfirmVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCrop) return;

    try {
      await deleteMutation.mutateAsync(deletingCrop.id);
      message.success('Xóa Ruộng lúa thành công!');
      setDeleteConfirmVisible(false);
      setDeletingCrop(null);
    } catch (error) {
      console.error('Error deleting crop:', error);
      message.error('Có lỗi xảy ra khi xóa Ruộng lúa!');
      setDeleteConfirmVisible(false);
      setDeletingCrop(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmVisible(false);
    setDeletingCrop(null);
  };

  const handleCloseFormModal = () => {
    setIsFormModalVisible(false);
    setEditingCrop(null);
  };



  // Lấy  Danh sách ruộng lúa
  const getCropList = (): ExtendedRiceCrop[] => {
    if (!cropsData?.data) return [];

    return cropsData.data.map((crop: RiceCrop) => ({
      ...crop,
      key: crop.id.toString(),
    }));
  };

  const loading = isLoading || deleteMutation.isPending;

  // Cấu hình columns cho DataTable
  const columns = [
    {
      key: 'field_name',
      title: (
        <FilterHeader 
            title="Tên ruộng" 
            dataIndex="field_name" 
            value={filters.field_name} 
            onChange={(val) => handleFilterChange('field_name', val)}
            inputType="text"
        />
      ),
      width: 200,
      render: (record: ExtendedRiceCrop) => (
        <div className="font-medium">{record.field_name}</div>
      ),
    },
    // Chỉ hiển thị cột Khách hàng nếu không phải CUSTOMER
    ...(!isCustomer ? [{
      key: 'customer_name',
      title: (
        <FilterHeader 
            title="Khách hàng" 
            dataIndex="customer_name" 
            value={filters.customer_id} 
            onChange={(val) => handleFilterChange('customer_id', val)}
            inputType="combobox"
            comboBoxProps={{
                data: customerOptions,
                onSearch: setCustomerSearch,
                isLoading: isCustomerLoading,
                filterOption: false,
                placeholder: "Tìm khách hàng..."
            }}
        />
      ),
      width: 180,
      render: (record: ExtendedRiceCrop) => (
        <div>{record.customer?.name || '-'}</div>
      ),
    }] : []),
    {
      key: 'season_name',
      title: (
        <FilterHeader 
            title="Mùa vụ" 
            dataIndex="season_name" 
            value={filters.season_id} 
            onChange={(val) => handleFilterChange('season_id', val)}
            inputType="combobox"
            comboBoxProps={{
                data: seasonOptions,
                onSearch: setSeasonSearch,
                isLoading: isSeasonLoading,
                filterOption: false,
                placeholder: "Tìm mùa vụ..."
            }}
        />
      ),
      width: 150,
      render: (record: ExtendedRiceCrop) => (
        <div>{record.season?.name || '-'}</div>
      ),
    },
    {
      key: 'field_area',
      title: 'Tổng diện tích (m²)',
      width: 120,
      render: (record: ExtendedRiceCrop) => (
        <div>{Number(record.field_area).toLocaleString('vi-VN')}</div>
      ),
    },
    {
      key: 'rice_variety',
      title: (
        <FilterHeader 
            title="Giống lúa" 
            dataIndex="rice_variety" 
            value={filters.rice_variety} 
            onChange={(val) => handleFilterChange('rice_variety', val)}
            inputType="text"
        />
      ),
      width: 150,
      render: (record: ExtendedRiceCrop) => <div>{record.rice_variety}</div>,
    },
    {
      key: 'growth_stage',
      title: 'Giai đoạn',
      width: 150,
      filters: Object.entries(growthStageLabels).map(([value, text]) => ({ text, value })),
      filteredValue: filters.growth_stage ? [filters.growth_stage] : null,
      filterMultiple: false,
      render: (record: ExtendedRiceCrop) => (
        <Tag color={growthStageColors[record.growth_stage]}>
          {growthStageLabels[record.growth_stage]}
        </Tag>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      width: 150,
      filters: Object.entries(statusLabels).map(([value, text]) => ({ text, value })),
      filteredValue: filters.status ? [filters.status] : null,
      filterMultiple: false,
      render: (record: ExtendedRiceCrop) => (
        <Tag color={statusColors[record.status]}>
          {statusLabels[record.status]}
        </Tag>
      ),
    },
    {
      key: 'sowing_date',
      title: 'Ngày gieo',
      width: 120,
      render: (record: ExtendedRiceCrop) => (
        <div>{record.sowing_date ? dayjs(record.sowing_date).format('DD/MM/YYYY') : '-'}</div>
      ),
    },
    {
      key: 'action',
      title: 'Hành động',
      width: 200,
      render: (record: ExtendedRiceCrop) => (
        <Space size="middle">
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewCrop(record)}
            title="Xem chi tiết"
          />
          {!isCustomer && (
            <Button
              danger
              icon={<DeleteOutlined />}
              title="Xóa"
              onClick={() => handleDelete(record)}
            />
          )}
        </Space>
      ),
    },
  ];



  return (
    <div className="p-2 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🌾 Quản Lý Canh Tác</h1>
        {!isCustomer && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingCrop(null);
              setIsFormModalVisible(true);
            }}
          >
            Tạo Ruộng lúa mới
          </Button>
        )}
      </div>

      {/*  Danh sách ruộng lúa */}
      <div className="bg-white rounded shadow">
        <DataTable
          data={getCropList()}
          columns={columns}
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: cropsData?.total || 0,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total: number) => `Tổng ${total} Ruộng lúa`,
          }}
          onChange={handleTableChange}
          showSearch={false}
          showFilters={false}
        />
      </div>

      <CreateRiceCropModal
        open={isFormModalVisible}
        onCancel={handleCloseFormModal}
        editingCrop={editingCrop}
      />



      {/* Modal xác nhận xóa */}
      <ConfirmModal
        title="Xác nhận xóa"
        content={
          deletingCrop
            ? `Bạn có chắc chắn muốn xóa Ruộng lúa "${deletingCrop.field_name}"?`
            : 'Xác nhận xóa'
        }
        open={deleteConfirmVisible}
        onOk={handleConfirmDelete}
        onCancel={handleCancelDelete}
        okText="Xóa"
        okType="primary"
        cancelText="Hủy"
        confirmLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default RiceCropsList;
