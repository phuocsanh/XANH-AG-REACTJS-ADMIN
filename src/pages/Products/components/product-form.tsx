import React, { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button, message, Card, Space, Form } from "antd"
import { SaveOutlined } from "@ant-design/icons"
import { useForm } from "react-hook-form"
import { FormField, FormComboBox, FormImageUpload } from "@/components/form"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import { UploadFile, UploadFileStatus } from "antd/lib/upload/interface"

import {
  useProductQuery,
  useUpdateProductMutation,
  useCreateProductMutation,
} from "../../../queries/product"
import {
  Product,
  ProductFormValues,
  ConvertedProductValues,
  ProductFormProps,
  ProductApiResponseWithItem,
} from "../../../models/product.model"
import { useProductTypesQuery as useProductTypes } from "@/queries/product-type"
import { useProductSubtypesQuery } from "@/queries/product-subtype"
import { useUnitsQuery } from "@/queries/unit"
import { BASE_STATUS } from "@/constant/base-status"

function isProductApiResponseWithItemWrapper(
  data: Product | { item: Product }
): data is { item: Product } {
  return (data as { item: Product }).item !== undefined
}

// TiptapEditor component
const TiptapEditor: React.FC<{
  content: string
  onChange: (content: string) => void
}> = ({ content, onChange }) => {
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
    <div style={{ border: "1px solid #d9d9d9", borderRadius: "6px" }}>
      {/* Toolbar */}
      <div
        style={{
          borderBottom: "1px solid #d9d9d9",
          padding: "8px 12px",
          display: "flex",
          gap: "8px",
          backgroundColor: "#fafafa",
        }}
      >
        <button
          type='button'
          onClick={() => editor.chain().focus().toggleBold().run()}
          style={{
            padding: "4px 8px",
            border: "1px solid #d9d9d9",
            borderRadius: "4px",
            backgroundColor: editor.isActive("bold") ? "#1890ff" : "#fff",
            color: editor.isActive("bold") ? "#fff" : "#000",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "bold",
          }}
        >
          B
        </button>
        <button
          type='button'
          onClick={() => editor.chain().focus().toggleItalic().run()}
          style={{
            padding: "4px 8px",
            border: "1px solid #d9d9d9",
            borderRadius: "4px",
            backgroundColor: editor.isActive("italic") ? "#1890ff" : "#fff",
            color: editor.isActive("italic") ? "#fff" : "#000",
            cursor: "pointer",
            fontSize: "12px",
            fontStyle: "italic",
          }}
        >
          I
        </button>
        <button
          type='button'
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          style={{
            padding: "4px 8px",
            border: "1px solid #d9d9d9",
            borderRadius: "4px",
            backgroundColor: editor.isActive("underline") ? "#1890ff" : "#fff",
            color: editor.isActive("underline") ? "#fff" : "#000",
            cursor: "pointer",
            fontSize: "12px",
            textDecoration: "underline",
          }}
        >
          U
        </button>
        <button
          type='button'
          onClick={() => editor.chain().focus().toggleStrike().run()}
          style={{
            padding: "4px 8px",
            border: "1px solid #d9d9d9",
            borderRadius: "4px",
            backgroundColor: editor.isActive("strike") ? "#1890ff" : "#fff",
            color: editor.isActive("strike") ? "#fff" : "#000",
            cursor: "pointer",
            fontSize: "12px",
            textDecoration: "line-through",
          }}
        >
          S
        </button>
      </div>
      {/* Editor Content */}
      <div style={{ minHeight: "200px", padding: "12px" }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

const ProductForm: React.FC<ProductFormProps> = (props) => {
  const { isEdit = false, productId } = props
  const { control, handleSubmit, watch, reset } = useForm<ProductFormValues>({
    defaultValues: {
      status: "active",
      discount: "0",
      quantity: 0,
    },
  })
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(false)

  const [description, setDescription] = useState("")

  // Watch form values
  const watchedType = watch("type")

  // Xác định ID sản phẩm để sử dụng: ưu tiên productId từ props, sau đó mới đến id từ params
  const currentProductId = productId || id

  // Sử dụng query hooks thay vì service
  const { data: productData, isLoading: productLoading } = useProductQuery(
    currentProductId ? parseInt(currentProductId) : 0
  )
  const updateProductMutation = useUpdateProductMutation()
  const createProductMutation = useCreateProductMutation()

  const { data: productSubtypes } = useProductSubtypesQuery()
  const { data: productTypes } = useProductTypes()
  const { data: units } = useUnitsQuery()

  useEffect(() => {
    const fetchProduct = async () => {
      if (!currentProductId || !isEdit) return
      try {
        setInitialLoading(true)
        // productData sẽ được lấy tự động bởi useProductQuery
        if (productData) {
          const productApiResponse =
            productData as unknown as ProductApiResponseWithItem

          // Lấy dữ liệu từ response.data.item hoặc response.data nếu không có .item
          let productDataItem: Product
          if (isProductApiResponseWithItemWrapper(productApiResponse.data)) {
            productDataItem = productApiResponse.data.item
          } else {
            productDataItem = productApiResponse.data
          }
          console.log("Product data from API:", productDataItem)

          if (!productDataItem) {
            throw new Error("Không tìm thấy thông tin sản phẩm")
          }

          // Sử dụng trực tiếp productData vì Product interface đã giống ProductApiResponse
          const mappedProduct = productDataItem

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

          // Tạo đối tượng form values từ dữ liệu API response
          const formValues: Partial<ProductFormValues> = {
            name: mappedProduct.productName,
            price: mappedProduct.productPrice,
            type: mappedProduct.productType,
            quantity: mappedProduct.productQuantity,
            discount: mappedProduct.discount,
            status: mappedProduct.status,
            attributes: mappedProduct.productAttributes,
            subTypes: mappedProduct.subProductType, // Loại phụ sản phẩm
            thumb: mappedProduct.productThumb
              ? [normalizeFile(mappedProduct.productThumb, 0)]
              : [],
            pictures: normalizeFileList(mappedProduct.productPictures),
            videos: mappedProduct.productVideos,
            description: mappedProduct.productDescription,
            unit:
              ((mappedProduct.productAttributes as Record<string, unknown>)
                ?.unit as string) || "", // Đơn vị tính
          }

          console.log("Mapped form values:", formValues)

          // Đặt giá trị cho form
          reset(formValues)
          // Product type will be watched through watchedType

          // Đặt giá trị cho mô tả
          setDescription(productDataItem.productDescription || "")

          console.log("Form values after set:", formValues)
        }
      } catch (error) {
        console.error("Error fetching product:", error)
        message.error("Không thể tải thông tin sản phẩm")
      } finally {
        setInitialLoading(false)
      }
    }

    if (isEdit) {
      fetchProduct()
    }
  }, [currentProductId, isEdit, reset, productData])

  // Render các thuộc tính sản phẩm dựa trên loại sản phẩm được chọn
  const renderProductAttributes = () => {
    // Kiểm tra nếu loại sản phẩm được chọn có ID là 1, 2, 3, hoặc 4
    if (watchedType && [1, 2, 3, 4].includes(Number(watchedType))) {
      return (
        <div className='mb-4'>
          <h3 className='text-lg font-medium mb-2'>Thuộc tính sản phẩm</h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='w-full'>
              <FormField
                name='attributes.Hoạt chất'
                control={control}
                label='Hoạt chất'
                placeholder='Nhập các hoạt chất, ngăn cách bằng dấu phẩy'
              />
            </div>
            <div className='w-full'>
              <FormField
                type='number'
                name='attributes.Liều phun bình ml/25 lít'
                control={control}
                label='Liều phun bình 25 lít'
                placeholder='Nhập liều phun bình 25 lít'
              />
            </div>
            <div className='w-full'>
              <FormField
                type='number'
                name='attributes.Liều phun ml/ha'
                control={control}
                label='Liều phun 1/ha'
                placeholder='Nhập liều phun 1/ha'
              />
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  const onSubmit = async (values: ProductFormValues) => {
    try {
      setLoading(true)

      // Chuyển đổi UploadFile[] về string và string[] cho API
      const convertedValues: ConvertedProductValues = {
        ...(values as unknown as ConvertedProductValues),
        description: description,
        thumb:
          values.thumb && values.thumb.length > 0
            ? values.thumb[0].url || ""
            : "",
        pictures: values.pictures
          ? values.pictures.map((file) => file.url || "").filter((url) => url)
          : [],
        // Thêm đơn vị tính vào attributes
        attributes: values.attributes
          ? {
              ...values.attributes,
              unit: values.unit || "",
            }
          : {
              unit: values.unit || "",
            },
        status: values.status,
      }

      // Đảm bảo các trường bắt buộc có giá trị
      if (!convertedValues.name) convertedValues.name = ""
      if (!convertedValues.price) convertedValues.price = ""
      if (!convertedValues.type) convertedValues.type = 0
      if (!convertedValues.quantity) convertedValues.quantity = 0 // Sửa lại giá trị mặc định thành 0

      if (isEdit && currentProductId) {
        // Thêm ID cho update request
        await updateProductMutation.mutateAsync({
          id: parseInt(currentProductId),
          productData: {
            ...convertedValues,
            id: parseInt(currentProductId),
          },
        })
        message.success("Cập nhật sản phẩm thành công")
      } else {
        await createProductMutation.mutateAsync(convertedValues)
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
        <Card loading={loading || productLoading || initialLoading}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='w-full'>
                <FormField
                  name='name'
                  control={control}
                  label='Tên sản phẩm'
                  placeholder='Nhập tên sản phẩm'
                  required
                  rules={{ required: "Vui lòng nhập tên sản phẩm" }}
                  className='w-full'
                />
              </div>

              <div className='w-full'>
                <FormComboBox
                  name='type'
                  control={control}
                  label='Loại sản phẩm'
                  placeholder='Chọn loại sản phẩm'
                  required
                  rules={{ required: "Vui lòng chọn loại sản phẩm" }}
                  options={productTypes?.items.map((type) => ({
                    label: type.typeName,
                    value: type.id,
                  }))}
                  className='w-full'
                />
              </div>

              <div className='w-full'>
                <FormField
                  name='price'
                  control={control}
                  label='Giá bán (VNĐ)'
                  type='number'
                  placeholder='Nhập giá bán'
                  required
                  rules={{ required: "Vui lòng nhập giá bán" }}
                  suffix='VNĐ'
                  className='w-full'
                />
              </div>

              <div className='w-full'>
                <FormComboBox
                  name='unit'
                  control={control}
                  label='Đơn vị tính'
                  placeholder='Chọn đơn vị tính'
                  options={units?.map((unit) => ({
                    label: `${unit.unitName} (${unit.unitCode})`,
                    value: unit.unitName,
                  }))}
                  className='w-full'
                  required
                  rules={{ required: "Vui lòng chọn đơn vị tính" }}
                />
              </div>

              <div className='w-full'>
                <FormField
                  name='quantity'
                  control={control}
                  label='Số lượng'
                  type='number'
                  placeholder='Nhập số lượng'
                  required
                  rules={{ required: "Vui lòng nhập số lượng" }}
                  className='w-full'
                />
              </div>

              <div className='w-full'>
                <FormComboBox
                  name='subTypes'
                  control={control}
                  label='Loại phụ sản phẩm'
                  placeholder='Chọn loại phụ sản phẩm'
                  mode='multiple'
                  options={productSubtypes?.map((subtype) => ({
                    label: subtype.name,
                    value: subtype.id,
                  }))}
                  className='w-full'
                />
              </div>

              <div className='w-full'>
                <FormField
                  name='discount'
                  control={control}
                  label='Giảm giá (%)'
                  type='number'
                  placeholder='Nhập giảm giá'
                  suffix='%'
                  className='w-full'
                />
              </div>

              <div className='w-full'>
                <FormComboBox
                  name='status'
                  control={control}
                  label='Trạng thái'
                  placeholder='Chọn trạng thái'
                  options={BASE_STATUS.map((status) => ({
                    label: status.label,
                    value: status.value,
                  }))}
                  className='w-full'
                />
              </div>
            </div>

            <Form.Item
              label='Mô tả sản phẩm'
              className='w-full'
              layout='vertical'
            >
              <div className='w-full'>
                <TiptapEditor
                  content={description}
                  onChange={(content) => {
                    setDescription(content)
                  }}
                />
              </div>
            </Form.Item>

            <div className='w-full'>
              <FormImageUpload
                name='thumb'
                control={control}
                label='Hình ảnh sản phẩm'
                maxCount={1}
                className='w-full'
              />
            </div>

            {renderProductAttributes()}

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
