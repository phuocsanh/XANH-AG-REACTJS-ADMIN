import * as React from "react"
import { Payment, PaymentAllocation } from "@/models/payment"
import {
  usePaymentsQuery,
  usePaymentAllocationsQuery,
} from "@/queries/payment"
import { Season } from "@/models/season"
import {
  Button,
  Tag,
  Space,
  Modal,
  List,
  Card,
  Alert,
  Descriptions,
  Divider,
} from "antd"
import {
  EyeOutlined,
  DollarOutlined,
} from "@ant-design/icons"
import DataTable from "@/components/common/data-table"
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
  const [viewingPayment, setViewingPayment] = React.useState<Payment | null>(
    null
  )

  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  // Queries
  const { data: paymentsData, isLoading } = usePaymentsQuery({
    page: currentPage,
    limit: pageSize,
  })

  // Tìm kiếm khách hàng (đã bỏ search cho simple modal)
  
  const { data: allocations } = usePaymentAllocationsQuery(
    viewingPayment?.id || 0
  )

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

  const loading = isLoading

  // Columns
  const columns = [
    {
      key: "code",
      title: "Mã PT",
      width: 120,
      render: (record: ExtendedPayment) => (
        <div className='font-medium'>{record.code}</div>
      ),
    },
    {
      key: "customer_name",
      title: "Khách hàng",
      width: 200,
      render: (record: ExtendedPayment) => (
        <div className='font-medium'>
          {record.customer?.name || record.customer_name || "-"}
        </div>
      ),
    },
    {
      key: "amount",
      title: "Số tiền",
      width: 150,
      render: (record: ExtendedPayment) => (
        <div className='text-green-600 font-bold'>
          {formatCurrency(record.amount)}
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
      width: 130,
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
      width: 120,
      render: (record: ExtendedPayment) => (
        <div>
          {new Date(record.payment_date).toLocaleDateString("vi-VN")}
        </div>
      ),
    },
    {
      key: "action",
      title: "Hành động",
      width: 120,
      render: (record: ExtendedPayment) => (
        <Button
          icon={<EyeOutlined />}
          onClick={() => handleViewPayment(record)}
          size='small'
        >
          Xem
        </Button>
      ),
    },
  ]

  return (
    <div className='p-6'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold'>Quản lý Thanh toán</h1>
        <Space>
          <Button
            type='primary'
            icon={<DollarOutlined />}
            onClick={handleOpenSettleModal}
          >
            Chốt sổ công nợ
          </Button>
        </Space>
      </div>

      <div className='bg-white rounded shadow'>
        <DataTable
          data={getPaymentList()}
          columns={columns}
          loading={loading}
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
            <Descriptions bordered column={2}>
              <Descriptions.Item label='Khách hàng' span={2}>
                {viewingPayment.customer_name}
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
                    <div className='flex justify-between w-full'>
                      <span>
                        {allocation.allocation_type === "invoice"
                          ? `Hóa đơn: ${allocation.invoice_code}`
                          : `Phiếu nợ: ${allocation.debt_note_code}`}
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
    </div>
  )
}

export default PaymentsList
