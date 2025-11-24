import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, Spin, Alert, Input, Button, List, Tag, Row, Col, Statistic, Divider, Space } from 'antd';
import { ReloadOutlined, SendOutlined, YoutubeOutlined, RiseOutlined, FallOutlined, MinusOutlined } from '@ant-design/icons';
import { riceMarketService, RiceAnalysisResult, YouTubeVideoData } from '@/lib/rice-market-service';
import { toast } from 'react-toastify';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

const RiceMarketPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<RiceAnalysisResult | null>(null);
  const [videos, setVideos] = useState<YouTubeVideoData[]>([]);
  const [loadingVideos, setLoadingVideos] = useState<boolean>(false);
  const [question, setQuestion] = useState<string>('');
  const [answer, setAnswer] = useState<any>(null);
  const [answering, setAnswering] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Try to get latest data first
      let result = await riceMarketService.getLatestRiceMarketData();
      setData(result);
      
      // If data is old or empty, maybe trigger analysis (optional, for now just show what we have)
      // Or we can provide a button to refresh/analyze fresh data
    } catch (error) {
      console.error('Error fetching rice market data:', error);
      toast.error('Không thể tải dữ liệu thị trường lúa gạo.');
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
      const result = await riceMarketService.analyzeRiceMarket();
      setData(result);
      toast.success('Đã cập nhật dữ liệu phân tích mới nhất.');
    } catch (error) {
      console.error('Error analyzing rice market:', error);
      toast.error('Lỗi khi phân tích thị trường.');
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    setAnswering(true);
    setAnswer(null);
    try {
      const result = await riceMarketService.askWithSources(question);
      setAnswer(result);
    } catch (error) {
      console.error('Error asking question:', error);
      toast.error('Không thể trả lời câu hỏi.');
    } finally {
      setAnswering(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchVideos();
  }, []);

  const columns = [
    {
      title: 'Giống lúa',
      dataIndex: 'variety',
      key: 'variety',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Giá hiện tại',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      render: (text: string) => <Text type="success">{text}</Text>,
    },
    {
      title: 'Thay đổi',
      dataIndex: 'change',
      key: 'change',
      render: (text: string) => {
        if (!text) return <MinusOutlined />;
        if (text.includes('tăng')) return <Tag color="green"><RiseOutlined /> {text}</Tag>;
        if (text.includes('giảm')) return <Tag color="red"><FallOutlined /> {text}</Tag>;
        return <Tag color="default"><MinusOutlined /> {text}</Tag>;
      },
    },
    {
      title: 'Tỉnh/Thành',
      dataIndex: 'province',
      key: 'province',
    },
  ];

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
          Cập nhật phân tích
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={24} lg={16}>
          <Card title="Tổng quan thị trường" loading={loading} className="mb-4 shadow-md">
            {data ? (
              <>
                <Paragraph>{data.summary}</Paragraph>
                
                {data.priceData && (
                  <Row gutter={16} className="mb-4">
                    <Col span={8}>
                      <Statistic title="Giá lúa tươi" value={data.priceData.freshRice} valueStyle={{ color: '#3f8600', fontSize: '1.2rem' }} />
                    </Col>
                    <Col span={8}>
                      <Statistic title="Giá gạo xuất khẩu" value={data.priceData.exportRice} valueStyle={{ color: '#cf1322', fontSize: '1.2rem' }} />
                    </Col>
                    <Col span={8}>
                      <Statistic title="Xu hướng" value={data.priceData.trend} prefix={data.priceData.trend === 'tăng' ? <RiseOutlined /> : data.priceData.trend === 'giảm' ? <FallOutlined /> : <MinusOutlined />} />
                    </Col>
                  </Row>
                )}

                <Divider orientation="left">Chi tiết giá lúa</Divider>
                <Table 
                  dataSource={data.riceVarieties} 
                  columns={columns} 
                  pagination={false} 
                  rowKey={(record) => `${record.variety}-${record.province}`}
                  size="small"
                />

                {data.marketInsights && data.marketInsights.length > 0 && (
                  <>
                    <Divider orientation="left">Nhận định thị trường</Divider>
                    <List
                      dataSource={data.marketInsights}
                      renderItem={(item) => (
                        <List.Item>
                          <Text>• {item}</Text>
                        </List.Item>
                      )}
                    />
                  </>
                )}
                
                <div className="mt-4 text-right">
                  <Text type="secondary" italic>Cập nhật lần cuối: {new Date(data.lastUpdated).toLocaleString('vi-VN')}</Text>
                  {data.sourceUrl && (
                    <div>
                      <Text type="secondary">Nguồn: <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer">{data.sourceUrl}</a></Text>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Alert message="Chưa có dữ liệu phân tích. Vui lòng nhấn 'Cập nhật phân tích'." type="info" showIcon />
            )}
          </Card>

          <Card title="Hỏi đáp AI về thị trường lúa gạo" className="mb-4 shadow-md">
            <Space.Compact style={{ width: '100%' }}>
              <Input 
                placeholder="Đặt câu hỏi về giá lúa, xu hướng thị trường..." 
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onPressEnter={handleAsk}
              />
              <Button type="primary" icon={<SendOutlined />} onClick={handleAsk} loading={answering}>Hỏi</Button>
            </Space.Compact>
            
            {answer && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <Paragraph>{answer.answer}</Paragraph>
                {answer.sources && answer.sources.length > 0 && (
                  <div className="mt-2">
                    <Text strong>Nguồn tham khảo:</Text>
                    <ul className="list-disc pl-5 mt-1">
                      {answer.sources.map((source: any, index: number) => (
                        <li key={index}>
                          <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {source.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
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
