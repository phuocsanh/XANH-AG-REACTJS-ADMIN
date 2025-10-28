import { ColumnsType } from "antd/es/table"
import { Input, Button, Popconfirm, Typography, Space } from "antd"
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

interface ItemColumnsProps {
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
  // Props cho ComboBox
  productOptions: { value: number; label: string }[]
  isLoading: boolean
  isFetching: boolean
  hasNextPage: boolean | undefined
  isFetchingNextPage: boolean
  fetchNextPage: () => void
}

const useItemColumns = ({
  editingKey,
  handleItemChange,
  handleSaveItem,
  handleCancelEdit,
  handleEditItem,
  handleDeleteItem,
  productOptions,
  isLoading,
  isFetching,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
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
        const isEditing = editingKey === record.key
        return isEditing ? (
          <div className='w-full'>
            <ComboBox
              value={productId}
              placeholder='Chọn sản phẩm'
              data={productOptions}
              isLoading={isLoading}
              isFetching={isFetching}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={fetchNextPage}
              showSearch={true}
              onChange={(value) =>
                handleItemChange(record.key, "productId", value)
              }
              style={{ width: "100%" }}
            />
          </div>
        ) : (
          <div className='max-w-[100px] truncate text-sm'>
            {record.productName || "-"}
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
        const isEditing = editingKey === record.key
        return isEditing ? (
          <NumberInput
            value={quantity}
            min={1}
            size='small'
            placeholder='Số lượng'
            onChange={(value) =>
              handleItemChange(record.key, "quantity", value || 1)
            }
          />
        ) : (
          <div className='truncate text-sm'>
            {new Intl.NumberFormat("vi-VN").format(quantity || 0)}
          </div>
        )
      },
    },
    {
      title: "Đơn giá",
      dataIndex: "unitCost",
      key: "unitCost",
      width: 90,
      align: "right",
      render: (price: number, record: InventoryReceiptItemForm) => {
        const isEditing = editingKey === record.key
        return isEditing ? (
          <NumberInput
            value={price || 0}
            min={0}
            size='small'
            placeholder='Đơn giá'
            onChange={(value) =>
              handleItemChange(record.key, "unitCost", value || 0)
            }
          />
        ) : (
          <div className='truncate text-sm'>
            {new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(price || 0)}
          </div>
        )
      },
    },
    {
      title: "Thành tiền",
      dataIndex: "totalPrice",
      key: "totalPrice",
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
            }).format(record.totalPrice || 0)}
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
        const isEditing = editingKey === record.key
        return isEditing ? (
          <Input
            value={notes}
            placeholder='Ghi chú'
            size='small'
            onChange={(e) =>
              handleItemChange(record.key, "notes", e.target.value)
            }
          />
        ) : (
          <div className='max-w-[70px] truncate text-sm'>{notes || "-"}</div>
        )
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 70,
      align: "center",
      render: (_, record: InventoryReceiptItemForm) => {
        const isEditing = editingKey === record.key

        if (isEditing) {
          return (
            <Space size='small'>
              <Button
                type='text'
                icon={<CheckOutlined />}
                onClick={() => handleSaveItem(record.key)}
                size='small'
              />
              <Button
                type='text'
                icon={<CloseOutlined />}
                onClick={handleCancelEdit}
                size='small'
              />
            </Space>
          )
        }

        return (
          <Space size='small'>
            <Button
              type='text'
              icon={<EditOutlined />}
              onClick={() => handleEditItem(record.key)}
              size='small'
            />
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
          </Space>
        )
      },
    },
  ]
}

export default useItemColumns
