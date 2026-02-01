import React from "react"
import { Select, Form, Tooltip } from "antd"
import { SelectProps, DefaultOptionType } from "antd/es/select"

// Interface cho option của ComboBox
interface ComboBoxOption {
  value: string | number
  label: string
  disabled?: boolean
  scientific_name?: string
  unit_name?: string
  [key: string]: unknown
}

// Interface cho props của ComboBox
interface ComboBoxProps extends Omit<SelectProps, "options" | "children"> {
  // Props cho static options
  options?: ComboBoxOption[]

  // Props cho async data
  data?: ComboBoxOption[]
  isLoading?: boolean
  isFetching?: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  fetchNextPage?: () => void
  onSearch?: (value: string) => void

  label?: string
  required?: boolean
  enableLoadMore?: boolean
  searchDebounceMs?: number
  className?: string
  style?: React.CSSProperties
  onSelectionChange?: (
    value: string | number | (string | number)[],
    option: ComboBoxOption | ComboBoxOption[]
  ) => void
  // Form hooks/props
  name?: string
  rules?: any[]
  tooltip?: string
  extra?: React.ReactNode
  help?: React.ReactNode
  validateStatus?: "" | "success" | "warning" | "error" | "validating" | undefined
  noFormItem?: boolean
}

/**
 * Component ComboBox - Phiên bản linh hoạt có thể nhận data từ bên ngoài
 * Có thể sử dụng như một component Ant Design Select thông thường
 * Hỗ trợ cả static options và async data loading từ hook truyền từ ngoài vào
 */
function ComboBox({
  // Static options
  options: staticOptions = [],

  // Async data props
  data: externalData,
  isLoading,
  isFetching,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  onSearch: externalOnSearch,

  label,
  required = false,
  placeholder,
  allowClear = true,
  showSearch = true,
  filterOption,
  enableLoadMore = true,
  searchDebounceMs = 300, 
  mode,
  maxTagCount,
  maxTagTextLength,
  className,
  style,
  size = "middle",
  onSelectionChange,
  value,
  onChange,
  name,
  rules,
  tooltip,
  extra,
  help,
  validateStatus,
  noFormItem = false,
  ...selectProps
}: ComboBoxProps) {
  // Xác định filterOption: Nếu không truyền vào, tự động tắt (false) khi có search async
  const finalFilterOption = filterOption !== undefined ? filterOption : (externalOnSearch ? false : true);

  // State nội bộ để quản lý việc hiển thị chữ ngay lập tức khi gõ (Uncontrolled-like behavior)
  const [innerSearchValue, setInnerSearchValue] = React.useState<string | undefined>(
    selectProps.searchValue as string
  )

  // Đồng bộ lại khi cha muốn chủ động thay đổi (ví dụ khi reset form)
  React.useEffect(() => {
    if (selectProps.searchValue !== undefined) {
      setInnerSearchValue(selectProps.searchValue as string)
    }
  }, [selectProps.searchValue])

  // Sử dụng data từ bên ngoài nếu có, ngược lại dùng static options
  const displayOptions = externalData || staticOptions


  // Debounce timer ref
  const searchTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // Handle search: Cập nhật UI ngay lập tức và báo cho cha sau một khoảng delay (debounce)
  const handleSearch = React.useCallback(
    (value: string) => {
      // 1. Cập nhật state nội bộ ngay lập tức để UI không bị lag
      setInnerSearchValue(value)
      
      // 2. Báo cho component cha để filter/gọi API với debounce
      if (externalOnSearch) {
        // Xóa timer cũ nếu có
        if (searchTimerRef.current) {
          clearTimeout(searchTimerRef.current)
        }
        
        // Thiết lập timer mới
        searchTimerRef.current = setTimeout(() => {
          externalOnSearch(value);
        }, searchDebounceMs);
      }
    },
    [externalOnSearch, searchDebounceMs]
  )

  // Cleanup khi unmount
  React.useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current)
      }
    }
  }, [])

  // Function để load more data
  const loadMore = React.useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && fetchNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const handlePopupScroll = React.useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { target } = e
      const element = target as HTMLDivElement

      if (
        enableLoadMore &&
        hasNextPage &&
        !isFetching &&
        !isFetchingNextPage &&
        element.scrollTop + element.offsetHeight >= element.scrollHeight - 5
      ) {
        loadMore()
      }
    },
    [enableLoadMore, hasNextPage, isFetching, isFetchingNextPage, loadMore]
  )

  // Xử lý change
  const handleChange = React.useCallback(
    (
      newValue: string | number | (string | number)[],
      option?: DefaultOptionType | DefaultOptionType[]
    ) => {
      // Gọi onChange của Select
      if (onChange) {
        onChange(newValue as string | number, option)
      }

      // Gọi onSelectionChange tùy chỉnh nếu có
      if (onSelectionChange) {
        onSelectionChange(newValue, option as ComboBoxOption | ComboBoxOption[])
      }
    },
    [onChange, onSelectionChange]
  )

  // Đồng bộ innerSearchValue khi value prop thay đổi thành undefined (clear)
  React.useEffect(() => {
    if (value === undefined || value === null) {
      setInnerSearchValue(undefined)
    }
  }, [value])

  // Ép kiểu displayOptions thành DefaultOptionType[]
  const mappedOptions = displayOptions as DefaultOptionType[]

  // Xử lý giá trị để hiển thị placeholder khi cần thiết
  const displayValue =
    value === 0 || value === undefined || value === null ? undefined : value

  // Render component
  const selectComponent = (
    <Select
      {...selectProps}
      searchValue={innerSearchValue}
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      allowClear={allowClear}
      showSearch={showSearch}
      filterOption={finalFilterOption}
      onSearch={handleSearch}
      onPopupScroll={handlePopupScroll}
      loading={isLoading || isFetching}
      options={mappedOptions}
      mode={mode}
      maxTagCount={maxTagCount}
      maxTagTextLength={maxTagTextLength}
      optionRender={(option) => {
        const data = option.data as ComboBoxOption
        // Nếu có tên khoa học hoặc đơn vị tính thì hiển thị Tooltip khi hover vào item trong dropdown
        if (data?.scientific_name || data?.unit_name) {
          return (
            <Tooltip 
              title={
                <div className="flex flex-col py-1" style={{ fontSize: '11px' }}>
                  {data.scientific_name && (
                    <>
                      <div className="text-[#bfbfbf] mb-0.5">Tên sản phẩm:</div>
                      <div className="text-white font-medium mb-1 leading-tight">{data.scientific_name}</div>
                    </>
                  )}
                  {data.unit_name && (
                    <div className="text-[#bfbfbf]">
                      Đơn vị tính: <span className="text-white">{data.unit_name}</span>
                    </div>
                  )}
                </div>
              }
              placement="right"
              mouseEnterDelay={0.5}
            >
              <div style={{ width: '100%' }}>{option.label}</div>
            </Tooltip>
          )
        }
        return option.label
      }}
      className={className}
      style={style}
      size={size}
      popupClassName="combobox-dropdown-wrap-text"
      notFoundContent={
        isLoading ? (
          <div style={{ textAlign: "center" }}>Đang tải...</div>
        ) : (
          "Không có dữ liệu"
        )
      }
    />
  )

  // Nếu có label hoặc name, wrap trong Form.Item để Ant Design Form quản lý
  if (!noFormItem && (label || name)) {
    return (
      <Form.Item 
        label={label} 
        name={name}
        rules={rules}
        tooltip={tooltip}
        extra={extra}
        help={help}
        validateStatus={validateStatus}
        required={required} 
        className={className}
      >
        {selectComponent}
      </Form.Item>
    )
  }

  return selectComponent
}

export default ComboBox
export type { ComboBoxProps, ComboBoxOption }
