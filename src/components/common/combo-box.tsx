import React from "react"
import { Select, Form } from "antd"
import { SelectProps, DefaultOptionType } from "antd/es/select"
import { useComboBoxQuery } from "@/hooks/use-combo-box-query"
import { useDebounceState } from "@/hooks/use-debounce-state"

// Interface cho option của ComboBox
interface ComboBoxOption {
  value: string | number
  label: string
  disabled?: boolean
  [key: string]: unknown
}

// Interface cho API response
interface ApiResponse {
  data: ComboBoxOption[]
  total: number
  hasMore: boolean
  nextPage?: number
}

// Interface cho API function
type ApiFunction = (params: {
  page: number
  limit: number
  search?: string
  [key: string]: unknown
}) => Promise<ApiResponse>

// Interface cho props của ComboBox (không cần React Hook Form)
interface ComboBoxProps
  extends Omit<
    SelectProps<string | number, DefaultOptionType>,
    "filterOption" | "options"
  > {
  // Props cho data source
  options?: ComboBoxOption[]
  apiFunction?: ApiFunction
  queryKey?: (string | number | boolean | undefined)[]

  // Props UI
  label?: string
  required?: boolean
  showSearch?: boolean
  filterOption?: boolean

  // Props cho async loading
  pageSize?: number
  enableLoadMore?: boolean
  searchDebounceMs?: number

  // Props cho multiple selection
  mode?: "multiple" | "tags"
  maxTagCount?: number | "responsive"
  maxTagTextLength?: number

  // Props cho field mapping
  valueField?: string
  labelField?: string

  // Props cho styling
  className?: string
  style?: React.CSSProperties
  size?: "large" | "middle" | "small"

  // Props cho query configuration
  enabled?: boolean
  staleTime?: number
  gcTime?: number

  // Event handlers
  onSelectionChange?: (
    value: string | number | (string | number)[],
    option: ComboBoxOption | ComboBoxOption[]
  ) => void
  onLoadError?: (error: Error) => void
}

/**
 * Component ComboBox - Phiên bản đơn giản của FormComboBox không cần React Hook Form
 * Có thể sử dụng như một component Ant Design Select thông thường
 * Hỗ trợ cả static options và async data loading
 */
function ComboBox({
  options: staticOptions = [],
  apiFunction,
  queryKey = [],
  label,
  required = false,
  placeholder,
  allowClear = true,
  showSearch = true,
  filterOption = true,
  pageSize = 20,
  enableLoadMore = true,
  searchDebounceMs = 500,
  mode,
  maxTagCount,
  maxTagTextLength,
  valueField = "value",
  labelField = "label",
  className,
  style,
  size = "middle",
  enabled = true,
  staleTime = 5 * 60 * 1000,
  gcTime = 10 * 60 * 1000,
  onSelectionChange,
  onLoadError,
  value,
  onChange,
  ...selectProps
}: ComboBoxProps) {
  // State cho search
  const [searchTerm, setSearchTerm] = useDebounceState<string>(
    "",
    searchDebounceMs
  )

  // Luôn enable query khi có apiFunction (không cần check searchTerm)
  const isQueryEnabled = enabled && !!apiFunction

  // Log để debug
  console.log("ComboBox render - Search term:", searchTerm)
  console.log("ComboBox render - Query enabled:", isQueryEnabled)

  // Sử dụng useMemo để tránh re-render không cần thiết
  const memoizedQueryKey = React.useMemo(() => {
    return [...queryKey, searchTerm || ""]
  }, [queryKey, searchTerm])

  // Log để debug
  console.log("Memoized query key:", memoizedQueryKey)

  // Sử dụng query hook nếu có apiFunction
  const {
    options: queryOptions,
    isLoading,
    error,
    isFetching,
    isFetchingNextPage, // Thêm isFetchingNextPage
    hasNextPage,
    loadMore,
  } = useComboBoxQuery({
    apiFunction: apiFunction!,
    queryKey: memoizedQueryKey,
    pageSize,
    searchValue: searchTerm || "",
    enabled: isQueryEnabled,
    staleTime,
    gcTime,
    valueField,
    labelField,
  })

  // Xử lý error
  React.useEffect(() => {
    if (error && onLoadError) {
      onLoadError(error as Error)
    }
  }, [error, onLoadError])

  // Xác định options để hiển thị
  const displayOptions = apiFunction ? queryOptions : staticOptions

  // Log để debug
  console.log("Display options:", displayOptions)
  console.log("Is apiFunction:", !!apiFunction)

  // Ép kiểu displayOptions thành DefaultOptionType[]
  const mappedOptions = displayOptions as DefaultOptionType[]

  // Log để debug
  console.log("Final mapped options:", mappedOptions)
  console.log("Mapped options length:", mappedOptions.length)

  // Xử lý search
  const handleSearch = React.useCallback(
    (value: string) => {
      setSearchTerm(value)
    },
    [setSearchTerm]
  )

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
        apiFunction &&
        hasNextPage &&
        !isFetching &&
        !isFetchingNextPage &&
        element.scrollTop + element.offsetHeight >= element.scrollHeight - 5
      ) {
        console.log("Triggering load more...")
        loadMore()
      }
    },
    [
      enableLoadMore,
      apiFunction,
      hasNextPage,
      isFetching,
      isFetchingNextPage,
      loadMore,
    ]
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

  // Render component
  const selectComponent = (
    <Select
      {...selectProps}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      allowClear={allowClear}
      showSearch={showSearch}
      filterOption={filterOption}
      onSearch={showSearch ? handleSearch : undefined}
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
export type { ComboBoxProps, ComboBoxOption, ApiResponse, ApiFunction }
