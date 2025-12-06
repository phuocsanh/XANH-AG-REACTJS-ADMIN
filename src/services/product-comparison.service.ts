import { useConfigStore } from '../stores/config.store';
import { getGeminiApiUrl } from '../config/gemini.config';

/**
 * Interface cho thông tin sản phẩm
 */
export interface ProductInfo {
  id?: number;
  name: string;
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
Hãy đóng vai một máy OCR (Nhận diện ký tự quang học) chuyên nghiệp. Nhiệm vụ của bạn là ĐỌC và CHÉP LẠI chính xác từng chữ trên nhãn thuốc này.

QUY TẮC BẮT BUỘC:
1. KHÔNG được bỏ sót bất kỳ dòng chữ nhỏ nào, đặc biệt là phần "LƯU Ý" và các dòng cảnh báo ở cuối nhãn.
2. Đối với Bảng Liều Lượng/Thời gian sử dụng: Phải chép lại đủ từng mốc thời gian và liều lượng tương ứng (Ví dụ: 4-6 ngày -> 80ml...).
3. Tuyệt đối KHÔNG tóm tắt. Thấy chữ gì chép chữ đó.

Cấu trúc JSON trả về:
{
  "name": "Tên sản phẩm",
  "active_ingredient": "Hoạt chất",
  "concentration": "Hàm lượng",
  "manufacturer": "Nhà sản xuất",
  "usage": "Tóm tắt 1 câu công dụng chính",
  "details": {
    "usage": "Chép lại NGUYÊN VĂN mục CÔNG DỤNG",
    "dosage": "Chép lại NGUYÊN VĂN mục LIỀU LƯỢNG và HƯỚNG DẪN SỬ DỤNG. \n*QUAN TRỌNG:* Phải liệt kê đầy đủ bảng hướng dẫn chi tiết (VD: \n- 4-6 ngày sau sạ: ... \n- 7-9 ngày sau sạ: ... \n- 10-12 ngày sau sạ: ...)",
    "application_time": "Chép lại NGUYÊN VĂN mục THỜI ĐIỂM SỬ DỤNG",
    "preharvest_interval": "Chép lại NGUYÊN VĂN mục THỜI GIAN CÁCH LY",
    "notes": "Chép lại NGUYÊN VĂN mục LƯU Ý. \n*QUAN TRỌNG:* Đọc kỹ các dòng chữ nhỏ ở dưới cùng (Ví dụ: Không dùng chung với thuốc gốc gì? Cách ly bao nhiêu ngày?)"
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
 */
export const validateImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!validTypes.includes(file.type)) {
    return false;
  }

  if (file.size > maxSize) {
    return false;
  }

  return true;
};
