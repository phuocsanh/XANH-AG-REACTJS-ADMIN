import React, { useMemo } from 'react'
import { Progress, Card, List, Tag, Typography } from 'antd'
import { CheckCircleFilled, WarningFilled, CloseCircleFilled, InfoCircleOutlined } from '@ant-design/icons'

const { Text } = Typography

interface SEOCheckerProps {
  title: string
  content: string
  thumbnailUrl?: string | any[]
  tags?: string[]
}

interface SEORequirement {
  id: string
  label: string
  status: 'error' | 'warning' | 'success' | 'info'
  message: string
}

/**
 * SEO Checker Component
 * Phân tích và đánh giá chất lượng SEO của bài viết dựa trên các tiêu chuẩn cơ bản
 */
const SEOChecker: React.FC<SEOCheckerProps> = ({ title, content, thumbnailUrl, tags }) => {
  const analysis = useMemo(() => {
    const requirements: SEORequirement[] = []
    let score = 0
    const totalRules = 7

    // 1. Phân tích Tiêu đề
    const titleLength = title.length
    if (titleLength === 0) {
      requirements.push({
        id: 'title-len',
        label: 'Độ dài tiêu đề',
        status: 'error',
        message: 'Tiêu đề chưa được nhập.'
      })
    } else if (titleLength < 40) {
      requirements.push({
        id: 'title-len',
        label: 'Độ dài tiêu đề',
        status: 'warning',
        message: `Tiêu đề quá ngắn (${titleLength} ký tự). Nên từ 40-70 ký tự.`
      })
      score += 0.5
    } else if (titleLength > 70) {
      requirements.push({
        id: 'title-len',
        label: 'Độ dài tiêu đề',
        status: 'warning',
        message: `Tiêu đề quá dài (${titleLength} ký tự). Nên từ 40-70 ký tự.`
      })
      score += 0.5
    } else {
      requirements.push({
        id: 'title-len',
        label: 'Độ dài tiêu đề',
        status: 'success',
        message: 'Độ dài tiêu đề tối ưu (40-70 ký tự).'
      })
      score += 1
    }

    // 2. Phân tích nội dung (Số từ)
    const cleanText = content.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim()
    const wordCount = cleanText ? (cleanText.length > 0 ? cleanText.split(/\s+/).length : 0) : 0
    if (wordCount < 300) {
      requirements.push({
        id: 'word-count',
        label: 'Độ dài bài viết',
        status: 'error',
        message: `Bài viết quá ngắn (${wordCount} từ). Cần tối thiểu 300 từ để không bị đánh giá là "nội dung mỏng".`
      })
    } else if (wordCount < 1000) {
      requirements.push({
        id: 'word-count',
        label: 'Độ dài bài viết',
        status: 'warning',
        message: `Nội dung đang có ${wordCount} từ. Để tối ưu SEO tốt nhất, hãy viết trên 1000 từ.`
      })
      score += 0.6
    } else {
      requirements.push({
        id: 'word-count',
        label: 'Độ dài bài viết',
        status: 'success',
        message: `Độ dài bài viết tuyệt vời (${wordCount} từ), rất tốt cho SEO.`
      })
      score += 1
    }

    // 3. Phân tích Heading (H2)
    const h2Matches = content.match(/<h2[^>]*>.*?<\/h2>/gi)
    const h2Count = h2Matches ? h2Matches.length : 0
    if (h2Count > 0) {
      requirements.push({
        id: 'headings',
        label: 'Cấu trúc bài viết (H2)',
        status: 'success',
        message: `Bài viết có ${h2Count} tiêu đề H2 giúp phân đoạn nội dung tốt.`
      })
      score += 1
    } else {
      requirements.push({
        id: 'headings',
        label: 'Cấu trúc bài viết (H2)',
        status: 'warning',
        message: 'Nên thêm ít nhất một tiêu đề H2 để bài viết dễ đọc và tối ưu SEO hơn.'
      })
    }

    // 4. Ảnh đại diện
    const hasThumbnail = Array.isArray(thumbnailUrl) ? thumbnailUrl.length > 0 : !!thumbnailUrl
    if (hasThumbnail) {
      requirements.push({
        id: 'thumbnail',
        label: 'Ảnh đại diện',
        status: 'success',
        message: 'Bài viết đã có ảnh đại diện (giúp hiển thị tốt trên mạng xã hội).'
      })
      score += 1
    } else {
      requirements.push({
        id: 'thumbnail',
        label: 'Ảnh đại diện',
        status: 'error',
        message: 'Cần có ảnh đại diện để hiển thị chuyên nghiệp hơn trên Google.'
      })
    }

    // 5. Ảnh trong nội dung
    const hasImagesInContent = /<img[^>]*>/.test(content)
    if (hasImagesInContent) {
      requirements.push({
        id: 'content-images',
        label: 'Hình ảnh trong nội dung',
        status: 'success',
        message: 'Bài viết có hình ảnh minh họa sinh động.'
      })
      score += 1
    } else {
      requirements.push({
        id: 'content-images',
        label: 'Hình ảnh trong nội dung',
        status: 'warning',
        message: 'Nên thêm ít nhất 1 hình ảnh minh họa trong nội dung bài viết.'
      })
    }

    // 6. Liên kết (Links)
    const hasLinks = /<a[^>]*>/.test(content)
    if (hasLinks) {
      requirements.push({
        id: 'links',
        label: 'Liên kết (Links)',
        status: 'success',
        message: 'Bài viết có liên kết giúp tăng tính kết nối.'
      })
      score += 1
    } else {
      requirements.push({
        id: 'links',
        label: 'Liên kết (Links)',
        status: 'info',
        message: 'Gợi ý: Thêm liên kết nội bộ đến các sản phẩm hoặc bài viết khác.'
      })
      score += 0.3
    }

    // 7. Thẻ (Tags)
    if (tags && tags.length > 0) {
      requirements.push({
        id: 'tags',
        label: 'Thẻ bài viết (Tags)',
        status: 'success',
        message: `Đã gắn ${tags.length} thẻ phân loại.`
      })
      score += 1
    } else {
      requirements.push({
        id: 'tags',
        label: 'Thẻ bài viết (Tags)',
        status: 'warning',
        message: 'Nên thêm thẻ tags để phân loại bài viết tốt hơn.'
      })
    }

    const finalScore = Math.min(100, Math.round((score / totalRules) * 100))
    return { requirements, score: finalScore }
  }, [title, content, thumbnailUrl, tags])

  const getIcon = (status: SEORequirement['status']) => {
    switch (status) {
      case 'success': return <CheckCircleFilled className="text-green-500" />
      case 'warning': return <WarningFilled className="text-yellow-500" />
      case 'error': return <CloseCircleFilled className="text-red-500" />
      default: return <InfoCircleOutlined className="text-blue-500" />
    }
  }

  const getProgressStatus = (score: number) => {
    if (score < 40) return 'exception'
    if (score < 70) return 'active'
    return 'success'
  }

  return (
    <Card 
      size="small" 
      title={<span className="font-bold flex items-center gap-2"><InfoCircleOutlined /> Đánh giá chuẩn SEO</span>}
      className="bg-gray-50 border-gray-200 rounded-xl overflow-hidden"
    >
      <div className="flex flex-col items-center mb-6">
        <Progress 
          type="dashboard" 
          percent={analysis.score} 
          status={getProgressStatus(analysis.score)}
          strokeColor={{
            '0%': '#ff4d4f',
            '50%': '#faad14',
            '100%': '#52c41a',
          }}
          format={percent => (
             <div className="flex flex-col">
                <span className="text-2xl font-bold">{percent}%</span>
                <span className="text-[10px] text-gray-400">SEO Score</span>
             </div>
          )}
        />
        <Tag color={analysis.score >= 80 ? 'green' : analysis.score >= 50 ? 'orange' : 'red'} className="mt-2 px-3 py-1 font-bold">
          {analysis.score >= 80 ? 'Tối ưu tốt' : analysis.score >= 50 ? 'Cần cải thiện' : 'Kém'}
        </Tag>
      </div>

      <List
        size="small"
        dataSource={analysis.requirements}
        renderItem={item => (
          <List.Item className="border-none py-1.5 px-0">
            <div className="flex gap-3 w-full">
              <div className="mt-1">{getIcon(item.status)}</div>
              <div>
                <div className="font-bold text-xs leading-none mb-1 text-gray-700">{item.label}</div>
                <div className="text-[11px] text-gray-400 leading-tight">{item.message}</div>
              </div>
            </div>
          </List.Item>
        )}
      />
      
      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
         <Text type="secondary" className="text-[10px] italic">
            * Lưu ý: Đây là đánh giá kỹ thuật cơ bản giúp bạn viết bài tốt hơn.
         </Text>
      </div>
    </Card>
  )
}

export default SEOChecker
