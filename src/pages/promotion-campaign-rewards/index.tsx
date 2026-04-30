import React from "react"
import { Button, Card, Space, Table, Tag, Typography } from "antd"
import dayjs from "dayjs"
import FilterHeader from "@/components/common/filter-header"
import {
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

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <Title level={3} className="!mb-1">
              Quà campaign quay thưởng
            </Title>
            <Text type="secondary">
              Trang riêng để quản lý quà reserve, xác nhận trao quà và theo dõi lịch sử nhận quà từ campaign.
            </Text>
          </div>
        </div>
      </Card>

      <Card>
        <Table
          rowKey="id"
          loading={isLoading || issueMutation.isPending}
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
                  {record.status === "issued" ? "Đã trao" : "Đã reserve"}
                </Tag>
              ),
              filters: [
                { text: "Đã reserve", value: "reserved" },
                { text: "Đã trao", value: "issued" },
              ],
              filteredValue: filters.status ? [filters.status] : null,
              onFilter: () => true,
            },
            {
              title: "Reserve lúc",
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
              width: 130,
              render: (_, record: any) =>
                record.status === "issued" ? null : (
                  <Button
                    size="small"
                    onClick={() =>
                      issueMutation.mutateAsync({
                        id: record.promotion_id,
                        reservationId: record.id,
                      })
                    }
                  >
                    Xác nhận trao
                  </Button>
                ),
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
