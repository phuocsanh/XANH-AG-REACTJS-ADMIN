import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Row,
  Col,
  Button,
  Tag,
  Table,
  Space,
  Descriptions,
  Typography,
  Popconfirm,
  Alert,
  Divider,
  Spin
} from 'antd'
import {
  ArrowLeftOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  PrinterOutlined,
  HistoryOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

import {
  InventoryReceiptItem,
  InventoryReceiptStatus
} from '@/models/inventory.model'
import {
  useInventoryReceipt,
  useInventoryReceiptItems,
  useApproveInventoryReceipt,
  useCompleteInventoryReceipt,
  useCancelInventoryReceipt,
  useDeleteInventoryReceipt
} from '@/queries/use-inventory'

const { Title, Text } = Typography

const InventoryReceiptDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const receiptId = Number(id)

  // Queries
  const {
    data: receipt,
    isLoading: isLoadingReceipt,
    error: receiptError
  } = useInventoryReceipt(receiptId)

  const {
    data: items,
    isLoading: isLoadingItems,
    error: itemsError
  } = useInventoryReceiptItems(receiptId)

  // Mutations
  const approveReceiptMutation = useApproveInventoryReceipt()
  const completeReceiptMutation = useCompleteInventoryReceipt()
  const cancelReceiptMutation = useCancelInventoryReceipt()
  const deleteReceiptMutation = useDeleteInventoryReceipt()

  // Handlers
  const handleBack = () => {
    navigate('/inventory/receipts')
  }

  const handleEdit = () => {
    navigate(`/inventory/receipts/edit/${receiptId}`)
  }

  const handleApprove = () => {
    approveReceiptMutation.mutate(receiptId, {
      onSuccess: () => {
        // Mutation sẽ tự động cập nhật cache và hiển thị toast
      }
    })
  }

  const handleComplete = () => {
    completeReceiptMutation.mutate(receiptId, {
      onSuccess: () => {
        // Mutation sẽ tự động cập nhật cache và hiển thị toast
      }
    })
  }

  const handleCancel = () => {
    cancelReceiptMutation.mutate(receiptId, {
      onSuccess: () => {
        // Mutation sẽ tự động cập nhật cache và hiển thị toast
      }
    })
  }

  const handleDelete = () => {
    deleteReceiptMutation.mutate(receiptId, {
      onSuccess: () => {
        navigate('/inventory/receipts')
      }
    })
  }

  const handlePrint = () => {
    // Tạm thời chỉ log, có thể implement sau
    console.log('Print receipt:', receiptId)
  }

  const handleViewHistory = () => {
    navigate(`/inventory/history?receiptId=${receiptId}`)
  }

  // Render trạng thái
  const renderStatus = (status: InventoryReceiptStatus, statusText: string) => {
    const statusConfig = {
      [InventoryReceiptStatus.DRAFT]: { color: 'default' },
      [InventoryReceiptStatus.PENDING]: { color: 'processing' },
      [InventoryReceiptStatus.APPROVED]: { color: 'success' },
      [InventoryReceiptStatus.COMPLETED]: { color: 'success' },
      [InventoryReceiptStatus.CANCELLED]: { color: 'error' }
    }

    const config = statusConfig[status] || { color: 'default' }
    return <Tag color={config.color}>{statusText}</Tag>
  }

  // Render các nút hành động
  const renderActionButtons = () => {
    if (!receipt) return null

    const buttons = []

    // Nút in (luôn có)
    buttons.push(
      <Button key="print" icon={<PrinterOutlined />} onClick={handlePrint}>
        In phiếu
      </Button>
    )

    // Nút xem lịch sử (luôn có)
    buttons.push(
      <Button key="history" icon={<HistoryOutlined />} onClick={handleViewHistory}>
        Lịch sử
      </Button>
    )

    // Nút chỉnh sửa (chỉ khi ở trạng thái DRAFT hoặc PENDING)
    if (receipt.status === InventoryReceiptStatus.DRAFT || 
        receipt.status === InventoryReceiptStatus.PENDING) {
      buttons.push(
        <Button key="edit" icon={<EditOutlined />} onClick={handleEdit}>
          Chỉnh sửa
        </Button>
      )
    }

    // Nút duyệt (chỉ khi ở trạng thái PENDING)
    if (receipt.status === InventoryReceiptStatus.PENDING) {
      buttons.push(
        <Popconfirm
          key="approve"
          title="Duyệt phiếu nhập hàng"
          description="Bạn có chắc chắn muốn duyệt phiếu nhập hàng này?"
          onConfirm={handleApprove}
          okText="Duyệt"
          cancelText="Hủy"
        >
          <Button
            type="primary"
            icon={<CheckOutlined />}
            loading={approveReceiptMutation.isPending}
          >
            Duyệt phiếu
          </Button>
        </Popconfirm>
      )
    }

    // Nút hoàn thành (chỉ khi ở trạng thái APPROVED)
    if (receipt.status === InventoryReceiptStatus.APPROVED) {
      buttons.push(
        <Popconfirm
          key="complete"
          title="Hoàn thành nhập kho"
          description="Bạn có chắc chắn muốn hoàn thành việc nhập kho cho phiếu này?"
          onConfirm={handleComplete}
          okText="Hoàn thành"
          cancelText="Hủy"
        >
          <Button
            type="primary"
            icon={<CheckOutlined />}
            loading={completeReceiptMutation.isPending}
          >
            Hoàn thành
          </Button>
        </Popconfirm>
      )
    }

    // Nút hủy (chỉ khi ở trạng thái DRAFT, PENDING, hoặc APPROVED)
    if (receipt.status === InventoryReceiptStatus.DRAFT || 
        receipt.status === InventoryReceiptStatus.PENDING ||
        receipt.status === InventoryReceiptStatus.APPROVED) {
      buttons.push(
        <Popconfirm
          key="cancel"
          title="Hủy phiếu nhập hàng"
          description="Bạn có chắc chắn muốn hủy phiếu nhập hàng này?"
          onConfirm={handleCancel}
          okText="Hủy phiếu"
          cancelText="Không"
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
    if (receipt.status === InventoryReceiptStatus.DRAFT || 
        receipt.status === InventoryReceiptStatus.CANCELLED) {
      buttons.push(
        <Popconfirm
          key="delete"
          title="Xóa phiếu nhập hàng"
          description="Bạn có chắc chắn muốn xóa phiếu nhập hàng này? Hành động này không thể hoàn tác."
          onConfirm={handleDelete}
          okText="Xóa"
          cancelText="Hủy"
        >
          <Button
            danger
            icon={<DeleteOutlined />}
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
      title: 'STT',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => index + 1
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
      width: 250
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right',
      render: (quantity: number) => 
        new Intl.NumberFormat('vi-VN').format(quantity)
    },
    {
      title: 'Đơn giá',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 120,
      align: 'right',
      render: (price: string) => 
        new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(parseFloat(price || '0'))
    },
    {
      title: 'Thành tiền',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 120,
      align: 'right',
      render: (price: string) => 
        new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(parseFloat(price || '0'))
    },
    {
      title: 'Hạn sử dụng',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      width: 120,
      align: 'center',
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-'
    },
    {
      title: 'Số lô',
      dataIndex: 'batchNumber',
      key: 'batchNumber',
      width: 100,
      render: (batch: string) => batch || '-'
    },
    {
      title: 'Ghi chú',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (notes: string) => notes || '-'
    }
  ]

  // Loading state
  if (isLoadingReceipt || isLoadingItems) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text>Đang tải thông tin phiếu nhập hàng...</Text>
        </div>
      </div>
    )
  }

  // Error state
  if (receiptError || itemsError) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Lỗi"
          description={receiptError?.message || itemsError?.message || 'Không thể tải thông tin phiếu nhập hàng'}
          type="error"
          showIcon
          action={
            <Button onClick={handleBack}>
              Quay lại
            </Button>
          }
        />
      </div>
    )
  }

  // No data state
  if (!receipt) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Không tìm thấy"
          description="Không tìm thấy phiếu nhập hàng với ID này"
          type="warning"
          showIcon
          action={
            <Button onClick={handleBack}>
              Quay lại
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Card style={{ marginBottom: '16px' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
                Quay lại
              </Button>
              <Title level={3} style={{ margin: 0 }}>
                Chi tiết phiếu nhập hàng
              </Title>
              {renderStatus(receipt.status, receipt.statusText)}
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
          <Card title="Thông tin phiếu nhập" size="small">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Mã phiếu">
                <Text strong>{receipt.code}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {renderStatus(receipt.status, receipt.statusText)}
              </Descriptions.Item>
              <Descriptions.Item label="Nhà cung cấp">
                {receipt.supplierName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Liên hệ NCC">
                {receipt.supplierContact || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng tiền">
                <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                  }).format(parseFloat(receipt.totalAmount || '0'))}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Mô tả">
                {receipt.description || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Thông tin thời gian */}
        <Col xs={24} lg={12}>
          <Card title="Thông tin thời gian" size="small">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Ngày tạo">
                {dayjs(receipt.createdAt).format('DD/MM/YYYY HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="Cập nhật lần cuối">
                {dayjs(receipt.updatedAt).format('DD/MM/YYYY HH:mm:ss')}
              </Descriptions.Item>
              {receipt.approvedAt && (
                <Descriptions.Item label="Ngày duyệt">
                  {dayjs(receipt.approvedAt).format('DD/MM/YYYY HH:mm:ss')}
                </Descriptions.Item>
              )}
              {receipt.completedAt && (
                <Descriptions.Item label="Ngày hoàn thành">
                  {dayjs(receipt.completedAt).format('DD/MM/YYYY HH:mm:ss')}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Người tạo">
                ID: {receipt.createdBy}
              </Descriptions.Item>
              {receipt.approvedBy && (
                <Descriptions.Item label="Người duyệt">
                  ID: {receipt.approvedBy}
                </Descriptions.Item>
              )}
              {receipt.completedBy && (
                <Descriptions.Item label="Người hoàn thành">
                  ID: {receipt.completedBy}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* Danh sách sản phẩm */}
      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Title level={4}>Danh sách sản phẩm</Title>
        </div>
        
        <Table
          columns={itemColumns}
          dataSource={items || []}
          rowKey="id"
          pagination={false}
          size="small"
          scroll={{ x: 1000 }}
          summary={(pageData) => {
            const totalQuantity = pageData.reduce(
              (sum, item) => sum + item.quantity,
              0
            )
            const totalAmount = pageData.reduce(
              (sum, item) => sum + parseFloat(item.totalPrice || '0'),
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
                      {new Intl.NumberFormat('vi-VN').format(totalQuantity)}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} />
                  <Table.Summary.Cell index={4}>
                    <Text strong style={{ color: '#52c41a' }}>
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
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
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Text type="secondary">Chưa có sản phẩm nào trong phiếu nhập này</Text>
          </div>
        )}
      </Card>
    </div>
  )
}

export default InventoryReceiptDetail