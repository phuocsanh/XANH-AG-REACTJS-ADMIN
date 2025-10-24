import { useState } from "react"
import { Button, message, Space, Modal, Form, Input, Select, Tag } from "antd"
import { PlusOutlined } from "@ant-design/icons"
import { CreateUnitDto, UpdateUnitDto } from "../../models/unit.model"
import DataTable from "../../components/common/data-table"
import {
  useUnitsQuery,
  useDeleteUnitMutation,
  useCreateUnitMutation,
  useUpdateUnitMutation,
} from "../../queries/unit"
import { BaseStatus, BASE_STATUS } from "@/constant/base-status"

const { confirm } = Modal
const { Option } = Select

// Create a new interface that extends Unit and satisfies Record<string, unknown>
interface UnitRecord extends Record<string, unknown> {
  id: number
  unitName: string
  unitCode: string
  description?: string
  status: BaseStatus
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

const ListUnits = () => {
  const [modalVisible, setModalVisible] = useState(false)
  const [editingUnit, setEditingUnit] = useState<UnitRecord | null>(null)
  const [form] = Form.useForm()

  // Sử dụng React Query hook để lấy danh sách đơn vị tính
  const { data: units, isLoading } = useUnitsQuery()

  // Mutation hooks
  const deleteUnitMutation = useDeleteUnitMutation()
  const createUnitMutation = useCreateUnitMutation()
  const updateUnitMutation = useUpdateUnitMutation()

  // Chuyển đổi dữ liệu từ API thành format phù hợp với table
  const unitRows: UnitRecord[] =
    units?.map((unit) => ({
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
      unitName: record.unitName,
      unitCode: record.unitCode,
      description: record.description,
      status: record.status,
    })
    setModalVisible(true)
  }

  // Xử lý xóa đơn vị tính
  const handleDelete = (record: UnitRecord) => {
    confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc chắn muốn xóa đơn vị tính "${record.unitName}"?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await deleteUnitMutation.mutateAsync(record.id)
          message.success("Xóa đơn vị tính thành công")
        } catch (error) {
          console.error("Error deleting unit:", error)
          message.error("Không thể xóa đơn vị tính")
        }
      },
    })
  }

  // Xử lý submit form
  const handleSubmit = async (values: UnitRecord) => {
    try {
      if (editingUnit) {
        // Cập nhật đơn vị tính
        const updateData: UpdateUnitDto = {
          unitName: values.unitName,
          unitCode: values.unitCode,
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
          unitName: values.unitName,
          unitCode: values.unitCode,
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
          <DataTable<UnitRecord>
            columns={[
              {
                title: "Tên đơn vị tính",
                dataIndex: "unitName",
                key: "unitName",
                sorter: true,
              },
              {
                title: "Mã đơn vị tính",
                dataIndex: "unitCode",
                key: "unitCode",
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
                sorter: true,
              },
            ]}
            data={unitRows}
            loading={isLoading}
            showSearch={true}
            scroll={{ x: "100%" }}
            searchPlaceholder='Tìm kiếm đơn vị tính...'
            searchableColumns={["unitName", "unitCode", "description"]}
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
        >
          <Form.Item
            name='unitName'
            label='Tên đơn vị tính'
            rules={[
              { required: true, message: "Vui lòng nhập tên đơn vị tính" },
            ]}
          >
            <Input placeholder='Nhập tên đơn vị tính' />
          </Form.Item>

          <Form.Item
            name='unitCode'
            label='Mã đơn vị tính'
            rules={[
              { required: true, message: "Vui lòng nhập mã đơn vị tính" },
            ]}
          >
            <Input placeholder='Nhập mã đơn vị tính' />
          </Form.Item>

          <Form.Item name='description' label='Mô tả'>
            <Input.TextArea placeholder='Nhập mô tả' rows={3} />
          </Form.Item>

          <Form.Item name='status' label='Trạng thái' initialValue='active'>
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
              <Button type='primary' htmlType='submit'>
                {editingUnit ? "Cập nhật" : "Thêm mới"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default ListUnits
