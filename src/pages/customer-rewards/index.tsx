import * as React from "react"
import {
  Tabs,
  Tag,
  Space,
  Typography,
  Progress,
  Tooltip,
} from "antd"
import {
  GiftOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons"
import DataTable from "@/components/common/data-table"
import FilterHeader from "@/components/common/filter-header"
import { useRewardTrackingQuery, useRewardHistoryQuery } from "@/queries/debt-note"

const { Title, Text } = Typography

const CustomerRewardsPage: React.FC = () => {
  // State quản lý UI
  const [activeTab, setActiveTab] = React.useState("tracking")
  const [trackingFilters, setTrackingFilters] = React.useState<Record<string, any>>({})
  const [historyFilters, setHistoryFilters] = React.useState<Record<string, any>>({})
  const [trackingPage, setTrackingPage] = React.useState(1)
  const [historyPage, setHistoryPage] = React.useState(1)
  const pageSize = 10

  // Queries
  const { data: trackingData, isLoading: isTrackingLoading } = useRewardTrackingQuery({
    page: trackingPage,
    limit: pageSize,
    ...trackingFilters
  })

  const { data: historyData, isLoading: isHistoryLoading } = useRewardHistoryQuery({
    page: historyPage,
    limit: pageSize,
    ...historyFilters
  })

  const REWARD_THRESHOLD = 60000000 // 60 Triệu

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value)
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
      title: "Tiến trình (mốc 60tr)",
      key: "progress",
      width: 300,
      render: (record: any) => {
        const pending = Number(record.pending_amount || 0)
        const percent = Math.min(Math.round((pending / REWARD_THRESHOLD) * 100), 100)
        return (
          <div className="w-full">
            <Progress 
                percent={percent} 
                status={percent >= 100 ? "success" : "active"} 
                strokeColor={percent >= 100 ? "#52c41a" : "#1890ff"}
            />
            <div className="flex justify-between text-xs mt-1">
                <span>{formatCurrency(pending)}</span>
                <span className="text-gray-400">Thiếu {formatCurrency(Math.max(0, REWARD_THRESHOLD - pending))}</span>
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
      title: "Số lần nhận quà",
      dataIndex: "reward_count",
      key: "reward_count",
      width: 130,
      render: (val: number) => <Tag color="gold" icon={<GiftOutlined />}>{val} lần</Tag>
    },
    {
      title: "Lần cuối",
      dataIndex: "last_reward_date",
      key: "last_reward_date",
      width: 150,
      render: (val: string) => val ? new Date(val).toLocaleDateString('vi-VN') : '-'
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
    </div>
  )
}

export default CustomerRewardsPage
