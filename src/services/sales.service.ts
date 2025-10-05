import { Api } from '@/utils/api'

const api = new Api()
import {
  SalesInvoice,
  SalesInvoiceItem,
  CreateSalesInvoiceRequest,
  UpdateSalesInvoiceRequest,
  SalesStats,
  SalesReport,
  TopSellingProduct,
} from '@/models/sales.model'

/**
 * Service xử lý các API liên quan đến quản lý bán hàng
 * Bao gồm quản lý hóa đơn bán hàng, chi tiết hóa đơn và báo cáo bán hàng
 */
export const salesService = {
  // ========== QUẢN LÝ HÓA ĐƠN BÁN HÀNG ==========

  /**
   * Tạo hóa đơn bán hàng mới
   * @param invoiceData - Dữ liệu hóa đơn bán hàng mới
   * @returns Promise chứa thông tin hóa đơn đã tạo
   */
  createInvoice: async (
    invoiceData: CreateSalesInvoiceRequest
  ): Promise<{ data: SalesInvoice }> => {
    try {
      const response = await api.post<SalesInvoice>('/sales/invoices', invoiceData as unknown as Record<string, unknown>)
      return { data: response }
    } catch (error) {
      console.error('Lỗi khi tạo hóa đơn bán hàng:', error)
      throw error
    }
  },

  /**
   * Lấy danh sách tất cả hóa đơn bán hàng
   * @returns Promise chứa danh sách hóa đơn bán hàng
   */
  getAllInvoices: async (): Promise<{ data: SalesInvoice[] }> => {
    try {
      const response = await api.get<SalesInvoice[]>('/sales/invoices')
      return { data: response }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách hóa đơn bán hàng:', error)
      throw error
    }
  },

  /**
   * Lấy thông tin chi tiết hóa đơn bán hàng theo ID
   * @param id - ID của hóa đơn bán hàng
   * @returns Promise chứa thông tin chi tiết hóa đơn
   */
  getInvoiceById: async (id: number): Promise<{ data: SalesInvoice }> => {
    try {
      const response = await api.get<SalesInvoice>(`/sales/invoices/${id}`)
      return { data: response }
    } catch (error) {
      console.error(`Lỗi khi lấy hóa đơn bán hàng ID ${id}:`, error)
      throw error
    }
  },

  /**
   * Lấy thông tin hóa đơn bán hàng theo mã
   * @param code - Mã của hóa đơn bán hàng
   * @returns Promise chứa thông tin hóa đơn
   */
  getInvoiceByCode: async (code: string): Promise<{ data: SalesInvoice }> => {
    try {
      const response = await api.get<SalesInvoice>(`/sales/invoices/code/${code}`)
      return { data: response }
    } catch (error) {
      console.error(`Lỗi khi lấy hóa đơn bán hàng mã ${code}:`, error)
      throw error
    }
  },

  /**
   * Cập nhật thông tin hóa đơn bán hàng
   * @param id - ID của hóa đơn bán hàng cần cập nhật
   * @param invoiceData - Dữ liệu cập nhật hóa đơn
   * @returns Promise chứa thông tin hóa đơn đã cập nhật
   */
  updateInvoice: async (
    id: number,
    invoiceData: UpdateSalesInvoiceRequest
  ): Promise<{ data: SalesInvoice }> => {
    try {
      const response = await api.patch<SalesInvoice>(`/sales/invoices/${id}`, invoiceData as unknown as Record<string, unknown>)
      return { data: response }
    } catch (error) {
      console.error(`Lỗi khi cập nhật hóa đơn bán hàng ID ${id}:`, error)
      throw error
    }
  },

  /**
   * Xóa hóa đơn bán hàng
   * @param id - ID của hóa đơn bán hàng cần xóa
   * @returns Promise chứa kết quả xóa
   */
  deleteInvoice: async (id: number): Promise<{ data: object }> => {
    try {
      const response = await api.delete(`/sales/invoices/${id}`)
      return { data: response }
    } catch (error) {
      console.error(`Lỗi khi xóa hóa đơn bán hàng ID ${id}:`, error)
      throw error
    }
  },

  /**
   * Cập nhật trạng thái thanh toán của hóa đơn
   * @param id - ID của hóa đơn bán hàng
   * @param paymentStatus - Trạng thái thanh toán mới
   * @returns Promise chứa thông tin hóa đơn đã cập nhật
   */
  updatePaymentStatus: async (
    id: number,
    paymentStatus: 'PENDING' | 'PAID' | 'CANCELLED'
  ): Promise<{ data: SalesInvoice }> => {
    try {
      const response = await api.patch<SalesInvoice>(`/sales/invoices/${id}/payment-status`, {
        paymentStatus,
      })
      return { data: response }
    } catch (error) {
      console.error(`Lỗi khi cập nhật trạng thái thanh toán hóa đơn ID ${id}:`, error)
      throw error
    }
  },

  // ========== QUẢN LÝ CHI TIẾT HÓA ĐƠN ==========

  /**
   * Lấy danh sách chi tiết hóa đơn bán hàng
   * @param invoiceId - ID của hóa đơn bán hàng
   * @returns Promise chứa danh sách chi tiết hóa đơn
   */
  getInvoiceItems: async (invoiceId: number): Promise<{ data: SalesInvoiceItem[] }> => {
    try {
      const response = await api.get<SalesInvoiceItem[]>(`/sales/invoices/${invoiceId}/items`)
      return { data: response }
    } catch (error) {
      console.error(`Lỗi khi lấy chi tiết hóa đơn ID ${invoiceId}:`, error)
      throw error
    }
  },

  /**
   * Cập nhật chi tiết hóa đơn bán hàng
   * @param itemId - ID của chi tiết hóa đơn
   * @param itemData - Dữ liệu cập nhật chi tiết hóa đơn
   * @returns Promise chứa thông tin chi tiết hóa đơn đã cập nhật
   */
  updateInvoiceItem: async (
    itemId: number,
    itemData: Partial<SalesInvoiceItem>
  ): Promise<{ data: SalesInvoiceItem }> => {
    try {
      const response = await api.patch<SalesInvoiceItem>(
        `/sales/invoices/items/${itemId}`,
        itemData as unknown as Record<string, unknown>
      )
      return { data: response }
    } catch (error) {
      console.error(`Lỗi khi cập nhật chi tiết hóa đơn ID ${itemId}:`, error)
      throw error
    }
  },

  /**
   * Xóa chi tiết hóa đơn bán hàng
   * @param itemId - ID của chi tiết hóa đơn cần xóa
   * @returns Promise chứa kết quả xóa
   */
  deleteInvoiceItem: async (itemId: number): Promise<{ data: object }> => {
    try {
      const response = await api.delete(`/sales/invoices/items/${itemId}`)
      return { data: response }
    } catch (error) {
      console.error(`Lỗi khi xóa chi tiết hóa đơn ID ${itemId}:`, error)
      throw error
    }
  },

  // ========== THỐNG KÊ VÀ BÁO CÁO ==========

  /**
   * Lấy thống kê bán hàng tổng quan
   * @returns Promise chứa thống kê bán hàng
   */
  getSalesStats: async (): Promise<{ data: SalesStats }> => {
    try {
      const response = await api.get<SalesStats>('/sales/reports/stats')
      return { data: response }
    } catch (error) {
      console.error('Lỗi khi lấy thống kê bán hàng:', error)
      throw error
    }
  },

  /**
   * Lấy thống kê bán hàng chi tiết (phương thức cũ)
   * @returns Promise chứa thống kê bán hàng
   */
  getSalesStatsDetailed: async (): Promise<{ data: SalesStats }> => {
    try {
      // Lấy danh sách hóa đơn để tính toán thống kê
      const invoicesResponse = await api.get<SalesInvoice[]>('/sales/invoices')
      const invoices = invoicesResponse

      const totalInvoices = invoices.length
      const pendingInvoices = invoices.filter((inv: SalesInvoice) => inv.paymentStatus === 'PENDING').length
      const paidInvoices = invoices.filter((inv: SalesInvoice) => inv.paymentStatus === 'PAID').length
      const cancelledInvoices = invoices.filter((inv: SalesInvoice) => inv.paymentStatus === 'CANCELLED').length

      const totalRevenue = invoices
        .filter((inv: SalesInvoice) => inv.paymentStatus === 'PAID')
        .reduce((sum: number, inv: SalesInvoice) => sum + inv.finalAmount, 0)

      const today = new Date().toISOString().split('T')[0]
      const todayRevenue = invoices
        .filter((inv: SalesInvoice) => 
          inv.paymentStatus === 'PAID' && 
          inv.createdAt.split('T')[0] === today
        )
        .reduce((sum: number, inv: SalesInvoice) => sum + inv.finalAmount, 0)

      const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
      const monthRevenue = invoices
        .filter((inv: SalesInvoice) => 
          inv.paymentStatus === 'PAID' && 
          inv.createdAt.slice(0, 7) === currentMonth
        )
        .reduce((sum: number, inv: SalesInvoice) => sum + inv.finalAmount, 0)

      const stats: SalesStats = {
        totalInvoices,
        pendingInvoices,
        paidInvoices,
        cancelledInvoices,
        totalRevenue,
        todayRevenue,
        monthRevenue,
      }

      return { data: stats }
    } catch (error) {
      console.error('Lỗi khi lấy thống kê bán hàng:', error)
      throw error
    }
  },

  /**
   * Lấy báo cáo bán hàng theo ngày
   * @param startDate - Ngày bắt đầu (YYYY-MM-DD)
   * @param endDate - Ngày kết thúc (YYYY-MM-DD)
   * @returns Promise chứa báo cáo bán hàng theo ngày
   */
  getDailySalesReport: async (
    startDate: string,
    endDate: string
  ): Promise<{ data: SalesReport[] }> => {
    try {
      const response = await api.get<SalesReport[]>('/sales/reports/daily', {
        params: {
          startDate,
          endDate
        }
      })
      return { data: response }
    } catch (error) {
      console.error('Lỗi khi lấy báo cáo bán hàng theo ngày:', error)
      throw error
    }
  },

  /**
   * Lấy báo cáo bán hàng theo ngày (phương thức cũ)
   * @param startDate - Ngày bắt đầu (YYYY-MM-DD)
   * @param endDate - Ngày kết thúc (YYYY-MM-DD)
   * @returns Promise chứa báo cáo bán hàng theo ngày
   */
  getDailySalesReportDetailed: async (
    startDate: string,
    endDate: string
  ): Promise<{ data: SalesReport[] }> => {
    try {
      // Lấy danh sách hóa đơn trong khoảng thời gian
      const invoicesResponse = await api.get<SalesInvoice[]>('/sales/invoices')
      const invoices = invoicesResponse.filter((inv: SalesInvoice) => {
        const invoiceDate = inv.createdAt.split('T')[0]
        return invoiceDate >= startDate && invoiceDate <= endDate && inv.paymentStatus === 'PAID'
      })

      // Nhóm theo ngày
      const dailyData: { [date: string]: SalesReport } = {}
      
      invoices.forEach((invoice: SalesInvoice) => {
        const date = invoice.createdAt.split('T')[0]
        if (!dailyData[date]) {
          dailyData[date] = {
            date,
            invoiceCount: 0,
            totalRevenue: 0,
            totalQuantity: 0,
          }
        }
        
        dailyData[date].invoiceCount += 1
        dailyData[date].totalRevenue += invoice.finalAmount
        
        // Tính tổng số lượng sản phẩm
        if (invoice.items) {
          dailyData[date].totalQuantity += invoice.items.reduce(
            (sum: number, item: SalesInvoiceItem) => sum + item.quantity,
            0
          )
        }
      })

      const report = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date))
      return { data: report }
    } catch (error) {
      console.error('Lỗi khi lấy báo cáo bán hàng theo ngày:', error)
      throw error
    }
  },

  /**
   * Lấy danh sách sản phẩm bán chạy
   * @param limit - Số lượng sản phẩm trả về (mặc định 10)
   * @returns Promise chứa danh sách sản phẩm bán chạy
   */
  getTopSellingProducts: async (limit: number = 10): Promise<{ data: TopSellingProduct[] }> => {
    try {
      const response = await api.get<TopSellingProduct[]>('/sales/reports/top-selling', {
        params: {
          limit
        }
      })
      return { data: response }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách sản phẩm bán chạy:', error)
      throw error
    }
  },

  /**
   * Lấy danh sách sản phẩm bán chạy (phương thức cũ)
   * @param limit - Số lượng sản phẩm trả về (mặc định 10)
   * @returns Promise chứa danh sách sản phẩm bán chạy
   */
  getTopSellingProductsDetailed: async (limit: number = 10): Promise<{ data: TopSellingProduct[] }> => {
    try {
      // Lấy danh sách hóa đơn đã thanh toán
      const invoicesResponse = await api.get<SalesInvoice[]>('/sales/invoices')
      const paidInvoices = invoicesResponse.filter((inv: SalesInvoice) => inv.paymentStatus === 'PAID')

      // Tính toán thống kê cho từng sản phẩm
      const productStats: { [productId: number]: TopSellingProduct } = {}

      paidInvoices.forEach((invoice: SalesInvoice) => {
        if (invoice.items) {
          invoice.items.forEach((item: SalesInvoiceItem) => {
            if (!productStats[item.productId]) {
              productStats[item.productId] = {
                productId: item.productId,
                productName: item.product?.name || 'Unknown',
                productCode: item.product?.code || 'Unknown',
                productImage: item.product?.image,
                totalQuantitySold: 0,
                totalRevenue: 0,
                invoiceCount: 0,
              }
            }

            productStats[item.productId].totalQuantitySold += item.quantity
            productStats[item.productId].totalRevenue += item.totalPrice
            productStats[item.productId].invoiceCount += 1
          })
        }
      })

      // Sắp xếp theo số lượng bán và lấy top
      const topProducts = Object.values(productStats)
        .sort((a, b) => b.totalQuantitySold - a.totalQuantitySold)
        .slice(0, limit)

      return { data: topProducts }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách sản phẩm bán chạy:', error)
      throw error
    }
  },
}

export default salesService