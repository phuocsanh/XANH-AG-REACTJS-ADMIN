import React from "react"
import { Select, Form } from "antd"
import { SelectProps, DefaultOptionType } from "antd/es/select"

// Interface cho option của ComboBox
interface ComboBoxOption {
  value: string | number
  label: string
  disabled?: boolean
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
  // searchDebounceMs?: number  // Đã loại bỏ vì không được sử dụng trong component này
  className?: string
  style?: React.CSSProperties
  onSelectionChange?: (
    value: string | number | (string | number)[],
    option: ComboBoxOption | ComboBoxOption[]
  ) => void
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
  filterOption = true,
  enableLoadMore = true,
  // searchDebounceMs = 500,  // Đã loại bỏ vì không được sử dụng trong component này
  mode,
  maxTagCount,
  maxTagTextLength,
  className,
  style,
  size = "middle",
  onSelectionChange,
  value,
  onChange,
  ...selectProps
}: ComboBoxProps) {
  // Log để debug
  console.log("ComboBox render")

  // Sử dụng data từ bên ngoài nếu có, ngược lại dùng static options
  const displayOptions = externalData || staticOptions

  // Debounce timer ref
  const searchTimerRef = React.useRef<NodeJS.Timeout | null>(null)

  // Handle search với debounce 1.5s
  const handleSearch = React.useCallback(
    (value: string) => {
      if (externalOnSearch) {
        // Clear timeout cũ nếu có
        if (searchTimerRef.current) {
          clearTimeout(searchTimerRef.current)
        }
        
        // Set timeout mới
        searchTimerRef.current = setTimeout(() => {
          externalOnSearch(value)
        }, 1500)
      }
    },
    [externalOnSearch]
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
  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage && fetchNextPage) {
      fetchNextPage()
    }
  }

  // Xử lý scroll để load more
  const handlePopupScroll = React.useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { target } = e
      const element = target as HTMLDivElement

      // Log để debug
      console.log("Scroll event:", {
        scrollTop: element.scrollTop,
        offsetHeight: element.offsetHeight,
        scrollHeight: element.scrollHeight,
        isAtBottom:
          element.scrollTop + element.offsetHeight >= element.scrollHeight - 5,
        enableLoadMore,
        hasNextPage,
        isFetching,
        isFetchingNextPage,
      })

      if (
        enableLoadMore &&
        hasNextPage &&
        !isFetching &&
        !isFetchingNextPage &&
        element.scrollTop + element.offsetHeight >= element.scrollHeight - 5
      ) {
        console.log("Triggering load more...")
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

  // Ép kiểu displayOptions thành DefaultOptionType[]
  const mappedOptions = displayOptions as DefaultOptionType[]

  // Xử lý giá trị để hiển thị placeholder khi cần thiết
  const displayValue =
    value === 0 || value === undefined || value === null ? undefined : value

  // Render component
  const selectComponent = (
    <Select
      {...selectProps}
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      allowClear={allowClear}
      showSearch={showSearch}
      filterOption={filterOption}
      onSearch={handleSearch}
      onPopupScroll={handlePopupScroll}
      loading={isLoading || isFetching}
      options={mappedOptions}
      mode={mode}
      maxTagCount={maxTagCount}
      maxTagTextLength={maxTagTextLength}
      className={className}
      style={style}
      size={size}
      notFoundContent={
        isLoading ? (
          <div style={{ textAlign: "center" }}>Đang tải...</div>
        ) : (
          "Không có dữ liệu"
        )
      }
    />
  )

  // Nếu có label, wrap trong Form.Item
  if (label) {
    return (
      <Form.Item label={label} required={required} className={className}>
        {selectComponent}
      </Form.Item>
    )
  }

  return selectComponent
}

export default ComboBox
export type { ComboBoxProps, ComboBoxOption }
