import React, { useState, useEffect } from 'react';
import { Card, Typography, Spin, Alert, Button, Tag, List, Row, Col, Tabs, Modal } from 'antd';
import { EnvironmentOutlined, AimOutlined, SyncOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { weatherService, WeatherData, DailyWeatherData } from '@/services/weather.service';
import { VIETNAM_LOCATIONS, DEFAULT_LOCATION, Location } from '@/constants/locations';
import LocationMap from '@/components/LocationMap';
import { message } from 'antd';
import { useAppStore } from '@/stores/store';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

/**
 * Trang dự báo thời tiết - Hiển thị dự báo theo giờ cho 7 ngày tới
 */
const WeatherForecastPage: React.FC = () => {
  // Lấy lastLocation từ store
  const lastLocation = useAppStore((state) => state.lastLocation);
  const setLastLocation = useAppStore((state) => state.setLastLocation);

  // State quản lý dữ liệu thời tiết
  const [weatherForecast, setWeatherForecast] = useState<WeatherData[]>([]);
  const [dailyForecast, setDailyForecast] = useState<DailyWeatherData[]>([]); // Daily summary từ API
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State quản lý vị trí - Khởi tạo từ lastLocation nếu có
  const [selectedLocation, setSelectedLocation] = useState<Location>(() => {
    if (lastLocation) {
      return {
        id: 'saved-location',
        name: lastLocation.name,
        latitude: lastLocation.latitude,
        longitude: lastLocation.longitude,
        region: lastLocation.region || '📍 Vị trí đã lưu'
      };
    }
    return DEFAULT_LOCATION;
  });
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);

  /**
   * Lấy dữ liệu dự báo thời tiết 7 ngày
   * Luôn lấy dữ liệu mới từ API, không cache
   */
  const fetchWeatherForecast = async (forceRefresh = false) => {
    setIsWeatherLoading(true);
    setError(null);
    
    try {
      // Lấy dữ liệu hourly và daily từ API
      const [forecastData, dailyData] = await Promise.all([
        weatherService.getForecast7Days(selectedLocation.latitude, selectedLocation.longitude),
        weatherService.getDailyForecast7Days(selectedLocation.latitude, selectedLocation.longitude)
      ]);
      
      setWeatherForecast(forecastData);
      setDailyForecast(dailyData);

    } catch (err) {
      const errorMessage = (err as Error).message || 'Có lỗi khi lấy dữ liệu thời tiết';
      console.error(errorMessage);
      setError(errorMessage);
      message.error('Không thể lấy dữ liệu thời tiết mới nhất');
    } finally {
      setIsWeatherLoading(false);
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
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=vi`
      );
      const data = await response.json();
      
      if (data.address) {
        const addr = data.address;
        const parts = [];
        
        if (addr.road) parts.push(addr.road);
        if (addr.suburb) parts.push(addr.suburb);
        else if (addr.village) parts.push(addr.village);
        else if (addr.town) parts.push(addr.town);
        
        if (addr.city_district) parts.push(addr.city_district);
        else if (addr.county) parts.push(addr.county);
        
        if (addr.city) parts.push(addr.city);
        else if (addr.state) parts.push(addr.state);
        
        return parts.join(', ');
      }
      return 'Vị trí không xác định';
    } catch (error) {
      console.error('Lỗi lấy tên địa điểm:', error);
      return 'Vị trí hiện tại';
    }
  };

  /**
   * Phát hiện vị trí hiện tại của người dùng bằng GPS
   */
  const detectUserLocation = async () => {
    if (!navigator.geolocation) {
      message.warning('Trình duyệt không hỗ trợ GPS. Vui lòng chọn vị trí trên bản đồ.', 3);
      setSelectedLocation(DEFAULT_LOCATION);
      return;
    }

    const hide = message.loading('Đang xác định vị trí GPS của bạn...', 0);
    let watchId: number | null = null;
    let hasGotPosition = false;

    // Hàm xử lý khi lấy được vị trí thành công
    const handleSuccess = async (position: GeolocationPosition) => {
      if (hasGotPosition) return;
      hasGotPosition = true;

      const { latitude, longitude } = position.coords;
      
      console.log('✅ Vị trí GPS:', { latitude, longitude, accuracy: position.coords.accuracy });
      
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      
      try {
        hide();
        const hide2 = message.loading('Đang lấy tên địa điểm...', 0);
        
        const detailedName = await getPlaceName(latitude, longitude);
        
        const newLocation: Location = {
          id: 'current-user-location',
          name: detailedName,
          latitude: latitude,
          longitude: longitude,
          region: '📍 Vị trí GPS'
        };

        setSelectedLocation(newLocation);
        // Lưu vị trí vào store để dùng lại sau
        setLastLocation({
          name: detailedName,
          latitude: latitude,
          longitude: longitude,
          region: '📍 Vị trí GPS',
          timestamp: Date.now()
        });
        hide2();
        message.success(`✅ Đã cập nhật vị trí: ${detailedName}`);
      } catch (error) {
        hide();
        console.error('Lỗi lấy tên địa điểm:', error);
        
        const newLocation: Location = {
          id: 'current-user-location',
          name: `Vị trí GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
          latitude: latitude,
          longitude: longitude,
          region: '📍 Vị trí GPS'
        };
        
        setSelectedLocation(newLocation);
        // Lưu vị trí vào store để dùng lại sau
        setLastLocation({
          name: `Vị trí GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
          latitude: latitude,
          longitude: longitude,
          region: '📍 Vị trí GPS',
          timestamp: Date.now()
        });
        message.success('✅ Đã cập nhật vị trí GPS');
      }
    };

    // Hàm xử lý lỗi
    const handleError = async (error: GeolocationPositionError) => {
      if (hasGotPosition) return;
      
      console.error('❌ Lỗi GPS:', error);
      
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      
      hide();
      let errorMessage = '';
      
      switch(error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Bạn đã từ chối quyền GPS. Vui lòng cấp quyền trong cài đặt trình duyệt.';
          message.error(errorMessage, 6);
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'GPS không khả dụng. ';
          errorMessage += `Đã chọn vị trí mặc định: ${DEFAULT_LOCATION.name}`;
          message.warning(errorMessage, 6);
          setSelectedLocation(DEFAULT_LOCATION);
          break;
        case error.TIMEOUT:
          errorMessage = 'GPS timeout. ';
          errorMessage += `Đã chọn vị trí mặc định: ${DEFAULT_LOCATION.name}`;
          message.warning(errorMessage, 6);
          setSelectedLocation(DEFAULT_LOCATION);
          break;
        default:
          errorMessage = `Lỗi không xác định. Đã chọn vị trí mặc định: ${DEFAULT_LOCATION.name}`;
          message.warning(errorMessage, 6);
          setSelectedLocation(DEFAULT_LOCATION);
      }
    };

    // Thử GPS với độ chính xác cao
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      async (error) => {
        console.log('⚠️ GPS lần 1 thất bại, đang thử lại...');
        
        // Nếu lỗi là POSITION_UNAVAILABLE, thử dùng watchPosition
        if (error.code === error.POSITION_UNAVAILABLE) {
          watchId = navigator.geolocation.watchPosition(
            handleSuccess,
            handleError,
            { 
              enableHighAccuracy: true,
              timeout: 20000,
              maximumAge: 60000
            }
          );
          
          // Timeout sau 20 giây
          setTimeout(async () => {
            if (!hasGotPosition && watchId !== null) {
              navigator.geolocation.clearWatch(watchId);
              await handleError({
                code: 3,
                message: 'Timeout',
                PERMISSION_DENIED: 1,
                POSITION_UNAVAILABLE: 2,
                TIMEOUT: 3
              } as GeolocationPositionError);
            }
          }, 20000);
        } else {
          await handleError(error);
        }
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  };

  // Không tự động lấy vị trí khi vào trang - để người dùng chủ động nhấn nút
  // useEffect(() => {
  //   detectUserLocation();
  // }, []);

  /**
   * Format thời gian hiển thị
   */
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString('vi-VN');
  };

  /**
   * Format ngày để làm key cho tab
   */
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString('vi-VN');
  };

  /**
   * Nhóm dữ liệu thời tiết theo ngày
   */
  const groupByDay = (data: WeatherData[]): Record<string, WeatherData[]> => {
    const grouped: Record<string, WeatherData[]> = {};
    
    data.forEach(item => {
      const date = formatDate(item.dt);
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(item);
    });
    
    return grouped;
  };

  /**
   * Lấy tên ngày (Hôm nay, Ngày mai, hoặc thứ trong tuần)
   */
  const getDayName = (dateString: string): string => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayStr = today.toLocaleDateString('vi-VN');
    const tomorrowStr = tomorrow.toLocaleDateString('vi-VN');
    
    if (dateString === todayStr) return 'Hôm nay';
    if (dateString === tomorrowStr) return 'Ngày mai';
    
    const date = new Date(dateString.split('/').reverse().join('-'));
    const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    return days[date.getDay()];
  };

  /**
   * Lọc dữ liệu thời tiết - Hiển thị tất cả giờ (bao gồm cả giờ đã qua)
   */
  const filterWeatherData = (data: WeatherData[], dateString: string): WeatherData[] => {
    // Hiển thị đầy đủ tất cả các giờ, kể cả giờ đã qua
    return data;
  };

  /**
   * Convert date từ DD/MM/YYYY sang YYYY-MM-DD
   */
  const convertDateToAPIFormat = (dateString: string): string => {
    const [day, month, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  /**
   * Lấy tóm tắt thời tiết từ Daily API
   * Dữ liệu này đã được API tính toán sẵn, chính xác hơn việc tự tính
   */
  const getDailySummaryFromAPI = (dateString: string) => {
    const apiDate = convertDateToAPIFormat(dateString);
    const dailyData = dailyForecast.find(d => d.date === apiDate);
    
    if (!dailyData) return null;
    
    // Tìm giờ có khả năng mưa cao nhất từ hourly data
    const groupedData = groupByDay(weatherForecast);
    const hourlyDataForDate = groupedData[dateString] || [];
    
    let maxPrecipTime = '';
    if (hourlyDataForDate.length > 0) {
      // Tìm item có pop cao nhất
      const maxPrecipItem = hourlyDataForDate.reduce((max, item) => 
        item.pop > max.pop ? item : max
      , hourlyDataForDate[0]);
      
      // Format giờ
      maxPrecipTime = new Date(maxPrecipItem.dt * 1000).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    return {
      tempMin: dailyData.tempMin,
      tempMax: dailyData.tempMax,
      maxPrecipitationProbability: dailyData.precipitationProbabilityMax,
      maxPrecipitationTime: maxPrecipTime, // Thêm giờ có mưa cao nhất
      totalRain: dailyData.precipitationSum.toString()
    };
  };

  /**
   * Tính toán tóm tắt thời tiết cho một ngày (DEPRECATED - dùng getDailySummaryFromAPI thay thế)
   * Chỉ tính từ giờ hiện tại trở đi cho "Hôm nay"
   */
  const getDailySummary = (data: WeatherData[], dateString: string) => {
    if (data.length === 0) return null;

    // Lọc dữ liệu: Nếu là hôm nay, chỉ lấy từ giờ hiện tại trở đi
    const today = new Date();
    const todayStr = today.toLocaleDateString('vi-VN');
    
    let filteredData = data;
    if (dateString === todayStr) {
      const currentTime = Math.floor(Date.now() / 1000); // Timestamp hiện tại (giây)
      filteredData = data.filter(item => item.dt >= currentTime);
    }

    // Nếu không còn dữ liệu sau khi lọc, return null
    if (filteredData.length === 0) return null;

    const temps = filteredData.map(item => item.main.temp);
    const pops = filteredData.map(item => item.pop * 100); // Chuyển sang %
    const rains = filteredData.map(item => item.rain?.['1h'] || 0);

    return {
      tempMin: Math.round(Math.min(...temps)),
      tempMax: Math.round(Math.max(...temps)),
      maxPrecipitationProbability: Math.round(Math.max(...pops)),
      totalRain: rains.reduce((sum, r) => sum + r, 0).toFixed(1)
    };
  };

  const groupedData = groupByDay(weatherForecast);
  const sortedDates = Object.keys(groupedData).sort((a, b) => {
    const dateA = new Date(a.split('/').reverse().join('-'));
    const dateB = new Date(b.split('/').reverse().join('-'));
    return dateA.getTime() - dateB.getTime();
  });

  // Tự động lấy vị trí GPS khi vào trang (chỉ nếu chưa có)
  useEffect(() => {
    if (!lastLocation) {
      // Chưa có vị trí → Gọi GPS
      console.log('📍 Lấy vị trí GPS mới...');
      detectUserLocation();
    } else {
      console.log('📍 Sử dụng vị trí đã lưu:', lastLocation.name);
    }
  }, []);

  return (
    <div className="w-full overflow-x-hidden lg:p-4">
      <Title level={2} className="!text-xl md:!text-3xl !mb-4 break-words">
        Dự báo Thời tiết 7 Ngày
      </Title>
      
      {/* Location Selection Card */}
      <Card className="mb-3 md:mb-6" bodyStyle={{ padding: '12px'}}>
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
          {/* Tên vị trí */}
          <div className="flex items-start gap-2 mb-3">
            <EnvironmentOutlined className="text-blue-600 text-lg flex-shrink-0 mt-1" />
            <div className="flex-1">
              <Text strong className="text-lg md:text-xl text-blue-800 block break-words">
                {selectedLocation.name}
              </Text>

            </div>
          </div>
          
          {/* Các nút action */}
          <div className="flex flex-wrap gap-2">
            <Button 
              type="default"
              size="small"
              icon={<AimOutlined />} 
              onClick={detectUserLocation}
              className="!h-8 flex-1 sm:flex-none"
            >
            </Button>
            <Button 
              type="primary" 
              size="small"
              ghost
              icon={<EnvironmentOutlined />}
              onClick={() => setIsMapModalVisible(true)}
              className="!h-8 flex-1 sm:flex-none"
            >
              <span className="hidden sm:inline">Chọn vị trí khác</span>
            </Button>
            <Button 
              type="default"
              size="small"
              icon={<SyncOutlined spin={isWeatherLoading} />} 
              onClick={() => fetchWeatherForecast(true)}
              className="!h-8 flex-1 sm:flex-none"
            >
              <span className="hidden sm:inline">Làm mới</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {isWeatherLoading && (
        <div className="text-center mb-6">
          <Spin size="large" />
          <Text className="block mt-2">Đang tải dữ liệu thời tiết...</Text>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Alert
          message="Lỗi"
          description={error}
          type="error"
          showIcon
          className="mb-6"
        />
      )}

      {/* Weather Forecast Tabs */}
      {!isWeatherLoading && weatherForecast.length > 0 && (
        <Card bodyStyle={{ padding: '12px' }}>
          <Tabs 
            defaultActiveKey="0" 
            type="card" 
            tabBarGutter={8}
          >
            {sortedDates.map((date, index) => (
              <TabPane 
                tab={
                  <span className="text-lg md:text-xxl font-medium px-2 font-weight-bold">
                    <ClockCircleOutlined className="mr-1" />
                    {`${getDayName(date)} (${date})`}
                  </span>
                } 
                key={index.toString()}
              >
                {/* Danh sách chi tiết theo giờ */}
                <div>
                  {/* Tóm tắt thời tiết của ngày */}
                  {(() => {
                    // Lấy summary từ Daily API thay vì tự tính
                    const summary = getDailySummaryFromAPI(date);
                    const filteredData = filterWeatherData(groupedData[date], date); // Vẫn cần để hiển thị số giờ
                    
                    if (!summary) return null;
                    
                    return (
                      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
                        <Text strong className="block text-lg md:text-xl mb-3 text-blue-900">
                          📊 Tóm tắt ngày {date}
                        </Text>
                        <Row gutter={[16, 12]}>
                          <Col xs={12} sm={6}>
                            <div className="flex flex-col">
                              <Text type="secondary" className="text-sm mb-1">🌡️ Nhiệt độ</Text>
                              <Text strong className="text-xl md:text-2xl text-orange-600">
                                {summary.tempMin}°C - {summary.tempMax}°C
                              </Text>
                            </div>
                          </Col>
                          <Col xs={12} sm={6}>
                            <div className="flex flex-col">
                              <Text type="secondary" className="text-sm mb-1">☔ Khả năng mưa</Text>
                              <Tag 
                                color={summary.maxPrecipitationProbability > 50 ? 'red' : summary.maxPrecipitationProbability > 20 ? 'orange' : 'green'}
                                className="text-lg md:text-xl font-semibold w-fit"
                              >
                                {summary.maxPrecipitationProbability}% (cao nhất)
                              </Tag>
                              {summary.maxPrecipitationTime && (
                                <Text type="secondary" className="text-sm mt-1" style={{ color: 'red', fontWeight: 'bold' }}>
                                  Lúc {summary.maxPrecipitationTime}
                                </Text>
                              )}
                            </div>
                          </Col>
                          <Col xs={12} sm={6}>
                            <div className="flex flex-col">
                              <Text type="secondary" className="text-sm mb-1">🌧️ Tổng lượng mưa</Text>
                              <Text strong className="text-xl md:text-2xl text-blue-600">
                                {summary.totalRain}mm
                              </Text>
                            </div>
                          </Col>
                          <Col xs={12} sm={6}>
                            <div className="flex flex-col">
                              <Text type="secondary" className="text-sm mb-1">📈 Số giờ dự báo</Text>
                              <Text strong className="text-xl md:text-2xl text-gray-700">
                                {filteredData.length} giờ
                              </Text>
                            </div>
                          </Col>
                        </Row>
                      </div>
                    );
                  })()}
                  
                  <List
                    dataSource={filterWeatherData(groupedData[date], date)}
                    renderItem={(item, index) => (
                      <List.Item className="!p-2 md:!p-3 !border-0">
                        <div 
                          className={`w-full bg-white rounded-lg p-3 md:p-4 shadow-sm hover:shadow-md transition-shadow border-2 ${
                            index % 2 === 0 ? 'border-blue-300' : 'border-green-300'
                          }`}
                        >
                          {/* Mobile Layout - 2 cột */}
                          <div className="block md:hidden">
                            <Row gutter={[12, 8]}>
                              {/* Cột trái: Giờ + Nhiệt độ */}
                              <Col span={12}>
                                <div className="flex flex-col gap-2">
                                  <div className="bg-blue-50 p-2 rounded h-[85px] flex flex-col justify-center">
                                    <Text type="secondary" className="text-base">⏰ Giờ</Text>
                                    <Text strong className="block text-blue-600 text-lg md:text-xl">
                                      {new Date(item.dt * 1000).toLocaleTimeString('vi-VN', { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </Text>
                                  </div>
                                  <div className="bg-orange-50 p-2 rounded h-[85px] flex flex-col justify-center">
                                    <Text type="secondary" className="text-base">🌡️ Nhiệt độ</Text>
                                    <Text className="block text-2xl md:text-3xl font-bold text-orange-600">
                                      {Math.round(item.main.temp)}°C
                                    </Text>
                                  </div>
                                </div>
                              </Col>
                              
                              {/* Cột phải: Mưa + Thời tiết */}
                              <Col span={12}>
                                <div className="flex flex-col gap-2">
                                  <div className="bg-green-50 p-2 rounded h-[85px] flex flex-col justify-center">
                                    <Text type="secondary" className="text-base">☔ Khả năng mưa</Text>
                                    <Tag 
                                      color={item.pop > 0.5 ? 'red' : item.pop > 0.2 ? 'orange' : 'green'} 
                                      className="text-lg md:text-xl font-semibold mt-1 block w-fit"
                                    >
                                      {Math.round(item.pop * 100)}%
                                    </Tag>
                                  </div>
                                  <div className="bg-cyan-50 p-2 rounded h-[85px] flex flex-col justify-center">
                                    <Text type="secondary" className="text-base">🌤️ Thời tiết</Text>
                                    <Text className="block text-base md:text-lg text-gray-700 font-medium">
                                      {item.weather[0]?.description}
                                    </Text>
                                  </div>
                                </div>
                              </Col>
                              
                              {/* Chi tiết - Full width */}
                              <Col span={24}>
                                <div className="pt-2 mt-2 border-t border-gray-200 bg-gray-50 -mx-3 -mb-3 px-3 pb-3 rounded-b-lg">
                                  <Row gutter={[8, 8]}>
                                    <Col span={12}>
                                      <div className="flex flex-col">
                                        <Text type="secondary" className="text-sm mb-1">💨 Tốc độ gió</Text>
                                        <Text className="text-sm md:text-base font-semibold text-gray-700">
                                          {item.wind.speed}m/s
                                        </Text>
                                      </div>
                                    </Col>
                                    <Col span={12}>
                                      <div className="flex flex-col">
                                        <Text type="secondary" className="text-sm mb-1">💧 Độ ẩm</Text>
                                        <Text className="text-sm md:text-base font-semibold text-gray-700">
                                          {item.main.humidity}%
                                        </Text>
                                      </div>
                                    </Col>
                                    {item.rain && item.rain['1h'] > 0 && (
                                      <Col span={24}>
                                        <div className="flex flex-col">
                                          <Text type="secondary" className="text-sm mb-1">🌧️ Lượng mưa</Text>
                                          <Text className="text-sm md:text-base font-semibold text-orange-600">
                                            {item.rain['1h']}mm
                                          </Text>
                                        </div>
                                      </Col>
                                    )}
                                  </Row>
                                </div>
                              </Col>
                            </Row>
                          </div>

                          {/* Desktop Layout - Như cũ */}
                          <div className="hidden md:block">
                            <Row gutter={[16, 12]} align="top">
                            {/* Giờ */}
                            <Col xs={12} sm={6} md={4}>
                              <div className="flex flex-col">
                                <Text type="secondary" className="text-xs mb-1">⏰ Giờ</Text>
                                <Text strong className="text-blue-600 text-base">
                                  {new Date(item.dt * 1000).toLocaleTimeString('vi-VN', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </Text>
                              </div>
                            </Col>
                            
                            {/* Nhiệt độ */}
                            <Col xs={12} sm={6} md={4}>
                              <div className="flex flex-col">
                                <Text type="secondary" className="text-xs mb-1">🌡️ Nhiệt độ</Text>
                                <Text className="text-2xl font-bold text-orange-600">
                                  {Math.round(item.main.temp)}°C
                                </Text>
                              </div>
                            </Col>
                            
                            {/* Khả năng mưa */}
                            <Col xs={12} sm={6} md={4}>
                              <div className="flex flex-col">
                                <Text type="secondary" className="text-xs mb-1">☔ Khả năng mưa</Text>
                                <Tag 
                                  color={item.pop > 0.5 ? 'red' : item.pop > 0.2 ? 'orange' : 'green'} 
                                  className="text-center text-base font-semibold"
                                  style={{ marginTop: '4px' }}
                                >
                                  {Math.round(item.pop * 100)}%
                                </Tag>
                              </div>
                            </Col>
                            
                            {/* Thời tiết */}
                            <Col xs={12} sm={6} md={5}>
                              <div className="flex flex-col">
                                <Text type="secondary" className="text-xs mb-1">🌤️ Thời tiết</Text>
                                <Text className="text-gray-700 font-medium">
                                  {item.weather[0]?.description}
                                </Text>
                              </div>
                            </Col>
                            
                            {/* Chi tiết */}
                            <Col xs={24} sm={12} md={7}>
                              <div className="flex flex-col">
                                <Text type="secondary" className="text-xs mb-1">📊 Chi tiết</Text>
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <Text className="text-xs text-gray-600">
                                      💨 Gió: <span className="font-semibold">{item.wind.speed}m/s</span>
                                    </Text>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Text className="text-xs text-gray-600">
                                      💧 Độ ẩm: <span className="font-semibold">{item.main.humidity}%</span>
                                    </Text>
                                  </div>
                                  {item.rain && item.rain['1h'] > 0 && (
                                    <div className="flex items-center gap-2">
                                      <Text className="text-xs text-orange-600">
                                        🌧️ Lượng mưa: <span className="font-semibold">{item.rain['1h']}mm</span>
                                      </Text>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Col>
                          </Row>
                          </div>
                        </div>
                      </List.Item>
                    )}
                  />
                </div>
              </TabPane>
            ))}
          </Tabs>
        </Card>
      )}

      {/* Location Map Modal */}
      <Modal
        title="Chọn vị trí trên bản đồ"
        open={isMapModalVisible}
        onCancel={() => setIsMapModalVisible(false)}
        footer={null}
        width={800}
      >
        <LocationMap
          selectedLocation={selectedLocation}
          onLocationSelect={(location) => {
            setSelectedLocation(location);
            // Lưu vị trí vào store để dùng lại sau
            setLastLocation({
              name: location.name,
              latitude: location.latitude,
              longitude: location.longitude,
              region: location.region,
              timestamp: Date.now()
            });
            setIsMapModalVisible(false);
          }}
          height="500px"
        />
      </Modal>
    </div>
  );
};

export default WeatherForecastPage;
