import React from "react"
import { Card, Input, Button, Space, Typography, Popconfirm } from "antd"
import {
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons"
import NumberInput from "@/components/common/number-input"
import ComboBox from "@/components/common/combo-box"
import { Product } from "@/models/product.model"
import { InventoryReceiptItemForm } from "@/models/inventory.model"
import { searchProducts } from "@/api/product-api"

const { Text } = Typography

interface MobileItemCardProps {
  item: InventoryReceiptItemForm
  index: number
  products: Product[]
  editingKey: string
  handleItemChange: (
    key: string,
    field: keyof InventoryReceiptItemForm,
    value: unknown
  ) => void
  handleSaveItem: (key: string) => void
  handleCancelEdit: () => void
  handleEditItem: (key: string) => void
  handleDeleteItem: (key: string) => void
}

const MobileItemCard: React.FC<MobileItemCardProps> = ({
  item,
  index,
  products,
  editingKey,
  handleItemChange,
  handleSaveItem,
  handleCancelEdit,
  handleEditItem,
  handleDeleteItem,
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
            <ComboBox
              value={item.productId || undefined}
              placeholder='Chọn sản phẩm'
              apiFunction={searchProducts}
              queryKey={["products", "search"]}
              pageSize={20}
              showSearch={true}
              filterOption={false}
              onChange={(value) =>
                handleItemChange(item.key, "productId", value)
              }
            />
          </div>

          <div className='grid grid-cols-2 gap-2'>
            <div>
              <div className='text-xs text-gray-500 mb-1'>Số lượng</div>
              <NumberInput
                value={item.quantity}
                min={1}
                size='small'
                placeholder='Số lượng'
                onChange={(value) =>
                  handleItemChange(item.key, "quantity", value || 1)
                }
              />
            </div>

            <div>
              <div className='text-xs text-gray-500 mb-1'>Đơn giá</div>
              <NumberInput
                value={item.unitCost || 0}
                min={0}
                size='small'
                placeholder='Đơn giá'
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

export default MobileItemCard
