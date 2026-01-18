
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Modal, Button, Upload, message, Spin, Space, Slider, Alert, Input, Select } from 'antd';
import { CameraOutlined, SaveOutlined, UndoOutlined, CopyOutlined, FontSizeOutlined, DeleteOutlined, SmileOutlined } from '@ant-design/icons';
import { Sparkles, X } from 'lucide-react';
import { removeBackground } from '@imgly/background-removal';
import heic2any from 'heic2any';
import bgSanPham from '@/assets/images/bg-san-pham.png';
import logo3 from '@/assets/images/logo3.png';

interface ImageStudioProps {
  visible: boolean;
  onCancel: () => void;
  onSave: (file: File) => void;
}

const ImageStudio: React.FC<ImageStudioProps> = ({ visible, onCancel, onSave }) => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  
  // Camera states
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // States for adjusting product position/scale
  const [scale, setScale] = useState(0.18);
  const [positionX, setPositionX] = useState(500); 
  const [positionY, setPositionY] = useState(550); 
  
  // Canvas size states
  const [canvasWidth, setCanvasWidth] = useState(1000);
  const [canvasHeight, setCanvasHeight] = useState(1000);
  
  // Logo watermark states
  const [showLogo, setShowLogo] = useState(true);
  const [logoScale, setLogoScale] = useState(0.15);
  const [logoX, setLogoX] = useState(850);
  const [logoY, setLogoY] = useState(850);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Text and Emoji states
  interface OverlayItem {
    id: string;
    text: string;
    x: number;
    y: number;
    size: number;
    color: string;
    font: string;
    type: 'text' | 'emoji';
  }
  const [overlayItems, setOverlayItems] = useState<OverlayItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isDraggingItem, setIsDraggingItem] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Cleanup Object URLs
  useEffect(() => {
    return () => {
      if (originalImage?.startsWith('blob:')) URL.revokeObjectURL(originalImage);
    };
  }, [originalImage]);

  useEffect(() => {
    return () => {
      if (processedImage?.startsWith('blob:')) URL.revokeObjectURL(processedImage);
    };
  }, [processedImage]);

  // Handle file/blob selection
  const processNewFile = async (file: File | Blob, fileName: string = 'image.jpg') => {
    setLoading(true);
    setLoadingText('Đang xử lý ảnh...');
    
    try {
      let fileToProcess: File;
      if (file instanceof File) {
        fileToProcess = file;
      } else {
        fileToProcess = new File([file], fileName, { type: file.type });
      }

      // Handle HEIC/HEIF
      if (fileToProcess.type === 'image/heic' || fileToProcess.type === 'image/heif' || 
          fileToProcess.name.toLowerCase().endsWith('.heic') || fileToProcess.name.toLowerCase().endsWith('.heif')) {
        setLoadingText('Đang chuyển đổi định dạng ảnh iPhone...');
        try {
          const blob = await heic2any({
            blob: fileToProcess,
            toType: 'image/jpeg',
            quality: 0.8,
          });
          const convertedBlob = Array.isArray(blob) ? blob[0] : blob;
          fileToProcess = new File(
            [convertedBlob], 
            fileToProcess.name.replace(/\.(heic|heif)$/i, '.jpg'),
            { type: 'image/jpeg' }
          );
        } catch (heicError) {
          console.error('❌ HEIC conversion error:', heicError);
          message.error('Không thể xử lý định dạng ảnh này');
          setLoading(false);
          return;
        }
      }

      const url = URL.createObjectURL(fileToProcess);
      setOriginalImage(url);
      setProcessedImage(null);
    } catch (error) {
      console.error('❌ Error handling file:', error);
      message.error('Có lỗi xảy ra khi đọc file');
    } finally {
      setLoading(false);
    }
  };

  // Handle Pasteur/Paste from clipboard
  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (!visible || originalImage) return;
    
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            processNewFile(blob, 'pasted-image.png');
            message.success('Đã dán ảnh từ clipboard!');
            break;
          }
        }
      }
    }
  }, [visible, originalImage]);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  // Phím tắt xóa item
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!visible || !selectedItemId) return;
      
      // Nếu đang focus vào input thì không xóa (tránh xóa nhầm khi đang gõ)
      if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        removeItem(selectedItemId);
        message.info('Đã xóa đối tượng');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, selectedItemId, overlayItems]);

  // Camera logic
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Prioritize back camera for mobile
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      message.error('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            processNewFile(blob, 'captured-photo.jpg');
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  // Reset states when modal is closed
  useEffect(() => {
    if (!visible) {
      setOriginalImage(null);
      setProcessedImage(null);
      setLoading(false);
      stopCamera();
    } else {
      setScale(0.18);
      setPositionX(500);
      setPositionY(550);
    }
  }, [visible]);

  // Canvas drawing
  useEffect(() => {
    if (!visible || !canvasRef.current || (!originalImage && !processedImage)) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bgImg = new window.Image();
    const productImg = new window.Image();
    const logoImg = new window.Image();

    bgImg.src = bgSanPham;
    productImg.src = (processedImage || originalImage) as string;
    logoImg.src = logo3;

    const draw = () => {
      if (bgImg.complete && productImg.complete) {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.drawImage(bgImg, 0, 0, canvasWidth, canvasHeight);
        
        const pWidth = productImg.width;
        const pHeight = productImg.height;
        const displayWidth = pWidth * scale;
        const displayHeight = pHeight * scale;

        if (!processedImage) ctx.globalAlpha = 0.5;

        ctx.drawImage(
          productImg,
          positionX - displayWidth / 2,
          positionY - displayHeight / 2,
          displayWidth,
          displayHeight
        );
        
        ctx.globalAlpha = 1.0;

        // Draw logo watermark
        if (showLogo && logoImg.complete) {
          const logoWidth = logoImg.width * logoScale;
          const logoHeight = logoImg.height * logoScale;
          ctx.drawImage(
            logoImg,
            logoX - logoWidth / 2,
            logoY - logoHeight / 2,
            logoWidth,
            logoHeight
          );
        }

        // Draw overlay items (Text and Emojis)
        overlayItems.forEach(item => {
          ctx.fillStyle = item.color;
          ctx.font = `${item.size}px ${item.font}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          if (item.id === selectedItemId) {
            // Draw a subtle border around selected item
            const metrics = ctx.measureText(item.text);
            const w = metrics.width + 10;
            const h = item.size + 10;
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.strokeRect(item.x - w / 2, item.y - h / 2, w, h);
          }
          
          ctx.fillText(item.text, item.x, item.y);
        });
      }
    };

    bgImg.onload = draw;
    productImg.onload = draw;
    logoImg.onload = draw;
    draw();

  }, [visible, originalImage, processedImage, scale, positionX, positionY, canvasWidth, canvasHeight, showLogo, logoScale, logoX, logoY, overlayItems, selectedItemId]);

  // AI Background Removal
  const processAI = async () => {
    if (!originalImage) return;
    try {
      setLoading(true);
      setLoadingText('Đang thêm nền bằng AI...');
      const blob = await removeBackground(originalImage, {
        progress: (status, progress) => {
          if (status === 'compute') setLoadingText(`Đang tách nền... ${Math.round(progress * 100)}%`);
        }
      });
      const url = URL.createObjectURL(blob);
      setProcessedImage(url);
      message.success('Tách nền thành công!');
    } catch (error) {
      console.error('AI error:', error);
      message.error('Lỗi tách nền.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'product-ai.png', { type: 'image/png' });
        onSave(file);
        onCancel();
      }
    }, 'image/png');
  };

  // Copy ảnh vào clipboard
  const handleCopyImage = async () => {
    if (!canvasRef.current) return;
    try {
      const blob = await new Promise<Blob>((resolve) => {
        canvasRef.current!.toBlob((b) => b && resolve(b), 'image/png');
      });
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      message.success('Đã copy ảnh vào clipboard!');
    } catch (error) {
      console.error('Copy error:', error);
      message.error('Không thể copy ảnh');
    }
  };

  // Download ảnh
  const handleDownload = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `product-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        message.success('Đã tải ảnh xuống!');
      }
    }, 'image/png');
  };

  // Thêm text mới
  const addText = () => {
    const newItem: OverlayItem = {
      id: Date.now().toString(),
      text: 'NHẬP CHỮ VÀO ĐÂY',
      x: canvasWidth / 2,
      y: canvasHeight / 2,
      size: 60,
      color: '#000000',
      font: 'Arial',
      type: 'text'
    };
    setOverlayItems([...overlayItems, newItem]);
    setSelectedItemId(newItem.id);
  };

  // Thêm emoji
  const addEmoji = (emoji: string) => {
    const newItem: OverlayItem = {
      id: Date.now().toString(),
      text: emoji,
      x: canvasWidth / 2,
      y: canvasHeight / 2,
      size: 100,
      color: '#000000',
      font: 'Arial',
      type: 'emoji'
    };
    setOverlayItems([...overlayItems, newItem]);
    setSelectedItemId(newItem.id);
  };

  // Cập nhật item
  const updateItem = (id: string, updates: Partial<OverlayItem>) => {
    setOverlayItems(overlayItems.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  // Xóa item
  const removeItem = (id: string) => {
    setOverlayItems(overlayItems.filter(item => item.id !== id));
    if (selectedItemId === id) setSelectedItemId(null);
  };

  return (
    <Modal
      title={<div className="flex items-center gap-2 font-bold"><Sparkles className="w-5 h-5 text-green-600" /> AI IMAGE STUDIO</div>}
      open={visible}
      onCancel={onCancel}
      width={1200}
      centered
      footer={[
        <Button key="cancel" onClick={onCancel} size="large">Hủy</Button>,
        <Button 
          key="copy" 
          icon={<CopyOutlined />} 
          disabled={!processedImage}
          onClick={handleCopyImage}
          size="large"
        >
          Copy ảnh
        </Button>,
        <Button 
          key="download" 
          icon={<SaveOutlined />} 
          disabled={!processedImage}
          onClick={handleDownload}
          size="large"
        >
          Tải xuống
        </Button>,
        <Button 
          key="save" 
          type="primary" 
          icon={<SaveOutlined />} 
          disabled={!processedImage}
          onClick={handleSave}
          size="large"
          className="bg-green-600 hover:bg-green-700 h-auto py-2 px-8"
        >
          XONG & LƯU VÀO SẢN PHẨM
        </Button>
      ]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <h4 className="font-bold text-[11px] mb-3 text-gray-400 uppercase tracking-widest">1. Nhập ảnh sản phẩm</h4>
            
            <div className="space-y-4">
              {/* Preview of current photo if exists */}
              {originalImage && (
                <div className="text-center">
                  <div className="mb-3 relative group rounded overflow-hidden shadow-sm border">
                    <img src={originalImage} alt="Original" className="w-full h-32 object-contain bg-gray-50" />
                    <div className="absolute top-2 right-2">
                       <Button 
                        size="small" 
                        shape="circle" 
                        icon={<X size={14} />} 
                        onClick={() => { setOriginalImage(null); setProcessedImage(null); }} 
                        danger 
                       />
                    </div>
                  </div>

                  {!processedImage && (
                    <Button 
                      type="primary" 
                      icon={<Sparkles className="w-4 h-4" />} 
                      loading={loading}
                      onClick={processAI}
                      block
                      className="bg-blue-600 hover:bg-blue-700 h-10 font-bold shadow-lg shadow-blue-200 mb-4"
                    >
                      Thêm nền cho ảnh
                    </Button>
                  )}
                </div>
              )}

              {/* Input section - Always visible or toggle with Camera */}
              <div className="space-y-3">
                {showCamera ? (
                  <div className="relative rounded-lg overflow-hidden border-2 border-blue-500">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-48 object-cover bg-black" />
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
                       <Button shape="circle" icon={<X size={16} />} onClick={stopCamera} danger />
                       <Button type="primary" shape="circle" icon={<CameraOutlined />} onClick={capturePhoto} size="large" />
                    </div>
                  </div>
                ) : (
                  <>
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <Upload 
                      beforeUpload={(file) => { processNewFile(file); return false; }}
                      showUploadList={false}
                      accept="image/*"
                      style={{ display: 'block', width: '100%' }}
                    >
                      <Button 
                        icon={<CameraOutlined />} 
                        block 
                        className="text-[10px] h-10 font-bold uppercase border-dashed border-2 border-blue-200 bg-blue-50/30"
                      >
                        CHỌN FILE
                      </Button>
                    </Upload>
                    
                    
                    <Upload 
                      beforeUpload={(file) => { processNewFile(file); return false; }}
                      showUploadList={false}
                      accept="image/*"
                      capture="environment"
                      style={{ display: 'block', width: '100%' }}
                    >
                      <Button 
                        icon={<CameraOutlined />} 
                        block 
                        className="text-[10px] h-10 font-bold uppercase"
                      >
                        CHỤP ẢNH
                      </Button>
                    </Upload>
                  </div>
                    
                    {!originalImage && (
                      <Alert 
                        message={<span className="text-[10px]">Bạn có thể copy ảnh rồi nhấn <b>Ctrl+V</b> để dán nhanh!</span>}
                        type="info"
                        className="py-1 px-2"
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {processedImage && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border shadow-sm border-t-4 border-t-green-500">
                <h4 className="font-bold text-[11px] mb-4 text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  2. Căn chỉnh vị trí
                </h4>
                
                <div className="space-y-6">
                  {/* Canvas Size Controls */}
                  <div className="pb-4 border-b border-gray-200">
                    <div className="text-[11px] font-bold mb-3 text-gray-600">KÍCH THƯỚC ẢNH (PX)</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-1">Rộng</label>
                        <input 
                          type="number" 
                          value={canvasWidth}
                          onChange={(e) => setCanvasWidth(Math.max(100, parseInt(e.target.value) || 1000))}
                          className="w-full px-2 py-1 border rounded text-sm"
                          min="100"
                          max="3000"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-1">Cao</label>
                        <input 
                          type="number" 
                          value={canvasHeight}
                          onChange={(e) => setCanvasHeight(Math.max(100, parseInt(e.target.value) || 1000))}
                          className="w-full px-2 py-1 border rounded text-sm"
                          min="100"
                          max="3000"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-bold mb-2">
                      <span>TO / NHỎ</span>
                      <span className="text-blue-600 font-mono">{Math.round(scale * 100)}%</span>
                    </div>
                    <Slider min={0.1} max={1.5} step={0.01} value={scale} onChange={setScale} />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-bold mb-2 uppercase"><span>Lên / Xuống</span></div>
                    <Slider min={0} max={canvasHeight} value={positionY} onChange={setPositionY} />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-bold mb-2 uppercase"><span>Trái / Phải</span></div>
                    <Slider min={0} max={canvasWidth} value={positionX} onChange={setPositionX} />
                  </div>

                  {/* Logo Watermark Controls */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold text-gray-600">LOGO THƯƠNG HIỆU</span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={showLogo}
                          onChange={(e) => setShowLogo(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-[10px]">Hiển thị</span>
                      </label>
                    </div>
                    
                    {showLogo && (
                      <div>
                        <div className="flex justify-between text-[11px] font-bold mb-2">
                          <span>Kích thước logo</span>
                          <span className="text-blue-600 font-mono">{Math.round(logoScale * 100)}%</span>
                        </div>
                        <Slider min={0.05} max={0.5} step={0.01} value={logoScale} onChange={setLogoScale} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Text & Emoji Controls */}
              <div className="bg-white p-4 rounded-xl border shadow-sm border-t-4 border-t-blue-500">
                <h4 className="font-bold text-[11px] mb-4 text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  3. Thêm nội dung
                </h4>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button icon={<FontSizeOutlined />} onClick={addText} block size="small">Thêm Chữ</Button>
                    <Button icon={<SmileOutlined />} onClick={() => addEmoji('🌾')} block size="small">Thêm Emoji</Button>
                  </div>

                  {selectedItemId && overlayItems.find(i => i.id === selectedItemId) && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-blue-600 uppercase">Đang chỉnh sửa</span>
                        <Button 
                          type="text" 
                          danger 
                          icon={<DeleteOutlined />} 
                          size="small" 
                          onClick={() => removeItem(selectedItemId)} 
                        />
                      </div>

                      {overlayItems.find(i => i.id === selectedItemId)?.type === 'text' && (
                        <Input 
                          value={overlayItems.find(i => i.id === selectedItemId)?.text}
                          onChange={(e) => updateItem(selectedItemId, { text: e.target.value })}
                          placeholder="Nhập nội dung..."
                        />
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] text-gray-500 block mb-1 uppercase">Màu sắc</label>
                          <input 
                            type="color" 
                            className="w-full h-8 p-0 border-0 bg-transparent cursor-pointer"
                            value={overlayItems.find(i => i.id === selectedItemId)?.color}
                            onChange={(e) => updateItem(selectedItemId, { color: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-gray-500 block mb-1 uppercase">Cỡ chữ</label>
                          <Slider 
                            min={10} 
                            max={200} 
                            value={overlayItems.find(i => i.id === selectedItemId)?.size} 
                            onChange={(val) => updateItem(selectedItemId, { size: val })}
                          />
                        </div>
                      </div>

                      {overlayItems.find(i => i.id === selectedItemId)?.type === 'text' && (
                        <div>
                          <label className="text-[9px] text-gray-500 block mb-1 uppercase">Phông chữ</label>
                          <Select 
                            className="w-full" 
                            size="small"
                            value={overlayItems.find(i => i.id === selectedItemId)?.font}
                            onChange={(val) => updateItem(selectedItemId, { font: val })}
                          >
                            <Select.Option value="Arial">Arial</Select.Option>
                            <Select.Option value="Times New Roman">Times New Roman</Select.Option>
                            <Select.Option value="Courier New">Courier New</Select.Option>
                            <Select.Option value="Verdana">Verdana</Select.Option>
                            <Select.Option value="Impact">Impact</Select.Option>
                          </Select>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                    {['🌾', '🌱', '🍃', '🌿', '🍂', '🍁', '🍄', '🍅', '🥦', '🌽', '🍋', '🍎', '🍐', '🍑', '🍒', '🍓', '🎁', '⭐', '🔥', '💯', '✅', '🆕', '💥', '💰'].map(emoji => (
                      <button 
                        key={emoji} 
                        className="text-xl hover:scale-125 transition-transform"
                        onClick={() => addEmoji(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  
                  <div className="text-[9px] text-gray-400 mt-2 italic px-2">
                    💡 Chọn Chữ/Emoji rồi nhấn phím <b>Delete</b> hoặc <b>Backspace</b> để xóa nhanh!
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-3 bg-gray-200/50 rounded-2xl flex items-center justify-center p-8 relative overflow-hidden min-h-[650px] border-2 border-dashed border-gray-300 shadow-inner">
          {loading ? (
             <div className="text-center z-10 bg-white/90 p-10 rounded-3xl shadow-2xl backdrop-blur-md border border-white">
                <Spin size="large" />
                <p className="mt-4 font-bold text-blue-600 text-lg animate-pulse">{loadingText}</p>
             </div>
          ) : (originalImage || processedImage) ? (
            <div className="relative group">
              <div className="shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] border-[16px] border-white bg-white rounded-sm overflow-hidden scale-100 transition-transform duration-500">
                <canvas 
                  ref={canvasRef} 
                  width={canvasWidth} 
                  height={canvasHeight} 
                  style={{ 
                    width: `${Math.min(canvasWidth / 2, 500)}px`, 
                    height: `${Math.min(canvasHeight / 2, 500)}px`, 
                    display: 'block',
                    cursor: isDraggingLogo ? 'grabbing' : 'grab'
                  }}
                  onMouseDown={(e) => {
                    if (!showLogo) return;
                    const rect = canvasRef.current!.getBoundingClientRect();
                    const scaleX = canvasWidth / rect.width;
                    const scaleY = canvasHeight / rect.height;
                    const mouseX = (e.clientX - rect.left) * scaleX;
                    const mouseY = (e.clientY - rect.top) * scaleY;
                    
                    // Check if click is on any overlay item first (highest priority)
                    const canvas = canvasRef.current!;
                    const ctx = canvas.getContext('2d')!;
                    
                    for (let i = overlayItems.length - 1; i >= 0; i--) {
                      const item = overlayItems[i];
                      ctx.font = `${item.size}px ${item.font}`;
                      const metrics = ctx.measureText(item.text);
                      const w = metrics.width + 10;
                      const h = item.size + 10;
                      
                      if (
                        mouseX >= item.x - w / 2 &&
                        mouseX <= item.x + w / 2 &&
                        mouseY >= item.y - h / 2 &&
                        mouseY <= item.y + h / 2
                      ) {
                        setIsDraggingItem(true);
                        setSelectedItemId(item.id);
                        setDragOffset({ x: mouseX - item.x, y: mouseY - item.y });
                        return;
                      }
                    }

                    // No overlay item clicked, clear selection
                    setSelectedItemId(null);

                    // Check if click is on logo
                    const logoImg = new window.Image();
                    logoImg.src = logo3;
                    const logoWidth = logoImg.width * logoScale;
                    const logoHeight = logoImg.height * logoScale;
                    
                    if (
                      mouseX >= logoX - logoWidth / 2 &&
                      mouseX <= logoX + logoWidth / 2 &&
                      mouseY >= logoY - logoHeight / 2 &&
                      mouseY <= logoY + logoHeight / 2
                    ) {
                      setIsDraggingLogo(true);
                      setDragOffset({ x: mouseX - logoX, y: mouseY - logoY });
                    }
                  }}
                  onMouseMove={(e) => {
                    const rect = canvasRef.current!.getBoundingClientRect();
                    const scaleX = canvasWidth / rect.width;
                    const scaleY = canvasHeight / rect.height;
                    const mouseX = (e.clientX - rect.left) * scaleX;
                    const mouseY = (e.clientY - rect.top) * scaleY;

                    if (isDraggingItem && selectedItemId) {
                      updateItem(selectedItemId, { 
                        x: mouseX - dragOffset.x, 
                        y: mouseY - dragOffset.y 
                      });
                    } else if (isDraggingLogo && showLogo) {
                      setLogoX(mouseX - dragOffset.x);
                      setLogoY(mouseY - dragOffset.y);
                    }
                  }}
                  onMouseUp={() => {
                    setIsDraggingLogo(false);
                    setIsDraggingItem(false);
                  }}
                  onMouseLeave={() => {
                    setIsDraggingLogo(false);
                    setIsDraggingItem(false);
                  }}
                />
              </div>
              {!processedImage && (
                 <div className="absolute top-4 left-4 bg-orange-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black shadow-xl animate-bounce border-2 border-white">
                    ĐANG XEM TRƯỚC - HÃY TÁCH NỀN!
                 </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-400 space-y-6">
               <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-gray-100">
                  <CameraOutlined style={{ fontSize: 32, color: '#94a3b8' }} />
               </div>
               <div>
                 <p className="text-lg font-black text-gray-500 tracking-tight uppercase">MỜI CHỌN ẢNH SẢN PHẨM</p>
                 <p className="text-xs text-gray-400 mt-1 max-w-[200px] mx-auto leading-relaxed">Studio sẽ tự động giúp bạn tạo ra ảnh quảng cáo chuyên nghiệp 1000x1000 px.</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ImageStudio;
