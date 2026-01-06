import React from "react"
import { Modal, Table, Tag, Button, Typography } from "antd"

import { useExpiryBatchesQuery } from "@/queries/inventory"
import dayjs from "dayjs"
import { Product } from "@/models/product.model"

const { Text } = Typography

interface BatchExpiryModalProps {
  product: Product | null
  visible: boolean
  onCancel: () => void
}

const BatchExpiryModal: React.FC<BatchExpiryModalProps> = ({
  product,
  visible,
  onCancel,
}) => {
  const { data: batches, isLoading } = useExpiryBatchesQuery(product?.id || 0)

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return { text: "Không có hạn", color: "default" }
    
    const now = dayjs()
    const expiry = dayjs(expiryDate)
    const diffDays = expiry.diff(now, "day")

    if (diffDays < 0) return { text: "Đã hết hạn", color: "red" }
    if (diffDays <= 30) return { text: "Sắp hết hạn", color: "orange" }
    if (diffDays <= 90) return { text: "Cần chú ý", color: "yellow" }
    return { text: "Ổn định", color: "green" }
  }

  const columns = [
    {
      title: "Mã lô",
      dataIndex: "batch_number",
      key: "batch_number",
      render: (text: string) => <Text strong>{text || "N/A"}</Text>,
    },
    {
      title: "Ngày nhập",
      dataIndex: "received_at",
      key: "received_at",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Hạn dùng",
      dataIndex: "expiry_date",
      key: "expiry_date",
      render: (date?: string) => date ? dayjs(date).format("DD/MM/YYYY") : "---",
    },
    {
        title: "SL ban đầu",
        dataIndex: "quantity",
        key: "quantity",
        align: "right" as const,
        render: (val: number) => val.toLocaleString("vi-VN"),
    },
    {
      title: "Còn lại",
      dataIndex: "remaining_quantity",
      key: "remaining_quantity",
      align: "right" as const,
      render: (val: number) => (
        <Text type={val === 0 ? "secondary" : undefined} strong={val > 0}>
          {val.toLocaleString("vi-VN")}
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_: unknown, record: unknown) => {
        const { text, color } = getExpiryStatus((record as any).expiry_date)
        return <Tag color={color}>{text}</Tag>
      },
    },
  ]

  return (
    <Modal
      title={`Thông tin lô hàng & Hạn dùng: ${product?.name}`}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key='close' onClick={onCancel}>
          Đóng
        </Button>,
      ]}
      width={800}
    >
      <Table
        dataSource={batches}
        columns={columns}
        loading={isLoading}
        rowKey='id'
        pagination={{ pageSize: 5 }}
        size="middle"
      />
    </Modal>
  )
}

export default BatchExpiryModal
