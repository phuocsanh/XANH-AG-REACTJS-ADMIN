// Form tạo phiếu điều chỉnh kho - Simplified

import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Table,
  InputNumber,
  message as antdMessage,
  Upload,
  UploadFile,
  UploadProps,
} from "antd"
import { PlusOutlined, DeleteOutlined, SaveOutlined, ArrowLeftOutlined, UploadOutlined } from "@ant-design/icons"
import NumberInput from "@/components/common/number-input"

import { CreateAdjustmentRequest, AdjustmentItem } from "@/models/inventory-adjustment.model"
import { useCreateAdjustmentMutation, useAttachImageToAdjustmentMutation } from "@/queries/inventory-adjustment"
import { useUploadFileMutation } from "@/queries/inventory"
import { useProductsQuery } from "@/queries/product"
import { useAppStore } from "@/stores"

const { Title } = Typography
const { TextArea } = Input

const AdjustmentCreate: React.FC = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const userInfo = useAppStore((state) => state.userInfo)

  const [items, setItems] = useState<AdjustmentItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null)
  const [quantityChange, setQuantityChange] = useState<number>(0)
  
  // State cho upload ảnh
  const [fileList, setFileList] = useState<UploadFile[]>([])

  const { data: productsData } = useProductsQuery({ limit: 1000 })
  const createAdjustmentMutation = useCreateAdjustmentMutation()
  const uploadFileMutation = useUploadFileMutation()
  const attachImageMutation = useAttachImageToAdjustmentMutation()

  const handleAddItem = () => {
    if (!selectedProduct) {
      antdMessage.error("Vui lòng chọn sản phẩm!")
      return
    }
    if (quantityChange === 0) {
      antdMessage.error("Số lượng thay đổi không được bằng 0!")
      return
    }

    const newItem: AdjustmentItem = {
      product_id: selectedProduct,
      quantity_change: quantityChange,
    }

    setItems([...items, newItem])
    setSelectedProduct(null)
    setQuantityChange(0)
  }

  // Xử lý thay đổi file upload
  const handleFileChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList)
  }

  const handleSubmit = async (values: any) => {
    if (items.length === 0) {
      antdMessage.error("Vui lòng thêm ít nhất 1 sản phẩm!")
      return
    }

    if (!userInfo?.id) {
      antdMessage.error("Không tìm thấy thông tin người dùng!")
      return
    }

    const adjustmentData: CreateAdjustmentRequest = {
      adjustment_code: values.adjustment_code,
      adjustment_type: values.adjustment_type,
      reason: values.reason,
      notes: values.notes,
      created_by: userInfo.id,
      items,
    }

    try {
      // 1. Tạo phiếu điều chỉnh
      const newAdjustment = await createAdjustmentMutation.mutateAsync(adjustmentData)
      
      // 2. Upload và gắn ảnh (nếu có)
      if (fileList.length > 0 && newAdjustment?.id) {
        const uploadPromises = fileList.map(async (file) => {
          if (file.originFileObj) {
            try {
              // Upload file lên server
              const uploadResult = await uploadFileMutation.mutateAsync(file.originFileObj)
              
              // Gắn file vào phiếu
              if (uploadResult?.data?.id) {
                await attachImageMutation.mutateAsync({
                  adjustmentId: newAdjustment.id,
                  fileId: uploadResult.data.id,
                  fieldName: 'adjustment_images',
                })
              }
            } catch (error) {
              console.error("Error uploading image:", error)
              antdMessage.error(`Lỗi upload ảnh: ${file.name}`)
            }
          }
        })
        
        await Promise.all(uploadPromises)
      }

      antdMessage.success("Tạo phiếu điều chỉnh thành công!")
      navigate("/inventory/adjustments")
    } catch (error) {
      console.error("Error creating adjustment:", error)
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
        <Title level={2}>Tạo phiếu điều chỉnh kho</Title>

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="adjustment_code"
                label="Mã phiếu"
                rules={[
                  { required: true, message: "Vui lòng nhập mã phiếu!" },
                  { pattern: /^ADJ-/, message: "Mã phiếu phải bắt đầu bằng ADJ-" },
                ]}
              >
                <Input placeholder="ADJ-2024-001" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="adjustment_type"
                label="Loại điều chỉnh"
                rules={[{ required: true, message: "Vui lòng chọn loại điều chỉnh!" }]}
              >
                <Select placeholder="Chọn loại điều chỉnh">
                  <Select.Option value="IN">Tăng kho</Select.Option>
                  <Select.Option value="OUT">Giảm kho</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="reason"
            label="Lý do điều chỉnh"
            rules={[{ required: true, message: "Vui lòng nhập lý do điều chỉnh!" }]}
          >
            <TextArea rows={3} placeholder="Kiểm kê, hàng hỏng, mất mát..." />
          </Form.Item>

          <Form.Item name="notes" label="Ghi chú">
            <TextArea rows={2} placeholder="Ghi chú thêm (nếu có)" />
          </Form.Item>

          {/* Upload ảnh */}
          <Card title="Hình ảnh chứng từ / Hiện trạng" style={{ marginBottom: "16px" }}>
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={handleFileChange}
              beforeUpload={() => false} // Prevent auto upload
              accept="image/*"
              multiple
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
              </div>
            </Upload>
          </Card>

          <Card title="Thêm sản phẩm" style={{ marginBottom: "16px" }}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Sản phẩm">
                  <Select
                    placeholder="Chọn sản phẩm"
                    value={selectedProduct}
                    onChange={setSelectedProduct}
                    showSearch
                    optionFilterProp="children"
                  >
                    {productsData?.data?.items?.map((product) => (
                      <Select.Option key={product.id} value={product.id}>
                        {product.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Số lượng thay đổi" help="Dương: tăng, Âm: giảm">
                  <NumberInput
                    value={quantityChange}
                    onChange={(val) => setQuantityChange(val || 0)}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={4}>
                <Form.Item label=" ">
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={handleAddItem}
                    block
                  >
                    Thêm
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="Danh sách sản phẩm" style={{ marginBottom: "16px" }}>
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
                    <span style={{ color: qty > 0 ? "green" : "red" }}>
                      {qty > 0 ? `+${qty}` : qty}
                    </span>
                  ),
                },
                {
                  title: "Thao tác",
                  width: 80,
                  align: "center",
                  render: (_, __, index) => (
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => setItems(items.filter((_, i) => i !== index))}
                    />
                  ),
                },
              ]}
              dataSource={items}
              rowKey={(_, index) => index!}
              pagination={false}
            />
          </Card>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={createAdjustmentMutation.isPending || uploadFileMutation.isPending || attachImageMutation.isPending}
              >
                Tạo phiếu điều chỉnh
              </Button>
              <Button onClick={() => navigate("/inventory/adjustments")}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default AdjustmentCreate
