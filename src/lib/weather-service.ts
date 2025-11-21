/**
 * Service để lấy dữ liệu thời tiết từ OpenWeatherMap API
 */
export interface WeatherData {
  dt: number;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  clouds: {
    all: number;
  };
  wind: {
    speed: number;
    deg: number;
  };
  visibility: number;
  pop: number; // Probability of precipitation
  rain?: {
    '1h': number;
  };
  sys: {
    pod: string; // Part of day (d = day, n = night)
  };
  dt_txt: string;
}

export interface WeatherForecastResponse {
  cod: string;
  message: number;
  cnt: number;
  list: WeatherData[];
  city: {
    id: number;
    name: string;
    coord: {
      lat: number;
      lon: number;
    };
    country: string;
    population: number;
    timezone: number;
    sunrise: number;
    sunset: number;
  };
}

/**
 * Interface cho dữ liệu thời tiết đã được tóm tắt cho AI phân tích
 */
export interface SimplifiedWeatherData {
  time: string; // Thời gian
  temperature: number; // Nhiệt độ (°C)
  description: string; // Mô tả thời tiết
  precipitation_probability: number; // Khả năng mưa (%)
  rain_amount: number; // Lượng mưa (mm)
  wind_speed: number; // Tốc độ gió (m/s)
  humidity: number; // Độ ẩm (%)
}

/**
 * Service thời tiết
 */
class WeatherService {
  private readonly apiKey = 'db47922519cd182f04d7e227153ff80d';
  private readonly baseUrl = 'https://api.openweathermap.org/data/2.5';

  /**
   * Lấy dự báo thời tiết 5 ngày 3 giờ/lần
   * @param lat Vĩ độ
   * @param lon Kinh độ
   * @returns Promise với dữ liệu dự báo thời tiết
   */
  async getForecast(lat: number = 21.0285, lon: number = 105.8542): Promise<WeatherForecastResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&lang=vi`
      );

      if (!response.ok) {
        throw new Error(`Lỗi khi gọi API thời tiết: ${response.status}`);
      }

      const data: WeatherForecastResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw error;
    }
  }

  /**
   * Lọc dữ liệu thời tiết cho 2 ngày tiếp theo tính từ hiện tại
   * @param forecastData Dữ liệu dự báo thời tiết
   * @returns Dữ liệu thời tiết đã lọc
   */
  filterNextTwoDays(forecastData: WeatherForecastResponse): WeatherData[] {
    const now = new Date();
    const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    
    return forecastData.list.filter(item => {
      const itemDate = new Date(item.dt * 1000);
      return itemDate >= now && itemDate <= twoDaysLater;
    });
  }

  /**
   * Tóm tắt dữ liệu thời tiết cho AI phân tích
   * @param weatherData Dữ liệu thời tiết
   * @returns Dữ liệu thời tiết đã được tóm tắt
   */
  simplifyWeatherData(weatherData: WeatherData[]): SimplifiedWeatherData[] {
    return weatherData.map(item => ({
      time: new Date(item.dt * 1000).toLocaleString('vi-VN'),
      temperature: Math.round(item.main.temp * 10) / 10,
      description: item.weather[0]?.description || 'Không có thông tin',
      precipitation_probability: Math.round(item.pop * 100),
      rain_amount: item.rain ? Math.round(item.rain['1h'] * 10) / 10 : 0,
      wind_speed: Math.round(item.wind.speed * 10) / 10,
      humidity: item.main.humidity
    }));
  }

  /**
   * Nhóm dữ liệu thời tiết theo ngày
   * @param weatherData Dữ liệu thời tiết
   * @returns Dữ liệu thời tiết nhóm theo ngày
   */
  groupByDay(weatherData: WeatherData[]): Record<string, WeatherData[]> {
    const grouped: Record<string, WeatherData[]> = {};
    
    weatherData.forEach(item => {
      const date = new Date(item.dt * 1000).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(item);
    });
    
    return grouped;
  }
}

// Export instance singleton
export const weatherService = new WeatherService();