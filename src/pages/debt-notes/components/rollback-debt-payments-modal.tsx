/**
 * Modal hoàn tác phiếu thu của một phiếu công nợ (dùng tại trang Công nợ).
 *
 * - Liệt kê toàn bộ phiếu thu đã phân bổ vào phiếu công nợ (một phiếu nợ có thể thu nhiều lần).
 * - Mỗi phiếu hiển thị trạng thái hoàn tác do backend tính (`can_rollback` + `rollback_block_reason`).
 * - Chọn một phiếu để xem trước ảnh hưởng, bắt buộc nhập lý do rồi mới xác nhận.
 * Backend vẫn là nơi kiểm soát cuối cùng (guard matrix + preview_token + 409 khi hoàn tác lần hai).
 */
import * as React from "react"
import { Alert, Button, Descriptions, Input, Modal, Table, Tag, Tooltip } from "antd"
import type { ColumnsType } from "antd/es/table"
import { toast } from "react-toastify"
import { RollbackOutlined } from "@ant-design/icons"
import type { Payment } from "@/models/payment"
import {
  usePaymentsQuery,
  useRollbackPaymentMutation,
  useRollbackPreviewQuery,
} from "@/queries/payment"
import PaymentRollbackPreviewPanel from "@/components/common/payment-rollback-preview"
import { paymentMethodLabels } from "@/pages/payments/form-config"

interface RollbackDebtPaymentsModalProps {
  /** Trạng thái mở modal (cha chỉ mount khi cần nên luôn là true khi mở). */
  open: boolean
  /** Mã phiếu công nợ đang xem. */
  debtNoteCode: string
  /** Tên khách hàng để hiển thị cho dễ đối chiếu. */
  customerName?: string
  /** Đóng modal. */
  onClose: () => void
}

/** Định dạng tiền tệ Việt Nam. */
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value) || 0)

const RollbackDebtPaymentsModal: React.FC<RollbackDebtPaymentsModalProps> = ({
  open,
  debtNoteCode,
  customerName,
  onClose,
}) => {
  // Phiếu thu đang chọn để xem trước (null = đang ở bước danh sách)
  const [selectedPayment, setSelectedPayment] = React.useState<Payment | null>(null)
  // Lý do hoàn tác là bắt buộc để lưu vết đối soát
  const [reason, setReason] = React.useState<string>("")

  // Danh sách phiếu thu phân bổ trực tiếp vào phiếu công nợ này
  const {
    data: paymentsData,
    isLoading: isPaymentsLoading,
    isError: isPaymentsError,
    refetch: refetchPayments,
  } = usePaymentsQuery({ page: 1, limit: 100, debt_note_code: debtNoteCode })

  const payments = (paymentsData?.data?.items || []) as Payment[]
  const totalPayments = paymentsData?.data?.total ?? payments.length

  // Xem trước ảnh hưởng: hóa đơn/công nợ/tích lũy sẽ đổi và lý do bị chặn
  const {
    data: preview,
    isFetching: isPreviewLoading,
    isError: isPreviewError,
    isSuccess: isPreviewSuccess,
    refetch: refetchPreview,
  } = useRollbackPreviewQuery(selectedPayment?.id ?? null)

  const rollbackMutation = useRollbackPaymentMutation()

  // Chọn phiếu để xem trước, xóa lý do cũ để tránh gửi nhầm
  const handleSelectPayment = (payment: Payment) => {
    setReason("")
    setSelectedPayment(payment)
  }

  // Quay lại danh sách phiếu thu
  const handleBackToList = () => {
    if (rollbackMutation.isPending) return
    setSelectedPayment(null)
    setReason("")
  }

  // Đóng modal và dọn state để lần mở sau bắt đầu sạch
  const handleClose = () => {
    if (rollbackMutation.isPending) return
    setSelectedPayment(null)
    setReason("")
    onClose()
  }

  // Xác nhận hoàn tác: bắt buộc lý do và chỉ gửi khi backend cho phép
  const handleConfirmRollback = () => {
    if (!selectedPayment || rollbackMutation.isPending) return
    const trimmedReason = reason.trim()
    if (!trimmedReason) {
      toast.warning("Vui lòng nhập lý do hoàn tác")
      return
    }
    if (
      !isPreviewSuccess ||
      isPreviewLoading ||
      isPreviewError ||
      preview?.payment_id !== selectedPayment.id ||
      !preview?.preview_token
    ) {
      toast.warning("Vui lòng tải lại bản xem trước trước khi xác nhận")
      return
    }
    if (!preview.can_rollback) {
      toast.error(preview.blockers[0]?.message || "Phiếu thu không thể hoàn tác")
      return
    }

    rollbackMutation.mutate(
      { id: selectedPayment.id, reason: trimmedReason, preview_token: preview.preview_token },
      {
        onSuccess: () => {
          setSelectedPayment(null)
          setReason("")
          onClose()
        },
        // Bản xem trước có thể đã cũ (dữ liệu đổi sau khi mở) -> tải lại để hiện lý do chặn mới
        onError: () => {
          void refetchPreview()
        },
      }
    )
  }

  // Cột danh sách phiếu thu của phiếu công nợ
  const columns: ColumnsType<Payment> = [
    { title: "Mã phiếu", dataIndex: "code" },
    {
      title: "Ngày thu",
      dataIndex: "payment_date",
      render: (value: string) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-"),
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      align: "right",
      render: (value: number) => formatCurrency(value),
    },
    {
      title: "Phương thức",
      dataIndex: "payment_method",
      render: (value: keyof typeof paymentMethodLabels) => paymentMethodLabels[value] || value,
    },
    {
      title: "Trạng thái",
      dataIndex: "can_rollback",
      render: (_: unknown, record) =>
        record.can_rollback === false ? (
          <Tooltip title={record.rollback_block_reason || "Không thể hoàn tác phiếu thu này"}>
            <Tag color='red'>Bị chặn</Tag>
          </Tooltip>
        ) : (
          <Tag color='green'>Hoàn tác được</Tag>
        ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 130,
      render: (_: unknown, record) => (
        <Tooltip
          title={
            record.can_rollback === false
              ? record.rollback_block_reason || "Không thể hoàn tác phiếu thu này"
              : ""
          }
        >
          <Button
            danger
            size='small'
            icon={<RollbackOutlined />}
            disabled={record.can_rollback === false}
            onClick={() => handleSelectPayment(record)}
          >
            Hoàn tác
          </Button>
        </Tooltip>
      ),
    },
  ]

  // Footer đổi theo bước: danh sách chỉ cần Đóng, bước xem trước cần Xác nhận
  const footer = selectedPayment
    ? [
        <Button key='back' onClick={handleBackToList} disabled={rollbackMutation.isPending}>
          Quay lại danh sách
        </Button>,
        <Button
          key='confirm'
          danger
          type='primary'
          icon={<RollbackOutlined />}
          onClick={handleConfirmRollback}
          loading={rollbackMutation.isPending}
          disabled={
            isPreviewLoading ||
            !isPreviewSuccess ||
            isPreviewError ||
            preview?.payment_id !== selectedPayment.id ||
            !preview?.preview_token ||
            !reason.trim() ||
            preview?.can_rollback === false
          }
        >
          Xác nhận hoàn tác
        </Button>,
      ]
    : [
        <Button key='close' onClick={handleClose}>
          Đóng
        </Button>,
      ]

  return (
    <Modal
      title={
        selectedPayment
          ? `Xác nhận hoàn tác phiếu thu ${selectedPayment.code}`
          : `Hoàn tác phiếu thu — phiếu công nợ ${debtNoteCode}`
      }
      open={open}
      onCancel={handleClose}
      footer={footer}
      width={selectedPayment ? 760 : 900}
      // Giới hạn chiều cao thân modal: một phiếu nợ có thể có rất nhiều phiếu thu (hàng chục)
      styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}
      maskClosable={!rollbackMutation.isPending}
      closable={!rollbackMutation.isPending}
    >
      {selectedPayment ? (
        <div>
          <Descriptions bordered size='small' column={1} className='mb-3'>
            <Descriptions.Item label='Mã phiếu'>{selectedPayment.code}</Descriptions.Item>
            <Descriptions.Item label='Số tiền'>
              {formatCurrency(selectedPayment.amount)}
            </Descriptions.Item>
            <Descriptions.Item label='Khách hàng'>
              {selectedPayment.customer?.name ||
                selectedPayment.customer_name ||
                customerName ||
                "-"}
            </Descriptions.Item>
            <Descriptions.Item label='Phiếu công nợ'>{debtNoteCode}</Descriptions.Item>
          </Descriptions>

          {isPreviewLoading && (
            <Alert
              type='info'
              showIcon
              className='mb-3'
              message='Đang kiểm tra điều kiện hoàn tác...'
            />
          )}

          {isPreviewError && (
            <Alert
              type='error'
              showIcon
              className='mb-3'
              message='Không tải được bản xem trước. Vui lòng thử lại.'
              action={<Button onClick={() => void refetchPreview()}>Tải lại</Button>}
            />
          )}

          {isPreviewSuccess && preview && <PaymentRollbackPreviewPanel preview={preview} />}

          <div className='font-medium mb-1'>
            Lý do hoàn tác <span style={{ color: "#ff4d4f" }}>*</span>
          </div>
          <Input.TextArea
            rows={3}
            maxLength={500}
            showCount
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder='Ví dụ: nhập sai số tiền, thu trùng phiếu...'
          />

          <p className='mt-3 mb-0 text-gray-600'>
            Hệ thống chỉ hoàn tác ghi nhận; tiền thực tế do người dùng tự xử lý. Phiếu thu sẽ bị xóa
            và được lưu vết trong Lịch sử hoàn tác.
          </p>
        </div>
      ) : (
        <div>
          {isPaymentsError && (
            <Alert
              type='error'
              showIcon
              className='mb-3'
              message='Không tải được danh sách phiếu thu của phiếu công nợ này.'
              action={<Button onClick={() => void refetchPayments()}>Tải lại</Button>}
            />
          )}

          <p className='mb-2 text-gray-600'>
            Phiếu công nợ <b>{debtNoteCode}</b>
            {customerName ? ` — ${customerName}` : ""}: chọn phiếu thu cần hoàn tác.
          </p>

          <Table<Payment>
            size='small'
            rowKey='id'
            loading={isPaymentsLoading}
            dataSource={payments}
            pagination={false}
            locale={{ emptyText: "Phiếu công nợ chưa có phiếu thu nào" }}
            columns={columns}
          />

          {totalPayments > payments.length && (
            <p className='mt-2 mb-0 text-gray-600'>
              Đang hiển thị {payments.length}/{totalPayments} phiếu thu gần nhất. Vào Lịch sử Thanh
              toán để xem đầy đủ.
            </p>
          )}
        </div>
      )}
    </Modal>
  )
}

export default RollbackDebtPaymentsModal

