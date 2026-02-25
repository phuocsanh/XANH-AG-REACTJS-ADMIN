
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Modal, Button, Upload, message, Spin, Space, Slider, Alert, Input, Select, Tooltip } from 'antd';
import { CameraOutlined, SaveOutlined, UndoOutlined, CopyOutlined, FontSizeOutlined, DeleteOutlined, SmileOutlined, PictureOutlined } from '@ant-design/icons';
import { Sparkles, X, Eraser, ShieldCheck, Box, Truck, Award, PackageCheck } from 'lucide-react';
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
    width: number;
    type: 'text' | 'emoji' | 'image' | 'badge';
    imageSrc?: string;
    itemScale?: number;
    opacity?: number;
    icon?: string;
    iconType?: 'emoji' | 'lucide';
    bgColor?: string;
    bgGradient?: string[];
  }
  const [overlayItems, setOverlayItems] = useState<OverlayItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isDraggingItem, setIsDraggingItem] = useState(false);
  const [isResizingItem, setIsResizingItem] = useState(false);
  
  // Templates states
  interface StudioTemplate {
    id: string;
    name: string;
    canvasWidth: number;
    canvasHeight: number;
    scale: number;
    positionX: number;
    positionY: number;
    showLogo: boolean;
    logoScale: number;
    logoX: number;
    logoY: number;
    overlayItems: OverlayItem[];
    isSystem?: boolean;
  }
  interface SavedBadge {
    id: string;
    text: string;
    icon: string;
    iconType: 'emoji' | 'lucide';
    bgColor: string;
    bgGradient?: string[];
    color: string;
    size: number;
  }
  const [userBadges, setUserBadges] = useState<SavedBadge[]>([]);

  const [templates, setTemplates] = useState<StudioTemplate[]>([]);
  
  // Eraser states
  const [isEraserMode, setIsEraserMode] = useState(false);
  const [brushMode, setBrushMode] = useState<'erase' | 'restore'>('erase');
  const [brushSize, setBrushSize] = useState(30);
  const [isErasing, setIsErasing] = useState(false);
  const [eraserTrigger, setEraserTrigger] = useState(0);
  const [maskHistory, setMaskHistory] = useState<string[]>([]);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const isExportingRef = useRef(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoImgRef = useRef<HTMLImageElement | null>(null);

  // Initialize/Reset mask canvas when processed image changes
  useEffect(() => {
    if (processedImage) {
      const img = new window.Image();
      img.src = processedImage;
      img.onload = () => {
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = img.width;
        maskCanvas.height = img.height;
        maskCanvasRef.current = maskCanvas;
        setMaskHistory([]); // Reset history for new image
      };
    } else {
      maskCanvasRef.current = null;
      setMaskHistory([]);
    }
  }, [processedImage]);

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
      
      // Load templates from localStorage
      const savedTemplates = localStorage.getItem('image_studio_templates');
      const systemPresets: StudioTemplate[] = [
        {
          id: 'sys-1',
          name: 'Mẫu chuẩn vuông (Default)',
          canvasWidth: 1000,
          canvasHeight: 1000,
          scale: 0.18,
          positionX: 500,
          positionY: 550,
          showLogo: true,
          logoScale: 0.15,
          logoX: 850,
          logoY: 850,
          overlayItems: [],
          isSystem: true
        },
        {
          id: 'sys-2',
          name: 'Mẫu Banner đứng',
          canvasWidth: 800,
          canvasHeight: 1200,
          scale: 0.15,
          positionX: 400,
          positionY: 700,
          showLogo: true,
          logoScale: 0.18,
          logoX: 400,
          logoY: 200,
          overlayItems: [
            { id: 't1', type: 'text', text: 'NÔNG SẢN XANH', x: 400, y: 100, size: 60, color: '#16a34a', font: 'Impact', width: 600 },
            { id: 't2', type: 'text', text: 'CHẤT LƯỢNG THẬT - GIÁ TRỊ THẬT', x: 400, y: 150, size: 30, color: '#4b5563', font: 'Arial', width: 600 }
          ],
          isSystem: true
        },
        {
          id: 'sys-xanh',
          name: 'Mẫu XANH AG (Dọc)',
          canvasWidth: 800,
          canvasHeight: 1200,
          scale: 0.15,
          positionX: 400,
          positionY: 850,
          showLogo: true,
          logoScale: 0.22,
          logoX: 400,
          logoY: 150,
          overlayItems: [
            { id: 'x-1', type: 'text', text: 'XANH AG', x: 400, y: 280, size: 70, color: '#FFFFFF', font: 'Times New Roman', width: 700 },
            { id: 'x-2', type: 'text', text: 'bạn đồng hành của mọi nhà nông', x: 400, y: 360, size: 40, color: '#FFFFFF', font: 'Arial', width: 700 },
            { id: 'x-3', type: 'text', text: '✅ Cam kết chính hãng', x: 400, y: 500, size: 30, color: '#FFFFFF', font: 'Arial', width: 500 },
            { id: 'x-4', type: 'text', text: '✅ Gói hàng cẩn thận', x: 400, y: 560, size: 30, color: '#FFFFFF', font: 'Arial', width: 500 },
            { id: 'x-5', type: 'text', text: '✅ Giao hàng nhanh chóng', x: 400, y: 620, size: 30, color: '#FFFFFF', font: 'Arial', width: 500 }
          ],
          isSystem: true
        }
      ];
      
      if (savedTemplates) {
        try {
          const parsed = JSON.parse(savedTemplates);
          setTemplates([...systemPresets, ...parsed]);
        } catch (e) {
          setTemplates(systemPresets);
        }
      } else {
        setTemplates(systemPresets);
      }

      // Load user badges
      const savedBadges = localStorage.getItem('image_studio_user_badges');
      if (savedBadges) {
        try {
          setUserBadges(JSON.parse(savedBadges));
        } catch (e) {
          setUserBadges([]);
        }
      }
    }
  }, [visible]);

  const saveCurrentAsTemplate = () => {
    const templateName = prompt('Nhập tên cho mẫu thiết kế này:', `Mẫu thiết kế ${new Date().toLocaleTimeString()}`);
    if (!templateName) return;

    const newTemplate: StudioTemplate = {
      id: Date.now().toString(),
      name: templateName,
      canvasWidth,
      canvasHeight,
      scale,
      positionX,
      positionY,
      showLogo,
      logoScale,
      logoX,
      logoY,
      overlayItems
    };

    const userTemplates = templates.filter(t => !t.isSystem);
    const updated = [...userTemplates, newTemplate];
    localStorage.setItem('image_studio_templates', JSON.stringify(updated));
    setTemplates(prev => [...prev.filter(t => t.isSystem), ...updated]);
    message.success('Đã lưu mẫu thiết kế mới!');
  };

  const applyTemplate = (template: StudioTemplate) => {
    setCanvasWidth(template.canvasWidth);
    setCanvasHeight(template.canvasHeight);
    setScale(template.scale);
    setPositionX(template.positionX);
    setPositionY(template.positionY);
    setShowLogo(template.showLogo);
    setLogoScale(template.logoScale);
    setLogoX(template.logoX);
    setLogoY(template.logoY);
    setOverlayItems(template.overlayItems.map(item => ({...item, id: Math.random().toString(36).substr(2, 9)})));
    message.success(`Đã áp dụng mẫu: ${template.name}`);
  };

  const resetToNewDesign = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setOverlayItems([]);
    setScale(0.18);
    setPositionX(500);
    setPositionY(550);
    setShowLogo(true);
    setLogoScale(0.15);
    setLogoX(850);
    setLogoY(850);
    setSelectedItemId(null);
    message.info('Đã chuẩn bị Canvas trống để thiết kế mẫu mới.');
  };

  const deleteTemplate = (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    const userTemplates = updated.filter(t => !t.isSystem);
    localStorage.setItem('image_studio_templates', JSON.stringify(userTemplates));
    setTemplates(updated);
    message.info('Đã xóa mẫu thiết kế');
  };

  // Canvas drawing
  useEffect(() => {
    if (!visible || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bgImg = new window.Image();
    const productImg = new window.Image();
    const logoImg = new window.Image();

    bgImg.src = bgSanPham;
    productImg.src = (processedImage || originalImage) ? (processedImage || originalImage) as string : '';
    logoImg.src = logo3;
    logoImgRef.current = logoImg;

    const draw = () => {
      // Clear and draw background as long as it's loaded
      if (bgImg.complete) {
        ctx.drawImage(bgImg, 0, 0, canvasWidth, canvasHeight);

        const hasProductImage = !!(processedImage || originalImage);
        
        // Draw product image OR placeholder if in design mode
        if (hasProductImage && productImg.complete) {
          const pWidth = productImg.width;
          const pHeight = productImg.height;
          const displayWidth = pWidth * scale;
          const displayHeight = pHeight * scale;

          // Create temporary canvas for product + mask
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = productImg.width;
          tempCanvas.height = productImg.height;
          const tempCtx = tempCanvas.getContext('2d')!;
          
          tempCtx.drawImage(productImg, 0, 0);
          
          // Apply erase mask if exists
          if (maskCanvasRef.current) {
            tempCtx.globalCompositeOperation = 'destination-out';
            tempCtx.drawImage(maskCanvasRef.current, 0, 0);
            tempCtx.globalCompositeOperation = 'source-over';
          }

          ctx.drawImage(
            tempCanvas,
            positionX - displayWidth / 2,
            positionY - displayHeight / 2,
            displayWidth,
            displayHeight
          );
        } else if (!hasProductImage && !loading && bgImg.complete) {
          // Show placeholder for layout designing
          const pWidth = 1000;
          const pHeight = 1000;
          const displayWidth = pWidth * scale;
          const displayHeight = pHeight * scale;

          ctx.save();
          ctx.setLineDash([10, 10]);
          ctx.strokeStyle = 'rgba(156, 163, 175, 0.8)';
          ctx.lineWidth = 3;
          const startX = positionX - displayWidth / 2;
          const startY = positionY - displayHeight / 2;
          
          ctx.strokeRect(startX, startY, displayWidth, displayHeight);
          
          ctx.fillStyle = 'rgba(156, 163, 175, 0.5)';
          ctx.fillRect(startX, startY, displayWidth, displayHeight);
          
          ctx.fillStyle = '#4b5563';
          ctx.font = `bold ${Math.max(12, 40 * scale)}px Arial`;
          ctx.textAlign = 'center';
          ctx.fillText('VÙNG HIỂN THỊ SẢN PHẨM', positionX, positionY);
          ctx.restore();
        }

        // Draw logo watermark
        if (bgImg.complete && showLogo && logoImg.complete) {
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

        // Draw overlay items (Text and Emojis) - ALWAYS DRAW EVEN WITHOUT PRODUCT
        overlayItems.forEach(item => {
          if (item.type === 'text') {
            const words = item.text.split(' ');
            let line = '';
            const lines = [];
            
            for (let n = 0; n < words.length; n++) {
              const testLine = line + words[n] + ' ';
              const metrics = ctx.measureText(testLine);
              const testWidth = metrics.width;
              if (testWidth > item.width && n > 0) {
                lines.push(line);
                line = words[n] + ' ';
              } else {
                line = testLine;
              }
            }
            lines.push(line);

            const lineHeight = item.size * 1.2;
            const totalHeight = lines.length * lineHeight;

            if (item.id === selectedItemId) {
              ctx.strokeStyle = '#3b82f6';
              ctx.lineWidth = 2;
              const rectX = item.x - item.width / 2 - 5;
              const rectY = item.y - totalHeight / 2 - 5;
              const rectW = item.width + 10;
              const rectH = totalHeight + 10;
              ctx.strokeRect(rectX, rectY, rectW, rectH);
              
              // Dashed highlight
              ctx.save();
              ctx.setLineDash([4, 4]);
              ctx.strokeStyle = '#ffffff';
              ctx.strokeRect(rectX, rectY, rectW, rectH);
              ctx.restore();

              // Draw resize handles (circles at right and left centers)
              if (!isExportingRef.current) {
                ctx.fillStyle = '#3b82f6';
                // Right handle
                ctx.beginPath();
                ctx.arc(item.x + item.width / 2 + 5, item.y, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Left handle
                ctx.beginPath();
                ctx.arc(item.x - item.width / 2 - 5, item.y, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
              }
            }

            lines.forEach((l, i) => {
              ctx.fillText(l, item.x, item.y - (totalHeight / 2) + (i * lineHeight) + (lineHeight / 2));
            });
          } else if (item.type === 'image' && item.imageSrc) {
            const img = new window.Image();
            img.src = item.imageSrc;
            if (img.complete) {
              const w = img.width * (item.itemScale || 1);
              const h = img.height * (item.itemScale || 1);
              ctx.save();
              ctx.globalAlpha = item.opacity ?? 1;
              ctx.drawImage(img, item.x - w / 2, item.y - h / 2, w, h);
              ctx.restore();

              if (item.id === selectedItemId) {
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = 2;
                ctx.strokeRect(item.x - w / 2, item.y - h / 2, w, h);
                
                // Dashed highlight
                ctx.save();
                ctx.setLineDash([4, 4]);
                ctx.strokeStyle = '#ffffff';
                ctx.strokeRect(item.x - w / 2, item.y - h / 2, w, h);
                ctx.restore();
              }
            }
          } else if (item.type === 'badge') {
            // Draw badge (rounded rect + icon + text)
            ctx.font = `bold ${item.size}px ${item.font}`;
            const metrics = ctx.measureText(item.text);
            const textWidth = metrics.width;
            const iconSize = item.size * 1.2;
            const padding = item.size * 0.8;
            const badgeHeight = item.size + padding * 2;
            const badgeWidth = textWidth + iconSize + padding * 3;

            // Draw rounded rect background
            const bx = item.x - badgeWidth / 2;
            const by = item.y - badgeHeight / 2;
            const radius = badgeHeight / 2;

            if (item.bgGradient && item.bgGradient.length >= 2) {
              const bgG = item.bgGradient;
              const gradient = ctx.createLinearGradient(bx, by, bx + badgeWidth, by);
              bgG.forEach((color, index) => {
                gradient.addColorStop(index / (bgG.length - 1), color);
              });
              ctx.fillStyle = gradient;
            } else {
              ctx.fillStyle = item.bgColor || '#16a34a';
            }

            ctx.beginPath();
            ctx.moveTo(bx + radius, by);
            ctx.lineTo(bx + badgeWidth - radius, by);
            ctx.quadraticCurveTo(bx + badgeWidth, by, bx + badgeWidth, by + radius);
            ctx.lineTo(bx + badgeWidth, by + badgeHeight - radius);
            ctx.quadraticCurveTo(bx + badgeWidth, by + badgeHeight, bx + badgeWidth - radius, by + badgeHeight);
            ctx.lineTo(bx + radius, by + badgeHeight);
            ctx.quadraticCurveTo(bx, by + badgeHeight, bx, by + badgeHeight - radius);
            ctx.lineTo(bx, by + radius);
            ctx.quadraticCurveTo(bx, by, bx + radius, by);
            ctx.closePath();
            ctx.fill();

            // Draw selection border
            if (item.id === selectedItemId) {
              ctx.strokeStyle = '#3b82f6';
              ctx.lineWidth = 3;
              ctx.stroke();
              
              // Thêm nét đứt trắng để nổi bật hơn (hiệu ứng đang chọn)
              ctx.save();
              ctx.setLineDash([5, 5]);
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1.5;
              ctx.stroke();
              ctx.restore();
            }

          // Draw icon (emoji or lucide)
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = item.color || '#FFFFFF';
          
          if (item.icon) {
            const isLucideIcon = item.iconType === 'lucide' || (!item.iconType && ['shield-check', 'box', 'truck', 'award', 'package-check'].includes(item.icon));
            
            if (isLucideIcon) {
              // Create SVG string and draw to canvas
              const iconColor = item.color || '#FFFFFF';
              const svgMap: { [key: string]: string } = {
                'shield-check': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
                'box': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`,
                'truck': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5h-7v5a1 1 0 0 0 1 1Z"/><path d="M16 8h4.7a1.5 1.5 0 0 1 1.3.8L22 12"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>`,
                'award': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`,
                'package-check': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 2 2 4-4"/><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"/><path d="m7.5 4.27 9 5.15"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`
              };

              const svgString = svgMap[item.icon];
              if (svgString) {
                const img = new Image();
                img.src = 'data:image/svg+xml;base64,' + btoa(svgString);
                if (img.complete) {
                  ctx.drawImage(img, bx + padding, item.y - iconSize / 2, iconSize, iconSize);
                }
              }
            } else {
              ctx.font = `${iconSize}px Arial`;
              ctx.fillText(item.icon, bx + padding + iconSize / 2, item.y);
            }
          }

            // Draw text
            ctx.font = `bold ${item.size}px ${item.font}`;
            ctx.textAlign = 'left';
            ctx.fillText(item.text, bx + padding * 2 + iconSize, item.y);
          } else {
            // Emojis
            if (item.id === selectedItemId) {
              const metrics = ctx.measureText(item.text);
              const w = metrics.width + 10;
              const h = item.size + 10;
              ctx.strokeStyle = '#3b82f6';
              ctx.lineWidth = 2;
              ctx.strokeRect(item.x - w / 2, item.y - h / 2, w, h);
              
              // Dashed highlight
              ctx.save();
              ctx.setLineDash([4, 4]);
              ctx.strokeStyle = '#ffffff';
              ctx.strokeRect(item.x - w / 2, item.y - h / 2, w, h);
              ctx.restore();
            }
            ctx.fillText(item.text, item.x, item.y);
          }
        });

        // Draw brush preview circle
        if (isEraserMode && !isExportingRef.current && mousePos.x >= 0) {
          ctx.beginPath();
          ctx.arc(mousePos.x, mousePos.y, brushSize, 0, Math.PI * 2);
          ctx.strokeStyle = brushMode === 'erase' ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 255, 0, 0.5)';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Draw a small crosshair in center
          ctx.beginPath();
          ctx.moveTo(mousePos.x - 5, mousePos.y);
          ctx.lineTo(mousePos.x + 5, mousePos.y);
          ctx.moveTo(mousePos.x, mousePos.y - 5);
          ctx.lineTo(mousePos.x, mousePos.y + 5);
          ctx.stroke();
        }
      }
    };

    bgImg.onload = draw;
    productImg.onload = draw;
    logoImg.onload = draw;
    draw();

  }, [visible, originalImage, processedImage, scale, positionX, positionY, canvasWidth, canvasHeight, showLogo, logoScale, logoX, logoY, overlayItems, selectedItemId, isErasing, isEraserMode, eraserTrigger, mousePos, brushMode, brushSize]);

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

  const saveMaskState = () => {
    if (maskCanvasRef.current) {
      setMaskHistory(prev => [...prev.slice(-19), maskCanvasRef.current!.toDataURL()]);
    }
  };

  const undoEraser = () => {
    if (maskHistory.length === 0 || !maskCanvasRef.current) return;
    
    const newHistory = [...maskHistory];
    const lastState = newHistory.pop()!;
    setMaskHistory(newHistory);
    
    const img = new window.Image();
    img.src = lastState;
    img.onload = () => {
      const ctx = maskCanvasRef.current!.getContext('2d')!;
      ctx.clearRect(0, 0, maskCanvasRef.current!.width, maskCanvasRef.current!.height);
      ctx.drawImage(img, 0, 0);
      setEraserTrigger(prev => prev + 1);
    };
  };

  const wrapInExport = async (action: () => Promise<void> | void) => {
    isExportingRef.current = true;
    setEraserTrigger(prev => prev + 1); // Force redraw without cursor
    await new Promise(resolve => setTimeout(resolve, 10)); // Give it a frame to redraw
    await action();
    isExportingRef.current = false;
    setEraserTrigger(prev => prev + 1);
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    wrapInExport(() => {
      canvasRef.current!.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'product-ai.png', { type: 'image/png' });
          onSave(file);
          onCancel();
        }
      }, 'image/png');
    });
  };

  // Copy ảnh vào clipboard
  const handleCopyImage = async () => {
    if (!canvasRef.current) return;
    wrapInExport(async () => {
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
    });
  };

  // Download ảnh
  const handleDownload = () => {
    if (!canvasRef.current) return;
    wrapInExport(() => {
      canvasRef.current!.toBlob((blob) => {
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
    });
  };

  // Thêm text mới
  const addText = () => {
    const newItem: OverlayItem = {
      id: Date.now().toString(),
      type: 'text',
      text: 'Nhấp để sửa nội dung',
      x: canvasWidth / 2,
      y: canvasHeight / 2,
      size: 50,
      color: '#000000',
      font: 'Arial',
      width: 300
    };
    setOverlayItems([...overlayItems, newItem]);
    setSelectedItemId(newItem.id);
  };

  // Thêm emoji
  const addEmoji = (emoji: string) => {
    const newItem: OverlayItem = {
      id: Date.now().toString(),
      type: 'emoji',
      text: emoji,
      x: canvasWidth / 2,
      y: canvasHeight / 2,
      size: 60,
      color: '#000000',
      font: 'Arial',
      width: 150
    };
    setOverlayItems([...overlayItems, newItem]);
    setSelectedItemId(newItem.id);
  };

  const addImageItem = (file: File) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.src = url;
    img.onload = () => {
      const newItem: OverlayItem = {
        id: Date.now().toString(),
        text: '',
        x: canvasWidth / 2,
        y: canvasHeight / 2,
        size: img.height, // Store height in size for hit detection
        color: '',
        font: '',
        width: img.width, // Store width in width for hit detection
        type: 'image',
        imageSrc: url,
        itemScale: 0.5,
        opacity: 1
      };
      setOverlayItems([...overlayItems, newItem]);
      setSelectedItemId(newItem.id);
    };
  };

  const addLogoAsItem = () => {
    const img = new window.Image();
    img.src = logo3;
    img.onload = () => {
      const newItem: OverlayItem = {
        id: Date.now().toString(),
        text: '',
        x: canvasWidth / 2,
        y: canvasHeight / 2,
        size: img.height,
        color: '',
        font: '',
        width: img.width,
        type: 'image',
        imageSrc: logo3,
        itemScale: 0.22,
        opacity: 1
      };
      setOverlayItems([...overlayItems, newItem]);
      setSelectedItemId(newItem.id);
    };
  };


  const addCustomBadge = () => {
    const newItem: OverlayItem = {
      id: Date.now().toString(),
      text: 'NHÃN CỦA BẠN',
      icon: 'shield-check',
      iconType: 'lucide',
      x: canvasWidth / 2,
      y: canvasHeight / 2,
      size: 45,
      color: '#FFFFFF',
      font: 'Arial',
      width: 400,
      type: 'badge',
      bgColor: '#16a34a'
    };
    setOverlayItems([...overlayItems, newItem]);
    setSelectedItemId(newItem.id);
  };

  const saveSelectedAsBadge = () => {
    const item = overlayItems.find(i => i.id === selectedItemId);
    if (!item || item.type !== 'badge') {
        message.warning('Vui lòng chọn một Nhãn (Badge) để lưu');
        return;
    }

    const newSavedBadge: SavedBadge = {
        id: Date.now().toString(),
        text: item.text,
        icon: item.icon || '',
        iconType: item.iconType || 'lucide',
        bgColor: item.bgColor || '#16a34a',
        bgGradient: item.bgGradient,
        color: item.color || '#FFFFFF',
        size: item.size
    };

    const updated = [...userBadges, newSavedBadge];
    setUserBadges(updated);
    localStorage.setItem('image_studio_user_badges', JSON.stringify(updated));
    message.success('Đã lưu nhãn vào thư viện của bạn');
  };

  const deleteSavedBadge = (id: string) => {
    const updated = userBadges.filter(b => b.id !== id);
    setUserBadges(updated);
    localStorage.setItem('image_studio_user_badges', JSON.stringify(updated));
    message.success('Đã xóa nhãn khỏi thư viện');
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
      className="responsive-modal"
      style={{ top: 20 }}
      footer={[
        <Button key="cancel" onClick={onCancel} size="large">Hủy</Button>,
        <Button 
          key="copy" 
          icon={<CopyOutlined />} 
          disabled={!originalImage && !processedImage}
          onClick={handleCopyImage}
          size="large"
        >
          Copy ảnh
        </Button>,
        <Button 
          key="download" 
          icon={<SaveOutlined />} 
          disabled={!originalImage && !processedImage}
          onClick={handleDownload}
          size="large"
        >
          Tải xuống
        </Button>,
        <Button 
          key="save" 
          type="primary" 
          icon={<SaveOutlined />} 
          disabled={!originalImage && !processedImage}
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
                    <div className="flex flex-col gap-2 mb-4">
                      <Button 
                        type="primary" 
                        icon={<Sparkles className="w-4 h-4" />} 
                        loading={loading}
                        onClick={processAI}
                        block
                        className="bg-blue-600 hover:bg-blue-700 h-10 font-bold shadow-lg shadow-blue-200"
                      >
                        Thêm nền bằng AI
                      </Button>
                      <Button 
                        icon={<PictureOutlined />}
                        onClick={() => { setProcessedImage(originalImage); message.info('Đã chọn sử dụng ảnh gốc.'); }}
                        block
                        className="h-10 font-bold border-dashed"
                      >
                        Bỏ qua / Dùng ảnh gốc
                      </Button>
                    </div>
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

          {(processedImage || originalImage) && (
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

                  {/* Eraser Tool Controls */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold text-gray-600 uppercase">Cục tẩy (Xóa thừa)</span>
                      <Button 
                        size="small"
                        type={isEraserMode ? "primary" : "default"}
                        icon={<Eraser size={14} />}
                        onClick={() => setIsEraserMode(!isEraserMode)}
                        className={isEraserMode ? "bg-red-500 hover:bg-red-600" : ""}
                      >
                        {isEraserMode ? "Đang bật" : "Bật tẩy"}
                      </Button>
                    </div>
                    
                    {isEraserMode && (
                      <div className="p-3 bg-red-50 rounded-lg border border-red-100 space-y-3">
                        <div className="flex gap-2">
                          <Button 
                            block 
                            size="small" 
                            type={brushMode === 'erase' ? 'primary' : 'default'}
                            danger={brushMode === 'erase'}
                            onClick={() => setBrushMode('erase')}
                          >
                            Xóa phần thừa
                          </Button>
                          <Button 
                            block 
                            size="small" 
                            type={brushMode === 'restore' ? 'primary' : 'default'}
                            className={brushMode === 'restore' ? "bg-green-600 hover:bg-green-700" : ""}
                            onClick={() => setBrushMode('restore')}
                          >
                            Khôi phục
                          </Button>
                        </div>

                        <Alert 
                          message={
                            <span className="text-[10px]">
                              {brushMode === 'erase' 
                                ? "Tô lên phần thừa để xóa đi." 
                                : "Tô lên phần bị xóa nhầm để khôi phục."}
                            </span>
                          } 
                          type={brushMode === 'erase' ? "warning" : "success"} 
                          showIcon 
                          className="py-1"
                        />
                        <div>
                          <div className="flex justify-between text-[10px] font-bold mb-1">
                            <span>Kích thước cọ</span>
                            <span>{brushSize}px</span>
                          </div>
                          <Slider min={5} max={100} value={brushSize} onChange={setBrushSize} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button 
                            block 
                            size="small" 
                            disabled={maskHistory.length === 0}
                            icon={<UndoOutlined />} 
                            onClick={undoEraser}
                          >
                            Quay lại
                          </Button>
                          <Button 
                            block 
                            size="small" 
                            icon={<X size={14} />} 
                            onClick={() => {
                              if (maskCanvasRef.current) {
                                saveMaskState();
                                const ctx = maskCanvasRef.current.getContext('2d')!;
                                ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
                                setEraserTrigger(prev => prev + 1);
                                message.info('Đã khôi phục toàn bộ ảnh gốc');
                              }
                            }}
                          >
                            Làm lại đầu
                          </Button>
                        </div>
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
                    <Button icon={<FontSizeOutlined />} onClick={addText} block size="small">Chữ</Button>
                    <Button icon={<SmileOutlined />} onClick={() => addEmoji('🌾')} block size="small">Emoji</Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Upload 
                      beforeUpload={(file) => { addImageItem(file); return false; }}
                      showUploadList={false}
                      accept="image/*"
                    >
                      <Button icon={<PictureOutlined />} block size="small">Thêm Ảnh</Button>
                    </Upload>
                    <Button icon={<SmileOutlined />} onClick={addLogoAsItem} block size="small">Logo Xanh</Button>
                  </div>

                  <div className="bg-gray-50 p-2 rounded border space-y-2">
                    <div className="flex justify-between items-center">
                       <label className="text-[9px] font-bold text-gray-400 uppercase">Thư viện Nhãn của bạn</label>
                       <Space>
                         <Button size="small" type="link" className="text-[9px] p-0 h-auto" onClick={resetToNewDesign}>Xóa Canvas</Button>
                         <Button size="small" type="link" className="text-[9px] p-0 h-auto" onClick={addCustomBadge}>+ Tạo mới</Button>
                       </Space>
                    </div>
                    <div className="flex flex-col gap-1">
                       
                       {userBadges.length > 0 && <div className="text-[8px] text-gray-300 mt-1 uppercase font-bold">Thư viện của bạn</div>}
                       {userBadges.map(b => (
                         <div key={b.id} className="flex gap-1 group items-center">
                           <Button 
                             size="small" 
                             className="text-[10px] text-left flex-1" 
                             onClick={() => {
                               const newItem: OverlayItem = {
                                 id: Date.now().toString(),
                                 text: b.text,
                                 icon: b.icon,
                                 iconType: b.iconType || (['shield-check', 'box', 'truck', 'award', 'package-check'].includes(b.icon) ? 'lucide' : 'emoji'),
                                 x: canvasWidth / 2,
                                 y: canvasHeight / 2,
                                 size: b.size,
                                 color: b.color,
                                 font: 'Arial',
                                 width: 400,
                                 type: 'badge',
                                 bgColor: b.bgColor,
                                 bgGradient: b.bgGradient
                               };
                               setOverlayItems([...overlayItems, newItem]);
                               setSelectedItemId(newItem.id);
                             }}
                           >
                             <div className="flex items-center gap-2 overflow-hidden py-1 px-1">
                               <div 
                                 className="h-6 rounded-full flex items-center px-3 gap-1 flex-shrink-0"
                                 style={{ 
                                   background: b.bgGradient ? `linear-gradient(to right, ${b.bgGradient.join(', ')})` : b.bgColor 
                                 }}
                               >
                                  {b.icon && (
                                    <span style={{ fontSize: '10px', color: b.color, display: 'flex' }}>
                                      {b.iconType === 'emoji' ? b.icon : (
                                        b.icon === 'shield-check' ? <ShieldCheck size={12} color={b.color} /> :
                                        b.icon === 'box' ? <Box size={12} color={b.color} /> :
                                        b.icon === 'truck' ? <Truck size={12} color={b.color} /> :
                                        b.icon === 'award' ? <Award size={12} color={b.color} /> :
                                        b.icon === 'package-check' ? <PackageCheck size={12} color={b.color} /> : <ShieldCheck size={12} color={b.color} />
                                      )}
                                    </span>
                                  )}
                                  <span className="font-bold whitespace-nowrap overflow-hidden text-ellipsis uppercase" style={{ fontSize: '8px', color: b.color }}>
                                    {b.text}
                                  </span>
                               </div>
                             </div>
                           </Button>
                           <Button 
                             size="small" 
                             type="text" 
                             danger 
                             className="opacity-0 group-hover:opacity-100 p-1 h-auto" 
                             onClick={() => deleteSavedBadge(b.id)}
                             icon={<X size={10} />}
                           />
                         </div>
                       ))}
                    </div>
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

                      {overlayItems.find(i => i.id === selectedItemId)?.type === 'text' && (
                        <div>
                          <label className="text-[9px] text-gray-500 block mb-1 uppercase">Độ rộng vùng chữ</label>
                          <Slider 
                            min={100} 
                            max={canvasWidth} 
                            value={overlayItems.find(i => i.id === selectedItemId)?.width} 
                            onChange={(val) => updateItem(selectedItemId, { width: val })}
                          />
                        </div>
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
                          <label className="text-[9px] text-gray-500 block mb-1 uppercase">
                            {overlayItems.find(i => i.id === selectedItemId)?.type === 'badge' ? 'Kích thước Nhãn' : 'Cỡ chữ'}
                          </label>
                          <Slider 
                            min={10} 
                            max={overlayItems.find(i => i.id === selectedItemId)?.type === 'badge' ? 150 : 200} 
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

                       {overlayItems.find(i => i.id === selectedItemId)?.type === 'image' && (
                        <div className="space-y-3">
                           <div>
                              <label className="text-[9px] text-gray-500 block mb-1 uppercase">Vị trí & Kích thước</label>
                              <div className="space-y-2">
                                <div>
                                  <label className="text-[8px] text-gray-400">Tỷ lệ (Scale)</label>
                                  <Slider 
                                    min={0.01} 
                                    max={2} 
                                    step={0.01}
                                    value={overlayItems.find(i => i.id === selectedItemId)?.itemScale || 0.5} 
                                    onChange={(val) => updateItem(selectedItemId, { itemScale: val })}
                                  />
                                </div>
                              </div>
                           </div>
                         </div>
                       )}

                        {overlayItems.find(i => i.id === selectedItemId)?.type === 'badge' && (
                          <div className="space-y-3 mt-2">
                             <div className="flex gap-2">
                                <Button 
                                  size="small" 
                                  className={`flex-1 text-[9px] ${!overlayItems.find(i => i.id === selectedItemId)?.bgGradient ? 'bg-blue-100 border-blue-300 font-bold' : ''}`}
                                  onClick={() => updateItem(selectedItemId, { bgGradient: undefined })}
                                >
                                  MÀU ĐƠN
                                </Button>
                                <Button 
                                  size="small" 
                                  className={`flex-1 text-[9px] ${overlayItems.find(i => i.id === selectedItemId)?.bgGradient ? 'bg-blue-100 border-blue-300 font-bold' : ''}`}
                                  onClick={() => updateItem(selectedItemId, { bgGradient: ['#D4AF37', '#FFD700', '#D4AF37'] })}
                                >
                                  GRADIENT ✨
                                </Button>
                             </div>

                             {!overlayItems.find(i => i.id === selectedItemId)?.bgGradient ? (
                                <div>
                                  <label className="text-[8px] text-gray-400 font-bold uppercase">Màu Nền Nhãn</label>
                                  <input 
                                    type="color" 
                                    className="w-full h-8 p-0 border border-gray-200 rounded cursor-pointer"
                                    value={overlayItems.find(i => i.id === selectedItemId)?.bgColor}
                                    onChange={(e) => updateItem(selectedItemId, { bgColor: e.target.value })}
                                  />
                                </div>
                             ) : (
                               <div className="space-y-2">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-[8px] text-gray-400 font-bold">MÀU ĐẦU</label>
                                      <input 
                                        type="color" 
                                        className="w-full h-8 p-0 border border-gray-200 rounded cursor-pointer"
                                        value={overlayItems.find(i => i.id === selectedItemId)?.bgGradient?.[0] || '#D4AF37'}
                                        onChange={(e) => {
                                          const current = overlayItems.find(i => i.id === selectedItemId)?.bgGradient || ['#D4AF37', '#FFD700'];
                                          updateItem(selectedItemId, { bgGradient: [e.target.value, current[current.length - 1]] });
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[8px] text-gray-400 font-bold">MÀU CUỐI</label>
                                      <input 
                                        type="color" 
                                        className="w-full h-8 p-0 border border-gray-200 rounded cursor-pointer"
                                        value={overlayItems.find(i => i.id === selectedItemId)?.bgGradient?.slice(-1)[0] || '#FFD700'}
                                        onChange={(e) => {
                                          const current = overlayItems.find(i => i.id === selectedItemId)?.bgGradient || ['#D4AF37', '#FFD700'];
                                          updateItem(selectedItemId, { bgGradient: [current[0], e.target.value] });
                                        }}
                                      />
                                    </div>
                                  </div>

                                  <label className="text-[8px] text-gray-400 font-bold uppercase block mt-1">Hoặc dùng mẫu sẵn</label>
                                  <div className="grid grid-cols-2 gap-1">
                                    {[
                                      { name: 'VÀNG GOLD', colors: ['#D4AF37', '#FFD700', '#D4AF37'] },
                                      { name: 'XANH NGỌC', colors: ['#11998e', '#38ef7d'] },
                                      { name: 'HOÀNG HÔN', colors: ['#ff5f6d', '#ffc371'] },
                                      { name: 'ĐẠI DƯƠNG', colors: ['#2193b0', '#6dd5ed'] },
                                      { name: 'PREMIUM', colors: ['#232526', '#414345'] },
                                      { name: 'TÍM SEN', colors: ['#da22ff', '#9733ee'] }
                                    ].map(g => (
                                      <button 
                                        key={g.name}
                                        className="h-6 rounded flex items-center justify-center text-[7px] text-white font-bold transition-transform hover:scale-105 shadow-sm"
                                        style={{ background: `linear-gradient(to right, ${g.colors.join(', ')})` }}
                                        onClick={() => updateItem(selectedItemId, { bgGradient: g.colors })}
                                      >
                                        {g.name}
                                      </button>
                                    ))}
                                  </div>
                               </div>
                             )}

                             <div>
                                <label className="text-[8px] text-gray-400 font-bold uppercase">Màu Chữ & Biểu Tượng</label>
                                <input 
                                  type="color" 
                                  className="w-full h-8 p-0 border border-gray-200 rounded cursor-pointer"
                                  value={overlayItems.find(i => i.id === selectedItemId)?.color}
                                  onChange={(e) => updateItem(selectedItemId, { color: e.target.value })}
                                />
                             </div>
                          </div>
                        )}
                           {overlayItems.find(i => i.id === selectedItemId)?.type === 'badge' && (
                             <div className="pt-2 border-t border-gray-100 space-y-2">
                               <label className="text-[9px] text-gray-500 block mb-1 uppercase">Thiết kế Nhãn</label>
                               <div>
                                 <label className="text-[8px] text-gray-400">Chọn Icon chuyên nghiệp (Màu trắng)</label>
                                 <div className="flex flex-wrap gap-2 mb-3">
                                   {[
                                     { id: 'shield-check', label: 'Bảo vệ' },
                                     { id: 'box', label: 'Hộp' },
                                     { id: 'truck', label: 'Xe tải' },
                                     { id: 'award', label: 'Chất lượng' },
                                     { id: 'package-check', label: 'Kiểm hàng' }
                                   ].map(iconObj => (
                                     <button 
                                       key={iconObj.id} 
                                       title={iconObj.label}
                                       className={`p-2 rounded border flex items-center justify-center hover:bg-blue-50 ${overlayItems.find(i => i.id === selectedItemId)?.icon === iconObj.id ? 'bg-blue-100 border-blue-300' : 'bg-white'}`}
                                       onClick={() => updateItem(selectedItemId, { icon: iconObj.id, iconType: 'lucide' })}
                                     >
                                        <div className="w-4 h-4 text-gray-600 flex items-center justify-center">
                                           {iconObj.id === 'shield-check' && <ShieldCheck size={14} />}
                                           {iconObj.id === 'box' && <Box size={14} />}
                                           {iconObj.id === 'truck' && <Truck size={14} />}
                                           {iconObj.id === 'award' && <Award size={14} />}
                                           {iconObj.id === 'package-check' && <PackageCheck size={14} />}
                                        </div>
                                     </button>
                                   ))}
                                 </div>
                                 <label className="text-[8px] text-gray-400">Hoặc dùng Emoji riêng</label>
                                 <Input 
                                   size="small" 
                                   value={overlayItems.find(i => i.id === selectedItemId)?.iconType === 'emoji' ? overlayItems.find(i => i.id === selectedItemId)?.icon : ''} 
                                   onChange={(e) => updateItem(selectedItemId, { icon: e.target.value, iconType: 'emoji' })}
                                   placeholder="Gõ emoji..."
                                 />
                               </div>
                               <div>
                                 <label className="text-[8px] text-gray-400">Nội dung chữ</label>
                                 <Input.TextArea 
                                   size="small" 
                                   rows={1}
                                   value={overlayItems.find(i => i.id === selectedItemId)?.text} 
                                   onChange={(e) => updateItem(selectedItemId, { text: e.target.value })}
                                 />
                               </div>
                             </div>
                           )}

                           {overlayItems.find(i => i.id === selectedItemId)?.type === 'badge' && (
                             <Button 
                               block 
                               size="small" 
                               type="primary" 
                               icon={<SaveOutlined />}
                               onClick={saveSelectedAsBadge}
                               className="mt-2 bg-blue-500"
                             >
                               Lưu vào thư viện nhãn
                             </Button>
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

        <div className="lg:col-span-3 bg-gray-200/50 rounded-2xl flex items-center justify-center p-4 lg:p-8 relative overflow-hidden min-h-[400px] lg:min-h-[650px] border-2 border-dashed border-gray-300 shadow-inner">
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
                    width: '100%',
                    maxWidth: `${Math.min(canvasWidth / 2, 500)}px`, 
                    height: 'auto',
                    display: 'block',
                    cursor: isEraserMode ? 'none' : (isDraggingLogo ? 'grabbing' : 'grab'),
                    touchAction: 'none' // Prevent scrolling when interacting with canvas
                  }}
                  onMouseDown={(e) => {
                    const rect = canvasRef.current!.getBoundingClientRect();
                    const scaleX = canvasWidth / rect.width;
                    const scaleY = canvasHeight / rect.height;
                    const mouseX = (e.clientX - rect.left) * scaleX;
                    const mouseY = (e.clientY - rect.top) * scaleY;
                                       if (selectedItemId) {
                      const item = overlayItems.find(i => i.id === selectedItemId);
                      if (item && item.type === 'text') {
                        const distR = Math.sqrt(Math.pow(mouseX - (item.x + item.width / 2 + 5), 2) + Math.pow(mouseY - item.y, 2));
                        const distL = Math.sqrt(Math.pow(mouseX - (item.x - item.width / 2 - 5), 2) + Math.pow(mouseY - item.y, 2));
                        if (distR < 25 || distL < 25) {
                          setIsResizingItem(true);
                          return;
                        }
                      }
                    }
                    
                    const ctx = canvasRef.current!.getContext('2d')!;
                    for (let i = overlayItems.length - 1; i >= 0; i--) {
                      const item = overlayItems[i];
                      let w = 0;
                      let h = 0;

                      if (item.type === 'text') {
                        ctx.font = `${item.size}px ${item.font}`;
                        const metrics = ctx.measureText(item.text);
                        w = item.width || metrics.width + 20;
                        h = item.size + 20;
                      } else if (item.type === 'image') {
                        w = item.width * (item.itemScale || 1);
                        h = (item.size || item.width) * (item.itemScale || 1); 
                      } else if (item.type === 'badge') {
                        ctx.font = `bold ${item.size}px ${item.font}`;
                        const metrics = ctx.measureText(item.text);
                        const iconSize = item.size * 1.2;
                        const padding = item.size * 0.8;
                        h = item.size + padding * 2;
                        w = metrics.width + iconSize + padding * 3;
                      } else {
                        w = item.size * 1.5;
                        h = item.size * 1.5;
                      }
                      
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
                    setSelectedItemId(null);

                    if (showLogo) {
                      const lImg = logoImgRef.current;
                      const baseSize = (lImg && lImg.width > 0) ? lImg.width : 500;
                      const logoWidth = baseSize * logoScale;
                      const logoHeight = baseSize * logoScale;
                      const hitPadding = 60;
                      if (
                        mouseX >= logoX - logoWidth / 2 - hitPadding &&
                        mouseX <= logoX + logoWidth / 2 + hitPadding &&
                        mouseY >= logoY - logoHeight / 2 - hitPadding &&
                        mouseY <= logoY + logoHeight / 2 + hitPadding
                      ) {
                        setIsDraggingLogo(true);
                        setDragOffset({ x: mouseX - logoX, y: mouseY - logoY });
                        return;
                      }
                    }
                  }}
                  onMouseMove={(e) => {
                    const rect = canvasRef.current!.getBoundingClientRect();
                    const scaleX = canvasWidth / rect.width;
                    const scaleY = canvasHeight / rect.height;
                    const mouseX = (e.clientX - rect.left) * scaleX;
                    const mouseY = (e.clientY - rect.top) * scaleY;
                    
                    setMousePos({ x: mouseX, y: mouseY });

                    if (isResizingItem && selectedItemId) {
                      const item = overlayItems.find(i => i.id === selectedItemId);
                      if (item) {
                        const newWidth = Math.abs(mouseX - item.x) * 2;
                        updateItem(selectedItemId, { width: Math.max(50, newWidth) });
                      }
                      return;
                    }

                    if (isErasing && isEraserMode && maskCanvasRef.current) {
                      const ctx = maskCanvasRef.current.getContext('2d')!;
                      const productImg = new window.Image();
                      productImg.src = (processedImage || originalImage) as string;
                      
                      const pWidth = productImg.width;
                      const pHeight = productImg.height;
                      const displayWidth = pWidth * scale;
                      const displayHeight = pHeight * scale;
                      
                      const originX = positionX - displayWidth / 2;
                      const originY = positionY - displayHeight / 2;
                      const relX = (mouseX - originX) / (displayWidth / pWidth);
                      const relY = (mouseY - originY) / (displayHeight / pHeight);
                      
                      if (brushMode === 'erase') {
                        ctx.globalCompositeOperation = 'source-over';
                        ctx.fillStyle = 'black';
                      } else {
                        ctx.globalCompositeOperation = 'destination-out';
                      }

                      ctx.beginPath();
                      ctx.arc(relX, relY, brushSize / scale, 0, Math.PI * 2);
                      ctx.fill();
                      setEraserTrigger(prev => prev + 1); 
                      return;
                    }

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
                    setIsResizingItem(false);
                    setIsErasing(false);
                    setMousePos({ x: -100, y: -100 });
                  }}
                  onMouseLeave={() => {
                    setIsDraggingLogo(false);
                    setIsDraggingItem(false);
                    setIsResizingItem(false);
                    setIsErasing(false);
                    setMousePos({ x: -100, y: -100 });
                  }}
                  onMouseEnter={(e) => {
                    const rect = canvasRef.current!.getBoundingClientRect();
                    const scaleX = canvasWidth / rect.width;
                    const scaleY = canvasHeight / rect.height;
                    const mouseX = (e.clientX - rect.left) * scaleX;
                    const mouseY = (e.clientY - rect.top) * scaleY;
                    setMousePos({ x: mouseX, y: mouseY });
                  }}
                  onTouchStart={(e) => {
                    const touch = e.touches[0];
                    const rect = canvasRef.current!.getBoundingClientRect();
                    const scaleX = canvasWidth / rect.width;
                    const scaleY = canvasHeight / rect.height;
                    const mouseX = (touch.clientX - rect.left) * scaleX;
                    const mouseY = (touch.clientY - rect.top) * scaleY;

                    // Chuyển đổi tọa độ chạm sang tọa độ canvas
                    const adjX = mouseX; 
                    const adjY = mouseY;
                    
                    if (selectedItemId) {
                      const item = overlayItems.find(i => i.id === selectedItemId);
                      if (item && item.type === 'text') {
                        const distR = Math.sqrt(Math.pow(mouseX - (item.x + item.width / 2 + 5), 2) + Math.pow(mouseY - item.y, 2));
                        const distL = Math.sqrt(Math.pow(mouseX - (item.x - item.width / 2 - 5), 2) + Math.pow(mouseY - item.y, 2));
                        if (distR < 35 || distL < 35) { // Larger hit area for touch
                          setIsResizingItem(true);
                          return;
                        }
                      }
                    }

                    if (isEraserMode && processedImage && maskCanvasRef.current) {
                      saveMaskState();
                      setIsErasing(true);
                      return;
                    }

                    const ctx = canvasRef.current!.getContext('2d')!;
                    for (let i = overlayItems.length - 1; i >= 0; i--) {
                      const item = overlayItems[i];
                      let w = 0;
                      let h = 0;

                      if (item.type === 'text') {
                        ctx.font = `${item.size}px ${item.font}`;
                        const words = item.text.split(' ');
                        const lineHeight = item.size * 1.2;
                        let lineCount = 1;
                        let line = '';
                        for (let n = 0; n < words.length; n++) {
                          const testLine = line + words[n] + ' ';
                          if (ctx.measureText(testLine).width > item.width && n > 0) {
                            lineCount++;
                            line = words[n] + ' ';
                          } else {
                            line = testLine;
                          }
                        }
                        w = item.width + 20;
                        h = lineCount * lineHeight + 20;
                      } else if (item.type === 'image') {
                        w = item.width * (item.itemScale || 1) + 20;
                        h = (item.size || item.width) * (item.itemScale || 1) + 20;
                      } else if (item.type === 'badge') {
                        ctx.font = `bold ${item.size}px ${item.font}`;
                        const metrics = ctx.measureText(item.text);
                        const iconSize = item.size * 1.2;
                        const padding = item.size * 0.8;
                        h = item.size + padding * 2 + 20;
                        w = metrics.width + iconSize + padding * 3 + 20;
                      } else {
                        // Emoji
                        ctx.font = `${item.size}px ${item.font}`;
                        const metrics = ctx.measureText(item.text);
                        w = metrics.width + 30;
                        h = item.size + 30;
                      }

                      if (adjX >= item.x - w / 2 && adjX <= item.x + w / 2 && adjY >= item.y - h / 2 && adjY <= item.y + h / 2) {
                        setIsDraggingItem(true);
                        setSelectedItemId(item.id);
                        setDragOffset({ x: mouseX - item.x, y: mouseY - item.y });
                        return;
                      }
                    }
                    setSelectedItemId(null);

                    // Check if touch is on logo
                    if (showLogo) {
                      const lImg = logoImgRef.current;
                      const baseSize = (lImg && lImg.width > 0) ? lImg.width : 500;
                      const logoWidth = baseSize * logoScale;
                      const logoHeight = baseSize * logoScale;
                      const hitPadding = 70;
                      if (
                        mouseX >= logoX - logoWidth / 2 - hitPadding &&
                        mouseX <= logoX + logoWidth / 2 + hitPadding &&
                        mouseY >= logoY - logoHeight / 2 - hitPadding &&
                        mouseY <= logoY + logoHeight / 2 + hitPadding
                      ) {
                        setIsDraggingLogo(true);
                        setDragOffset({ x: mouseX - logoX, y: mouseY - logoY });
                        return;
                      }
                    }
                  }}
                  onTouchMove={(e) => {
                    const touch = e.touches[0];
                    const rect = canvasRef.current!.getBoundingClientRect();
                    const scaleX = canvasWidth / rect.width;
                    const scaleY = canvasHeight / rect.height;
                    const mouseX = (touch.clientX - rect.left) * scaleX;
                    const mouseY = (touch.clientY - rect.top) * scaleY;

                    const adjX = (mouseX - positionX) / scale;
                    const adjY = (mouseY - positionY) / scale;

                    if (isResizingItem && selectedItemId) {
                      const item = overlayItems.find(i => i.id === selectedItemId);
                      if (item) {
                        const newWidth = Math.abs(mouseX - item.x) * 2;
                        updateItem(selectedItemId, { width: Math.max(50, newWidth) });
                      }
                    } else if (isErasing && isEraserMode && maskCanvasRef.current) {
                      // Eraser STILL NEEDS relative coordinates
                      const ctx = maskCanvasRef.current.getContext('2d')!;
                      const productImg = new window.Image();
                      productImg.src = (processedImage || originalImage) as string;
                      const displayWidth = productImg.width * scale;
                      const displayHeight = productImg.height * scale;
                      const originX = positionX - displayWidth / 2;
                      const originY = positionY - displayHeight / 2;
                      const relX = (mouseX - originX) / (displayWidth / productImg.width);
                      const relY = (mouseY - originY) / (displayHeight / productImg.height);
                      
                      if (brushMode === 'erase') {
                        ctx.globalCompositeOperation = 'source-over';
                        ctx.fillStyle = 'black';
                      } else {
                        ctx.globalCompositeOperation = 'destination-out';
                      }
                      ctx.beginPath();
                      ctx.arc(relX, relY, brushSize / scale, 0, Math.PI * 2);
                      ctx.fill();
                      setEraserTrigger(prev => prev + 1);
                    } else if (isDraggingItem && selectedItemId) {
                      updateItem(selectedItemId, { x: mouseX - dragOffset.x, y: mouseY - dragOffset.y });
                    } else if (isDraggingLogo && showLogo) {
                      setLogoX(mouseX - dragOffset.x);
                      setLogoY(mouseY - dragOffset.y);
                    }
                  }}
                  onTouchEnd={() => {
                    setIsDraggingItem(false);
                    setIsResizingItem(false);
                    setIsErasing(false);
                  }}
                />
              </div>
              {/* {!processedImage && (
                 <div className="absolute top-4 left-4 bg-orange-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black shadow-xl animate-bounce border-2 border-white">
                    ĐANG XEM TRƯỚC - HÃY TÁCH NỀN!
                 </div>
              )} */}
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
