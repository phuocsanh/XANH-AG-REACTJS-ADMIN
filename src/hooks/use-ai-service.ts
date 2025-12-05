import { useState, useCallback } from "react"
import { frontendAiService } from "@/services/ai.service"
import type { AiResponse } from "@/services/ai.service"

/**
 * Hook để sử dụng AI service trong các component
 */
export const useAiService = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Gọi API mix pesticides
   * @param question Câu hỏi của người dùng
   * @returns Promise với kết quả trả về
   */
  const mixPesticides = useCallback(
    async (question: string): Promise<AiResponse> => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await frontendAiService.mixPesticides(question)
        if (!response.success) {
          setError(response.error || "Có lỗi xảy ra khi xử lý yêu cầu.")
        }
        return response
      } catch (err) {
        const errorMessage =
          (err as Error).message || "Có lỗi không xác định xảy ra."
        setError(errorMessage)
        return {
          success: false,
          error: errorMessage,
        }
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  /**
   * Gọi API sort pesticides
   * @param question Câu hỏi của người dùng
   * @returns Promise với kết quả trả về
   */
  const sortPesticides = useCallback(
    async (question: string): Promise<AiResponse> => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await frontendAiService.sortPesticides(question)
        if (!response.success) {
          setError(response.error || "Có lỗi xảy ra khi xử lý yêu cầu.")
        }
        return response
      } catch (err) {
        const errorMessage =
          (err as Error).message || "Có lỗi không xác định xảy ra."
        setError(errorMessage)
        return {
          success: false,
          error: errorMessage,
        }
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  return {
    isLoading,
    error,
    mixPesticides,
    sortPesticides,
  }
}
