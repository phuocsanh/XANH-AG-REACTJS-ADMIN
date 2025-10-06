import {
  InventoryReceipt,
  InventoryReceiptItem,
  InventoryHistory,
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
import api from "@/utils/api"

// Service xử lý các chức năng liên quan đến quản lý nhập hàng
export const inventoryService = {
  // ========== QUẢN LÝ PHIẾU NHẬP HÀNG ==========

  /**
   * Lấy danh sách phiếu nhập hàng
   */
  getInventoryReceipts: async (
    params?: InventoryReceiptListParams
  ): Promise<{
    data: { items: InventoryReceipt[]; total: number }
    code: number
    message: string
  }> => {
    try {
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
    } catch (error) {
      console.error("Lỗi khi lấy danh sách phiếu nhập hàng:", error)
      throw error
    }
  },

  /**
   * Lấy phiếu nhập hàng theo ID
   */
  getInventoryReceiptById: async (id: number): Promise<InventoryReceipt> => {
    try {
      const response = await api.get<InventoryReceiptApiResponse>(
        `/inventory/receipts/${id}`
      )
      return {
        ...response,
        statusText: getInventoryReceiptStatusText(response.status)
      }
    } catch (error) {
      console.error("Lỗi khi lấy phiếu nhập hàng theo ID:", error)
      throw error
    }
  },

  /**
   * Lấy phiếu nhập hàng theo mã code
   */
  getInventoryReceiptByCode: async (
    code: string
  ): Promise<InventoryReceipt> => {
    try {
      const response = await api.get<InventoryReceiptApiResponse>(
        `/inventory/receipts/code/${code}`
      )
      return {
        ...response,
        statusText: getInventoryReceiptStatusText(response.status)
      }
    } catch (error) {
      console.error("Lỗi khi lấy phiếu nhập hàng theo code:", error)
      throw error
    }
  },

  /**
   * Tạo phiếu nhập hàng mới
   */
  createInventoryReceipt: async (
    receipt: CreateInventoryReceiptRequest
  ): Promise<InventoryReceipt> => {
    try {
      const response = await api.post<InventoryReceiptApiResponse>(
        "/inventory/receipts",
        receipt
      )
      return {
        ...response,
        statusText: getInventoryReceiptStatusText(response.status)
      }
    } catch (error) {
      console.error("Lỗi khi tạo phiếu nhập hàng:", error)
      throw error
    }
  },

  /**
   * Cập nhật phiếu nhập hàng
   */
  updateInventoryReceipt: async (
    id: number,
    receipt: UpdateInventoryReceiptRequest
  ): Promise<InventoryReceipt> => {
    try {
      const response = await api.put<InventoryReceiptApiResponse>(
        `/inventory/receipts/${id}`,
        receipt
      )
      return {
        ...response,
        statusText: getInventoryReceiptStatusText(response.status)
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật phiếu nhập hàng:", error)
      throw error
    }
  },

  /**
   * Xóa phiếu nhập hàng
   */
  deleteInventoryReceipt: async (id: number): Promise<void> => {
    try {
      await api.delete(`/inventory/receipt/${id}`)
    } catch (error) {
      console.error(`Lỗi khi xóa phiếu nhập hàng ID ${id}:`, error)
      throw error
    }
  },

  // ========== THAO TÁC PHIẾU NHẬP HÀNG ==========

  /**
   * Duyệt phiếu nhập hàng
   */
  approveInventoryReceipt: async (id: number): Promise<InventoryReceipt> => {
    try {
      const response = await api.put<InventoryReceiptApiResponse>(
        `/inventory/receipts/${id}/approve`
      )
      return {
        ...response,
        statusText: getInventoryReceiptStatusText(response.status)
      }
    } catch (error) {
      console.error("Lỗi khi duyệt phiếu nhập hàng:", error)
      throw error
    }
  },

  /**
   * Hoàn thành phiếu nhập hàng (nhập kho)
   */
  completeInventoryReceipt: async (id: number): Promise<InventoryReceipt> => {
    try {
      const response = await api.put<InventoryReceiptApiResponse>(
        `/inventory/receipts/${id}/complete`
      )
      return {
        ...response,
        statusText: getInventoryReceiptStatusText(response.status)
      }
    } catch (error) {
      console.error("Lỗi khi hoàn thành phiếu nhập hàng:", error)
      throw error
    }
  },

  /**
   * Hủy phiếu nhập hàng
   */
  cancelInventoryReceipt: async (id: number): Promise<InventoryReceipt> => {
    try {
      const response = await api.put<InventoryReceiptApiResponse>(
        `/inventory/receipts/${id}/cancel`
      )
      return {
        ...response,
        statusText: getInventoryReceiptStatusText(response.status)
      }
    } catch (error) {
      console.error("Lỗi khi hủy phiếu nhập hàng:", error)
      throw error
    }
  },

  // ========== QUẢN LÝ CHI TIẾT PHIẾU NHẬP HÀNG ==========

  /**
   * Lấy danh sách chi tiết phiếu nhập hàng
   */
  getInventoryReceiptItems: async (
    receiptId: number
  ): Promise<InventoryReceiptItem[]> => {
    try {
      const response = await api.get<InventoryReceiptItemApiResponse[]>(
        `/inventory/receipts/${receiptId}/items`
      )
      // Không cần mapping vì interface đã giống nhau
      return response
    } catch (error) {
      console.error("Lỗi khi lấy danh sách chi tiết phiếu nhập hàng:", error)
      throw error
    }
  },

  /**
   * Cập nhật chi tiết phiếu nhập hàng
   */
  updateInventoryReceiptItem: async (
    id: number,
    item: UpdateInventoryReceiptItemRequest
  ): Promise<InventoryReceiptItem> => {
    try {
      const response = await api.put<InventoryReceiptItemApiResponse>(
        `/inventory/receipt-items/${id}`,
        item
      )
      // Không cần mapping vì interface đã giống nhau
      return response
    } catch (error) {
      console.error("Lỗi khi cập nhật chi tiết phiếu nhập hàng:", error)
      throw error
    }
  },

  /**
   * Xóa chi tiết phiếu nhập hàng
   */
  deleteInventoryReceiptItem: async (id: number): Promise<void> => {
    try {
      await api.delete(`/inventory/receipt/item/${id}`)
    } catch (error) {
      console.error(`Lỗi khi xóa chi tiết phiếu nhập ID ${id}:`, error)
      throw error
    }
  },

  // ========== QUẢN LÝ TỒN KHO ==========

  /**
   * Xử lý nhập kho (stock-in)
   */
  processStockIn: async (stockInData: StockInRequest): Promise<void> => {
    try {
      await api.post(
        "/inventory/stock-in",
        stockInData as unknown as Record<string, unknown>
      )
    } catch (error) {
      console.error("Lỗi khi xử lý nhập kho:", error)
      throw error
    }
  },

  /**
   * Xử lý xuất kho (stock-out)
   */
  processStockOut: async (stockOutData: StockOutRequest): Promise<void> => {
    try {
      await api.post(
        "/inventory/stock-out",
        stockOutData as unknown as Record<string, unknown>
      )
    } catch (error) {
      console.error("Lỗi khi xử lý xuất kho:", error)
      throw error
    }
  },

  // ========== LỊCH SỬ TỒN KHO ==========

  /**
   * Lấy lịch sử tồn kho
   */
  getInventoryHistory: async (
    params?: InventoryHistoryListParams
  ): Promise<{
    data: { items: InventoryHistory[]; total: number }
    code: number
    message: string
  }> => {
    try {
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
    } catch (error) {
      console.error("Lỗi khi lấy lịch sử tồn kho:", error)
      throw error
    }
  },

  /**
   * Lấy lịch sử tồn kho theo sản phẩm
   */
  getInventoryHistoryByProduct: async (
    productId: number,
    params?: Omit<InventoryHistoryListParams, "productId">
  ): Promise<{
    data: { items: InventoryHistory[]; total: number }
    code: number
    message: string
  }> => {
    try {
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
    } catch (error) {
      console.error(
        `Lỗi khi lấy lịch sử tồn kho sản phẩm ID ${productId}:`,
        error
      )
      throw error
    }
  },

  // ========== THỐNG KÊ ==========

  /**
   * Lấy thống kê tồn kho
   */
  getInventoryStats: async (): Promise<{
    totalReceipts: number
    pendingReceipts: number
    completedReceipts: number
    totalValue: string
  }> => {
    try {
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
    } catch (error) {
      console.error("Lỗi khi lấy thống kê tồn kho:", error)
      throw error
    }
  },

  // ========== QUẢN LÝ LÔ HÀNG (BATCH) ==========

  /**
   * Tạo lô hàng tồn kho mới
   */
  createBatch: async (
    batchData: CreateInventoryBatchRequest
  ): Promise<InventoryBatch> => {
    try {
      const response = await api.post<InventoryBatch>(
        "/inventory/batches",
        batchData as unknown as Record<string, unknown>
      )
      return response
    } catch (error) {
      console.error("Lỗi khi tạo lô hàng:", error)
      throw error
    }
  },

  /**
   * Lấy danh sách tất cả lô hàng tồn kho
   */
  getAllBatches: async (): Promise<InventoryBatch[]> => {
    try {
      const response = await api.get<InventoryBatch[]>("/inventory/batches")
      return response
    } catch (error) {
      console.error("Lỗi khi lấy danh sách lô hàng:", error)
      throw error
    }
  },

  /**
   * Lấy lô hàng theo ID sản phẩm
   */
  getBatchesByProduct: async (productId: number): Promise<InventoryBatch[]> => {
    try {
      const response = await api.get<InventoryBatch[]>(
        `/inventory/batches/product/${productId}`
      )
      return response
    } catch (error) {
      console.error(`Lỗi khi lấy lô hàng sản phẩm ID ${productId}:`, error)
      throw error
    }
  },

  /**
   * Lấy lô hàng theo ID
   */
  getBatchById: async (id: number): Promise<InventoryBatch> => {
    try {
      const response = await api.get<InventoryBatch>(`/inventory/batches/${id}`)
      return response
    } catch (error) {
      console.error(`Lỗi khi lấy lô hàng ID ${id}:`, error)
      throw error
    }
  },

  /**
   * Cập nhật lô hàng
   */
  updateBatch: async (
    id: number,
    batchData: Partial<CreateInventoryBatchRequest>
  ): Promise<InventoryBatch> => {
    try {
      const response = await api.patch<InventoryBatch>(
        `/inventory/batches/${id}`,
        batchData as unknown as Record<string, unknown>
      )
      return response
    } catch (error) {
      console.error(`Lỗi khi cập nhật lô hàng ID ${id}:`, error)
      throw error
    }
  },

  /**
   * Xóa lô hàng
   */
  deleteBatch: async (id: number): Promise<void> => {
    try {
      await api.delete(`/inventory/batches/${id}`)
    } catch (error) {
      console.error(`Lỗi khi xóa lô hàng ID ${id}:`, error)
      throw error
    }
  },

  // ========== QUẢN LÝ GIAO DỊCH KHO ==========

  /**
   * Tạo giao dịch kho mới
   */
  createTransaction: async (
    transactionData: CreateInventoryTransactionRequest
  ): Promise<InventoryTransaction> => {
    try {
      const response = await api.post<InventoryTransaction>(
        "/inventory/transactions",
        transactionData as unknown as Record<string, unknown>
      )
      return response
    } catch (error) {
      console.error("Lỗi khi tạo giao dịch kho:", error)
      throw error
    }
  },

  /**
   * Lấy danh sách tất cả giao dịch kho
   */
  getAllTransactions: async (): Promise<InventoryTransaction[]> => {
    try {
      const response = await api.get<InventoryTransaction[]>(
        "/inventory/transactions"
      )
      return response
    } catch (error) {
      console.error("Lỗi khi lấy danh sách giao dịch kho:", error)
      throw error
    }
  },

  /**
   * Lấy giao dịch kho theo ID sản phẩm
   */
  getTransactionsByProduct: async (
    productId: number
  ): Promise<InventoryTransaction[]> => {
    try {
      const response = await api.get<InventoryTransaction[]>(
        `/inventory/transactions/product/${productId}`
      )
      return response
    } catch (error) {
      console.error(
        `Lỗi khi lấy giao dịch kho sản phẩm ID ${productId}:`,
        error
      )
      throw error
    }
  },

  // ========== BÁO CÁO VÀ TỔNG HỢP TỒN KHO ==========

  /**
   * Lấy tổng hợp tồn kho theo ID sản phẩm
   */
  getInventorySummary: async (productId: number): Promise<InventorySummary> => {
    try {
      const response = await api.get<InventorySummary>(
        `/inventory/reports/summary/${productId}`
      )
      return response
    } catch (error) {
      console.error(
        `Lỗi khi lấy tổng hợp tồn kho sản phẩm ID ${productId}:`,
        error
      )
      throw error
    }
  },

  /**
   * Lấy báo cáo giá trị tồn kho
   */
  getInventoryValueReport: async (
    productIds?: number[]
  ): Promise<InventoryValueReport[]> => {
    try {
      const response = await api.get<InventoryValueReport[]>(
        "/inventory/reports/value",
        {
          params: productIds ? { productIds } : undefined,
        }
      )
      return response
    } catch (error) {
      console.error("Lỗi khi lấy báo cáo giá trị tồn kho:", error)
      throw error
    }
  },

  /**
   * Lấy cảnh báo tồn kho thấp
   */
  getLowStockAlert: async (
    threshold: number = 10
  ): Promise<LowStockAlert[]> => {
    try {
      const response = await api.get<LowStockAlert[]>(
        "/inventory/reports/low-stock",
        {
          params: { threshold },
        }
      )
      return response
    } catch (error) {
      console.error("Lỗi khi lấy cảnh báo tồn kho thấp:", error)
      throw error
    }
  },

  /**
   * Lấy cảnh báo lô hàng sắp hết hạn
   */
  getExpiringBatchesAlert: async (
    days: number = 30
  ): Promise<ExpiringBatchAlert[]> => {
    try {
      const response = await api.get<ExpiringBatchAlert[]>(
        "/inventory/reports/expiring-batches",
        {
          params: { days },
        }
      )
      return response
    } catch (error) {
      console.error("Lỗi khi lấy cảnh báo lô hàng sắp hết hạn:", error)
      throw error
    }
  },

  /**
   * Tính giá vốn FIFO cho số lượng cụ thể
   */
  calculateFifoCost: async (
    productId: number,
    quantity: number
  ): Promise<FifoCalculation> => {
    try {
      const response = await api.get<FifoCalculation>(
        "/inventory/reports/fifo",
        {
          params: { productId, quantity },
        }
      )
      return response
    } catch (error) {
      console.error(
        `Lỗi khi tính giá vốn FIFO sản phẩm ID ${productId}:`,
        error
      )
      throw error
    }
  },

  /**
   * Lấy thông tin batch tracking
   */
  getBatchTrackingInfo: async (
    productId?: number
  ): Promise<BatchTrackingInfo[]> => {
    try {
      const response = await api.get<BatchTrackingInfo[]>(
        "/inventory/reports/batch-tracking",
        {
          params: productId ? { productId } : undefined,
        }
      )
      return response
    } catch (error) {
      console.error("Lỗi khi lấy thông tin batch tracking:", error)
      throw error
    }
  },

  /**
   * Lấy batch tracking theo sản phẩm
   */
  getBatchTrackingByProduct: async (
    productId: number
  ): Promise<BatchTrackingInfo> => {
    try {
      const response = await api.get<BatchTrackingInfo>(
        `/inventory/reports/batch-tracking/${productId}`
      )
      return response
    } catch (error) {
      console.error(
        `Lỗi khi lấy batch tracking sản phẩm ID ${productId}:`,
        error
      )
      throw error
    }
  },

  /**
   * Lấy giá trị FIFO của sản phẩm
   */
  getFifoValue: async (
    productId: number
  ): Promise<{ fifoValue: number; totalQuantity: number }> => {
    try {
      const response = await api.get<{
        fifoValue: number
        totalQuantity: number
      }>(
        `/inventory/fifo/product/${productId}` as "Bạn chưa khai báo kiểu trả về"
      )
      return response
    } catch (error) {
      console.error(`Lỗi khi lấy giá trị FIFO sản phẩm ID ${productId}:`, error)
      throw error
    }
  },

  /**
   * Lấy giá vốn trung bình gia quyền
   */
  getWeightedAverageCost: async (
    productId: number
  ): Promise<{ averageCost: number; totalQuantity: number }> => {
    try {
      const response = await api.get<{
        averageCost: number
        totalQuantity: number
      }>(
        `/inventory/weighted-average-cost/product/${productId}` as "Bạn chưa khai báo kiểu trả về"
      )
      return response
    } catch (error) {
      console.error(
        `Lỗi khi lấy giá vốn trung bình gia quyền sản phẩm ID ${productId}:`,
        error
      )
      throw error
    }
  },

  /**
   * Tính lại giá vốn trung bình gia quyền
   */
  recalculateWeightedAverageCost: async (
    productId: number
  ): Promise<{ newAverageCost: number; success: boolean }> => {
    try {
      const response = await api.post<{
        newAverageCost: number
        success: boolean
      }>(`/inventory/recalculate-weighted-average/${productId}`)
      return response
    } catch (error) {
      console.error(
        `Lỗi khi tính lại giá vốn trung bình gia quyền sản phẩm ID ${productId}:`,
        error
      )
      throw error
    }
  },
}

export default inventoryService
