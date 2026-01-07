import React, { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Typography,
  DatePicker,
  Table,
  Tag,
  Tooltip,
  Popconfirm,
} from "antd"
import {
  EyeOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"

import { 
  InventoryReceipt, 
  InventoryReceiptStatus, 
  InventoryReceiptListParams,
  mapApiResponseToInventoryReceipt,
  normalizeReceiptStatus,
  getInventoryReceiptStatusText
} from "@/models/inventory.model"
import {
  useInventoryReceiptsQuery,
  useDeleteInventoryReceiptMutation,
  useInventoryStatsQuery,
} from "@/queries/inventory"
import { useSupplierSearch } from "@/queries/supplier"
import { LoadingSpinner } from "@/components/common"
import FilterHeader from '@/components/common/filter-header'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

const InventoryReceiptsList: React.FC = () => {
  const navigate = useNavigate()

  // State quản lý tìm kiếm và lọc
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  })

  // State tìm kiếm nhà cung cấp cho Filter ComboBox
  const [searchTermSupplier, setSearchTermSupplier] = useState("")
  const { data: suppliersData, isLoading: isLoadingSuppliers } = useSupplierSearch(searchTermSupplier, 20, true)

  const supplierOptions = useMemo(() => {
    if (!suppliersData?.pages) return []
    const uniqueSuppliers = new Map();
    suppliersData.pages.forEach(page => {
        page.data.forEach((s: any) => {
            if (s.id && !uniqueSuppliers.has(s.id)) {
                uniqueSuppliers.set(s.id, {
                    value: s.id, 
                    label: s.name
                })
            }
        })
    })
    return Array.from(uniqueSuppliers.values());
  }, [suppliersData])

  // Tạo params cho API call
  const queryParams = useMemo<InventoryReceiptListParams>(() => {
    const params: InventoryReceiptListParams = {
      limit: pagination.limit,
      offset: (pagination.page - 1) * pagination.limit,
    }

    if (filters.code) {
      params.code = filters.code
    }

    if (filters.status) {
      params.status = filters.status
    }

    // Filter theo ID nhà cung cấp
    if (filters.supplier_id) {
       params.supplier_id = filters.supplier_id 
    }

    if (filters.start_date && filters.end_date) {
      params.startDate = filters.start_date
      params.endDate = filters.end_date
    }

    return params
  }, [filters, pagination])

  // Queries
  const {
    data: receiptsData,
    isLoading: isLoadingReceipts,
    error: receiptsError,
    refetch: refetchReceipts,
  } = useInventoryReceiptsQuery(queryParams)

  // Map API response data to InventoryReceipt type
  const mappedReceipts = useMemo(() => {
    if (!receiptsData?.data?.items) return []
    return receiptsData.data.items.map(mapApiResponseToInventoryReceipt)
  }, [receiptsData])

  const { data: statsData, isLoading: isLoadingStats, refetch: refetchStats } =
    useInventoryStatsQuery()

  // Mutations
  const deleteReceiptMutation = useDeleteInventoryReceiptMutation()

  // Handlers
  const handleTableChange = (
    newPagination: any,
    tableFilters: any,
  ) => {
    setPagination((prev) => ({
      ...prev,
      page: newPagination.current || 1,
      limit: newPagination.pageSize || 10,
    }))

    const newFilters = { ...filters }

    // Status Filter
    if (tableFilters.status && tableFilters.status.length > 0) {
      newFilters.status = tableFilters.status[0]
    }

    setFilters(newFilters)
  }

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value }
    if (!value && value !== 0) delete newFilters[key]
    setFilters(newFilters)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleCreateReceipt = () => {
    navigate("/inventory/receipts/create")
  }

  // Date Filter UI Helper
  const getDateColumnSearchProps = (dataIndex: string): any => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <RangePicker 
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

  // Action handlers
  const handleViewReceipt = (receipt: InventoryReceipt) => {
    navigate(`/inventory/receipt/${receipt.id}`)
  }

  const handleDeleteReceipt = async (id: number) => {
    try {
      await deleteReceiptMutation.mutateAsync(id)
    } catch (error) {
      console.error("Error deleting receipt:", error)
    }
  }

  // Render trạng thái
  const renderStatus = (record: InventoryReceipt) => {
    const normalizedStatus = normalizeReceiptStatus(record.status_code || record.status);
    let color = "default"
    
    switch (normalizedStatus) {
      case InventoryReceiptStatus.DRAFT:
        color = "default"
        break
      case InventoryReceiptStatus.APPROVED:
        color = "success"
        break
      case InventoryReceiptStatus.CANCELLED:
        color = "error"
        break
      default:
        color = "default"
    }

    return (
      <Tag color={color}>
        {getInventoryReceiptStatusText(record.status_code || record.status)}
      </Tag>
    )
  }

  // Render hành động cho mỗi phiếu: Tối giản hóa theo đề xuất Unified Detail Page
  const renderActions = (record: InventoryReceipt) => {
    const actions = []
    
    // 1. Xem chi tiết - Luôn hiển thị và là hành động chính
    actions.push(
      <Tooltip key='view' title='Xem chi tiết'>
        <Button
          type='text'
          icon={<EyeOutlined />}
          onClick={() => handleViewReceipt(record)}
          className="text-blue-500 hover:text-blue-700"
        />
      </Tooltip>
    )

    // 2. Xóa phiếu - Chỉ hiển thị cho trạng thái "Nháp"
    const normalizedStatus = normalizeReceiptStatus(record.status_code || record.status)
    if (normalizedStatus === InventoryReceiptStatus.DRAFT) {
      actions.push(
        <Tooltip key='delete' title='Xóa phiếu nháp'>
          <Popconfirm
            title='Xóa phiếu nhập hàng'
            description='Bạn có chắc chắn muốn xóa phiếu nhập hàng nháp này?'
            onConfirm={() => handleDeleteReceipt(record.id)}
            okText='Xóa'
            cancelText='Hủy'
            okButtonProps={{ danger: true }}
          >
            <Button
              type='text'
              icon={<DeleteOutlined />}
              danger
              loading={deleteReceiptMutation.isPending}
            />
          </Popconfirm>
        </Tooltip>
      )
    }

    return <Space size='small'>{actions}</Space>
  }

  // Cấu hình cột cho bảng
  const columns: ColumnsType<InventoryReceipt> = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      align: 'center',
      render: (_: unknown, __: InventoryReceipt, index: number) => {
        const stt = (pagination.page - 1) * pagination.limit + index + 1;
        return <div className='font-medium text-gray-600'>{stt}</div>;
      },
    },
    {
      title: (
        <FilterHeader 
            title="Mã phiếu" 
            dataIndex="code" 
            value={filters.code} 
            onChange={(val) => handleFilterChange('code', val)}
            inputType="text"
        />
      ),
      dataIndex: "code",
      key: "code",
      width: 180,
      render: (code: string, record: InventoryReceipt) => (
        <Button
          type='link'
          onClick={() => handleViewReceipt(record)}
          style={{ padding: 0, height: "auto" }}
        >
          {code}
        </Button>
      ),
    },
    {
      title: (
        <FilterHeader 
            title="Nhà cung cấp" 
            dataIndex="supplier_id" 
            value={filters.supplier_id} 
            onChange={(val) => handleFilterChange('supplier_id', val)}
            inputType="combobox"
            comboBoxProps={{
                placeholder: "Tìm nhà cung cấp...",
                data: supplierOptions,
                onSearch: setSearchTermSupplier,
                loading: isLoadingSuppliers,
                allowClear: true,
                filterOption: false,
            }}
        />
      ),
      dataIndex: "supplier_id",
      key: "supplier_id",
      width: 200,
      render: (_: number, record: InventoryReceipt) => {
        return record.supplier?.name || record.supplier_name || (record.supplier_id ? `Nhà cung cấp #${record.supplier_id}` : "-")
      },
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_amount",
      key: "total_amount",
      width: 150,
      align: "right",
      render: (amount: number) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(amount),
    },
    {
      title: "Tiền trả hàng",
      dataIndex: "returned_amount",
      key: "returned_amount",
      width: 150,
      align: "right",
      render: (amount: number) => (
        <Text style={{ color: amount > 0 ? '#ff4d4f' : '#8c8c8c' }}>
          {amount > 0 ? '-' : ''}
          {new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
          }).format(amount || 0)}
        </Text>
      ),
    },
    {
      title: "Đã thanh toán",
      dataIndex: "paid_amount",
      key: "paid_amount",
      width: 150,
      align: "right",
      render: (amount: number) => (
        <Text style={{ color: '#1890ff' }}>
          {new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
          }).format(amount || 0)}
        </Text>
      ),
    },
    {
      title: "Còn nợ",
      dataIndex: "debt_amount",
      key: "debt_amount",
      width: 150,
      align: "right",
      render: (amount: number) => (
        <Text style={{ color: amount > 0 ? '#ff4d4f' : '#52c41a' }}>
          {new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
          }).format(amount || 0)}
        </Text>
      ),
    },
    {
      title: "TT Thanh toán",
      dataIndex: "payment_status",
      key: "payment_status",
      width: 150,
      render: (status: string) => {
        if (status === 'paid') return <Tag color="success">Đã thanh toán</Tag>
        if (status === 'partial') return <Tag color="warning">Một phần</Tag>
        if (status === 'unpaid' || !status) return <Tag color="error">Chưa TT</Tag>
        return <Tag>-</Tag>
      },
    },
    {
      title: (
        <FilterHeader 
            title="Trạng thái" 
            value={filters.status} 
            onChange={(val) => handleFilterChange('status', val)}
            inputType="select"
            options={[
              { label: "Nháp", value: InventoryReceiptStatus.DRAFT },
              { label: "Đã duyệt", value: InventoryReceiptStatus.APPROVED },
              { label: "Đã hủy", value: InventoryReceiptStatus.CANCELLED },
            ]}
        />
      ),
      dataIndex: "status",
      key: "status",
      width: 150,
      align: "center",
      render: (_: string, record: InventoryReceipt) => renderStatus(record),
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      width: 150,
      ...getDateColumnSearchProps('created_at'),
      filteredValue: (filters.start_date && filters.end_date) ? [filters.start_date, filters.end_date] : null,
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Mô tả",
      dataIndex: "notes",
      key: "notes",
      ellipsis: true,
      render: (notes: string) => notes || "-",
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 100,
      align: "center",
      render: (_, record: InventoryReceipt) => renderActions(record),
    },
  ]

  // Lấy danh sách phiếu từ API response
  const total = receiptsData?.data?.total || 0

  if (receiptsError) {
    return (
      <Card>
        <Text type='danger'>
          Lỗi khi tải danh sách phiếu nhập hàng: {receiptsError.message}
        </Text>
      </Card>
    )
  }

  return (
    <div className="p-2 md:p-6">
      {/* Header với thống kê */}
      <Row gutter={[8, 16]} style={{ marginBottom: "24px" }}>
        <Col span={24}>
          <Title level={4} className="md:text-2xl">Quản lý nhập hàng</Title>
        </Col>

        {/* Thống kê tổng quan */}
        {statsData && (
          <Col span={24}>
                {/* Thống kê 8 tấm (Tối ưu sắp xếp và hiển thị) */}
                <Row gutter={[4, 4]}>
                  {/* Nhóm 1: Trạng thái phiếu (2 cột trên mobile) */}
                  <Col xs={12} sm={12} md={3}>
                    <Card size="small" bodyStyle={{ padding: '4px 2px', textAlign: 'center' }}>
                      <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1890ff' }}>{statsData.totalReceipts ?? 0}</div>
                      <Text className="text-[10px] block" type="secondary">Tổng phiếu</Text>
                    </Card>
                  </Col>
                  <Col xs={12} sm={12} md={3}>
                    <Card size="small" bodyStyle={{ padding: '4px 2px', textAlign: 'center' }}>
                      <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#fa8c16' }}>{statsData.draftReceipts ?? 0}</div>
                      <Text className="text-[10px] block" type="secondary">Bản nháp</Text>
                    </Card>
                  </Col>
                  <Col xs={12} sm={12} md={3}>
                    <Card size="small" bodyStyle={{ padding: '4px 2px', textAlign: 'center' }}>
                      <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#52c41a' }}>{statsData.approvedReceipts ?? 0}</div>
                      <Text className="text-[10px] block" type="secondary">Đã duyệt</Text>
                    </Card>
                  </Col>
                  <Col xs={12} sm={12} md={3}>
                    <Card size="small" bodyStyle={{ padding: '4px 2px', textAlign: 'center' }}>
                      <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#ff4d4f' }}>{statsData.cancelledReceipts ?? 0}</div>
                      <Text className="text-[10px] block" type="secondary">Đã hủy</Text>
                    </Card>
                  </Col>

                  {/* Nhóm 2: Tài chính & Công nợ (Full width trên mobile vì số tiền dài) */}
                  <Col xs={24} sm={12} md={3}>
                    <Card size="small" bodyStyle={{ padding: '4px 2px', textAlign: 'center' }}>
                      <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#13c2c2' }}>
                        {new Intl.NumberFormat("vi-VN").format(parseFloat(String(statsData.totalValue ?? "0")))} đ
                      </div>
                      <Text className="text-[10px] block" type="secondary">Tổng giá trị</Text>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={3}>
                    <Card size="small" bodyStyle={{ padding: '4px 2px', textAlign: 'center' }}>
                      <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#52c41a' }}>
                        {new Intl.NumberFormat("vi-VN").format(parseFloat(String(statsData.totalPaid ?? "0")))} đ
                      </div>
                      <Text className="text-[10px] block" type="secondary">Đã thanh toán</Text>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={3}>
                    <Card size="small" bodyStyle={{ padding: '4px 2px', textAlign: 'center' }}>
                      <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#ff4d4f' }}>
                        {new Intl.NumberFormat("vi-VN").format(parseFloat(String(statsData.totalDebt ?? "0")))} đ
                      </div>
                      <Text className="text-[10px] block" type="secondary">Còn nợ</Text>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={3}>
                    <Card size="small" bodyStyle={{ padding: '4px 2px', textAlign: 'center' }}>
                      <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#722ed1' }}>{statsData.debtReceiptsCount ?? 0}</div>
                      <Text className="text-[10px] block" type="secondary">Phiếu còn nợ</Text>
                    </Card>
                  </Col>
                </Row>
          </Col>
        )}
      </Row>

      {/* Bảng dữ liệu */}
      <Card>
        <div
          style={{
            marginBottom: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            <span className="hidden md:inline">Danh sách phiếu nhập hàng</span>
            <span className="md:hidden">Phiếu nhập hàng</span>
          </Title>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                refetchReceipts()
                refetchStats()
              }}
              loading={isLoadingReceipts}
            >
              <span className="hidden sm:inline">Làm mới</span>
            </Button>
            <Button
              type='primary'
              icon={<PlusOutlined />}
              onClick={handleCreateReceipt}
            >
              <span className="hidden sm:inline">Tạo phiếu nhập</span>
              <span className="sm:hidden">Tạo</span>
            </Button>
          </Space>
        </div>

        {isLoadingReceipts || isLoadingStats ? (
          <LoadingSpinner />
        ) : (
          <Table
            columns={columns}
            dataSource={mappedReceipts}
            rowKey='id'
            pagination={{
              current: pagination.page,
              pageSize: pagination.limit,
              total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} phiếu nhập`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 1200 }}
          />
        )}
      </Card>
    </div>
  )
}

export default InventoryReceiptsList
