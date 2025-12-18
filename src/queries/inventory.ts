import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { queryClient } from "@/provider/app-provider-tanstack"
import {
  InventoryReceiptItem,
  CreateInventoryReceiptRequest,
  UpdateInventoryReceiptRequest,
  UpdateInventoryReceiptItemRequest,
  InventoryReceiptListParams,
  InventoryHistoryListParams,
  StockInRequest,
  getInventoryReceiptStatusText,
  InventoryReceiptApiResponse,
  InventoryReceiptItemApiResponse,
  InventoryHistoryApiResponse,
  // Thêm các interface mới từ backend NestJS
  InventoryBatch,
  InventoryTransaction,
  CreateInventoryBatchRequest,
  CreateInventoryTransactionRequest,
  StockOutRequest,
  InventorySummary,
  InventoryValueReport,
  LowStockAlert,
  ExpiringBatchAlert,
  FifoCalculation,
  BatchTrackingInfo,
  mapApiResponseToInventoryReceipt,
  mapApiResponseToInventoryReceiptItem,
  mapApiResponseToInventoryHistory,
} from "@/models/inventory.model"
import { handleApiError } from "@/utils/error-handler"
import { usePaginationQuery } from "@/hooks/use-pagination-query"


// ========== QUERY KEYS ==========
export const inventoryKeys = {
  all: ["inventory"] as const,
  receipts: () => [...inventoryKeys.all, "receipts"] as const,
  receiptsList: (params?: InventoryReceiptListParams) =>
    [...inventoryKeys.receipts(), "list", params] as const,
  receipt: (id: number) => [...inventoryKeys.receipts(), "detail", id] as const,
  receiptByCode: (code: string) =>
    [...inventoryKeys.receipts(), "code", code] as const,
  receiptItems: (receiptId: number) =>
    [...inventoryKeys.receipts(), receiptId, "items"] as const,
  history: () => [...inventoryKeys.all, "history"] as const,
  historyList: (params?: InventoryHistoryListParams) =>
    [...inventoryKeys.history(), "list", params] as const,
  historyByProduct: (productId: number, params?: InventoryHistoryListParams) =>
    [...inventoryKeys.history(), "product", productId, params] as const,
  stats: () => [...inventoryKeys.all, "stats"] as const,
  batches: () => [...inventoryKeys.all, "batches"] as const,
  batch: (id: number) => [...inventoryKeys.batches(), "detail", id] as const,
  batchByProduct: (productId: number) =>
    [...inventoryKeys.batches(), "product", productId] as const,
  transactions: () => [...inventoryKeys.all, "transactions"] as const,
  transaction: (id: number) =>
    [...inventoryKeys.transactions(), "detail", id] as const,
  transactionByProduct: (productId: number) =>
    [...inventoryKeys.transactions(), "product", productId] as const,
  reports: () => [...inventoryKeys.all, "reports"] as const,
  summary: (productId: number) =>
    [...inventoryKeys.reports(), "summary", productId] as const,
  valueReport: () => [...inventoryKeys.reports(), "value"] as const,
  lowStockAlert: (threshold: number) =>
    [...inventoryKeys.reports(), "low-stock", threshold] as const,
  expiringBatchesAlert: (days: number) =>
    [...inventoryKeys.reports(), "expiring-batches", days] as const,
  fifoCost: (productId: number, quantity: number) =>
    [...inventoryKeys.reports(), "fifo", productId, quantity] as const,
  batchTracking: (productId?: number) =>
    [...inventoryKeys.reports(), "batch-tracking", productId] as const,
  fifoValue: (productId: number) =>
    [...inventoryKeys.reports(), "fifo-value", productId] as const,
  weightedAverageCost: (productId: number) =>
    [...inventoryKeys.reports(), "weighted-average-cost", productId] as const,
} as const

// ========== INVENTORY RECEIPT HOOKS ==========

/**
 * Hook lấy danh sách phiếu nhập hàng (POST /inventory/receipts/search)
 */
export const useInventoryReceiptsQuery = (
  params?: InventoryReceiptListParams
) => {
  const page = params?.offset !== undefined
    ? Math.floor(params.offset / (params.limit || 10)) + 1
    : 1
  const limit = params?.limit || 10

  return useQuery({
    queryKey: inventoryKeys.receiptsList(params),
    queryFn: async () => {
      const response = await api.postRaw<{
        data: InventoryReceiptApiResponse[]
        total: number
        page: number
        limit: number
      }>('/inventory/receipts/search', {
        page,
        limit,
        keyword: params?.code, // Global search
        filters: {
          ...(params?.status && { status: params.status }),
          ...(params?.supplierName && { supplier_name: params.supplierName }),
        },
        sort: 'created_at:DESC',
      })

      return {
        data: {
          items: response.data,
          total: response.total,
          page: response.page,
          limit: response.limit,
          total_pages: Math.ceil(response.total / response.limit),
          has_next: response.page * response.limit < response.total,
          has_prev: response.page > 1,
        },
        status: 200,
        message: 'Success',
        success: true
      }
    },
    refetchOnMount: true,
    staleTime: 0,
  })
}

/**
 * Hook lấy phiếu nhập hàng theo ID
 */
export const useInventoryReceiptQuery = (id: number) => {
  return useQuery({
    queryKey: inventoryKeys.receipt(id),
    queryFn: async () => {
      const response = await api.get<any>(
        `/inventory/receipt/${id}`
      )
      // Unwrap data từ response wrapper { success, data, meta }
      const receiptData = response.data || response
      // Map dữ liệu từ API response sang interface mới
      return mapApiResponseToInventoryReceipt(receiptData)
    },
    enabled: !!id,
  })
}

/**
 * Hook lấy phiếu nhập hàng theo mã code
 */
export const useInventoryReceiptByCodeQuery = (code: string) => {
  return useQuery({
    queryKey: inventoryKeys.receiptByCode(code),
    queryFn: async () => {
      const response = await api.get<InventoryReceiptApiResponse>(
        `/inventory/receipt/code/${code}` // Thay đổi từ /inventory/receipts/code/${code} thành /inventory/receipt/code/${code}
      )
      // Map dữ liệu từ API response sang interface mới
      return mapApiResponseToInventoryReceipt(response)
    },
    enabled: !!code,
  })
}

/**
 * Hook tạo phiếu nhập hàng mới
 */
export const useCreateInventoryReceiptMutation = () => {
  return useMutation({
    mutationFn: async (receipt: CreateInventoryReceiptRequest) => {
      const response = await api.postRaw<InventoryReceiptApiResponse>(
        "/inventory/receipt", // Thay đổi từ /inventory/receipts thành /inventory/receipt
        receipt
      )
      return {
        ...response,
        statusText: getInventoryReceiptStatusText(response.status),
      }
    },
    onSuccess: (data) => {
      // Invalidate và refetch danh sách phiếu nhập
      queryClient.invalidateQueries({ queryKey: inventoryKeys.receipts() })
      toast.success("Tạo phiếu nhập hàng thành công!")
      return data
    },
    onError: (error: unknown) => {
      handleApiError(error, "Lỗi khi tạo phiếu nhập hàng")
    },
  })
}

/**
 * Hook cập nhật phiếu nhập hàng
 */
export const useUpdateInventoryReceiptMutation = () => {
  return useMutation({
    mutationFn: async ({
      id,
      receipt,
    }: {
      id: number
      receipt: UpdateInventoryReceiptRequest
    }) => {
      const response = await api.patchRaw<InventoryReceiptApiResponse>(
        `/inventory/receipt/${id}`,
        receipt
      )
      return {
        ...response,
        statusText: getInventoryReceiptStatusText(response.status),
      }
    },
    onSuccess: (data, variables) => {
      // Cập nhật cache cho phiếu cụ thể
      queryClient.setQueryData(inventoryKeys.receipt(variables.id), data)
      // Invalidate danh sách
      queryClient.invalidateQueries({ queryKey: inventoryKeys.receipts() })
      toast.success("Cập nhật phiếu nhập hàng thành công!")
      return data
    },
    onError: (error: unknown) => {
      handleApiError(error, "Lỗi khi cập nhật phiếu nhập hàng")
    },
  })
}

/**
 * Hook xóa phiếu nhập hàng
 */
export const useDeleteInventoryReceiptMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/inventory/receipt/${id}`)
    },
    onSuccess: (_, variables) => {
      // Xóa khỏi cache
      queryClient.removeQueries({ queryKey: inventoryKeys.receipt(variables) })
      queryClient.removeQueries({
        queryKey: inventoryKeys.receiptItems(variables),
      })
      // Invalidate danh sách
      queryClient.invalidateQueries({ queryKey: inventoryKeys.receipts() })
      toast.success("Xóa phiếu nhập hàng thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Lỗi khi xóa phiếu nhập hàng")
    },
  })
}

// ========== INVENTORY RECEIPT OPERATIONS ==========

/**
 * Hook duyệt phiếu nhập hàng
 */
export const useApproveInventoryReceiptMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.postRaw<InventoryReceiptApiResponse>(
        `/inventory/receipt/${id}/approve`
      )
      return {
        ...response,
        statusText: getInventoryReceiptStatusText(response.status),
      }
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(inventoryKeys.receipt(variables), data)
      queryClient.invalidateQueries({ queryKey: inventoryKeys.receipts() })
      toast.success("Duyệt phiếu nhập hàng thành công!")
      return data
    },
    onError: (error: Error) => {
      handleApiError(error, "Lỗi khi duyệt phiếu nhập hàng")
    },
  })
}



/**
 * Hook hủy phiếu nhập hàng
 */
export const useCancelInventoryReceiptMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.postRaw<InventoryReceiptApiResponse>(
        `/inventory/receipt/${id}/cancel`
      )
      return {
        ...response,
        statusText: getInventoryReceiptStatusText(response.status),
      }
    },
    onSuccess: (data, variables) => {
      // Cập nhật cache
      queryClient.setQueryData(inventoryKeys.receipt(variables), data)
      queryClient.invalidateQueries({ queryKey: inventoryKeys.receipts() })
      toast.success("Hủy phiếu nhập hàng thành công!")
      return data
    },
    onError: (error: Error) => {
      handleApiError(error, "Lỗi khi hủy phiếu nhập hàng")
    },
  })
}

// ========== INVENTORY RECEIPT ITEM HOOKS ==========

/**
 * Hook lấy danh sách chi tiết phiếu nhập hàng
 */
export const useInventoryReceiptItemsQuery = (receiptId: number) => {
  return useQuery({
    queryKey: inventoryKeys.receiptItems(receiptId),
    queryFn: async () => {
      const response = await api.get<InventoryReceiptItemApiResponse[]>(
        `/inventory/receipt/${receiptId}/items` // Thay đổi từ /inventory/receipts/${receiptId}/items thành /inventory/receipt/${receiptId}/items
      )
      // Map dữ liệu từ API response sang interface mới
      return response.map(mapApiResponseToInventoryReceiptItem)
    },
    enabled: !!receiptId,
  })
}

/**
 * Hook cập nhật chi tiết phiếu nhập hàng
 */
export const useUpdateInventoryReceiptItemMutation = () => {
  return useMutation({
    mutationFn: async ({
      id,
      item,
    }: {
      id: number
      item: UpdateInventoryReceiptItemRequest
    }) => {
      const response = await api.putRaw<InventoryReceiptItemApiResponse>(
        `/inventory/receipt-items/${id}`,
        item
      )
      // Không cần mapping vì interface đã giống nhau
      return response
    },
    onSuccess: (data, variables) => {
      // Cập nhật cache cho phiếu và chi tiết
      queryClient.setQueryData(
        inventoryKeys.receiptItems(variables.id),
        (oldData: InventoryReceiptItem[] | undefined) =>
          oldData?.map((item) =>
            item.id === variables.id ? { ...item, ...data } : item
          ) || []
      )
      toast.success("Cập nhật chi tiết phiếu nhập hàng thành công!")
      return data
    },
    onError: (error: unknown) => {
      handleApiError(
        error,
        "Có lỗi xảy ra khi cập nhật chi tiết phiếu nhập hàng"
      )
    },
  })
}

/**
 * Hook xóa chi tiết phiếu nhập hàng
 */
export const useDeleteInventoryReceiptItemMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/inventory/receipt/item/${id}`)
    },
    onSuccess: (_, variables) => {
      // Cập nhật cache
      queryClient.setQueryData(
        inventoryKeys.receiptItems(variables),
        (oldData: InventoryReceiptItem[] | undefined) =>
          oldData?.filter((item) => item.id !== variables) || []
      )
      toast.success("Xóa chi tiết phiếu nhập hàng thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi xóa chi tiết phiếu nhập hàng")
    },
  })
}

// ========== STOCK OPERATIONS ==========

/**
 * Hook xử lý nhập kho (stock-in)
 */
export const useStockInMutation = () => {
  return useMutation({
    mutationFn: async (stockInData: StockInRequest) => {
      await api.postRaw(
        "/inventory/stock-in",
        stockInData as unknown as Record<string, unknown>
      )
    },
    onSuccess: (data) => {
      // Cập nhật cache
      queryClient.invalidateQueries({ queryKey: inventoryKeys.receipts() })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.history() })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.stats() })
      toast.success("Nhập kho thành công!")
      return data
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi nhập kho")
    },
  })
}

/**
 * Hook xử lý xuất kho (stock-out)
 */
export const useStockOutMutation = () => {
  return useMutation({
    mutationFn: async (stockOutData: StockOutRequest) => {
      await api.postRaw(
        "/inventory/stock-out",
        stockOutData as unknown as Record<string, unknown>
      )
    },
    onSuccess: (data) => {
      // Cập nhật cache
      queryClient.invalidateQueries({ queryKey: inventoryKeys.receipts() })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.history() })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.stats() })
      toast.success("Xuất kho thành công!")
      return data
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi xuất kho")
    },
  })
}

// ========== BATCH MANAGEMENT HOOKS ==========

/**
 * Hook tạo lô hàng tồn kho mới
 */
export const useCreateBatchMutation = () => {
  return useMutation({
    mutationFn: async (batchData: CreateInventoryBatchRequest) => {
      const response = await api.postRaw<InventoryBatch>(
        "/inventory/batches",
        batchData as unknown as Record<string, unknown>
      )
      return response
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.batches() })
      toast.success("Tạo lô hàng thành công!")
      return data
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi tạo lô hàng")
    },
  })
}

/**
 * Hook cập nhật lô hàng
 */
export const useUpdateBatchMutation = () => {
  return useMutation({
    mutationFn: async ({
      id,
      batchData,
    }: {
      id: number
      batchData: Partial<CreateInventoryBatchRequest>
    }) => {
      const response = await api.patchRaw<InventoryBatch>(
        `/inventory/batches/${id}`,
        batchData as unknown as Record<string, unknown>
      )
      return response
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(inventoryKeys.batch(variables.id), data)
      queryClient.invalidateQueries({ queryKey: inventoryKeys.batches() })
      toast.success("Cập nhật lô hàng thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi cập nhật lô hàng")
    },
  })
}

// ========== TRANSACTION MANAGEMENT HOOKS ==========

/**
 * Hook tạo giao dịch kho mới
 */
export const useCreateTransactionMutation = () => {
  return useMutation({
    mutationFn: async (transactionData: CreateInventoryTransactionRequest) => {
      const response = await api.postRaw<InventoryTransaction>(
        "/inventory/transactions",
        transactionData as unknown as Record<string, unknown>
      )
      return response
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.transactions() })
      toast.success("Tạo giao dịch kho thành công!")
      return data
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi tạo giao dịch kho")
    },
  })
}

/**
 * Hook tính lại giá vốn trung bình gia quyền
 */
export const useRecalculateWeightedAverageCostMutation = () => {
  return useMutation({
    mutationFn: async (productId: number) => {
      const response = await api.postRaw<{
        newAverageCost: number
        success: boolean
      }>(`/inventory/recalculate-weighted-average/${productId}`)
      return response
    },
    onSuccess: (data) => {
      toast.success("Tính lại giá vốn trung bình gia quyền thành công!")
      return data
    },
    onError: (error: unknown) => {
      handleApiError(
        error,
        "Có lỗi xảy ra khi tính lại giá vốn trung bình gia quyền"
      )
    },
  })
}

// ========== INVENTORY HISTORY HOOKS ==========

/**
 * Hook lấy lịch sử tồn kho
 */
export const useInventoryHistoryQuery = (
  params?: InventoryHistoryListParams
) => {
  // Chuyển đổi InventoryHistoryListParams thành PaginationParams
  const paginationParams = params
    ? {
        page:
          params.offset !== undefined
            ? Math.floor(params.offset / (params.limit || 10)) + 1
            : 1,
        limit: params.limit,
        ...params,
      }
    : undefined

  return usePaginationQuery<InventoryHistoryApiResponse>(
    "/inventory/product-history",
    paginationParams
  )
}

/**
 * Hook lấy lịch sử tồn kho theo sản phẩm
 */
export const useInventoryHistoryByProductQuery = (
  productId: number,
  params?: Omit<InventoryHistoryListParams, "productId">
) => {
  return useQuery({
    queryKey: inventoryKeys.historyByProduct(productId, params),
    queryFn: async () => {
      const apiData = await api.get<InventoryHistoryApiResponse[]>(
        `/inventory/product-history/${productId}`,
        { params }
      )

      console.log("Raw API response for inventory history by product:", apiData)

      // Map dữ liệu từ API response sang interface mới
      const mappedHistory = apiData.map(mapApiResponseToInventoryHistory)

      return {
        data: {
          items: mappedHistory,
          total: apiData.length,
        },
        code: 200,
        message: "Lấy lịch sử tồn kho theo sản phẩm thành công",
      }
    },
    enabled: !!productId,
  })
}

// ========== INVENTORY STATS HOOKS ==========

/**
 * Hook lấy thống kê tồn kho
 */
export const useInventoryStatsQuery = () => {
  return useQuery({
    queryKey: inventoryKeys.stats(),
    queryFn: async () => {
      // Gọi API POST search để lấy tất cả phiếu nhập (không phân trang)
      const response = await api.postRaw<{
        data: InventoryReceiptApiResponse[]
        total: number
      }>("/inventory/receipts/search", {
        page: 1,
        limit: 9999, // Lấy tất cả để tính stats
      })

      const receipts = response.data
      const totalReceipts = receipts.length
      
      // Đếm theo status string
      const draftReceipts = receipts.filter(
        (r: InventoryReceiptApiResponse) => r.status === 'draft'
      ).length
      
      const approvedReceipts = receipts.filter(
        (r: InventoryReceiptApiResponse) => r.status === 'approved'
      ).length

      // Tính tổng giá trị (chỉ các phiếu đã duyệt)
      const totalValue = receipts
        .filter((r: InventoryReceiptApiResponse) => r.status === 'approved')
        .reduce(
          (sum: number, r: InventoryReceiptApiResponse) =>
            sum + parseFloat(r.total_amount || "0"),
          0
        )
        .toString()

      return {
        totalReceipts,
        draftReceipts,
        approvedReceipts,
        totalValue,
      }
    },
  })
}

// ========== REPORTING HOOKS ==========

/**
 * Hook lấy tổng hợp tồn kho theo ID sản phẩm
 */
export const useInventorySummaryQuery = (productId: number) => {
  return useQuery({
    queryKey: inventoryKeys.summary(productId),
    queryFn: async () => {
      const response = await api.get<InventorySummary>(
        `/inventory/reports/summary/${productId}`
      )
      return response
    },
    enabled: !!productId,
  })
}

/**
 * Hook lấy báo cáo giá trị tồn kho
 */
export const useInventoryValueReportQuery = (productIds?: number[]) => {
  return useQuery({
    queryKey: inventoryKeys.valueReport(),
    queryFn: async () => {
      const response = await api.get<InventoryValueReport[]>(
        "/inventory/reports/value",
        {
          params: productIds ? { productIds } : undefined,
        }
      )
      return response
    },
  })
}

/**
 * Hook lấy cảnh báo tồn kho thấp
 */
export const useLowStockAlertQuery = (threshold: number = 10) => {
  return useQuery({
    queryKey: inventoryKeys.lowStockAlert(threshold),
    queryFn: async () => {
      const response = await api.get<LowStockAlert[]>(
        "/inventory/reports/low-stock",
        {
          params: { threshold },
        }
      )
      return response
    },
  })
}

/**
 * Hook lấy cảnh báo lô hàng sắp hết hạn
 */
export const useExpiringBatchesAlertQuery = (days: number = 30) => {
  return useQuery({
    queryKey: inventoryKeys.expiringBatchesAlert(days),
    queryFn: async () => {
      const response = await api.get<ExpiringBatchAlert[]>(
        "/inventory/reports/expiring-batches",
        {
          params: { days },
        }
      )
      return response
    },
  })
}

/**
 * Hook tính giá vốn FIFO cho số lượng cụ thể
 */
export const useFifoCostQuery = (productId: number, quantity: number) => {
  return useQuery({
    queryKey: inventoryKeys.fifoCost(productId, quantity),
    queryFn: async () => {
      const response = await api.get<FifoCalculation>(
        "/inventory/reports/fifo",
        {
          params: { productId, quantity },
        }
      )
      return response
    },
    enabled: !!productId && !!quantity,
  })
}

/**
 * Hook lấy thông tin batch tracking
 */
export const useBatchTrackingInfoQuery = (productId?: number) => {
  return useQuery({
    queryKey: inventoryKeys.batchTracking(productId),
    queryFn: async () => {
      const response = await api.get<BatchTrackingInfo[]>(
        "/inventory/reports/batch-tracking",
        {
          params: productId ? { productId } : undefined,
        }
      )
      return response
    },
  })
}

/**
 * Hook lấy batch tracking theo sản phẩm
 */
export const useBatchTrackingByProductQuery = (productId: number) => {
  return useQuery({
    queryKey: inventoryKeys.batchTracking(productId),
    queryFn: async () => {
      const response = await api.get<BatchTrackingInfo>(
        `/inventory/reports/batch-tracking/${productId}`
      )
      return response
    },
    enabled: !!productId,
  })
}

/**
 * Hook lấy giá trị FIFO của sản phẩm
 */
export const useFifoValueQuery = (productId: number) => {
  return useQuery({
    queryKey: inventoryKeys.fifoValue(productId),
    queryFn: async () => {
      const response = await api.get<{
        fifoValue: number
        totalQuantity: number
      }>(`/inventory/fifo/product/${productId}`)
      return response
    },
    enabled: !!productId,
  })
}

/**
 * Hook lấy giá vốn trung bình gia quyền
 */
export const useWeightedAverageCostQuery = (productId: number) => {
  return useQuery({
    queryKey: inventoryKeys.weightedAverageCost(productId),
    queryFn: async () => {
      const response = await api.get<{
        averageCost: number
        totalQuantity: number
      }>(`/inventory/weighted-average-cost/product/${productId}`)
      return response
    },
    enabled: !!productId,
  })
}

// ========== UPLOAD IMAGE HOOKS ==========

/**
 * Hook upload file lên server
 */
export const useUploadFileMutation = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const response = await api.postForm('/upload/image', formData)
      return response
    },
    onError: (error: Error) => {
      handleApiError(error, `Lỗi khi upload file`)
    },
  })
}

/**
 * Hook gắn ảnh vào phiếu nhập kho
 */
export const useAttachImageToReceiptMutation = () => {
  return useMutation({
    mutationFn: async ({
      receiptId,
      fileId,
      fieldName,
    }: {
      receiptId: number
      fileId: number
      fieldName?: string
    }) => {
      const response = await api.postRaw(
        `/inventory/receipt/${receiptId}/upload-image`,
        { fileId, fieldName }
      )
      return response
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['receipt-images', variables.receiptId],
      })
      toast.success('Gắn ảnh vào phiếu thành công!')
    },
    onError: (error: Error) => {
      handleApiError(error, "Lỗi khi gắn ảnh")
    },
  })
}

/**
 * Hook lấy danh sách ảnh của phiếu nhập kho
 */
export const useReceiptImagesQuery = (receiptId: number) => {
  return useQuery({
    queryKey: ['receipt-images', receiptId],
    queryFn: async () => {
      const response = await api.get<{
        id: number
        url: string
        name: string
        type: string
        size: number
        created_at: string
      }[]>(`/inventory/receipt/${receiptId}/images`)
      return response
    },
    enabled: !!receiptId,
  })
}

/**
 * Hook xóa ảnh khỏi phiếu nhập kho
 */
export const useDeleteReceiptImageMutation = () => {
  return useMutation({
    mutationFn: async ({
      receiptId,
      fileId,
    }: {
      receiptId: number
      fileId: number
    }) => {
      const response = await api.delete(
        `/inventory/receipt/${receiptId}/image/${fileId}`
      )
      return response
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['receipt-images', variables.receiptId],
      })
      toast.success('Xóa ảnh thành công!')
    },
    onError: (error: Error) => {
      handleApiError(error, "Lỗi khi xóa ảnh")
    },
  })
}
