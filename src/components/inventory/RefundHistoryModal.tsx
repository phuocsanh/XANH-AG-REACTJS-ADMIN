import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { InventoryReturnRefund } from '@/models/inventory-return.model'
import { useReturnRefundsQuery } from '@/queries/inventory'
import { formatCurrency } from '@/utils/format'
import dayjs from 'dayjs'
import { Plus } from 'lucide-react'
import AddRefundModal from '@/components/inventory/AddRefundModal'

interface RefundHistoryModalProps {
  returnId: number
  returnCode: string
  totalAmount: number
  refundedAmount: number
  open: boolean
  onClose: () => void
}

/**
 * Modal hiển thị lịch sử hoàn tiền của phiếu trả hàng
 */
export default function RefundHistoryModal({
  returnId,
  returnCode,
  totalAmount,
  refundedAmount,
  open,
  onClose,
}: RefundHistoryModalProps) {
  const [showAddRefund, setShowAddRefund] = useState(false)
  
  // Query lấy danh sách refunds
  const { data: refunds = [], isLoading, refetch } = useReturnRefundsQuery(returnId)
  
  const remainingAmount = totalAmount - refundedAmount

  // Columns cho table
  const columns: ColumnsType<InventoryReturnRefund> = [
    {
      title: 'Ngày hoàn tiền',
      dataIndex: 'refund_date',
      key: 'refund_date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
      width: 150,
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <span className="font-semibold text-blue-600">
          {formatCurrency(amount)}
        </span>
      ),
      width: 150,
    },
    {
      title: 'Phương thức',
      dataIndex: 'refund_method',
      key: 'refund_method',
      render: (method: string) => {
        const methodMap: Record<string, string> = {
          cash: 'Tiền mặt',
          transfer: 'Chuyển khoản',
          debt_offset: 'Trừ công nợ',
        }
        return methodMap[method] || method
      },
      width: 150,
    },
    {
      title: 'Ghi chú',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
    },
    {
      title: 'Người tạo',
      dataIndex: 'creator',
      key: 'creator',
      render: (creator: any) => creator?.account || creator?.username || '-',
      width: 120,
    },
  ]

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>
              Lịch sử hoàn tiền - {returnCode}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Tổng giá trị trả hàng</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(totalAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Đã hoàn tiền</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {formatCurrency(refundedAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Còn lại</p>
                  <p className="text-lg font-semibold text-orange-600">
                    {formatCurrency(remainingAmount)}
                  </p>
                </div>
              </div>
            </div>

            {/* Add Refund Button */}
            {remainingAmount > 0 && (
              <Button
                onClick={() => setShowAddRefund(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm hoàn tiền
              </Button>
            )}

            {/* Refunds Table */}
            <Table
              columns={columns}
              dataSource={refunds}
              rowKey="id"
              loading={isLoading}
              pagination={false}
              scroll={{ x: 800 }}
              locale={{
                emptyText: 'Chưa có hoàn tiền nào',
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Refund Modal */}
      <AddRefundModal
        returnId={returnId}
        maxAmount={remainingAmount}
        open={showAddRefund}
        onClose={() => {
          setShowAddRefund(false)
          refetch()
        }}
      />
    </>
  )
}
