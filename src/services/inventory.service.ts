import {
  InventoryReceipt,
  InventoryReceiptItem,
  InventoryHistory,
  InventoryReceiptListResponse,
  InventoryHistoryListResponse,
  CreateInventoryReceiptRequest,
  UpdateInventoryReceiptRequest,
  UpdateInventoryReceiptItemRequest,
  InventoryReceiptListParams,
  InventoryHistoryListParams,
  StockInRequest,
  mapApiResponseToInventoryReceipt,
  mapApiResponseToInventoryReceiptItem,
  mapApiResponseToInventoryHistory,
  InventoryReceiptApiResponse,
  InventoryReceiptItemApiResponse,
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
  ): Promise<{ data: { items: InventoryReceipt[]; total: number }; code: number; message: string }> => {
    try {
      const response = await api.get<InventoryReceiptListResponse>("/manage/inventory/receipts", {
        params
      })
      
      // Map API response to InventoryReceipt model
      const mappedReceipts = response.items.map(mapApiResponseToInventoryReceipt)
      
      return {
        data: {
          items: mappedReceipts,
          total: response.pagination?.total || 0
        },
        code: 200,
        message: "Lấy danh sách phiếu nhập hàng thành công"
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách phiếu nhập hàng:", error)
      throw error
    }
  },

  /**
   * Lấy chi tiết phiếu nhập hàng theo ID
   */
  getInventoryReceiptById: async (id: number): Promise<InventoryReceipt> => {
    try {
      const response = await api.get<InventoryReceiptApiResponse>(`/manage/inventory/receipt/${id}`)
      return mapApiResponseToInventoryReceipt(response)
    } catch (error) {
      console.error(`Lỗi khi lấy phiếu nhập hàng ID ${id}:`, error)
      throw error
    }
  },

  /**
   * Lấy chi tiết phiếu nhập hàng theo mã code
   */
  getInventoryReceiptByCode: async (code: string): Promise<InventoryReceipt> => {
    try {
      const response = await api.get<InventoryReceiptApiResponse>(`/manage/inventory/receipt/code/${code}`)
      return mapApiResponseToInventoryReceipt(response)
    } catch (error) {
      console.error(`Lỗi khi lấy phiếu nhập hàng mã ${code}:`, error)
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
        "/manage/inventory/receipt",
        receipt
      )
      return mapApiResponseToInventoryReceipt(response)
    } catch (error) {
      console.error("Lỗi khi tạo phiếu nhập hàng mới:", error)
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
        `/manage/inventory/receipt/${id}`,
        receipt
      )
      return mapApiResponseToInventoryReceipt(response)
    } catch (error) {
      console.error(`Lỗi khi cập nhật phiếu nhập hàng ID ${id}:`, error)
      throw error
    }
  },

  /**
   * Xóa phiếu nhập hàng
   */
  deleteInventoryReceipt: async (id: number): Promise<void> => {
    try {
      await api.delete(`/manage/inventory/receipt/${id}`)
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
      const response = await api.post<InventoryReceiptApiResponse>(
        `/manage/inventory/receipt/${id}/approve`
      )
      return mapApiResponseToInventoryReceipt(response)
    } catch (error) {
      console.error(`Lỗi khi duyệt phiếu nhập hàng ID ${id}:`, error)
      throw error
    }
  },

  /**
   * Hoàn thành phiếu nhập hàng (nhập kho)
   */
  completeInventoryReceipt: async (id: number): Promise<InventoryReceipt> => {
    try {
      const response = await api.post<InventoryReceiptApiResponse>(
        `/manage/inventory/receipt/${id}/complete`
      )
      return mapApiResponseToInventoryReceipt(response)
    } catch (error) {
      console.error(`Lỗi khi hoàn thành phiếu nhập hàng ID ${id}:`, error)
      throw error
    }
  },

  /**
   * Hủy phiếu nhập hàng
   */
  cancelInventoryReceipt: async (id: number): Promise<InventoryReceipt> => {
    try {
      const response = await api.post<InventoryReceiptApiResponse>(
        `/manage/inventory/receipt/${id}/cancel`
      )
      return mapApiResponseToInventoryReceipt(response)
    } catch (error) {
      console.error(`Lỗi khi hủy phiếu nhập hàng ID ${id}:`, error)
      throw error
    }
  },

  // ========== QUẢN LÝ CHI TIẾT PHIẾU NHẬP ==========

  /**
   * Lấy danh sách chi tiết phiếu nhập hàng
   */
  getInventoryReceiptItems: async (receiptId: number): Promise<InventoryReceiptItem[]> => {
    try {
      const response = await api.get<InventoryReceiptItemApiResponse[]>(
        `/manage/inventory/receipt/${receiptId}/items`
      )
      return response.map(mapApiResponseToInventoryReceiptItem)
    } catch (error) {
      console.error(`Lỗi khi lấy chi tiết phiếu nhập hàng ID ${receiptId}:`, error)
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
        `/manage/inventory/receipt/item/${id}`,
        item as unknown as Record<string, unknown>
      )
      return mapApiResponseToInventoryReceiptItem(response)
    } catch (error) {
      console.error(`Lỗi khi cập nhật chi tiết phiếu nhập ID ${id}:`, error)
      throw error
    }
  },

  /**
   * Xóa chi tiết phiếu nhập hàng
   */
  deleteInventoryReceiptItem: async (id: number): Promise<void> => {
    try {
      await api.delete(`/manage/inventory/receipt/item/${id}`)
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
      await api.post("/manage/inventory/stock-in", stockInData as unknown as Record<string, unknown>)
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
      await api.post("/manage/inventory/stock-out", stockOutData as unknown as Record<string, unknown>)
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
  ): Promise<{ data: { items: InventoryHistory[]; total: number }; code: number; message: string }> => {
    try {
      const response = await api.get<InventoryHistoryListResponse>("/manage/inventory/product-history", {
        params
      })
      
      // Map API response to InventoryHistory model
      const mappedHistory = response.items.map(mapApiResponseToInventoryHistory)
      
      return {
        data: {
          items: mappedHistory,
          total: response.pagination?.total || 0
        },
        code: 200,
        message: "Lấy lịch sử tồn kho thành công"
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
    params?: Omit<InventoryHistoryListParams, 'productId'>
  ): Promise<{ data: { items: InventoryHistory[]; total: number }; code: number; message: string }> => {
    try {
      const response = await api.get<InventoryHistoryListResponse>(
        `/manage/inventory/product-history/${productId}`,
        { params }
      )
      
      // Map API response to InventoryHistory model
      const mappedHistory = response.items.map(mapApiResponseToInventoryHistory)
      
      return {
        data: {
          items: mappedHistory,
          total: response.pagination?.total || 0
        },
        code: 200,
        message: "Lấy lịch sử tồn kho theo sản phẩm thành công"
      }
    } catch (error) {
      console.error(`Lỗi khi lấy lịch sử tồn kho sản phẩm ID ${productId}:`, error)
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
      const receiptsResponse = await api.get<InventoryReceiptListResponse>("/manage/inventory/receipts")
      
      const receipts = receiptsResponse.items
      const totalReceipts = receipts.length
      const pendingReceipts = receipts.filter(r => r.status === 1).length // PENDING
      const completedReceipts = receipts.filter(r => r.status === 3).length // COMPLETED
      
      // Tính tổng giá trị (chỉ các phiếu đã hoàn thành)
      const totalValue = receipts
        .filter(r => r.status === 3)
        .reduce((sum, r) => sum + parseFloat(r.totalAmount || '0'), 0)
        .toString()

      return {
        totalReceipts,
        pendingReceipts,
        completedReceipts,
        totalValue
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
  createBatch: async (batchData: CreateInventoryBatchRequest): Promise<InventoryBatch> => {
    try {
      const response = await api.post<InventoryBatch>("/inventory/batches", batchData as unknown as Record<string, unknown>)
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
      const response = await api.get<InventoryBatch[]>(`/inventory/batches/product/${productId}`)
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
  updateBatch: async (id: number, batchData: Partial<CreateInventoryBatchRequest>): Promise<InventoryBatch> => {
    try {
      const response = await api.patch<InventoryBatch>(`/inventory/batches/${id}`, batchData as unknown as Record<string, unknown>)
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
  createTransaction: async (transactionData: CreateInventoryTransactionRequest): Promise<InventoryTransaction> => {
    try {
      const response = await api.post<InventoryTransaction>("/inventory/transactions", transactionData as unknown as Record<string, unknown>)
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
      const response = await api.get<InventoryTransaction[]>("/inventory/transactions")
      return response
    } catch (error) {
      console.error("Lỗi khi lấy danh sách giao dịch kho:", error)
      throw error
    }
  },

  /**
   * Lấy giao dịch kho theo ID sản phẩm
   */
  getTransactionsByProduct: async (productId: number): Promise<InventoryTransaction[]> => {
    try {
      const response = await api.get<InventoryTransaction[]>(`/inventory/transactions/product/${productId}`)
      return response
    } catch (error) {
      console.error(`Lỗi khi lấy giao dịch kho sản phẩm ID ${productId}:`, error)
      throw error
    }
  },

  // ========== BÁO CÁO VÀ TỔNG HỢP TỒN KHO ==========

  /**
   * Lấy tổng hợp tồn kho theo ID sản phẩm
   */
  getInventorySummary: async (productId: number): Promise<InventorySummary> => {
    try {
      const response = await api.get<InventorySummary>(`/inventory/summary/product/${productId}`)
      return response
    } catch (error) {
      console.error(`Lỗi khi lấy tổng hợp tồn kho sản phẩm ID ${productId}:`, error)
      throw error
    }
  },

  /**
   * Lấy báo cáo giá trị tồn kho
   */
  getInventoryValueReport: async (productIds?: number[]): Promise<InventoryValueReport[]> => {
    try {
      const params = productIds ? `?productIds=${productIds.join(',')}` : ''
      const response = await api.get<InventoryValueReport[]>(`/inventory/value-report${params}`)
      return response
    } catch (error) {
      console.error("Lỗi khi lấy báo cáo giá trị tồn kho:", error)
      throw error
    }
  },

  /**
   * Lấy cảnh báo tồn kho thấp
   */
  getLowStockAlert: async (threshold: number = 10): Promise<LowStockAlert[]> => {
    try {
      const response = await api.get<LowStockAlert[]>(`/inventory/low-stock-alert?threshold=${threshold}`)
      return response
    } catch (error) {
      console.error("Lỗi khi lấy cảnh báo tồn kho thấp:", error)
      throw error
    }
  },

  /**
   * Lấy cảnh báo lô hàng sắp hết hạn
   */
  getExpiringBatchesAlert: async (days: number = 30): Promise<ExpiringBatchAlert[]> => {
    try {
      const response = await api.get<ExpiringBatchAlert[]>(`/inventory/expiring-batches-alert?days=${days}`)
      return response
    } catch (error) {
      console.error("Lỗi khi lấy cảnh báo lô hàng sắp hết hạn:", error)
      throw error
    }
  },

  /**
   * Tính giá vốn FIFO cho số lượng cụ thể
   */
  calculateFifoCost: async (productId: number, quantity: number): Promise<FifoCalculation> => {
    try {
      const response = await api.get<FifoCalculation>(`/inventory/fifo-cost/product/${productId}?quantity=${quantity}`)
      return response
    } catch (error) {
      console.error(`Lỗi khi tính giá vốn FIFO sản phẩm ID ${productId}:`, error)
      throw error
    }
  },

  /**
   * Lấy thông tin batch tracking
   */
  getBatchTrackingInfo: async (productId?: number): Promise<BatchTrackingInfo[]> => {
    try {
      const params = productId ? `?productId=${productId}` : ''
      const response = await api.get<BatchTrackingInfo[]>(`/inventory/batch-tracking${params}`)
      return response
    } catch (error) {
      console.error("Lỗi khi lấy thông tin batch tracking:", error)
      throw error
    }
  },

  /**
   * Lấy batch tracking theo sản phẩm
   */
  getBatchTrackingByProduct: async (productId: number): Promise<BatchTrackingInfo> => {
    try {
      const response = await api.get<BatchTrackingInfo>(`/inventory/batch-tracking/product/${productId}`)
      return response
    } catch (error) {
      console.error(`Lỗi khi lấy batch tracking sản phẩm ID ${productId}:`, error)
      throw error
    }
  },

  /**
   * Lấy giá trị FIFO của sản phẩm
   */
  getFifoValue: async (productId: number): Promise<{ fifoValue: number; totalQuantity: number }> => {
    try {
      const response = await api.get<{ fifoValue: number; totalQuantity: number }>(`/inventory/fifo/product/${productId}` as "Bạn chưa khai báo kiểu trả về")
      return response
    } catch (error) {
      console.error(`Lỗi khi lấy giá trị FIFO sản phẩm ID ${productId}:`, error)
      throw error
    }
  },

  /**
   * Lấy giá vốn trung bình gia quyền
   */
  getWeightedAverageCost: async (productId: number): Promise<{ averageCost: number; totalQuantity: number }> => {
    try {
      const response = await api.get<{ averageCost: number; totalQuantity: number }>(`/inventory/weighted-average-cost/product/${productId}` as "Bạn chưa khai báo kiểu trả về")
      return response
    } catch (error) {
      console.error(`Lỗi khi lấy giá vốn trung bình gia quyền sản phẩm ID ${productId}:`, error)
      throw error
    }
  },

  /**
   * Tính lại giá vốn trung bình gia quyền
   */
  recalculateWeightedAverageCost: async (productId: number): Promise<{ newAverageCost: number; success: boolean }> => {
    try {
      const response = await api.post<{ newAverageCost: number; success: boolean }>(`/inventory/recalculate-weighted-average/${productId}`)
      return response
    } catch (error) {
      console.error(`Lỗi khi tính lại giá vốn trung bình gia quyền sản phẩm ID ${productId}:`, error)
      throw error
    }
  }
}

export default inventoryService