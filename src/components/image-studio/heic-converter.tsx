import React, { useState, useCallback, useRef } from 'react';
import { Button, Card, Progress, Select, message, Tooltip, Tag } from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  FileImageOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  CloseCircleOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import heic2any from 'heic2any';

/**
 * Trạng thái convert của mỗi file
 */
type ConvertStatus = 'pending' | 'converting' | 'done' | 'error';

/**
 * Định dạng output hỗ trợ
 */
type OutputFormat = 'image/jpeg' | 'image/png';

/**
 * Thông tin một file HEIC trong danh sách
 */
interface HeicFileItem {
  id: string;
  originalFile: File;
  originalName: string;
  originalSize: number;
  status: ConvertStatus;
  progress: number;
  convertedBlob: Blob | null;
  convertedUrl: string | null;
  convertedSize: number;
  error: string | null;
}

/**
 * Component chuyển đổi ảnh HEIC/HEIF sang PNG hoặc JPEG
 * Hỗ trợ upload nhiều ảnh cùng lúc, convert song song, tải về cùng lúc
 * Không giảm chất lượng ảnh (quality = 1.0)
 */
const HeicConverter: React.FC = () => {
  // Danh sách file HEIC đã upload
  const [files, setFiles] = useState<HeicFileItem[]>([]);
  // Định dạng output: JPEG hoặc PNG
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('image/jpeg');
  // Đang convert hàng loạt
  const [isConvertingAll, setIsConvertingAll] = useState(false);
  // Ref để giữ input file ẩn
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Format kích thước file sang đơn vị đọc được (KB, MB)
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  /**
   * Tạo ID duy nhất cho mỗi file
   */
  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  };

  /**
   * Lấy extension output dựa trên format
   */
  const getExtension = (format: OutputFormat): string => {
    return format === 'image/jpeg' ? '.jpg' : '.png';
  };

  /**
   * Xử lý khi user chọn file từ input
   */
  const handleFilesSelected = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newItems: HeicFileItem[] = [];
    let skippedCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const isHeic =
        file.type === 'image/heic' ||
        file.type === 'image/heif' ||
        file.name.toLowerCase().endsWith('.heic') ||
        file.name.toLowerCase().endsWith('.heif');

      if (!isHeic) {
        skippedCount++;
        continue;
      }

      newItems.push({
        id: generateId(),
        originalFile: file,
        originalName: file.name,
        originalSize: file.size,
        status: 'pending',
        progress: 0,
        convertedBlob: null,
        convertedUrl: null,
        convertedSize: 0,
        error: null,
      });
    }

    if (newItems.length === 0) {
      message.warning('Không tìm thấy file HEIC/HEIF nào. Vui lòng chọn đúng định dạng.');
      return;
    }

    if (skippedCount > 0) {
      message.info(`Đã bỏ qua ${skippedCount} file không phải HEIC/HEIF`);
    }

    setFiles(prev => [...prev, ...newItems]);
    message.success(`Đã thêm ${newItems.length} ảnh HEIC`);
  }, []);

  /**
   * Convert một file HEIC sang format đã chọn
   */
  const convertSingleFile = async (fileItem: HeicFileItem, format: OutputFormat): Promise<void> => {
    // Cập nhật trạng thái đang convert
    setFiles(prev =>
      prev.map(f =>
        f.id === fileItem.id ? { ...f, status: 'converting' as ConvertStatus, progress: 30 } : f
      )
    );

    try {
      // Convert HEIC → format đã chọn, quality = 1.0 (không giảm chất lượng)
      const convertedBlob = await heic2any({
        blob: fileItem.originalFile,
        toType: format,
        quality: 1.0, // Giữ nguyên chất lượng 100%
      });

      const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      const url = URL.createObjectURL(blob);

      // Cập nhật kết quả convert thành công
      setFiles(prev =>
        prev.map(f =>
          f.id === fileItem.id
            ? {
                ...f,
                status: 'done' as ConvertStatus,
                progress: 100,
                convertedBlob: blob,
                convertedUrl: url,
                convertedSize: blob.size,
                error: null,
              }
            : f
        )
      );
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Không thể chuyển đổi file này';
      console.error(`❌ Lỗi convert ${fileItem.originalName}:`, err);
      // Cập nhật trạng thái lỗi
      setFiles(prev =>
        prev.map(f =>
          f.id === fileItem.id
            ? {
                ...f,
                status: 'error' as ConvertStatus,
                progress: 0,
                error: errorMsg,
              }
            : f
        )
      );
    }
  };

  /**
   * Convert tất cả file đang pending song song
   */
  const convertAll = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending' || f.status === 'error');
    if (pendingFiles.length === 0) {
      message.info('Tất cả ảnh đã được convert');
      return;
    }

    setIsConvertingAll(true);

    // Convert song song tối đa 3 file cùng lúc để tránh treo browser
    const batchSize = 3;
    for (let i = 0; i < pendingFiles.length; i += batchSize) {
      const batch = pendingFiles.slice(i, i + batchSize);
      await Promise.all(batch.map(f => convertSingleFile(f, outputFormat)));
    }

    setIsConvertingAll(false);
    message.success('Đã convert xong tất cả!');
  };

  /**
   * Tải về một file đã convert
   */
  const downloadSingle = (fileItem: HeicFileItem) => {
    if (!fileItem.convertedBlob || !fileItem.convertedUrl) return;

    const link = document.createElement('a');
    link.href = fileItem.convertedUrl;
    // Đổi extension cho tên file
    const baseName = fileItem.originalName.replace(/\.(heic|heif)$/i, '');
    link.download = baseName + getExtension(outputFormat);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Tải về tất cả file đã convert cùng lúc
   */
  const downloadAll = () => {
    const doneFiles = files.filter(f => f.status === 'done' && f.convertedBlob);
    if (doneFiles.length === 0) {
      message.warning('Chưa có file nào được convert xong');
      return;
    }

    // Tải từng file với delay nhỏ để browser không block
    doneFiles.forEach((fileItem, index) => {
      setTimeout(() => {
        downloadSingle(fileItem);
      }, index * 300); // Delay 300ms giữa mỗi file
    });

    message.success(`Đang tải ${doneFiles.length} ảnh...`);
  };

  /**
   * Xóa một file khỏi danh sách
   */
  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      // Giải phóng URL object nếu có
      if (file?.convertedUrl) {
        URL.revokeObjectURL(file.convertedUrl);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  /**
   * Xóa tất cả file
   */
  const clearAll = () => {
    // Giải phóng tất cả URL objects
    files.forEach(f => {
      if (f.convertedUrl) URL.revokeObjectURL(f.convertedUrl);
    });
    setFiles([]);
  };

  // Đếm số file theo trạng thái
  const stats = {
    total: files.length,
    pending: files.filter(f => f.status === 'pending').length,
    converting: files.filter(f => f.status === 'converting').length,
    done: files.filter(f => f.status === 'done').length,
    error: files.filter(f => f.status === 'error').length,
  };

  /**
   * Render icon trạng thái cho mỗi file
   */
  const renderStatusIcon = (status: ConvertStatus) => {
    switch (status) {
      case 'pending':
        return <FileImageOutlined className="text-gray-400 text-lg" />;
      case 'converting':
        return <LoadingOutlined className="text-blue-500 text-lg" spin />;
      case 'done':
        return <CheckCircleOutlined className="text-green-500 text-lg" />;
      case 'error':
        return <CloseCircleOutlined className="text-red-500 text-lg" />;
    }
  };

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <FileImageOutlined className="text-blue-500" />
          <span>HEIC → JPEG/PNG Converter</span>
          {stats.total > 0 && (
            <Tag color="blue" className="ml-2">
              {stats.total} ảnh
            </Tag>
          )}
        </div>
      }
      extra={
        files.length > 0 && (
          <Button
            danger
            size="small"
            icon={<ClearOutlined />}
            onClick={clearAll}
          >
            Xóa tất cả
          </Button>
        )
      }
    >
      {/* Khu vực chọn format và upload */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
        {/* Chọn format output */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Chuyển sang:</span>
          <Select
            value={outputFormat}
            onChange={(value: OutputFormat) => setOutputFormat(value)}
            style={{ width: 130 }}
            options={[
              { value: 'image/jpeg', label: '📸 JPEG (.jpg)' },
              { value: 'image/png', label: '🖼️ PNG (.png)' },
            ]}
          />
        </div>

        {/* Nút upload */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".heic,.heif,image/heic,image/heif"
            multiple
            style={{ display: 'none' }}
            onChange={e => {
              handleFilesSelected(e.target.files);
              // Reset input để có thể chọn lại cùng file
              e.target.value = '';
            }}
          />
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Chọn ảnh HEIC
          </Button>
          <span className="text-xs text-gray-400">(Chọn nhiều ảnh cùng lúc)</span>
        </div>
      </div>

      {/* Khu vực kéo thả */}
      {files.length === 0 && (
        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={e => {
            e.preventDefault();
            e.stopPropagation();
            handleFilesSelected(e.dataTransfer.files);
          }}
        >
          <FileImageOutlined className="text-5xl text-gray-300 mb-3" />
          <p className="text-gray-500 text-base mb-1">
            Kéo thả ảnh HEIC/HEIF vào đây
          </p>
          <p className="text-gray-400 text-sm">
            hoặc nhấn để chọn file • Hỗ trợ chọn nhiều ảnh cùng lúc
          </p>
          <p className="text-gray-400 text-xs mt-2">
            📱 Ảnh từ iPhone/iPad sử dụng định dạng HEIC
          </p>
        </div>
      )}

      {/* Danh sách file */}
      {files.length > 0 && (
        <>
          {/* Thanh hành động hàng loạt */}
          <div className="flex flex-wrap items-center gap-2 mb-3 p-3 bg-gray-50 rounded-lg">
            <Button
              type="primary"
              icon={isConvertingAll ? <LoadingOutlined /> : <FileImageOutlined />}
              onClick={convertAll}
              disabled={isConvertingAll || stats.pending + stats.error === 0}
              loading={isConvertingAll}
              className="bg-green-600 hover:bg-green-700"
            >
              {isConvertingAll
                ? `Đang convert... (${stats.done}/${stats.total})`
                : `Convert tất cả (${stats.pending + stats.error})`}
            </Button>

            <Button
              icon={<DownloadOutlined />}
              onClick={downloadAll}
              disabled={stats.done === 0}
            >
              Tải tất cả ({stats.done})
            </Button>

            {/* Thống kê */}
            <div className="ml-auto flex items-center gap-2 text-xs">
              {stats.done > 0 && (
                <Tag color="green">{stats.done} xong</Tag>
              )}
              {stats.converting > 0 && (
                <Tag color="blue">{stats.converting} đang convert</Tag>
              )}
              {stats.pending > 0 && (
                <Tag color="default">{stats.pending} chờ</Tag>
              )}
              {stats.error > 0 && (
                <Tag color="red">{stats.error} lỗi</Tag>
              )}
            </div>
          </div>

          {/* Danh sách từng file */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {files.map(fileItem => (
              <div
                key={fileItem.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  fileItem.status === 'done'
                    ? 'border-green-200 bg-green-50/50'
                    : fileItem.status === 'error'
                    ? 'border-red-200 bg-red-50/50'
                    : fileItem.status === 'converting'
                    ? 'border-blue-200 bg-blue-50/50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {/* Preview thumbnail */}
                <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                  {fileItem.convertedUrl ? (
                    <img
                      src={fileItem.convertedUrl}
                      alt={fileItem.originalName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    renderStatusIcon(fileItem.status)
                  )}
                </div>

                {/* Thông tin file */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {fileItem.originalName}
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {formatFileSize(fileItem.originalSize)}
                    </span>
                  </div>

                  {/* Progress bar khi đang convert */}
                  {fileItem.status === 'converting' && (
                    <Progress
                      percent={fileItem.progress}
                      size="small"
                      status="active"
                      showInfo={false}
                      className="mt-1 mb-0"
                    />
                  )}

                  {/* Thông tin sau khi convert xong */}
                  {fileItem.status === 'done' && (
                    <div className="text-xs text-green-600 mt-0.5">
                      ✅ → {formatFileSize(fileItem.convertedSize)}
                      {fileItem.convertedSize > fileItem.originalSize
                        ? ` (lớn hơn ${((fileItem.convertedSize / fileItem.originalSize - 1) * 100).toFixed(0)}%)`
                        : ` (nhỏ hơn ${((1 - fileItem.convertedSize / fileItem.originalSize) * 100).toFixed(0)}%)`}
                    </div>
                  )}

                  {/* Thông báo lỗi */}
                  {fileItem.status === 'error' && (
                    <div className="text-xs text-red-500 mt-0.5">
                      ❌ {fileItem.error}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Tải về */}
                  {fileItem.status === 'done' && (
                    <Tooltip title="Tải về">
                      <Button
                        type="primary"
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={() => downloadSingle(fileItem)}
                        className="bg-green-600 hover:bg-green-700"
                      />
                    </Tooltip>
                  )}

                  {/* Convert lại (cho file lỗi hoặc pending) */}
                  {(fileItem.status === 'pending' || fileItem.status === 'error') && (
                    <Tooltip title="Convert">
                      <Button
                        size="small"
                        type="primary"
                        icon={<FileImageOutlined />}
                        onClick={() => convertSingleFile(fileItem, outputFormat)}
                        className="bg-blue-500 hover:bg-blue-600"
                      />
                    </Tooltip>
                  )}

                  {/* Xóa */}
                  <Tooltip title="Xóa">
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeFile(fileItem.id)}
                      disabled={fileItem.status === 'converting'}
                    />
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
};

export default HeicConverter;
