import React from "react"
import { Button, Card, Popconfirm, Space, Table, Tag, Typography } from "antd"
import dayjs from "dayjs"
import FilterHeader from "@/components/common/filter-header"
import {
  useCancelIssuePromotionReservationMutation,
  useIssuePromotionReservationMutation,
  usePromotionCampaignAllReservationsQuery,
} from "@/queries/promotion-campaign"

const { Title, Text } = Typography

const formatCurrency = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0))

const PromotionCampaignRewardsPage: React.FC = () => {
  const [filters, setFilters] = React.useState<Record<string, any>>({})
  const [page, setPage] = React.useState(1)
  const pageSize = 20

  const { data, isLoading } = usePromotionCampaignAllReservationsQuery({
    page,
    limit: pageSize,
    ...filters,
  })
  const issueMutation = useIssuePromotionReservationMutation()
  const cancelIssueMutation = useCancelIssuePromotionReservationMutation()

  // Loading chung cho cả 2 thao tác
  const isActionLoading = isLoading || issueMutation.isPending || cancelIssueMutation.isPending

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <Title level={3} className="!mb-1">
              Quà campaign quay thưởng
            </Title>
            <Text type="secondary">
              Trang riêng để quản lý quà trúng thưởng, xác nhận trao quà và theo dõi lịch sử nhận quà từ campaign.
            </Text>
          </div>
        </div>
      </Card>

      <Card>
        <Table
          rowKey="id"
          loading={isActionLoading}
          dataSource={data?.items || []}
          pagination={{
            current: page,
            pageSize,
            total: data?.total || 0,
            showSizeChanger: false,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} bản ghi`,
            onChange: setPage,
          }}
          columns={[
            {
              title: (
                <FilterHeader
                  title="Campaign / Khách / Quà"
                  value={filters.keyword}
                  onChange={(value) => {
                    setFilters((prev) => ({ ...prev, keyword: value || undefined }))
                    setPage(1)
                  }}
                  placeholder="Tên campaign, mã campaign, khách hàng, số điện thoại, quà..."
                />
              ),
              key: "main",
              render: (_, record: any) => (
                <Space direction="vertical" size={0}>
                  <Text strong>
                    {record.promotion?.code
                      ? `${record.promotion.code} - ${record.promotion.name}`
                      : record.promotion?.name || "---"}
                  </Text>
                  <Text>{record.customer?.name || `KH #${record.customer_id}`}</Text>
                  <Text type="secondary">{record.customer?.phone || record.reward_name}</Text>
                </Space>
              ),
            },
            {
              title: "Quà",
              key: "reward",
              width: 220,
              render: (_, record: any) => (
                <Space direction="vertical" size={0}>
                  <Text>{record.reward_name}</Text>
                  <Text type="secondary">{formatCurrency(record.reward_value)}</Text>
                </Space>
              ),
            },
            {
              title: "Trạng thái",
              key: "status",
              width: 160,
              render: (_, record: any) => (
                <Tag color={record.status === "issued" ? "blue" : "gold"}>
                  {record.status === "issued" ? "Đã trao" : "Chờ nhận quà"}
                </Tag>
              ),
              filters: [
                { text: "Chờ nhận quà", value: "reserved" },
                { text: "Đã trao", value: "issued" },
              ],
              filteredValue: filters.status ? [filters.status] : null,
              onFilter: () => true,
            },
            {
              title: "Trúng thưởng lúc",
              key: "reserved_at",
              width: 170,
              render: (_, record: any) =>
                record.reserved_at
                  ? dayjs(record.reserved_at).format("DD/MM/YYYY HH:mm")
                  : "---",
            },
            {
              title: "Trao lúc",
              key: "issued_at",
              width: 170,
              render: (_, record: any) =>
                record.issued_at
                  ? dayjs(record.issued_at).format("DD/MM/YYYY HH:mm")
                  : "---",
            },
            {
              title: "Thao tác",
              key: "actions",
              width: 150,
              render: (_, record: any) => {
                if (record.status === "issued") {
                  // Đã trao → cho phép hoàn tác (có confirm)
                  return (
                    <Popconfirm
                      title="Hoàn tác xác nhận trao?"
                      description="Quà sẽ trở về trạng thái 'Chờ nhận quà'. Bạn chắc chắn?"
                      okText="Hoàn tác"
                      okButtonProps={{ danger: true }}
                      cancelText="Thôi"
                      onConfirm={() =>
                        cancelIssueMutation.mutateAsync({
                          id: record.promotion_id,
                          reservationId: record.id,
                        })
                      }
                    >
                      <Button size="small" danger>
                        Hoàn tác
                      </Button>
                    </Popconfirm>
                  )
                }
                // Chưa trao → xác nhận trao (có confirm trước khi thực hiện)
                return (
                  <Popconfirm
                    title="Xác nhận đã trao quà?"
                    description={`Xác nhận trao "${record.reward_name}" cho ${record.customer?.name || `KH #${record.customer_id}`}?`}
                    okText="Xác nhận trao"
                    cancelText="Thôi"
                    onConfirm={() =>
                      issueMutation.mutateAsync({
                        id: record.promotion_id,
                        reservationId: record.id,
                      })
                    }
                  >
                    <Button size="small">Xác nhận trao</Button>
                  </Popconfirm>
                )
              },
            },
          ]}
          onChange={(_, tableFilters) => {
            setFilters((prev) => ({
              ...prev,
              status: (tableFilters.status?.[0] as string) || undefined,
            }))
            setPage(1)
          }}
        />
      </Card>
    </div>
  )
}

export default PromotionCampaignRewardsPage
