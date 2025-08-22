import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Row,
  Col,
  Button,
  Form,
  Input,
  Table,
  Space,
  Typography,
  Alert,
  InputNumber,
  DatePicker,
  Select,
  Popconfirm,
  message,
  Divider
} from 'antd'
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  CheckOutlined,
  EditOutlined,
  CloseOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

import {
  CreateInventoryReceiptRequest,
  CreateInventoryReceiptItemRequest
} from '@/models/inventory.model'
import { useCreateInventoryReceipt } from '@/queries/use-inventory'
import { useProducts } from '@/queries/use-product'

const { Title, Text } = Typography
const { TextArea } = Input

interface InventoryReceiptItemForm extends CreateInventoryReceiptItemRequest {
  key: string
  productName?: string
  totalPrice?: string
}

const InventoryReceiptCreate: React.FC = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()

  // State quản lý danh sách sản phẩm trong phiếu
  const [items, setItems] = useState<InventoryReceiptItemForm[]>([])
  const [editingKey, setEditingKey] = useState<string>('')

  // Queries
  const { data: productsData } = useProducts()
  const createReceiptMutation = useCreateInventoryReceipt()

  // Lấy danh sách sản phẩm để hiển thị trong select
  const products = productsData?.data?.items || []

  // Handlers
  const handleBack = () => {
    navigate('/inventory/receipts')
  }

  const handleAddItem = () => {
    const newKey = Date.now().toString()
    const newItem: InventoryReceiptItemForm = {
      key: newKey,
      productId: 0,
      quantity: 1,
      unitPrice: '0',
      expiryDate: '',
      batchNumber: '',
      notes: ''
    }
    setItems([...items, newItem])
    setEditingKey(newKey)
  }

  const handleDeleteItem = (key: string) => {
    setItems(items.filter(item => item.key !== key))
    if (editingKey === key) {
      setEditingKey('')
    }
  }

  const handleEditItem = (key: string) => {
    setEditingKey(key)
  }

  const handleSaveItem = (key: string) => {
    const item = items.find(item => item.key === key)
    if (!item) return

    // Validate item
    if (!item.productId || item.productId === 0) {
      message.error('Vui lòng chọn sản phẩm')
      return
    }
    if (!item.quantity || item.quantity <= 0) {
      message.error('Vui lòng nhập số lượng hợp lệ')
      return
    }
    if (!item.unitPrice || parseFloat(item.unitPrice) <= 0) {
      message.error('Vui lòng nhập đơn giá hợp lệ')
      return
    }

    // Calculate total price
    const totalPrice = (item.quantity * parseFloat(item.unitPrice)).toString()
    const updatedItem = { ...item, totalPrice }

    setItems(items.map(i => i.key === key ? updatedItem : i))
    setEditingKey('')
  }

  const handleCancelEdit = () => {
    setEditingKey('')
  }

  const handleItemChange = (key: string, field: keyof InventoryReceiptItemForm, value: unknown) => {
    setItems(items.map(item => {
      if (item.key === key) {
        const updatedItem = { ...item, [field]: value }
        
        // Tự động tính tổng tiền khi thay đổi số lượng hoặc đơn giá
        if (field === 'quantity' || field === 'unitPrice') {
          const quantity = field === 'quantity' ? (value as number) : item.quantity
          const unitPrice = field === 'unitPrice' ? (value as string) : item.unitPrice
          updatedItem.totalPrice = (quantity * parseFloat(unitPrice || '0')).toString()
        }

        // Tự động cập nhật tên sản phẩm khi chọn sản phẩm
        if (field === 'productId') {
          const product = products.find(p => p.id === value)
          if (product) {
            updatedItem.productName = product.name || product.productName
          }
        }

        return updatedItem
      }
      return item
    }))
  }

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      // Validate có ít nhất 1 sản phẩm
      if (items.length === 0) {
        message.error('Vui lòng thêm ít nhất một sản phẩm')
        return
      }

      // Validate tất cả items đã hoàn thành
      const hasIncompleteItems = items.some(item => 
        !item.productId || 
        item.productId === 0 || 
        !item.quantity || 
        item.quantity <= 0 || 
        !item.unitPrice || 
        parseFloat(item.unitPrice) <= 0
      )

      if (hasIncompleteItems) {
        message.error('Vui lòng hoàn thành thông tin tất cả sản phẩm')
        return
      }

      // Tạo request data
      const requestData: CreateInventoryReceiptRequest = {
        description: values.description as string | undefined,
        supplierName: values.supplierName as string | undefined,
        supplierContact: values.supplierContact as string | undefined,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          expiryDate: item.expiryDate || undefined,
          batchNumber: item.batchNumber || undefined,
          notes: item.notes || undefined
        }))
      }

      await createReceiptMutation.mutateAsync(requestData)
      message.success('Tạo phiếu nhập hàng thành công!')
      navigate('/inventory/receipts')
    } catch (error) {
      console.error('Error creating receipt:', error)
    }
  }

  // Tính tổng tiền của tất cả sản phẩm
  const totalAmount = items.reduce((sum, item) => {
    return sum + (item.quantity * parseFloat(item.unitPrice || '0'))
  }, 0)

  // Cấu hình cột cho bảng sản phẩm
  const itemColumns: ColumnsType<InventoryReceiptItemForm> = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => index + 1
    },
    {
      title: 'Sản phẩm *',
      dataIndex: 'productId',
      key: 'productId',
      width: 250,
      render: (productId: number, record: InventoryReceiptItemForm) => {
        const isEditing = editingKey === record.key
        return isEditing ? (
          <Select
            value={productId || undefined}
            placeholder="Chọn sản phẩm"
            style={{ width: '100%' }}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={products.map(product => ({
              value: product.id,
              label: product.name || product.productName
            }))}
            onChange={(value) => handleItemChange(record.key, 'productId', value)}
          />
        ) : (
          record.productName || products.find(p => p.id === productId)?.name || '-'
        )
      }
    },
    {
      title: 'Số lượng *',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      align: 'right',
      render: (quantity: number, record: InventoryReceiptItemForm) => {
        const isEditing = editingKey === record.key
        return isEditing ? (
          <InputNumber
            value={quantity}
            min={1}
            style={{ width: '100%' }}
            onChange={(value) => handleItemChange(record.key, 'quantity', value || 1)}
          />
        ) : (
          new Intl.NumberFormat('vi-VN').format(quantity || 0)
        )
      }
    },
    {
      title: 'Đơn giá *',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 150,
      align: 'right',
      render: (price: string, record: InventoryReceiptItemForm) => {
        const isEditing = editingKey === record.key
        return isEditing ? (
          <InputNumber
            value={parseFloat(price || '0')}
            min={0}
            step={1000}
            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => parseFloat(value!.replace(/\$\s?|(,*)/g, '')) || 0}
            style={{ width: '100%' }}
            onChange={(value) => handleItemChange(record.key, 'unitPrice', value?.toString() || '0')}
          />
        ) : (
          new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
          }).format(parseFloat(price || '0'))
        )
      }
    },
    {
      title: 'Thành tiền',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 150,
      align: 'right',
      render: (_, record: InventoryReceiptItemForm) => {
        const total = record.quantity * parseFloat(record.unitPrice || '0')
        return (
          <Text strong style={{ color: '#52c41a' }}>
            {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND'
            }).format(total)}
          </Text>
        )
      }
    },
    {
      title: 'Hạn sử dụng',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      width: 150,
      render: (date: string, record: InventoryReceiptItemForm) => {
        const isEditing = editingKey === record.key
        return isEditing ? (
          <DatePicker
            value={date ? dayjs(date) : null}
            format="DD/MM/YYYY"
            style={{ width: '100%' }}
            onChange={(dateValue) => 
              handleItemChange(record.key, 'expiryDate', dateValue?.format('YYYY-MM-DD') || '')
            }
          />
        ) : (
          date ? dayjs(date).format('DD/MM/YYYY') : '-'
        )
      }
    },
    {
      title: 'Số lô',
      dataIndex: 'batchNumber',
      key: 'batchNumber',
      width: 120,
      render: (batch: string, record: InventoryReceiptItemForm) => {
        const isEditing = editingKey === record.key
        return isEditing ? (
          <Input
            value={batch}
            placeholder="Nhập số lô"
            onChange={(e) => handleItemChange(record.key, 'batchNumber', e.target.value)}
          />
        ) : (
          batch || '-'
        )
      }
    },
    {
      title: 'Ghi chú',
      dataIndex: 'notes',
      key: 'notes',
      width: 150,
      render: (notes: string, record: InventoryReceiptItemForm) => {
        const isEditing = editingKey === record.key
        return isEditing ? (
          <Input
            value={notes}
            placeholder="Ghi chú"
            onChange={(e) => handleItemChange(record.key, 'notes', e.target.value)}
          />
        ) : (
          notes || '-'
        )
      }
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      align: 'center',
      render: (_, record: InventoryReceiptItemForm) => {
        const isEditing = editingKey === record.key
        
        if (isEditing) {
          return (
            <Space size="small">
              <Button
                type="text"
                icon={<CheckOutlined />}
                onClick={() => handleSaveItem(record.key)}
              />
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={handleCancelEdit}
              />
            </Space>
          )
        }
        
        return (
          <Space size="small">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditItem(record.key)}
            />
            <Popconfirm
              title="Xóa sản phẩm"
              description="Bạn có chắc chắn muốn xóa sản phẩm này?"
              onConfirm={() => handleDeleteItem(record.key)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button
                type="text"
                icon={<DeleteOutlined />}
                danger
              />
            </Popconfirm>
          </Space>
        )
      }
    }
  ]

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Card style={{ marginBottom: '16px' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
                Quay lại
              </Button>
              <Title level={3} style={{ margin: 0 }}>
                Tạo phiếu nhập hàng mới
              </Title>
            </Space>
          </Col>
        </Row>
      </Card>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Row gutter={[16, 16]}>
          {/* Thông tin chung */}
          <Col xs={24} lg={12}>
            <Card title="Thông tin phiếu nhập" size="small">
              <Form.Item
                label="Nhà cung cấp"
                name="supplierName"
                rules={[{ required: true, message: 'Vui lòng nhập tên nhà cung cấp' }]}
              >
                <Input placeholder="Nhập tên nhà cung cấp" />
              </Form.Item>
              
              <Form.Item
                label="Liên hệ nhà cung cấp"
                name="supplierContact"
              >
                <Input placeholder="Số điện thoại hoặc email" />
              </Form.Item>
              
              <Form.Item
                label="Mô tả"
                name="description"
              >
                <TextArea 
                  rows={4} 
                  placeholder="Mô tả chi tiết về phiếu nhập hàng"
                />
              </Form.Item>
            </Card>
          </Col>

          {/* Tổng quan */}
          <Col xs={24} lg={12}>
            <Card title="Tổng quan" size="small">
              <div style={{ padding: '16px 0' }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Text type="secondary">Số lượng sản phẩm:</Text>
                    <br />
                    <Text strong style={{ fontSize: '18px' }}>
                      {items.length}
                    </Text>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">Tổng tiền:</Text>
                    <br />
                    <Text strong style={{ fontSize: '18px', color: '#52c41a' }}>
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(totalAmount)}
                    </Text>
                  </Col>
                </Row>
                
                <Alert
                  message="Lưu ý"
                  description="Phiếu nhập hàng sau khi tạo sẽ ở trạng thái 'Nháp'. Bạn có thể chỉnh sửa và gửi duyệt sau."
                  type="info"
                  showIcon
                  style={{ marginTop: '16px' }}
                />
              </div>
            </Card>
          </Col>
        </Row>

        <Divider />

        {/* Danh sách sản phẩm */}
        <Card>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>
              Danh sách sản phẩm
            </Title>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={handleAddItem}
            >
              Thêm sản phẩm
            </Button>
          </div>

          <Table
            columns={itemColumns}
            dataSource={items}
            rowKey="key"
            pagination={false}
            size="small"
            scroll={{ x: 1200 }}
            locale={{
              emptyText: (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <Text type="secondary">
                    Chưa có sản phẩm nào. Nhấn &quot;Thêm sản phẩm&quot; để bắt đầu.
                  </Text>
                </div>
              )
            }}
          />

          {items.length > 0 && (
            <div style={{ 
              marginTop: '16px', 
              padding: '16px', 
              backgroundColor: '#fafafa', 
              borderRadius: '6px',
              textAlign: 'right'
            }}>
              <Text strong style={{ fontSize: '16px' }}>
                Tổng cộng: {' '}
                <span style={{ color: '#52c41a', fontSize: '18px' }}>
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                  }).format(totalAmount)}
                </span>
              </Text>
            </div>
          )}
        </Card>

        {/* Nút submit */}
        <Card style={{ marginTop: '16px', textAlign: 'right' }}>
          <Space>
            <Button onClick={handleBack}>
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={createReceiptMutation.isPending}
              disabled={items.length === 0}
            >
              Tạo phiếu nhập
            </Button>
          </Space>
        </Card>
      </Form>
    </div>
  )
}

export default InventoryReceiptCreate