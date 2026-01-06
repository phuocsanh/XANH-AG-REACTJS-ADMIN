import { useState } from 'react'
import { Modal } from 'antd'
import { Button } from '@/components/ui/button'
import { Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { InventoryReceiptPayment } from '@/models/inventory.model'
import { useReceiptPaymentsQuery, useDeletePaymentMutation, useReceiptReturnsQuery } from '@/queries/inventory'
import { formatCurrency } from '@/utils/format'
import dayjs from 'dayjs'
import { Trash2, Plus, FileText, Edit } from 'lucide-react'
import { toast } from 'react-toastify'
import AddPaymentModal from '@/components/inventory/AddPaymentModal'
import { useNavigate } from 'react-router-dom'

interface PaymentHistoryModalProps {
  receiptId: number
  receiptCode: string
  debtAmount: number
  open: boolean
  onClose: () => void
  // Chi tiết phiếu nhập
  totalAmount?: number
  returnedAmount?: number
  finalAmount?: number
  paidAmount?: number
  // Thông tin nhà cung cấp
  supplierId?: number
  supplierName?: string
  // Trạng thái phiếu
  receiptStatus?: string
}

/**
 * Modal hiển thị lịch sử thanh toán của phiếu nhập kho
 */
export default function PaymentHistoryModal({
  receiptId,
  receiptCode,
  debtAmount,
  open,
  onClose,
  totalAmount = 0,
  returnedAmount = 0,
  finalAmount = 0,
  paidAmount = 0,
  supplierId,
  supplierName = 'Nhà cung cấp',
  receiptStatus = 'draft',
}: PaymentHistoryModalProps) {
  const [showAddPayment, setShowAddPayment] = useState(false)
  const navigate = useNavigate()
  
  // Query lấy danh sách payments
  const { data: payments = [], isLoading, refetch } = useReceiptPaymentsQuery(receiptId)
  
  // Query lấy danh sách returns
  const { data: returns = [] } = useReceiptReturnsQuery(receiptId)
  
  // Mutation xóa payment
  const deletePaymentMutation = useDeletePaymentMutation()

  // Xử lý xóa payment
  const handleDelete = async (paymentId: number) => {
    if (!confirm('Bạn có chắc muốn xóa khoản thanh toán này?')) return
    
    try {
      await deletePaymentMutation.mutateAsync({ receiptId, paymentId })
      refetch()
    } catch (error) {
      console.error('Error deleting payment:', error)
    }
  }

  // Columns cho table
  const columns: ColumnsType<InventoryReceiptPayment> = [
    {
      title: 'Ngày thanh toán',
      dataIndex: 'payment_date',
      key: 'payment_date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
      width: 150,
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <span className="font-semibold text-green-600">
          {formatCurrency(amount)}
        </span>
      ),
      width: 150,
    },
    {
      title: 'Phương thức',
      dataIndex: 'payment_method',
      key: 'payment_method',
      render: (method: string) => {
        const methodMap: Record<string, string> = {
          cash: 'Tiền mặt',
          transfer: 'Chuyển khoản',
        }
        return methodMap[method] || method
      },
      width: 120,
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
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDelete(record.id)}
          disabled={deletePaymentMutation.isPending}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      ),
    },
  ]

  return (
    <>
      <Modal
        title={
          <div style={{ paddingRight: '24px' }}>
            Lịch sử thanh toán - {receiptCode}
          </div>
        }
        open={open}
        onCancel={onClose}
        footer={null}
        width={1200}
        style={{ top: 20 }}
        bodyStyle={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
      >

          <div className="space-y-4">
            {/* Chi tiết phiếu nhập */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-900 mb-3">Chi tiết phiếu nhập</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tổng tiền ban đầu:</span>
                  <span className="font-semibold">{formatCurrency(totalAmount)}</span>
                </div>
                
                {/* Đã trả hàng */}
                {returnedAmount > 0 && (
                  <div className="flex justify-between text-sm bg-red-50 -mx-2 px-2 py-1 rounded">
                    <span className="text-red-700 font-medium">Đã trả hàng:</span>
                    <span className="font-semibold text-red-600">-{formatCurrency(returnedAmount)}</span>
                  </div>
                )}
                
                {/* Đã điều chỉnh */}
                {(totalAmount - (finalAmount || totalAmount) - returnedAmount) !== 0 && (
                  <div className="flex justify-between text-sm bg-orange-50 -mx-2 px-2 py-1 rounded">
                    <span className="text-orange-700 font-medium">Đã điều chỉnh:</span>
                    <span className="font-semibold text-orange-600">
                      {formatCurrency(Math.abs(totalAmount - (finalAmount || totalAmount) - returnedAmount))}
                    </span>
                  </div>
                )}
                
                <div className="border-t border-blue-200 pt-2 flex justify-between text-sm">
                  <span className="text-gray-700 font-medium">Giá trị thực tế:</span>
                  <span className="font-semibold text-blue-700">{formatCurrency(finalAmount || totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Đã thanh toán:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(
                      payments.reduce((sum: number, p: InventoryReceiptPayment) => sum + Number(p.amount), 0)
                    )}
                  </span>
                </div>
                <div className="border-t border-blue-200 pt-2 flex justify-between">
                  <span className="text-gray-700 font-semibold">Còn nợ:</span>
                  <span className="text-lg font-bold text-orange-600">{formatCurrency(debtAmount)}</span>
                </div>
              </div>
            </div>

            {/* Thông tin nhà cung cấp */}
            {supplierId && (
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="text-sm font-semibold text-purple-900 mb-3">
                  Thông tin nhà cung cấp
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tên nhà cung cấp:</span>
                    <span className="font-semibold text-purple-700">{supplierName}</span>
                  </div>
                  <div className="text-xs text-gray-500 italic mt-2">
                    💡 Để xem tổng nợ nhà cung cấp, vui lòng truy cập trang Quản lý Nhà cung cấp
                  </div>
                </div>
              </div>
            )}

            {/* Add Payment Button */}
            {debtAmount > 0 && (receiptStatus === 'approved' || receiptStatus === 'Đã duyệt') && (
              <Button
                onClick={() => setShowAddPayment(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm thanh toán
              </Button>
            )}

            {/* Thông báo cho phiếu chưa duyệt */}
            {receiptStatus !== 'approved' && receiptStatus !== 'Đã duyệt' && (
              <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded border border-orange-200">
                ⚠️ Phiếu cần được duyệt trước khi thanh toán
              </div>
            )}

            {/* Phiếu liên quan */}
            {returns.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Phiếu liên quan
                </h3>
                
                {/* Phiếu trả hàng */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-700">
                      Phiếu trả hàng ({returns.length})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {returns.map((ret: any) => (
                      <div key={ret.id} className="flex justify-between items-center text-sm bg-white p-2 rounded hover:bg-gray-50">
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => navigate(`/inventory/returns/${ret.id}`)}
                          className="p-0 h-auto text-blue-600 hover:text-blue-800"
                        >
                          {ret.code}
                        </Button>
                        <div className="flex items-center gap-2">
                          <Tag color={ret.status === 'approved' ? 'success' : 'default'}>
                            {ret.status === 'approved' ? 'Đã duyệt' : ret.status === 'draft' ? 'Nháp' : 'Đã hủy'}
                          </Tag>
                          <span className="text-red-600 font-medium">
                            -{formatCurrency(ret.total_amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Payments Table */}
            <Table
              columns={columns}
              dataSource={payments}
              rowKey="id"
              loading={isLoading}
              pagination={false}
              scroll={{ x: 800 }}
              locale={{
                emptyText: 'Chưa có thanh toán nào',
              }}
            />
          </div>
      </Modal>

      {/* Add Payment Modal */}
      <AddPaymentModal
        receiptId={receiptId}
        maxAmount={debtAmount}
        open={showAddPayment}
        onClose={() => {
          setShowAddPayment(false)
          refetch()
        }}
      />
    </>
  )
}
