import * as React from "react"
import { useNavigate, useSearchParams, useLocation } from "react-router-dom"

import { Product, ExtendedProduct } from "../../models/product.model"
import { useProductsQuery } from "../../queries/product"
import { useProductTypesQuery } from "@/queries/product-type"
import { ProductType } from "../../models/product-type.model"
import {
  Button,
  Tag,
  Space,
} from "antd"
import { TableProps } from "antd"
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  FilterOutlined,
  HistoryOutlined,
} from "@ant-design/icons"
import DataTable from "../../components/common/data-table"
import { ConfirmModal } from "../../components/common"
import { useDeleteProductMutation } from "@/queries/product"
import FilterHeader from "@/components/common/filter-header"
import BatchExpiryModal from "./components/batch-expiry-modal"
import ProductDetailModal from "./components/product-detail-modal"


const ProductsList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()

  // Lấy các giá trị từ URL, nếu không có thì dùng mặc định
  const currentPage = Number(searchParams.get("page")) || 1
  const pageSize = Number(searchParams.get("pageSize")) || 10

  // Chuyển đổi searchParams thành filters object
  const filters = React.useMemo(() => {
    const f: Record<string, any> = {}
    searchParams.forEach((value, key) => {
      if (key !== "page" && key !== "pageSize") {
        f[key] = value
      }
    })
    return f
  }, [searchParams])

  // Hàm cập nhật URL search params
  const updateUrlParams = React.useCallback((newParams: Record<string, any>, resetPage = false) => {
    const params = new URLSearchParams(searchParams)
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })

    if (resetPage) {
      params.set("page", "1")
    }

    setSearchParams(params)
  }, [searchParams, setSearchParams])

  // State modals
  const [isViewModalVisible, setIsViewModalVisible] = React.useState<boolean>(false)
  const [deleteConfirmVisible, setDeleteConfirmVisible] = React.useState<boolean>(false)
  const [isExpiryModalVisible, setIsExpiryModalVisible] = React.useState<boolean>(false)
  const [deletingProduct, setDeletingProduct] = React.useState<Product | null>(null)
  const [currentProduct, setCurrentProduct] = React.useState<Product | null>(null)

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

  const handleEditProduct = React.useCallback((product: Product) => {
    if (!product) return
    // Lưu lại search hiện tại để quay lại đúng trang
    navigate(`/products/edit/${product.id}${location.search}`)
  }, [navigate, location.search])

  const { data: productTypesData, isLoading: isLoadingTypes } = useProductTypesQuery()
  const productTypes: ProductType[] = productTypesData?.data?.items || []

  // Xóa bộ lọc
  const handleClearFilters = () => {
      setSearchParams({})
  }

  // Update Filter trực tiếp từ Header Input
  const handleFilterChange = React.useCallback((key: string, value: any) => {
      updateUrlParams({ [key]: value }, true)
  }, [updateUrlParams])

  // Xử lý xóa sản phẩm - cập nhật để set state cho modal
  const handleDelete = React.useCallback((product: Product) => {
    // Set state để hiển thị modal xác nhận
    setDeletingProduct(product)
    setDeleteConfirmVisible(true)
  }, [])

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
  ) => {
    const newParams: Record<string, any> = {
      page: pagination.current,
      pageSize: pagination.pageSize
    }

    // 2. Native Filters (Category, Status)
    if (tableFilters.category) {
       newParams.type_id = (tableFilters.category as string[])[0]
    } else {
       newParams.type_id = ""
    }

    if (tableFilters.status) {
       newParams.status = (tableFilters.status as string[])[0]
    } else {
       newParams.status = ""
    }

    // 3. Sorter
    if (sorter && sorter.order) {
        newParams.sort_by = sorter.field
        newParams.sort_direction = sorter.order === 'ascend' ? 'ASC' : 'DESC'
    } else {
        newParams.sort_by = ""
        newParams.sort_direction = ""
    }

    updateUrlParams(newParams)
  }

  // Cấu hình columns cho DataTable
  const columns = React.useMemo(() => [
    {
      key: "trade_name",
      title: (
        <FilterHeader 
            title="Tên thương mại" 
            dataIndex="trade_name" 
            value={filters.trade_name} 
            onChange={(val) => handleFilterChange('trade_name', val)}
            inputType="text"
        />
      ),
      width: 150,
      fixed: 'left' as const, // Cố định cột bên trái
      render: (_: unknown, record: ExtendedProduct) => (
        <div className='font-medium text-gray-900 whitespace-normal break-words'>{record.trade_name || '---'}</div>
      ),
    },
    {
      key: "unit",
      title: "Đơn vị",
      width: 100,
      render: (_: unknown, record: ExtendedProduct) => {
          const unitName = record.unit_name || (typeof record.unit === 'object' && record.unit ? record.unit.name : '---');
          return <div className='text-gray-600'>{unitName}</div>
      },
    },
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
      width: 180,
      render: (_: unknown, record: ExtendedProduct) => (
        <div className='font-medium text-gray-700 whitespace-normal break-words'>{record.name}</div>
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
                ? record.type.name 
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
      key: "has_input_invoice",
      title: "Hóa đơn",
      width: 120,
      render: (record: ExtendedProduct) => (
        <Tag color={record.has_input_invoice ? "blue" : "default"}>
          {record.has_input_invoice ? "Có hóa đơn" : "Không hóa đơn"}
        </Tag>
      ),
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
            icon={<HistoryOutlined />}
            size="small"
            onClick={() => {
              setCurrentProduct(record)
              setIsExpiryModalVisible(true)
            }}
            title='Lô hàng & Hạn dùng'
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
  ], [filters, productTypes, handleEditProduct, handleFilterChange, handleDelete])

  return (
    <div className='p-2 md:p-6'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6'>
        <h1 className='text-2xl font-bold'>Danh sách sản phẩm</h1>
        <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
            {Object.keys(filters).length > 0 && (
                <Button 
                    onClick={handleClearFilters}
                    icon={<FilterOutlined />}
                    danger
                    className="w-full sm:w-auto"
                >
                    Xóa bộ lọc
                </Button>
            )}
            <Button
            type='primary'
            icon={<PlusOutlined />}
            onClick={() => navigate("/products/new")}
            className="w-full sm:w-auto"
            >
            Thêm sản phẩm
            </Button>
        </div>
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
      <ProductDetailModal
        visible={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        product={currentProduct}
      />

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

      {/* Modal xem thông tin lô hàng & hạn dùng */}
      <BatchExpiryModal 
        product={currentProduct}
        visible={isExpiryModalVisible}
        onCancel={() => {
            setIsExpiryModalVisible(false)
            setCurrentProduct(null)
        }}
      />
    </div>
  )
}

export default ProductsList
