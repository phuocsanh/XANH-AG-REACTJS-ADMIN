import React, { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
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
import NumberInput from "@/components/common/number-input"

import {
  CreateInventoryReceiptRequest,
  InventoryReceiptItemForm,
  InventoryReceiptStatus,
  getInventoryReceiptStatusText,
} from "@/models/inventory.model"
import { 
  useCreateInventoryReceiptMutation,
  useUpdateInventoryReceiptMutation,
  useInventoryReceiptQuery,
  useInventoryReceiptItemsQuery,
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
  const { id } = useParams<{ id: string }>()
  const receiptId = id ? Number(id) : undefined
  const isEditMode = !!receiptId
  
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
  
  // State tìm kiếm sản phẩm
  const [searchTerm, setSearchTerm] = useState("")

  // Sử dụng hook product search ở cấp cao hơn
  const {
    data,
    isLoading,
    isFetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useProductSearch(searchTerm, 20, true)

  // Flatten data từ tất cả pages
  const productOptions = useMemo(() => {
    if (!data?.pages) {
      return []
    }

    // Map product data để hiển thị trade_name
    return data.pages.flatMap((page) => {
      if (!page || !page.data) {
        return []
      }

      return page.data.map((product: any) => ({
        ...product,
        // Ưu tiên hiển thị trade_name (hiệu thuốc), fallback về name
        label: product.trade_name || product.name,
        // Giữ các trường khác để sử dụng cho logic chọn
        value: product.id,
      }))
    })
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
        onSearch: setSearchTerm, // Thêm hàm search
      }

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
  const updateReceiptMutation = useUpdateInventoryReceiptMutation()
  const uploadFileMutation = useUploadFileMutation()
  const attachImageMutation = useAttachImageToReceiptMutation()
  const { data: suppliersData, isLoading: suppliersLoading } = useSuppliersQuery({ limit: 100 })
  
  // Load dữ liệu khi edit mode (hooks đã có enabled built-in)
  const { data: existingReceipt, isLoading: isLoadingReceipt } = useInventoryReceiptQuery(receiptId || 0)
  const { data: existingItems, isLoading: isLoadingItems } = useInventoryReceiptItemsQuery(receiptId || 0)

  // Pre-fill form khi load dữ liệu trong edit mode
  useEffect(() => {
    if (isEditMode && existingReceipt && existingItems && !isLoadingReceipt && !isLoadingItems) {
      // Set form values
      form.setFieldsValue({
        supplierId: existingReceipt.supplier_id,
        status: existingReceipt.status_code || existingReceipt.status,
        description: existingReceipt.notes,
      })

      // Set items (dùng type assertion để truy cập các property)
      const mappedItems: InventoryReceiptItemForm[] = existingItems.map((item: any, index) => ({
        key: `${item.id || index}`,
        product_id: item.product_id,
        product_name: item.product_name || item.product?.trade_name || item.product?.name || '',
        quantity: item.quantity,
        unit_cost: Number(item.unit_cost || item.unitPrice || 0),
        total_price: Number(item.total_price || 0),
        individual_shipping_cost: Number(item.individual_shipping_cost || 0),
        notes: item.notes,
      }))
      setItems(mappedItems)

      // Set shipping costs nếu có (dùng type assertion)
      const receipt = existingReceipt as any
      if (receipt.shared_shipping_cost) {
        setHasSharedShipping(true)
        setSharedShippingCost(Number(receipt.shared_shipping_cost))
      }
      if (receipt.shipping_allocation_method) {
        setAllocationMethod(receipt.shipping_allocation_method as 'by_value' | 'by_quantity')
      }

      // Set images
      if (receipt.images && Array.isArray(receipt.images)) {
        const images = receipt.images.map((url: string, index: number) => ({
          uid: `-${index}`,
          name: `Image ${index + 1}`,
          status: 'done',
          url: url,
        }));
        setFileList(images as any);
      }
    }
  }, [isEditMode, existingReceipt, existingItems, isLoadingReceipt, isLoadingItems, form])

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
    setItems((prevItems) => 
      prevItems.map((item) => {
        if (item.key === key) {
          const updatedItem = { ...item, [field]: value }

          // Tự động cập nhật tên sản phẩm và đơn giá khi chọn sản phẩm
          // (Logic này vẫn giữ lại như fallback, dù con đã xử lý)
          if (field === "product_id") {
            const selectedProduct = productOptions.find((p: any) => p.id === (value as number)) as any
            if (selectedProduct) {
               // Fallback: dùng label nếu không có name
               updatedItem.product_name = selectedProduct.trade_name || selectedProduct.name || selectedProduct.label || ""
               
               if (selectedProduct.cost_price !== undefined) {
                   updatedItem.unit_cost = selectedProduct.cost_price;
               }
            }
          }

          // Tự động tính toán total_price
          if (field === "quantity" || field === "unit_cost" || field === "product_id") {
             const quantity = field === "quantity" ? (value as number) : updatedItem.quantity
             const unit_cost = field === "unit_cost" ? (value as number) : updatedItem.unit_cost
             
             updatedItem.total_price = quantity * unit_cost
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
      // 1. Lọc ra các sản phẩm hợp lệ (đã chọn sản phẩm)
      const validItems = items.filter(
        (item) => item.product_id && item.product_id !== 0
      )
      


      // 2. Kiểm tra nếu không có sản phẩm nào hợp lệ
      if (validItems.length === 0) {

        message.error("Vui lòng thêm ít nhất một sản phẩm")
        return
      }

      // 3. Validate chi tiết các sản phẩm hợp lệ (số lượng, đơn giá)
      const hasInvalidDetails = validItems.some(
        (item) => !item.quantity || item.quantity < 1 || item.unit_cost < 0
      )


      if (hasInvalidDetails) {

        message.error("Vui lòng kiểm tra số lượng và đơn giá của các sản phẩm")
        return
       
      }
      
      // Tính lại tổng tiền dựa trên validItems để đảm bảo chính xác
      const totalProductValue = validItems.reduce((sum, item) => sum + item.total_price, 0)
      const totalIndividualShipping = validItems.reduce((sum, item) => sum + (item.individual_shipping_cost || 0), 0)
      const totalSharedShipping = hasSharedShipping ? sharedShippingCost : 0
      const grandTotal = totalProductValue + totalIndividualShipping + totalSharedShipping

      // 1. Xử lý upload ảnh
      let imageUrls: string[] = [];
      if (fileList.length > 0) {
        try {
          const needsUpload = fileList.some(f => f.originFileObj);
          if (needsUpload) message.loading("Đang xử lý hình ảnh...");

          for (const file of fileList) {
            if (file.url) {
              // Ảnh đã có sẵn (từ server)
              imageUrls.push(file.url);
            } else if (file.originFileObj) {
              // Ảnh mới cần upload
              const uploadResult = await uploadFileMutation.mutateAsync(file.originFileObj);
              imageUrls.push((uploadResult as any).data.url);
            } else if (file.response?.data?.url) {
              // Ảnh vừa upload xong (nếu component upload tự xử lý)
              imageUrls.push(file.response.data.url);
            }
          }
        } catch (uploadError) {
          console.error("Lỗi khi upload ảnh:", uploadError);
          message.error("Có lỗi khi upload ảnh");
          return;
        }
      }

      // 2. Chuẩn bị dữ liệu chung
      const commonData = {
        supplier_id: values.supplierId as number,
        total_amount: grandTotal,
        notes: values.description as string | undefined,
        status: (values.status as string) || "draft",
        created_by: 1, // Dùng cho Create, ignore ở Update
        
        // Phí vận chuyển chung
        ...(hasSharedShipping && {
          shared_shipping_cost: sharedShippingCost,
          shipping_allocation_method: allocationMethod,
        }),
        
        // Images (chỉ gửi nếu có)
        ...(imageUrls.length > 0 && { images: imageUrls }),
        
        // Items
        items: validItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          total_price: item.total_price,
          notes: item.notes || undefined,
          
          // Phí vận chuyển riêng
          ...((item.individual_shipping_cost || 0) > 0 && {
            individual_shipping_cost: item.individual_shipping_cost,
          }),
        })),
      };

      // 3. Gọi API Create hoặc Update
      if (isEditMode && receiptId) {
        // === UPDATE MODE ===
        await updateReceiptMutation.mutateAsync({ id: receiptId, receipt: commonData as any })
        message.success("Cập nhật phiếu nhập hàng thành công!")
      } else {
        // === CREATE MODE ===
        await createReceiptMutation.mutateAsync(commonData as CreateInventoryReceiptRequest)
        message.success("Tạo phiếu nhập hàng thành công!")
      }
      
      navigate("/inventory/receipts")
    } catch (error) {
      console.error("Error saving receipt:", error)
      message.error(isEditMode ? "Có lỗi xảy ra khi cập nhật phiếu nhập hàng" : "Có lỗi xảy ra khi tạo phiếu nhập hàng")
    }
  }

  // Sử dụng card layout cho cả mobile và tablet
  const useCardLayout = isMobile || isTablet

  // Loading state khi đang load dữ liệu trong edit mode
  if (isEditMode && (isLoadingReceipt || isLoadingItems)) {
    return (
      <div className='p-4 flex justify-center items-center' style={{ minHeight: '400px' }}>
        <div className='text-center'>
          <div className='mb-4'>Đang tải dữ liệu...</div>
        </div>
      </div>
    )
  }

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
          {isEditMode ? "Chỉnh sửa phiếu nhập hàng" : "Tạo phiếu nhập hàng"}
        </Title>
      </div>

      <Card className='mb-4'>
        <Form 
          form={form} 
          layout='vertical' 
          onFinish={handleSubmit}
          onFinishFailed={(errorInfo) => {

            message.error("Vui lòng kiểm tra các trường bắt buộc (Nhà cung cấp, Trạng thái...)");
          }}
        >
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
                {Object.values(InventoryReceiptStatus).map(status => (
                  <Select.Option key={status} value={status}>
                    {getInventoryReceiptStatusText(status)}
                  </Select.Option>
                ))}
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
                  <NumberInput
                    value={sharedShippingCost}
                    onChange={(value) => setSharedShippingCost(value || 0)}
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
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
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
              loading={isEditMode ? updateReceiptMutation.isPending : createReceiptMutation.isPending}
              size='large'
            >
              {isEditMode ? "Cập nhật phiếu nhập hàng" : "Tạo phiếu nhập hàng"}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default InventoryReceiptCreate
