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

const { Title, Text } = Typography
const { RangePicker } = DatePicker

const InventoryReceiptsList: React.FC = () => {
  const navigate = useNavigate()

  // State quản lý tìm kiếm và lọc
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<number | undefined>()
  const [supplierFilter, setSupplierFilter] = useState<string>("")
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null
  )
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

    if (searchTerm.trim()) {
      params.code = searchTerm.trim()
    }

    if (statusFilter !== undefined) {
      params.status = statusFilter
    }

    if (supplierFilter !== undefined) {
      // Cần cập nhật lại filter theo supplierId
      // Tạm thời comment lại vì cần cập nhật API để hỗ trợ filter theo supplierId
      // params.supplierId = supplierFilter
    }

    if (dateRange) {
      params.startDate = dateRange[0].format("YYYY-MM-DD")
      params.endDate = dateRange[1].format("YYYY-MM-DD")
    }

    return params
  }, [searchTerm, statusFilter, supplierFilter, dateRange, pagination])

  // Queries
  const {
    data: receiptsData,
    isLoading: isLoadingReceipts,
    error: receiptsError,
    refetch: refetchReceipts,
  } = useInventoryReceiptsQuery(queryParams)

  const { data: statsData, isLoading: isLoadingStats } =
    useInventoryStatsQuery()

  // Mutations
  const deleteReceiptMutation = useDeleteInventoryReceiptMutation()
  const approveReceiptMutation = useApproveInventoryReceiptMutation()
  const completeReceiptMutation = useCompleteInventoryReceiptMutation()
  const cancelReceiptMutation = useCancelInventoryReceiptMutation()

  // Handlers
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleStatusFilterChange = (value: number | undefined) => {
    setStatusFilter(value)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleSupplierFilterChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSupplierFilter(e.target.value)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleDateRangeChange = (
    dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null,
    _dateStrings: [string, string]
  ) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]])
    } else {
      setDateRange(null)
    }
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleTableChange = (page: number, pageSize: number) => {
    setPagination({ page, limit: pageSize })
  }

  const handleViewReceipt = (receipt: InventoryReceipt) => {
    navigate(`/inventory/receipts/${receipt.id}`)
  }

  const handleEditReceipt = (receipt: InventoryReceipt) => {
    navigate(`/inventory/receipts/edit/${receipt.id}`)
  }

  const handleCreateReceipt = () => {
    navigate("/inventory/receipts/create")
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
    // Xác định status enum từ statusText
    let status: InventoryReceiptStatus = InventoryReceiptStatus.DRAFT
    switch (statusText) {
      case "Nháp":
        status = InventoryReceiptStatus.DRAFT
        break
      case "Chờ duyệt":
        status = InventoryReceiptStatus.PENDING
        break
      case "Đã duyệt":
        status = InventoryReceiptStatus.APPROVED
        break
      case "Hoàn thành":
        status = InventoryReceiptStatus.COMPLETED
        break
      case "Đã hủy":
        status = InventoryReceiptStatus.CANCELLED
        break
      default:
        status = InventoryReceiptStatus.DRAFT
    }

    const statusConfig = {
      [InventoryReceiptStatus.DRAFT]: {
        color: "default",
        icon: <EditOutlined />,
      },
      [InventoryReceiptStatus.PENDING]: {
        color: "processing",
        icon: <SyncOutlined spin />,
      },
      [InventoryReceiptStatus.APPROVED]: {
        color: "success",
        icon: <CheckOutlined />,
      },
      [InventoryReceiptStatus.COMPLETED]: {
        color: "success",
        icon: <CheckOutlined />,
      },
      [InventoryReceiptStatus.CANCELLED]: {
        color: "error",
        icon: <CloseOutlined />,
      },
    }

    const config = statusConfig[status] || { color: "default", icon: null }

    return (
      <Tag color={config.color} icon={config.icon}>
        {statusText}
      </Tag>
    )
  }

  // Render hành động cho mỗi phiếu
  const renderActions = (record: InventoryReceipt) => {
    const actions = []

    // Xem chi tiết (luôn có)
    actions.push(
      <Tooltip key='view' title='Xem chi tiết'>
        <Button
          type='text'
          icon={<EyeOutlined />}
          onClick={() => handleViewReceipt(record)}
        />
      </Tooltip>
    )

    // Chỉnh sửa (chỉ khi ở trạng thái DRAFT hoặc PENDING)
    if (record.status === "Nháp" || record.status === "Chờ duyệt") {
      actions.push(
        <Tooltip key='edit' title='Chỉnh sửa'>
          <Button
            type='text'
            icon={<EditOutlined />}
            onClick={() => handleEditReceipt(record)}
          />
        </Tooltip>
      )
    }

    // Duyệt (chỉ khi ở trạng thái PENDING)
    if (record.status === "Chờ duyệt") {
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
    }

    // Hoàn thành (chỉ khi ở trạng thái APPROVED)
    if (record.status === "Đã duyệt") {
      actions.push(
        <Tooltip key='complete' title='Hoàn thành nhập kho'>
          <Popconfirm
            title='Hoàn thành nhập kho'
            description='Bạn có chắc chắn muốn hoàn thành việc nhập kho cho phiếu này?'
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
    }

    // Hủy (chỉ khi ở trạng thái DRAFT, PENDING, hoặc APPROVED)
    if (
      record.status === "Nháp" ||
      record.status === "Chờ duyệt" ||
      record.status === "Đã duyệt"
    ) {
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

    // Xóa (chỉ khi ở trạng thái DRAFT hoặc CANCELLED)
    if (record.status === "Nháp" || record.status === "Đã hủy") {
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
      title: "Mã phiếu",
      dataIndex: "code",
      key: "code",
      width: 120,
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
      title: "Nhà cung cấp",
      dataIndex: "supplierId",
      key: "supplierId",
      width: 200,
      render: (supplierId: number) => {
        // Tạm thời hiển thị ID, sau này sẽ cập nhật để hiển thị tên nhà cung cấp
        return supplierId ? `Nhà cung cấp #${supplierId}` : "-"
      },
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalAmount",
      key: "totalAmount",
      width: 120,
      align: "right",
      render: (amount: string) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(parseFloat(amount || "0")),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      align: "center",
      render: (status: string) => renderStatus(status), // status đã là text rồi, không cần chuyển đổi
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (description: string) => description || "-",
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
  const receipts = receiptsData?.data?.items || []
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
            <Row gutter={16}>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Badge
                    count={statsData.totalReceipts}
                    showZero
                    style={{ backgroundColor: "#52c41a" }}
                  >
                    <div style={{ padding: "8px 0" }}>
                      <Text strong>Tổng phiếu nhập</Text>
                    </div>
                  </Badge>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Badge
                    count={statsData.pendingReceipts}
                    showZero
                    style={{ backgroundColor: "#faad14" }}
                  >
                    <div style={{ padding: "8px 0" }}>
                      <Text strong>Chờ duyệt</Text>
                    </div>
                  </Badge>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Badge
                    count={statsData.completedReceipts}
                    showZero
                    style={{ backgroundColor: "#1890ff" }}
                  >
                    <div style={{ padding: "8px 0" }}>
                      <Text strong>Đã hoàn thành</Text>
                    </div>
                  </Badge>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <div style={{ padding: "8px 0" }}>
                    <Text strong>Tổng giá trị</Text>
                    <br />
                    <Text type='success'>
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(parseFloat(statsData.totalValue || "0"))}
                    </Text>
                  </div>
                </Card>
              </Col>
            </Row>
          </Col>
        )}
      </Row>

      {/* Bộ lọc và tìm kiếm */}
      <Card style={{ marginBottom: "16px" }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Input.Search
              placeholder='Tìm theo mã phiếu...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onSearch={handleSearch}
              allowClear
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder='Lọc theo trạng thái'
              value={statusFilter}
              onChange={handleStatusFilterChange}
              allowClear
              style={{ width: "100%" }}
            >
              <Select.Option value={InventoryReceiptStatus.DRAFT}>
                Nháp
              </Select.Option>
              <Select.Option value={InventoryReceiptStatus.PENDING}>
                Chờ duyệt
              </Select.Option>
              <Select.Option value={InventoryReceiptStatus.APPROVED}>
                Đã duyệt
              </Select.Option>
              <Select.Option value={InventoryReceiptStatus.COMPLETED}>
                Hoàn thành
              </Select.Option>
              <Select.Option value={InventoryReceiptStatus.CANCELLED}>
                Đã hủy
              </Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder='Tìm theo nhà cung cấp...'
              value={supplierFilter}
              onChange={handleSupplierFilterChange}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              format='DD/MM/YYYY'
              placeholder={["Từ ngày", "Đến ngày"]}
              style={{ width: "100%" }}
            />
          </Col>
        </Row>
      </Card>

      {/* Bảng dữ liệu */}
      <Card>
        <div
          style={{
            marginBottom: "16px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Title level={4}>Danh sách phiếu nhập hàng</Title>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetchReceipts()}
              loading={isLoadingReceipts}
            >
              Làm mới
            </Button>
            <Button
              type='primary'
              icon={<PlusOutlined />}
              onClick={handleCreateReceipt}
            >
              Tạo phiếu nhập
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
              onChange: handleTableChange,
              onShowSizeChange: handleTableChange,
            }}
            scroll={{ x: 1200 }}
          />
        )}
      </Card>
    </div>
  )
}

export default InventoryReceiptsList
