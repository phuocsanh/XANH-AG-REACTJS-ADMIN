/**
 * Trang Quản Lý Công Nợ
 * 
 * Để xem và chốt sổ công nợ.
 */
import * as React from "react"
import { DebtNote } from "@/models/debt-note"
import { useDebtNotesQuery } from "@/queries/debt-note"
import {
  Select,
  Tag,
  Card,
  Statistic,
  Row,
  Col,
} from "antd"
import { DollarOutlined } from "@ant-design/icons"
import DataTable from "@/components/common/data-table"
import {
  debtStatusLabels,
  debtStatusColors,
} from "./form-config"
import { SettleDebtModal } from "../payments/components/settle-debt-modal"
import { Button } from "antd"

// Extend DebtNote interface để tương thích với DataTable
interface ExtendedDebtNote extends DebtNote {
  key: string
  [key: string]: any
}

const DebtNotesList: React.FC = () => {
  // State quản lý UI
  const [statusFilter, setStatusFilter] = React.useState<string>("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  // State modal chốt sổ
  const [isSettleModalVisible, setIsSettleModalVisible] = React.useState(false)
  const [settleInitialValues, setSettleInitialValues] = React.useState<{customer_id?: number, season_id?: number} | undefined>(undefined)
  const [settleInitialCustomer, setSettleInitialCustomer] = React.useState<any>(null)

  // Handlers
  const handleOpenSettleModal = (record: ExtendedDebtNote) => {
    setSettleInitialValues({
        customer_id: record.customer_id,
        season_id: record.season_id
    })
    
    // Tạo object customer giả giả từ thông tin có sẵn để pass qua modal
    // Giúp modal không cần load lại danh sách nợ
    if (record.customer_id) {
        setSettleInitialCustomer({
            id: record.customer_id,
            name: record.customer_name || record.customer?.name || "Khách hàng",
            phone: record.customer?.phone || "",
            code: record.customer?.code || "",
            // total_debt & debt_count will be fetched by modal
            type: 'regular',
            is_guest: false,
            total_purchases: 0,
            total_spent: 0,
            created_at: '',
            updated_at: ''
        })
    }

    setIsSettleModalVisible(true)
  }

  const handleCloseSettleModal = () => {
    setIsSettleModalVisible(false)
    setSettleInitialValues(undefined)
    setSettleInitialCustomer(null)
  }

  // Sử dụng query hooks
  const { data: debtNotesData, isLoading } = useDebtNotesQuery({
    page: currentPage,
    limit: pageSize,
    status: statusFilter || undefined,
  })

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

  const loading = isLoading

  // Tính toán thống kê
  const debtList = getDebtNoteList()
  const totalDebt = debtList.reduce(
    (sum, debt) => {
      const amount = Number(debt.remaining_amount)
      return sum + (isNaN(amount) ? 0 : amount)
    },
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
        <div className='font-medium'>
          {record.customer_name || record.customer?.name || "-"}
        </div>
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
         record.remaining_amount > 0 && record.status !== 'settled' ? (
           <Button 
             type="primary" 
             size="small"
             icon={<DollarOutlined />}
             onClick={() => handleOpenSettleModal(record)}
           >
             Chốt sổ
           </Button>
         ) : null
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

      <SettleDebtModal
        open={isSettleModalVisible}
        onCancel={handleCloseSettleModal}
        initialValues={settleInitialValues}
        initialCustomer={settleInitialCustomer}
      />
    </div>
  )
}

export default DebtNotesList
