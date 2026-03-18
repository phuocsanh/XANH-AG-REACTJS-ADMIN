import React from "react"
import { Modal, Table, Typography, Tag, Space, Alert } from "antd"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import { useTaxableItemsQuery } from "@/queries/inventory"

const { Text, Title } = Typography

interface TaxableItemsModalProps {
  open: boolean
  onClose: () => void
  supplierId?: number
  startDate?: string
  endDate?: string
  supplierName?: string
}

const TaxableItemsModal: React.FC<TaxableItemsModalProps> = ({
  open,
  onClose,
  supplierId,
  startDate,
  endDate,
  supplierName,
}) => {
  const { data, isLoading, error } = useTaxableItemsQuery({
    supplier_id: supplierId,
    startDate,
    endDate,
  })

  // Tính tổng hàng có hóa đơn (tất cả data trả về)
  const totalTaxableValue = React.useMemo(() => {
    if (!data) return 0
    return data.reduce((acc, curr) => acc + (Number(curr.taxable_quantity || 0) * Number(curr.unit_cost || 0)), 0)
  }, [data])

  const columns: ColumnsType<any> = [
    {
      title: "STT",
      key: "index",
      width: 50,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Ngày nhập",
      dataIndex: ["receipt", "created_at"],
      key: "date",
      width: 100,
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
      sorter: (a, b) => dayjs(a.receipt.created_at).unix() - dayjs(b.receipt.created_at).unix(),
    },
    {
      title: "Mã phiếu",
      dataIndex: ["receipt", "code"],
      key: "receipt_code",
      width: 120,
      render: (code) => <Text strong className="text-blue-600 font-mono">{code}</Text>,
    },
    {
      title: "Nhà cung cấp",
      dataIndex: ["receipt", "supplier", "name"],
      key: "supplier",
      width: 150,
      ellipsis: true,
      render: (val) => val || "-",
    },
    {
      title: "Sản phẩm",
      dataIndex: "product_name",
      key: "product_name",
      render: (name, record) => {
        const prodName = record.product?.name || name
        return (
          <Space direction="vertical" size={0}>
            <Text strong className="leading-tight">{prodName}</Text>
            {record.product?.code && <Text type="secondary" style={{ fontSize: '11px' }}>{record.product.code}</Text>}
          </Space>
        )
      },
    },
    {
      title: "ĐVT",
      dataIndex: "unit_name",
      key: "unit",
      width: 70,
    },
    {
      title: "SL Thuế",
      dataIndex: "taxable_quantity",
      key: "taxable_quantity",
      width: 90,
      align: "right",
      render: (val) => <Text strong className="text-blue-600">{Number(val).toLocaleString("vi-VN")}</Text>,
    },
    {
      title: "Đơn giá",
      dataIndex: "unit_cost",
      key: "unit_cost",
      width: 110,
      align: "right",
      render: (val) => Number(val).toLocaleString("vi-VN") + " ₫",
    },
    {
      title: "Thành tiền",
      key: "subtotal",
      width: 130,
      align: "right",
      render: (_, record) => {
        const subtotal = Number(record.taxable_quantity || 0) * Number(record.unit_cost || 0)
        return <Text strong className="text-green-600">{subtotal.toLocaleString("vi-VN")} ₫</Text>
      },
    },
  ]

  return (
    <Modal
      title={
        <Space direction="vertical" size={0}>
          <Title level={4} style={{ margin: 0 }}>🛍️ Hàng hóa nhập có hóa đơn</Title>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {startDate && endDate ? `Từ ${dayjs(startDate).format("DD/MM/YYYY")} đến ${dayjs(endDate).format("DD/MM/YYYY")}` : "Tất cả thời gian"}
            {supplierName ? ` • Nhà cung cấp: ${supplierName}` : ""}
          </Text>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={1100}
      style={{ top: 20 }}
      bodyStyle={{ padding: '0 24px 24px 24px' }}
    >
      {error && <Alert message="Lỗi" description={(error as any).message} type="error" showIcon style={{ marginBottom: 16 }} />}
      
      <Table
        columns={columns}
        dataSource={data || []}
        rowKey="id"
        loading={isLoading}
        size="middle"
        pagination={{ pageSize: 15, showSizeChanger: true }}
        scroll={{ y: 500, x: 1000 }}
        summary={(pageData) => {
            const pageTotal = pageData.reduce((acc, curr) => acc + (Number(curr.taxable_quantity || 0) * Number(curr.unit_cost || 0)), 0)
            return (
                <Table.Summary fixed>
                    <Table.Summary.Row className="bg-gray-50 border-t border-gray-200">
                        <Table.Summary.Cell index={0} colSpan={8} align="right">
                            <Text strong>Tổng cộng trang hiện tại:</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={8} align="right">
                            <Text strong className="text-green-600">{pageTotal.toLocaleString("vi-VN")} ₫</Text>
                        </Table.Summary.Cell>
                    </Table.Summary.Row>
                    <Table.Summary.Row className="bg-blue-50">
                        <Table.Summary.Cell index={0} colSpan={8} align="right">
                            <Text strong style={{ fontSize: '15px' }}>TỔNG CỘNG TẤT CẢ ({data?.length || 0} mục):</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={8} align="right">
                            <Text strong style={{ fontSize: '18px' }} className="text-blue-600">{totalTaxableValue.toLocaleString("vi-VN")} ₫</Text>
                        </Table.Summary.Cell>
                    </Table.Summary.Row>
                </Table.Summary>
            )
        }}
      />
    </Modal>
  )
}

export default TaxableItemsModal
