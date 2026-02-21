import React, { useState, useEffect } from "react"
import { Card, Button, Typography, Popconfirm, Tooltip } from "antd"

import { Controller } from "react-hook-form"
import {
  DeleteOutlined,
} from "@ant-design/icons"
import NumberInput from "@/components/common/number-input"
import DatePicker from "@/components/common/DatePicker"
import Field from "@/components/common/field"

import ComboBox from "@/components/common/combo-box"
import { InventoryReceiptItemForm } from "@/models/inventory.model"
import dayjs from "dayjs"
const { Text } = Typography

// Hàm validate ghi chú
const validateNotes = (value: string): string => {
  if (value && value.length > 255) {
    return "Ghi chú không được vượt quá 255 ký tự"
  }
  return ""
}

interface MobileItemCardProps {
  item: any
  index: number
  handleDeleteItem: (index: number) => void
  comboBoxProps: {
    data: { value: number; label: string }[]
    isLoading: boolean
    isFetching: boolean
    hasNextPage: boolean | undefined
    isFetchingNextPage: boolean
    fetchNextPage: () => void
  }
  control: any
  setValue: any
  getValues: any
}

const MobileItemCard: React.FC<MobileItemCardProps> = React.memo(({
  item,
  index,
  handleDeleteItem,
  comboBoxProps,
  control,
  setValue,
  getValues,
}) => {
  return (
    <Card
      size='small'
      title={`Sản phẩm ${index + 1}`}
      extra={
        <Popconfirm
          title='Xóa'
          description='Xóa?'
          onConfirm={() => handleDeleteItem(index)}
          okText='Xóa'
          cancelText='Đóng'
          placement='topRight'
        >
          <Button type='text' icon={<DeleteOutlined />} danger />
        </Popconfirm>
      }
      className='mb-4'
    >
      <div className='space-y-3'>
        <div>
          <label className='block text-xs mb-1'>Sản phẩm *</label>
          <Controller
            name={`items.${index}.product_id`}
            control={control}
            render={({ field }) => (
              <Tooltip 
                title={
                  <div className="flex flex-col py-0.5" style={{ fontSize: '11px' }}>
                    <div className="text-[10px] text-gray-400">Tên thương mại:</div>
                    <div className="font-semibold mb-1 leading-tight">{getValues(`items.${index}.product_name`) || 'Chưa có'}</div>
                    <div className="text-[10px] text-gray-400">Tên sản phẩm:</div>
                    <div className="font-semibold mb-1 leading-tight">{getValues(`items.${index}.scientific_name`) || 'Chưa có'}</div>
                    <div className="text-[10px] text-gray-400">Đơn vị tính:</div>
                    <div className="font-semibold leading-tight">{getValues(`items.${index}.unit_name`) || 'Chưa có'}</div>
                  </div>
                }
                placement="topLeft"
                mouseEnterDelay={0.5}
              >
                <div className="w-full">
                  <ComboBox
                    {...field}
                    title=""
                    placeholder='Chọn sản phẩm'
                    {...comboBoxProps}
                    showSearch={true}
                    onChange={(value, option) => {
                      field.onChange(value)
                      
                      if (option) {
                        const optArray = Array.isArray(option) ? option : [option]
                        const selectedOpt = optArray[0] as any
                        
                        if (selectedOpt) {
                          const name = selectedOpt.trade_name || selectedOpt.name || selectedOpt.label || ""
                          if (name) {
                            setValue(`items.${index}.product_name`, name)
                          }
                          // Lưu tên sản phẩm gốc (scientific name) và ĐVT để hiển thị tooltip
                          if (selectedOpt.name) {
                            setValue(`items.${index}.scientific_name`, selectedOpt.name)
                          }
                          
                          // Tìm đơn vị nhập hàng mặc định
                          const conversions = selectedOpt.unit_conversions || [];
                          const purchaseConv = conversions.find((c: any) => c.is_purchase_unit);
                          const unitId = purchaseConv ? purchaseConv.unit_id : selectedOpt.unit_id;
                          const factor = purchaseConv ? Number(purchaseConv.conversion_factor) : 1;
                          
                          const unitName = purchaseConv 
                            ? (purchaseConv.is_base_unit ? (purchaseConv.unit?.name || purchaseConv.unit_name) : `${purchaseConv.unit?.name || purchaseConv.unit_name} (${factor})`)
                            : (selectedOpt.unit?.name || selectedOpt.unit_name || "");

                          setValue(`items.${index}.unit_name`, unitName)
                          setValue(`items.${index}.unit_id`, unitId)
                          setValue(`items.${index}.conversion_factor`, factor)
                          
                          const qty = getValues(`items.${index}.quantity`) || 0
                          setValue(`items.${index}.base_quantity`, qty * factor)
                          setValue(`items.${index}.conversions`, conversions)

                          if (selectedOpt.cost_price !== undefined) {
                            const cost = selectedOpt.cost_price
                            setValue(`items.${index}.unit_cost`, cost)
                            
                            // Cập nhật thành tiền
                            const qty = getValues(`items.${index}.quantity`) || 0
                            setValue(`items.${index}.total_price`, qty * cost)
                          }
                        }
                      }
                    }}
                    style={{ width: "100%" }}
                  />
                </div>
              </Tooltip>
            )}
          />
        </div>
        <div className='grid grid-cols-2 gap-3'>
          <div>
            <label className='block text-xs mb-1'>Đơn vị tính</label>
            {(() => {
              const conversions = getValues(`items.${index}.conversions`) || []
              const hasConversions = conversions.length > 0

              if (!hasConversions) {
                return (
                  <Controller
                    name={`items.${index}.unit_name`}
                    control={control}
                    render={({ field }) => (
                      <div className="p-2 bg-gray-50 border rounded min-h-[32px] flex items-center text-gray-500 text-sm">
                        {field.value || "-"}
                      </div>
                    )}
                  />
                )
              }

              return (
                <Controller
                  name={`items.${index}.unit_id`}
                  control={control}
                  render={({ field }) => (
                    <ComboBox
                      {...field}
                      noFormItem
                      options={conversions.map((c: any) => {
                        const factorValue = Number(c.conversion_factor) || 1;
                        const isBase = c.is_base_unit;
                        const label = isBase 
                          ? (c.unit?.name || c.unit_name) 
                          : `${c.unit?.name || c.unit_name} (${factorValue})`;
                        
                        return {
                          label: label || "---",
                          value: c.unit_id,
                        };
                      })}
                      onChange={(val) => {
                        field.onChange(val)
                        const selectedConv = conversions.find((c: any) => c.unit_id === val)
                        if (selectedConv) {
                          const factor = Number(selectedConv.conversion_factor) || 1
                          setValue(`items.${index}.conversion_factor`, factor)
                          setValue(`items.${index}.unit_name`, selectedConv.unit?.name || selectedConv.unit_name)
                          
                          // Cập nhật base_quantity
                          const qty = getValues(`items.${index}.quantity`) || 0
                          setValue(`items.${index}.base_quantity`, qty * factor)
                        }
                      }}
                      style={{ width: "100%" }}
                    />
                  )}
                />
              )
            })()}
          </div>
          <div>
            <label className='block text-xs mb-1'>Số lượng *</label>
            <Controller
              name={`items.${index}.quantity`}
              control={control}
              render={({ field }) => (
                <NumberInput
                  {...field}
                  min={1}
                  placeholder='Số lượng'
                  onChange={(value) => {
                    const qty = value || 1
                    field.onChange(qty)
                    
                    // Cập nhật thành tiền
                    const cost = getValues(`items.${index}.unit_cost`) || 0
                    setValue(`items.${index}.total_price`, qty * cost)
                  }}
                />
              )}
            />
          </div>
          <div>
            <label className='block text-xs mb-1'>Đơn giá *</label>
            <Controller
              name={`items.${index}.unit_cost`}
              control={control}
              render={({ field }) => (
                <NumberInput
                  {...field}
                  min={0}
                  placeholder='Đơn giá'
                  onChange={(value) => {
                    const cost = value || 0
                    field.onChange(cost)
                    
                    // Cập nhật thành tiền
                    const qty = getValues(`items.${index}.quantity`) || 0
                    setValue(`items.${index}.total_price`, qty * cost)
                  }}
                />
              )}
            />
          </div>
          <div>
            <label className='block text-xs mb-1'>Thành tiền</label>
            <Controller
              name={`items.${index}.total_price`}
              control={control}
              render={({ field }) => (
                <div className="p-2 bg-green-50 border border-green-100 rounded text-right min-h-[32px] flex items-center justify-end">
                  <Text strong className="text-green-600 text-sm">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(field.value || 0)}
                  </Text>
                </div>
              )}
            />
          </div>
          <div className="col-span-2">
            <label className='block text-xs mb-1'>Phí vận chuyển riêng (nếu có)</label>
            <Controller
              name={`items.${index}.individual_shipping_cost`}
              control={control}
              render={({ field }) => (
                <NumberInput
                  {...field}
                  min={0}
                  placeholder='0'
                  addonAfter="VND"
                />
              )}
            />
          </div>
        </div>

        <div>
          <label className='block text-xs mb-1'>Hạn dùng</label>
          <Controller
            name={`items.${index}.expiry_date`}
            control={control}
            render={({ field }) => (
              <DatePicker
                value={field.value ? dayjs(field.value) : null}
                placeholder='Hạn dùng'
                format='DD/MM/YYYY'
                onChange={(d) =>
                  field.onChange(d ? d.toISOString() : undefined)
                }
                style={{ width: "100%" }}
                disabledDate={(current) => current && current < dayjs().startOf('day')}
              />
            )}
          />
        </div>
        <div>
          <label className='block text-xs mb-1'>Ghi chú</label>
          <Controller
            name={`items.${index}.notes`}
            control={control}
            render={({ field }) => (
              <Field
                {...field}
                placeholder='Ghi chú'
              />
            )}
          />
        </div>
      </div>
    </Card>
  )
})

export default MobileItemCard
