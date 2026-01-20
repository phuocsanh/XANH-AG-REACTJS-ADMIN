import React, { useState } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
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
  Spin,
  Descriptions,
  Tabs,
  Badge,
  Tooltip,
} from "antd"
import DataTable from "@/components/common/data-table"
import {
  ArrowLeftOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  PrinterOutlined,
  HistoryOutlined,
  DeleteOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  ShoppingOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"

import {
  InventoryReceiptItem,
  InventoryReceiptStatus,
  normalizeReceiptStatus,
  getInventoryReceiptStatusText,
} from "@/models/inventory.model"
import {
  useInventoryReceiptQuery,
  useApproveInventoryReceiptMutation,
  useCancelInventoryReceiptMutation,
  useDeleteInventoryReceiptMutation,
  useInventoryReceiptHistoryQuery,
} from "@/queries/inventory"
import ReceiptImageUpload from "@/components/inventory/ReceiptImageUpload"
import PaymentTab from "@/components/inventory/PaymentTab"
import InventoryReceiptDetailSkeleton from "@/components/inventory/InventoryReceiptDetailSkeleton"

const { Title, Text } = Typography
const { TabPane } = Tabs

const InventoryReceiptDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const receiptId = Number(id)
  
  // Xác định tab mặc định từ state
  const defaultTab = (location.state as any)?.activeTab || "info"
  const [activeTab, setActiveTab] = useState(defaultTab)

  // Queries
  const {
    data: receipt,
    isLoading: isLoadingReceipt,
    error: receiptError,
    refetch: refetchReceipt,
  } = useInventoryReceiptQuery(receiptId)

  const { data: historyData, isLoading: isLoadingHistory } = useInventoryReceiptHistoryQuery(receiptId)

  // Chuẩn hóa trạng thái
  const normalizedStatus = receipt 
    ? normalizeReceiptStatus(receipt.status_code || receipt.status)
    : InventoryReceiptStatus.DRAFT

  // Items từ receipt
  const items = receipt?.items || []

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
      refetchReceipt()
    } catch (error) {
      console.error("Error approving receipt:", error)
    }
  }

  const handleCancel = async () => {
    try {
      await cancelReceiptMutation.mutateAsync(receiptId)
      refetchReceipt()
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
    window.print()
  }

  // Render trạng thái
  const renderStatus = (record: any) => {
    if (!record) return null
    const normalizedStatus = normalizeReceiptStatus(record.status_code || record.status)

    const statusConfig: Record<string, { color: string }> = {
      [InventoryReceiptStatus.DRAFT]: { color: "default" },
      [InventoryReceiptStatus.APPROVED]: { color: "success" },
      [InventoryReceiptStatus.CANCELLED]: { color: "error" },
    }

    const config = statusConfig[normalizedStatus] || { color: "default" }
    const label = getInventoryReceiptStatusText(record.status_code || record.status)
    return <Tag color={config.color} className="px-3 py-1 font-medium">{label}</Tag>
  }

  // Render Header Actions
  const renderHeaderActions = () => {
    if (!receipt) return null

    const buttons = []

    // 1. Nút Sửa - Chỉ cho Nháp
    if (normalizedStatus === InventoryReceiptStatus.DRAFT) {
      buttons.push(
        <Button key='edit' icon={<EditOutlined />} onClick={handleEdit}>
          Sửa
        </Button>
      )
    }

    // 2. Nút Duyệt - Chỉ cho Nháp
    if (normalizedStatus === InventoryReceiptStatus.DRAFT) {
      buttons.push(
        <Popconfirm
          key='approve'
          title='Duyệt phiếu nhập hàng'
          description='Sau khi duyệt, hàng sẽ được nhập vào kho và không thể sửa mặt hàng. Bạn có chắc chắn?'
          onConfirm={handleApprove}
          okText='Duyệt ngay'
          cancelText='Hủy'
        >
          <Button
            type='primary'
            icon={<CheckOutlined />}
            loading={approveReceiptMutation.isPending}
            className="bg-green-600 border-green-600 hover:bg-green-700 hover:border-green-700"
          >
            Duyệt
          </Button>
        </Popconfirm>
      )
    }

    // 3. Nút Hủy - Cho phiếu Đã duyệt
    if (normalizedStatus === InventoryReceiptStatus.APPROVED) {
      buttons.push(
        <Popconfirm
          key='cancel'
          title='Hủy phiếu nhập kho'
          description='Khi hủy phiếu, hàng sẽ được hoàn kho. Bạn có chắc chắn?'
          onConfirm={handleCancel}
          okText='Xác nhận hủy'
          cancelText='Không'
          okButtonProps={{ danger: true }}
        >
          <Button
            icon={<CloseOutlined />}
            loading={cancelReceiptMutation.isPending}
            danger
          >
            Hủy
          </Button>
        </Popconfirm>
      )
    }

    // 4. Nút Xóa - Cho Nháp hoặc Đã hủy
    if (normalizedStatus === InventoryReceiptStatus.DRAFT || normalizedStatus === InventoryReceiptStatus.CANCELLED) {
      buttons.push(
        <Popconfirm
          key='delete'
          title='Xóa phiếu'
          description='Hành động này không thể hoàn tác. Bạn có chắc chắn?'
          onConfirm={handleDelete}
          okText='Xóa'
          cancelText='Hủy'
          okButtonProps={{ danger: true }}
        >
          <Button
            icon={<DeleteOutlined />}
            danger
            loading={deleteReceiptMutation.isPending}
          />
        </Popconfirm>
      )
    }

    // 5. Nút In
    buttons.push(
      <Button key='print' icon={<PrinterOutlined />} onClick={handlePrint} />
    )

    return <Space wrap>{buttons}</Space>
  }

  // Cấu hình cột sản phẩm
  const itemColumns: ColumnsType<InventoryReceiptItem> = [
    {
      title: "Tên sản phẩm",
      dataIndex: "product_name",
      key: "product_name",
      render: (name) => <Text strong>{name}</Text>,
    },
    {
      title: "ĐVT",
      key: "unit_name",
      width: 80,
      render: (_, record) => record.unit_name || record.product?.unit?.name || "-",
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      align: "right",
      render: (q) => (q || 0).toLocaleString("vi-VN"),
    },
    {
      title: "Đơn giá",
      dataIndex: "unit_cost",
      key: "unit_cost",
      width: 120,
      align: "right",
      render: (p) => (p || 0).toLocaleString("vi-VN") + " ₫",
    },
    {
      title: "Phí Bốc Vác",
      dataIndex: "individual_shipping_cost",
      key: "individual_shipping_cost",
      width: 120,
      align: "right",
      render: (p) => p > 0 ? (p || 0).toLocaleString("vi-VN") + " ₫" : "-",
    },
    {
      title: "Thành tiền",
      dataIndex: "total_price",
      key: "total_price",
      width: 140,
      align: "right",
      render: (p) => (
        <Text strong className="text-green-600">
          {(p || 0).toLocaleString("vi-VN")} ₫
        </Text>
      ),
    },
    {
      title: "Số lô",
      dataIndex: "batch_number",
      key: "batch_number",
      width: 150,
      render: (batch) => batch ? <Tag color="blue">{batch}</Tag> : <Text type="secondary">Chưa cấp</Text>,
    },
    {
      title: "Hạn dùng",
      dataIndex: "expiry_date",
      key: "expiry_date",
      width: 110,
      align: "center",
      render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
    },
  ]

  const historyColumns: ColumnsType<any> = [
    {
      title: "Thời gian",
      dataIndex: "created_at",
      key: "created_at",
      width: 170,
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm:ss"),
    },
    {
      title: "Sản phẩm",
      dataIndex: "product",
      key: "product",
      render: (product: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{product?.name}</Text>
          <Text type="secondary" className="text-xs">{product?.code}</Text>
        </Space>
      ),
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (type: string) => {
        const isUp = type === "IN"
        return (
          <Tag 
            color={isUp ? "green" : "orange"} 
            icon={isUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            className="rounded-full px-3"
          >
            {isUp ? "Nhập kho" : "Xuất kho"}
          </Tag>
        )
      },
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      width: 120,
      align: "right",
      render: (q: number) => (
        <Text strong className={q > 0 ? "text-green-600" : "text-orange-600"}>
          {q > 0 ? "+" : ""}{q.toLocaleString("vi-VN")}
        </Text>
      ),
    },
    {
      title: "Tồn cuối",
      dataIndex: "remaining_quantity",
      key: "remaining_quantity",
      width: 120,
      align: "right",
      render: (q: number) => (
        <Text strong>{q.toLocaleString("vi-VN")}</Text>
      ),
    },
    {
      title: "Người thực hiện",
      dataIndex: "creator",
      key: "creator",
      width: 160,
      render: (creator: any) => (
        <Space size="small">
          <Badge status="processing" size="small" />
          <Text>{creator?.full_name || `ID: ${creator?.id || "N/A"}`}</Text>
        </Space>
      ),
    },
    {
      title: "Ghi chú",
      dataIndex: "notes",
      key: "notes",
      ellipsis: true,
      render: (notes: string) => notes || <Text type="secondary" italic>-</Text>
    },
  ]

  // Loading & Error States
  if (isLoadingReceipt) {
    return <InventoryReceiptDetailSkeleton />
  }

  if (receiptError || !receipt) {
    return (
      <div className="p-6">
        <Alert
          message="Lỗi"
          description={receiptError ? (receiptError as any).message : "Không tìm thấy phiếu nhập hàng"}
          type="error"
          showIcon
          action={<Button onClick={handleBack}>Quay lại</Button>}
        />
      </div>
    )
  }

  const debtAmount = receipt.debt_amount ?? 0;

  return (
    <div className="p-0 md:p-6 bg-gray-50 min-h-screen">
      {/* Header Page */}
      <div className="m-2 md:m-0 mb-4 md:mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Space size="middle">
              <Button 
                type="text"
                icon={<ArrowLeftOutlined />} 
                onClick={handleBack}
                className="hover:bg-gray-100"
              />
              <div>
                <Title level={4} className="mb-0 !m-0">
                  Phiếu nhập: <Text copyable className="text-blue-600 font-mono">{receipt.code}</Text>
                </Title>
                <Space classNames={{ item: "flex items-center" }} className="mt-1">
                  {renderStatus(receipt)}
                  <Text type="secondary" className="text-xs">
                    Tạo bởi: {receipt.creator?.full_name || `ID: ${receipt.created_by}`} • {dayjs(receipt.created_at).format("DD/MM/YYYY HH:mm")}
                  </Text>
                </Space>
              </div>
            </Space>
          </Col>
          <Col xs={24} md={12} className="text-left md:text-right mt-2 md:mt-0">
            {renderHeaderActions()}
          </Col>
        </Row>
      </div>

      {/* Main Content with Tabs */}
      <Card className="w-full shadow-sm border-none overflow-hidden" bodyStyle={{ padding: 0 }}>
        <style>{`
          .ant-tabs-nav-operations { display: none !important; }
          .ant-tabs-nav-wrap::after, .ant-tabs-nav-wrap::before { display: none !important; }
          .data-table-mobile-scroll .ant-table-content {
            overflow-x: auto !important;
          }
          /* Đảm bảo tab không bị cắt chữ và không dư khoảng trắng */
          .ant-tabs-nav-wrap {
            display: flex !important;
          }
          .ant-tabs-tab {
            padding: 12px 16px !important;
            margin: 0 !important;
            flex-shrink: 0 !important;
          }
          .ant-tabs-nav-list {
            display: flex !important;
            flex-wrap: nowrap !important;
          }
        `}</style>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          size="large"
          className="bg-white"
          tabBarStyle={{ marginBottom: 0, paddingLeft: 8, paddingRight: 0 }}
          moreIcon={null}
        >
          {/* TAB 1: THÔNG TIN CHI TIẾT */}
          <TabPane 
            tab={<Space><span>ℹ️ Thông tin chính</span></Space>} 
            key="info"
          >
            <div className="p-3 md:p-6">
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                  <Card title="Chi tiết nghiệp vụ" size="small" bordered={false} className="bg-gray-50 h-full">
                    <Descriptions column={{ xs: 1, sm: 2 }} bordered={false} size="small">
                      <Descriptions.Item label="Nhà cung cấp">
                        <Text strong>{receipt.supplier?.name || `ID #${receipt.supplier_id}`}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Tổng giá trị">
                        <Text strong className="text-lg text-blue-600">
                          {(receipt.total_amount || 0).toLocaleString("vi-VN")} ₫
                        </Text>
                      </Descriptions.Item>
                      {Number(receipt.shared_shipping_cost) > 0 && (
                        <Descriptions.Item label="Phí vận chuyển/bốc vác">
                          <Text strong className="text-orange-600">
                            {Number(receipt.shared_shipping_cost).toLocaleString("vi-VN")} ₫
                          </Text>
                        </Descriptions.Item>
                      )}
                      {receipt.supplier_amount !== undefined && receipt.supplier_amount !== receipt.total_amount && (
                        <Descriptions.Item label="Nợ NCC gốc">
                          <Tooltip title="Tổng số tiền phải trả cho NCC (Đã trừ các phí tự thanh toán ngoài)">
                            <Text strong className="text-lg text-orange-600">
                              {(receipt.supplier_amount || 0).toLocaleString("vi-VN")} ₫
                              <InfoCircleOutlined className="ml-1 text-xs" />
                            </Text>
                          </Tooltip>
                        </Descriptions.Item>
                      )}
                      <Descriptions.Item label="Mô tả / Ghi chú" span={2}>
                        {receipt.notes || <Text type="secondary" italic>Không có ghi chú</Text>}
                      </Descriptions.Item>
                      <Descriptions.Item label="Ngày nhập hàng">
                        <Text strong>{receipt.bill_date ? dayjs(receipt.bill_date).format("DD/MM/YYYY") : dayjs(receipt.created_at).format("DD/MM/YYYY")}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Ngày tạo hệ thống">
                        {dayjs(receipt.created_at).format("DD/MM/YYYY HH:mm")}
                      </Descriptions.Item>
                      <Descriptions.Item label="Cập nhật cuối">
                        {dayjs(receipt.updated_at).format("DD/MM/YYYY HH:mm")}
                      </Descriptions.Item>
                      {receipt.approved_at && (
                        <Descriptions.Item label="Ngày duyệt" span={2}>
                          <Text className="text-green-600">
                            {dayjs(receipt.approved_at).format("DD/MM/YYYY HH:mm")} (Bởi: {receipt.approver?.full_name || `ID: ${receipt.approved_by}`})
                          </Text>
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </Card>
                </Col>
                
                <Col xs={24} lg={8}>
                  <Card title="Hình ảnh chứng từ" size="small" bordered={false} className="bg-gray-50 h-full">
                    <ReceiptImageUpload 
                      receiptId={receiptId} 
                      images={receipt.images || []}
                      onImagesChange={refetchReceipt}
                    />
                  </Card>
                </Col>
              </Row>
            </div>
          </TabPane>

          {/* TAB 2: DANH SÁCH HÀNG HÓA */}
          <TabPane 
            tab={<Space><span>🛍️ Hàng hóa</span><Tag className="ml-1 m-0">{items.length}</Tag></Space>} 
            key="items"
          >
            <div className="p-0 md:p-6 data-table-mobile-scroll">
              <DataTable
                columns={itemColumns as any}
                data={items as any}
                rowKey="id"
                pagination={false}
                size="middle"
                showActions={false}
                showSTT={true}
                className="border border-gray-100 rounded"
                summary={(pageData: readonly any[]) => {
                  const totalQ = pageData.reduce((s, i) => s + (Number(i.quantity) || 0), 0)
                  const totalA = pageData.reduce((s, i) => s + (Number(i.total_price) || 0), 0)
                  return (
                    <Table.Summary fixed>
                      <Table.Summary.Row className="bg-gray-50">
                        <Table.Summary.Cell index={0} colSpan={3}><Text strong>Tổng cộng hàng hóa</Text></Table.Summary.Cell>
                        <Table.Summary.Cell index={3} align="right"><Text strong>{totalQ.toLocaleString("vi-VN")}</Text></Table.Summary.Cell>
                        <Table.Summary.Cell index={4} />
                        <Table.Summary.Cell index={5} />
                        <Table.Summary.Cell index={6} align="right">
                          <Text strong className="text-green-600">{totalA.toLocaleString("vi-VN")} ₫</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={7} colSpan={2} />
                      </Table.Summary.Row>
                    </Table.Summary>
                  )
                }}
              />

              {normalizedStatus === InventoryReceiptStatus.DRAFT && (
                <div className="mt-6 text-center">
                  <Button 
                    type="dashed" 
                    icon={<EditOutlined />} 
                    size="large"
                    onClick={handleEdit}
                    className="w-full md:w-auto px-12"
                  >
                    Chỉnh sửa danh mục hàng hóa
                  </Button>
                </div>
              )}
            </div>
          </TabPane>

          {/* TAB 3: THANH TOÁN */}
          <TabPane 
            tab={
              <Space>
                <span>💰 Thanh toán</span>
                {debtAmount > 0 && <Badge status="error" className="ml-1" />}
              </Space>
            } 
            key="payment"
          >
            <div className="p-0 md:p-6 data-table-mobile-scroll">
              <PaymentTab receipt={receipt} onRefresh={refetchReceipt} />
            </div>
          </TabPane>

          {/* TAB 4: LỊCH SỬ GIAO DỊCH */}
          <TabPane 
            tab={<Space><span>🕰️ Lịch sử</span></Space>} 
            key="history"
          >
            <div className="p-0 md:p-6 data-table-mobile-scroll">
              <DataTable
                columns={historyColumns}
                data={historyData || []}
                rowKey="id"
                pagination={{ pageSize: 15 }}
                size="middle"
                loading={isLoadingHistory}
                showActions={false}
                showSTT={true}
                className="border border-gray-100 rounded"
              />
              <div className="mt-4">
                <Alert 
                  type="info" 
                  showIcon 
                  message="Ghi chú về lịch sử" 
                  description="Các giao dịch kho thể hiện quá trình nhập hàng và các biến động tồn kho liên quan trực tiếp đến các mặt hàng trong phiếu này."
                />
              </div>
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  )
}

export default InventoryReceiptDetail
