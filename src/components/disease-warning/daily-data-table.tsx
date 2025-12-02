import React from 'react';
import { Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DailyRiskData, RiskLevel } from '@/models/rice-blast';
import { BacterialBlightDailyData } from '@/queries/bacterial-blight';

interface DailyDataTableProps {
  data: any[];
  loading?: boolean;
  diseaseType?: 'rice-blast' | 'bacterial-blight' | 'stem-borer' | 'gall-midge' | 'brown-plant-hopper' | 'sheath-blight' | 'grain-discoloration';
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
            {record.tempMin !== undefined && record.tempMax !== undefined 
              ? `${record.tempMin.toFixed(1)} - ${record.tempMax.toFixed(1)}`
              : (record.tempAvg !== undefined ? `TB: ${record.tempAvg.toFixed(2)}` : '-')}
          </div>
          {record.tempMin !== undefined && record.tempAvg !== undefined && (
            <div style={{ fontSize: 12, color: '#888' }}>
              TB: {record.tempAvg.toFixed(2)}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Độ ẩm (%)',
      dataIndex: 'humidityAvg',
      key: 'humidity',
      width: 100,
      render: (value: number) => value !== undefined ? `${value.toFixed(2)}%` : '-',
    },
  ];

  // Specific columns based on disease type
  const getSpecificColumns = (): ColumnsType<any> => {
    switch (diseaseType) {
      case 'rice-blast':
        return [
          {
            title: 'Lá ướt (giờ)',
            dataIndex: 'lwdHours',
            key: 'lwd',
            width: 120,
            render: (hours: number) => (
              <Tooltip title="Số giờ lá ướt - Chỉ số quan trọng nhất">
                <span style={{ fontWeight: hours >= 14 ? 'bold' : 'normal', color: hours >= 14 ? '#ff4d4f' : 'inherit' }}>
                  {hours} giờ
                </span>
              </Tooltip>
            ),
          },
          {
            title: 'Mưa',
            key: 'rain',
            width: 120,
            render: (_, record: any) => (
              <div>
                <div style={{ fontSize: 12 }}>{record.rainTotal !== undefined ? `${record.rainTotal.toFixed(2)} mm` : '-'}</div>
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
      
      case 'bacterial-blight':
        return [
          {
            title: 'Mưa',
            key: 'rain',
            width: 120,
            render: (_, record: any) => (
              <div>
                <div style={{ fontSize: 12 }}>{record.rainTotal !== undefined ? `${record.rainTotal.toFixed(2)} mm` : '-'}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{record.rainHours} giờ</div>
              </div>
            ),
          },
          {
            title: 'Gió (km/h)',
            key: 'wind',
            width: 120,
            render: (_, record: any) => (
              <div>
                <div style={{ fontSize: 12 }}>Max: {record.windSpeedMax !== undefined ? record.windSpeedMax.toFixed(2) : '-'}</div>
                <div style={{ fontSize: 12, color: '#888' }}>TB: {record.windSpeedAvg !== undefined ? record.windSpeedAvg.toFixed(2) : '-'}</div>
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
                <span style={{ fontWeight: value >= 100 ? 'bold' : 'normal', color: value >= 100 ? '#ff4d4f' : 'inherit' }}>
                  {value !== undefined ? `${value.toFixed(2)} mm` : '-'}
                </span>
              </Tooltip>
            ),
          },
        ];

      case 'stem-borer':
        return [
          {
            title: 'Nắng (giờ)',
            dataIndex: 'sunHours',
            key: 'sun',
            width: 100,
            render: (hours: number) => `${hours} giờ`,
          },
        ];

      case 'gall-midge':
        return [
          {
            title: 'Mây che phủ (%)',
            dataIndex: 'cloudAvg',
            key: 'cloud',
            width: 120,
            render: (value: number) => value !== undefined ? `${value.toFixed(2)}%` : '-',
          },
        ];

      case 'brown-plant-hopper':
        return [
          {
            title: 'Gió TB (km/h)',
            dataIndex: 'windSpeedAvg',
            key: 'wind',
            width: 120,
            render: (value: number) => value !== undefined ? `${value.toFixed(2)} km/h` : '-',
          },
          {
            title: 'Mưa (mm)',
            dataIndex: 'rainTotal',
            key: 'rain',
            width: 100,
            render: (value: number) => value !== undefined ? `${value.toFixed(2)} mm` : '-',
          },
        ];

      case 'sheath-blight':
        return []; // Chỉ cần nhiệt độ và độ ẩm (đã có trong common columns)

      case 'grain-discoloration':
        return [
          {
            title: 'Mưa (mm)',
            dataIndex: 'rainTotal',
            key: 'rain',
            width: 100,
            render: (value: number) => value !== undefined ? `${value.toFixed(2)} mm` : '-',
          },
          {
            title: 'Gió TB (km/h)',
            dataIndex: 'windSpeedAvg',
            key: 'wind',
            width: 120,
            render: (value: number) => value !== undefined ? `${value.toFixed(2)} km/h` : '-',
          },
        ];

      default:
        return [];
    }
  };

  // Risk columns (common for all)
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
    ...getSpecificColumns(),
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
