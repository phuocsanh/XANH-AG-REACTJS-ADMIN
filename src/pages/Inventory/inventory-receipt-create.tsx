import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Card,
  Button,
  Form,
  Input,
  Table,
  Typography,
  Alert,
  message,
  Divider,
  Select,
  Checkbox,
  InputNumber,
  Radio,
  Space,
  Upload,
} from "antd"
import type { UploadFile } from "antd"
import {
  ArrowLeftOutlined,
  PlusOutlined,
  SaveOutlined,
  UploadOutlined,
} from "@ant-design/icons"

// Import MobileItemCard từ components
import MobileItemCard from "./components/receipt-create/mobile-item-card"
// Import itemColumns từ components
import useItemColumns from "./components/receipt-create/item-columns"

import {
  CreateInventoryReceiptRequest,
  InventoryReceiptItemForm,
} from "@/models/inventory.model"
import { 
  useCreateInventoryReceiptMutation,
  useUploadFileMutation,
  useAttachImageToReceiptMutation,
} from "@/queries/inventory"
import { useMobile, useTablet } from "@/hooks/use-media-query"
import { useProductSearch } from "@/queries/product"
import { useMemo } from "react"
import { useSuppliersQuery } from "@/queries/supplier"

const { Title, Text } = Typography
const { TextArea } = Input

const InventoryReceiptCreate: React.FC = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const isMobile = useMobile()
  const isTablet = useTablet()

  // State quản lý danh sách sản phẩm trong phiếu
  const [items, setItems] = useState<InventoryReceiptItemForm[]>([])
  const [editingKey, setEditingKey] = useState<string>("")
  
  // State quản lý danh sách file ảnh
  const [fileList, setFileList] = useState<UploadFile[]>([])

  // State quản lý phí vận chuyển chung
  const [hasSharedShipping, setHasSharedShipping] = useState(false)
  const [sharedShippingCost, setSharedShippingCost] = useState(0)
  const [allocationMethod, setAllocationMethod] = useState<'by_value' | 'by_quantity'>('by_value')

  // Sử dụng hook product search ở cấp cao hơn
  const {
    data,
    isLoading,
    isFetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useProductSearch("", 20, true)

  // Flatten data từ tất cả pages
  const productOptions = useMemo(() => {
    if (!data?.pages) {
      console.log("No pages data available")
      return []
    }

    const flattened = data.pages.flatMap((page) => {
      if (!page || !page.data) {
        return []
      }

      return page.data
    })
    
    console.log("Product options flattened:", flattened)
    return flattened
  }, [data?.pages])

  // Tạo object chứa tất cả props cho ComboBox
  const comboBoxProps = useMemo(
    () => {
      const props = {
        data: productOptions,
        isLoading,
        isFetching,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
      }
      console.log("ComboBox props:", props)
      return props
    },
    [
      productOptions,
      isLoading,
      isFetching,
      hasNextPage,
      isFetchingNextPage,
      fetchNextPage,
    ]
  )

  // Queries
  const createReceiptMutation = useCreateInventoryReceiptMutation()
  const uploadFileMutation = useUploadFileMutation()
  const attachImageMutation = useAttachImageToReceiptMutation()
  const { data: suppliersData, isLoading: suppliersLoading } =
    useSuppliersQuery()

  // Hàm tính tổng tiền
  const calculateTotals = () => {
    const totalProductValue = items.reduce((sum, item) => sum + item.total_price, 0)
    const totalIndividualShipping = items.reduce((sum, item) => sum + (item.individual_shipping_cost || 0), 0)
    const totalSharedShipping = hasSharedShipping ? sharedShippingCost : 0
    
    return {
      totalProductValue,
      totalIndividualShipping,
      totalSharedShipping,
      grandTotal: totalProductValue + totalIndividualShipping + totalSharedShipping,
    }
  }

  // Handlers
  const handleBack = () => {
    navigate("/inventory/receipts")
  }

  const handleAddItem = () => {
    const newItem: InventoryReceiptItemForm = {
      key: Date.now().toString(),
      product_id: 0,
      product_name: "",
      quantity: 1,
      unit_cost: 0,
      total_price: 0,
      individual_shipping_cost: 0, // Khởi tạo phí vận chuyển riêng
    }
    // Thêm sản phẩm mới vào đầu mảng thay vì cuối mảng
    setItems([newItem, ...items])
    setEditingKey(newItem.key)
  }

  const handleDeleteItem = (key: string) => {
    setItems(items.filter((item) => item.key !== key))
  }

  const handleItemChange = (
    key: string,
    field: keyof InventoryReceiptItemForm,
    value: unknown
  ) => {
    setItems(
      items.map((item) => {
        if (item.key === key) {
          const updatedItem = { ...item, [field]: value }

          // Tự động tính toán total_price khi quantity hoặc unit_cost thay đổi
          if (field === "quantity" || field === "unit_cost") {
            const quantity =
              field === "quantity" ? (value as number) : item.quantity
            const unit_cost =
              field === "unit_cost" ? (value as number) : item.unit_cost
            updatedItem.total_price = quantity * unit_cost
          }

          // Tự động cập nhật tên sản phẩm khi chọn sản phẩm
          if (field === "product_id") {
            // Không cần tìm sản phẩm trong danh sách toàn cục nữa
            // Tên sản phẩm sẽ được cập nhật từ component ComboBox
          }

          return updatedItem
        }
        return item
      })
    )
  }

  const handleEditItem = (key: string) => {
    setEditingKey(key)
  }

  // Sử dụng hook để lấy cấu hình cột (phải đặt sau khi các hàm được định nghĩa)
  const itemColumns = useItemColumns({
    handleItemChange,
    handleDeleteItem,
    // Truyền props cho ComboBox theo cách mới
    comboBoxProps,
  })

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      // Validate có ít nhất 1 sản phẩm
      if (items.length === 0) {
        message.error("Vui lòng thêm ít nhất một sản phẩm")
        return
      }

      // Validate tất cả items đã hoàn thành
      const hasIncompleteItems = items.some(
        (item) =>
          !item.product_id ||
          item.product_id === 0 ||
          !item.quantity ||
          item.quantity < 1 ||
          item.unit_cost < 0
      )

      if (hasIncompleteItems) {
        message.error("Vui lòng hoàn thành thông tin tất cả sản phẩm")
        return
      }

      // Tạo mã phiếu nhập tự động
      const receiptCode = `PN${Date.now()}`

      // Tính tổng tiền sử dụng hàm calculateTotals
      const totals = calculateTotals()

      // Tạo request data theo đúng cấu trúc backend
      const requestData: CreateInventoryReceiptRequest = {
        receipt_code: receiptCode, // ✅ Sửa từ "code" thành "receipt_code"
        supplier_id: values.supplierId as number,
        total_amount: totals.grandTotal, // Sử dụng grandTotal từ calculateTotals
        notes: values.description as string | undefined,
        status: (values.status as string) || "draft", // ✅ Lấy từ form, mặc định là "draft"
        created_by: 1, // ✅ THÊM trường created_by (TODO: lấy từ auth context)
        
        // Phí vận chuyển chung (chỉ gửi nếu có)
        ...(hasSharedShipping && {
          shared_shipping_cost: sharedShippingCost,
          shipping_allocation_method: allocationMethod,
        }),
        
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          total_price: item.total_price,
          notes: item.notes || undefined,
          
          // Phí vận chuyển riêng (chỉ gửi nếu có)
          ...((item.individual_shipping_cost || 0) > 0 && {
            individual_shipping_cost: item.individual_shipping_cost,
          }),
        })),
      }

      const newReceipt = await createReceiptMutation.mutateAsync(requestData)
      
      // Upload ảnh nếu có
      if (fileList.length > 0) {
        try {
          message.loading("Đang upload hình ảnh...")
          
          for (const file of fileList) {
            if (file.originFileObj) {
              // 1. Upload file lên server
              const uploadResult = await uploadFileMutation.mutateAsync(file.originFileObj)
              
              // 2. Gắn file vào phiếu
              await attachImageMutation.mutateAsync({
                receiptId: newReceipt.id,
                fileId: (uploadResult as any).data.id,
                fieldName: "invoice_images",
              })
            }
          }
          message.success("Upload hình ảnh thành công!")
        } catch (uploadError) {
          console.error("Lỗi khi upload ảnh:", uploadError)
          message.warning("Tạo phiếu thành công nhưng có lỗi khi upload ảnh")
        }
      }

      message.success("Tạo phiếu nhập hàng thành công!")
      navigate("/inventory/receipts")
    } catch (error) {
      console.error("Error creating receipt:", error)
      message.error("Có lỗi xảy ra khi tạo phiếu nhập hàng")
    }
  }

  // Sử dụng card layout cho cả mobile và tablet
  const useCardLayout = isMobile || isTablet

  return (
    <div className='p-4'>
      <div className='mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2'>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          className='flex items-center'
        >
          Quay lại
        </Button>
        <Title level={4} className='m-0 text-lg sm:text-xl'>
          Tạo phiếu nhập hàng
        </Title>
      </div>

      <Card className='mb-4'>
        <Form form={form} layout='vertical' onFinish={handleSubmit}>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <Form.Item
              label='Nhà cung cấp'
              name='supplierId'
              rules={[
                {
                  required: true,
                  message: "Vui lòng chọn nhà cung cấp",
                },
              ]}
            >
              <Select
                placeholder='Chọn nhà cung cấp'
                loading={suppliersLoading}
                showSearch
                optionFilterProp='children'
                filterOption={(input, option) =>
                  String(option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {suppliersData?.data?.items?.map((supplier) => (
                  <Select.Option
                    key={supplier.id}
                    value={supplier.id}
                    label={supplier.name}
                  >
                    {supplier.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label='Trạng thái'
              name='status'
              initialValue='draft'
              rules={[
                {
                  required: true,
                  message: "Vui lòng chọn trạng thái",
                },
              ]}
            >
              <Select placeholder='Chọn trạng thái'>
                <Select.Option value='draft'>Nháp</Select.Option>
                <Select.Option value='pending'>Chờ duyệt</Select.Option>
                <Select.Option value='approved'>Đã duyệt</Select.Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item label='Mô tả' name='description'>
            <TextArea
              placeholder='Nhập mô tả (nếu có)'
              autoSize={{ minRows: 2, maxRows: 6 }}
            />
          </Form.Item>

          <Divider className='my-4' />

          <div className='mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2'>
            <Text strong className='text-lg'>
              Danh sách sản phẩm
            </Text>
            <Button
              type='primary'
              icon={<PlusOutlined />}
              onClick={handleAddItem}
            >
              Thêm sản phẩm
            </Button>
          </div>

          {items.length === 0 ? (
            <Alert
              message='Chưa có sản phẩm nào'
              description='Vui lòng thêm sản phẩm vào phiếu nhập hàng'
              type='info'
              showIcon
              className='mb-4'
            />
          ) : useCardLayout ? (
            <div className='w-full'>
              {items.map((item, index) => (
                <MobileItemCard
                  key={item.key}
                  item={item}
                  index={index}
                  editingKey={editingKey}
                  handleItemChange={handleItemChange}
                  handleEditItem={handleEditItem}
                  handleDeleteItem={handleDeleteItem}
                  // Truyền props cho ComboBox theo cách mới
                  comboBoxProps={comboBoxProps}
                />
              ))}
            </div>
          ) : (
            <div className='overflow-x-auto w-full'>
              <Table
                dataSource={items}
                columns={itemColumns}
                pagination={false}
                rowKey='key'
                scroll={{ x: "max-content" }}
                className='min-w-full'
              />
            </div>
          )}

          {/* Phần phí vận chuyển chung */}
          <Card title="Phí Vận Chuyển Chung (Tùy chọn)" className='mt-4'>
            <Checkbox 
              checked={hasSharedShipping}
              onChange={(e) => setHasSharedShipping(e.target.checked)}
            >
              Có phí vận chuyển chung
            </Checkbox>
            
            {hasSharedShipping && (
              <>
                <Form.Item label="Số tiền" className='mt-4'>
                  <InputNumber
                    value={sharedShippingCost}
                    onChange={(value) => setSharedShippingCost(value || 0)}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => Number(value!.replace(/\$\s?|(,*)/g, ''))}
                    style={{ width: '100%' }}
                    addonAfter="VND"
                    min={0}
                  />
                </Form.Item>
                
                <Form.Item label="Phương thức phân bổ">
                  <Radio.Group 
                    value={allocationMethod}
                    onChange={(e) => setAllocationMethod(e.target.value)}
                  >
                    <Space direction="vertical">
                      <Radio value="by_value">
                        Theo giá trị (sản phẩm đắt chịu phí nhiều hơn)
                      </Radio>
                      <Radio value="by_quantity">
                        Theo số lượng (chia đều)
                      </Radio>
                    </Space>
                  </Radio.Group>
                </Form.Item>
              </>
            )}
          </Card>

          {/* Phần upload ảnh hóa đơn */}
          <Card title="Hình ảnh hóa đơn (Tùy chọn)" className='mt-4'>
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={({ fileList: newFileList }) => setFileList(newFileList)}
              beforeUpload={() => false} // Prevent auto upload
              accept="image/*"
              multiple
            >
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            </Upload>
          </Card>

          {/* Hiển thị tổng tiền chi tiết */}
          <div className='mt-4 p-4 bg-gray-50 rounded-lg'>
            <div style={{ fontSize: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Tổng tiền hàng:</span>
                <strong>{calculateTotals().totalProductValue.toLocaleString('vi-VN')} VND</strong>
              </div>
              
              {calculateTotals().totalIndividualShipping > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Phí vận chuyển riêng:</span>
                  <strong>{calculateTotals().totalIndividualShipping.toLocaleString('vi-VN')} VND</strong>
                </div>
              )}
              
              {calculateTotals().totalSharedShipping > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Phí vận chuyển chung:</span>
                  <strong>{calculateTotals().totalSharedShipping.toLocaleString('vi-VN')} VND</strong>
                </div>
              )}
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginTop: 16, 
                paddingTop: 16, 
                borderTop: '2px solid #d9d9d9',
                fontSize: 18,
              }}>
                <span>TỔNG THANH TOÁN:</span>
                <strong style={{ color: '#52c41a' }}>
                  {calculateTotals().grandTotal.toLocaleString('vi-VN')} VND
                </strong>
              </div>
            </div>
          </div>

          <div className='mt-6 flex justify-end'>
            <Button
              type='primary'
              htmlType='submit'
              icon={<SaveOutlined />}
              loading={createReceiptMutation.isPending}
              size='large'
            >
              Tạo phiếu nhập hàng
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default InventoryReceiptCreate
