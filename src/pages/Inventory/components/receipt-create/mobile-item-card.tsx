import React, { useState, useEffect } from "react"
import { Card, Input, Button, Typography, Popconfirm } from "antd"
import { EditOutlined, DeleteOutlined } from "@ant-design/icons"
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
  handleEditItem,
  handleDeleteItem,
  comboBoxProps,
}) => {
  const isEditing = editingKey === item.key
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Hàm validate cho từng trường
  const validateField = (
    field: keyof InventoryReceiptItemForm,
    value: unknown
  ): string => {
    switch (field) {
      case "productId":
        return !value || value === 0 ? "Vui lòng chọn sản phẩm" : ""
      case "quantity":
        return !value || Number(value) < 1 ? "Số lượng tối thiểu là 1" : ""
      case "unitCost":
        return Number(value) < 0 ? "Đơn giá phải lớn hơn hoặc bằng 0" : ""
      default:
        return ""
    }
  }

  // Hàm validate tất cả các trường
  const validateAllFields = (): boolean => {
    const newErrors: Record<string, string> = {}
    const fieldsToValidate: (keyof InventoryReceiptItemForm)[] = [
      "productId",
      "quantity",
      "unitCost",
    ]

    fieldsToValidate.forEach((field) => {
      const error = validateField(field, item[field])
      if (error) {
        newErrors[field] = error
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Validate khi item thay đổi
  useEffect(() => {
    if (isEditing) {
      validateAllFields()
    }
  }, [item, isEditing])

  // Hàm xử lý thay đổi có validate
  const handleItemChangeWithValidation = (
    field: keyof InventoryReceiptItemForm,
    value: unknown
  ) => {
    handleItemChange(item.key, field, value)

    // Validate field ngay lập tức
    const error = validateField(field, value)
    setErrors((prev) => ({
      ...prev,
      [field]: error,
    }))
  }

  return (
    <Card
      size='small'
      title={`Sản phẩm ${index + 1}`}
      extra={
        !isEditing ? (
          <Popconfirm
            title='Xóa'
            description='Xóa?'
            onConfirm={() => handleDeleteItem(item.key)}
            okText='Xóa'
            cancelText='Đóng'
            placement='topRight'
          >
            <Button type='text' icon={<DeleteOutlined />} danger />
          </Popconfirm>
        ) : null
      }
      className='mb-4'
    >
      {isEditing ? (
        <div className='space-y-3'>
          <div>
            <label className='block text-xs mb-1'>Sản phẩm *</label>
            <ComboBox
              value={item.productId}
              placeholder='Chọn sản phẩm'
              {...comboBoxProps}
              showSearch={true}
              onChange={(value) =>
                handleItemChangeWithValidation("productId", value)
              }
              style={{ width: "100%" }}
            />
            {errors.productId && (
              <div className='text-red-500 text-xs mt-1'>
                {errors.productId}
              </div>
            )}
          </div>
          <div>
            <label className='block text-xs mb-1'>Số lượng *</label>
            <NumberInput
              value={item.quantity}
              min={1}
              placeholder='Số lượng'
              onChange={(value) =>
                handleItemChangeWithValidation("quantity", value || 1)
              }
            />
            {errors.quantity && (
              <div className='text-red-500 text-xs mt-1'>{errors.quantity}</div>
            )}
          </div>
          <div>
            <label className='block text-xs mb-1'>Đơn giá *</label>
            <NumberInput
              value={item.unitCost}
              min={0}
              placeholder='Đơn giá'
              onChange={(value) =>
                handleItemChangeWithValidation("unitCost", value || 0)
              }
            />
            {errors.unitCost && (
              <div className='text-red-500 text-xs mt-1'>{errors.unitCost}</div>
            )}
          </div>
          <div>
            <label className='block text-xs mb-1'>Thành tiền</label>
            <div className='p-2 bg-gray-100 rounded'>
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(item.totalPrice)}
            </div>
          </div>
          <div>
            <label className='block text-xs mb-1'>Ghi chú</label>
            <Input
              value={item.notes}
              placeholder='Ghi chú'
              onChange={(e) =>
                handleItemChangeWithValidation("notes", e.target.value)
              }
            />
          </div>
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
