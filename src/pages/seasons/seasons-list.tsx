import * as React from "react"
import { Season } from "@/models/season"
import {
  useSeasonsQuery,
  useCreateSeasonMutation,
  useUpdateSeasonMutation,
  useDeleteSeasonMutation,
} from "@/queries/season"
import {
  Button,
  Input,
  Modal,
  Tag,
  Space,
  Form,
  DatePicker,
  Switch,
  InputNumber,
} from "antd"
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons"
import DataTable from "@/components/common/data-table"
import { ConfirmModal } from "@/components/common"
import dayjs from "dayjs"
import type { Dayjs } from "dayjs"

// Extend Season interface để tương thích với DataTable
interface ExtendedSeason extends Season {
  key: string
  [key: string]: any
}

// Type for season form values
interface SeasonFormValues {
  name: string
  code: string
  year: number
  start_date: Dayjs | null
  end_date: Dayjs | null
  description?: string
  is_active: boolean
}

const SeasonsList: React.FC = () => {
  // State quản lý UI
  const [searchTerm, setSearchTerm] = React.useState<string>("")
  const [isFormModalVisible, setIsFormModalVisible] =
    React.useState<boolean>(false)
  const [deleteConfirmVisible, setDeleteConfirmVisible] =
    React.useState<boolean>(false)
  const [deletingSeason, setDeletingSeason] = React.useState<Season | null>(
    null
  )
  const [editingSeason, setEditingSeason] = React.useState<Season | null>(null)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  // Form instance
  const [form] = Form.useForm<SeasonFormValues>()

  // Sử dụng query hooks
  const { data: seasonsData, isLoading } = useSeasonsQuery({
    page: currentPage,
    limit: pageSize,
  })

  const createMutation = useCreateSeasonMutation()
  const updateMutation = useUpdateSeasonMutation()
  const deleteMutation = useDeleteSeasonMutation()

  // Hàm xử lý thêm mùa vụ
  const handleAddSeason = () => {
    setEditingSeason(null)
    form.resetFields()
    form.setFieldsValue({
      name: "",
      code: "",
      year: new Date().getFullYear(),
      start_date: null,
      end_date: null,
      description: "",
      is_active: true,
    })
    setIsFormModalVisible(true)
  }

  // Hàm xử lý chỉnh sửa mùa vụ
  const handleEditSeason = (season: Season) => {
    setEditingSeason(season)
    form.setFieldsValue({
      name: season.name,
      code: season.code,
      year: season.year,
      start_date: season.start_date ? dayjs(season.start_date) : null,
      end_date: season.end_date ? dayjs(season.end_date) : null,
      description: season.description || "",
      is_active: season.is_active,
    })
    setIsFormModalVisible(true)
  }

  // Xử lý xóa mùa vụ
  const handleDelete = (season: Season) => {
    setDeletingSeason(season)
    setDeleteConfirmVisible(true)
  }

  // Xử lý xác nhận xóa
  const handleConfirmDelete = async () => {
    if (!deletingSeason) return

    try {
      await deleteMutation.mutateAsync(deletingSeason.id)
      setDeleteConfirmVisible(false)
      setDeletingSeason(null)
    } catch (error) {
      console.error("Error deleting season:", error)
      setDeleteConfirmVisible(false)
      setDeletingSeason(null)
    }
  }

  // Xử lý hủy bỏ xóa
  const handleCancelDelete = () => {
    setDeleteConfirmVisible(false)
    setDeletingSeason(null)
  }

  // Xử lý submit form
  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      const formattedData = {
        name: values.name,
        code: values.code,
        year: values.year,
        start_date: values.start_date ? values.start_date.format("YYYY-MM-DD") : undefined,
        end_date: values.end_date ? values.end_date.format("YYYY-MM-DD") : undefined,
        description: values.description || "",
        is_active: values.is_active,
      }

      if (editingSeason) {
        await updateMutation.mutateAsync({
          id: editingSeason.id,
          season: formattedData,
        })
      } else {
        await createMutation.mutateAsync(formattedData)
      }

      setIsFormModalVisible(false)
      form.resetFields()
      setEditingSeason(null)
    } catch (error) {
      console.error("Form validation failed:", error)
    }
  }

  // Xử lý đóng form modal
  const handleCloseFormModal = () => {
    setIsFormModalVisible(false)
    form.resetFields()
    setEditingSeason(null)
  }

  // Filter seasons based on search term
  const filteredSeasons = React.useMemo(() => {
    if (!seasonsData || !seasonsData.data) {
      return []
    }

    let result = [...(seasonsData.data.items || [])]

    // Lọc theo từ khóa tìm kiếm
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase().trim()
      result = result.filter((season: Season) => {
        if (!season) return false

        const name = String(season.name || "").toLowerCase()
        const code = String(season.code || "").toLowerCase()
        const description = String(season.description || "").toLowerCase()

        return (
          name.includes(lowerSearchTerm) ||
          code.includes(lowerSearchTerm) ||
          description.includes(lowerSearchTerm)
        )
      })
    }

    return result
  }, [seasonsData, searchTerm])

  // Sử dụng filteredSeasons trong giao diện
  const displaySeasons: ExtendedSeason[] = filteredSeasons.map(
    (season: Season) => ({
      ...season,
      key: season.id.toString(),
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
      render: (record: ExtendedSeason) => (
        <div className='font-medium'>{record.code}</div>
      ),
    },
    {
      key: "name",
      title: "Tên mùa vụ",
      width: 200,
      render: (record: ExtendedSeason) => (
        <div className='font-medium'>{record.name}</div>
      ),
    },
    {
      key: "year",
      title: "Năm",
      width: 100,
      render: (record: ExtendedSeason) => <div>{record.year}</div>,
    },
    {
      key: "start_date",
      title: "Ngày bắt đầu",
      width: 120,
      render: (record: ExtendedSeason) => (
        <div>
          {record.start_date
            ? new Date(record.start_date).toLocaleDateString("vi-VN")
            : "-"}
        </div>
      ),
    },
    {
      key: "end_date",
      title: "Ngày kết thúc",
      width: 120,
      render: (record: ExtendedSeason) => (
        <div>
          {record.end_date
            ? new Date(record.end_date).toLocaleDateString("vi-VN")
            : "-"}
        </div>
      ),
    },
    {
      key: "is_active",
      title: "Trạng thái",
      width: 140,
      render: (record: ExtendedSeason) => (
        <Tag color={record.is_active ? "green" : "default"}>
          {record.is_active ? "Đang hoạt động" : "Đã kết thúc"}
        </Tag>
      ),
    },
    {
      key: "action",
      title: "Hành động",
      width: 150,
      render: (record: ExtendedSeason) => (
        <Space size='middle'>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEditSeason(record)}
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
    <div className='p-6'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold'>Quản lý Mùa vụ</h1>
        <Button
          type='primary'
          icon={<PlusOutlined />}
          onClick={handleAddSeason}
        >
          Thêm mùa vụ
        </Button>
      </div>

      {/* Thanh tìm kiếm */}
      <div className='mb-6'>
        <Input
          placeholder='Tìm kiếm mùa vụ...'
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='max-w-md'
        />
      </div>

      {/* Danh sách mùa vụ */}
      <div className='bg-white rounded shadow'>
        <DataTable
          data={displaySeasons}
          columns={columns}
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: seasonsData?.data?.total || 0,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total: number) => `Tổng ${total} mùa vụ`,
            onChange: (page: number, size: number) => {
              setCurrentPage(page)
              setPageSize(size)
            },
          }}
        />
      </div>

      {/* Modal form thêm/sửa mùa vụ */}
      <Modal
        title={editingSeason ? "Chỉnh sửa mùa vụ" : "Thêm mùa vụ mới"}
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
            {editingSeason ? "Cập nhật" : "Tạo mới"}
          </Button>,
        ]}
        width={600}
      >
        <Form form={form} layout='vertical' className='mt-4'>
          <Form.Item
            label='Tên mùa vụ'
            name='name'
            rules={[{ required: true, message: "Vui lòng nhập tên mùa vụ" }]}
          >
            <Input placeholder='VD: Đông Xuân 2024' />
          </Form.Item>

          <Form.Item
            label='Mã mùa vụ'
            name='code'
            rules={[{ required: true, message: "Vui lòng nhập mã mùa vụ" }]}
          >
            <Input placeholder='VD: DX2024' />
          </Form.Item>

          <Form.Item
            label='Năm'
            name='year'
            rules={[{ required: true, message: "Vui lòng nhập năm" }]}
          >
            <InputNumber className='w-full' min={2000} max={2100} />
          </Form.Item>

          <Form.Item label='Ngày bắt đầu' name='start_date'>
            <DatePicker className='w-full' format='DD/MM/YYYY' />
          </Form.Item>

          <Form.Item label='Ngày kết thúc' name='end_date'>
            <DatePicker className='w-full' format='DD/MM/YYYY' />
          </Form.Item>

          <Form.Item label='Mô tả' name='description'>
            <Input.TextArea rows={3} placeholder='Nhập mô tả mùa vụ' />
          </Form.Item>

          <Form.Item label='Trạng thái' name='is_active' valuePropName='checked'>
            <Switch checkedChildren='Đang hoạt động' unCheckedChildren='Đã kết thúc' />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal xác nhận xóa */}
      <ConfirmModal
        title='Xác nhận xóa'
        content={
          deletingSeason
            ? `Bạn có chắc chắn muốn xóa mùa vụ "${deletingSeason.name}"?`
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

export default SeasonsList
