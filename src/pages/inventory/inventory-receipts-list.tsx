import React, { useState, useMemo } from "react"
import { useNavigate, useSearchParams, useLocation } from "react-router-dom"
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Typography,
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
  InfoCircleOutlined,
  FileExcelOutlined,
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import ExcelJS from 'exceljs'
import { toast } from 'react-toastify'

import api from "@/utils/api"

import { 
  InventoryReceipt, 
  InventoryReceiptItem,
  InventoryReceiptPayment,
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
  buildInventoryReceiptsSearchPayload,
  InventoryReceiptsSearchResponse,
} from "@/queries/inventory"
import { useSupplierSearch, useSupplierQuery } from "@/queries/supplier"
import { LoadingSpinner, RangePicker, DatePicker, ComboBox } from "@/components/common"
import DataTable from "@/components/common/data-table"
import FilterHeader from '@/components/common/filter-header'
import TaxableItemsModal from "./components/taxable-items-modal"

const { Title, Text } = Typography

const formatDate = (value?: string) =>
  value ? dayjs(value).format('DD/MM/YYYY') : ''

const formatDateTime = (value?: string) =>
  value ? dayjs(value).format('DD/MM/YYYY HH:mm') : ''

const formatExcelMoney = (value?: number | string) => {
  const numericValue = Number(value || 0)
  const hasFraction = Math.abs(numericValue % 1) > 0

  return numericValue.toLocaleString('vi-VN', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  })
}

const getPaymentMethodLabel = (method?: string) => {
  const methods: Record<string, string> = {
    cash: 'Tien mat',
    transfer: 'Chuyen khoan',
    debt: 'Cong no',
  }

  return methods[method || ''] || (method || '')
}

const buildPaymentHistoryText = (
  receipt: InventoryReceipt,
  payments: InventoryReceiptPayment[]
) => {
  if (payments.length > 0) {
    return payments
      .map(
        (payment) =>
          [
            formatDateTime(payment.payment_date),
            `${formatExcelMoney(payment.amount)} - ${getPaymentMethodLabel(payment.payment_method)}`,
            payment.notes || '',
          ]
            .filter(Boolean)
            .join('\n')
      )
      .join('\n\n')
  }

  const paidAmount = Number(receipt.paid_amount) || 0
  const debtAmount = Number(receipt.debt_amount) || 0
  const supplierAmount = Number(receipt.supplier_amount) || Number(receipt.total_amount) || 0

  if (paidAmount > 0) {
    return `Da thanh toan ${formatExcelMoney(paidAmount)} / Phai tra ${formatExcelMoney(supplierAmount)} / Con no ${formatExcelMoney(debtAmount)}`
  }

  if (receipt.payment_status === 'paid') {
    return `Da thanh toan du ${formatExcelMoney(supplierAmount)}`
  }

  return 'Chua co thanh toan'
}

const sanitizeFileNamePart = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

const createUniqueSheetName = (rawName: string, usedNames: Set<string>) => {
  const sanitizedName = rawName
    .replace(/[:\\/?*[\]]/g, '')
    .trim() || 'Sheet'

  let candidate = sanitizedName.slice(0, 31) || 'Sheet'
  let suffix = 1

  while (usedNames.has(candidate)) {
    const suffixText = `_${suffix}`
    const baseName = sanitizedName.slice(0, Math.max(0, 31 - suffixText.length)) || 'Sheet'
    candidate = `${baseName}${suffixText}`
    suffix += 1
  }

  usedNames.add(candidate)
  return candidate
}

const buildSupplierSheet = (
  workbook: ExcelJS.Workbook,
  sheetName: string,
  supplierName: string,
  receipts: InventoryReceipt[],
  paymentsByReceiptId: Map<number, InventoryReceiptPayment[]>
) => {
  const rows: Array<Array<string | number>> = []
  const merges: Array<{ fromRow: number; fromCol: number; toRow: number; toCol: number }> = []
  const rowHeights: Array<{ hpt: number }> = []

  const totalDebt = receipts.reduce((sum, receipt) => sum + (Number(receipt.debt_amount) || 0), 0)
  const totalAmount = receipts.reduce((sum, receipt) => sum + (Number(receipt.total_amount) || 0), 0)

  rows.push([`NHA CUNG CAP: ${supplierName}`])
  rowHeights.push({ hpt: 24 })
  merges.push({ fromRow: 1, fromCol: 1, toRow: 1, toCol: 16 })
  rows.push([
    'Ngay',
    'Ma phieu',
    'Ten hang',
    'Don vi tinh',
    'So luong',
    'SL thue',
    'Don gia',
    'Don gia VAT',
    'Phi boc vac',
    'Thanh tien',
    'Lich su thanh toan',
    'Ghi chu',
    'No chua thanh toan',
    'Tong moi dot',
    'Tong no NCC',
    'Tong tat ca NCC',
  ])
  rowHeights.push({ hpt: 22 })

  receipts.forEach((receipt) => {
    const items = receipt.items || []
    const sharedShippingCost = Number(receipt.shared_shipping_cost) || 0
    const debtAmount = Number(receipt.debt_amount) || 0
    const receiptTotal = Number(receipt.total_amount) || 0
    const payments = paymentsByReceiptId.get(receipt.id) || []
    const paymentHistoryText = buildPaymentHistoryText(receipt, payments)

    const noteParts = [
      `Phieu: ${receipt.code}`,
      `Trang thai: ${receipt.status}`,
      receipt.notes ? `Ghi chu: ${receipt.notes}` : '',
    ].filter(Boolean)
    const receiptNote = noteParts.join('\n')

    const displayRows: Array<Array<string | number>> = items.map((item: InventoryReceiptItem, itemIndex: number) => [
      formatDate(receipt.bill_date || receipt.created_at),
      receipt.code,
      item.product_name || item.product?.name || '',
      item.unit_name || '',
      Number(item.quantity) || 0,
      Number(item.taxable_quantity) || 0,
      formatExcelMoney(Number(item.unit_cost) || 0),
      formatExcelMoney(Number(item.vat_unit_cost) || 0),
      formatExcelMoney(Number(item.individual_shipping_cost) || 0),
      formatExcelMoney(Number(item.total_price) || (Number(item.quantity) || 0) * (Number(item.unit_cost) || 0)),
      itemIndex === 0 ? paymentHistoryText : '',
      itemIndex === 0 ? receiptNote : '',
      formatExcelMoney(debtAmount),
      formatExcelMoney(receiptTotal),
      formatExcelMoney(totalDebt),
      formatExcelMoney(totalAmount),
    ])

    if (sharedShippingCost > 0) {
      displayRows.push([
        '',
        '',
        'Phi boc vac chung',
        '',
        '',
        '',
        '',
        '',
        formatExcelMoney(sharedShippingCost),
        formatExcelMoney(sharedShippingCost),
        '',
        '',
        formatExcelMoney(debtAmount),
        formatExcelMoney(receiptTotal),
        formatExcelMoney(totalDebt),
        formatExcelMoney(totalAmount),
      ])
    }

    if (displayRows.length === 0) {
      displayRows.push([
        formatDate(receipt.bill_date || receipt.created_at),
        receipt.code,
        'Khong co hang hoa',
        '',
        '',
        '',
        '',
        '',
        formatExcelMoney(sharedShippingCost),
        formatExcelMoney(receiptTotal),
        paymentHistoryText,
        receiptNote,
        formatExcelMoney(debtAmount),
        formatExcelMoney(receiptTotal),
        formatExcelMoney(totalDebt),
        formatExcelMoney(totalAmount),
      ])
    }

    const startRow = rows.length
    displayRows.forEach((row) => rows.push(row))
    displayRows.forEach((row, rowIndex) => {
      if (rowIndex === 0) {
        const paymentLines = String(row[10] || '').split('\n').filter(Boolean).length
        const noteLines = String(row[11] || '').split('\n').filter(Boolean).length
        const lineCount = Math.max(paymentLines, noteLines, 1)
        rowHeights.push({ hpt: Math.max(22, lineCount * 16) })
      } else {
        rowHeights.push({ hpt: 20 })
      }
    })
    const endRow = rows.length - 1

    if (endRow > startRow) {
      [0, 1, 10, 11, 12, 13].forEach((column) => {
        merges.push({
          fromRow: startRow + 1,
          fromCol: column + 1,
          toRow: endRow + 1,
          toCol: column + 1,
        })
      })
    }
  })

  if (rows.length > 2) {
    merges.push({ fromRow: 3, fromCol: 15, toRow: rows.length, toCol: 15 })
    merges.push({ fromRow: 3, fromCol: 16, toRow: rows.length, toCol: 16 })
  }

  const worksheet = workbook.addWorksheet(sheetName)
  worksheet.columns = [
    { width: 12 },
    { width: 18 },
    { width: 28 },
    { width: 12 },
    { width: 10 },
    { width: 10 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 14 },
    { width: 34 },
    { width: 28 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
  ]

  rows.forEach((row, index) => {
    const excelRow = worksheet.addRow(row)
    excelRow.height = rowHeights[index]?.hpt
  })

  merges.forEach(({ fromRow, fromCol, toRow, toCol }) => {
    worksheet.mergeCells(fromRow, fromCol, toRow, toCol)
  })

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      cell.alignment = {
        vertical: 'top',
        wrapText: colNumber === 11 || colNumber === 12,
      }

      if (rowNumber === 1 || rowNumber === 2) {
        cell.font = { bold: true }
      }
    })
  })

  return worksheet
}

const InventoryReceiptsList: React.FC = () => {
  const navigate = useNavigate()

  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()

  // Lấy các giá trị từ URL
  const currentPage = Number(searchParams.get("page")) || 1
  const pageSize = Number(searchParams.get("limit")) || 10

  // Chuyển đổi searchParams thành filters object
  const filters = useMemo(() => {
    const f: Record<string, any> = {}
    searchParams.forEach((value, key) => {
      if (key !== "page" && key !== "limit") {
        // Chuyển đổi ID sang number nếu cần
        if (key.endsWith('_id')) {
          const numValue = Number(value)
          f[key] = isNaN(numValue) ? value : numValue
        } else {
          f[key] = value
        }
      }
    })
    return f
  }, [searchParams])

  // Hàm cập nhật URL search params
  const updateUrlParams = React.useCallback((newParams: Record<string, any>, resetPage = false) => {
    const params = new URLSearchParams(searchParams)
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })

    if (resetPage) {
      params.set("page", "1")
    }

    setSearchParams(params)
  }, [searchParams, setSearchParams])

  // State tìm kiếm nhà cung cấp cho Filter ComboBox
  const [searchTermSupplier, setSearchTermSupplier] = useState("")
  const { data: suppliersData, isLoading: isLoadingSuppliers } = useSupplierSearch(searchTermSupplier, 20, true)

  // Fetch thông tin NCC cụ thể nếu có ID trong bộ lọc để hiển thị label đúng
  const { data: selectedSupplierData } = useSupplierQuery(
    filters.supplier_id ? Number(filters.supplier_id) : 0
  )

  const supplierOptions = useMemo(() => {
    const uniqueSuppliers = new Map();
    
    // Thêm NCC đang chọn vào list để luôn có label
    if (selectedSupplierData) {
      uniqueSuppliers.set(selectedSupplierData.id, {
        value: selectedSupplierData.id,
        label: selectedSupplierData.name
      })
    }

    if (suppliersData?.pages) {
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
    }
    return Array.from(uniqueSuppliers.values());
  }, [suppliersData, selectedSupplierData])

  // Tạo params cho API call
  const queryParams = useMemo<InventoryReceiptListParams>(() => {
    const params: InventoryReceiptListParams = {
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
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

    if (filters.payment_status) {
      params.payment_status = filters.payment_status
    }

    if (filters.start_date && filters.end_date) {
      params.startDate = filters.start_date
      params.endDate = filters.end_date
    }

    return params
  }, [filters, pageSize, currentPage])

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
    useInventoryStatsQuery(
      filters.supplier_id ? Number(filters.supplier_id) : undefined,
      filters.start_date,
      filters.end_date
    )

  const [isTaxableModalVisible, setIsTaxableModalVisible] = useState(false)

  // Mutations
  const deleteReceiptMutation = useDeleteInventoryReceiptMutation()

  const [isExporting, setIsExporting] = useState(false)

  // Handlers
  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      const exportResponse = await api.postRaw<any[]>(
        '/inventory/receipts/export',
        buildInventoryReceiptsSearchPayload(queryParams, {
          page: 1,
          limit: 100000,
        })
      )

      const detailedReceipts = (exportResponse || [])
        .map(mapApiResponseToInventoryReceipt)
        .filter(
          (receipt) =>
            normalizeReceiptStatus(receipt.status_code || receipt.status) ===
            InventoryReceiptStatus.APPROVED
        )

      if (detailedReceipts.length === 0) {
        toast.warning("Không có phiếu đã duyệt để xuất!")
        return
      }
      const paymentsByReceiptId = new Map<number, InventoryReceiptPayment[]>(
        detailedReceipts.map((receipt) => [receipt.id, receipt.payments || []])
      )

      const wb = new ExcelJS.Workbook()
      const usedSheetNames = new Set<string>()
      const receiptsBySupplier = new Map<string, InventoryReceipt[]>()

      detailedReceipts.forEach((receipt) => {
        const supplierName = receipt.supplier?.name || receipt.supplier_name || 'Khac'
        const currentReceipts = receiptsBySupplier.get(supplierName) || []
        currentReceipts.push(receipt)
        receiptsBySupplier.set(supplierName, currentReceipts)
      })

      Array.from(receiptsBySupplier.entries()).forEach(([supplierName, supplierReceipts]) => {
        buildSupplierSheet(
          wb,
          createUniqueSheetName(supplierName, usedSheetNames),
          supplierName,
          supplierReceipts,
          paymentsByReceiptId
        )
      })

      // 4. Xuất file
      const selectedSupplierName = supplierOptions.find(
        (supplier) => supplier.value === filters.supplier_id
      )?.label
      const dateSuffix = dayjs().format('DD-MM-YYYY')
      const fileName = selectedSupplierName
        ? `Phieu_Nhap_${sanitizeFileNamePart(selectedSupplierName)}_${dateSuffix}.xlsx`
        : `Phieu_Nhap_Hang_${dateSuffix}.xlsx`
      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob(
        [buffer],
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      )
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.click()
      window.URL.revokeObjectURL(url)
      toast.success("Xuất file Excel thành công!")
    } catch (error) {
      console.error("Export Excel Error:", error)
      toast.error("Lỗi khi xuất file Excel!")
    } finally {
      setIsExporting(false)
    }
  }

  // Handlers
  const handleTableChange = (
    newPagination: any,
    tableFilters: any,
  ) => {
    const newParams: Record<string, any> = {
      page: newPagination.current || 1,
      limit: newPagination.pageSize || 10,
    }

    // Status Filter từ cột table nếu có
    if (tableFilters.status && tableFilters.status.length > 0) {
      newParams.status = tableFilters.status[0]
    }

    updateUrlParams(newParams)
  }

  const handleFilterChange = (key: string, value: any) => {
    updateUrlParams({ [key]: value }, true)
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

  // Action handlers
  const handleViewReceipt = (receipt: InventoryReceipt) => {
    navigate(`/inventory/receipts/${receipt.id}${location.search}`)
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
        const stt = (currentPage - 1) * pageSize + index + 1;
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
      render: (code: string) => (
        <div className='font-medium text-blue-600'>
          {code}
        </div>
      ),
    },
    {
      title: "Ngày nhập",
      dataIndex: "bill_date",
      key: "bill_date",
      width: 120,
      render: (date: string, record: InventoryReceipt) => 
        date ? dayjs(date).format("DD/MM/YYYY") : dayjs(record.created_at).format("DD/MM/YYYY"),
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
      render: (amount: number, record: InventoryReceipt) => {
        const finalAmount = Number(record.final_amount) || Number(record.total_amount) || 0;
        const supplierAmount = Number(record.supplier_amount) || finalAmount;
        const hasExcludedCosts = supplierAmount !== finalAmount;

        return (
          <Space size="small">
            {hasExcludedCosts && amount > 0 && (
              <Tooltip title={`Tổng tiền hàng: ${supplierAmount.toLocaleString('vi-VN')} đ (Đã trừ phí vận chuyển ${(finalAmount - supplierAmount).toLocaleString('vi-VN')} đ)`}>
                <InfoCircleOutlined style={{ color: '#faad14', fontSize: '12px' }} />
              </Tooltip>
            )}
            <Text style={{ color: amount > 0 ? '#ff4d4f' : '#52c41a' }}>
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
              }).format(amount || 0)}
            </Text>
          </Space>
        )
      },
    },
    {
      title: (
        <FilterHeader 
            title="TT Thanh toán" 
            value={filters.payment_status} 
            onChange={(val) => handleFilterChange('payment_status', val)}
            inputType="select"
            options={[
              { label: "Đã thanh toán", value: "paid" },
              { label: "Một phần", value: "partial" },
              { label: "Chưa TT", value: "unpaid" },
            ]}
        />
      ),
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
      title: "Ghi chú",
      dataIndex: "notes",
      key: "notes",
      width: 250,
      render: (notes: string) => {
        if (!notes) return "-";
        return (
          <Tooltip title={<div style={{ whiteSpace: 'pre-wrap' }}>{notes}</div>}>
            <div style={{ 
              maxWidth: 250, 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap' 
            }}>
              {notes}
            </div>
          </Tooltip>
        );
      },
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

        {/* Filter Nhà cung cấp */}
        <Col span={24}>
          <Card size="small" bodyStyle={{ padding: '12px' }}>
            <Row gutter={[12, 12]} align="middle">
              <Col xs={24} md={8}>
                <Space direction="vertical" size={2} style={{ width: '100%' }}>
                  <Text strong style={{ fontSize: '12px' }}>📦 Lọc theo nhà cung cấp:</Text>
                  <ComboBox 
                    value={filters.supplier_id}
                    onChange={(val) => handleFilterChange('supplier_id', val)}
                    options={supplierOptions}
                    onSearch={setSearchTermSupplier}
                    placeholder="Tất cả nhà cung cấp"
                    loading={isLoadingSuppliers}
                    allowClear
                    showSearch
                    filterOption={false}
                    style={{ width: '100%' }}
                  />
                </Space>
              </Col>
              <Col xs={24} md={10}>
                <Space direction="vertical" size={2} style={{ width: '100%' }}>
                  <Text strong style={{ fontSize: '12px' }}>📅 Khoảng thời gian nhập:</Text>
                  <Space.Compact style={{ width: '100%' }}>
                    <DatePicker 
                      style={{ width: '50%' }}
                      value={filters.start_date ? dayjs(filters.start_date) : undefined}
                      onChange={(date: any) => handleFilterChange("start_date", date ? date.toISOString() : undefined)}
                      placeholder="Từ ngày"
                      format="DD/MM/YYYY"
                    />
                    <DatePicker 
                      style={{ width: '50%' }}
                      value={filters.end_date ? dayjs(filters.end_date) : undefined}
                      onChange={(date: any) => handleFilterChange("end_date", date ? date.toISOString() : undefined)}
                      placeholder="Đến ngày"
                      format="DD/MM/YYYY"
                    />
                  </Space.Compact>
                </Space>
              </Col>
              {(filters.code || filters.supplier_id || filters.status || filters.payment_status || (filters.start_date && filters.end_date)) && (
                <Col xs={24} md={6}>
                   <div className="mt-4 md:mt-0 text-right">
                     <Button 
                       type="primary" 
                       size="small" 
                       danger 
                       onClick={() => setSearchParams({})}
                       className="text-[11px]"
                     >
                       XÓA BỘ LỌC
                     </Button>
                   </div>
                </Col>
              )}
            </Row>
          </Card>
        </Col>

        {/* Thống kê tổng quan */}
        {statsData && (
          <Col span={24}>
                {/* Thống kê 8 tấm (Tối ưu sắp xếp và hiển thị) */}
                <Row gutter={[4, 4]}>
                  {/* Nhóm 1: Trạng thái phiếu (Cố định 2 cột mỗi dòng trên mobile) */}
                  <Col xs={12} sm={8} md={2}>
                    <Card size="small" bodyStyle={{ padding: '4px 2px', textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1890ff' }}>{statsData.totalReceipts ?? 0}</div>
                      <Text className="text-[10px] block" type="secondary">Tổng phiếu</Text>
                    </Card>
                  </Col>
                  <Col xs={12} sm={8} md={2}>
                    <Card size="small" bodyStyle={{ padding: '4px 2px', textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fa8c16' }}>{statsData.draftReceipts ?? 0}</div>
                      <Text className="text-[10px] block" type="secondary">Bản nháp</Text>
                    </Card>
                  </Col>
                  <Col xs={12} sm={8} md={2}>
                    <Card size="small" bodyStyle={{ padding: '4px 2px', textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#52c41a' }}>{statsData.approvedReceipts ?? 0}</div>
                      <Text className="text-[10px] block" type="secondary">Đã duyệt</Text>
                    </Card>
                  </Col>
                  <Col xs={12} sm={8} md={2}>
                    <Card size="small" bodyStyle={{ padding: '4px 2px', textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ff4d4f' }}>{statsData.cancelledReceipts ?? 0}</div>
                      <Text className="text-[10px] block" type="secondary">Đã hủy</Text>
                    </Card>
                  </Col>

                  {/* Nhóm 2: Tài chính - HIỂN THỊ GIÁ TRỊ CÓ HÓA ĐƠN ĐẦU TIÊN */}
                  <Col xs={24} sm={12} md={4}>
                    <Card size="small" bodyStyle={{ padding: '4px 2px', textAlign: 'center' }} className="!bg-blue-50">
                      <div className="flex flex-col items-center">
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#096dd9' }}>
                          {new Intl.NumberFormat("vi-VN").format(parseFloat(String(statsData.totalTaxableValue ?? "0")))} đ
                        </div>
                        <div className="flex items-center gap-1">
                          <Text className="text-[10px]" type="secondary">Giá trị hàng có HĐ</Text>
                          <Button 
                            type="link" 
                            size="small" 
                            className="p-0 h-auto text-[10px] font-bold" 
                            onClick={() => setIsTaxableModalVisible(true)}
                          >
                            XEM
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </Col>
                  
                  <Col xs={12} sm={12} md={3}>
                    <Card size="small" bodyStyle={{ padding: '4px 2px', textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#13c2c2' }}>
                        {new Intl.NumberFormat("vi-VN").format(parseFloat(String(statsData.totalValue ?? "0")))} đ
                      </div>
                      <Text className="text-[10px] block" type="secondary">Tổng tiền hàng</Text>
                    </Card>
                  </Col>
                  <Col xs={12} sm={12} md={3}>
                    <Card size="small" bodyStyle={{ padding: '4px 2px', textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#52c41a' }}>
                        {new Intl.NumberFormat("vi-VN").format(parseFloat(String(statsData.totalPaid ?? "0")))} đ
                      </div>
                      <Text className="text-[10px] block" type="secondary">Đã thanh toán</Text>
                    </Card>
                  </Col>
                  <Col xs={12} sm={12} md={3}>
                    <Card size="small" bodyStyle={{ padding: '4px 2px', textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ff4d4f' }}>
                        {new Intl.NumberFormat("vi-VN").format(parseFloat(String(statsData.totalDebt ?? "0")))} đ
                      </div>
                      <Text className="text-[10px] block" type="secondary">Còn nợ</Text>
                    </Card>
                  </Col>
                  <Col xs={12} sm={12} md={3}>
                    <Card size="small" bodyStyle={{ padding: '4px 2px', textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#722ed1' }}>{statsData.debtReceiptsCount ?? 0}</div>
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
              icon={<FileExcelOutlined className="text-green-600" />}
              onClick={handleExportExcel}
              loading={isExporting}
              className="hover:border-green-500 hover:text-green-600"
            >
              <span className="hidden sm:inline">Xuất Excel</span>
              <span className="sm:hidden">Excel</span>
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
          <DataTable
            data={mappedReceipts as any}
            columns={columns.filter(c => c.key !== 'stt') as any}
            rowKey='id'
            showActions={false}
            onView={(record) => handleViewReceipt(record as any)}
            paginationConfig={{
              current: currentPage,
              pageSize: pageSize,
              total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total: number, range: [number, number]) =>
                `${range[0]}-${range[1]} của ${total} phiếu nhập`,
            }}
            onChange={(pagination: any) => handleTableChange(pagination, {})}
            scroll={{ x: 1200 }}
            showSTT={true}
          />
        )}
      </Card>
      <TaxableItemsModal 
        open={isTaxableModalVisible}
        onClose={() => setIsTaxableModalVisible(false)}
        supplierId={filters.supplier_id ? Number(filters.supplier_id) : undefined}
        startDate={filters.start_date}
        endDate={filters.end_date}
        supplierName={supplierOptions.find(s => s.value === filters.supplier_id)?.label}
      />
    </div>
  )
}

export default InventoryReceiptsList
