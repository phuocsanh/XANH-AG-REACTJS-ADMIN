import { TypeOptions, toast } from "react-toastify"

/**
 * showToast
 * @param message message content to show
 * @param type include success, error, warning, info
 */
const showToast = (message: string, type: TypeOptions) => {
  toast.dismiss()
  toast(`${message}`, { type })
}

const notification = {
  success: (message: string) => showToast(message, "success"),
  error: (message: string) => showToast(message, "error"),
  warning: (message: string) => showToast(message, "warning"),
  info: (message: string) => showToast(message, "info"),
}

export default notification
