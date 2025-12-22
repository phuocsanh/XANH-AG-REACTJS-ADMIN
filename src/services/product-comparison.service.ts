import { useConfigStore } from '../stores/config.store';
import { getGeminiApiUrl } from '../config/gemini.config';

/**
 * Interface cho thông tin sản phẩm
 */
export interface ProductInfo {
  id?: number;
  name: string;
  trade_name?: string; // Hiệu thuốc / Tên thương mại
  volume?: string; // Dung tích/Khối lượng
  notes?: string; // Ghi chú tự động
  product_type?: string;
  product_subtype?: string;
  active_ingredient?: string;
  concentration?: string;
  unit?: string;
  price?: number;
  manufacturer?: string;
  description?: string;
  usage?: string;
  [key: string]: any;
}

/**
 * Interface cho kết quả so sánh
 */
export interface ComparisonResult {
  summary: string;
  comparison: {
    criteria: string;
    products: {
      name: string;
      value: string;
      score: number;
      note: string;
    }[];
  }[];
  recommendations: string[];
  timestamp: string;
}

/**
 * Lấy Gemini API key từ store (đã được load sẵn khi app khởi động)
 */
const getGeminiApiKey = (): string => {
  const { geminiApiKey4 } = useConfigStore.getState();
  
  if (!geminiApiKey4 || !geminiApiKey4.trim()) {
    throw new Error('Gemini API key not found. Please configure "GEMINI_API_KEY_4" in Firebase Remote Config and reload the app.');
  }
  
  console.log('🔑 Using GEMINI_API_KEY_4:', geminiApiKey4.substring(0, 20) + '...');
  return geminiApiKey4;
};

/**
 * Service xử lý so sánh sản phẩm
 */
export const productComparisonService = {
  /**
   * So sánh sản phẩm sử dụng Gemini API
   */
  compareProducts: async (
    currentProduct: ProductInfo,
    compareWith: ProductInfo[],
    images?: string[],
  ): Promise<ComparisonResult> => {
    // Hàm lọc chỉ lấy các trường cần thiết
    const filterProductFields = (product: ProductInfo) => ({
      name: product.name,
      ingredient: product.ingredient || product.active_ingredient, // Support both keys
      description: product.description,
      attributes: product.attributes,
      symbol: product.symbol,
    });

    // Lọc dữ liệu
    const filteredCurrentProduct = filterProductFields(currentProduct);
    const filteredCompareWith = compareWith.map(filterProductFields);

    const prompt = `
Bạn là chuyên gia phân tích và so sánh sản phẩm nông nghiệp, đặc biệt là thuốc bảo vệ thực vật (BVTV).

**Sản phẩm hiện tại:**
${JSON.stringify(filteredCurrentProduct, null, 2)}

**Các sản phẩm để so sánh:**
${JSON.stringify(filteredCompareWith, null, 2)}

Hãy phân tích và so sánh các sản phẩm theo các tiêu chí sau:
1. Hoạt chất và hiệu quả
2. Giá cả và hiệu quả chi phí
3. An toàn cho người và môi trường
4. Phổ diệt rộng/hẹp
5. Thời gian tác dụng
6. Nguy cơ kháng thuốc
7. Tính tương thích

Cho mỗi tiêu chí, hãy:
- Đánh giá từng sản phẩm (value)
- Cho điểm từ 1-10 (score)
- Ghi chú ngắn gọn (note)

Trả về kết quả dưới dạng JSON với cấu trúc:
{
  "summary": "Tóm tắt tổng quan về các sản phẩm",
  "comparison": [
    {
      "criteria": "Tên tiêu chí",
      "products": [
        {
          "name": "Tên sản phẩm",
          "value": "Giá trị cụ thể",
          "score": 8,
          "note": "Ghi chú ngắn"
        }
      ]
    }
  ],
  "recommendations": ["Khuyến nghị 1", "Khuyến nghị 2"]
}

Chỉ trả về JSON, không thêm text nào khác.
`;

    try {
      const apiKey = getGeminiApiKey();
      console.log('🔑 Gemini API Key:', apiKey ? 'Found' : 'Not found');
      console.log('📤 Sending comparison request:', { currentProduct, compareWith, images: images?.length || 0 });
      
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
              ...(images || []).map(img => ({
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: img.split(',')[1] // Remove data:image/jpeg;base64, prefix
                }
              }))
            ]
          }]
        }),
      });

      console.log('📥 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Gemini API error:', errorText);
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 Gemini response:', data);
      
      const text = data.candidates[0].content.parts[0].text;
      console.log('📝 AI text response:', text);
      
      // Parse JSON từ response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('❌ No JSON found in response');
        throw new Error('Không thể parse JSON từ AI response');
      }

      const result = JSON.parse(jsonMatch[0]);
      console.log('✅ Parsed result:', result);
      
      return {
        ...result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('💥 Error calling Gemini API:', error);
      throw error;
    }
  },

  /**
   * Phân tích ảnh sản phẩm sử dụng Gemini Vision
   */
  analyzeImage: async (images: string[]): Promise<ProductInfo> => {
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

3. **trade_name**: Hiệu thuốc + Dung tích (BẮT BUỘC nếu có)
   - Nếu có hiệu thuốc tiếng Việt: Dùng hiệu + dung tích
     + Ví dụ: name="BEAMMY KASU 300SC (450ml)", trade_name="Siêu Bệnh (450ml)"
   - Nếu KHÔNG có hiệu thuốc: Dùng tên chính thức + dung tích (giống name)
     + Ví dụ: name="BEAMMY KASU 300SC (450ml)", trade_name="BEAMMY KASU 300SC (450ml)"


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

VD: "• Liều lượng: 30ml/bình 25L\n• Phun được: ~2.31 công (1 chai 450ml)"
Cấu trúc JSON trả về:
{
  "name": "Tên sản phẩm (viết hoa) + (dung tích) - VD: BEAMMY KASU 300SC (450ml)",
  "volume": "Dung tích/Khối lượng (VD: 450ml, 1 lít, 500g) - Tìm trên nhãn ở mục Dung tích, Quy cách, Net, hoặc ghi rõ",
  "notes": "Ghi chú tự động (bao gồm tính toán liều lượng nếu có thông tin)",
  "trade_name": "Hiệu thuốc tiếng Việt + (dung tích) HOẶC tên chính thức + (dung tích) - VD: Siêu Bệnh (450ml) hoặc BEAMMY KASU 300SC (450ml)",
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

    try {
      const apiKey = getGeminiApiKey();
      
      // Tạo parts từ danh sách ảnh
      const imageParts = images.map(imgBase64 => ({
        inline_data: {
          mime_type: 'image/jpeg',
          data: imgBase64.split(',')[1] || imgBase64
        }
      }));

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
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Product Analysis Response:', data);

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
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw error;
    }
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
