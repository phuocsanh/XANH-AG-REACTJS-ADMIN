import React, { useEffect } from 'react'
import { Modal, Form, Typography, Alert, Button } from 'antd'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { FormFieldNumber } from '@/components/form'
import { useCreateAdjustmentMutation } from '@/queries/inventory-adjustment'

const { Text } = Typography

// Schema cho modal điều chỉnh nhanh
const adjustStockSchema = z.object({
  newQuantity: z.number().min(0, 'Số lượng phải lớn hơn hoặc bằng 0'),
  reason: z.string().min(5, 'Vui lòng nhập lý do cụ thể (ít nhất 5 ký tự)'),
})

type AdjustStockValues = z.infer<typeof adjustStockSchema>

interface AdjustStockModalProps {
  visible: boolean
  onClose: () => void
  product: {
    id: number
    name: string
    trade_name: string
    currentQuantity: number
  }
}

const AdjustStockModal: React.FC<AdjustStockModalProps> = ({ visible, onClose, product }) => {
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<AdjustStockValues>({
    resolver: zodResolver(adjustStockSchema),
    defaultValues: {
      newQuantity: product.currentQuantity,
      reason: 'Kiểm kho định kỳ - Điều chỉnh tồn kho thực tế',
    },
  })

  // Cập nhật giá trị khi sản phẩm thay đổi
  useEffect(() => {
    if (visible) {
      reset({
        newQuantity: product.currentQuantity,
        reason: 'Kiểm kho định kỳ - Điều chỉnh tồn kho thực tế',
      })
    }
  }, [visible, product.currentQuantity, reset])

  const createAdjustmentMutation = useCreateAdjustmentMutation()

  const onSubmit = async (values: AdjustStockValues) => {
    const quantityChange = values.newQuantity - product.currentQuantity
    
    if (quantityChange === 0) {
      onClose()
      return
    }

    try {
      // 1. Tạo phiếu điều chỉnh với trạng thái Approved để tác động kho ngay
      const adjustmentData = {
        adjustment_type: quantityChange > 0 ? 'INCREASE' : 'DECREASE',
        reason: values.reason,
        status: 'approved', // Duyệt ngay lập tức
        items: [
          {
            product_id: product.id,
            quantity_change: quantityChange,
            reason: values.reason,
          }
        ]
      }

      await createAdjustmentMutation.mutateAsync(adjustmentData as any)
      onClose()
    } catch (error) {
      console.error('Error adjusting stock:', error)
    }
  }

  const watchedNewQuantity = watch('newQuantity')
  const diff = (watchedNewQuantity || 0) - product.currentQuantity

  return (
    <Modal
      title="Điều chỉnh tồn kho thực tế"
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <div className="mb-4">
        <Text strong>Sản phẩm: </Text>
        <Text>{product.trade_name || product.name}</Text>
      </div>

      <Alert
        message="Lưu ý quan trọng"
        description="Việc điều chỉnh này sẽ tạo một phiếu kiểm kho và thay đổi trực tiếp tồn kho của hệ thống để khớp với thực tế. Hành động này sẽ được ghi lại trong lịch sử."
        type="warning"
        showIcon
        className="mb-6"
      />

      <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <Text type="secondary" className="block text-xs uppercase mb-1">Hiện tại</Text>
          <Text strong className="text-lg">{product.currentQuantity}</Text>
        </div>
        <div>
          <Text type="secondary" className="block text-xs uppercase mb-1">Thay đổi</Text>
          <Text strong className={`text-lg ${diff > 0 ? 'text-green-500' : diff < 0 ? 'text-red-500' : ''}`}>
            {diff > 0 ? `+${diff}` : diff}
          </Text>
        </div>
      </div>

      <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
        <FormFieldNumber
          label="Số lượng thực tế mới"
          name="newQuantity"
          control={control}
          placeholder="Nhập số lượng đếm được thực tế"
          required
        />

        <Form.Item label="Lý do điều chỉnh" required help={errors.reason?.message} validateStatus={errors.reason ? 'error' : ''}>
          <textarea
            className="w-full p-2 border rounded-md min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...control.register('reason')}
            placeholder="Ví dụ: Kiểm kho phát hiện thiếu hàng, hàng bị hư hỏng..."
          />
        </Form.Item>

        <div className="flex justify-end gap-2 mt-6">
          <Button htmlType="button" onClick={onClose}>Hủy</Button>
          <Button 
            type="primary"
            htmlType="submit" 
            loading={createAdjustmentMutation.isPending}
          >
            Xác nhận điều chỉnh
          </Button>
        </div>
      </Form>
    </Modal>
  )
}

export default AdjustStockModal
