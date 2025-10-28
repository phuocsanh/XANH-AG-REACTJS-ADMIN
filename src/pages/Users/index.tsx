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
import { zodResolver } from "@hookform/resolvers/zod"
import {
  useUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from "@/queries/user"
import { User } from "@/models/user.model"
import DataTable from "@/components/common/data-table"
import {
  createUserSchema,
  CreateUserData,
  defaultCreateUserValues,
} from "./form-config"

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
  } = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: defaultCreateUserValues,
  })

  // Xử lý mở dialog thêm người dùng
  const handleAddUser = () => {
    setSelectedUser(null)
    setIsEditing(false)
    reset(defaultCreateUserValues)
    setOpenDialog(true)
  }

  // Xử lý mở dialog sửa người dùng
  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsEditing(true)
    reset({
      userAccount: user.account,
      userEmail: "",
      userState: user.status === "active" ? 1 : 0,
    })
    setOpenDialog(true)
  }

  // Xử lý mở dialog xóa người dùng
  const handleDeleteUser = (user: User) => {
    setSelectedUser(user)
    setOpenDeleteDialog(true)
  }

  // Xử lý submit form
  const onSubmit = async (data: CreateUserData) => {
    try {
      if (isEditing && selectedUser) {
        // Cập nhật người dùng
        await updateUserMutation.mutateAsync({
          id: selectedUser.id,
          userData: data,
        })
      } else {
        // Tạo người dùng mới
        const createData = {
          salt: "default_salt",
          account: data.userAccount,
          password: data.userPassword,
          loginIp: data.userEmail,
          status:
            data.userState === 1 ? ("active" as const) : ("inactive" as const),
        }
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
        await deleteUserMutation.mutateAsync(selectedUser.id)
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
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='400px'
      >
        <CircularProgress />
      </Box>
    )
  }

  // Hiển thị lỗi
  if (error) {
    return (
      <Box p={3}>
        <Typography color='error'>
          Có lỗi xảy ra khi tải dữ liệu người dùng
        </Typography>
      </Box>
    )
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={3}
      >
        <Typography variant='h4' component='h1'>
          Quản lý người dùng
        </Typography>
        <Button
          variant='contained'
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
            dataIndex: "id",
            key: "id",
            sorter: true,
          },
          {
            title: "Tài khoản",
            dataIndex: "account",
            key: "account",
            sorter: true,
          },
          {
            title: "Email",
            dataIndex: "loginIp",
            key: "loginIp",
            render: (email: string) => email || "N/A",
          },
          {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            render: (state: string) => (
              <Chip
                label={state === "active" ? "Hoạt động" : "Không hoạt động"}
                color={state === "active" ? "success" : "default"}
                size='small'
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
        searchPlaceholder='Tìm kiếm người dùng...'
        searchableColumns={["userAccount", "userEmail"]}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
        scroll={{ x: "100%" }}
        paginationConfig={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} của ${total} người dùng`,
        }}
      />

      {/* Dialog thêm/sửa người dùng */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>
          {isEditing ? "Chỉnh sửa người dùng" : "Thêm người dùng"}
        </DialogTitle>
        <DialogContent>
          <Box
            component='form'
            onSubmit={handleSubmit(onSubmit)}
            sx={{ mt: 2 }}
          >
            <TextField
              fullWidth
              label='Tài khoản *'
              {...register("userAccount")}
              error={!!errors.userAccount}
              helperText={errors.userAccount?.message as string}
              margin='normal'
            />

            {!isEditing && (
              <TextField
                fullWidth
                label='Mật khẩu *'
                type='password'
                {...register("userPassword")}
                error={!!errors.userPassword}
                helperText={errors.userPassword?.message as string}
                margin='normal'
              />
            )}

            <TextField
              fullWidth
              label='Email'
              type='email'
              {...register("userEmail")}
              error={!!errors.userEmail}
              helperText={errors.userEmail?.message as string}
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
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa người dùng &#39;
            {selectedUser?.account}&#39;?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Hủy</Button>
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

export default Users
