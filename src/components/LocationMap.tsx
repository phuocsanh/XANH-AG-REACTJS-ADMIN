import React, { useState, useEffect } from 'react';
import { Map, Marker, ZoomControl } from 'pigeon-maps';
import { VIETNAM_LOCATIONS, Location } from '@/constants/locations';
import { weatherService } from '@/lib/weather-service';

interface LocationMapProps {
  selectedLocation: Location;
  onLocationSelect: (location: Location) => void;
  height?: string;
}

/**
 * Component bản đồ Việt Nam sử dụng Pigeon Maps
 * Nhẹ hơn, không lỗi CSS trong Modal, không cần API Key
 */
const LocationMap: React.FC<LocationMapProps> = ({ 
  selectedLocation, 
  onLocationSelect,
  height = '400px'
}) => {
  // Center map state
  const [center, setCenter] = useState<[number, number]>([
    selectedLocation.latitude, 
    selectedLocation.longitude
  ]);
  const [zoom, setZoom] = useState(6);
  const [isLoading, setIsLoading] = useState(false);

  // Update center khi selectedLocation thay đổi
  useEffect(() => {
    setCenter([selectedLocation.latitude, selectedLocation.longitude]);
    setZoom(10); // Zoom gần hơn khi đã chọn
  }, [selectedLocation]);

  /**
   * Xử lý khi click vào bản đồ
   */
  const handleMapClick = async ({ latLng }: { latLng: [number, number] }) => {
    const [lat, lng] = latLng;
    setIsLoading(true);
    
    try {
      // Lấy tên địa điểm chi tiết từ tọa độ
      const detailedName = await weatherService.getPlaceName(lat, lng);
      
      // Tạo location mới với thông tin chi tiết
      const newLocation: Location = {
        id: `custom-location-${Date.now()}`,
        name: detailedName,
        latitude: lat,
        longitude: lng,
        region: '📍 Vị trí tùy chọn'
      };
      
      onLocationSelect(newLocation);
    } catch (error) {
      console.error('Lỗi khi chọn vị trí:', error);
      // Fallback nếu lỗi: tìm địa điểm gần nhất
      let nearestLocation = VIETNAM_LOCATIONS[0];
      let minDistance = Infinity;
      
      VIETNAM_LOCATIONS.forEach(loc => {
        const distance = Math.sqrt(
          Math.pow(loc.latitude - lat, 2) + Math.pow(loc.longitude - lng, 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestLocation = loc;
        }
      });
      onLocationSelect(nearestLocation);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ height, width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #d9d9d9', position: 'relative' }}>
      <Map 
        height={parseInt(height)}
        center={center} 
        zoom={zoom} 
        onBoundsChanged={({ center, zoom }) => { 
          setCenter(center); 
          setZoom(zoom); 
        }}
        onClick={handleMapClick}
      >
        <ZoomControl />
        
        {/* Marker cho vị trí đang chọn (Màu đỏ nổi bật) */}
        <Marker 
          width={50}
          anchor={[selectedLocation.latitude, selectedLocation.longitude]} 
          color="#ff4d4f" 
        />

        {/* Markers cho các tỉnh thành khác (Màu xanh nhạt) */}
        {VIETNAM_LOCATIONS.map(loc => (
          loc.id !== selectedLocation.id && (
            <Marker 
              key={loc.id}
              width={30}
              anchor={[loc.latitude, loc.longitude]} 
              color="#1890ff"
              onClick={() => onLocationSelect(loc)}
            />
          )
        ))}
      </Map>
      
      <div style={{ padding: '10px', background: '#f5f5f5', fontSize: '12px', color: '#666' }}>
        <p>💡 Mẹo: Lăn chuột để phóng to/thu nhỏ. Click vào điểm màu xanh để chọn tỉnh/thành phố.</p>
      </div>
      
      {/* Loading Overlay */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{ color: '#1890ff', fontWeight: 'bold' }}>Đang lấy thông tin vị trí...</div>
        </div>
      )}
    </div>
  );
};

export default LocationMap;
