import React from "react"
import { Select, Form } from "antd"
import { SelectProps, DefaultOptionType } from "antd/es/select"
import { useProductSearch, ProductSearchResponse } from "@/queries/product" // Sử dụng hook mới
import { useDebounceState } from "@/hooks/use-debounce-state"

// Interface cho option của ComboBox
interface ComboBoxOption {
  value: string | number
  label: string
  disabled?: boolean
  [key: string]: unknown
}

// Interface cho props của ComboBox
interface ComboBoxProps extends Omit<SelectProps, "options" | "children"> {
  options?: ComboBoxOption[]
  queryKey?: (string | number | boolean | undefined)[]
  label?: string
  required?: boolean
  pageSize?: number
  enableLoadMore?: boolean
  searchDebounceMs?: number
  className?: string
  style?: React.CSSProperties
  enabled?: boolean
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
  className,
  style,
  size = "middle",
  enabled = true,
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

  // Log để debug
  console.log("ComboBox render - Search term:", searchTerm)

  // Sử dụng useMemo để tránh re-render không cần thiết
  const memoizedQueryKey = React.useMemo(() => {
    return [...queryKey, searchTerm || ""]
  }, [queryKey, searchTerm])

  // Log để debug
  console.log("Memoized query key:", memoizedQueryKey)

  // Sử dụng hook mới để search sản phẩm
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useProductSearch(searchTerm, pageSize, enabled)

  // Flatten data từ tất cả pages
  const queryOptions = React.useMemo(() => {
    if (!data?.pages) {
      console.log("No data pages found")
      return []
    }

    // Log để debug
    console.log("Data pages:", data.pages)

    const result = data.pages.flatMap((page: ProductSearchResponse) => {
      // Log để debug
      console.log("Processing page:", page)

      if (!page || !page.data) {
        console.log("Page is empty or invalid")
        return []
      }

      console.log("Page data:", page.data)
      return page.data
    })

    // Log để debug
    console.log("Flattened result:", result)
    console.log("Flattened result length:", result.length)

    return result
  }, [data?.pages])

  // Log để debug
  console.log("Query options:", queryOptions)
  console.log("Query options length:", queryOptions.length)

  // Function để load more data
  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  // Xử lý lỗi
  React.useEffect(() => {
    if (isError && error && onLoadError) {
      onLoadError(error)
    }
  }, [isError, error, onLoadError])

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

  // Xác định options để hiển thị
  const displayOptions = queryOptions.length > 0 ? queryOptions : staticOptions

  // Log để debug
  console.log("Display options:", displayOptions)
  console.log("Query options length:", queryOptions.length)
  console.log("Static options length:", staticOptions.length)
  console.log("Is using query options:", queryOptions.length > 0)

  // Ép kiểu displayOptions thành DefaultOptionType[]
  const mappedOptions = displayOptions as DefaultOptionType[]

  // Log để debug
  console.log("Final mapped options:", mappedOptions)
  console.log("Mapped options length:", mappedOptions.length)
  console.log("Mapped options type:", typeof mappedOptions)

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
export type { ComboBoxProps, ComboBoxOption }
