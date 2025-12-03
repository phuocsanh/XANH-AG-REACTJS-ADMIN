import React from 'react';
import { Typography, Divider, Alert } from 'antd';

const { Paragraph, Title, Text } = Typography;

interface WarningMessageDisplayProps {
  message: string;
  peakDays?: string | null;
}

export const WarningMessageDisplay: React.FC<WarningMessageDisplayProps> = ({ message, peakDays }) => {
  // Parse message thành các phần
  // Format mới:
  // Header
  // Location
  // 
  // Summary
  // 
  // Peak Days (optional in message, but passed as prop)
  // 
  // PHÂN TÍCH CHI TIẾT:
  // ...
  // 
  // KHUYẾN NGHỊ:
  // ...

  const sections = message.split('\n\n');
  
  // Helper to safely get section content
  const getSection = (index: number) => sections[index] || '';

  return (
    <div style={{ whiteSpace: 'pre-line' }}>
      {/* Dòng đầu: Emoji + Risk Level */}
      <Title level={3} style={{ marginBottom: 8 }}>{getSection(0)}</Title>
      
      {/* Location */}
      <Text type="secondary" style={{ fontSize: 16 }}>{getSection(1)}</Text>
      
      <Divider style={{ margin: '16px 0' }} />
      
      {/* Summary */}
      <Paragraph style={{ fontSize: 16 }}>{getSection(2)}</Paragraph>
      
      {/* Peak Days Alert */}
      {peakDays && (
        <Alert
          message="⚠️ Thời Gian Nguy Cơ Cao"
          description={`Cần đặc biệt chú ý trong khoảng: ${peakDays}`}
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}
      
      {/* Phân tích chi tiết */}
      {message.includes('PHÂN TÍCH CHI TIẾT:') && (
        <>
          <Title level={5}>🔍 PHÂN TÍCH CHI TIẾT:</Title>
          <Paragraph>
            {sections.find(s => s.includes('PHÂN TÍCH CHI TIẾT:'))?.replace('🔍 PHÂN TÍCH CHI TIẾT:\n', '').replace('PHÂN TÍCH CHI TIẾT:\n', '')}
          </Paragraph>
          <Divider />
        </>
      )}
      
      {/* Khuyến nghị */}
      {message.includes('KHUYẾN NGHỊ:') && (
        <>
          <Title level={5}>💊 KHUYẾN NGHỊ:</Title>
          <Paragraph style={{ color: '#1890ff', fontWeight: 500 }}>
            {sections.find(s => s.includes('KHUYẾN NGHỊ:'))?.replace('💊 KHUYẾN NGHỊ:\n', '').replace('KHUYẾN NGHỊ:\n', '')}
          </Paragraph>
        </>
      )}
    </div>
  );
};
