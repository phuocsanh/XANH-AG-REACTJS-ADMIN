import React from "react"
import { useNavigate } from "react-router-dom"
import { Button, Card, Popconfirm, Space, Tag, Tooltip, Typography } from "antd"
import { CheckOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import DataTable from "@/components/common/data-table"
import { LoadingSpinner } from "@/components/common"
import {
  getInventoryBorrowStatusColor,
  getInventoryBorrowStatusText,
  InventoryBorrow,
} from "@/models/inventory-borrow.model"
import {
  useApproveInventoryBorrowMutation,
  useInventoryBorrowsQuery,
} from "@/queries/inventory-borrow"

const { Title, Text } = Typography

const InventoryBorrowsList: React.FC = () => {
  const navigate = useNavigate()
  const { data, isLoading, refetch } = useInventoryBorrowsQuery({ limit: 100 })
  const approveMutation = useApproveInventoryBorrowMutation()

  const columns: ColumnsType<InventoryBorrow> = [
    {
      title: "Mã phiếu",
      dataIndex: "code",
      key: "code",
      width: 150,
      render: (code: string) => <Text strong className="text-blue-600">{code}</Text>,
    },
    {
      title: "Công ty mượn",
      dataIndex: "borrower_name",
      key: "borrower_name",
      ellipsis: true,
    },
    {
      title: "Ngày mượn",
      dataIndex: "borrow_date",
      key: "borrow_date",
      width: 120,
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Hạn trả",
      dataIndex: "expected_return_date",
      key: "expected_return_date",
      width: 120,
      render: (date?: string) => date ? dayjs(date).format("DD/MM/YYYY") : "-",
    },
    {
      title: "Số dòng",
      key: "items",
      width: 90,
      align: "center",
      render: (_, record) => record.items?.length || 0,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      align: "center",
      render: (status: string) => (
        <Tag color={getInventoryBorrowStatusColor(status)}>
          {getInventoryBorrowStatusText(status)}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 120,
      align: "center",
      render: (_, record) => (
        <Space>
          {record.status === "draft" && (
            <Tooltip title="Duyệt và trừ tồn">
              <Popconfirm
                title="Duyệt phiếu cho mượn?"
                description="Tồn kho sẽ bị trừ theo đúng lô đã chọn."
                onConfirm={() => approveMutation.mutateAsync(record.id)}
                okText="Duyệt"
                cancelText="Hủy"
              >
                <Button type="text" icon={<CheckOutlined />} style={{ color: "#52c41a" }} />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="p-2 md:p-6">
      <Title level={4} className="md:text-2xl mb-4">Quản lý hàng cho mượn</Title>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <Title level={5} style={{ margin: 0 }}>Danh sách phiếu cho mượn</Title>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading}>
              Làm mới
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/inventory/borrows/create")}>
              Tạo phiếu mượn
            </Button>
          </Space>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <DataTable
            data={(data?.data || []) as any}
            columns={columns as any}
            rowKey="id"
            showActions={false}
            showSTT
            paginationConfig={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ x: 900 }}
          />
        )}
      </Card>
    </div>
  )
}

export default InventoryBorrowsList
