import React from 'react';
import { Card, CardContent, Typography, Box, Grid, Alert } from '@mui/material';
import { Spin } from 'antd';
import { AdvisoryLocationInfo } from './AdvisoryLocationInfo';
import { AdvisoryProductList } from './AdvisoryProductList';
import { AnalysisResults } from './AnalysisResults';
import { WeatherAdvisory } from './WeatherAdvisory';
import { PesticideTypeLegend } from './PesticideTypeLegend';
import { Location } from '@/constants/locations';

interface TechnicalAdvisoryTabProps {
  currentTab: number;
  selectedLocation: Location;
  detectUserLocation: () => void;
  setIsMapModalVisible: (visible: boolean) => void;
  updateLocationMutation: any;
  antMessage: any;
  items: any[];
  invoiceProducts: any[];
  selectedProductIdsForAdvisory: number[];
  handleProductToggleForAdvisory: (id: number) => void;
  handleAnalyze: () => void;
  handlePrint: () => void;
  isAnalyzing: boolean;
  mixResult: string;
  sortResult: string;
  sprayingRecommendations: any[];
  isWeatherLoading: boolean;
  error: string | null;
  fullWeatherForecast: any[];
  fetchWeatherForecast: (force: boolean) => void;
  formatTime: (timestamp: number) => string;
}

export const TechnicalAdvisoryTab = React.memo<TechnicalAdvisoryTabProps>(({
  selectedLocation,
  detectUserLocation,
  setIsMapModalVisible,
  updateLocationMutation,
  antMessage,
  items,
  invoiceProducts,
  selectedProductIdsForAdvisory,
  handleProductToggleForAdvisory,
  handleAnalyze,
  handlePrint,
  isAnalyzing,
  mixResult,
  sortResult,
  sprayingRecommendations,
  isWeatherLoading,
  error,
  fullWeatherForecast,
  fetchWeatherForecast,
  formatTime,
}) => {
  return (
    <>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>
            Tư vấn kỹ thuật & Thời tiết
          </Typography>

          <AdvisoryLocationInfo 
            selectedLocation={selectedLocation}
            detectUserLocation={detectUserLocation}
            setIsMapModalVisible={setIsMapModalVisible}
            updateLocationMutation={updateLocationMutation}
            antMessage={antMessage}
          />

          <AdvisoryProductList 
            items={items}
            invoiceProducts={invoiceProducts}
            selectedProductIdsForAdvisory={selectedProductIdsForAdvisory}
            handleProductToggleForAdvisory={handleProductToggleForAdvisory}
            handleAnalyze={handleAnalyze}
            handlePrint={handlePrint}
            isAnalyzing={isAnalyzing}
            mixResult={mixResult}
            sortResult={sortResult}
            sprayingRecommendations={sprayingRecommendations}
          />
        </CardContent>
      </Card>

      {isAnalyzing && (
        <Box textAlign="center" mb={3}>
          <Spin size="large" />
          <Typography mt={2}>Đang phân tích yêu cầu...</Typography>
        </Box>
      )}

      {isWeatherLoading && (
        <Box textAlign="center" mb={3}>
          <Spin size="large" />
          <Typography mt={2}>Đang lấy dữ liệu thời tiết và phân tích...</Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <AnalysisResults mixResult={mixResult} sortResult={sortResult} />

      <WeatherAdvisory 
        sprayingRecommendations={sprayingRecommendations}
        fullWeatherForecast={fullWeatherForecast}
        isWeatherLoading={isWeatherLoading}
        fetchWeatherForecast={fetchWeatherForecast}
        formatTime={formatTime}
      />

      <PesticideTypeLegend />
    </>
  );
});

TechnicalAdvisoryTab.displayName = 'TechnicalAdvisoryTab';
