import { ColumnsType } from "antd/es/table"
import { Input, Button, Space, Typography, Popconfirm } from "antd"
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

interface ItemColumnsProps {
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

const useItemColumns = ({
  products,
  editingKey,
  handleItemChange,
  handleSaveItem,
  handleCancelEdit,
  handleEditItem,
  handleDeleteItem,
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
          <ComboBox
            value={productId}
            placeholder='Chọn sản phẩm'
            apiFunction={searchProducts}
            queryKey={["products", "search"]}
            pageSize={20}
            showSearch={true}
            filterOption={false}
            onChange={(value) =>
              handleItemChange(record.key, "productId", value)
            }
          />
        ) : (
          <div className='max-w-[100px] truncate text-sm'>
            {record.productName ||
              products.find((p) => p.id === productId)?.productName ||
              "-"}
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
