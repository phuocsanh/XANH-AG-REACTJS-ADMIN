import * as React from "react"
import { SalesReturn } from "@/models/sales-return"
import {
  useSalesReturnsQuery,
  useUpdateSalesReturnStatusMutation,
} from "@/queries/sales-return"
import { Button, Tag, Space, Modal, Card, Descriptions } from "antd"
import {
  PlusOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  SearchOutlined,
} from "@ant-design/icons"
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import DataTable from "@/components/common/data-table"
import FilterHeader from "@/components/common/filter-header"
import { ConfirmModal } from "@/components/common"
import { useNavigate } from "react-router-dom"
import { TablePaginationConfig, TableProps } from "antd"
import { FilterValue, SorterResult } from "antd/es/table/interface"
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
  const [filters, setFilters] = React.useState<Record<string, any>>({})
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

  // Date Filter UI Helper
  const getDateColumnSearchProps = (dataIndex: string): any => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <DatePicker.RangePicker 
            style={{ marginBottom: 8, display: 'flex' }}
            format="DD/MM/YYYY"
            value={
                selectedKeys && selectedKeys[0] 
                ? [dayjs(selectedKeys[0]), dayjs(selectedKeys[1])] 
                : undefined
            }
            onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                    setSelectedKeys([
                        dates[0].startOf('day').toISOString(), 
                        dates[1].endOf('day').toISOString()
                    ])
                } else {
                    setSelectedKeys([])
                }
            }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => confirm({ closeDropdown: false })}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Lọc
          </Button>
          <Button
            onClick={() => {
                if (clearFilters) {
                    clearFilters()
                    confirm()
                }
            }}
            size="small"
            style={{ width: 90 }}
          >
            Xóa
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
  })

  // Handle Table Change
  const handleTableChange: TableProps<ExtendedSalesReturn>['onChange'] = (
    pagination,
    tableFilters,
    sorter,
    extra
  ) => {
    setCurrentPage(pagination.current || 1)
    setPageSize(pagination.pageSize || 10)
    
    const newFilters = { ...filters }

    // Status filter
    if (tableFilters.status && tableFilters.status.length > 0) {
        newFilters.status = tableFilters.status[0]
    }

    // Created At Range
    if (tableFilters.created_at && tableFilters.created_at.length === 2) {
      newFilters.start_date = tableFilters.created_at[0]
      newFilters.end_date = tableFilters.created_at[1]
    } else {
        delete newFilters.start_date
        delete newFilters.end_date
    }

    setFilters(newFilters)
  }

  // Handle Filter Change
  const handleFilterChange = (key: string, value: any) => {
      const newFilters = { ...filters, [key]: value }
      if (!value) delete newFilters[key]
      setFilters(newFilters)
      setCurrentPage(1)
  }

  // Queries
  const { data: returnsData, isLoading } = useSalesReturnsQuery({
    page: currentPage,
    limit: pageSize,
    ...filters
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
      title: (
        <FilterHeader 
            title="Mã phiếu trả" 
            dataIndex="code" 
            value={filters.code} 
            onChange={(val) => handleFilterChange('code', val)}
            inputType="text"
        />
      ),
      width: 150,
      render: (record: ExtendedSalesReturn) => (
        <div className='font-medium'>{record.code}</div>
      ),
    },
    {
      key: "invoice_code",
      title: (
        <FilterHeader 
            title="Hóa đơn gốc" 
            dataIndex="invoice_code" 
            value={filters.invoice_code} 
            onChange={(val) => handleFilterChange('invoice_code', val)}
            inputType="text"
        />
      ),
      width: 150,
      render: (record: ExtendedSalesReturn) => (
        <div className='font-medium'>{record.invoice_code}</div>
      ),
    },
    {
      key: "customer_name",
      title: (
        <FilterHeader 
            title="Khách hàng" 
            dataIndex="customer_name" 
            value={filters.customer_name} 
            onChange={(val) => handleFilterChange('customer_name', val)}
            inputType="text"
        />
      ),
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
      width: 130,
      filters: [
          { text: "Chờ duyệt", value: "pending" },
          { text: "Đã duyệt", value: "approved" },
          { text: "Từ chối", value: "rejected" },
          { text: "Hoàn tất", value: "completed" },
      ],
      filteredValue: filters.status ? [filters.status] : null,
      filterMultiple: false,
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
      dataIndex: "created_at",
      width: 120,
      ...getDateColumnSearchProps('created_at'),
      filteredValue: (filters.start_date && filters.end_date) ? [filters.start_date, filters.end_date] : null,
      render: (value : string) => (
        <div>
          {new Date(value).toLocaleDateString("vi-VN")}
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
          }}
          onChange={handleTableChange}
          showSearch={false}
          showFilters={false}
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
