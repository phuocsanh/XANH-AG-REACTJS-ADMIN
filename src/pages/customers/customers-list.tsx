import * as React from "react"
import { Customer } from "@/models/customer"
import {
  useCustomersQuery,
  useCustomerInvoicesQuery,
  useCustomerDebtsQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} from "@/queries/customer"
import {
  Button,
  Input,
  Modal,
  Tag,
  Space,
  Form,
  Select,
  Tabs,
  Card,
  Descriptions,
} from "antd"
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons"
import DataTable from "@/components/common/data-table"
import FilterHeader from "@/components/common/filter-header"
import { ConfirmModal } from "@/components/common"
import { customerTypeLabels } from "./form-config"
import { TablePaginationConfig, TableProps } from "antd"
import { FilterValue, SorterResult } from "antd/es/table/interface"

// Extend Customer interface để tương thích với DataTable
interface ExtendedCustomer extends Customer {
  key: string
  [key: string]: any
}

// Type for customer form values
interface CustomerFormValues {
  code: string
  name: string
  phone: string
  email?: string
  address?: string
  type: "regular" | "vip" | "wholesale"
  tax_code?: string
  notes?: string
}

const CustomersList: React.FC = () => {
  // State quản lý UI
  const [filters, setFilters] = React.useState<Record<string, any>>({})
  const [isFormModalVisible, setIsFormModalVisible] =
    React.useState<boolean>(false)
  const [deleteConfirmVisible, setDeleteConfirmVisible] =
    React.useState<boolean>(false)
  const [isDetailModalVisible, setIsDetailModalVisible] =
    React.useState<boolean>(false)
  const [deletingCustomer, setDeletingCustomer] =
    React.useState<Customer | null>(null)
  const [editingCustomer, setEditingCustomer] = React.useState<Customer | null>(
    null
  )
  const [viewingCustomer, setViewingCustomer] = React.useState<Customer | null>(
    null
  )
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [detailTab, setDetailTab] = React.useState("info")

  // Form instance
  const [form] = Form.useForm<CustomerFormValues>()

  // Handle Table Change
  const handleTableChange: TableProps<ExtendedCustomer>['onChange'] = (
    pagination,
    tableFilters,
    sorter,
    extra
  ) => {
    setCurrentPage(pagination.current || 1)
    setPageSize(pagination.pageSize || 10)
    
    const newFilters = { ...filters }

    // Handle Type filter
    if (tableFilters.type) {
        if (tableFilters.type.length > 0) {
            newFilters.type = tableFilters.type[0]
        } else {
            delete newFilters.type
        }
    }

    setFilters(newFilters)
  }

  // Handle Filter Change
  const handleFilterChange = (key: string, value: any) => {
      const newFilters = { ...filters, [key]: value }
      if (!value) delete newFilters[key]
      setFilters(newFilters)
      setCurrentPage(1) // Reset to first page on filter change
  }

  // Sử dụng query hooks
  const { data: customersData, isLoading } = useCustomersQuery({
    page: currentPage,
    limit: pageSize,
    ...filters
  })

  const { data: customerInvoices } = useCustomerInvoicesQuery(
    viewingCustomer?.id || 0
  )
  const { data: customerDebts } = useCustomerDebtsQuery(
    viewingCustomer?.id || 0
  )

  const createMutation = useCreateCustomerMutation()
  const updateMutation = useUpdateCustomerMutation()
  const deleteMutation = useDeleteCustomerMutation()

  // Hàm xử lý thêm khách hàng
  const handleAddCustomer = () => {
    setEditingCustomer(null)
    form.resetFields()
    form.setFieldsValue({
      code: "",
      name: "",
      phone: "",
      email: "",
      address: "",
      type: "regular",
      tax_code: "",
      notes: "",
    })
    setIsFormModalVisible(true)
  }

  // Hàm xử lý chỉnh sửa khách hàng
  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer)
    form.setFieldsValue({
      code: customer.code,
      name: customer.name,
      phone: customer.phone,
      email: customer.email || "",
      address: customer.address || "",
      type: customer.type,
      tax_code: customer.tax_code || "",
      notes: customer.notes || "",
    })
    setIsFormModalVisible(true)
  }

  // Hàm xem chi tiết khách hàng
  const handleViewCustomer = (customer: Customer) => {
    setViewingCustomer(customer)
    setDetailTab("info")
    setIsDetailModalVisible(true)
  }

  // Xử lý xóa khách hàng
  const handleDelete = (customer: Customer) => {
    setDeletingCustomer(customer)
    setDeleteConfirmVisible(true)
  }

  // Xử lý xác nhận xóa
  const handleConfirmDelete = async () => {
    if (!deletingCustomer) return

    try {
      await deleteMutation.mutateAsync(deletingCustomer.id)
      setDeleteConfirmVisible(false)
      setDeletingCustomer(null)
    } catch (error) {
      console.error("Error deleting customer:", error)
      setDeleteConfirmVisible(false)
      setDeletingCustomer(null)
    }
  }

  // Xử lý hủy bỏ xóa
  const handleCancelDelete = () => {
    setDeleteConfirmVisible(false)
    setDeletingCustomer(null)
  }

  // Xử lý submit form
  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (editingCustomer) {
        await updateMutation.mutateAsync({
          id: editingCustomer.id,
          customer: values,
        })
      } else {
        await createMutation.mutateAsync(values)
      }

      setIsFormModalVisible(false)
      form.resetFields()
      setEditingCustomer(null)
    } catch (error) {
      console.error("Form validation failed:", error)
    }
  }

  // Xử lý đóng form modal
  const handleCloseFormModal = () => {
    setIsFormModalVisible(false)
    form.resetFields()
    setEditingCustomer(null)
  }

  // Xử lý đóng detail modal
  const handleCloseDetailModal = () => {
    setIsDetailModalVisible(false)
    setViewingCustomer(null)
  }

  // Lấy danh sách khách hàng
  const getCustomerList = (): ExtendedCustomer[] => {
    if (!customersData?.data?.items) return []

    return customersData.data.items.map((customer: Customer) => ({
      ...customer,
      key: customer.id.toString(),
    }))
  }

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value)
  }

  const loading =
    isLoading || createMutation.isPending || updateMutation.isPending

  // Cấu hình columns cho DataTable
  const columns = [
    {
      key: "code",
      title: (
        <FilterHeader 
            title="Mã KH" 
            dataIndex="code" 
            value={filters.code} 
            onChange={(val) => handleFilterChange('code', val)}
            inputType="text"
        />
      ),
      width: 150,
      render: (record: ExtendedCustomer) => (
        <div className='font-medium'>{record.code}</div>
      ),
    },
    {
      key: "name",
      title: (
        <FilterHeader 
            title="Tên khách hàng" 
            dataIndex="name" 
            value={filters.name} 
            onChange={(val) => handleFilterChange('name', val)}
            inputType="text"
        />
      ),
      width: 250,
      render: (record: ExtendedCustomer) => (
        <div className='font-medium'>{record.name}</div>
      ),
    },
    {
      key: "phone",
      title: (
        <FilterHeader 
            title="Số điện thoại" 
            dataIndex="phone" 
            value={filters.phone} 
            onChange={(val) => handleFilterChange('phone', val)}
            inputType="text"
        />
      ),
      width: 150,
      render: (record: ExtendedCustomer) => <div>{record.phone}</div>,
    },
    {
      key: "type",
      title: "Loại KH",
      width: 140,
      filters: [
          { text: "Thường", value: "regular" },
          { text: "VIP", value: "vip" },
          { text: "Sỉ", value: "wholesale" },
      ],
      filteredValue: filters.type ? [filters.type] : null,
      filterMultiple: false,
      render: (record: ExtendedCustomer) => {
        const colorMap = {
          regular: "default",
          vip: "gold",
          wholesale: "blue",
        } as const
        return (
          <Tag color={colorMap[record.type] || "default"}>
            {customerTypeLabels[record.type]}
          </Tag>
        )
      },
    },
    {
      key: "total_purchases",
      title: "Tổng mua",
      width: 100,
      render: (record: ExtendedCustomer) => (
        <div>{record.total_purchases || 0} đơn</div>
      ),
    },
    {
      key: "total_spent",
      title: "Tổng chi tiêu",
      width: 130,
      render: (record: ExtendedCustomer) => (
        <div className='text-green-600 font-medium'>
          {formatCurrency(record.total_spent || 0)}
        </div>
      ),
    },
    {
      key: "current_debt",
      title: "Công nợ",
      width: 130,
      render: (record: ExtendedCustomer) => {
        const debt = record.current_debt || 0
        return (
          <div className={debt > 0 ? "text-red-600 font-medium" : ""}>
            {formatCurrency(debt)}
          </div>
        )
      },
    },
    {
      key: "action",
      title: "Hành động",
      width: 200,
      render: (record: ExtendedCustomer) => (
        <Space size='middle'>
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewCustomer(record)}
            title='Xem chi tiết'
          />
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEditCustomer(record)}
            title='Chỉnh sửa'
          />
          <Button
            danger
            icon={<DeleteOutlined />}
            title='Xóa'
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ]

  // Tab items cho detail modal
  const detailTabItems = [
    {
      key: "info",
      label: "Thông tin chung",
      children: viewingCustomer && (
        <div className='mt-4'>
          <Descriptions bordered column={2}>
            <Descriptions.Item label='Mã khách hàng' span={1}>
              {viewingCustomer.code}
            </Descriptions.Item>
            <Descriptions.Item label='Loại khách hàng' span={1}>
              <Tag
                color={
                  viewingCustomer.type === "vip"
                    ? "gold"
                    : viewingCustomer.type === "wholesale"
                      ? "blue"
                      : "default"
                }
              >
                {customerTypeLabels[viewingCustomer.type]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label='Tên khách hàng' span={2}>
              {viewingCustomer.name}
            </Descriptions.Item>
            <Descriptions.Item label='Số điện thoại' span={1}>
              {viewingCustomer.phone}
            </Descriptions.Item>
            <Descriptions.Item label='Email' span={1}>
              {viewingCustomer.email || "-"}
            </Descriptions.Item>
            <Descriptions.Item label='Địa chỉ' span={2}>
              {viewingCustomer.address || "-"}
            </Descriptions.Item>
            <Descriptions.Item label='Mã số thuế' span={2}>
              {viewingCustomer.tax_code || "-"}
            </Descriptions.Item>
            <Descriptions.Item label='Tổng số lần mua' span={1}>
              <span className='text-blue-600 font-medium'>
                {viewingCustomer.total_purchases} đơn
              </span>
            </Descriptions.Item>
            <Descriptions.Item label='Tổng chi tiêu' span={1}>
              <span className='text-green-600 font-medium'>
                {formatCurrency(viewingCustomer.total_spent)}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label='Công nợ hiện tại' span={2}>
              <span className='text-red-600 font-medium'>
                {formatCurrency(viewingCustomer.current_debt || 0)}
              </span>
            </Descriptions.Item>
            {viewingCustomer.notes && (
              <Descriptions.Item label='Ghi chú' span={2}>
                {viewingCustomer.notes}
              </Descriptions.Item>
            )}
          </Descriptions>
        </div>
      ),
    },
    {
      key: "invoices",
      label: "Lịch sử mua hàng",
      children: (
        <div className='mt-4'>
          {customerInvoices && customerInvoices.length > 0 ? (
            <Space direction='vertical' className='w-full' size='middle'>
              {customerInvoices.map((invoice: any) => (
                <Card key={invoice.id} size='small'>
                  <div className='grid grid-cols-4 gap-4'>
                    <div>
                      <div className='text-gray-500 text-sm'>Mã HĐ</div>
                      <div className='font-medium'>{invoice.code}</div>
                    </div>
                    <div>
                      <div className='text-gray-500 text-sm'>Ngày</div>
                      <div>
                        {new Date(invoice.date).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                    <div>
                      <div className='text-gray-500 text-sm'>Tổng tiền</div>
                      <div className='text-green-600 font-medium'>
                        {formatCurrency(invoice.final_amount)}
                      </div>
                    </div>
                    <div>
                      <div className='text-gray-500 text-sm'>Trạng thái</div>
                      <Tag
                        color={invoice.status === "PAID" ? "success" : "warning"}
                      >
                        {invoice.status}
                      </Tag>
                    </div>
                  </div>
                </Card>
              ))}
            </Space>
          ) : (
            <div className='text-center text-gray-500 py-8'>
              Chưa có lịch sử mua hàng
            </div>
          )}
        </div>
      ),
    },
    {
      key: "debts",
      label: "Công nợ",
      children: (
        <div className='mt-4'>
          {customerDebts && customerDebts.length > 0 ? (
            <Space direction='vertical' className='w-full' size='middle'>
              {customerDebts.map((debt: any) => (
                <Card key={debt.id} size='small'>
                  <div className='grid grid-cols-4 gap-4'>
                    <div>
                      <div className='text-gray-500 text-sm'>Mã phiếu nợ</div>
                      <div className='font-medium'>{debt.code}</div>
                    </div>
                    <div>
                      <div className='text-gray-500 text-sm'>Số tiền nợ</div>
                      <div className='text-red-600 font-medium'>
                        {formatCurrency(debt.remaining_amount)}
                      </div>
                    </div>
                    <div>
                      <div className='text-gray-500 text-sm'>Hạn trả</div>
                      <div>
                        {debt.due_date
                          ? new Date(debt.due_date).toLocaleDateString("vi-VN")
                          : "-"}
                      </div>
                    </div>
                    <div>
                      <div className='text-gray-500 text-sm'>Trạng thái</div>
                      <Tag
                        color={
                          debt.status === "paid"
                            ? "success"
                            : debt.status === "overdue"
                              ? "error"
                              : "warning"
                        }
                      >
                        {debt.status}
                      </Tag>
                    </div>
                  </div>
                </Card>
              ))}
            </Space>
          ) : (
            <div className='text-center text-gray-500 py-8'>
              Không có công nợ
            </div>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className='p-6'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold'>Quản lý Khách hàng</h1>
        <Button
          type='primary'
          icon={<PlusOutlined />}
          onClick={handleAddCustomer}
        >
          Thêm khách hàng
        </Button>
      </div>


      {/* Danh sách khách hàng */}
      <div className='bg-white rounded shadow'>
        <DataTable
          data={getCustomerList()}
          columns={columns}
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: customersData?.data?.total || 0,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total: number) => `Tổng ${total} khách hàng`,
          }}
          onChange={handleTableChange}
          showSearch={false}
          showFilters={false}
        />
      </div>

      {/* Modal form thêm/sửa khách hàng */}
      <Modal
        title={editingCustomer ? "Chỉnh sửa khách hàng" : "Thêm khách hàng mới"}
        open={isFormModalVisible}
        onCancel={handleCloseFormModal}
        footer={[
          <Button key='cancel' onClick={handleCloseFormModal}>
            Hủy
          </Button>,
          <Button
            key='submit'
            type='primary'
            loading={createMutation.isPending || updateMutation.isPending}
            onClick={handleFormSubmit}
          >
            {editingCustomer ? "Cập nhật" : "Tạo mới"}
          </Button>,
        ]}
        width={700}
      >
        <Form form={form} layout='vertical' className='mt-4'>
          <div className='grid grid-cols-2 gap-4'>


            <Form.Item
              label='Tên khách hàng'
              name='name'
              rules={[
                { required: true, message: "Vui lòng nhập tên khách hàng" },
              ]}
            >
              <Input placeholder='Nhập tên khách hàng' />
            </Form.Item>

            <Form.Item
              label='Số điện thoại'
              name='phone'
              rules={[
                { required: true, message: "Vui lòng nhập số điện thoại" },
                { min: 10, message: "Số điện thoại phải có ít nhất 10 số" },
              ]}
            >
              <Input placeholder='Nhập số điện thoại' />
            </Form.Item>

            <Form.Item
              label='Email'
              name='email'
              rules={[{ type: "email", message: "Email không hợp lệ" }]}
            >
              <Input placeholder='Nhập email' />
            </Form.Item>

            <Form.Item label='Loại khách hàng' name='type'>
              <Select>
                <Select.Option value='regular'>Khách hàng thường</Select.Option>
                <Select.Option value='vip'>Khách hàng VIP</Select.Option>
                <Select.Option value='wholesale'>Khách hàng sỉ</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item label='Mã số thuế' name='tax_code'>
              <Input placeholder='Nhập mã số thuế' />
            </Form.Item>
          </div>

          <Form.Item label='Địa chỉ' name='address'>
            <Input placeholder='Nhập địa chỉ' />
          </Form.Item>

          <Form.Item label='Ghi chú' name='notes'>
            <Input.TextArea rows={3} placeholder='Nhập ghi chú' />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal chi tiết khách hàng */}
      <Modal
        title={`Chi tiết khách hàng: ${viewingCustomer?.name || ""}`}
        open={isDetailModalVisible}
        onCancel={handleCloseDetailModal}
        footer={[
          <Button key='close' onClick={handleCloseDetailModal}>
            Đóng
          </Button>,
        ]}
        width={900}
      >
        <Tabs
          activeKey={detailTab}
          onChange={setDetailTab}
          items={detailTabItems}
        />
      </Modal>

      {/* Modal xác nhận xóa */}
      <ConfirmModal
        title='Xác nhận xóa'
        content={
          deletingCustomer
            ? `Bạn có chắc chắn muốn xóa khách hàng "${deletingCustomer.name}"?`
            : "Xác nhận xóa"
        }
        open={deleteConfirmVisible}
        onOk={handleConfirmDelete}
        onCancel={handleCancelDelete}
        okText='Xóa'
        okType='primary'
        cancelText='Hủy'
        confirmLoading={deleteMutation.isPending}
      />
    </div>
  )
}

export default CustomersList
