import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Card,
  Button,
  Form,
  Input,
  Table,
  Typography,
  Alert,
  message,
  Divider,
} from "antd"
import {
  ArrowLeftOutlined,
  PlusOutlined,
  SaveOutlined,
} from "@ant-design/icons"

// Import MobileItemCard từ components
import MobileItemCard from "./components/receipt-create/mobile-item-card"
// Import itemColumns từ components
import useItemColumns from "./components/receipt-create/item-columns"

import {
  CreateInventoryReceiptRequest,
  InventoryReceiptItemForm,
} from "@/models/inventory.model"
import { useCreateInventoryReceiptMutation } from "@/queries/inventory"
import { useProductsQuery } from "@/queries/product"
import { useMobile } from "@/hooks/use-media-query"

const { Title, Text } = Typography
const { TextArea } = Input

const InventoryReceiptCreate: React.FC = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const isMobile = useMobile()

  // State quản lý danh sách sản phẩm trong phiếu
  const [items, setItems] = useState<InventoryReceiptItemForm[]>([])
  const [editingKey, setEditingKey] = useState<string>("")

  // Queries
  const { data: productsData } = useProductsQuery()
  const createReceiptMutation = useCreateInventoryReceiptMutation()

  // Lấy danh sách sản phẩm để hiển thị trong select
  const products = productsData || []

  // Handlers
  const handleBack = () => {
    navigate("/inventory/receipts")
  }

  const handleAddItem = () => {
    const newKey = Date.now().toString()
    const newItem: InventoryReceiptItemForm = {
      key: newKey,
      productId: 0,
      quantity: 1,
      unitCost: 0,
      totalPrice: 0,
      notes: "",
    }
    setItems([...items, newItem])
    setEditingKey(newKey)
  }

  const handleDeleteItem = (key: string) => {
    setItems(items.filter((item) => item.key !== key))
    if (editingKey === key) {
      setEditingKey("")
    }
  }

  const handleEditItem = (key: string) => {
    setEditingKey(key)
  }

  const handleSaveItem = (key: string) => {
    const item = items.find((item) => item.key === key)
    if (!item) return

    // Validate item
    if (!item.productId || item.productId === 0) {
      message.error("Vui lòng chọn sản phẩm")
      return
    }
    if (!item.quantity || item.quantity <= 0) {
      message.error("Vui lòng nhập số lượng hợp lệ")
      return
    }
    if (!item.unitCost || item.unitCost <= 0) {
      message.error("Vui lòng nhập đơn giá hợp lệ")
      return
    }

    // Calculate total price
    const totalPrice = item.quantity * item.unitCost
    const updatedItem = { ...item, totalPrice }

    setItems(items.map((i) => (i.key === key ? updatedItem : i)))
    setEditingKey("")
  }

  const handleCancelEdit = () => {
    setEditingKey("")
  }

  const handleItemChange = (
    key: string,
    field: keyof InventoryReceiptItemForm,
    value: unknown
  ) => {
    setItems(
      items.map((item) => {
        if (item.key === key) {
          const updatedItem = { ...item, [field]: value }

          // Tự động tính tổng tiền khi thay đổi số lượng hoặc đơn giá
          if (field === "quantity" || field === "unitCost") {
            const quantity =
              field === "quantity" ? (value as number) : item.quantity
            const unitCost =
              field === "unitCost" ? (value as number) : item.unitCost
            updatedItem.totalPrice = quantity * unitCost
          }

          // Tự động cập nhật tên sản phẩm khi chọn sản phẩm
          if (field === "productId") {
            const product = products.find((p) => p.id === value)
            if (product) {
              updatedItem.productName = product.productName
            }
          }

          return updatedItem
        }
        return item
      })
    )
  }

  // Sử dụng hook để lấy cấu hình cột (phải đặt sau khi các hàm được định nghĩa)
  const itemColumns = useItemColumns({
    products,
    editingKey,
    handleItemChange,
    handleSaveItem,
    handleCancelEdit,
    handleEditItem,
    handleDeleteItem,
  })

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      // Validate có ít nhất 1 sản phẩm
      if (items.length === 0) {
        message.error("Vui lòng thêm ít nhất một sản phẩm")
        return
      }

      // Validate tất cả items đã hoàn thành
      const hasIncompleteItems = items.some(
        (item) =>
          !item.productId ||
          item.productId === 0 ||
          !item.quantity ||
          item.quantity <= 0 ||
          !item.unitCost ||
          item.unitCost <= 0
      )

      if (hasIncompleteItems) {
        message.error("Vui lòng hoàn thành thông tin tất cả sản phẩm")
        return
      }

      // Tạo mã phiếu nhập tự động
      const receiptCode = `PN${Date.now()}`

      // Tính tổng tiền
      const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0)

      // Tạo request data theo đúng cấu trúc backend
      const requestData: CreateInventoryReceiptRequest = {
        receiptCode,
        supplierName: values.supplierName as string | undefined,
        supplierContact: values.supplierContact as string | undefined,
        totalAmount,
        notes: values.description as string | undefined,
        status: "PENDING",
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          totalPrice: item.totalPrice,
          notes: item.notes || undefined,
        })),
      }

      await createReceiptMutation.mutateAsync(requestData)
      message.success("Tạo phiếu nhập hàng thành công!")
      navigate("/inventory/receipts")
    } catch (error) {
      console.error("Error creating receipt:", error)
    }
  }

  // Tính tổng tiền của tất cả sản phẩm
  const totalAmount = items.reduce((sum, item) => {
    return sum + item.totalPrice
  }, 0)

  return (
    <div className='p-4 md:p-6'>
      {/* Header */}
      <Card className='mb-4'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div className='flex items-center gap-2 sm:gap-4'>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              size='small'
            />
            <Title level={3} className='!m-0 !text-lg sm:!text-xl'>
              Tạo phiếu nhập hàng mới
            </Title>
          </div>
        </div>
      </Card>

      <Form form={form} layout='vertical' onFinish={handleSubmit}>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Thông tin chung */}
          <div>
            <Card title='Thông tin phiếu nhập' size='small'>
              <Form.Item
                label='Nhà cung cấp'
                name='supplierName'
                rules={[
                  { required: true, message: "Vui lòng nhập tên nhà cung cấp" },
                ]}
              >
                <Input placeholder='Nhập tên nhà cung cấp' />
              </Form.Item>

              <Form.Item label='Liên hệ nhà cung cấp' name='supplierContact'>
                <Input placeholder='Số điện thoại hoặc email' />
              </Form.Item>

              <Form.Item label='Mô tả' name='description'>
                <TextArea
                  rows={4}
                  placeholder='Mô tả chi tiết về phiếu nhập hàng'
                />
              </Form.Item>
            </Card>
          </div>

          {/* Tổng quan */}
          <div>
            <Card title='Tổng quan' size='small'>
              <div className='py-4'>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div>
                    <Text type='secondary'>Số lượng sản phẩm:</Text>
                    <br />
                    <Text strong className='text-lg'>
                      {items.length}
                    </Text>
                  </div>
                  <div>
                    <Text type='secondary'>Tổng tiền:</Text>
                    <br />
                    <Text strong className='text-lg text-green-500'>
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(totalAmount)}
                    </Text>
                  </div>
                </div>

                <Alert
                  message='Lưu ý'
                  description="Phiếu nhập hàng sau khi tạo sẽ ở trạng thái 'Nháp'. Bạn có thể chỉnh sửa và gửi duyệt sau."
                  type='info'
                  showIcon
                  className='mt-4'
                />
              </div>
            </Card>
          </div>
        </div>

        <Divider />

        {/* Danh sách sản phẩm */}
        <Card
          title='Danh sách sản phẩm'
          extra={
            <Button
              type='dashed'
              icon={<PlusOutlined />}
              onClick={handleAddItem}
              className='w-full sm:w-auto whitespace-nowrap'
            >
              {isMobile ? "" : "Thêm sản phẩm"}
            </Button>
          }
        >
          {items.length === 0 ? (
            <div className='py-10 text-center'>
              <Text type='secondary'>
                Chưa có sản phẩm nào. Nhấn &quot;Thêm sản phẩm&quot; để bắt đầu.
              </Text>
            </div>
          ) : isMobile ? (
            // Hiển thị dạng card trên mobile
            <div>
              {items.map((item, index) => (
                <MobileItemCard
                  key={item.key}
                  item={item}
                  index={index}
                  products={products}
                  editingKey={editingKey}
                  handleItemChange={handleItemChange}
                  handleSaveItem={handleSaveItem}
                  handleCancelEdit={handleCancelEdit}
                  handleEditItem={handleEditItem}
                  handleDeleteItem={handleDeleteItem}
                />
              ))}
              <div className='mt-4 p-4 bg-gray-50 rounded-lg text-right'>
                <Text strong className='text-base'>
                  Tổng cộng:{" "}
                  <span className='text-green-500 text-lg'>
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(totalAmount)}
                  </span>
                </Text>
              </div>
            </div>
          ) : (
            // Hiển thị dạng bảng trên desktop
            <div>
              <div className='overflow-x-auto'>
                <Table
                  columns={itemColumns}
                  dataSource={items}
                  rowKey='key'
                  pagination={false}
                  size='small'
                  locale={{
                    emptyText: (
                      <div className='py-10 text-center'>
                        <Text type='secondary'>
                          Chưa có sản phẩm nào. Nhấn &quot;Thêm sản phẩm&quot;
                          để bắt đầu.
                        </Text>
                      </div>
                    ),
                  }}
                />
              </div>
              <div className='mt-4 p-4 bg-gray-50 rounded-lg text-right'>
                <Text strong className='text-base'>
                  Tổng cộng:{" "}
                  <span className='text-green-500 text-lg'>
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(totalAmount)}
                  </span>
                </Text>
              </div>
            </div>
          )}
        </Card>

        {/* Nút submit */}
        <Card className='mt-4'>
          <div className='flex flex-col sm:flex-row sm:justify-end gap-2'>
            <Button onClick={handleBack} className='w-full sm:w-auto'>
              Hủy
            </Button>
            <Button
              type='primary'
              htmlType='submit'
              icon={<SaveOutlined />}
              loading={createReceiptMutation.isPending}
              disabled={items.length === 0}
              className='w-full sm:w-auto'
            >
              Tạo phiếu nhập
            </Button>
          </div>
        </Card>
      </Form>
    </div>
  )
}

export default InventoryReceiptCreate
