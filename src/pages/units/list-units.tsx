import { useState } from "react"
import { Button, message, Space, Modal, Form, Input, Select, Tag, Alert } from "antd"
import { PlusOutlined } from "@ant-design/icons"
import { CreateUnitDto, UpdateUnitDto } from "../../models/unit.model"
import DataTable from "../../components/common/data-table"
import { ConfirmModal } from "../../components/common" // Cập nhật import
import {
  useUnitsQuery,
  useDeleteUnitMutation,
  useCreateUnitMutation,
  useUpdateUnitMutation,
} from "../../queries/unit"
import { Unit, UnitFormData, defaultUnitValues } from "./form-config"
import { BASE_STATUS } from "@/constant/base-status"

const { Option } = Select

// Create a new interface that extends Unit and satisfies Record<string, unknown>
interface UnitRecord extends Unit, Record<string, unknown> {}

const ListUnits = () => {
  const [modalVisible, setModalVisible] = useState(false)
  const [editingUnit, setEditingUnit] = useState<UnitRecord | null>(null)
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false)
  const [deletingUnit, setDeletingUnit] = useState<UnitRecord | null>(null)
  const [form] = Form.useForm<UnitFormData>()

  // Sử dụng React Query hook để lấy danh sách đơn vị tính
  const { data: units, isLoading } = useUnitsQuery()
  console.log("🚀 ~ ListUnits ~ units:", units)

  // Mutation hooks
  const deleteUnitMutation = useDeleteUnitMutation()
  const createUnitMutation = useCreateUnitMutation()
  const updateUnitMutation = useUpdateUnitMutation()

  // Chuyển đổi dữ liệu từ API thành format phù hợp với table
  const unitRows: UnitRecord[] =
    units?.data?.items?.map((unit: Unit) => ({
      ...unit,
    })) || []

  // Xử lý thêm mới đơn vị tính
  const handleAdd = () => {
    setEditingUnit(null)
    form.resetFields()
    setModalVisible(true)
  }

  // Xử lý chỉnh sửa đơn vị tính
  const handleEdit = (record: UnitRecord) => {
    setEditingUnit(record)
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      description: record.description,
      status: record.status,
    })
    setModalVisible(true)
  }

  // Xử lý xóa đơn vị tính
  const handleDelete = (record: UnitRecord) => {
    // Set state để hiển thị modal xác nhận
    setDeletingUnit(record)
    setDeleteConfirmVisible(true)
  }

  // Xử lý xác nhận xóa
  const handleConfirmDelete = async () => {
    if (!deletingUnit) return

    try {
      await deleteUnitMutation.mutateAsync(deletingUnit.id)
      message.success("Xóa đơn vị tính thành công")
      // Đóng modal xác nhận
      setDeleteConfirmVisible(false)
      setDeletingUnit(null)
    } catch (error) {
      console.error("Error deleting unit:", error)
      message.error("Không thể xóa đơn vị tính")
      // Đóng modal xác nhận
      setDeleteConfirmVisible(false)
      setDeletingUnit(null)
    }
  }

  // Xử lý hủy bỏ xóa
  const handleCancelDelete = () => {
    setDeleteConfirmVisible(false)
    setDeletingUnit(null)
  }

  // Xử lý submit form
  const handleSubmit = async (values: UnitFormData) => {
    try {
      if (editingUnit) {
        // Cập nhật đơn vị tính
        const updateData: UpdateUnitDto = {
          name: values.name,
          code: values.code,
          description: values.description,
          status: values.status,
        }
        await updateUnitMutation.mutateAsync({
          id: editingUnit.id,
          unitData: updateData,
        })
        message.success("Cập nhật đơn vị tính thành công")
      } else {
        // Thêm mới đơn vị tính
        const createData: CreateUnitDto = {
          name: values.name,
          code: values.code,
          description: values.description,
          status: values.status,
        }
        await createUnitMutation.mutateAsync(createData)
        message.success("Thêm đơn vị tính thành công")
      }
      setModalVisible(false)
      form.resetFields()
    } catch (error) {
      console.error("Error saving unit:", error)
      message.error("Không thể lưu đơn vị tính")
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
          <h5 className='mb-0'>Quản lý đơn vị tính</h5>
          <div className='ml-auto d-flex align-items-center'>
            <Button className='btn-blue ml-3 pl-3 pr-3' onClick={handleAdd}>
              <PlusOutlined /> &nbsp; Thêm đơn vị tính
            </Button>
          </div>
        </div>

        <div className='card shadow border-0 p-3 mt-4'>
          <Alert
            message="Thông tin hướng dẫn"
            description="Bạn chỉ cần tạo các tên đơn vị cơ bản (Kg, Bao, Chai...) tại đây. Các quy cách đóng gói cụ thể (vi dụ: Bao 50kg, Bao 25kg) sẽ được cấu hình linh hoạt cho từng sản phẩm trong trang Sửa Sản Phẩm."
            type="info"
            showIcon
            className="mb-4"
          />
          <DataTable<UnitRecord>
            columns={[
              {
                title: "Tên đơn vị tính",
                dataIndex: "name",
                key: "name",
                width: 200,
                sorter: true,
              },
              {
                title: "Mã đơn vị tính",
                dataIndex: "code",
                key: "code",
                width: 180,
                sorter: true,
              },
              {
                title: "Mô tả",
                dataIndex: "description",
                key: "description",
                width: 250,
                render: (description: string) => description || "N/A",
              },
              {
                title: "Trạng thái",
                dataIndex: "status",
                key: "status",
                width: 120,
                render: (status: string) => renderStatus(status),
              },
              {
                title: "Ngày tạo",
                dataIndex: "created_at",
                key: "created_at",
                width: 130,
                render: (date: string) =>
                  date ? new Date(date).toLocaleDateString("vi-VN") : "N/A",
              },
            ]}
            data={unitRows}
            loading={isLoading}
            showSearch={true}
            scroll={{ x: 1000 }}
            searchPlaceholder='Tìm kiếm đơn vị tính...'
            searchableColumns={["name", "code", "description"]}
            onEdit={handleEdit}
            onDelete={handleDelete}
            paginationConfig={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} đơn vị tính`,
            }}
          />
        </div>
      </div>

      {/* Modal thêm/sửa đơn vị tính */}
      <Modal
        title={editingUnit ? "Chỉnh sửa đơn vị tính" : "Thêm đơn vị tính"}
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
          initialValues={defaultUnitValues}
        >
          <Form.Item
            name='name'
            label='Tên đơn vị tính'
            rules={[
              { required: true, message: "Vui lòng nhập tên đơn vị tính" },
            ]}
          >
            <Input placeholder='Nhập tên đơn vị tính' />
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
                loading={createUnitMutation.isPending || updateUnitMutation.isPending}
              >
                {editingUnit ? "Cập nhật" : "Thêm mới"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal xác nhận xóa đơn vị tính */}
      <ConfirmModal
        open={deleteConfirmVisible}
        title='Xác nhận xóa'
        content={
          deletingUnit
            ? `Bạn có chắc chắn muốn xóa đơn vị tính "${deletingUnit.name}"?`
            : ""
        }
        okText='Xóa'
        okType='primary'
        cancelText='Hủy'
        confirmLoading={deleteUnitMutation.isPending}
        onOk={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  )
}

export default ListUnits
