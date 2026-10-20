import * as React from "react"
import { Payment, PaymentAllocation, PaymentRollbackHistoryItem } from "@/models/payment"
import {
  usePaymentsQuery,
  usePaymentAllocationsQuery,
  useRollbackPaymentMutation,
  useRollbackPreviewQuery,
  usePaymentRollbackHistoryQuery,
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
  Alert,
  Table,
  Tooltip,
} from "antd"
import type { TableProps } from "antd"
import dayjs from "dayjs"
import { toast } from "react-toastify"
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
import PaymentRollbackPreviewPanel from "@/components/common/payment-rollback-preview"
import { useAppStore } from "@/stores"
import { isSuperAdmin } from "@/utils/permission"

// Extend Payment interface
interface ExtendedPayment extends Payment {
  key: string
  [key: string]: any
}

/** Nhãn tiếng Việt cho loại phiếu thu đã bị hoàn tác */
const rollbackKindLabels: Record<string, string> = {
  invoice: "Thu công nợ hóa đơn",
  loan: "Trả vay",
  unallocated: "Chưa phân bổ",
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
  // Lý do hoàn tác là bắt buộc để lưu vết đối soát
  const [rollbackReason, setRollbackReason] = React.useState<string>("")
  // Modal lịch sử hoàn tác
  const [isHistoryVisible, setIsHistoryVisible] = React.useState<boolean>(false)
  const [historyPage, setHistoryPage] = React.useState<number>(1)

  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [filters, setFilters] = React.useState<Record<string, any>>({})
  // State để track payment đang được rollback
  const [rollingBackPaymentId, setRollingBackPaymentId] = React.useState<number | null>(null)
  // Chỉ Super Admin được hoàn tác phiếu thu (khớp kiểm tra phía backend)
  const userInfo = useAppStore((state) => state.userInfo)
  const allowRollbackPayment = isSuperAdmin(userInfo)

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

  // Xem trước ảnh hưởng hoàn tác: hóa đơn/công nợ/tích lũy sẽ đổi và lý do bị chặn
  const {
    data: rollbackPreview, isFetching: isPreviewLoading, isError: isPreviewError,
    isSuccess: isPreviewSuccess, refetch: refetchRollbackPreview,
  } = useRollbackPreviewQuery(
    // Chỉ gọi bản xem trước khi người dùng có quyền hoàn tác
    allowRollbackPayment ? (rollbackingPayment?.id ?? null) : null
  )

  // Lịch sử hoàn tác phục vụ đối soát (chỉ tải khi mở modal)
  const { data: rollbackHistory, isFetching: isHistoryLoading } = usePaymentRollbackHistoryQuery(
    {
      page: historyPage,
      limit: 10,
    },
    isHistoryVisible
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

  // Mở modal hoàn tác: xóa lý do cũ để tránh gửi nhầm (chỉ Super Admin)
  const handleRollback = (payment: Payment) => {
    if (!allowRollbackPayment) {
      toast.error("Chỉ Super Admin mới được hoàn tác phiếu thu")
      return
    }
    setRollbackReason("")
    setRollbackingPayment(payment)
    setIsConfirmRollbackVisible(true)
  }

  // Xác nhận hoàn tác: bắt buộc lý do và chỉ gửi khi backend cho phép
  const handleConfirmRollback = () => {
    if (!rollbackingPayment || rollbackMutation.isPending) return
    const reason = rollbackReason.trim()
    if (!reason) {
      toast.warning("Vui lòng nhập lý do hoàn tác")
      return
    }
    if (!isPreviewSuccess || isPreviewLoading || isPreviewError ||
      rollbackPreview?.payment_id !== rollbackingPayment.id || !rollbackPreview?.preview_token) {
      toast.warning("Vui lòng tải lại bản xem trước trước khi xác nhận")
      return
    }
    if (!rollbackPreview.can_rollback) {
      toast.error(rollbackPreview.blockers[0]?.message || "Phiếu thu không thể hoàn tác")
      return
    }

    setRollingBackPaymentId(rollbackingPayment.id)
    rollbackMutation.mutate(
      { id: rollbackingPayment.id, reason, preview_token: rollbackPreview.preview_token },
      {
        onSuccess: () => {
          setIsConfirmRollbackVisible(false)
          setRollbackingPayment(null)
          setRollbackReason("")
        },
        onError: () => { void refetchRollbackPreview() },
        onSettled: () => setRollingBackPaymentId(null),
      }
    )

  }

  // Hủy hoàn tác
  const handleCancelRollback = () => {
    if (rollbackMutation.isPending) return
    setIsConfirmRollbackVisible(false)
    setRollbackingPayment(null)
    setRollbackReason("")
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
            onChange={(dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
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
      key: "payment_type",
      title: "Loại thu",
      width: 140,
      render: (record: ExtendedPayment) => {
        const isLoan = String(record.debt_note_code || "").startsWith("LN-");
        const isDebt = !!record.debt_note_code;
        return (
          <Tag 
            color={isLoan ? "purple" : isDebt ? "processing" : "success"}
            className="font-medium px-2 py-0.5"
          >
            {isLoan ? "Thu vay" : isDebt ? "Thu nợ lẻ" : "Hóa đơn bán lẻ"}
          </Tag>
        );
      }
    },
    {
      key: "debt_note_code",
      title: (
        <FilterHeader 
            title="Mã liên quan" 
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
      // Ghim cột thao tác bên phải để nút Hoàn tác luôn trong khung nhìn khi bảng rộng
      fixed: "right" as const,
      render: (record: ExtendedPayment) => (
        <Space size="small">
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewPayment(record)}
            size='small'
          >
            Xem
          </Button>
          {/* Chỉ Super Admin thấy nút hoàn tác phiếu thu */}
          {allowRollbackPayment && (
            <Tooltip
              title={
                record.can_rollback === false
                  ? (record.rollback_block_reason || "Không thể hoàn tác phiếu thu này")
                  : ""
              }
            >
              <Button
                icon={<RollbackOutlined />}
                onClick={() => handleRollback(record)}
                size='small'
                danger
                disabled={record.can_rollback === false}
                loading={rollingBackPaymentId === record.id}
              >
                Hoàn tác
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ], [filters, paymentsData, rollingBackPaymentId, allowRollbackPayment]) // Dependencies for useMemo

  return (
    <div className='p-2 md:p-6'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6'>
        <h1 className='text-2xl font-bold'>Lịch sử Thanh toán</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={() => {
              setHistoryPage(1)
              setIsHistoryVisible(true)
            }}
          >
            Lịch sử hoàn tác
          </Button>
          {Object.keys(filters).length > 0 && (
            <Button 
                onClick={handleClearAllFilters}
                icon={<FilterOutlined />}
                danger
                className="w-full sm:w-auto"
            >
                Xóa bộ lọc
            </Button>
          )}

        </div>
      </div>

      <div className='bg-white rounded shadow'>
        <DataTable
          data={getPaymentList()}
          columns={columns}
          loading={loading}
          showActions={false}
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
          onView={(record) => handleViewPayment(record as Payment)}
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
            <Descriptions 
              bordered 
              column={1} 
              labelStyle={{ width: '160px' }}
            >
              <Descriptions.Item label='Mã PT'>
                <span className='font-bold'>{viewingPayment.code}</span>
              </Descriptions.Item>
              <Descriptions.Item label='Mã liên quan'>
                {viewingPayment.debt_note_code ? (
                   <Tag color="cyan">{viewingPayment.debt_note_code}</Tag>
                ) : "-"}
              </Descriptions.Item>
              <Descriptions.Item label='Khách hàng'>
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
              <Descriptions.Item label='Phương thức'>
                <Tag color="blue">
                  {paymentMethodLabels[
                    viewingPayment.payment_method as keyof typeof paymentMethodLabels
                  ] || viewingPayment.payment_method}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label='Ngày thu'>
                {new Date(viewingPayment.payment_date).toLocaleDateString("vi-VN")}
              </Descriptions.Item>
              {viewingPayment.notes && (
                <Descriptions.Item label='Ghi chú'>
                  {viewingPayment.notes}
                </Descriptions.Item>
              )}
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
        title="Xác nhận hoàn tác phiếu thu"
        open={isConfirmRollbackVisible}
        onOk={handleConfirmRollback}
        onCancel={handleCancelRollback}
        okText="Xác nhận hoàn tác"
        cancelText="Hủy"
        okButtonProps={{
          danger: true,
          disabled:
            isPreviewLoading ||
            !isPreviewSuccess || isPreviewError ||
            rollbackPreview?.payment_id !== rollbackingPayment?.id ||
            !rollbackPreview?.preview_token ||
            !rollbackReason.trim() ||
            rollbackPreview?.can_rollback === false,
        }}
        confirmLoading={rollbackMutation.isPending}
        cancelButtonProps={{ disabled: rollbackMutation.isPending }}
        maskClosable={!rollbackMutation.isPending}
        closable={!rollbackMutation.isPending}
        width={760}
        // Giới hạn chiều cao thân modal để bản xem trước dài không tràn khỏi màn hình
        styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}
      >
        {rollbackingPayment && (
          <div>
            <Descriptions bordered size='small' column={1} className='mb-3'>
              <Descriptions.Item label='Mã phiếu'>
                {rollbackingPayment.code}
              </Descriptions.Item>
              <Descriptions.Item label='Số tiền'>
                {formatCurrency(rollbackingPayment.amount)}
              </Descriptions.Item>
              <Descriptions.Item label='Khách hàng'>
                {rollbackingPayment.customer?.name ||
                  rollbackingPayment.customer_name ||
                  "-"}
              </Descriptions.Item>
            </Descriptions>

            {isPreviewLoading && (
              <Alert
                type='info'
                showIcon
                className='mb-3'
                message='Đang kiểm tra điều kiện hoàn tác...'
              />
            )}

            {isPreviewError && (
              <Alert
                type='error'
                showIcon
                className='mb-3'
                message='Không tải được bản xem trước. Vui lòng thử lại.'
                action={<Button onClick={() => void refetchRollbackPreview()}>Tải lại</Button>}
              />
            )}

            {isPreviewSuccess && rollbackPreview && (
              <PaymentRollbackPreviewPanel preview={rollbackPreview} />
            )}


            <div className='font-medium mb-1'>
              Lý do hoàn tác <span style={{ color: "#ff4d4f" }}>*</span>
            </div>
            <Input.TextArea
              rows={3}
              maxLength={500}
              showCount
              value={rollbackReason}
              onChange={(event) => setRollbackReason(event.target.value)}
              placeholder='Ví dụ: nhập sai số tiền, thu trùng phiếu...'
            />

            <p className='mt-3 mb-0 text-gray-600'>
              Hệ thống chỉ hoàn tác ghi nhận; tiền thực tế do người dùng tự xử
              lý. Phiếu thu sẽ bị xóa và được lưu vết trong Lịch sử hoàn tác.
            </p>
          </div>
        )}
      </Modal>

      {/* Lịch sử hoàn tác phiếu thu */}
      <Modal
        title='Lịch sử hoàn tác phiếu thu'
        open={isHistoryVisible}
        onCancel={() => setIsHistoryVisible(false)}
        footer={[
          <Button key='close' onClick={() => setIsHistoryVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={900}
      >
        <Table<PaymentRollbackHistoryItem>
          size='small'
          rowKey='id'
          loading={isHistoryLoading}
          dataSource={rollbackHistory?.data || []}
          pagination={{
            current: historyPage,
            pageSize: 10,
            total: rollbackHistory?.total || 0,
            onChange: (page) => setHistoryPage(page),
          }}
          columns={[
            {
              title: "Thời điểm",
              dataIndex: "rolled_back_at",
              render: (value: string) =>
                new Date(value).toLocaleString("vi-VN"),
            },
            { title: "Mã phiếu", dataIndex: "payment_code" },
            {
              title: "Khách hàng",
              dataIndex: "customer_name",
              render: (value: string | null) => value || "-",
            },
            {
              title: "Số tiền",
              dataIndex: "amount",
              align: "right",
              render: (value: number) => formatCurrency(Number(value)),
            },
            { title: "Lý do", dataIndex: "reason", ellipsis: true },
            {
              title: "Người hoàn tác",
              dataIndex: "rollbacker",
              render: (value: { account?: string } | null) =>
                value?.account || "-",
            },
          ]}
          expandable={{
            expandedRowRender: (record) => (
              <div className='text-sm'>
                <div>
                  Loại phiếu:{" "}
                  {rollbackKindLabels[record.payment_kind] || record.payment_kind}
                  {record.debt_note_code
                    ? ` • Phiếu nợ: ${record.debt_note_code}`
                    : ""}
                  {record.loan_code ? ` • Khoản vay: ${record.loan_code}` : ""}
                </div>
                <div>
                  Hóa đơn bị ảnh hưởng: {record.affected_invoices} • Phiếu nợ:{" "}
                  {record.affected_debt_notes}
                </div>
                <div>
                  Số phân bổ đã đảo: {record.allocations_snapshot?.length || 0}
                </div>
              </div>
            ),
          }}
        />
      </Modal>
    </div>
  )
}

export default PaymentsList
