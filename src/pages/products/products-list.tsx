import * as React from "react"
import { useNavigate } from "react-router-dom"

import { Product, ExtendedProduct } from "../../models/product.model"
import { useProductsQuery } from "../../queries/product"
import { useProductTypesQuery } from "@/queries/product-type"
import { ProductType } from "../../models/product-type.model"
import {
  Button,
  Modal,
  Select,
  Tag,
  Image,
  Space,
  Descriptions,
} from "antd"
import { TablePaginationConfig, TableProps } from "antd"
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  FilterOutlined,
} from "@ant-design/icons"
import DataTable from "../../components/common/data-table"
import { ConfirmModal } from "../../components/common"
import { useDeleteProductMutation } from "@/queries/product"
import FilterHeader from "@/components/common/filter-header"

const ProductsList: React.FC = () => {
  // State quản lý UI & Data Params
  const [filters, setFilters] = React.useState<Record<string, any>>({})
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  // State modals
  const [isViewModalVisible, setIsViewModalVisible] = React.useState<boolean>(false)
  const [deleteConfirmVisible, setDeleteConfirmVisible] = React.useState<boolean>(false)
  const [deletingProduct, setDeletingProduct] = React.useState<Product | null>(null)
  const [currentProduct, setCurrentProduct] = React.useState<Product | null>(null)

  const navigate = useNavigate()
  const deleteProductMutation = useDeleteProductMutation()

  // Build Params cho Query
  const queryParams = React.useMemo(() => ({
      page: currentPage,
      limit: pageSize,
      ...filters
  }), [currentPage, pageSize, filters])

  // Sử dụng Server-side Query
  const { data: productsData, isLoading: isLoadingProducts } = useProductsQuery(queryParams)
  
  // Data access path based on API response structure
  const products = productsData?.data?.items || [] 
  const totalProducts = productsData?.data?.total || 0

  const handleEditProduct = (product: Product) => {
    if (!product) return
    navigate(`/products/edit/${product.id}`)
  }

  const { data: productTypesData, isLoading: isLoadingTypes } = useProductTypesQuery()
  const productTypes: ProductType[] = productTypesData?.data?.items || []

  // Xóa bộ lọc
  const handleClearFilters = () => {
      setFilters({})
      setCurrentPage(1)
  }

  // Update Filter trực tiếp từ Header Input
  const handleFilterChange = (key: string, value: any) => {
      const newFilters = { ...filters, [key]: value };
      if (!value && value !== 0) delete newFilters[key]; // Xóa key nếu value rỗng
      console.log('Filter change:', key, value, newFilters);
      setFilters(newFilters);
      setCurrentPage(1); // Reset về trang 1 khi filter
  }

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

  // Helper function for currency formatting
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  // Handle Table Change (Pagination, Filters, Sorter)
  const handleTableChange: TableProps<ExtendedProduct>['onChange'] = (
    pagination,
    tableFilters,
    sorter: any,
    extra
  ) => {
    const newFilters = { ...filters }

    // 1. Pagination
    if (pagination.current && pagination.pageSize) {
       setCurrentPage(pagination.current)
       setPageSize(pagination.pageSize)
    }

    // 2. Native Filters (Category, Status)
    if (tableFilters.category) {
       newFilters.type_id = (tableFilters.category as string[])[0]
    } else {
       delete newFilters.type_id
    }

    if (tableFilters.status) {
       newFilters.status = (tableFilters.status as string[])[0]
    } else {
       delete newFilters.status
    }

    // 3. Sorter
    if (sorter && sorter.order) {
        newFilters.sort_by = sorter.field
        newFilters.sort_direction = sorter.order === 'ascend' ? 'ASC' : 'DESC'
    } else {
        delete newFilters.sort_by
        delete newFilters.sort_direction
    }

    setFilters(newFilters)
  }

  // Cấu hình columns cho DataTable
  const columns = React.useMemo(() => [
    {
      key: "name",
      title: (
        <FilterHeader 
            title="Tên sản phẩm" 
            dataIndex="name" 
            value={filters.name} 
            onChange={(val) => handleFilterChange('name', val)}
            inputType="text"
        />
      ),
      width: 250,
      render: (_: unknown, record: ExtendedProduct) => (
        <div className='font-medium text-gray-900'>{record.name}</div>
      ),
    },
    {
      key: "trade_name",
      title: (
        <FilterHeader 
            title="Hiệu thuốc" 
            dataIndex="trade_name" 
            value={filters.trade_name} 
            onChange={(val) => handleFilterChange('trade_name', val)}
            inputType="text"
        />
      ),
      width: 200,
      render: (_: unknown, record: ExtendedProduct) => (
        <div className='font-medium text-gray-500'>{record.trade_name || '---'}</div>
      ),
    },
    {
        key: "category",
        title: "Danh mục",
        width: 150,
        filters: productTypes.map(t => ({ text: t.name, value: t.id })),
        filteredValue: filters.type_id ? [filters.type_id] : null, // Controlled filter state
        filterMultiple: false,
        render: (_: unknown, record: ExtendedProduct) => {
            const typeName = typeof record.type === 'object' && record.type 
                ? (record.type as any).name 
                : productTypes.find(t => t.id === record.type)?.name;
            return <div className='text-gray-600'>{typeName || '---'}</div>
        },
    },
    {
      key: "price",
      dataIndex: "price", // Needed for sorter to identify field
      title: "Giá tiền mặt",
      width: 150,
      sorter: true, // Enable sorting
      render: (value: string) => (
        <div className='font-medium text-emerald-600'>
          {formatCurrency(Number(value))}
        </div>
      ),
    },
    {
        key: "credit_price",
        dataIndex: "credit_price", // Needed for sorter to identify field
        title: "Giá nợ",
        width: 150,
        sorter: true, // Enable sorting
        render: (value: string) => (
          <div className='font-medium text-blue-600'>
            {value ? formatCurrency(Number(value)) : '---'}
          </div>
        ),
    },
    {
      key: "quantity",
      dataIndex: "quantity", // Needed for sorter to identify field
      title: "Số lượng",
      width: 120,
      align: 'center' as const,
      sorter: true, // Enable sorting
      render: (value: number) => (
        <Tag color={value > 0 ? 'green' : 'red'}>
            {value}
        </Tag>
      ),
    },
    {
      key: "status",
      title: "Trạng thái",
      width: 150,
      filters: [
          { text: "Đang bán", value: "active" },
          { text: "Ngừng bán", value: "inactive" },
          { text: "Chờ duyệt", value: "pending" },
          { text: "Đã lưu trữ", value: "archived" }
      ],
      filteredValue: filters.status ? [filters.status] : null, // Controlled filter state
      filterMultiple: false,
      render: (record: ExtendedProduct) => {
        let color = 'default';
        let text = '---';
        switch (record.status) {
            case 'active':
                color = 'green';
                text = 'Đang bán';
                break;
            case 'inactive':
                color = 'red';
                text = 'Ngừng bán';
                break;
            case 'pending':
                color = 'orange';
                text = 'Chờ duyệt';
                break;
            case 'archived':
                color = 'default';
                text = 'Đã lưu trữ';
                break;
            default:
                text = record.status;
        }
        return <Tag color={color}>{text}</Tag>
      },
    },
    {
      key: "action",
      title: "Hành động",
      width: 120,
      render: (record: ExtendedProduct) => (
        <Space size='small'>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => {
              setCurrentProduct(record)
              setIsViewModalVisible(true)
            }}
            title='Xem'
          />
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditProduct(record)}
            title='Sửa'
          />
          <Button
            danger
            icon={<DeleteOutlined />}
            size="small"
            title='Xóa'
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ], [filters, productTypes])

  return (
    <div className='p-2 md:p-6'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold'>Danh sách sản phẩm</h1>
        <Space>
            {Object.keys(filters).length > 0 && (
                <Button 
                    onClick={handleClearFilters}
                    icon={<FilterOutlined />}
                    danger
                >
                    Xóa bộ lọc
                </Button>
            )}
            <Button
            type='primary'
            icon={<PlusOutlined />}
            onClick={() => navigate("/products/new")}
            >
            Thêm sản phẩm
            </Button>
        </Space>
      </div>


      {/* Danh sách sản phẩm */}
      <div className='bg-white rounded shadow'>
        <DataTable
          data={products as ExtendedProduct[]}
          columns={columns}
          loading={loading}
          // Pass Server-side pagination via pagination prop (DataTable overrides it)
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalProducts,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total: number) => `Tổng ${total} sản phẩm`,
          }}
          onChange={handleTableChange}
          searchableColumns={[]} // Disable client-side search
          showSearch={false} // Disable client-side search UI
          showFilters={false} // Disable client-side filter UI
        />
      </div>

      {/* Modal xem chi tiết sản phẩm */}
      <Modal
        title='Chi tiết sản phẩm'
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        footer={[
          <Button key='close' onClick={() => setIsViewModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={700}
      >
        {currentProduct && (
          <Descriptions bordered column={1}>
            {(currentProduct.thumb || (currentProduct.pictures && currentProduct.pictures.length > 0)) && (
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
            )}
            <Descriptions.Item label='Tên sản phẩm'>
              {currentProduct.name}
            </Descriptions.Item>
            {currentProduct.notes && (
              <Descriptions.Item label='Ghi chú'>
                <div 
                  style={{ 
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word' 
                  }}
                >
                  {currentProduct.notes}
                </div>
              </Descriptions.Item>
            )}
            <Descriptions.Item label='Mô tả'>
              {currentProduct.description ? (
                <div 
                  dangerouslySetInnerHTML={{ __html: currentProduct.description }}
                  style={{ 
                    maxHeight: '300px', 
                    overflowY: 'auto',
                    wordBreak: 'break-word'
                  }}
                />
              ) : (
                "Không có mô tả"
              )}
            </Descriptions.Item>
            <Descriptions.Item label='Giá bán (Tiền mặt)'>
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(Number(currentProduct.price || 0))}
            </Descriptions.Item>
            <Descriptions.Item label='Giá bán (Nợ)'>
              {currentProduct.credit_price ? new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
                }).format(Number(currentProduct.credit_price)) : "Chưa thiết lập"}
            </Descriptions.Item>
            <Descriptions.Item label='Giá sau giảm'>
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(Number(currentProduct.discounted_price || 0))}
            </Descriptions.Item>
            <Descriptions.Item label='Số lượng'>
              {currentProduct.quantity || 0}
            </Descriptions.Item>
            <Descriptions.Item label='Đã bán'>
              {currentProduct.selled || 0}
            </Descriptions.Item>
            <Descriptions.Item label='Đánh giá trung bình'>
              {currentProduct.ratings_average || "Chưa có đánh giá"}
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
            <Descriptions.Item label='Phần trăm lợi nhuận'>
              {currentProduct.profit_margin_percent || "0"}%
            </Descriptions.Item>
            <Descriptions.Item label='Giá vốn trung bình'>
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(Number(currentProduct.average_cost_price || 0))}
            </Descriptions.Item>
            <Descriptions.Item label='Giá bán đề xuất'>
              {currentProduct.suggested_price
                ? new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(Number(currentProduct.suggested_price || 0))
                : "Chưa tính"}
            </Descriptions.Item>
            <Descriptions.Item label='Giá nhập mới nhất'>
              {currentProduct.latest_purchase_price
                ? new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(Number(currentProduct.latest_purchase_price || 0))
                : "Chưa có"}
            </Descriptions.Item>
            <Descriptions.Item label='Ngày tạo'>
              {currentProduct.created_at
                ? new Date(currentProduct.created_at).toLocaleString("vi-VN")
                : "Không có"}
            </Descriptions.Item>
            <Descriptions.Item label='Ngày cập nhật'>
              {currentProduct.updated_at
                ? new Date(currentProduct.updated_at).toLocaleString("vi-VN")
                : "Chưa cập nhật"}
            </Descriptions.Item>
            {(currentProduct.symbol || currentProduct.symbol_id) && (
              <Descriptions.Item label='Ký hiệu'>
                {currentProduct.symbol?.name || currentProduct.symbol_id}
              </Descriptions.Item>
            )}
            {currentProduct.ingredient &&
              currentProduct.ingredient.length > 0 && (
                <Descriptions.Item label='Thành phần'>
                  {currentProduct.ingredient.join(", ")}
                </Descriptions.Item>
              )}
            {(currentProduct.unit || currentProduct.unit_id) && (
              <Descriptions.Item label='Đơn vị tính'>
                {typeof currentProduct.unit === 'object' && currentProduct.unit !== null
                  ? currentProduct.unit.name
                  : currentProduct.unit || currentProduct.unit_id}
              </Descriptions.Item>
            )}
            {currentProduct.attributes && (
              <Descriptions.Item label='Thuộc tính'>
                <div className='grid grid-cols-2 gap-2'>
                  {(currentProduct.attributes as Record<string, unknown>)
                    ? Object.entries(
                        currentProduct.attributes as Record<string, unknown>
                      )
                        .filter(([key]) => key !== 'unit') // Lọc bỏ unit khỏi attributes
                        .map(([key, value]) => (
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
                      )
                        .filter(([key]) => key !== 'unit') // Lọc bỏ unit khỏi attributes
                        .map(([key, value]) => (
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
            {currentProduct.videos && currentProduct.videos.length > 0 && (
              <Descriptions.Item label='Videos'>
                <div className='flex flex-wrap gap-2'>
                  {currentProduct.videos.map((video, index) => (
                    <a
                      key={index}
                      href={video}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-blue-500 hover:underline'
                    >
                      Video {index + 1}
                    </a>
                  ))}
                </div>
              </Descriptions.Item>
            )}
            <Descriptions.Item label='Slug'>
              {currentProduct.slug || "Không có"}
            </Descriptions.Item>
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
        confirmLoading={deleteProductMutation.isPending}
      />
    </div>
  )
}

export default ProductsList
