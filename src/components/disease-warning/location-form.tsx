import React, { useState } from 'react';
import { Form, Input, InputNumber, Button, Card, Space, message, Modal, Row, Col } from 'antd';
import { EnvironmentOutlined, SaveOutlined, AimOutlined } from '@ant-design/icons';
import { Location, UpdateLocationDto } from '@/models/rice-blast';
import LocationMap from '@/components/LocationMap';
import { Location as MapLocation } from '@/constants/locations';

interface LocationFormProps {
  location?: Location;
  onSubmit: (values: UpdateLocationDto) => void;
  loading?: boolean;
}

/**
 * Component form cập nhật vị trí ruộng lúa
 */
export const LocationForm: React.FC<LocationFormProps> = ({ 
  location, 
  onSubmit, 
  loading = false 
}) => {
  const [form] = Form.useForm();
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  // Set initial values khi location thay đổi
  React.useEffect(() => {
    if (location) {
      form.setFieldsValue({
        name: location.name,
        lat: location.lat,
        lon: location.lon,
      });
    }
  }, [location, form]);

  /**
   * Lấy tên địa điểm chi tiết từ tọa độ (Reverse Geocoding)
   */
  const getPlaceName = async (lat: number, lon: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=vi`
      );
      const data = await response.json();
      
      if (data.address) {
        const addr = data.address;
        const parts = [];
        
        if (addr.road) parts.push(addr.road);
        if (addr.suburb) parts.push(addr.suburb);
        else if (addr.village) parts.push(addr.village);
        else if (addr.town) parts.push(addr.town);
        
        if (addr.city_district) parts.push(addr.city_district);
        else if (addr.county) parts.push(addr.county);
        
        if (addr.city) parts.push(addr.city);
        else if (addr.state) parts.push(addr.state);
        
        return parts.join(', ');
      }
      return 'Vị trí không xác định';
    } catch (error) {
      console.error('Lỗi lấy tên địa điểm:', error);
      return 'Vị trí hiện tại';
    }
  };

  /**
   * Phát hiện vị trí hiện tại của người dùng
   */
  /**
   * Phát hiện vị trí hiện tại của người dùng
   */
  const detectUserLocation = () => {
    if (!navigator.geolocation) {
      message.error('Trình duyệt của bạn không hỗ trợ định vị.');
      return;
    }

    setIsDetecting(true);
    const hide = message.loading('Đang xác định vị trí...', 0);

    const handleSuccess = async (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      
      try {
        // Lấy tên địa điểm chi tiết
        const detailedName = await getPlaceName(latitude, longitude);
        
        // Cập nhật form
        form.setFieldsValue({
          name: detailedName,
          lat: latitude,
          lon: longitude,
        });

        hide();
        setIsDetecting(false);
        message.success(`Đã cập nhật: ${detailedName}`);
      } catch (error) {
        hide();
        setIsDetecting(false);
        // Fallback: Chỉ cập nhật tọa độ nếu không lấy được tên
        form.setFieldsValue({
          lat: latitude,
          lon: longitude,
        });
        message.warning('Đã lấy được tọa độ nhưng không thể xác định tên địa điểm.');
      }
    };

    const handleError = (error: GeolocationPositionError, isHighAccuracy: boolean) => {
      // Nếu thất bại với high accuracy, thử lại với low accuracy
      if (isHighAccuracy && (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE)) {
        console.log('Thử lại với độ chính xác thấp hơn...');
        navigator.geolocation.getCurrentPosition(
          handleSuccess,
          (retryError) => handleError(retryError, false),
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
        );
        return;
      }

      hide();
      setIsDetecting(false);
      console.error('Lỗi định vị:', error);

      let errorMsg = 'Không thể lấy vị trí.';
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMsg = 'Bạn đã từ chối quyền truy cập vị trí. Vui lòng cấp quyền trong cài đặt trình duyệt.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMsg = 'Không thể xác định vị trí hiện tại. Hãy kiểm tra kết nối mạng hoặc GPS.';
          break;
        case error.TIMEOUT:
          errorMsg = 'Hết thời gian chờ lấy vị trí. Vui lòng thử lại.';
          break;
      }
      message.error(errorMsg);
    };

    // Thử lần đầu với độ chính xác cao
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      (error) => handleError(error, true),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  /**
   * Xử lý chọn vị trí từ bản đồ
   */
  const handleMapSelect = async (mapLocation: MapLocation) => {
    try {
      // Nếu mapLocation đã có tên chi tiết (từ LocationMap logic), dùng luôn
      // Nếu không (ví dụ chọn tỉnh thành), có thể dùng tên đó hoặc lấy chi tiết hơn
      
      const lat = mapLocation.latitude;
      const lon = mapLocation.longitude;
      
      // Ưu tiên lấy tên chi tiết lại để đảm bảo độ chính xác cho ruộng lúa
      // Trừ khi mapLocation.name đã là chi tiết (logic của LocationMap khi click)
      const detailedName = mapLocation.name;
      
      if (mapLocation.id.startsWith('custom-location')) {
         // Đã là custom location từ click bản đồ, tên đã được resolve
      } else {
         // Là location có sẵn (tỉnh/thành), có thể muốn lấy chi tiết hơn hoặc giữ nguyên
         // Ở đây ta giữ nguyên tên tỉnh/thành cho đơn giản, người dùng có thể sửa
      }

      form.setFieldsValue({
        name: detailedName,
        lat: lat,
        lon: lon,
      });

      setIsMapModalVisible(false);
      message.success('Đã cập nhật vị trí từ bản đồ');
    } catch (error) {
      message.error('Có lỗi khi chọn vị trí');
      setIsMapModalVisible(false);
    }
  };

  const handleSubmit = (values: UpdateLocationDto) => {
    // Đảm bảo lat và lon là number
    const submitData = {
      ...values,
      lat: Number(values.lat),
      lon: Number(values.lon),
    };
    onSubmit(submitData);
  };

  // Construct current location for map
  const currentLat = Form.useWatch('lat', form) || 20.4167;
  const currentLon = Form.useWatch('lon', form) || 106.3667;
  const currentName = Form.useWatch('name', form) || 'Vị trí hiện tại';

  const mapSelectedLocation: MapLocation = {
    id: 'current-selection',
    name: currentName,
    latitude: currentLat,
    longitude: currentLon,
    region: '📍 Đang chọn'
  };

  return (
    <>
      <Card
        
        style={{ marginBottom: 24 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={loading}
        >
          {/* Single Row: Tên vị trí + 3 Action Buttons */}
          <Row gutter={8} align="middle">
            {/* Tên vị trí - Chiếm phần lớn */}
            <Col xs={24} sm={12} md={14} lg={16}>
              <Form.Item
                
                name="name"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên vị trí' },
                  { min: 3, message: 'Tên vị trí phải có ít nhất 3 ký tự' },
                ]}
                style={{ marginBottom: 0 }}
              >
                <Input 
                  placeholder="VD: Ruộng nhà ông Tư" 
                  size="large"
                />
              </Form.Item>
              
              {/* Hidden fields cho lat và lon */}
              <Form.Item name="lat" hidden>
                <InputNumber />
              </Form.Item>
              <Form.Item name="lon" hidden>
                <InputNumber />
              </Form.Item>
            </Col>

            {/* 3 Action Buttons - Chiếm phần nhỏ */}
            <Col xs={8} sm={4} md={3} lg={2}>
              <Button
                icon={<AimOutlined />}
                onClick={detectUserLocation}
                loading={isDetecting}
                block
                size="large"
                title="Lấy vị trí hiện tại"
              />
            </Col>
            
            <Col xs={8} sm={4} md={3} lg={2}>
              <Button
                icon={<EnvironmentOutlined />}
                onClick={() => setIsMapModalVisible(true)}
                block
                size="large"
                title="Chọn vị trí trên bản đồ"
              />
            </Col>

            <Col xs={8} sm={4} md={4} lg={4}>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading}
                size="large"
                block
                title="Lưu vị trí"
              >
                {loading ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Map Modal */}
      <Modal
        title="Chọn vị trí trên bản đồ"
        open={isMapModalVisible}
        onCancel={() => setIsMapModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <LocationMap
          selectedLocation={mapSelectedLocation}
          onLocationSelect={handleMapSelect}
        />
      </Modal>
    </>
  );
};
