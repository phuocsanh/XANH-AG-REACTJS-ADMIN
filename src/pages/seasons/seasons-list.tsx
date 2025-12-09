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
import FilterHeader from "@/components/common/filter-header"
import { ConfirmModal } from "@/components/common"
import { TablePaginationConfig, TableProps } from "antd"
import { FilterValue, SorterResult } from "antd/es/table/interface"
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
  const [filters, setFilters] = React.useState<Record<string, any>>({})
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

  // Date Filter UI Helper
  const getDateColumnSearchProps = (dataIndex: string): any => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <DatePicker.RangePicker 
            style={{ marginBottom: 8, display: 'flex' }}
            format="DD/MM/YYYY"
            value={
                selectedKeys && selectedKeys[0] 
                ? [dayjs(selectedKeys[0]), dayjs(selectedKeys[1])] 
                : undefined
            }
            onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                    setSelectedKeys([
                        dates[0].startOf('day').toISOString(), 
                        dates[1].endOf('day').toISOString()
                    ])
                } else {
                    setSelectedKeys([])
                }
            }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => confirm({ closeDropdown: false })}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Lọc
          </Button>
          <Button
            onClick={() => {
                if (clearFilters) {
                    clearFilters()
                    confirm()
                }
            }}
            size="small"
            style={{ width: 90 }}
          >
            Xóa
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
  })

  // Handle Table Change
  const handleTableChange: TableProps<ExtendedSeason>['onChange'] = (
    pagination,
    tableFilters,
    sorter,
    extra
  ) => {
    setCurrentPage(pagination.current || 1)
    setPageSize(pagination.pageSize || 10)
    
    const newFilters = { ...filters }
    
    // Status (is_active boolean)
    if (tableFilters.is_active && tableFilters.is_active.length > 0) {
      // Convert string "true"/"false" back to boolean if needed, or pass as is depending on backend
      newFilters.is_active = tableFilters.is_active[0]
    } else {
    }

    // Start Date Range
    if (tableFilters.start_date && tableFilters.start_date.length === 2) {
      newFilters.start_date_start = tableFilters.start_date[0]
      newFilters.start_date_end = tableFilters.start_date[1]
    } else {
        delete newFilters.start_date_start
        delete newFilters.start_date_end
    }

    // End Date Range
    if (tableFilters.end_date && tableFilters.end_date.length === 2) {
      newFilters.end_date_start = tableFilters.end_date[0]
      newFilters.end_date_end = tableFilters.end_date[1]
    } else {
        delete newFilters.end_date_start
        delete newFilters.end_date_end
    }

    setFilters(newFilters)
  }

  // Handle Filter Change
  const handleFilterChange = (key: string, value: any) => {
      const newFilters = { ...filters, [key]: value }
      if (!value) delete newFilters[key]
      setFilters(newFilters)
      setCurrentPage(1)
  }

  // Sử dụng query hooks
  const { data: seasonsData, isLoading } = useSeasonsQuery({
    page: currentPage,
    limit: pageSize,
    ...filters
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

  // Display Seasons
  const displaySeasons: ExtendedSeason[] = (seasonsData?.data?.items || []).map(
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
      title: (
        <FilterHeader 
            title="Mã" 
            dataIndex="code" 
            value={filters.code} 
            onChange={(val) => handleFilterChange('code', val)}
            inputType="text"
        />
      ),
      width: 120,
      render: (record: ExtendedSeason) => (
        <div className='font-medium'>{record.code}</div>
      ),
    },
    {
      key: "name",
      title: (
        <FilterHeader 
            title="Tên mùa vụ" 
            dataIndex="name" 
            value={filters.name} 
            onChange={(val) => handleFilterChange('name', val)}
            inputType="text"
        />
      ),
      width: 200,
      render: (record: ExtendedSeason) => (
        <div className='font-medium'>{record.name}</div>
      ),
    },
    {
      key: "year",
      title: (
        <FilterHeader 
            title="Năm" 
            dataIndex="year" 
            value={filters.year} 
            onChange={(val) => handleFilterChange('year', val)}
            inputType="text"
        />
      ),
      width: 120,
      render: (record: ExtendedSeason) => <div>{record.year}</div>,
    },
    {
      key: "start_date",
      title: "Ngày bắt đầu",
      dataIndex: "start_date",
      width: 120,
      ...getDateColumnSearchProps('start_date'),
      filteredValue: (filters.start_date_start && filters.start_date_end) ? [filters.start_date_start, filters.start_date_end] : null,
      render: (value: string) => (
        <div>
          {value
            ? new Date(value).toLocaleDateString("vi-VN")
            : "-"}
        </div>
      ),
    },
    {
      key: "end_date",
      title: "Ngày kết thúc",
      dataIndex: "end_date",
      width: 120,
      ...getDateColumnSearchProps('end_date'),
      filteredValue: (filters.end_date_start && filters.end_date_end) ? [filters.end_date_start, filters.end_date_end] : null,
      render: (value : string) => (
        <div>
          {value
            ? new Date(value).toLocaleDateString("vi-VN")
            : "-"}
        </div>
      ),
    },
    {
      key: "is_active",
      title: "Trạng thái",
      width: 140,
      filters: [
          { text: "Đang hoạt động", value: true },
          { text: "Đã kết thúc", value: false },
      ],
      filteredValue: filters.is_active !== undefined ? [filters.is_active] : null,
      filterMultiple: false,
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
          }}
          onChange={handleTableChange}
          showSearch={false}
          showFilters={false}
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
