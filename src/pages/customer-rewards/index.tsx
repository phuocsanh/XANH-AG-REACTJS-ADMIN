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
} from "antd"
import {
  GiftOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons"
import { Popconfirm, message } from "antd"
import DataTable from "@/components/common/data-table"
import FilterHeader from "@/components/common/filter-header"
import { 
    useRewardTrackingQuery, 
    useRewardHistoryQuery,
    useCreateManualRewardMutation,
    useUpdateRewardHistoryMutation,
    useDeleteRewardHistoryMutation
} from "@/queries/debt-note"
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

  const threshold = trackingData?.reward_threshold || 70000000 // Fallback 70 Triệu

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
            gift_value: Math.floor((Number(record.pending_amount || 0) / threshold) * 1000000),
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
      title: `Tiến trình (mốc ${Math.round(threshold / 1000000)}tr)`,
      key: "progress",
      width: 300,
      render: (record: any) => {
        const pending = Number(record.pending_amount || 0)
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
                <span className="text-gray-400">Thiếu {formatCurrency(Math.max(0, threshold - pending))}</span>
            </div>
          </div>
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
      width: 120,
      render: (record: any) => {
        return (
          <Button 
              type="primary" 
              size="small" 
              icon={<GiftOutlined />}
              onClick={() => handleOpenRewardModal(record)}
              className="bg-amber-500 hover:bg-amber-600 border-none"
          >
              Tặng quà
          </Button>
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
                            Lịch sử quà tích lũy (mốc 70tr)
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
                }
            ]}
        />
      </div>

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
                      <Text type="secondary">Gợi ý quà tặng (tỷ lệ 70tr/1tr):</Text>
                      <Text strong className="text-amber-600">{formatCurrency(Math.floor((Number(selectedCustomer?.pending_amount || 0) / threshold) * 1000000))}</Text>
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
