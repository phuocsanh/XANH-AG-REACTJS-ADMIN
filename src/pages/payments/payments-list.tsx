import * as React from "react"
import { Payment, PaymentAllocation } from "@/models/payment"
import {
  usePaymentsQuery,
  usePaymentAllocationsQuery,
  useCreatePaymentMutation,
  useSettlePaymentMutation,
} from "@/queries/payment"
import {
  useCustomerSearchQuery,
  useCustomerInvoicesQuery,
  useCustomerDebtsQuery,
} from "@/queries/customer"
import { useSeasonsQuery } from "@/queries/season"
import { Customer } from "@/models/customer"
import { Season } from "@/models/season"
import {
  Button,
  Tag,
  Space,
  Form,
  InputNumber,
  Select,
  Modal,
  Input,
  AutoComplete,
  Checkbox,
  List,
  Card,
  Alert,
  Descriptions,
  Divider,
} from "antd"
import {
  PlusOutlined,
  EyeOutlined,
  DollarOutlined,
} from "@ant-design/icons"
import DataTable from "@/components/common/data-table"
import { paymentMethodLabels } from "./form-config"

// Extend Payment interface
interface ExtendedPayment extends Payment {
  key: string
  [key: string]: any
}

const PaymentsList: React.FC = () => {
  // State quản lý UI
  const [isSimpleModalVisible, setIsSimpleModalVisible] =
    React.useState<boolean>(false)
  const [isSettleModalVisible, setIsSettleModalVisible] =
    React.useState<boolean>(false)
  const [isDetailModalVisible, setIsDetailModalVisible] =
    React.useState<boolean>(false)
  const [viewingPayment, setViewingPayment] = React.useState<Payment | null>(
    null
  )
  const [selectedCustomer, setSelectedCustomer] =
    React.useState<Customer | null>(null)
  const [customerSearch, setCustomerSearch] = React.useState("")
  const [selectedInvoices, setSelectedInvoices] = React.useState<number[]>([])
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  // Form instances
  const [simpleForm] = Form.useForm()
  const [settleForm] = Form.useForm()

  // Queries
  const { data: paymentsData, isLoading } = usePaymentsQuery({
    page: currentPage,
    limit: pageSize,
  })

  const { data: customers } = useCustomerSearchQuery(customerSearch)
  const { data: customerInvoices } = useCustomerInvoicesQuery(
    selectedCustomer?.id || 0
  )
  const { data: customerDebts } = useCustomerDebtsQuery(
    selectedCustomer?.id || 0
  )
  const { data: seasons } = useSeasonsQuery()
  const { data: allocations } = usePaymentAllocationsQuery(
    viewingPayment?.id || 0
  )

  // Mutations
  const createSimplePaymentMutation = useCreatePaymentMutation()
  const settlePaymentMutation = useSettlePaymentMutation()

  // Handlers
  const handleOpenSimpleModal = () => {
    simpleForm.resetFields()
    setSelectedCustomer(null)
    setIsSimpleModalVisible(true)
  }

  const handleCloseSimpleModal = () => {
    setIsSimpleModalVisible(false)
    setSelectedCustomer(null)
  }

  const handleOpenSettleModal = () => {
    settleForm.resetFields()
    setSelectedCustomer(null)
    setSelectedInvoices([])
    setIsSettleModalVisible(true)
  }

  const handleCloseSettleModal = () => {
    setIsSettleModalVisible(false)
    setSelectedCustomer(null)
    setSelectedInvoices([])
  }

  const handleViewPayment = (payment: Payment) => {
    setViewingPayment(payment)
    setIsDetailModalVisible(true)
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalVisible(false)
    setViewingPayment(null)
  }

  const handleCustomerSelect = (value: string) => {
    const customer = customers?.find((c: Customer) => c.id.toString() === value)
    setSelectedCustomer(customer || null)
  }

  const handleInvoiceToggle = (invoiceId: number, checked: boolean) => {
    setSelectedInvoices((prev) =>
      checked ? [...prev, invoiceId] : prev.filter((id) => id !== invoiceId)
    )
  }

  const handleSimpleSubmit = async () => {
    try {
      const values = await simpleForm.validateFields()
      await createSimplePaymentMutation.mutateAsync(values, {
        onSuccess: () => {
          handleCloseSimpleModal()
        },
      })
    } catch (error) {
      console.error("Form validation failed:", error)
    }
  }

  const handleSettleSubmit = async () => {
    try {
      const values = await settleForm.validateFields()
      const submitData = {
        ...values,
        invoice_ids: selectedInvoices.length > 0 ? selectedInvoices : undefined,
      }
      await settlePaymentMutation.mutateAsync(submitData, {
        onSuccess: () => {
          handleCloseSettleModal()
        },
      })
    } catch (error) {
      console.error("Form validation failed:", error)
    }
  }

  // Helpers
  const getPaymentList = (): ExtendedPayment[] => {
    if (!paymentsData?.data?.items) return []
    return paymentsData.data.items.map((payment: Payment) => ({
      ...payment,
      key: payment.id.toString(),
    }))
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value)
  }

  const calculateTotalDebt = () => {
    const invoicesDebt =
      customerInvoices?.reduce(
        (sum: number, inv: any) => sum + (inv.remaining_amount || 0),
        0
      ) || 0
    const debtsAmount =
      customerDebts?.reduce(
        (sum: number, debt: any) => sum + (debt.remaining_amount || 0),
        0
      ) || 0
    return invoicesDebt + debtsAmount
  }

  const calculateSelectedDebt = () => {
    if (!customerInvoices) return 0
    return customerInvoices
      .filter((inv: any) => selectedInvoices.includes(inv.id))
      .reduce((sum: number, inv: any) => sum + (inv.remaining_amount || 0), 0)
  }

  const loading =
    isLoading ||
    createSimplePaymentMutation.isPending ||
    settlePaymentMutation.isPending

  // Watch settle form values
  const settleAmount = Form.useWatch("amount", settleForm) || 0
  const selectedDebt = calculateSelectedDebt()
  const remainingDebt = selectedDebt - settleAmount
  const createDebtNote = Form.useWatch("create_debt_note", settleForm)

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
        <div className='font-medium'>{record.customer_name}</div>
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

  // Customer options for AutoComplete
  const customerOptions =
    customers?.map((c: Customer) => ({
      value: c.id.toString(),
      label: `${c.name} - ${c.phone}`,
    })) || []

  return (
    <div className='p-6'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold'>Quản lý Thanh toán</h1>
        <Space>
          <Button
            type='default'
            icon={<PlusOutlined />}
            onClick={handleOpenSimpleModal}
          >
            Thu tiền đơn giản
          </Button>
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

      {/* Simple Payment Modal */}
      <Modal
        title='Thu tiền đơn giản'
        open={isSimpleModalVisible}
        onCancel={handleCloseSimpleModal}
        footer={[
          <Button key='cancel' onClick={handleCloseSimpleModal}>
            Hủy
          </Button>,
          <Button
            key='submit'
            type='primary'
            loading={createSimplePaymentMutation.isPending}
            onClick={handleSimpleSubmit}
          >
            Tạo phiếu thu
          </Button>,
        ]}
        width={500}
      >
        <Form form={simpleForm} layout='vertical' className='mt-4'>
          <Form.Item
            label='Khách hàng'
            name='customer_id'
            rules={[{ required: true, message: "Vui lòng chọn khách hàng" }]}
          >
            <AutoComplete
              options={customerOptions}
              onSearch={setCustomerSearch}
              onSelect={handleCustomerSelect}
              placeholder='Tìm khách hàng...'
            />
          </Form.Item>

          <Form.Item
            label='Số tiền'
            name='amount'
            rules={[{ required: true, message: "Vui lòng nhập số tiền" }]}
          >
            <InputNumber
              className='w-full'
              min={0}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
              placeholder='Nhập số tiền'
            />
          </Form.Item>

          <Form.Item
            label='Phương thức thanh toán'
            name='payment_method'
            initialValue='cash'
          >
            <Select>
              <Select.Option value='cash'>Tiền mặt</Select.Option>
              <Select.Option value='transfer'>Chuyển khoản</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label='Ngày thu' name='payment_date'>
            <Input type='date' />
          </Form.Item>

          <Form.Item label='Ghi chú' name='notes'>
            <Input.TextArea rows={3} placeholder='Nhập ghi chú' />
          </Form.Item>
        </Form>
      </Modal>

      {/* Settle Payment Modal */}
      <Modal
        title='Chốt sổ công nợ'
        open={isSettleModalVisible}
        onCancel={handleCloseSettleModal}
        footer={[
          <Button key='cancel' onClick={handleCloseSettleModal}>
            Hủy
          </Button>,
          <Button
            key='submit'
            type='primary'
            loading={settlePaymentMutation.isPending}
            onClick={handleSettleSubmit}
          >
            Chốt sổ
          </Button>,
        ]}
        width={700}
      >
        <Form form={settleForm} layout='vertical' className='mt-4'>
          <Form.Item
            label='Khách hàng'
            name='customer_id'
            rules={[{ required: true, message: "Vui lòng chọn khách hàng" }]}
          >
            <AutoComplete
              options={customerOptions}
              onSearch={setCustomerSearch}
              onSelect={handleCustomerSelect}
              placeholder='Tìm khách hàng...'
            />
          </Form.Item>

          {selectedCustomer && (
            <>
              <Card className='mb-4 bg-gray-50'>
                <div className='text-gray-500 text-sm'>
                  Tổng công nợ hiện tại
                </div>
                <div className='text-2xl font-bold text-red-600'>
                  {formatCurrency(calculateTotalDebt())}
                </div>
              </Card>

              <div className='mb-4'>
                <div className='font-medium mb-2'>
                  Chọn hóa đơn cần thanh toán
                </div>
                <List
                  bordered
                  className='max-h-48 overflow-auto'
                  dataSource={customerInvoices || []}
                  renderItem={(invoice: any) => (
                    <List.Item key={invoice.id}>
                      <Checkbox
                        checked={selectedInvoices.includes(invoice.id)}
                        onChange={(e) =>
                          handleInvoiceToggle(invoice.id, e.target.checked)
                        }
                      >
                        {invoice.code} - {formatCurrency(invoice.remaining_amount)}
                        <span className='text-gray-500 text-sm ml-2'>
                          ({new Date(invoice.created_at).toLocaleDateString("vi-VN")})
                        </span>
                      </Checkbox>
                    </List.Item>
                  )}
                />
                {selectedInvoices.length > 0 && (
                  <div className='text-blue-600 mt-2'>
                    Tổng nợ đã chọn: {formatCurrency(selectedDebt)}
                  </div>
                )}
              </div>
            </>
          )}

          <div className='grid grid-cols-2 gap-4'>
            <Form.Item
              label='Số tiền khách trả'
              name='amount'
              rules={[{ required: true, message: "Vui lòng nhập số tiền" }]}
            >
              <InputNumber
                className='w-full'
                min={0}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
              />
            </Form.Item>

            <Form.Item
              label='Phương thức'
              name='payment_method'
              initialValue='cash'
            >
              <Select>
                <Select.Option value='cash'>Tiền mặt</Select.Option>
                <Select.Option value='transfer'>Chuyển khoản</Select.Option>
              </Select>
            </Form.Item>
          </div>

          {remainingDebt > 0 && (
            <div className='mt-4'>
              <Alert
                message={`Số tiền còn thiếu: ${formatCurrency(remainingDebt)}`}
                type='warning'
                showIcon
                className='mb-2'
              />

              <Form.Item
                name='create_debt_note'
                valuePropName='checked'
                initialValue={false}
              >
                <Checkbox>Tạo phiếu nợ mới cho số tiền còn thiếu</Checkbox>
              </Form.Item>

              {createDebtNote && (
                <>
                  <Form.Item label='Mùa vụ' name={["debt_note_config", "season_id"]}>
                    <Select placeholder='Chọn mùa vụ'>
                      {seasons?.data?.items?.map((season: Season) => (
                        <Select.Option key={season.id} value={season.id}>
                          {season.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item label='Ghi chú phiếu nợ' name={["debt_note_config", "notes"]}>
                    <Input.TextArea rows={2} placeholder='Nhập ghi chú' />
                  </Form.Item>
                </>
              )}
            </div>
          )}
        </Form>
      </Modal>

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
