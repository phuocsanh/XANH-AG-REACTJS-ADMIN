import React, { useState } from 'react';
import { Card, Button, message, Space, Typography, Alert, Image } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { uploadService, UPLOAD_TYPES, UploadResponse } from '@/services/upload.service';

const { Title, Text } = Typography;

/**
 * Trang demo để test upload ảnh với nén
 */
const UploadTestPage: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadResponse[]>([]);

  /**
   * Xử lý upload file
   */
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      message.error('Vui lòng chọn file ảnh!');
      return;
    }

    try {
      setUploading(true);
      message.loading({ content: 'Đang nén và upload ảnh...', key: 'upload' });

      // Upload với type PRODUCT
      const response = await uploadService.uploadImage(file, UPLOAD_TYPES.PRODUCT);
      
      message.success({ content: 'Upload thành công!', key: 'upload' });
      setUploadedImages(prev => [...prev, response]);
      
      console.log('📤 Upload response:', response);
    } catch (error) {
      console.error('Upload error:', error);
      message.error({ content: 'Upload thất bại!', key: 'upload' });
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  /**
   * Xử lý xóa ảnh
   */
  const handleDelete = async (publicId: string, index: number) => {
    try {
      message.loading({ content: 'Đang xóa ảnh...', key: 'delete' });
      await uploadService.deleteImage(publicId);
      message.success({ content: 'Xóa ảnh thành công!', key: 'delete' });
      
      setUploadedImages(prev => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Delete error:', error);
      message.error({ content: 'Xóa ảnh thất bại!', key: 'delete' });
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <Title level={2}>🖼️ Test Upload Ảnh với Nén</Title>
        
        <Alert
          message="Hướng dẫn"
          description={
            <ul className="list-disc pl-5 mt-2">
              <li>Chọn ảnh để upload (tự động nén về tối đa 1MB và 1920px)</li>
              <li><strong>Hỗ trợ ảnh HEIC/HEIF từ iPhone</strong> - tự động chuyển sang JPEG</li>
              <li>Ảnh sẽ được lưu vào folder <code>/products</code> trên Cloudinary</li>
              <li>Bạn có thể xóa ảnh đã upload bằng nút "Xóa"</li>
              <li>Kiểm tra Console để xem chi tiết quá trình chuyển đổi, nén và upload</li>
            </ul>
          }
          type="info"
          showIcon
          className="mb-6"
        />

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Upload Button */}
          <div>
            <input
              type="file"
              accept="image/*,.heic,.heif"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="file-input"
            />
            <label htmlFor="file-input">
              <Button
                type="primary"
                icon={<UploadOutlined />}
                loading={uploading}
                disabled={uploading}
                size="large"
                onClick={() => document.getElementById('file-input')?.click()}
              >
                Chọn ảnh để upload
              </Button>
            </label>
          </div>

          {/* Uploaded Images List */}
          {uploadedImages.length > 0 && (
            <div>
              <Title level={4}>Ảnh đã upload ({uploadedImages.length})</Title>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uploadedImages.map((img, index) => (
                  <Card
                    key={img.id}
                    hoverable
                    cover={
                      <Image
                        alt={img.name}
                        src={img.url}
                        style={{ height: 200, objectFit: 'cover' }}
                      />
                    }
                  >
                    <Card.Meta
                      title={img.name}
                      description={
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <Text type="secondary">
                            <strong>Public ID:</strong> {img.public_id}
                          </Text>
                          <Text type="secondary">
                            <strong>Size:</strong> {(img.size / 1024).toFixed(2)} KB
                          </Text>
                          <Text type="secondary">
                            <strong>Type:</strong> {img.type}
                          </Text>
                          <Button
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(img.public_id, index)}
                            block
                          >
                            Xóa
                          </Button>
                        </Space>
                      }
                    />
                  </Card>
                ))}
              </div>
            </div>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default UploadTestPage;
