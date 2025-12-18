// Chi tiết phiếu trả hàng

import React from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Card,
  Button,
  Space,
  Typography,
  Descriptions,
  Table,
  Tag,
  Timeline,
  Row,
  Col,
  Popconfirm,
} from "antd"
import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"

import { ReturnItem } from "@/models/inventory-return.model"
import {
  useReturnQuery,
  useApproveReturnMutation,
  useCancelReturnMutation,
  useDeleteReturnMutation,
} from "@/queries/inventory-return"
import { useProductsQuery } from "@/queries/product"
import { LoadingSpinner } from "@/components/common"

const { Title, Text } = Typography

const ReturnDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Queries
  const { data: returnData, isLoading } = useReturnQuery(Number(id))
  const { data: productsData } = useProductsQuery({ limit: 1000 })

  // Mutations
  const approveReturnMutation = useApproveReturnMutation()
  const cancelReturnMutation = useCancelReturnMutation()
  const deleteReturnMutation = useDeleteReturnMutation()

  // Handlers
  const handleApprove = async () => {
    try {
      await approveReturnMutation.mutateAsync(Number(id))
    } catch (error) {
      console.error("Error approving return:", error)
    }
  }



  const handleCancel = async () => {
    try {
      await cancelReturnMutation.mutateAsync({
        id: Number(id),
        reason: "Hủy bởi người dùng",
      })
    } catch (error) {
      console.error("Error canceling return:", error)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteReturnMutation.mutateAsync(Number(id))
      navigate("/inventory/returns")
    } catch (error) {
      console.error("Error deleting return:", error)
    }
  }

  // Render status
  const renderStatus = (status: string) => {
    const statusConfig: Record<string, { color: string }> = {
      "Nháp": { color: "default" },
      "Chờ duyệt": { color: "processing" },
      "Đã duyệt": { color: "success" },
      "Đã hủy": { color: "error" },
    }

    const config = statusConfig[status] || { color: "default" }
    return <Tag color={config.color}>{status}</Tag>
  }

  // Columns cho bảng items
  const itemColumns: ColumnsType<ReturnItem> = [
    {
      title: "STT",
      key: "index",
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Sản phẩm",
      dataIndex: "product_id",
      key: "product_id",
      render: (productId: number) => {
        const product = productsData?.data?.items?.find((p) => p.id === productId)
        return product?.name || `Sản phẩm #${productId}`
      },
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      align: "right",
    },
    {
      title: "Đơn giá",
      dataIndex: "unit_cost",
      key: "unit_cost",
      width: 120,
      align: "right",
      render: (cost: number) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(cost),
    },
    {
      title: "Thành tiền",
      dataIndex: "total_price",
      key: "total_price",
      width: 120,
      align: "right",
      render: (price: number) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(price),
    },
    {
      title: "Lý do",
      dataIndex: "reason",
      key: "reason",
      ellipsis: true,
    },
    {
      title: "Ghi chú",
      dataIndex: "notes",
      key: "notes",
      ellipsis: true,
    },
  ]

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!returnData) {
    return (
      <Card>
        <Text type="danger">Không tìm thấy phiếu trả hàng!</Text>
      </Card>
    )
  }

  return (
    <div style={{ padding: "24px" }}>
      <Card>
        <div style={{ marginBottom: "24px" }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/inventory/returns")}
            style={{ marginBottom: "16px" }}
          >
            Quay lại
          </Button>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Title level={2}>Chi tiết phiếu trả hàng</Title>
            <Space>
              {returnData.status === "Nháp" && (
                <Popconfirm
                  title="Duyệt phiếu trả hàng"
                  description="Bạn có chắc chắn muốn duyệt phiếu này?"
                  onConfirm={handleApprove}
                  okText="Duyệt"
                  cancelText="Hủy"
                >
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    loading={approveReturnMutation.isPending}
                  >
                    Duyệt
                  </Button>
                </Popconfirm>
              )}

              {(returnData.status === "Nháp" || returnData.status === "Đã duyệt") && (
                <Popconfirm
                  title="Hủy phiếu"
                  description="Bạn có chắc chắn muốn hủy phiếu này?"
                  onConfirm={handleCancel}
                  okText="Hủy phiếu"
                  cancelText="Không"
                >
                  <Button
                    danger
                    icon={<CloseOutlined />}
                    loading={cancelReturnMutation.isPending}
                  >
                    Hủy phiếu
                  </Button>
                </Popconfirm>
              )}
              {(returnData.status === "Nháp" || returnData.status === "Đã hủy") && (
                <Popconfirm
                  title="Xóa phiếu"
                  description="Bạn có chắc chắn muốn xóa phiếu này? Hành động này không thể hoàn tác."
                  onConfirm={handleDelete}
                  okText="Xóa"
                  cancelText="Hủy"
                >
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    loading={deleteReturnMutation.isPending}
                  >
                    Xóa
                  </Button>
                </Popconfirm>
              )}
            </Space>
          </div>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            {/* Thông tin phiếu */}
            <Card title="Thông tin phiếu" style={{ marginBottom: "16px" }}>
              <Descriptions column={2} bordered>
                <Descriptions.Item label="Mã phiếu" span={2}>
                  <Text strong>{returnData.code}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Nhà cung cấp" span={2}>
                  {returnData.supplier?.name || returnData.supplier_name || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái" span={2}>
                  {renderStatus(returnData.status)}
                </Descriptions.Item>
                <Descriptions.Item label="Tổng tiền" span={2}>
                  <Text strong style={{ color: "#1890ff", fontSize: "16px" }}>
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(parseFloat(returnData.total_amount))}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Lý do trả hàng" span={2}>
                  {returnData.reason}
                </Descriptions.Item>
                {returnData.notes && (
                  <Descriptions.Item label="Ghi chú" span={2}>
                    {returnData.notes}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Ngày tạo">
                  {dayjs(returnData.created_at).format("DD/MM/YYYY HH:mm")}
                </Descriptions.Item>
                {returnData.approved_at && (
                  <Descriptions.Item label="Ngày duyệt">
                    {dayjs(returnData.approved_at).format("DD/MM/YYYY HH:mm")}
                  </Descriptions.Item>
                )}
                {returnData.approved_at && (
                  <Descriptions.Item label="Ngày duyệt">
                    {dayjs(returnData.approved_at).format("DD/MM/YYYY HH:mm")}
                  </Descriptions.Item>
                )}
                {returnData.cancelled_at && (
                  <Descriptions.Item label="Ngày hủy">
                    {dayjs(returnData.cancelled_at).format("DD/MM/YYYY HH:mm")}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            {/* Danh sách sản phẩm */}
            <Card title="Danh sách sản phẩm">
              <Table
                columns={itemColumns}
                dataSource={returnData.items || []}
                rowKey="product_id"
                pagination={false}
                scroll={{ x: 800 }}
              />
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            {/* Timeline */}
            <Card title="Lịch sử trạng thái">
              <Timeline>
                <Timeline.Item color="blue">
                  <Text strong>Tạo phiếu</Text>
                  <br />
                  <Text type="secondary">
                    {dayjs(returnData.created_at).format("DD/MM/YYYY HH:mm")}
                  </Text>
                </Timeline.Item>
                {returnData.approved_at && (
                  <Timeline.Item color="green">
                    <Text strong>Đã duyệt</Text>
                    <br />
                    <Text type="secondary">
                      {dayjs(returnData.approved_at).format("DD/MM/YYYY HH:mm")}
                    </Text>
                  </Timeline.Item>
                )}
                {returnData.cancelled_at && (
                  <Timeline.Item color="red">
                    <Text strong>Đã hủy</Text>
                    <br />
                    <Text type="secondary">
                      {dayjs(returnData.cancelled_at).format("DD/MM/YYYY HH:mm")}
                    </Text>
                  </Timeline.Item>
                )}
              </Timeline>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default ReturnDetail
