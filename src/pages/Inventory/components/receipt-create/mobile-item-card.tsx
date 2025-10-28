import React, { useState, useEffect } from "react"
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
  // Props cho ComboBox - gộp thành một object
  comboBoxProps: {
    data: { value: number; label: string }[]
    isLoading: boolean
    isFetching: boolean
    hasNextPage: boolean | undefined
    isFetchingNextPage: boolean
    fetchNextPage: () => void
  }
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
  comboBoxProps,
}) => {
  const isEditing = editingKey === item.key
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Validate item khi đang chỉnh sửa
  useEffect(() => {
    if (isEditing) {
      const newErrors: Record<string, string> = {}

      // Validate sản phẩm
      if (!item.productId || item.productId === 0) {
        newErrors.productId = "Vui lòng chọn sản phẩm"
      }

      // Validate số lượng (tối thiểu là 1)
      if (!item.quantity || item.quantity < 1) {
        newErrors.quantity = "Vui lòng nhập số lượng tối thiểu là 1"
      }

      // Validate đơn giá (cho phép nhập 0)
      if (item.unitCost < 0) {
        newErrors.unitCost = "Vui lòng nhập đơn giá hợp lệ"
      }

      setErrors(newErrors)
    }
  }, [isEditing, item.productId, item.quantity, item.unitCost])

  // Custom handle change với validation
  const handleItemChangeWithValidation = (
    key: string,
    field: keyof InventoryReceiptItemForm,
    value: unknown
  ) => {
    // Gọi hàm xử lý thay đổi gốc
    handleItemChange(key, field, value)

    // Validate field vừa thay đổi
    if (isEditing) {
      const newErrors = { ...errors }

      switch (field) {
        case "productId":
          if (!value || value === 0) {
            newErrors.productId = "Vui lòng chọn sản phẩm"
          } else {
            delete newErrors.productId
          }
          break
        case "quantity":
          if (!value || (value as number) < 1) {
            newErrors.quantity = "Vui lòng nhập số lượng tối thiểu là 1"
          } else {
            delete newErrors.quantity
          }
          break
        case "unitCost":
          if ((value as number) < 0) {
            newErrors.unitCost = "Vui lòng nhập đơn giá hợp lệ"
          } else {
            delete newErrors.unitCost
          }
          break
      }

      setErrors(newErrors)
    }
  }

  // Custom handle save với validation
  const handleSaveItemWithValidation = (key: string) => {
    // Kiểm tra lỗi trước khi lưu
    const hasErrors = Object.keys(errors).length > 0
    if (hasErrors) {
      return
    }

    // Gọi hàm lưu gốc
    handleSaveItem(key)
  }

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
      className='mb-3 w-full'
    >
      {isEditing ? (
        <div className='space-y-3 w-full'>
          <div>
            <label className='block text-xs mb-1'>Sản phẩm</label>
            <ComboBox
              value={item.productId}
              placeholder='Chọn sản phẩm'
              {...comboBoxProps}
              showSearch={true}
              style={{ width: "100%" }}
              onChange={(value) =>
                handleItemChangeWithValidation(item.key, "productId", value)
              }
            />
            {errors.productId && (
              <div className='text-red-500 text-xs mt-1'>
                {errors.productId}
              </div>
            )}
          </div>
          <div>
            <label className='block text-xs mb-1'>Số lượng</label>
            <NumberInput
              value={item.quantity}
              min={1}
              placeholder='Số lượng'
              onChange={(value) =>
                handleItemChangeWithValidation(item.key, "quantity", value || 1)
              }
            />
            {errors.quantity && (
              <div className='text-red-500 text-xs mt-1'>{errors.quantity}</div>
            )}
          </div>
          <div>
            <label className='block text-xs mb-1'>Đơn giá</label>
            <NumberInput
              value={item.unitCost}
              min={0}
              placeholder='Đơn giá'
              onChange={(value) =>
                handleItemChangeWithValidation(item.key, "unitCost", value || 0)
              }
            />
            {errors.unitCost && (
              <div className='text-red-500 text-xs mt-1'>{errors.unitCost}</div>
            )}
          </div>
          <div>
            <label className='block text-xs mb-1'>Thành tiền</label>
            <div className='p-2 bg-gray-100 rounded text-right font-medium'>
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(item.quantity * item.unitCost)}
            </div>
          </div>
          <div>
            <label className='block text-xs mb-1'>Ghi chú</label>
            <Input
              value={item.notes}
              placeholder='Ghi chú'
              onChange={(e) =>
                handleItemChangeWithValidation(
                  item.key,
                  "notes",
                  e.target.value
                )
              }
            />
          </div>
          <Space className='w-full justify-end'>
            <Button
              type='primary'
              icon={<CheckOutlined />}
              onClick={() => handleSaveItemWithValidation(item.key)}
              disabled={Object.keys(errors).length > 0}
            >
              Lưu
            </Button>
            <Button icon={<CloseOutlined />} onClick={handleCancelEdit}>
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
