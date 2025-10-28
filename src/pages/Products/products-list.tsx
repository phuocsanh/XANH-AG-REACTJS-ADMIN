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
import { ConfirmModal } from "../../components/common" // Cập nhật import
import { useDeleteProductMutation } from "@/queries/product" // Thêm hook xóa

// Extend Product interface để tương thích với DataTable

// Type for product form values
const ProductsList: React.FC = () => {
  // State quản lý UI
  const [searchTerm, setSearchTerm] = React.useState<string>("")
  const [filterType, setFilterType] = React.useState<string>("")
  const [isViewModalVisible, setIsViewModalVisible] =
    React.useState<boolean>(false)
  const [deleteConfirmVisible, setDeleteConfirmVisible] =
    React.useState<boolean>(false) // Thêm state cho modal xóa
  const [deletingProduct, setDeletingProduct] = React.useState<Product | null>(
    null
  ) // Thêm state cho sản phẩm đang xóa
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
  const deleteProductMutation = useDeleteProductMutation() // Thêm hook xóa

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

  // Xử lý xóa sản phẩm - cập nhật để set state cho modal
  const handleDelete = (product: Product) => {
    // Set state để hiển thị modal xác nhận
    setDeletingProduct(product)
    setDeleteConfirmVisible(true)
  }

  // Xử lý xác nhận xóa
  const handleConfirmDelete = async () => {
    if (!deletingProduct) return

    try {
      await deleteProductMutation.mutateAsync(deletingProduct.id)
      // Đóng modal xác nhận
      setDeleteConfirmVisible(false)
      setDeletingProduct(null)
    } catch (error) {
      console.error("Error deleting product:", error)
      // Đóng modal xác nhận
      setDeleteConfirmVisible(false)
      setDeletingProduct(null)
    }
  }

  // Xử lý hủy bỏ xóa
  const handleCancelDelete = () => {
    setDeleteConfirmVisible(false)
    setDeletingProduct(null)
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

        const name = String(product.name || "").toLowerCase()
        const description = String(product.description || "").toLowerCase()

        return (
          name.includes(lowerSearchTerm) ||
          description.includes(lowerSearchTerm)
        )
      })
    }

    // Lọc theo loại sản phẩm
    if (filterType) {
      result = result.filter((product: Product) => {
        const productType = product.type
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

  // Hàm tiện ích để xử lý đường dẫn ảnh
  const getImageUrl = React.useCallback((url: string | undefined): string => {
    if (!url) return "https://via.placeholder.com/80?text=No+Image"

    // Nếu là đường dẫn đầy đủ thì trả về nguyên gốc
    if (url.startsWith("http")) return url

    // Nếu là đường dẫn tương đối thì thêm base URL
    if (url.startsWith("/")) return `http://localhost:3003${url}`

    // Trường hợp còn lại trả về nguyên gốc
    return url
  }, [])

  // Cấu hình columns cho DataTable
  const columns = [
    {
      key: "thumb",
      title: "Hình ảnh",
      width: 100,
      render: (record: ExtendedProduct) => {
        // Lấy ảnh từ thumb hoặc pictures[0]
        const imageUrl =
          record.thumb ||
          (record.pictures && record.pictures.length > 0
            ? record.pictures[0]
            : undefined)

        return (
          <Image
            src={getImageUrl(imageUrl)}
            width={80}
            height={80}
            style={{ objectFit: "cover", borderRadius: "4px" }}
            alt={record.name || "Sản phẩm"}
            fallback='https://via.placeholder.com/80?text=No+Image'
            preview={false}
          />
        )
      },
    },
    {
      key: "name",
      title: "Tên sản phẩm",
      render: (_: unknown, record: ExtendedProduct) => (
        <div className='flex items-center space-x-3'>
          <div>
            <div className='font-medium'>{record.name}</div>
            <div className='text-gray-500 text-sm line-clamp-2'>
              {record.description && record.description.length > 50 ? (
                `${record.description.substring(0, 50)}...`
              ) : (
                <span>{record.description || ""}</span>
              )}
            </div>
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
      title: "Tồn kho",
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      align: "center" as const,
      render: (_: unknown, record: ExtendedProduct) => (
        <Tag
          color={record.quantity && record.quantity > 0 ? "green" : "orange"}
        >
          {record.quantity || 0}
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
          <Button
            danger
            icon={<DeleteOutlined />}
            title='Xóa'
            onClick={() => handleDelete(record)} // Gọi handleDelete với toàn bộ record
          />
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
          onClick={() => navigate("/products/new")}
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
                src={getImageUrl(
                  currentProduct.thumb ||
                    (currentProduct.pictures &&
                    currentProduct.pictures.length > 0
                      ? currentProduct.pictures[0]
                      : undefined)
                )}
                width={80}
                height={80}
                style={{ objectFit: "cover", borderRadius: "4px" }}
                alt={currentProduct.name}
              />
            </Descriptions.Item>
            <Descriptions.Item label='Tên sản phẩm'>
              {currentProduct.name}
            </Descriptions.Item>
            <Descriptions.Item label='Mô tả'>
              {currentProduct.description || "Không có mô tả"}
            </Descriptions.Item>
            <Descriptions.Item label='Giá bán'>
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(Number(currentProduct.price || 0))}
            </Descriptions.Item>
            <Descriptions.Item label='Tồn kho'>
              {currentProduct.quantity || 0}
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
            {currentProduct.attributes && (
              <Descriptions.Item label='Thuộc tính'>
                <div className='grid grid-cols-2 gap-2'>
                  {(currentProduct.attributes as Record<string, unknown>)
                    ? Object.entries(
                        currentProduct.attributes as Record<string, unknown>
                      ).map(([key, value]) => (
                        <div key={key} className='flex'>
                          <span className='font-medium mr-2'>{key}:</span>
                          <span>
                            {typeof value === "object"
                              ? JSON.stringify(value)
                              : String(value)}
                          </span>
                        </div>
                      ))
                    : Object.entries(
                        currentProduct.attributes as Record<string, unknown>
                      ).map(([key, value]) => (
                        <div key={key} className='flex'>
                          <span className='font-medium mr-2'>{key}:</span>
                          <span>
                            {typeof value === "object"
                              ? JSON.stringify(value)
                              : String(value)}
                          </span>
                        </div>
                      ))}
                </div>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* Modal xác nhận xóa */}
      <ConfirmModal
        title='Xác nhận xóa'
        content={
          deletingProduct
            ? `Bạn có chắc chắn muốn xóa sản phẩm "${deletingProduct.name}"?`
            : "Xác nhận xóa"
        }
        open={deleteConfirmVisible}
        onOk={handleConfirmDelete}
        onCancel={handleCancelDelete}
        okText='Xóa'
        okType='primary'
        cancelText='Hủy'
      />
    </div>
  )
}

export default ProductsList
