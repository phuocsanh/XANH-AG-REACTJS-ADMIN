import React, { useState, useRef } from 'react';
import { Button, message, Spin, Image } from 'antd';
import { CameraOutlined, FileImageOutlined, LoadingOutlined } from '@ant-design/icons';
import { productComparisonService, fileToBase64, validateImageFile } from '@/services/product-comparison.service';
import heic2any from 'heic2any';

/**
 * Interface cho dữ liệu trích xuất từ ảnh
 */
export interface ExtractedProductData {
  name?: string;
  trade_name?: string; // Hiệu thuốc / Tên thương mại
  volume?: string; // Dung tích/Khối lượng
  notes?: string; // Ghi chú tự động
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
  const [uploadingImages, setUploadingImages] = useState(false); // Loading khi đang upload ảnh
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
        trade_name: result.trade_name, // Hiệu thuốc
        volume: result.volume, // Dung tích
        active_ingredient: result.active_ingredient,
        concentration: result.concentration,
        manufacturer: result.manufacturer,
        usage: result.usage,
        description: result.usage, // Sử dụng usage làm description fallback
        details: result.details,    // Truyền thêm chi tiết
        notes: result.notes, // Ghi chú tự động
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
    const imageFiles: File[] = [];

    // Collect tất cả image files từ clipboard
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }
    
    if (imageFiles.length > 0) {
      e.preventDefault();
      setUploadingImages(true);
      try {
        // Xử lý tất cả ảnh song song
        await Promise.all(imageFiles.map(file => handleFileSelect(file)));
        message.success(`Đã thêm ${imageFiles.length} ảnh từ clipboard`);
      } finally {
        setUploadingImages(false);
      }
    }
  };

  /**
   * Xử lý khi người dùng chọn file
   * Hỗ trợ HEIC/HEIF từ iPhone
   */
  const handleFileSelect = async (file: File) => {
    // Validate file
    if (!validateImageFile(file)) {
      message.error('File không hợp lệ hoặc quá lớn (tối đa 5MB)');
      return;
    }

    try {
      let fileToProcess = file;

      // Convert HEIC/HEIF sang JPEG nếu cần
      if (file.type === 'image/heic' || file.type === 'image/heif' || 
          file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
        console.log('📱 Đang chuyển đổi ảnh HEIC/HEIF...');
        message.loading({ content: 'Đang xử lý ảnh iPhone...', key: 'heic-convert', duration: 0 });
        
        try {
          const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.9,
          });

          const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
          fileToProcess = new File(
            [blob], 
            file.name.replace(/\.(heic|heif)$/i, '.jpg'),
            { type: 'image/jpeg' }
          );
          
          message.success({ content: 'Chuyển đổi ảnh thành công!', key: 'heic-convert', duration: 1 });
        } catch (heicError) {
          console.error('❌ Lỗi chuyển đổi HEIC:', heicError);
          message.error({ content: 'Không thể chuyển đổi ảnh HEIC', key: 'heic-convert' });
          return;
        }
      }

      const base64 = await fileToBase64(fileToProcess);
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
      setUploadingImages(true);
      try {
        // Xử lý tất cả files song song
        await Promise.all(Array.from(files).map(file => handleFileSelect(file)));
      } finally {
        setUploadingImages(false);
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

  const isLoading = analyzing || externalLoading || uploadingImages;

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
            {uploadingImages && (
              <>
                <Spin indicator={<LoadingOutlined style={{ fontSize: 14 }} spin />} />
                <span className="text-blue-600 text-xs">Đang tải ảnh...</span>
              </>
            )}
            {analyzing && (
              <>
                <Spin indicator={<LoadingOutlined style={{ fontSize: 14 }} spin />} />
                <span className="text-blue-600 text-xs">Đang phân tích...</span>
              </>
            )}
          </div>
        </div>

        {/* Image Grid */}
        {images.length > 0 && (
          <Image.PreviewGroup>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {images.map((img, idx) => (
                <div 
                  key={idx} 
                  className="relative group aspect-square border rounded-lg overflow-hidden bg-gray-50 hover:shadow-lg transition-all duration-200"
                  title="Click để xem ảnh lớn"
                >
                  <Image
                    src={img}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full object-cover cursor-pointer"
                    preview={{
                      mask: (
                        <div className="flex flex-col items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                          <span className="text-xs">Xem lớn</span>
                        </div>
                      ),
                    }}
                    style={{ objectFit: 'cover' }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(idx);
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600"
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
          </Image.PreviewGroup>
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
            accept="image/jpeg,image/jpg,image/png,image/webp,.heic,.heif"
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
             * Click vào khung để dán ảnh (Ctrl+V). <strong>Click vào ảnh để xem phóng to.</strong> Nhấn &quot;Trích xuất thông tin&quot; để AI xử lý.
         </div>
      </div>
    </div>
  );
};

export default ImageAnalyzer;
