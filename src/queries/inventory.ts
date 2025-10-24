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
  getInventoryTransactionTypeText,
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
} from "@/models/inventory.model"

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
  batchByProduct: (productId: number) => [...inventoryKeys.batches(), "product", productId] as const,
  transactions: () => [...inventoryKeys.all, "transactions"] as const,
  transaction: (id: number) => [...inventoryKeys.transactions(), "detail", id] as const,
  transactionByProduct: (productId: number) => [...inventoryKeys.transactions(), "product", productId] as const,
  reports: () => [...inventoryKeys.all, "reports"] as const,
  summary: (productId: number) => [...inventoryKeys.reports(), "summary", productId] as const,
  valueReport: () => [...inventoryKeys.reports(), "value"] as const,
  lowStockAlert: (threshold: number) => [...inventoryKeys.reports(), "low-stock", threshold] as const,
  expiringBatchesAlert: (days: number) => [...inventoryKeys.reports(), "expiring-batches", days] as const,
  fifoCost: (productId: number, quantity: number) => [...inventoryKeys.reports(), "fifo", productId, quantity] as const,
  batchTracking: (productId?: number) => [...inventoryKeys.reports(), "batch-tracking", productId] as const,
  fifoValue: (productId: number) => [...inventoryKeys.reports(), "fifo-value", productId] as const,
  weightedAverageCost: (productId: number) => [...inventoryKeys.reports(), "weighted-average-cost", productId] as const,
} as const

// ========== INVENTORY RECEIPT HOOKS ==========

/**
 * Hook lấy danh sách phiếu nhập hàng
 */
export const useInventoryReceiptsQuery = (params?: InventoryReceiptListParams) => {
  return useQuery({
    queryKey: inventoryKeys.receiptsList(params),
    queryFn: async () => {
      const apiData = await api.get<InventoryReceiptApiResponse[]>(
        "/inventory/receipts",
        {
          params,
        }
      )

      console.log("Raw API response for inventory receipts:", apiData)

      // Thêm statusText cho mỗi receipt
      const receiptsWithStatusText = apiData.map((receipt: InventoryReceiptApiResponse) => ({
        ...receipt,
        statusText: getInventoryReceiptStatusText(receipt.status)
      }))

      return {
        data: {
          items: receiptsWithStatusText,
          total: apiData.length,
        },
        code: 200,
        message: "Lấy danh sách phiếu nhập hàng thành công",
      }
    },
  })
}

/**
 * Hook lấy phiếu nhập hàng theo ID
 */
export const useInventoryReceiptQuery = (id: number) => {
  return useQuery({
    queryKey: inventoryKeys.receipt(id),
    queryFn: async () => {
      const response = await api.get<InventoryReceiptApiResponse>(
        `/inventory/receipts/${id}`
      )
      return {
        ...response,
        statusText: getInventoryReceiptStatusText(response.status)
      }
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
        `/inventory/receipts/code/${code}`
      )
      return {
        ...response,
        statusText: getInventoryReceiptStatusText(response.status)
      }
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
      const response = await api.post<InventoryReceiptApiResponse>(
        "/inventory/receipts",
        receipt
      )
      return {
        ...response,
        statusText: getInventoryReceiptStatusText(response.status)
      }
    },
    onSuccess: (data) => {
      // Invalidate và refetch danh sách phiếu nhập
      queryClient.invalidateQueries({ queryKey: inventoryKeys.receipts() })
      toast.success("Tạo phiếu nhập hàng thành công!")
      return data
    },
    onError: (error: Error) => {
      toast.error(`Lỗi khi tạo phiếu nhập hàng: ${error.message}`)
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
      const response = await api.put<InventoryReceiptApiResponse>(
        `/inventory/receipts/${id}`,
        receipt
      )
      return {
        ...response,
        statusText: getInventoryReceiptStatusText(response.status)
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
    onError: (error: Error) => {
      toast.error(`Lỗi khi cập nhật phiếu nhập hàng: ${error.message}`)
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
      queryClient.removeQueries({ queryKey: inventoryKeys.receiptItems(variables) })
      // Invalidate danh sách
      queryClient.invalidateQueries({ queryKey: inventoryKeys.receipts() })
      toast.success("Xóa phiếu nhập hàng thành công!")
    },
    onError: (error: Error) => {
      toast.error(`Lỗi khi xóa phiếu nhập hàng: ${error.message}`)
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
      const response = await api.put<InventoryReceiptApiResponse>(
        `/inventory/receipts/${id}/approve`
      )
      return {
        ...response,
        statusText: getInventoryReceiptStatusText(response.status)
      }
    },
    onSuccess: (data, variables) => {
      // Cập nhật cache
      queryClient.setQueryData(inventoryKeys.receipt(variables), data)
      queryClient.invalidateQueries({ queryKey: inventoryKeys.receipts() })
      toast.success("Duyệt phiếu nhập hàng thành công!")
      return data
    },
    onError: (error: Error) => {
      toast.error(`Lỗi khi duyệt phiếu nhập hàng: ${error.message}`)
    },
  })
}

/**
 * Hook hoàn thành phiếu nhập hàng (nhập kho)
 */
export const useCompleteInventoryReceiptMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.put<InventoryReceiptApiResponse>(
        `/inventory/receipts/${id}/complete`
      )
      return {
        ...response,
        statusText: getInventoryReceiptStatusText(response.status)
      }
    },
    onSuccess: (data, variables) => {
      // Cập nhật cache
      queryClient.setQueryData(inventoryKeys.receipt(variables), data)
      queryClient.invalidateQueries({ queryKey: inventoryKeys.receipts() })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.history() })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.stats() })
      toast.success("Hoàn thành phiếu nhập hàng thành công!")
      return data
    },
    onError: (error: Error) => {
      toast.error(`Lỗi khi hoàn thành phiếu nhập hàng: ${error.message}`)
    },
  })
}

/**
 * Hook hủy phiếu nhập hàng
 */
export const useCancelInventoryReceiptMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.put<InventoryReceiptApiResponse>(
        `/inventory/receipts/${id}/cancel`
      )
      return {
        ...response,
        statusText: getInventoryReceiptStatusText(response.status)
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
      toast.error(`Lỗi khi hủy phiếu nhập hàng: ${error.message}`)
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
        `/inventory/receipts/${receiptId}/items`
      )
      // Không cần mapping vì interface đã giống nhau
      return response
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
      const response = await api.put<InventoryReceiptItemApiResponse>(
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
    onError: (error: Error) => {
      toast.error(`Lỗi khi cập nhật chi tiết phiếu nhập hàng: ${error.message}`)
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
    onError: (error: Error) => {
      toast.error(`Lỗi khi xóa chi tiết phiếu nhập hàng: ${error.message}`)
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
      await api.post(
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
    onError: (error: Error) => {
      toast.error(`Lỗi khi nhập kho: ${error.message}`)
    },
  })
}

/**
 * Hook xử lý xuất kho (stock-out)
 */
export const useStockOutMutation = () => {
  return useMutation({
    mutationFn: async (stockOutData: StockOutRequest) => {
      await api.post(
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
    onError: (error: Error) => {
      toast.error(`Lỗi khi xuất kho: ${error.message}`)
    },
  })
}

// ========== INVENTORY HISTORY HOOKS ==========

/**
 * Hook lấy lịch sử tồn kho
 */
export const useInventoryHistoryQuery = (params?: InventoryHistoryListParams) => {
  return useQuery({
    queryKey: inventoryKeys.historyList(params),
    queryFn: async () => {
      const apiData = await api.get<InventoryHistoryApiResponse[]>(
        "/inventory/product-history",
        {
          params,
        }
      )

      console.log("Raw API response for inventory history:", apiData)

      // Thêm transactionTypeText cho mỗi history item
      const historyWithTypeText = apiData.map((history: InventoryHistoryApiResponse) => ({
        ...history,
        transactionTypeText: getInventoryTransactionTypeText(history.transactionType)
      }))

      return {
        data: {
          items: historyWithTypeText,
          total: apiData.length,
        },
        code: 200,
        message: "Lấy lịch sử tồn kho thành công",
      }
    },
  })
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

      // Thêm transactionTypeText cho mỗi history item
      const historyWithTypeText = apiData.map((history: InventoryHistoryApiResponse) => ({
        ...history,
        transactionTypeText: getInventoryTransactionTypeText(history.transactionType)
      }))

      return {
        data: {
          items: historyWithTypeText,
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
      // Gọi API lấy danh sách phiếu nhập để tính toán thống kê
      const receipts = await api.get<InventoryReceiptApiResponse[]>(
        "/inventory/receipts"
      )

      const totalReceipts = receipts.length
      const pendingReceipts = receipts.filter(
        (r: InventoryReceiptApiResponse) => r.status === 1
      ).length // PENDING
      const completedReceipts = receipts.filter(
        (r: InventoryReceiptApiResponse) => r.status === 3
      ).length // COMPLETED

      // Tính tổng giá trị (chỉ các phiếu đã hoàn thành)
      const totalValue = receipts
        .filter((r: InventoryReceiptApiResponse) => r.status === 3)
        .reduce(
          (sum: number, r: InventoryReceiptApiResponse) =>
            sum + parseFloat(r.totalAmount || "0"),
          0
        )
        .toString()

      return {
        totalReceipts,
        pendingReceipts,
        completedReceipts,
        totalValue,
      }
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
      const response = await api.post<InventoryBatch>(
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
    onError: (error: Error) => {
      console.error("Lỗi khi tạo lô hàng:", error)
      toast.error("Có lỗi xảy ra khi tạo lô hàng")
    },
  })
}

/**
 * Hook lấy danh sách tất cả lô hàng tồn kho
 */
export const useBatchesQuery = () => {
  return useQuery({
    queryKey: inventoryKeys.batches(),
    queryFn: async () => {
      const response = await api.get<InventoryBatch[]>("/inventory/batches")
      return response
    },
  })
}

/**
 * Hook lấy lô hàng theo ID sản phẩm
 */
export const useBatchesByProductQuery = (productId: number) => {
  return useQuery({
    queryKey: inventoryKeys.batchByProduct(productId),
    queryFn: async () => {
      const response = await api.get<InventoryBatch[]>(
        `/inventory/batches/product/${productId}`
      )
      return response
    },
    enabled: !!productId,
  })
}

/**
 * Hook lấy lô hàng theo ID
 */
export const useBatchQuery = (id: number) => {
  return useQuery({
    queryKey: inventoryKeys.batch(id),
    queryFn: async () => {
      const response = await api.get<InventoryBatch>(`/inventory/batches/${id}`)
      return response
    },
    enabled: !!id,
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
      const response = await api.patch<InventoryBatch>(
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
    onError: (error: Error, variables) => {
      console.error(`Lỗi khi cập nhật lô hàng ID ${variables.id}:`, error)
      toast.error("Có lỗi xảy ra khi cập nhật lô hàng")
    },
  })
}

/**
 * Hook xóa lô hàng
 */
export const useDeleteBatchMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/inventory/batches/${id}`)
    },
    onSuccess: (_, variables) => {
      queryClient.removeQueries({ queryKey: inventoryKeys.batch(variables) })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.batches() })
      toast.success("Xóa lô hàng thành công!")
    },
    onError: (error: Error, variables) => {
      console.error(`Lỗi khi xóa lô hàng ID ${variables}:`, error)
      toast.error("Có lỗi xảy ra khi xóa lô hàng")
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
      const response = await api.post<InventoryTransaction>(
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
    onError: (error: Error) => {
      console.error("Lỗi khi tạo giao dịch kho:", error)
      toast.error("Có lỗi xảy ra khi tạo giao dịch kho")
    },
  })
}

/**
 * Hook lấy danh sách tất cả giao dịch kho
 */
export const useTransactionsQuery = () => {
  return useQuery({
    queryKey: inventoryKeys.transactions(),
    queryFn: async () => {
      const response = await api.get<InventoryTransaction[]>(
        "/inventory/transactions"
      )
      return response
    },
  })
}

/**
 * Hook lấy giao dịch kho theo ID sản phẩm
 */
export const useTransactionsByProductQuery = (productId: number) => {
  return useQuery({
    queryKey: inventoryKeys.transactionByProduct(productId),
    queryFn: async () => {
      const response = await api.get<InventoryTransaction[]>(
        `/inventory/transactions/product/${productId}`
      )
      return response
    },
    enabled: !!productId,
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

/**
 * Hook tính lại giá vốn trung bình gia quyền
 */
export const useRecalculateWeightedAverageCostMutation = () => {
  return useMutation({
    mutationFn: async (productId: number) => {
      const response = await api.post<{
        newAverageCost: number
        success: boolean
      }>(`/inventory/recalculate-weighted-average/${productId}`)
      return response
    },
    onSuccess: (data) => {
      toast.success("Tính lại giá vốn trung bình gia quyền thành công!")
      return data
    },
    onError: (error: Error) => {
      console.error("Lỗi khi tính lại giá vốn trung bình gia quyền:", error)
      toast.error("Có lỗi xảy ra khi tính lại giá vốn trung bình gia quyền")
    },
  })
}