import React, { useEffect, useState } from 'react';
import { Card, Typography, Button, List, Row, Col, Alert, Divider } from 'antd';
import { ReloadOutlined, YoutubeOutlined, CloudOutlined, ThunderboltOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { backendWeatherService, WeatherForecastResult, YouTubeVideoData } from '@/lib/backend-weather-service';
import { toast } from 'react-toastify';

const { Title, Text, Paragraph } = Typography;

const WeatherForecastPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<WeatherForecastResult | null>(null);
  const [videos, setVideos] = useState<YouTubeVideoData[]>([]);
  const [loadingVideos, setLoadingVideos] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Try to get latest data first
      let result = await backendWeatherService.getLatestWeatherForecast();
      setData(result);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      toast.error('Không thể tải dữ liệu thời tiết.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVideos = async () => {
    setLoadingVideos(true);
    try {
      const result = await backendWeatherService.getYouTubeVideos('dự báo thời tiết Việt Nam', 6);
      setVideos(result.videos);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const result = await backendWeatherService.getFullWeatherForecast();
      setData(result);
      toast.success('Đã cập nhật dự báo thời tiết mới nhất.');
    } catch (error) {
      console.error('Error analyzing weather:', error);
      toast.error('Lỗi khi phân tích thời tiết.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchVideos();
  }, []);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <Title level={2}>Dự báo Thời tiết & Thủy văn</Title>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          onClick={handleAnalyze} 
          loading={loading}
        >
          Cập nhật dự báo
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={24} lg={16}>
          <Card title={<><CloudOutlined /> Tổng quan thời tiết</>} loading={loading} className="mb-4 shadow-md">
            {data ? (
              <>
                <Paragraph strong className="text-lg">{data.summary}</Paragraph>
                
                <Divider orientation="left"><ThunderboltOutlined /> Tình hình Mưa bão & Áp thấp</Divider>
                <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                  <Paragraph style={{ whiteSpace: 'pre-line' }}>{data.stormsAndTropicalDepressionsInfo}</Paragraph>
                </div>

                <Divider orientation="left"><EnvironmentOutlined /> Thủy văn & Mực nước ĐBSCL</Divider>
                <div className="bg-cyan-50 p-4 rounded-md border border-cyan-100 mb-4">
                  <Title level={5}>Thông tin thủy văn</Title>
                  <Paragraph style={{ whiteSpace: 'pre-line' }}>{data.hydrologyInfo}</Paragraph>
                  
                  <Title level={5} className="mt-4">Mực nước chi tiết</Title>
                  <Paragraph style={{ whiteSpace: 'pre-line' }}>{data.waterLevelInfo}</Paragraph>
                </div>

                <div className="mt-4 text-right">
                  <Text type="secondary" italic>Cập nhật lần cuối: {new Date(data.lastUpdated).toLocaleString('vi-VN')}</Text>
                  {data.dataSources && data.dataSources.length > 0 && (
                    <div className="mt-1">
                      <Text type="secondary">Nguồn dữ liệu: {data.dataSources.join(', ')}</Text>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Alert message="Chưa có dữ liệu dự báo. Vui lòng nhấn 'Cập nhật dự báo'." type="info" showIcon />
            )}
          </Card>
        </Col>

        <Col span={24} lg={8}>
          <Card title={<><YoutubeOutlined style={{ color: 'red' }} /> Bản tin thời tiết mới nhất</>} loading={loadingVideos} className="shadow-md">
            <List
              itemLayout="vertical"
              dataSource={videos}
              renderItem={(item) => (
                <List.Item key={item.id} className="p-0 mb-4 border-b pb-4 last:border-0">
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="block group">
                    <div className="relative overflow-hidden rounded-lg mb-2">
                      <img src={item.thumbnail} alt={item.title} className="w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                        {item.duration}
                      </div>
                    </div>
                    <Text strong className="group-hover:text-blue-600 line-clamp-2">{item.title}</Text>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{item.channel.name}</span>
                      <span>{item.uploadTime}</span>
                    </div>
                  </a>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default WeatherForecastPage;
