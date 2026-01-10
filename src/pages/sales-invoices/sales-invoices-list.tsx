import * as React from "react"
import { SalesInvoice } from "@/models/sales-invoice"
import {
  useSalesInvoicesQuery,
  useAddPaymentMutation,
} from "@/queries/sales-invoice"
import { useSeasonsQuery } from "@/queries/season"

import {
  Button,
  Tag,
  Space,
  Modal,
  Card,
  Descriptions,
  Input,
  InputNumber,
  Alert,
} from "antd"
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DollarOutlined,
  SearchOutlined,
} from "@ant-design/icons"
import { DatePicker, RangePicker } from '@/components/common'
import dayjs from 'dayjs';
import DataTable from "@/components/common/data-table"
import FilterHeader from "@/components/common/filter-header"
import ComboBox from "@/components/common/combo-box"
import { useNavigate } from "react-router-dom"
import { invoiceStatusLabels, paymentMethodLabels } from "./form-config"
import { TablePaginationConfig, TableProps } from "antd"
import { FilterValue, SorterResult } from "antd/es/table/interface"

// Extend SalesInvoice interface
interface ExtendedSalesInvoice extends SalesInvoice {
  key: string
  [key: string]: any
}

const SalesInvoicesList: React.FC = () => {
  // State quản lý UI
  const [filters, setFilters] = React.useState<Record<string, any>>({})
  const [isDetailModalVisible, setIsDetailModalVisible] =
    React.useState<boolean>(false)
  const [isPaymentModalVisible, setIsPaymentModalVisible] =
    React.useState<boolean>(false)
  const [viewingInvoice, setViewingInvoice] =
    React.useState<SalesInvoice | null>(null)
  const [paymentAmount, setPaymentAmount] = React.useState(0)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  
  // State cho season search
  const [seasonSearchText, setSeasonSearchText] = React.useState('')

  const navigate = useNavigate()

  // Date Filter UI Helper
  const getDateColumnSearchProps = (dataIndex: string): any => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <RangePicker 
            style={{ marginBottom: 8, display: 'flex' }}
            format="DD/MM/YYYY"
            value={
                selectedKeys && selectedKeys[0] 
                ? [dayjs(selectedKeys[0]), dayjs(selectedKeys[1])] 
                : undefined
            }
            onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                    setSelectedKeys([
                        dates[0].startOf('day').toISOString(), 
                        dates[1].endOf('day').toISOString()
                    ])
                } else {
                    setSelectedKeys([])
                }
            }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => confirm({ closeDropdown: false })}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Lọc
          </Button>
          <Button
            onClick={() => {
                if (clearFilters) {
                    clearFilters()
                    confirm()
                }
            }}
            size="small"
            style={{ width: 90 }}
          >
            Xóa
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
  })

  // Handle Table Change
  const handleTableChange: TableProps<ExtendedSalesInvoice>['onChange'] = (
    pagination,
    tableFilters,
    sorter,
    extra
  ) => {
    setCurrentPage(pagination.current || 1)
    setPageSize(pagination.pageSize || 10)
    
    const newFilters = { ...filters }

    // Status filter
    if (tableFilters.status && tableFilters.status.length > 0) {
        newFilters.status = tableFilters.status[0]
    } else {
        delete newFilters.status
    }

    // Rice Crop filter (mapped from rice_crop_id column)
    if (tableFilters.rice_crop_id && tableFilters.rice_crop_id.length > 0) {
        newFilters.rice_crop_filter = tableFilters.rice_crop_id[0]
    } else {
    }

    // Created At Range
    if (tableFilters.created_at && tableFilters.created_at.length === 2) {
      newFilters.start_date = tableFilters.created_at[0]
      newFilters.end_date = tableFilters.created_at[1]
    } else {
      delete newFilters.start_date
      delete newFilters.end_date
    }

    setFilters(newFilters)
  }

  // Handle Filter Change
  const handleFilterChange = (key: string, value: any) => {
      const newFilters = { ...filters, [key]: value }
      if (!value) delete newFilters[key]
      setFilters(newFilters)
      setCurrentPage(1)
  }

  // Queries
  const { data: invoicesData, isLoading } = useSalesInvoicesQuery({
    page: currentPage,
    limit: pageSize,
    ...filters
  })
  const addPaymentMutation = useAddPaymentMutation()
  
  // Load mùa vụ với search
  const { data: seasonsData } = useSeasonsQuery({ 
    page: 1, 
    limit: 20,
    ...(seasonSearchText && { name: seasonSearchText })
  })

  // State to track if we have set the default season
  const [hasSetDefaultSeason, setHasSetDefaultSeason] = React.useState(false)

  // Effect to set default season
  React.useEffect(() => {
    const items = seasonsData?.data?.items;
    if (items && items.length > 0 && !hasSetDefaultSeason) {
      const seasons = items
      const today = dayjs()
      
      // 1. Tìm mùa vụ đang diễn ra (today between start and end)
      let targetSeason = seasons.find((s: any) => {
        if (!s.start_date || !s.end_date) return false
        const start = dayjs(s.start_date)
        const end = dayjs(s.end_date)
        return (today.isAfter(start) || today.isSame(start)) && (today.isBefore(end) || today.isSame(end))
      })

      // 2. Nếu không có, lấy mùa vụ mới nhất (dựa trên end_date sort desc)
      if (!targetSeason) {
        // Copy để không mutate mảng gốc
        const sortedSeasons = [...seasons].sort((a: any, b: any) => {
           const dateA = a.end_date ? new Date(a.end_date).getTime() : 0
           const dateB = b.end_date ? new Date(b.end_date).getTime() : 0
           return dateB - dateA
        })
        targetSeason = sortedSeasons[0]
      }

      if (targetSeason) {
        setFilters((prev) => ({ ...prev, season_id: targetSeason.id }))
      }
      
      setHasSetDefaultSeason(true)
    }
  }, [seasonsData, hasSetDefaultSeason])


  // Handlers
  const handleViewInvoice = async (invoice: SalesInvoice) => {
    try {
      // Gọi API để lấy chi tiết đầy đủ (bao gồm items)
      const response = await fetch(`http://localhost:3003/sales/invoice/${invoice.id}`)
      const result = await response.json()
      
      if (result.success && result.data) {
        setViewingInvoice(result.data)
        setIsDetailModalVisible(true)
      } else {
        // Fallback: dùng data từ list nếu API lỗi
        setViewingInvoice(invoice)
        setIsDetailModalVisible(true)
      }
    } catch (error) {
      console.error('Error fetching invoice details:', error)
      // Fallback: dùng data từ list nếu API lỗi
      setViewingInvoice(invoice)
      setIsDetailModalVisible(true)
    }
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalVisible(false)
    setViewingInvoice(null)
  }

  const handleOpenPaymentModal = (invoice: SalesInvoice) => {
    setViewingInvoice(invoice)
    setPaymentAmount(invoice.remaining_amount)
    setIsPaymentModalVisible(true)
  }

  const handleClosePaymentModal = () => {
    setIsPaymentModalVisible(false)
    setViewingInvoice(null)
    setPaymentAmount(0)
  }

  const handleSubmitPayment = async () => {
    if (!viewingInvoice || paymentAmount <= 0) return

    try {
      await addPaymentMutation.mutateAsync(
        { id: viewingInvoice.id, data: { amount: paymentAmount } },
        {
          onSuccess: () => {
            handleClosePaymentModal()
          },
        }
      )
    } catch (error) {
      console.error("Payment failed:", error)
    }
  }

  // Helpers
  const getInvoiceList = (): ExtendedSalesInvoice[] => {
    if (!invoicesData?.data?.items) return []
    return invoicesData.data.items.map((invoice: SalesInvoice) => ({
      ...invoice,
      key: invoice.id.toString(),
    }))
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value)
  }

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      draft: "default",
      confirmed: "blue",
      paid: "green",
      cancelled: "red",
      refunded: "orange",
    }
    return colorMap[status] || "default"
  }

  const loading = isLoading || addPaymentMutation.isPending

  // Columns
  const columns = [
    {
      key: "code",
      title: (
        <FilterHeader 
            title="Mã HĐ" 
            dataIndex="code" 
            value={filters.code} 
            onChange={(val) => handleFilterChange('code', val)}
            inputType="text"
        />
      ),
      width: 150,
      render: (record: ExtendedSalesInvoice) => (
        <div className='font-medium'>{record.code}</div>
      ),
    },
    {
      key: "customer_name",
      title: (
        <FilterHeader
            title="Khách hàng"
            dataIndex="customer_name"
            value={filters.customer_name}
            onChange={(val) => handleFilterChange('customer_name', val)}
            inputType="text"
        />
      ),
      width: 180,
      render: (record: ExtendedSalesInvoice) => (
        <div className='font-medium'>{record.customer_name}</div>
      ),
    },
    {
      key: "customer_phone",
      title: (
        <FilterHeader 
            title="SĐT" 
            dataIndex="customer_phone" 
            value={filters.customer_phone} 
            onChange={(val) => handleFilterChange('customer_phone', val)}
            inputType="text"
        />
      ),
      width: 130,
      render: (record: ExtendedSalesInvoice) => (
        <div>{record.customer_phone}</div>
      ),
    },
    {
      key: "season_id",
      title: (
        <div className="flex flex-col gap-2 py-1" onClick={(e) => e.stopPropagation()}>
          <div className="font-semibold text-gray-700">Mùa vụ</div>
          <ComboBox
            placeholder="Chọn mùa vụ"
            value={filters.season_id}
            onChange={(val) => handleFilterChange('season_id', val)}
            onSearch={(text) => setSeasonSearchText(text)}
            data={(seasonsData?.data?.items || []).map((season: any) => ({
              value: season.id,
              label: season.name
            }))}
            isLoading={false}
            allowClear
            showSearch
            filterOption={false}
            style={{ width: '100%', minWidth: 120 }}
            size="small"
          />
        </div>
      ),
      width: 180,
      render: (record: ExtendedSalesInvoice) => {
        return <div>{record.season?.name || record.season_name || "-"}</div>
      },
    },
    {
      key: "rice_crop_id",
      title: "Ruộng lúa",
      width: 150,
      filters: [
          { text: "Có liên kết Ruộng lúa", value: "has_crop" },
          { text: "Không liên kết", value: "no_crop" },
      ],
      filteredValue: filters.rice_crop_filter ? [filters.rice_crop_filter] : null,
      filterMultiple: false,
      render: (record: ExtendedSalesInvoice) => {
        const crop = record.rice_crop
        return (
          <div>
            {crop ? (
              <div className="flex flex-col">
                <span className="font-medium">{crop.field_name}</span>
              </div>
            ) : (
              "-"
            )}
          </div>
        )
      },
    },
    {
      key: "final_amount",
      title: "Tổng tiền",
      width: 130,
      render: (record: ExtendedSalesInvoice) => (
        <div className='text-green-600 font-medium'>
          {formatCurrency(record.final_amount)}
        </div>
      ),
    },
    {
      key: "partial_payment_amount",
      title: "Đã trả",
      width: 130,
      render: (record: ExtendedSalesInvoice) => (
        <div className='text-blue-600'>
          {formatCurrency(record.partial_payment_amount)}
        </div>
      ),
    },
    {
      key: "remaining_amount",
      title: "Còn nợ",
      width: 130,
      render: (record: ExtendedSalesInvoice) => {
        const amount = record.remaining_amount
        return (
          <div className={amount > 0 ? "text-red-600 font-medium" : ""}>
            {formatCurrency(amount)}
          </div>
        )
      },
    },
    {
      key: "status",
      title: "Trạng thái",
      width: 130,
      filters: [
          { text: "Nháp", value: "draft" },
          { text: "Đã xác nhận", value: "confirmed" },
          { text: "Đã thanh toán", value: "paid" },
          { text: "Đã hủy", value: "cancelled" },
          { text: "Hoàn tiền", value: "refunded" },
      ],
      filteredValue: filters.status ? [filters.status] : null,
      filterMultiple: false,
      render: (record: ExtendedSalesInvoice) => {
        const status = record.status
        return (
          <Tag color={getStatusColor(status)}>
            {invoiceStatusLabels[status as keyof typeof invoiceStatusLabels] ||
              status}
          </Tag>
        )
      },
    },
    {
      key: "created_at",
      title: "Ngày tạo",
      dataIndex: "created_at",
      width: 120,
      ...getDateColumnSearchProps('created_at'),
      filteredValue: (filters.start_date && filters.end_date) ? [filters.start_date, filters.end_date] : null,
      render: (value: string) => (
        <div>
          {new Date(value).toLocaleDateString("vi-VN")}
        </div>
      ),
    },
    {
      key: "action",
      title: "Thao tác",
      width: 250,
      render: (record: ExtendedSalesInvoice) => (
        <Space size='small'>
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewInvoice(record)}
            size='small'
          >
            Xem
          </Button>
          {record.status === 'draft' && (
            <Button
              icon={<EditOutlined />}
              onClick={() => navigate(`/sales-invoices/edit/${record.id}`)}
              size='small'
            >
              Sửa
            </Button>
          )}
          {record.status !== 'draft' && record.remaining_amount > 0 && (
            <Button
              type='primary'
              icon={<DollarOutlined />}
              onClick={() => handleOpenPaymentModal(record)}
              size='small'
            >
              Trả nợ
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className='p-2 md:p-6'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold'>Quản lý Hóa đơn bán hàng</h1>
        <Button
          type='primary'
          icon={<PlusOutlined />}
          onClick={() => navigate("/sales-invoices/create")}
        >
          Tạo hóa đơn mới
        </Button>
      </div>

      {/* Danh sách hóa đơn */}
      <div className='bg-white rounded shadow'>
        <DataTable
          data={getInvoiceList()}
          columns={columns}
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: invoicesData?.data?.total || 0,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total: number) => `Tổng ${total} hóa đơn`,
          }}
          onChange={handleTableChange}
          showSearch={false}
          showFilters={false}
        />
      </div>

      {/* Detail Modal */}
      <Modal
        title={`Chi tiết hóa đơn: ${viewingInvoice?.code || ""}`}
        open={isDetailModalVisible}
        onCancel={handleCloseDetailModal}
        footer={[
          <Button key='close' onClick={handleCloseDetailModal}>
            Đóng
          </Button>,
        ]}
        width={800}
      >
        {viewingInvoice && (
          <div className='mt-4'>
            <div className='grid grid-cols-2 gap-4 mb-4'>
              <Card>
                <div className='text-gray-500 text-sm'>Khách hàng</div>
                <div className='text-lg font-medium'>
                  {viewingInvoice.customer_name}
                </div>
                <div className='text-gray-600'>
                  {viewingInvoice.customer_phone}
                </div>
                {viewingInvoice.customer_address && (
                  <div className='text-gray-500 text-sm mt-1'>
                    {viewingInvoice.customer_address}
                  </div>
                )}
              </Card>

              <Card>
                <div className='text-gray-500 text-sm'>Thông tin thanh toán</div>
                <div className='mt-2'>
                  <div className='text-sm text-gray-600'>Phương thức:</div>
                  <Tag color='blue'>
                    {
                      paymentMethodLabels[
                        viewingInvoice.payment_method as keyof typeof paymentMethodLabels
                      ]
                    }
                  </Tag>
                </div>
                <div className='mt-2'>
                  <div className='text-sm text-gray-600'>Tổng tiền:</div>
                  <div className='text-lg font-medium text-green-600'>
                    {formatCurrency(viewingInvoice.final_amount)}
                  </div>
                </div>
                <div className='mt-1'>
                  <span className='text-sm text-gray-600'>Đã trả: </span>
                  <span className='text-blue-600'>
                    {formatCurrency(viewingInvoice.partial_payment_amount)}
                  </span>
                </div>
                <div className='mt-1'>
                  <span className='text-sm text-gray-600'>Còn nợ: </span>
                  <span className='text-red-600 font-medium'>
                    {formatCurrency(viewingInvoice.remaining_amount)}
                  </span>
                </div>
              </Card>
            </div>

            {/* Thông tin Ruộng lúa (nếu có) */}
            {(viewingInvoice as any).rice_crop && (
              <Alert
                message="🌾 Hóa đơn này liên kết với Ruộng lúa"
                description={
                  <div className='mt-2'>
                    <div className='font-medium text-base mb-1'>
                      {(viewingInvoice as any).rice_crop.field_name}
                    </div>
                    <div className='text-sm text-gray-600'>
                      <span>Giống lúa: {(viewingInvoice as any).rice_crop.rice_variety}</span>
                      {(viewingInvoice as any).rice_crop.field_area && (
                        <span className='ml-3'>
                          Diện tích: {(viewingInvoice as any).rice_crop.field_area.toLocaleString('vi-VN')} m²
                        </span>
                      )}
                    </div>
                    {(viewingInvoice as any).rice_crop.season && (
                      <div className='text-sm text-gray-600 mt-1'>
                        Mùa vụ: {(viewingInvoice as any).rice_crop.season.name} ({(viewingInvoice as any).rice_crop.season.year})
                      </div>
                    )}
                    <Button
                      type="link"
                      size="small"
                      className='mt-2 p-0'
                      onClick={() => navigate(`/rice-crops/${(viewingInvoice as any).rice_crop_id}`)}
                    >
                      Xem chi tiết Ruộng lúa →
                    </Button>
                  </div>
                }
                type="info"
                showIcon
                className='mb-4'
              />
            )}

            {viewingInvoice.warning && (
              <Alert
                message='⚠️ Lưu ý quan trọng'
                description={viewingInvoice.warning}
                type='error'
                showIcon
                className='mb-4'
              />
            )}

            {viewingInvoice.notes && (
              <div className='mb-4'>
                <div className='text-gray-500 text-sm mb-1'>Ghi chú</div>
                <div>{viewingInvoice.notes}</div>
              </div>
            )}

            <div className='mt-4'>
              <div className='font-medium text-lg mb-3'>Danh sách sản phẩm</div>
              {viewingInvoice.items && viewingInvoice.items.length > 0 ? (
                <Space direction='vertical' className='w-full' size='small'>
                  {viewingInvoice.items.map((item, index) => (
                    <Card key={index} size='small'>
                      <div className='grid grid-cols-4 gap-4'>
                        <div className='col-span-2'>
                          <div className='font-medium'>{item.product?.trade_name || item.product?.name || item.product_name || 'Sản phẩm không xác định'}</div>
                        </div>
                        <div>
                          <div className='text-sm text-gray-500'>
                            SL: {item.quantity}
                          </div>
                          <div className='text-sm text-gray-500'>
                            Giá: {formatCurrency(item.unit_price)}
                          </div>
                        </div>
                        <div>
                          <div className='text-sm text-gray-500'>Thành tiền</div>
                          <div className='font-medium text-green-600'>
                            {formatCurrency(
                              item.quantity * item.unit_price -
                                item.discount_amount
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </Space>
              ) : (
                <div className='text-center text-gray-500 py-4'>
                  Không có sản phẩm
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Modal */}
      <Modal
        title={`Trả nợ hóa đơn: ${viewingInvoice?.code || ""}`}
        open={isPaymentModalVisible}
        onCancel={handleClosePaymentModal}
        footer={[
          <Button key='cancel' onClick={handleClosePaymentModal}>
            Hủy
          </Button>,
          <Button
            key='submit'
            type='primary'
            loading={addPaymentMutation.isPending}
            onClick={handleSubmitPayment}
            disabled={paymentAmount <= 0}
          >
            Xác nhận thanh toán
          </Button>,
        ]}
        width={500}
      >
        {viewingInvoice && (
          <div className='mt-4'>
            <Card className='mb-4 bg-gray-50'>
              <div className='text-gray-500 text-sm'>Số tiền còn nợ</div>
              <div className='text-2xl font-bold text-red-600'>
                {formatCurrency(viewingInvoice.remaining_amount)}
              </div>
            </Card>

            <div>
              <div className='text-sm text-gray-600 mb-2'>Số tiền trả</div>
              <InputNumber
                className='w-full'
                value={paymentAmount}
                onChange={(value) => setPaymentAmount(value || 0)}
                min={0}
                max={viewingInvoice.remaining_amount}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, ""))}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default SalesInvoicesList
