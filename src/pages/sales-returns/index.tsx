import React from "react"
import { Routes, Route } from "react-router-dom"
import SalesReturnsList from "./sales-returns-list"
import CreateSalesReturn from "./create"

/**
 * Component chính quản lý routing cho module Sales Returns
 * Bao gồm các trang: danh sách, tạo phiếu trả hàng
 */
const SalesReturns: React.FC = () => {
  return (
    <Routes>
      {/* Trang danh sách phiếu trả hàng */}
      <Route index element={<SalesReturnsList />} />

      {/* Trang tạo phiếu trả hàng mới */}
      <Route path='create' element={<CreateSalesReturn />} />
    </Routes>
  )
}

export default SalesReturns
