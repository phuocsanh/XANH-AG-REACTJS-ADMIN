import React, { useState, useEffect } from "react"
import { Card, Input, Button, Typography, Popconfirm } from "antd"
import { EditOutlined, DeleteOutlined } from "@ant-design/icons"
import NumberInput from "@/components/common/number-input"
import ComboBox from "@/components/common/combo-box"
import { InventoryReceiptItemForm } from "@/models/inventory.model"

const { Text } = Typography

// Hàm validate số lượng
const validateQuantity = (value: number): string => {
  if (!value || value < 1) {
    return "Số lượng phải lớn hơn 0"
  }
  return ""
}

// Hàm validate đơn giá
const validateUnitCost = (value: number): string => {
  if (value < 0) {
    return "Đơn giá không được âm"
  }
  return ""
}

// Hàm validate ghi chú
const validateNotes = (value: string): string => {
  if (value && value.length > 255) {
    return "Ghi chú không được vượt quá 255 ký tự"
  }
  return ""
}

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
      case "quantity":
        return validateQuantity(value as number)
      case "unit_cost":
        return validateUnitCost(value as number)
      case "notes":
        return validateNotes(value as string)
      default:
        return ""
    }
  }

  // Hàm validate tất cả các trường
  const validateAllFields = (): boolean => {
    const newErrors: Record<string, string> = {}
    const validateFields = ["quantity", "unit_cost", "notes"]

    validateFields.forEach((field) => {
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
              value={item.product_id}
              placeholder='Chọn sản phẩm'
              {...comboBoxProps}
              showSearch={true}
              onChange={(value, option) => {
                // Update ID trước
                handleItemChangeWithValidation("product_id", value)
                
                // Update tên sản phẩm và đơn giá từ option (nếu có)
                // Điều này quan trọng vì danh sách productOptions ở component cha có thể không đầy đủ
                // nhưng option trả về từ ComboBox luôn chứa thông tin của item đã chọn
                if (option) {
                    const optArray = Array.isArray(option) ? option : [option];
                    const selectedOpt = optArray[0] as any;
                    
                    if (selectedOpt) {
                         // Lấy tên sản phẩm
                         const name = selectedOpt.name || selectedOpt.label || "";
                         if (name) {
                             handleItemChange(item.key, "product_name", name);
                         }
                         
                         // Lấy giá vốn (nếu có)
                         if (selectedOpt.cost_price !== undefined) {
                             handleItemChange(item.key, "unit_cost", selectedOpt.cost_price);
                         }
                    }
                }
              }}
              style={{ width: "100%" }}
            />
            {errors.product_id && (
              <div className='text-red-500 text-xs mt-1'>
                {errors.product_id}
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
              value={item.unit_cost}
              min={0}
              placeholder='Đơn giá'
              onChange={(value) =>
                handleItemChangeWithValidation("unit_cost", value || 0)
              }
            />
            {errors.unit_cost && (
              <div className='text-red-500 text-xs mt-1'>
                {errors.unit_cost}
              </div>
            )}
          </div>
          <div>
            <label className='block text-xs mb-1'>Phí VC riêng</label>
            <NumberInput
              value={item.individual_shipping_cost || 0}
              min={0}
              placeholder='0'
              onChange={(value) =>
                handleItemChangeWithValidation("individual_shipping_cost", value || 0)
              }
            />
          </div>
          <div>
            <label className='block text-xs mb-1'>Thành tiền</label>
            <div className='p-2 bg-gray-100 rounded'>
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(item.total_price)}
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
            <Text strong>
              {item.product_name ? item.product_name.toString() : "-"}
            </Text>
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
              }).format(item.unit_cost)}
            </Text>
          </div>
          {(item.individual_shipping_cost || 0) > 0 && (
            <div className='flex justify-between text-sm'>
              <Text type='secondary'>Phí VC riêng:</Text>
              <Text>
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(item.individual_shipping_cost || 0)}
              </Text>
            </div>
          )}
          <div className='flex justify-between text-sm'>
            <Text type='secondary'>Thành tiền:</Text>
            <Text strong style={{ color: "#52c41a" }}>
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(item.total_price)}
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
