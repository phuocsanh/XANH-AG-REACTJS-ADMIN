import imageCompression from 'browser-image-compression';
import heic2any from 'heic2any';
import api from '../utils/api';

// Danh sách Type hợp lệ
export const UPLOAD_TYPES = {
  AVATAR: 'avatar',
  PRODUCT: 'product',
  RICE_CROP: 'rice-crop',
  DOCUMENT: 'document',
  COMMON: 'common',
} as const;

export type UploadType = typeof UPLOAD_TYPES[keyof typeof UPLOAD_TYPES];

export interface UploadResponse {
  id: string;
  public_id: string;
  url: string;
  name: string;
  type: string;
  size: number;
}

export const uploadService = {
  /**
   * Upload ảnh lên server với tính năng nén tự động
   * @param originalFile File gốc từ input
   * @param uploadType Loại upload (để server lưu vào đúng folder)
   * @returns Promise<UploadResponse>
   */
  uploadImage: async (originalFile: File, uploadType: UploadType = UPLOAD_TYPES.COMMON): Promise<UploadResponse> => {
    try {
      console.log(`🖼️ Bắt đầu xử lý ảnh: ${originalFile.name} (${(originalFile.size / 1024 / 1024).toFixed(2)} MB)`);
      
      let fileToProcess = originalFile;

      // 1. Chuyển đổi HEIC/HEIF sang JPEG nếu cần
      if (originalFile.type === 'image/heic' || originalFile.type === 'image/heif' || originalFile.name.toLowerCase().endsWith('.heic') || originalFile.name.toLowerCase().endsWith('.heif')) {
        console.log('📱 Phát hiện ảnh HEIC/HEIF từ iPhone, đang chuyển đổi sang JPEG...');
        try {
          const convertedBlob = await heic2any({
            blob: originalFile,
            toType: 'image/jpeg',
            quality: 0.9,
          });

          // heic2any có thể trả về Blob hoặc Blob[]
          const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
          
          // Tạo File mới từ Blob
          fileToProcess = new File(
            [blob], 
            originalFile.name.replace(/\.(heic|heif)$/i, '.jpg'),
            { type: 'image/jpeg' }
          );
          
          console.log(`✅ Chuyển đổi HEIC thành công: ${(fileToProcess.size / 1024 / 1024).toFixed(2)} MB`);
        } catch (heicError) {
          console.error('❌ Lỗi chuyển đổi HEIC:', heicError);
          throw new Error('Không thể chuyển đổi ảnh HEIC. Vui lòng chọn ảnh định dạng JPG/PNG.');
        }
      }

      // 2. Cấu hình nén & Resize
      const options = {
        maxSizeMB: 1,             // Tối đa 1MB
        maxWidthOrHeight: 1920,   // Resize về tối đa 1920px
        useWebWorker: true,
        fileType: fileToProcess.type as string,
      };

      // 3. Thực hiện nén ở Client
      let compressedFile = fileToProcess;
      // Chỉ nén nếu là ảnh
      if (fileToProcess.type.startsWith('image/')) {
        try {
          compressedFile = await imageCompression(fileToProcess, options);
          console.log(`✅ Nén thành công: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
        } catch (compressionError) {
          console.warn('⚠️ Lỗi nén ảnh, sẽ upload ảnh đã chuyển đổi:', compressionError);
        }
      }

      // 4. Chuẩn bị FormData
      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('type', uploadType);

      // 5. Gọi API
      const response = await api.postForm<any>('/upload/image', formData);
      
      // Unwrap data từ response wrapper { success, data, meta }
      const uploadData = response.data || response;
      
      return uploadData as UploadResponse;
    } catch (error) {
      console.error('❌ Lỗi upload:', error);
      throw error;
    }
  },

  /**
   * Xóa ảnh đã upload
   * @param publicId Public ID của ảnh (được trả về khi upload)
   */
  deleteImage: async (publicId: string): Promise<void> => {
    try {
      await api.delete('/upload', { publicId });
      console.log('✅ Xóa ảnh thành công:', publicId);
    } catch (error) {
      console.error('❌ Lỗi xóa ảnh:', error);
      throw error;
    }
  }
};
