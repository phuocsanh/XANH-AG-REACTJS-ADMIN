import React, { useState, useEffect } from 'react';
import { Button, Card, Space, Typography, Spin, Alert, Row, Col, List, Tag, Timeline } from 'antd';
import ComboBox from '@/components/common/combo-box';
import { useAiService } from '@/hooks/use-ai-service';
import { useProductsQuery } from '@/queries/product';
import { Product } from '@/models/product.model';
import { weatherService, WeatherData, SimplifiedWeatherData } from '@/lib/weather-service';
import { frontendAiService } from '@/lib/ai-service';

const { Title, Text } = Typography;

/**
 * Trang chính cho chức năng pesticides
 */
const PesticidesPage: React.FC = () => {
  interface Recommendation {
    time: string;
    temperature: string;
    rain_prob: string;
    condition: string;
    reason: string;
  }

  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [mixResult, setMixResult] = useState('');
  const [sortResult, setSortResult] = useState('');
  const [weatherForecast, setWeatherForecast] = useState<WeatherData[]>([]);
  const [sprayingRecommendations, setSprayingRecommendations] = useState<Recommendation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mixPesticides, sortPesticides } = useAiService();
  const { data: productsData, isLoading: isLoadingProducts } = useProductsQuery({ limit: 100 });

  // Lấy thông tin chi tiết của các sản phẩm đã chọn
  const selectedProducts = (productsData?.data?.items || []).filter((product: Product) => 
    selectedProductIds.includes(product.id)
  );

  /**
   * Xử lý thay đổi selection của sản phẩm
   */
  const handleProductSelection = (value: number[]) => {
    setSelectedProductIds(value);
  };

  /**
   * Tạo prompt cho phân tích phối trộn
   */
  const createMixPrompt = (products: Product[]): string => {
    const productInfo = products.map((product: Product) => 
      `- ${product.name}: ${product.ingredient?.join(', ') || 'Không có thông tin thành phần'}`
    ).join('\n');
    
    return `Phân tích khả năng phối trộn các loại thuốc sau, chỉ trả lời có/không và lưu ý quan trọng:
    
${productInfo}`;
  };

  /**
   * Tạo prompt cho phân tích sắp xếp
   */
  const createSortPrompt = (products: Product[]): string => {
    const productInfo = products.map((product: Product) => 
      `- ${product.name}: ${product.ingredient?.join(', ') || 'Không có thông tin thành phần'}`
    ).join('\n');
    
    return `Sắp xếp thứ tự sử dụng các loại thuốc sau để đạt hiệu quả tốt nhất, chỉ trả về tên thuốc theo thứ tự:
    
${productInfo}`;
  };

  /**
   * Tạo prompt cho phân tích thời điểm phun thuốc
   */
  const createSprayingPrompt = (forecastData: SimplifiedWeatherData[]): string => {
    const forecastInfo = forecastData.map(item => 
      `- Thời gian: ${item.time}, Nhiệt độ: ${item.temperature}°C, Trời: ${item.description}, Khả năng mưa: ${item.precipitation_probability}%, Lượng mưa: ${item.rain_amount}mm, Gió: ${item.wind_speed}m/s, Độ ẩm: ${item.humidity}%`
    ).join('\n');
    
    return `Dựa trên dự báo thời tiết sau, hãy phân tích và đưa ra danh sách tối đa 9 khoảng thời gian phù hợp để phun thuốc bảo vệ thực vật. 
    Điều kiện: Khoảng thời gian không có mưa ít nhất 1,5 tiếng. Mỗi ngày tối đa 3 khoảng thời gian, nếu ngày nào không có thì bỏ qua.
    
    DỮ LIỆU DỰ BÁO THỜI TIẾT:
    ${forecastInfo}
    
    Yêu cầu:
    1. Chỉ chọn thời điểm không có mưa hoặc có khả năng mưa thấp (<30%)
    2. Ưu tiên thời điểm có nhiệt độ từ 20-30°C
    3. Tránh thời điểm gió quá mạnh (trên 5m/s)
    4. Mỗi ngày tối đa 3 khung giờ
    5. Tổng cộng tối đa 9 khung giờ
    6. Trả về kết quả dưới dạng JSON array (không có markdown, không có text dẫn dắt), cấu trúc mỗi item:
    {
      "time": "HH:mm dd/MM/yyyy",
      "temperature": "25°C",
      "rain_prob": "Khả năng mưa (VD: 0%, 10%)",
      "condition": "Mô tả ngắn gọn điều kiện thời tiết",
      "reason": "Lý do chi tiết tại sao nên phun lúc này"
    }`;
  };

  /**
   * Lấy dữ liệu dự báo thời tiết
   */
  /**
   * Lấy dữ liệu dự báo thời tiết
   */
  const fetchWeatherForecast = async () => {
    // Kiểm tra cache
    const CACHE_KEY = 'weather_forecast_cache_v6';
    const CACHE_DURATION = 3600 * 1000; // 1 giờ
    
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const { timestamp, forecast, recommendations } = JSON.parse(cachedData);
        const now = Date.now();
        
        if (now - timestamp < CACHE_DURATION) {
          setWeatherForecast(forecast);
          setSprayingRecommendations(recommendations);
          return;
        }
      }
    } catch (e) {
      console.error('Lỗi đọc cache:', e);
    }

    setIsWeatherLoading(true);
    setError(null);
    
    try {
      const forecastData = await weatherService.getForecast();
      const filteredData = weatherService.filterNextTwoDays(forecastData);
      setWeatherForecast(filteredData);
      
      // Tóm tắt dữ liệu thời tiết cho AI phân tích
      const simplifiedData = weatherService.simplifyWeatherData(filteredData);
      
      let recommendations: Recommendation[] = [];
      // Phân tích thời điểm phun thuốc với AI
      if (simplifiedData.length > 0) {
        const prompt = createSprayingPrompt(simplifiedData);
        const aiResponse = await frontendAiService.mixPesticides(prompt);
        
        if (aiResponse.success && aiResponse.answer) {
          try {
            // Clean markdown code blocks if present
            const cleanJson = aiResponse.answer.replace(/```json/g, '').replace(/```/g, '').trim();
            recommendations = JSON.parse(cleanJson);
            if (Array.isArray(recommendations)) {
              setSprayingRecommendations(recommendations);
            } else {
              console.error('AI response is not an array:', recommendations);
              // Fallback if not array
              setSprayingRecommendations([]);
            }
          } catch (parseError) {
            console.error('Error parsing AI response:', parseError);
            // Fallback for parsing error
            setSprayingRecommendations([]);
          }
        } else {
          setError(aiResponse.error || 'Không thể phân tích thời điểm phun thuốc');
        }
      }

      // Lưu vào cache
      try {
        const cacheData = {
          timestamp: Date.now(),
          forecast: filteredData,
          recommendations: recommendations
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      } catch (e) {
        console.error('Lỗi lưu cache:', e);
      }

    } catch (err) {
      const errorMessage = (err as Error).message || 'Có lỗi khi lấy dữ liệu thời tiết';
      setError(errorMessage);
    } finally {
      setIsWeatherLoading(false);
    }
  };

  // Tự động lấy dữ liệu thời tiết khi vào trang
  useEffect(() => {
    fetchWeatherForecast();
  }, []);

  /**
   * Xử lý phân tích cả hai chức năng - gọi tuần tự thay vì song song
   */
  const handleAnalyze = async () => {
    if (selectedProductIds.length === 0) {
      setError('Vui lòng chọn ít nhất một sản phẩm để phân tích');
      return;
    }

    if (selectedProducts.length === 0) {
      setError('Không tìm thấy thông tin sản phẩm đã chọn');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setMixResult('');
    setSortResult('');

    try {
      // Tạo prompts
      const mixPrompt = createMixPrompt(selectedProducts);
      const sortPrompt = createSortPrompt(selectedProducts);

      // Gọi song song cả hai API
      const [mixResponse, sortResponse] = await Promise.all([
        mixPesticides(mixPrompt),
        sortPesticides(sortPrompt)
      ]);

      // Xử lý kết quả phối trộn
      if (mixResponse.success && mixResponse.answer) {
        setMixResult(mixResponse.answer);
      } else {
        setError(prev => prev ? `${prev}; Lỗi phân tích phối trộn: ${mixResponse.error}` : `Lỗi phân tích phối trộn: ${mixResponse.error}`);
      }

      // Xử lý kết quả sắp xếp
      if (sortResponse.success && sortResponse.answer) {
        setSortResult(sortResponse.answer);
      } else {
        setError(prev => prev ? `${prev}; Lỗi phân tích sắp xếp: ${sortResponse.error}` : `Lỗi phân tích sắp xếp: ${sortResponse.error}`);
      }
    } catch (err) {
      const errorMessage = (err as Error).message || 'Có lỗi không xác định xảy ra.';
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Format thời gian hiển thị
   */
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString('vi-VN');
  };

  return (
    <>
      <Title level={2} className="!text-xl md:!text-3xl !mb-4 break-words">Tư vấn Phối trộn & Sắp xếp Thuốc Bảo vệ Thực vật</Title>
      
      <Card title="Chọn sản phẩm để phân tích" className="mb-6">
        <Space direction="vertical" className="w-full">
          <ComboBox
            mode="multiple"
            placeholder="Chọn các sản phẩm thuốc bảo vệ thực vật"
            value={selectedProductIds}
            onChange={handleProductSelection}
            options={(productsData?.data?.items || []).map((product: Product) => ({
              value: product.id,
              label: product.name
            }))}
            loading={isLoadingProducts}
            style={{ width: '100%' }}
          />
          
          {selectedProducts.length > 0 && (
            <Card size="small" title="Sản phẩm đã chọn">
              <List
                dataSource={selectedProducts}
                renderItem={(product: Product) => (
                  <List.Item>
                    <div>
                      <Text strong>{product.name}</Text>
                      <div>
                        {product.ingredient?.map((ing: string, index: number) => (
                          <Tag key={index} color="blue">{ing}</Tag>
                        ))}
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          )}
          
          <Space wrap className="w-full">
            <Button 
              type="primary" 
              onClick={handleAnalyze}
              disabled={isAnalyzing || selectedProductIds.length === 0}
              loading={isAnalyzing}
            >
              Phân tích Phối trộn & Sắp xếp
            </Button>
            

          </Space>
        </Space>
      </Card>

      {isAnalyzing && (
        <div className="text-center mb-6">
          <Spin size="large" />
          <Text className="block mt-2">Đang phân tích yêu cầu...</Text>
        </div>
      )}

      {isWeatherLoading && (
        <div className="text-center mb-6">
          <Spin size="large" />
          <Text className="block mt-2">Đang lấy dữ liệu thời tiết và phân tích...</Text>
        </div>
      )}

      {error && (
        <Alert
          message="Lỗi"
          description={error}
          type="error"
          showIcon
          className="mb-6"
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card 
            title="Kết quả Phân tích Phối trộn" 
            loading={isAnalyzing && !mixResult}
            className="scrollable-result-card"
          >
            {mixResult ? (
              <div 
                className="scrollable-result-content"
                dangerouslySetInnerHTML={{ 
                  __html: mixResult
                    .replace(/\n\n/g, '</p><p>')
                    .replace(/\n/g, '<br>')
                    .replace(/^(<br>)+|(<br>)+$/g, '')
                    .replace(/^|$/, '<p>')
                    .replace(/<p><\/p>/g, '')
                }} 
              />
            ) : (
              <Text type="secondary">Chưa có kết quả phân tích phối trộn</Text>
            )}
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card 
            title="Kết quả Phân tích Sắp xếp" 
            loading={isAnalyzing && !sortResult}
            className="scrollable-result-card"
          >
            {sortResult ? (
              <div 
                className="scrollable-result-content"
                dangerouslySetInnerHTML={{ 
                  __html: sortResult
                    .replace(/\n\n/g, '</p><p>')
                    .replace(/\n/g, '<br>')
                    .replace(/^(<br>)+|(<br>)+$/g, '')
                    .replace(/^|$/, '<p>')
                    .replace(/<p><\/p>/g, '')
                }} 
              />
            ) : (
              <Text type="secondary">Chưa có kết quả phân tích sắp xếp</Text>
            )}
          </Card>
        </Col>
        
        {/* Weather Forecast Section */}
        <Col span={24}>
          <Card 
            title="Dự báo Thời tiết & Phân tích Thời điểm Phun thuốc" 
            className="scrollable-result-card"
          >
            {weatherForecast.length > 0 ? (
              <div>
                <Row gutter={16}>
                  <Col span={24} md={12}>
                    <Card size="small" title="Dự báo thời tiết 2 ngày tới">
                      <div className="weather-timeline-scroll">
                        <Timeline>
                          {weatherForecast.map((item, index) => (
                            <Timeline.Item key={index}>
                              <Text strong>{formatTime(item.dt)}</Text>
                                <div>
                                <Text>🌡️ {item.main.temp}°C</Text>
                                <Text style={{ marginLeft: 8 }} className="whitespace-normal">
                                  ☔ {item.weather[0]?.description} ({Math.round(item.pop * 100)}%)
                                </Text>
                              </div>
                              {item.rain && item.rain['1h'] > 0 && (
                                <Text type="danger">🌧️ Lượng mưa: {item.rain['1h']}mm</Text>
                              )}
                            </Timeline.Item>
                          ))}
                        </Timeline>
                      </div>
                    </Card>
                  </Col>
                  
                  <Col span={24} md={12}>
                    <Card size="small" title="Thời điểm phun thuốc tốt nhất">
                      <div className="scrollable-result-content">
                        {sprayingRecommendations.length > 0 ? (
                          <List
                            itemLayout="vertical"
                            dataSource={sprayingRecommendations}
                            renderItem={(item) => (
                              <List.Item className="!p-3 !mb-3 border border-gray-100 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
                                <div className="flex flex-col gap-2">
                                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                    <Text strong className="text-green-700 text-lg">🕒 {item.time}</Text>
                                    <Space wrap>
                                      <Tag color="blue">{item.temperature}</Tag>
                                      <Tag color="cyan">☔ {item.rain_prob}</Tag>
                                    </Space>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Text type="secondary">🌤️ {item.condition}</Text>
                                  </div>
                                  <div className="bg-white p-2 rounded border border-green-100">
                                    <Text className="text-gray-600">💡 {item.reason}</Text>
                                  </div>
                                </div>
                              </List.Item>
                            )}
                          />
                        ) : (
                          <Text type="secondary">Chưa có phân tích thời điểm phun thuốc</Text>
                        )}
                      </div>
                    </Card>
                  </Col>
                </Row>
              </div>
            ) : (
              <Text type="secondary">
                Đang tải dữ liệu thời tiết...
              </Text>
            )}
          </Card>
        </Col>
      </Row>

      <style>{`
        .scrollable-result-card {
          height: 100%;
        }
        
        .scrollable-result-content {
          max-height: 500px;
          overflow-y: auto;
          padding: 16px;
          border: 1px solid #f0f0f0;
          border-radius: 4px;
        }

        .weather-timeline-scroll {
          max-height: 500px;
          overflow-y: auto;
          padding: 10px;
        }
      `}</style>
    </>
  );
};

export default PesticidesPage;