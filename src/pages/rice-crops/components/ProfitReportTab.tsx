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
  PieChartOutlined,
} from '@ant-design/icons';
import { useProfitReport } from '@/queries/profit-report';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ProfitReportTabProps {
  riceCropId: number;
}

const { Title } = Typography;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

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

  // Dữ liệu cho biểu đồ tròn
  const pieData = safeCostBreakdown.map((item: any) => ({
    name: item.category,
    value: item.amount,
  }));

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
      <Row gutter={16} className="mb-6">
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng doanh thu"
              value={total_revenue}
              precision={0}
              valueStyle={{ color: '#3f8600' }}
              prefix={<RiseOutlined />}
              suffix="₫"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng chi phí"
              value={total_cost}
              precision={0}
              valueStyle={{ color: '#cf1322' }}
              prefix={<FallOutlined />}
              suffix="₫"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Lợi nhuận ròng"
              value={net_profit}
              precision={0}
              valueStyle={{ color: net_profit >= 0 ? '#3f8600' : '#cf1322' }}
              prefix={<DollarOutlined />}
              suffix="₫"
            />
            <div className="mt-2">
              <Tag color={roi >= 0 ? 'green' : 'red'}>
                ROI: {roi.toFixed(2)}%
              </Tag>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="Phân bổ chi phí" className="h-full">
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => value.toLocaleString('vi-VN') + ' ₫'} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Chi tiết chi phí" className="h-full">
            <Table
              columns={columns}
              dataSource={safeCostBreakdown}
              rowKey="category"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProfitReportTab;
