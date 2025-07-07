import React, { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  Form,
  Input,
  Button,
  Select,
  Upload,
  message,
  Card,
  Typography,
  Space,
} from "antd"
import {
  UploadOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
} from "@ant-design/icons"
import { CKEditor } from "@ckeditor/ckeditor5-react"
import ClassicEditor from "@ckeditor/ckeditor5-build-classic"
import { productService } from "../../../services/product.service"
import { productTypeService } from "../../../services/product-type.service"
import {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ProductApiResponse
} from "../../../models/product.model"

interface ProductApiResponseWithItem {
  code: number;
  message: string;
  data: {
    item: ProductApiResponse;
  };
}
import { ProductType } from "../../../models/product-type.model"

const { Title } = Typography

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
        const response = await productService.getProductById(parseInt(currentProductId)) as unknown as ProductApiResponseWithItem
        
        // Lấy dữ liệu từ response.data.item hoặc response.data nếu không có .item
        const productData = response?.data?.item || response?.data
        console.log('Product data from API:', productData)
        
        if (!productData) {
          throw new Error('Không tìm thấy thông tin sản phẩm')
        }
        
        // Tạo đối tượng form values từ dữ liệu API
        const formValues: Partial<CreateProductRequest> = {
          name: productData.productName,
          price: productData.productPrice,
          type: productData.productType,
          quantity: productData.productQuantity,
          discount: productData.discount,
          isPublished: productData.isPublished,
          attributes: productData.productAttributes || {},
          subTypes: productData.subProductType || [],
          thumb: productData.productThumb,
          pictures: productData.productPictures || [],
          videos: productData.productVideos || [],
          description: productData.productDescription || ""
        }
        
        console.log('Mapped form values:', formValues)
        
        // Đặt giá trị cho form
        form.setFieldsValue(formValues)
        
        // Đặt giá trị cho mô tả
        setDescription(productData.productDescription || "")
        
        console.log('Form values after set:', form.getFieldsValue())
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
  }, [id, isEdit, form])

  const onFinish = async (values: any) => {
    try {
      setLoading(true)
      const productData = {
        ...values,
        description: description,
      }

      if (isEdit && id) {
        await productService.updateProduct(
          parseInt(id),
          productData as UpdateProductRequest
        )
        message.success("Cập nhật sản phẩm thành công")
      } else {
        await productService.createProduct(productData as CreateProductRequest)
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
        <Space>
          <Button
            type='text'
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/products")}
          >
            Quay lại
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            {isEdit ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
          </Title>
        </Space>

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
                  editor={ClassicEditor as any}
                  data={description}
                  onChange={(event, editor) => {
                    const data = editor.getData()
                    setDescription(data)
                  }}
                />
              </div>
              <style jsx global>{`
                .ck-editor__editable {
                  min-height: 200px;
                }
              `}</style>
            </Form.Item>

            <Form.Item label='Hình ảnh sản phẩm' name='thumb'>
              <Upload
                listType='picture-card'
                maxCount={1}
                beforeUpload={() => false}
              >
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Tải lên</div>
                </div>
              </Upload>
            </Form.Item>

            <div className='mb-4'>
              <h3 className='text-lg font-medium mb-2'>Thuộc tính sản phẩm</h3>
              <div className='grid grid-cols-2 gap-4'>
                <Form.Item
                  label='Tuổi thọ (tháng)'
                  name={["attributes", "age"]}
                >
                  <Input type='number' min={0} placeholder='Ví dụ: 12' />
                </Form.Item>

                <Form.Item
                  label='Chiều cao (cm)'
                  name={["attributes", "height"]}
                >
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

                <Form.Item
                  label='Kèm chậu'
                  name={["attributes", "pot_included"]}
                >
                  <Select placeholder='Chọn trạng thái'>
                    <Select.Option value={true}>Có</Select.Option>
                    <Select.Option value={false}>Không</Select.Option>
                  </Select>
                </Form.Item>
              </div>
            </div>

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
