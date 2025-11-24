import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface YouTubeVideoData {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  channel: {
    name: string;
    url?: string;
  };
  duration?: string;
  views?: string;
  uploadTime?: string;
  description?: string;
}

export interface WeatherForecastResult {
  summary: string;
  hydrologyInfo: string;
  waterLevelInfo: string;
  stormsAndTropicalDepressionsInfo: string;
  youtubeVideos: YouTubeVideoData[];
  lastUpdated: string;
  dataSources: string[];
}

export interface YouTubeSearchResult {
  videos: YouTubeVideoData[];
  query: string;
  searchTime: string;
  totalResults: number;
  searchQuality?: {
    hasRecentVideos: boolean;
    todayVideosCount: number;
    score: number;
  };
  error?: string;
}

export const backendWeatherService = {
  getLatestWeatherForecast: async (): Promise<WeatherForecastResult> => {
    const response = await axios.get(`${API_URL}/weather-forecast/climate-forecasting`);
    return response.data;
  },

  getFullWeatherForecast: async (): Promise<WeatherForecastResult> => {
    const response = await axios.get(`${API_URL}/weather-forecast/full-forecast`);
    return response.data;
  },

  getYouTubeVideos: async (query?: string, limit?: number): Promise<YouTubeSearchResult> => {
    const response = await axios.get(`${API_URL}/weather-forecast/youtube-videos`, {
      params: { query, limit },
    });
    return response.data;
  },
};
