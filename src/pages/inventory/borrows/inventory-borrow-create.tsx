import React from "react"
import { useNavigate } from "react-router-dom"
import dayjs from "dayjs"
import {
  Button,
  Card,
  AutoComplete,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Table,
  Typography,
} from "antd"
import { DeleteOutlined, PlusOutlined, SaveOutlined } from "@ant-design/icons"
import { useSupplierSearch } from "@/queries/supplier"
import { useProductSearch } from "@/queries/product"
import { useBatchesByProductQuery } from "@/queries/inventory"
import { useCreateInventoryBorrowMutation } from "@/queries/inventory-borrow"

const { Title, Text } = Typography

interface BorrowItemForm {
  key: string
  product_id?: number
  batch_id?: number
  quantity?: number
  notes?: string
}

const InventoryBorrowCreate: React.FC = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [supplierSearch, setSupplierSearch] = React.useState("")
  const [selectedSupplierId, setSelectedSupplierId] = React.useState<number | undefined>()
  const selectedSupplierRef = React.useRef<{ id: number; name: string } | null>(null)
  const [productSearch, setProductSearch] = React.useState("")
  const [items, setItems] = React.useState<BorrowItemForm[]>([{ key: crypto.randomUUID() }])
  const createMutation = useCreateInventoryBorrowMutation()

  const { data: supplierData } = useSupplierSearch(supplierSearch, 50, true)
  const productQuery = useProductSearch(productSearch, 30, true)
  const products = productQuery.data?.pages.flatMap((page) => page.data) || []

  const supplierOptions = (supplierData?.pages || []).flatMap((page) =>
    (page?.data || []).map((supplier: any) => ({
      value: supplier.name,
      label: `${supplier.name}${supplier.phone ? ` - ${supplier.phone}` : ""}`,
      supplierId: supplier.id,
    }))
  )

  const addItem = () => {
    setItems((current) => [...current, { key: crypto.randomUUID() }])
  }

  const updateItem = (key: string, patch: Partial<BorrowItemForm>) => {
    setItems((current) => current.map((item) => item.key === key ? { ...item, ...patch } : item))
  }

  const removeItem = (key: string) => {
    setItems((current) => current.length > 1 ? current.filter((item) => item.key !== key) : current)
  }

  const handleSubmit = async (approveNow: boolean) => {
    const values = await form.validateFields()
    const payloadItems = items.map((item) => ({
      product_id: Number(item.product_id || 0),
      batch_id: Number(item.batch_id || 0),
      quantity: Number(item.quantity || 0),
      notes: item.notes,
    }))

    if (payloadItems.some((item) => !item.product_id || !item.batch_id || item.quantity <= 0)) {
      form.setFields([{ name: "items_error", errors: ["Vui lòng chọn sản phẩm, lô hàng và số lượng cho từng dòng"] }])
      return
    }

    await createMutation.mutateAsync({
      borrower_customer_id: selectedSupplierId,
      borrower_name: values.borrower_name.trim(),
      borrow_date: values.borrow_date.format("YYYY-MM-DD"),
      expected_return_date: values.expected_return_date?.format("YYYY-MM-DD"),
      status: approveNow ? "approved" : "draft",
      notes: values.notes,
      items: payloadItems,
    })
    navigate("/inventory/borrows")
  }

  const columns = [
    {
      title: "Sản phẩm",
      dataIndex: "product_id",
      width: 280,
      render: (_: unknown, record: BorrowItemForm) => (
        <Select
          showSearch
          value={record.product_id}
          placeholder="Chọn sản phẩm"
          filterOption={false}
          onSearch={setProductSearch}
          onChange={(value) => updateItem(record.key, { product_id: value, batch_id: undefined })}
          options={products.map((product: any) => ({
            value: product.id,
            label: product.label || product.trade_name || product.name,
          }))}
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Lô hàng",
      dataIndex: "batch_id",
      width: 320,
      render: (_: unknown, record: BorrowItemForm) => (
        <BatchSelect
          productId={record.product_id}
          value={record.batch_id}
          onChange={(batchId) => updateItem(record.key, { batch_id: batchId })}
        />
      ),
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      width: 140,
      render: (_: unknown, record: BorrowItemForm) => (
        <InputNumber
          min={0.0001}
          value={record.quantity}
          onChange={(value) => updateItem(record.key, { quantity: Number(value || 0) })}
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Ghi chú",
      dataIndex: "notes",
      render: (_: unknown, record: BorrowItemForm) => (
        <Input
          value={record.notes}
          onChange={(event) => updateItem(record.key, { notes: event.target.value })}
          placeholder="Ghi chú dòng hàng"
        />
      ),
    },
    {
      title: "",
      key: "actions",
      width: 64,
      render: (_: unknown, record: BorrowItemForm) => (
        <Button danger type="text" icon={<DeleteOutlined />} onClick={() => removeItem(record.key)} />
      ),
    },
  ]

  return (
    <div className="p-2 md:p-6">
      <Title level={4} className="md:text-2xl mb-4">Tạo phiếu cho mượn hàng</Title>

      <Card>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ borrow_date: dayjs() }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label="Nhà cung cấp mượn hàng"
              name="borrower_name"
              rules={[{ required: true, message: "Vui lòng chọn hoặc nhập tên nhà cung cấp mượn hàng" }]}
            >
              <AutoComplete
                placeholder="Chọn nhà cung cấp có sẵn hoặc tự nhập tên"
                onSearch={setSupplierSearch}
                onChange={(value) => {
                  form.setFieldValue("borrower_name", value)
                  if (selectedSupplierRef.current?.name !== value) {
                    selectedSupplierRef.current = null
                    setSelectedSupplierId(undefined)
                  }
                }}
                onSelect={(value, option) => {
                  const supplierId = (option as any).supplierId
                  form.setFieldValue("borrower_name", value)
                  selectedSupplierRef.current = { id: supplierId, name: String(value) }
                  setSelectedSupplierId(supplierId)
                }}
                options={supplierOptions}
                filterOption={(input, option) =>
                  String(option?.label || "").toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>

            <Form.Item label="Ngày mượn" name="borrow_date" rules={[{ required: true, message: "Vui lòng chọn ngày mượn" }]}>
              <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item label="Hạn trả dự kiến" name="expected_return_date">
              <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item label="Ghi chú" name="notes">
              <Input.TextArea rows={2} placeholder="Thông tin giao nhận, người liên hệ..." />
            </Form.Item>
          </div>

          <Form.Item name="items_error">
            <Table
              dataSource={items}
              columns={columns as any}
              rowKey="key"
              pagination={false}
              scroll={{ x: 900 }}
            />
          </Form.Item>

          <Button icon={<PlusOutlined />} onClick={addItem} className="mb-4">
            Thêm dòng hàng
          </Button>

          <div className="flex flex-wrap justify-end gap-2">
            <Button onClick={() => navigate("/inventory/borrows")}>Hủy</Button>
            <Button icon={<SaveOutlined />} onClick={() => handleSubmit(false)} loading={createMutation.isPending}>
              Lưu nháp
            </Button>
            <Popconfirm
              title="Tạo và duyệt phiếu?"
              description="Tồn kho sẽ bị trừ theo đúng lô đã chọn."
              onConfirm={() => handleSubmit(true)}
              okText="Tạo và duyệt"
              cancelText="Xem lại"
            >
              <Button type="primary" loading={createMutation.isPending}>
                Tạo và duyệt
              </Button>
            </Popconfirm>
          </div>
        </Form>
      </Card>
    </div>
  )
}

const BatchSelect: React.FC<{
  productId?: number
  value?: number
  onChange: (value?: number) => void
}> = ({ productId, value, onChange }) => {
  const { data, isLoading } = useBatchesByProductQuery(productId || 0)
  const batches = Array.isArray(data) ? data : []

  return (
    <Select
      showSearch
      value={value}
      loading={isLoading}
      disabled={!productId}
      placeholder={productId ? "Chọn lô xuất cho mượn" : "Chọn sản phẩm trước"}
      onChange={onChange}
      optionFilterProp="label"
      options={batches
        .filter((batch: any) => Number(batch.remaining_quantity || 0) > 0)
        .map((batch: any) => {
          const importDate =
            batch.receipt_item?.receipt?.bill_date ||
            batch.received_at ||
            batch.created_at

          return {
            value: batch.id,
            label: `${batch.code || batch.batch_number || `Lô #${batch.id}`} | nhập ${importDate ? dayjs(importDate).format("DD/MM/YYYY") : "N/A"} | còn ${batch.remaining_quantity}${batch.expiry_date ? ` | HSD ${dayjs(batch.expiry_date).format("DD/MM/YYYY")}` : ""}${batch.supplier?.name ? ` | NCC: ${batch.supplier.name}` : ""}`,
          }
        })}
      style={{ width: "100%" }}
      dropdownRender={(menu) => (
        <>
          {menu}
          {productId && batches.length === 0 && (
            <div className="px-3 py-2">
              <Text type="secondary">Sản phẩm này chưa có lô còn tồn.</Text>
            </div>
          )}
        </>
      )}
    />
  )
}

export default InventoryBorrowCreate
