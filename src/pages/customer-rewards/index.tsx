import * as React from "react"
import {
  Tabs,
  Tag,
  Space,
  Typography,
  Progress,
  Tooltip,
  Button,
  Modal,
  Form,
  Select,
  InputNumber,
  Input,
  Alert,
} from "antd"
import {
  GiftOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  UndoOutlined,
} from "@ant-design/icons"
import { Popconfirm, message } from "antd"
import DataTable from "@/components/common/data-table"
import FilterHeader from "@/components/common/filter-header"
import { 
    useRewardTrackingQuery, 
    useRewardHistoryQuery,
    useCreateManualRewardMutation,
    useUpdateRewardHistoryMutation,
    useDeleteRewardHistoryMutation,
    useUpdateRewardThresholdMutation,
    useResetCustomerRewardMutation,
    useRewardResetHistoryQuery,
    useRestoreCustomerRewardMutation
} from "@/queries/debt-note"
import { useAppStore } from "@/stores"
import { hasPermission } from "@/utils/permission"
import { useSeasonsQuery } from "@/queries/season"
import { useRiceCrops } from "@/queries/rice-crop"
import { useForm, Controller } from "react-hook-form";
import { FormField, FormFieldNumber, FormComboBox } from "@/components/form";
import { useProductSearch } from "@/queries/product"
import { useCustomerSearch } from "@/queries/customer"
import type { Product } from "@/models/product.model"

const { Title, Text } = Typography

const CustomerRewardsPage: React.FC = () => {
  // State quản lý UI
  const [activeTab, setActiveTab] = React.useState("tracking")
  const [trackingFilters, setTrackingFilters] = React.useState<Record<string, any>>({})
  const [historyFilters, setHistoryFilters] = React.useState<Record<string, any>>({})
  const [trackingPage, setTrackingPage] = React.useState(1)
  const [historyPage, setHistoryPage] = React.useState(1)
  const pageSize = 10

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [selectedCustomer, setSelectedCustomer] = React.useState<any>(null)
  const [editingHistoryId, setEditingHistoryId] = React.useState<number | null>(null)
  const [isAddingAppreciationGift, setIsAddingAppreciationGift] = React.useState(false) // Chế độ thêm quà tri ân mới
  const [productSearchTerm, setProductSearchTerm] = React.useState("")
  const [customerSearchTerm, setCustomerSearchTerm] = React.useState("")
  const [isThresholdModalOpen, setIsThresholdModalOpen] = React.useState(false)
  const [thresholdCustomer, setThresholdCustomer] = React.useState<any>(null)
  const [thresholdValue, setThresholdValue] = React.useState<number | null>(null)

  // State cho chức năng xóa tích lũy hiện tại (xóa theo từng khách hàng)
  const [resetTarget, setResetTarget] = React.useState<any>(null)
  const [isResetModalOpen, setIsResetModalOpen] = React.useState(false)
  const [resetReason, setResetReason] = React.useState("")
  const [resetHistoryFilters, setResetHistoryFilters] = React.useState<Record<string, any>>({})
  const [resetHistoryPage, setResetHistoryPage] = React.useState(1)

  // Quyền quản lý (xóa/khôi phục tích lũy)
  const userInfo = useAppStore((state) => state.userInfo)
  const canManageReward = hasPermission(userInfo, "sales:manage")
  
  // React Hook Form cho Modal tặng quà
  const { control, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      gift_description: "",
      gift_value: 0,
      notes: "",
      season_id: undefined as number | undefined,
      rice_crop_id: undefined as number | undefined,
      customer_id: undefined as number | undefined, // Dùng khi thêm quà tri ân mới
      gift_product_id: undefined as number | undefined,
      gift_quantity: 1,
      gift_unit_price: 0,
      gift_status: "pending" as string,
    }
  });

  // Queries
  const { data: trackingData, isLoading: isTrackingLoading, refetch: refetchTracking } = useRewardTrackingQuery({
    page: trackingPage,
    limit: pageSize,
    ...trackingFilters
  })

  // History queries for different types
  const { data: accumulationHistoryData, isLoading: isAccumulationLoading, refetch: refetchAccumulation } = useRewardHistoryQuery({
    page: historyPage,
    limit: pageSize,
    reward_type: 'ACCUMULATION_REWARD',
    ...historyFilters
  })

  const { data: appreciationHistoryData, isLoading: isAppreciationLoading, refetch: refetchAppreciation } = useRewardHistoryQuery({
    page: historyPage,
    limit: pageSize,
    reward_type: 'APPRECIATION_GIFT',
    ...historyFilters
  })

  // Lịch sử xóa tích lũy hiện tại
  const { data: resetHistoryData, isLoading: isResetHistoryLoading, refetch: refetchResetHistory } = useRewardResetHistoryQuery({
    page: resetHistoryPage,
    limit: pageSize,
    ...resetHistoryFilters
  })

  const { data: seasonsData } = useSeasonsQuery({ limit: 100 })
  
  // Lấy customer_id từ form (khi thêm quà tri ân mới) hoặc từ khách được chọn (khi tặng từ tab tích lũy)
  const watchedCustomerId = watch('customer_id')
  const watchedSeasonId = watch('season_id')
  const watchedGiftProductId = watch('gift_product_id')
  const watchedGiftQuantity = watch('gift_quantity')
  const watchedGiftUnitPrice = watch('gift_unit_price')
  const effectiveCustomerId = watchedCustomerId || selectedCustomer?.customer_id
  
  // Load ruộng lúa theo KHÁCH HÀNG và MÙA VỤ (nếu có)
  const { data: riceCropsData } = useRiceCrops({ 
    customer_id: effectiveCustomerId,
    season_id: watchedSeasonId, // ✅ Lọc theo mùa vụ bổ sung
    limit: 100 
  }, { enabled: !!effectiveCustomerId })

  const { data: productsSearchData, isLoading: isProductsLoading } = useProductSearch(
    productSearchTerm,
    20,
    isModalOpen
  )
  const productOptions = React.useMemo(
    () => productsSearchData?.pages.flatMap((page) => page.data) || [],
    [productsSearchData]
  )
  const selectedGiftProduct = React.useMemo(
    () => productOptions.find((p: Product) => Number(p.id) === Number(watchedGiftProductId)),
    [productOptions, watchedGiftProductId]
  )
  const { data: customersSearchData, isLoading: isCustomersLoading } = useCustomerSearch(
    customerSearchTerm,
    20,
    isModalOpen && isAddingAppreciationGift
  )
  const customerOptions = React.useMemo(
    () => customersSearchData?.pages.flatMap((page) => page.data) || [],
    [customersSearchData]
  )

  const createRewardMutation = useCreateManualRewardMutation()
  const updateRewardMutation = useUpdateRewardHistoryMutation()
  const deleteRewardMutation = useDeleteRewardHistoryMutation()
  const updateRewardThresholdMutation = useUpdateRewardThresholdMutation()
  const resetRewardMutation = useResetCustomerRewardMutation()
  const restoreRewardMutation = useRestoreCustomerRewardMutation()

  const defaultThreshold = trackingData?.reward_threshold || 70000000 // Fallback 70 Triệu

  const getRecordThreshold = (record: any) => {
    return Number(
      record?.effective_reward_threshold ||
      record?.reward_threshold ||
      defaultThreshold
    )
  }

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value)
  }

  React.useEffect(() => {
    if (!watchedGiftProductId) return
    const total =
      Number(watchedGiftQuantity || 0) * Number(watchedGiftUnitPrice || 0)
    setValue("gift_value", Math.round(total))
  }, [watchedGiftProductId, watchedGiftQuantity, watchedGiftUnitPrice, setValue])

  // Helper to refetch everything
  const refetchAll = () => {
    refetchTracking()
    refetchAccumulation()
    refetchAppreciation()
  }

  // Mở modal từ tab tích lũy (chọn khách từ tracking)
  const handleOpenRewardModal = (record: any, isEdit: boolean = false) => {
    setIsAddingAppreciationGift(false)
    setProductSearchTerm(record.gift_product_name || "")
    setCustomerSearchTerm(record.customer?.name || record.customer_name || "")
    if (isEdit) {
        setEditingHistoryId(record.id)
        setSelectedCustomer({ customer_id: record.customer_id, customer: record.customer })
        reset({
            gift_description: record.gift_description,
            gift_value: Number(record.gift_value || 0),
            notes: record.notes,
            season_id: record.season_ids?.[0],
            rice_crop_id: record.rice_crop_id,
            customer_id: record.customer_id,
            gift_product_id: record.gift_product_id,
            gift_quantity: Number(record.gift_quantity || 1),
            gift_unit_price: Number(record.gift_unit_price || 0),
            gift_status: record.gift_status,
        })
    } else {
        setEditingHistoryId(null)
        setSelectedCustomer(record)
        reset({
            gift_description: "Quà tích lũy",
            gift_value: Math.floor((Number(record.pending_amount || 0) / getRecordThreshold(record)) * 1000000),
            notes: "",
            season_id: undefined,
            rice_crop_id: undefined,
            customer_id: record.customer_id,
            gift_product_id: undefined,
            gift_quantity: 1,
            gift_unit_price: 0,
            gift_status: 'pending',
        })
    }
    setIsModalOpen(true)
  }

  // Mở modal thêm quà tri ân mới (chọn bất kỳ khách hàng)
  const handleOpenAddAppreciationGift = () => {
    setIsAddingAppreciationGift(true)
    setEditingHistoryId(null)
    setSelectedCustomer(null)
    setProductSearchTerm("")
    setCustomerSearchTerm("")
    reset({
        gift_description: "",
        gift_value: 0,
        notes: "",
        season_id: undefined,
        rice_crop_id: undefined,
        customer_id: undefined,
        gift_product_id: undefined,
        gift_quantity: 1,
        gift_unit_price: 0,
        gift_status: 'pending',
    })
    setIsModalOpen(true)
  }

  const handleSubmitForm = async (values: any) => {
    if (editingHistoryId) {
        // Chỉnh sửa bản ghi cũ
        await updateRewardMutation.mutateAsync({
            id: editingHistoryId,
            data: {
                customer_id: Number(values.customer_id),
                gift_description: values.gift_description,
                gift_value: values.gift_value,
                notes: values.notes,
                gift_status: values.gift_status,
                season_id: values.season_id ? Number(values.season_id) : undefined,
                rice_crop_id: values.rice_crop_id ? Number(values.rice_crop_id) : undefined,
                gift_product_id: values.gift_product_id ? Number(values.gift_product_id) : undefined,
                gift_quantity: values.gift_product_id ? Number(values.gift_quantity || 0) : undefined,
                gift_unit_price: values.gift_product_id ? Number(values.gift_unit_price || 0) : undefined,
            }
        })
    } else if (isAddingAppreciationGift) {
        // Thêm quà tri ân mới từ tab Tri ân
        await createRewardMutation.mutateAsync({
            customer_id: Number(values.customer_id),
            gift_description: values.gift_description,
            gift_value: values.gift_value,
            notes: values.notes,
            gift_status: values.gift_status,
            season_id: values.season_id ? Number(values.season_id) : undefined,
            rice_crop_id: values.rice_crop_id ? Number(values.rice_crop_id) : undefined,
            gift_product_id: values.gift_product_id ? Number(values.gift_product_id) : undefined,
            gift_quantity: values.gift_product_id ? Number(values.gift_quantity || 0) : undefined,
            gift_unit_price: values.gift_product_id ? Number(values.gift_unit_price || 0) : undefined,
            reward_type: 'APPRECIATION_GIFT', // ✅ Mặc định là Quà tri ân, không trừ tích lũy
        })
    } else {
        // Thêm quà tích lũy từ tab Tích lũy
        await createRewardMutation.mutateAsync({
            customer_id: Number(selectedCustomer.customer_id),
            gift_description: values.gift_description,
            gift_value: values.gift_value,
            notes: values.notes,
            gift_status: values.gift_status,
            season_id: values.season_id ? Number(values.season_id) : undefined,
            rice_crop_id: values.rice_crop_id ? Number(values.rice_crop_id) : undefined,
            gift_product_id: values.gift_product_id ? Number(values.gift_product_id) : undefined,
            gift_quantity: values.gift_product_id ? Number(values.gift_quantity || 0) : undefined,
            gift_unit_price: values.gift_product_id ? Number(values.gift_unit_price || 0) : undefined,
            reward_type: 'ACCUMULATION_REWARD',
        })
    }
    setIsModalOpen(false)
    refetchAll()
  }

  const handleDeleteHistory = async (id: number) => {
    await deleteRewardMutation.mutateAsync(id)
    refetchAll() // Refetch all tabs
  }

  const handleOpenThresholdModal = (record: any) => {
    setThresholdCustomer(record)
    setThresholdValue(record.reward_threshold ? Number(record.reward_threshold) : null)
    setIsThresholdModalOpen(true)
  }

  const handleSaveThreshold = async () => {
    if (!thresholdCustomer?.customer_id) return
    await updateRewardThresholdMutation.mutateAsync({
      customerId: Number(thresholdCustomer.customer_id),
      rewardThreshold: thresholdValue,
    })
    setIsThresholdModalOpen(false)
    refetchTracking()
  }

  /** Mở modal xác nhận xóa "Tích lũy hiện tại" của một khách hàng */
  const handleOpenResetModal = (record: any) => {
    if (Number(record?.pending_amount || 0) <= 0) {
      message.warning("Khách hàng này không có tích lũy hiện tại để xóa")
      return
    }
    setResetTarget(record)
    setResetReason("")
    setIsResetModalOpen(true)
  }

  /** Xác nhận xóa tích lũy hiện tại của khách đang chọn (bắt buộc nhập lý do) */
  const handleConfirmReset = async () => {
    const reason = resetReason.trim()
    if (!reason) {
      message.warning("Vui lòng nhập lý do xóa tích lũy")
      return
    }
    if (!resetTarget?.customer_id) return
    await resetRewardMutation.mutateAsync({
      customer_ids: [Number(resetTarget.customer_id)],
      reason,
    })
    setIsResetModalOpen(false)
    setResetTarget(null)
    setResetReason("")
    refetchTracking()
    refetchResetHistory()
  }

  /** Khôi phục lại phần tích lũy đã xóa */
  const handleRestoreReset = async (id: number) => {
    await restoreRewardMutation.mutateAsync(id)
    refetchTracking()
    refetchResetHistory()
  }

  const handleMarkAsDelivered = async (record: any) => {
    try {
        await updateRewardMutation.mutateAsync({
            id: record.id,
            data: {
                gift_description: record.gift_description,
                gift_value: record.gift_value,
                notes: record.notes,
                gift_status: 'delivered',
            }
        })
        message.success("Đã đánh dấu đã trao quà!")
        refetchAll()
    } catch (error) {
        console.error("Mark as delivered failed:", error)
    }
  }

  // Tracking Columns
  const trackingColumns = [
    {
      title: (
        <FilterHeader 
            title="Khách hàng" 
            dataIndex="customer_name" 
            value={trackingFilters.customer_name} 
            onChange={(val) => {
                setTrackingFilters(prev => ({ ...prev, customer_name: val }))
                setTrackingPage(1)
            }}
            inputType="text"
            placeholder="Tìm tên / SĐT..."
        />
      ),
      key: "customer",
      width: 250,
      render: (record: any) => (
        <Space direction="vertical" size={0}>
            <Text strong>{record.customer?.name}</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>{record.customer?.phone}</Text>
        </Space>
      )
    },
    {
      title: "Tiến trình",
      key: "progress",
      width: 300,
      render: (record: any) => {
        const pending = Number(record.pending_amount || 0)
        const threshold = getRecordThreshold(record)
        const percent = Math.min(Math.round((pending / threshold) * 100), 100)
        return (
          <div className="w-full">
            <Progress 
                percent={percent} 
                status={percent >= 100 ? "success" : "active"} 
                strokeColor={percent >= 100 ? "#52c41a" : "#1890ff"}
            />
            <div className="flex justify-between text-xs mt-1">
                <span>{formatCurrency(pending)}</span>
                <span className="text-gray-400">Mốc {formatCurrency(threshold)} · Thiếu {formatCurrency(Math.max(0, threshold - pending))}</span>
            </div>
          </div>
        )
      }
    },
    {
      title: "Mốc tặng quà",
      key: "reward_threshold",
      width: 180,
      render: (record: any) => {
        const customThreshold = Number(record.reward_threshold || 0)
        const effectiveThreshold = getRecordThreshold(record)

        return (
          <Space direction="vertical" size={2}>
            <Text strong>{formatCurrency(effectiveThreshold)}</Text>
            <Space>
              <Tag color={customThreshold > 0 ? "blue" : "default"}>
                {customThreshold > 0 ? "Riêng" : "Mặc định"}
              </Tag>
              <Tooltip title="Sửa mốc tặng quà">
                <Button
                  size="small"
                  icon={<SettingOutlined />}
                  onClick={() => handleOpenThresholdModal(record)}
                />
              </Tooltip>
            </Space>
          </Space>
        )
      }
    },
    {
      title: "Tổng tích lũy",
      dataIndex: "total_accumulated",
      key: "total_accumulated",
      width: 150,
      render: (val: number) => <Text strong className="text-blue-600">{formatCurrency(val)}</Text>
    },
    {
      title: "Số lần đã nhận",
      dataIndex: "reward_count",
      key: "reward_count",
      width: 130,
      render: (val: number) => <Tag color="gold" icon={<GiftOutlined />}>{val} lần</Tag>
    },
    {
      title: "Thao tác",
      key: "actions",
      width: canManageReward ? 240 : 120,
      render: (record: any) => {
        const pendingAmount = Number(record.pending_amount || 0)
        return (
          <Space size={4}>
            <Button 
                type="primary" 
                size="small" 
                icon={<GiftOutlined />}
                onClick={() => handleOpenRewardModal(record)}
                className="bg-amber-500 hover:bg-amber-600 border-none"
            >
                Tặng quà
            </Button>
            {/* Chỉ người có quyền quản lý mới được xóa tích lũy hiện tại */}
            {canManageReward && (
              <Tooltip title={pendingAmount > 0 ? "Xóa tích lũy hiện tại của khách này" : "Khách chưa có tích lũy hiện tại"}>
                <Button
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  disabled={pendingAmount <= 0}
                  onClick={() => handleOpenResetModal(record)}
                >
                  Xóa tích lũy
                </Button>
              </Tooltip>
            )}
          </Space>
        );
      }
    }
  ]

  // History Columns
  const historyColumns = [
    {
        title: (
          <FilterHeader 
              title="Khách hàng" 
              dataIndex="customer_name" 
              value={historyFilters.customer_name} 
              onChange={(val) => {
                  setHistoryFilters(prev => ({ ...prev, customer_name: val }))
                  setHistoryPage(1)
              }}
              inputType="text"
              placeholder="Tìm tên / SĐT..."
          />
        ),
        key: "customer",
        width: 250,
        render: (record: any) => (
            <Space direction="vertical" size={0}>
                <Text strong>{record.customer?.name || record.customer_name}</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>{record.customer?.phone}</Text>
            </Space>
        )
    },
    {
      title: "Ngày nhận",
      dataIndex: "reward_date",
      key: "reward_date",
      width: 150,
      render: (val: string) => new Date(val).toLocaleDateString('vi-VN')
    },
    {
      title: "Loại quà",
      dataIndex: "reward_type",
      key: "reward_type",
      width: 150,
      render: (type: string) => {
        if (type === 'APPRECIATION_GIFT') {
          return <Tag color="blue">Quà tri ân</Tag>;
        }
        return <Tag color="gold">Quà tích lũy</Tag>;
      }
    },
    {
      title: "Mô tả quà tặng",
      dataIndex: "gift_description",
      key: "gift_description",
      width: 250,
      render: (text: string, record: any) => (
        <Space direction="vertical" size={0}>
          <Text>{text || record.gift_product_name || 'Quà tặng'}</Text>
          {record.gift_product_id && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.gift_product_name || `Sản phẩm #${record.gift_product_id}`} · SL {Number(record.gift_quantity || 0)} · {formatCurrency(Number(record.gift_unit_price || 0))}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: "Giá trị",
      dataIndex: "gift_value",
      key: "gift_value",
      width: 130,
      render: (val: number) => val > 0 ? <Text type="success">{formatCurrency(val)}</Text> : '-'
    },
    {
        title: "Các vụ tích lũy",
        dataIndex: "season_names",
        key: "season_names",
        width: 250,
        render: (names: string[]) => (
            <div className="flex flex-wrap gap-1">
                {names?.map((n, i) => <Tag key={i}>{n}</Tag>)}
            </div>
        )
    },
    {
        title: "Ruộng lúa",
        key: "rice_crop",
        width: 150,
        render: (record: any) => record.rice_crop_name ? <Tag color="green">{record.rice_crop_name}</Tag> : '-'
    },
    {
      title: "Trạng thái",
      dataIndex: "gift_status",
      key: "gift_status",
      width: 120,
      render: (status: string) => (
        <Tag color={status === 'delivered' ? 'success' : 'warning'}>
          {status === 'delivered' ? 'Đã trao' : 'Chờ trao'}
        </Tag>
      )
    },
    {
        title: "Hành động",
        key: "actions",
        width: 120,
        render: (record: any) => (
            <Space>
                {record.gift_status === 'pending' && (
                  <Tooltip title="Đã trao quà">
                    <Button 
                        icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />} 
                        size="small" 
                        onClick={() => handleMarkAsDelivered(record)}
                        loading={updateRewardMutation.isPending}
                    />
                  </Tooltip>
                )}
                <Button 
                    icon={<EditOutlined />} 
                    size="small" 
                    onClick={() => handleOpenRewardModal(record, true)}
                />
                <Popconfirm
                    title="Xóa lịch sử quà tặng?"
                    description="Thao tác này sẽ xóa cả chi phí quà tặng tương ứng."
                    onConfirm={() => handleDeleteHistory(record.id)}
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true, loading: deleteRewardMutation.isPending }}
                >
                    <Button icon={<DeleteOutlined />} size="small" danger />
                </Popconfirm>
            </Space>
        )
    }
  ]

  // Reset History Columns - lịch sử xóa tích lũy hiện tại
  const resetHistoryColumns = [
    {
      title: (
        <FilterHeader
          title="Khách hàng"
          dataIndex="customer_name"
          value={resetHistoryFilters.customer_name}
          onChange={(val) => {
            setResetHistoryFilters(prev => ({ ...prev, customer_name: val }))
            setResetHistoryPage(1)
          }}
          inputType="text"
          placeholder="Tìm tên / SĐT..."
        />
      ),
      key: "customer",
      width: 240,
      render: (record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.customer_display_name || record.customer?.name || "-"}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.customer_display_phone || record.customer?.phone}
          </Text>
        </Space>
      )
    },
    {
      title: "Tích lũy đã xóa",
      dataIndex: "pending_reset",
      key: "pending_reset",
      width: 160,
      render: (val: number) => <Text strong type="danger">{formatCurrency(Number(val || 0))}</Text>
    },
    {
      title: "Trước khi xóa",
      dataIndex: "pending_before",
      key: "pending_before",
      width: 150,
      render: (val: number) => formatCurrency(Number(val || 0))
    },
    {
      title: "Tổng tích lũy (giữ nguyên)",
      dataIndex: "total_accumulated_snapshot",
      key: "total_accumulated_snapshot",
      width: 180,
      render: (val: number, record: any) => (
        <Space direction="vertical" size={0}>
          <Text>{formatCurrency(Number(val || 0))}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {Number(record.reward_count_snapshot || 0)} lần nhận quà
          </Text>
        </Space>
      )
    },
    {
      title: "Lý do",
      dataIndex: "reason",
      key: "reason",
      width: 220,
      render: (val: string) => (
        <Text ellipsis={{ tooltip: val }} style={{ maxWidth: 200 }}>
          {val}
        </Text>
      )
    },
    {
      title: (
        <FilterHeader
          title="Trạng thái"
          dataIndex="status"
          value={resetHistoryFilters.status}
          onChange={(val) => {
            setResetHistoryFilters(prev => ({ ...prev, status: val }))
            setResetHistoryPage(1)
          }}
          inputType="select"
          options={[
            { label: "Chưa khôi phục", value: "active" },
            { label: "Đã khôi phục", value: "restored" },
          ]}
        />
      ),
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (status: string, record: any) => (
        <Space direction="vertical" size={0}>
          <Tag color={status === 'restored' ? 'green' : 'red'}>
            {status === 'restored' ? 'Đã khôi phục' : 'Chưa khôi phục'}
          </Tag>
          {status === 'restored' && record.restored_at && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {new Date(record.restored_at).toLocaleString('vi-VN')}
              {record.restored_by_name ? ` · ${record.restored_by_name}` : ''}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: "Người xóa",
      key: "created_by",
      width: 170,
      render: (record: any) => (
        <Space direction="vertical" size={0}>
          <Text>{record.created_by_name || '-'}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.created_at ? new Date(record.created_at).toLocaleString('vi-VN') : ''}
          </Text>
        </Space>
      )
    },
    {
      title: "Hành động",
      key: "actions",
      width: 130,
      render: (record: any) => {
        if (record.status === 'restored') {
          return (
            <Tooltip title={`Đã khôi phục ${formatCurrency(Number(record.restored_pending_amount || 0))}`}>
              <Tag color="green">Hoàn tất</Tag>
            </Tooltip>
          )
        }
        if (!canManageReward) return '-'
        return (
          <Popconfirm
            title="Khôi phục tích lũy?"
            description={`Cộng lại ${formatCurrency(Number(record.pending_reset || 0))} vào tích lũy hiện tại của khách.`}
            onConfirm={() => handleRestoreReset(record.id)}
            okText="Khôi phục"
            cancelText="Hủy"
            okButtonProps={{ loading: restoreRewardMutation.isPending }}
          >
            <Button size="small" icon={<UndoOutlined />}>Khôi phục</Button>
          </Popconfirm>
        )
      }
    }
  ]

  return (
    <div className='p-2 md:p-6'>
      <div className='flex justify-start items-center mb-6'>
        <Title level={2}>
            <GiftOutlined className="mr-2" />
            Chăm sóc khách hàng & Quà tặng
        </Title>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <Tabs 
            activeKey={activeTab} 
            onChange={(val) => {
                setActiveTab(val);
                setHistoryPage(1); // Reset page when switching tabs
            }}
            items={[
                {
                    key: "tracking",
                    label: (
                        <span>
                            <CheckCircleOutlined />
                            Tích lũy hiện tại
                        </span>
                    ),
                    children: (
                        <DataTable
                            data={trackingData?.items || []}
                            columns={trackingColumns}
                            loading={isTrackingLoading}
                            pagination={{
                                current: trackingPage,
                                pageSize: pageSize,
                                total: trackingData?.total || 0,
                                onChange: (page) => setTrackingPage(page)
                            }}
                            showSearch={false}
                            showFilters={false}
                            showActions={false}
                        />
                    )
                },
                {
                    key: "history_accumulation",
                    label: (
                        <span>
                            <GiftOutlined />
                            Lịch sử quà tích lũy
                        </span>
                    ),
                    children: (
                        <DataTable 
                            data={accumulationHistoryData?.items || []}
                            columns={historyColumns}
                            loading={isAccumulationLoading}
                            pagination={{
                                current: historyPage,
                                pageSize: pageSize,
                                total: accumulationHistoryData?.total || 0,
                                onChange: (page) => setHistoryPage(page)
                            }}
                            showSearch={false}
                            showFilters={false}
                            showActions={false}
                        />
                    )
                },
                {
                    key: "history_appreciation",
                    label: (
                        <span>
                            <HistoryOutlined />
                            Lịch sử quà tri ân khác
                        </span>
                    ),
                    children: (
                        <div>
                            {/* Nút thêm quà tri ân - chỉ hiện ở tab này */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                                <Button 
                                    type="primary" 
                                    icon={<PlusOutlined />}
                                    onClick={handleOpenAddAppreciationGift}
                                    style={{ background: '#52c41a', border: 'none' }}
                                >
                                    Thêm quà tri ân
                                </Button>
                            </div>
                            <DataTable 
                                data={appreciationHistoryData?.items || []}
                                columns={historyColumns}
                                loading={isAppreciationLoading}
                                pagination={{
                                    current: historyPage,
                                    pageSize: pageSize,
                                    total: appreciationHistoryData?.total || 0,
                                    onChange: (page) => setHistoryPage(page)
                                }}
                                showSearch={false}
                                showFilters={false}
                                showActions={false}
                            />
                        </div>
                    )
                },
                {
                    key: "reset_history",
                    label: (
                        <span>
                            <UndoOutlined />
                            Lịch sử xóa tích lũy
                        </span>
                    ),
                    children: (
                        <DataTable
                            data={resetHistoryData?.items || []}
                            columns={resetHistoryColumns}
                            loading={isResetHistoryLoading}
                            pagination={{
                                current: resetHistoryPage,
                                pageSize: pageSize,
                                total: resetHistoryData?.total || 0,
                                onChange: (page) => setResetHistoryPage(page)
                            }}
                            showSearch={false}
                            showFilters={false}
                            showActions={false}
                        />
                    )
                }
            ]}
        />
      </div>

      {/* Modal xác nhận xóa tích lũy hiện tại của 1 khách hàng */}
      <Modal
        title="Xóa tích lũy hiện tại"
        open={isResetModalOpen}
        onCancel={() => {
          setIsResetModalOpen(false)
          setResetTarget(null)
          setResetReason("")
        }}
        onOk={handleConfirmReset}
        okText="Xóa tích lũy"
        cancelText="Hủy"
        okButtonProps={{ danger: true, disabled: !resetReason.trim() }}
        confirmLoading={resetRewardMutation.isPending}
        width={520}
      >
        <Space direction="vertical" className="w-full" size={12}>
          <Alert
            type="warning"
            showIcon
            message="Chỉ xóa Tích lũy hiện tại"
            description="Tổng tích lũy, số lần nhận quà và lịch sử quà tặng KHÔNG bị thay đổi. Có thể khôi phục lại ở tab Lịch sử xóa tích lũy."
          />
          <div>
            <Text type="secondary">Khách hàng: </Text>
            <Text strong>{resetTarget?.customer?.name || resetTarget?.customer_name}</Text>
            {resetTarget?.customer?.phone ? (
              <Text type="secondary"> · {resetTarget.customer.phone}</Text>
            ) : null}
          </div>
          <div>
            <Text type="secondary">Tích lũy hiện tại sẽ xóa: </Text>
            <Text strong type="danger">{formatCurrency(Number(resetTarget?.pending_amount || 0))}</Text>
          </div>
          <div>
            <Text strong>Lý do xóa tích lũy <Text type="danger">*</Text></Text>
            <Input.TextArea
              value={resetReason}
              onChange={(e) => setResetReason(e.target.value)}
              placeholder="Ví dụ: Khách yêu cầu làm lại tích lũy do nhập sai hóa đơn..."
              rows={3}
              maxLength={1000}
              showCount
              style={{ marginTop: 8 }}
            />
          </div>
        </Space>
      </Modal>

      <Modal
        title="Cấu hình mốc tặng quà"
        open={isThresholdModalOpen}
        onCancel={() => setIsThresholdModalOpen(false)}
        onOk={handleSaveThreshold}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={updateRewardThresholdMutation.isPending}
      >
        <Space direction="vertical" className="w-full" size={12}>
          <div>
            <Text type="secondary">Khách hàng</Text>
            <div>
              <Text strong>{thresholdCustomer?.customer?.name}</Text>
              <Text type="secondary"> {thresholdCustomer?.customer?.phone}</Text>
            </div>
          </div>
          <Form.Item label="Mốc riêng" layout="vertical" className="mb-0">
            <InputNumber
              className="w-full"
              min={1}
              step={1000000}
              controls={false}
              value={thresholdValue}
              placeholder={`Mặc định ${formatCurrency(defaultThreshold)}`}
              formatter={(value) =>
                value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""
              }
              parser={(value) =>
                Number((value || "").replace(/\./g, "").replace(/[^\d]/g, ""))
              }
              addonAfter="đ"
              onChange={(value) => setThresholdValue(value ? Number(value) : null)}
            />
          </Form.Item>
          <Button onClick={() => setThresholdValue(null)}>
            Dùng mốc mặc định
          </Button>
        </Space>
      </Modal>

      {/* Manual Reward Modal */}
      <Modal
        title={
          editingHistoryId ? "Chỉnh sửa quà tặng" 
          : isAddingAppreciationGift ? "✨ Thêm quà tri ân" 
          : "Tặng quà tích lũy"
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
      >
        <form onSubmit={handleSubmit(handleSubmitForm)}>
            {/* Hiện thông tin khách khi đã chọn và không phải chế độ appreciation mới */}
            {!isAddingAppreciationGift && (
              <div className="bg-gray-50 p-3 rounded mb-4">
                <Text strong>Khách hàng: </Text> 
                <Text>{selectedCustomer?.customer?.name || selectedCustomer?.customer_name}</Text>
                {!editingHistoryId && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="flex justify-between">
                      <Text type="secondary">Tích lũy hiện tại:</Text>
                      <Text strong className="text-blue-600">{formatCurrency(Number(selectedCustomer?.pending_amount || 0))}</Text>
                    </div>
                    <div className="flex justify-between mt-1">
                      <Text type="secondary">Gợi ý quà tặng:</Text>
                      <Text strong className="text-amber-600">{formatCurrency(Math.floor((Number(selectedCustomer?.pending_amount || 0) / getRecordThreshold(selectedCustomer)) * 1000000))}</Text>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Chế độ thêm quà tri ân: Cho phép chọn bất kỳ khách hàng nào */}
            {isAddingAppreciationGift && (
              <div className="mb-4 p-3 rounded" style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  🎁 Quà tri ân sẽ được ghi nhận mà <strong>không trừ tích lũy</strong> của khách hàng.
                </Text>
              </div>
            )}

            {isAddingAppreciationGift && (
              <Form.Item label="Khách hàng" layout="vertical" required>
                <Controller
                  name="customer_id"
                  control={control}
                  rules={{ required: "Vui lòng chọn khách hàng" }}
                  render={({ field, fieldState: { error } }) => (
                    <>
                      <Select
                        {...field}
                        showSearch
                        allowClear
                        placeholder="Tìm và chọn khách hàng..."
                        loading={isCustomersLoading}
                        filterOption={false}
                        status={error ? "error" : undefined}
                        onSearch={setCustomerSearchTerm}
                        onChange={(value) => {
                          field.onChange(value)
                          setValue("rice_crop_id", undefined)
                        }}
                        options={customerOptions.map((customer: any) => ({
                          label: customer.label || `${customer.name} - ${customer.phone || ""}`,
                          value: customer.id,
                        }))}
                      />
                      {error && (
                        <div style={{ color: "#ff4d4f", fontSize: 14, marginTop: 4 }}>
                          {error.message}
                        </div>
                      )}
                    </>
                  )}
                />
              </Form.Item>
            )}

            <div className="grid grid-cols-2 gap-4">
                <FormComboBox
                    name="season_id"
                    control={control}
                    label="Mùa vụ"
                    placeholder="Chọn mùa vụ hoặc các vụ tích lũy"
                    options={seasonsData?.data?.items?.map((s: any) => ({
                        label: s.name,
                        value: s.id
                    })) || []}
                    allowClear
                    required
                />

                <FormComboBox
                    name="rice_crop_id"
                    control={control}
                    label="Ruộng lúa liên quan"
                    placeholder="Chọn ruộng lúa của quà tặng"
                    options={riceCropsData?.data?.items?.map((r: any) => ({
                        label: r.field_name,
                        value: r.id
                    })) || []}
                    allowClear
                    disabled={!watch('season_id')}
                />
            </div>

            <Form.Item label="Sản phẩm quà từ kho" layout="vertical">
              <Controller
                name="gift_product_id"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    showSearch
                    allowClear
                    placeholder="Tìm và chọn sản phẩm trong cửa hàng..."
                    loading={isProductsLoading}
                    filterOption={false}
                    onSearch={setProductSearchTerm}
                    onClear={() => {
                      field.onChange(undefined)
                      setValue("gift_quantity", 1)
                      setValue("gift_unit_price", 0)
                    }}
                    onChange={(value) => {
                      field.onChange(value)
                      const product = productOptions.find((p: any) => Number(p.id) === Number(value))
                      if (!product) return

                      const defaultPrice = Number(
                        product.latest_purchase_price ||
                        product.average_cost_price ||
                        product.price ||
                        0
                      )
                      setValue("gift_description", product.trade_name || product.name || `Sản phẩm #${product.id}`)
                      setValue("gift_quantity", 1)
                      setValue("gift_unit_price", defaultPrice)
                    }}
                    options={productOptions.map((product: any) => ({
                      value: product.id,
                      label: `${product.label || product.trade_name || product.name} - tồn ${Number(product.quantity || 0)} ${product.unit?.name || product.unit_name || ''}`,
                    }))}
                  />
                )}
              />
              {watchedGiftProductId && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Tồn kho hiện tại: {Number(selectedGiftProduct?.quantity || 0)} {selectedGiftProduct?.unit?.name || selectedGiftProduct?.unit_name || ''}
                </Text>
              )}
            </Form.Item>

            {watchedGiftProductId && (
              <div className="grid grid-cols-2 gap-4">
                <FormFieldNumber
                  name="gift_quantity"
                  control={control}
                  label="Số lượng sản phẩm"
                  placeholder="1"
                  decimalScale={4}
                  min={0.0001}
                  required
                />
                <FormFieldNumber
                  name="gift_unit_price"
                  control={control}
                  label="Đơn giá hạch toán (đ)"
                  placeholder="0"
                  decimalScale={0}
                  suffix=" đ"
                  min={0}
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <FormField
                    name="gift_description"
                    control={control}
                    label="Mô tả quà tặng"
                    placeholder="Ví dụ: 1 bao phân DAP, Bộ ấm trà..."
                    required
                />

                <FormComboBox
                    name="gift_status"
                    control={control}
                    label="Trạng thái trao quà"
                    placeholder="Chọn trạng thái"
                    options={[
                        { label: 'Chờ trao', value: 'pending' },
                        { label: 'Đã trao', value: 'delivered' },
                        { label: 'Đã hủy', value: 'cancelled' },
                    ]}
                />
            </div>

            <FormFieldNumber
                name="gift_value"
                control={control}
                label="Giá trị quà tặng (đ)"
                placeholder="0"
                decimalScale={0}
                suffix=" đ"
                disabled={!!watchedGiftProductId}
            />

            <FormField
                name="notes"
                control={control}
                label="Ghi chú"
                type="textarea"
                placeholder="Nhập ghi chú chi tiết nếu có"
                rows={3}
            />

            <div className="flex justify-end gap-2 mt-6">
                <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
                <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={createRewardMutation.isPending || updateRewardMutation.isPending}
                    className="bg-amber-500 border-none"
                >
                    {editingHistoryId ? 'Cập nhật' : 'Xác nhận tặng quà'}
                </Button>
            </div>
        </form>
      </Modal>
    </div>
  )
}

export default CustomerRewardsPage
