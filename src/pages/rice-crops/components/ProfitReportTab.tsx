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
  AreaChartOutlined,
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
      render: (val: number) => <span className="font-bold">{val.toLocaleString('de-DE')} ₫</span>,
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
      {/* HÀNG 1: DOANH THU & DIỆN TÍCH */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card bodyStyle={{ padding: '24px' }} className="h-full border-green-100 bg-green-50/20">
            <Statistic
              title={<span className="text-sm font-bold uppercase text-green-700">Tổng doanh thu</span>}
              value={total_revenue}
              formatter={(val) => Number(val).toLocaleString('de-DE')}
              precision={0}
              valueStyle={{ color: '#3f8600', fontSize: '32px', fontWeight: '900' }}
              prefix={<RiseOutlined />}
              suffix="₫"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card bodyStyle={{ padding: '24px' }} className="h-full border-slate-100 bg-slate-50/20">
            <Statistic
              title={<span className="text-sm font-bold uppercase text-slate-700">Diện tích đất</span>}
              value={amountOfLand}
              formatter={(val) => Number(val).toLocaleString('de-DE')}
              precision={1}
              valueStyle={{ color: '#475569', fontSize: '32px', fontWeight: '900' }}
              prefix={<AreaChartOutlined />}
              suffix=" Công"
            />
          </Card>
        </Col>
      </Row>

      {/* HÀNG 2: LỢI NHUẬN RÒNG & LỢI NHUẬN / CÔNG */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card bodyStyle={{ padding: '24px' }} className={`h-full border-blue-100 ${total_revenue > 0 ? (net_profit >= 0 ? 'bg-blue-50/20' : 'bg-red-50/20 border-red-100') : 'bg-slate-50 border-slate-100'}`}>
            <Statistic
              title={<span className={`text-sm font-bold uppercase ${total_revenue > 0 ? 'text-blue-700' : 'text-slate-400'}`}>Lợi nhuận</span>}
              value={total_revenue > 0 ? net_profit : 0}
              formatter={(val) => Number(val).toLocaleString('de-DE')}
              precision={0}
              valueStyle={{ color: total_revenue > 0 ? (net_profit >= 0 ? '#096dd9' : '#cf1322') : '#94a3b8', fontSize: '32px', fontWeight: '900' }}
              prefix={<DollarOutlined />}
              suffix="₫"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
           <Card bodyStyle={{ padding: '24px' }} className={`h-full ${total_revenue > 0 ? (net_profit >= 0 ? 'bg-indigo-50/30 border-indigo-100' : 'bg-orange-50/30 border-orange-100') : 'bg-slate-50 border-slate-100'}`}>
             <Statistic
               title={
                 <div>
                   <span className={`text-sm font-bold uppercase block ${total_revenue > 0 ? (net_profit >= 0 ? 'text-indigo-700' : 'text-orange-700') : 'text-slate-400'}`}>Lợi nhuận / Công</span>
                   <span className={`text-[10px] font-medium block mt-1 ${total_revenue > 0 ? (net_profit >= 0 ? 'text-indigo-600/70' : 'text-orange-600/70') : 'text-slate-400/70'}`}> (Bao gồm chi phí canh tác + vật tư)</span>
                 </div>
               }
               value={total_revenue > 0 ? (net_profit / (amountOfLand || 1)) : 0}
               formatter={(val) => Number(val).toLocaleString('de-DE')}
               precision={0}
               valueStyle={{ color: total_revenue > 0 ? (net_profit >= 0 ? '#4338ca' : '#c2410c') : '#94a3b8', fontSize: '32px', fontWeight: '900' }}
               prefix={<RiseOutlined />}
               suffix="₫"
             />
           </Card>
        </Col>
      </Row>

      {/* HÀNG 3: TỔNG CHI PHÍ & Tổng chi phí / Công */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card bodyStyle={{ padding: '20px' }} className="border-rose-100 bg-rose-50/20">
            <Statistic
              title={
                <div>
                  <span className="text-xs uppercase font-bold text-rose-600 block">Tổng chi phí</span>
                  <span className="text-[10px] text-rose-500/80 font-medium block mt-0.5 lowercase">(gồm cày, cắt, làm cỏ, phân, thuốc, giống)</span>
                </div>
              }
              value={total_cost}
              formatter={(val) => Number(val).toLocaleString('de-DE')}
              precision={0}
              valueStyle={{ fontSize: '24px', fontWeight: '800', color: '#e11d48' }}
              prefix={<FallOutlined />}
              suffix="₫"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card bodyStyle={{ padding: '20px' }} className="border-amber-100 bg-amber-50/20">
            <Statistic
              title={
                <div>
                  <span className="text-xs uppercase font-bold text-amber-600 block">Tổng chi phí / Công</span>
                  <span className="text-[10px] text-amber-500/80 font-medium block mt-0.5 lowercase">(gồm cày, cắt, làm cỏ, phân, thuốc, giống)</span>
                </div>
              }
              value={effectiveCostPerCong}
              formatter={(val) => Number(val).toLocaleString('de-DE')}
              precision={0}
              valueStyle={{ fontSize: '24px', fontWeight: '800', color: '#d97706' }}
              prefix={<DollarOutlined />}
              suffix="₫"
            />
          </Card>
        </Col>
      </Row>

      {/* HÀNG 4: TỔNG CANH TÁC & chi phí canh tác / Công */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card bodyStyle={{ padding: '20px' }} className="border-sky-100 bg-sky-50/20">
            <Statistic
              title={
                <div>
                  <span className="text-xs uppercase font-bold text-sky-600 block">Tổng Chi Phí Canh tác</span>
                  <span className="text-[10px] text-sky-500/80 font-medium lowercase block mt-0.5">(cày, cắt, xịt, làm cỏ...)</span>
                </div>
              }
              value={total_cultivation_cost || 0}
              formatter={(val) => Number(val).toLocaleString('de-DE')}
              precision={0}
              valueStyle={{ fontSize: '24px', fontWeight: '800', color: '#0284c7' }}
              prefix={<LineChartOutlined />}
              suffix="₫"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card bodyStyle={{ padding: '20px' }} className="border-indigo-100 bg-indigo-50/20">
            <Statistic
              title={
                <div>
                  <span className="text-xs uppercase font-bold text-indigo-600 block">Chi phí canh tác / Công</span>
                  <span className="text-[10px] text-indigo-500/80 font-medium lowercase block mt-0.5">(cày, cắt, xịt, làm cỏ...)</span>
                </div>
              }
              value={cultivation_cost_per_cong || 0}
              formatter={(val) => Number(val).toLocaleString('de-DE')}
              precision={0}
              valueStyle={{ fontSize: '24px', fontWeight: '800', color: '#4f46e5' }}
              prefix={<ThunderboltOutlined />}
              suffix="₫"
            />
          </Card>
        </Col>
      </Row>

      {/* HÀNG 5: TỔNG VẬT TƯ & Chi Phí Vật tư / Công */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card bodyStyle={{ padding: '20px' }} className="border-purple-100 bg-purple-50/20">
            <Statistic
              title={
                <div>
                  <span className="text-xs uppercase font-bold text-purple-600 block">Tổng Chi Phí Vật Tư</span>
                  <span className="text-[10px] text-purple-500/80 font-medium block mt-0.5 uppercase">(Phân, Thuốc, Giống)</span>
                </div>
              }
              value={total_input_cost || 0}
              formatter={(val) => Number(val).toLocaleString('de-DE')}
              precision={0}
              valueStyle={{ fontSize: '24px', fontWeight: '800', color: '#9333ea' }}
              prefix={<ExperimentOutlined />}
              suffix="₫"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card bodyStyle={{ padding: '20px' }} className="border-fuchsia-100 bg-fuchsia-50/20">
            <Statistic
              title={
                <div>
                  <span className="text-xs uppercase font-bold text-fuchsia-600 block">Chi Phí Vật tư / Công</span>
                  <span className="text-[10px] text-fuchsia-500/80 font-medium block mt-0.5 uppercase">(Phân, Thuốc, Giống)</span>
                </div>
              }
              value={input_cost_per_cong || 0}
              formatter={(val) => Number(val).toLocaleString('de-DE')}
              precision={0}
              valueStyle={{ fontSize: '24px', fontWeight: '800', color: '#c026d3' }}
              prefix={<PlusSquareOutlined />}
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
