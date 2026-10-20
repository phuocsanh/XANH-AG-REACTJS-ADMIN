/**
 * Khối xem trước ảnh hưởng của việc hoàn tác phiếu thu.
 *
 * Dùng chung cho trang Lịch sử Thanh toán và trang Công nợ để hai nơi luôn hiển thị
 * cùng một nội dung (cảnh báo, hóa đơn khôi phục công nợ, phiếu nợ và tích lũy khách hàng).
 */
import { Alert, Table } from "antd"
import type { PaymentRollbackPreview } from "@/models/payment"

interface PaymentRollbackPreviewProps {
  /** Dữ liệu xem trước do backend trả về (đã gồm blockers/warnings). */
  preview: PaymentRollbackPreview
}

/** Định dạng tiền tệ Việt Nam dùng trong bảng xem trước. */
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value) || 0)

const PaymentRollbackPreviewPanel: React.FC<PaymentRollbackPreviewProps> = ({ preview }) => {
  return (
    <div>
      {preview.blockers.length > 0 && (
        <Alert
          type='error'
          showIcon
          className='mb-3'
          message='Không thể hoàn tác phiếu thu này'
          description={
            <ul className='mb-0 pl-4'>
              {preview.blockers.map((blocker) => (
                <li key={blocker.code}>{blocker.message}</li>
              ))}
            </ul>
          }
        />
      )}

      {preview.warnings.length > 0 && (
        <Alert
          type='warning'
          showIcon
          className='mb-3'
          message='Lưu ý'
          description={
            <ul className='mb-0 pl-4'>
              {preview.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          }
        />
      )}

      {preview.payment_kind === "loan" && preview.loan && (
        <Alert
          type='warning'
          showIcon
          className='mb-3'
          message={`Phiếu trả vay: khoản vay ${preview.loan.loan_code} sẽ mở lại với dư nợ ${formatCurrency(
            preview.loan.principal_amount
          )}`}
        />
      )}

      {preview.invoice_restores.length > 0 && (
        <>
          <div className='font-medium mb-1'>Hóa đơn sẽ khôi phục công nợ</div>
          <Table
            size='small'
            rowKey='invoice_id'
            pagination={false}
            className='mb-3'
            dataSource={preview.invoice_restores}
            columns={[
              { title: "Hóa đơn", dataIndex: "invoice_code" },
              {
                title: "Tiền hoàn tác",
                dataIndex: "restore_amount",
                align: "right",
                render: (value: number) => formatCurrency(value),
              },
              {
                title: "Đã thu trước",
                dataIndex: "partial_before",
                align: "right",
                render: (value: number) => formatCurrency(value),
              },
              {
                title: "Đã thu sau",
                dataIndex: "partial_after",
                align: "right",
                render: (value: number) => formatCurrency(value),
              },
              {
                title: "Còn nợ sau",
                dataIndex: "remaining_after",
                align: "right",
                render: (value: number) => formatCurrency(value),
              },
            ]}
          />
        </>
      )}

      {preview.debt_notes.length > 0 && (
        <>
          <div className='font-medium mb-1'>Phiếu công nợ sẽ cập nhật</div>
          <Table
            size='small'
            rowKey='debt_note_id'
            pagination={false}
            className='mb-3'
            dataSource={preview.debt_notes}
            columns={[
              { title: "Phiếu nợ", dataIndex: "debt_note_code" },
              {
                title: "Đã thu trước",
                dataIndex: "paid_before",
                align: "right",
                render: (value: number) => formatCurrency(value),
              },
              {
                title: "Đã thu sau",
                dataIndex: "paid_after",
                align: "right",
                render: (value: number) => formatCurrency(value),
              },
              {
                title: "Còn nợ sau",
                dataIndex: "remaining_after",
                align: "right",
                render: (value: number) => formatCurrency(value),
              },
              { title: "Trạng thái sau", dataIndex: "status_after" },
            ]}
          />
        </>
      )}

      {preview.accumulation && (
        <Alert
          className='mb-3'
          type={preview.accumulation.pending_after < 0 ? "error" : "info"}
          showIcon
          message={`Tích lũy khách hàng: ${formatCurrency(
            preview.accumulation.pending_before
          )} → ${formatCurrency(preview.accumulation.pending_after)}`}
        />
      )}
    </div>
  )
}

export default PaymentRollbackPreviewPanel
