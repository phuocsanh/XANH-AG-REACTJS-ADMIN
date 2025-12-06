import React from "react"
import { ColumnsType } from "antd/es/table"
import { Button, Popconfirm, Typography, Input } from "antd"
import { DeleteOutlined } from "@ant-design/icons"
import NumberInput from "@/components/common/number-input"
import ComboBox from "@/components/common/combo-box"
import { InventoryReceiptItemForm } from "@/models/inventory.model"

const { Text } = Typography
const { TextArea } = Input

interface ItemColumnsProps {
  handleItemChange: (
    key: string,
    field: keyof InventoryReceiptItemForm,
    value: unknown
  ) => void
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

const useItemColumns = ({
  handleItemChange,
  handleDeleteItem,
  comboBoxProps,
}: ItemColumnsProps): ColumnsType<InventoryReceiptItemForm> => {
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
      width: 120,
      render: (product_id: number, record: InventoryReceiptItemForm) => {
        return (
          <div className='w-full'>
            <ComboBox
              value={product_id}
              placeholder='Chọn sản phẩm'
              {...comboBoxProps}
              showSearch={true}
              onChange={(value, option) => {
                handleItemChange(record.key, "product_id", value)

                // Logic đồng bộ với MobileItemCard: Lấy tên và giá từ option ngay khi chọn
                if (option) {
                  const optArray = Array.isArray(option) ? option : [option]
                  const selectedOpt = optArray[0] as any

                  if (selectedOpt) {
                    const name = selectedOpt.name || selectedOpt.label || ""
                    if (name) {
                      handleItemChange(record.key, "product_name", name)
                    }

                    if (selectedOpt.cost_price !== undefined) {
                      handleItemChange(record.key, "unit_cost", selectedOpt.cost_price)
                    }
                  }
                }
              }}
              style={{ width: "100%" }}
            />
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
        return (
          <NumberInput
            value={quantity}
            min={1}
            placeholder='Số lượng'
            onChange={(value) =>
              handleItemChange(record.key, "quantity", value || 1)
            }
          />
        )
      },
    },
    {
      title: "Đơn giá",
      dataIndex: "unit_cost",
      key: "unit_cost",
      width: 90,
      align: "right",
      render: (price: number, record: InventoryReceiptItemForm) => {
        return (
          <NumberInput
            value={price || 0}
            min={0}
            placeholder='Đơn giá'
            onChange={(value) =>
              handleItemChange(record.key, "unit_cost", value || 0)
            }
          />
        )
      },
    },
    {
      title: "Phí VC riêng",
      dataIndex: "individual_shipping_cost",
      key: "individual_shipping_cost",
      width: 90,
      align: "right",
      render: (cost: number, record: InventoryReceiptItemForm) => {
        return (
          <NumberInput
            value={cost || 0}
            min={0}
            placeholder='0'
            onChange={(value) =>
              handleItemChange(record.key, "individual_shipping_cost", value || 0)
            }
          />
        )
      },
    },
    {
      title: "Thành tiền",
      dataIndex: "total_price",
      key: "total_price",
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
            }).format(record.total_price || 0)}
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
        return (
          <TextArea
            value={notes}
            placeholder='Ghi chú'
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              handleItemChange(record.key, "notes", e.target.value)
            }
            autoSize={{ minRows: 1, maxRows: 3 }}
          />
        )
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 70,
      align: "center",
      render: (_, record: InventoryReceiptItemForm) => {
        return (
          <div className='flex justify-center'>
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
          </div>
        )
      },
    },
  ]
}

export default useItemColumns
