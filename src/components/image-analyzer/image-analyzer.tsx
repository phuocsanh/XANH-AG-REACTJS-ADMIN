import React, { useState, useRef } from 'react';
import { Button, message, Spin } from 'antd';
import { CameraOutlined, FileImageOutlined, LoadingOutlined } from '@ant-design/icons';
import { productComparisonService, fileToBase64, validateImageFile } from '@/services/product-comparison.service';

/**
 * Interface cho dữ liệu trích xuất từ ảnh
 */
export interface ExtractedProductData {
  name?: string;
  active_ingredient?: string;
  concentration?: string;
  manufacturer?: string;
  usage?: string;
  description?: string;
  details?: {
    usage?: string;
    dosage?: string;
    application_time?: string;
    preharvest_interval?: string;
    notes?: string;
  };
}

/**
 * Props cho ImageAnalyzer component
 */
interface ImageAnalyzerProps {
  onDataExtracted: (data: ExtractedProductData) => void;
  loading?: boolean;
}

/**
 * Component phân tích hình ảnh sản phẩm bằng AI
 * Hỗ trợ upload file và paste từ clipboard
 */
const ImageAnalyzer: React.FC<ImageAnalyzerProps> = ({ onDataExtracted, loading: externalLoading }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Xử lý phân tích ảnh bằng AI
   */
  const handleAnalyze = async () => {
    if (images.length === 0) {
      message.warning('Vui lòng chọn hoặc dán ít nhất 1 ảnh để phân tích');
      return;
    }

    try {
      setAnalyzing(true);
      message.loading({ content: 'Đang phân tích hình ảnh...', key: 'analyzing', duration: 0 });

      // Gọi service với danh sách ảnh hiện tại (API đã update hỗ trợ string[])
      const result = await productComparisonService.analyzeImage(images);
      
      message.success({ content: 'Phân tích thành công!', key: 'analyzing', duration: 2 });
      
      // Gọi callback với dữ liệu đã trích xuất
      onDataExtracted({
        name: result.name,
        active_ingredient: result.active_ingredient,
        concentration: result.concentration,
        manufacturer: result.manufacturer,
        usage: result.usage,
        description: result.usage, // Sử dụng usage làm description fallback
        details: result.details,    // Truyền thêm chi tiết
      });

    } catch (error) {
      console.error('Error analyzing image:', error);
      message.error({ content: 'Không thể phân tích hình ảnh. Vui lòng thử lại.', key: 'analyzing' });
    } finally {
      setAnalyzing(false);
    }
  };

  /**
   * Xử lý khi người dùng dán ảnh từ clipboard
   */
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    let hasImage = false;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          hasImage = true;
          await handleFileSelect(file);
        }
      }
    }
    
    if (hasImage) {
       message.success('Đã thêm ảnh từ clipboard');
       e.preventDefault();
    }
  };

  /**
   * Xử lý khi người dùng chọn file
   */
  const handleFileSelect = async (file: File) => {
    // Validate file
    if (!validateImageFile(file)) {
      message.error('File không hợp lệ hoặc quá lớn (tối đa 5MB)');
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setImages(prev => [...prev, base64]);
    } catch (error) {
      console.error('Error converting file to base64:', error);
      message.error('Lỗi khi xử lý file ảnh');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        await handleFileSelect(files[i]);
      }
    }
    // Reset input value để cho phép chọn lại file cũ nếu muốn
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const isLoading = analyzing || externalLoading;

  return (
    <div 
      className="mb-4 pb-4 border-b border-gray-200"
      onPaste={handlePaste}
      tabIndex={0}
      style={{ 
        pointerEvents: isLoading ? 'none' : 'auto',
        opacity: isLoading ? 0.7 : 1
      }}
    >
      <div className="flex flex-col gap-4">
        {/* Header & Upload Button */}
        <div className="flex items-center justify-between">
           <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
            Trích xuất thông tin từ hình ảnh ({images.length} ảnh)
            {isLoading && <Spin indicator={<LoadingOutlined style={{ fontSize: 14 }} spin />} />}
          </div>
        </div>

        {/* Image Grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {images.map((img, idx) => (
              <div key={idx} className="relative group aspect-square border rounded-lg overflow-hidden bg-gray-50">
                <img 
                  src={img} 
                  alt={`Preview ${idx + 1}`} 
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Xóa ảnh"
                  type="button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            
            {/* Nút thêm ảnh nhỏ gọn trong grid nếu cần */}
             <div 
              className="flex items-center justify-center aspect-square border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors bg-gray-50"
              onClick={handleUploadClick}
            >
               <CameraOutlined className="text-xl text-gray-400" />
            </div>
          </div>
        )}

        {/* Empty State / Upload Area */}
        {images.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-4 text-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <div className="text-2xl text-gray-400">
              <FileImageOutlined />
            </div>
            <div className="text-xs text-gray-600">
              Nhấn <strong>Ctrl+V</strong> để dán ảnh hoặc
            </div>
            <Button 
                type="primary" 
                icon={<CameraOutlined />}
                onClick={handleUploadClick}
                disabled={isLoading}
                size="small"
                ghost
            >
                Chọn ảnh
            </Button>
          </div>
        )}
        
        {/* Hidden Input */}
        <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple // Cho phép chọn nhiều file
            style={{ display: 'none' }}
            onChange={handleInputChange}
            disabled={isLoading}
        />

        {/* Analyze Button */}
        {images.length > 0 && (
            <div className="flex justify-end">
                <Button 
                    type="primary"
                    onClick={handleAnalyze}
                    loading={isLoading}
                    disabled={images.length === 0}
                    icon={analyzing ? <LoadingOutlined /> : <FileImageOutlined />}
                >
                    {analyzing ? 'Đang phân tích...' : 'Trích xuất thông tin'}
                </Button>
            </div>
        )}
        
         {/* Helper Text */}
         <div className="text-xs text-gray-400 mt-[-8px]">
             * Click vào khung để dán ảnh (Ctrl+V). Nhấn "Trích xuất thông tin" để AI xử lý lại nếu cần.
         </div>
      </div>
    </div>
  );
};

export default ImageAnalyzer;
