// Danh sách phiếu điều chỉnh kho - Simplified version

import React, { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  Card,
  Button,
  Space,
  Typography,
  Input,
  Select,
  Table,
  Tag,
  Tooltip,
  Popconfirm,
} from "antd"
import {
  EyeOutlined,
  DeleteOutlined,
  PlusOutlined,
  CheckOutlined,
  CloseOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"

import { InventoryAdjustment } from "@/models/inventory-adjustment.model"
import {
  useAdjustmentsQuery,
  useDeleteAdjustmentMutation,
  useApproveAdjustmentMutation,
  useCompleteAdjustmentMutation,
  useCancelAdjustmentMutation,
} from "@/queries/inventory-adjustment"
import { LoadingSpinner } from "@/components/common"

const { Title } = Typography

const AdjustmentsList: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string | undefined>()

  const { data: adjustments, isLoading, refetch } = useAdjustmentsQuery()
  const deleteAdjustmentMutation = useDeleteAdjustmentMutation()
  const approveAdjustmentMutation = useApproveAdjustmentMutation()
  const completeAdjustmentMutation = useCompleteAdjustmentMutation()
  const cancelAdjustmentMutation = useCancelAdjustmentMutation()

  const filteredAdjustments = useMemo(() => {
    if (!adjustments) return []
    return adjustments.filter((adj) => {
      if (searchTerm && !adj.code.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }
      if (statusFilter && adj.status !== statusFilter) {
        return false
      }
      return true
    })
  }, [adjustments, searchTerm, statusFilter])

  const renderStatus = (statusText: string) => {
    const statusConfig: Record<string, { color: string }> = {
      "Nháp": { color: "default" },
      "Chờ duyệt": { color: "processing" },
      "Đã duyệt": { color: "success" },
      "Hoàn thành": { color: "success" },
      "Đã hủy": { color: "error" },
    }
    const config = statusConfig[statusText] || { color: "default" }
    return <Tag color={config.color}>{statusText}</Tag>
  }

  const renderActions = (record: InventoryAdjustment) => {
    const actions = []

    actions.push(
      <Tooltip key='view' title='Xem chi tiết'>
        <Button
          type='text'
          icon={<EyeOutlined />}
          onClick={() => navigate(`/inventory/adjustments/${record.id}`)}
        />
      </Tooltip>
    )

    if (record.status === "Nháp") {
      actions.push(
        <Tooltip key='approve' title='Duyệt phiếu'>
          <Popconfirm
            title='Duyệt phiếu điều chỉnh'
            onConfirm={() => approveAdjustmentMutation.mutateAsync(record.id)}
            okText='Duyệt'
            cancelText='Hủy'
          >
            <Button type='text' icon={<CheckOutlined />} style={{ color: "#52c41a" }} />
          </Popconfirm>
        </Tooltip>
      )
    }

    if (record.status === "Đã duyệt") {
      actions.push(
        <Tooltip key='complete' title='Hoàn thành điều chỉnh'>
          <Popconfirm
            title='Hoàn thành điều chỉnh'
            description='Tồn kho sẽ được cập nhật.'
            onConfirm={() => completeAdjustmentMutation.mutateAsync(record.id)}
            okText='Hoàn thành'
            cancelText='Hủy'
          >
            <Button type='text' icon={<CheckOutlined />} style={{ color: "#1890ff" }} />
          </Popconfirm>
        </Tooltip>
      )
    }

    if (record.status === "Nháp" || record.status === "Đã duyệt") {
      actions.push(
        <Tooltip key='cancel' title='Hủy phiếu'>
          <Popconfirm
            title='Hủy phiếu điều chỉnh'
            onConfirm={() => cancelAdjustmentMutation.mutateAsync({ id: record.id, reason: "Hủy bởi người dùng" })}
            okText='Hủy phiếu'
            cancelText='Không'
          >
            <Button type='text' icon={<CloseOutlined />} style={{ color: "#ff4d4f" }} />
          </Popconfirm>
        </Tooltip>
      )
    }

    if (record.status === "Nháp" || record.status === "Đã hủy") {
      actions.push(
        <Tooltip key='delete' title='Xóa phiếu'>
          <Popconfirm
            title='Xóa phiếu điều chỉnh'
            onConfirm={() => deleteAdjustmentMutation.mutateAsync(record.id)}
            okText='Xóa'
            cancelText='Hủy'
          >
            <Button type='text' icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Tooltip>
      )
    }

    return <Space size='small'>{actions}</Space>
  }

  const columns: ColumnsType<InventoryAdjustment> = [
    {
      title: "Mã phiếu",
      dataIndex: "code",
      key: "code",
      width: 180,
      render: (code: string, record: InventoryAdjustment) => (
        <Button
          type='link'
          onClick={() => navigate(`/inventory/adjustments/${record.id}`)}
          style={{ padding: 0, height: "auto" }}
        >
          {code}
        </Button>
      ),
    },
    {
      title: "Loại",
      dataIndex: "adjustment_type",
      key: "adjustment_type",
      width: 100,
      align: "center",
      render: (type: string) => (
        <Tag color={type === "IN" ? "green" : "red"}>
          {type === "IN" ? "Tăng kho" : "Giảm kho"}
        </Tag>
      ),
    },
    {
      title: "Lý do",
      dataIndex: "reason",
      key: "reason",
      ellipsis: true,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
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
      render: (_, record: InventoryAdjustment) => renderActions(record),
    },
  ]

  return (
    <div style={{ padding: "24px" }}>
      <Title level={2}>Quản lý phiếu điều chỉnh kho</Title>

      <Card style={{ marginBottom: "16px" }}>
        <Space>
          <Input.Search
            placeholder='Tìm theo mã phiếu...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
          />
          <Select
            placeholder='Lọc theo trạng thái'
            value={statusFilter}
            onChange={setStatusFilter}
            allowClear
            style={{ width: 200 }}
          >
            <Select.Option value="Nháp">Nháp</Select.Option>
            <Select.Option value="Đã duyệt">Đã duyệt</Select.Option>
            <Select.Option value="Hoàn thành">Hoàn thành</Select.Option>
            <Select.Option value="Đã hủy">Đã hủy</Select.Option>
          </Select>
        </Space>
      </Card>

      <Card>
        <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between" }}>
          <Title level={4}>Danh sách phiếu điều chỉnh</Title>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading}>
              Làm mới
            </Button>
            <Button
              type='primary'
              icon={<PlusOutlined />}
              onClick={() => navigate("/inventory/adjustments/create")}
            >
              Tạo phiếu điều chỉnh
            </Button>
          </Space>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredAdjustments}
            rowKey='id'
            pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true }}
            scroll={{ x: 1000 }}
          />
        )}
      </Card>
    </div>
  )
}

export default AdjustmentsList
