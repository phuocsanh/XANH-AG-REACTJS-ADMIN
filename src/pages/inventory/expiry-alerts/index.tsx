/**
 * Trang quản lý lô hàng sắp hết hạn
 * Hiển thị thống kê, danh sách, bộ lọc và chức năng xử lý alert
 */
import { useState } from "react"
import { Table, Tag, Button, Select, Space, Modal, Input, Tooltip, Badge, Popconfirm } from "antd"
import {
  ExclamationCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CheckOutlined,
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import type { ExpiryAlert, ExpiryAlertType, ExpiryAlertStatus } from "@/models/expiry-alert.model"
import {
  useExpiryAlerts,
  useExpiryAlertStats,
  useManualCheckExpiry,
  useResolveExpiryAlert,
  useResolveMultipleAlerts,
} from "@/queries/expiry-alert"

const { Option } = Select
const { TextArea } = Input

/** Nhãn và màu hiển thị theo loại cảnh báo */
const ALERT_TYPE_CONFIG: Record<ExpiryAlertType, { label: string; color: string; icon: React.ReactNode }> = {
  warning: {
    label: "Sắp hết hạn",
    color: "orange",
    icon: <WarningOutlined />,
  },
  critical: {
    label: "Gần hết hạn",
    color: "red",
    icon: <ExclamationCircleOutlined />,
  },
  expired: {
    label: "Đã hết hạn",
    color: "default",
    icon: <CloseCircleOutlined />,
  },
}

/** Card thống kê */
function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string
  value: number
  color: string
  icon: React.ReactNode
}) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl p-4 shadow-sm border"
      style={{ borderColor: color, background: `${color}10` }}
    >
      <div className="text-2xl mb-1" style={{ color }}>
        {icon}
      </div>
      <div className="text-3xl font-bold" style={{ color }}>
        {value}
      </div>
      <div className="text-sm text-gray-500 mt-1 text-center">{label}</div>
    </div>
  )
}

export default function ExpiryAlertsPage() {
  // ===== State bộ lọc =====
  const [filterStatus, setFilterStatus] = useState<ExpiryAlertStatus | undefined>("pending")
  const [filterType, setFilterType] = useState<ExpiryAlertType | undefined>(undefined)
  const [page, setPage] = useState(1)
  const pageSize = 20

  // ===== State dialog xử lý =====
  const [resolveModalOpen, setResolveModalOpen] = useState(false)
  const [resolveNotes, setResolveNotes] = useState("")
  const [resolveTargetId, setResolveTargetId] = useState<number | null>(null)

  // ===== State chọn nhiều =====
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // ===== Queries =====
  const { data: statsData, isLoading: statsLoading } = useExpiryAlertStats()
  const { data: listData, isLoading: listLoading } = useExpiryAlerts({
    status: filterStatus,
    type: filterType,
    page,
    limit: pageSize,
  })

  // ===== Mutations =====
  const manualCheckMutation = useManualCheckExpiry()
  const resolveMutation = useResolveExpiryAlert()
  const resolveMultipleMutation = useResolveMultipleAlerts()

  // ===== Handlers =====

  /** Mở dialog xử lý 1 alert */
  const openResolveModal = (id: number) => {
    setResolveTargetId(id)
    setResolveNotes("")
    setResolveModalOpen(true)
  }

  /** Xác nhận xử lý 1 alert */
  const handleResolveOne = () => {
    if (!resolveTargetId) return
    resolveMutation.mutate(
      { id: resolveTargetId, notes: resolveNotes },
      {
        onSuccess: () => {
          setResolveModalOpen(false)
          setResolveTargetId(null)
          setResolveNotes("")
        },
      }
    )
  }

  /** Xử lý nhiều alert được chọn */
  const handleResolveMultiple = () => {
    if (!selectedIds.length) return
    resolveMultipleMutation.mutate(
      { ids: selectedIds, notes: "Xử lý hàng loạt" },
      { onSuccess: () => setSelectedIds([]) }
    )
  }

  // ===== Columns bảng =====
  const columns: ColumnsType<ExpiryAlert> = [
    {
      title: "Sản phẩm",
      dataIndex: ["product", "name"],
      key: "product_name",
      render: (_, record) => (
        <div>
          <div className="font-medium text-gray-800">{record.product?.name ?? "—"}</div>
          {record.product?.code && (
            <div className="text-xs text-gray-400">Mã: {record.product.code}</div>
          )}
        </div>
      ),
    },
    {
      title: "Mã lô",
      dataIndex: ["batch", "code"],
      key: "batch_code",
      render: (_, record) => (
        <span className="font-mono text-sm">{record.batch?.code ?? `#${record.batch_id}`}</span>
      ),
    },
    {
      title: "Ngày hết hạn",
      dataIndex: "expiry_date",
      key: "expiry_date",
      render: (val: string) => dayjs(val).format("DD/MM/YYYY"),
      sorter: (a, b) => dayjs(a.expiry_date).unix() - dayjs(b.expiry_date).unix(),
    },
    {
      title: "Số ngày còn lại",
      dataIndex: "days_until_expiry",
      key: "days_until_expiry",
      sorter: (a, b) => a.days_until_expiry - b.days_until_expiry,
      render: (days: number) => {
        if (days <= 0) return <span className="text-gray-500 font-semibold">Đã hết hạn</span>
        const color = days <= 60 ? "#ef4444" : "#f97316"
        return <span style={{ color, fontWeight: 600 }}>{days} ngày</span>
      },
    },
    {
      title: "SL còn lại",
      dataIndex: "remaining_quantity",
      key: "remaining_quantity",
      render: (val: number) => <span className="font-medium">{val.toLocaleString()}</span>,
    },
    {
      title: "Mức độ",
      dataIndex: "alert_type",
      key: "alert_type",
      filters: [
        { text: "Sắp hết hạn (< 4 tháng)", value: "warning" },
        { text: "Gần hết hạn (< 2 tháng)", value: "critical" },
        { text: "Đã hết hạn", value: "expired" },
      ],
      render: (type: ExpiryAlertType) => {
        const cfg = ALERT_TYPE_CONFIG[type]
        return (
          <Tag color={cfg.color} icon={cfg.icon}>
            {cfg.label}
          </Tag>
        )
      },
    },
    {
      title: "Đã gửi TB",
      dataIndex: "is_notified",
      key: "is_notified",
      render: (notified: boolean) =>
        notified ? (
          <Tooltip title="Đã gửi push notification">
            <Badge status="success" text="Đã gửi" />
          </Tooltip>
        ) : (
          <Badge status="default" text="Chưa gửi" />
        ),
    },
    {
      title: "Trạng thái",
      dataIndex: "is_resolved",
      key: "is_resolved",
      render: (resolved: boolean) =>
        resolved ? (
          <Tag color="green" icon={<CheckCircleOutlined />}>
            Đã xử lý
          </Tag>
        ) : (
          <Tag color="volcano">Chưa xử lý</Tag>
        ),
    },
    {
      title: "Thao tác",
      key: "actions",
      fixed: "right",
      width: 110,
      render: (_, record) =>
        !record.is_resolved ? (
          <Tooltip title="Đánh dấu đã xử lý lô này">
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => openResolveModal(record.id)}
            >
              Xử lý
            </Button>
          </Tooltip>
        ) : (
          <span className="text-xs text-gray-400 italic">{record.resolution_notes ?? "Đã xử lý"}</span>
        ),
    },
  ]

  return (
    <div className="p-2">
      {/* Tiêu đề trang */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">🏷️ Lô Hàng Sắp Hết Hạn</h1>
          <p className="text-sm text-gray-500">
            Quản lý các lô hàng có hạn dùng dưới 4 tháng. Hệ thống tự động quét lúc <strong>8:00 SA</strong> mỗi ngày.
          </p>
        </div>
        <Popconfirm
          title="Kích hoạt quét thủ công?"
          description="Hệ thống sẽ quét toàn bộ lô hàng và cập nhật cảnh báo ngay lập tức."
          onConfirm={() => manualCheckMutation.mutate()}
          okText="Quét ngay"
          cancelText="Hủy"
        >
          <Button
            icon={<SyncOutlined spin={manualCheckMutation.isPending} />}
            loading={manualCheckMutation.isPending}
          >
            Quét thủ công
          </Button>
        </Popconfirm>
      </div>

      {/* Cards thống kê */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard
          label="Tổng cảnh báo"
          value={statsLoading ? 0 : (statsData?.total ?? 0)}
          color="#6366f1"
          icon="📋"
        />
        <StatCard
          label="Chưa xử lý"
          value={statsLoading ? 0 : (statsData?.pending ?? 0)}
          color="#f59e0b"
          icon={<ExclamationCircleOutlined />}
        />
        <StatCard
          label="Sắp hết hạn (< 4 tháng)"
          value={statsLoading ? 0 : (statsData?.warning ?? 0)}
          color="#f97316"
          icon={<WarningOutlined />}
        />
        <StatCard
          label="Gần hết hạn (< 2 tháng)"
          value={statsLoading ? 0 : (statsData?.critical ?? 0)}
          color="#ef4444"
          icon={<ExclamationCircleOutlined />}
        />
        <StatCard
          label="Đã hết hạn"
          value={statsLoading ? 0 : (statsData?.expired ?? 0)}
          color="#6b7280"
          icon={<CloseCircleOutlined />}
        />
      </div>

      {/* Bộ lọc */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div>
            <span className="text-sm text-gray-500 mr-2">Trạng thái:</span>
            <Select
              value={filterStatus}
              onChange={(val) => { setFilterStatus(val); setPage(1) }}
              style={{ width: 150 }}
              allowClear
              placeholder="Tất cả"
            >
              <Option value="pending">Chưa xử lý</Option>
              <Option value="resolved">Đã xử lý</Option>
            </Select>
          </div>
          <div>
            <span className="text-sm text-gray-500 mr-2">Mức độ:</span>
            <Select
              value={filterType}
              onChange={(val) => { setFilterType(val); setPage(1) }}
              style={{ width: 200 }}
              allowClear
              placeholder="Tất cả mức độ"
            >
              <Option value="warning">⚠️ Sắp hết hạn (60–120 ngày)</Option>
              <Option value="critical">🔴 Gần hết hạn (&lt; 60 ngày)</Option>
              <Option value="expired">❌ Đã hết hạn</Option>
            </Select>
          </div>

          {/* Nút xử lý hàng loạt */}
          {selectedIds.length > 0 && (
            <Popconfirm
              title={`Xử lý ${selectedIds.length} lô hàng được chọn?`}
              onConfirm={handleResolveMultiple}
              okText="Xác nhận"
              cancelText="Hủy"
            >
              <Button
                type="primary"
                danger
                icon={<CheckOutlined />}
                loading={resolveMultipleMutation.isPending}
              >
                Xử lý {selectedIds.length} lô đã chọn
              </Button>
            </Popconfirm>
          )}
        </div>
      </div>

      {/* Bảng danh sách */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <Table<ExpiryAlert>
          rowKey="id"
          columns={columns}
          dataSource={listData?.items ?? []}
          loading={listLoading}
          scroll={{ x: 1000 }}
          rowSelection={{
            selectedRowKeys: selectedIds,
            onChange: (keys) => setSelectedIds(keys as number[]),
            // Chỉ cho phép chọn các alert chưa xử lý
            getCheckboxProps: (record) => ({
              disabled: record.is_resolved,
            }),
          }}
          pagination={{
            current: page,
            pageSize,
            total: listData?.total ?? 0,
            showSizeChanger: false,
            showTotal: (total) => `Tổng ${total} cảnh báo`,
            onChange: (p) => setPage(p),
          }}
          rowClassName={(record) => {
            if (record.alert_type === "expired") return "bg-gray-50"
            if (record.alert_type === "critical") return "bg-red-50"
            return ""
          }}
        />
      </div>

      {/* Modal xử lý một alert */}
      <Modal
        title="✅ Đánh Dấu Lô Hàng Đã Xử Lý"
        open={resolveModalOpen}
        onCancel={() => setResolveModalOpen(false)}
        onOk={handleResolveOne}
        okText="Xác nhận xử lý"
        cancelText="Hủy"
        confirmLoading={resolveMutation.isPending}
      >
        <Space direction="vertical" className="w-full">
          <p className="text-gray-600">
            Nhập ghi chú cách xử lý lô hàng này (bán giảm giá, trả nhà cung cấp, hủy...):
          </p>
          <TextArea
            rows={3}
            placeholder="Ví dụ: Đã bán giảm giá 50%, Trả lại nhà cung cấp ABC..."
            value={resolveNotes}
            onChange={(e) => setResolveNotes(e.target.value)}
          />
        </Space>
      </Modal>
    </div>
  )
}
