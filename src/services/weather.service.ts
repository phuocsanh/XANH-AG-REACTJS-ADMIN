/**
 * Service để lấy dữ liệu thời tiết
 * Hỗ trợ: Tomorrow.io (Chính xác cao, yêu cầu Key) và Open-Meteo (Miễn phí, Fallback)
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

export interface SimplifiedWeatherData {
  time: string;
  temperature: number;
  description: string;
  precipitation_probability: number;
  rain_amount: number;
  wind_speed: number;
  humidity: number;
}

// Interface cho Daily Weather Data
export interface DailyWeatherData {
  date: string; // Format: YYYY-MM-DD
  tempMin: number;
  tempMax: number;
  precipitationProbabilityMax: number;
  precipitationSum: number;
  weatherCode: number;
  weatherDescription: string;
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

interface OpenMeteoDailyResponse {
  latitude: number;
  longitude: number;
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    precipitation_sum: number[];
    weather_code: number[];
  };
}

// Interface cho response từ Tomorrow.io v4 (Hỗ trợ cả Forecast và Timelines)
interface TomorrowResponse {
  data?: {
    timelines: Array<{
      timestep: string;
      intervals: Array<{
        startTime: string;
        values: any;
      }>;
    }>;
  };
  timelines?: {
    hourly?: Array<{
      time: string;
      values: any;
    }>;
    daily?: Array<{
      time: string;
      values: any;
    }>;
  };
}

import { getAllRemoteValues } from "../lib/firebase";

class WeatherService {
  private readonly tomorrowForecastUrl = 'https://api.tomorrow.io/v4/weather/forecast';
  private readonly tomorrowTimelinesUrl = 'https://api.tomorrow.io/v4/timelines';
  private tomorrowApiKeys: string[] = [];
  private keysLoaded = false;

  /**
   * Đảm bảo các API Key đã được tải từ Remote Config
   */
  private async ensureKeysLoaded() {
    if (this.keysLoaded && this.tomorrowApiKeys.length > 0) return;

    try {
      // Lấy danh sách TOÀN BỘ Key từ Remote Config (bắt đầu bằng TOMORROW_API_KEY_)
      const keys = await getAllRemoteValues('TOMORROW_API_KEY_');

      this.tomorrowApiKeys = keys;
      this.keysLoaded = true;

      if (this.tomorrowApiKeys.length > 0) {
        console.log(`✅ [Admin] Đã tải ${this.tomorrowApiKeys.length} Tomorrow.io Keys từ Remote Config`);
      } else {
        // Fallback về .env
        this.tomorrowApiKeys = (import.meta.env.VITE_TOMORROW_API_KEY || '').split(',').map((k: string) => k.trim()).filter(Boolean);
        console.warn('⚠️ [Admin] Remote Config trống, đang sử dụng fallback từ .env');
      }
    } catch (error) {
      console.error('❌ [Admin] Lỗi khi tải API Keys từ Remote Config:', error);
      this.tomorrowApiKeys = (import.meta.env.VITE_TOMORROW_API_KEY || '').split(',').map((k: string) => k.trim()).filter(Boolean);
    }
  }

  /**
   * Thực hiện gọi API với cơ chế xoay vòng Key khi gặp lỗi 429 (Rate Limit)
   */
  private async fetchWithRotation(baseUrl: string, queryParams: Record<string, string>): Promise<Response> {
    await this.ensureKeysLoaded();

    if (this.tomorrowApiKeys.length === 0) {
      throw new Error('Không tìm thấy Tomorrow.io API Key trong cấu hình');
    }

    let lastResponse: Response | null = null;

    for (let i = 0; i < this.tomorrowApiKeys.length; i++) {
      const key = this.tomorrowApiKeys[i];
      if (!key) continue;
      
      const params = new URLSearchParams(queryParams);
      params.set('apikey', key);
      const url = `${baseUrl}?${params.toString()}`;

      try {
        const response = await fetch(url);
        
        // Nếu dính giới hạn lượt gọi (429), thử Key tiếp theo
        if (response.status === 429) {
          console.warn(`⚠️ Tomorrow.io Admin API Key thứ ${i + 1} hết hạn mức (429). Đang chuyển sang Key tiếp theo...`);
          lastResponse = response;
          continue;
        }

        // Nếu key không hợp lệ (400, 401, 403), thử Key tiếp theo
        if (response.status === 400 || response.status === 401 || response.status === 403) {
          const errorBody = await response.clone().text();
          console.warn(`⚠️ Tomorrow.io Admin API Key thứ ${i + 1} không hợp lệ (${response.status}).`);
          console.warn(`   Response body:`, errorBody);
          console.warn(`   Đang chuyển sang Key tiếp theo...`);
          lastResponse = response;
          continue;
        }

        return response;
      } catch (error) {
        console.error(`❌ Lỗi khi gọi Tomorrow.io Admin với Key thứ ${i + 1}:`, error);
        throw error;
      }
    }

    return lastResponse!;
  }

  /**
   * Map mã thời tiết sang mô tả tiếng Việt (Tomorrow.io Codes)
   */
  private getWeatherDescription(code: number): string {
    const codes: Record<number, string> = {
      0: 'Trời quang đãng',
      1000: 'Trời quang',
      1100: 'Ít mây',
      1101: 'Có mây rải rác',
      1102: 'Nhiều mây',
      1001: 'Mây u ám',
      2000: 'Sương mù nhẹ',
      2100: 'Sương mù',
      4000: 'Mưa phùn nhẹ',
      4001: 'Mưa nhỏ',
      4200: 'Mưa vừa',
      4201: 'Mưa to',
      5000: 'Tuyết rơi nhẹ',
      5001: 'Tuyết rơi vừa',
      5100: 'Tuyết rơi dày',
      6000: 'Mưa đá nhẹ',
      6001: 'Mưa đá to',
      7000: 'Mưa băng',
      8000: 'Dông sét',
    };
    return codes[code] || 'Không xác định';
  }

  /**
   * Lấy dự báo thời tiết hourly cho 6 ngày từ Tomorrow.io
   */
  async getForecast7Days(lat: number, lon: number): Promise<WeatherData[]> {
    // Đảm bảo API Keys đã được load từ Remote Config
    await this.ensureKeysLoaded();

    if (this.tomorrowApiKeys.length === 0) {
      console.warn('API Key Tomorrow.io trống hoặc không hợp lệ');
      return [];
    }
    
    try {
      // Ưu tiên dùng Timelines API để lấy được cả dữ liệu quá khứ trong ngày
      return await this.getTomorrowTimelinesHourly(lat, lon);
    } catch (error) {
      console.warn('Tomorrow.io Timelines API failed, falling back to Forecast API:', error);
      try {
        return await this.getTomorrowForecast(lat, lon);
      } catch (error2) {
        console.error('Tomorrow.io Forecast API failed:', error2);
        return [];
      }
    }
  }

  /**
   * Lấy dự báo tóm tắt theo ngày từ Tomorrow.io
   */
  async getDailyForecast7Days(lat: number, lon: number): Promise<DailyWeatherData[]> {
    // Đảm bảo API Keys đã được load từ Remote Config
    await this.ensureKeysLoaded();

    if (this.tomorrowApiKeys.length === 0) return [];
    
    try {
      return await this.getTomorrowDailyForecast(lat, lon);
    } catch (error) {
      console.error('Tomorrow.io Daily API failed:', error);
      return [];
    }
  }

  /** --- LOGIC TOMORROW.IO --- **/

  /**
   * Lấy dữ liệu hourly dùng Timelines API (Hỗ trợ startTime trong quá khứ)
   */
  private async getTomorrowTimelinesHourly(lat: number, lon: number): Promise<WeatherData[]> {
    try {
      const now = new Date();
      // Start time lấy từ thời điểm hiện tại để tiết kiệm quota 120h cho các ngày sau (giống NextJS)
      const startTime = now.toISOString();
      
      const queryParams = {
        location: `${lat},${lon}`,
        units: 'metric',
        timesteps: '1h',
        startTime: startTime,
        timezone: 'Asia/Ho_Chi_Minh',
        fields: ['temperature', 'humidity', 'precipitationProbability', 'precipitationIntensity', 'weatherCode', 'windSpeed'].join(',')
      };

      const response = await this.fetchWithRotation(this.tomorrowTimelinesUrl, queryParams);
      if (!response.ok) throw new Error(`Tomorrow.io Timelines error: ${response.status}`);
    
      const result: TomorrowResponse = await response.json();
      
      // Hỗ trợ cả hai cấu trúc response
      const timelines = result.data?.timelines || [];
      const timeline = timelines.find(t => t.timestep === '1h');
      
      if (!timeline) return [];

      return timeline.intervals.map(item => ({
        dt: new Date(item.startTime).getTime() / 1000,
        main: {
          temp: item.values.temperature,
          humidity: item.values.humidity
        },
        weather: [{
          description: this.getWeatherDescription(item.values.weatherCode),
          icon: ''
        }],
        weatherCode: item.values.weatherCode,
        pop: (item.values.precipitationProbability || 0) / 100,
        rain: {
          '1h': item.values.precipitationIntensity || 0
        },
        wind: {
          speed: item.values.windSpeed || 0
        }
      }));
    } catch (error) {
      console.error('Error fetching Tomorrow.io Timelines Hourly:', error);
      throw error;
    }
  }

  private async getTomorrowForecast(lat: number, lon: number): Promise<WeatherData[]> {
    const queryParams = {
      location: `${lat},${lon}`,
      units: 'metric',
      timesteps: '1h'
    };

    const response = await this.fetchWithRotation(this.tomorrowForecastUrl, queryParams);
    if (!response.ok) throw new Error(`Tomorrow.io error: ${response.status}`);
    
    const data: TomorrowResponse = await response.json();
    
    if (!data.timelines?.hourly) return [];

    return data.timelines.hourly.map(item => ({
      dt: new Date(item.time).getTime() / 1000,
      main: {
        temp: item.values.temperature,
        humidity: item.values.humidity
      },
      weather: [{
        description: this.getWeatherDescription(item.values.weatherCode),
        icon: ''
      }],
      pop: (item.values.precipitationProbability || 0) / 100,
      rain: {
        '1h': item.values.precipitationIntensity || 0
      },
      wind: {
        speed: item.values.windSpeed || 0
      }
    }));
  }

  private async getTomorrowDailyForecast(lat: number, lon: number): Promise<DailyWeatherData[]> {
    if (this.tomorrowApiKeys.length === 0) return [];

    try {
      const now = new Date();
      // Lấy YYYY-MM-DD của ngày hôm nay để filter
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const startTime = now.toISOString();

      const queryParams = {
        location: `${lat},${lon}`,
        units: 'metric',
        timesteps: '1d',
        startTime: startTime,
        timezone: 'Asia/Ho_Chi_Minh',
        fields: ['temperatureMin', 'temperatureMax', 'temperatureAvg', 'precipitationProbabilityMax', 'precipitationProbabilityAvg', 'precipitationIntensityAvg', 'weatherCodeMax', 'weatherCode'].join(',')
      };

      const response = await this.fetchWithRotation(this.tomorrowTimelinesUrl, queryParams);
      if (!response.ok) throw new Error(`Tomorrow.io Daily error: ${response.status}`);
      
      const data: TomorrowResponse = await response.json();
      
      // Hỗ trợ cấu trúc response của Tomorrow.io v4 Timelines
      const timelines = data.data?.timelines || [];
      const timeline = timelines.find(t => t.timestep === '1d');
      
      if (!timeline) return [];

      return timeline.intervals
        .map(item => {
          const v = item.values;
          // Sửa lỗi NaN bằng cách sử dụng fallback an toàn
          const rainSum = v.precipitationAccumulationSum ?? ((v.precipitationIntensityAvg || 0) * 24);
          
          const d = new Date(item.startTime);
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          
          return {
            date: dateStr,
            tempMin: Math.round(v.temperatureMin ?? v.temperatureAvg ?? 0),
            tempMax: Math.round(v.temperatureMax ?? v.temperatureAvg ?? 0),
            precipitationProbabilityMax: Math.round(v.precipitationProbabilityMax ?? v.precipitationProbabilityAvg ?? 0),
            precipitationSum: parseFloat((rainSum || 0).toFixed(1)),
            weatherCode: v.weatherCodeMax ?? v.weatherCode ?? 0,
            weatherDescription: this.getWeatherDescription(v.weatherCodeMax ?? v.weatherCode ?? 0)
          };
        })
        .filter(item => item.date >= todayStr); // Chỉ lấy từ ngày hôm nay trở đi
    } catch (error) {
      console.error('Error fetching Tomorrow.io Daily Forecast:', error);
      throw error;
    }
  }

  /** --- UTILITIES --- **/

  /**
   * Lấy dự báo thời tiết ngắn hạn (hourly) - Tương thích ngược
   */
  async getForecast(lat: number = 21.0285, lon: number = 105.8542): Promise<WeatherData[]> {
    return this.getForecast7Days(lat, lon);
  }

  /**
   * Lọc dữ liệu thời tiết cho 2 ngày tiếp theo tính từ hiện tại (Tương thích ngược)
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
   * Tóm tắt dữ liệu thời tiết cho AI phân tích (Tương thích ngược)
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

  async getPlaceName(lat: number, lon: number): Promise<string> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=vi`
      );
      const data = await response.json();
      if (data.address) {
        const addr = data.address;
        const parts = [];
        if (addr.road) parts.push(addr.road);
        if (addr.suburb || addr.village || addr.town) parts.push(addr.suburb || addr.village || addr.town);
        if (addr.city_district || addr.county) parts.push(addr.city_district || addr.county);
        if (addr.city || addr.state) parts.push(addr.city || addr.state);
        return parts.join(', ');
      }
      return 'Vị trí đã chọn';
    } catch (error) {
      console.error('Lỗi lấy tên địa điểm:', error);
      return 'Vị trí đã chọn';
    }
  }
}

export const weatherService = new WeatherService();