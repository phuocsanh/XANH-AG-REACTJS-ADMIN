import React, { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button, message, Card, Space } from "antd"
import { SaveOutlined } from "@ant-design/icons"
import { useForm } from "react-hook-form"
import { FormField, FormComboBox, FormImageUpload } from "@/components/Form"
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { UploadFile, UploadFileStatus } from "antd/lib/upload/interface"

import { productService } from "../../../services/product.service"
import { productTypeService } from "../../../services/product-type.service"
import {
  CreateProductRequest,
  UpdateProductRequest,
  ProductApiResponse,
  mapApiResponseToProduct, // Import mapApiResponseToProduct
} from "../../../models/product.model"

interface ProductApiResponseWithItem {
  code: number
  message: string
  data: ProductApiResponse | { item: ProductApiResponse }
}

function isProductApiResponseWithItemWrapper(
  data: ProductApiResponse | { item: ProductApiResponse }
): data is { item: ProductApiResponse } {
  return (data as { item: ProductApiResponse }).item !== undefined
}
import { ProductType } from "../../../models/product-type.model"

// Mở rộng CreateProductRequest để chấp nhận UploadFile[] cho thumb và pictures
interface ProductFormValues
  extends Omit<CreateProductRequest, "thumb" | "pictures"> {
  thumb?: UploadFile[]
  pictures?: UploadFile[]
}

interface ProductFormProps {
  isEdit?: boolean
  productId?: string
}

// TiptapEditor component
const TiptapEditor: React.FC<{ content: string; onChange: (content: string) => void }> = ({ content, onChange }) => {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  if (!editor) {
    return null
  }

  return (
    <div style={{ border: '1px solid #d9d9d9', borderRadius: '6px' }}>
      {/* Toolbar */}
      <div style={{ 
        borderBottom: '1px solid #d9d9d9', 
        padding: '8px 12px', 
        display: 'flex', 
        gap: '8px',
        backgroundColor: '#fafafa'
      }}>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          style={{
            padding: '4px 8px',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            backgroundColor: editor.isActive('bold') ? '#1890ff' : '#fff',
            color: editor.isActive('bold') ? '#fff' : '#000',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          style={{
            padding: '4px 8px',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            backgroundColor: editor.isActive('italic') ? '#1890ff' : '#fff',
            color: editor.isActive('italic') ? '#fff' : '#000',
            cursor: 'pointer',
            fontSize: '12px',
            fontStyle: 'italic'
          }}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          style={{
            padding: '4px 8px',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            backgroundColor: editor.isActive('underline') ? '#1890ff' : '#fff',
            color: editor.isActive('underline') ? '#fff' : '#000',
            cursor: 'pointer',
            fontSize: '12px',
            textDecoration: 'underline'
          }}
        >
          U
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          style={{
            padding: '4px 8px',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            backgroundColor: editor.isActive('strike') ? '#1890ff' : '#fff',
            color: editor.isActive('strike') ? '#fff' : '#000',
            cursor: 'pointer',
            fontSize: '12px',
            textDecoration: 'line-through'
          }}
        >
          S
        </button>
      </div>
      {/* Editor Content */}
      <div style={{ minHeight: '200px', padding: '12px' }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

const ProductForm: React.FC<ProductFormProps> = (props) => {
  const { isEdit = false, productId } = props
  const { control, handleSubmit, watch, reset } = useForm<ProductFormValues>({
    defaultValues: {
      isPublished: true,
      discount: "0",
      quantity: 1,
    }
  })
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(false)
  const [productTypes, setProductTypes] = useState<ProductType[]>([])
  const [description, setDescription] = useState("")

  
  // Watch form values
  const watchedType = watch("type")

  // Xác định ID sản phẩm để sử dụng: ưu tiên productId từ props, sau đó mới đến id từ params
  const currentProductId = productId || id

  const renderProductAttributes = () => {
    const selectedType = productTypes.find((type) => type.id === Number(watchedType))

    if (!selectedType) return null

    switch (selectedType.name) {
      case "Nấm":
        return (
          <div className='grid grid-cols-2 gap-4'>
            <FormField
              name="attributes.origin"
              control={control}
              label="Xuất xứ"
              placeholder="Nhập xuất xứ"
            />
            <FormField
              name="attributes.weight"
              control={control}
              label="Trọng lượng (g)"
              type="number"
              placeholder="Ví dụ: 500"
            />
            <FormComboBox
              name="attributes.freshness"
              control={control}
              label="Độ tươi"
              placeholder="Chọn độ tươi"
              options={[
                { label: "Tươi", value: "Tươi" },
                { label: "Khô", value: "Khô" }
              ]}
            />
            <FormComboBox
              name="attributes.organic"
              control={control}
              label="Hữu cơ"
              placeholder="Chọn trạng thái"
              options={[
                { label: "Có", value: "true" },
                { label: "Không", value: "false" }
              ]}
            />
          </div>
        )
      case "Phân bón":
        return (
          <div className='grid grid-cols-2 gap-4'>
            <FormField
              name="attributes.main_ingredient"
              control={control}
              label="Thành phần chính"
              placeholder="Nhập thành phần"
            />
            <FormField
              name="attributes.weight"
              control={control}
              label="Khối lượng (kg)"
              type="number"
              placeholder="Ví dụ: 5"
            />
            <FormComboBox
              name="attributes.fertilizer_type"
              control={control}
              label="Loại phân"
              placeholder="Chọn loại phân"
              options={[
                { label: "Hữu cơ", value: "Hữu cơ" },
                { label: "Vô cơ", value: "Vô cơ" }
              ]}
            />
          </div>
        )
      case "Thuốc bảo vệ thực vật":
        return (
          <div className='grid grid-cols-2 gap-4'>
            <FormField
              name="attributes.active_ingredient"
              control={control}
              label="Hoạt chất"
              placeholder="Nhập hoạt chất"
            />
            <FormField
              name="attributes.volume"
              control={control}
              label="Thể tích (ml)"
              type="number"
              placeholder="Ví dụ: 100"
            />
            <FormComboBox
              name="attributes.toxicity"
              control={control}
              label="Độ độc"
              placeholder="Chọn độ độc"
              options={[
                { label: "Nhóm I", value: "Nhóm I" },
                { label: "Nhóm II", value: "Nhóm II" },
                { label: "Nhóm III", value: "Nhóm III" }
              ]}
            />
          </div>
        )
      case "Cây trồng":
        return (
          <div className='grid grid-cols-2 gap-4'>
            <FormField
              name="attributes.age"
              control={control}
              label="Tuổi thọ (tháng)"
              type="number"
              placeholder="Ví dụ: 12"
            />
            <FormField
              name="attributes.height"
              control={control}
              label="Chiều cao (cm)"
              type="number"
              placeholder="Ví dụ: 30"
            />
            <FormComboBox
              name="attributes.care_level"
              control={control}
              label="Mức độ chăm sóc"
              placeholder="Chọn mức độ chăm sóc"
              options={[
                { label: "Dễ", value: "Dễ" },
                { label: "Trung bình", value: "Trung bình" },
                { label: "Khó", value: "Khó" }
              ]}
            />
            <FormComboBox
              name="attributes.pot_included"
              control={control}
              label="Kèm chậu"
              placeholder="Chọn trạng thái"
              options={[
                { label: "Có", value: "true" },
                { label: "Không", value: "false" }
              ]}
            />
          </div>
        )
      default:
        return null
    }
  }

  useEffect(() => {
    const fetchProductTypes = async () => {
      try {
        const response = await productTypeService.getProductTypes()
        setProductTypes(response.data.items || [])
      } catch (error) {
        console.error("Error fetching product types:", error)
        message.error("Không thể tải danh sách loại sản phẩm")
      }
    }

    const fetchProduct = async () => {
      if (!currentProductId) return
      try {
        setLoading(true)
        const response = (await productService.getProductById(
          parseInt(currentProductId)
        )) as unknown as ProductApiResponseWithItem

        // Lấy dữ liệu từ response.data.item hoặc response.data nếu không có .item
        let productData: ProductApiResponse
        if (isProductApiResponseWithItemWrapper(response.data)) {
          productData = response.data.item
        } else {
          productData = response.data
        }
        console.log("Product data from API:", productData)

        if (!productData) {
          throw new Error("Không tìm thấy thông tin sản phẩm")
        }

        // Sử dụng hàm mapApiResponseToProduct để chuyển đổi dữ liệu
        const mappedProduct = mapApiResponseToProduct(productData)

        // Hàm tiện ích để chuẩn hóa một URL thành đối tượng file cho Upload component
        const normalizeFile = (url: string, index: number): UploadFile => ({
          uid: `${index}-${url}`,
          name: url.substring(url.lastIndexOf("/") + 1),
          status: "done" as UploadFileStatus,
          url: url,
        })

        // Hàm tiện ích để chuẩn hóa một mảng các URL thành mảng các đối tượng file
        const normalizeFileList = (
          urls: string[] | undefined
        ): UploadFile[] => {
          if (!urls) return []
          return urls.map((url, index) => normalizeFile(url, index))
        }

        // Tạo đối tượng form values từ dữ liệu đã được chuyển đổi
        const formValues: Partial<ProductFormValues> = {
          name: mappedProduct.name,
          price: mappedProduct.price,
          type: mappedProduct.type,
          quantity: mappedProduct.quantity,
          discount: mappedProduct.discount,
          isPublished: mappedProduct.isPublished,
          attributes: mappedProduct.attributes,
          subTypes: mappedProduct.subTypes,
          thumb: mappedProduct.thumb
            ? [normalizeFile(mappedProduct.thumb, 0)]
            : [],
          pictures: normalizeFileList(mappedProduct.pictures),
          videos: mappedProduct.videos,
          description: mappedProduct.description,
        }

        console.log("Mapped form values:", formValues)

        // Đặt giá trị cho form
        reset(formValues)
        // Product type will be watched through watchedType

        // Đặt giá trị cho mô tả
        setDescription(productData.productDescription || "")

        console.log("Form values after set:", formValues)
      } catch (error) {
        console.error("Error fetching product:", error)
        message.error("Không thể tải thông tin sản phẩm")
      } finally {
        setLoading(false)
      }
    }

    fetchProductTypes()
    if (isEdit) {
      fetchProduct()
    }
  }, [currentProductId, isEdit, reset])

  const onSubmit = async (values: ProductFormValues) => {
    try {
      setLoading(true)

      // Chuyển đổi UploadFile[] về string và string[] cho API
      const convertedValues = {
        ...values,
        description: description,
        thumb:
          values.thumb && values.thumb.length > 0
            ? values.thumb[0].url || ""
            : "",
        pictures: values.pictures
          ? values.pictures.map((file) => file.url || "").filter((url) => url)
          : [],
      }

      if (isEdit && currentProductId) {
        await productService.updateProduct(
          parseInt(currentProductId),
          convertedValues as UpdateProductRequest
        )
        message.success("Cập nhật sản phẩm thành công")
      } else {
        await productService.createProduct(
          convertedValues as CreateProductRequest
        )
        message.success("Thêm sản phẩm thành công")
      }

      navigate("/products")
    } catch (error) {
      console.error("Error saving product:", error)
      message.error("Có lỗi xảy ra khi lưu sản phẩm")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='p-4'>
      <Space direction='vertical' size='middle' style={{ width: "100%" }}>
        <Card loading={loading}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                name="name"
                control={control}
                label="Tên sản phẩm"
                placeholder="Nhập tên sản phẩm"
                required
                rules={{ required: "Vui lòng nhập tên sản phẩm" }}
              />

              <FormComboBox
                name="type"
                control={control}
                label="Loại sản phẩm"
                placeholder="Chọn loại sản phẩm"
                required
                rules={{ required: "Vui lòng chọn loại sản phẩm" }}
                options={productTypes.map((type) => ({
                  label: type.name,
                  value: type.id
                }))}
              />

              <FormField
                name="price"
                control={control}
                label="Giá bán (VNĐ)"
                type="number"
                placeholder="Nhập giá bán"
                required
                rules={{ required: "Vui lòng nhập giá bán" }}
                suffix="VNĐ"
              />

              <FormField
                name="quantity"
                control={control}
                label="Số lượng"
                type="number"
                placeholder="Nhập số lượng"
                required
                rules={{ required: "Vui lòng nhập số lượng" }}
              />

              <FormField
                name="discount"
                control={control}
                label="Giảm giá (%)"
                type="number"
                placeholder="Nhập giảm giá"
                suffix="%"
              />

              <FormComboBox
                name="isPublished"
                control={control}
                label="Trạng thái"
                placeholder="Chọn trạng thái"
                options={[
                  { label: "Đang bán", value: "true" },
                  { label: "Nháp", value: "false" }
                ]}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả sản phẩm <span className="text-red-500">*</span>
              </label>
              <TiptapEditor
                content={description}
                onChange={(content) => {
                  setDescription(content)
                }}
              />
            </div>

            <FormImageUpload
              name="thumb"
              control={control}
              label="Hình ảnh sản phẩm"
              maxCount={1}
              folder="products"
            />

            <FormImageUpload
              name="pictures"
              control={control}
              label="Ảnh chi tiết sản phẩm"
              maxCount={5}
              multiple
              folder="products"
            />

            {Number(watchedType) && (
               <div className='mb-4'>
                 <h3 className='text-lg font-medium mb-2'>
                   Thuộc tính sản phẩm
                 </h3>
                 {renderProductAttributes()}
               </div>
             )}

            <div style={{ textAlign: "right", marginTop: "24px" }}>
              <Button
                style={{ marginRight: "8px" }}
                onClick={() => navigate("/products")}
              >
                Hủy
              </Button>
              <Button
                type='primary'
                htmlType='submit'
                loading={loading}
                icon={<SaveOutlined />}
              >
                {isEdit ? "Cập nhật" : "Thêm mới"}
              </Button>
            </div>
          </form>
        </Card>
      </Space>
    </div>
  )
}

export default ProductForm
