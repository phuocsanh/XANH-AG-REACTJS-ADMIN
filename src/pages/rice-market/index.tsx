import React, { useEffect, useState } from 'react';
import { Card, Typography, Alert, Button, Row, Col, List } from 'antd';
import { ReloadOutlined, YoutubeOutlined } from '@ant-design/icons';
import { riceMarketService, RiceAnalysisResult, YouTubeVideoData } from '@/lib/rice-market-service';
import { toast } from 'react-toastify';

const { Title, Text, Paragraph } = Typography;

const RiceMarketPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<RiceAnalysisResult | null>(null);
  const [videos, setVideos] = useState<YouTubeVideoData[]>([]);
  const [loadingVideos, setLoadingVideos] = useState<boolean>(false);


  const fetchData = async () => {
    setLoading(true);
    try {
      // Thử lấy dữ liệu mới nhất từ database
      let result = await riceMarketService.getLatestRiceMarketData();
      setData(result);
    } catch (error: any) {
      // Nếu lỗi 404 (Không tìm thấy dữ liệu), chỉ thông báo
      if (error.response && error.response.status === 404) {
        console.log('Chưa có dữ liệu trong database.');
        toast.info('Chưa có dữ liệu thị trường lúa gạo.');
        setData(null);
      } else {
        console.error('Error fetching rice market data:', error);
        toast.error('Không thể tải dữ liệu thị trường lúa gạo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchVideos = async () => {
    setLoadingVideos(true);
    try {
      const result = await riceMarketService.getYouTubeVideos('giá lúa gạo hôm nay', 6);
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
      // Chỉ lấy dữ liệu mới nhất từ database
      const result = await riceMarketService.getLatestRiceMarketData();
      setData(result);
      toast.success('Đã cập nhật dữ liệu mới nhất.');
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        toast.info('Chưa có dữ liệu mới trong hệ thống.');
        setData(null);
      } else {
        console.error('Error updating rice market data:', error);
        toast.error('Lỗi khi cập nhật dữ liệu.');
      }
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
        <Title level={2}>Thị trường Lúa Gạo</Title>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          onClick={handleAnalyze} 
          loading={loading}
        >
          Làm mới dữ liệu
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={24} lg={16}>
          <Card title="Tổng quan thị trường" loading={loading} className="mb-4 shadow-md">
            {data ? (
              <>
                {/* Hiển thị Summary */}
                <div className="mb-4">
                  <Title level={4}>Tóm tắt</Title>
                  <Paragraph>{data.summary}</Paragraph>
                </div>

                {/* Hiển thị Price Analysis */}
                <div className="mb-4">
                  <Title level={4}>Phân tích giá</Title>
                  <Paragraph style={{ whiteSpace: 'pre-line' }}>
                    {typeof data === 'object' && 'price_analysis' in data 
                      ? (data as any).price_analysis 
                      : 'Không có dữ liệu phân tích giá'}
                  </Paragraph>
                </div>
                
                <div className="mt-4 text-right">
                  <Text type="secondary" italic>
                    Cập nhật lần cuối: {new Date(data.lastUpdated || (data as any).last_updated || new Date()).toLocaleString('vi-VN')}
                  </Text>
                  {(data.sourceUrl || (data as any).data_sources) && (
                    <div>
                      <Text type="secondary">
                        Nguồn: {data.sourceUrl || ((data as any).data_sources && (data as any).data_sources.join(', '))}
                      </Text>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Alert message="Chưa có dữ liệu phân tích." type="info" showIcon />
            )}
          </Card>
        </Col>

        <Col span={24} lg={8}>
          <Card title={<><YoutubeOutlined style={{ color: 'red' }} /> Video tin tức mới nhất</>} loading={loadingVideos} className="shadow-md">
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

export default RiceMarketPage;
