/**
 * Service để lấy dữ liệu thời tiết từ Open-Meteo API (Miễn phí, không cần key)
 */

// Giữ lại interface WeatherData để tương thích với UI hiện tại
export interface WeatherData {
  dt: number;
  main: {
    temp: number;
    humidity: number;
  };
  weather: Array<{
    description: string;
    icon: string;
  }>;
  pop: number; // Probability of precipitation (0-1)
  rain?: {
    '1h': number;
  };
  wind: {
    speed: number;
  };
}

// Interface cho response từ Open-Meteo
interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    precipitation_probability: number[];
    rain: number[];
    weather_code: number[];
    wind_speed_10m: number[];
  };
}

export interface SimplifiedWeatherData {
  time: string;
  temperature: number;
  description: string;
  precipitation_probability: number;
  rain_amount: number;
  wind_speed: number;
  humidity: number;
}

class WeatherService {
  private readonly baseUrl = 'https://api.open-meteo.com/v1/forecast';

  /**
   * Map WMO weather code sang mô tả tiếng Việt
   */
  private getWeatherDescription(code: number): string {
    const codes: Record<number, string> = {
      0: 'Bầu trời quang đãng',
      1: 'Chủ yếu là nắng',
      2: 'Có mây',
      3: 'Nhiều mây',
      45: 'Sương mù',
      48: 'Sương muối',
      51: 'Mưa phùn nhẹ',
      53: 'Mưa phùn vừa',
      55: 'Mưa phùn dày',
      61: 'Mưa nhẹ',
      63: 'Mưa vừa',
      65: 'Mưa to',
      71: 'Tuyết rơi nhẹ',
      73: 'Tuyết rơi vừa',
      75: 'Tuyết rơi dày',
      77: 'Tuyết hạt',
      80: 'Mưa rào nhẹ',
      81: 'Mưa rào vừa',
      82: 'Mưa rào to',
      95: 'Dông nhẹ hoặc vừa',
      96: 'Dông kèm mưa đá nhẹ',
      99: 'Dông kèm mưa đá to'
    };
    return codes[code] || 'Không xác định';
  }

  /**
   * Lấy dự báo thời tiết hourly từ Open-Meteo
   */
  async getForecast(lat: number = 21.0285, lon: number = 105.8542): Promise<WeatherData[]> {
    try {
      const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lon.toString(),
        hourly: 'temperature_2m,relative_humidity_2m,precipitation_probability,rain,weather_code,wind_speed_10m',
        timezone: 'auto',
        forecast_days: '4' // Lấy dư ra để cover đủ 2-3 ngày tới
      });

      const response = await fetch(`${this.baseUrl}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Lỗi khi gọi API thời tiết: ${response.status}`);
      }

      const data: OpenMeteoResponse = await response.json();
      return this.mapOpenMeteoToWeatherData(data);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw error;
    }
  }

  /**
   * Chuyển đổi dữ liệu Open-Meteo sang format WeatherData cũ để tương thích UI
   */
  private mapOpenMeteoToWeatherData(data: OpenMeteoResponse): WeatherData[] {
    const { hourly } = data;
    
    return hourly.time.map((time, index) => {
      return {
        dt: new Date(time).getTime() / 1000, // Convert to unix timestamp (seconds)
        main: {
          temp: hourly.temperature_2m[index],
          humidity: hourly.relative_humidity_2m[index]
        },
        weather: [{
          description: this.getWeatherDescription(hourly.weather_code[index]),
          icon: '' // Open-Meteo không có icon url, có thể map sau nếu cần
        }],
        pop: hourly.precipitation_probability[index] / 100, // Convert % to 0-1
        rain: {
          '1h': hourly.rain[index]
        },
        wind: {
          speed: hourly.wind_speed_10m[index]
        }
      };
    });
  }

  /**
   * Lọc dữ liệu thời tiết cho 2 ngày tiếp theo tính từ hiện tại
   */
  filterNextTwoDays(forecastData: WeatherData[]): WeatherData[] {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + 2);
    endDate.setHours(23, 59, 59, 999);
    
    return forecastData.filter(item => {
      const itemDate = new Date(item.dt * 1000);
      return itemDate >= now && itemDate <= endDate;
    });
  }

  /**
   * Tóm tắt dữ liệu thời tiết cho AI phân tích
   */
  simplifyWeatherData(weatherData: WeatherData[]): SimplifiedWeatherData[] {
    return weatherData.map(item => ({
      time: new Date(item.dt * 1000).toLocaleString('vi-VN'),
      temperature: item.main.temp,
      description: item.weather[0]?.description || 'Không có thông tin',
      precipitation_probability: Math.round(item.pop * 100),
      rain_amount: item.rain ? item.rain['1h'] : 0,
      wind_speed: item.wind.speed,
      humidity: item.main.humidity
    }));
  }
}

// Export instance singleton
export const weatherService = new WeatherService();