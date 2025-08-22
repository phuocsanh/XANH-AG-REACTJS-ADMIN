import { useInfiniteQuery, InfiniteData } from "@tanstack/react-query"
import { useMemo } from "react"

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

// Interface cho hook options
interface UseComboBoxQueryOptions {
  apiFunction: ApiFunction
  queryKey: (string | number | boolean | undefined)[]
  pageSize?: number
  searchValue?: string
  enabled?: boolean
  staleTime?: number
  gcTime?: number
  valueField?: string
  labelField?: string
}

/**
 * Custom hook sử dụng TanStack Query để fetch dữ liệu cho ComboBox
 * Hỗ trợ infinite loading và search với debounce
 */
export function useComboBoxQuery({
  apiFunction,
  queryKey,
  pageSize = 20,
  searchValue = "",
  enabled = true,
  staleTime = 5 * 60 * 1000, // 5 phút
  gcTime = 10 * 60 * 1000, // 10 phút
  valueField = "value",
  labelField = "label",
}: UseComboBoxQueryOptions) {
  // Sử dụng useInfiniteQuery để hỗ trợ pagination
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery<
    ApiResponse,
    Error,
    InfiniteData<ApiResponse>,
    (string | number | boolean | undefined)[],
    number
  >({
    queryKey: [...queryKey, searchValue],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiFunction({
        page: pageParam as number,
        limit: pageSize,
        search: searchValue,
      })
      return response
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // Nếu còn dữ liệu thì trả về page tiếp theo
      return lastPage.hasMore ? allPages.length + 1 : undefined
    },
    enabled,
    staleTime,
    gcTime,
    // Giữ dữ liệu cũ khi search để tránh loading state
    placeholderData: (previousData) => previousData,
  })

  // Flatten tất cả pages thành một mảng options
  const options = useMemo(() => {
    if (!data?.pages) return []

    return data.pages.flatMap((page: ApiResponse) =>
      page.data.map((item: ComboBoxOption) => ({
        ...item,
        value: item[valueField] as string | number,
        label: item[labelField] as string,
      }))
    )
  }, [data?.pages, valueField, labelField])

  // Tổng số items từ tất cả pages
  const total = useMemo(() => {
    if (!data?.pages || data.pages.length === 0) return 0
    return (data.pages[0] as ApiResponse).total
  }, [data?.pages])

  // Function để load more data
  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  return {
    // Dữ liệu
    options,
    total,

    // Loading states
    isLoading,
    isFetching,
    isFetchingNextPage,

    // Pagination
    hasNextPage,
    loadMore,

    // Error handling
    isError,
    error,

    // Utility functions
    refetch,
  }
}

export type {
  ComboBoxOption,
  ApiResponse,
  ApiFunction,
  UseComboBoxQueryOptions,
}
