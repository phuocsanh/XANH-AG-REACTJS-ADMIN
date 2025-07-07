import { useContext, useEffect } from "react"
import { MyContext } from "../../../App"
import { Button, Card, Typography } from "antd"
import { ArrowLeftOutlined } from "@ant-design/icons"
import { useNavigate, useParams } from "react-router-dom"
import ProductForm from "../components/ProductForm"

const { Title } = Typography

export const ProductEdit = () => {
  const context = useContext(MyContext)
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  useEffect(() => {
    window.scrollTo(0, 0)
    context.setIsHeaderFooterShow(false)
  }, [])

  return (
    <div className="p-4">
      <div className="flex items-center mb-6">
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)}
          className="mr-4"
        />
        <Title level={3} className="mb-0">Chỉnh sửa sản phẩm</Title>
      </div>
      
      <Card>
        <ProductForm isEdit={true} productId={id} />
      </Card>
    </div>
  )
}

export default ProductEdit
