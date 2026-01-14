import { useContext, useEffect } from "react"
import { MyContext } from "../../App"
import { useParams } from "react-router-dom"
import ProductForm from "./components/product-form"

/**
 * Component chung cho trang tạo và chỉnh sửa sản phẩm
 * Xử lý cả hai trường hợp dựa trên sự hiện diện của ID
 */
export const ProductFormPage = () => {
  const context = useContext(MyContext)
  const { id } = useParams<{ id: string }>()

  // Xác định xem đây là trang chỉnh sửa hay tạo mới dựa trên sự hiện diện của ID
  const isEdit = !!id

  useEffect(() => {
    window.scrollTo(0, 0)
    context.setIsHeaderFooterShow(false)
  }, [context])

  return (
    <div className='p-4'>
      <ProductForm isEdit={isEdit} productId={id} />
    </div>
  )
}

export default ProductFormPage
