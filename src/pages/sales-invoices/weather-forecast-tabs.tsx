import { useState } from 'react';
import { Box, Tabs, Tab, List, ListItem, Typography } from '@mui/material';
import { WeatherData } from '@/services/weather.service';

interface WeatherForecastTabsProps {
  weatherData: WeatherData[];
  formatTime: (timestamp: number) => string;
}

/**
 * Component hiển thị dự báo thời tiết 2 ngày dưới dạng tabs
 * Mỗi tab là một ngày, hiển thị đầy đủ tất cả các giờ
 */
export const WeatherForecastTabs: React.FC<WeatherForecastTabsProps> = ({ 
  weatherData, 
  formatTime 
}) => {
  const [tabValue, setTabValue] = useState(0);

  // Nhóm dữ liệu theo ngày
  const groupedByDay: Record<string, WeatherData[]> = {};
  weatherData.forEach(item => {
    const d = new Date(item.dt * 1000);
    const dateKey = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    if (!groupedByDay[dateKey]) {
      groupedByDay[dateKey] = [];
    }
    groupedByDay[dateKey].push(item);
  });
  
  const days = Object.keys(groupedByDay);

  if (days.length === 0) {
    return (
      <Typography color="text.secondary">
        Đang tải dữ liệu thời tiết...
      </Typography>
    );
  }

  return (
    <Box>
      <Tabs 
        value={tabValue} 
        onChange={(_, newValue) => setTabValue(newValue)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
      >
        {days.map((day, index) => (
          <Tab 
            key={day} 
            label={`Ngày ${index + 1}: ${day}`}
            sx={{ fontWeight: 'bold' }}
          />
        ))}
      </Tabs>
      
      {days.map((day, dayIndex) => (
        <Box 
          key={day}
          role="tabpanel"
          hidden={tabValue !== dayIndex}
        >
          {tabValue === dayIndex && (
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {groupedByDay[day].map((item, index) => (
                <ListItem key={index} sx={{ borderBottom: '1px solid #eee' }}>
                  <Box width="100%">
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography fontWeight="bold" color="primary">
                        🕒 {formatTime(item.dt)}
                      </Typography>
                      <Typography fontWeight="bold" color="success.main">
                        ☔ Khả năng mưa: {Math.round(item.pop * 100)}%
                      </Typography>
                    </Box>
                    <Box display="flex" gap={2} flexWrap="wrap" fontSize="0.875rem">
                      <span>🌡️ Nhiệt độ: {item.main.temp}°C</span>
                      <span>💨 Tốc độ gió: {item.wind.speed}m/s</span>
                      <span>💧 Độ ẩm: {item.main.humidity}%</span>
                      <span>🌤️ {item.weather[0]?.description}</span>
                    </Box>
                    {item.rain && (item.rain['1h'] || 0) > 0 && (
                      <Typography fontSize="0.75rem" color="warning.main" mt={0.5}>
                        🌧️ Lượng mưa: {item.rain['1h']}mm
                      </Typography>
                    )}
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      ))}
    </Box>
  );
};
