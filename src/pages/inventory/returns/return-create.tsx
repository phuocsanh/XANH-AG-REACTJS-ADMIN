// Form tạo phiếu trả hàng

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
  message as antdMessage,
  Upload,
  UploadFile,
  UploadProps,
} from "antd"
import { PlusOutlined, DeleteOutlined, SaveOutlined, ArrowLeftOutlined, UploadOutlined } from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import NumberInput from "@/components/common/number-input"

import { CreateReturnRequest, ReturnItem } from "@/models/inventory-return.model"
import { useCreateReturnMutation, useAttachImageToReturnMutation } from "@/queries/inventory-return"
import { useUploadFileMutation } from "@/queries/inventory"
import { useSuppliersQuery } from "@/queries/supplier"
import { useProductsQuery } from "@/queries/product"
import { useAppStore } from "@/stores"

const { Title, Text } = Typography
const { TextArea } = Input

const ReturnCreate: React.FC = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const userInfo = useAppStore((state) => state.userInfo)

  // State cho items
  const [items, setItems] = useState<ReturnItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null)
  const [quantity, setQuantity] = useState<number>(1)
  const [unitCost, setUnitCost] = useState<number>(0)
  const [itemReason, setItemReason] = useState<string>("")
  const [itemNotes, setItemNotes] = useState<string>("")

  // State cho upload ảnh
  const [fileList, setFileList] = useState<UploadFile[]>([])

  // Queries
  const { data: suppliersData } = useSuppliersQuery({ limit: 1000 })
  const { data: productsData } = useProductsQuery({ limit: 1000 })
  const createReturnMutation = useCreateReturnMutation()
  const uploadFileMutation = useUploadFileMutation()
  const attachImageMutation = useAttachImageToReturnMutation()

  // Tính tổng tiền
  const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0)

  // Thêm item vào danh sách
  const handleAddItem = () => {
    if (!selectedProduct) {
      antdMessage.error("Vui lòng chọn sản phẩm!")
      return
    }
    if (quantity <= 0) {
      antdMessage.error("Số lượng phải lớn hơn 0!")
      return
    }
    if (unitCost <= 0) {
      antdMessage.error("Đơn giá phải lớn hơn 0!")
      return
    }

    const newItem: ReturnItem = {
      product_id: selectedProduct,
      quantity,
      unit_cost: unitCost,
      total_price: quantity * unitCost,
      reason: itemReason,
      notes: itemNotes,
    }

    setItems([...items, newItem])
    
    // Reset form
    setSelectedProduct(null)
    setQuantity(1)
    setUnitCost(0)
    setItemReason("")
    setItemNotes("")
  }

  // Xóa item
  const handleDeleteItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  // Xử lý thay đổi file upload
  const handleFileChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList)
  }

  // Submit form
  const handleSubmit = async (values: any) => {
    if (items.length === 0) {
      antdMessage.error("Vui lòng thêm ít nhất 1 sản phẩm!")
      return
    }

    if (!userInfo?.id) {
      antdMessage.error("Không tìm thấy thông tin người dùng!")
      return
    }

    const returnData: CreateReturnRequest = {
      return_code: values.return_code,
      supplier_id: values.supplier_id,
      total_amount: totalAmount,
      reason: values.reason,
      notes: values.notes,
      created_by: userInfo.id,
      items,
    }

    try {
      // 1. Tạo phiếu trả hàng
      const newReturn = await createReturnMutation.mutateAsync(returnData)
      
      // 2. Upload và gắn ảnh (nếu có)
      if (fileList.length > 0 && newReturn?.id) {
        const uploadPromises = fileList.map(async (file) => {
          if (file.originFileObj) {
            try {
              // Upload file lên server
              const uploadResult = await uploadFileMutation.mutateAsync(file.originFileObj)
              
              // Gắn file vào phiếu
              if ((uploadResult as any)?.data?.id) {
                await attachImageMutation.mutateAsync({
                  returnId: newReturn.id,
                  fileId: (uploadResult as any).data.id,
                  fieldName: 'return_images',
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

      antdMessage.success("Tạo phiếu trả hàng thành công!")
      navigate("/inventory/returns")
    } catch (error) {
      console.error("Error creating return:", error)
      // Lỗi đã được handle trong mutation onError
    }
  }

  // Columns cho bảng items
  const itemColumns: ColumnsType<ReturnItem & { index: number }> = [
    {
      title: "STT",
      dataIndex: "index",
      key: "index",
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Sản phẩm",
      dataIndex: "product_id",
      key: "product_id",
      render: (productId: number) => {
        const product = productsData?.data?.items?.find((p) => p.id === productId)
        return product?.name || `Sản phẩm #${productId}`
      },
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      align: "right",
    },
    {
      title: "Đơn giá",
      dataIndex: "unit_cost",
      key: "unit_cost",
      width: 120,
      align: "right",
      render: (cost: number) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(cost),
    },
    {
      title: "Thành tiền",
      dataIndex: "total_price",
      key: "total_price",
      width: 120,
      align: "right",
      render: (price: number) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(price),
    },
    {
      title: "Lý do",
      dataIndex: "reason",
      key: "reason",
      ellipsis: true,
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 80,
      align: "center",
      render: (_, __, index) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteItem(index)}
        />
      ),
    },
  ]

  return (
    <div style={{ padding: "24px" }}>
      <Card>
        <div style={{ marginBottom: "24px" }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/inventory/returns")}
            style={{ marginBottom: "16px" }}
          >
            Quay lại
          </Button>
          <Title level={2}>Tạo phiếu trả hàng</Title>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="return_code"
                label="Mã phiếu"
                rules={[
                  { required: true, message: "Vui lòng nhập mã phiếu!" },
                  { pattern: /^RT-/, message: "Mã phiếu phải bắt đầu bằng RT-" },
                ]}
              >
                <Input placeholder="RT-2024-001" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="supplier_id"
                label="Nhà cung cấp"
                rules={[{ required: true, message: "Vui lòng chọn nhà cung cấp!" }]}
              >
                <Select
                  placeholder="Chọn nhà cung cấp"
                  showSearch
                  optionFilterProp="children"
                >
                  {suppliersData?.data?.items?.map((supplier) => (
                    <Select.Option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="reason"
            label="Lý do trả hàng"
            rules={[
              { required: true, message: "Vui lòng nhập lý do trả hàng!" },
              { min: 10, message: "Lý do phải có ít nhất 10 ký tự!" },
            ]}
          >
            <TextArea
              rows={3}
              placeholder="Hàng bị lỗi, không đúng quy cách..."
            />
          </Form.Item>

          <Form.Item name="notes" label="Ghi chú">
            <TextArea rows={2} placeholder="Ghi chú thêm (nếu có)" />
          </Form.Item>

          {/* Upload ảnh */}
          <Card title="Hình ảnh chứng từ / Hàng lỗi" style={{ marginBottom: "16px" }}>
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

          {/* Thêm sản phẩm */}
          <Card title="Thêm sản phẩm" style={{ marginBottom: "16px" }}>
            <Row gutter={16}>
              <Col xs={24} md={8}>
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
              <Col xs={12} md={4}>
                <Form.Item label="Số lượng">
                  <NumberInput
                    min={1}
                    value={quantity}
                    onChange={(val) => setQuantity(val || 1)}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
              <Col xs={12} md={4}>
                <Form.Item label="Đơn giá">
                  <NumberInput
                    min={0}
                    value={unitCost}
                    onChange={(val) => setUnitCost(val || 0)}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Lý do">
                  <Input
                    value={itemReason}
                    onChange={(e) => setItemReason(e.target.value)}
                    placeholder="Lý do trả sản phẩm này"
                  />
                </Form.Item>
              </Col>
            </Row>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={handleAddItem}
              block
            >
              Thêm sản phẩm
            </Button>
          </Card>

          {/* Danh sách sản phẩm */}
          <Card title="Danh sách sản phẩm" style={{ marginBottom: "16px" }}>
            <Table
              columns={itemColumns}
              dataSource={items.map((item, index) => ({ ...item, index }))}
              rowKey="index"
              pagination={false}
              scroll={{ x: 800 }}
              summary={() => (
                <Table.Summary>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={4} align="right">
                      <Text strong>Tổng cộng:</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Text strong style={{ color: "#1890ff", fontSize: "16px" }}>
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(totalAmount)}
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} colSpan={2} />
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </Card>

          {/* Buttons */}
          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={createReturnMutation.isPending || uploadFileMutation.isPending || attachImageMutation.isPending}
              >
                Tạo phiếu trả hàng
              </Button>
              <Button onClick={() => navigate("/inventory/returns")}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default ReturnCreate
