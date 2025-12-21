import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Tabs,
  Card,
  Descriptions,
  Tag,
  Button,
  Spin,
  Space,
  Breadcrumb,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
} from 'antd';
import { DatePicker } from '@/components/common';
import {
  ArrowLeftOutlined,
  EditOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useRiceCrop, useUpdateRiceCrop } from '@/queries/rice-crop';
import { GrowthStage, CropStatus } from '@/types/rice-farming.types';
import CostItemsTab from './components/CostItemsTab';
import HarvestRecordsTab from './components/HarvestRecordsTab';
import FarmingSchedulesTab from './components/FarmingSchedulesTab';
import ApplicationRecordsTab from './components/ApplicationRecordsTab';
import GrowthTrackingTab from './components/GrowthTrackingTab';
import ProfitReportTab from './components/ProfitReportTab';
import { InvoicesTab } from './components/InvoicesTab';
import { useSeasonsQuery } from '@/queries/season';
import { useCustomersQuery } from '@/queries/customer';
import { useAreasQuery } from '@/queries/area-of-each-plot-of-land';

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

const RiceCropDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [form] = Form.useForm();

  const riceCropId = id ? parseInt(id, 10) : 0;
  const { data: riceCrop, isLoading } = useRiceCrop(riceCropId);
  const updateMutation = useUpdateRiceCrop();
  const { data: customersData } = useCustomersQuery({ limit: 100 });
  const { data: seasonsData } = useSeasonsQuery();
  const { data: areasData } = useAreasQuery({ limit: 100 });

  // Watch các trường để tự động tính diện tích
  const watchedAmountOfLand = Form.useWatch('amount_of_land', form);
  const watchedAreaId = Form.useWatch('area_of_each_plot_of_land_id', form);

  // Tự động tính diện tích khi có đủ thông tin
  React.useEffect(() => {
    if (watchedAmountOfLand && watchedAreaId && areasData?.data?.items) {
      const selectedArea = areasData.data.items.find((area: any) => area.id === watchedAreaId);
      if (selectedArea) {
        const calculatedArea = Number(watchedAmountOfLand) * Number(selectedArea.acreage);
        form.setFieldsValue({
          field_area: calculatedArea
        });
      }
    }
  }, [watchedAmountOfLand, watchedAreaId, areasData, form]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  if (!riceCrop) {
    return (
      <div className="p-6 text-center">
        <h2>Không tìm thấy thông tin Ruộng lúa</h2>
        <Button onClick={() => navigate('/rice-crops')}>Quay lại danh sách</Button>
      </div>
    );
  }

  const handleEdit = () => {
    form.setFieldsValue({
      customer_id: riceCrop.customer_id,
      season_id: riceCrop.season_id,
      field_name: riceCrop.field_name,
      amount_of_land: riceCrop.amount_of_land,
      area_of_each_plot_of_land_id: riceCrop.area_of_each_plot_of_land_id,
      field_area: riceCrop.field_area,
      location: riceCrop.location,
      rice_variety: riceCrop.rice_variety,
      seed_source: riceCrop.seed_source,
      sowing_date: riceCrop.sowing_date ? dayjs(riceCrop.sowing_date) : null,
      transplanting_date: riceCrop.transplanting_date ? dayjs(riceCrop.transplanting_date) : null,
      expected_harvest_date: riceCrop.expected_harvest_date ? dayjs(riceCrop.expected_harvest_date) : null,
      growth_stage: riceCrop.growth_stage,
      status: riceCrop.status,
      notes: riceCrop.notes,
    });
    setIsEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();
      const dto = {
        ...values,
        sowing_date: values.sowing_date?.format('YYYY-MM-DD'),
        transplanting_date: values.transplanting_date?.format('YYYY-MM-DD'),
        expected_harvest_date: values.expected_harvest_date?.format('YYYY-MM-DD'),
      };

      await updateMutation.mutateAsync({ id: riceCropId, dto });
      message.success('Cập nhật thông tin thành công!');
      setIsEditModalVisible(false);
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  // Debug: Log data để kiểm tra
  console.log('Rice Crop Data:', riceCrop);

  const detailTabItems = [
    {
      key: 'info',
      label: 'Thông tin chung',
      children: (
        <Card title="Thông tin chi tiết" bordered={false}>
          <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
            <Descriptions.Item label="Tên ruộng" span={2}>
              <span className="font-medium text-lg" style={{ color: '#000', fontSize: '16px', fontWeight: 'bold' }}>
                {riceCrop.field_name || 'N/A'}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Khách hàng">
              <span style={{ color: '#000', fontSize: '14px' }}>
                {riceCrop.customer?.name || '-'}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Mùa vụ">
              <span style={{ color: '#000' }}>
                {riceCrop.season?.name || '-'} ({riceCrop.season?.year || '-'})
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Diện tích">
              <span style={{ color: '#000' }}>
                {riceCrop.field_area?.toLocaleString('vi-VN') || '-'} m²
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Số lượng đất">
              <span style={{ color: '#000' }}>
                {riceCrop.amount_of_land || '-'}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Diện tích mỗi công đất">
              <span style={{ color: '#000' }}>
                {riceCrop.areaOfEachPlotOfLand 
                  ? `${riceCrop.areaOfEachPlotOfLand.name || ''} ${riceCrop.areaOfEachPlotOfLand.code ? `(${riceCrop.areaOfEachPlotOfLand.code})` : ''}`
                  : (riceCrop.area_of_each_plot_of_land_id || '-')}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Giống lúa">
              <span style={{ color: '#000' }}>{riceCrop.rice_variety || '-'}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Nguồn giống">
              <span style={{ color: '#000' }}>{riceCrop.seed_source || '-'}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Vị trí" span={2}>
              <span style={{ color: '#000' }}>{riceCrop.location || '-'}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Giai đoạn">
              <Tag color={(growthStageColors as any)[riceCrop.growth_stage]}>
                {(growthStageLabels as any)[riceCrop.growth_stage]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={(statusColors as any)[riceCrop.status]}>
                {(statusLabels as any)[riceCrop.status]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày gieo">
              <span style={{ color: '#000' }}>
                {riceCrop.sowing_date ? dayjs(riceCrop.sowing_date).format('DD/MM/YYYY') : '-'}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày cấy">
              <span style={{ color: '#000' }}>
                {riceCrop.transplanting_date ? dayjs(riceCrop.transplanting_date).format('DD/MM/YYYY') : '-'}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày thu hoạch dự kiến">
              <span style={{ color: '#000' }}>
                {riceCrop.expected_harvest_date ? dayjs(riceCrop.expected_harvest_date).format('DD/MM/YYYY') : '-'}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày thu hoạch thực tế">
              <span style={{ color: '#000' }}>
                {riceCrop.actual_harvest_date ? dayjs(riceCrop.actual_harvest_date).format('DD/MM/YYYY') : '-'}
              </span>
            </Descriptions.Item>
            {riceCrop.yield_amount && (
              <Descriptions.Item label="Sản lượng">
                {riceCrop.yield_amount} kg
              </Descriptions.Item>
            )}
            {riceCrop.quality_grade && (
              <Descriptions.Item label="Chất lượng">
                {riceCrop.quality_grade}
              </Descriptions.Item>
            )}
            {riceCrop.notes && (
              <Descriptions.Item label="Ghi chú" span={2}>
                {riceCrop.notes}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      ),
    },
    {
      key: 'schedules',
      label: 'Lịch canh tác',
      children: <FarmingSchedulesTab riceCropId={riceCrop.id} />,
    },
    {
      key: 'applications',
      label: 'Nhật ký phun/bón',
      children: <ApplicationRecordsTab riceCropId={riceCrop.id} />,
    },
    {
      key: 'growth',
      label: 'Theo dõi sinh trưởng',
      children: <GrowthTrackingTab riceCropId={riceCrop.id} />,
    },
    {
      key: 'costs',
      label: '💰 Chi phí canh tác',
      children: <CostItemsTab riceCropId={riceCrop.id} />,
    },
    {
      key: 'invoices',
      label: '🧾 Hóa đơn mua hàng',
      children: <InvoicesTab riceCropId={riceCrop.id} />,
    },
    {
      key: 'harvest',
      label: 'Thu hoạch',
      children: <HarvestRecordsTab riceCropId={riceCrop.id} />,
    },
    {
      key: 'profit',
      label: 'Báo cáo lợi nhuận',
      children: <ProfitReportTab riceCropId={riceCrop.id} />,
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-4">
        <Breadcrumb
          items={[
            {
              href: '/',
              title: <HomeOutlined />,
            },
            {
              href: '/rice-crops',
              title: 'Quản Lý Canh Tác',
              onClick: (e) => {
                e.preventDefault();
                navigate('/rice-crops');
              },
            },
            {
              title: riceCrop.field_name,
            },
          ]}
        />
      </div>

      <div className="flex justify-between items-center gap-2 mb-4">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/rice-crops')}
          className="flex-shrink-0"
          size="middle"
        >
          Quay lại
        </Button>
        <Button 
          type="primary" 
          icon={<EditOutlined />} 
          onClick={handleEdit}
          className="flex-shrink-0"
          size="middle"
        >
          <span className="hidden sm:inline">Chỉnh sửa thông tin</span>
          <span className="sm:hidden">Chỉnh sửa</span>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold m-0 break-words">
          {riceCrop.field_name}
        </h1>
        <Tag color={(statusColors as any)[riceCrop.status]} className="m-0 text-sm sm:text-base py-0.5 px-2">
          {(statusLabels as any)[riceCrop.status]}
        </Tag>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden min-h-[500px]">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={detailTabItems}
          type="line"
          tabPosition="top"
          className="px-2"
          tabBarGutter={16}
          size="middle"
        />
      </div>

      <Modal
        title="Chỉnh sửa thông tin Ruộng lúa"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        onOk={handleEditSubmit}
        confirmLoading={updateMutation.isPending}
        width={800}
        okText="Cập nhật"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" className="mt-4">
          <div className="grid grid-cols-2 gap-x-4">
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
              label="Số lượng đất"
              name="amount_of_land"
              rules={[{ required: true, message: 'Vui lòng nhập số lượng đất' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="Diện tích mỗi công đất"
              name="area_of_each_plot_of_land_id"
            >
              <Select placeholder="Chọn diện tích" allowClear>
                {areasData?.data?.items?.map((area: any) => (
                  <Select.Option key={area.id} value={area.id}>
                    {area.name} - {Number(area.acreage).toLocaleString('vi-VN')}m²
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Diện tích (m²)"
              name="field_area"
              rules={[{ required: true, message: 'Vui lòng nhập diện tích' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="Giai đoạn sinh trưởng" name="growth_stage" rules={[{ required: true }]}>
              <Select options={Object.entries(growthStageLabels).map(([value, label]) => ({ value, label }))} />
            </Form.Item>

            <Form.Item label="Trạng thái" name="status" rules={[{ required: true }]}>
              <Select options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))} />
            </Form.Item>

            <Form.Item label="Giống lúa" name="rice_variety" rules={[{ required: true }]}>
              <Input />
            </Form.Item>

            <Form.Item label="Nguồn giống" name="seed_source">
              <Input />
            </Form.Item>

            <Form.Item label="Ngày gieo mạ" name="sowing_date">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="Ngày cấy" name="transplanting_date">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="Ngày thu hoạch dự kiến" name="expected_harvest_date">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="Vị trí" name="location" className="col-span-2">
              <Input />
            </Form.Item>

            <Form.Item label="Ghi chú" name="notes" className="col-span-2">
              <Input.TextArea rows={3} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default RiceCropDetail;
