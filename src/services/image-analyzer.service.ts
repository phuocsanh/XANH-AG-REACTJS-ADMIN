import { useConfigStore } from '../stores/config.store';
import { getGeminiApiUrl } from '../config/gemini.config';

/**
 * Interface cho thông tin sản phẩm trích xuất từ ảnh
 */
export interface ExtractedProductInfo {
  name: string;
  trade_name?: string;
  volume?: string;
  notes?: string;
  active_ingredient?: string;
  concentration?: string;
  manufacturer?: string;
  description?: string;
  usage?: string;
  details?: {
    usage?: string;
    dosage?: string;
    application_time?: string;
    preharvest_interval?: string;
    notes?: string;
  };
}

/**
 * Tự động thử tất cả Gemini API keys khi gặp lỗi
 * Helper function để retry với tất cả keys có sẵn trong Remote Config
 * 
 * @param operation - Function nhận (apiKey, keyName) và trả về Promise<T>
 * @param operationName - Tên operation để logging
 * @returns Kết quả từ operation thành công đầu tiên
 * @throws Error nếu tất cả keys đều thất bại
 */
const tryAllGeminiKeys = async <T>(
  operation: (apiKey: string, keyName: string) => Promise<T>,
  operationName: string
): Promise<T> => {
  const store = useConfigStore.getState();
  
  // Tự động lấy tất cả keys từ store (geminiApiKey1, geminiApiKey2, ...)
  // Không cần hardcode - nếu thêm key mới vào store, code tự động nhận
  const allKeys: { key: string; name: string }[] = [];
  
  Object.keys(store).forEach((key) => {
    if (key.startsWith('geminiApiKey') && typeof store[key as keyof typeof store] === 'string') {
      const apiKey = store[key as keyof typeof store] as string;
      if (apiKey && apiKey.trim()) {
        allKeys.push({
          key: apiKey,
          name: key.toUpperCase().replace(/([A-Z])/g, '_$1').replace(/^_/, '').replace('GEMINI_API_KEY', 'GEMINI_API_KEY_')
        });
      }
    }
  });

  if (allKeys.length === 0) {
    throw new Error('Không tìm thấy Gemini API key nào trong Remote Config. Vui lòng cấu hình ít nhất 1 key.');
  }

  console.log(`🔑 [${operationName}] Tìm thấy ${allKeys.length} API keys trong config`);

  let lastError: Error | null = null;

  // Loop qua tất cả keys và thử execute operation
  for (let i = 0; i < allKeys.length; i++) {
    const keyConfig = allKeys[i];
    const { key, name } = keyConfig;
    
    // TypeScript guard: key đã được filter nên chắc chắn không null
    if (!key) continue;
    
    try {
      console.log(`🔑 [${operationName}] Đang thử key ${i + 1}/${allKeys.length}: ${name}`);
      
      const result = await operation(key, name);
      
      console.log(`✅ [${operationName}] Thành công với key: ${name}`);
      return result;
      
    } catch (error: any) {
      lastError = error;
      
      // Log chi tiết lỗi
      console.warn(`⚠️ [${operationName}] Key ${name} thất bại:`, error.message);
      
      // Kiểm tra loại lỗi
      const errorMsg = error.message?.toLowerCase() || '';
      const isQuotaError = errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('resource_exhausted');
      const isOverloadedError = errorMsg.includes('503') || errorMsg.includes('overloaded') || errorMsg.includes('unavailable');
      
      if (isQuotaError) {
        console.warn(`📊 [${operationName}] Hết quota cho ${name}, đang thử key tiếp theo...`);
      } else if (isOverloadedError) {
        console.warn(`⏳ [${operationName}] Service quá tải cho ${name}, đang thử key tiếp theo...`);
      } else {
        console.warn(`🔍 [${operationName}] Lỗi khác cho ${name}, đang thử key tiếp theo...`);
      }
      
      // Nếu đây là key cuối cùng, throw error
      if (i === allKeys.length - 1) {
        console.error(`❌ [${operationName}] Tất cả ${allKeys.length} keys đều thất bại. Lỗi cuối:`, error.message);
        throw new Error(`Tất cả ${allKeys.length} API keys đều thất bại. Lỗi cuối: ${error.message}`);
      }
      
      // Chờ 500ms trước khi thử key tiếp theo để tránh rate limit
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Fallback (không bao giờ đến đây vì đã throw ở trên)
  throw new Error(`Tất cả API keys đều thất bại. Lỗi cuối: ${lastError?.message || 'Unknown error'}`);
};

/**
 * Service xử lý trích xuất thông tin từ ảnh sản phẩm
 */
export const imageAnalyzerService = {
  /**
   * Phân tích ảnh sản phẩm sử dụng Gemini Vision
   * Tự động thử tất cả API keys nếu gặp lỗi quota
   */
  analyzeImage: async (images: string[]): Promise<ExtractedProductInfo> => {
    const prompt = `
Hãy đóng vai một chuyên gia xử lý dữ liệu OCR. Nhiệm vụ của bạn là trích xuất thông tin từ nhãn thuốc BVTV và CHUẨN HÓA nội dung.

QUY TẮC QUAN TRỌNG ĐỂ TRÁNH LẶP TIÊU ĐỀ:
1. Khi trích xuất nội dung của một mục, BẮT BUỘC PHẢI LOẠI Bỏ TIÊU ĐỀ của mục đó trong giá trị trả về.
   - Ví dụ SAI: "usage": "CÔNG DỤNG: Trừ các loại cỏ..."
   - Ví dụ ĐÚNG: "usage": "Trừ các loại cỏ..." (Đã xóa bỏ chữ "CÔNG DỤNG:")
   
2. Vẫn phải giữ nguyên vẹn nội dung chi tiết, các mốc thời gian, số liệu, không được tóm tắt sai lệch.

QUY TẮC VỀ TÊN SẢN PHẨM VÀ DUNG TÍCH:
**QUAN TRỌNG**: Phải tìm và thêm dung tích vào cả name và trade_name!

1. **Tìm dung tích trên nhãn**:
   - Tìm thông tin về dung tích chai/gói: ml, lít, g, kg, cc, v.v.
   - Thường nằm ở: "Dung tích:", "Quy cách:", "Net:", "Thể tích:", hoặc ghi rõ trên nhãn
   - Ví dụ: "450ml", "1 lít", "500g", "100cc"

2. **name**: Tên chính thức + Dung tích (BẮT BUỘC nếu có)
   - Định dạng: "TÊN SẢN PHẨM (dung tích)"
   - Ví dụ: "BEAMMY KASU 300SC (450ml)", "SIÊU BỆNH 300SC (1 lít)", "KARATE 50EC (100ml)"
   - Nếu KHÔNG tìm thấy dung tích: Chỉ lấy tên "BEAMMY KASU 300SC"

3. **trade_name**: Hiệu thuốc + Hàm lượng + Dung tích (BẮT BUỘC)
   **QUAN TRỌNG**: Phải thêm hàm lượng (VD: 300SC, 50EC, 20WP) vào tên thương mại!
   
   - **Bước 1**: Tìm hàm lượng từ tên sản phẩm (name)
     + Ví dụ: "BEAMMY KASU 300SC" → Hàm lượng là "300SC"
     + Ví dụ: "KARATE 50EC" → Hàm lượng là "50EC"
     + Ví dụ: "MANCOZEB 20WP" → Hàm lượng là "20WP"
   
   - **Bước 2**: Thêm hàm lượng vào tên thương mại
     + Nếu có hiệu thuốc tiếng Việt: Hiệu + Hàm lượng + Dung tích
       * Ví dụ: name="BEAMMY KASU 300SC (450ml)", trade_name="SẠCH BỆNH 300SC (450ml)"
       * Ví dụ: name="KARATE 50EC (100ml)", trade_name="KARATE 50EC (100ml)" (nếu không có hiệu tiếng Việt)
     
     + Nếu KHÔNG có hiệu thuốc: Dùng tên chính thức + hàm lượng + dung tích (giống name)
       * Ví dụ: name="BEAMMY KASU 300SC (450ml)", trade_name="BEAMMY KASU 300SC (450ml)"
   
   **LƯU Ý**: TUYỆT ĐỐI KHÔNG được bỏ qua hàm lượng trong trade_name!


TÍNH TOÁN LIỀU LƯỢNG (GHI VÀO NOTES):
**CHỈ TÍNH 2 THÔNG TIN CHÍNH**:

1. **Liều lượng/bình 25 lít**: Tìm thông tin ml/bình hoặc tính từ liều/ha
   - VD: Nếu nhãn ghi "30ml/bình" → Ghi: "30ml/bình 25L"
   - VD: Nếu ghi "600ml/ha" → Tính: 600ml/ha ÷ 10 bình/ha = 60ml/bình

2. **Số công phun được**: Tính từ dung tích chai
   - Công thức: (Dung tích chai ÷ Liều/bình) × 200m² ÷ 1296m²
   - VD: Chai 450ml, liều 30ml/bình → (450÷30) × 200 ÷ 1296 = 2.31 công
   - 1 công = 1296m²

**FORMAT KẾT QUẢ (CHỈ 2 DÒNG)**:
• Liều lượng: [X]ml/bình 25L
• Phun được: ~[Y] công (1 chai [Z]ml)

VD: "• Liều lượng: 30ml/bình 25L\\n• Phun được: ~2.31 công (1 chai 450ml)"
Cấu trúc JSON trả về:
{
  "name": "Tên sản phẩm (viết hoa) + (dung tích) - VD: BEAMMY KASU 300SC (450ml)",
  "volume": "Dung tích/Khối lượng (VD: 450ml, 1 lít, 500g) - Tìm trên nhãn ở mục Dung tích, Quy cách, Net, hoặc ghi rõ",
  "notes": "Ghi chú tự động (bao gồm tính toán liều lượng nếu có thông tin)",
  "trade_name": "Hiệu thuốc tiếng Việt + HÀM LƯỢNG + (dung tích) - VD: SẠCH BỆNH 300SC (450ml). QUAN TRỌNG: Phải có hàm lượng (300SC, 50EC, 20WP...) từ tên sản phẩm!",
  "active_ingredient": "Hoạt chất VÀ Hàm lượng (BẮT BUỘC: Phải lấy cả tên hoạt chất và nồng độ/hàm lượng đi kèm. Ví dụ: 'Butachlor 150g/l' hoặc 'Mancozeb 20%'. Nếu có nhiều hoạt chất thì liệt kê đầy đủ, ngăn cách bằng dấu phẩy)",
  "concentration": "Hàm lượng (Nếu đã gộp vào active_ingredient thì trường này có thể để trống hoặc lặp lại)",
  "manufacturer": "Nhà sản xuất/đăng ký",
  "usage": "Tóm tắt 1 câu ngắn gọn công dụng chính (VD: Thuốc trừ cỏ hậu nảy mầm)",
  "details": {
    "usage": "Nội dung chi tiết mục CÔNG DỤNG (CHỈ LẤY NỘI DUNG, KHÔNG chép lại chữ 'CÔNG DỤNG')",
    "dosage": "Nội dung mục LIỀU LƯỢNG/HƯỚNG DẪN SỬ DỤNG. Trình bày rõ ràng dạng list nếu có nhiều mốc thời gian (VD: - 4-6 ngày: ...). (KHÔNG chép lại chữ 'HƯỚNG DẪN SỬ DỤNG')",
    "application_time": "Nội dung mục THỜI ĐIỂM SỬ DỤNG (KHÔNG chép lại tiêu đề)",
    "preharvest_interval": "Nội dung mục THỜI GIAN CÁCH LY (KHÔNG chép lại tiêu đề)",
    "notes": "Nội dung mục LƯU Ý/CẢNH BÁO. Bao gồm cả các dòng cảnh báo về thuốc gốc Carbamate/Lân hữu cơ nếu có. (KHÔNG chép lại chữ 'LƯU Ý')"
  }
}

Chỉ trả về JSON.
`;

    // Tạo parts từ danh sách ảnh
    const imageParts = images.map(imgBase64 => ({
      inline_data: {
        mime_type: 'image/jpeg',
        data: imgBase64.split(',')[1] || imgBase64
      }
    }));

    // Sử dụng tryAllGeminiKeys để tự động retry với tất cả keys
    return tryAllGeminiKeys<ExtractedProductInfo>(
      async (apiKey, keyName) => {
        console.log(`🔑 Đang phân tích ảnh với key: ${keyName}`);
        
        const response = await fetch(
          getGeminiApiUrl(apiKey),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: prompt },
                  ...imageParts
                ]
              }]
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Gemini API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        console.log('📊 Gemini response:', data);

        if (!data.candidates || data.candidates.length === 0) {
          if (data.promptFeedback) {
            console.error('Prompt Feedback:', data.promptFeedback);
            throw new Error(`AI từ chối phân tích ảnh: ${data.promptFeedback.blockReason || 'Lý do không xác định'}`);
          }
          throw new Error('AI không trả về kết quả nào.');
        }

        const candidate = data.candidates[0];
        console.log('🔍 Candidate Detail:', JSON.stringify(candidate, null, 2));

        // Kiểm tra lý do kết thúc nếu không có nội dung
        if (!candidate.content) {
          if (candidate.finishReason && candidate.finishReason !== 'STOP') {
            throw new Error(`AI không trả về nội dung. Lý do: ${candidate.finishReason}. Vui lòng thử lại với ảnh khác.`);
          }
          throw new Error('AI trả về phản hồi rỗng không xác định.');
        }
        
        if (!candidate.content.parts || !candidate.content.parts[0]) {
          throw new Error('Cấu trúc nội dung từ AI thiếu thành phần text.');
        }

        const text = candidate.content.parts[0].text;
        
        // Parse JSON từ response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Không thể parse JSON từ AI response');
        }

        return JSON.parse(jsonMatch[0]);
      },
      'Analyze Image'
    );
  },

  /**
   * Sử dụng AI Gemini để tạo tên Web tối ưu từ thông tin sản phẩm
   */
  generateWebName: async (data: {
    type?: string;
    trade_name?: string;
    volume?: string;
    description?: string;
  }): Promise<string> => {
    const prompt = `
Hãy đóng vai một chuyên gia Marketing Nông nghiệp. Nhiệm vụ của bạn là tạo một "Tên hiển thị trên Web" (web_name) cho sản phẩm thuốc BVTV sao cho tối ưu SEO và dễ đọc cho nông dân.

CẤU TRÚC BẮT BUỘC:
[Loại sản phẩm] [Tên thương mại] [Dạng thuốc] ([Quy cách/Dung tích]) - [Điểm nổi bật nhất/Đặc trị]

DỮ LIỆU ĐẦU VÀO:
- Loại: ${data.type || 'Chưa xác định'}
- Tên thương mại: ${data.trade_name || ''}
- Dung tích: ${data.volume || ''}
- Mô tả/Công dụng: ${data.description || ''}

QUY TẮC:
1. "Loại sản phẩm" phải là cụm từ phổ biến (VD: Thuốc trừ sâu, Thuốc trừ bệnh, Thuốc trừ cỏ, Phân bón lá, Kích thích sinh trưởng).
2. "Điểm nổi bật" (Specialty/Feature) lấy từ phần mô tả/công dụng. Chỉ lấy 1 cụm từ ngắn gọn, súc tích nhất (VD: Đặc trị sâu cuốn lá, Sạch đạo ôn cổ bông, Kích rễ cực mạnh).
3. "Dạng thuốc" (Dosage form) như 240SC, 50EC, 10WP... nết có trong tên thương mại thì lấy ra dùng.
4. "Quy cách/Dung tích": Nếu là chai 450ml thì ghi (Chai 450ml), nếu là gói 100g thì ghi (Gói 100g).
5. Tên cuối cùng phải viết hoa các từ quan trọng đúng cách.

CHỈ TRẢ VỀ CHUỖI TÊN ĐÃ TẠO (KẾT QUẢ CUỐI CÙNG), KHÔNG TRẢ VỀ BẤT KỲ GIẢI THÍCH NÀO KHÁC.
        `;

    return tryAllGeminiKeys<string>(
      async (apiKey, keyName) => {
        console.log(`🔑 Đang tạo tên Web với key: ${keyName}`);
        
        const response = await fetch(
          getGeminiApiUrl(apiKey),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: prompt }
                ]
              }]
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Gemini API error (${response.status}): ${errorText}`);
        }

        const resData = await response.json();
        const text = resData.candidates[0].content.parts[0].text.trim();
        
        // Loại bỏ các ký tự Markdown nếu AI lỡ tay thêm vào
        return text.replace(/[*#`]/g, '').trim();
      },
      'Generate Web Name'
    );
  },
};

/**
 * Utility: Convert File to Base64
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Utility: Validate image file
 * Hỗ trợ HEIC/HEIF từ iPhone
 */
export const validateImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  // Kiểm tra MIME type hoặc extension (vì một số browser không nhận diện HEIC)
  const isValidType = validTypes.includes(file.type) || 
                      file.name.toLowerCase().endsWith('.heic') || 
                      file.name.toLowerCase().endsWith('.heif');

  if (!isValidType) {
    console.warn('❌ File type không hợp lệ:', file.type, file.name);
    return false;
  }

  if (file.size > maxSize) {
    console.warn('❌ File quá lớn:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    return false;
  }

  return true;
};

