import React, { useState } from "react"
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
  DollarOutlined,
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"

import {
  InventoryReceiptItem,
  InventoryReceiptStatus,
} from "@/models/inventory.model"
import {
  useInventoryReceiptQuery,
  useApproveInventoryReceiptMutation,
  useCancelInventoryReceiptMutation,
  useDeleteInventoryReceiptMutation,
  inventoryKeys,
} from "@/queries/inventory"
import { queryClient } from "@/provider/app-provider-tanstack"
import ReceiptImageUpload from "@/components/inventory/ReceiptImageUpload"
import PaymentHistoryModal from "@/components/inventory/PaymentHistoryModal"

const { Title, Text } = Typography

const InventoryReceiptDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const receiptId = Number(id)
  const [showPaymentHistory, setShowPaymentHistory] = useState(false)

  // Queries
  const {
    data: receipt,
    isLoading: isLoadingReceipt,
    error: receiptError,
  } = useInventoryReceiptQuery(receiptId)

  // Lấy items từ receipt.items thay vì gọi API riêng
  const items = receipt?.items || []
  const isLoadingItems = false
  const itemsError: Error | null = null

  // Mutations
  const approveReceiptMutation = useApproveInventoryReceiptMutation()
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
    switch (statusText) {
      case "Nháp":
      case "Chờ duyệt": // Map Chờ duyệt sang Nháp nếu còn tồn tại trong DB cũ
        status = InventoryReceiptStatus.DRAFT
        break
      case "Đã duyệt":
        status = InventoryReceiptStatus.APPROVED
        break
      case "Đã hủy":
        status = InventoryReceiptStatus.CANCELLED
        break
      default:
        status = InventoryReceiptStatus.DRAFT
    }

    const statusConfig: Record<string, { color: string }> = {
      [InventoryReceiptStatus.DRAFT]: { color: "default" },
      [InventoryReceiptStatus.APPROVED]: { color: "success" },
      [InventoryReceiptStatus.CANCELLED]: { color: "error" },
    }

    const config = statusConfig[status] || { color: "default" }
    return <Tag color={config.color}>{statusText}</Tag>
  }

  // Render các nút hành động theo đúng nghiệp vụ
  const renderActionButtons = () => {
    if (!receipt) return null

    const buttons = []

    // Nút in (luôn có)
    buttons.push(
      <Button key='print' icon={<PrinterOutlined />} onClick={handlePrint}>
        <span className="hidden sm:inline">In phiếu</span>
      </Button>
    )

    // Nút xem lịch sử (luôn có)
    buttons.push(
      <Button
        key='history'
        icon={<HistoryOutlined />}
        onClick={handleViewHistory}
      >
        <span className="hidden sm:inline">Lịch sử</span>
      </Button>
    )

    // === DRAFT (Nháp) ===
    if (receipt.status === "Nháp") {
      // Chỉnh sửa
      buttons.push(
        <Button key='edit' icon={<EditOutlined />} onClick={handleEdit}>
          <span className="hidden sm:inline">Chỉnh sửa</span>
        </Button>
      )
      
      // Xóa
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
            <span className="hidden sm:inline">Xóa phiếu</span>
          </Button>
        </Popconfirm>
      )
      
      // Hủy
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
            <span className="hidden sm:inline">Hủy phiếu</span>
          </Button>
        </Popconfirm>
      )
    }

    // === PENDING (Chờ duyệt) ===
    if (receipt.status === "Chờ duyệt") {
      // Chỉnh sửa (vẫn được sửa trước khi duyệt)
      buttons.push(
        <Button key='edit' icon={<EditOutlined />} onClick={handleEdit}>
          <span className="hidden sm:inline">Chỉnh sửa</span>
        </Button>
      )
      
      // Duyệt phiếu
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
            <span className="hidden sm:inline">Duyệt phiếu</span>
          </Button>
        </Popconfirm>
      )
      
      // Hủy (từ chối)
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
            <span className="hidden sm:inline">Hủy phiếu</span>
          </Button>
        </Popconfirm>
      )
    }

    // === APPROVED (Đã duyệt) ===
    if (receipt.status === "Đã duyệt") {
      // Hủy (nếu có vấn đề)
      buttons.push(
        <Popconfirm
          key='cancel'
          title='Hủy phiếu nhập kho'
          description='Khi hủy phiếu, hệ thống sẽ thực hiện hoàn kho. Bạn có chắc chắn muốn hủy?'
          onConfirm={handleCancel}
          okText='Hủy phiếu'
          cancelText='Không'
        >
          <Button
            icon={<CloseOutlined />}
            loading={cancelReceiptMutation.isPending}
            danger
          >
            <span className="hidden sm:inline">Hủy phiếu (Hoàn kho)</span>
          </Button>
        </Popconfirm>
      )
    }

    // === CANCELLED (Đã hủy) ===
    if (receipt.status === "Đã hủy") {
      // Xóa phiếu (để dọn dẹp)
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
      dataIndex: "product_name",
      key: "product_name",
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
      dataIndex: "unit_cost",
      key: "unit_cost",
      width: 120,
      align: "right",
      render: (price: number) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(price || 0),
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
      dataIndex: "expiry_date",
      key: "expiry_date",
      width: 120,
      align: "center",
      render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Số lô",
      dataIndex: "batch_number",
      key: "batch_number",
      width: 200,
      render: (batch: string) => batch ? <Tag color="processing" style={{ margin: 0 }}>{batch}</Tag> : "-",
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
            (receiptError as any)?.message ||
            (itemsError as any)?.message ||
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
                <span className="hidden sm:inline">Chi tiết phiếu nhập hàng</span>
                <span className="sm:hidden">Chi tiết phiếu</span>
              </Title>
            </Space>
          </Col>
          <Col className="mt-2 md:mt-0">
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
              <Descriptions.Item label='Người tạo'>
                ID: {receipt.created_by}
              </Descriptions.Item>
              {receipt.approved_by && (
                <Descriptions.Item label='Người duyệt'>
                  ID: {receipt.approved_by}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* Upload hình ảnh */}
          <div style={{ marginTop: "16px" }}>
            <ReceiptImageUpload 
              receiptId={receiptId} 
              images={receipt.images || []}
              onImagesChange={() => {
                // Refresh dữ liệu phiếu nhập
                queryClient.invalidateQueries({ queryKey: inventoryKeys.receipt(receiptId) })
              }}
            />
          </div>
        </Col>

        {/* Thông tin thanh toán - Hiển thị cho tất cả phiếu */}
        <Col xs={24} lg={12} style={{ marginTop: '16px' }}>
          <Card title="Thông tin thanh toán" size="small">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Tổng tiền">
                  <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(receipt.final_amount || receipt.total_amount)}
                  </Text>
                </Descriptions.Item>
                
                <Descriptions.Item label="Đã thanh toán">
                  <Text style={{ color: '#1890ff', fontWeight: 500 }}>
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(receipt.paid_amount || 0)}
                  </Text>
                </Descriptions.Item>
                
                <Descriptions.Item label="Còn nợ">
                  <Text style={{ color: '#ff4d4f', fontWeight: 500 }}>
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(receipt.debt_amount || 0)}
                  </Text>
                </Descriptions.Item>
                
                <Descriptions.Item label="Trạng thái thanh toán">
                  {receipt.payment_status === 'paid' && <Tag color="success">Đã thanh toán</Tag>}
                  {receipt.payment_status === 'partial' && <Tag color="warning">Thanh toán một phần</Tag>}
                  {receipt.payment_status === 'unpaid' && <Tag color="error">Chưa thanh toán</Tag>}
                </Descriptions.Item>
              </Descriptions>
              
              <Divider style={{ margin: '12px 0' }} />
              
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  block
                  icon={<DollarOutlined />}
                  onClick={() => setShowPaymentHistory(true)}
                >
                  Lịch sử thanh toán
                </Button>
                
                {receipt.debt_amount && receipt.debt_amount > 0 && (
                  <Button
                    block
                    type="primary"
                    icon={<DollarOutlined />}
                    onClick={() => setShowPaymentHistory(true)}
                  >
                    Thêm thanh toán
                  </Button>
                )}
              </Space>
            </Card>
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
                  <Table.Summary.Cell index={2} align="right">
                    <Text strong>
                      {new Intl.NumberFormat("vi-VN").format(totalQuantity)}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} />
                  <Table.Summary.Cell index={4} align="right">
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

      {/* Payment History Modal */}
      <PaymentHistoryModal
        receiptId={receipt.id}
        receiptCode={receipt.code}
        debtAmount={receipt.debt_amount || 0}
        totalAmount={receipt.total_amount || 0}
        returnedAmount={receipt.returned_amount || 0}
        finalAmount={receipt.final_amount || receipt.total_amount || 0}
        paidAmount={receipt.paid_amount || 0}
        supplierId={receipt.supplier_id}
        supplierName={receipt.supplier?.name}
        receiptStatus={receipt.status}
        open={showPaymentHistory}
        onClose={() => setShowPaymentHistory(false)}
      />
    </div>
  )
}

export default InventoryReceiptDetail
