import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine } from 'recharts';
import { Card, Spin } from 'antd';

interface RiskChartProps {
  data: any[];
  loading?: boolean;
}

const getRiskColor = (riskLevel: string) => {
  switch (riskLevel) {
    case 'RẤT CAO': return '#ff4d4f'; // Red
    case 'CAO': return '#fa8c16'; // Orange
    case 'TRUNG BÌNH': return '#faad14'; // Yellow/Gold
    case 'THẤP': return '#52c41a'; // Green
    case 'AN TOÀN': return '#1890ff'; // Blue
    default: return '#d9d9d9'; // Grey
  }
};

export const RiskChart: React.FC<RiskChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <Card title="📊 Biểu Đồ Nguy Cơ 7 Ngày" style={{ marginTop: 24 }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin />
        </div>
      </Card>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <Card title="📊 Biểu Đồ Nguy Cơ 7 Ngày" style={{ marginTop: 24 }}>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} label={{ value: 'Điểm Nguy Cơ', angle: -90, position: 'insideLeft' }} />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div style={{ backgroundColor: '#fff', padding: 10, border: '1px solid #ccc', borderRadius: 4 }}>
                      <p style={{ fontWeight: 'bold', marginBottom: 5 }}>{label}</p>
                      <p style={{ color: getRiskColor(data.riskLevel), marginBottom: 0 }}>
                        {data.riskLevel}: {data.riskScore}/100
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine y={75} stroke="red" strokeDasharray="3 3" label="Nguy hiểm" />
            <Bar dataKey="riskScore" name="Điểm nguy cơ" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getRiskColor(entry.riskLevel)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
