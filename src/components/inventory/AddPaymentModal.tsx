import { useForm } from 'react-hook-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAddPaymentMutation } from '@/queries/inventory'
import { formatCurrency } from '@/utils/format'
import { DatePicker } from 'antd'
import dayjs from 'dayjs'

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
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<PaymentFormData>({
    defaultValues: {
      payment_method: 'cash',
      payment_date: dayjs().format('YYYY-MM-DD'),
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Thêm thanh toán</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Số tiền */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              Số tiền <span className="text-red-500">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              step="1000"
              placeholder="Nhập số tiền"
              {...register('amount', {
                required: 'Vui lòng nhập số tiền',
                min: {
                  value: 1000,
                  message: 'Số tiền tối thiểu 1,000đ',
                },
                max: {
                  value: maxAmount,
                  message: `Số tiền không được vượt quá ${formatCurrency(maxAmount)}`,
                },
              })}
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount.message}</p>
            )}
            <p className="text-sm text-gray-500">
              Số tiền còn nợ: <span className="font-semibold">{formatCurrency(maxAmount)}</span>
            </p>
          </div>

          {/* Phương thức thanh toán */}
          <div className="space-y-2">
            <Label htmlFor="payment_method">
              Phương thức thanh toán <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watch('payment_method')}
              onValueChange={(value) => setValue('payment_method', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn phương thức" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Tiền mặt</SelectItem>
                <SelectItem value="transfer">Chuyển khoản</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ngày thanh toán */}
          <div className="space-y-2">
            <Label htmlFor="payment_date">Ngày thanh toán</Label>
            <DatePicker
              className="w-full"
              format="DD/MM/YYYY"
              value={watch('payment_date') ? dayjs(watch('payment_date')) : dayjs()}
              onChange={(date) => {
                setValue('payment_date', date ? date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'))
              }}
            />
          </div>

          {/* Ghi chú */}
          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <textarea
              id="notes"
              className="w-full min-h-[80px] px-3 py-2 border rounded-md"
              placeholder="Nhập ghi chú (không bắt buộc)"
              {...register('notes')}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
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
        </form>
      </DialogContent>
    </Dialog>
  )
}
