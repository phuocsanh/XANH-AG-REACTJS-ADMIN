import React, { useState } from "react"
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  CircularProgress,
  Chip,
} from "@mui/material"
import { Add } from "@mui/icons-material"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { FormField, FormComboBox } from "@/components/form"
import {
  useSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} from "@/queries/supplier"
import { Supplier } from "@/models/supplier.model"
import DataTable from "@/components/common/data-table"
import {
  supplierSchema,
  SupplierFormData,
  defaultSupplierValues,
} from "./form-config"
import { useAppStore } from "@/stores"
import FilterHeader from "@/components/common/filter-header"
import { DatePicker, Space, Button as AntButton } from "antd"
import { SearchOutlined } from "@ant-design/icons"
import dayjs from "dayjs"
import type { FilterValue, TablePaginationConfig } from "antd/es/table/interface"
import type { SorterResult } from "antd/es/table/interface"

// Extend Supplier interface để tương thích với DataTable
interface ExtendedSupplier extends Supplier, Record<string, unknown> {}

// Component chính quản lý nhà cung cấp
export const Suppliers = () => {
  const [openDialog, setOpenDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  )
  const [isEditing, setIsEditing] = useState(false)
  const userInfo = useAppStore((state) => state.userInfo)

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState<Record<string, unknown>>({})

  // React Query hooks
  const { data: suppliersData, isLoading, error } = useSuppliersQuery({
    page: currentPage,
    limit: pageSize,
    ...filters,
  })

  // Debug log
  console.log("useSuppliersQuery result:", { suppliersData, isLoading, error })
  const createSupplierMutation = useCreateSupplierMutation()
  const updateSupplierMutation = useUpdateSupplierMutation()
  const deleteSupplierMutation = useDeleteSupplierMutation()

  // Form handling
  const {
    control,
    handleSubmit,
    reset,
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: defaultSupplierValues,
  })

  // Date Filter UI Helper
  const getDateColumnSearchProps = () => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: {
      setSelectedKeys: (keys: React.Key[]) => void;
      selectedKeys: React.Key[];
      confirm: (param?: { closeDropdown: boolean }) => void;
      clearFilters?: () => void;
    }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <DatePicker.RangePicker 
            style={{ marginBottom: 8, display: 'flex' }}
            format="DD/MM/YYYY"
            value={
                selectedKeys && selectedKeys[0] 
                ? [dayjs(String(selectedKeys[0])), dayjs(String(selectedKeys[1]))] 
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
          <AntButton
            type="primary"
            onClick={() => confirm({ closeDropdown: false })} // Giữ dropdown để user thấy kết quả
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Lọc
          </AntButton>
          <AntButton
            onClick={() => {
                if (clearFilters) {
                    clearFilters()
                    confirm({ closeDropdown: true })
                }
            }}
            size="small"
            style={{ width: 90 }}
          >
            Xóa
          </AntButton>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
  })

  // Handle Table Change
  const handleTableChange = (
    pagination: TablePaginationConfig,
    tableFilters: Record<string, FilterValue | null>,
    sorter: SorterResult<ExtendedSupplier> | SorterResult<ExtendedSupplier>[]
  ) => {
    setCurrentPage(pagination.current || 1)
    setPageSize(pagination.pageSize || 10)

    const newFilters: Record<string, unknown> = { ...filters }

    // Handle Sorting - chỉ xử lý single sorter
    const singleSorter = Array.isArray(sorter) ? sorter[0] : sorter
    if (singleSorter?.field && singleSorter?.order) {
      newFilters.sort_by = String(singleSorter.field)
      newFilters.sort_direction = singleSorter.order === 'ascend' ? 'ASC' : 'DESC'
    } else {
      delete newFilters.sort_by
      delete newFilters.sort_direction
    }
    
    // Handle Native Filters (Status)
    const statusFilter = tableFilters.status
    if (statusFilter && statusFilter.length > 0) {
       newFilters.status = String(statusFilter[0])
    } else {
       delete newFilters.status
    }

    // Handle Date Range (created_at)
    const dateFilter = tableFilters.created_at
    if (dateFilter && dateFilter.length === 2) {
      newFilters.start_date = String(dateFilter[0])
      newFilters.end_date = String(dateFilter[1])
    } else {
        delete newFilters.start_date
        delete newFilters.end_date
    }

    setFilters(newFilters)
  }
  
  // Handler update filter trực tiếp (Controlled mode)
  const handleFilterChange = (key: string, value: string | undefined) => {
      const newFilters: Record<string, unknown> = { ...filters, [key]: value };
      if (!value) delete newFilters[key];
      
      setFilters(newFilters);
      setCurrentPage(1); // Reset about page 1 upon filtering
  }

  // Xử lý mở dialog thêm nhà cung cấp
  const handleAddSupplier = () => {
    setSelectedSupplier(null)
    setIsEditing(false)
    reset(defaultSupplierValues)
    setOpenDialog(true)
  }

  // Xử lý mở dialog sửa nhà cung cấp
  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setIsEditing(true)
    reset({
      name: supplier.name,
      code: supplier.code,
      address: supplier.address || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      contact_person: supplier.contact_person || "",
      status: supplier.status,
      notes: supplier.notes || "",
    })
    setOpenDialog(true)
  }

  // Xử lý mở dialog xóa nhà cung cấp
  const handleDeleteSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setOpenDeleteDialog(true)
  }

  // Xử lý submit form
  const onSubmit = async (data: SupplierFormData) => {
    try {
      if (isEditing && selectedSupplier) {
        // Cập nhật nhà cung cấp
        await updateSupplierMutation.mutateAsync({
          id: selectedSupplier.id,
          supplier: {
            ...data,
            id: selectedSupplier.id,
          },
        })
      } else {
        // Tạo nhà cung cấp mới với createdBy từ userInfo
        await createSupplierMutation.mutateAsync({
          ...data,
          created_by: userInfo?.user_id || 1, // Sử dụng ID người dùng hiện tại hoặc mặc định là 1
        })
      }
      // Reset form về giá trị mặc định sau khi thành công
      reset(defaultSupplierValues)
      setOpenDialog(false)
    } catch (error) {
      console.error("Lỗi khi xử lý form:", error)
    }
  }

  // Xử lý xác nhận xóa
  const handleConfirmDelete = async () => {
    if (selectedSupplier) {
      try {
        await deleteSupplierMutation.mutateAsync(selectedSupplier.id)
        setOpenDeleteDialog(false)
        setSelectedSupplier(null)
      } catch (error) {
        console.error("Lỗi khi xóa nhà cung cấp:", error)
      }
    }
  }

  // Đóng dialog xóa
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false)
    setSelectedSupplier(null)
  }

  // Hiển thị loading
  if (isLoading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='400px'
        className='w-full max-w-full overflow-x-hidden'
      >
        <CircularProgress />
      </Box>
    )
  }

  // Hiển thị lỗi
  if (error) {
    return (
      <Box p={{ xs: 1, sm: 3 }} className='w-full max-w-full overflow-x-hidden'>
        <Typography color='error'>
          Có lỗi xảy ra khi tải dữ liệu nhà cung cấp
        </Typography>
      </Box>
    )
  }

  // Trích xuất danh sách nhà cung cấp từ response API
  const getSupplierList = (): ExtendedSupplier[] => {
    if (!suppliersData?.data?.items) return []
    return suppliersData.data.items as ExtendedSupplier[]
  }

  // Cấu hình cột cho DataTable
  const tableColumns = [
    {
      title: "ID",
      dataIndex: "id" as const,
      key: "id",
      sorter: true,
      width: 80,
    },
    {
      title: (
        <FilterHeader 
            title="Tên nhà cung cấp" 
            dataIndex="name" 
            value={filters.name} 
            onChange={(val) => handleFilterChange('name', val)}
        />
      ),
      dataIndex: "name" as const,
      key: "name",
      sorter: true,
      width: 200,
      render: (value: unknown) => (
        <div className='truncate max-w-[190px] font-medium' title={String(value)}>
          {String(value)}
        </div>
      ),
    },
    {
      title: (
        <FilterHeader 
            title="Mã" 
            dataIndex="code" 
            value={filters.code} 
            onChange={(val) => handleFilterChange('code', val)}
        />
      ),
      dataIndex: "code" as const,
      key: "code",
      sorter: true,
      width: 120,
      render: (value: unknown) => (
        <div className='truncate max-w-[110px]' title={String(value)}>
          {String(value)}
        </div>
      ),
    },
    {
      title: (
        <FilterHeader 
            title="Địa chỉ" 
            dataIndex="address" 
            value={filters.address} 
            onChange={(val) => handleFilterChange('address', val)}
        />
      ),
      dataIndex: "address" as const,
      key: "address",
      width: 200,
      render: (value: unknown) => (
        <div className='truncate max-w-[190px]' title={String(value) || "N/A"}>
          {String(value) || "N/A"}
        </div>
      ),
    },
    {
      title: (
        <FilterHeader 
            title="SĐT" 
            dataIndex="phone" 
            value={filters.phone} 
            onChange={(val) => handleFilterChange('phone', val)}
        />
      ),
      dataIndex: "phone" as const,
      key: "phone",
      width: 150,
      render: (value: unknown) => (
        <div className='truncate max-w-[140px]' title={String(value) || "N/A"}>
          {String(value) || "N/A"}
        </div>
      ),
    },
    {
      title: (
        <FilterHeader 
            title="Email" 
            dataIndex="email" 
            value={filters.email} 
            onChange={(val) => handleFilterChange('email', val)}
        />
      ),
      dataIndex: "email" as const,
      key: "email",
      width: 180,
      render: (value: unknown) => (
        <div className='truncate max-w-[170px]' title={String(value) || "N/A"}>
          {String(value) || "N/A"}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status" as const,
      key: "status",
      width: 150,
      filters: [
        { text: 'Hoạt động', value: 'active' },
        { text: 'Không hoạt động', value: 'inactive' },
        { text: 'Đã lưu trữ', value: 'archived' },
      ],
      filteredValue: filters.status ? [String(filters.status)] : null,
      filterMultiple: false,
      render: (value: unknown) => {
        const status = String(value)
        return (
          <Chip
            label={
              status === "active"
                ? "Hoạt động"
                : status === "inactive"
                ? "Không hoạt động"
                : "Đã lưu trữ"
            }
            color={
              status === "active"
                ? "success"
                : status === "inactive"
                ? "default"
                : "error"
            }
            size='small'
          />
        )
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at" as const,
      key: "created_at",
      width: 120,
      ...getDateColumnSearchProps(),
      filteredValue: (filters.start_date && filters.end_date) ? [String(filters.start_date), String(filters.end_date)] : null,
      render: (value: unknown) => {
        const date = String(value)
        return date ? new Date(date).toLocaleDateString("vi-VN") : "N/A"
      },
    },
  ]

  return (
    <Box p={{ xs: 1, sm: 3 }} className='w-full max-w-full overflow-x-hidden'>
      {/* Header */}
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={{ xs: 2, sm: 3 }}
      >
        <Typography variant='h5' component='h1' sx={{ fontSize: { xs: '1.2rem', sm: '2.125rem' }, fontWeight: 600 }}>
          Quản lý nhà cung cấp
        </Typography>
        <Button
          variant='contained'
          size='small'
          startIcon={<Add />}
          onClick={handleAddSupplier}
          sx={{ 
            borderRadius: 2,
            px: { xs: 1.5, sm: 2 },
            background: 'linear-gradient(180deg, #059669 0%, #047857 100%)',
            '&:hover': {
              background: 'linear-gradient(180deg, #047857 0%, #059669 100%)',
            }
          }}
        >
          <span className="hidden sm:inline">Thêm nhà cung cấp</span>
          <span className="sm:hidden">Thêm mới</span>
        </Button>
      </Box>

      {/* Bảng danh sách nhà cung cấp với DataTable chuẩn */}
      {/* Sử dụng DataTable trực tiếp để tránh lỗi layout mobile card view */}
      <div className='bg-white rounded shadow table-responsive'>
        <DataTable<ExtendedSupplier>
          columns={tableColumns}
          data={getSupplierList()}
          loading={isLoading}
          showSearch={false}
          searchPlaceholder='Tìm kiếm nhà cung cấp...'
          searchableColumns={["name", "code", "phone", "email"]}
          onEdit={handleEditSupplier}
          onDelete={handleDeleteSupplier}
          onChange={handleTableChange}
          paginationConfig={{
            current: currentPage,
            pageSize: pageSize,
            total: suppliersData?.data?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} nhà cung cấp`,
          }}
        />
      </div>

      {/* Dialog thêm/sửa nhà cung cấp */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>
          {isEditing ? "Chỉnh sửa nhà cung cấp" : "Thêm nhà cung cấp"}
        </DialogTitle>
        <DialogContent>
          <Box
            component='form'
            onSubmit={handleSubmit(onSubmit)}
            sx={{ mt: 2 }}
          >
            <FormField
              name="name"
              control={control}
              label="Tên nhà cung cấp"
              placeholder="Nhập tên nhà cung cấp"
              required
            />

            <FormField
              name="address"
              control={control}
              label="Địa chỉ"
              placeholder="Nhập địa chỉ"
            />

            <FormField
              name="phone"
              control={control}
              label="Số điện thoại"
              placeholder="Nhập số điện thoại"
            />

            <FormField
              name="email"
              control={control}
              label="Email"
              type="email"
              placeholder="Nhập email"
            />

            <FormField
              name="contact_person"
              control={control}
              label="Người liên hệ"
              placeholder="Nhập tên người liên hệ"
            />

            <FormComboBox
              name="status"
              control={control}
              label="Trạng thái"
              options={[
                { value: 'active', label: 'Hoạt động' },
                { value: 'inactive', label: 'Không hoạt động' },
                { value: 'archived', label: 'Đã lưu trữ' },
              ]}
              allowClear={false}
            />

            <FormField
              name="notes"
              control={control}
              label="Ghi chú"
              type="textarea"
              rows={3}
              placeholder="Nhập ghi chú"
            />

            <DialogActions sx={{ mt: 3, px: 0 }}>
              <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
              <Button type='submit' variant='contained' color='primary'>
                {isEditing ? "Cập nhật" : "Thêm"}
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Dialog xác nhận xóa */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa nhà cung cấp &#39;
            {selectedSupplier?.name}&#39;?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Hủy</Button>
          <Button
            onClick={handleConfirmDelete}
            color='error'
            variant='contained'
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Suppliers
