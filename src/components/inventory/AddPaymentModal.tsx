import { useForm } from 'react-hook-form'
import { Modal, Form } from 'antd'
import { Button } from '@/components/ui/button'
import { useAddPaymentMutation } from '@/queries/inventory'
import { formatCurrency } from '@/utils/format'
import dayjs from 'dayjs'
import FormFieldNumber from '@/components/form/form-field-number'
import FormComboBox from '@/components/form/form-combo-box'
import FormDatePicker from '@/components/form/form-date-picker'

interface AddPaymentModalProps {
  receiptId: number
  maxAmount: number
  open: boolean
  onClose: () => void
}

interface PaymentFormData {
  amount: number
  payment_method: string
  payment_date: string
  notes?: string
}

/**
 * Modal form thêm thanh toán mới cho phiếu nhập kho
 */
export default function AddPaymentModal({
  receiptId,
  maxAmount,
  open,
  onClose,
}: AddPaymentModalProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PaymentFormData>({
    defaultValues: {
      payment_method: 'cash',
      payment_date: dayjs().toISOString(),
    },
  })

  const addPaymentMutation = useAddPaymentMutation()

  // Xử lý submit form
  const onSubmit = async (data: PaymentFormData) => {
    try {
      await addPaymentMutation.mutateAsync({
        receiptId,
        data: {
          amount: Number(data.amount),
          payment_method: data.payment_method,
          payment_date: data.payment_date,
          notes: data.notes,
        },
      })
      reset()
      onClose()
    } catch (error) {
      console.error('Error adding payment:', error)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  // Options cho phương thức thanh toán
  const paymentMethodOptions = [
    { value: 'cash', label: 'Tiền mặt' },
    { value: 'transfer', label: 'Chuyển khoản' },
  ]

  return (
    <Modal
      title="Thêm thanh toán"
      open={open}
      onCancel={handleClose}
      footer={null}
      width={600}
      maskClosable={false}
      destroyOnClose
      getContainer={false}
      zIndex={1050}
    >
      <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
        {/* Số tiền */}
        <FormFieldNumber
          name="amount"
          control={control}
          label="Số tiền"
          placeholder="Nhập số tiền"
          required
          rules={{
            required: true,
            min: 1000,
            max: maxAmount,
          }}
          suffix=""
        />
        <div style={{ marginTop: '-4px', marginBottom: '16px', fontSize: '14px', color: '#666' }}>
          Số tiền còn nợ: <span style={{ fontWeight: 600 }}>{formatCurrency(maxAmount)}</span>
        </div>

        {/* Phương thức thanh toán */}
        <FormComboBox
          name="payment_method"
          control={control}
          label="Phương thức thanh toán"
          placeholder="Chọn phương thức"
          options={paymentMethodOptions}
          required
        />

        {/* Ngày thanh toán */}
        <FormDatePicker
          name="payment_date"
          control={control}
          label="Ngày thanh toán"
          placeholder="Chọn ngày thanh toán"
          format="DD/MM/YYYY"
        />

        {/* Ghi chú */}
        <Form.Item label="Ghi chú">
          <textarea
            className="w-full min-h-[80px] px-3 py-2 border rounded-md"
            placeholder="Nhập ghi chú (không bắt buộc)"
            {...control.register('notes')}
          />
        </Form.Item>

        {/* Actions */}
        <div className="flex gap-2 justify-end mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={addPaymentMutation.isPending}
          >
            Hủy
          </Button>
          <Button type="submit" disabled={addPaymentMutation.isPending}>
            {addPaymentMutation.isPending ? 'Đang xử lý...' : 'Thêm thanh toán'}
          </Button>
        </div>
      </Form>
    </Modal>
  )
}
