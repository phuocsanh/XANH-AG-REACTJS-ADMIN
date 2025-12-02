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
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useRiceCrop } from '@/queries/rice-crop';
import { GrowthStage, CropStatus } from '@/types/rice-farming.types';
import CostItemsTab from './components/CostItemsTab';
import HarvestRecordsTab from './components/HarvestRecordsTab';
import FarmingSchedulesTab from './components/FarmingSchedulesTab';
import ApplicationRecordsTab from './components/ApplicationRecordsTab';
import GrowthTrackingTab from './components/GrowthTrackingTab';
import ProfitReportTab from './components/ProfitReportTab';

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

const RiceCropDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');

  const riceCropId = id ? parseInt(id, 10) : 0;
  const { data: riceCrop, isLoading } = useRiceCrop(riceCropId);

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
        <h2>Không tìm thấy thông tin vụ lúa</h2>
        <Button onClick={() => navigate('/rice-crops')}>Quay lại danh sách</Button>
      </div>
    );
  }

  const detailTabItems = [
    {
      key: 'info',
      label: 'Thông tin chung',
      children: (
        <Card title="Thông tin chi tiết" bordered={false}>
          <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
            <Descriptions.Item label="Tên ruộng" span={2}>
              <span className="font-medium text-lg">{riceCrop.field_name}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Khách hàng">
              {riceCrop.customer?.name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Mùa vụ">
              {riceCrop.season?.name || '-'} ({riceCrop.season?.year || '-'})
            </Descriptions.Item>
            <Descriptions.Item label="Diện tích">
              {riceCrop.field_area.toLocaleString('vi-VN')} m²
            </Descriptions.Item>
            <Descriptions.Item label="Số công lớn">
              {riceCrop.large_labor_days}
            </Descriptions.Item>
            <Descriptions.Item label="Giống lúa">
              {riceCrop.rice_variety}
            </Descriptions.Item>
            <Descriptions.Item label="Nguồn giống">
              {riceCrop.seed_source || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Vị trí" span={2}>
              {riceCrop.location || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Giai đoạn">
              <Tag color={growthStageColors[riceCrop.growth_stage]}>
                {growthStageLabels[riceCrop.growth_stage]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={statusColors[riceCrop.status]}>
                {statusLabels[riceCrop.status]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày gieo">
              {riceCrop.sowing_date ? dayjs(riceCrop.sowing_date).format('DD/MM/YYYY') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày cấy">
              {riceCrop.transplanting_date ? dayjs(riceCrop.transplanting_date).format('DD/MM/YYYY') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày thu hoạch dự kiến">
              {riceCrop.expected_harvest_date ? dayjs(riceCrop.expected_harvest_date).format('DD/MM/YYYY') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày thu hoạch thực tế">
              {riceCrop.actual_harvest_date ? dayjs(riceCrop.actual_harvest_date).format('DD/MM/YYYY') : '-'}
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
      label: 'Chi phí',
      children: <CostItemsTab riceCropId={riceCrop.id} />,
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
              title: 'Quản lý vụ lúa',
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

      <div className="flex justify-between items-center mb-6">
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/rice-crops')}
          >
            Quay lại
          </Button>
          <h1 className="text-2xl font-bold m-0">{riceCrop.field_name}</h1>
          <Tag color={statusColors[riceCrop.status]} className="ml-2 text-base py-1 px-2">
            {statusLabels[riceCrop.status]}
          </Tag>
        </Space>
      </div>

      <div className="bg-white rounded shadow p-4">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={detailTabItems}
          type="card"
        />
      </div>
    </div>
  );
};

export default RiceCropDetail;
