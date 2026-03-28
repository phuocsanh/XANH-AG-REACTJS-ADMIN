import React from 'react';
import {
  Card,
  Statistic,
  Row,
  Col,
  Table,
  Tag,
  Progress,
  Empty,
} from 'antd';
import {
  DollarOutlined,
  FallOutlined,
  RiseOutlined,
  LineChartOutlined,
  ThunderboltOutlined,
  ExperimentOutlined,
  PlusSquareOutlined,
} from '@ant-design/icons';
import { useProfitReport } from '@/queries/profit-report';

interface ProfitReportTabProps {
  riceCropId: number;
  amountOfLand?: number;
}

const ProfitReportTab: React.FC<ProfitReportTabProps> = ({ riceCropId, amountOfLand = 1 }) => {
  const { data: report, isLoading } = useProfitReport(riceCropId);

  if (isLoading) {
    return (
      <Card bodyStyle={{ padding: '40px', textAlign: 'center' }}>
        <div className="animate-pulse text-gray-400">Đang tải báo cáo lợi nhuận...</div>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card>
        <Empty description="Chưa có dữ liệu báo cáo cho ruộng lúa này" />
      </Card>
    );
  }

  const {
    total_revenue,
    total_cost,
    net_profit,
    roi,
    total_cultivation_cost,
    cultivation_cost_per_cong,
    total_input_cost,
    input_cost_per_cong,
    cost_per_cong,
    cost_breakdown = [],
  } = report;

  // Tính chi phí trên mỗi công (nếu field từ server chưa có)
  const effectiveCostPerCong = cost_per_cong || (amountOfLand > 0 ? total_cost / amountOfLand : 0);

  // Ensure cost_breakdown is an array
  const safeCostBreakdown = Array.isArray(cost_breakdown) ? cost_breakdown : [];

  const columns = [
    {
      title: 'Hạng mục chi phí',
      dataIndex: 'category',
      key: 'category',
      render: (text: string) => <Tag color="blue" className="font-bold">{text}</Tag>,
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      render: (val: number) => <span className="font-bold">{val.toLocaleString('vi-VN')} ₫</span>,
    },
    {
      title: 'Tỷ lệ',
      dataIndex: 'percentage',
      key: 'percentage',
      width: '40%',
      render: (val: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Progress percent={parseFloat(val.toFixed(1))} size="small" showInfo={false} style={{ flex: 1 }} />
          <span className="text-xs font-bold" style={{ width: '40px' }}>{val.toFixed(1)}%</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* HÀNG 1: DOANH THU & LỢI NHUẬN */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card bodyStyle={{ padding: '20px' }} className="h-full border-green-100 bg-green-50/20">
            <Statistic
              title={<span className="text-sm font-bold uppercase text-green-700">Tổng doanh thu</span>}
              value={total_revenue}
              precision={0}
              valueStyle={{ color: '#3f8600', fontSize: '28px', fontWeight: '900' }}
              prefix={<RiseOutlined />}
              suffix="₫"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card bodyStyle={{ padding: '20px' }} className={`h-full border-blue-100 ${net_profit >= 0 ? 'bg-blue-50/20' : 'bg-red-50/20 border-red-100'}`}>
            <Statistic
              title={<span className="text-sm font-bold uppercase text-blue-700">Lợi nhuận ròng</span>}
              value={net_profit}
              precision={0}
              valueStyle={{ color: net_profit >= 0 ? '#096dd9' : '#cf1322', fontSize: '28px', fontWeight: '900' }}
              prefix={<DollarOutlined />}
              suffix="₫"
            />
            <div className="mt-2 text-right">
              <Tag color={roi >= 0 ? 'green' : 'red'} className="rounded-full px-3 font-bold border-none shadow-sm">
                ROI: {roi.toFixed(1)}%
              </Tag>
            </div>
          </Card>
        </Col>
      </Row>

      {/* HÀNG 2: 6 THẺ CHI PHÍ CHI TIẾT */}
      <Row gutter={[12, 12]}>
        {/* 1. Tổng chi phí */}
        <Col xs={12} md={8} lg={4}>
          <Card bodyStyle={{ padding: '12px' }} className="border-rose-100 bg-rose-50/20">
            <Statistic
              title={<span className="text-[10px] uppercase font-bold text-rose-600">Tổng chi phí</span>}
              value={total_cost}
              precision={0}
              valueStyle={{ fontSize: '15px', fontWeight: '800', color: '#e11d48' }}
              prefix={<FallOutlined style={{ fontSize: '12px' }} />}
              suffix="₫"
            />
          </Card>
        </Col>

        {/* 2. Chi phí mỗi công */}
        <Col xs={12} md={8} lg={4}>
          <Card bodyStyle={{ padding: '12px' }} className="border-amber-100 bg-amber-50/20">
            <Statistic
              title={<span className="text-[10px] uppercase font-bold text-amber-600">Chi phí / Công</span>}
              value={effectiveCostPerCong}
              precision={0}
              valueStyle={{ fontSize: '15px', fontWeight: '800', color: '#d97706' }}
              prefix={<DollarOutlined style={{ fontSize: '12px' }} />}
              suffix="₫"
            />
          </Card>
        </Col>

        {/* 3. Tổng chi phí canh tác */}
        <Col xs={12} md={8} lg={4}>
          <Card bodyStyle={{ padding: '12px' }} className="border-sky-100 bg-sky-50/20">
            <Statistic
              title={
                <div>
                  <span className="text-[10px] uppercase font-bold text-sky-600 block">Tổng CP Canh tác</span>
                  <span className="text-[9px] text-sky-500/80 font-medium lowercase block mt-0.5">(cày, cắt, xịt, làm cỏ...)</span>
                </div>
              }
              value={total_cultivation_cost || 0}
              precision={0}
              valueStyle={{ fontSize: '15px', fontWeight: '800', color: '#0284c7' }}
              prefix={<LineChartOutlined style={{ fontSize: '12px' }} />}
              suffix="₫"
            />
          </Card>
        </Col>

        {/* 4. Chi phí canh tác mỗi công */}
        <Col xs={12} md={8} lg={4}>
          <Card bodyStyle={{ padding: '12px' }} className="border-indigo-100 bg-indigo-50/20">
            <Statistic
              title={
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-600 block">Canh tác / Công</span>
                  <span className="text-[9px] text-indigo-500/80 font-medium lowercase block mt-0.5">(cày, cắt, xịt, làm cỏ...)</span>
                </div>
              }
              value={cultivation_cost_per_cong || 0}
              precision={0}
              valueStyle={{ fontSize: '15px', fontWeight: '800', color: '#4f46e5' }}
              prefix={<ThunderboltOutlined style={{ fontSize: '12px' }} />}
              suffix="₫"
            />
          </Card>
        </Col>

        {/* 5. Tổng chi phí vật tư */}
        <Col xs={12} md={8} lg={4}>
          <Card bodyStyle={{ padding: '12px' }} className="border-purple-100 bg-purple-50/20">
            <Statistic
              title={
                <div>
                  <span className="text-[10px] uppercase font-bold text-purple-600 block">Tổng CP Vật tư</span>
                  <span className="text-[9px] text-purple-500/80 font-medium block mt-0.5 uppercase">(Phân, Thuốc, Giống)</span>
                </div>
              }
              value={total_input_cost || 0}
              precision={0}
              valueStyle={{ fontSize: '15px', fontWeight: '800', color: '#9333ea' }}
              prefix={<ExperimentOutlined style={{ fontSize: '12px' }} />}
              suffix="₫"
            />
          </Card>
        </Col>

        {/* 6. Chi phí vật tư mỗi công */}
        <Col xs={12} md={8} lg={4}>
          <Card bodyStyle={{ padding: '12px' }} className="border-fuchsia-100 bg-fuchsia-50/20">
            <Statistic
              title={
                <div>
                  <span className="text-[10px] uppercase font-bold text-fuchsia-600 block">Vật tư / Công</span>
                  <span className="text-[9px] text-fuchsia-500/80 font-medium block mt-0.5 uppercase">(Phân, Thuốc, Giống)</span>
                </div>
              }
              value={input_cost_per_cong || 0}
              precision={0}
              valueStyle={{ fontSize: '15px', fontWeight: '800', color: '#c026d3' }}
              prefix={<PlusSquareOutlined style={{ fontSize: '12px' }} />}
              suffix="₫"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card 
            title={<span className="text-base font-bold flex items-center gap-2"><PlusSquareOutlined /> Cơ cấu chi phí chi tiết</span>} 
            className="shadow-sm overflow-hidden" 
            bodyStyle={{ padding: '0' }}
          >
            <Table
              columns={columns}
              dataSource={safeCostBreakdown}
              pagination={false}
              size="middle"
              rowKey="category"
              className="custom-report-table"
              locale={{ emptyText: 'Chưa có phân bổ chi tiết chi phí' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProfitReportTab;
