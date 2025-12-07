import * as React from "react"
import { SalesInvoice } from "@/models/sales-invoice"
import {
  useSalesInvoicesQuery,
  useAddPaymentMutation,
} from "@/queries/sales-invoice"
import {
  Button,
  Tag,
  Space,
  Select,
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
  DollarOutlined,
  SearchOutlined,
} from "@ant-design/icons"
import DataTable from "@/components/common/data-table"
import { useNavigate } from "react-router-dom"
import { invoiceStatusLabels, paymentMethodLabels } from "./form-config"

// Extend SalesInvoice interface
interface ExtendedSalesInvoice extends SalesInvoice {
  key: string
  [key: string]: any
}

const SalesInvoicesList: React.FC = () => {
  // State quản lý UI
  const [searchTerm, setSearchTerm] = React.useState<string>("")
  const [statusFilter, setStatusFilter] = React.useState<string>("")
  const [riceCropFilter, setRiceCropFilter] = React.useState<string>("")
  const [isDetailModalVisible, setIsDetailModalVisible] =
    React.useState<boolean>(false)
  const [isPaymentModalVisible, setIsPaymentModalVisible] =
    React.useState<boolean>(false)
  const [viewingInvoice, setViewingInvoice] =
    React.useState<SalesInvoice | null>(null)
  const [paymentAmount, setPaymentAmount] = React.useState(0)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  const navigate = useNavigate()

  // Queries
  const { data: invoicesData, isLoading } = useSalesInvoicesQuery({
    page: currentPage,
    limit: pageSize,
    status: statusFilter || undefined,
    rice_crop_filter: riceCropFilter || undefined,
  })

  const addPaymentMutation = useAddPaymentMutation()

  // Handlers
  const handleViewInvoice = (invoice: SalesInvoice) => {
    setViewingInvoice(invoice)
    setIsDetailModalVisible(true)
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
      title: "Mã HĐ",
      width: 120,
      render: (record: ExtendedSalesInvoice) => (
        <div className='font-medium'>{record.code}</div>
      ),
    },
    {
      key: "customer_name",
      title: "Khách hàng",
      width: 180,
      render: (record: ExtendedSalesInvoice) => (
        <div className='font-medium'>{record.customer_name}</div>
      ),
    },
    {
      key: "customer_phone",
      title: "SĐT",
      width: 120,
      render: (record: ExtendedSalesInvoice) => (
        <div>{record.customer_phone}</div>
      ),
    },
    {
      key: "season_name",
      title: "Mùa vụ",
      width: 120,
      render: (record: ExtendedSalesInvoice) => (
        <div>{record.season_name || "-"}</div>
      ),
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
      width: 120,
      render: (record: ExtendedSalesInvoice) => (
        <div>
          {new Date(record.created_at).toLocaleDateString("vi-VN")}
        </div>
      ),
    },
    {
      key: "action",
      title: "Thao tác",
      width: 200,
      render: (record: ExtendedSalesInvoice) => (
        <Space size='small'>
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewInvoice(record)}
            size='small'
          >
            Xem
          </Button>
          {record.remaining_amount > 0 && (
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
    <div className='p-6'>
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

      {/* Filters */}
      <div className='grid grid-cols-3 gap-4 mb-6'>
        <Input
          placeholder='Tìm kiếm theo mã HĐ, tên khách hàng, SĐT...'
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select
          placeholder='Lọc theo trạng thái'
          value={statusFilter || undefined}
          onChange={(value) => setStatusFilter(value || "")}
          allowClear
        >
          <Select.Option value=''>Tất cả</Select.Option>
          <Select.Option value='draft'>Nháp</Select.Option>
          <Select.Option value='confirmed'>Đã xác nhận</Select.Option>
          <Select.Option value='paid'>Đã thanh toán</Select.Option>
          <Select.Option value='cancelled'>Đã hủy</Select.Option>
        </Select>
        <Select
          placeholder='Lọc theo vụ lúa'
          value={riceCropFilter || undefined}
          onChange={(value) => setRiceCropFilter(value || "")}
          allowClear
        >
          <Select.Option value=''>Tất cả</Select.Option>
          <Select.Option value='has_crop'>Có liên kết vụ lúa</Select.Option>
          <Select.Option value='no_crop'>Không liên kết</Select.Option>
        </Select>
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
            onChange: (page: number, size: number) => {
              setCurrentPage(page)
              setPageSize(size)
            },
          }}
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

            {/* Thông tin Vụ lúa (nếu có) */}
            {(viewingInvoice as any).rice_crop && (
              <Alert
                message="🌾 Hóa đơn này liên kết với vụ lúa"
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
                      Xem chi tiết vụ lúa →
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
                          <div className='font-medium'>{item.product_name}</div>
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
