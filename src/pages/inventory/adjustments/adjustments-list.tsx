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
  EditOutlined,
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"

import { InventoryAdjustment } from "@/models/inventory-adjustment.model"
import {
  useAdjustmentsQuery,
  useDeleteAdjustmentMutation,
  useApproveAdjustmentMutation,
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

  const renderStatus = (statusText: string | number) => {
    // Chuẩn hóa status sang string và lowercase nếu là string
    const status = typeof statusText === 'string' ? statusText.toLowerCase() : statusText;

    const statusConfig: Record<string, { color: string, label: string }> = {
      "nháp": { color: "default", label: "Nháp" },
      "draft": { color: "default", label: "Nháp" },
      "0": { color: "default", label: "Nháp" },
      
      "đã duyệt": { color: "success", label: "Đã duyệt" },
      "approved": { color: "success", label: "Đã duyệt" },
      "2": { color: "success", label: "Đã duyệt" },
      
      "đã hủy": { color: "error", label: "Đã hủy" },
      "cancelled": { color: "error", label: "Đã hủy" },
      "4": { color: "error", label: "Đã hủy" },
      
    }

    // Tìm config dựa trên status (string)
    const config = statusConfig[String(status)] || { color: "default", label: String(statusText) }
    return <Tag color={config.color}>{config.label}</Tag>
  }

  const renderActions = (record: InventoryAdjustment) => {
    const actions = []
    const status = typeof record.status === 'string' ? record.status.toLowerCase() : String(record.status);
    const isDraft = status === 'nháp' || status === 'draft' || status === '0';
    const isApproved = status === 'đã duyệt' || status === 'approved' || status === '2';
    const isCancelled = status === 'đã hủy' || status === 'cancelled' || status === '4';

    actions.push(
      <Tooltip key='view' title='Xem chi tiết'>
        <Button
          type='text'
          icon={<EyeOutlined />}
          onClick={() => navigate(`/inventory/adjustments/${record.id}`)}
        />
      </Tooltip>
    )

    if (isDraft) {
      actions.push(
        <Tooltip key='edit' title='Chỉnh sửa'>
          <Button
            type='text'
            icon={<EditOutlined />}
            style={{ color: "#1890ff" }}
            onClick={() => navigate(`/inventory/adjustments/${record.id}/edit`)}
          />
        </Tooltip>
      )
    }

    if (isDraft) {
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

    if (isApproved) {
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

    if (isDraft || isCancelled) {
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
