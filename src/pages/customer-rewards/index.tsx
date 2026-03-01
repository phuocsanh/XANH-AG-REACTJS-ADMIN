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
} from "@ant-design/icons"
import DataTable from "@/components/common/data-table"
import FilterHeader from "@/components/common/filter-header"
import { 
    useRewardTrackingQuery, 
    useRewardHistoryQuery,
    useCreateManualRewardMutation 
} from "@/queries/debt-note"
import { useSeasonsQuery } from "@/queries/season"
import { useRiceCrops } from "@/queries/rice-crop"
import { Select } from "antd"

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
  const [form] = Form.useForm()

  // Queries
  const { data: trackingData, isLoading: isTrackingLoading, refetch: refetchTracking } = useRewardTrackingQuery({
    page: trackingPage,
    limit: pageSize,
    ...trackingFilters
  })

  const { data: historyData, isLoading: isHistoryLoading, refetch: refetchHistory } = useRewardHistoryQuery({
    page: historyPage,
    limit: pageSize,
    ...historyFilters
  })

  // Watch for seasonal data
  const { data: seasonsData } = useSeasonsQuery({ limit: 100 })
  const { data: riceCropsData } = useRiceCrops({ 
    customer_id: selectedCustomer?.customer_id,
    limit: 100 
  }, { enabled: !!selectedCustomer?.customer_id })

  const createRewardMutation = useCreateManualRewardMutation()

  const threshold = trackingData?.reward_threshold || 60000000 // Fallback 60 Triệu

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value)
  }

  const handleOpenRewardModal = (record: any) => {
    setSelectedCustomer(record)
    form.setFieldsValue({
        customer_name: record.customer?.name,
        gift_description: "Quà tặng tri ân",
        manual_deduct: true,
        season_id: undefined,
        rice_crop_id: undefined
    })
    setIsModalOpen(true)
  }

  const handleCreateReward = async (values: any) => {
    await createRewardMutation.mutateAsync({
        customer_id: selectedCustomer.customer_id,
        gift_description: values.gift_description,
        gift_value: values.gift_value,
        notes: values.notes,
        manual_deduct_amount: values.manual_deduct ? threshold : 0,
        season_id: values.season_id,
        rice_crop_id: values.rice_crop_id
    })
    setIsModalOpen(false)
    form.resetFields()
    refetchTracking()
    refetchHistory()
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
        />
      ),
      key: "customer",
      width: 200,
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
      render: (record: any) => (
        <Button 
            type="primary" 
            size="small" 
            icon={<PlusOutlined />}
            onClick={() => handleOpenRewardModal(record)}
            className="bg-amber-500 hover:bg-amber-600 border-none"
        >
            Tặng quà
        </Button>
      )
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
          />
        ),
        dataIndex: "customer_name",
        key: "customer_name",
        width: 200,
        render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: "Ngày nhận",
      dataIndex: "reward_date",
      key: "reward_date",
      width: 150,
      render: (val: string) => new Date(val).toLocaleDateString('vi-VN')
    },
    {
      title: "Mô tả quà tặng",
      dataIndex: "gift_description",
      key: "gift_description",
      width: 250,
      render: (text: string) => <Tag color="blue">{text || 'Quà tri ân'}</Tag>
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
    }
  ]

  return (
    <div className='p-2 md:p-6'>
      <div className='flex justify-between items-center mb-6'>
        <Title level={2}>
            <GiftOutlined className="mr-2" />
            Chăm sóc khách hàng & Quà tặng
        </Title>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
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
                        />
                    )
                },
                {
                    key: "history",
                    label: (
                        <span>
                            <HistoryOutlined />
                            Lịch sử đã tặng
                        </span>
                    ),
                    children: (
                        <DataTable 
                            data={historyData?.items || []}
                            columns={historyColumns}
                            loading={isHistoryLoading}
                            pagination={{
                                current: historyPage,
                                pageSize: pageSize,
                                total: historyData?.total || 0,
                                onChange: (page) => setHistoryPage(page)
                            }}
                            showSearch={false}
                            showFilters={false}
                        />
                    )
                }
            ]}
        />
      </div>

      {/* Manual Reward Modal */}
      <Modal
        title="Tạo quà tặng thủ công"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form
            form={form}
            layout="vertical"
            onFinish={handleCreateReward}
            initialValues={{
                gift_description: "Quà tặng tri ân",
                manual_deduct: true
            }}
        >
            <Form.Item label="Khách hàng" name="customer_name">
                <Input disabled />
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
                <Form.Item label="Mùa vụ" name="season_id">
                    <Select placeholder="Chọn mùa vụ">
                        {seasonsData?.data?.items?.map((season: any) => (
                            <Select.Option key={season.id} value={season.id}>
                                {season.name}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item label="Ruộng lúa" name="rice_crop_id">
                    <Select placeholder="Chọn ruộng lúa">
                        {riceCropsData?.data?.map((crop: any) => (
                            <Select.Option key={crop.id} value={crop.id}>
                                {crop.field_name}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>
            </div>

            <Form.Item 
                label="Mô tả quà tặng" 
                name="gift_description"
                rules={[{ required: true, message: 'Vui lòng nhập mô tả quà tặng' }]}
            >
                <Input placeholder="Ví dụ: 1 bao phân DAP, Bộ ấm trà..." />
            </Form.Item>

            <Form.Item label="Giá trị quà tặng (đ)" name="gift_value">
                <InputNumber 
                    style={{ width: '100%' }} 
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                />
            </Form.Item>

            <Form.Item label="Ghi chú" name="notes">
                <Input.TextArea rows={3} placeholder="Nhập ghi chú chi tiết nếu có" />
            </Form.Item>

            <Form.Item name="manual_deduct" valuePropName="checked">
                <Checkbox>
                    Khấu trừ {formatCurrency(threshold)} từ số tiền tích lũy hiện tại
                </Checkbox>
            </Form.Item>

            <div className="flex justify-end gap-2 mt-4">
                <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
                <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={createRewardMutation.isPending}
                    className="bg-amber-500 border-none"
                >
                    Xác nhận tặng quà
                </Button>
            </div>
        </Form>
      </Modal>
    </div>
  )
}

export default CustomerRewardsPage

