import * as React from "react"
import dayjs from "dayjs"
import type { TableProps } from "antd"
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Tag,
  Typography,
} from "antd"
import {
  PlusOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons"
import DataTable from "@/components/common/data-table"
import NumberInput from "@/components/common/number-input"
import { useCustomersQuery } from "@/queries/customer"
import {
  useLoansQuery,
  useCreateLoanMutation,
  useDeleteLoanMutation,
  useRepayLoanMutation,
} from "@/queries/loan"
import { Customer } from "@/models/customer"
import { Loan } from "@/models/loan"

const { Text } = Typography

interface ExtendedLoan extends Loan {
  key: string
}

const statusLabels: Record<string, string> = {
  active: "Đang vay",
  paid: "Đã thanh toán",
  overdue: "Quá hạn",
  cancelled: "Đã hủy",
}

const statusColors: Record<string, string> = {
  active: "gold",
  paid: "green",
  overdue: "red",
  cancelled: "default",
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0))

const toDatePayload = (value: any) => dayjs(value).format("YYYY-MM-DD")

const calculateRepayment = (principal: number, monthlyRate: number, loanDate?: string | Date | null, repaymentDate?: string | Date | null) => {
  if (!loanDate || !repaymentDate) {
    return { days: 0, interest: 0, total: principal }
  }

  const start = dayjs(loanDate).startOf("day")
  const end = dayjs(repaymentDate).startOf("day")
  const days = Math.max(0, end.diff(start, "day"))
  const interest = Math.round(((principal * monthlyRate * days) / 3000) * 100) / 100
  const total = Math.round((principal + interest) * 100) / 100

  return { days, interest, total }
}

const LoansList: React.FC = () => {
  const [form] = Form.useForm()
  const [repayForm] = Form.useForm()

  const [filters, setFilters] = React.useState<Record<string, unknown>>({})
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [repayOpen, setRepayOpen] = React.useState(false)
  const [selectedLoan, setSelectedLoan] = React.useState<Loan | null>(null)
  const [customerSearch, setCustomerSearch] = React.useState("")
  const [keywordInput, setKeywordInput] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string | undefined>()

  const { data: customersData } = useCustomersQuery({
    page: 1,
    limit: 100,
    ...(customerSearch && { keyword: customerSearch }),
  })
  const { data: loansData, isLoading } = useLoansQuery({
    page: currentPage,
    limit: pageSize,
    ...filters,
  })

  const createMutation = useCreateLoanMutation()
  const repayMutation = useRepayLoanMutation()
  const deleteMutation = useDeleteLoanMutation()
  const repayDate = Form.useWatch("repayment_date", repayForm)
  const repayInterestRate = Form.useWatch("monthly_interest_rate", repayForm)

  const customerOptions = React.useMemo(() => {
    return (customersData?.data?.items || []).map((customer: Customer) => ({
      value: customer.id,
      label: `${customer.name} - ${customer.phone || ""}`,
    }))
  }, [customersData])

  const getLoanList = (): ExtendedLoan[] => {
    if (!loansData?.data?.items) return []
    return loansData.data.items.map((loan: Loan) => ({
      ...loan,
      customer_name: loan.customer?.name,
      key: loan.id.toString(),
    }))
  }

  const handleTableChange: TableProps<ExtendedLoan>["onChange"] = (pagination, tableFilters, sorter: any) => {
    setCurrentPage(pagination.current || 1)
    setPageSize(pagination.pageSize || 10)

    const nextFilters = { ...filters }
    if (tableFilters.status?.[0]) {
      nextFilters.status = tableFilters.status[0]
    } else {
      delete nextFilters.status
    }

    const sortItem = Array.isArray(sorter) ? sorter[0] : sorter
    if (sortItem?.field && sortItem?.order) {
      nextFilters.sort_by = sortItem.field
      nextFilters.sort_direction = sortItem.order === "ascend" ? "ASC" : "DESC"
    } else {
      delete nextFilters.sort_by
      delete nextFilters.sort_direction
    }

    setFilters(nextFilters)
  }

  const handleCreate = async () => {
    const values = await form.validateFields()
    await createMutation.mutateAsync({
      customer_id: values.customer_id,
      loan_date: toDatePayload(values.loan_date),
      principal_amount: values.principal_amount,
      notes: values.notes,
    })
    setCreateOpen(false)
    form.resetFields()
  }

  const handleOpenRepay = (loan: Loan) => {
    setSelectedLoan(loan)
    repayForm.setFieldsValue({
      repayment_date: dayjs(),
      monthly_interest_rate: loan.monthly_interest_rate || 0,
      payment_method: "cash",
    })
    setRepayOpen(true)
  }

  const handleRepay = async () => {
    if (!selectedLoan) return
    const values = await repayForm.validateFields()
    await repayMutation.mutateAsync({
      id: selectedLoan.id,
      data: {
        repayment_date: toDatePayload(values.repayment_date),
        monthly_interest_rate: values.monthly_interest_rate,
        payment_method: values.payment_method,
        notes: values.notes,
      },
    })
    setRepayOpen(false)
    setSelectedLoan(null)
    repayForm.resetFields()
  }

  const handleDelete = async (loanId: number) => {
    await deleteMutation.mutateAsync(loanId)
  }

  const repaymentPreview = React.useMemo(() => {
    if (!selectedLoan) return null
    return calculateRepayment(
      Number(selectedLoan.principal_amount || 0),
      Number(repayInterestRate || 0),
      selectedLoan.loan_date,
      repayDate ? dayjs(repayDate).toISOString() : null,
    )
  }, [selectedLoan, repayDate, repayInterestRate])

  const columns = [
    {
      title: "Mã vay",
      dataIndex: "code",
      key: "code",
      render: (value: string) => <Text strong>{value}</Text>,
    },
    {
      title: "Khách hàng",
      key: "customer",
      render: (_: unknown, record: ExtendedLoan) => record.customer?.name || `KH #${record.customer_id}`,
    },
    {
      title: "Ngày vay",
      dataIndex: "loan_date",
      key: "loan_date",
      render: (value: string | Date) => dayjs(value).format("DD/MM/YYYY"),
    },
    {
      title: "Tiền gốc",
      dataIndex: "principal_amount",
      key: "principal_amount",
      sorter: true,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: "Lãi/tháng",
      dataIndex: "monthly_interest_rate",
      key: "monthly_interest_rate",
      render: (value: number) => `${Number(value || 0)}%`,
    },
    {
      title: "Số ngày",
      dataIndex: "loan_days",
      key: "loan_days",
      sorter: true,
    },
    {
      title: "Tiền lãi",
      dataIndex: "interest_amount",
      key: "interest_amount",
      sorter: true,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: "Tổng phải trả",
      dataIndex: "total_amount",
      key: "total_amount",
      sorter: true,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: "Còn lại",
      dataIndex: "remaining_amount",
      key: "remaining_amount",
      render: (value: number) => formatCurrency(value),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      filters: Object.entries(statusLabels).map(([value, text]) => ({ text, value })),
      render: (value: string) => <Tag color={statusColors[value] || "default"}>{statusLabels[value] || value}</Tag>,
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_: unknown, record: ExtendedLoan) => (
        <Space>
          {record.status !== "paid" && (
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handleOpenRepay(record)}
            >
              Thanh toán
            </Button>
          )}
          {record.status === "active" && (
            <Popconfirm
              title="Xóa khoản vay?"
              description={`Xác nhận xóa khoản vay ${record.code}?`}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(record.id)}
            >
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
                loading={deleteMutation.isPending}
              >
                Xóa
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="p-4 space-y-4">
      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Quản lý cho vay</h1>
            <p className="text-slate-500">Tạo khoản vay cho khách hàng và tính lãi theo số ngày thực vay.</p>
          </div>
          <Space wrap>
            <Button icon={<SearchOutlined />} onClick={() => setFilters({})}>
              Bỏ lọc
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              Tạo khoản vay
            </Button>
          </Space>
        </div>
      </Card>

      <Card>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr_auto_auto]">
          <Input
            allowClear
            placeholder="Mã vay, tên khách hàng, số điện thoại"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onPressEnter={() => {
              const next = { ...filters, keyword: keywordInput }
              if (!keywordInput) delete next.keyword
              if (statusFilter) next.status = statusFilter
              setFilters(next)
              setCurrentPage(1)
            }}
          />
          <Select
            allowClear
            placeholder="Trạng thái"
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))}
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={() => {
              const next: Record<string, unknown> = {}
              if (keywordInput) next.keyword = keywordInput
              if (statusFilter) next.status = statusFilter
              setFilters(next)
              setCurrentPage(1)
            }}
          >
            Tìm kiếm
          </Button>
          <Button
            onClick={() => {
              setKeywordInput("")
              setStatusFilter(undefined)
              setFilters({})
              setCurrentPage(1)
            }}
          >
            Xóa lọc
          </Button>
        </div>
      </Card>

      <DataTable
        loading={isLoading}
        data={getLoanList()}
        columns={columns as any}
        rowKey="id"
        onChange={handleTableChange}
        paginationConfig={{
          current: currentPage,
          pageSize,
          total: loansData?.data?.total || 0,
        }}
      />

      <Modal
        title="Tạo khoản vay mới"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={handleCreate}
        okText="Lưu khoản vay"
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ loan_date: dayjs() }}>
          <Form.Item
            name="customer_id"
            label="Khách hàng"
            rules={[{ required: true, message: "Vui lòng chọn khách hàng" }]}
          >
            <Select
              showSearch
              filterOption={false}
              onSearch={setCustomerSearch}
              placeholder="Chọn khách hàng"
              options={customerOptions}
            />
          </Form.Item>
          <Form.Item
            name="loan_date"
            label="Ngày vay"
            rules={[{ required: true, message: "Vui lòng chọn ngày vay" }]}
          >
              <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item
            name="principal_amount"
            label="Tiền gốc"
            rules={[{ required: true, message: "Vui lòng nhập tiền gốc" }]}
          >
            <NumberInput className="w-full" min={0} decimalScale={0} placeholder="Nhập tiền gốc" />
          </Form.Item>
          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={3} placeholder="Ghi chú thêm" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Thanh toán khoản vay"
        open={repayOpen}
        onCancel={() => {
          setRepayOpen(false)
          setSelectedLoan(null)
        }}
        onOk={handleRepay}
        okText="Xác nhận thanh toán"
        destroyOnClose
      >
        {selectedLoan && (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3">
              <p><strong>Mã vay:</strong> {selectedLoan.code}</p>
              <p><strong>Khách hàng:</strong> {selectedLoan.customer?.name || `KH #${selectedLoan.customer_id}`}</p>
              <p><strong>Tiền gốc:</strong> {formatCurrency(Number(selectedLoan.principal_amount || 0))}</p>
            </div>
            <Form form={repayForm} layout="vertical">
              <Form.Item
                name="repayment_date"
                label="Ngày thanh toán"
                rules={[{ required: true, message: "Vui lòng chọn ngày thanh toán" }]}
              >
                <DatePicker
                  className="w-full"
                  format="DD/MM/YYYY"
                  disabledDate={(current) =>
                    Boolean(selectedLoan?.loan_date && current && current.startOf("day").isBefore(dayjs(selectedLoan.loan_date).startOf("day")))
                  }
                />
              </Form.Item>
              <Form.Item
                name="monthly_interest_rate"
                label="Lãi suất mỗi tháng (%)"
                rules={[{ required: true, message: "Vui lòng nhập lãi suất" }]}
              >
                <NumberInput className="w-full" min={0} decimalScale={2} addonAfter="% / tháng" placeholder="Nhập lãi suất" />
              </Form.Item>
              <Form.Item
                name="payment_method"
                label="Phương thức thanh toán"
                rules={[{ required: true, message: "Vui lòng chọn phương thức thanh toán" }]}
              >
                <Select>
                  <Select.Option value="cash">Tiền mặt</Select.Option>
                  <Select.Option value="transfer">Chuyển khoản</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="notes" label="Ghi chú phiếu thu">
                <Input.TextArea rows={2} placeholder="Ghi chú thêm cho phiếu thu" />
              </Form.Item>
            </Form>
            {repaymentPreview && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card size="small">
                  <Text type="secondary">Số ngày vay</Text>
                  <div className="text-xl font-semibold">{repaymentPreview.days} ngày</div>
                </Card>
                <Card size="small">
                  <Text type="secondary">Tiền lãi</Text>
                  <div className="text-xl font-semibold">{formatCurrency(repaymentPreview.interest)}</div>
                </Card>
                <Card size="small">
                  <Text type="secondary">Tổng phải trả</Text>
                  <div className="text-xl font-semibold">{formatCurrency(repaymentPreview.total)}</div>
                </Card>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default LoansList
