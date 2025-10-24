import * as React from "react"
import { useNavigate } from "react-router-dom"

import { Product, ExtendedProduct } from "../../models/product.model"
import { useProductsQuery } from "../../queries/product"
import { useProductTypesQuery } from "@/queries/product-type"
import { ProductType } from "../../models/product-type.model"
import {
  Button,
  Input,
  Modal,
  Select,
  Tag,
  Image,
  Space,
  Popconfirm,
  Descriptions,
} from "antd"
import {
  PlusOutlined,
  SearchOutlined,
  FileSearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons"
import DataTable from "../../components/common/data-table"

// Extend Product interface để tương thích với DataTable

// Type for product form values
const ProductsList: React.FC = () => {
  // State quản lý UI
  const [searchTerm, setSearchTerm] = React.useState<string>("")
  const [filterType, setFilterType] = React.useState<string>("")
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

  // Hàm xử lý submit form

  const navigate = useNavigate()

  // Hàm xử lý chỉnh sửa sản phẩm
  const handleEditProduct = (product: Product) => {
    if (!product) return

    // Điều hướng đến trang chỉnh sửa với ID sản phẩm
    navigate(`/products/edit/${product.id}`)
  }

  // Sử dụng query hook mới để fetch danh sách sản phẩm
  const { data: productsData, isLoading: isLoadingProducts } =
    useProductsQuery()

  // Sử dụng query hook mới để fetch danh sách loại sản phẩm
  const { data: productTypesData, isLoading: isLoadingTypes } =
    useProductTypesQuery()

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
    if (!productsData) {
      return []
    }

    let result = [...productsData]

    // Lọc theo từ khóa tìm kiếm
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase().trim()
      result = result.filter((product: Product) => {
        if (!product) return false

        const name = String(product.productName || "").toLowerCase()
        const description = String(
          product.productDescription || ""
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
        const productType = product.productType
        return productType?.toString() === filterType
      })
    }

    return result
  }, [productsData, searchTerm, filterType])

  // Sử dụng filteredProducts trong giao diện
  const displayProducts = filteredProducts as ExtendedProduct[]
  console.log("Displaying products:", displayProducts.length)

  // Function to handle file change (commented out until needed)
  // const handleFileChange = ({ fileList: _newFileList }: { fileList: UploadFile[] }) => {
  //   // Update file list state
  //   // setFileList(newFileList);
  // };

  const loading = isLoadingProducts || isLoadingTypes

  // Cấu hình columns cho DataTable
  const columns = [
    {
      key: "thumb",
      title: "Hình ảnh",
      width: 100,
      render: (record: ExtendedProduct) => (
        <Image
          src={record.productThumb || "https://via.placeholder.com/80"}
          width={80}
          height={80}
          style={{ objectFit: "cover", borderRadius: "4px" }}
          alt=''
        />
      ),
    },
    {
      key: "name",
      title: "Tên sản phẩm",
      render: (record: ExtendedProduct) => (
        <div>
          <div className='font-medium'>{record.productName}</div>
          <div className='text-gray-500 text-sm'>
            {record.productDescription
              ? `${record.productDescription.substring(0, 50)}${
                  record.productDescription.length > 50 ? "..." : ""
                }`
              : "Không có mô tả"}
          </div>
        </div>
      ),
    },
    {
      key: "price",
      title: "Giá",
      width: 150,
      render: (record: ExtendedProduct) => (
        <div className='font-medium text-right'>
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(Number(record.productPrice || 0))}
        </div>
      ),
    },
    {
      key: "quantity",
      title: "Số lượng",
      width: 100,
      render: (record: ExtendedProduct) => (
        <Tag
          color={
            record.productQuantity && record.productQuantity > 0
              ? "green"
              : "red"
          }
        >
          {record.productQuantity || 0}
        </Tag>
      ),
    },
    {
      key: "status",
      title: "Trạng thái",
      width: 120,
      render: (record: ExtendedProduct) => (
        <Tag color={record.status === "active" ? "green" : "default"}>
          {record.status === "active" ? "Đang bán" : "Nháp"}
        </Tag>
      ),
    },
    {
      key: "action",
      title: "Hành động",
      width: 150,
      render: (record: ExtendedProduct) => (
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
  ]

  return (
    <div className='p-6'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold'>Danh sách sản phẩm</h1>
        <Button
          type='primary'
          icon={<PlusOutlined />}
          onClick={() => navigate("/products/add")}
        >
          Thêm sản phẩm
        </Button>
      </div>

      {/* Thanh tìm kiếm và lọc */}
      <div className='mb-6 flex gap-4'>
        <Input
          placeholder='Tìm kiếm sản phẩm...'
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={handleSearch}
          className='flex-1'
        />
        <Select
          placeholder='Lọc theo loại sản phẩm'
          value={filterType}
          onChange={handleFilter}
          allowClear
          className='w-64'
        >
          {productTypes.map((type) => (
            <Select.Option key={type.id} value={type.id?.toString()}>
              {type.typeName}
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
          <DataTable
            data={displayProducts}
            columns={columns}
            loading={loading}
            pagination={{
              current: 1,
              pageSize: displayProducts.length,
              total: displayProducts.length,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
              showTotal: (total: number) => `Tổng ${total} sản phẩm`,
              onChange: (page: number, pageSize: number) => {
                // Xử lý phân trang
                console.log("Page changed:", page, "Page size:", pageSize)
              },
            }}
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
                src={
                  currentProduct.productThumb ||
                  "https://via.placeholder.com/200"
                }
                alt={currentProduct.productName}
                fallback='https://via.placeholder.com/200'
              />
            </Descriptions.Item>
            <Descriptions.Item label='Tên sản phẩm'>
              {currentProduct.productName}
            </Descriptions.Item>
            <Descriptions.Item label='Mô tả'>
              {currentProduct.productDescription || "Không có mô tả"}
            </Descriptions.Item>
            <Descriptions.Item label='Giá'>
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(Number(currentProduct.productPrice || 0))}
            </Descriptions.Item>
            <Descriptions.Item label='Số lượng'>
              {currentProduct.productQuantity || 0}
            </Descriptions.Item>
            <Descriptions.Item label='Trạng thái'>
              <Tag
                color={currentProduct.status === "active" ? "green" : "default"}
              >
                {currentProduct.status === "active" ? "Đang bán" : "Bản nháp"}
              </Tag>
            </Descriptions.Item>
            {currentProduct.discount && currentProduct.discount !== "0" && (
              <Descriptions.Item label='Giảm giá'>
                <Tag color='red'>Giảm {currentProduct.discount}%</Tag>
              </Descriptions.Item>
            )}
            <Descriptions.Item label='Thuộc tính'>
              {currentProduct.productAttributes && (
                <div>
                  {(currentProduct.productAttributes as Record<string, unknown>)
                    .age !== undefined && (
                    <div>
                      Tuổi thọ:{" "}
                      {String(
                        (
                          currentProduct.productAttributes as Record<
                            string,
                            unknown
                          >
                        ).age
                      )}
                    </div>
                  )}
                  {(currentProduct.productAttributes as Record<string, unknown>)
                    .height !== undefined && (
                    <div>
                      Chiều cao:{" "}
                      {String(
                        (
                          currentProduct.productAttributes as Record<
                            string,
                            unknown
                          >
                        ).height
                      )}
                    </div>
                  )}
                  {(currentProduct.productAttributes as Record<string, unknown>)
                    .care_level !== undefined && (
                    <div>
                      Mức độ chăm sóc:{" "}
                      {String(
                        (
                          currentProduct.productAttributes as Record<
                            string,
                            unknown
                          >
                        ).care_level
                      )}
                    </div>
                  )}
                  <div>
                    Có kèm chậu:{" "}
                    {(
                      currentProduct.productAttributes as Record<
                        string,
                        unknown
                      >
                    ).pot_included
                      ? "Có"
                      : "Không"}
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
