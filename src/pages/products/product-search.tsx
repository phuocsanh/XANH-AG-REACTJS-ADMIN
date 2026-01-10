import * as React from "react"
import { Product, ExtendedProduct } from "../../models/product.model"
import { useProductsQuery } from "../../queries/product"
import {
  Tag,
  Input,
  Card,
  Typography,
} from "antd"
import { SearchOutlined } from "@ant-design/icons"
import DataTable from "../../components/common/data-table"
import ProductDetailModal from "./components/product-detail-modal"

const { Title } = Typography

/**
 * Trang tìm kiếm sản phẩm chuyên dụng
 * Cho phép tìm kiếm theo tên, tên thương mại và ghi chú
 * Hiển thị cột ghi chú cho từng sản phẩm
 */
const ProductSearch: React.FC = () => {
  // State quản lý tìm kiếm và phân trang
  const [searchTerm, setSearchTerm] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  
  // State cho Modal chi tiết
  const [isDetailModalVisible, setIsDetailModalVisible] = React.useState(false)
  const [selectedProduct, setSelectedProduct] = React.useState<ExtendedProduct | null>(null)

  // Build Params cho Query - Sử dụng query 'keyword' để tìm kiếm tổng quát
  const queryParams = React.useMemo(() => ({
      page: currentPage,
      limit: pageSize,
      keyword: searchTerm,
      status: 'active' // Chỉ tìm sản phẩm đang bán
  }), [currentPage, pageSize, searchTerm])

  // Sử dụng Server-side Query
  const { data: productsData, isLoading } = useProductsQuery(queryParams)
  
  const products = productsData?.data?.items || [] 
  const totalProducts = productsData?.data?.total || 0

  // Hàm mở modal chi tiết
  const handleViewDetail = (product: ExtendedProduct) => {
    setSelectedProduct(product)
    setIsDetailModalVisible(true)
  }

  // Cấu hình columns cho DataTable
  const columns = [
    {
      key: "name",
      title: "Tên sản phẩm",
      width: 250,
      render: (_: unknown, record: ExtendedProduct) => (
        <div className='font-bold text-emerald-700'>{record.name}</div>
      ),
    },
    {
      key: "trade_name",
      title: "Tên thương mại",
      width: 200,
      render: (_: unknown, record: ExtendedProduct) => (
        <div className='font-medium text-blue-600'>{record.trade_name || '---'}</div>
      ),
    },
    {
      key: "notes",
      title: "Ghi chú",
      width: 350,
      render: (_: unknown, record: ExtendedProduct) => (
        <div 
          className='text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 italic'
          style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
        >
          {record.notes || <span className="text-gray-300">Không có ghi chú</span>}
        </div>
      ),
    },
    {
      key: "price",
      title: "Giá tiền mặt",
      width: 140,
      render: (value: string, record: ExtendedProduct) => (
        <div className='font-bold text-orange-600'>
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(Number(record.price || 0))}
        </div>
      ),
    },
    {
      key: "credit_price",
      title: "Giá nợ",
      width: 140,
      render: (value: string, record: ExtendedProduct) => (
        <div className='font-bold text-red-600'>
          {record.credit_price ? new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(Number(record.credit_price)) : "---"}
        </div>
      ),
    },
    {
      key: "quantity",
      title: "Tồn kho",
      width: 90,
      align: 'center' as const,
      render: (value: number, record: ExtendedProduct) => (
        <Tag color={(record.quantity || 0) > 0 ? 'green' : 'red'}>
            {record.quantity || 0}
        </Tag>
      ),
    },
  ]

  return (
    <div className='p-4 md:p-8 bg-gray-50 min-h-screen'>
      <Card className="shadow-lg border-emerald-100 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Title level={2} className="!mb-0 !text-emerald-800">Tìm sản phẩm</Title>
            <Typography.Text type="secondary">Tìm nhanh theo tên sản phẩm, tên thương mại hoặc ghi chú kỹ thuật</Typography.Text>
          </div>
          <div className="w-full md:w-96">
            <Input
              prefix={<SearchOutlined className="text-emerald-500" />}
              placeholder="Nhập tên, hiệu thuốc hoặc ghi chú..."
              size="large"
              allowClear
              className="rounded-full border-emerald-200"
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              autoFocus
            />
          </div>
        </div>
      </Card>

      <div className='bg-white rounded-xl shadow-md overflow-hidden border border-gray-100'>
        <DataTable
          data={products as ExtendedProduct[]}
          columns={columns}
          loading={isLoading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalProducts,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (total: number) => `Tìm thấy ${total} sản phẩm`,
          }}
          onChange={(pagination) => {
            if (pagination.current && pagination.pageSize) {
              setCurrentPage(pagination.current)
              setPageSize(pagination.pageSize)
            }
          }}
          onRow={(record) => ({
            onClick: () => handleViewDetail(record as ExtendedProduct),
            className: 'cursor-pointer hover:bg-emerald-50 transition-colors'
          })}
          searchableColumns={[]}
          showSearch={false}
          showFilters={false}
          showActions={false}
        />
      </div>

      <ProductDetailModal 
        visible={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        product={selectedProduct}
      />
    </div>
  )
}

export default ProductSearch
