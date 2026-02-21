import React from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  Card,
  Button,
  Typography,
  Row,
  Col,
  Space,
  Table,
  Tag,
  Descriptions,
  Divider,
} from "antd"
import {
  ArrowLeftOutlined,
  PrinterOutlined,
} from "@ant-design/icons"
import dayjs from "dayjs"

import { useProductMixtureDetailQuery } from "@/queries/product-mixture"
import { LoadingSpinner } from "@/components/common"

const { Title, Text } = Typography

const InventoryMixtureDetail: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { data: mixture, isLoading } = useProductMixtureDetailQuery(id || "")

  if (isLoading) return <LoadingSpinner />
  if (!mixture) return <Card>Không tìm thấy dữ liệu phối trộn.</Card>

  const columns = [
    {
      title: 'Nguyên liệu',
      dataIndex: ['product', 'name'],
      key: 'name',
      render: (name: string, record: any) => (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-xs text-gray-400">{record.product?.code}</div>
        </div>
      )
    },
    {
      title: 'Số lượng dùng',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right' as const,
      render: (qty: number, record: any) => `${qty} ${record.product?.unit?.name}`,
    },
    {
      title: 'Giá vốn tại lúc trộn',
      dataIndex: 'unitCost',
      key: 'unitCost',
      align: 'right' as const,
      render: (amount: number) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(amount),
    },
    {
      title: 'Thành tiền',
      dataIndex: 'totalCost',
      key: 'totalCost',
      align: 'right' as const,
      render: (amount: number) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(amount),
    }
  ]

  return (
    <div className="p-2 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate("/inventory/mixtures")}
          >
            Quay lại
          </Button>
          <Title level={4} style={{ margin: 0 }}>Chi tiết Lệnh Phối trộn: {mixture.code}</Title>
        </Space>
        <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
          In lệnh
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="Thông tin chung">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Mã lệnh">
                <Text strong>{mixture.code}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Thành phẩm">
                <Text strong className="text-blue-600">{mixture.product?.name}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Số lượng">
                <Text strong>{mixture.quantity} {mixture.product?.unit?.name}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày thực hiện">
                {dayjs(mixture.mixtureDate).format("DD/MM/YYYY HH:mm")}
              </Descriptions.Item>
              <Descriptions.Item label="Người lập">
                {mixture.creator?.full_name || mixture.creator?.username}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng chi phí">
                <Text strong type="danger">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(mixture.totalCost)}
                </Text>
              </Descriptions.Item>
            </Descriptions>
            {mixture.notes && (
              <div className="mt-4 p-3 bg-gray-50 rounded italic border-l-4 border-gray-300">
                Ghi chú: {mixture.notes}
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title="Chi tiết nguyên liệu đã sử dụng">
            <Table
              columns={columns}
              dataSource={mixture.items}
              rowKey="id"
              pagination={false}
              summary={(pageData: readonly any[]) => {
                let total = 0
                pageData.forEach((item) => {
                  total += Number(item.totalCost || 0)
                })
                return (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3}>
                      <Text strong>Tổng cộng giá vốn nguyên liệu</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Text strong type="danger">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(total)}
                      </Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default InventoryMixtureDetail
