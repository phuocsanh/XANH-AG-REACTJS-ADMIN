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
  useCompleteInventoryReceiptMutation,
  useCancelInventoryReceiptMutation,
  useInventoryStatsQuery,
} from "@/queries/inventory"
import { LoadingSpinner } from "@/components/common"

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

    // Nếu API hỗ trợ lọc theo tên nhà cung cấp
    if (filters.supplier_name) {
       // params.supplierName = filters.supplier_name 
       // Tạm thời chưa biết field chính xác, để lại logic mở
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

  const { data: statsData, isLoading: isLoadingStats } =
    useInventoryStatsQuery()

  // Mutations
  const deleteReceiptMutation = useDeleteInventoryReceiptMutation()
  const approveReceiptMutation = useApproveInventoryReceiptMutation()
  const completeReceiptMutation = useCompleteInventoryReceiptMutation()
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
    if (!value) delete newFilters[key]
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

  const handleCompleteReceipt = async (id: number) => {
    try {
      await completeReceiptMutation.mutateAsync(id)
    } catch (error) {
      console.error("Error completing receipt:", error)
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
      case "Hoàn thành":
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

  // Render hành động cho mỗi phiếu theo đúng nghiệp vụ (4 status: draft, approved, completed, cancelled)
  const renderActions = (record: InventoryReceipt) => {
    const actions = []
    
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
      
      // Hủy
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

    // === APPROVED (Đã duyệt) ===
    else if (statusCode === InventoryReceiptStatus.APPROVED || statusText === "Đã duyệt") {
      // Hoàn thành (nhập kho)
      actions.push(
        <Tooltip key='complete' title='Hoàn thành nhập kho'>
          <Popconfirm
            title='Hoàn thành nhập kho'
            description='Bạn có chắc chắn muốn hoàn thành việc nhập kho cho phiếu này? Hành động này sẽ cập nhật tồn kho.'
            onConfirm={() => handleCompleteReceipt(record.id)}
            okText='Hoàn thành'
            cancelText='Hủy'
          >
            <Button
              type='text'
              icon={<CheckOutlined />}
              style={{ color: "#1890ff" }}
              loading={completeReceiptMutation.isPending}
            />
          </Popconfirm>
        </Tooltip>
      )
      
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

    // === COMPLETED (Hoàn thành) ===
    else if (statusCode === InventoryReceiptStatus.COMPLETED || statusText === "Hoàn thành") {
      // Hủy (để hoàn tác nhập kho)
      actions.push(
        <Tooltip key='cancel' title='Hủy phiếu (Hoàn tác nhập kho)'>
          <Popconfirm
            title='Hủy phiếu nhập hàng'
            description='Hủy phiếu này sẽ trừ tồn kho tương ứng. Bạn có chắc chắn muốn hủy?'
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
      // Xóa (để dọn dẹp)
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

    return <Space size='small'>{actions}</Space>
  }

  // Cấu hình cột cho bảng
  const columns: ColumnsType<InventoryReceipt> = [
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
            dataIndex="supplier_name" 
            value={filters.supplier_name} 
            onChange={(val) => handleFilterChange('supplier_name', val)}
            inputType="text"
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
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      align: "center",
      filters: [
        { text: "Nháp", value: InventoryReceiptStatus.DRAFT },
        { text: "Đã duyệt", value: InventoryReceiptStatus.APPROVED },
        { text: "Hoàn thành", value: InventoryReceiptStatus.COMPLETED },
        { text: "Đã hủy", value: InventoryReceiptStatus.CANCELLED },
      ],
      filteredValue: filters.status ? [filters.status] : null,
      filterMultiple: false,
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
    <div style={{ padding: "24px" }}>
      {/* Header với thống kê */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col span={24}>
          <Title level={2}>Quản lý nhập hàng</Title>
        </Col>

        {/* Thống kê tổng quan */}
        {statsData && (
          <Col span={24}>
            <Row gutter={[8, 8]}>
              {/* Tổng phiếu nhập */}
              <Col xs={6} sm={12} md={6}>
                <Card size="small" bodyStyle={{ padding: '6px 4px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a', marginBottom: '2px' }}>
                    {statsData.totalReceipts}
                  </div>
                  <Text className="text-[10px] md:text-sm" type="secondary">Tổng</Text>
                </Card>
              </Col>
              
              {/* Đã duyệt */}
              <Col xs={6} sm={12} md={6}>
                <Card size="small" bodyStyle={{ padding: '6px 4px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a', marginBottom: '2px' }}>
                    {statsData.approvedReceipts}
                  </div>
                  <Text className="text-[10px] md:text-sm" type="secondary">Duyệt</Text>
                </Card>
              </Col>
              
              {/* Đã hoàn thành */}
              <Col xs={6} sm={12} md={6}>
                <Card size="small" bodyStyle={{ padding: '6px 4px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff', marginBottom: '2px' }}>
                    {statsData.completedReceipts}
                  </div>
                  <Text className="text-[10px] md:text-sm" type="secondary">Xong</Text>
                </Card>
              </Col>
              
              {/* Tổng giá trị */}
              <Col xs={6} sm={12} md={6}>
                <Card size="small" bodyStyle={{ padding: '6px 4px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a', marginBottom: '2px' }}>
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                      notation: "compact",
                      maximumFractionDigits: 0
                    }).format(parseFloat(statsData.totalValue || "0"))}
                  </div>
                  <Text className="text-[10px] md:text-sm" type="secondary">Giá trị</Text>
                </Card>
              </Col>
              
              {/* Nháp - chỉ hiện trên desktop */}
              <Col xs={0} sm={0} md={4.8}>
                <Card size="small" bodyStyle={{ padding: '8px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#8c8c8c', marginBottom: '4px' }}>
                    {statsData.draftReceipts}
                  </div>
                  <Text className="text-xs md:text-sm" type="secondary">Nháp</Text>
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
              onClick={() => refetchReceipts()}
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
    </div>
  )
}

export default InventoryReceiptsList

