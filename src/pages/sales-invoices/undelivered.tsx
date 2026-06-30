import * as React from "react"
import { useNavigate } from "react-router-dom"
import dayjs from "dayjs"
import {
  Button,
  Card,
  Input,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
} from "antd"
import {
  CheckCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons"
import type { ColumnsType, TablePaginationConfig } from "antd/es/table"
import { SalesInvoice, SalesInvoiceItem } from "@/models/sales-invoice"
import {
  useUndeliveredSalesInvoicesQuery,
  useUpdateSalesInvoiceDeliveryStatusMutation,
  useUpdateSalesInvoiceItemDeliveryStatusMutation,
} from "@/queries/sales-invoice"

const { Title, Text } = Typography

const UndeliveredSalesInvoicesPage: React.FC = () => {
  const navigate = useNavigate()
  const [keyword, setKeyword] = React.useState("")
  const [submittedKeyword, setSubmittedKeyword] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  const queryParams = React.useMemo(
    () => ({
      page: currentPage,
      limit: pageSize,
      keyword: submittedKeyword || undefined,
    }),
    [currentPage, pageSize, submittedKeyword],
  )

  const { data, isLoading, refetch } =
    useUndeliveredSalesInvoicesQuery(queryParams)
  const updateItemDeliveryStatus =
    useUpdateSalesInvoiceItemDeliveryStatusMutation()
  const updateInvoiceDeliveryStatus =
    useUpdateSalesInvoiceDeliveryStatusMutation()

  const invoices = (data?.data?.items || []) as SalesInvoice[]
  const total = Number(data?.data?.total || 0)

  const handleSearch = () => {
    setCurrentPage(1)
    setSubmittedKeyword(keyword.trim())
  }

  const columns: ColumnsType<SalesInvoice> = [
    {
      title: "Mã HĐ",
      dataIndex: "code",
      width: 140,
      render: (code: string, record) => (
        <Button type="link" onClick={() => navigate(`/sales-invoices/edit/${record.id}`)}>
          {code}
        </Button>
      ),
    },
    {
      title: "Khách hàng",
      dataIndex: "customer_name",
      width: 220,
      render: (name: string, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          {record.customer_phone && <Text type="secondary">{record.customer_phone}</Text>}
        </Space>
      ),
    },
    {
      title: "Ngày bán",
      dataIndex: "sale_date",
      width: 120,
      render: (value: string) => value ? dayjs(value).format("DD/MM/YYYY") : "---",
    },
    {
      title: "Sản phẩm chưa giao",
      dataIndex: "items",
      render: (items: SalesInvoiceItem[] = []) => (
        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 rounded border border-slate-200 bg-slate-50 p-2 md:flex-row md:items-center md:justify-between"
            >
              <Space direction="vertical" size={0}>
                <Text strong>{item.product_name || item.product?.trade_name || item.product?.name}</Text>
                <Text type="secondary">
                  {Number(item.quantity || 0).toLocaleString("vi-VN")} {item.unit_name || item.product?.unit?.name || ""}
                </Text>
              </Space>
              <Popconfirm
                title="Đánh dấu sản phẩm này đã giao?"
                okText="Đã giao"
                cancelText="Hủy"
                onConfirm={() =>
                  updateItemDeliveryStatus.mutate({
                    itemId: item.id,
                    isDelivered: true,
                  })
                }
              >
                <Button
                  size="small"
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  loading={updateItemDeliveryStatus.isPending}
                >
                  Đã giao
                </Button>
              </Popconfirm>
            </div>
          ))}
        </Space>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 120,
      render: (status: string) => <Tag color="processing">{status}</Tag>,
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 190,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => navigate(`/sales-invoices/edit/${record.id}`)}
          />
          <Popconfirm
            title="Đánh dấu toàn bộ sản phẩm trong hóa đơn đã giao?"
            okText="Đã giao hết"
            cancelText="Hủy"
            onConfirm={() =>
              updateInvoiceDeliveryStatus.mutate({
                invoiceId: record.id,
                isDelivered: true,
              })
            }
          >
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={updateInvoiceDeliveryStatus.isPending}
            >
              Đã giao hết
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setCurrentPage(pagination.current || 1)
    setPageSize(pagination.pageSize || 10)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Title level={3} style={{ margin: 0 }}>
          Hàng chưa giao
        </Title>
        <Space wrap>
          <Input
            allowClear
            value={keyword}
            placeholder="Tìm mã HĐ, khách hàng, SĐT, sản phẩm"
            prefix={<SearchOutlined />}
            onChange={(event) => setKeyword(event.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 320 }}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            Tìm
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Tải lại
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={invoices}
          loading={isLoading}
          scroll={{ x: 1100 }}
          pagination={{
            current: currentPage,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (value) => `Tổng ${value} hóa đơn còn hàng chưa giao`,
          }}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  )
}

export default UndeliveredSalesInvoicesPage
