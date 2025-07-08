import React, { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Form, Input, Button, Select, Upload, message, Card, Space } from "antd"
import { UploadOutlined, SaveOutlined } from "@ant-design/icons"
import { CKEditor } from "@ckeditor/ckeditor5-react"
import ClassicEditor from "@ckeditor/ckeditor5-build-classic"
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

const ProductForm: React.FC<ProductFormProps> = (props) => {
  const { isEdit = false, productId } = props
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(false)
  const [productTypes, setProductTypes] = useState<ProductType[]>([])
  const [description, setDescription] = useState("")
  const [selectedProductType, setSelectedProductType] = useState<
    number | undefined
  >(undefined)

  const renderProductAttributes = () => {
    const productType = form.getFieldValue("type")
    const selectedType = productTypes.find((type) => type.id === productType)

    if (!selectedType) return null

    switch (selectedType.name) {
      case "Nấm":
        return (
          <div className='grid grid-cols-2 gap-4'>
            <Form.Item label='Xuất xứ' name={["attributes", "origin"]}>
              <Input placeholder='Nhập xuất xứ' />
            </Form.Item>
            <Form.Item label='Trọng lượng (g)' name={["attributes", "weight"]}>
              <Input type='number' min={0} placeholder='Ví dụ: 500' />
            </Form.Item>
            <Form.Item label='Độ tươi' name={["attributes", "freshness"]}>
              <Select placeholder='Chọn độ tươi'>
                <Select.Option value='Tươi'>Tươi</Select.Option>
                <Select.Option value='Khô'>Khô</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label='Hữu cơ' name={["attributes", "organic"]}>
              <Select placeholder='Chọn trạng thái'>
                <Select.Option value={true}>Có</Select.Option>
                <Select.Option value={false}>Không</Select.Option>
              </Select>
            </Form.Item>
          </div>
        )
      case "Phân bón":
        return (
          <div className='grid grid-cols-2 gap-4'>
            <Form.Item
              label='Thành phần chính'
              name={["attributes", "main_ingredient"]}
            >
              <Input placeholder='Nhập thành phần' />
            </Form.Item>
            <Form.Item label='Khối lượng (kg)' name={["attributes", "weight"]}>
              <Input type='number' min={0} placeholder='Ví dụ: 5' />
            </Form.Item>
            <Form.Item
              label='Loại phân'
              name={["attributes", "fertilizer_type"]}
            >
              <Select placeholder='Chọn loại phân'>
                <Select.Option value='Hữu cơ'>Hữu cơ</Select.Option>
                <Select.Option value='Vô cơ'>Vô cơ</Select.Option>
              </Select>
            </Form.Item>
          </div>
        )
      case "Thuốc bảo vệ thực vật":
        return (
          <div className='grid grid-cols-2 gap-4'>
            <Form.Item
              label='Hoạt chất'
              name={["attributes", "active_ingredient"]}
            >
              <Input placeholder='Nhập hoạt chất' />
            </Form.Item>
            <Form.Item label='Thể tích (ml)' name={["attributes", "volume"]}>
              <Input type='number' min={0} placeholder='Ví dụ: 100' />
            </Form.Item>
            <Form.Item label='Độ độc' name={["attributes", "toxicity"]}>
              <Select placeholder='Chọn độ độc'>
                <Select.Option value='Nhóm I'>Nhóm I</Select.Option>
                <Select.Option value='Nhóm II'>Nhóm II</Select.Option>
                <Select.Option value='Nhóm III'>Nhóm III</Select.Option>
              </Select>
            </Form.Item>
          </div>
        )
      case "Cây trồng":
        return (
          <div className='grid grid-cols-2 gap-4'>
            <Form.Item label='Tuổi thọ (tháng)' name={["attributes", "age"]}>
              <Input type='number' min={0} placeholder='Ví dụ: 12' />
            </Form.Item>
            <Form.Item label='Chiều cao (cm)' name={["attributes", "height"]}>
              <Input type='number' min={0} placeholder='Ví dụ: 30' />
            </Form.Item>
            <Form.Item
              label='Mức độ chăm sóc'
              name={["attributes", "care_level"]}
            >
              <Select placeholder='Chọn mức độ chăm sóc'>
                <Select.Option value='Dễ'>Dễ</Select.Option>
                <Select.Option value='Trung bình'>Trung bình</Select.Option>
                <Select.Option value='Khó'>Khó</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label='Kèm chậu' name={["attributes", "pot_included"]}>
              <Select placeholder='Chọn trạng thái'>
                <Select.Option value={true}>Có</Select.Option>
                <Select.Option value={false}>Không</Select.Option>
              </Select>
            </Form.Item>
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
      const currentProductId = id || productId
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
        form.setFieldsValue(formValues)
        setSelectedProductType(mappedProduct.type) // Set selected product type

        // Đặt giá trị cho mô tả
        setDescription(productData.productDescription || "")

        console.log("Form values after set:", form.getFieldsValue())
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
  }, [id, isEdit, form, productId])

  const onFinish = async (values: ProductFormValues) => {
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

      if (isEdit && id) {
        await productService.updateProduct(
          parseInt(id),
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
          <Form
            form={form}
            layout='vertical'
            onFinish={onFinish}
            initialValues={{
              isPublished: true,
              discount: "0",
              quantity: 1,
            }}
          >
            <div className='grid grid-cols-2 gap-4'>
              <Form.Item
                label='Tên sản phẩm'
                name='name'
                rules={[
                  { required: true, message: "Vui lòng nhập tên sản phẩm" },
                ]}
              >
                <Input placeholder='Nhập tên sản phẩm' />
              </Form.Item>

              <Form.Item
                label='Loại sản phẩm'
                name='type'
                rules={[
                  { required: true, message: "Vui lòng chọn loại sản phẩm" },
                ]}
              >
                <Select
                  placeholder='Chọn loại sản phẩm'
                  loading={!productTypes.length}
                  onChange={(value) => setSelectedProductType(value)}
                >
                  {productTypes.map((type) => (
                    <Select.Option key={type.id} value={type.id}>
                      {type.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label='Giá bán (VNĐ)'
                name='price'
                rules={[{ required: true, message: "Vui lòng nhập giá bán" }]}
              >
                <Input type='number' min={0} addonAfter='VNĐ' />
              </Form.Item>

              <Form.Item
                label='Số lượng'
                name='quantity'
                rules={[{ required: true, message: "Vui lòng nhập số lượng" }]}
              >
                <Input type='number' min={0} />
              </Form.Item>

              <Form.Item label='Giảm giá (%)' name='discount'>
                <Input type='number' min={0} max={100} addonAfter='%' />
              </Form.Item>

              <Form.Item label='Trạng thái' name='isPublished'>
                <Select>
                  <Select.Option value={true}>Đang bán</Select.Option>
                  <Select.Option value={false}>Nháp</Select.Option>
                </Select>
              </Form.Item>
            </div>

            <Form.Item
              label='Mô tả sản phẩm'
              name='description'
              rules={[
                { required: true, message: "Vui lòng nhập mô tả sản phẩm" },
              ]}
            >
              <div className='ckeditor-container'>
                <CKEditor
                  editor={ClassicEditor}
                  data={description}
                  onChange={(event, editor) => {
                    const data = editor.getData()
                    setDescription(data)
                  }}
                />
              </div>
              <style>{`
                .ck-editor__editable {
                  min-height: 200px;
                }
              `}</style>
            </Form.Item>

            <Form.Item
              label='Hình ảnh sản phẩm'
              name='thumb'
              valuePropName='fileList'
              getValueFromEvent={(e) => e && e.fileList}
            >
              <Upload
                listType='picture-card'
                maxCount={5}
                beforeUpload={() => false}
              >
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Tải lên</div>
                </div>
              </Upload>
            </Form.Item>

            <Form.Item
              label='Ảnh chi tiết sản phẩm'
              name='pictures'
              valuePropName='fileList'
              getValueFromEvent={(e) => e && e.fileList}
            >
              <Upload
                listType='picture-card'
                maxCount={5}
                multiple
                beforeUpload={() => false}
              >
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Tải lên</div>
                </div>
              </Upload>
            </Form.Item>

            {selectedProductType && (
              <div className='mb-4'>
                <h3 className='text-lg font-medium mb-2'>
                  Thuộc tính sản phẩm
                </h3>
                {renderProductAttributes()}
              </div>
            )}

            <Form.Item style={{ textAlign: "right", marginTop: "24px" }}>
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
            </Form.Item>
          </Form>
        </Card>
      </Space>
    </div>
  )
}

export default ProductForm
