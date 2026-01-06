import React, { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Typography,
  Input,
  Select,
  DatePicker,
  Table,
  Tag,
  Tooltip,
  Popconfirm,
  Badge,
} from "antd"
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SyncOutlined,
  CheckOutlined,
  CloseOutlined,
  ReloadOutlined,
  SearchOutlined,
  DollarOutlined,
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"

import {
  InventoryReceipt,
  InventoryReceiptStatus,
  InventoryReceiptListParams,
  mapApiResponseToInventoryReceipt,
} from "@/models/inventory.model"
import {
  useInventoryReceiptsQuery,
  useDeleteInventoryReceiptMutation,
  useApproveInventoryReceiptMutation,
  useCancelInventoryReceiptMutation,
  useInventoryStatsQuery,
} from "@/queries/inventory"
import { useSupplierSearch } from "@/queries/supplier"
import { LoadingSpinner } from "@/components/common"
import PaymentHistoryModal from "@/components/inventory/PaymentHistoryModal"

import FilterHeader from '@/components/common/filter-header'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

const InventoryReceiptsList: React.FC = () => {
  const navigate = useNavigate()

  // State quản lý tìm kiếm và lọc
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  })
  const [selectedReceiptForPayment, setSelectedReceiptForPayment] = useState<any>(null)

  // State tìm kiếm nhà cung cấp cho Filter ComboBox
  const [searchTermSupplier, setSearchTermSupplier] = useState("")
  const { data: suppliersData, isLoading: isLoadingSuppliers } = useSupplierSearch(searchTermSupplier, 20, true)

  const supplierOptions = useMemo(() => {
    if (!suppliersData?.pages) return []
    const uniqueSuppliers = new Map();
    suppliersData.pages.forEach(page => {
        page.data.forEach((s: any) => {
            if (s.id && !uniqueSuppliers.has(s.id)) {
                uniqueSuppliers.set(s.id, {
                    value: s.id, 
                    label: s.name
                })
            }
        })
    })
    return Array.from(uniqueSuppliers.values());
  }, [suppliersData])

  // Tạo params cho API call
  const queryParams = useMemo<InventoryReceiptListParams>(() => {
    const params: InventoryReceiptListParams = {
      limit: pagination.limit,
      offset: (pagination.page - 1) * pagination.limit,
    }

    if (filters.code) {
      params.code = filters.code
    }

    if (filters.status) {
      params.status = filters.status
    }

    // Filter theo ID nhà cung cấp
    if (filters.supplier_id) {
       params.supplier_id = filters.supplier_id 
    }

    if (filters.start_date && filters.end_date) {
      params.startDate = filters.start_date
      params.endDate = filters.end_date
    }

    return params
  }, [filters, pagination])

  // Queries
  const {
    data: receiptsData,
    isLoading: isLoadingReceipts,
    error: receiptsError,
    refetch: refetchReceipts,
  } = useInventoryReceiptsQuery(queryParams)

  // Map API response data to InventoryReceipt type
  const mappedReceipts = useMemo(() => {
    if (!receiptsData?.data?.items) return []
    return receiptsData.data.items.map(mapApiResponseToInventoryReceipt)
  }, [receiptsData])

  const { data: statsData, isLoading: isLoadingStats, refetch: refetchStats } =
    useInventoryStatsQuery()

  // Mutations
  const deleteReceiptMutation = useDeleteInventoryReceiptMutation()
  const approveReceiptMutation = useApproveInventoryReceiptMutation()
  const cancelReceiptMutation = useCancelInventoryReceiptMutation()

  // Handlers
  const handleTableChange = (
    newPagination: any,
    tableFilters: any,
    sorter: any
  ) => {
    setPagination((prev) => ({
      ...prev,
      page: newPagination.current || 1,
      limit: newPagination.pageSize || 10,
    }))

    const newFilters = { ...filters }

    // Status Filter
    if (tableFilters.status && tableFilters.status.length > 0) {
      newFilters.status = tableFilters.status[0]
    } else {
      delete newFilters.status
    }

    // Created At Filter
    if (tableFilters.created_at && tableFilters.created_at.length === 2) {
      newFilters.start_date = tableFilters.created_at[0]
      newFilters.end_date = tableFilters.created_at[1]
    } else {
      delete newFilters.start_date
      delete newFilters.end_date
    }

    setFilters(newFilters)
  }

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value }
    if (!value && value !== 0) delete newFilters[key] // Fix: cho phép value = 0 (nếu ID start from 0)
    setFilters(newFilters)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleCreateReceipt = () => {
    navigate("/inventory/receipts/create")
  }

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

  // Action handlers...
  const handleViewReceipt = (receipt: InventoryReceipt) => {
    navigate(`/inventory/receipt/${receipt.id}`)
  }

  const handleEditReceipt = (receipt: InventoryReceipt) => {
    navigate(`/inventory/receipts/edit/${receipt.id}`)
  }

  const handleDeleteReceipt = async (id: number) => {
    try {
      await deleteReceiptMutation.mutateAsync(id)
    } catch (error) {
      console.error("Error deleting receipt:", error)
    }
  }

  const handleApproveReceipt = async (id: number) => {
    try {
      await approveReceiptMutation.mutateAsync(id)
    } catch (error) {
      console.error("Error approving receipt:", error)
    }
  }

  const handleCancelReceipt = async (id: number) => {
    try {
      await cancelReceiptMutation.mutateAsync(id)
    } catch (error) {
      console.error("Error canceling receipt:", error)
    }
  }

  // Render trạng thái
  const renderStatus = (statusText: string) => {
    const statusStr = statusText
    let color = "default"
    
    switch (statusStr) {
      case "Nháp":
        color = "default"
        break
      case "Chờ duyệt":
        color = "processing"
        break
      case "Đã duyệt":
        color = "success"
        break
      case "Đã hủy":
        color = "error"
        break
      default:
        color = "default"
    }

    return (
      <Tag color={color}>
        {statusText}
      </Tag>
    )
  }

  // Render hành động cho mỗi phiếu theo đúng nghiệp vụ (3 status: draft, approved, cancelled)
  const renderActions = (record: InventoryReceipt) => {
    const actions = []
    
    // Xem chi tiết
    actions.push(
      <Tooltip key='view' title='Xem chi tiết'>
        <Button
          type='text'
          icon={<EyeOutlined />}
          onClick={() => handleViewReceipt(record)}
        />
      </Tooltip>
    )

    // Lịch sử thanh toán (luôn có)

    actions.push(
      <Tooltip key='payment' title='Lịch sử thanh toán'>
        <Button
          type='text'
          icon={<DollarOutlined />}
          onClick={() => setSelectedReceiptForPayment(record)}
        />
      </Tooltip>
    )
    
    // Ưu tiên dùng status_code nếu có, nếu không thì dùng status text
    // Normalize về lowercase để so sánh
    const statusCode = record.status_code?.toLowerCase() || ''
    const statusText = record.status // Text hiển thị: "Nháp", "Đã duyệt", ...

    // === DRAFT (Nháp) ===
    if (statusCode === InventoryReceiptStatus.DRAFT || statusText === "Nháp") {
      // Sửa
      actions.push(
        <Tooltip key='edit' title='Chỉnh sửa'>
          <Button
            type='text'
            icon={<EditOutlined />}
            onClick={() => handleEditReceipt(record)}
          />
        </Tooltip>
      )
      
      // Duyệt (draft có thể duyệt trực tiếp)
      actions.push(
        <Tooltip key='approve' title='Duyệt phiếu'>
          <Popconfirm
            title='Duyệt phiếu nhập hàng'
            description='Bạn có chắc chắn muốn duyệt phiếu nhập hàng này?'
            onConfirm={() => handleApproveReceipt(record.id)}
            okText='Duyệt'
            cancelText='Hủy'
          >
            <Button
              type='text'
              icon={<CheckOutlined />}
              style={{ color: "#52c41a" }}
              loading={approveReceiptMutation.isPending}
            />
          </Popconfirm>
        </Tooltip>
      )
      
      // Xóa
      actions.push(
        <Tooltip key='delete' title='Xóa phiếu'>
          <Popconfirm
            title='Xóa phiếu nhập hàng'
            description='Bạn có chắc chắn muốn xóa phiếu nhập hàng này? Hành động này không thể hoàn tác.'
            onConfirm={() => handleDeleteReceipt(record.id)}
            okText='Xóa'
            cancelText='Hủy'
          >
            <Button
              type='text'
              icon={<DeleteOutlined />}
              danger
              loading={deleteReceiptMutation.isPending}
            />
          </Popconfirm>
        </Tooltip>
      )
    }

    // === APPROVED (Đã duyệt) ===
    else if (statusCode === InventoryReceiptStatus.APPROVED || statusText === "Đã duyệt") {
      // Hủy (nếu có vấn đề)
      actions.push(
        <Tooltip key='cancel' title='Hủy phiếu'>
          <Popconfirm
            title='Hủy phiếu nhập hàng'
            description='Bạn có chắc chắn muốn hủy phiếu nhập hàng này?'
            onConfirm={() => handleCancelReceipt(record.id)}
            okText='Hủy phiếu'
            cancelText='Không'
          >
            <Button
              type='text'
              icon={<CloseOutlined />}
              style={{ color: "#ff4d4f" }}
              loading={cancelReceiptMutation.isPending}
            />
          </Popconfirm>
        </Tooltip>
      )
    }

    // === CANCELLED (Đã hủy) ===
    else if (statusCode === InventoryReceiptStatus.CANCELLED || statusText === "Đã hủy") {
      // Chỉ cho phép xóa nếu chưa từng approved (chưa tác động kho)
      if (!(record as any).approved_at) {
        actions.push(
        <Tooltip key='delete' title='Xóa phiếu'>
          <Popconfirm
            title='Xóa phiếu nhập hàng'
            description='Bạn có chắc chắn muốn xóa phiếu nhập hàng này? Hành động này không thể hoàn tác.'
            onConfirm={() => handleDeleteReceipt(record.id)}
            okText='Xóa'
            cancelText='Hủy'
          >
            <Button
              type='text'
              icon={<DeleteOutlined />}
              danger
              loading={deleteReceiptMutation.isPending}
            />
          </Popconfirm>
        </Tooltip>
      )
      }
    }

    return <Space size='small'>{actions}</Space>
  }

  // Cấu hình cột cho bảng
  const columns: ColumnsType<InventoryReceipt> = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      align: 'center',
      render: (_: unknown, __: InventoryReceipt, index: number) => {
        // Tính STT dựa trên trang hiện tại và pageSize
        const stt = (pagination.page - 1) * pagination.limit + index + 1;
        return <div className='font-medium text-gray-600'>{stt}</div>;
      },
    },
    {
      title: (
        <FilterHeader 
            title="Mã phiếu" 
            dataIndex="code" 
            value={filters.code} 
            onChange={(val) => handleFilterChange('code', val)}
            inputType="text"
        />
      ),
      dataIndex: "code",
      key: "code",
      width: 180,
      render: (code: string, record: InventoryReceipt) => (
        <Button
          type='link'
          onClick={() => handleViewReceipt(record)}
          style={{ padding: 0, height: "auto" }}
        >
          {code}
        </Button>
      ),
    },
    {
      title: (
        <FilterHeader 
            title="Nhà cung cấp" 
            dataIndex="supplier_id" 
            value={filters.supplier_id} 
            onChange={(val) => handleFilterChange('supplier_id', val)}
            inputType="combobox"
            comboBoxProps={{
                placeholder: "Tìm nhà cung cấp...",
                data: supplierOptions,
                onSearch: setSearchTermSupplier,
                loading: isLoadingSuppliers,
                allowClear: true,
                filterOption: false,
            }}
        />
      ),
      dataIndex: "supplier_id",
      key: "supplier_id",
      width: 200,
      render: (_: number, record: InventoryReceipt) => {
        return record.supplier?.name || record.supplier_name || (record.supplier_id ? `Nhà cung cấp #${record.supplier_id}` : "-")
      },
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_amount",
      key: "total_amount",
      width: 150,
      align: "right",
      render: (amount: number) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(amount),
    },
    {
      title: "Tiền trả hàng",
      dataIndex: "returned_amount",
      key: "returned_amount",
      width: 150,
      align: "right",
      render: (amount: number) => (
        <Text style={{ color: amount > 0 ? '#ff4d4f' : '#8c8c8c' }}>
          {amount > 0 ? '-' : ''}
          {new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
          }).format(amount || 0)}
        </Text>
      ),
    },
    {
      title: "Đã thanh toán",
      dataIndex: "paid_amount",
      key: "paid_amount",
      width: 150,
      align: "right",
      render: (amount: number) => (
        <Text style={{ color: '#1890ff' }}>
          {new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
          }).format(amount || 0)}
        </Text>
      ),
    },
    {
      title: "Còn nợ",
      dataIndex: "debt_amount",
      key: "debt_amount",
      width: 150,
      align: "right",
      render: (amount: number) => (
        <Text style={{ color: amount > 0 ? '#ff4d4f' : '#52c41a' }}>
          {new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
          }).format(amount || 0)}
        </Text>
      ),
    },
    {
      title: "TT Thanh toán",
      dataIndex: "payment_status",
      key: "payment_status",
      width: 150,
      filters: [
        { text: 'Chưa thanh toán', value: 'unpaid' },
        { text: 'Thanh toán một phần', value: 'partial' },
        { text: 'Đã thanh toán', value: 'paid' },
      ],
      render: (status: string) => {
        if (status === 'paid') return <Tag color="success">Đã thanh toán</Tag>
        if (status === 'partial') return <Tag color="warning">Một phần</Tag>
        if (status === 'unpaid') return <Tag color="error">Chưa TT</Tag>
        return <Tag>-</Tag>
      },
    },
    {
      title: (
        <FilterHeader 
            title="Trạng thái" 
            value={filters.status} 
            onChange={(val) => handleFilterChange('status', val)}
            inputType="select"
            options={[
              { label: "Nháp", value: InventoryReceiptStatus.DRAFT },
              { label: "Đã duyệt", value: InventoryReceiptStatus.APPROVED },
              { label: "Đã hủy", value: InventoryReceiptStatus.CANCELLED },
            ]}
        />
      ),
      dataIndex: "status",
      key: "status",
      width: 150,
      align: "center",
      render: (status: string) => renderStatus(status),
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      width: 150,
      ...getDateColumnSearchProps('created_at'),
      filteredValue: (filters.start_date && filters.end_date) ? [filters.start_date, filters.end_date] : null,
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Mô tả",
      dataIndex: "notes",
      key: "notes",
      ellipsis: true,
      render: (notes: string) => notes || "-",
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 180,
      align: "center",
      render: (_, record: InventoryReceipt) => renderActions(record),
    },
  ]

  // Lấy danh sách phiếu từ API response
  const receipts = mappedReceipts
  const total = receiptsData?.data?.total || 0

  if (receiptsError) {
    return (
      <Card>
        <Text type='danger'>
          Lỗi khi tải danh sách phiếu nhập hàng: {receiptsError.message}
        </Text>
      </Card>
    )
  }

  return (
    <div className="p-2 md:p-6">
      {/* Header với thống kê */}
      <Row gutter={[8, 16]} style={{ marginBottom: "24px" }}>
        <Col span={24}>
          <Title level={4} className="md:text-2xl">Quản lý nhập hàng</Title>
        </Col>

        {/* Thống kê tổng quan */}
        {statsData && (
          <Col span={24}>
            <Row gutter={[4, 4]}>
              {/* Tổng phiếu nhập */}
              <Col xs={8} sm={8} md={8}>
                <Card size="small" bodyStyle={{ padding: '4px 2px', textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a' }}>
                    {statsData.totalReceipts}
                  </div>
                  <Text className="text-[10px] block" type="secondary">Tổng</Text>
                </Card>
              </Col>
              
              {/* Đã duyệt */}
              <Col xs={8} sm={8} md={8}>
                <Card size="small" bodyStyle={{ padding: '4px 2px', textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a' }}>
                    {statsData.approvedReceipts}
                  </div>
                  <Text className="text-[10px] block" type="secondary">Duyệt</Text>
                </Card>
              </Col>
              
              {/* Nháp */}
              <Col xs={8} sm={8} md={8}>
                <Card size="small" bodyStyle={{ padding: '4px 2px', textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#8c8c8c' }}>
                    {statsData.draftReceipts}
                  </div>
                  <Text className="text-[10px] block" type="secondary">Nháp</Text>
                </Card>
              </Col>
              
              {/* Tổng giá trị */}
              <Col xs={8} sm={8} md={8}>
                <Card size="small" bodyStyle={{ padding: '4px 2px', textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a' }}>
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                      notation: "compact",
                      maximumFractionDigits: 1
                    }).format(parseFloat(statsData.totalValue || "0"))}
                  </div>
                  <Text className="text-[10px] block" type="secondary">Giá trị</Text>
                </Card>
              </Col>

              {/* Số phiếu nợ NCC */}
              <Col xs={8} sm={8} md={8}>
                <Card size="small" bodyStyle={{ padding: '4px 2px', textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ff4d4f' }}>
                    {receipts?.filter(r => 
                      r.status === 'Đã duyệt' && (Number(r.debt_amount) || 0) > 0
                    ).length || 0}
                  </div>
                  <Text className="text-[10px] block" type="secondary">Phiếu nợ</Text>
                </Card>
              </Col>

              {/* Tổng nợ NCC */}
              <Col xs={8} sm={8} md={8}>
                <Card size="small" bodyStyle={{ padding: '4px 2px', textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ff4d4f' }}>
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                      notation: "compact",
                      maximumFractionDigits: 1
                    }).format(receipts?.filter(r => r.status === 'Đã duyệt')
                      .reduce((sum, r) => sum + (Number(r.debt_amount) || 0), 0) || 0)}
                  </div>
                  <Text className="text-[10px] block" type="secondary">Tổng nợ</Text>
                </Card>
              </Col>
            </Row>
          </Col>
        )}
      </Row>

      {/* Bảng dữ liệu */}
      <Card>
        <div
          style={{
            marginBottom: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            <span className="hidden md:inline">Danh sách phiếu nhập hàng</span>
            <span className="md:hidden">Phiếu nhập hàng</span>
          </Title>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                refetchReceipts()
                refetchStats()
              }}
              loading={isLoadingReceipts}
            >
              <span className="hidden sm:inline">Làm mới</span>
            </Button>
            <Button
              type='primary'
              icon={<PlusOutlined />}
              onClick={handleCreateReceipt}
            >
              <span className="hidden sm:inline">Tạo phiếu nhập</span>
              <span className="sm:hidden">Tạo</span>
            </Button>
          </Space>
        </div>

        {isLoadingReceipts || isLoadingStats ? (
          <LoadingSpinner />
        ) : (
          <Table
            columns={columns}
            dataSource={receipts}
            rowKey='id'
            pagination={{
              current: pagination.page,
              pageSize: pagination.limit,
              total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} phiếu nhập`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 1200 }}
          />
        )}
      </Card>

      {/* Payment History Modal */}
      {selectedReceiptForPayment && (
        <PaymentHistoryModal
          receiptId={selectedReceiptForPayment.id}
          receiptCode={selectedReceiptForPayment.code}
          debtAmount={selectedReceiptForPayment.debt_amount || 0}
          totalAmount={selectedReceiptForPayment.total_amount || 0}
          returnedAmount={selectedReceiptForPayment.returned_amount || 0}
          finalAmount={selectedReceiptForPayment.final_amount || selectedReceiptForPayment.total_amount || 0}
          paidAmount={selectedReceiptForPayment.paid_amount || 0}
          supplierId={selectedReceiptForPayment.supplier_id}
          supplierName={selectedReceiptForPayment.supplier?.name}
          receiptStatus={selectedReceiptForPayment.status}
          open={!!selectedReceiptForPayment}
          onClose={() => setSelectedReceiptForPayment(null)}
        />
      )}
    </div>
  )
}

export default InventoryReceiptsList

