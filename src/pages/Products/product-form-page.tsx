import { useContext, useEffect } from "react"
import { MyContext } from "../../App"
import { Button, Card, Typography } from "antd"
import { ArrowLeftOutlined } from "@ant-design/icons"
import { useNavigate, useParams } from "react-router-dom"
import ProductForm from "./components/product-form"

const { Title } = Typography

/**
 * Component chung cho trang tạo và chỉnh sửa sản phẩm
 * Xử lý cả hai trường hợp dựa trên sự hiện diện của ID
 */
export const ProductFormPage = () => {
  const context = useContext(MyContext)
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  // Xác định xem đây là trang chỉnh sửa hay tạo mới dựa trên sự hiện diện của ID
  const isEdit = !!id
  const title = isEdit ? "Chỉnh sửa sản phẩm" : "Thêm Sản phẩm mới"

  useEffect(() => {
    window.scrollTo(0, 0)
    context.setIsHeaderFooterShow(false)
  }, [context])

  return (
    <div className='p-4'>
      <div className='flex items-center mb-6'>
        <Button
          type='text'
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          className='mr-4'
        />
        <Title level={3} className='mb-0'>
          {title}
        </Title>
      </div>

      <Card>
        <ProductForm isEdit={isEdit} productId={id} />
      </Card>
    </div>
  )
}

export default ProductFormPage
