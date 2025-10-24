import React, { useState, useCallback } from "react"
import { Select, Form, Spin } from "antd"
import { Controller, Control, FieldPath, FieldValues } from "react-hook-form"
import { SelectProps, DefaultOptionType } from "antd/es/select"
import { useComboBoxQuery } from "@/hooks/use-combo-box-query"
import { useDebounceState } from "@/hooks/use-debounce-state"

// Interface cho option của ComboBox
interface ComboBoxOption {
  value: string | number
  label: string
  disabled?: boolean
  [key: string]: unknown // Cho phép các thuộc tính tùy chỉnh khác
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

// Interface cho props của FormComboBox
interface FormComboBoxProps<T extends FieldValues>
  extends Omit<
    SelectProps<string | number, DefaultOptionType>,
    "value" | "onChange" | "onBlur" | "filterOption" | "options"
  > {
  // Props bắt buộc
  name: FieldPath<T>
  control: Control<T>

  // Props cho data source - có thể là static options hoặc API function
  options?: ComboBoxOption[] // Cho trường hợp static options
  apiFunction?: ApiFunction // Cho trường hợp async data
  queryKey?: (string | number | boolean | undefined)[] // Query key cho TanStack Query

  // Props tùy chọn
  label?: string
  required?: boolean
  placeholder?: string
  allowClear?: boolean
  showSearch?: boolean
  filterOption?: boolean | ((input: string, option?: ComboBoxOption) => boolean)

  // Props cho pagination (chỉ áp dụng khi có apiFunction)
  pageSize?: number // Số item mỗi lần load
  enableLoadMore?: boolean // Bật/tắt load more
  searchDebounceMs?: number // Thời gian debounce cho search

  // Props cho multi-select
  mode?: "multiple" | "tags"
  maxTagCount?: number | "responsive"
  maxTagTextLength?: number

  // Props cho tùy chỉnh field mapping
  valueField?: string // Mặc định là 'value'
  labelField?: string // Mặc định là 'label'

  // Props cho validation
  rules?: {
    required?: boolean | string
    min?: number
    max?: number
    pattern?: RegExp
    validate?: (
      value: string | number | (string | number)[]
    ) => boolean | string
  }

  // Props cho styling
  className?: string
  style?: React.CSSProperties
  size?: "large" | "middle" | "small"

  // Props cho TanStack Query
  enabled?: boolean // Bật/tắt query
  staleTime?: number // Thời gian cache
  gcTime?: number // Thời gian garbage collection

  // Callback functions
  onSelectionChange?: (
    value: string | number | (string | number)[],
    option: ComboBoxOption | ComboBoxOption[]
  ) => void
  onLoadError?: (error: Error) => void // Chỉ áp dụng khi có apiFunction
}

/**
 * Component FormComboBox tái sử dụng cho React Hook Form
 * Hỗ trợ cả static options và async data loading từ API
 * Tích hợp với Ant Design Select component
 */
function FormComboBox<T extends FieldValues>({
  name,
  control,
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
  searchDebounceMs = 300,
  mode,
  maxTagCount,
  maxTagTextLength,
  valueField = "value",
  labelField = "label",
  rules,
  className,
  style,
  size = "middle",
  enabled = true,
  staleTime = 5 * 60 * 1000, // 5 phút
  gcTime = 10 * 60 * 1000, // 10 phút
  onSelectionChange,
  onLoadError,
  ...selectProps
}: FormComboBoxProps<T>) {
  // State cho search value
  const [searchValue, setSearchValue] = useState("")

  // Debounce search value để tránh gọi API quá nhiều
  const [debouncedSearchValue] = useDebounceState(searchValue, searchDebounceMs)

  // Kiểm tra xem có sử dụng API hay không
  const isAsyncMode = Boolean(apiFunction)

  // Sử dụng TanStack Query hook cho async mode
  const {
    options: queryOptions,
    total,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    loadMore,
    isError,
    error,
  } = useComboBoxQuery({
    apiFunction: apiFunction!,
    queryKey: [...queryKey, name],
    pageSize,
    searchValue: debouncedSearchValue || "",
    enabled: isAsyncMode && enabled,
    staleTime,
    gcTime,
    valueField,
    labelField,
  })

  // Chọn options phù hợp (static hoặc từ query)
  const finalOptions = isAsyncMode ? queryOptions : staticOptions

  // Xử lý validation rules
  const validationRules = {
    required: required
      ? typeof required === "string"
        ? required
        : `${label || "Trường này"} là bắt buộc`
      : false,
    ...rules,
  }

  // Handle search
  const handleSearch = useCallback((value: string) => {
    setSearchValue(value)
  }, [])

  // Handle scroll to load more cho async mode
  const handlePopupScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (!isAsyncMode || !enableLoadMore) return

      const { target } = e
      const element = target as HTMLDivElement

      if (!isFetchingNextPage && hasNextPage) {
        // Kiểm tra nếu scroll gần đến cuối (90% chiều cao)
        const threshold = 0.9
        const scrollPercentage =
          (element.scrollTop + element.clientHeight) / element.scrollHeight

        if (scrollPercentage >= threshold) {
          loadMore()
        }
      }
    },
    [isAsyncMode, enableLoadMore, isFetchingNextPage, hasNextPage, loadMore]
  )

  // Xử lý filter option cho static mode
  const handleFilterOption = React.useMemo(() => {
    if (isAsyncMode) {
      // Nếu sử dụng API, không cần filter local vì đã filter trên server
      return false
    }

    if (typeof filterOption === "function") {
      return (input: string, option?: DefaultOptionType) => {
        const optionData = staticOptions.find(
          (opt) => opt[valueField] === option?.value
        )
        return optionData ? filterOption(input, optionData) : false
      }
    }

    if (filterOption === true) {
      return (input: string, option?: DefaultOptionType) => {
        const optionData = staticOptions.find(
          (opt) => opt[valueField] === option?.value
        )
        return optionData
          ? String(optionData[labelField])
              .toLowerCase()
              .includes(input.toLowerCase())
          : false
      }
    }

    return filterOption
  }, [isAsyncMode, filterOption, staticOptions, valueField, labelField])

  // Render dropdown with loading indicator cho async mode
  const dropdownRender = useCallback(
    (menu: React.ReactElement) => {
      if (!isAsyncMode) return menu

      return (
        <>
          {menu}
          {isFetchingNextPage && (
            <div style={{ padding: "8px", textAlign: "center" }}>
              <Spin size='small' /> Đang tải...
            </div>
          )}
          {!isFetchingNextPage &&
            hasNextPage &&
            enableLoadMore &&
            finalOptions.length > 0 && (
              <div
                style={{ padding: "8px", textAlign: "center", color: "#999" }}
              >
                Cuộn xuống để tải thêm ({finalOptions.length}/{total})
              </div>
            )}
          {!hasNextPage && finalOptions.length > 0 && (
            <div style={{ padding: "8px", textAlign: "center", color: "#999" }}>
              Đã hiển thị tất cả ({total} mục)
            </div>
          )}
        </>
      )
    },
    [
      isAsyncMode,
      isFetchingNextPage,
      hasNextPage,
      enableLoadMore,
      finalOptions.length,
      total,
    ]
  )

  // Xử lý lỗi từ TanStack Query
  React.useEffect(() => {
    if (isError && error && onLoadError) {
      onLoadError(error as Error)
    }
  }, [isError, error, onLoadError])

  return (
    <Form.Item
      label={label}
      required={required}
      className={className}
      style={style}
      layout='vertical'
    >
      <Controller
        name={name}
        control={control}
        rules={validationRules}
        render={({
          field: { onChange, onBlur, value, ref },
          fieldState: { error },
        }) => (
          <>
            <Select
              ref={ref}
              value={value}
              onChange={(selectedValue, option) => {
                onChange(selectedValue)
                if (onSelectionChange) {
                  onSelectionChange(
                    selectedValue,
                    option as ComboBoxOption | ComboBoxOption[]
                  )
                }
              }}
              onBlur={onBlur}
              onSearch={handleSearch}
              onPopupScroll={isAsyncMode ? handlePopupScroll : undefined}
              placeholder={placeholder}
              allowClear={allowClear}
              showSearch={showSearch}
              filterOption={handleFilterOption}
              mode={mode}
              maxTagCount={maxTagCount}
              maxTagTextLength={maxTagTextLength}
              size={size}
              loading={isAsyncMode && isLoading && finalOptions.length === 0}
              status={error ? "error" : undefined}
              dropdownRender={isAsyncMode ? dropdownRender : undefined}
              notFoundContent={
                isLoading ? <Spin size='small' /> : "Không có dữ liệu"
              }
              {...selectProps}
            >
              {finalOptions.map((option) => (
                <Select.Option
                  key={String(option[valueField as keyof typeof option])}
                  value={
                    option[valueField as keyof typeof option] as string | number
                  }
                  disabled={option.disabled}
                >
                  {String(option[labelField as keyof typeof option])}
                </Select.Option>
              ))}
            </Select>
            {error && (
              <div
                style={{ color: "#ff4d4f", fontSize: "14px", marginTop: "4px" }}
              >
                {error.message}
              </div>
            )}
          </>
        )}
      />
    </Form.Item>
  )
}

export default FormComboBox
export type { FormComboBoxProps, ComboBoxOption, ApiResponse, ApiFunction }
