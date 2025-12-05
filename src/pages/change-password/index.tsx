import { useState } from "react"
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  IconButton,
  InputAdornment,
  CircularProgress,
} from "@mui/material"
import { Visibility, VisibilityOff, Lock } from "@mui/icons-material"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useChangePasswordMutation } from "@/queries/auth"
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
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const changePasswordMutation = useChangePasswordMutation()

  // Form handling với react-hook-form và zod validation
  const {
    register,
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
          <TextField
            fullWidth
            type={showOldPassword ? "text" : "password"}
            label="Mật khẩu hiện tại *"
            {...register("old_password")}
            error={!!errors.old_password}
            helperText={errors.old_password?.message}
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    edge="end"
                  >
                    {showOldPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Mật khẩu mới */}
          <TextField
            fullWidth
            type={showNewPassword ? "text" : "password"}
            label="Mật khẩu mới *"
            {...register("new_password")}
            error={!!errors.new_password}
            helperText={errors.new_password?.message}
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    edge="end"
                  >
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Xác nhận mật khẩu mới */}
          <TextField
            fullWidth
            type={showConfirmPassword ? "text" : "password"}
            label="Xác nhận mật khẩu mới *"
            {...register("confirm_password")}
            error={!!errors.confirm_password}
            helperText={errors.confirm_password?.message}
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
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
