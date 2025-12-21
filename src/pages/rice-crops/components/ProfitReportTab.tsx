import React from 'react';
import {
  Card,
  Statistic,
  Row,
  Col,
  Table,
  Tag,
  Progress,
  Typography,
} from 'antd';
import {
  DollarOutlined,
  FallOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { useProfitReport } from '@/queries/profit-report';

interface ProfitReportTabProps {
  riceCropId: number;
}

const { Title } = Typography;

const ProfitReportTab: React.FC<ProfitReportTabProps> = ({ riceCropId }) => {
  const { data: report, isLoading } = useProfitReport(riceCropId);

  if (isLoading) {
    return <div>Đang tải báo cáo...</div>;
  }

  if (!report) {
    return <div>Chưa có dữ liệu báo cáo</div>;
  }

  const {
    total_revenue,
    total_cost,
    net_profit,
    roi,
    cost_breakdown = [],
  } = report;

  // Ensure cost_breakdown is an array
  const safeCostBreakdown = Array.isArray(cost_breakdown) ? cost_breakdown : [];

  const columns = [
    {
      title: 'Hạng mục chi phí',
      dataIndex: 'category',
      key: 'category',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (val: number) => val.toLocaleString('vi-VN'),
    },
    {
      title: 'Tỷ lệ',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (val: number) => <Progress percent={parseFloat(val.toFixed(1))} size="small" />,
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={8}>
          <Card bodyStyle={{ padding: '12px' }} className="h-full">
            <Statistic
              title={<span className="text-xs sm:text-base">Doanh thu</span>}
              value={total_revenue}
              precision={0}
              valueStyle={{ color: '#3f8600', fontSize: '18px', fontWeight: 'bold' }}
              prefix={<RiseOutlined style={{ fontSize: '14px' }} />}
              suffix="₫"
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card bodyStyle={{ padding: '12px' }} className="h-full">
            <Statistic
              title={<span className="text-xs sm:text-base">Chi phí</span>}
              value={total_cost}
              precision={0}
              valueStyle={{ color: '#cf1322', fontSize: '18px', fontWeight: 'bold' }}
              prefix={<FallOutlined style={{ fontSize: '14px' }} />}
              suffix="₫"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bodyStyle={{ padding: '12px' }} className="h-full">
            <Statistic
              title={<span className="text-sm sm:text-base">Lợi nhuận ròng</span>}
              value={net_profit}
              precision={0}
              valueStyle={{ color: net_profit >= 0 ? '#3f8600' : '#cf1322', fontSize: '20px', fontWeight: 'bold' }}
              prefix={<DollarOutlined style={{ fontSize: '16px' }} />}
              suffix="₫"
            />
            <div className="mt-1">
              <Tag color={roi >= 0 ? 'green' : 'red'} className="text-xs">
                ROI: {roi.toFixed(1)}%
              </Tag>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card 
            title={<span className="text-sm sm:text-base">Chi tiết chi phí</span>} 
            className="shadow-sm" 
            bodyStyle={{ padding: '0' }}
          >
            <Table
              columns={columns}
              dataSource={safeCostBreakdown}
              pagination={false}
              size="middle"
              rowKey="category"
              locale={{ emptyText: 'Chưa có chi tiết chi phí' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProfitReportTab;
