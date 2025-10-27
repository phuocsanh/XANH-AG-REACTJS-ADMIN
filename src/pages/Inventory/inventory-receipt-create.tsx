import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Card,
  Button,
  Form,
  Input,
  Table,
  Space,
  Typography,
  Alert,
  InputNumber,
  Select,
  Popconfirm,
  message,
  Divider,
} from "antd"
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  CheckOutlined,
  EditOutlined,
  CloseOutlined,
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"

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

  // Cấu hình cột cho bảng sản phẩm - tối ưu cho mobile
  const itemColumns: ColumnsType<InventoryReceiptItemForm> = [
    {
      title: "STT",
      key: "index",
      width: 40,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Sản phẩm",
      dataIndex: "productId",
      key: "productId",
      width: 120,
      render: (productId: number, record: InventoryReceiptItemForm) => {
        const isEditing = editingKey === record.key
        return isEditing ? (
          <Select
            value={productId || undefined}
            placeholder='Chọn'
            style={{ width: "100%" }}
            showSearch
            size='small'
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={products.map((product) => ({
              value: product.id,
              label: product.productName,
            }))}
            onChange={(value) =>
              handleItemChange(record.key, "productId", value)
            }
          />
        ) : (
          <div className='max-w-[100px] truncate text-sm'>
            {record.productName ||
              products.find((p) => p.id === productId)?.productName ||
              "-"}
          </div>
        )
      },
    },
    {
      title: "SL",
      dataIndex: "quantity",
      key: "quantity",
      width: 60,
      align: "right",
      render: (quantity: number, record: InventoryReceiptItemForm) => {
        const isEditing = editingKey === record.key
        return isEditing ? (
          <InputNumber
            value={quantity}
            min={1}
            size='small'
            style={{ width: "100%" }}
            onChange={(value) =>
              handleItemChange(record.key, "quantity", value || 1)
            }
          />
        ) : (
          <div className='truncate text-sm'>
            {new Intl.NumberFormat("vi-VN").format(quantity || 0)}
          </div>
        )
      },
    },
    {
      title: "Đơn giá",
      dataIndex: "unitCost",
      key: "unitCost",
      width: 90,
      align: "right",
      render: (price: number, record: InventoryReceiptItemForm) => {
        const isEditing = editingKey === record.key
        return isEditing ? (
          <InputNumber
            value={price || 0}
            min={0}
            step={1000}
            size='small'
            formatter={(value) =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
            parser={(value) =>
              parseFloat(value!.replace(/\$\s?|(,*)/g, "")) || 0
            }
            style={{ width: "100%" }}
            onChange={(value) =>
              handleItemChange(record.key, "unitCost", value || 0)
            }
          />
        ) : (
          <div className='truncate text-sm'>
            {new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(price || 0)}
          </div>
        )
      },
    },
    {
      title: "Thành tiền",
      dataIndex: "totalPrice",
      key: "totalPrice",
      width: 90,
      align: "right",
      render: (_, record: InventoryReceiptItemForm) => {
        return (
          <Text
            strong
            style={{ color: "#52c41a" }}
            className='truncate text-sm'
          >
            {new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(record.totalPrice || 0)}
          </Text>
        )
      },
    },
    {
      title: "Ghi chú",
      dataIndex: "notes",
      key: "notes",
      width: 80,
      render: (notes: string, record: InventoryReceiptItemForm) => {
        const isEditing = editingKey === record.key
        return isEditing ? (
          <Input
            value={notes}
            placeholder='Ghi chú'
            size='small'
            onChange={(e) =>
              handleItemChange(record.key, "notes", e.target.value)
            }
          />
        ) : (
          <div className='max-w-[70px] truncate text-sm'>{notes || "-"}</div>
        )
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 70,
      align: "center",
      render: (_, record: InventoryReceiptItemForm) => {
        const isEditing = editingKey === record.key

        if (isEditing) {
          return (
            <Space size='small'>
              <Button
                type='text'
                icon={<CheckOutlined />}
                onClick={() => handleSaveItem(record.key)}
                size='small'
              />
              <Button
                type='text'
                icon={<CloseOutlined />}
                onClick={handleCancelEdit}
                size='small'
              />
            </Space>
          )
        }

        return (
          <Space size='small'>
            <Button
              type='text'
              icon={<EditOutlined />}
              onClick={() => handleEditItem(record.key)}
              size='small'
            />
            <Popconfirm
              title='Xóa'
              description='Xóa?'
              onConfirm={() => handleDeleteItem(record.key)}
              okText='Xóa'
              cancelText='Hủy'
              placement='topRight'
            >
              <Button
                type='text'
                icon={<DeleteOutlined />}
                danger
                size='small'
              />
            </Popconfirm>
          </Space>
        )
      },
    },
  ]

  // Component cho hiển thị dạng card trên mobile
  const MobileItemCard = ({
    item,
    index,
  }: {
    item: InventoryReceiptItemForm
    index: number
  }) => {
    const isEditing = editingKey === item.key
    const productName =
      item.productName ||
      products.find((p) => p.id === item.productId)?.productName ||
      "-"

    if (isEditing) {
      return (
        <Card size='small' className='mb-2'>
          <div className='grid grid-cols-1 gap-2'>
            <div className='font-medium'>Sản phẩm #{index + 1}</div>

            <div>
              <div className='text-xs text-gray-500 mb-1'>Sản phẩm</div>
              <Select
                value={item.productId || undefined}
                placeholder='Chọn sản phẩm'
                style={{ width: "100%" }}
                showSearch
                size='small'
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={products.map((product) => ({
                  value: product.id,
                  label: product.productName,
                }))}
                onChange={(value) =>
                  handleItemChange(item.key, "productId", value)
                }
              />
            </div>

            <div className='grid grid-cols-2 gap-2'>
              <div>
                <div className='text-xs text-gray-500 mb-1'>Số lượng</div>
                <InputNumber
                  value={item.quantity}
                  min={1}
                  size='small'
                  style={{ width: "100%" }}
                  onChange={(value) =>
                    handleItemChange(item.key, "quantity", value || 1)
                  }
                />
              </div>

              <div>
                <div className='text-xs text-gray-500 mb-1'>Đơn giá</div>
                <InputNumber
                  value={item.unitCost || 0}
                  min={0}
                  step={1000}
                  size='small'
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) =>
                    parseFloat(value!.replace(/\$\s?|(,*)/g, "")) || 0
                  }
                  style={{ width: "100%" }}
                  onChange={(value) =>
                    handleItemChange(item.key, "unitCost", value || 0)
                  }
                />
              </div>
            </div>

            <div>
              <div className='text-xs text-gray-500 mb-1'>Ghi chú</div>
              <Input
                value={item.notes}
                placeholder='Ghi chú'
                size='small'
                onChange={(e) =>
                  handleItemChange(item.key, "notes", e.target.value)
                }
              />
            </div>

            <div className='flex justify-between items-center pt-2'>
              <Text strong className='text-green-500'>
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(item.totalPrice || 0)}
              </Text>
              <Space size='small'>
                <Button
                  type='primary'
                  icon={<CheckOutlined />}
                  onClick={() => handleSaveItem(item.key)}
                  size='small'
                />
                <Button
                  icon={<CloseOutlined />}
                  onClick={handleCancelEdit}
                  size='small'
                />
              </Space>
            </div>
          </div>
        </Card>
      )
    }

    return (
      <Card size='small' className='mb-2'>
        <div className='grid grid-cols-1 gap-2'>
          <div className='flex justify-between items-start'>
            <div className='font-medium'>
              #{index + 1}. {productName}
            </div>
            <Space size='small'>
              <Button
                type='text'
                icon={<EditOutlined />}
                onClick={() => handleEditItem(item.key)}
                size='small'
              />
              <Popconfirm
                title='Xóa'
                description='Xóa sản phẩm này?'
                onConfirm={() => handleDeleteItem(item.key)}
                okText='Xóa'
                cancelText='Hủy'
                placement='topRight'
              >
                <Button
                  type='text'
                  icon={<DeleteOutlined />}
                  danger
                  size='small'
                />
              </Popconfirm>
            </Space>
          </div>

          <div className='grid grid-cols-3 gap-2 text-sm'>
            <div>
              <div className='text-xs text-gray-500'>Số lượng</div>
              <div>
                {new Intl.NumberFormat("vi-VN").format(item.quantity || 0)}
              </div>
            </div>

            <div>
              <div className='text-xs text-gray-500'>Đơn giá</div>
              <div>
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(item.unitCost || 0)}
              </div>
            </div>

            <div>
              <div className='text-xs text-gray-500'>Thành tiền</div>
              <Text strong className='text-green-500'>
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(item.totalPrice || 0)}
              </Text>
            </div>
          </div>

          {item.notes && (
            <div>
              <div className='text-xs text-gray-500'>Ghi chú</div>
              <div>{item.notes}</div>
            </div>
          )}
        </div>
      </Card>
    )
  }

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
                <MobileItemCard key={item.key} item={item} index={index} />
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
