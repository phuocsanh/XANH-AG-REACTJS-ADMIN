import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
} from "@mui/material"
import { Lock } from "@mui/icons-material"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useChangePasswordMutation } from "@/queries/auth"
import FormField from "@/components/form/form-field"
import {
  changePasswordFormSchema,
  ChangePasswordFormData,
  defaultChangePasswordValues,
} from "./form-config"

/**
 * Component trang đổi mật khẩu
 * Cho phép người dùng đã đăng nhập thay đổi mật khẩu của mình
 */
export const ChangePassword = () => {
  const changePasswordMutation = useChangePasswordMutation()

  // Form handling với react-hook-form và zod validation
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: defaultChangePasswordValues,
  })

  /**
   * Xử lý submit form đổi mật khẩu
   */
  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      await changePasswordMutation.mutateAsync({
        old_password: data.old_password,
        new_password: data.new_password,
      })
      // Reset form sau khi thành công
      reset()
    } catch (error) {
      console.error("Error changing password:", error)
    }
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "calc(100vh - 200px)",
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 500,
          width: "100%",
          borderRadius: 2,
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Lock
            sx={{
              fontSize: 48,
              color: "primary.main",
              mb: 1,
            }}
          />
          <Typography variant="h4" component="h1" gutterBottom>
            Đổi mật khẩu
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Vui lòng nhập mật khẩu hiện tại và mật khẩu mới của bạn
          </Typography>
        </Box>

        {/* Form */}
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          {/* Mật khẩu hiện tại */}
          <FormField
            name="old_password"
            control={control}
            label="Mật khẩu hiện tại"
            type="password"
            placeholder="Nhập mật khẩu hiện tại"
            required
          />

          {/* Mật khẩu mới */}
          <FormField
            name="new_password"
            control={control}
            label="Mật khẩu mới"
            type="password"
            placeholder="Nhập mật khẩu mới"
            required
          />

          {/* Xác nhận mật khẩu mới */}
          <FormField
            name="confirm_password"
            control={control}
            label="Xác nhận mật khẩu mới"
            type="password"
            placeholder="Nhập lại mật khẩu mới"
            required
          />

          {/* Buttons */}
          <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => reset()}
              disabled={changePasswordMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={changePasswordMutation.isPending}
              sx={{
                background: "linear-gradient(180deg, #059669 0%, #047857 100%)",
                "&:hover": {
                  background: "linear-gradient(180deg, #047857 0%, #059669 100%)",
                },
              }}
            >
              {changePasswordMutation.isPending ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Đổi mật khẩu"
              )}
            </Button>
          </Box>
        </Box>

        {/* Ghi chú bảo mật */}
        <Box sx={{ mt: 3, p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>Lưu ý:</strong>
            <br />
            • Mật khẩu phải có ít nhất 6 ký tự
            <br />
            • Mật khẩu mới phải khác mật khẩu hiện tại
            <br />• Sau khi đổi mật khẩu thành công, bạn sẽ cần đăng nhập lại
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}

export default ChangePassword
