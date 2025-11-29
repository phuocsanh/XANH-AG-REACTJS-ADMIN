import React from 'react';
import { Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DailyRiskData, RiskLevel } from '@/models/rice-blast';
import { BacterialBlightDailyData } from '@/queries/bacterial-blight';

interface DailyDataTableProps {
  data: DailyRiskData[] | BacterialBlightDailyData[];
  loading?: boolean;
  diseaseType?: 'rice-blast' | 'bacterial-blight';
}

/**
 * Lấy màu sắc theo mức độ nguy cơ
 */
const getRiskColor = (riskLevel: string): string => {
  const colorMap: Record<string, string> = {
    'RẤT CAO': 'red',
    'CAO': 'orange',
    'TRUNG BÌNH': 'gold',
    'THẤP': 'green',
    'AN TOÀN': 'blue',
    'CỰC KỲ NGUY HIỂM': 'red',
  };
  return colorMap[riskLevel] || 'default';
};

/**
 * Component hiển thị bảng dữ liệu nguy cơ hàng ngày
 */
export const DailyDataTable: React.FC<DailyDataTableProps> = ({ 
  data, 
  loading = false,
  diseaseType = 'rice-blast'
}) => {
  const isRiceBlast = diseaseType === 'rice-blast';
  
  // Common columns
  const commonColumns: ColumnsType<any> = [
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      width: 100,
      render: (date: string, record: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>{date}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{record.dayOfWeek}</div>
        </div>
      ),
    },
    {
      title: 'Nhiệt độ (°C)',
      key: 'temp',
      width: 150,
      render: (_, record: any) => (
        <div>
          <div style={{ fontSize: 12 }}>
            {record.tempMin.toFixed(1)} - {record.tempMax.toFixed(1)}
          </div>
          <div style={{ fontSize: 12, color: '#888' }}>
            TB: {record.tempAvg.toFixed(1)}
          </div>
        </div>
      ),
    },
    {
      title: 'Độ ẩm (%)',
      dataIndex: 'humidityAvg',
      key: 'humidity',
      width: 100,
      render: (value: number) => `${value.toFixed(1)}%`,
    },
  ];

  // Rice Blast specific columns
  const riceBlastColumns: ColumnsType<DailyRiskData> = [
    {
      title: 'Lá ướt (giờ)',
      dataIndex: 'lwdHours',
      key: 'lwd',
      width: 120,
      render: (hours: number) => (
        <Tooltip title="Số giờ lá ướt - Chỉ số quan trọng nhất">
          <span
            style={{
              fontWeight: hours >= 14 ? 'bold' : 'normal',
              color: hours >= 14 ? '#ff4d4f' : 'inherit',
            }}
          >
            {hours} giờ
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Mưa',
      key: 'rain',
      width: 120,
      render: (_, record: DailyRiskData) => (
        <div>
          <div style={{ fontSize: 12 }}>{record.rainTotal.toFixed(1)} mm</div>
          <div style={{ fontSize: 12, color: '#888' }}>{record.rainHours} giờ</div>
        </div>
      ),
    },
    {
      title: 'Sương mù',
      dataIndex: 'fogHours',
      key: 'fog',
      width: 100,
      render: (hours: number) => `${hours} giờ`,
    },
  ];

  // Bacterial Blight specific columns
  const bacterialBlightColumns: ColumnsType<BacterialBlightDailyData> = [
    {
      title: 'Mưa',
      key: 'rain',
      width: 120,
      render: (_, record: BacterialBlightDailyData) => (
        <div>
          <div style={{ fontSize: 12 }}>{record.rainTotal.toFixed(1)} mm</div>
          <div style={{ fontSize: 12, color: '#888' }}>{record.rainHours} giờ</div>
        </div>
      ),
    },
    {
      title: 'Gió (km/h)',
      key: 'wind',
      width: 120,
      render: (_, record: BacterialBlightDailyData) => (
        <div>
          <div style={{ fontSize: 12 }}>Max: {record.windSpeedMax.toFixed(1)}</div>
          <div style={{ fontSize: 12, color: '#888' }}>TB: {record.windSpeedAvg.toFixed(1)}</div>
        </div>
      ),
    },
    {
      title: 'Mưa 3 ngày',
      dataIndex: 'rain3Days',
      key: 'rain3days',
      width: 120,
      render: (value: number) => (
        <Tooltip title="Tổng mưa 3 ngày - Nguy cơ ngập úng">
          <span
            style={{
              fontWeight: value >= 100 ? 'bold' : 'normal',
              color: value >= 100 ? '#ff4d4f' : 'inherit',
            }}
          >
            {value.toFixed(1)} mm
          </span>
        </Tooltip>
      ),
    },
  ];

  // Risk columns (common for both)
  const riskColumns: ColumnsType<any> = [
    {
      title: 'Điểm nguy cơ',
      dataIndex: 'riskScore',
      key: 'score',
      width: 120,
      render: (score: number) => (
        <Tooltip title="Tổng điểm tối đa: 135">
          <span
            style={{
              fontWeight: score >= 100 ? 'bold' : 'normal',
              color: score >= 100 ? '#ff4d4f' : 'inherit',
            }}
          >
            {score}/135
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Mức độ',
      dataIndex: 'riskLevel',
      key: 'level',
      width: 150,
      render: (level: string) => (
        <Tag color={getRiskColor(level)}>{level}</Tag>
      ),
    },
  ];

  const columns = [
    ...commonColumns,
    ...(isRiceBlast ? riceBlastColumns : bacterialBlightColumns),
    ...riskColumns,
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      loading={loading}
      rowKey={(record) => record.date}
      pagination={false}
      scroll={{ x: 1000 }}
      size="small"
    />
  );
};
