import Dialog from "@mui/material/Dialog"
import { ReactElement } from "react"

export default function DialogCustom({
  open,
  setOpen,
  children,
  disableBackdropClick = false,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  children: ReactElement
  disableBackdropClick?: boolean // Các thành phần của DialogContent thêm vào đây  // TypeScript only: need a type cast here because https://github.com/Microsoft/TypeScript/issues/26591
}) {
  const handleClose = () => {
    setOpen(false)
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={(event, reason) => {
          if (reason !== "backdropClick" && !disableBackdropClick) {
            handleClose()
          }
        }}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
      >
        {children}
      </Dialog>
    </>
  )
}
