import { useContext, useEffect } from "react"
import { MyContext } from "../../../App"
import { Button, Card, Typography } from "antd"
import { ArrowLeftOutlined } from "@ant-design/icons"
import { useNavigate } from "react-router-dom"
import ProductForm from "../components/ProductForm"

const { Title } = Typography

export const ProductCreate = () => {
  const context = useContext(MyContext)
  const navigate = useNavigate()

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
        <Title level={3} className="mb-0">Thêm Sản phẩm mới</Title>
      </div>
      
      <Card>
        <ProductForm isEdit={false} />
      </Card>
    </div>
  )
}

export default ProductCreate
