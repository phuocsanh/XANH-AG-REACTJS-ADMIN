import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Tabs,
  Card,
  Descriptions,
  Tag,
  Button,
  Spin,
  Breadcrumb,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useRiceCrop } from '@/queries/rice-crop';
import { GrowthStage, CropStatus } from '@/models/rice-farming';
import CostItemsTab from './components/CostItemsTab';
import HarvestRecordsTab from './components/HarvestRecordsTab';
import FarmingSchedulesTab from './components/FarmingSchedulesTab';
import GrowthTrackingTab from './components/GrowthTrackingTab';
import ProfitReportTab from './components/ProfitReportTab';
import { InvoicesTab } from './components/InvoicesTab';
import { EditRiceCropModal } from './components/EditRiceCropModal';
import FarmServiceCostTab from './components/FarmServiceCostTab';
import { useAppStore } from '@/stores/store';
import { hasPermission } from '@/utils/permission';

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

// Xóa hàm formatVietnameseNumber không sử dụng

const RiceCropDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('information'); // Mặc định là tab Thông tin chung (key: 'information')
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const riceCropId = id ? parseInt(id, 10) : 0;
  const { data: riceCrop, isLoading } = useRiceCrop(riceCropId);
  const { userInfo } = useAppStore();

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

  const detailTabItems = [
    {
      key: 'information',
      label: 'ℹ️ Thông tin chung',
      children: (
        <Card title="Thông tin chi tiết" bordered={false}>
          <Descriptions column={2} bordered>
            <Descriptions.Item label="Mùa vụ">
              <span style={{ color: '#000' }}>{riceCrop.season?.name || '-'} ({riceCrop.season?.year})</span>
            </Descriptions.Item>
            <Descriptions.Item label="Khách hàng">
              <span style={{ color: '#000' }}>{riceCrop.customer?.name || '-'}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Tên ruộng">
              <span style={{ color: '#000' }}>{riceCrop.field_name}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Diện tích">
              <span style={{ color: '#000' }}>
                {Number(riceCrop.field_area).toLocaleString('vi-VN')} m² 
                ({Number(riceCrop.amount_of_land).toLocaleString('vi-VN')} công)
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Giống lúa">
              <span style={{ color: '#000' }}>{riceCrop.rice_variety}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Nguồn giống">
              <span style={{ color: '#000' }}>{riceCrop.seed_source || '-'}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Vị trí" span={2}>
              <span style={{ color: '#000' }}>{riceCrop.location || '-'}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Giai đoạn">
              <Tag color={growthStageColors[riceCrop.growth_stage as keyof typeof growthStageColors]}>
                {growthStageLabels[riceCrop.growth_stage as keyof typeof growthStageLabels]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={statusColors[riceCrop.status as keyof typeof statusColors]}>
                {statusLabels[riceCrop.status as keyof typeof statusLabels]}
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
      label: '📅 Lịch canh tác',
      children: <FarmingSchedulesTab riceCropId={riceCrop.id} />,
    },
    {
      key: 'growth',
      label: '📈 Theo dõi sinh trưởng',
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
    // Chỉ hiển thị tab Chi phí Dịch vụ cho admin
    ...(hasPermission(userInfo, 'sales:manage') ? [{
      key: 'farm-service-costs',
      label: '🎁 Chi phí Dịch vụ',
      children: <FarmServiceCostTab riceCropId={riceCrop.id} />,
    }] : []),
    {
      key: 'harvest',
      label: '🌾 Thu hoạch',
      children: <HarvestRecordsTab riceCropId={riceCrop.id} />,
    },
    {
      key: 'profit',
      label: '📊 Báo cáo lợi nhuận nông dân',
      children: <ProfitReportTab riceCropId={riceCrop.id} amountOfLand={Number(riceCrop.amount_of_land)} />,
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
          onClick={() => setIsEditModalVisible(true)}
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
        <Tag color={statusColors[riceCrop.status as keyof typeof statusColors]} className="m-0 text-sm sm:text-base py-0.5 px-2">
          {statusLabels[riceCrop.status as keyof typeof statusLabels]}
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

      <EditRiceCropModal
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        riceCrop={riceCrop}
      />
    </div>
  );
};

export default RiceCropDetail;
