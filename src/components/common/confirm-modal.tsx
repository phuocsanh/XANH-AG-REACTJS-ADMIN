import React from "react"
import { Modal } from "antd"
import type { ButtonType } from "antd/es/button"

export interface ConfirmModalProps {
  open: boolean
  title?: string
  content?: string
  okText?: string
  cancelText?: string
  okType?: ButtonType
  danger?: boolean
  confirmLoading?: boolean
  onOk: () => void
  onCancel: () => void
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title = "Xác nhận",
  content = "",
  okText = "Đồng ý",
  cancelText = "Hủy",
  okType = "primary",
  danger = false,
  confirmLoading = false,
  onOk,
  onCancel,
}) => {
  return (
    <Modal
      title={title}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      okText={okText}
      cancelText={cancelText}
      okType={okType}
      okButtonProps={{ danger }}
      confirmLoading={confirmLoading}
    >
      <p>{content}</p>
    </Modal>
  )
}

export default ConfirmModal
