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
} from "antd"
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  CheckOutlined,
  CloseOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import { getReturnStatusText } from '@/models/inventory-return.model'

import {
  InventoryReturn,
  ReturnStatus,
} from "@/models/inventory-return.model"
import {
  useReturnsQuery,
  useDeleteReturnMutation,
  useApproveReturnMutation,
  useCancelReturnMutation,
} from "@/queries/inventory-return"
import { useSuppliersQuery } from "@/queries/supplier"
import { LoadingSpinner } from "@/components/common"
import FilterHeader from "@/components/common/filter-header"

const { Title, Text } = Typography
const { RangePicker } = DatePicker

const ReturnsList: React.FC = () => {
  const navigate = useNavigate()

  // State quản lý tìm kiếm và lọc
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  })

  // Queries
  const { data: returns, isLoading, error, refetch } = useReturnsQuery()
  const { data: suppliersData } = useSuppliersQuery({ limit: 1000 })

  // Mutations
  const deleteReturnMutation = useDeleteReturnMutation()
  const approveReturnMutation = useApproveReturnMutation()
  const cancelReturnMutation = useCancelReturnMutation()

  // Filter data
  const filteredReturns = useMemo(() => {
    if (!returns) return []
    
    return returns.filter((ret) => {
      if (searchTerm && !ret.code.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }
      if (statusFilter && ret.status !== statusFilter) {
        return false
      }
      return true
    })
  }, [returns, searchTerm, statusFilter])

  // Paginated data
  const paginatedReturns = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit
    const end = start + pagination.limit
    return filteredReturns.slice(start, end)
  }, [filteredReturns, pagination])

  // Handlers
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleStatusFilterChange = (value: string | undefined) => {
    setStatusFilter(value)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleTableChange = (page: number, pageSize: number) => {
    setPagination({ page, limit: pageSize })
  }

  const handleViewReturn = (returnItem: InventoryReturn) => {
    navigate(`/inventory/returns/${returnItem.id}`)
  }

  const handleEditReturn = (returnItem: InventoryReturn) => {
    navigate(`/inventory/returns/edit/${returnItem.id}`)
  }

  const handleCreateReturn = () => {
    navigate("/inventory/returns/create")
  }

  const handleDeleteReturn = async (id: number) => {
    try {
      await deleteReturnMutation.mutateAsync(id)
    } catch (error) {
      console.error("Error deleting return:", error)
    }
  }

  const handleApproveReturn = async (id: number) => {
    try {
      await approveReturnMutation.mutateAsync(id)
    } catch (error) {
      console.error("Error approving return:", error)
    }
  }

  const handleCancelReturn = async (id: number, reason: string) => {
    try {
      await cancelReturnMutation.mutateAsync({ id, reason })
    } catch (error) {
      console.error("Error canceling return:", error)
    }
  }

  // Render trạng thái
  const renderStatus = (statusCode: string) => {
    // Convert status code sang tiếng Việt (dùng function đã import)
    const statusText = getReturnStatusText(statusCode);
    
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      "Nháp": { color: "default", icon: <EditOutlined /> },
      "Đã duyệt": { color: "success", icon: <CheckOutlined /> },
      "Đã hủy": { color: "error", icon: <CloseOutlined /> },
    }

    const config = statusConfig[statusText] || { color: "default", icon: null }

    return (
      <Tag color={config.color} icon={config.icon}>
        {statusText}
      </Tag>
    )
  }

  // Render hành động cho mỗi phiếu
  const renderActions = (record: InventoryReturn) => {
    const actions = []

    // Xem chi tiết (luôn có)
    actions.push(
      <Tooltip key='view' title='Xem chi tiết'>
        <Button
          type='text'
          icon={<EyeOutlined />}
          onClick={() => handleViewReturn(record)}
        />
      </Tooltip>
    )

    // Chỉnh sửa (chỉ khi ở trạng thái Nháp)
    if (record.status === 'draft') {
      actions.push(
        <Tooltip key='edit' title='Chỉnh sửa'>
          <Button
            type='text'
            icon={<EditOutlined />}
            onClick={() => handleEditReturn(record)}
          />
        </Tooltip>
      )
    }

    // Duyệt (chỉ khi ở trạng thái Nháp)
    if (record.status === 'draft') {
      actions.push(
        <Tooltip key='approve' title='Duyệt phiếu'>
          <Popconfirm
            title='Duyệt phiếu trả hàng'
            description='Bạn có chắc chắn muốn duyệt phiếu trả hàng này?'
            onConfirm={() => handleApproveReturn(record.id)}
            okText='Duyệt'
            cancelText='Hủy'
          >
            <Button
              type='text'
              icon={<CheckOutlined />}
              style={{ color: "#52c41a" }}
              loading={approveReturnMutation.isPending}
            />
          </Popconfirm>
        </Tooltip>
      )
    }

    // Hủy (chỉ khi ở trạng thái Đã duyệt)
    if (record.status === 'approved') {
      actions.push(
        <Tooltip key='cancel' title='Hủy phiếu'>
          <Popconfirm
            title='Hủy phiếu trả hàng'
            description='Bạn có chắc chắn muốn hủy phiếu trả hàng này?'
            onConfirm={() => handleCancelReturn(record.id, "Hủy bởi người dùng")}
            okText='Hủy phiếu'
            cancelText='Không'
          >
            <Button
              type='text'
              icon={<CloseOutlined />}
              style={{ color: "#ff4d4f" }}
              loading={cancelReturnMutation.isPending}
            />
          </Popconfirm>
        </Tooltip>
      )
    }

    // Xóa (chỉ khi ở trạng thái Nháp hoặc Đã hủy và chưa từng duyệt)
    if (record.status === 'draft' || (record.status === 'cancelled' && !(record as any).approved_at)) {
      actions.push(
        <Tooltip key='delete' title='Xóa phiếu'>
          <Popconfirm
            title='Xóa phiếu trả hàng'
            description='Bạn có chắc chắn muốn xóa phiếu trả hàng này? Hành động này không thể hoàn tác.'
            onConfirm={() => handleDeleteReturn(record.id)}
            okText='Xóa'
            cancelText='Hủy'
          >
            <Button
              type='text'
              icon={<DeleteOutlined />}
              danger
              loading={deleteReturnMutation.isPending}
            />
          </Popconfirm>
        </Tooltip>
      )
    }

    return <Space size='small'>{actions}</Space>
  }

  // Cấu hình cột cho bảng
  const columns: ColumnsType<InventoryReturn> = [
    {
      title: (
        <FilterHeader
          title="Mã phiếu"
          value={searchTerm}
          onChange={setSearchTerm}
        />
      ),
      dataIndex: "code",
      key: "code",
      width: 180,
      render: (code: string, record: InventoryReturn) => (
        <Button
          type='link'
          onClick={() => handleViewReturn(record)}
          style={{ padding: 0, height: "auto" }}
        >
          {code}
        </Button>
      ),
    },
    {
      title: "Nhà cung cấp",
      dataIndex: "supplier_name",
      key: "supplier_name",
      render: (_: string, record: InventoryReturn) => {
        if (record.supplier_name) return record.supplier_name
        
        if (record.supplier_id && suppliersData?.data?.items) {
          const supplier = suppliersData.data.items.find(s => s.id === record.supplier_id)
          if (supplier) return supplier.name
        }
        
        return record.supplier_id ? `Nhà cung cấp #${record.supplier_id}` : "-"
      },
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_amount",
      key: "total_amount",
      align: "right",
      render: (amount: string) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(parseFloat(amount)),
    },
    {
      title: "Lý do",
      dataIndex: "reason",
      key: "reason",
      ellipsis: true,
      render: (reason: string) => reason || "-",
    },
    {
      title: (
        <FilterHeader
          title="Trạng thái"
          value={statusFilter}
          onChange={setStatusFilter}
          inputType="select"
          options={[
             { value: 'draft', label: 'Nháp' },
             { value: 'approved', label: 'Đã duyệt' },
             { value: 'cancelled', label: 'Đã hủy' }
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
      width: 120,
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 180,
      align: "center",
      render: (_, record: InventoryReturn) => renderActions(record),
    },
  ]

  if (error) {
    return (
      <Card>
        <Text type='danger'>
          Lỗi khi tải danh sách phiếu trả hàng: {error.message}
        </Text>
      </Card>
    )
  }

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col span={24}>
          <Title level={2}>Quản lý phiếu trả hàng</Title>
        </Col>
      </Row>



      {/* Bảng dữ liệu */}
      <Card>
        <div
          style={{
            marginBottom: "16px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Title level={4}>Danh sách phiếu trả hàng</Title>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
              loading={isLoading}
            >
              Làm mới
            </Button>
            <Button
              type='primary'
              icon={<PlusOutlined />}
              onClick={handleCreateReturn}
            >
              Tạo phiếu trả hàng
            </Button>
          </Space>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <Table
            columns={columns}
            dataSource={paginatedReturns}
            rowKey='id'
            pagination={{
              current: pagination.page,
              pageSize: pagination.limit,
              total: filteredReturns.length,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} phiếu trả hàng`,
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

export default ReturnsList
