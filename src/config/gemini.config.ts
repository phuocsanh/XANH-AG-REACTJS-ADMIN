/**
 * Cấu hình Gemini AI Model
 * Lấy từ environment variable hoặc dùng giá trị mặc định
 */
export const GEMINI_CONFIG = {
  model: import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash',
  apiBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
} as const

/**
 * Tạo URL đầy đủ cho Gemini API
 */
export const getGeminiApiUrl = (apiKey: string): string => {
  return `${GEMINI_CONFIG.apiBaseUrl}/${GEMINI_CONFIG.model}:generateContent?key=${apiKey}`
}
