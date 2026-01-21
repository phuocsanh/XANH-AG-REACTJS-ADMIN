import React from 'react';
import { Grid, Card, CardContent, Typography, Box, List, ListItem, IconButton } from '@mui/material';
import { SyncOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import { WeatherForecastTabs } from '../../weather-forecast-tabs';

interface WeatherAdvisoryProps {
  sprayingRecommendations: any[];
  fullWeatherForecast: any[];
  isWeatherLoading: boolean;
  fetchWeatherForecast: (force: boolean) => void;
  formatTime: (timestamp: number) => string;
}

export const WeatherAdvisory = React.memo<WeatherAdvisoryProps>(({
  sprayingRecommendations,
  fullWeatherForecast,
  isWeatherLoading,
  fetchWeatherForecast,
  formatTime,
}) => {
  return (
    <Grid container spacing={2} sx={{ mt: 0 }}>
      {/* Weather & Spraying Time */}
      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Thời điểm phun thuốc tốt nhất
              </Typography>
            </Box>
            {sprayingRecommendations.length > 0 ? (
              <List>
                {sprayingRecommendations.map((item, index) => (
                  <ListItem key={index} dense sx={{ borderBottom: '1px solid #eee' }}>
                    <Box width="100%">
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography fontWeight="bold" color="primary">
                          🕒 {item.time}
                        </Typography>
                        <Typography fontWeight="bold" color="success.main">
                          ☔ Khả năng mưa: {item.rain_prob}
                        </Typography>
                      </Box>
                      <Box display="flex" gap={2} flexWrap="wrap" fontSize="0.875rem">
                        <span>🌡️ Nhiệt độ: {item.temperature}</span>
                        <span>💨 Tốc độ gió: {item.wind_speed}</span>
                        <span>🌤️ {item.condition}</span>
                      </Box>
                    </Box>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box textAlign="center" py={4} color="text.secondary">
                {isWeatherLoading ? <Spin /> : 'Chưa có dữ liệu phân tích'}
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Weather Forecast */}
      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Dự báo thời tiết 2 ngày tới
              </Typography>
              <IconButton
                size="small"
                onClick={() => fetchWeatherForecast(true)}
                title="Lấy dữ liệu mới nhất"
              >
                <SyncOutlined spin={isWeatherLoading} />
              </IconButton>
            </Box>
            <WeatherForecastTabs 
              weatherData={fullWeatherForecast}
              formatTime={formatTime}
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
});

WeatherAdvisory.displayName = 'WeatherAdvisory';
