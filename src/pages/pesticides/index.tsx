import React, { useState } from "react"
import {
  Button,
  Card,
  Space,
  Typography,
  Spin,
  Alert,
  Row,
  Col,
  List,
  Tag,
} from "antd"
import ComboBox from "@/components/common/combo-box"
import { useAiService } from "@/hooks/use-ai-service"
import { useProductsQuery } from "@/queries/product"
import { Product } from "@/models/product.model"

const { Title, Text } = Typography

/**
 * Trang chính cho chức năng pesticides
 */
const PesticidesPage: React.FC = () => {
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([])
  const [mixResult, setMixResult] = useState("")
  const [sortResult, setSortResult] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { mixPesticides, sortPesticides } = useAiService()
  const { data: productsData, isLoading: isLoadingProducts } = useProductsQuery(
    { limit: 100 }
  )

  // Lấy thông tin chi tiết của các sản phẩm đã chọn
  const selectedProducts = (productsData?.data?.items || []).filter(
    (product: Product) => selectedProductIds.includes(product.id)
  )

  /**
   * Xử lý thay đổi selection của sản phẩm
   */
  const handleProductSelection = (value: number[]) => {
    setSelectedProductIds(value)
  }

  /**
   * Tạo prompt cho phân tích phối trộn
   */
  const createMixPrompt = (products: Product[]): string => {
    const productInfo = products
      .map(
        (product: Product) =>
          `- ${product.name}: ${
            product.ingredient?.join(", ") || "Không có thông tin thành phần"
          }`
      )
      .join("\n")

    return `Phân tích khả năng phối trộn các loại thuốc sau, chỉ trả lời có/không và lưu ý quan trọng:
    
${productInfo}`
  }

  /**
   * Tạo prompt cho phân tích sắp xếp
   */
  const createSortPrompt = (products: Product[]): string => {
    const productInfo = products
      .map(
        (product: Product) =>
          `- ${product.name}: ${
            product.ingredient?.join(", ") || "Không có thông tin thành phần"
          }`
      )
      .join("\n")

    return `Sắp xếp thứ tự sử dụng các loại thuốc sau để đạt hiệu quả tốt nhất, chỉ trả về tên thuốc theo thứ tự:
    
${productInfo}`
  }

  /**
   * Xử lý phân tích cả hai chức năng - gọi tuần tự thay vì song song
   */
  const handleAnalyze = async () => {
    if (selectedProductIds.length === 0) {
      setError("Vui lòng chọn ít nhất một sản phẩm để phân tích")
      return
    }

    if (selectedProducts.length === 0) {
      setError("Không tìm thấy thông tin sản phẩm đã chọn")
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setMixResult("")
    setSortResult("")

    try {
      // Tạo prompts
      const mixPrompt = createMixPrompt(selectedProducts)
      const sortPrompt = createSortPrompt(selectedProducts)

      // Gọi lần lượt từng API để tránh lỗi
      const mixResponse = await mixPesticides(mixPrompt)
      if (mixResponse.success && mixResponse.answer) {
        setMixResult(mixResponse.answer)
      } else {
        setError((prev) =>
          prev
            ? `${prev}; Lỗi phân tích phối trộn: ${mixResponse.error}`
            : `Lỗi phân tích phối trộn: ${mixResponse.error}`
        )
      }

      // Gọi API sắp xếp sau khi API phối trộn hoàn thành
      const sortResponse = await sortPesticides(sortPrompt)
      if (sortResponse.success && sortResponse.answer) {
        setSortResult(sortResponse.answer)
      } else {
        setError((prev) =>
          prev
            ? `${prev}; Lỗi phân tích sắp xếp: ${sortResponse.error}`
            : `Lỗi phân tích sắp xếp: ${sortResponse.error}`
        )
      }
    } catch (err) {
      const errorMessage =
        (err as Error).message || "Có lỗi không xác định xảy ra."
      setError(errorMessage)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className='p-6'>
      <Title level={2}>Tư vấn Phối trộn & Sắp xếp Thuốc Bảo vệ Thực vật</Title>

      <Card title='Chọn sản phẩm để phân tích' className='mb-6'>
        <Space direction='vertical' className='w-full'>
          <ComboBox
            mode='multiple'
            placeholder='Chọn các sản phẩm thuốc bảo vệ thực vật'
            value={selectedProductIds}
            onChange={handleProductSelection}
            options={(productsData?.data?.items || []).map(
              (product: Product) => ({
                value: product.id,
                label: product.name,
              })
            )}
            loading={isLoadingProducts}
            style={{ width: "100%" }}
          />

          {selectedProducts.length > 0 && (
            <Card size='small' title='Sản phẩm đã chọn'>
              <List
                dataSource={selectedProducts}
                renderItem={(product: Product) => (
                  <List.Item>
                    <div>
                      <Text strong>{product.name}</Text>
                      <div>
                        {product.ingredient?.map(
                          (ing: string, index: number) => (
                            <Tag key={index} color='blue'>
                              {ing}
                            </Tag>
                          )
                        )}
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          )}

          <Button
            type='primary'
            onClick={handleAnalyze}
            disabled={isAnalyzing || selectedProductIds.length === 0}
            loading={isAnalyzing}
          >
            Phân tích Phối trộn & Sắp xếp
          </Button>
        </Space>
      </Card>

      {isAnalyzing && (
        <div className='text-center mb-6'>
          <Spin size='large' />
          <Text className='block mt-2'>Đang phân tích yêu cầu...</Text>
        </div>
      )}

      {error && (
        <Alert
          message='Lỗi'
          description={error}
          type='error'
          showIcon
          className='mb-6'
        />
      )}

      <Row gutter={16} className='results-row'>
        <Col span={24} className='results-col'>
          <Card
            title='Kết quả Phân tích Phối trộn'
            loading={isAnalyzing && !mixResult}
            className='scrollable-result-card'
          >
            {mixResult ? (
              <div
                className='scrollable-result-content'
                dangerouslySetInnerHTML={{
                  __html: mixResult
                    .replace(/\n\n/g, "</p><p>")
                    .replace(/\n/g, "<br>")
                    .replace(/^(<br>)+|(<br>)+$/g, "")
                    .replace(/^|$/, "<p>")
                    .replace(/<p><\/p>/g, ""),
                }}
              />
            ) : (
              <Text type='secondary'>Chưa có kết quả phân tích phối trộn</Text>
            )}
          </Card>
        </Col>

        <Col span={24} className='results-col'>
          <Card
            title='Kết quả Phân tích Sắp xếp'
            loading={isAnalyzing && !sortResult}
            className='scrollable-result-card'
          >
            {sortResult ? (
              <div
                className='scrollable-result-content'
                dangerouslySetInnerHTML={{
                  __html: sortResult
                    .replace(/\n\n/g, "</p><p>")
                    .replace(/\n/g, "<br>")
                    .replace(/^(<br>)+|(<br>)+$/g, "")
                    .replace(/^|$/, "<p>")
                    .replace(/<p><\/p>/g, ""),
                }}
              />
            ) : (
              <Text type='secondary'>Chưa có kết quả phân tích sắp xếp</Text>
            )}
          </Card>
        </Col>
      </Row>

      <style>{`
        .scrollable-result-card {
          height: 100%;
        }
        
        .scrollable-result-content {
          max-height: 400px;
          overflow-y: auto;
          padding: 16px;
          border: 1px solid #f0f0f0;
          border-radius: 4px;
        }
        
        .results-row {
          display: flex;
          flex-direction: column;
        }
        
        .results-col {
          margin-bottom: 16px;
        }
        
        .results-col:last-child {
          margin-bottom: 0;
        }
        
        @media (min-width: 768px) {
          .results-row {
            flex-direction: row;
          }
          
          .results-col {
            flex: 1;
            margin-bottom: 0;
          }
          
          .results-col:first-child {
            margin-right: 8px;
          }
          
          .results-col:last-child {
            margin-left: 8px;
          }
        }
        
        @media (max-width: 767px) {
          .scrollable-result-content {
            max-height: 300px;
          }
        }
      `}</style>
    </div>
  )
}

export default PesticidesPage
