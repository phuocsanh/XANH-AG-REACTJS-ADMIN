/**
 * Trang Quản Lý Công Nợ
 * 
 * Để xem và chốt sổ công nợ.
 */
import * as React from "react"
import { DebtNote } from "@/models/debt-note"
import { CustomerDebtor } from "@/models/customer"
import { useDebtNotesQuery } from "@/queries/debt-note"
import { useSeasonsQuery, useActiveSeasonQuery } from "@/queries/season"
import {
  Tag,
  Card,
  Statistic,
  Row,
  Col,
  Space,
} from "antd"
import { RangePicker } from '@/components/common'
import { DollarOutlined, SearchOutlined, GiftOutlined } from "@ant-design/icons"
import dayjs from 'dayjs';
import DataTable from "@/components/common/data-table"
import FilterHeader from "@/components/common/filter-header"
import ComboBox from "@/components/common/combo-box"
import {
  debtStatusLabels,
  debtStatusColors,
} from "./form-config"
import { SettleDebtModal } from "../payments/components/settle-debt-modal"
import CloseSeasonModal from "./components/CloseSeasonModal"
import { Button, TableProps } from "antd"
import type { FilterDropdownProps } from "antd/es/table/interface"

// Extend DebtNote interface để tương thích với DataTable
interface ExtendedDebtNote extends DebtNote {
  key: string
  [key: string]: unknown
}

const DebtNotesList: React.FC = () => {
  // State quản lý UI
  const [filters, setFilters] = React.useState<Record<string, unknown>>({})
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  // State modal chốt sổ
  const [isSettleModalVisible, setIsSettleModalVisible] = React.useState(false)
  const [settleInitialValues, setSettleInitialValues] = React.useState<{customer_id?: number, season_id?: number} | undefined>(undefined)
  const [settleInitialCustomer, setSettleInitialCustomer] = React.useState<CustomerDebtor | undefined>(undefined)

  // State modal chốt sổ cuối vụ
  const [isCloseSeasonModalVisible, setIsCloseSeasonModalVisible] = React.useState(false)
  const [selectedDebtNoteId, setSelectedDebtNoteId] = React.useState<number | null>(null)

  // State cho season search
  const [seasonSearchText, setSeasonSearchText] = React.useState('')

  // Load mùa vụ active (mới nhất)
  const { data: activeSeason } = useActiveSeasonQuery()

  // Load mùa vụ với search
  const { data: seasonsData } = useSeasonsQuery({ 
    page: 1, 
    limit: 20,
    ...(seasonSearchText && { name: seasonSearchText }) // Thêm filter name khi có search
  })

  // Tự động chọn mùa vụ mới nhất khi vào trang lần đầu
  const isInitialized = React.useRef(false)
  React.useEffect(() => {
    // Chỉ set mặc định một lần duy nhất khi mới vào trang và có dữ liệu mùa vụ active
    if (!isInitialized.current && activeSeason?.id) {
      setFilters(prev => ({ ...prev, season_id: activeSeason.id }))
      isInitialized.current = true
    }
  }, [activeSeason])

  // Date Filter UI Helper
  const getDateColumnSearchProps = (_dataIndex: string) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <RangePicker 
            style={{ marginBottom: 8, display: 'flex' }}
            format="DD/MM/YYYY"
            value={
                selectedKeys && selectedKeys[0] 
                ? [dayjs(selectedKeys[0] as string), dayjs(selectedKeys[1] as string)] 
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
  const handleTableChange: TableProps<ExtendedDebtNote>['onChange'] = (
    pagination,
    tableFilters,
    sorter,
    _extra
  ) => {
    setCurrentPage(pagination.current || 1)
    setPageSize(pagination.pageSize || 10)
    
    const newFilters = { ...filters }

    // Status filter
    if (tableFilters.status && tableFilters.status.length > 0) {
        newFilters.status = tableFilters.status[0]
    }

    // Due Date Range
    if (tableFilters.due_date && tableFilters.due_date.length === 2) {
      newFilters.due_date_start = tableFilters.due_date[0]
      newFilters.due_date_end = tableFilters.due_date[1]
    } else {
        delete newFilters.due_date_start
        delete newFilters.due_date_end
    }

    // Sorter (amount, paid_amount, remaining_amount)
    const sortItem = Array.isArray(sorter) ? sorter[0] : sorter;
    if (sortItem && sortItem.field && sortItem.order) {
        newFilters.sort_by = sortItem.field
        newFilters.sort_direction = sortItem.order === 'ascend' ? 'ASC' : 'DESC'
    } else {
        delete newFilters.sort_by
        delete newFilters.sort_direction
    }

    setFilters(newFilters)
  }

  // Handle Filter Change
  const handleFilterChange = (key: string, value: unknown) => {
      const newFilters = { ...filters, [key]: value }
      if (!value) delete newFilters[key]
      setFilters(newFilters)
      setCurrentPage(1)
  }

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
            updated_at: '',
            total_debt: 0,
            debt_count: 0
        })
    }

    setIsSettleModalVisible(true)
  }

  const handleCloseSettleModal = () => {
    setIsSettleModalVisible(false)
    setSettleInitialValues(undefined)
    setSettleInitialCustomer(undefined)
  }

  // Handlers cho modal chốt sổ cuối vụ
  const handleOpenCloseSeasonModal = (record: ExtendedDebtNote) => {
    setSelectedDebtNoteId(record.id)
    setIsCloseSeasonModalVisible(true)
  }

  const handleCloseSeasonModal = () => {
    setIsCloseSeasonModalVisible(false)
    setSelectedDebtNoteId(null)
  }

  // Sử dụng query hooks
  const { data: debtNotesData, isLoading } = useDebtNotesQuery({
    page: currentPage,
    limit: pageSize,
    ...filters
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

  // Lấy thống kê từ API (thay vì tự tính)
  // const debtList = getDebtNoteList() // Không sử dụng, đã comment
  const summary = debtNotesData?.data?.summary
  
  // Sử dụng summary từ API nếu có, fallback về 0 nếu không
  const totalDebt = summary?.total_debt || 0
  const overdueCount = summary?.overdue_count || 0
  const activeCount = summary?.active_count || 0
  const paidCount = summary?.paid_count || 0

  // Cấu hình columns cho DataTable
  const columns: import("antd/es/table").ColumnType<ExtendedDebtNote>[] = [
    {
      key: "code",
      title: (
        <FilterHeader 
            title="Mã phiếu nợ" 
            dataIndex="code" 
            value={filters.code} 
            onChange={(val) => handleFilterChange('code', val)}
            inputType="text"
        />
      ),
      width: 150,
      render: (record: ExtendedDebtNote) => (
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
      render: (record: ExtendedDebtNote) => (
        <div className='font-medium'>
          {record.customer?.name || record.customer_name || "-"}
        </div>
      ),
    },
    {
      key: "season_id",
      title: "Mùa vụ",
      width: 180,
      render: (record: ExtendedDebtNote) => (
        <div>{record.season?.name || record.season_name || "-"}</div>
      ),
    },
    {
      key: "amount",
      dataIndex: "amount",
      title: "Giá trị đơn hiện tại",
      width: 150,
      sorter: true,
      sortOrder: filters.sort_by === 'amount' ? (filters.sort_direction === 'ASC' ? 'ascend' as const : 'descend' as const) : undefined,
      render: (value: number) => (
        <div className='text-blue-600 font-medium'>{formatCurrency(value)}</div>
      ),
    },
    {
      key: "paid_amount",
      dataIndex: "paid_amount",
      title: "Đã trả",
      width: 130,
      sorter: true,
      sortOrder: filters.sort_by === 'paid_amount' ? (filters.sort_direction === 'ASC' ? 'ascend' as const : 'descend' as const) : undefined,
      render: (value: number) => (
        <div className='text-green-600 font-medium'>
          {formatCurrency(value)}
        </div>
      ),
    },
    {
      key: "remaining_amount",
      dataIndex: "remaining_amount",
      title: "Còn nợ",
      width: 130,
      sorter: true,
      sortOrder: filters.sort_by === 'remaining_amount' ? (filters.sort_direction === 'ASC' ? 'ascend' as const : 'descend' as const) : undefined,
      render: (value: number) => (
        <div className='text-red-600 font-bold'>
          {formatCurrency(value)}
        </div>
      ),
    },
    {
      key: "due_date",
      title: "Hạn trả",
      dataIndex: "due_date",
      width: 120,
      ...getDateColumnSearchProps('due_date'),
      filteredValue: (filters.due_date_start && filters.due_date_end) ? [filters.due_date_start as string, filters.due_date_end as string] : undefined,
      render: (value : string) => (
        <div>
          {value
            ? new Date(value).toLocaleDateString("vi-VN")
            : "-"}
        </div>
      ),
    },
    {
      key: "status",
      title: "Trạng thái",
      width: 120,
      filters: [
          { text: "Đang nợ", value: "active" },
          { text: "Quá hạn", value: "overdue" },
          { text: "Đã trả", value: "paid" },
      ],
      filteredValue: filters.status ? [filters.status as string] : undefined,
      filterMultiple: false,
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
        <Space size="small">
          {record.remaining_amount > 0 && record.status !== 'settled' && (
            <Button 
              type="primary" 
              size="small"
              icon={<DollarOutlined />}
              onClick={() => handleOpenSettleModal(record)}
            >
              Thanh toán
            </Button>
          )}
          {record.status === 'settled' ? (
            <Button 
              type="link" 
              size="small"
              icon={<GiftOutlined />}
              onClick={() => handleOpenCloseSeasonModal(record)}
            >
              Xem chi tiết
            </Button>
          ) : (
            <Button 
              type="default" 
              size="small"
              icon={<GiftOutlined />}
              onClick={() => handleOpenCloseSeasonModal(record)}
            >
              Chốt sổ cuối vụ
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className='p-2 md:p-6'>
      <div className='flex justify-between items-center mb-4'>
        <h1 className='text-2xl font-bold'>Quản lý Công nợ</h1>
      </div>

      {/* Season Filter */}
      <div className='mb-4'>
        <ComboBox
          placeholder="Lọc theo mùa vụ"
          value={filters.season_id}
          onChange={(val) => handleFilterChange('season_id', val)}
          onSearch={(text) => setSeasonSearchText(text)} // Gọi API khi nhập
          options={(seasonsData?.data?.items || []).map((season: { id: number; name: string }) => ({
            value: season.id,
            label: season.name
          }))}
          allowClear
          showSearch
          filterOption={false} // Tắt filter local, dùng API search
          style={{ width: 250 }}
        />
      </div>

      {/* Summary Cards - Optimized for Mobile */}
      <Row gutter={[8, 8]} className='mb-6'>
        <Col xs={12} sm={12} md={6}>
          <Card bodyStyle={{ padding: '12px' }}>
            <Statistic
              title='Tổng công nợ'
              value={totalDebt}
              precision={0}
              valueStyle={{ color: "#faad14", fontSize: '18px' }}
              formatter={(value) =>
                new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(Number(value))
              }
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card bodyStyle={{ padding: '12px' }}>
            <Statistic
              title='Quá hạn'
              value={overdueCount}
              suffix='phiếu'
              valueStyle={{ color: "#cf1322", fontSize: '18px' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card bodyStyle={{ padding: '12px' }}>
            <Statistic
              title='Đang nợ'
              value={activeCount}
              suffix='phiếu'
              valueStyle={{ color: "#1890ff", fontSize: '18px' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card bodyStyle={{ padding: '12px' }}>
            <Statistic
              title='Đã trả'
              value={paidCount}
              suffix='phiếu'
              valueStyle={{ color: "#3f8600", fontSize: '18px' }}
            />
          </Card>
        </Col>
      </Row>

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
          }}
          onChange={handleTableChange}
          showSearch={false}
          showFilters={false}
        />
      </div>

      <SettleDebtModal
        open={isSettleModalVisible}
        onCancel={handleCloseSettleModal}
        initialValues={settleInitialValues}
        initialCustomer={settleInitialCustomer}
      />

      <CloseSeasonModal
        open={isCloseSeasonModalVisible}
        debtNoteId={selectedDebtNoteId}
        onClose={handleCloseSeasonModal}
      />
    </div>
  )
}

export default DebtNotesList
