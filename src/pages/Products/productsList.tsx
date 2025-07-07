import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"

// Helper function to convert file to base64
const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}
import {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ProductApiResponseData,
} from "../../models/product.model"
import { productService } from "../../services/product.service"
import { productTypeService } from "../../services/product-type.service"
import { ProductType } from "../../models/product-type.model"
import { PaginationData } from "../../models/pagination.model"
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Select,
  Table,
  Tag,
  Image,
  Space,
  Popconfirm,
  Descriptions,
  Upload,
} from "antd"
import {
  PlusOutlined,
  SearchOutlined,
  FileSearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons"
import type { UploadFile } from "antd/es/upload/interface"

// Type for product form values
interface ProductFormValues extends Omit<Partial<Product>, "id" | "thumb"> {
  thumb?: File | string
}

const ProductsList: React.FC = () => {
  // State quản lý UI
  const [searchTerm, setSearchTerm] = React.useState<string>("")
  const [filterType, setFilterType] = React.useState<string>("")
  const [isModalVisible, setIsModalVisible] = React.useState<boolean>(false)
  const [isViewModalVisible, setIsViewModalVisible] =
    React.useState<boolean>(false)
  // State for image preview (commented out until needed)
  // const [previewOpen, setPreviewOpen] = React.useState<boolean>(false);
  // const [previewImage, setPreviewImage] = React.useState<string>('');
  // const [previewTitle, setPreviewTitle] = React.useState<string>('');

  // State quản lý dữ liệu
  const [currentProduct, setCurrentProduct] = React.useState<Product | null>(
    null
  )
  const [fileList] = React.useState<UploadFile[]>([])

  // Khởi tạo form và query client
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  // Hàm xử lý submit form

  const handleSubmit = async (values: ProductFormValues) => {
    try {
      const formData = new FormData()

      // Append all form values to FormData
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === "attributes" && typeof value === "object") {
            formData.append(key, JSON.stringify(value))
          } else if (key !== "thumb") {
            formData.append(key, String(value))
          }
        }
      })

      // Handle file upload if exists
      // Handle file upload if exists
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append("thumb", fileList[0].originFileObj as File)
      }

      // Create proper request objects from form data
      const formDataObj = Object.fromEntries(formData.entries())

      if (currentProduct) {
        // Update product
        const updateData: UpdateProductRequest = {
          id: currentProduct.id,
          ...formDataObj,
          price: String(formDataObj.price || "0"),
          quantity: Number(formDataObj.quantity) || 0,
          type: Number(formDataObj.type) || 0,
          name: String(formDataObj.name || ""),
          description: String(formDataObj.description || ""),
        }

        await productService.updateProduct(currentProduct.id, updateData)
        message.success("Cập nhật sản phẩm thành công")
      } else {
        // Add new product
        const thumbBase64 = fileList[0]?.originFileObj
          ? await convertFileToBase64(fileList[0].originFileObj as File)
          : ""

        const createData: CreateProductRequest = {
          name: String(formDataObj.name || ""),
          type: Number(formDataObj.type) || 0,
          description: String(formDataObj.description || ""),
          price: String(formDataObj.price || "0"),
          quantity: Number(formDataObj.quantity) || 0,
          thumb: thumbBase64,
          isPublished: formDataObj.isPublished === "true",
          discount: formDataObj.discount ? String(formDataObj.discount) : "0",
          attributes: formDataObj.attributes
            ? JSON.parse(String(formDataObj.attributes))
            : {},
        }

        await productService.createProduct(createData)
        message.success("Thêm sản phẩm thành công")
      }

      setIsModalVisible(false)
      queryClient.invalidateQueries({ queryKey: ["products"] })
    } catch (error) {
      message.error("Có lỗi xảy ra khi lưu sản phẩm")
      console.error(error)
    }
  }

  const navigate = useNavigate()

  // Hàm xử lý chỉnh sửa sản phẩm
  const handleEditProduct = (product: Product) => {
    if (!product) return
    
    // Điều hướng đến trang chỉnh sửa với ID sản phẩm
    navigate(`/products/edit/${product.id}`)
  }

  // Sử dụng useQuery để fetch danh sách sản phẩm
  const {
    data: productsData,
    isLoading: isLoadingProducts,
    error: productsError,
  } = useQuery<PaginationData<Product>, Error>({
    queryKey: ["products"],
    queryFn: async () => {
      try {
        const response = await productService.getProducts()
        console.log("API Response:", response) // Log để kiểm tra dữ liệu từ API

        // Kiểm tra nếu response.data là undefined
        if (!response?.data) {
          throw new Error("Dữ liệu sản phẩm không hợp lệ")
        }

        const apiData = response.data as unknown as ProductApiResponseData

        // Trả về dữ liệu đã được định dạng đúng
        return {
          items: apiData.items.map((item) => ({
            id: item.id,
            name: item.productName,
            price: item.productPrice,
            type: item.productType,
            thumb: item.productThumb,
            pictures: item.productPictures || [],
            videos: item.productVideos || [],
            description: item.productDescription,
            quantity: item.productQuantity,
            subTypes: item.subProductType || [],
            discount: item.discount,
            attributes: item.productAttributes || {},
            isDraft: item.isDraft,
            isPublished: item.isPublished,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          })),
          total: apiData.pagination?.total || 0,
          page: apiData.pagination?.page || 1,
          limit: apiData.pagination?.page_size || 10,
          totalPages: apiData.pagination?.total_pages || 1,
          hasNext: apiData.pagination?.has_next || false,
          hasPrev: apiData.pagination?.has_prev || false,
        } as PaginationData<Product>
      } catch (error: unknown) {
        console.error("Lỗi khi tải danh sách sản phẩm:", error)
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách sản phẩm"
        throw new Error(errorMessage)
      }
    },
  })

  // Sử dụng useQuery để fetch danh sách loại sản phẩm
  const {
    data: productTypesData,
    isLoading: isLoadingTypes,
    error: productTypesError,
  } = useQuery<PaginationData<ProductType>, Error>({
    queryKey: ["productTypes"],
    queryFn: async () => {
      const response = await productTypeService.getProductTypes()
      return response.data
    },
  })

  // Lấy danh sách loại sản phẩm
  const productTypes: ProductType[] = productTypesData?.items || []

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
  }

  // Hàm lọc sản phẩm theo loại
  const handleFilter = React.useCallback((value: string) => {
    setFilterType(value)
  }, [])

  const handleDelete = (id: number) => {
    // Xử lý xóa sản phẩm
    console.log("Delete product:", id)
    // Gọi API xóa sản phẩm
    // productService.deleteProduct(id).then(() => {
    //   queryClient.invalidateQueries(['products']);
    // });
  }

  // Filter products based on search term and filter type
  const filteredProducts = React.useMemo(() => {
    if (!productsData?.items) {
      return []
    }

    let result = [...productsData.items]

    // Lọc theo từ khóa tìm kiếm
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase().trim()
      result = result.filter((product: Product) => {
        if (!product) return false

        const name = String(
          product.name || product.productName || ""
        ).toLowerCase()
        const description = String(
          product.description || product.productDescription || ""
        ).toLowerCase()

        return (
          name.includes(lowerSearchTerm) ||
          description.includes(lowerSearchTerm)
        )
      })
    }

    // Lọc theo loại sản phẩm
    if (filterType) {
      result = result.filter((product: Product) => {
        const productType = product.productType || product.type
        return productType?.toString() === filterType
      })
    }

    return result
  }, [productsData, searchTerm, filterType])

  // Sử dụng filteredProducts trong giao diện
  const displayProducts = filteredProducts as Product[]
  console.log("Displaying products:", displayProducts.length)

  // Function to handle file change (commented out until needed)
  // const handleFileChange = ({ fileList: _newFileList }: { fileList: UploadFile[] }) => {
  //   // Update file list state
  //   // setFileList(newFileList);
  // };

  const loading = isLoadingProducts || isLoadingTypes
  const error = productsError || productTypesError

  // Kiểm tra nếu đang tải
  if (loading) {
    return <div>Đang tải sản phẩm...</div>
  }

  // Kiểm tra nếu có lỗi
  if (error) {
    const errorResponse = error as Error
    return <div>Lỗi khi tải dữ liệu sản phẩm: {errorResponse.message}</div>
  }

  return (
    <div className='p-4'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold'>Danh sách sản phẩm</h1>
        <Button
          type='primary'
          onClick={() => navigate("/products/new")}
          icon={<PlusOutlined />}
        >
          Thêm sản phẩm mới
        </Button>
      </div>

      {/* Thanh tìm kiếm và bộ lọc */}
      <div className='flex gap-2 mb-6'>
        <Input
          placeholder='Tìm kiếm sản phẩm...'
          value={searchTerm}
          onChange={handleSearch}
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
          allowClear
        />
        <Select
          onChange={handleFilter}
          value={filterType}
          style={{ width: 200 }}
          placeholder='Tất cả loại'
          allowClear
        >
          {productTypes?.map((type: ProductType) => (
            <Select.Option key={type.id} value={type.id.toString()}>
              {type.name}
            </Select.Option>
          ))}
        </Select>
      </div>

      {/* Danh sách sản phẩm */}
      {!displayProducts.length ? (
        <div className='text-center py-12 bg-gray-50 rounded'>
          <FileSearchOutlined
            style={{ fontSize: "48px", color: "#999", marginBottom: "16px" }}
          />
          <p className='text-gray-500 text-lg'>
            Không tìm thấy sản phẩm nào phù hợp
          </p>
        </div>
      ) : (
        <div className='bg-white rounded shadow'>
          <Table
            dataSource={displayProducts}
            rowKey='id'
            columns={[
              {
                title: "Hình ảnh",
                dataIndex: "thumb",
                key: "thumb",
                width: 100,
                render: (thumb) => (
                  <Image
                    src={thumb || "https://via.placeholder.com/80"}
                    width={80}
                    height={80}
                    style={{ objectFit: "cover", borderRadius: "4px" }}
                    alt=''
                  />
                ),
              },
              {
                title: "Tên sản phẩm",
                dataIndex: "name",
                key: "name",
                render: (text, record) => (
                  <div>
                    <div className='font-medium'>{text}</div>
                    <div className='text-gray-500 text-sm'>
                      {record.description
                        ? `${record.description.substring(0, 50)}${
                            record.description.length > 50 ? "..." : ""
                          }`
                        : "Không có mô tả"}
                    </div>
                  </div>
                ),
              },
              {
                title: "Giá",
                dataIndex: "price",
                key: "price",
                width: 150,
                render: (price) => (
                  <div className='font-medium text-right'>
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(Number(price || 0))}
                  </div>
                ),
              },
              {
                title: "Số lượng",
                dataIndex: "quantity",
                key: "quantity",
                width: 100,
                render: (quantity) => (
                  <Tag color={quantity > 0 ? "green" : "red"}>
                    {quantity || 0}
                  </Tag>
                ),
              },
              {
                title: "Trạng thái",
                dataIndex: "isPublished",
                key: "status",
                width: 120,
                render: (isPublished) => (
                  <Tag color={isPublished ? "green" : "default"}>
                    {isPublished ? "Đang bán" : "Nháp"}
                  </Tag>
                ),
              },
              {
                title: "Hành động",
                key: "action",
                width: 150,
                render: (_, record) => (
                  <Space size='middle'>
                    <Button
                      icon={<EyeOutlined />}
                      onClick={() => {
                        setCurrentProduct(record)
                        setIsViewModalVisible(true)
                      }}
                      title='Xem chi tiết'
                    />
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => handleEditProduct(record)}
                      title='Chỉnh sửa'
                    />
                    <Popconfirm
                      title='Bạn có chắc chắn muốn xóa sản phẩm này?'
                      onConfirm={() => handleDelete(record.id)}
                      okText='Đồng ý'
                      cancelText='Hủy'
                    >
                      <Button danger icon={<DeleteOutlined />} title='Xóa' />
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
            pagination={{
              current: productsData?.page || 1,
              pageSize: productsData?.limit || 10,
              total: productsData?.total || 0,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
              showTotal: (total) => `Tổng ${total} sản phẩm`,
              onChange: (page, pageSize) => {
                // Xử lý phân trang
                console.log("Page changed:", page, "Page size:", pageSize)
              },
            }}
            loading={isLoadingProducts}
          />
        </div>
      )}

      {/* Modal xem chi tiết sản phẩm */}
      <Modal
        title='Chi tiết sản phẩm'
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        footer={[
          <Button key='close' onClick={() => setIsViewModalVisible(false)}>
            Đóng
          </Button>,
          currentProduct && (
            <Button
              key='edit'
              type='primary'
              onClick={() => {
                setIsViewModalVisible(false)
                handleEditProduct(currentProduct)
              }}
            >
              Chỉnh sửa
            </Button>
          ),
        ]}
        width={700}
      >
        {currentProduct && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label='Hình ảnh'>
              <Image
                width={200}
                src={currentProduct.thumb || "https://via.placeholder.com/200"}
                alt={currentProduct.name}
                fallback='https://via.placeholder.com/200'
              />
            </Descriptions.Item>
            <Descriptions.Item label='Tên sản phẩm'>
              {currentProduct.name}
            </Descriptions.Item>
            <Descriptions.Item label='Mô tả'>
              {currentProduct.description || "Không có mô tả"}
            </Descriptions.Item>
            <Descriptions.Item label='Giá'>
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(Number(currentProduct.price || 0))}
            </Descriptions.Item>
            <Descriptions.Item label='Số lượng'>
              {currentProduct.quantity || 0}
            </Descriptions.Item>
            <Descriptions.Item label='Trạng thái'>
              <Tag color={currentProduct.isPublished ? "green" : "default"}>
                {currentProduct.isPublished ? "Đang bán" : "Bản nháp"}
              </Tag>
            </Descriptions.Item>
            {currentProduct.discount && currentProduct.discount !== "0" && (
              <Descriptions.Item label='Giảm giá'>
                <Tag color='red'>Giảm {currentProduct.discount}%</Tag>
              </Descriptions.Item>
            )}
            <Descriptions.Item label='Thuộc tính'>
              {currentProduct.attributes && (
                <div>
                  {currentProduct.attributes.age !== undefined && (
                    <div>Tuổi thọ: {String(currentProduct.attributes.age)}</div>
                  )}
                  {currentProduct.attributes.height !== undefined && (
                    <div>
                      Chiều cao: {String(currentProduct.attributes.height)}
                    </div>
                  )}
                  {currentProduct.attributes.care_level !== undefined && (
                    <div>
                      Mức độ chăm sóc:{" "}
                      {String(currentProduct.attributes.care_level)}
                    </div>
                  )}
                  <div>
                    Có kèm chậu:{" "}
                    {currentProduct.attributes.pot_included ? "Có" : "Không"}
                  </div>
                </div>
              )}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default ProductsList
