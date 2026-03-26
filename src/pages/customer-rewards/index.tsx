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
  Input,
  InputNumber,
  Checkbox,
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
import { Select } from "antd"
import { useForm, Controller } from "react-hook-form";
import { FormField, FormFieldNumber, FormComboBox } from "@/components/form";

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
  const [form] = Form.useForm()
  
  // React Hook Form cho Modal tặng quà
  const { control, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      gift_description: "Quà tặng tri ân",
      gift_value: 0,
      notes: "",
      season_id: undefined as number | undefined,
      rice_crop_id: undefined as number | undefined,
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
  const { data: riceCropsData } = useRiceCrops({ 
    customer_id: selectedCustomer?.customer_id,
    limit: 100 
  }, { enabled: !!selectedCustomer?.customer_id })

  const createRewardMutation = useCreateManualRewardMutation()
  const updateRewardMutation = useUpdateRewardHistoryMutation()
  const deleteRewardMutation = useDeleteRewardHistoryMutation()

  const threshold = trackingData?.reward_threshold || 60000000 // Fallback 60 Triệu

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value)
  }

  // Helper to refetch everything
  const refetchAll = () => {
    refetchTracking()
    refetchAccumulation()
    refetchAppreciation()
  }

  const handleOpenRewardModal = (record: any, isEdit: boolean = false) => {
    if (isEdit) {
        setEditingHistoryId(record.id)
        setSelectedCustomer({ customer_id: record.customer_id, customer: record.customer })
        reset({
            gift_description: record.gift_description,
            gift_value: Number(record.gift_value || 0),
            notes: record.notes,
            season_id: record.season_ids?.[0],
            rice_crop_id: record.contribution_details?.rice_crop_id
        })
    } else {
        setEditingHistoryId(null)
        setSelectedCustomer(record)
        reset({
            gift_description: "Quà tặng tri ân",
            gift_value: Math.floor((Number(record.pending_amount || 0) / threshold) * 1000000), // Gợi ý theo tỷ lệ 70tr/1tr
            notes: "",
            season_id: undefined,
            rice_crop_id: undefined
        })
    }
    setIsModalOpen(true)
  }

  const handleSubmitForm = async (values: any) => {
    if (editingHistoryId) {
        await updateRewardMutation.mutateAsync({
            id: editingHistoryId,
            data: {
                gift_description: values.gift_description,
                gift_value: values.gift_value,
                notes: values.notes,
            }
        })
    } else {
        await createRewardMutation.mutateAsync({
            customer_id: selectedCustomer.customer_id,
            gift_description: values.gift_description,
            gift_value: values.gift_value,
            notes: values.notes,
            season_id: values.season_id,
            rice_crop_id: values.rice_crop_id
        })
    }
    setIsModalOpen(false)
    refetchAll() // Refetch all tabs
  }

  const handleDeleteHistory = async (id: number) => {
    await deleteRewardMutation.mutateAsync(id)
    refetchAll() // Refetch all tabs
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
                <Text strong>{record.customer_name}</Text>
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
      render: (text: string) => <Text>{text || 'Quà tặng'}</Text>
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
        render: (record: any) => record.contribution_details?.rice_crop_name ? <Tag color="green">{record.contribution_details.rice_crop_name}</Tag> : '-'
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
                    )
                }
            ]}
        />
      </div>

      {/* Manual Reward Modal */}
      <Modal
        title={editingHistoryId ? "Chỉnh sửa quà tặng" : "Tạo quà tặng thủ công"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
      >
        <form onSubmit={handleSubmit(handleSubmitForm)}>
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

            {!editingHistoryId && (
                <div className="grid grid-cols-2 gap-4">
                    <FormComboBox
                        name="season_id"
                        control={control}
                        label="Mùa vụ"
                        placeholder="Chọn mùa vụ"
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
                        label="Ruộng lúa"
                        placeholder="Chọn ruộng lúa"
                        options={riceCropsData?.data?.items?.map((r: any) => ({
                            label: r.field_name,
                            value: r.id
                        })) || []}
                        allowClear
                        disabled={!watch('season_id')}
                    />
                </div>
            )}

            <FormField
                name="gift_description"
                control={control}
                label="Mô tả quà tặng"
                placeholder="Ví dụ: 1 bao phân DAP, Bộ ấm trà..."
                required
            />

            <FormFieldNumber
                name="gift_value"
                control={control}
                label="Giá trị quà tặng (đ)"
                placeholder="0"
                decimalScale={0}
                suffix=" đ"
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
