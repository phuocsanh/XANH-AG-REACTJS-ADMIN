import React from "react"
import { Routes, Route } from "react-router-dom"
import SalesInvoicesList from "./sales-invoices-list"
import CreateSalesInvoice from "./create"

/**
 * Component chính quản lý routing cho module Sales Invoices
 * Bao gồm các trang: danh sách, tạo hóa đơn
 */
const SalesInvoices: React.FC = () => {
  return (
    <Routes>
      {/* Trang danh sách hóa đơn */}
      <Route index element={<SalesInvoicesList />} />

      {/* Trang tạo hóa đơn mới */}
      <Route path='create' element={<CreateSalesInvoice />} />
    </Routes>
  )
}

export default SalesInvoices
