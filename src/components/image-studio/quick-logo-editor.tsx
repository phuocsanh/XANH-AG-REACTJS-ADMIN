import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Card, Slider, Typography, message, Tag, Alert } from 'antd';
import { 
  DownloadOutlined, 
  DragOutlined, 
  ExpandOutlined,
  PictureOutlined,
  DeleteOutlined,
  CloudUploadOutlined
} from '@ant-design/icons';
import logo3 from '@/assets/images/logo3.png';

const { Text } = Typography;

interface QuickLogoEditorProps {
  onSave?: (file: File) => Promise<void>;
}

/**
 * Component "Quick Logo Editor" cho phép upload ảnh, tự động chèn logo Xanh AG,
 * kéo thả logo trực tiếp trên canvas và thay đổi kích thước logo bằng thanh trượt.
 * Hỗ trợ tải về máy hoặc lưu vào hệ thống.
 */
const QuickLogoEditor: React.FC<QuickLogoEditorProps> = ({ onSave }) => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [logoScale, setLogoScale] = useState(0.15); // Scale logo mặc định
  const [logoX, setLogoX] = useState(100);
  const [logoY, setLogoY] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 1000 });
  const [isUploading, setIsUploading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);

  /**
   * Xử lý ảnh (dùng chung cho upload, paste, drag & drop)
   */
  const processImageUrl = useCallback((url: string) => {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      imageRef.current = img;
      setOriginalImage(url);
      setCanvasSize({ width: img.width, height: img.height });
      
      // Reset vị trí logo về góc dưới phải
      setLogoX(img.width * 0.85);
      setLogoY(img.height * 0.85);
    };
  }, []);

  // Lắng nghe sự kiện dán ảnh (Paste)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = (items[i] as DataTransferItem).getAsFile();
          if (blob) {
            const url = URL.createObjectURL(blob);
            processImageUrl(url);
            message.success('Đã dán ảnh từ clipboard!');
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [processImageUrl]);

  // Load logo once
  useEffect(() => {
    const img = new Image();
    img.src = logo3;
    img.onload = () => {
      logoRef.current = img;
      if (originalImage) draw();
    };
  }, [originalImage]);

  // Xử lý upload ảnh gốc qua input file
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      processImageUrl(url);
    }
  };

  const draw = useCallback(() => {
    if (!canvasRef.current || !imageRef.current || !logoRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. Draw original image
    ctx.drawImage(imageRef.current, 0, 0);

    // 2. Draw logo
    const lImg = logoRef.current;
    const lWidth = (canvas.width * logoScale);
    const lHeight = lWidth * (lImg.height / lImg.width);

    ctx.save();
    ctx.drawImage(
      lImg,
      logoX - lWidth / 2,
      logoY - lHeight / 2,
      lWidth,
      lHeight
    );
    ctx.restore();
  }, [logoScale, logoX, logoY]);

  useEffect(() => {
    draw();
  }, [draw, originalImage]);

  // Xử lý kéo thả (Dùng tọa độ canvas gốc)
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!originalImage || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasSize.width / rect.width;
    const scaleY = canvasSize.height / rect.height;
    
    let clientX, clientY;
    if ('touches' in e) {
        clientX = (e as React.TouchEvent).touches[0].clientX;
        clientY = (e as React.TouchEvent).touches[0].clientY;
    } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    }

    const mouseX = (clientX - rect.left) * scaleX;
    const mouseY = (clientY - rect.top) * scaleY;

    // Kiểm tra xem có click trúng logo không
    const lImg = logoRef.current!;
    const lWidth = (canvasSize.width * logoScale);
    const lHeight = lWidth * (lImg.height / lImg.width);

    if (
      mouseX >= logoX - lWidth / 2 &&
      mouseX <= logoX + lWidth / 2 &&
      mouseY >= logoY - lHeight / 2 &&
      mouseY <= logoY + lHeight / 2
    ) {
      setIsDragging(true);
      setDragOffset({
        x: mouseX - logoX,
        y: mouseY - logoY
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasSize.width / rect.width;
    const scaleY = canvasSize.height / rect.height;

    let clientX, clientY;
    if ('touches' in e) {
        clientX = (e as React.TouchEvent).touches[0].clientX;
        clientY = (e as React.TouchEvent).touches[0].clientY;
    } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    }

    const mouseX = (clientX - rect.left) * scaleX;
    const mouseY = (clientY - rect.top) * scaleY;

    // Cập nhật vị trí logo
    setLogoX(mouseX - dragOffset.x);
    setLogoY(mouseY - dragOffset.y);
  };

  const handleMouseUp = () => setIsDragging(false);

  const downloadImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `xanh-ag-logo-${Date.now()}.jpg`;
    link.href = canvasRef.current.toDataURL('image/jpeg', 0.95);
    link.click();
    message.success('Đã tải ảnh về máy!');
  };

  const saveToSystem = async () => {
    if (!canvasRef.current || !onSave) return;
    try {
        setIsUploading(true);
        const blob = await new Promise<Blob | null>(resolve => canvasRef.current?.toBlob(resolve, 'image/jpeg', 0.95));
        if (blob) {
            const file = new File([blob], `quick-edit-${Date.now()}.jpg`, { type: 'image/jpeg' });
            await onSave(file);
        }
    } finally {
        setIsUploading(false);
    }
  };

  return (
    <Card 
        title={<div className="flex items-center gap-2"><ExpandOutlined className="text-green-600" /> Quick Logo Editor</div>}
        className="shadow-sm"
    >
      {!originalImage ? (
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-green-500 hover:bg-green-50 transition-all cursor-pointer relative">
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleUpload} 
            className="absolute inset-0 opacity-0 cursor-pointer" 
          />
          <PictureOutlined className="text-5xl text-gray-300 mb-4" />
          <div className="text-lg font-medium text-gray-600">Chọn ảnh gốc để thêm logo</div>
          <div className="text-sm text-gray-400 mt-2">Hỗ trợ JPG, PNG, WEBP, HEIC...</div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Editor Area */}
          <div className="lg:col-span-3">
            <div 
                className="relative bg-gray-100 rounded-lg overflow-hidden border border-gray-200 cursor-move"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchMove={handleMouseMove}
                onTouchEnd={handleMouseUp}
            >
              <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                style={{ 
                    width: '100%', 
                    height: 'auto', 
                    display: 'block' 
                }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleMouseDown}
              />
              <div className="absolute top-2 left-2 pointer-events-none">
                <Tag color="green" icon={<DragOutlined />}>Kéo logo để di chuyển</Tag>
              </div>
            </div>
          </div>

          {/* Controls Area */}
          <div className="space-y-6">
            <div>
              <Text strong className="block mb-2"><ExpandOutlined className="mr-1" /> Kích thước Logo</Text>
              <Slider 
                min={0.01} 
                max={0.5} 
                step={0.01} 
                value={logoScale} 
                onChange={setLogoScale}
                tooltip={{ formatter: (v) => `${Math.round((v || 0) * 100)}%` }}
              />
            </div>

            <Alert 
              message="Mẹo" 
              description="Bạn có thể dùng chuột hoặc ngón tay kéo trực tiếp logo trên ảnh để thay đổi vị trí."
              type="info"
              showIcon
              className="bg-blue-50"
            />

            <div className="flex flex-col gap-3 pt-4 border-t">
              <Button 
                type="primary" 
                icon={<DownloadOutlined />} 
                onClick={downloadImage}
                size="large"
                className="bg-green-600 hover:bg-green-700 h-12 text-lg font-bold"
              >
                Tải về máy
              </Button>

              {onSave && (
                <Button 
                  icon={<CloudUploadOutlined />} 
                  onClick={saveToSystem}
                  loading={isUploading}
                  size="large"
                  className="h-12"
                >
                  Lưu vào hệ thống
                </Button>
              )}

              <Button 
                danger 
                icon={<DeleteOutlined />} 
                onClick={() => {
                  setOriginalImage(null);
                  imageRef.current = null;
                }}
              >
                Chọn ảnh khác
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default QuickLogoEditor;
