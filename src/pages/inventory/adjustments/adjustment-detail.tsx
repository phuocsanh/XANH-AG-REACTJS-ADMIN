// Chi tiết phiếu điều chỉnh kho - Simplified

import React, { useState } from "react"
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
  Image,
  Upload,
  message as antdMessage,
} from "antd"
import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  PlusOutlined,
  XOutlined,
} from "@ant-design/icons"
import dayjs from "dayjs"

import {
  useAdjustmentQuery,
  useApproveAdjustmentMutation,
  useCompleteAdjustmentMutation,
  useCancelAdjustmentMutation,
  useDeleteAdjustmentMutation,
  useAdjustmentImagesQuery,
  useAttachImageToAdjustmentMutation,
  useDeleteAdjustmentImageMutation,
} from "@/queries/inventory-adjustment"
import { useUploadFileMutation } from "@/queries/inventory"
import { useProductsQuery } from "@/queries/product"
import { LoadingSpinner } from "@/components/common"

const { Title, Text } = Typography

const AdjustmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [uploading, setUploading] = useState(false)

  const { data: adjustmentData, isLoading } = useAdjustmentQuery(Number(id))
  const { data: productsData } = useProductsQuery({ limit: 1000 })
  const { data: images } = useAdjustmentImagesQuery(Number(id))

  const approveAdjustmentMutation = useApproveAdjustmentMutation()
  const completeAdjustmentMutation = useCompleteAdjustmentMutation()
  const cancelAdjustmentMutation = useCancelAdjustmentMutation()
  const deleteAdjustmentMutation = useDeleteAdjustmentMutation()
  
  const uploadFileMutation = useUploadFileMutation()
  const attachImageMutation = useAttachImageToAdjustmentMutation()
  const deleteImageMutation = useDeleteAdjustmentImageMutation()

  if (isLoading) return <LoadingSpinner />
  if (!adjustmentData) return <Card><Text type="danger">Không tìm thấy phiếu điều chỉnh!</Text></Card>

  const renderStatus = (status: string) => {
    const statusConfig: Record<string, { color: string }> = {
      "Nháp": { color: "default" },
      "Đã duyệt": { color: "success" },
      "Hoàn thành": { color: "success" },
      "Đã hủy": { color: "error" },
    }
    const config = statusConfig[status] || { color: "default" }
    return <Tag color={config.color}>{status}</Tag>
  }

  const handleUpload = async (file: File) => {
    try {
      setUploading(true)
      // 1. Upload file lên server
      const uploadResult = await uploadFileMutation.mutateAsync(file)
      
      // 2. Gắn file vào phiếu
      if (uploadResult?.data?.id) {
        await attachImageMutation.mutateAsync({
          adjustmentId: Number(id),
          fileId: uploadResult.data.id,
          fieldName: 'adjustment_images',
        })
      }
      antdMessage.success('Upload ảnh thành công!')
    } catch (error) {
      console.error("Error uploading image:", error)
      antdMessage.error('Upload ảnh thất bại!')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteImage = async (fileId: number) => {
    try {
      await deleteImageMutation.mutateAsync({
        adjustmentId: Number(id),
        fileId,
      })
      antdMessage.success('Xóa ảnh thành công!')
    } catch (error) {
      console.error("Error deleting image:", error)
      antdMessage.error('Xóa ảnh thất bại!')
    }
  }

  return (
    <div style={{ padding: "24px" }}>
      <Card>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/inventory/adjustments")}
          style={{ marginBottom: "16px" }}
        >
          Quay lại
        </Button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <Title level={2}>Chi tiết phiếu điều chỉnh</Title>
          <Space>
            {adjustmentData.status === "Nháp" && (
              <Popconfirm
                title="Duyệt phiếu"
                onConfirm={() => approveAdjustmentMutation.mutateAsync(Number(id))}
                okText="Duyệt"
                cancelText="Hủy"
              >
                <Button type="primary" icon={<CheckOutlined />}>Duyệt</Button>
              </Popconfirm>
            )}
            {adjustmentData.status === "Đã duyệt" && (
              <Popconfirm
                title="Hoàn thành điều chỉnh"
                description="Tồn kho sẽ được cập nhật."
                onConfirm={() => completeAdjustmentMutation.mutateAsync(Number(id))}
                okText="Hoàn thành"
                cancelText="Hủy"
              >
                <Button type="primary" icon={<CheckOutlined />}>Hoàn thành</Button>
              </Popconfirm>
            )}
            {(adjustmentData.status === "Nháp" || adjustmentData.status === "Đã duyệt") && (
              <Popconfirm
                title="Hủy phiếu"
                onConfirm={() => cancelAdjustmentMutation.mutateAsync({ id: Number(id), reason: "Hủy bởi người dùng" })}
                okText="Hủy phiếu"
                cancelText="Không"
              >
                <Button danger icon={<CloseOutlined />}>Hủy phiếu</Button>
              </Popconfirm>
            )}
            {(adjustmentData.status === "Nháp" || adjustmentData.status === "Đã hủy") && (
              <Popconfirm
                title="Xóa phiếu"
                onConfirm={async () => {
                  await deleteAdjustmentMutation.mutateAsync(Number(id))
                  navigate("/inventory/adjustments")
                }}
                okText="Xóa"
                cancelText="Hủy"
              >
                <Button danger icon={<DeleteOutlined />}>Xóa</Button>
              </Popconfirm>
            )}
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card title="Thông tin phiếu" style={{ marginBottom: "16px" }}>
              <Descriptions column={2} bordered>
                <Descriptions.Item label="Mã phiếu" span={2}>
                  <Text strong>{adjustmentData.code}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Loại điều chỉnh" span={2}>
                  <Tag color={adjustmentData.adjustment_type === "IN" ? "green" : "red"}>
                    {adjustmentData.adjustment_type === "IN" ? "Tăng kho" : "Giảm kho"}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái" span={2}>
                  {renderStatus(adjustmentData.status)}
                </Descriptions.Item>
                <Descriptions.Item label="Lý do" span={2}>
                  {adjustmentData.reason}
                </Descriptions.Item>
                {adjustmentData.notes && (
                  <Descriptions.Item label="Ghi chú" span={2}>
                    {adjustmentData.notes}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Ngày tạo">
                  {dayjs(adjustmentData.created_at).format("DD/MM/YYYY HH:mm")}
                </Descriptions.Item>
                {adjustmentData.completed_at && (
                  <Descriptions.Item label="Ngày hoàn thành">
                    {dayjs(adjustmentData.completed_at).format("DD/MM/YYYY HH:mm")}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            {/* Phần hiển thị ảnh */}
            <Card title="Hình ảnh chứng từ / Hiện trạng" style={{ marginBottom: "16px" }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                <Upload
                  listType="picture-card"
                  showUploadList={false}
                  beforeUpload={(file) => {
                    handleUpload(file)
                    return false
                  }}
                  disabled={uploading}
                >
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>{uploading ? 'Đang tải...' : 'Tải ảnh'}</div>
                  </div>
                </Upload>
                
                {images?.map((image) => (
                  <div key={image.id} style={{ position: 'relative', width: 104, height: 104 }}>
                    <Image
                      src={image.url}
                      alt={image.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                    />
                    <Button
                      type="primary"
                      danger
                      size="small"
                      icon={<XOutlined />}
                      style={{ 
                        position: 'absolute', 
                        top: -8, 
                        right: -8, 
                        borderRadius: '50%', 
                        width: 20, 
                        height: 20, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        padding: 0
                      }}
                      onClick={() => handleDeleteImage(image.id)}
                    />
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Danh sách sản phẩm">
              <Table
                columns={[
                  { title: "STT", render: (_, __, index) => index + 1, width: 60 },
                  {
                    title: "Sản phẩm",
                    dataIndex: "product_id",
                    render: (id: number) => {
                      const product = productsData?.data?.items?.find((p) => p.id === id)
                      return product?.name || `Sản phẩm #${id}`
                    },
                  },
                  {
                    title: "Số lượng thay đổi",
                    dataIndex: "quantity_change",
                    width: 150,
                    align: "right",
                    render: (qty: number) => (
                      <span style={{ color: qty > 0 ? "green" : "red", fontWeight: "bold" }}>
                        {qty > 0 ? `+${qty}` : qty}
                      </span>
                    ),
                  },
                ]}
                dataSource={adjustmentData.items || []}
                rowKey="product_id"
                pagination={false}
              />
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="Lịch sử trạng thái">
              <Timeline>
                <Timeline.Item color="blue">
                  <Text strong>Tạo phiếu</Text>
                  <br />
                  <Text type="secondary">
                    {dayjs(adjustmentData.created_at).format("DD/MM/YYYY HH:mm")}
                  </Text>
                </Timeline.Item>
                {adjustmentData.approved_at && (
                  <Timeline.Item color="green">
                  <Text strong>Đã duyệt</Text>
                    <br />
                    <Text type="secondary">
                      {dayjs(adjustmentData.approved_at).format("DD/MM/YYYY HH:mm")}
                    </Text>
                  </Timeline.Item>
                )}
                {adjustmentData.completed_at && (
                  <Timeline.Item color="green">
                    <Text strong>Hoàn thành</Text>
                    <br />
                    <Text type="secondary">
                      {dayjs(adjustmentData.completed_at).format("DD/MM/YYYY HH:mm")}
                    </Text>
                  </Timeline.Item>
                )}
                {adjustmentData.cancelled_at && (
                  <Timeline.Item color="red">
                    <Text strong>Đã hủy</Text>
                    <br />
                    <Text type="secondary">
                      {dayjs(adjustmentData.cancelled_at).format("DD/MM/YYYY HH:mm")}
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

export default AdjustmentDetail
