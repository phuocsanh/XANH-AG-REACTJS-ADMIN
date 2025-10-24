import { useEffect, useState } from "react"
import { Button, message, Space, Modal, Form, Input, Select, Tag } from "antd"
import { PlusOutlined } from "@ant-design/icons"
import {
  unitService,
  CreateUnitDto,
  UpdateUnitDto,
} from "../../services/unit.service"
import DataTable from "../../components/common/data-table"

const { confirm } = Modal
const { Option } = Select

// Create a new interface that extends Unit and satisfies Record<string, unknown>
interface UnitRecord extends Record<string, unknown> {
  id: number
  unitName: string
  unitCode: string
  description?: string
  status: "active" | "inactive" | "archived"
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

const ListUnits = () => {
  const [units, setUnits] = useState<UnitRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingUnit, setEditingUnit] = useState<UnitRecord | null>(null)
  const [form] = Form.useForm()

  // Lấy danh sách đơn vị tính
  const fetchUnits = async () => {
    try {
      setLoading(true)
      const data = await unitService.getUnits()
      // Convert Unit[] to UnitRecord[]
      const convertedData: UnitRecord[] = data.map((unit) => ({
        ...unit,
      }))
      setUnits(convertedData)
    } catch (error) {
      console.error("Error fetching units:", error)
      message.error("Không thể tải danh sách đơn vị tính")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUnits()
  }, [])

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
          await unitService.deleteUnit(record.id)
          message.success("Xóa đơn vị tính thành công")
          fetchUnits()
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
        await unitService.updateUnit(editingUnit.id, updateData)
        message.success("Cập nhật đơn vị tính thành công")
      } else {
        // Thêm mới đơn vị tính
        const createData: CreateUnitDto = {
          unitName: values.unitName,
          unitCode: values.unitCode,
          description: values.description,
          status: values.status,
        }
        await unitService.createUnit(createData)
        message.success("Thêm đơn vị tính thành công")
      }
      setModalVisible(false)
      form.resetFields()
      fetchUnits()
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
            data={units}
            loading={loading}
            showSearch={true}
            searchPlaceholder='Tìm kiếm đơn vị tính...'
            searchableColumns={["unitName", "unitCode", "description"]}
            onEdit={handleEdit}
            onDelete={handleDelete}
            scroll={{ x: "100%" }}
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
              <Option value='active'>Hoạt động</Option>
              <Option value='inactive'>Không hoạt động</Option>
              <Option value='archived'>Lưu trữ</Option>
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
