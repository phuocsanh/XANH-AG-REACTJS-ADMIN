import React, { useCallback } from "react"
import { Select, Form, Spin } from "antd"
import { Controller, Control, FieldPath, FieldValues } from "react-hook-form"
import { SelectProps, DefaultOptionType } from "antd/es/select"

// Interface cho option của ComboBox
interface ComboBoxOption {
  value: string | number | boolean
  label: string
  disabled?: boolean
  [key: string]: unknown // Cho phép các thuộc tính tùy chỉnh khác
}

// Interface cho props của FormComboBox
interface FormComboBoxProps<T extends FieldValues>
  extends Omit<
    SelectProps<string | number | boolean, DefaultOptionType>,
    "value" | "onChange" | "onBlur" | "filterOption" | "options"
  > {
  // Props bắt buộc
  name: FieldPath<T>
  control: Control<T>

  // Props cho static options
  options?: ComboBoxOption[]

  // Props cho async data (giống với ComboBox mới)
  data?: ComboBoxOption[]
  isLoading?: boolean
  isFetching?: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  fetchNextPage?: () => void
  onSearch?: (value: string) => void

  // Props tùy chọn
  label?: string
  required?: boolean
  placeholder?: string
  allowClear?: boolean
  showSearch?: boolean
  filterOption?: boolean | ((input: string, option?: ComboBoxOption) => boolean)

  // Props cho pagination
  enableLoadMore?: boolean

  // Props cho multi-select
  mode?: "multiple" | "tags"
  maxTagCount?: number | "responsive"
  maxTagTextLength?: number

  // Props cho validation
  rules?: {
    required?: boolean | string
    min?: number
    max?: number
    pattern?: RegExp
    validate?: (
      value: string | number | boolean | (string | number | boolean)[]
    ) => boolean | string
  }

  // Props cho styling
  className?: string
  style?: React.CSSProperties
  size?: "large" | "middle" | "small"

  // Callback functions
  onSelectionChange?: (
    value: string | number | boolean | (string | number | boolean)[],
    option: ComboBoxOption | ComboBoxOption[]
  ) => void
}

/**
 * Component FormComboBox tái sử dụng cho React Hook Form
 * Hỗ trợ cả static options và async data loading từ API
 * Tích hợp với Ant Design Select component
 * Sử dụng pattern giống với component ComboBox mới
 */
function FormComboBox<T extends FieldValues>({
  name,
  control,
  options: staticOptions = [],
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
  mode,
  maxTagCount,
  maxTagTextLength,
  rules,
  className,
  style,
  size = "middle",
  onSelectionChange,
  ...selectProps
}: FormComboBoxProps<T>) {
  // Kiểm tra xem có sử dụng API hay không
  const isAsyncMode = Boolean(externalData)

  // Chọn options phù hợp (external data hoặc static options)
  const finalOptions = isAsyncMode ? externalData : staticOptions

  // Xử lý validation rules
  const validationRules = {
    required: required
      ? typeof required === "string"
        ? required
        : `${label || "Trường này"} là bắt buộc`
      : false,
    ...rules,
  }

  // Debounce timer ref
  const searchTimerRef = React.useRef<NodeJS.Timeout | null>(null)

  // Handle search với debounce 1.5s
  const handleSearch = useCallback(
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

  // Handle scroll để load more cho async mode
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
          (opt) => opt.value === option?.value
        )
        return optionData ? filterOption(input, optionData) : false
      }
    }

    if (filterOption === true) {
      return (input: string, option?: DefaultOptionType) => {
        const optionData = staticOptions.find(
          (opt) => opt.value === option?.value
        )
        return optionData
          ? String(optionData.label).toLowerCase().includes(input.toLowerCase())
          : false
      }
    }

    return filterOption
  }, [isAsyncMode, filterOption, staticOptions])

  // Render dropdown với loading indicator cho async mode
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
            finalOptions &&
            finalOptions.length > 0 && (
              <div
                style={{ padding: "8px", textAlign: "center", color: "#999" }}
              >
                Cuộn xuống để tải thêm ({finalOptions.length}/?)
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
      finalOptions?.length,
    ]
  )

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
              loading={isAsyncMode && (isLoading || isFetching)}
              status={error ? "error" : undefined}
              dropdownRender={isAsyncMode ? dropdownRender : undefined}
              notFoundContent={
                isAsyncMode && (isLoading || isFetching) ? (
                  <Spin size='small' />
                ) : (
                  "Không có dữ liệu"
                )
              }
              options={finalOptions as DefaultOptionType[]}
              popupClassName="combobox-dropdown-wrap-text"
              {...selectProps}
            />
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
export type { FormComboBoxProps, ComboBoxOption }
