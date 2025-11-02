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
      dataIndex: "productId",
      key: "productId",
      width: 120,
      render: (productId: number, record: InventoryReceiptItemForm) => {
        return (
          <div className='w-full'>
            <ComboBox
              value={productId}
              placeholder='Chọn sản phẩm'
              {...comboBoxProps}
              showSearch={true}
              onChange={(value) =>
                handleItemChange(record.key, "productId", value)
              }
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
