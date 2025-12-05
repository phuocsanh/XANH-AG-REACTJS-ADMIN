/**
 * API Configuration
 * Quản lý API URLs cho các môi trường khác nhau
 */

// Lấy API URL từ environment variables
// Fallback về localhost nếu không có
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003'

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: `${API_BASE_URL}/auth/login`,
  AUTH_REGISTER: `${API_BASE_URL}/auth/register`,
  AUTH_REFRESH: `${API_BASE_URL}/auth/refresh`,
  AUTH_CHANGE_PASSWORD: `${API_BASE_URL}/auth/change-password`,

  // Users
  USERS: `${API_BASE_URL}/users`,

  // Products
  PRODUCTS: `${API_BASE_URL}/products`,

  // Categories
  CATEGORIES: `${API_BASE_URL}/categories`,

  // Suppliers
  SUPPLIERS: `${API_BASE_URL}/suppliers`,

  // Inventory
  INVENTORY_RECEIPTS: `${API_BASE_URL}/inventory-receipts`,

  // Sales
  SALES_INVOICES: `${API_BASE_URL}/sales-invoices`,
  CUSTOMERS: `${API_BASE_URL}/customers`,
  SEASONS: `${API_BASE_URL}/seasons`,

  // AI Services
  AI_PRODUCT_COMPARISON: `${API_BASE_URL}/ai-product-comparison`,
  AI_PESTICIDES: `${API_BASE_URL}/ai-compatibility-mixing-pesticides`,
}

/**
 * Kiểm tra xem có đang chạy production không
 */
export const isProduction = import.meta.env.PROD

/**
 * Kiểm tra xem có đang chạy development không
 */
export const isDevelopment = import.meta.env.DEV

/**
 * Log API configuration (chỉ trong development)
 */
if (isDevelopment) {
  console.log('🔧 API Configuration:')
  console.log('  - Base URL:', API_BASE_URL)
  console.log('  - Environment:', import.meta.env.MODE)
}
