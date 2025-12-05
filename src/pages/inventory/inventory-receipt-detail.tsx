import React from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Typography,
  Tag,
  Table,
  Popconfirm,
  Alert,
  Divider,
  Spin,
  Descriptions,
} from "antd"
import {
  ArrowLeftOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  PrinterOutlined,
  HistoryOutlined,
  DeleteOutlined,
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"

import {
  InventoryReceiptItem,
  InventoryReceiptStatus,
} from "@/models/inventory.model"
import {
  useInventoryReceiptQuery,
  useInventoryReceiptItemsQuery,
  useApproveInventoryReceiptMutation,
  useCompleteInventoryReceiptMutation,
  useCancelInventoryReceiptMutation,
  useDeleteInventoryReceiptMutation,
} from "@/queries/inventory"
import ReceiptImageUpload from "@/components/inventory/ReceiptImageUpload"

const { Title, Text } = Typography

const InventoryReceiptDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const receiptId = Number(id)

  // Queries
  const {
    data: receipt,
    isLoading: isLoadingReceipt,
    error: receiptError,
  } = useInventoryReceiptQuery(receiptId)

  const {
    data: items,
    isLoading: isLoadingItems,
    error: itemsError,
  } = useInventoryReceiptItemsQuery(receiptId)

  // Mutations
  const approveReceiptMutation = useApproveInventoryReceiptMutation()
  const completeReceiptMutation = useCompleteInventoryReceiptMutation()
  const cancelReceiptMutation = useCancelInventoryReceiptMutation()
  const deleteReceiptMutation = useDeleteInventoryReceiptMutation()

  // Handlers
  const handleBack = () => {
    navigate("/inventory/receipts")
  }

  const handleEdit = () => {
    navigate(`/inventory/receipts/edit/${receiptId}`)
  }

  const handleApprove = async () => {
    try {
      await approveReceiptMutation.mutateAsync(receiptId)
    } catch (error) {
      console.error("Error approving receipt:", error)
    }
  }

  const handleComplete = async () => {
    try {
      await completeReceiptMutation.mutateAsync(receiptId)
    } catch (error) {
      console.error("Error completing receipt:", error)
    }
  }

  const handleCancel = async () => {
    try {
      await cancelReceiptMutation.mutateAsync(receiptId)
    } catch (error) {
      console.error("Error canceling receipt:", error)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteReceiptMutation.mutateAsync(receiptId)
      navigate("/inventory/receipts")
    } catch (error) {
      console.error("Error deleting receipt:", error)
    }
  }

  const handlePrint = () => {
    // Tạm thời chỉ log, có thể implement sau
    console.log("Print receipt:", receiptId)
  }

  const handleViewHistory = () => {
    navigate(`/inventory/history?receiptId=${receiptId}`)
  }

  // Render trạng thái
  const renderStatus = (statusText: string) => {
    // Xác định status enum từ statusText
    let status: InventoryReceiptStatus = InventoryReceiptStatus.DRAFT
    switch (statusText) {
      case "Nháp":
        status = InventoryReceiptStatus.DRAFT
        break
      case "Chờ duyệt":
        status = InventoryReceiptStatus.PENDING
        break
      case "Đã duyệt":
        status = InventoryReceiptStatus.APPROVED
        break
      case "Hoàn thành":
        status = InventoryReceiptStatus.COMPLETED
        break
      case "Đã hủy":
        status = InventoryReceiptStatus.CANCELLED
        break
      default:
        status = InventoryReceiptStatus.DRAFT
    }

    const statusConfig = {
      [InventoryReceiptStatus.DRAFT]: { color: "default" },
      [InventoryReceiptStatus.PENDING]: { color: "processing" },
      [InventoryReceiptStatus.APPROVED]: { color: "success" },
      [InventoryReceiptStatus.COMPLETED]: { color: "success" },
      [InventoryReceiptStatus.CANCELLED]: { color: "error" },
    }

    const config = statusConfig[status] || { color: "default" }
    return <Tag color={config.color}>{statusText}</Tag>
  }

  // Render các nút hành động
  const renderActionButtons = () => {
    if (!receipt) return null

    const buttons = []

    // Nút in (luôn có)
    buttons.push(
      <Button key='print' icon={<PrinterOutlined />} onClick={handlePrint}>
        In phiếu
      </Button>
    )

    // Nút xem lịch sử (luôn có)
    buttons.push(
      <Button
        key='history'
        icon={<HistoryOutlined />}
        onClick={handleViewHistory}
      >
        Lịch sử
      </Button>
    )

    // Nút chỉnh sửa (chỉ khi ở trạng thái DRAFT hoặc PENDING)
    if (receipt.status === "Nháp" || receipt.status === "Chờ duyệt") {
      buttons.push(
        <Button key='edit' icon={<EditOutlined />} onClick={handleEdit}>
          Chỉnh sửa
        </Button>
      )
    }

    // Nút duyệt (chỉ khi ở trạng thái PENDING)
    if (receipt.status === "Chờ duyệt") {
      buttons.push(
        <Popconfirm
          key='approve'
          title='Duyệt phiếu nhập hàng'
          description='Bạn có chắc chắn muốn duyệt phiếu nhập hàng này?'
          onConfirm={handleApprove}
          okText='Duyệt'
          cancelText='Hủy'
        >
          <Button
            type='primary'
            icon={<CheckOutlined />}
            loading={approveReceiptMutation.isPending}
          >
            Duyệt phiếu
          </Button>
        </Popconfirm>
      )
    }

    // Nút hoàn thành (chỉ khi ở trạng thái APPROVED)
    if (receipt.status === "Đã duyệt") {
      buttons.push(
        <Popconfirm
          key='complete'
          title='Hoàn thành nhập kho'
          description='Bạn có chắc chắn muốn hoàn thành việc nhập kho cho phiếu này?'
          onConfirm={handleComplete}
          okText='Hoàn thành'
          cancelText='Hủy'
        >
          <Button
            type='primary'
            icon={<CheckOutlined />}
            loading={completeReceiptMutation.isPending}
          >
            Hoàn thành
          </Button>
        </Popconfirm>
      )
    }

    // Nút hủy (chỉ khi ở trạng thái DRAFT, PENDING, hoặc APPROVED)
    if (
      receipt.status === "Nháp" ||
      receipt.status === "Chờ duyệt" ||
      receipt.status === "Đã duyệt"
    ) {
      buttons.push(
        <Popconfirm
          key='cancel'
          title='Hủy phiếu nhập hàng'
          description='Bạn có chắc chắn muốn hủy phiếu nhập hàng này?'
          onConfirm={handleCancel}
          okText='Hủy phiếu'
          cancelText='Không'
        >
          <Button
            icon={<CloseOutlined />}
            loading={cancelReceiptMutation.isPending}
          >
            Hủy phiếu
          </Button>
        </Popconfirm>
      )
    }

    // Nút xóa (chỉ khi ở trạng thái DRAFT hoặc CANCELLED)
    if (receipt.status === "Nháp" || receipt.status === "Đã hủy") {
      buttons.push(
        <Popconfirm
          key='delete'
          title='Xóa phiếu nhập hàng'
          description='Bạn có chắc chắn muốn xóa phiếu nhập hàng này? Hành động này không thể hoàn tác.'
          onConfirm={handleDelete}
          okText='Xóa'
          cancelText='Hủy'
        >
          <Button
            icon={<DeleteOutlined />}
            danger
            loading={deleteReceiptMutation.isPending}
          >
            Xóa phiếu
          </Button>
        </Popconfirm>
      )
    }

    return buttons
  }

  // Cấu hình cột cho bảng chi tiết sản phẩm
  const itemColumns: ColumnsType<InventoryReceiptItem> = [
    {
      title: "STT",
      key: "index",
      width: 60,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "productName",
      key: "productName",
      width: 250,
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      align: "right",
      render: (quantity: number) =>
        new Intl.NumberFormat("vi-VN").format(quantity),
    },
    {
      title: "Đơn giá",
      dataIndex: "unitPrice",
      key: "unitPrice",
      width: 120,
      align: "right",
      render: (price: string) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(parseFloat(price || "0")),
    },
    {
      title: "Thành tiền",
      dataIndex: "total_price",
      key: "total_price",
      width: 120,
      align: "right",
      render: (price: number) => (
        <Text strong style={{ color: "#52c41a" }}>
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(price)}
        </Text>
      ),
    },
    {
      title: "Hạn sử dụng",
      dataIndex: "expiryDate",
      key: "expiryDate",
      width: 120,
      align: "center",
      render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Số lô",
      dataIndex: "batchNumber",
      key: "batchNumber",
      width: 100,
      render: (batch: string) => batch || "-",
    },
    {
      title: "Ghi chú",
      dataIndex: "notes",
      key: "notes",
      ellipsis: true,
      render: (notes: string) => notes || "-",
    },
  ]

  // Loading state
  if (isLoadingReceipt || isLoadingItems) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <Spin size='large' />
        <div style={{ marginTop: "16px" }}>
          <Text>Đang tải thông tin phiếu nhập hàng...</Text>
        </div>
      </div>
    )
  }

  // Error state
  if (receiptError || itemsError) {
    return (
      <div style={{ padding: "24px" }}>
        <Alert
          message='Lỗi'
          description={
            receiptError?.message ||
            itemsError?.message ||
            "Không thể tải thông tin phiếu nhập hàng"
          }
          type='error'
          showIcon
          action={<Button onClick={handleBack}>Quay lại</Button>}
        />
      </div>
    )
  }

  // No data state
  if (!receipt) {
    return (
      <div style={{ padding: "24px" }}>
        <Alert
          message='Không tìm thấy'
          description='Không tìm thấy phiếu nhập hàng với ID này'
          type='warning'
          showIcon
          action={<Button onClick={handleBack}>Quay lại</Button>}
        />
      </div>
    )
  }

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <Card style={{ marginBottom: "16px" }}>
        <Row align='middle' justify='space-between'>
          <Col>
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
                Quay lại
              </Button>
              <Title level={3} style={{ margin: 0 }}>
                Chi tiết phiếu nhập hàng
              </Title>
              {renderStatus(receipt.status)}
            </Space>
          </Col>
          <Col>
            <Space>{renderActionButtons()}</Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {/* Thông tin chung */}
        <Col xs={24} lg={12}>
          <Card title='Thông tin phiếu nhập' size='small'>
            <Descriptions column={1} size='small'>
              <Descriptions.Item label='Mã phiếu'>
                <Text strong>{receipt.code}</Text>
              </Descriptions.Item>
              <Descriptions.Item label='Trạng thái'>
                {renderStatus(receipt.status)}
              </Descriptions.Item>
              <Descriptions.Item label='Nhà cung cấp'>
                {receipt.supplier_id
                  ? `Nhà cung cấp #${receipt.supplier_id}`
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label='Liên hệ NCC'>{"-"}</Descriptions.Item>
              <Descriptions.Item label='Tổng tiền'>
                <Text strong style={{ color: "#52c41a", fontSize: "16px" }}>
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(receipt.total_amount)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label='Mô tả'>
                {receipt.notes || "-"}
              </Descriptions.Item>
              <Descriptions.Item label='Ghi chú'>
                {receipt.notes || "-"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Thông tin thời gian */}
        <Col xs={24} lg={12}>
          <Card title='Thông tin thời gian' size='small'>
            <Descriptions column={1} size='small'>
              <Descriptions.Item label='Ngày tạo'>
                {dayjs(receipt.created_at).format("DD/MM/YYYY HH:mm:ss")}
              </Descriptions.Item>
              <Descriptions.Item label='Cập nhật lần cuối'>
                {dayjs(receipt.updated_at).format("DD/MM/YYYY HH:mm:ss")}
              </Descriptions.Item>
              {receipt.approved_at && (
                <Descriptions.Item label='Ngày duyệt'>
                  {dayjs(receipt.approved_at).format("DD/MM/YYYY HH:mm:ss")}
                </Descriptions.Item>
              )}
              {receipt.completed_at && (
                <Descriptions.Item label='Ngày hoàn thành'>
                  {dayjs(receipt.completed_at).format("DD/MM/YYYY HH:mm:ss")}
                </Descriptions.Item>
              )}
              <Descriptions.Item label='Người tạo'>
                ID: {receipt.created_by}
              </Descriptions.Item>
              {receipt.approved_by && (
                <Descriptions.Item label='Người duyệt'>
                  ID: {receipt.approved_by}
                </Descriptions.Item>
              )}
              {receipt.completed_by && (
                <Descriptions.Item label='Người hoàn thành'>
                  ID: {receipt.completed_by}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* Upload hình ảnh */}
          <div style={{ marginTop: "16px" }}>
            <ReceiptImageUpload receiptId={receiptId} />
          </div>
        </Col>
      </Row>

      <Divider />

      {/* Danh sách sản phẩm */}
      <Card>
        <div style={{ marginBottom: "16px" }}>
          <Title level={4}>Danh sách sản phẩm</Title>
        </div>

        <Table
          columns={itemColumns}
          dataSource={items || []}
          rowKey='id'
          pagination={false}
          size='small'
          scroll={{ x: 1000 }}
          summary={(pageData) => {
            const totalQuantity = pageData.reduce(
              (sum, item) => sum + item.quantity,
              0
            )
            const totalAmount = pageData.reduce(
              (sum, item) => sum + item.total_price,
              0
            )

            return (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={2}>
                    <Text strong>Tổng cộng</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>
                    <Text strong>
                      {new Intl.NumberFormat("vi-VN").format(totalQuantity)}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} />
                  <Table.Summary.Cell index={4}>
                    <Text strong style={{ color: "#52c41a" }}>
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(totalAmount)}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} />
                  <Table.Summary.Cell index={6} />
                  <Table.Summary.Cell index={7} />
                </Table.Summary.Row>
              </Table.Summary>
            )
          }}
        />

        {(!items || items.length === 0) && (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Text type='secondary'>
              Chưa có sản phẩm nào trong phiếu nhập này
            </Text>
          </div>
        )}
      </Card>
    </div>
  )
}

export default InventoryReceiptDetail
