/**
 * Trang danh sách Quản Lý Canh Tác
 * Bao gồm: Xem, Thêm, Sửa, Xóa vụ lúa
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
  DatePicker,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import DataTable from '@/components/common/data-table';
import { ConfirmModal } from '@/components/common';
import {
  useRiceCrops,
  useCreateRiceCrop,
  useUpdateRiceCrop,
  useDeleteRiceCrop,
} from '@/queries/rice-crop';
import { useSeasonsQuery } from '@/queries/season';
import { useCustomersQuery } from '@/queries/customer';
import type { RiceCrop, CreateRiceCropDto, GrowthStage, CropStatus } from '@/types/rice-farming.types';
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
  heading: 'Trỗ bông',
  ripening: 'Chín',
  harvested: 'Đã thu hoạch',
};

const statusLabels: Record<CropStatus, string> = {
  active: 'Đang canh tác',
  harvested: 'Đã thu hoạch',
  failed: 'Thất bại',
};

const RiceCropsList: React.FC = () => {
  // State quản lý UI
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isFormModalVisible, setIsFormModalVisible] = useState<boolean>(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState<boolean>(false);
  const [deletingCrop, setDeletingCrop] = useState<RiceCrop | null>(null);
  const [editingCrop, setEditingCrop] = useState<RiceCrop | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const navigate = useNavigate();

  // Form instance
  const [form] = Form.useForm();

  // Queries
  const { data: crops, isLoading } = useRiceCrops();
  const { data: customersData } = useCustomersQuery({ limit: 100 });
  const { data: seasonsData } = useSeasonsQuery();
  const createMutation = useCreateRiceCrop();
  const updateMutation = useUpdateRiceCrop();
  const deleteMutation = useDeleteRiceCrop();

  // Handlers
  const handleAddCrop = () => {
    setEditingCrop(null);
    form.resetFields();
    setIsFormModalVisible(true);
  };

  const handleEditCrop = (crop: RiceCrop) => {
    setEditingCrop(crop);
    form.setFieldsValue({
      customer_id: crop.customer_id,
      season_id: crop.season_id,
      field_name: crop.field_name,
      large_labor_days: crop.large_labor_days,
      field_area: crop.field_area,
      location: crop.location,
      rice_variety: crop.rice_variety,
      seed_source: crop.seed_source,
      sowing_date: crop.sowing_date ? dayjs(crop.sowing_date) : null,
      transplanting_date: crop.transplanting_date ? dayjs(crop.transplanting_date) : null,
      expected_harvest_date: crop.expected_harvest_date ? dayjs(crop.expected_harvest_date) : null,
      notes: crop.notes,
    });
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
      message.success('Xóa vụ lúa thành công!');
      setDeleteConfirmVisible(false);
      setDeletingCrop(null);
    } catch (error) {
      console.error('Error deleting crop:', error);
      message.error('Có lỗi xảy ra khi xóa vụ lúa!');
      setDeleteConfirmVisible(false);
      setDeletingCrop(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmVisible(false);
    setDeletingCrop(null);
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const dto: CreateRiceCropDto = {
        ...values,
        sowing_date: values.sowing_date?.format('YYYY-MM-DD'),
        transplanting_date: values.transplanting_date?.format('YYYY-MM-DD'),
        expected_harvest_date: values.expected_harvest_date?.format('YYYY-MM-DD'),
      };

      if (editingCrop) {
        await updateMutation.mutateAsync({ id: editingCrop.id, dto });
        message.success('Cập nhật vụ lúa thành công!');
      } else {
        await createMutation.mutateAsync(dto);
        message.success('Tạo vụ lúa thành công!');
      }

      setIsFormModalVisible(false);
      form.resetFields();
      setEditingCrop(null);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const handleCloseFormModal = () => {
    setIsFormModalVisible(false);
    form.resetFields();
    setEditingCrop(null);
  };



  // Lấy danh sách vụ lúa
  const getCropList = (): ExtendedRiceCrop[] => {
    if (!crops) return [];

    let filteredCrops = crops;
    
    // Filter theo search term
    if (searchTerm) {
      filteredCrops = crops.filter((crop: RiceCrop) =>
        crop.field_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        crop.rice_variety.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filteredCrops.map((crop: RiceCrop) => ({
      ...crop,
      key: crop.id.toString(),
    }));
  };

  const loading = isLoading || createMutation.isPending || updateMutation.isPending;

  // Cấu hình columns cho DataTable
  const columns = [
    {
      key: 'field_name',
      title: 'Tên ruộng',
      width: 200,
      render: (record: ExtendedRiceCrop) => (
        <div className="font-medium">{record.field_name}</div>
      ),
    },
    {
      key: 'customer_name',
      title: 'Khách hàng',
      width: 180,
      render: (record: ExtendedRiceCrop) => (
        <div>{record.customer?.name || '-'}</div>
      ),
    },
    {
      key: 'season_name',
      title: 'Mùa vụ',
      width: 150,
      render: (record: ExtendedRiceCrop) => (
        <div>{record.season?.name || '-'}</div>
      ),
    },
    {
      key: 'field_area',
      title: 'Diện tích (m²)',
      width: 120,
      render: (record: ExtendedRiceCrop) => (
        <div>{record.field_area.toLocaleString('vi-VN')}</div>
      ),
    },
    {
      key: 'rice_variety',
      title: 'Giống lúa',
      width: 150,
      render: (record: ExtendedRiceCrop) => <div>{record.rice_variety}</div>,
    },
    {
      key: 'growth_stage',
      title: 'Giai đoạn',
      width: 150,
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
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEditCrop(record)}
            title="Chỉnh sửa"
          />
          <Button
            danger
            icon={<DeleteOutlined />}
            title="Xóa"
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];



  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🌾 Quản Lý Canh Tác</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddCrop}
        >
          Tạo vụ lúa mới
        </Button>
      </div>

      {/* Thanh tìm kiếm */}
      <div className="mb-6">
        <Input
          placeholder="Tìm kiếm theo tên ruộng hoặc giống lúa..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Danh sách vụ lúa */}
      <div className="bg-white rounded shadow">
        <DataTable
          data={getCropList()}
          columns={columns}
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: getCropList().length,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total: number) => `Tổng ${total} vụ lúa`,
            onChange: (page: number, size: number) => {
              setCurrentPage(page);
              setPageSize(size);
            },
          }}
        />
      </div>

      {/* Modal form thêm/sửa vụ lúa */}
      <Modal
        title={editingCrop ? 'Chỉnh sửa vụ lúa' : 'Tạo vụ lúa mới'}
        open={isFormModalVisible}
        onCancel={handleCloseFormModal}
        footer={[
          <Button key="cancel" onClick={handleCloseFormModal}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={createMutation.isPending || updateMutation.isPending}
            onClick={handleFormSubmit}
          >
            {editingCrop ? 'Cập nhật' : 'Tạo mới'}
          </Button>,
        ]}
        width={800}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Khách hàng"
              name="customer_id"
              rules={[{ required: true, message: 'Vui lòng chọn khách hàng' }]}
            >
              <Select placeholder="Chọn khách hàng" showSearch filterOption={(input, option: any) =>
                option?.children?.toLowerCase().includes(input.toLowerCase())
              }>
                {customersData?.data?.items?.map((customer: any) => (
                  <Select.Option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Mùa vụ"
              name="season_id"
              rules={[{ required: true, message: 'Vui lòng chọn mùa vụ' }]}
            >
              <Select placeholder="Chọn mùa vụ">
                {seasonsData?.data?.items?.map((season: any) => (
                  <Select.Option key={season.id} value={season.id}>
                    {season.name} ({season.year})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Tên ruộng"
              name="field_name"
              rules={[{ required: true, message: 'Vui lòng nhập tên ruộng' }]}
            >
              <Input placeholder="VD: Ruộng sau nhà" />
            </Form.Item>

            <Form.Item
              label="Số công lớn"
              name="large_labor_days"
              rules={[{ required: true, message: 'Vui lòng nhập số công lớn' }]}
            >
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder="VD: 10"
              />
            </Form.Item>

            <Form.Item
              label="Diện tích (m²)"
              name="field_area"
              rules={[{ required: true, message: 'Vui lòng nhập diện tích' }]}
            >
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder="VD: 5000"
              />
            </Form.Item>

            <Form.Item
              label="Giống lúa"
              name="rice_variety"
              rules={[{ required: true, message: 'Vui lòng nhập giống lúa' }]}
            >
              <Input placeholder="VD: OM 5451" />
            </Form.Item>

            <Form.Item label="Nguồn giống" name="seed_source">
              <Input placeholder="VD: Trung tâm giống An Giang" />
            </Form.Item>

            <Form.Item label="Vị trí" name="location">
              <Input placeholder="VD: Xã Tân Hiệp, An Giang" />
            </Form.Item>

            <Form.Item label="Ngày gieo mạ" name="sowing_date">
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>

            <Form.Item label="Ngày cấy" name="transplanting_date">
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>

            <Form.Item label="Ngày thu hoạch dự kiến" name="expected_harvest_date">
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </div>

          <Form.Item label="Ghi chú" name="notes">
            <Input.TextArea rows={3} placeholder="Ghi chú về vụ lúa..." />
          </Form.Item>
        </Form>
      </Modal>



      {/* Modal xác nhận xóa */}
      <ConfirmModal
        title="Xác nhận xóa"
        content={
          deletingCrop
            ? `Bạn có chắc chắn muốn xóa vụ lúa "${deletingCrop.field_name}"?`
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
