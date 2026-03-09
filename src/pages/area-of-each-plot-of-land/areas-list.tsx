/**
 * Trang danh sách Quản Lý Diện Tích Mỗi Công Đất
 * Bao gồm: Xem, Thêm, Sửa, Xóa diện tích mỗi công đất
 */

import * as React from "react"
import {
  useAreasQuery,
  useCreateAreaMutation,
  useUpdateAreaMutation,
  useDeleteAreaMutation,
  CreateAreaDto,
  UpdateAreaDto,
} from "@/queries/area-of-each-plot-of-land"
import {
  Button,
  Input,
  Modal,
  Space,
  Form,
  InputNumber,
} from "antd"
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons"
import DataTable from "@/components/common/data-table"
import { ConfirmModal, NumberInput, Field } from "@/components/common"
import type { AreaOfEachPlotOfLand } from "@/models/rice-farming"

// Extend AreaOfEachPlotOfLand interface để tương thích với DataTable
interface ExtendedArea extends AreaOfEachPlotOfLand {
  key: string
  [key: string]: any
}

// Type for area form values
interface AreaFormValues {
  name: string
  code: string
  acreage: number
}

const AreasList: React.FC = () => {
  // State quản lý UI
  const [searchTerm, setSearchTerm] = React.useState<string>("")
  const [isFormModalVisible, setIsFormModalVisible] =
    React.useState<boolean>(false)
  const [deleteConfirmVisible, setDeleteConfirmVisible] =
    React.useState<boolean>(false)
  const [deletingArea, setDeletingArea] = React.useState<AreaOfEachPlotOfLand | null>(
    null
  )
  const [editingArea, setEditingArea] = React.useState<AreaOfEachPlotOfLand | null>(null)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  // Form instance
  const [form] = Form.useForm<AreaFormValues>()

  // Sử dụng query hooks
  const { data: areasData, isLoading } = useAreasQuery({
    page: currentPage,
    limit: pageSize,
  })

  const createMutation = useCreateAreaMutation()
  const updateMutation = useUpdateAreaMutation()
  const deleteMutation = useDeleteAreaMutation()

  // Hàm xử lý thêm vùng/lô đất
  const handleAddArea = () => {
    setEditingArea(null)
    form.resetFields()
    form.setFieldsValue({
      name: "",
      code: "",
      acreage: 0,
    })
    setIsFormModalVisible(true)
  }

  // Hàm xử lý chỉnh sửa vùng/lô đất
  const handleEditArea = (area: AreaOfEachPlotOfLand) => {
    setEditingArea(area)
    form.setFieldsValue({
      name: area.name,
      code: area.code,
      acreage: area.acreage,
    })
    setIsFormModalVisible(true)
  }

  // Xử lý xóa vùng/lô đất
  const handleDelete = (area: AreaOfEachPlotOfLand) => {
    setDeletingArea(area)
    setDeleteConfirmVisible(true)
  }

  // Xử lý xác nhận xóa
  const handleConfirmDelete = async () => {
    if (!deletingArea) return

    try {
      await deleteMutation.mutateAsync(deletingArea.id)
      setDeleteConfirmVisible(false)
      setDeletingArea(null)
    } catch (error) {
      console.error("Error deleting area:", error)
      setDeleteConfirmVisible(false)
      setDeletingArea(null)
    }
  }

  // Xử lý hủy bỏ xóa
  const handleCancelDelete = () => {
    setDeleteConfirmVisible(false)
    setDeletingArea(null)
  }

  // Xử lý submit form
  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      const formattedData: CreateAreaDto | UpdateAreaDto = {
        name: values.name,
        code: values.code,
        acreage: values.acreage,
      }

      if (editingArea) {
        await updateMutation.mutateAsync({
          id: editingArea.id,
          data: formattedData,
        })
      } else {
        await createMutation.mutateAsync(formattedData as CreateAreaDto)
      }

      setIsFormModalVisible(false)
      form.resetFields()
      setEditingArea(null)
    } catch (error) {
      console.error("Form validation failed:", error)
    }
  }

  // Xử lý đóng form modal
  const handleCloseFormModal = () => {
    setIsFormModalVisible(false)
    form.resetFields()
    setEditingArea(null)
  }

  // Filter areas based on search term
  const filteredAreas = React.useMemo(() => {
    if (!areasData || !areasData.data) {
      return []
    }

    let result = [...(areasData.data.items || [])]

    // Lọc theo từ khóa tìm kiếm
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase().trim()
      result = result.filter((area: AreaOfEachPlotOfLand) => {
        if (!area) return false

        const name = String(area.name || "").toLowerCase()
        const code = String(area.code || "").toLowerCase()

        return (
          name.includes(lowerSearchTerm) ||
          code.includes(lowerSearchTerm)
        )
      })
    }

    return result
  }, [areasData, searchTerm])

  // Sử dụng filteredAreas trong giao diện
  const displayAreas: ExtendedArea[] = filteredAreas.map(
    (area: AreaOfEachPlotOfLand) => ({
      ...area,
      key: area.id.toString(),
    })
  )

  const loading =
    isLoading || createMutation.isPending || updateMutation.isPending

  // Cấu hình columns cho DataTable
  const columns = [
    {
      key: "code",
      title: "Mã",
      width: 120,
      render: (record: ExtendedArea) => (
        <div className='font-medium'>{record.code}</div>
      ),
    },
    {
      key: "name",
      title: "Tên",
      width: 250,
      render: (record: ExtendedArea) => (
        <div className='font-medium'>{record.name}</div>
      ),
    },
    {
      key: "acreage",
      title: "Diện tích (m²)",
      width: 150,
      render: (record: ExtendedArea) => (
        <div>{Number(record.acreage).toLocaleString('vi-VN')}</div>
      ),
    },
    {
      key: "created_at",
      title: "Ngày tạo",
      width: 150,
      render: (record: ExtendedArea) => (
        <div>
          {record.created_at
            ? new Date(record.created_at).toLocaleDateString("vi-VN")
            : "-"}
        </div>
      ),
    },
    {
      key: "action",
      title: "Hành động",
      width: 150,
      render: (record: ExtendedArea) => (
        <Space size='middle'>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEditArea(record)}
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

  return (
    <div className='p-2 md:p-6'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold'>🌾 Quản lý Diện Tích Mỗi Công Đất</h1>
        <Button
          type='primary'
          icon={<PlusOutlined />}
          onClick={handleAddArea}
        >
          Thêm diện tích
        </Button>
      </div>

      {/* Thanh tìm kiếm */}
      <div className='mb-6'>
        <Input
          placeholder='Tìm kiếm theo tên hoặc mã...'
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='max-w-md'
        />
      </div>

      {/* Danh sách vùng/lô đất */}
      <div className='bg-white rounded shadow'>
        <DataTable
          data={displayAreas}
          columns={columns}
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: areasData?.data?.total || 0,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total: number) => `Tổng ${total} diện tích`,
            onChange: (page: number, size: number) => {
              setCurrentPage(page)
              setPageSize(size)
            },
          }}
          onView={(record) => handleEditArea(record as AreaOfEachPlotOfLand)}
        />
      </div>

      {/* Modal form thêm/sửa diện tích */}
      <Modal
        title={editingArea ? "Chỉnh sửa diện tích" : "Thêm diện tích mới"}
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
            {editingArea ? "Cập nhật" : "Tạo mới"}
          </Button>,
        ]}
        width={600}
      >
        <Form form={form} layout='vertical' className='mt-4'>
          <Form.Item
            label='Tên'
            name='name'
            rules={[{ required: true, message: "Vui lòng nhập tên" }]}
          >
            <Field placeholder='VD: Lô A1' />
          </Form.Item>



          <Form.Item
            label='Diện tích (m²)'
            name='acreage'
            rules={[{ required: true, message: "Vui lòng nhập diện tích" }]}
          >
            <NumberInput 
              className='w-full' 
              min={0} 
              placeholder='VD: 1000'
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal xác nhận xóa */}
      <ConfirmModal
        title='Xác nhận xóa'
        content={
          deletingArea
            ? `Bạn có chắc chắn muốn xóa diện tích "${deletingArea.name}"?`
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

export default AreasList
