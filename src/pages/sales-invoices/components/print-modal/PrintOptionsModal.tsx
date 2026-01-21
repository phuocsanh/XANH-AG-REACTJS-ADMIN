import React from 'react';
import { 
  Box, Grid, Typography, Button, RadioGroup, FormControlLabel, Radio, 
  Divider, Checkbox, Paper 
} from '@mui/material';
import { Modal as AntModal } from 'antd';
import { MenuOutlined, CloseOutlined } from '@ant-design/icons';

interface PrintOptionsModalProps {
  isVisible: boolean;
  onCancel: () => void;
  onOk: () => void;
  isPrintOptionsOpen: boolean;
  setIsPrintOptionsOpen: (open: boolean) => void;
  paperSize: 'A4' | 'K80';
  setPaperSize: (size: 'A4' | 'K80') => void;
  printSections: {
    invoice: boolean;
    advisory: boolean;
    diseaseWarning: boolean;
  };
  handlePrintSectionChange: (section: 'invoice' | 'advisory' | 'diseaseWarning') => void;
  isDeliveryEnabled: boolean;
  shouldPrintDelivery: boolean;
  setShouldPrintDelivery: (print: boolean) => void;
  deliveryData: any;
  mixResult: string;
  sortResult: string;
  sprayingRecommendations: any[];
  selectedAdvisorySections: {
    mix: boolean;
    sort: boolean;
    spray: boolean;
  };
  setSelectedAdvisorySections: React.Dispatch<React.SetStateAction<{
    mix: boolean;
    sort: boolean;
    spray: boolean;
  }>>;
  diseaseLocation: any;
  availableWarnings: any[];
  selectedPrintDiseases: string[];
  setSelectedPrintDiseases: React.Dispatch<React.SetStateAction<string[]>>;
  generatePrintContent: () => string;
}

export const PrintOptionsModal = React.memo<PrintOptionsModalProps>(({
  isVisible,
  onCancel,
  onOk,
  isPrintOptionsOpen,
  setIsPrintOptionsOpen,
  paperSize,
  setPaperSize,
  printSections,
  handlePrintSectionChange,
  isDeliveryEnabled,
  shouldPrintDelivery,
  setShouldPrintDelivery,
  deliveryData,
  mixResult,
  sortResult,
  sprayingRecommendations,
  selectedAdvisorySections,
  setSelectedAdvisorySections,
  diseaseLocation,
  availableWarnings,
  selectedPrintDiseases,
  setSelectedPrintDiseases,
  generatePrintContent,
}) => {
  return (
    <AntModal
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pr: 4 }}>
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>Tùy chọn in phiếu tư vấn</Box>
          <Box 
            onClick={() => setIsPrintOptionsOpen(!isPrintOptionsOpen)}
            sx={{ 
              display: { xs: 'flex', md: 'none' }, 
              alignItems: 'center', 
              gap: 1,
              border: '1.5px solid #2e7d32',
              color: '#2e7d32',
              borderRadius: '20px',
              padding: '2px 12px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              bgcolor: 'white'
            }}
          >
            <MenuOutlined />
            <span>Tùy chọn in</span>
          </Box>
        </Box>
      }
      open={isVisible}
      onCancel={onCancel}
      onOk={onOk}
      okText="In phiếu"
      cancelText="Hủy"
      width={1000}
      style={{ top: 20 }}
      styles={{
        body: {
          maxHeight: 'calc(100vh - 200px)',
          overflowY: 'auto'
        }
      }}
      className="print-options-modal"
    >
      <Grid container spacing={{ xs: 1, md: 3 }}>
        {/* Overlay backdrop */}
        <Box
          className={`drawer-overlay ${isPrintOptionsOpen ? 'visible' : ''}`}
          sx={{ display: { xs: 'block', md: 'none' } }}
          onClick={() => setIsPrintOptionsOpen(false)}
        />

        {/* Left Column: Settings */}
        <Grid item xs={12} md={4} className={isPrintOptionsOpen ? 'open' : ''}>
          <Box 
            sx={{ 
              display: { xs: 'flex', md: 'none' }, 
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
              pb: 1,
              borderBottom: '1px solid #eee'
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold">Cấu hình in</Typography>
            <Button 
              variant="text" 
              size="small" 
              onClick={() => setIsPrintOptionsOpen(false)}
              sx={{ minWidth: 'auto', p: 0.5 }}
            >
              <CloseOutlined />
            </Button>
          </Box>
          
          <Box display="flex" flexDirection="column" gap={{ xs: 1.5, md: 2 }}>
            <Typography variant="h6" fontSize="1rem" fontWeight="bold">Khổ giấy</Typography>
            
            <RadioGroup value={paperSize} onChange={(e) => setPaperSize(e.target.value as 'A4' | 'K80')}>
              <FormControlLabel 
                value="A4" 
                control={<Radio />} 
                label={
                  <Box>
                    <Typography variant="body2" fontWeight="bold">A4 (210mm)</Typography>
                    <Typography variant="caption" color="text.secondary">Máy in văn phòng - Layout đầy đủ</Typography>
                  </Box>
                } 
              />
              <FormControlLabel 
                value="K80" 
                control={<Radio />} 
                label={
                  <Box>
                    <Typography variant="body2" fontWeight="bold">K80 (80mm)</Typography>
                    <Typography variant="caption" color="text.secondary">Máy in nhiệt/hóa đơn - Layout đơn giản</Typography>
                  </Box>
                } 
              />
            </RadioGroup>

            <Divider />

            <Typography variant="h6" fontSize="1rem">Tùy chọn nội dung</Typography>
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={printSections.invoice}
                  onChange={() => handlePrintSectionChange('invoice')}
                />
              }
              label="Thông tin hóa đơn & Khách hàng"
            />

            {isDeliveryEnabled && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={shouldPrintDelivery}
                    onChange={(e) => setShouldPrintDelivery(e.target.checked)}
                    disabled={!deliveryData}
                  />
                }
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <span>In phiếu giao hàng</span>
                    {!deliveryData && (
                      <Typography variant="caption" color="error">
                        (Vui lòng điền đủ thông tin phiếu giao)
                      </Typography>
                    )}
                  </Box>
                }
              />
            )}

            <FormControlLabel
              control={
                <Checkbox
                  checked={printSections.advisory}
                  onChange={() => handlePrintSectionChange('advisory')}
                  disabled={!mixResult && !sortResult && sprayingRecommendations.length === 0}
                />
              }
              label="Tư vấn kỹ thuật"
            />
            {printSections.advisory && (
              <Box ml={3} display="flex" flexDirection="column" gap={0.5}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={selectedAdvisorySections.mix}
                      onChange={(e) => setSelectedAdvisorySections(prev => ({ ...prev, mix: e.target.checked }))}
                      disabled={!mixResult}
                    />
                  }
                  label={<Typography variant="body2">Phối trộn thuốc</Typography>}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={selectedAdvisorySections.sort}
                      onChange={(e) => setSelectedAdvisorySections(prev => ({ ...prev, sort: e.target.checked }))}
                      disabled={!sortResult}
                    />
                  }
                  label={<Typography variant="body2">Thứ tự pha thuốc</Typography>}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={selectedAdvisorySections.spray}
                      onChange={(e) => setSelectedAdvisorySections(prev => ({ ...prev, spray: e.target.checked }))}
                      disabled={sprayingRecommendations.length === 0}
                    />
                  }
                  label={<Typography variant="body2">Thời điểm phun thuốc tốt nhất</Typography>}
                />
              </Box>
            )}

            <FormControlLabel
              control={
                <Checkbox
                  checked={printSections.diseaseWarning}
                  onChange={() => handlePrintSectionChange('diseaseWarning')}
                  disabled={!diseaseLocation}
                />
              }
              label="Cảnh báo Bệnh/Sâu hại"
            />
            
            {printSections.diseaseWarning && availableWarnings.length > 0 && (
              <Box ml={3} display="flex" flexDirection="column" gap={0.5}>
                {availableWarnings.map(w => (
                  <FormControlLabel
                    key={w.id}
                    control={
                      <Checkbox
                        size="small"
                        checked={selectedPrintDiseases.includes(w.id)}
                        onChange={() => {
                          setSelectedPrintDiseases(prev => 
                            prev.includes(w.id) 
                              ? prev.filter(id => id !== w.id)
                              : [...prev, w.id]
                          );
                        }}
                      />
                    }
                    label={
                      <Typography variant="body2">
                        {w.name} <span style={{ 
                          color: w.data?.risk_level === 'CAO' ? '#f5222d' : '#fa8c16',
                          fontWeight: 'bold',
                          fontSize: '0.75rem'
                        }}>
                          ({w.data?.risk_level === 'CAO' ? 'CAO' : 'TB'})
                        </span>
                      </Typography>
                    }
                  />
                ))}
              </Box>
            )}
          </Box>
        </Grid>

        {/* Right Column: Preview */}
        <Grid item xs={12} md={8}>
          <Typography variant="h6" fontSize="1rem" mb={2} sx={{ display: { xs: 'none', md: 'block' } }}>Xem trước bản in</Typography>
          <Paper 
            variant="outlined" 
            sx={{ 
              height: '600px', 
              overflow: 'hidden', 
              bgcolor: '#f5f5f5',
              display: 'flex',
              justifyContent: 'center',
              p: 2
            }}
          >
            <iframe
              srcDoc={generatePrintContent()}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                backgroundColor: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
              title="Print Preview"
            />
          </Paper>
        </Grid>
      </Grid>
    </AntModal>
  );
});

PrintOptionsModal.displayName = 'PrintOptionsModal';
