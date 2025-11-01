import { useState } from "react"
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  CircularProgress,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material"
import { Add } from "@mui/icons-material"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  useSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} from "@/queries/supplier"
import { Supplier, PaginatedSuccessResponse } from "@/models/supplier.model"
import ResponsiveDataTable from "@/components/common/responsive-data-table"
import {
  supplierSchema,
  SupplierFormData,
  defaultSupplierValues,
} from "./form-config"
import { useAppStore } from "@/stores"

// Extend Supplier interface để tương thích với DataTable
interface ExtendedSupplier extends Supplier, Record<string, unknown> {}

// Type guard để kiểm tra cấu trúc response
const isPaginatedResponse = (
  data: unknown
): data is PaginatedSuccessResponse<Supplier> => {
  return (
    typeof data === "object" &&
    data !== null &&
    "success" in data &&
    data.success === true &&
    "data" in data &&
    Array.isArray((data as PaginatedSuccessResponse<Supplier>).data) &&
    "pagination" in data
  )
}

// Component chính quản lý nhà cung cấp
export const Suppliers = () => {
  const [openDialog, setOpenDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  )
  const [isEditing, setIsEditing] = useState(false)
  const userInfo = useAppStore((state) => state.userInfo)

  // React Query hooks
  const { data: suppliers, isLoading, error } = useSuppliersQuery()
  console.log("🚀 ~ Suppliers ~ suppliers:", suppliers)

  // Debug log
  console.log("useSuppliersQuery result:", { suppliers, isLoading, error })
  const createSupplierMutation = useCreateSupplierMutation()
  const updateSupplierMutation = useUpdateSupplierMutation()
  const deleteSupplierMutation = useDeleteSupplierMutation()

  // Form handling
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: defaultSupplierValues,
  })

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
      contactPerson: supplier.contactPerson || "",
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
          createdBy: userInfo?.userId || 1, // Sử dụng ID người dùng hiện tại hoặc mặc định là 1
        })
      }
      setOpenDialog(false)
      reset()
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
      <Box p={3} className='w-full max-w-full overflow-x-hidden'>
        <Typography color='error'>
          Có lỗi xảy ra khi tải dữ liệu nhà cung cấp
        </Typography>
      </Box>
    )
  }

  // Trích xuất danh sách nhà cung cấp từ response API
  const getSupplierList = (): ExtendedSupplier[] => {
    console.log("Suppliers data:", suppliers)
    // Kiểm tra cấu trúc dữ liệu thực tế từ API
    if (!suppliers) return []

    // Nếu có trường data (từ hook dùng chung)
    if (typeof suppliers === "object" && suppliers !== null && "data" in suppliers) {
      const supplierObj = suppliers as unknown as Record<string, unknown>
      if (Array.isArray(supplierObj.data)) {
        console.log("Using pagination hook format")
        return supplierObj.data as ExtendedSupplier[]
      }
    }

    // Nếu có trường success và data (cấu trúc mới)
    if (isPaginatedResponse(suppliers)) {
      console.log("Using new paginated response format")
      return suppliers.data as ExtendedSupplier[]
    }

    // Nếu có trường items (cấu trúc cũ)
    if (
      typeof suppliers === "object" &&
      suppliers !== null &&
      "items" in suppliers
    ) {
      const supplierObj = suppliers as unknown as Record<string, unknown>
      if (Array.isArray(supplierObj.items)) {
        console.log("Using legacy response format")
        return supplierObj.items as ExtendedSupplier[]
      }
    }

    // Nếu dữ liệu trực tiếp là mảng
    if (Array.isArray(suppliers)) {
      console.log("Using direct array format")
      return suppliers as ExtendedSupplier[]
    }

    // Nếu là object nhưng không có cấu trúc rõ ràng, thử truy cập trực tiếp các trường
    if (typeof suppliers === "object" && suppliers !== null) {
      const supplierObj = suppliers as unknown as Record<string, unknown>

      // Kiểm tra nếu có trường data là mảng
      if ("data" in supplierObj && Array.isArray(supplierObj.data)) {
        console.log("Using data array format")
        return supplierObj.data as ExtendedSupplier[]
      }

      // Kiểm tra nếu có trường items là mảng
      if ("items" in supplierObj && Array.isArray(supplierObj.items)) {
        console.log("Using items array format")
        return supplierObj.items as ExtendedSupplier[]
      }
    }

    // Kiểm tra cấu trúc interceptor response: {success: true, data: [...], meta: {...}}
    if (typeof suppliers === "object" && suppliers !== null) {
      const supplierObj = suppliers as unknown as Record<string, unknown>
      if (
        "success" in supplierObj &&
        supplierObj.success === true &&
        "data" in supplierObj &&
        Array.isArray(supplierObj.data)
      ) {
        console.log("Using interceptor response format")
        return supplierObj.data as ExtendedSupplier[]
      }
    }

    console.log("Unknown response format")
    return []
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
      title: "Tên nhà cung cấp",
      dataIndex: "name" as const,
      key: "name",
      sorter: true,
      width: 150,
      render: (value: unknown) => (
        <div className='truncate max-w-[140px]' title={String(value)}>
          {String(value)}
        </div>
      ),
    },
    {
      title: "Mã",
      dataIndex: "code" as const,
      key: "code",
      sorter: true,
      width: 100,
      render: (value: unknown) => (
        <div className='truncate max-w-[90px]' title={String(value)}>
          {String(value)}
        </div>
      ),
    },
    {
      title: "Địa chỉ",
      dataIndex: "address" as const,
      key: "address",
      width: 150,
      render: (value: unknown) => (
        <div className='truncate max-w-[140px]' title={String(value) || "N/A"}>
          {String(value) || "N/A"}
        </div>
      ),
    },
    {
      title: "SĐT",
      dataIndex: "phone" as const,
      key: "phone",
      width: 120,
      render: (value: unknown) => (
        <div className='truncate max-w-[110px]' title={String(value) || "N/A"}>
          {String(value) || "N/A"}
        </div>
      ),
    },
    {
      title: "Email",
      dataIndex: "email" as const,
      key: "email",
      width: 150,
      render: (value: unknown) => (
        <div className='truncate max-w-[140px]' title={String(value) || "N/A"}>
          {String(value) || "N/A"}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status" as const,
      key: "status",
      width: 120,
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
      dataIndex: "createdAt" as const,
      key: "createdAt",
      width: 120,
      render: (value: unknown) => {
        const date = String(value)
        return date ? new Date(date).toLocaleDateString("vi-VN") : "N/A"
      },
      sorter: true,
    },
  ]

  return (
    <Box p={3} className='w-full max-w-full overflow-x-hidden'>
      {/* Header */}
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={3}
      >
        <Typography variant='h4' component='h1'>
          Quản lý nhà cung cấp
        </Typography>
        <Button
          variant='contained'
          startIcon={<Add />}
          onClick={handleAddSupplier}
          sx={{ borderRadius: 2 }}
        >
          Thêm nhà cung cấp
        </Button>
      </Box>

      {/* Bảng danh sách nhà cung cấp với responsive design */}
      <ResponsiveDataTable<ExtendedSupplier>
        columns={tableColumns}
        data={getSupplierList()}
        loading={isLoading}
        showSearch={true}
        searchPlaceholder='Tìm kiếm nhà cung cấp...'
        searchableColumns={["name", "code", "phone", "email"]}
        onEdit={handleEditSupplier}
        onDelete={handleDeleteSupplier}
        paginationConfig={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} của ${total} nhà cung cấp`,
        }}
      />

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
            <TextField
              fullWidth
              label='Tên nhà cung cấp *'
              {...register("name")}
              error={!!errors.name}
              helperText={errors.name?.message as string}
              margin='normal'
            />

            <TextField
              fullWidth
              label='Mã nhà cung cấp *'
              {...register("code")}
              error={!!errors.code}
              helperText={errors.code?.message as string}
              margin='normal'
            />

            <TextField
              fullWidth
              label='Địa chỉ'
              {...register("address")}
              error={!!errors.address}
              helperText={errors.address?.message as string}
              margin='normal'
            />

            <TextField
              fullWidth
              label='Số điện thoại'
              {...register("phone")}
              error={!!errors.phone}
              helperText={errors.phone?.message as string}
              margin='normal'
            />

            <TextField
              fullWidth
              label='Email'
              type='email'
              {...register("email")}
              error={!!errors.email}
              helperText={errors.email?.message as string}
              margin='normal'
            />

            <TextField
              fullWidth
              label='Người liên hệ'
              {...register("contactPerson")}
              error={!!errors.contactPerson}
              helperText={errors.contactPerson?.message as string}
              margin='normal'
            />

            <FormControl fullWidth margin='normal'>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                label='Trạng thái'
                {...register("status")}
                error={!!errors.status}
                defaultValue='active'
              >
                <MenuItem value='active'>Hoạt động</MenuItem>
                <MenuItem value='inactive'>Không hoạt động</MenuItem>
                <MenuItem value='archived'>Đã lưu trữ</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label='Ghi chú'
              multiline
              rows={3}
              {...register("notes")}
              error={!!errors.notes}
              helperText={errors.notes?.message as string}
              margin='normal'
            />

            <DialogActions sx={{ mt: 3 }}>
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
