import * as React from "react"
import { SalesReturn } from "@/models/sales-return"
import {
  useSalesReturnsQuery,
  useUpdateSalesReturnStatusMutation,
} from "@/queries/sales-return"
import { Button, Tag, Space, Select, Modal, Card, Descriptions } from "antd"
import {
  PlusOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons"
import DataTable from "@/components/common/data-table"
import { ConfirmModal } from "@/components/common"
import { useNavigate } from "react-router-dom"
import {
  returnStatusLabels,
  returnStatusColors,
  refundMethodLabels,
} from "./form-config"

// Extend SalesReturn interface
interface ExtendedSalesReturn extends SalesReturn {
  key: string
  [key: string]: any
}

const SalesReturnsList: React.FC = () => {
  // State quản lý UI
  const [statusFilter, setStatusFilter] = React.useState<string>("")
  const [isDetailModalVisible, setIsDetailModalVisible] =
    React.useState<boolean>(false)
  const [approveConfirmVisible, setApproveConfirmVisible] =
    React.useState<boolean>(false)
  const [rejectConfirmVisible, setRejectConfirmVisible] =
    React.useState<boolean>(false)
  const [viewingReturn, setViewingReturn] =
    React.useState<SalesReturn | null>(null)
  const [actioningReturn, setActioningReturn] =
    React.useState<SalesReturn | null>(null)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  const navigate = useNavigate()

  // Queries
  const { data: returnsData, isLoading } = useSalesReturnsQuery({
    page: currentPage,
    limit: pageSize,
    status: statusFilter || undefined,
  })

  const updateStatusMutation = useUpdateSalesReturnStatusMutation()

  // Handlers
  const handleViewReturn = (salesReturn: SalesReturn) => {
    setViewingReturn(salesReturn)
    setIsDetailModalVisible(true)
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalVisible(false)
    setViewingReturn(null)
  }

  const handleApproveClick = (salesReturn: SalesReturn) => {
    setActioningReturn(salesReturn)
    setApproveConfirmVisible(true)
  }

  const handleRejectClick = (salesReturn: SalesReturn) => {
    setActioningReturn(salesReturn)
    setRejectConfirmVisible(true)
  }

  const handleConfirmApprove = async () => {
    if (!actioningReturn) return
    try {
      await updateStatusMutation.mutateAsync({
        id: actioningReturn.id,
        data: { status: "approved" },
      })
      setApproveConfirmVisible(false)
      setActioningReturn(null)
    } catch (error) {
      console.error("Error approving return:", error)
    }
  }

  const handleConfirmReject = async () => {
    if (!actioningReturn) return
    try {
      await updateStatusMutation.mutateAsync({
        id: actioningReturn.id,
        data: { status: "rejected" },
      })
      setRejectConfirmVisible(false)
      setActioningReturn(null)
    } catch (error) {
      console.error("Error rejecting return:", error)
    }
  }

  const handleCancelApprove = () => {
    setApproveConfirmVisible(false)
    setActioningReturn(null)
  }

  const handleCancelReject = () => {
    setRejectConfirmVisible(false)
    setActioningReturn(null)
  }

  // Helpers
  const getReturnList = (): ExtendedSalesReturn[] => {
    if (!returnsData?.data?.items) return []
    return returnsData.data.items.map((salesReturn: SalesReturn) => ({
      ...salesReturn,
      key: salesReturn.id.toString(),
    }))
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value)
  }

  const loading = isLoading || updateStatusMutation.isPending

  // Columns
  const columns = [
    {
      key: "code",
      title: "Mã phiếu trả",
      width: 120,
      render: (record: ExtendedSalesReturn) => (
        <div className='font-medium'>{record.code}</div>
      ),
    },
    {
      key: "invoice_code",
      title: "Hóa đơn gốc",
      width: 120,
      render: (record: ExtendedSalesReturn) => (
        <div className='font-medium'>{record.invoice_code}</div>
      ),
    },
    {
      key: "customer_name",
      title: "Khách hàng",
      width: 180,
      render: (record: ExtendedSalesReturn) => (
        <div className='font-medium'>{record.customer_name}</div>
      ),
    },
    {
      key: "total_refund_amount",
      title: "Số tiền hoàn",
      width: 130,
      render: (record: ExtendedSalesReturn) => (
        <div className='text-red-600 font-bold'>
          {formatCurrency(record.total_refund_amount)}
        </div>
      ),
    },
    {
      key: "refund_method",
      title: "Phương thức",
      width: 130,
      render: (record: ExtendedSalesReturn) => (
        <Tag color='blue'>
          {refundMethodLabels[
            record.refund_method as keyof typeof refundMethodLabels
          ] || record.refund_method}
        </Tag>
      ),
    },
    {
      key: "status",
      title: "Trạng thái",
      width: 120,
      render: (record: ExtendedSalesReturn) => {
        const status = record.status as keyof typeof returnStatusLabels
        return (
          <Tag color={returnStatusColors[status] || "default"}>
            {returnStatusLabels[status] || record.status}
          </Tag>
        )
      },
    },
    {
      key: "created_at",
      title: "Ngày tạo",
      width: 120,
      render: (record: ExtendedSalesReturn) => (
        <div>
          {new Date(record.created_at).toLocaleDateString("vi-VN")}
        </div>
      ),
    },
    {
      key: "action",
      title: "Hành động",
      width: 250,
      render: (record: ExtendedSalesReturn) => (
        <Space size='small'>
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewReturn(record)}
            size='small'
          >
            Xem
          </Button>
          {record.status === "pending" && (
            <>
              <Button
                type='primary'
                icon={<CheckOutlined />}
                onClick={() => handleApproveClick(record)}
                size='small'
              >
                Duyệt
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={() => handleRejectClick(record)}
                size='small'
              >
                Từ chối
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className='p-6'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold'>Quản lý Trả hàng</h1>
        <Button
          type='primary'
          icon={<PlusOutlined />}
          onClick={() => navigate("/sales-returns/create")}
        >
          Tạo phiếu trả hàng
        </Button>
      </div>

      {/* Filter */}
      <div className='mb-6'>
        <Select
          placeholder='Lọc theo trạng thái'
          value={statusFilter || undefined}
          onChange={(value) => setStatusFilter(value || "")}
          allowClear
          className='w-64'
        >
          <Select.Option value=''>Tất cả</Select.Option>
          <Select.Option value='pending'>Chờ duyệt</Select.Option>
          <Select.Option value='approved'>Đã duyệt</Select.Option>
          <Select.Option value='rejected'>Từ chối</Select.Option>
          <Select.Option value='completed'>Hoàn tất</Select.Option>
        </Select>
      </div>

      {/* Danh sách phiếu trả */}
      <div className='bg-white rounded shadow'>
        <DataTable
          data={getReturnList()}
          columns={columns}
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: returnsData?.data?.total || 0,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total: number) => `Tổng ${total} phiếu trả`,
            onChange: (page: number, size: number) => {
              setCurrentPage(page)
              setPageSize(size)
            },
          }}
        />
      </div>

      {/* Detail Modal */}
      <Modal
        title={`Chi tiết phiếu trả: ${viewingReturn?.code || ""}`}
        open={isDetailModalVisible}
        onCancel={handleCloseDetailModal}
        footer={[
          <Button key='close' onClick={handleCloseDetailModal}>
            Đóng
          </Button>,
        ]}
        width={800}
      >
        {viewingReturn && (
          <div className='mt-4'>
            <div className='grid grid-cols-2 gap-4 mb-4'>
              <Card>
                <div className='text-gray-500 text-sm'>Hóa đơn gốc</div>
                <div className='text-lg font-medium'>
                  {viewingReturn.invoice_code}
                </div>
                <div className='text-gray-500 text-sm mt-2'>Khách hàng</div>
                <div className='font-medium'>{viewingReturn.customer_name}</div>
                <div className='text-gray-600'>
                  {viewingReturn.customer_phone}
                </div>
              </Card>

              <Card>
                <div className='text-gray-500 text-sm'>Thông tin hoàn tiền</div>
                <div className='text-2xl font-bold text-red-600'>
                  {formatCurrency(viewingReturn.total_refund_amount)}
                </div>
                <div className='mt-2'>
                  <span className='text-gray-600'>Phương thức: </span>
                  <Tag color='blue'>
                    {
                      refundMethodLabels[
                        viewingReturn.refund_method as keyof typeof refundMethodLabels
                      ]
                    }
                  </Tag>
                </div>
                <div className='mt-1'>
                  <span className='text-gray-600'>Trạng thái: </span>
                  <Tag
                    color={
                      returnStatusColors[
                        viewingReturn.status as keyof typeof returnStatusColors
                      ]
                    }
                  >
                    {
                      returnStatusLabels[
                        viewingReturn.status as keyof typeof returnStatusLabels
                      ]
                    }
                  </Tag>
                </div>
              </Card>
            </div>

            {viewingReturn.reason && (
              <div className='mb-4'>
                <div className='text-gray-500 text-sm mb-1'>Lý do trả hàng</div>
                <div>{viewingReturn.reason}</div>
              </div>
            )}

            {viewingReturn.notes && (
              <div className='mb-4'>
                <div className='text-gray-500 text-sm mb-1'>Ghi chú</div>
                <div>{viewingReturn.notes}</div>
              </div>
            )}

            <div className='mt-4'>
              <div className='font-medium text-lg mb-3'>
                Danh sách sản phẩm trả
              </div>
              {viewingReturn.items && viewingReturn.items.length > 0 ? (
                <Space direction='vertical' className='w-full' size='small'>
                  {viewingReturn.items.map((item, index) => (
                    <Card key={index} size='small'>
                      <div className='grid grid-cols-4 gap-4'>
                        <div className='col-span-2'>
                          <div className='font-medium'>{item.product_name}</div>
                          {item.reason && (
                            <div className='text-sm text-gray-500'>
                              Lý do: {item.reason}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className='text-sm text-gray-500'>Số lượng</div>
                          <div>{item.quantity}</div>
                        </div>
                        <div>
                          <div className='text-sm text-gray-500'>
                            Tiền hoàn
                          </div>
                          <div className='font-medium text-red-600'>
                            {formatCurrency(item.refund_amount)}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </Space>
              ) : (
                <div className='text-center text-gray-500 py-4'>
                  Không có sản phẩm
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Approve Confirm Modal */}
      <ConfirmModal
        title='Xác nhận duyệt'
        content={
          actioningReturn
            ? `Bạn có chắc chắn muốn duyệt phiếu trả "${actioningReturn.code}"?`
            : "Xác nhận duyệt"
        }
        open={approveConfirmVisible}
        onOk={handleConfirmApprove}
        onCancel={handleCancelApprove}
        okText='Duyệt'
        okType='primary'
        cancelText='Hủy'
        confirmLoading={updateStatusMutation.isPending}
      />

      {/* Reject Confirm Modal */}
      <ConfirmModal
        title='Xác nhận từ chối'
        content={
          actioningReturn
            ? `Bạn có chắc chắn muốn từ chối phiếu trả "${actioningReturn.code}"?`
            : "Xác nhận từ chối"
        }
        open={rejectConfirmVisible}
        onOk={handleConfirmReject}
        onCancel={handleCancelReject}
        okText='Từ chối'
        okType='primary'
        cancelText='Hủy'
        confirmLoading={updateStatusMutation.isPending}
      />
    </div>
  )
}

export default SalesReturnsList
