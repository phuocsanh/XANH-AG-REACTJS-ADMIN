import { ColumnsType } from "antd/es/table"

import { Button, Popconfirm, Typography, Tooltip } from "antd"


import { DeleteOutlined } from "@ant-design/icons"

import NumberInput from "@/components/common/number-input"
import DatePicker from "@/components/common/DatePicker"

import ComboBox from "@/components/common/combo-box"
import Field from "@/components/common/field"

import { Controller } from "react-hook-form"
import dayjs from "dayjs"


const { Text } = Typography

/**
 * Props cho hook useItemColumns
 */
interface ItemColumnsProps {
  handleDeleteItem: (index: number) => void // Hàm xóa một dòng sản phẩm
  comboBoxProps: {
    data: { value: number; label: string }[]
    isLoading: boolean
    isFetching: boolean
    hasNextPage: boolean | undefined
    isFetchingNextPage: boolean
    fetchNextPage: () => void
  }
  control: any // Đối tượng control từ react-hook-form
  setValue: any // Hàm setValue từ react-hook-form
  getValues: any // Hàm getValues từ react-hook-form
}

/**
 * Hook định nghĩa các cột cho bảng nhập kho
 */
const useItemColumns = ({
  handleDeleteItem,
  comboBoxProps,
  control,
  setValue,
  getValues,
}: ItemColumnsProps): ColumnsType<any> => {
  return [
    {
      title: "STT",
      key: "index",
      width: 40,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Sản phẩm",
      dataIndex: "product_id",
      key: "product_id",
      width: 250,
      render: (product_id: number, record: any, index: number) => {
        return (
          <div className='w-full'>
            <Controller
              name={`items.${index}.product_id`}
              control={control}
              render={({ field }) => (
                  <Tooltip 
                    title={
                      <div className="flex flex-col py-0.5" style={{ fontSize: '10px' }}>
                        <div className="text-[10px] text-gray-400">Tên thương mại:</div>
                        <div className=" leading-tight">{getValues(`items.${index}.product_name`) || 'Chưa có'}</div>
                        <div className="text-[10px] text-gray-400">Tên sản phẩm:</div>
                        <div className=" leading-tight">{getValues(`items.${index}.scientific_name`) || 'Chưa có'}</div>
                        <div className="text-[10px] text-gray-400">Đơn vị tính: <span className="text-white">{getValues(`items.${index}.unit_name`) || 'Chưa có'}</span></div>
                       
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
                            
                            const unitName = selectedOpt.unit?.name || selectedOpt.unit_name || ""
                            setValue(`items.${index}.unit_name`, unitName)

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
        )
      },
    },
    {
      title: "SL",
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      align: "right",
      render: (quantity: number, record: any, index: number) => {
        return (
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
        )
      },
    },
    {
      title: "Đơn giá",
      dataIndex: "unit_cost",
      key: "unit_cost",
      width: 140,
      align: "right",
      render: (price: number, record: any, index: number) => {
        return (
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
        )
      },
    },
    {
      title: "Phí Vận Chuyển/Bốc Vác riêng",
      dataIndex: "individual_shipping_cost",
      key: "individual_shipping_cost",
      width: 140,
      align: "right",
      render: (cost: number, record: any, index: number) => {
        return (
          <Controller
            name={`items.${index}.individual_shipping_cost`}
            control={control}
            render={({ field }) => (
              <NumberInput
                {...field}
                min={0}
                placeholder='0'
              />
            )}
          />
        )
      },
    },
    {
      title: "Thành tiền",
      dataIndex: "total_price",
      key: "total_price",
      width: 150,
      align: "right",
      render: (_, record: any, index: number) => {
        return (
          <Controller
            name={`items.${index}.total_price`}
            control={control}
            render={({ field }) => (
              <Text
                strong
                style={{ color: "#52c41a" }}
                className='truncate text-sm'
              >
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(field.value || 0)}
              </Text>
            )}
          />
        )
      },
    },
    {
      title: "Hạn dùng",
      dataIndex: "expiry_date",
      key: "expiry_date",
      width: 150,
      render: (date: any, record: any, index: number) => {
        return (
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
        )
      },
    },
    {
      title: "Ghi chú",
      dataIndex: "notes",
      key: "notes",
      width: 200,
      render: (notes: string, record: any, index: number) => {
        return (
          <Controller
            name={`items.${index}.notes`}
            control={control}
            render={({ field }) => (
              <Field
                type="textarea"
                {...field}
                placeholder='Ghi chú'
                rows={1}
              />
            )}
          />
        )
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 60,
      align: "center",
      render: (_, __, index) => {
        return (
          <div className='flex justify-center'>
            <Popconfirm
              title='Xóa'
              description='Xóa?'
              onConfirm={() => handleDeleteItem(index)}
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
          </div>
        )
      },
    },
  ]
}

export default useItemColumns
