import React, { useState } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Typography,
  Tag,
  Table,
  Popconfirm,
  Alert,
  Spin,
  Descriptions,
  Tabs,
  Badge,
  Tooltip,
  InputNumber,
  Avatar,
} from "antd"
import DataTable from "@/components/common/data-table"
import NumberInput from "@/components/common/number-input"
import {
  ArrowLeftOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  PrinterOutlined,
  HistoryOutlined,
  DeleteOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  ShoppingOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  UserOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import { toast } from "react-toastify"

import {
  InventoryReceiptItem,
  InventoryReceiptStatus,
  normalizeReceiptStatus,
  getInventoryReceiptStatusText,
  InventoryReceiptLog,
} from "@/models/inventory.model"
import {
  useInventoryReceiptQuery,
  useApproveInventoryReceiptMutation,
  useCancelInventoryReceiptMutation,
  useInventoryReceiptLogsQuery,
  useDeleteInventoryReceiptMutation,
  useInventoryReceiptHistoryQuery,
  useUpdateInventoryReceiptItemMutation,
} from "@/queries/inventory"
import ReceiptImageUpload from "@/components/inventory/ReceiptImageUpload"
import PaymentTab from "@/components/inventory/PaymentTab"
import InventoryReceiptDetailSkeleton from "@/components/inventory/InventoryReceiptDetailSkeleton"

const { Title, Text } = Typography
const { TabPane } = Tabs

const InventoryReceiptDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const receiptId = Number(id)

  // Xác định tab mặc định từ state
  const defaultTab = (location.state as any)?.activeTab || "info"
  const [activeTab, setActiveTab] = useState(defaultTab)

  // Queries
  const {
    data: receipt,
    isLoading: isLoadingReceipt,
    error: receiptError,
    refetch: refetchReceipt,
  } = useInventoryReceiptQuery(receiptId)

  const { data: historyData, isLoading: isLoadingHistory } =
    useInventoryReceiptHistoryQuery(receiptId)
  const { data: auditLogs, isLoading: isLoadingAudit } =
    useInventoryReceiptLogsQuery(receiptId)

  // Chuẩn hóa trạng thái
  const normalizedStatus = receipt
    ? normalizeReceiptStatus(receipt.status_code || receipt.status)
    : InventoryReceiptStatus.DRAFT

  // Items từ receipt
  const items = receipt?.items || []

  const hasMissingTaxSellingPrice = (
    record: InventoryReceiptItem,
    nextTaxableQuantity?: number,
  ) => {
    const taxableQuantity =
      nextTaxableQuantity !== undefined
        ? Number(nextTaxableQuantity || 0)
        : Number(record.taxable_quantity || 0)

    return (
      taxableQuantity > 0 && Number(record.tax_selling_price || 0) <= 0
    )
  }

  const showMissingTaxSellingPriceError = () => {
    toast.error(
      "Dòng có SL Thuế > 0 bắt buộc phải nhập GBKT lớn hơn 0 trước khi lưu.",
    )
  }

  // Mutations
  const approveReceiptMutation = useApproveInventoryReceiptMutation()
  const cancelReceiptMutation = useCancelInventoryReceiptMutation()
  const deleteReceiptMutation = useDeleteInventoryReceiptMutation()

  // Handlers
  const handleBack = () => {
    navigate(`/inventory/receipts${location.search}`)
  }

  const handleEdit = () => {
    navigate(`/inventory/receipts/edit/${receiptId}${location.search}`)
  }

  const handleApprove = async () => {
    try {
      await approveReceiptMutation.mutateAsync(receiptId)
      refetchReceipt()
    } catch (error) {
      console.error("Error approving receipt:", error)
    }
  }

  const handleCancel = async () => {
    try {
      await cancelReceiptMutation.mutateAsync(receiptId)
      refetchReceipt()
    } catch (error) {
      console.error("Error canceling receipt:", error)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteReceiptMutation.mutateAsync(receiptId)
      navigate(`/inventory/receipts${location.search}`)
    } catch (error) {
      console.error("Error deleting receipt:", error)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  // Render trạng thái
  const renderStatus = (record: any) => {
    if (!record) return null
    const normalizedStatus = normalizeReceiptStatus(
      record.status_code || record.status,
    )

    const statusConfig: Record<string, { color: string }> = {
      [InventoryReceiptStatus.DRAFT]: { color: "default" },
      [InventoryReceiptStatus.APPROVED]: { color: "success" },
      [InventoryReceiptStatus.CANCELLED]: { color: "error" },
    }

    const config = statusConfig[normalizedStatus] || { color: "default" }
    const label = getInventoryReceiptStatusText(
      record.status_code || record.status,
    )
    return (
      <Tag color={config.color} className='px-3 py-1 font-medium'>
        {label}
      </Tag>
    )
  }

  // Render Header Actions
  const renderHeaderActions = () => {
    if (!receipt) return null

    const buttons = []

    // 1. Nút Sửa - Cho Nháp hoặc Đã Duyệt (Sửa thông tin cơ bản)
    if (
      normalizedStatus === InventoryReceiptStatus.DRAFT ||
      normalizedStatus === InventoryReceiptStatus.APPROVED
    ) {
      const isApproved = normalizedStatus === InventoryReceiptStatus.APPROVED
      buttons.push(
        <Tooltip
          key='edit-tip'
          title={
            isApproved
              ? "Sửa thông tin cơ bản (Nhà cung cấp, ngày hóa đơn, ghi chú...)"
              : ""
          }
        >
          <Button key='edit' icon={<EditOutlined />} onClick={handleEdit}>
            Sửa {isApproved ? "thông tin" : ""}
          </Button>
        </Tooltip>,
      )
    }

    // 2. Nút Duyệt - Chỉ cho Nháp
    if (normalizedStatus === InventoryReceiptStatus.DRAFT) {
      buttons.push(
        <Popconfirm
          key='approve'
          title='Duyệt phiếu nhập hàng'
          description='Sau khi duyệt, hàng sẽ được nhập vào kho và không thể sửa mặt hàng. Bạn có chắc chắn?'
          onConfirm={handleApprove}
          okText='Duyệt ngay'
          cancelText='Hủy'
        >
          <Button
            type='primary'
            icon={<CheckOutlined />}
            loading={approveReceiptMutation.isPending}
            className='bg-green-600 border-green-600 hover:bg-green-700 hover:border-green-700'
          >
            Duyệt
          </Button>
        </Popconfirm>,
      )
    }

    // 3. Nút Hủy - Cho phiếu Đã duyệt
    if (normalizedStatus === InventoryReceiptStatus.APPROVED) {
      buttons.push(
        <Popconfirm
          key='cancel'
          title='Hủy phiếu nhập kho'
          description='Khi hủy phiếu, hàng sẽ được hoàn kho. Bạn có chắc chắn?'
          onConfirm={handleCancel}
          okText='Xác nhận hủy'
          cancelText='Không'
          okButtonProps={{ danger: true }}
        >
          <Button
            icon={<CloseOutlined />}
            loading={cancelReceiptMutation.isPending}
            danger
          >
            Hủy
          </Button>
        </Popconfirm>,
      )
    }

    // 4. Nút Xóa - Cho Nháp hoặc Đã hủy
    if (
      normalizedStatus === InventoryReceiptStatus.DRAFT ||
      normalizedStatus === InventoryReceiptStatus.CANCELLED
    ) {
      buttons.push(
        <Popconfirm
          key='delete'
          title='Xóa phiếu'
          description='Hành động này không thể hoàn tác. Bạn có chắc chắn?'
          onConfirm={handleDelete}
          okText='Xóa'
          cancelText='Hủy'
          okButtonProps={{ danger: true }}
        >
          <Button
            icon={<DeleteOutlined />}
            danger
            loading={deleteReceiptMutation.isPending}
          />
        </Popconfirm>,
      )
    }

    // 5. Nút In
    buttons.push(
      <Button key='print' icon={<PrinterOutlined />} onClick={handlePrint} />,
    )

    return <Space wrap>{buttons}</Space>
  }

  // Component để edit inline SL Thuế
  const TaxableQuantityEditor: React.FC<{
    value: number
    record: InventoryReceiptItem
    canEdit: boolean
  }> = ({ value, record, canEdit }) => {
    const [editing, setEditing] = React.useState(false)
    const [editValue, setEditValue] = React.useState(value || 0)
    const updateMutation = useUpdateInventoryReceiptItemMutation()

    const handleSave = async () => {
      if (hasMissingTaxSellingPrice(record, editValue)) {
        showMissingTaxSellingPriceError()
        return
      }

      try {
        await updateMutation.mutateAsync({
          id: record.id,
          item: { taxable_quantity: editValue },
        })
        setEditing(false)
        refetchReceipt()
      } catch (error) {
        console.error("Error updating taxable quantity:", error)
      }
    }

    if (editing && canEdit) {
      return (
        <Space.Compact>
          <InputNumber
            min={0}
            max={record.quantity}
            value={editValue}
            onChange={(val: number | null) => setEditValue(val || 0)}
            onPressEnter={handleSave}
            autoFocus
            size='small'
            style={{ width: 70 }}
          />
          <Button
            type='primary'
            size='small'
            onClick={handleSave}
            loading={updateMutation.isPending}
          >
            Lưu
          </Button>
        </Space.Compact>
      )
    }

    return (
      <Tooltip
        title={canEdit ? "Click để sửa SL Thuế" : "Số lượng có hóa đơn đầu vào"}
      >
        <Tag
          color={value > 0 ? "blue" : "default"}
          onClick={() => canEdit && setEditing(true)}
          className={canEdit ? "cursor-pointer hover:opacity-80" : ""}
        >
          {(value || 0).toLocaleString("vi-VN")}
        </Tag>
      </Tooltip>
    )
  }

  const VatUnitCostEditor: React.FC<{
    value?: number
    record: InventoryReceiptItem
    canEdit: boolean
  }> = ({ value, record, canEdit }) => {
    const [editing, setEditing] = React.useState(false)
    const [editValue, setEditValue] = React.useState(Number(value || 0))
    const updateMutation = useUpdateInventoryReceiptItemMutation()

    const handleSave = async () => {
      if (hasMissingTaxSellingPrice(record)) {
        showMissingTaxSellingPriceError()
        return
      }

      try {
        await updateMutation.mutateAsync({
          id: record.id,
          item: { vat_unit_cost: editValue },
        })
        setEditing(false)
        refetchReceipt()
      } catch (error) {
        console.error("Error updating vat unit cost:", error)
      }
    }

    if (editing && canEdit) {
      return (
        <Space.Compact>
          <NumberInput
            min={0}
            value={editValue}
            onChange={(val: number | null) => setEditValue(val || 0)}
            onPressEnter={handleSave}
            autoFocus
            size='small'
            style={{ width: 110 }}
          />
          <Button
            type='primary'
            size='small'
            onClick={handleSave}
            loading={updateMutation.isPending}
          >
            Lưu
          </Button>
        </Space.Compact>
      )
    }

    const displayValue = Number(value ?? 0)

    return (
      <Tooltip
        title={
          canEdit ? "Click để sửa đơn giá VAT" : "Đơn giá trên hóa đơn VAT"
        }
      >
        <Tag
          color={displayValue > 0 ? "purple" : "default"}
          onClick={() => canEdit && setEditing(true)}
          className={canEdit ? "cursor-pointer hover:opacity-80" : ""}
        >
          {displayValue.toLocaleString("vi-VN")} ₫
        </Tag>
      </Tooltip>
    )
  }

  const TaxSellingPriceEditor: React.FC<{
    value?: number
    record: InventoryReceiptItem
    canEdit: boolean
  }> = ({ value, record, canEdit }) => {
    const [editing, setEditing] = React.useState(false)
    const [editValue, setEditValue] = React.useState(Number(value || 0))
    const updateMutation = useUpdateInventoryReceiptItemMutation()

    const handleSave = async () => {
      try {
        await updateMutation.mutateAsync({
          id: record.id,
          item: { tax_selling_price: editValue },
        })
        setEditing(false)
        refetchReceipt()
      } catch (error) {
        console.error("Error updating tax selling price:", error)
      }
    }

    if (editing && canEdit) {
      return (
        <Space.Compact>
          <NumberInput
            min={0}
            value={editValue}
            onChange={(val: number | null) => setEditValue(val || 0)}
            onPressEnter={handleSave}
            autoFocus
            size='small'
            style={{ width: 110 }}
          />
          <Button
            type='primary'
            size='small'
            onClick={handleSave}
            loading={updateMutation.isPending}
          >
            Lưu
          </Button>
        </Space.Compact>
      )
    }

    const displayValue = Number(value ?? 0)

    return (
      <Tooltip
        title={
          canEdit
            ? "Click để sửa Giá bán khai thuế"
            : "Giá bán khai thuế theo lô nhập"
        }
      >
        <Tag
          color={
            displayValue > 0
              ? "gold"
              : Number(record.taxable_quantity || 0) > 0
                ? "error"
                : "default"
          }
          onClick={() => canEdit && setEditing(true)}
          className={canEdit ? "cursor-pointer hover:opacity-80" : ""}
        >
          {displayValue.toLocaleString("vi-VN")} ₫
        </Tag>
      </Tooltip>
    )
  }

  const UnitCostEditor: React.FC<{
    value: number
    record: InventoryReceiptItem
    canEdit: boolean
  }> = ({ value, record, canEdit }) => {
    const [editing, setEditing] = React.useState(false)
    const [editValue, setEditValue] = React.useState(Number(value || 0))
    const updateMutation = useUpdateInventoryReceiptItemMutation()

    const handleSave = async () => {
      if (hasMissingTaxSellingPrice(record)) {
        showMissingTaxSellingPriceError()
        return
      }

      try {
        await updateMutation.mutateAsync({
          id: record.id,
          item: { unit_cost: editValue },
        })
        setEditing(false)
        refetchReceipt()
      } catch (error) {
        console.error("Error updating unit cost:", error)
      }
    }

    if (editing && canEdit) {
      return (
        <Space.Compact>
          <NumberInput
            min={0}
            value={editValue}
            onChange={(val: number | null) => setEditValue(val || 0)}
            onPressEnter={handleSave}
            autoFocus
            size='small'
            style={{ width: 110 }}
          />
          <Button
            type='primary'
            size='small'
            onClick={handleSave}
            loading={updateMutation.isPending}
          >
            Lưu
          </Button>
        </Space.Compact>
      )
    }

    return (
      <Tooltip title={canEdit ? "Click để sửa đơn giá mua" : ""}>
        <div
          onClick={() => canEdit && setEditing(true)}
          className={
            canEdit ? "cursor-pointer hover:text-blue-600 font-medium" : ""
          }
        >
          {value.toLocaleString("vi-VN")} ₫
        </div>
      </Tooltip>
    )
  }

  // Cấu hình cột sản phẩm
  const itemColumns: ColumnsType<InventoryReceiptItem> = [
    {
      title: "Tên sản phẩm",
      dataIndex: "product_name",
      key: "product_name",
      render: (name, record) => {
        const productName = record.product?.name || name
        const tradeName = record.product?.trade_name
        const hasTradeName = tradeName && tradeName !== productName

        return (
          <div className='flex flex-col'>
            <Text strong className='leading-tight'>
              {productName}
            </Text>
            {hasTradeName && (
              <Text
                type='secondary'
                style={{ fontSize: "11px" }}
                className='mt-0.5 italic'
              >
                ({tradeName})
              </Text>
            )}
          </div>
        )
      },
    },
    {
      title: "ĐVT",
      key: "unit_name",
      width: 80,
      render: (_, record) =>
        record.unit_name || record.product?.unit?.name || "-",
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      align: "right",
      render: (q) => (q || 0).toLocaleString("vi-VN"),
    },
    {
      title: "SL Thuế",
      dataIndex: "taxable_quantity",
      key: "taxable_quantity",
      width: 120,
      align: "right",
      render: (q, record) => (
        <TaxableQuantityEditor
          value={q || 0}
          record={record}
          canEdit={normalizedStatus === InventoryReceiptStatus.APPROVED}
        />
      ),
    },
    {
      title: "Đơn giá",
      dataIndex: "unit_cost",
      key: "unit_cost",
      width: 120,
      align: "right",
      render: (p, record) => (
        <UnitCostEditor
          value={Number(p || 0)}
          record={record}
          canEdit={normalizedStatus === InventoryReceiptStatus.APPROVED}
        />
      ),
    },
    {
      title: "Đơn giá VAT",
      dataIndex: "vat_unit_cost",
      key: "vat_unit_cost",
      width: 140,
      align: "right",
      render: (value, record) => (
        <VatUnitCostEditor
          value={value}
          record={record}
          canEdit={normalizedStatus === InventoryReceiptStatus.APPROVED}
        />
      ),
    },
    {
      title: "GBKT",
      dataIndex: "tax_selling_price",
      key: "tax_selling_price",
      width: 140,
      align: "right",
      render: (value, record) => (
        <TaxSellingPriceEditor
          value={Number(value || 0)}
          record={record}
          canEdit={normalizedStatus === InventoryReceiptStatus.APPROVED}
        />
      ),
    },
    {
      title: "Phí Bốc Vác",
      dataIndex: "individual_shipping_cost",
      key: "individual_shipping_cost",
      width: 120,
      align: "right",
      render: (p) => (p > 0 ? (p || 0).toLocaleString("vi-VN") + " ₫" : "-"),
    },
    {
      title: "Phí PB",
      dataIndex: "allocated_shipping_cost",
      key: "allocated_shipping_cost",
      width: 120,
      align: "right",
      render: (p) => (Number(p || 0) > 0 ? Number(p || 0).toLocaleString("vi-VN") + " ₫" : "-"),
    },
    {
      title: "Giá vốn sau phí",
      dataIndex: "final_unit_cost",
      key: "final_unit_cost",
      width: 150,
      align: "right",
      render: (value, record) => {
        const finalUnitCost = Number(value ?? record.unit_cost ?? 0)
        const hasShippingAdjustment =
          Number(record.individual_shipping_cost || 0) > 0 ||
          Number(record.allocated_shipping_cost || 0) > 0

        return (
          <Tooltip
            title={
              hasShippingAdjustment
                ? `Giá vốn cuối cùng = Đơn giá gốc + phí bốc vác riêng + phí phân bổ`
                : "Chưa có phí bốc vác/phân bổ cho dòng này"
            }
          >
            <Text strong className={hasShippingAdjustment ? "text-emerald-600" : undefined}>
              {finalUnitCost.toLocaleString("vi-VN")} ₫
            </Text>
          </Tooltip>
        )
      },
    },
    {
      title: "Thành tiền",
      dataIndex: "total_price",
      key: "total_price",
      width: 140,
      align: "right",
      render: (p, record) => (
        <Text strong className='text-green-600'>
          {(
            Number(record.quantity || 0) * Number(record.unit_cost || 0)
          ).toLocaleString("vi-VN")}{" "}
          ₫
        </Text>
      ),
    },
    {
      title: "Số lô",
      dataIndex: "batch_number",
      key: "batch_number",
      width: 150,
      render: (batch) =>
        batch ? (
          <Tag color='blue'>{batch}</Tag>
        ) : (
          <Text type='secondary'>Chưa cấp</Text>
        ),
    },
    {
      title: "Hạn dùng",
      dataIndex: "expiry_date",
      key: "expiry_date",
      width: 110,
      align: "center",
      render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
    },
  ]

  const historyColumns: ColumnsType<any> = [
    {
      title: "Thời gian",
      dataIndex: "created_at",
      key: "created_at",
      width: 170,
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm:ss"),
    },
    {
      title: "Sản phẩm",
      dataIndex: "product",
      key: "product",
      render: (product: any) => (
        <Space direction='vertical' size={0}>
          <Text strong>{product?.name}</Text>
          <Text type='secondary' className='text-xs'>
            {product?.code}
          </Text>
        </Space>
      ),
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (type: string) => {
        const isUp = type === "IN"
        return (
          <Tag
            color={isUp ? "green" : "orange"}
            icon={isUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            className='rounded-full px-3'
          >
            {isUp ? "Nhập kho" : "Xuất kho"}
          </Tag>
        )
      },
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      width: 120,
      align: "right",
      render: (q: number) => (
        <Text strong className={q > 0 ? "text-green-600" : "text-orange-600"}>
          {q > 0 ? "+" : ""}
          {q.toLocaleString("vi-VN")}
        </Text>
      ),
    },
    {
      title: "Tồn cuối",
      dataIndex: "remaining_quantity",
      key: "remaining_quantity",
      width: 120,
      align: "right",
      render: (q: number) => <Text strong>{q.toLocaleString("vi-VN")}</Text>,
    },
    {
      title: "Người thực hiện",
      dataIndex: "creator",
      key: "creator",
      width: 160,
      render: (creator: any) => (
        <Space size='small'>
          <Badge status='processing' size='small' />
          <Text>{creator?.full_name || `ID: ${creator?.id || "N/A"}`}</Text>
        </Space>
      ),
    },
    {
      title: "Ghi chú",
      dataIndex: "notes",
      key: "notes",
      ellipsis: true,
      render: (notes: string) =>
        notes || (
          <Text type='secondary' italic>
            -
          </Text>
        ),
    },
  ]

  // Cột cho bảng Lịch sử chỉnh sửa (Audit Log)
  const auditColumns: ColumnsType<InventoryReceiptLog> = [
    {
      title: "Thời gian",
      dataIndex: "created_at",
      key: "created_at",
      width: 160,
      render: (date) => dayjs(date).format("DD/MM/YYYY HH:mm:ss"),
    },
    {
      title: "Người thực hiện",
      key: "user",
      width: 180,
      render: (_, record) => (
        <Space>
          <Avatar size='small' icon={<UserOutlined />} />
          <Text>
            {record.user?.user_profile?.nickname ||
              record.user?.full_name ||
              record.user?.username ||
              `ID: ${record.created_by}`}
          </Text>
        </Space>
      ),
    },
    {
      title: "Hành động",
      dataIndex: "action",
      key: "action",
      width: 150,
      render: (action) => {
        if (action === "UPDATE_METADATA")
          return <Tag color='blue'>Sửa thông tin phiếu</Tag>
        if (action === "UPDATE_ITEM")
          return <Tag color='purple'>Sửa giá/thuế sản phẩm</Tag>
        return <Tag>{action}</Tag>
      },
    },
    {
      title: "Chi tiết thay đổi",
      dataIndex: "details",
      key: "details",
      render: (details) => {
        try {
          const changes = JSON.parse(details)
          if (!Array.isArray(changes)) return details

          return (
            <div className='flex flex-col gap-1'>
              {changes.map((change, index) => {
                const fieldNameMap: any = {
                  supplier_id: "Nhà cung cấp",
                  notes: "Ghi chú",
                  bill_date: "Ngày hóa đơn",
                  payment_due_date: "Hạn thanh toán",
                  unit_cost: "Đơn giá mua",
                  taxable_quantity: "SL Thuế",
                  vat_unit_cost: "Đơn giá VAT",
                  tax_selling_price: "Giá bán khai thuế",
                  status: "Trạng thái",
                }

                const fieldName = fieldNameMap[change.field] || change.field

                // Format giá trị hiển thị (nếu là số tiền thì toLocaleString)
                const formatVal = (val: any) => {
                  if (val === null || val === undefined) return "Trống"
                  if (
                    typeof val === "number" &&
                    (change.field.includes("cost") ||
                      change.field.includes("price") ||
                      change.field.includes("amount"))
                  ) {
                    return val.toLocaleString("vi-VN") + " ₫"
                  }
                  return String(val)
                }

                return (
                  <div key={index} className='text-xs'>
                    <Text strong>{fieldName}:</Text>{" "}
                    <Text delete type='secondary'>
                      {formatVal(change.old)}
                    </Text>
                    <ArrowRightOutlined className='mx-2 text-[10px]' />
                    <Text strong type='success'>
                      {formatVal(change.new)}
                    </Text>
                    {change.item_id && (
                      <Text type='secondary' className='ml-2 italic'>
                        (Item #{change.item_id})
                      </Text>
                    )}
                  </div>
                )
              })}
            </div>
          )
        } catch (e) {
          return details
        }
      },
    },
  ]

  // Loading & Error States
  if (isLoadingReceipt) {
    return <InventoryReceiptDetailSkeleton />
  }

  if (receiptError || !receipt) {
    return (
      <div className='p-6'>
        <Alert
          message='Lỗi'
          description={
            receiptError
              ? (receiptError as any).message
              : "Không tìm thấy phiếu nhập hàng"
          }
          type='error'
          showIcon
          action={<Button onClick={handleBack}>Quay lại</Button>}
        />
      </div>
    )
  }

  const debtAmount = receipt.debt_amount ?? 0

  return (
    <div className='p-0 md:p-6 bg-gray-50 min-h-screen'>
      {/* Header Page */}
      <div className='m-2 md:m-0 mb-4 md:mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100'>
        <Row justify='space-between' align='middle' gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Space size='middle'>
              <Button
                type='text'
                icon={<ArrowLeftOutlined />}
                onClick={handleBack}
                className='hover:bg-gray-100'
              />
              <div>
                <Title level={4} className='mb-0 !m-0'>
                  Phiếu nhập:{" "}
                  <Text copyable className='text-blue-600 font-mono'>
                    {receipt.code}
                  </Text>
                </Title>
                <Space
                  classNames={{ item: "flex items-center" }}
                  className='mt-1'
                >
                  {renderStatus(receipt)}
                  <Text type='secondary' className='text-xs'>
                    Tạo bởi:{" "}
                    {receipt.creator?.full_name || `ID: ${receipt.created_by}`}{" "}
                    • {dayjs(receipt.created_at).format("DD/MM/YYYY HH:mm")}
                  </Text>
                </Space>
              </div>
            </Space>
          </Col>
          <Col xs={24} md={12} className='text-left md:text-right mt-2 md:mt-0'>
            {renderHeaderActions()}
          </Col>
        </Row>
      </div>

      {/* Main Content with Tabs */}
      <Card
        className='w-full shadow-sm border-none overflow-hidden'
        bodyStyle={{ padding: 0 }}
      >
        <style>{`
          .ant-tabs-nav-operations { display: none !important; }
          .ant-tabs-nav-wrap::after, .ant-tabs-nav-wrap::before { display: none !important; }
          .data-table-mobile-scroll .ant-table-content {
            overflow-x: auto !important;
          }
          /* Đảm bảo tab không bị cắt chữ và không dư khoảng trắng */
          .ant-tabs-nav-wrap {
            display: flex !important;
          }
          .ant-tabs-tab {
            padding: 12px 16px !important;
            margin: 0 !important;
            flex-shrink: 0 !important;
          }
          .ant-tabs-nav-list {
            display: flex !important;
            flex-wrap: nowrap !important;
          }
        `}</style>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size='large'
          className='bg-white'
          tabBarStyle={{ marginBottom: 0, paddingLeft: 8, paddingRight: 0 }}
          moreIcon={null}
        >
          {/* TAB 1: THÔNG TIN CHI TIẾT */}
          <TabPane
            tab={
              <Space>
                <span>ℹ️ Thông tin chính</span>
              </Space>
            }
            key='info'
          >
            <div className='p-3 md:p-6'>
              <Row gutter={[24, 24]}>
                <Col span={24}>
                  <Card
                    title='Chi tiết nghiệp vụ'
                    size='small'
                    bordered={false}
                    className='bg-gray-50 h-full'
                  >
                    <Descriptions
                      column={{ xs: 1, sm: 2, md: 3 }}
                      bordered={false}
                      size='small'
                    >
                      <Descriptions.Item label='Nhà cung cấp'>
                        <Text strong>
                          {receipt.supplier?.name ||
                            `ID #${receipt.supplier_id}`}
                        </Text>
                      </Descriptions.Item>
                      <Descriptions.Item label='Tổng giá trị'>
                        <Text strong className='text-lg text-blue-600'>
                          {(receipt.total_amount || 0).toLocaleString("vi-VN")}{" "}
                          ₫
                        </Text>
                      </Descriptions.Item>
                      {Number(receipt.shared_shipping_cost) > 0 && (
                        <Descriptions.Item label='Phí vận chuyển/bốc vác'>
                          <Text strong className='text-orange-600'>
                            {Number(
                              receipt.shared_shipping_cost,
                            ).toLocaleString("vi-VN")}{" "}
                            ₫
                          </Text>
                        </Descriptions.Item>
                      )}
                      {receipt.supplier_amount !== undefined && (
                        <Descriptions.Item
                          label={
                            <span style={{ whiteSpace: "nowrap" }}>
                              Phải trả NCC
                            </span>
                          }
                          labelStyle={{ whiteSpace: "nowrap" }}
                          contentStyle={{ whiteSpace: "nowrap" }}
                        >
                          <Tooltip title='Tổng tiền hàng (đã trừ chiết khấu) phải trả cho nhà cung cấp. Tuyệt đối không bao gồm phí bốc vác/vận chuyển.'>
                            <span className='font-bold text-orange-600'>
                              {(receipt.supplier_amount || 0).toLocaleString(
                                "vi-VN",
                              )}{" "}
                              ₫
                              <InfoCircleOutlined className='ml-1 text-[10px]' />
                            </span>
                          </Tooltip>
                        </Descriptions.Item>
                      )}
                      <Descriptions.Item label='Ghi chú' span={2}>
                        {receipt.notes ? (
                           <div style={{ whiteSpace: 'pre-wrap' }}>{receipt.notes}</div>
                        ) : (
                          <Text type='secondary' italic>
                            Không có ghi chú
                          </Text>
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label='Ngày nhập hàng'>
                        <Text strong>
                          {receipt.bill_date
                            ? dayjs(receipt.bill_date).format("DD/MM/YYYY")
                            : dayjs(receipt.created_at).format("DD/MM/YYYY")}
                        </Text>
                      </Descriptions.Item>
                      <Descriptions.Item label='Ngày tạo hệ thống'>
                        {dayjs(receipt.created_at).format("DD/MM/YYYY HH:mm")}
                      </Descriptions.Item>
                      <Descriptions.Item label='Cập nhật cuối'>
                        {dayjs(receipt.updated_at).format("DD/MM/YYYY HH:mm")}
                      </Descriptions.Item>
                      {receipt.approved_at && (
                        <Descriptions.Item label='Ngày duyệt' span={2}>
                          <Text className='text-green-600'>
                            {dayjs(receipt.approved_at).format(
                              "DD/MM/YYYY HH:mm",
                            )}{" "}
                            (Bởi:{" "}
                            {receipt.approver?.full_name ||
                              `ID: ${receipt.approved_by}`}
                            )
                          </Text>
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </Card>
                </Col>

                <Col span={24}>
                  <Card
                    title='Hình ảnh chứng từ'
                    size='small'
                    bordered={false}
                    className='bg-gray-50 h-full'
                  >
                    <ReceiptImageUpload
                      receiptId={receiptId}
                      images={receipt.images || []}
                      onImagesChange={refetchReceipt}
                    />
                  </Card>
                </Col>
              </Row>
            </div>
          </TabPane>

          {/* TAB 2: DANH SÁCH HÀNG HÓA */}
          <TabPane
            tab={
              <Space>
                <span>🛍️ Hàng hóa</span>
                <Tag className='ml-1 m-0'>{items.length}</Tag>
              </Space>
            }
            key='items'
          >
            <div className='p-0 md:p-6 data-table-mobile-scroll'>
              <DataTable
                columns={itemColumns as any}
                data={[...items].reverse() as any}
                rowKey='id'
                pagination={false}
                size='middle'
                showActions={false}
                showSTT={true}
                className='border border-gray-100 rounded'
                summary={(pageData: readonly any[]) => {
                  const totalQ = pageData.reduce(
                    (s, i) => s + (Number(i.quantity) || 0),
                    0,
                  )
                  const totalA = pageData.reduce(
                    (s, i) =>
                      s + Number(i.quantity || 0) * Number(i.unit_cost || 0),
                    0,
                  )
                  return (
                    <Table.Summary fixed>
                      <Table.Summary.Row className='bg-gray-50'>
                        <Table.Summary.Cell index={0} colSpan={3}>
                          <Text strong>Tổng cộng hàng hóa</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={3} align='right'>
                          <Text strong>{totalQ.toLocaleString("vi-VN")}</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4} />
                        <Table.Summary.Cell index={5} />
                        <Table.Summary.Cell index={6} />
                        <Table.Summary.Cell index={7} />
                        <Table.Summary.Cell index={8} align='right'>
                          <Text strong className='text-green-600'>
                            {totalA.toLocaleString("vi-VN")} ₫
                          </Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={9} colSpan={2} />
                      </Table.Summary.Row>
                    </Table.Summary>
                  )
                }}
              />

              {normalizedStatus === InventoryReceiptStatus.DRAFT && (
                <div className='mt-6 text-center'>
                  <Button
                    type='dashed'
                    icon={<EditOutlined />}
                    size='large'
                    onClick={handleEdit}
                    className='w-full md:w-auto px-12'
                  >
                    Chỉnh sửa danh mục hàng hóa
                  </Button>
                </div>
              )}
            </div>
          </TabPane>

          {/* TAB 3: THANH TOÁN */}
          <TabPane
            tab={
              <Space>
                <span>💰 Thanh toán</span>
                {debtAmount > 0 && <Badge status='error' className='ml-1' />}
              </Space>
            }
            key='payment'
          >
            <div className='p-0 md:p-6 data-table-mobile-scroll'>
              <PaymentTab receipt={receipt} onRefresh={refetchReceipt} />
            </div>
          </TabPane>

          {/* TAB 4: GIAO DỊCH KHO */}
          <TabPane
            tab={
              <Space>
                <span>📦 Giao dịch kho</span>
              </Space>
            }
            key='transactions'
          >
            <div className='p-0 md:p-6 data-table-mobile-scroll'>
              <DataTable
                columns={historyColumns}
                data={historyData || []}
                rowKey='id'
                pagination={{ pageSize: 15 }}
                size='middle'
                loading={isLoadingHistory}
                showActions={false}
                showSTT={true}
                className='border border-gray-100 rounded'
              />
              <div className='mt-4'>
                <Alert
                  type='info'
                  showIcon
                  message='Ghi chú về giao dịch kho'
                  description='Các giao dịch kho thể hiện quá trình nhập hàng và các biến động tồn kho thực tế của các mặt hàng trong phiếu này.'
                />
              </div>
            </div>
          </TabPane>

          {/* TAB 5: LỊCH SỬ CHỈNH SỬA (Audit Log) */}
          <TabPane
            tab={
              <Space>
                <span>🕰️ Lịch sử sửa</span>
              </Space>
            }
            key='audit'
          >
            <div className='p-0 md:p-6 data-table-mobile-scroll'>
              <DataTable
                columns={auditColumns as any}
                data={(auditLogs || []) as any}
                rowKey='id'
                pagination={{ pageSize: 15 }}
                size='middle'
                loading={isLoadingAudit}
                showActions={false}
                showSTT={true}
                className='border border-gray-100 rounded'
              />
              <div className='mt-4'>
                <Alert
                  type='warning'
                  showIcon
                  message='Ghi chú về lịch sử chỉnh sửa'
                  description='Đây là nhật ký theo dõi tất cả các hành động sửa đổi thông tin sau khi phiếu đã được tạo. Dùng để đối soát và đảm bảo tính minh bạch.'
                />
              </div>
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  )
}

export default InventoryReceiptDetail
