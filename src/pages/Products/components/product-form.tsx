import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button, message, Card, Space, Form } from "antd"
import { SaveOutlined } from "@ant-design/icons"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  FormField,
  FormFieldNumber,
  FormComboBox,
  FormImageUpload,
} from "@/components/form"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import { UploadFile, UploadFileStatus } from "antd/lib/upload/interface"

import {
  useProductQuery,
  useUpdateProductMutation,
  useCreateProductMutation,
} from "../../../queries/product"
import { Product, ProductFormProps } from "../../../models/product.model"
import {
  productFormSchema,
  ProductFormValues,
  ConvertedProductValues,
  defaultProductFormValues,
} from "./form-config"
import { useAllProductTypesQuery as useProductTypes } from "@/queries/product-type"
import { useProductSubtypesQuery } from "@/queries/product-subtype"
import { useUnitsQuery } from "@/queries/unit"
import { BASE_STATUS } from "@/constant/base-status"
import { ProductType } from "@/models/product-type.model"
// Thêm import cho symbol
import { useSymbolsQuery } from "@/queries/symbol"
import { Symbol } from "@/models/symbol.model"
import { Unit } from "@/models/unit.model"

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
    resolver: zodResolver(productFormSchema),
    defaultValues: defaultProductFormValues,
  })
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(false)

  const [description, setDescription] = useState("")

  // Watch form values
  const watchedType = watch("type")

  // Xác định ID sản phẩm để sử dụng từ props
  const currentProductId = productId ? parseInt(productId) : 0

  // Sử dụng query hooks thay vì service
  const { data: productData, isLoading: productLoading } =
    useProductQuery(currentProductId)
  const updateProductMutation = useUpdateProductMutation()
  const createProductMutation = useCreateProductMutation()

  const { data: productSubtypes } = useProductSubtypesQuery()
  const { data: productTypes } = useProductTypes()
  const { data: units } = useUnitsQuery()
  // Thêm query cho symbols
  const { data: symbols } = useSymbolsQuery()

  // Debug log
  console.log("Product types data:", productTypes)
  console.log("Product subtypes data:", productSubtypes)
  console.log("Units data:", units)

  // Debug log for options
  console.log(
    "Product types options:",
    productTypes?.items?.map((type: ProductType) => ({
      label: type.name,
      value: type.id,
    })) || []
  )

  useEffect(() => {
    if (isEdit && productData && !productLoading) {
      try {
        setInitialLoading(true)

        // Lấy dữ liệu từ response
        const productItem = productData as Product
        console.log("Product data from API:", productItem)

        if (!productItem) {
          throw new Error("Không tìm thấy thông tin sản phẩm")
        }

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

        // Reset form với dữ liệu sản phẩm
        reset({
          name: productItem.name?.trim() || "",
          price: productItem.price || "",
          type: productItem.type || undefined,
          quantity: productItem.quantity || 0,
          attributes: productItem.attributes || {},
          unit:
            units?.find((u: Unit) => u.id === productItem.unitId)?.name || "", // Đơn vị tính
          subTypes: productItem.subProductType || [], // Loại phụ sản phẩm
          discount: productItem.discount || "",
          status: productItem.status || "active",
          thumb: productItem.thumb ? [normalizeFile(productItem.thumb, 0)] : [], // Ảnh đại diện
          pictures: normalizeFileList(productItem.pictures), // Danh sách ảnh
          videos: productItem.videos || [], // Danh sách video
          description: productItem.description || "", // Mô tả
          // Thêm 2 trường mới
          symbolId: productItem.symbolId || undefined,
          ingredient: productItem.ingredient?.join(", ") || "",
        })

        // Product type will be watched through watchedType

        // Đặt giá trị cho mô tả
        setDescription(productItem.description || "")
      } catch (error) {
        console.error("Error fetching product:", error)
        message.error("Không thể tải thông tin sản phẩm")
      } finally {
        setInitialLoading(false)
      }
    }
  }, [isEdit, productData, productLoading, reset])

  // Render các thuộc tính sản phẩm dựa trên loại sản phẩm được chọn
  const renderProductAttributes = () => {
    // Kiểm tra nếu loại sản phẩm được chọn có ID là 1, 2, 3, hoặc 4
    if (watchedType && [1, 2, 3, 4].includes(Number(watchedType))) {
      return (
        <div className='mb-4'>
          <h3 className='text-lg font-medium mb-2'>Thuộc tính sản phẩm</h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='w-full'>
              <FormFieldNumber
                name='attributes.Liều phun bình ml/25 lít'
                control={control}
                label='Liều phun bình ml/25 lít'
                placeholder='Nhập liều phun bình ml/25 lít'
              />
            </div>
            <div className='w-full'>
              <FormFieldNumber
                name='attributes.Liều phun ml/ha'
                control={control}
                label='Liều phun ml/ha'
                placeholder='Nhập liều phun ml/ha'
              />
            </div>
            <div className='w-full'>
              <FormFieldNumber
                name='attributes.Lượng nước phun lít/ha'
                control={control}
                label='Lượng nước phun lít/ha'
                placeholder='Lượng nước phun lít/ha'
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
            ? typeof values.thumb[0] === "string"
              ? values.thumb[0]
              : values.thumb[0].url || ""
            : "",
        pictures: values.pictures
          ? values.pictures
              .map((file) => {
                if (typeof file === "string") {
                  return file
                } else {
                  return (file as UploadFile).url || ""
                }
              })
              .filter((url) => url)
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
        // Giữ nguyên giá trị price vì đã được xử lý trong FormField
        price: values.price,
        // Xử lý 2 trường mới
        symbolId: values.symbolId,
        // Xử lý ingredient: chuyển chuỗi ngăn cách bằng dấu , thành mảng
        ingredient: values.ingredient
          ? values.ingredient
              .split(",")
              .map((item: string) => item.trim())
              .filter((item: string) => item.length > 0)
          : [],
        // Đảm bảo các trường mảng luôn được khởi tạo đúng kiểu
        subTypes: values.subTypes || [],
      }

      // Đảm bảo các trường bắt buộc có giá trị
      if (!convertedValues.name) convertedValues.name = ""
      if (!convertedValues.price) convertedValues.price = ""
      if (!convertedValues.type) convertedValues.type = 0
      if (!convertedValues.quantity) convertedValues.quantity = 0

      // Tạo object với tên các trường theo yêu cầu của server
      // TODO: Cập nhật service API để tự động mapping tên các trường thay vì phải convert thủ công
      const serverData = {
        productName: convertedValues.name,
        productPrice: convertedValues.price,
        productType: convertedValues.type,
        productQuantity: convertedValues.quantity,
        productDescription: convertedValues.description,
        productThumb: convertedValues.thumb,
        productPictures: Array.isArray(convertedValues.pictures)
          ? convertedValues.pictures
          : [],
        productAttributes: convertedValues.attributes || {},
        productDiscountedPrice: convertedValues.discount || "0",
        averageCostPrice: "0",
        profitMarginPercent: "0",
        status: convertedValues.status,
        subProductType: Array.isArray(convertedValues.subTypes)
          ? convertedValues.subTypes
          : [],
        // Không bao gồm trường videos vì server không mong đợi trường này
        symbolId: convertedValues.symbolId,
        ingredient: Array.isArray(convertedValues.ingredient)
          ? convertedValues.ingredient
          : [],
        // Đảm bảo các trường bắt buộc có giá trị
        unitId: convertedValues.unit
          ? parseInt(convertedValues.unit) || undefined
          : undefined,
      }

      // Log dữ liệu trước khi gửi để kiểm tra
      console.log("Data being sent to server:", serverData)

      // Đảm bảo các trường mảng luôn là mảng ngay cả khi là null hoặc undefined
      if (!Array.isArray(serverData.productPictures)) {
        serverData.productPictures = []
      }

      if (!Array.isArray(serverData.subProductType)) {
        serverData.subProductType = []
      }

      if (!Array.isArray(serverData.ingredient)) {
        serverData.ingredient = []
      }

      if (isEdit && currentProductId) {
        // Thêm ID cho update request
        await updateProductMutation.mutateAsync({
          id: currentProductId,
          productData: {
            ...serverData,
            id: currentProductId,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
        })
        message.success("Cập nhật sản phẩm thành công")
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await createProductMutation.mutateAsync(serverData as any)
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
                  options={
                    productTypes?.items?.map((type: ProductType) => ({
                      label: type.name,
                      value: type.id,
                    })) || []
                  }
                  className='w-full'
                />
              </div>

              <div className='w-full'>
                <FormFieldNumber
                  name='price'
                  control={control}
                  label='Giá bán (VNĐ)'
                  placeholder='Nhập giá bán'
                  required
                  rules={{ required: "Vui lòng nhập giá bán" }}
                  className='w-full'
                  fixedDecimalScale={false}
                  // Trường price theo schema là string nên component sẽ tự động trả về string
                />
              </div>

              <div className='w-full'>
                <FormComboBox
                  name='unit'
                  control={control}
                  label='Đơn vị tính'
                  placeholder='Chọn đơn vị tính'
                  options={units?.map((unit) => ({
                    label: `${unit.name} (${unit.code})`,
                    value: unit.name,
                  }))}
                  className='w-full'
                  required
                  rules={{ required: "Vui lòng chọn đơn vị tính" }}
                />
              </div>

              <div className='w-full'>
                <FormFieldNumber
                  name='quantity'
                  control={control}
                  label='Số lượng'
                  placeholder='Nhập số lượng'
                  required
                  rules={{ required: "Vui lòng nhập số lượng" }}
                  className='w-full'
                />
              </div>

              {/* Thêm trường symbol */}
              <div className='w-full'>
                <FormComboBox
                  name='symbolId'
                  control={control}
                  label='Ký hiệu'
                  placeholder='Chọn ký hiệu'
                  options={
                    symbols?.map((symbol: Symbol) => ({
                      label: `${symbol.name}`,
                      value: symbol.id,
                    })) || []
                  }
                  className='w-full'
                />
              </div>

              {/* Thêm trường ingredient với yêu cầu bắt buộc */}
              <div className='w-full'>
                <FormField
                  name='ingredient'
                  control={control}
                  label='Thành phần nguyên liệu'
                  placeholder='Nhập các thành phần, ngăn cách bằng dấu phẩy'
                  className='w-full'
                  required
                  rules={{ required: "Vui lòng nhập thành phần nguyên liệu" }}
                />
              </div>

              <div className='w-full'>
                <FormComboBox
                  name='subTypes'
                  control={control}
                  label='Loại phụ sản phẩm'
                  placeholder='Chọn loại phụ sản phẩm'
                  mode='multiple'
                  options={
                    productSubtypes?.map((subtype) => ({
                      label: (subtype.subtypeName ||
                        subtype.name ||
                        "") as string,
                      value: subtype.id,
                    })) || []
                  }
                  className='w-full'
                />
              </div>

              <div className='w-full'>
                <FormField
                  name='discount'
                  control={control}
                  label='Giảm giá (%)'
                  placeholder='Nhập giảm giá'
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
                name='pictures'
                control={control}
                label='Hình ảnh chi tiết'
                maxCount={5}
                multiple={true}
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
