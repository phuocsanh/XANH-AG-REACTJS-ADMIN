import { useContext, useEffect } from "react"
import { MyContext } from "../../App"
import { Button, Card, Typography } from "antd"
import { ArrowLeftOutlined } from "@ant-design/icons"
import { useNavigate, useParams } from "react-router-dom"
import ProductForm from "./components/ProductForm"

const { Title } = Typography

interface ProductFormPageProps {
  isEdit: boolean
  title: string
}

/**
 * Component chung cho trang tạo và chỉnh sửa sản phẩm
 * @param isEdit - Xác định đây là trang chỉnh sửa hay tạo mới
 * @param title - Tiêu đề của trang
 */
export const ProductFormPage = ({ isEdit, title }: ProductFormPageProps) => {
  const context = useContext(MyContext)
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  useEffect(() => {
    window.scrollTo(0, 0)
    context.setIsHeaderFooterShow(false)
  }, [context])

  return (
    <div className="p-4">
      <div className="flex items-center mb-6">
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)}
          className="mr-4"
        />
        <Title level={3} className="mb-0">{title}</Title>
      </div>
      
      <Card>
        <ProductForm isEdit={isEdit} productId={id} />
      </Card>
    </div>
  )
}

export default ProductFormPage