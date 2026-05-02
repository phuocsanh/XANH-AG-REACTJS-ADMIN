import React from "react"
import dayjs from "dayjs"
import {
  Button,
  Card,
  Input,
  InputNumber,
  Modal,
  Popover,
  Progress,
  Space,
  Table,
  Tag,
  Typography,
  Skeleton,
} from "antd"
import {
  CheckCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  EyeOutlined,
  EditOutlined,
  GiftOutlined,
  PauseCircleOutlined,
  PlusOutlined,
  StopOutlined,
} from "@ant-design/icons"
import { useForm } from "react-hook-form"
import DataTable from "@/components/common/data-table"
import FilterHeader from "@/components/common/filter-header"
import { FormComboBox, FormDatePicker, FormField, FormFieldNumber } from "@/components/form"
import {
  CreatePromotionCampaignRequest,
  PromotionCampaign,
  PromotionCampaignParticipant,
  PromotionCampaignStatus,
  PromotionRewardPoolItem,
  PromotionRewardReservation,
} from "@/models/promotion-campaign"
import { useProductsByIdsQuery, useProductSearch } from "@/queries/product"
import {
  useCreatePromotionCampaignMutation,
  useIssuePromotionReservationMutation,
  usePromotionCampaignParticipantsQuery,
  usePromotionCampaignQuery,
  usePromotionCampaignReservationsQuery,
  usePromotionCampaignsQuery,
  useSetPromotionParticipantForceWinMutation,
  useUpdatePromotionCampaignMutation,
  useUpdatePromotionCampaignStatusMutation,
} from "@/queries/promotion-campaign"

const { Title, Text } = Typography

type CampaignFormValues = {
  code: string
  name: string
  start_at: string | null
  end_at: string | null
  threshold_amount: number
  base_win_rate: number
  second_win_rate: number
  max_reward_per_customer: number
  notes: string
  product_ids: number[]
}

const defaultValues: CampaignFormValues = {
  code: "",
  name: "",
  start_at: null,
  end_at: null,
  threshold_amount: 0,
  base_win_rate: 8,
  second_win_rate: 2,
  max_reward_per_customer: 2,
  notes: "",
  product_ids: [],
}

const defaultReward = (): PromotionRewardPoolItem => ({
  reward_name: "",
  reward_value: 0,
  total_quantity: 1,
  sort_order: 0,
  monthly_release: [{ month_index: 1, release_quantity: 1 }],
})

const statusOptions = [
  { label: "Nháp", value: "draft" },
  { label: "Đang chạy", value: "active" },
  { label: "Đã kết thúc", value: "ended" },
  { label: "Lưu trữ", value: "archived" },
]

const statusMeta: Record<PromotionCampaignStatus, { label: string; color: string }> = {
  draft: { label: "Nháp", color: "default" },
  active: { label: "Đang chạy", color: "green" },
  ended: { label: "Đã kết thúc", color: "orange" },
  archived: { label: "Lưu trữ", color: "red" },
}

const formatCurrency = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0))

const getCampaignMonthCount = (startAt?: string | null, endAt?: string | null) => {
  if (!startAt || !endAt) return 1

  const start = dayjs(startAt)
  const end = dayjs(endAt)
  if (!start.isValid() || !end.isValid() || end.isBefore(start)) return 1

  return Math.max(1, end.startOf("month").diff(start.startOf("month"), "month") + 1)
}

const buildEvenMonthlyRelease = (totalQuantity: number, monthCount: number) => {
  const safeQuantity = Math.max(0, Number(totalQuantity || 0))
  const safeMonthCount = Math.max(1, Number(monthCount || 1))
  const buckets = Array.from({ length: safeMonthCount }, (_, index) => ({
    month_index: index + 1,
    release_quantity: 0,
  }))

  if (safeQuantity <= 0) return buckets

  for (let i = 0; i < safeQuantity; i += 1) {
    const bucketIndex = Math.min(
      safeMonthCount - 1,
      Math.floor((i * safeMonthCount) / safeQuantity),
    )
    buckets[bucketIndex].release_quantity += 1
  }

  return buckets
}

const PromotionCampaignsPage: React.FC = () => {
  const [filters, setFilters] = React.useState<Record<string, any>>({})
  const [page, setPage] = React.useState(1)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [productSearchTerm, setProductSearchTerm] = React.useState("")
  const [selectedCampaign, setSelectedCampaign] = React.useState<PromotionCampaign | null>(null)
  const [isReservationsModalOpen, setIsReservationsModalOpen] = React.useState(false)
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = React.useState(false)
  const [participantKeyword, setParticipantKeyword] = React.useState("")
  const [rewards, setRewards] = React.useState<PromotionRewardPoolItem[]>([defaultReward()])

  const pageSize = 10

  const { control, handleSubmit, reset, setValue, watch } = useForm<CampaignFormValues>({
    defaultValues,
  })

  const selectedProductIds = watch("product_ids") || []
  const startAt = watch("start_at")
  const endAt = watch("end_at")
  const campaignMonthCount = React.useMemo(
    () => getCampaignMonthCount(startAt, endAt),
    [startAt, endAt],
  )
  const campaignDayCount = React.useMemo(() => {
    if (!startAt || !endAt) return 0
    return Math.max(0, dayjs(endAt).diff(dayjs(startAt), "day"))
  }, [startAt, endAt])

  const { data: campaignsData, isLoading: isCampaignsLoading } = usePromotionCampaignsQuery({
    page,
    limit: pageSize,
    ...filters,
  })
  const { data: campaignDetail, isLoading: isCampaignDetailLoading } =
    usePromotionCampaignQuery(editingId)
  // Load chi tiết khi mở modal participants HOẶC modal tổng quan (reservations)
  const { data: selectedCampaignDetail, isLoading: isSelectedCampaignDetailLoading } =
    usePromotionCampaignQuery(
      isParticipantsModalOpen || isReservationsModalOpen ? selectedCampaign?.id : undefined,
    )
  const { data: reservationsData, isLoading: isReservationsLoading } =
    usePromotionCampaignReservationsQuery(selectedCampaign?.id)
  const { data: participantsData, isLoading: isParticipantsLoading } =
    usePromotionCampaignParticipantsQuery(selectedCampaign?.id, {
      page: 1,
      limit: 100,
      keyword: participantKeyword || undefined,
    })

  const {
    data: productSearchData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isProductSearchLoading,
    isFetching: isProductSearching,
  } = useProductSearch(productSearchTerm, 20, isModalOpen)
  const { data: selectedProducts } = useProductsByIdsQuery(selectedProductIds)

  const createMutation = useCreatePromotionCampaignMutation()
  const updateMutation = useUpdatePromotionCampaignMutation()
  const updateStatusMutation = useUpdatePromotionCampaignStatusMutation()
  const issueReservationMutation = useIssuePromotionReservationMutation()
  const forceWinMutation = useSetPromotionParticipantForceWinMutation()

  const productOptions = React.useMemo(() => {
    const optionMap = new Map<number, { value: number; label: string }>()
    selectedProducts?.forEach((product) => {
      optionMap.set(product.id, {
        value: product.id,
        label:
          product.trade_name && product.trade_name !== product.name
            ? `${product.trade_name} (${product.name})`
            : product.trade_name || product.name || `Sản phẩm #${product.id}`,
      })
    })
    productSearchData?.pages.forEach((searchPage: any) => {
      ;(searchPage?.data || []).forEach((product: any) => {
        optionMap.set(Number(product.value || product.id), {
          value: Number(product.value || product.id),
          label: product.label,
        })
      })
    })
    return Array.from(optionMap.values())
  }, [productSearchData, selectedProducts])

  const selectedProductList = React.useMemo(
    () =>
      (selectedProducts || []).map((product) => ({
        id: product.id,
        code: product.code,
        trade_name: product.trade_name,
        name: product.name,
        label:
          product.trade_name && product.trade_name !== product.name
            ? `${product.trade_name} (${product.name})`
            : product.trade_name || product.name || `Sản phẩm #${product.id}`,
      })),
    [selectedProducts],
  )

  React.useEffect(() => {
    if (!campaignDetail || !editingId) return
    reset({
      code: campaignDetail.code || "",
      name: campaignDetail.name || "",
      start_at: campaignDetail.start_at || null,
      end_at: campaignDetail.end_at || null,
      threshold_amount: Number(campaignDetail.threshold_amount || 0),
      base_win_rate: Number(campaignDetail.base_win_rate || 8),
      second_win_rate: Number(campaignDetail.second_win_rate || 2),
      max_reward_per_customer: Number(campaignDetail.max_reward_per_customer || 2),
      notes: campaignDetail.notes || "",
      product_ids: (campaignDetail.products || []).map((item) => Number(item.product_id)),
    })
    setRewards(
      campaignDetail.reward_pools?.length
        ? campaignDetail.reward_pools.map((reward) => ({
            reward_name: reward.reward_name,
            reward_value: Number(reward.reward_value || 0),
            total_quantity: Number(reward.total_quantity || 0),
            sort_order: reward.sort_order || 0,
            monthly_release:
              reward.monthly_release?.length
                ? reward.monthly_release.map((release) => ({
                    month_index: release.month_index,
                    release_quantity: release.release_quantity,
                  }))
                : [{ month_index: 1, release_quantity: Number(reward.total_quantity || 0) }],
          }))
        : [defaultReward()],
    )
  }, [campaignDetail, editingId, reset])

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setProductSearchTerm("")
    setRewards([defaultReward()])
    reset(defaultValues)
  }

  const openCreateModal = () => {
    setEditingId(null)
    setProductSearchTerm("")
    setRewards([defaultReward()])
    reset(defaultValues)
    setIsModalOpen(true)
  }

  const openEditModal = (record: PromotionCampaign) => {
    setEditingId(record.id)
    setProductSearchTerm("")
    setRewards([defaultReward()])
    reset(defaultValues)
    setIsModalOpen(true)
  }

  /**
   * Mở modal tạo mới nhưng prefill dữ liệu từ campaign gốc (nhân bản).
   * Code tự động thêm hậu tố _COPY, name thêm " (Bản sao)", status về draft.
   */
  const openCloneModal = (record: PromotionCampaign) => {
    setEditingId(null) // Tạo mới, không phải chỉnh sửa
    setProductSearchTerm("")

    // Prefill rewards từ campaign gốc (nếu có)
    const clonedRewards: PromotionRewardPoolItem[] =
      record.reward_pools?.length
        ? record.reward_pools.map((reward) => ({
            reward_name: reward.reward_name,
            reward_value: Number(reward.reward_value || 0),
            total_quantity: Number(reward.total_quantity || 0),
            sort_order: reward.sort_order || 0,
            monthly_release:
              reward.monthly_release?.length
                ? reward.monthly_release.map((release) => ({
                    month_index: release.month_index,
                    release_quantity: release.release_quantity,
                  }))
                : [{ month_index: 1, release_quantity: Number(reward.total_quantity || 0) }],
          }))
        : [defaultReward()]

    setRewards(clonedRewards)

    // Prefill form values từ campaign gốc
    reset({
      code: `${record.code}_COPY`,
      name: `${record.name} (Bản sao)`,
      start_at: record.start_at || null,
      end_at: record.end_at || null,
      threshold_amount: Number(record.threshold_amount || 0),
      base_win_rate: Number(record.base_win_rate || 8),
      second_win_rate: Number(record.second_win_rate || 2),
      max_reward_per_customer: Number(record.max_reward_per_customer || 2),
      notes: record.notes || "",
      product_ids: (record.products || []).map((item) => Number(item.product_id)),
    })

    setIsModalOpen(true)
  }

  const openReservationsModal = (record: PromotionCampaign) => {
    setSelectedCampaign(record)
    setIsReservationsModalOpen(true)
  }

  const openParticipantsModal = (record: PromotionCampaign) => {
    setSelectedCampaign(record)
    setParticipantKeyword("")
    setIsParticipantsModalOpen(true)
  }

  const closeReservationsModal = () => {
    setSelectedCampaign(null)
    setIsReservationsModalOpen(false)
  }

  const closeParticipantsModal = () => {
    setSelectedCampaign(null)
    setParticipantKeyword("")
    setIsParticipantsModalOpen(false)
  }

  const totalRewardQuantity = rewards.reduce(
    (sum, reward) => sum + Number(reward.total_quantity || 0),
    0,
  )
  const totalRewardBudget = rewards.reduce(
    (sum, reward) =>
      sum + Number(reward.reward_value || 0) * Number(reward.total_quantity || 0),
    0,
  )

  const validateRewards = () => {
    if (!rewards.length) {
      throw new Error("Phải có ít nhất 1 loại quà")
    }
    rewards.forEach((reward) => {
      if (!reward.reward_name.trim()) {
        throw new Error("Tên quà không được để trống")
      }
      if (Number(reward.reward_value || 0) <= 0) {
        throw new Error(`Giá trị quà "${reward.reward_name || "..."}" phải lớn hơn 0`)
      }
      if (Number(reward.total_quantity || 0) < 1) {
        throw new Error(`Số lượng quà "${reward.reward_name || "..."}" phải lớn hơn 0`)
      }
      const totalRelease = reward.monthly_release.reduce(
        (sum, release) => sum + Number(release.release_quantity || 0),
        0,
      )
      const monthIndexes = reward.monthly_release.map((release) => Number(release.month_index || 0))
      if (new Set(monthIndexes).size !== monthIndexes.length) {
        throw new Error(`Quota tháng của "${reward.reward_name || "..."}" không được trùng tháng`)
      }
      if (totalRelease !== Number(reward.total_quantity || 0)) {
        throw new Error(`Tổng quota theo tháng của "${reward.reward_name || "..."}" phải bằng tổng số lượng`)
      }
    })
  }

  const onSubmit = async (values: CampaignFormValues) => {
    validateRewards()

    const payload: CreatePromotionCampaignRequest = {
      code: values.code.trim(),
      name: values.name.trim(),
      start_at: values.start_at || "",
      end_at: values.end_at || "",
      threshold_amount: Number(values.threshold_amount || 0),
      base_win_rate: Number(values.base_win_rate || 0),
      second_win_rate: Number(values.second_win_rate || 2),
      max_reward_per_customer: Number(values.max_reward_per_customer || 2),
      notes: values.notes?.trim() || undefined,
      product_ids: values.product_ids.map(Number),
      rewards: rewards.map((reward, index) => ({
        reward_name: reward.reward_name.trim(),
        reward_value: Number(reward.reward_value || 0),
        total_quantity: Number(reward.total_quantity || 0),
        sort_order: index,
        monthly_release: reward.monthly_release.map((release) => ({
          month_index: Number(release.month_index || 1),
          release_quantity: Number(release.release_quantity || 0),
        })).sort((a, b) => a.month_index - b.month_index),
      })),
    }

    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, data: payload })
    } else {
      await createMutation.mutateAsync(payload)
    }

    closeModal()
  }

  const updateReward = (index: number, patch: Partial<PromotionRewardPoolItem>) => {
    setRewards((current) =>
      current.map((reward, rewardIndex) =>
        rewardIndex === index ? { ...reward, ...patch } : reward,
      ),
    )
  }

  const updateRelease = (
    rewardIndex: number,
    releaseIndex: number,
    patch: Partial<{ month_index: number; release_quantity: number }>,
  ) => {
    setRewards((current) =>
      current.map((reward, index) => {
        if (index !== rewardIndex) return reward
        return {
          ...reward,
          monthly_release: reward.monthly_release.map((release, idx) =>
            idx === releaseIndex ? { ...release, ...patch } : release,
          ),
        }
      }),
    )
  }

  const addReward = () => {
    setRewards((current) => [...current, defaultReward()])
  }

  const autoDistributeReward = (rewardIndex: number) => {
    setRewards((current) =>
      current.map((reward, index) =>
        index === rewardIndex
          ? {
              ...reward,
              monthly_release: buildEvenMonthlyRelease(
                Number(reward.total_quantity || 0),
                campaignMonthCount,
              ),
            }
          : reward,
      ),
    )
  }

  const autoDistributeAllRewards = () => {
    setRewards((current) =>
      current.map((reward) => ({
        ...reward,
        monthly_release: buildEvenMonthlyRelease(
          Number(reward.total_quantity || 0),
          campaignMonthCount,
        ),
      })),
    )
  }

  const addReleaseRow = (rewardIndex: number) => {
    setRewards((current) =>
      current.map((reward, index) => {
        if (index !== rewardIndex) return reward
        const maxMonthIndex = reward.monthly_release.reduce(
          (max, release) => Math.max(max, Number(release.month_index || 0)),
          0,
        )
        return {
          ...reward,
          monthly_release: [
            ...reward.monthly_release,
            { month_index: maxMonthIndex + 1, release_quantity: 0 },
          ],
        }
      }),
    )
  }

  const removeReleaseRow = (rewardIndex: number, releaseIndex: number) => {
    setRewards((current) =>
      current.map((reward, index) => {
        if (index !== rewardIndex) return reward
        if (reward.monthly_release.length <= 1) return reward
        return {
          ...reward,
          monthly_release: reward.monthly_release.filter((_, idx) => idx !== releaseIndex),
        }
      }),
    )
  }

  const removeReward = (index: number) => {
    setRewards((current) => current.filter((_, idx) => idx !== index))
  }

  const handleStatusChange = async (record: PromotionCampaign, status: PromotionCampaignStatus) => {
    await updateStatusMutation.mutateAsync({ id: record.id, status })
  }

  const removeSelectedProduct = (productId: number) => {
    setValue(
      "product_ids",
      selectedProductIds.filter((id) => Number(id) !== Number(productId)),
      { shouldDirty: true, shouldValidate: true },
    )
  }

  const columns = [
    {
      title: (
        <FilterHeader
          title="Campaign"
          value={filters.keyword}
          onChange={(value) => {
            setFilters((prev: Record<string, any>) => ({ ...prev, keyword: value || undefined }))
            setPage(1)
          }}
          placeholder="Mã hoặc tên campaign..."
        />
      ),
      key: "campaign",
      width: 260,
      render: (record: PromotionCampaign) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.name}</Text>
          <Text type="secondary">{record.code}</Text>
        </Space>
      ),
    },
    {
      title: "Mốc cộng 1 lượt",
      key: "threshold_amount",
      width: 160,
      render: (record: PromotionCampaign) => formatCurrency(record.threshold_amount),
    },
    {
      title: "Tỉ lệ trúng",
      key: "rates",
      width: 160,
      render: (record: PromotionCampaign) => (
        <Space direction="vertical" size={0}>
          <Text>Khởi điểm: {Number(record.base_win_rate || 0)}%</Text>
          <Text type="secondary">Lần 2: {Number(record.second_win_rate || 0)}%</Text>
        </Space>
      ),
    },
    {
      title: "Quà tối đa",
      key: "reward_summary",
      width: 220,
      render: (record: PromotionCampaign) => (
        <Space direction="vertical" size={0}>
          <Text>{record.total_reward_quantity || 0} phần quà</Text>
          <Text type="secondary">{formatCurrency(record.total_reward_budget || 0)}</Text>
        </Space>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 130,
      render: (record: PromotionCampaign) => (
        <Tag color={statusMeta[record.status]?.color}>{statusMeta[record.status]?.label}</Tag>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Title level={3} className="!mb-1">
              Campaign quay thưởng tích lũy
            </Title>
            <Text type="secondary">
              Cấu hình mốc tích lũy, tỉ lệ khởi điểm, cơ cấu quà và quota phát hành theo tháng cho từng loại quà.
            </Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Tạo campaign
          </Button>
        </div>
      </Card>

      <Card>
        <DataTable<PromotionCampaign>
          rowKey="id"
          columns={columns}
          data={campaignsData?.items || []}
          loading={isCampaignsLoading || updateStatusMutation.isPending}
          showSTT
          showActions
          actionButtons={[
            {
              key: "participants",
              icon: <GiftOutlined />,
              tooltip: "Khách hàng tham gia / lượt quay",
              onClick: (record) => openParticipantsModal(record as PromotionCampaign),
            },
            {
              key: "reservations",
              icon: <EyeOutlined />,
              tooltip: "Xem tổng quan chiến dịch",
              onClick: (record) => openReservationsModal(record as PromotionCampaign),
            },
            {
              key: "edit",
              icon: <EditOutlined />,
              tooltip: "Chỉnh sửa",
              onClick: (record) => openEditModal(record as PromotionCampaign),
            },
            {
              key: "clone",
              icon: <CopyOutlined />,
              tooltip: "Nhân bản campaign",
              onClick: (record) => openCloneModal(record as PromotionCampaign),
            },
            {
              key: "activate",
              icon: <CheckCircleOutlined />,
              tooltip: "Kích hoạt",
              onClick: (record) => handleStatusChange(record as PromotionCampaign, "active"),
              disabled: (record) => (record as PromotionCampaign).status === "active",
            },
            {
              key: "end",
              icon: <PauseCircleOutlined />,
              tooltip: "Kết thúc",
              onClick: (record) => handleStatusChange(record as PromotionCampaign, "ended"),
            },
            {
              key: "archive",
              icon: <StopOutlined />,
              tooltip: "Lưu trữ",
              onClick: (record) => handleStatusChange(record as PromotionCampaign, "archived"),
            },
          ]}
          paginationConfig={{
            current: page,
            pageSize,
            total: campaignsData?.total || 0,
            showSizeChanger: false,
            showQuickJumper: false,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} campaign`,
          }}
          onChange={(pagination) => {
            if (pagination.current) setPage(pagination.current)
          }}
          emptyText="Chưa có campaign nào"
        />
      </Card>

      <Modal
        title={editingId ? "Cập nhật campaign quay thưởng" : "Tạo campaign quay thưởng"}
        open={isModalOpen}
        onCancel={closeModal}
        width={1080}
        footer={[
          <Button key="cancel" onClick={closeModal}>Hủy</Button>,
          <Button
            key="submit"
            type="primary"
            loading={createMutation.isPending || updateMutation.isPending || isCampaignDetailLoading}
            onClick={handleSubmit(onSubmit)}
          >
            {editingId ? "Lưu thay đổi" : "Tạo campaign"}
          </Button>,
        ]}
      >
        {isCampaignDetailLoading ? (
          <div className="py-10">
            <Skeleton active paragraph={{ rows: 12 }} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField name="code" control={control} label="Mã campaign" required />
          <FormField name="name" control={control} label="Tên campaign" required />
          <FormDatePicker name="start_at" control={control} label="Bắt đầu" showTime format="DD/MM/YYYY HH:mm" required />
          <FormDatePicker name="end_at" control={control} label={`Kết thúc ${campaignDayCount > 0 ? `(Tổng ${campaignDayCount} ngày)` : ""}`} showTime format="DD/MM/YYYY HH:mm" required />
          <FormFieldNumber name="threshold_amount" control={control} label="Ngưỡng cộng 1 lượt quay" addonAfter="VND" required />
          <FormFieldNumber name="base_win_rate" control={control} label="Tỉ lệ khởi điểm lượt đầu" addonAfter="%" required />
          <FormFieldNumber name="second_win_rate" control={control} label="Tỉ lệ nền lượt trúng lần 2" addonAfter="%" required />
          <FormFieldNumber name="max_reward_per_customer" control={control} label="Số lần trúng tối đa / khách" required />
        </div>

        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Tỉ lệ trên là tỉ lệ khởi điểm. Backend sẽ tự tăng hoặc giảm tỉ lệ trúng thực tế theo tiến độ tháng và quota còn lại
          của tháng hiện tại để tránh cháy quà quá sớm hoặc treo quà đến cuối tháng.
        </div>

        <div className="mt-2">
          <FormComboBox
            name="product_ids"
            control={control}
            label="Sản phẩm áp dụng"
            mode="multiple"
            required
            data={productOptions}
            isLoading={isProductSearchLoading || isCampaignDetailLoading}
            isFetching={isProductSearching}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            onSearch={setProductSearchTerm}
            enableLoadMore
            maxTagCount="responsive"
          />
        </div>

        {selectedProductList.length > 0 && (
          <Card size="small" className="mt-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <Title level={5} className="!mb-0">Sản phẩm đã chọn</Title>
                <Text type="secondary">Theo dõi danh sách áp dụng và xóa nhanh từng sản phẩm ở đây.</Text>
              </div>
              <Text strong>{selectedProductList.length} sản phẩm</Text>
            </div>

            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {selectedProductList.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-800">{product.label}</div>
                    <div className="text-sm text-slate-500">
                      {product.code ? `Mã: ${product.code}` : `ID: ${product.id}`}
                    </div>
                  </div>
                  <Button
                    danger
                    type="text"
                    icon={<DeleteOutlined />}
                    onClick={() => removeSelectedProduct(product.id)}
                  >
                    Xóa
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        <FormField
          name="notes"
          control={control}
          label="Ghi chú"
          type="textarea"
          rows={3}
          placeholder="Ghi chú nội bộ cho campaign"
        />

        <Card size="small" className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <Title level={5} className="!mb-0">Cơ cấu quà tặng</Title>
              <Text type="secondary">Nhập theo từng loại quà, hệ thống tự tính tổng số quà và tổng ngân sách tối đa.</Text>
            </div>
            <Space>
              <Button onClick={autoDistributeAllRewards}>
                Gợi ý chia đều {campaignMonthCount} tháng
              </Button>
              <Button icon={<PlusOutlined />} onClick={addReward}>Thêm loại quà</Button>
            </Space>
          </div>

          <div className="space-y-4">
            {rewards.map((reward, rewardIndex) => (
              <Card key={rewardIndex} size="small">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <div>
                    <Text strong>Tên quà</Text>
                    <Input
                      value={reward.reward_name}
                      onChange={(e) => updateReward(rewardIndex, { reward_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Text strong>Giá trị</Text>
                    <InputNumber
                      className="!w-full"
                      min={0}
                      value={reward.reward_value}
                      formatter={(value) =>
                        value ? `${Number(value).toLocaleString("vi-VN")}` : ""
                      }
                      parser={(value) => Number(String(value || "").replace(/[^\d]/g, ""))}
                      onChange={(value) => updateReward(rewardIndex, { reward_value: Number(value || 0) })}
                    />
                  </div>
                  <div>
                    <Text strong>Số lượng</Text>
                    <InputNumber
                      className="!w-full"
                      min={1}
                      value={reward.total_quantity}
                      onChange={(value) => updateReward(rewardIndex, { total_quantity: Number(value || 1) })}
                    />
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <Text strong>Tổng giá trị</Text>
                      <div className="mt-1 font-semibold">
                        {formatCurrency(Number(reward.reward_value || 0) * Number(reward.total_quantity || 0))}
                      </div>
                    </div>
                    <Button danger onClick={() => removeReward(rewardIndex)}>Xóa</Button>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between gap-3">
                    <Text strong>Quota theo tháng</Text>
                    <Space>
                      <Button size="small" onClick={() => autoDistributeReward(rewardIndex)}>
                        Gợi ý chia đều
                      </Button>
                      <Button size="small" onClick={() => addReleaseRow(rewardIndex)}>Thêm tháng</Button>
                    </Space>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-4">
                    {reward.monthly_release.map((release, releaseIndex) => (
                      <div key={releaseIndex} className="rounded-lg border border-slate-200 p-3">
                        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                          <div>
                            <Text type="secondary">Tháng</Text>
                            <InputNumber
                              className="!w-full"
                              min={1}
                              value={release.month_index}
                              onChange={(value) =>
                                updateRelease(rewardIndex, releaseIndex, {
                                  month_index: Number(value || 1),
                                })
                              }
                            />
                          </div>
                          <div>
                            <Text type="secondary">Số lượng mở</Text>
                            <InputNumber
                              className="!w-full"
                              min={0}
                              value={release.release_quantity}
                              onChange={(value) =>
                                updateRelease(rewardIndex, releaseIndex, {
                                  release_quantity: Number(value || 0),
                                })
                              }
                            />
                          </div>
                          <Button
                            danger
                            disabled={reward.monthly_release.length <= 1}
                            onClick={() => removeReleaseRow(rewardIndex, releaseIndex)}
                          >
                            Xóa
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <Space size={24} wrap>
              <Text strong>Tổng số loại quà: {rewards.length}</Text>
              <Text strong>Tổng số quà tối đa: {totalRewardQuantity}</Text>
              <Text strong>Tổng giá trị tối đa: {formatCurrency(totalRewardBudget)}</Text>
            </Space>
          </div>
        </Card>
        </>
        )}
      </Modal>

      <Modal
        title={selectedCampaign ? `Khách tham gia - ${selectedCampaign.name}` : "Khách tham gia"}
        open={isParticipantsModalOpen}
        onCancel={closeParticipantsModal}
        width={1180}
        footer={[<Button key="close" onClick={closeParticipantsModal}>Đóng</Button>]}
      >
        <Table<PromotionCampaignParticipant>
          rowKey="customer_id"
          loading={isParticipantsLoading || forceWinMutation.isPending}
          dataSource={participantsData?.items || []}
          pagination={false}
          title={() => (
            <div className="flex items-center justify-between gap-3">
              <div>
                <Text strong>Theo dõi khách đang có bao nhiêu lượt quay và set force trúng 1 lần</Text>
              </div>
              <Input
                allowClear
                placeholder="Tìm khách hàng, số điện thoại..."
                value={participantKeyword}
                onChange={(e) => setParticipantKeyword(e.target.value)}
                style={{ maxWidth: 320 }}
              />
            </div>
          )}
          columns={[
            {
              title: "Khách hàng",
              render: (_, record) => (
                <Space direction="vertical" size={0}>
                  <Text strong>{record.customer?.name || `KH #${record.customer_id}`}</Text>
                  <Text type="secondary">{record.customer?.phone || record.customer?.code}</Text>
                </Space>
              ),
            },
            {
              title: "Đã tích lũy",
              width: 150,
              render: (_, record) => formatCurrency(record.qualified_amount),
            },
            {
              title: "Lượt quay",
              width: 180,
              render: (_, record) => (
                <Space direction="vertical" size={0}>
                  <Text>Có: {record.earned_spin_count}</Text>
                  <Text type="secondary">Dùng: {record.used_spin_count} · Còn: {record.remaining_spin_count}</Text>
                </Space>
              ),
            },
            {
              title: "Đã trúng",
              width: 90,
              render: (_, record) => record.win_count,
            },
            {
              title: "Force trúng",
              width: 260,
              render: (_, record) =>
                record.is_blocked ? (
                  <Tag color="red">Bị chặn trúng thưởng</Tag>
                ) : record.force_win_pending ? (
                  <Space direction="vertical" size={0}>
                    <Tag color="gold">Đang chờ quay trúng 1 lần</Tag>
                    <Text type="secondary">
                      {record.forced_reward_name}
                      {record.forced_reward_value
                        ? ` · ${formatCurrency(record.forced_reward_value)}`
                        : ""}
                      {record.forced_month_index ? ` · Tháng ${record.forced_month_index}` : ""}
                    </Text>
                  </Space>
                ) : (
                  <Text type="secondary">Chưa set</Text>
                ),
            },
            {
              title: "Thao tác",
              width: 170,
              render: (_, record) => {
                const isForced = record.force_win_pending;
                const isBlocked = record.is_blocked;
                const forceCampaign = selectedCampaignDetail || selectedCampaign;

                return (
                  <Space direction="vertical" size={4}>
                    {isForced ? (
                      <Button
                        size="small"
                        danger
                        onClick={() =>
                          selectedCampaign &&
                          forceWinMutation.mutateAsync({
                            id: selectedCampaign.id,
                            customerId: record.customer_id,
                            note: "UNSET",
                          })
                        }
                      >
                        Gỡ force
                      </Button>
                    ) : (
                      <Popover
                        content={
                          <div className="w-80 space-y-3">
                            <Text strong>Chọn quà & tháng chắc chắn trúng:</Text>
                            <div className="max-h-72 overflow-y-auto pr-1">
                              {(forceCampaign?.reward_pools || []).map(pool => (
                                <div key={pool.reward_name} className="mb-4 last:mb-0">
                                  <div className="bg-slate-50 px-2 py-1 rounded mb-2 border-l-4 border-emerald-500">
                                    <Text strong>{pool.reward_name}</Text>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 pl-2">
                                    {(pool.monthly_release || [])
                                      .filter(r => r.release_quantity > 0)
                                      .sort((a, b) => a.month_index - b.month_index)
                                      .map(release => {
                                        const availableQuantity = Number(
                                          release.available_quantity ?? release.release_quantity ?? 0,
                                        );
                                        const isUnavailable = availableQuantity <= 0;
                                        
                                        return (
                                          <Button
                                            key={release.month_index}
                                            size="small"
                                            type="dashed"
                                            disabled={isUnavailable}
                                            className="text-xs flex h-auto min-h-9 flex-col items-start justify-center"
                                            onClick={() => 
                                              selectedCampaign &&
                                              forceWinMutation.mutateAsync({
                                                id: selectedCampaign.id,
                                                customerId: record.customer_id,
                                                rewardPoolId: pool.id,
                                                bucketMonth: release.month_index,
                                                note: `${pool.reward_name} · Tháng ${release.month_index}`,
                                              })
                                            }
                                          >
                                            <span>Tháng {release.month_index}</span>
                                            <span className="text-[11px] text-slate-500">
                                              Còn {availableQuantity}/{release.release_quantity}
                                            </span>
                                          </Button>
                                        );
                                      })}
                                  </div>
                                </div>
                              ))}
                              {(forceCampaign?.reward_pools || []).length === 0 && (
                                <Text type="secondary">Chiến dịch chưa có cấu trúc quà tặng</Text>
                              )}
                            </div>
                          </div>
                        }
                        title="Thiết lập trúng thưởng đích danh"
                        trigger="click"
                        placement="left"
                      >
                        <Button size="small" disabled={isBlocked}>Set trúng 1 lần</Button>
                      </Popover>
                    )}

                    {isBlocked ? (
                      <Button
                        size="small"
                        onClick={() =>
                          selectedCampaign &&
                          forceWinMutation.mutateAsync({
                            id: selectedCampaign.id,
                            customerId: record.customer_id,
                            note: "UNSET",
                          })
                        }
                      >
                        Bỏ chặn
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        danger
                        disabled={isForced}
                        onClick={() =>
                          selectedCampaign &&
                          forceWinMutation.mutateAsync({
                            id: selectedCampaign.id,
                            customerId: record.customer_id,
                            note: "BLOCK",
                          })
                        }
                      >
                        Chặn trúng
                      </Button>
                    )}
                  </Space>
                );
              },
            },
          ]}
        />
      </Modal>

      {/* Modal tổng quan chiến dịch: tiến độ quà theo tháng + ngày còn lại + danh sách trúng */}
      <Modal
        title={
          selectedCampaign
            ? `Tổng quan chiến dịch — ${selectedCampaign.name}`
            : "Tổng quan chiến dịch"
        }
        open={isReservationsModalOpen}
        onCancel={closeReservationsModal}
        width={1100}
        styles={{ body: { maxHeight: "80vh", overflowY: "auto" } }}
        footer={[<Button key="close" onClick={closeReservationsModal}>Đóng</Button>]}
      >
        {isSelectedCampaignDetailLoading ? (
          <div className="py-10 text-center">
            <Text type="secondary">Đang tải dữ liệu chiến dịch...</Text>
          </div>
        ) : selectedCampaignDetail ? (
          <div className="space-y-4">

            {/* ── Thông tin tổng quan ── */}
            {(() => {
              const daysRemaining = Math.max(
                0,
                dayjs(selectedCampaignDetail.end_at).diff(dayjs(), "day"),
              )
              const isEnded = daysRemaining === 0
              const isUrgent = daysRemaining <= 7 && !isEnded
              const dayColor = isEnded ? "red" : isUrgent ? "orange" : "green"

              return (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <Text type="secondary" className="block text-xs">Trạng thái</Text>
                    <div className="mt-1">
                      <Tag color={statusMeta[selectedCampaignDetail.status]?.color}>
                        {statusMeta[selectedCampaignDetail.status]?.label}
                      </Tag>
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <Text type="secondary" className="block text-xs">Bắt đầu</Text>
                    <div className="mt-1 font-medium">
                      {dayjs(selectedCampaignDetail.start_at).format("DD/MM/YYYY")}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <Text type="secondary" className="block text-xs">Kết thúc</Text>
                    <div className="mt-1 font-medium">
                      {dayjs(selectedCampaignDetail.end_at).format("DD/MM/YYYY")}
                    </div>
                  </div>
                  <div
                    className={`rounded-lg border p-3 ${
                      isEnded
                        ? "border-red-200 bg-red-50"
                        : isUrgent
                          ? "border-amber-200 bg-amber-50"
                          : "border-emerald-200 bg-emerald-50"
                    }`}
                  >
                    <Text type="secondary" className="block text-xs">Còn lại</Text>
                    <div className={`mt-1 text-xl font-bold text-${dayColor}-600`}>
                      {isEnded ? "Đã kết thúc" : `${daysRemaining} ngày`}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* ── Tiến độ quà theo tháng ── */}
            <Card size="small" title="Tiến độ phát hành quà theo tháng">
              <div className="space-y-5">
                {(selectedCampaignDetail.reward_pools || []).length === 0 ? (
                  <Text type="secondary">Chiến dịch chưa cấu hình cơ cấu quà.</Text>
                ) : (
                  (selectedCampaignDetail.reward_pools || []).map((pool, poolIdx) => {
                    const totalQty = Number(pool.total_quantity || 0)
                    const remainingQty = Number(pool.remaining_quantity ?? totalQty)
                    const wonQty = totalQty - remainingQty
                    const wonPct = totalQty > 0 ? Number(((wonQty / totalQty) * 100).toFixed(1)) : 0

                    return (
                      <div key={poolIdx}>
                        {/* Header pool */}
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <Text strong>{pool.reward_name}</Text>
                          <Space size={8} wrap>
                            <Tag>
                              Tổng: {totalQty} phần · {formatCurrency(pool.reward_value)}/phần
                            </Tag>
                            <Tag color="blue">Đã trúng: {wonQty}</Tag>
                            <Tag color={remainingQty <= 0 ? "red" : "green"}>
                              Còn lại: {remainingQty}
                            </Tag>
                            <Tag color={wonPct >= 80 ? "red" : wonPct >= 50 ? "orange" : "green"}>
                              Tiến độ trúng: {wonPct}%
                            </Tag>
                          </Space>
                        </div>

                        {/* Bảng tiến độ theo tháng */}
                        <Table
                          size="small"
                          rowKey="month_index"
                          pagination={false}
                          dataSource={pool.monthly_release || []}
                          columns={[
                            {
                              title: "Tháng",
                              dataIndex: "month_index",
                              width: 80,
                              render: (v: number) => <Text strong>Tháng {v}</Text>,
                            },
                            {
                              title: "Quota tháng",
                              dataIndex: "release_quantity",
                              width: 120,
                              render: (v: number) => `${v} phần`,
                            },
                            {
                              title: "Đã trúng",
                              width: 110,
                              render: (_: unknown, r: { release_quantity: number; available_quantity?: number }) => {
                                const won =
                                  Number(r.release_quantity || 0) -
                                  Number(r.available_quantity ?? r.release_quantity)
                                return (
                                  <Text type={won > 0 ? "warning" : "secondary"}>
                                    {won} phần
                                  </Text>
                                )
                              },
                            },
                            {
                              title: "Còn lại",
                              width: 110,
                              render: (_: unknown, r: { release_quantity: number; available_quantity?: number }) => {
                                const rem = Number(r.available_quantity ?? r.release_quantity)
                                return (
                                  <Text type={rem <= 0 ? "danger" : "success"}>
                                    {rem} phần
                                  </Text>
                                )
                              },
                            },
                            {
                              title: "Tiến độ",
                              render: (_: unknown, r: { release_quantity: number; available_quantity?: number }) => {
                                const won =
                                  Number(r.release_quantity || 0) -
                                  Number(r.available_quantity ?? r.release_quantity)
                                const pct =
                                  Number(r.release_quantity) > 0
                                    ? Number(((won / Number(r.release_quantity)) * 100).toFixed(1))
                                    : 0
                                return (
                                  <Progress
                                    percent={pct}
                                    size="small"
                                    strokeColor={
                                      pct >= 80 ? "#ef4444" : pct >= 50 ? "#f59e0b" : "#10b981"
                                    }
                                    format={(p) => `${p}%`}
                                  />
                                )
                              },
                            },
                          ]}
                        />
                      </div>
                    )
                  })
                )}
              </div>
            </Card>

            {/* ── Danh sách trúng thưởng ── */}
            <Card
              size="small"
              title={`Danh sách trúng thưởng (${reservationsData?.items?.length || 0} người)`}
            >
              <Table<PromotionRewardReservation>
                rowKey="id"
                size="small"
                loading={isReservationsLoading || issueReservationMutation.isPending}
                dataSource={reservationsData?.items || []}
                pagination={{ pageSize: 8, size: "small" }}
                columns={[
                  {
                    title: "Khách hàng",
                    render: (_, record) => (
                      <Space direction="vertical" size={0}>
                        <Text strong>{record.customer?.name || `KH #${record.customer_id}`}</Text>
                        <Text type="secondary">{record.customer?.phone}</Text>
                      </Space>
                    ),
                  },
                  {
                    title: "Quà",
                    render: (_, record) => (
                      <Space direction="vertical" size={0}>
                        <Text>{record.reward_name}</Text>
                        <Text type="secondary">{formatCurrency(record.reward_value)}</Text>
                      </Space>
                    ),
                  },
                  {
                    title: "Trạng thái",
                    width: 130,
                    render: (_, record) => (
                      <Tag color={record.status === "issued" ? "blue" : "gold"}>
                        {record.status === "issued" ? "Đã trao" : "Chờ nhận quà"}
                      </Tag>
                    ),
                  },
                  {
                    title: "Trúng lúc",
                    width: 140,
                    render: (_, record) =>
                      dayjs(record.reserved_at).format("DD/MM/YYYY HH:mm"),
                  },
                  {
                    title: "Thao tác",
                    width: 130,
                    render: (_, record) =>
                      record.status === "issued" ? null : (
                        <Button
                          size="small"
                          onClick={() =>
                            selectedCampaign &&
                            issueReservationMutation.mutateAsync({
                              id: selectedCampaign.id,
                              reservationId: record.id,
                            })
                          }
                        >
                          Xác nhận trao
                        </Button>
                      ),
                  },
                ]}
              />
            </Card>
          </div>
        ) : (
          <div className="py-10 text-center">
            <Text type="secondary">Không tìm thấy dữ liệu chiến dịch.</Text>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default PromotionCampaignsPage
