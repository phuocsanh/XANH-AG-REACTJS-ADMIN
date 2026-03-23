import React, { useState } from 'react';
import { Button, Card, Typography, Tabs } from 'antd';
import { PictureOutlined, SwapOutlined, EditOutlined } from '@ant-design/icons';
import { Sparkles } from 'lucide-react';
import ImageStudio from '@/components/image-studio/image-studio';
import HeicConverter from '@/components/image-studio/heic-converter';
import QuickLogoEditor from '@/components/image-studio/quick-logo-editor';
import { uploadService } from '@/services/upload.service';
import { message } from 'antd';

const { Title, Paragraph } = Typography;

/**
 * Trang AI Image Studio - Tạo ảnh sản phẩm chuyên nghiệp & công cụ convert ảnh
 */
const ImageStudioPage: React.FC = () => {
  const [showStudio, setShowStudio] = useState(false);
  const [savedImages, setSavedImages] = useState<string[]>([]);

  // Xử lý lưu ảnh sau khi chỉnh sửa
  const handleSaveImage = async (file: File) => {
    try {
      message.loading({ content: 'Đang lưu ảnh...', key: 'upload' });
      const result = await uploadService.uploadImage(file);
      
      setSavedImages(prev => [result.url, ...prev]);
      message.success({ content: 'Đã lưu ảnh thành công!', key: 'upload' });
    } catch (error) {
      console.error('Upload error:', error);
      message.error({ content: 'Lỗi khi lưu ảnh', key: 'upload' });
    }
  };

  // Nội dung tab AI Image Studio
  const studioTabContent = (
    <>
      {/* Quick Start Card */}
      <Card className="mb-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-bold mb-3">🎨 Tính năng nổi bật</h3>
            <ul className="space-y-2 text-sm">
              <li>✅ <strong>AI Remove Background</strong> - Tự động xóa nền bằng AI</li>
              <li>✅ <strong>HEIC Converter</strong> - Hỗ trợ ảnh iPhone</li>
              <li>✅ <strong>Quick Logo Editor</strong> - Chèn logo nhanh vào ảnh gốc</li>
              <li>✅ <strong>Custom Size</strong> - Tùy chỉnh kích thước ảnh</li>
              <li>✅ <strong>Copy & Download</strong> - Xuất ảnh nhanh chóng</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-3">📸 Cách sử dụng</h3>
            <ol className="space-y-2 text-sm list-decimal list-inside">
              <li>Nhấn nút &ldquo;Mở Studio&rdquo; bên dưới</li>
              <li>Chọn/Chụp ảnh sản phẩm</li>
              <li>Nhấn &ldquo;Thêm nền cho ảnh&rdquo; để AI xóa nền</li>
              <li>Điều chỉnh vị trí, kích thước, logo</li>
              <li>Copy/Download hoặc Lưu vào hệ thống</li>
            </ol>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Button 
            type="primary" 
            size="large"
            icon={<PictureOutlined />}
            onClick={() => setShowStudio(true)}
            className="bg-green-600 hover:bg-green-700 h-12 px-8 text-lg font-bold"
          >
            Mở AI Image Studio
          </Button>
        </div>
      </Card>

      {/* Saved Images Gallery */}
      {savedImages.length > 0 && (
        <Card title="📁 Ảnh đã lưu gần đây">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {savedImages.map((url, index) => (
              <div key={index} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <img src={url} alt={`Saved ${index + 1}`} className="w-full h-32 object-cover" />
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );

  // Tab items cho Tabs component
  const tabItems = [
    {
      key: 'studio',
      label: (
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          AI Image Studio
        </span>
      ),
      children: studioTabContent,
    },
    {
      key: 'quick-editor',
      label: (
        <span className="flex items-center gap-2">
          <EditOutlined />
          Quick Logo Editor
        </span>
      ),
      children: <QuickLogoEditor onSave={handleSaveImage} />,
    },
    {
      key: 'heic-converter',
      label: (
        <span className="flex items-center gap-2">
          <SwapOutlined />
          HEIC Converter
        </span>
      ),
      children: <HeicConverter onSave={handleSaveImage} />,
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Title level={2} className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-green-600" />
          AI Image Studio
        </Title>
        <Paragraph className="text-gray-600">
          Tạo ảnh sản phẩm chuyên nghiệp với AI - Tự động xóa nền, thêm logo, điều chỉnh kích thước | Chèn logo nhanh
        </Paragraph>
      </div>

      {/* Tabs: Studio, Quick Editor & HEIC Converter */}
      <Tabs
        defaultActiveKey="studio"
        items={tabItems}
        size="large"
        className="image-studio-tabs"
      />

      {/* Image Studio Modal */}
      <ImageStudio 
        visible={showStudio}
        onCancel={() => setShowStudio(false)}
        onSave={handleSaveImage}
      />
    </div>
  );
};

export default ImageStudioPage;
