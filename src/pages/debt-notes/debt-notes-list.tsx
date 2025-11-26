import * as React from "react"
import { DebtNote } from "@/models/debt-note"
import { useDebtNotesQuery, usePayDebtMutation } from "@/queries/debt-note"
import {
  Button,
  Select,
  Tag,
  Space,
  Form,
  InputNumber,
  Card,
  Statistic,
  Row,
  Col,
  Modal,
  Input,
} from "antd"
import { DollarOutlined } from "@ant-design/icons"
import DataTable from "@/components/common/data-table"
import {
  debtStatusLabels,
  debtStatusColors,
} from "./form-config"

// Extend DebtNote interface để tương thích với DataTable
interface ExtendedDebtNote extends DebtNote {
  key: string
  [key: string]: any
}

// Type for pay debt form values
interface PayDebtFormValues {
  amount: number
  payment_method: "cash" | "transfer"
  notes?: string
}

const DebtNotesList: React.FC = () => {
  // State quản lý UI
  const [statusFilter, setStatusFilter] = React.useState<string>("")
  const [isPayModalVisible, setIsPayModalVisible] =
    React.useState<boolean>(false)
  const [payingDebt, setPayingDebt] = React.useState<DebtNote | null>(null)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  // Form instance
  const [form] = Form.useForm<PayDebtFormValues>()

  // Sử dụng query hooks
  const { data: debtNotesData, isLoading } = useDebtNotesQuery({
    page: currentPage,
    limit: pageSize,
    status: statusFilter || undefined,
  })

  const payDebtMutation = usePayDebtMutation()

  // Hàm xử lý mở modal trả nợ
  const handleOpenPayModal = (debtNote: DebtNote) => {
    setPayingDebt(debtNote)
    form.setFieldsValue({
      amount: debtNote.remaining_amount,
      payment_method: "cash",
      notes: "",
    })
    setIsPayModalVisible(true)
  }

  // Xử lý đóng pay modal
  const handleClosePayModal = () => {
    setIsPayModalVisible(false)
    form.resetFields()
    setPayingDebt(null)
  }

  // Xử lý submit form trả nợ
  const handlePaySubmit = async () => {
    if (!payingDebt) return

    try {
      const values = await form.validateFields()

      await payDebtMutation.mutateAsync(
        { id: payingDebt.id, data: values },
        {
          onSuccess: () => {
            handleClosePayModal()
          },
        }
      )
    } catch (error) {
      console.error("Form validation failed:", error)
    }
  }

  // Lấy danh sách phiếu nợ
  const getDebtNoteList = (): ExtendedDebtNote[] => {
    if (!debtNotesData?.data?.items) return []

    return debtNotesData.data.items.map((debtNote: DebtNote) => ({
      ...debtNote,
      key: debtNote.id.toString(),
    }))
  }

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value)
  }

  const loading = isLoading || payDebtMutation.isPending

  // Tính toán thống kê
  const debtList = getDebtNoteList()
  const totalDebt = debtList.reduce(
    (sum, debt) => sum + debt.remaining_amount,
    0
  )
  const overdueCount = debtList.filter((debt) => debt.status === "overdue")
    .length
  const activeCount = debtList.filter((debt) => debt.status === "active").length
  const paidCount = debtList.filter((debt) => debt.status === "paid").length

  // Cấu hình columns cho DataTable
  const columns = [
    {
      key: "code",
      title: "Mã phiếu nợ",
      width: 120,
      render: (record: ExtendedDebtNote) => (
        <div className='font-medium'>{record.code}</div>
      ),
    },
    {
      key: "customer_name",
      title: "Khách hàng",
      width: 180,
      render: (record: ExtendedDebtNote) => (
        <div className='font-medium'>{record.customer_name}</div>
      ),
    },
    {
      key: "season_name",
      title: "Mùa vụ",
      width: 120,
      render: (record: ExtendedDebtNote) => (
        <div>{record.season_name || "-"}</div>
      ),
    },
    {
      key: "amount",
      title: "Số tiền nợ",
      width: 130,
      render: (record: ExtendedDebtNote) => (
        <div className='text-gray-600'>{formatCurrency(record.amount)}</div>
      ),
    },
    {
      key: "paid_amount",
      title: "Đã trả",
      width: 130,
      render: (record: ExtendedDebtNote) => (
        <div className='text-green-600 font-medium'>
          {formatCurrency(record.paid_amount)}
        </div>
      ),
    },
    {
      key: "remaining_amount",
      title: "Còn nợ",
      width: 130,
      render: (record: ExtendedDebtNote) => (
        <div className='text-red-600 font-bold'>
          {formatCurrency(record.remaining_amount)}
        </div>
      ),
    },
    {
      key: "due_date",
      title: "Hạn trả",
      width: 120,
      render: (record: ExtendedDebtNote) => (
        <div>
          {record.due_date
            ? new Date(record.due_date).toLocaleDateString("vi-VN")
            : "-"}
        </div>
      ),
    },
    {
      key: "status",
      title: "Trạng thái",
      width: 120,
      render: (record: ExtendedDebtNote) => {
        const status = record.status as keyof typeof debtStatusLabels
        return (
          <Tag color={debtStatusColors[status] || "default"}>
            {debtStatusLabels[status] || record.status}
          </Tag>
        )
      },
    },
    {
      key: "action",
      title: "Hành động",
      width: 120,
      render: (record: ExtendedDebtNote) => (
        <Space size='middle'>
          {record.remaining_amount > 0 && record.status !== "paid" && (
            <Button
              type='primary'
              icon={<DollarOutlined />}
              onClick={() => handleOpenPayModal(record)}
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
        <h1 className='text-2xl font-bold'>Quản lý Công nợ</h1>
      </div>

      {/* Summary Cards */}
      <Row gutter={16} className='mb-6'>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title='Tổng công nợ'
              value={totalDebt}
              precision={0}
              valueStyle={{ color: "#faad14" }}
              formatter={(value) =>
                new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(Number(value))
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title='Quá hạn'
              value={overdueCount}
              suffix='phiếu'
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title='Đang nợ'
              value={activeCount}
              suffix='phiếu'
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title='Đã trả'
              value={paidCount}
              suffix='phiếu'
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filter */}
      <div className='mb-6'>
        <Select
          placeholder='Lọc theo trạng thái'
          value={statusFilter || undefined}
          onChange={(value) => setStatusFilter(value || "")}
          allowClear
          className='w-64'
        >
          <Select.Option value=''>Tất cả</Select.Option>
          <Select.Option value='active'>Đang nợ</Select.Option>
          <Select.Option value='overdue'>Quá hạn</Select.Option>
          <Select.Option value='paid'>Đã trả</Select.Option>
        </Select>
      </div>

      {/* Danh sách phiếu nợ */}
      <div className='bg-white rounded shadow'>
        <DataTable
          data={getDebtNoteList()}
          columns={columns}
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: debtNotesData?.data?.total || 0,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total: number) => `Tổng ${total} phiếu nợ`,
            onChange: (page: number, size: number) => {
              setCurrentPage(page)
              setPageSize(size)
            },
          }}
        />
      </div>

      {/* Modal trả nợ */}
      <Modal
        title={`Trả nợ: ${payingDebt?.code || ""}`}
        open={isPayModalVisible}
        onCancel={handleClosePayModal}
        footer={[
          <Button key='cancel' onClick={handleClosePayModal}>
            Hủy
          </Button>,
          <Button
            key='submit'
            type='primary'
            loading={payDebtMutation.isPending}
            onClick={handlePaySubmit}
          >
            Xác nhận trả nợ
          </Button>,
        ]}
        width={500}
      >
        {payingDebt && (
          <div>
            <Card className='mb-4 bg-gray-50'>
              <div className='mb-2'>
                <div className='text-gray-500 text-sm'>Khách hàng</div>
                <div className='text-lg font-medium'>
                  {payingDebt.customer_name}
                </div>
              </div>
              <div>
                <div className='text-gray-500 text-sm'>Số tiền còn nợ</div>
                <div className='text-2xl font-bold text-red-600'>
                  {formatCurrency(payingDebt.remaining_amount)}
                </div>
              </div>
            </Card>

            <Form form={form} layout='vertical'>
              <Form.Item
                label='Số tiền trả'
                name='amount'
                rules={[
                  { required: true, message: "Vui lòng nhập số tiền trả" },
                  {
                    type: "number",
                    max: payingDebt.remaining_amount,
                    message: "Số tiền không được vượt quá số tiền còn nợ",
                  },
                ]}
              >
                <InputNumber
                  className='w-full'
                  min={0}
                  max={payingDebt.remaining_amount}
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
                rules={[
                  {
                    required: true,
                    message: "Vui lòng chọn phương thức thanh toán",
                  },
                ]}
              >
                <Select placeholder='Chọn phương thức'>
                  <Select.Option value='cash'>Tiền mặt</Select.Option>
                  <Select.Option value='transfer'>Chuyển khoản</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item label='Ghi chú' name='notes'>
                <Input.TextArea rows={3} placeholder='Nhập ghi chú' />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default DebtNotesList
