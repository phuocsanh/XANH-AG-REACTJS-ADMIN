import * as React from "react"
import { Payment, PaymentAllocation } from "@/models/payment"
import {
  usePaymentsQuery,
  usePaymentAllocationsQuery,
  useRollbackPaymentMutation,
} from "@/queries/payment"
import {
  Button,
  Tag,
  Space,
  Modal,
  List,
  Descriptions,
  Divider,
  Input,
  DatePicker,
} from "antd"
import type { TableProps } from "antd"
import dayjs from "dayjs"
import {
  EyeOutlined,
  DollarOutlined,
  RollbackOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  FilterOutlined,
} from "@ant-design/icons"
import DataTable from "@/components/common/data-table"
import FilterHeader from "@/components/common/filter-header"
import { paymentMethodLabels } from "./form-config"
import { SettleDebtModal } from "./components/settle-debt-modal"

// Extend Payment interface
interface ExtendedPayment extends Payment {
  key: string
  [key: string]: any
}

const PaymentsList: React.FC = () => {
  // State quản lý UI
  const [isSettleModalVisible, setIsSettleModalVisible] =
    React.useState<boolean>(false)
  const [isDetailModalVisible, setIsDetailModalVisible] =
    React.useState<boolean>(false)
  const [isConfirmRollbackVisible, setIsConfirmRollbackVisible] =
    React.useState<boolean>(false)
  const [viewingPayment, setViewingPayment] = React.useState<Payment | null>(
    null
  )
  const [rollbackingPayment, setRollbackingPayment] = React.useState<Payment | null>(null)

  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [filters, setFilters] = React.useState<Record<string, any>>({})
  // State để track payment đang được rollback
  const [rollingBackPaymentId, setRollingBackPaymentId] = React.useState<number | null>(null)

  // Queries
  const { data: paymentsData, isLoading } = usePaymentsQuery({
    page: currentPage,
    limit: pageSize,
    ...filters,
  })

  // Tìm kiếm khách hàng (đã bỏ search cho simple modal)
  
  const { data: allocations } = usePaymentAllocationsQuery(
    viewingPayment?.id || 0
  )

  // Mutation rollback với callback để reset loading state
  const rollbackMutation = useRollbackPaymentMutation()

  // Handlers
  const handleOpenSettleModal = () => {
    setIsSettleModalVisible(true)
  }

  const handleCloseSettleModal = () => {
    setIsSettleModalVisible(false)
  }

  const handleViewPayment = (payment: Payment) => {
    setViewingPayment(payment)
    setIsDetailModalVisible(true)
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalVisible(false)
    setViewingPayment(null)
  }

  // Handler rollback payment
  const handleRollback = (payment: Payment) => {
    console.log('🔄 handleRollback được gọi với payment:', payment)
    setRollbackingPayment(payment)
    setIsConfirmRollbackVisible(true)
  }

  // Handler xác nhận rollback
  const handleConfirmRollback = () => {
    if (!rollbackingPayment) return
    
    console.log('✅ User xác nhận rollback payment ID:', rollbackingPayment.id)
    
    // Set state để track payment đang được rollback
    setRollingBackPaymentId(rollbackingPayment.id)
    
    console.log('🚀 Gọi rollbackMutation.mutate với ID:', rollbackingPayment.id)
    rollbackMutation.mutate(rollbackingPayment.id, {
      onSettled: () => {
        console.log('✅ Mutation settled, reset rollingBackPaymentId')
        // Reset state sau khi hoàn tất (thành công hoặc lỗi)
        setRollingBackPaymentId(null)
      }
    })
    
    // Đóng modal
    setIsConfirmRollbackVisible(false)
    setRollbackingPayment(null)
  }

  // Handler hủy rollback
  const handleCancelRollback = () => {
    console.log('❌ User hủy rollback')
    setIsConfirmRollbackVisible(false)
    setRollbackingPayment(null)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value)
  }

  const getPaymentList = (): ExtendedPayment[] => {
    if (!paymentsData?.data?.items) return []
    return paymentsData.data.items.map((payment: Payment) => ({
      ...payment,
      key: payment.id.toString(),
    }))
  }

  // Handle Table Change (Pagination, Filters, Sorter)
  const handleTableChange: TableProps<ExtendedPayment>['onChange'] = (
    pagination,
    tableFilters, 
    sorter: any
  ) => {
    // Xử lý Pagination
    setCurrentPage(pagination.current || 1)
    setPageSize(pagination.pageSize || 10)

    // Bắt đầu bằng filters hiện tại để giữ các filter custom (Code, Customer...)
    const newParams: Record<string, any> = { ...filters }
    
    // 1. Cập nhật Native Table Filters (Payment Method)
    if (tableFilters.payment_method?.[0]) {
        newParams.payment_method = tableFilters.payment_method[0]
    } else {
        delete newParams.payment_method
    }

    // 2. Date Range (payment_date)
    if (tableFilters.payment_date && tableFilters.payment_date.length === 2) {
      newParams.start_date = tableFilters.payment_date[0]
      newParams.end_date = tableFilters.payment_date[1]
    } else {
        delete newParams.start_date
        delete newParams.end_date
    }
    
    // Lưu ý: Các field 'code', 'debt_note_code', 'customer_term' được quản lý bởi handleFilterChange trực tiếp,
    // không thông qua tableFilters, nên chúng sẽ được giữ nguyên trong newParams.

    // 3. Sorter (amount)
    const sortItem = Array.isArray(sorter) ? sorter[0] : sorter;
    if (sortItem && sortItem.field === 'amount' && sortItem.order) {
        newParams.sort_by = 'amount'
        newParams.sort_direction = sortItem.order === 'ascend' ? 'ASC' : 'DESC'
    } else {
        delete newParams.sort_by
        delete newParams.sort_direction
    }

    // Cập nhật state filters -> trigger usePaymentsQuery
    setFilters(newParams)
  }

  // Filter UI helper
  const getColumnSearchProps = (dataIndex: string, placeholder: string): any => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          placeholder={`Tìm ${placeholder}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => confirm({ closeDropdown: false })} // Giữ dropdown mở sau khi tìm
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Tìm
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

  // Date Filter UI Helper
  const getDateColumnSearchProps = (dataIndex: string): any => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <DatePicker.RangePicker 
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
            onClick={() => confirm({ closeDropdown: false })} // Giữ dropdown để user thấy kết quả
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

  const loading = isLoading

  const handleClearAllFilters = () => {
      setFilters({})
      setCurrentPage(1)
  }


  // Handler update filter trực tiếp (Controlled mode)
  const handleFilterChange = (key: string, value: any) => {
      const newFilters = { ...filters, [key]: value };
      if (!value) delete newFilters[key]; // Xóa key nếu value rỗng
      
      setFilters(newFilters);
      //setCurrentPage(1); // Optional: Reset về trang 1 khi filter
  }

  // Columns
  const columns = React.useMemo(() => [
    {
      key: "code",
      title: (
        <FilterHeader 
            title="Mã PT" 
            dataIndex="code" 
            value={filters.code} 
            onChange={(val) => handleFilterChange('code', val)}
        />
      ),
      width: 150,
      render: (record: ExtendedPayment) => (
        <div className='font-medium'>{record.code}</div>
      ),
    },
    {
      key: "debt_note_code",
      title: (
        <FilterHeader 
            title="Mã Phiếu Nợ" 
            dataIndex="debt_note_code" 
            value={filters.debt_note_code} 
            onChange={(val) => handleFilterChange('debt_note_code', val)}
        />
      ),
      width: 160,
      render: (record: ExtendedPayment) => (
        <div className='text-gray-500'>
            {record.debt_note_code ? (
                <Tag color="cyan">{record.debt_note_code}</Tag>
            ) : "-"}
        </div>
      ),
    },
    {
      key: "customer_name",
      title: (
        <FilterHeader 
            title="Khách hàng" 
            dataIndex="customer_term" 
            value={filters.customer_term} 
            onChange={(val) => handleFilterChange('customer_term', val)}
        />
      ),
      width: 200,
      render: (record: ExtendedPayment) => (
        <div className='font-medium'>
          {record.customer?.name || record.customer_name || "-"}
        </div>
      ),
    },
    {
      key: "amount",
      dataIndex: "amount", // Important for Sorter
      title: "Số tiền",
      width: 150,
      sorter: true,
      sortOrder: filters.sort_by === 'amount' ? (filters.sort_direction === 'ASC' ? 'ascend' : 'descend') : null,
      render: (value: number) => ( // Value is now passed directly due to dataIndex
        <div className='text-green-600 font-bold'>
          {formatCurrency(value)}
        </div>
      ),
    },
    {
      key: "allocated_amount",
      title: "Đã phân bổ",
      width: 150,
      render: (record: ExtendedPayment) => (
        <div className='text-blue-600'>
          {formatCurrency(record.allocated_amount)}
        </div>
      ),
    },
    {
      key: "payment_method",
      title: "Phương thức",
      width: 140,
      filters: Object.entries(paymentMethodLabels).map(([value, text]) => ({ text, value })),
      filteredValue: filters.payment_method ? [filters.payment_method] : null,
      filterMultiple: false,
      render: (record: ExtendedPayment) => (
        <Tag color='blue'>
          {paymentMethodLabels[
            record.payment_method as keyof typeof paymentMethodLabels
          ] || record.payment_method}
        </Tag>
      ),
    },
    {
      key: "payment_date",
      title: "Ngày thu",
      width: 130,
      ...getDateColumnSearchProps('payment_date'),
      filteredValue: (filters.start_date && filters.end_date) ? [filters.start_date, filters.end_date] : null,
      render: (record: ExtendedPayment) => (
        <div>
          {new Date(record.payment_date).toLocaleDateString("vi-VN")}
        </div>
      ),
    },
    {
      key: "action",
      title: "Hành động",
      width: 150,
      render: (record: ExtendedPayment) => (
        <Space size="small">
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewPayment(record)}
            size='small'
          >
            Xem
          </Button>
          <Button
            icon={<RollbackOutlined />}
            onClick={() => handleRollback(record)}
            size='small'
            danger
            loading={rollingBackPaymentId === record.id}
          >
            Hoàn tác
          </Button>
        </Space>
      ),
    },
  ], [filters, paymentsData]) // Dependencies for useMemo

  return (
    <div className='p-2 md:p-6'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold'>Quản lý Thanh toán</h1>
        <Space>
          {Object.keys(filters).length > 0 && (
            <Button 
                onClick={handleClearAllFilters}
                icon={<FilterOutlined />}
                danger
            >
                Xóa bộ lọc
            </Button>
          )}

        </Space>
      </div>

      <div className='bg-white rounded shadow'>
        <DataTable
          data={getPaymentList()}
          columns={columns}
          loading={loading}
          onChange={handleTableChange}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: paymentsData?.data?.total || 0,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total: number) => `Tổng ${total} phiếu thu`,
            onChange: (page: number, size: number) => {
              setCurrentPage(page)
              setPageSize(size)
            },
          }}
        />
      </div>

      {/* Settle Payment Modal - API Mới: settle-debt */}
      <SettleDebtModal 
        open={isSettleModalVisible}
        onCancel={handleCloseSettleModal}
      />

      {/* Payment Detail Modal */}
      <Modal
        title={`Chi tiết phiếu thu: ${viewingPayment?.code || ""}`}
        open={isDetailModalVisible}
        onCancel={handleCloseDetailModal}
        footer={[
          <Button key='close' onClick={handleCloseDetailModal}>
            Đóng
          </Button>,
        ]}
        width={600}
      >
        {viewingPayment && (
          <div className='mt-4'>
            <Descriptions bordered column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label='Mã PT'>
                <span className='font-bold'>{viewingPayment.code}</span>
              </Descriptions.Item>
              <Descriptions.Item label='Mã Phiếu Nợ'>
                {viewingPayment.debt_note_code ? (
                   <Tag color="cyan">{viewingPayment.debt_note_code}</Tag>
                ) : "-"}
              </Descriptions.Item>
              <Descriptions.Item label='Khách hàng' span={2}>
                {viewingPayment.customer?.name || viewingPayment.customer_name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label='Số tiền'>
                <span className='text-green-600 font-bold'>
                  {formatCurrency(viewingPayment.amount)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label='Đã phân bổ'>
                <span className='text-blue-600 font-bold'>
                  {formatCurrency(viewingPayment.allocated_amount)}
                </span>
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <div className='font-medium mb-2'>Chi tiết phân bổ</div>
            {allocations && allocations.length > 0 ? (
              <List
                bordered
                dataSource={allocations}
                renderItem={(allocation: PaymentAllocation) => (
                  <List.Item>
                    <div className='flex flex-col sm:flex-row sm:justify-between w-full gap-1'>
                      <span>
                        {allocation.allocation_type === "invoice"
                          ? `Hóa đơn: ${allocation.invoice?.code || 'N/A'}`
                          : `Phiếu nợ: ${allocation.debt_note?.code || 'N/A'}`}
                      </span>
                      <span className='font-medium'>
                        {formatCurrency(allocation.amount)}
                      </span>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <div className='text-center text-gray-500 py-4'>
                Chưa có phân bổ
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Confirm Rollback Modal */}
      <Modal
        title="⚠️ Xác nhận hoàn tác thanh toán"
        open={isConfirmRollbackVisible}
        onOk={handleConfirmRollback}
        onCancel={handleCancelRollback}
        okText="Xác nhận hoàn tác"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        {rollbackingPayment && (
          <div>
            <p>Bạn sắp hoàn tác thanh toán:</p>
            <ul style={{ marginTop: 12, paddingLeft: 20 }}>
              <li><strong>Mã:</strong> {rollbackingPayment.code}</li>
              <li><strong>Số tiền:</strong> {formatCurrency(rollbackingPayment.amount)}</li>
              <li><strong>Khách hàng:</strong> {rollbackingPayment.customer?.name || rollbackingPayment.customer_name}</li>
            </ul>
            <p style={{ marginTop: 12, color: '#ff4d4f' }}>
              <strong>Hành động này sẽ:</strong>
            </p>
            <ul style={{ paddingLeft: 20 }}>
              <li>✓ Xóa payment và allocations</li>
              <li>✓ Hoàn trả tiền vào công nợ</li>
              <li>✓ Cập nhật lại trạng thái invoices</li>
            </ul>
            <p style={{ marginTop: 12 }}>
              Bạn có chắc chắn muốn tiếp tục?
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default PaymentsList
