import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface RiceAnalysisResult {
  summary: string;
  priceData?: {
    freshRice: string;
    exportRice: string;
    domesticRice: string;
    trend: 'tăng' | 'giảm' | 'ổn định';
  };
  riceVarieties: {
    variety: string;
    currentPrice: string;
    previousPrice?: string;
    change?: string;
    province: string;
  }[];
  marketInsights: string[];
  lastUpdated: string;
  dataQuality?: {
    tablesFound: number;
    pricesExtracted: number;
    hasDate: boolean;
    completeness: 'high' | 'medium' | 'low';
    score: number;
  };
  sourceUrl?: string;
  additionalSources?: string[];
}

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
  isLive?: boolean;
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

export const riceMarketService = {
  getLatestRiceMarketData: async (): Promise<RiceAnalysisResult> => {
    const response = await axios.get(`${API_URL}/ai-analysis-rice/latest-rice-market`);
    return response.data;
  },

  analyzeRiceMarket: async (): Promise<RiceAnalysisResult> => {
    const response = await axios.get(`${API_URL}/ai-analysis-rice/rice-market`);
    return response.data;
  },

  getYouTubeVideos: async (query?: string, limit?: number): Promise<YouTubeSearchResult> => {
    const response = await axios.get(`${API_URL}/ai-analysis-rice/youtube-videos`, {
      params: { query, limit },
    });
    return response.data;
  },

  askWithSources: async (question: string): Promise<any> => {
    const response = await axios.post(`${API_URL}/ai-analysis-rice/ask-with-sources`, {
      question,
    });
    return response.data;
  },
};
