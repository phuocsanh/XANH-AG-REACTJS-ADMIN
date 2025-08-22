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
  InventoryReceiptItemApiResponse
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
      await api.post("/manage/inventory/stock-in", stockInData)
    } catch (error) {
      console.error("Lỗi khi xử lý nhập kho:", error)
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
  }
}

export default inventoryService