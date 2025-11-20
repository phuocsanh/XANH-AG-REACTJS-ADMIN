import React, { useState } from "react"
import { Button, Input, Card, Space, Typography, Spin, Alert } from "antd"
import { useAiService } from "@/hooks/use-ai-service"

const { Title, Text } = Typography

/**
 * Trang demo để test AI service
 */
const AiDemoPage: React.FC = () => {
  const [question, setQuestion] = useState("")
  const [result, setResult] = useState("")
  const { isLoading, error, mixPesticides, sortPesticides } = useAiService()

  /**
   * Xử lý gọi API mix pesticides
   */
  const handleMixPesticides = async () => {
    if (!question.trim()) return

    const response = await mixPesticides(question)
    if (response.success && response.answer) {
      setResult(response.answer)
    }
  }

  /**
   * Xử lý gọi API sort pesticides
   */
  const handleSortPesticides = async () => {
    if (!question.trim()) return

    const response = await sortPesticides(question)
    if (response.success && response.answer) {
      setResult(response.answer)
    }
  }

  return (
    <div className='p-6'>
      <Title level={2}>Demo AI Service</Title>

      <Card title='Test AI Functions'>
        <Space direction='vertical' className='w-full'>
          <Input
            placeholder='Nhập câu hỏi'
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />

          <Space>
            <Button
              type='primary'
              onClick={handleMixPesticides}
              disabled={isLoading}
            >
              Mix Pesticides (Phối trộn - Trả lời ngắn gọn)
            </Button>
            <Button
              type='primary'
              onClick={handleSortPesticides}
              disabled={isLoading}
            >
              Sort Pesticides (Sắp xếp - Chỉ trả về tên thuốc)
            </Button>
          </Space>

          {isLoading && (
            <div className='text-center'>
              <Spin size='large' />
              <Text className='block mt-2'>Đang xử lý...</Text>
            </div>
          )}

          {error && (
            <Alert message='Lỗi' description={error} type='error' showIcon />
          )}

          {result && (
            <Card title='Kết quả' size='small'>
              <div
                dangerouslySetInnerHTML={{
                  __html: result.replace(/\n/g, "<br>"),
                }}
              />
            </Card>
          )}
        </Space>
      </Card>
    </div>
  )
}

export default AiDemoPage
