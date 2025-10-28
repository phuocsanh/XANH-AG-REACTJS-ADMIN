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
import { useMobile, useTablet } from "@/hooks/use-media-query"
import { useProductSearch } from "@/queries/product"
import { useMemo } from "react"

const { Title, Text } = Typography
const { TextArea } = Input

const InventoryReceiptCreate: React.FC = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const isMobile = useMobile()
  const isTablet = useTablet()

  // State quản lý danh sách sản phẩm trong phiếu
  const [items, setItems] = useState<InventoryReceiptItemForm[]>([])
  const [editingKey, setEditingKey] = useState<string>("")

  // Sử dụng hook product search ở cấp cao hơn
  const {
    data,
    isLoading,
    isFetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useProductSearch("", 20, true)

  // Flatten data từ tất cả pages
  const productOptions = useMemo(() => {
    if (!data?.pages) {
      return []
    }

    return data.pages.flatMap((page) => {
      if (!page || !page.data) {
        return []
      }

      return page.data
    })
  }, [data?.pages])

  // Tạo object chứa tất cả props cho ComboBox
  const comboBoxProps = useMemo(
    () => ({
      data: productOptions,
      isLoading,
      isFetching,
      hasNextPage,
      isFetchingNextPage,
      fetchNextPage,
    }),
    [
      productOptions,
      isLoading,
      isFetching,
      hasNextPage,
      isFetchingNextPage,
      fetchNextPage,
    ]
  )

  // Queries
  const createReceiptMutation = useCreateInventoryReceiptMutation()

  // Handlers
  const handleBack = () => {
    navigate("/inventory/receipts")
  }

  const handleAddItem = () => {
    const newItem: InventoryReceiptItemForm = {
      key: Date.now().toString(),
      productId: 0,
      productName: "",
      quantity: 1,
      unitCost: 0,
      totalPrice: 0,
    }
    // Thêm sản phẩm mới vào đầu mảng thay vì cuối mảng
    setItems([newItem, ...items])
    setEditingKey(newItem.key)
  }

  const handleDeleteItem = (key: string) => {
    setItems(items.filter((item) => item.key !== key))
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

          // Tự động tính toán totalPrice khi quantity hoặc unitCost thay đổi
          if (field === "quantity" || field === "unitCost") {
            const quantity =
              field === "quantity" ? (value as number) : item.quantity
            const unitCost =
              field === "unitCost" ? (value as number) : item.unitCost
            updatedItem.totalPrice = quantity * unitCost
          }

          // Tự động cập nhật tên sản phẩm khi chọn sản phẩm
          if (field === "productId") {
            // Không cần tìm sản phẩm trong danh sách toàn cục nữa
            // Tên sản phẩm sẽ được cập nhật từ component ComboBox
          }

          return updatedItem
        }
        return item
      })
    )
  }

  const handleEditItem = (key: string) => {
    setEditingKey(key)
  }

  // Sử dụng hook để lấy cấu hình cột (phải đặt sau khi các hàm được định nghĩa)
  const itemColumns = useItemColumns({
    handleItemChange,
    handleDeleteItem,
    // Truyền props cho ComboBox theo cách mới
    comboBoxProps,
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
          item.quantity < 1 ||
          item.unitCost < 0
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
      message.error("Có lỗi xảy ra khi tạo phiếu nhập hàng")
    }
  }

  // Sử dụng card layout cho cả mobile và tablet
  const useCardLayout = isMobile || isTablet

  return (
    <div className='p-4'>
      <div className='mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2'>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          className='flex items-center'
        >
          Quay lại
        </Button>
        <Title level={4} className='m-0 text-lg sm:text-xl'>
          Tạo phiếu nhập hàng
        </Title>
      </div>

      <Card className='mb-4'>
        <Form form={form} layout='vertical' onFinish={handleSubmit}>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <Form.Item
              label='Tên nhà cung cấp'
              name='supplierName'
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập tên nhà cung cấp",
                },
              ]}
            >
              <Input placeholder='Nhập tên nhà cung cấp' />
            </Form.Item>

            <Form.Item
              label='Thông tin liên hệ'
              name='supplierContact'
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập thông tin liên hệ",
                },
              ]}
            >
              <Input placeholder='Nhập thông tin liên hệ' />
            </Form.Item>
          </div>

          <Form.Item label='Mô tả' name='description'>
            <TextArea
              placeholder='Nhập mô tả (nếu có)'
              autoSize={{ minRows: 2, maxRows: 6 }}
            />
          </Form.Item>

          <Divider className='my-4' />

          <div className='mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2'>
            <Text strong className='text-lg'>
              Danh sách sản phẩm
            </Text>
            <Button
              type='primary'
              icon={<PlusOutlined />}
              onClick={handleAddItem}
            >
              Thêm sản phẩm
            </Button>
          </div>

          {items.length === 0 ? (
            <Alert
              message='Chưa có sản phẩm nào'
              description='Vui lòng thêm sản phẩm vào phiếu nhập hàng'
              type='info'
              showIcon
              className='mb-4'
            />
          ) : useCardLayout ? (
            <div className='w-full'>
              {items.map((item, index) => (
                <MobileItemCard
                  key={item.key}
                  item={item}
                  index={index}
                  editingKey={editingKey}
                  handleItemChange={handleItemChange}
                  handleEditItem={handleEditItem}
                  handleDeleteItem={handleDeleteItem}
                  // Truyền props cho ComboBox theo cách mới
                  comboBoxProps={comboBoxProps}
                />
              ))}
            </div>
          ) : (
            <div className='overflow-x-auto w-full'>
              <Table
                dataSource={items}
                columns={itemColumns}
                pagination={false}
                rowKey='key'
                scroll={{ x: "max-content" }}
                className='min-w-full'
              />
            </div>
          )}

          {/* Hiển thị tổng tiền */}
          <div className='mt-4 p-4 bg-gray-50 rounded-lg'>
            <div className='flex justify-between items-center'>
              <Text strong className='text-lg'>
                Tổng tiền:
              </Text>
              <Text strong className='text-lg' style={{ color: "#52c41a" }}>
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(
                  items.reduce((sum, item) => sum + item.totalPrice, 0)
                )}
              </Text>
            </div>
          </div>

          <div className='mt-6 flex justify-end'>
            <Button
              type='primary'
              htmlType='submit'
              icon={<SaveOutlined />}
              loading={createReceiptMutation.isPending}
              size='large'
            >
              Tạo phiếu nhập hàng
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default InventoryReceiptCreate
