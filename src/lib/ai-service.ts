import {
  PESTICIDE_MIXING_DOCUMENT_TEXT,
  PESTICIDE_MIXING_REFERENCE_LINKS,
} from "@/data/pesticide-mixing-data"
import { getRemoteConfigValue } from "./firebase"

// Interface cho response data
export interface AiResponse {
  success: boolean
  answer?: string
  error?: string
}

/**
 * Service để gọi trực tiếp Google AI Gemini API từ frontend
 */
class FrontendAiService {
  private readonly model = "gemini-2.5-flash"
  private lastRequestTime: number = 0
  private readonly minRequestInterval: number = 1000 // 1 second between requests

  /**
   * Lấy API key từ Remote Config
   */
  private async getApiKey1(): Promise<string> {
    const apiKey = await getRemoteConfigValue("GEMINI_API_KEY_1")
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY_1 could not be retrieved from Remote Config"
      )
    }
    return apiKey
  }
  private async getApiKey2(): Promise<string> {
    const apiKey = await getRemoteConfigValue("GEMINI_API_KEY_2")
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY_2 could not be retrieved from Remote Config"
      )
    }
    return apiKey
  }
  private async getApiKey3(): Promise<string> {
    const apiKey = await getRemoteConfigValue("GEMINI_API_KEY_3")
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY_3 could not be retrieved from Remote Config"
      )
    }
    return apiKey
  }

  /**
   * Đảm bảo có độ trễ giữa các request để tránh quá tải
   */
  private async ensureRateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    if (timeSinceLastRequest < this.minRequestInterval) {
      const delay = this.minRequestInterval - timeSinceLastRequest
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
    this.lastRequestTime = Date.now()
  }

  /**
   * Tạo prompt cho chức năng mix pesticides
   * @param question Câu hỏi của người dùng
   * @returns Prompt đã được định dạng
   */
  private createMixPesticidesPrompt(question: string): string {
    return `
      Hãy sử dụng tài liệu hướng dẫn phối trộn thuốc Bảo Vệ Thực Vật sau đây để trả lời câu hỏi.
      Nếu thông tin trong tài liệu không đủ, hãy sử dụng công cụ tìm kiếm Google để tìm kiếm thông tin bổ sung và trả lời câu hỏi.

      --- TÀI LIỆU NỀN TẢNG ---
      ${PESTICIDE_MIXING_DOCUMENT_TEXT}
      --- KẾT THÚC TÀI LIỆU ---

      --- CÁC LIÊN KẾT THAM KHẢO ---
      ${PESTICIDE_MIXING_REFERENCE_LINKS.map(
        (link: string) => `- ${link}`
      ).join("\n")}
      --- KẾT THÚC LIÊN KẾT ---

      Câu hỏi cần trả lời: ${question}
      - Luôn đọc kỹ, phân tích tài liệu và nguồn dữ liệu trước khi trả lời câu hỏi.
      - Hãy trả lời bằng tiếng Việt dựa trên tài liệu được cung cấp.
      - Nếu bạn cần tìm kiếm thông tin từ các liên kết hoặc sử dụng công cụ tìm kiếm, hãy thực hiện việc đó để cung cấp câu trả lời chính xác nhất.
      - Trả lời ngắn gọn, súc tích, tập trung vào vấn đề chính.
      - Không cần giải thích dài dòng, chỉ cần đưa ra kết luận rõ ràng về khả năng phối trộn và lưu ý quan trọng.
    `
  }

  /**
   * Tạo prompt cho chức năng sort pesticides
   * @param question Câu hỏi của người dùng
   * @returns Prompt đã được định dạng
   */
  private createSortPesticidesPrompt(question: string): string {
    return `
      Hãy sử dụng tài liệu hướng dẫn phối trộn thuốc Bảo Vệ Thực Vật sau đây để trả lời câu hỏi.
      Nếu thông tin trong tài liệu không đủ, hãy sử dụng công cụ tìm kiếm Google để tìm kiếm thông tin bổ sung và trả lời câu hỏi.

      --- TÀI LIỆU NỀN TẢNG ---
      ${PESTICIDE_MIXING_DOCUMENT_TEXT}
      --- KẾT THÚC TÀI LIỆU ---

      --- CÁC LIÊN KẾT THAM KHẢO ---
      ${PESTICIDE_MIXING_REFERENCE_LINKS.map(
        (link: string) => `- ${link}`
      ).join("\n")}
      --- KẾT THÚC LIÊN KẾT ---

      Câu hỏi cần trả lời: ${question}
      - Luôn đọc kỹ, phân tích tài liệu và nguồn dữ liệu trước khi trả lời câu hỏi.
      - Hãy trả lời bằng tiếng Việt dựa trên tài liệu được cung cấp.
      - Nếu bạn cần tìm kiếm thông tin từ các liên kết hoặc sử dụng công cụ tìm kiếm, hãy thực hiện việc đó để cung cấp câu trả lời chính xác nhất.
      - CHỈ TRẢ VỀ DANH SÁCH TÊN THUỐC THEO THỨ TỰ ĐƯỢC SẮP XẾP, MỖI TÊN THUỐC TRÊN MỘT DÒNG.
      - KHÔNG CẦN GIẢI THÍCH GÌ THÊM, CHỈ TRẢ VỀ TÊN THUỐC THEO THỨ TỰ ƯU TIÊN.
      - VÍ DỤ TRẢ VỀ:
      Actara 25WG
      Anvil 5SC
      Validacin 5A
    `
  }

  /**
   * Gọi API Google AI để xử lý câu hỏi về phối trộn thuốc trừ sâu
   * @param question Câu hỏi của người dùng
   * @returns Promise với kết quả trả về
   */
  async mixPesticides(question: string): Promise<AiResponse> {
    if (!question || question.trim().length === 0) {
      return {
        success: false,
        error: "Vui lòng cung cấp câu hỏi.",
      }
    }

    try {
      // Đảm bảo rate limit
      await this.ensureRateLimit()

      const prompt = this.createMixPesticidesPrompt(question)
      const apiKey = await this.getApiKey1()

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${
          this.model
        }:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            tools: [
              {
                googleSearch: {},
              },
            ],
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error:
            errorData.error?.message ||
            `Lỗi khi gọi API AI. Status: ${response.status}`,
        }
      }

      const data = await response.json()

      if (
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0]
      ) {
        const answer = data.candidates[0].content.parts[0].text || ""
        return {
          success: true,
          answer: answer,
        }
      }

      return {
        success: false,
        error: "Không tìm thấy câu trả lời trong phản hồi từ AI.",
      }
    } catch (error) {
      console.error("Error calling Gemini API:", error)
      return {
        success: false,
        error:
          (error as Error).message || "Lỗi khi gọi API AI để xử lý câu hỏi.",
      }
    }
  }

  /**
   * Gọi API Google AI để xử lý câu hỏi về sắp xếp thuốc trừ sâu
   * @param question Câu hỏi của người dùng
   * @returns Promise với kết quả trả về
   */
  async sortPesticides(question: string): Promise<AiResponse> {
    if (!question || question.trim().length === 0) {
      return {
        success: false,
        error: "Vui lòng cung cấp câu hỏi.",
      }
    }

    try {
      // Đảm bảo rate limit
      await this.ensureRateLimit()

      const prompt = this.createSortPesticidesPrompt(question)
      const apiKey = await this.getApiKey2()

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${
          this.model
        }:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            tools: [
              {
                googleSearch: {},
              },
            ],
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error:
            errorData.error?.message ||
            `Lỗi khi gọi API AI. Status: ${response.status}`,
        }
      }

      const data = await response.json()

      if (
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0]
      ) {
        const answer = data.candidates[0].content.parts[0].text || ""
        return {
          success: true,
          answer: answer,
        }
      }

      return {
        success: false,
        error: "Không tìm thấy câu trả lời trong phản hồi từ AI.",
      }
    } catch (error) {
      console.error("Error calling Gemini API:", error)
      return {
        success: false,
        error:
          (error as Error).message || "Lỗi khi gọi API AI để xử lý câu hỏi.",
      }
    }
  }

  /**
   * Gọi API Google AI để phân tích thời điểm phun thuốc
   * @param prompt Prompt đã được tạo sẵn
   * @returns Promise với kết quả trả về
   */
  async analyzeSprayingTime(prompt: string): Promise<AiResponse> {
    if (!prompt || prompt.trim().length === 0) {
      return {
        success: false,
        error: "Vui lòng cung cấp dữ liệu phân tích.",
      }
    }

    try {
      // Đảm bảo rate limit
      await this.ensureRateLimit()

      const apiKey = await this.getApiKey3()

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${
          this.model
        }:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error:
            errorData.error?.message ||
            `Lỗi khi gọi API AI. Status: ${response.status}`,
        }
      }

      const data = await response.json()

      if (
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0]
      ) {
        const answer = data.candidates[0].content.parts[0].text || ""
        return {
          success: true,
          answer: answer,
        }
      }

      return {
        success: false,
        error: "Không tìm thấy câu trả lời trong phản hồi từ AI.",
      }
    } catch (error) {
      console.error("Error calling Gemini API:", error)
      return {
        success: false,
        error:
          (error as Error).message || "Lỗi khi gọi API AI để phân tích thời điểm.",
      }
    }
  }

  /**
   * Gọi API Google AI để tạo lưu ý quan trọng từ mô tả sản phẩm
   * @param prompt Prompt đã được tạo sẵn
   * @returns Promise với kết quả trả về
   */
  async generateWarning(prompt: string): Promise<AiResponse> {
    if (!prompt || prompt.trim().length === 0) {
      return {
        success: false,
        error: "Vui lòng cung cấp thông tin sản phẩm.",
      }
    }

    try {
      // Đảm bảo rate limit
      await this.ensureRateLimit()

      const apiKey = await this.getApiKey1()

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${
          this.model
        }:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error:
            errorData.error?.message ||
            `Lỗi khi gọi API AI. Status: ${response.status}`,
        }
      }

      const data = await response.json()

      if (
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0]
      ) {
        const answer = data.candidates[0].content.parts[0].text || ""
        return {
          success: true,
          answer: answer,
        }
      }

      return {
        success: false,
        error: "Không tìm thấy câu trả lời trong phản hồi từ AI.",
      }
    } catch (error) {
      console.error("Error calling Gemini API:", error)
      return {
        success: false,
        error:
          (error as Error).message || "Lỗi khi gọi API AI để tạo lưu ý.",
      }
    }
  }

  /**
   * Phân tích ảnh thuốc bảo vệ thực vật để kiểm tra hoạt chất bị cấm
   * @param imageBase64 Ảnh dạng base64 (không bao gồm prefix data:image/...)
   * @param bannedIngredients Danh sách hoạt chất bị cấm
   * @returns Promise với kết quả phân tích
   */
  async analyzePesticideImage(
    imageBase64: string,
    bannedIngredients: string[]
  ): Promise<AiResponse> {
    if (!imageBase64 || imageBase64.trim().length === 0) {
      return {
        success: false,
        error: "Vui lòng cung cấp ảnh để phân tích.",
      }
    }

    try {
      // Đảm bảo rate limit
      await this.ensureRateLimit()

      const apiKey = await this.getApiKey1()

      // Tạo prompt phân tích
      const prompt = `
Bạn là chuyên gia phân tích thuốc bảo vệ thực vật. Hãy phân tích ảnh nhãn thuốc này và:

1. Đọc và trích xuất TẤT CẢ các hoạt chất (active ingredients) có trong sản phẩm
2. So sánh với danh sách hoạt chất BỊ CẤM sử dụng tại Việt Nam dưới đây
3. Xác định xem sản phẩm có chứa hoạt chất bị cấm hay không

DANH SÁCH HOẠT CHẤT BỊ CẤM TẠI VIỆT NAM:
${bannedIngredients.map((ing, idx) => `${idx + 1}. ${ing}`).join('\n')}

YÊU CẦU QUAN TRỌNG:
- Đọc kỹ nhãn thuốc, tìm phần "Thành phần", "Hoạt chất", "Active Ingredient", "Ingredients"
- So sánh CHÍNH XÁC tên hoạt chất (có thể viết bằng tiếng Việt hoặc tiếng Anh)
- Lưu ý: Một số hoạt chất có thể có tên gọi khác nhau hoặc tên thương mại khác
- Nếu không đọc được rõ ảnh hoặc không tìm thấy thông tin hoạt chất, hãy thông báo

TRẢ VỀ KẾT QUẢ DƯỚI DẠNG JSON (KHÔNG THÊM MARKDOWN, KHÔNG THÊM TEXT GIẢI THÍCH):
{
  "product_name": "Tên sản phẩm (nếu có)",
  "detected_ingredients": ["Danh sách hoạt chất tìm thấy trong ảnh"],
  "banned_ingredients": ["Danh sách hoạt chất BỊ CẤM tìm thấy"],
  "is_banned": true/false,
  "warning_level": "NGUY_HIỂM" hoặc "AN_TOÀN" hoặc "KHÔNG_XÁC_ĐỊNH",
  "warning_message": "Thông báo cảnh báo chi tiết bằng tiếng Việt",
  "recommendations": "Khuyến nghị cho người dùng"
}
      `.trim()

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: prompt,
                  },
                  {
                    inline_data: {
                      mime_type: "image/jpeg",
                      data: imageBase64,
                    },
                  },
                ],
              },
            ],
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error:
            errorData.error?.message ||
            `Lỗi khi gọi API AI. Status: ${response.status}`,
        }
      }

      const data = await response.json()

      if (
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0]
      ) {
        const answer = data.candidates[0].content.parts[0].text || ""
        return {
          success: true,
          answer: answer,
        }
      }

      return {
        success: false,
        error: "Không tìm thấy câu trả lời trong phản hồi từ AI.",
      }
    } catch (error) {
      console.error("Error calling Gemini Vision API:", error)
      return {
        success: false,
        error:
          (error as Error).message ||
          "Lỗi khi gọi API AI để phân tích ảnh.",
      }
    }
  }
}

// Export instance singleton
export const frontendAiService = new FrontendAiService()
