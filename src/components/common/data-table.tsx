import React, { useState, useMemo } from "react"
import {
  Table,
  TableProps,
  Button,
  Space,
  Tooltip,
  Input,
  Select,
  Card,
  Popover,
  Checkbox,
} from "antd"
import type { ColumnType, TablePaginationConfig } from "antd/es/table"
import type { FilterValue, SorterResult } from "antd/es/table/interface"
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  SettingOutlined,
} from "@ant-design/icons"
import LoadingSpinner from "./loading-spinner"
import { useMobile } from "../../hooks/use-media-query"

const { Search } = Input
const { Option } = Select

interface ActionButton<T = Record<string, unknown>> {
  key: string
  icon?: React.ReactNode
  tooltip?: string
  onClick: (record: T) => void
  type?: "primary" | "default" | "dashed" | "link" | "text"
  danger?: boolean
  disabled?: (record: T) => boolean
}

interface FilterOption {
  label: string
  value: string | number
}

interface ColumnFilter {
  key: string
  label: string
  options: FilterOption[]
  placeholder?: string
}

interface ColumnVisibilityOption {
  key: string
  label: string
  disabled?: boolean
}

const isSameStringArray = (left: string[], right: string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index])

interface DataTableProps<T = Record<string, unknown>>
  extends Omit<TableProps<T>, "columns" | "onChange"> {
  columns: ColumnType<T>[]
  data: T[]
  loading?: boolean
  showActions?: boolean
  actionButtons?: ActionButton<T>[]
  onEdit?: (record: T) => void
  onDelete?: (record: T) => void
  onView?: (record: T) => void
  actionColumnWidth?: number
  actionColumnTitle?: string
  emptyText?: string
  // Tính năng search
  showSearch?: boolean
  searchPlaceholder?: string
  searchableColumns?: string[] // Các column có thể search
  // Tính năng filter
  showFilters?: boolean
  columnFilters?: ColumnFilter[]
  // Tính năng ẩn / hiện cột
  showColumnVisibility?: boolean
  columnVisibilityOptions?: ColumnVisibilityOption[]
  columnVisibilityStorageKey?: string
  defaultVisibleColumnKeys?: string[]
  columnVisibilityButtonText?: string
  // Pagination config
  paginationConfig?: {
    current?: number
    pageSize?: number
    total?: number
    showSizeChanger?: boolean
    showQuickJumper?: boolean
    showTotal?: (total: number, range: [number, number]) => string
  }
  // Tính năng STT (Số thứ tự)
  showSTT?: boolean // Mặc định là true
  // Callbacks
  onChange?: (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<T> | SorterResult<T>[],
    extra: { currentDataSource: T[]; action: "paginate" | "sort" | "filter" }
  ) => void
}

/**
 * Component DataTable tái sử dụng với đầy đủ tính năng
 * Tích hợp sẵn các action buttons (Edit, Delete, View)
 * Hỗ trợ search, filter, pagination, sorting
 * Responsive và có thể tùy chỉnh hoàn toàn
 */
const DataTable = <T extends object>({
  columns,
  data,
  loading = false,
  showActions = true,
  actionButtons = [],
  onEdit,
  onDelete,
  onView,
  actionColumnWidth = 120,
  actionColumnTitle = "Thao tác",
  emptyText = "Không có dữ liệu",
  showSearch = false,
  searchPlaceholder = "Tìm kiếm...",
  searchableColumns = [],
  showFilters = false,
  columnFilters = [],
  showColumnVisibility = false,
  columnVisibilityOptions,
  columnVisibilityStorageKey,
  defaultVisibleColumnKeys,
  columnVisibilityButtonText = "Cột",
  paginationConfig = {
    pageSize: 10,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mục`,
  },
  showSTT = true, // Mặc định hiển thị STT
  onChange,
  ...tableProps
}: DataTableProps<T>) => {
  // Kiểm tra đang ở mobile hay desktop để quyết định có ghim cột thao tác không
  const isMobile = useMobile()

  // State cho search và filter
  const [searchText, setSearchText] = useState("")
  const [filterValues, setFilterValues] = useState<
    Record<string, string | number | undefined>
  >({})
  
  // Dùng để giả lập double click trên mobile
  const lastClickRef = React.useRef<{ time: number; record: T } | null>(null)

  const getColumnKey = React.useCallback((column: ColumnType<T>, index: number) => {
    if (column.key !== undefined && column.key !== null) return String(column.key)
    if (column.dataIndex !== undefined && column.dataIndex !== null) return String(column.dataIndex)
    return `column-${index}`
  }, [])

  const resolvedColumnVisibilityOptions = useMemo<ColumnVisibilityOption[]>(() => {
    const columnLabels = new Map(
      (columnVisibilityOptions || []).map((option) => [option.key, option])
    )

    return columns.map((column, index) => {
      const key = getColumnKey(column, index)
      const configuredOption = columnLabels.get(key)

      if (configuredOption) return configuredOption

      return {
        key,
        label: typeof column.title === "string" ? column.title : key,
      }
    })
  }, [columnVisibilityOptions, columns, getColumnKey])

  const allColumnVisibilityKeys = useMemo(
    () => resolvedColumnVisibilityOptions.map((option) => option.key),
    [resolvedColumnVisibilityOptions]
  )

  const resolvedDefaultVisibleColumnKeys = useMemo(
    () => defaultVisibleColumnKeys || allColumnVisibilityKeys,
    [allColumnVisibilityKeys, defaultVisibleColumnKeys]
  )

  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => {
    if (!showColumnVisibility) return resolvedDefaultVisibleColumnKeys
    if (!columnVisibilityStorageKey) return resolvedDefaultVisibleColumnKeys

    try {
      const savedValue = localStorage.getItem(columnVisibilityStorageKey)
      if (!savedValue) return resolvedDefaultVisibleColumnKeys

      const parsedValue = JSON.parse(savedValue)
      if (!Array.isArray(parsedValue)) return resolvedDefaultVisibleColumnKeys

      const validKeys = parsedValue.filter((key) =>
        allColumnVisibilityKeys.includes(String(key))
      ).map(String)

      return validKeys.length > 0 ? validKeys : resolvedDefaultVisibleColumnKeys
    } catch {
      return resolvedDefaultVisibleColumnKeys
    }
  })

  React.useEffect(() => {
    if (!showColumnVisibility) return

    setVisibleColumnKeys((currentKeys) => {
      const validKeys = currentKeys.filter((key) => allColumnVisibilityKeys.includes(key))
      const nextKeys = validKeys.length > 0 ? validKeys : resolvedDefaultVisibleColumnKeys
      return isSameStringArray(currentKeys, nextKeys) ? currentKeys : nextKeys
    })
  }, [allColumnVisibilityKeys, resolvedDefaultVisibleColumnKeys, showColumnVisibility])

  React.useEffect(() => {
    if (!showColumnVisibility || !columnVisibilityStorageKey) return

    localStorage.setItem(columnVisibilityStorageKey, JSON.stringify(visibleColumnKeys))
  }, [columnVisibilityStorageKey, showColumnVisibility, visibleColumnKeys])

  // Lọc dữ liệu dựa trên search text
  const filteredData = useMemo(() => {
    let filtered = [...data]

    // Áp dụng search
    if (searchText && searchableColumns.length > 0) {
      filtered = filtered.filter((item) =>
        searchableColumns.some((column) => {
          const value = (item as Record<string, unknown>)[column]
          return (
            value &&
            value.toString().toLowerCase().includes(searchText.toLowerCase())
          )
        })
      )
    }

    // Áp dụng column filters
    Object.entries(filterValues).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        filtered = filtered.filter((item) => {
          const itemValue = (item as Record<string, unknown>)[key]
          return itemValue === value
        })
      }
    })

    return filtered
  }, [data, searchText, searchableColumns, filterValues])

  // Tạo default action buttons
  const defaultActionButtons: ActionButton<T>[] = []

  if (onView) {
    defaultActionButtons.push({
      key: "view",
      icon: <EyeOutlined />,
      tooltip: "Xem chi tiết",
      onClick: onView,
      type: "link",
    })
  }

  if (onEdit) {
    defaultActionButtons.push({
      key: "edit",
      icon: <EditOutlined />,
      tooltip: "Chỉnh sửa",
      onClick: onEdit,
      type: "link",
    })
  }

  if (onDelete) {
    defaultActionButtons.push({
      key: "delete",
      icon: <DeleteOutlined />,
      tooltip: "Xóa",
      onClick: onDelete,
      type: "link",
      danger: true,
    })
  }

  // Kết hợp default và custom action buttons
  const allActionButtons = [...defaultActionButtons, ...actionButtons]

  // Tạo action column - chỉ fixed right trên desktop, mobile scroll tự do
  const actionColumn = {
    title: actionColumnTitle,
    key: "actions",
    width: actionColumnWidth,
    // Ghim cột thao tác bên phải chỉ khi desktop
    fixed: isMobile ? undefined : ('right' as const),
    render: (_: unknown, record: T) => (
      <Space size='small'>
        {allActionButtons.map((button) => {
          const isDisabled = button.disabled ? button.disabled(record) : false

          const buttonElement = (
            <Button
              key={button.key}
              type={button.type || "link"}
              icon={button.icon}
              size='small'
              danger={button.danger}
              disabled={isDisabled}
              onClick={() => !isDisabled && button.onClick(record)}
            />
          )

          return button.tooltip ? (
            <Tooltip key={button.key} title={button.tooltip}>
              {buttonElement}
            </Tooltip>
          ) : (
            buttonElement
          )
        })}
      </Space>
    ),
  }

  // Tạo cột STT (Số thứ tự)
  const sttColumn: ColumnType<T> = {
    title: 'STT',
    key: 'stt',
    width: 60,
    align: 'center',
    render: (_: unknown, __: T, index: number) => {
      // Lấy current page và pageSize từ pagination
      const currentPage = (tableProps.pagination as TablePaginationConfig)?.current || 1;
      const pageSize = (tableProps.pagination as TablePaginationConfig)?.pageSize || paginationConfig.pageSize || 10;
      const stt = (currentPage - 1) * pageSize + index + 1;
      return <div className='font-medium text-gray-600'>{stt}</div>;
    },
  };

  /**
   * Helper function để wrap column render với ellipsis và tooltip
   * - Tự động hiển thị ... khi text quá dài
   * - Hiển thị tooltip khi hover để xem full content
   * - Tự động thêm width mặc định 150px nếu column chưa có width
   */
  const wrapColumnWithEllipsis = (column: ColumnType<T>): ColumnType<T> => {
    // Không wrap cho cột actions và STT
    if (column.key === 'actions' || column.key === 'stt') {
      return column;
    }

    const originalRender = column.render;

    // Tự động thêm width mặc định nếu chưa có
    const defaultWidth = column.width || 150;

    return {
      ...column,
      width: defaultWidth, // Thêm width mặc định cho tất cả cột
      ellipsis: {
        showTitle: false, // Tắt title mặc định của antd
      },
      render: (value: unknown, record: T, index: number) => {
        // Lấy giá trị hiển thị
        let displayValue: React.ReactNode;
        
        if (originalRender) {
          // Nếu có custom render, sử dụng nó
          displayValue = originalRender(value, record, index) as React.ReactNode;
        } else {
          // Nếu không có custom render, hiển thị giá trị trực tiếp
          displayValue = value as React.ReactNode;
        }

        // Chuyển đổi displayValue thành string để hiển thị trong tooltip
        const tooltipContent = typeof displayValue === 'string' || typeof displayValue === 'number'
          ? String(displayValue)
          : typeof value === 'string' || typeof value === 'number'
          ? String(value)
          : '';

        // Nếu không có nội dung, không cần tooltip
        if (!tooltipContent || tooltipContent === 'N/A' || tooltipContent === '') {
          return displayValue;
        }

        // Wrap với Tooltip
        return (
          <Tooltip title={tooltipContent} placement="topLeft">
            <div style={{ 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}>
              {displayValue}
            </div>
          </Tooltip>
        );
      },
    };
  };

  const visibleSourceColumns = showColumnVisibility
    ? columns.filter((column, index) => visibleColumnKeys.includes(getColumnKey(column, index)))
    : columns

  // Kết hợp columns: STT + columns (wrapped with ellipsis) + action column
  let finalColumns = visibleSourceColumns.map(wrapColumnWithEllipsis);
  
  // Thêm STT column ở đầu nếu showSTT = true
  if (showSTT) {
    finalColumns = [sttColumn, ...finalColumns];
  }
  
  // Thêm action column ở cuối nếu cần
  if (showActions && allActionButtons.length > 0) {
    finalColumns = [...finalColumns, actionColumn];
  }

  // Handle filter change
  const handleFilterChange = (
    key: string,
    value: string | number | undefined
  ) => {
    setFilterValues((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // Handle table change (pagination, sorting, filtering)
  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<T> | SorterResult<T>[],
    extra: { currentDataSource: T[]; action: "paginate" | "sort" | "filter" }
  ) => {
    if (onChange) {
      onChange(pagination, filters, sorter, extra)
    }
  }

  return (
    <div className='data-table-wrapper'>
      {/* Search và Filter Controls */}
      {(showSearch || showFilters || showColumnVisibility) && (
        <Card className='mb-4' size='small'>
          <Space wrap>
            {/* Search Input */}
            {showSearch && (
              <Search
                placeholder={searchPlaceholder}
                allowClear
                style={{ width: 300 }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                prefix={<SearchOutlined />}
              />
            )}

            {/* Column Filters */}
            {showFilters &&
              columnFilters.map((filter) => (
                <Select
                  key={filter.key}
                  placeholder={filter.placeholder || `Lọc ${filter.label}`}
                  allowClear
                  style={{ width: 200 }}
                  value={filterValues[filter.key]}
                  onChange={(value) => handleFilterChange(filter.key, value)}
                >
                  {filter.options.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              ))}

            {showColumnVisibility && (
              <Popover
                trigger="click"
                placement="bottomRight"
                title="Ẩn / hiện cột"
                content={
                  <div style={{ minWidth: 190 }}>
                    <Checkbox.Group
                      style={{ display: "flex", flexDirection: "column", gap: 8 }}
                      options={resolvedColumnVisibilityOptions.map((option) => ({
                        label: option.label,
                        value: option.key,
                        disabled: option.disabled,
                      }))}
                      value={visibleColumnKeys}
                      onChange={(checkedValues) => {
                        const nextKeys = checkedValues.map(String)
                        if (nextKeys.length === 0) return
                        setVisibleColumnKeys(nextKeys)
                      }}
                    />
                    <Button
                      type="link"
                      size="small"
                      style={{ marginTop: 8, padding: 0 }}
                      onClick={() => setVisibleColumnKeys(allColumnVisibilityKeys)}
                    >
                      Hiện tất cả
                    </Button>
                  </div>
                }
              >
                <Button icon={<SettingOutlined />}>
                  {columnVisibilityButtonText}
                </Button>
              </Popover>
            )}
          </Space>
        </Card>
      )}

      {/* Table */}
      {loading ? (
        <LoadingSpinner tip='Đang tải dữ liệu...'>
          <Table
            size="small"
            columns={finalColumns}
            dataSource={[]}
            pagination={false}
            locale={{ emptyText }}
            {...tableProps}
          />
        </LoadingSpinner>
      ) : (
        <Table
          {...tableProps}
          size="small"
          columns={finalColumns}
          dataSource={filteredData}
          locale={{ emptyText }}
          scroll={{ x: "max-content" }}
          pagination={tableProps.pagination === false ? false : (() => {
            // Hợp nhất pagination từ tableProps và paginationConfig riêng
            const basePagination = typeof tableProps.pagination === 'object' ? tableProps.pagination : {};
            const mergedConfig = {
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total: number, range: [number, number]) => `${range[0]}-${range[1]} của ${total} mục`,
              ...basePagination,
              ...paginationConfig,
            };

            return {
              ...mergedConfig,
              // Đảm bảo total luôn đúng: ưu tiên mergedConfig.total (từ API)
              // Chỉ dùng filteredData.length khi không có total từ bên ngoài
              total: typeof mergedConfig.total === 'number'
                ? mergedConfig.total
                : filteredData.length,
            };
          })()}
          onChange={handleTableChange}
          onRow={(record) => {
            const externalProps = tableProps.onRow ? tableProps.onRow(record) : {};
            
            return {
              ...externalProps,
              onClick: (event) => {
                if (externalProps.onClick) externalProps.onClick(event);

                // Giả lập double click cho mobile
                if (isMobile && onView) {
                  const now = Date.now();
                  const isFunctionalElement = (event.target as HTMLElement).closest('button, a, .ant-dropdown-trigger, .ant-select, .ant-checkbox-wrapper');
                  
                  if (!isFunctionalElement) {
                    if (lastClickRef.current && 
                        lastClickRef.current.record === record && 
                        (now - lastClickRef.current.time) < 300) {
                      
                      // Phát hiện double tap
                      onView(record);
                      lastClickRef.current = null;
                    } else {
                      lastClickRef.current = { time: now, record };
                      // Tự động xóa sau 300ms
                      setTimeout(() => {
                        if (lastClickRef.current?.time === now) {
                          lastClickRef.current = null;
                        }
                      }, 300);
                    }
                  }
                }
              },
              onDoubleClick: (event) => {
                // Gọi handler bên ngoài nếu có
                if (externalProps.onDoubleClick) {
                  externalProps.onDoubleClick(event);
                }
                
                // Logic mặc định: Nhấn đúp để xem chi tiết (chỉ dùng cho Desktop)
                const target = event.target as HTMLElement;
                const isFunctionalElement = target.closest('button, a, .ant-dropdown-trigger, .ant-select, .ant-checkbox-wrapper');
                
                if (onView && !isFunctionalElement) {
                  onView(record);
                }
              },
              style: { 
                cursor: onView ? 'pointer' : 'default',
                ...externalProps.style 
              }
            };
          }}
        />
      )}
    </div>
  )
}

export default DataTable
export type { ActionButton, DataTableProps }
