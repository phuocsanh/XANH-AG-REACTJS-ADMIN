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
} from "@mui/material"
import { Add } from "@mui/icons-material"
import { useForm } from "react-hook-form"
import {
  useUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from "@/queries/use-user"
import { CreateUserDto, UpdateUserDto, User } from "@/services/user.service"
import DataTable from "@/components/common/DataTable"

// Extend User interface để tương thích với DataTable
interface ExtendedUser extends User, Record<string, unknown> {}

// Component chính quản lý người dùng
export const Users = () => {
  const [openDialog, setOpenDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // React Query hooks
  const { data: users, isLoading, error } = useUsersQuery()
  const createUserMutation = useCreateUserMutation()
  const updateUserMutation = useUpdateUserMutation()
  const deleteUserMutation = useDeleteUserMutation()

  // Form handling
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserDto | UpdateUserDto>()

  // Xử lý mở dialog thêm người dùng
  const handleAddUser = () => {
    setSelectedUser(null)
    setIsEditing(false)
    reset()
    setOpenDialog(true)
  }

  // Xử lý mở dialog sửa người dùng
  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsEditing(true)
    reset({
      userAccount: user.userAccount,
      userEmail: user.userEmail,
      userState: user.userState,
    })
    setOpenDialog(true)
  }

  // Xử lý mở dialog xóa người dùng
  const handleDeleteUser = (user: User) => {
    setSelectedUser(user)
    setOpenDeleteDialog(true)
  }

  // Xử lý submit form
  const onSubmit = async (data: CreateUserDto | UpdateUserDto) => {
    try {
      if (isEditing && selectedUser) {
        // Cập nhật người dùng
        await updateUserMutation.mutateAsync({
          id: selectedUser.userId,
          userData: data as UpdateUserDto,
        })
      } else {
        // Tạo người dùng mới
        const createData = data as CreateUserDto
        // Tạo salt đơn giản (trong thực tế nên tạo random)
        createData.userSalt = "default_salt"
        await createUserMutation.mutateAsync(createData)
      }
      setOpenDialog(false)
      reset()
    } catch (error) {
      console.error("Lỗi khi xử lý form:", error)
    }
  }

  // Xử lý xác nhận xóa
  const handleConfirmDelete = async () => {
    if (selectedUser) {
      try {
        await deleteUserMutation.mutateAsync(selectedUser.userId)
        setOpenDeleteDialog(false)
        setSelectedUser(null)
      } catch (error) {
        console.error("Lỗi khi xóa người dùng:", error)
      }
    }
  }

  // Hiển thị loading
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  // Hiển thị lỗi
  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">Có lỗi xảy ra khi tải dữ liệu người dùng</Typography>
      </Box>
    )
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Quản lý người dùng
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddUser}
          sx={{ borderRadius: 2 }}
        >
          Thêm người dùng
        </Button>
      </Box>

      {/* Bảng danh sách người dùng */}
      <DataTable<ExtendedUser>
        columns={[
          {
            title: "ID",
            dataIndex: "userId",
            key: "userId",
            sorter: true,
          },
          {
            title: "Tài khoản",
            dataIndex: "userAccount",
            key: "userAccount",
            sorter: true,
          },
          {
            title: "Email",
            dataIndex: "userEmail",
            key: "userEmail",
            render: (email: string) => email || "N/A",
          },
          {
            title: "Trạng thái",
            dataIndex: "userState",
            key: "userState",
            render: (state: number) => (
              <Chip
                label={state === 1 ? "Hoạt động" : "Không hoạt động"}
                color={state === 1 ? "success" : "default"}
                size="small"
              />
            ),
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
        data={(users || []) as ExtendedUser[]}
        loading={isLoading}
        showSearch={true}
        searchPlaceholder="Tìm kiếm người dùng..."
        searchableColumns={["userAccount", "userEmail"]}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
        paginationConfig={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} của ${total} người dùng`,
        }}
      />

      {/* Dialog thêm/sửa người dùng */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditing ? "Sửa người dùng" : "Thêm người dùng mới"}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <TextField
              {...register("userAccount", {
                required: "Tài khoản là bắt buộc",
                minLength: { value: 3, message: "Tài khoản phải có ít nhất 3 ký tự" },
              })}
              label="Tài khoản"
              fullWidth
              margin="normal"
              error={!!errors.userAccount}
              helperText={errors.userAccount?.message}
            />
            
            {!isEditing && (
              <TextField
                {...register("userPassword", {
                  required: "Mật khẩu là bắt buộc",
                  minLength: { value: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
                })}
                label="Mật khẩu"
                type="password"
                fullWidth
                margin="normal"
                error={!!errors.userPassword}
                helperText={errors.userPassword?.message}
              />
            )}
            
            <TextField
              {...register("userEmail", {
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Email không hợp lệ",
                },
              })}
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              error={!!errors.userEmail}
              helperText={errors.userEmail?.message}
            />
            
            <TextField
              {...register("userState", {
                valueAsNumber: true,
              })}
              label="Trạng thái (1: Hoạt động, 0: Không hoạt động)"
              type="number"
              fullWidth
              margin="normal"
              defaultValue={1}
              inputProps={{ min: 0, max: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createUserMutation.isPending || updateUserMutation.isPending}
            >
              {createUserMutation.isPending || updateUserMutation.isPending ? (
                <CircularProgress size={20} />
              ) : isEditing ? (
                "Cập nhật"
              ) : (
                "Thêm"
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog xác nhận xóa */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa người dùng &quot;{selectedUser?.userAccount}&quot;?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Hủy</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleteUserMutation.isPending}
          >
            {deleteUserMutation.isPending ? <CircularProgress size={20} /> : "Xóa"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Users