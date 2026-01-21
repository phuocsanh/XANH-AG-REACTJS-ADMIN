import React from 'react';
import { Grid, Card, CardContent, Typography } from '@mui/material';

interface AnalysisResultsProps {
  mixResult: string;
  sortResult: string;
}

export const AnalysisResults = React.memo<AnalysisResultsProps>(({
  mixResult,
  sortResult,
}) => {
  return (
    <Grid container spacing={2}>
      {/* Mix Result */}
      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" mb={2}>
              Kết quả Phân tích Phối trộn
            </Typography>
            {mixResult ? (
              <div
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
              <Typography color="text.secondary">Chưa có kết quả phân tích phối trộn</Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Sort Result */}
      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" mb={2}>
              Sắp xếp thứ tự pha thuốc
            </Typography>
            {sortResult ? (
              <div>
                {sortResult.split('\n').filter(line => line.trim()).map((line, index) => (
                  <Typography key={index} mb={1}>
                    {line.trim()}
                  </Typography>
                ))}
              </div>
            ) : (
              <Typography color="text.secondary">Chưa có kết quả sắp xếp</Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
});

AnalysisResults.displayName = 'AnalysisResults';
