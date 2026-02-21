import React, { useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Typography,
  Table,
  Tooltip,
} from "antd"
import {
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"

import { useProductMixturesQuery } from "@/queries/product-mixture"
import { LoadingSpinner } from "@/components/common"
import FilterHeader from '@/components/common/filter-header'

const { Title } = Typography

const InventoryMixturesList: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Lấy các giá trị từ URL
  const currentPage = Number(searchParams.get("page")) || 1
  const pageSize = Number(searchParams.get("limit")) || 10

  const { data: mixtures, isLoading, refetch } = useProductMixturesQuery()

  const handleTableChange = (pagination: any) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", String(pagination.current))
    params.set("limit", String(pagination.pageSize))
    setSearchParams(params)
  }

  const handleCreate = () => {
    navigate("/inventory/mixtures/create")
  }

  const columns: ColumnsType<any> = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      align: 'center',
      render: (_: any, __: any, index: number) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: 'Mã phiếu',
      dataIndex: "code",
      key: "code",
      width: 150,
      render: (code: string, record: any) => (
        <Button
          type='link'
          onClick={() => navigate(`/inventory/mixtures/${record.id}`)}
          style={{ padding: 0 }}
        >
          {code}
        </Button>
      ),
    },
    {
      title: "Sản phẩm thành phẩm",
      dataIndex: ["product", "name"],
      key: "product_name",
      width: 250,
      render: (name: string, record: any) => (
        <div>
          <div className="font-medium text-blue-600">{name}</div>
          <div className="text-xs text-gray-400">{record.product?.code}</div>
        </div>
      )
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      width: 120,
      align: "right",
      render: (qty: number, record: any) => (
        <span className="font-bold">
          {qty} {record.product?.unit?.name}
        </span>
      ),
    },
    {
      title: "Tổng chi phí",
      dataIndex: "totalCost",
      key: "totalCost",
      width: 150,
      align: "right",
      render: (amount: number) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(amount),
    },
    {
      title: "Ngày thực hiện",
      dataIndex: "mixtureDate",
      key: "mixtureDate",
      width: 150,
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Ghi chú",
      dataIndex: "notes",
      key: "notes",
      ellipsis: true,
      render: (notes: string) => notes || "-",
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 80,
      align: "center",
      render: (_, record: any) => (
        <Tooltip title='Xem chi tiết'>
          <Button
            type='text'
            icon={<EyeOutlined />}
            onClick={() => navigate(`/inventory/mixtures/${record.id}`)}
          />
        </Tooltip>
      ),
    },
  ]

  return (
    <div className="p-2 md:p-6">
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col span={24}>
          <Title level={4}>Quản lý Phối trộn sản phẩm</Title>
        </Col>
      </Row>

      <Card>
        <div style={{
          marginBottom: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}>
          <Title level={5} style={{ margin: 0 }}>Lịch sử phối trộn</Title>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
              loading={isLoading}
            >
              Làm mới
            </Button>
            <Button
              type='primary'
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Phối trộn mới
            </Button>
          </Space>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <Table
            columns={columns}
            dataSource={mixtures}
            rowKey='id'
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              showSizeChanger: true,
            }}
            onChange={handleTableChange}
            scroll={{ x: 1000 }}
          />
        )}
      </Card>
    </div>
  )
}

export default InventoryMixturesList
