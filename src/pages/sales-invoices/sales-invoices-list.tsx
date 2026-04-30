import * as React from "react"
import { SalesInvoice } from "@/models/sales-invoice"
import {
  useSalesInvoicesQuery,
  useAddPaymentMutation,
  useDeleteSalesInvoiceMutation,
  useCancelSalesInvoiceMutation,
  useRefundSalesInvoiceMutation,
  useUpdateSalesInvoiceMutation,
} from "@/queries/sales-invoice"
import api from "@/utils/api"
import { toast } from "react-toastify"
import { useSeasonsQuery } from "@/queries/season"

import {
  Button,
  Tag,
  Space,
  Modal,
  Card,
  InputNumber,
  Alert,
  Table,
  Typography,
  App,
  Popover,
  Checkbox,
} from "antd"
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DollarOutlined,
  SearchOutlined,
  FileTextOutlined,
  DeleteOutlined,
  CloseCircleOutlined,
  UndoOutlined,
  SettingOutlined,
} from "@ant-design/icons"
import { DatePicker, RangePicker } from '@/components/common'
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);
import DataTable from "@/components/common/data-table"
import FilterHeader from "@/components/common/filter-header"
import ComboBox from "@/components/common/combo-box"
import { useNavigate, useSearchParams } from "react-router-dom"
import { paymentMethodLabels, paymentStatusLabels, invoiceStatusLabels } from "./form-config"
import { TablePaginationConfig, TableProps } from "antd"
import { FilterValue, SorterResult } from "antd/es/table/interface"

// Extend SalesInvoice interface
interface ExtendedSalesInvoice extends SalesInvoice {
  key: string
  [key: string]: any
}

const COLUMN_VISIBILITY_STORAGE_KEY = "sales-invoices-visible-columns"

const salesInvoiceColumnOptions = [
  { label: "Mã HĐ", value: "code" },
  { label: "Khách hàng", value: "customer_name" },
  { label: "SĐT", value: "customer_phone" },
  { label: "Mùa vụ", value: "season_id" },
  { label: "Ngày bán", value: "sale_date" },
  { label: "Ruộng lúa", value: "rice_crop_id" },
  { label: "Tổng tiền", value: "final_amount" },
  { label: "Đã trả", value: "partial_payment_amount" },
  { label: "Còn nợ", value: "remaining_amount" },
  { label: "Trạng thái", value: "status" },
  { label: "Thanh toán", value: "payment_status" },
  { label: "Ghi chú", value: "notes" },
  { label: "Thao tác", value: "action" },
]

const defaultVisibleSalesInvoiceColumns = salesInvoiceColumnOptions.map((column) => column.value)

const SalesInvoicesList: React.FC = () => {
  const { modal } = App.useApp()
  // State quản lý UI
  const [filters, setFilters] = React.useState<Record<string, any>>({})
  const [isDetailModalVisible, setIsDetailModalVisible] =
    React.useState<boolean>(false)
  const [isPaymentModalVisible, setIsPaymentModalVisible] =
    React.useState<boolean>(false)
  const [viewingInvoice, setViewingInvoice] =
    React.useState<SalesInvoice | null>(null)
  const [paymentAmount, setPaymentAmount] = React.useState(0)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [visibleColumnKeys, setVisibleColumnKeys] = React.useState<string[]>(() => {
    try {
      const savedValue = localStorage.getItem(COLUMN_VISIBILITY_STORAGE_KEY)
      if (!savedValue) return defaultVisibleSalesInvoiceColumns

      const parsedValue = JSON.parse(savedValue)
      if (!Array.isArray(parsedValue)) return defaultVisibleSalesInvoiceColumns

      const validKeys = parsedValue.filter((key) =>
        defaultVisibleSalesInvoiceColumns.includes(key)
      )

      return validKeys.length > 0 ? validKeys : defaultVisibleSalesInvoiceColumns
    } catch {
      return defaultVisibleSalesInvoiceColumns
    }
  })
  
  // State cho season search
  const [seasonSearchText, setSeasonSearchText] = React.useState('')
  
  // State cho báo cáo tổng hợp lịch sử khách hàng
  const [isHistoryModalVisible, setIsHistoryModalVisible] = React.useState(false);
  const [historyData, setHistoryData] = React.useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [currentCustomer, setCurrentCustomer] = React.useState<{id: number, name: string} | null>(null);

  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // ✅ 1. Khôi phục bộ lọc từ URL khi vào trang
  React.useEffect(() => {
    const params: Record<string, any> = {}
    searchParams.forEach((value, key) => {
      // Chuyển đổi một số kiểu dữ liệu đặc biệt nếu cần
      if (key === 'page') setCurrentPage(Number(value))
      else if (key === 'pageSize') setPageSize(Number(value))
      else if (key === 'season_id') params[key] = Number(value)
      else if (key === 'rice_crop_id' && !isNaN(Number(value))) params[key] = Number(value)
      else params[key] = value
    })
    
    if (Object.keys(params).length > 0) {
      setFilters(params)
      // Nếu đã có lọc mùa vụ từ URL thì không set mặc định nữa
      if (params.season_id) setHasSetDefaultSeason(true)
    }
  }, []) // Chỉ chạy 1 lần khi mount

  // ✅ 2. Cập nhật URL mỗi khi bộ lọc thay đổi
  React.useEffect(() => {
    const params: Record<string, string> = {}
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = String(value)
      }
    })
    // Lưu cả phân trang
    if (currentPage > 1) params.page = String(currentPage)
    if (pageSize !== 10) params.pageSize = String(pageSize)

    setSearchParams(params, { replace: true })
  }, [filters, currentPage, pageSize, setSearchParams])

  React.useEffect(() => {
    localStorage.setItem(
      COLUMN_VISIBILITY_STORAGE_KEY,
      JSON.stringify(visibleColumnKeys)
    )
  }, [visibleColumnKeys])

  // Date Filter UI Helper
  const getDateColumnSearchProps = (dataIndex: string): any => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <RangePicker 
            style={{ marginBottom: 8, display: 'flex' }}
            format="DD/MM/YYYY"
            linkedPanels={false}
            value={
                selectedKeys && selectedKeys[0] 
                ? [dayjs(selectedKeys[0]), dayjs(selectedKeys[1])] 
                : undefined
            }
            onChange={(dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
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
  const handleTableChange: TableProps<ExtendedSalesInvoice>['onChange'] = (
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
    } else {
        delete newFilters.status
    }

    // Payment status filter
    if (tableFilters.payment_status && tableFilters.payment_status.length > 0) {
        newFilters.payment_status = tableFilters.payment_status[0]
    } else {
        delete newFilters.payment_status
    }

    // Rice Crop filter
    if (tableFilters.rice_crop_id && tableFilters.rice_crop_id.length > 0) {
        newFilters.rice_crop_id = tableFilters.rice_crop_id[0]
    } else {
        delete newFilters.rice_crop_id
    }

    // Sale Date Range
    if (tableFilters.sale_date && tableFilters.sale_date.length === 2) {
      newFilters.start_date = tableFilters.sale_date[0]
      newFilters.end_date = tableFilters.sale_date[1]
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
  const { data: invoicesData, isLoading } = useSalesInvoicesQuery({
    page: currentPage,
    limit: pageSize,
    ...filters
  })
  const addPaymentMutation = useAddPaymentMutation()
  const deleteInvoiceMutation = useDeleteSalesInvoiceMutation()
  const cancelInvoiceMutation = useCancelSalesInvoiceMutation()
  const refundInvoiceMutation = useRefundSalesInvoiceMutation()
  const updateInvoiceMutation = useUpdateSalesInvoiceMutation()
   
  // Load mùa vụ với search
  const { data: seasonsData } = useSeasonsQuery({ 
    page: 1, 
    limit: 20,
    ...(seasonSearchText && { name: seasonSearchText })
  })

  // State to track if we have set the default season
  const [hasSetDefaultSeason, setHasSetDefaultSeason] = React.useState(false)

  // Effect to set default season
  React.useEffect(() => {
    const items = seasonsData?.data?.items;
    if (items && items.length > 0 && !hasSetDefaultSeason) {
      const seasons = items
      const today = dayjs()
      
      // 1. Tìm mùa vụ đang diễn ra (today between start and end)
      let targetSeason = seasons.find((s: any) => {
        if (!s.start_date || !s.end_date) return false
        const start = dayjs(s.start_date)
        const end = dayjs(s.end_date)
        return (today.isAfter(start) || today.isSame(start)) && (today.isBefore(end) || today.isSame(end))
      })

      // 2. Nếu không có, lấy mùa vụ mới nhất (dựa trên end_date sort desc)
      if (!targetSeason) {
        // Copy để không mutate mảng gốc
        const sortedSeasons = [...seasons].sort((a: any, b: any) => {
           const dateA = a.end_date ? new Date(a.end_date).getTime() : 0
           const dateB = b.end_date ? new Date(b.end_date).getTime() : 0
           return dateB - dateA
        })
        targetSeason = sortedSeasons[0]
      }

      if (targetSeason) {
        setFilters((prev) => ({ ...prev, season_id: targetSeason.id }))
      }
      
      setHasSetDefaultSeason(true)
    }
  }, [seasonsData, hasSetDefaultSeason])


  // Handlers
  const handleViewInvoice = async (invoice: SalesInvoice) => {
    try {
      if (!invoice?.id) {
        toast.error("Không tìm thấy ID hóa đơn");
        return;
      }

      // Sử dụng api utility để lấy chi tiết đầy đủ (bao gồm items)
      console.log(`[DEBUG] Fetching detail for Invoice ID: ${invoice.id}, Code: ${invoice.code}`);
      
      const response = await api.get<any>(`/sales/invoice/${invoice.id}`);
      
      console.log('[DEBUG] API Response:', response);

      if (response) {
        // Kiểm tra mảng items ở mọi nơi có thể (items, invoice_items, sales_invoice_items)
        const items = response.items || response.invoice_items || response.sales_invoice_items || [];
        
        // Nếu API trả về mảng rỗng trong khi DB có, ta cần log kỹ hơn
        if (items.length === 0) {
          console.warn('[DEBUG] API returned empty items array for invoice:', invoice.id);
        }

        setViewingInvoice({ ...response, items });
        setIsDetailModalVisible(true);
      } else {
        throw new Error("API không trả về dữ liệu");
      }
    } catch (error: any) {
      console.error('[DEBUG] Fetch detail error:', error);
      
      // Thông báo lỗi rõ ràng nếu API fail (401, 500, v.v.)
      const errorMsg = error?.response?.data?.message || error?.message || "Không thể lấy thông tin chi tiết từ máy chủ";
      toast.error(`Lỗi: ${errorMsg}`);
      
      // Vẫn hiện modal với dữ liệu từ list nhưng kèm cảnh báo
      setViewingInvoice({ ...invoice, items: [] });
      setIsDetailModalVisible(true);
    }
  }

  const handleUpdateInvoiceField = async (fields: any, msg = 'Cập nhật thành công') => {
    if (!viewingInvoice) return;
    
    try {
      await updateInvoiceMutation.mutateAsync({
        id: viewingInvoice.id,
        invoice: fields,
        silent: true
      }, {
        onSuccess: (updatedInvoice: any) => {
          setViewingInvoice(updatedInvoice.data || updatedInvoice);
          toast.success(msg);
        }
      });
    } catch (error) {
      console.error('Error updating invoice:', error);
    }
  };

  const handleUpdateSaleDate = (date: dayjs.Dayjs | null) => {
    if (date) {
      handleUpdateInvoiceField({ sale_date: date.toISOString() }, 'Cập nhật ngày bán thành công');
    }
  };

  const handleOpenHistory = async (invoice: ExtendedSalesInvoice) => {
    if (!invoice.customer_id) {
      toast.warning("Hóa đơn này không có thông tin khách hàng");
      return;
    }
    
    setCurrentCustomer({
      id: invoice.customer_id,
      name: invoice.customer_name || 'Khách hàng'
    });
    setIsHistoryModalVisible(true);
    setHistoryLoading(true);
    
    try {
      // Gọi API lấy lịch sử, truyền thêm season_id từ bộ lọc hiện tại
      const seasonId = filters?.season_id;
      const response = await api.get<any[]>(`/sales/customer/${invoice.customer_id}/purchase-history`, {
        params: { seasonId }
      });
      setHistoryData(response || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Không thể tải lịch sử mua hàng');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalVisible(false)
    setViewingInvoice(null)
  }

  const handleOpenPaymentModal = (invoice: SalesInvoice) => {
    setViewingInvoice(invoice)
    setPaymentAmount(invoice.remaining_amount)
    setIsPaymentModalVisible(true)
  }

  const handleClosePaymentModal = () => {
    setIsPaymentModalVisible(false)
    setViewingInvoice(null)
    setPaymentAmount(0)
  }

  const handleSubmitPayment = async () => {
    if (!viewingInvoice || paymentAmount <= 0) return

    try {
      await addPaymentMutation.mutateAsync(
        { id: viewingInvoice.id, data: { amount: paymentAmount } },
        {
          onSuccess: () => {
            handleClosePaymentModal()
          },
        }
      )
    } catch (error) {
      console.error("Payment failed:", error)
    }
  }

  const handleDeleteInvoice = (invoice: SalesInvoice) => {
    if (invoice.status !== 'draft') {
      modal.warning({
        title: 'Không thể xóa',
        content: `Hóa đơn đã ${invoice.status === 'paid' ? 'thanh toán' : 'xác nhận'} không thể xóa cứng. Vui lòng sử dụng chức năng Hủy hoặc Hoàn tiền để đảm bảo tồn kho.`,
      })
      return
    }

    modal.confirm({
      title: 'Xác nhận xóa hóa đơn',
      content: `Bạn có chắc chắn muốn xóa hóa đơn nháp ${invoice.code}?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await deleteInvoiceMutation.mutateAsync(invoice.id)
          handleCloseDetailModal()
        } catch (error) {
          console.error("Delete invoice failed:", error)
        }
      },
    })
  }

  const handleCancelInvoice = (invoice: SalesInvoice) => {
    modal.confirm({
      title: 'Xác nhận hủy hóa đơn',
      content: `Bạn có chắc chắn muốn hủy hóa đơn ${invoice.code}? Hệ thống sẽ tự động hoàn lại sản phẩm vào kho và xóa nợ tương ứng.`,
      okText: 'Hủy hóa đơn',
      okType: 'danger',
      cancelText: 'Quay lại',
      onOk: async () => {
        try {
          await cancelInvoiceMutation.mutateAsync(invoice.id)
          handleCloseDetailModal()
        } catch (error) {
          console.error("Cancel invoice failed:", error)
        }
      },
    })
  }

  const handleRefundInvoice = (invoice: SalesInvoice) => {
    modal.confirm({
      title: 'Xác nhận hoàn tiền',
      content: `Yêu cầu hoàn trả hóa đơn ${invoice.code}? Hệ thống sẽ hoàn lại số lượng sản phẩm vào kho.`,
      okText: 'Hoàn tiền',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await refundInvoiceMutation.mutateAsync(invoice.id)
          handleCloseDetailModal()
        } catch (error) {
          console.error("Refund invoice failed:", error)
        }
      },
    })
  }

  // Helpers
  const getInvoiceList = (): ExtendedSalesInvoice[] => {
    if (!invoicesData?.data?.items) return []
    return invoicesData.data.items.map((invoice: SalesInvoice) => ({
      ...invoice,
      key: invoice.id.toString(),
    }))
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value)
  }

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      draft: "default",
      confirmed: "blue",
      paid: "green",
      cancelled: "red",
      refunded: "orange",
    }
    return colorMap[status] || "default"
  }

  const getPaymentStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: "error",
      partial: "warning",
      paid: "success",
      refunded: "orange",
      cancelled: "default",
    }
    return colorMap[status] || "default"
  }

  const loading = isLoading || addPaymentMutation.isPending

  // Columns
  const columns = [
    {
      key: "code",
      title: (
        <FilterHeader 
            title="Mã HĐ" 
            dataIndex="code" 
            value={filters.code} 
            onChange={(val) => handleFilterChange('code', val)}
            inputType="text"
        />
      ),
      width: 150,
      render: (record: ExtendedSalesInvoice) => (
        <div className='font-medium'>{record.code}</div>
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
      render: (record: ExtendedSalesInvoice) => (
        <div className='font-medium'>{record.customer_name}</div>
      ),
    },
    {
      key: "customer_phone",
      title: (
        <FilterHeader 
            title="SĐT" 
            dataIndex="customer_phone" 
            value={filters.customer_phone} 
            onChange={(val) => handleFilterChange('customer_phone', val)}
            inputType="text"
        />
      ),
      width: 130,
      render: (record: ExtendedSalesInvoice) => (
        <div>{record.customer_phone}</div>
      ),
    },
    {
      key: "season_id",
      title: (
        <div className="flex flex-col gap-2 py-1" onClick={(e) => e.stopPropagation()}>
          <div className="font-semibold text-gray-700">Mùa vụ</div>
          <ComboBox
            placeholder="Chọn mùa vụ"
            value={filters.season_id}
            onChange={(val) => handleFilterChange('season_id', val)}
            onSearch={(text) => setSeasonSearchText(text)}
            data={(seasonsData?.data?.items || []).map((season: any) => ({
              value: season.id,
              label: season.name
            }))}
            isLoading={false}
            allowClear
            showSearch
            filterOption={false}
            style={{ width: '100%', minWidth: 120 }}
            size="small"
          />
        </div>
      ),
      width: 180,
      render: (record: ExtendedSalesInvoice) => {
        return <div>{record.season?.name || record.season_name || "-"}</div>
      },
    },
    {
      key: "sale_date",
      title: "Ngày bán",
      dataIndex: "sale_date",
      width: 120,
      ...getDateColumnSearchProps('sale_date'),
      filteredValue: (filters.sale_date_start && filters.sale_date_end) ? [filters.sale_date_start, filters.sale_date_end] : null,
      render: (value: string, record: ExtendedSalesInvoice) => {
        const dateValue = value || record.created_at
        return (
          <div>
            {dateValue ? dayjs(dateValue).format("DD/MM/YYYY") : "-"}
          </div>
        )
      },
    },
    {
      key: "rice_crop_id",
      dataIndex: "rice_crop_id",
      title: "Ruộng lúa",
      width: 150,
      filters: [
          { text: "Có liên kết Ruộng lúa", value: "has_crop" },
          { text: "Chưa liên kết Ruộng lúa", value: "no_crop" },
      ],
      filteredValue: filters.rice_crop_id ? [filters.rice_crop_id] : null,
      filterMultiple: false,
      render: (value: any, record: ExtendedSalesInvoice) => {
        if (!value) return <Tag color="default">Chưa liên kết</Tag>
        return (
          <div className='flex flex-col'>
            <div className='font-medium text-blue-600'>{record.rice_crop?.field_name || "Mảnh ruộng"}</div>
            <div className='text-xs text-gray-500'>{record.rice_crop?.rice_variety}</div>
          </div>
        )
      },
    },
    {
      key: "final_amount",
      title: "Tổng tiền",
      width: 130,
      render: (record: ExtendedSalesInvoice) => (
        <div className='text-green-600 font-medium'>
          {formatCurrency(record.final_amount)}
        </div>
      ),
    },
    {
      key: "partial_payment_amount",
      title: "Đã trả",
      width: 130,
      render: (record: ExtendedSalesInvoice) => (
        <div className='text-blue-600'>
          {formatCurrency(record.partial_payment_amount)}
        </div>
      ),
    },
    {
      key: "remaining_amount",
      title: "Còn nợ",
      width: 130,
      render: (record: ExtendedSalesInvoice) => {
        const amount = record.remaining_amount
        return (
          <div className={amount > 0 ? "text-red-600 font-medium" : ""}>
            {formatCurrency(amount)}
          </div>
        )
      },
    },

    {
      key: "status",
      dataIndex: "status",
      title: "Trạng thái",
      width: 120,
      filters: [
        { text: "Nháp", value: "draft" },
        { text: "Đã chốt", value: "confirmed" },
        { text: "Đã thanh toán", value: "paid" },
        { text: "Đã hủy", value: "cancelled" },
        { text: "Đã hoàn tiền", value: "refunded" },
      ],
      filteredValue: filters.status ? [filters.status] : null,
      filterMultiple: false,
      render: (status: string) => (
        <Tag color={getStatusColor(status || 'draft')}>
          {(invoiceStatusLabels as any)[status as any] || status}
        </Tag>
      ),
    },
    {
      key: "payment_status",
      dataIndex: "payment_status",
      title: "Thanh toán",
      width: 150,
      filters: Object.entries(paymentStatusLabels).map(([value, text]) => ({ text, value })),
      filteredValue: filters.payment_status ? [filters.payment_status] : null,
      filterMultiple: false,
      render: (status: string) => {
        const displayStatus = status || 'pending'
        return (
          <Tag color={getPaymentStatusColor(displayStatus)}>
            {paymentStatusLabels[displayStatus as keyof typeof paymentStatusLabels] || displayStatus}
          </Tag>
        )
      },
    },
    {
      key: "notes",
      title: "Ghi chú",
      dataIndex: "notes",
      width: 200,
      render: (notes: string) => (
        <Typography.Text 
          ellipsis={{ tooltip: notes }} 
          style={{ maxWidth: 180, fontSize: '13px', color: '#666' }}
        >
          {notes || "-"}
        </Typography.Text>
      ),
    },
    {
      key: "action",
      title: "Thao tác",
      width: 250,
      render: (record: ExtendedSalesInvoice) => (
        <Space size='small'>
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewInvoice(record)}
            size='small'
          >
            Xem
          </Button>
          <Button
            icon={<FileTextOutlined />}
            onClick={() => handleOpenHistory(record)}
            size='small'
            title="Xem tất cả lịch sử mua hàng"
          >
            Tất cả
          </Button>
          {record.status === 'draft' && (
            <Button
              icon={<EditOutlined />}
              onClick={() => navigate(`/sales-invoices/edit/${record.id}`)}
              size='small'
            >
              Sửa
            </Button>
          )}
          {record.status !== 'draft' && record.remaining_amount > 0 && 
           record.status !== 'cancelled' && record.status !== 'refunded' && (
            <Button
              type='primary'
              icon={<DollarOutlined />}
              onClick={() => handleOpenPaymentModal(record)}
              size='small'
            >
              Trả nợ
            </Button>
          )}
          
          {/* Hủy cho hóa đơn confirmed/partial nợ */}
          {record.status === 'confirmed' && (
            <Button
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => handleCancelInvoice(record)}
              size='small'
              title="Hủy hóa đơn"
            >
              Hủy
            </Button>
          )}

          {/* Hoàn tiền cho hóa đơn đã paid */}
          {record.status === 'paid' && (
            <Button
              danger
              icon={<UndoOutlined />}
              onClick={() => handleRefundInvoice(record)}
              size='small'
              title="Hoàn trả / Hoàn tiền"
            >
              Hoàn trả
            </Button>
          )}

          {/* Chỉ hiển thị nút xóa cho hóa đơn Nháp */}
          {record.status === 'draft' && (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteInvoice(record)}
              size='small'
              title="Xóa hóa đơn nháp"
            />
          )}
        </Space>
      ),
    },
  ]

  const visibleColumns = columns.filter((column) =>
    visibleColumnKeys.includes(String(column.key))
  )

  return (
    <div className='p-2 md:p-6'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6'>
        <h1 className='text-2xl font-bold'>Quản lý Hóa đơn bán hàng</h1>
        <Space className="w-full sm:w-auto" wrap>
          <Popover
            trigger="click"
            placement="bottomRight"
            title="Ẩn / hiện cột"
            content={
              <div className="w-48">
                <Checkbox.Group
                  className="flex flex-col gap-2"
                  options={salesInvoiceColumnOptions}
                  value={visibleColumnKeys}
                  onChange={(checkedValues) => {
                    if (checkedValues.length === 0) return
                    setVisibleColumnKeys(checkedValues.map(String))
                  }}
                />
                <Button
                  type="link"
                  size="small"
                  className="mt-2 p-0"
                  onClick={() => setVisibleColumnKeys(defaultVisibleSalesInvoiceColumns)}
                >
                  Hiện tất cả
                </Button>
              </div>
            }
          >
            <Button icon={<SettingOutlined />} className="w-full sm:w-auto">
              Cột
            </Button>
          </Popover>
          <Button
            type='primary'
            icon={<PlusOutlined />}
            onClick={() => navigate(`/sales-invoices/create${location.search}`)}
            className="w-full sm:w-auto"
          >
            Tạo hóa đơn mới
          </Button>
        </Space>
      </div>

      {/* Danh sách hóa đơn */}
      <div className='bg-white rounded shadow'>
        <DataTable
          data={getInvoiceList()}
          columns={visibleColumns}
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: invoicesData?.data?.total || 0,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total: number) => `Tổng ${total} hóa đơn`,
          }}
          onChange={handleTableChange}
          onView={(record) => handleViewInvoice(record as SalesInvoice)}
          showActions={false}
          showSearch={false}
          showFilters={false}
        />
      </div>

      {/* Detail Modal */}
      <Modal
        title={`Chi tiết hóa đơn: ${viewingInvoice?.code || ""}`}
        open={isDetailModalVisible}
        onCancel={handleCloseDetailModal}
        footer={[
          <Button key='close' onClick={handleCloseDetailModal}>
            Đóng
          </Button>,
          viewingInvoice?.status === 'confirmed' && (
            <Button
              key='cancel'
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => handleCancelInvoice(viewingInvoice)}
              loading={cancelInvoiceMutation.isPending}
            >
              Hủy hóa đơn
            </Button>
          ),
          viewingInvoice?.status === 'paid' && (
            <Button
              key='refund'
              danger
              icon={<UndoOutlined />}
              onClick={() => handleRefundInvoice(viewingInvoice)}
              loading={refundInvoiceMutation.isPending}
            >
              Hoàn trả / Hoàn tiền
            </Button>
          ),
          viewingInvoice?.status === 'draft' && (
            <Button
              key='delete'
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteInvoice(viewingInvoice)}
              loading={deleteInvoiceMutation.isPending}
            >
              Xóa nháp
            </Button>
          ),
        ]}
        width={800}
      >
        {viewingInvoice && (
          <div className='mt-4'>
            <div className='grid grid-cols-2 gap-4 mb-4'>
              <Card>
                <div className='text-gray-500 text-sm'>Khách hàng</div>
                <div className='text-lg font-medium'>
                  {viewingInvoice.customer_name}
                </div>
                <div className='text-gray-600'>
                  {viewingInvoice.customer_phone}
                </div>
                {viewingInvoice.customer_address && (
                <div className='text-gray-500 text-sm mt-1'>
                  {viewingInvoice.customer_address}
                </div>
              )}
              <div className='mt-3'>
                <div className='text-gray-500 text-sm'>Ngày bán</div>
                <div className='flex items-center gap-3'>
                  <span className='font-medium text-base'>
                    {dayjs(viewingInvoice.sale_date || viewingInvoice.created_at).format("DD/MM/YYYY")}
                  </span>
                  <Popover
                    content={
                      <div className="p-1">
                        <DatePicker 
                          value={dayjs(viewingInvoice.sale_date || viewingInvoice.created_at)}
                          format="DD/MM/YYYY"
                          onChange={(date) => handleUpdateSaleDate(date)}
                          allowClear={false}
                        />
                      </div>
                    }
                    title="Thay đổi ngày bán"
                    trigger="click"
                    placement="right"
                  >
                    <Button 
                      size="small" 
                      icon={<EditOutlined />} 
                      className="flex items-center"
                    >
                      Sửa
                    </Button>
                  </Popover>
                </div>
              </div>
            </Card>

              <Card>
                <div className='text-gray-500 text-sm'>Thông tin thanh toán</div>
                <div className='mt-2'>
                  <div className='text-sm text-gray-600'>Phương thức:</div>
                  <Tag color='blue'>
                    {
                      paymentMethodLabels[
                        viewingInvoice.payment_method as keyof typeof paymentMethodLabels
                      ]
                    }
                  </Tag>
                </div>
                <div className='mt-2'>
                  <div className='text-sm text-gray-600'>Tổng tiền:</div>
                  <div className='text-lg font-medium text-green-600'>
                    {formatCurrency(viewingInvoice.final_amount)}
                  </div>
                </div>
                <div className='mt-1'>
                  <span className='text-sm text-gray-600'>Đã trả: </span>
                  <span className='text-blue-600'>
                    {formatCurrency(viewingInvoice.partial_payment_amount)}
                  </span>
                </div>
                <div className='mt-1'>
                  <span className='text-sm text-gray-600'>Còn nợ: </span>
                  <span className='text-red-600 font-medium'>
                    {formatCurrency(viewingInvoice.remaining_amount)}
                  </span>
                </div>
              </Card>
            </div>

            {/* Thông tin Ruộng lúa (nếu có) */}
            {(viewingInvoice as any).rice_crop && (
              <Alert
                message="🌾 Hóa đơn này liên kết với Ruộng lúa"
                description={
                  <div className='mt-2'>
                    <div className='font-medium text-base mb-1'>
                      {(viewingInvoice as any).rice_crop.field_name}
                    </div>
                    <div className='text-sm text-gray-600'>
                      <span>Giống lúa: {(viewingInvoice as any).rice_crop.rice_variety}</span>
                      {(viewingInvoice as any).rice_crop.field_area && (
                        <span className='ml-3'>
                          Diện tích: {(viewingInvoice as any).rice_crop.field_area.toLocaleString('vi-VN')} m²
                        </span>
                      )}
                    </div>
                    {(viewingInvoice as any).rice_crop.season && (
                      <div className='text-sm text-gray-600 mt-1'>
                        Mùa vụ: {(viewingInvoice as any).rice_crop.season.name} ({(viewingInvoice as any).rice_crop.season.year})
                      </div>
                    )}
                    <Button
                      type="link"
                      size="small"
                      className='mt-2 p-0'
                      onClick={() => navigate(`/rice-crops/${(viewingInvoice as any).rice_crop_id}`)}
                    >
                      Xem chi tiết Ruộng lúa →
                    </Button>
                  </div>
                }
                type="info"
                showIcon
                className='mb-4'
              />
            )}

            <Alert
              message={
                 <div className="flex items-center justify-between">
                    <span>⚠️ Lưu ý quan trọng</span>
                 </div>
              }
              description={
                <Typography.Paragraph
                  editable={{
                    onChange: (val) => handleUpdateInvoiceField({ warning: val }, 'Cập nhật lưu ý thành công'),
                    tooltip: 'Nhấn để sửa lưu ý',
                  }}
                  className="mb-0"
                >
                  {viewingInvoice.warning || "Chưa có lưu ý quan trọng. Nhấp vào đây để thêm..."}
                </Typography.Paragraph>
              }
              type='error'
              showIcon
              className='mb-4'
            />

            <div className='mb-4 py-3 px-4 bg-gray-50 rounded-lg border border-gray-100'>
              <div className='text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2'>Ghi chú hóa đơn</div>
              <Typography.Paragraph
                editable={{
                  onChange: (val) => handleUpdateInvoiceField({ notes: val }, 'Cập nhật ghi chú thành công'),
                  tooltip: 'Nhấn để sửa ghi chú',
                }}
                className="mb-0 text-gray-700"
              >
                {viewingInvoice.notes || "Chưa có ghi chú. Nhấp vào đây để thêm..."}
              </Typography.Paragraph>
            </div>

            {/* ✅ Section phiếu trả hàng liên kết */}
            {(viewingInvoice as any).returns && (viewingInvoice as any).returns.length > 0 && (
              <div className='mb-4 p-4 bg-orange-50 rounded-lg border border-orange-100'>
                <div className='text-orange-800 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2'>
                  <UndoOutlined /> Phiếu trả hàng liên kết ({(viewingInvoice as any).returns.length})
                </div>
                <div className='flex flex-wrap gap-2'>
                  {(viewingInvoice as any).returns.map((ret: any) => (
                    <Tag 
                      key={ret.id} 
                      color="orange" 
                      className="cursor-pointer hover:opacity-80"
                      onClick={() => navigate(`/sales-returns?code=${ret.code}`)}
                    >
                      {ret.code} - {formatCurrency(ret.total_refund_amount)}
                    </Tag>
                  ))}
                </div>
                <div className="text-[11px] text-orange-600 mt-2 italic">* Nhấp vào mã phiếu để xem chi tiết bên trang Trả hàng</div>
              </div>
            )}

            <div className='mt-4'>
              <div className='font-medium text-lg mb-3'>Danh sách sản phẩm</div>
              {viewingInvoice.items && viewingInvoice.items.length > 0 ? (
                <Space direction='vertical' className='w-full' size='small'>
                  {[...(viewingInvoice.items)].reverse().map((item, index) => (
                    <Card key={index} size='small'>
                      <div className='grid grid-cols-4 gap-4'>
                        <div className='col-span-2'>
                          <div className='font-medium text-base'>{item.product?.trade_name || item.product?.name || item.product_name || 'Sản phẩm không xác định'}</div>
                          {/* Hiển thị số lượng đã trả hàng nếu có */}
                          {(item.returned_quantity ?? 0) > 0 && (
                            <div className='flex items-center gap-2 mt-1'>
                              <Tag color="orange" className="m-0 border-orange-200">
                                ↩ Đã trả: {item.returned_quantity} {item.unit_name || item.product?.unit?.name || ''}
                              </Tag>
                              <span className="text-xs text-gray-400 italic">
                                (Gốc: {item.quantity})
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className='text-sm text-gray-500'>
                            { (item.returned_quantity ?? 0) > 0 ? (
                                <span>SL thực: <b className="text-gray-800">{item.quantity - (item.returned_quantity || 0)}</b> {item.unit_name || item.product?.unit?.name}</span>
                            ) : (
                                <span>SL: {item.quantity} {item.unit_name || item.product?.unit?.name}</span>
                            )}
                          </div>
                          <div className='text-sm text-gray-500'>
                            Giá: {formatCurrency(item.unit_price)}
                          </div>
                          {item.other_unit_name && Number(item.other_unit_factor) > 0 && (
                            <div className='text-[11px] text-gray-400 italic'>
                              {(() => {
                                const factor = Number(item.conversion_factor || 1);
                                const otherFactor = Number(item.other_unit_factor);
                                const isBase = factor === 1;
                                
                                const actualQty = item.quantity - (item.returned_quantity || 0);
                                const otherQty = isBase ? (actualQty / otherFactor) : (actualQty * factor);
                                const otherPrice = isBase ? (item.unit_price * otherFactor) : (item.unit_price / factor);
                                
                                return `(${otherQty.toLocaleString('vi-VN')} ${item.other_unit_name} - ${formatCurrency(otherPrice)}/${item.other_unit_name})`;
                              })()}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className='text-sm text-gray-500'>Thành tiền</div>
                          <div className='font-bold text-green-700 text-base'>
                            {formatCurrency(
                              (item.quantity - (item.returned_quantity || 0)) * item.unit_price -
                                (item.discount_amount || 0)
                            )}
                          </div>
                          {(item.returned_quantity ?? 0) > 0 && (
                            <div className="text-[10px] text-gray-400 line-through">
                                {formatCurrency(item.quantity * item.unit_price)}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </Space>
              ) : (
                <Alert
                  message="Không tìm thấy sản phẩm"
                  description={`Hệ thống không tìm thấy mặt hàng nào cho hóa đơn ID: ${viewingInvoice.id}. Vui lòng kiểm tra lại trên DB hoặc liên hệ kỹ thuật.`}
                  type="warning"
                  showIcon
                />
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Modal */}
      <Modal
        title={`Trả nợ hóa đơn: ${viewingInvoice?.code || ""}`}
        open={isPaymentModalVisible}
        onCancel={handleClosePaymentModal}
        footer={[
          <Button key='cancel' onClick={handleClosePaymentModal}>
            Hủy
          </Button>,
          <Button
            key='submit'
            type='primary'
            loading={addPaymentMutation.isPending}
            onClick={handleSubmitPayment}
            disabled={paymentAmount <= 0}
          >
            Xác nhận thanh toán
          </Button>,
        ]}
        width={500}
      >
        {viewingInvoice && (
          <div className='mt-4'>
            <Card className='mb-4 bg-gray-50'>
              <div className='text-gray-500 text-sm'>Số tiền còn nợ</div>
              <div className='text-2xl font-bold text-red-600'>
                {formatCurrency(viewingInvoice.remaining_amount)}
              </div>
            </Card>

            <div>
              <div className='text-sm text-gray-600 mb-2'>Số tiền trả</div>
              <InputNumber
                className='w-full'
                value={paymentAmount}
                onChange={(value) => setPaymentAmount(value || 0)}
                min={0}
                max={viewingInvoice.remaining_amount}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                }
                parser={(value) => Number(value!.replace(/\$\s?|(\.*)/g, ""))}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Báo cáo tổng hợp mua hàng của khách hàng */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <FileTextOutlined className="text-blue-500" />
            <span>Báo cáo mua hàng: {currentCustomer?.name}</span>
          </div>
        }
        open={isHistoryModalVisible}
        onCancel={() => setIsHistoryModalVisible(false)}
        width={1000}
        footer={[
          <Button key='close' onClick={() => setIsHistoryModalVisible(false)}>
            Đóng
          </Button>,
        ]}
      >
        <div className="py-2">
          {filters.season_id && seasonsData?.data?.items && (
            <Alert 
              message={`Đang lọc theo mùa vụ: ${seasonsData.data.items.find((s: any) => s.id === filters.season_id)?.name || 'Không xác định'}`}
              type="info" 
              className="mb-4"
              showIcon
            />
          )}

          <Table
            dataSource={historyData}
            loading={historyLoading}
            pagination={false}
            scroll={{ y: 500 }}
            rowKey={(record, index) => `${record.invoice_id}-${index}`}
            summary={(pageData) => {
              let totalAmount = 0;
              pageData.forEach(({ total_price }) => {
                totalAmount += total_price;
              });

              return (
                <Table.Summary.Row className="bg-gray-50 font-bold">
                  <Table.Summary.Cell index={0} colSpan={5} className="text-right">
                    TỔNG CỘNG:
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} className="text-right text-green-600">
                    {formatCurrency(totalAmount)}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} />
                </Table.Summary.Row>
              );
            }}
            columns={[
              {
                title: 'Ngày hóa đơn',
                dataIndex: 'date',
                key: 'date',
                width: 120,
                render: (date) => dayjs(date).format('DD/MM/YYYY'),
              },
              {
                title: 'Tên hàng',
                dataIndex: 'product_name',
                key: 'product_name',
              },
              {
                title: 'ĐVT',
                dataIndex: 'unit',
                key: 'unit',
                width: 100,
                align: 'center',
              },
              {
                title: 'SL',
                dataIndex: 'quantity',
                key: 'quantity',
                width: 80,
                align: 'right',
              },
              {
                title: 'Đơn giá',
                dataIndex: 'unit_price',
                key: 'unit_price',
                width: 120,
                align: 'right',
                render: (val) => formatCurrency(val),
              },
              {
                title: 'Thành tiền',
                dataIndex: 'total_price',
                key: 'total_price',
                width: 140,
                align: 'right',
                render: (val) => formatCurrency(val),
              },
              {
                title: 'Mã HĐ',
                dataIndex: 'invoice_code',
                key: 'invoice_code',
                width: 150,
                render: (code) => <Tag color="blue">{code}</Tag>,
              }
            ]}
          />
        </div>
      </Modal>
    </div>
  )
}

export default SalesInvoicesList
