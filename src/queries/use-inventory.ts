import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "react-toastify"

import {
  CreateInventoryReceiptRequest,
  UpdateInventoryReceiptRequest,
  UpdateInventoryReceiptItemRequest,
  InventoryReceiptListParams,
  InventoryHistoryListParams,
  StockInRequest,
  InventoryReceiptItem,
} from "@/models/inventory.model"
import { inventoryService } from "@/services/inventory.service"
import { queryClient } from "@/provider/app-provider-tanstack"

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
}

// ========== HOOKS CHO PHIẾU NHẬP HÀNG ==========

/**
 * Hook lấy danh sách phiếu nhập hàng
 */
export const useInventoryReceipts = (params?: InventoryReceiptListParams) => {
  return useQuery({
    queryKey: inventoryKeys.receiptsList(params),
    queryFn: () => inventoryService.getInventoryReceipts(params),
  })
}

/**
 * Hook lấy chi tiết phiếu nhập hàng theo ID
 */
export const useInventoryReceipt = (id: number) => {
  return useQuery({
    queryKey: inventoryKeys.receipt(id),
    queryFn: () => inventoryService.getInventoryReceiptById(id),
    enabled: !!id,
  })
}

/**
 * Hook lấy chi tiết phiếu nhập hàng theo mã code
 */
export const useInventoryReceiptByCode = (code: string) => {
  return useQuery({
    queryKey: inventoryKeys.receiptByCode(code),
    queryFn: () => inventoryService.getInventoryReceiptByCode(code),
    enabled: !!code,
  })
}

/**
 * Hook lấy danh sách chi tiết phiếu nhập hàng
 */
export const useInventoryReceiptItems = (receiptId: number) => {
  return useQuery({
    queryKey: inventoryKeys.receiptItems(receiptId),
    queryFn: () => inventoryService.getInventoryReceiptItems(receiptId),
    enabled: !!receiptId,
  })
}

// ========== MUTATIONS CHO PHIẾU NHẬP HÀNG ==========

/**
 * Hook tạo phiếu nhập hàng mới
 */
export const useCreateInventoryReceipt = () => {
  return useMutation({
    mutationFn: (data: CreateInventoryReceiptRequest) =>
      inventoryService.createInventoryReceipt(data),
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
export const useUpdateInventoryReceipt = () => {
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: UpdateInventoryReceiptRequest
    }) => inventoryService.updateInventoryReceipt(id, data),
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
export const useDeleteInventoryReceipt = () => {
  return useMutation({
    mutationFn: (id: number) => inventoryService.deleteInventoryReceipt(id),
    onSuccess: (_, id) => {
      // Xóa khỏi cache
      queryClient.removeQueries({ queryKey: inventoryKeys.receipt(id) })
      queryClient.removeQueries({ queryKey: inventoryKeys.receiptItems(id) })
      // Invalidate danh sách
      queryClient.invalidateQueries({ queryKey: inventoryKeys.receipts() })
      toast.success("Xóa phiếu nhập hàng thành công!")
    },
    onError: (error: Error) => {
      toast.error(`Lỗi khi xóa phiếu nhập hàng: ${error.message}`)
    },
  })
}

// ========== MUTATIONS CHO THAO TÁC PHIẾU NHẬP ==========

/**
 * Hook duyệt phiếu nhập hàng
 */
export const useApproveInventoryReceipt = () => {
  return useMutation({
    mutationFn: (id: number) => inventoryService.approveInventoryReceipt(id),
    onSuccess: (data, id) => {
      // Cập nhật cache
      queryClient.setQueryData(inventoryKeys.receipt(id), data)
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
 * Hook hoàn thành phiếu nhập hàng
 */
export const useCompleteInventoryReceipt = () => {
  return useMutation({
    mutationFn: (id: number) => inventoryService.completeInventoryReceipt(id),
    onSuccess: (data, id) => {
      // Cập nhật cache
      queryClient.setQueryData(inventoryKeys.receipt(id), data)
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
export const useCancelInventoryReceipt = () => {
  return useMutation({
    mutationFn: (id: number) => inventoryService.cancelInventoryReceipt(id),
    onSuccess: (data, id) => {
      // Cập nhật cache
      queryClient.setQueryData(inventoryKeys.receipt(id), data)
      queryClient.invalidateQueries({ queryKey: inventoryKeys.receipts() })
      toast.success("Hủy phiếu nhập hàng thành công!")
      return data
    },
    onError: (error: Error) => {
      toast.error(`Lỗi khi hủy phiếu nhập hàng: ${error.message}`)
    },
  })
}

/**
 * Hook cập nhật chi tiết phiếu nhập hàng
 */
export const useUpdateInventoryReceiptItem = () => {
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: UpdateInventoryReceiptItemRequest
    }) => inventoryService.updateInventoryReceiptItem(id, data),
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
export const useDeleteInventoryReceiptItem = () => {
  return useMutation({
    mutationFn: (id: number) => inventoryService.deleteInventoryReceiptItem(id),
    onSuccess: (_, id) => {
      // Cập nhật cache
      queryClient.setQueryData(
        inventoryKeys.receiptItems(id),
        (oldData: InventoryReceiptItem[] | undefined) =>
          oldData?.filter((item) => item.id !== id) || []
      )
      toast.success("Xóa chi tiết phiếu nhập hàng thành công!")
    },
    onError: (error: Error) => {
      toast.error(`Lỗi khi xóa chi tiết phiếu nhập hàng: ${error.message}`)
    },
  })
}

// ========== HOOKS CHO LỊCH SỬ NHẬP HÀNG ==========

/**
 * Hook lấy lịch sử nhập hàng
 */
export const useInventoryHistory = (params?: InventoryHistoryListParams) => {
  return useQuery({
    queryKey: inventoryKeys.historyList(params),
    queryFn: () => inventoryService.getInventoryHistory(params),
  })
}

/**
 * Hook lấy lịch sử nhập hàng theo sản phẩm
 */
export const useInventoryHistoryByProduct = (
  productId: number,
  params?: InventoryHistoryListParams
) => {
  return useQuery({
    queryKey: inventoryKeys.historyByProduct(productId, params),
    queryFn: () =>
      inventoryService.getInventoryHistoryByProduct(productId, params),
    enabled: !!productId,
  })
}

// ========== HOOKS CHO THỐNG KÊ ==========

/**
 * Hook lấy thống kê nhập hàng
 */
export const useInventoryStats = () => {
  return useQuery({
    queryKey: inventoryKeys.stats(),
    queryFn: () => inventoryService.getInventoryStats(),
  })
}

// ========== MUTATIONS CHO NHẬP KHO ==========

/**
 * Hook nhập kho từ phiếu nhập hàng
 */
export const useStockIn = () => {
  return useMutation({
    mutationFn: (data: StockInRequest) => inventoryService.processStockIn(data),
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
