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
import { InventoryReceiptItemForm } from "@/models/inventory.model"

const { Text } = Typography

interface MobileItemCardProps {
  item: InventoryReceiptItemForm
  index: number
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
  editingKey,
  handleItemChange,
  handleSaveItem,
  handleCancelEdit,
  handleEditItem,
  handleDeleteItem,
}) => {
  const isEditing = editingKey === item.key

  return (
    <Card
      size='small'
      title={`Sản phẩm ${index + 1}`}
      extra={
        isEditing ? null : (
          <Popconfirm
            title='Xóa'
            description='Xóa?'
            onConfirm={() => handleDeleteItem(item.key)}
            okText='Xóa'
            cancelText='Hủy'
            placement='topRight'
          >
            <Button type='text' icon={<DeleteOutlined />} danger size='small' />
          </Popconfirm>
        )
      }
      className='mb-3'
    >
      {isEditing ? (
        <div className='space-y-3 w-full'>
          <ComboBox
            value={item.productId}
            placeholder='Chọn sản phẩm'
            queryKey={["products", "search"]}
            pageSize={20}
            showSearch={true}
            filterOption={false}
            style={{ width: "100%" }}
            onChange={(value) => handleItemChange(item.key, "productId", value)}
          />
          <NumberInput
            value={item.quantity}
            min={1}
            placeholder='Số lượng'
            onChange={(value) =>
              handleItemChange(item.key, "quantity", value || 1)
            }
          />
          <NumberInput
            value={item.unitCost}
            min={0}
            placeholder='Đơn giá'
            onChange={(value) =>
              handleItemChange(item.key, "unitCost", value || 0)
            }
          />
          <Input
            value={item.notes}
            placeholder='Ghi chú'
            onChange={(e) =>
              handleItemChange(item.key, "notes", e.target.value)
            }
          />
          <Space className='w-full justify-end'>
            <Button
              type='primary'
              icon={<CheckOutlined />}
              onClick={() => handleSaveItem(item.key)}
              size='small'
            >
              Lưu
            </Button>
            <Button
              icon={<CloseOutlined />}
              onClick={handleCancelEdit}
              size='small'
            >
              Hủy
            </Button>
          </Space>
        </div>
      ) : (
        <div className='space-y-2'>
          <div className='flex justify-between'>
            <Text strong>{item.productName || "-"}</Text>
          </div>
          <div className='flex justify-between text-sm'>
            <Text type='secondary'>Số lượng:</Text>
            <Text>{new Intl.NumberFormat("vi-VN").format(item.quantity)}</Text>
          </div>
          <div className='flex justify-between text-sm'>
            <Text type='secondary'>Đơn giá:</Text>
            <Text>
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(item.unitCost)}
            </Text>
          </div>
          <div className='flex justify-between text-sm'>
            <Text type='secondary'>Thành tiền:</Text>
            <Text strong style={{ color: "#52c41a" }}>
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(item.totalPrice)}
            </Text>
          </div>
          {item.notes && (
            <div className='flex justify-between text-sm'>
              <Text type='secondary'>Ghi chú:</Text>
              <Text>{item.notes}</Text>
            </div>
          )}
          <div className='flex justify-end pt-2'>
            <Button
              type='text'
              icon={<EditOutlined />}
              onClick={() => handleEditItem(item.key)}
              size='small'
            >
              Sửa
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

export default MobileItemCard
