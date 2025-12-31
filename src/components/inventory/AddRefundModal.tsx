import { useForm } from 'react-hook-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAddRefundMutation } from '@/queries/inventory'
import { formatCurrency } from '@/utils/format'
import { DatePicker } from 'antd'
import dayjs from 'dayjs'

interface AddRefundModalProps {
  returnId: number
  maxAmount: number
  open: boolean
  onClose: () => void
}

interface RefundFormData {
  amount: number
  refund_method: string
  refund_date: string
  notes?: string
}

/**
 * Modal form thêm hoàn tiền mới cho phiếu trả hàng
 */
export default function AddRefundModal({
  returnId,
  maxAmount,
  open,
  onClose,
}: AddRefundModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<RefundFormData>({
    defaultValues: {
      refund_method: 'cash',
      refund_date: dayjs().format('YYYY-MM-DD'),
    },
  })

  const addRefundMutation = useAddRefundMutation()

  // Xử lý submit form
  const onSubmit = async (data: RefundFormData) => {
    try {
      await addRefundMutation.mutateAsync({
        returnId,
        data: {
          amount: Number(data.amount),
          refund_method: data.refund_method,
          refund_date: data.refund_date,
          notes: data.notes,
        },
      })
      reset()
      onClose()
    } catch (error) {
      console.error('Error adding refund:', error)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Thêm hoàn tiền</DialogTitle>
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
              Số tiền còn lại: <span className="font-semibold">{formatCurrency(maxAmount)}</span>
            </p>
          </div>

          {/* Phương thức hoàn tiền */}
          <div className="space-y-2">
            <Label htmlFor="refund_method">
              Phương thức hoàn tiền <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watch('refund_method')}
              onValueChange={(value) => setValue('refund_method', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn phương thức" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Tiền mặt</SelectItem>
                <SelectItem value="transfer">Chuyển khoản</SelectItem>
                <SelectItem value="debt_offset">Trừ công nợ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ngày hoàn tiền */}
          <div className="space-y-2">
            <Label htmlFor="refund_date">Ngày hoàn tiền</Label>
            <DatePicker
              className="w-full"
              format="DD/MM/YYYY"
              value={watch('refund_date') ? dayjs(watch('refund_date')) : dayjs()}
              onChange={(date) => {
                setValue('refund_date', date ? date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'))
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
              disabled={addRefundMutation.isPending}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={addRefundMutation.isPending}>
              {addRefundMutation.isPending ? 'Đang xử lý...' : 'Thêm hoàn tiền'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
