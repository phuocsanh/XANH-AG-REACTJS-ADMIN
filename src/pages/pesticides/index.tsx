import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Button, Card, Space, Typography, Spin, Alert, Row, Col, List, Tag, Modal, Checkbox, Select, message } from 'antd';
import { PrinterOutlined, EnvironmentOutlined, AimOutlined, ReloadOutlined, SyncOutlined } from '@ant-design/icons';
import ComboBox from '@/components/common/combo-box';
import { useAiService } from '@/hooks/use-ai-service';
import { useProductsQuery } from '@/queries/product';
import { Product } from '@/models/product.model';
import { weatherService, WeatherData, SimplifiedWeatherData } from '@/lib/weather-service';
import { frontendAiService } from '@/lib/ai-service';
import { VIETNAM_LOCATIONS, DEFAULT_LOCATION, Location } from '@/constants/locations';
import LocationMap from '@/components/LocationMap';

const { Title, Text } = Typography;

/**
 * Trang chính cho chức năng pesticides
 */
const PesticidesPage: React.FC = () => {
  interface Recommendation {
    time: string;
    temperature: string;
    rain_prob: string;
    wind_speed: string;
    condition: string;
    reason: string;
  }

  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [mixResult, setMixResult] = useState('');
  const [sortResult, setSortResult] = useState('');
  const [weatherForecast, setWeatherForecast] = useState<WeatherData[]>([]);
  const [sprayingRecommendations, setSprayingRecommendations] = useState<Recommendation[]>([]);
  console.log("🚀 ~ PesticidesPage ~ sprayingRecommendations:", sprayingRecommendations)
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Location state
  const [selectedLocation, setSelectedLocation] = useState<Location>(DEFAULT_LOCATION);
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  
  // Print states
  const [isPrintModalVisible, setIsPrintModalVisible] = useState(false);
  const [printSections, setPrintSections] = useState({
    mix: true,
    sort: true,
    spray: true
  });
  const printContentRef = useRef<HTMLDivElement>(null);
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
    
    return `Phân tích khả năng phối trộn các loại thuốc sau. Trả lời NGẮN GỌN:
- Kết luận: CÓ/KHÔNG
- Lý do: (1 câu ngắn)

Danh sách thuốc:
${productInfo}`;
  };

  /**
   * Tạo prompt cho phân tích sắp xếp
   */
  const createSortPrompt = (products: Product[]): string => {
    const productInfo = products.map((product: Product) => 
      `- ${product.name}: ${product.ingredient?.join(', ') || 'Không có thông tin thành phần'}`
    ).join('\n');
    
    return `Sắp xếp thứ tự sử dụng các loại thuốc sau để đạt hiệu quả tốt nhất. Trả lời NGẮN GỌN:
- Liệt kê tên thuốc theo thứ tự (dùng số thứ tự: 1, 2, 3...)
- Lý do ngắn gọn (1 câu cho mỗi thuốc)

Danh sách thuốc:
${productInfo}`;
  };

  /**
   * Tạo prompt cho phân tích thời điểm phun thuốc
   */
  const createSprayingPrompt = (forecastData: SimplifiedWeatherData[]): string => {
    const forecastInfo = forecastData.map(item => 
      `- Thời gian: ${item.time}, Nhiệt độ: ${item.temperature}°C, Trời: ${item.description}, Khả năng mưa: ${item.precipitation_probability}%, Lượng mưa: ${item.rain_amount}mm, Gió: ${item.wind_speed}m/s, Độ ẩm: ${item.humidity}%`
    ).join('\n');
    
    return `Dựa trên dữ liệu dự báo thời tiết đã lọc (chỉ bao gồm các giờ từ 07:00 đến 22:00), hãy phân tích và tìm ra các thời điểm phun thuốc tốt nhất.
    
    DỮ LIỆU DỰ BÁO THỜI TIẾT:
    ${forecastInfo}
    
    YÊU CẦU QUAN TRỌNG VỀ CHỌN KHUNG GIỜ:
    1. Với MỖI NGÀY có trong dữ liệu, hãy chọn ra 3 mốc thời gian đại diện cho 3 buổi:
       - Buổi Sáng (07:00 - 11:59): Chọn 1 mốc tốt nhất, ưu tiên từ 08:00 đến 10:00.
       - Buổi Trưa/Chiều (12:00 - 16:59): Chọn 1 mốc tốt nhất, ưu tiên từ 15:00 đến 16:59.
       - Buổi Tối (17:00 - 22:00): Chọn 1 mốc tốt nhất, ưu tiên từ 17:00 đến 19:00.
    
    2. QUAN TRỌNG - Thứ tự ưu tiên khi chọn (từ cao đến thấp):
       a) Khả năng mưa THẤP NHẤT (< 20% là tốt, < 10% là rất tốt, 0% là hoàn hảo)
       b) Nhiệt độ phù hợp (20-32°C)
       c) Gió nhẹ (< 10m/s)
    
    3. Khi so sánh các mốc trong cùng khung giờ:
       - Luôn chọn mốc có khả năng mưa THẤP HƠN, ngay cả khi gió hơi mạnh hơn
       - VÍ DỤ: Nếu có 2 mốc: A (mưa 5%, gió 10m/s) và B (mưa 22%, gió 3m/s), hãy chọn A
    
    4. Nếu một buổi có nhiều mốc cùng khả năng mưa thấp, hãy chọn mốc có gió nhẹ nhất.
    
    5. Chỉ bỏ qua một buổi nếu TẤT CẢ các mốc đều có mưa > 40%.
    
    YÊU CẦU VỀ ĐỊNH DẠNG OUTPUT:
    - Trả về kết quả dưới dạng JSON array (tuyệt đối không thêm markdown, không thêm text dẫn dắt).
    - Sắp xếp kết quả theo thời gian tăng dần.
    - Cấu trúc JSON:
    [
      {
        "time": "HH:mm dd/MM/yyyy",
        "temperature": "25°C",
        "rain_prob": "10%",
        "wind_speed": "3.5m/s",
        "condition": "Mô tả ngắn gọn (VD: Trời mát, ít mây)",
        "reason": "Lý do ngắn gọn trong 1 câu (VD: Điều kiện lý tưởng cho phun thuốc)"
      }
    ]`;

  };

  /**
   * Lấy dữ liệu dự báo thời tiết
   * @param forceRefresh Nếu true, sẽ bỏ qua cache và lấy dữ liệu mới
   */
  const fetchWeatherForecast = async (forceRefresh = false) => {
    // Kiểm tra cache - mỗi location có cache riêng
    const CACHE_KEY = `weather_forecast_cache_v8_${selectedLocation.id}`;
    
    if (!forceRefresh) {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        try {
          const { timestamp, forecast, recommendations } = JSON.parse(cachedData);
          // Cache valid for 30 minutes
          if (Date.now() - timestamp < 30 * 60 * 1000) {
            setWeatherForecast(forecast);
            if (recommendations && recommendations.length > 0) {
              setSprayingRecommendations(recommendations);
            }
            return;
          }
        } catch (e) {
          console.error('Lỗi đọc cache:', e);
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } else {
      // Nếu force refresh, xóa kết quả phân tích cũ để người dùng biết đang tải lại
      setSprayingRecommendations([]);
    }

    setIsWeatherLoading(true);
    
    try {
      // Lấy dữ liệu từ API
      const forecastData = await weatherService.getForecast(selectedLocation.latitude, selectedLocation.longitude);
      const filteredData = weatherService.filterNextTwoDays(forecastData);
      
      // Lọc bỏ các giờ không phun thuốc (từ 23h đêm đến 6h sáng)
      // Chỉ giữ lại từ 7h sáng đến 22h đêm
      const daytimeData = filteredData.filter(item => {
        const date = new Date(item.dt * 1000);
        const hour = date.getHours();
        return hour >= 7 && hour <= 22;
      });
      
      setWeatherForecast(daytimeData);
      
      // Chuẩn bị dữ liệu cho AI
      const simplifiedData = weatherService.simplifyWeatherData(daytimeData);
      
      let recommendations: Recommendation[] = [];
      // Phân tích thời điểm phun thuốc với AI
      if (simplifiedData.length > 0) {
        const prompt = createSprayingPrompt(simplifiedData);
        const aiResponse = await frontendAiService.analyzeSprayingTime(prompt);
        
        if (aiResponse.success && aiResponse.answer) {
          try {
            // Clean markdown code blocks if present
            const cleanJson = aiResponse.answer.replace(/```json/g, '').replace(/```/g, '').trim();
            recommendations = JSON.parse(cleanJson);
            if (Array.isArray(recommendations)) {
              setSprayingRecommendations(recommendations);
            } else {
              // Fallback if not array
              setSprayingRecommendations([]);
            }
          } catch (parseError) {
            console.error('Error parsing AI response:', parseError);
            // Fallback for parsing error
            setSprayingRecommendations([]);
          }
        } else {
          console.error(aiResponse.error || 'Không thể phân tích thời điểm phun thuốc');
        }
      }

      // Lưu vào cache
      try {
        const cacheData = {
          timestamp: Date.now(),
          forecast: daytimeData,
          recommendations: recommendations
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      } catch (e) {
        console.error('Lỗi lưu cache:', e);
      }

    } catch (err) {
      const errorMessage = (err as Error).message || 'Có lỗi khi lấy dữ liệu thời tiết';
      console.error(errorMessage);
      message.error('Không thể lấy dữ liệu thời tiết mới nhất');
    } finally {
      setIsWeatherLoading(false);
    }
  };

  /**
   * Chỉ chạy lại phân tích AI cho thời điểm phun thuốc (không gọi lại API thời tiết)
   */
  const handleReanalyzeSpraying = async () => {
    if (weatherForecast.length === 0) {
      message.warning('Chưa có dữ liệu thời tiết để phân tích');
      return;
    }

    const hide = message.loading('Đang phân tích lại...', 0);
    
    try {
      const simplifiedData = weatherService.simplifyWeatherData(weatherForecast);
      const prompt = createSprayingPrompt(simplifiedData);
      const aiResponse = await frontendAiService.analyzeSprayingTime(prompt);
      
      if (aiResponse.success && aiResponse.answer) {
        const cleanJson = aiResponse.answer.replace(/```json/g, '').replace(/```/g, '').trim();
        const recommendations = JSON.parse(cleanJson);
        
        if (Array.isArray(recommendations)) {
          setSprayingRecommendations(recommendations);
          message.success('Đã cập nhật kết quả phân tích');
          
          // Cập nhật cache với recommendations mới
          const CACHE_KEY = `weather_forecast_cache_v8_${selectedLocation.id}`;
          const cachedData = localStorage.getItem(CACHE_KEY);
          if (cachedData) {
            const parsedCache = JSON.parse(cachedData);
            parsedCache.recommendations = recommendations;
            localStorage.setItem(CACHE_KEY, JSON.stringify(parsedCache));
          }
        }
      } else {
        message.error('Lỗi khi phân tích lại');
      }
    } catch (error) {
      console.error('Lỗi phân tích lại:', error);
      message.error('Có lỗi xảy ra khi phân tích lại');
    } finally {
      hide();
    }
  };

  // Tự động lấy dữ liệu thời tiết khi vào trang hoặc khi đổi location
  useEffect(() => {
    fetchWeatherForecast();
  }, [selectedLocation]);

  /**
   * Tính khoảng cách giữa 2 điểm tọa độ (Haversine formula)
   */
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Bán kính trái đất (km)
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c;
  };

  /**
   * Lấy tên địa điểm chi tiết từ tọa độ (Reverse Geocoding)
   */
  const getPlaceName = async (lat: number, lon: number): Promise<string> => {
    try {
      // Sử dụng Nominatim API của OpenStreetMap (Miễn phí)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=vi`
      );
      const data = await response.json();
      
      if (data.address) {
        const addr = data.address;
        // Ưu tiên lấy các thành phần địa chỉ chi tiết
        const parts = [];
        
        if (addr.road) parts.push(addr.road);
        if (addr.suburb) parts.push(addr.suburb); // Phường
        else if (addr.village) parts.push(addr.village); // Xã
        else if (addr.town) parts.push(addr.town); // Thị trấn
        
        if (addr.city_district) parts.push(addr.city_district); // Quận
        else if (addr.county) parts.push(addr.county); // Huyện
        
        if (addr.city) parts.push(addr.city); // Thành phố
        else if (addr.state) parts.push(addr.state); // Tỉnh
        
        return parts.join(', ');
      }
      return 'Vị trí không xác định';
    } catch (error) {
      console.error('Lỗi lấy tên địa điểm:', error);
      return 'Vị trí hiện tại';
    }
  };

  /**
   * Phát hiện vị trí hiện tại của người dùng
   */
  const detectUserLocation = () => {
    if (!navigator.geolocation) {
      message.error('Trình duyệt của bạn không hỗ trợ định vị.');
      return;
    }

    const hide = message.loading('Đang xác định vị trí chi tiết...', 0);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Lấy tên địa điểm chi tiết
          const detailedName = await getPlaceName(latitude, longitude);
          
          // Tạo location mới với thông tin chi tiết
          const newLocation: Location = {
            id: 'current-user-location',
            name: detailedName,
            latitude: latitude,
            longitude: longitude,
            region: '📍 Vị trí của bạn'
          };

          setSelectedLocation(newLocation);
          hide();
          message.success(`Đã cập nhật: ${detailedName}`);
        } catch (error) {
          hide();
          message.error('Không thể lấy tên địa điểm chi tiết.');
          
          // Fallback: Tìm địa điểm gần nhất trong danh sách có sẵn
          let nearestLocation = VIETNAM_LOCATIONS[0];
          let minDistance = Infinity;
          
          VIETNAM_LOCATIONS.forEach(loc => {
            const distance = calculateDistance(latitude, longitude, loc.latitude, loc.longitude);
            if (distance < minDistance) {
              minDistance = distance;
              nearestLocation = loc;
            }
          });
          
          setSelectedLocation(nearestLocation);
        }
      },
      (error) => {
        hide();
        console.error('Lỗi định vị:', error);
        message.error('Không thể lấy vị trí. Vui lòng kiểm tra quyền truy cập.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Tự động định vị khi vào trang
  useEffect(() => {
    detectUserLocation();
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

  /**
   * Xử lý mở modal xem trước in
   */
  const handlePrint = () => {
    setIsPrintModalVisible(true);
  };

  /**
   * Xử lý in thực sự
   */
  const handlePrintConfirm = () => {
    window.print();
  };

  /**
   * Xử lý thay đổi checkbox chọn phần in
   */
  const handlePrintSectionChange = (section: 'mix' | 'sort' | 'spray') => {
    setPrintSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="w-full overflow-x-hidden lg:p-4 ">
      <Title level={2} className="!text-xl md:!text-3xl !mb-4 break-words">Tư vấn Phối trộn & Sắp xếp Thuốc Bảo vệ Thực vật</Title>
      
      <Card title="Chọn sản phẩm để phân tích" className="mb-3 md:mb-6" bodyStyle={{ padding: '16px'}}>
        <Space direction="vertical" className="w-full">
          {/* Location Display & Map Trigger */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <Text type="secondary" className="block text-xs mb-1">Vị trí dự báo thời tiết đang chọn:</Text>
              <div className="flex items-center gap-2">
                <Button 
                  type="text" 
                  icon={<AimOutlined />} 
                  title="Lấy vị trí hiện tại của tôi"
                  onClick={detectUserLocation}
                  className="!p-0 flex items-center justify-center text-blue-500 hover:text-blue-700"
                />
                <EnvironmentOutlined className="text-blue-600 text-lg" />
                <Text strong className="text-lg text-blue-800">
                  {selectedLocation.name}
                </Text>
                <Tag color="blue">{selectedLocation.region}</Tag>
              </div>
            </div>
            <Button 
              type="primary" 
              ghost
              icon={<EnvironmentOutlined />}
              onClick={() => setIsMapModalVisible(true)}
              className="w-full sm:w-auto"
            >
              Chọn vị trí khác trên bản đồ
            </Button>
          </div>

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
            <Card size="small" title="Sản phẩm đã chọn" bodyStyle={{ padding: '8px' }}>
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
            
            <Button 
              icon={<PrinterOutlined />}
              onClick={handlePrint}
              disabled={!mixResult && !sortResult && sprayingRecommendations.length === 0}
            >
              In kết quả
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

      <Row gutter={[16, 16]} className="!mx-0">
        <Col xs={24} md={12}>
          <Card 
            title="Kết quả Phân tích Phối trộn" 
            loading={isAnalyzing && !mixResult}
            className="scrollable-result-card"
            bodyStyle={{ padding: '8px 12px' }}
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
            title="Sắp xếp thứ tự pha thuốc" 
            loading={isAnalyzing && !sortResult}
            className="scrollable-result-card"
            bodyStyle={{ padding: '8px 12px' }}
          >
            {sortResult ? (
              <div className="scrollable-result-content">
                {sortResult.split('\n').filter(line => line.trim()).map((line, index) => (
                  <div key={index} className="mb-2">
                    <Text>
                      <Text strong className="text-blue-600"></Text>
                      {line.trim()}
                    </Text>
                  </div>
                ))}
              </div>
            ) : (
              <Text type="secondary">Chưa có kết quả sắp xếp</Text>
            )}
          </Card>
        </Col>
        
        {/* Weather Forecast Section */}
        <Col span={24}>
        
            {weatherForecast.length > 0 ? (
              <div>
                <Row gutter={16}>
                  
                  
                  <Col span={24} md={12} >
                    <Card 
                      size="small" 
                      title={`Thời điểm phun thuốc tốt nhất`} 
                      bodyStyle={{ padding: '8px' }}
                      
                    >
                      <div className="scrollable-result-content">
                        {sprayingRecommendations.length > 0 ? (
                          <List
                            dataSource={sprayingRecommendations}
                            renderItem={(item) => (
                              <List.Item className="!p-2 border-b last:border-b-0">
                                <div className="w-full">
                                  <div className="flex justify-between items-center mb-1">
                                    <Text strong className="text-blue-600">🕒 {item.time}</Text>
                                    <Text strong className="text-green-600">☔ Khả năng mưa: {item.rain_prob}</Text>
                                  </div>
                                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                    <span>🌡️ Nhiệt độ: {item.temperature}</span>
                                    <span>💨 Tốc độ gió: {item.wind_speed}</span>
                                    <span className="text-gray-600">🌤️ {item.condition}</span>
                                  </div>
                                </div>
                              </List.Item>
                            )}
                          />
                        ) : (
                          <div className="text-center py-8 text-gray-400">
                            {isWeatherLoading ? <Spin size="small" /> : 'Chưa có dữ liệu phân tích'}
                          </div>
                        )}
                      </div>
                    </Card>
                </Col>
                <Col span={24} md={12} className='mt-3 md:!mt-0' >
                    <Card 
                      size="small" 
                      title={`Dự báo thời tiết hôm nay và 2 ngày tới`} 
                      bodyStyle={{ padding: '8px' }}
                      extra={
                        <Button 
                          type="text" 
                          icon={<SyncOutlined spin={isWeatherLoading} />} 
                          size="small" 
                          onClick={() => fetchWeatherForecast(true)}
                          title="Lấy dữ liệu mới nhất"
                        />
                      }
                    >
                      <div className="scrollable-result-content">
                        <List
                          dataSource={weatherForecast}
                          renderItem={(item, index) => (
                            <List.Item key={index} className="!p-2 border-b last:border-b-0">
                              <div className="w-full">
                                <div className="flex justify-between items-center mb-1">
                                  <Text strong className="text-blue-600">🕒 {formatTime(item.dt)}</Text>
                                  <Text strong className="text-green-600">☔ Khả năng mưa: {Math.round(item.pop * 100)}%</Text>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                  <span>🌡️ Nhiệt độ: {item.main.temp}°C</span>
                                  <span>💨 Tốc độ gió: {item.wind.speed}m/s</span>
                                  <span className="text-gray-600">🌤️ {item.weather[0]?.description}</span>
                                </div>
                                {item.rain && (item.rain['1h'] || 0) > 0 && (
                                  <div className="text-xs text-orange-600 mt-1">
                                    🌧️ Lượng mưa: {item.rain['1h']}mm
                                  </div>
                                )}
                              </div>
                            </List.Item>
                          )}
                        />
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
        </Col>
      </Row>

      {/* Print Preview Modal */}
      <Modal
        title="Xem trước và In"
        open={isPrintModalVisible}
        onCancel={() => setIsPrintModalVisible(false)}
        width={900}
        footer={[
          <Button key="cancel" onClick={() => setIsPrintModalVisible(false)}>
            Đóng
          </Button>,
          <Button 
            key="print" 
            type="primary" 
            icon={<PrinterOutlined />}
            onClick={handlePrintConfirm}
            disabled={!printSections.mix && !printSections.sort && !printSections.spray}
          >
            In
          </Button>
        ]}
      >
        <div className="mb-4">
          <Text strong>Chọn nội dung cần in:</Text>
          <div className="mt-2 space-y-2">
            <div>
              <Checkbox 
                checked={printSections.mix}
                onChange={() => handlePrintSectionChange('mix')}
                disabled={!mixResult}
              >
                Kết quả Phân tích Phối trộn
              </Checkbox>
            </div>
            <div>
              <Checkbox 
                checked={printSections.sort}
                onChange={() => handlePrintSectionChange('sort')}
                disabled={!sortResult}
              >
                Kết quả Sắp xếp
              </Checkbox>
            </div>
            <div>
              <Checkbox 
                checked={printSections.spray}
                onChange={() => handlePrintSectionChange('spray')}
                disabled={sprayingRecommendations.length === 0}
              >
                Thời điểm phun thuốc tốt nhất
              </Checkbox>
            </div>
          </div>
        </div>

        {/* Print Preview Content */}
        <div 
          ref={printContentRef}
          className="print-preview-container"
          style={{ 
            border: '1px solid #d9d9d9', 
            padding: '20px',
            maxHeight: '600px',
            overflowY: 'auto',
            backgroundColor: '#fff'
          }}
        >
          <div className="print-content">
            <div className="print-header">
              <Title level={3} style={{ textAlign: 'center', marginBottom: '20px' }}>
                BÁO CÁO TƯ VẤN PHỐI TRỘN & SẮP XẾP THUỐC BẢO VỆ THỰC VẬT
              </Title>
              <Text style={{ display: 'block', textAlign: 'center', marginBottom: '5px' }}>
                Ngày in: {new Date().toLocaleDateString('vi-VN')}
              </Text>
              <Text style={{ display: 'block', textAlign: 'center', marginBottom: '10px' }}>
                <EnvironmentOutlined /> Vị trí: {selectedLocation.name}
              </Text>
              
              {selectedProducts.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <Text strong>Danh sách sản phẩm đã chọn:</Text>
                  <ul style={{ marginTop: '8px' }}>
                    {selectedProducts.map((product: Product) => (
                      <li key={product.id}>
                        <Text>{product.name}</Text>
                        {product.ingredient && product.ingredient.length > 0 && (
                          <Text type="secondary"> - {product.ingredient.join(', ')}</Text>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {printSections.mix && mixResult && (
              <div className="print-section" style={{ marginBottom: '30px' }}>
                <Title level={4}>Kết quả Phân tích Phối trộn</Title>
                <div 
                  style={{ 
                    padding: '15px', 
                    border: '1px solid #e8e8e8',
                    borderRadius: '4px',
                    backgroundColor: '#fafafa'
                  }}
                  dangerouslySetInnerHTML={{ 
                    __html: mixResult
                      .replace(/\n\n/g, '</p><p>')
                      .replace(/\n/g, '<br>')
                      .replace(/^(<br>)+|(<br>)+$/g, '')
                      .replace(/^|$/, '<p>')
                      .replace(/<p><\/p>/g, '')
                  }} 
                />
              </div>
            )}

            {printSections.sort && sortResult && (
              <div className="print-section" style={{ marginBottom: '30px' }}>
                <Title level={4}>Sắp xếp thứ tự pha thuốc</Title>
                <div 
                  style={{ 
                    padding: '15px', 
                    border: '1px solid #e8e8e8',
                    borderRadius: '4px',
                    backgroundColor: '#fafafa'
                  }}
                >
                  {sortResult.split('\n').filter(line => line.trim()).map((line, index) => (
                    <div key={index} style={{ marginBottom: '8px' }}>
                      <Text>
                        {line.trim()}
                      </Text>
                    </div>
                  ))}
                  <Text>Lưu ý: Pha riêng từng thuốc vào thùng nhỏ khoáy tan đều mới đổ vào bình lớn</Text>
                </div>
              </div>
            )}

            {printSections.spray && sprayingRecommendations.length > 0 && (
              <div className="print-section" style={{ marginBottom: '30px' }}>
                <Title level={4}>Thời điểm phun thuốc tốt nhất</Title>
                <div 
                  style={{ 
                    marginTop: '15px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px'
                  }}
                >
                  {sprayingRecommendations.map((item, index) => (
                    <div 
                      key={index}
                      style={{ 
                        padding: '10px 12px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <Text strong style={{ fontSize: '15px' }}>
                          ⏰ {item.time}
                        </Text>
                        <Text strong style={{ color: '#52c41a' }}>
                          ☔ Khả năng mưa: {item.rain_prob}
                        </Text>
                      </div>
                      <div style={{ display: 'flex', gap: '15px', fontSize: '13px', flexWrap: 'wrap' }}>
                        <span>🌡 Nhiệt độ: {item.temperature}</span>
                        <span>💨 Tốc độ gió: {item.wind_speed}</span>
                        <span style={{ color: '#666' }}>☁ {item.condition}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Map Selection Modal */}
      <Modal
        title="Chọn vị trí trên bản đồ"
        open={isMapModalVisible}
        onCancel={() => setIsMapModalVisible(false)}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => setIsMapModalVisible(false)}>
            Đóng
          </Button>
        ]}
      >
        <div className="mb-4">
          <Alert 
            message="Hướng dẫn" 
            description="Click vào bản đồ hoặc các điểm đánh dấu để chọn vị trí dự báo thời tiết."
            type="info" 
            showIcon 
            className="mb-3"
          />
          <Suspense fallback={<div className="h-[400px] flex items-center justify-center bg-gray-100 rounded"><Spin tip="Đang tải bản đồ..." /></div>}>
            <LocationMap 
              selectedLocation={selectedLocation}
              onLocationSelect={(location) => {
                setSelectedLocation(location);
                setIsMapModalVisible(false);
              }}
            />
          </Suspense>
        </div>
      </Modal>

      <style>{`
        .scrollable-result-card {
          height: 100%;
        }
        
        .scrollable-result-content {
          max-height: 500px;
          overflow-y: auto;
          border: 1px solid #f0f0f0;
          border-radius: 4px;
        }

        @media (min-width: 768px) {
          .scrollable-result-content {
            padding: 16px;
          }
        }

        .weather-timeline-scroll {
          max-height: 500px;
          overflow-y: auto;
        }

        @media (min-width: 768px) {
          .weather-timeline-scroll {
            padding: 10px;
          }
        }

        /* Print Styles */
        @media print {
          /* Hide everything except print content */
          body * {
            visibility: hidden;
          }
          
          .print-content,
          .print-content * {
            visibility: visible;
          }
          
          .print-content {
            position: absolute;
            left: 50%;
            top: 0;
            width: 110%;
            padding: 3mm;
            transform: translateX(-50%) scale(0.95);
            transform-origin: top center;
          }

          /* A4 page setup - margin tối thiểu */
          @page {
            size: A4;
            margin: 3mm;
          }

          /* FORCE: Tắt tất cả page breaks tự động */
          * {
            page-break-before: auto !important;
            page-break-after: auto !important;
            page-break-inside: auto !important;
            orphans: 1 !important;
            widows: 1 !important;
          }

          /* Cho phép sections tự nhiên flow qua trang */
          .print-section {
            margin-bottom: 6px !important;
            page-break-before: avoid !important;
            page-break-after: avoid !important;
          }

          .print-header {
            page-break-after: avoid !important;
            margin-bottom: 6px !important;
            padding-bottom: 3px !important;
          }

          /* Remove borders and backgrounds for cleaner print */
          .print-preview-container {
            border: none !important;
            box-shadow: none !important;
            max-height: none !important;
            overflow: visible !important;
          }

          /* Adjust font sizes for print */
          body {
            font-size: 9pt;
            line-height: 1.2;
          }

          h3 {
            font-size: 12pt;
            margin-bottom: 4pt;
            margin-top: 0;
            page-break-after: avoid !important;
          }

          h4 {
            font-size: 10pt;
            margin-top: 5pt;
            margin-bottom: 3pt;
            page-break-after: avoid !important;
          }

          /* Giảm padding của các box tối đa */
          .print-section > div {
            padding: 4px 6px !important;
            margin-bottom: 3px !important;
          }

          /* Dùng grid 2 cột cho danh sách thời điểm phun thuốc (giống modal) */
          .print-section:last-child > div:last-child {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }

          /* Chỉ tránh cắt đôi từng item nhỏ */
          .print-section:last-child > div:last-child > div {
            break-inside: avoid;
            padding: 4px 6px !important;
            font-size: 14pt !important;
          }

          /* Giảm kích thước text trong items */
          .print-section:last-child > div:last-child > div * {
            font-size: 14pt !important;
          }

          /* Ensure colors print correctly */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PesticidesPage;