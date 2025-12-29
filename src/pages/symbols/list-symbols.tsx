import { useState } from "react"
import { Button, message, Space, Modal, Form, Input, Select, Tag } from "antd"
import { PlusOutlined } from "@ant-design/icons"
import { CreateSymbolDto, UpdateSymbolDto } from "../../models/symbol.model"
import DataTable from "../../components/common/data-table"
import { ConfirmModal } from "../../components/common" // Cập nhật import
import {
  useSymbolsQuery,
  useDeleteSymbolMutation,
  useCreateSymbolMutation,
  useUpdateSymbolMutation,
} from "../../queries/symbol"
import {
  Symbol,
  SymbolFormData,
  defaultSymbolValues,
} from "../../models/symbol.model"
import { BASE_STATUS } from "@/constant/base-status"
import { BaseStatus } from "@/constant/base-status"

const { Option } = Select

// Create a new interface that extends Symbol and satisfies Record<string, unknown>
interface SymbolRecord extends Symbol, Record<string, unknown> {}

const ListSymbols = () => {
  const [modalVisible, setModalVisible] = useState(false)
  const [editingSymbol, setEditingSymbol] = useState<SymbolRecord | null>(null)
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false)
  const [deletingSymbol, setDeletingSymbol] = useState<SymbolRecord | null>(
    null
  )
  const [form] = Form.useForm<SymbolFormData>()

  // Sử dụng React Query hook để lấy danh sách ký hiệu
  const { data: symbols, isLoading } = useSymbolsQuery()

  // Mutation hooks
  const deleteSymbolMutation = useDeleteSymbolMutation()
  const createSymbolMutation = useCreateSymbolMutation()
  const updateSymbolMutation = useUpdateSymbolMutation()

  // Chuyển đổi dữ liệu từ API thành format phù hợp với table
  // Không cần chuyển đổi thành PaginationData nữa
  const symbolRows: SymbolRecord[] = (symbols?.data?.items || []).map(
    (symbol: Symbol) => ({
      ...symbol,
    })
  )

  // Xử lý thêm mới ký hiệu
  const handleAdd = () => {
    setEditingSymbol(null)
    form.resetFields()
    setModalVisible(true)
  }

  // Xử lý chỉnh sửa ký hiệu
  const handleEdit = (record: SymbolRecord) => {
    setEditingSymbol(record)
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      description: record.description,
      status: record.status as BaseStatus,
    })
    setModalVisible(true)
  }

  // Xử lý xóa ký hiệu
  const handleDelete = (record: SymbolRecord) => {
    console.log("handleDelete called with record:", record)
    // Set state để hiển thị modal xác nhận
    setDeletingSymbol(record)
    setDeleteConfirmVisible(true)
  }

  // Xử lý xác nhận xóa
  const handleConfirmDelete = async () => {
    if (!deletingSymbol) return

    try {
      console.log("Deleting symbol with ID:", deletingSymbol.id)
      await deleteSymbolMutation.mutateAsync(deletingSymbol.id)
      console.log("Delete symbol successful")
      message.success("Xóa ký hiệu thành công")
      // Đóng modal xác nhận
      setDeleteConfirmVisible(false)
      setDeletingSymbol(null)
    } catch (error) {
      console.error("Error deleting symbol:", error)
      // Hiển thị thông báo lỗi chi tiết hơn
      const errorMessage = (error as Error)?.message || "Không thể xóa ký hiệu"
      message.error(errorMessage)
      // Đóng modal xác nhận
      setDeleteConfirmVisible(false)
      setDeletingSymbol(null)
    }
  }

  // Xử lý hủy bỏ xóa
  const handleCancelDelete = () => {
    setDeleteConfirmVisible(false)
    setDeletingSymbol(null)
  }

  // Xử lý submit form
  const handleSubmit = async (values: SymbolFormData) => {
    try {
      if (editingSymbol) {
        // Cập nhật ký hiệu
        const updateData: UpdateSymbolDto = {
          // Không cần thêm id vào updateData vì id được truyền qua URL parameter
          code: values.code,
          name: values.name,
          description: values.description,
          status: values.status,
        }
        await updateSymbolMutation.mutateAsync({
          id: editingSymbol.id,
          symbolData: updateData,
        })
        message.success("Cập nhật ký hiệu thành công")
      } else {
        // Thêm mới ký hiệu
        const createData: CreateSymbolDto = {
          code: values.code,
          name: values.name,
          description: values.description,
          status: values.status,
        }
        await createSymbolMutation.mutateAsync(createData)
        message.success("Thêm ký hiệu thành công")
      }
      setModalVisible(false)
      form.resetFields()
    } catch (error) {
      console.error("Error saving symbol:", error)
      message.error("Không thể lưu ký hiệu")
    }
  }

  // Render trạng thái
  const renderStatus = (status: string) => {
    const statusConfig = {
      active: { color: "green", text: "Hoạt động" },
      inactive: { color: "red", text: "Không hoạt động" },
      archived: { color: "orange", text: "Lưu trữ" },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || {
      color: "default",
      text: status,
    }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  return (
    <>
      <div className='right-content w-100'>
        <div className='card shadow border-0 w-100 flex-row p-4'>
          <h5 className='mb-0'>Quản lý ký hiệu</h5>
          <div className='ml-auto d-flex align-items-center'>
            <Button className='btn-blue ml-3 pl-3 pr-3' onClick={handleAdd}>
              <PlusOutlined /> &nbsp; Thêm ký hiệu
            </Button>
          </div>
        </div>

        <div className='card shadow border-0 p-3 mt-4'>
          <DataTable<SymbolRecord>
            columns={[
              {
                title: "Mã ký hiệu",
                dataIndex: "code",
                key: "code",
                sorter: true,
              },
              {
                title: "Tên ký hiệu",
                dataIndex: "name",
                key: "name",
                sorter: true,
              },
              {
                title: "Mô tả",
                dataIndex: "description",
                key: "description",
                render: (description: string) => description || "N/A",
              },
              {
                title: "Trạng thái",
                dataIndex: "status",
                key: "status",
                render: (status: string) => renderStatus(status),
              },
              {
                title: "Ngày tạo",
                dataIndex: "createdAt",
                key: "createdAt",
                render: (date: string) =>
                  date ? new Date(date).toLocaleDateString("vi-VN") : "N/A",
              },
            ]}
            data={symbolRows}
            loading={isLoading}
            showSearch={true}
            scroll={{ x: "100%" }}
            searchPlaceholder='Tìm kiếm ký hiệu...'
            searchableColumns={["symbolCode", "symbolName", "description"]}
            onEdit={handleEdit}
            onDelete={handleDelete}
            paginationConfig={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} ký hiệu`,
            }}
          />
        </div>
      </div>

      {/* Modal thêm/sửa ký hiệu */}
      <Modal
        title={editingSymbol ? "Chỉnh sửa ký hiệu" : "Thêm ký hiệu"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout='vertical'
          onFinish={handleSubmit}
          autoComplete='off'
          initialValues={defaultSymbolValues}
        >


          <Form.Item
            name='name'
            label='Tên ký hiệu'
            rules={[{ required: true, message: "Vui lòng nhập tên ký hiệu" }]}
          >
            <Input placeholder='Nhập tên ký hiệu' />
          </Form.Item>

          <Form.Item name='description' label='Mô tả'>
            <Input.TextArea placeholder='Nhập mô tả' rows={3} />
          </Form.Item>

          <Form.Item name='status' label='Trạng thái'>
            <Select>
              {BASE_STATUS.map((status) => (
                <Option key={status.value} value={status.value}>
                  {status.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item className='text-right'>
            <Space>
              <Button onClick={() => setModalVisible(false)}>Hủy</Button>
              <Button 
                type='primary' 
                htmlType='submit'
                loading={createSymbolMutation.isPending || updateSymbolMutation.isPending}
              >
                {editingSymbol ? "Cập nhật" : "Thêm mới"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal xác nhận xóa ký hiệu */}
      <ConfirmModal
        open={deleteConfirmVisible}
        title='Xác nhận xóa'
        content={
          deletingSymbol
            ? `Bạn có chắc chắn muốn xóa ký hiệu "${deletingSymbol.name}"?`
            : ""
        }
        okText='Xóa'
        okType='primary'
        cancelText='Hủy'
        confirmLoading={deleteSymbolMutation.isPending}
        onOk={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  )
}

export default ListSymbols
